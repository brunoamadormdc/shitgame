import { GAME_CONFIG } from "../config/gameConfig.js"
import { Player } from "../entities/player.js"
import { MonsterManager } from "../entities/monsterManager.js"
import { GameState, GAME_STATES } from "./gameState.js"
import { loadSettings, saveSettings } from "./settingsStore.js"
import { Hud } from "../ui/hud.js"
import { Messages } from "../ui/messages.js"
import { SettingsPanel } from "../ui/settingsPanel.js"

export class Game {
    constructor(document) {
        this.document = document
        this.config = GAME_CONFIG
        this.state = new GameState(this.config)
        this.settings = loadSettings()
        this.isTouchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
        this.body = this.document.querySelector('body')
        this.viewport = this.document.createElement('div')
        this.viewport.classList.add('__worldViewport')
        this.container = this.document.createElement('div')
        this.container.classList.add('container')
        this.safeZone = this.document.createElement('div')
        this.safeZone.classList.add('__safeZone')
        this.finishLine = this.document.createElement('div')
        this.finishLine.classList.add('__finishLine')
        this.finishLine.textContent = this.config.finishLine.label
        this.finishLineState = this.createFinishLineState()
        this.worldSize = {
            width: window.innerWidth,
            height: window.innerHeight
        }
        this.camera = {
            x: 0,
            y: 0
        }

        this.player = new Player(this.document, this.config)
        this.hud = new Hud(this.document)
        this.messages = new Messages(this.document)
        this.settingsPanel = new SettingsPanel(this.document, {
            onChange: (settings) => this.handleSettingsChange(settings),
            onStart: () => this.startGame()
        })
        this.monsters = new MonsterManager({
            document: this.document,
            container: this.container,
            config: this.config,
            onVillainCollision: () => this.handleVillainCollision(),
            onBonusCollision: () => this.handleBonusCollision(),
            onStarCollision: () => this.handleStarCollision(),
            onHeartCollision: () => this.handleHeartCollision(),
            onNearMiss: () => this.handleNearMiss()
        })
        this.movementKeyState = {
            KeyD: false,
            KeyA: false,
            KeyW: false,
            KeyS: false
        }
        this.aimKeyState = {
            ArrowRight: false,
            ArrowLeft: false,
            ArrowUp: false,
            ArrowDown: false
        }
        this.frameId = null
        this.lastFrameTime = 0
        this.dramaticBeatMs = 0
        this.comboCount = 0
        this.comboTimerMs = 0
        this.gamepadInfo = {
            connected: false,
            label: 'Nenhum joystick detectado'
        }
        this.previousGamepadButtons = {
            start: false,
            attack: false,
            speedUp: false,
            speedDown: false
        }

        this.handleResize = this.handleResize.bind(this)
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleKeyUp = this.handleKeyUp.bind(this)
        this.handleGamepadConnection = this.handleGamepadConnection.bind(this)
        this.gameLoop = this.gameLoop.bind(this)
    }

    mount() {
        this.body.append(this.viewport)
        this.viewport.append(this.container)
        this.container.append(this.safeZone, this.finishLine)
        this.hud.mount()
        this.player.mount(this.container)
        this.settingsPanel.mount()

        this.updateWorldSize()
        this.calculateFinishLine()
        this.refreshGamepadInfo()
        this.renderHud()
        this.enterIdle()

        window.addEventListener('resize', this.handleResize)
        window.addEventListener('gamepadconnected', this.handleGamepadConnection)
        window.addEventListener('gamepaddisconnected', this.handleGamepadConnection)
        document.addEventListener('keydown', this.handleKeyDown)
        document.addEventListener('keyup', this.handleKeyUp)
        this.frameId = window.requestAnimationFrame(this.gameLoop)
    }

    handleResize() {
        const wasPlaying = this.state.canPlay()
        this.updateWorldSize()
        this.player.updateDimensions()
        this.player.clampToWorld(this.worldSize.width, this.worldSize.height)
        this.player.render()
        this.monsters.resetBaseSize()

        if (this.state.levelPrepared) {
            this.monsters.spawnLevel(this.state.currentLevelConfig)
            this.placeFinishLineRandomly()
        }

        if (wasPlaying) {
            this.state.startPlaying()
        }
    }

    handleKeyDown(e) {
        if (
            e.code in this.movementKeyState ||
            e.code in this.aimKeyState ||
            e.code === 'NumpadAdd' ||
            e.code === 'NumpadSubtract' ||
            e.code === 'Space'
        ) {
            e.preventDefault()
        }

        if (e.key === 'Enter') {
            this.handlePauseInput()
            return
        }

        if (e.code === 'Space') {
            if (!e.repeat) {
                this.fireCurrentAim()
            }
            return
        }

        if (e.code === 'NumpadAdd') {
            this.state.adjustMovePower(this.config.player.movePowerStep)
            return
        }

        if (e.code === 'NumpadSubtract') {
            this.state.adjustMovePower(-this.config.player.movePowerStep)
            return
        }

        if (e.code in this.movementKeyState) {
            this.movementKeyState[e.code] = true
        }

        if (e.code in this.aimKeyState) {
            this.aimKeyState[e.code] = true
        }
    }

    handleKeyUp(e) {
        if (e.code in this.movementKeyState) {
            e.preventDefault()
            this.movementKeyState[e.code] = false
        }

        if (e.code in this.aimKeyState) {
            e.preventDefault()
            this.aimKeyState[e.code] = false
        }
    }

    startGame() {
        if (this.state.shouldStartFreshGame()) {
            this.state.resetForNewGame()
            this.renderHud()
        }

        if (!this.state.levelPrepared) {
            this.prepareCurrentLevel()
        }

        this.state.startPlaying()
        this.messages.hide()
        this.settingsPanel.hide()
    }

    enterIdle() {
        this.state.status = GAME_STATES.IDLE
        this.state.setMessage(this.config.messages.start)
        this.state.setSafe(true)
        this.resetInputState()
        this.player.resetPosition()
        this.player.setSafe(true)
        this.messages.show(this.getOverlayContent())
        this.settingsPanel.show({
            settings: this.settings,
            gamepadStatus: this.gamepadInfo.label,
            startLabel: 'Começar'
        })
    }

    showOverlay(message) {
        this.state.setMessage(message)
        this.state.setSafe(true)
        this.resetInputState()
        this.player.resetPosition()
        this.player.setSafe(true)
        this.messages.show(this.getOverlayContent())

        if (this.state.status === GAME_STATES.GAME_OVER) {
            this.settingsPanel.show({
                settings: this.settings,
                gamepadStatus: this.gamepadInfo.label,
                startLabel: 'Reiniciar'
            })
            return
        }

        this.settingsPanel.hide()
    }

    prepareCurrentLevel() {
        const spawnHeartPickup = this.state.shouldSpawnHeartPickup()

        this.monsters.spawnLevel(this.state.currentLevelConfig, { spawnHeartPickup })
        if (spawnHeartPickup) {
            this.state.consumeHeartPickupWindow()
        }
        this.placeFinishLineRandomly()
        this.state.markLevelPrepared(true)
        this.calculateFinishLine()
    }

    syncPlayerState() {
        const isSafe = this.player.isInsideSafeZone()

        this.state.setSafe(isSafe)
        this.player.setSafe(isSafe)
        this.player.setInvincible(this.state.isInvincible())
    }

    gameLoop(timestamp) {
        const rawDelta = this.lastFrameTime === 0 ? this.config.loop.frameDurationMs : timestamp - this.lastFrameTime
        const cappedDelta = Math.min(rawDelta, this.config.loop.maxDeltaMs)
        this.lastFrameTime = timestamp
        const gamepadSnapshot = this.pollGamepad()
        const deltaTime = this.getScaledDelta(cappedDelta)

        if (gamepadSnapshot.startPressed) {
            this.handlePauseInput()
        }

        if (this.state.canPlay()) {
            this.update(deltaTime, gamepadSnapshot)
        }

        this.render()
        this.frameId = window.requestAnimationFrame(this.gameLoop)
    }

    update(deltaTime, gamepadSnapshot) {
        const deltaSeconds = deltaTime / 1000
        const movementAmount = this.state.movePower * deltaSeconds
        const movementVector = this.getMovementVector(gamepadSnapshot)
        const aimVector = this.getAimVector(gamepadSnapshot)

        this.state.tickInvincibility(deltaTime)
        this.comboTimerMs = Math.max(0, this.comboTimerMs - deltaTime)

        if (this.comboTimerMs === 0) {
            this.comboCount = 0
        }

        if (gamepadSnapshot.speedUpPressed) {
            this.state.adjustMovePower(this.config.player.movePowerStep)
            this.renderHud()
        }

        if (gamepadSnapshot.speedDownPressed) {
            this.state.adjustMovePower(-this.config.player.movePowerStep)
            this.renderHud()
        }

        this.player.moveByVector(movementVector.x, movementVector.y, movementAmount)
        this.player.clampToWorld(this.worldSize.width, this.worldSize.height)
        this.player.setAimDirection(aimVector.x, aimVector.y)
        this.syncPlayerState()
        this.updateFinishLine(deltaSeconds)
        this.monsters.update(
            this.player.getPosition(),
            this.state.safed,
            this.state.isInvincible(),
            deltaSeconds
        )

        if (gamepadSnapshot.attackPressed) {
            this.fireCurrentAim()
        }

        this.checkFinishLine()
    }

    render() {
        this.player.render()
        this.renderFinishLine()
        this.renderCamera()
    }

    checkFinishLine() {
        const playerPosition = this.player.getPosition()
        const playerCenterX = playerPosition.x + playerPosition.width / 2
        const playerCenterY = playerPosition.y + playerPosition.height / 2
        const finishLineCenterX = this.finishLineState.x + this.finishLineState.width / 2
        const finishLineCenterY = this.finishLineState.y + this.finishLineState.height / 2
        const distance = Math.hypot(playerCenterX - finishLineCenterX, playerCenterY - finishLineCenterY)

        if (distance > playerPosition.collisionRadius + this.finishLineState.collisionRadius) {
            return null
        }

        const result = this.state.completeLevel()

        this.startDramaticBeat(this.config.fx.levelUpBeatMs)
        this.prepareCurrentLevel()
        this.renderHud()
        this.triggerFeedback('levelup')
        this.showMomentToast('LEVEL CLEAR')
        this.showOverlay(this.state.message)
        return result
    }

    handleBonusCollision() {
        this.state.gainHammers(this.config.monsters.bonusHammerAmount)
        this.renderHud()
    }

    handleStarCollision() {
        this.state.activateInvincibility(this.config.player.invincibilityDurationMs)
        this.player.setInvincible(true)
        this.showMomentToast('STAR MODE')
    }

    handleHeartCollision() {
        this.state.gainLife(1)
        this.renderHud()
        this.showMomentToast('+1 LIFE')
    }

    handleNearMiss() {
        this.showMomentToast('NEAR MISS')
    }

    handleVillainCollision() {
        const reachedLevel = this.state.points
        const remainingLives = this.state.loseLife()

        if (remainingLives <= 0) {
            this.monsters.removeAll()
            this.state.setGameOver(reachedLevel)
            this.renderHud()
            this.triggerFeedback('gameover')
            this.showOverlay(this.state.message)
            return
        }

        this.state.restartCurrentLevel(this.config.messages.collision)
        this.prepareCurrentLevel()
        this.renderHud()
        this.triggerFeedback('collision')
        this.showOverlay(this.state.message)
    }

    handlePauseInput() {
        if (this.state.canPlay()) {
            this.pauseGame()
            return
        }

        if (this.state.isManualPaused()) {
            this.resumeGame()
            return
        }

        this.startGame()
    }

    pauseGame() {
        this.state.pause('Jogo pausado. Pressione Enter ou Start para continuar.', 'manual')
        this.resetInputState()
        this.messages.show({
            variant: 'warning',
            eyebrow: 'Paused',
            title: 'Pausa',
            description: 'A nave ficou em espera. O mapa e os inimigos estão congelados.',
            hint: 'Pressione Enter ou Start para despausar.'
        })
    }

    resumeGame() {
        this.state.startPlaying()
        this.messages.hide()
    }

    resetInputState() {
        for (const key in this.movementKeyState) {
            this.movementKeyState[key] = false
        }

        for (const key in this.aimKeyState) {
            this.aimKeyState[key] = false
        }
    }

    handleSettingsChange(settings) {
        this.settings = settings
        saveSettings(settings)
    }

    handleGamepadConnection() {
        this.refreshGamepadInfo()
    }

    refreshGamepadInfo() {
        const gamepad = this.getConnectedGamepad()

        if (!gamepad) {
            this.gamepadInfo = {
                connected: false,
                label: 'Joystick: não detectado'
            }
            this.settingsPanel.updateGamepadStatus(this.gamepadInfo.label)
            return
        }

        this.gamepadInfo = {
            connected: true,
            label: `Joystick: ${gamepad.id}`
        }
        this.settingsPanel.updateGamepadStatus(this.gamepadInfo.label)
    }

    getConnectedGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : []

        for (const gamepad of gamepads) {
            if (gamepad && gamepad.connected) {
                return gamepad
            }
        }

        return null
    }

    shouldUseGamepad() {
        if (this.settings.inputMode === 'keyboard') {
            return false
        }

        if (this.settings.inputMode === 'gamepad') {
            return this.gamepadInfo.connected
        }

        return this.gamepadInfo.connected
    }

    pollGamepad() {
        this.refreshGamepadInfo()

        if (!this.shouldUseGamepad()) {
            this.previousGamepadButtons.start = false
            this.previousGamepadButtons.attack = false
            this.previousGamepadButtons.speedUp = false
            this.previousGamepadButtons.speedDown = false
            return {
                x: 0,
                y: 0,
                aimX: 0,
                aimY: 0,
                startPressed: false,
                attackPressed: false,
                speedUpPressed: false,
                speedDownPressed: false
            }
        }

        const gamepad = this.getConnectedGamepad()

        if (!gamepad) {
            return {
                x: 0,
                y: 0,
                aimX: 0,
                aimY: 0,
                startPressed: false,
                attackPressed: false,
                speedUpPressed: false,
                speedDownPressed: false
            }
        }

        const deadzone = this.settings.gamepadDeadzone
        let x = this.applyDeadzone(gamepad.axes[0] ?? 0, deadzone)
        let y = this.applyDeadzone(gamepad.axes[1] ?? 0, deadzone)
        const aimX = this.applyDeadzone(gamepad.axes[2] ?? 0, deadzone)
        const aimY = this.applyDeadzone(gamepad.axes[3] ?? 0, deadzone)

        if (gamepad.buttons[14]?.pressed) x = -1
        if (gamepad.buttons[15]?.pressed) x = 1
        if (gamepad.buttons[12]?.pressed) y = -1
        if (gamepad.buttons[13]?.pressed) y = 1

        const startDown = Boolean(gamepad.buttons[9]?.pressed)
        const attackDown = Boolean(gamepad.buttons[7]?.pressed)
        const speedUpDown = Boolean(gamepad.buttons[5]?.pressed)
        const speedDownDown = Boolean(gamepad.buttons[4]?.pressed)
        const startPressed = startDown && !this.previousGamepadButtons.start
        const attackPressed = this.state.canPlay() && attackDown && !this.previousGamepadButtons.attack
        const speedUpPressed = this.state.canPlay() && speedUpDown && !this.previousGamepadButtons.speedUp
        const speedDownPressed = this.state.canPlay() && speedDownDown && !this.previousGamepadButtons.speedDown

        this.previousGamepadButtons.start = startDown
        this.previousGamepadButtons.attack = attackDown
        this.previousGamepadButtons.speedUp = speedUpDown
        this.previousGamepadButtons.speedDown = speedDownDown

        return { x, y, aimX, aimY, startPressed, attackPressed, speedUpPressed, speedDownPressed }
    }

    applyDeadzone(value, deadzone) {
        if (Math.abs(value) < deadzone) {
            return 0
        }

        return value
    }

    getMovementVector(gamepadSnapshot) {
        const keyboardX = Number(this.movementKeyState.KeyD) - Number(this.movementKeyState.KeyA)
        const keyboardY = Number(this.movementKeyState.KeyS) - Number(this.movementKeyState.KeyW)
        let x = keyboardX
        let y = keyboardY

        if (this.shouldUseGamepad()) {
            x += gamepadSnapshot.x
            y += gamepadSnapshot.y
        }

        const magnitude = Math.hypot(x, y)

        if (magnitude > 1) {
            x /= magnitude
            y /= magnitude
        }

        return { x, y }
    }

    getAimVector(gamepadSnapshot) {
        let x = Number(this.aimKeyState.ArrowRight) - Number(this.aimKeyState.ArrowLeft)
        let y = Number(this.aimKeyState.ArrowDown) - Number(this.aimKeyState.ArrowUp)

        if (this.shouldUseGamepad() && (gamepadSnapshot.aimX !== 0 || gamepadSnapshot.aimY !== 0)) {
            x = gamepadSnapshot.aimX
            y = gamepadSnapshot.aimY
        }

        const magnitude = Math.hypot(x, y)

        if (magnitude === 0) {
            return {
                x: Math.cos(this.player.aimAngle),
                y: Math.sin(this.player.aimAngle)
            }
        }

        return {
            x: x / magnitude,
            y: y / magnitude
        }
    }

    fireCurrentAim() {
        if (!this.state.canPlay() || this.state.hammers <= 0) {
            return false
        }

        const origin = this.getPlayerCenter()
        const direction = {
            x: Math.cos(this.player.aimAngle),
            y: Math.sin(this.player.aimAngle)
        }
        const maxDistance = Math.hypot(this.worldSize.width, this.worldSize.height)
        const hit = this.monsters.getFirstVillainOnRay(origin, direction, maxDistance)
        const endPoint = hit?.point ?? {
            x: origin.x + direction.x * maxDistance,
            y: origin.y + direction.y * maxDistance
        }

        this.state.spendHammer()
        this.spawnBeam(origin, endPoint)

        if (!hit) {
            this.renderHud()
            return false
        }

        const result = this.monsters.applyDamage(hit.monster)
        this.awardShotScore(result)

        if (result.destroyed) {
            this.registerDestroyedPlanet()
            this.spawnImpactBurst(endPoint)
            if ((hit.monster.maxHitPoints ?? 1) > 1) {
                this.startDramaticBeat(this.config.fx.dramaticBeatMs)
                this.showMomentToast('PLANET DOWN')
            }
            window.setTimeout(() => {
                this.monsters.finalizeDestroyedMonster(hit.monster)
            }, this.config.monsters.destroyDelayMs)
        }

        this.renderHud()
        return true
    }

    awardShotScore(result) {
        const baseScore = 10
        const levelMultiplier = this.state.currentLevel
        const projectedCombo = result?.destroyed ? this.comboCount + 1 : this.comboCount
        const comboMultiplier = projectedCombo >= 5 ? projectedCombo : 1
        const awardedScore = baseScore * levelMultiplier * comboMultiplier

        this.state.gainScore(awardedScore)
    }

    registerDestroyedPlanet() {
        this.comboCount += 1
        this.comboTimerMs = this.config.fx.comboWindowMs

        if (this.comboCount >= 2) {
            this.showMomentToast(`COMBO x${this.comboCount}`)
            this.startDramaticBeat(this.config.fx.dramaticBeatMs)
        }
    }

    getPlayerCenter() {
        const position = this.player.getPosition()

        return {
            x: position.x + position.width / 2,
            y: position.y + position.height / 2
        }
    }

    spawnBeam(from, to) {
        const beam = this.document.createElement('div')
        const deltaX = to.x - from.x
        const deltaY = to.y - from.y
        const length = Math.hypot(deltaX, deltaY)
        const angle = Math.atan2(deltaY, deltaX)

        beam.className = '__laserBeam'
        beam.style.left = `${from.x}px`
        beam.style.top = `${from.y}px`
        beam.style.width = `${length}px`
        beam.style.transform = `translateY(-50%) rotate(${angle}rad)`
        this.container.append(beam)

        window.setTimeout(() => {
            if (beam.isConnected) {
                beam.remove()
            }
        }, this.config.monsters.beamDurationMs)
    }

    spawnImpactBurst(position) {
        const burst = this.document.createElement('div')

        burst.className = '__impactBurst'
        burst.style.left = `${position.x}px`
        burst.style.top = `${position.y}px`
        this.container.append(burst)

        window.setTimeout(() => {
            if (burst.isConnected) {
                burst.remove()
            }
        }, this.config.fx.impactBurstDurationMs)
    }

    showMomentToast(label) {
        let toast = this.document.querySelector('.__momentToast')

        if (!toast) {
            toast = this.document.createElement('div')
            toast.className = '__momentToast'
            this.body.append(toast)
        }

        toast.textContent = label
        toast.classList.remove('__active')
        void toast.offsetWidth
        toast.classList.add('__active')

        window.setTimeout(() => {
            if (toast.textContent === label) {
                toast.classList.remove('__active')
            }
        }, this.config.fx.momentToastDurationMs)
    }

    startDramaticBeat(durationMs) {
        this.dramaticBeatMs = Math.max(this.dramaticBeatMs, durationMs)
    }

    getScaledDelta(deltaTime) {
        if (this.dramaticBeatMs <= 0) {
            return deltaTime
        }

        this.dramaticBeatMs = Math.max(0, this.dramaticBeatMs - deltaTime)
        return deltaTime * this.config.loop.dramaticTimeScale
    }

    updateWorldSize() {
        this.worldSize = {
            width: Math.max(
                this.config.world.minWidth,
                Math.round(window.innerWidth * this.config.world.widthMultiplier)
            ),
            height: Math.max(
                this.config.world.minHeight,
                Math.round(window.innerHeight * this.config.world.heightMultiplier)
            )
        }
        this.container.style.width = `${this.worldSize.width}px`
        this.container.style.height = `${this.worldSize.height}px`
        this.monsters.setWorldSize(this.worldSize)
        this.calculateFinishLine()
        this.updateCamera()
    }

    calculateFinishLine() {
        const size = this.config.finishLine.size

        this.finishLineState.width = size
        this.finishLineState.height = size
        this.finishLineState.collisionRadius = size * this.config.finishLine.collisionRadiusMultiplier
        this.finishLine.style.width = `${size}px`
        this.finishLine.style.height = `${size}px`
        this.clampFinishLineToWorld()
        this.renderFinishLine()
    }

    createFinishLineState() {
        const size = this.config.finishLine.size
        const velocity = this.createFinishLineVelocity()

        return {
            x: 0,
            y: 0,
            width: size,
            height: size,
            collisionRadius: size * this.config.finishLine.collisionRadiusMultiplier,
            velocityX: velocity.x,
            velocityY: velocity.y,
            directionTimerMs: randomInteger(
                this.config.finishLine.directionChangeMinMs,
                this.config.finishLine.directionChangeMaxMs
            )
        }
    }

    placeFinishLineRandomly() {
        const padding = this.config.finishLine.spawnPadding
        const safeLimit = this.config.safeZone.size + padding
        const minX = Math.min(padding, Math.max(0, this.worldSize.width - this.finishLineState.width))
        const minY = Math.min(padding, Math.max(0, this.worldSize.height - this.finishLineState.height))
        const maxX = Math.max(minX, this.worldSize.width - this.finishLineState.width - padding)
        const maxY = Math.max(minY, this.worldSize.height - this.finishLineState.height - padding)
        const viewportLeft = this.camera.x
        const viewportTop = this.camera.y
        const viewportRight = viewportLeft + window.innerWidth
        const viewportBottom = viewportTop + window.innerHeight
        let x = 0
        let y = 0

        for (let attempt = 0; attempt < 24; attempt++) {
            x = randomInteger(minX, maxX + 1)
            y = randomInteger(minY, maxY + 1)

            const isOutsideViewport =
                x + this.finishLineState.width < viewportLeft ||
                x > viewportRight ||
                y + this.finishLineState.height < viewportTop ||
                y > viewportBottom

            if ((x > safeLimit || y > safeLimit) && isOutsideViewport) {
                break
            }
        }

        this.finishLineState.x = x
        this.finishLineState.y = y
        this.finishLineState.directionTimerMs = randomInteger(
            this.config.finishLine.directionChangeMinMs,
            this.config.finishLine.directionChangeMaxMs
        )
        const velocity = this.createFinishLineVelocity()
        this.finishLineState.velocityX = velocity.x
        this.finishLineState.velocityY = velocity.y
        this.renderFinishLine()
    }

    updateFinishLine(deltaSeconds) {
        this.finishLineState.directionTimerMs -= deltaSeconds * 1000

        if (this.finishLineState.directionTimerMs <= 0) {
            this.randomizeFinishLineDirection()
        }

        this.applyFinishLineEscape()

        let nextX = this.finishLineState.x + this.finishLineState.velocityX * deltaSeconds
        let nextY = this.finishLineState.y + this.finishLineState.velocityY * deltaSeconds
        const maxX = Math.max(0, this.worldSize.width - this.finishLineState.width)
        const maxY = Math.max(0, this.worldSize.height - this.finishLineState.height)

        if (nextX <= 0 || nextX >= maxX) {
            this.finishLineState.velocityX *= -1
            nextX = Math.min(Math.max(0, nextX), maxX)
            this.addFinishLineDirectionJitter()
        }

        if (nextY <= 0 || nextY >= maxY) {
            this.finishLineState.velocityY *= -1
            nextY = Math.min(Math.max(0, nextY), maxY)
            this.addFinishLineDirectionJitter()
        }

        this.finishLineState.x = nextX
        this.finishLineState.y = nextY
    }

    applyFinishLineEscape() {
        const finishLineCenterX = this.finishLineState.x + this.finishLineState.width / 2
        const finishLineCenterY = this.finishLineState.y + this.finishLineState.height / 2
        const playerCenterX = this.player.positionX + this.player.width / 2
        const playerCenterY = this.player.positionY + this.player.height / 2
        const deltaX = finishLineCenterX - playerCenterX
        const deltaY = finishLineCenterY - playerCenterY
        const distance = Math.hypot(deltaX, deltaY)

        if (distance === 0 || distance > this.config.finishLine.escapeTriggerDistance) {
            return
        }

        const normalizedX = deltaX / distance
        const normalizedY = deltaY / distance
        const escapeFactor = 1 - distance / this.config.finishLine.escapeTriggerDistance
        const boost = this.config.finishLine.escapeBoost * escapeFactor

        this.finishLineState.velocityX += normalizedX * boost
        this.finishLineState.velocityY += normalizedY * boost

        const speed = Math.hypot(this.finishLineState.velocityX, this.finishLineState.velocityY)

        if (speed > this.config.finishLine.escapeMaxSpeed) {
            const scale = this.config.finishLine.escapeMaxSpeed / speed

            this.finishLineState.velocityX *= scale
            this.finishLineState.velocityY *= scale
        }
    }

    renderFinishLine() {
        this.finishLine.style.left = `${this.finishLineState.x}px`
        this.finishLine.style.top = `${this.finishLineState.y}px`
    }

    clampFinishLineToWorld() {
        const maxX = Math.max(0, this.worldSize.width - this.finishLineState.width)
        const maxY = Math.max(0, this.worldSize.height - this.finishLineState.height)

        this.finishLineState.x = Math.min(Math.max(0, this.finishLineState.x), maxX)
        this.finishLineState.y = Math.min(Math.max(0, this.finishLineState.y), maxY)
    }

    updateCamera() {
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const playerCenterX = this.player.positionX + this.player.width / 2
        const playerCenterY = this.player.positionY + this.player.height / 2
        const maxX = Math.max(0, this.worldSize.width - viewportWidth)
        const maxY = Math.max(0, this.worldSize.height - viewportHeight)

        this.camera.x = Math.min(Math.max(0, playerCenterX - viewportWidth / 2), maxX)
        this.camera.y = Math.min(Math.max(0, playerCenterY - viewportHeight / 2), maxY)
    }

    renderCamera() {
        this.updateCamera()
        this.container.style.transform = `translate(${-this.camera.x}px, ${-this.camera.y}px)`
    }

    createFinishLineVelocity() {
        const speed = randomFloat(this.config.finishLine.minSpeed, this.config.finishLine.maxSpeed)
        const angle = randomFloat(0, Math.PI * 2)

        return {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        }
    }

    randomizeFinishLineDirection() {
        const speed = Math.max(16, Math.hypot(this.finishLineState.velocityX, this.finishLineState.velocityY))
        const angle = randomFloat(0, Math.PI * 2)

        this.finishLineState.velocityX = Math.cos(angle) * speed
        this.finishLineState.velocityY = Math.sin(angle) * speed
        this.finishLineState.directionTimerMs = randomInteger(
            this.config.finishLine.directionChangeMinMs,
            this.config.finishLine.directionChangeMaxMs
        )
    }

    addFinishLineDirectionJitter() {
        this.finishLineState.velocityX += randomFloat(-1, 1) * this.config.finishLine.turnJitter * 16
        this.finishLineState.velocityY += randomFloat(-1, 1) * this.config.finishLine.turnJitter * 16
    }

    renderHud() {
        this.hud.update({
            score: this.state.score,
            currentLevel: this.state.currentLevel,
            lives: this.state.lives,
            hammers: this.state.hammers,
            movePower: this.state.movePower
        })
    }

    getOverlayContent() {
        if (this.state.status === GAME_STATES.GAME_OVER) {
            return {
                variant: 'danger',
                eyebrow: 'Transmission Lost',
                title: 'Game Over',
                description: this.state.message,
                hint: 'Pressione Enter para reiniciar do começo.'
            }
        }

        if (this.state.status === GAME_STATES.LEVEL_COMPLETE) {
            return {
                variant: 'success',
                eyebrow: 'Sector Cleared',
                title: `Nível ${this.state.points} concluído`,
                description: this.state.message,
                hint: 'Pressione Enter para entrar na próxima área.'
            }
        }

        if (this.state.status === GAME_STATES.PAUSED) {
            return {
                variant: 'warning',
                eyebrow: 'Hull Damage',
                title: 'Colisão detectada',
                description: this.state.message,
                hint: 'Pressione Enter para tentar a mesma fase novamente.'
            }
        }

        return {
            variant: 'neutral',
            eyebrow: 'Deep Space Run',
            title: 'Prepare a nave',
            description: this.state.message,
            hint: this.isTouchDevice
                ? 'Projeto desktop-first: teclado funciona melhor. WASD move, setas miram e espaço atira.'
                : 'WASD move, setas miram, espaço atira, + e - ajustam velocidade. No joystick: stick esquerdo move, direito mira, R2 atira, Start pausa.'
        }
    }

    triggerFeedback(type) {
        this.body.dataset.feedback = type
        window.setTimeout(() => {
            if (this.body.dataset.feedback === type) {
                delete this.body.dataset.feedback
            }
        }, 450)
    }
}

function randomInteger(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min
}
