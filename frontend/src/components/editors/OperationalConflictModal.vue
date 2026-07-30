<template>
  <b-modal
    ref="modal"
    modal-class="spire-editor-modal"
    content-class="spire-editor-modal-content"
    hide-footer
    centered
    title="This record changed elsewhere"
  >
    <div class="operational-conflict">
      <div class="operational-conflict__intro">
        <i class="fa fa-code-fork"></i>
        <div>
          <strong>Your draft is still safe.</strong>
          <span>{{ message }}</span>
        </div>
      </div>
      <div v-if="changes.length" class="operational-conflict__changes">
        <div class="operational-conflict__heading">
          <span>Field</span><span>Your draft</span><span>Current server value</span>
        </div>
        <div v-for="change in changes" :key="change.key" class="operational-conflict__row">
          <strong>{{ change.label }}</strong>
          <span>{{ formatValue(change.draft) }}</span>
          <span>{{ formatValue(change.current) }}</span>
        </div>
      </div>
      <p class="operational-conflict__help">
        Reload current discards this draft. Keep draft adopts the current record as the new baseline so you can review and save your intended values again.
      </p>
      <div class="operational-conflict__actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="hide">Cancel</button>
        <button type="button" class="btn btn-sm btn-outline-warning" @click="reload">
          <i class="fa fa-refresh mr-1"></i>Reload current
        </button>
        <button type="button" class="btn btn-sm btn-warning" @click="preserve">
          <i class="fa fa-shield mr-1"></i>Keep draft
        </button>
      </div>
    </div>
  </b-modal>
</template>

<script>
  export default {
    name: 'OperationalConflictModal',
    props: {
      message: {
        type: String,
        default: 'Compare the current server values with your local draft before deciding how to continue.'
      },
      changes: { type: Array, default: () => [] }
    },
    methods: {
      show () {
        this.$refs.modal.show()
      },
      hide () {
        this.$refs.modal.hide()
      },
      reload () {
        this.hide()
        this.$emit('reload')
      },
      preserve () {
        this.hide()
        this.$emit('preserve')
      },
      formatValue (value) {
        if (value === null || typeof value === 'undefined' || value === '') return '—'
        const formatted = typeof value === 'object' ? JSON.stringify(value) : String(value)
        return formatted.length > 140 ? formatted.slice(0, 137) + '…' : formatted
      }
    }
  }
</script>
