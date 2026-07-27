<template>
  <section class="spire-editor-panel">
    <div class="spire-editor-section-heading">
      <div>
        <span class="spire-editor-section-kicker">Guild profile</span>
        <h3>Identity, leadership, and public context</h3>
      </div>
      <small>Leadership uses a named character selector and must resolve to a current member when editing.</small>
    </div>

    <div class="guild-overview-layout">
      <div>
        <div class="spire-editor-grid spire-editor-grid--two">
          <div class="spire-editor-field">
            <label for="player-operations-guild-name">Guild name</label>
            <input
              id="player-operations-guild-name"
              :value="model.name"
              class="form-control form-control-sm"
              maxlength="32"
              placeholder="New guild name"
              @input="set('name', $event.target.value)"
            >
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-guild-status">Minimum account status</label>
            <select id="player-operations-guild-status" :value="model.min_status" class="form-control form-control-sm" @change="setNumber('min_status', $event.target.value)">
              <option :value="0">Player (0)</option>
              <option :value="10">Steward (10)</option>
              <option :value="20">Apprentice Guide (20)</option>
              <option :value="50">Guide (50)</option>
              <option :value="80">Quest Troupe (80)</option>
              <option :value="100">GM (100)</option>
              <option :value="150">Senior GM (150)</option>
              <option :value="200">Administrator (200)</option>
              <option v-if="![0, 10, 20, 50, 80, 100, 150, 200].includes(Number(model.min_status))" :value="model.min_status">Custom legacy status ({{ model.min_status }})</option>
            </select>
          </div>
        </div>

        <div class="spire-editor-field guild-leader-field">
          <label for="player-operations-guild-leader-search">Guild leader</label>
          <div v-if="model.leader_id" class="guild-selected-leader">
            <i class="ra ra-crown"></i>
            <span><strong>{{ model.leader_name || 'Character #' + model.leader_id }}</strong><small>Character #{{ model.leader_id }}</small></span>
            <button type="button" aria-label="Clear guild leader" @click="clearLeader"><i class="fa fa-times"></i></button>
          </div>
          <div class="guild-search">
            <i class="fa fa-search"></i>
            <input
              id="player-operations-guild-leader-search"
              v-model.trim="search"
              class="form-control form-control-sm"
              :placeholder="isCreating ? 'Search a character to make guild leader…' : 'Search current member name or exact ID…'"
              @input="queueSearch"
            >
          </div>
          <div v-if="searching || results.length" class="guild-results">
            <div v-if="searching" class="guild-search-state"><i class="fa fa-spinner fa-spin"></i> Searching characters…</div>
            <button v-for="character in filteredResults" :key="'guild-leader-' + character.id" type="button" @click="selectLeader(character)">
              <span><strong>{{ character.name }}</strong><small>#{{ character.id }} · level {{ character.level }} · {{ character.guild_name || 'No guild' }}</small></span>
              <i class="fa fa-chevron-right"></i>
            </button>
            <div v-if="!searching && !filteredResults.length" class="guild-search-state">No eligible characters match.</div>
          </div>
          <span class="spire-editor-field-help">
            {{ isCreating ? 'The selected character is moved into the new guild as rank 1.' : 'Only current members can become leader; use the Members tab to add someone first.' }}
          </span>
        </div>

        <div class="spire-editor-grid spire-editor-grid--two guild-public-fields">
          <div class="spire-editor-field">
            <label for="player-operations-guild-channel">Custom channel</label>
            <input id="player-operations-guild-channel" :value="model.channel" class="form-control form-control-sm" maxlength="128" placeholder="No custom channel" @input="set('channel', $event.target.value)">
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-guild-url">Guild URL</label>
            <input id="player-operations-guild-url" :value="model.url" class="form-control form-control-sm" maxlength="512" placeholder="https://…" @input="set('url', $event.target.value)">
          </div>
          <div class="spire-editor-field guild-motd">
            <label for="player-operations-guild-motd">Message of the day</label>
            <textarea id="player-operations-guild-motd" :value="model.motd" class="form-control form-control-sm" rows="4" placeholder="No guild message" @input="set('motd', $event.target.value)"></textarea>
            <span v-if="model.motd_setter" class="spire-editor-field-help">Last set by {{ model.motd_setter }}.</span>
          </div>
        </div>
      </div>

      <aside class="guild-context-rail">
        <div class="spire-editor-context-card spire-editor-context-card--gold">
          <span class="spire-editor-context-label">Guild at a glance</span>
          <h4>{{ model.name || 'Untitled guild' }}</h4>
          <p>{{ model.leader_name ? 'Led by ' + model.leader_name : 'No leader selected' }}</p>
          <div class="guild-facts">
            <span><small>Guild ID</small><strong>{{ model.id || 'New' }}</strong></span>
            <span><small>Min status</small><strong>{{ model.min_status || 0 }}</strong></span>
          </div>
        </div>
        <div class="spire-editor-grid spire-editor-grid--two">
          <div class="spire-editor-field">
            <label for="player-operations-guild-tribute">Tribute balance</label>
            <input id="player-operations-guild-tribute" :value="model.tribute" class="form-control form-control-sm" type="number" min="0" @input="setNumber('tribute', $event.target.value)">
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-guild-favor">Favor</label>
            <input id="player-operations-guild-favor" :value="model.favor" class="form-control form-control-sm" type="number" min="0" @input="setNumber('favor', $event.target.value)">
          </div>
        </div>
        <div v-if="validation.length" class="guild-validation" role="alert">
          <strong><i class="fa fa-exclamation-triangle mr-1"></i>Review before saving</strong>
          <span v-for="message in validation" :key="message">{{ message }}</span>
        </div>
      </aside>
    </div>
  </section>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'

export default {
  name: 'GuildOverview',
  props: {
    model: { type: Object, required: true },
    isCreating: { type: Boolean, default: false },
    validation: { type: Array, default: () => [] }
  },
  data () {
    return {
      search: '',
      searching: false,
      results: [],
      timer: null
    }
  },
  computed: {
    filteredResults () {
      if (this.isCreating) return this.results
      return this.results.filter(character => Number(character.guild_id) === Number(this.model.id))
    }
  },
  beforeDestroy () {
    window.clearTimeout(this.timer)
  },
  methods: {
    set (field, value) {
      this.$emit('input', { ...this.model, [field]: value })
    },
    setNumber (field, value) {
      this.set(field, Number(value))
    },
    queueSearch () {
      window.clearTimeout(this.timer)
      if (this.search.length < 2) {
        this.results = []
        return
      }
      this.timer = window.setTimeout(this.searchCharacters, 260)
    },
    async searchCharacters () {
      this.searching = true
      try {
        const response = await SpireApi.v1().get('/player-operations/lookup/characters', { params: { q: this.search } })
        this.results = response.data.data || []
      } catch (error) {
        this.results = []
      } finally {
        this.searching = false
      }
    },
    selectLeader (character) {
      this.$emit('input', { ...this.model, leader_id: Number(character.id), leader_name: character.name })
      this.search = ''
      this.results = []
    },
    clearLeader () {
      this.$emit('input', { ...this.model, leader_id: 0, leader_name: '' })
    }
  }
}
</script>

<style scoped>
.guild-overview-layout {
  display: grid;
  gap: 13px;
  grid-template-columns: minmax(0, 1fr) 300px;
}

.guild-context-rail {
  align-content: start;
  display: grid;
  gap: 9px;
}

.guild-leader-field {
  margin-top: 12px;
  position: relative;
}

.guild-selected-leader {
  align-items: center;
  background: rgba(210, 170, 69, 0.1);
  border: 1px solid rgba(210, 170, 69, 0.28);
  display: flex;
  gap: 9px;
  margin-bottom: 6px;
  min-height: 48px;
  padding: 7px 9px;
}

.guild-selected-leader > i {
  color: #d4b24e;
  flex: 0 0 28px;
  text-align: center;
}

.guild-selected-leader span {
  min-width: 0;
}

.guild-selected-leader strong,
.guild-selected-leader small {
  display: block;
}

.guild-selected-leader strong { color: #dbe0e3; font-size: 10px; }
.guild-selected-leader small { color: #77828b; font-size: 8px; }

.guild-selected-leader button {
  background: transparent !important;
  border: 0 !important;
  color: #88939c;
  margin-left: auto;
}

.guild-search {
  position: relative;
}

.guild-search > i {
  color: #82909a;
  font-size: 11px;
  left: 10px;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.guild-search .form-control {
  padding-left: 29px !important;
}

.guild-results {
  background: #07111a;
  border: 1px solid rgba(210, 170, 69, 0.45);
  max-height: 220px;
  overflow-y: auto;
  position: absolute;
  top: calc(100% - 17px);
  width: 100%;
  z-index: 40;
}

.guild-results button {
  align-items: center;
  background: transparent !important;
  border: 0 !important;
  border-bottom: 1px solid rgba(178, 191, 204, 0.12) !important;
  color: #d7dcdf;
  display: flex !important;
  justify-content: space-between;
  padding: 8px !important;
  text-align: left !important;
  width: 100%;
}

.guild-results strong,
.guild-results small {
  display: block;
}

.guild-results strong { font-size: 10px; }
.guild-results small { color: #74808a; font-size: 8px; }
.guild-results > button > i { color: #997f3e; }

.guild-search-state {
  color: #87929b;
  font-size: 9px;
  padding: 9px;
}

.guild-public-fields {
  margin-top: 12px;
}

.guild-motd {
  grid-column: 1 / -1;
}

.guild-facts {
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 10px;
}

.guild-facts span {
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(178, 191, 204, 0.12);
  padding: 7px;
}

.guild-facts small,
.guild-facts strong {
  display: block;
}

.guild-facts small {
  color: #74808a;
  font-size: 8px;
  text-transform: uppercase;
}

.guild-facts strong {
  color: #dfc367;
  font-size: 11px;
  margin-top: 2px;
}

.guild-validation {
  background: rgba(94, 27, 27, 0.2);
  border: 1px solid rgba(202, 77, 81, 0.35);
  color: #c6a0a2;
  display: grid;
  font-size: 9px;
  gap: 3px;
  padding: 9px;
}

.guild-validation strong { color: #e07d81; margin-bottom: 2px; }

@media (max-width: 1180px) {
  .guild-overview-layout { grid-template-columns: 1fr; }
}
</style>
