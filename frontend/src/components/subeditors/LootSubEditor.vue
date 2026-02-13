<template>
  <div class="loot-sub-editor" style="display: flex; flex-direction: column; height: 85vh;">
    <eq-window style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">

      <!-- Header -->
      <div class="loot-header" style="flex-shrink: 0;">
        <div class="d-flex justify-content-between align-items-center">
          <div style="min-width: 0; flex: 1;">
            <div class="d-flex align-items-center">
              <i class="fa fa-treasure-chest text-warning mr-2" style="font-size: 1.2em;"></i>
              <span v-if="currentLoottable" class="text-warning font-weight-bold" style="font-size: 1.1em;">
                {{ currentLoottable.name || 'Loottable #' + currentLoottable.id }}
              </span>
              <span v-else class="text-muted">No Loot Table</span>
            </div>
            <div v-if="currentLoottable && currentLoottable.mincash !== undefined" class="mt-1">
              <span class="badge badge-dark mr-1" style="font-size: 0.8em;">
                <i class="fa fa-coins text-warning mr-1"></i>
                {{ formatCash(currentLoottable.mincash) }} – {{ formatCash(currentLoottable.maxcash) }}
              </span>
              <span class="badge badge-dark" style="font-size: 0.8em;">
                {{ loottableEntries.length }} lootdrop{{ loottableEntries.length !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>
          <a
            v-if="currentLoottable"
            :href="'#/loot/' + currentLoottable.id"
            class="btn btn-sm btn-outline-info ml-2"
            title="Open in full Loot Editor"
            style="white-space: nowrap;"
          >
            <i class="fa fa-external-link-alt mr-1"></i> Full Editor
          </a>
        </div>
      </div>

      <!-- Divider -->
      <hr v-if="currentLoottable" class="my-2" style="border-color: rgba(255,255,255,0.1);">

      <!-- Loot Entries -->
      <div v-if="loottableEntries.length > 0" class="loot-entries-scroll" style="flex: 1; overflow-y: auto; min-height: 0;">
        <div
          v-for="(entry, ei) in loottableEntries"
          :key="'entry-' + ei"
          class="lootdrop-group"
          :class="{ 'mt-3': ei > 0 }"
        >
          <!-- Lootdrop Header -->
          <div class="lootdrop-header">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <i class="fa fa-box-open mr-1"></i>
                <span class="font-weight-bold">
                  {{ getLootdropName(entry) }}
                </span>
                <span class="text-muted ml-1">#{{ entry.lootdrop_id }}</span>
              </div>
              <div class="lootdrop-badges">
                <span class="badge badge-info" title="Drop probability">{{ entry.probability }}%</span>
                <span v-if="entry.multiplier > 1" class="badge badge-warning ml-1" title="Multiplier">×{{ entry.multiplier }}</span>
                <span v-if="entry.droplimit > 0" class="badge badge-secondary ml-1" title="Drop limit">limit: {{ entry.droplimit }}</span>
                <span v-if="entry.mindrop > 0" class="badge badge-secondary ml-1" title="Min drop">min: {{ entry.mindrop }}</span>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table v-if="(dropItems[entry.lootdrop_id] || []).length > 0" class="loot-item-table w-100">
            <thead>
              <tr>
                <th style="width: 32px;"></th>
                <th>Item</th>
                <th class="text-right" style="width: 80px;">Chance</th>
                <th class="text-center" style="width: 50px;">Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(dropEntry, di) in (dropItems[entry.lootdrop_id] || [])"
                :key="'drop-' + ei + '-' + di"
                class="loot-item-row"
              >
                <td class="text-center" style="padding: 2px 4px;">
                  <item-popover v-if="dropEntry.item" :item="dropEntry.item" size="sm" />
                </td>
                <td style="padding: 4px 6px;">
                  <a v-if="dropEntry.item" :href="'#/item/' + dropEntry.item.id" class="item-link">
                    {{ dropEntry.item.Name || dropEntry.item.name || 'Item #' + dropEntry.item_id }}
                  </a>
                  <span v-else class="text-muted">Item #{{ dropEntry.item_id }}</span>
                </td>
                <td class="text-right" style="padding: 4px 6px;">
                  <span
                    class="chance-pill"
                    :class="getChanceClass(dropEntry.chance)"
                  >{{ dropEntry.chance }}%</span>
                </td>
                <td class="text-center" style="padding: 4px 6px;">
                  <span v-if="(dropEntry.multiplier || 1) > 1" class="text-warning">×{{ dropEntry.multiplier }}</span>
                  <span v-else class="text-muted">1</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty lootdrop -->
          <div v-else class="text-center text-muted small py-2" style="background: rgba(0,0,0,0.15); border-radius: 0 0 4px 4px;">
            <i class="fa fa-info-circle mr-1"></i> No items in this lootdrop
          </div>
        </div>
      </div>

      <!-- No loot assigned -->
      <div v-else-if="!loading && !currentLoottable" class="text-center text-muted py-5" style="flex: 1;">
        <i class="fa fa-box-open fa-3x mb-3 d-block" style="opacity: 0.3;"></i>
        <div>No loot table assigned.</div>
        <small>Search below to assign one.</small>
      </div>

      <!-- Loading -->
      <div v-else-if="loading" class="text-center py-4" style="flex: 1;">
        <i class="fa fa-spinner fa-spin fa-2x text-warning"></i>
        <div class="mt-2 small text-muted">Loading loot data...</div>
      </div>

      <!-- Search Bar -->
      <div class="loot-search-bar" style="flex-shrink: 0;">
        <div class="input-group input-group-sm">
          <div class="input-group-prepend">
            <span class="input-group-text" style="background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15);">
              <i class="fa fa-search text-muted"></i>
            </span>
          </div>
          <input
            type="text"
            class="form-control"
            placeholder="Search loot tables by name or ID..."
            v-model="searchQuery"
            @input="debounceSearch"
            style="background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15); color: white;"
          >
          <div class="input-group-append" v-if="searchQuery">
            <button class="btn btn-outline-secondary btn-sm" @click="searchQuery = ''; searchResults = [];">
              <i class="fa fa-times"></i>
            </button>
          </div>
        </div>

        <div v-if="searchResults.length > 0" class="search-results mt-2" style="max-height: 20vh; overflow-y: auto;">
          <div
            v-for="lt in searchResults"
            :key="lt.id"
            class="search-result-row d-flex align-items-center justify-content-between"
            @click="selectLoottable(lt)"
          >
            <div>
              <span class="text-muted mr-2" style="font-size: 0.85em;">#{{ lt.id }}</span>
              <span>{{ lt.name }}</span>
            </div>
            <button class="btn btn-xs btn-outline-success" @click.stop="selectLoottable(lt)">
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
    getLootdropName(entry) {
      const items = this.dropItems[entry.lootdrop_id] || [];
      if (items.length === 1 && items[0].item) {
        return items[0].item.Name || items[0].item.name || 'Lootdrop';
      }
      return 'Lootdrop (' + items.length + ' items)';
    },
    getChanceClass(chance) {
      if (chance >= 75) return 'chance-high';
      if (chance >= 25) return 'chance-med';
      return 'chance-low';
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
.loot-header {
  padding: 4px 0;
}

.lootdrop-group {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.lootdrop-header {
  background: rgba(23, 162, 184, 0.1);
  border-bottom: 1px solid rgba(23, 162, 184, 0.2);
  padding: 6px 10px;
  font-size: 0.85em;
}

.lootdrop-badges .badge {
  font-size: 0.75em;
  padding: 3px 6px;
}

.loot-item-table {
  font-size: 0.85em;
  border-collapse: collapse;
}

.loot-item-table thead th {
  padding: 4px 6px;
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.5;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-weight: normal;
}

.loot-item-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.15s;
}

.loot-item-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.loot-item-row:last-child {
  border-bottom: none;
}

.item-link {
  color: #e0d6c2;
  text-decoration: none;
}

.item-link:hover {
  color: #ffc107;
  text-decoration: underline;
}

.chance-pill {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.85em;
  font-weight: bold;
  min-width: 42px;
  text-align: center;
}

.chance-high {
  background: rgba(40, 167, 69, 0.2);
  color: #5cff5c;
}

.chance-med {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

.chance-low {
  background: rgba(220, 53, 69, 0.15);
  color: #ff6b6b;
}

.loot-search-bar {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 10px;
  margin-top: 10px;
}

.search-result-row {
  padding: 6px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.search-result-row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.search-result-row:last-child {
  border-bottom: none;
}
</style>
