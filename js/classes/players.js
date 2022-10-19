import { Proxies } from "./proxies.js"

export class Player {
    constructor(mouseX, mouseY, Document) {

        this._positionX = mouseX
        this._positionY = mouseY
        this._movePower = 5
        this._document = Document
        this._bodyPlayer = document.createElement('div')
        this._pointsPlayer = document.createElement('div')
        this._lifesPlayer = document.createElement('div')
        this._powersPlayer = document.createElement('div')
        this._hammersPlayer = document.createElement('div')
        this._safed = new Proxies({
            safed: true
        }, this)
        this._hammer = new Proxies(
            {
                hammer: 10
            },
            this)
        this._viewpoints = new Proxies(
            {
                points: 0
            },
            this)
        this._powers = new Proxies(
            {
                powers: 0
            },
            this)
        this._lifes = new Proxies(
            {
                lifes: 0
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

    get movePower() {
        return this._movePower
    }

    set movePower(val) {
        if (val >= 30) {
            return this._movePower = 30
        }
        if (val <= 5) {
            return this._movePower = 5
        }
        this._movePower = val
    }

    increasePoints() {
        this._viewpoints.points += 1
    }

    resetPoints() {
        this._lifes.lifes = 3
        this._powers.powers = 3
        this._viewpoints.points = 0
        this._hammer.hammer = 10
        this._safed.safed = true
        this.movePower = 5
    }

    finishArrive() {
        this._safed.safed = true
        this.positionY = 0
        this.positionX = 0
        this._bodyPlayer.style.top = `${this.positionY}px`
        this._bodyPlayer.style.left = `${this.positionX}px`
    }

    decreaseLifes() {
        this._lifes.lifes = this._lifes.lifes - 1
    }

    decreasePower() {
        this._powers.powers = this._powers.powers - 1
    }

    createObject(player) {
        let handler = (e) => {
            if (e.key == 'Enter') {
                this._document.createListener(this)
                window.removeEventListener('keypress', handler)
            }
        }
        this._bodyPlayer.classList.add('__player')
        this._pointsPlayer.classList.add('__points')
        this._hammersPlayer.classList.add('__hammer')

        this._pointsPlayer.innerHTML = this._viewpoints.points

        this._document.create_new_element('_app', this._bodyPlayer)
        this._document.create_new_element('_body', this._pointsPlayer)
        this._document.create_new_element('_body', this._lifesPlayer)
        this._document.create_new_element('_body', this._hammersPlayer)
        this._hammersPlayer.innerHTML = this._hammer.hammer
        this._lifes.lifes = 3
        this._powers.powers = 3

        window.addEventListener('keypress', handler)
    }

    verifySafezone(top,left) {
       
        top = parseInt(top.toString().replace('px',''))
        left = parseInt(left.toString().replace('px',''))
        if(left <= 10 && top <= 10) {
            this._safed.safed = true
        }
        else {
            this._safed.safed = false   
        }        
    }

    moveObject() {

        this._bodyPlayer.style.top = `${this.positionY}px`
        this._bodyPlayer.style.left = `${this.positionX}px`
        this.verifySafezone(this._bodyPlayer.style.top,this._bodyPlayer.style.left)
        
        //this._document.points_of_colision(this.positionX,this.positionY)
    }

    resetBodyPlayer() {
        this._bodyPlayer.style.top = `0px`
        this._bodyPlayer.style.left = `0px`
    }



}