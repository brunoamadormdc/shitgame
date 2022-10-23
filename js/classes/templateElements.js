export function GamePad(doc) {
    return class extends HTMLElement {
        constructor() {
            super()
            this.document = doc
            this.arrows = [{name:'__rightArrow', code:'&#x2192;'},{name:'__leftArrow', code:'&#x2190;'},{name:'__topArrow', code:'&#x2191;'},{name:'__bottomArrow', code:'&#x2193;'}]
            this.shadow = this.attachShadow({mode:'open'})
            this.buildContainer()
            this.buildStyles()
            this.buildArrows()
            
    
        }
    
        buildContainer() {
            this.padWrapper = document.createElement('div')
            this.padWrapper.setAttribute('class','__gamePad')
            this.shadow.appendChild(this.padWrapper)        
        }
    
        buildArrows() {
            this.arrows.forEach((arrows,id) => {
                let arrow = document.createElement('div')
                arrow.setAttribute('class',arrows.name)
                arrow.setAttribute('position',arrows.name)
                arrow.innerHTML = arrows.code
                arrow.addEventListener('click',(e)=>{
                    const position = arrow.getAttribute('position')
                    console.log(position)
                })
                this.padWrapper.appendChild(arrow)
            })
        }
    
        
    
        buildStyles() {
            let styles = document.createElement('style')
            styles.setAttribute('type','text/css')
            styles.textContent = `
                .__gamePad {
                    position:relative;
                    display:flex;
                    background-color:transparent;
                    
                    width:200px;
                    height:150px;
                    position:absolute;
                    z-index:2000;
                    border-radius:50%;
                    top: 80%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    opacity:0.5;
                }
                .__gamePad .__topArrow {
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    position:absolute;
                    font-size:20px;
                    font-weight:900;
                    background:rgba(255,255,255,0.6);
                    top:0px;
                    left:50%;
                    width:40px;
                    height:40px;
                    border-radius:50%;
                    z-index:3000;
                    transform: translate(-50%, 0%);
                }
                .__gamePad .__bottomArrow {
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    position:absolute;
                    font-size:20px;
                    font-weight:900;
                    background:rgba(255,255,255,0.6);
                    position:absolute;
                    top:75%;
                    left:50%;
                    width:40px;
                    height:40px;
                    border-radius:50%;
                    z-index:3000;
                    transform: translate(-50%, 0%);
                }
                .__gamePad .__leftArrow {
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    position:absolute;
                    font-size:20px;
                    font-weight:900;
                    background:rgba(255,255,255,0.6);
                    position:absolute;
                    top:50%;
                    left:0%;
                    width:40px;
                    height:40px;
                    border-radius:50%;
                    z-index:3000;
                    transform: translate(30%, -50%);
                }
                .__gamePad .__rightArrow {
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    position:absolute;
                    font-size:20px;
                    font-weight:900;
                    background:rgba(255,255,255,0.6);
                    position:absolute;
                    top:50%;
                    right:0%;
                    width:40px;
                    height:40px;
                    border-radius:50%;
                    z-index:3000;
                    transform: translate(-40%, -50%);
                }
            `
            this.shadow.appendChild(styles)
        }
    }
    
}

