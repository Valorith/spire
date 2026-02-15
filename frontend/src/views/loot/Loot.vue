<template>
  <content-area style="padding: 0 !important">
    <div class="row" style="display: flex; flex-wrap: wrap;">
      <!-- Left Panel: Search & List -->
      <div class="col-4" style="display: flex; flex-direction: column;">
        <eq-window title="Loot Tables" style="flex: 1;">
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
                  <br v-if="lt.npc_types && (lt.npc_types || []).length > 0">
                  <small
                    v-if="lt.npc_types && (lt.npc_types || []).length > 0"
                    style="color: #90caf9;"
                  >{{ (lt.npc_types || []).length }} NPC{{ (lt.npc_types || []).length !== 1 ? 's' : '' }}</small>
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
      <div class="col-8" style="display: flex; flex-direction: column;">
        <!-- Empty State -->
        <eq-window v-if="!selectedTable" title="Loot Editor">
          <div class="text-center p-5" style="opacity: .4;">
            <i class="fa fa-gem" style="font-size: 3em;"></i>
            <div class="mt-3">Select a loot table to edit</div>
          </div>
        </eq-window>

        <!-- Editor -->
        <div v-if="selectedTable" style="display: flex; flex-direction: column; flex: 1;">
          <!-- Header -->
          <eq-window class="p-0">
            <div class="loot-editor-header">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                  <h5 class="mb-0 mr-3" style="color: #ffd54f;">
                    <i class="fa fa-gem mr-2"></i>{{ editTable.name || '(unnamed)' }}
                  </h5>
                  <span class="badge mr-2" style="background: rgba(255,255,255,0.12); color: #fff;">ID: {{ editTable.id }}</span>
                  <span
                    v-if="getItemCount(selectedTable) > 0"
                    class="badge mr-2"
                    style="background: rgba(255,193,7,0.2); color: #ffd54f;"
                  >{{ getItemCount(selectedTable) }} items</span>
                  <span
                    v-if="selectedTable.npc_types && (selectedTable.npc_types || []).length > 0"
                    class="badge"
                    style="background: rgba(144,202,249,0.2); color: #90caf9;"
                  >{{ (selectedTable.npc_types || []).length }} NPC{{ (selectedTable.npc_types || []).length !== 1 ? 's' : '' }}</span>
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
                    v-if="hasUnsavedChanges"
                    size="sm"
                    variant="outline-secondary"
                    @click="confirmReset"
                    :disabled="saving"
                    class="mr-1"
                  >
                    <i class="fa fa-undo mr-1"></i> Reset
                  </b-button>
                  <b-button
                    size="sm"
                    :variant="hasUnsavedChanges ? 'outline-danger' : 'outline-warning'"
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
                    @input="trackFieldEdit('table-name', originalValues.table?.name || '', editTable.name)"
                    :class="{ 'pending-edit': isFieldEdited('table-name') }"
                  >
                </div>
                <div class="col-2">
                  <label class="small mb-0" style="opacity:.7;">Min Cash</label>
                  <input
                    type="number"
                    class="form-control form-control-sm"
                    v-model.number="editTable.mincash"
                    @input="trackFieldEdit('table-mincash', originalValues.table?.mincash || 0, editTable.mincash)"
                    :class="{ 'pending-edit': isFieldEdited('table-mincash') }"
                  >
                </div>
                <div class="col-2">
                  <label class="small mb-0" style="opacity:.7;">Max Cash</label>
                  <input
                    type="number"
                    class="form-control form-control-sm"
                    v-model.number="editTable.maxcash"
                    @input="trackFieldEdit('table-maxcash', originalValues.table?.maxcash || 0, editTable.maxcash)"
                    :class="{ 'pending-edit': isFieldEdited('table-maxcash') }"
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

              <!-- Content Flags (Loottable Level) -->
              <div class="row mt-2">
                <div class="col-6">
                  <label class="small mb-0" style="opacity:.7;">Content Flags</label>
                  <content-flag-selector
                    :value="editTable.content_flags"
                    @input="editTable.content_flags = $event; trackFieldEdit('table-content_flags', originalValues.table?.content_flags || '', editTable.content_flags)"
                    :key="'lt-cf-' + rerenderContentFlags"
                  />
                </div>
                <div class="col-6">
                  <label class="small mb-0" style="opacity:.7;">Content Flags Disabled</label>
                  <content-flag-selector
                    :value="editTable.content_flags_disabled"
                    @input="editTable.content_flags_disabled = $event; trackFieldEdit('table-content_flags_disabled', originalValues.table?.content_flags_disabled || '', editTable.content_flags_disabled)"
                    :key="'lt-cfd-' + rerenderContentFlags"
                  />
                </div>
              </div>

              <!-- Linked NPCs -->
              <div v-if="selectedTable.npc_types && (selectedTable.npc_types || []).length > 0" class="mt-3 pt-2" style="border-top: 1px solid rgba(255,255,255,0.06);">
                <div
                  class="npc-section-header"
                  @click="npcsExpanded = !npcsExpanded"
                >
                  <i class="fa mr-1" :class="npcsExpanded ? 'fa-chevron-down' : 'fa-chevron-right'" style="width:12px; opacity:.5;"></i>
                  <i class="fa fa-users mr-1" style="opacity:.5;"></i>
                  <span style="opacity:.7;">Used by</span>
                  <span class="ml-1 font-weight-bold" style="color: #90caf9;">{{ (selectedTable.npc_types || []).length }}</span>
                  <span class="ml-1" style="opacity:.7;">NPC{{ (selectedTable.npc_types || []).length !== 1 ? 's' : '' }}</span>
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
                        v-for="npc in (selectedTable.npc_types || []).slice(0, 50)"
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
                  <div v-if="(selectedTable.npc_types || []).length > 50" class="text-center p-1" style="opacity:.4; font-size:.8em;">
                    +{{ (selectedTable.npc_types || []).length - 50 }} more NPCs
                  </div>
                </div>
              </div>
            </div>
          </eq-window>

          <!-- Lootdrops -->
          <eq-window title="Loot Drops" class="p-0" style="flex: 1; display: flex; flex-direction: column;">
            <div class="d-flex justify-content-end px-3 pt-3 pb-1">
              <b-button
                size="sm"
                variant="outline-secondary"
                @click="toggleAllLootdrops"
                style="font-size: .75em;"
              >
                <i class="fa mr-1" :class="allExpanded ? 'fa-compress' : 'fa-expand'"></i>
                {{ allExpanded ? 'Collapse All' : 'Expand All' }}
              </b-button>
            </div>
            <div class="lootdrops-wrapper" style="position: relative; flex: 1; overflow: hidden;">
            <div class="lootdrops-container" ref="lootdropsScroll" style="height: 100%; overflow-y: auto;" @scroll="onLootdropsScroll">
              <div
                v-for="(le, leIndex) in editEntries"
                :key="'le-' + leIndex"
                class="lootdrop-card"
                :class="{ 'pending-add': le._pendingAdd, 'pending-delete': le._pendingDelete }"
              >
                <!-- Lootdrop Header -->
                <div class="lootdrop-header" @click="le._expanded = !le._expanded; $forceUpdate()">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                      <i
                        class="fa mr-2"
                        :class="le._expanded ? 'fa-chevron-down' : 'fa-chevron-right'"
                        style="opacity:.5; width: 14px;"
                      ></i>
                      <span class="lootdrop-name">{{ (le.lootdrop && le.lootdrop.name) || 'Lootdrop #' + le.lootdrop_id }}</span>
                      <span class="badge ml-2" style="background: rgba(255,255,255,0.12); color: #fff;">ID: {{ le.lootdrop_id }}</span>
                      <span class="badge ml-2" style="background: rgba(255,193,7,0.2); color: #ffd54f;">
                        {{ le.lootdrop && le.lootdrop.lootdrop_entries ? le.lootdrop.lootdrop_entries.length : 0 }} items
                      </span>
                    </div>
                    <div class="d-flex align-items-center" @click.stop>
                      <div class="lootdrop-stat mr-3">
                        <label class="small mb-0">Prob%</label>
                        <input
                          type="number"
                          class="form-control form-control-sm lootdrop-input"
                          v-model.number="le.probability"
                          @input="trackFieldEdit('le-' + leIndex + '-probability', originalValues.entries?.[leIndex]?.probability || 100, le.probability)"
                          :class="{ 'pending-edit': isFieldEdited('le-' + leIndex + '-probability') }"
                          :disabled="le._pendingDelete"
                          min="0" max="100" step="1"
                        >
                      </div>
                      <div class="lootdrop-stat mr-3">
                        <label class="small mb-0">Multi</label>
                        <input
                          type="number"
                          class="form-control form-control-sm lootdrop-input"
                          v-model.number="le.multiplier"
                          @input="trackFieldEdit('le-' + leIndex + '-multiplier', originalValues.entries?.[leIndex]?.multiplier || 1, le.multiplier)"
                          :class="{ 'pending-edit': isFieldEdited('le-' + leIndex + '-multiplier') }"
                          :disabled="le._pendingDelete"
                          min="0" step="1"
                        >
                      </div>
                      <div class="lootdrop-stat mr-3">
                        <label class="small mb-0">Limit</label>
                        <input
                          type="number"
                          class="form-control form-control-sm lootdrop-input"
                          v-model.number="le.droplimit"
                          @input="trackFieldEdit('le-' + leIndex + '-droplimit', originalValues.entries?.[leIndex]?.droplimit || 0, le.droplimit)"
                          :class="{ 'pending-edit': isFieldEdited('le-' + leIndex + '-droplimit') }"
                          :disabled="le._pendingDelete"
                          min="0" step="1"
                        >
                      </div>
                      <div class="lootdrop-stat mr-2">
                        <label class="small mb-0">Min</label>
                        <input
                          type="number"
                          class="form-control form-control-sm lootdrop-input"
                          v-model.number="le.mindrop"
                          @input="trackFieldEdit('le-' + leIndex + '-mindrop', originalValues.entries?.[leIndex]?.mindrop || 0, le.mindrop)"
                          :class="{ 'pending-edit': isFieldEdited('le-' + leIndex + '-mindrop') }"
                          :disabled="le._pendingDelete"
                          min="0" step="1"
                        >
                      </div>
                      <b-button
                        v-if="!le._pendingDelete"
                        size="sm"
                        variant="outline-danger"
                        @click.stop="removeLootdrop(leIndex)"
                        title="Remove lootdrop"
                        class="ml-1"
                      >
                        <i class="fa fa-trash"></i>
                      </b-button>
                      <b-button
                        v-else
                        size="sm"
                        variant="outline-success"
                        @click.stop="undoRemoveLootdrop(leIndex)"
                        title="Undo removal"
                        class="ml-1"
                      >
                        <i class="fa fa-undo"></i> Undo
                      </b-button>
                    </div>
                  </div>
                </div>

                <!-- Lootdrop Items -->
                <div v-if="le._expanded && le.lootdrop" class="lootdrop-items">
                  <!-- Content Flags (Lootdrop Level) -->
                  <div class="row mx-2 mt-2 mb-1">
                    <div class="col-6">
                      <label class="small mb-0" style="opacity:.7;">Content Flags</label>
                      <content-flag-selector
                        :value="le.lootdrop.content_flags"
                        @input="le.lootdrop.content_flags = $event; trackFieldEdit('ld-' + leIndex + '-content_flags', originalValues.entries?.[leIndex]?.lootdrop_content_flags || '', le.lootdrop.content_flags)"
                        :key="'ld-cf-' + leIndex + '-' + rerenderContentFlags"
                      />
                    </div>
                    <div class="col-6">
                      <label class="small mb-0" style="opacity:.7;">Content Flags Disabled</label>
                      <content-flag-selector
                        :value="le.lootdrop.content_flags_disabled"
                        @input="le.lootdrop.content_flags_disabled = $event; trackFieldEdit('ld-' + leIndex + '-content_flags_disabled', originalValues.entries?.[leIndex]?.lootdrop_content_flags_disabled || '', le.lootdrop.content_flags_disabled)"
                        :key="'ld-cfd-' + leIndex + '-' + rerenderContentFlags"
                      />
                    </div>
                  </div>

                  <table class="eq-table eq-highlight-rows w-100" style="font-size: 13px;">
                    <thead>
                      <tr>
                        <th style="width: 22%;">Item</th>
                        <th style="width: 7%;" class="text-center">Chance</th>
                        <th style="width: 5%;" class="text-center">Qty</th>
                        <th style="width: 5%;" class="text-center">Equip</th>
                        <th style="width: 10%;" class="text-center">NPC Lvl</th>
                        <th style="width: 10%;" class="text-center">Trivial Lvl</th>
                        <th style="width: 5%;" class="text-center" title="Content Flags"><i class="fa fa-flag" style="color: #e8c56d;"></i></th>
                        <th style="width: 7%;" class="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr 
                        v-for="(lde, ldeIndex) in (le.lootdrop.lootdrop_entries || [])" 
                        :key="'lde-' + lde.lootdrop_id + '-' + lde.item_id"
                        :class="{ 'pending-add': lde._pendingAdd, 'pending-delete': lde._pendingDelete }"
                      >
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
                            @input="trackFieldEdit('lde-' + leIndex + '-' + ldeIndex + '-chance', originalValues.entries?.[leIndex]?.lootdrop_entries?.[ldeIndex]?.chance || 0, lde.chance)"
                            :class="{ 'pending-edit': isFieldEdited('lde-' + leIndex + '-' + ldeIndex + '-chance') }"
                            :disabled="lde._pendingDelete"
                            min="0" max="100" step="0.1"
                          >
                        </td>
                        <td class="text-center">
                          <input
                            type="number"
                            class="form-control form-control-sm text-center entry-input"
                            v-model.number="lde.multiplier"
                            @input="trackFieldEdit('lde-' + leIndex + '-' + ldeIndex + '-multiplier', originalValues.entries?.[leIndex]?.lootdrop_entries?.[ldeIndex]?.multiplier || 1, lde.multiplier)"
                            :class="{ 'pending-edit': isFieldEdited('lde-' + leIndex + '-' + ldeIndex + '-multiplier') }"
                            :disabled="lde._pendingDelete"
                            min="1" step="1"
                          >
                        </td>
                        <td class="text-center">
                          <eq-checkbox
                            class="d-inline-block"
                            :true-value="1"
                            :false-value="0"
                            v-model.number="lde.equip_item"
                            @input="lde.equip_item = $event; trackFieldEdit('lde-' + leIndex + '-' + ldeIndex + '-equip_item', originalValues.entries?.[leIndex]?.lootdrop_entries?.[ldeIndex]?.equip_item || 0, lde.equip_item)"
                            :class="{ 'pending-edit': isFieldEdited('lde-' + leIndex + '-' + ldeIndex + '-equip_item') }"
                            :disabled="lde._pendingDelete"
                          />
                        </td>
                        <td class="text-center">
                          <div class="d-flex">
                            <input
                              type="number"
                              class="form-control form-control-sm text-center entry-input"
                              v-model.number="lde.npc_min_level"
                              @input="trackFieldEdit('lde-' + leIndex + '-' + ldeIndex + '-npc_min_level', originalValues.entries?.[leIndex]?.lootdrop_entries?.[ldeIndex]?.npc_min_level || 0, lde.npc_min_level)"
                              :class="{ 'pending-edit': isFieldEdited('lde-' + leIndex + '-' + ldeIndex + '-npc_min_level') }"
                              :disabled="lde._pendingDelete"
                              placeholder="min"
                              min="0" step="1"
                              style="width: 50%;"
                            >
                            <input
                              type="number"
                              class="form-control form-control-sm text-center entry-input ml-1"
                              v-model.number="lde.npc_max_level"
                              @input="trackFieldEdit('lde-' + leIndex + '-' + ldeIndex + '-npc_max_level', originalValues.entries?.[leIndex]?.lootdrop_entries?.[ldeIndex]?.npc_max_level || 0, lde.npc_max_level)"
                              :class="{ 'pending-edit': isFieldEdited('lde-' + leIndex + '-' + ldeIndex + '-npc_max_level') }"
                              :disabled="lde._pendingDelete"
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
                              @input="trackFieldEdit('lde-' + leIndex + '-' + ldeIndex + '-trivial_min_level', originalValues.entries?.[leIndex]?.lootdrop_entries?.[ldeIndex]?.trivial_min_level || 0, lde.trivial_min_level)"
                              :class="{ 'pending-edit': isFieldEdited('lde-' + leIndex + '-' + ldeIndex + '-trivial_min_level') }"
                              :disabled="lde._pendingDelete"
                              placeholder="min"
                              min="0" step="1"
                              style="width: 50%;"
                            >
                            <input
                              type="number"
                              class="form-control form-control-sm text-center entry-input ml-1"
                              v-model.number="lde.trivial_max_level"
                              @input="trackFieldEdit('lde-' + leIndex + '-' + ldeIndex + '-trivial_max_level', originalValues.entries?.[leIndex]?.lootdrop_entries?.[ldeIndex]?.trivial_max_level || 0, lde.trivial_max_level)"
                              :class="{ 'pending-edit': isFieldEdited('lde-' + leIndex + '-' + ldeIndex + '-trivial_max_level') }"
                              :disabled="lde._pendingDelete"
                              placeholder="max"
                              min="0" step="1"
                              style="width: 50%;"
                            >
                          </div>
                        </td>
                        <td class="text-center">
                          <b-dropdown
                            size="sm"
                            variant="link"
                            no-caret
                            right
                            :disabled="lde._pendingDelete"
                            class="content-flag-dropdown"
                            :class="{ 'content-flag-edited': isFieldEdited('lde-' + leIndex + '-' + ldeIndex + '-content_flags') || isFieldEdited('lde-' + leIndex + '-' + ldeIndex + '-content_flags_disabled') }"
                          >
                            <template #button-content>
                              <i class="fa fa-flag" :style="{ color: (lde.content_flags || lde.content_flags_disabled) ? '#e8c56d' : '#555' }"></i>
                              <span v-if="flagCount(lde)" class="badge badge-warning ml-1" style="font-size: 10px;">{{ flagCount(lde) }}</span>
                            </template>
                            <div class="p-3" style="min-width: 280px;" @click.stop>
                              <div class="mb-2">
                                <label class="small font-weight-bold text-muted mb-1">Content Flags</label>
                                <content-flag-selector
                                  :value="lde.content_flags"
                                  @input="lde.content_flags = $event; trackFieldEdit('lde-' + leIndex + '-' + ldeIndex + '-content_flags', originalValues.entries?.[leIndex]?.lootdrop_entries?.[ldeIndex]?.content_flags || '', lde.content_flags)"
                                  :key="'lde-cf-' + leIndex + '-' + ldeIndex + '-' + rerenderContentFlags"
                                />
                              </div>
                              <div>
                                <label class="small font-weight-bold text-muted mb-1">Flags Disabled</label>
                                <content-flag-selector
                                  :value="lde.content_flags_disabled"
                                  @input="lde.content_flags_disabled = $event; trackFieldEdit('lde-' + leIndex + '-' + ldeIndex + '-content_flags_disabled', originalValues.entries?.[leIndex]?.lootdrop_entries?.[ldeIndex]?.content_flags_disabled || '', lde.content_flags_disabled)"
                                  :key="'lde-cfd-' + leIndex + '-' + ldeIndex + '-' + rerenderContentFlags"
                                />
                              </div>
                            </div>
                          </b-dropdown>
                        </td>
                        <td class="text-center">
                          <b-button
                            v-if="!lde._pendingDelete"
                            size="sm"
                            variant="outline-danger"
                            @click="removeItem(leIndex, ldeIndex)"
                            title="Remove item"
                          >
                            <i class="fa fa-times"></i>
                          </b-button>
                          <b-button
                            v-else
                            size="sm"
                            variant="outline-success"
                            @click="undoRemoveItem(leIndex, ldeIndex)"
                            title="Undo removal"
                          >
                            <i class="fa fa-undo"></i> Undo
                          </b-button>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Chance Distribution Bar -->
                  <div class="chance-bar mt-2 mb-2 mx-2" v-if="le.lootdrop && le.lootdrop.lootdrop_entries && le.lootdrop.lootdrop_entries.length > 0">
                    <div class="chance-bar-label mb-1">
                      <small style="opacity:.5;">Chance Distribution</small>
                      <small
                        class="ml-2"
                        :style="getTotalChance(le) === 100 ? 'color: #81c784;' : 'color: #ef9a9a;'"
                      >{{ getTotalChance(le).toFixed(1) }}%</small>
                    </div>
                    <div class="chance-bar-visual">
                      <div
                        v-for="(lde, ci) in (le.lootdrop.lootdrop_entries || [])"
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
                    <div v-if="le._addingItem" class="add-item-search-wrap">
                      <div class="d-flex align-items-center">
                        <div class="position-relative flex-grow-1">
                          <input
                            type="text"
                            class="form-control form-control-sm"
                            v-model="le._itemSearchQuery"
                            :placeholder="'Search items by name or ID...'"
                            @input="searchItems(leIndex)"
                            @keydown.down.prevent="navigateResults(leIndex, 1)"
                            @keydown.up.prevent="navigateResults(leIndex, -1)"
                            @keydown.enter.prevent="selectHighlightedItem(leIndex)"
                            @keydown.escape="le._addingItem = false; $forceUpdate()"
                            :ref="'itemSearch-' + leIndex"
                            autocomplete="off"
                          >
                          <!-- Search Results Dropdown -->
                          <div
                            v-if="le._searchResults && le._searchResults.length > 0"
                            class="item-search-dropdown"
                            :style="getDropdownPosition(leIndex)"
                          >
                            <div
                              v-for="(item, ri) in le._searchResults"
                              :key="'sr-' + item.id"
                              class="item-search-result"
                              :class="{ 'highlighted': le._highlightIndex === ri }"
                              @click="addSearchedItem(leIndex, item)"
                              @mouseenter="le._highlightIndex = ri; $forceUpdate()"
                            >
                              <div class="d-flex align-items-center">
                                <item-popover :item="item" size="sm" class="d-inline-block mr-2" />
                                <small style="opacity:.4; margin-left: auto;">ID: {{ item.id }}</small>
                              </div>
                            </div>
                            <div v-if="le._searchResults.length >= 20" class="text-center p-1" style="opacity:.3; font-size:.75em;">
                              Showing first 20 results — refine your search
                            </div>
                          </div>
                          <div
                            v-if="le._itemSearchQuery && le._itemSearchQuery.length >= 2 && le._searchResults && le._searchResults.length === 0 && !le._searching"
                            class="item-search-dropdown"
                            :style="getDropdownPosition(leIndex)"
                          >
                            <div class="text-center p-2" style="opacity:.4; font-size:.85em;">No items found</div>
                          </div>
                          <div
                            v-if="le._searching"
                            class="item-search-dropdown"
                            :style="getDropdownPosition(leIndex)"
                          >
                            <div class="text-center p-2" style="opacity:.5;"><i class="fa fa-spinner fa-spin mr-1"></i> Searching...</div>
                          </div>
                        </div>
                        <b-button
                          size="sm"
                          variant="outline-secondary"
                          class="ml-2"
                          @click="le._addingItem = false; le._searchResults = []; $forceUpdate()"
                          title="Cancel"
                        >
                          <i class="fa fa-times"></i>
                        </b-button>
                      </div>
                    </div>
                    <b-button
                      v-else
                      size="sm"
                      variant="outline-success"
                      @click="startAddItem(leIndex)"
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
            <transition name="fade">
              <div v-if="showLootdropsScrollHint" class="scroll-hint-overlay" @click="scrollLootdropsToBottom">
                <div class="scroll-hint-arrow">
                  <i class="fa fa-chevron-down"></i>
                </div>
              </div>
            </transition>
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
import ContentFlagSelector from "../../components/selectors/ContentFlagSelector";
import {ROUTE}             from "../../routes";
import {LoottableApi, ItemApi} from "../../app/api";
import {LoottableEntryApi} from "../../app/api/api/loottable-entry-api";
import {LootdropApi} from "../../app/api/api/lootdrop-api";
import {LootdropEntryApi} from "../../app/api/api/lootdrop-entry-api";
import {SpireApi}          from "../../app/api/spire-api";
import {SpireQueryBuilder} from "../../app/api/spire-query-builder";
import {debounce}          from "../../app/utility/debounce";

export default {
  name: "Loot",
  components: { EqCashDisplay, NpcPopover, ItemPopover, EqCheckbox, ContentArea, EqWindow, ContentFlagSelector },
  data() {
    return {
      tableData: [],
      selectedTable: null,
      editTable: {},
      editEntries: [],
      showLootdropsScrollHint: false,
      originalSnapshot: null,
      originalValues: {},

      pendingChanges: {
        tableFields: {},        // { fieldName: { old, new } } for loottable fields
        addedLootdrops: [],     // newly added lootdrop entries (full objects, not yet saved)
        deletedLootdrops: [],   // indices/ids of lootdrops marked for deletion
        addedItems: {},         // { lootdropIndex: [{ item, lde }] } items added to existing lootdrops
        deletedItems: {},       // { lootdropIndex: [ldeIndex] } items marked for deletion
        editedFields: {},       // { 'le-{leIdx}-{field}': { old, new }, 'lde-{leIdx}-{ldeIdx}-{field}': { old, new } }
      },

      search: "",
      currentPage: 1,
      totalRows: 0,
      loading: false,
      saving: false,
      hasUnsavedChanges: false,
      notification: null,
      npcsExpanded: false,
      allExpanded: false,
      rerenderContentFlags: 0,
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

    isFieldEdited(key) {
      return !!this.pendingChanges.editedFields[key]
    },

    flagCount(lde) {
      let count = 0;
      if (lde.content_flags) count += lde.content_flags.split(',').filter(f => f.trim()).length;
      if (lde.content_flags_disabled) count += lde.content_flags_disabled.split(',').filter(f => f.trim()).length;
      return count;
    },
    trackFieldEdit(key, oldVal, newVal) {
      // Coerce to same type for comparison (v-model.number can return string or number)
      const oldNum = Number(oldVal)
      const newNum = Number(newVal)
      const isNumeric = !isNaN(oldNum) && !isNaN(newNum)
      const same = isNumeric ? oldNum === newNum : String(oldVal) === String(newVal)
      if (same) {
        this.$delete(this.pendingChanges.editedFields, key)
      } else {
        this.$set(this.pendingChanges.editedFields, key, { old: oldVal, new: newVal })
      }
      // Also track table-level fields separately for the save guard
      if (key.startsWith('table-')) {
        if (same) {
          this.$delete(this.pendingChanges.tableFields, key)
        } else {
          this.$set(this.pendingChanges.tableFields, key, { old: oldVal, new: newVal })
        }
      }
      this.updateHasChanges()
    },

    updateHasChanges() {
      this.hasUnsavedChanges = (
        Object.keys(this.pendingChanges.tableFields).length > 0 ||
        this.pendingChanges.addedLootdrops.length > 0 ||
        this.pendingChanges.deletedLootdrops.length > 0 ||
        Object.keys(this.pendingChanges.addedItems).length > 0 ||
        Object.keys(this.pendingChanges.deletedItems).length > 0 ||
        Object.keys(this.pendingChanges.editedFields).length > 0
      )
    },

    resetPendingChanges() {
      this.pendingChanges = {
        tableFields: {},
        addedLootdrops: [],
        deletedLootdrops: [],
        addedItems: {},
        deletedItems: {},
        editedFields: {},
      }
      this.hasUnsavedChanges = false
    },

    toggleAllLootdrops() {
      this.allExpanded = !this.allExpanded
      this.editEntries.forEach(le => { le._expanded = this.allExpanded })
      this.$forceUpdate()
    },

    goToNpc(id) {
      window.open(window.location.origin + '/npc/' + id, '_blank')
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
      this.selectedTable = JSON.parse(JSON.stringify(lt))
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
        _expanded: false,
        _addingItem: false,
        _newItemId: null,
        _newItemChance: 10,
        lootdrop: {
          ...le.lootdrop,
          lootdrop_entries: le.lootdrop.lootdrop_entries
            ? le.lootdrop.lootdrop_entries.map(lde => ({ ...lde }))
            : [],
        },
      }))
      
      // Store original values for change tracking
      this.originalValues = {
        table: { ...this.editTable },
        entries: JSON.parse(JSON.stringify(this.editEntries.map(le => ({
          probability: le.probability,
          multiplier: le.multiplier,
          lootdrop_content_flags: le.lootdrop?.content_flags || '',
          lootdrop_content_flags_disabled: le.lootdrop?.content_flags_disabled || '',
          droplimit: le.droplimit,
          mindrop: le.mindrop,
          lootdrop_entries: (le.lootdrop?.lootdrop_entries || []).map(lde => ({
            chance: lde.chance,
            multiplier: lde.multiplier,
            equip_item: lde.equip_item,
            npc_min_level: lde.npc_min_level,
            npc_max_level: lde.npc_max_level,
            trivial_min_level: lde.trivial_min_level,
            trivial_max_level: lde.trivial_max_level,
            content_flags: lde.content_flags || '',
            content_flags_disabled: lde.content_flags_disabled || '',
          }))
        }))))
      }
      
      this.resetPendingChanges()
      this.rerenderContentFlags++
      this.originalSnapshot = JSON.stringify({ editTable: this.editTable, editEntries: this.editEntries })
      this.hasUnsavedChanges = false
      this.$nextTick(() => this.checkLootdropsScroll())
    },

    // --- CRUD ---
    async saveLoottable() {
      this.saving = true
      try {
        // Process in order: create new lootdrops → create new items → update edited fields → delete items → delete lootdrops → update loottable fields
        
        // 1. Create new lootdrops and get their IDs
        const ldApi = new LootdropApi(...SpireApi.cfg())
        const lteApi = new LoottableEntryApi(...SpireApi.cfg())
        
        for (const newLe of this.pendingChanges.addedLootdrops) {
          try {
            // Create lootdrop
            const r = await ldApi.createLootdrop({
              lootdrop: {
                name: newLe.lootdrop.name,
                content_flags: newLe.lootdrop.content_flags || '',
                content_flags_disabled: newLe.lootdrop.content_flags_disabled || '',
              }
            })
            const createdDrop = Array.isArray(r.data) ? r.data[0] : r.data
            
            if (createdDrop && createdDrop.id) {
              // Update the local object with the new ID
              newLe.lootdrop_id = createdDrop.id
              newLe.lootdrop.id = createdDrop.id
              
              // Create loottable entry linking it
              await lteApi.createLoottableEntry({
                loottableEntry: {
                  loottable_id: this.editTable.id,
                  lootdrop_id: createdDrop.id,
                  multiplier: newLe.multiplier || 1,
                  droplimit: newLe.droplimit || 0,
                  mindrop: newLe.mindrop || 0,
                  probability: newLe.probability || 100,
                }
              })
              
              // Remove pending add marker
              delete newLe._pendingAdd
            }
          } catch (e) {
            console.error('Error creating lootdrop:', e)
            this.showNotification('Error creating lootdrop: ' + (e.message || e), 'error')
          }
        }

        // 2. Create new items
        const ldeApi = new LootdropEntryApi(...SpireApi.cfg())
        
        for (const [leIndex, addedItems] of Object.entries(this.pendingChanges.addedItems)) {
          const le = this.editEntries[leIndex]
          for (const addedItem of addedItems) {
            try {
              await ldeApi.createLootdropEntry({
                lootdropEntry: {
                  lootdrop_id: le.lootdrop_id,
                  item_id: addedItem.item.id,
                  chance: addedItem.lde.chance || 10,
                  multiplier: addedItem.lde.multiplier || 1,
                  equip_item: addedItem.lde.equip_item || 0,
                  item_charges: addedItem.lde.item_charges || 1,
                  npc_min_level: addedItem.lde.npc_min_level || 0,
                  npc_max_level: addedItem.lde.npc_max_level || 0,
                  trivial_min_level: addedItem.lde.trivial_min_level || 0,
                  trivial_max_level: addedItem.lde.trivial_max_level || 0,
                  content_flags: addedItem.lde.content_flags || '',
                  content_flags_disabled: addedItem.lde.content_flags_disabled || '',
                }
              })
              
              // Remove pending add marker from the corresponding lde
              const correspondingLde = le.lootdrop.lootdrop_entries.find(
                lde => lde.item_id === addedItem.item.id && lde._pendingAdd
              )
              if (correspondingLde) {
                delete correspondingLde._pendingAdd
              }
            } catch (e) {
              console.error('Error creating item:', e)
              this.showNotification('Error adding item: ' + (e.message || e), 'error')
            }
          }
        }

        // 3. Update edited fields
        // Loottable fields
        if (Object.keys(this.pendingChanges.tableFields).length > 0) {
          const ltApi = new LoottableApi(...SpireApi.cfg())
          await ltApi.updateLoottable({
            id: this.editTable.id,
            loottable: {
              name: this.editTable.name,
              mincash: this.editTable.mincash || 0,
              maxcash: this.editTable.maxcash || 0,
              avgcoin: this.editTable.avgcoin || 0,
              min_expansion: this.editTable.min_expansion || -1,
              max_expansion: this.editTable.max_expansion || -1,
              content_flags: this.editTable.content_flags || '',
              content_flags_disabled: this.editTable.content_flags_disabled || '',
              done: this.editTable.done || 0,
            }
          })
        }

        // Loottable entry fields (probability, multiplier, etc.)
        const leUpdated = new Set()
        for (const [fieldKey, change] of Object.entries(this.pendingChanges.editedFields)) {
          if (fieldKey.startsWith('le-') && !fieldKey.startsWith('lde-')) {
            const parts = fieldKey.split('-')
            const leIndex = parseInt(parts[1])
            const le = this.editEntries[leIndex]
            if (le && !le._pendingAdd && !le._pendingDelete && !leUpdated.has(leIndex)) {
              leUpdated.add(leIndex)
              
              try {
                // Composite key table — pass lootdrop_id as query param AND include key fields in body
                await SpireApi.v1().patch('/loottable_entry/' + le.loottable_id, {
                    loottable_id: le.loottable_id,
                    lootdrop_id: le.lootdrop_id,
                    multiplier: le.multiplier || 1,
                    droplimit: le.droplimit || 0,
                    mindrop: le.mindrop || 0,
                    probability: le.probability || 100,
                  }, { params: { lootdrop_id: le.lootdrop_id } })
              } catch (e) {
                console.error('Error updating loottable entry:', e)
              }
            }
          }
        }

        // Lootdrop fields (content_flags, content_flags_disabled)
        const ldUpdated = new Set()
        for (const [fieldKey, change] of Object.entries(this.pendingChanges.editedFields)) {
          if (fieldKey.startsWith('ld-') && !fieldKey.startsWith('lde-')) {
            const parts = fieldKey.split('-')
            const leIndex = parseInt(parts[1])
            const le = this.editEntries[leIndex]
            if (le && le.lootdrop && le.lootdrop.id && !le._pendingAdd && !le._pendingDelete && !ldUpdated.has(leIndex)) {
              ldUpdated.add(leIndex)

              try {
                await ldApi.updateLootdrop({
                  id: le.lootdrop.id,
                  lootdrop: {
                    name: le.lootdrop.name || '',
                    content_flags: le.lootdrop.content_flags || '',
                    content_flags_disabled: le.lootdrop.content_flags_disabled || '',
                    min_expansion: le.lootdrop.min_expansion || -1,
                    max_expansion: le.lootdrop.max_expansion || -1,
                  }
                })
              } catch (e) {
                console.error('Error updating lootdrop:', e)
              }
            }
          }
        }

        // Lootdrop entry fields (chance, levels, etc.)
        // Deduplicate: only update each unique lootdrop_id+item_id combo once
        const ldeUpdated = new Set()
        for (const [fieldKey, change] of Object.entries(this.pendingChanges.editedFields)) {
          if (fieldKey.startsWith('lde-')) {
            const parts = fieldKey.split('-')
            const leIndex = parseInt(parts[1])
            const ldeIndex = parseInt(parts[2])
            const le = this.editEntries[leIndex]
            const lde = le && le.lootdrop && le.lootdrop.lootdrop_entries ? le.lootdrop.lootdrop_entries[ldeIndex] : null
            const dedupeKey = lde ? lde.lootdrop_id + '-' + lde.item_id : null
            if (lde && !lde._pendingAdd && !lde._pendingDelete && dedupeKey && !ldeUpdated.has(dedupeKey)) {
              ldeUpdated.add(dedupeKey)
              
              try {
                // Composite key table — pass item_id as query param AND include key fields in body
                await SpireApi.v1().patch('/lootdrop_entry/' + lde.lootdrop_id, {
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
                    content_flags: lde.content_flags || '',
                    content_flags_disabled: lde.content_flags_disabled || '',
                  }, { params: { item_id: lde.item_id } })
              } catch (e) {
                console.error('Error updating lootdrop entry:', e)
              }
            }
          }
        }

        // 4. Delete items
        for (const [leIndex, ldeIndices] of Object.entries(this.pendingChanges.deletedItems)) {
          const le = this.editEntries[leIndex]
          for (const ldeIndex of ldeIndices) {
            const lde = le.lootdrop.lootdrop_entries[ldeIndex]
            if (lde && !lde._pendingAdd) {
              try {
                await SpireApi.v1().delete('/lootdrop_entry/' + lde.lootdrop_id, { params: { item_id: lde.item_id } })
              } catch (e) {
                console.error('Error deleting item:', e)
              }
            }
          }
        }

        // 5. Delete lootdrops
        for (const leIndex of this.pendingChanges.deletedLootdrops) {
          const le = this.editEntries[leIndex]
          if (le && !le._pendingAdd) {
            try {
              await SpireApi.v1().delete('/loottable_entry/' + le.loottable_id, { params: { lootdrop_id: le.lootdrop_id } })
            } catch (e) {
              console.error('Error deleting lootdrop:', e)
            }
          }
        }

        // Clear pending changes and refresh
        this.resetPendingChanges()
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
          loottable: {
            name: 'New Loot Table',
            mincash: 0,
            maxcash: 0,
          }
        })
        const created_lt = Array.isArray(r.data) ? r.data[0] : r.data
        if (created_lt && created_lt.id) {
          this.showNotification('Created loot table #' + created_lt.id)
          await this.listLootTables()
          const created = this.tableData.find(lt => lt.id === created_lt.id)
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
          loottable: {
            name: (this.editTable.name || '') + ' (Clone)',
            mincash: this.editTable.mincash || 0,
            maxcash: this.editTable.maxcash || 0,
            avgcoin: this.editTable.avgcoin || 0,
          }
        })
        const cloned_lt = Array.isArray(r.data) ? r.data[0] : r.data
        if (cloned_lt && cloned_lt.id) {
          const newId = cloned_lt.id
          // Clone loottable entries (link to same lootdrops)
          const lteApi = new LoottableEntryApi(...SpireApi.cfg())
          for (const le of this.editEntries) {
            await lteApi.createLoottableEntry({
              loottableEntry: {
                loottable_id: newId,
                lootdrop_id: le.lootdrop_id,
                multiplier: le.multiplier || 1,
                droplimit: le.droplimit || 0,
                mindrop: le.mindrop || 0,
                probability: le.probability || 100,
              }
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

    confirmReset() {
      if (confirm('Discard ALL pending changes? This will revert every add, delete, and edit back to the last saved state.')) {
        this.selectLoottable(this.selectedTable)
        this.showNotification('All pending changes discarded')
      }
    },

    async deleteLoottable() {
      if (!confirm('⚠️ PERMANENTLY DELETE loot table "' + (this.editTable.name || '#' + this.editTable.id) + '" (ID: ' + this.editTable.id + ')?\n\nThis will destroy the loot table and ALL associated loot drops and item entries. This action is IRREVERSIBLE and cannot be undone.\n\nAre you absolutely sure?')) return
      try {
        const ltApi = new LoottableApi(...SpireApi.cfg())
        await ltApi.deleteLoottable({ id: this.editTable.id })
        this.showNotification('Deleted loot table #' + this.editTable.id)
        this.selectedTable = null
        this.hasUnsavedChanges = false
        await this.listLootTables()
      } catch (e) {
        this.showNotification('Error deleting', 'error')
      }
    },

    checkLootdropsScroll() {
      const el = this.$refs.lootdropsScroll;
      if (!el) return;
      this.showLootdropsScrollHint = el.scrollHeight > el.clientHeight &&
        (el.scrollHeight - el.scrollTop - el.clientHeight) > 30;
    },
    onLootdropsScroll() {
      this.checkLootdropsScroll();
    },
    scrollLootdropsToBottom() {
      const el = this.$refs.lootdropsScroll;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    },
    addLootdrop() {
      // Create placeholder lootdrop entry
      const newLe = {
        loottable_id: this.editTable.id,
        lootdrop_id: null, // Will be assigned when saved
        probability: 100,
        multiplier: 1,
        droplimit: 0,
        mindrop: 0,
        _expanded: false,
        _addingItem: false,
        _pendingAdd: true,
        lootdrop: {
          id: null,
          name: (this.editTable.name || 'Lootdrop') + ' - Drop ' + (this.editEntries.length + 1),
          lootdrop_entries: []
        }
      }
      
      // Add to display
      this.editEntries.push(newLe)
      
      // Track in pending changes
      this.pendingChanges.addedLootdrops.push(newLe)
      
      this.showNotification('Queued new lootdrop for creation')
      this.updateHasChanges()
    },

    removeLootdrop(index) {
      const le = this.editEntries[index]
      
      if (le._pendingAdd) {
        // If this was a pending add, just remove it from the queue and display
        this.editEntries.splice(index, 1)
        
        // Remove from pending adds
        this.pendingChanges.addedLootdrops = this.pendingChanges.addedLootdrops.filter(
          addedLe => addedLe !== le
        )
        
        this.showNotification('Cancelled addition of ' + (le.lootdrop.name || 'lootdrop'))
      } else {
        // Mark existing lootdrop for deletion
        if (!confirm('Remove lootdrop "' + (le.lootdrop.name || le.lootdrop_id) + '" from this table?')) return
        
        this.$set(le, '_pendingDelete', true)
        
        // Track in pending changes
        this.pendingChanges.deletedLootdrops.push(index)
        
        this.showNotification('Queued lootdrop "' + (le.lootdrop.name || le.lootdrop_id) + '" for deletion')
      }
      
      this.updateHasChanges()
    },

    getDropdownPosition(leIndex) {
      const ref = this.$refs['itemSearch-' + leIndex]
      if (ref && ref[0]) {
        const rect = ref[0].getBoundingClientRect()
        return {
          top: rect.bottom + 'px',
          left: rect.left + 'px',
          width: rect.width + 'px',
        }
      }
      return {}
    },

    startAddItem(leIndex) {
      const le = this.editEntries[leIndex]
      this.$set(le, '_addingItem', true)
      this.$set(le, '_itemSearchQuery', '')
      this.$set(le, '_searchResults', [])
      this.$set(le, '_highlightIndex', -1)
      this.$set(le, '_searching', false)
      this.$nextTick(() => {
        const ref = this.$refs['itemSearch-' + leIndex]
        if (ref && ref[0]) ref[0].focus()
      })
    },

    searchItems: debounce(function(leIndex) {
      const le = this.editEntries[leIndex]
      const q = (le._itemSearchQuery || '').trim()
      if (q.length < 2) {
        this.$set(le, '_searchResults', [])
        return
      }
      this.$set(le, '_searching', true)
      this.$set(le, '_highlightIndex', -1)

      const builder = new SpireQueryBuilder()
      if (!isNaN(q) && q !== '') {
        builder.where("id", "=", q)
      } else {
        builder.where("name", "like", q)
      }
      builder.limit(20)

      const api = new ItemApi(...SpireApi.cfg())
      api.listItems(builder.get()).then((r) => {
        if (r.status === 200) {
          this.$set(le, '_searchResults', r.data || [])
        } else {
          this.$set(le, '_searchResults', [])
        }
        this.$set(le, '_searching', false)
      }).catch(() => {
        this.$set(le, '_searchResults', [])
        this.$set(le, '_searching', false)
      })
    }, 300),

    navigateResults(leIndex, direction) {
      const le = this.editEntries[leIndex]
      if (!le._searchResults || le._searchResults.length === 0) return
      let idx = (le._highlightIndex || 0) + direction
      if (idx < 0) idx = le._searchResults.length - 1
      if (idx >= le._searchResults.length) idx = 0
      le._highlightIndex = idx
      this.$forceUpdate()
    },

    selectHighlightedItem(leIndex) {
      const le = this.editEntries[leIndex]
      if (!le._searchResults || le._searchResults.length === 0) {
        // If user hit enter before debounce fired, trigger search immediately
        if (le._itemSearchQuery && le._itemSearchQuery.trim().length >= 2) {
          this.searchItemsImmediate(leIndex)
        }
        return
      }
      // Only add if user has explicitly navigated to an item with arrow keys
      if (le._highlightIndex < 0) return
      this.addSearchedItem(leIndex, le._searchResults[le._highlightIndex])
    },

    searchItemsImmediate(leIndex) {
      const le = this.editEntries[leIndex]
      const q = (le._itemSearchQuery || '').trim()
      if (q.length < 2) return
      this.$set(le, '_searching', true)

      const builder = new SpireQueryBuilder()
      if (!isNaN(q) && q !== '') {
        builder.where("id", "=", q)
      } else {
        builder.where("name", "like", q)
      }
      builder.limit(20)

      const api = new ItemApi(...SpireApi.cfg())
      api.listItems(builder.get()).then((r) => {
        this.$set(le, '_searchResults', (r.status === 200) ? (r.data || []) : [])
        this.$set(le, '_highlightIndex', le._searchResults.length > 0 ? 0 : -1)
        this.$set(le, '_searching', false)
      }).catch(() => {
        this.$set(le, '_searchResults', [])
        this.$set(le, '_searching', false)
      })
    },

    addSearchedItem(leIndex, item) {
      const le = this.editEntries[leIndex]
      
      // Create new lootdrop entry object
      const newLde = {
        lootdrop_id: le.lootdrop_id,
        item_id: item.id,
        chance: 10,
        multiplier: 1,
        equip_item: 0,
        item_charges: 1,
        npc_min_level: 0,
        npc_max_level: 0,
        trivial_min_level: 0,
        trivial_max_level: 0,
        item: item,
        _pendingAdd: true
      }
      
      // Add to local display
      le.lootdrop.lootdrop_entries.push(newLde)
      
      // Track in pending changes
      if (!this.pendingChanges.addedItems[leIndex]) {
        this.$set(this.pendingChanges.addedItems, leIndex, [])
      }
      this.pendingChanges.addedItems[leIndex].push({ item, lde: newLde })
      
      le._addingItem = false
      le._searchResults = []
      this.showNotification('Queued ' + (item.Name || item.name || 'item #' + item.id) + ' for addition')
      this.updateHasChanges()
    },

    removeItem(leIndex, ldeIndex) {
      const lde = this.editEntries[leIndex].lootdrop.lootdrop_entries[ldeIndex]
      
      if (lde._pendingAdd) {
        // If this was a pending add, just remove it from the queue and display
        this.editEntries[leIndex].lootdrop.lootdrop_entries.splice(ldeIndex, 1)
        
        // Remove from pending adds
        if (this.pendingChanges.addedItems[leIndex]) {
          this.pendingChanges.addedItems[leIndex] = this.pendingChanges.addedItems[leIndex].filter(
            addedItem => addedItem.lde.item_id !== lde.item_id
          )
          if (this.pendingChanges.addedItems[leIndex].length === 0) {
            this.$delete(this.pendingChanges.addedItems, leIndex)
          }
        }
        
        this.showNotification('Cancelled addition of ' + (lde.item ? lde.item.Name || lde.item.name : 'item #' + lde.item_id))
      } else {
        // Mark existing item for deletion
        if (!confirm('Remove ' + (lde.item ? lde.item.Name || lde.item.name : 'item #' + lde.item_id) + '?')) return
        
        this.$set(lde, '_pendingDelete', true)
        
        // Track in pending changes
        if (!this.pendingChanges.deletedItems[leIndex]) {
          this.$set(this.pendingChanges.deletedItems, leIndex, [])
        }
        this.pendingChanges.deletedItems[leIndex].push(ldeIndex)
        
        this.showNotification('Queued ' + (lde.item ? lde.item.Name || lde.item.name : 'item #' + lde.item_id) + ' for deletion')
      }
      
      this.updateHasChanges()
    },

    undoRemoveItem(leIndex, ldeIndex) {
      const lde = this.editEntries[leIndex].lootdrop.lootdrop_entries[ldeIndex]
      
      // Remove pending delete marker
      this.$delete(lde, '_pendingDelete')
      
      // Remove from pending deletes
      if (this.pendingChanges.deletedItems[leIndex]) {
        this.pendingChanges.deletedItems[leIndex] = this.pendingChanges.deletedItems[leIndex].filter(
          idx => idx !== ldeIndex
        )
        if (this.pendingChanges.deletedItems[leIndex].length === 0) {
          this.$delete(this.pendingChanges.deletedItems, leIndex)
        }
      }
      
      this.showNotification('Cancelled removal of ' + (lde.item ? lde.item.Name || lde.item.name : 'item #' + lde.item_id))
      this.updateHasChanges()
    },

    undoRemoveLootdrop(leIndex) {
      const le = this.editEntries[leIndex]
      
      // Remove pending delete marker
      this.$delete(le, '_pendingDelete')
      
      // Remove from pending deletes
      this.pendingChanges.deletedLootdrops = this.pendingChanges.deletedLootdrops.filter(
        idx => idx !== leIndex
      )
      
      this.showNotification('Cancelled removal of lootdrop "' + (le.lootdrop.name || le.lootdrop_id) + '"')
      this.updateHasChanges()
    },

    async refreshCurrentTable() {
      const id = this.editTable.id
      // Preserve expanded states
      const expandedMap = {}
      this.editEntries.forEach(le => { expandedMap[le.lootdrop_id] = le._expanded })
      await this.listLootTables()
      const refreshed = this.tableData.find(lt => lt.id === id)
      if (refreshed) {
        this.selectedTable = refreshed
        this.selectLoottable(refreshed)
        // Restore expanded states
        this.editEntries.forEach(le => {
          if (expandedMap[le.lootdrop_id]) {
            this.$set(le, '_expanded', true)
          }
        })
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

<style>
.content-flag-dropdown .dropdown-menu {
  background: rgba(20, 20, 35, 0.98);
  border: 1px solid rgba(200, 180, 120, 0.3);
}
.content-flag-dropdown .btn-link {
  padding: 2px 6px;
  color: inherit;
}
.content-flag-dropdown .btn-link:hover {
  text-decoration: none;
}
.content-flag-edited .btn-link {
  background: rgba(255, 165, 0, 0.25);
  border-radius: 4px;
  box-shadow: 0 0 0 2px rgba(255, 165, 0, 0.5);
}
</style>
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
  border: 2px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  margin: 10px 8px;
  overflow: hidden;
  background: rgba(0,0,0,0.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.lootdrop-card:first-child {
  margin-top: 16px;
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

.add-item-search-wrap {
  position: relative;
}
.item-search-dropdown {
  position: fixed;
  z-index: 9999;
  background: #1a1a2e;
  border: 1px solid rgba(255,193,7,0.3);
  border-radius: 0 0 6px 6px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 12px 32px rgba(0,0,0,0.8);
}
.item-search-result {
  padding: 6px 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.1s;
}
.item-search-result:hover,
.item-search-result.highlighted {
  background: rgba(255,193,7,0.12);
}
.item-search-result:last-child {
  border-bottom: none;
}

.save-btn-glow {
  box-shadow: 0 0 8px 2px rgba(244, 67, 54, 0.6) !important;
  animation: loot-save-pulse 1.5s ease-in-out infinite !important;
}
@keyframes loot-save-pulse {
  0%, 100% { box-shadow: 0 0 8px 2px rgba(244, 67, 54, 0.6); }
  50% { box-shadow: 0 0 14px 4px rgba(244, 67, 54, 0.9); }
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

/* Pending Add — green theme */
.pending-add {
  background: rgba(76, 175, 80, 0.15) !important;
  border-left: 3px solid #4caf50;
}
.pending-add td {
  color: #81c784 !important;
}

/* Pending Delete — red theme + strikethrough */
.pending-delete {
  background: rgba(244, 67, 54, 0.15) !important;
  border-left: 3px solid #f44336;
  opacity: 0.7;
}
.pending-delete td {
  text-decoration: line-through;
  color: #ef9a9a !important;
}

/* Pending Edit — orange highlight on individual fields */
.pending-edit {
  background: rgba(255, 152, 0, 0.2) !important;
  border-color: #ff9800 !important;
  box-shadow: 0 0 4px rgba(255, 152, 0, 0.3);
}
.scroll-hint-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(transparent, rgba(15, 15, 25, 0.95));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
  cursor: pointer;
  pointer-events: auto;
  z-index: 5;
}
.scroll-hint-arrow {
  color: #e8c56d;
  font-size: 18px;
  animation: pulse-bounce 1.5s ease-in-out infinite;
}
@keyframes pulse-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.6; }
  50% { transform: translateY(5px); opacity: 1; }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
