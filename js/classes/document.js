import { Monsters } from "./monsters.js"

export class Document {
    constructor(document) {
        this._document = document
        this._body = this._document.querySelector('body')
        this._app = this._document.createElement('div')
        this._app.classList.add('container')
        this._played = 0
        this._finishLine = []
        this._monster = new Monsters(this)
        this._body.append(this._app)
        this.createFinishLine()
        this.calculateFinishLine()
        

    }
    powerListener(player1) {
        let handler = (e) => {

        }
    }

    createListener(player1) {
        
        var handler = (e) =>{
            player1.positionX = e.clientX
            player1.positionY = e.clientY
            player1.moveObject()
            this.verifyMouseout(player1,handler)
            this.verifyColision(e.target.attributes[0].value,player1,handler)
            this.verifyMouseout(e.clientX,e.clientY,player1)
            
            if(player1.positionX >= this._finishLine[0] && player1.positionY >= this._finishLine[1]) {
                for (let i = 0; i <= this._played; i++) {
                    this._monster.newMonster(player1)
                }
                player1.increasePoints()
                player1.resetBodyPlayer()
                this._played +=1
                this._app.removeEventListener('mousemove',handler)
            }
        };
        this._app.addEventListener('mousemove',handler)
    }

    calculateFinishLine() {
       this._finishLine = [this._document.body.clientWidth - 80,this._document.body.clientHeight - 30]
       
    }

    verifyMouseout(player,handler) {
       let height = window.innerHeight - 3
       let width = window.innerWidth - 3
       if(player.positionX <= 3 || player.positionY <= 3 || player.positionX >= width || player.positionY >= height) {
            player.resetBodyPlayer()
            player.decreaseLifes()
            this._app.removeEventListener('mousemove',handler)
            if(player._lifes.lifes < 1) {
                
                player.resetPoints()
                this._monster.removeAllMonsters()
                this._played = 1
                
            }
       }
    }

    verifyColision(obj,player,handler) {
        
        if(obj == '__monsters') {
            player.resetBodyPlayer()
            player.decreaseLifes()
            this._app.removeEventListener('mousemove',handler)
            if(player._lifes.lifes < 1) {
                
                player.resetPoints()
                this._monster.removeAllMonsters()
                this._played = 1
                
            }
           
        }
    }

    createFinishLine() {
        let finish = this._document.createElement('div')
        finish.classList.add('__finishLine')
        finish.innerHTML = 'Chegada'
        this._app.append(finish)
        
    }
    
    create_new_element(type,...element) {
        for(const idx in element) {
            this[type].append(element[idx])
        }
        
    }

    
    
}