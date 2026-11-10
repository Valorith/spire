<template>
  <b-modal ref="modal" visible scrollable centered size="lg" modal-class="support-modal support-quests-modal"
           :no-close-on-backdrop="saving" :no-close-on-esc="saving" :hide-header-close="saving" @hide="onHide" @shown="focusFirst">
    <template #modal-title>Quests &amp; progress <span class="support-modal-subject">· {{ record.character }}</span></template>
    <div class="quests-bar">
      <div class="support-tabs" role="tablist" aria-label="Progress tools" @keydown="tablistKeydown">
        <button v-for="option in tabOptions" :id="'support-quests-tab-' + option.id" :key="option.id" type="button" role="tab" :aria-selected="String(tab === option.id)"
                aria-controls="support-quests-panel" :tabindex="tab === option.id ? 0 : -1" :disabled="Boolean(pending) || saving"
                @click="setTab(option.id)">
          <i :class="option.icon" aria-hidden="true"></i> {{ option.label }}
        </button>
      </div>
      <button type="button" class="support-button is-ghost is-icon is-sm" aria-label="Refresh" title="Refresh" :disabled="current.loading || saving || Boolean(pending)" @click="load(tab)">
        <i class="fe fe-refresh-cw" :class="{ 'support-spin': current.loading && current.data }" aria-hidden="true"></i>
      </button>
    </div>

    <div id="support-quests-panel" class="quests-body" role="tabpanel" :aria-labelledby="'support-quests-tab-' + tab">
      <p v-if="stateLine" class="support-callout quests-state" :class="stateLine.tone">
        <i :class="stateLine.icon" aria-hidden="true"></i><span>{{ stateLine.text }}</span>
      </p>
      <support-result v-if="result && !pending" :result="result" dismissible @dismiss="result = null" />

      <!-- Confirmation for every change, with the reason -->
      <section v-if="pending" class="quests-confirm" aria-label="Confirm change">
        <p class="support-modal-lead"><strong>{{ pending.question }}</strong></p>
        <dl class="support-dl is-boxed">
          <template v-for="row in pending.details"><dt :key="row.label + '-t'">{{ row.label }}</dt><dd :key="row.label + '-d'">{{ row.value }}</dd></template>
          <dt>Applies</dt><dd>{{ appliesText }}</dd>
        </dl>
        <p v-if="pending.consequence" class="support-callout quests-consequence" :class="pending.danger ? 'is-warning' : null">
          <i :class="pending.danger ? 'fe fe-alert-triangle' : 'fe fe-info'" aria-hidden="true"></i><span>{{ pending.consequence }}</span>
        </p>
        <div v-if="pending.action === 'update_activity'" class="quests-amount">
          <label for="quests-count" class="support-label">Amount to add <span class="support-label-hint">(1 to {{ addLimit(pending.task, pending.activity) }})</span></label>
          <input id="quests-count" ref="count" v-model.number="count" class="support-field quests-count" type="number" min="1" :max="addLimit(pending.task, pending.activity)"
                 step="1" inputmode="numeric" :disabled="saving" :aria-invalid="countValid ? null : 'true'" aria-describedby="quests-count-hint">
          <p v-if="!countValid" id="quests-count-hint" class="support-feedback is-error"><i class="fe fe-alert-circle" aria-hidden="true"></i> Enter a whole number from 1 to {{ addLimit(pending.task, pending.activity) }}.</p>
          <p v-else-if="offlineCapped(pending.activity)" id="quests-count-hint" class="support-blocked quests-gap-sm"><i class="fe fe-info" aria-hidden="true"></i><span>Complete this step while {{ record.character }} is in game.</span></p>
          <p v-if="completes" class="support-callout is-accent quests-gap"><i class="fe fe-award" aria-hidden="true"></i><span>{{ completesText }}</span></p>
        </div>
        <support-reason id="quests-reason" ref="reason" v-model="reason" :disabled="saving" @input="error = ''" @submit="submit" />
        <p v-if="error" class="support-callout is-danger quests-gap" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>
      </section>

      <template v-else>
        <support-load-state v-if="current.error || (current.loading && !current.data)" :error="current.error" :label="'Loading ' + tabLabel" @retry="load(tab)" />

        <!-- Tasks -->
        <template v-else-if="tab === 'tasks' && current.data">
          <div v-if="!tasks.length" class="support-empty is-compact"><i class="fe fe-check-square" aria-hidden="true"></i><span>{{ record.character }} has no active tasks.</span></div>
          <article v-for="task in tasks" :key="task.task_id" class="quests-card" :aria-label="task.title">
            <header class="quests-card-head">
              <div class="quests-card-title">
                <strong>{{ task.title }}</strong>
                <span class="quests-meta">
                  <span class="support-chip is-tag">{{ typeLabel(task.type) }}</span>
                  <span v-if="task.accepted_at">Accepted {{ formatDate(task.accepted_at) }}</span>
                  <span v-if="task.expires_at">· Expires {{ formatDate(task.expires_at) }}</span>
                </span>
              </div>
              <button v-if="canWrite && task.type !== 'shared'" type="button" class="support-button is-danger is-sm" :disabled="!canChangeTasks"
                      :aria-label="'Remove task ' + task.title" @click="ask('remove_task', task)">Remove task…</button>
            </header>
            <p v-if="task.type === 'shared'" class="support-blocked"><i class="fe fe-lock" aria-hidden="true"></i><span>Read-only. Shared tasks are managed by the shared task system; use #task in game.</span></p>
            <ul class="quests-steps">
              <li v-for="activity in task.activities" :key="activity.activity_id" class="quests-step" :class="{ 'is-done': activity.completed }">
                <i :class="activity.completed ? 'fe fe-check-circle' : 'fe fe-circle'" aria-hidden="true"></i>
                <div class="quests-step-text">
                  <span>{{ activity.description }} <span v-if="activity.optional" class="support-chip">Optional</span></span>
                  <small v-if="canWrite && task.type !== 'shared' && canChangeTasks && !activity.completed && addLimit(task, activity) < 1" class="support-blocked">
                    <i class="fe fe-info" aria-hidden="true"></i><span>Complete this step while {{ record.character }} is in game.</span>
                  </small>
                </div>
                <span class="quests-numbers">{{ activity.done }}/{{ activity.goal }}</span>
                <div v-if="canWrite && task.type !== 'shared'" class="quests-step-actions">
                  <button v-if="activity.done > 0" type="button" class="support-button is-sm" :disabled="!canChangeTasks"
                          :aria-label="'Reset ' + activity.description" @click="ask('reset_activity', task, activity)">Reset…</button>
                  <button v-if="!activity.completed" type="button" class="support-button is-sm" :disabled="!canChangeTasks || addLimit(task, activity) < 1"
                          :aria-label="'Add progress to ' + activity.description" @click="ask('update_activity', task, activity)">Add…</button>
                </div>
              </li>
            </ul>
          </article>

          <section class="quests-section" aria-labelledby="quests-completed">
            <div class="quests-section-head">
              <h3 id="quests-completed" class="support-section-label">Completed <span v-if="completed.length" class="support-count">{{ completed.length }}</span></h3>
              <span v-if="canWrite && completed.length && state !== 'offline'" class="support-blocked"><i class="fe fe-lock" aria-hidden="true"></i><span>Clear completed records while {{ record.character }} is offline.</span></span>
            </div>
            <p v-if="!completed.length" class="quests-quiet">No completed tasks on record.</p>
            <ul v-else class="quests-rows">
              <li v-for="item in completed" :key="'c' + item.task_id + item.completed_at">
                <span class="quests-row-text"><strong>{{ item.title }}</strong><small>Completed {{ formatDate(item.completed_at) }}</small></span>
                <button v-if="canWrite" type="button" class="support-button is-sm" :disabled="state !== 'offline'"
                        :aria-label="'Clear record of ' + item.title" @click="ask('clear_completed', item)">Clear record…</button>
              </li>
            </ul>
          </section>

          <section class="quests-section" aria-labelledby="quests-timers">
            <div class="quests-section-head">
              <h3 id="quests-timers" class="support-section-label">Timers <span v-if="timers.length" class="support-count">{{ timers.length }}</span></h3>
              <span v-if="canWrite && timers.length && state !== 'offline'" class="support-blocked"><i class="fe fe-lock" aria-hidden="true"></i><span>Clear timers while {{ record.character }} is offline.</span></span>
            </div>
            <p v-if="!timers.length" class="quests-quiet">No task timers.</p>
            <ul v-else class="quests-rows">
              <li v-for="timer in timers" :key="'t' + timer.id">
                <span class="quests-row-text"><strong>{{ timer.title }}</strong><small>{{ timer.kind === 'request' ? 'Request' : 'Replay' }} timer · ends {{ formatDate(timer.expires_at) }}</small></span>
                <button v-if="canWrite" type="button" class="support-button is-sm" :disabled="state !== 'offline'"
                        :aria-label="'Clear timer of ' + timer.title" @click="ask('clear_timer', timer)">Clear…</button>
              </li>
            </ul>
          </section>
        </template>

        <!-- Lockouts -->
        <template v-else-if="tab === 'lockouts' && current.data">
          <section class="quests-section" aria-labelledby="quests-lockouts">
            <h3 id="quests-lockouts" class="support-section-label">Lockouts <span v-if="lockouts.length" class="support-count">{{ lockouts.length }}</span></h3>
            <div v-if="!lockouts.length" class="support-empty is-compact"><i class="fe fe-clock" aria-hidden="true"></i><span>{{ record.character }} has no lockouts.</span></div>
            <table v-else class="support-table is-sticky quests-table">
              <thead><tr><th scope="col">Expedition</th><th scope="col">Event</th><th scope="col" class="is-number">Expires in</th><th v-if="canWrite" scope="col"><span class="sr-only">Action</span></th></tr></thead>
              <tbody>
                <tr v-for="lockout in lockouts" :key="lockout.id">
                  <th scope="row">{{ lockout.expedition }}</th>
                  <td data-label="Event">{{ lockout.event }}</td>
                  <td data-label="Expires in" class="is-number is-nowrap" :title="formatDate(lockout.expires_at)">{{ remaining(lockout.remaining_seconds) }}</td>
                  <td v-if="canWrite" class="is-action">
                    <button type="button" class="support-button is-sm" :disabled="!canChangeLockouts" :aria-label="'Remove lockout ' + lockout.expedition + ': ' + lockout.event"
                            @click="ask('remove_lockout', lockout)">Remove…</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
          <section class="quests-section" aria-labelledby="quests-instances">
            <h3 id="quests-instances" class="support-section-label">Instances <span v-if="instances.length" class="support-count">{{ instances.length }}</span></h3>
            <p v-if="!instances.length" class="quests-quiet">No instances.</p>
            <table v-else class="support-table is-sticky quests-table">
              <thead><tr><th scope="col">Zone</th><th scope="col">Expedition</th><th scope="col">Instance</th><th scope="col" class="is-number">Expires</th></tr></thead>
              <tbody>
                <tr v-for="instance in instances" :key="instance.instance_id">
                  <th scope="row">{{ instance.zone_name || 'Zone #' + instance.zone_id }}</th>
                  <td data-label="Expedition">{{ instance.dz_name || '—' }}</td>
                  <td data-label="Instance" class="is-nowrap">#{{ instance.instance_id }} · v{{ instance.version }}</td>
                  <td data-label="Expires" class="is-number is-nowrap">{{ instance.never_expires ? 'Never' : formatDate(instance.expires_at) }}</td>
                </tr>
              </tbody>
            </table>
            <p class="quests-line"><i class="fe fe-home" aria-hidden="true"></i>
              <span>Safe return: <strong>{{ safeReturn ? (safeReturn.zone_name || 'Zone #' + safeReturn.zone_id) : 'None set' }}</strong></span>
            </p>
            <p class="support-callout"><i class="fe fe-info" aria-hidden="true"></i><span>Instance membership is read-only here. The player can leave an expedition with /dzquit.</span></p>
          </section>
        </template>

        <!-- Flags -->
        <template v-else-if="tab === 'flags' && current.data">
          <label v-if="flagTotal > 8" class="support-search quests-filter">
            <i class="fe fe-search" aria-hidden="true"></i>
            <input v-model="flagQuery" type="search" maxlength="80" placeholder="Filter by name or value" aria-label="Filter flags">
            <span v-if="flagQuery.trim()" class="quests-filter-count">{{ flagMatches }} of {{ flagTotal }}</span>
          </label>
          <div class="quests-flags">
            <section class="quests-flag-list" aria-labelledby="flags-zones">
              <div class="quests-section-head"><h3 id="flags-zones" class="support-section-label">Zone flags <span v-if="flags.zone_flags.length" class="support-count">{{ flags.zone_flags.length }}</span></h3></div>
              <p v-if="!shown.zone_flags.length" class="quests-quiet">{{ flags.zone_flags.length ? 'No match.' : 'None.' }}</p>
              <ul v-else class="quests-compact">
                <li v-for="flag in shown.zone_flags" :key="flag.zone_id">{{ flag.zone_name || 'Zone #' + flag.zone_id }}</li>
              </ul>
            </section>
            <section class="quests-flag-list" aria-labelledby="flags-keys">
              <div class="quests-section-head">
                <h3 id="flags-keys" class="support-section-label">Keys <span v-if="flags.keys.length" class="support-count">{{ flags.keys.length }}</span></h3>
                <router-link v-if="links.keyring" :to="links.keyring" class="support-link quests-open">Open in Inventory &amp; Keyring <i class="fe fe-arrow-up-right" aria-hidden="true"></i></router-link>
              </div>
              <p v-if="!shown.keys.length" class="quests-quiet">{{ flags.keys.length ? 'No match.' : 'None.' }}</p>
              <ul v-else class="quests-compact">
                <li v-for="key in shown.keys" :key="key.item_id">{{ key.name || 'Item #' + key.item_id }}</li>
              </ul>
            </section>
            <section class="quests-flag-list is-wide" aria-labelledby="flags-buckets">
              <div class="quests-section-head">
                <h3 id="flags-buckets" class="support-section-label">Data buckets <span v-if="flags.buckets.length" class="support-count">{{ flags.buckets.length }}</span></h3>
                <router-link v-if="links.buckets" :to="links.buckets" class="support-link quests-open">Open in Data Buckets <i class="fe fe-arrow-up-right" aria-hidden="true"></i></router-link>
              </div>
              <p v-if="!shown.buckets.length" class="quests-quiet">{{ flags.buckets.length ? 'No match.' : 'None.' }}</p>
              <table v-else class="support-table is-sticky quests-table quests-kv-table">
                <thead><tr><th scope="col">Key</th><th scope="col">Value</th><th scope="col">Scope</th><th scope="col" class="is-number">Expires</th></tr></thead>
                <tbody>
                  <tr v-for="bucket in shown.buckets" :key="bucket.id">
                    <th scope="row"><code :title="bucket.key">{{ bucket.key }}</code></th>
                    <td class="quests-value" :title="bucket.value">{{ bucket.value }}</td>
                    <td><span class="support-chip">{{ bucket.scope === 'account' ? 'Account' : 'Character' }}</span></td>
                    <td class="is-number is-nowrap">{{ bucket.expires_at ? formatDate(bucket.expires_at) : 'Never' }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
            <section class="quests-flag-list is-wide" aria-labelledby="flags-globals">
              <div class="quests-section-head">
                <h3 id="flags-globals" class="support-section-label">Quest globals <span v-if="flags.quest_globals.length" class="support-count">{{ flags.quest_globals.length }}</span></h3>
                <router-link v-if="links.qglobals" :to="links.qglobals" class="support-link quests-open">Open in QGlobals <i class="fe fe-arrow-up-right" aria-hidden="true"></i></router-link>
              </div>
              <p v-if="!shown.quest_globals.length" class="quests-quiet">{{ flags.quest_globals.length ? 'No match.' : 'None.' }}</p>
              <table v-else class="support-table is-sticky quests-table quests-kv-table">
                <thead><tr><th scope="col">Name</th><th scope="col">Value</th><th scope="col" class="is-number">Expires</th></tr></thead>
                <tbody>
                  <tr v-for="global in shown.quest_globals" :key="global.name + global.npc_id + global.zone_id">
                    <th scope="row"><code :title="global.name">{{ global.name }}</code></th>
                    <td class="quests-value" :title="global.value">{{ global.value }}</td>
                    <td class="is-number is-nowrap">{{ global.expires_at ? formatDate(global.expires_at) : 'Never' }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
          <div v-if="canReloadCache" class="quests-reload">
            <div class="quests-row-text">
              <strong>Game cache</strong>
              <small v-if="flags.local_world">After editing data buckets, this makes zones read them again.</small>
              <small v-else class="support-blocked"><i class="fe fe-lock" aria-hidden="true"></i><span>Needs the game server this Spire runs beside</span></small>
            </div>
            <button type="button" class="support-button" :disabled="!flags.local_world || saving" @click="reloadCache">
              <i :class="saving ? 'fe fe-loader support-spin' : 'fe fe-refresh-cw'" aria-hidden="true"></i> Reload game cache
            </button>
          </div>
        </template>
      </template>
    </div>

    <template #modal-footer>
      <span v-if="!pending && readOnly && tab !== 'flags'" class="support-footer-note"><i class="fe fe-lock" aria-hidden="true"></i>{{ readOnly }}</span>
      <template v-if="pending">
        <button ref="back" type="button" class="support-button" :disabled="saving" @click="cancelPending">Back</button>
        <button type="button" class="support-button" :class="pending.danger ? 'is-danger is-solid' : 'is-primary'" :disabled="saving" @click="submit">
          <i v-if="saving" class="fe fe-loader support-spin" aria-hidden="true"></i> {{ saving ? 'Saving…' : primaryLabel }}
        </button>
      </template>
      <button v-else type="button" class="support-button" :disabled="saving" @click="$emit('close')">Close</button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { canReadAdminApi } from '@/app/user/server-admin-access'
import { ROUTE } from '@/routes'
import { focusLater, newRequestId, tablistKeydown } from './support-ui'
import { dialogFocus } from './support-dialog'
import SupportLoadState from './SupportLoadState.vue'
import SupportReason from './SupportReason.vue'
import SupportResult from './SupportResult.vue'

function blank () { return { data: null, loading: false, error: '' } }

export default {
  name: 'SupportProgress',
  components: { SupportLoadState, SupportReason, SupportResult },
  mixins: [dialogFocus],
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    features: { type: Object, default: () => ({}) },
    canWrite: { type: Boolean, default: false },
    canReloadCache: { type: Boolean, default: false },
    // Why this viewer cannot change tasks and lockouts here (resolved case,
    // no permission), shown in the footer; '' when they can.
    readOnly: { type: String, default: '' },
    // 'tasks', 'lockouts' or 'flags'
    initialTab: { type: String, default: 'tasks' }
  },
  data () {
    return {
      tab: ['tasks', 'lockouts', 'flags'].includes(this.initialTab) ? this.initialTab : 'tasks',
      panes: { tasks: blank(), lockouts: blank(), flags: blank() },
      pending: null,
      // The row button that asked for the confirmation, focused again on Back.
      pendingOpener: null,
      count: 1,
      reason: '',
      saving: false,
      error: '',
      result: null,
      flagQuery: '',
      tabOptions: [
        { id: 'tasks', label: 'Tasks', icon: 'fe fe-check-square' },
        { id: 'lockouts', label: 'Lockouts', icon: 'fe fe-clock' },
        { id: 'flags', label: 'Flags', icon: 'fe fe-flag' }
      ]
    }
  },
  computed: {
    endpoint () { return `player-support/cases/${encodeURIComponent(this.record.key)}` },
    params () { return { connection_id: this.connectionId } },
    current () { return this.panes[this.tab] },
    tasks () { return (this.panes.tasks.data && this.panes.tasks.data.tasks) || [] },
    completed () { return (this.panes.tasks.data && this.panes.tasks.data.completed) || [] },
    timers () { return (this.panes.tasks.data && this.panes.tasks.data.timers) || [] },
    lockouts () { return (this.panes.lockouts.data && this.panes.lockouts.data.lockouts) || [] },
    instances () { return (this.panes.lockouts.data && this.panes.lockouts.data.instances) || [] },
    safeReturn () { return this.panes.lockouts.data && this.panes.lockouts.data.safe_return },
    flags () {
      const data = this.panes.flags.data || {}
      return { zone_flags: data.zone_flags || [], keys: data.keys || [], buckets: data.buckets || [], quest_globals: data.quest_globals || [], local_world: Boolean(data.local_world) }
    },
    // The state of the tab on screen (tasks and lockouts report one).
    paneData () { return this.tab === 'lockouts' ? this.panes.lockouts.data : this.panes.tasks.data },
    state () { return (this.paneData && this.paneData.state) || '' },
    liveFeatures () { return { ...this.features, ...((this.paneData && this.paneData.features) || {}) } },
    feature () { return Boolean(this.tab === 'lockouts' ? this.liveFeatures.lockouts : this.liveFeatures.tasks) },
    canChangeTasks () {
      const data = this.panes.tasks.data
      if (!this.canWrite || !data) return false
      return data.state === 'offline' || (data.state === 'in_zone' && Boolean({ ...this.features, ...(data.features || {}) }.tasks))
    },
    canChangeLockouts () {
      const data = this.panes.lockouts.data
      if (!this.canWrite || !data) return false
      return data.state === 'offline' || (data.state === 'in_zone' && Boolean({ ...this.features, ...(data.features || {}) }.lockouts))
    },
    stateLine () {
      if (this.tab === 'flags' || !this.state) return null
      const name = this.record.character
      switch (this.state) {
        case 'offline': return { tone: null, icon: 'fe fe-database', text: `${name} is offline: changes are saved to the database.` }
        case 'in_zone': return this.feature
          ? { tone: 'is-success', icon: 'fe fe-radio', text: `${name} is in game: changes apply in game.` }
          : { tone: 'is-warning', icon: 'fe fe-lock', text: 'In game. Changing this in game needs the updated Player Support patch.' }
        case 'zoning': return { tone: 'is-warning', icon: 'fe fe-loader', text: `${name} is zoning. Try again in a moment.` }
        // "unknown": marked in game, and no World roster to check against.
        // local_world tells a World on another host from one that is down;
        // an older server does not send it.
        default: {
          const local = this.paneData.local_world
          const text = local === false
            ? `Spire cannot confirm ${name} is offline. This server's World runs on another host, so changes wait until ${name} logs out.`
            : local === true
              ? `Spire cannot confirm ${name} is offline. ${name} is marked in game, and World is down or not answering.`
              : `Spire cannot confirm ${name} is offline. ${name} is marked in game, and this Spire cannot check the game server: it is down, or it runs on another host.`
          return { tone: 'is-warning', icon: 'fe fe-help-circle', text }
        }
      }
    },
    appliesText () { return this.state === 'in_zone' ? 'In game, at once' : 'In the database' },
    links () {
      return {
        keyring: canReadAdminApi('inventory-keyring') ? { path: ROUTE.ADMIN_INVENTORY_KEYRING, query: { character: String(this.record.character_id) } } : null,
        buckets: canReadAdminApi('data-bucket-editor') ? { path: ROUTE.DATA_BUCKETS } : null,
        qglobals: canReadAdminApi('qglobal-editor') ? { path: ROUTE.QGLOBALS } : null
      }
    },
    tabLabel () { return { tasks: 'tasks', lockouts: 'lockouts', flags: 'flags' }[this.tab] },
    // Flags filter: zone flags, keys, data buckets and quest globals by name or value.
    flagTotal () { return this.flags.zone_flags.length + this.flags.keys.length + this.flags.buckets.length + this.flags.quest_globals.length },
    shown () {
      const query = this.flagQuery.trim().toLowerCase()
      const flags = this.flags
      if (!query) return flags
      const has = (...values) => values.some(value => String(value == null ? '' : value).toLowerCase().includes(query))
      return {
        zone_flags: flags.zone_flags.filter(flag => has(flag.zone_name, flag.zone_id)),
        keys: flags.keys.filter(key => has(key.name, key.item_id)),
        buckets: flags.buckets.filter(bucket => has(bucket.key, bucket.value)),
        quest_globals: flags.quest_globals.filter(global => has(global.name, global.value))
      }
    },
    flagMatches () { return this.shown.zone_flags.length + this.shown.keys.length + this.shown.buckets.length + this.shown.quest_globals.length },
    countValid () {
      if (!this.pending || this.pending.action !== 'update_activity') return true
      return Number.isInteger(this.count) && this.count >= 1 && this.count <= this.addLimit(this.pending.task, this.pending.activity)
    },
    // An in-game update that reaches the goal of the last open required step.
    completes () {
      const pending = this.pending
      if (!pending || pending.action !== 'update_activity' || this.state !== 'in_zone' || !this.countValid) return false
      const { task, activity } = pending
      if (activity.optional || activity.done + this.count < activity.goal) return false
      return task.activities.every(other => other === activity || other.optional || other.completed)
    },
    completesText () {
      const reward = (this.pending && this.pending.task.reward) || {}
      const parts = []
      if (reward.text) parts.push(reward.text)
      if (reward.exp > 0) parts.push(`${Number(reward.exp).toLocaleString()} experience`)
      if (reward.copper > 0) parts.push(this.coins(reward.copper))
      if (reward.points > 0) parts.push(`${reward.points} points`)
      for (const item of reward.items || []) parts.push(item.name || `Item #${item.id}`)
      const name = this.record.character
      return parts.length ? `This completes the task. ${name} receives: ${parts.join(', ')}.` : 'This completes the task.'
    },
    primaryLabel () {
      if (!this.pending) return ''
      if (this.completes) return 'Complete task'
      return this.pending.button
    }
  },
  mounted () { this.load(this.tab) },
  methods: {
    tablistKeydown,
    onHide (event) {
      if (this.saving) {
        event.preventDefault()
        return
      }
      this.$emit('close')
    },
    errorText (error, fallback) { return (error.response && error.response.data && error.response.data.error) || fallback },
    setTab (tab) {
      if (this.tab === tab) return
      this.tab = tab
      this.result = null
      if (!this.panes[tab].data && !this.panes[tab].loading) this.load(tab)
    },
    async load (tab) {
      const pane = this.panes[tab]
      pane.loading = true
      pane.error = ''
      try {
        const { data } = await SpireApi.v1().get(`${this.endpoint}/${tab}`, { params: this.params })
        pane.data = data || {}
      } catch (error) {
        pane.error = this.errorText(error, 'This could not be loaded.')
      } finally {
        pane.loading = false
      }
    },
    typeLabel (type) { return { shared: 'Shared', quest: 'Quest' }[type] || 'Task' },
    // The most an "Add…" may add: up to the goal in game; offline, one short of
    // it, because completing a step offline would skip its reward.
    addLimit (task, activity) {
      const left = Math.max(0, activity.goal - activity.done)
      return this.panes.tasks.data && this.panes.tasks.data.state === 'in_zone' ? left : Math.max(0, left - 1)
    },
    offlineCapped (activity) { return this.state !== 'in_zone' && activity.goal - activity.done >= 1 },
    ask (action, target, activity = null) {
      const name = this.record.character
      const step = activity ? activity.description : ''
      const pending = { action, task: null, activity, target, details: [], danger: false }
      // Every change but adding progress takes something away: it says what
      // is lost and confirms with the danger button.
      if (action === 'reset_activity') {
        Object.assign(pending, { task: target, question: `Reset “${step}” of ${target.title} to 0?`, button: 'Reset step', danger: true })
        pending.consequence = `The step’s progress is lost; ${name} has to do it again.`
        pending.details = [{ label: 'Step', value: step }, { label: 'Progress', value: `${activity.done}/${activity.goal} → 0/${activity.goal}` }]
      } else if (action === 'update_activity') {
        Object.assign(pending, { task: target, question: `Add progress to “${step}” of ${target.title}?`, button: 'Add progress' })
        pending.details = [{ label: 'Step', value: step }, { label: 'Progress', value: `${activity.done}/${activity.goal}` }]
        this.count = 1
      } else if (action === 'remove_task') {
        Object.assign(pending, { task: target, question: `Remove ${target.title} from ${name}’s tasks?`, button: 'Remove task', danger: true })
        pending.consequence = 'The task and all of its progress are lost. Giving it back means starting over.'
        pending.details = [{ label: 'Task', value: target.title }]
      } else if (action === 'clear_completed') {
        Object.assign(pending, { question: `Clear the completed record of ${target.title}?`, button: 'Clear record', danger: true })
        pending.consequence = `${name} may be able to take the task, and earn its reward, again.`
        pending.details = [{ label: 'Task', value: target.title }, { label: 'Completed', value: this.formatDate(target.completed_at) }]
      } else if (action === 'clear_timer') {
        const kind = target.kind === 'request' ? 'request' : 'replay'
        Object.assign(pending, { question: `Clear the ${kind} timer of ${target.title}?`, button: 'Clear timer', danger: true })
        pending.consequence = `${name} can ${kind === 'request' ? 'request' : 'replay'} the task again right away.`
        pending.details = [{ label: 'Task', value: target.title }, { label: 'Ends', value: this.formatDate(target.expires_at) }]
      } else if (action === 'remove_lockout') {
        Object.assign(pending, { question: `Remove the lockout ${target.expedition}: ${target.event}?`, button: 'Remove lockout', danger: true })
        pending.consequence = `${name} can enter again before the lockout would have ended.`
        pending.details = [{ label: 'Expedition', value: target.expedition }, { label: 'Event', value: target.event }, { label: 'Expires in', value: this.remaining(target.remaining_seconds) }]
      }
      const active = document.activeElement
      this.pendingOpener = active && active.getAttribute ? active.getAttribute('aria-label') : null
      this.pending = pending
      this.reason = ''
      this.error = ''
      this.result = null
      focusLater(() => action === 'update_activity' ? this.$refs.count : this.$refs.reason)
    },
    cancelPending () {
      const label = this.pendingOpener
      this.pending = null
      this.error = ''
      // Back to the row button that asked, found again by its name.
      focusLater(() => {
        const content = this.dialogElement()
        return content && label ? Array.from(content.querySelectorAll('button[aria-label]')).find(button => button.getAttribute('aria-label') === label) : null
      })
    },
    focusFirst () { this.focusInDialog('.quests-bar [aria-selected="true"]') },
    async submit () {
      if (!this.pending || this.saving) return
      if (!this.countValid) {
        focusLater(() => this.$refs.count)
        return
      }
      if (!this.$refs.reason.check()) return
      const pending = this.pending
      const lockout = pending.action === 'remove_lockout'
      const body = lockout
        ? { lockout_id: pending.target.id, reason: this.reason.trim(), request_id: newRequestId() }
        : {
            action: pending.action,
            task_id: pending.target.task_id,
            activity_id: pending.activity ? pending.activity.activity_id : pending.action === 'remove_task' ? -1 : 0,
            count: pending.action === 'update_activity' ? this.count : 0,
            timer_id: pending.action === 'clear_timer' ? pending.target.id : 0,
            expected_done: pending.activity ? pending.activity.done : 0,
            reason: this.reason.trim(),
            request_id: newRequestId()
          }
      const tab = lockout ? 'lockouts' : 'tasks'
      this.saving = true
      this.error = ''
      let receipt = null
      try {
        const { data, status } = await SpireApi.v1().put(`${this.endpoint}/${tab}`, body, { params: this.params })
        receipt = { status: status === 202 || (data && data.status === 'unconfirmed') ? 'unconfirmed' : (data && data.status) || 'sent', message: (data && data.message) || 'Done.' }
        this.result = receipt
        this.pending = null
        focusLater(() => this.dialogElement())
      } catch (error) {
        const response = error.response
        if (!response || (response.status >= 500 && response.status !== 503)) {
          receipt = { status: 'unconfirmed', message: 'The game server did not confirm the change. Check the result in game before trying again.' }
          this.result = receipt
          this.pending = null
        } else {
          this.error = this.errorText(error, 'The change could not be saved.')
          if (response.status === 409 || response.status === 404) receipt = { status: 'failed', message: this.error }
        }
      } finally {
        this.saving = false
      }
      if (receipt) {
        this.$emit('receipt', receipt)
        this.load(tab)
      }
    },
    async reloadCache () {
      if (this.saving) return
      this.saving = true
      this.result = null
      try {
        const { data } = await SpireApi.v1().put(`${this.endpoint}/flags/cache`, {}, { params: this.params })
        this.result = { status: (data && data.status) || 'sent', message: (data && data.message) || 'Zones will read data buckets from the database again.' }
        this.$emit('receipt', this.result)
      } catch (error) {
        this.result = { status: 'failed', message: this.errorText(error, 'World did not accept the reload.') }
      } finally {
        this.saving = false
      }
    },
    remaining (seconds) {
      const total = Math.max(0, Number(seconds) || 0)
      const days = Math.floor(total / 86400)
      const hours = Math.floor((total % 86400) / 3600)
      const minutes = Math.floor((total % 3600) / 60)
      if (days) return `${days}d ${hours}h`
      if (hours) return `${hours}h ${minutes}m`
      return minutes ? `${minutes}m` : 'under a minute'
    },
    coins (copper) {
      const parts = []
      let left = Number(copper) || 0
      for (const [size, unit] of [[1000, 'platinum'], [100, 'gold'], [10, 'silver'], [1, 'copper']]) {
        const amount = Math.floor(left / size)
        left -= amount * size
        if (amount) parts.push(`${amount.toLocaleString()} ${unit}`)
      }
      return parts.join(' ')
    },
    formatDate (value) {
      return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
    }
  }
}
</script>

<style>
/* The tab bar runs edge to edge under the header, as in Recovery. */
.support-modal.support-quests-modal .modal-body { padding: 0; }
</style>

<style scoped>
/* Layout only. Colours, type, radius and spacing come from support-theme.css. */
/* The tab bar stays in view while the body scrolls; tables stick under it. */
.quests-bar {
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
.quests-body { --support-sticky-offset: var(--support-tab-height); display: grid; gap: var(--support-space-4); padding: var(--support-space-4) var(--support-space-5) var(--support-space-5); }
.quests-body > .support-callout,
.quests-body > .support-feedback { margin: 0; }
.quests-gap { margin: var(--support-space-3) 0 0; }
.quests-gap-sm { margin-top: 6px; }
.quests-quiet { margin: 0; color: var(--support-muted); font-size: var(--support-text-sm); }

/* Confirmation */
.quests-confirm { display: grid; gap: var(--support-space-3); }
.quests-confirm .support-modal-lead,
.quests-confirm > .support-callout { margin: 0; }
.quests-amount { display: grid; justify-items: start; }
.quests-amount .support-label { margin-top: 0; }
.quests-amount .support-feedback { margin-top: 6px; }
.quests-amount .support-callout { justify-self: stretch; }
.quests-count { width: 120px; font-variant-numeric: tabular-nums; }

/* Task cards */
.quests-card { display: grid; gap: var(--support-space-2); padding: var(--support-space-3) var(--support-space-4); border: 1px solid var(--support-border); border-radius: var(--support-radius-lg); background: var(--support-pane); }
.quests-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--support-space-3); }
.quests-card-title { display: grid; gap: var(--support-space-1); min-width: 0; }
.quests-card-title strong { color: var(--support-text); font-size: var(--support-text-md); font-weight: 600; overflow-wrap: anywhere; }
.quests-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; color: var(--support-muted); font-size: var(--support-text-xs); }
.quests-steps { display: grid; margin: 0; padding: 0; list-style: none; }
/* Icon, step, progress and actions in fixed columns, so numbers line up. */
.quests-step { display: grid; grid-template-columns: 16px minmax(0, 1fr) 48px 132px; align-items: center; gap: var(--support-space-2) var(--support-space-3); min-height: 44px; padding: var(--support-space-1) 0; border-top: 1px solid var(--support-border-subtle); }
.quests-step > i { color: var(--support-faint); font-size: 14px; }
.quests-step.is-done > i { color: var(--support-success); }
.quests-step-text { display: grid; gap: 2px; min-width: 0; color: var(--support-text-secondary); font-size: var(--support-text-sm); overflow-wrap: anywhere; }
.quests-step.is-done .quests-step-text { color: var(--support-muted); }
.quests-numbers { color: var(--support-text); font-size: var(--support-text-sm); font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
.quests-step.is-done .quests-numbers { color: var(--support-muted); }
.quests-step-actions { display: flex; justify-content: flex-end; gap: 6px; }

/* Sections and rows */
.quests-section { display: grid; gap: var(--support-space-2); min-width: 0; }
.quests-section .support-section-label { margin: 0; }
.quests-section-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--support-space-1) var(--support-space-3); }
.quests-section-head .support-section-label { margin: 0; }
.support-section-label .support-count { letter-spacing: 0; }
.quests-rows { display: grid; gap: var(--support-space-1); margin: 0; padding: 0; list-style: none; }
.quests-rows li { display: flex; align-items: center; justify-content: space-between; gap: var(--support-space-3); padding: var(--support-space-2) var(--support-space-3); border: 1px solid var(--support-border); border-radius: var(--support-radius); background: var(--support-raised); }
.quests-row-text { display: grid; gap: 2px; min-width: 0; }
.quests-row-text strong { color: var(--support-text); font-size: var(--support-text-sm); font-weight: 600; overflow-wrap: anywhere; }
.quests-row-text small { color: var(--support-muted); font-size: var(--support-text-xs); }
.quests-line { display: flex; align-items: center; gap: var(--support-space-2); margin: var(--support-space-1) 0 0; color: var(--support-text-secondary); font-size: var(--support-text-sm); }
.quests-line i { color: var(--support-muted); }
.quests-line strong { color: var(--support-text); font-weight: 600; }
.quests-section > .support-callout { margin: 0; }

/* Flags */
.quests-filter { max-width: 360px; }
.quests-filter-count { flex: none; color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.quests-flags { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--support-space-4); }
.quests-flag-list { display: grid; align-content: start; gap: var(--support-space-2); min-width: 0; }
.quests-flag-list.is-wide { grid-column: 1 / -1; }
.quests-open { display: inline-flex; align-items: center; gap: 4px; font-size: var(--support-text-xs); }
.quests-compact { display: grid; margin: 0; padding: 0; overflow: hidden; border: 1px solid var(--support-border); border-radius: var(--support-radius); background: var(--support-sunken); list-style: none; }
.quests-compact li { padding: 6px 10px; color: var(--support-text-secondary); font-size: var(--support-text-sm); overflow-wrap: anywhere; }
.quests-compact li + li { border-top: 1px solid var(--support-border-subtle); }
/* Key and value columns: long names and values are cut with a title. */
.quests-kv-table { table-layout: fixed; }
.quests-kv-table th:first-child { width: 42%; }
.quests-kv-table td:last-child { width: 170px; }
.quests-kv-table code { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom; }
.quests-kv-table td.quests-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.quests-value { color: var(--support-text); font-weight: 600; }
.quests-reload { display: flex; align-items: center; justify-content: space-between; gap: var(--support-space-4); padding: var(--support-space-3); border: 1px solid var(--support-border); border-radius: var(--support-radius-lg); background: var(--support-pane); }

/* Phones: each row becomes a small card of label and value instead of a wide table. */
@media (max-width: 600px) {
  .quests-table thead { display: none; }
  .quests-table tr { display: grid; gap: 2px; padding: var(--support-space-2) 0; border-bottom: 1px solid var(--support-border-subtle); }
  .quests-table th,
  .quests-table td { display: flex; justify-content: space-between; gap: var(--support-space-3); width: auto !important; padding: 0; border: 0; text-align: right; white-space: normal; }
  .quests-table [data-label]::before { content: attr(data-label); flex: none; color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 400; text-align: left; }
  .quests-table td:not([data-label]) { justify-content: flex-end; }
  .quests-bar { padding: 0 var(--support-space-2) 0 var(--support-space-4); }
  .quests-bar .support-tabs { gap: var(--support-space-4); }
  .quests-body { padding: var(--support-space-3) var(--support-space-4) var(--support-space-4); }
  .quests-card { padding: var(--support-space-3); }
  .quests-card-head { flex-direction: column; }
  .quests-step { grid-template-columns: 16px minmax(0, 1fr) auto; }
  .quests-step-actions { grid-column: 2 / -1; justify-content: flex-start; }
  .quests-flags { grid-template-columns: minmax(0, 1fr); }
  .quests-reload { flex-direction: column; align-items: flex-start; }
}
</style>
