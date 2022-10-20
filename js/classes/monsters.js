export class Monsters {
    constructor(doc) {
        this.doc = doc
        this._width = 60
        this._height = 60

    }

    newMonster() {
        this.increaseSize()
        let { posX, posY } = this.calculatePositions()
        let id = (Math.random() * 100).toString().replace('.', '')
        this[`_newMonster` + id] = null
        this[`_newMonster` + id] = this.doc._document.createElement('div')
        this._selector = this.doc._document.querySelector('.container')
        this[`_newMonster` + id].classList.add(`__monsters`)
        this[`_newMonster` + id].style.width = `${this._width}px`
        this[`_newMonster` + id].style.height = `${this._height}px`
        this[`_newMonster` + id].style.top = `${posY}px`
        this[`_newMonster` + id].style.left = `${posX}px`
        this[`_newMonster` + id].style.backgroundImage = `url('../../images/planet${getRandomInteger(1, 7)}.png`
        this._selector.append(this[`_newMonster` + id])
        let css = window.document.styleSheets[0]
        css.insertRule(`@keyframes move${id} {
            50% {
                ${positions(posX, posY)}
             }
        }`, css.cssRules.length)

        this[`_newMonster` + id].style.animation = `move${id} ${getRandomInteger(5, 15).toString()}s ease infinite`
        this.detectMonstercollision(this[`_newMonster` + id], 'vilain')

    }

    detectMonstercollision(monster, type = "vilain") {
        
        let timer = setInterval(() => {
            
            if (!this.doc._player._safed.safed) {
                
                let top = parseInt(monster.offsetTop) - 8
                let left = parseInt(monster.offsetLeft) - 8
                let width = parseInt(monster.offsetWidth) + left
                let height = parseInt(monster.offsetHeight) + top

                if ((this.doc._player.positionX >= left && this.doc._player.positionX <= width) && (this.doc._player.positionY >= top && this.doc._player.positionY <= height)) {
                    if (type == 'vilain') {
                        this.doc._player.resetBodyPlayer()
                        this.doc._player.decreaseLifes()
                        this.doc._player.positionX = 20
                        this.doc._player.positionY = 20
                        if (this.doc._player._lifes.lifes < 1) {
                            this.doc._player.resetPoints()
                            this.removeAllMonsters()
                            this.doc._played = 0
                            this.doc._addLife = 0
                            clearInterval(timer)
                            this.doc._player.createObject(this.doc._player)
                            this.doc._modal.type = 'gameover'
                            //this.doc._gamestatus.message = `Game Over! Você alcançou o nível ${this.doc._player._viewpoints.points}!`
                            

                        } else {
                            this.doc._gamestatus.message = 'Você bateu no planeta! Aperte o Enter e tente de novo!'
                            this.doc._gamestatus.started = false
                            this.doc._modal.type = 'collision'
                        }
                        this.doc._gamestatus.started = false
                        this.doc._player._safed.safed = true



                    }
                    else {
                        monster.remove()
                        this.doc._player._hammer.hammer += 5
                    }

                }
            }

        }, 50)

    }

    newGoodmonster() {

        const { posX, posY } = this.calculatePositions()
        let id = (Math.random() * 100).toString().replace('.', '')
        this[`_newMonster` + id] = this.doc._document.createElement('div')
        this._selector = this.doc._document.querySelector('.container')
        this[`_newMonster` + id].classList.add(`__monsters`)
        this[`_newMonster` + id].classList.add(`goodMonster`)
        this[`_newMonster` + id].style.width = `60px`
        this[`_newMonster` + id].style.height = `60px`
        this[`_newMonster` + id].style.top = `${posY}px`
        this[`_newMonster` + id].style.left = `${posX}px`
        this._selector.append(this[`_newMonster` + id])
        this.detectMonstercollision(this[`_newMonster` + id], "goodguy")
    }

    removeSomemonsters() {
        this.doc._document.querySelectorAll('.__monsters').forEach(n => n.remove());
    }

    removeAllMonsters() {
        this.resetSize()
        this.doc._document.querySelectorAll('.__monsters').forEach(n => n.remove());

    }

    removeSomemonsters() {
        for (let i = 0; i <= 10; i++) {
            let mons = this.doc._document.querySelectorAll('.__monsters')[i]
            if (mons != undefined) {
                mons.remove()
            }
        }
    }

    calculatePositions() {

        let posFinishY = window.innerHeight - 80
        let posFinishX = window.innerWidth - 30
        let posY = (Math.floor(Math.random() * window.innerHeight) + 1)
        let posX = (Math.floor(Math.random() * window.innerWidth) + 1)
        if ((posX >= posFinishX && posX <= window.innerWidth) && (posY >= posFinishY && posY <= window.innerHeight)) {
            this._positionY = posY - 200
            this._positionX = posX - 200
            return {
                posY: posY - 200,
                posX: posX - 200
            }
        }
        else {
            return {
                posY: posY,
                posX: posX
            }
        }

    }

    increaseSizes() {
        this.doc._document.querySelectorAll('.__monsters').forEach(n => {
            let numberX = n.style.width.replace('px', '')
            numberX = parseInt(numberX)
            n.style.width = `${numberX + 10}px`
            let numberY = n.style.height.replace('px', '')
            numberY = parseInt(numberY)
            n.style.height = `${numberY + 10}px`
        });
    }

    increaseSize() {
        if (this._width >= 120) {
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

function positions(posX, posY) {
    let array = [`left: ${posX - getRandomInteger(50, 300)}px;`, `top: ${posY - getRandomInteger(50, 300)}px;`]
    let rand = array[(Math.random() * array.length) | 0]
    console.log(rand)
    return rand.toString()
}
