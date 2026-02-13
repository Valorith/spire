<template>
  <div class="faction-sub-editor" style="display: flex; flex-direction: column; height: 85vh;">
    <eq-window style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">

      <!-- Header -->
      <div style="flex-shrink: 0; padding: 4px 0;">
        <div class="d-flex justify-content-between align-items-center">
          <div style="min-width: 0; flex: 1;">
            <div class="d-flex align-items-center">
              <i class="fa fa-flag text-warning mr-2" style="font-size: 1.2em;"></i>
              <span v-if="currentFaction" class="text-warning font-weight-bold" style="font-size: 1.1em;">
                {{ currentFaction.name || 'Faction #' + currentFaction.id }}
              </span>
              <span v-else class="text-muted" style="font-size: 1.1em;">NPC Faction</span>
            </div>
            <div v-if="currentFaction" class="mt-1">
              <span class="badge badge-dark mr-1" style="font-size: 0.8em;">
                Primary: {{ currentFaction.primaryfaction || 'None' }}
              </span>
              <span class="badge badge-dark mr-1" style="font-size: 0.8em;">
                {{ entries.length }} entr{{ entries.length !== 1 ? 'ies' : 'y' }}
              </span>
              <span v-if="currentFaction.ignore_primary_assist" class="badge badge-warning" style="font-size: 0.8em;">
                Ignores Primary Assist
              </span>
            </div>
          </div>
        </div>
      </div>

      <hr v-if="currentFaction" class="my-2" style="border-color: rgba(255,255,255,0.1);">

      <!-- Faction Entries -->
      <div v-if="entries.length > 0" style="flex: 1; overflow-y: auto; min-height: 0;">
        <div
          v-for="(entry, i) in entries" :key="i"
          class="faction-entry"
          :class="{ 'faction-ally': entry.value > 0, 'faction-hostile': entry.value < 0 }"
        >
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <span class="font-weight-bold">{{ factionNames[entry.faction_id] || '...' }}</span>
              <span class="text-muted ml-1" style="font-size: 0.8em;">#{{ entry.faction_id }}</span>
            </div>
            <div>
              <span
                class="value-pill"
                :class="{ 'value-positive': entry.value > 0, 'value-negative': entry.value < 0 }"
              >
                {{ entry.value > 0 ? '+' : '' }}{{ entry.value }}
                <small class="ml-1">{{ entry.value > 0 ? 'Ally' : entry.value < 0 ? 'Hostile' : 'Neutral' }}</small>
              </span>
            </div>
          </div>
          <div v-if="entry.npc_value || entry.temp" class="mt-1">
            <small class="text-muted">
              <span v-if="entry.npc_value">NPC Value: {{ entry.npc_value }}</span>
              <span v-if="entry.temp" class="ml-2">Temp: {{ entry.temp }}</span>
            </small>
          </div>
        </div>
      </div>

      <div v-else-if="!loading && !currentFaction" class="text-center text-muted py-5" style="flex: 1;">
        <i class="fa fa-flag fa-3x mb-3 d-block" style="opacity: 0.3;"></i>
        <div>No faction assigned to this NPC.</div>
        <small>Use the search below to assign one.</small>
      </div>

      <div v-else-if="loading" class="text-center py-4" style="flex: 1;">
        <i class="fa fa-spinner fa-spin fa-2x text-warning"></i>
        <div class="mt-2 small text-muted">Loading faction data...</div>
      </div>

      <!-- Search -->
      <div class="search-bar" style="flex-shrink: 0;">
        <div class="input-group input-group-sm">
          <div class="input-group-prepend">
            <span class="input-group-text" style="background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15);">
              <i class="fa fa-search text-muted"></i>
            </span>
          </div>
          <input
            type="text" class="form-control"
            placeholder="Search factions by name or ID..."
            v-model="searchQuery" @input="debounceSearch"
            style="background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15); color: white;"
          >
          <div class="input-group-append" v-if="searchQuery">
            <button class="btn btn-outline-secondary btn-sm" @click="searchQuery = ''; searchResults = [];"><i class="fa fa-times"></i></button>
          </div>
        </div>
        <div v-if="searchResults.length > 0" class="mt-2" style="max-height: 20vh; overflow-y: auto;">
          <div
            v-for="f in searchResults" :key="f.id"
            class="search-result-row d-flex align-items-center justify-content-between"
            @click="selectFaction(f)"
          >
            <div>
              <span class="text-muted mr-2" style="font-size: 0.85em;">#{{ f.id }}</span>
              <span>{{ f.name }}</span>
            </div>
            <button class="btn btn-xs btn-outline-success" @click.stop="selectFaction(f)">
              <i class="fa fa-check mr-1"></i> Select
            </button>
          </div>
        </div>
      </div>
    </eq-window>
  </div>
</template>

<script>
import EqWindow from "../eq-ui/EQWindow";
import {SpireApi} from "../../app/api/spire-api";
import {NpcFactionApi} from "../../app/api/api/npc-faction-api";
import {NpcFactionEntryApi} from "../../app/api/api/npc-faction-entry-api";
import {FactionListApi} from "../../app/api/api/faction-list-api";
import {SpireQueryBuilder} from "../../app/api/spire-query-builder";

export default {
  name: "FactionSubEditor",
  components: { EqWindow },
  props: { factionId: { type: [Number, String], default: 0 } },
  data() {
    return { currentFaction: null, entries: [], factionNames: {}, loading: false, searchQuery: "", searchResults: [], searchTimeout: null };
  },
  watch: {
    factionId: {
      immediate: true,
      handler(val) {
        const id = parseInt(val);
        if (id > 0) { this.loadFaction(id); } else { this.currentFaction = null; this.entries = []; }
      }
    }
  },
  methods: {
    async loadFaction(id) {
      this.loading = true;
      try {
        const api = new NpcFactionApi(...SpireApi.cfg());
        const res = await api.getNpcFaction({ id });
        this.currentFaction = res.data;
        const entryApi = new NpcFactionEntryApi(...SpireApi.cfg());
        const b = new SpireQueryBuilder(); b.where("npc_faction_id", "=", id);
        const entryRes = await entryApi.listNpcFactionEntries(b.get());
        this.entries = entryRes.data || [];
        for (const e of this.entries) {
          if (!this.factionNames[e.faction_id]) {
            try {
              const flApi = new FactionListApi(...SpireApi.cfg());
              const flRes = await flApi.getFactionList({ id: e.faction_id });
              this.$set(this.factionNames, e.faction_id, flRes.data ? flRes.data.name : 'Unknown');
            } catch(err) { this.$set(this.factionNames, e.faction_id, 'Unknown'); }
          }
        }
      } catch(e) { this.currentFaction = null; this.entries = []; }
      this.loading = false;
    },
    debounceSearch() { clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => this.doSearch(), 400); },
    async doSearch() {
      if (!this.searchQuery.trim()) { this.searchResults = []; return; }
      try {
        const api = new NpcFactionApi(...SpireApi.cfg());
        const b = new SpireQueryBuilder();
        if (isNaN(this.searchQuery)) { b.where("name", "like", "%" + this.searchQuery + "%"); } else { b.where("id", "=", parseInt(this.searchQuery)); }
        b.limit(20);
        const res = await api.listNpcFactions(b.get());
        this.searchResults = res.data || [];
      } catch(e) { this.searchResults = []; }
    },
    selectFaction(f) { this.$emit("input", f.id); this.searchResults = []; this.searchQuery = ""; }
  }
};
</script>

<style scoped>
.faction-entry {
  padding: 8px 10px;
  border-radius: 4px;
  margin-bottom: 4px;
  border: 1px solid rgba(255,255,255,0.06);
  transition: background 0.15s;
}
.faction-entry:hover {
  background: rgba(255,255,255,0.04);
}
.faction-ally {
  border-left: 3px solid #44cc44;
}
.faction-hostile {
  border-left: 3px solid #ff4444;
}
.value-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.85em;
  font-weight: bold;
}
.value-positive {
  background: rgba(40,167,69,0.15);
  color: #5cff5c;
}
.value-negative {
  background: rgba(220,53,69,0.15);
  color: #ff6b6b;
}
.search-bar {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 10px;
  margin-top: 10px;
}
.search-result-row {
  padding: 6px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.search-result-row:hover {
  background: rgba(255,255,255,0.06);
}
</style>
