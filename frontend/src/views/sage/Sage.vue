<template>
  <div class="sage-container">
    <div ref="sage-root" class="sage-root"></div>
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
    }
  },

  beforeDestroy() {
    this.tornDown = true
    this.mountAttempt += 1
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
  },

  async mounted() {
    const mountAttempt = ++this.mountAttempt

    console.log("[SageVue]", "mounted:start", { mountAttempt })
    Navbar.collapse()

    try {
      console.log("[SageVue]", "load:start")
      const { mountSpireZoneEditor, unmountSpireZoneEditor } = await loadEqSageEmbed()
      console.log("[SageVue]", "load:done", {
        hasMount  : typeof mountSpireZoneEditor === "function",
        hasUnmount: typeof unmountSpireZoneEditor === "function",
      })
      if (this.tornDown || mountAttempt !== this.mountAttempt) {
        console.log("[SageVue]", "mount:aborted-before-container", {
          tornDown: this.tornDown,
          mountAttempt,
          currentAttempt: this.mountAttempt,
        })
        return
      }

      const container = this.$refs["sage-root"]
      console.log("[SageVue]", "container:resolved", {
        type         : typeof container,
        isHTMLElement: container instanceof HTMLElement,
      })
      if (!(container instanceof HTMLElement)) {
        return
      }

      console.log("[SageVue]", "mount:call:start")
      await mountSpireZoneEditor(container, {
        spireBridge: this.getSpireBridge(),
      })
      console.log("[SageVue]", "mount:call:done")
      if (this.tornDown || mountAttempt !== this.mountAttempt) {
        console.log("[SageVue]", "mount:aborted-after-mount", {
          tornDown: this.tornDown,
          mountAttempt,
          currentAttempt: this.mountAttempt,
        })
        unmountSpireZoneEditor(container)
        return
      }

      this.unmount = () => {
        unmountSpireZoneEditor(container)
      }
    } catch (error) {
      console.error("[SageVue]", "mount:error", error)
      if (this.tornDown || mountAttempt !== this.mountAttempt) {
        return
      }
      console.error("Failed to mount EQ Sage embed", error)
      this.loadError = "Unable to load the EQ Sage zone editor bundle."
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
}

.sage-root {
  width: 100%;
  height: 100%;
  min-height: 100vh;
}

.sage-error {
  color: #f8d7da;
  background: rgba(55, 10, 10, 0.9);
  border: 1px solid rgba(248, 215, 218, 0.4);
  margin: 24px;
  padding: 16px;
}
</style>
