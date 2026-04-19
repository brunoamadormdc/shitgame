export class MonsterManager {
    constructor({ document, container, config, onVillainCollision, onBonusCollision, onStarCollision, onHeartCollision, onNearMiss }) {
        this.document = document
        this.container = container
        this.config = config
        this.onVillainCollision = onVillainCollision
        this.onBonusCollision = onBonusCollision
        this.onStarCollision = onStarCollision
        this.onHeartCollision = onHeartCollision
        this.onNearMiss = onNearMiss
        this.activeLevelConfig = null
        this.monsters = []
        this.pendingRespawns = []
        this.worldSize = {
            width: window.innerWidth,
            height: window.innerHeight
        }
        this.lastPlayerPosition = null
        this.resetBaseSize()
    }

    setWorldSize(worldSize) {
        this.worldSize = worldSize
    }

    spawnLevel(levelConfig, options = {}) {
        this.removeAll()
        this.activeLevelConfig = levelConfig

        for (let i = 0; i < levelConfig.villainCount; i++) {
            this.spawnMonster(levelConfig)
        }

        for (let i = 0; i < levelConfig.goodMonsterCount; i++) {
            this.spawnGoodMonster(levelConfig)
        }

        if (levelConfig.guaranteedStarPickup || Math.random() < this.config.monsters.starSpawnChance) {
            this.spawnStarPickup(levelConfig)
        }

        if (options.spawnHeartPickup) {
            this.spawnHeartPickup(levelConfig)
        }
    }

    spawnMonster(levelConfig) {
        const { posX, posY } = this.calculatePositions()
        const archetype = this.pickVillainArchetype(levelConfig)
        const archetypeConfig = this.getArchetypeConfig(archetype)
        const randomSizeFactor = randomFloat(
            this.config.monsters.minSizeMultiplier,
            this.config.monsters.maxSizeMultiplier
        )
        const size = this.baseWidth * levelConfig.sizeMultiplier * randomSizeFactor * (archetypeConfig.sizeMultiplier ?? 1)
        const monster = this.createMonsterElement(posX, posY, size, size)
        const velocity = this.createVelocity(levelConfig, archetypeConfig.speedMultiplier ?? 1)
        const texture = createPlanetTexture(this.document, size)
        const canShoot = this.shouldEnableShooter(levelConfig, archetype)

        monster.style.backgroundImage = `url('${texture}')`
        monster.style.borderRadius = '50%'
        monster.style.setProperty('--enemy-beam-length', `${Math.hypot(this.worldSize.width, this.worldSize.height)}px`)
        delete monster.dataset.damage
        monster.dataset.archetype = archetype
        if (canShoot) {
            monster.classList.add('__shooter')
        }
        if (archetype !== 'base') {
            monster.classList.add(`__${archetype}`)
        }
        this.container.append(monster)
        this.monsters.push({
            element: monster,
            type: 'villain',
            archetype,
            x: posX,
            y: posY,
            width: size,
            height: size,
            hitPoints: levelConfig.villainHitPoints + (archetypeConfig.hitPointBonus ?? 0),
            maxHitPoints: levelConfig.villainHitPoints + (archetypeConfig.hitPointBonus ?? 0),
            collisionRadius:
                size *
                    this.config.monsters.collisionRadiusMultiplier *
                    (archetypeConfig.collisionRadiusMultiplier ?? 1) +
                this.config.monsters.collisionPadding,
            velocityX: velocity.x,
            velocityY: velocity.y,
            canShoot,
            beamAngle: 0,
            beamState: 'idle',
            nearMissCooldownMs: 0,
            beamTimerMs: canShoot
                ? this.createShooterCooldown(archetype)
                : 0,
            directionTimerMs: randomInteger(
                this.scaleDirectionTimer(this.config.monsters.directionChangeMinMs, archetype),
                this.scaleDirectionTimer(this.config.monsters.directionChangeMaxMs, archetype)
            )
        })
    }

    spawnGoodMonster(levelConfig) {
        const { posX, posY } = this.calculatePositions()
        const size = this.config.monsters.goodMonsterSize
        const monster = this.createMonsterElement(posX, posY, size, size)
        const velocity = this.createVelocity(levelConfig, 0.85)

        monster.classList.add('goodMonster')
        this.container.append(monster)
        this.monsters.push({
            element: monster,
            type: 'goodguy',
            x: posX,
            y: posY,
            width: size,
            height: size,
            collisionRadius: size * 0.55 + this.config.monsters.collisionPadding,
            velocityX: velocity.x,
            velocityY: velocity.y,
            directionTimerMs: randomInteger(
                this.config.monsters.directionChangeMinMs,
                this.config.monsters.directionChangeMaxMs
            )
        })
    }

    spawnStarPickup(levelConfig) {
        const { posX, posY } = this.calculatePositions()
        const size = this.config.monsters.starPickupSize
        const monster = this.createMonsterElement(posX, posY, size, size)
        const velocity = this.createVelocity(levelConfig, 0.92)
        const texture = createStarTexture(this.document, size)

        monster.classList.add('powerStar')
        monster.style.backgroundImage = `url('${texture}')`
        this.container.append(monster)
        this.monsters.push({
            element: monster,
            type: 'powerStar',
            x: posX,
            y: posY,
            width: size,
            height: size,
            collisionRadius: size * 0.5 + this.config.monsters.collisionPadding,
            velocityX: velocity.x,
            velocityY: velocity.y,
            directionTimerMs: randomInteger(
                this.config.monsters.directionChangeMinMs,
                this.config.monsters.directionChangeMaxMs
            )
        })
    }

    spawnHeartPickup(levelConfig) {
        const { posX, posY } = this.calculatePositions()
        const size = this.config.monsters.heartPickupSize
        const monster = this.createMonsterElement(posX, posY, size, size)
        const velocity = this.createVelocity(levelConfig, 0.8)
        const texture = createHeartTexture(this.document, size)

        monster.classList.add('heartPickup')
        monster.style.backgroundImage = `url('${texture}')`
        this.container.append(monster)
        this.monsters.push({
            element: monster,
            type: 'heartPickup',
            x: posX,
            y: posY,
            width: size,
            height: size,
            collisionRadius: size * 0.46 + this.config.monsters.collisionPadding,
            velocityX: velocity.x,
            velocityY: velocity.y,
            directionTimerMs: randomInteger(
                this.config.monsters.directionChangeMinMs,
                this.config.monsters.directionChangeMaxMs
            )
        })
    }

    createMonsterElement(posX, posY, width, height) {
        const monster = this.document.createElement('div')

        monster.classList.add('__monsters')
        monster.style.width = `${width}px`
        monster.style.height = `${height}px`
        monster.style.setProperty('--x', `${posX}px`)
        monster.style.setProperty('--y', `${posY}px`)

        return monster
    }

    update(playerPosition, isPlayerSafe, isPlayerInvincible, deltaSeconds) {
        this.lastPlayerPosition = playerPosition
        this.monsters = this.monsters.filter(monster => monster.element.isConnected)
        this.updateRespawns(deltaSeconds)

        this.updateMovement(deltaSeconds)

        if (this.updateShooterAttacks(playerPosition, isPlayerSafe, isPlayerInvincible, deltaSeconds)) {
            return
        }

        if (isPlayerSafe) {
            return
        }

        for (const monster of this.monsters) {
            if (monster.type === 'villain') {
                monster.nearMissCooldownMs = Math.max(0, (monster.nearMissCooldownMs ?? 0) - deltaSeconds * 1000)
            }

            const collisionDistance = this.getCollisionDistance(monster, playerPosition)
            const collided = collisionDistance <= 0

            if (!collided) {
                if (
                    monster.type === 'villain' &&
                    !isPlayerInvincible &&
                    monster.nearMissCooldownMs <= 0 &&
                    collisionDistance <= this.config.monsters.nearMissDistance
                ) {
                    monster.nearMissCooldownMs = this.config.monsters.nearMissCooldownMs
                    this.onNearMiss?.()
                }
                continue
            }

            if (monster.type === 'villain') {
                if (isPlayerInvincible) {
                    monster.element.classList.add('__destruction')
                    this.removeMonster(monster.element, { allowRespawn: true })
                    continue
                }

                this.onVillainCollision()
                return
            }

            this.removeMonster(monster.element)

            if (monster.type === 'powerStar') {
                this.onStarCollision()
                return
            }

            if (monster.type === 'heartPickup') {
                this.onHeartCollision()
                return
            }

            this.onBonusCollision()
            return
        }
    }

    getCollisionDistance(monster, playerPosition) {
        const playerCenterX = playerPosition.x + playerPosition.width / 2
        const playerCenterY = playerPosition.y + playerPosition.height / 2
        const monsterCenterX = monster.x + monster.width / 2
        const monsterCenterY = monster.y + monster.height / 2
        const distance = Math.hypot(playerCenterX - monsterCenterX, playerCenterY - monsterCenterY)
        const playerRadius = playerPosition.collisionRadius

        return distance - (monster.collisionRadius + playerRadius)
    }

    getMonsterByElement(element) {
        return this.monsters.find(monster => monster.element === element) ?? null
    }

    getNearestVillain(position) {
        let nearestMonster = null
        let nearestDistance = Infinity

        for (const monster of this.monsters) {
            if (monster.type !== 'villain' || !monster.element.isConnected || monster.element.classList.contains('__destruction')) {
                continue
            }

            const distance = Math.hypot(
                (monster.x + monster.width / 2) - (position.x + position.width / 2),
                (monster.y + monster.height / 2) - (position.y + position.height / 2)
            )

            if (distance < nearestDistance) {
                nearestDistance = distance
                nearestMonster = monster
            }
        }

        return nearestMonster
    }

    getFirstVillainOnRay(origin, direction, maxDistance) {
        let bestHit = null
        let bestProjection = maxDistance

        for (const monster of this.monsters) {
            if (monster.type !== 'villain' || !monster.element.isConnected || monster.element.classList.contains('__destruction')) {
                continue
            }

            const centerX = monster.x + monster.width / 2
            const centerY = monster.y + monster.height / 2
            const offsetX = centerX - origin.x
            const offsetY = centerY - origin.y
            const projection = offsetX * direction.x + offsetY * direction.y

            if (projection <= 0 || projection >= bestProjection) {
                continue
            }

            const perpendicularDistance = Math.abs(offsetX * direction.y - offsetY * direction.x)

            if (perpendicularDistance > monster.collisionRadius) {
                continue
            }

            bestProjection = projection
            bestHit = {
                monster,
                point: {
                    x: origin.x + direction.x * projection,
                    y: origin.y + direction.y * projection
                }
            }
        }

        return bestHit
    }

    removeAll() {
        this.pendingRespawns = []
        this.monsters.forEach(monster => {
            if (monster.element.isConnected) {
                monster.element.remove()
            }
        })
        this.monsters = []
    }

    resetBaseSize() {
        this.baseWidth = Math.round(window.innerWidth * this.config.monsters.initialSizeRatio)
        this.baseHeight = Math.round(window.innerWidth * this.config.monsters.initialSizeRatio)
    }

    calculatePositions() {
        const safePadding = this.config.safeZone.size + this.config.monsters.spawnOffset
        const posY = Math.floor(Math.random() * this.worldSize.height) + 1
        const posX = Math.floor(Math.random() * this.worldSize.width) + 1

        if (posX <= safePadding && posY <= safePadding) {
            return {
                posY: Math.min(
                    this.worldSize.height - this.baseHeight,
                    Math.max(safePadding, posY + this.config.monsters.spawnOffset)
                ),
                posX: Math.min(
                    this.worldSize.width - this.baseWidth,
                    Math.max(safePadding, posX + this.config.monsters.spawnOffset)
                )
            }
        }

        return {
            posY,
            posX
        }
    }

    updateMovement(deltaSeconds) {
        for (const monster of this.monsters) {
            this.updateMonsterMovement(monster, deltaSeconds)
        }
    }

    updateRespawns(deltaSeconds) {
        if (!this.pendingRespawns.length || !this.activeLevelConfig?.respawnEnabled) {
            return
        }

        const stillPending = []

        for (const pending of this.pendingRespawns) {
            pending.remainingMs -= deltaSeconds * 1000

            if (pending.remainingMs <= 0) {
                this.spawnMonster(this.activeLevelConfig)
                continue
            }

            stillPending.push(pending)
        }

        this.pendingRespawns = stillPending
    }

    updateShooterAttacks(playerPosition, isPlayerSafe, isPlayerInvincible, deltaSeconds) {
        for (const monster of this.monsters) {
            if (monster.type !== 'villain' || !monster.canShoot || monster.element.classList.contains('__destruction')) {
                continue
            }

            monster.beamTimerMs -= deltaSeconds * 1000

            if (monster.beamState === 'idle' && monster.beamTimerMs <= 0) {
                this.startBeamWarning(monster)
                continue
            }

            if (monster.beamState === 'warning' && monster.beamTimerMs <= 0) {
                this.startBeamFiring(monster)
            }

            if (monster.beamState !== 'firing') {
                continue
            }

            const beamDistance = this.getBeamDistance(monster, playerPosition)

            if (!isPlayerSafe && !isPlayerInvincible && beamDistance <= playerPosition.collisionRadius) {
                this.resetBeamVisual(monster)
                this.onVillainCollision()
                return true
            }

            if (
                !isPlayerSafe &&
                !isPlayerInvincible &&
                monster.nearMissCooldownMs <= 0 &&
                beamDistance <= playerPosition.collisionRadius + this.config.monsters.nearMissDistance
            ) {
                monster.nearMissCooldownMs = this.config.monsters.nearMissCooldownMs
                this.onNearMiss?.()
            }

            if (monster.beamTimerMs <= 0) {
                this.resetBeamVisual(monster)
                monster.beamState = 'idle'
                monster.beamTimerMs = this.createShooterCooldown(monster.archetype)
            }
        }

        return false
    }

    updateMonsterMovement(monster, deltaSeconds) {
        monster.directionTimerMs -= deltaSeconds * 1000

        if (monster.directionTimerMs <= 0) {
            this.randomizeDirection(monster)
        }

        if (monster.type === 'villain') {
            this.applyVillainArchetypeMovement(monster)
        }

        const element = monster.element
        let nextX = monster.x + monster.velocityX * deltaSeconds
        let nextY = monster.y + monster.velocityY * deltaSeconds
        const maxX = Math.max(0, this.worldSize.width - monster.width)
        const maxY = Math.max(0, this.worldSize.height - monster.height)

        if (nextX <= 0 || nextX >= maxX) {
            monster.velocityX *= -1
            nextX = Math.min(Math.max(0, nextX), maxX)
            this.addDirectionJitter(monster)
            this.applyRicochetBoost(monster)
        }

        if (nextY <= 0 || nextY >= maxY) {
            monster.velocityY *= -1
            nextY = Math.min(Math.max(0, nextY), maxY)
            this.addDirectionJitter(monster)
            this.applyRicochetBoost(monster)
        }

        monster.x = nextX
        monster.y = nextY
        element.style.setProperty('--x', `${nextX}px`)
        element.style.setProperty('--y', `${nextY}px`)
    }

    createVelocity(levelConfig, speedScale = 1) {
        const baseSpeed = randomFloat(this.config.monsters.minSpeed, this.config.monsters.maxSpeed)
        const speed = baseSpeed * levelConfig.animationDurationMultiplier * speedScale
        const angle = randomFloat(0, Math.PI * 2)

        return {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        }
    }

    randomizeDirection(monster) {
        const speed = Math.max(12, Math.hypot(monster.velocityX, monster.velocityY))
        const angle = randomFloat(0, Math.PI * 2)

        monster.velocityX = Math.cos(angle) * speed
        monster.velocityY = Math.sin(angle) * speed
        monster.directionTimerMs = randomInteger(
            this.scaleDirectionTimer(this.config.monsters.directionChangeMinMs, monster.archetype),
            this.scaleDirectionTimer(this.config.monsters.directionChangeMaxMs, monster.archetype)
        )
    }

    addDirectionJitter(monster) {
        const jitterMultiplier = this.getArchetypeConfig(monster.archetype).jitterMultiplier ?? 1

        monster.velocityX += randomFloat(-1, 1) * this.config.monsters.turnJitter * 18 * jitterMultiplier
        monster.velocityY += randomFloat(-1, 1) * this.config.monsters.turnJitter * 18 * jitterMultiplier
    }

    applyDamage(monster, amount = 1) {
        if (!monster || monster.type !== 'villain' || monster.element.classList.contains('__destruction')) {
            return { destroyed: false, hitPoints: 0 }
        }

        monster.hitPoints = Math.max(0, monster.hitPoints - amount)
        this.updateDamageVisual(monster)

        if (monster.hitPoints > 0) {
            return { destroyed: false, hitPoints: monster.hitPoints }
        }

        monster.element.classList.add('__destruction')
        return { destroyed: true, hitPoints: 0 }
    }

    updateDamageVisual(monster) {
        const damageLevel = Math.max(0, monster.maxHitPoints - monster.hitPoints)

        if (damageLevel <= 0) {
            delete monster.element.dataset.damage
            return
        }

        monster.element.dataset.damage = String(damageLevel)
    }

    finalizeDestroyedMonster(monster) {
        if (!monster?.element) {
            return
        }

        this.removeMonster(monster.element, { allowRespawn: true })
    }

    removeMonster(monsterElement, options = {}) {
        const monster = this.getMonsterByElement(monsterElement)
        const shouldRespawn = Boolean(
            options.allowRespawn &&
            monster?.type === 'villain' &&
            this.activeLevelConfig?.respawnEnabled
        )

        if (shouldRespawn) {
            this.pendingRespawns.push({
                remainingMs: randomInteger(
                    this.config.monsters.respawnDelayMinMs,
                    this.config.monsters.respawnDelayMaxMs
                )
            })
        }

        this.monsters = this.monsters.filter(item => item.element !== monsterElement)

        if (monsterElement && monsterElement.isConnected) {
            monsterElement.remove()
        }
    }

    startBeamWarning(monster) {
        const warningMultiplier = this.getArchetypeConfig(monster.archetype).warningMultiplier ?? 1

        monster.beamState = 'warning'
        monster.beamAngle = randomFloat(0, Math.PI * 2)
        monster.beamTimerMs = this.config.monsters.shooterWarningMs * warningMultiplier
        monster.element.style.setProperty('--beam-angle', `${monster.beamAngle}rad`)
        monster.element.classList.add('__charging')
        monster.element.classList.remove('__shooting')
    }

    startBeamFiring(monster) {
        monster.beamState = 'firing'
        monster.beamTimerMs = this.config.monsters.shooterBeamDurationMs
        monster.element.classList.add('__shooting')
        monster.element.classList.remove('__charging')
    }

    resetBeamVisual(monster) {
        monster.element.classList.remove('__charging', '__shooting')
    }

    getBeamDistance(monster, playerPosition) {
        const beamLength = Math.hypot(this.worldSize.width, this.worldSize.height)
        const startX = monster.x + monster.width / 2
        const startY = monster.y + monster.height / 2
        const endX = startX + Math.cos(monster.beamAngle) * beamLength
        const endY = startY + Math.sin(monster.beamAngle) * beamLength
        const playerCenterX = playerPosition.x + playerPosition.width / 2
        const playerCenterY = playerPosition.y + playerPosition.height / 2
        const distance = pointToSegmentDistance(playerCenterX, playerCenterY, startX, startY, endX, endY)

        return distance
    }

    pickVillainArchetype(levelConfig) {
        const level = levelConfig.level ?? 1
        const availableArchetypes = []

        if (level >= this.config.archetypes.cowardStartLevel) {
            availableArchetypes.push('coward')
        }

        if (level >= this.config.archetypes.ricochetStartLevel) {
            availableArchetypes.push('ricochet')
        }

        if (level >= this.config.archetypes.suicideStartLevel) {
            availableArchetypes.push('suicide')
        }

        if (level >= this.config.archetypes.sniperStartLevel) {
            availableArchetypes.push('sniper')
        }

        if (level >= this.config.archetypes.blockerStartLevel) {
            availableArchetypes.push('blocker')
        }

        for (const archetype of availableArchetypes) {
            if (Math.random() < (this.getArchetypeConfig(archetype).chance ?? 0)) {
                return archetype
            }
        }

        return 'base'
    }

    getArchetypeConfig(archetype) {
        return this.config.archetypes[archetype] ?? {}
    }

    shouldEnableShooter(levelConfig, archetype) {
        if (!levelConfig.shooterEnabled) {
            return false
        }

        if (archetype === 'sniper') {
            return true
        }

        if (archetype === 'blocker' || archetype === 'suicide') {
            return false
        }

        return Math.random() < levelConfig.shooterFraction
    }

    scaleDirectionTimer(value, archetype) {
        const multiplier = this.getArchetypeConfig(archetype).directionTimerMultiplier ?? 1
        return Math.max(250, Math.round(value * multiplier))
    }

    createShooterCooldown(archetype) {
        const multiplier = this.getArchetypeConfig(archetype).cooldownMultiplier ?? 1
        const min = Math.max(350, Math.round(this.config.monsters.shooterCooldownMinMs * multiplier))
        const max = Math.max(min + 1, Math.round(this.config.monsters.shooterCooldownMaxMs * multiplier))

        return randomInteger(min, max)
    }

    applyVillainArchetypeMovement(monster) {
        if (!this.lastPlayerPosition) {
            return
        }

        if (monster.archetype === 'coward') {
            const settings = this.getArchetypeConfig('coward')
            const monsterCenterX = monster.x + monster.width / 2
            const monsterCenterY = monster.y + monster.height / 2
            const playerCenterX = this.lastPlayerPosition.x + this.lastPlayerPosition.width / 2
            const playerCenterY = this.lastPlayerPosition.y + this.lastPlayerPosition.height / 2
            const deltaX = monsterCenterX - playerCenterX
            const deltaY = monsterCenterY - playerCenterY
            const distance = Math.hypot(deltaX, deltaY)

            if (distance === 0 || distance > settings.escapeTriggerDistance) {
                return
            }

            const normalizedX = deltaX / distance
            const normalizedY = deltaY / distance
            const escapeFactor = 1 - distance / settings.escapeTriggerDistance
            const boost = settings.escapeBoost * escapeFactor

            monster.velocityX += normalizedX * boost
            monster.velocityY += normalizedY * boost

            const speed = Math.hypot(monster.velocityX, monster.velocityY)
            const maxSpeed = this.config.monsters.maxSpeed * (settings.maxSpeedMultiplier ?? 1)

            if (speed > maxSpeed) {
                const scale = maxSpeed / speed
                monster.velocityX *= scale
                monster.velocityY *= scale
            }

            return
        }

        if (monster.archetype !== 'suicide') {
            return
        }

        const settings = this.getArchetypeConfig('suicide')
        const monsterCenterX = monster.x + monster.width / 2
        const monsterCenterY = monster.y + monster.height / 2
        const playerCenterX = this.lastPlayerPosition.x + this.lastPlayerPosition.width / 2
        const playerCenterY = this.lastPlayerPosition.y + this.lastPlayerPosition.height / 2
        const deltaX = playerCenterX - monsterCenterX
        const deltaY = playerCenterY - monsterCenterY
        const distance = Math.hypot(deltaX, deltaY)

        if (distance === 0 || distance > settings.diveTriggerDistance) {
            return
        }

        const normalizedX = deltaX / distance
        const normalizedY = deltaY / distance
        const diveFactor = 1 - distance / settings.diveTriggerDistance
        const boost = settings.diveBoost * diveFactor

        monster.velocityX += normalizedX * boost
        monster.velocityY += normalizedY * boost

        const speed = Math.hypot(monster.velocityX, monster.velocityY)
        const maxSpeed = this.config.monsters.maxSpeed * (settings.maxSpeedMultiplier ?? 1)

        if (speed > maxSpeed) {
            const scale = maxSpeed / speed
            monster.velocityX *= scale
            monster.velocityY *= scale
        }
    }

    applyRicochetBoost(monster) {
        if (monster.archetype !== 'ricochet') {
            return
        }

        const boost = this.getArchetypeConfig('ricochet').bounceBoost ?? 1

        monster.velocityX *= boost
        monster.velocityY *= boost
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

function pickRandom(items) {
    return items[(Math.random() * items.length) | 0]
}

function createPlanetTexture(document, size) {
    const dimension = Math.max(32, Math.round(size))
    const paletteIndex = randomInteger(0, PALETTES.length)
    const cacheKey = `${dimension}:${paletteIndex}`
    const cachedTexture = PLANET_TEXTURE_CACHE.get(cacheKey)

    if (cachedTexture) {
        return cachedTexture
    }

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const palette = PALETTES[paletteIndex]
    const center = dimension / 2
    const radius = dimension * 0.48

    canvas.width = dimension
    canvas.height = dimension

    const gradient = context.createRadialGradient(
        center - radius * 0.35,
        center - radius * 0.35,
        radius * 0.12,
        center,
        center,
        radius
    )
    gradient.addColorStop(0, palette.light)
    gradient.addColorStop(0.55, palette.base)
    gradient.addColorStop(1, palette.dark)

    context.fillStyle = gradient
    context.beginPath()
    context.arc(center, center, radius, 0, Math.PI * 2)
    context.fill()

    context.save()
    context.globalAlpha = 0.28
    context.strokeStyle = palette.band
    context.lineWidth = Math.max(2, dimension * 0.07)
    context.beginPath()
    context.arc(center, center + dimension * 0.04, radius * 0.72, Math.PI * 0.12, Math.PI * 0.92)
    context.stroke()
    context.restore()

    for (let i = 0; i < 3; i++) {
        const craterRadius = randomFloat(radius * 0.08, radius * 0.18)
        const angle = randomFloat(0, Math.PI * 2)
        const distance = randomFloat(radius * 0.12, radius * 0.46)
        const x = center + Math.cos(angle) * distance
        const y = center + Math.sin(angle) * distance

        context.fillStyle = palette.crater
        context.globalAlpha = 0.45
        context.beginPath()
        context.arc(x, y, craterRadius, 0, Math.PI * 2)
        context.fill()
    }

    context.globalAlpha = 1
    context.strokeStyle = 'rgba(255,255,255,0.18)'
    context.lineWidth = Math.max(1, dimension * 0.03)
    context.beginPath()
    context.arc(center, center, radius - context.lineWidth, 0, Math.PI * 2)
    context.stroke()

    const texture = canvas.toDataURL('image/png')
    PLANET_TEXTURE_CACHE.set(cacheKey, texture)
    return texture
}

function createStarTexture(document, size) {
    const dimension = Math.max(36, Math.round(size))
    const cachedTexture = STAR_TEXTURE_CACHE.get(dimension)

    if (cachedTexture) {
        return cachedTexture
    }

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const center = dimension / 2
    const outerRadius = dimension * 0.42
    const innerRadius = dimension * 0.2

    canvas.width = dimension
    canvas.height = dimension

    context.clearRect(0, 0, dimension, dimension)
    context.save()
    context.translate(center, center)
    context.rotate(-Math.PI / 2)

    context.beginPath()
    for (let i = 0; i < 5; i++) {
        context.lineTo(Math.cos((Math.PI * 2 * i) / 5) * outerRadius, Math.sin((Math.PI * 2 * i) / 5) * outerRadius)
        context.lineTo(
            Math.cos((Math.PI * 2 * i) / 5 + Math.PI / 5) * innerRadius,
            Math.sin((Math.PI * 2 * i) / 5 + Math.PI / 5) * innerRadius
        )
    }
    context.closePath()

    const gradient = context.createLinearGradient(0, -outerRadius, 0, outerRadius)
    gradient.addColorStop(0, '#fff6be')
    gradient.addColorStop(0.48, '#ffd94f')
    gradient.addColorStop(1, '#ff9f1c')
    context.fillStyle = gradient
    context.shadowColor = 'rgba(255, 228, 122, 0.85)'
    context.shadowBlur = Math.max(8, dimension * 0.16)
    context.fill()
    context.restore()

    context.strokeStyle = 'rgba(255,255,255,0.65)'
    context.lineWidth = Math.max(1, dimension * 0.03)
    context.beginPath()
    context.arc(center - dimension * 0.1, center - dimension * 0.06, dimension * 0.04, 0, Math.PI * 2)
    context.stroke()

    const texture = canvas.toDataURL('image/png')
    STAR_TEXTURE_CACHE.set(dimension, texture)
    return texture
}

function createHeartTexture(document, size) {
    const dimension = Math.max(32, Math.round(size))
    const cachedTexture = HEART_TEXTURE_CACHE.get(dimension)

    if (cachedTexture) {
        return cachedTexture
    }

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const top = dimension * 0.3
    const left = dimension * 0.22
    const right = dimension * 0.78
    const bottom = dimension * 0.82

    canvas.width = dimension
    canvas.height = dimension

    const gradient = context.createLinearGradient(0, top, 0, bottom)
    gradient.addColorStop(0, '#ffd5dc')
    gradient.addColorStop(0.45, '#ff6f8d')
    gradient.addColorStop(1, '#cb234b')

    context.fillStyle = gradient
    context.beginPath()
    context.moveTo(dimension / 2, bottom)
    context.bezierCurveTo(dimension * 0.08, dimension * 0.62, dimension * 0.08, top, left, top)
    context.arc(left + dimension * 0.1, top, dimension * 0.12, Math.PI, 0, false)
    context.arc(right - dimension * 0.1, top, dimension * 0.12, Math.PI, 0, false)
    context.bezierCurveTo(dimension * 0.92, top, dimension * 0.92, dimension * 0.62, dimension / 2, bottom)
    context.closePath()
    context.shadowColor = 'rgba(255, 114, 153, 0.55)'
    context.shadowBlur = Math.max(8, dimension * 0.16)
    context.fill()

    context.shadowBlur = 0
    context.fillStyle = 'rgba(255,255,255,0.32)'
    context.beginPath()
    context.ellipse(dimension * 0.4, dimension * 0.34, dimension * 0.09, dimension * 0.05, -0.35, 0, Math.PI * 2)
    context.fill()

    const texture = canvas.toDataURL('image/png')
    HEART_TEXTURE_CACHE.set(dimension, texture)
    return texture
}

const PLANET_TEXTURE_CACHE = new Map()
const STAR_TEXTURE_CACHE = new Map()
const HEART_TEXTURE_CACHE = new Map()

const PALETTES = [
    {
        light: '#8af6ff',
        base: '#29d3ff',
        dark: '#0573d6',
        band: '#9df4ff',
        crater: '#04518d'
    },
    {
        light: '#ffd36d',
        base: '#ff9836',
        dark: '#cf4b08',
        band: '#ffe39e',
        crater: '#8c2f02'
    },
    {
        light: '#ff95dc',
        base: '#ff4fb0',
        dark: '#b81f72',
        band: '#ffc0ea',
        crater: '#6a1445'
    },
    {
        light: '#b1ff9e',
        base: '#55d76a',
        dark: '#248c4b',
        band: '#d5ffc6',
        crater: '#165c32'
    },
    {
        light: '#d5c1ff',
        base: '#9d79ff',
        dark: '#563ac2',
        band: '#efe6ff',
        crater: '#34207f'
    }
]
