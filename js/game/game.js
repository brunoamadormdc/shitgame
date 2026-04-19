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
            onHeartCollision: () => this.handleHeartCollision()
        })
        this.keyState = {
            ArrowRight: false,
            ArrowLeft: false,
            ArrowUp: false,
            ArrowDown: false
        }
        this.frameId = null
        this.lastFrameTime = 0
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
        this.handleMonsterClick = this.handleMonsterClick.bind(this)
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
        this.container.addEventListener('click', this.handleMonsterClick)
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

    handleMonsterClick(e) {
        const element = e.target

        if (!this.state.canPlay()) {
            return
        }

        if (!element.classList.contains('__monsters')) {
            return
        }

        const monster = this.monsters.getMonsterByElement(element)

        if (!monster || monster.type !== 'villain' || this.state.hammers <= 0) {
            return
        }

        this.fireShot(monster)
    }

    handleKeyDown(e) {
        if (e.code in this.keyState || e.code === 'NumpadAdd' || e.code === 'NumpadSubtract') {
            e.preventDefault()
        }

        if (e.key === 'Enter') {
            this.handlePauseInput()
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

        if (e.code in this.keyState) {
            this.keyState[e.code] = true
        }
    }

    handleKeyUp(e) {
        if (e.code in this.keyState) {
            e.preventDefault()
            this.keyState[e.code] = false
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
        this.resetKeyState()
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
        this.resetKeyState()
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
        const deltaTime = Math.min(rawDelta, this.config.loop.maxDeltaMs)
        this.lastFrameTime = timestamp
        const gamepadSnapshot = this.pollGamepad()

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

        this.state.tickInvincibility(deltaTime)

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
        this.syncPlayerState()
        this.updateFinishLine(deltaSeconds)
        this.monsters.update(
            this.player.getPosition(),
            this.state.safed,
            this.state.isInvincible(),
            deltaSeconds
        )

        if (gamepadSnapshot.attackPressed) {
            this.handleGamepadAttack()
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

        this.prepareCurrentLevel()
        this.renderHud()
        this.triggerFeedback('levelup')
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
    }

    handleHeartCollision() {
        this.state.gainLife(1)
        this.renderHud()
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
        this.resetKeyState()
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

    resetKeyState() {
        for (const key in this.keyState) {
            this.keyState[key] = false
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
                startPressed: false,
                attackPressed: false,
                speedUpPressed: false,
                speedDownPressed: false
            }
        }

        const deadzone = this.settings.gamepadDeadzone
        let x = this.applyDeadzone(gamepad.axes[0] ?? 0, deadzone)
        let y = this.applyDeadzone(gamepad.axes[1] ?? 0, deadzone)

        if (gamepad.buttons[14]?.pressed) x = -1
        if (gamepad.buttons[15]?.pressed) x = 1
        if (gamepad.buttons[12]?.pressed) y = -1
        if (gamepad.buttons[13]?.pressed) y = 1

        const startDown = Boolean(gamepad.buttons[9]?.pressed)
        const attackDown = Boolean(gamepad.buttons[0]?.pressed)
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

        return { x, y, startPressed, attackPressed, speedUpPressed, speedDownPressed }
    }

    applyDeadzone(value, deadzone) {
        if (Math.abs(value) < deadzone) {
            return 0
        }

        return value
    }

    getMovementVector(gamepadSnapshot) {
        const keyboardX = Number(this.keyState.ArrowRight) - Number(this.keyState.ArrowLeft)
        const keyboardY = Number(this.keyState.ArrowDown) - Number(this.keyState.ArrowUp)
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

    handleGamepadAttack() {
        if (this.state.hammers <= 0) {
            return
        }

        const target = this.monsters.getNearestVillain(this.player.getPosition())

        if (!target) {
            return
        }

        this.fireShot(target)
    }

    fireShot(targetMonster) {
        if (!targetMonster || this.state.hammers <= 0 || targetMonster.element.classList.contains('__destruction')) {
            return false
        }

        const from = this.getPlayerCenter()
        const to = this.getMonsterCenter(targetMonster)

        this.state.spendHammer()
        this.renderHud()
        this.spawnBeam(from, to)
        const result = this.monsters.applyDamage(targetMonster)

        if (result.destroyed) {
            window.setTimeout(() => {
                this.monsters.finalizeDestroyedMonster(targetMonster)
            }, this.config.monsters.destroyDelayMs)
        }

        return true
    }

    getPlayerCenter() {
        const position = this.player.getPosition()

        return {
            x: position.x + position.width / 2,
            y: position.y + position.height / 2
        }
    }

    getMonsterCenter(monster) {
        return {
            x: monster.x + monster.width / 2,
            y: monster.y + monster.height / 2
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
        let x = 0
        let y = 0

        for (let attempt = 0; attempt < 12; attempt++) {
            x = randomInteger(minX, maxX + 1)
            y = randomInteger(minY, maxY + 1)

            if (x > safeLimit || y > safeLimit) {
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
            points: this.state.points,
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
                ? 'Projeto desktop-first: a melhor experiência é no teclado. Setas movem, clique destrói inimigos.'
                : 'Setas movem, clique destrói inimigos, + e - ajustam a velocidade. No joystick: analógico/D-pad move, A ataca, L1/R1 mudam a velocidade.'
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
