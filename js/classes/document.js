import { Monsters } from "./monsters.js"
import { Proxies } from "./proxies.js"
import { Modalmessages } from "./modal.js"

export class Document {
    constructor(document) {
        this._document = document
        this._body = this._document.querySelector('body')
        this._app = this._document.createElement('div')
        this._app.classList.add('container')
        this._safeZone = this._document.createElement('div')
        this._played = 0
        this._addLife = 0
        this._finishLine = []
        this._modal = new Proxies({
            openModal:false,
            type:null
        },this)
        this._body.append(this._app)
        this._player = null
        this._modalMessages = new Modalmessages(this)
        this._monster = new Monsters(this)
        this.createFinishLine()
        this.calculateFinishLine()
        this._safeZone.classList.add('__safeZone')
        this.create_new_element('_app',this._safeZone)


    }

    playerDefine(player) {
        this._player = player
    }

    monsterDestruct() {
        let handler = (e) => {
            let element = e.srcElement
            
            if(element.className == '__monsters' && this._player._hammer.hammer > 0) {
                element.classList.add('__destruction')
                
                setTimeout(()=>{
                    
                    element.remove()
                    if(this._player._hammer.hammer <= 0) {
                        this._player._hammer.hammer = 0
                    }
                    else {
                        this._player._hammer.hammer -= 1
                    }
                },200)

                
            }

        }
        this._app.addEventListener('click',handler)
    }

    

    createListener() {
            
            this.monsterDestruct()
            
            let handler = (e) => {
                
                if (e.code == 'NumpadAdd') {
                    this._player.movePower += 10

                }
                if (e.code == 'NumpadSubtract') {
                    this._player.movePower -= 10

                }
                if (e.code == 'ArrowRight') {
                    
                    if (this._player.positionX < 5) this._player.positionX = this._player.movePower
                    this._player.positionX = this._player.positionX + this._player.movePower
                }
                if (e.code == 'ArrowLeft') {
                    if (this._player.positionX < 5) this._player.positionX = this._player.movePower
                    else this._player.positionX = this._player.positionX - this._player.movePower

                }
                if (e.code == 'ArrowUp') {
                    if (this._player.positionY < 5) this._player.positionY = this._player.movePower
                    else this._player.positionY = this._player.positionY - this._player.movePower

                }
                if (e.code == 'ArrowDown') {

                    if (this._player.positionY < 5) this._player.positionY = this._player.movePower
                    else this._player.positionY = this._player.positionY + this._player.movePower

                }
               
                this.moves(e, handler, 'keydown')

            };
            document.addEventListener('keydown', handler)
        

    }



    moves(e,  handler, type = 'mousemove') {

        this._player.moveObject()
        //this.verifyMonster(player1, type, handler)
        this.verifyFinishline(type, handler)


    }

/*     verifyMonster(player1, type, handler) {
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
    } */

    verifyFinishline(type, handler) {
        if (this._player.positionX >= this._finishLine[0] - 15 && this._player.positionY >= this._finishLine[1] - 15) {
            for (let i = 0; i <= this._played; i++) {
                this._monster.newMonster(this._player)
            }
            if(this._addLife == 3) {
                this._monster.newGoodmonster(this._player)
                this._addLife = 0
            }
            this._player.increasePoints()
            this._player.resetBodyPlayer()
            if(this._played >= 10) {
                this._played = 1
            }
            else {
                this._played += 2
            }
            this._addLife += 1
            this._app.removeEventListener(type, handler)
            this._player.finishArrive()
            
        }
    }


    calculateFinishLine() {
        this._finishLine = [this._document.body.clientWidth - 80, this._document.body.clientHeight - 30]

    }

x


    createFinishLine() {
        let finish = this._document.createElement('div')
        finish.classList.add('__finishLine')
        finish.innerHTML = 'Finish'
        this._app.append(finish)

    }

    create_new_element(type, ...element) {
        for (const idx in element) {
            this[type].append(element[idx])
        }

    }



}