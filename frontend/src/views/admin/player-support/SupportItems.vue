<template>
  <b-modal visible scrollable centered size="lg" modal-class="support-modal support-items-modal" :title="'Items · ' + record.character" @hide="$emit('close')">
    <div class="support-tabs tool-tabs" role="group" aria-label="Item tools">
      <button type="button" :aria-pressed="String(tab === 'find')" @click="setTab('find')">
        <i class="fe fe-search" aria-hidden="true"></i> Find an item
      </button>
      <button type="button" :aria-pressed="String(tab === 'history')" @click="setTab('history')">
        <i class="fe fe-clock" aria-hidden="true"></i> Restore history
      </button>
    </div>

    <div v-if="tab === 'find'" class="tool-body">
      <template v-if="!wanted">
        <p class="support-modal-lead">Find where an item is on {{ record.account }}’s characters, whether staff returned it before, and the recent events that moved it.</p>
        <div class="items-choose">
          <button type="button" class="support-button is-primary" @click="openLookup"><i class="fe fe-search" aria-hidden="true"></i> Choose an item</button>
        </div>
      </template>
      <template v-else>
        <div class="items-subject">
          <span class="items-icon" aria-hidden="true">
            <i v-if="trace && trace.item && trace.item.icon" :class="'item-' + trace.item.icon + '-sm'"></i>
            <i v-else class="fe fe-package"></i>
          </span>
          <div class="items-subject-text">
            <strong>{{ itemName }}</strong>
            <span>#{{ wanted.item_id }}<template v-if="wanted.label"> · {{ wanted.label }}</template></span>
          </div>
          <button type="button" class="support-button is-sm" :disabled="confirming" @click="openLookup">Change item</button>
        </div>

        <p v-if="error" class="support-callout is-danger" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>
        <p v-else-if="loading" class="support-feedback" role="status"><i class="fe fe-loader support-spin" aria-hidden="true"></i> Looking for {{ itemName }}…</p>
        <template v-else-if="trace">
          <section class="tool-section" aria-labelledby="items-where">
            <h3 id="items-where" class="support-section-label">Where it is now <span v-if="locations.length" class="support-count">{{ locations.length }}</span></h3>
            <div v-if="!locations.length" class="support-empty is-compact">
              <i class="fe fe-search" aria-hidden="true"></i><span>Not found in inventory, bank, corpses or parcels on this account.</span>
            </div>
            <div v-else class="tool-table-wrap">
              <table class="support-table">
                <thead><tr><th scope="col">Place</th><th scope="col">Character</th><th scope="col">Detail</th><th scope="col" class="is-number">Count</th></tr></thead>
                <tbody>
                  <tr v-for="(location, index) in locations" :key="index">
                    <th scope="row">{{ placeLabel(location) }}</th>
                    <td data-label="Character">{{ location.character || '—' }}</td>
                    <td data-label="Detail">{{ placeDetail(location) }}</td>
                    <td data-label="Count" class="is-number">{{ location.count }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="tool-section" aria-labelledby="items-restored">
            <h3 id="items-restored" class="support-section-label">Restored before <span v-if="restores.length" class="support-count">{{ restores.length }}</span></h3>
            <p v-if="!restores.length" class="tool-quiet">Staff have not sent this item to the account.</p>
            <ul v-else class="items-restores">
              <li v-for="(restore, index) in restores" :key="index">
                <i class="fe fe-package" aria-hidden="true"></i>
                <span><strong>× {{ restore.quantity }} to {{ restore.character }}</strong> · {{ formatDate(restore.sent_at) }} · by {{ restore.actor || 'staff' }}</span>
                <span class="items-restore-source">{{ restore.source }}<template v-if="restore.case_key"> · case #{{ restore.case_key.split('-')[0] }}</template></span>
              </li>
            </ul>
          </section>

          <section class="tool-section" aria-labelledby="items-events">
            <h3 id="items-events" class="support-section-label">Recent item events <span v-if="events.length" class="support-count">{{ events.length }}</span></h3>
            <p v-if="!events.length" class="tool-quiet">No events with this item in the last 30 days.</p>
            <ol v-else class="items-events">
              <li v-for="event in events" :key="event.id" class="items-event" :class="'tone-' + tone(event.event_type_name)">
                <span class="items-event-icon"><i :class="icon(event.event_type_name)" aria-hidden="true"></i></span>
                <div class="items-event-body">
                  <div class="items-event-heading">
                    <strong>{{ event.event_type_name }}</strong>
                    <span>{{ event.character || 'Unknown character' }}</span>
                    <time :datetime="event.created_at">{{ formatDate(event.created_at) }}</time>
                  </div>
                  <div class="items-event-detail">{{ summary(event) || 'No details recorded' }}</div>
                </div>
              </li>
            </ol>
          </section>

          <div v-if="confirming" class="support-callout is-warning items-confirm" role="alert">
            <i class="fe fe-alert-triangle" aria-hidden="true"></i><span>{{ confirmText }}</span>
          </div>
        </template>
      </template>
    </div>

    <div v-else class="tool-body">
      <p class="support-modal-lead">Items staff sent to any character on {{ record.account }} in the last 90 days.</p>
      <p v-if="historyError" class="support-callout is-danger tool-gap" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ historyError }}</span></p>
      <p v-else-if="historyLoading" class="support-feedback" role="status"><i class="fe fe-loader support-spin" aria-hidden="true"></i> Loading restore history…</p>
      <div v-else-if="!history.length" class="support-empty is-compact tool-gap">
        <i class="fe fe-package" aria-hidden="true"></i><span>No items were sent to this account by staff in the last 90 days.</span>
      </div>
      <div v-else class="tool-table-wrap tool-gap">
        <table class="support-table">
          <thead><tr><th scope="col">Date</th><th scope="col">Character</th><th scope="col">Items</th><th scope="col">By</th><th scope="col">Source</th></tr></thead>
          <tbody>
            <tr v-for="(restore, index) in history" :key="index">
              <td data-label="Date" class="is-nowrap">{{ formatDate(restore.sent_at) }}</td>
              <th scope="row" data-label="Character">{{ restore.character }}</th>
              <td data-label="Items">{{ restoreItems(restore) }}</td>
              <td data-label="By">{{ restore.actor || '—' }}</td>
              <td data-label="Source">{{ restore.source }}<template v-if="restore.case_key"> · #{{ restore.case_key.split('-')[0] }}</template></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <mail-parcels-item-lookup ref="lookup" modal-class="support-modal support-parcel-modal" @selected="pick" />

    <template #modal-footer>
      <span v-if="tab === 'find' && trace && !canRestore" class="support-footer-note">Returning items needs Mail &amp; Parcels write access.</span>
      <template v-if="confirming">
        <button type="button" class="support-button" @click="confirming = false">Cancel</button>
        <button type="button" class="support-button is-primary" :disabled="preparing" @click="restore">
          <i class="fe fe-package" aria-hidden="true"></i> {{ preparing ? 'Preparing…' : 'Return anyway' }}
        </button>
      </template>
      <template v-else>
        <button type="button" class="support-button" @click="$emit('close')">Close</button>
        <button v-if="tab === 'find' && canRestore && trace" type="button" class="support-button is-primary" :disabled="loading || preparing" @click="requestRestore">
          <i class="fe fe-package" aria-hidden="true"></i> {{ preparing ? 'Preparing…' : 'Return by parcel' }}
        </button>
      </template>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { Items } from '@/app/items'
import MailParcelsItemLookup from '../mail-parcels/MailParcelsItemLookup.vue'

const places = { inventory: 'Inventory', alt: 'Another character', shared_bank: 'Shared bank', corpse: 'Corpse', parcel: 'Parcel' }
const styles = {
  Trade: ['fe fe-repeat', 'item'],
  'Loot Item': ['fe fe-download', 'item'],
  'Item Destroy': ['fe fe-trash-2', 'loss'],
  'Dropped Item': ['fe fe-arrow-down-circle', 'loss'],
  'Merchant Sell': ['fe fe-dollar-sign', 'loss'],
  'Merchant Purchase': ['fe fe-shopping-cart', 'item'],
  'Parcel Item Sent': ['fe fe-package', 'item'],
  'Parcel Item Retrieved': ['fe fe-package', 'item'],
  'NPC Handin': ['fe fe-gift', 'loss']
}

export default {
  name: 'SupportItems',
  components: { MailParcelsItemLookup },
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    canRestore: { type: Boolean, default: false },
    // { item_id, quantity, augments: [6], label, copies } from an Evidence row
    // or a snapshot line, or null to start with a search. `quantity` is the
    // stack count of an item that stacks. For one that does not, it is the
    // number of copies (a snapshot line), unless `copies` says otherwise: an
    // Evidence row is one item, and its count there is the item's charges.
    initialItem: { type: Object, default: null }
  },
  data () {
    return {
      tab: 'find',
      wanted: this.initialItem ? { ...this.initialItem } : null,
      trace: null,
      loading: false,
      error: '',
      version: 0,
      history: [],
      historyLoaded: false,
      historyLoading: false,
      historyError: '',
      confirming: false,
      preparing: false
    }
  },
  computed: {
    endpoint () { return `player-support/cases/${encodeURIComponent(this.record.key)}` },
    params () { return { connection_id: this.connectionId } },
    itemName () { return (this.trace && this.trace.item && this.trace.item.name) || (this.wanted ? `Item ${this.wanted.item_id}` : '') },
    locations () { return (this.trace && this.trace.locations) || [] },
    restores () { return (this.trace && this.trace.restores) || [] },
    events () { return (this.trace && this.trace.events) || [] },
    // "<Item> is still in Thornalt's inventory and on corpse #42 / was restored on <date>. Return it anyway?"
    confirmText () {
      const where = this.locations.slice(0, 3).map(location => this.placePhrase(location))
      if (this.locations.length > 3) where.push(`${this.locations.length - 3} more ${this.locations.length - 3 === 1 ? 'place' : 'places'}`)
      const parts = []
      if (where.length) parts.push('is still ' + this.joinList(where))
      if (this.restores.length) parts.push('was restored on ' + this.formatDay(this.restores[0].sent_at))
      return `${this.itemName} ${parts.join(' and ')}. Return it anyway?`
    }
  },
  mounted () {
    if (this.wanted) this.load()
  },
  methods: {
    errorText (error, fallback) { return (error.response && error.response.data && error.response.data.error) || fallback },
    setTab (tab) {
      this.tab = tab
      this.confirming = false
      if (tab === 'history' && !this.historyLoaded) this.loadHistory()
    },
    openLookup () { this.$refs.lookup.open(false, 0) },
    pick (item) {
      if (!item) return
      this.wanted = { item_id: item.id, quantity: 1, augments: [0, 0, 0, 0, 0, 0], label: '' }
      this.load()
    },
    async load () {
      const version = ++this.version
      this.loading = true
      this.error = ''
      this.trace = null
      this.confirming = false
      try {
        const { data } = await SpireApi.v1().get(`${this.endpoint}/items`, { params: { ...this.params, item_id: this.wanted.item_id } })
        if (version === this.version) this.trace = data
      } catch (error) {
        if (version === this.version) this.error = this.errorText(error, 'The item could not be traced.')
      } finally {
        if (version === this.version) this.loading = false
      }
    },
    async loadHistory () {
      this.historyLoading = true
      this.historyError = ''
      try {
        const { data } = await SpireApi.v1().get(`${this.endpoint}/restores`, { params: this.params })
        this.history = data.restores || []
        this.historyLoaded = true
      } catch (error) {
        this.historyError = this.errorText(error, 'Restore history could not be loaded.')
      } finally {
        this.historyLoading = false
      }
    },
    placeLabel (location) { return places[location.place] || location.place },
    inBank (slot) { return slot >= 2000 && slot <= 2270 },
    slotLabel (slot) {
      if (slot == null) return ''
      if (slot <= 22) return 'Equipped'
      if (slot <= 32) return 'Inventory'
      if (slot === 33) return 'Cursor'
      if (slot >= 251 && slot <= 350) return 'In a bag'
      if (slot >= 2000 && slot <= 2023) return 'Bank'
      if (slot >= 2031 && slot <= 2270) return 'In a bank bag'
      if (slot >= 2500 && slot <= 2501) return 'Shared bank'
      if (slot >= 2531 && slot <= 2550) return 'In a shared bank bag'
      return 'Slot'
    },
    placeDetail (location) {
      const augments = (location.augments || []).filter(Boolean).length
      const extra = augments ? ` · ${augments} ${augments === 1 ? 'augment' : 'augments'}` : ''
      if (location.place === 'corpse') return `Corpse #${location.corpse_id}${location.zone_name ? ' · ' + location.zone_name : ''}${extra}`
      if (location.place === 'parcel') return `Parcel #${location.parcel_id}${location.from ? ' from ' + location.from : ''}${location.sent_at ? ' · ' + this.formatDay(location.sent_at) : ''}${extra}`
      return `${this.slotLabel(location.slot)} (slot ${location.slot})${extra}`
    },
    placePhrase (location) {
      if (location.place === 'corpse') return `on corpse #${location.corpse_id}`
      if (location.place === 'parcel') return `in a parcel for ${location.character}`
      if (location.place === 'shared_bank') return 'in the shared bank'
      return `in ${location.character}’s ${this.inBank(location.slot) ? 'bank' : 'inventory'}`
    },
    joinList (parts) { return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0] },
    restoreItems (restore) {
      return (restore.items || []).map(item => `${item.item_name || 'Item ' + item.item_id} × ${item.quantity}`).join(', ') || '—'
    },
    icon (name) { return (styles[name] || ['fe fe-activity'])[0] },
    tone (name) { return (styles[name] || [null, 'other'])[1] },
    summary (event) {
      let data
      try {
        data = JSON.parse(event.event_data || '{}')
      } catch (e) {
        return ''
      }
      const parts = []
      const count = data.quantity || data.charges
      if (count > 1) parts.push(`× ${count}`)
      if (data.to_player_name) parts.push(`to ${data.to_player_name}`)
      if (data.from_player_name) parts.push(`from ${data.from_player_name}`)
      if (data.npc_name) parts.push(`NPC ${data.npc_name}`)
      // A trade names both sides; show the other one.
      const other = [data.character_1_name, data.character_2_name].find(name => name && name !== event.character)
      if (other) parts.push(`with ${other}`)
      if (data.reason) parts.push(String(data.reason))
      return parts.join(' · ')
    },
    requestRestore () {
      if (this.locations.length || this.restores.length) {
        this.confirming = true
        return
      }
      this.restore()
    },
    // One line per parcel, as SupportSnapshots.restore: copies of an item that
    // does not stack, or full stacks of one that does. The composer and the
    // parcel endpoint take no charges, so a charged item's charges are not
    // carried over.
    async restore () {
      if (this.preparing || !this.trace || !this.trace.item) return
      this.preparing = true
      try {
        const item = this.trace.item
        const augments = await Promise.all(Array.from({ length: 6 }, async (_, index) => {
          const id = Number((this.wanted.augments || [])[index]) || 0
          if (!id) return null
          const found = await Items.getItem(id).catch(() => null)
          return { ...(found || {}), id, name: (found && found.name) || `Item ${id}` }
        }))
        const quantity = Math.max(1, Number(this.wanted.quantity) || 1)
        const lines = []
        if (!Number(item.stackable)) {
          const copies = this.wanted.copies == null ? quantity : Math.max(1, Number(this.wanted.copies) || 1)
          lines.push({ item, augments, quantity: 1, copies })
        } else {
          const stack = Math.max(1, Number(item.stack_size) || quantity)
          for (let left = quantity; left > 0; left -= stack) lines.push({ item, augments, quantity: Math.min(stack, left), copies: 1 })
        }
        this.$emit('restore', {
          lines,
          reason: `Returned ${item.name} (${this.wanted.label || 'traced item'}) for case #${this.record.key.split('-')[0]}`,
          note: 'Returned by staff in response to your petition.'
        })
      } finally {
        this.preparing = false
      }
    },
    formatDate (value) {
      return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Unknown time'
    },
    formatDay (value) {
      return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'an unknown date'
    }
  }
}
</script>

<style>
/* Tool dialogs: the tab bar runs edge to edge under the header, as in Recovery. */
.support-modal.support-items-modal .modal-body { padding: 0; }
</style>

<style scoped>
/* Layout only. Colours, type, radius and spacing come from support-theme.css. */
.tool-tabs { padding: 0 var(--support-space-5); border-bottom: 1px solid var(--support-border); }
.tool-body { display: grid; gap: var(--support-space-4); padding: var(--support-space-4) var(--support-space-5) var(--support-space-5); }
.tool-section { display: grid; gap: var(--support-space-2); min-width: 0; }
.tool-section .support-section-label { margin: 0; }
.tool-section .support-count { letter-spacing: 0; }
.tool-quiet { margin: 0; color: var(--support-muted); font-size: var(--support-text-sm); }
.tool-table-wrap { min-width: 0; overflow-x: auto; }
.tool-table-wrap .support-table { min-width: 460px; }
.support-table .is-number { text-align: right; }
.support-table .is-nowrap { white-space: nowrap; }
.tool-body > .support-feedback { margin: 0; }

.items-choose { display: flex; }
.items-subject {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--support-space-3);
  padding: var(--support-space-3);
  border: 1px solid var(--support-border);
  border-radius: var(--support-radius-lg);
  background: var(--support-pane);
}
.items-icon { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid var(--support-border); border-radius: var(--support-radius); background: var(--support-sunken); color: var(--support-faint); }
.items-subject-text { display: grid; gap: 2px; min-width: 0; }
.items-subject-text strong { color: var(--support-text); font-size: var(--support-text-lg); font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
.items-subject-text span { color: var(--support-muted); font-size: var(--support-text-xs); }

.items-restores { display: grid; gap: var(--support-space-1); margin: 0; padding: 0; list-style: none; }
.items-restores li { display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; align-items: baseline; gap: var(--support-space-2); color: var(--support-text-secondary); font-size: var(--support-text-sm); }
.items-restores li > i { color: var(--support-muted); }
.items-restores strong { color: var(--support-text); font-weight: 600; }
.items-restore-source { color: var(--support-muted); font-size: var(--support-text-xs); text-align: right; }

/* The Evidence row look */
.items-events { margin: 0; padding: 0; list-style: none; }
.items-event { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: var(--support-space-3); padding: var(--support-space-2) 0; border-bottom: 1px solid var(--support-border-subtle); }
.items-event-icon { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid var(--support-border); border-radius: 50%; background: var(--support-pane); color: var(--support-muted); font-size: 13px; }
.tone-loss .items-event-icon { border-color: var(--support-warning-line); color: var(--support-warning); }
.items-event-body { min-width: 0; padding-top: 4px; }
.items-event-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px var(--support-space-2); line-height: 1.4; }
.items-event-heading strong { color: var(--support-text); font-size: var(--support-text-sm); font-weight: 600; }
.items-event-heading span { color: var(--support-muted); font-size: var(--support-text-xs); }
.items-event-heading time { margin-left: auto; color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.items-event-detail { margin-top: 2px; color: var(--support-text-secondary); font-size: var(--support-text-sm); overflow-wrap: anywhere; }

/* Phones: each row becomes a small card of label and value instead of a wide table. */
@media (max-width: 600px) {
  .tool-table-wrap .support-table { min-width: 0; }
  .tool-table-wrap .support-table thead { display: none; }
  .tool-table-wrap .support-table tr { display: grid; gap: 2px; padding: var(--support-space-2) 0; border-bottom: 1px solid var(--support-border-subtle); }
  .tool-table-wrap .support-table th,
  .tool-table-wrap .support-table td { display: flex; justify-content: space-between; gap: var(--support-space-3); padding: 0; border: 0; text-align: right; white-space: normal; }
  .tool-table-wrap .support-table [data-label]::before { content: attr(data-label); flex: none; color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 400; text-align: left; }
  .tool-table-wrap .support-table td:not([data-label]) { justify-content: flex-end; }
}
@media (max-width: 600px) {
  .tool-tabs { padding: 0 var(--support-space-4); }
  .tool-body { padding: var(--support-space-3) var(--support-space-4) var(--support-space-4); }
  .items-subject { grid-template-columns: 40px minmax(0, 1fr); }
  .items-subject > .support-button { grid-column: 1 / -1; justify-self: start; }
  .items-restores li { grid-template-columns: 16px minmax(0, 1fr); }
  .items-restore-source { grid-column: 2; text-align: left; }
}
</style>
