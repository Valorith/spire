<template>
  <div>
    <ninja-keys
      class="dark ninja-icon"
      ref="ninjaKeys"
      placeholder="Where would you like to go?"
    />
    <keypress-commands-modal/>
    <router-view></router-view>
    <app-update-modal
      v-if="showUpdateModal && !isSageRoute"
      :release="release"
      :status="updateStatus"
      :checking="updateChecking"
      :status-error="updateError"
      :update-channel="currentUpdateChannel"
      :installed-release-type="AppEnv.isBetaRelease() ? 'Beta' : 'Stable'"
      @close="showUpdateModal = false"
      @ignore="ignoreUpdate"
      @retry="checkForSpireUpdate(true)"
      :current-version="currentVersion"
    />
  </div>
</template>

<script>

import "ninja-keys";
import * as util from "util";
import {App} from "@/constants/app";
import {EventBus} from "@/app/event-bus/event-bus";
import {AppEnv} from "@/app/env/app-env";
import {LocalSettings, Setting} from "@/app/local-settings/localsettings";
import {ROUTE} from "@/routes";
import UserContext from "@/app/user/UserContext";
import KeypressCommandsModal from "@/components/modals/KeypressCommandsModal.vue";
import semver from "semver";
import AppUpdateModal from "@/components/modals/AppUpdateModal.vue";
import {SpireWebsocket} from "@/app/api/spire-websocket";
import {Notify} from "@/app/Notify";
import {WindowManager} from "@/app/window";
import {SpireApi} from "@/app/api/spire-api";

export default {
  name: "App",
  components: {AppUpdateModal, KeypressCommandsModal},
  async beforeMount() {
    await AppEnv.init()
  },

  data() {
    return {
      release: {},
      updateStatus: {},
      currentVersion: "",
      updateChecking: false,
      updateError: "",
      updateChannelSaving: false,
      user: null,
      showUpdateModal: false,
    }
  },

  computed: {
    isSageRoute() {
      return this.isCurrentSageRoute()
    },
    currentUpdateChannel() {
      return this.updateStatus?.channel || AppEnv.getUpdateChannel()
    },
    AppEnv() {
      return AppEnv
    },
  },

  watch: {
    $route() {
      this.applyResponsiveZoom()
    },
  },

  async mounted() {
    this.applyResponsiveZoom()
    window.addEventListener('resize', this.applyResponsiveZoom)

    WindowManager.hookListeners();

    this.loadCssFiles();
    this.loadKeypressBindings();
    this.loadWallpaper();
    this.loadSpellIconSettings();

    if (typeof AppEnv.getOS() === "undefined") {
      await AppEnv.init()
    }

    EventBus.$emit('APP_ENV_LOADED', true);

    this.$router.onReady(async () => {
      if (!this.$route.fullPath.includes(ROUTE.LOGIN)) {
        console.log("login route, skipping auth check")
        this.user = await UserContext.getUser()
        await this.checkIfUserNeedsToAuth()
      }

      AppEnv.routeCheckSpireInitialized(this.$route, this.$router)
    })

    setTimeout(() => {
      AppEnv.routeCheckSpireInitialized(this.$route, this.$router)
    }, 1)

    this.checkForSpireUpdate()
  },

  created() {
    SpireWebsocket.connect()
    EventBus.$on("SPELL_LEGACY_ICONS_ENABLED", this.loadSpellIconSettings);
    EventBus.$on("CHECK_SPIRE_UPDATE", this.checkSpireUpdate);
    EventBus.$on("APP_UPDATE_CHANNEL_CHANGE_REQUESTED", this.changeUpdateChannel);
    SpireWebsocket.addEventListener('message', this.handleWebsocketMessage);
  },
  destroyed() {
    window.removeEventListener('resize', this.applyResponsiveZoom)
    EventBus.$off("SPELL_LEGACY_ICONS_ENABLED", this.loadSpellIconSettings);
    EventBus.$off("CHECK_SPIRE_UPDATE", this.checkSpireUpdate);
    EventBus.$off("APP_UPDATE_CHANNEL_CHANGE_REQUESTED", this.changeUpdateChannel);
    SpireWebsocket.removeEventListener('message', this.handleWebsocketMessage);
  },

  methods: {

    applyResponsiveZoom() {
      const isSageRoute = this.isCurrentSageRoute()
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
      const shouldScaleBody = !isSageRoute && vw < 1500 && vw > 1000

      document.documentElement.classList.toggle('sage-fullscreen-route', isSageRoute)
      document.body.classList.toggle('sage-fullscreen-route', isSageRoute)

      if (isSageRoute) {
        WindowManager.applyZoom(1)
        for (const element of [
          document.documentElement,
          document.body,
          document.getElementById('app'),
        ]) {
          if (!element) {
            continue
          }
          element.style.setProperty('zoom', '1', 'important')
          element.style.setProperty('transform', 'none', 'important')
          element.style.setProperty('transform-origin', '0 0', 'important')
          element.style.setProperty('overflow', 'hidden', 'important')
          element.style.setProperty('width', '100vw', 'important')
          element.style.setProperty('height', '100vh', 'important')
          element.style.setProperty('max-width', 'none', 'important')
          element.style.setProperty('max-height', 'none', 'important')
        }
        return
      }

      for (const element of [
        document.documentElement,
        document.body,
        document.getElementById('app'),
      ]) {
        if (!element) {
          continue
        }
        element.style.removeProperty('zoom')
        element.style.removeProperty('transform')
        element.style.removeProperty('transform-origin')
        element.style.removeProperty('overflow')
        element.style.removeProperty('width')
        element.style.removeProperty('height')
        element.style.removeProperty('max-width')
        element.style.removeProperty('max-height')
      }
      WindowManager.applyZoom(shouldScaleBody ? .8 : 1)
    },

    isCurrentSageRoute() {
      const routePath = this.$route?.path || window.location.pathname || ''
      return routePath.startsWith(ROUTE.SAGE)
    },

    async checkIfUserNeedsToAuth() {
      if (AppEnv.isSpireInitialized() &&
        AppEnv.isLocalAuthEnabled() &&
        UserContext.getAccessToken().length === 0 &&
        this.$route.fullPath !== ROUTE.LOGIN) {
        await this.$router.push(ROUTE.LOGIN).catch((e) => {
        })
      }
    },

    loadKeypressBindings() {
      let controlPressed = false;

      document.onkeydown = (e) => {
        const tagName = e.srcElement.tagName

        e = e || window.event; //Get event
        if (!e.ctrlKey && e.key !== "Control") return;
        let code = e.which || e.keyCode; //Get key code

        // if we only press the control key, reject further action if we are inside
        // things like inputs
        if (!["BODY", "A", "NINJA-KEYS", "DIV"].includes(tagName) && code === 17) {
          return
        }

        // if command is accompanied by another key, dismiss commands modal
        if (code !== 17) {
          this.$bvModal.hide('keypress-commands-modal')
        }

        switch (code) {
          case 17: // just command
            if (controlPressed) {
              this.$bvModal.hide('keypress-commands-modal')
              return
            }

            // don't show modal help window if search box is open
            const n = document.querySelector('ninja-keys');
            if (n.visible) {
              break;
            }
            // this.$bvModal.show('keypress-commands-modal');
            break;
          case 191: // Ctrl + /
          case 75: // Ctrl + K
            e.preventDefault();

            const ninja = document.querySelector('ninja-keys');
            setTimeout(() => {
              ninja.open()
            }, 1)

            e.stopPropagation();

            break;
          case 87://Block Ctrl+W
          case 83://Block Ctrl+S
            e.preventDefault();
            // e.stopPropagation();
            break;
        }

        controlPressed = true;
      };

      document.onkeyup = (e) => {
        e = e || window.event; //Get event
        if (!e.ctrlKey && e.key !== "Control") return;
        let code = e.which || e.keyCode; //Get key code

        setTimeout(() => {
          if (document.getElementById('keypress-commands-modal')) {
            this.$bvModal.hide('keypress-commands-modal')
          }
          controlPressed = false;
        }, 1)
      };

      window.onblur = () => {
        this.$bvModal.hide('keypress-commands-modal')
      }
      window.onfocus = () => {
        this.$bvModal.hide('keypress-commands-modal')
      }

      window.onkeyup = (e) => {
        e = e || window.event; //Get event
        if (!e.ctrlKey && e.key !== "Control") return;

        this.$bvModal.hide('keypress-commands-modal')
      };

      window.addEventListener("keypress", (e) => {
        if (e.srcElement.tagName !== "BODY" && e.srcElement.tagName !== "A") {
          return
        }

        if (window.location.pathname === "/login") {
          return
        }

        switch (String.fromCharCode(e.keyCode)) {
          case 'h':
            EventBus.$emit('HIDE_NAVBAR', true);
            break
          case 'b':
            this.$router.push({path: '/break'})
            break
          case '`':
            this.$router.push({path: '/'})
            break
          case 'd':
            setTimeout(() => {
              LocalSettings.set(Setting.DEBUG_MODE, !LocalSettings.isDebugEnabled())
              App.DEBUG = !LocalSettings.isDebugEnabled()
              EventBus.$emit('DEBUG_UPDATED', true);
            }, 100)
            break
        }
      })
    },

    loadWallpaper() {
      const backgrounds = [
        "faydark.png",
        "freeport.png",
        "lavastorm.png",
        "rivervale.png",
        "oasis.png",
        "sebilis.png",
        "qeynos.png",
        "soldungb.png",
        "spire-wall.jpg",
        "qeynos-wallpaper.png",
        "firiona-fan-blondy-nkitezgraja.jpeg",
      ]

      const background = util.format("%s%s",
        App.ASSET_WALLPAPER_URL,
        backgrounds[Math.floor(Math.random() * backgrounds.length)].trim()
      )

      let curImg = new Image();
      curImg.src = background;
      curImg.onload = function () {
        // do whatever here, add it to the background, append the image ect.
        document.body.style.setProperty("--image", "url(" + background + ")");
      }
    },

    loadSpellIconSettings() {
      for (let i of [12, 20, 30, 40]) {
        let e = document.getElementById("spell-icons-" + i)
        e.setAttribute('href', '/eq-asset-preview-master/assets/sprites/spell-icons-' + i + '.css')
        if (e && App.SPELL_LEGACY_ICONS_ENABLED) {
          e.setAttribute('href', '/eq-asset-preview-master/assets/sprites/spell-icons-legacy-' + i + '.css')
        }
      }
    },

    checkSpireUpdate() {
      this.checkForSpireUpdate(true)
    },

    async checkForSpireUpdate(force = false, suppressModal = false) {
      if (!AppEnv.isAppLocal()) {
        console.log("skipping update check, not local app")
        return
      }

      const current = AppEnv.getVersion()
      this.currentVersion = current
      const last_checked = LocalSettings.getLastCheckedUpdateTime()
      const updateChannel = AppEnv.getUpdateChannel()
      const lastCheckedChannel = LocalSettings.getLastCheckedUpdateChannel()
      const now = new Date().getTime() / 1000

      if (force && !suppressModal) {
        this.showUpdateModal = true
      }

      // check if we've checked in the last 1 hour
      if (now - last_checked < 3600 && lastCheckedChannel === updateChannel && !force) {
        console.log("skipping update check, checked in last hour")
        try {
          this.release = JSON.parse(LocalSettings.getLatestReleasePayload() || "{}")
        } catch (e) {
          this.release = {}
        }
        const cachedVersion = this.release?.tag_name?.replace(/^v/, "") || ""
        const available = !!cachedVersion && semver.valid(cachedVersion) && semver.gt(cachedVersion, current)
        this.updateStatus = {
          channel: updateChannel,
          current_version: current,
          available,
          release: available ? this.release : null,
        }
        EventBus.$emit("APP_UPDATE_CHANNEL_CHANGED", updateChannel)
        return
      }

      this.updateChecking = true
      this.updateError = ""
      this.updateStatus = {
        channel: updateChannel,
        current_version: current,
        available: false,
      }
      this.release = {}
      try {
        const response = await SpireApi.v1().get("app/update-status")
        const status = response?.data?.data || {}
        const channel = status.channel === "beta" ? "beta" : "stable"
        AppEnv.setUpdateChannel(channel)
        this.updateStatus = status
        this.release = status.release || {}

        const latest = status.release?.tag_name?.replace(/^v/, "") || current
        const ignoredUpdateVersion = LocalSettings.getIgnoredUpdateVersion()
        if (status.available && ignoredUpdateVersion !== latest) {
          console.log("update available")
          if (!suppressModal) {
            this.showUpdateModal = true
          }
        } else if (status.available) {
          console.log("update [%s] ignored", latest)
        } else if (force) {
          Notify.toast(`Already up to date on the ${channel === "beta" ? "Beta" : "Stable"} channel.`)
        }

        LocalSettings.setLastCheckedUpdateTime(new Date().getTime() / 1000)
        LocalSettings.setLastCheckedUpdateChannel(channel)
        LocalSettings.setLatestUpdateVersion(latest)
        LocalSettings.setLatestReleasePayload(JSON.stringify(this.release))
        this.currentVersion = status.current_version || current
        EventBus.$emit("APP_UPDATE_CHANNEL_CHANGED", channel)
      } catch (err) {
        console.warn("skipping update check", err)
        this.updateError = err.response?.data?.error || "GitHub release metadata is unavailable. No update will be installed."
      } finally {
        this.updateChecking = false
      }
    },
    async changeUpdateChannel(channel) {
      const normalized = channel === "beta" ? "beta" : "stable"
      if (normalized === AppEnv.getUpdateChannel()) {
        EventBus.$emit("APP_UPDATE_CHANNEL_CHANGED", normalized)
        return
      }

      this.updateChannelSaving = true
      this.updateError = ""
      try {
        await SpireApi.v1().post("app/update-channel", {channel: normalized})
        AppEnv.setUpdateChannel(normalized)
        LocalSettings.clearUpdateVariables()
        this.updateStatus = {channel: normalized}
        this.release = {}
        EventBus.$emit("APP_UPDATE_CHANNEL_CHANGED", normalized)
        await this.checkForSpireUpdate(true, true)
      } catch (err) {
        this.updateError = err.response?.data?.error || "Could not save the Spire update channel."
        EventBus.$emit("APP_UPDATE_CHANNEL_CHANGE_FAILED", {
          channel: AppEnv.getUpdateChannel(),
          error: this.updateError,
        })
      } finally {
        this.updateChannelSaving = false
      }
    },
    ignoreUpdate() {
      const version = this.release?.tag_name?.replace(/^v/, "")
      if (version) {
        LocalSettings.setIgnoredUpdateVersion(version)
      }
      this.showUpdateModal = false
    },
    handleWebsocketMessage(e) {
      if (e && e.data) {
        const data = JSON.parse(e.data)
        if (data.type === "notification") {
          Notify.toast(data.message);
        }
      }
    },
    loadCssFiles() {
      const cssFiles = [
        {href: "item-icons.css"},
        {href: "item-icons-sm.css"},
        {href: "objects.css"},
        {href: "race-models-sm.css"},
        {href: "race-models.css"},
        {href: "faces.css"},
        {href: "client-versions.css"},
        {href: "client-versions-med.css"},
        {href: "client-versions-sm.css"},
        {href: "spell-icons-12.css", id: "spell-icons-12"},
        {href: "spell-icons-20.css", id: "spell-icons-20"},
        {href: "spell-icons-30.css", id: "spell-icons-30"},
        {href: "spell-icons-40.css", id: "spell-icons-40"},
      ];

      cssFiles.forEach(file => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `/eq-asset-preview-master/assets/sprites/${file.href}`;

        if (file.id) {
          link.id = file.id; // Add the id attribute if it exists
        }

        document.head.appendChild(link);
      });
    }
  },
}
</script>

<style lang="scss">

.card-slim {
  padding: 18px !important;
}

/*akkadius:experimental*/
body {
  /* background-repeat: no-repeat; */
  background: -webkit-radial-gradient(circle, transparent 40%, var(--color-v) 95%), linear-gradient(to right, var(--color), var(--color)), var(--image) !important;
  background: radial-gradient(circle, transparent 40%, var(--color-v) 95%), linear-gradient(to right, var(--color), var(--color)), var(--image);

  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-blend-mode: normal, saturation, normal;
  /*--image:               url(~@/assets/img/eq-wallpaper-1.jpg);*/
  --color-v: black;
  --color: grey;
}


</style>
