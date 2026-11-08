<template>
  <div>
    <b-modal ref="modal" modal-class="mail-parcels-editor-modal gm-parcel-modal" dialog-class="gm-parcel-dialog"
             :title="caseKey ? 'Send parcel' : 'GM Send Parcels'" centered scrollable
             :hide-header-close="sending" :no-close-on-esc="sending"
             :no-close-on-backdrop="sending" @hidden="$emit('close')">
      <b-alert v-if="error" show variant="danger" role="alert">{{ error }}</b-alert>

      <template v-if="step === 'compose'">
        <slot name="recipient">
          <div class="gm-parcel-recipient">
            <i class="ra ra-player" aria-hidden="true"></i>
            <span>To <strong>{{ recipient.name }}</strong></span>
            <span v-if="caseKey" class="gm-parcel-case">From Server Support · Case #{{ caseKey.split('-')[0] }}</span>
          </div>
        </slot>

        <section class="gm-parcel-lines" aria-labelledby="gm-parcel-items">
          <div class="gm-parcel-lines__heading">
            <h3 id="gm-parcel-items">Parcels</h3>
            <b-button size="sm" variant="outline-warning" :disabled="lines.length >= 20" @click="addLine(true)">
              <i class="fa fa-plus mr-1" aria-hidden="true"></i>Add parcel
            </b-button>
          </div>
          <article v-for="(line, index) in lines" :key="line.key" class="gm-parcel-line">
            <div class="gm-parcel-line__top">
              <button ref="itemButtons" class="gm-parcel-item" type="button" @click="chooseItem(line)">
                <span class="gm-parcel-icon" aria-hidden="true">
                  <span v-if="line.item && line.item.icon" :class="'item-' + line.item.icon"></span>
                  <i v-else class="ra ra-wooden-box" aria-hidden="true"></i>
                </span>
                <strong>{{ line.item ? line.item.name : 'Choose an item' }}</strong>
                <i class="fa fa-search" aria-hidden="true"></i>
              </button>
              <div v-if="line.item && Number(line.item.stackable)" class="gm-parcel-quantity">
                <label :for="'gm-parcel-quantity-' + line.key">Quantity</label>
                <input :id="'gm-parcel-quantity-' + line.key" v-model.number="line.quantity" class="form-control form-control-sm"
                       type="number" min="1" :max="maxQuantity(line.item)">
              </div>
              <button v-if="lines.length > 1" class="gm-parcel-line__remove" type="button"
                      :aria-label="'Remove parcel ' + (index + 1)" @click="removeLine(index)">
                <i class="fa fa-trash" aria-hidden="true"></i>
              </button>
            </div>
            <div v-if="sockets(line.item).length" class="gm-parcel-augments" role="group" aria-label="Augment sockets">
              <button v-for="socket in sockets(line.item)" :key="socket.index" type="button" @click="chooseItem(line, socket)">
                <span class="gm-parcel-socket-number" aria-hidden="true">{{ socket.index + 1 }}</span>
                <strong>{{ line.augments[socket.index] ? line.augments[socket.index].name : 'Empty socket' }}</strong>
                <small>Type {{ socket.type }}</small>
                <i class="fa fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          </article>
        </section>

        <div class="gm-parcel-fields">
          <div>
            <label for="gm-parcel-reason">Reason for delivery</label>
            <textarea id="gm-parcel-reason" ref="reason" v-model="reason" class="form-control" rows="2"
                      required maxlength="240" :aria-invalid="reasonError ? 'true' : null"
                      :aria-describedby="reasonError ? 'gm-parcel-reason-error' : null"></textarea>
            <p v-if="reasonError" id="gm-parcel-reason-error" class="gm-parcel-field-error" role="alert">{{ reasonError }}</p>
          </div>
          <div>
            <label for="gm-parcel-note">Parcel note</label>
            <textarea id="gm-parcel-note" v-model="note" class="form-control" rows="2" maxlength="1024"></textarea>
          </div>
          <template v-if="!caseKey">
            <div>
              <label for="gm-parcel-from">Sender name</label>
              <input id="gm-parcel-from" v-model="fromName" class="form-control" maxlength="64">
            </div>
            <div>
              <label for="gm-parcel-sent-at">Sent at</label>
              <input id="gm-parcel-sent-at" v-model="sentAt" class="form-control" type="datetime-local" step="1">
            </div>
          </template>
        </div>
      </template>

      <template v-else-if="step === 'review'">
        <div class="gm-parcel-recipient">
          <i class="ra ra-player" aria-hidden="true"></i>
          <strong>{{ lines.length }} {{ lines.length === 1 ? 'parcel' : 'parcels' }} for {{ recipient.name }}</strong>
        </div>
        <div class="gm-parcel-review-list">
          <article v-for="line in lines" :key="line.key">
            <span class="gm-parcel-icon" aria-hidden="true">
              <span v-if="line.item.icon" :class="'item-' + line.item.icon"></span>
              <i v-else class="ra ra-wooden-box" aria-hidden="true"></i>
            </span>
            <span>
              <strong>{{ line.item.name }}</strong>
              <small v-if="line.augments.some(Boolean)">{{ line.augments.filter(Boolean).map(item => item.name).join(', ') }}</small>
            </span>
            <span class="gm-parcel-review-quantity">×{{ line.quantity }}</span>
          </article>
        </div>
        <dl class="gm-parcel-review-details">
          <div><dt>Reason for delivery</dt><dd>{{ reason.trim() }}</dd></div>
          <div v-if="note.trim()"><dt>Parcel note</dt><dd>{{ note.trim() }}</dd></div>
        </dl>
      </template>

      <div v-else class="gm-parcel-result" role="status">
        <div class="gm-parcel-result__heading">
          <i class="fa fa-check" aria-hidden="true"></i>
          <h3>{{ result.parcel_count }} separate parcel{{ result.parcel_count === 1 ? '' : 's' }} queued for {{ result.character_name }}</h3>
        </div>
        <ul class="gm-parcel-result-list">
          <li v-for="delivery in result.deliveries" :key="delivery.parcel.id">
            <strong>{{ delivery.parcel.item_name }}</strong>
            <span>Parcel #{{ delivery.parcel.id }} · slot {{ delivery.parcel.slot_id }} · player event #{{ delivery.player_event_log_id }}</span>
          </li>
        </ul>
        <p class="gm-parcel-receipt">Audit event #{{ result.audit_id }}</p>
      </div>

      <template #modal-footer>
        <label v-if="step === 'review'" class="gm-parcel-confirmation">
          <input ref="confirmation" v-model="confirmation" type="checkbox"
                 :true-value="expectedConfirmation" false-value="" :disabled="sending || verify">
          Confirm delivery
        </label>
        <div class="gm-parcel-actions">
          <template v-if="step === 'compose'">
            <b-button variant="outline-secondary" @click="$refs.modal.hide()">Cancel</b-button>
            <b-button ref="review" variant="warning" :disabled="!hasParcelDetails" @click="review">
              Review {{ lines.length }} parcel{{ lines.length === 1 ? '' : 's' }}
            </b-button>
          </template>
          <template v-else-if="step === 'review'">
            <b-button variant="outline-secondary" :disabled="sending || verify" @click="editDraft">Back</b-button>
            <b-button variant="warning" :disabled="!canSend" @click="send">
              {{ sending ? 'Sending…' : 'Send parcels' }}
            </b-button>
          </template>
          <b-button v-else ref="done" variant="warning" @click="$refs.modal.hide()">Done</b-button>
        </div>
      </template>
    </b-modal>
    <mail-parcels-item-lookup ref="lookup" @selected="setItem" />
  </div>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import MailParcelsItemLookup from './MailParcelsItemLookup.vue'
import { localDateTimeValue, sqlDateTime } from './delivery-date'

function emptyLine (key) {
  return { key, item: null, quantity: 1, augments: Array(6).fill(null) }
}

const minimumReasonLength = 8

export default {
  name: 'GMParcelComposer',
  components: { MailParcelsItemLookup },
  props: {
    recipient: { type: Object, default: null },
    caseKey: { type: String, default: '' },
    connectionId: { type: Number, default: 0 }
  },
  data () {
    return {
      step: 'compose', lines: [], lineSequence: 0, fromName: '', sentAt: '', note: '', reason: '', confirmation: '',
      sending: false, verify: false, error: '', result: null, lookupTarget: null, requestId: '', reviewAttempted: false
    }
  },
  computed: {
    expectedConfirmation () {
      if (!this.recipient) return ''
      const count = this.lines.length
      return `SEND ${count} ${count === 1 ? 'PARCEL' : 'PARCELS'} TO ${this.recipient.name}`
    },
    hasParcelDetails () {
      return Boolean(this.recipient && (this.caseKey || (this.fromName.trim() && sqlDateTime(this.sentAt))) &&
        this.lines.length && this.lines.every(line => {
          const max = this.maxQuantity(line.item)
          return line.item && Number.isInteger(line.quantity) && line.quantity > 0 && (max == null || line.quantity <= max)
        }))
    },
    hasValidReason () { return this.reason.trim().length >= minimumReasonLength },
    reasonError () {
      if (!this.reviewAttempted || this.hasValidReason) return ''
      return this.reason.trim() ? `Use at least ${minimumReasonLength} characters.` : 'Enter a reason for delivery.'
    },
    canSend () {
      return this.hasParcelDetails && this.hasValidReason && !this.sending && !this.verify &&
        this.confirmation === this.expectedConfirmation
    }
  },
  mounted () {
    if (this.caseKey) this.open()
  },
  methods: {
    open () {
      this.step = 'compose'
      this.lines = []
      this.addLine()
      this.fromName = 'Server Staff'
      this.sentAt = localDateTimeValue(new Date())
      this.note = ''
      this.reason = ''
      this.confirmation = ''
      this.reviewAttempted = false
      this.sending = false
      this.verify = false
      this.error = ''
      this.result = null
      this.lookupTarget = null
      if (this.caseKey) {
        this.requestId = Array.from(window.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
      }
      this.$refs.modal.show()
    },
    addLine (focus = false) {
      if (this.lines.length >= 20) return
      this.lines.push(emptyLine(`parcel-${++this.lineSequence}`))
      if (focus) this.focusItem(this.lines.length - 1)
    },
    removeLine (index) {
      this.lines.splice(index, 1)
      this.focusItem(Math.min(index, this.lines.length - 1))
    },
    focusItem (index) {
      this.$nextTick(() => this.$refs.itemButtons?.[index]?.focus())
    },
    maxQuantity (item) {
      if (!item || !Number(item.stackable)) return 1
      return Number(item.stack_size) > 0 ? Number(item.stack_size) : null
    },
    sockets (item) {
      if (!item) return []
      return Array.from({ length: 6 }, (_, index) => ({
        index, type: Number(item[`augment_slot_${index + 1}_type`] || 0)
      })).filter(socket => socket.type > 0)
    },
    chooseItem (line, socket = null) {
      this.lookupTarget = { line, socket }
      this.$refs.lookup.open(Boolean(socket), socket ? socket.type : 0)
    },
    setItem (item) {
      const { line, socket } = this.lookupTarget
      if (socket) {
        this.$set(line.augments, socket.index, item)
        return
      }
      line.item = item
      line.augments = Array(6).fill(null)
      line.quantity = Math.max(1, Math.min(line.quantity || 1, this.maxQuantity(item) || Infinity))
    },
    review () {
      if (!this.hasParcelDetails) return
      this.reviewAttempted = true
      if (!this.hasValidReason) {
        this.$refs.reason.focus()
        return
      }
      this.error = ''
      this.confirmation = ''
      this.step = 'review'
      this.$nextTick(() => this.$refs.confirmation?.focus())
    },
    editDraft () {
      this.confirmation = ''
      this.error = ''
      this.step = 'compose'
      this.$nextTick(() => this.$refs.review?.$el.focus())
    },
    async send () {
      if (!this.canSend) return
      this.sending = true
      this.error = ''
      const payload = {
        note: this.note, reason: this.reason.trim(), confirmation: this.confirmation,
        items: this.lines.map(line => ({
          client_key: line.key, item_id: Number(line.item.id), quantity: line.quantity,
          augment_1: Number(line.augments[0]?.id || 0),
          augment_2: Number(line.augments[1]?.id || 0),
          augment_3: Number(line.augments[2]?.id || 0),
          augment_4: Number(line.augments[3]?.id || 0),
          augment_5: Number(line.augments[4]?.id || 0),
          augment_6: Number(line.augments[5]?.id || 0)
        }))
      }
      try {
        const response = this.caseKey
          ? await SpireApi.v1().put(`player-support/cases/${encodeURIComponent(this.caseKey)}/parcel`,
            { ...payload, request_id: this.requestId }, { params: { connection_id: this.connectionId } })
          : await SpireApi.v1().put('mail-parcels-editor/parcel/send', {
            ...payload, character_id: Number(this.recipient.id), from_name: this.fromName.trim(), sent_date: sqlDateTime(this.sentAt)
          })
        this.result = response.data
        this.step = 'result'
        this.$nextTick(() => this.$refs.done?.$el.focus())
        this.$emit('sent')
      } catch (error) {
        this.error = (error.response && error.response.data && error.response.data.error) ||
          (this.caseKey ? 'Delivery outcome unavailable. Retry from this dialog to check the same request.' : 'Could not send GM parcels.')
        if (this.caseKey) {
          this.verify = /needs verification|already recorded/.test(this.error)
          this.$emit('reconcile')
        }
      } finally {
        this.sending = false
      }
    }
  }
}
</script>
