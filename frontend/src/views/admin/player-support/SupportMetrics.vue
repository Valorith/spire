<template>
  <b-modal visible centered size="lg" modal-class="support-modal" title="Support insights" @hide="$emit('close')">
    <div class="metrics">
      <div class="metrics-bar">
        <p>Petitions filed in the last {{ days }} days.</p>
        <div class="metrics-range" role="group" aria-label="Period">
          <button v-for="option in [7, 30, 90]" :key="option" type="button" :aria-pressed="String(days === option)" @click="setDays(option)">{{ option }} days</button>
        </div>
      </div>
      <p v-if="error" class="metrics-error" role="alert">{{ error }}</p>
      <p v-else-if="!data" class="metrics-muted" role="status">Loading…</p>
      <template v-else>
        <div class="metrics-cards">
          <div class="metrics-card tone-blue"><span>Filed</span><strong>{{ data.filed }}</strong></div>
          <div class="metrics-card tone-green"><span>Resolved</span><strong>{{ data.resolved }}</strong><small>{{ percent(data.resolved, data.filed - data.merged) }}</small></div>
          <div class="metrics-card tone-gold"><span>Median first response</span><strong>{{ duration(data.first_response_minutes) }}</strong><small>{{ data.responded }} answered</small></div>
          <div class="metrics-card tone-violet"><span>Median time to resolve</span><strong>{{ duration(data.resolve_minutes) }}</strong><small v-if="data.merged">{{ data.merged }} merged</small></div>
        </div>
        <h3>By staff member</h3>
        <p v-if="!data.staff.length" class="metrics-muted">No responses or resolutions in this period.</p>
        <table v-else class="metrics-table">
          <thead><tr><th scope="col">Staff</th><th scope="col">Responses</th><th scope="col">Resolved</th><th scope="col"><span class="sr-only">Share</span></th></tr></thead>
          <tbody>
            <tr v-for="member in data.staff" :key="member.name">
              <th scope="row">{{ member.name }}</th>
              <td>{{ member.responses }}</td>
              <td>{{ member.resolved }}</td>
              <td class="metrics-share"><span :style="{ width: share(member) + '%' }"></span></td>
            </tr>
          </tbody>
        </table>
        <p class="metrics-muted">A response is a tell, mail or parcel sent from Player Support. Times count from when the petition was filed.</p>
      </template>
    </div>
    <template #modal-footer>
      <button type="button" class="btn btn-outline-light btn-sm" @click="$emit('close')">Done</button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'

export default {
  name: 'SupportMetrics',
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
        if (version === this.version) this.error = (error.response && error.response.data && error.response.data.error) || 'Insights could not be loaded'
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
.metrics-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.metrics-bar p { margin: 0; color: #a9b9ca; font-size: .82rem; }
.metrics-range { display: flex; gap: 4px; }
.metrics-range button { padding: 3px 11px; border-radius: 999px; border: 1px solid #34465a; background: #172230; color: #b8c8d8; font-size: .76rem; }
.metrics-range button[aria-pressed="true"] { color: #1f1910; background: #dfb976; border-color: #dfb976; font-weight: 650; }
.metrics-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; }
.metrics-card { --tone: #9cc5f5; display: grid; gap: 2px; padding: 11px 13px; border: 1px solid #2f3d4d; border-top: 3px solid var(--tone); border-radius: 10px; background: #172230; }
.metrics-card.tone-green { --tone: #8fd6ad; }
.metrics-card.tone-gold { --tone: #dfb976; }
.metrics-card.tone-violet { --tone: #b9a0f0; }
.metrics-card span { color: #8fa1b5; font-size: .72rem; }
.metrics-card strong { color: #f0f4f8; font-size: 1.35rem; font-weight: 650; font-variant-numeric: tabular-nums; }
.metrics-card small { color: #8fa1b5; font-size: .7rem; }
.metrics h3 { margin: 18px 0 8px; color: #f0f4f8; font-size: .86rem; font-weight: 650; }
.metrics-table { width: 100%; border-collapse: collapse; font-size: .8rem; }
.metrics-table th, .metrics-table td { padding: 7px 8px; border-bottom: 1px solid #243241; text-align: left; color: #d5e0ea; font-variant-numeric: tabular-nums; }
.metrics-table thead th { color: #8fa1b5; font-size: .7rem; font-weight: 650; text-transform: uppercase; letter-spacing: .04em; }
.metrics-table tbody th { color: #eef3f8; font-weight: 600; }
.metrics-share { width: 34%; }
.metrics-share span { display: block; height: 6px; border-radius: 3px; background: linear-gradient(90deg, #dfb976, #f4ba83); }
.metrics-muted { margin: 10px 0 0; color: #8fa1b5; font-size: .76rem; }
.metrics-error { color: #ffadbd; font-size: .82rem; }
</style>
