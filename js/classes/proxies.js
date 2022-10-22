export class Proxies {
    constructor(object,view=null) {
        
        return new Proxy(object,{
            get(target, prop, receiver) {
                return target[prop]
            },
            set(target, prop, value, receiver) {
                
                if(prop == 'points') {
                    view._pointsPlayer.innerHTML = `Level ${value}`
                }
                if(prop == 'lifes') {
                    view._lifePlayer.className = ''
                    if(value == 3) {
                        view._lifePlayer.classList.add('__life')
                        view._lifePlayer.classList.add('three')
                    }
                    if(value == 2) {
                        view._lifePlayer.classList.add('__life')
                        view._lifePlayer.classList.add('two')
                    }
                    if(value == 1) {
                        view._lifePlayer.classList.add('__life')
                        view._lifePlayer.classList.add('one')
                    }
                    if(value == 0) {
                        view._lifePlayer.classList.add('__life')
                        view._lifePlayer.classList.add('zero')
                    }
                }
                if(prop == 'hammer') {
                    view._hammersPlayer.innerHTML = value
                }

                if(prop == 'safed') {
                    if (value) {
                        view._bodyPlayer.className = '__player __safe'
                    }
                    else {
                        view._bodyPlayer.className = '__player __notSafe'
                    }
                    
                }
                if(prop == 'points') {
                    
                    if(value <= 0) {
                        
                        console.log('perdeu')
                    }
                    else {
                        
                        console.log('fez Uma')
                    }
                }

                if(prop == 'started') {
                    
                    if(!value) {
                        console.log(target)
                        view._player._data.safed = true
                        view._player.resetBodyPlayer()
                        const message = view._modalMessages.createStartmsg(target.message)
                        view._body.append(message)
                     }
                     else {
                        console.log('not')
                        const message = document.querySelector('.__startMessage')
                        view._modalMessages.removeMsg(message)
                     }

                }
                
                return Reflect.set(target, prop, value, receiver);
            }
        }) 
    }
}