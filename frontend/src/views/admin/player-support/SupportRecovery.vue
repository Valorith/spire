<template>
  <b-modal visible scrollable centered size="xl" modal-class="support-recovery-modal" :title="record.character + ' · Recovery'"
           :no-close-on-backdrop="sending" :no-close-on-esc="sending" :hide-header-close="sending" @hide="$emit('close')">
    <div class="recovery">
      <div class="recovery-bar">
        <div class="recovery-tabs" role="group" aria-label="Recovery tools">
          <button type="button" :aria-pressed="mode === 'move'" :disabled="sending || unconfirmed" @click="changeMode('move')">
            <i class="fe fe-user" aria-hidden="true"></i> Character
          </button>
          <button type="button" :aria-pressed="mode === 'corpses'" :disabled="sending || unconfirmed" @click="changeMode('corpses')">
            <i class="fe fe-archive" aria-hidden="true"></i> Corpses <span v-if="data">{{ data.corpses.length }}</span>
          </button>
        </div>
        <button type="button" class="recovery-icon" aria-label="Refresh locations" :disabled="loading || sending" @click="load">
          <i class="fe fe-refresh-cw" aria-hidden="true"></i>
        </button>
      </div>
      <p v-if="loadError" class="recovery-message is-error" role="alert">{{ loadError }}</p>
      <p v-else-if="loading" class="recovery-empty" role="status">Loading locations…</p>
      <div v-else-if="data" class="recovery-workspace" :class="{ 'has-corpses': mode === 'corpses' }">
        <aside v-if="mode === 'corpses'" aria-label="Player corpses" class="recovery-list">
          <p v-if="!data.corpses.length" class="recovery-empty">No corpses found</p>
          <button v-for="corpse in data.corpses" :key="corpse.id" type="button" class="recovery-corpse"
                  :aria-pressed="corpse.id === selectedId" :disabled="sending || unconfirmed" @click="selectCorpse(corpse.id)">
            <span><strong>{{ zoneName(corpse.location) }}</strong><span class="recovery-tag">#{{ corpse.id }}</span></span>
            <span><time :datetime="corpse.time_of_death">{{ dateLabel(corpse.time_of_death) }}</time><span v-if="corpse.buried" class="recovery-tag">Buried</span></span>
            <span class="recovery-corpse-summary">
              <span><i class="fe fe-package" aria-hidden="true"></i> {{ corpse.item_count }} {{ corpse.item_count === 1 ? 'item' : 'items' }}</span>
            </span>
          </button>
        </aside>

        <div v-if="source" class="recovery-detail">
          <div class="recovery-positions" :class="{ 'has-move': canMove }">
            <section class="recovery-position">
              <h3><i class="fe fe-map-pin" aria-hidden="true"></i> {{ mode === 'move' ? 'Last saved location' : 'Corpse #' + selectedId }}</h3>
              <strong>{{ zoneName(source) }}</strong>
              <span class="recovery-coordinates">{{ coordinates(source) }}</span>
              <span v-if="source.instance_id" class="recovery-tag">Instance #{{ source.instance_id }}</span>
            </section>
            <i v-if="canMove" class="fe fe-arrow-right recovery-direction" aria-hidden="true"></i>
            <section v-if="canMove" class="recovery-position recovery-destination">
              <h3><i class="fe fe-flag" aria-hidden="true"></i> Destination</h3>
              <strong>{{ toPlayer ? record.character + '’s current location' : destination && destination.long_name }}</strong>
              <span v-if="toPlayer" class="recovery-tag"><i class="fe fe-bell" aria-hidden="true"></i> In-game notice</span>
              <span v-else class="recovery-tag">Safe point</span>
              <div class="recovery-destination-actions">
                <button type="button" class="recovery-button recovery-change" :disabled="sending || !!result"
                        :aria-expanded="choosing" @click="toggleZones">{{ choosing ? 'Close zone search' : 'Change zone' }}</button>
                <button v-if="selectedCorpse && data.live_destination && !toPlayer" type="button" class="recovery-button recovery-change" :disabled="sending || !!result"
                        @click="choosePlayer"><i class="fe fe-crosshair" aria-hidden="true"></i> Player’s current location</button>
              </div>
            </section>
          </div>

          <div v-if="choosing" class="recovery-picker">
            <label for="recovery-zone">Search zones</label>
            <input id="recovery-zone" ref="zoneSearch" v-model="zoneQuery" type="search" class="recovery-input" maxlength="120" @input="scheduleZones">
            <p v-if="zoneError" class="recovery-message is-error" role="alert">{{ zoneError }}</p>
            <p v-else-if="zonesLoading" class="recovery-empty" role="status">Searching zones…</p>
            <p v-else-if="!zones.length" class="recovery-empty">No matching zones</p>
            <div v-else class="recovery-zone-results">
              <button v-for="zone in zones" :key="zone.id" type="button" :aria-pressed="!toPlayer && destination.id === zone.id" @click="chooseZone(zone)">
                <strong>{{ zone.long_name }}</strong><span>{{ zone.short_name }} · #{{ zone.id }}</span>
              </button>
            </div>
          </div>

          <section v-if="selectedCorpse" class="recovery-inventory" aria-label="Corpse inventory">
            <div class="recovery-inventory-header">
              <h3>Loot <span>{{ selectedCorpse.item_count }}</span></h3>
              <div class="recovery-tags">
                <span v-if="selectedCorpse.buried" class="recovery-tag">Buried</span>
                <span class="recovery-tag">{{ selectedCorpse.rezzed ? 'Resurrected' : selectedCorpse.rezzable ? 'Resurrection available' : 'Resurrection unavailable' }}</span>
              </div>
            </div>
            <div v-if="coins.length" class="recovery-coins" aria-label="Coin">
              <span v-for="coin in coins" :key="coin.unit" :class="'coin-' + coin.unit">{{ coin.amount.toLocaleString() }} {{ coin.unit }}</span>
            </div>
            <p v-if="lootLoading" class="recovery-empty" role="status">Loading loot…</p>
            <p v-else-if="lootError" class="recovery-message is-error" role="alert">{{ lootError }}</p>
            <ul v-else-if="items.length" class="recovery-loot">
              <li v-for="(item, index) in items" :key="index">
                <i v-if="item.icon" :class="'item-' + item.icon + '-sm'" aria-hidden="true"></i>
                <i v-else class="fe fe-package" aria-hidden="true"></i>
                <strong>{{ item.name || 'Item #' + item.id }}</strong>
                <span v-if="item.charges > 1">×{{ item.charges }}</span>
              </li>
            </ul>
            <p v-else class="recovery-empty">No items</p>
          </section>

          <div v-if="canMove && !result" class="recovery-reason">
            <label for="recovery-reason">Reason for move</label>
            <textarea id="recovery-reason" ref="reason" v-model="reason" class="recovery-input" rows="2" maxlength="240"
                      :disabled="sending" placeholder="Why is this move needed? It is recorded on the case timeline."
                      aria-describedby="recovery-reason-hint" @input="moveError = ''"></textarea>
            <span id="recovery-reason-hint" class="recovery-hint" :class="{ 'is-short': reason.trim() && reason.trim().length < 8 }">
              8–240 characters · {{ reason.trim().length }}/240
            </span>
          </div>
          <p v-if="moveError" class="recovery-message is-error" role="alert">{{ moveError }}</p>
          <p v-if="result" class="recovery-message" :class="{ 'is-error': warning }" :role="warning ? 'alert' : 'status'">
            <i :class="warning ? 'fe fe-alert-triangle' : 'fe fe-check-circle'" aria-hidden="true"></i> {{ result.message }}
          </p>
        </div>
      </div>
    </div>
    <template #modal-footer>
      <div class="recovery-footer">
        <span v-if="data && !data.local_world && allowMove" class="recovery-tag">Moves require the local game server</span>
        <button type="button" class="recovery-button" :disabled="sending" @click="$emit('close')">{{ result ? 'Done' : 'Close' }}</button>
        <button v-if="canMove && !result" type="button" class="recovery-button is-primary"
                :disabled="sending || choosing || !reason.trim()" @click="move">
          <i class="fe fe-navigation" aria-hidden="true"></i> {{ sending ? 'Moving…' : mode === 'move' ? 'Move character' : 'Move corpse' }}
        </button>
      </div>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'

export default {
  name: 'SupportRecovery',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    initialMode: { type: String, required: true },
    allowMove: { type: Boolean, required: true }
  },
  data () {
    return {
      mode: this.initialMode, data: null, selectedId: null, loading: false, loadError: '',
      items: [], lootLoading: false, lootError: '', lootVersion: 0,
      choosing: false, zoneQuery: '', zones: [], zonesLoading: false, zoneError: '', zoneVersion: 0, zoneTimer: null,
      destination: null, toPlayer: false, reason: '', sending: false, moveError: '', result: null
    }
  },
  computed: {
    endpoint () { return 'player-support/cases/' + this.record.key },
    params () { return { connection_id: this.connectionId } },
    selectedCorpse () {
      return this.mode === 'corpses' && this.data ? this.data.corpses.find(corpse => corpse.id === this.selectedId) : null
    },
    source () {
      if (!this.data) return null
      return this.mode === 'move' ? this.data.character : this.selectedCorpse && this.selectedCorpse.location
    },
    canMove () {
      return Boolean(this.allowMove && !this.loading && this.data && this.data.local_world && this.source &&
        this.source.zone_id && (!this.selectedCorpse || !this.selectedCorpse.buried))
    },
    unconfirmed () { return this.result && ['unconfirmed', 'moved_arrival_unconfirmed'].includes(this.result.status) },
    warning () { return this.unconfirmed || (this.result && this.result.status === 'moved_notice_unavailable') },
    coins () {
      const { platinum, gold, silver, copper } = this.selectedCorpse || {}
      return [{ unit: 'pp', amount: platinum }, { unit: 'gp', amount: gold }, { unit: 'sp', amount: silver }, { unit: 'cp', amount: copper }]
        .filter(coin => coin.amount > 0)
    }
  },
  created () { this.load() },
  beforeDestroy () { clearTimeout(this.zoneTimer) },
  methods: {
    errorText (error, fallback) {
      const response = error.response
      if (response && response.status === 422) return 'Recovery is unavailable on this Spire server.'
      return response && response.data && response.data.error || fallback
    },
    zoneName (location) { return location.zone_name || (location.zone_id ? 'Zone #' + location.zone_id : 'Unknown zone') },
    coordinates (location) {
      return [location.x, location.y, location.z].map(value => Number(value).toFixed(1)).join(' / ')
    },
    dateLabel (value) { return value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown time' },
    async load () {
      this.loading = true
      this.loadError = ''
      try {
        const { data } = await SpireApi.v1().get(this.endpoint + '/recovery', { params: this.params })
        if (!data || !data.character || !Array.isArray(data.corpses)) {
          this.loadError = 'Recovery is unavailable on this Spire server.'
          return
        }
        this.data = data
        if (!data.corpses.some(corpse => corpse.id === this.selectedId)) this.selectedId = data.corpses.length ? data.corpses[0].id : null
        this.resetDraft()
        if (this.selectedCorpse) this.loadLoot(this.selectedCorpse)
      } catch (error) {
        this.loadError = this.errorText(error, 'Could not load character and corpse locations.')
      } finally { this.loading = false }
    },
    resetDraft () {
      clearTimeout(this.zoneTimer)
      this.zoneVersion++
      this.choosing = false
      this.destination = this.source && { id: this.source.zone_id, long_name: this.zoneName(this.source) }
      this.toPlayer = false
      this.reason = ''
      this.moveError = ''
      this.result = null
    },
    changeMode (mode) {
      if (this.mode === mode) return
      this.mode = mode
      this.resetDraft()
      if (this.selectedCorpse) this.loadLoot(this.selectedCorpse)
    },
    selectCorpse (id) {
      if (this.selectedId === id) return
      this.selectedId = id
      this.resetDraft()
      this.loadLoot(this.selectedCorpse)
    },
    async loadLoot (corpse) {
      const version = ++this.lootVersion
      this.items = []
      this.lootError = ''
      this.lootLoading = Boolean(corpse.item_count)
      if (!this.lootLoading) return
      try {
        const { data } = await SpireApi.v1().get(this.endpoint + '/corpses/' + corpse.id, { params: this.params })
        if (version === this.lootVersion) this.items = data.items
      } catch (error) {
        if (version === this.lootVersion) this.lootError = this.errorText(error, 'Could not load corpse loot.')
      } finally {
        if (version === this.lootVersion) this.lootLoading = false
      }
    },
    toggleZones () {
      this.choosing = !this.choosing
      if (this.choosing) {
        this.zoneQuery = ''
        this.scheduleZones()
        this.$nextTick(() => { if (this.$refs.zoneSearch) this.$refs.zoneSearch.focus() })
      }
    },
    scheduleZones () {
      clearTimeout(this.zoneTimer)
      const version = ++this.zoneVersion
      this.zonesLoading = true
      this.zoneError = ''
      this.zoneTimer = setTimeout(async () => {
        try {
          const { data } = await SpireApi.v1().get('player-operations/lookup/zones', { params: { q: this.zoneQuery } })
          if (version === this.zoneVersion) this.zones = data.data
        } catch (error) {
          if (version === this.zoneVersion) this.zoneError = this.errorText(error, 'Could not load zones.')
        } finally {
          if (version === this.zoneVersion) this.zonesLoading = false
        }
      }, 200)
    },
    chooseZone (zone) {
      this.destination = zone
      this.choosing = false
      this.toPlayer = false
      this.moveError = ''
    },
    choosePlayer () {
      this.toPlayer = true
      this.choosing = false
      this.moveError = ''
    },
    async move () {
      if (!this.canMove || this.sending || this.result || this.choosing) return
      const reason = this.reason.trim()
      const length = new TextEncoder().encode(reason).length
      if (length < 8 || length > 240) {
        this.moveError = 'Use 8 to 240 characters for the reason.'
        this.$refs.reason.focus()
        return
      }
      this.sending = true
      this.moveError = ''
      const requestId = Array.from(window.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
      try {
        const { data } = await SpireApi.v1().put(this.endpoint + '/move', {
          corpse_id: this.selectedCorpse ? this.selectedCorpse.id : 0,
          source_zone: this.source.zone_id, source_instance: this.source.instance_id,
          destination: this.toPlayer ? 0 : this.destination.id, to_player: this.toPlayer, reason, request_id: requestId
        }, { params: this.params })
        this.result = ['saved', 'requested', 'moved', 'moved_notified', 'moved_notice_unavailable', 'moved_arrival_unconfirmed'].includes(data.status)
          ? data : { ...data, status: 'unconfirmed' }
      } catch (error) {
        if (!error.response || (error.response.status >= 500 && error.response.status !== 503)) {
          this.result = { status: 'unconfirmed', message: 'Check the target location before retrying. The move could not be confirmed.' }
        } else {
          this.moveError = this.errorText(error, 'Could not move the target.')
        }
      } finally {
        this.sending = false
        this.$emit('receipt', this.result)
      }
    }
  }
}
</script>

<style>
.support-recovery-modal .modal-content { color: #e1ebf6; background: #101821; border: 1px solid #354658; }
.support-recovery-modal .modal-header, .support-recovery-modal .modal-footer { background: #131d28; border-color: #2a3948; padding: 14px 20px; }
.support-recovery-modal .modal-title { font-size: 1.1rem; }
.support-recovery-modal .modal-header .close { color: #b4c7d9; }
.support-recovery-modal .modal-body { padding: 0; }
.support-recovery-modal .modal-xl { max-width: min(930px, calc(100% - 32px)); }
</style>

<style scoped>
.recovery { --line: #2c3d4e; --muted: #a4b7ca; --gold: #e6bd78; color: #e1ebf6; background: #101821; }
.recovery-bar { display: flex; justify-content: space-between; align-items: center; padding: 0 20px; border-bottom: 1px solid var(--line); }
.recovery-tabs { display: flex; gap: 18px; }
.recovery-tabs button, .recovery-icon { background: transparent; color: var(--muted); border: 0; }
.recovery-tabs button { border-bottom: 2px solid transparent; padding: 13px 3px 11px; }
.recovery-tabs button[aria-pressed=true] { color: var(--gold); border-color: var(--gold); }
.recovery-tabs button i { margin-right: 4px; }
.recovery-tabs button span, .recovery-inventory h3 span { padding: 1px 6px; margin-left: 4px; border-radius: 10px; background: #293746; font-size: .72rem; }
.recovery-icon { padding: 6px 8px; font-size: 1rem; }
.recovery-icon:hover:not(:disabled) { color: var(--gold); }
.recovery-workspace.has-corpses { display: grid; grid-template-columns: minmax(190px, 1fr) minmax(0, 2.65fr); }
.recovery-list { padding: 12px; border-right: 1px solid var(--line); background: #0d151e; max-height: 530px; overflow: auto; }
.recovery-corpse { display: grid; width: 100%; gap: 4px; text-align: left; border: 1px solid transparent; border-radius: 5px; padding: 9px; margin-bottom: 4px; color: inherit; background: transparent; }
.recovery-corpse > span { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 6px; }
.recovery-corpse time, .recovery-coordinates { color: var(--muted); font-size: .76rem; }
.recovery-corpse:hover, .recovery-zone-results button:hover { background: #202e3d; }
.recovery-corpse[aria-pressed=true] { background: #202b35; border-color: #80683e; }
.recovery-detail { display: grid; gap: 16px; padding: 18px 20px 20px; min-width: 0; }
.recovery-positions { display: grid; align-items: stretch; gap: 8px; }
.recovery-positions.has-move { grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); }
.recovery-position { display: flex; align-content: flex-start; align-items: flex-start; flex-direction: column; gap: 5px; min-width: 0; background: #141f2a; border: 1px solid var(--line); border-radius: 6px; padding: 12px; }
.recovery-position h3, .recovery-inventory h3 { font-size: .82rem; color: var(--muted); margin: 0 0 3px; }
.recovery-position h3 i { margin-right: 4px; }
.recovery-position strong { font-size: 1.03rem; overflow-wrap: anywhere; }
.recovery-coordinates { font-variant-numeric: tabular-nums; }
.recovery-direction { align-self: center; color: var(--gold); }
.recovery-destination { border-color: #6d5737; background: #211e1a; }
.recovery-destination h3, .recovery-destination .recovery-tag { color: var(--gold); }
.recovery-tag { display: inline-block; color: #bbcde0; border: 1px solid #3d4d5e; padding: 2px 6px; border-radius: 4px; font-size: .72rem; line-height: 1.2; }
.recovery-destination .recovery-tag { border-color: #5e4d33; }
.recovery-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 7px 12px; background: #1d2b39; color: #e1ebf6; border: 1px solid #43566b; border-radius: 4px; }
.recovery-button:hover:not(:disabled) { border-color: #8a9eb3; background: #293a4c; }
.recovery-button.is-primary { background: #e6bd78; border-color: #e6bd78; color: #241b11; font-weight: 600; }
.recovery-button.is-primary:hover:not(:disabled) { background: #f3d195; }
.recovery-button:disabled, .recovery-icon:disabled { opacity: .5; cursor: default; }
.recovery-destination-actions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: auto; }
.recovery-change { padding: 3px 8px; font-size: .76rem; }
.recovery-input { width: 100%; background: #0d151e; color: #e1ebf6; border: 1px solid #45576b; border-radius: 4px; padding: 7px 9px; }
.recovery button:focus-visible, .recovery-input:focus-visible, .recovery-footer button:focus-visible { outline: 2px solid #e6bd78; outline-offset: 2px; }
.recovery-picker { padding: 12px; border: 1px solid var(--line); border-radius: 6px; }
.recovery-picker label, .recovery-reason label { margin-bottom: 6px; font-size: .8rem; font-weight: 600; }
.recovery-zone-results, .recovery-loot { max-height: 170px; overflow: auto; margin: 8px 0 0; }
.recovery-zone-results button { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; width: 100%; padding: 7px 9px; text-align: left; color: inherit; background: #141f2a; border: 0; border-bottom: 1px solid var(--line); }
.recovery-zone-results button span { color: var(--muted); font-size: .76rem; }
.recovery-zone-results button[aria-pressed=true] strong { color: var(--gold); }
.recovery-inventory { border-top: 1px solid var(--line); padding-top: 13px; }
.recovery-inventory-header, .recovery-tags, .recovery-coins { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.recovery-inventory-header { justify-content: space-between; }
.recovery-inventory h3 { color: inherit; margin: 0; font-size: .88rem; }
.recovery-coins { gap: 12px; font-size: .78rem; margin-top: 8px; }
.coin-pp { color: #cee1f2; } .coin-gp { color: #f0cb84; } .coin-sp { color: #b9c5d0; } .coin-cp { color: #e9a989; }
.recovery-loot { padding: 0; list-style: none; background: #0d151e; border-radius: 4px; }
.recovery-loot li { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 5px 9px; border-bottom: 1px solid var(--line); }
.recovery-loot strong { overflow-wrap: anywhere; font-size: .8rem; }
.recovery-loot li span { color: var(--muted); }
.recovery-empty { padding: 10px 0; margin: 0; color: var(--muted); }
.recovery-corpse-summary { color: var(--muted); font-size: .74rem; justify-content: flex-start !important; gap: 10px !important; }
.recovery-corpse-summary i { margin-right: 2px; }
.recovery-reason { display: grid; }
.recovery-hint { margin-top: 5px; color: var(--muted); font-size: .72rem; font-variant-numeric: tabular-nums; }
.recovery-hint.is-short { color: #f4ba83; }
.recovery-input::placeholder { color: #75879b; }
.recovery > .recovery-empty, .recovery > .recovery-message { margin: 14px 20px; }
.recovery-message { margin: 0; padding: 9px 11px; color: #b9e3cf; border: 1px solid #375e52; border-radius: 4px; background: #172b27; }
.recovery-message.is-error { color: #ffc6a8; border-color: #754f3d; background: #30241e; }
.recovery-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; width: 100%; gap: 8px; }
.recovery-footer .recovery-tag { margin-right: auto; }
@media (max-width: 600px) {
  .recovery-workspace.has-corpses { grid-template-columns: minmax(0, 1fr); }
  .recovery-list { border-right: 0; border-bottom: 1px solid var(--line); max-height: 145px; }
  .recovery-detail, .recovery-bar { padding-left: 12px; padding-right: 12px; }
  .recovery-position { padding: 8px; }
}
</style>
