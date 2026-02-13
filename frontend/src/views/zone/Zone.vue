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
      this.version = this.$route.query.v

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

/* Zone sidebar tab styling — fix squished tabs */
.zone-sidebar >>> .eq-tab-box-fancy ul {
  display: flex !important;
  flex-wrap: wrap !important;
  padding: 0 !important;
  margin: 0 0 10px 0 !important;
}

.zone-sidebar >>> .eq-tab-box-fancy ul li {
  flex: 0 0 auto !important;
  white-space: nowrap !important;
}

.zone-sidebar >>> .eq-tab-box-fancy ul li a {
  font-size: 12px !important;
  padding: 4px 8px !important;
}
</style>
