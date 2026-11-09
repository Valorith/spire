<template>
  <b-modal visible centered modal-class="support-modal" :title="title" @shown="focusField" @hidden="$emit('close')">
    <template v-if="mode === 'assign'">
      <label for="support-batch-assignee" class="batch-first-label">Assign to</label>
      <select id="support-batch-assignee" ref="field" v-model.number="assignee" class="support-field" :disabled="!loaded">
        <option :value="0">Nobody</option>
        <option v-for="member in staff" :key="member.id" :value="member.id">{{ member.name }}{{ me && member.id === me.id ? ' (you)' : '' }}</option>
      </select>
      <p v-if="loading" class="support-feedback" role="status"><i class="fe fe-loader support-spin" aria-hidden="true"></i> Loading staff…</p>
      <p v-else-if="loadError" class="support-feedback is-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ loadError }}
        <button type="button" class="support-link" @click="loadStaff">Try again</button>
      </p>
      <p v-else-if="loaded && !staff.length" class="support-feedback">No staff to choose from. Nobody unassigns the cases; Claim takes them yourself.</p>
    </template>

    <template v-else-if="mode === 'category'">
      <label for="support-batch-category" class="batch-first-label">Category</label>
      <select id="support-batch-category" ref="field" v-model="category" class="support-field">
        <option value="">None</option>
        <option v-for="option in categories" :key="option.id" :value="option.id">{{ option.label }}</option>
      </select>
    </template>

    <template v-else>
      <label for="support-batch-summary" class="batch-first-label">Resolution summary <span>(optional)</span></label>
      <textarea id="support-batch-summary" ref="field" v-model="text" class="support-field" rows="3" maxlength="8000"
                placeholder="Added to each case timeline."></textarea>
      <div class="support-settings batch-close">
        <label for="support-batch-close" class="support-setting">
          <span class="support-setting-text">
            <strong id="support-batch-close-title">Also clear petitions in game</strong>
            <small id="support-batch-close-hint">A case whose petition is checked out in game is not resolved while this is on.</small>
          </span>
          <input id="support-batch-close" v-model="closeInGame" type="checkbox" class="support-switch"
                 aria-labelledby="support-batch-close-title" aria-describedby="support-batch-close-hint">
        </label>
      </div>
    </template>

    <template #modal-footer="{ cancel }">
      <button type="button" class="support-button" @click="cancel()">Cancel</button>
      <button type="button" class="support-button is-primary" :disabled="!ready" @click="submit">{{ action }}</button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { assignableStaff, supportCategories } from './support-ui'

// The small dialogs behind "Assign…", "Category…" and "Resolve…": one value
// for every selected case (count), or for the open case (count 0, category only).
export default {
  name: 'SupportBatch',
  props: {
    mode: { type: String, required: true },
    count: { type: Number, default: 0 },
    connectionId: { type: Number, required: true },
    me: { type: Object, default: null },
    // The open case's current category, for the single-case category change.
    value: { type: String, default: '' }
  },
  data () {
    return {
      categories: supportCategories,
      staff: [],
      loading: false,
      // Set only once the staff list has loaded, so a failed load can never
      // leave Assign enabled with the default "Nobody" selected.
      loaded: false,
      loadError: '',
      assignee: 0,
      category: this.value,
      text: '',
      closeInGame: true
    }
  },
  computed: {
    cases () { return this.count === 1 ? '1 case' : `${this.count} cases` },
    title () {
      if (this.mode === 'assign') return `Assign ${this.cases}`
      if (this.mode === 'category') return this.count ? `Set the category of ${this.cases}` : 'Change category'
      return `Resolve ${this.cases}`
    },
    action () {
      if (this.mode === 'assign') return 'Assign'
      if (this.mode === 'category') return this.count ? 'Set category' : 'Save'
      return `Resolve ${this.cases}`
    },
    ready () {
      if (this.mode === 'assign') return this.loaded && !this.loading
      if (this.mode === 'category') return this.count > 0 || this.category !== this.value
      return true
    }
  },
  created () {
    if (this.mode === 'assign') this.loadStaff()
  },
  methods: {
    focusField () { if (this.$refs.field) this.$refs.field.focus() },
    async loadStaff () {
      this.loading = true
      this.loadError = ''
      try {
        const { data } = await SpireApi.v1().get('player-support/staff', { params: { connection_id: this.connectionId } })
        this.staff = assignableStaff(data && data.staff)
        this.loaded = true
      } catch (error) {
        this.loadError = (error.response && error.response.data && error.response.data.error) || 'Staff could not be loaded.'
      } finally {
        this.loading = false
      }
    },
    submit () {
      if (!this.ready) return
      if (this.mode === 'assign') this.$emit('submit', { assignee_id: this.assignee })
      else if (this.mode === 'category') this.$emit('submit', { category: this.category })
      else this.$emit('submit', { text: this.text.trim(), close_in_game: this.closeInGame })
    }
  }
}
</script>

<style scoped>
/* Dialog chrome, fields and settings rows come from support-theme.css. */
.support-modal label.batch-first-label { margin-top: 0; }
.batch-close { margin-top: var(--support-space-4); }
</style>
