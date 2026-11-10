<template>
  <div class="support-reason" :class="{ 'is-invalid': showError }">
    <label :for="id" class="support-label support-reason-label">{{ label }} <span class="support-label-hint">{{ hint }}</span></label>
    <textarea :id="id" ref="field" :value="value" class="support-field" :rows="rows" :maxlength="max" :disabled="disabled" :placeholder="placeholder"
              :aria-invalid="showError ? 'true' : null" :aria-describedby="describedBy" @input="onInput"
              @keydown.enter.ctrl.exact.prevent="$emit('submit')" @keydown.enter.meta.exact.prevent="$emit('submit')"></textarea>
    <div class="support-reason-meta">
      <p v-if="showError" :id="id + '-error'" class="support-reason-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ errorText }}</p>
      <span v-else :id="id + '-rule'" class="support-reason-rule">{{ ruleText }}</span>
      <!-- A visual count only: read with the description, "0/240" was noise on every focus. The rule says the limits. -->
      <span class="support-reason-count" :class="{ 'is-short': size > 0 && !valid }" aria-hidden="true">{{ size }}/{{ max }}</span>
    </div>
    <p v-if="note" :id="id + '-note'" class="support-reason-note">{{ note }}</p>
  </div>
</template>

<script>
// The reason every change to player data needs. One field for every tool:
// a counter, the rule under the field, and inline validation once the GM has
// tried to confirm (the confirm button stays enabled and calls check()).
// Ctrl+Enter emits "submit". The count is in bytes, as the server counts.
export default {
  name: 'SupportReason',
  props: {
    id: { type: String, required: true },
    value: { type: String, default: '' },
    label: { type: String, default: 'Reason' },
    hint: { type: String, default: '(required, recorded on the case)' },
    min: { type: Number, default: 8 },
    max: { type: Number, default: 240 },
    // Count UTF-8 bytes (Player Operations reasons) or characters.
    bytes: { type: Boolean, default: true },
    rows: { type: Number, default: 2 },
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    // A line under the field, read after the rule (for example who is notified).
    note: { type: String, default: '' },
    // Further ids that describe the field, read last.
    describedby: { type: String, default: '' }
  },
  data () {
    return { attempted: false }
  },
  computed: {
    trimmed () { return this.value.trim() },
    size () { return this.bytes ? new TextEncoder().encode(this.trimmed).length : Array.from(this.trimmed).length },
    valid () { return this.size >= this.min && this.size <= this.max },
    // Shown once a confirm was tried, or once a too-long value is typed.
    showError () { return !this.valid && (this.attempted || this.size > this.max) },
    ruleText () { return this.min > 1 ? `${this.min} to ${this.max} characters` : `Up to ${this.max} characters` },
    errorText () {
      if (!this.size) return this.min > 1 ? `Add a reason of ${this.min} to ${this.max} characters.` : 'Add a reason.'
      return this.min > 1 ? `Use ${this.min} to ${this.max} characters for the reason.` : `Use up to ${this.max} characters for the reason.`
    },
    describedBy () {
      return [this.showError ? this.id + '-error' : this.id + '-rule', this.note ? this.id + '-note' : '', this.describedby]
        .filter(Boolean).join(' ')
    }
  },
  methods: {
    onInput (event) { this.$emit('input', event.target.value) },
    focus () { if (this.$refs.field) this.$refs.field.focus() },
    // Called by the dialog's confirm button. Shows the error and moves focus
    // to the field when the reason does not fit; returns whether it does.
    check () {
      this.attempted = true
      if (!this.valid) this.$nextTick(this.focus)
      return this.valid
    },
    reset () { this.attempted = false }
  }
}
</script>

<style scoped>
/* Colours, type and spacing come from support-theme.css. */
.support-reason { display: grid; min-width: 0; }
.support-reason .support-reason-label { margin-top: 0; }
.support-reason.is-invalid .support-field { border-color: var(--support-danger); }
.support-reason.is-invalid .support-field:focus { border-color: var(--support-danger); box-shadow: 0 0 0 3px var(--support-danger-soft); }
.support-reason-meta { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--support-space-3); margin-top: 6px; font-size: var(--support-text-xs); line-height: 1.45; }
.support-reason-rule { color: var(--support-muted); }
.support-reason-error { display: flex; align-items: flex-start; gap: 6px; margin: 0; color: var(--support-danger); font-weight: 600; }
.support-reason-error i { margin-top: 2px; }
.support-reason-count { flex: none; margin-left: auto; color: var(--support-faint); font-variant-numeric: tabular-nums; }
.support-reason-count.is-short { color: var(--support-warning); }
.support-reason-note { margin: var(--support-space-1) 0 0; color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.45; }
</style>
