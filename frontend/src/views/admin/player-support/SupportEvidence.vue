<template>
  <section class="support-evidence" aria-label="Evidence">
    <header class="evidence-bar">
      <div class="evidence-filters support-segmented" role="group" aria-label="Event type">
        <button v-for="option in groups" :key="option.id" type="button" :aria-pressed="String(group === option.id)" @click="setGroup(option.id)">
          <i :class="option.icon" aria-hidden="true"></i> {{ option.label }}
        </button>
      </div>
      <label class="evidence-window">
        <span class="sr-only">Time window</span>
        <select v-model.number="hours" class="support-field" aria-label="Time window" @change="load(1)">
          <option v-for="option in windows" :key="option.hours" :value="option.hours">{{ option.label }}</option>
        </select>
      </label>
    </header>
    <p class="evidence-lead">
      Player events from every character on <strong>{{ record.account }}</strong>’s account, from {{ windowLabel }} before the petition to now.
      <span v-if="total" class="evidence-total support-count">{{ total.toLocaleString() }} {{ total === 1 ? 'event' : 'events' }}</span>
    </p>

    <p v-if="error" class="evidence-message support-callout is-danger" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>
    <p v-else-if="loading && !events.length" class="evidence-message support-feedback" role="status"><i class="fe fe-loader support-spin" aria-hidden="true"></i> Loading events…</p>
    <div v-else-if="!events.length" class="evidence-empty support-empty">
      <i class="fe fe-search" aria-hidden="true"></i>
      <strong>No events in this window</strong>
      <p>Try a longer window or another type. Events only appear for types turned on in Player Event Log settings.</p>
    </div>
    <ol v-else ref="list" class="evidence-list" :class="{ 'is-loading': loading }">
      <template v-for="item in rows">
        <li v-if="item.marker" :key="item.key" class="evidence-marker" role="separator">
          <span><i class="fe fe-flag" aria-hidden="true"></i> Petition filed · {{ formatDate(filedAt * 1000) }}</span>
        </li>
        <li v-else :key="item.key" class="evidence-row" :class="'tone-' + tone(item.event_type_name)">
          <span class="evidence-icon"><i :class="icon(item.event_type_name)" aria-hidden="true"></i></span>
          <div class="evidence-body">
            <div class="evidence-heading">
              <strong>{{ item.event_type_name }}</strong>
              <span class="evidence-who" :class="{ 'is-alt': isAlt(item) }">{{ item.character || 'Unknown character' }}<template v-if="isAlt(item)"> · alt</template></span>
              <time :datetime="item.created_at" :title="formatDate(item.created_at)">{{ relative(item.created_at) }}</time>
            </div>
            <div class="evidence-detail">
              <player-event-display-component v-if="rendered(item)" :e="item" />
              <span v-else>{{ summary(item) || 'No details recorded' }}</span>
            </div>
          </div>
        </li>
      </template>
    </ol>
    <nav v-if="pages > 1" class="evidence-pager" aria-label="Event pages">
      <button type="button" class="support-button is-sm" :disabled="loading || page <= 1" @click="load(page - 1)"><i class="fe fe-chevron-left" aria-hidden="true"></i> Newer</button>
      <span>Page {{ page }} of {{ pages }} · {{ firstShown }}–{{ lastShown }} of {{ total.toLocaleString() }}</span>
      <button type="button" class="support-button is-sm" :disabled="loading || page >= pages" @click="load(page + 1)">Older <i class="fe fe-chevron-right" aria-hidden="true"></i></button>
    </nav>
  </section>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import PlayerEventDisplayComponent from '@/views/admin/player-event-logs/components/PlayerEventDisplayComponent.vue'
import { PLAYER_EVENT } from '@/views/admin/player-event-logs/player-events'
import { Items } from '@/app/items'

// Event types the shared Player Event Logs display knows how to draw.
const rendered = new Set([
  'GM_COMMAND', 'ZONING', 'AA_GAIN', 'AA_PURCHASE', 'FORAGE_SUCCESS', 'FORAGE_FAILURE', 'FISH_SUCCESS', 'FISH_FAILURE',
  'ITEM_DESTROY', 'WENT_ONLINE', 'WENT_OFFLINE', 'LEVEL_GAIN', 'LEVEL_LOSS', 'LOOT_ITEM', 'MERCHANT_PURCHASE', 'MERCHANT_SELL',
  'GROUNDSPAWN_PICKUP', 'NPC_HANDIN', 'SKILL_UP', 'TASK_ACCEPT', 'TASK_UPDATE', 'TASK_COMPLETE', 'TRADE', 'SAY', 'REZ_ACCEPTED',
  'DEATH', 'COMBINE_FAILURE', 'COMBINE_SUCCESS', 'DROPPED_ITEM', 'SPLIT_MONEY', 'TRADER_PURCHASE', 'TRADER_SELL',
  'DISCOVER_ITEM', 'POSSIBLE_HACK', 'KILLED_NPC', 'KILLED_NAMED_NPC', 'KILLED_RAID_NPC', 'ITEM_CREATION'
].map(name => PLAYER_EVENT[name]).filter(Boolean))
// Fields that are noise in a one-line summary.
const skipped = /(^|_)(id|ids|date|time|guid|unique_id|version)$|^augment_\d_id$/

const styles = {
  Trade: ['fe fe-repeat', 'item'], 'Loot Item': ['fe fe-download', 'item'], 'Item Destroy': ['fe fe-trash-2', 'loss'],
  'Dropped Item': ['fe fe-arrow-down-circle', 'loss'], 'Merchant Sell': ['fe fe-dollar-sign', 'loss'],
  'Merchant Purchase': ['fe fe-shopping-cart', 'item'], 'Parcel Item Sent': ['fe fe-package', 'item'],
  'Parcel Item Retrieved': ['fe fe-package', 'item'], 'NPC Handin': ['fe fe-gift', 'loss'], Death: ['fe fe-x-circle', 'death'],
  'Rez Accepted': ['fe fe-heart', 'other'], Zoning: ['fe fe-map', 'move'], 'GM Command': ['fe fe-terminal', 'gm'],
  'Possible Hack': ['fe fe-alert-triangle', 'loss']
}

export default {
  name: 'SupportEvidence',
  components: { PlayerEventDisplayComponent },
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    // Chat events need the Player Support Chat Logs permission.
    canReadChat: { type: Boolean, default: false },
    // Offer "Trace" on item rows that can lead to a restore.
    canRestore: { type: Boolean, default: false }
  },
  data () {
    return {
      itemNames: {}, group: 'items', hours: 24, events: [], filedAt: 0, page: 1, pageSize: 50, total: 0, newer: 0, loading: false, error: '', version: 0,
      groups: [
        { id: 'items', label: 'Items', icon: 'fe fe-package' },
        { id: 'deaths', label: 'Deaths', icon: 'fe fe-x-circle' },
        { id: 'movement', label: 'Zoning', icon: 'fe fe-map' },
        { id: 'gm', label: 'GM commands', icon: 'fe fe-terminal' },
        { id: '', label: 'All', icon: 'fe fe-layers' }
      ],
      windows: [
        { hours: 6, label: '6 hours' }, { hours: 24, label: '24 hours' }, { hours: 72, label: '3 days' }, { hours: 168, label: '7 days' }
      ]
    }
  },
  computed: {
    pages () { return Math.max(1, Math.ceil(this.total / this.pageSize)) },
    firstShown () { return (this.page - 1) * this.pageSize + 1 },
    lastShown () { return Math.min(this.total, this.page * this.pageSize) },
    windowLabel () { return (this.windows.find(option => option.hours === this.hours) || {}).label || '24 hours' },
    // Events are newest first. The server counts the events newer than the
    // petition, so the filing marker appears once, on the page it falls on.
    rows () {
      const rows = this.events.map(item => ({ ...item, key: item.id }))
      const at = this.newer - (this.page - 1) * this.pageSize
      if (rows.length && at >= 0 && (at < rows.length || (at === rows.length && this.page >= this.pages))) {
        rows.splice(at, 0, { marker: true, key: 'marker' })
      }
      return rows
    }
  },
  mounted () { this.load(1) },
  methods: {
    setGroup (group) {
      if (this.group === group) return
      this.group = group
      this.load(1)
    },
    async load (page = this.page) {
      const version = ++this.version
      this.loading = true
      this.error = ''
      try {
        const { data } = await SpireApi.v1().get(`player-support/cases/${encodeURIComponent(this.record.key)}/events`, {
          params: { connection_id: this.connectionId, hours: this.hours, group: this.group, page }
        })
        if (version !== this.version) return
        this.events = data.events || []
        this.filedAt = data.filed_at
        this.page = data.page || 1
        this.pageSize = data.page_size || 50
        this.total = data.total || 0
        this.newer = data.newer || 0
        this.$nextTick(() => { if (this.$el) this.$el.scrollTop = 0 })
      } catch (error) {
        if (version !== this.version) return
        this.events = []
        this.error = (error.response && error.response.data && error.response.data.error) || 'Events could not be loaded'
      } finally {
        if (version === this.version) this.loading = false
      }
    },
    rendered (item) { return rendered.has(item.event_type_id) },
    // A readable line for event types the shared display does not draw, such
    // as parcels: the item and quantity, who sent it, who received it.
    summary (item) {
      let data
      try {
        data = JSON.parse(item.event_data || '{}')
      } catch (e) {
        return ''
      }
      const parts = []
      if (data.item_id) {
        const name = data.item_name || this.itemNames[data.item_id] || `Item ${data.item_id}`
        if (!data.item_name && !(data.item_id in this.itemNames)) this.lookupItem(data.item_id)
        parts.push(`${name} × ${data.quantity || data.charges || 1}`)
      }
      if (data.from_player_name) parts.push(`from ${data.from_player_name}`)
      if (data.to_player_name) parts.push(`to ${data.to_player_name}`)
      const shown = new Set(['item_id', 'item_name', 'quantity', 'charges', 'from_player_name', 'to_player_name'])
      for (const [key, value] of Object.entries(data)) {
        if (parts.length >= 6) break
        if (shown.has(key) || skipped.test(key) || value === '' || value === 0 || value === null || typeof value === 'object') continue
        parts.push(`${key.replace(/_/g, ' ')}: ${value}`)
      }
      return parts.join(' · ')
    },
    async lookupItem (id) {
      this.$set(this.itemNames, id, `Item ${id}`)
      const item = await Items.getItem(id)
      if (item && item.name) this.$set(this.itemNames, id, item.name)
    },
    icon (name) { return (styles[name] || ['fe fe-activity'])[0] },
    tone (name) { return (styles[name] || [null, 'other'])[1] },
    isAlt (item) { return Boolean(item.character) && item.character.toLowerCase() !== this.record.character.toLowerCase() },
    formatDate (value) {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    },
    // Relative to the petition, which is what staff compare against.
    relative (value) {
      const minutes = Math.round((new Date(value).getTime() / 1000 - this.filedAt) / 60)
      const size = Math.abs(minutes)
      const amount = size < 60 ? `${size}m` : size < 1440 ? `${Math.round(size / 60)}h` : `${Math.round(size / 1440)}d`
      if (size === 0) return 'at filing'
      return minutes < 0 ? `${amount} before` : `${amount} after`
    }
  }
}
</script>

<style scoped>
/* Layout only. Colours, type, radius and spacing come from support-theme.css. */
.support-evidence { display: flex; flex: 1; flex-direction: column; min-height: 0; padding: var(--support-space-3) var(--support-space-5) var(--support-space-4); overflow-y: auto; }

/* Filters */
.evidence-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--support-space-2); }
.evidence-filters { grid-auto-columns: auto; }
.evidence-window { margin: 0; }
.evidence-window select { width: auto; min-height: 32px; padding: 5px var(--support-space-2) 5px 10px; font-size: var(--support-text-sm); line-height: 1.4; }
.evidence-lead { margin: var(--support-space-3) 0 var(--support-space-1); color: var(--support-muted); font-size: var(--support-text-sm); line-height: 1.6; }
.evidence-total { margin-left: var(--support-space-1); }
.evidence-lead strong { color: var(--support-text-secondary); font-weight: 600; }
.evidence-message { margin: var(--support-space-2) 0 0; }
.evidence-empty { flex: 1; }

/* Rows: neutral, divided like the queue, icons like the timeline */
.evidence-list { margin: 0; padding: 0; list-style: none; }
.evidence-list.is-loading { opacity: .55; }
.evidence-row { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: var(--support-space-3); padding: var(--support-space-3) 0; border-bottom: 1px solid var(--support-border-subtle); }
.evidence-icon {
  display: grid; place-items: center; width: 28px; height: 28px;
  border: 1px solid var(--support-border); border-radius: 50%; background: var(--support-pane); color: var(--support-muted); font-size: 13px;
}
/* Tone only where it matters to a missing-item petition: items leaving the character, and deaths. */
.tone-loss .evidence-icon { border-color: var(--support-warning-line); color: var(--support-warning); }
.tone-death .evidence-icon { border-color: var(--support-danger-line); color: var(--support-danger); }
.evidence-body { min-width: 0; padding-top: 4px; }
.evidence-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px var(--support-space-2); line-height: 1.4; }
.evidence-heading strong { color: var(--support-text); font-size: var(--support-text-sm); font-weight: 600; }
.evidence-who { color: var(--support-muted); font-size: var(--support-text-xs); }
.evidence-who.is-alt { color: var(--support-text-secondary); }
.evidence-heading time { margin-left: auto; color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.evidence-detail { margin-top: 2px; color: var(--support-text-secondary); font-size: var(--support-text-sm); line-height: 1.5; overflow-wrap: anywhere; }

/* Petition filed: a quiet divider; the flag carries the accent */
.evidence-marker { display: flex; align-items: center; gap: var(--support-space-3); padding: var(--support-space-3) 0; border-bottom: 1px solid var(--support-border-subtle); }
.evidence-marker::before, .evidence-marker::after { content: ""; flex: 1; height: 1px; background: var(--support-border); }
.evidence-marker span { display: inline-flex; align-items: center; gap: 6px; color: var(--support-text-secondary); font-size: var(--support-text-xs); font-weight: 600; font-variant-numeric: tabular-nums; }
.evidence-marker i { color: var(--support-accent); }

/* Pager */
.evidence-pager { display: flex; align-items: center; justify-content: space-between; gap: var(--support-space-3); margin-top: var(--support-space-3); color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }

@media (min-width: 1900px) {
  .support-evidence { padding-right: var(--support-space-6); padding-left: var(--support-space-6); }
}
@media (max-width: 680px) {
  .support-evidence { padding: var(--support-space-3) var(--support-space-4) var(--support-space-4); }
  .evidence-filters i { display: none; }
}
</style>
