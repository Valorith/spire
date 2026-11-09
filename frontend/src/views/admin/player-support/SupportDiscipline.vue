<template>
  <span v-if="false"></span>
</template>

<script>
// Discipline: kick (T5), suspend, ban and revoke chat (T6).
// Events: close, receipt({ status, message }).
export default {
  name: 'SupportDiscipline',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    features: { type: Object, default: () => ({}) },
    canSanction: { type: Boolean, default: false }
  }
}
</script>
