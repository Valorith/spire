<template>
  <b-modal ref="modal" visible scrollable centered size="xl" modal-class="support-modal support-recovery-modal"
           :no-close-on-backdrop="sending || expSending" :no-close-on-esc="sending || expSending" :hide-header-close="sending || expSending" @hide="onHide" @shown="focusFirst">
    <template #modal-title>Recovery <span class="support-modal-subject">· {{ record.character }}</span></template>
    <div class="recovery">
      <div class="recovery-bar">
        <div class="support-tabs recovery-tabs" role="tablist" aria-label="Recovery tools" @keydown="tablistKeydown">
          <button id="support-recovery-tab-move" type="button" role="tab" :aria-selected="String(mode === 'move')" aria-controls="support-recovery-panel"
                  :tabindex="mode === 'move' ? 0 : -1" :disabled="sending || unconfirmed" @click="changeMode('move')">
            <i class="fe fe-user" aria-hidden="true"></i> Character
          </button>
          <button id="support-recovery-tab-corpses" type="button" role="tab" :aria-selected="String(mode === 'corpses')" aria-controls="support-recovery-panel"
                  :tabindex="mode === 'corpses' ? 0 : -1" :disabled="sending || unconfirmed" @click="changeMode('corpses')">
            <i class="fe fe-archive" aria-hidden="true"></i> Corpses <span v-if="data" class="support-count">{{ data.corpses.length }}</span>
          </button>
        </div>
        <button type="button" class="support-button is-ghost is-icon is-sm" aria-label="Refresh locations" title="Refresh locations" :disabled="loading || sending" @click="load">
          <i class="fe fe-refresh-cw" :class="{ 'support-spin': loading }" aria-hidden="true"></i>
        </button>
      </div>
      <support-load-state v-if="loadError || loading" id="support-recovery-panel" role="tabpanel" :aria-labelledby="'support-recovery-tab-' + mode" class="recovery-banner" :error="loadError" label="Loading locations" @retry="load" />
      <div v-else-if="mode === 'corpses' && data && !data.corpses.length" id="support-recovery-panel" role="tabpanel" aria-labelledby="support-recovery-tab-corpses" class="support-empty recovery-none">
        <i class="fe fe-archive" aria-hidden="true"></i>
        <strong>No corpses found</strong>
        <span>{{ record.character }} has no corpses to recover.</span>
      </div>
      <div v-else-if="data" id="support-recovery-panel" role="tabpanel" :aria-labelledby="'support-recovery-tab-' + mode" class="recovery-workspace" :class="{ 'has-corpses': mode === 'corpses' }">
        <aside v-if="mode === 'corpses'" aria-label="Player corpses" class="recovery-list">
          <button v-for="corpse in data.corpses" :key="corpse.id" type="button" class="support-option recovery-corpse"
                  :aria-pressed="String(corpse.id === selectedId)" :disabled="sending || unconfirmed" @click="selectCorpse(corpse.id)">
            <span class="recovery-corpse-line"><strong :title="zoneName(corpse.location)">{{ zoneName(corpse.location) }}</strong><span class="recovery-corpse-id">#{{ corpse.id }}</span></span>
            <span class="recovery-corpse-line is-meta"><time :datetime="corpse.time_of_death">{{ dateLabel(corpse.time_of_death) }}</time><span v-if="corpse.buried" class="support-chip">{{ canUnbury ? 'Buried · will be unburied' : 'Buried' }}</span></span>
            <span class="recovery-corpse-line is-meta">
              <span><i class="fe fe-package" aria-hidden="true"></i> {{ corpse.item_count }} {{ corpse.item_count === 1 ? 'item' : 'items' }}</span>
            </span>
          </button>
        </aside>

        <div v-if="source" class="recovery-detail">
          <div class="recovery-positions" :class="{ 'has-move': canMove }">
            <section class="recovery-position">
              <div class="recovery-position-head">
                <h3><i class="fe fe-map-pin" aria-hidden="true"></i> {{ mode === 'move' ? 'Last saved location' : 'Corpse #' + selectedId }}</h3>
                <support-copy v-if="mode === 'corpses' && selectedId" :value="selectedId" label="corpse ID" />
              </div>
              <strong>{{ zoneName(source) }}</strong>
              <span class="recovery-meta recovery-coordinates">{{ coordinates(source) }}</span>
              <span v-if="source.instance_id" class="support-chip">Instance #{{ source.instance_id }}</span>
            </section>
            <span v-if="canMove" class="recovery-direction" aria-hidden="true"><i class="fe fe-arrow-right"></i></span>
            <section v-if="canMove" class="recovery-position recovery-destination">
              <h3><i class="fe fe-flag" aria-hidden="true"></i> Destination</h3>
              <div v-if="mode === 'move'" class="support-segmented recovery-target-modes" role="group" aria-label="Destination type">
                <button v-for="option in targetModes" :key="option.id" type="button" :aria-pressed="String(target === option.id)"
                        :disabled="sending || !!result" @click="setTarget(option.id)">
                  <i :class="option.icon" aria-hidden="true"></i> {{ option.label }}
                </button>
              </div>
              <div v-if="mode === 'move'" class="support-suggestions recovery-presets" role="group" aria-label="Quick destinations">
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
              <div class="recovery-destination-value">
                <template v-if="mode === 'move' && target === 'player'">
                  <strong>{{ targetPlayer ? targetPlayer.name : 'Choose a player' }}</strong>
                  <span v-if="targetPlayer" class="recovery-meta">
                    <i :class="targetPlayer.online ? 'fe fe-radio' : 'fe fe-save'" aria-hidden="true"></i>
                    {{ targetPlayer.online ? 'Live location' : 'Last saved location' }} · {{ targetPlayer.zone_name || 'Zone #' + targetPlayer.zone_id }}
                  </span>
                  <span v-else class="recovery-meta">Moves to their location in any zone</span>
                </template>
                <template v-else>
                  <strong>{{ toPlayer ? record.character + '’s current location' : destination && destination.long_name }}</strong>
                  <span v-if="toPlayer" class="recovery-meta"><i class="fe fe-bell" aria-hidden="true"></i> In-game notice</span>
                  <span v-else-if="mode === 'move' && target === 'coordinates'" class="recovery-meta recovery-coordinates">{{ coordinatesReady ? coordinateLabel : 'Enter coordinates below' }}</span>
                  <span v-else class="recovery-meta">Safe point</span>
                </template>
              </div>
              <div class="recovery-destination-actions">
                <button v-if="mode === 'move' && target === 'player'" type="button" class="support-button is-sm" :disabled="sending || !!result"
                        :aria-expanded="String(choosingPlayer)" @click="togglePlayers">{{ choosingPlayer ? 'Close player search' : targetPlayer ? 'Change player' : 'Find player' }}</button>
                <button v-else type="button" class="support-button is-sm" :disabled="sending || !!result"
                        :aria-expanded="String(choosing)" @click="toggleZones">{{ choosing ? 'Close zone search' : 'Change zone' }}</button>
                <button v-if="selectedCorpse && data.live_destination && !toPlayer" type="button" class="support-button is-sm" :disabled="sending || !!result"
                        @click="choosePlayer"><i class="fe fe-crosshair" aria-hidden="true"></i> Player’s current location</button>
              </div>
            </section>
          </div>

          <p v-if="buriedBlocked" class="support-callout">
            <i class="fe fe-lock" aria-hidden="true"></i><span>Moving a buried corpse needs the updated Player Support patch.</span>
          </p>

          <div v-if="choosing" class="recovery-panel">
            <label for="recovery-zone" class="recovery-panel-label">Search zones</label>
            <input id="recovery-zone" ref="zoneSearch" v-model="zoneQuery" type="search" class="support-field" maxlength="120" @input="scheduleZones">
            <p v-if="zoneError" class="support-feedback is-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ zoneError }}</p>
            <p v-else-if="zonesLoading" class="recovery-status" role="status">Searching zones…</p>
            <p v-else-if="!zones.length" class="recovery-status">No matching zones</p>
            <div v-else class="recovery-results">
              <button v-for="zone in zones" :key="zone.id" type="button" class="support-option" :aria-pressed="String(!toPlayer && destination.id === zone.id)" @click="chooseZone(zone)">
                <strong>{{ zone.long_name }}</strong><span>{{ zone.short_name }} · #{{ zone.id }}</span>
              </button>
            </div>
          </div>

          <div v-if="choosingPlayer" class="recovery-panel">
            <label for="recovery-player" class="recovery-panel-label">Search characters</label>
            <input id="recovery-player" ref="playerSearch" v-model="playerQuery" type="search" class="support-field" maxlength="64"
                   placeholder="Character name or ID" @input="schedulePlayers">
            <p v-if="playerError" class="support-feedback is-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ playerError }}</p>
            <p v-else-if="playersLoading" class="recovery-status" role="status">Searching characters…</p>
            <p v-else-if="playerQuery.trim().length < 2" class="recovery-status">Type at least 2 characters</p>
            <p v-else-if="!players.length" class="recovery-status">No matching characters</p>
            <div v-else class="recovery-results">
              <button v-for="player in players" :key="player.id" type="button" class="support-option" :aria-pressed="String(!!targetPlayer && targetPlayer.id === player.id)" @click="choosePlayerTarget(player)">
                <strong><span class="recovery-online" :class="{ 'is-online': player.online }" aria-hidden="true"></span>{{ player.name }}</strong>
                <span>Level {{ player.level }} · {{ player.zone_name || 'Zone #' + player.zone_id }} · {{ player.online ? 'Online' : 'Offline' }}</span>
              </button>
            </div>
          </div>

          <fieldset v-if="canMove && mode === 'move' && target === 'coordinates' && !result" class="recovery-panel recovery-coordinates-form">
            <legend>Coordinates in {{ destination ? destination.long_name : 'the destination zone' }}</legend>
            <div class="recovery-coordinate-grid">
              <label v-for="axis in axes" :key="axis.id">
                <span>{{ axis.label }}</span>
                <input v-model="coords[axis.id]" class="support-field" type="number" step="any" inputmode="decimal"
                       :min="axis.id === 'heading' ? 0 : -100000" :max="axis.id === 'heading' ? 511.99 : 100000"
                       :aria-label="axis.aria" :disabled="sending" @input="moveError = ''">
              </label>
            </div>
            <div class="recovery-loc-row">
              <input v-model="locPaste" class="support-field" type="text" maxlength="120" aria-label="Paste a /loc result"
                     placeholder="Paste /loc output, such as Your Location is 120.5, -45.0, 3.1" :disabled="sending" @input="applyLoc">
              <button type="button" class="support-button" :disabled="sending" @click="useSavedCoordinates">
                <i class="fe fe-map-pin" aria-hidden="true"></i> Use saved location
              </button>
            </div>
            <span class="recovery-hint" :class="{ 'is-short': locPaste && !locParsed }">
              {{ locPaste && !locParsed ? 'Could not read three numbers from that text.' : 'EverQuest /loc lists Y, X, Z — pasting fills them in the right order. Heading is 0–511.' }}
            </span>
          </fieldset>

          <section v-if="selectedCorpse && (selectedCorpse.exp > 0 || expResult)" class="recovery-exp" aria-label="Corpse experience">
            <div class="recovery-exp-row">
              <div class="recovery-exp-text">
                <strong><i class="fe fe-trending-up" aria-hidden="true"></i> Experience: {{ Number(selectedCorpse.exp || 0).toLocaleString() }}</strong>
                <small v-if="allowMove && expBlocked && !expResult" class="support-blocked"><i class="fe fe-lock" aria-hidden="true"></i><span>{{ expBlocked }}</span></small>
                <small v-else-if="allowMove && !expOpen && !expResult">Returned to {{ record.character }} once, where they are now. The corpse is then marked resurrected.</small>
              </div>
              <button v-if="allowMove && !expOpen" ref="expOpener" type="button" class="support-button is-sm" :disabled="Boolean(expBlocked) || sending" @click="openExp">
                <i class="fe fe-rotate-ccw" aria-hidden="true"></i> Restore experience
              </button>
            </div>
            <div v-if="expOpen" class="recovery-exp-form">
              <p class="recovery-exp-lead">Returns the corpse’s full resurrection experience to {{ record.character }} once and marks the corpse resurrected.</p>
              <support-reason id="recovery-exp-reason" ref="expReason" v-model="expReason" :disabled="expSending"
                              placeholder="Why is this experience being returned?" @input="expError = ''" @submit="restoreExp" />
              <div class="recovery-exp-actions">
                <button type="button" class="support-button is-sm" :disabled="expSending" @click="closeExp">Cancel</button>
                <button type="button" class="support-button is-primary is-sm" :disabled="expSending || Boolean(expBlocked)" @click="restoreExp">
                  <i :class="expSending ? 'fe fe-loader support-spin' : 'fe fe-rotate-ccw'" aria-hidden="true"></i> {{ expSending ? 'Restoring…' : 'Restore experience' }}
                </button>
              </div>
            </div>
            <p v-if="expError" class="support-callout is-danger" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ expError }}</span></p>
            <support-result v-if="expResult" :result="expResult" />
          </section>

          <section v-if="selectedCorpse" class="recovery-inventory" aria-label="Corpse inventory">
            <div class="recovery-inventory-header">
              <h3>Loot <span class="support-count">{{ selectedCorpse.item_count }}</span></h3>
              <div class="recovery-tags">
                <span v-if="selectedCorpse.buried" class="support-chip">{{ canUnbury ? 'Buried · will be unburied' : 'Buried' }}</span>
                <span class="support-chip">{{ selectedCorpse.rezzed ? 'Resurrected' : selectedCorpse.rezzable ? 'Resurrection available' : 'Resurrection unavailable' }}</span>
              </div>
            </div>
            <div v-if="coins.length" class="recovery-coins" aria-label="Coin">
              <span v-for="coin in coins" :key="coin.unit" :class="'coin-' + coin.unit">{{ coin.amount.toLocaleString() }} {{ coin.unit }}</span>
            </div>
            <support-load-state v-if="lootLoading || lootError" :error="lootError" label="Loading loot" shape="lines" :rows="2" @retry="loadLoot(selectedCorpse)" />
            <ul v-else-if="items.length" class="recovery-loot">
              <li v-for="(item, index) in items" :key="index">
                <i v-if="item.icon" :class="'item-' + item.icon + '-sm'" aria-hidden="true"></i>
                <i v-else class="fe fe-package" aria-hidden="true"></i>
                <strong :title="item.name || 'Item #' + item.id">{{ item.name || 'Item #' + item.id }}</strong>
                <span v-if="item.charges > 1">×{{ item.charges }}</span>
              </li>
            </ul>
            <p v-else class="recovery-status">No items on this corpse.</p>
          </section>

          <support-reason v-if="canMove && !result" id="recovery-reason" ref="reason" v-model="reason" label="Reason for move" :disabled="sending"
                          placeholder="Why is this move needed?" @input="moveError = ''" @submit="move" />
          <p v-if="moveError" class="support-callout is-danger" role="alert">
            <i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ moveError }}</span>
          </p>
          <support-result v-if="result" :result="result" />
        </div>
      </div>
    </div>
    <template #modal-footer>
      <span v-if="!allowMove && readOnly" class="support-footer-note"><i class="fe fe-lock" aria-hidden="true"></i>{{ readOnly }}</span>
      <span v-else-if="data && !data.local_world && allowMove" class="support-footer-note"><i class="fe fe-lock" aria-hidden="true"></i>Moves need the game server this Spire runs beside</span>
      <span v-else-if="data && data.companion === 'missing' && allowMove" class="support-footer-note"><i class="fe fe-lock" aria-hidden="true"></i>Moves need the Player Support patch on World and zones</span>
      <span v-else-if="canMove && !result && !destinationReady" class="support-footer-note">{{ destinationHint }}</span>
      <button type="button" class="support-button" :disabled="sending" @click="$emit('close')">{{ result ? 'Done' : 'Close' }}</button>
      <button v-if="canMove && !result" type="button" class="support-button is-primary"
              :disabled="sending || choosing || choosingPlayer || !destinationReady" @click="move">
        <i :class="sending ? 'fe fe-loader support-spin' : 'fe fe-navigation'" aria-hidden="true"></i> {{ sending ? 'Moving…' : mode === 'move' ? 'Move character' : 'Move corpse' }}
      </button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { focusLater, newRequestId, tablistKeydown, touchLayout } from './support-ui'
import { dialogFocus } from './support-dialog'
import SupportCopy from './SupportCopy.vue'
import SupportLoadState from './SupportLoadState.vue'
import SupportReason from './SupportReason.vue'
import SupportResult from './SupportResult.vue'

export default {
  name: 'SupportRecovery',
  components: { SupportCopy, SupportLoadState, SupportReason, SupportResult },
  mixins: [dialogFocus],
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    initialMode: { type: String, required: true },
    allowMove: { type: Boolean, required: true },
    // Patch features of the local World: unbury and corpse_exp.
    features: { type: Object, default: () => ({}) },
    // Why moves are not offered (resolved case, no permission), or ''.
    readOnly: { type: String, default: '' }
  },
  data () {
    return {
      mode: this.initialMode,
      data: null,
      selectedId: null,
      loading: false,
      loadError: '',
      items: [],
      lootLoading: false,
      lootError: '',
      lootVersion: 0,
      choosing: false,
      zoneQuery: '',
      zones: [],
      zonesLoading: false,
      zoneError: '',
      zoneVersion: 0,
      zoneTimer: null,
      destination: null,
      toPlayer: false,
      reason: '',
      sending: false,
      moveError: '',
      result: null,
      target: 'zone',
      coords: { x: '', y: '', z: '', heading: '0' },
      locPaste: '',
      locParsed: false,
      choosingPlayer: false,
      playerQuery: '',
      players: [],
      playersLoading: false,
      playerError: '',
      playerVersion: 0,
      playerTimer: null,
      targetPlayer: null,
      expOpen: false,
      expReason: '',
      expSending: false,
      expError: '',
      expResult: null,
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
    // Features reported with the recovery data win over the page's copy.
    liveFeatures () { return { ...this.features, ...((this.data && this.data.features) || {}) } },
    canUnbury () { return Boolean(this.liveFeatures.unbury && this.data && this.data.local_world) },
    canMove () {
      return Boolean(this.allowMove && !this.loading && this.data && this.data.local_world && this.data.companion !== 'missing' && this.source &&
        this.source.zone_id && (!this.selectedCorpse || !this.selectedCorpse.buried || this.canUnbury))
    },
    buriedBlocked () {
      return Boolean(this.allowMove && this.selectedCorpse && this.selectedCorpse.buried && !this.canUnbury && this.data.local_world &&
        this.data.companion !== 'missing')
    },
    // Why "Restore experience" is unavailable for the selected corpse, or ''.
    expBlocked () {
      const corpse = this.selectedCorpse
      const name = this.record.character
      if (!corpse) return 'Choose a corpse.'
      if (corpse.rezzed) return 'This corpse was already resurrected; its experience was returned then.'
      if (!(corpse.exp > 0)) return 'This corpse holds no experience.'
      if (!this.data.local_world) return 'Needs the game server this Spire runs beside'
      if (!this.liveFeatures.corpse_exp) return 'Needs the updated Player Support patch'
      const live = this.data.live_location
      if (!live) return `${name} must be in game to receive experience.`
      if (Number(live.zone_id) !== Number(corpse.location.zone_id) || Number(live.instance_id || 0) !== Number(corpse.location.instance_id || 0)) {
        return `Move the corpse to ${name} first. Experience is restored where the player is.`
      }
      return ''
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
    // Why the move button is not ready yet, beside it in the footer.
    destinationHint () {
      if (this.mode === 'move' && this.target === 'player') return 'Choose the player to move to.'
      if (this.mode === 'move' && this.target === 'coordinates') return 'Enter X, Y and Z, and a heading from 0 to 511.'
      return 'Choose a destination zone.'
    },
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
    tablistKeydown,
    onHide (event) {
      if (this.sending || this.expSending) {
        event.preventDefault()
        return
      }
      this.$emit('close')
    },
    // The reason is the one thing a move always needs: the destination starts
    // at the safe point of the zone the character is in.
    focusFirst () {
      if (this.data) this.focusInDialog(this.canMove && !touchLayout() ? '#recovery-reason' : '.recovery-tabs [aria-selected="true"]')
    },
    errorText (error, fallback) {
      const response = error.response
      if (response && response.status === 422) return 'Recovery is unavailable on this Spire server.'
      return (response && response.data && response.data.error) || fallback
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
        const first = !this.data
        this.data = data
        if (!data.corpses.some(corpse => corpse.id === this.selectedId)) this.selectedId = data.corpses.length ? data.corpses[0].id : null
        this.resetDraft()
        if (this.selectedCorpse) this.loadLoot(this.selectedCorpse)
        if (first) this.$nextTick(this.focusFirst)
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
      focusLater(() => this.$refs.reason)
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
        focusLater(() => this.$refs.playerSearch)
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
      focusLater(() => this.$refs.reason)
    },
    resetExp () {
      this.expOpen = false
      this.expReason = ''
      this.expError = ''
      this.expResult = null
    },
    openExp () {
      this.expOpen = true
      this.expError = ''
      focusLater(() => this.$refs.expReason)
    },
    closeExp () {
      this.expOpen = false
      this.expError = ''
      focusLater(() => this.$refs.expOpener)
    },
    async restoreExp () {
      const corpse = this.selectedCorpse
      if (!corpse || this.expSending || this.expBlocked) return
      if (!this.$refs.expReason.check()) return
      this.expSending = true
      this.expError = ''
      let receipt = null
      try {
        const { data, status } = await SpireApi.v1().put(`${this.endpoint}/corpses/${corpse.id}/experience`,
          { reason: this.expReason.trim(), request_id: newRequestId() }, { params: this.params })
        const unconfirmed = status === 202 || (data && data.status === 'unconfirmed')
        receipt = { status: unconfirmed ? 'unconfirmed' : (data && data.status) || 'sent', message: (data && data.message) || 'Experience restored.' }
        this.expResult = receipt
        this.expOpen = false
        this.expReason = ''
        if (!unconfirmed) this.$set(corpse, 'rezzed', true)
      } catch (error) {
        const response = error.response
        if (!response || (response.status >= 500 && response.status !== 503)) {
          receipt = { status: 'unconfirmed', message: `The game server did not confirm. Check ${this.record.character}’s experience before retrying.` }
          this.expResult = receipt
          this.expOpen = false
        } else {
          this.expError = this.errorText(error, 'The experience could not be restored.')
          if (response.status === 409) receipt = { status: 'failed', message: this.expError }
        }
      } finally {
        this.expSending = false
        if (receipt) this.$emit('receipt', receipt)
      }
    },
    changeMode (mode) {
      if (this.mode === mode) return
      this.resetExp()
      this.mode = mode
      this.resetDraft()
      if (this.selectedCorpse) this.loadLoot(this.selectedCorpse)
    },
    selectCorpse (id) {
      if (this.selectedId === id) return
      this.resetExp()
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
        if (version === this.lootVersion) this.items = (data && data.items) || []
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
        focusLater(() => this.$refs.zoneSearch)
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
      focusLater(() => this.$refs.reason)
    },
    choosePlayer () {
      this.toPlayer = true
      this.choosing = false
      this.moveError = ''
    },
    async move () {
      if (!this.canMove || this.sending || this.result || this.choosing || this.choosingPlayer || !this.destinationReady) return
      if (!this.$refs.reason.check()) return
      const reason = this.reason.trim()
      this.sending = true
      this.moveError = ''
      const requestId = newRequestId()
      try {
        const body = {
          corpse_id: this.selectedCorpse ? this.selectedCorpse.id : 0,
          source_zone: this.source.zone_id,
          source_instance: this.source.instance_id,
          destination: this.toPlayer ? 0 : this.destination.id,
          to_player: this.toPlayer,
          reason,
          request_id: requestId
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
          ? data
          : { ...data, status: 'unconfirmed' }
      } catch (error) {
        if (!error.response || (error.response.status >= 500 && error.response.status !== 503)) {
          this.result = { status: 'unconfirmed', message: 'The game server did not confirm the move. Check the target location before trying again.' }
        } else {
          this.moveError = this.errorText(error, 'Could not move the target.')
        }
      } finally {
        this.sending = false
        this.$emit('receipt', this.result)
        if (this.result) focusLater(() => this.dialogElement())
      }
    }
  }
}
</script>

<style>
/* Dialog chrome comes from support-theme.css (modal-class "support-modal"). The body is full-bleed so the tab bar and the corpse list can reach the edges. */
.support-modal.support-recovery-modal .modal-xl { max-width: min(930px, calc(100% - 32px)); }
.support-modal.support-recovery-modal .modal-body { padding: 0; }
</style>

<style scoped>
/* Layout only. Colours, type, radius and spacing come from support-theme.css. */
.recovery {
  /* Coin denominations keep a quiet metal tint; it carries meaning. */
  --recovery-coin-pp: #d3dde8;
  --recovery-coin-gp: #d8bd86;
  --recovery-coin-sp: #a9b5c1;
  --recovery-coin-cp: #c99a7e;
  color: var(--support-text);
}

/* Tab bar */
.recovery-bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--support-space-3);
  padding: 0 var(--support-space-4) 0 var(--support-space-5);
  border-bottom: 1px solid var(--support-border);
  background: var(--support-bg);
}
.recovery-tabs .support-count { margin-left: 2px; }
.recovery-status { margin: 0; padding: var(--support-space-2) 0; color: var(--support-muted); font-size: var(--support-text-sm); }
.recovery-banner { margin: var(--support-space-4) var(--support-space-5); }
.recovery-none { padding-top: var(--support-space-6); padding-bottom: var(--support-space-6); }

/* Corpse list */
.recovery-workspace.has-corpses { display: grid; grid-template-columns: minmax(200px, 1fr) minmax(0, 2.65fr); }
.recovery-list {
  position: sticky;
  top: var(--support-tab-height);
  display: grid;
  align-content: start;
  align-self: start;
  gap: var(--support-space-1);
  max-height: min(540px, calc(100vh - 220px));
  padding: var(--support-space-3);
  overflow: auto;
}
.recovery-workspace.has-corpses .recovery-detail { border-left: 1px solid var(--support-border); }
.recovery-corpse { gap: var(--support-space-1); }
.recovery-corpse:disabled { cursor: not-allowed; }
.recovery-corpse-line { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--support-space-1) var(--support-space-2); min-width: 0; }
.recovery-corpse-line strong { min-width: 0; overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.recovery-corpse-line.is-meta { color: var(--support-muted); font-size: var(--support-text-xs); }
.recovery-corpse-line.is-meta i { margin-right: 2px; }
.recovery-corpse-id { color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }

/* Detail column */
.recovery-detail { display: grid; gap: var(--support-space-4); min-width: 0; padding: var(--support-space-4) var(--support-space-5) var(--support-space-5); }

/* Source and destination: two equal cards with an arrow between them */
.recovery-positions { display: grid; align-items: stretch; gap: var(--support-space-2); }
.recovery-positions.has-move { grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); }
.recovery-position {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--support-space-2);
  min-width: 0;
  padding: var(--support-space-3) var(--support-space-4) var(--support-space-4);
  border: 1px solid var(--support-border);
  border-radius: var(--support-radius-lg);
  background: var(--support-pane);
}
.recovery-position h3,
.recovery-inventory h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--support-muted);
  font-family: inherit;
  font-size: var(--support-text-xs);
  font-weight: 600;
  letter-spacing: .06em;
  line-height: 1.3;
  text-transform: uppercase;
}
.recovery-position h3 i { font-size: 13px; }
.recovery-position-head { display: flex; align-items: center; gap: var(--support-space-2); min-width: 0; }
.recovery-destination h3 i { color: var(--support-accent); }
.recovery-position strong { color: var(--support-text); font-size: var(--support-text-lg); font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; }
.recovery-meta { display: inline-flex; align-items: center; gap: 6px; color: var(--support-muted); font-size: var(--support-text-sm); }
.recovery-coordinates { font-variant-numeric: tabular-nums; }
.recovery-direction {
  display: grid;
  place-items: center;
  align-self: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--support-border);
  border-radius: 50%;
  background: var(--support-bg);
  color: var(--support-muted);
  font-size: 14px;
}
.recovery-target-modes { width: 100%; }
.recovery-presets { align-items: center; }
.recovery-presets > span { margin-right: 2px; color: var(--support-muted); font-size: var(--support-text-xs); }
.recovery-destination-value { display: grid; justify-items: start; gap: 2px; min-width: 0; }
.recovery-destination-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; padding-top: var(--support-space-1); }

/* Search panels and the coordinates form */
.recovery-panel {
  min-width: 0;
  margin: 0;
  padding: var(--support-space-3) var(--support-space-4) var(--support-space-4);
  border: 1px solid var(--support-border);
  border-radius: var(--support-radius-lg);
  background: var(--support-pane);
}
.recovery-panel-label { margin-top: 0; }
.recovery-results { display: grid; gap: var(--support-space-1); max-height: 200px; margin-top: var(--support-space-2); overflow: auto; }
.recovery-results .support-option { grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: var(--support-space-3); }
.recovery-results .support-option strong { display: flex; align-items: center; min-width: 0; font-weight: 600; overflow-wrap: anywhere; }
.recovery-results .support-option > span { color: var(--support-muted); font-size: var(--support-text-xs); text-align: right; }
.recovery-online { flex: none; width: 7px; height: 7px; margin-right: var(--support-space-2); border-radius: 50%; box-shadow: inset 0 0 0 1px var(--support-faint); }
.recovery-online.is-online { background: var(--support-success); box-shadow: none; }

.recovery-coordinates-form legend {
  /* Floated so the legend sits inside the panel like the other panel labels, not on its border. */
  float: left;
  width: 100%;
  margin: 0 0 var(--support-space-2);
  padding: 0;
  color: var(--support-text-secondary);
  font-size: var(--support-text-sm);
  font-weight: 600;
  line-height: 1.4;
}
.recovery-coordinate-grid { clear: both; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--support-space-2); }
.recovery-coordinate-grid label { display: grid; gap: var(--support-space-1); margin: 0; }
.recovery-coordinate-grid label > span { color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600; }
.recovery-coordinate-grid input { font-variant-numeric: tabular-nums; }
.recovery-loc-row { display: flex; gap: var(--support-space-2); margin-top: var(--support-space-3); }
.recovery-loc-row input { flex: 1; min-width: 0; }
.recovery-loc-row button { flex: none; min-height: 34px; }

/* Corpse inventory */
.recovery-inventory { display: grid; gap: var(--support-space-2); padding-top: var(--support-space-4); border-top: 1px solid var(--support-border-subtle); }
.recovery-inventory-header,
.recovery-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.recovery-inventory-header { justify-content: space-between; }
.recovery-coins { display: flex; flex-wrap: wrap; gap: var(--support-space-4); color: var(--support-text-secondary); font-size: var(--support-text-sm); font-variant-numeric: tabular-nums; }
.recovery-coins > span { display: inline-flex; align-items: center; gap: 6px; }
.recovery-coins > span::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.recovery-coins > .coin-pp::before { background: var(--recovery-coin-pp); }
.recovery-coins > .coin-gp::before { background: var(--recovery-coin-gp); }
.recovery-coins > .coin-sp::before { background: var(--recovery-coin-sp); }
.recovery-coins > .coin-cp::before { background: var(--recovery-coin-cp); }
.recovery-loot {
  max-height: 200px;
  margin: 0;
  padding: 0;
  overflow: auto;
  border: 1px solid var(--support-border);
  border-radius: var(--support-radius);
  background: var(--support-sunken);
  list-style: none;
}
.recovery-loot li { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: var(--support-space-2); padding: 6px 10px; }
.recovery-loot li + li { border-top: 1px solid var(--support-border-subtle); }
.recovery-loot li > .fe { color: var(--support-faint); text-align: center; }
.recovery-loot strong { min-width: 0; overflow: hidden; color: var(--support-text); font-size: var(--support-text-sm); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.recovery-loot li span { color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }

/* Experience on the corpse */
.recovery-exp { display: grid; gap: var(--support-space-3); padding: var(--support-space-3) var(--support-space-4); border: 1px solid var(--support-border); border-radius: var(--support-radius-lg); background: var(--support-pane); }
.recovery-exp-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--support-space-2) var(--support-space-3); }
.recovery-exp-text { display: grid; flex: 1; gap: 2px; min-width: 200px; }
.recovery-exp-text strong { display: inline-flex; align-items: center; gap: 6px; color: var(--support-text); font-size: var(--support-text-sm); font-weight: 600; font-variant-numeric: tabular-nums; }
.recovery-exp-text strong i { color: var(--support-muted); }
.recovery-exp-text small { color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.45; }
.recovery-exp-form { display: grid; padding-top: var(--support-space-3); border-top: 1px solid var(--support-border-subtle); }
.recovery-exp-lead { margin: 0 0 var(--support-space-3); color: var(--support-text-secondary); font-size: var(--support-text-sm); line-height: 1.5; }
.recovery-exp-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--support-space-2); margin-top: var(--support-space-2); }
.recovery-exp > .support-callout { margin: 0; }

/* Hint under the /loc paste */
.recovery-hint { margin-top: 6px; color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.recovery-hint.is-short { color: var(--support-warning); }

@media (max-width: 600px) {
  .recovery-bar { padding-left: var(--support-space-3); padding-right: var(--support-space-2); }
  .recovery-banner { margin-left: var(--support-space-3); margin-right: var(--support-space-3); }
  .recovery-workspace.has-corpses { grid-template-columns: minmax(0, 1fr); }
  .recovery-list { position: static; max-height: 150px; border-bottom: 1px solid var(--support-border); }
  .recovery-workspace.has-corpses .recovery-detail { border-left: 0; }
  .recovery-detail { padding: var(--support-space-3); }
  .recovery-position,
  .recovery-panel { padding: var(--support-space-3); }
  /* Stack the source and destination so the destination switch has room. */
  .recovery-positions.has-move { grid-template-columns: minmax(0, 1fr); }
  .recovery-direction { justify-self: center; transform: rotate(90deg); }
  .recovery-coordinate-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .recovery-loc-row { flex-wrap: wrap; }
}
</style>
