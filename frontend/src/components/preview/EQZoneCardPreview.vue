<template>
  <eq-window
    id="zone-preview"
    v-if="zone"
    class="p-0"
  >
    <div class="p-3 pt-1">
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
            <div class="d-flex align-items-center mb-2 px-1">
              <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                     v-model="npcSearchQuery" placeholder="Search NPCs..." style="max-width: 250px;"
                     @input="npcPage = 1" />
              <span class="ml-auto text-muted" style="font-size: 11px;">
                {{ filteredNpcs.length }} results
                <template v-if="npcTotalPages > 1"> · Page {{ npcPage }}/{{ npcTotalPages }}</template>
              </span>
            </div>
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
                v-for="(n, index) in paginatedNpcs"
                :key="n.id"
                @mouseenter="emitSidebarArrow($event, n.npc)"
                @mouseleave="clearSidebarArrow()"
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
            <div class="d-flex justify-content-center align-items-center mt-2 mb-1" v-if="npcTotalPages > 1">
              <button class="btn btn-sm btn-dark" :disabled="npcPage <= 1" @click="npcPage--">&laquo; Prev</button>
              <span class="mx-3 text-muted" style="font-size: 12px;">{{ npcPage }} / {{ npcTotalPages }}</span>
              <button class="btn btn-sm btn-dark" :disabled="npcPage >= npcTotalPages" @click="npcPage++">Next &raquo;</button>
            </div>
          </div>


        </eq-tab>
        <!-- Ground Spawns Tab -->
        <eq-tab :name="'Ground Spawns' + (groundSpawns.length > 0 ? ` (${groundSpawns.length})` : '')">
          <div v-if="loadingGroundSpawns" class="mt-3 text-center">
            Loading Ground Spawns...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else>
            <!-- Add Ground Spawn button -->
            <div class="mt-2 mb-2 d-flex justify-content-between align-items-center">
              <span class="text-muted" style="font-size: 12px;">
                {{ groundSpawns.length }} ground spawn(s) in zone
              </span>
              <button class="btn btn-sm btn-outline-success" @click="showAddGroundSpawn = true; $nextTick(() => { if ($refs.gsItemSearchInput) $refs.gsItemSearchInput.focus() })">
                <i class="fa fa-plus"></i> Add Ground Spawn
              </button>
            </div>

            <!-- Add Ground Spawn Form -->
            <div v-if="showAddGroundSpawn" class="card bg-dark border-secondary mb-3 p-3">
              <h6 class="text-warning mb-2">Add Ground Spawn</h6>

              <!-- Step 1: Item Search (when no item selected) -->
              <div v-if="!newGroundSpawn.item" class="form-group mb-2">
                <label class="small text-muted">Search Item</label>
                <div class="position-relative">
                  <input
                    type="text"
                    class="form-control form-control-sm bg-dark text-white border-secondary"
                    v-model="gsItemSearchQuery"
                    placeholder="Search items by name or ID..."
                    @input="searchGroundSpawnItems"
                    @keydown.down.prevent="gsHighlightIndex = Math.min(gsHighlightIndex + 1, (gsSearchResults.length || 1) - 1)"
                    @keydown.up.prevent="gsHighlightIndex = Math.max(gsHighlightIndex - 1, 0)"
                    @keydown.enter.prevent="selectGsItem(gsSearchResults[gsHighlightIndex])"
                    @keydown.escape="showAddGroundSpawn = false"
                    ref="gsItemSearchInput"
                    autocomplete="off"
                  >
                  <!-- Search Results Dropdown -->
                  <div v-if="gsSearchResults.length > 0" class="gs-item-search-dropdown">
                    <div
                      v-for="(item, ri) in gsSearchResults"
                      :key="'gs-sr-' + item.id"
                      class="gs-item-search-result"
                      :class="{ 'highlighted': gsHighlightIndex === ri }"
                      @click="selectGsItem(item)"
                      @mouseenter="gsHighlightIndex = ri"
                    >
                      <div class="d-flex align-items-center">
                        <item-popover :item="item" size="sm" class="d-inline-block mr-2" />
                        <small style="opacity:.4; margin-left: auto;">ID: {{ item.id }}</small>
                      </div>
                    </div>
                    <div v-if="gsSearchResults.length >= 20" class="text-center p-1" style="opacity:.3; font-size:.75em;">
                      Showing first 20 results — refine your search
                    </div>
                  </div>
                  <div v-if="gsItemSearchQuery && gsItemSearchQuery.length >= 2 && gsSearchResults.length === 0 && !gsSearching"
                       class="gs-item-search-dropdown">
                    <div class="text-center p-2" style="opacity:.4; font-size:.85em;">No items found</div>
                  </div>
                  <div v-if="gsSearching" class="gs-item-search-dropdown">
                    <div class="text-center p-2" style="opacity:.5;"><i class="fa fa-spinner fa-spin mr-1"></i> Searching...</div>
                  </div>
                </div>
              </div>

              <!-- Step 2: Item selected — show details + spawn settings -->
              <div v-if="newGroundSpawn.item">
                <div class="d-flex align-items-center mb-3 p-2" style="background: rgba(255,200,50,0.08); border-radius: 4px; border: 1px solid rgba(255,200,50,0.2);">
                  <item-popover :item="newGroundSpawn._selectedItem" size="sm" class="d-inline-block mr-2" v-if="newGroundSpawn._selectedItem" />
                  <span v-else class="text-white">Item #{{ newGroundSpawn.item }}</span>
                  <button class="btn btn-sm btn-outline-secondary ml-auto" @click="clearGsItem()" title="Change item">
                    <i class="fa fa-times"></i>
                  </button>
                </div>

                <!-- Placement mode toggle -->
                <div class="d-flex align-items-center mb-2">
                  <div class="btn-group btn-group-sm w-50 mr-2">
                    <button class="btn" :class="gsPlacementMode === 'point' ? 'btn-info' : 'btn-outline-secondary'" @click="gsPlacementMode = 'point'">
                      <i class="fa fa-map-pin"></i> Point
                    </button>
                    <button class="btn" :class="gsPlacementMode === 'area' ? 'btn-info' : 'btn-outline-secondary'" @click="gsPlacementMode = 'area'">
                      <i class="fa fa-vector-square"></i> Area
                    </button>
                  </div>
                  <button
                    class="btn btn-sm flex-grow-1"
                    :class="gsPickingLocation ? 'btn-warning' : 'btn-outline-info'"
                    @click="toggleLocationPicker"
                  >
                    <i :class="gsPickingLocation ? 'fa fa-crosshairs fa-spin' : 'fa fa-map-marker-alt'"></i>
                    {{ gsPickingLocation
                      ? (gsPlacementMode === 'area' ? 'Draw box on map...' : 'Click on map...')
                      : 'Pick from Map' }}
                  </button>
                </div>
                <!-- Min coordinates (area mode) -->
                <div class="row" v-if="gsPlacementMode === 'area'">
                  <div class="col-6 form-group mb-2">
                    <label class="small text-muted">Min X</label>
                    <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                           v-model.number="newGroundSpawn.min_x" placeholder="0" />
                  </div>
                  <div class="col-6 form-group mb-2">
                    <label class="small text-muted">Min Y</label>
                    <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                           v-model.number="newGroundSpawn.min_y" placeholder="0" />
                  </div>
                </div>
                <!-- Max coordinates -->
                <div class="row">
                  <div class="col-4 form-group mb-2">
                    <label class="small text-muted">Max X</label>
                    <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                           v-model.number="newGroundSpawn.max_x" placeholder="0" />
                  </div>
                  <div class="col-4 form-group mb-2">
                    <label class="small text-muted">Max Y</label>
                    <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                           v-model.number="newGroundSpawn.max_y" placeholder="0" />
                  </div>
                  <div class="col-4 form-group mb-2">
                    <label class="small text-muted">Z</label>
                    <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                           v-model.number="newGroundSpawn.max_z" placeholder="0" />
                  </div>
                </div>
                <div class="row">
                  <div class="col-6 form-group mb-2">
                    <label class="small text-muted">Heading</label>
                    <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                           v-model.number="newGroundSpawn.heading" placeholder="0" />
                  </div>
                  <div class="col-6 form-group mb-2">
                    <label class="small text-muted">Respawn Timer (sec)</label>
                    <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary"
                           v-model.number="newGroundSpawn.respawn_timer" placeholder="300" />
                  </div>
                </div>
                <div class="row">
                  <div class="col-6 form-group mb-2">
                    <label class="small text-muted">Min Expansion</label>
                    <input type="number" step="-1" class="form-control form-control-sm bg-dark text-white border-secondary"
                           v-model.number="newGroundSpawn.min_expansion" placeholder="-1" />
                  </div>
                  <div class="col-6 form-group mb-2">
                    <label class="small text-muted">Max Expansion</label>
                    <input type="number" step="-1" class="form-control form-control-sm bg-dark text-white border-secondary"
                           v-model.number="newGroundSpawn.max_expansion" placeholder="-1" />
                  </div>
                </div>
                <div class="d-flex justify-content-end mt-1">
                  <button class="btn btn-sm btn-secondary mr-2" @click="showAddGroundSpawn = false; clearGsItem()">Cancel</button>
                  <button class="btn btn-sm btn-success" @click="addGroundSpawn()">
                    <i class="fa fa-plus"></i> Add Ground Spawn
                  </button>
                </div>
              </div>

              <!-- Cancel when in search mode -->
              <div v-if="!newGroundSpawn.item" class="d-flex justify-content-end mt-1">
                <button class="btn btn-sm btn-secondary" @click="showAddGroundSpawn = false">Cancel</button>
              </div>
            </div>

            <div v-if="groundSpawns.length === 0 && !showAddGroundSpawn" class="mt-3 text-center" style="opacity: 0.5">
              <i class="fa fa-cube"></i> No ground spawns found in this zone
            </div>
            <div style="height: 75vh; overflow-y: scroll;" v-if="groundSpawns.length > 0">
              <table class="eq-table eq-highlight-rows" style="display: table; font-size: 13px;">
                <thead class="eq-table-floating-header">
                  <tr>
                    <th style="width: 40px">ID</th>
                    <th>Item</th>
                    <th class="text-center" style="width: 80px">Coords</th>
                    <th class="text-center" style="width: 70px">Respawn</th>
                    <th class="text-center" style="width: 50px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="gs in groundSpawns" :key="'gs-' + gs.id"
                      @mouseenter="emitSidebarArrowGs($event, gs)"
                      @mouseleave="clearSidebarArrow()"
                  >
                    <td class="text-muted">{{ gs.id }}</td>
                    <td>
                      <item-popover v-if="gs.itemDetail" :item="gs.itemDetail" />
                      <span v-else>Item #{{ gs.item }}</span>
                    </td>
                    <!-- Display mode -->
                    <template v-if="editingGsId !== gs.id">
                      <td class="text-center text-muted" style="font-size: 11px;">
                        <template v-if="gs.min_x !== gs.max_x || gs.min_y !== gs.max_y">
                          <div>{{ Number(gs.min_x).toFixed(0) }},{{ Number(gs.min_y).toFixed(0) }}</div>
                          <div>→ {{ Number(gs.max_x).toFixed(0) }},{{ Number(gs.max_y).toFixed(0) }}</div>
                        </template>
                        <template v-else>
                          {{ Number(gs.max_x).toFixed(0) }}, {{ Number(gs.max_y).toFixed(0) }}, {{ Number(gs.max_z).toFixed(0) }}
                        </template>
                      </td>
                      <td class="text-center text-muted" style="font-size: 11px;">{{ gs.respawn_timer }}s</td>
                    </template>
                    <!-- Edit mode -->
                    <template v-else>
                      <td style="font-size: 10px;">
                        <div class="d-flex align-items-center mb-1">
                          <span style="opacity:.5; width: 18px;">X:</span>
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                                 style="width: 70px; font-size: 10px; padding: 1px 4px; height: 22px;"
                                 v-model.number="gsEditData.max_x" />
                        </div>
                        <div class="d-flex align-items-center mb-1">
                          <span style="opacity:.5; width: 18px;">Y:</span>
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                                 style="width: 70px; font-size: 10px; padding: 1px 4px; height: 22px;"
                                 v-model.number="gsEditData.max_y" />
                        </div>
                        <div class="d-flex align-items-center">
                          <span style="opacity:.5; width: 18px;">Z:</span>
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                                 style="width: 70px; font-size: 10px; padding: 1px 4px; height: 22px;"
                                 v-model.number="gsEditData.max_z" />
                        </div>
                      </td>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 60px; display: inline-block; font-size: 11px;"
                               v-model.number="gsEditData.respawn_timer" />
                      </td>
                    </template>
                    <td class="text-center" style="white-space: nowrap;">
                      <template v-if="editingGsId !== gs.id">
                        <button class="btn btn-sm btn-dark py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="showGsOnMap(gs)" title="Show on Map">
                          <i class="fa fa-map-marker"></i>
                        </button>
                        <button class="btn btn-sm btn-dark py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="startEditGs(gs)" title="Edit">
                          <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-1" style="font-size: 11px;"
                                @click="removeGroundSpawn(gs)" title="Remove">
                          <i class="fa fa-trash"></i>
                        </button>
                      </template>
                      <template v-else>
                        <button class="btn btn-sm btn-success py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="saveEditGs(gs)" title="Save">
                          <i class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary py-0 px-1" style="font-size: 11px;"
                                @click="editingGsId = null" title="Cancel">
                          <i class="fa fa-times"></i>
                        </button>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </eq-tab>

        <!-- Tasks Tab -->
        <eq-tab :name="'Tasks' + (zoneTasks.length > 0 ? ` (${zoneTasks.length})` : '')">
          <div v-if="loadingTasks" class="mt-3 text-center">
            Loading Tasks...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else-if="zoneTasks.length === 0" class="mt-3 text-center" style="opacity: 0.5">
            <i class="fa fa-tasks"></i> No tasks found for this zone
          </div>
          <div style="height: 85vh; overflow-y: scroll;" v-else>
            <table class="eq-table eq-highlight-rows" style="display: table; font-size: 13px;">
              <thead class="eq-table-floating-header">
                <tr>
                  <th style="width: 50px">ID</th>
                  <th>Task</th>
                  <th class="text-center" style="width: 80px">Type</th>
                  <th class="text-center" style="width: 60px">Lvl</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="task in zoneTasks" :key="'task-' + task.id">
                  <td class="text-center" style="opacity: 0.5">{{ task.id }}</td>
                  <td>{{ task.title || task.name || 'Unnamed Task' }}</td>
                  <td class="text-center">
                    <span class="badge badge-secondary" style="font-size: 10px;">
                      {{ getTaskTypeName(task.type) }}
                    </span>
                  </td>
                  <td class="text-center">{{ task.minlevel || '—' }}</td>
                  <td class="text-center">
                    <a :href="'/tasks/' + task.id" target="_blank"
                       class="btn btn-sm btn-dark py-0 px-1" style="font-size: 11px;" title="Edit Task">
                      <i class="fa fa-edit"></i>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </eq-tab>

        <!-- Sold (Merchants) Tab -->
        <eq-tab :name="'Sold' + (zoneMerchants.length > 0 ? ` (${zoneMerchants.length})` : '')">
          <div v-if="loadingMerchants" class="mt-3 text-center">
            Loading Merchants...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else-if="zoneMerchants.length === 0" class="mt-3 text-center" style="opacity: 0.5">
            <i class="fa fa-shopping-cart"></i> No merchants found in this zone
          </div>
          <div style="height: 85vh; overflow-y: scroll;" v-else>
            <div class="d-flex align-items-center mb-2 px-1">
              <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                     v-model="soldSearchQuery" placeholder="Search merchants or items..." style="max-width: 250px;" />
              <span class="ml-auto text-muted" style="font-size: 11px;">
                {{ filteredMerchants.length }} merchants
              </span>
            </div>
            <div v-for="merchant in filteredMerchants" :key="'merchant-' + merchant.npcId" class="mb-3">
              <div class="p-2" style="background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
                <div class="d-flex align-items-center mb-1">
                  <span class="font-weight-bold" style="color: #f89620; font-size: 13px;">
                    <i class="fa fa-user mr-1"></i> {{ merchant.npcName }}
                    <span style="opacity: 0.5; font-size: 11px;"> ({{ merchant.items.length }} items)</span>
                  </span>
                  <a :href="'/merchant/' + merchant.merchantId" target="_blank"
                     class="btn btn-sm btn-dark ml-auto py-0 px-1" style="font-size: 11px;" title="Edit Merchant">
                    <i class="fa fa-edit"></i>
                  </a>
                </div>
                <table class="eq-table eq-highlight-rows" style="display: table; font-size: 12px; margin-bottom: 0;">
                  <tbody>
                    <tr v-for="mi in merchant.items.slice(0, merchant.expanded ? undefined : 5)" :key="'mi-' + mi.id">
                      <td>
                        <item-popover v-if="mi.id" :item="mi" />
                      </td>
                    </tr>
                    <tr v-if="merchant.items.length > 5 && !merchant.expanded">
                      <td class="text-center">
                        <a href="#" @click.prevent="$set(merchant, 'expanded', true)" style="font-size: 11px; color: #ffc832;">
                          Show {{ merchant.items.length - 5 }} more...
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </eq-tab>

        <!-- Spells Tab -->
        <eq-tab :name="'Spells' + (zoneSpells.length > 0 ? ` (${zoneSpells.length})` : '')">
          <div v-if="loadingSpells" class="mt-3 text-center">
            Loading Spells...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else-if="zoneSpells.length === 0" class="mt-3 text-center" style="opacity: 0.5">
            <i class="fa fa-magic"></i> No spells found in this zone
          </div>
          <div style="height: 85vh; overflow-y: scroll;" v-else>
            <div class="d-flex align-items-center mb-2 px-1">
              <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                     v-model="spellSearchQuery" placeholder="Search Spells..." style="max-width: 250px;"
                     @input="spellPage = 1" />
              <span class="ml-auto text-muted" style="font-size: 11px;">
                {{ filteredSpells.length }} results
                <template v-if="spellTotalPages > 1"> · Page {{ spellPage }}/{{ spellTotalPages }}</template>
              </span>
            </div>
            <table class="eq-table eq-highlight-rows" style="display: table; font-size: 13px;">
              <thead class="eq-table-floating-header">
                <tr>
                  <th style="width: 60px">ID</th>
                  <th>Spell</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="spell in paginatedSpells" :key="'spell-' + spell.id">
                  <td class="text-center" style="opacity: 0.5">{{ spell.id }}</td>
                  <td>
                    <spell-popover
                      :spell="spell"
                      :size="20"
                      :spell-name-length="30"
                      v-if="spell.new_icon !== undefined"
                    />
                    <span v-else>{{ spell.name || ('Spell #' + spell.id) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="d-flex justify-content-center align-items-center mt-2 mb-1" v-if="spellTotalPages > 1">
              <button class="btn btn-sm btn-dark" :disabled="spellPage <= 1" @click="spellPage--">&laquo; Prev</button>
              <span class="mx-3 text-muted" style="font-size: 12px;">{{ spellPage }} / {{ spellTotalPages }}</span>
              <button class="btn btn-sm btn-dark" :disabled="spellPage >= spellTotalPages" @click="spellPage++">Next &raquo;</button>
            </div>
          </div>
        </eq-tab>

        <!-- Forage Tab -->
        <eq-tab :name="'Forage' + (forageItems.length > 0 ? ` (${forageItems.length})` : '')">
          <div v-if="loadingForage" class="mt-3 text-center">
            Loading Forage Items...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else-if="forageItems.length === 0 && !showAddForage" class="mt-3 text-center" style="opacity: 0.5">
            <i class="fa fa-leaf"></i> No forage items found in this zone
          </div>
          <div style="height: 85vh; overflow-y: scroll;" v-else>
            <div class="d-flex align-items-center mb-2">
              <span style="opacity: 0.5; font-size: 13px;">{{ forageItems.length }} forage item(s) in zone</span>
              <button class="btn btn-sm btn-outline-success ml-auto" @click="showAddForage = !showAddForage">
                <i class="fa fa-plus mr-1"></i> Add Forage Item
              </button>
            </div>

            <!-- Add Forage Form -->
            <div v-if="showAddForage" class="p-2 mb-3" style="background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
              <div class="font-weight-bold mb-2" style="font-size: 13px; color: #ffc832;">
                <i class="fa fa-plus-circle mr-1"></i> Add Forage Item
              </div>
              <div class="mb-2">
                <label style="font-size: 11px; opacity: 0.6;">Item</label>
                <div class="position-relative">
                  <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                         v-model="forageItemSearchQuery" placeholder="Search items by name or ID..."
                         @input="searchForageItems" ref="forageItemSearchInput" autocomplete="off"
                         @keydown.down.prevent="forageHighlightIndex = Math.min(forageHighlightIndex + 1, (forageSearchResults.length || 1) - 1)"
                         @keydown.up.prevent="forageHighlightIndex = Math.max(forageHighlightIndex - 1, 0)"
                         @keydown.enter.prevent="selectForageItem(forageSearchResults[forageHighlightIndex])"
                         @keydown.escape="showAddForage = false" />
                  <div v-if="forageSearchResults.length > 0" class="gs-item-search-dropdown">
                    <div v-for="(item, ri) in forageSearchResults" :key="'fr-sr-' + item.id"
                         class="gs-item-search-result" :class="{ 'highlighted': forageHighlightIndex === ri }"
                         @click="selectForageItem(item)" @mouseenter="forageHighlightIndex = ri">
                      <div class="d-flex align-items-center">
                        <item-popover :item="item" size="sm" class="d-inline-block mr-2" />
                        <small style="opacity:.4; margin-left: auto;">ID: {{ item.id }}</small>
                      </div>
                    </div>
                  </div>
                  <div v-if="forageItemSearchQuery && forageItemSearchQuery.length >= 2 && forageSearchResults.length === 0 && !forageSearching"
                       class="gs-item-search-dropdown">
                    <div class="text-center p-2" style="opacity:.4; font-size:.85em;">No items found</div>
                  </div>
                </div>
              </div>
              <div v-if="newForage._selectedItem" class="mb-2 p-1" style="background: rgba(255,200,50,0.1); border-radius: 4px;">
                <item-popover :item="newForage._selectedItem" />
              </div>
              <div class="row mb-2">
                <div class="col-6">
                  <label style="font-size: 11px; opacity: 0.6;">Min Level</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary"
                         v-model.number="newForage.level" placeholder="0" />
                </div>
                <div class="col-6">
                  <label style="font-size: 11px; opacity: 0.6;">Chance (%)</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary"
                         v-model.number="newForage.chance" placeholder="100" />
                </div>
              </div>
              <div class="d-flex">
                <button class="btn btn-sm btn-success mr-2" @click="addForageItem()" :disabled="!newForage.itemid">
                  <i class="fa fa-plus mr-1"></i> Add
                </button>
                <button class="btn btn-sm btn-secondary" @click="showAddForage = false">Cancel</button>
              </div>
            </div>

            <!-- Forage Table -->
            <table class="eq-table eq-highlight-rows" style="display: table; font-size: 13px;">
              <thead class="eq-table-floating-header">
                <tr>
                  <th style="width: 50px">ID</th>
                  <th>Item</th>
                  <th class="text-center" style="width: 60px">Level</th>
                  <th class="text-center" style="width: 80px">Chance</th>
                  <th class="text-center" style="width: 60px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in forageItems" :key="'forage-' + f.id">
                  <td class="text-muted">{{ f.id }}</td>
                  <td>
                    <item-popover v-if="f.itemDetail" :item="f.itemDetail" />
                    <span v-else>Item #{{ f.itemid }}</span>
                  </td>
                  <template v-if="editingForageId !== f.id">
                    <td class="text-center text-muted">{{ f.level || '—' }}</td>
                    <td class="text-center text-muted">{{ f.chance }}%</td>
                    <td class="text-center" style="white-space: nowrap;">
                      <button class="btn btn-sm btn-dark py-0 px-1 mr-1" style="font-size: 11px;"
                              @click="startEditForage(f)" title="Edit">
                        <i class="fa fa-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger py-0 px-1" style="font-size: 11px;"
                              @click="removeForageItem(f)" title="Remove">
                        <i class="fa fa-trash"></i>
                      </button>
                    </td>
                  </template>
                  <template v-else>
                    <td class="text-center">
                      <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                             style="width: 50px; display: inline-block; font-size: 11px;"
                             v-model.number="forageEditData.level" />
                    </td>
                    <td class="text-center">
                      <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                             style="width: 60px; display: inline-block; font-size: 11px;"
                             v-model.number="forageEditData.chance" />
                    </td>
                    <td class="text-center" style="white-space: nowrap;">
                      <button class="btn btn-sm btn-success py-0 px-1 mr-1" style="font-size: 11px;"
                              @click="saveEditForage(f)" title="Save">
                        <i class="fa fa-check"></i>
                      </button>
                      <button class="btn btn-sm btn-secondary py-0 px-1" style="font-size: 11px;"
                              @click="editingForageId = null" title="Cancel">
                        <i class="fa fa-times"></i>
                      </button>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </eq-tab>

        <!-- Fishing Tab -->
        <eq-tab :name="'Fishing' + (fishingEntries.length > 0 ? ` (${fishingEntries.length})` : '')">
          <div v-if="loadingFishing" class="mt-3 text-center">
            Loading Fishing...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else>
            <div class="mt-2 mb-2 d-flex justify-content-between align-items-center">
              <span class="text-muted" style="font-size: 12px;">{{ fishingEntries.length }} fishing entry(s) in zone</span>
              <button class="btn btn-sm btn-outline-success" @click="showAddFishing = true">
                <i class="fa fa-plus"></i> Add Fishing Entry
              </button>
            </div>

            <!-- Add Fishing Form -->
            <div v-if="showAddFishing" class="p-2 mb-3" style="background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
              <div class="font-weight-bold mb-2" style="font-size: 13px; color: #ffc832;">
                <i class="fa fa-plus-circle mr-1"></i> Add Fishing Entry
              </div>
              <div class="mb-2">
                <label style="font-size: 11px; opacity: 0.6;">Item</label>
                <div class="position-relative">
                  <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                         v-model="fishingItemSearchQuery" placeholder="Search items by name or ID..."
                         @input="searchFishingItems" autocomplete="off"
                         @keydown.down.prevent="fishingHighlightIndex = Math.min(fishingHighlightIndex + 1, (fishingSearchResults.length || 1) - 1)"
                         @keydown.up.prevent="fishingHighlightIndex = Math.max(fishingHighlightIndex - 1, 0)"
                         @keydown.enter.prevent="selectFishingItem(fishingSearchResults[fishingHighlightIndex])"
                         @keydown.escape="showAddFishing = false" />
                  <div v-if="fishingSearchResults.length > 0" class="gs-item-search-dropdown">
                    <div v-for="(item, ri) in fishingSearchResults" :key="'fi-sr-' + item.id"
                         class="gs-item-search-result" :class="{ 'highlighted': fishingHighlightIndex === ri }"
                         @click="selectFishingItem(item)" @mouseenter="fishingHighlightIndex = ri">
                      <div class="d-flex align-items-center">
                        <item-popover :item="item" size="sm" class="d-inline-block mr-2" />
                        <small style="opacity:.4; margin-left: auto;">ID: {{ item.id }}</small>
                      </div>
                    </div>
                  </div>
                  <div v-if="fishingItemSearchQuery && fishingItemSearchQuery.length >= 2 && fishingSearchResults.length === 0 && !fishingSearching"
                       class="gs-item-search-dropdown">
                    <div class="text-center p-2" style="opacity:.4; font-size:.85em;">No items found</div>
                  </div>
                </div>
              </div>
              <div v-if="newFishing._selectedItem" class="mb-2 p-1" style="background: rgba(255,200,50,0.1); border-radius: 4px;">
                <item-popover :item="newFishing._selectedItem" />
                <button class="btn btn-sm btn-outline-secondary ml-2" @click="newFishing.itemid = null; newFishing._selectedItem = null; fishingItemSearchQuery = ''">
                  <i class="fa fa-times"></i>
                </button>
              </div>
              <div class="row mb-2">
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Skill Level</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary"
                         v-model.number="newFishing.skill_level" placeholder="0" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Chance</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary"
                         v-model.number="newFishing.chance" placeholder="0" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">NPC ID</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary"
                         v-model.number="newFishing.npc_id" placeholder="0" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">NPC Chance</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary"
                         v-model.number="newFishing.npc_chance" placeholder="0" />
                </div>
              </div>
              <div class="d-flex">
                <button class="btn btn-sm btn-success mr-2" @click="addFishing()" :disabled="!newFishing.itemid">
                  <i class="fa fa-plus mr-1"></i> Add
                </button>
                <button class="btn btn-sm btn-secondary" @click="showAddFishing = false">Cancel</button>
              </div>
            </div>

            <div v-if="fishingEntries.length === 0 && !showAddFishing" class="mt-3 text-center" style="opacity: 0.5">
              <i class="fa fa-tint"></i> No fishing entries found in this zone
            </div>
            <div style="height: 75vh; overflow-y: scroll;" v-if="fishingEntries.length > 0">
              <table class="eq-table eq-highlight-rows" style="display: table; font-size: 13px;">
                <thead class="eq-table-floating-header">
                  <tr>
                    <th style="width: 40px">ID</th>
                    <th>Item</th>
                    <th class="text-center" style="width: 80px">Skill Lvl</th>
                    <th class="text-center" style="width: 70px">Chance</th>
                    <th class="text-center" style="width: 70px">NPC ID</th>
                    <th class="text-center" style="width: 70px">NPC %</th>
                    <th class="text-center" style="width: 60px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="f in fishingEntries" :key="'fish-' + f.id">
                    <td class="text-muted">{{ f.id }}</td>
                    <td>
                      <item-popover v-if="f.itemDetail" :item="f.itemDetail" />
                      <span v-else>Item #{{ f.itemid }}</span>
                    </td>
                    <template v-if="editingFishingId !== f.id">
                      <td class="text-center text-muted">{{ f.skill_level || 0 }}</td>
                      <td class="text-center text-muted">{{ f.chance || 0 }}%</td>
                      <td class="text-center text-muted">{{ f.npc_id && f.npc_id > 0 ? f.npc_id : '—' }}</td>
                      <td class="text-center text-muted">{{ f.npc_id && f.npc_id > 0 ? (f.npc_chance || 0) + '%' : '—' }}</td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-dark py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="startEditFishing(f)" title="Edit">
                          <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-1" style="font-size: 11px;"
                                @click="removeFishing(f)" title="Remove">
                          <i class="fa fa-trash"></i>
                        </button>
                      </td>
                    </template>
                    <template v-else>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 55px; display: inline-block; font-size: 11px;"
                               v-model.number="fishingEditData.skill_level" />
                      </td>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 55px; display: inline-block; font-size: 11px;"
                               v-model.number="fishingEditData.chance" />
                      </td>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 55px; display: inline-block; font-size: 11px;"
                               v-model.number="fishingEditData.npc_id" />
                      </td>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 55px; display: inline-block; font-size: 11px;"
                               v-model.number="fishingEditData.npc_chance" />
                      </td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-success py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="saveEditFishing(f)" title="Save">
                          <i class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary py-0 px-1" style="font-size: 11px;"
                                @click="editingFishingId = null" title="Cancel">
                          <i class="fa fa-times"></i>
                        </button>
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </eq-tab>

        <!-- Traps Tab -->
        <eq-tab :name="'Traps' + (trapEntries.length > 0 ? ` (${trapEntries.length})` : '')">
          <div v-if="loadingTraps" class="mt-3 text-center">
            Loading Traps...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else>
            <div class="mt-2 mb-2 d-flex justify-content-between align-items-center">
              <span class="text-muted" style="font-size: 12px;">{{ trapEntries.length }} trap(s) in zone</span>
              <button class="btn btn-sm btn-outline-success" @click="showAddTrap = true">
                <i class="fa fa-plus"></i> Add Trap
              </button>
            </div>

            <!-- Add Trap Form -->
            <div v-if="showAddTrap" class="p-2 mb-3" style="background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
              <div class="font-weight-bold mb-2" style="font-size: 13px; color: #ffc832;">
                <i class="fa fa-plus-circle mr-1"></i> Add Trap
              </div>
              <div class="row mb-2">
                <div class="col-4">
                  <label style="font-size: 11px; opacity: 0.6;">X</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newTrap.x" />
                </div>
                <div class="col-4">
                  <label style="font-size: 11px; opacity: 0.6;">Y</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newTrap.y" />
                </div>
                <div class="col-4">
                  <label style="font-size: 11px; opacity: 0.6;">Z</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newTrap.z" />
                </div>
              </div>
              <div class="row mb-2">
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Level</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newTrap.level" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Skill</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newTrap.skill" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Chance</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newTrap.chance" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Respawn (s)</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newTrap.respawn_time" />
                </div>
              </div>
              <div class="row mb-2">
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Effect</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newTrap.effect" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Effect Value</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newTrap.effectvalue" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Radius</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newTrap.radius" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Max Z Diff</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newTrap.maxzdiff" />
                </div>
              </div>
              <div class="row mb-2">
                <div class="col-12">
                  <label style="font-size: 11px; opacity: 0.6;">Message</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary" v-model="newTrap.message" placeholder="Trap message..." />
                </div>
              </div>
              <div class="d-flex">
                <button class="btn btn-sm btn-success mr-2" @click="addTrap()">
                  <i class="fa fa-plus mr-1"></i> Add
                </button>
                <button class="btn btn-sm btn-secondary" @click="showAddTrap = false">Cancel</button>
              </div>
            </div>

            <div v-if="trapEntries.length === 0 && !showAddTrap" class="mt-3 text-center" style="opacity: 0.5">
              <i class="fa fa-exclamation-triangle"></i> No traps found in this zone
            </div>
            <div style="height: 75vh; overflow-y: scroll;" v-if="trapEntries.length > 0">
              <table class="eq-table eq-highlight-rows" style="display: table; font-size: 12px;">
                <thead class="eq-table-floating-header">
                  <tr>
                    <th style="width: 40px">ID</th>
                    <th class="text-center" style="width: 50px"></th>
                    <th class="text-center" style="width: 120px">Position</th>
                    <th class="text-center" style="width: 40px">Lvl</th>
                    <th class="text-center" style="width: 50px">Skill</th>
                    <th class="text-center" style="width: 55px">Chance</th>
                    <th class="text-center" style="width: 55px">Effect</th>
                    <th class="text-center" style="width: 65px">Respawn</th>
                    <th>Message</th>
                    <th class="text-center" style="width: 60px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="t in trapEntries" :key="'trap-' + t.id"
                      @mouseenter="emitSidebarArrowTrap($event, t)"
                      @mouseleave="clearSidebarArrow()"
                  >
                    <td class="text-muted">{{ t.id }}</td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-dark py-0 px-1" style="font-size: 11px;"
                              @click="showTrapOnMap(t)" title="Show on Map">
                        <i class="fa fa-map-marker"></i>
                      </button>
                    </td>
                    <template v-if="editingTrapId !== t.id">
                      <td class="text-center text-muted" style="font-size: 11px;">
                        {{ Number(t.x).toFixed(0) }}, {{ Number(t.y).toFixed(0) }}, {{ Number(t.z).toFixed(0) }}
                      </td>
                      <td class="text-center text-muted">{{ t.level || '—' }}</td>
                      <td class="text-center text-muted">{{ t.skill || '—' }}</td>
                      <td class="text-center text-muted">{{ t.chance || 0 }}%</td>
                      <td class="text-center text-muted">{{ t.effect || '—' }}</td>
                      <td class="text-center text-muted" style="font-size: 11px;">{{ t.respawn_time || 0 }}s</td>
                      <td class="text-muted" style="font-size: 11px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="t.message">
                        {{ t.message || '—' }}
                      </td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-dark py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="startEditTrap(t)" title="Edit">
                          <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-1" style="font-size: 11px;"
                                @click="removeTrap(t)" title="Remove">
                          <i class="fa fa-trash"></i>
                        </button>
                      </td>
                    </template>
                    <template v-else>
                      <td style="font-size: 10px;">
                        <div class="d-flex align-items-center mb-1">
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                                 style="width: 70px; font-size: 10px; padding: 1px 4px; height: 22px;"
                                 v-model.number="trapEditData.x" />
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary ml-1"
                                 style="width: 70px; font-size: 10px; padding: 1px 4px; height: 22px;"
                                 v-model.number="trapEditData.y" />
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary ml-1"
                                 style="width: 70px; font-size: 10px; padding: 1px 4px; height: 22px;"
                                 v-model.number="trapEditData.z" />
                        </div>
                      </td>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 40px; display: inline-block; font-size: 11px;" v-model.number="trapEditData.level" />
                      </td>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 45px; display: inline-block; font-size: 11px;" v-model.number="trapEditData.skill" />
                      </td>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 45px; display: inline-block; font-size: 11px;" v-model.number="trapEditData.chance" />
                      </td>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 45px; display: inline-block; font-size: 11px;" v-model.number="trapEditData.effect" />
                      </td>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 50px; display: inline-block; font-size: 11px;" v-model.number="trapEditData.respawn_time" />
                      </td>
                      <td>
                        <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                               style="font-size: 10px; height: 22px;" v-model="trapEditData.message" />
                      </td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-success py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="saveEditTrap(t)" title="Save">
                          <i class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary py-0 px-1" style="font-size: 11px;"
                                @click="editingTrapId = null" title="Cancel">
                          <i class="fa fa-times"></i>
                        </button>
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </eq-tab>

        <!-- Doors Tab -->
        <eq-tab :name="'Doors' + (doorEntries.length > 0 ? ` (${doorEntries.length})` : '')">
          <div v-if="loadingDoors" class="mt-3 text-center">
            Loading Doors...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else>
            <div class="mt-2 mb-2 d-flex justify-content-between align-items-center">
              <span class="text-muted" style="font-size: 12px;">{{ doorEntries.length }} door(s) in zone</span>
              <button class="btn btn-sm btn-outline-success" @click="showAddDoor = true">
                <i class="fa fa-plus"></i> Add Door
              </button>
            </div>

            <!-- Add Door Form -->
            <div v-if="showAddDoor" class="p-2 mb-3" style="background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
              <div class="font-weight-bold mb-2" style="font-size: 13px; color: #ffc832;">
                <i class="fa fa-plus-circle mr-1"></i> Add Door
              </div>
              <div class="row mb-2">
                <div class="col-4">
                  <label style="font-size: 11px; opacity: 0.6;">Door ID</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newDoor.doorid" />
                </div>
                <div class="col-4">
                  <label style="font-size: 11px; opacity: 0.6;">Name</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary" v-model="newDoor.name" placeholder="Door name" />
                </div>
                <div class="col-4">
                  <label style="font-size: 11px; opacity: 0.6;">Open Type</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newDoor.opentype" />
                </div>
              </div>
              <div class="row mb-2">
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Pos X</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newDoor.pos_x" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Pos Y</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newDoor.pos_y" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Pos Z</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newDoor.pos_z" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Heading</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newDoor.heading" />
                </div>
              </div>
              <div class="row mb-2">
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Dest Zone</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary" v-model="newDoor.dest_zone" placeholder="short_name" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Dest X</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newDoor.dest_x" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Dest Y</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newDoor.dest_y" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Dest Z</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newDoor.dest_z" />
                </div>
              </div>
              <div class="d-flex">
                <button class="btn btn-sm btn-success mr-2" @click="addDoor()">
                  <i class="fa fa-plus mr-1"></i> Add
                </button>
                <button class="btn btn-sm btn-secondary" @click="showAddDoor = false">Cancel</button>
              </div>
            </div>

            <div v-if="doorEntries.length === 0 && !showAddDoor" class="mt-3 text-center" style="opacity: 0.5">
              <i class="fa fa-columns"></i> No doors found in this zone
            </div>
            <div style="height: 75vh; overflow-y: scroll;" v-if="doorEntries.length > 0">
              <div class="d-flex align-items-center mb-2 px-1">
                <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                       v-model="doorSearchQuery" placeholder="Search doors..." style="max-width: 250px;"
                       @input="doorPage = 1" />
                <span class="ml-auto text-muted" style="font-size: 11px;">
                  {{ filteredDoors.length }} results
                  <template v-if="doorTotalPages > 1"> · Page {{ doorPage }}/{{ doorTotalPages }}</template>
                </span>
              </div>
              <table class="eq-table eq-highlight-rows" style="display: table; font-size: 12px;">
                <thead class="eq-table-floating-header">
                  <tr>
                    <th style="width: 45px">Door</th>
                    <th style="width: 40px"></th>
                    <th>Name</th>
                    <th class="text-center" style="width: 110px">Position</th>
                    <th class="text-center" style="width: 55px">Type</th>
                    <th class="text-center" style="width: 80px">Dest Zone</th>
                    <th class="text-center" style="width: 70px">Lock</th>
                    <th class="text-center" style="width: 60px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in paginatedDoors" :key="'door-' + d.id"
                      @mouseenter="emitSidebarArrowDoor($event, d)"
                      @mouseleave="clearSidebarArrow()"
                  >
                    <td class="text-muted">{{ d.doorid }}</td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-dark py-0 px-1" style="font-size: 11px;"
                              @click="showDoorOnMap(d)" title="Show on Map">
                        <i class="fa fa-map-marker"></i>
                      </button>
                    </td>
                    <template v-if="editingDoorId !== d.id">
                      <td style="font-size: 11px;">{{ d.name || '—' }}</td>
                      <td class="text-center text-muted" style="font-size: 11px;">
                        {{ Number(d.pos_x).toFixed(0) }}, {{ Number(d.pos_y).toFixed(0) }}, {{ Number(d.pos_z).toFixed(0) }}
                      </td>
                      <td class="text-center text-muted">{{ d.opentype }}</td>
                      <td class="text-center" style="font-size: 11px;">
                        <span v-if="d.dest_zone && d.dest_zone !== '' && d.dest_zone !== 'NONE'" style="color: #4fc3f7;">
                          {{ d.dest_zone }}
                        </span>
                        <span v-else class="text-muted">—</span>
                      </td>
                      <td class="text-center text-muted" style="font-size: 11px;">
                        <span v-if="d.lockpick > 0 || d.keyitem > 0">
                          <i class="fa fa-lock" style="color: #ffc832;" title="Locked"></i>
                          <span v-if="d.lockpick > 0" :title="'Lockpick: ' + d.lockpick"> LP:{{ d.lockpick }}</span>
                          <span v-if="d.keyitem > 0" :title="'Key Item: ' + d.keyitem"> K:{{ d.keyitem }}</span>
                        </span>
                        <span v-else>—</span>
                      </td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-dark py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="startEditDoor(d)" title="Edit">
                          <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-1" style="font-size: 11px;"
                                @click="removeDoor(d)" title="Remove">
                          <i class="fa fa-trash"></i>
                        </button>
                      </td>
                    </template>
                    <template v-else>
                      <td>
                        <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                               style="font-size: 10px; height: 22px;" v-model="doorEditData.name" />
                      </td>
                      <td style="font-size: 10px;">
                        <div class="d-flex">
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                                 style="width: 55px; font-size: 10px; padding: 1px 3px; height: 22px;" v-model.number="doorEditData.pos_x" />
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary ml-1"
                                 style="width: 55px; font-size: 10px; padding: 1px 3px; height: 22px;" v-model.number="doorEditData.pos_y" />
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary ml-1"
                                 style="width: 55px; font-size: 10px; padding: 1px 3px; height: 22px;" v-model.number="doorEditData.pos_z" />
                        </div>
                      </td>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 45px; display: inline-block; font-size: 11px;" v-model.number="doorEditData.opentype" />
                      </td>
                      <td class="text-center">
                        <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 65px; display: inline-block; font-size: 10px;" v-model="doorEditData.dest_zone" />
                      </td>
                      <td></td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-success py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="saveEditDoor(d)" title="Save">
                          <i class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary py-0 px-1" style="font-size: 11px;"
                                @click="editingDoorId = null" title="Cancel">
                          <i class="fa fa-times"></i>
                        </button>
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
              <div class="d-flex justify-content-center align-items-center mt-2 mb-1" v-if="doorTotalPages > 1">
                <button class="btn btn-sm btn-dark" :disabled="doorPage <= 1" @click="doorPage--">&laquo; Prev</button>
                <span class="mx-3 text-muted" style="font-size: 12px;">{{ doorPage }} / {{ doorTotalPages }}</span>
                <button class="btn btn-sm btn-dark" :disabled="doorPage >= doorTotalPages" @click="doorPage++">Next &raquo;</button>
              </div>
            </div>
          </div>
        </eq-tab>

        <!-- Objects Tab -->
        <eq-tab :name="'Objects' + (objectEntries.length > 0 ? ` (${objectEntries.length})` : '')">
          <div v-if="loadingObjects" class="mt-3 text-center">
            Loading Objects...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else>
            <div class="mt-2 mb-2 d-flex justify-content-between align-items-center">
              <span class="text-muted" style="font-size: 12px;">{{ objectEntries.length }} object(s) in zone</span>
              <button class="btn btn-sm btn-outline-success" @click="showAddObject = true">
                <i class="fa fa-plus"></i> Add Object
              </button>
            </div>

            <!-- Add Object Form -->
            <div v-if="showAddObject" class="p-2 mb-3" style="background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
              <div class="font-weight-bold mb-2" style="font-size: 13px; color: #ffc832;">
                <i class="fa fa-plus-circle mr-1"></i> Add Object
              </div>
              <div class="row mb-2">
                <div class="col-6">
                  <label style="font-size: 11px; opacity: 0.6;">Object Name</label>
                  <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary" v-model="newObject.objectname" placeholder="Object name" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Type</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newObject.type" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Size</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newObject.size" />
                </div>
              </div>
              <div class="row mb-2">
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">X</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newObject.xpos" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Y</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newObject.ypos" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Z</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newObject.zpos" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Heading</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newObject.heading" />
                </div>
              </div>
              <div class="mb-2">
                <label style="font-size: 11px; opacity: 0.6;">Item (optional)</label>
                <div class="position-relative">
                  <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                         v-model="objectItemSearchQuery" placeholder="Search items by name or ID..."
                         @input="searchObjectItems" autocomplete="off"
                         @keydown.down.prevent="objectHighlightIndex = Math.min(objectHighlightIndex + 1, (objectSearchResults.length || 1) - 1)"
                         @keydown.up.prevent="objectHighlightIndex = Math.max(objectHighlightIndex - 1, 0)"
                         @keydown.enter.prevent="selectObjectItem(objectSearchResults[objectHighlightIndex])" />
                  <div v-if="objectSearchResults.length > 0" class="gs-item-search-dropdown">
                    <div v-for="(item, ri) in objectSearchResults" :key="'oi-sr-' + item.id"
                         class="gs-item-search-result" :class="{ 'highlighted': objectHighlightIndex === ri }"
                         @click="selectObjectItem(item)" @mouseenter="objectHighlightIndex = ri">
                      <div class="d-flex align-items-center">
                        <item-popover :item="item" size="sm" class="d-inline-block mr-2" />
                        <small style="opacity:.4; margin-left: auto;">ID: {{ item.id }}</small>
                      </div>
                    </div>
                  </div>
                  <div v-if="objectItemSearchQuery && objectItemSearchQuery.length >= 2 && objectSearchResults.length === 0 && !objectSearching"
                       class="gs-item-search-dropdown">
                    <div class="text-center p-2" style="opacity:.4; font-size:.85em;">No items found</div>
                  </div>
                </div>
              </div>
              <div v-if="newObject._selectedItem" class="mb-2 p-1" style="background: rgba(255,200,50,0.1); border-radius: 4px;">
                <item-popover :item="newObject._selectedItem" />
                <button class="btn btn-sm btn-outline-secondary ml-2" @click="newObject.itemid = null; newObject._selectedItem = null; objectItemSearchQuery = ''">
                  <i class="fa fa-times"></i>
                </button>
              </div>
              <div class="d-flex">
                <button class="btn btn-sm btn-success mr-2" @click="addObject()">
                  <i class="fa fa-plus mr-1"></i> Add
                </button>
                <button class="btn btn-sm btn-secondary" @click="showAddObject = false">Cancel</button>
              </div>
            </div>

            <div v-if="objectEntries.length === 0 && !showAddObject" class="mt-3 text-center" style="opacity: 0.5">
              <i class="fa fa-cube"></i> No objects found in this zone
            </div>
            <div style="height: 75vh; overflow-y: scroll;" v-if="objectEntries.length > 0">
              <div class="d-flex align-items-center mb-2 px-1">
                <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                       v-model="objectSearchQuery" placeholder="Search objects..." style="max-width: 250px;"
                       @input="objectPage = 1" />
                <span class="ml-auto text-muted" style="font-size: 11px;">
                  {{ filteredObjects.length }} results
                  <template v-if="objectTotalPages > 1"> · Page {{ objectPage }}/{{ objectTotalPages }}</template>
                </span>
              </div>
              <table class="eq-table eq-highlight-rows" style="display: table; font-size: 12px;">
                <thead class="eq-table-floating-header">
                  <tr>
                    <th style="width: 40px">ID</th>
                    <th style="width: 40px"></th>
                    <th>Object Name</th>
                    <th class="text-center" style="width: 110px">Position</th>
                    <th class="text-center" style="width: 45px">Type</th>
                    <th>Item</th>
                    <th class="text-center" style="width: 60px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="o in paginatedObjects" :key="'obj-' + o.id"
                      @mouseenter="emitSidebarArrowObject($event, o)"
                      @mouseleave="clearSidebarArrow()"
                  >
                    <td class="text-muted">{{ o.id }}</td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-dark py-0 px-1" style="font-size: 11px;"
                              @click="showObjectOnMap(o)" title="Show on Map">
                        <i class="fa fa-map-marker"></i>
                      </button>
                    </td>
                    <template v-if="editingObjectId !== o.id">
                      <td style="font-size: 11px;">{{ o.objectname || '—' }}</td>
                      <td class="text-center text-muted" style="font-size: 11px;">
                        {{ Number(o.xpos).toFixed(0) }}, {{ Number(o.ypos).toFixed(0) }}, {{ Number(o.zpos).toFixed(0) }}
                      </td>
                      <td class="text-center text-muted">{{ o.type }}</td>
                      <td>
                        <item-popover v-if="o.itemDetail" :item="o.itemDetail" />
                        <span v-else-if="o.itemid && o.itemid > 0" class="text-muted" style="font-size: 11px;">Item #{{ o.itemid }}</span>
                        <span v-else class="text-muted">—</span>
                      </td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-dark py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="startEditObject(o)" title="Edit">
                          <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-1" style="font-size: 11px;"
                                @click="removeObject(o)" title="Remove">
                          <i class="fa fa-trash"></i>
                        </button>
                      </td>
                    </template>
                    <template v-else>
                      <td>
                        <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                               style="font-size: 10px; height: 22px;" v-model="objectEditData.objectname" />
                      </td>
                      <td style="font-size: 10px;">
                        <div class="d-flex">
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                                 style="width: 55px; font-size: 10px; padding: 1px 3px; height: 22px;" v-model.number="objectEditData.xpos" />
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary ml-1"
                                 style="width: 55px; font-size: 10px; padding: 1px 3px; height: 22px;" v-model.number="objectEditData.ypos" />
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary ml-1"
                                 style="width: 55px; font-size: 10px; padding: 1px 3px; height: 22px;" v-model.number="objectEditData.zpos" />
                        </div>
                      </td>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 40px; display: inline-block; font-size: 11px;" v-model.number="objectEditData.type" />
                      </td>
                      <td></td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-success py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="saveEditObject(o)" title="Save">
                          <i class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary py-0 px-1" style="font-size: 11px;"
                                @click="editingObjectId = null" title="Cancel">
                          <i class="fa fa-times"></i>
                        </button>
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
              <div class="d-flex justify-content-center align-items-center mt-2 mb-1" v-if="objectTotalPages > 1">
                <button class="btn btn-sm btn-dark" :disabled="objectPage <= 1" @click="objectPage--">&laquo; Prev</button>
                <span class="mx-3 text-muted" style="font-size: 12px;">{{ objectPage }} / {{ objectTotalPages }}</span>
                <button class="btn btn-sm btn-dark" :disabled="objectPage >= objectTotalPages" @click="objectPage++">Next &raquo;</button>
              </div>
            </div>
          </div>
        </eq-tab>

        <!-- LDoN Traps Tab -->
        <eq-tab :name="'LDoN Traps' + (ldonTrapEntries.length > 0 ? ` (${ldonTrapEntries.length})` : '')">
          <div v-if="loadingLdonTraps" class="mt-3 text-center">
            Loading LDoN Traps...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else>
            <div class="mt-2 mb-2 d-flex justify-content-between align-items-center">
              <span class="text-muted" style="font-size: 12px;">{{ ldonTrapEntries.length }} LDoN trap(s)</span>
              <button class="btn btn-sm btn-outline-success" @click="showAddLdonTrap = true">
                <i class="fa fa-plus"></i> Add LDoN Trap
              </button>
            </div>

            <!-- Add LDoN Trap Form -->
            <div v-if="showAddLdonTrap" class="p-2 mb-3" style="background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
              <div class="font-weight-bold mb-2" style="font-size: 13px; color: #ffc832;">
                <i class="fa fa-plus-circle mr-1"></i> Add LDoN Trap Entry
              </div>
              <div class="row mb-2">
                <div class="col-6">
                  <label style="font-size: 11px; opacity: 0.6;">Entry ID (Adventure Template)</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newLdonTrap.id" />
                </div>
                <div class="col-6">
                  <label style="font-size: 11px; opacity: 0.6;">Trap ID (Trap Template)</label>
                  <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newLdonTrap.trap_id" />
                </div>
              </div>
              <div class="d-flex">
                <button class="btn btn-sm btn-success mr-2" @click="addLdonTrap()">
                  <i class="fa fa-plus mr-1"></i> Add
                </button>
                <button class="btn btn-sm btn-secondary" @click="showAddLdonTrap = false">Cancel</button>
              </div>
            </div>

            <div v-if="ldonTrapEntries.length === 0 && !showAddLdonTrap" class="mt-3 text-center" style="opacity: 0.5">
              <i class="fa fa-exclamation-circle"></i> No LDoN trap entries found
            </div>
            <div style="height: 75vh; overflow-y: scroll;" v-if="ldonTrapEntries.length > 0">
              <table class="eq-table eq-highlight-rows" style="display: table; font-size: 13px;">
                <thead class="eq-table-floating-header">
                  <tr>
                    <th style="width: 50px">ID</th>
                    <th class="text-center" style="width: 80px">Trap ID</th>
                    <th>Type</th>
                    <th class="text-center" style="width: 80px">Spell ID</th>
                    <th class="text-center" style="width: 70px">Skill</th>
                    <th class="text-center" style="width: 70px">Locked</th>
                    <th class="text-center" style="width: 60px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="lt in ldonTrapEntries" :key="'ldon-' + lt.id">
                    <td class="text-muted">{{ lt.id }}</td>
                    <template v-if="editingLdonTrapId !== lt.id">
                      <td class="text-center text-muted">{{ lt.trap_id || '—' }}</td>
                      <td>{{ getLdonTemplateName(lt.trap_id) }}</td>
                      <td class="text-center text-muted">{{ lt.spell_id || '—' }}</td>
                      <td class="text-center text-muted">{{ lt.skill || '—' }}</td>
                      <td class="text-center">
                        <span v-if="lt.locked" style="color: #ffc832;">
                          <i class="fa fa-lock"></i> Yes
                        </span>
                        <span v-else class="text-muted">No</span>
                      </td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-dark py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="startEditLdonTrap(lt)" title="Edit">
                          <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-1" style="font-size: 11px;"
                                @click="removeLdonTrap(lt)" title="Remove">
                          <i class="fa fa-trash"></i>
                        </button>
                      </td>
                    </template>
                    <template v-else>
                      <td class="text-center">
                        <input type="number" class="form-control form-control-sm bg-dark text-white border-secondary text-center"
                               style="width: 60px; display: inline-block; font-size: 11px;" v-model.number="ldonTrapEditData.trap_id" />
                      </td>
                      <td>{{ getLdonTemplateName(ldonTrapEditData.trap_id) }}</td>
                      <td class="text-center text-muted">{{ lt.spell_id || '—' }}</td>
                      <td class="text-center text-muted">{{ lt.skill || '—' }}</td>
                      <td class="text-center text-muted">{{ lt.locked ? 'Yes' : 'No' }}</td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-success py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="saveEditLdonTrap(lt)" title="Save">
                          <i class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary py-0 px-1" style="font-size: 11px;"
                                @click="editingLdonTrapId = null" title="Cancel">
                          <i class="fa fa-times"></i>
                        </button>
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </eq-tab>

        <!-- Graveyards Tab -->
        <eq-tab :name="'Graveyards' + (graveyardEntries.length > 0 ? ` (${graveyardEntries.length})` : '')">
          <div v-if="loadingGraveyards" class="mt-3 text-center">
            Loading Graveyards...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else>
            <div class="mt-2 mb-2 d-flex justify-content-between align-items-center">
              <span class="text-muted" style="font-size: 12px;">{{ graveyardEntries.length }} graveyard(s) in zone</span>
              <button class="btn btn-sm btn-outline-success" @click="showAddGraveyard = true">
                <i class="fa fa-plus"></i> Add Graveyard
              </button>
            </div>

            <!-- Add Graveyard Form -->
            <div v-if="showAddGraveyard" class="p-2 mb-3" style="background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
              <div class="font-weight-bold mb-2" style="font-size: 13px; color: #ffc832;">
                <i class="fa fa-plus-circle mr-1"></i> Add Graveyard
              </div>
              <div class="row mb-2">
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">X</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newGraveyard.x" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Y</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newGraveyard.y" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Z</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newGraveyard.z" />
                </div>
                <div class="col-3">
                  <label style="font-size: 11px; opacity: 0.6;">Heading</label>
                  <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary" v-model.number="newGraveyard.heading" />
                </div>
              </div>
              <div class="d-flex">
                <button class="btn btn-sm btn-success mr-2" @click="addGraveyard()">
                  <i class="fa fa-plus mr-1"></i> Add
                </button>
                <button class="btn btn-sm btn-secondary" @click="showAddGraveyard = false">Cancel</button>
              </div>
            </div>

            <div v-if="graveyardEntries.length === 0 && !showAddGraveyard" class="mt-3 text-center" style="opacity: 0.5">
              <i class="fa fa-crosshairs"></i> No graveyards found in this zone
            </div>
            <div style="height: 75vh; overflow-y: scroll;" v-if="graveyardEntries.length > 0">
              <table class="eq-table eq-highlight-rows" style="display: table; font-size: 13px;">
                <thead class="eq-table-floating-header">
                  <tr>
                    <th style="width: 50px">ID</th>
                    <th style="width: 40px"></th>
                    <th class="text-center">Position (X / Y / Z)</th>
                    <th class="text-center" style="width: 60px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="gy in graveyardEntries" :key="'gy-' + gy.id"
                      @mouseenter="emitSidebarArrowGraveyard($event, gy)"
                      @mouseleave="clearSidebarArrow()"
                  >
                    <td class="text-muted">{{ gy.id }}</td>
                    <td class="text-center">
                      <button class="btn btn-sm btn-dark py-0 px-1" style="font-size: 11px;"
                              @click="showGraveyardOnMap(gy)" title="Show on Map">
                        <i class="fa fa-map-marker"></i>
                      </button>
                    </td>
                    <template v-if="editingGraveyardId !== gy.id">
                      <td class="text-center text-muted" style="font-size: 12px;">
                        {{ Number(gy.x).toFixed(1) }}, {{ Number(gy.y).toFixed(1) }}, {{ Number(gy.z).toFixed(1) }}
                      </td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-dark py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="startEditGraveyard(gy)" title="Edit">
                          <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-1" style="font-size: 11px;"
                                @click="removeGraveyard(gy)" title="Remove">
                          <i class="fa fa-trash"></i>
                        </button>
                      </td>
                    </template>
                    <template v-else>
                      <td style="font-size: 10px;">
                        <div class="d-flex justify-content-center">
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary"
                                 style="width: 70px; font-size: 10px; padding: 1px 4px; height: 22px;" v-model.number="graveyardEditData.x" />
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary ml-1"
                                 style="width: 70px; font-size: 10px; padding: 1px 4px; height: 22px;" v-model.number="graveyardEditData.y" />
                          <input type="number" step="0.01" class="form-control form-control-sm bg-dark text-white border-secondary ml-1"
                                 style="width: 70px; font-size: 10px; padding: 1px 4px; height: 22px;" v-model.number="graveyardEditData.z" />
                        </div>
                      </td>
                      <td class="text-center" style="white-space: nowrap;">
                        <button class="btn btn-sm btn-success py-0 px-1 mr-1" style="font-size: 11px;"
                                @click="saveEditGraveyard(gy)" title="Save">
                          <i class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary py-0 px-1" style="font-size: 11px;"
                                @click="editingGraveyardId = null" title="Cancel">
                          <i class="fa fa-times"></i>
                        </button>
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </eq-tab>

        <!-- Blocked Spells Tab -->
        <eq-tab :name="'Blocked Spells' + (blockedSpellEntries.length > 0 ? ` (${blockedSpellEntries.length})` : '')">
          <div v-if="loadingBlockedSpells" class="mt-3 text-center">
            Loading Blocked Spells...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else>
            <div class="mt-2 mb-2 d-flex justify-content-between align-items-center">
              <span class="text-muted" style="font-size: 12px;">{{ blockedSpellEntries.length }} blocked spell(s) in zone</span>
              <button class="btn btn-sm btn-outline-success" @click="showAddBlockedSpell = true">
                <i class="fa fa-plus"></i> Add Blocked Spell
              </button>
            </div>

            <!-- Add Blocked Spell Form -->
            <div v-if="showAddBlockedSpell" class="p-2 mb-3" style="background: rgba(255,255,255,0.05); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
              <div class="font-weight-bold mb-2" style="font-size: 13px; color: #ffc832;">
                <i class="fa fa-plus-circle mr-1"></i> Add Blocked Spell
              </div>
              <div class="mb-2">
                <label style="font-size: 11px; opacity: 0.6;">Spell</label>
                <div class="position-relative">
                  <input type="text" class="form-control form-control-sm bg-dark text-white border-secondary"
                         v-model="bsSpellSearchQuery" placeholder="Search spells by name or ID..."
                         @input="searchBlockedSpells" autocomplete="off"
                         @keydown.down.prevent="bsHighlightIndex = Math.min(bsHighlightIndex + 1, (bsSearchResults.length || 1) - 1)"
                         @keydown.up.prevent="bsHighlightIndex = Math.max(bsHighlightIndex - 1, 0)"
                         @keydown.enter.prevent="selectBlockedSpell(bsSearchResults[bsHighlightIndex])"
                         @keydown.escape="showAddBlockedSpell = false" />
                  <div v-if="bsSearchResults.length > 0" class="gs-item-search-dropdown">
                    <div v-for="(spell, ri) in bsSearchResults" :key="'bs-sr-' + spell.id"
                         class="gs-item-search-result" :class="{ 'highlighted': bsHighlightIndex === ri }"
                         @click="selectBlockedSpell(spell)" @mouseenter="bsHighlightIndex = ri">
                      <div class="d-flex align-items-center">
                        <spell-popover v-if="spell.new_icon !== undefined" :spell="spell" :size="18" :spell-name-length="30" class="d-inline-block mr-2" />
                        <span v-else>{{ spell.name }}</span>
                        <small style="opacity:.4; margin-left: auto;">ID: {{ spell.id }}</small>
                      </div>
                    </div>
                  </div>
                  <div v-if="bsSpellSearchQuery && bsSpellSearchQuery.length >= 2 && bsSearchResults.length === 0 && !bsSearching"
                       class="gs-item-search-dropdown">
                    <div class="text-center p-2" style="opacity:.4; font-size:.85em;">No spells found</div>
                  </div>
                </div>
              </div>
              <div v-if="newBlockedSpell._selectedSpell" class="mb-2 p-1" style="background: rgba(255,200,50,0.1); border-radius: 4px;">
                <spell-popover v-if="newBlockedSpell._selectedSpell.new_icon !== undefined" :spell="newBlockedSpell._selectedSpell" :size="20" :spell-name-length="30" />
                <span v-else>{{ newBlockedSpell._selectedSpell.name }} (ID: {{ newBlockedSpell._selectedSpell.id }})</span>
                <button class="btn btn-sm btn-outline-secondary ml-2" @click="newBlockedSpell.spellid = null; newBlockedSpell._selectedSpell = null; bsSpellSearchQuery = ''">
                  <i class="fa fa-times"></i>
                </button>
              </div>
              <!-- Type defaults to 1, description/message left empty -->
              <div class="d-flex">
                <button class="btn btn-sm btn-success mr-2" @click="addBlockedSpell()" :disabled="!newBlockedSpell.spellid">
                  <i class="fa fa-plus mr-1"></i> Add
                </button>
                <button class="btn btn-sm btn-secondary" @click="showAddBlockedSpell = false">Cancel</button>
              </div>
            </div>

            <div v-if="blockedSpellEntries.length === 0 && !showAddBlockedSpell" class="mt-3 text-center" style="opacity: 0.5">
              <i class="fa fa-ban"></i> No blocked spells found in this zone
            </div>
            <div style="height: 75vh; overflow-y: scroll;" v-if="blockedSpellEntries.length > 0">
              <table class="eq-table eq-highlight-rows" style="display: table; font-size: 12px;">
                <thead class="eq-table-floating-header">
                  <tr>
                    <th style="width: 40px">ID</th>
                    <th>Spell</th>
                    <th class="text-center" style="width: 50px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="bs in blockedSpellEntries" :key="'bs-' + bs.id">
                    <td class="text-muted">{{ bs.id }}</td>
                    <td>
                      <spell-popover
                        v-if="bs.spellDetail && bs.spellDetail.new_icon !== undefined"
                        :spell="bs.spellDetail"
                        :size="20"
                        :spell-name-length="40"
                      />
                      <span v-else class="text-muted">Spell #{{ bs.spellid }}</span>
                    </td>
                    <td class="text-center" style="white-space: nowrap;">
                      <button class="btn btn-sm btn-outline-danger py-0 px-1" style="font-size: 11px;"
                              @click="removeBlockedSpell(bs)" title="Remove">
                        <i class="fa fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </eq-tab>

        <!-- Zone Connections Tab -->
        <eq-tab :name="'Zone Connections' + (zoneConnections.length > 0 ? ` (${zoneConnections.length})` : '')">
          <div v-if="loadingConnections" class="mt-3 text-center">
            Loading Zone Connections...
            <loader-fake-progress class="mt-3"/>
          </div>
          <div v-else-if="zoneConnections.length === 0" class="mt-3 text-center" style="opacity: 0.5">
            <i class="fa fa-exchange"></i> No zone connections found
          </div>
          <div style="height: 85vh; overflow-y: scroll;" v-else>
            <table class="eq-table eq-highlight-rows" style="display: table; font-size: 13px;">
              <thead class="eq-table-floating-header">
                <tr>
                  <th style="width: 40px">#</th>
                  <th>Target Zone</th>
                  <th class="text-center" style="width: 90px">Coords</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="zp in zoneConnections"
                  :key="'zp-' + zp.id"
                  style="cursor: pointer"
                  @click="navigateToZone(zp)"
                  @mouseenter="emitSidebarArrowZp($event, zp)"
                  @mouseleave="clearSidebarArrow()"
                >
                  <td class="text-center" style="opacity: 0.5">{{ zp.number }}</td>
                  <td>
                    <i class="fa fa-arrow-right mr-1" style="opacity: 0.4; font-size: 10px;"></i>
                    <span style="color: #4fc3f7;">{{ zp.targetZoneName || ('Zone ' + zp.target_zone_id) }}</span>
                  </td>
                  <td class="text-center" style="font-size: 11px; opacity: 0.6;">
                    {{ Math.round(zp.x) }}, {{ Math.round(zp.y) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </eq-tab>
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
import {ItemApi}  from "../../app/api";
import {debounce} from "../../app/utility/debounce";
import EqTabs     from "../eq-ui/EQTabs";
import EqTab               from "../eq-ui/EQTab";
import EqCheckbox          from "../eq-ui/EQCheckbox";
import {Spawn2Api}         from "../../app/api";
import {SpireQueryBuilder} from "../../app/api/spire-query-builder";
import {Npcs}              from "../../app/npcs";
import NpcPopover          from "../NpcPopover";
import ItemPopover         from "../ItemPopover";
import SpellPopover        from "../SpellPopover";
import {EventBus}          from "../../app/event-bus/event-bus";
import LoaderFakeProgress  from "../LoaderFakeProgress";
import {Zones}             from "../../app/zones";
import util                from "util";
import {ROUTE}             from "../../routes";
import {Spawn}             from "../../app/spawn";

export default {
  name: "EqZoneCardPreview",
  components: { LoaderFakeProgress, NpcPopover, ItemPopover, SpellPopover, EqCheckbox, EqTab, EqTabs, EqWindow },
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
      groundSpawns: [],
      showAddGroundSpawn: false,
      gsPlacementMode: 'point', // 'point' or 'area'
      newGroundSpawn: {
        item: null, min_x: 0, min_y: 0, max_x: 0, max_y: 0, max_z: 0,
        heading: 0, respawn_timer: 300, min_expansion: -1, max_expansion: -1
      },
      loadingGroundSpawns: false,
      zoneTasks: [],
      loadingTasks: false,
      zoneMerchants: [],
      loadingMerchants: false,
      zoneSpells: [],
      loadingSpells: false,
      npcSearchQuery: '',
      npcPage: 1,
      spellSearchQuery: '',
      spellPage: 1,
      soldSearchQuery: '',
      forageItems: [],
      loadingForage: false,
      showAddForage: false,
      newForage: { itemid: null, _selectedItem: null, level: 0, chance: 100 },
      forageItemSearchQuery: '',
      forageSearchResults: [],
      forageHighlightIndex: 0,
      forageSearching: false,
      editingGsId: null,
      gsEditData: {},
      editingForageId: null,
      forageEditData: {},
      zoneConnections: [],
      loadingConnections: false,
      gsItemSearchQuery: '',
      gsSearchResults: [],
      gsSearching: false,
      gsHighlightIndex: -1,
      gsPickingLocation: false,

      // Fishing tab
      fishingEntries: [],
      loadingFishing: false,
      showAddFishing: false,
      newFishing: { itemid: null, _selectedItem: null, skill_level: 0, chance: 0, npc_id: 0, npc_chance: 0 },
      fishingItemSearchQuery: '',
      fishingSearchResults: [],
      fishingHighlightIndex: 0,
      fishingSearching: false,
      editingFishingId: null,
      fishingEditData: {},

      // Traps tab
      trapEntries: [],
      loadingTraps: false,
      showAddTrap: false,
      newTrap: { x: 0, y: 0, z: 0, chance: 0, maxzdiff: 0, radius: 0, effect: 0, effectvalue: 0, message: '', skill: 0, level: 0, respawn_time: 60 },
      editingTrapId: null,
      trapEditData: {},

      // Doors tab
      doorEntries: [],
      loadingDoors: false,
      doorSearchQuery: '',
      doorPage: 1,
      showAddDoor: false,
      newDoor: { doorid: 0, name: '', pos_x: 0, pos_y: 0, pos_z: 0, heading: 0, opentype: 0, dest_zone: '', dest_x: 0, dest_y: 0, dest_z: 0 },
      editingDoorId: null,
      doorEditData: {},

      // Objects tab
      objectEntries: [],
      loadingObjects: false,
      objectSearchQuery: '',
      objectPage: 1,
      showAddObject: false,
      newObject: { xpos: 0, ypos: 0, zpos: 0, heading: 0, objectname: '', type: 0, itemid: null, _selectedItem: null, icon: 0, size: 100 },
      objectItemSearchQuery: '',
      objectSearchResults: [],
      objectHighlightIndex: 0,
      objectSearching: false,
      editingObjectId: null,
      objectEditData: {},

      // LDoN Traps tab
      ldonTrapEntries: [],
      ldonTrapTemplates: [],
      loadingLdonTraps: false,
      showAddLdonTrap: false,
      newLdonTrap: { id: 0, trap_id: 0 },
      editingLdonTrapId: null,
      ldonTrapEditData: {},

      // Graveyards tab
      graveyardEntries: [],
      loadingGraveyards: false,
      showAddGraveyard: false,
      newGraveyard: { x: 0, y: 0, z: 0, heading: 0 },
      editingGraveyardId: null,
      graveyardEditData: {},

      // Blocked Spells tab
      blockedSpellEntries: [],
      loadingBlockedSpells: false,
      showAddBlockedSpell: false,
      newBlockedSpell: { spellid: null, _selectedSpell: null, type: 1, message: '', description: '' },
      bsSpellSearchQuery: '',
      bsSearchResults: [],
      bsHighlightIndex: 0,
      bsSearching: false,
      editingBlockedSpellId: null,
      blockedSpellEditData: {},
    }
  },
  created() {
    this.backgroundImages  = []
    this.currentImageIndex = 0

    // non-reactive data
    this.npcTypes = []

    // cycle background images
    this.interval = setInterval(this.setBackgroundImage, 3 * 1000)

    // Listen for map location picks
    EventBus.$on('GS_LOCATION_PICKED', this.handleLocationPicked)
    EventBus.$on('GS_DATA_CHANGED', this.loadGroundSpawns)
  },
  beforeDestroy() {
    if (this.interval) {
      clearInterval(this.interval)
    }
    EventBus.$off('GS_LOCATION_PICKED', this.handleLocationPicked)
    EventBus.$off('GS_DATA_CHANGED', this.loadGroundSpawns)
    EventBus.$emit('GS_PICK_LOCATION_CANCEL')
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
  computed: {
    filteredNpcs() {
      if (!this.npcSearchQuery) return this.npcTypes
      const q = this.npcSearchQuery.toLowerCase()
      return this.npcTypes.filter(n => {
        const name = (n.npc && (n.npc.name || n.npc.Name)) || n.short_name || ''
        const id = String(n.npc ? n.npc.id : '')
        return name.toLowerCase().includes(q) || id.includes(q)
      })
    },
    paginatedNpcs() {
      const start = (this.npcPage - 1) * 50
      return this.filteredNpcs.slice(start, start + 50)
    },
    npcTotalPages() {
      return Math.ceil(this.filteredNpcs.length / 50) || 1
    },
    filteredMerchants() {
      if (!this.soldSearchQuery) return this.zoneMerchants
      const q = this.soldSearchQuery.toLowerCase()
      return this.zoneMerchants.filter(m => {
        if (m.npcName && m.npcName.toLowerCase().includes(q)) return true
        return m.items && m.items.some(i => ((i.Name || i.name || '')).toLowerCase().includes(q))
      })
    },
    filteredSpells() {
      if (!this.spellSearchQuery) return this.zoneSpells
      const q = this.spellSearchQuery.toLowerCase()
      return this.zoneSpells.filter(s => {
        const name = (s.name || s.Name || '').toLowerCase()
        return name.includes(q) || String(s.id).includes(q)
      })
    },
    paginatedSpells() {
      const start = (this.spellPage - 1) * 50
      return this.filteredSpells.slice(start, start + 50)
    },
    spellTotalPages() {
      return Math.ceil(this.filteredSpells.length / 50) || 1
    },
    filteredDoors() {
      if (!this.doorSearchQuery) return this.doorEntries
      const q = this.doorSearchQuery.toLowerCase()
      return this.doorEntries.filter(d => {
        const name = (d.name || '').toLowerCase()
        const destZone = (d.dest_zone || '').toLowerCase()
        return name.includes(q) || destZone.includes(q) || String(d.doorid).includes(q) || String(d.id).includes(q)
      })
    },
    paginatedDoors() {
      const start = (this.doorPage - 1) * 50
      return this.filteredDoors.slice(start, start + 50)
    },
    doorTotalPages() {
      return Math.ceil(this.filteredDoors.length / 50) || 1
    },
    filteredObjects() {
      if (!this.objectSearchQuery) return this.objectEntries
      const q = this.objectSearchQuery.toLowerCase()
      return this.objectEntries.filter(o => {
        const name = (o.objectname || '').toLowerCase()
        return name.includes(q) || String(o.id).includes(q) || String(o.type).includes(q)
      })
    },
    paginatedObjects() {
      const start = (this.objectPage - 1) * 50
      return this.filteredObjects.slice(start, start + 50)
    },
    objectTotalPages() {
      return Math.ceil(this.filteredObjects.length / 50) || 1
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
      if (this.zone && this.zone.short_name) {
        this.loadZoneConnections()
        this.loadTraps()
        this.loadDoors()
      }
      if (this.zone && this.zone.zoneidnumber) {
        this.loadGroundSpawns()
        this.loadZoneTasks()
        this.loadForageItems()
        this.loadFishing()
        this.loadObjects()
        this.loadGraveyards()
        this.loadBlockedSpells()
      }
      this.loadZoneMerchants()
      this.loadZoneSpells()
      this.loadLdonTraps()
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

    },

    getTaskTypeName(type) {
      const types = { 0: 'Task', 1: 'Shared', 2: 'Quest', 3: 'Expedition' }
      return types[type] || 'Task'
    },

    navigateToZone(zp) {
      if (zp.targetZoneShortName) {
        this.$router.push({
          path: '/zone/' + zp.targetZoneShortName,
          query: { v: zp.version || 0 }
        }).catch(() => {})
      }
    },

    async loadZoneConnections() {
      this.loadingConnections = true
      this.zoneConnections = []
      try {
        const r = await SpireApi.v1().get(`/zone_points`, {
          params: {
            where: `zone__${this.zone.short_name}`,
            limit: 100
          }
        })
        if (r.status === 200 && r.data) {
          const points = Array.isArray(r.data) ? r.data : []
          // Resolve target zone names
          for (const zp of points) {
            if (zp.target_zone_id) {
              const targetZone = await Zones.getZoneById(zp.target_zone_id).catch(() => null)
              if (targetZone) {
                zp.targetZoneName = targetZone.long_name
                zp.targetZoneShortName = targetZone.short_name
              }
            }
          }
          this.zoneConnections = points
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load zone connections', e)
      }
      this.loadingConnections = false
      this.$forceUpdate()
    },

    async loadGroundSpawns() {
      this.loadingGroundSpawns = true
      this.groundSpawns = []
      try {
        const groundR = await SpireApi.v1().get(`/ground_spawns`, {
          params: {
            where: `zoneid__${this.zone.zoneidnumber}`,
            limit: 500
          }
        })

        if (groundR.status === 200 && Array.isArray(groundR.data)) {
          const spawns = groundR.data

          // Fetch item details for each ground spawn
          for (const gs of spawns) {
            if (gs.item) {
              try {
                const itemR = await SpireApi.v1().get(`/item/${gs.item}`)
                if (itemR.status === 200 && itemR.data) {
                  this.$set(gs, 'itemDetail', itemR.data)
                }
              } catch (e) {
                this.$set(gs, 'itemDetail', null)
              }
            }
          }

          this.groundSpawns = spawns.sort((a, b) => (a.id || 0) - (b.id || 0))
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load ground spawns', e)
      }
      this.loadingGroundSpawns = false
      this.$forceUpdate()
    },

    searchGroundSpawnItems: debounce(function() {
      const q = (this.gsItemSearchQuery || '').trim()
      if (q.length < 2) {
        this.gsSearchResults = []
        return
      }
      this.gsSearching = true
      this.gsHighlightIndex = -1

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
          this.gsSearchResults = r.data || []
        } else {
          this.gsSearchResults = []
        }
        this.gsSearching = false
      }).catch(() => {
        this.gsSearchResults = []
        this.gsSearching = false
      })
    }, 300),

    selectGsItem(item) {
      if (!item) return
      this.newGroundSpawn.item = item.id
      this.$set(this.newGroundSpawn, '_selectedItem', item)
      this.gsItemSearchQuery = ''
      this.gsSearchResults = []
      this.gsHighlightIndex = -1
    },

    toggleLocationPicker() {
      this.gsPickingLocation = !this.gsPickingLocation
      if (this.gsPickingLocation) {
        EventBus.$emit('GS_PICK_LOCATION_START', { type: this.gsPlacementMode })
      } else {
        EventBus.$emit('GS_PICK_LOCATION_CANCEL')
      }
    },

    handleLocationPicked(coords) {
      this.newGroundSpawn.min_x = Math.round(coords.min_x * 100) / 100
      this.newGroundSpawn.min_y = Math.round(coords.min_y * 100) / 100
      this.newGroundSpawn.max_x = Math.round(coords.max_x * 100) / 100
      this.newGroundSpawn.max_y = Math.round(coords.max_y * 100) / 100
      this.gsPickingLocation = false
    },

    clearGsItem() {
      this.newGroundSpawn.item = null
      this.$set(this.newGroundSpawn, '_selectedItem', null)
      this.gsItemSearchQuery = ''
      this.gsSearchResults = []
      this.$nextTick(() => {
        if (this.$refs.gsItemSearchInput) {
          this.$refs.gsItemSearchInput.focus()
        }
      })
    },

    async addGroundSpawn() {
      if (!this.newGroundSpawn.item) return
      try {
        const payload = {
          zoneid: this.zone.zoneidnumber,
          version: this.zone.version || 0,
          item: this.newGroundSpawn.item,
          min_x: this.newGroundSpawn.min_x || 0,
          min_y: this.newGroundSpawn.min_y || 0,
          max_x: this.newGroundSpawn.max_x || 0,
          max_y: this.newGroundSpawn.max_y || 0,
          max_z: this.newGroundSpawn.max_z || 0,
          heading: this.newGroundSpawn.heading || 0,
          respawn_timer: this.newGroundSpawn.respawn_timer || 300,
          min_expansion: this.newGroundSpawn.min_expansion != null ? this.newGroundSpawn.min_expansion : -1,
          max_expansion: this.newGroundSpawn.max_expansion != null ? this.newGroundSpawn.max_expansion : -1
        }
        const r = await SpireApi.v1().put(`/ground_spawn`, payload)
        if (r.status === 200 || r.status === 201) {
          this.showAddGroundSpawn = false
          this.newGroundSpawn = {
            item: null, _selectedItem: null, min_x: 0, min_y: 0, max_x: 0, max_y: 0, max_z: 0,
            heading: 0, respawn_timer: 300, min_expansion: -1, max_expansion: -1
          }
          await this.loadGroundSpawns()
          EventBus.$emit('GS_DATA_CHANGED')
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to add ground spawn', e)
        alert('Failed to add ground spawn: ' + (e.message || e))
      }
    },

    emitSidebarArrow(el, npc) {
      if (!npc || !npc.id) return
      const spawnEntry = this.npcTypes.find(n => n.npc && n.npc.id === npc.id)
      if (!spawnEntry || !spawnEntry.spawn) return
      const s = spawnEntry.spawn
      EventBus.$emit('SIDEBAR_HOVER_ARROW', {
        sourceEl: el.currentTarget,
        lat: s.y,
        lng: -s.x
      })
    },

    emitSidebarArrowGs(el, gs) {
      const hasArea = (gs.min_x !== gs.max_x || gs.min_y !== gs.max_y) && (gs.min_x !== 0 || gs.min_y !== 0)
      const cy = hasArea ? (gs.min_y + gs.max_y) / 2 : gs.max_y
      const cx = hasArea ? (gs.min_x + gs.max_x) / 2 : gs.max_x
      EventBus.$emit('SIDEBAR_HOVER_ARROW', {
        sourceEl: el.currentTarget,
        lat: cy,
        lng: -cx
      })
    },

    emitSidebarArrowZp(el, zp) {
      if (!zp.x && !zp.y) return
      EventBus.$emit('SIDEBAR_HOVER_ARROW', {
        sourceEl: el.currentTarget,
        lat: zp.y,
        lng: -zp.x
      })
    },

    clearSidebarArrow() {
      EventBus.$emit('SIDEBAR_HOVER_ARROW_CLEAR')
    },

    showGsOnMap(gs) {
      const hasArea = (gs.min_x !== gs.max_x || gs.min_y !== gs.max_y) && (gs.min_x !== 0 || gs.min_y !== 0)
      const centerY = hasArea ? (gs.min_y + gs.max_y) / 2 : gs.max_y
      const centerX = hasArea ? (gs.min_x + gs.max_x) / 2 : gs.max_x
      EventBus.$emit('GS_ZOOM', { lat: centerY, lng: -centerX, id: gs.id })
    },

    async removeGroundSpawn(gs) {
      if (!confirm(`Remove ground spawn #${gs.id} (Item: ${gs.itemDetail ? (gs.itemDetail.Name || gs.itemDetail.name) : gs.item})?`)) return
      try {
        const r = await SpireApi.v1().delete(`/ground_spawn/${gs.id}`)
        if (r.status === 200 || r.status === 204) {
          await this.loadGroundSpawns()
          EventBus.$emit('GS_DATA_CHANGED')
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to remove ground spawn', e)
        alert('Failed to remove ground spawn: ' + (e.message || e))
      }
    },

    async loadZoneTasks() {
      this.loadingTasks = true
      this.zoneTasks = []
      try {
        // Get tasks that have activities in this zone
        const r = await SpireApi.v1().get(`/task_activities`, {
          params: {
            where: `zones__${this.zone.zoneidnumber}`,
            groupBy: 'taskid',
            limit: 200
          }
        })
        if (r.status === 200 && Array.isArray(r.data)) {
          const tasks = []
          for (const ta of r.data) {
            if (ta.taskid) {
              try {
                const taskR = await SpireApi.v1().get(`/task/${ta.taskid}`)
                if (taskR.status === 200 && taskR.data) {
                  tasks.push(taskR.data)
                }
              } catch (e) {}
            }
          }
          this.zoneTasks = tasks.sort((a, b) => ((a.title || a.name || '').localeCompare(b.title || b.name || '')))
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load tasks', e)
      }
      this.loadingTasks = false
      this.$forceUpdate()
    },

    async loadZoneMerchants() {
      this.loadingMerchants = true
      this.zoneMerchants = []
      try {
        // Find merchant NPCs from the loaded npcTypes
        // Wait for NPCs to load first
        const waitForNpcs = () => new Promise((resolve) => {
          const check = () => {
            if (this.npcTypes && this.npcTypes.length > 0) resolve()
            else setTimeout(check, 500)
          }
          check()
          // Timeout after 15s
          setTimeout(resolve, 15000)
        })
        await waitForNpcs()

        const merchantNpcs = this.npcTypes
          .filter(n => n.npc && n.npc.merchant_id && n.npc.merchant_id > 0)
          .map(n => n.npc)

        const merchants = []
        for (const npc of merchantNpcs) {
          try {
            const r = await SpireApi.v1().get(`/merchantlists`, {
              params: {
                where: `merchantid__${npc.merchant_id}`,
                includes: 'Items',
                limit: 200
              }
            })
            if (r.status === 200 && Array.isArray(r.data)) {
              const items = r.data
                .filter(ml => ml.items && ml.items.length > 0)
                .map(ml => ml.items[0])
              if (items.length > 0) {
                merchants.push({
                  npcId: npc.id,
                  npcName: Npcs.getCleanName(npc.name),
                  merchantId: npc.merchant_id,
                  items: items,
                  expanded: false
                })
              }
            }
          } catch (e) {}
        }
        this.zoneMerchants = merchants.sort((a, b) => a.npcName.localeCompare(b.npcName))
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load merchants', e)
      }
      this.loadingMerchants = false
      this.$forceUpdate()
    },

    async loadForageItems() {
      this.loadingForage = true
      this.forageItems = []
      try {
        const r = await SpireApi.v1().get(`/forages`, {
          params: { where: `zoneid__${this.zone.zoneidnumber}`, limit: 500 }
        })
        if (r.status === 200 && Array.isArray(r.data)) {
          const items = r.data
          const itemIds = [...new Set(items.map(f => f.itemid).filter(Boolean))]
          let itemMap = {}
          for (const itemId of itemIds) {
            try {
              const ir = await SpireApi.v1().get(`/items`, { params: { where: `id__${itemId}`, limit: 1 } })
              if (ir.status === 200 && Array.isArray(ir.data) && ir.data.length > 0) {
                itemMap[itemId] = ir.data[0]
              }
            } catch (e) {}
          }
          this.forageItems = items.map(f => ({ ...f, itemDetail: itemMap[f.itemid] || null }))
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load forage items', e)
      }
      this.loadingForage = false
    },

    searchForageItems: (() => {
      let timeout = null
      return function () {
        this.forageHighlightIndex = 0
        clearTimeout(timeout)
        if (!this.forageItemSearchQuery || this.forageItemSearchQuery.length < 2) {
          this.forageSearchResults = []
          return
        }
        this.forageSearching = true
        timeout = setTimeout(async () => {
          try {
            const q = this.forageItemSearchQuery
            const isNum = /^\d+$/.test(q)
            const params = isNum
              ? { where: `id__${q}`, limit: 20 }
              : { where: `Name__${q}__and__id__gt__0`, limit: 20, whereOr: `name___like_${q}` }
            const r = await SpireApi.v1().get(`/items`, { params })
            this.forageSearchResults = (r.status === 200 && Array.isArray(r.data)) ? r.data : []
          } catch (e) {
            this.forageSearchResults = []
          }
          this.forageSearching = false
        }, 300)
      }
    })(),

    selectForageItem(item) {
      if (!item) return
      this.newForage.itemid = item.id
      this.newForage._selectedItem = item
      this.forageItemSearchQuery = ''
      this.forageSearchResults = []
    },

    async addForageItem() {
      if (!this.newForage.itemid) return
      try {
        const payload = {
          zoneid: this.zone.zoneidnumber,
          itemid: this.newForage.itemid,
          level: this.newForage.level || 0,
          chance: this.newForage.chance || 100,
          min_expansion: -1,
          max_expansion: -1
        }
        const r = await SpireApi.v1().put(`/forage`, payload)
        if (r.status === 200 || r.status === 201) {
          this.showAddForage = false
          this.newForage = { itemid: null, _selectedItem: null, level: 0, chance: 100 }
          await this.loadForageItems()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to add forage item', e)
        alert('Failed to add forage item: ' + (e.message || e))
      }
    },

    startEditGs(gs) {
      this.editingGsId = gs.id
      this.gsEditData = { max_x: gs.max_x, max_y: gs.max_y, max_z: gs.max_z, respawn_timer: gs.respawn_timer }
    },

    async saveEditGs(gs) {
      try {
        const payload = { ...this.gsEditData }
        if (gs.min_x === gs.max_x) payload.min_x = payload.max_x
        if (gs.min_y === gs.max_y) payload.min_y = payload.max_y
        await SpireApi.v1().patch(`/ground_spawn/${gs.id}`, payload)
        this.editingGsId = null
        await this.loadGroundSpawns()
        EventBus.$emit('GS_DATA_CHANGED')
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to save ground spawn', e)
      }
    },

    startEditForage(f) {
      this.editingForageId = f.id
      this.forageEditData = { level: f.level, chance: f.chance }
    },

    async saveEditForage(f) {
      try {
        await SpireApi.v1().patch(`/forage/${f.id}`, this.forageEditData)
        this.editingForageId = null
        await this.loadForageItems()
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to save forage', e)
      }
    },

    async updateForageField(f, field, value) {
      try {
        const payload = { [field]: Number(value) }
        await SpireApi.v1().patch(`/forage/${f.id}`, payload)
        await this.loadForageItems()
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to update forage', e)
      }
    },

    async updateGsField(gs, field, value) {
      try {
        const payload = { [field]: Number(value) }
        // For point spawns, keep min/max in sync for x/y
        if (field === 'max_x' && gs.min_x === gs.max_x) payload.min_x = Number(value)
        if (field === 'max_y' && gs.min_y === gs.max_y) payload.min_y = Number(value)
        await SpireApi.v1().patch(`/ground_spawn/${gs.id}`, payload)
        await this.loadGroundSpawns()
        EventBus.$emit('GS_DATA_CHANGED')
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to update ground spawn', e)
      }
    },

    async removeForageItem(f) {
      const name = f.itemDetail ? (f.itemDetail.Name || f.itemDetail.name) : `Item #${f.itemid}`
      if (!confirm(`Remove forage item: ${name}?`)) return
      try {
        const r = await SpireApi.v1().delete(`/forage/${f.id}`)
        if (r.status === 200 || r.status === 204) {
          await this.loadForageItems()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to remove forage item', e)
        alert('Failed to remove forage item: ' + (e.message || e))
      }
    },

    async loadFishing() {
      this.loadingFishing = true
      this.fishingEntries = []
      try {
        const r = await SpireApi.v1().get(`/fishings`, {
          params: { where: `zoneid__${this.zone.zoneidnumber}`, limit: 500 }
        })
        if (r.status === 200 && Array.isArray(r.data)) {
          const entries = r.data
          const itemIds = [...new Set(entries.map(f => f.itemid).filter(Boolean))]
          let itemMap = {}
          for (const itemId of itemIds) {
            try {
              const ir = await SpireApi.v1().get(`/items`, { params: { where: `id__${itemId}`, limit: 1 } })
              if (ir.status === 200 && Array.isArray(ir.data) && ir.data.length > 0) {
                itemMap[itemId] = ir.data[0]
              }
            } catch (e) {}
          }
          this.fishingEntries = entries.map(f => ({ ...f, itemDetail: itemMap[f.itemid] || null }))
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load fishing entries', e)
      }
      this.loadingFishing = false
      this.$forceUpdate()
    },

    async loadTraps() {
      this.loadingTraps = true
      this.trapEntries = []
      try {
        const r = await SpireApi.v1().get(`/traps`, {
          params: { where: `zone__${this.zone.short_name}`, limit: 500 }
        })
        if (r.status === 200 && Array.isArray(r.data)) {
          this.trapEntries = r.data.sort((a, b) => (a.id || 0) - (b.id || 0))
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load traps', e)
      }
      this.loadingTraps = false
      this.$forceUpdate()
    },

    async loadDoors() {
      this.loadingDoors = true
      this.doorEntries = []
      try {
        const r = await SpireApi.v1().get(`/doors`, {
          params: { where: `zone__${this.zone.short_name}`, limit: 1000 }
        })
        if (r.status === 200 && Array.isArray(r.data)) {
          this.doorEntries = r.data.sort((a, b) => (a.doorid || 0) - (b.doorid || 0))
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load doors', e)
      }
      this.loadingDoors = false
      this.$forceUpdate()
    },

    async loadObjects() {
      this.loadingObjects = true
      this.objectEntries = []
      try {
        const r = await SpireApi.v1().get(`/objects`, {
          params: { where: `zoneid__${this.zone.zoneidnumber}`, limit: 1000 }
        })
        if (r.status === 200 && Array.isArray(r.data)) {
          const entries = r.data
          const itemIds = [...new Set(entries.map(o => o.itemid).filter(id => id && id > 0))]
          let itemMap = {}
          for (const itemId of itemIds) {
            try {
              const ir = await SpireApi.v1().get(`/items`, { params: { where: `id__${itemId}`, limit: 1 } })
              if (ir.status === 200 && Array.isArray(ir.data) && ir.data.length > 0) {
                itemMap[itemId] = ir.data[0]
              }
            } catch (e) {}
          }
          this.objectEntries = entries.map(o => ({ ...o, itemDetail: itemMap[o.itemid] || null })).sort((a, b) => (a.id || 0) - (b.id || 0))
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load objects', e)
      }
      this.loadingObjects = false
      this.$forceUpdate()
    },

    async loadLdonTraps() {
      this.loadingLdonTraps = true
      this.ldonTrapEntries = []
      this.ldonTrapTemplates = []
      try {
        const [entriesR, templatesR] = await Promise.all([
          SpireApi.v1().get(`/ldon_trap_entries`, { params: { limit: 500 } }),
          SpireApi.v1().get(`/ldon_trap_templates`, { params: { limit: 500 } })
        ])
        if (entriesR.status === 200 && Array.isArray(entriesR.data)) {
          this.ldonTrapEntries = entriesR.data.sort((a, b) => (a.id || 0) - (b.id || 0))
        }
        if (templatesR.status === 200 && Array.isArray(templatesR.data)) {
          this.ldonTrapTemplates = templatesR.data
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load LDoN traps', e)
      }
      this.loadingLdonTraps = false
      this.$forceUpdate()
    },

    emitSidebarArrowTrap(el, trap) {
      if (!trap.x && !trap.y) return
      EventBus.$emit('SIDEBAR_HOVER_ARROW', {
        sourceEl: el.currentTarget,
        lat: trap.y,
        lng: -trap.x
      })
    },

    emitSidebarArrowDoor(el, door) {
      if (!door.pos_x && !door.pos_y) return
      EventBus.$emit('SIDEBAR_HOVER_ARROW', {
        sourceEl: el.currentTarget,
        lat: door.pos_y,
        lng: -door.pos_x
      })
    },

    emitSidebarArrowObject(el, obj) {
      if (!obj.xpos && !obj.ypos) return
      EventBus.$emit('SIDEBAR_HOVER_ARROW', {
        sourceEl: el.currentTarget,
        lat: obj.ypos,
        lng: -obj.xpos
      })
    },

    showTrapOnMap(trap) {
      EventBus.$emit('GS_ZOOM', { lat: trap.y, lng: -trap.x, id: 'trap-' + trap.id })
    },

    showDoorOnMap(door) {
      EventBus.$emit('GS_ZOOM', { lat: door.pos_y, lng: -door.pos_x, id: 'door-' + door.id })
    },

    showObjectOnMap(obj) {
      EventBus.$emit('GS_ZOOM', { lat: obj.ypos, lng: -obj.xpos, id: 'obj-' + obj.id })
    },

    getLdonTemplateName(trapTypeId) {
      const tmpl = this.ldonTrapTemplates.find(t => t.id === trapTypeId)
      return tmpl ? (tmpl.type || 'Type ' + trapTypeId) : ('Type ' + trapTypeId)
    },

    async loadGraveyards() {
      this.loadingGraveyards = true
      this.graveyardEntries = []
      try {
        const r = await SpireApi.v1().get(`/graveyards`, {
          params: { where: `zone_id__${this.zone.zoneidnumber}`, limit: 500 }
        })
        if (r.status === 200 && Array.isArray(r.data)) {
          this.graveyardEntries = r.data.sort((a, b) => (a.id || 0) - (b.id || 0))
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load graveyards', e)
      }
      this.loadingGraveyards = false
      this.$forceUpdate()
    },

    emitSidebarArrowGraveyard(el, gy) {
      if (!gy.x && !gy.y) return
      EventBus.$emit('SIDEBAR_HOVER_ARROW', {
        sourceEl: el.currentTarget,
        lat: gy.y,
        lng: -gy.x
      })
    },

    showGraveyardOnMap(gy) {
      EventBus.$emit('GS_ZOOM', { lat: gy.y, lng: -gy.x, id: 'gy-' + gy.id })
    },

    async loadBlockedSpells() {
      this.loadingBlockedSpells = true
      this.blockedSpellEntries = []
      try {
        const r = await SpireApi.v1().get(`/blocked_spells`, {
          params: { where: `zoneid__${this.zone.zoneidnumber}`, limit: 500 }
        })
        if (r.status === 200 && Array.isArray(r.data)) {
          const entries = r.data
          // Resolve spell details
          const spellIds = [...new Set(entries.map(e => e.spellid).filter(Boolean))]
          let spellMap = {}
          for (const spellId of spellIds) {
            try {
              const sr = await SpireApi.v1().get(`/spells_new/${spellId}`)
              if (sr.status === 200 && sr.data) {
                spellMap[spellId] = sr.data
              }
            } catch (e) {}
          }
          this.blockedSpellEntries = entries.map(e => ({ ...e, spellDetail: spellMap[e.spellid] || null })).sort((a, b) => (a.id || 0) - (b.id || 0))
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load blocked spells', e)
      }
      this.loadingBlockedSpells = false
      this.$forceUpdate()
    },

    // ===== FISHING CRUD =====
    searchFishingItems: (() => {
      let timeout = null
      return function () {
        this.fishingHighlightIndex = 0
        clearTimeout(timeout)
        if (!this.fishingItemSearchQuery || this.fishingItemSearchQuery.length < 2) {
          this.fishingSearchResults = []
          return
        }
        this.fishingSearching = true
        timeout = setTimeout(async () => {
          try {
            const q = this.fishingItemSearchQuery
            const isNum = /^\d+$/.test(q)
            const params = isNum
              ? { where: `id__${q}`, limit: 20 }
              : { where: `Name__${q}__and__id__gt__0`, limit: 20, whereOr: `name___like_${q}` }
            const r = await SpireApi.v1().get(`/items`, { params })
            this.fishingSearchResults = (r.status === 200 && Array.isArray(r.data)) ? r.data : []
          } catch (e) {
            this.fishingSearchResults = []
          }
          this.fishingSearching = false
        }, 300)
      }
    })(),

    selectFishingItem(item) {
      if (!item) return
      this.newFishing.itemid = item.id
      this.newFishing._selectedItem = item
      this.fishingItemSearchQuery = ''
      this.fishingSearchResults = []
    },

    async addFishing() {
      if (!this.newFishing.itemid) return
      try {
        const payload = {
          zoneid: this.zone.zoneidnumber,
          itemid: this.newFishing.itemid,
          skill_level: this.newFishing.skill_level || 0,
          chance: this.newFishing.chance || 0,
          npc_id: this.newFishing.npc_id || 0,
          npc_chance: this.newFishing.npc_chance || 0,
          min_expansion: -1,
          max_expansion: -1
        }
        const r = await SpireApi.v1().put(`/fishing`, payload)
        if (r.status === 200 || r.status === 201) {
          this.showAddFishing = false
          this.newFishing = { itemid: null, _selectedItem: null, skill_level: 0, chance: 0, npc_id: 0, npc_chance: 0 }
          await this.loadFishing()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to add fishing entry', e)
        alert('Failed to add fishing entry: ' + (e.message || e))
      }
    },

    startEditFishing(f) {
      this.editingFishingId = f.id
      this.fishingEditData = { skill_level: f.skill_level, chance: f.chance, npc_id: f.npc_id, npc_chance: f.npc_chance }
    },

    async saveEditFishing(f) {
      try {
        await SpireApi.v1().patch(`/fishing/${f.id}`, this.fishingEditData)
        this.editingFishingId = null
        await this.loadFishing()
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to save fishing entry', e)
      }
    },

    async removeFishing(f) {
      const name = f.itemDetail ? (f.itemDetail.Name || f.itemDetail.name) : `Item #${f.itemid}`
      if (!confirm(`Remove fishing entry: ${name}?`)) return
      try {
        const r = await SpireApi.v1().delete(`/fishing/${f.id}`)
        if (r.status === 200 || r.status === 204) {
          await this.loadFishing()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to remove fishing entry', e)
        alert('Failed to remove fishing entry: ' + (e.message || e))
      }
    },

    // ===== TRAPS CRUD =====
    async addTrap() {
      try {
        const payload = {
          zone: this.zone.short_name,
          version: this.zone.version || 0,
          x: this.newTrap.x || 0,
          y: this.newTrap.y || 0,
          z: this.newTrap.z || 0,
          chance: this.newTrap.chance || 0,
          maxzdiff: this.newTrap.maxzdiff || 0,
          radius: this.newTrap.radius || 0,
          effect: this.newTrap.effect || 0,
          effectvalue: this.newTrap.effectvalue || 0,
          message: this.newTrap.message || '',
          skill: this.newTrap.skill || 0,
          level: this.newTrap.level || 0,
          respawn_time: this.newTrap.respawn_time || 60
        }
        const r = await SpireApi.v1().put(`/trap`, payload)
        if (r.status === 200 || r.status === 201) {
          this.showAddTrap = false
          this.newTrap = { x: 0, y: 0, z: 0, chance: 0, maxzdiff: 0, radius: 0, effect: 0, effectvalue: 0, message: '', skill: 0, level: 0, respawn_time: 60 }
          await this.loadTraps()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to add trap', e)
        alert('Failed to add trap: ' + (e.message || e))
      }
    },

    startEditTrap(t) {
      this.editingTrapId = t.id
      this.trapEditData = { x: t.x, y: t.y, z: t.z, level: t.level, skill: t.skill, chance: t.chance, effect: t.effect, respawn_time: t.respawn_time, message: t.message }
    },

    async saveEditTrap(t) {
      try {
        await SpireApi.v1().patch(`/trap/${t.id}`, this.trapEditData)
        this.editingTrapId = null
        await this.loadTraps()
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to save trap', e)
      }
    },

    async removeTrap(t) {
      if (!confirm(`Remove trap #${t.id}?`)) return
      try {
        const r = await SpireApi.v1().delete(`/trap/${t.id}`)
        if (r.status === 200 || r.status === 204) {
          await this.loadTraps()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to remove trap', e)
        alert('Failed to remove trap: ' + (e.message || e))
      }
    },

    // ===== DOORS CRUD =====
    async addDoor() {
      try {
        const payload = {
          zone: this.zone.short_name,
          version: this.zone.version || 0,
          doorid: this.newDoor.doorid || 0,
          name: this.newDoor.name || '',
          pos_x: this.newDoor.pos_x || 0,
          pos_y: this.newDoor.pos_y || 0,
          pos_z: this.newDoor.pos_z || 0,
          heading: this.newDoor.heading || 0,
          opentype: this.newDoor.opentype || 0,
          dest_zone: this.newDoor.dest_zone || '',
          dest_x: this.newDoor.dest_x || 0,
          dest_y: this.newDoor.dest_y || 0,
          dest_z: this.newDoor.dest_z || 0
        }
        const r = await SpireApi.v1().put(`/door`, payload)
        if (r.status === 200 || r.status === 201) {
          this.showAddDoor = false
          this.newDoor = { doorid: 0, name: '', pos_x: 0, pos_y: 0, pos_z: 0, heading: 0, opentype: 0, dest_zone: '', dest_x: 0, dest_y: 0, dest_z: 0 }
          await this.loadDoors()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to add door', e)
        alert('Failed to add door: ' + (e.message || e))
      }
    },

    startEditDoor(d) {
      this.editingDoorId = d.id
      this.doorEditData = { name: d.name, pos_x: d.pos_x, pos_y: d.pos_y, pos_z: d.pos_z, opentype: d.opentype, dest_zone: d.dest_zone || '' }
    },

    async saveEditDoor(d) {
      try {
        await SpireApi.v1().patch(`/door/${d.id}`, this.doorEditData)
        this.editingDoorId = null
        await this.loadDoors()
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to save door', e)
      }
    },

    async removeDoor(d) {
      if (!confirm(`Remove door #${d.doorid} (${d.name || 'unnamed'})?`)) return
      try {
        const r = await SpireApi.v1().delete(`/door/${d.id}`)
        if (r.status === 200 || r.status === 204) {
          await this.loadDoors()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to remove door', e)
        alert('Failed to remove door: ' + (e.message || e))
      }
    },

    // ===== OBJECTS CRUD =====
    searchObjectItems: (() => {
      let timeout = null
      return function () {
        this.objectHighlightIndex = 0
        clearTimeout(timeout)
        if (!this.objectItemSearchQuery || this.objectItemSearchQuery.length < 2) {
          this.objectSearchResults = []
          return
        }
        this.objectSearching = true
        timeout = setTimeout(async () => {
          try {
            const q = this.objectItemSearchQuery
            const isNum = /^\d+$/.test(q)
            const params = isNum
              ? { where: `id__${q}`, limit: 20 }
              : { where: `Name__${q}__and__id__gt__0`, limit: 20, whereOr: `name___like_${q}` }
            const r = await SpireApi.v1().get(`/items`, { params })
            this.objectSearchResults = (r.status === 200 && Array.isArray(r.data)) ? r.data : []
          } catch (e) {
            this.objectSearchResults = []
          }
          this.objectSearching = false
        }, 300)
      }
    })(),

    selectObjectItem(item) {
      if (!item) return
      this.newObject.itemid = item.id
      this.newObject._selectedItem = item
      this.objectItemSearchQuery = ''
      this.objectSearchResults = []
    },

    async addObject() {
      try {
        const payload = {
          zoneid: this.zone.zoneidnumber,
          version: this.zone.version || 0,
          xpos: this.newObject.xpos || 0,
          ypos: this.newObject.ypos || 0,
          zpos: this.newObject.zpos || 0,
          heading: this.newObject.heading || 0,
          objectname: this.newObject.objectname || '',
          type: this.newObject.type || 0,
          itemid: this.newObject.itemid || 0,
          icon: this.newObject.icon || 0,
          size: this.newObject.size || 100
        }
        const r = await SpireApi.v1().put(`/object`, payload)
        if (r.status === 200 || r.status === 201) {
          this.showAddObject = false
          this.newObject = { xpos: 0, ypos: 0, zpos: 0, heading: 0, objectname: '', type: 0, itemid: null, _selectedItem: null, icon: 0, size: 100 }
          this.objectItemSearchQuery = ''
          this.objectSearchResults = []
          await this.loadObjects()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to add object', e)
        alert('Failed to add object: ' + (e.message || e))
      }
    },

    startEditObject(o) {
      this.editingObjectId = o.id
      this.objectEditData = { objectname: o.objectname, xpos: o.xpos, ypos: o.ypos, zpos: o.zpos, type: o.type }
    },

    async saveEditObject(o) {
      try {
        await SpireApi.v1().patch(`/object/${o.id}`, this.objectEditData)
        this.editingObjectId = null
        await this.loadObjects()
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to save object', e)
      }
    },

    async removeObject(o) {
      if (!confirm(`Remove object #${o.id} (${o.objectname || 'unnamed'})?`)) return
      try {
        const r = await SpireApi.v1().delete(`/object/${o.id}`)
        if (r.status === 200 || r.status === 204) {
          await this.loadObjects()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to remove object', e)
        alert('Failed to remove object: ' + (e.message || e))
      }
    },

    // ===== LDON TRAPS CRUD =====
    async addLdonTrap() {
      try {
        const payload = {
          id: this.newLdonTrap.id || 0,
          trap_id: this.newLdonTrap.trap_id || 0
        }
        const r = await SpireApi.v1().put(`/ldon_trap_entry`, payload)
        if (r.status === 200 || r.status === 201) {
          this.showAddLdonTrap = false
          this.newLdonTrap = { id: 0, trap_id: 0 }
          await this.loadLdonTraps()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to add LDoN trap', e)
        alert('Failed to add LDoN trap: ' + (e.message || e))
      }
    },

    startEditLdonTrap(lt) {
      this.editingLdonTrapId = lt.id
      this.ldonTrapEditData = { trap_id: lt.trap_id }
    },

    async saveEditLdonTrap(lt) {
      try {
        await SpireApi.v1().patch(`/ldon_trap_entry/${lt.id}`, this.ldonTrapEditData)
        this.editingLdonTrapId = null
        await this.loadLdonTraps()
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to save LDoN trap', e)
      }
    },

    async removeLdonTrap(lt) {
      if (!confirm(`Remove LDoN trap entry #${lt.id}?`)) return
      try {
        const r = await SpireApi.v1().delete(`/ldon_trap_entry/${lt.id}`)
        if (r.status === 200 || r.status === 204) {
          await this.loadLdonTraps()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to remove LDoN trap', e)
        alert('Failed to remove LDoN trap: ' + (e.message || e))
      }
    },

    // ===== GRAVEYARDS CRUD =====
    async addGraveyard() {
      try {
        const payload = {
          zone_id: this.zone.zoneidnumber,
          x: this.newGraveyard.x || 0,
          y: this.newGraveyard.y || 0,
          z: this.newGraveyard.z || 0,
          heading: this.newGraveyard.heading || 0
        }
        const r = await SpireApi.v1().put(`/graveyard`, payload)
        if (r.status === 200 || r.status === 201) {
          this.showAddGraveyard = false
          this.newGraveyard = { x: 0, y: 0, z: 0, heading: 0 }
          await this.loadGraveyards()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to add graveyard', e)
        alert('Failed to add graveyard: ' + (e.message || e))
      }
    },

    startEditGraveyard(gy) {
      this.editingGraveyardId = gy.id
      this.graveyardEditData = { x: gy.x, y: gy.y, z: gy.z, heading: gy.heading }
    },

    async saveEditGraveyard(gy) {
      try {
        await SpireApi.v1().patch(`/graveyard/${gy.id}`, this.graveyardEditData)
        this.editingGraveyardId = null
        await this.loadGraveyards()
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to save graveyard', e)
      }
    },

    async removeGraveyard(gy) {
      if (!confirm(`Remove graveyard #${gy.id}?`)) return
      try {
        const r = await SpireApi.v1().delete(`/graveyard/${gy.id}`)
        if (r.status === 200 || r.status === 204) {
          await this.loadGraveyards()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to remove graveyard', e)
        alert('Failed to remove graveyard: ' + (e.message || e))
      }
    },

    // ===== BLOCKED SPELLS CRUD =====
    searchBlockedSpells: (() => {
      let timeout = null
      return function () {
        this.bsHighlightIndex = 0
        clearTimeout(timeout)
        if (!this.bsSpellSearchQuery || this.bsSpellSearchQuery.length < 2) {
          this.bsSearchResults = []
          return
        }
        this.bsSearching = true
        timeout = setTimeout(async () => {
          try {
            const q = this.bsSpellSearchQuery
            const isNum = /^\d+$/.test(q)
            const params = isNum
              ? { where: `id__${q}`, limit: 20 }
              : { where: `name__like__${q}`, limit: 20 }
            const r = await SpireApi.v1().get(`/spells_news`, { params })
            this.bsSearchResults = (r.status === 200 && Array.isArray(r.data)) ? r.data : []
          } catch (e) {
            this.bsSearchResults = []
          }
          this.bsSearching = false
        }, 300)
      }
    })(),

    selectBlockedSpell(spell) {
      if (!spell) return
      this.newBlockedSpell.spellid = spell.id
      this.newBlockedSpell._selectedSpell = spell
      this.bsSpellSearchQuery = ''
      this.bsSearchResults = []
    },

    async addBlockedSpell() {
      if (!this.newBlockedSpell.spellid) return
      try {
        const payload = {
          zoneid: this.zone.zoneidnumber,
          spellid: this.newBlockedSpell.spellid,
          type: this.newBlockedSpell.type || 1,
          x: 0,
          y: 0,
          z: 0,
          message: this.newBlockedSpell.message || '',
          description: this.newBlockedSpell.description || ''
        }
        const r = await SpireApi.v1().put(`/blocked_spell`, payload)
        if (r.status === 200 || r.status === 201) {
          this.showAddBlockedSpell = false
          this.newBlockedSpell = { spellid: null, _selectedSpell: null, type: 1, message: '', description: '' }
          await this.loadBlockedSpells()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to add blocked spell', e)
        alert('Failed to add blocked spell: ' + (e.message || e))
      }
    },

    startEditBlockedSpell(bs) {
      this.editingBlockedSpellId = bs.id
      this.blockedSpellEditData = { type: bs.type, description: bs.description || '', message: bs.message || '' }
    },

    async saveEditBlockedSpell(bs) {
      try {
        await SpireApi.v1().patch(`/blocked_spell/${bs.id}`, this.blockedSpellEditData)
        this.editingBlockedSpellId = null
        await this.loadBlockedSpells()
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to save blocked spell', e)
      }
    },

    async removeBlockedSpell(bs) {
      const name = bs.spellDetail ? (bs.spellDetail.name || `Spell #${bs.spellid}`) : `Spell #${bs.spellid}`
      if (!confirm(`Remove blocked spell: ${name}?`)) return
      try {
        const r = await SpireApi.v1().delete(`/blocked_spell/${bs.id}`)
        if (r.status === 200 || r.status === 204) {
          await this.loadBlockedSpells()
        }
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to remove blocked spell', e)
        alert('Failed to remove blocked spell: ' + (e.message || e))
      }
    },

    async loadZoneSpells() {
      this.loadingSpells = true
      this.zoneSpells = []
      try {
        // Get unique spell list IDs from NPCs in this zone
        const waitForNpcs = () => new Promise((resolve) => {
          const check = () => {
            if (this.npcTypes && this.npcTypes.length > 0) resolve()
            else setTimeout(check, 500)
          }
          check()
          setTimeout(resolve, 15000)
        })
        await waitForNpcs()

        const spellListIds = [...new Set(
          this.npcTypes
            .filter(n => n.npc && n.npc.npc_spells_id && n.npc.npc_spells_id > 0)
            .map(n => n.npc.npc_spells_id)
        )]

        const allSpells = new Map()
        for (const listId of spellListIds) {
          try {
            const r = await SpireApi.v1().get(`/npc_spells_entries`, {
              params: {
                where: `npc_spells_id__${listId}`,
                limit: 100
              }
            })
            if (r.status === 200 && Array.isArray(r.data)) {
              for (const entry of r.data) {
                const spellId = entry.spellid || entry.spell_id
                if (spellId && !allSpells.has(spellId)) {
                  allSpells.set(spellId, { id: spellId, name: 'Spell #' + spellId })
                }
              }
            }
          } catch (e) {}
        }

        // Resolve all spell details
        const spellIds = [...allSpells.keys()]
        for (const spellId of spellIds) {
          try {
            const r = await SpireApi.v1().get(`/spells_new/${spellId}`)
            if (r.status === 200 && r.data) {
              allSpells.set(spellId, r.data)
            }
          } catch (e) {}
        }

        // Show resolved spells first, then unresolved by ID
        const resolved = [...allSpells.values()].filter(s => s.name && !String(s.name).startsWith('Spell #'))
        const unresolved = [...allSpells.values()].filter(s => !s.name || String(s.name).startsWith('Spell #'))
        this.zoneSpells = [...resolved.sort((a, b) => (a.name || '').localeCompare(b.name || '')), ...unresolved.sort((a, b) => a.id - b.id)]
      } catch (e) {
        console.error('[ZoneCardPreview] Failed to load spells', e)
      }
      this.loadingSpells = false
      this.$forceUpdate()
    }
  }
}
</script>

<style>
.gs-item-search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #1a1a2e;
  border: 1px solid rgba(255, 200, 50, 0.3);
  border-radius: 4px;
  max-height: 250px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}

.gs-item-search-result {
  padding: 6px 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: background 0.1s ease;
}

.gs-item-search-result:hover,
.gs-item-search-result.highlighted {
  background: rgba(255, 200, 50, 0.12);
}

.gs-item-search-result:last-child {
  border-bottom: none;
}

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
