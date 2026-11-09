<template>
  <b-modal visible scrollable centered size="lg" modal-class="support-modal" :title="record.character + ' · Inventory snapshots'" @hide="$emit('close')">
    <div class="snapshots">
      <p class="snapshots-lead">
        EQEmu saves inventory snapshots on a schedule and with <code>#invsnapshot</code>. Pick one from the last 30 days to see what
        {{ record.character }} had then but no longer has.
      </p>
      <p v-if="error" class="snapshots-message is-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ error }}</p>
      <p v-else-if="loading" class="snapshots-message" role="status">Loading snapshots…</p>
      <div v-else-if="!snapshots.length" class="snapshots-empty">
        <span class="snapshots-mark"><i class="fe fe-camera-off" aria-hidden="true"></i></span>
        <strong>No snapshots for {{ record.character }}</strong>
        <p>Turn on the <code>Character:ActiveInvSnapshots</code> rule, or take one in game with <code>#invsnapshot capture</code>.</p>
      </div>
      <div v-else class="snapshots-workspace">
        <div class="snapshots-list" role="group" aria-label="Snapshots">
          <button v-for="snapshot in snapshots" :key="snapshot.time_index" type="button" :aria-pressed="String(selected === snapshot.time_index)"
                  @click="choose(snapshot.time_index)">
            <strong>{{ formatDate(snapshot.time_index) }}</strong>
            <span>{{ relative(snapshot.time_index) }} · {{ snapshot.items }} items</span>
          </button>
        </div>
        <div class="snapshots-diff" aria-live="polite">
          <p v-if="diffLoading" class="snapshots-message" role="status">Comparing with the current inventory…</p>
          <p v-else-if="!selected" class="snapshots-message">Choose a snapshot.</p>
          <div v-else-if="!missing.length" class="snapshots-empty is-compact">
            <span class="snapshots-mark is-good"><i class="fe fe-check" aria-hidden="true"></i></span>
            <strong>Nothing is missing</strong>
            <p>Everything in this snapshot is still in {{ record.character }}’s inventory or bank.</p>
          </div>
          <template v-else>
            <div class="snapshots-diff-head">
              <span>{{ missing.length }} {{ missing.length === 1 ? 'item is' : 'items are' }} missing</span>
              <button type="button" class="snapshots-link" @click="toggleAll">{{ allChosen ? 'Clear' : 'Select all' }}</button>
            </div>
            <ul class="snapshots-items">
              <li v-for="(line, index) in missing" :key="index">
                <label>
                  <input v-model="chosen" type="checkbox" :value="index" :disabled="!chosen.includes(index) && !fits(index)">
                  <span class="snapshots-item">
                    <strong>{{ line.item.name }}</strong>
                    <span v-if="augmentNames(line)" class="snapshots-augments">with {{ augmentNames(line) }}</span>
                  </span>
                  <span class="snapshots-count" :title="`Had ${line.had}, has ${line.has}`">× {{ line.missing }}
                    <small v-if="cost(line) > 1">{{ cost(line) }} parcels</small>
                  </span>
                </label>
              </li>
            </ul>
          </template>
        </div>
      </div>
    </div>
    <template #modal-footer>
      <span v-if="!canRestore && missing.length" class="snapshots-note">Restoring needs Mail &amp; Parcels write access.</span>
      <span v-else-if="overflow" class="snapshots-note is-warning">Only the first 20 parcels fit in one batch. Restore the rest after sending.</span>
      <span v-else-if="parcels" class="snapshots-note">{{ parcels }} of 20 parcels in this batch</span>
      <button type="button" class="btn btn-outline-light btn-sm" @click="$emit('close')">Close</button>
      <button v-if="canRestore" type="button" class="btn btn-primary btn-sm" :disabled="!chosen.length" @click="restore">
        <i class="fe fe-package" aria-hidden="true"></i> Restore {{ Math.min(parcels, 20) || '' }} as parcels
      </button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'

export default {
  name: 'SupportSnapshots',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    canRestore: { type: Boolean, default: false }
  },
  data () {
    return { snapshots: [], selected: 0, missing: [], chosen: [], loading: true, diffLoading: false, error: '', version: 0 }
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
  async mounted () {
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
  methods: {
    errorText (error) { return (error.response && error.response.data && error.response.data.error) || 'Snapshots could not be loaded' },
    async choose (time) {
      const version = ++this.version
      this.selected = time
      this.diffLoading = true
      this.error = ''
      this.chosen = []
      try {
        const { data } = await SpireApi.v1().get(`${this.endpoint}/${time}`, { params: { connection_id: this.connectionId } })
        if (version !== this.version) return
        this.missing = data.missing || []
      } catch (error) {
        if (version !== this.version) return
        this.missing = []
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
.snapshots-lead { margin: 0 0 12px; color: #a9b9ca; font-size: .82rem; }
.snapshots code { color: #f3dcae; background: #241f18; padding: 1px 5px; border-radius: 4px; }
.snapshots-message { color: #a9b9ca; font-size: .82rem; }
.snapshots-message.is-error { color: #ffadbd; }
.snapshots-empty { display: grid; justify-items: center; gap: 6px; padding: 30px 10px; text-align: center; color: #a9b9ca; font-size: .8rem; }
.snapshots-empty.is-compact { padding: 22px 10px; }
.snapshots-empty strong { color: #f0f4f8; font-size: .9rem; }
.snapshots-empty p { margin: 0; max-width: 360px; }
.snapshots-mark { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; color: #dfb976; background: #352c1f; }
.snapshots-mark.is-good { color: #8fd6ad; background: #183026; }
.snapshots-workspace { display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 12px; min-height: 260px; }
.snapshots-list { display: grid; align-content: start; gap: 5px; max-height: 380px; overflow-y: auto; }
.snapshots-list button {
  display: grid; gap: 2px; padding: 8px 10px; text-align: left; border-radius: 8px;
  color: #c9d6e3; background: #172230; border: 1px solid #2f3d4d; font-size: .78rem;
}
.snapshots-list button span { color: #8fa1b5; font-size: .7rem; }
.snapshots-list button[aria-pressed="true"] { border-color: #dfb976; background: #241f18; color: #f3dcae; }
.snapshots-diff { min-width: 0; }
.snapshots-diff-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; color: #f0f4f8; font-size: .82rem; font-weight: 650; }
.snapshots-link { background: none; border: 0; color: #dfb976; font-size: .76rem; padding: 0; }
.snapshots-items { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; max-height: 340px; overflow-y: auto; }
.snapshots-items label {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: center; margin: 0;
  padding: 7px 10px; border: 1px solid #2f3d4d; border-radius: 8px; background: #121b25; cursor: pointer; font-weight: 400;
}
.snapshots-items label:hover { border-color: #46586c; }
.snapshots-item { display: grid; line-height: 1.3; }
.snapshots-item strong { color: #eef3f8; font-size: .8rem; font-weight: 600; }
.snapshots-augments { color: #8fa1b5; font-size: .7rem; }
.snapshots-count { color: #f4ba83; font-size: .78rem; font-weight: 650; font-variant-numeric: tabular-nums; }
.snapshots-note { margin-right: auto; color: #8fa1b5; font-size: .74rem; }
.snapshots-note.is-warning { color: #f4ba83; }
.snapshots-count small { display: block; color: #8fa1b5; font-size: .66rem; font-weight: 500; text-align: right; }
@media (max-width: 600px) { .snapshots-workspace { grid-template-columns: 1fr; } .snapshots-list { max-height: 160px; } }
</style>
