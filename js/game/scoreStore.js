const STORAGE_KEY = 'shitgame.leaderboard'
const MAX_ENTRIES = 5

export function loadLeaderboard() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)

        if (!raw) {
            return []
        }

        const parsed = JSON.parse(raw)

        if (!Array.isArray(parsed)) {
            return []
        }

        return parsed
            .filter(isValidEntry)
            .sort(sortEntries)
            .slice(0, MAX_ENTRIES)
    }
    catch {
        return []
    }
}

export function registerLeaderboardScore(entry) {
    const leaderboard = loadLeaderboard()
    const normalizedEntry = normalizeEntry(entry)

    if (!normalizedEntry) {
        return {
            leaderboard,
            rank: null,
            isHighScore: false
        }
    }

    const nextLeaderboard = [...leaderboard, normalizedEntry]
        .sort(sortEntries)
        .slice(0, MAX_ENTRIES)

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLeaderboard))
    }
    catch {
        // Ignore persistence errors and keep the in-memory response.
    }

    return {
        leaderboard: nextLeaderboard,
        rank: nextLeaderboard.findIndex(item => item.id === normalizedEntry.id) + 1 || null,
        isHighScore: nextLeaderboard[0]?.id === normalizedEntry.id
    }
}

function normalizeEntry(entry) {
    const score = Number(entry?.score ?? 0)
    const level = Number(entry?.level ?? 0)

    if (score <= 0) {
        return null
    }

    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        score: Math.round(score),
        level: Math.max(0, Math.round(level)),
        createdAt: new Date().toISOString()
    }
}

function isValidEntry(entry) {
    return entry && Number.isFinite(entry.score) && Number.isFinite(entry.level) && typeof entry.id === 'string'
}

function sortEntries(left, right) {
    if (right.score !== left.score) {
        return right.score - left.score
    }

    if (right.level !== left.level) {
        return right.level - left.level
    }

    return String(right.createdAt ?? '').localeCompare(String(left.createdAt ?? ''))
}
