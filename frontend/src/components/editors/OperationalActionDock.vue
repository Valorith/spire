<template>
  <div class="operational-action-dock">
    <button
      v-if="showBack"
      type="button"
      class="operational-compact-back"
      @click="$emit('back')"
    >
      <i class="fa fa-arrow-left"></i>
      <span>{{ backLabel }}</span>
    </button>
    <div
      :id="statusId"
      class="operational-action-state"
      :class="'operational-action-state--' + state"
      role="status"
      aria-live="polite"
    >
      <i :class="stateIcon"></i>
      <span>
        <strong>{{ title }}</strong>
        <small>{{ detail }}</small>
      </span>
    </div>
    <div class="spire-editor-actions">
      <slot></slot>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'OperationalActionDock',
    props: {
      state: { type: String, default: 'idle' },
      title: { type: String, required: true },
      detail: { type: String, default: '' },
      statusId: { type: String, required: true },
      showBack: { type: Boolean, default: true },
      backLabel: { type: String, default: 'Back to list' }
    },
    computed: {
      stateIcon () {
        if (this.state === 'ready') return 'fa fa-check-circle'
        if (this.state === 'blocked') return 'fa fa-exclamation-circle'
        if (this.state === 'saving') return 'fa fa-spinner fa-spin'
        return 'fa fa-circle-o'
      }
    }
  }
</script>
