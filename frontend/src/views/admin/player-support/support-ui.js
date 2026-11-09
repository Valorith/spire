// Shared presentation helpers for Player Support.

// A stable hue per name, so a character keeps the same color everywhere.
export function nameHue (name) {
  let hash = 0
  for (const char of String(name || '').toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return Math.abs(hash) % 360
}

export function avatarStyle (name) {
  const hue = nameHue(name)
  return {
    background: `linear-gradient(145deg, hsl(${hue} 42% 36%), hsl(${hue} 46% 22%))`,
    color: `hsl(${hue} 85% 88%)`,
    boxShadow: `inset 0 0 0 1px hsl(${hue} 50% 48% / .45)`
  }
}

export function initials (name) {
  return String(name || '?').trim().charAt(0).toUpperCase() || '?'
}

export function relativeTime (value, now = Date.now()) {
  const time = value instanceof Date ? value.getTime() : typeof value === 'number' ? value * 1000 : new Date(value).getTime()
  const minutes = Math.max(0, Math.floor((now - time) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}

// Per-browser record of the latest player reply each viewer has seen. Storage
// can be unavailable (private windows, blocked site data); everything still
// works, replies just are not marked as new.
const seenKey = 'spire-player-support-seen'

function readSeen () {
  try {
    return JSON.parse(window.localStorage.getItem(seenKey) || '{}') || {}
  } catch (e) {
    return {}
  }
}

export function markSeen (key, at) {
  if (!key || !at) return
  try {
    const seen = readSeen()
    if (seen[key] && new Date(seen[key]) >= new Date(at)) return
    seen[key] = at
    window.localStorage.setItem(seenKey, JSON.stringify(seen))
  } catch (e) {
    // Storage unavailable: nothing to remember.
  }
}

export function hasUnseenReply (record) {
  if (!record || !record.last_reply_at) return false
  const seen = readSeen()[record.key]
  return !seen || new Date(record.last_reply_at) > new Date(seen)
}
