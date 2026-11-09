<template>
  <b-modal visible centered modal-class="support-modal" title="Petition alerts" @hide="$emit('close')">
    <div class="alerts">
      <section class="alerts-section">
        <h3 class="support-section-label">In this browser</h3>
        <p class="alerts-hint">Alerts fire for new petitions, player replies and follow-ups due while Player Support is open in a tab.</p>
        <div class="support-settings">
          <label for="alerts-desktop" class="support-setting" :class="{ 'is-disabled': !desktopSupported || permission === 'denied' }">
            <span class="support-setting-text"><strong id="alerts-desktop-title">Desktop notifications</strong><small id="alerts-desktop-hint">{{ desktopHint }}</small></span>
            <input id="alerts-desktop" type="checkbox" class="support-switch" aria-labelledby="alerts-desktop-title" aria-describedby="alerts-desktop-hint"
                   :checked="prefs.desktop" :disabled="!desktopSupported || permission === 'denied'" @change="toggleDesktop($event.target.checked)">
          </label>
          <label for="alerts-sound" class="support-setting">
            <span class="support-setting-text"><strong id="alerts-sound-title">Sound</strong><small id="alerts-sound-hint">A short chime. <button type="button" class="support-link" @click.prevent="preview">Play it</button></small></span>
            <input id="alerts-sound" type="checkbox" class="support-switch" aria-labelledby="alerts-sound-title" aria-describedby="alerts-sound-hint"
                   :checked="prefs.sound" @change="toggleSound($event.target.checked)">
          </label>
        </div>
      </section>

      <section class="alerts-section">
        <h3 class="support-section-label">For the whole team</h3>
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
          <p v-if="!settings.webhooks.length" class="alerts-hint alerts-after">No webhooks yet. Add one to the <code>discord_webhooks</code> table, then reopen this window.</p>
        </template>
        <p v-if="error" class="support-feedback is-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ error }}</p>
        <p v-if="saved" class="support-feedback is-success" role="status"><i class="fe fe-check" aria-hidden="true"></i> Saved</p>
      </section>
    </div>
    <template #modal-footer>
      <button type="button" class="support-button" @click="$emit('close')">Done</button>
      <button v-if="settings.available && canWrite" type="button" class="support-button is-primary" :disabled="saving || webhook === settings.discord_webhook_id" @click="save">
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
      prefs: readAlertPrefs(),
      permission: 'Notification' in window ? window.Notification.permission : 'unsupported',
      settings: { available: false, webhooks: [], discord_webhook_id: 0 },
      webhook: 0,
      loading: true,
      saving: false,
      saved: false,
      error: ''
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
/* Dialog chrome, fields, buttons, feedback and the switch rows come from support-theme.css. */
.alerts-section + .alerts-section { margin-top: var(--support-space-5); padding-top: var(--support-space-4); border-top: 1px solid var(--support-border-subtle); }
.alerts-section .support-section-label { margin-bottom: var(--support-space-1); }
.alerts-hint { margin: 0 0 var(--support-space-3); color: var(--support-muted); font-size: var(--support-text-sm); line-height: 1.5; }
.alerts-after { margin: var(--support-space-2) 0 0; }
</style>
