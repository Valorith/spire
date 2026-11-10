<template>
  <div v-if="error" class="support-callout is-danger support-load-error">
    <i class="fe fe-alert-circle" aria-hidden="true"></i>
    <p role="alert">{{ error }}</p>
    <button v-if="retry" type="button" class="support-button is-sm" @click="$emit('retry')"><i class="fe fe-refresh-cw" aria-hidden="true"></i> Try again</button>
  </div>
  <div v-else class="support-loadstate" :class="'is-' + shape" role="status" :aria-label="label">
    <span v-for="row in rows" :key="row" class="support-loadstate-row" aria-hidden="true">
      <span v-if="shape === 'list'" class="support-shimmer support-loadstate-icon"></span>
      <span class="support-loadstate-lines">
        <span class="support-shimmer" :style="{ width: widths[(row - 1) % widths.length][0] }"></span>
        <span class="support-shimmer" :style="{ width: widths[(row - 1) % widths.length][1] }"></span>
      </span>
    </span>
  </div>
</template>

<script>
// The loading and failed state every tool shares: a skeleton shaped like what
// is coming, or the error in plain words with "Try again".
export default {
  name: 'SupportLoadState',
  props: {
    error: { type: String, default: '' },
    // What is loading, for screen readers ("Loading tasks").
    label: { type: String, default: 'Loading' },
    rows: { type: Number, default: 3 },
    // 'list' rows have a leading icon; 'lines' are text only.
    shape: { type: String, default: 'list' },
    retry: { type: Boolean, default: true }
  },
  data () {
    return { widths: [['38%', '72%'], ['30%', '58%'], ['44%', '66%'], ['26%', '50%']] }
  }
}
</script>

<style scoped>
.support-load-error { align-items: center; margin: 0; }
.support-load-error p { flex: 1; min-width: 0; margin: 0; }
.support-load-error > i { margin-top: 0; }
.support-load-error .support-button { flex: none; }
.support-loadstate { display: grid; gap: var(--support-space-2); }
.support-loadstate-row { display: flex; align-items: center; gap: var(--support-space-3); padding: var(--support-space-3); border: 1px solid var(--support-border-subtle); border-radius: var(--support-radius); }
.support-loadstate.is-lines .support-loadstate-row { padding: var(--support-space-1) 0; border: 0; }
.support-loadstate-icon { flex: none; width: 28px; height: 28px; border-radius: 50%; }
.support-loadstate-lines { display: grid; flex: 1; gap: var(--support-space-2); min-width: 0; }
.support-loadstate-lines > .support-shimmer { height: 10px; }
.support-loadstate-lines > .support-shimmer:first-child { height: 12px; }
</style>
