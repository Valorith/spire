<template>
  <section class="spire-editor-panel">
    <div class="spire-editor-section-heading">
      <div>
        <span class="spire-editor-section-kicker">Character profile</span>
        <h3>Identity, progression, and player state</h3>
      </div>
      <small>Human-readable selectors preserve any unknown legacy value until deliberately replaced.</small>
    </div>

    <div class="character-overview-layout">
      <div>
        <div class="spire-editor-grid spire-editor-grid--three">
          <div class="spire-editor-field">
            <label for="player-operations-character-name">Character name</label>
            <input
              id="player-operations-character-name"
              :value="model.name"
              class="form-control form-control-sm"
              maxlength="64"
              @input="set('name', $event.target.value)"
            >
            <span class="spire-editor-field-help">The live schema enforces uniqueness.</span>
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-character-last-name">Last name</label>
            <input
              id="player-operations-character-last-name"
              :value="model.last_name"
              class="form-control form-control-sm"
              maxlength="64"
              placeholder="No surname"
              @input="set('last_name', $event.target.value)"
            >
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-character-gender">Gender</label>
            <select id="player-operations-character-gender" :value="model.gender" class="form-control form-control-sm" @change="setNumber('gender', $event.target.value)">
              <option :value="0">Male (0)</option>
              <option :value="1">Female (1)</option>
              <option :value="2">Neutral (2)</option>
              <option v-if="!hasValue([0, 1, 2], model.gender)" :value="model.gender">Unknown legacy value ({{ model.gender }})</option>
            </select>
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-character-race">Race</label>
            <select id="player-operations-character-race" :value="model.race" class="form-control form-control-sm" @change="setNumber('race', $event.target.value)">
              <option v-if="!optionExists(raceOptions, model.race)" :value="model.race">Unknown legacy race ({{ model.race }})</option>
              <option v-for="option in raceOptions" :key="'race-' + option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-character-class">Class</label>
            <select id="player-operations-character-class" :value="model.class" class="form-control form-control-sm" @change="setNumber('class', $event.target.value)">
              <option v-if="!optionExists(classOptions, model.class)" :value="model.class">Unknown legacy class ({{ model.class }})</option>
              <option v-for="option in classOptions" :key="'class-' + option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-character-deity">Deity</label>
            <select id="player-operations-character-deity" :value="model.deity" class="form-control form-control-sm" @change="setNumber('deity', $event.target.value)">
              <option v-if="!optionExists(deityOptions, model.deity)" :value="model.deity">Unknown legacy deity ({{ model.deity }})</option>
              <option v-for="option in deityOptions" :key="'deity-' + option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-character-level">Level</label>
            <input
              id="player-operations-character-level"
              :value="model.level"
              class="form-control form-control-sm"
              type="number"
              min="1"
              max="255"
              @input="setNumber('level', $event.target.value)"
            >
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-character-title">Title text</label>
            <input
              id="player-operations-character-title"
              :value="model.title"
              class="form-control form-control-sm"
              maxlength="32"
              placeholder="No title"
              @input="set('title', $event.target.value)"
            >
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-character-suffix">Suffix text</label>
            <input
              id="player-operations-character-suffix"
              :value="model.suffix"
              class="form-control form-control-sm"
              maxlength="32"
              placeholder="No suffix"
              @input="set('suffix', $event.target.value)"
            >
          </div>
        </div>

        <div class="spire-editor-section-heading overview-subheading">
          <div>
            <span class="spire-editor-section-kicker">Progression controls</span>
            <h3>Points and visibility</h3>
          </div>
        </div>
        <div class="spire-editor-grid spire-editor-grid--three">
          <div class="spire-editor-field">
            <label for="player-operations-character-aa">Unspent AA points</label>
            <input id="player-operations-character-aa" :value="model.aa_points" class="form-control form-control-sm" type="number" min="0" @input="setNumber('aa_points', $event.target.value)">
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-character-practice">Practice points</label>
            <input id="player-operations-character-practice" :value="model.practice_points" class="form-control form-control-sm" type="number" min="0" @input="setNumber('practice_points', $event.target.value)">
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-character-anon">Visibility</label>
            <select id="player-operations-character-anon" :value="model.anon" class="form-control form-control-sm" @change="setNumber('anon', $event.target.value)">
              <option :value="0">Visible (0)</option>
              <option :value="1">Anonymous (1)</option>
              <option :value="2">Roleplay (2)</option>
              <option v-if="!hasValue([0, 1, 2], model.anon)" :value="model.anon">Unknown legacy value ({{ model.anon }})</option>
            </select>
          </div>
        </div>
      </div>

      <aside class="character-state-rail">
        <div class="spire-editor-context-card spire-editor-context-card--gold">
          <span class="spire-editor-context-label">Live character summary</span>
          <h4>{{ composedName }}</h4>
          <p>Character #{{ model.id }} · account #{{ model.account_id }}</p>
          <div class="character-summary-stats">
            <span><small>Level</small><strong>{{ model.level }}</strong></span>
            <span><small>AA available</small><strong>{{ number(model.aa_points) }}</strong></span>
            <span><small>AA spent</small><strong>{{ number(model.aa_points_spent) }}</strong></span>
            <span><small>Play time</small><strong>{{ playTime(model.time_played) }}</strong></span>
          </div>
        </div>

        <div class="character-switches">
          <label class="character-switch">
            <span>
              <strong>GM flagged</strong>
              <small>{{ Number(model.gm) ? 'Character has in-world GM state' : 'Standard player state' }}</small>
            </span>
            <input
              id="player-operations-character-gm"
              :checked="Number(model.gm) !== 0"
              type="checkbox"
              @change="setNumber('gm', $event.target.checked ? 1 : 0)"
            >
            <i></i>
          </label>
          <label v-for="toggle in toggles" :key="toggle.key" class="character-switch">
            <span>
              <strong>{{ toggle.label }}</strong>
              <small>{{ toggle.context }}</small>
            </span>
            <input :checked="Boolean(model[toggle.key])" type="checkbox" @change="set(toggle.key, $event.target.checked)">
            <i></i>
          </label>
        </div>

        <div v-if="validation.length" class="character-validation" role="alert">
          <strong><i class="fa fa-exclamation-triangle mr-1"></i>Review before saving</strong>
          <span v-for="message in validation" :key="message">{{ message }}</span>
        </div>
      </aside>
    </div>
  </section>
</template>

<script>
export default {
  name: 'CharacterOverview',
  props: {
    model: { type: Object, required: true },
    raceOptions: { type: Array, default: () => [] },
    classOptions: { type: Array, default: () => [] },
    deityOptions: { type: Array, default: () => [] },
    validation: { type: Array, default: () => [] }
  },
  data () {
    return {
      toggles: [
        { key: 'experience_enabled', label: 'Experience enabled', context: 'Character earns experience' },
        { key: 'pvp', label: 'PvP enabled', context: 'Player-versus-player state' },
        { key: 'show_helm', label: 'Show helm', context: 'Client displays head item' },
        { key: 'autosplit', label: 'Auto split coin', context: 'Group coin is divided' },
        { key: 'group_auto_consent', label: 'Group consent', context: 'Auto-consent group members' },
        { key: 'raid_auto_consent', label: 'Raid consent', context: 'Auto-consent raid members' },
        { key: 'guild_auto_consent', label: 'Guild consent', context: 'Auto-consent guild members' },
        { key: 'looking_for_group', label: 'Looking for group', context: 'LFG state is active' },
        { key: 'looking_for_players', label: 'Looking for players', context: 'LFP state is active' }
      ]
    }
  },
  computed: {
    composedName () {
      return [this.model.title, this.model.name, this.model.last_name, this.model.suffix].filter(Boolean).join(' ')
    }
  },
  methods: {
    set (field, value) {
      this.$emit('input', { ...this.model, [field]: value })
    },
    setNumber (field, value) {
      this.set(field, Number(value))
    },
    optionExists (options, value) {
      return options.some(option => Number(option.value) === Number(value))
    },
    hasValue (options, value) {
      return options.some(option => Number(option) === Number(value))
    },
    number (value) {
      return Number(value || 0).toLocaleString()
    },
    playTime (minutes) {
      const value = Number(minutes || 0)
      const hours = Math.floor(value / 60)
      return hours >= 24 ? `${Math.floor(hours / 24)}d` : `${hours}h`
    }
  }
}
</script>

<style scoped>
.character-overview-layout {
  display: grid;
  gap: 13px;
  grid-template-columns: minmax(0, 1fr) 300px;
}

.character-state-rail {
  align-content: start;
  display: grid;
  gap: 9px;
}

.character-summary-stats {
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 10px;
}

.character-summary-stats span {
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(178, 191, 204, 0.12);
  padding: 7px;
}

.character-summary-stats small,
.character-summary-stats strong {
  display: block;
}

.character-summary-stats small {
  color: #74808a;
  font-size: 8px;
  text-transform: uppercase;
}

.character-summary-stats strong {
  color: #dfc367;
  font-size: 12px;
  margin-top: 2px;
}

.character-switches {
  border: 1px solid rgba(178, 191, 204, 0.15);
}

.character-switch {
  align-items: center;
  background: rgba(0, 0, 0, 0.22);
  border-bottom: 1px solid rgba(178, 191, 204, 0.11);
  cursor: pointer;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) 34px;
  margin: 0;
  min-height: 42px;
  padding: 6px 9px;
  position: relative;
}

.character-switch:last-child {
  border-bottom: 0;
}

.character-switch strong,
.character-switch small {
  display: block;
}

.character-switch strong {
  color: #cbd1d5;
  font-size: 9px;
}

.character-switch small {
  color: #74808a;
  font-size: 8px;
}

.character-switch input {
  opacity: 0;
  position: absolute;
}

.character-switch i {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(178, 191, 204, 0.3);
  height: 17px;
  position: relative;
  width: 32px;
}

.character-switch i::after {
  background: #7b8790;
  content: "";
  height: 11px;
  left: 2px;
  position: absolute;
  top: 2px;
  transition: transform 120ms ease, background 120ms ease;
  width: 11px;
}

.character-switch input:checked + i {
  border-color: rgba(210, 170, 69, 0.58);
}

.character-switch input:checked + i::after {
  background: #d2aa45;
  transform: translateX(15px);
}

.character-switch input:focus-visible + i {
  outline: 2px solid #d2aa45;
  outline-offset: 2px;
}

.overview-subheading {
  margin-top: 16px;
}

.character-validation {
  background: rgba(94, 27, 27, 0.2);
  border: 1px solid rgba(202, 77, 81, 0.35);
  color: #c6a0a2;
  display: grid;
  font-size: 9px;
  gap: 3px;
  padding: 9px;
}

.character-validation strong {
  color: #e07d81;
  margin-bottom: 2px;
}

@media (max-width: 1180px) {
  .character-overview-layout {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .character-switch i::after {
    transition: none;
  }
}
</style>
