import { Proxies } from "./proxies.js"

export class Player {
    constructor(mouseX, mouseY, Document) {

        this._positionX = mouseX
        this._positionY = mouseY
        this._width = Math.round(window.innerWidth * 0.018)
        this._height = Math.round(window.innerWidth * 0.018)
        this._movePower = 5
        this._document = Document
        this._bodyPlayer = document.createElement('div')
        this._pointsPlayer = document.createElement('div')
        this._dataPlayer = document.createElement('div')
        this._dataPlayer = document.createElement('div')
        this._datasPlayer = document.createElement('div')
        this._data = new Proxies({
            safed: true,
            hammer: 10,
            points: 0,
            powers: 0,
            powers: 0,
            lifes: 0
        },this)


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
        this._data.points += 1
    }

    resetPoints() {
        this._data.lifes = 3
        this._data.powers = 3
        this._data.points = 0
        this._data.hammer = 10
        this._data.safed = true
        this.movePower = 5
    }

    finishArrive() {
        this._data.safed = true
        this.positionY = 0
        this.positionX = 0
        this._bodyPlayer.style.top = `${this.positionY}px`
        this._bodyPlayer.style.left = `${this.positionX}px`
    }

    decreaseLifes() {
        this._data.lifes = this._data.lifes - 1
    }

    decreasePower() {
        this._data.powers = this._data.powers - 1
    }

    createObject(player) {
        this._document._gamestatus.started = false
        let handler = (e) => {
            if (e.key == 'Enter') {
                this._bodyPlayer.style.width = `${this._width}px`
                this._bodyPlayer.style.height = `${this._height}px`
                this._bodyPlayer.style.backgroundSize = `${this._height}px ${this._width}px`
                this._document._gamestatus.started = true
                this._document.createListener(this)
                window.removeEventListener('keypress', handler)
            }
        }
        this._bodyPlayer.classList.add('__player')
        this._pointsPlayer.classList.add('__points')
        this._datasPlayer.classList.add('__data')

        this._pointsPlayer.innerHTML = this._data.points

        this._document.create_new_element('_app', this._bodyPlayer)
        this._document.create_new_element('_body', this._pointsPlayer)
        this._document.create_new_element('_body', this._dataPlayer)
        this._document.create_new_element('_body', this._datasPlayer)
        this._datasPlayer.innerHTML = this._data.hammer
        this._data.lifes = 3
        this._data.powers = 3
        this._data.points = 0

        window.addEventListener('keypress', handler)
    }

    verifySafezone(top,left) {
       
        top = parseInt(top.toString().replace('px',''))
        left = parseInt(left.toString().replace('px',''))
        if(left <= 10 && top <= 10) {
            this._data.safed = true
        }
        else {
            this._data.safed = false   
        }        
    }

    moveObject() {

        this._bodyPlayer.style.top = `${this.positionY}px`
        this._bodyPlayer.style.left = `${this.positionX}px`
        this.verifySafezone(this._bodyPlayer.style.top,this._bodyPlayer.style.left)
        
        //this._document.points_of_colision(this.positionX,this.positionY)
    }

    resetBodyPlayer() {
        this.positionY = 0
        this.positionX = 0
        this._bodyPlayer.style.top = `0px`
        this._bodyPlayer.style.left = `0px`
    }



}