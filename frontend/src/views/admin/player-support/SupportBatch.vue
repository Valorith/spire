<template>
  <b-modal visible centered scrollable modal-class="support-modal" :title="title" @shown="focusField" @hidden="$emit('close')">
    <!-- The same pickers as the single-case Assign dialog: a filter for a long
         staff list, one row per choice, the choice marked. -->
    <template v-if="mode === 'assign'">
      <label v-if="staff.length > 6" class="support-search batch-filter">
        <i class="fe fe-search" aria-hidden="true"></i>
        <input ref="filter" v-model="query" type="search" maxlength="64" placeholder="Find a staff member" aria-label="Find a staff member" @keydown.enter.prevent="pickFirst">
      </label>
      <div class="batch-options" role="group" aria-label="Assign to">
        <support-load-state v-if="loading || loadError" :error="loadError" label="Loading staff" shape="lines" :rows="3" @retry="loadStaff" />
        <template v-else>
          <button v-for="member in shown" :key="member.id" type="button" class="support-option" :aria-pressed="String(assignee === member.id)" @click="assignee = member.id">
            <span class="batch-row">
              <span class="support-avatar is-xs" :style="avatar(member.name)" aria-hidden="true">{{ initial(member.name) }}</span>
              <span class="batch-name" :title="member.name">{{ member.name }}</span>
              <span v-if="me && member.id === me.id" class="support-chip">You</span>
            </span>
          </button>
          <p v-if="query.trim() && !shown.length" class="support-empty is-compact batch-placeholder"><i class="fe fe-search" aria-hidden="true"></i> Nobody matches “{{ query.trim() }}”.</p>
          <button v-if="!query.trim()" type="button" class="support-option" :aria-pressed="String(assignee === 0)" @click="assignee = 0">
            <span class="batch-row">
              <span class="support-avatar is-xs" aria-hidden="true"><i class="fe fe-user-x"></i></span>
              <span class="batch-name">Nobody</span>
            </span>
          </button>
        </template>
      </div>
      <p v-if="loaded && !staff.length" class="support-modal-hint">No staff to choose from. Nobody unassigns the cases; Claim takes them yourself.</p>
    </template>

    <template v-else-if="mode === 'category'">
      <div class="batch-options is-categories" role="group" aria-label="Category">
        <button v-for="option in categoryOptions" :key="option.id" type="button" class="support-option" :aria-pressed="String(category === option.id)" @click="category = option.id">
          <span class="batch-row">
            <i :class="option.id ? 'fe fe-tag' : 'fe fe-slash'" aria-hidden="true"></i>
            <span class="batch-name">{{ option.label }}</span>
            <span v-if="!count && option.id === value" class="support-chip">Current</span>
          </span>
        </button>
      </div>
    </template>

    <template v-else>
      <support-reason id="support-batch-summary" ref="field" v-model="text" label="Resolution summary" hint="(optional)" :min="0" :max="8000" :bytes="false" :rows="3"
                      placeholder="What was done? It is shown on each case’s timeline." @submit="submit" />
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
      <span v-if="mode === 'assign' && loaded && assignee === null" class="support-footer-note">Choose who takes the {{ count === 1 ? 'case' : 'cases' }}.</span>
      <span v-else-if="mode === 'category' && category === null" class="support-footer-note">Choose a category.</span>
      <button type="button" class="support-button" @click="cancel()">Cancel</button>
      <button type="button" class="support-button is-primary" :disabled="!ready" @click="submit">{{ action }}</button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { assignableStaff, avatarStyle, focusLater, initials, supportCategories, touchLayout } from './support-ui'
import SupportLoadState from './SupportLoadState.vue'
import SupportReason from './SupportReason.vue'

// The small dialogs behind "Assign…", "Category…" and "Resolve…": one value
// for every selected case (count), or for the open case (count 0, category only).
export default {
  name: 'SupportBatch',
  components: { SupportLoadState, SupportReason },
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
      // Nobody chosen yet: Assign stays off until a row is picked.
      assignee: null,
      query: '',
      // A batch starts with nothing chosen; one case starts on its category.
      category: this.count ? null : this.value,
      text: '',
      closeInGame: true
    }
  },
  computed: {
    // A long staff list gets a filter; it matches anywhere in the name.
    shown () {
      const query = this.query.trim().toLowerCase()
      return query ? this.staff.filter(member => member.name.toLowerCase().includes(query)) : this.staff
    },
    categoryOptions () { return [...this.categories, { id: '', label: 'None' }] },
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
      if (this.mode === 'assign') return this.loaded && !this.loading && this.assignee !== null
      if (this.mode === 'category') return this.category !== null && (this.count > 0 || this.category !== this.value)
      return true
    }
  },
  created () {
    if (this.mode === 'assign') this.loadStaff()
  },
  methods: {
    avatar (name) { return avatarStyle(name) },
    initial (name) { return initials(name) },
    // The filter or the chosen row; the summary field except on a touch screen.
    focusField () {
      focusLater(() => {
        if (this.mode === 'resolve') return touchLayout() ? null : this.$refs.field
        if (this.$refs.filter && !touchLayout()) return this.$refs.filter
        const content = this.$el && document.querySelector('.modal.show .batch-options')
        return content && (content.querySelector('[aria-pressed="true"]') || content.querySelector('.support-option'))
      })
    },
    pickFirst () { if (this.shown.length) this.assignee = this.shown[0].id },
    async loadStaff () {
      this.loading = true
      this.loadError = ''
      try {
        const { data } = await SpireApi.v1().get('player-support/staff', { params: { connection_id: this.connectionId } })
        this.staff = assignableStaff(data && data.staff)
        this.loaded = true
        this.focusField()
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
.batch-filter { margin-bottom: var(--support-space-3); }
.batch-options { display: grid; gap: var(--support-space-1); max-height: 320px; overflow-y: auto; }
.batch-options.is-categories { max-height: none; }
.batch-options .support-option { padding: 6px 10px; }
.batch-row { display: flex; align-items: center; gap: 10px; min-width: 0; min-height: 20px; }
.batch-row > .fe { width: 18px; color: var(--support-muted); text-align: center; }
.batch-row .support-avatar > i { font-size: 10px; }
.batch-name { flex: 1; min-width: 0; overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.batch-placeholder { margin: 0; }
.batch-close { margin-top: var(--support-space-4); }
</style>
