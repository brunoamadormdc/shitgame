export class Monsters {
    constructor(doc) {
        this.doc = doc
        this._width = 60
        this._height = 60

    }

    newMonster() {
        this.increaseSize()
        this._positionY = (Math.floor(Math.random() * window.innerHeight) + 1) - 150
        this._positionX = (Math.floor(Math.random() * window.innerWidth) + 1) - 150
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
        this._width = 50
        this._height = 50
    }
    increaseSize() {
        this._width = getRandomInteger(60, 200)
        this._height = getRandomInteger(60, 200)
    }

}

function getRandomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
