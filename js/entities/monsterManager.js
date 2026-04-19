export class MonsterManager {
    constructor({ document, container, config, onVillainCollision, onBonusCollision, onStarCollision }) {
        this.document = document
        this.container = container
        this.config = config
        this.onVillainCollision = onVillainCollision
        this.onBonusCollision = onBonusCollision
        this.onStarCollision = onStarCollision
        this.monsters = []
        this.resetBaseSize()
    }

    spawnLevel(levelConfig) {
        this.removeAll()

        for (let i = 0; i < levelConfig.villainCount; i++) {
            this.spawnMonster(levelConfig)
        }

        for (let i = 0; i < levelConfig.goodMonsterCount; i++) {
            this.spawnGoodMonster(levelConfig)
        }

        if (Math.random() < this.config.monsters.starSpawnChance) {
            this.spawnStarPickup(levelConfig)
        }
    }

    spawnMonster(levelConfig) {
        const { posX, posY } = this.calculatePositions()
        const randomSizeFactor = randomFloat(
            this.config.monsters.minSizeMultiplier,
            this.config.monsters.maxSizeMultiplier
        )
        const size = this.baseWidth * levelConfig.sizeMultiplier * randomSizeFactor
        const monster = this.createMonsterElement(posX, posY, size, size)
        const velocity = this.createVelocity(levelConfig)
        const texture = createPlanetTexture(this.document, size)

        monster.style.backgroundImage = `url('${texture}')`
        monster.style.borderRadius = '50%'
        this.container.append(monster)
        this.monsters.push({
            element: monster,
            type: 'villain',
            x: posX,
            y: posY,
            width: size,
            height: size,
            collisionRadius: size * this.config.monsters.collisionRadiusMultiplier + this.config.monsters.collisionPadding,
            velocityX: velocity.x,
            velocityY: velocity.y,
            directionTimerMs: randomInteger(
                this.config.monsters.directionChangeMinMs,
                this.config.monsters.directionChangeMaxMs
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

    createMonsterElement(posX, posY, width, height) {
        const monster = this.document.createElement('div')

        monster.classList.add('__monsters')
        monster.style.width = `${width}px`
        monster.style.height = `${height}px`
        monster.style.top = `${posY}px`
        monster.style.left = `${posX}px`

        return monster
    }

    update(playerPosition, isPlayerSafe, isPlayerInvincible, deltaSeconds) {
        this.monsters = this.monsters.filter(monster => monster.element.isConnected)

        this.updateMovement(deltaSeconds)

        if (isPlayerSafe) {
            return
        }

        for (const monster of this.monsters) {
            const collided = this.hasCollision(monster, playerPosition)

            if (!collided) {
                continue
            }

            if (monster.type === 'villain') {
                if (isPlayerInvincible) {
                    monster.element.classList.add('__destruction')
                    this.removeMonster(monster.element)
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

            this.onBonusCollision()
            return
        }
    }

    hasCollision(monster, playerPosition) {
        const playerCenterX = playerPosition.x + playerPosition.width / 2
        const playerCenterY = playerPosition.y + playerPosition.height / 2
        const monsterCenterX = monster.x + monster.width / 2
        const monsterCenterY = monster.y + monster.height / 2
        const distance = Math.hypot(playerCenterX - monsterCenterX, playerCenterY - monsterCenterY)
        const playerRadius = playerPosition.collisionRadius

        return distance <= monster.collisionRadius + playerRadius
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

    removeMonster(monster) {
        this.monsters = this.monsters.filter(item => item.element !== monster)

        if (monster && monster.isConnected) {
            monster.remove()
        }
    }

    removeAll() {
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
        const posFinishY = window.innerHeight - this.config.finishLine.width
        const posFinishX = window.innerWidth - this.config.finishLine.height
        const posY = Math.floor(Math.random() * window.innerHeight) + 1
        const posX = Math.floor(Math.random() * window.innerWidth) + 1

        if ((posX >= posFinishX && posX <= window.innerWidth) && (posY >= posFinishY && posY <= window.innerHeight)) {
            return {
                posY: posY - this.config.monsters.spawnOffset,
                posX: posX - this.config.monsters.spawnOffset
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

    updateMonsterMovement(monster, deltaSeconds) {
        monster.directionTimerMs -= deltaSeconds * 1000

        if (monster.directionTimerMs <= 0) {
            this.randomizeDirection(monster)
        }

        const element = monster.element
        let nextX = monster.x + monster.velocityX * deltaSeconds
        let nextY = monster.y + monster.velocityY * deltaSeconds
        const maxX = Math.max(0, window.innerWidth - monster.width)
        const maxY = Math.max(0, window.innerHeight - monster.height)

        if (nextX <= 0 || nextX >= maxX) {
            monster.velocityX *= -1
            nextX = Math.min(Math.max(0, nextX), maxX)
            this.addDirectionJitter(monster)
        }

        if (nextY <= 0 || nextY >= maxY) {
            monster.velocityY *= -1
            nextY = Math.min(Math.max(0, nextY), maxY)
            this.addDirectionJitter(monster)
        }

        monster.x = nextX
        monster.y = nextY
        element.style.left = `${nextX}px`
        element.style.top = `${nextY}px`
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
            this.config.monsters.directionChangeMinMs,
            this.config.monsters.directionChangeMaxMs
        )
    }

    addDirectionJitter(monster) {
        monster.velocityX += randomFloat(-1, 1) * this.config.monsters.turnJitter * 18
        monster.velocityY += randomFloat(-1, 1) * this.config.monsters.turnJitter * 18
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

function pickRandom(items) {
    return items[(Math.random() * items.length) | 0]
}

function createPlanetTexture(document, size) {
    const canvas = document.createElement('canvas')
    const dimension = Math.max(32, Math.round(size))
    const context = canvas.getContext('2d')
    const palette = pickRandom(PALETTES)
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

    return canvas.toDataURL('image/png')
}

function createStarTexture(document, size) {
    const canvas = document.createElement('canvas')
    const dimension = Math.max(36, Math.round(size))
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

    return canvas.toDataURL('image/png')
}

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
