<template>
  <div>
    <a
      href="#sidebarModalActivity"
      class="navbar-user-link"
      data-toggle="modal"
      data-testid="open-user-settings"
      aria-label="Open Spire settings"
      v-b-modal.user-settings-modal
    >
      <span class="icon">
        <i class="fe fe-settings"></i>
      </span>
    </a>

    <b-modal id="user-settings-modal" centered title="Settings" size="lg">

      <!-- Debug Mode -->
      <div class="row mb-4">
        <div class="col-4 text-right">
          Debug Mode
          <b-form-checkbox
            v-model="debugEnabled"
            name="check-button"
            @change="debugUpdate"
            switch
            class="d-inline-block ml-3"
          />
        </div>
        <div class="col-8">
          <small class="text-muted">
            Some debugging features may require browser reload to take affect
          </small>
        </div>
      </div>

      <!-- Tab hovering -->
      <div class="row mb-4">
        <div class="col-4 text-right">
          Enable Tab Hover
          <b-form-checkbox
            v-model="tabHoverModeEnabled"
            name="check-button"
            @change="updateSetting('tab-hover', tabHoverModeEnabled)"
            switch
            class="d-inline-block ml-3"
          />
        </div>
        <div class="col-8">
          <small class="text-muted">
            Tabs are activated via mouse hover versus click
          </small>
        </div>
      </div>

      <!-- Beta Updates -->
      <div v-if="isLocalApp" class="row mb-4" data-testid="beta-updates-setting">
        <div class="col-4 text-right">
          <label
            for="beta-updates-toggle-control"
            class="mb-0"
            data-testid="beta-updates-label"
          >Beta Updates</label>
          <b-form-checkbox
            id="beta-updates-toggle-control"
            v-model="betaUpdatesEnabled"
            name="beta-updates"
            switch
            class="d-inline-block ml-3"
            data-testid="beta-updates-toggle"
            aria-label="Enable Beta updates"
            :disabled="updateChannelSaving"
            @change="betaUpdatesUpdate"
          />
        </div>
        <div class="col-8">
          <small class="text-muted">
            Includes eligible GitHub prereleases. Beta builds may be unstable.
          </small>
          <small v-if="updateChannelSaving" class="d-block text-info mt-1" role="status">
            Saving update channel…
          </small>
          <small v-if="updateChannelError" class="d-block text-danger mt-1" role="alert">
            {{ updateChannelError }}
          </small>
        </div>
      </div>

      <!-- Spell Legacy Icons -->
      <div class="row mb-4">
        <div class="col-4 text-right">
          Spell Legacy Icons
          <b-form-checkbox
            v-model="spellLegacyIcons"
            name="check-button"
            @change="spellLegacyIconsUpdate"
            switch
            class="d-inline-block ml-3"
          />
        </div>
        <div class="col-8">
          <small class="text-muted">
            Enables legacy spell icons
          </small>
        </div>
      </div>

      <template #modal-footer>
        <div class="">

        </div>
      </template>
    </b-modal>
  </div>
</template>

<script>

import {LocalSettings, Setting} from "@/app/local-settings/localsettings";
import {App}                    from "@/constants/app";
import {EventBus}               from "@/app/event-bus/event-bus";
import {AppEnv}                 from "@/app/env/app-env";

export default {
  name: "NavbarUserSettingsCog",
  data() {
    return {
      debugEnabled: LocalSettings.isDebugEnabled(),
      tabHoverModeEnabled: LocalSettings.isTabHoverEnabled(),
      spellLegacyIcons: LocalSettings.isSpellLegacyIconsEnabled(),
      betaUpdatesEnabled: AppEnv.getUpdateChannel() === "beta",
      isLocalApp: AppEnv.isAppLocal(),
      updateChannelSaving: false,
      updateChannelError: "",
    }
  },
  created() {
    EventBus.$on("APP_ENV_LOADED", this.syncUpdateChannel);
    EventBus.$on("APP_UPDATE_CHANNEL_CHANGED", this.handleUpdateChannelChanged);
    EventBus.$on("APP_UPDATE_CHANNEL_CHANGE_FAILED", this.handleUpdateChannelChangeFailed);
  },
  destroyed() {
    EventBus.$off("APP_ENV_LOADED", this.syncUpdateChannel);
    EventBus.$off("APP_UPDATE_CHANNEL_CHANGED", this.handleUpdateChannelChanged);
    EventBus.$off("APP_UPDATE_CHANNEL_CHANGE_FAILED", this.handleUpdateChannelChangeFailed);
  },
  methods: {
    debugUpdate() {
      // checkbox apparently hasn't had enough time to update reactively... queue it
      setTimeout(() => {
        LocalSettings.set(Setting.DEBUG_MODE, this.debugEnabled)
        App.DEBUG = this.debugEnabled
        EventBus.$emit('DEBUG_UPDATED', true);
      }, 100)
    },
    spellLegacyIconsUpdate() {
      // checkbox apparently hasn't had enough time to update reactively... queue it
      setTimeout(() => {
        LocalSettings.set(Setting.SPELL_LEGACY_ICONS, this.spellLegacyIcons)
        App.SPELL_LEGACY_ICONS_ENABLED = this.spellLegacyIcons
        EventBus.$emit('SPELL_LEGACY_ICONS_ENABLED', true);
      }, 10)
    },
    updateSetting(name, value) {
      LocalSettings.set(name, value)
    },
    syncUpdateChannel() {
      this.isLocalApp = AppEnv.isAppLocal()
      this.betaUpdatesEnabled = AppEnv.getUpdateChannel() === "beta"
    },
    betaUpdatesUpdate(enabled) {
      this.betaUpdatesEnabled = enabled === true
      this.updateChannelSaving = true
      this.updateChannelError = ""
      EventBus.$emit(
        "APP_UPDATE_CHANNEL_CHANGE_REQUESTED",
        this.betaUpdatesEnabled ? "beta" : "stable"
      )
    },
    handleUpdateChannelChanged(channel) {
      this.betaUpdatesEnabled = channel === "beta"
      this.updateChannelSaving = false
      this.updateChannelError = ""
    },
    handleUpdateChannelChangeFailed(payload) {
      this.betaUpdatesEnabled = payload?.channel === "beta"
      this.updateChannelSaving = false
      this.updateChannelError = payload?.error || "Could not save the Spire update channel."
    }
  }


}
</script>
