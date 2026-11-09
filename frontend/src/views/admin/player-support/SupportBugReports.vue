<template>
  <span v-if="false"></span>
</template>

<script>
// Inspector section: the account's /bug reports, linked to the case (T12).
// Renders nothing when the account has none. Events: receipt({ status, message }).
export default {
  name: 'SupportBugReports',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    canWrite: { type: Boolean, default: false }
  }
}
</script>
