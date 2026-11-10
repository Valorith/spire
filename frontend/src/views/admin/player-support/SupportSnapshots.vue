<template>
  <b-modal ref="modal" visible scrollable centered size="lg" modal-class="support-modal" @hide="$emit('close')" @shown="focusFirst">
    <template #modal-title>Inventory snapshots <span class="support-modal-subject">· {{ record.character }}</span></template>
    <div class="snapshots">
      <p class="snapshots-lead">
        EQEmu saves inventory snapshots on a schedule and with <code>#invsnapshot</code>. Pick one from the last 30 days to see what
        {{ record.character }} had then but no longer has.
      </p>
      <support-load-state v-if="loading || (error && !snapshots.length)" :error="error" label="Loading snapshots" @retry="loadList" />
      <div v-else-if="!snapshots.length" class="support-empty snapshots-empty">
        <i class="fe fe-camera-off" aria-hidden="true"></i>
        <strong>No snapshots for {{ record.character }}</strong>
        <p>Turn on the <code>Character:ActiveInvSnapshots</code> rule, or take one in game with <code>#invsnapshot capture</code>.</p>
      </div>
      <div v-else class="snapshots-workspace">
        <div class="snapshots-list" role="group" aria-label="Snapshots">
          <button v-for="snapshot in snapshots" :key="snapshot.time_index" type="button" class="support-option" :aria-pressed="String(selected === snapshot.time_index)"
                  @click="choose(snapshot.time_index)">
            <strong>{{ formatDate(snapshot.time_index) }}</strong>
            <span>{{ relative(snapshot.time_index) }} · {{ snapshot.items }} items</span>
          </button>
        </div>
        <div class="snapshots-diff" aria-live="polite">
          <support-load-state v-if="diffLoading || error" :error="error" label="Comparing with the current inventory" :rows="2" @retry="choose(selected)" />
          <p v-else-if="!selected" class="snapshots-status">Choose a snapshot.</p>
          <div v-else-if="!missing.length && !accounted.length" class="support-empty snapshots-empty is-good">
            <i class="fe fe-check-circle" aria-hidden="true"></i>
            <strong>Nothing is missing</strong>
            <p>Everything in this snapshot is still in {{ record.character }}’s inventory or bank.</p>
          </div>
          <template v-else>
            <div v-if="!missing.length" class="support-empty snapshots-empty is-good is-short">
              <i class="fe fe-check-circle" aria-hidden="true"></i>
              <strong>Nothing is missing</strong>
              <p>Every item that left {{ record.character }}’s inventory is still on the account or was restored. See below.</p>
            </div>
            <template v-else>
              <div class="snapshots-diff-head">
                <span>{{ missing.length }} {{ missing.length === 1 ? 'item is' : 'items are' }} missing</span>
                <button type="button" class="support-link" @click="toggleAll">{{ allChosen ? 'Clear' : 'Select all' }}</button>
              </div>
              <ul class="snapshots-items">
                <li v-for="(line, index) in missing" :key="index" class="snapshots-line"
                    :class="{ 'is-chosen': chosen.includes(index), 'is-disabled': !chosen.includes(index) && !fits(index) }">
                  <label>
                    <input v-model="chosen" type="checkbox" class="support-check" :value="index" :disabled="!chosen.includes(index) && !fits(index)">
                    <span class="snapshots-item">
                      <strong :title="line.item.name">{{ line.item.name }}</strong>
                      <span v-if="augmentNames(line)" class="snapshots-augments">with {{ augmentNames(line) }}</span>
                      <span v-if="partly(line)" class="snapshots-augments">{{ partly(line) }}</span>
                    </span>
                    <span class="snapshots-count" :title="`Had ${line.had}, has ${line.has}`">× {{ line.missing }}
                      <small v-if="cost(line) > 1">{{ cost(line) }} parcels</small>
                    </span>
                  </label>
                  <button type="button" class="support-link snapshots-where" :aria-label="'Where is ' + line.item.name + '?'" @click="trace(line)">Where is it?</button>
                </li>
              </ul>
            </template>
            <div v-if="accounted.length" class="snapshots-accounted">
              <button type="button" class="snapshots-accounted-toggle" :aria-expanded="String(showAccounted)" aria-controls="snapshots-accounted-list"
                      @click="showAccounted = !showAccounted">
                <i :class="showAccounted ? 'fe fe-chevron-down' : 'fe fe-chevron-right'" aria-hidden="true"></i>
                Accounted for ({{ accounted.length }})
              </button>
              <ul v-show="showAccounted" id="snapshots-accounted-list" class="snapshots-items">
                <li v-for="(line, index) in accounted" :key="index" class="snapshots-line is-accounted">
                  <div class="snapshots-accounted-row">
                    <i class="fe fe-check" aria-hidden="true"></i>
                    <span class="snapshots-item">
                      <strong>{{ line.item.name }}</strong>
                      <span class="snapshots-augments">{{ whereaboutsText(line) }}</span>
                    </span>
                    <span class="snapshots-count">× {{ gone(line) }}</span>
                  </div>
                  <button type="button" class="support-link snapshots-where" :aria-label="'Where is ' + line.item.name + '?'" @click="trace(line)">Where is it?</button>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>
    </div>
    <template #modal-footer>
      <span v-if="!canRestore && missing.length && readOnly" class="support-footer-note"><i class="fe fe-lock" aria-hidden="true"></i>{{ readOnly }}</span>
      <span v-else-if="overflow" class="support-footer-note is-warning"><i class="fe fe-alert-triangle" aria-hidden="true"></i>Only the first 20 parcels fit in one batch. Restore the rest after sending.</span>
      <span v-else-if="parcels" class="support-footer-note">{{ parcels }} of 20 parcels in this batch</span>
      <span v-else-if="canRestore && missing.length" class="support-footer-note">Tick the items to restore.</span>
      <button type="button" class="support-button" @click="$emit('close')">Close</button>
      <button v-if="canRestore && missing.length" type="button" class="support-button is-primary" :disabled="!chosen.length" @click="restore">
        <i class="fe fe-package" aria-hidden="true"></i> Restore {{ Math.min(parcels, 20) || '' }} as parcels
      </button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { dialogFocus } from './support-dialog'
import SupportLoadState from './SupportLoadState.vue'

export default {
  name: 'SupportSnapshots',
  components: { SupportLoadState },
  mixins: [dialogFocus],
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    canRestore: { type: Boolean, default: false },
    // Why items cannot be restored from here (resolved case, no permission), or ''.
    readOnly: { type: String, default: '' }
  },
  data () {
    return { snapshots: [], selected: 0, missing: [], accounted: [], showAccounted: false, chosen: [], loading: true, diffLoading: false, error: '', version: 0 }
  },
  computed: {
    endpoint () { return `player-support/cases/${encodeURIComponent(this.record.key)}/snapshots` },
    allChosen () { return this.missing.length > 0 && this.chosen.length > 0 && this.missing.every((_, index) => this.chosen.includes(index) || !this.fits(index)) },
    // Parcels the chosen items need: one per copy of an item that does not
    // stack, or one per full stack.
    parcels () { return this.chosen.reduce((total, index) => total + this.cost(this.missing[index]), 0) },
    // One item can need more than a batch holds; only the first 20 go.
    overflow () { return this.parcels > 20 }
  },
  mounted () { this.loadList() },
  methods: {
    async loadList () {
      this.loading = true
      this.error = ''
      try {
        const { data } = await SpireApi.v1().get(this.endpoint, { params: { connection_id: this.connectionId } })
        this.snapshots = data.snapshots || []
        if (this.snapshots.length) this.choose(this.snapshots[0].time_index)
      } catch (error) {
        this.error = this.errorText(error)
      } finally {
        this.loading = false
      }
    },
    focusFirst () { if (this.snapshots.length) this.focusInDialog('.snapshots-list [aria-pressed="true"]') },
    errorText (error) { return (error.response && error.response.data && error.response.data.error) || 'Snapshots could not be loaded.' },
    async choose (time) {
      const version = ++this.version
      this.selected = time
      this.diffLoading = true
      this.error = ''
      this.chosen = []
      try {
        const { data } = await SpireApi.v1().get(`${this.endpoint}/${time}`, { params: { connection_id: this.connectionId } })
        if (version !== this.version) return
        // Lines whose items are all elsewhere on the account, or already
        // restored, are listed apart and cannot be restored again from here.
        const lines = data.missing || []
        this.missing = lines.filter(line => !line.accounted && line.missing > 0)
        this.accounted = lines.filter(line => line.accounted || !(line.missing > 0))
        this.showAccounted = false
        this.focusFirst()
      } catch (error) {
        if (version !== this.version) return
        this.missing = []
        this.accounted = []
        this.error = this.errorText(error)
      } finally {
        if (version === this.version) this.diffLoading = false
      }
    },
    cost (line) {
      if (!line.item.stackable) return line.missing
      return Math.ceil(line.missing / Math.max(1, line.item.stack_size || line.missing))
    },
    // A pick fits while the batch stays within 20 parcels. An item that needs
    // more than 20 on its own can be picked alone.
    fits (index) {
      const cost = this.cost(this.missing[index])
      if (!this.chosen.length) return true
      return this.parcels + cost <= 20
    },
    toggleAll () {
      if (this.allChosen) {
        this.chosen = []
        return
      }
      const chosen = []
      let total = 0
      this.missing.forEach((line, index) => {
        const cost = this.cost(line)
        if (total + cost <= 20) {
          chosen.push(index)
          total += cost
        }
      })
      this.chosen = chosen.length ? chosen : [0]
    },
    // A missing element of "elsewhere" counts as zero (older servers send none).
    elsewhere (line) {
      const found = line.elsewhere || {}
      return ['corpse', 'parcel', 'shared_bank', 'alt', 'restored'].map(place => [place, Number(found[place]) || 0]).filter(([, count]) => count > 0)
    },
    whereabouts (line) {
      const names = {
        corpse: 'on a corpse',
        parcel: 'in a parcel',
        shared_bank: 'in the shared bank',
        alt: line.elsewhere && line.elsewhere.alt_name ? 'on ' + line.elsewhere.alt_name : 'on another character',
        restored: line.elsewhere && line.elsewhere.restored_at ? 'restored on ' + this.formatDay(line.elsewhere.restored_at) : 'restored since the snapshot'
      }
      return this.elsewhere(line).map(([place]) => names[place])
    },
    whereaboutsText (line) {
      const places = this.whereabouts(line)
      if (!places.length) return 'Accounted for on the account'
      const text = places.length > 1 ? places.slice(0, -1).join(', ') + ' and ' + places[places.length - 1] : places[0]
      return text.charAt(0).toUpperCase() + text.slice(1)
    },
    // A line partly found elsewhere still says where the rest is.
    partly (line) {
      return this.elsewhere(line).length ? 'Partly accounted for: ' + this.whereabouts(line).join(', ') : ''
    },
    gone (line) { return Math.max(1, (Number(line.had) || 0) - (Number(line.has) || 0)) },
    trace (line) {
      const augments = Array.from({ length: 6 }, (_, index) => {
        const augment = (line.augments || [])[index]
        return augment ? Number(augment.id) || 0 : 0
      })
      this.$emit('trace', { item_id: line.item.id, quantity: line.missing > 0 ? line.missing : this.gone(line), augments, label: 'missing since ' + this.formatDate(this.selected) })
    },
    formatDay (value) {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
    },
    augmentNames (line) { return (line.augments || []).filter(Boolean).map(item => item.name).join(', ') },
    restore () {
      // A stack larger than the item's stack size is split across parcels.
      const lines = []
      for (const line of this.chosen.map(index => this.missing[index])) {
        const augments = line.augments || Array(6).fill(null)
        if (!line.item.stackable) {
          lines.push({ item: line.item, augments, quantity: 1, copies: line.missing })
          continue
        }
        const stack = Math.max(1, line.item.stack_size || line.missing)
        for (let left = line.missing; left > 0; left -= stack) {
          lines.push({ item: line.item, augments, quantity: Math.min(stack, left), copies: 1 })
        }
      }
      this.$emit('restore', { lines, snapshot: this.formatDate(this.selected) })
    },
    formatDate (time) {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(time * 1000))
    },
    relative (time) {
      const hours = Math.max(0, Math.round((Date.now() / 1000 - time) / 3600))
      if (hours < 1) return 'within the hour'
      return hours < 48 ? `${hours} hours ago` : `${Math.round(hours / 24)} days ago`
    }
  }
}
</script>

<style scoped>
/* Layout only. Colours, type, radius and spacing come from support-theme.css. */
.snapshots-lead { margin: 0 0 var(--support-space-4); color: var(--support-muted); font-size: var(--support-text-sm); line-height: 1.5; }
.snapshots-status { margin: 0; padding: var(--support-space-2) 0; color: var(--support-muted); font-size: var(--support-text-sm); }
.snapshots-empty.is-good > i { color: var(--support-success); }
.snapshots-empty.is-short { padding: var(--support-space-4); }
.snapshots-workspace { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: var(--support-space-4); min-height: 260px; }
.snapshots-list { display: grid; align-content: start; gap: var(--support-space-1); max-height: 380px; overflow-y: auto; }
.snapshots-list .support-option strong { font-weight: 600; font-variant-numeric: tabular-nums; }
.snapshots-list .support-option span { color: var(--support-muted); font-size: var(--support-text-xs); }
.snapshots-diff { min-width: 0; }
.snapshots-diff-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--support-space-3);
  margin-bottom: var(--support-space-2);
  color: var(--support-text);
  font-size: var(--support-text-sm);
  font-weight: 600;
}
.snapshots-diff-head .support-link { font-size: var(--support-text-sm); }
.snapshots-items { display: grid; gap: var(--support-space-1); max-height: 340px; margin: 0; padding: 0; overflow-y: auto; list-style: none; }
/* One row per line: the selectable label, then "Where is it?" outside it. */
.snapshots-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  border: 1px solid var(--support-border);
  border-radius: var(--support-radius);
  background: var(--support-raised);
  transition: var(--support-transition);
}
.snapshots-line:hover { border-color: var(--support-border-strong); background: var(--support-hover); }
.snapshots-line.is-chosen { border-color: var(--support-accent-line); background: var(--support-selected); }
.snapshots-line.is-disabled:hover,
.snapshots-line.is-accounted:hover { border-color: var(--support-border); background: var(--support-raised); }
.snapshots-items label,
.snapshots-accounted-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--support-space-3);
  min-width: 0;
  margin: 0;
  padding: var(--support-space-2) var(--support-space-3);
  color: var(--support-text);
  font-weight: 400;
  cursor: pointer;
}
.snapshots-accounted-row { cursor: default; }
.snapshots-accounted-row > i { width: 15px; color: var(--support-success); text-align: center; }
.snapshots-line.is-disabled label { cursor: not-allowed; }
.snapshots-line.is-disabled .snapshots-item strong { color: var(--support-muted); }
.snapshots-items .snapshots-where { padding: var(--support-space-2) var(--support-space-3) var(--support-space-2) 0; font-size: var(--support-text-xs); white-space: nowrap; }
.snapshots-accounted { margin-top: var(--support-space-4); }
.snapshots-accounted-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--support-space-2);
  padding: 0;
  border: 0;
  background: none;
  color: var(--support-text-secondary);
  font-size: var(--support-text-sm);
  font-weight: 600;
}
.snapshots-accounted-toggle:hover { color: var(--support-text); }
.snapshots-accounted-toggle i { color: var(--support-muted); }
.snapshots-line.is-accounted .snapshots-item strong { color: var(--support-text-secondary); }
.snapshots-item { display: grid; gap: 2px; min-width: 0; line-height: 1.35; }
.snapshots-item strong { overflow: hidden; color: var(--support-text); font-size: var(--support-text-sm); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.snapshots-items .snapshots-augments { color: var(--support-muted); font-size: var(--support-text-xs); }
.snapshots-items .snapshots-count { color: var(--support-text-secondary); font-size: var(--support-text-sm); font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.snapshots-count small { display: block; color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 400; }
@media (max-width: 600px) {
  .snapshots-workspace { grid-template-columns: minmax(0, 1fr); }
  .snapshots-line { grid-template-columns: minmax(0, 1fr); }
  .snapshots-items .snapshots-where { justify-self: start; padding: 0 var(--support-space-3) var(--support-space-2) 42px; }
  .snapshots-list { max-height: 160px; }
}
@media (max-width: 680px), (pointer: coarse) {
  .snapshots-accounted-toggle { min-height: var(--support-touch); }
}
</style>
