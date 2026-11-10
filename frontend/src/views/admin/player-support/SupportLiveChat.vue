<template>
  <section class="support-chat" aria-label="Live chat">
    <header class="chat-status support-callout" :class="statusTone">
      <i :class="statusIcon" aria-hidden="true"></i>
      <div class="chat-status-text">
        <h3>{{ status }}</h3>
        <p>{{ statusHint }}</p>
      </div>
      <!-- Player replies: whether the player's answers are accepted onto this case. Sending never depends on it. -->
      <div v-if="active || (canWrite && petitionAvailable)" class="chat-replies">
        <span class="support-chip" :class="active ? 'is-success' : null">Player replies: {{ active ? 'On' : 'Off' }}</span>
        <button v-if="active && canWrite" class="support-button is-sm" type="button" :disabled="busy" @click="act('end')">
          <i class="fe fe-toggle-left" aria-hidden="true"></i> Turn off replies
        </button>
        <button v-else-if="canWrite" class="support-button is-sm" type="button" :disabled="busy || !canTurnOnReplies" @click="act('start')">
          <i class="fe fe-toggle-right" aria-hidden="true"></i> Turn on replies
        </button>
      </div>
    </header>

    <p v-if="error" class="chat-error support-callout is-danger" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>
    <div ref="transcript" class="chat-transcript" role="log" aria-label="Chat messages" aria-relevant="additions">
      <div v-if="!messages.length" class="chat-empty support-empty">
        <i class="fe fe-message-circle" aria-hidden="true"></i>
        <strong>No messages yet</strong>
        <p v-if="canWrite && state === 'ready'">Send a tell to start the conversation. With player replies on, the player can answer from any character on the account with <code>#petition</code>, <code>/reply</code> or <code>/tell *GameMaster</code>.</p>
        <p v-else>Tells exchanged with any character on {{ record.character }}’s account appear here.</p>
      </div>
      <article v-for="message in messages" :key="message.id" class="chat-message" :class="{ 'is-outgoing': message.kind === 'chat_out' }">
        <span v-if="message.kind === 'chat_out'" class="chat-avatar support-avatar is-sm is-accent" aria-hidden="true"><i class="fe fe-shield"></i></span>
        <span v-else class="chat-avatar support-avatar is-sm" :style="avatar(message.actor || record.character)" aria-hidden="true">{{ initial(message.actor || record.character) }}</span>
        <div class="chat-bubble">
          <div class="chat-message-meta">
            <strong>
              <template v-if="message.kind === 'chat_out'">
                {{ message.actor || 'Game Master' }}
                <span v-if="message.recipient" class="chat-recipient">to {{ message.recipient }}</span>
              </template>
              <template v-else>{{ message.actor || record.character }}</template>
              <span v-if="isAlt(message)" class="support-chip is-tag" :title="'Not the character that filed the petition (' + record.character + ')'">alt</span>
            </strong>
            <time :datetime="message.created_at">{{ formatTime(message.created_at) }}</time>
          </div>
          <p>{{ message.text }}</p>
          <span v-if="message.delivery && message.delivery !== 'sent'" class="chat-message-status support-chip" :class="deliveryTone(message.delivery)">
            <i :class="deliveryIcon(message.delivery)" aria-hidden="true"></i> {{ deliveryLabel(message.delivery) }}
          </span>
        </div>
      </article>
    </div>

    <!-- Shown whenever a message can be sent, and kept (disabled) during a conversation while the player zones. -->
    <form v-if="canWrite && (composable || (petitionAvailable && messages.length > 0))" class="chat-composer" @submit.prevent="act('send')">
      <div v-if="composable" class="chat-quick support-suggestions" role="group" aria-label="Quick replies">
        <button v-for="reply in quickReplyList" :key="reply.key" type="button" :disabled="busy"
                :title="reply.saved ? reply.text : null" @click="useQuickReply(reply.text)">
          <i v-if="reply.saved" class="fe fe-bookmark" aria-hidden="true"></i> {{ reply.label }}
        </button>
      </div>
      <div class="chat-compose-head">
        <label for="support-live-message">{{ mailing ? 'Mail ' + mailTo : 'Tell ' + target }} <span>as GameMaster</span></label>
        <div class="chat-compose-hint">
          <span><kbd class="support-kbd">Enter</kbd> to send · plain text only</span>
          <span :class="{ 'is-near': draft.length > 180 }">{{ draft.length }}/200</span>
        </div>
      </div>
      <div class="chat-compose-row">
        <textarea id="support-live-message" ref="draft" v-model="draft" class="support-field" rows="2" maxlength="200" :disabled="busy || !composable"
                  :placeholder="composable ? 'Type a message…' : 'Waiting for ' + target + ' to be reachable…'"
                  @keydown.enter.exact.prevent="act('send')" @input="onDraftInput"></textarea>
        <button class="support-button is-primary" type="submit" :disabled="!draft.trim() || busy || !composable">
          <i :class="mailing ? 'fe fe-mail' : 'fe fe-send'" aria-hidden="true"></i> {{ mailing ? 'Send as mail' : 'Send' }}
        </button>
      </div>
      <p v-if="composable && !active && patched" class="chat-mail-note">
        <i class="fe fe-message-square" aria-hidden="true"></i>
        <span>Player replies are off. The player can read this but cannot answer on this case; if they try, the game tells them their message was not sent.</span>
      </p>
      <p v-if="marqueeCut" class="chat-mail-note">
        <i class="fe fe-monitor" aria-hidden="true"></i>
        <span>The on-screen marquee shows the first part; the tell has the full message.</span>
      </p>
      <p v-if="mailing" class="chat-mail-note">
        <i class="fe fe-mail" aria-hidden="true"></i>
        <span>No character on the account is in game, so this goes to {{ mailTo }}’s mailbox. It starts with “This message was sent to you in response to your petition while you were offline:”
          <template v-if="!patched"> Without the server patch, the player cannot reply in game.</template></span>
      </p>
    </form>

    <b-modal v-model="confirmOpen" modal-class="support-modal" title="Another GM is on this case" centered @hidden="focusDraft">
      <p class="support-modal-lead">{{ confirmText }}</p>
      <template #modal-footer="{ cancel }">
        <button type="button" class="support-button" @click="cancel()">Cancel</button>
        <button type="button" class="support-button is-primary" @click="sendAnyway">Send anyway</button>
      </template>
    </b-modal>
  </section>
</template>

<script>
import axios from 'axios'
import { avatarStyle, deliveryLabel, deliveryTone, fillReply, fitsTell, initials, otherResponder } from './support-ui'
import { SpireApi } from '@/app/api/spire-api'
import UserContext from '@/app/user/UserContext'

export default {
  name: 'SupportLiveChat',
  props: {
    record: { type: Object, required: true },
    // Shared saved replies; the ones that fit in a tell become quick replies.
    savedReplies: { type: Array, default: () => [] },
    connectionId: { type: Number, required: true },
    canWrite: { type: Boolean, default: false },
    // Other staff on this case ({ name, composing }), from presence.
    viewers: { type: Array, default: () => [] },
    // Patch features of the World behind this connection.
    features: { type: Object, default: () => ({}) }
  },
  data () {
    return {
      state: 'connecting',
      active: false,
      messages: [],
      cursor: 0,
      draft: '',
      requestId: '',
      recipient: '',
      tellsOff: false,
      mailTo: '',
      companion: '',
      quickReplies: [
        'Hi! I am looking into this now.',
        'Can you tell me more about what happened?',
        'Please log in on any character so I can help.',
        'This should be fixed now. Let me know if not.'
      ],
      busy: false,
      error: '',
      timer: null,
      cancellation: null,
      version: 0,
      stopped: false,
      me: '',
      confirmOpen: false,
      confirmText: '',
      confirmed: false
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
    // Sending depends only on reaching the player, never on Player replies.
    composable () { return this.state === 'ready' || this.mailing },
    // World answered without the Player Support patch, or with an older one.
    patched () { return this.companion !== 'missing' && this.companion !== 'outdated' },
    // World also shows a delivered tell as an on-screen marquee, "Game Master: "
    // plus the message, cut to 120 characters.
    marquee () { return this.state === 'ready' && Boolean(this.features && this.features.marquee) },
    marqueeCut () { return this.marquee && this.draft.trim().length > 120 - 'Game Master: '.length },
    // Replies arrive only through the current patch, which need not wait for
    // the player to be in game. An older patch never turns them on.
    canTurnOnReplies () {
      return this.petitionAvailable && this.companion === 'ready' && (this.state === 'ready' || this.state === 'offline')
    },
    quickReplyList () {
      const saved = this.savedReplies
        .map(reply => ({ key: 'saved-' + reply.id, label: reply.title, text: fillReply(reply.body, this.record), saved: true }))
        .filter(reply => fitsTell(reply.text))
      const builtIn = this.quickReplies.map(text => ({ key: text, label: text, text, saved: false }))
      return saved.length ? saved.concat(builtIn.slice(0, 2)) : builtIn
    },
    onAlt () { return Boolean(this.recipient) && this.recipient.toLowerCase() !== this.record.character.toLowerCase() },
    status () {
      if (this.state === 'ready') return 'Player in game'
      if (this.state === 'offline') return this.tellsOff ? 'Tells turned off' : 'Player not in game'
      if (this.state === 'connecting') return 'Connecting…'
      if (this.state === 'unsupported') return this.companion === 'outdated' ? 'Server patch out of date' : 'Needs the server patch'
      return 'Live chat unavailable'
    },
    // Colour only where it carries meaning: player replies are on, or World needs work.
    statusTone () {
      if (this.state === 'unsupported') return 'is-warning'
      return this.active ? 'is-success' : null
    },
    statusIcon () {
      if (this.state === 'ready') return 'fe fe-message-circle'
      if (this.state === 'offline') return this.tellsOff ? 'fe fe-bell-off' : this.mailTo ? 'fe fe-mail' : 'fe fe-moon'
      if (this.state === 'connecting') return 'fe fe-loader'
      if (this.state === 'unsupported') return 'fe fe-alert-triangle'
      return 'fe fe-slash'
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
        const reach = this.marquee ? 'Tells you send reach the player now and also show on their screen as a marquee.' : 'Tells you send reach the player now.'
        return this.active
          ? `${reach} Their replies to GameMaster from any character on ${name}’s account are recorded here.${where}`
          : `${reach} Turn on replies to record their answers here.${where}`
      }
      if (this.state === 'offline') {
        return this.tellsOff
          ? `${this.recipient} has tells turned off. You can send tells again when they turn tells back on.`
          : this.mailTo
            ? `No character on ${name}’s account is in game. Messages you send now are mailed to ${this.mailTo} and kept here.` +
              (this.patched ? '' : ' The player cannot reply in game until World has the Player Support patch.')
            : `No character on ${name}’s account is in a zone. You can send tells when the player logs in on any character.`
      }
      if (this.state === 'connecting') return 'Checking World for this character…'
      if (this.state === 'unsupported') {
        return this.companion === 'outdated'
          ? `${this.recipient} is in game, but World has an older Player Support patch. Rebuild World and zones with the current patch to send tells.`
          : `${this.recipient} is in game, but World does not have the Player Support patch, so Spire cannot send tells. Reply by mail instead.`
      }
      if (this.recipient && this.companion === 'ready') {
        return `${this.recipient} is in game, but World’s chat stream is unavailable. Another Spire may be connected to it. Try again shortly.`
      }
      return 'Spire cannot reach a World server with the Player Support patch on this connection.'
    }
  },
  watch: {
    petitionAvailable () { this.load() },
    // The page tells other staff while a reply is being written.
    draft (value, previous) {
      if (Boolean(value.trim()) !== Boolean(previous.trim())) this.$emit('composing', Boolean(value.trim()))
    }
  },
  created () {
    UserContext.getUser().then(user => { this.me = (user && user.user_name) || '' }).catch(() => {})
  },
  mounted () {
    document.addEventListener('visibilitychange', this.onVisibility)
    this.load()
  },
  beforeDestroy () {
    this.stopped = true
    if (this.draft.trim()) this.$emit('composing', false)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.cancelLoad()
  },
  methods: {
    avatar (name) { return avatarStyle(name) },
    initial (name) { return initials(name) },
    // The composer grows with the draft, up to about six lines.
    onDraftInput () {
      this.requestId = ''
      const area = this.$refs.draft
      if (!area) return
      area.style.height = 'auto'
      area.style.height = Math.min(area.scrollHeight + 2, 150) + 'px'
    },
    useQuickReply (reply) {
      const current = this.draft.trim()
      const next = current ? `${current} ${reply}` : reply
      this.draft = next.slice(0, 200)
      this.$nextTick(() => {
        this.onDraftInput()
        if (this.$refs.draft) this.$refs.draft.focus()
      })
    },
    isAlt (message) {
      const name = message.kind === 'chat_out' ? message.recipient : message.actor
      return Boolean(name) && name.toLowerCase() !== this.record.character.toLowerCase()
    },
    deliveryLabel (status) { return deliveryLabel(status) },
    deliveryTone (status) { return deliveryTone(status) },
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
        this.companion = data.companion || ''
        this.messages = data.messages || []
        const replies = this.messages.filter(message => message.kind === 'chat_in')
        if (replies.length) this.$emit('seen', replies[replies.length - 1].created_at)
        this.cursor = data.cursor
        delay = this.active ? 350 : 8000
        if (following) {
          this.$nextTick(() => {
            const area = this.$refs.transcript
            if (area) area.scrollTop = area.scrollHeight
          })
        }
      } catch (error) {
        if (this.stopped || version !== this.version || axios.isCancel(error)) return
        this.state = 'unavailable'
      } finally {
        if (!this.stopped && version === this.version) {
          this.timer = setTimeout(() => this.load(true), delay)
        }
      }
    },
    focusDraft () { if (this.$refs.draft) this.$refs.draft.focus() },
    sendAnyway () {
      this.confirmed = true
      this.confirmOpen = false
      this.act('send')
    },
    async act (action) {
      if (!this.canWrite || this.busy) return
      if ((action === 'start' && !this.canTurnOnReplies) || (action === 'send' && !this.composable)) return
      const text = this.draft.trim()
      if (action === 'send' && !text) return
      if (action === 'send' && /[^\x20-\x7E]/.test(text)) {
        this.error = 'Use printable ASCII characters.'
        return
      }
      // Ask first when another Game Master is writing or just wrote to the player.
      if (action === 'send' && !this.confirmed) {
        const other = otherResponder(this.viewers, this.messages.filter(message => message.kind === 'chat_out'), this.me)
        if (other) {
          const to = this.mailing ? this.mailTo : this.target
          this.confirmText = other.composing
            ? `${other.name} is also writing to ${to}.`
            : `${other.name} messaged ${to} ${other.minutes} ${other.minutes === 1 ? 'minute' : 'minutes'} ago.`
          this.confirmOpen = true
          return
        }
      }
      if (action === 'send') this.confirmed = false
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
          this.$nextTick(this.onDraftInput)
        }
      } catch (error) {
        this.error = this.errorText(error)
      } finally {
        this.busy = false
        await this.load()
        if (action !== 'end' && !this.stopped) {
          this.$nextTick(() => {
            const input = this.$el.querySelector('#support-live-message')
            if (input) input.focus()
          })
        }
      }
    }
  }
}
</script>

<style scoped>
/* Layout only. Colours, type, radius and spacing come from support-theme.css. */
.support-chat { flex: 1; display: flex; flex-direction: column; min-height: 440px; }

/* Status: a callout row flush with the pane, like the composer: state, reason, one action.
   The left edge takes a tone only when it means something (player replies on, World needs the patch). */
.chat-status {
  margin: 0; padding: 10px var(--support-space-5) 10px calc(var(--support-space-5) - 3px);
  border-top: 0; border-right: 0; border-bottom: 1px solid var(--support-border); border-radius: 0;
  background: var(--support-pane);
}
.chat-status:not(.is-success):not(.is-warning) { border-left-color: transparent; }
.chat-status-text { flex: 1; min-width: 0; }
.chat-status h3 { margin: 0; color: var(--support-text); font-family: inherit; font-size: var(--support-text-sm); font-weight: 600; line-height: 1.5; }
.chat-status p { color: var(--support-muted); }
.chat-status .support-button { flex: none; align-self: center; }
.chat-replies { display: flex; flex: none; flex-wrap: wrap; align-items: center; align-self: center; gap: var(--support-space-2); }
.chat-error { margin: var(--support-space-3) var(--support-space-5) 0; }

/* Transcript */
.chat-transcript {
  flex: 1; display: flex; flex-direction: column; gap: var(--support-space-4); min-height: 260px; max-height: 480px;
  padding: var(--support-space-4) var(--support-space-5); overflow: auto;
}
/* On tall screens the workspace has a fixed height, so the transcript fills it. */
@media (min-width: 1181px) and (min-height: 760px) {
  .support-chat { min-height: 0; }
  .chat-transcript { max-height: none; min-height: 0; }
}
.chat-empty { flex: 1; }
.chat-message { display: flex; align-items: flex-start; gap: var(--support-space-3); align-self: flex-start; max-width: min(82%, 760px); min-width: 160px; }
.chat-message.is-outgoing { align-self: flex-end; flex-direction: row-reverse; }
.chat-bubble { display: flex; flex: 1; flex-direction: column; align-items: flex-start; min-width: 0; padding-top: 4px; }
.is-outgoing .chat-bubble { align-items: flex-end; }
.chat-avatar > i { font-size: 13px; }
.chat-message-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px var(--support-space-2); margin-bottom: 6px; line-height: 1.4; }
.is-outgoing .chat-message-meta { flex-direction: row-reverse; }
.chat-message-meta strong { display: inline-flex; align-items: center; gap: 6px; color: var(--support-text); font-size: var(--support-text-sm); font-weight: 600; }
.chat-recipient { color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 400; }
.chat-message-meta time { color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.chat-message p {
  max-width: 100%; margin: 0; padding: var(--support-space-2) var(--support-space-3);
  border: 1px solid var(--support-border); border-radius: 0 var(--support-radius-lg) var(--support-radius-lg);
  background: var(--support-raised); color: var(--support-text);
  font-size: var(--support-text-md); line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere;
}
.chat-message.is-outgoing p {
  border-color: var(--support-accent-line); border-radius: var(--support-radius-lg) 0 var(--support-radius-lg) var(--support-radius-lg);
  background: var(--support-accent-soft);
}
.chat-message-status { margin-top: 6px; }

/* Composer */
.chat-composer { padding: var(--support-space-3) var(--support-space-5) var(--support-space-4); border-top: 1px solid var(--support-border); background: var(--support-pane); }
.chat-quick { margin-bottom: var(--support-space-3); }
.chat-compose-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 2px var(--support-space-3); margin-bottom: 6px; }
.chat-compose-head label { margin: 0; color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600; }
.chat-compose-head label span { color: var(--support-faint); font-weight: 400; }
.chat-compose-hint { display: flex; align-items: baseline; gap: var(--support-space-3); color: var(--support-faint); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.chat-compose-hint .is-near { color: var(--support-warning); }
.chat-compose-row { display: flex; align-items: flex-end; gap: var(--support-space-2); }
.chat-compose-row textarea { flex: 1; min-width: 0; max-height: 150px; resize: none; }
.chat-mail-note { display: flex; align-items: flex-start; gap: 6px; margin: var(--support-space-2) 0 0; color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.5; }
.chat-mail-note > i { flex: none; margin-top: 3px; color: var(--support-faint); }

@media (min-width: 1900px) {
  .chat-status { padding-right: var(--support-space-6); padding-left: calc(var(--support-space-6) - 3px); }
  .chat-error { margin-right: var(--support-space-6); margin-left: var(--support-space-6); }
  .chat-transcript, .chat-composer { padding-right: var(--support-space-6); padding-left: var(--support-space-6); }
}
@media (max-width: 680px) {
  .chat-status { flex-wrap: wrap; padding-right: var(--support-space-4); padding-left: calc(var(--support-space-4) - 3px); }
  .chat-status-text { flex-basis: calc(100% - 30px); }
  .chat-status .chat-replies { margin-left: 24px; }
  .chat-error { margin-right: var(--support-space-4); margin-left: var(--support-space-4); }
  .chat-transcript, .chat-composer { padding-right: var(--support-space-4); padding-left: var(--support-space-4); }
  .chat-message { max-width: 92%; }
}
</style>
