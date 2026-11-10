<template>
  <b-modal ref="modal" visible centered scrollable modal-class="support-modal" :hide-header-close="busy"
           :no-close-on-backdrop="busy" :no-close-on-esc="busy" @shown="focusFirst" @hidden="$emit('close')">
    <template #modal-title>Assign case <span class="support-modal-subject">· #{{ record.key.split('-')[0] }}</span></template>
    <p class="support-modal-lead">
      <template v-if="record.mine">Assigned to <strong>you</strong>.</template>
      <template v-else-if="record.owner">Assigned to <strong>{{ record.owner }}</strong>.</template>
      <template v-else>Not assigned yet.</template>
    </p>

    <label v-if="others.length > 6" class="support-search assign-filter">
      <i class="fe fe-search" aria-hidden="true"></i>
      <input ref="filter" v-model="query" type="search" maxlength="64" placeholder="Find a staff member" aria-label="Find a staff member" @keydown.enter.prevent="pickFirst">
    </label>

    <div class="assign-options" role="group" aria-label="Assign to">
      <button v-if="!record.mine && !query.trim()" type="button" class="support-option" :aria-pressed="String(choice === 'self')" :disabled="busy" @click="choice = 'self'">
        <span class="assign-row">
          <span class="support-avatar is-xs is-accent" aria-hidden="true"><i class="fe fe-user-check"></i></span>
          <span class="assign-name">Take it myself</span>
        </span>
      </button>
      <button v-for="member in shown" :key="member.id" type="button" class="support-option" :aria-pressed="String(choice === member.id)" :disabled="busy"
              @click="choice = member.id">
        <span class="assign-row">
          <span class="support-avatar is-xs" :style="avatar(member.name)" aria-hidden="true">{{ initial(member.name) }}</span>
          <span class="assign-name" :title="member.name">{{ member.name }}</span>
          <span v-if="isOwner(member)" class="support-chip">Current</span>
        </span>
      </button>
      <support-load-state v-if="loading || loadError" :error="loadError" label="Loading staff" shape="lines" :rows="3" @retry="loadStaff" />
      <p v-else-if="query.trim() && !shown.length" class="support-empty is-compact assign-placeholder"><i class="fe fe-search" aria-hidden="true"></i> Nobody matches “{{ query.trim() }}”.</p>
      <button v-if="!query.trim()" type="button" class="support-option" :aria-pressed="String(choice === 'nobody')" :disabled="busy" @click="choice = 'nobody'">
        <span class="assign-row">
          <span class="support-avatar is-xs" aria-hidden="true"><i class="fe fe-user-x"></i></span>
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
    <support-reason v-if="escalate && !record.escalated" id="assign-reason" ref="reason" v-model="reason" class="assign-reason" :min="1" :max="500" :bytes="false"
                    :disabled="busy" placeholder="What needs a senior Game Master?" @input="error = ''" @submit="save" />

    <p v-if="error" class="support-callout is-danger assign-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>

    <template #modal-footer="{ cancel }">
      <span v-if="!busy && !hasChange" class="support-footer-note">{{ choiceHint }}</span>
      <button type="button" class="support-button" :disabled="busy" @click="cancel()">Cancel</button>
      <button type="button" class="support-button is-primary" :disabled="busy || !hasChange" @click="save">
        <i v-if="busy" class="fe fe-loader support-spin" aria-hidden="true"></i> {{ busy ? 'Saving…' : 'Save' }}
      </button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { assignableStaff, avatarStyle, focusLater, initials, touchLayout } from './support-ui'
import SupportLoadState from './SupportLoadState.vue'
import SupportReason from './SupportReason.vue'

export default {
  name: 'SupportAssign',
  components: { SupportLoadState, SupportReason },
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    // The signed-in user ({ id, user_name }), left out of the staff list
    // because "Take it myself" covers them.
    me: { type: Object, default: null }
  },
  data () {
    return {
      staff: [], loading: true, loadError: '', query: '', choice: null, escalate: Boolean(this.record.escalated), reason: '', busy: false, error: ''
    }
  },
  computed: {
    others () {
      const id = this.me && this.me.id
      return this.staff.filter(member => !id || member.id !== id)
    },
    // A long staff list gets a filter; it matches anywhere in the name.
    shown () {
      const query = this.query.trim().toLowerCase()
      return query ? this.others.filter(member => member.name.toLowerCase().includes(query)) : this.others
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
    hasChange () { return Boolean(this.ownerStep || this.escalationStep) },
    choiceHint () { return 'Choose who takes the case, or escalate it.' }
  },
  watch: {
    escalate (on) {
      if (on && !this.record.escalated) focusLater(() => this.$refs.reason)
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
    focusFirst () {
      focusLater(() => {
        if (this.$refs.filter && !touchLayout()) return this.$refs.filter
        const content = this.$refs.modal && this.$refs.modal.$refs.content
        return content && (content.querySelector('.assign-options [aria-pressed="true"]') || content.querySelector('.assign-options .support-option'))
      })
    },
    // Enter in the filter picks the first match.
    pickFirst () { if (this.shown.length) this.choice = this.shown[0].id },
    errorText (error) { return (error.response && error.response.data && error.response.data.error) || 'The case could not be updated.' },
    async loadStaff () {
      this.loading = true
      this.loadError = ''
      try {
        const { data } = await SpireApi.v1().get('player-support/staff', this.params())
        this.staff = assignableStaff(data && data.staff)
      } catch (error) {
        this.loadError = this.errorText(error)
      } finally {
        this.loading = false
      }
    },
    // Each change is its own case action, so the second one needs the
    // revision the first one produced.
    async save () {
      if (this.busy || !this.hasChange) return
      if (this.escalationStep && this.escalationStep.action === 'escalate' && !this.$refs.reason.check()) return
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
.assign-filter { margin-top: var(--support-space-3); }
.assign-options { display: grid; gap: var(--support-space-1); max-height: 296px; margin-top: var(--support-space-3); overflow-y: auto; }
.assign-options .support-option { padding: 6px 10px; }
.assign-row { display: flex; align-items: center; gap: 10px; min-width: 0; min-height: 20px; }
.assign-row .support-avatar > i { font-size: 10px; }
.assign-name { flex: 1; min-width: 0; overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.assign-placeholder { margin: 0; }
.assign-escalate { margin-top: var(--support-space-4); }
.assign-reason { margin-top: var(--support-space-3); }
.assign-error { margin: var(--support-space-3) 0 0; }
</style>
