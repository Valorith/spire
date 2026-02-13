<template>
  <content-area style="padding: 0 !important">
    <div class="row">
      <!-- Left Panel: Search & List -->
      <div class="col-4">
        <eq-window title="Loot Tables">
          <div class="d-flex mb-2">
            <input
              type="text"
              class="form-control form-control-sm"
              placeholder="Search by name or ID..."
              v-model="search"
              @keyup.enter="doSearch"
              @input="debouncedSearch"
            >
            <b-button
              size="sm"
              variant="outline-warning"
              class="ml-2"
              @click="createNewLoottable"
              title="Create New Loot Table"
            >
              <i class="fa fa-plus mr-1"></i> New
            </b-button>
          </div>

          <div class="loot-list" style="height: calc(100vh - 200px); overflow-y: auto;">
            <div v-if="loading" class="text-center p-3">
              <i class="fa fa-spinner fa-spin"></i> Loading...
            </div>

            <div v-if="!loading && (!tableData || tableData.length === 0)" class="text-center p-3" style="opacity: .5;">
              No loot tables found
            </div>

            <div
              v-for="lt in tableData"
              :key="lt.id"
              class="loot-list-item"
              :class="{ 'active': selectedTable && selectedTable.id === lt.id }"
              @click="selectLoottable(lt)"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="loot-list-name">{{ lt.name || '(unnamed)' }}</div>
                  <small class="text-muted">ID: {{ lt.id }}</small>
                </div>
                <div class="text-right">
                  <span
                    v-if="getItemCount(lt) > 0"
                    class="badge badge-pill"
                    style="background: rgba(255,193,7,0.2); color: #ffd54f;"
                  >{{ getItemCount(lt) }} items</span>
                  <br v-if="lt.npc_types && lt.npc_types.length > 0">
                  <small
                    v-if="lt.npc_types && lt.npc_types.length > 0"
                    style="color: #90caf9;"
                  >{{ lt.npc_types.length }} NPC{{ lt.npc_types.length !== 1 ? 's' : '' }}</small>
                </div>
              </div>
              <div v-if="lt.mincash || lt.maxcash" class="mt-1">
                <small style="opacity:.6;">
                  <eq-cash-display :price="lt.mincash || 0" size="xs"/> –
                  <eq-cash-display :price="lt.maxcash || 0" size="xs"/>
                </small>
              </div>
            </div>

            <div class="text-center mt-2 mb-2" v-if="totalRows > 0">
              <b-pagination
                size="sm"
                v-model="currentPage"
                :total-rows="totalRows"
                :per-page="50"
                :hide-ellipsis="true"
                @change="paginate"
              />
            </div>
          </div>
        </eq-window>
      </div>

      <!-- Right Panel: Editor -->
      <div class="col-8">
        <!-- Empty State -->
        <eq-window v-if="!selectedTable" title="Loot Editor">
          <div class="text-center p-5" style="opacity: .4;">
            <i class="fa fa-gem" style="font-size: 3em;"></i>
            <div class="mt-3">Select a loot table to edit</div>
          </div>
        </eq-window>

        <!-- Editor -->
        <div v-if="selectedTable">
          <!-- Header -->
          <eq-window class="p-0">
            <div class="loot-editor-header">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <h5 class="mb-0 mr-3" style="color: #ffd54f;">
                    <i class="fa fa-gem mr-2"></i>{{ editTable.name || '(unnamed)' }}
                  </h5>
                  <span class="badge badge-dark mr-2">ID: {{ editTable.id }}</span>
                  <span
                    v-if="getItemCount(selectedTable) > 0"
                    class="badge mr-2"
                    style="background: rgba(255,193,7,0.2); color: #ffd54f;"
                  >{{ getItemCount(selectedTable) }} items</span>
                  <span
                    v-if="selectedTable.npc_types && selectedTable.npc_types.length > 0"
                    class="badge"
                    style="background: rgba(144,202,249,0.2); color: #90caf9;"
                  >{{ selectedTable.npc_types.length }} NPC{{ selectedTable.npc_types.length !== 1 ? 's' : '' }}</span>
                </div>
                <div>
                  <b-button
                    size="sm"
                    variant="outline-info"
                    class="mr-1"
                    @click="cloneLoottable"
                    title="Clone this loot table"
                  >
                    <i class="fa fa-copy mr-1"></i> Clone
                  </b-button>
                  <b-button
                    size="sm"
                    :variant="hasUnsavedChanges ? 'warning' : 'outline-warning'"
                    :class="{ 'save-btn-glow': hasUnsavedChanges }"
                    @click="saveLoottable"
                    :disabled="saving"
                  >
                    <i class="fa fa-save mr-1"></i> {{ saving ? 'Saving...' : 'Save' }}
                  </b-button>
                </div>
              </div>

              <!-- Editable Fields -->
              <div class="row mt-3">
                <div class="col-4">
                  <label class="small mb-0" style="opacity:.7;">Name</label>
                  <input
                    class="form-control form-control-sm"
                    v-model="editTable.name"
                    @input="markDirty"
                  >
                </div>
                <div class="col-2">
                  <label class="small mb-0" style="opacity:.7;">Min Cash</label>
                  <input
                    type="number"
                    class="form-control form-control-sm"
                    v-model.number="editTable.mincash"
                    @input="markDirty"
                  >
                </div>
                <div class="col-2">
                  <label class="small mb-0" style="opacity:.7;">Max Cash</label>
                  <input
                    type="number"
                    class="form-control form-control-sm"
                    v-model.number="editTable.maxcash"
                    @input="markDirty"
                  >
                </div>
                <div class="col-2">
                  <label class="small mb-0" style="opacity:.7;">Cash Preview</label>
                  <div class="mt-1">
                    <eq-cash-display :price="editTable.mincash || 0" size="sm"/>
                    <span class="mx-1" style="opacity:.5;">–</span>
                    <eq-cash-display :price="editTable.maxcash || 0" size="sm"/>
                  </div>
                </div>
              </div>

              <!-- Linked NPCs -->
              <div v-if="selectedTable.npc_types && selectedTable.npc_types.length > 0" class="mt-3 pt-2" style="border-top: 1px solid rgba(255,255,255,0.06);">
                <div
                  class="npc-section-header"
                  @click="npcsExpanded = !npcsExpanded"
                >
                  <i class="fa mr-1" :class="npcsExpanded ? 'fa-chevron-down' : 'fa-chevron-right'" style="width:12px; opacity:.5;"></i>
                  <i class="fa fa-users mr-1" style="opacity:.5;"></i>
                  <span style="opacity:.7;">Used by</span>
                  <span class="ml-1 font-weight-bold" style="color: #90caf9;">{{ selectedTable.npc_types.length }}</span>
                  <span class="ml-1" style="opacity:.7;">NPC{{ selectedTable.npc_types.length !== 1 ? 's' : '' }}</span>
                </div>
                <div v-if="npcsExpanded" class="npc-table-wrap mt-2">
                  <table class="eq-table eq-highlight-rows w-100" style="font-size: 12px;">
                    <thead>
                      <tr>
                        <th style="width: 15%;">ID</th>
                        <th style="width: 45%;">Name</th>
                        <th style="width: 15%;" class="text-center">Level</th>
                        <th style="width: 25%;" class="text-center">Race</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="npc in selectedTable.npc_types.slice(0, 50)"
                        :key="'npc-' + npc.id"
                        class="npc-row"
                        @click="goToNpc(npc.id)"
                      >
                        <td style="opacity:.5;">{{ npc.id }}</td>
                        <td><npc-popover :npc="npc" /></td>
                        <td class="text-center">{{ npc.level || '—' }}</td>
                        <td class="text-center" style="opacity:.6;">{{ npc.race || '—' }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-if="selectedTable.npc_types.length > 50" class="text-center p-1" style="opacity:.4; font-size:.8em;">
                    +{{ selectedTable.npc_types.length - 50 }} more NPCs
                  </div>
                </div>
              </div>
            </div>
          </eq-window>

          <!-- Lootdrops -->
          <eq-window title="Loot Drops" class="p-0">
            <div class="lootdrops-container" style="max-height: calc(100vh - 420px); overflow-y: auto;">
              <div
                v-for="(le, leIndex) in editEntries"
                :key="'le-' + leIndex"
                class="lootdrop-card"
              >
                <!-- Lootdrop Header -->
                <div class="lootdrop-header" @click="le._expanded = !le._expanded; $forceUpdate()">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                      <i
                        class="fa mr-2"
                        :class="le._expanded !== false ? 'fa-chevron-down' : 'fa-chevron-right'"
                        style="opacity:.5; width: 14px;"
                      ></i>
                      <span class="lootdrop-name">{{ le.lootdrop.name || 'Lootdrop #' + le.lootdrop_id }}</span>
                      <span class="badge badge-dark ml-2">ID: {{ le.lootdrop_id }}</span>
                      <span class="badge ml-2" style="background: rgba(255,193,7,0.2); color: #ffd54f;">
                        {{ le.lootdrop.lootdrop_entries ? le.lootdrop.lootdrop_entries.length : 0 }} items
                      </span>
                    </div>
                    <div class="d-flex align-items-center" @click.stop>
                      <div class="lootdrop-stat mr-3">
                        <label class="small mb-0">Prob%</label>
                        <input
                          type="number"
                          class="form-control form-control-sm lootdrop-input"
                          v-model.number="le.probability"
                          @input="markDirty"
                          min="0" max="100" step="1"
                        >
                      </div>
                      <div class="lootdrop-stat mr-3">
                        <label class="small mb-0">Multi</label>
                        <input
                          type="number"
                          class="form-control form-control-sm lootdrop-input"
                          v-model.number="le.multiplier"
                          @input="markDirty"
                          min="0" step="1"
                        >
                      </div>
                      <div class="lootdrop-stat mr-3">
                        <label class="small mb-0">Limit</label>
                        <input
                          type="number"
                          class="form-control form-control-sm lootdrop-input"
                          v-model.number="le.droplimit"
                          @input="markDirty"
                          min="0" step="1"
                        >
                      </div>
                      <div class="lootdrop-stat mr-2">
                        <label class="small mb-0">Min</label>
                        <input
                          type="number"
                          class="form-control form-control-sm lootdrop-input"
                          v-model.number="le.mindrop"
                          @input="markDirty"
                          min="0" step="1"
                        >
                      </div>
                      <b-button
                        size="sm"
                        variant="outline-danger"
                        @click.stop="removeLootdrop(leIndex)"
                        title="Remove lootdrop"
                        class="ml-1"
                      >
                        <i class="fa fa-trash"></i>
                      </b-button>
                    </div>
                  </div>
                </div>

                <!-- Lootdrop Items -->
                <div v-if="le._expanded !== false" class="lootdrop-items">
                  <table class="eq-table eq-highlight-rows w-100" style="font-size: 13px;">
                    <thead>
                      <tr>
                        <th style="width: 40%;">Item</th>
                        <th style="width: 10%;" class="text-center">Chance</th>
                        <th style="width: 8%;" class="text-center">Qty</th>
                        <th style="width: 8%;" class="text-center">Equip</th>
                        <th style="width: 12%;" class="text-center">NPC Lvl</th>
                        <th style="width: 12%;" class="text-center">Trivial Lvl</th>
                        <th style="width: 10%;" class="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(lde, ldeIndex) in le.lootdrop.lootdrop_entries" :key="'lde-' + lde.lootdrop_id + '-' + lde.item_id">
                        <td>
                          <item-popover
                            v-if="lde.item"
                            :item="lde.item"
                            size="sm"
                            class="d-inline-block"
                          />
                          <span v-else style="opacity:.5;">Item #{{ lde.item_id }}</span>
                        </td>
                        <td class="text-center">
                          <input
                            type="number"
                            class="form-control form-control-sm text-center entry-input"
                            v-model.number="lde.chance"
                            @input="markDirty"
                            min="0" max="100" step="0.1"
                          >
                        </td>
                        <td class="text-center">
                          <input
                            type="number"
                            class="form-control form-control-sm text-center entry-input"
                            v-model.number="lde.multiplier"
                            @input="markDirty"
                            min="1" step="1"
                          >
                        </td>
                        <td class="text-center">
                          <eq-checkbox
                            class="d-inline-block"
                            :true-value="1"
                            :false-value="0"
                            v-model.number="lde.equip_item"
                            @input="lde.equip_item = $event; markDirty()"
                          />
                        </td>
                        <td class="text-center">
                          <div class="d-flex">
                            <input
                              type="number"
                              class="form-control form-control-sm text-center entry-input"
                              v-model.number="lde.npc_min_level"
                              @input="markDirty"
                              placeholder="min"
                              min="0" step="1"
                              style="width: 50%;"
                            >
                            <input
                              type="number"
                              class="form-control form-control-sm text-center entry-input ml-1"
                              v-model.number="lde.npc_max_level"
                              @input="markDirty"
                              placeholder="max"
                              min="0" step="1"
                              style="width: 50%;"
                            >
                          </div>
                        </td>
                        <td class="text-center">
                          <div class="d-flex">
                            <input
                              type="number"
                              class="form-control form-control-sm text-center entry-input"
                              v-model.number="lde.trivial_min_level"
                              @input="markDirty"
                              placeholder="min"
                              min="0" step="1"
                              style="width: 50%;"
                            >
                            <input
                              type="number"
                              class="form-control form-control-sm text-center entry-input ml-1"
                              v-model.number="lde.trivial_max_level"
                              @input="markDirty"
                              placeholder="max"
                              min="0" step="1"
                              style="width: 50%;"
                            >
                          </div>
                        </td>
                        <td class="text-center">
                          <b-button
                            size="sm"
                            variant="outline-danger"
                            @click="removeItem(leIndex, ldeIndex)"
                            title="Remove item"
                          >
                            <i class="fa fa-times"></i>
                          </b-button>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Chance Distribution Bar -->
                  <div class="chance-bar mt-2 mb-2 mx-2" v-if="le.lootdrop.lootdrop_entries && le.lootdrop.lootdrop_entries.length > 0">
                    <div class="chance-bar-label mb-1">
                      <small style="opacity:.5;">Chance Distribution</small>
                      <small
                        class="ml-2"
                        :style="getTotalChance(le) === 100 ? 'color: #81c784;' : 'color: #ef9a9a;'"
                      >{{ getTotalChance(le).toFixed(1) }}%</small>
                    </div>
                    <div class="chance-bar-visual">
                      <div
                        v-for="(lde, ci) in le.lootdrop.lootdrop_entries"
                        :key="'cb-' + ci"
                        class="chance-segment"
                        :style="{
                          width: (lde.chance / Math.max(getTotalChance(le), 100) * 100) + '%',
                          background: getChanceColor(ci),
                        }"
                        :title="(lde.item ? lde.item.Name : 'Item #' + lde.item_id) + ': ' + lde.chance + '%'"
                      ></div>
                    </div>
                  </div>

                  <!-- Add Item -->
                  <div class="p-2">
                    <div v-if="le._addingItem" class="add-item-row">
                      <input
                        type="number"
                        class="form-control form-control-sm"
                        v-model.number="le._newItemId"
                        placeholder="Item ID"
                        @keyup.enter="addItemToLootdrop(leIndex)"
                        style="width: 120px;"
                      >
                      <input
                        type="number"
                        class="form-control form-control-sm ml-2"
                        v-model.number="le._newItemChance"
                        placeholder="Chance %"
                        style="width: 100px;"
                      >
                      <b-button
                        size="sm"
                        variant="outline-success"
                        class="ml-2"
                        @click="addItemToLootdrop(leIndex)"
                      >
                        <i class="fa fa-check"></i>
                      </b-button>
                      <b-button
                        size="sm"
                        variant="outline-secondary"
                        class="ml-1"
                        @click="le._addingItem = false; $forceUpdate()"
                      >
                        <i class="fa fa-times"></i>
                      </b-button>
                    </div>
                    <b-button
                      v-else
                      size="sm"
                      variant="outline-success"
                      @click="le._addingItem = true; le._newItemId = null; le._newItemChance = 10; $forceUpdate()"
                    >
                      <i class="fa fa-plus mr-1"></i> Add Item
                    </b-button>
                  </div>
                </div>
              </div>

              <!-- Add Lootdrop -->
              <div class="p-3 text-center">
                <b-button
                  size="sm"
                  variant="outline-info"
                  @click="addLootdrop"
                >
                  <i class="fa fa-plus mr-1"></i> Add Loot Drop
                </b-button>
              </div>
            </div>
          </eq-window>

          <!-- Delete -->
          <div class="text-right mt-2 mb-3 mr-2">
            <b-button
              size="sm"
              variant="outline-danger"
              @click="deleteLoottable"
            >
              <i class="fa fa-trash mr-1"></i> Delete Loot Table
            </b-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div
      v-if="notification"
      class="loot-notification"
      :class="notification.type"
    >
      {{ notification.message }}
    </div>
  </content-area>
</template>

<script>
import EqWindow            from "../../components/eq-ui/EQWindow";
import EqCheckbox          from "../../components/eq-ui/EQCheckbox";
import ContentArea         from "../../components/layout/ContentArea";
import ItemPopover         from "../../components/ItemPopover";
import NpcPopover          from "../../components/NpcPopover";
import EqCashDisplay       from "../../components/eq-ui/EqCashDisplay";
import {ROUTE}             from "../../routes";
import {LoottableApi, LoottableEntryApi, LootdropApi, LootdropEntryApi} from "../../app/api";
import {SpireApi}          from "../../app/api/spire-api";
import {SpireQueryBuilder} from "../../app/api/spire-query-builder";
import {debounce}          from "../../app/utility/debounce";

export default {
  name: "Loot",
  components: { EqCashDisplay, NpcPopover, ItemPopover, EqCheckbox, ContentArea, EqWindow },
  data() {
    return {
      tableData: [],
      selectedTable: null,
      editTable: {},
      editEntries: [],
      originalSnapshot: null,

      search: "",
      currentPage: 1,
      totalRows: 0,
      loading: false,
      saving: false,
      hasUnsavedChanges: false,
      notification: null,
      npcsExpanded: false,
    }
  },

  async mounted() {
    this.init()
    window.addEventListener('keydown', this.handleKeydown)
    window.addEventListener('beforeunload', this.beforeUnload)
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown)
    window.removeEventListener('beforeunload', this.beforeUnload)
  },

  watch: {
    '$route'() {
      this.init()
    },
  },

  methods: {
    handleKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (this.hasUnsavedChanges) this.saveLoottable()
      }
    },

    beforeUnload(e) {
      if (this.hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    },

    markDirty() {
      this.hasUnsavedChanges = true
    },

    goToNpc(id) {
      window.open(window.location.origin + window.location.pathname + '#/npc/' + id, '_blank')
    },

    showNotification(message, type = 'success') {
      this.notification = { message, type }
      setTimeout(() => { this.notification = null }, 3000)
    },

    getItemCount(lt) {
      if (!lt.loottable_entries) return 0
      return lt.loottable_entries.reduce((sum, le) => {
        return sum + (le.lootdrop && le.lootdrop.lootdrop_entries ? le.lootdrop.lootdrop_entries.length : 0)
      }, 0)
    },

    getTotalChance(le) {
      if (!le.lootdrop || !le.lootdrop.lootdrop_entries) return 0
      return le.lootdrop.lootdrop_entries.reduce((sum, lde) => sum + (lde.chance || 0), 0)
    },

    getChanceColor(index) {
      const colors = [
        '#42a5f5', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc',
        '#26c6da', '#d4e157', '#ff7043', '#78909c', '#ec407a',
        '#5c6bc0', '#29b6f6', '#9ccc65', '#ffca28', '#8d6e63',
      ]
      return colors[index % colors.length]
    },

    // --- Search & List ---
    debouncedSearch: debounce(function() {
      this.currentPage = 1
      this.updateQueryState()
    }, 400),

    doSearch() {
      this.currentPage = 1
      this.updateQueryState()
    },

    async listLootTables() {
      this.loading = true
      try {
        let builder = (new SpireQueryBuilder())
          .page(this.currentPage)
          .includes([
            "NpcTypes",
            "LoottableEntries",
            "LoottableEntries.Lootdrop",
            "LoottableEntries.Lootdrop.LootdropEntries",
            "LoottableEntries.Lootdrop.LootdropEntries.Item",
          ])
          .limit(50)

        if (this.search.length > 0) {
          if (!isNaN(this.search) && this.search.trim() !== '') {
            builder.where("id", "=", this.search.trim());
          } else {
            builder.where("name", "like", this.search);
          }
        }

        const r = await (new LoottableApi(...SpireApi.cfg())).listLoottables(builder.get())
        if (r.status === 200) {
          this.tableData = r.data
        }
      } catch (e) {
        console.error('Error loading loot tables', e)
      }
      this.loading = false
    },

    async getTotalLootTables() {
      try {
        let builder = (new SpireQueryBuilder())
          .select(["id"])
          .limit(100000000)

        if (this.search.length > 0) {
          if (!isNaN(this.search) && this.search.trim() !== '') {
            builder.where("id", "=", this.search.trim());
          } else {
            builder.where("name", "like", this.search);
          }
        }

        const r = await (new LoottableApi(...SpireApi.cfg())).listLoottables(builder.get())
        this.totalRows = r.data.length
      } catch (e) {
        console.error('Error getting count', e)
      }
    },

    async init() {
      this.loadQueryState()
      await Promise.all([this.listLootTables(), this.getTotalLootTables()])

      // Auto-select if loottableId query param
      if (this.$route.query.loottableId && this.tableData) {
        const id = parseInt(this.$route.query.loottableId)
        const found = this.tableData.find(lt => lt.id === id)
        if (found) {
          this.selectLoottable(found)
        }
      }
    },

    selectLoottable(lt) {
      if (this.hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. Discard?')) return
      }
      this.selectedTable = lt
      this.editTable = {
        id: lt.id,
        name: lt.name,
        mincash: lt.mincash,
        maxcash: lt.maxcash,
        avgcoin: lt.avgcoin,
        min_expansion: lt.min_expansion,
        max_expansion: lt.max_expansion,
        content_flags: lt.content_flags,
        content_flags_disabled: lt.content_flags_disabled,
        done: lt.done,
      }
      this.editEntries = (lt.loottable_entries || []).map(le => ({
        ...le,
        _expanded: true,
        _addingItem: false,
        _newItemId: null,
        _newItemChance: 10,
        lootdrop: {
          ...le.lootdrop,
          lootdrop_entries: le.lootdrop.lootdrop_entries ? [...le.lootdrop.lootdrop_entries] : [],
        },
      }))
      this.originalSnapshot = JSON.stringify({ editTable: this.editTable, editEntries: this.editEntries })
      this.hasUnsavedChanges = false
    },

    // --- CRUD ---
    async saveLoottable() {
      this.saving = true
      try {
        // 1. Save loottable itself
        const ltApi = new LoottableApi(...SpireApi.cfg())
        await ltApi.updateLoottable(this.editTable.id, {
          name: this.editTable.name,
          mincash: this.editTable.mincash || 0,
          maxcash: this.editTable.maxcash || 0,
          avgcoin: this.editTable.avgcoin || 0,
          min_expansion: this.editTable.min_expansion || -1,
          max_expansion: this.editTable.max_expansion || -1,
          content_flags: this.editTable.content_flags || '',
          content_flags_disabled: this.editTable.content_flags_disabled || '',
          done: this.editTable.done || 0,
        })

        // 2. Save loottable entries (probability, multiplier, etc.)
        const lteApi = new LoottableEntryApi(...SpireApi.cfg())
        for (const le of this.editEntries) {
          await lteApi.updateLoottableEntry(le.loottable_id, {
            loottable_id: le.loottable_id,
            lootdrop_id: le.lootdrop_id,
            multiplier: le.multiplier || 1,
            droplimit: le.droplimit || 0,
            mindrop: le.mindrop || 0,
            probability: le.probability || 100,
          })
        }

        // 3. Save lootdrop entries (chance, level ranges, etc.)
        const ldeApi = new LootdropEntryApi(...SpireApi.cfg())
        for (const le of this.editEntries) {
          for (const lde of le.lootdrop.lootdrop_entries) {
            await ldeApi.updateLootdropEntry(lde.lootdrop_id, {
              lootdrop_id: lde.lootdrop_id,
              item_id: lde.item_id,
              item_charges: lde.item_charges || 0,
              equip_item: lde.equip_item || 0,
              chance: lde.chance || 0,
              disabled_chance: lde.disabled_chance || 0,
              trivial_min_level: lde.trivial_min_level || 0,
              trivial_max_level: lde.trivial_max_level || 0,
              multiplier: lde.multiplier || 1,
              npc_min_level: lde.npc_min_level || 0,
              npc_max_level: lde.npc_max_level || 0,
              min_expansion: lde.min_expansion || -1,
              max_expansion: lde.max_expansion || -1,
              content_flags: lde.content_flags || '',
              content_flags_disabled: lde.content_flags_disabled || '',
            })
          }
        }

        this.hasUnsavedChanges = false
        this.showNotification('Loot table saved successfully!')

        // Refresh data
        await this.listLootTables()
        const refreshed = this.tableData.find(lt => lt.id === this.editTable.id)
        if (refreshed) {
          this.selectedTable = refreshed
          this.selectLoottable(refreshed)
        }
      } catch (e) {
        console.error('Save error:', e)
        this.showNotification('Error saving: ' + (e.message || 'Unknown error'), 'error')
      }
      this.saving = false
    },

    async createNewLoottable() {
      try {
        const ltApi = new LoottableApi(...SpireApi.cfg())
        const r = await ltApi.createLoottable({
          name: 'New Loot Table',
          mincash: 0,
          maxcash: 0,
        })
        if (r.data && r.data.length > 0) {
          this.showNotification('Created loot table #' + r.data[0].id)
          await this.listLootTables()
          const created = this.tableData.find(lt => lt.id === r.data[0].id)
          if (created) this.selectLoottable(created)
        }
      } catch (e) {
        this.showNotification('Error creating loot table', 'error')
      }
    },

    async cloneLoottable() {
      if (!this.selectedTable) return
      try {
        // Create new loottable with same settings
        const ltApi = new LoottableApi(...SpireApi.cfg())
        const r = await ltApi.createLoottable({
          name: (this.editTable.name || '') + ' (Clone)',
          mincash: this.editTable.mincash || 0,
          maxcash: this.editTable.maxcash || 0,
          avgcoin: this.editTable.avgcoin || 0,
        })
        if (r.data && r.data.length > 0) {
          const newId = r.data[0].id
          // Clone loottable entries (link to same lootdrops)
          const lteApi = new LoottableEntryApi(...SpireApi.cfg())
          for (const le of this.editEntries) {
            await lteApi.createLoottableEntry({
              loottable_id: newId,
              lootdrop_id: le.lootdrop_id,
              multiplier: le.multiplier || 1,
              droplimit: le.droplimit || 0,
              mindrop: le.mindrop || 0,
              probability: le.probability || 100,
            })
          }
          this.showNotification('Cloned as loot table #' + newId)
          this.hasUnsavedChanges = false
          await this.listLootTables()
          const cloned = this.tableData.find(lt => lt.id === newId)
          if (cloned) this.selectLoottable(cloned)
        }
      } catch (e) {
        this.showNotification('Error cloning: ' + (e.message || 'Unknown error'), 'error')
      }
    },

    async deleteLoottable() {
      if (!confirm('Delete loot table #' + this.editTable.id + '? This cannot be undone.')) return
      try {
        const ltApi = new LoottableApi(...SpireApi.cfg())
        await ltApi.deleteLoottable(this.editTable.id)
        this.showNotification('Deleted loot table #' + this.editTable.id)
        this.selectedTable = null
        this.hasUnsavedChanges = false
        await this.listLootTables()
      } catch (e) {
        this.showNotification('Error deleting', 'error')
      }
    },

    async addLootdrop() {
      try {
        // Create a new lootdrop
        const ldApi = new LootdropApi(...SpireApi.cfg())
        const r = await ldApi.createLootdrop({
          name: (this.editTable.name || 'Lootdrop') + ' - Drop ' + (this.editEntries.length + 1),
        })
        if (r.data && r.data.length > 0) {
          const newDrop = r.data[0]
          // Link it to loottable
          const lteApi = new LoottableEntryApi(...SpireApi.cfg())
          await lteApi.createLoottableEntry({
            loottable_id: this.editTable.id,
            lootdrop_id: newDrop.id,
            multiplier: 1,
            droplimit: 0,
            mindrop: 0,
            probability: 100,
          })
          // Refresh
          this.showNotification('Added new lootdrop #' + newDrop.id)
          await this.refreshCurrentTable()
        }
      } catch (e) {
        this.showNotification('Error adding lootdrop', 'error')
      }
    },

    async removeLootdrop(index) {
      const le = this.editEntries[index]
      if (!confirm('Remove lootdrop "' + (le.lootdrop.name || le.lootdrop_id) + '" from this table?')) return
      try {
        const lteApi = new LoottableEntryApi(...SpireApi.cfg())
        await lteApi.deleteLoottableEntry(le.loottable_id)
        this.showNotification('Removed lootdrop')
        await this.refreshCurrentTable()
      } catch (e) {
        this.showNotification('Error removing lootdrop', 'error')
      }
    },

    async addItemToLootdrop(leIndex) {
      const le = this.editEntries[leIndex]
      if (!le._newItemId) return
      try {
        const ldeApi = new LootdropEntryApi(...SpireApi.cfg())
        await ldeApi.createLootdropEntry({
          lootdrop_id: le.lootdrop_id,
          item_id: le._newItemId,
          chance: le._newItemChance || 10,
          multiplier: 1,
          equip_item: 0,
          item_charges: 1,
          npc_min_level: 0,
          npc_max_level: 0,
          trivial_min_level: 0,
          trivial_max_level: 0,
        })
        le._addingItem = false
        this.showNotification('Added item #' + le._newItemId)
        await this.refreshCurrentTable()
      } catch (e) {
        this.showNotification('Error adding item', 'error')
      }
    },

    async removeItem(leIndex, ldeIndex) {
      const lde = this.editEntries[leIndex].lootdrop.lootdrop_entries[ldeIndex]
      if (!confirm('Remove ' + (lde.item ? lde.item.Name : 'item #' + lde.item_id) + '?')) return
      try {
        const ldeApi = new LootdropEntryApi(...SpireApi.cfg())
        await ldeApi.deleteLootdropEntry(lde.lootdrop_id)
        this.showNotification('Removed item')
        await this.refreshCurrentTable()
      } catch (e) {
        this.showNotification('Error removing item', 'error')
      }
    },

    async refreshCurrentTable() {
      const id = this.editTable.id
      await this.listLootTables()
      const refreshed = this.tableData.find(lt => lt.id === id)
      if (refreshed) {
        this.selectedTable = refreshed
        this.selectLoottable(refreshed)
      }
    },

    // --- Query State ---
    reset() {
      this.currentPage = 1
      this.search = ""
      this.totalRows = 0
      this.updateQueryState()
    },

    updateQueryState: debounce(function () {
      let queryState = {};
      if (this.currentPage > 0) queryState.page = this.currentPage
      if (this.search !== "") queryState.q = this.search
      this.$router.push({ path: ROUTE.LOOT, query: queryState }).catch(() => {})
    }, 600),

    loadQueryState() {
      if (this.$route.query.page) {
        this.currentPage = parseInt(this.$route.query.page) || 1
      }
      if (this.$route.query.q) {
        this.search = this.$route.query.q
      }
      if (this.$route.query.loottableId) {
        this.search = this.$route.query.loottableId
      }
    },

    paginate() {
      setTimeout(() => { this.updateQueryState() }, 100)
    },
  }
}
</script>

<style scoped>
.loot-list-item {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
  transition: background 0.15s;
}
.loot-list-item:hover {
  background: rgba(255,255,255,0.04);
}
.loot-list-item.active {
  background: rgba(255,193,7,0.08);
  border-left: 3px solid #ffd54f;
}
.loot-list-name {
  font-weight: 600;
  font-size: 0.9em;
}

.loot-editor-header {
  padding: 12px 16px;
}

.npc-section-header {
  cursor: pointer;
  padding: 2px 0;
  font-size: 0.85em;
  user-select: none;
}
.npc-section-header:hover {
  opacity: .9;
}
.npc-table-wrap {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 4px;
}
.npc-row {
  cursor: pointer;
}
.npc-row:hover td {
  color: #bbdefb !important;
}

.lootdrop-card {
  border: 2px solid rgba(144, 202, 249, 0.35);
  border-radius: 6px;
  margin: 10px 8px;
  overflow: hidden;
  background: rgba(0,0,0,0.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.lootdrop-header {
  padding: 10px 12px;
  background: rgba(144, 202, 249, 0.06);
  cursor: pointer;
  border-bottom: 1px solid rgba(144, 202, 249, 0.12);
}
.lootdrop-header:hover {
  background: rgba(144, 202, 249, 0.1);
}
.lootdrop-name {
  font-weight: 600;
  color: #90caf9;
}
.lootdrop-stat label {
  font-size: 0.65em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.5;
  display: block;
  margin-bottom: 0;
}
.lootdrop-input {
  width: 65px;
  text-align: center;
}
.lootdrop-items {
  padding: 0;
}

.entry-input {
  background: transparent;
  border-color: rgba(255,255,255,0.15);
}
.entry-input:focus {
  background: rgba(255,255,255,0.05);
}

.chance-bar-visual {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: rgba(255,255,255,0.05);
}
.chance-segment {
  height: 100%;
  transition: width 0.3s;
}

.add-item-row {
  display: flex;
  align-items: center;
}

.save-btn-glow {
  box-shadow: 0 0 8px 2px rgba(255, 193, 7, 0.5);
  animation: loot-save-pulse 1.5s ease-in-out infinite;
}
@keyframes loot-save-pulse {
  0%, 100% { box-shadow: 0 0 8px 2px rgba(255, 193, 7, 0.5); }
  50% { box-shadow: 0 0 14px 4px rgba(255, 193, 7, 0.8); }
}

.loot-notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 12px 24px;
  border-radius: 6px;
  z-index: 9999;
  font-weight: 600;
  animation: slide-up 0.3s ease-out;
}
.loot-notification.success {
  background: rgba(76, 175, 80, 0.9);
  color: white;
}
.loot-notification.error {
  background: rgba(244, 67, 54, 0.9);
  color: white;
}
@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
