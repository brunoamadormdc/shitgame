import { Monsters } from "./monsters.js"

export class Document {
    constructor(document) {
        this._document = document
        this._body = this._document.querySelector('body')
        this._app = this._document.createElement('div')
        this._app.classList.add('container')
        this._finishLine = []
        this._monster = new Monsters(this)
        this._body.append(this._app)
        this.createFinishLine()
        this.calculateFinishLine()

    }

    createListener(player1) {
        var handler = (e) =>{
            player1.positionX = e.clientX
            player1.positionY = e.clientY
            player1.moveObject()

            this.verifyColision(e.target.attributes[0].value,player1,handler)
            
            
            if(player1.positionX >= this._finishLine[0] && player1.positionY >= this._finishLine[1]) {
                this._monster.newMonster()
                player1.increasePoints()
                player1.resetBodyPlayer()
                this._app.removeEventListener('mousemove',handler)
            }
        };
        this._app.addEventListener('mousemove',handler)
    }

    calculateFinishLine() {
       this._finishLine = [this._document.body.clientWidth - 30,this._document.body.clientHeight - 30]
       
    }

    verifyColision(obj,player,handler) {
        
        if(obj == '__monsters') {
            player.resetBodyPlayer()
            this._app.removeEventListener('mousemove',handler)
            player.resetPoints()
            this._monster.removeAllMonsters()
        }
    }

    createFinishLine() {
        let finish = this._document.createElement('div')
        finish.classList.add('__finishLine')
        this._app.append(finish)
        
    }
    
    create_new_element(type,...element) {
        for(const idx in element) {
            this[type].append(element[idx])
        }
        
    }

    
    
}