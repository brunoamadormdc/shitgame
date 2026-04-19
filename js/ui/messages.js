export class Messages {
    constructor(document) {
        this.document = document
        this.body = document.querySelector('body')
    }

    show({ variant = 'neutral', eyebrow = 'Status', title, description, hint, stats = [], leaderboard = [], actions = [] }) {
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
                    <div class="__overlayStats"></div>
                    <div class="__overlayLeaderboard"></div>
                    <p class="__overlayHint"></p>
                    <div class="__overlayActions"></div>
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
        this.renderStats(overlay.querySelector('.__overlayStats'), stats)
        this.renderLeaderboard(overlay.querySelector('.__overlayLeaderboard'), leaderboard)
        this.renderActions(overlay.querySelector('.__overlayActions'), actions)

        return overlay
    }

    renderStats(root, stats) {
        if (!root) {
            return
        }

        if (!stats.length) {
            root.innerHTML = ''
            root.hidden = true
            return
        }

        root.hidden = false
        root.innerHTML = stats.map(({ label, value }) => `
            <div class="__overlayStat">
                <span class="__overlayStatLabel">${label}</span>
                <strong class="__overlayStatValue">${value}</strong>
            </div>
        `).join('')
    }

    renderLeaderboard(root, leaderboard) {
        if (!root) {
            return
        }

        if (!leaderboard.length) {
            root.innerHTML = ''
            root.hidden = true
            return
        }

        root.hidden = false
        root.innerHTML = `
            <span class="__overlaySectionTitle">Top local</span>
            <ol class="__overlayRankList">
                ${leaderboard.map((entry) => `
                    <li class="__overlayRankItem">
                        <span>#${entry.position} LV ${entry.level}</span>
                        <strong>${entry.score}</strong>
                    </li>
                `).join('')}
            </ol>
        `
    }

    renderActions(root, actions) {
        if (!root) {
            return
        }

        root.innerHTML = ''

        if (!actions.length) {
            root.hidden = true
            return
        }

        root.hidden = false

        actions.forEach(({ label, kind = 'secondary', onClick }) => {
            const button = this.document.createElement('button')
            button.type = 'button'
            button.className = `__overlayAction __overlayAction--${kind}`
            button.textContent = label

            if (typeof onClick === 'function') {
                button.addEventListener('click', onClick)
            }

            root.append(button)
        })
    }

    hide() {
        const overlay = this.document.querySelector('.__overlay')

        if (overlay) {
            overlay.remove()
        }
    }
}
