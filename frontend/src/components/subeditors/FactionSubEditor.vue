<template>
  <div class="faction-sub-editor" style="display: flex; flex-direction: column; height: 85vh;">
    <eq-window title="NPC Faction" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
      <!-- Current Faction Info -->
      <div v-if="currentFaction" class="mb-2 p-2" style="background: rgba(0,0,0,0.3); border-radius: 4px; flex-shrink: 0;">
        <div class="text-warning font-weight-bold mb-1">
          <i class="fa fa-flag mr-1"></i> {{ currentFaction.name || 'Faction #' + currentFaction.id }}
        </div>
        <div class="small">
          <span class="text-muted">Primary Faction:</span> {{ currentFaction.primaryfaction || 'None' }}
          <span class="ml-3 text-muted">Ignore Primary Assist:</span> {{ currentFaction.ignore_primary_assist ? 'Yes' : 'No' }}
        </div>
      </div>

      <!-- Faction Entries -->
      <div v-if="entries.length > 0" class="mb-2" style="flex: 1; overflow-y: auto; min-height: 0;">
        <table class="eq-table eq-highlight-rows w-100" style="font-size: 13px;">
          <thead class="eq-table-floating-header">
            <tr>
              <th>Faction ID</th>
              <th>Name</th>
              <th class="text-center">Value</th>
              <th class="text-center">NPC Value</th>
              <th class="text-center">Temp</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, i) in entries" :key="i">
              <td>{{ entry.faction_id }}</td>
              <td>{{ factionNames[entry.faction_id] || '...' }}</td>
              <td class="text-center" :style="entry.value > 0 ? 'color: #44cc44;' : entry.value < 0 ? 'color: #ff4444;' : ''">
                {{ entry.value }}
                <small v-if="entry.value > 0" class="ml-1">(Ally)</small>
                <small v-else-if="entry.value < 0" class="ml-1">(Hostile)</small>
              </td>
              <td class="text-center">{{ entry.npc_value }}</td>
              <td class="text-center">{{ entry.temp }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!loading && !currentFaction" class="text-center text-muted py-4" style="flex: 1;">
        <i class="fa fa-flag fa-2x mb-2 d-block"></i>
        No faction assigned to this NPC.<br>Use the search below to assign one.
      </div>

      <div v-else-if="loading" class="text-center py-4" style="flex: 1;">
        <i class="fa fa-spinner fa-spin"></i> Loading faction data...
      </div>

      <!-- Search -->
      <div style="flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-top: 8px;">
        <div class="input-group input-group-sm mb-2">
          <input type="text" class="form-control" placeholder="Search factions by name or ID..." v-model="searchQuery" @input="debounceSearch">
          <div class="input-group-append">
            <button class="btn btn-outline-warning" @click="doSearch" :disabled="!searchQuery"><i class="fa fa-search"></i></button>
          </div>
        </div>
        <div v-if="searchResults.length > 0" style="max-height: 25vh; overflow-y: auto;">
          <table class="eq-table eq-highlight-rows w-100" style="font-size: 13px;">
            <thead><tr><th style="width:60px;">ID</th><th>Name</th><th style="width:70px;"></th></tr></thead>
            <tbody>
              <tr v-for="f in searchResults" :key="f.id">
                <td>{{ f.id }}</td>
                <td>{{ f.name }}</td>
                <td><button class="btn btn-xs btn-outline-success" @click="selectFaction(f)">Select</button></td>
              </tr>
            </tbody>
          </table>
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
        // Resolve faction names
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
