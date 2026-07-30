<template>
  <b-modal
    ref="modal"
    :title="title"
    modal-class="spire-editor-modal"
    content-class="spire-editor-modal-content"
    centered
    hide-footer
    no-close-on-backdrop
    @hidden="onHidden"
  >
    <div class="operational-discard">
      <div class="operational-discard__message">
        <i class="fa fa-pencil-square-o"></i>
        <div>
          <strong>Your changes have not been saved.</strong>
          <span>{{ message }}</span>
        </div>
      </div>
      <div class="operational-discard__actions">
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="keepEditing">
          Keep editing
        </button>
        <button type="button" class="btn btn-sm btn-outline-warning" @click="discard">
          <i class="fa fa-trash-o mr-1"></i>Discard changes
        </button>
      </div>
    </div>
  </b-modal>
</template>

<script>
  export default {
    name: 'OperationalDiscardModal',
    props: {
      title: { type: String, default: 'Discard unsaved changes?' },
      message: {
        type: String,
        default: 'Discard the pending draft to continue. This cannot be undone.'
      }
    },
    data () {
      return { resolved: false }
    },
    methods: {
      show () {
        this.resolved = false
        this.$refs.modal.show()
      },
      discard () {
        this.resolved = true
        this.$emit('discard')
        this.$refs.modal.hide()
      },
      keepEditing () {
        this.resolved = true
        this.$emit('keep')
        this.$refs.modal.hide()
      },
      onHidden () {
        if (!this.resolved) this.$emit('keep')
        this.resolved = false
      }
    }
  }
</script>
