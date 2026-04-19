import { GAME_CONFIG } from "../config/gameConfig.js"
import { Player } from "../entities/player.js"
import { MonsterManager } from "../entities/monsterManager.js"
import { GameState, GAME_STATES } from "./gameState.js"
import { loadLeaderboard, registerLeaderboardScore } from "./scoreStore.js"
import { loadSettings, saveSettings } from "./settingsStore.js"
import { hasSeenTutorial, markTutorialSeen } from "./tutorialStore.js"
import { Hud } from "../ui/hud.js"
import { Messages } from "../ui/messages.js"
import { SettingsPanel } from "../ui/settingsPanel.js"
import { TutorialModal } from "../ui/tutorialModal.js"
import { VirtualGamepad } from "../ui/virtualGamepad.js"

export class Game {
    constructor(document) {
        this.document = document
        this.config = GAME_CONFIG
        this.state = new GameState(this.config)
        this.settings = loadSettings()
        this.leaderboard = loadLeaderboard()
        this.tutorialHasBeenSeen = hasSeenTutorial()
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
        this.falsePortal = this.document.createElement('div')
        this.falsePortal.classList.add('__finishLine', '__falsePortal')
        this.falsePortal.textContent = 'LEVEL?'
        this.falsePortalState = this.createFalsePortalState()
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
        this.tutorialModal = new TutorialModal(this.document, {
            onClose: () => this.handleTutorialClose()
        })
        this.virtualGamepad = new VirtualGamepad(this.document)
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
        this.gameOverSummary = null
        this.gamepadInfo = {
            connected: false,
            label: 'Nenhum joystick detectado'
        }
        this.previousGamepadButtons = {
            start: false,
            attack: false,
            specialAttack: false,
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
        this.container.append(this.safeZone, this.falsePortal, this.finishLine)
        this.hud.mount()
        this.player.mount(this.container)
        this.settingsPanel.mount()
        this.virtualGamepad.mount()

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
            this.prepareFalsePortal()
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
            e.code === 'Space' ||
            e.code === 'ShiftLeft' ||
            e.code === 'ShiftRight'
        ) {
            e.preventDefault()
        }

        if (e.key === 'Enter') {
            if (this.tutorialModal.isVisible()) {
                this.tutorialModal.hide()
                return
            }
            this.handlePauseInput()
            return
        }

        if (e.code === 'Space') {
            if (!e.repeat) {
                this.fireCurrentAim({ special: false })
            }
            return
        }

        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            if (!e.repeat) {
                this.fireCurrentAim({ special: true })
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
            this.gameOverSummary = null
            this.renderHud()
        }

        if (!this.state.levelPrepared) {
            this.prepareCurrentLevel()
        }

        this.state.startPlaying()
        if (this.isTouchDevice) {
            this.virtualGamepad.show()
        }
        this.tutorialModal.hide()
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
        this.deactivateFalsePortal()
        this.virtualGamepad.hide()
        this.messages.show(this.getOverlayContent())
        this.settingsPanel.show({
            settings: this.settings,
            gamepadStatus: this.gamepadInfo.label,
            startLabel: 'Começar'
        })

        if (!this.tutorialHasBeenSeen) {
            this.openTutorial()
        }
    }

    showOverlay(message) {
        this.state.setMessage(message)
        this.state.setSafe(true)
        this.resetInputState()
        this.player.resetPosition()
        this.player.setSafe(true)
        this.virtualGamepad.hide()
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

        this.applyStageTheme()
        this.monsters.spawnLevel(this.state.currentLevelConfig, { spawnHeartPickup })
        if (spawnHeartPickup) {
            this.state.consumeHeartPickupWindow()
        }
        this.placeFinishLineRandomly()
        this.prepareFalsePortal()
        this.state.markLevelPrepared(true)
        this.calculateFinishLine()
        this.calculateFalsePortal()
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
        this.updateFalsePortal(deltaSeconds)
        this.monsters.update(
            this.player.getPosition(),
            this.state.safed,
            this.state.isInvincible(),
            deltaSeconds
        )

        if (gamepadSnapshot.attackPressed) {
            this.fireCurrentAim({ special: false })
        }

        if (gamepadSnapshot.specialAttackPressed) {
            this.fireCurrentAim({ special: true })
        }

        this.checkFinishLine()
    }

    render() {
        this.player.render()
        this.renderFalsePortal()
        this.renderFinishLine()
        this.renderCamera()
    }

    checkFinishLine() {
        if (this.checkFalsePortalCollision()) {
            return null
        }

        if (!this.finishLineState.active) {
            return null
        }

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

    checkFalsePortalCollision() {
        if (!this.falsePortalState.active) {
            return false
        }

        const playerPosition = this.player.getPosition()
        const playerCenterX = playerPosition.x + playerPosition.width / 2
        const playerCenterY = playerPosition.y + playerPosition.height / 2
        const portalCenterX = this.falsePortalState.x + this.falsePortalState.width / 2
        const portalCenterY = this.falsePortalState.y + this.falsePortalState.height / 2
        const distance = Math.hypot(playerCenterX - portalCenterX, playerCenterY - portalCenterY)

        if (distance > playerPosition.collisionRadius + this.falsePortalState.collisionRadius) {
            return false
        }

        this.showMomentToast('FALSE PORTAL')
        this.deactivateFalsePortal()
        this.handleVillainCollision(this.config.traps.falsePortalPenaltyMessage)
        return true
    }

    handleBonusCollision() {
        this.state.gainSpecialShots(this.config.monsters.bonusHammerAmount)
        this.renderHud()
        this.showMomentToast(`+${this.config.monsters.bonusHammerAmount} COMETS`)
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

    handleVillainCollision(message = this.config.messages.collision) {
        const reachedLevel = this.state.points
        const remainingLives = this.state.loseLife()

        if (remainingLives <= 0) {
            this.monsters.removeAll()
            this.state.setGameOver(reachedLevel)
            this.gameOverSummary = this.recordGameOverSummary()
            this.renderHud()
            this.triggerFeedback('gameover')
            this.showOverlay(this.state.message)
            return
        }

        this.state.restartCurrentLevel(message)
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
        this.virtualGamepad.hide()
    }

    resumeGame() {
        this.state.startPlaying()
        if (this.isTouchDevice) {
            this.virtualGamepad.show()
        }
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

    openTutorial(page = 0) {
        this.tutorialModal.show(page)
    }

    handleTutorialClose() {
        if (!this.tutorialHasBeenSeen) {
            this.tutorialHasBeenSeen = true
            markTutorialSeen()
        }
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
            return this.gamepadInfo.connected || (this.isTouchDevice && this.virtualGamepad.isVisible())
        }

        return this.gamepadInfo.connected || (this.isTouchDevice && this.virtualGamepad.isVisible())
    }

    pollGamepad() {
        this.refreshGamepadInfo()
        const virtualSnapshot = this.virtualGamepad.getSnapshot()

        if (!this.shouldUseGamepad()) {
            this.previousGamepadButtons.start = false
            this.previousGamepadButtons.attack = false
            this.previousGamepadButtons.specialAttack = false
            this.previousGamepadButtons.speedUp = false
            this.previousGamepadButtons.speedDown = false
            return {
                x: virtualSnapshot.x,
                y: virtualSnapshot.y,
                aimX: virtualSnapshot.aimX,
                aimY: virtualSnapshot.aimY,
                startPressed: false,
                attackPressed: virtualSnapshot.attackPressed,
                specialAttackPressed: virtualSnapshot.specialAttackPressed,
                speedUpPressed: false,
                speedDownPressed: false
            }
        }

        const gamepad = this.getConnectedGamepad()

        if (!gamepad) {
            return {
                x: virtualSnapshot.x,
                y: virtualSnapshot.y,
                aimX: virtualSnapshot.aimX,
                aimY: virtualSnapshot.aimY,
                startPressed: false,
                attackPressed: virtualSnapshot.attackPressed,
                specialAttackPressed: virtualSnapshot.specialAttackPressed,
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
        const specialAttackDown = Boolean(gamepad.buttons[5]?.pressed)
        const speedUpDown = Boolean(gamepad.buttons[6]?.pressed)
        const speedDownDown = Boolean(gamepad.buttons[4]?.pressed)
        const startPressed = startDown && !this.previousGamepadButtons.start
        const attackPressed = this.state.canPlay() && attackDown && !this.previousGamepadButtons.attack
        const specialAttackPressed = this.state.canPlay() && specialAttackDown && !this.previousGamepadButtons.specialAttack
        const speedUpPressed = this.state.canPlay() && speedUpDown && !this.previousGamepadButtons.speedUp
        const speedDownPressed = this.state.canPlay() && speedDownDown && !this.previousGamepadButtons.speedDown

        this.previousGamepadButtons.start = startDown
        this.previousGamepadButtons.attack = attackDown
        this.previousGamepadButtons.specialAttack = specialAttackDown
        this.previousGamepadButtons.speedUp = speedUpDown
        this.previousGamepadButtons.speedDown = speedDownDown

        return {
            x: clampAxis(x + virtualSnapshot.x),
            y: clampAxis(y + virtualSnapshot.y),
            aimX: virtualSnapshot.aimX !== 0 ? virtualSnapshot.aimX : aimX,
            aimY: virtualSnapshot.aimY !== 0 ? virtualSnapshot.aimY : aimY,
            startPressed,
            attackPressed: attackPressed || virtualSnapshot.attackPressed,
            specialAttackPressed: specialAttackPressed || virtualSnapshot.specialAttackPressed,
            speedUpPressed,
            speedDownPressed
        }
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

    fireCurrentAim(options = {}) {
        const isSpecial = Boolean(options.special)

        if (!this.state.canPlay()) {
            return false
        }

        if (isSpecial && this.state.specialShots <= 0) {
            return false
        }

        const origin = this.getPlayerCenter()
        const direction = {
            x: Math.cos(this.player.aimAngle),
            y: Math.sin(this.player.aimAngle)
        }
        const maxDistance = Math.hypot(this.worldSize.width, this.worldSize.height)
        const monsterHit = this.monsters.getFirstVillainOnRay(origin, direction, maxDistance)
        const finishLineHit = this.getFinishLineRayHit(origin, direction, maxDistance)
        const hit = this.pickPriorityShotHit(monsterHit, finishLineHit)
        const endPoint = hit?.point ?? {
            x: origin.x + direction.x * maxDistance,
            y: origin.y + direction.y * maxDistance
        }

        if (isSpecial) {
            this.state.spendSpecialShot()
        }

        this.spawnBeam(origin, endPoint, { special: isSpecial })

        if (!hit) {
            this.renderHud()
            return false
        }

        if (hit.type === 'finishLine') {
            this.handleFinishLineShot(endPoint, { special: isSpecial })
            this.renderHud()
            return true
        }

        const damageAmount = isSpecial ? this.config.weapons.specialDamage : this.config.weapons.basicDamage
        const result = this.monsters.applyDamage(hit.monster, damageAmount)
        this.awardShotScore(result)

        if (result.destroyed) {
            this.registerDestroyedPlanet()
            this.spawnImpactBurst(endPoint, { special: isSpecial })
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

    getFinishLineRayHit(origin, direction, maxDistance) {
        if (!this.finishLineState.active) {
            return null
        }

        const centerX = this.finishLineState.x + this.finishLineState.width / 2
        const centerY = this.finishLineState.y + this.finishLineState.height / 2
        const offsetX = centerX - origin.x
        const offsetY = centerY - origin.y
        const projection = offsetX * direction.x + offsetY * direction.y

        if (projection <= 0 || projection >= maxDistance) {
            return null
        }

        const perpendicularDistance = Math.abs(offsetX * direction.y - offsetY * direction.x)

        if (perpendicularDistance > this.finishLineState.collisionRadius) {
            return null
        }

        return {
            type: 'finishLine',
            projection,
            point: {
                x: origin.x + direction.x * projection,
                y: origin.y + direction.y * projection
            }
        }
    }

    pickPriorityShotHit(monsterHit, finishLineHit) {
        if (!monsterHit) {
            return finishLineHit
        }

        if (!finishLineHit) {
            return {
                ...monsterHit,
                type: 'monster',
                projection: Math.hypot(monsterHit.point.x - this.getPlayerCenter().x, monsterHit.point.y - this.getPlayerCenter().y)
            }
        }

        const monsterProjection = Math.hypot(
            monsterHit.point.x - this.getPlayerCenter().x,
            monsterHit.point.y - this.getPlayerCenter().y
        )

        return finishLineHit.projection < monsterProjection
            ? finishLineHit
            : { ...monsterHit, type: 'monster', projection: monsterProjection }
    }

    handleFinishLineShot(position, options = {}) {
        this.spawnImpactBurst(position, { special: true })
        this.startDramaticBeat(this.config.fx.levelUpBeatMs)
        this.state.applyScorePenaltyDivisor(this.config.finishLine.scorePenaltyDivisor)
        this.finishLineState.active = false
        this.finishLineState.enraged = false
        this.finishLineState.wasShotThisStage = true
        this.finishLineState.respawnTimerMs = this.config.finishLine.respawnDelayMs
        this.finishLineState.beamState = 'idle'
        this.finishLineState.beamTimerMs = this.createFinishLineBeamCooldown()
        this.finishLine.classList.remove('__charging', '__shooting', '__enraged')
        this.showMomentToast('LEVEL DOWN')
    }

    spawnBeam(from, to, options = {}) {
        const beam = this.document.createElement('div')
        const deltaX = to.x - from.x
        const deltaY = to.y - from.y
        const length = Math.hypot(deltaX, deltaY)
        const angle = Math.atan2(deltaY, deltaX)
        const isSpecial = Boolean(options.special)

        beam.className = '__laserBeam'
        if (isSpecial) {
            beam.classList.add('__special')
        }
        beam.style.left = `${from.x}px`
        beam.style.top = `${from.y}px`
        beam.style.width = `${length}px`
        beam.style.transform = `translateY(-50%) rotate(${angle}rad)`
        this.container.append(beam)

        window.setTimeout(() => {
            if (beam.isConnected) {
                beam.remove()
            }
        }, isSpecial ? this.config.weapons.specialBeamDurationMs : this.config.weapons.basicBeamDurationMs)
    }

    spawnImpactBurst(position, options = {}) {
        const burst = this.document.createElement('div')
        const isSpecial = Boolean(options.special)

        burst.className = '__impactBurst'
        if (isSpecial) {
            burst.classList.add('__special')
        }
        burst.style.left = `${position.x}px`
        burst.style.top = `${position.y}px`
        this.container.append(burst)

        window.setTimeout(() => {
            if (burst.isConnected) {
                burst.remove()
            }
        }, isSpecial ? this.config.fx.specialImpactBurstDurationMs : this.config.fx.impactBurstDurationMs)
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

    recordGameOverSummary() {
        const result = registerLeaderboardScore({
            score: this.state.score,
            level: this.state.currentLevel
        })

        this.leaderboard = result.leaderboard

        return {
            score: this.state.score,
            level: this.state.currentLevel,
            rank: result.rank,
            isHighScore: result.isHighScore,
            leaderboard: this.leaderboard
        }
    }

    copyGameOverShareText() {
        if (!this.gameOverSummary) {
            return
        }

        const shareText = this.buildShareText()

        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(shareText)
                .then(() => this.showMomentToast('RESULTADO COPIADO'))
                .catch(() => this.copyShareTextFallback(shareText))
            return
        }

        this.copyShareTextFallback(shareText)
    }

    copyShareTextFallback(text) {
        const textarea = this.document.createElement('textarea')

        textarea.value = text
        textarea.setAttribute('readonly', 'true')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        this.body.append(textarea)
        textarea.select()

        try {
            this.document.execCommand('copy')
            this.showMomentToast('RESULTADO COPIADO')
        }
        catch {
            this.showMomentToast('COPIA FALHOU')
        }

        textarea.remove()
    }

    buildShareText() {
        const score = this.gameOverSummary?.score ?? this.state.score
        const level = this.gameOverSummary?.level ?? this.state.currentLevel
        const rank = this.gameOverSummary?.rank
        const rankText = rank ? ` Rank local #${rank}.` : ''

        return `Cheguei no nível ${level} com ${score} pontos no ShitGame e morri no caos espacial.${rankText} Consegue bater isso?`
    }

    applyStageTheme() {
        const themes = ['nebula-a', 'nebula-b', 'nebula-c', 'nebula-d', 'nebula-e', 'nebula-f']
        const theme = themes[(Math.random() * themes.length) | 0]

        this.container.dataset.theme = theme
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
        this.calculateFalsePortal()
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

    calculateFalsePortal() {
        const size = Math.round(this.config.finishLine.size * this.config.traps.falsePortalSizeMultiplier)

        this.falsePortalState.width = size
        this.falsePortalState.height = size
        this.falsePortalState.collisionRadius = size * this.config.finishLine.collisionRadiusMultiplier
        this.falsePortal.style.width = `${size}px`
        this.falsePortal.style.height = `${size}px`
        this.clampFalsePortalToWorld()
        this.renderFalsePortal()
    }

    createFinishLineState() {
        const size = this.config.finishLine.size
        const velocity = this.createFinishLineVelocity()

        return {
            active: true,
            enraged: false,
            wasShotThisStage: false,
            respawnTimerMs: 0,
            x: 0,
            y: 0,
            width: size,
            height: size,
            collisionRadius: size * this.config.finishLine.collisionRadiusMultiplier,
            velocityX: velocity.x,
            velocityY: velocity.y,
            beamAngle: 0,
            beamState: 'idle',
            beamTimerMs: this.createFinishLineBeamCooldown(),
            directionTimerMs: randomInteger(
                this.config.finishLine.directionChangeMinMs,
                this.config.finishLine.directionChangeMaxMs
            )
        }
    }

    createFalsePortalState() {
        const size = Math.round(this.config.finishLine.size * this.config.traps.falsePortalSizeMultiplier)
        const velocity = this.createFalsePortalVelocity()

        return {
            active: false,
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

    placeFinishLineRandomly(options = {}) {
        const preserveEnraged = Boolean(options.preserveEnraged)
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

        this.finishLineState.active = true
        this.finishLineState.enraged = preserveEnraged ? this.finishLineState.enraged : false
        this.finishLineState.wasShotThisStage = preserveEnraged ? this.finishLineState.wasShotThisStage : false
        this.finishLineState.respawnTimerMs = 0
        this.finishLineState.beamState = 'idle'
        this.finishLineState.beamTimerMs = this.createFinishLineBeamCooldown()
        this.finishLine.classList.remove('__charging', '__shooting')
        this.finishLine.classList.toggle('__enraged', this.finishLineState.enraged)
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

    prepareFalsePortal() {
        const shouldSpawn =
            this.state.currentLevel >= this.config.traps.falsePortalStartLevel &&
            Math.random() < this.config.traps.falsePortalChance

        if (!shouldSpawn) {
            this.deactivateFalsePortal()
            return
        }

        this.falsePortalState.active = true
        this.placeFalsePortalRandomly()
    }

    placeFalsePortalRandomly() {
        const padding = this.config.finishLine.spawnPadding
        const minX = Math.min(padding, Math.max(0, this.worldSize.width - this.falsePortalState.width))
        const minY = Math.min(padding, Math.max(0, this.worldSize.height - this.falsePortalState.height))
        const maxX = Math.max(minX, this.worldSize.width - this.falsePortalState.width - padding)
        const maxY = Math.max(minY, this.worldSize.height - this.falsePortalState.height - padding)
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
                x + this.falsePortalState.width < viewportLeft ||
                x > viewportRight ||
                y + this.falsePortalState.height < viewportTop ||
                y > viewportBottom

            if (isOutsideViewport) {
                break
            }
        }

        this.falsePortalState.x = x
        this.falsePortalState.y = y
        this.falsePortalState.directionTimerMs = randomInteger(
            this.config.finishLine.directionChangeMinMs,
            this.config.finishLine.directionChangeMaxMs
        )
        const velocity = this.createFalsePortalVelocity()
        this.falsePortalState.velocityX = velocity.x
        this.falsePortalState.velocityY = velocity.y
        this.renderFalsePortal()
    }

    updateFinishLine(deltaSeconds) {
        if (!this.finishLineState.active) {
            if (this.finishLineState.respawnTimerMs > 0) {
                this.finishLineState.respawnTimerMs -= deltaSeconds * 1000
            }

            if (this.finishLineState.respawnTimerMs <= 0) {
                this.finishLineState.active = true
                this.finishLineState.enraged = this.finishLineState.wasShotThisStage
                this.finishLineState.beamState = 'idle'
                this.finishLineState.beamTimerMs = this.createFinishLineBeamCooldown()
                this.placeFinishLineRandomly({ preserveEnraged: true })
                if (this.finishLineState.enraged) {
                    this.finishLine.classList.add('__enraged')
                    this.showMomentToast('LEVEL MAD')
                }
            }
            return
        }

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

        this.updateFinishLineAttack(deltaSeconds)
    }

    updateFalsePortal(deltaSeconds) {
        if (!this.falsePortalState.active) {
            return
        }

        this.falsePortalState.directionTimerMs -= deltaSeconds * 1000

        if (this.falsePortalState.directionTimerMs <= 0) {
            this.randomizeFalsePortalDirection()
        }

        let nextX = this.falsePortalState.x + this.falsePortalState.velocityX * deltaSeconds
        let nextY = this.falsePortalState.y + this.falsePortalState.velocityY * deltaSeconds
        const maxX = Math.max(0, this.worldSize.width - this.falsePortalState.width)
        const maxY = Math.max(0, this.worldSize.height - this.falsePortalState.height)

        if (nextX <= 0 || nextX >= maxX) {
            this.falsePortalState.velocityX *= -1
            nextX = Math.min(Math.max(0, nextX), maxX)
            this.addFalsePortalDirectionJitter()
        }

        if (nextY <= 0 || nextY >= maxY) {
            this.falsePortalState.velocityY *= -1
            nextY = Math.min(Math.max(0, nextY), maxY)
            this.addFalsePortalDirectionJitter()
        }

        this.falsePortalState.x = nextX
        this.falsePortalState.y = nextY
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
        this.finishLine.hidden = !this.finishLineState.active

        if (!this.finishLineState.active) {
            return
        }

        this.finishLine.style.left = `${this.finishLineState.x}px`
        this.finishLine.style.top = `${this.finishLineState.y}px`
    }

    renderFalsePortal() {
        this.falsePortal.hidden = !this.falsePortalState.active

        if (!this.falsePortalState.active) {
            return
        }

        this.falsePortal.style.left = `${this.falsePortalState.x}px`
        this.falsePortal.style.top = `${this.falsePortalState.y}px`
    }

    clampFinishLineToWorld() {
        const maxX = Math.max(0, this.worldSize.width - this.finishLineState.width)
        const maxY = Math.max(0, this.worldSize.height - this.finishLineState.height)

        this.finishLineState.x = Math.min(Math.max(0, this.finishLineState.x), maxX)
        this.finishLineState.y = Math.min(Math.max(0, this.finishLineState.y), maxY)
    }

    clampFalsePortalToWorld() {
        const maxX = Math.max(0, this.worldSize.width - this.falsePortalState.width)
        const maxY = Math.max(0, this.worldSize.height - this.falsePortalState.height)

        this.falsePortalState.x = Math.min(Math.max(0, this.falsePortalState.x), maxX)
        this.falsePortalState.y = Math.min(Math.max(0, this.falsePortalState.y), maxY)
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

    createFinishLineBeamCooldown() {
        return randomInteger(this.config.finishLine.beamCooldownMinMs, this.config.finishLine.beamCooldownMaxMs)
    }

    createFalsePortalVelocity() {
        const speed = randomFloat(
            this.config.finishLine.minSpeed * this.config.traps.falsePortalSpeedMultiplier,
            this.config.finishLine.maxSpeed * this.config.traps.falsePortalSpeedMultiplier
        )
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

    updateFinishLineAttack(deltaSeconds) {
        if (!this.finishLineState.enraged) {
            this.finishLine.classList.remove('__charging', '__shooting')
            return
        }

        this.finishLineState.beamTimerMs -= deltaSeconds * 1000

        if (this.finishLineState.beamState === 'idle' && this.finishLineState.beamTimerMs <= 0) {
            const playerCenter = this.getPlayerCenter()
            const finishLineCenterX = this.finishLineState.x + this.finishLineState.width / 2
            const finishLineCenterY = this.finishLineState.y + this.finishLineState.height / 2

            this.finishLineState.beamAngle = Math.atan2(playerCenter.y - finishLineCenterY, playerCenter.x - finishLineCenterX)
            this.finishLineState.beamState = 'warning'
            this.finishLineState.beamTimerMs = this.config.finishLine.beamWarningMs
            this.finishLine.style.setProperty('--beam-angle', `${this.finishLineState.beamAngle}rad`)
            this.finishLine.classList.add('__charging', '__enraged')
            this.finishLine.classList.remove('__shooting')
            return
        }

        if (this.finishLineState.beamState === 'warning' && this.finishLineState.beamTimerMs <= 0) {
            this.finishLineState.beamState = 'firing'
            this.finishLineState.beamTimerMs = this.config.finishLine.beamDurationMs
            this.finishLine.classList.add('__shooting')
            this.finishLine.classList.remove('__charging')
        }

        if (this.finishLineState.beamState !== 'firing') {
            return
        }

        const beamDistance = this.getFinishLineBeamDistance(this.player.getPosition())

        if (!this.state.safed && !this.state.isInvincible() && beamDistance <= this.player.getPosition().collisionRadius) {
            this.finishLine.classList.remove('__charging', '__shooting')
            this.finishLineState.beamState = 'idle'
            this.finishLineState.beamTimerMs = this.createFinishLineBeamCooldown()
            this.handleVillainCollision('O Level UP voltou furioso e te acertou com um raio. Aperte Enter e tente de novo.')
            return
        }

        if (this.finishLineState.beamTimerMs <= 0) {
            this.finishLine.classList.remove('__charging', '__shooting')
            this.finishLineState.beamState = 'idle'
            this.finishLineState.beamTimerMs = this.createFinishLineBeamCooldown()
        }
    }

    getFinishLineBeamDistance(playerPosition) {
        const beamLength = Math.hypot(this.worldSize.width, this.worldSize.height)
        const startX = this.finishLineState.x + this.finishLineState.width / 2
        const startY = this.finishLineState.y + this.finishLineState.height / 2
        const endX = startX + Math.cos(this.finishLineState.beamAngle) * beamLength
        const endY = startY + Math.sin(this.finishLineState.beamAngle) * beamLength
        const playerCenterX = playerPosition.x + playerPosition.width / 2
        const playerCenterY = playerPosition.y + playerPosition.height / 2

        return pointToSegmentDistance(playerCenterX, playerCenterY, startX, startY, endX, endY)
    }

    randomizeFalsePortalDirection() {
        const speed = Math.max(14, Math.hypot(this.falsePortalState.velocityX, this.falsePortalState.velocityY))
        const angle = randomFloat(0, Math.PI * 2)

        this.falsePortalState.velocityX = Math.cos(angle) * speed
        this.falsePortalState.velocityY = Math.sin(angle) * speed
        this.falsePortalState.directionTimerMs = randomInteger(
            this.config.finishLine.directionChangeMinMs,
            this.config.finishLine.directionChangeMaxMs
        )
    }

    addFalsePortalDirectionJitter() {
        this.falsePortalState.velocityX += randomFloat(-1, 1) * this.config.finishLine.turnJitter * 12
        this.falsePortalState.velocityY += randomFloat(-1, 1) * this.config.finishLine.turnJitter * 12
    }

    deactivateFalsePortal() {
        this.falsePortalState.active = false
        this.falsePortal.hidden = true
    }

    renderHud() {
        this.hud.update({
            score: this.state.score,
            currentLevel: this.state.currentLevel,
            lives: this.state.lives,
            specialShots: this.state.specialShots,
            movePower: this.state.movePower
        })
    }

    getOverlayContent() {
        if (this.state.status === GAME_STATES.GAME_OVER) {
            const summary = this.gameOverSummary ?? {
                score: this.state.score,
                level: this.state.currentLevel,
                rank: null,
                isHighScore: false,
                leaderboard: this.leaderboard
            }

            return {
                variant: 'danger',
                eyebrow: summary.isHighScore ? 'New Local Record' : 'Transmission Lost',
                title: 'Game Over',
                description: summary.isHighScore
                    ? 'Você acabou de cravar o maior score local. Agora isso já virou material de print.'
                    : 'A run morreu, mas o score ficou salvo. Hora de tentar subir essa marca no ranking local.',
                hint: 'Pressione Enter para reiniciar ou copie o resultado para desafiar alguém.',
                stats: [
                    { label: 'Score final', value: `${summary.score}` },
                    { label: 'Nível alcançado', value: `${summary.level}` },
                    { label: 'Rank local', value: summary.rank ? `#${summary.rank}` : 'fora do top 5' }
                ],
                leaderboard: summary.leaderboard.map((entry, index) => ({
                    position: index + 1,
                    score: entry.score,
                    level: entry.level
                })),
                actions: [
                    { label: 'Copiar resultado', kind: 'primary', onClick: () => this.copyGameOverShareText() }
                ]
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
            description: 'Runs curtas, score alto e caos espacial. Configure o input, abra o tutorial se precisar e entra na arena.',
            leaderboard: this.leaderboard.map((entry, index) => ({
                position: index + 1,
                score: entry.score,
                level: entry.level
            })),
            hint: this.isTouchDevice
                ? 'Projeto desktop-first. Use o tutorial para ver os controles completos.'
                : 'Ajuste o input no painel abaixo e aperte Enter ou o botão começar para iniciar a run.',
            actions: [
                { label: 'Tutorial', kind: 'secondary', onClick: () => this.openTutorial() }
            ]
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

function clampAxis(value) {
    return Math.max(-1, Math.min(1, value))
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1
    const dy = y2 - y1
    const denominator = dx * dx + dy * dy

    if (denominator === 0) {
        return Math.hypot(px - x1, py - y1)
    }

    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / denominator))
    const nearestX = x1 + t * dx
    const nearestY = y1 + t * dy

    return Math.hypot(px - nearestX, py - nearestY)
}
