<template>
  <div class="achievement-reference-picker" :data-testid="testid">
    <label :for="inputId" class="achievement-field-label">{{ label }}</label>
    <div class="achievement-reference-picker__input">
      <input
        :id="inputId"
        :value="value"
        type="number"
        min="0"
        step="1"
        class="form-control form-control-sm"
        :disabled="disabled"
        :aria-describedby="helpId"
        @input="emitNumber($event)"
      >
      <b-button
        size="sm"
        variant="outline-warning"
        :disabled="disabled || !apiKind"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="panelId"
        @click="toggle"
      >
        <i class="fa fa-search mr-1"></i>{{ open ? 'Close' : 'Find' }}
      </b-button>
    </div>
    <small :id="helpId" class="achievement-field-help">{{ help }} Direct numeric IDs always remain available.</small>

    <div v-if="open" :id="panelId" class="achievement-lookup-panel">
      <label :for="searchId" class="achievement-field-label">Find {{ label.toLowerCase() }}</label>
      <div class="achievement-reference-picker__input">
        <input
          :id="searchId"
          v-model.trim="query"
          class="form-control form-control-sm"
          :placeholder="'Type a name or exact ID'"
          :aria-describedby="searchHelpId"
          @input="queueSearch"
          @keydown.enter.prevent="search"
        >
        <b-button size="sm" variant="warning" :disabled="loading || !canSearch" @click="search">
          <i class="fa mr-1" :class="loading ? 'fa-spinner fa-spin' : 'fa-search'"></i>Search
        </b-button>
      </div>
      <small :id="searchHelpId" class="achievement-field-help">
        Results are bounded to {{ limit }} rows. Enter at least two characters, or an exact numeric ID.
      </small>
      <div v-if="error" class="achievement-inline-alert achievement-inline-alert--warning" role="status">
        <i class="fa fa-exclamation-triangle"></i>
        <span>{{ error }} You can still enter a verified numeric ID above.</span>
      </div>
      <div v-if="results.length" class="achievement-lookup-results" role="group" :aria-label="label + ' lookup results'">
        <button
          v-for="row in results"
          :key="String(row.id)"
          type="button"
          class="achievement-lookup-result"
          :class="{ 'achievement-lookup-result--item': apiKind === 'item' }"
          :aria-pressed="String(row.id) === String(value) ? 'true' : 'false'"
          @click="choose(row)"
        >
          <span
            v-if="apiKind === 'item'"
            class="achievement-lookup-result__item-icon"
            :data-item-icon="row.icon_id || 0"
            :title="row.icon_id ? ('Item icon ' + row.icon_id) : 'No item icon'"
            aria-hidden="true"
          >
            <span v-if="row.icon_id" :class="'item-' + row.icon_id + '-sm'"></span>
            <i v-else class="fa fa-cube"></i>
          </span>
          <strong>#{{ row.id }}</strong>
          <span>{{ row.label || row.name || 'Unnamed record' }}</span>
          <small v-if="row.detail">{{ row.detail }}</small>
        </button>
      </div>
      <div v-else-if="searched && !loading && !error" class="achievement-lookup-empty">No bounded results matched this search.</div>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { SpireApi } from '@/app/api/spire-api'

  export default Vue.extend({
    name: 'AchievementReferencePicker',
    props: {
      id: { type: String, required: true },
      label: { type: String, required: true },
      help: { type: String, required: true },
      value: { type: [Number, String], default: 0 },
      kind: { type: String, default: '' },
      disabled: { type: Boolean, default: false },
      limit: { type: Number, default: 20 },
      testid: { type: String, default: '' }
    },
    data () {
      return {
        open: false,
        query: '',
        loading: false,
        searched: false,
        error: '',
        results: [] as any[],
        timer: null as any
      }
    },
    computed: {
      inputId (): string { return this.id },
      panelId (): string { return this.id + '-lookup-panel' },
      helpId (): string { return this.id + '-help' },
      searchId (): string { return this.id + '-lookup-search' },
      searchHelpId (): string { return this.id + '-lookup-search-help' },
      canSearch (): boolean {
        return /^\d+$/.test(this.query) || this.query.trim().length >= 2
      },
      apiKind (): string {
        const aliases: any = { npc_name: 'npc-name', alternate_currency: 'currency', title: 'title-set', cast_restriction: '' }
        return Object.prototype.hasOwnProperty.call(aliases, this.kind) ? aliases[this.kind] : this.kind
      }
    },
    beforeDestroy () {
      if (this.timer) window.clearTimeout(this.timer)
    },
    methods: {
      emitNumber (event: any) {
        const value = event.target.value === '' ? 0 : Number(event.target.value)
        this.$emit('input', Number.isFinite(value) ? value : 0)
      },
      toggle () {
        this.open = !this.open
        if (this.open && !this.query && Number(this.value) > 0) this.query = String(this.value)
      },
      queueSearch () {
        if (this.timer) window.clearTimeout(this.timer)
        if (!this.canSearch) return
        this.timer = window.setTimeout(() => this.search(), 350)
      },
      async search () {
        if (!this.canSearch || this.loading) return
        const query = this.query.trim()
        this.loading = true
        this.searched = true
        this.error = ''
        try {
          const response = await SpireApi.v1().get('/achievement-editor/lookups/' + encodeURIComponent(this.apiKind), {
            params: { q: query, limit: Math.min(Math.max(Number(this.limit), 1), 50) }
          })
          if (this.query.trim() === query) {
            const payload = response.data || {}
            const rows = Array.isArray(payload) ? payload : (payload.data || [])
            this.results = rows.slice(0, this.limit)
          }
        } catch (error) {
          if (this.query.trim() === query) {
            this.results = []
            this.error = this.errorMessage(error, 'Lookup could not be loaded.')
          }
        } finally {
          this.loading = false
          if (this.query.trim() !== query) {
            if (this.canSearch) await this.search()
            else this.results = []
          }
        }
      },
      choose (row: any) {
        this.$emit('input', Number(row.id))
        this.$emit('selected', row)
        this.open = false
      },
      errorMessage (error: any, fallback: string): string {
        const data = error && error.response && error.response.data
        return (data && (data.message || data.error)) || fallback
      }
    }
  })
</script>
