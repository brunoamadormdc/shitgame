import { Proxies } from "./proxies.js"

export class Player {
    constructor(mouseX,mouseY,Document) {
        this._positionX = mouseX
        this._positionY = mouseY
        this._document = Document
        this._bodyPlayer = document.createElement('div')
        this._pointsPlayer = document.createElement('div')
        this._lifesPlayer = document.createElement('div')
        this._viewpoints = new Proxies(
            {
                points:0
            },
        this)
        this._powers = new Proxies(
            {
                powers:3
            },
        this)
        this._lifes = new Proxies(
            {
                lifes:0
            },
        this)
        
    }

    get positionX() {
        return this._positionX
    }

    get positionY() {
        return this._positionY
    }
        
    set positionX(val) {
        this._positionX = val
    }
    set positionY(val) {
        this._positionY = val
    }

    increasePoints() {
        this._viewpoints.points += 10
    }

    resetPoints() {
        this._lifes.lifes = 3
        this._powers.powers = 3
        this._viewpoints.points = 0
    }

    decreaseLifes() {
        this._lifes.lifes = this._lifes.lifes - 1
    }

    decreasePower() {
        this._powers.powers = this._powers.powers - 1
    }

    createObject() {
        let handler = (e) =>{
            if(e.clientX >= 0 && e.clientX <=20) {
                
                this._document.createListener(this)
                
                
            }
        }
        this._bodyPlayer.classList.add('__player')
        this._pointsPlayer.classList.add('__points')
        
        this._pointsPlayer.innerHTML = this._viewpoints.points

        this._document.create_new_element('_app',this._bodyPlayer)
        this._document.create_new_element('_body',this._pointsPlayer)
        this._document.create_new_element('_body',this._lifesPlayer)
        this._lifes.lifes = 3

        this._bodyPlayer.addEventListener('click',handler)
    }

    moveObject() {
        this._bodyPlayer.style.top = `${this.positionY - 10}px`
        this._bodyPlayer.style.left = `${this.positionX - 12}px`
        //this._document.points_of_colision(this.positionX,this.positionY)
    }

    resetBodyPlayer() {
        this._bodyPlayer.style.top = `0px`
        this._bodyPlayer.style.left = `0px`
    }

    verifyCollision() {
        
    }


}