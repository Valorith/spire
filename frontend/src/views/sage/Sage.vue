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

    Navbar.collapse()

    try {
      const { mountSpireZoneEditor, unmountSpireZoneEditor } = await loadEqSageEmbed()
      if (this.tornDown || mountAttempt !== this.mountAttempt) {
        return
      }

      const container = this.$refs["sage-root"]
      if (!(container instanceof HTMLElement)) {
        return
      }

      await mountSpireZoneEditor(container, {
        spireBridge: this.getSpireBridge(),
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
