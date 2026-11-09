<template>
  <section class="linked" aria-labelledby="linked-heading">
    <h2 id="linked-heading" class="support-section-label">Linked accounts <span v-if="data" class="support-count">{{ accounts.length }}</span></h2>
    <div v-if="!data && !loading" class="linked-start">
      <button type="button" class="support-button is-ghost linked-check" @click="load">
        <i class="fe fe-share-2" aria-hidden="true"></i> Check shared IP addresses
      </button>
      <small>Viewing is recorded on the case.</small>
      <p v-if="error" class="support-feedback is-error" role="alert">{{ error }}</p>
    </div>
    <p v-else-if="loading" class="support-feedback" role="status"><i class="fe fe-loader support-spin" aria-hidden="true"></i> Checking shared addresses…</p>
    <template v-else>
      <p v-if="!accounts.length" class="linked-none">No other account shares an address with {{ record.account }}.</p>
      <ul v-else class="linked-list">
        <li v-for="account in accounts" :key="account.id" class="linked-account">
          <div class="linked-top">
            <strong>{{ account.name }}</strong>
            <span v-if="account.restriction === 'banned'" class="support-chip is-danger">Banned</span>
            <span v-else-if="account.restriction === 'suspended'" class="support-chip is-warning">Suspended</span>
            <span class="linked-shared">{{ shared(account) }}</span>
          </div>
          <div class="linked-ips">
            <code v-for="address in account.shared || []" :key="address.ip" :title="address.last_used ? 'Last used ' + formatDate(address.last_used) : null">{{ address.ip }}</code>
          </div>
          <div class="linked-meta">
            <span v-if="(account.characters || []).length">{{ account.characters.join(', ') }}</span>
            <span v-else>No characters</span>
            <button v-if="account.case_key && account.cases" type="button" class="support-link" @click="$emit('open-case', account.case_key)">{{ casesLabel(account) }}</button>
            <span v-else>{{ casesLabel(account) }}</span>
          </div>
        </li>
      </ul>
      <p v-if="data.hidden_addresses" class="linked-note">{{ data.hidden_addresses }} widely shared {{ data.hidden_addresses === 1 ? 'address was' : 'addresses were' }} left out.</p>
    </template>
  </section>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'

// Inspector section: accounts that share an IP address with the case's
// account (T11). Events: open-case(key).
export default {
  name: 'SupportLinkedAccounts',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true }
  },
  data () {
    return { data: null, loading: false, error: '' }
  },
  computed: {
    accounts () { return (this.data && this.data.accounts) || [] }
  },
  methods: {
    async load () {
      if (this.loading) return
      this.loading = true
      this.error = ''
      try {
        const { data } = await SpireApi.v1().get(`player-support/cases/${encodeURIComponent(this.record.key)}/linked-accounts`, {
          params: { connection_id: this.connectionId }
        })
        this.data = data || { accounts: [] }
      } catch (error) {
        this.error = (error.response && error.response.data && error.response.data.error) || 'Linked accounts could not be loaded.'
      } finally {
        this.loading = false
      }
    },
    shared (account) {
      const count = (account.shared || []).length
      return `${count} shared ${count === 1 ? 'address' : 'addresses'}`
    },
    casesLabel (account) {
      const count = Number(account.cases) || 0
      return `${count} ${count === 1 ? 'case' : 'cases'}`
    },
    formatDate (value) {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    }
  }
}
</script>

<style scoped>
/* Layout only. Colours, type, radius and spacing come from support-theme.css. */
.linked .support-section-label .support-count { letter-spacing: 0; }
.linked-start { display: grid; justify-items: start; gap: var(--support-space-1); }
.linked-start .linked-check { margin-left: -12px; }
.linked-start small { color: var(--support-muted); font-size: var(--support-text-xs); }
.linked-start .support-feedback { margin: var(--support-space-1) 0 0; }
.linked-none,
.linked-note { margin: 0; color: var(--support-muted); font-size: var(--support-text-sm); line-height: 1.5; }
.linked-note { margin-top: var(--support-space-2); font-size: var(--support-text-xs); }
.linked-list { display: grid; gap: var(--support-space-2); margin: 0; padding: 0; list-style: none; }
.linked-account { display: grid; gap: 6px; padding: var(--support-space-2) 10px; border: 1px solid var(--support-border); border-radius: var(--support-radius); background: var(--support-bg); }
.linked-top { display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-2); font-size: var(--support-text-sm); }
.linked-top strong { color: var(--support-text); font-weight: 600; overflow-wrap: anywhere; }
.linked-shared { margin-left: auto; color: var(--support-muted); font-size: var(--support-text-xs); white-space: nowrap; }
.linked-ips { display: flex; flex-wrap: wrap; gap: var(--support-space-1); font-size: var(--support-text-xs); }
.linked-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--support-space-1) var(--support-space-3); color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.45; }
.linked-meta > span:first-child { min-width: 0; overflow-wrap: anywhere; }
.linked-meta .support-link { font-size: var(--support-text-xs); }
</style>
