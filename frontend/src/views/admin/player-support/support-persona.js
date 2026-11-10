// The Game Master persona: the name players see on this staff member's tells
// from Spire, "(GM) <persona>". One per Spire user (GET and PUT
// player-support/persona), shared by every place on the page that shows or
// changes it, so the composer and the page header always agree.

import Vue from 'vue'
import { SpireApi } from '@/app/api/spire-api'

export const DEFAULT_PERSONA = 'Game Master'
export const PERSONA_MAX = 24

// What the server last said: persona is "" for the default; available is World
// on this connection accepting personas, with reason saying why not.
export const personaState = Vue.observable({
  persona: '',
  display: DEFAULT_PERSONA,
  available: false,
  reason: '',
  warning: '',
  loaded: false
})

// The connection the state belongs to, the request that is loading it (kept
// once it succeeds, so callers share it), and a number that changes whenever
// an answer still on its way stops counting: a newer load, another
// connection, or a save.
let stateConnection = null
let pending = null
let sequence = 0

function apply (data) {
  if (!data || typeof data.display !== 'string') return
  personaState.persona = data.persona || ''
  personaState.display = data.display || DEFAULT_PERSONA
  personaState.available = Boolean(data.available)
  personaState.reason = data.reason || ''
  personaState.warning = data.warning || ''
}

// Whether World takes a persona is a property of the connection: another
// connection starts unknown, so no control shows what only the last one allowed.
function forgetConnection (connectionId) {
  stateConnection = connectionId
  pending = null
  sequence++
  personaState.available = false
  personaState.reason = ''
  personaState.warning = ''
  personaState.loaded = false
}

// Loads the persona for a connection; callers share one request. A failed
// request is tried again on the next call, and an answer for a connection or
// a request that is no longer current is dropped.
export function loadPersona (connectionId) {
  if (connectionId !== stateConnection) forgetConnection(connectionId)
  if (pending) return pending
  const ticket = ++sequence
  const current = () => ticket === sequence && stateConnection === connectionId
  const request = SpireApi.v1().get('player-support/persona', { params: { connection_id: connectionId } })
    .then(({ data }) => {
      if (current()) apply(data)
    })
    .catch(() => {
      // Unknown: tells go as GameMaster and the control stays off, until a later call asks again.
      if (current()) pending = null
    })
    .finally(() => {
      if (current()) personaState.loaded = true
    })
  pending = request
  return request
}

// Saves a persona ("" for the default) and returns the server's answer, which
// a load still on its way cannot overwrite.
export async function savePersona (connectionId, value) {
  // A load on its way answers from before this save.
  sequence++
  let data
  try {
    ({ data } = await SpireApi.v1().put('player-support/persona', { persona: (value || '').trim() }, { params: { connection_id: connectionId } }))
  } catch (error) {
    // The load this save made stale no longer counts: the next call asks again.
    if (stateConnection === connectionId) pending = null
    throw error
  }
  if (stateConnection === connectionId) {
    // Nor may a load started while saving overwrite the answer; it stands as loaded.
    sequence++
    apply(data)
    personaState.loaded = true
    pending = Promise.resolve()
  }
  return personaState
}

// World's rules for a persona; the server checks them again. "" for a name
// that can be saved (an empty field means the default).
export function personaProblem (value) {
  const name = (value || '').trim()
  if (!name || name === DEFAULT_PERSONA) return ''
  if (!/^[A-Za-z]/.test(name)) return 'Start with a letter.'
  if (!/^[A-Za-z ]+$/.test(name)) return 'Use letters and single spaces only, starting with a letter.'
  if (/ {2,}/.test(name)) return 'Use letters and single spaces only, starting with a letter.'
  if (name.length < 3 || name.length > PERSONA_MAX) return `Use 3 to ${PERSONA_MAX} characters.`
  if (name.replace(/ /g, '').toLowerCase() === 'gamemaster') return 'Game Master is the default name; use the default or choose another name.'
  return ''
}

// The name a tell shows: "(GM) <name>", or GameMaster where personas do not apply.
export function tellName (state = personaState) {
  return state.available ? '(GM) ' + (state.display || DEFAULT_PERSONA) : 'GameMaster'
}

// The first-use hint, dismissed once per browser.
const nudgeKey = 'spire-player-support-persona-hint'
export function personaHintDismissed () {
  try {
    return window.localStorage.getItem(nudgeKey) === '1'
  } catch (e) {
    return false
  }
}
export function dismissPersonaHint () {
  try {
    window.localStorage.setItem(nudgeKey, '1')
  } catch (e) {
    // Private windows: the hint comes back next time.
  }
}
