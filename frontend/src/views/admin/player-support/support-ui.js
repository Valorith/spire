// Shared presentation helpers for Player Support.

// A stable hue per name, so a character keeps the same color everywhere.
export function nameHue (name) {
  let hash = 0
  for (const char of String(name || '').toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return Math.abs(hash) % 360
}

// Muted on purpose: the hue tells names apart without competing with the gold accent.
export function avatarStyle (name) {
  const hue = nameHue(name)
  return {
    background: `hsl(${hue} 22% 24%)`,
    color: `hsl(${hue} 42% 82%)`,
    boxShadow: `inset 0 0 0 1px hsl(${hue} 24% 32%)`
  }
}

export function initials (name) {
  return String(name || '?').trim().charAt(0).toUpperCase() || '?'
}

// Delivery state of a tell, mail or parcel that has not plainly gone through.
export function deliveryLabel (status) {
  return { pending: 'Sending', failed: 'Failed', unconfirmed: 'Unconfirmed', mail: 'Sent by mail' }[status] || status
}

// Chip tone: colour only where the state means something.
export function deliveryTone (status) {
  return { failed: 'is-danger', pending: 'is-warning', unconfirmed: 'is-warning' }[status] || null
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

// Per-browser alert choices. Off until staff turn them on.
const alertKey = 'spire-player-support-alerts'

export function readAlertPrefs () {
  try {
    const prefs = JSON.parse(window.localStorage.getItem(alertKey) || '{}') || {}
    return { desktop: Boolean(prefs.desktop), sound: Boolean(prefs.sound) }
  } catch (e) {
    return { desktop: false, sound: false }
  }
}

export function saveAlertPrefs (prefs) {
  try {
    window.localStorage.setItem(alertKey, JSON.stringify({ desktop: Boolean(prefs.desktop), sound: Boolean(prefs.sound) }))
  } catch (e) {
    // Storage unavailable: the choice lasts for this visit only.
  }
}

// A soft two-note chime, made in the browser so there is no audio file.
let audio = null
export function playChime () {
  try {
    const Context = window.AudioContext || window.webkitAudioContext
    if (!Context) return
    audio = audio || new Context()
    const start = audio.currentTime
    for (const [offset, frequency] of [[0, 880], [0.16, 1318.5]]) {
      const tone = audio.createOscillator()
      const gain = audio.createGain()
      tone.type = 'sine'
      tone.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start + offset)
      gain.gain.exponentialRampToValueAtTime(0.18, start + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.5)
      tone.connect(gain).connect(audio.destination)
      tone.start(start + offset)
      tone.stop(start + offset + 0.55)
    }
  } catch (e) {
    // Audio blocked or unavailable.
  }
}

export function desktopNotify (title, body, tag) {
  try {
    if (!('Notification' in window) || window.Notification.permission !== 'granted') return
    const notice = new window.Notification(title, { body, tag, icon: '/favicon.ico' })
    notice.onclick = () => { window.focus(); notice.close() }
  } catch (e) {
    // Notifications unavailable in this browser.
  }
}

// Saved replies may use {character} and {account}, filled for the open case.
export function fillReply (body, record) {
  return String(body || '')
    .replace(/\{character\}/gi, (record && record.character) || 'there')
    .replace(/\{account\}/gi, (record && record.account) || '')
}

// A request ID for an action the server must apply only once.
export function newRequestId () {
  return Array.from(window.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
}

// Tells are limited to 200 printable ASCII characters.
export function fitsTell (text) {
  return text.length > 0 && text.length <= 200 && !/[^\x20-\x7E]/.test(text)
}

// Case categories, in their fixed order. `hint` is the triage line shown on a
// case with that category; `tools` names the buttons beside it (the page
// decides which ones the viewer may use).
export const supportCategories = [
  { id: 'items', label: 'Lost or missing items', hint: 'Check Evidence for trades, sales and destroys, then trace or restore the item.', tools: ['evidence', 'items'] },
  { id: 'corpse', label: 'Corpse or death', hint: 'Find the corpse, move it to the player, or restore its experience.', tools: ['corpses'] },
  { id: 'stuck', label: 'Stuck or location', hint: 'Move the character to their bind point or a safe spot.', tools: ['move'] },
  { id: 'quest', label: 'Quest or progress', hint: 'Check tasks, lockouts and flags.', tools: ['tasks', 'lockouts'] },
  { id: 'conduct', label: 'Player conduct', hint: 'Set the reported player, review their chat in Evidence, then use Discipline.', tools: ['evidence', 'discipline'] },
  { id: 'bug', label: 'Bug report', hint: 'Link the player’s /bug reports from the Bug reports section.', tools: [] },
  { id: 'account', label: 'Account or access', hint: 'Check the account’s restrictions and linked accounts.', tools: ['discipline'] },
  { id: 'other', label: 'Other', hint: '', tools: [] }
]

export function categoryLabel (id) {
  const category = supportCategories.find(item => item.id === id)
  return category ? category.label : ''
}

// Another GM is composing, or messaged the player in the last two minutes.
// Returns { name, composing, minutes } for the confirmation, or null.
// `viewers` excludes the current user (the server leaves them out).
// `sent` holds { actor, created_at } of tells, mail and parcels.
export function otherResponder (viewers, sent, me, now = Date.now()) {
  const composing = (viewers || []).find(viewer => viewer.composing)
  if (composing) return { name: composing.name, composing: true, minutes: 0 }
  // Without the viewer's own name, every message would look like someone else's.
  const self = String(me || '').toLowerCase()
  if (!self) return null
  const recent = (sent || [])
    .filter(entry => entry.actor && entry.actor.toLowerCase() !== self && entry.created_at)
    .map(entry => ({ name: entry.actor, at: new Date(entry.created_at).getTime() }))
    .filter(entry => now - entry.at > -60000 && now - entry.at < 120000)
    .sort((a, b) => b.at - a.at)[0]
  return recent ? { name: recent.name, composing: false, minutes: Math.max(1, Math.round((now - recent.at) / 60000)) } : null
}
