<template>
  <b-modal v-model="open" title="Reply by mail" size="lg" centered scrollable modal-class="support-modal" :hide-header-close="sending"
           :no-close-on-backdrop="sending" :no-close-on-esc="sending" @shown="focusBody" @hidden="$emit('close')">
    <ol class="delivery-steps" aria-label="Reply progress">
      <li :class="{ 'is-current': !reviewing, 'is-done': reviewing }"><span>1</span> Write</li>
      <li :class="{ 'is-current': reviewing }"><span>2</span> Review &amp; send</li>
    </ol>
    <div class="delivery-recipient">
      <span class="delivery-mark"><i class="fe fe-mail" aria-hidden="true"></i></span>
      <div><span>To</span><strong>{{ record.character }}</strong></div>
      <div class="delivery-from"><span>From</span><strong>Server Support</strong></div>
      <span class="support-chip delivery-case">Case #{{ record.key.split('-')[0] }}</span>
    </div>
    <p v-if="error" class="support-callout is-danger delivery-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> <span>{{ error }}</span></p>
    <div v-if="reviewing" class="delivery-message">
      <span class="delivery-label">Subject</span>
      <strong>{{ subject.trim() }}</strong>
      <span class="delivery-label">Message</span>
      <p>{{ body.trim() }}</p>
      <p class="delivery-note"><i class="fe fe-info" aria-hidden="true"></i> {{ record.character }} receives this in their in-game mailbox. It is recorded on the case timeline.</p>
    </div>
    <template v-else>
      <label for="support-mail-subject">Subject</label>
      <input id="support-mail-subject" v-model="subject" class="form-control" maxlength="200">
      <div class="support-suggestions delivery-templates" role="group" aria-label="Message templates">
        <span>Start from</span>
        <button v-for="(template, index) in templateList" :key="index" type="button" @click="useTemplate(template)">
          <i :class="template.icon" aria-hidden="true"></i> {{ template.label }}
        </button>
      </div>
      <div class="delivery-label-row">
        <label for="support-mail-body">Message</label>
        <span class="delivery-count">{{ body.length.toLocaleString() }} characters</span>
      </div>
      <textarea id="support-mail-body" ref="body" v-model="body" class="form-control" rows="7" maxlength="65535"
                :placeholder="'Hi ' + record.character + ', thanks for your petition…'"></textarea>
    </template>
    <template #modal-footer>
      <button v-if="reviewing" type="button" class="support-button" :disabled="sending || verify" @click="reviewing = false">Back</button>
      <button v-else type="button" class="support-button" @click="open = false">Cancel</button>
      <button v-if="!reviewing" type="button" class="support-button is-primary" :disabled="!valid" @click="review">Review reply</button>
      <button v-else type="button" class="support-button is-primary" :disabled="!valid || sending || verify" @click="send">
        <i class="fe fe-send" aria-hidden="true"></i>{{ sending ? 'Sending…' : 'Send reply' }}
      </button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { fillReply } from './support-ui'

export default {
  name: 'SupportMailReply',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    savedReplies: { type: Array, default: () => [] }
  },
  data () {
    return {
      open: true, reviewing: false, sending: false, error: '', verify: false,
      subject: 'Your support case #' + this.record.key.split('-')[0], body: '',
      requestId: Array.from(window.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
    }
  },
  computed: {
    valid () { return Boolean(this.subject.trim() && this.body.trim()) },
    templates () {
      const name = this.record.character
      return [
        { label: 'Item restored', icon: 'fe fe-package', body: `Hi ${name},

We restored the item you reported. You can collect it from any parcel merchant.

Thanks for your patience!` },
        { label: 'Need details', icon: 'fe fe-help-circle', body: `Hi ${name},

Thanks for your petition. Could you tell us a little more about what happened, including roughly when and where?

You can reply with #petition in game.` },
        { label: 'Resolved', icon: 'fe fe-check-circle', body: `Hi ${name},

Your issue has been resolved. If anything still looks wrong, use #petition in game and we will take another look.` }
      ]
    },
    // Shared saved replies come first; the built-in templates stay available.
    templateList () {
      const saved = this.savedReplies.map(reply => ({
        label: reply.title, icon: 'fe fe-bookmark', body: fillReply(reply.body, this.record)
      }))
      return saved.concat(this.templates)
    }
  },
  methods: {
    useTemplate (template) {
      this.body = this.body.trim() ? `${this.body.trimEnd()}

${template.body}` : template.body
      this.$nextTick(this.focusBody)
    },
    focusBody () {
      if (this.$refs.body) this.$refs.body.focus()
    },
    review () {
      if (!this.valid) return
      this.error = ''
      this.reviewing = true
    },
    async send () {
      if (!this.valid || this.sending || this.verify) return
      this.sending = true
      this.error = ''
      try {
        await SpireApi.v1().put('player-support/cases/' + encodeURIComponent(this.record.key) + '/reply', {
          subject: this.subject.trim(), body: this.body.trim(), request_id: this.requestId, confirmation: 'SEND TO 1 CHARACTER'
        }, { params: { connection_id: this.connectionId } })
        this.$emit('sent')
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
  display: flex; align-items: center; gap: var(--support-space-3); padding: 10px var(--support-space-3);
  border: 1px solid var(--support-border); border-radius: var(--support-radius-lg); background: var(--support-pane);
}
.delivery-mark { display: grid; flex: none; place-items: center; width: 32px; height: 32px; border-radius: var(--support-radius); background: var(--support-raised); color: var(--support-muted); font-size: 15px; }
.delivery-recipient > div { display: grid; line-height: 1.3; }
.delivery-recipient div span { color: var(--support-muted); font-size: var(--support-text-xs); }
.delivery-recipient strong { color: var(--support-text); font-size: var(--support-text-md); font-weight: 600; }
.delivery-from { padding-left: var(--support-space-3); border-left: 1px solid var(--support-border); }
.delivery-case { margin-left: auto; }
.delivery-error { margin: var(--support-space-3) 0 0; }

.delivery-templates { align-items: center; margin-top: var(--support-space-2); }
.delivery-templates > span { margin-right: 2px; color: var(--support-muted); font-size: var(--support-text-xs); }
.delivery-label-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--support-space-2); margin: var(--support-space-3) 0 6px; }
.delivery-label-row label { margin: 0; }
.delivery-count { color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }

.delivery-message {
  display: grid; gap: var(--support-space-1); margin-top: var(--support-space-3); padding: var(--support-space-4);
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

@media (max-width: 560px) {
  .delivery-recipient { flex-wrap: wrap; }
  .delivery-case { margin-left: 0; }
}
</style>
