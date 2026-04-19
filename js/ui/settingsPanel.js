export class SettingsPanel {
    constructor(document, { onChange, onStart }) {
        this.document = document
        this.body = document.querySelector('body')
        this.onChange = onChange
        this.onStart = onStart
        this.root = null
    }

    mount() {
        if (this.root) {
            return
        }

        this.root = this.document.createElement('section')
        this.root.className = '__settingsPanel'
        this.root.innerHTML = `
            <div class="__settingsPanelCard">
                <div class="__settingsHeader">
                    <span class="__settingsEyebrow">Config</span>
                    <strong class="__settingsTitle">Controles</strong>
                </div>
                <label class="__settingsField">
                    <span class="__settingsLabel">Input</span>
                    <select name="inputMode" class="__settingsSelect">
                        <option value="auto">Auto</option>
                        <option value="keyboard">Teclado</option>
                        <option value="gamepad">Joystick</option>
                    </select>
                </label>
                <label class="__settingsField">
                    <span class="__settingsLabel">Deadzone</span>
                    <input name="gamepadDeadzone" class="__settingsRange" type="range" min="0.05" max="0.4" step="0.01" />
                    <span class="__settingsValue" data-role="deadzoneValue"></span>
                </label>
                <div class="__settingsStatus" data-role="gamepadStatus"></div>
                <button type="button" class="__settingsButton">Começar</button>
            </div>
        `

        this.body.append(this.root)

        this.root.querySelector('select[name="inputMode"]').addEventListener('change', () => {
            this.emitChange()
        })
        this.root.querySelector('input[name="gamepadDeadzone"]').addEventListener('input', () => {
            this.emitChange()
        })
        this.root.querySelector('.__settingsButton').addEventListener('click', () => {
            this.onStart()
        })
    }

    show({ settings, gamepadStatus, startLabel = 'Começar' }) {
        this.mount()
        this.root.classList.add('__visible')
        this.root.querySelector('select[name="inputMode"]').value = settings.inputMode
        this.root.querySelector('input[name="gamepadDeadzone"]').value = String(settings.gamepadDeadzone)
        this.root.querySelector('[data-role="deadzoneValue"]').textContent = `${Math.round(settings.gamepadDeadzone * 100)}%`
        this.root.querySelector('[data-role="gamepadStatus"]').textContent = gamepadStatus
        this.root.querySelector('.__settingsButton').textContent = startLabel
    }

    hide() {
        if (this.root) {
            this.root.classList.remove('__visible')
        }
    }

    updateGamepadStatus(gamepadStatus) {
        if (!this.root) {
            return
        }

        this.root.querySelector('[data-role="gamepadStatus"]').textContent = gamepadStatus
    }

    emitChange() {
        const settings = {
            inputMode: this.root.querySelector('select[name="inputMode"]').value,
            gamepadDeadzone: Number(this.root.querySelector('input[name="gamepadDeadzone"]').value)
        }
        this.root.querySelector('[data-role="deadzoneValue"]').textContent = `${Math.round(settings.gamepadDeadzone * 100)}%`
        this.onChange(settings)
    }
}
