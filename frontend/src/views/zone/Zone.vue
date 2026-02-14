<template>
  <div>
    <div class="zone-editor-layout" ref="zoneLayout">
      <!-- Map Column — expands when sidebar is collapsed -->
      <div
        class="zone-map-panel"
        :style="{ flex: sidebarCollapsed ? '1 1 100%' : 'none', width: sidebarCollapsed ? '100%' : mapWidth + 'px' }"
      >
        <eq-zone-map
          v-if="zone && version"
          :zone="zone"
          :version="version"
          @npc-marker-hover="processNpcMarkerHover"
          @spell-marker-hover="processSpellMarkerHover"
        />

        <!-- Arrow overlay -->
        <svg class="zone-arrow-overlay" ref="arrowOverlay" v-if="arrowLine">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ffc832" />
            </marker>
          </defs>
          <line :x1="arrowLine.x1" :y1="arrowLine.y1" :x2="arrowLine.x2" :y2="arrowLine.y2"
                stroke="#ffc832" stroke-width="2" stroke-dasharray="6,4" opacity="0.7" marker-end="url(#arrowhead)" />
        </svg>

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

      <!-- Draggable Splitter -->
      <div
        v-show="!sidebarCollapsed"
        class="zone-splitter"
        :class="{ 'zone-splitter-active': isDragging }"
        @mousedown.prevent="startDrag"
      >
        <div class="zone-splitter-handle"></div>
      </div>

      <!-- Sidebar Column -->
      <div
        v-show="!sidebarCollapsed"
        class="zone-sidebar"
        :style="{ flex: '1 1 0%', minWidth: '250px' }"
      >
        <!-- Sidebar header with collapse button -->
        <div class="zone-sidebar-header">
          <span class="zone-sidebar-title eq-header" v-if="zoneData" style="font-size: 16px; margin: 0; padding: 0;">
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
      mapWidth: 0,
      isDragging: false,
      arrowLine: null,
    }
  },
  beforeDestroy() {
    Navbar.expand()
    EventBus.$off("NPC_SHOW_CARD", this.handleNpcShowCardEvent);
    EventBus.$off("SIDEBAR_HOVER_ARROW", this.handleSidebarArrow);
    EventBus.$off("SIDEBAR_HOVER_ARROW_CLEAR", this.clearArrow);
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    window.removeEventListener('resize', this.initSplitWidth);
  },
  created() {
    this.npc           = {}
    this.lastResetTime = Date.now()
    EventBus.$on("NPC_SHOW_CARD", this.handleNpcShowCardEvent);

    // Restore saved split ratio
    const saved = localStorage.getItem('zone-editor-split-ratio');
    if (saved) {
      this._savedRatio = parseFloat(saved);
    }
  },
  watch: {
    '$route'() {
      this.init()
    },
    sidebarCollapsed(collapsed) {
      if (collapsed) {
        // Clear saved ratio on collapse so expand always uses default
        this._savedRatio = null;
        localStorage.removeItem('zone-editor-split-ratio');
      } else {
        // Expanding — always use default 1/5 panel width
        this._savedRatio = 0.80;
        this.$nextTick(() => {
          const layout = this.$refs.zoneLayout;
          if (layout) {
            const totalWidth = layout.clientWidth;
            this.mapWidth = Math.round((totalWidth - 10) * 0.80);
          }
          this.$nextTick(() => {
            window.dispatchEvent(new Event('resize'));
          });
        });
      }
    },
  },

  mounted() {
    this.init()
    this.$nextTick(() => {
      this.initSplitWidth();
    });
    window.addEventListener('resize', this.initSplitWidth);
    EventBus.$on("SIDEBAR_HOVER_ARROW", this.handleSidebarArrow);
    EventBus.$on("SIDEBAR_HOVER_ARROW_CLEAR", this.clearArrow);
  },

  methods: {
    handleSidebarArrow(data) {
      // data: { sourceEl (DOM element), lat, lng }
      const layout = this.$refs.zoneLayout
      if (!layout) return
      const layoutRect = layout.getBoundingClientRect()

      // Get source element position (sidebar item)
      const srcRect = data.sourceEl.getBoundingClientRect()
      const x1 = srcRect.left - layoutRect.left
      const y1 = srcRect.top - layoutRect.top + srcRect.height / 2

      // Ask map for marker pixel position
      EventBus.$emit("MAP_GET_PIXEL", {
        lat: data.lat,
        lng: data.lng,
        callback: (point, mapContainer) => {
          if (!point || !mapContainer) { this.arrowLine = null; return }
          const mapRect = mapContainer.getBoundingClientRect()
          const x2 = point.x + mapRect.left - layoutRect.left
          const y2 = point.y + mapRect.top - layoutRect.top
          this.arrowLine = { x1, y1, x2, y2 }
        }
      })
    },

    clearArrow() {
      this.arrowLine = null
    },

    initSplitWidth() {
      const layout = this.$refs.zoneLayout;
      if (!layout) return;
      const totalWidth = layout.clientWidth;
      const ratio = this._savedRatio || 0.80;
      // Account for splitter width (10px)
      this.mapWidth = Math.round((totalWidth - 10) * ratio);
    },

    startDrag(e) {
      this.isDragging = true;
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },

    onDrag(e) {
      if (!this.isDragging) return;
      const layout = this.$refs.zoneLayout;
      if (!layout) return;
      const rect = layout.getBoundingClientRect();
      const totalWidth = rect.width;
      const minMap = 300;
      const minSidebar = 250;
      let newMapWidth = e.clientX - rect.left;
      // If dragged past collapse threshold, snap sidebar closed
      const collapseThreshold = totalWidth - 150;
      if (newMapWidth > collapseThreshold) {
        this.sidebarCollapsed = true;
        this.stopDrag();
        return;
      }
      // Clamp
      newMapWidth = Math.max(minMap, Math.min(newMapWidth, totalWidth - minSidebar - 10));
      this.mapWidth = newMapWidth;
      // Save ratio
      const ratio = newMapWidth / (totalWidth - 10);
      localStorage.setItem('zone-editor-split-ratio', ratio.toFixed(4));
      this._savedRatio = ratio;
      // Trigger map resize
      window.dispatchEvent(new Event('resize'));
    },

    stopDrag() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    },


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
.zone-arrow-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
}

.zone-editor-layout {
  position: relative;
  display: flex;
  width: 100%;
  height: calc(100vh - 50px);
  overflow: hidden;
}

.zone-map-panel {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.zone-splitter {
  flex: 0 0 10px;
  background: rgba(255, 255, 255, 0.08);
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
  z-index: 10;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.zone-splitter:hover,
.zone-splitter-active {
  background: rgba(255, 200, 50, 0.2);
  border-left-color: rgba(255, 200, 50, 0.4);
  border-right-color: rgba(255, 200, 50, 0.4);
}

.zone-splitter-handle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.zone-splitter-handle::before,
.zone-splitter-handle::after {
  content: '';
  display: block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: background 0.2s ease;
}

.zone-splitter-handle::before {
  box-shadow: 0 -7px 0 rgba(255, 255, 255, 0.3);
}

.zone-splitter-handle::after {
  box-shadow: 0 7px 0 rgba(255, 255, 255, 0.3);
}

.zone-splitter:hover .zone-splitter-handle::before,
.zone-splitter:hover .zone-splitter-handle::after,
.zone-splitter-active .zone-splitter-handle::before,
.zone-splitter-active .zone-splitter-handle::after {
  background: rgba(255, 200, 50, 0.7);
}

.zone-splitter:hover .zone-splitter-handle::before,
.zone-splitter-active .zone-splitter-handle::before {
  box-shadow: 0 -7px 0 rgba(255, 200, 50, 0.7);
}

.zone-splitter:hover .zone-splitter-handle::after,
.zone-splitter-active .zone-splitter-handle::after {
  box-shadow: 0 7px 0 rgba(255, 200, 50, 0.7);
}

.zone-sidebar {
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
