<template>
  <b-modal v-model="open" title="Reply by mail" size="lg" centered scrollable modal-class="support-modal" :hide-header-close="sending"
           :no-close-on-backdrop="sending" :no-close-on-esc="sending" @shown="focusBody" @hidden="$emit('close')">
    <div class="delivery-form">
      <ol class="delivery-steps" aria-label="Reply progress">
        <li :class="{ 'is-current': !reviewing, 'is-done': reviewing }"><span>1</span> Write</li>
        <li :class="{ 'is-current': reviewing }"><span>2</span> Review &amp; send</li>
      </ol>
      <div class="delivery-recipient">
        <span class="delivery-mark"><i class="fe fe-mail" aria-hidden="true"></i></span>
        <div><span>To</span><strong>{{ record.character }}</strong></div>
        <div class="delivery-from"><span>From</span><strong>Server Support</strong></div>
        <span class="delivery-case">Case #{{ record.key.split('-')[0] }}</span>
      </div>
      <p v-if="error" class="delivery-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ error }}</p>
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
        <div class="delivery-templates" role="group" aria-label="Message templates">
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
    </div>
    <template #modal-footer>
      <b-button v-if="reviewing" variant="outline-light" :disabled="sending || verify" @click="reviewing = false">Back</b-button>
      <b-button v-else variant="outline-light" @click="open = false">Cancel</b-button>
      <b-button v-if="!reviewing" variant="primary" class="delivery-primary" :disabled="!valid" @click="review">Review reply</b-button>
      <b-button v-else variant="primary" class="delivery-primary" :disabled="!valid || sending || verify" @click="send">
        <i class="fe fe-send mr-1" aria-hidden="true"></i>{{ sending ? 'Sending…' : 'Send reply' }}
      </b-button>
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
.delivery-form { display: grid; gap: 6px; }
.delivery-form label { margin: 8px 0 0; font-size: .8rem; font-weight: 650; }
.delivery-steps { display: flex; gap: 18px; margin: 0 0 8px; padding: 0; list-style: none; color: #7f91a5; font-size: .76rem; font-weight: 650; }
.delivery-steps li { display: flex; align-items: center; gap: 7px; }
.delivery-steps span { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; border: 1px solid #46586c; font-size: .68rem; }
.delivery-steps .is-current { color: #f0f4f8; }
.delivery-steps .is-current span { color: #1f1910; background: #dfb976; border-color: #dfb976; }
.delivery-steps .is-done span { color: #8fd6ad; border-color: #3f7259; }
.delivery-recipient {
  display: flex; gap: 14px; align-items: center; padding: 10px 12px; margin-bottom: 4px;
  border: 1px solid #3a4859; border-radius: 10px; background: #1a2532; color: #f0f4f8;
}
.delivery-mark { display: grid; flex: none; place-items: center; width: 36px; height: 36px; border-radius: 8px; color: #dfb976; background: #352d20; }
.delivery-recipient > div { display: grid; line-height: 1.25; }
.delivery-from { padding-left: 14px; border-left: 1px solid #3a4859; }
.delivery-recipient div span, .delivery-case { font-size: .72rem; color: #a9b9ca; }
.delivery-case { margin-left: auto; padding: 2px 8px; border-radius: 999px; background: #243241; }
.delivery-label-row { display: flex; align-items: flex-end; justify-content: space-between; }
.delivery-templates { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 10px; }
.delivery-templates span { color: #8fa1b5; font-size: .74rem; margin-right: 2px; }
.delivery-templates button {
  display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px;
  border: 1px solid #3c4f63; background: #172230; color: #c9d6e3; font-size: .74rem;
  transition: border-color 120ms ease, color 120ms ease, background-color 120ms ease;
}
.delivery-templates button:hover { border-color: #dfb976; color: #f3dcae; background: #241f18; }
.delivery-count { color: #8fa1b5; font-size: .72rem; font-variant-numeric: tabular-nums; }
.delivery-message { display: grid; gap: 4px; padding: 14px; border: 1px solid #3a4859; border-radius: 10px; background: #0e151d; overflow-wrap: anywhere; }
.delivery-label { margin-top: 6px; color: #8fa1b5; font-size: .7rem; font-weight: 650; letter-spacing: .05em; text-transform: uppercase; }
.delivery-label:first-child { margin-top: 0; }
.delivery-message p { margin: 0; white-space: pre-wrap; line-height: 1.5; }
.delivery-message .delivery-note { display: flex; gap: 7px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #2a3948; color: #a9b9ca; font-size: .78rem; white-space: normal; }
.delivery-note i { margin-top: 3px; }
.delivery-error { display: flex; align-items: center; gap: 8px; padding: 8px 11px; margin: 0; border: 1px solid #9a5564; background: #36222a; color: #ffd6df; border-radius: 8px; font-size: .84rem; }
.delivery-primary { color: #1f1910; background: #dfb976; border-color: #dfb976; font-weight: 650; }
.delivery-primary:hover:not(:disabled), .delivery-primary:focus { color: #1f1910; background: #f0cd90; border-color: #f0cd90; }
@media (max-width: 560px) {
  .delivery-recipient { flex-wrap: wrap; }
  .delivery-case { margin-left: 0; }
}
</style>
