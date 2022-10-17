import { Player } from './classes/players.js'
import { Document } from './classes/document.js'



const doc = new Document(document)
const player1 = new Player(0,0,doc)
player1.createObject(player1)


