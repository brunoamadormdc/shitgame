const STORAGE_KEY = 'shitgame.settings'

export const DEFAULT_SETTINGS = {
    inputMode: 'auto',
    gamepadDeadzone: 0.2
}

export function loadSettings() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)

        if (!raw) {
            return { ...DEFAULT_SETTINGS }
        }

        const parsed = JSON.parse(raw)

        return {
            ...DEFAULT_SETTINGS,
            ...parsed
        }
    }
    catch {
        return { ...DEFAULT_SETTINGS }
    }
}

export function saveSettings(settings) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
    catch {
        // Ignore persistence errors and keep defaults in memory.
    }
}
