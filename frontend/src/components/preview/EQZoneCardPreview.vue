<template>
  <eq-window
    id="zone-preview"
    v-if="zone"
    class="p-0"
  >
    <div class="p-3">
      <h6 class="eq-header">{{ getZoneLongName() }}</h6>

      <eq-tabs>
        <eq-tab
          :selected="true"
          :name="'NPCs' + (npcTypes && npcTypes.length > 0 ? ` (${npcTypes.length})` : '')"
        >

          <!-- Fake Loader -->
          <div v-if="npcTypes.length === 0" class="mt-3 text-center">
            Loading NPCs...
            <loader-fake-progress class="mt-3"/>
          </div>

          <!-- NPCs Table -->
          <div style="height: 85vh; overflow-y: scroll;" v-if="npcTypes.length > 0">
            <table
              id="npctable"
              class="eq-table eq-highlight-rows"
              style="display: table; font-size: 14px; "
            >
              <thead
                class="eq-table-floating-header"
              >
              <tr>
                <th class="text-center" style="vertical-align: middle !important">
                  <b-button
                    class="btn-dark btn-sm btn-dark"
                    title="NPC Grid Editor"
                    @click="npcGridEditor()"
                  >
                    <i class="fa fa-th"></i> Bulk Editor
                  </b-button>
                </th>
                <th class="text-center">
                  NPC
                </th>
              </tr>
              </thead>
              <tbody>
              <tr
                :id="'npc-' + n.short_name"
                v-for="(n, index) in npcTypes"
                :key="n.id"
              >
                <td class="text-center" style="width: 150px">
                  <b-button
                    class="btn-dark btn-sm btn-dark"
                    @click="showNpcOnMap(n.npc)"
                    title="Show on Map"
                  >
                    <i class="fa fa-map-marker"></i>
                  </b-button>

                  <b-button
                    class="btn-dark btn-sm btn-dark ml-3"
                    @click="showNpcCard(n.npc)"
                    title="Show NPC card"
                  >
                    <i class="fa fa-eye"></i>
                  </b-button>

                  <b-button
                    class="btn-dark btn-sm btn-dark ml-3"
                    @click="editNpc(n.npc)"
                    title="Edit NPC"
                  >
                    <i class="fa fa-edit"></i>
                  </b-button>
                </td>
                <td style="position: relative">
                  <npc-popover
                    :npc="n.npc"
                  />
                </td>

              </tr>
              </tbody>
            </table>
          </div>


        </eq-tab>
        <eq-tab name="Items"></eq-tab>
        <eq-tab name="Tasks"></eq-tab>
        <eq-tab name="Sold"></eq-tab>
        <eq-tab name="Spells"></eq-tab>
        <eq-tab name="Zone Connections"></eq-tab>
        <eq-tab name="Zone">
          <div class="row mr-4">
            <div class="col-6">
              <div
                v-for="f in [
              { field: 'id', description: 'DB ID' },
              { field: 'zoneidnumber', description: 'Game ID' },
              { field: 'short_name', description: 'Short Name', break: true },
              { field: 'long_name', description: 'Long Name' },
              { field: 'version', description: 'Version' },


              { field: 'ztype', description: 'Zone Type', break: true },

              // fog — see dedicated fog panel below
              { field: 'fog_density', description: 'Fog Density' },

              // sky
              { field: 'sky', description: 'Sky Type' },
              { field: 'skylock', description: 'Sky Lock' },

              // weather — see dedicated weather panel below

              // { field: 'file_name', description: 'File Name' },
              { field: 'map_file_name', description: 'Map File', break: true },
              { field: 'graveyard_id', description: 'Graveyard ID' },
              { field: 'min_level', description: 'Min. Lvl', break: true },
              { field: 'min_status', description: 'Min. Status' },

              { field: 'timezone', description: 'Timezone', break: true },
              { field: 'time_type', description: 'Time Type' },

              { field: 'note', description: 'Note' },

              { field: 'walkspeed', description: 'Walkspeed' },
              { field: 'flag_needed', description: 'Flag Needed' },

              { field: 'insttype', description: 'Instance Type' },
              { field: 'shutdowndelay', description: 'Shutdown Delay' },
              { field: 'expansion', description: 'Expansion' },


              // content filtering
              { field: 'min_expansion', description: 'Min Expansion', break: true },
              { field: 'max_expansion', description: 'Max Expansion' },
              { field: 'content_flags', description: 'Content Flags Enabled' },
              { field: 'content_flags_disabled', description: 'Content Flags Disabled' },
          ]"
                v-if="typeof zone[f.field] !== 'undefined'"
                :key="f.field"
                :class="'row ' + (f.break ? 'mt-3' : '')"
              >

                <div class="col-6 text-right">
                  <span class="font-weight-bold">{{ f.description }}</span>
                </div>
                <div class="col-6 pl-0">
                  {{ zone[f.field] }}

                </div>
              </div>

            </div>

            <div class="col-6">

              <!-- Zone Settings (Bool) -->
              <div
                class="col-12"
                v-for="f in [
              { field: 'canbind', description: 'Can Bind' },
              { field: 'cancombat', description: 'Can Combat' },
              { field: 'canlevitate', description: 'Can Levitate' },
              { field: 'castoutdoor', description: 'Can Cast Outdoor' },
              { field: 'hotzone', description: 'Is Hotzone' },
              { field: 'peqzone', description: 'Is PEQ Zone Enabled' },
              { field: 'suspendbuffs', description: 'Suspend Buffs' },
          ]"
                :key="f.field"
                v-if="typeof zone[f.field] !== 'undefined'"
              >
                <div class="row">
                  <div class="col-1 pl-0">
                    <eq-checkbox
                      :disabled="true"
                      :value="zone[f.field]"
                    />
                  </div>
                  <div class="col-11">
                <span
                  class="font-weight-bold"
                  style="position: relative; bottom: 2px"
                >{{ f.description }}</span>
                  </div>

                </div>
              </div>

              <!-- Zone Settings -->
              <div class="mt-3">
                <div
                  class="col-12"
                  v-for="f in [
                    // zone level settings
                    { field: 'fast_regen_hp', description: 'Fast Regen HP' },
                    { field: 'fast_regen_mana', description: 'Fast Regen Mana' },
                    { field: 'fast_regen_endurance', description: 'Fast Regen Endurance' },

                    { field: 'npc_max_aggro_dist', description: 'NPC Max Aggro Dist', break: true },
                    { field: 'max_movement_update_range', description: 'Max Move Update Range' },
                    { field: 'underworld_teleport_index', description: 'Underworld Teleport' },
                    { field: 'lava_damage', description: 'Lava Damage', break: true },
                    { field: 'min_lava_damage', description: 'Min. Lava Damage' },
                    { field: 'gravity', description: 'Gravity', break: true },
                    { field: 'type', description: 'Zone Type', break: true },
                    { field: 'zone_exp_multiplier', description: 'Zone EXP Multiplier' },

                    { field: 'maxclients', description: 'Max Clients', break: true },
                    { field: 'ruleset', description: 'Ruleset' },

                    // clipping
                    { field: 'underworld', description: 'Underworld', break: true },
                    { field: 'minclip', description: 'Min Clip' },
                    { field: 'maxclip', description: 'Max Clip' },

                    // safe
                    { field: 'safe_x', description: 'Safe X', break: true },
                    { field: 'safe_y', description: 'Safe Y' },
                    { field: 'safe_z', description: 'Safe Z' },
                    { field: 'safe_heading', description: 'Safe Heading' },
                ]"
                  :key="f.field"
                  v-if="typeof zone[f.field] !== 'undefined'"
                >
                  <div :class="'row ' + (f.break ? 'mt-3' : '')">
                    <div class="col-1 pl-0">
                      {{ zone[f.field] }}
                    </div>

                    <div class="col-11">
                <span
                  class="font-weight-bold"
                >{{ f.description }}</span>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>

          <!-- Fog Color Preview -->
          <div class="mt-3 ml-2 mr-2" v-if="zone">
            <h6 class="eq-header" style="font-size: 13px;">Fog Colors</h6>
            <div class="fog-slots">
              <div class="fog-slot" v-for="slot in fogSlots" :key="slot.label">
                <div
                  class="fog-color-swatch"
                  :style="{ backgroundColor: getFogColor(slot.suffix) }"
                  :title="'RGB(' + (zone['fog_red' + slot.suffix] || 0) + ', ' + (zone['fog_green' + slot.suffix] || 0) + ', ' + (zone['fog_blue' + slot.suffix] || 0) + ')'"
                ></div>
                <div class="fog-slot-label">{{ slot.label }}</div>
                <div class="fog-slot-clip">
                  {{ zone['fog_minclip' + slot.suffix] || 0 }} - {{ zone['fog_maxclip' + slot.suffix] || 0 }}
                </div>
              </div>
            </div>
          </div>

          <!-- Weather Preview -->
          <div class="mt-3 ml-2 mr-2" v-if="zone">
            <h6 class="eq-header" style="font-size: 13px;">Weather</h6>
            <table class="weather-table">
              <thead>
                <tr><th></th><th>Slot 1</th><th>Slot 2</th><th>Slot 3</th><th>Slot 4</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-weight-bold">Rain %</td>
                  <td v-for="i in 4" :key="'rc'+i">{{ zone['rain_chance_' + i] || 0 }}</td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Rain Dur</td>
                  <td v-for="i in 4" :key="'rd'+i">{{ zone['rain_duration_' + i] || 0 }}</td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Snow %</td>
                  <td v-for="i in 4" :key="'sc'+i">{{ zone['snow_chance_' + i] || 0 }}</td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Snow Dur</td>
                  <td v-for="i in 4" :key="'sd'+i">{{ zone['snow_duration_' + i] || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </eq-tab>
      </eq-tabs>

    </div>

  </eq-window>
</template>

<script>

import EqWindow   from "../eq-ui/EQWindow";
import {SpireApi} from "../../app/api/spire-api";
import EqTabs     from "../eq-ui/EQTabs";
import EqTab               from "../eq-ui/EQTab";
import EqCheckbox          from "../eq-ui/EQCheckbox";
import {Spawn2Api}         from "../../app/api";
import {SpireQueryBuilder} from "../../app/api/spire-query-builder";
import {Npcs}              from "../../app/npcs";
import NpcPopover          from "../NpcPopover";
import {EventBus}          from "../../app/event-bus/event-bus";
import LoaderFakeProgress  from "../LoaderFakeProgress";
import util                from "util";
import {ROUTE}             from "../../routes";
import {Spawn}             from "../../app/spawn";

export default {
  name: "EqZoneCardPreview",
  components: { LoaderFakeProgress, NpcPopover, EqCheckbox, EqTab, EqTabs, EqWindow },
  props: {
    zone: Object,
    required: true,
  },

  data() {
    return {
      fogSlots: [
        { label: 'Default', suffix: '' },
        { label: 'Slot 1', suffix: '_1' },
        { label: 'Slot 2', suffix: '_2' },
        { label: 'Slot 3', suffix: '_3' },
        { label: 'Slot 4', suffix: '_4' },
      ],
    }
  },
  created() {
    this.backgroundImages  = []
    this.currentImageIndex = 0

    // data
    this.npcTypes = []

    // cycle background images
    this.interval = setInterval(this.setBackgroundImage, 3 * 1000)
  },
  beforeDestroy() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  },
  mounted() {
    this.init()
  },
  watch: {
    zone: {
      handler: function (val, oldVal) {
        this.init()
      },
    },
  },
  methods: {
    getFogColor(suffix) {
      if (!this.zone) return 'rgb(0,0,0)';
      const r = this.zone['fog_red' + suffix] || 0;
      const g = this.zone['fog_green' + suffix] || 0;
      const b = this.zone['fog_blue' + suffix] || 0;
      return `rgb(${r}, ${g}, ${b})`;
    },
    npcGridEditor() {
      this.$router.push(
        {
          path: ROUTE.NPCS_EDIT.replaceAll(":zone", this.zone.short_name),
          query: {
            v: this.zone.version
          }
        }
      ).catch(() => {
      })
    },

    editNpc(n) {
      this.$router.push(
        {
          path: ROUTE.NPC_EDIT.replaceAll(":npc", n.id)
        }
      ).catch(() => {
      })
    },

    showNpcCard(n) {
      EventBus.$emit('NPC_SHOW_CARD', n);
    },

    showNpcOnMap(n) {
      console.log(n)
      EventBus.$emit('NPC_ZOOM', n);
    },

    getCleanName(name) {
      return Npcs.getCleanName(name)
    },

    init() {
      // get zone wallpaper
      this.loadBackgroundImages().then(() => {
        this.setBackgroundImage()
      })

      this.loadNpcTypes()
    },

    getZoneLongName() {
      return this.zone.long_name
    },

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
      await SpireApi.v1().get('/assets/zone-images/' + encodeURIComponent(this.zone.long_name)).then((r) => {
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

    startsWithUppercase(str) {
      return str.substr(0, 1).match(/[A-Z\u00C0-\u00DC]/);
    },

    async loadNpcTypes() {
      let npcTypes = [];
      const r = await Spawn.getByZone(this.zone.short_name, this.zone.version, true)
      if (r.length > 0) {
        for (let spawn2 of r) {
          if (spawn2.spawnentries) {
            for (let spawnentry of spawn2.spawnentries) {
              if (spawnentry.npc_type) {

                // make sure we only add unique NPC IDs since spawns can use multiple
                // of the same NPC ID
                if (npcTypes.filter(f => f.npc.id === spawnentry.npc_type.id).length === 0) {
                  npcTypes.push(
                    {
                      npc: spawnentry.npc_type,
                      spawn: {
                        x: spawn2.x,
                        y: spawn2.y,
                      }
                    }
                  )
                }
              }
            }
          }
        }

        // sort alpha, upper case first
        npcTypes = npcTypes.sort((a, b) => {
          if (this.startsWithUppercase(a.npc.name) && !this.startsWithUppercase(b.npc.name)) {
            return -1;
          } else if (this.startsWithUppercase(b.npc.name) && !this.startsWithUppercase(a.npc.name)) {
            return 1;
          }
          return a.npc.name.localeCompare(b.npc.name);
        });

        this.npcTypes = npcTypes

        this.$forceUpdate()
      }

    }
  }
}
</script>

<style>
:root {
  --zone-background-size: auto;
  --zone-background: none;
}

#zone-preview::before {
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
  opacity: .1;

  --webkit-transition: background-image 1s ease-in-out;
  transition: background-image 1s ease-in-out;
}

#npctable td, #npctable th {
  vertical-align: middle;
  padding: 10px;
  height: 60px;
}

/* Fog color swatches */
.fog-slots {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.fog-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.fog-color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: default;
}

.fog-slot-label {
  font-size: 10px;
  color: #aaa;
  font-weight: 600;
}

.fog-slot-clip {
  font-size: 9px;
  color: #666;
}

/* Weather table */
.weather-table {
  width: 100%;
  font-size: 11px;
  border-collapse: collapse;
}

.weather-table th, .weather-table td {
  padding: 2px 6px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.weather-table th {
  color: #888;
  font-weight: 600;
}

.weather-table td:first-child, .weather-table th:first-child {
  text-align: right;
  width: 70px;
}
</style>
