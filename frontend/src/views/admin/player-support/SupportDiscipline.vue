<template>
  <b-modal ref="modal" visible scrollable centered size="lg" modal-class="support-modal"
           :no-close-on-backdrop="saving" :no-close-on-esc="saving" :hide-header-close="saving" @hide="onHide" @shown="focusFirst">
    <template #modal-title>Account Action <span class="support-modal-subject">· {{ record.account }}</span></template>
    <support-load-state v-if="loadError || (loading && !info)" :error="loadError" label="Loading the account" :rows="4" @retry="load" />

    <!-- Second confirmation for suspend and ban -->
    <section v-else-if="info && step === 'confirm'" class="discipline-confirm" aria-label="Confirm restriction">
      <p class="support-callout is-warning discipline-flush" role="alert"><i class="fe fe-alert-triangle" aria-hidden="true"></i>
        <span><strong>{{ confirmQuestion }}</strong> Every character on it is blocked at login and kicked if in game.</span></p>
      <dl class="support-dl is-boxed">
        <dt>Account</dt><dd>{{ info.account.name }}</dd>
        <dt>Restriction</dt><dd>{{ action === 'ban' ? 'Ban, until lifted' : 'Suspension until ' + formatDate(untilIso) }}</dd>
        <template v-if="info.online_character"><dt>In game now</dt><dd>{{ info.online_character }}</dd></template>
        <dt>Reason</dt><dd>{{ reason.trim() }}</dd>
        <dt>Player notice</dt><dd>Mailed, without your reason</dd>
      </dl>
      <p v-if="error" class="support-callout is-danger discipline-flush" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>
    </section>

    <div v-else-if="info" class="discipline">
      <dl class="support-dl is-boxed">
        <dt>Status</dt>
        <dd><span class="support-chip" :class="statusTone">{{ statusText }}</span></dd>
        <dt>Reason</dt><dd>{{ restrictionReason || 'None' }}</dd>
        <dt>Chat</dt><dd><span class="support-chip" :class="info.account.revoked ? 'is-warning' : null">{{ info.account.revoked ? 'Revoked' : 'Allowed' }}</span></dd>
        <dt>Playing now</dt><dd>{{ info.online_character || 'Nobody' }}</dd>
      </dl>

      <p v-if="info.legacy_sanction" class="support-callout is-warning"><i class="fe fe-alert-triangle" aria-hidden="true"></i>
        <span>This account was restricted in Spire before restrictions blocked login. Apply it again to enforce it.</span></p>
      <support-result v-if="result" :result="result" dismissible @dismiss="result = null" />

      <h3 class="support-section-label discipline-heading">Action</h3>
      <div class="discipline-options" role="group" aria-label="Disciplinary action">
        <button v-for="option in options" :key="option.id" type="button" class="support-option discipline-option" :class="{ 'is-danger': option.danger }"
                :aria-pressed="String(action === option.id)" :disabled="Boolean(option.blocked) || saving" @click="choose(option.id)">
          <span class="discipline-option-title"><i :class="option.icon" aria-hidden="true"></i> {{ option.label }}</span>
          <small>{{ option.text }}</small>
          <small v-if="option.blocked && option.blocked !== noWrite" class="support-blocked discipline-blocked"><i class="fe fe-lock" aria-hidden="true"></i><span>{{ option.blocked }}</span></small>
        </button>
      </div>

      <section v-if="action" class="discipline-fields" :aria-label="currentOption.label">
        <div v-if="action === 'suspend'" class="discipline-until">
          <label for="discipline-until" class="support-label">Until</label>
          <input id="discipline-until" ref="until" v-model="until" class="support-field" type="datetime-local" :min="minUntil" :disabled="saving"
                 :aria-invalid="untilError ? 'true' : null" :aria-describedby="untilError ? 'discipline-until-error' : null" @input="error = ''; untilDays = 0">
          <div class="support-suggestions discipline-presets" role="group" aria-label="Suspension length">
            <button v-for="preset in untilPresets" :key="preset.days" type="button" :aria-pressed="String(untilDays === preset.days)" :disabled="saving" @click="setUntil(preset.days)">{{ preset.label }}</button>
          </div>
          <p v-if="untilError" id="discipline-until-error" class="support-feedback is-error"><i class="fe fe-alert-circle" aria-hidden="true"></i> Choose a time in the future.</p>
        </div>
        <p v-if="consequence" class="support-callout" :class="currentOption.danger ? 'is-warning' : null">
          <i :class="consequence.icon" aria-hidden="true"></i><span>{{ consequence.text }}</span>
        </p>
        <support-reason id="discipline-reason" ref="reason" v-model="reason" :disabled="saving" :note="noticeText" @input="error = ''" @submit="primary" />
        <p v-if="error" class="support-callout is-danger discipline-flush" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>
      </section>
    </div>

    <template #modal-footer>
      <span v-if="info && writeBlock && step === 'choose'" class="support-footer-note"><i class="fe fe-lock" aria-hidden="true"></i>{{ writeBlock }}.</span>
      <template v-if="step === 'confirm'">
        <button ref="back" type="button" class="support-button" :disabled="saving" @click="back">Back</button>
        <button type="button" class="support-button is-danger is-solid" :disabled="saving" @click="submit">
          <i :class="saving ? 'fe fe-loader support-spin' : currentOption.icon" aria-hidden="true"></i> {{ saving ? 'Saving…' : currentOption.button }}
        </button>
      </template>
      <template v-else>
        <button type="button" class="support-button" :disabled="saving" @click="$emit('close')">Close</button>
        <button v-if="action" type="button" class="support-button" :class="currentOption.danger ? 'is-danger is-solid' : 'is-primary'" :disabled="saving" @click="primary">
          <i :class="saving ? 'fe fe-loader support-spin' : currentOption.icon" aria-hidden="true"></i> {{ saving ? 'Saving…' : currentOption.button }}
        </button>
      </template>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { focusLater, newRequestId } from './support-ui'
import { dialogFocus } from './support-dialog'
import SupportLoadState from './SupportLoadState.vue'
import SupportReason from './SupportReason.vue'
import SupportResult from './SupportResult.vue'

function localValue (date) {
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default {
  name: 'SupportDiscipline',
  components: { SupportLoadState, SupportReason, SupportResult },
  mixins: [dialogFocus],
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    features: { type: Object, default: () => ({}) },
    canSanction: { type: Boolean, default: false }
  },
  data () {
    return {
      info: null,
      loading: false,
      loadError: '',
      action: '',
      step: 'choose',
      until: '',
      // The preset length the "Until" time came from, until it is edited.
      untilDays: 0,
      untilTried: false,
      untilPresets: [{ days: 1, label: '1 day' }, { days: 3, label: '3 days' }, { days: 7, label: '7 days' }, { days: 30, label: '30 days' }],
      reason: '',
      saving: false,
      error: '',
      result: null,
      now: Date.now()
    }
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
    // Why nothing can be changed here; said once in the footer, not on every option.
    noWrite () { return this.canSanction ? (this.record.status === 'resolved' ? 'Reopen the case first' : '') : 'Needs Player Operations write access' },
    options () {
      if (!this.info) return []
      const info = this.info
      const online = info.online_character
      const name = online || this.record.character
      const noWrite = this.noWrite
      const kick = noWrite || (!info.local_world
        ? 'Kicking needs the game server this Spire runs beside'
        : !online ? `No character on ${this.account.name} is in a zone right now` : '')
      const sanction = noWrite || (info.sanctionable ? '' : info.sanction_note || 'This account cannot be restricted from Spire.')
      const banned = Number(this.account.status) === -2 || Boolean(this.account.ban_reason)
      const revokeBlocked = noWrite || (online && (!info.local_world || !this.features.revoke)
        ? `${online} is in game. Revoking chat for a player in game needs the updated Player Support patch; kick them first or wait until they log out.`
        : '')
      const options = [
        { id: 'kick', label: `Kick ${name}`, icon: 'fe fe-log-out', text: 'Disconnects the character now. Nothing else changes.', blocked: kick, button: 'Kick', danger: true },
        {
          id: 'suspend',
          label: 'Suspend',
          icon: 'fe fe-clock',
          text: 'Blocks login until a time you choose.',
          button: 'Suspend account',
          danger: true,
          blocked: sanction || (banned ? 'Clear the existing indefinite ban before applying a temporary suspension' : '')
        },
        { id: 'ban', label: 'Ban', icon: 'fe fe-slash', text: 'No end date. Every character on the account is blocked.', blocked: sanction, button: 'Ban account', danger: true }
      ]
      if (this.restricted) {
        options.push({ id: 'clear', label: 'Lift restriction', icon: 'fe fe-unlock', text: 'Lets the account log in again.', blocked: noWrite, button: 'Lift restriction' })
      }
      options.push(this.account.revoked
        ? { id: 'revoke', label: 'Restore chat', icon: 'fe fe-mic', text: this.revokePolicy.restore, blocked: revokeBlocked, button: 'Restore chat' }
        : { id: 'revoke', label: 'Revoke chat', icon: 'fe fe-mic-off', text: this.revokePolicy.revoke, blocked: revokeBlocked, button: 'Revoke chat', danger: true })
      return options
    },
    currentOption () { return this.options.find(option => option.id === this.action) || {} },
    // Only the updated patch has a fixed chat policy. On stock EQEmu and the
    // earlier patch the revoked flag also blocks tells, blocks OOC and auction
    // only when they are server-wide, and never blocks shout.
    revokePolicy () {
      return this.features.revoke
        ? { revoke: 'Blocks OOC, auction and shout. Tells still work.', restore: 'Allows OOC, auction and shout again.' }
        : { revoke: 'Restricts the account’s chat. Exactly which channels depends on the server build.', restore: 'Lifts the account’s chat restriction.' }
    },
    reasonBytes () { return new TextEncoder().encode(this.reason.trim()).length },
    // What the chosen action does, said before it is confirmed.
    consequence () {
      const info = this.info
      if (!info) return null
      if (this.action === 'ban') return { icon: 'fe fe-slash', text: 'Blocks login until lifted.' }
      if (this.action === 'clear') return { icon: 'fe fe-unlock', text: 'The account can log in again. Its status returns to Player.' }
      if (this.action === 'kick') return { icon: 'fe fe-log-out', text: `${info.online_character} is disconnected from the game. The account is not restricted and can log in again.` }
      if (this.action === 'revoke') {
        const policy = this.account.revoked ? this.revokePolicy.restore : this.revokePolicy.revoke
        return { icon: this.account.revoked ? 'fe fe-mic' : 'fe fe-mic-off', text: `${policy} ${info.online_character ? 'The change applies at once in game.' : 'It applies when the player next logs in.'}` }
      }
      return null
    },
    noticeText () {
      const text = 'The player is mailed a notice of this action. Your reason is not included.'
      return this.features.mail_replies ? `${text} If they answer it, the answer lands on the case while Player replies is on.` : text
    },
    untilError () { return this.action === 'suspend' && (this.untilTried || Boolean(this.until)) && !this.untilValid },
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
    }
  },
  mounted () { this.load() },
  methods: {
    focusFirst () { if (this.info) this.focusInDialog('.discipline-option:not(:disabled)') },
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
        const first = !this.info
        this.info = data
        this.now = Date.now()
        if (first) this.focusFirst()
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
      this.untilTried = false
      this.now = Date.now()
      if (id === 'suspend' && !this.until) this.setUntil(3)
      if (this.$refs.reason) this.$refs.reason.reset()
      focusLater(() => this.$refs.reason)
    },
    setUntil (days) {
      this.until = localValue(new Date(Date.now() + days * 86400000))
      this.untilDays = days
      this.error = ''
    },
    // Checks the fields in order and says what is missing next to it; the
    // button itself stays enabled.
    primary () {
      if (!this.action || this.currentOption.blocked || this.saving) return
      if (this.action === 'suspend' && !this.untilValid) {
        this.untilTried = true
        focusLater(() => this.$refs.until)
        return
      }
      if (!this.$refs.reason.check()) return
      if (this.action === 'ban' || this.action === 'suspend') {
        this.error = ''
        this.step = 'confirm'
        // The safe choice has focus, not the restriction.
        focusLater(() => this.$refs.back)
        return
      }
      this.submit()
    },
    back () {
      this.step = 'choose'
      focusLater(() => this.$refs.reason)
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
          receipt = { status: 'unconfirmed', message: 'The game server did not confirm the change. Check the result in game before trying again.' }
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
        this.untilDays = 0
        this.step = 'choose'
        focusLater(() => this.dialogElement())
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
.discipline-confirm { display: grid; gap: var(--support-space-3); }
.discipline-heading { margin: 0 0 calc(var(--support-space-2) * -1); }
.discipline-options { display: grid; gap: var(--support-space-1); }
.discipline-options .discipline-option { gap: 2px; padding: var(--support-space-2) var(--support-space-3); }
.discipline-option-title { display: inline-flex; align-items: center; gap: var(--support-space-2); font-weight: 600; }
.discipline-option-title i { width: 14px; color: var(--support-muted); text-align: center; }
.discipline-option[aria-pressed="true"] .discipline-option-title i { color: var(--support-accent); }
/* A restriction, once chosen, carries the danger colour instead of gold. */
.discipline-options .discipline-option.is-danger[aria-pressed="true"] { border-color: var(--support-danger-line); box-shadow: inset 2px 0 0 var(--support-danger); }
.discipline-option.is-danger[aria-pressed="true"] .discipline-option-title i { color: var(--support-danger); }
.discipline-option small { padding-left: 22px; color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.45; }
.discipline-options .discipline-option:disabled { cursor: not-allowed; }
.discipline-options .discipline-option:disabled .discipline-option-title { color: var(--support-muted); }
.discipline-option small.discipline-blocked { padding-left: 22px; }
.discipline-fields { display: grid; gap: var(--support-space-3); padding-top: var(--support-space-1); }
.discipline-fields > .support-callout { margin: 0; }
.discipline-until { display: grid; justify-items: start; gap: var(--support-space-2); }
.discipline-until .support-label { margin: 0; }
.discipline-until .support-field { max-width: 260px; }
.discipline-until .support-feedback { margin: 0; }
</style>
