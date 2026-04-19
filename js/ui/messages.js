export class Messages {
    constructor(document) {
        this.document = document
        this.body = document.querySelector('body')
    }

    show({ variant = 'neutral', eyebrow = 'Status', title, description, hint }) {
        let overlay = this.document.querySelector('.__overlay')

        if (!overlay) {
            overlay = this.document.createElement('section')
            overlay.className = '__overlay'
            overlay.setAttribute('role', 'dialog')
            overlay.setAttribute('aria-live', 'polite')
            overlay.setAttribute('aria-modal', 'true')
            overlay.innerHTML = `
                <div class="__overlayBackdrop"></div>
                <div class="__overlayPanel">
                    <span class="__overlayEyebrow"></span>
                    <h1 class="__overlayTitle"></h1>
                    <p class="__overlayDescription"></p>
                    <p class="__overlayHint"></p>
                </div>
            `
            this.body.append(overlay)
        }

        overlay.dataset.variant = variant
        overlay.querySelector('.__overlayEyebrow').textContent = eyebrow
        overlay.querySelector('.__overlayTitle').textContent = title
        overlay.querySelector('.__overlayDescription').textContent = description
        overlay.querySelector('.__overlayHint').textContent = hint
        overlay.setAttribute('aria-label', title)

        return overlay
    }

    hide() {
        const overlay = this.document.querySelector('.__overlay')

        if (overlay) {
            overlay.remove()
        }
    }
}
