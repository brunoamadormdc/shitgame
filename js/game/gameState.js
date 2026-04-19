export const GAME_STATES = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver'
}

export class GameState {
    constructor(config) {
        this.config = config
        this.resetForNewGame()
    }

    resetForNewGame() {
        this.score = 0
        this.points = 0
        this.lives = this.config.player.initialLives
        this.specialShots = this.config.player.initialHammers
        this.movePower = this.config.player.initialMovePower
        this.invincibilityRemainingMs = 0
        this.nextHeartPickupLevel = 8
        this.pauseReason = null
        this.safed = true
        this.currentLevel = 1
        this.currentLevelConfig = this.config.progression.getLevel(this.currentLevel)
        this.message = this.config.messages.start
        this.status = GAME_STATES.IDLE
        this.levelPrepared = false
    }

    setMessage(message) {
        this.message = message
    }

    setSafe(value) {
        this.safed = value
    }

    adjustMovePower(delta) {
        const next = this.movePower + delta
        this.movePower = Math.min(this.config.player.maxMovePower, Math.max(this.config.player.minMovePower, next))
    }

    spendSpecialShot(amount = 1) {
        this.specialShots = Math.max(0, this.specialShots - amount)
    }

    gainSpecialShots(amount) {
        this.specialShots += amount
    }

    gainScore(amount) {
        this.score += Math.max(0, Math.round(amount))
        return this.score
    }

    activateInvincibility(durationMs) {
        this.invincibilityRemainingMs = Math.max(this.invincibilityRemainingMs, durationMs)
    }

    clearInvincibility() {
        this.invincibilityRemainingMs = 0
    }

    tickInvincibility(deltaMs) {
        this.invincibilityRemainingMs = Math.max(0, this.invincibilityRemainingMs - deltaMs)
    }

    isInvincible() {
        return this.invincibilityRemainingMs > 0
    }

    loseLife() {
        this.lives = Math.max(0, this.lives - 1)
        return this.lives
    }

    gainLife(amount = 1) {
        this.lives = Math.min(this.config.player.maxLives, this.lives + amount)
        return this.lives
    }

    shouldSpawnHeartPickup() {
        return this.lives === 1 && this.currentLevel >= this.nextHeartPickupLevel
    }

    consumeHeartPickupWindow() {
        this.nextHeartPickupLevel += randomStageGap()
    }

    markLevelPrepared(value) {
        this.levelPrepared = value
    }

    startPlaying() {
        this.status = GAME_STATES.PLAYING
        this.pauseReason = null
    }

    pause(message, reason = 'system') {
        this.clearInvincibility()
        this.status = GAME_STATES.PAUSED
        this.message = message
        this.pauseReason = reason
    }

    completeLevel() {
        this.clearInvincibility()
        this.points += 1
        this.currentLevel += 1
        this.currentLevelConfig = this.config.progression.getLevel(this.currentLevel)
        this.levelPrepared = false
        this.status = GAME_STATES.LEVEL_COMPLETE
        this.message = this.config.messages.levelUp(this.points, this.currentLevel)

        return {
            completedLevel: this.points,
            nextLevel: this.currentLevel,
            levelConfig: this.currentLevelConfig
        }
    }

    setGameOver(reachedLevel) {
        this.clearInvincibility()
        this.status = GAME_STATES.GAME_OVER
        this.message = this.config.messages.gameOver(reachedLevel)
        this.levelPrepared = false
    }

    restartCurrentLevel(message) {
        this.currentLevelConfig = this.config.progression.getLevel(this.currentLevel)
        this.levelPrepared = false
        this.pause(message, 'collision')
    }

    canPlay() {
        return this.status === GAME_STATES.PLAYING
    }

    isManualPaused() {
        return this.status === GAME_STATES.PAUSED && this.pauseReason === 'manual'
    }

    shouldStartFreshGame() {
        return this.status === GAME_STATES.GAME_OVER
    }
}

function randomStageGap() {
    return Math.random() < 0.5 ? 3 : 4
}
