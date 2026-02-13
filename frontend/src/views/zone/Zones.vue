<template>
  <div>
    <div class="row">
      <div class="col-12">
        <eq-window-simple title="Zones">

          <!-- Search Row -->
          <div class="row" style="justify-content: center">
            <div class='col-4'>
              <div class="zone-result-count">Showing ({{ resultCount }}) results</div>
              <input
                type="text"
                class="form-control"
                placeholder="Search by zone long or short name, expansion etc."
                autofocus
                v-model="zoneSearchText"
                v-on:keyup="selectedExpansion = -1; setStateDebounce();"
                v-on:keyup.enter="updateQueryState"
              >
            </div>
            <div class="col-8">
              <img
                v-for="(expansion, expansionId) in EXPANSIONS_FULL"
                v-if="!getExpansionIcon(expansionId).includes('base64')"
                :title="getExpansionName(expansionId) + ' (' + expansionId + ')'"
                :src="getExpansionIcon(expansionId)"
                @click="zoneSearchText = ''; selectedExpansion = expansionId; updateQueryState()"
                :style="'width: 56px; opacity: .7; ' + (isExpansionSelected(expansionId) ? 'border: 2px solid #dadada; border-radius: 7px;' : 'border: 2px solid rgb(218 218 218 / 30%); border-radius: 7px;')"
                class="mr-2 p-1 hover-highlight-inner"
              >
            </div>
          </div>

          <!-- Filter Bar -->
          <div class="zone-filter-bar mt-2">
            <div class="zone-filter-group">
              <label class="zone-filter-label">Zone Type:</label>
              <select class="form-control form-control-sm zone-filter-select" v-model="filterZoneType" @change="triggerSearch">
                <option value="">All</option>
                <option :value="0">Standard (0)</option>
                <option :value="1">Instanced (1)</option>
                <option :value="2">Hybrid (2)</option>
                <option :value="3">Raid (3)</option>
                <option :value="4">City (4)</option>
                <option :value="5">Ocean/Water (5)</option>
              </select>
            </div>
            <div class="zone-filter-group">
              <label class="zone-filter-label">Min Level:</label>
              <input type="number" class="form-control form-control-sm zone-filter-input" v-model.number="filterMinLevel" @input="triggerSearch" min="0" max="255" placeholder="0">
            </div>
            <div class="zone-filter-group">
              <label class="zone-filter-label">Flags:</label>
              <div class="zone-filter-toggles">
                <span class="zone-flag-toggle" :class="{ active: filterBind }" @click="filterBind = !filterBind; triggerSearch()" title="Can Bind">Bind</span>
                <span class="zone-flag-toggle" :class="{ active: filterCombat }" @click="filterCombat = !filterCombat; triggerSearch()" title="Can Combat">Combat</span>
                <span class="zone-flag-toggle" :class="{ active: filterOutdoor }" @click="filterOutdoor = !filterOutdoor; triggerSearch()" title="Cast Outdoor">Outdoor</span>
                <span class="zone-flag-toggle" :class="{ active: filterHotzone }" @click="filterHotzone = !filterHotzone; triggerSearch()" title="Is Hotzone">Hotzone</span>
              </div>
            </div>
            <div class="zone-filter-group" v-if="hasActiveFilters">
              <b-button class="btn-dark btn-sm" @click="clearFilters">
                <i class="fa fa-times"></i> Clear Filters
              </b-button>
            </div>
          </div>

        </eq-window-simple>

        <eq-window
          v-if="zones"
          class="p-3 pt-0"
          style="height: 87vh; overflow-y: scroll; overflow-x: hidden"
        >
          <table
            id="zonetable"
            class="eq-table eq-highlight-rows"
            style="display: table; font-size: 14px;"
          >
            <thead>
            <tr>
              <th style="width: 60px; white-space: nowrap;"></th>
              <th class="zone-sortable-header" style="width: 200px; text-align: center; white-space: nowrap;" @click="toggleSort('expansion')">
                Expansion <i :class="getSortIcon('expansion')"></i>
              </th>
              <th class="zone-sortable-header" style="width: 100px; white-space: nowrap;" @click="toggleSort('short_name')">
                Short Name <i :class="getSortIcon('short_name')"></i>
              </th>
              <th class="zone-sortable-header" style="width: 350px" @click="toggleSort('long_name')">
                Long Name <i :class="getSortIcon('long_name')"></i>
              </th>
              <th class="zone-sortable-header" style="width: 50px" @click="toggleSort('zoneidnumber')">
                Zone ID <i :class="getSortIcon('zoneidnumber')"></i>
              </th>
              <th class="zone-sortable-header" style="width: 50px" @click="toggleSort('version')">
                Version <i :class="getSortIcon('version')"></i>
              </th>
              <th style="text-align: center">Bind</th>
              <th style="text-align: center">Combat</th>
              <th style="text-align: center">Levitate</th>
              <th style="text-align: center">Outdoor</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(zone, index) in filteredZones" :key="zone.id" @click="clickZoneRow(zone)">
              <td style="text-align: center"><img :src="getExpansionIcon(zone.expansion)"></td>
              <td style="text-align: center">{{ getExpansionName(zone.expansion) }}</td>
              <td style="text-align: right">{{ zone.short_name }}</td>
              <td>{{ zone.long_name }}</td>
              <td style="text-align: center">{{ zone.zoneidnumber }}</td>
              <td style="text-align: center">{{ zone.version }}</td>
              <td style="text-align: center">
                <eq-checkbox :disabled="true" :value="zone.canbind" />
              </td>
              <td style="text-align: center">
                <eq-checkbox :disabled="true" :value="zone.cancombat" />
              </td>
              <td style="text-align: center">
                <eq-checkbox :disabled="true" :value="zone.canlevitate" />
              </td>
              <td style="text-align: center">
                <eq-checkbox :disabled="true" :value="zone.castoutdoor" />
              </td>
            </tr>
            </tbody>
          </table>

        </eq-window>
      </div>
    </div>
  </div>
</template>

<script type="ts">
import {ZoneApi} from "@/app/api/api";
import EqWindow from "@/components/eq-ui/EQWindow.vue";
import {SpireApi} from "../../app/api/spire-api";
import Expansions from "@/app/utility/expansions";
import EqCheckbox from "@/components/eq-ui/EQCheckbox.vue";
import {debounce} from "@/app/utility/debounce.js";
import EqTabs from "@/components/eq-ui/EQTabs.vue";
import EqTab from "@/components/eq-ui/EQTab.vue";
import ContentArea from "@/components/layout/ContentArea.vue";
import {SpireQueryBuilder} from "@/app/api/spire-query-builder";
import EqWindowSimple from "@/components/eq-ui/EQWindowSimple.vue";
import {EXPANSIONS_FULL} from "@/app/constants/eq-expansions";
import {ROUTE} from "@/routes";

export default {
  components: {
    EqWindowSimple,
    ContentArea,
    EqTab,
    EqTabs,
    EqCheckbox,
    EqWindow,
  },
  data() {
    return {
      zones: null,
      filteredZones: null,
      resultCount: 0,

      selectedExpansion: -1,
      zoneSearchText: "",

      // Filters
      filterZoneType: "",
      filterMinLevel: null,
      filterBind: false,
      filterCombat: false,
      filterOutdoor: false,
      filterHotzone: false,

      // Sorting
      sortField: 'expansion',
      sortDirection: 'asc', // 'asc' or 'desc'

      // route watcher
      routeWatcher: null,

      // loaded state
      loaded: false,

      EXPANSIONS_FULL: EXPANSIONS_FULL,
    }
  },
  computed: {
    hasActiveFilters() {
      return this.filterZoneType !== "" ||
        this.filterMinLevel > 0 ||
        this.filterBind ||
        this.filterCombat ||
        this.filterOutdoor ||
        this.filterHotzone;
    }
  },
  watch: {
    $route(to, from) {
      this.loadQueryState()
      this.init()
    }
  },
  async mounted() {
    this.loadQueryState()
    await this.init()
  },
  methods: {
    isExpansionSelected(expansion) {
      return expansion === this.selectedExpansion
    },

    async init() {
      this.loaded = false
      this.loadQueryState()
      await this.listZones()
      this.triggerSearch()
    },

    setStateDebounce: debounce(function () {
      this.updateQueryState()
    }, 300),

    updateQueryState: function () {
      let queryState = {};

      if (this.zoneSearchText !== "") {
        queryState.q = this.zoneSearchText
      }
      if (parseInt(this.selectedExpansion) !== -1) {
        queryState.expansion = this.selectedExpansion
      }

      this.$router.push(
        {
          path: ROUTE.ZONES,
          query: queryState
        }
      ).catch(() => {
      })
    },

    loadQueryState: function () {
      if (this.$route.query.expansion) {
        this.selectedExpansion = this.$route.query.expansion;
      }
      if (this.$route.query.q) {
        this.zoneSearchText = this.$route.query.q
      }
    },

    // --- Sorting ---
    toggleSort(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      this.triggerSearch();
    },

    getSortIcon(field) {
      if (this.sortField !== field) return 'fa fa-sort zone-sort-inactive';
      return this.sortDirection === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down';
    },

    // --- Filtering ---
    clearFilters() {
      this.filterZoneType = "";
      this.filterMinLevel = null;
      this.filterBind = false;
      this.filterCombat = false;
      this.filterOutdoor = false;
      this.filterHotzone = false;
      this.triggerSearch();
    },

    triggerSearch: function () {
      let result = this.zones;

      // Text search
      if (this.zoneSearchText) {
        const searchString = this.zoneSearchText.toLowerCase();
        result = result.filter((e) => {
          const expansion = e.expansion - 1;
          return e.short_name.toLowerCase().includes(searchString)
            || Expansions.getExpansionName(expansion).toLowerCase().includes(searchString)
            || e.long_name.toLowerCase().includes(searchString);
        });
      }

      // Zone type filter
      if (this.filterZoneType !== "" && this.filterZoneType !== null) {
        const zt = parseInt(this.filterZoneType);
        result = result.filter(e => e.ztype === zt);
      }

      // Min level filter
      if (this.filterMinLevel && this.filterMinLevel > 0) {
        result = result.filter(e => e.min_level >= this.filterMinLevel);
      }

      // Boolean flag filters
      if (this.filterBind) {
        result = result.filter(e => e.canbind === 1);
      }
      if (this.filterCombat) {
        result = result.filter(e => e.cancombat === 1);
      }
      if (this.filterOutdoor) {
        result = result.filter(e => e.castoutdoor === 1);
      }
      if (this.filterHotzone) {
        result = result.filter(e => e.hotzone === 1);
      }

      // Sort
      if (this.sortField) {
        result = [...result].sort((a, b) => {
          let va = a[this.sortField];
          let vb = b[this.sortField];

          // Handle string comparison
          if (typeof va === 'string') {
            va = va.toLowerCase();
            vb = (vb || '').toLowerCase();
            if (va < vb) return this.sortDirection === 'asc' ? -1 : 1;
            if (va > vb) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
          }

          // Numeric
          va = va || 0;
          vb = vb || 0;
          return this.sortDirection === 'asc' ? va - vb : vb - va;
        });
      }

      // If no results from text search, show all (original behavior)
      if (result.length === 0 && this.zoneSearchText && !this.hasActiveFilters) {
        result = this.zones;
      }

      this.filteredZones = result;
      this.resultCount = result.length;
    },

    getExpansionIcon(expansion) {
      return Expansions.getExpansionIconUrlSmall(expansion)
    },
    getExpansionName(expansion) {
      return Expansions.getExpansionName(expansion)
    },
    clickZoneRow(zone) {
      this.$router.push(
        {
          path: '/zone/' + zone.short_name + '?v=' + zone.version
        }
      ).catch(() => {
      })
    },
    listZones: async function () {

      const builder   = (new SpireQueryBuilder())
      const expansion = parseInt(this.selectedExpansion)
      if (expansion > -1) {
        builder.where("expansion", "=", expansion)
      }

      builder.orderBy(["expansion", "long_name"])
        .limit(10000)

      const result = await (new ZoneApi(...SpireApi.cfg())).listZones(builder.get())
      if (result.status === 200) {
        this.zones         = result.data
        this.filteredZones = result.data
      }

      this.loaded = true
    }
  }
}

</script>

<style>
#zonetable TBODY TR TD {
  padding: 2px 4px;
}

#zonetable tr {
  border-bottom: .4px solid #ffffff1c;
}

#zonetable td {
  padding-top: 5px;
  padding-bottom: 5px;
  border-right: .1px solid #ffffff1c;
  border-left: .1px solid #ffffff1c;
}
</style>

<style scoped>
/* Filter bar */
.zone-filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 0;
  flex-wrap: wrap;
}

.zone-filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.zone-filter-label {
  font-size: 12px;
  color: #aaa;
  margin: 0;
  white-space: nowrap;
}

.zone-filter-select {
  width: auto;
  min-width: 120px;
  background: rgba(20, 20, 30, 0.8);
  border: 1px solid rgba(255,255,255,0.15);
  color: #e0e0e0;
  font-size: 12px;
}

.zone-filter-input {
  width: 70px;
  background: rgba(20, 20, 30, 0.8);
  border: 1px solid rgba(255,255,255,0.15);
  color: #e0e0e0;
  font-size: 12px;
}

.zone-filter-toggles {
  display: flex;
  gap: 4px;
}

.zone-flag-toggle {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  color: #888;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.15s;
  user-select: none;
}

.zone-flag-toggle:hover {
  background: rgba(255,255,255,0.1);
  color: #ccc;
}

.zone-flag-toggle.active {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.5);
  color: #93c5fd;
}

.zone-result-count {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 4px;
}

/* Sortable headers */
.zone-sortable-header {
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
}

.zone-sortable-header:hover {
  color: #93c5fd;
}

.zone-sortable-header i {
  font-size: 10px;
  margin-left: 3px;
}

.zone-sort-inactive {
  opacity: 0.3;
}
</style>
