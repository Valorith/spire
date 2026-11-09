<template>
  <span v-if="false"></span>
</template>

<script>
// Quests & progress: tasks (T4), lockouts and instances (T3), flags, keys and
// data buckets (T10). Events: close, receipt({ status, message }).
export default {
  name: 'SupportProgress',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    features: { type: Object, default: () => ({}) },
    canWrite: { type: Boolean, default: false },
    canReloadCache: { type: Boolean, default: false },
    // 'tasks', 'lockouts' or 'flags'
    initialTab: { type: String, default: 'tasks' }
  }
}
</script>
