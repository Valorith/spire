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
              <div v-if="mode === 'move'" class="recovery-target-modes" role="group" aria-label="Destination type">
                <button v-for="option in targetModes" :key="option.id" type="button" :aria-pressed="target === option.id"
                        :disabled="sending || !!result" @click="setTarget(option.id)">
                  <i :class="option.icon" aria-hidden="true"></i> {{ option.label }}
                </button>
              </div>
              <div v-if="mode === 'move'" class="recovery-presets" role="group" aria-label="Quick destinations">
                <span>Quick picks</span>
                <button type="button" :disabled="sending || !!result" :aria-pressed="String(preset === 'safe')"
                        :title="'Safe point in ' + zoneName(data.character)" @click="usePreset('safe')">
                  <i class="fe fe-shield" aria-hidden="true"></i> Current zone
                </button>
                <button v-if="data.bind" type="button" :disabled="sending || !!result" :aria-pressed="String(preset === 'bind')"
                        :title="'Bind point in ' + zoneName(data.bind)" @click="usePreset('bind')">
                  <i class="fe fe-home" aria-hidden="true"></i> Bind point
                </button>
              </div>
              <template v-if="mode === 'move' && target === 'player'">
                <strong>{{ targetPlayer ? targetPlayer.name : 'Choose a player' }}</strong>
                <span v-if="targetPlayer" class="recovery-tag">
                  <i :class="targetPlayer.online ? 'fe fe-radio' : 'fe fe-save'" aria-hidden="true"></i>
                  {{ targetPlayer.online ? 'Live location' : 'Last saved location' }} · {{ targetPlayer.zone_name || 'Zone #' + targetPlayer.zone_id }}
                </span>
                <span v-else class="recovery-tag">Moves to their location in any zone</span>
              </template>
              <template v-else>
                <strong>{{ toPlayer ? record.character + '’s current location' : destination && destination.long_name }}</strong>
                <span v-if="toPlayer" class="recovery-tag"><i class="fe fe-bell" aria-hidden="true"></i> In-game notice</span>
                <span v-else-if="mode === 'move' && target === 'coordinates'" class="recovery-tag">{{ coordinatesReady ? coordinateLabel : 'Enter coordinates below' }}</span>
                <span v-else class="recovery-tag">Safe point</span>
              </template>
              <div class="recovery-destination-actions">
                <button v-if="mode === 'move' && target === 'player'" type="button" class="recovery-button recovery-change" :disabled="sending || !!result"
                        :aria-expanded="choosingPlayer" @click="togglePlayers">{{ choosingPlayer ? 'Close player search' : targetPlayer ? 'Change player' : 'Find player' }}</button>
                <button v-else type="button" class="recovery-button recovery-change" :disabled="sending || !!result"
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

          <div v-if="choosingPlayer" class="recovery-picker">
            <label for="recovery-player">Search characters</label>
            <input id="recovery-player" ref="playerSearch" v-model="playerQuery" type="search" class="recovery-input" maxlength="64"
                   placeholder="Character name or ID" @input="schedulePlayers">
            <p v-if="playerError" class="recovery-message is-error" role="alert">{{ playerError }}</p>
            <p v-else-if="playersLoading" class="recovery-empty" role="status">Searching characters…</p>
            <p v-else-if="playerQuery.trim().length < 2" class="recovery-empty">Type at least 2 characters</p>
            <p v-else-if="!players.length" class="recovery-empty">No matching characters</p>
            <div v-else class="recovery-zone-results">
              <button v-for="player in players" :key="player.id" type="button" :aria-pressed="!!targetPlayer && targetPlayer.id === player.id" @click="choosePlayerTarget(player)">
                <strong><span class="recovery-online" :class="{ 'is-online': player.online }" aria-hidden="true"></span>{{ player.name }}</strong>
                <span>Level {{ player.level }} · {{ player.zone_name || 'Zone #' + player.zone_id }} · {{ player.online ? 'Online' : 'Offline' }}</span>
              </button>
            </div>
          </div>

          <fieldset v-if="canMove && mode === 'move' && target === 'coordinates' && !result" class="recovery-coordinates-form">
            <legend>Coordinates in {{ destination ? destination.long_name : 'the destination zone' }}</legend>
            <div class="recovery-coordinate-grid">
              <label v-for="axis in axes" :key="axis.id">
                <span>{{ axis.label }}</span>
                <input v-model="coords[axis.id]" class="recovery-input" type="number" step="any" inputmode="decimal"
                       :min="axis.id === 'heading' ? 0 : -100000" :max="axis.id === 'heading' ? 511.99 : 100000"
                       :aria-label="axis.aria" :disabled="sending" @input="moveError = ''">
              </label>
            </div>
            <div class="recovery-loc-row">
              <input v-model="locPaste" class="recovery-input" type="text" maxlength="120" aria-label="Paste a /loc result"
                     placeholder="Paste /loc output, e.g. Your Location is 120.5, -45.0, 3.1" :disabled="sending" @input="applyLoc">
              <button type="button" class="recovery-button recovery-change" :disabled="sending" @click="useSavedCoordinates">
                <i class="fe fe-map-pin" aria-hidden="true"></i> Use saved location
              </button>
            </div>
            <span class="recovery-hint" :class="{ 'is-short': locPaste && !locParsed }">
              {{ locPaste && !locParsed ? 'Could not read three numbers from that text.' : 'EverQuest /loc lists Y, X, Z — pasting fills them in the right order. Heading is 0–511.' }}
            </span>
          </fieldset>

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
        <span v-else-if="data && data.companion === 'missing' && allowMove" class="recovery-tag">
          <i class="fe fe-cpu" aria-hidden="true"></i> Moves need the Player Support patch on World and zones
        </span>
        <button type="button" class="recovery-button" :disabled="sending" @click="$emit('close')">{{ result ? 'Done' : 'Close' }}</button>
        <button v-if="canMove && !result" type="button" class="recovery-button is-primary"
                :disabled="sending || choosing || choosingPlayer || !reason.trim() || !destinationReady" @click="move">
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
      destination: null, toPlayer: false, reason: '', sending: false, moveError: '', result: null,
      target: 'zone', coords: { x: '', y: '', z: '', heading: '0' }, locPaste: '', locParsed: false,
      choosingPlayer: false, playerQuery: '', players: [], playersLoading: false, playerError: '', playerVersion: 0, playerTimer: null,
      targetPlayer: null,
      targetModes: [
        { id: 'zone', label: 'Zone', icon: 'fe fe-map' },
        { id: 'coordinates', label: 'Coordinates', icon: 'fe fe-crosshair' },
        { id: 'player', label: 'Player', icon: 'fe fe-users' }
      ],
      axes: [
        { id: 'x', label: 'X', aria: 'X coordinate' },
        { id: 'y', label: 'Y', aria: 'Y coordinate' },
        { id: 'z', label: 'Z', aria: 'Z coordinate' },
        { id: 'heading', label: 'Heading', aria: 'Heading' }
      ]
    }
  },
  computed: {
    // Which quick pick matches the current destination, if any.
    preset () {
      if (this.mode !== 'move' || !this.data || !this.destination) return ''
      const character = this.data.character
      const bind = this.data.bind
      if (this.target === 'zone' && this.destination.id === character.zone_id) return 'safe'
      if (bind && this.target === 'coordinates' && this.destination.id === bind.zone_id &&
        Number(this.coords.x) === Number(this.round(bind.x)) && Number(this.coords.y) === Number(this.round(bind.y))) return 'bind'
      return ''
    },
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
      return Boolean(this.allowMove && !this.loading && this.data && this.data.local_world && this.data.companion !== 'missing' && this.source &&
        this.source.zone_id && (!this.selectedCorpse || !this.selectedCorpse.buried))
    },
    coordinateValues () {
      const values = {}
      for (const axis of ['x', 'y', 'z', 'heading']) {
        const raw = String(this.coords[axis]).trim()
        values[axis] = raw === '' ? NaN : Number(raw)
      }
      return values
    },
    coordinatesReady () {
      const { x, y, z, heading } = this.coordinateValues
      return [x, y, z].every(value => Number.isFinite(value) && Math.abs(value) <= 100000) &&
        Number.isFinite(heading) && heading >= 0 && heading < 512
    },
    coordinateLabel () {
      const { x, y, z } = this.coordinateValues
      return [x, y, z].map(value => value.toFixed(1)).join(' / ')
    },
    destinationReady () {
      if (this.toPlayer || this.mode !== 'move') return Boolean(this.toPlayer || this.destination)
      if (this.target === 'player') return Boolean(this.targetPlayer)
      if (this.target === 'coordinates') return Boolean(this.destination && this.coordinatesReady)
      return Boolean(this.destination)
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
  beforeDestroy () {
    clearTimeout(this.zoneTimer)
    clearTimeout(this.playerTimer)
  },
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
      clearTimeout(this.playerTimer)
      this.playerVersion++
      this.target = 'zone'
      this.choosingPlayer = false
      this.targetPlayer = null
      this.locPaste = ''
      this.locParsed = false
      this.useSavedCoordinates()
    },
    // One-click destinations: the current zone's safe point, or the bind point.
    usePreset (preset) {
      const character = this.data.character
      if (preset === 'safe') {
        this.setTarget('zone')
        this.destination = { id: character.zone_id, long_name: this.zoneName(character) }
      } else if (this.data.bind) {
        const bind = this.data.bind
        this.setTarget('coordinates')
        this.destination = { id: bind.zone_id, long_name: this.zoneName(bind) }
        // EverQuest headings run from 0 up to 512.
        const heading = Number(bind.heading) || 0
        this.coords = { x: this.round(bind.x), y: this.round(bind.y), z: this.round(bind.z), heading: this.round(((heading % 512) + 512) % 512) }
      }
      this.$nextTick(() => { if (this.$refs.reason) this.$refs.reason.focus() })
    },
    setTarget (target) {
      if (this.target === target) return
      this.target = target
      this.moveError = ''
      this.choosing = false
      this.choosingPlayer = false
      if (target === 'player' && !this.targetPlayer) this.togglePlayers()
    },
    useSavedCoordinates () {
      const source = this.mode === 'move' && this.data ? this.data.character : null
      if (!source) return
      this.coords = { x: this.round(source.x), y: this.round(source.y), z: this.round(source.z), heading: '0' }
      if (this.target === 'coordinates') this.destination = { id: source.zone_id, long_name: this.zoneName(source) }
    },
    round (value) { return String(Math.round(Number(value) * 100) / 100) },
    // EverQuest prints "/loc" as Y, X, Z.
    applyLoc () {
      const numbers = (this.locPaste.match(/-?\d+(?:\.\d+)?/g) || []).map(Number)
      this.locParsed = numbers.length >= 3
      if (!this.locParsed) return
      const [y, x, z] = numbers
      this.coords = { ...this.coords, x: String(x), y: String(y), z: String(z) }
      this.moveError = ''
    },
    togglePlayers () {
      this.choosingPlayer = !this.choosingPlayer
      if (this.choosingPlayer) {
        this.choosing = false
        this.playerQuery = ''
        this.players = []
        this.playerError = ''
        this.$nextTick(() => { if (this.$refs.playerSearch) this.$refs.playerSearch.focus() })
      }
    },
    schedulePlayers () {
      clearTimeout(this.playerTimer)
      const version = ++this.playerVersion
      const q = this.playerQuery.trim()
      this.playerError = ''
      this.players = []
      this.playersLoading = q.length >= 2
      if (!this.playersLoading) return
      this.playerTimer = setTimeout(async () => {
        try {
          const { data } = await SpireApi.v1().get('player-operations/lookup/characters', { params: { q } })
          if (version === this.playerVersion) {
            this.players = (data.data || []).filter(player => player.id !== this.record.character_id)
          }
        } catch (error) {
          if (version === this.playerVersion) this.playerError = this.errorText(error, 'Could not search characters.')
        } finally {
          if (version === this.playerVersion) this.playersLoading = false
        }
      }, 200)
    },
    choosePlayerTarget (player) {
      this.targetPlayer = player
      this.choosingPlayer = false
      this.moveError = ''
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
      this.choosingPlayer = false
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
      if (!this.canMove || this.sending || this.result || this.choosing || this.choosingPlayer || !this.destinationReady) return
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
        const body = {
          corpse_id: this.selectedCorpse ? this.selectedCorpse.id : 0,
          source_zone: this.source.zone_id, source_instance: this.source.instance_id,
          destination: this.toPlayer ? 0 : this.destination.id, to_player: this.toPlayer, reason, request_id: requestId
        }
        if (this.mode === 'move' && this.target === 'player') {
          body.destination = 0
          body.target_character = this.targetPlayer.id
        } else if (this.mode === 'move' && this.target === 'coordinates') {
          const { x, y, z, heading } = this.coordinateValues
          body.coordinates = { x, y, z, heading }
        }
        const { data } = await SpireApi.v1().put(this.endpoint + '/move', body, { params: this.params })
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
.support-recovery-modal .modal-header { background: radial-gradient(600px 120px at 0 0, rgba(98, 210, 216, .1), transparent 70%), #131d28; }
.support-recovery-modal .modal-content { border-radius: 12px; overflow: hidden; box-shadow: 0 24px 60px rgba(0, 0, 0, .45); }
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
.recovery-tabs button .fe-user { color: #62d2d8; }
.recovery-tabs button .fe-archive { color: #b9a2ff; }
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
.recovery-corpse[aria-pressed=true] { background: linear-gradient(90deg, rgba(230, 189, 120, .12), #202b35 60%); border-color: #80683e; box-shadow: inset 3px 0 0 var(--gold); }
.recovery-detail { display: grid; gap: 16px; padding: 18px 20px 20px; min-width: 0; }
.recovery-positions { display: grid; align-items: stretch; gap: 8px; }
.recovery-positions.has-move { grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); }
.recovery-position:not(.recovery-destination) { border-color: #34506e; background: linear-gradient(160deg, #16243a, #141f2a 70%); }
.recovery-position:not(.recovery-destination) h3 { color: #9cc5f5; }
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
.recovery-target-modes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; width: 100%; margin-bottom: 4px; padding: 3px; border-radius: 7px; background: #141210; border: 1px solid #4a3d2a; }
.recovery-target-modes button { display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 4px 6px; border: 0; border-radius: 5px; background: transparent; color: #cdb98f; font-size: .72rem; font-weight: 650; white-space: nowrap; }
.recovery-target-modes button:hover:not(:disabled) { color: #f3dcae; }
.recovery-target-modes button[aria-pressed=true] { color: #241b11; background: var(--gold); }
.recovery-target-modes button:disabled { opacity: .5; cursor: default; }
.recovery-coordinates-form { margin: 0; padding: 12px; border: 1px solid var(--line); border-radius: 6px; min-width: 0; }
.recovery-coordinates-form legend { width: auto; margin: 0; padding: 0 4px; font-size: .8rem; font-weight: 600; color: #e1ebf6; }
.recovery-coordinate-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.recovery-coordinate-grid label { display: grid; gap: 4px; margin: 0; }
.recovery-coordinate-grid label span { color: var(--muted); font-size: .72rem; font-weight: 650; }
.recovery-coordinate-grid input { font-variant-numeric: tabular-nums; }
.recovery-loc-row { display: flex; gap: 8px; margin-top: 10px; }
.recovery-loc-row input { flex: 1; min-width: 0; }
.recovery-loc-row button { flex: none; }
.recovery-online { display: inline-block; width: 7px; height: 7px; margin-right: 7px; border-radius: 50%; border: 1px solid var(--muted); vertical-align: middle; }
.recovery-online.is-online { border: 0; background: #8fd6ad; }
.recovery-corpse-summary { color: var(--muted); font-size: .74rem; justify-content: flex-start !important; gap: 10px !important; }
.recovery-corpse-summary i { margin-right: 2px; }
.recovery-reason { display: grid; }
.recovery-hint { margin-top: 5px; color: var(--muted); font-size: .72rem; font-variant-numeric: tabular-nums; }
.recovery-hint.is-short { color: #f4ba83; }
.recovery-input::placeholder { color: #75879b; }
.recovery > .recovery-empty, .recovery > .recovery-message { margin: 14px 20px; }
.recovery-message { margin: 0; padding: 9px 11px; color: #b9e3cf; border: 1px solid #375e52; border-radius: 4px; background: #172b27; }
.recovery-message.is-error { color: #ffc6a8; border-color: #754f3d; background: #30241e; }
.recovery-presets { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin: 2px 0 6px; }
.recovery-presets span { color: #8fa1b5; font-size: .7rem; margin-right: 2px; }
.recovery-presets button {
  display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; font-size: .72rem;
  border: 1px solid #3c4f63; background: #172230; color: #c9d6e3;
}
.recovery-presets button:hover:not(:disabled) { border-color: #62d2d8; color: #c9f3f5; }
.recovery-presets button[aria-pressed="true"] { border-color: #62d2d8; background: #173236; color: #c9f3f5; }
.recovery-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; width: 100%; gap: 8px; }
.recovery-footer .recovery-tag { margin-right: auto; }
@media (max-width: 600px) {
  .recovery-workspace.has-corpses { grid-template-columns: minmax(0, 1fr); }
  .recovery-list { border-right: 0; border-bottom: 1px solid var(--line); max-height: 145px; }
  .recovery-detail, .recovery-bar { padding-left: 12px; padding-right: 12px; }
  .recovery-position { padding: 8px; }
  /* Stack the source and destination so the destination switch has room. */
  .recovery-positions.has-move { grid-template-columns: minmax(0, 1fr); }
  .recovery-direction { justify-self: center; transform: rotate(90deg); }
  .recovery-coordinate-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .recovery-loc-row { flex-wrap: wrap; }
}
</style>
