<template>
  <b-modal visible scrollable centered size="lg" modal-class="support-modal" :title="'Discipline · ' + record.account"
           :no-close-on-backdrop="saving" :no-close-on-esc="saving" :hide-header-close="saving" @hide="onHide">
    <p v-if="loadError" class="support-callout is-danger" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ loadError }}</span></p>
    <p v-else-if="loading && !info" class="support-feedback discipline-flush" role="status"><i class="fe fe-loader support-spin" aria-hidden="true"></i> Loading the account…</p>

    <!-- Second confirmation for suspend and ban -->
    <section v-else-if="info && step === 'confirm'" class="discipline-confirm" aria-label="Confirm restriction">
      <p class="support-callout is-warning discipline-flush" role="alert"><i class="fe fe-alert-triangle" aria-hidden="true"></i>
        <span><strong>{{ confirmQuestion }}</strong> Every character on it is blocked at login and kicked if in game.</span></p>
      <dl class="support-dl discipline-summary">
        <dt>Account</dt><dd>{{ info.account.name }}</dd>
        <dt>Restriction</dt><dd>{{ action === 'ban' ? 'Ban, until lifted' : 'Suspension until ' + formatDate(untilIso) }}</dd>
        <template v-if="info.online_character"><dt>In game now</dt><dd>{{ info.online_character }}</dd></template>
        <dt>Reason</dt><dd>{{ reason.trim() }}</dd>
      </dl>
      <p v-if="error" class="support-callout is-danger discipline-gap" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>
    </section>

    <div v-else-if="info" class="discipline">
      <dl class="support-dl discipline-summary">
        <dt>Status</dt>
        <dd><span class="support-chip" :class="statusTone">{{ statusText }}</span></dd>
        <dt>Reason</dt><dd>{{ restrictionReason || 'None' }}</dd>
        <dt>Chat</dt><dd><span class="support-chip" :class="info.account.revoked ? 'is-warning' : null">{{ info.account.revoked ? 'Revoked' : 'Allowed' }}</span></dd>
        <dt>Playing now</dt><dd>{{ info.online_character || 'Nobody' }}</dd>
      </dl>

      <p v-if="info.legacy_sanction" class="support-callout is-warning"><i class="fe fe-alert-triangle" aria-hidden="true"></i>
        <span>This account was restricted in Spire before restrictions blocked login. Apply it again to enforce it.</span></p>
      <p v-if="result" class="support-callout" :class="resultTone" :role="result.status === 'sent' ? 'status' : 'alert'">
        <i :class="resultIcon" aria-hidden="true"></i><span>{{ result.message }}</span>
      </p>

      <h3 class="support-section-label discipline-heading">Action</h3>
      <div class="discipline-options" role="group" aria-label="Disciplinary action">
        <button v-for="option in options" :key="option.id" type="button" class="support-option discipline-option" :aria-pressed="String(action === option.id)"
                :disabled="Boolean(option.blocked) || saving" @click="choose(option.id)">
          <span class="discipline-option-title"><i :class="option.icon" aria-hidden="true"></i> {{ option.label }}</span>
          <small>{{ option.text }}</small>
          <small v-if="option.blocked" class="discipline-blocked"><i class="fe fe-lock" aria-hidden="true"></i> {{ option.blocked }}</small>
        </button>
      </div>

      <section v-if="action" class="discipline-fields" :aria-label="currentOption.label">
        <template v-if="action === 'suspend'">
          <label for="discipline-until" class="support-label discipline-first">Until</label>
          <input id="discipline-until" v-model="until" class="support-field discipline-until" type="datetime-local" :min="minUntil" :disabled="saving" @input="error = ''">
          <p v-if="until && !untilValid" class="support-feedback is-error">Choose a time in the future.</p>
        </template>
        <p v-if="action === 'ban'" class="support-callout is-warning"><i class="fe fe-slash" aria-hidden="true"></i><span>Blocks login until lifted.</span></p>
        <p v-if="action === 'clear'" class="support-callout"><i class="fe fe-unlock" aria-hidden="true"></i><span>The account can log in again. Its status returns to Player.</span></p>
        <p v-if="action === 'kick'" class="support-callout"><i class="fe fe-log-out" aria-hidden="true"></i>
          <span>{{ info.online_character }} is disconnected from the game. The account is not restricted and can log in again.</span></p>
        <p v-if="action === 'revoke'" class="support-callout"><i class="fe fe-mic-off" aria-hidden="true"></i>
          <span>{{ info.account.revoked ? 'OOC, auction and shout are allowed again.' : 'Blocks OOC, auction and shout. Tells still work.' }}
            {{ info.online_character ? 'The change applies at once in game.' : 'It applies when the player next logs in.' }}</span></p>

        <label for="discipline-reason" class="support-label">Reason <span class="support-label-hint">(required, recorded on the case)</span></label>
        <textarea id="discipline-reason" ref="reason" v-model="reason" class="support-field" rows="2" maxlength="240" :disabled="saving"
                  aria-describedby="discipline-reason-hint" @input="error = ''"></textarea>
        <span id="discipline-reason-hint" class="discipline-hint" :class="{ 'is-short': reason.trim() && reasonBytes < 8 }">8–240 characters · {{ reasonBytes }}/240</span>
        <p v-if="error" class="support-callout is-danger discipline-gap" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>
      </section>
    </div>

    <template #modal-footer>
      <span v-if="info && writeBlock && step === 'choose'" class="support-footer-note">{{ writeBlock }}.</span>
      <template v-if="step === 'confirm'">
        <button type="button" class="support-button" :disabled="saving" @click="step = 'choose'">Back</button>
        <button type="button" class="support-button is-primary" :disabled="saving || !ready" @click="submit">
          <i :class="currentOption.icon" aria-hidden="true"></i> {{ saving ? 'Saving…' : currentOption.button }}
        </button>
      </template>
      <template v-else>
        <button type="button" class="support-button" :disabled="saving" @click="$emit('close')">Close</button>
        <button v-if="action" type="button" class="support-button is-primary" :disabled="saving || !ready" @click="primary">
          <i :class="currentOption.icon" aria-hidden="true"></i> {{ saving ? 'Saving…' : currentOption.button }}
        </button>
      </template>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { newRequestId } from './support-ui'

function localValue (date) {
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default {
  name: 'SupportDiscipline',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    features: { type: Object, default: () => ({}) },
    canSanction: { type: Boolean, default: false }
  },
  data () {
    return { info: null, loading: false, loadError: '', action: '', step: 'choose', until: '', reason: '', saving: false, error: '', result: null, now: Date.now() }
  },
  computed: {
    endpoint () { return `player-support/cases/${encodeURIComponent(this.record.key)}` },
    params () { return { connection_id: this.connectionId } },
    account () { return (this.info && this.info.account) || {} },
    // Why this viewer cannot change anything here, or ''. The server refuses
    // changes on a resolved case.
    writeBlock () {
      if (!this.canSanction) return 'Changing restrictions needs Player Operations write access'
      if (this.record.status === 'resolved') return 'Reopen the case to change restrictions'
      return ''
    },
    restricted () {
      const status = Number(this.account.status)
      return status === -1 || status === -2 || Boolean(this.info && this.info.legacy_sanction)
    },
    statusText () {
      const status = Number(this.account.status)
      if (status === 0) return 'Player'
      if (status === -1) return this.account.suspended_until ? `Suspended until ${this.formatDate(this.account.suspended_until)}` : 'Suspended'
      if (status === -2) return 'Banned'
      return `Status ${status}`
    },
    statusTone () { return { '-1': 'is-warning', '-2': 'is-danger' }[String(this.account.status)] || null },
    restrictionReason () {
      const status = Number(this.account.status)
      if (status === -2) return this.account.ban_reason || this.account.suspend_reason
      if (status === -1) return this.account.suspend_reason || this.account.ban_reason
      return this.account.ban_reason || this.account.suspend_reason
    },
    options () {
      if (!this.info) return []
      const info = this.info
      const online = info.online_character
      const name = online || this.record.character
      const noWrite = this.canSanction ? (this.record.status === 'resolved' ? 'Reopen the case first' : '') : 'Needs Player Operations write access'
      const kick = noWrite || (!info.local_world
        ? 'Kicking needs the game server this Spire runs beside'
        : !online ? `No character on ${this.account.name} is in a zone right now` : '')
      const sanction = noWrite || (info.sanctionable ? '' : info.sanction_note || 'This account cannot be restricted from Spire.')
      const banned = Number(this.account.status) === -2 || Boolean(this.account.ban_reason)
      const revokeBlocked = noWrite || (online && (!info.local_world || !this.features.revoke)
        ? `${online} is in game. Revoking chat for a player in game needs the updated Player Support patch; kick them first or wait until they log out.`
        : '')
      const options = [
        { id: 'kick', label: `Kick ${name}`, icon: 'fe fe-log-out', text: 'Disconnects the character now. Nothing else changes.', blocked: kick, button: 'Kick' },
        {
          id: 'suspend',
          label: 'Suspend',
          icon: 'fe fe-clock',
          text: 'Blocks login until a time you choose.',
          button: 'Suspend account',
          blocked: sanction || (banned ? 'Clear the existing indefinite ban before applying a temporary suspension' : '')
        },
        { id: 'ban', label: 'Ban', icon: 'fe fe-slash', text: 'No end date. Every character on the account is blocked.', blocked: sanction, button: 'Ban account' }
      ]
      if (this.restricted) {
        options.push({ id: 'clear', label: 'Lift restriction', icon: 'fe fe-unlock', text: 'Lets the account log in again.', blocked: noWrite, button: 'Lift restriction' })
      }
      options.push(this.account.revoked
        ? { id: 'revoke', label: 'Restore chat', icon: 'fe fe-mic', text: 'Allows OOC, auction and shout again.', blocked: revokeBlocked, button: 'Restore chat' }
        : { id: 'revoke', label: 'Revoke chat', icon: 'fe fe-mic-off', text: 'Blocks OOC, auction and shout. Tells still work.', blocked: revokeBlocked, button: 'Revoke chat' })
      return options
    },
    currentOption () { return this.options.find(option => option.id === this.action) || {} },
    reasonBytes () { return new TextEncoder().encode(this.reason.trim()).length },
    minUntil () { return localValue(new Date(this.now + 60000)) },
    untilIso () {
      const time = this.until ? new Date(this.until) : null
      return time && !Number.isNaN(time.getTime()) ? time.toISOString() : ''
    },
    untilValid () { return Boolean(this.untilIso) && new Date(this.untilIso).getTime() > Date.now() },
    ready () {
      if (!this.action || this.currentOption.blocked || this.reasonBytes < 8 || this.reasonBytes > 240) return false
      return this.action !== 'suspend' || this.untilValid
    },
    confirmQuestion () {
      return this.action === 'ban' ? `Ban ${this.account.name}?` : `Suspend ${this.account.name} until ${this.formatDate(this.untilIso)}?`
    },
    resultTone () { return { sent: 'is-success', unconfirmed: 'is-warning' }[this.result && this.result.status] || 'is-danger' },
    resultIcon () { return { sent: 'fe fe-check-circle', unconfirmed: 'fe fe-alert-triangle' }[this.result && this.result.status] || 'fe fe-alert-circle' }
  },
  mounted () { this.load() },
  methods: {
    onHide (event) {
      if (this.saving) {
        event.preventDefault()
        return
      }
      this.$emit('close')
    },
    errorText (error, fallback) { return (error.response && error.response.data && error.response.data.error) || fallback },
    async load () {
      this.loading = true
      this.loadError = ''
      try {
        const { data } = await SpireApi.v1().get(`${this.endpoint}/discipline`, { params: this.params })
        if (!data || !data.account) throw new Error('missing account')
        this.info = data
        this.now = Date.now()
        if (this.currentOption.blocked || !this.currentOption.id) {
          this.action = ''
          this.step = 'choose'
        }
      } catch (error) {
        this.loadError = this.errorText(error, 'The account could not be loaded.')
      } finally {
        this.loading = false
      }
    },
    choose (id) {
      if (this.action === id) return
      this.action = id
      this.error = ''
      this.result = null
      this.now = Date.now()
      if (id === 'suspend' && !this.until) this.until = localValue(new Date(Date.now() + 3 * 86400000))
      this.$nextTick(() => { if (this.$refs.reason && id !== 'suspend') this.$refs.reason.focus() })
    },
    primary () {
      if (!this.ready) return
      if (this.action === 'ban' || this.action === 'suspend') {
        this.error = ''
        this.step = 'confirm'
        return
      }
      this.submit()
    },
    async submit () {
      if (!this.ready || this.saving) return
      const reason = this.reason.trim()
      const request = { reason, request_id: newRequestId() }
      let path = 'sanction'
      let body
      if (this.action === 'kick') {
        path = 'kick'
        body = request
      } else if (this.action === 'revoke') {
        path = 'revoke'
        body = { revoked: !this.account.revoked, ...request }
      } else {
        body = { mode: this.action, expected_suspended_until: this.account.suspended_until || null, ...request }
        if (this.action === 'suspend') body.until = this.untilIso
      }
      this.saving = true
      this.error = ''
      let receipt = null
      try {
        const { data, status } = await SpireApi.v1().put(`${this.endpoint}/${path}`, body, { params: this.params })
        receipt = { status: status === 202 || (data && data.status === 'unconfirmed') ? 'unconfirmed' : (data && data.status) || 'sent', message: (data && data.message) || 'Done.' }
      } catch (error) {
        const response = error.response
        if (!response || (response.status >= 500 && response.status !== 503)) {
          receipt = { status: 'unconfirmed', message: 'Check the result in game before retrying. The change could not be confirmed.' }
        } else {
          this.error = this.errorText(error, 'The change could not be saved.')
          if (response.status === 409) receipt = { status: 'failed', message: this.error }
        }
      }
      this.saving = false
      if (!receipt) return
      if (receipt.status !== 'failed') {
        this.result = receipt
        this.action = ''
        this.reason = ''
        this.until = ''
        this.step = 'choose'
      }
      this.$emit('receipt', receipt)
      await this.load()
    },
    formatDate (value) {
      if (!value) return ''
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    }
  }
}
</script>

<style scoped>
/* Layout only. Colours, type, radius and spacing come from support-theme.css. */
.discipline { display: grid; gap: var(--support-space-4); }
.discipline > .support-callout,
.discipline-flush { margin: 0; }
.discipline-gap { margin: var(--support-space-3) 0 0; }
.discipline-summary { padding: var(--support-space-3); border: 1px solid var(--support-border); border-radius: var(--support-radius-lg); background: var(--support-pane); }
.discipline-confirm .discipline-summary { margin-top: var(--support-space-3); }
.discipline-heading { margin: 0 0 calc(var(--support-space-2) * -1); }
.discipline-options { display: grid; gap: var(--support-space-1); }
.discipline-options .discipline-option { gap: 2px; padding: var(--support-space-2) var(--support-space-3); }
.discipline-option-title { display: inline-flex; align-items: center; gap: var(--support-space-2); font-weight: 600; }
.discipline-option-title i { width: 14px; color: var(--support-muted); text-align: center; }
.discipline-option[aria-pressed="true"] .discipline-option-title i { color: var(--support-accent); }
.discipline-option small { padding-left: 22px; color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.45; }
.discipline-options .discipline-option:disabled { cursor: not-allowed; }
.discipline-options .discipline-option:disabled .discipline-option-title { color: var(--support-muted); }
.discipline-option small.discipline-blocked { display: flex; gap: 6px; color: var(--support-warning); }
.discipline-option small.discipline-blocked i { margin-top: 2px; }
.discipline-fields { display: grid; gap: 0; padding-top: var(--support-space-1); }
.discipline-fields > .support-callout { margin: 0 0 var(--support-space-1); }
.discipline-fields .discipline-first { margin-top: 0; }
.discipline-until { max-width: 260px; }
.discipline-hint { display: block; margin-top: 6px; color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.discipline-hint.is-short { color: var(--support-warning); }
</style>
