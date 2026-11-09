<template>
  <section class="support-evidence" aria-label="Evidence">
    <header class="evidence-bar">
      <div class="evidence-filters" role="group" aria-label="Event type">
        <button v-for="option in groups" :key="option.id" type="button" :aria-pressed="String(group === option.id)" @click="setGroup(option.id)">
          <i :class="option.icon" aria-hidden="true"></i> {{ option.label }}
        </button>
      </div>
      <label class="evidence-window">
        <span class="sr-only">Time window</span>
        <select v-model.number="hours" aria-label="Time window" @change="load(1)">
          <option v-for="option in windows" :key="option.hours" :value="option.hours">{{ option.label }}</option>
        </select>
      </label>
    </header>
    <p class="evidence-lead">
      Player events from every character on <strong>{{ record.account }}</strong>’s account, from {{ windowLabel }} before the petition to now.
      <span v-if="total" class="evidence-total">{{ total.toLocaleString() }} {{ total === 1 ? 'event' : 'events' }}</span>
    </p>

    <p v-if="error" class="evidence-message is-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ error }}</p>
    <p v-else-if="loading && !events.length" class="evidence-message" role="status"><i class="fe fe-loader is-spinning" aria-hidden="true"></i> Loading events…</p>
    <div v-else-if="!events.length" class="evidence-empty">
      <span class="evidence-empty-mark"><i class="fe fe-search" aria-hidden="true"></i></span>
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
      <button type="button" :disabled="loading || page <= 1" @click="load(page - 1)"><i class="fe fe-chevron-left" aria-hidden="true"></i> Newer</button>
      <span>Page {{ page }} of {{ pages }} · {{ firstShown }}–{{ lastShown }} of {{ total.toLocaleString() }}</span>
      <button type="button" :disabled="loading || page >= pages" @click="load(page + 1)">Older <i class="fe fe-chevron-right" aria-hidden="true"></i></button>
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
  'Parcel Item Retrieved': ['fe fe-package', 'item'], 'NPC Handin': ['fe fe-gift', 'loss'], Death: ['fe fe-x-octagon', 'death'],
  'Rez Accepted': ['fe fe-heart', 'death'], Zoning: ['fe fe-map', 'move'], 'GM Command': ['fe fe-terminal', 'gm'],
  'Possible Hack': ['fe fe-alert-triangle', 'loss']
}

export default {
  name: 'SupportEvidence',
  components: { PlayerEventDisplayComponent },
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true }
  },
  data () {
    return {
      itemNames: {}, group: 'items', hours: 24, events: [], filedAt: 0, page: 1, pageSize: 50, total: 0, loading: false, error: '', version: 0,
      groups: [
        { id: 'items', label: 'Items', icon: 'fe fe-package' },
        { id: 'deaths', label: 'Deaths', icon: 'fe fe-x-octagon' },
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
    // Events are newest first; the filing marker sits where the petition falls.
    rows () {
      const rows = []
      let placed = false
      for (const item of this.events) {
        if (!placed && new Date(item.created_at).getTime() < this.filedAt * 1000) {
          rows.push({ marker: true, key: 'marker' })
          placed = true
        }
        rows.push({ ...item, key: item.id })
      }
      // Every event on the last page is newer than the petition.
      if (!placed && this.events.length && this.page >= this.pages) rows.push({ marker: true, key: 'marker' })
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
.support-evidence { display: flex; flex-direction: column; min-height: 0; flex: 1; padding: 12px 23px 16px; overflow-y: auto; }
.evidence-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; }
.evidence-filters { display: flex; flex-wrap: wrap; gap: 5px; }
.evidence-filters button, .evidence-window select {
  display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; font-size: .76rem;
  color: var(--support-muted); background: var(--support-raised); border: 1px solid var(--support-border);
}
.evidence-filters button[aria-pressed="true"] { color: #1f1910; background: var(--support-accent); border-color: var(--support-accent); font-weight: 650; }
.evidence-filters button:hover:not([aria-pressed="true"]) { color: var(--support-text); border-color: var(--support-border-strong); }
.evidence-window select { padding-right: 26px; }
.evidence-lead { margin: 10px 0 12px; color: var(--support-muted); font-size: .78rem; }
.evidence-lead strong { color: var(--support-text); font-weight: 600; }
.evidence-message { display: flex; gap: 8px; align-items: center; color: var(--support-muted); font-size: .82rem; }
.evidence-message.is-error { color: #ffadbd; }
.evidence-empty { display: grid; justify-items: center; gap: 6px; margin: 40px auto; max-width: 340px; text-align: center; color: var(--support-muted); font-size: .8rem; }
.evidence-empty strong { color: var(--support-text); font-size: .9rem; }
.evidence-empty p { margin: 0; }
.evidence-empty-mark { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; color: var(--support-accent); background: var(--support-accent-soft); }
.evidence-list { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.evidence-row {
  --tone: #8fa1b5;
  display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 10px; padding: 9px 12px;
  border: 1px solid var(--support-border); border-left: 3px solid var(--tone); border-radius: 9px; background: var(--support-raised);
}
.evidence-row.tone-item { --tone: #7fb6e8; }
.evidence-row.tone-loss { --tone: #f0a35e; }
.evidence-row.tone-death { --tone: #ef7f8f; }
.evidence-row.tone-move { --tone: #62d2d8; }
.evidence-row.tone-gm { --tone: #c6a0f0; }
.evidence-icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; color: var(--tone); background: color-mix(in srgb, var(--tone) 15%, transparent); }
.evidence-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; font-size: .8rem; }
.evidence-heading strong { color: var(--support-text); font-weight: 650; }
.evidence-who { color: var(--support-muted); }
.evidence-who.is-alt { color: #c6a0f0; }
.evidence-heading time { margin-left: auto; color: var(--support-muted); font-size: .72rem; font-variant-numeric: tabular-nums; }
.evidence-detail { margin-top: 3px; color: #d5e0ea; font-size: .78rem; overflow-wrap: anywhere; }
.evidence-marker { display: flex; align-items: center; gap: 10px; margin: 6px 0; color: var(--support-accent); font-size: .74rem; font-weight: 650; }
.evidence-marker::before, .evidence-marker::after { content: ""; flex: 1; height: 1px; background: color-mix(in srgb, var(--support-accent) 45%, transparent); }
.evidence-total { margin-left: 6px; padding: 1px 8px; border-radius: 999px; background: #263443; color: var(--support-text); font-size: .7rem; font-weight: 650; }
.evidence-list.is-loading { opacity: .55; transition: opacity 120ms ease; }
.evidence-pager { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; color: var(--support-muted); font-size: .74rem; font-variant-numeric: tabular-nums; }
.evidence-pager button {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 11px; border-radius: 8px; font-size: .76rem;
  color: var(--support-text); background: var(--support-raised); border: 1px solid var(--support-border);
}
.evidence-pager button:hover:not(:disabled) { border-color: var(--support-accent); }
.evidence-pager button:disabled { opacity: .4; }
.is-spinning { animation: evidence-spin 1s linear infinite; }
@keyframes evidence-spin { to { transform: rotate(360deg); } }
@media (max-width: 680px) { .support-evidence { padding: 10px 12px 14px; } }
@media (prefers-reduced-motion: reduce) { .is-spinning { animation: none; } }
</style>
