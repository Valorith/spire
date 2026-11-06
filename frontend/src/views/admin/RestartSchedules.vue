<template>
  <section class="restart-workspace" aria-labelledby="restart-title">
    <div v-if="error || loadError" class="restart-error" role="alert">
      <span>{{ error || loadError }}</span>
      <button type="button" class="btn btn-sm btn-outline-light" @click="error = ''; load()">Retry</button>
    </div>
    <div v-if="notice" class="sr-only" role="status">{{ notice }}</div>

    <eq-window-simple v-if="active" class="restart-active" :padding="20">
      <div class="restart-active-content">
        <div>
          <span class="restart-live-dot" aria-hidden="true"></span>
          <strong>{{ active.status === 'restarting' ? 'Restarting server' : 'Restart in ' + countdown }}</strong>
          <span class="restart-active-name">{{ active.name }}</span>
        </div>
        <button v-if="canEdit && active.status === 'countdown'" class="btn btn-outline-light btn-sm" type="button"
                :disabled="busy || active.cancel_requested" @click="cancelRestart">
          {{ active.cancel_requested ? 'Cancelling…' : 'Cancel this restart' }}
        </button>
      </div>
    </eq-window-simple>

    <div class="restart-columns" :class="{ 'restart-columns-editing': draft }">
      <eq-window-simple class="restart-list-window" :padding="0">
        <header class="restart-heading">
          <h1 id="restart-title">Restart schedules</h1>
          <button v-if="canEdit" type="button" class="btn btn-primary" @click="newSchedule">
            <i class="fe fe-plus" aria-hidden="true"></i> Add schedule
          </button>
        </header>
        <div v-if="loading" class="restart-empty" role="status"><b-spinner small/> Loading schedules</div>
        <template v-else>
          <div v-if="upcoming && !active" class="restart-next">
            <i class="fe fe-clock" aria-hidden="true"></i>
            <div><span>Next restart</span><strong>{{ date(upcoming.next_run, upcoming.timezone) }}</strong></div>
            <span class="restart-zone">{{ upcoming.timezone.replace(/_/g, ' ') }}</span>
          </div>
          <div v-if="!schedules.length" class="restart-empty">
            <i class="fe fe-calendar restart-empty-icon" aria-hidden="true"></i>
            <h2>No restart schedules</h2>
            <button v-if="canEdit && !draft" class="btn btn-outline-light" type="button" @click="newSchedule">Add schedule</button>
          </div>
          <transition-group name="schedule-row" tag="div" class="restart-rows">
            <article v-for="schedule in sortedSchedules" :key="schedule.id" class="restart-row"
                     :class="{ 'restart-row-paused': !schedule.enabled && !isActive(schedule), 'restart-row-selected': draft && draft.id === schedule.id }"
                     :data-testid="'schedule-' + schedule.id">
              <div class="restart-row-main">
                <div class="restart-time">{{ schedule.once_at ? time(schedule.once_at, schedule.timezone) : schedule.time }}</div>
                <div class="restart-row-description">
                  <h2>{{ schedule.name }}</h2>
                  <div class="restart-recurrence">{{ recurrence(schedule) }}<span aria-hidden="true"> · </span>{{ schedule.timezone.replace(/_/g, ' ') }}</div>
                </div>
                <button type="button" class="restart-switch" role="switch" :aria-checked="schedule.enabled ? 'true' : 'false'"
                        :aria-label="'Enable ' + schedule.name" :disabled="!canEdit || busy || isActive(schedule)"
                        @click="toggle(schedule)"><span></span></button>
              </div>
              <div class="restart-row-bottom">
                <span>{{ isActive(schedule) ? statusLabel(active.status) : (schedule.enabled ? 'Next: ' + date(schedule.next_run, schedule.timezone) : 'Paused') }}</span>
                <span>{{ warning(schedule.warning_minutes) }}</span>
                <div v-if="canEdit" class="restart-row-actions">
                  <button type="button" class="restart-text-button" :disabled="busy || isActive(schedule)" @click="edit(schedule)">Edit</button>
                  <button type="button" class="restart-icon-button" :disabled="busy || isActive(schedule)" :aria-label="'Delete ' + schedule.name" @click="deleting = schedule.id">
                    <i class="fe fe-trash-2" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
              <div v-if="deleting === schedule.id" class="restart-delete" role="group" :aria-label="'Delete ' + schedule.name + '?'">
                <strong>Delete {{ schedule.name }}?</strong>
                <button type="button" class="btn btn-sm btn-outline-light" :disabled="busy" @click="deleting = null">Keep schedule</button>
                <button type="button" class="btn btn-sm btn-danger" :disabled="busy" @click="remove(schedule)">Delete schedule</button>
              </div>
            </article>
          </transition-group>
        </template>

        <div class="restart-history">
          <h2>Recent restarts</h2>
          <div v-if="!history.length" class="restart-history-empty">No restarts yet</div>
          <ol v-else>
            <li v-for="run in history.slice(0, 10)" :key="run.id" class="restart-history-row">
              <i :class="['fe', run.status === 'succeeded' ? 'fe-check-circle' : 'fe-minus-circle', 'restart-status-' + run.status]" aria-hidden="true"></i>
              <div><strong>{{ run.name }}</strong><span v-if="run.message">{{ run.message }}</span></div>
              <span class="restart-run-status" :class="'restart-status-' + run.status">{{ statusLabel(run.status) }}</span>
              <time :datetime="run.restart_at">{{ date(run.restart_at) }}</time>
            </li>
          </ol>
        </div>
      </eq-window-simple>

      <transition name="restart-editor">
        <eq-window-simple v-if="draft" class="restart-editor-window" :padding="24">
          <form @submit.prevent="save">
            <div class="restart-editor-heading">
              <h2>{{ draft.id ? 'Edit schedule' : 'New schedule' }}</h2>
              <button type="button" class="restart-icon-button" aria-label="Close schedule editor" :disabled="busy" @click="closeEditor"><i class="fe fe-x" aria-hidden="true"></i></button>
            </div>
            <label for="restart-name">Name</label>
            <input id="restart-name" ref="nameInput" v-model="draft.name" class="form-control" required maxlength="80" :disabled="busy" autocomplete="off">

            <fieldset class="restart-repeat"><legend>Repeat</legend>
              <div class="restart-presets">
                <button v-for="choice in presets" :key="choice.value" type="button" :aria-pressed="preset === choice.value ? 'true' : 'false'"
                        :disabled="busy" @click="setPreset(choice.value)">{{ choice.label }}</button>
              </div>
            </fieldset>

            <fieldset v-if="preset === 'weekly'" class="restart-days"><legend>Days</legend>
              <button v-for="(day, index) in days" :key="day" type="button" :aria-label="day" :aria-pressed="draft.days.includes(index) ? 'true' : 'false'"
                      :disabled="busy" @click="toggleDay(index)">{{ day.slice(0, 2) }}</button>
            </fieldset>

            <div class="restart-time-fields">
              <div v-if="preset === 'once'">
                <label for="restart-date">Date</label>
                <input id="restart-date" v-model="onceDate" class="form-control" type="date" required :disabled="busy">
              </div>
              <div>
                <label for="restart-time">Restart at</label>
                <input id="restart-time" v-model="draft.time" type="time" class="form-control restart-time-input" required :disabled="busy">
              </div>
            </div>
            <label for="restart-timezone">Time zone</label>
            <input id="restart-timezone" v-model.trim="draft.timezone" class="form-control" list="restart-timezones" required :disabled="busy" autocomplete="off">
            <datalist id="restart-timezones"><option v-for="zone in timezones" :key="zone" :value="zone"/></datalist>

            <label for="restart-warning">Warn players before restart</label>
            <select id="restart-warning" v-model.number="draft.warning_minutes" class="form-control" :disabled="busy">
              <option :value="0">No warning</option>
              <option v-for="minutes in [1, 5, 10, 15, 30, 60]" :key="minutes" :value="minutes">{{ minutes }} {{ minutes === 1 ? 'minute' : 'minutes' }}</option>
            </select>

            <div class="restart-preview" aria-live="polite">
              <h3>Upcoming restarts</h3>
              <span v-if="previewError" class="restart-preview-error">{{ previewError }}</span>
              <ol v-else-if="preview.length"><li v-for="next in preview" :key="next">{{ date(next, draft.timezone) }}</li></ol>
              <span v-else>{{ previewLoading ? 'Calculating…' : 'Choose a time and day' }}</span>
            </div>
            <div class="restart-editor-footer">
              <button class="btn btn-primary" type="submit" :disabled="busy || previewLoading || !!previewError || !preview.length">
                {{ busy ? 'Saving…' : 'Save schedule' }}
              </button>
              <button class="restart-text-button" type="button" :disabled="busy" @click="closeEditor">Cancel</button>
            </div>
          </form>
        </eq-window-simple>
      </transition>
    </div>
  </section>
</template>

<script>
  import { SpireApi } from '@/app/api/spire-api'
  import { canWriteAdminApi } from '@/app/user/server-admin-access'
  import EqWindowSimple from '@/components/eq-ui/EQWindowSimple.vue'

  const endpoint = 'eqemuserver/server/restart-schedules'
  const requestTimeout = 15000
  const allDays = [0, 1, 2, 3, 4, 5, 6]
  const defaultNames = { daily: 'Daily restart', weekdays: 'Weekday restart', weekly: 'Weekly restart', once: 'One-time restart' }
  const clone = value => JSON.parse(JSON.stringify(value))

  export default {
    components: { EqWindowSimple },
    data () {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      return {
        schedules: [],
        history: [],
        active: null,
        loading: true,
        busy: false,
        draft: null,
        preset: 'daily',
        onceDate: '',
        deleting: null,
        error: '',
        loadError: '',
        loadVersion: 0,
        notice: '',
        preview: [],
        previewError: '',
        previewLoading: false,
        previewVersion: 0,
        now: Date.now(),
        pollTimer: null,
        clockTimer: null,
        previewTimer: null,
        disposed: false,
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        presets: [{ value: 'daily', label: 'Daily' }, { value: 'weekdays', label: 'Weekdays' }, { value: 'weekly', label: 'Weekly' }, { value: 'once', label: 'Once' }],
        timezones: typeof Intl.supportedValuesOf === 'function' ? Array.from(new Set(['UTC', zone, ...Intl.supportedValuesOf('timeZone')])).sort() : [zone, 'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Australia/Sydney']
      }
    },
    computed: {
      canEdit () { return canWriteAdminApi(endpoint) },
      sortedSchedules () {
        return [...this.schedules].sort((a, b) => Number(b.enabled) - Number(a.enabled) || (a.next_run || '').localeCompare(b.next_run || '') || a.name.localeCompare(b.name))
      },
      upcoming () { return this.sortedSchedules.find(s => s.enabled && s.next_run) },
      countdown () {
        if (!this.active) return ''
        const seconds = Math.max(0, Math.ceil((Date.parse(this.active.restart_at) - this.now) / 1000))
        return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
      }
    },
    watch: {
      draft: { deep: true, handler () { this.queuePreview() } },
      onceDate () { this.queuePreview() },
      preset () { this.queuePreview() }
    },
    created () {
      this.load()
      this.clockTimer = setInterval(() => { this.now = Date.now() }, 1000)
    },
    beforeDestroy () {
      this.disposed = true
      clearTimeout(this.pollTimer)
      clearTimeout(this.previewTimer)
      clearInterval(this.clockTimer)
      this.previewVersion++
    },
    methods: {
      async load () {
        if (this.disposed) return
        clearTimeout(this.pollTimer)
        const version = ++this.loadVersion
        try {
          const { data } = await SpireApi.v1().get(endpoint, { timeout: requestTimeout })
          if (this.disposed || version !== this.loadVersion) return
          this.schedules = data.schedules || []
          this.history = data.history || []
          this.active = data.active || null
          this.loadError = ''
        } catch (e) { if (!this.disposed && version === this.loadVersion) this.loadError = this.message(e) } finally {
          if (!this.disposed && version === this.loadVersion) {
            this.loading = false
            this.pollTimer = setTimeout(this.load, document.hidden ? 60000 : (this.active ? 2000 : 15000))
          }
        }
      },
      message (e) {
        if (e.code === 'ECONNABORTED') return 'Request timed out. Try again.'
        if (e.message === 'Network Error') return 'Unable to reach Spire. Try again.'
        return (e.response && e.response.data && e.response.data.error) || e.message || 'Unable to update restart schedules'
      },
      date (value, zone) {
        if (!value) return '—'
        try { return new Intl.DateTimeFormat(undefined, { timeZone: zone, weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) } catch (_) { return '—' }
      },
      time (value, zone) { return new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(new Date(value)) },
      recurrence (s) {
        if (s.once_at) return 'Once'
        if (s.days.length === 7) return 'Every day'
        if (s.days.join(',') === '1,2,3,4,5') return 'Weekdays'
        return s.days.map(d => this.days[d].slice(0, 3)).join(', ')
      },
      warning (minutes) { return minutes ? `${minutes} min warning` : 'No warning' },
      statusLabel (status) { return ({ countdown: 'Countdown', restarting: 'Restarting', succeeded: 'Restarted', skipped: 'Skipped', cancelled: 'Cancelled', failed: 'Failed', interrupted: 'Interrupted' })[status] || status },
      isActive (s) { return this.active && this.active.schedule_id === s.id },
      newSchedule () {
        if (this.busy) return
        this.error = ''
        this.onceDate = ''
        this.preset = 'daily'
        this.draft = { id: '', name: 'Daily restart', enabled: true, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', time: '04:00', days: [...allDays], warning_minutes: 10, revision: 0 }
        this.$nextTick(() => { this.$refs.nameInput.focus(); this.$refs.nameInput.select() })
      },
      edit (s) {
        this.onceDate = ''
        this.preset = s.once_at ? 'once' : (s.days.length === 7 ? 'daily' : (s.days.join(',') === '1,2,3,4,5' ? 'weekdays' : 'weekly'))
        this.draft = clone(s)
        if (s.once_at) {
          const parts = new Intl.DateTimeFormat('en-CA', { timeZone: s.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(s.once_at))
          const part = type => parts.find(p => p.type === type).value
          this.onceDate = `${part('year')}-${part('month')}-${part('day')}`
          this.draft.time = this.time(s.once_at, s.timezone)
        }
        this.$nextTick(() => this.$refs.nameInput.focus())
      },
      closeEditor () { this.draft = null; this.onceDate = ''; this.preview = []; this.previewError = ''; this.previewVersion++ },
      setPreset (value) {
        if (value === this.preset) return
        const usedDefaultName = this.draft.name === defaultNames[this.preset]
        this.onceDate = ''
        this.preset = value
        this.draft.once_at = null
        this.draft.days = value === 'daily' ? [...allDays] : value === 'weekdays' ? [1, 2, 3, 4, 5] : value === 'weekly' ? [0] : []
        if (!this.draft.id && usedDefaultName) this.draft.name = defaultNames[value]
      },
      toggleDay (day) {
        this.draft.days = this.draft.days.includes(day) ? this.draft.days.filter(d => d !== day) : [...this.draft.days, day].sort()
      },
      // Resolve a one-time wall clock in the chosen zone. Verify it after
      // conversion so daylight-saving gaps cannot silently move the restart.
      payload () {
        const payload = clone(this.draft)
        payload.once_at = null
        if (this.preset === 'once') {
          if (!this.onceDate || !payload.time) throw new Error('Choose a date and time')
          const wall = `${this.onceDate}T${payload.time}:00`
          const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: payload.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
          const format = instant => {
            const parts = formatter.formatToParts(instant)
            const p = type => parts.find(part => part.type === type).value
            return `${p('year')}-${p('month')}-${p('day')}T${p('hour')}:${p('minute')}:00`
          }
          const target = Date.parse(wall + 'Z')
          let instant = target
          for (let i = 0; i < 3; i++) instant += target - Date.parse(format(new Date(instant)) + 'Z')
          if (format(new Date(instant)) !== wall) throw new Error('This time does not exist in the selected time zone')
          payload.once_at = new Date(instant).toISOString()
          payload.days = []
          payload.time = ''
        }
        return payload
      },
      queuePreview () {
        clearTimeout(this.previewTimer)
        const version = ++this.previewVersion
        if (!this.draft) return
        this.previewLoading = true
        this.previewTimer = setTimeout(async () => {
          try {
            const { data } = await SpireApi.v1().post(`${endpoint}/preview`, this.payload(), { timeout: requestTimeout })
            if (version !== this.previewVersion || this.disposed) return
            this.preview = data.next_runs
            this.previewError = ''
          } catch (e) { if (version === this.previewVersion && !this.disposed) { this.preview = []; this.previewError = this.message(e) } } finally { if (version === this.previewVersion && !this.disposed) this.previewLoading = false }
        }, 250)
      },
      async mutate (action, notice) {
        if (this.busy) return false
        this.busy = true; this.error = ''; this.notice = ''
        try { await action(); this.notice = notice; await this.load(); return true } catch (e) { this.error = this.message(e); return false } finally { this.busy = false }
      },
      async save () {
        if (await this.mutate(() => SpireApi.v1().post(endpoint, this.payload(), { timeout: requestTimeout }), 'Restart schedule saved')) this.closeEditor()
      },
      async toggle (s) { await this.mutate(() => SpireApi.v1().post(endpoint, { ...s, enabled: !s.enabled }, { timeout: requestTimeout }), s.enabled ? 'Schedule paused' : 'Schedule enabled') },
      async remove (s) {
        if (await this.mutate(() => SpireApi.v1().delete(`${endpoint}/${s.id}`, { params: { revision: s.revision }, timeout: requestTimeout }), 'Schedule deleted')) {
          this.deleting = null
          if (this.draft && this.draft.id === s.id) this.closeEditor()
        }
      },
      async cancelRestart () { await this.mutate(() => SpireApi.v1().post(`${endpoint}/runs/${this.active.id}/cancel`, null, { timeout: requestTimeout }), 'Restart cancellation requested') }
    }
  }
</script>

<style scoped>
.restart-workspace { --restart-accent: #d5b473; color: #e5e8ed; padding-bottom: 30px; }
.restart-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0; padding: 20px 24px; border-bottom: 1px solid #ffffff18; }
.restart-heading h1 { font-size: 25px; font-weight: 600; letter-spacing: -.5px; margin: 0; }
.restart-heading .btn { white-space: nowrap; }
.restart-columns { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: start; }
.restart-columns-editing { grid-template-columns: minmax(0, 1fr) 370px; }
.restart-list-window, .restart-editor-window { min-width: 0; margin-top: 0; padding: 0; }
.restart-active { padding: 0; }
.restart-list-window::before, .restart-editor-window::before, .restart-active::before { inset: 0; width: 100%; height: 100%; padding: 0; box-sizing: border-box; border-radius: inherit; }
.restart-next { display: flex; align-items: center; gap: 15px; padding: 24px; border-bottom: 1px solid #ffffff18; }
.restart-next > i { color: var(--restart-accent); font-size: 26px; }
.restart-next > div { display: grid; gap: 5px; }
.restart-next strong { font-size: 19px; font-weight: 500; color: #f4e6c9; }
.restart-next span { color: #adb7c6; font-size: 12px; }
.restart-next .restart-zone { margin-left: auto; text-align: right; }
.restart-row { padding: 25px 24px 19px; border-bottom: 1px solid #ffffff12; transition: background-color .18s ease, opacity .18s ease; }
.restart-row:hover { background: #ffffff04; }
.restart-row-selected { background: #d5b4730a; box-shadow: inset 3px 0 var(--restart-accent); }
.restart-row-main { display: flex; align-items: center; gap: 23px; }
.restart-time { font-family: Georgia, 'Times New Roman', serif; font-size: 38px; line-height: 1; color: var(--restart-accent); font-variant-numeric: tabular-nums; letter-spacing: -1.5px; min-width: 94px; }
.restart-row-description { min-width: 0; }
.restart-row-description h2 { font-size: 16px; font-weight: 600; margin: 0 0 7px; overflow-wrap: anywhere; }
.restart-recurrence { color: #aeb8c8; font-size: 12px; overflow-wrap: anywhere; }
/* Keep EQ window button padding from displacing the switch thumb. */
.restart-workspace .restart-row button.restart-switch { display: inline-flex; align-items: center; flex-shrink: 0; margin-left: auto; box-sizing: border-box; width: 36px; height: 21px; padding: 3px; border: 1px solid #ffffff38; border-radius: 20px; background: #101a28; transition: background-color .2s; }
.restart-switch > span { display: block; flex: 0 0 13px; width: 13px; height: 13px; border-radius: 50%; background: #9aa6b6; transition: transform .2s, background-color .2s; }
.restart-workspace .restart-row button.restart-switch[aria-checked="true"] { background: #d5b47333; border-color: #d5b47399; }
.restart-switch[aria-checked="true"] > span { transform: translateX(15px); background: var(--restart-accent); }
.restart-row-paused .restart-time { color: #8792a3; }
.restart-row-bottom { display: flex; align-items: center; gap: 22px; margin-top: 16px; font-size: 12px; color: #9da9ba; }
.restart-row-actions { display: flex; align-items: center; gap: 20px; margin-left: auto; }
.restart-workspace .restart-text-button, .restart-workspace .restart-icon-button { background: none; border: 0; padding: 3px 0; color: #c8d2df; font-size: 13px; }
.restart-text-button:hover, .restart-icon-button:hover { color: #f4e6c9; }
.restart-workspace .restart-icon-button { padding: 4px; line-height: 1; }
.restart-delete { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ffffff18; }
.restart-delete strong { margin-right: auto; font-size: 13px; max-width: 100%; overflow-wrap: anywhere; }
.restart-history { padding: 25px 24px; }
.restart-history > h2 { font-size: 14px; font-weight: 600; margin-bottom: 18px; }
.restart-history-empty { font-size: 13px; color: #929fb2; padding: 8px 0; }
.restart-history ol, .restart-preview ol { list-style: none; margin: 0; padding: 0; }
.restart-history-row { display: flex; align-items: center; gap: 12px; padding: 13px 0; border-top: 1px solid #ffffff0c; font-size: 12px; }
.restart-history-row > i { color: #8999ad; font-size: 16px; }
.restart-history-row > div { display: grid; gap: 4px; min-width: 0; }
.restart-history-row strong { font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
.restart-history-row > div span { color: #9da9ba; overflow-wrap: anywhere; }
.restart-run-status { margin-left: auto; }
.restart-history-row time { color: #9da9ba; white-space: nowrap; }
.restart-history .restart-status-succeeded { color: #8dc8a0; }
.restart-status-failed, .restart-status-interrupted { color: #eaa19b; }
.restart-empty { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 20px; min-height: 240px; padding: 32px; }
.restart-empty h2 { font-size: 18px; margin: 0; font-weight: 500; }
.restart-empty-icon { font-size: 34px; color: var(--restart-accent); }
.restart-active { margin-bottom: 20px; border-color: #d5b47388; }
.restart-active-content { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.restart-active-content > div { min-width: 0; overflow-wrap: anywhere; }
.restart-active-content strong { color: #f4e6c9; font-size: 18px; font-variant-numeric: tabular-nums; }
.restart-active-name { margin-left: 18px; color: #b9c2ce; }
.restart-live-dot { display: inline-block; width: 7px; height: 7px; margin: 0 10px 2px 0; border-radius: 50%; background: var(--restart-accent); }
.restart-editor-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.restart-editor-heading h2 { font-size: 18px; margin: 0; }
.restart-editor-window label, .restart-editor-window legend { font-size: 12px; font-weight: 600; color: #bdc7d5; margin: 20px 0 8px; }
.restart-editor-window legend { float: none; width: auto; }
.restart-editor-window label[for="restart-name"] { margin-top: 0; }
.restart-editor-window .form-control { background-color: #10192388; border-color: #ffffff26; color: #e7ecf3; height: 41px; font-size: 14px; }
.restart-editor-window select option { background: #172333; color: #e7ecf3; }
.restart-editor-window .form-control:focus { border-color: var(--restart-accent); box-shadow: 0 0 0 2px #d5b47318; }
.restart-editor-window input[type="time"], .restart-editor-window input[type="date"] { color-scheme: dark; }
.restart-time-fields { display: flex; gap: 12px; }
.restart-time-fields > div { min-width: 0; flex: 1; }
.restart-time-input { font-variant-numeric: tabular-nums; }
.restart-repeat, .restart-days { margin: 0; padding: 0; border: 0; }
.restart-presets { display: flex; padding: 3px; background: #00000030; border-radius: 5px; }
.restart-workspace .restart-presets button { flex: 1; font-size: 12px; background: transparent; border: 0; border-radius: 3px; color: #adb9ca; padding: 9px 4px; transition: color .18s, background-color .18s; }
.restart-workspace .restart-presets button[aria-pressed="true"] { background: #d5b47320; color: #f3dfb8; box-shadow: 0 0 0 1px #d5b47344; }
.restart-workspace .restart-days button { width: calc((100% - 30px) / 7); margin-right: 5px; background: transparent; border: 1px solid #ffffff26; border-radius: 3px; padding: 8px 0; color: #b9c5d4; font-size: 12px; }
.restart-days button:last-child { margin-right: 0; }
.restart-workspace .restart-days button[aria-pressed="true"] { color: #f3dfb8; border-color: #d5b47388; background: #d5b47318; }
.restart-preview { border-top: 1px solid #ffffff18; margin-top: 25px; padding-top: 20px; min-height: 100px; }
.restart-preview h3 { font-size: 12px; color: #adb9ca; margin: 0 0 12px; }
.restart-preview li { font-size: 13px; padding: 4px 0; color: #dcccac; }
.restart-preview > span { font-size: 12px; color: #adb9ca; }
.restart-preview .restart-preview-error { color: #eaa19b; }
.restart-editor-footer { display: flex; align-items: center; gap: 20px; margin-top: 22px; }
.restart-error { display: flex; justify-content: space-between; align-items: center; gap: 16px; background: #aa443322; border: 1px solid #aa665577; border-radius: 4px; padding: 12px 16px; margin-bottom: 18px; }
button:disabled { opacity: .45; cursor: default; }
button:focus-visible { outline: 2px solid var(--restart-accent); outline-offset: 3px; }
.restart-editor-enter-active, .restart-editor-leave-active { transition: opacity .18s, transform .18s; }
.restart-editor-enter, .restart-editor-leave-to { opacity: 0; transform: translateY(8px); }
.schedule-row-enter-active, .schedule-row-leave-active { transition: opacity .18s; }
.schedule-row-enter, .schedule-row-leave-to { opacity: 0; }
@media (max-width: 1200px) {
  .restart-columns-editing { grid-template-columns: minmax(0, 1fr) 330px; gap: 18px; }
  .restart-row-main { gap: 15px; }
  .restart-row-bottom { flex-wrap: wrap; gap: 10px 16px; }
  .restart-next { flex-wrap: wrap; }
  .restart-next .restart-zone { margin-left: 41px; text-align: left; }
  .restart-history-row { flex-wrap: wrap; }
  .restart-history-row time { margin-left: 28px; }
}
@media (max-width: 900px) {
  .restart-columns-editing { grid-template-columns: minmax(0, 1fr); }
  .restart-editor-window { grid-row: 1; }
  .restart-heading h1 { font-size: 21px; }
  .restart-active-content { flex-wrap: wrap; }
}
@media (max-width: 480px) {
  .restart-heading { flex-wrap: wrap; padding: 20px 16px; }
  .restart-row, .restart-next, .restart-history { padding: 20px 16px; }
  .restart-row-main { flex-wrap: wrap; gap: 12px; }
  .restart-time { font-size: 32px; min-width: 80px; }
  .restart-row-description { flex: 1; }
  .restart-active-name { display: block; margin: 8px 0 0 18px; }
  .restart-next strong { font-size: 17px; }
}
@media (prefers-reduced-motion: reduce) {
  .restart-workspace *, .restart-workspace *::before, .restart-workspace *::after { transition: none !important; }
}
</style>
