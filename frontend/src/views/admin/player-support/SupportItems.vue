<template>
  <span v-if="false"></span>
</template>

<script>
// Item tracer and restore history for the case's account (T2).
// Events: close, restore({ lines, reason, note }).
export default {
  name: 'SupportItems',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    canRestore: { type: Boolean, default: false },
    // { item_id, quantity, augments: [6], label } from an Evidence row or a
    // snapshot line, or null to start with a search.
    initialItem: { type: Object, default: null }
  }
}
</script>
