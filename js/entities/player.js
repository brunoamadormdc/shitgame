export class Player {
    constructor(document, config) {
        this.document = document
        this.config = config
        this.positionX = 0
        this.positionY = 0
        this.width = 0
        this.height = 0
        this.isSafe = true
        this.isInvincible = false
        this.element = this.document.createElement('div')
        this.element.classList.add('__player')
    }

    mount(container) {
        container.append(this.element)
        this.updateDimensions()
        this.render()
    }

    updateDimensions() {
        const calculatedSize = Math.round(window.innerWidth * this.config.player.sizeRatio)
        const size = Math.min(
            this.config.player.maxSize,
            Math.max(this.config.player.minSize, calculatedSize)
        )

        this.width = size
        this.height = size
        this.element.style.width = `${this.width}px`
        this.element.style.height = `${this.height}px`
        this.element.style.backgroundImage = `url('${createPlayerTexture(this.document, size)}')`
        this.element.style.backgroundSize = `${this.height}px ${this.width}px`
    }

    move(direction, amount) {
        if (direction === 'right') {
            this.positionX += amount
        }
        if (direction === 'left') {
            this.positionX -= amount
        }
        if (direction === 'up') {
            this.positionY -= amount
        }
        if (direction === 'down') {
            this.positionY += amount
        }
    }

    moveByVector(x, y, amount) {
        this.positionX += x * amount
        this.positionY += y * amount
    }

    moveByInput(keyState, amount) {
        if (keyState.ArrowRight) {
            this.move('right', amount)
        }
        if (keyState.ArrowLeft) {
            this.move('left', amount)
        }
        if (keyState.ArrowUp) {
            this.move('up', amount)
        }
        if (keyState.ArrowDown) {
            this.move('down', amount)
        }
    }

    clampToWorld(worldWidth, worldHeight) {
        const maxX = Math.max(0, worldWidth - this.width)
        const maxY = Math.max(0, worldHeight - this.height)

        this.positionX = Math.min(Math.max(0, this.positionX), maxX)
        this.positionY = Math.min(Math.max(0, this.positionY), maxY)
    }

    resetPosition() {
        this.positionX = 0
        this.positionY = 0
        this.render()
    }

    render() {
        this.element.style.top = `${this.positionY}px`
        this.element.style.left = `${this.positionX}px`
    }

    setSafe(isSafe) {
        this.isSafe = isSafe
        this.syncClasses()
    }

    setInvincible(isInvincible) {
        this.isInvincible = isInvincible
        this.syncClasses()
    }

    syncClasses() {
        this.element.className = '__player'
        this.element.classList.add(this.isSafe ? '__safe' : '__notSafe')

        if (this.isInvincible) {
            this.element.classList.add('__invincible')
        }
    }

    isInsideSafeZone() {
        const threshold = this.config.safeZone.threshold
        return this.positionX <= threshold && this.positionY <= threshold
    }

    getPosition() {
        return {
            x: this.positionX,
            y: this.positionY,
            width: this.width,
            height: this.height,
            collisionRadius: Math.max(this.width, this.height) * this.config.player.collisionRadiusMultiplier
        }
    }
}

function createPlayerTexture(document, size) {
    const canvas = document.createElement('canvas')
    const dimension = Math.max(32, Math.round(size))
    const context = canvas.getContext('2d')
    const center = dimension / 2

    canvas.width = dimension
    canvas.height = dimension

    context.clearRect(0, 0, dimension, dimension)

    context.fillStyle = '#83f7ff'
    context.beginPath()
    context.arc(center, center, dimension * 0.22, 0, Math.PI * 2)
    context.fill()

    const bodyGradient = context.createLinearGradient(center, dimension * 0.16, center, dimension * 0.84)
    bodyGradient.addColorStop(0, '#f4fbff')
    bodyGradient.addColorStop(0.45, '#79f2ff')
    bodyGradient.addColorStop(1, '#0e7ee0')
    context.fillStyle = bodyGradient
    context.beginPath()
    context.ellipse(center, center, dimension * 0.28, dimension * 0.36, 0, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = 'rgba(255,255,255,0.8)'
    context.beginPath()
    context.ellipse(center, center - dimension * 0.1, dimension * 0.18, dimension * 0.08, 0, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#14335e'
    context.beginPath()
    context.arc(center, center - dimension * 0.1, dimension * 0.09, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#ffcd56'
    context.beginPath()
    context.moveTo(center - dimension * 0.12, center + dimension * 0.16)
    context.lineTo(center + dimension * 0.12, center + dimension * 0.16)
    context.lineTo(center, dimension * 0.9)
    context.closePath()
    context.fill()

    context.strokeStyle = 'rgba(255,255,255,0.18)'
    context.lineWidth = Math.max(1, dimension * 0.03)
    context.beginPath()
    context.ellipse(center, center, dimension * 0.28, dimension * 0.36, 0, 0, Math.PI * 2)
    context.stroke()

    return canvas.toDataURL('image/png')
}
