<template>
  <div>
    <!-- Panel header (always visible) -->
    <div
      class="d-flex align-items-center justify-content-between p-2"
      style="border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.15);"
    >
      <div class="font-weight-bold" style="color: #f89620;">
        <i class="fa fa-map-marker mr-1"></i>
        Where This NPC Spawns
        <small v-if="loaded" class="ml-2" style="opacity: .5">
          ({{ spawnLocations.length }})
        </small>
      </div>

      <button class="btn btn-xs btn-outline-warning" @click="toggle()">
        <span v-if="expanded"><i class="fa fa-chevron-up mr-1"></i> Collapse</span>
        <span v-else><i class="fa fa-chevron-down mr-1"></i> Expand</span>
      </button>
    </div>

    <b-collapse v-model="expanded">
      <!-- Loading state -->
      <div v-if="loading" class="text-center p-3">
        <i class="fa fa-spinner fa-spin mr-1"></i> Loading spawn data...
      </div>

      <!-- No spawns found -->
      <div v-else-if="loaded && spawnLocations.length === 0" class="text-center p-3" style="opacity: .6">
        <i class="fa fa-info-circle mr-1"></i> This NPC has no spawn locations.
      </div>

      <!-- Spawn locations list -->
      <div v-else class="p-2">
        <div
          v-for="(loc, idx) in spawnLocations"
          :key="idx"
          class="spawn-location-entry mb-2 p-2"
          style="border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(0,0,0,0.2);"
        >
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="font-weight-bold" style="color: #f89620;">
              <i class="fa fa-map mr-1"></i>
              <router-link
                v-if="hasZoneRoute"
                :to="'/zone/' + loc.zone + '?v=' + (loc.version || 0)"
                style="color: inherit; text-decoration: underline;"
              >
                {{ loc.zone }}
              </router-link>
              <span v-else>{{ loc.zone }}</span>
            </span>
            <small style="opacity: .5">spawn2: {{ loc.spawn2Id }}</small>
          </div>

          <div class="small mb-1">
            <span style="opacity: .7">Loc:</span>
            <span class="ml-1">{{ formatCoord(loc.x) }}, {{ formatCoord(loc.y) }}, {{ formatCoord(loc.z) }}</span>
            <span class="ml-2">
              <span style="opacity: .7">Heading:</span>
              <span class="ml-1">{{ formatHeading(loc.heading) }}</span>
            </span>
          </div>

          <div class="small mb-1">
            <span style="opacity: .7">Respawn:</span>
            <span class="ml-1">{{ formatRespawn(loc.respawntime) }}</span>
            <span class="ml-2">
              <span style="opacity: .7">Grid:</span>
              <span class="ml-1">{{ loc.pathgrid || 0 }}</span>
            </span>
          </div>
        </div>

        <div v-if="loaded" class="text-center mt-2 mb-1">
          <small style="opacity: .4">{{ spawnLocations.length }} spawn location{{ spawnLocations.length !== 1 ? 's' : '' }}</small>
        </div>
      </div>
    </b-collapse>
  </div>
</template>

<script>
import { Spawn2Api, SpawnentryApi } from "../../app/api";
import { SpireApi } from "../../app/api/spire-api";
import { SpireQueryBuilder } from "@/app/api/spire-query-builder";

export default {
  name: "NpcSpawnLocations",
  props: {
    npcId: { type: Number, required: true },
  },
  data() {
    return {
      expanded: false,
      loading: false,
      loaded: false,
      spawnLocations: [],
      hasZoneRoute: true,
    };
  },
  watch: {
    npcId() {
      this.expanded = false;
      this.loading = false;
      this.loaded = false;
      this.spawnLocations = [];
    },
  },
  methods: {
    toggle() {
      this.expanded = !this.expanded;
      if (this.expanded && !this.loaded && !this.loading) {
        this.loadSpawns();
      }
    },
    formatCoord(val) {
      return val != null ? parseFloat(val).toFixed(1) : "0.0";
    },
    formatHeading(val) {
      if (val == null) return "0";
      return Math.round(parseFloat(val)).toString();
    },
    formatRespawn(seconds) {
      if (!seconds || seconds <= 0) return "None";
      if (seconds < 60) return seconds + "s";
      if (seconds < 3600) {
        return Math.floor(seconds / 60) + "m" + (seconds % 60 > 0 ? " " + (seconds % 60) + "s" : "");
      }
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return h + "h" + (m > 0 ? " " + m + "m" : "");
    },
    async loadSpawns() {
      this.loading = true;
      this.spawnLocations = [];

      try {
        // spawn2 is linked via: spawn2.spawngroupID -> spawnentry.spawngroupID (filtered by npcID)
        const entryApi = new SpawnentryApi(...SpireApi.cfg());
        const entryBuilder = new SpireQueryBuilder();
        entryBuilder.where("npcID", "=", this.npcId);
        const entryResult = await entryApi.listSpawnentries(entryBuilder.get());

        if (!entryResult.data || entryResult.data.length === 0) {
          this.loaded = true;
          this.loading = false;
          return;
        }

        const spawngroupIds = [...new Set(entryResult.data.map((e) => e.spawngroup_id || e.spawngroupID))].filter((v) => v != null && v !== undefined);
        if (spawngroupIds.length === 0) {
          this.loaded = true;
          this.loading = false;
          return;
        }

        const spawn2Api = new Spawn2Api(...SpireApi.cfg());
        const spawn2Builder = new SpireQueryBuilder();
        for (const sgId of spawngroupIds) {
          spawn2Builder.whereOr("spawngroupID", "=", sgId);
        }
        spawn2Builder.limit(1000);

        const spawn2Result = await spawn2Api.listSpawn2s(spawn2Builder.get());

        const locations = (spawn2Result.data || []).map((s2) => ({
          spawn2Id: s2.id,
          zone: s2.zone || "unknown",
          x: s2.x,
          y: s2.y,
          z: s2.z,
          heading: s2.heading,
          respawntime: s2.respawntime,
          pathgrid: s2.pathgrid || 0,
        }));

        locations.sort((a, b) => {
          const z = a.zone.localeCompare(b.zone);
          if (z !== 0) return z;
          return (a.spawn2Id || 0) - (b.spawn2Id || 0);
        });

        this.spawnLocations = locations;
      } catch (e) {
        console.error("Failed to load NPC spawn locations", e);
      }

      this.loaded = true;
      this.loading = false;
    },
  },
};
</script>
