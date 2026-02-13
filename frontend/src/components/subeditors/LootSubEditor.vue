<template>
  <div class="loot-sub-editor" style="display: flex; flex-direction: column; height: 85vh;">
    <eq-window title="Loot" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
      <!-- Current Loot Table Info -->
      <div v-if="currentLoottable" class="mb-2 p-2" style="background: rgba(0,0,0,0.3); border-radius: 4px; flex-shrink: 0;">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="text-warning font-weight-bold">
            <i class="fa fa-treasure-chest mr-1"></i>
            {{ currentLoottable.name || 'Loottable #' + currentLoottable.id }}
          </span>
          <a href="#/loot" class="btn btn-xs btn-outline-info" title="Open full Loot Editor">
            <i class="fa fa-external-link-alt"></i> Full Editor
          </a>
        </div>
        <div v-if="currentLoottable.mincash !== undefined" class="small text-muted">
          Cash: {{ formatCash(currentLoottable.mincash) }} – {{ formatCash(currentLoottable.maxcash) }}
        </div>
      </div>

      <!-- Loot Hierarchy (entries → drops → items) -->
      <div v-if="loottableEntries.length > 0" class="mb-2" style="flex: 1; overflow-y: auto; min-height: 0;">
        <table class="eq-table eq-highlight-rows w-100" style="font-size: 13px;">
          <thead class="eq-table-floating-header">
            <tr>
              <th style="width: 40px;"></th>
              <th>Item</th>
              <th class="text-center" style="width: 70px;">Chance</th>
              <th class="text-center" style="width: 60px;">Multi</th>
              <th class="text-center" style="width: 70px;">Limit</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(entry, ei) in loottableEntries">
              <tr :key="'entry-' + ei" style="background: rgba(255,255,255,0.03);">
                <td colspan="5" class="text-info font-weight-bold small py-1">
                  <i class="fa fa-box-open mr-1"></i>
                  Lootdrop #{{ entry.lootdrop_id }}
                  <span class="text-muted ml-2">
                    prob: {{ entry.probability }}% | multi: {{ entry.multiplier }} | droplimit: {{ entry.droplimit }} | mindrop: {{ entry.mindrop }}
                  </span>
                </td>
              </tr>
              <tr
                v-for="(dropEntry, di) in (dropItems[entry.lootdrop_id] || [])"
                :key="'drop-' + ei + '-' + di"
              >
                <td class="text-center">
                  <item-popover v-if="dropEntry.item" :item="dropEntry.item" size="sm" />
                </td>
                <td>
                  <a v-if="dropEntry.item" :href="'#/item/' + dropEntry.item.id" class="text-light">
                    {{ dropEntry.item.Name || dropEntry.item.name || 'Item #' + dropEntry.item_id }}
                  </a>
                  <span v-else class="text-muted">Item #{{ dropEntry.item_id }}</span>
                </td>
                <td class="text-center">{{ dropEntry.chance }}%</td>
                <td class="text-center">{{ dropEntry.multiplier || 1 }}</td>
                <td class="text-center">
                  <span v-if="dropEntry.min_looters || dropEntry.max_looters">
                    {{ dropEntry.min_looters || 0 }}-{{ dropEntry.max_looters || 0 }}
                  </span>
                  <span v-else class="text-muted">–</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- No loot assigned message -->
      <div v-else-if="!loading && !currentLoottable" class="text-center text-muted py-4" style="flex: 1;">
        <i class="fa fa-box-open fa-2x mb-2 d-block"></i>
        No loot table assigned to this NPC.<br>
        Use the search below to assign one.
      </div>

      <!-- Loading -->
      <div v-else-if="loading" class="text-center py-4" style="flex: 1;">
        <i class="fa fa-spinner fa-spin"></i> Loading loot data...
      </div>

      <!-- Search -->
      <div style="flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-top: 8px;">
        <div class="input-group input-group-sm mb-2">
          <input
            type="text"
            class="form-control"
            placeholder="Search loot tables by name or ID..."
            v-model="searchQuery"
            @input="debounceSearch"
          >
          <div class="input-group-append">
            <button class="btn btn-outline-warning" @click="doSearch" :disabled="!searchQuery">
              <i class="fa fa-search"></i>
            </button>
          </div>
        </div>
        <div v-if="searchResults.length > 0" style="max-height: 25vh; overflow-y: auto;">
          <table class="eq-table eq-highlight-rows w-100" style="font-size: 13px;">
            <thead>
              <tr>
                <th style="width: 60px;">ID</th>
                <th>Name</th>
                <th style="width: 70px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lt in searchResults" :key="lt.id">
                <td>{{ lt.id }}</td>
                <td>{{ lt.name }}</td>
                <td>
                  <button class="btn btn-xs btn-outline-success" @click="selectLoottable(lt)">
                    Select
                  </button>
                </td>
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
import ItemPopover from "../ItemPopover";
import {SpireApi} from "../../app/api/spire-api";
import {LoottableApi} from "../../app/api/api/loottable-api";
import {LoottableEntryApi} from "../../app/api/api/loottable-entry-api";
import {LootdropEntryApi} from "../../app/api/api/lootdrop-entry-api";
import {SpireQueryBuilder} from "../../app/api/spire-query-builder";

export default {
  name: "LootSubEditor",
  components: { EqWindow, ItemPopover },
  props: {
    loottableId: { type: [Number, String], default: 0 }
  },
  data() {
    return {
      currentLoottable: null,
      loottableEntries: [],
      dropItems: {},
      loading: false,
      searchQuery: "",
      searchResults: [],
      searchTimeout: null
    };
  },
  watch: {
    loottableId: {
      immediate: true,
      handler(val) {
        const id = parseInt(val);
        if (id > 0) {
          this.loadLoottable(id);
        } else {
          this.currentLoottable = null;
          this.loottableEntries = [];
          this.dropItems = {};
        }
      }
    }
  },
  methods: {
    async loadLoottable(id) {
      this.loading = true;
      try {
        const ltApi = new LoottableApi(...SpireApi.cfg());
        const ltResult = await ltApi.getLoottable({ id });
        this.currentLoottable = ltResult.data;

        const lteApi = new LoottableEntryApi(...SpireApi.cfg());
        const builder = new SpireQueryBuilder();
        builder.where("loottable_id", "=", id);
        const entriesResult = await lteApi.listLoottableEntries(builder.get());
        this.loottableEntries = entriesResult.data || [];

        // Load drop entries for each lootdrop
        this.dropItems = {};
        const ldeApi = new LootdropEntryApi(...SpireApi.cfg());
        for (const entry of this.loottableEntries) {
          const db = new SpireQueryBuilder();
          db.where("lootdrop_id", "=", entry.lootdrop_id);
          db.includes(["Item"]);
          try {
            const dropResult = await ldeApi.listLootdropEntries(db.get());
            this.$set(this.dropItems, entry.lootdrop_id, dropResult.data || []);
          } catch (e) {
            this.$set(this.dropItems, entry.lootdrop_id, []);
          }
        }
      } catch (e) {
        console.error("Failed to load loottable", e);
        this.currentLoottable = null;
        this.loottableEntries = [];
      }
      this.loading = false;
    },
    formatCash(copper) {
      if (!copper) return "0c";
      const p = Math.floor(copper / 1000);
      const g = Math.floor((copper % 1000) / 100);
      const s = Math.floor((copper % 100) / 10);
      const c = copper % 10;
      let parts = [];
      if (p) parts.push(p + "p");
      if (g) parts.push(g + "g");
      if (s) parts.push(s + "s");
      if (c || parts.length === 0) parts.push(c + "c");
      return parts.join(" ");
    },
    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => this.doSearch(), 400);
    },
    async doSearch() {
      if (!this.searchQuery.trim()) {
        this.searchResults = [];
        return;
      }
      try {
        const ltApi = new LoottableApi(...SpireApi.cfg());
        const builder = new SpireQueryBuilder();
        if (isNaN(this.searchQuery)) {
          builder.where("name", "like", "%" + this.searchQuery + "%");
        } else {
          builder.where("id", "=", parseInt(this.searchQuery));
        }
        builder.limit(20);
        const result = await ltApi.listLoottables(builder.get());
        this.searchResults = result.data || [];
      } catch (e) {
        this.searchResults = [];
      }
    },
    selectLoottable(lt) {
      this.$emit("input", lt.id);
      this.searchResults = [];
      this.searchQuery = "";
    }
  }
};
</script>

<style scoped>
.loot-sub-editor .eq-table th,
.loot-sub-editor .eq-table td {
  padding: 4px 6px;
}
</style>
