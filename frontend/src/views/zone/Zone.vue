<template>
  <div>
    <div class="row no-gutters">
      <!-- Map Column — expands when sidebar is collapsed -->
      <div :class="sidebarCollapsed ? 'col-12' : 'col-9'" style="transition: all 0.3s ease;">
        <eq-zone-map
          v-if="zone && version"
          :zone="zone"
          :version="version"
          @npc-marker-hover="processNpcMarkerHover"
          @spell-marker-hover="processSpellMarkerHover"
        />

        <!-- Sidebar toggle (when collapsed) -->
        <b-button
          v-if="sidebarCollapsed"
          class="zone-sidebar-toggle-open btn-dark btn-sm"
          @click="sidebarCollapsed = false"
          title="Show sidebar"
        >
          <i class="fa fa-chevron-left"></i>
        </b-button>
      </div>

      <!-- Sidebar Column -->
      <div
        v-show="!sidebarCollapsed"
        class="col-3 zone-sidebar"
      >
        <!-- Sidebar header with collapse button -->
        <div class="zone-sidebar-header">
          <span class="zone-sidebar-title" v-if="zoneData">
            {{ zoneData.long_name || zone }}
          </span>
          <b-button
            class="btn-dark btn-sm ml-auto"
            @click="sidebarCollapsed = true"
            title="Collapse sidebar"
          >
            <i class="fa fa-chevron-right"></i>
          </b-button>
        </div>

        <!-- Zone Card -->
        <eq-zone-card-preview
          style="height: 92vh; overflow-y: auto;"
          v-show="selectorActive['zone-preview'] && zoneData"
          :zone="zoneData"
        />

        <eq-window
          v-if="!isZoneCardActive()"
          class="text-center"
        >
          <b-button
            class="btn-dark btn-sm btn-dark"
            @click="setSelectorActive('zone-preview', true)"
          >
            <i class="fa fa-chevron-up"></i> Return to Zone
          </b-button>
        </eq-window>

        <!-- NPC Preview -->
        <eq-window
          class="fade-in"
          id="preview-pane"
          :style="'max-height: ' + (isZoneCardActive() ? '91' : '83') + 'vh; overflow-y: scroll; overflow-x: hidden'"
          v-if="selectorActive['npc-hover'] && npc"
        >
          <eq-npc-card-preview
            :npc="npc"
          />
        </eq-window>

        <!-- Spell Preview -->
        <eq-window
          class="fade-in"
          id="preview-pane"
          :style="'max-height: ' + (isZoneCardActive() ? '91' : '83') + 'vh; overflow-y: scroll; overflow-x: hidden'"
          v-if="selectorActive['spell-hover'] && spell"
        >
          <eq-spell-preview
            :spell-data="spell"
          />
        </eq-window>
      </div>
    </div>
  </div>
</template>

<script>
import ContentArea       from "../../components/layout/ContentArea";
import EqWindow          from "../../components/eq-ui/EQWindow";
import {Navbar}          from "../../app/navbar";
import EqZoneMap         from "../../components/EqZoneMap";
import EqNpcCardPreview  from "../../components/preview/EQNpcCardPreview";
import EqSpellPreview    from "../../components/preview/EQSpellCardPreview";
import {Zones}           from "../../app/zones";
import EqZoneCardPreview from "../../components/preview/EQZoneCardPreview";
import {EventBus}        from "../../app/event-bus/event-bus";

const MILLISECONDS_BEFORE_WINDOW_RESET = 5000;

export default {
  name: "Zone",
  components: { EqZoneCardPreview, EqSpellPreview, EqNpcCardPreview, EqZoneMap, EqWindow, ContentArea },
  data() {
    return {
      zone: "",
      version: "",
      zoneData: {},
      selectorActive: {},
      sidebarCollapsed: false,
    }
  },
  beforeDestroy() {
    Navbar.expand()
    EventBus.$off("NPC_SHOW_CARD", this.handleNpcShowCardEvent);
  },
  created() {
    this.npc           = {}
    this.lastResetTime = Date.now()
    EventBus.$on("NPC_SHOW_CARD", this.handleNpcShowCardEvent);
  },
  watch: {
    '$route'() {
      this.init()
    },
  },

  mounted() {
    this.init()
  },

  methods: {

    isZoneCardActive() {
      return Object.keys(this.selectorActive).length > 0 && this.selectorActive['zone-preview']
    },

    handleNpcShowCardEvent(e) {
      this.processNpcMarkerHover(e)
    },

    previewZone() {
      this.setSelectorActive('zone-preview')
    },

    async init() {
      this.npc   = {}
      this.spell = {}
      this.resetSelectors()

      Navbar.collapse()

      this.zone    = this.$route.params.zone
      this.version = this.$route.query.v || "0"

      this.zoneData = (await Zones.getZoneByShortName(this.zone))

      this.setSelectorActive('zone-preview', true)
    },

    shouldReset() {
      return (Date.now() - this.lastResetTime) > MILLISECONDS_BEFORE_WINDOW_RESET
    },

    resetSelectors() {
      for (const [k, v] of Object.entries(this.selectorActive)) {
        this.selectorActive[k] = false
      }
    },

    setSelectorActive(selector, force = false) {
      if (this.selectorActive[selector] && !force) {
        return
      }

      if (this.shouldReset() || force) {
        this.lastResetTime = Date.now()
        this.resetSelectors()
        this.selectorActive[selector] = true
        this.$forceUpdate()
        return
      }
    },

    processSpellMarkerHover(s) {
      this.spell = {}
      this.setSelectorActive("spell-hover", true)
      this.spell = s

      const t = document.getElementById("preview-pane");
      if (t) {
        t.scrollTop = 0;
      }
    },

    processNpcMarkerHover(n) {
      this.npc = {}
      this.setSelectorActive("npc-hover", true)
      this.npc = n

      const t = document.getElementById("preview-pane");
      if (t) {
        t.scrollTop = 0;
      }
    }
  }
}
</script>

<style scoped>
.zone-sidebar {
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.zone-sidebar-header {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.zone-sidebar-title {
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.zone-sidebar-toggle-open {
  position: fixed;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 999;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.zone-sidebar-toggle-open:hover {
  opacity: 1;
}

/* ============================================
   Zone Editor Sidebar — Visual Polish
   All styles scoped via .zone-sidebar >>> deep
   to avoid touching shared components
   ============================================ */

/* --- Tabs --- */
.zone-sidebar >>> .eq-tab-box-fancy ul {
  display: flex !important;
  flex-wrap: wrap !important;
  padding: 0 4px !important;
  margin: 0 0 6px 0 !important;
  gap: 3px !important;
}

.zone-sidebar >>> .eq-tab-box-fancy ul li {
  flex: 0 0 auto !important;
  white-space: nowrap !important;
  border-radius: 3px !important;
  transition: background 0.15s ease !important;
}

.zone-sidebar >>> .eq-tab-box-fancy ul li a {
  font-size: 11.5px !important;
  padding: 3px 7px !important;
  display: block !important;
  border-radius: 3px !important;
}

.zone-sidebar >>> .eq-tab-box-fancy ul li:hover {
  background: rgba(255, 255, 255, 0.08) !important;
}

.zone-sidebar >>> .eq-tab-box-fancy ul li.eq-tab-open {
  background: rgba(255, 200, 50, 0.15) !important;
}

.zone-sidebar >>> .eq-tab-box-fancy ul li.eq-tab-open a {
  color: #ffc832 !important;
  font-weight: 600 !important;
}

/* --- Zone Title --- */
.zone-sidebar >>> .eq-header {
  font-size: 15px !important;
  margin-bottom: 4px !important;
  letter-spacing: 0.5px !important;
}

/* --- NPC Table --- */
.zone-sidebar >>> #npctable {
  font-size: 13px !important;
}

.zone-sidebar >>> #npctable td {
  padding: 4px 6px !important;
  vertical-align: middle !important;
}

.zone-sidebar >>> #npctable .btn-sm {
  padding: 2px 5px !important;
  font-size: 11px !important;
  margin-left: 4px !important;
}

.zone-sidebar >>> #npctable .btn-sm:first-child {
  margin-left: 0 !important;
}

.zone-sidebar >>> #npctable th {
  padding: 6px !important;
  font-size: 12px !important;
}

/* --- Zone Tab Properties --- */
.zone-sidebar >>> .tabs-details .row {
  margin-bottom: 1px !important;
  line-height: 1.4 !important;
}

.zone-sidebar >>> .tabs-details .font-weight-bold {
  font-size: 11.5px !important;
  color: #c0c0c0 !important;
}

.zone-sidebar >>> .tabs-details .col-6.text-right .font-weight-bold {
  color: #999 !important;
}

.zone-sidebar >>> .tabs-details .col-6.pl-0 {
  color: #e0e0e0 !important;
  font-size: 12px !important;
}

/* Bool checkboxes section */
.zone-sidebar >>> .tabs-details .col-11 .font-weight-bold {
  font-size: 11.5px !important;
}

/* Right-side numeric values */
.zone-sidebar >>> .tabs-details .col-1.pl-0 {
  font-size: 12px !important;
  color: #ffc832 !important;
  font-weight: 600 !important;
}

/* Section spacing in Zone tab */
.zone-sidebar >>> .tabs-details .mt-3 {
  margin-top: 8px !important;
}

/* --- Fog Colors Panel --- */
.zone-sidebar >>> .fog-slots {
  display: flex !important;
  gap: 6px !important;
  justify-content: center !important;
}

.zone-sidebar >>> .fog-color-swatch {
  width: 36px !important;
  height: 36px !important;
  border-radius: 4px !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.zone-sidebar >>> .fog-slot-label {
  font-size: 10px !important;
  text-align: center !important;
  margin-top: 2px !important;
}

.zone-sidebar >>> .fog-slot-clip {
  font-size: 9px !important;
  text-align: center !important;
  opacity: 0.6 !important;
}

/* --- Weather Table --- */
.zone-sidebar >>> .weather-table {
  font-size: 11px !important;
  width: 100% !important;
}

.zone-sidebar >>> .weather-table th {
  font-size: 10px !important;
  padding: 3px 6px !important;
  opacity: 0.7 !important;
}

.zone-sidebar >>> .weather-table td {
  padding: 2px 6px !important;
  font-size: 11px !important;
}

/* --- Scrollbar polish --- */
.zone-sidebar >>> ::-webkit-scrollbar {
  width: 5px !important;
}

.zone-sidebar >>> ::-webkit-scrollbar-track {
  background: transparent !important;
}

.zone-sidebar >>> ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15) !important;
  border-radius: 3px !important;
}

.zone-sidebar >>> ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25) !important;
}
</style>
