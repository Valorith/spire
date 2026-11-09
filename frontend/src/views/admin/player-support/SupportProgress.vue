<template>
  <b-modal visible scrollable centered size="lg" modal-class="support-modal support-quests-modal" :title="'Quests & progress · ' + record.character"
           :no-close-on-backdrop="saving" :no-close-on-esc="saving" :hide-header-close="saving" @hide="onHide">
    <div class="quests-bar">
      <div class="support-tabs" role="group" aria-label="Progress tools">
        <button v-for="option in tabOptions" :key="option.id" type="button" :aria-pressed="String(tab === option.id)" :disabled="Boolean(pending) || saving"
                @click="setTab(option.id)">
          <i :class="option.icon" aria-hidden="true"></i> {{ option.label }}
        </button>
      </div>
      <button type="button" class="support-button is-ghost is-icon is-sm" aria-label="Refresh" title="Refresh" :disabled="current.loading || saving || Boolean(pending)" @click="load(tab)">
        <i class="fe fe-refresh-cw" aria-hidden="true"></i>
      </button>
    </div>

    <div class="quests-body">
      <p v-if="stateLine" class="support-callout quests-state" :class="stateLine.tone">
        <i :class="stateLine.icon" aria-hidden="true"></i><span>{{ stateLine.text }}</span>
      </p>
      <p v-if="result && !pending" class="support-callout" :class="resultTone" :role="result.status === 'sent' ? 'status' : 'alert'">
        <i :class="resultIcon" aria-hidden="true"></i><span>{{ result.message }}</span>
      </p>

      <!-- Confirmation for every change, with the reason -->
      <section v-if="pending" class="quests-confirm" aria-label="Confirm change">
        <p class="support-modal-lead">{{ pending.question }}</p>
        <dl class="support-dl quests-confirm-dl">
          <template v-for="row in pending.details"><dt :key="row.label + '-t'">{{ row.label }}</dt><dd :key="row.label + '-d'">{{ row.value }}</dd></template>
          <dt>Applies</dt><dd>{{ appliesText }}</dd>
        </dl>
        <template v-if="pending.action === 'update_activity'">
          <label for="quests-count" class="support-label">Amount to add <span class="support-label-hint">(1 to {{ addLimit(pending.task, pending.activity) }})</span></label>
          <input id="quests-count" v-model.number="count" class="support-field quests-count" type="number" min="1" :max="addLimit(pending.task, pending.activity)"
                 step="1" inputmode="numeric" :disabled="saving">
          <p v-if="offlineCapped(pending.activity)" class="quests-note">Complete this step while {{ record.character }} is in game.</p>
          <p v-if="completes" class="support-callout is-accent quests-gap"><i class="fe fe-award" aria-hidden="true"></i><span>{{ completesText }}</span></p>
        </template>
        <label for="quests-reason" class="support-label">Reason <span class="support-label-hint">(required, recorded on the case)</span></label>
        <textarea id="quests-reason" ref="reason" v-model="reason" class="support-field" rows="2" maxlength="240" :disabled="saving"
                  aria-describedby="quests-reason-hint" @input="error = ''"></textarea>
        <span id="quests-reason-hint" class="quests-hint" :class="{ 'is-short': reason.trim() && reasonBytes < 8 }">8–240 characters · {{ reasonBytes }}/240</span>
        <p v-if="error" class="support-callout is-danger quests-gap" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>
      </section>

      <template v-else>
        <p v-if="current.error" class="support-callout is-danger" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ current.error }}</span></p>
        <p v-else-if="current.loading && !current.data" class="support-feedback" role="status"><i class="fe fe-loader support-spin" aria-hidden="true"></i> Loading…</p>

        <!-- Tasks -->
        <template v-else-if="tab === 'tasks' && current.data">
          <div v-if="!tasks.length" class="support-empty is-compact"><i class="fe fe-check-square" aria-hidden="true"></i><span>No active tasks.</span></div>
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
                      @click="ask('remove_task', task)">Remove task</button>
            </header>
            <p v-if="task.type === 'shared'" class="quests-note">Read-only. Shared tasks are managed by the shared task system; use #task in game.</p>
            <ul class="quests-steps">
              <li v-for="activity in task.activities" :key="activity.activity_id" class="quests-step" :class="{ 'is-done': activity.completed }">
                <i :class="activity.completed ? 'fe fe-check-circle' : 'fe fe-circle'" aria-hidden="true"></i>
                <div class="quests-step-text">
                  <span>{{ activity.description }} · <span class="quests-numbers">{{ activity.done }}/{{ activity.goal }}</span>
                    <span v-if="activity.optional" class="support-chip">Optional</span></span>
                  <small v-if="canWrite && task.type !== 'shared' && canChangeTasks && !activity.completed && addLimit(task, activity) < 1">
                    Complete this step while {{ record.character }} is in game.
                  </small>
                </div>
                <div v-if="canWrite && task.type !== 'shared'" class="quests-step-actions">
                  <button v-if="activity.done > 0" type="button" class="support-button is-sm" :disabled="!canChangeTasks"
                          :aria-label="'Reset ' + activity.description" @click="ask('reset_activity', task, activity)">Reset</button>
                  <button v-if="!activity.completed" type="button" class="support-button is-sm" :disabled="!canChangeTasks || addLimit(task, activity) < 1"
                          :aria-label="'Add progress to ' + activity.description" @click="ask('update_activity', task, activity)">Add…</button>
                </div>
              </li>
            </ul>
          </article>

          <section class="quests-section" aria-labelledby="quests-completed">
            <div class="quests-section-head">
              <h3 id="quests-completed" class="support-section-label">Completed <span v-if="completed.length" class="support-count">{{ completed.length }}</span></h3>
              <span v-if="canWrite && completed.length && state !== 'offline'" class="quests-note">Clear completed records while {{ record.character }} is offline.</span>
            </div>
            <p v-if="!completed.length" class="quests-quiet">No completed tasks on record.</p>
            <ul v-else class="quests-rows">
              <li v-for="item in completed" :key="'c' + item.task_id + item.completed_at">
                <span class="quests-row-text"><strong>{{ item.title }}</strong><small>Completed {{ formatDate(item.completed_at) }}</small></span>
                <button v-if="canWrite" type="button" class="support-button is-sm" :disabled="state !== 'offline'"
                        :aria-label="'Clear record of ' + item.title" @click="ask('clear_completed', item)">Clear record</button>
              </li>
            </ul>
          </section>

          <section class="quests-section" aria-labelledby="quests-timers">
            <div class="quests-section-head">
              <h3 id="quests-timers" class="support-section-label">Timers <span v-if="timers.length" class="support-count">{{ timers.length }}</span></h3>
              <span v-if="canWrite && timers.length && state !== 'offline'" class="quests-note">Clear timers while {{ record.character }} is offline.</span>
            </div>
            <p v-if="!timers.length" class="quests-quiet">No task timers.</p>
            <ul v-else class="quests-rows">
              <li v-for="timer in timers" :key="'t' + timer.id">
                <span class="quests-row-text"><strong>{{ timer.title }}</strong><small>{{ timer.kind === 'request' ? 'Request' : 'Replay' }} timer · ends {{ formatDate(timer.expires_at) }}</small></span>
                <button v-if="canWrite" type="button" class="support-button is-sm" :disabled="state !== 'offline'"
                        :aria-label="'Clear timer of ' + timer.title" @click="ask('clear_timer', timer)">Clear</button>
              </li>
            </ul>
          </section>
        </template>

        <!-- Lockouts -->
        <template v-else-if="tab === 'lockouts' && current.data">
          <section class="quests-section" aria-labelledby="quests-lockouts">
            <h3 id="quests-lockouts" class="support-section-label">Lockouts <span v-if="lockouts.length" class="support-count">{{ lockouts.length }}</span></h3>
            <div v-if="!lockouts.length" class="support-empty is-compact"><i class="fe fe-clock" aria-hidden="true"></i><span>No lockouts.</span></div>
            <div v-else class="quests-table-wrap">
              <table class="support-table">
                <thead><tr><th scope="col">Expedition</th><th scope="col">Event</th><th scope="col">Expires in</th><th v-if="canWrite" scope="col"><span class="sr-only">Action</span></th></tr></thead>
                <tbody>
                  <tr v-for="lockout in lockouts" :key="lockout.id">
                    <th scope="row">{{ lockout.expedition }}</th>
                    <td data-label="Event">{{ lockout.event }}</td>
                    <td data-label="Expires in" class="quests-nowrap" :title="formatDate(lockout.expires_at)">{{ remaining(lockout.remaining_seconds) }}</td>
                    <td v-if="canWrite" class="quests-cell-action">
                      <button type="button" class="support-button is-sm" :disabled="!canChangeLockouts" :aria-label="'Remove lockout ' + lockout.expedition + ': ' + lockout.event"
                              @click="ask('remove_lockout', lockout)">Remove…</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="quests-section" aria-labelledby="quests-instances">
            <h3 id="quests-instances" class="support-section-label">Instances <span v-if="instances.length" class="support-count">{{ instances.length }}</span></h3>
            <p v-if="!instances.length" class="quests-quiet">No instances.</p>
            <div v-else class="quests-table-wrap">
              <table class="support-table">
                <thead><tr><th scope="col">Zone</th><th scope="col">Expedition</th><th scope="col">Instance</th><th scope="col">Expires</th></tr></thead>
                <tbody>
                  <tr v-for="instance in instances" :key="instance.instance_id">
                    <th scope="row">{{ instance.zone_name || 'Zone #' + instance.zone_id }}</th>
                    <td data-label="Expedition">{{ instance.dz_name || '—' }}</td>
                    <td data-label="Instance">#{{ instance.instance_id }} · v{{ instance.version }}</td>
                    <td data-label="Expires" class="quests-nowrap">{{ instance.never_expires ? 'Never' : formatDate(instance.expires_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="quests-line"><i class="fe fe-home" aria-hidden="true"></i>
              <span>Safe return: <strong>{{ safeReturn ? (safeReturn.zone_name || 'Zone #' + safeReturn.zone_id) : 'None set' }}</strong></span>
            </p>
            <p class="support-callout"><i class="fe fe-info" aria-hidden="true"></i><span>Instance membership is read-only here. The player can leave an expedition with /dzquit.</span></p>
          </section>
        </template>

        <!-- Flags -->
        <template v-else-if="tab === 'flags' && current.data">
          <div class="quests-flags">
            <section class="quests-flag-list" aria-labelledby="flags-zones">
              <div class="quests-section-head"><h3 id="flags-zones" class="support-section-label">Zone flags <span v-if="flags.zone_flags.length" class="support-count">{{ flags.zone_flags.length }}</span></h3></div>
              <p v-if="!flags.zone_flags.length" class="quests-quiet">None.</p>
              <ul v-else class="quests-compact">
                <li v-for="flag in flags.zone_flags" :key="flag.zone_id">{{ flag.zone_name || 'Zone #' + flag.zone_id }}</li>
              </ul>
            </section>
            <section class="quests-flag-list" aria-labelledby="flags-keys">
              <div class="quests-section-head">
                <h3 id="flags-keys" class="support-section-label">Keys <span v-if="flags.keys.length" class="support-count">{{ flags.keys.length }}</span></h3>
                <router-link v-if="links.keyring" :to="links.keyring" class="support-link quests-open">Open in Inventory &amp; Keyring <i class="fe fe-arrow-up-right" aria-hidden="true"></i></router-link>
              </div>
              <p v-if="!flags.keys.length" class="quests-quiet">None.</p>
              <ul v-else class="quests-compact">
                <li v-for="key in flags.keys" :key="key.item_id">{{ key.name || 'Item #' + key.item_id }}</li>
              </ul>
            </section>
            <section class="quests-flag-list is-wide" aria-labelledby="flags-buckets">
              <div class="quests-section-head">
                <h3 id="flags-buckets" class="support-section-label">Data buckets <span v-if="flags.buckets.length" class="support-count">{{ flags.buckets.length }}</span></h3>
                <router-link v-if="links.buckets" :to="links.buckets" class="support-link quests-open">Open in Data Buckets <i class="fe fe-arrow-up-right" aria-hidden="true"></i></router-link>
              </div>
              <p v-if="!flags.buckets.length" class="quests-quiet">None.</p>
              <ul v-else class="quests-compact">
                <li v-for="bucket in flags.buckets" :key="bucket.id" class="quests-kv">
                  <code>{{ bucket.key }}</code><span class="quests-value">{{ bucket.value }}</span>
                  <span class="support-chip">{{ bucket.scope === 'account' ? 'Account' : 'Character' }}</span>
                  <small v-if="bucket.expires_at">until {{ formatDate(bucket.expires_at) }}</small>
                </li>
              </ul>
            </section>
            <section class="quests-flag-list is-wide" aria-labelledby="flags-globals">
              <div class="quests-section-head">
                <h3 id="flags-globals" class="support-section-label">Quest globals <span v-if="flags.quest_globals.length" class="support-count">{{ flags.quest_globals.length }}</span></h3>
                <router-link v-if="links.qglobals" :to="links.qglobals" class="support-link quests-open">Open in QGlobals <i class="fe fe-arrow-up-right" aria-hidden="true"></i></router-link>
              </div>
              <p v-if="!flags.quest_globals.length" class="quests-quiet">None.</p>
              <ul v-else class="quests-compact">
                <li v-for="global in flags.quest_globals" :key="global.name + global.npc_id + global.zone_id" class="quests-kv">
                  <code>{{ global.name }}</code><span class="quests-value">{{ global.value }}</span>
                  <small v-if="global.expires_at">until {{ formatDate(global.expires_at) }}</small>
                </li>
              </ul>
            </section>
          </div>
          <div v-if="canReloadCache" class="quests-reload">
            <div class="quests-row-text">
              <strong>Game cache</strong>
              <small>{{ flags.local_world ? 'After editing data buckets, this makes zones read them again.' : 'Needs the game server this Spire runs beside' }}</small>
            </div>
            <button type="button" class="support-button" :disabled="!flags.local_world || saving" @click="reloadCache">
              <i :class="saving ? 'fe fe-loader support-spin' : 'fe fe-refresh-cw'" aria-hidden="true"></i> Reload game cache
            </button>
          </div>
        </template>
      </template>
    </div>

    <template #modal-footer>
      <template v-if="pending">
        <button type="button" class="support-button" :disabled="saving" @click="cancelPending">Back</button>
        <button type="button" class="support-button is-primary" :disabled="!canSubmit" @click="submit">
          {{ saving ? 'Saving…' : primaryLabel }}
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
import { newRequestId } from './support-ui'

function blank () { return { data: null, loading: false, error: '' } }

export default {
  name: 'SupportProgress',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    features: { type: Object, default: () => ({}) },
    canWrite: { type: Boolean, default: false },
    canReloadCache: { type: Boolean, default: false },
    // 'tasks', 'lockouts' or 'flags'
    initialTab: { type: String, default: 'tasks' }
  },
  data () {
    return {
      tab: ['tasks', 'lockouts', 'flags'].includes(this.initialTab) ? this.initialTab : 'tasks',
      panes: { tasks: blank(), lockouts: blank(), flags: blank() },
      pending: null,
      count: 1,
      reason: '',
      saving: false,
      error: '',
      result: null,
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
    reasonBytes () { return new TextEncoder().encode(this.reason.trim()).length },
    countValid () {
      if (!this.pending || this.pending.action !== 'update_activity') return true
      return Number.isInteger(this.count) && this.count >= 1 && this.count <= this.addLimit(this.pending.task, this.pending.activity)
    },
    canSubmit () { return Boolean(this.pending) && !this.saving && this.reasonBytes >= 8 && this.reasonBytes <= 240 && this.countValid },
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
    },
    resultTone () { return { sent: 'is-success', unconfirmed: 'is-warning' }[this.result && this.result.status] || 'is-danger' },
    resultIcon () { return { sent: 'fe fe-check-circle', unconfirmed: 'fe fe-alert-triangle' }[this.result && this.result.status] || 'fe fe-alert-circle' }
  },
  mounted () { this.load(this.tab) },
  methods: {
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
      if (action === 'reset_activity') {
        Object.assign(pending, { task: target, question: `Reset “${step}” of ${target.title} to 0?`, button: 'Reset step' })
        pending.details = [{ label: 'Step', value: step }, { label: 'Progress', value: `${activity.done}/${activity.goal} → 0/${activity.goal}` }]
      } else if (action === 'update_activity') {
        Object.assign(pending, { task: target, question: `Add progress to “${step}” of ${target.title}?`, button: 'Add progress' })
        pending.details = [{ label: 'Step', value: step }, { label: 'Progress', value: `${activity.done}/${activity.goal}` }]
        this.count = 1
      } else if (action === 'remove_task') {
        Object.assign(pending, { task: target, question: `Remove ${target.title} from ${name}’s tasks? Its progress is lost.`, button: 'Remove task', danger: true })
        pending.details = [{ label: 'Task', value: target.title }]
      } else if (action === 'clear_completed') {
        Object.assign(pending, { question: `Clear the completed record of ${target.title}? ${name} may be able to take it again.`, button: 'Clear record' })
        pending.details = [{ label: 'Task', value: target.title }, { label: 'Completed', value: this.formatDate(target.completed_at) }]
      } else if (action === 'clear_timer') {
        const kind = target.kind === 'request' ? 'request' : 'replay'
        Object.assign(pending, { question: `Clear the ${kind} timer of ${target.title}?`, button: 'Clear timer' })
        pending.details = [{ label: 'Task', value: target.title }, { label: 'Ends', value: this.formatDate(target.expires_at) }]
      } else if (action === 'remove_lockout') {
        Object.assign(pending, { question: `Remove the lockout ${target.expedition}: ${target.event}? ${name} can enter again.`, button: 'Remove lockout' })
        pending.details = [{ label: 'Expedition', value: target.expedition }, { label: 'Event', value: target.event }, { label: 'Expires in', value: this.remaining(target.remaining_seconds) }]
      }
      this.pending = pending
      this.reason = ''
      this.error = ''
      this.result = null
      this.$nextTick(() => { if (this.$refs.reason) this.$refs.reason.focus() })
    },
    cancelPending () {
      this.pending = null
      this.error = ''
    },
    async submit () {
      if (!this.canSubmit) return
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
      } catch (error) {
        const response = error.response
        if (!response || (response.status >= 500 && response.status !== 503)) {
          receipt = { status: 'unconfirmed', message: 'Check the result in game before retrying. The change could not be confirmed.' }
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
.quests-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--support-space-3); padding: 0 var(--support-space-4) 0 var(--support-space-5); border-bottom: 1px solid var(--support-border); }
.quests-body { display: grid; gap: var(--support-space-4); padding: var(--support-space-4) var(--support-space-5) var(--support-space-5); }
.quests-body > .support-callout,
.quests-body > .support-feedback { margin: 0; }
.quests-gap { margin: var(--support-space-3) 0 0; }
.quests-note { margin: 0; color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.45; }
.quests-quiet { margin: 0; color: var(--support-muted); font-size: var(--support-text-sm); }
.quests-hint { display: block; margin-top: 6px; color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.quests-hint.is-short { color: var(--support-warning); }
.quests-nowrap { white-space: nowrap; }

/* Confirmation */
.quests-confirm { display: grid; }
.quests-confirm-dl { margin-top: var(--support-space-3); padding: var(--support-space-3); border: 1px solid var(--support-border); border-radius: var(--support-radius); background: var(--support-pane); }
.quests-confirm .support-label { margin-top: var(--support-space-4); }
.quests-confirm .quests-count { width: 120px; font-variant-numeric: tabular-nums; }
.quests-confirm .quests-note { margin-top: 6px; }

/* Task cards */
.quests-card { display: grid; gap: var(--support-space-2); padding: var(--support-space-3) var(--support-space-4); border: 1px solid var(--support-border); border-radius: var(--support-radius-lg); background: var(--support-pane); }
.quests-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--support-space-3); }
.quests-card-title { display: grid; gap: var(--support-space-1); min-width: 0; }
.quests-card-title strong { color: var(--support-text); font-size: var(--support-text-md); font-weight: 600; overflow-wrap: anywhere; }
.quests-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; color: var(--support-muted); font-size: var(--support-text-xs); }
.quests-steps { display: grid; margin: 0; padding: 0; list-style: none; }
.quests-step { display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; align-items: center; gap: var(--support-space-2) var(--support-space-3); padding: var(--support-space-2) 0; border-top: 1px solid var(--support-border-subtle); }
.quests-step > i { color: var(--support-faint); font-size: 14px; }
.quests-step.is-done > i { color: var(--support-success); }
.quests-step-text { display: grid; gap: 2px; min-width: 0; color: var(--support-text-secondary); font-size: var(--support-text-sm); overflow-wrap: anywhere; }
.quests-step-text small { color: var(--support-muted); font-size: var(--support-text-xs); }
.quests-step.is-done .quests-step-text { color: var(--support-muted); }
.quests-numbers { color: var(--support-text); font-weight: 600; font-variant-numeric: tabular-nums; }
.quests-step.is-done .quests-numbers { color: var(--support-muted); }
.quests-step-actions { display: flex; gap: 6px; }

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
.quests-table-wrap { min-width: 0; overflow-x: auto; }
.quests-table-wrap .support-table { min-width: 440px; }
.quests-cell-action { text-align: right; }
.quests-line { display: flex; align-items: center; gap: var(--support-space-2); margin: var(--support-space-1) 0 0; color: var(--support-text-secondary); font-size: var(--support-text-sm); }
.quests-line i { color: var(--support-muted); }
.quests-line strong { color: var(--support-text); font-weight: 600; }
.quests-section > .support-callout { margin: 0; }

/* Flags */
.quests-flags { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--support-space-4); }
.quests-flag-list { display: grid; align-content: start; gap: var(--support-space-2); min-width: 0; }
.quests-flag-list.is-wide { grid-column: 1 / -1; }
.quests-open { display: inline-flex; align-items: center; gap: 4px; font-size: var(--support-text-xs); }
.quests-compact { display: grid; margin: 0; padding: 0; overflow: hidden; border: 1px solid var(--support-border); border-radius: var(--support-radius); background: var(--support-sunken); list-style: none; }
.quests-compact li { padding: 6px 10px; color: var(--support-text-secondary); font-size: var(--support-text-sm); overflow-wrap: anywhere; }
.quests-compact li + li { border-top: 1px solid var(--support-border-subtle); }
.quests-kv { display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-1) var(--support-space-2); }
.quests-kv code { overflow-wrap: anywhere; }
.quests-value { min-width: 0; color: var(--support-text); overflow-wrap: anywhere; }
.quests-kv small { margin-left: auto; color: var(--support-muted); font-size: var(--support-text-xs); }
.quests-reload { display: flex; align-items: center; justify-content: space-between; gap: var(--support-space-4); padding: var(--support-space-3); border: 1px solid var(--support-border); border-radius: var(--support-radius-lg); background: var(--support-pane); }

/* Phones: each row becomes a small card of label and value instead of a wide table. */
@media (max-width: 600px) {
  .quests-table-wrap .support-table { min-width: 0; }
  .quests-table-wrap .support-table thead { display: none; }
  .quests-table-wrap .support-table tr { display: grid; gap: 2px; padding: var(--support-space-2) 0; border-bottom: 1px solid var(--support-border-subtle); }
  .quests-table-wrap .support-table th,
  .quests-table-wrap .support-table td { display: flex; justify-content: space-between; gap: var(--support-space-3); padding: 0; border: 0; text-align: right; white-space: normal; }
  .quests-table-wrap .support-table [data-label]::before { content: attr(data-label); flex: none; color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 400; text-align: left; }
  .quests-table-wrap .support-table td:not([data-label]) { justify-content: flex-end; }
}
@media (max-width: 600px) {
  .quests-bar { padding: 0 var(--support-space-2) 0 var(--support-space-4); }
  .quests-bar .support-tabs { gap: var(--support-space-4); }
  .quests-body { padding: var(--support-space-3) var(--support-space-4) var(--support-space-4); }
  .quests-card { padding: var(--support-space-3); }
  .quests-card-head { flex-direction: column; }
  .quests-step { grid-template-columns: 16px minmax(0, 1fr); }
  .quests-step-actions { grid-column: 2; }
  .quests-flags { grid-template-columns: minmax(0, 1fr); }
  .quests-reload { flex-direction: column; align-items: flex-start; }
}
</style>
