export class Monsters {
    constructor(doc) {
        this.doc = doc
        this._width = 60
        this._height = 60

    }

    newMonster() {
        this.increaseSize()
        this.calculatePositions()        
        this._newMonster = this.doc._document.createElement('div')
        this._selector = this.doc._document.querySelector('.container')
        this._newMonster.classList.add(`__monsters`)
        this._newMonster.style.width = `${this._width}px`
        this._newMonster.style.height = `${this._height}px`
        this._newMonster.style.top = `${this._positionY}px`
        this._newMonster.style.left = `${this._positionX}px`
        this._selector.append(this._newMonster)

    }

    removeSomemonsters() {
        this.doc._document.querySelectorAll('.__monsters').forEach(n => n.remove());
    }

    removeAllMonsters() {
        this.resetSize()
        this.doc._document.querySelectorAll('.__monsters').forEach(n => n.remove());

    }

    calculatePositions() {
        let height = window.innerHeight - 100
        let width = window.innerWidth - 100
        this._positionY = (Math.floor(Math.random() * window.innerHeight) + 1)
        this._positionX = (Math.floor(Math.random() * window.innerWidth) + 1)
        if(this._positionY <= 30 || this._positionX <= 50 || this._positionY >= height || this._positionX >= width) this.calculatePositions()
        
    }

    increaseSize() {
        if(this._width >= 120) {
            this.resetSize()
        }
        else {
            this._width += 7
            this._height += 7
        }
        
    }

    resetSize() {
        this._width = 60
        this._height = 60
    }


}

function getRandomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }


