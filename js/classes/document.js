import { Monsters } from "./monsters.js"

export class Document {
    constructor(document) {
        this._document = document
        this._body = this._document.querySelector('body')
        this._app = this._document.createElement('div')
        this._app.classList.add('container')
        this._played = 0
        this._addLife = 0
        this._finishLine = []
        this._monster = new Monsters(this)
        this._body.append(this._app)
        this.createFinishLine()
        this.calculateFinishLine()


    }

    monsterDestruct(player1) {
        let handler = (e) => {
            let element = e.srcElement
            
            if(element.className == '__monsters' && player1._hammer.hammer > 0) {
                element.classList.add('__destruction')
                console.log(element)
                setTimeout(()=>{
                    
                    element.remove()
                    if(player1._hammer.hammer <= 0) {
                        player1._hammer.hammer = 0
                    }
                    else {
                        player1._hammer.hammer -= 1
                    }
                },200)

                
            }

        }
        this._app.addEventListener('click',handler)
    }

    createListener(player1) {
            this.monsterDestruct(player1)
            let handler = (e) => {
                console.log(player1)
                if (e.code == 'NumpadAdd') {
                    player1.movePower += 5

                }
                if (e.code == 'NumpadSubtract') {
                    player1.movePower -= 5

                }
                if (e.code == 'ArrowRight') {
                    
                    if (player1.positionX < 5) player1.positionX = player1.movePower
                    player1.positionX = player1.positionX + player1.movePower
                }
                if (e.code == 'ArrowLeft') {
                    if (player1.positionX < 5) player1.positionX = player1.movePower
                    else player1.positionX = player1.positionX - player1.movePower

                }
                if (e.code == 'ArrowUp') {
                    if (player1.positionY < 5) player1.positionY = player1.movePower
                    else player1.positionY = player1.positionY - player1.movePower

                }
                if (e.code == 'ArrowDown') {

                    if (player1.positionY < 5) player1.positionY = player1.movePower
                    else player1.positionY = player1.positionY + player1.movePower

                }
               
                this.moves(e, player1, handler, 'keydown')

            };
            document.addEventListener('keydown', handler)
        

    }



    moves(e, player1, handler, type = 'mousemove') {

        player1.moveObject()
        //this.verifyMonster(player1, type, handler)
        this.verifyFinishline(player1, type, handler)


    }

    verifyMonster(player1, type, handler) {
        let monsters = document.querySelectorAll('.__monsters')
        let touched = []
        if (monsters.length > 0) {
            monsters.forEach(mon => {
                console.log(mon.offsetTop)
                let top = parseInt(mon.offsetLeft)
                let left = parseInt(mon.offsetLeft)
                let width = parseInt(mon.offsetWidth) + left
                let height = parseInt(mon.offsetHeight) + top
                if ((player1.positionX >= left && player1.positionX <= width) && (player1.positionY >= top && player1.positionY <= height)) {
                    touched.push(mon)
                }
            })
        }
        if (touched.length > 0) {
            if(touched[0].classList.value.match('goodMonster') == null) {
                this._app.removeEventListener(type, handler)
                player1.resetBodyPlayer()
                player1.decreaseLifes()
                //this._monster.increaseSizes()
    
                if (player1._lifes.lifes < 1) {
    
                    player1.resetPoints()
                    this._monster.removeAllMonsters()
                    this._played = 1
    
    
                }
                player1.positionX = 20
                player1.positionY = 20 
            }
            else {
                touched[0].remove()
                player1._hammer.hammer += 5
            }
 
        }
    }

    verifyFinishline(player1, type, handler) {
        if (player1.positionX >= this._finishLine[0] && player1.positionY >= this._finishLine[1]) {
            for (let i = 0; i <= this._played; i++) {
                this._monster.newMonster(player1)
            }
            if(this._addLife == 5) {
                this._monster.newGoodmonster(player1)
                this._addLife = 0
            }
            player1.increasePoints()
            player1.resetBodyPlayer()
            if(this._played >= 10) {
                this._played = 1
            }
            else {
                this._played += 2
            }
            this._addLife += 1
            this._app.removeEventListener(type, handler)
            player1.positionX = 20
            player1.positionY = 20
        }
    }


    calculateFinishLine() {
        this._finishLine = [this._document.body.clientWidth - 80, this._document.body.clientHeight - 30]

    }

x


    createFinishLine() {
        let finish = this._document.createElement('div')
        finish.classList.add('__finishLine')
        finish.innerHTML = 'Chegada'
        this._app.append(finish)

    }

    create_new_element(type, ...element) {
        for (const idx in element) {
            this[type].append(element[idx])
        }

    }



}