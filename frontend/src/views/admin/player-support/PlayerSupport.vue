<template>
  <section class="player-support" aria-labelledby="player-support-title">
    <header class="support-header">
      <div class="support-title">
        <span class="support-mark"><i class="fe fe-life-buoy" aria-hidden="true"></i></span>
        <div>
          <h1 id="player-support-title">Player Support</h1>
          <p>Work in-game petitions with notes, tells, mail, parcels and recovery in one place.</p>
        </div>
      </div>
      <div class="support-header-actions">
        <span class="support-live" :title="'Queue refreshes every 12 seconds' + (refreshedAt ? ' · last updated ' + clock(refreshedAt) : '')">
          <span class="support-live-dot" aria-hidden="true"></span> Live
        </span>
        <button type="button" class="support-button" :disabled="queueLoading || busy" @click="refresh">
          <i class="fe fe-refresh-cw" :class="{ 'is-spinning': queueLoading && !backgroundLoading }" aria-hidden="true"></i> Refresh
        </button>
      </div>
    </header>

    <transition name="support-fade">
      <div v-if="notice" class="support-notice" :class="{ 'is-error': notice.error }" :role="notice.error ? 'alert' : 'status'">
        <i :class="notice.error ? 'fe fe-alert-circle' : 'fe fe-check-circle'" aria-hidden="true"></i>
        <span>{{ notice.text }}</span>
        <button type="button" aria-label="Dismiss notification" class="support-icon" @click="dismissNotice"><i class="fe fe-x" aria-hidden="true"></i></button>
      </div>
    </transition>

    <div class="support-workspace" :class="{ 'show-case': mobileDetail }">
      <aside class="support-queue" aria-label="Petition queue">
        <div class="support-queue-controls">
          <div class="support-section-title">
            <h2>Petitions</h2>
            <span class="support-count" :aria-label="total + ' petitions'">{{ total }}</span>
          </div>
          <label class="support-search">
            <i class="fe fe-search" aria-hidden="true"></i>
            <input v-model="search" type="search" maxlength="200" placeholder="Character, account or text" aria-label="Search petitions" @input="scheduleSearch">
          </label>
          <div class="support-filters" role="group" aria-label="Filter petitions">
            <button v-for="option in filters" :key="option.id" type="button" :aria-pressed="filter === option.id" @click="setFilter(option.id)">
              {{ option.label }}
            </button>
          </div>
        </div>
        <div v-if="queueLoading && !cases.length" class="support-empty" role="status">
          <span class="support-skeleton" v-for="n in 3" :key="n" aria-hidden="true"></span>
          <span class="sr-only">Loading petitions…</span>
        </div>
        <div v-else-if="!cases.length" class="support-empty">
          <i :class="queueError ? 'fe fe-cloud-off' : 'fe fe-inbox'" aria-hidden="true"></i>
          <strong>{{ queueError ? 'Petitions unavailable' : emptyTitle }}</strong>
          <span>{{ queueError ? 'Check the server connection, then refresh.' : emptyHint }}</span>
        </div>
        <ul v-else ref="caseList" class="support-case-list" @keydown.up.prevent="moveFocus(-1)" @keydown.down.prevent="moveFocus(1)">
          <li v-for="item in cases" :key="item.key">
            <button type="button" class="support-case-row" :class="['urgency-' + Math.min(item.urgency || 0, 2), { 'is-selected': selectedKey === item.key }]"
                    :aria-current="selectedKey === item.key ? 'true' : null" :disabled="busy" @click="selectCase(item.key)">
              <span class="support-row-top">
                <strong>{{ item.character }}</strong>
                <span class="support-presence is-small" :class="'presence-' + (item.account_presence || 'unknown')"
                      :title="'Account ' + presenceLabel(item.account_presence).toLowerCase()">{{ presenceLabel(item.account_presence) }}</span>
                <time :datetime="dateTime(item.submitted_at)" :title="formatDate(item.submitted_at)">{{ age(item.submitted_at) }}</time>
              </span>
              <span class="support-case-snippet">{{ item.message }}</span>
              <span class="support-row-bottom">
                <span class="support-chip" :class="'status-' + item.status">{{ statusLabel(item.status) }}</span>
                <span v-if="item.urgency > 0" class="support-chip is-urgent"><i class="fe fe-flag" aria-hidden="true"></i> {{ urgency(item.urgency) }}</span>
                <span v-if="item.owner" class="support-row-owner" :class="{ 'is-mine': item.mine }" :title="'Assigned to ' + item.owner">
                  <span class="support-avatar" aria-hidden="true">{{ initial(item.owner) }}</span>{{ item.mine ? 'You' : item.owner }}
                </span>
              </span>
            </button>
          </li>
        </ul>
        <div v-if="page > 1 || total > 30" class="support-pagination" aria-label="Queue pages">
          <button type="button" class="support-icon" aria-label="Previous page" :disabled="page === 1 || queueLoading" @click="changePage(-1)"><i class="fe fe-chevron-left" aria-hidden="true"></i></button>
          <span>Page {{ page }} of {{ Math.ceil(total / 30) || 1 }}</span>
          <button type="button" class="support-icon" aria-label="Next page" :disabled="page * 30 >= total || queueLoading" @click="changePage(1)"><i class="fe fe-chevron-right" aria-hidden="true"></i></button>
        </div>
      </aside>

      <main class="support-thread" aria-label="Petition detail">
        <button v-if="mobileDetail" type="button" class="support-button support-back" @click="backToQueue"><i class="fe fe-arrow-left" aria-hidden="true"></i> Petitions</button>
        <div v-if="detailLoading && !record" class="support-placeholder" role="status">
          <i class="fe fe-loader is-spinning" aria-hidden="true"></i><span>Loading petition…</span>
        </div>
        <div v-else-if="!record" class="support-placeholder">
          <i :class="detailError ? 'fe fe-alert-circle' : 'fe fe-inbox'" aria-hidden="true"></i>
          <strong>{{ detailError ? 'Petition unavailable' : 'Select a petition' }}</strong>
          <span>{{ detailError ? 'It may have been removed in-game. Refresh the queue.' : 'Choose a petition from the queue to see its history.' }}</span>
        </div>
        <template v-else>
          <div class="support-thread-header">
            <div class="support-case-meta">
              <span class="support-case-number">Case #{{ caseNumber }}</span>
              <span class="support-chip" :class="'status-' + record.status">{{ statusLabel(record.status) }}</span>
              <span v-if="record.urgency > 0" class="support-chip is-urgent"><i class="fe fe-flag" aria-hidden="true"></i> {{ urgency(record.urgency) }}</span>
            </div>
            <div class="support-thread-heading">
              <div class="support-identity">
                <h2>{{ record.character }}</h2>
                <span v-if="record.character_presence" class="support-presence" :class="'presence-' + record.character_presence">
                  {{ characterPresenceLabel(record.character_presence) }}
                </span>
              </div>
              <div class="support-heading-actions">
                <button v-if="canWrite && record.status !== 'resolved' && !record.owner" class="support-button is-primary" type="button" :disabled="busy" @click="updateCase('claim')">
                  <i class="fe fe-user-check" aria-hidden="true"></i> Claim case
                </button>
                <button v-if="canWrite && record.status !== 'resolved' && record.mine" class="support-button" type="button" :disabled="busy" @click="updateCase('release')">
                  <i class="fe fe-user-minus" aria-hidden="true"></i> Release
                </button>
                <button v-if="canWrite && record.status === 'resolved'" class="support-button" type="button" :disabled="busy" @click="updateCase('reopen')">
                  <i class="fe fe-rotate-ccw" aria-hidden="true"></i> Reopen
                </button>
              </div>
            </div>
            <p class="support-subline">
              Filed {{ age(record.submitted_at, true) }} from <strong>{{ record.zone_name || record.zone || 'an unknown zone' }}</strong>
              · account <strong>{{ record.account }}</strong>
              <template v-if="record.owner"> · assigned to <strong>{{ record.mine ? 'you' : record.owner }}</strong></template>
            </p>
            <div class="support-thread-tabs" role="group" aria-label="Case view">
              <button type="button" :aria-pressed="!chatOpen" @click="showTimeline">
                <i class="fe fe-list" aria-hidden="true"></i> Timeline <span class="support-tab-count">{{ activity.length + 1 }}</span>
              </button>
              <button type="button" :aria-pressed="chatOpen" @click="chatOpen = true"><i class="fe fe-message-circle" aria-hidden="true"></i> Live chat</button>
            </div>
          </div>

          <div v-if="caseBanner" class="support-banner" :class="'is-' + caseBanner.tone" role="note">
            <i :class="caseBanner.icon" aria-hidden="true"></i><span>{{ caseBanner.text }}</span>
          </div>

          <support-live-chat v-if="chatOpen" :key="selectedKey" :record="record" :connection-id="connectionId" :can-write="canWrite && record.status !== 'resolved'" />
          <div v-else ref="timeline" class="support-timeline">
            <article class="support-event support-original">
              <span class="support-event-icon"><i class="fe fe-message-square" aria-hidden="true"></i></span>
              <div class="support-event-body">
                <div class="support-event-heading"><h3>Original petition <span>· {{ record.character }}</span></h3><time :datetime="dateTime(record.submitted_at)">{{ formatDate(record.submitted_at) }}</time></div>
                <p>{{ record.message }}</p>
              </div>
            </article>
            <article v-if="record.native_note" class="support-event kind-native">
              <span class="support-event-icon"><i class="fe fe-file-text" aria-hidden="true"></i></span>
              <div class="support-event-body"><div class="support-event-heading"><h3>In-game GM note <span v-if="record.last_gm">· {{ record.last_gm }}</span></h3></div><p>{{ record.native_note }}</p></div>
            </article>
            <template v-for="entry in timeline">
              <div v-if="entry.day" :key="'day-' + entry.key" class="support-day" role="separator"><span>{{ entry.day }}</span></div>
              <article :key="entry.key" class="support-event" :class="['kind-' + entry.kind, { 'is-compact': entry.compact }]">
                <span class="support-event-icon"><i :class="eventIcon(entry.kind)" aria-hidden="true"></i></span>
                <div class="support-event-body">
                  <div class="support-event-heading">
                    <h3>{{ eventTitle(entry.kind) }} <span>· {{ entry.actor }}</span></h3>
                    <time :datetime="entry.created_at" :title="formatDate(entry.created_at)">{{ clock(entry.created_at) }}</time>
                  </div>
                  <p v-if="entry.body">{{ entry.body }}</p>
                  <p v-if="entry.detail" class="support-event-detail">{{ entry.detail }}</p>
                  <div v-if="(entry.delivery && entry.delivery !== 'sent') || (entry.receipt && entry.receipt.length)" class="support-event-tags">
                    <span v-if="entry.delivery && entry.delivery !== 'sent'" class="support-chip" :class="'delivery-' + entry.delivery">{{ deliveryLabel(entry.delivery) }}</span>
                    <span v-if="entry.receipt && entry.receipt.length" class="support-receipt">Receipt {{ entry.receipt.map(id => '#' + id).join(', ') }}</span>
                  </div>
                </div>
              </article>
            </template>
          </div>

          <form v-if="canWrite && !chatOpen" class="support-note" @submit.prevent="updateCase('note')">
            <label for="support-note"><i class="fe fe-lock" aria-hidden="true"></i> Private staff note</label>
            <textarea id="support-note" v-model="note" rows="2" maxlength="8000" :disabled="busy"
                      placeholder="Only staff can see notes. The player is not notified."
                      @keydown.enter.ctrl.exact.prevent="updateCase('note')" @keydown.enter.meta.exact.prevent="updateCase('note')"></textarea>
            <div class="support-note-actions">
              <span class="support-hint"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> to add</span>
              <button type="submit" class="support-button" :disabled="!note.trim() || busy">Add note</button>
            </div>
          </form>
        </template>
      </main>

      <aside v-if="record" class="support-inspector" aria-label="Character and actions">
        <section>
          <h2>Character</h2>
          <div class="support-character-card">
            <span class="support-avatar is-large" aria-hidden="true">{{ initial(record.character) }}</span>
            <div>
              <strong>{{ record.character }}</strong>
              <span>{{ characterPresenceLabel(record.character_presence || record.account_presence) }}</span>
            </div>
          </div>
          <dl>
            <dt>Account</dt><dd>{{ record.account }}</dd>
            <dt>Filed from</dt><dd>{{ record.zone_name || record.zone || 'Unknown zone' }}</dd>
            <dt>Assigned to</dt><dd>{{ record.owner || 'Unassigned' }}</dd>
            <dt>In-game petition</dt><dd>{{ record.checked_out ? 'Checked out' : record.native_open ? '#' + record.petition_id : 'Cleared' }}</dd>
          </dl>
          <nav v-if="record.character_id" class="support-related" aria-label="Character tools">
            <div v-if="canMove || canInspectRecovery" class="support-tool-row">
              <button v-if="canMove" type="button" class="support-button" :disabled="busy" @click="delivery = 'move'">
                <i class="fe fe-navigation" aria-hidden="true"></i> Move character
              </button>
              <button v-if="canInspectRecovery" type="button" class="support-button" :disabled="busy" @click="delivery = 'corpses'">
                <i class="fe fe-archive" aria-hidden="true"></i> Corpses
              </button>
            </div>
            <router-link v-for="link in characterLinks" :key="link.name" :to="link.to">
              <i :class="link.icon" aria-hidden="true"></i> {{ link.name }} <i class="fe fe-arrow-up-right" aria-hidden="true"></i>
            </router-link>
          </nav>
        </section>
        <section v-if="canWrite && record.status !== 'resolved'" class="support-actions">
          <h2>Respond</h2>
          <button v-if="canDeliver" type="button" class="support-button is-primary" :disabled="busy" @click="delivery = 'reply'">
            <i class="fe fe-mail" aria-hidden="true"></i> Reply by mail
          </button>
          <button v-if="canParcel" type="button" class="support-button" :disabled="busy" @click="delivery = 'parcel'">
            <i class="fe fe-package" aria-hidden="true"></i> Send parcel
          </button>
          <button type="button" class="support-button" :disabled="busy" @click="chatOpen = true">
            <i class="fe fe-message-circle" aria-hidden="true"></i> Open live chat
          </button>
          <h2 class="support-actions-divider">Status</h2>
          <button v-if="record.status === 'open'" type="button" class="support-button" :disabled="busy" @click="updateCase('wait')">
            <i class="fe fe-clock" aria-hidden="true"></i> Wait for player
          </button>
          <button v-else type="button" class="support-button" :disabled="busy" @click="updateCase('reopen')">
            <i class="fe fe-play" aria-hidden="true"></i> Resume case
          </button>
          <button type="button" class="support-button is-success" :disabled="busy" @click="confirmResolve">
            <i class="fe fe-check-circle" aria-hidden="true"></i> Resolve case
          </button>
        </section>
      </aside>
    </div>

    <support-mail-reply v-if="delivery === 'reply' && record" :record="record" :connection-id="connectionId"
                        @close="delivery = null" @sent="deliverySent('reply')" @reconcile="loadDetail(selectedKey)" />
    <gm-parcel-composer v-if="delivery === 'parcel' && record" :key="record.key"
                        :recipient="{ id: record.character_id, name: record.character }"
                        :case-key="record.key" :connection-id="connectionId"
                        @close="delivery = null" @sent="deliverySent('parcel')" @reconcile="loadDetail(selectedKey)" />
    <support-recovery v-if="(delivery === 'move' || delivery === 'corpses') && record" :key="record.key"
                      :record="record" :connection-id="connectionId" :initial-mode="delivery" :allow-move="canMove"
                      @close="delivery = null" @receipt="recoveryReceipt" />
    <b-modal v-model="resolveOpen" modal-class="support-modal" title="Resolve case" centered
             ok-title="Resolve case" ok-variant="success" cancel-variant="outline-light" @shown="$refs.resolution && $refs.resolution.focus()"
             @ok="updateCase('resolve')">
      <p class="support-modal-lead">Resolve <strong>{{ record ? record.character : '' }}</strong>’s case in Spire?</p>
      <label for="support-resolution">Resolution summary <span>(optional)</span></label>
      <textarea id="support-resolution" ref="resolution" v-model="resolution" class="form-control" rows="3" maxlength="8000"
                placeholder="What was done? This is added to the case timeline."></textarea>
      <p v-if="record && record.native_open" class="support-modal-hint">
        <i class="fe fe-info" aria-hidden="true"></i> Clear petition #{{ record.petition_id }} in-game after resolving it here.
      </p>
    </b-modal>
  </section>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { canReadAdminApi, canWriteAdminApi } from '@/app/user/server-admin-access'
import { ROUTE } from '@/routes'
import SupportMailReply from './SupportMailReply.vue'
import GmParcelComposer from '../mail-parcels/GMParcelComposer.vue'
import SupportLiveChat from './SupportLiveChat.vue'
import SupportRecovery from './SupportRecovery.vue'

const endpoint = 'player-support/cases'
const titles = {
  note: 'Private note', reply: 'Mail sent', parcel: 'Parcel sent', pending: 'Delivery unverified',
  chat_in: 'Player tell', chat_out: 'Game Master tell', chat_on: 'Messages on', chat_off: 'Messages off',
  character_move: 'Character move', corpse_move: 'Corpse move',
  claim: 'Claimed', release: 'Released', wait: 'Waiting for player', resolve: 'Resolved', reopen: 'Reopened'
}
const icons = {
  note: 'fe fe-lock', reply: 'fe fe-mail', parcel: 'fe fe-package', pending: 'fe fe-alert-triangle',
  chat_in: 'fe fe-corner-down-right', chat_out: 'fe fe-send', chat_on: 'fe fe-toggle-right', chat_off: 'fe fe-toggle-left',
  character_move: 'fe fe-navigation', corpse_move: 'fe fe-archive',
  claim: 'fe fe-user-check', release: 'fe fe-user-minus', wait: 'fe fe-clock', resolve: 'fe fe-check-circle', reopen: 'fe fe-rotate-ccw'
}
// Status changes carry a fixed first line; anything after it is the GM's summary.
const statusKinds = ['claim', 'release', 'wait', 'resolve', 'reopen', 'chat_on', 'chat_off']

export default {
  name: 'PlayerSupport',
  components: { SupportMailReply, GmParcelComposer, SupportLiveChat, SupportRecovery },
  data () {
    return {
      filters: [{ id: 'open', label: 'Active' }, { id: 'mine', label: 'Mine' }, { id: 'unassigned', label: 'Unassigned' }, { id: 'resolved', label: 'Resolved' }],
      filter: 'open', search: '', page: 1, total: 0, cases: [], connectionId: null, selectedKey: '', record: null, activity: [],
      queueLoading: false, backgroundLoading: false, detailLoading: false, queueError: false, detailError: false, queueVersion: 0, detailVersion: 0,
      mobileDetail: false, searchTimer: null, presenceTimer: null, noticeTimer: null, busy: false, note: '', notice: null, delivery: null,
      resolveOpen: false, resolution: '', chatOpen: false, refreshedAt: null
    }
  },
  computed: {
    canWrite () { return canWriteAdminApi(endpoint) },
    hasRecipient () { return this.record && this.record.character_id && !this.record.checked_out },
    canDeliver () { return this.hasRecipient && canWriteAdminApi('mail-parcels-editor/mail/send') },
    canParcel () {
      return this.hasRecipient && canWriteAdminApi('mail-parcels-editor/parcel/send') && canReadAdminApi('mail-parcels-editor/items')
    },
    canInspectRecovery () {
      return this.record && this.record.character_id && canReadAdminApi('player-operations')
    },
    canMove () {
      return Boolean(this.canInspectRecovery && this.hasRecipient && this.canWrite && this.record.status !== 'resolved' &&
        canWriteAdminApi('player-operations/character/0/relocate'))
    },
    caseNumber () { return this.record ? this.record.key.split('-')[0] : '' },
    characterLinks () {
      const id = String(this.record.character_id)
      return [
        { name: 'Player Operations', icon: 'fe fe-user', path: ROUTE.ADMIN_PLAYER_OPERATIONS, query: { character: id }, api: 'player-operations' },
        { name: 'Inventory & Keyring', icon: 'fe fe-briefcase', path: ROUTE.ADMIN_INVENTORY_KEYRING, query: { character: id }, api: 'inventory-keyring' },
        { name: 'Player Event Logs', icon: 'fe fe-list', path: ROUTE.ADMIN_TOOL_PLAYER_EVENT_LOGS, query: { characterId: id }, api: 'player_event_logs' }
      ].filter(link => canReadAdminApi(link.api)).map(link => ({ ...link, to: { path: link.path, query: link.query } }))
    },
    // Explains why actions are missing instead of hiding them silently.
    caseBanner () {
      const record = this.record
      if (!record) return null
      if (record.status === 'resolved') {
        return { tone: 'success', icon: 'fe fe-check-circle', text: 'This case is resolved. Reopen it to reply, send parcels, or move the character.' }
      }
      if (record.checked_out) {
        return { tone: 'warning', icon: 'fe fe-lock', text: `Checked out in-game${record.last_gm ? ' by ' + record.last_gm : ''}. Mail, parcels, chat and moves are paused until it is checked back in.` }
      }
      if (!record.character_id) {
        return { tone: 'warning', icon: 'fe fe-user-x', text: 'The petitioning character was renamed, moved or deleted, so character tools are unavailable.' }
      }
      if (!record.native_open) {
        return { tone: 'info', icon: 'fe fe-info', text: 'The in-game petition was cleared. Live chat is off; resolve the case here when you are done.' }
      }
      return null
    },
    timeline () {
      let previousDay = this.dayLabel(this.record.submitted_at * 1000)
      let previous = null
      return this.activity.map(entry => {
        const day = this.dayLabel(entry.created_at)
        const [first, ...rest] = String(entry.text || '').split('\n')
        const status = statusKinds.includes(entry.kind)
        const delivery = ['parcel', 'pending', 'character_move', 'corpse_move'].includes(entry.kind)
        const chat = entry.kind === 'chat_in' || entry.kind === 'chat_out'
        const view = {
          ...entry,
          day: day !== previousDay ? day : '',
          body: status ? rest.join('\n') : delivery ? first : entry.text,
          detail: delivery ? rest.join('\n') : '',
          // Consecutive tells from the same side read as one exchange.
          compact: chat && previous && previous.kind === entry.kind && previous.actor === entry.actor && day === previousDay
        }
        previousDay = day
        previous = entry
        return view
      })
    },
    emptyTitle () {
      if (this.search.trim()) return 'No matching petitions'
      return { mine: 'Nothing assigned to you', unassigned: 'Every petition has an owner', resolved: 'No resolved cases yet' }[this.filter] || 'No active petitions'
    },
    emptyHint () {
      if (this.search.trim()) return 'Try a character, account, or a phrase from the petition.'
      return { mine: 'Claim a case to see it here.', resolved: 'Resolved cases are kept here for reference.' }[this.filter] ||
        'Petitions players file with /guidehelp or #petition appear here automatically.'
    }
  },
  watch: {
    '$route.query.case' (key) {
      if (this.connectionId !== null && key && key !== this.selectedKey) {
        this.mobileDetail = true
        this.openCase(key)
      }
    },
    notice (value) {
      clearTimeout(this.noticeTimer)
      if (value && !value.error) this.noticeTimer = setTimeout(() => { this.notice = null }, 6000)
    },
    resolveOpen (open) {
      if (open) this.resolution = ''
    }
  },
  created () {
    this.mobileDetail = Boolean(this.$route.query.case)
    this.loadQueue(true)
    this.presenceTimer = setInterval(this.backgroundRefresh, 12000)
  },
  beforeDestroy () {
    clearTimeout(this.searchTimer)
    clearTimeout(this.noticeTimer)
    clearInterval(this.presenceTimer)
    this.queueVersion++
    this.detailVersion++
  },
  methods: {
    statusLabel (status) { return { open: 'Open', waiting: 'Waiting', resolved: 'Resolved' }[status] || 'Open' },
    presenceLabel (status) { return { online: 'Online', offline: 'Offline' }[status] || 'Unknown' },
    characterPresenceLabel (status) { return { online: 'In game', offline: 'Not in game' }[status] || 'Presence unknown' },
    deliveryLabel (status) { return { pending: 'Sending', failed: 'Failed', unconfirmed: 'Unconfirmed' }[status] || status },
    urgency (value) { return value > 1 ? 'Urgent' : 'Elevated' },
    eventTitle (kind) { return titles[kind] || 'Case updated' },
    eventIcon (kind) { return icons[kind] || 'fe fe-activity' },
    initial (name) { return String(name || '?').trim().charAt(0).toUpperCase() || '?' },
    dateTime (value) { return new Date(value * 1000).toISOString() },
    toDate (value) { return new Date(typeof value === 'number' ? value * 1000 : value) },
    formatDate (value) {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(this.toDate(value))
    },
    clock (value) {
      return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(value instanceof Date ? value : new Date(value))
    },
    dayLabel (value) {
      const date = new Date(value)
      const today = new Date()
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
      if (date.toDateString() === today.toDateString()) return 'Today'
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
      return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' }).format(date)
    },
    age (value, long = false) {
      const minutes = Math.max(0, Math.floor((Date.now() / 1000 - value) / 60))
      if (minutes < 1) return long ? 'just now' : 'Now'
      const [amount, unit] = minutes < 60 ? [minutes, 'm'] : minutes < 1440 ? [Math.floor(minutes / 60), 'h'] : [Math.floor(minutes / 1440), 'd']
      if (!long) return amount + unit
      const word = { m: 'minute', h: 'hour', d: 'day' }[unit]
      return `${amount} ${word}${amount === 1 ? '' : 's'} ago`
    },
    errorText (error) {
      return (error.response && error.response.data && error.response.data.error) || error.message || 'Request failed'
    },
    dismissNotice () { this.notice = null },
    moveFocus (direction) {
      const rows = Array.from(this.$refs.caseList ? this.$refs.caseList.querySelectorAll('.support-case-row') : [])
      const index = rows.indexOf(document.activeElement)
      const next = rows[Math.max(0, Math.min(rows.length - 1, index + direction))]
      if (next) next.focus()
    },
    backgroundRefresh () {
      if (document.hidden || this.busy || this.queueLoading || this.searchTimer) return
      this.loadQueue(false, true)
      // Pick up notes, deliveries and status changes made by other staff.
      if (this.record && !this.chatOpen && !this.delivery && !this.resolveOpen && !this.detailLoading) {
        this.loadDetail(this.selectedKey, true)
      }
    },
    async loadQueue (initial = false, background = false) {
      const version = ++this.queueVersion
      this.queueLoading = true
      this.backgroundLoading = background
      this.queueError = false
      try {
        const { data } = await SpireApi.v1().get(endpoint, { params: { filter: this.filter, q: this.search.trim(), page: this.page } })
        if (version !== this.queueVersion) return
        if (this.connectionId !== null && this.connectionId !== data.connection_id) {
          this.record = null
          this.selectedKey = ''
          this.activity = []
          this.delivery = null
          this.resolveOpen = false
          this.chatOpen = false
          this.note = ''
          this.mobileDetail = false
          this.detailVersion++
          this.$router.replace({ path: this.$route.path, query: {} }).catch(() => {})
        }
        this.connectionId = data.connection_id
        this.cases = data.cases || []
        this.total = data.total || 0
        this.refreshedAt = new Date()
        if (!this.selectedKey) {
          const key = (initial && this.$route.query.case) || (this.cases[0] && this.cases[0].key)
          if (key) await this.openCase(key)
        }
      } catch (error) {
        if (version === this.queueVersion) {
          if (background) {
            this.cases = this.cases.map(item => ({ ...item, account_presence: 'unknown' }))
            return
          }
          this.queueError = true
          this.notice = { error: true, text: this.errorText(error) }
        }
      } finally {
        if (version === this.queueVersion) {
          this.queueLoading = false
          this.backgroundLoading = false
        }
      }
    },
    async loadDetail (key, background = false) {
      if (!key) return
      const version = ++this.detailVersion
      if (!background) this.detailLoading = true
      this.detailError = false
      try {
        const { data } = await SpireApi.v1().get(endpoint + '/' + encodeURIComponent(key), { params: { connection_id: this.connectionId } })
        if (version !== this.detailVersion) return
        const timeline = this.$refs.timeline
        const following = timeline && timeline.scrollHeight - timeline.scrollTop - timeline.clientHeight < 60
        const grew = (data.activity || []).length > this.activity.length
        this.record = data.case
        this.activity = data.activity || []
        if (!background || (following && grew)) this.$nextTick(this.scrollTimeline)
      } catch (error) {
        if (version === this.detailVersion && !background) {
          this.detailError = true
          this.record = null
          this.activity = []
          this.notice = { error: true, text: this.errorText(error) }
        }
      } finally {
        if (version === this.detailVersion) this.detailLoading = false
      }
    },
    scrollTimeline () {
      const timeline = this.$refs.timeline
      if (timeline) timeline.scrollTop = timeline.scrollHeight
    },
    openCase (key) {
      this.selectedKey = key
      this.record = null
      this.activity = []
      this.note = ''
      this.delivery = null
      this.chatOpen = false
      return this.loadDetail(key)
    },
    selectCase (key) {
      this.mobileDetail = true
      this.notice = null
      if (key !== this.selectedKey || !this.record) this.openCase(key)
      this.$router.replace({ path: this.$route.path, query: { case: key } }).catch(() => {})
    },
    async refresh () {
      this.notice = null
      await this.loadQueue()
      if (this.selectedKey) await this.loadDetail(this.selectedKey)
    },
    scheduleSearch () {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        this.searchTimer = null
        this.page = 1
        this.loadQueue()
      }, 250)
    },
    setFilter (filter) {
      if (this.filter === filter) return
      clearTimeout(this.searchTimer)
      this.searchTimer = null
      this.filter = filter
      this.page = 1
      this.loadQueue()
    },
    changePage (direction) {
      this.page += direction
      this.loadQueue()
    },
    confirmResolve () { this.resolveOpen = true },
    showTimeline () {
      if (!this.chatOpen) return
      this.chatOpen = false
      this.loadDetail(this.selectedKey)
    },
    backToQueue () {
      this.mobileDetail = false
      this.showTimeline()
    },
    async updateCase (action) {
      if (!this.record || this.busy || !this.canWrite) return
      if (action === 'note' && !this.note.trim()) return
      const key = this.selectedKey
      const text = action === 'note' ? this.note.trim() : action === 'resolve' ? this.resolution.trim() : ''
      this.busy = true
      this.notice = null
      try {
        await SpireApi.v1().patch(endpoint + '/' + encodeURIComponent(key), {
          action, text, revision: this.record.revision
        }, { params: { connection_id: this.connectionId } })
        if (action === 'note') this.note = ''
        if (action === 'resolve') this.notice = { error: false, text: `${this.record.character}’s case resolved` }
        await Promise.all([this.loadQueue(), this.loadDetail(key)])
      } catch (error) {
        this.notice = { error: true, text: this.errorText(error) }
        if (error.response && error.response.status === 409) await this.loadDetail(key)
      } finally {
        this.busy = false
      }
    },
    async deliverySent (kind) {
      if (kind === 'reply') this.delivery = null
      this.notice = { error: false, text: kind === 'parcel' ? 'Parcel queued for delivery' : 'Reply sent' }
      await this.loadDetail(this.selectedKey)
    },
    async recoveryReceipt (result) {
      if (result) this.notice = { error: ['unconfirmed', 'moved_arrival_unconfirmed', 'moved_notice_unavailable'].includes(result.status), text: result.message }
      await this.loadDetail(this.selectedKey)
    }
  }
}
</script>

<style scoped>
.player-support {
  --support-bg: #121922;
  --support-pane: #17202b;
  --support-raised: #1d2836;
  --support-border: #2f3d4d;
  --support-border-strong: #46586c;
  --support-muted: #9fb0c3;
  --support-text: #eef3f8;
  --support-accent: #dfb976;
  --support-accent-soft: #352c1f;
  --support-success: #8fd6ad;
  --support-warning: #f4ba83;
  --support-info: #9cc5f5;
  max-width: 1560px;
  margin: 0 auto 2.5rem;
  color: var(--support-text);
}
.support-header, .support-title, .support-section-title, .support-row-top, .support-row-bottom,
.support-thread-heading, .support-case-meta, .support-event-heading, .support-note-actions,
.support-pagination, .support-notice, .support-header-actions { display: flex; align-items: center; }

/* Page header */
.support-header { justify-content: space-between; gap: 16px; padding: 14px 0 18px; flex-wrap: wrap; }
.support-title { gap: 14px; min-width: 0; }
.support-title h1 { margin: 0; font-size: clamp(1.35rem, 2.5vw, 1.8rem); line-height: 1.15; letter-spacing: -.03em; color: inherit; }
.support-title p { margin: 3px 0 0; color: var(--support-muted); font-size: .82rem; }
.support-mark {
  display: grid; flex: none; place-items: center; width: 42px; height: 42px;
  background: linear-gradient(145deg, #3a301f, #241f18); border: 1px solid #6b5636; border-radius: 11px;
  color: var(--support-accent); font-size: 19px; box-shadow: 0 6px 18px rgba(0, 0, 0, .25);
}
.support-header-actions { gap: 12px; }
.support-live { display: inline-flex; align-items: center; gap: 6px; color: var(--support-muted); font-size: .74rem; font-weight: 600; }
.support-live-dot { position: relative; width: 7px; height: 7px; border-radius: 50%; background: var(--support-success); }
.support-live-dot::after { content: ""; position: absolute; inset: -3px; border-radius: 50%; border: 1px solid var(--support-success); opacity: 0; animation: support-pulse 2.4s ease-out infinite; }
@keyframes support-pulse { 0% { transform: scale(.6); opacity: .8; } 100% { transform: scale(1.6); opacity: 0; } }
.is-spinning { display: inline-block; animation: support-spin 900ms linear infinite; }
@keyframes support-spin { to { transform: rotate(360deg); } }

/* Buttons */
.support-button, .support-icon {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border: 1px solid var(--support-border-strong); border-radius: 7px; background: #1f2b39; color: var(--support-text);
  padding: 7px 12px; font-size: .8125rem; font-weight: 600; line-height: 1.25;
  transition: background-color 130ms ease, border-color 130ms ease, transform 130ms ease;
}
.support-button:hover:not(:disabled), .support-icon:hover:not(:disabled) { border-color: #8ea3ba; background: #2a3a4c; }
.support-button:active:not(:disabled) { transform: translateY(1px); }
.support-button:disabled, .support-icon:disabled { opacity: .45; cursor: default; }
.support-button.is-primary { color: #1f1910; background: var(--support-accent); border-color: var(--support-accent); }
.support-button.is-primary:hover:not(:disabled) { background: #f0cd90; border-color: #f0cd90; }
.support-button.is-success { color: #c8f0d8; border-color: #3f7259; background: #18342a; }
.support-button.is-success:hover:not(:disabled) { background: #1f4536; border-color: #5c9a7b; }
.player-support button:focus-visible, .player-support a:focus-visible, .player-support input:focus-visible,
.player-support textarea:focus-visible { outline: 2px solid var(--support-accent); outline-offset: 2px; }
.support-icon { padding: 5px 7px; }

/* Notices and banners */
.support-notice { gap: 10px; margin-bottom: 12px; padding: 9px 12px; border: 1px solid #3f735e; background: #16302a; border-radius: 8px; font-size: .85rem; }
.support-notice > i { color: var(--support-success); }
.support-notice > span { flex: 1; }
.support-notice .support-icon { background: transparent; border-color: transparent; }
.support-notice.is-error { background: #36222a; border-color: #9a5564; }
.support-notice.is-error > i { color: #ffadbd; }
.support-fade-enter-active, .support-fade-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.support-fade-enter, .support-fade-leave-to { opacity: 0; transform: translateY(-4px); }
.support-banner { display: flex; gap: 9px; align-items: flex-start; margin: 12px 23px 0; padding: 9px 12px; border-radius: 8px; border: 1px solid; font-size: .8rem; line-height: 1.45; }
.support-banner i { margin-top: 2px; }
.support-banner.is-warning { color: #ffd9b5; background: #33261b; border-color: #79583a; }
.support-banner.is-info { color: #d3e6fb; background: #1a2a3c; border-color: #38557a; }
.support-banner.is-success { color: #cdeedb; background: #172d25; border-color: #3a6853; }

/* Workspace */
.support-workspace {
  display: grid; grid-template-columns: minmax(250px, 27%) minmax(0, 1fr) minmax(220px, 22%);
  min-height: 640px; border: 1px solid var(--support-border); border-radius: 12px; background: var(--support-bg);
  overflow: hidden; box-shadow: 0 14px 40px rgba(0, 0, 0, .28);
}

/* Queue */
.support-queue { display: flex; flex-direction: column; min-width: 0; background: var(--support-pane); border-right: 1px solid var(--support-border); }
.support-queue-controls { padding: 16px 14px 12px; border-bottom: 1px solid var(--support-border); }
.support-section-title { justify-content: space-between; margin-bottom: 12px; }
.support-section-title h2, .support-inspector h2 { margin: 0; font-size: .78rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--support-muted); }
.support-count { min-width: 24px; padding: 1px 8px; border-radius: 999px; background: #263443; color: var(--support-text); font-size: .74rem; font-weight: 700; text-align: center; font-variant-numeric: tabular-nums; }
.support-search { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--support-muted); border: 1px solid var(--support-border-strong); border-radius: 8px; background: var(--support-bg); padding: 0 10px; transition: border-color 130ms ease; }
.support-search:focus-within { border-color: var(--support-accent); }
.support-search input { width: 100%; min-width: 0; padding: 8px 0; background: transparent; border: 0; color: var(--support-text); font-size: .84rem; }
.support-search input:focus-visible { outline: none; }
.support-search input::placeholder { color: #7f91a5; }
.support-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 2px; margin-top: 10px; padding: 3px; border-radius: 8px; background: var(--support-bg); border: 1px solid var(--support-border); }
.support-filters button { border: 0; border-radius: 6px; padding: 5px 4px; color: var(--support-muted); background: transparent; font-size: .72rem; font-weight: 650; white-space: nowrap; }
.support-filters button:hover { color: var(--support-text); }
.support-filters button[aria-pressed="true"] { color: #1f1910; background: var(--support-accent); }
.support-case-list { flex: 1; padding: 0; margin: 0; list-style: none; max-height: 640px; overflow: auto; }
.support-case-row {
  position: relative; display: block; width: 100%; border: 0; border-bottom: 1px solid #263342;
  padding: 12px 14px 11px 16px; background: transparent; text-align: left; color: var(--support-text);
  transition: background-color 150ms ease;
}
.support-case-row::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: transparent; }
.support-case-row.urgency-1::before { background: #a57a45; }
.support-case-row.urgency-2::before { background: #e07b5a; }
.support-case-row:hover:not(:disabled) { background: #1d2a38; }
.support-case-row.is-selected { background: #233041; }
.support-case-row.is-selected::before { background: var(--support-accent); }
.support-row-top, .support-row-bottom { gap: 8px; min-width: 0; }
.support-row-top strong { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .9rem; }
.support-row-top time { color: var(--support-muted); font-size: .72rem; font-variant-numeric: tabular-nums; }
.support-case-snippet {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  color: #c3cfdc; margin: 5px 0 8px; font-size: .79rem; line-height: 1.4; overflow-wrap: anywhere;
}
.support-row-bottom { flex-wrap: wrap; gap: 6px; }
.support-row-owner { display: inline-flex; align-items: center; gap: 5px; margin-left: auto; min-width: 0; max-width: 50%; color: var(--support-muted); font-size: .72rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.support-row-owner.is-mine { color: var(--support-accent); }
.support-avatar { display: inline-grid; flex: none; place-items: center; width: 17px; height: 17px; border-radius: 50%; background: #2d3d50; color: var(--support-text); font-size: .62rem; font-weight: 700; }
.support-row-owner.is-mine .support-avatar { background: var(--support-accent-soft); color: var(--support-accent); }
.support-avatar.is-large { width: 38px; height: 38px; font-size: 1rem; background: linear-gradient(145deg, #34465b, #243242); }
.support-chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 999px; font-size: .68rem; font-weight: 650; line-height: 1.35; white-space: nowrap; color: #cfe2fb; background: #213650; }
.support-chip.status-waiting { background: #3a2d1b; color: #f6ce91; }
.support-chip.status-resolved { background: #193a2e; color: #b8e6cc; }
.support-chip.is-urgent { background: #3d2420; color: var(--support-warning); }
.support-chip.delivery-failed { background: #3d2228; color: #ffb2c0; }
.support-chip.delivery-pending, .support-chip.delivery-unconfirmed { background: #3a2c1b; color: var(--support-warning); }
.support-pagination { justify-content: space-between; padding: 9px 14px; border-top: 1px solid var(--support-border); font-size: .75rem; color: var(--support-muted); }
.support-empty { display: grid; justify-items: center; gap: 6px; margin: 34px 18px; color: var(--support-muted); text-align: center; font-size: .8rem; }
.support-empty i { font-size: 1.6rem; margin-bottom: 4px; color: #6f8296; }
.support-empty strong { color: var(--support-text); font-size: .88rem; }
.support-skeleton { display: block; width: 100%; height: 58px; border-radius: 8px; background: linear-gradient(90deg, #1d2734 0%, #243142 50%, #1d2734 100%); background-size: 200% 100%; animation: support-shimmer 1.3s ease-in-out infinite; }
@keyframes support-shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }

/* Thread */
.support-thread { display: flex; flex-direction: column; min-width: 0; }
.support-placeholder { flex: 1; display: grid; justify-items: center; align-content: center; gap: 7px; min-height: 360px; padding: 20px; color: var(--support-muted); text-align: center; font-size: .82rem; }
.support-placeholder i { font-size: 1.8rem; color: #6f8296; margin-bottom: 4px; }
.support-placeholder strong { color: var(--support-text); font-size: .95rem; }
.support-thread-header { padding: 18px 23px 0; border-bottom: 1px solid var(--support-border); background: linear-gradient(180deg, #16202b, var(--support-bg)); }
.support-case-meta { flex-wrap: wrap; gap: 7px; color: var(--support-muted); font-size: .74rem; font-variant-numeric: tabular-nums; }
.support-case-number { font-weight: 650; letter-spacing: .02em; }
.support-thread-heading { margin-top: 8px; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.support-identity { display: flex; align-items: center; gap: 10px; min-width: 0; flex-wrap: wrap; }
.support-thread-heading h2 { margin: 0; font-size: clamp(1.25rem, 2.3vw, 1.65rem); letter-spacing: -.025em; color: inherit; overflow-wrap: anywhere; }
.support-heading-actions { display: flex; gap: 8px; }
.support-presence { display: inline-flex; align-items: center; gap: 6px; padding: 2px 9px; border-radius: 999px; font-size: .72rem; font-weight: 650; color: var(--support-muted); background: #243241; }
.support-presence::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.support-presence.presence-online { color: var(--support-success); background: #1c3a2e; }
.support-presence.presence-unknown::before { background: transparent; border: 1px solid currentColor; }
.support-presence.is-small { flex: none; gap: 4px; padding: 1px 7px; font-size: .64rem; }
.support-presence.is-small::before { width: 5px; height: 5px; }
.support-subline { margin: 6px 0 0; color: var(--support-muted); font-size: .8rem; }
.support-subline strong { color: #d7e2ee; font-weight: 600; }
.support-thread-tabs { display: flex; gap: 20px; margin-top: 12px; }
.support-thread-tabs button {
  display: flex; align-items: center; gap: 6px; padding: 8px 0 10px;
  background: transparent; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px;
  color: var(--support-muted); font-size: .8rem; font-weight: 650;
}
.support-thread-tabs button:hover { color: var(--support-text); }
.support-thread-tabs button[aria-pressed="true"] { border-bottom-color: var(--support-accent); color: var(--support-accent); }
.support-tab-count { padding: 0 6px; border-radius: 999px; background: #263443; color: var(--support-muted); font-size: .68rem; }

/* Timeline */
.support-timeline { flex: 1; padding: 6px 23px 16px; max-height: 560px; overflow: auto; }
.support-event { position: relative; display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 12px; padding: 11px 0 9px; }
.support-event::before { content: ""; position: absolute; left: 14px; top: 0; bottom: 0; width: 1px; background: var(--support-border); }
.support-timeline > .support-event:first-child::before { top: 24px; }
.support-timeline > .support-event:last-child::before { bottom: calc(100% - 24px); }
.support-event-icon {
  position: relative; z-index: 1; display: grid; place-items: center; width: 29px; height: 29px;
  border: 1px solid #3f5066; border-radius: 50%; background: #1b2633; color: #bccadb; font-size: .8rem;
}
.support-original .support-event-icon { border-color: #6d5839; color: var(--support-accent); background: #2b251d; }
.kind-note .support-event-icon { border-color: #5d4c7a; color: #cdb8f5; background: #251f33; }
.kind-reply .support-event-icon { border-color: #3a5a82; color: var(--support-info); background: #1a2638; }
.kind-parcel .support-event-icon { border-color: #3d6a55; color: var(--support-success); background: #182b24; }
.kind-character_move .support-event-icon, .kind-corpse_move .support-event-icon { border-color: #3c6370; color: #9fdbea; background: #182a30; }
.kind-pending .support-event-icon { border-color: #7a5937; color: var(--support-warning); background: #30241a; }
.kind-chat_out .support-event-icon { border-color: #6d5839; color: var(--support-accent); }
.kind-chat_in .support-event-icon { border-color: #3a5a82; color: var(--support-info); }
.kind-resolve .support-event-icon { border-color: #3d6a55; color: var(--support-success); }
.support-event-body { min-width: 0; padding-top: 4px; }
.support-event-heading { justify-content: space-between; flex-wrap: wrap; gap: 4px 10px; }
.support-event-heading h3 { color: inherit; font-size: .82rem; font-weight: 650; margin: 0; line-height: 1.35; }
.support-event-heading h3 span, .support-event-heading time, .support-receipt { color: var(--support-muted); font-size: .72rem; font-weight: 400; }
.support-event-body p { margin: 6px 0 0; color: #d1dce8; font-size: .86rem; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
.support-event-body .support-event-detail { color: var(--support-muted); font-size: .8rem; }
.support-original p { padding: 11px 13px; border: 1px solid #4a3e2c; border-radius: 0 9px 9px; background: #211d18; }
.kind-note p { padding: 8px 11px; border-left: 2px solid #6d5a92; background: #1c1a26; border-radius: 0 6px 6px 0; }
.kind-chat_in p, .kind-chat_out p { display: inline-block; max-width: 100%; padding: 7px 11px; border-radius: 0 9px 9px; border: 1px solid #344a63; background: #1a2637; }
.kind-chat_out p { border-color: #5c4b32; background: #2a251d; }
.support-event.is-compact { padding-top: 0; }
.support-event.is-compact .support-event-icon { visibility: hidden; }
.support-event.is-compact .support-event-heading { display: none; }
.support-event.is-compact p { margin-top: 2px; }
.support-event-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 7px; }
.support-day { position: relative; display: flex; justify-content: center; margin: 10px 0 4px; }
.support-day::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--support-border); }
.support-day span { position: relative; padding: 1px 10px; border-radius: 999px; border: 1px solid var(--support-border); background: var(--support-bg); color: var(--support-muted); font-size: .68rem; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; }

/* Note composer */
.support-note { padding: 12px 23px 16px; border-top: 1px solid var(--support-border); background: var(--support-pane); }
.support-note label { display: flex; align-items: center; gap: 6px; color: var(--support-muted); font-size: .75rem; font-weight: 650; margin-bottom: 6px; }
.support-note textarea { width: 100%; min-height: 60px; padding: 8px 10px; color: var(--support-text); background: var(--support-bg); border: 1px solid var(--support-border-strong); border-radius: 8px; resize: vertical; font-size: .85rem; }
.support-note textarea::placeholder { color: #75879b; }
.support-note-actions { justify-content: flex-end; gap: 12px; margin-top: 8px; }
.support-hint { color: #7f91a5; font-size: .72rem; }
.support-hint kbd { padding: 1px 5px; border-radius: 4px; border: 1px solid var(--support-border-strong); background: #1f2a37; color: var(--support-muted); font-size: .66rem; box-shadow: none; }

/* Inspector */
.support-inspector { min-width: 0; border-left: 1px solid var(--support-border); background: var(--support-pane); }
.support-inspector section { padding: 16px 15px; }
.support-inspector section + section { border-top: 1px solid var(--support-border); }
.support-character-card { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding: 10px; border: 1px solid var(--support-border); border-radius: 9px; background: var(--support-bg); }
.support-character-card div { display: grid; min-width: 0; line-height: 1.3; }
.support-character-card strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.support-character-card span { color: var(--support-muted); font-size: .74rem; }
.support-inspector dl { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px 10px; margin: 14px 0; font-size: .77rem; }
.support-inspector dt { color: var(--support-muted); font-weight: 400; }
.support-inspector dd { margin: 0; text-align: right; overflow-wrap: anywhere; }
.support-related { display: grid; gap: 2px; }
.support-tool-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 6px; margin-bottom: 8px; }
.support-related a { display: grid; grid-template-columns: 16px minmax(0, 1fr) 14px; align-items: center; gap: 7px; padding: 6px 4px; border-radius: 6px; color: #d3e1f3; font-size: .77rem; }
.support-related a:hover { color: var(--support-accent); background: #1d2836; text-decoration: none; }
.support-related a .fe-arrow-up-right { color: var(--support-muted); }
.support-actions { display: grid; gap: 7px; }
.support-actions h2 { margin-bottom: 3px; }
.support-actions .support-actions-divider { margin-top: 8px; }
.support-actions button { justify-content: flex-start; }
.support-back { display: none; }

@media (max-width: 1180px) {
  .support-workspace { grid-template-columns: minmax(230px, 33%) minmax(0, 1fr); }
  .support-queue { grid-row: 1 / span 2; }
  .support-inspector { grid-column: 2; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); border-left: 0; border-top: 1px solid var(--support-border); }
  .support-inspector section + section { border-top: 0; border-left: 1px solid var(--support-border); }
}
@media (max-width: 680px) {
  .support-workspace { display: block; min-height: 0; }
  .support-queue { border-right: 0; }
  .support-thread, .support-inspector { display: none; }
  .support-workspace.show-case .support-queue { display: none; }
  .support-workspace.show-case .support-thread { display: flex; }
  .support-workspace.show-case .support-inspector { display: grid; grid-template-columns: minmax(0, 1fr); border-top: 1px solid var(--support-border); }
  .support-workspace.show-case .support-inspector section + section { border-left: 0; border-top: 1px solid var(--support-border); }
  .support-thread-header, .support-note, .support-timeline { padding-left: 14px; padding-right: 14px; }
  .support-banner { margin-left: 14px; margin-right: 14px; }
  .support-back { display: inline-flex; align-self: flex-start; margin: 10px 0 0 14px; }
  .support-inspector section { padding: 13px 14px; }
  .support-title p, .support-live { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .support-button, .support-icon, .support-case-row { transition: none; }
  .support-live-dot::after, .is-spinning, .support-skeleton { animation: none; }
}
</style>

<style>
/* Shared look for Player Support dialogs rendered outside the scoped tree. */
.support-modal .modal-content { color: #e1ebf6; background: #121a24; border: 1px solid #354658; border-radius: 12px; box-shadow: 0 24px 60px rgba(0, 0, 0, .45); }
.support-modal .modal-header, .support-modal .modal-footer { background: #151f2a; border-color: #2a3948; padding: 14px 20px; }
.support-modal .modal-header { border-radius: 12px 12px 0 0; }
.support-modal .modal-footer { border-radius: 0 0 12px 12px; }
.support-modal .modal-title { font-size: 1.05rem; font-weight: 650; color: #f0f4f8; }
.support-modal .modal-header .close { color: #b4c7d9; text-shadow: none; opacity: .8; }
.support-modal .modal-body { padding: 18px 20px; }
.support-modal label { display: block; margin: 12px 0 6px; font-size: .8rem; font-weight: 650; color: #c9d6e3; }
.support-modal label span { color: #8fa1b5; font-weight: 400; }
.support-modal .form-control { color: #eef3f8; background: #0e151d; border: 1px solid #45576b; border-radius: 8px; }
.support-modal .form-control:focus { border-color: #dfb976; box-shadow: 0 0 0 3px rgba(223, 185, 118, .18); }
.support-modal .form-control::placeholder { color: #75879b; }
.support-modal-lead { margin: 0; font-size: .92rem; }
.support-modal-hint { display: flex; gap: 8px; align-items: flex-start; margin: 14px 0 0; padding: 9px 11px; border-radius: 8px; color: #d3e6fb; background: #1a2a3c; border: 1px solid #38557a; font-size: .8rem; }
.support-modal-hint i { margin-top: 2px; }
</style>
