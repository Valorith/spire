<template>
  <div class="support-callout support-result" :class="tone">
    <i :class="icon" aria-hidden="true"></i>
    <div class="support-result-text">
      <p :role="kind === 'done' ? 'status' : 'alert'">{{ result.message }}</p>
      <small v-if="footnote">{{ footnote }}</small>
    </div>
    <button v-if="dismissible" type="button" class="support-button is-ghost is-icon is-sm support-result-close" aria-label="Dismiss result" @click="$emit('dismiss')">
      <i class="fe fe-x" aria-hidden="true"></i>
    </button>
  </div>
</template>

<script>
// What a tool did, in the server's words, and where it is recorded. A change
// World did not confirm is never sent again from here: the GM checks first.
const unconfirmed = ['unconfirmed', 'moved_arrival_unconfirmed']
// Done, but something around it (the in-game notice) did not go through.
const partial = ['moved_notice_unavailable']

export default {
  name: 'SupportResult',
  props: {
    // { status: 'sent' | 'unconfirmed' | 'failed' | ..., message }
    result: { type: Object, required: true },
    // Whether a confirmed change lands on the case timeline.
    timeline: { type: Boolean, default: true },
    dismissible: { type: Boolean, default: false }
  },
  computed: {
    kind () {
      const status = this.result.status
      if (status === 'failed') return 'failed'
      if (unconfirmed.includes(status)) return 'unconfirmed'
      return partial.includes(status) ? 'partial' : 'done'
    },
    tone () { return { done: 'is-success', partial: 'is-warning', unconfirmed: 'is-warning', failed: 'is-danger' }[this.kind] },
    icon () { return { done: 'fe fe-check-circle', partial: 'fe fe-alert-triangle', unconfirmed: 'fe fe-alert-triangle', failed: 'fe fe-alert-circle' }[this.kind] },
    footnote () {
      if (this.kind === 'done' || this.kind === 'partial') return this.timeline ? 'Recorded on the case timeline.' : ''
      if (this.kind === 'unconfirmed') return 'Nothing is sent again automatically.'
      return ''
    }
  }
}
</script>

<style scoped>
.support-result { align-items: flex-start; }
.support-result-text { display: grid; flex: 1; gap: 2px; min-width: 0; }
.support-result-text p { margin: 0; color: var(--support-text); }
.support-result-text small { color: var(--support-muted); font-size: var(--support-text-xs); }
.support-result-close { flex: none; margin: -4px -6px -4px 0; }
</style>
