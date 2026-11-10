<template>
  <b-modal v-model="open" title="Reply by mail" size="lg" centered scrollable modal-class="support-modal" :hide-header-close="sending"
           :no-close-on-backdrop="sending" :no-close-on-esc="sending" @shown="focusFirst" @hidden="$emit('close')">
    <div class="delivery-body">
      <ol class="delivery-steps" aria-label="Reply progress">
        <li :class="{ 'is-current': !reviewing, 'is-done': reviewing }" :aria-current="reviewing ? null : 'step'"><span>1</span> Write</li>
        <li :class="{ 'is-current': reviewing }" :aria-current="reviewing ? 'step' : null"><span>2</span> Review &amp; send</li>
      </ol>
      <div class="delivery-recipient">
        <span class="delivery-mark"><i class="fe fe-mail" aria-hidden="true"></i></span>
        <div><span>To</span><strong>{{ record.character }}</strong></div>
        <div class="delivery-from"><span>From</span><strong>Game Master</strong></div>
        <span class="support-chip delivery-case">Case #{{ record.key.split('-')[0] }}</span>
      </div>
      <p v-if="error" class="support-callout is-danger delivery-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> <span>{{ error }}</span></p>
      <div v-if="reviewing" class="delivery-message">
        <span class="delivery-label">Subject</span>
        <strong>{{ subject.trim() }}</strong>
        <span class="delivery-label">Message</span>
        <p>{{ body.trim() }}</p>
        <p class="delivery-note"><i class="fe fe-info" aria-hidden="true"></i> {{ record.character }} receives this in their in-game mailbox. It is recorded on the case timeline.<template v-if="features.mail_replies"> {{ mailRepliesHint }}</template></p>
      </div>
      <template v-else>
        <p v-if="restored" class="support-callout delivery-restored" role="status">
          <i class="fe fe-rotate-ccw" aria-hidden="true"></i>
          <span>Your unsent draft for this case is back.</span>
          <button type="button" class="support-link" @click="discardDraft">Discard draft</button>
        </p>
        <label for="support-mail-subject">Subject</label>
        <input id="support-mail-subject" ref="subject" v-model="subject" class="form-control" maxlength="200"
               :aria-invalid="subjectError ? 'true' : null" :aria-describedby="subjectError ? 'support-mail-subject-error' : null">
        <p v-if="subjectError" id="support-mail-subject-error" class="support-feedback is-error"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ subjectError }}</p>
        <div class="support-suggestions delivery-templates" role="group" aria-label="Message templates">
          <span>Start from</span>
          <button v-for="template in templateList" :key="template.key" type="button" :title="template.saved ? 'Saved reply' : 'Built-in template'" @click="useTemplate(template)">
            <i :class="template.icon" aria-hidden="true"></i> {{ template.label }}
          </button>
        </div>
        <div class="delivery-label-row">
          <label for="support-mail-body">Message</label>
          <span class="delivery-count">{{ body.length.toLocaleString() }} characters</span>
        </div>
        <textarea id="support-mail-body" ref="body" v-model="body" class="form-control" rows="7" maxlength="65535"
                  :aria-invalid="bodyError ? 'true' : null" :aria-describedby="bodyError ? 'support-mail-body-error' : null"
                  :placeholder="'Hi ' + record.character + ', thanks for your petition…'"></textarea>
        <p v-if="bodyError" id="support-mail-body-error" class="support-feedback is-error"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ bodyError }}</p>
      </template>
    </div>
    <template #modal-footer>
      <span class="support-footer-note delivery-keys support-keys-hint">
        <kbd class="support-kbd">Ctrl</kbd>+<kbd class="support-kbd">Enter</kbd> {{ reviewing ? 'to send' : 'to review' }}
      </span>
      <button v-if="reviewing" type="button" class="support-button" :disabled="sending || verify" @click="back">Back</button>
      <button v-else type="button" class="support-button" @click="open = false">Cancel</button>
      <button v-if="!reviewing" type="button" class="support-button is-primary" @click="review">Review reply</button>
      <button v-else ref="send" type="button" class="support-button is-primary" :disabled="!valid || sending || verify" @click="send">
        <i :class="sending ? 'fe fe-loader support-spin' : 'fe fe-send'" aria-hidden="true"></i>{{ sending ? 'Sending…' : 'Send reply' }}
      </button>
    </template>
    <b-modal v-model="confirmOpen" modal-class="support-modal" title="Another GM is on this case" centered scrollable>
      <p class="support-modal-lead">{{ confirmText }}</p>
      <template #modal-footer="{ cancel }">
        <button type="button" class="support-button" @click="cancel()">Cancel</button>
        <button type="button" class="support-button is-primary" @click="sendAnyway">Send anyway</button>
      </template>
    </b-modal>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { fillReply, focusLater, mailRepliesHint, otherResponder, readDraft, saveDraft, touchLayout } from './support-ui'
import UserContext from '@/app/user/UserContext'

export default {
  name: 'SupportMailReply',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    savedReplies: { type: Array, default: () => [] },
    // Other staff on this case ({ name, composing }), and the case activity,
    // to warn before writing over another Game Master's reply.
    viewers: { type: Array, default: () => [] },
    activity: { type: Array, default: () => [] },
    // Patch features of the World behind this connection.
    features: { type: Object, default: () => ({}) },
    // Text to start with, such as a Live chat message that could not go as a tell.
    initialBody: { type: String, default: '' }
  },
  data () {
    const defaultSubject = 'Your support case #' + this.record.key.split('-')[0]
    // An unsent draft for this case comes back; text handed over from Live chat goes after it.
    const saved = readDraft('mail', this.record.key) || {}
    const savedBody = (saved.body || '').trim()
    const handed = (this.initialBody || '').trim()
    return {
      mailRepliesHint,
      open: true,
      reviewing: false,
      sending: false,
      error: '',
      verify: false,
      me: '',
      confirmOpen: false,
      confirmText: '',
      // Field errors show once Review was tried.
      attempted: false,
      defaultSubject,
      restored: Boolean(savedBody),
      subject: saved.subject || defaultSubject,
      body: savedBody && handed ? `${savedBody}\n\n${handed}` : savedBody || handed,
      requestId: Array.from(window.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
    }
  },
  computed: {
    valid () { return Boolean(this.subject.trim() && this.body.trim()) },
    subjectError () { return this.attempted && !this.subject.trim() ? 'Add a subject. The player sees it in their mail list.' : '' },
    bodyError () { return this.attempted && !this.body.trim() ? 'Write a message, or start from a template.' : '' },
    templates () {
      const name = this.record.character
      return [
        {
          label: 'Item restored', icon: 'fe fe-package', body: `Hi ${name},

We restored the item you reported. You can collect it from any parcel merchant.

Thanks for your patience!`
        },
        {
          label: 'Need details', icon: 'fe fe-help-circle', body: `Hi ${name},

Thanks for your petition. Could you tell us a little more about what happened, including roughly when and where?

You can reply with #petition in game.`
        },
        {
          label: 'Resolved', icon: 'fe fe-check-circle', body: `Hi ${name},

Your issue has been resolved. If anything still looks wrong, use #petition in game and we will take another look.`
        }
      ]
    },
    // Shared saved replies come first; a built-in template with the same name as one is left out.
    templateList () {
      const saved = this.savedReplies.map(reply => ({
        key: 'saved-' + reply.id, label: reply.title, icon: 'fe fe-bookmark', body: fillReply(reply.body, this.record), saved: true
      }))
      const taken = new Set(saved.map(reply => reply.label.trim().toLowerCase()))
      const builtIn = this.templates
        .filter(template => !taken.has(template.label.toLowerCase()))
        .map(template => ({ ...template, key: 'built-in-' + template.label, saved: false }))
      return saved.concat(builtIn)
    }
  },
  watch: {
    // The page tells other staff while a reply is being written; the draft is kept per case.
    body (value, previous) {
      if (Boolean(value.trim()) !== Boolean(previous.trim())) this.$emit('composing', Boolean(value.trim()))
      this.keepDraft()
    },
    subject () { this.keepDraft() }
  },
  created () {
    UserContext.getUser().then(user => { this.me = (user && user.user_name) || '' }).catch(() => {})
  },
  mounted () {
    if (this.body.trim()) this.$emit('composing', true)
    // Ctrl+Enter reviews, then sends, from anywhere in the dialog (the footer is outside its body).
    document.addEventListener('keydown', this.onKeydown)
  },
  beforeDestroy () {
    document.removeEventListener('keydown', this.onKeydown)
    if (this.body.trim()) this.$emit('composing', false)
  },
  methods: {
    keepDraft () {
      saveDraft('mail', this.record.key, {
        subject: this.subject.trim() === this.defaultSubject ? '' : this.subject,
        body: this.body
      })
    },
    discardDraft () {
      this.restored = false
      this.subject = this.defaultSubject
      this.body = (this.initialBody || '').trim()
      focusLater(() => this.$refs.body)
    },
    useTemplate (template) {
      this.body = this.body.trim()
        ? `${this.body.trimEnd()}

${template.body}`
        : template.body
      focusLater(() => this.$refs.body)
    },
    focusBody () {
      if (this.$refs.body) this.$refs.body.focus()
    },
    // The message box first; the subject when it is the one still missing.
    focusFirst () {
      if (touchLayout()) return
      if (this.body.trim() && !this.subject.trim() && this.$refs.subject) this.$refs.subject.focus()
      else this.focusBody()
    },
    onKeydown (event) {
      if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return
      if (!this.open || this.confirmOpen) return
      // Only from inside a dialog: the page's staff note has its own Ctrl+Enter.
      if (event.target && event.target.closest && !event.target.closest('.modal')) return
      event.preventDefault()
      this.advance()
    },
    advance () {
      if (this.reviewing) this.send()
      else this.review()
    },
    review () {
      if (!this.valid) {
        this.attempted = true
        focusLater(() => !this.subject.trim() ? this.$refs.subject : this.$refs.body)
        return
      }
      this.error = ''
      this.reviewing = true
      focusLater(() => this.$refs.send)
    },
    back () {
      this.reviewing = false
      focusLater(() => this.$refs.body)
    },
    sendAnyway () {
      this.confirmOpen = false
      this.send(true)
    },
    async send (confirmed = false) {
      if (!this.valid || this.sending || this.verify) return
      // Ask first when another Game Master is writing or just wrote to the player.
      const sent = this.activity.filter(entry => ['chat_out', 'reply', 'parcel'].includes(entry.kind))
      const other = confirmed === true ? null : otherResponder(this.viewers, sent, this.me)
      if (other) {
        const to = this.record.character
        this.confirmText = other.composing
          ? `${other.name} is also writing to ${to}.`
          : `${other.name} messaged ${to} ${other.minutes} ${other.minutes === 1 ? 'minute' : 'minutes'} ago.`
        this.confirmOpen = true
        return
      }
      this.sending = true
      this.error = ''
      const subject = this.subject.trim()
      try {
        await SpireApi.v1().put('player-support/cases/' + encodeURIComponent(this.record.key) + '/reply', {
          subject, body: this.body.trim(), request_id: this.requestId, confirmation: 'SEND TO 1 CHARACTER'
        }, { params: { connection_id: this.connectionId } })
        saveDraft('mail', this.record.key, null)
        this.$emit('sent', { subject })
      } catch (error) {
        this.error = (error.response && error.response.data && error.response.data.error) || 'Delivery outcome unavailable. Retry from this dialog to check the same request.'
        this.verify = /needs verification|already recorded/.test(this.error)
        this.$emit('reconcile')
      } finally {
        this.sending = false
      }
    }
  }
}
</script>

<style scoped>
/* Dialog chrome, fields, buttons and chips come from support-theme.css (modal-class="support-modal"). */
.delivery-steps { display: flex; gap: var(--support-space-4); margin: 0 0 var(--support-space-3); padding: 0; list-style: none; color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600; }
.delivery-steps li { display: flex; align-items: center; gap: 6px; }
.delivery-steps span {
  display: grid; place-items: center; width: 20px; height: 20px;
  border: 1px solid var(--support-border-strong); border-radius: 50%;
  color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; line-height: 1;
}
.delivery-steps .is-current { color: var(--support-text); }
.delivery-steps .is-current span { border-color: var(--support-accent-line); color: var(--support-accent-text); }
.delivery-steps .is-done span { color: var(--support-text-secondary); }

.delivery-recipient {
  display: flex; align-items: center; gap: var(--support-space-3); padding: 10px var(--support-space-3); margin-bottom: var(--support-space-3);
  border: 1px solid var(--support-border); border-radius: var(--support-radius-lg); background: var(--support-pane);
}
.delivery-mark { display: grid; flex: none; place-items: center; width: 32px; height: 32px; border-radius: var(--support-radius); background: var(--support-raised); color: var(--support-muted); font-size: 15px; }
.delivery-recipient > div { display: grid; line-height: 1.3; }
.delivery-recipient div span { color: var(--support-muted); font-size: var(--support-text-xs); }
.delivery-recipient strong { color: var(--support-text); font-size: var(--support-text-md); font-weight: 600; }
.delivery-from { padding-left: var(--support-space-3); border-left: 1px solid var(--support-border); }
.delivery-case { margin-left: auto; }
.delivery-error { margin: 0 0 var(--support-space-3); }
.delivery-restored { margin: 0 0 var(--support-space-3); }
.delivery-restored > span { flex: 1; }

.delivery-templates { align-items: center; margin-top: var(--support-space-2); }
.delivery-templates > span { margin-right: 2px; color: var(--support-muted); font-size: var(--support-text-xs); }
.delivery-label-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--support-space-2); margin: var(--support-space-3) 0 6px; }
.delivery-label-row label { margin: 0; }
.delivery-count { color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.delivery-body .support-feedback { margin-top: 6px; font-size: var(--support-text-xs); }

.delivery-message {
  display: grid; gap: var(--support-space-1); padding: var(--support-space-4);
  border: 1px solid var(--support-border); border-radius: var(--support-radius-lg); background: var(--support-sunken); overflow-wrap: anywhere;
}
.delivery-message > strong { color: var(--support-text); font-size: var(--support-text-md); font-weight: 600; }
.delivery-label { margin-top: var(--support-space-3); color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
.delivery-label:first-child { margin-top: 0; }
.delivery-message p { margin: 0; color: var(--support-text-secondary); font-size: var(--support-text-md); line-height: 1.55; white-space: pre-wrap; }
.delivery-message .delivery-note {
  display: flex; gap: var(--support-space-2); margin-top: var(--support-space-3); padding-top: var(--support-space-3);
  border-top: 1px solid var(--support-border-subtle); color: var(--support-muted); font-size: var(--support-text-sm); white-space: normal;
}
.delivery-note i { margin-top: 3px; }
.delivery-keys { display: inline-flex; align-items: center; gap: 3px; }

@media (max-width: 560px) {
  .delivery-recipient { flex-wrap: wrap; }
  .delivery-case { margin-left: 0; }
  .delivery-keys { display: none; }
}
</style>
