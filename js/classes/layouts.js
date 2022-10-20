export class Messages {
    constructor(doc) {
        this.doc = doc
    }

    createStartmsg(message) {
        const startMessage = this.doc._document.createElement('div')
        startMessage.setAttribute('class','__startMessage')
        startMessage.innerHTML = `
            ${message}
        `
        this.doc._body.append(startMessage)
        return startMessage
    }

    removeMsg(selector = null) {
        if(selector != null) {
            selector.remove()
        }
    }
}