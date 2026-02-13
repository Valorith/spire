<template>
  <div class="spells-sub-editor" style="display: flex; flex-direction: column; height: 85vh;">
    <eq-window title="NPC Spells" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
      <!-- Current Spell List Info -->
      <div v-if="currentSpellList" class="mb-2 p-2" style="background: rgba(0,0,0,0.3); border-radius: 4px; flex-shrink: 0;">
        <div class="text-warning font-weight-bold mb-1">
          <i class="fa fa-magic mr-1"></i> {{ currentSpellList.name || 'Spell List #' + currentSpellList.id }}
        </div>
        <div class="small" v-if="currentSpellList.parent_list">
          <span class="text-muted">Parent List:</span>
          <a :href="'#/npc-spells/' + currentSpellList.parent_list" class="text-info">{{ currentSpellList.parent_list }}</a>
        </div>
      </div>

      <!-- Spell Entries -->
      <div v-if="spellEntries.length > 0" class="mb-2" style="flex: 1; overflow-y: auto; min-height: 0;">
        <table class="eq-table eq-highlight-rows w-100" style="font-size: 13px;">
          <thead class="eq-table-floating-header">
            <tr>
              <th>Spell</th>
              <th class="text-center" style="width:60px;">Type</th>
              <th class="text-center" style="width:60px;">Priority</th>
              <th class="text-center" style="width:80px;">Level Range</th>
              <th class="text-center" style="width:60px;">Recast</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, i) in spellEntries" :key="i">
              <td>
                <a :href="'#/spell/' + entry.spellid" class="text-light">
                  {{ spellNames[entry.spellid] || 'Spell #' + entry.spellid }}
                </a>
              </td>
              <td class="text-center">{{ spellTypeLabel(entry.type) }}</td>
              <td class="text-center">{{ entry.priority }}</td>
              <td class="text-center">{{ entry.minlevel }}-{{ entry.maxlevel }}</td>
              <td class="text-center">{{ entry.recast_delay }}s</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!loading && !currentSpellList" class="text-center text-muted py-4" style="flex: 1;">
        <i class="fa fa-magic fa-2x mb-2 d-block"></i>
        No spell list assigned to this NPC.<br>Use the search below to assign one.
      </div>

      <div v-else-if="loading" class="text-center py-4" style="flex: 1;">
        <i class="fa fa-spinner fa-spin"></i> Loading spell data...
      </div>

      <!-- Search -->
      <div style="flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-top: 8px;">
        <div class="input-group input-group-sm mb-2">
          <input type="text" class="form-control" placeholder="Search spell lists by name or ID..." v-model="searchQuery" @input="debounceSearch">
          <div class="input-group-append">
            <button class="btn btn-outline-warning" @click="doSearch" :disabled="!searchQuery"><i class="fa fa-search"></i></button>
          </div>
        </div>
        <div v-if="searchResults.length > 0" style="max-height: 25vh; overflow-y: auto;">
          <table class="eq-table eq-highlight-rows w-100" style="font-size: 13px;">
            <thead><tr><th style="width:60px;">ID</th><th>Name</th><th style="width:70px;"></th></tr></thead>
            <tbody>
              <tr v-for="s in searchResults" :key="s.id">
                <td>{{ s.id }}</td>
                <td>{{ s.name }}</td>
                <td><button class="btn btn-xs btn-outline-success" @click="selectSpellList(s)">Select</button></td>
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
import {NpcSpellApi} from "../../app/api/api/npc-spell-api";
import {NpcSpellsEntryApi} from "../../app/api/api/npc-spells-entry-api";
import {SpireQueryBuilder} from "../../app/api/spire-query-builder";

export default {
  name: "SpellsSubEditor",
  components: { EqWindow },
  props: { spellsId: { type: [Number, String], default: 0 } },
  data() {
    return { currentSpellList: null, spellEntries: [], spellNames: {}, loading: false, searchQuery: "", searchResults: [], searchTimeout: null };
  },
  watch: {
    spellsId: {
      immediate: true,
      handler(val) {
        const id = parseInt(val);
        if (id > 0) { this.loadSpellList(id); } else { this.currentSpellList = null; this.spellEntries = []; }
      }
    }
  },
  methods: {
    async loadSpellList(id) {
      this.loading = true;
      try {
        const api = new NpcSpellApi(...SpireApi.cfg());
        const res = await api.getNpcSpell({ id });
        this.currentSpellList = res.data;
        const entryApi = new NpcSpellsEntryApi(...SpireApi.cfg());
        const b = new SpireQueryBuilder(); b.where("npc_spells_id", "=", id); b.includes(["Spells_new"]);
        const entryRes = await entryApi.listNpcSpellsEntries(b.get());
        this.spellEntries = entryRes.data || [];
        for (const e of this.spellEntries) {
          if (e.spells_new) { this.$set(this.spellNames, e.spellid, e.spells_new.name); }
          else { this.$set(this.spellNames, e.spellid, 'Spell #' + e.spellid); }
        }
      } catch(e) { this.currentSpellList = null; this.spellEntries = []; }
      this.loading = false;
    },
    spellTypeLabel(type) {
      const labels = { 0: 'Nuke', 1: 'Heal', 2: 'Buff', 3: 'Escape', 4: 'Pet', 5: 'Lifetap', 6: 'Snare', 7: 'DOT', 8: 'Dispel', 9: 'Debuff' };
      return labels[type] || type;
    },
    debounceSearch() { clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => this.doSearch(), 400); },
    async doSearch() {
      if (!this.searchQuery.trim()) { this.searchResults = []; return; }
      try {
        const api = new NpcSpellApi(...SpireApi.cfg());
        const b = new SpireQueryBuilder();
        if (isNaN(this.searchQuery)) { b.where("name", "like", "%" + this.searchQuery + "%"); } else { b.where("id", "=", parseInt(this.searchQuery)); }
        b.limit(20);
        const res = await api.listNpcSpells(b.get());
        this.searchResults = res.data || [];
      } catch(e) { this.searchResults = []; }
    },
    selectSpellList(s) { this.$emit("input", s.id); this.searchResults = []; this.searchQuery = ""; }
  }
};
</script>
