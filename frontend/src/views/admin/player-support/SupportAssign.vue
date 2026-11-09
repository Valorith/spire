<template>
  <b-modal visible centered scrollable modal-class="support-modal" title="Assign case" :hide-header-close="busy"
           :no-close-on-backdrop="busy" :no-close-on-esc="busy" @hidden="$emit('close')">
    <p class="support-modal-lead">
      Case #{{ record.key.split('-')[0] }} is
      <template v-if="record.mine">assigned to <strong>you</strong>.</template>
      <template v-else-if="record.owner">assigned to <strong>{{ record.owner }}</strong>.</template>
      <template v-else>not assigned.</template>
    </p>

    <div class="assign-options" role="group" aria-label="Assign to">
      <button v-if="!record.mine" type="button" class="support-option" :aria-pressed="String(choice === 'self')" :disabled="busy" @click="choice = 'self'">
        <span class="assign-row">
          <span class="support-avatar is-sm is-accent" aria-hidden="true"><i class="fe fe-user-check"></i></span>
          <span class="assign-name">Take it myself</span>
        </span>
      </button>
      <button v-for="member in others" :key="member.id" type="button" class="support-option" :aria-pressed="String(choice === member.id)" :disabled="busy"
              @click="choice = member.id">
        <span class="assign-row">
          <span class="support-avatar is-sm" :style="avatar(member.name)" aria-hidden="true">{{ initial(member.name) }}</span>
          <span class="assign-name">{{ member.name }}</span>
          <span v-if="isOwner(member)" class="support-chip">Current</span>
        </span>
      </button>
      <p v-if="loading" class="support-empty is-compact assign-placeholder" role="status"><i class="fe fe-loader support-spin" aria-hidden="true"></i> Loading staff…</p>
      <p v-else-if="loadError" class="support-feedback is-error assign-placeholder" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ loadError }}</p>
      <button type="button" class="support-option" :aria-pressed="String(choice === 'nobody')" :disabled="busy" @click="choice = 'nobody'">
        <span class="assign-row">
          <span class="support-avatar is-sm" aria-hidden="true"><i class="fe fe-user-x"></i></span>
          <span class="assign-name">Nobody</span>
          <span v-if="!record.owner" class="support-chip">Current</span>
        </span>
      </button>
    </div>

    <div class="support-settings assign-escalate">
      <label for="assign-escalate" class="support-setting">
        <span class="support-setting-text">
          <strong id="assign-escalate-title">Escalate to senior staff</strong>
          <small id="assign-escalate-hint">Escalated cases sort first in the queue.</small>
        </span>
        <input id="assign-escalate" v-model="escalate" type="checkbox" class="support-switch" aria-labelledby="assign-escalate-title"
               aria-describedby="assign-escalate-hint" :disabled="busy">
      </label>
    </div>
    <template v-if="escalate && !record.escalated">
      <label for="assign-reason">Reason <span>(required, recorded on the case)</span></label>
      <textarea id="assign-reason" ref="reason" v-model="reason" class="support-field" rows="2" maxlength="500" :disabled="busy"
                placeholder="What needs a senior Game Master?"></textarea>
    </template>

    <p v-if="error" class="support-callout is-danger assign-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>

    <template #modal-footer="{ cancel }">
      <button type="button" class="support-button" :disabled="busy" @click="cancel()">Cancel</button>
      <button type="button" class="support-button is-primary" :disabled="!ready" @click="save">{{ busy ? 'Saving…' : 'Save' }}</button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { avatarStyle, initials } from './support-ui'

export default {
  name: 'SupportAssign',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    // The signed-in user ({ id, user_name }), left out of the staff list
    // because "Take it myself" covers them.
    me: { type: Object, default: null }
  },
  data () {
    return {
      staff: [], loading: true, loadError: '', choice: null, escalate: Boolean(this.record.escalated), reason: '', busy: false, error: ''
    }
  },
  computed: {
    others () {
      const id = this.me && this.me.id
      return this.staff.filter(member => !id || member.id !== id)
    },
    // The owner change this dialog would make, or null for none.
    ownerStep () {
      const record = this.record
      if (this.choice === 'self') return record.mine ? null : { action: 'take' }
      if (this.choice === 'nobody') return record.owner ? { action: 'assign', assignee_id: 0 } : null
      const member = this.staff.find(item => item.id === this.choice)
      if (!member || this.isOwner(member)) return null
      return { action: 'assign', assignee_id: member.id }
    },
    escalationStep () {
      if (this.escalate === Boolean(this.record.escalated)) return null
      return this.escalate ? { action: 'escalate', text: this.reason.trim() } : { action: 'deescalate', text: '' }
    },
    ready () {
      if (this.busy || (!this.ownerStep && !this.escalationStep)) return false
      return !(this.escalationStep && this.escalationStep.action === 'escalate' && !this.reason.trim())
    }
  },
  watch: {
    escalate (on) {
      if (on && !this.record.escalated) this.$nextTick(() => this.$refs.reason && this.$refs.reason.focus())
    }
  },
  created () {
    this.loadStaff()
  },
  methods: {
    avatar (name) { return avatarStyle(name) },
    initial (name) { return initials(name) },
    isOwner (member) {
      return Boolean(this.record.owner) && !this.record.mine && member.name.toLowerCase() === this.record.owner.toLowerCase()
    },
    params () { return { params: { connection_id: this.connectionId } } },
    errorText (error) { return (error.response && error.response.data && error.response.data.error) || 'The case could not be updated.' },
    async loadStaff () {
      this.loading = true
      this.loadError = ''
      try {
        const { data } = await SpireApi.v1().get('player-support/staff', this.params())
        this.staff = (data && data.staff) || []
      } catch (error) {
        this.loadError = this.errorText(error)
      } finally {
        this.loading = false
      }
    },
    // Each change is its own case action, so the second one needs the
    // revision the first one produced.
    async save () {
      if (!this.ready) return
      const steps = [this.ownerStep, this.escalationStep].filter(Boolean)
      const key = encodeURIComponent(this.record.key)
      this.busy = true
      this.error = ''
      let done = 0
      try {
        let revision = this.record.revision
        for (const step of steps) {
          if (done) {
            const { data } = await SpireApi.v1().get('player-support/cases/' + key, this.params())
            revision = data.case.revision
          }
          await SpireApi.v1().patch('player-support/cases/' + key, { ...step, revision }, this.params())
          done++
        }
        this.$emit('saved', this.summary(steps))
      } catch (error) {
        this.error = this.errorText(error)
        if (done) this.$emit('changed')
      } finally {
        this.busy = false
      }
    },
    summary (steps) {
      return steps.map(step => {
        if (step.action === 'take') return 'You took the case'
        if (step.action === 'escalate') return 'Case escalated'
        if (step.action === 'deescalate') return 'Escalation cleared'
        const member = this.staff.find(item => item.id === step.assignee_id)
        return member ? `Assigned to ${member.name}` : 'Case unassigned'
      }).join(' · ')
    }
  }
}
</script>

<style scoped>
/* Dialog chrome, options, settings rows and fields come from support-theme.css. */
.assign-options { display: grid; gap: 6px; max-height: 300px; margin-top: var(--support-space-3); overflow-y: auto; }
.assign-row { display: flex; align-items: center; gap: 10px; min-width: 0; }
.assign-row .support-avatar > i { font-size: 13px; }
.assign-name { flex: 1; min-width: 0; overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.assign-placeholder { margin: 0; }
.assign-escalate { margin-top: var(--support-space-4); }
.assign-error { margin: var(--support-space-3) 0 0; }
</style>
