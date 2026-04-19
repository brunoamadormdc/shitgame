const STORAGE_KEY = 'shitgame.tutorialSeen'

export function hasSeenTutorial() {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === '1'
    }
    catch {
        return false
    }
}

export function markTutorialSeen() {
    try {
        window.localStorage.setItem(STORAGE_KEY, '1')
    }
    catch {
        // Ignore persistence issues.
    }
}
