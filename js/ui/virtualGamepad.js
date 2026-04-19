export class VirtualGamepad {
    constructor(document) {
        this.document = document
        this.body = document.querySelector('body')
        this.root = null
        this.moveVector = { x: 0, y: 0 }
        this.aimVector = { x: 0, y: 0 }
        this.pendingAttack = false
        this.pendingSpecial = false
    }

    mount() {
        if (this.root) {
            return
        }

        this.root = this.document.createElement('section')
        this.root.className = '__virtualGamepad'
        this.root.innerHTML = `
            <div class="__virtualStick" data-role="move">
                <div class="__virtualThumb"></div>
            </div>
            <div class="__virtualRight">
                <div class="__virtualStick __aimStick" data-role="aim">
                    <div class="__virtualThumb"></div>
                </div>
                <div class="__virtualButtons">
                    <button type="button" class="__virtualButton __laserButton" data-role="attack">Laser</button>
                    <button type="button" class="__virtualButton __specialButton" data-role="special">Cometa</button>
                </div>
            </div>
        `

        this.bindStick(this.root.querySelector('[data-role="move"]'), (vector) => {
            this.moveVector = vector
        })
        this.bindStick(this.root.querySelector('[data-role="aim"]'), (vector) => {
            this.aimVector = vector
        })
        this.root.querySelector('[data-role="attack"]').addEventListener('touchstart', (event) => {
            event.preventDefault()
            this.pendingAttack = true
        }, { passive: false })
        this.root.querySelector('[data-role="special"]').addEventListener('touchstart', (event) => {
            event.preventDefault()
            this.pendingSpecial = true
        }, { passive: false })
        this.body.append(this.root)
    }

    bindStick(element, onChange) {
        const thumb = element.querySelector('.__virtualThumb')
        const maxRadius = 34

        const updateFromTouch = (touch) => {
            const rect = element.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            const rawX = touch.clientX - centerX
            const rawY = touch.clientY - centerY
            const distance = Math.hypot(rawX, rawY)
            const clampedDistance = Math.min(distance, maxRadius)
            const angle = Math.atan2(rawY, rawX)
            const x = distance === 0 ? 0 : Math.cos(angle) * clampedDistance
            const y = distance === 0 ? 0 : Math.sin(angle) * clampedDistance

            thumb.style.transform = `translate(${x}px, ${y}px)`
            onChange({
                x: x / maxRadius,
                y: y / maxRadius
            })
        }

        const reset = () => {
            thumb.style.transform = 'translate(0, 0)'
            onChange({ x: 0, y: 0 })
        }

        element.addEventListener('touchstart', (event) => {
            event.preventDefault()
            updateFromTouch(event.touches[0])
        }, { passive: false })
        element.addEventListener('touchmove', (event) => {
            event.preventDefault()
            updateFromTouch(event.touches[0])
        }, { passive: false })
        element.addEventListener('touchend', reset)
        element.addEventListener('touchcancel', reset)
    }

    show() {
        this.mount()
        this.root.classList.add('__visible')
    }

    hide() {
        if (!this.root) {
            return
        }

        this.root.classList.remove('__visible')
        this.moveVector = { x: 0, y: 0 }
        this.aimVector = { x: 0, y: 0 }
    }

    isVisible() {
        return Boolean(this.root?.classList.contains('__visible'))
    }

    getSnapshot() {
        const snapshot = {
            x: this.moveVector.x,
            y: this.moveVector.y,
            aimX: this.aimVector.x,
            aimY: this.aimVector.y,
            attackPressed: this.pendingAttack,
            specialAttackPressed: this.pendingSpecial
        }

        this.pendingAttack = false
        this.pendingSpecial = false

        return snapshot
    }
}
