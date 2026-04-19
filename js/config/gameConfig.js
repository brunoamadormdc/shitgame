function buildLevelDefinition(level) {
    const safeLevel = Math.max(1, level)
    const completedLevels = safeLevel - 1

    return {
        level: safeLevel,
        villainCount: buildVillainCount(safeLevel),
        goodMonsterCount: Math.floor(completedLevels / 3),
        sizeMultiplier: Math.min(1 + (safeLevel - 1) * 0.08, 2),
        animationDurationMultiplier: Math.max(0.45, 1 - (safeLevel - 1) * 0.05),
        shooterEnabled: true,
        shooterFraction: buildShooterFraction(safeLevel),
        respawnEnabled: safeLevel >= 7,
        villainHitPoints: safeLevel >= 7 ? 3 : 1,
        guaranteedStarPickup: safeLevel >= 7
    }
}

function buildVillainCount(level) {
    if (level <= 1) return 4
    if (level === 2) return 7
    if (level === 3) return 10
    if (level === 4) return 13
    if (level === 5) return 16
    if (level === 6) return 20
    return 24 + (level - 7) * 5
}

function buildShooterFraction(level) {
    if (level >= 7) {
        return 1 / 3
    }

    return Math.min(0.14 + (level - 1) * 0.03, 0.29)
}

export const GAME_CONFIG = {
    loop: {
        frameDurationMs: 1000 / 60,
        maxDeltaMs: 32
    },
    finishLine: {
        size: 58,
        collisionRadiusMultiplier: 0.34,
        minSpeed: 42,
        maxSpeed: 88,
        directionChangeMinMs: 1200,
        directionChangeMaxMs: 2600,
        turnJitter: 0.65,
        spawnPadding: 72,
        label: 'Level UP'
    },
    safeZone: {
        size: 40,
        threshold: 10
    },
    player: {
        initialLives: 3,
        maxLives: 3,
        initialHammers: 10,
        initialMovePower: 180,
        minMovePower: 120,
        maxMovePower: 360,
        movePowerStep: 60,
        sizeRatio: 0.022,
        minSize: 26,
        maxSize: 40,
        collisionRadiusMultiplier: 0.26,
        invincibilityDurationMs: 15000
    },
    monsters: {
        initialSizeRatio: 0.044,
        goodMonsterSize: 60,
        starPickupSize: 48,
        heartPickupSize: 44,
        starSpawnChance: 0.28,
        minSizeMultiplier: 0.7,
        maxSizeMultiplier: 1.35,
        collisionPadding: 0,
        collisionRadiusMultiplier: 0.48,
        destroyDelayMs: 200,
        beamDurationMs: 120,
        spawnOffset: 200,
        minSpeed: 46,
        maxSpeed: 132,
        directionChangeMinMs: 900,
        directionChangeMaxMs: 2400,
        turnJitter: 0.85,
        bonusHammerAmount: 20,
        shooterWarningMs: 1000,
        shooterBeamDurationMs: 420,
        shooterCooldownMinMs: 2200,
        shooterCooldownMaxMs: 4200,
        respawnDelayMinMs: 1800,
        respawnDelayMaxMs: 3600
    },
    progression: {
        getLevel(level) {
            return buildLevelDefinition(level)
        }
    },
    messages: {
        start: 'Aperte o enter para começar! Você nunca chegará no Level 30',
        collision: 'Você bateu no planeta! Aperte o Enter e tente de novo!',
        gameOver(level) {
            return `Game Over! Você alcançou o nível ${level}! Aperte o Enter para reiniciar.`
        },
        levelUp(level, nextLevel) {
            return `Passou para o nível ${level}. Próximo: nível ${nextLevel}. Aperte o Enter`
        }
    }
}
