<template>
  <div class="sage-container">
    <div ref="sage-root" class="sage-root"></div>
    <div v-if="showStartupOverlay" class="sage-startup-overlay">
      <div class="sage-startup-card">
        <div class="sage-startup-title">Preparing Sage</div>
        <div class="sage-startup-stage">{{ startupStage }}</div>
        <div v-if="startupDetail" class="sage-startup-detail">
          {{ startupDetail }}
        </div>
      </div>
    </div>
    <div v-if="loadError" class="sage-error">
      {{ loadError }}
    </div>
  </div>
</template>

<script>
import * as SpireApiTypes from "@/app/api";
import { SpireApi } from "../../app/api/spire-api";
import { SpireQueryBuilder } from "@/app/api/spire-query-builder";
import { Navbar } from "../../app/navbar";
import { Zones } from "../../app/zones";
import { Spawn } from "../../app/spawn";
import { Npcs } from "../../app/npcs";
import { Grid } from "../../app/grid";
import { loadEqSageEmbed } from "./eqsage-loader";

export default {
  data() {
    return {
      loadError: "",
      mountAttempt: 0,
      tornDown: false,
      unmount: null,
      startupStage: "Loading EQ Sage shell...",
      startupDetail: "",
      startupUiVisible: false,
      startupTimeout: null,
    }
  },

  computed: {
    showStartupOverlay() {
      return !this.loadError && !this.startupUiVisible
    },
  },

  beforeDestroy() {
    this.tornDown = true
    this.mountAttempt += 1
    window.removeEventListener('resize', this.forceFullViewportHost)
    this.restoreFullViewportHost()
    if (this.startupTimeout) {
      window.clearTimeout(this.startupTimeout)
      this.startupTimeout = null
    }
    this.teardownSage()
  },

  methods: {
    getSpireBridge() {
      return {
        SpireApi,
        SpireApiTypes,
        SpireQueryBuilder,
        Grid,
        Zones,
        Spawn,
        Npcs,
      }
    },

    teardownSage() {
      if (this.unmount) {
        this.unmount()
        this.unmount = null
      }
      Navbar.expand()
    },

    handleSageStage(state) {
      if (!state) {
        return
      }

      const stageLabels = {
        "embed:mount": "Starting EQ Sage...",
        "embed:config": "Loading Sage configuration...",
        "embed:loading": "Loading EQ Sage shell...",
        "embed:imports": "Loading EQ Sage modules...",
        "embed:render": "Rendering EQ Sage...",
        "embed:painted": "Waiting for startup UI...",
        "embed:mounted": "EQ Sage mounted.",
        "boot:blank": "Waiting for startup UI...",
        "boot:status-dialog": "Waiting for EverQuest directory access",
        "boot:zone-dialog": "Waiting for zone selection",
        "boot:controller-loading": "Loading viewer controller",
        "boot:zone-active": "Launching zone editor",
      }

      this.startupStage = stageLabels[state.stage] || state.detail || this.startupStage
      this.startupDetail = state.detail || ""

      if (state.uiVisible) {
        this.startupUiVisible = true
        if (this.startupTimeout) {
          window.clearTimeout(this.startupTimeout)
          this.startupTimeout = null
        }
      }
    },

    forceFullViewportHost() {
      document.documentElement.classList.add('sage-fullscreen-route')
      document.body.classList.add('sage-fullscreen-route')

      for (const element of [
        document.documentElement,
        document.body,
        document.getElementById('app'),
        document.getElementById('app')?.firstElementChild,
      ]) {
        if (!element) {
          continue
        }
        element.style.setProperty('zoom', '1', 'important')
        element.style.setProperty('transform', 'none', 'important')
        element.style.setProperty('transform-origin', '0 0', 'important')
        element.style.setProperty('width', '100vw', 'important')
        element.style.setProperty('height', '100vh', 'important')
        element.style.setProperty('max-width', 'none', 'important')
        element.style.setProperty('max-height', 'none', 'important')
        element.style.setProperty('overflow', 'hidden', 'important')
      }
    },

    restoreFullViewportHost() {
      document.documentElement.classList.remove('sage-fullscreen-route')
      document.body.classList.remove('sage-fullscreen-route')

      for (const element of [
        document.documentElement,
        document.body,
        document.getElementById('app'),
        document.getElementById('app')?.firstElementChild,
      ]) {
        if (!element) {
          continue
        }
        element.style.removeProperty('zoom')
        element.style.removeProperty('transform')
        element.style.removeProperty('transform-origin')
        element.style.removeProperty('width')
        element.style.removeProperty('height')
        element.style.removeProperty('max-width')
        element.style.removeProperty('max-height')
        element.style.removeProperty('overflow')
      }
    },
  },

  async mounted() {
    const mountAttempt = ++this.mountAttempt
    this.forceFullViewportHost()
    window.addEventListener('resize', this.forceFullViewportHost)
    window.requestAnimationFrame(() => this.forceFullViewportHost())
    Navbar.collapse()
    this.startupStage = "Loading EQ Sage shell..."
    this.startupDetail = "Fetching embed bundle and startup state."
    this.startupUiVisible = false
    this.startupTimeout = window.setTimeout(() => {
      if (!this.tornDown && !this.startupUiVisible && !this.loadError) {
        this.startupStage = "Sage startup is taking longer than expected"
        this.startupDetail = "Waiting for the startup UI to become interactive."
      }
    }, 8000)

    try {
      this.startupStage = "Loading Sage loader..."
      this.startupDetail = "Resolving the embedded zone editor module."
      const { mountSpireZoneEditor, unmountSpireZoneEditor } = await loadEqSageEmbed()
      if (this.tornDown || mountAttempt !== this.mountAttempt) {
        return
      }

      const container = this.$refs["sage-root"]
      if (!(container instanceof HTMLElement)) {
        return
      }

      this.startupStage = "Mounting EQ Sage..."
      this.startupDetail = "Creating the embedded zone editor shell."
      await mountSpireZoneEditor(container, {
        spireBridge: this.getSpireBridge(),
        onStageChange: this.handleSageStage,
      })
      if (this.tornDown || mountAttempt !== this.mountAttempt) {
        unmountSpireZoneEditor(container)
        return
      }

      this.unmount = () => {
        unmountSpireZoneEditor(container)
      }
    } catch (error) {
      if (this.tornDown || mountAttempt !== this.mountAttempt) {
        return
      }
      console.error("Failed to mount EQ Sage embed", error)
      this.loadError = "Unable to load the EQ Sage zone editor bundle."
      this.startupUiVisible = false
      this.startupStage = "Failed to load EQ Sage"
      this.startupDetail = error?.message || "The embedded zone editor failed to initialize."
      Navbar.expand()
    }
  },
}
</script>

<style>
.sage-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  margin: 0;
  overflow: hidden;
  transform: none !important;
  zoom: 1 !important;
  z-index: 2000;
  background: #000;
}

.sage-root {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  overflow: hidden;
  transform: none !important;
  zoom: 1 !important;
}

.sage-root > * {
  width: 100vw !important;
  height: 100vh !important;
  min-width: 100vw !important;
  min-height: 100vh !important;
}

html.sage-fullscreen-route,
body.sage-fullscreen-route {
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  overflow: hidden !important;
  transform: none !important;
  zoom: 1 !important;
}

body.sage-fullscreen-route .main-content,
body.sage-fullscreen-route .main-content > .content-area,
body.sage-fullscreen-route .main-content > .content-area > .panel-body,
body.sage-fullscreen-route .main-content > .content-area > .panel-body > .panel,
body.sage-fullscreen-route .main-content > .content-area > .panel-body > .panel > .row,
body.sage-fullscreen-route .main-content > .content-area > .panel-body > .panel > .row > .col-12,
body.sage-fullscreen-route #app,
body.sage-fullscreen-route #app > div {
  width: 100vw !important;
  max-width: none !important;
  height: 100vh !important;
  min-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  transform: none !important;
  zoom: 1 !important;
}

body.sage-fullscreen-route .dashboard-footer,
body.sage-fullscreen-route footer,
body.sage-fullscreen-route .btn-to-top {
  display: none !important;
}

.sage-startup-overlay {
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding: 24px;
}

.sage-startup-card {
  min-width: 320px;
  max-width: 520px;
  padding: 24px;
  border: 1px solid rgba(221, 208, 160, 0.7);
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(17, 24, 34, 0.98), rgba(9, 13, 19, 0.98));
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
  color: #e8dcc0;
  text-align: center;
}

.sage-startup-title {
  font-size: 24px;
  margin-bottom: 8px;
}

.sage-startup-stage {
  font-size: 16px;
}

.sage-startup-detail {
  margin-top: 12px;
  font-size: 14px;
  color: rgba(232, 220, 192, 0.78);
}

.sage-error {
  color: #f8d7da;
  background: rgba(55, 10, 10, 0.9);
  border: 1px solid rgba(248, 215, 218, 0.4);
  margin: 24px;
  padding: 16px;
}
</style>
