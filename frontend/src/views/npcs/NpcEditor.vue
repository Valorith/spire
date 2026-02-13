<template>
  <div>
    <div class="row">
      <div class="col-7">
        <eq-window>

          <div
            v-if="notification"
            :class="'text-center mt-2 btn-xs eq-header fade-in'"
            style="width: 100%; font-size: 30px"
            @click="notification = ''"
          >
            <i class="ra ra-book mr-1"></i>
            {{ notification }}
          </div>

          <b-alert show dismissable variant="danger" v-if="error" class="mt-2">
            <i class="fa fa-warning"></i> {{ error }}
          </b-alert>

          <app-loader :is-loading="!npc" class="mt-3 mb-3"/>

          <eq-tabs
            v-if="npc"
            id="npc-edit-card"
            class="npc-edit-card minified-inputs"
            @mouseover.native="previewMain()"
            @on-selected="onTabChange"
          >
            <eq-tab
              :name="tab.name"
              :selected="(index === 0)"
              :key="tab.name"
              v-for="(tab, index) in tabs"
            >
              <div class="row">

                <!-- ========== DPS CALCULATOR / AUTO-STATS (COMBAT TAB) ========== -->
                <div v-if="tab.name === 'Combat' && npc" class="col-12">
                  <div class="dps-calculator-panel mb-3 mt-2">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <small class="font-weight-bold text-uppercase" style="opacity: .7; letter-spacing: 1px;">
                        <i class="fa fa-calculator mr-1"></i> DPS Calculator
                      </small>
                      <div>
                        <b-button
                          size="sm"
                          variant="outline-warning"
                          class="mr-2"
                          @click="applySuggestedCombatStats()"
                          title="Apply suggested combat stats (damage/delay/speed/count)"
                        >
                          <i class="fa fa-bolt mr-1"></i> Apply Suggested Combat
                        </b-button>
                        <b-button
                          size="sm"
                          variant="outline-info"
                          @click="autoFillLevelStats()"
                          title="Auto-fill core stats (HP/AC/combat) based on NPC level"
                        >
                          <i class="fa fa-magic mr-1"></i> Auto-Fill for Lvl {{ npc.level || 1 }}
                        </b-button>
                      </div>
                    </div>

                    <div class="row dps-stats-row">
                      <div class="col-3 text-center dps-stat-box">
                        <div class="dps-stat-value text-warning">{{ calcDps }}</div>
                        <div class="dps-stat-label">Est. DPS</div>
                      </div>
                      <div class="col-3 text-center dps-stat-box">
                        <div class="dps-stat-value">{{ calcAvgHit }}</div>
                        <div class="dps-stat-label">Avg Hit</div>
                      </div>
                      <div class="col-3 text-center dps-stat-box">
                        <div class="dps-stat-value">{{ calcHitsPerSec }}</div>
                        <div class="dps-stat-label">Hits/Sec</div>
                      </div>
                      <div class="col-3 text-center dps-stat-box">
                        <div class="dps-stat-value">{{ calcEffectiveDelay }}</div>
                        <div class="dps-stat-label">Eff. Delay</div>
                      </div>
                    </div>

                    <div class="mt-2" v-if="combatSuggestions">
                      <div class="d-flex align-items-center justify-content-between">
                        <small class="font-weight-bold" style="opacity: .75;">Suggested (EQEmu-ish) for Level {{ combatSuggestions.level }}</small>
                        <small style="opacity:.6;">(dmg, delay, count, speed)</small>
                      </div>

                      <div class="row mt-1">
                        <div class="col-md-3 col-6">
                          <small style="opacity:.7;">Min/Max</small>
                          <div class="suggestion-value">
                            {{ combatSuggestions.mindmg }} / {{ combatSuggestions.maxdmg }}
                          </div>
                        </div>
                        <div class="col-md-3 col-6">
                          <small style="opacity:.7;">Delay</small>
                          <div class="suggestion-value">{{ combatSuggestions.attack_delay }}</div>
                        </div>
                        <div class="col-md-3 col-6">
                          <small style="opacity:.7;">Speed Mod</small>
                          <div class="suggestion-value">{{ combatSuggestions.attack_speed }}</div>
                        </div>
                        <div class="col-md-3 col-6">
                          <small style="opacity:.7;">Atk Count</small>
                          <div class="suggestion-value">{{ combatSuggestions.attack_count }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-12" v-if="tab.gridRows">
                  <div v-for="(row, ri) in tab.gridRows" :key="'gr-'+ri">
                    <div v-if="row.header" class="mt-3 mb-1">
                      <small class="font-weight-bold text-uppercase" style="opacity:.6; letter-spacing:1px;">{{ row.header }}</small>
                    </div>
                    <div class="row">
                      <div
                        v-for="(gf, gi) in row.fields"
                        :key="'gf-'+ri+'-'+gi"
                        :class="gf.col || 'col-6'"
                        v-if="shouldShowField(gf)"
                      >
                        <label
                          class="small mb-0"
                          :style="gf.resistColor ? 'color:'+gf.resistColor+';font-weight:bold;' : 'opacity:.7;'"
                        >{{ gf.desc }}</label>

                        <eq-checkbox
                          v-if="gf.fType === 'checkbox'"
                          class="d-inline-block"
                          :true-value="1"
                          :false-value="0"
                          v-model.number="npc[gf.field]"
                          @input="npc[gf.field] = $event; setFieldModifiedById(gf.field)"
                        />

                        <b-form-input
                          v-else-if="gf.fType === 'number'"
                          :id="gf.field"
                          v-model.number="npc[gf.field]"
                          size="sm"
                          v-on="gf.e ? getEventHandlers(gf.e, gf.field) : {}"
                          @input="setFieldModifiedById(gf.field)"
                          :style="npc[gf.field] === 0 ? 'opacity:.5' : ''"
                        />

                        <select
                          v-else-if="gf.selectData"
                          v-model.number="npc[gf.field]"
                          :id="gf.field"
                          class="form-control form-control-sm"
                          v-on="gf.e ? getEventHandlers(gf.e, gf.field) : {}"
                          @change="setFieldModifiedById(gf.field)"
                        >
                          <option
                            v-for="(desc, index) in gf.selectData"
                            :key="index"
                            :value="parseInt(index)"
                          >{{ index }}) {{ desc }}</option>
                        </select>

                        <!-- color picker (grid) -->
                        <div v-else-if="gf.fType === 'color_picker' && npc" class="mt-1" style="position: relative;">
                          <div class="d-flex align-items-center">
                            <div
                              @click="showColorPicker = !showColorPicker; updateArmorTintHex()"
                              :style="'width:30px;height:30px;border-radius:4px;cursor:pointer;border:2px solid rgba(255,255,255,0.3);background:rgb('+(npc.armortint_red||0)+','+(npc.armortint_green||0)+','+(npc.armortint_blue||0)+');'"
                              title="Click to toggle color picker"
                            ></div>
                            <input
                              v-model="armorTintHex"
                              @change="applyHexToArmorTint()"
                              class="form-control form-control-sm ml-2"
                              style="width:100px;"
                              placeholder="#000000"
                            >
                          </div>
                          <chrome-picker
                            v-if="showColorPicker"
                            :value="armorTintHex"
                            @input="onArmorColorPick"
                            style="position: absolute; z-index: 999; top: 40px; left: 0;"
                          />
                          <div v-if="showColorPicker" @click="showColorPicker = false" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 998;"></div>
                        </div>

                        <!-- textarea (grid) -->
                        <b-textarea
                          v-else-if="gf.fType === 'textarea'"
                          :id="gf.field"
                          v-model="npc[gf.field]"
                          size="sm"
                          rows="2"
                          max-rows="6"
                          v-on="gf.e ? getEventHandlers(gf.e, gf.field) : {}"
                          @input="setFieldModifiedById(gf.field)"
                        />

                        <b-form-input
                          v-else
                          :id="gf.field"
                          v-model.number="npc[gf.field]"
                          size="sm"
                          v-on="gf.e ? getEventHandlers(gf.e, gf.field) : {}"
                          @input="setFieldModifiedById(gf.field)"
                          :style="npc[gf.field] <= 0 ? 'opacity:.5' : ''"
                        />

                        <!-- range slider (grid) -->
                        <input
                          v-if="gf.rangeSlider"
                          type="range"
                          min="0"
                          max="1000"
                          step="5"
                          class="mt-1"
                          style="width: 100%"
                          v-model.number="npc[gf.field]"
                          @click="drawRangeVisualizer(gf.field)"
                          @input="setFieldModifiedById(gf.field)"
                        >
                      </div>
                    </div>
                  </div>
                  <!-- Template controls (General tab only) -->
                  <div v-if="tab.name === 'General'" class="mt-3 pt-2" style="border-top: 1px solid rgba(255,255,255,0.1);">
                    <div class="d-flex align-items-center">
                      <small class="font-weight-bold text-uppercase mr-2" style="opacity:.6; letter-spacing:1px;">
                        <i class="fa fa-copy mr-1"></i> Templates
                      </small>
                      <select v-model="selectedTemplate" class="form-control form-control-sm" style="max-width: 180px;">
                        <option value="">-- Load Template --</option>
                        <optgroup label="Built-in">
                          <option value="builtin:warrior">Generic Warrior</option>
                          <option value="builtin:caster">Caster Boss</option>
                          <option value="builtin:merchant">Merchant NPC</option>
                          <option value="builtin:quest">Quest NPC</option>
                        </optgroup>
                        <optgroup label="Custom" v-if="customTemplates.length > 0">
                          <option v-for="t in customTemplates" :key="t.name" :value="'custom:'+t.name">{{ t.name }}</option>
                        </optgroup>
                      </select>
                      <b-button size="sm" variant="outline-info" class="ml-2" @click="loadTemplate()" :disabled="!selectedTemplate">
                        <i class="fa fa-download"></i>
                      </b-button>
                      <b-button size="sm" variant="outline-success" class="ml-1" @click="saveAsTemplate()">
                        <i class="fa fa-save"></i> Save as Template
                      </b-button>
                      <b-button size="sm" variant="outline-danger" class="ml-1"
                        v-if="selectedTemplate && selectedTemplate.startsWith('custom:')"
                        @click="deleteTemplate()">
                        <i class="fa fa-trash"></i>
                      </b-button>
                    </div>
                  </div>
                </div>

                <div class="col-12" v-else>
                  <div
                    v-for="field in tab.fields"
                    v-if="shouldShowField(field)"
                    :key="field.field"
                    :class="'row'"
                  >

                    <div
                      class="col-6 text-right p-0 m-0 mr-1 mt-3"
                      style="position: relative; bottom: 6px;"
                      v-if="field.fType === 'checkbox'"
                    >
                      <span v-if="field.category" class="font-weight-bold">{{ field.category }}</span>
                      {{ field.desc }}
                    </div>
                    <div
                      class="col-6 text-right p-0 m-0 mr-3"
                      v-if="field.fType !== 'checkbox'"
                      :style="'margin-top: 10px !important;' + (field.resistColor ? 'color: ' + field.resistColor + '; font-weight: bold;' : '')"
                    >
                      <span v-if="field.category" class="font-weight-bold">{{ field.category }}</span>
                      {{ field.desc }}
                    </div>

                    <!--                  <div class="text-center" v-if="field.fType !== 'checkbox'">-->
                    <!--                    <span-->
                    <!--                      v-if="field.itemIcon"-->
                    <!--                      :class="'item-' + field.itemIcon + '-sm'"-->
                    <!--                      style="display: inline-block"-->
                    <!--                    />-->
                    <!--                    {{ field.desc }}-->
                    <!--                  </div>-->

                    <div class="col-3 text-left p-0 mt-2">

                      <!-- checkbox -->
                      <div :class="'text-left ml-2 mt-1'" v-if="field.fType === 'checkbox'">
                        <!--                        <div class="d-inline-block" style="bottom: 2px; position: relative; margin-right: 1px">-->
                        <!--                          {{ field.desc }}-->
                        <!--                        </div>-->
                        <eq-checkbox
                          v-b-tooltip.hover.v-dark.right :title="getFieldDescription(field.field)"
                          class="d-inline-block text-center"
                          :true-value="(typeof field.true !== 'undefined' ? field.true : 1)"
                          :false-value="(typeof field.false !== 'undefined' ? field.false : 0)"
                          v-model.number="npc[field.field]"
                          @input="npc[field.field] = $event"

                        />
                      </div>

                      <!-- input number -->
                      <b-form-input
                        v-if="field.fType === 'number'"
                        :id="field.field"
                        v-model.number="npc[field.field]"
                        class="m-0 mt-1"
                        v-on="field.e ? getEventHandlers(field.e, field.field) : {}"
                        v-b-tooltip.hover.v-dark.right :title="getFieldDescription(field.field)"
                        :style="(npc[field.field] === 0 ? 'opacity: .5' : '')"
                      />

                      <!-- input text -->
                      <b-form-input
                        v-if="field.fType === 'text'"
                        :id="field.field"
                        v-model.number="npc[field.field]"
                        class="m-0 mt-1"
                        v-on="field.e ? getEventHandlers(field.e, field.field) : {}"
                        v-b-tooltip.hover.v-dark.right :title="getFieldDescription(field.field)"
                        :style="(npc[field.field] <= (typeof field.zeroValue !== 'undefined' ? field.zeroValue : 0) ? 'opacity: .5' : '')"
                      />

                      <!-- textarea -->
                      <b-textarea
                        v-if="field.fType === 'textarea'"
                        :id="field.field"
                        v-model="npc[field.field]"
                        class="m-0 mt-1"
                        rows="2"
                        max-rows="6"
                        v-on="field.e ? getEventHandlers(field.e, field.field) : {}"
                        v-b-tooltip.hover.v-dark.right :title="getFieldDescription(field.field)"
                        :style="(npc[field.field] === '' ? 'opacity: .5' : '') + ';'"
                      ></b-textarea>

                      <!-- select -->
                      <select
                        v-model.number="npc[field.field]"
                        :id="field.field"
                        class="form-control m-0 mt-1"
                        v-if="field.selectData"
                        v-on="field.e ? getEventHandlers(field.e, field.field) : {}"
                        v-b-tooltip.hover.v-dark.right :title="getFieldDescription(field.field)"
                        :style="(npc[field.field] <= (typeof field.zeroValue !== 'undefined' ? field.zeroValue : 0) ? 'opacity: .5' : '')"
                      >
                        <option
                          v-for="(desc, index) in field.selectData"
                          :key="index"
                          :value="parseInt(index)"
                        >
                          {{ index }}) {{ desc }}
                        </option>
                      </select>

                      <!-- color picker -->
                      <div v-if="field.fType === 'color_picker' && npc" class="mt-1" style="position: relative;">
                        <div class="d-flex align-items-center">
                          <div
                            @click="showColorPicker = !showColorPicker; updateArmorTintHex()"
                            :style="'width:30px;height:30px;border-radius:4px;cursor:pointer;border:2px solid rgba(255,255,255,0.3);background:rgb('+(npc.armortint_red||0)+','+(npc.armortint_green||0)+','+(npc.armortint_blue||0)+');'"
                            title="Click to toggle color picker"
                          ></div>
                          <input
                            v-model="armorTintHex"
                            @change="applyHexToArmorTint()"
                            class="form-control form-control-sm ml-2"
                            style="width:100px;"
                            placeholder="#000000"
                          >
                        </div>
                        <chrome-picker
                          v-if="showColorPicker"
                          :value="armorTintHex"
                          @input="onArmorColorPick"
                          style="position: absolute; z-index: 999; top: 40px; left: 0;"
                        />
                        <div v-if="showColorPicker" @click="showColorPicker = false" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 998;"></div>
                      </div>

                    </div>
                    <div class="col-2 p-0" v-if="field.rangeSlider"
                      @click="drawRangeVisualizer(field.field)"
                    >
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        step="5"
                        class="p-0 m-0 mt-2"
                        style="width: 100%"
                        v-model.number="npc[field.field]"
                      >
                    </div>
                  </div>
                </div>
              </div>

            </eq-tab>

          </eq-tabs>

          <div class="text-center align-content-center mt-4" v-if="npc && npc.id >= 0">

            <b-button
              @click="saveNpc()"
              size="sm"
              variant="outline-warning"
              :class="{ 'save-btn-glow': modifiedFieldCount > 0 }"
              class="mr-2"
            >
              <i class="ra ra-book"></i>
              Save NPC
            </b-button>

            <!-- Reset to Original -->
            <b-button
              v-if="modifiedFieldCount > 0"
              @click="resetToOriginal()"
              size="sm"
              variant="outline-danger"
            >
              <i class="fa fa-undo"></i>
              Reset to Original
            </b-button>

          </div>
        </eq-window>

        <eq-window
          v-if="rangeVisualizerActive && npc"
          title="Range Visualizer"
          class="mt-3"
        >
          <range-visualizer :unit-marker="parseInt(npc[activeRangeField]) || 0"/>
        </eq-window>
      </div>

      <!-- Preview / Selector Pane -->
      <div class="col-5">

        <eq-window v-if="npc && !isAnySelectorActive()" style="max-height: 95vh; overflow-y: scroll; overflow-x: hidden">
          <eq-npc-card-preview :npc="npc"/>
        </eq-window>

        <eq-window v-if="npc && !isAnySelectorActive()" class="mt-3">
          <npc-spawn-locations :npc-id="npc.id"/>
        </eq-window>

        <eq-window v-if="selectorActive['special_abilities']">
          <npc-special-abilities
            :abilities="npc.special_abilities"
            :inputData.sync="npc.special_abilities"
          />
        </eq-window>

        <item-model-selector
          v-if="selectorActive['d_melee_texture_1']"
          :selected-model="npc.d_melee_texture_1"
          @input="npc.d_melee_texture_1 = $event.replaceAll('IT', ''); setFieldModifiedById('d_melee_texture_1')"
        />

        <item-model-selector
          v-if="selectorActive['d_melee_texture_2']"
          :selected-model="npc.d_melee_texture_2"
          @input="npc.d_melee_texture_2 = $event.replaceAll('IT', ''); setFieldModifiedById('d_melee_texture_2')"
        />

        <item-model-selector
          v-if="selectorActive['ammo_idfile']"
          :selected-model="npc.ammo_idfile"
          @input="npc.ammo_idfile = $event; setFieldModifiedById('ammo_idfile')"
        />

        <race-selector
          v-if="(selectorActive['race'] || selectorActive['gender'] || selectorActive['texture'] || selectorActive['helmtexture']) && npc"
          :race="npc.race"
          :gender="npc.gender"
          :texture="npc.texture"
          :helm-texture="npc.helmtexture"
          @selected="npc.race = $event.race; npc.gender = $event.gender; npc.texture = $event.texture; npc.helmtexture = $event.helmtexture"
        />

        <eq-window
          v-if="(isFacialSelectorActive()) && npc"
          title="Facial Appearance Selector"
        >
          <facial-appearance-selector
            :in-race="npc.race"
            :in-gender="npc.gender"
            :in-face="npc.face"
            :in-hair="npc.luclin_hairstyle"
            :in-hair-color="npc.luclin_haircolor"
            :in-beard="npc.luclin_beard"
            :in-beard-color="npc.luclin_beardcolor"
            @input="handleFacialAppearanceUpdate($event)"
          />
        </eq-window>

        <loot-sub-editor
          v-if="selectorActive['loottable_id']"
          :loottable-id="npc ? npc.loottable_id : 0"
          @input="(val) => { npc.loottable_id = val; setFieldModifiedById('loottable_id'); }"
        />

        <merchant-sub-editor
          v-if="selectorActive['merchant_id']"
          @input="npc.merchant_id = $event; setFieldModifiedById('merchant_id')"
        />

        <faction-sub-editor
          v-if="selectorActive['npc_faction_id']"
          :faction-id="npc ? npc.npc_faction_id : 0"
          @input="(val) => { npc.npc_faction_id = val; setFieldModifiedById('npc_faction_id'); }"
        />

        <spells-sub-editor
          v-if="selectorActive['npc_spells_id']"
          :spells-id="npc ? npc.npc_spells_id : 0"
          @input="(val) => { npc.npc_spells_id = val; setFieldModifiedById('npc_spells_id'); }"
        />

        <spells-sub-editor
          v-if="selectorActive['npc_spells_effects_id']"
          :spells-id="npc ? npc.npc_spells_effects_id : 0"
          @input="(val) => { npc.npc_spells_effects_id = val; setFieldModifiedById('npc_spells_effects_id'); }"
        />

        <alt-currency-sub-editor
          v-if="selectorActive['alt_currency_id']"
          :currency-id="npc ? npc.alt_currency_id : 0"
          @input="(val) => { npc.alt_currency_id = val; setFieldModifiedById('alt_currency_id'); }"
        />

      </div>
    </div>
  </div>
</template>

<script>
import EqWindowFancy            from "../../components/eq-ui/EQWindowFancy";
import EqWindow                 from "../../components/eq-ui/EQWindow";
import EqTabs                   from "../../components/eq-ui/EQTabs";
import EqTab                    from "../../components/eq-ui/EQTab";
import EqItemPreview            from "../../components/preview/EQItemCardPreview";
import EqCheckbox               from "../../components/eq-ui/EQCheckbox";
import EqWindowSimple           from "../../components/eq-ui/EQWindowSimple";
import LoaderCastBarTimer       from "../../components/LoaderCastBarTimer";
import ContentArea              from "../../components/layout/ContentArea";
import {Npcs}                   from "@/app/npcs";
import EqDebug                  from "../../components/eq-ui/EQDebug";
import EqNpcCardPreview         from "../../components/preview/EQNpcCardPreview";
import {DB_CLASSES}             from "@/app/constants/eq-classes-constants";
import {DB_RACE_NAMES}          from "@/app/constants/eq-races-constants";
import {BODYTYPES}              from "@/app/constants/eq-bodytype-constants";
import {EditFormFieldUtil}      from "@/app/forms/edit-form-field-util";
import {FreeIdFetcher}          from "@/app/free-id-fetcher";
import NpcSpecialAbilities      from "../../components/tools/NpcSpecialAbilities";
import {DB_SKILLS}              from "@/app/constants/eq-skill-constants";
import {FLYMODE}                from "@/app/constants/eq-flymode-constants";
import ItemModelSelector        from "../../components/selectors/ItemModelSelector";
import {GENDER}                 from "@/app/constants/eq-gender-constants";
import {DB_ITEM_MATERIAL}       from "@/app/constants/eq-item-constants";
import RaceSelector             from "../../components/selectors/RaceSelector";
import FacialAppearanceSelector from "../../components/selectors/FacialAppearanceSelector";
import MerchantSubEditor        from "../../components/subeditors/MerchantSubEditor";
import LootSubEditor            from "../../components/subeditors/LootSubEditor";
import NpcSpawnLocations        from "../../components/subeditors/NpcSpawnLocations";
import FactionSubEditor         from "../../components/subeditors/FactionSubEditor";
import { Chrome }               from "vue-color";
import SpellsSubEditor          from "../../components/subeditors/SpellsSubEditor";
import AltCurrencySubEditor     from "../../components/subeditors/AltCurrencySubEditor";
import RangeVisualizer          from "../../components/tools/RangeVisualizer";

const MILLISECONDS_BEFORE_WINDOW_RESET = 10000;

export default {
  name: "ItemEdit",
  components: {
    LootSubEditor,
    NpcSpawnLocations,
    FactionSubEditor,
    SpellsSubEditor,
    AltCurrencySubEditor,
    ChromePicker: Chrome,
    RangeVisualizer,
    MerchantSubEditor,
    FacialAppearanceSelector,
    RaceSelector,
    ItemModelSelector,
    NpcSpecialAbilities,
    EqNpcCardPreview,
    EqDebug,
    ContentArea,
    LoaderCastBarTimer,
    EqWindowSimple,
    EqCheckbox,
    EqItemPreview,
    EqTab,
    EqTabs,
    EqWindow,
    EqWindowFancy
  },
  data() {
    return {
      npc: null,
      originalNpc: {}, // item record data; used to reference original values in tools

      // notifications
      notification: "",
      error: "",
      showColorPicker: false,
      armorTintHex: "#000000",

      // selectors
      selectorActive: {},
      rangeVisualizerActive: false,
      activeRangeField: "",
      lastResetTime: Date.now(),

      // state, loaded or not
      loaded: true,

      // tabs / fields
      tabs: this.getTabs(),

      // template system
      customTemplates: [],
      selectedTemplate: '',

      // unsaved changes guard
      modifiedFieldCount: 0,
      modifiedFieldInterval: null,
    }
  },

  computed: {
    calcAvgHit() {
      if (!this.npc) return 0;
      const min = parseInt(this.npc.mindmg) || 0;
      const max = parseInt(this.npc.maxdmg) || 0;
      return Math.round((min + max) / 2);
    },

    calcEffectiveDelay() {
      if (!this.npc) return '0.00s';
      const delay = parseInt(this.npc.attack_delay) || 30;
      const speed = parseInt(this.npc.attack_speed) || 0;
      // attack_speed is a % modifier (negative = faster)
      const effective = delay * (100 + speed) / 100;
      return Math.max(0.1, effective / 10).toFixed(2) + 's';
    },

    calcHitsPerSec() {
      if (!this.npc) return '0.00';
      const delay = parseInt(this.npc.attack_delay) || 30;
      const speed = parseInt(this.npc.attack_speed) || 0;
      const effectiveDelay = delay * (100 + speed) / 100;
      const count = Math.max(1, parseInt(this.npc.attack_count) || 1);
      if (effectiveDelay <= 0) return '∞';
      return (count * 10 / effectiveDelay).toFixed(2);
    },

    calcDps() {
      if (!this.npc) return '0';
      const min = parseInt(this.npc.mindmg) || 0;
      const max = parseInt(this.npc.maxdmg) || 0;
      const avgDmg = (min + max) / 2;
      const delay = parseInt(this.npc.attack_delay) || 30;
      const speed = parseInt(this.npc.attack_speed) || 0;
      const effectiveDelay = delay * (100 + speed) / 100;
      const count = Math.max(1, parseInt(this.npc.attack_count) || 1);
      if (effectiveDelay <= 0) return '∞';
      return String(Math.round(avgDmg * count * 10 / effectiveDelay));
    },

    combatSuggestions() {
      if (!this.npc) return null;
      const level = Math.max(1, parseInt(this.npc.level) || 1);

      // Per task spec (simple baseline)
      const mindmg = Math.max(1, Math.round(level * 1.2));
      const maxdmg = Math.max(mindmg, Math.round(level * 2.5));

      // attack_delay is delay in tenths of seconds; typical 20-40
      let attack_delay = Math.round(40 - (level * 0.25));
      attack_delay = Math.min(40, Math.max(20, attack_delay));

      const attack_speed = 0;
      const attack_count = level >= 60 ? 2 : 1;

      return { level, mindmg, maxdmg, attack_delay, attack_speed, attack_count };
    },

    levelStatSuggestions() {
      if (!this.npc) return null;
      const level = Math.max(1, parseInt(this.npc.level) || 1);

      const hp = Math.max(1, Math.round(level * level * 0.9));
      const ac = Math.max(0, Math.round(level * 3.5));

      return { level, hp, ac };
    }
  },

  watch: {

    // reset state vars when we navigate away
    '$route'() {
      this.npc = null;
      // this.originalItem = {};

      // reset state vars when we navigate away
      // this.notification = ""
      EditFormFieldUtil.resetFieldEditedStatus()
      this.resetPreviewComponents()

      // reload
      this.load()
    },

  },
  async created() {
    this.load()
  },
  mounted() {
    this._keydownHandler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveNpc();
      }
    };
    window.addEventListener('keydown', this._keydownHandler);

    this._beforeUnloadHandler = (e) => {
      if (this.modifiedFieldCount > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', this._beforeUnloadHandler);

    this.modifiedFieldInterval = setInterval(() => {
      const els = document.querySelectorAll('.pulsate-highlight-modified');
      this.modifiedFieldCount = els ? els.length : 0;
      // Update tab dirty state (red tab labels)
      this.updateTabDirtyState();
    }, 500);

    this.loadCustomTemplates();
  },
  beforeDestroy() {
    if (this._keydownHandler) window.removeEventListener('keydown', this._keydownHandler);
    if (this._beforeUnloadHandler) window.removeEventListener('beforeunload', this._beforeUnloadHandler);
    if (this.modifiedFieldInterval) clearInterval(this.modifiedFieldInterval);
  },
  methods: {

    /**
     * Template System
     */
    loadCustomTemplates() {
      try {
        const raw = localStorage.getItem('spire-npc-templates');
        this.customTemplates = raw ? JSON.parse(raw) : [];
      } catch (e) { this.customTemplates = []; }
    },
    saveCustomTemplates() {
      localStorage.setItem('spire-npc-templates', JSON.stringify(this.customTemplates));
    },
    getBuiltinTemplates() {
      return {
        warrior: { level: 50, class: 1, hp: 32000, ac: 300, mindmg: 80, maxdmg: 200, attack_delay: 25, str: 200, sta: 200, dex: 150, agi: 150 },
        caster: { level: 55, class: 14, hp: 18000, mana: 20000, ac: 150, mindmg: 30, maxdmg: 60, attack_delay: 35, _int: 250, wis: 200, mr: 100, fr: 50, cr: 50 },
        merchant: { level: 1, class: 41, hp: 100000, ac: 500, findable: 1, show_name: 1 },
        quest: { level: 1, class: 1, hp: 100000, ac: 500, isquest: 1, findable: 1, show_name: 1, untargetable: 0 },
      };
    },
    loadTemplate() {
      if (!this.selectedTemplate || !this.npc) return;
      let data = null;
      if (this.selectedTemplate.startsWith('builtin:')) {
        const key = this.selectedTemplate.replace('builtin:', '');
        data = this.getBuiltinTemplates()[key];
      } else if (this.selectedTemplate.startsWith('custom:')) {
        const name = this.selectedTemplate.replace('custom:', '');
        const t = this.customTemplates.find(t => t.name === name);
        if (t) data = t.data;
      }
      if (!data) return;
      const skipFields = ['id', 'name'];
      for (const [k, v] of Object.entries(data)) {
        if (skipFields.includes(k)) continue;
        this.npc[k] = v;
        this.setFieldModifiedById(k);
      }
      this.sendNotification('Template applied: ' + this.selectedTemplate.split(':')[1]);
    },
    saveAsTemplate() {
      if (!this.npc) return;
      const name = prompt('Enter template name:');
      if (!name) return;
      const data = JSON.parse(JSON.stringify(this.npc));
      delete data.id;
      delete data.name;
      const existing = this.customTemplates.findIndex(t => t.name === name);
      if (existing >= 0) this.customTemplates.splice(existing, 1);
      this.customTemplates.push({ name, data });
      this.saveCustomTemplates();
      this.sendNotification('Template saved: ' + name);
    },
    deleteTemplate() {
      if (!this.selectedTemplate || !this.selectedTemplate.startsWith('custom:')) return;
      const name = this.selectedTemplate.replace('custom:', '');
      this.customTemplates = this.customTemplates.filter(t => t.name !== name);
      this.saveCustomTemplates();
      this.selectedTemplate = '';
      this.sendNotification('Template deleted: ' + name);
    },

    /**
     * Reset to Original
     */
    resetToOriginal() {
      if (!this.originalNpc || !this.npc) return;
      const orig = JSON.parse(JSON.stringify(this.originalNpc));
      for (const [k, v] of Object.entries(orig)) {
        this.npc[k] = v;
      }
      EditFormFieldUtil.resetFieldEditedStatus();
      this.modifiedFieldCount = 0;
      this.sendNotification('Reset to original values');
    },

    /**
     * Check if a field should be shown based on showIf condition
     */
    shouldShowField(field) {
      if (!field || !field.showIf) {
        return true
      }
      try {
        return !!field.showIf(this.npc)
      } catch (e) {
        return true
      }
    },

    /**
     * Facial
     */
    handleFacialAppearanceUpdate(e) {
      this.npc.face              = e.face;
      this.npc.luclin_hairstyle  = e.hair;
      this.npc.luclin_haircolor  = e.hairColor ? e.hairColor : 0;
      this.npc.luclin_eyecolor   = e.eye;
      this.npc.luclin_eyecolor_2 = e.eye;
      this.npc.luclin_beard      = e.beard;
      this.npc.luclin_beardcolor = e.beardColor;
    },

    facialFields() {
      return [
        "face",
        "luclin_hairstyle",
        "luclin_haircolor",
        "luclin_eyecolor",
        "luclin_eyecolor_2",
        "luclin_beard",
        "luclin_beardcolor"
      ]
    },

    isFacialSelectorActive() {
      for (let f of this.facialFields()) {
        if (this.selectorActive[f]) {
          return true;
        }
      }
      return false
    },

    setFieldModifiedById(field) {
      EditFormFieldUtil.setFieldModifiedById(field)
    },

    sendNotification(message) {
      this.notification = message
      this.dismissNotification()
    },

    dismissNotification() {
      setTimeout(() => {
        this.notification = ""
      }, 5000)
    },

    updateTabDirtyState() {
      const tabContainer = document.querySelector('#npc-edit-card');
      if (!tabContainer) return;
      const tabListItems = tabContainer.querySelectorAll('.eq-tab-box-fancy li');
      tabListItems.forEach(li => {
        const anchor = li.querySelector('a');
        if (!anchor) return;
        const tabName = (anchor.textContent || '').trim();
        const tab = this.tabs.find(t => t.name === tabName);
        if (!tab) return;
        const fields = tab.fields || [];
        const gridFields = (tab.gridRows || []).flatMap(r => r.fields || []);
        const allFields = [...fields, ...gridFields];
        const hasModified = allFields.some(f => {
          const el = document.getElementById(f.field);
          return el && el.classList.contains('pulsate-highlight-modified');
        });
        if (hasModified) {
          anchor.style.setProperty('color', '#dc3545', 'important');
        } else {
          anchor.style.setProperty('color', 'white', 'important');
        }
      });
    },

    updateArmorTintHex() {
      if (!this.npc) return;
      const r = parseInt(this.npc.armortint_red) || 0;
      const g = parseInt(this.npc.armortint_green) || 0;
      const b = parseInt(this.npc.armortint_blue) || 0;
      this.armorTintHex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    },
    onArmorColorPick(color) {
      if (!this.npc || !color || !color.rgba) return;
      this.npc.armortint_red = color.rgba.r;
      this.npc.armortint_green = color.rgba.g;
      this.npc.armortint_blue = color.rgba.b;
      this.armorTintHex = color.hex;
      ['armortint_red', 'armortint_green', 'armortint_blue'].forEach(f => this.setFieldModifiedById(f));
    },
    applyHexToArmorTint() {
      if (!this.npc) return;
      const hex = this.armorTintHex.replace('#', '');
      if (hex.length !== 6) return;
      this.npc.armortint_red = parseInt(hex.substr(0, 2), 16);
      this.npc.armortint_green = parseInt(hex.substr(2, 2), 16);
      this.npc.armortint_blue = parseInt(hex.substr(4, 2), 16);
      ['armortint_red', 'armortint_green', 'armortint_blue'].forEach(f => this.setFieldModifiedById(f));
    },

    applySuggestedCombatStats() {
      if (!this.npc || !this.combatSuggestions) return;
      const s = this.combatSuggestions;

      this.npc.mindmg = s.mindmg;
      this.npc.maxdmg = s.maxdmg;
      this.npc.attack_delay = s.attack_delay;
      this.npc.attack_speed = s.attack_speed;
      this.npc.attack_count = s.attack_count;

      ;['mindmg','maxdmg','attack_delay','attack_speed','attack_count'].forEach(f => this.setFieldModifiedById(f));
      this.sendNotification(`Applied suggested combat stats for level ${s.level}`);
    },

    autoFillLevelStats() {
      if (!this.npc) return;

      const level = Math.max(1, parseInt(this.npc.level) || 1);

      // Core baselines (per task spec)
      if (this.levelStatSuggestions) {
        this.npc.hp = this.levelStatSuggestions.hp;
        this.npc.ac = this.levelStatSuggestions.ac;
        this.setFieldModifiedById('hp');
        this.setFieldModifiedById('ac');
      }

      // Combat baselines
      this.applySuggestedCombatStats();

      this.sendNotification(`Auto-filled stats for level ${level}`);
    },

    async saveNpc() {
      this.error        = ""
      this.notification = ""

      try {
        const result = await Npcs.updateNpc(this.npc.id, this.npc)
        if (result.status === 200) {
          this.sendNotification("NPC updated successfully!")
          EditFormFieldUtil.resetFieldEditedStatus()
          this.modifiedFieldCount = 0
          this.originalNpc = JSON.parse(JSON.stringify(this.npc))
        }
      } catch (error) {
        // If the NPC doesn't exist yet (clone), try creating it
        if (error.response && error.response.data && error.response.data.error) {
          const err = error.response.data.error
          const expectedError = err.includes("Cannot find entity")
          if (!expectedError) {
            this.error = err
            return
          }
        }

        try {
          const {NpcTypeApi} = await import("@/app/api/api/npc-type-api")
          const {SpireApi} = await import("@/app/api/spire-api")
          const api = new NpcTypeApi(...SpireApi.cfg())
          const createRes = await api.createNpcType({npcType: this.npc})
          if (createRes.status === 200) {
            this.sendNotification("Created new NPC!")
            EditFormFieldUtil.resetFieldEditedStatus()
          }
        } catch (createError) {
          if (createError.response && createError.response.data && createError.response.data.error) {
            this.error = createError.response.data.error
          } else {
            this.error = "An error occurred while saving the NPC"
          }
        }
      }
    },

    /**
     * Selectors
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
    previewMain(force = false) {
      if ((this.shouldReset() && this.isAnySelectorActive()) || force) {
        this.resetPreviewComponents()
        this.$forceUpdate()
      }
    },
    resetPreviewComponents() {
      for (const [k, v] of Object.entries(this.selectorActive)) {
        this.selectorActive[k] = false
      }
      this.rangeVisualizerActive = false
      this.activeRangeField = ""

      EditFormFieldUtil.resetFieldSubEditorHighlightedStatus()
    },
    setSelectorActive(selector) {
      this.resetPreviewComponents()
      this.lastResetTime            = Date.now()
      this.selectorActive[selector] = true
      this.$forceUpdate()

      EditFormFieldUtil.setFieldSubEditorHighlightedById(selector)
    },
    onTabChange() {
      this.rangeVisualizerActive = false
      this.activeRangeField = ""
    },
    drawRangeVisualizer(field) {
      this.resetPreviewComponents()
      this.activeRangeField = field
      this.rangeVisualizerActive = true
      this.lastResetTime = Date.now() + 5000
      EditFormFieldUtil.setFieldSubEditorHighlightedById(field)
      this.$forceUpdate()
    },

    /**
     * Load
     */
    async load() {
      this.npc    = await Npcs.getNpc(this.$route.params.npc)
      this.loaded = true
      this.originalNpc = JSON.parse(JSON.stringify(this.npc))

      // if we're cloning this NPC, automatically fetch a free ID
      if (this.$route.query.hasOwnProperty("clone")) {
        const id = await FreeIdFetcher.get("npc_types", "id", "name")
        if (id > 0) {
          EditFormFieldUtil.setFieldModifiedById('id')
          this.npc.id = id
        }
      }

      setTimeout(() => {
        let hasSubEditorFields = [
          "npc_spells_id",
          "npc_spells_effects_id",
          "merchant_id",
          "special_abilities",
          "loottable_id",
          "alt_currency_id",
          "npc_faction_id",

          "aggroradius",
          "assistradius",

          "race",
          "gender",
          "texture",
          "helmtexture",

          "ammo_idfile",
          "d_melee_texture_1",
          "d_melee_texture_2",

          "face",
          "luclin_hairstyle",
          "luclin_haircolor",
          "luclin_eyecolor",
          "luclin_eyecolor_2",
          "luclin_beardcolor",
          "luclin_beard",
        ];
        hasSubEditorFields.forEach((field) => {
          EditFormFieldUtil.setFieldHighlightHasSubEditor(field)
        })
      }, 1)

    },

    getFieldDescription(field) {
      return Npcs.getFieldDescription(field)
    },

    /**
     * Tabs / fields
     */
    getEventHandlers(e, field) {
      let handlers = {}
      if (e.onclick) {
        handlers.click = () => e.onclick(field)
      }
      if (e.onmouseover) {
        handlers.mouseover = () => e.onmouseover(field)
      }

      return handlers
    },

    getTabs() {
      return [
        {
          name: 'General',
          fields: [
            { desc: 'ID', field: 'id', fType: 'text', itemIcon: '6840', },
            { desc: 'Name', field: 'name', fType: 'text', itemIcon: '6840', },
            { desc: 'Last Name', field: 'lastname', fType: 'text', itemIcon: '6840', },
            { desc: 'Level', field: 'level', fType: 'text', itemIcon: '6840', },
            { desc: 'Class', field: 'class', selectData: DB_CLASSES, },
            { desc: 'Bodytype', field: 'bodytype', selectData: BODYTYPES, },
            { desc: "Walk Speed", field: "walkspeed", fType: "text" },
            { desc: "Run Speed", field: "runspeed", fType: "text" },
            { desc: "Loottable ID", field: "loottable_id", fType: "text", e: { onclick: this.setSelectorActive } },
            { desc: "Merchant ID", field: "merchant_id", fType: "text", e: { onclick: this.setSelectorActive } },
            { desc: "Alternate Currency ID", field: "alt_currency_id", fType: "text", e: { onclick: this.setSelectorActive } },
            { desc: "NPC Spells ID", field: "npc_spells_id", fType: "text", e: { onclick: this.setSelectorActive } },
            { desc: "NPC Spell Effects ID", field: "npc_spells_effects_id", fType: "text", e: { onclick: this.setSelectorActive } },
            { desc: "NPC Faction ID", field: "npc_faction_id", fType: "text", e: { onclick: this.setSelectorActive } },
            { desc: "Faction Amount", field: "faction_amount", fType: "text" },
            { desc: "Adventure Template Id", field: "adventure_template_id", fType: "text" },
            { desc: "Trap Template", field: "trap_template", fType: "text" },
            { desc: "Emote ID", field: "emoteid", fType: "text" },
            { desc: "Stuck Behavior", field: "stuck_behavior", fType: "text", selectData: {0: "Run back", 1: "Warp back", 2: "Stay", 3: "Evade"} },
            { desc: "Flymode", field: "flymode", fType: "select", selectData: FLYMODE },
            { desc: "Experience Modifier", field: "exp_mod", fType: "text" },
          ],
          gridRows: [
            { fields: [
              { desc: 'ID', field: 'id', fType: 'text', col: 'col-2' },
              { desc: 'Name', field: 'name', fType: 'text', col: 'col-5' },
              { desc: 'Level', field: 'level', fType: 'text', col: 'col-2' },
              { desc: 'Last Name', field: 'lastname', fType: 'text', col: 'col-3' },
            ]},
            { fields: [
              { desc: 'Class', field: 'class', selectData: DB_CLASSES, col: 'col-4' },
              { desc: 'Bodytype', field: 'bodytype', selectData: BODYTYPES, col: 'col-4' },
            ]},
            { fields: [
              { desc: 'Walk Speed', field: 'walkspeed', fType: 'text', col: 'col-6' },
              { desc: 'Run Speed', field: 'runspeed', fType: 'text', col: 'col-6' },
            ]},
            { header: 'Reference IDs', fields: [
              { desc: 'Loottable ID', field: 'loottable_id', fType: 'text', col: 'col-6', e: { onclick: this.setSelectorActive } },
              { desc: 'Merchant ID', field: 'merchant_id', fType: 'text', col: 'col-6', e: { onclick: this.setSelectorActive } },
            ]},
            { fields: [
              { desc: 'Alt Currency ID', field: 'alt_currency_id', fType: 'text', col: 'col-6', e: { onclick: this.setSelectorActive } },
              { desc: 'NPC Spells ID', field: 'npc_spells_id', fType: 'text', col: 'col-6', e: { onclick: this.setSelectorActive } },
            ]},
            { fields: [
              { desc: 'NPC Spell Effects ID', field: 'npc_spells_effects_id', fType: 'text', col: 'col-6', e: { onclick: this.setSelectorActive } },
              { desc: 'NPC Faction ID', field: 'npc_faction_id', fType: 'text', col: 'col-6', e: { onclick: this.setSelectorActive } },
            ]},
            { fields: [
              { desc: 'Faction Amount', field: 'faction_amount', fType: 'text', col: 'col-6' },
            ]},
            { fields: [
              { desc: 'Adventure Template', field: 'adventure_template_id', fType: 'text', col: 'col-6' },
              { desc: 'Trap Template', field: 'trap_template', fType: 'text', col: 'col-6' },
            ]},
            { fields: [
              { desc: 'Emote ID', field: 'emoteid', fType: 'text', col: 'col-4' },
              { desc: 'Stuck Behavior', field: 'stuck_behavior', selectData: {0: "Run back", 1: "Warp back", 2: "Stay", 3: "Evade"}, col: 'col-4' },
              { desc: 'Flymode', field: 'flymode', selectData: FLYMODE, col: 'col-4' },
            ]},
            { fields: [
              { desc: 'Experience Modifier', field: 'exp_mod', fType: 'text', col: 'col-12' },
            ]},
          ],
        },
        {
          name: 'Weapon',
          fields: [
            {
              desc: "Primary Melee Weapon Model",
              field: "d_melee_texture_1",
              fType: "text",
              e: { onclick: this.setSelectorActive }
            },
            { desc: "Primary Melee Type", field: "prim_melee_type", fType: "select", selectData: DB_SKILLS },
            {
              desc: "Secondary Melee Weapon Model",
              field: "d_melee_texture_2",
              fType: "text",
              e: { onclick: this.setSelectorActive }
            },
            { desc: "Secondary Melee Type", field: "sec_melee_type", fType: "select", selectData: DB_SKILLS },
            { desc: "Ranged Melee Type", field: "ranged_type", fType: "select", selectData: DB_SKILLS },
            { desc: "Ammo Weapon Model", field: "ammo_idfile", fType: "text", e: { onclick: this.setSelectorActive } },
          ],
          gridRows: [
            { header: 'Primary Weapon', fields: [
              { desc: 'Model', field: 'd_melee_texture_1', fType: 'text', col: 'col-6', e: { onclick: this.setSelectorActive } },
              { desc: 'Melee Type', field: 'prim_melee_type', selectData: DB_SKILLS, col: 'col-6' },
            ]},
            { header: 'Secondary Weapon', fields: [
              { desc: 'Model', field: 'd_melee_texture_2', fType: 'text', col: 'col-6', e: { onclick: this.setSelectorActive } },
              { desc: 'Melee Type', field: 'sec_melee_type', selectData: DB_SKILLS, col: 'col-6' },
            ]},
            { header: 'Ranged', fields: [
              { desc: 'Ranged Type', field: 'ranged_type', selectData: DB_SKILLS, col: 'col-6' },
              { desc: 'Ammo Model', field: 'ammo_idfile', fType: 'text', col: 'col-6', e: { onclick: this.setSelectorActive } },
            ]},
          ],
        },
        {
          name: 'Aggro',
          fields: [
            { desc: 'Always Aggro', field: 'always_aggro', fType: 'checkbox' },
            { desc: "NPC Aggro", field: "npc_aggro", fType: "checkbox" },

            { desc: "Aggro Radius", field: "aggroradius", fType: "text", rangeSlider: true, e: { onclick: () => this.drawRangeVisualizer("aggroradius") } },
            { desc: "Assist Radius", field: "assistradius", fType: "text", rangeSlider: true, e: { onclick: () => this.drawRangeVisualizer("assistradius") } },
          ],
          gridRows: [
            { fields: [
              { desc: 'Always Aggro', field: 'always_aggro', fType: 'checkbox', col: 'col-6' },
              { desc: 'NPC Aggro', field: 'npc_aggro', fType: 'checkbox', col: 'col-6' },
            ]},
            { fields: [
              { desc: 'Aggro Radius', field: 'aggroradius', fType: 'text', col: 'col-6', rangeSlider: true, e: { onclick: () => this.drawRangeVisualizer("aggroradius") } },
              { desc: 'Assist Radius', field: 'assistradius', fType: 'text', col: 'col-6', rangeSlider: true, e: { onclick: () => this.drawRangeVisualizer("assistradius") } },
            ]},
          ],
        },
        {
          name: 'Appearance',
          fields: [
            { desc: 'Race', field: 'race', selectData: DB_RACE_NAMES, e: { onmouseover: this.setSelectorActive } },
            {
              desc: "Gender",
              field: "gender",
              fType: "select",
              selectData: GENDER,
              e: { onmouseover: this.setSelectorActive }
            },
            {
              desc: "Texture",
              field: "texture",
              fType: "select",
              selectData: DB_ITEM_MATERIAL,
              e: { onmouseover: this.setSelectorActive }
            },
            { desc: "Helm Texture", field: "helmtexture", fType: "select", selectData: DB_ITEM_MATERIAL, e: { onmouseover: this.setSelectorActive } },
            { desc: "Heros Forge Model", field: "herosforgemodel", fType: "text" },
            { desc: "Size", field: "size", fType: "text" },
            { desc: "Light", field: "light", selectData: {0: "None", 1: "Candle", 2: "Torch", 3: "Tiny Glowing Skull", 4: "Small Lantern", 5: "Stein of Moggok", 6: "Large Lantern", 7: "Flameless Lantern", 8: "Globe of Stars", 9: "Light Globe", 10: "Lightstone", 11: "Greater Lightstone", 12: "Fire Beetle Eye", 13: "Large Fire Beetle Eye"} },
            { desc: "Model?", field: "model", fType: "text" },
          ],
          gridRows: [
            { fields: [
              { desc: 'Race', field: 'race', selectData: DB_RACE_NAMES, col: 'col-6', e: { onmouseover: this.setSelectorActive } },
              { desc: 'Gender', field: 'gender', selectData: GENDER, col: 'col-6', e: { onmouseover: this.setSelectorActive } },
            ]},
            { fields: [
              { desc: 'Texture', field: 'texture', selectData: DB_ITEM_MATERIAL, col: 'col-6', e: { onmouseover: this.setSelectorActive } },
              { desc: 'Helm Texture', field: 'helmtexture', selectData: DB_ITEM_MATERIAL, col: 'col-6', e: { onmouseover: this.setSelectorActive } },
            ]},
            { fields: [
              { desc: 'Heros Forge Model', field: 'herosforgemodel', fType: 'text', col: 'col-6' },
              { desc: 'Size', field: 'size', fType: 'text', col: 'col-6' },
            ]},
            { fields: [
              { desc: 'Light', field: 'light', col: 'col-6', selectData: {0: "None", 1: "Candle", 2: "Torch", 3: "Tiny Glowing Skull", 4: "Small Lantern", 5: "Stein of Moggok", 6: "Large Lantern", 7: "Flameless Lantern", 8: "Globe of Stars", 9: "Light Globe", 10: "Lightstone", 11: "Greater Lightstone", 12: "Fire Beetle Eye", 13: "Large Fire Beetle Eye"} },
              { desc: 'Model', field: 'model', fType: 'text', col: 'col-6' },
            ]},
          ],
        },
        {
          name: 'Armor',
          fields: [
            { desc: "Armor Tint ID", field: "armortint_id", fType: "text" },
            { desc: "Armor Tint Red", field: "armortint_red", fType: "text" },
            { desc: "Armor Tint Green", field: "armortint_green", fType: "text" },
            { desc: "Armor Tint Blue", field: "armortint_blue", fType: "text" },
            { desc: "Color Preview", field: "_armor_color_picker", fType: "color_picker" },
            { desc: "NPC Tint ID", field: "npc_tint_id", fType: "text" },

            { desc: "Arm Texture", field: "armtexture", fType: "text" },
            { desc: "Bracer Texture", field: "bracertexture", fType: "text" },
            { desc: "Hand Texture", field: "handtexture", fType: "text" },
            { desc: "Leg Texture", field: "legtexture", fType: "text" },
            { desc: "Feet Texture", field: "feettexture", fType: "text" },
          ],
          gridRows: [
            { header: 'Armor Tint', fields: [
              { desc: 'Tint ID', field: 'armortint_id', fType: 'text', col: 'col-6' },
              { desc: 'NPC Tint ID', field: 'npc_tint_id', fType: 'text', col: 'col-6' },
            ]},
            { fields: [
              { desc: 'Red', field: 'armortint_red', fType: 'text', col: 'col-4' },
              { desc: 'Green', field: 'armortint_green', fType: 'text', col: 'col-4' },
              { desc: 'Blue', field: 'armortint_blue', fType: 'text', col: 'col-4' },
            ]},
            { fields: [
              { desc: 'Color Preview', field: '_armor_color_picker', fType: 'color_picker', col: 'col-12' },
            ]},
            { header: 'Textures', fields: [
              { desc: 'Arm', field: 'armtexture', fType: 'text', col: 'col-4' },
              { desc: 'Bracer', field: 'bracertexture', fType: 'text', col: 'col-4' },
              { desc: 'Hand', field: 'handtexture', fType: 'text', col: 'col-4' },
            ]},
            { fields: [
              { desc: 'Leg', field: 'legtexture', fType: 'text', col: 'col-4' },
              { desc: 'Feet', field: 'feettexture', fType: 'text', col: 'col-4' },
            ]},
          ],
        },
        {
          name: 'Face',
          fields: [
            { desc: "Face", field: "face", fType: "text", e: { onmouseover: this.setSelectorActive } },
            { desc: "Hairstyle", field: "luclin_hairstyle", fType: "text", e: { onmouseover: this.setSelectorActive } },
            { desc: "Haircolor", field: "luclin_haircolor", fType: "text", e: { onmouseover: this.setSelectorActive } },
            { desc: "Eyecolor 1", field: "luclin_eyecolor", fType: "text", e: { onmouseover: this.setSelectorActive } },
            {
              desc: "Eyecolor 2",
              field: "luclin_eyecolor_2",
              fType: "text",
              e: { onmouseover: this.setSelectorActive }
            },
            {
              desc: "Beardcolor",
              field: "luclin_beardcolor",
              fType: "text",
              e: { onmouseover: this.setSelectorActive }
            },
            { desc: "Beard", field: "luclin_beard", fType: "text", e: { onmouseover: this.setSelectorActive } },
            { desc: "(Drakkin) Heritage", field: "drakkin_heritage", fType: "text", showIf: (npc) => npc && npc.race === 522 },
            { desc: "(Drakkin) Tattoo", field: "drakkin_tattoo", fType: "text", showIf: (npc) => npc && npc.race === 522 },
            { desc: "(Drakkin) Details", field: "drakkin_details", fType: "text", showIf: (npc) => npc && npc.race === 522 },
          ],
          gridRows: [
            { fields: [
              { desc: 'Face', field: 'face', fType: 'text', col: 'col-4', e: { onmouseover: this.setSelectorActive } },
              { desc: 'Hairstyle', field: 'luclin_hairstyle', fType: 'text', col: 'col-4', e: { onmouseover: this.setSelectorActive } },
              { desc: 'Haircolor', field: 'luclin_haircolor', fType: 'text', col: 'col-4', e: { onmouseover: this.setSelectorActive } },
            ]},
            { fields: [
              { desc: 'Eyecolor 1', field: 'luclin_eyecolor', fType: 'text', col: 'col-4', e: { onmouseover: this.setSelectorActive } },
              { desc: 'Eyecolor 2', field: 'luclin_eyecolor_2', fType: 'text', col: 'col-4', e: { onmouseover: this.setSelectorActive } },
            ]},
            { fields: [
              { desc: 'Beardcolor', field: 'luclin_beardcolor', fType: 'text', col: 'col-4', e: { onmouseover: this.setSelectorActive } },
              { desc: 'Beard', field: 'luclin_beard', fType: 'text', col: 'col-4', e: { onmouseover: this.setSelectorActive } },
            ]},
            { header: 'Drakkin Only', fields: [
              { desc: 'Heritage', field: 'drakkin_heritage', fType: 'text', col: 'col-4', showIf: (npc) => npc && npc.race === 522 },
              { desc: 'Tattoo', field: 'drakkin_tattoo', fType: 'text', col: 'col-4', showIf: (npc) => npc && npc.race === 522 },
              { desc: 'Details', field: 'drakkin_details', fType: 'text', col: 'col-4', showIf: (npc) => npc && npc.race === 522 },
            ]},
          ],
        },
        {
          name: 'Stats',
          fields: [
            { desc: "AC", field: "ac", fType: "text" },
            { desc: "HP", field: "hp", fType: "text" },
            { desc: "Mana", field: "mana", fType: "text" },
            { desc: "HP Regen (Tic)", field: "hp_regen_rate", fType: "text" },
            { desc: "HP Regen (Sec)", field: "hp_regen_per_second", fType: "text" },
            { desc: "Mana Regen (Tic)", field: "mana_regen_rate", fType: "text" },
            { desc: "Strength", field: "str", fType: "text" },
            { desc: "Stamina", field: "sta", fType: "text" },
            { desc: "Dexterity", field: "dex", fType: "text" },
            { desc: "Agility", field: "agi", fType: "text" },
            { desc: "Intelligence", field: "_int", fType: "text" },
            { desc: "Wisdom", field: "wis", fType: "text" },
            { desc: "Charisma", field: "cha", fType: "text" },
            { desc: "Spell Scale", field: "spellscale", fType: "text" },
            { desc: "Heal Scale", field: "healscale", fType: "text" },
            { desc: "Scale Rate", field: "scalerate", fType: "text" },
            { desc: "Max Level", field: "maxlevel", fType: "text" },
            { desc: "Magic Resist", field: "mr", fType: "text", resistColor: "#4a9eff" },
            { desc: "Fire Resist", field: "fr", fType: "text", resistColor: "#ff4444" },
            { desc: "Cold Resist", field: "cr", fType: "text", resistColor: "#88ccff" },
            { desc: "Disease Resist", field: "dr", fType: "text", resistColor: "#44cc44" },
            { desc: "Poison Resist", field: "pr", fType: "text", resistColor: "#bb66ff" },
            { desc: "Corruption Resist", field: "corrup", fType: "text", resistColor: "#888888" },
            { desc: "Physical", field: "ph_r", fType: "text", resistColor: "#ffcc44" },
          ],
          gridRows: [
            { header: 'Vitals', fields: [
              { desc: 'AC', field: 'ac', fType: 'text', col: 'col-4' },
              { desc: 'HP', field: 'hp', fType: 'text', col: 'col-4' },
              { desc: 'Mana', field: 'mana', fType: 'text', col: 'col-4' },
            ]},
            { fields: [
              { desc: 'HP Regen (Tic)', field: 'hp_regen_rate', fType: 'text', col: 'col-4' },
              { desc: 'HP Regen (Sec)', field: 'hp_regen_per_second', fType: 'text', col: 'col-4' },
              { desc: 'Mana Regen (Tic)', field: 'mana_regen_rate', fType: 'text', col: 'col-4' },
            ]},
            { header: 'Base Stats', fields: [
              { desc: 'STR', field: 'str', fType: 'text', col: 'col-3' },
              { desc: 'STA', field: 'sta', fType: 'text', col: 'col-3' },
              { desc: 'DEX', field: 'dex', fType: 'text', col: 'col-3' },
              { desc: 'AGI', field: 'agi', fType: 'text', col: 'col-3' },
            ]},
            { fields: [
              { desc: 'INT', field: '_int', fType: 'text', col: 'col-3' },
              { desc: 'WIS', field: 'wis', fType: 'text', col: 'col-3' },
              { desc: 'CHA', field: 'cha', fType: 'text', col: 'col-3' },
            ]},
            { header: 'Scaling', fields: [
              { desc: 'Spell Scale', field: 'spellscale', fType: 'text', col: 'col-4' },
              { desc: 'Heal Scale', field: 'healscale', fType: 'text', col: 'col-4' },
              { desc: 'Scale Rate', field: 'scalerate', fType: 'text', col: 'col-4' },
            ]},
            { fields: [
              { desc: 'Max Level', field: 'maxlevel', fType: 'text', col: 'col-12' },
            ]},
            { header: 'Resists', fields: [
              { desc: 'Magic', field: 'mr', fType: 'text', col: 'col-3', resistColor: '#4a9eff' },
              { desc: 'Fire', field: 'fr', fType: 'text', col: 'col-3', resistColor: '#ff4444' },
              { desc: 'Cold', field: 'cr', fType: 'text', col: 'col-3', resistColor: '#88ccff' },
              { desc: 'Disease', field: 'dr', fType: 'text', col: 'col-3', resistColor: '#44cc44' },
            ]},
            { fields: [
              { desc: 'Poison', field: 'pr', fType: 'text', col: 'col-3', resistColor: '#bb66ff' },
              { desc: 'Corruption', field: 'corrup', fType: 'text', col: 'col-3', resistColor: '#888888' },
              { desc: 'Physical', field: 'ph_r', fType: 'text', col: 'col-3', resistColor: '#ffcc44' },
            ]},
          ],
        },
        {
          name: 'Combat',
          fields: [
            { desc: "Minimum Damage", field: "mindmg", fType: "text" },
            { desc: "Maximum Damage", field: "maxdmg", fType: "text" },
            { desc: "Attack Count", field: "attack_count", fType: "text" },

            { desc: "Attack Speed", field: "attack_speed", fType: "text" },
            { desc: "Attack Delay", field: "attack_delay", fType: "text" },
            { desc: "Attack", field: "atk", fType: "text" },
            { desc: "Accuracy", field: "accuracy", fType: "text" },
            { desc: "Avoidance", field: "avoidance", fType: "text" },
            { desc: "Slow Mitigation", field: "slow_mitigation", fType: "text" },
            { desc: "Heroic Strikethrough", field: "heroic_strikethrough", fType: "text" },

            {
              desc: "Special Abilities",
              field: "special_abilities",
              fType: "textarea",
              col: 'col-12',
              e: { onclick: this.setSelectorActive },
            },
          ],
          gridRows: [
            { header: 'Damage', fields: [
              { desc: 'Min Damage', field: 'mindmg', fType: 'text', col: 'col-4' },
              { desc: 'Max Damage', field: 'maxdmg', fType: 'text', col: 'col-4' },
              { desc: 'Attack Count', field: 'attack_count', fType: 'text', col: 'col-4' },
            ]},
            { header: 'Speed & Power', fields: [
              { desc: 'Attack Speed', field: 'attack_speed', fType: 'text', col: 'col-4' },
              { desc: 'Attack Delay', field: 'attack_delay', fType: 'text', col: 'col-4' },
              { desc: 'Attack', field: 'atk', fType: 'text', col: 'col-4' },
            ]},
            { header: 'Modifiers', fields: [
              { desc: 'Accuracy', field: 'accuracy', fType: 'text', col: 'col-3' },
              { desc: 'Avoidance', field: 'avoidance', fType: 'text', col: 'col-3' },
              { desc: 'Slow Mitigation', field: 'slow_mitigation', fType: 'text', col: 'col-3' },
              { desc: 'Heroic Strikethrough', field: 'heroic_strikethrough', fType: 'text', col: 'col-3' },
            ]},
            { header: 'Special Abilities', fields: [
              { desc: 'Special Abilities', field: 'special_abilities', fType: 'textarea', col: 'col-12', e: { onclick: this.setSelectorActive } },
            ]},
          ],
        },
        {
          name: 'Charm',
          fields: [
            { desc: "AC", field: "charm_ac", fType: "text" },
            { desc: "Minimum Damage", field: "charm_min_dmg", fType: "text" },
            { desc: "Maximum Damage", field: "charm_max_dmg", fType: "text" },
            { desc: "Attack Delay", field: "charm_attack_delay", fType: "text" },
            { desc: "Accuracy Rating", field: "charm_accuracy_rating", fType: "text" },
            { desc: "Avoidance Rating", field: "charm_avoidance_rating", fType: "text" },
            { desc: "Attack", field: "charm_atk", fType: "text" },
          ],
          gridRows: [
            { fields: [
              { desc: 'AC', field: 'charm_ac', fType: 'text', col: 'col-4' },
              { desc: 'Attack', field: 'charm_atk', fType: 'text', col: 'col-4' },
              { desc: 'Attack Delay', field: 'charm_attack_delay', fType: 'text', col: 'col-4' },
            ]},
            { fields: [
              { desc: 'Min Damage', field: 'charm_min_dmg', fType: 'text', col: 'col-6' },
              { desc: 'Max Damage', field: 'charm_max_dmg', fType: 'text', col: 'col-6' },
            ]},
            { fields: [
              { desc: 'Accuracy Rating', field: 'charm_accuracy_rating', fType: 'text', col: 'col-6' },
              { desc: 'Avoidance Rating', field: 'charm_avoidance_rating', fType: 'text', col: 'col-6' },
            ]},
          ],
        },
        {
          name: 'Settings',
          fields: [
            { desc: 'See Hide', field: 'see_hide', fType: 'checkbox', },
            { desc: 'See Improved Hide', field: 'see_improved_hide', fType: 'checkbox', },
            { desc: 'See Invisible', field: 'see_invis', fType: 'checkbox', },
            { desc: 'See Invis Undead', field: 'see_invis_undead', fType: 'checkbox', },
            { desc: 'Show Name', field: 'show_name', fType: 'checkbox', },
            { desc: 'Trackable', field: 'trackable', fType: 'checkbox', },
            { desc: 'Skip Global Loot', field: 'skip_global_loot', fType: 'checkbox', },
            { desc: 'No Target Hotkey', field: 'no_target_hotkey', fType: 'checkbox', },
            { desc: 'Findable', field: 'findable', fType: 'checkbox', },
            { desc: 'Untargetable', field: 'untargetable', fType: 'checkbox', },
            { desc: 'Underwater', field: 'underwater', fType: 'checkbox', },
            { desc: 'QGlobal', field: 'qglobal', fType: 'checkbox', },
            { desc: 'Ignore Despawn', field: 'ignore_despawn', fType: 'checkbox', },
            { desc: 'Quest NPC', field: 'isquest', fType: 'checkbox', },
            { desc: 'Unique Spawn', field: 'unique_spawn_by_name', fType: 'checkbox', },
            { desc: 'Rare Spawn', field: 'rare_spawn', fType: 'checkbox', },
            { desc: 'Always Aggro', field: 'always_aggro', fType: 'checkbox', },
            { desc: "NPC Aggro", field: "npc_aggro", fType: "checkbox" },
            { desc: "Raid Target", field: "raid_target", fType: "checkbox" },
            { desc: "Private Corpse", field: "private_corpse", fType: "checkbox" },
            { desc: "Is Bot", field: "isbot", fType: "checkbox" },
            { desc: "Keeps Sold Items", field: "keeps_sold_items", fType: "checkbox" },
            { desc: "Is Parcel Merchant", field: "is_parcel_merchant", fType: "checkbox" },
            { desc: "Multiquest Enabled", field: "multiquest_enabled", fType: "checkbox" },
          ],
          gridRows: [
            // --- Detection ---
            { header: 'Detection', fields: [
              { desc: 'See Hide', field: 'see_hide', fType: 'checkbox', col: 'col-3' },
              { desc: 'See Improved Hide', field: 'see_improved_hide', fType: 'checkbox', col: 'col-3' },
              { desc: 'See Invisible', field: 'see_invis', fType: 'checkbox', col: 'col-3' },
              { desc: 'See Invis Undead', field: 'see_invis_undead', fType: 'checkbox', col: 'col-3' },
            ]},
            // --- Aggro & Combat ---
            { header: 'Aggro & Combat', fields: [
              { desc: 'Always Aggro', field: 'always_aggro', fType: 'checkbox', col: 'col-3' },
              { desc: 'NPC Aggro', field: 'npc_aggro', fType: 'checkbox', col: 'col-3' },
              { desc: 'Raid Target', field: 'raid_target', fType: 'checkbox', col: 'col-3' },
              { desc: 'Private Corpse', field: 'private_corpse', fType: 'checkbox', col: 'col-3' },
            ]},
            // --- Targeting & Visibility ---
            { header: 'Targeting & Visibility', fields: [
              { desc: 'Show Name', field: 'show_name', fType: 'checkbox', col: 'col-3' },
              { desc: 'Findable', field: 'findable', fType: 'checkbox', col: 'col-3' },
              { desc: 'Trackable', field: 'trackable', fType: 'checkbox', col: 'col-3' },
              { desc: 'Untargetable', field: 'untargetable', fType: 'checkbox', col: 'col-3' },
            ]},
            { fields: [
              { desc: 'No Target Hotkey', field: 'no_target_hotkey', fType: 'checkbox', col: 'col-3' },
            ]},
            // --- Spawn & Behavior ---
            { header: 'Spawn & Behavior', fields: [
              { desc: 'Unique Spawn', field: 'unique_spawn_by_name', fType: 'checkbox', col: 'col-3' },
              { desc: 'Rare Spawn', field: 'rare_spawn', fType: 'checkbox', col: 'col-3' },
              { desc: 'Ignore Despawn', field: 'ignore_despawn', fType: 'checkbox', col: 'col-3' },
              { desc: 'Underwater', field: 'underwater', fType: 'checkbox', col: 'col-3' },
            ]},
            // --- Quest & Loot ---
            { header: 'Quest & Loot', fields: [
              { desc: 'Quest NPC', field: 'isquest', fType: 'checkbox', col: 'col-3' },
              { desc: 'QGlobal', field: 'qglobal', fType: 'checkbox', col: 'col-3' },
              { desc: 'Skip Global Loot', field: 'skip_global_loot', fType: 'checkbox', col: 'col-3' },
              { desc: 'Multiquest Enabled', field: 'multiquest_enabled', fType: 'checkbox', col: 'col-3' },
            ]},
            // --- Merchant ---
            { header: 'Merchant', fields: [
              { desc: 'Keeps Sold Items', field: 'keeps_sold_items', fType: 'checkbox', col: 'col-3' },
              { desc: 'Is Parcel Merchant', field: 'is_parcel_merchant', fType: 'checkbox', col: 'col-3' },
              { desc: 'Is Bot', field: 'isbot', fType: 'checkbox', col: 'col-3' },
            ]},
          ],
        },
        {
          name: 'Misc',
          fields: [
            { desc: "Spawn Limit", field: "spawn_limit", fType: "text" },
            { desc: "Version", field: "version", fType: "text" },
            { desc: "Exclude", field: "exclude", fType: "checkbox" },
            { desc: "Fixed", field: "fixed", fType: "checkbox" },
            { desc: "Greed", field: "greed", fType: "text" },
            { desc: "Unique", field: "unique_", fType: "checkbox" },
            { desc: "NPC Special Attacks (Legacy)", field: "npcspecialattks", fType: "text" },
            { desc: "PEQ ID", field: "peqid", fType: "text" },
          ],
          gridRows: [
            { fields: [
              { desc: 'Spawn Limit', field: 'spawn_limit', fType: 'text', col: 'col-4' },
              { desc: 'Version', field: 'version', fType: 'text', col: 'col-4' },
              { desc: 'Greed', field: 'greed', fType: 'text', col: 'col-4' },
            ]},
            { fields: [
              { desc: 'Exclude', field: 'exclude', fType: 'checkbox', col: 'col-4' },
              { desc: 'Fixed', field: 'fixed', fType: 'checkbox', col: 'col-4' },
              { desc: 'Unique', field: 'unique_', fType: 'checkbox', col: 'col-4' },
            ]},
            { fields: [
              { desc: 'NPC Special Attacks (Legacy)', field: 'npcspecialattks', fType: 'text', col: 'col-6' },
              { desc: 'PEQ ID', field: 'peqid', fType: 'text', col: 'col-6' },
            ]},
          ],
        },
      ]
    }
  }
}
</script>

<style scoped>

.effect-tab input, .effect-tab select {
  margin-bottom: 0;
}

.dps-calculator-panel {
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 4px;
  padding: 10px 12px;
  background: rgba(255, 193, 7, 0.05);
}

.dps-stats-row {
  margin: 0;
}

.dps-stat-box {
  padding: 6px 4px;
}

.dps-stat-value {
  font-size: 1.3em;
  font-weight: bold;
  font-family: monospace;
  line-height: 1.2;
}

.dps-stat-label {
  font-size: 0.7em;
  text-transform: uppercase;
  opacity: 0.6;
  letter-spacing: 1px;
}

.suggestion-value {
  font-family: monospace;
}

.save-btn-glow {
  box-shadow: 0 0 8px 2px rgba(255, 50, 50, 0.6);
  animation: save-glow-pulse 1.5s ease-in-out infinite;
}

@keyframes save-glow-pulse {
  0%, 100% { box-shadow: 0 0 8px 2px rgba(255, 50, 50, 0.6); }
  50% { box-shadow: 0 0 14px 4px rgba(255, 50, 50, 0.9); }
}
</style>
