<template>
  <section class="spire-editor-panel">
    <div class="spire-editor-section-heading">
      <div>
        <span class="spire-editor-section-kicker">Account profile</span>
        <h3>Privileges and in-game behavior</h3>
      </div>
      <small>Login-server identity is visible for context but credentials never leave the server.</small>
    </div>

    <div class="account-overview-layout">
      <div>
        <div class="spire-editor-grid spire-editor-grid--three">
          <div class="spire-editor-field">
            <label for="player-operations-account-id">Account ID</label>
            <input id="player-operations-account-id" :value="model.id" class="form-control form-control-sm" readonly>
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-account-name">Login name</label>
            <input id="player-operations-account-name" :value="model.name" class="form-control form-control-sm" readonly>
            <span class="spire-editor-field-help">Managed by the login system.</span>
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-account-status">Account status</label>
            <select
              id="player-operations-account-status"
              :value="model.status"
              class="form-control form-control-sm"
              @change="setNumber('status', $event.target.value)"
            >
              <option v-if="!statusKnown" :value="model.status">Custom legacy status ({{ model.status }})</option>
              <option v-for="option in statusOptions" :key="'status-' + option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-account-charname">Last character used</label>
            <input
              id="player-operations-account-charname"
              :value="model.character_name"
              class="form-control form-control-sm"
              maxlength="64"
              placeholder="No character recorded"
              @input="set('character_name', $event.target.value)"
            >
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-account-auto-login">Auto-login character</label>
            <input
              id="player-operations-account-auto-login"
              :value="model.auto_login_name"
              class="form-control form-control-sm"
              maxlength="64"
              placeholder="Disabled"
              @input="set('auto_login_name', $event.target.value)"
            >
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-account-shared-plat">Shared platinum</label>
            <input id="player-operations-account-shared-plat" :value="model.shared_platinum" class="form-control form-control-sm" type="number" min="0" @input="setNumber('shared_platinum', $event.target.value)">
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-account-karma">Karma</label>
            <input id="player-operations-account-karma" :value="model.karma" class="form-control form-control-sm" type="number" min="0" @input="setNumber('karma', $event.target.value)">
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-account-fly-mode">Movement override</label>
            <select id="player-operations-account-fly-mode" :value="model.fly_mode" class="form-control form-control-sm" @change="setNumber('fly_mode', $event.target.value)">
              <option :value="0">Normal movement (0)</option>
              <option :value="1">Levitate (1)</option>
              <option :value="2">Fly (2)</option>
              <option v-if="![0, 1, 2].includes(Number(model.fly_mode))" :value="model.fly_mode">Unknown legacy mode ({{ model.fly_mode }})</option>
            </select>
          </div>
          <div class="spire-editor-field">
            <label for="player-operations-account-mini-ip">Mini-login IP</label>
            <input
              id="player-operations-account-mini-ip"
              :value="model.mini_login_ip"
              class="form-control form-control-sm"
              maxlength="32"
              placeholder="No IP lock"
              @input="set('mini_login_ip', $event.target.value)"
            >
          </div>
        </div>
      </div>

      <aside class="account-context-rail">
        <div class="spire-editor-context-card spire-editor-context-card--gold">
          <span class="spire-editor-context-label">Login-server linkage</span>
          <h4>{{ model.login_server || 'Local / unlinked' }}</h4>
          <p>{{ model.login_server_id == null ? 'No external login account ID' : 'Login account #' + model.login_server_id }}</p>
          <div class="account-facts">
            <span><small>Created</small><strong>{{ createdLabel }}</strong></span>
            <span><small>Status</small><strong>{{ statusLabel }}</strong></span>
          </div>
        </div>

        <div class="account-switches">
          <label v-for="toggle in toggles" :key="toggle.key" class="account-switch">
            <span><strong>{{ toggle.label }}</strong><small>{{ toggle.context }}</small></span>
            <input :checked="Boolean(model[toggle.key])" type="checkbox" @change="set(toggle.key, $event.target.checked)">
            <i></i>
          </label>
        </div>

        <div v-if="validation.length" class="account-validation" role="alert">
          <strong><i class="fa fa-exclamation-triangle mr-1"></i>Review before saving</strong>
          <span v-for="message in validation" :key="message">{{ message }}</span>
        </div>
      </aside>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AccountOverview',
  props: {
    model: { type: Object, required: true },
    statusOptions: { type: Array, default: () => [] },
    validation: { type: Array, default: () => [] }
  },
  data () {
    return {
      toggles: [
        { key: 'gm_speed', label: 'GM speed', context: 'Elevated movement speed' },
        { key: 'invulnerable', label: 'Invulnerable', context: 'Account characters cannot be damaged' },
        { key: 'ignore_tells', label: 'Ignore tells', context: 'Private tells are suppressed' },
        { key: 'revoked', label: 'Revoked', context: 'Chat privileges are revoked' },
        { key: 'hidden', label: 'Hidden', context: 'Hide GM presence' },
        { key: 'rules_accepted', label: 'Rules accepted', context: 'Server rules flag is set' }
      ]
    }
  },
  computed: {
    statusKnown () {
      return this.statusOptions.some(option => Number(option.value) === Number(this.model.status))
    },
    statusLabel () {
      const option = this.statusOptions.find(row => Number(row.value) === Number(this.model.status))
      return option ? option.label.replace(/\s\([^)]*\)$/, '') : `Custom ${this.model.status}`
    },
    createdLabel () {
      if (!this.model.created_at_unix) return 'Unknown'
      return new Date(Number(this.model.created_at_unix) * 1000).toLocaleDateString()
    }
  },
  methods: {
    set (field, value) {
      this.$emit('input', { ...this.model, [field]: value })
    },
    setNumber (field, value) {
      this.set(field, Number(value))
    }
  }
}
</script>

<style scoped>
.account-overview-layout {
  display: grid;
  gap: 13px;
  grid-template-columns: minmax(0, 1fr) 300px;
}

.account-context-rail {
  align-content: start;
  display: grid;
  gap: 9px;
}

.account-facts {
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 10px;
}

.account-facts span {
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(178, 191, 204, 0.12);
  padding: 7px;
}

.account-facts small,
.account-facts strong {
  display: block;
}

.account-facts small {
  color: #74808a;
  font-size: 8px;
  text-transform: uppercase;
}

.account-facts strong {
  color: #dfc367;
  font-size: 10px;
  margin-top: 2px;
}

.account-switches {
  border: 1px solid rgba(178, 191, 204, 0.15);
}

.account-switch {
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

.account-switch:last-child { border-bottom: 0; }
.account-switch strong,
.account-switch small { display: block; }
.account-switch strong { color: #cbd1d5; font-size: 9px; }
.account-switch small { color: #74808a; font-size: 8px; }
.account-switch input { opacity: 0; position: absolute; }

.account-switch i {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(178, 191, 204, 0.3);
  height: 17px;
  position: relative;
  width: 32px;
}

.account-switch i::after {
  background: #7b8790;
  content: "";
  height: 11px;
  left: 2px;
  position: absolute;
  top: 2px;
  transition: transform 120ms ease, background 120ms ease;
  width: 11px;
}

.account-switch input:checked + i { border-color: rgba(210, 170, 69, 0.58); }
.account-switch input:checked + i::after { background: #d2aa45; transform: translateX(15px); }
.account-switch input:focus-visible + i { outline: 2px solid #d2aa45; outline-offset: 2px; }

.account-validation {
  background: rgba(94, 27, 27, 0.2);
  border: 1px solid rgba(202, 77, 81, 0.35);
  color: #c6a0a2;
  display: grid;
  font-size: 9px;
  gap: 3px;
  padding: 9px;
}

.account-validation strong { color: #e07d81; margin-bottom: 2px; }

@media (max-width: 1180px) {
  .account-overview-layout { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .account-switch i::after { transition: none; }
}
</style>
