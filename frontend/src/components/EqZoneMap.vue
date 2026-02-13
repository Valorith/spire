<template>
  <div class="zone-map-container">
    <eq-window class="p-2" style="height: 96vh">

      <!-- Loader -->
      <eq-window
        class="text-center"
        style="position: absolute; right: 3%; z-index: 99; padding: 15px; padding-top: 10px;"
        v-if="!isDataLoaded()"
      >
        <div class="mb-2">
          {{ isDataLoaded() ? 'Rendering map...' : 'Loading map...' }}
        </div>
        <loader-fake-progress v-if="!isDataLoaded()"/>
        <eq-progress-bar :percent="100" v-if="isDataLoaded()"/>
      </eq-window>

      <!-- Layer Controls (floating top-right) -->
      <div class="layer-controls" v-if="isDataLoaded()">
        <div class="layer-controls-header" @click="layerPanelOpen = !layerPanelOpen">
          <i class="fa fa-layer-group"></i>
          <span v-if="layerPanelOpen"> Layers</span>
          <i :class="layerPanelOpen ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" class="ml-1"></i>
        </div>
        <div v-if="layerPanelOpen" class="layer-controls-body">
          <label
            v-for="layer in layerDefs"
            :key="layer.key"
            class="layer-toggle"
            :title="layer.label + ' (' + getLayerCount(layer.key) + ')'"
          >
            <input
              type="checkbox"
              :checked="layers[layer.key]"
              @change="toggleLayer(layer.key)"
            />
            <i :class="layer.icon" :style="{ color: layer.color }"></i>
            <span>{{ layer.label }}</span>
            <span class="layer-count">({{ getLayerCount(layer.key) }})</span>
          </label>
        </div>
      </div>

      <!-- Map Search Overlay (floating top-left) -->
      <div class="map-search-overlay" v-if="isDataLoaded()">
        <div class="map-search-input-wrap">
          <i class="fa fa-search"></i>
          <input
            type="text"
            class="map-search-input"
            placeholder="Search NPCs, doors..."
            v-model="mapSearchText"
            @input="onMapSearch"
            @keyup.escape="clearMapSearch"
          />
          <i
            v-if="mapSearchText"
            class="fa fa-times map-search-clear"
            @click="clearMapSearch"
          ></i>
        </div>
        <div class="map-search-results" v-if="mapSearchResults.length > 0">
          <div
            v-for="(r, i) in mapSearchResults.slice(0, 20)"
            :key="i"
            class="map-search-result-item"
            @click="zoomToSearchResult(r)"
          >
            <i :class="r.icon" :style="{ color: r.color }"></i>
            <span>{{ r.label }}</span>
            <span class="map-search-result-type">{{ r.type }}</span>
          </div>
          <div v-if="mapSearchResults.length > 20" class="map-search-more">
            ... and {{ mapSearchResults.length - 20 }} more
          </div>
        </div>
      </div>

      <!-- Coordinate Display (floating bottom-left) -->
      <div class="coord-display" v-if="isDataLoaded() && mouseCoords">
        <span class="coord-label">X:</span> {{ mouseCoords.x.toFixed(1) }}
        <span class="coord-label ml-2">Y:</span> {{ mouseCoords.y.toFixed(1) }}
        <span class="coord-label ml-2">Z:</span> {{ zoomLevel.toFixed(0) }}
      </div>

      <div class="card">
        <l-map
          v-if="center"
          ref="leafletMap"
          :crs="crs"
          style="height: 94vh"
          class="map-tiles"
          :center="center"
          :bounds="bounds"
          :min-zoom="-5"
          :zoom="zoom"
          :zoom-animation="true"
          :zoom-animation-threshold="10"
          @update:zoom="zoomUpdate"
          @mousemove="onMapMouseMove"
        >

          <!-- Draw map lines -->
          <l-polyline
            v-if="lines && layers.mapLines"
            :lat-lngs="lines"
            color="gray"
            :weight="1"
          />

          <!-- grid points -->
          <l-marker
            v-for="(m, index) in pathingGridMarkers"
            :key="'grid-' + index + '-' + m.point.lat + '-' + m.point.lng"
            :lat-lng="m.point"
            v-if="markers && markers.length > 0 && layers.pathing"
          >
            <l-tooltip :options="{ permanent: true, interactive: true }">
              {{ m.label }}
            </l-tooltip>
          </l-marker>

          <!-- Draw pathing grid lines -->
          <l-polyline
            v-if="pathingGridLines && layers.pathing"
            :lat-lngs="pathingGridLines"
            color="blue"
            dashArray="5, 10"
            :opacity=".8"
            :weight="2"
          />

          <!-- zone points -->
          <l-marker
            v-for="(m, index) in zonelineMarkers"
            :key="'zp-' + index"
            :lat-lng="m.point"
            v-if="markers && markers.length > 0 && layers.zonePoints"
            @click="navigateToZone(m.zone.short_name, m.zone.version)"
          >
            <l-tooltip>
              <eq-window class="zone-point-tooltip">
                <div class="zone-point-direction">
                  <i class="fa fa-arrow-right" style="color: #60a5fa"></i>
                  <span>{{ m.zone.long_name || m.zone.short_name }}</span>
                </div>
                <div class="zone-point-type">Zone Line (click to travel)</div>
              </eq-window>
            </l-tooltip>
          </l-marker>

          <!-- door zone points -->
          <l-marker
            v-for="(m, index) in doorZonePoints"
            :key="'dzp-' + index + '-' + m.destName + '-' + m.destInstance"
            :lat-lng="m.point"
            v-if="markers && markers.length > 0 && layers.zonePoints"
            @click="navigateToZone(m.destName, m.destInstance)"
          >
            <l-tooltip>
              <eq-window class="zone-point-tooltip">
                <div class="zone-point-direction">
                  <i class="fa fa-door-open" style="color: #fb923c"></i>
                  <span>{{ m.label }}</span>
                </div>
                <div class="zone-point-type">Door Teleport (click to travel)</div>
              </eq-window>
            </l-tooltip>
          </l-marker>

          <!-- NPC markers -->
          <l-marker
            v-for="(marker, index) in npcMarkers"
            :key="'npc-' + index + '-' + marker.npc.id"
            :lat-lng="marker.point"
            :opacity="getNpcOpacity(index + '-' + marker.npc.id, marker.npc.id)"
            @mouseover="npcMarkerHover(marker, index + '-' + marker.npc.id)"
            v-if="npcMarkers && npcMarkers.length > 0 && layers.npcs && isNpcVisible(marker)"
          >
            <l-tooltip>
              <eq-window class="npc-tooltip-enhanced">
                <div class="npc-tooltip-name">{{ getCleanName(marker.npc.name) }}</div>
                <div class="npc-tooltip-info">
                  <span>Lvl {{ marker.npc.level }}{{ marker.npc.maxlevel && marker.npc.maxlevel > marker.npc.level ? '-' + marker.npc.maxlevel : '' }}</span>
                  <span :style="{ color: getNpcLevelColor(marker.npc.level) }" class="npc-tooltip-dot">●</span>
                  <span v-if="marker.npc.hp">HP: {{ marker.npc.hp.toLocaleString() }}</span>
                </div>
              </eq-window>
            </l-tooltip>

            <l-icon
              icon-url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              :class-name="(zoomLevel >= 1) ? marker.iconClass : marker.iconClass + '-sm'"
              :iconSize="(zoomLevel >= 1) ? marker.iconSize : calcSmallIcons(marker.iconSize)"
            >
            </l-icon>

          </l-marker>

          <!-- Door markers -->
          <l-marker
            v-for="(marker, index) in doorMarkers"
            :key="'door-' + index + '-' + marker.name"
            :lat-lng="marker.point"
            v-if="doorMarkers && doorMarkers.length > 0 && layers.doors"
          >
            <l-tooltip>
              <eq-window>
                {{ marker.label }}
              </eq-window>
            </l-tooltip>

            <l-icon
              icon-url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              :class-name="marker.iconClass"
              :iconSize="marker.iconSize"
            >
            </l-icon>
          </l-marker>

          <!-- Translocate markers -->
          <l-marker
            v-for="(m, index) in translocatePoints"
            :key="'spell-' + index + '-' + m.label"
            :lat-lng="m.point"
            @mouseover="spellMarkerHover(m.spell)"
            v-if="translocatePoints && translocatePoints.length > 0 && layers.spells"
            style="border-radius: 10px"
          >
            <l-tooltip>
              <eq-window>
                {{ m.label }}
              </eq-window>
            </l-tooltip>

            <l-icon
              icon-url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              :class-name="m.iconClass"
              :iconSize="m.iconSize"
            >
            </l-icon>
          </l-marker>

          <!-- Safe coordinate markers -->
          <l-marker
            v-for="(m, index) in safeCoordinateMarker"
            :key="'safe-' + index + '-' + m.label"
            :lat-lng="m.point"
            v-if="safeCoordinateMarker && safeCoordinateMarker.length > 0 && layers.safeCoords"
            style="border-radius: 10px"
          >
            <l-tooltip>
              <eq-window>
                {{ m.label }}
              </eq-window>
            </l-tooltip>

            <l-icon
              icon-url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              :class-name="m.iconClass"
              :iconSize="m.iconSize"
            >
            </l-icon>
          </l-marker>

          <!-- Search highlight marker -->
          <l-marker
            v-if="searchHighlight"
            :lat-lng="searchHighlight.point"
            :z-index-offset="9999"
          >
            <l-tooltip :options="{ permanent: true, interactive: true }">
              <eq-window class="search-highlight-tooltip">
                <i class="fa fa-crosshairs"></i> {{ searchHighlight.label }}
              </eq-window>
            </l-tooltip>
          </l-marker>

        </l-map>
      </div>
    </eq-window>
  </div>
</template>

<script>
import {LIcon, LMap, LMarker, LPolyline, LPopup, LTileLayer, LTooltip} from 'vue2-leaflet';
import ContentArea                                                     from "./layout/ContentArea";
import * as L                                                          from "leaflet";
import axios                                                           from "axios";
import {GridEntryApi, Spawn2Api, SpellsNewApi, ZonePointApi} from "../app/api";
import {SpireApi}                                            from "../app/api/spire-api";
import {SpireQueryBuilder}                                   from "../app/api/spire-query-builder";
import EqNpcCardPreview                                      from "./preview/EQNpcCardPreview";
import EqWindow                                              from "./eq-ui/EQWindow";
import LoaderFakeProgress                                    from "./LoaderFakeProgress";
import EqProgressBar                                         from "./eq-ui/EQProgressBar";
import {Npcs}                                                from "../app/npcs";
import {Zones}                                               from "../app/zones";
import {DoorApi}                                             from "../app/api/api/door-api";
import {EventBus}                                            from "../app/event-bus/event-bus";
import {Spawn}                                               from "../app/spawn";

// NPC level color thresholds
const LEVEL_COLORS = [
  { max: 10, color: '#4ade80' },   // green - low level
  { max: 20, color: '#a3e635' },   // lime
  { max: 30, color: '#facc15' },   // yellow
  { max: 40, color: '#fb923c' },   // orange
  { max: 50, color: '#f87171' },   // red
  { max: 60, color: '#c084fc' },   // purple
  { max: 70, color: '#818cf8' },   // indigo
  { max: 255, color: '#f472b6' },  // pink - raid
];

export default {
  name: "EqZoneMap",
  props: {
    zone: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true
    },
  },
  components: {
    EqProgressBar,
    LoaderFakeProgress,
    EqWindow,
    EqNpcCardPreview,
    ContentArea,
    LMap,
    LIcon,
    LMarker,
    LPopup,
    LTooltip,
    LTileLayer,
    LPolyline
  },
  data() {
    return {
      zoom: 0,
      center: null,
      hoveredNpc: "",
      zoomedNpcId: 0,
      starterZoomLevel: -100,
      zoomLevel: 0,
      bounds: null,
      crs: L.CRS.Simple,
      icon: L.icon({
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        className: this.zoomLevel >= 2 ? 'item-4472' : 'item-4472-sm'
      }),
      map: "",
      markers: null,
      raceIconSizes: {},

      // Layer visibility
      layers: {
        npcs: true,
        doors: true,
        zonePoints: true,
        spells: true,
        safeCoords: true,
        pathing: true,
        mapLines: true,
      },
      layerPanelOpen: true,
      layerDefs: [
        { key: 'npcs',       label: 'NPCs',         icon: 'fa fa-users',      color: '#4ade80' },
        { key: 'doors',      label: 'Doors',         icon: 'fa fa-door-open',  color: '#fb923c' },
        { key: 'zonePoints', label: 'Zone Points',   icon: 'fa fa-map-signs',  color: '#60a5fa' },
        { key: 'spells',     label: 'Spells',        icon: 'fa fa-magic',      color: '#c084fc' },
        { key: 'safeCoords', label: 'Safe Coords',   icon: 'fa fa-shield-alt', color: '#facc15' },
        { key: 'pathing',    label: 'Pathing Grids',  icon: 'fa fa-route',      color: '#38bdf8' },
        { key: 'mapLines',   label: 'Map Lines',      icon: 'fa fa-draw-polygon', color: '#94a3b8' },
      ],

      // Coordinate display
      mouseCoords: null,

      // Map search
      mapSearchText: '',
      mapSearchResults: [],
      searchHighlight: null,
    }
  },
  watch: {
    zone: {
      handler(newVal) {
        this.loadMap()
      },
      deep: true
    },
  },

  methods: {

    // --- Layer controls ---
    toggleLayer(key) {
      this.$set(this.layers, key, !this.layers[key])
      // Persist to localStorage
      try {
        localStorage.setItem('zone-editor-layers', JSON.stringify(this.layers))
      } catch (e) {}
    },

    loadLayerState() {
      try {
        const saved = localStorage.getItem('zone-editor-layers')
        if (saved) {
          const parsed = JSON.parse(saved)
          for (const k of Object.keys(this.layers)) {
            if (typeof parsed[k] === 'boolean') {
              this.$set(this.layers, k, parsed[k])
            }
          }
        }
      } catch (e) {}
    },

    getLayerCount(key) {
      switch (key) {
        case 'npcs': return (this.npcMarkers || []).length
        case 'doors': return (this.doorMarkers || []).length
        case 'zonePoints': return (this.zonelineMarkers || []).length + (this.doorZonePoints || []).length
        case 'spells': return (this.translocatePoints || []).length
        case 'safeCoords': return (this.safeCoordinateMarker || []).length
        case 'pathing': return (this.pathingGridMarkers || []).length
        case 'mapLines': return (this.lines || []).length
        default: return 0
      }
    },

    // --- Coordinate display ---
    onMapMouseMove(e) {
      if (e && e.latlng) {
        // EQ coords: x = -lng, y = -lat (map uses negated coords)
        this.mouseCoords = {
          x: -e.latlng.lng,
          y: -e.latlng.lat
        }
      }
    },

    // --- NPC level color coding ---
    getNpcLevelColor(level) {
      for (const t of LEVEL_COLORS) {
        if (level <= t.max) return t.color
      }
      return '#94a3b8'
    },

    isNpcVisible(marker) {
      // For future filtering — currently all visible
      if (this.mapSearchText && this.searchHighlight) {
        // When search is active, still show all NPCs but the search result is highlighted
        return true
      }
      return true
    },

    // --- Map Search ---
    onMapSearch() {
      const q = (this.mapSearchText || '').toLowerCase().trim()
      if (!q) {
        this.mapSearchResults = []
        this.searchHighlight = null
        return
      }

      let results = []

      // Search NPCs
      if (this.npcMarkers) {
        for (const m of this.npcMarkers) {
          const name = Npcs.getCleanName(m.npc.name || '').toLowerCase()
          if (name.includes(q)) {
            results.push({
              label: Npcs.getCleanName(m.npc.name),
              type: 'NPC (Lvl ' + m.npc.level + ')',
              icon: 'fa fa-users',
              color: this.getNpcLevelColor(m.npc.level),
              point: m.point,
              npc: m.npc,
              marker: m,
            })
          }
        }
      }

      // Search Doors
      if (this.doorMarkers) {
        for (const m of this.doorMarkers) {
          if ((m.label || '').toLowerCase().includes(q)) {
            results.push({
              label: m.label,
              type: 'Door',
              icon: 'fa fa-door-open',
              color: '#fb923c',
              point: m.point,
            })
          }
        }
      }

      // Search Zone Points
      if (this.zonelineMarkers) {
        for (const m of this.zonelineMarkers) {
          if ((m.label || '').toLowerCase().includes(q)) {
            results.push({
              label: m.label,
              type: 'Zone Point',
              icon: 'fa fa-map-signs',
              color: '#60a5fa',
              point: m.point,
            })
          }
        }
      }

      // Search Spells
      if (this.translocatePoints) {
        for (const m of this.translocatePoints) {
          if ((m.label || '').toLowerCase().includes(q)) {
            results.push({
              label: m.label,
              type: 'Spell',
              icon: 'fa fa-magic',
              color: '#c084fc',
              point: m.point,
            })
          }
        }
      }

      this.mapSearchResults = results
    },

    clearMapSearch() {
      this.mapSearchText = ''
      this.mapSearchResults = []
      this.searchHighlight = null
    },

    zoomToSearchResult(result) {
      this.searchHighlight = result

      // Zoom to the result
      this.center = result.point

      // Zoom in
      setTimeout(() => {
        this.zoom = 1
      }, 300)

      // If it's an NPC, trigger the hover
      if (result.npc && result.marker) {
        this.npcMarkerHover(result.marker, 'search-' + result.npc.id)
      }
    },

    // --- Original methods ---

    handleNpcZoomEvent(e) {
      this.zoomedNpcId = e.id

      for (let n of this.npcMarkers) {
        if (n.npc.id === e.id) {
          this.zoom = this.starterZoomLevel

          setTimeout(() => {
            this.center = n.point
          }, 600)

          setTimeout(() => {
            this.zoom = 1
          }, 1000)

          break;
        }
      }
    },

    getNpcOpacity(elementKey, npcId) {
      if (this.zoomedNpcId === npcId) {
        return 1;
      }

      if (this.zoomedNpcId > 0 && this.zoomedNpcId !== npcId) {
        return .3;
      }

      if (this.hoveredNpc === "") {
        return 1;
      }

      if (this.hoveredNpc !== "" && this.hoveredNpc !== elementKey) {
        return .3;
      }

      return 1;
    },

    isDataLoaded() {
      return this.npcMarkers
    },

    navigateToZone(shortName, version) {
      this.$router.push(
        {
          path: `/zone/${shortName}?v=${version}`
        }
      ).catch(() => {
      })
    },

    getCleanName(n) {
      return Npcs.getCleanName(n)
    },

    npcMarkerHover(e, elementKey) {
      this.hoveredNpc  = ""
      this.zoomedNpcId = 0
      if (this.pathingGridLines.length > 0) {
        this.pathingGridLines   = []
        this.pathingGridMarkers = []
        this.$forceUpdate()
      }

      if (e.grid > 0) {
        let polyLines   = []
        let gridMarkers = []
        for (const [id, g] of this.pathingGridData.entries()) {
          if (g && id === e.grid) {
            this.hoveredNpc = elementKey

            for (const [i, e] of g.entries()) {
              if (e && e.x && g[i + 1]) {
                const current = e
                const next    = g[i + 1]
                polyLines.push(
                  [
                    this.createPoint(-current.x, -current.y),
                    this.createPoint(-next.x, -next.y),
                  ]
                )
              }

              if (e && e.x) {
                gridMarkers.push(
                  {
                    point: this.createPoint(-e.x, -e.y),
                    label: i,
                  }
                )
              }
            }
          }
        }

        this.pathingGridLines   = polyLines
        this.pathingGridMarkers = gridMarkers
      }

      this.$emit("npc-marker-hover", e.npc);
    },

    spellMarkerHover(s) {
      this.$emit("spell-marker-hover", s);
    },

    calcSmallIcons(xy) {
      return [
        xy[0] / 2,
        xy[1] / 2,
      ]
    },

    getNpcIcon(npc) {
      return 'race-models-ctn-' + npc.race + '-' + npc.gender + '-' + npc.texture + '-' + npc.helmtexture;
    },

    zoomUpdate(e) {
      if (this.starterZoomLevel === -100) {
        this.starterZoomLevel = e
      }
      this.zoomLevel = e
    },

    createPoint(x, y) {
      return L.latLng(
        (typeof (y) === "string" ? -parseFloat(y) : -y),
        (typeof (x) === "string" ? parseFloat(x) : x));
    },

    iconClass() {
      return this.zoomLevel >= 2 ? 'item-4472' : 'item-4472-sm'
    },

    iconSize() {
      return this.zoomLevel >= 2 ? [40, 40] : [12, 12]
    },

    async getMapContents() {
      const postfix = ["", "_1", "_3"]
      let contents  = ""
      for (let p of postfix) {
        try {
          const r = await axios.get(
            `/eq-asset-preview-master/assets/eq-maps/${this.zone}${p}.txt`
          )
          if (r.status === 200) {
            if (r.data.length > 0) {
              contents += r.data
            }
          }
        } catch (err) {
        }
      }
      return contents
    },

    async parseRaceIconSizes() {
      console.time("[EqZoneMap] parseRaceIconSizes");

      let raceIconSizes = {}
      try {
        const r = await axios.get(
          `/eq-asset-preview-master/assets/sprites/race-models.css`
        )
        if (r.status === 200) {
          if (r.data.length > 0) {
            for (let line of r.data.split("\n")) {
              line               = line.replace(".", "")
              const raceClassKey = line.split(" ")[0].trim()
              const height       = line.split("height: ")[1].split(";")[0].replace("px", "").trim()
              const width        = line.split("width: ")[1].split(";")[0].replace("px", "").trim()
              raceIconSizes[raceClassKey] = [width, height]
            }
          }
        }
      } catch (err) {
        console.log("map.vue %s", err)
      }

      this.raceIconSizes = raceIconSizes
      console.timeEnd("[EqZoneMap] parseRaceIconSizes");
    },

    async loadSafeCoordinates() {
      const zone          = (await Zones.getZoneByShortName(this.zone))
      let safeCoordinates = []
      safeCoordinates.push({
          point: this.createPoint(-zone.safe_x, -zone.safe_y),
          label: `Safe Coordinates (${zone.safe_x}, ${zone.safe_y}, ${zone.safe_z}) (xyz)`,
          iconClass: 'fade-in item-6852',
          iconSize: [40, 40]
        }
      )
      this.safeCoordinateMarker = safeCoordinates
    },

    async loadTranslocatePoints() {
      const api = (new SpellsNewApi(...SpireApi.cfg()))

      try {
        const r = await api.listSpellsNews(
          (new SpireQueryBuilder())
            .where("teleport_zone", "=", this.zone)
            .get()
        )

        if (r.status === 200) {
          let sameCoord = {}
          let translocatePoints = []
          for (const s of r.data) {
            if (typeof sameCoord[s.effect_base_value_2 + s.effect_base_value_1] === "undefined") {
              sameCoord[s.effect_base_value_2 + s.effect_base_value_1] = 0
            }

            let sameCoordOffset = sameCoord[s.effect_base_value_2 + s.effect_base_value_1] * 1
            translocatePoints.push({
                point: this.createPoint(-s.effect_base_value_2 + sameCoordOffset, -s.effect_base_value_1 - sameCoordOffset),
                label: s.name,
                spell: s,
                iconClass: 'fade-in spell-' + s.new_icon + '-40',
                iconSize: [40, 40]
              }
            )
            sameCoord[s.effect_base_value_2 + s.effect_base_value_1]++
          }

          this.translocatePoints = translocatePoints
          this.$forceUpdate()
        }
      } catch (err) {
        console.log("map.vue %s", err)
      }
    },

    async loadMapLines() {
      console.time("[EqZoneMap] loadMapLines");

      let map        = await this.getMapContents()
      let bounds     = [0, 0, 0, 0];
      let mapLines   = []
      let mapMarkers = []
      for (let line of map.split("\n")) {
        const cols = line.replaceAll(",", "").split(/\s+/)

        if (cols[0].trim() === "L") {
          const x  = cols[1].trim()
          const y  = cols[2].trim()
          const x2 = cols[4].trim()
          const y2 = cols[5].trim()
          const p  = [
            this.createPoint(x, y),
            this.createPoint(x2, y2),
          ]
          bounds   = [
            Math.min(bounds[0], p[0].lat, p[1].lat),
            Math.min(bounds[1], p[0].lng, p[1].lng),
            Math.max(bounds[2], p[0].lat, p[1].lat),
            Math.max(bounds[3], p[0].lng, p[1].lng),
          ];
          mapLines.push(p)
        }

        if (cols[0].trim() === "P") {
          const x     = cols[1].trim()
          const y     = cols[2].trim()
          const label = cols[8].trim()
          mapMarkers.push(
            {
              point: this.createPoint(x, y),
              label: label.replaceAll("_", " "),
            }
          )
        }
      }

      this.markers = mapMarkers
      this.lines   = mapLines
      this.bounds  = [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]]
      ]
      this.center = [
        (bounds[0] + bounds[2]) / 2,
        (bounds[3] + bounds[1]) / 2
      ];

      this.$forceUpdate()
      console.timeEnd("[EqZoneMap] loadMapLines");
    },

    async loadDoors() {
      console.time("[EqZoneMap] loadDoors");

      const api       = (new DoorApi(...SpireApi.cfg()))
      let doorMarkers = []

      try {
        const r = await api.listDoors(
          (new SpireQueryBuilder())
            .where("zone", "=", this.zone)
            .where("version", "=", this.version)
            .get()
        )

        if (r.status === 200) {
          let doorZonePoints = []
          for (let d of r.data) {
            doorMarkers.push(
              {
                point: this.createPoint(-d.pos_x, -d.pos_y),
                label: d.name,
                iconClass: 'fade-in item-8057',
                iconSize: [40, 40]
              }
            )

            if (d.dest_zone !== "NONE") {
              const z = (await Zones.getZoneLongNameByShortName(d.dest_zone))
              if (z !== "") {
                doorZonePoints.push(
                  {
                    point: this.createPoint(-d.pos_x, -d.pos_y),
                    label: "(Door Click) Zone Point (" + z + ")",
                    destName: d.dest_zone,
                    destInstance: d.dest_instance,
                  }
                )
              }
            }
          }

          this.doorMarkers    = doorMarkers
          this.doorZonePoints = doorZonePoints
        }
      } catch (err) {
        console.log("map.vue %s", err)
      }

      console.timeEnd("[EqZoneMap] loadDoors");
    },

    async loadMapSpawns() {
      let npcMarkers       = []
      const gridEntriesApi = (new GridEntryApi(...SpireApi.cfg()))
      try {
        console.time("[EqZoneMap] loadMapSpawns");

        const zone = (await Zones.getZoneByShortName(this.zone))
        const r    = await gridEntriesApi.listGridEntries(
          (new SpireQueryBuilder())
            .where("zoneid", "=", zone.zoneidnumber)
            .orderBy(["gridid", "number"])
            .get()
        );
        if (r.status === 200) {
          let gridEntries = []
          for (let e of r.data) {
            if (typeof gridEntries[e.gridid] === "undefined") {
              gridEntries[e.gridid] = []
            }
            if (typeof gridEntries[e.gridid][e.number] === "undefined") {
              gridEntries[e.gridid][e.number] = []
            }
            gridEntries[e.gridid][e.number] =
              {
                x: e.x,
                y: e.y,
              }
          }
          this.pathingGridData = gridEntries
        }

        const result = await Spawn.getByZone(this.zone, this.version, true)
        if (result.length > 0) {
          for (let spawn2 of result) {
            if (spawn2.spawnentries) {
              for (let spawnentry of spawn2.spawnentries) {
                if (spawnentry.npc_type) {
                  let npcName = ""
                  const n = spawnentry.npc_type
                  npcName = n.name + (n.lastname ? ` (${n.lastname})` : '')

                  npcMarkers.push(
                    {
                      point: this.createPoint(-spawn2.x, -spawn2.y),
                      label: Npcs.getCleanName(npcName),
                      npc: n,
                      grid: spawn2.pathgrid,
                      iconClass: 'fade-in ' + this.getNpcIcon(n),
                      iconSize: this.raceIconSizes[this.getNpcIcon(n)] ? this.raceIconSizes[this.getNpcIcon(n)] : [30, 100]
                    }
                  )
                }
              }
            }
          }

          this.npcMarkers = npcMarkers
          this.$forceUpdate()
          console.timeEnd("[EqZoneMap] loadMapSpawns");
        }
      } catch (err) {
        console.log("map.vue %s", err)
      }
    },

    async loadZonePoints() {
      console.time("[EqZoneMap] loadZonePoints");

      let zonePoints = []
      const zapi     = (new ZonePointApi(...SpireApi.cfg()))
      zapi.listZonePoints(
        (new SpireQueryBuilder())
          .where("zone", "=", this.zone)
          .get()
      ).then(async (r) => {
        if (r.status === 200) {
          for (let point of r.data) {
            const z = (await Zones.getZoneById(point.target_zone_id))
            zonePoints.push({
                point: this.createPoint(-point.x, -point.y),
                label: "Zone Point to: " + z.long_name,
                zone: z,
              }
            )
          }

          this.zonelineMarkers = zonePoints
          this.$forceUpdate()
          console.timeEnd("[EqZoneMap] loadZonePoints");
        }
      })
    },

    async loadMap() {
      // reset
      this.markers              = null
      this.lines                = null
      this.npcMarkers           = null
      this.doorMarkers          = null
      this.safeCoordinateMarker = null
      this.zonelineMarkers      = null
      this.translocatePoints    = null
      this.lines                = []
      this.pathingGridLines     = []
      this.pathingGridMarkers   = null
      this.pathingGridData      = []
      this.searchHighlight      = null
      this.mapSearchText        = ''
      this.mapSearchResults     = []

      // load
      await this.parseRaceIconSizes()
      this.loadMapLines()
      this.loadMapSpawns()
      this.loadDoors()
      this.loadZonePoints()
      this.loadTranslocatePoints()
      this.loadSafeCoordinates()

      this.$forceUpdate()
    }
  },

  async mounted() {
    this.loadLayerState()
    this.loadMap()
  },

  beforeDestroy() {
    EventBus.$off("NPC_ZOOM", this.handleNpcZoomEvent);
  },

  created() {
    this.zonelineMarkers      = null
    this.doorZonePoints       = null
    this.translocatePoints    = null
    this.npcMarkers           = null
    this.doorMarkers          = null
    this.safeCoordinateMarker = null
    this.pathingGridData      = []
    this.pathingGridLines     = null
    this.pathingGridMarkers   = []
    this.lines                = []

    EventBus.$on("NPC_ZOOM", this.handleNpcZoomEvent);
  },
}
</script>

<style>
.leaflet-tooltip {
  background-color: transparent;
  border: none;
  -webkit-box-shadow: none;
  box-shadow: none;
}
</style>

<style scoped>
.zone-map-container {
  position: relative;
}

/* Layer Controls */
.layer-controls {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 999;
  background: rgba(20, 20, 30, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  font-size: 12px;
  min-width: 160px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
}

.layer-controls-header {
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #e0e0e0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  user-select: none;
}

.layer-controls-body {
  padding: 4px 0;
}

.layer-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  cursor: pointer;
  color: #ccc;
  margin: 0;
  transition: background 0.15s;
}

.layer-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
}

.layer-toggle input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

.layer-toggle i {
  width: 14px;
  text-align: center;
}

.layer-count {
  margin-left: auto;
  color: #888;
  font-size: 11px;
}

/* Map Search */
.map-search-overlay {
  position: absolute;
  top: 18px;
  left: 60px;
  z-index: 999;
  min-width: 260px;
  max-width: 320px;
}

.map-search-input-wrap {
  display: flex;
  align-items: center;
  background: rgba(20, 20, 30, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 5px 10px;
  gap: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
}

.map-search-input-wrap > i {
  color: #888;
  font-size: 12px;
}

.map-search-input {
  background: transparent;
  border: none;
  outline: none;
  color: #e0e0e0;
  font-size: 12px;
  flex: 1;
  min-width: 0;
}

.map-search-input::placeholder {
  color: #666;
}

.map-search-clear {
  cursor: pointer;
  color: #888;
  transition: color 0.15s;
}

.map-search-clear:hover {
  color: #fff;
}

.map-search-results {
  margin-top: 4px;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
}

.map-search-result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  cursor: pointer;
  color: #ccc;
  font-size: 12px;
  transition: background 0.15s;
}

.map-search-result-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.map-search-result-item i {
  width: 14px;
  text-align: center;
}

.map-search-result-type {
  margin-left: auto;
  color: #888;
  font-size: 11px;
  white-space: nowrap;
}

.map-search-more {
  padding: 4px 10px;
  color: #666;
  font-size: 11px;
  text-align: center;
}

/* Coordinate display */
.coord-display {
  position: absolute;
  bottom: 18px;
  left: 18px;
  z-index: 999;
  background: rgba(20, 20, 30, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 4px 10px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #aaa;
  box-shadow: 0 1px 6px rgba(0,0,0,0.3);
}

.coord-label {
  color: #888;
  font-weight: 600;
}

/* NPC enhanced tooltip */
.npc-tooltip-enhanced {
  text-align: center;
}

.npc-tooltip-name {
  font-weight: 600;
  font-size: 13px;
}

.npc-tooltip-info {
  font-size: 11px;
  color: #aaa;
  margin-top: 2px;
}

.npc-tooltip-info span {
  margin: 0 3px;
}

.npc-tooltip-dot {
  font-size: 14px;
}

/* Search highlight */
.search-highlight-tooltip {
  background: rgba(59, 130, 246, 0.2) !important;
  border: 1px solid rgba(59, 130, 246, 0.5) !important;
}

/* Zone point tooltips */
.zone-point-tooltip {
  text-align: left;
}

.zone-point-direction {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
}

.zone-point-type {
  font-size: 10px;
  color: #888;
  margin-top: 2px;
}
</style>
