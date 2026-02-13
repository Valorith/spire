<template>
  <div class="spells-sub-editor" style="display: flex; flex-direction: column; height: 85vh;">
    <eq-window style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">

      <!-- Header -->
      <div style="flex-shrink: 0; padding: 4px 0;">
        <div class="d-flex justify-content-between align-items-center">
          <div style="min-width: 0; flex: 1;">
            <div class="d-flex align-items-center">
              <i class="fa fa-magic text-warning mr-2" style="font-size: 1.2em;"></i>
              <span v-if="currentSpellList" class="text-warning font-weight-bold" style="font-size: 1.1em;">
                {{ currentSpellList.name || 'Spell List #' + currentSpellList.id }}
              </span>
              <span v-else class="text-muted" style="font-size: 1.1em;">NPC Spells</span>
            </div>
            <div v-if="currentSpellList" class="mt-1">
              <span v-if="currentSpellList.parent_list" class="badge badge-dark mr-1" style="font-size: 0.8em;">
                Parent: <a :href="'#/npc-spells/' + currentSpellList.parent_list" class="text-info">{{ currentSpellList.parent_list }}</a>
              </span>
              <span class="badge badge-dark" style="font-size: 0.8em;">
                {{ spellEntries.length }} spell{{ spellEntries.length !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <hr v-if="currentSpellList" class="my-2" style="border-color: rgba(255,255,255,0.1);">

      <!-- Spell Entries -->
      <div v-if="spellEntries.length > 0" style="flex: 1; overflow-y: auto; min-height: 0;">
        <table class="spell-table w-100">
          <thead>
            <tr>
              <th>Spell</th>
              <th class="text-center" style="width:65px;">Type</th>
              <th class="text-center" style="width:50px;">Pri</th>
              <th class="text-center" style="width:70px;">Levels</th>
              <th class="text-center" style="width:55px;">Recast</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, i) in spellEntries" :key="i" class="spell-row">
              <td style="padding: 4px 6px;">
                <a :href="'#/spell/' + entry.spellid" class="spell-link">
                  {{ spellNames[entry.spellid] || 'Spell #' + entry.spellid }}
                </a>
              </td>
              <td class="text-center" style="padding: 4px 6px;">
                <span class="type-badge" :class="'type-' + entry.type">{{ spellTypeLabel(entry.type) }}</span>
              </td>
              <td class="text-center" style="padding: 4px 6px;">{{ entry.priority }}</td>
              <td class="text-center" style="padding: 4px 6px;">{{ entry.minlevel }}–{{ entry.maxlevel }}</td>
              <td class="text-center" style="padding: 4px 6px;">{{ entry.recast_delay }}s</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!loading && !currentSpellList" class="text-center text-muted py-5" style="flex: 1;">
        <i class="fa fa-magic fa-3x mb-3 d-block" style="opacity: 0.3;"></i>
        <div>No spell list assigned to this NPC.</div>
        <small>Use the search below to assign one.</small>
      </div>

      <div v-else-if="loading" class="text-center py-4" style="flex: 1;">
        <i class="fa fa-spinner fa-spin fa-2x text-warning"></i>
        <div class="mt-2 small text-muted">Loading spell data...</div>
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
            placeholder="Search spell lists by name or ID..."
            v-model="searchQuery" @input="debounceSearch"
            style="background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15); color: white;"
          >
          <div class="input-group-append" v-if="searchQuery">
            <button class="btn btn-outline-secondary btn-sm" @click="searchQuery = ''; searchResults = [];"><i class="fa fa-times"></i></button>
          </div>
        </div>
        <div v-if="searchResults.length > 0" class="mt-2" style="max-height: 20vh; overflow-y: auto;">
          <div
            v-for="s in searchResults" :key="s.id"
            class="search-result-row d-flex align-items-center justify-content-between"
            @click="selectSpellList(s)"
          >
            <div>
              <span class="text-muted mr-2" style="font-size: 0.85em;">#{{ s.id }}</span>
              <span>{{ s.name }}</span>
            </div>
            <button class="btn btn-xs btn-outline-success" @click.stop="selectSpellList(s)">
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

<style scoped>
.spell-table {
  font-size: 0.85em;
  border-collapse: collapse;
}
.spell-table thead th {
  padding: 4px 6px;
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.5;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  font-weight: normal;
}
.spell-row {
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.15s;
}
.spell-row:hover {
  background: rgba(255,255,255,0.04);
}
.spell-link {
  color: #e0d6c2;
  text-decoration: none;
}
.spell-link:hover {
  color: #ffc107;
  text-decoration: underline;
}
.type-badge {
  font-size: 0.8em;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: bold;
}
.type-0 { color: #ff6b6b; } /* Nuke */
.type-1 { color: #5cff5c; } /* Heal */
.type-2 { color: #5cacff; } /* Buff */
.type-7 { color: #ff9933; } /* DOT */
.type-9 { color: #bb66ff; } /* Debuff */
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
