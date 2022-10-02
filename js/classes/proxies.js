export class Proxies {
    constructor(object,view=null) {
        
        return new Proxy(object,{
            get(target, prop, receiver) {
                return target[prop]
            },
            set(target, prop, value, receiver) {
                console.log(value)
                if(prop == 'points') {
                    view._pointsPlayer.innerHTML = value
                }
                
                return Reflect.set(target, prop, value, receiver);
            }
        }) 
    }
}