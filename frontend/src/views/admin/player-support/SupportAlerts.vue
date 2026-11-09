<template>
  <b-modal visible centered modal-class="support-modal" title="Petition alerts" @hide="$emit('close')">
    <div class="alerts">
      <h3>In this browser</h3>
      <p class="alerts-hint">Alerts fire for new petitions and player replies while Player Support is open in a tab.</p>
      <label class="alerts-toggle">
        <input type="checkbox" :checked="prefs.desktop" :disabled="!desktopSupported || permission === 'denied'" @change="toggleDesktop($event.target.checked)">
        <span><strong>Desktop notifications</strong><small>{{ desktopHint }}</small></span>
      </label>
      <label class="alerts-toggle">
        <input type="checkbox" :checked="prefs.sound" @change="toggleSound($event.target.checked)">
        <span><strong>Sound</strong><small>A short chime. <button type="button" class="alerts-link" @click.prevent="preview">Play it</button></small></span>
      </label>

      <h3>For the whole team</h3>
      <p v-if="loading" class="alerts-hint">Loading…</p>
      <p v-else-if="!settings.available" class="alerts-hint">
        Discord alerts are set up from the Spire that runs beside this game server.
      </p>
      <template v-else>
        <p class="alerts-hint">Post each new petition to a Discord channel, using a webhook from EQEmu’s Discord webhooks table. Mentions are turned off.</p>
        <label for="alerts-webhook">Discord channel</label>
        <select id="alerts-webhook" v-model.number="webhook" class="form-control" :disabled="!canWrite || saving">
          <option :value="0">Off</option>
          <option v-for="option in settings.webhooks" :key="option.id" :value="option.id">{{ option.name || 'Webhook #' + option.id }}</option>
        </select>
        <p v-if="!settings.webhooks.length" class="alerts-hint">No webhooks yet. Add one to the <code>discord_webhooks</code> table, then reopen this window.</p>
      </template>
      <p v-if="error" class="alerts-error" role="alert">{{ error }}</p>
      <p v-if="saved" class="alerts-saved" role="status"><i class="fe fe-check" aria-hidden="true"></i> Saved</p>
    </div>
    <template #modal-footer>
      <button type="button" class="btn btn-outline-light btn-sm" @click="$emit('close')">Done</button>
      <button v-if="settings.available && canWrite" type="button" class="btn btn-primary btn-sm" :disabled="saving || webhook === settings.discord_webhook_id" @click="save">
        {{ saving ? 'Saving…' : 'Save Discord channel' }}
      </button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { playChime, readAlertPrefs, saveAlertPrefs } from './support-ui'

export default {
  name: 'SupportAlerts',
  props: {
    connectionId: { type: Number, required: true },
    canWrite: { type: Boolean, default: false }
  },
  data () {
    return {
      prefs: readAlertPrefs(), permission: 'Notification' in window ? window.Notification.permission : 'unsupported',
      settings: { available: false, webhooks: [], discord_webhook_id: 0 }, webhook: 0,
      loading: true, saving: false, saved: false, error: ''
    }
  },
  computed: {
    desktopSupported () { return this.permission !== 'unsupported' },
    desktopHint () {
      if (!this.desktopSupported) return 'This browser does not support notifications.'
      if (this.permission === 'denied') return 'Blocked for this site. Allow notifications in the browser’s site settings.'
      return 'Shown when the Player Support tab is in the background.'
    }
  },
  async mounted () {
    try {
      const { data } = await SpireApi.v1().get('player-support/settings', { params: { connection_id: this.connectionId } })
      this.settings = data
      this.webhook = data.discord_webhook_id || 0
    } catch (error) {
      this.error = this.errorText(error)
    } finally {
      this.loading = false
    }
  },
  methods: {
    errorText (error) { return (error.response && error.response.data && error.response.data.error) || 'Request failed' },
    async toggleDesktop (on) {
      if (on && this.permission !== 'granted') {
        try {
          this.permission = await window.Notification.requestPermission()
        } catch (e) {
          this.permission = 'denied'
        }
      }
      this.update({ desktop: on && this.permission === 'granted' })
    },
    toggleSound (on) {
      this.update({ sound: on })
      if (on) playChime()
    },
    update (change) {
      this.prefs = { ...this.prefs, ...change }
      saveAlertPrefs(this.prefs)
      this.$emit('change', this.prefs)
    },
    preview () { playChime() },
    async save () {
      this.saving = true
      this.error = ''
      this.saved = false
      try {
        await SpireApi.v1().put('player-support/settings', { discord_webhook_id: this.webhook }, { params: { connection_id: this.connectionId } })
        this.settings = { ...this.settings, discord_webhook_id: this.webhook }
        this.saved = true
      } catch (error) {
        this.error = this.errorText(error)
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.alerts h3 { margin: 4px 0 4px; color: #f0f4f8; font-size: .86rem; font-weight: 650; }
.alerts h3 + .alerts-hint { margin-top: 0; }
.alerts h3:not(:first-child) { margin-top: 18px; padding-top: 14px; border-top: 1px solid #2a3948; }
.alerts-hint { margin: 4px 0 8px; color: #8fa1b5; font-size: .78rem; }
.alerts-toggle {
  display: flex !important; gap: 10px; align-items: flex-start; margin: 6px 0 !important; padding: 9px 11px;
  border: 1px solid #2f3d4d; border-radius: 9px; background: #172230; cursor: pointer; font-weight: 400 !important;
}
.alerts-toggle input { margin-top: 3px; accent-color: #dfb976; }
.alerts-toggle span { display: grid; gap: 2px; }
.alerts-toggle strong { color: #eef3f8; font-size: .82rem; font-weight: 600; }
.alerts-toggle small { color: #8fa1b5; font-size: .74rem; }
.alerts-link { padding: 0; border: 0; background: none; color: #dfb976; font-size: inherit; }
.alerts code { color: #f3dcae; background: #241f18; padding: 1px 5px; border-radius: 4px; }
.alerts-error { margin: 10px 0 0; color: #ffadbd; font-size: .8rem; }
.alerts-saved { margin: 10px 0 0; color: #8fd6ad; font-size: .8rem; }
</style>
