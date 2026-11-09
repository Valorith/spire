<template>
  <section class="support-chat" aria-label="Live chat">
    <header class="chat-header">
      <div class="chat-status">
        <h3><span class="chat-dot" :class="'is-' + tone" aria-hidden="true"></span>{{ status }}</h3>
        <p>{{ statusHint }}</p>
      </div>
      <button v-if="active && canWrite" class="chat-button" type="button" :disabled="busy" @click="act('end')">
        <i class="fe fe-toggle-left" aria-hidden="true"></i> Turn off messages
      </button>
      <button v-else-if="canWrite" class="chat-button" type="button" :disabled="busy || state !== 'ready'" @click="act('start')">
        <i class="fe fe-toggle-right" aria-hidden="true"></i> Enable messages
      </button>
    </header>

    <p v-if="error" class="chat-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ error }}</p>
    <div ref="transcript" class="chat-transcript" role="log" aria-label="Chat messages" aria-relevant="additions">
      <div v-if="!messages.length" class="chat-empty">
        <span class="chat-empty-mark"><i class="fe fe-message-circle" aria-hidden="true"></i></span>
        <strong>No messages yet</strong>
        <p v-if="canWrite && state === 'ready'">Send a tell to start the conversation. The player can answer from any character on the account with <code>#petition</code>, <code>/reply</code> or <code>/tell *GameMaster</code>.</p>
        <p v-else>Tells exchanged with any character on {{ record.character }}’s account appear here.</p>
      </div>
      <article v-for="message in messages" :key="message.id" class="chat-message" :class="{ 'is-outgoing': message.kind === 'chat_out' }">
        <div class="chat-message-meta">
          <strong>
            <template v-if="message.kind === 'chat_out'">
              {{ message.actor || 'Game Master' }}
              <span v-if="message.recipient" class="chat-recipient">to {{ message.recipient }}</span>
            </template>
            <template v-else>{{ message.actor || record.character }}</template>
            <span v-if="isAlt(message)" class="chat-alt" :title="'Not the character that filed the petition (' + record.character + ')'">alt</span>
          </strong>
          <time :datetime="message.created_at">{{ formatTime(message.created_at) }}</time>
        </div>
        <p>{{ message.text }}</p>
        <span v-if="message.delivery && message.delivery !== 'sent'" class="chat-message-status" :class="'is-' + message.delivery">
          <i :class="deliveryIcon(message.delivery)" aria-hidden="true"></i> {{ deliveryLabel(message.delivery) }}
        </span>
      </article>
    </div>

    <form v-if="canWrite && (active || composable)" class="chat-composer" @submit.prevent="act('send')">
      <label for="support-live-message">{{ mailing ? 'Mail ' + mailTo : 'Tell ' + target }} <span>as GameMaster</span></label>
      <div class="chat-compose-row">
        <textarea id="support-live-message" v-model="draft" rows="2" maxlength="200" :disabled="busy || !composable"
                  :placeholder="composable ? 'Type a message…' : 'Waiting for ' + target + ' to be reachable…'"
                  @keydown.enter.exact.prevent="act('send')" @input="requestId = ''"></textarea>
        <button class="chat-button chat-primary" type="submit" :disabled="!draft.trim() || busy || !composable">
          <i :class="mailing ? 'fe fe-mail' : 'fe fe-send'" aria-hidden="true"></i> {{ mailing ? 'Send as mail' : 'Send' }}
        </button>
      </div>
      <p v-if="mailing" class="chat-mail-note">
        <i class="fe fe-mail" aria-hidden="true"></i>
        No character on the account is in game, so this goes to {{ mailTo }}’s mailbox. It starts with “This message was sent to you in response to your petition while you were offline:”
      </p>
      <div class="chat-compose-hint">
        <span><kbd>Enter</kbd> to send · plain text only</span>
        <span :class="{ 'is-near': draft.length > 180 }">{{ draft.length }}/200</span>
      </div>
    </form>
  </section>
</template>

<script>
import axios from 'axios'
import { SpireApi } from '@/app/api/spire-api'

export default {
  name: 'SupportLiveChat',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    canWrite: { type: Boolean, default: false }
  },
  data () {
    return {
      state: 'connecting', active: false, messages: [], cursor: 0, draft: '', requestId: '', recipient: '', tellsOff: false, mailTo: '',
      busy: false, error: '', timer: null, cancellation: null, version: 0, stopped: false
    }
  },
  computed: {
    endpoint () { return 'player-support/cases/' + encodeURIComponent(this.record.key) + '/chat' },
    petitionAvailable () {
      return this.record.native_open && this.record.status !== 'resolved' && !this.record.checked_out
    },
    // Tells reach whichever character on the petitioning account is in game.
    target () { return this.recipient || this.record.character },
    // With no character on the account in game, messages are mailed instead.
    mailing () { return this.state === 'offline' && Boolean(this.mailTo) },
    composable () { return this.state === 'ready' || this.mailing },
    onAlt () { return Boolean(this.recipient) && this.recipient.toLowerCase() !== this.record.character.toLowerCase() },
    status () {
      if (this.state === 'ready') return this.active ? 'Messages on' : 'Messages off'
      if (this.state === 'offline') return this.tellsOff ? 'Tells turned off' : 'Player not in game'
      if (this.state === 'connecting') return 'Connecting…'
      return 'Live chat unavailable'
    },
    tone () {
      if (this.state === 'ready') return this.active ? 'on' : 'ready'
      return this.state === 'offline' ? 'away' : 'off'
    },
    // Say why the composer is unavailable so staff know what to change.
    statusHint () {
      const name = this.record.character
      if (!this.petitionAvailable) {
        if (this.record.status === 'resolved') return 'Reopen the case to message the player. The transcript is kept.'
        if (this.record.checked_out) return 'The petition is checked out in game. Check it back in to message the player.'
        return 'The in-game petition was cleared, so replies can no longer be matched to this case.'
      }
      const where = this.onAlt ? ` The account is playing ${this.recipient}, so tells go there.` : ''
      if (this.state === 'ready') {
        return this.active
          ? `Tells to GameMaster from any character on ${name}’s account are recorded here.${where}`
          : `Your first tell turns messages on. The player cannot write first until then.${where}`
      }
      if (this.state === 'offline') {
        return this.tellsOff
          ? `${this.recipient} has tells turned off. Messaging resumes when they turn tells back on.`
          : this.mailTo
            ? `No character on ${name}’s account is in game. Messages you send now are mailed to ${this.mailTo} and kept here.`
            : `No character on ${name}’s account is in a zone. Messaging resumes when the player logs in on any character.`
      }
      if (this.state === 'connecting') return 'Checking World for this character…'
      return 'Spire cannot reach a World server with the Player Support patch on this connection.'
    }
  },
  watch: {
    petitionAvailable () { this.load() }
  },
  mounted () {
    document.addEventListener('visibilitychange', this.onVisibility)
    this.load()
  },
  beforeDestroy () {
    this.stopped = true
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.cancelLoad()
  },
  methods: {
    isAlt (message) {
      const name = message.kind === 'chat_out' ? message.recipient : message.actor
      return Boolean(name) && name.toLowerCase() !== this.record.character.toLowerCase()
    },
    deliveryLabel (status) { return { pending: 'Sending', failed: 'Failed', unconfirmed: 'Unconfirmed', mail: 'Sent by mail' }[status] || status },
    deliveryIcon (status) { return { pending: 'fe fe-clock', mail: 'fe fe-mail' }[status] || 'fe fe-alert-triangle' },
    formatTime (value) { return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(value)) },
    errorText (error) { return (error.response && error.response.data && error.response.data.error) || 'Live chat request failed' },
    cancelLoad () {
      this.version++
      clearTimeout(this.timer)
      if (this.cancellation) this.cancellation.cancel()
    },
    onVisibility () {
      if (document.hidden) this.cancelLoad()
      else this.load()
    },
    async load (wait = false) {
      if (this.stopped || document.hidden) return
      this.cancelLoad()
      const version = this.version
      const cancellation = axios.CancelToken.source()
      this.cancellation = cancellation
      let delay = 8000
      try {
        const params = { connection_id: this.connectionId }
        if (wait && this.active) params.after = this.cursor
        const { data } = await SpireApi.v1().get(this.endpoint, { params, cancelToken: cancellation.token, timeout: 17000 })
        if (this.stopped || version !== this.version) return
        const transcript = this.$refs.transcript
        const following = !transcript || transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight < 70
        this.state = data.state
        this.active = data.active
        this.recipient = data.recipient || ''
        this.tellsOff = Boolean(data.tells_off)
        this.mailTo = data.mail_to || ''
        this.messages = data.messages || []
        this.cursor = data.cursor
        delay = this.active ? 350 : 8000
        if (following) this.$nextTick(() => {
          const area = this.$refs.transcript
          if (area) area.scrollTop = area.scrollHeight
        })
      } catch (error) {
        if (this.stopped || version !== this.version || axios.isCancel(error)) return
        this.state = 'unavailable'
      } finally {
        if (!this.stopped && version === this.version) {
          this.timer = setTimeout(() => this.load(true), delay)
        }
      }
    },
    async act (action) {
      if (!this.canWrite || this.busy) return
      if ((action === 'start' && this.state !== 'ready') || (action === 'send' && !this.composable)) return
      const text = this.draft.trim()
      if (action === 'send' && !text) return
      if (action === 'send' && /[^\x20-\x7E]/.test(text)) {
        this.error = 'Use printable ASCII characters.'
        return
      }
      this.busy = true
      this.error = ''
      if (action === 'send' && !this.requestId) {
        this.requestId = Array.from(window.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
      }
      try {
        await SpireApi.v1().put(this.endpoint, { action, text, request_id: this.requestId }, { params: { connection_id: this.connectionId } })
        if (action === 'send') {
          this.draft = ''
          this.requestId = ''
        }
      } catch (error) {
        this.error = this.errorText(error)
      } finally {
        this.busy = false
        await this.load()
        if (action !== 'end' && !this.stopped) this.$nextTick(() => {
          const input = this.$el.querySelector('#support-live-message')
          if (input) input.focus()
        })
      }
    }
  }
}
</script>

<style scoped>
.support-chat { flex: 1; display: flex; flex-direction: column; min-height: 440px; }
.chat-header, .chat-compose-row, .chat-compose-hint { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.chat-header { padding: 13px 23px; border-bottom: 1px solid var(--support-border); background: var(--support-pane); }
.chat-status { min-width: 0; }
.chat-header h3 { display: flex; align-items: center; gap: 8px; margin: 0; color: inherit; font-size: .86rem; font-weight: 650; }
.chat-header p { margin: 3px 0 0 15px; color: var(--support-muted); font-size: .76rem; line-height: 1.4; }
.chat-dot { flex: none; width: 7px; height: 7px; border-radius: 50%; border: 1px solid var(--support-muted); }
.chat-dot.is-on { border: 0; background: #8fd6ad; box-shadow: 0 0 0 3px rgba(143, 214, 173, .16); }
.chat-dot.is-ready { border-color: #8fd6ad; }
.chat-dot.is-away { border: 0; background: #f4ba83; }
.chat-button {
  display: inline-flex; flex: none; align-items: center; gap: 6px; border: 1px solid #46586c; border-radius: 7px;
  background: #1f2b39; color: var(--support-text); padding: 7px 12px; font-size: .8rem; font-weight: 650;
  transition: background-color 130ms ease, border-color 130ms ease;
}
.chat-button:hover:not(:disabled) { border-color: #8ea3ba; background: #2a3a4c; }
.chat-primary { color: #1f1910; background: var(--support-accent); border-color: var(--support-accent); }
.chat-primary:hover:not(:disabled) { background: #f0cd90; border-color: #f0cd90; }
.chat-button:disabled { opacity: .45; cursor: default; }
.chat-button:focus-visible, .chat-compose-row textarea:focus-visible { outline: 2px solid var(--support-accent); outline-offset: 2px; }
.chat-transcript { flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 260px; max-height: 480px; padding: 18px 23px; overflow: auto; }
.chat-empty { flex: 1; display: grid; place-content: center; justify-items: center; gap: 6px; max-width: 360px; margin: 0 auto; color: var(--support-muted); text-align: center; }
.chat-empty-mark { display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: 4px; border-radius: 50%; background: #1d2836; border: 1px solid #344558; font-size: 19px; color: #8fa2b7; }
.chat-empty strong { color: var(--support-text); font-size: .9rem; }
.chat-empty p { margin: 0; font-size: .8rem; line-height: 1.5; }
.chat-empty code { padding: 1px 5px; border-radius: 4px; background: #1d2836; color: var(--support-accent); font-size: .76rem; }
.chat-message { align-self: flex-start; max-width: 80%; min-width: 130px; }
.chat-message.is-outgoing { align-self: flex-end; }
.chat-message-meta { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; margin-bottom: 4px; font-size: .75rem; }
.chat-message-meta strong { display: inline-flex; align-items: baseline; gap: 6px; font-weight: 650; }
.chat-recipient { color: var(--support-muted); font-weight: 400; }
.chat-alt { padding: 0 6px; border-radius: 999px; background: #213650; color: #cfe2fb; font-size: .64rem; font-weight: 650; letter-spacing: .03em; text-transform: uppercase; }
.chat-message-meta time { color: var(--support-muted); font-size: .7rem; }
.chat-message p { margin: 0; padding: 8px 12px; border: 1px solid #344a63; border-radius: 2px 12px 12px; background: #1a2637; font-size: .87rem; line-height: 1.45; white-space: pre-wrap; overflow-wrap: anywhere; }
.chat-message.is-outgoing p { border-radius: 12px 2px 12px 12px; border-color: #5c4b32; background: #2c261d; }
.chat-message-status { display: flex; justify-content: flex-end; align-items: center; gap: 4px; margin-top: 3px; color: #f4ba83; font-size: .7rem; }
.chat-message-status.is-failed { color: #ffb2c0; }
.chat-message-status.is-mail { color: #9cc5f5; }
.chat-mail-note { display: flex; gap: 7px; align-items: flex-start; margin: 7px 0 0; color: #b9d3f0; font-size: .74rem; line-height: 1.45; }
.chat-mail-note i { margin-top: 2px; }
.chat-composer { padding: 11px 23px 14px; border-top: 1px solid var(--support-border); background: var(--support-pane); }
.chat-composer label { display: block; margin-bottom: 6px; color: var(--support-muted); font-size: .75rem; font-weight: 650; }
.chat-composer label span { font-weight: 400; color: #7f91a5; }
.chat-compose-row { align-items: flex-end; }
.chat-compose-row textarea { flex: 1; min-width: 0; padding: 8px 10px; border: 1px solid #46586c; border-radius: 8px; background: var(--support-bg); color: var(--support-text); resize: vertical; font-size: .86rem; }
.chat-compose-row textarea::placeholder { color: #75879b; }
.chat-compose-hint { margin-top: 6px; color: #7f91a5; font-size: .7rem; font-variant-numeric: tabular-nums; }
.chat-compose-hint .is-near { color: #f4ba83; }
.chat-compose-hint kbd { padding: 1px 5px; border-radius: 4px; border: 1px solid #46586c; background: #1f2a37; color: var(--support-muted); font-size: .66rem; box-shadow: none; }
.chat-error { display: flex; align-items: center; gap: 8px; margin: 10px 23px 0; padding: 8px 11px; border: 1px solid #9a5564; border-radius: 8px; background: #36222a; color: #ffd6df; font-size: .82rem; }
@media (max-width: 680px) {
  .chat-header, .chat-transcript, .chat-composer { padding-left: 14px; padding-right: 14px; }
  .chat-header { flex-wrap: wrap; }
  .chat-message { max-width: 92%; }
}
@media (prefers-reduced-motion: reduce) {
  .chat-button { transition: none; }
}
</style>
