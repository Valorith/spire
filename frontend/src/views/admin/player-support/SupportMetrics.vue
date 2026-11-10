<template>
  <b-modal ref="modal" visible centered scrollable size="lg" modal-class="support-modal" title="Support insights" @hide="$emit('close')">
    <div class="metrics">
      <div class="metrics-bar">
        <p>Petitions filed in the last {{ days }} days.</p>
        <div class="support-segmented metrics-range" role="group" aria-label="Period">
          <button v-for="option in [7, 30, 90]" :key="option" type="button" :aria-pressed="String(days === option)" @click="setDays(option)">{{ option }} days</button>
        </div>
      </div>
      <support-load-state v-if="error || !data" :error="error" label="Loading insights" :rows="3" @retry="load" />
      <template v-else>
        <div class="metrics-cards">
          <div class="support-stat" :class="{ 'is-quiet': !data.filed }"><strong>{{ data.filed }}</strong><span>Filed</span></div>
          <div class="support-stat" :class="{ 'is-quiet': !data.resolved }"><strong>{{ data.resolved }}</strong><span>Resolved</span><small>{{ percent(data.resolved, data.filed - data.merged) }}</small></div>
          <div class="support-stat" :class="{ 'is-quiet': data.first_response_minutes == null }"><strong>{{ duration(data.first_response_minutes) }}</strong><span>Median first response</span><small>{{ data.responded }} answered</small></div>
          <div class="support-stat" :class="{ 'is-quiet': data.resolve_minutes == null }"><strong>{{ duration(data.resolve_minutes) }}</strong><span>Median time to resolve</span><small v-if="data.merged">{{ data.merged }} merged</small></div>
        </div>
        <h3 class="support-section-label metrics-heading">By staff member</h3>
        <p v-if="!data.staff.length" class="support-empty is-compact metrics-empty">No responses or resolutions in this period.</p>
        <table v-else class="support-table metrics-table">
          <thead><tr><th scope="col">Staff</th><th scope="col" class="is-number">Responses</th><th scope="col" class="is-number">Resolved</th><th scope="col"><span class="sr-only">Share</span></th></tr></thead>
          <tbody>
            <tr v-for="member in data.staff" :key="member.name">
              <th scope="row">{{ member.name }}</th>
              <td class="is-number">{{ member.responses }}</td>
              <td class="is-number">{{ member.resolved }}</td>
              <td class="metrics-share"><span :style="{ width: share(member) + '%' }"></span></td>
            </tr>
          </tbody>
        </table>
        <p class="metrics-muted">A response is a tell, mail or parcel sent from Player Support. Times count from when the petition was filed.</p>
      </template>
    </div>
    <template #modal-footer>
      <button type="button" class="support-button" @click="$emit('close')">Done</button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { dialogFocus } from './support-dialog'
import SupportLoadState from './SupportLoadState.vue'

export default {
  name: 'SupportMetrics',
  components: { SupportLoadState },
  mixins: [dialogFocus],
  props: { connectionId: { type: Number, required: true } },
  data () { return { days: 30, data: null, error: '', version: 0 } },
  computed: {
    busiest () { return this.data ? Math.max(1, ...this.data.staff.map(member => member.responses + member.resolved)) : 1 }
  },
  mounted () { this.load() },
  methods: {
    setDays (days) {
      if (days === this.days) return
      this.days = days
      this.load()
    },
    async load () {
      const version = ++this.version
      this.error = ''
      try {
        const { data } = await SpireApi.v1().get('player-support/metrics', { params: { connection_id: this.connectionId, days: this.days } })
        if (version === this.version) this.data = data
      } catch (error) {
        if (version === this.version) this.error = (error.response && error.response.data && error.response.data.error) || 'Insights could not be loaded.'
      }
    },
    duration (minutes) {
      if (minutes === null || minutes === undefined) return '—'
      if (minutes < 1) return '< 1 min'
      if (minutes < 90) return `${Math.round(minutes)} min`
      if (minutes < 2880) return `${(minutes / 60).toFixed(minutes < 600 ? 1 : 0)} h`
      return `${(minutes / 1440).toFixed(1)} days`
    },
    percent (part, whole) { return whole > 0 ? `${Math.round(part / whole * 100)}% of filed` : '' },
    share (member) { return Math.round((member.responses + member.resolved) / this.busiest * 100) }
  }
}
</script>

<style scoped>
/* Dialog chrome, stat cards, segmented control, table and empty state come from support-theme.css. */
.metrics-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--support-space-3); margin-bottom: var(--support-space-4); }
.metrics-bar p { margin: 0; color: var(--support-text-secondary); font-size: var(--support-text-sm); }
.metrics-range { min-width: 228px; }
.metrics-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--support-space-2); }
/* Labels are long here ("Median time to resolve"); wrap rather than truncate. */
.metrics-cards .support-stat > span { white-space: normal; }
.metrics-heading { margin: var(--support-space-5) 0 var(--support-space-1); }
.metrics-table td:nth-child(2), .metrics-table td:nth-child(3) { width: 96px; }
.metrics-share { width: 36%; padding-left: var(--support-space-5); }
.metrics-share span { display: block; min-width: 2px; height: 6px; border-radius: var(--support-radius-sm); background: var(--support-accent); }
.metrics-empty { margin: var(--support-space-2) 0 0; }
.metrics-muted { margin: var(--support-space-4) 0 0; color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.5; }
@media (max-width: 560px) {
  .metrics-range { width: 100%; }
}
</style>
