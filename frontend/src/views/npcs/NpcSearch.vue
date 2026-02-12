<template>
  <div>
    <eq-window title="NPC Search">
      <div class="row mt-2">

        <!-- Search / Filters Row -->
        <div class="col-lg-2 col-sm-12 p-0 pr-1 text-center">
          NPC Name or ID
          <input
            name="npc_name"
            type="text"
            class="form-control"
            v-on:keyup.enter="searchNpcs"
            v-model="npcName"
            placeholder="Name or ID"
            autofocus=""
            id="npc_name"
          >
        </div>

        <div class="col-lg-1 col-sm-12 p-0 pr-1 text-center">
          Class
          <select
            class="form-control"
            v-model="selectedClass"
            @change="searchNpcs()"
          >
            <option value="0">-- All --</option>
            <option v-for="(data, id) in classes" :value="id" :key="id">
              {{ id }}) {{ data.class }}
            </option>
          </select>
        </div>

        <div class="col-lg-1 col-sm-12 p-0 pr-1 text-center">
          Level
          <select
            class="form-control"
            v-model="selectedLevel"
            @change="searchNpcs()"
          >
            <option value="0">-- All --</option>
            <option v-for="l in 105" :value="l" :key="l">
              {{ l }}
            </option>
          </select>
        </div>

        <div class="col-lg-1 col-sm-12 p-0 pr-1 text-center">
          Bodytype
          <select
            class="form-control"
            v-model="selectedBodytype"
            @change="searchNpcs()"
          >
            <option value="-1">-- All --</option>
            <option v-for="(desc, id) in bodytypes" :value="id" :key="id">
              {{ id }}) {{ desc }}
            </option>
          </select>
        </div>

        <div class="col-lg-5 col-sm-12 mt-3 pl-0 pr-0">

          <div class="btn-group ml-3" role="group" v-if="parseInt(selectedLevel) > 0">
            <b-button
              @click="selectedLevelType = 0; searchNpcs();"
              size="sm"
              :variant="(parseInt(selectedLevelType) === 0 ? 'warning' : 'outline-warning')"
            >Only
            </b-button>
            <b-button
              @click="selectedLevelType = 1; searchNpcs();"
              size="sm"
              :variant="(parseInt(selectedLevelType) === 1 ? 'warning' : 'outline-warning')"
            >Higher
            </b-button>
            <b-button
              @click="selectedLevelType = 2; searchNpcs();"
              size="sm"
              :variant="(parseInt(selectedLevelType) === 2 ? 'warning' : 'outline-warning')"
            >Lower
            </b-button>
          </div>

          <div class="btn-group ml-3" role="group">
            <b-button
              @click="limit = 10; searchNpcs()"
              size="sm"
              :variant="(parseInt(limit) === 10 ? 'warning' : 'outline-warning')"
            >10
            </b-button>
            <b-button
              @click="limit = 100; searchNpcs()"
              size="sm"
              :variant="(parseInt(limit) === 100 ? 'warning' : 'outline-warning')"
            >100
            </b-button>
            <b-button
              @click="limit = 1000; searchNpcs()"
              size="sm"
              :variant="(parseInt(limit) === 1000 ? 'warning' : 'outline-warning')"
            >1000
            </b-button>
          </div>

          <div
            :class="'text-center btn-xs eq-button-fancy ml-3'"
            style="line-height: 25px; display: inline-block; cursor: pointer;"
            @click="resetForm()"
          >
            Reset Form
          </div>
        </div>
      </div>


      <!-- Class Icons -->
      <div class="row mt-2">
        <div class="col-12">
          <class-bitmask-calculator
            :centered-buttons="false"
            :display-all-none="true"
            :add-only-button-enabled="true"
            :add-only-state-enabled="selectOnlyClassEnabled"
            @fired="searchNpcs()"
            @selectOnly="selectOnlyClassEnabled = $event"
            :inputData.sync="selectedClasses"
            :mask="selectedClasses"
          />
        </div>
      </div>

      <!-- Race Icons + Additional Race Dropdown -->
      <div class="row mt-1">
        <div class="col-12" style="display: flex; align-items: center; flex-wrap: wrap;">
          <race-bitmask-calculator
            :centered-buttons="false"
            :display-all-none="true"
            @fired="selectedRaceDropdown = 0; searchNpcs()"
            :inputData.sync="selectedRaces"
            :mask="selectedRaces"
          />
          <div style="display: inline-block; margin-left: 15px; position: relative; bottom: 5px;">
            <select v-model="selectedRaceDropdown" @change="selectedRaces = 0; searchNpcs()" class="eq-input" style="min-width: 160px; font-size: 12px;">
              <option :value="0">-- Other Races --</option>
              <option v-for="(name, id) in allRaces" :key="id" :value="parseInt(id)">{{ id }}) {{ name }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-12 p-0">
          <db-column-filter
            v-if="npcTypeFields && filters"
            :set-filters="filters"
            @input="handleDbColumnFilters($event);"
            :columns="npcTypeFields"
          />
        </div>
      </div>

    </eq-window>

    <app-loader v-if="!loaded" :is-loading="!loaded" padding="4"/>

    <!-- Results Table -->
    <eq-window
      v-if="loaded && npcs && npcs.length > 0"
      class="p-0"
    >
      <div style="overflow-x: auto; max-height: 80vh;">
        <table
          class="eq-table eq-highlight-rows bordered"
          style="font-size: 14px; width: 100%;"
        >
          <thead class="eq-table-floating-header">
          <tr>
            <th style="text-align: center; width: 120px"></th>
            <th style="text-align: center; cursor: pointer;" @click="sortBy('id')">Id</th>
            <th style="text-align: center; cursor: pointer;" @click="sortBy('name')">Name</th>
            <th style="text-align: center; cursor: pointer;" @click="sortBy('level')">Level</th>
            <th style="text-align: center; cursor: pointer;" @click="sortBy('class')">Class</th>
            <th style="text-align: center; cursor: pointer;" @click="sortBy('race')">Race</th>
            <th style="text-align: center; cursor: pointer;" @click="sortBy('bodytype')">Bodytype</th>
            <th style="text-align: center; cursor: pointer;" @click="sortBy('hp')">HP</th>
            <th style="text-align: center; cursor: pointer;" @click="sortBy('mindmg')">Min Dmg</th>
            <th style="text-align: center; cursor: pointer;" @click="sortBy('maxdmg')">Max Dmg</th>
            <th style="text-align: center; cursor: pointer;" @click="sortBy('aggroradius')">Aggro</th>
            <th style="text-align: center; cursor: pointer;" @click="sortBy('loottable_id')">Loot Table</th>
          </tr>
          </thead>
          <tbody>
          <tr
            v-for="npc in npcs"
            :key="npc.id"
          >
                        <td class="p-0 text-center">

              <b-button
                variant="primary"
                size="sm"
                style="width: 28px; height: 28px"
                class="btn-outline-danger mr-2"
                title="Delete"
                @click.stop="deleteNpc(npc)"
              >
                <i class="fa fa-trash"></i>
              </b-button>

              <router-link
                :to="ROUTE.NPC_EDIT.replace(':npc', npc.id)"
                size="sm"
                tag="button"
                style="width: 28px; height: 28px"
                title="Edit"
                class="btn btn-sm btn-outline-success mr-2"
                @click.native.stop
              >
                <i class="fa fa-pencil-square"></i>
              </router-link>

              <router-link
                :to="ROUTE.NPC_EDIT.replace(':npc', npc.id) + '?clone=true'"
                size="sm"
                tag="button"
                style="width: 30px; height: 28px"
                title="Clone"
                class="btn btn-sm btn-outline-light mr-2"
                @click.native.stop
              >
                <i class="ra ra-double-team"></i>
              </router-link>

            </td>

<td style="text-align: center;">
              <npc-popover :npc="npc" :show-image="false" :show-label="false">
                {{ npc.id }}
              </npc-popover>
            </td>
            <td>{{ cleanName(npc.name) }}</td>
            <td style="text-align: center;">{{ npc.level }}</td>
            <td style="text-align: center;">{{ getClassName(npc.class) }}</td>
            <td style="text-align: center;">{{ getRaceName(npc.race) }}</td>
            <td style="text-align: center;">{{ getBodytypeName(npc.bodytype) }}</td>
            <td style="text-align: right;">{{ formatNumber(npc.hp) }}</td>
            <td style="text-align: center;">{{ npc.mindmg }}</td>
            <td style="text-align: center;">{{ npc.maxdmg }}</td>
            <td style="text-align: center;">{{ npc.aggroradius }}</td>
            <td style="text-align: center;">{{ npc.loottable_id > 0 ? npc.loottable_id : '' }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </eq-window>

    <eq-window v-if="loaded && npcs && npcs.length === 0" class="text-center mt-3">
      <p>No NPCs found matching your search criteria.</p>
    </eq-window>

  </div>
</template>

<script>
import EqWindow from "../../components/eq-ui/EQWindow";
import ContentArea from "../../components/layout/ContentArea";
import AppLoader from "../../components/LoaderCastBarTimer";
import DbColumnFilter from "../../components/DbColumnFilter";
import NpcPopover from "../../components/NpcPopover";
import {NpcTypeApi} from "../../app/api";
import {SpireApi} from "../../app/api/spire-api";
import {SpireQueryBuilder} from "../../app/api/spire-query-builder";
import {DB_CLASSES} from "../../app/constants/eq-classes-constants";
import {DB_RACE_NAMES, RACE_MASTER_DATA} from "../../app/constants/eq-races-constants";
import {BODYTYPES} from "../../app/constants/eq-bodytype-constants";
import {DbSchema} from "../../app/db-schema";
import {ROUTE} from "../../routes";
import ClassBitmaskCalculator from "../../components/tools/ClassBitmaskCalculator";
import RaceBitmaskCalculator from "../../components/tools/RaceBitmaskCalculator";
import {Npcs} from "../../app/npcs";

export default {
  name: "NpcSearch",
  components: {NpcPopover, DbColumnFilter, AppLoader, EqWindow, ClassBitmaskCalculator, RaceBitmaskCalculator},
  data() {
    return {
      // search
      npcName: "",
      selectedClass: 0,
      selectedLevel: 0,
      selectedLevelType: 0,
      selectedBodytype: -1,

      // results
      npcs: null,
      loaded: true,
      limit: 100,

      // sorting
      sortField: "id",
      sortDirection: "asc",

      // column filters
      npcTypeFields: [],
      filters: [],

      // constants
      classes: DB_CLASSES,
      bodytypes: BODYTYPES,
      ROUTE: ROUTE,
      allRaces: DB_RACE_NAMES,
      selectedClasses: 0,
      selectedRaces: 0,
      selectOnlyClassEnabled: false,
      selectedRaceDropdown: 0,
    }
  },

  mounted() {
    this.npcTypeFields = DbSchema.getNpcTypeColumns ? DbSchema.getNpcTypeColumns() : [];
    this.loadFromQuery();
  },

  watch: {
    '$route'() {
      this.loadFromQuery();
    }
  },

  methods: {
    loadFromQuery() {
      const q = this.$route.query;
      if (q.name) this.npcName = q.name;
      if (q.classes) this.selectedClasses = parseInt(q.classes);
      if (q.races) this.selectedRaces = parseInt(q.races);
      if (q.classSelectOnly) this.selectOnlyClassEnabled = true;
      if (q.raceId) this.selectedRaceDropdown = parseInt(q.raceId);
      if (q.level) this.selectedLevel = parseInt(q.level);
      if (q.levelType) this.selectedLevelType = parseInt(q.levelType);
      if (q.bodytype) this.selectedBodytype = parseInt(q.bodytype);
      if (q.limit) this.limit = parseInt(q.limit);
      if (q.orderBy) this.sortField = q.orderBy;
      if (q.orderDirection) this.sortDirection = q.orderDirection;

      if (q.name || q.classes || q.races || q.raceId || q.level || q.bodytype) {
        this.searchNpcs();
      }
    },

    updateQueryState() {
      let queryState = {};
      if (this.npcName) queryState.name = this.npcName;
      if (this.selectedClasses > 0) queryState.classes = this.selectedClasses;
      if (this.selectedRaces > 0) queryState.races = this.selectedRaces;
      if (this.selectOnlyClassEnabled) queryState.classSelectOnly = 1;
      if (this.selectedRaceDropdown > 0) queryState.raceId = this.selectedRaceDropdown;
      if (parseInt(this.selectedLevel) > 0) queryState.level = this.selectedLevel;
      if (parseInt(this.selectedLevel) > 0 && parseInt(this.selectedLevelType) > 0) queryState.levelType = this.selectedLevelType;
      if (parseInt(this.selectedBodytype) >= 0) queryState.bodytype = this.selectedBodytype;
      if (this.limit !== 100) queryState.limit = this.limit;
      if (this.sortField !== "id") queryState.orderBy = this.sortField;
      if (this.sortDirection !== "asc") queryState.orderDirection = this.sortDirection;

      this.$router.push({
        path: this.ROUTE.NPC_ROOT,
        query: queryState,
      }).catch(() => {
      });
    },

    async searchNpcs() {
      this.loaded = false;
      this.updateQueryState();

      const builder = new SpireQueryBuilder();
      const api = (new NpcTypeApi(...SpireApi.cfg()));

      // Name or ID search
      if (this.npcName) {
        if (!isNaN(this.npcName) && this.npcName.trim() !== "") {
          builder.where("id", "=", this.npcName);
        } else {
          builder.where("name", "like", "%" + this.npcName + "%");
        }
      }

      // Level filter
      if (parseInt(this.selectedLevel) > 0) {
        let op = "=";
        if (parseInt(this.selectedLevelType) === 1) op = ">=";
        if (parseInt(this.selectedLevelType) === 2) op = "<=";
        builder.where("level", op, this.selectedLevel);
      }

      // Bodytype filter
      if (parseInt(this.selectedBodytype) >= 0) {
        builder.where("bodytype", "=", this.selectedBodytype);
      }

      // Class filter (from icon selector)
      if (this.selectedClasses > 0 && this.selectedClasses < 65535) {
        // Extract selected class IDs from bitmask
        const classMap = {1:1, 2:2, 4:3, 8:4, 16:5, 32:6, 64:7, 128:8, 256:9, 512:10, 1024:11, 2048:12, 4096:13, 8192:14, 16384:15, 32768:16};
        const selectedIds = [];
        for (const [bit, classId] of Object.entries(classMap)) {
          if (this.selectedClasses & parseInt(bit)) selectedIds.push(classId);
        }
        if (selectedIds.length === 1) {
          builder.where("class", "=", selectedIds[0]);
        } else if (selectedIds.length > 1) {
          selectedIds.forEach(id => builder.whereOr("class", "=", id));
        }
      }

      // Race filter (from icon selector)
      if (this.selectedRaces > 0 && this.selectedRaces < 65535) {
        const raceMap = {1:1, 2:2, 4:3, 8:4, 16:5, 32:6, 64:7, 128:8, 256:9, 512:10, 1024:11, 2048:12, 4096:13, 8192:14, 16384:15, 32768:128, 65536:130, 131072:330, 262144:522};
        const selectedIds = [];
        for (const [bit, raceId] of Object.entries(raceMap)) {
          if (this.selectedRaces & parseInt(bit)) selectedIds.push(raceId);
        }
        if (selectedIds.length === 1) {
          builder.where("race", "=", selectedIds[0]);
        } else if (selectedIds.length > 1) {
          selectedIds.forEach(id => builder.whereOr("race", "=", id));
        }
      }

      // Race dropdown (non-player races)
      if (this.selectedRaceDropdown > 0) {
        builder.where("race", "=", this.selectedRaceDropdown);
      }

      // Column filters
      if (this.filters && this.filters.length > 0) {
        this.filters.forEach((f) => {
          builder.where(f.f, f.o, f.v);
        });
      }

      // Select relevant columns
      builder.select([
        "id", "name", "level", "class", "race", "bodytype",
        "hp", "mana", "mindmg", "maxdmg", "aggroradius",
        "assistradius", "loottable_id", "npc_spells_id",
        "npc_faction_id", "texture", "helmtexture", "gender",
      ]);

      builder.orderBy([this.sortField]);
      builder.orderDirection(this.sortDirection);
      builder.limit(parseInt(this.limit));

      try {
        const req = builder.get();

        const result = await api.listNpcTypes({
          includes: req.includes,
          where: req.where,
          whereOr: req.whereOr,
          groupBy: req.groupBy,
          limit: req.limit ? req.limit.toString() : "100",
          page: req.page,
          orderBy: req.orderBy,
          orderDirection: req.orderDirection,
          select: req.select,
        });

        this.npcs = result.data || [];
      } catch (e) {
        this.npcs = [];
        console.error("NPC search error:", e);
      }

      this.loaded = true;
    },

    sortBy(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      } else {
        this.sortField = field;
        this.sortDirection = "asc";
      }
      this.searchNpcs();
    },

    editNpc(id) {
      this.$router.push({path: "/npc/" + id});
    },

    async deleteNpc(npc) {
      if (confirm(`Are you sure you want to permanently delete this NPC? [${npc.name}] (${npc.id})`)) {
        const api = (new NpcTypeApi(...SpireApi.cfg()));
        await api.deleteNpcType({id: npc.id});
        await this.searchNpcs();
      }
    },

    resetForm() {
      this.npcName = "";
      this.selectedClasses = 0;
      this.selectedRaces = 0;
      this.selectOnlyClassEnabled = false;
      this.selectedRaceDropdown = 0;
      this.selectedLevel = 0;
      this.selectedLevelType = 0;
      this.selectedBodytype = -1;
      this.limit = 100;
      this.sortField = "id";
      this.sortDirection = "asc";
      this.filters = [];
      this.npcs = null;
      this.$router.push({path: this.ROUTE.NPC_ROOT}).catch(() => {
      });
    },

    handleDbColumnFilters(filters) {
      this.filters = filters;
      this.searchNpcs();
    },

    cleanName(name) {
      return Npcs.getCleanName(name);
    },

    getClassName(classId) {
      return this.classes[classId] ? this.classes[classId].class || this.classes[classId] : classId;
    },

    getRaceName(raceId) {
      const raceNames = DB_RACE_NAMES;
      return raceNames[raceId] || raceId;
    },

    getBodytypeName(bodytypeId) {
      return this.bodytypes[bodytypeId] || bodytypeId;
    },

    formatNumber(num) {
      if (!num) return 0;
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
  }
}
</script>

<style scoped>
.eq-table th {
  white-space: nowrap;
  user-select: none;
}

.eq-table td {
  white-space: nowrap;
}
</style>
