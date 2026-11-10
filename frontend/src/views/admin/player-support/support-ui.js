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
// A player's message that came by mail has kind "chat_in" and delivery "mail".
export function deliveryLabel (status, kind) {
  if (status === 'mail' && kind === 'chat_in') return 'Received by mail'
  return { pending: 'Sending', failed: 'Failed', unconfirmed: 'Unconfirmed', mail: 'Sent by mail' }[status] || status
}

// Shown where staff send mail while World reports "mail_replies".
export const mailRepliesHint = 'The player can answer this mail in game while Player replies is on.'

// Chip tone: colour only where the state means something.
export function deliveryTone (status) {
  return { failed: 'is-danger', pending: 'is-warning', unconfirmed: 'is-warning' }[status] || null
}

export function deliveryIcon (status, kind) {
  if (status === 'mail') return 'fe fe-mail'
  if (status === 'pending') return 'fe fe-clock'
  if (status === 'failed') return 'fe fe-x-circle'
  return kind === 'chat_in' ? 'fe fe-info' : 'fe fe-alert-triangle'
}

// What a delivery state means, for its tooltip.
export function deliveryHint (status, kind) {
  if (status === 'mail') return kind === 'chat_in' ? 'The player answered by in-game mail.' : 'Nobody on the account was in game, so this went to their in-game mailbox.'
  return {
    pending: 'Waiting for World to confirm delivery.',
    failed: 'World did not deliver this message. The player did not get it.',
    unconfirmed: 'World did not confirm delivery. It may have reached the player; check before sending it again.'
  }[status] || ''
}

// Timeline families: each entry kind's colour, icon ring and filter. A kind
// the page does not know yet is "system".
const timelineFamilies = {
  chat_in: 'player',
  chat_out: 'gm',
  reply: 'mail',
  pending: 'mail',
  parcel: 'parcel',
  claim: 'workflow',
  release: 'workflow',
  take: 'workflow',
  assign: 'workflow',
  wait: 'workflow',
  resolve: 'workflow',
  reopen: 'workflow',
  merge: 'workflow',
  categorize: 'workflow',
  subject: 'workflow',
  escalate: 'workflow',
  deescalate: 'workflow',
  chat_on: 'workflow',
  chat_off: 'workflow',
  petition_close: 'workflow',
  kick: 'account',
  sanction: 'account',
  revoke: 'account',
  character_move: 'recovery',
  corpse_move: 'recovery',
  corpse_exp: 'recovery',
  lockout: 'tools',
  task: 'tools',
  bug_link: 'tools',
  afk_mail: 'mail',
  note: 'note',
  account_note: 'note',
  chat_view: 'system',
  linked_view: 'system'
}

export function timelineFamily (kind) {
  return timelineFamilies[kind] || 'system'
}

// The timeline filter a family belongs to: messages, notes or actions.
export function timelineFilterOf (family) {
  if (family === 'player' || family === 'gm' || family === 'mail') return 'messages'
  if (family === 'note') return 'notes'
  return 'actions'
}

export function relativeTime (value, now = Date.now()) {
  const time = value instanceof Date ? value.getTime() : typeof value === 'number' ? value * 1000 : new Date(value).getTime()
  const minutes = Math.max(0, Math.floor((now - time) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1440)}d ago`
}

// A time's tooltip everywhere in Player Support: the full date and how long ago.
export function timeTitle (value, now = Date.now()) {
  const date = value instanceof Date ? value : typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  if (isNaN(date)) return ''
  return `${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)} · ${relativeTime(date, now)}`
}

// Per-browser record of the latest player reply each viewer has seen. Storage
// can be unavailable (private windows, blocked site data); everything still
// works, replies just are not marked as new.
const seenKey = 'spire-player-support-seen'

export function readSeen () {
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

// Per-browser queue choices: the filter, the category and the search, so the
// queue opens the way staff left it.
const queueKey = 'spire-player-support-queue'
const queueFilters = ['open', 'urgent', 'mine', 'unassigned', 'waiting', 'attention', 'resolved']

export function readQueuePrefs () {
  const prefs = { filter: 'open', category: '', search: '' }
  try {
    const saved = JSON.parse(window.localStorage.getItem(queueKey) || '{}') || {}
    if (queueFilters.includes(saved.filter)) prefs.filter = saved.filter
    if (supportCategories.some(item => item.id === saved.category)) prefs.category = saved.category
    if (typeof saved.search === 'string') prefs.search = saved.search.slice(0, 200)
  } catch (e) {
    // Storage unavailable: the queue opens on Active.
  }
  return prefs
}

export function saveQueuePrefs (prefs) {
  try {
    window.localStorage.setItem(queueKey, JSON.stringify({ filter: prefs.filter, category: prefs.category, search: prefs.search }))
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

// Focus an element of a dialog after it re-renders. A b-modal moves its
// content to the end of the body and updates it a tick after the page, so
// $nextTick can run before the element exists.
export function focusLater (find) {
  setTimeout(() => {
    const element = find()
    const target = Array.isArray(element) ? element[0] : element
    if (target && typeof target.focus === 'function') target.focus()
  }, 0)
}

// A request ID for an action the server must apply only once.
export function newRequestId () {
  return Array.from(window.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
}

// Tells are limited to 200 printable ASCII characters.
export function fitsTell (text) {
  return text.length > 0 && text.length <= 200 && !/[^\x20-\x7E]/.test(text)
}

// Typographic characters that word processors and chat apps put in pasted
// text, as the plain ASCII a tell can carry.
const asciiSwaps = [
  [/[\u2018\u2019\u201A\u2032]/g, "'"],
  [/[\u201C\u201D\u201E\u2033]/g, '"'],
  [/[\u2013\u2014\u2212]/g, '-'],
  [/\u2026/g, '...'],
  [/[\u00A0\u2007\u202F\u2009\u200A]/g, ' '],
  [/[\u200B\uFEFF]/g, '']
]

export function plainText (text) {
  return asciiSwaps.reduce((value, [pattern, swap]) => value.replace(pattern, swap), String(text || ''))
}

// A tell is one line: line breaks become spaces.
export function tellText (text) {
  return plainText(text).replace(/[ \t]*[\r\n]+[ \t]*/g, ' ')
}

// A delivered Game Master tell also shows as a marquee: "Game Master: " and
// the message, cut to 120 characters ending in "...".
export const marqueeLimit = 120
const marqueePrefix = 'Game Master: '

export function marqueeText (text) {
  const full = marqueePrefix + String(text || '').trim()
  return full.length > marqueeLimit ? full.slice(0, marqueeLimit - 3) + '...' : full
}

export function marqueeCuts (text) {
  return (marqueePrefix + String(text || '').trim()).length > marqueeLimit
}

// Unsent drafts per case and composer ("chat", "mail"), kept for this browser
// tab so a draft survives switching cases or tabs and closing a dialog. When
// storage is unavailable they last until the page reloads.
const draftKey = 'spire-player-support-drafts'
const draftMemory = {}

function readDrafts () {
  try {
    return JSON.parse(window.sessionStorage.getItem(draftKey) || '{}') || {}
  } catch (e) {
    return draftMemory
  }
}

export function readDraft (kind, caseKey) {
  if (!caseKey) return null
  const value = readDrafts()[kind + ':' + caseKey]
  return value === undefined ? null : value
}

export function saveDraft (kind, caseKey, value) {
  if (!caseKey) return
  const name = kind + ':' + caseKey
  const empty = value == null || (typeof value === 'string' ? !value.trim() : !Object.values(value).some(part => String(part || '').trim()))
  const drafts = readDrafts()
  if (empty) delete drafts[name]
  else drafts[name] = value
  if (empty) delete draftMemory[name]
  else draftMemory[name] = value
  try {
    window.sessionStorage.setItem(draftKey, JSON.stringify(drafts))
  } catch (e) {
    // Storage unavailable: the in-memory copy is used.
  }
}

// "Today", "Yesterday" or the date, for the day separators of a conversation.
export function dayLabel (value, now = new Date()) {
  const date = new Date(value)
  if (isNaN(date)) return ''
  const start = day => new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
  const days = Math.round((start(now) - start(date)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric' }).format(date)
}

// The staff a case can be assigned to. Without Spire authentication the list
// holds only the signed-in user, as id 0, which the server reads as
// "unassign"; "Take it myself" and Claim already cover that user.
export function assignableStaff (staff) {
  return (staff || []).filter(member => member && member.id)
}

// Case categories, in their fixed order. `hint` is the triage line shown on a
// case with that category; `tools` names the buttons beside it (the page
// decides which ones the viewer may use).
export const supportCategories = [
  { id: 'items', label: 'Lost or missing items', hint: 'Check Evidence for trades, sales and destroys, then trace or restore the item.', tools: ['evidence', 'items'] },
  { id: 'corpse', label: 'Corpse or death', hint: 'Find the corpse, move it to the player, or restore its experience.', tools: ['corpses'] },
  { id: 'stuck', label: 'Stuck or location', hint: 'Move the character to their bind point or a safe spot.', tools: ['move'] },
  { id: 'quest', label: 'Quest or progress', hint: 'Check tasks, lockouts and flags.', tools: ['tasks', 'lockouts'] },
  { id: 'conduct', label: 'Player conduct', hint: 'Set the reported player, review their chat in Evidence, then use Account Action.', tools: ['evidence', 'discipline'] },
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

// Copies text to the clipboard; resolves to whether it worked.
export function copyText (text) {
  try {
    return navigator.clipboard.writeText(String(text)).then(() => true, () => false)
  } catch (e) {
    return Promise.resolve(false)
  }
}

// Arrow keys, Home and End on a role="tablist": move to the next enabled tab
// and select it (automatic activation). Bind on the tablist's keydown.
export function tablistKeydown (event) {
  const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'first', End: 'last' }
  const step = keys[event.key]
  if (!step || event.altKey || event.ctrlKey || event.metaKey) return
  const tabs = Array.from(event.currentTarget.querySelectorAll('[role="tab"]')).filter(tab => !tab.disabled)
  if (!tabs.length) return
  const index = tabs.indexOf(document.activeElement)
  let next
  if (step === 'first') next = tabs[0]
  else if (step === 'last') next = tabs[tabs.length - 1]
  else next = tabs[(Math.max(index, 0) + step + tabs.length) % tabs.length]
  event.preventDefault()
  next.focus()
  if (next.getAttribute('aria-selected') !== 'true') next.click()
}

// A phone or a touch screen: a text field focused on its own would open the
// on-screen keyboard over the dialog, so dialogs focus their first control there.
export function touchLayout () {
  return typeof window !== 'undefined' && Boolean(window.matchMedia) && window.matchMedia('(max-width: 575px), (pointer: coarse)').matches
}
