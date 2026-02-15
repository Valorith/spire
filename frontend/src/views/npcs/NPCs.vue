<template>
  <div>
    <div class="row">
      <div :class="(isAnySelectorActive() ? 'col-7' : 'col-12')">
        <eq-window
          v-if="zoneData"
          :title="`${zoneData.long_name} Short Name (${zoneData.short_name}) Version (${zoneData.version}) NPC(s) (${npcTypes.length})`"
        >
          <div class="row">
            <div :class="(isAnySelectorActive() ? 'col-2' : 'col-1') + 'text-right'">
              <button
                class='btn btn-dark btn-sm mt-1'
                @click="reset"
              >
                <i class="fa fa-refresh"></i> Reset
              </button>
              <button
                class='btn btn-dark btn-sm mt-1 ml-3'
                @click="bulkEdit()"
              >
                <i class="fa fa-edit"></i> Bulk Edit
              </button>
            </div>

            <div class="col-3">
              <b-input
                placeholder="Search by NPC name"
                v-on:keyup.enter="updateQueryState"
                v-model="npcNameSearch"
              ></b-input>
            </div>

            <div class="col-4 p-0">
              <db-column-filter
                v-if="npcTypeFields && filters"
                :set-filters="filters"
                @input="handleDbColumnFilters($event);"
                :columns="npcTypeFields"
              />
            </div>

            <div class="ml-auto d-flex align-items-center justify-content-end pr-3">
              <label class="mb-0 mr-2 text-muted" style="font-size: 12px; white-space: nowrap;">Columns</label>
              <select
                class="form-control form-control-sm bg-dark text-white border-secondary"
                style="width: 70px;"
                v-model.number="columnLimit"
              >
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="75">75</option>
                <option :value="0">All</option>
              </select>
            </div>
          </div>
        </eq-window>
        <eq-window
          id="npcs-table-window"
          v-if="npcTypes"
          class="p-0"
        >
          <div
            id="npcs-table-container"
            style="overflow-x: scroll; height: 85vh"
            @scroll="handleTableScroll"
            ref="npcTableContainer"
          >
            <table
              id="npcs-table"
              class="eq-table eq-highlight-rows bordered"
              style="font-size: 14px; "
              v-if="npcTypes && npcTypes.length > 0"
            >
              <thead class="eq-table-floating-header">
              <tr>
                <th
                  v-for="(header, index) in cachedColumnKeys"
                  :id="'column-' + header"
                  :style="previewStyles(header) + 'text-align: center; ' + getColumnHeaderWidth(header) + '' + ([0, 1].includes(index) ? ' position: sticky; z-index: 9999; background-color: rgba(25,31,41, 1); ' + getColumnStylingFromIndex(index) : '')"
                >{{ header }}
                </th>
              </tr>
              </thead>
              <tbody>
              <!-- Virtual scroll spacer (top) — previewVersion dependency for reactive preview updates -->
              <tr v-if="virtualScrollTop > 0" :style="'height:' + virtualScrollTop + 'px'" :data-pv="previewVersion"><td :colspan="cachedColumnKeys.length"></td></tr>
              <tr
                v-for="(row, index) in visibleNpcTypes"
                :id="'npc-' + row.id"
                :key="row.id"
              >
                <td
                  :style="' text-align: center; ' + ([0, 1].includes(colIndex) ? ' position: sticky; z-index: 99; background-color: rgba(25,31,41, .95);' + getColumnStylingFromIndex(colIndex): '')"
                  v-for="(key, colIndex) in cachedColumnKeys"
                  v-if="cachedObjectColumns[key] !== true"
                >
                  <npc-popover
                    v-if="key === 'name'"
                    :show-image="false"
                    :show-label="false"
                    :npc="row"
                  >
                    {{ row[key] }}
                  </npc-popover>

                  <span v-if="key !== 'name'">{{ row[key] }}</span>

                  <!-- Set all values preview -->
                  <span
                    v-if="previewField === key && isPreviewValueChangeable(row[key], previewValue) && row[key] !== getTypedField(previewValue)"
                    style="color: yellow"
                    class="ml-1"
                  >-> {{
                      previewValue && isNumeric(previewValue) ? previewValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : previewValue
                    }}</span>

                  <!-- Min / Max -->
                  <span
                    v-if="previewField === key && isPreviewValueChangeable(row[key], previewMinMaxData[row.id]) && row[key] !== getTypedField(previewMinMaxData[row.id]) && previewMinMaxData[row.id]"
                    style="color: yellow"
                    class="ml-1"
                  >-> {{
                      previewMinMaxData[row.id] && isNumeric(previewMinMaxData[row.id]) ? previewMinMaxData[row.id].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : previewMinMaxData[row.id]
                    }}</span>

                  <!-- Percentage -->
                  <span
                    v-if="previewField === key && isPreviewValueChangeable(row[key], previewPercentageData[row.id]) && row[key] !== getTypedField(previewPercentageData[row.id]) && previewPercentageData[row.id]"
                    style="color: yellow"
                    class="ml-1"
                  >-> {{
                      previewPercentageData[row.id] && isNumeric(previewPercentageData[row.id]) ? previewPercentageData[row.id].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : previewPercentageData[row.id]
                    }}</span>

                </td>
              </tr>
              <!-- Virtual scroll spacer (bottom) -->
              <tr v-if="virtualScrollBottom > 0" :style="'height:' + virtualScrollBottom + 'px'"><td :colspan="cachedColumnKeys.length"></td></tr>
              </tbody>
            </table>
          </div>

        </eq-window>
      </div>

      <div class="col-5" v-if="isAnySelectorActive()">
        <npcs-bulk-editor
          @field-selected="scrollToColumnDeferred($event)"
          @set-values-preview="handleSetValuesPreview($event)"
          @set-values-commit="handleSetValuesCommit($event)"
          @set-min-max-values-preview="handleMinMaxSetValuesPreview($event)"
          @set-min-max-values-commit="handleSetValuesCommit($event)"
          @set-percentage-values-preview="handlePercentageSetValuesPreview($event)"
          @set-percentage-values-commit="handleSetValuesCommit($event)"
          :edit-feedback="bulkEditFeedback"
          v-if="selectorActive['bulk-editor']"
        />

        <!--        <eq-window title="Test!" v-if="selectorActive['bulk-editor']">-->
        <!--          Test!-->
        <!--        </eq-window>-->
      </div>
    </div>

  </div>

</template>

<script>
import EqWindow                from "../../components/eq-ui/EQWindow";
import ContentArea             from "../../components/layout/ContentArea";
import {Navbar}                from "../../app/navbar";
import {Zones}                 from "../../app/zones";
import {NpcTypeApi, Spawn2Api} from "../../app/api";
import {SpireApi}              from "../../app/api/spire-api";
import {SpireQueryBuilder}     from "../../app/api/spire-query-builder";
import Tablesort               from "@/app/utility/tablesort.js";
import DbColumnFilter          from "../../components/DbColumnFilter";
import {DbSchema}              from "../../app/db-schema";
import {ROUTE}                 from "../../routes";
import {EditFormFieldUtil} from "../../app/forms/edit-form-field-util";
import NpcsBulkEditor      from "./components/NpcsBulkEditor";
import util                from "util";
import NpcPopover              from "../../components/NpcPopover";
import {Npcs}                  from "../../app/npcs";

export default {
  name: "NPCs",
  components: { NpcPopover, NpcsBulkEditor, DbColumnFilter, ContentArea, EqWindow },
  data() {
    return {
      // route params
      zone: "",
      version: "",

      // zone data
      zoneData: {},

      // filtering
      npcTypeFields: [],
      filters: [],

      // v-models
      npcNameSearch: "",

      // preview / selectors
      selectorActive: {},

      // preview value — kept non-reactive via created() to avoid full re-renders
      // previewField, previewValue, previewMinMaxData, previewPercentageData
      // are set in created() as non-reactive properties
      bulkEditFeedback: [],

      // trigger for preview re-render (increment to force update of visible rows)
      previewVersion: 0,

      // column limit (0 = all)
      columnLimit: 25,

      // virtual scroll state
      virtualStartIndex: 0,
      virtualEndIndex: 50,
      rowHeight: 28,
      visibleRowBuffer: 10,
    }
  },

  computed: {
    allColumnKeys() {
      if (this.npcTypes && this.npcTypes.length > 0) {
        return Object.keys(this.npcTypes[0]).filter(k => {
          const val = this.npcTypes[0][k];
          return !((typeof val === 'object') && val !== null && Object.keys(val));
        });
      }
      return [];
    },
    cachedColumnKeys() {
      // Priority-ordered columns — most commonly adjusted NPC fields first
      const priority = [
        'id', 'name', 'lastname', 'level', 'race', 'class', 'hp', 'mana', 'ac',
        'mindmg', 'maxdmg', 'attack_delay', 'attack_speed', 'attack_count',
        'str', 'sta', 'dex', 'agi', '_int', 'wis', 'cha',
        'mr', 'cr', 'dr', 'fr', 'pr',
        'hp_regen_rate', 'mana_regen_rate', 'size', 'runspeed',
        'npc_spells_id', 'npc_faction_id', 'loottable_id', 'merchant_id',
        'aggroradius', 'assistradius', 'see_invis', 'see_hide',
        'special_abilities', 'npcspecialattks', 'bodytype', 'gender',
        'scalerate', 'exp_mod', 'accuracy', 'avoidance', 'atk',
        'slow_mitigation', 'maxlevel', 'rare_spawn', 'spawn_limit'
      ];
      const all = this.allColumnKeys;
      if (all.length === 0) return [];

      // Build ordered list: priority columns first, then remaining
      const allSet = new Set(all);
      const ordered = priority.filter(k => allSet.has(k));
      const remaining = all.filter(k => !new Set(ordered).has(k));
      const full = ordered.concat(remaining);

      // Also always include the preview field if set
      // Reference previewVersion to re-evaluate when preview field changes
      void this.previewVersion;
      if (this.columnLimit > 0) {
        let limited = full.slice(0, this.columnLimit);
        if (this.previewField && !limited.includes(this.previewField)) {
          limited.push(this.previewField);
        }
        return limited;
      }
      return full;
    },
    cachedObjectColumns() {
      // Pre-compute which columns are object type (to skip in rendering)
      if (this.npcTypes && this.npcTypes.length > 0) {
        const cols = {};
        const first = this.npcTypes[0];
        for (const k of Object.keys(first)) {
          const val = first[k];
          if ((typeof val === 'object') && val !== null && Object.keys(val)) {
            cols[k] = true;
          }
        }
        return cols;
      }
      return {};
    },
    visibleNpcTypes() {
      // Reference previewVersion to trigger re-render when preview data changes
      // (previewField/previewValue are non-reactive for performance)
      void this.previewVersion;
      if (!this.npcTypes) return [];
      return this.npcTypes.slice(this.virtualStartIndex, this.virtualEndIndex);
    },
    virtualScrollTop() {
      return this.virtualStartIndex * this.rowHeight;
    },
    virtualScrollBottom() {
      if (!this.npcTypes) return 0;
      return Math.max(0, (this.npcTypes.length - this.virtualEndIndex) * this.rowHeight);
    },
  },

  watch: {
    $route(to, from) {
      this.init()
    }
  },

  beforeDestroy() {
    Navbar.expand()

    if (this.interval) {
      clearInterval(this.interval)
    }
  },

  mounted() {
    this.init()
  },

  created() {

    // Non-reactive preview state (avoids full table re-render on field selection)
    this.previewField = ""
    this.previewValue = ""
    this.previewMinMaxData = {}
    this.previewPercentageData = {}

    // data
    this.npcTypes = []

    // background
    this.backgroundImages  = []
    this.currentImageIndex = 0

    // cycle background images
    this.interval = setInterval(this.setBackgroundImage, 10 * 1000)
  },

  methods: {
    getTypedField(value) {
      if (this.isFloat(value)) {
        return parseFloat(value);
      } else if (this.isNumeric(value)) {
        return parseInt(value);
      }

      return value
    },

    isPreviewValueChangeable(fieldValue, previewValue) {
      if (this.isFloat(fieldValue) && previewValue !== '') {
        return true;
      } else if (this.isNumeric(fieldValue) && previewValue !== '') {
        return true;
      } else if ((!this.isNumeric(fieldValue) && !this.isFloat(fieldValue)) && previewValue !== '') {
        return true;
      }

      return false
    },

    previewStyles(header) {
      // Removed dynamic padding — it caused full table reflow on field selection
      // The preview values (-> newValue) now display inline without extra column space
      return ''
    },

    isFloat(value) {
      return typeof value === 'number' &&
        !Number.isNaN(value) &&
        !Number.isInteger(value);
    },

    isNumeric(value) {
      return /^-?\d+$/.test(value);
    },

    async handleSetValuesCommit(e) {
      let editFeedback = []
      this.scrollToColumn(e.field)

      for (let n of this.npcTypes) {
        let newValue = e.value

        // when min / max is passed
        if (e.min) {
          newValue = this.previewMinMaxData[n.id]
        }

        // when percentage is passed
        if (e.percentage) {
          newValue = this.previewPercentageData[n.id]
        }

        editFeedback.push(
          `NPC ID (${n.id}) field [${e.field}] has changed from [${n[e.field]}] to [${newValue}]`
        )

        n[e.field] = newValue

        // float
        if (this.isFloat(newValue)) {
          n[e.field] = parseFloat(newValue)
        }
        // integer
        else if (this.isNumeric(newValue)) {
          n[e.field] = parseInt(newValue)
        }
      }

      // Batch API calls (8 concurrent)
      const batchSize = 8;
      for (let i = 0; i < this.npcTypes.length; i += batchSize) {
        const batch = this.npcTypes.slice(i, i + batchSize);
        await Promise.all(batch.map(n => Npcs.updateNpc(n.id, n)));
      }

      this.$forceUpdate()

      this.bulkEditFeedback = editFeedback

      // reset
      this.previewField = ""
      this.previewValue = ""

      // this.reset()

      // reset scroll to 0
      const container     = document.getElementById("npcs-table-container");
      container.scrollTop = 0

      this.updateQueryState()

      this.bulkEdit()
    },

    resetPulseHighlights() {
      // strip existing columns with the header
      for (let e of document.getElementsByClassName("pulsate-highlight")) {
        e.classList.remove("pulsate-highlight")
      }
    },

    handleSetValuesPreview(e) {
      // reset min max
      this.previewMinMaxData     = {}
      this.previewPercentageData = {}
      const fieldChanged = this.previewField !== e.field
      this.previewField = e.field
      this.previewValue = e.value
      // Trigger re-render when field changes (to show/hide column) or value entered
      if (fieldChanged || (e.value !== '' && e.value != null)) {
        this.previewVersion++
      }
    },
    getRandomArbitrary(min, max) {
      return Math.random() * (max - min) + min;
    },

    handleMinMaxSetValuesPreview(e) {
      // reset other previews
      this.previewValue          = ''
      this.previewPercentageData = {}

      const field = e.field
      const max   = e.max
      const min   = e.min

      this.previewField     = field
      let previewMinMaxData = {}
      for (let n of this.npcTypes) {
        previewMinMaxData[n.id] = Math.round(this.getRandomArbitrary(min, max))
      }

      this.previewMinMaxData = previewMinMaxData
      this.previewVersion++
    },
    handlePercentageSetValuesPreview(e) {
      // reset other previews
      this.previewValue      = ''
      this.previewMinMaxData = {}

      const field      = e.field
      const percentage = e.percentage

      this.previewField         = field
      let previewPercentageData = {}
      for (let n of this.npcTypes) {
        previewPercentageData[n.id] = Math.round(n[field] * percentage)
      }

      this.previewPercentageData = previewPercentageData
      this.previewVersion++
    },
    scrollToColumnDeferred(e) {
      // Ensure the preview field is set and column is visible before scrolling
      if (this.previewField !== e) {
        this.previewField = e;
      }
      // Increment previewVersion to trigger cachedColumnKeys to include this field
      this.previewVersion++;
      // Wait for Vue to re-render, then scroll
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.scrollToColumn(e);
        });
      });
    },

    scrollToColumn(e) {
      const container = document.getElementById("npcs-table-container");
      const target    = document.getElementById(util.format("column-%s", e))

      if (container && target) {
        container.scrollLeft = container.offsetLeft + target.offsetLeft - 400;

        this.resetPulseHighlights()

        // add to the target column
        target.classList.add("pulsate-highlight");
      }
    },

    bulkEdit() {
      this.setSelectorActive('bulk-editor')
    },

    reset() {
      this.npcNameSearch = ""
      this.filters       = []

      // reset
      this.previewField = ""
      this.previewValue = ""
      this.previewMinMaxData = {}
      this.previewPercentageData = {}
      this.previewVersion++

      this.resetPulseHighlights()

      this.resetPreviewComponents()
      this.updateQueryState()

      // reset scroll to 0
      const container      = document.getElementById("npcs-table-container");
      container.scrollTop  = 0
      container.scrollLeft = 0
    },

    updateQueryState: function () {
      let queryState = {};

      if (typeof this.zoneData.version !== "undefined") {
        queryState.v = this.zoneData.version
      }
      if (this.npcNameSearch !== "") {
        queryState.q = this.npcNameSearch
      }
      if (this.filters && this.filters.length > 0) {
        queryState.filters = JSON.stringify(this.filters)
      }

      this.$router.push(
        {
          path: ROUTE.NPCS_EDIT.replaceAll(":zone", this.zoneData.short_name),
          query: queryState
        }
      ).catch(() => {
      })
    },

    loadQueryState: function () {

      if (this.$route.query.q !== "") {
        this.npcNameSearch = this.$route.query.q
      }

      if (this.$route.query.filters) {
        this.filters = JSON.parse(this.$route.query.filters);
      } else {
        this.filters = [];
      }
    },

    handleDbColumnFilters(filters) {
      this.filters = filters
      this.updateQueryState()
    },

    getColumnHeaderWidth(header) {
      if (header.includes("lastname")) {
        return 'min-width: 200px; '
      }

      return ''
    },

    getColumnStylingFromIndex(index) {
      let styling = '';

      if (index === 1) {
        styling += 'left: 77px; font-weight: bold;';
      }

      if (index === 0) {
        styling += 'left: 0px; font-weight: bold;'
      }

      return styling;
    },

    doesColumnHaveObjects(data, column) {
      if (typeof column === 'object') {
        return true
      }

      return data.find((row) => {
        return typeof row[column] === 'object' && row[column] !== null && Object.keys(row[column])
      })
    },
    doesRowColumnHaveObjects(r, key) {
      return (typeof r[key] !== 'undefined') && !(typeof r[key] === 'object' && r[key] !== null && Object.keys(r[key]))
    },

    handleTableScroll() {
      if (this._scrollRaf) return;
      this._scrollRaf = requestAnimationFrame(() => {
        this._scrollRaf = null;
        const container = this.$refs.npcTableContainer;
        if (!container || !this.npcTypes || this.npcTypes.length === 0) return;
        const scrollTop = container.scrollTop;
        const viewHeight = container.clientHeight;
        const start = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.visibleRowBuffer);
        const visible = Math.ceil(viewHeight / this.rowHeight) + this.visibleRowBuffer * 2;
        const end = Math.min(this.npcTypes.length, start + visible);
        if (start !== this.virtualStartIndex || end !== this.virtualEndIndex) {
          this.virtualStartIndex = start;
          this.virtualEndIndex = end;
        }
      });
    },

    async init() {
      this.loadQueryState()

      // pull from router
      this.zone    = this.$route.params.zone
      this.version = this.$route.query.v

      // get zone data
      this.zoneData = (await Zones.getZoneByShortName(this.zone))

      Navbar.collapse()

      this.loadNpcTypes().then((r) => {
        if (this.npcTypes.length > 0) {
          if (document.getElementById('npcs-table')) {
            new Tablesort(document.getElementById('npcs-table'));
          }
        }
      })

      DbSchema.getTableColumns("npc_types").then((r) => {
        this.npcTypeFields = r
      })

      this.loadBackgroundImages().then(() => {
        this.setBackgroundImage()
      })
    },

    async loadNpcTypes() {

      // TODO: Clean this up later
      // First pass
      // We grab NPC IDs by spawn zone / version and then do a bulk call with
      // filters as a second pass
      const api   = (new Spawn2Api(...SpireApi.cfg()))
      let builder = (new SpireQueryBuilder())
      builder.where("zone", "=", this.zoneData.short_name)
      builder.where("version", "=", this.zoneData.version)
      builder.includes([
        "Spawnentries.NpcType",
      ])

      let npcTypes = [];
      let npcIds   = []
      const r      = await api.listSpawn2s(builder.get())
      if (r.status === 200 && r.data) {
        for (let spawn2 of r.data) {
          if (spawn2.spawnentries) {
            for (let spawnentry of spawn2.spawnentries) {
              if (spawnentry.npc_type) {

                // make sure we only add unique NPC IDs since spawns can use multiple
                // of the same NPC ID
                if (npcTypes.filter(f => f.id === spawnentry.npc_type.id).length === 0) {
                  npcTypes.push(
                    spawnentry.npc_type
                  )

                  npcIds.push(spawnentry.npc_type.id)
                }

              }
            }
          }
        }

        // second pass
        const npcTypeApi = (new NpcTypeApi(...SpireApi.cfg()))
        builder          = (new SpireQueryBuilder())

        if (this.filters && this.filters.length > 0) {
          this.filters.forEach((f) => {
            builder.where(f.f, f.o, f.v)
          });
        }

        if (typeof this.npcNameSearch !== "undefined" && this.npcNameSearch !== "") {
          builder.where("name", "like", this.npcNameSearch)
        }

        const rn = await npcTypeApi.getNpcTypesBulk(
          {
            body: {
              ids: npcIds
            }
          },
          {
            query: builder.get()
          }
        )
        if (rn.status === 200) {

          // sort alpha, upper case first
          rn.data = rn.data.sort((a, b) => {
            if (this.startsWithUppercase(a.name) && !this.startsWithUppercase(b.name)) {
              return -1;
            } else if (this.startsWithUppercase(b.name) && !this.startsWithUppercase(a.name)) {
              return 1;
            }
            return a.name.localeCompare(b.name);
          });

          this.npcTypes = rn.data

          // Reset virtual scroll to show first batch
          this.virtualStartIndex = 0;
          this.virtualEndIndex = Math.min(50, rn.data.length);
        }

        this.$forceUpdate()
      }
    },

    startsWithUppercase(str) {
      return str.substr(0, 1).match(/[A-Z\u00C0-\u00DC]/);
    },

    /**
     * Selectors logic
     */
    isAnySelectorActive() {
      for (const [k, v] of Object.entries(this.selectorActive)) {
        if (this.selectorActive[k]) {
          return true;
        }
      }
    },
    shouldReset() {
      return (Date.now() - this.lastResetTime) > MILLISECONDS_BEFORE_WINDOW_RESET
    },
    previewNPC(force = false) {
      if ((this.shouldReset() && !this.previewMain) || force) {
        this.resetPreviewComponents()
        this.previewMain = true
      }
    },

    resetPreviewComponents() {
      for (const [k, v] of Object.entries(this.selectorActive)) {
        this.selectorActive[k] = false
      }

      EditFormFieldUtil.resetFieldSubEditorHighlightedStatus()
    },
    setSelectorActive(selector) {
      this.resetPreviewComponents()
      this.previewMain        = false;
      this.lastResetTime            = Date.now()
      this.selectorActive[selector] = true
      this.$forceUpdate()

      EditFormFieldUtil.setFieldSubEditorHighlightedById(selector)
    },


    /**
     * Image slider background
     */
    shuffle(array) {
      let currentIndex = array.length, randomIndex;

      // While there remain elements to shuffle.
      while (currentIndex !== 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex], array[currentIndex]];
      }

      return array;
    },

    async loadBackgroundImages() {
      console.log("[EQZoneCardPreview] loadBackgroundImages")

      document.body.style.setProperty("--zone-background", "none");
      document.body.style.setProperty("--zone-background-size", "auto");

      // get zone wallpaper
      await SpireApi.v1().get('/assets/zone-images/' + encodeURIComponent(this.zoneData.long_name)).then((r) => {
        if (r.status === 200) {
          this.backgroundImages = this.shuffle(r.data.images)
        }
      })
    },
    setBackgroundImage() {
      if (this.backgroundImages && this.backgroundImages.length > 0) {
        const image = this.backgroundImages[this.currentImageIndex];
        // console.log("IMAGE ", image)

        // console.log(
        //   "[EQZoneCardPreview] loadBackgroundImages Playing index [%s] out of [%s]",
        //   this.currentImageIndex,
        //   this.backgroundImages.length
        // )

        if (image.length > 0) {
          let img     = new Image();
          img.src     = image;
          img.onload  = () => {
            // document.body.style.setProperty("--image", "url(" + image + ")");
            document.body.style.setProperty("--zone-background", "url(" + image + ")");
            document.body.style.setProperty("--zone-background-size", "cover");

            // increment
            this.currentImageIndex++;

            // reset if rollover
            if (this.currentImageIndex >= this.backgroundImages.length) {
              // console.log("[EQZoneCardPreview] loadBackgroundImages resetting")
              this.currentImageIndex = 0;
            }
          }
          img.onerror = () => {
            // console.log(
            //   "[EQZoneCardPreview] loadBackgroundImages Failed to load index [%s] out of [%s]",
            //   this.currentImageIndex,
            //   this.backgroundImages.length
            // )

            this.currentImageIndex++
            this.setBackgroundImage()
          }

        }
      }
    },
  }
}
</script>

<style>
:root {
  --zone-background-size: auto;
  --zone-background: none;
}

#npcs-table-window::before {
  content: "";

  background-size: var(--zone-background-size) !important;
  background-repeat: no-repeat !important;
  background-attachment: fixed !important;
  background-position: center !important;

  z-index: -99999;

  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  background: var(--zone-background);
  opacity: .2;

  --webkit-transition: background-image 1s ease-in-out;
  transition: background-image 1s ease-in-out;
}
</style>
