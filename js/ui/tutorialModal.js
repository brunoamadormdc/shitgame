export class TutorialModal {
    constructor(document, { onClose }) {
        this.document = document
        this.body = document.querySelector('body')
        this.onClose = onClose
        this.root = null
        this.currentPage = 0
        this.pages = [
            {
                eyebrow: '01',
                title: 'Mover e atirar',
                description: 'WASD move a nave, setas miram, Espaço dispara o laser ilimitado e Shift usa o cometa.',
                details: [
                    'No joystick: stick esquerdo move e stick direito mira.',
                    'R2 atira laser, R1 usa cometa, L2 acelera e L1 desacelera.'
                ]
            },
            {
                eyebrow: '02',
                title: 'Objetivo e armadilhas',
                description: 'Encontre o Level UP verdadeiro, alcance o portal e avance de fase.',
                details: [
                    'O portal verdadeiro foge da nave e nasce fora da tela.',
                    'O portal falso parece objetivo, mas te pune se você encostar.'
                ]
            },
            {
                eyebrow: '03',
                title: 'Vidas e ameaças',
                description: 'Você começa com 3 vidas. Encostar em vilão ou raio inimigo custa uma vida.',
                details: [
                    'Star te deixa invulnerável por alguns segundos.',
                    'Cometa é tiro especial que mata em um hit.',
                    'Há raridades: coward, ricochet, suicida, sniper e blocker.'
                ]
            },
            {
                eyebrow: '04',
                title: 'Score e ranking',
                description: 'Cada hit de laser vale 10 pontos multiplicados pelo nível atual.',
                details: [
                    'Combo x5 ou mais multiplica ainda mais a pontuação.',
                    'O top 5 local fica salvo no navegador.',
                    'Chegar em níveis altos pesa muito no ranking.'
                ]
            }
        ]
    }

    mount() {
        if (this.root) {
            return
        }

        this.root = this.document.createElement('section')
        this.root.className = '__tutorialModal'
        this.root.innerHTML = `
            <div class="__tutorialBackdrop"></div>
            <div class="__tutorialPanel" role="dialog" aria-modal="true" aria-label="Tutorial">
                <div class="__tutorialHeader">
                    <span class="__tutorialEyebrow"></span>
                    <strong class="__tutorialTitle"></strong>
                </div>
                <div class="__tutorialTabs"></div>
                <p class="__tutorialDescription"></p>
                <div class="__tutorialDetails"></div>
                <div class="__tutorialActions">
                    <button type="button" class="__tutorialAction __tutorialAction--ghost" data-role="close">Fechar</button>
                </div>
            </div>
        `

        const tabs = this.root.querySelector('.__tutorialTabs')

        this.pages.forEach((page, index) => {
            const button = this.document.createElement('button')
            button.type = 'button'
            button.className = '__tutorialTab'
            button.textContent = String(index + 1)
            button.addEventListener('click', () => this.showPage(index))
            tabs.append(button)
        })

        this.root.querySelector('[data-role="close"]').addEventListener('click', () => this.hide())
        this.body.append(this.root)
    }

    show(initialPage = 0) {
        this.mount()
        this.root.classList.add('__visible')
        this.showPage(initialPage)
    }

    hide() {
        if (!this.root) {
            return
        }

        this.root.classList.remove('__visible')
        this.onClose?.()
    }

    isVisible() {
        return Boolean(this.root?.classList.contains('__visible'))
    }

    showPage(index) {
        this.currentPage = Math.max(0, Math.min(index, this.pages.length - 1))
        const page = this.pages[this.currentPage]

        this.root.querySelector('.__tutorialEyebrow').textContent = `Tutorial ${page.eyebrow}`
        this.root.querySelector('.__tutorialTitle').textContent = page.title
        this.root.querySelector('.__tutorialDescription').textContent = page.description
        this.root.querySelector('.__tutorialDetails').innerHTML = page.details.map(detail => `
            <div class="__tutorialDetail">${detail}</div>
        `).join('')

        const tabButtons = this.root.querySelectorAll('.__tutorialTab')
        tabButtons.forEach((button, buttonIndex) => {
            button.classList.toggle('__active', buttonIndex === this.currentPage)
        })
    }
}
