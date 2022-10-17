export class Monsters {
    constructor(doc) {
        this.doc = doc
        this._width = 60
        this._height = 60

    }

    newMonster(player1) {
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
        this[`_newMonster` + id].style.backgroundImage = `url('../../images/planet${getRandomInteger(1,6)}.png`
        this._selector.append(this[`_newMonster` + id])
        let css = window.document.styleSheets[0]
        css.insertRule(`@keyframes move${id} {
            50% {
                ${positions(posX,posY)}
             }
        }`,css.cssRules.length)
        
        this[`_newMonster` + id].style.animation = `move${id} ${getRandomInteger(5,15).toString()}s ease infinite`
        this.detectMonstercollision(player1,this[`_newMonster` + id],'vilain')

    }

    detectMonstercollision(player1,monster,type="vilain") {
        if(type == 'vilain') {
            let timer = setInterval(() => {
                if(!player1._verifySafezone) {
                    let top = parseInt(monster.offsetTop) - 10
                    let left = parseInt(monster.offsetLeft) - 10
                    let width = parseInt(monster.offsetWidth) + left
                    let height = parseInt(monster.offsetHeight) + top
                    
                    if ((player1.positionX >= left && player1.positionX <= width) && (player1.positionY >= top && player1.positionY <= height)) {
                        player1.resetBodyPlayer()
                        player1.decreaseLifes()
                        if (player1._lifes.lifes < 1) {
                            player1.resetPoints()
                            this.removeAllMonsters()
                            this.doc._played = 1
                            clearInterval(timer)
                        }
                        player1.positionX = 20
                        player1.positionY = 20 
                    } 
                }
                
    
            }, 100)
        }
        else {
            monster.remove()
            player1._hammer.hammer += 5
        }

    }


    newGoodmonster(player1) {
        const { posX, posY } = this.calculatePositions()
        let id = (Math.random() * 100).toString().replace('.', '')
        this[`_newMonster` + id] = this.doc._document.createElement('div')
        this._selector = this.doc._document.querySelector('.container')
        this[`_newMonster` + id].classList.add(`__monsters`)
        this[`_newMonster` + id].classList.add(`goodMonster`)
        this[`_newMonster` + id].style.width = `30px`
        this[`_newMonster` + id].style.height = `30px`
        this[`_newMonster` + id].style.top = `${posY}px`
        this[`_newMonster` + id].style.left = `${posX}px`
        this._selector.append(this[`_newMonster` + id])
        this.detectMonstercollision(player1,this[`_newMonster` + id],"goodguy")
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

function positions(posX,posY) {
    let array = [`left: ${posX - getRandomInteger(50,300)}px;`,`top: ${posY - getRandomInteger(50,300)}px;`]
    let rand = array[(Math.random() * array.length) | 0]
    console.log(rand)
    return rand.toString()
}
