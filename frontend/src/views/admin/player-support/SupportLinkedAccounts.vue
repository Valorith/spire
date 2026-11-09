<template>
  <span v-if="false"></span>
</template>

<script>
// Inspector section: accounts that share an IP address with the case's
// account (T11). Events: open-case(key).
export default {
  name: 'SupportLinkedAccounts',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true }
  }
}
</script>
