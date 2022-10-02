export class Monsters {
    constructor(doc) {
        this.doc = doc
        this._width = 30
        this._height = 30

    }

    newMonster() {
        this.increaseSize()
        this._positionY = (Math.floor(Math.random() * window.innerHeight) + 1) - 40
        this._positionX = (Math.floor(Math.random() * window.innerWidth) + 1) - 40
        this._newMonster = this.doc._document.createElement('div')
        this._selector = this.doc._document.querySelector('.container')
        this._newMonster.classList.add('__monsters')
        this._newMonster.style.width = `${this._width}px`
        this._newMonster.style.height = `${this._height}px`
        this._newMonster.style.top = `${this._positionY}px`
        this._newMonster.style.left = `${this._positionX}px`
        this._selector.append(this._newMonster)

    }

    removeAllMonsters() {
        this.resetSize()
        this.doc._document.querySelectorAll('.__monsters').forEach(n => n.remove());

    }
    resetSize() {
        this._width = 30
        this._height = 30
    }
    increaseSize() {
        this._width += 15
        this._height += 15
    }
}