<template>
  <section v-if="reports.length || error" class="bugs" aria-labelledby="bugs-heading">
    <h2 id="bugs-heading" class="support-section-label">Bug reports <span v-if="reports.length" class="support-count">{{ reports.length }}</span></h2>
    <p v-if="error && !reports.length" class="support-feedback is-error" role="alert">
      {{ error }} <button type="button" class="support-link" @click="load">Try again</button>
    </p>
    <ul v-else class="bugs-list">
      <li v-for="report in reports" :key="report.id" class="bugs-report">
        <div class="bugs-top">
          <strong>#{{ report.id }}</strong>
          <span v-if="report.linked" class="support-chip is-accent"><i class="fe fe-link" aria-hidden="true"></i> Linked</span>
          <span v-if="reviewed(report)" class="support-chip"><i class="fe fe-check" aria-hidden="true"></i> Reviewed</span>
          <time :datetime="report.reported_at" :title="formatDate(report.reported_at)">{{ formatDay(report.reported_at) }}</time>
        </div>
        <div class="bugs-meta">{{ [report.character_name, report.category, report.zone].filter(Boolean).join(' · ') }}</div>
        <p class="bugs-text">{{ expanded[report.id] ? report.text : short(report.text) }}
          <button v-if="(report.text || '').length > 160" type="button" class="support-link" :aria-expanded="String(Boolean(expanded[report.id]))"
                  @click="$set(expanded, report.id, !expanded[report.id])">{{ expanded[report.id] ? 'Show less' : 'Show more' }}</button>
        </p>
        <p v-if="report.reviewed_by" class="bugs-reviewed">Reviewed by {{ report.reviewed_by }}</p>
        <div v-if="canWrite && reviewing !== report.id" class="bugs-actions">
          <button type="button" class="support-button is-sm" :disabled="busy" @click="act(report, report.linked ? 'unlink' : 'link')">
            <i :class="report.linked ? 'fe fe-x' : 'fe fe-link'" aria-hidden="true"></i> {{ report.linked ? 'Unlink' : 'Link to case' }}
          </button>
          <button v-if="canReview && !reviewed(report)" type="button" class="support-button is-sm is-ghost" :disabled="busy" @click="startReview(report)">
            <i class="fe fe-check" aria-hidden="true"></i> Mark reviewed
          </button>
        </div>
        <div v-if="reviewing === report.id" class="bugs-review">
          <label :for="'bugs-note-' + report.id" class="support-label bugs-label">Review note <span class="support-label-hint">(optional)</span></label>
          <textarea :id="'bugs-note-' + report.id" ref="note" v-model="note" class="support-field bugs-note" rows="2" maxlength="1000" :disabled="busy"></textarea>
          <div class="bugs-actions">
            <button type="button" class="support-button is-sm" :disabled="busy" @click="reviewing = 0">Cancel</button>
            <button type="button" class="support-button is-sm is-primary" :disabled="busy" @click="act(report, 'review')">Mark reviewed</button>
          </div>
        </div>
        <p v-if="failure.id === report.id" class="support-feedback is-error" role="alert">{{ failure.text }}</p>
      </li>
    </ul>
  </section>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { canWriteAdminApi } from '@/app/user/server-admin-access'

// Inspector section: the account's /bug reports, linked to the case (T12).
// Renders nothing when the account has none. Events: receipt({ status, message }).
export default {
  name: 'SupportBugReports',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    canWrite: { type: Boolean, default: false }
  },
  data () {
    return { reports: [], error: '', expanded: {}, busy: false, reviewing: 0, note: '', failure: { id: 0, text: '' } }
  },
  computed: {
    endpoint () { return `player-support/cases/${encodeURIComponent(this.record.key)}/bug-reports` },
    canReview () { return canWriteAdminApi('bug_reports') }
  },
  mounted () { this.load() },
  methods: {
    errorText (error, fallback) { return (error.response && error.response.data && error.response.data.error) || fallback },
    async load () {
      this.error = ''
      try {
        const { data } = await SpireApi.v1().get(this.endpoint, { params: { connection_id: this.connectionId } })
        this.reports = (data && data.reports) || []
      } catch (error) {
        this.reports = []
        this.error = this.errorText(error, 'Bug reports could not be loaded.')
      }
    },
    reviewed (report) { return Number(report.status) > 0 },
    short (text) {
      const value = String(text || '')
      return value.length > 160 ? value.slice(0, 160).trimEnd() + '…' : value
    },
    startReview (report) {
      this.reviewing = report.id
      this.note = ''
      this.failure = { id: 0, text: '' }
      this.$nextTick(() => { const field = this.$refs.note && this.$refs.note[0]; if (field) field.focus() })
    },
    async act (report, action) {
      if (this.busy) return
      this.busy = true
      this.failure = { id: 0, text: '' }
      try {
        const { data } = await SpireApi.v1().put(`${this.endpoint}/${report.id}`, { action, note: action === 'review' ? this.note.trim() : '' },
          { params: { connection_id: this.connectionId } })
        if (data && Array.isArray(data.reports)) this.reports = data.reports
        this.reviewing = 0
        const message = { link: `Bug report #${report.id} is linked to this case.`, unlink: `Bug report #${report.id} is no longer linked to this case.`, review: `Bug report #${report.id} is marked reviewed.` }[action]
        this.$emit('receipt', { status: 'sent', message })
      } catch (error) {
        this.failure = { id: report.id, text: this.errorText(error, 'The bug report could not be updated.') }
      } finally {
        this.busy = false
      }
    },
    formatDate (value) {
      return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : ''
    },
    formatDay (value) {
      return value ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value)) : ''
    }
  }
}
</script>

<style scoped>
/* Layout only. Colours, type, radius and spacing come from support-theme.css. */
.bugs .support-section-label .support-count { letter-spacing: 0; }
.bugs-list { display: grid; gap: var(--support-space-2); margin: 0; padding: 0; list-style: none; }
.bugs-report { display: grid; gap: 6px; padding: var(--support-space-2) 10px; border: 1px solid var(--support-border); border-radius: var(--support-radius); background: var(--support-bg); }
.bugs-top { display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-2); font-size: var(--support-text-sm); }
.bugs-top strong { color: var(--support-text); font-weight: 600; font-variant-numeric: tabular-nums; }
.bugs-top time { margin-left: auto; color: var(--support-faint); font-size: var(--support-text-xs); }
.bugs-meta,
.bugs-reviewed { margin: 0; color: var(--support-muted); font-size: var(--support-text-xs); }
.bugs-text { margin: 0; color: var(--support-text-secondary); font-size: var(--support-text-xs); line-height: 1.5; overflow-wrap: anywhere; white-space: pre-line; }
.bugs-text .support-link { font-size: var(--support-text-xs); }
.bugs-actions { display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 6px; }
.bugs-review { display: grid; gap: 6px; }
.bugs-review .bugs-actions { justify-content: flex-end; }
.bugs .bugs-label { margin: var(--support-space-1) 0 0; font-size: var(--support-text-xs); }
.bugs-note { font-size: var(--support-text-sm); }
.bugs .support-feedback { margin: 0; font-size: var(--support-text-xs); }
</style>
