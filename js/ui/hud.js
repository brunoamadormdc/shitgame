export class Hud {
    constructor(document) {
        this.document = document
        this.body = document.querySelector('body')
        this.root = document.createElement('aside')
        this.levelValue = document.createElement('strong')
        this.stageValue = document.createElement('strong')
        this.speedValue = document.createElement('strong')
        this.lifeElement = document.createElement('div')
        this.hammersValue = document.createElement('strong')

        this.root.className = '__hud'
        this.root.setAttribute('aria-label', 'Game HUD')
        this.lifeElement.classList.add('__life')
    }

    mount() {
        this.root.innerHTML = `
            <div class="__hudCard">
                <span class="__hudLabel">Score</span>
            </div>
            <div class="__hudCard">
                <span class="__hudLabel">Level</span>
            </div>
            <div class="__hudCard">
                <span class="__hudLabel">Speed</span>
            </div>
            <div class="__hudCard __hudLife">
                <span class="__hudLabel">Life</span>
            </div>
            <div class="__hudCard __hudHammers">
                <span class="__hudLabel">Shots</span>
            </div>
        `

        const cards = this.root.querySelectorAll('.__hudCard')
        cards[0].classList.add('__hudCard--compact')
        cards[1].classList.add('__hudCard--compact')
        cards[2].classList.add('__hudCard--compact')
        cards[0].append(this.levelValue)
        cards[1].append(this.stageValue)
        cards[2].append(this.speedValue)
        cards[3].append(this.lifeElement)
        cards[4].append(this.hammersValue)
        this.body.append(this.root)
    }

    update({ score, currentLevel, lives, hammers, movePower }) {
        this.levelValue.textContent = `${score}`
        this.stageValue.textContent = currentLevel
        this.speedValue.textContent = `${Math.round(movePower)}`
        this.hammersValue.textContent = `${hammers}`

        this.lifeElement.className = '__life'

        if (lives === 3) {
            this.lifeElement.classList.add('three')
        }
        if (lives === 2) {
            this.lifeElement.classList.add('two')
        }
        if (lives === 1) {
            this.lifeElement.classList.add('one')
        }
        if (lives <= 0) {
            this.lifeElement.classList.add('zero')
        }
    }
}
