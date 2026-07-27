<template>
  <content-area class="spire-editor-page inventory-keyring-page">
    <div class="spire-editor-toolbar">
      <div>
        <div class="spire-editor-kicker">Admin · player services</div>
        <h1 class="spire-editor-title">
          <i class="ra ra-backpack mr-1"></i> Inventory &amp; Keyring
        </h1>
        <p class="spire-editor-subtitle">
          Resolve carried items, bank storage, keys, and recovery history with live item context and guarded writes.
        </p>
      </div>
      <div class="spire-editor-summary" aria-label="Inventory and keyring summary">
        <span><strong>{{ number(summary.inventory_items) }}</strong> items</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(summary.keyring_entries) }}</strong> keys</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(summary.snapshot_sets) }}</strong> snapshots</span>
      </div>
    </div>

    <div class="spire-editor-workspace">
      <aside class="spire-editor-directory">
        <eq-window title="Characters">
          <div class="spire-editor-directory-controls">
            <div class="spire-editor-search">
              <i class="fa fa-search"></i>
              <input
                id="inventory-keyring-character-search"
                v-model.trim="search"
                class="form-control form-control-sm"
                placeholder="Search character, account, or ID…"
                @input="queueDirectorySearch"
              >
              <button
                v-if="search"
                type="button"
                class="spire-editor-search-clear"
                aria-label="Clear character search"
                @click="search = ''; currentPage = 1; loadDirectory()"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline-warning directory-refresh"
              :disabled="loadingDirectory"
              aria-label="Refresh characters"
              title="Refresh characters"
              @click="refreshDirectory"
            >
              <i class="fa fa-refresh" :class="{ 'fa-spin': loadingDirectory }"></i>
            </button>
          </div>

          <div class="spire-editor-filter inventory-character-filter" role="group" aria-label="Character data filter">
            <button
              v-for="filter in characterFilters"
              :key="filter.value"
              type="button"
              :class="{ active: stateFilter === filter.value }"
              @click="stateFilter = filter.value; currentPage = 1; loadDirectory()"
            >
              {{ filter.label }}
            </button>
          </div>

          <div class="spire-editor-directory-meta">
            <span>{{ number(totalRecords) }} records</span>
            <span v-if="loadingDirectory"><i class="fa fa-spinner fa-spin mr-1"></i>Refreshing</span>
            <span v-else>Page {{ currentPage }}</span>
          </div>

          <div class="spire-editor-directory-list inventory-character-list" data-testid="inventory-keyring-character-directory">
            <button
              v-for="record in records"
              :key="record.id"
              type="button"
              class="spire-editor-directory-row"
              :class="{ active: Number(selectedCharacterID) === Number(record.id) }"
              @click="selectCharacter(record.id)"
            >
              <span class="spire-editor-directory-icon">
                <i class="ra ra-player"></i>
              </span>
              <span class="spire-editor-directory-body">
                <span class="spire-editor-directory-name">
                  {{ record.name }}
                  <span v-if="record.online" class="online-dot" title="Online" aria-label="Online"></span>
                </span>
                <span class="spire-editor-directory-detail">
                  {{ record.account_name }} · L{{ record.level }} {{ className(record.class) }}
                </span>
                <span class="directory-facts">
                  <span><i class="ra ra-backpack"></i>{{ record.inventory_count }}</span>
                  <span><i class="ra ra-key"></i>{{ record.key_count }}</span>
                  <span><i class="fa fa-history"></i>{{ record.snapshot_count }}</span>
                </span>
              </span>
              <span class="spire-editor-directory-aside">#{{ record.id }}</span>
            </button>

            <div v-if="directoryError" class="spire-editor-directory-state spire-editor-directory-state--error" role="alert">
              <i class="fa fa-exclamation-triangle"></i>
              <span>{{ directoryError }}</span>
              <button type="button" class="btn btn-sm btn-outline-warning" @click="loadDirectory">Retry</button>
            </div>
            <div v-else-if="loadingDirectory && !records.length" class="spire-editor-directory-state">
              <i class="fa fa-spinner fa-spin"></i>
              <span>Loading player storage…</span>
            </div>
            <div v-else-if="!records.length" class="spire-editor-directory-state">
              <i class="fa fa-search"></i>
              <span>No characters match this view.</span>
            </div>
          </div>

          <nav v-if="totalPages > 1" class="spire-editor-pagination" aria-label="Character pages">
            <button type="button" aria-label="Previous page" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">
              <i class="fa fa-angle-left"></i>
            </button>
            <span><strong>{{ currentPage }}</strong> / {{ totalPages }}</span>
            <button type="button" aria-label="Next page" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">
              <i class="fa fa-angle-right"></i>
            </button>
          </nav>
        </eq-window>
      </aside>

      <main class="spire-editor-inspector">
        <eq-window v-if="detailError && !detail" title="Player Storage">
          <div class="spire-editor-empty spire-editor-empty--error" role="alert">
            <div class="spire-editor-empty__sigil"><i class="fa fa-exclamation-triangle"></i></div>
            <h3>Player storage could not be loaded</h3>
            <p>{{ detailError }}</p>
            <button type="button" class="btn btn-sm btn-outline-warning" @click="loadDetail(selectedCharacterID)">Retry</button>
          </div>
        </eq-window>

        <eq-window v-else-if="!detail && !loadingDetail" title="Player Storage">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="ra ra-backpack"></i></div>
            <h3>Select a character</h3>
            <p>Inspect their complete inventory, keyring, and server snapshots without leaving this workspace.</p>
          </div>
        </eq-window>

        <eq-window v-else-if="loadingDetail && !detail" title="Player Storage">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading player storage…</h3>
          </div>
        </eq-window>

        <div v-if="detail" data-testid="inventory-keyring-inspector">
          <eq-window title="Character">
            <div class="spire-editor-header">
              <div class="spire-editor-identity">
                <span class="spire-editor-identity-icon"><i class="ra ra-player"></i></span>
                <div>
                  <div class="spire-editor-eyebrow">
                    Character #{{ detail.character.id }}
                    <span v-if="hasUnsavedChanges" class="spire-editor-unsaved"><i class="fa fa-circle"></i> Unsaved</span>
                  </div>
                  <h2>{{ detail.character.name }}</h2>
                  <p>
                    {{ detail.character.account_name }} · Level {{ detail.character.level }} {{ className(detail.character.class) }}
                    <span v-if="detail.character.online" class="online-warning">
                      <i class="fa fa-circle"></i> Online · writes locked
                    </span>
                  </p>
                </div>
              </div>
              <div class="spire-editor-actions">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-warning"
                  :disabled="loadingDetail || hasUnsavedChanges"
                  @click="refreshSelected"
                >
                  <i class="fa fa-refresh mr-1" :class="{ 'fa-spin': loadingDetail }"></i>Refresh
                </button>
              </div>
            </div>
          </eq-window>

          <eq-window title="Workspace" class="mt-2">
            <div class="inventory-mode-tabs" role="tablist" aria-label="Player storage area">
              <button
                v-for="(mode, index) in modes"
                :key="mode.value"
                :id="'inventory-keyring-tab-' + mode.value"
                ref="modeTabs"
                type="button"
                role="tab"
                :aria-selected="activeMode === mode.value ? 'true' : 'false'"
                :tabindex="activeMode === mode.value ? 0 : -1"
                :class="{ active: activeMode === mode.value }"
                @click="selectMode(mode.value)"
                @keydown="onModeKeydown($event, index)"
              >
                <i :class="mode.icon"></i>
                <span>{{ mode.label }}</span>
                <small>{{ modeCount(mode.value) }}</small>
              </button>
            </div>

            <section
              v-if="activeMode === 'inventory'"
              id="inventory-keyring-panel-inventory"
              class="spire-editor-panel inventory-panel"
              role="tabpanel"
              aria-labelledby="inventory-keyring-tab-inventory"
            >
              <header class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Stored items</div>
                  <h3>Equipment, carried inventory, and bank</h3>
                </div>
                <div class="section-actions">
                  <div class="inventory-scope-filter" role="group" aria-label="Inventory area">
                    <button
                      v-for="scope in inventoryScopes"
                      :key="scope.value"
                      type="button"
                      :class="{ active: inventoryScope === scope.value }"
                      @click="inventoryScope = scope.value"
                    >
                      {{ scope.label }}
                    </button>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-warning"
                    :disabled="detail.character.online || hasUnsavedChanges"
                    data-testid="inventory-keyring-add-item"
                    @click="startInventoryCreate"
                  >
                    <i class="fa fa-plus mr-1"></i>Add item
                  </button>
                </div>
              </header>

              <div v-if="detail.character.online" class="storage-safety-banner" role="status">
                <i class="fa fa-lock"></i>
                <div>
                  <strong>Live character protection</strong>
                  <span>Viewing is available, but changes are disabled until {{ detail.character.name }} logs out.</span>
                </div>
              </div>

              <div class="inventory-layout" :class="{ 'inventory-layout--editing': inventoryDraft }">
                <div class="inventory-browser">
                  <div class="inventory-grid" data-testid="inventory-keyring-items">
                    <button
                      v-for="record in visibleInventory"
                      :key="record.slot_id"
                      type="button"
                      class="inventory-item-card"
                      :class="{ active: selectedInventory && selectedInventory.slot_id === record.slot_id }"
                      @click="selectInventory(record)"
                    >
                      <span class="item-sprite">
                        <span v-if="record.item.icon" :class="'item-' + record.item.icon"></span>
                        <i v-else class="ra ra-gem"></i>
                      </span>
                      <span class="inventory-item-copy">
                        <strong>{{ record.item.name }}</strong>
                        <span>{{ record.slot.label }}</span>
                        <small>
                          <span v-if="record.charges > 1">Qty {{ number(record.charges) }}</span>
                          <span v-if="record.container_contents">{{ record.container_contents }} inside</span>
                          <span v-if="activeAugmentCount(record)">{{ activeAugmentCount(record) }} aug</span>
                        </small>
                      </span>
                      <span class="inventory-item-id">#{{ record.item_id }}</span>
                    </button>

                    <div v-if="!visibleInventory.length" class="inventory-empty">
                      <i class="ra ra-backpack"></i>
                      <strong>No items in this area</strong>
                      <span>Choose another area or add an item to an available slot.</span>
                    </div>
                  </div>
                </div>

                <aside v-if="inventoryDraft" class="inventory-editor" data-testid="inventory-item-editor">
                  <div class="inventory-editor-heading">
                    <div>
                      <div class="spire-editor-kicker">
                        {{ inventoryCopying ? 'Copy record' : (inventoryCreating ? 'New record' : 'Selected item') }}
                      </div>
                      <h4>{{ inventoryDraftItem ? inventoryDraftItem.name : 'Choose an item' }}</h4>
                    </div>
                    <button type="button" class="icon-button" aria-label="Close item editor" @click="cancelInventoryEdit">
                      <i class="fa fa-times"></i>
                    </button>
                  </div>

                  <div class="item-recognition" :class="{ 'item-recognition--empty': !inventoryDraftItem }">
                    <span class="item-sprite item-sprite--large">
                      <span v-if="inventoryDraftItem && inventoryDraftItem.icon" :class="'item-' + inventoryDraftItem.icon"></span>
                      <i v-else class="ra ra-gem"></i>
                    </span>
                    <div>
                      <strong>{{ inventoryDraftItem ? inventoryDraftItem.name : 'No item selected' }}</strong>
                      <span v-if="inventoryDraftItem">
                        Item #{{ inventoryDraftItem.id }} · {{ itemTraits(inventoryDraftItem) }}
                      </span>
                      <span v-else>Search real item records by name or exact ID.</span>
                    </div>
                    <button
                      v-if="!inventoryCopying"
                      type="button"
                      class="btn btn-sm btn-outline-warning"
                      @click="openItemLookup('inventory')"
                    >
                      <i class="fa fa-search mr-1"></i>{{ inventoryDraftItem ? 'Change' : 'Choose' }}
                    </button>
                  </div>

                  <div v-if="inventoryDraftItem" class="item-trait-strip">
                    <span><i class="fa fa-cubes"></i>{{ inventoryDraftItem.stackable ? 'Stack ' + number(inventoryDraftItem.stack_size) : 'Single item' }}</span>
                    <span><i class="ra ra-backpack"></i>{{ inventoryDraftItem.bag_slots ? inventoryDraftItem.bag_slots + ' slot container' : 'Not a container' }}</span>
                    <span><i class="fa fa-shield"></i>{{ inventoryDraftItem.no_drop ? 'No drop' : 'Tradeable' }}</span>
                    <span v-if="selectedDraftSlot && selectedDraftSlot.label.includes('Shared Bank')">
                      <i class="fa fa-users"></i>Account-shared
                    </span>
                    <router-link :to="'/item/' + inventoryDraftItem.id" target="_blank">
                      <i class="fa fa-external-link"></i>Item Editor
                    </router-link>
                  </div>

                  <div v-if="inventoryCopying && selectedInventory" class="inventory-operation-context">
                    <i class="fa fa-copy"></i>
                    <div>
                      <strong>Creating a separate audited instance</strong>
                      <span>
                        The original remains in {{ selectedInventory.slot.label }}. Choose an empty destination below.
                      </span>
                    </div>
                  </div>

                  <div v-if="selectedInventory && selectedInventory.evolving" class="evolving-context" aria-label="Evolving item progress">
                    <div class="evolving-context__heading">
                      <div>
                        <div class="spire-editor-kicker">Server-managed progression</div>
                        <strong>{{ selectedInventory.evolving.progression.toFixed(1) }}% evolved</strong>
                      </div>
                      <span :class="{ active: selectedInventory.evolving.activated }">
                        {{ selectedInventory.evolving.activated ? 'Active' : 'Dormant' }}
                      </span>
                    </div>
                    <div
                      class="evolving-progress"
                      role="progressbar"
                      :aria-valuenow="Math.max(0, Math.min(100, selectedInventory.evolving.progression))"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <span :style="{ width: Math.max(0, Math.min(100, selectedInventory.evolving.progression)) + '%' }"></span>
                    </div>
                    <div class="evolving-context__facts">
                      <span>
                        <strong>{{ number(selectedInventory.evolving.current_amount) }}</strong>
                        <small v-if="selectedInventory.evolving.required_amount"> / {{ number(selectedInventory.evolving.required_amount) }} progress</small>
                        <small v-else> progress</small>
                      </span>
                      <span>
                        <strong>{{ selectedInventory.evolving.final_item_name }}</strong>
                        <small>Final item #{{ selectedInventory.evolving.final_item_id }}</small>
                      </span>
                      <span>
                        <strong>{{ selectedInventory.evolving.equipped ? 'Equipped' : 'Stored' }}</strong>
                        <small>Runtime state</small>
                      </span>
                    </div>
                  </div>

                  <div class="inventory-editor-fields">
                    <div class="spire-editor-field">
                      <label for="inventory-keyring-slot">Destination slot</label>
                      <select id="inventory-keyring-slot" v-model.number="inventoryDraft.target_slot_id" class="form-control form-control-sm">
                        <optgroup v-for="group in groupedAvailableSlots" :key="group.label" :label="group.label">
                          <option
                            v-for="slot in group.slots"
                            :key="slot.id"
                            :value="slot.id"
                            :disabled="occupiedSlot(slot.id)"
                          >
                            {{ slot.label }} · #{{ slot.id }}{{ occupiedSlot(slot.id) ? ' · occupied' : '' }}
                          </option>
                        </optgroup>
                      </select>
                      <small>{{ selectedDraftSlot ? selectedDraftSlot.description : 'Choose a named EQEmu slot.' }}</small>
                      <div
                        v-if="isMovingInventory"
                        class="inventory-operation-context inventory-operation-context--inline"
                        :class="{ 'inventory-operation-context--blocked': blockedCrossScopeContainerMove }"
                      >
                        <i :class="blockedCrossScopeContainerMove ? 'fa fa-ban' : 'fa fa-exchange'"></i>
                        <div>
                          <strong>
                            {{ blockedCrossScopeContainerMove ? 'Cross-storage move blocked' : 'Move item and instance state' }}
                          </strong>
                          <span v-if="blockedCrossScopeContainerMove">
                            This container has {{ selectedInventory.container_contents }} nested item(s). Move or remove them before crossing between character and shared storage.
                          </span>
                          <span v-else>
                            {{ selectedInventory.slot.label }} → {{ selectedDraftSlot.label }}. Augments, tint, ornaments, and custom data move with the item.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="inventory-numeric-grid">
                      <div class="spire-editor-field">
                        <label for="inventory-keyring-charges">{{ inventoryDraftItem && inventoryDraftItem.stackable ? 'Quantity' : 'Charges' }}</label>
                        <div class="numeric-stepper">
                          <button type="button" aria-label="Decrease quantity" @click="adjustCharges(-1)">−</button>
                          <input
                            id="inventory-keyring-charges"
                            v-model.number="inventoryDraft.charges"
                            type="number"
                            min="0"
                            :max="inventoryDraftItem && inventoryDraftItem.stackable ? inventoryDraftItem.stack_size : 65535"
                            class="form-control form-control-sm"
                          >
                          <button type="button" aria-label="Increase quantity" @click="adjustCharges(1)">+</button>
                        </div>
                      </div>
                      <div class="spire-editor-field">
                        <label for="inventory-keyring-color">Tint (ARGB)</label>
                        <div class="inventory-color-control">
                          <input
                            :value="inventoryColorHex"
                            type="color"
                            aria-label="Choose item tint"
                            @input="setInventoryColorHex($event.target.value)"
                          >
                          <input
                            id="inventory-keyring-color"
                            v-model.number="inventoryDraft.color"
                            type="number"
                            min="0"
                            max="4294967295"
                            class="form-control form-control-sm"
                          >
                          <button
                            type="button"
                            aria-label="Clear item tint"
                            title="Clear tint"
                            :disabled="!inventoryDraft.color"
                            @click="inventoryDraft.color = 0"
                          >
                            <i class="fa fa-times"></i>
                          </button>
                        </div>
                        <small>{{ inventoryColorSummary }}</small>
                      </div>
                    </div>

                    <div v-if="selectedDraftSlot && !selectedDraftSlot.label.includes('Shared Bank')" class="instance-toggle-row">
                      <div>
                        <strong>Instance no-drop</strong>
                        <span>Locks only this item instance to the character.</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        class="eq-switch"
                        :aria-checked="inventoryDraft.instance_no_drop ? 'true' : 'false'"
                        :class="{ active: inventoryDraft.instance_no_drop }"
                        @click="inventoryDraft.instance_no_drop = !inventoryDraft.instance_no_drop"
                      >
                        <span></span>
                      </button>
                    </div>
                    <div v-else class="shared-bank-context">
                      <i class="fa fa-users"></i>
                      <div>
                        <strong>Account-shared storage</strong>
                        <span>This slot is stored once for account #{{ detail.character.account_id }}. Instance attunement is not persisted by the shared-bank schema.</span>
                      </div>
                    </div>

                    <div v-if="inventoryDraftItem && visibleAugmentSockets.length" class="augment-editor">
                      <div class="augment-editor-title">
                        <div>
                          <div class="spire-editor-kicker">Augment sockets</div>
                          <strong>Compatible installed augments</strong>
                        </div>
                        <span>{{ visibleAugmentSockets.length }} available</span>
                      </div>
                      <div
                        v-for="socket in visibleAugmentSockets"
                        :key="socket.index"
                        class="augment-row"
                      >
                        <span class="augment-socket">S{{ socket.index + 1 }} · Type {{ socket.type }}</span>
                        <button type="button" class="augment-choice" @click="openItemLookup('augment', socket.index)">
                          <span v-if="draftAugmentItem(socket.index)">
                            <span v-if="draftAugmentItem(socket.index).icon" :class="'item-' + draftAugmentItem(socket.index).icon + '-sm'"></span>
                            {{ draftAugmentItem(socket.index).name }}
                          </span>
                          <span v-else><i class="fa fa-plus mr-1"></i>Choose compatible augment</span>
                        </button>
                        <button
                          v-if="inventoryDraft.augments[socket.index]"
                          type="button"
                          class="icon-button icon-button--danger"
                          :aria-label="'Remove augment from socket ' + (socket.index + 1)"
                          @click="clearAugment(socket.index)"
                        >
                          <i class="fa fa-times"></i>
                        </button>
                      </div>
                    </div>

                    <details class="inventory-advanced">
                      <summary>Advanced instance state</summary>
                      <div class="inventory-advanced-grid">
                        <div class="spire-editor-field">
                          <label for="inventory-keyring-ornament-icon">Ornament icon</label>
                          <input id="inventory-keyring-ornament-icon" v-model.number="inventoryDraft.ornament_icon" type="number" min="0" class="form-control form-control-sm">
                          <small>Client icon ID; 0 keeps the base item icon.</small>
                        </div>
                        <div class="spire-editor-field">
                          <label for="inventory-keyring-ornament-file">Ornament ID file</label>
                          <input id="inventory-keyring-ornament-file" v-model.number="inventoryDraft.ornament_id_file" type="number" min="0" class="form-control form-control-sm">
                          <small>Legacy weapon model-file value; 0 keeps the base model.</small>
                        </div>
                        <div class="spire-editor-field">
                          <label for="inventory-keyring-hero-model">Hero model</label>
                          <input id="inventory-keyring-hero-model" v-model.number="inventoryDraft.ornament_hero_model" type="number" class="form-control form-control-sm">
                          <small>Client hero-forge model value; 0 keeps the base appearance.</small>
                        </div>
                        <div class="spire-editor-field inventory-custom-data">
                          <label for="inventory-keyring-custom-data">Custom data</label>
                          <textarea
                            id="inventory-keyring-custom-data"
                            v-model="inventoryDraft.custom_data"
                            rows="2"
                            class="form-control form-control-sm"
                            placeholder="Server-owned key/value payload…"
                          ></textarea>
                          <small>No authoritative schema exists for custom_data; the stored value is preserved verbatim.</small>
                        </div>
                      </div>
                    </details>

                    <div class="spire-editor-field audit-reason-field">
                      <label for="inventory-keyring-inventory-reason">Required audit reason</label>
                      <textarea
                        id="inventory-keyring-inventory-reason"
                        v-model.trim="inventoryDraft.reason"
                        rows="2"
                        maxlength="240"
                        class="form-control form-control-sm"
                        placeholder="Explain why this player inventory is changing…"
                      ></textarea>
                      <small>{{ inventoryDraft.reason.length }}/240 · minimum 8 characters</small>
                    </div>
                  </div>

                  <div class="inventory-editor-actions">
                    <button
                      v-if="!inventoryCreating"
                      type="button"
                      class="btn btn-sm btn-outline-warning"
                      :disabled="!canCopyInventory"
                      :title="copyInventoryDisabledReason"
                      @click="startInventoryCopy"
                    >
                      <i class="fa fa-copy mr-1"></i>Copy
                    </button>
                    <button
                      v-if="!inventoryCreating"
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      :disabled="saving || detail.character.online"
                      @click="openDeleteModal('inventory')"
                    >
                      <i class="fa fa-trash mr-1"></i>Remove
                    </button>
                    <span class="editor-action-spacer"></span>
                    <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="saving" @click="cancelInventoryEdit">Cancel</button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-warning"
                      :disabled="!canSaveInventory"
                      @click="saveInventory"
                    >
                      <i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                      {{ inventorySaveLabel }}
                    </button>
                  </div>
                </aside>
              </div>
            </section>

            <section
              v-else-if="activeMode === 'keyring'"
              id="inventory-keyring-panel-keyring"
              class="spire-editor-panel keyring-panel"
              role="tabpanel"
              aria-labelledby="inventory-keyring-tab-keyring"
            >
              <header class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Permanent access</div>
                  <h3>Door keys recognized by the server</h3>
                  <p>Keyring entries are item references loaded by EQEmu when the character enters the world.</p>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-warning"
                  :disabled="detail.character.online || hasUnsavedChanges"
                  data-testid="inventory-keyring-add-key"
                  @click="startKeyCreate"
                >
                  <i class="fa fa-plus mr-1"></i>Add key
                </button>
              </header>

              <div v-if="detail.character.online" class="storage-safety-banner" role="status">
                <i class="fa fa-lock"></i>
                <div>
                  <strong>Live character protection</strong>
                  <span>Keyring writes resume after {{ detail.character.name }} logs out.</span>
                </div>
              </div>

              <div class="keyring-layout" :class="{ 'keyring-layout--editing': keyDraft }">
                <div class="keyring-grid" data-testid="inventory-keyring-keys">
                  <button
                    v-for="key in detail.keyring"
                    :key="key.id"
                    type="button"
                    class="key-card"
                    :class="{ active: selectedKey && selectedKey.id === key.id }"
                    @click="selectKey(key)"
                  >
                    <span class="item-sprite">
                      <span v-if="key.item.icon" :class="'item-' + key.item.icon"></span>
                      <i v-else class="ra ra-key"></i>
                    </span>
                    <span>
                      <strong>{{ key.item.name }}</strong>
                      <small>Item #{{ key.item_id }} · keyring record #{{ key.id }}</small>
                    </span>
                    <i class="fa fa-angle-right"></i>
                  </button>
                  <div v-if="!detail.keyring.length" class="inventory-empty">
                    <i class="ra ra-key"></i>
                    <strong>No keyring entries</strong>
                    <span>Add a real item record to grant permanent key access.</span>
                  </div>
                </div>

                <aside v-if="keyDraft" class="inventory-editor key-editor">
                  <div class="inventory-editor-heading">
                    <div>
                      <div class="spire-editor-kicker">{{ keyCreating ? 'New key' : 'Selected key' }}</div>
                      <h4>{{ keyDraftItem ? keyDraftItem.name : 'Choose a key item' }}</h4>
                    </div>
                    <button type="button" class="icon-button" aria-label="Close key editor" @click="cancelKeyEdit">
                      <i class="fa fa-times"></i>
                    </button>
                  </div>
                  <div class="item-recognition" :class="{ 'item-recognition--empty': !keyDraftItem }">
                    <span class="item-sprite item-sprite--large">
                      <span v-if="keyDraftItem && keyDraftItem.icon" :class="'item-' + keyDraftItem.icon"></span>
                      <i v-else class="ra ra-key"></i>
                    </span>
                    <div>
                      <strong>{{ keyDraftItem ? keyDraftItem.name : 'No key selected' }}</strong>
                      <span v-if="keyDraftItem">Item #{{ keyDraftItem.id }} · {{ keyDraftItem.no_drop ? 'No drop' : 'Tradeable' }}</span>
                      <span v-else>Choose the authoritative item that unlocks this access.</span>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-warning" @click="openItemLookup('key')">
                      <i class="fa fa-search mr-1"></i>{{ keyDraftItem ? 'Change' : 'Choose' }}
                    </button>
                  </div>
                  <div v-if="keyDraftItem" class="key-context-card">
                    <i class="ra ra-key"></i>
                    <div>
                      <strong>Server keyring behavior</strong>
                      <span>The server compares this item ID with door key requirements. No item instance is created.</span>
                    </div>
                    <router-link :to="'/item/' + keyDraftItem.id" target="_blank">Item Editor <i class="fa fa-external-link"></i></router-link>
                  </div>
                  <div class="spire-editor-field audit-reason-field">
                    <label for="inventory-keyring-key-reason">Required audit reason</label>
                    <textarea
                      id="inventory-keyring-key-reason"
                      v-model.trim="keyDraft.reason"
                      rows="2"
                      maxlength="240"
                      class="form-control form-control-sm"
                      placeholder="Explain why key access is changing…"
                    ></textarea>
                    <small>{{ keyDraft.reason.length }}/240 · minimum 8 characters</small>
                  </div>
                  <div class="inventory-editor-actions">
                    <button
                      v-if="!keyCreating"
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      :disabled="saving || detail.character.online"
                      @click="openDeleteModal('key')"
                    >
                      <i class="fa fa-trash mr-1"></i>Remove
                    </button>
                    <span class="editor-action-spacer"></span>
                    <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="saving" @click="cancelKeyEdit">Cancel</button>
                    <button type="button" class="btn btn-sm btn-outline-warning" :disabled="!canSaveKey" @click="saveKey">
                      <i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                      {{ keyCreating ? 'Add key' : 'Save key' }}
                    </button>
                  </div>
                </aside>
              </div>
            </section>

            <section
              v-else
              id="inventory-keyring-panel-snapshots"
              class="spire-editor-panel snapshots-panel"
              role="tabpanel"
              aria-labelledby="inventory-keyring-tab-snapshots"
            >
              <header class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Recovery evidence</div>
                  <h3>Server inventory snapshots</h3>
                  <p>Read-only historical captures help operators verify lost-item reports before making audited changes.</p>
                </div>
                <span class="readonly-badge"><i class="fa fa-lock mr-1"></i>Read only</span>
              </header>

              <div class="snapshot-layout">
                <div class="snapshot-list">
                  <button
                    v-for="snapshot in detail.snapshots"
                    :key="snapshot.time_index"
                    type="button"
                    :class="{ active: selectedSnapshotTime === snapshot.time_index }"
                    @click="loadSnapshot(snapshot.time_index)"
                  >
                    <i class="fa fa-history"></i>
                    <span>
                      <strong>{{ snapshotDate(snapshot.time_index) }}</strong>
                      <small>{{ number(snapshot.item_count) }} captured items · index {{ snapshot.time_index }}</small>
                    </span>
                    <i class="fa fa-angle-right"></i>
                  </button>
                  <div v-if="!detail.snapshots.length" class="inventory-empty">
                    <i class="fa fa-history"></i>
                    <strong>No snapshots available</strong>
                    <span>The EQEmu server has not captured historical inventory for this character.</span>
                  </div>
                </div>

                <div class="snapshot-preview">
                  <div v-if="loadingSnapshot" class="snapshot-state">
                    <i class="fa fa-spinner fa-spin"></i>
                    <span>Loading snapshot…</span>
                  </div>
                  <div v-else-if="snapshotError" class="snapshot-state snapshot-state--error" role="alert">
                    <i class="fa fa-exclamation-triangle"></i>
                    <span>{{ snapshotError }}</span>
                    <button type="button" class="btn btn-sm btn-outline-warning" @click="loadSnapshot(selectedSnapshotTime)">Retry</button>
                  </div>
                  <div v-else-if="!selectedSnapshotTime" class="snapshot-state">
                    <i class="fa fa-hand-pointer-o"></i>
                    <span>Select a capture to inspect its item and slot context.</span>
                  </div>
                  <template v-else>
                    <div class="snapshot-preview-heading">
                      <div>
                        <div class="spire-editor-kicker">Captured state</div>
                        <strong>{{ snapshotDate(selectedSnapshotTime) }}</strong>
                      </div>
                      <span>{{ number(snapshotItems.length) }} items</span>
                    </div>
                    <div class="snapshot-item-list">
                      <div v-for="record in snapshotItems" :key="record.slot_id" class="snapshot-item">
                        <span class="item-sprite">
                          <span v-if="record.item.icon" :class="'item-' + record.item.icon + '-sm'"></span>
                          <i v-else class="ra ra-gem"></i>
                        </span>
                        <span>
                          <strong>{{ record.item.name }}</strong>
                          <small>{{ record.slot.label }} · item #{{ record.item_id }}<template v-if="record.charges > 1"> · qty {{ record.charges }}</template></small>
                        </span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </section>
          </eq-window>
        </div>
      </main>
    </div>

    <b-modal
      id="inventory-keyring-item-lookup"
      ref="itemLookupModal"
      title="Choose an item"
      centered
      size="lg"
      hide-footer
      @shown="$nextTick(() => $refs.itemLookupInput && $refs.itemLookupInput.focus())"
      @hidden="resetLookup"
    >
      <div class="item-lookup">
        <div class="spire-editor-search item-lookup-search">
          <i class="fa fa-search"></i>
          <input
            ref="itemLookupInput"
            v-model.trim="lookupQuery"
            class="form-control"
            :placeholder="lookupKind === 'augment' ? 'Search compatible augment name or exact item ID…' : 'Search item name or exact ID…'"
            @input="queueItemLookup"
          >
        </div>
        <div v-if="lookupKind === 'augment' && activeAugmentSocket !== null" class="lookup-context">
          <i class="ra ra-gem"></i>
          Socket {{ activeAugmentSocket + 1 }} accepts type {{ activeSocketType }} augments. The server revalidates compatibility when saved.
        </div>
        <div class="item-lookup-results">
          <button
            v-for="item in lookupResults"
            :key="item.id"
            type="button"
            class="item-lookup-result"
            @click="chooseLookupItem(item)"
          >
            <span class="item-sprite">
              <span v-if="item.icon" :class="'item-' + item.icon"></span>
              <i v-else class="ra ra-gem"></i>
            </span>
            <span>
              <strong>{{ item.name }}</strong>
              <small>Item #{{ item.id }} · {{ itemTraits(item) }}</small>
            </span>
            <i class="fa fa-angle-right"></i>
          </button>
          <div v-if="lookupLoading" class="lookup-state"><i class="fa fa-spinner fa-spin"></i>Searching live items…</div>
          <div v-else-if="lookupError" class="lookup-state lookup-state--error" role="alert">{{ lookupError }}</div>
          <div v-else-if="lookupQuery.length >= 2 && !lookupResults.length" class="lookup-state">No matching item records.</div>
          <div v-else-if="lookupQuery.length < 2" class="lookup-state">Type at least two characters, or enter an exact item ID.</div>
        </div>
      </div>
    </b-modal>

    <b-modal
      id="inventory-keyring-delete"
      ref="deleteModal"
      :title="deleteTarget === 'key' ? 'Remove keyring access' : 'Remove inventory item'"
      centered
      hide-footer
      @hidden="resetDelete"
    >
      <div class="guarded-delete">
        <div class="guarded-delete-warning">
          <i class="fa fa-exclamation-triangle"></i>
          <div>
            <strong>This change affects live player data.</strong>
            <span v-if="deleteTarget === 'inventory' && selectedInventory && selectedInventory.container_contents">
              Removal is blocked while {{ selectedInventory.container_contents }} item(s) remain inside this container.
            </span>
            <span v-else>The mutation is transactional and written to Spire's immutable audit trail.</span>
          </div>
        </div>
        <div class="spire-editor-field">
          <label for="inventory-keyring-delete-confirmation">Type <code>{{ deletePhrase }}</code> to confirm</label>
          <input id="inventory-keyring-delete-confirmation" v-model="deleteConfirmation" class="form-control form-control-sm" autocomplete="off">
        </div>
        <div class="spire-editor-field">
          <label for="inventory-keyring-delete-reason">Required audit reason</label>
          <textarea
            id="inventory-keyring-delete-reason"
            v-model.trim="deleteReason"
            rows="3"
            maxlength="240"
            class="form-control form-control-sm"
            placeholder="Explain why this player data is being removed…"
          ></textarea>
        </div>
        <div class="guarded-delete-actions">
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="$refs.deleteModal.hide()">Cancel</button>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            :disabled="deleteConfirmation !== deletePhrase || deleteReason.length < 8 || saving || (deleteTarget === 'inventory' && selectedInventory && selectedInventory.container_contents > 0)"
            @click="confirmDelete"
          >
            <i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-trash'"></i>Remove
          </button>
        </div>
      </div>
    </b-modal>
  </content-area>
</template>

<script>
  import ContentArea from '@/components/layout/ContentArea.vue'
  import EqWindow from '@/components/eq-ui/EQWindow.vue'
  import { SpireApi } from '@/app/api/spire-api'
  import { DB_CLASSES } from '@/app/constants/eq-classes-constants'

  const clone = value => JSON.parse(JSON.stringify(value))

  export default {
    name: 'InventoryKeyringEditor',
    components: { ContentArea, EqWindow },
    data () {
      return {
        summary: {
          inventory_items: 0,
          keyring_entries: 0,
          snapshot_sets: 0
        },
        records: [],
        totalRecords: 0,
        currentPage: 1,
        pageSize: 30,
        search: '',
        stateFilter: '',
        selectedCharacterID: null,
        loadingDirectory: false,
        loadingDetail: false,
        directoryError: '',
        detailError: '',
        detail: null,
        activeMode: 'inventory',
        inventoryScope: 'all',
        selectedInventory: null,
        inventoryDraft: null,
        inventoryOriginal: null,
        inventoryDraftItem: null,
        inventoryDraftAugmentItems: {},
        inventoryCreating: false,
        inventoryCopying: false,
        selectedKey: null,
        keyDraft: null,
        keyOriginal: null,
        keyDraftItem: null,
        keyCreating: false,
        selectedSnapshotTime: null,
        snapshotItems: [],
        loadingSnapshot: false,
        snapshotError: '',
        saving: false,
        lookupKind: '',
        activeAugmentSocket: null,
        lookupQuery: '',
        lookupResults: [],
        lookupLoading: false,
        lookupError: '',
        directorySearchTimer: null,
        itemLookupTimer: null,
        deleteTarget: '',
        deleteConfirmation: '',
        deleteReason: '',
        modes: [
          { value: 'inventory', label: 'Inventory', icon: 'ra ra-backpack' },
          { value: 'keyring', label: 'Keyring', icon: 'ra ra-key' },
          { value: 'snapshots', label: 'Snapshots', icon: 'fa fa-history' }
        ],
        characterFilters: [
          { value: '', label: 'All' },
          { value: 'inventory', label: 'Items' },
          { value: 'keyring', label: 'Keys' },
          { value: 'snapshots', label: 'History' },
          { value: 'empty', label: 'Empty' }
        ],
        inventoryScopes: [
          { value: 'all', label: 'All' },
          { value: 'equipment', label: 'Equipped' },
          { value: 'inventory', label: 'Carried' },
          { value: 'bank', label: 'Bank' },
          { value: 'container', label: 'Inside bags' },
          { value: 'legacy', label: 'Legacy' }
        ]
      }
    },
    computed: {
      totalPages () {
        return Math.max(1, Math.ceil(this.totalRecords / this.pageSize))
      },
      visibleInventory () {
        if (!this.detail) return []
        const records = this.detail.inventory || []
        if (this.inventoryScope === 'all') return records
        if (this.inventoryScope === 'bank') {
          return records.filter(record => record.slot.group === 'Bank' || record.slot.group === 'Shared Bank')
        }
        const group = {
          equipment: 'Equipment',
          inventory: 'Inventory',
          container: 'Container',
          legacy: 'Legacy'
        }[this.inventoryScope]
        return records.filter(record => record.slot.group === group)
      },
      groupedAvailableSlots () {
        if (!this.detail) return []
        const groups = []
        const map = {}
        ;(this.detail.slots || []).filter(slot => slot.selectable).forEach(slot => {
          if (!map[slot.group]) {
            map[slot.group] = { label: slot.group, slots: [] }
            groups.push(map[slot.group])
          }
          map[slot.group].slots.push(slot)
        })
        if (this.selectedInventory && !this.selectedInventory.slot.known && !this.detail.slots.some(slot => slot.id === this.selectedInventory.slot_id)) {
          if (!map.Legacy) {
            map.Legacy = { label: 'Legacy', slots: [] }
            groups.push(map.Legacy)
          }
          map.Legacy.slots.push({ ...this.selectedInventory.slot, selectable: true })
        }
        return groups
      },
      selectedDraftSlot () {
        if (!this.inventoryDraft || !this.detail) return null
        const slots = this.groupedAvailableSlots.reduce((all, group) => all.concat(group.slots), [])
        return slots.find(slot => Number(slot.id) === Number(this.inventoryDraft.target_slot_id)) || null
      },
      selectedDraftStorageKind () {
        return this.selectedDraftSlot && this.selectedDraftSlot.group === 'Shared Bank'
          ? 'shared_bank'
          : 'character'
      },
      isMovingInventory () {
        return Boolean(
          !this.inventoryCreating &&
            this.selectedInventory &&
            this.inventoryDraft &&
            Number(this.inventoryDraft.target_slot_id) !== Number(this.selectedInventory.slot_id)
        )
      },
      blockedCrossScopeContainerMove () {
        return Boolean(
          this.isMovingInventory &&
            this.selectedInventory.container_contents > 0 &&
            this.selectedInventory.storage_kind !== this.selectedDraftStorageKind
        )
      },
      visibleAugmentSockets () {
        if (!this.inventoryDraftItem) return []
        return (this.inventoryDraftItem.augment_slots || [])
          .map((type, index) => ({ type, index }))
          .filter(socket => socket.type > 0)
      },
      activeSocketType () {
        if (this.activeAugmentSocket === null || !this.inventoryDraftItem) return 0
        return Number((this.inventoryDraftItem.augment_slots || [])[this.activeAugmentSocket] || 0)
      },
      canSaveInventory () {
        return Boolean(
          this.inventoryDraft &&
            this.inventoryDraftItem &&
            this.inventoryDraft.reason.length >= 8 &&
            this.inventoryDraft.target_slot_id !== null &&
            !this.blockedCrossScopeContainerMove &&
            !this.saving &&
            !this.detail.character.online
        )
      },
      canCopyInventory () {
        return Boolean(
          this.selectedInventory &&
            !this.selectedInventory.evolving &&
            !this.selectedInventory.container_contents &&
            !this.hasUnsavedChanges &&
            !this.saving &&
            !this.detail.character.online
        )
      },
      copyInventoryDisabledReason () {
        if (!this.selectedInventory) return ''
        if (this.selectedInventory.evolving) return 'Evolving progression is server-managed and cannot be copied safely.'
        if (this.selectedInventory.container_contents) return 'Move or remove nested contents before copying this container.'
        if (this.hasUnsavedChanges) return 'Save or cancel current changes before copying.'
        if (this.detail.character.online) return 'Inventory writes resume after the character logs out.'
        return 'Create a separate audited item instance.'
      },
      inventorySaveLabel () {
        if (this.inventoryCopying) return 'Create copy'
        if (this.inventoryCreating) return 'Add item'
        if (this.isMovingInventory) return 'Move & save'
        return 'Save item'
      },
      inventoryColorHex () {
        const rgb = (Number(this.inventoryDraft && this.inventoryDraft.color) >>> 0) & 0xFFFFFF
        return `#${rgb.toString(16).padStart(6, '0')}`
      },
      inventoryColorSummary () {
        const value = Number(this.inventoryDraft && this.inventoryDraft.color) >>> 0
        return value
          ? `Stored ARGB #${value.toString(16).padStart(8, '0').toUpperCase()}`
          : 'No item tint stored.'
      },
      canSaveKey () {
        return Boolean(
          this.keyDraft &&
            this.keyDraftItem &&
            this.keyDraft.reason.length >= 8 &&
            !this.saving &&
            !this.detail.character.online
        )
      },
      hasUnsavedChanges () {
        if (this.inventoryDraft) {
          return JSON.stringify(this.inventoryDraft) !== JSON.stringify(this.inventoryOriginal)
        }
        if (this.keyDraft) {
          return JSON.stringify(this.keyDraft) !== JSON.stringify(this.keyOriginal)
        }
        return false
      },
      deletePhrase () {
        if (this.deleteTarget === 'inventory' && this.selectedInventory) return `REMOVE ${this.selectedInventory.item.name}`
        if (this.deleteTarget === 'key' && this.selectedKey) return `REMOVE ${this.selectedKey.item.name}`
        return ''
      }
    },
    watch: {
      '$route.query.character' (value) {
        const id = Number(value || 0)
        if (id > 0 && id !== Number(this.selectedCharacterID)) this.loadDetail(id)
      },
      '$route.query.mode' (value) {
        if (this.modes.some(mode => mode.value === value) && value !== this.activeMode) {
          this.activeMode = value
          this.cancelEditors()
        }
      }
    },
    created () {
      const mode = String(this.$route.query.mode || '')
      if (this.modes.some(option => option.value === mode)) this.activeMode = mode
      this.selectedCharacterID = Number(this.$route.query.character || 0) || null
      this.loadInitial()
      window.addEventListener('beforeunload', this.beforeUnload)
    },
    beforeDestroy () {
      window.removeEventListener('beforeunload', this.beforeUnload)
      clearTimeout(this.directorySearchTimer)
      clearTimeout(this.itemLookupTimer)
    },
    beforeRouteLeave (to, from, next) {
      if (!this.hasUnsavedChanges || window.confirm('Discard unsaved inventory or keyring changes?')) next()
      else next(false)
    },
    methods: {
      async loadInitial () {
        await Promise.all([this.loadSummary(), this.loadDirectory()])
        if (this.selectedCharacterID) {
          await this.loadDetail(this.selectedCharacterID)
        }
      },
      async loadSummary () {
        try {
          const response = await SpireApi.v1().get('/inventory-keyring/summary')
          this.summary = response.data
        } catch (error) {
          this.toastError(error, 'Summary could not be refreshed')
        }
      },
      async loadDirectory () {
        this.loadingDirectory = true
        this.directoryError = ''
        try {
          const response = await SpireApi.v1().get('/inventory-keyring/characters', {
            params: {
              q: this.search || undefined,
              state: this.stateFilter || undefined,
              page: this.currentPage,
              limit: this.pageSize
            }
          })
          this.records = response.data.data || []
          this.totalRecords = Number(response.data.total || 0)
          if (!this.selectedCharacterID && this.records.length) {
            await this.selectCharacter(this.records[0].id, true)
          }
        } catch (error) {
          this.directoryError = this.errorMessage(error, 'Character storage could not be loaded')
        } finally {
          this.loadingDirectory = false
        }
      },
      async refreshDirectory () {
        await Promise.all([this.loadSummary(), this.loadDirectory()])
      },
      queueDirectorySearch () {
        clearTimeout(this.directorySearchTimer)
        this.directorySearchTimer = setTimeout(() => {
          this.currentPage = 1
          this.loadDirectory()
        }, 250)
      },
      changePage (page) {
        if (page < 1 || page > this.totalPages) return
        this.currentPage = page
        this.loadDirectory()
      },
      async selectCharacter (id, replace = false) {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved inventory or keyring changes?')) return
        this.cancelEditors()
        this.selectedCharacterID = Number(id)
        const query = { ...this.$route.query, character: String(id), mode: this.activeMode }
        await this.$router[replace ? 'replace' : 'push']({ query }).catch(() => {})
        await this.loadDetail(id)
      },
      async loadDetail (id) {
        if (!id) return
        this.loadingDetail = true
        this.detailError = ''
        try {
          const response = await SpireApi.v1().get(`/inventory-keyring/character/${id}`)
          this.detail = response.data
          this.selectedCharacterID = Number(id)
          if (this.selectedInventory) {
            this.selectedInventory = this.detail.inventory.find(record => record.slot_id === this.selectedInventory.slot_id) || null
          }
          if (this.selectedKey) {
            this.selectedKey = this.detail.keyring.find(record => record.id === this.selectedKey.id) || null
          }
        } catch (error) {
          this.detail = null
          this.detailError = this.errorMessage(error, 'Player storage could not be loaded')
        } finally {
          this.loadingDetail = false
        }
      },
      async refreshSelected () {
        if (!this.selectedCharacterID) return
        await Promise.all([this.loadSummary(), this.loadDetail(this.selectedCharacterID)])
      },
      selectMode (mode) {
        if (mode === this.activeMode) return
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved changes before switching sections?')) return
        this.cancelEditors()
        this.activeMode = mode
        const query = { ...this.$route.query, mode }
        this.$router.push({ query }).catch(() => {})
      },
      onModeKeydown (event, index) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        let nextIndex = index
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + this.modes.length) % this.modes.length
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % this.modes.length
        if (event.key === 'Home') nextIndex = 0
        if (event.key === 'End') nextIndex = this.modes.length - 1
        this.selectMode(this.modes[nextIndex].value)
        this.$nextTick(() => this.$refs.modeTabs[nextIndex].focus())
      },
      modeCount (mode) {
        if (!this.detail) return 0
        if (mode === 'inventory') return this.detail.inventory.length
        if (mode === 'keyring') return this.detail.keyring.length
        return this.detail.snapshots.length
      },
      startInventoryCreate () {
        this.selectedInventory = null
        this.inventoryCreating = true
        this.inventoryCopying = false
        this.inventoryDraftItem = null
        this.inventoryDraftAugmentItems = {}
        const firstAvailable = this.firstAvailableSlot()
        this.inventoryDraft = {
          item_id: 0,
          slot_id: firstAvailable,
          target_slot_id: firstAvailable,
          charges: 1,
          color: 0,
          augments: [0, 0, 0, 0, 0, 0],
          instance_no_drop: false,
          custom_data: '',
          ornament_icon: 0,
          ornament_id_file: 0,
          ornament_hero_model: 0,
          reason: ''
        }
        this.inventoryOriginal = clone(this.inventoryDraft)
        this.$nextTick(() => this.openItemLookup('inventory'))
      },
      selectInventory (record) {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved item changes?')) return
        this.inventoryCreating = false
        this.inventoryCopying = false
        this.selectedInventory = record
        this.inventoryDraftItem = clone(record.item)
        this.inventoryDraftAugmentItems = {}
        record.augments.forEach(augment => {
          if (augment.item) this.$set(this.inventoryDraftAugmentItems, augment.socket - 1, clone(augment.item))
        })
        this.inventoryDraft = {
          item_id: record.item_id,
          slot_id: record.slot_id,
          target_slot_id: record.slot_id,
          charges: record.charges,
          color: record.color,
          augments: record.augments.map(augment => augment.item_id || 0),
          instance_no_drop: record.instance_no_drop,
          custom_data: record.custom_data || '',
          ornament_icon: record.ornament_icon || 0,
          ornament_id_file: record.ornament_id_file || 0,
          ornament_hero_model: record.ornament_hero_model || 0,
          reason: ''
        }
        this.inventoryOriginal = clone(this.inventoryDraft)
      },
      startInventoryCopy () {
        if (!this.canCopyInventory || !this.selectedInventory) return
        const record = this.selectedInventory
        this.inventoryCreating = true
        this.inventoryCopying = true
        this.inventoryDraftItem = clone(record.item)
        this.inventoryDraftAugmentItems = {}
        record.augments.forEach(augment => {
          if (augment.item) this.$set(this.inventoryDraftAugmentItems, augment.socket - 1, clone(augment.item))
        })
        this.inventoryDraft = {
          item_id: record.item_id,
          slot_id: record.slot_id,
          target_slot_id: this.firstAvailableSlot(),
          charges: record.charges,
          color: record.color,
          augments: record.augments.map(augment => augment.item_id || 0),
          instance_no_drop: record.instance_no_drop,
          custom_data: record.custom_data || '',
          ornament_icon: record.ornament_icon || 0,
          ornament_id_file: record.ornament_id_file || 0,
          ornament_hero_model: record.ornament_hero_model || 0,
          reason: ''
        }
        this.inventoryOriginal = clone(this.inventoryDraft)
      },
      cancelInventoryEdit () {
        this.inventoryDraft = null
        this.inventoryOriginal = null
        this.inventoryDraftItem = null
        this.inventoryDraftAugmentItems = {}
        this.inventoryCreating = false
        this.inventoryCopying = false
        this.selectedInventory = null
      },
      firstAvailableSlot () {
        if (!this.detail) return 23
        const occupied = new Set(this.detail.inventory.map(record => Number(record.slot_id)))
        const preferred = (this.detail.slots || []).filter(slot => slot.selectable && ['Inventory', 'Bank', 'Shared Bank'].includes(slot.group))
        const match = preferred.find(slot => !occupied.has(Number(slot.id)))
        return match ? Number(match.id) : 23
      },
      occupiedSlot (slotID) {
        if (!this.detail) return false
        const current = this.selectedInventory && !this.inventoryCopying ? Number(this.selectedInventory.slot_id) : null
        return this.detail.inventory.some(record => Number(record.slot_id) === Number(slotID) && Number(slotID) !== current)
      },
      adjustCharges (amount) {
        if (!this.inventoryDraft) return
        const max = this.inventoryDraftItem && this.inventoryDraftItem.stackable
          ? Math.max(1, Number(this.inventoryDraftItem.stack_size || 1))
          : 65535
        this.inventoryDraft.charges = Math.min(max, Math.max(0, Number(this.inventoryDraft.charges || 0) + amount))
      },
      setInventoryColorHex (hex) {
        if (!this.inventoryDraft || !/^#[0-9a-f]{6}$/i.test(hex)) return
        const current = Number(this.inventoryDraft.color || 0) >>> 0
        const alpha = (current >>> 24) || 0xFF
        const rgb = parseInt(hex.slice(1), 16)
        this.inventoryDraft.color = (((alpha << 24) | rgb) >>> 0)
      },
      activeAugmentCount (record) {
        return (record.augments || []).filter(augment => augment.item_id > 0).length
      },
      draftAugmentItem (index) {
        return this.inventoryDraftAugmentItems[index] || null
      },
      clearAugment (index) {
        this.$set(this.inventoryDraft.augments, index, 0)
        this.$delete(this.inventoryDraftAugmentItems, index)
      },
      async saveInventory () {
        if (!this.canSaveInventory) return
        this.saving = true
        const wasCreating = this.inventoryCreating
        const wasCopying = this.inventoryCopying
        try {
          const body = clone(this.inventoryDraft)
          body.item_id = this.inventoryDraftItem.id
          let response
          if (this.inventoryCreating) {
            body.slot_id = body.target_slot_id
            response = await SpireApi.v1().post(`/inventory-keyring/character/${this.selectedCharacterID}/inventory`, body)
          } else {
            response = await SpireApi.v1().patch(
              `/inventory-keyring/character/${this.selectedCharacterID}/inventory/${this.selectedInventory.slot_id}`,
              body
            )
          }
          this.detail = response.data.detail
          const targetSlot = Number(body.target_slot_id)
          this.cancelInventoryEdit()
          const saved = this.detail.inventory.find(record => Number(record.slot_id) === targetSlot)
          if (saved) this.selectInventory(saved)
          this.toastSuccess(wasCopying ? 'Item copy added' : (wasCreating ? 'Item added' : 'Item saved'))
          await Promise.all([this.loadSummary(), this.loadDirectory()])
        } catch (error) {
          this.toastError(error, 'Inventory change failed')
        } finally {
          this.saving = false
        }
      },
      startKeyCreate () {
        this.selectedKey = null
        this.keyCreating = true
        this.keyDraftItem = null
        this.keyDraft = { item_id: 0, reason: '' }
        this.keyOriginal = clone(this.keyDraft)
        this.$nextTick(() => this.openItemLookup('key'))
      },
      selectKey (record) {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved key changes?')) return
        this.selectedKey = record
        this.keyCreating = false
        this.keyDraftItem = clone(record.item)
        this.keyDraft = { item_id: record.item_id, reason: '' }
        this.keyOriginal = clone(this.keyDraft)
      },
      cancelKeyEdit () {
        this.keyDraft = null
        this.keyOriginal = null
        this.keyDraftItem = null
        this.keyCreating = false
        this.selectedKey = null
      },
      async saveKey () {
        if (!this.canSaveKey) return
        this.saving = true
        const wasCreating = this.keyCreating
        try {
          const body = { item_id: this.keyDraftItem.id, reason: this.keyDraft.reason }
          let response
          if (this.keyCreating) {
            response = await SpireApi.v1().post(`/inventory-keyring/character/${this.selectedCharacterID}/keyring`, body)
          } else {
            response = await SpireApi.v1().patch(
              `/inventory-keyring/character/${this.selectedCharacterID}/keyring/${this.selectedKey.id}`,
              body
            )
          }
          this.detail = response.data.detail
          const savedItemID = body.item_id
          this.cancelKeyEdit()
          const saved = this.detail.keyring.find(record => Number(record.item_id) === Number(savedItemID))
          if (saved) this.selectKey(saved)
          this.toastSuccess(wasCreating ? 'Key added' : 'Key saved')
          await Promise.all([this.loadSummary(), this.loadDirectory()])
        } catch (error) {
          this.toastError(error, 'Keyring change failed')
        } finally {
          this.saving = false
        }
      },
      cancelEditors () {
        this.cancelInventoryEdit()
        this.cancelKeyEdit()
      },
      openItemLookup (kind, augmentIndex = null) {
        this.lookupKind = kind
        this.activeAugmentSocket = augmentIndex
        this.lookupQuery = ''
        this.lookupResults = []
        this.lookupError = ''
        this.$refs.itemLookupModal.show()
      },
      queueItemLookup () {
        clearTimeout(this.itemLookupTimer)
        this.itemLookupTimer = setTimeout(this.searchItems, 220)
      },
      async searchItems () {
        if (this.lookupQuery.length < 2 && !/^\d+$/.test(this.lookupQuery)) {
          this.lookupResults = []
          return
        }
        this.lookupLoading = true
        this.lookupError = ''
        try {
          const response = await SpireApi.v1().get('/inventory-keyring/lookup/items', {
            params: {
              q: this.lookupQuery,
              kind: this.lookupKind === 'augment' ? 'augment' : undefined
            }
          })
          this.lookupResults = this.lookupKind === 'augment'
            ? response.data.filter(item => this.augmentFits(item, this.activeSocketType))
            : response.data
        } catch (error) {
          this.lookupError = this.errorMessage(error, 'Item search failed')
        } finally {
          this.lookupLoading = false
        }
      },
      chooseLookupItem (item) {
        if (this.lookupKind === 'inventory') {
          this.inventoryDraftItem = clone(item)
          this.inventoryDraft.item_id = item.id
          if (item.stackable) this.inventoryDraft.charges = Math.max(1, Math.min(this.inventoryDraft.charges || 1, item.stack_size || 1))
          this.inventoryDraft.augments = [0, 0, 0, 0, 0, 0]
          this.inventoryDraftAugmentItems = {}
        } else if (this.lookupKind === 'key') {
          this.keyDraftItem = clone(item)
          this.keyDraft.item_id = item.id
        } else if (this.lookupKind === 'augment' && this.activeAugmentSocket !== null) {
          this.$set(this.inventoryDraft.augments, this.activeAugmentSocket, item.id)
          this.$set(this.inventoryDraftAugmentItems, this.activeAugmentSocket, clone(item))
        }
        this.$refs.itemLookupModal.hide()
      },
      augmentFits (item, socketType) {
        if (!socketType || !item.augment_type_mask) return false
        return (Number(item.augment_type_mask) & (1 << (Number(socketType) - 1))) !== 0
      },
      resetLookup () {
        clearTimeout(this.itemLookupTimer)
        this.lookupKind = ''
        this.activeAugmentSocket = null
        this.lookupQuery = ''
        this.lookupResults = []
        this.lookupError = ''
      },
      openDeleteModal (target) {
        this.deleteTarget = target
        this.deleteReason = target === 'inventory' && this.inventoryDraft ? this.inventoryDraft.reason : (this.keyDraft ? this.keyDraft.reason : '')
        this.deleteConfirmation = ''
        this.$refs.deleteModal.show()
      },
      async confirmDelete () {
        if (this.deleteConfirmation !== this.deletePhrase || this.deleteReason.length < 8) return
        this.saving = true
        try {
          let response
          if (this.deleteTarget === 'inventory') {
            response = await SpireApi.v1().delete(
              `/inventory-keyring/character/${this.selectedCharacterID}/inventory/${this.selectedInventory.slot_id}`,
              { data: { confirmation: this.deleteConfirmation, reason: this.deleteReason } }
            )
            this.cancelInventoryEdit()
          } else {
            response = await SpireApi.v1().delete(
              `/inventory-keyring/character/${this.selectedCharacterID}/keyring/${this.selectedKey.id}`,
              { data: { confirmation: this.deleteConfirmation, reason: this.deleteReason, item_id: this.selectedKey.item_id } }
            )
            this.cancelKeyEdit()
          }
          this.detail = response.data.detail
          this.$refs.deleteModal.hide()
          this.toastSuccess('Player data removed')
          await Promise.all([this.loadSummary(), this.loadDirectory()])
        } catch (error) {
          this.toastError(error, 'Removal failed')
        } finally {
          this.saving = false
        }
      },
      resetDelete () {
        this.deleteTarget = ''
        this.deleteConfirmation = ''
        this.deleteReason = ''
      },
      async loadSnapshot (timeIndex) {
        this.selectedSnapshotTime = Number(timeIndex)
        this.loadingSnapshot = true
        this.snapshotError = ''
        try {
          const response = await SpireApi.v1().get(
            `/inventory-keyring/character/${this.selectedCharacterID}/snapshot/${timeIndex}`
          )
          this.snapshotItems = response.data.items || []
        } catch (error) {
          this.snapshotItems = []
          this.snapshotError = this.errorMessage(error, 'Snapshot could not be loaded')
        } finally {
          this.loadingSnapshot = false
        }
      },
      snapshotDate (timeIndex) {
        const value = Number(timeIndex)
        if (!value) return 'Unknown capture time'
        const milliseconds = value > 1000000000000 ? value : value * 1000
        const date = new Date(milliseconds)
        return Number.isNaN(date.getTime()) ? `Snapshot ${value}` : date.toLocaleString()
      },
      itemTraits (item) {
        const traits = []
        if (item.bag_slots) traits.push(`${item.bag_slots}-slot container`)
        else if (item.stackable) traits.push(`stack ${this.number(item.stack_size)}`)
        else traits.push('single item')
        if (item.no_drop) traits.push('no drop')
        if (item.augment_type_mask) traits.push(`augment mask ${item.augment_type_mask}`)
        return traits.join(' · ')
      },
      className (id) {
        return DB_CLASSES[Number(id)] || `Class #${id}`
      },
      number (value) {
        return Number(value || 0).toLocaleString()
      },
      beforeUnload (event) {
        if (!this.hasUnsavedChanges) return
        event.preventDefault()
        event.returnValue = ''
      },
      errorMessage (error, fallback) {
        return error && error.response && error.response.data && error.response.data.error
          ? error.response.data.error
          : fallback
      },
      toastSuccess (message) {
        this.$bvToast.toast(message, { title: 'Inventory & Keyring', variant: 'success', solid: true })
      },
      toastError (error, fallback) {
        this.$bvToast.toast(this.errorMessage(error, fallback), { title: 'Inventory & Keyring', variant: 'danger', solid: true })
      }
    }
  }
</script>

<style scoped>
@import '../../../assets/css/content-editor-workspace.css';

.inventory-keyring-page {
  --inventory-gold: #d6ab37;
  --inventory-surface: rgba(7, 15, 23, .94);
  --inventory-line: rgba(155, 175, 188, .19);
}

.directory-refresh {
  width: 34px;
  min-width: 34px;
  padding-inline: 0;
}

.inventory-character-filter {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.inventory-character-list .spire-editor-directory-row {
  min-height: 76px;
}

.directory-facts {
  display: flex;
  gap: 11px;
  margin-top: 4px;
  color: #9eacb8;
  font-size: 10px;
}

.directory-facts span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.online-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-left: 4px;
  border-radius: 50%;
  background: #46d89b;
  box-shadow: 0 0 8px rgba(70, 216, 155, .7);
  vertical-align: middle;
}

.online-warning {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 8px;
  color: #f4bd55;
}

.online-warning i {
  font-size: 7px;
}

.inventory-mode-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  padding: 10px 14px 0;
}

.inventory-mode-tabs button {
  min-height: 43px;
  border: 1px solid #6d7480;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(180deg, rgba(48, 51, 70, .96), rgba(25, 29, 42, .96));
  color: #e5e8ed;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  transition: background .15s ease, border-color .15s ease, color .15s ease;
}

.inventory-mode-tabs button small {
  min-width: 22px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, .28);
  color: #aeb9c4;
}

.inventory-mode-tabs button.active {
  border-color: #a78530;
  background: linear-gradient(180deg, rgba(69, 59, 32, .92), rgba(28, 29, 27, .98));
  color: #f3cf69;
}

.spire-editor-panel {
  padding-top: 12px;
}

.spire-editor-section-heading {
  align-items: flex-end;
}

.spire-editor-section-heading p {
  margin: 4px 0 0;
  color: #9ba7b3;
  font-size: 11px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.inventory-scope-filter {
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid rgba(151, 164, 178, .35);
  border-radius: 4px;
}

.inventory-scope-filter button {
  min-height: 30px;
  padding: 0 10px;
  border: 0;
  border-right: 1px solid rgba(151, 164, 178, .2);
  background: rgba(5, 10, 15, .72);
  color: #aab5c0;
  font-size: 10px;
}

.inventory-scope-filter button:last-child {
  border-right: 0;
}

.inventory-scope-filter button.active {
  background: rgba(177, 138, 35, .2);
  color: #f1cb61;
}

.storage-safety-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0;
  padding: 10px 12px;
  border: 1px solid rgba(220, 158, 62, .38);
  background: rgba(78, 48, 13, .22);
  color: #edc36c;
}

.storage-safety-banner > i {
  font-size: 18px;
}

.storage-safety-banner div {
  display: flex;
  flex-direction: column;
}

.storage-safety-banner span {
  color: #c6bda8;
  font-size: 11px;
}

.inventory-layout,
.keyring-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  min-height: 430px;
}

.inventory-layout--editing,
.keyring-layout--editing {
  grid-template-columns: minmax(320px, .95fr) minmax(380px, 1.05fr);
}

.inventory-browser,
.keyring-grid,
.snapshot-list,
.snapshot-preview {
  min-width: 0;
  border: 1px solid var(--inventory-line);
  background: rgba(4, 10, 16, .55);
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  align-content: start;
  grid-auto-rows: 54px;
  gap: 6px;
  padding: 8px;
}

.inventory-browser .inventory-grid > button.inventory-item-card {
  position: relative;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  min-height: 54px;
  padding: 6px 7px;
  border: 1px solid rgba(132, 151, 164, .21);
  background: linear-gradient(135deg, rgba(14, 24, 34, .96), rgba(7, 13, 20, .94));
  color: #e7e9ec;
  text-align: left;
}

.inventory-item-card:hover,
.inventory-item-card:focus-visible {
  border-color: rgba(205, 167, 69, .62);
  background: linear-gradient(135deg, rgba(31, 35, 32, .96), rgba(10, 17, 23, .94));
}

.inventory-item-card.active {
  border-color: #b89436;
  box-shadow: inset 3px 0 0 #d5ac42;
}

.inventory-item-card .item-sprite {
  width: 32px;
  height: 32px;
}

.item-sprite {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(178, 151, 74, .33);
  background: rgba(10, 12, 16, .72);
  overflow: hidden;
}

.item-sprite--large {
  width: 50px;
  height: 50px;
}

.item-sprite > span {
  flex: 0 0 auto;
}

.item-sprite > i {
  color: #a98c43;
  font-size: 22px;
}

.inventory-item-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.inventory-item-copy strong,
.key-card strong {
  overflow: hidden;
  color: #eef0f3;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inventory-item-copy > span {
  color: #c6aa5c;
  font-size: 10px;
}

.inventory-item-copy small {
  display: flex;
  gap: 6px;
  color: #8f9ca8;
  font-size: 9px;
}

.inventory-item-id {
  align-self: flex-start;
  color: #8593a0;
  font-size: 9px;
}

.inventory-empty {
  grid-column: 1 / -1;
  min-height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  color: #8997a3;
  text-align: center;
}

.inventory-empty > i {
  color: #8d7538;
  font-size: 28px;
}

.inventory-empty strong {
  color: #d7dce1;
}

.inventory-empty span {
  max-width: 320px;
  font-size: 11px;
}

.inventory-editor {
  min-width: 0;
  border: 1px solid rgba(174, 146, 69, .48);
  background: linear-gradient(160deg, rgba(13, 22, 31, .98), rgba(5, 10, 15, .98));
}

.inventory-editor-heading,
.inventory-editor-actions,
.augment-editor-title,
.snapshot-preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.inventory-editor-heading {
  padding: 12px 14px;
  border-bottom: 1px solid var(--inventory-line);
}

.inventory-editor-heading h4 {
  margin: 1px 0 0;
  color: #e8c65f;
  font-size: 18px;
  font-family: Cinzel, serif;
}

.icon-button {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(153, 165, 176, .3);
  border-radius: 3px;
  background: rgba(7, 12, 17, .7);
  color: #aeb8c0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-button--danger {
  border-color: rgba(211, 78, 78, .35);
  color: #dc7777;
}

.item-recognition {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin: 12px 14px 8px;
  padding: 10px;
  border: 1px solid rgba(188, 154, 58, .42);
  background: radial-gradient(circle at 14% 50%, rgba(162, 126, 31, .18), transparent 42%), rgba(5, 11, 16, .73);
}

.item-recognition--empty {
  border-style: dashed;
}

.item-recognition > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.item-recognition strong {
  color: #ead087;
}

.item-recognition span {
  color: #9faab4;
  font-size: 10px;
}

.item-trait-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 0 14px 10px;
}

.item-trait-strip span,
.item-trait-strip a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border: 1px solid rgba(142, 155, 167, .2);
  background: rgba(3, 8, 12, .5);
  color: #aab5be;
  font-size: 9px;
}

.item-trait-strip a {
  color: #e0bd56;
}

.evolving-context {
  margin: 0 14px 12px;
  padding: 11px 12px;
  border: 1px solid rgba(78, 145, 176, .34);
  background: linear-gradient(135deg, rgba(26, 75, 92, .24), rgba(5, 12, 18, .62));
}

.evolving-context__heading,
.evolving-context__facts {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.evolving-context__heading > div {
  display: flex;
  flex-direction: column;
}

.evolving-context__heading > span {
  padding: 2px 7px;
  border: 1px solid rgba(122, 132, 142, .38);
  color: #9aa6ae;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.evolving-context__heading > span.active {
  border-color: rgba(66, 190, 139, .44);
  color: #67d8a9;
}

.evolving-progress {
  position: relative;
  height: 8px;
  margin: 9px 0;
  overflow: hidden;
  border: 1px solid rgba(205, 174, 82, .38);
  background: rgba(1, 5, 8, .78);
}

.evolving-progress > span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #267ba0, #d0ad42);
}

.evolving-context__facts span {
  min-width: 0;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
}

.evolving-context__facts strong {
  overflow: hidden;
  color: #dde4e8;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.evolving-context__facts small {
  color: #84929c;
  font-size: 9px;
}

.inventory-editor-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 2px 14px 14px;
}

.inventory-numeric-grid,
.inventory-advanced-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.numeric-stepper {
  display: grid;
  grid-template-columns: 31px minmax(0, 1fr) 31px;
}

.numeric-stepper button {
  border: 1px solid #59616b;
  background: rgba(17, 22, 29, .94);
  color: #e1bd58;
}

.numeric-stepper input {
  border-radius: 0;
  text-align: center;
}

.inventory-color-control {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 31px;
}

.inventory-color-control input[type="color"] {
  width: 34px;
  height: 31px;
  padding: 3px;
  border: 1px solid #59616b;
  border-right: 0;
  border-radius: 2px 0 0 2px;
  background: rgba(6, 10, 14, .9);
}

.inventory-color-control input[type="number"] {
  border-radius: 0;
}

.inventory-color-control button {
  border: 1px solid #59616b;
  border-left: 0;
  border-radius: 0 2px 2px 0;
  background: rgba(17, 22, 29, .94);
  color: #aab3bc;
}

.inventory-color-control button:disabled {
  color: #56616a;
}

.instance-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 10px;
  border: 1px solid var(--inventory-line);
  background: rgba(4, 9, 14, .45);
}

.shared-bank-context {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(72, 131, 162, .31);
  background: rgba(13, 40, 53, .32);
}

.shared-bank-context > i {
  color: #69a9c7;
  font-size: 18px;
}

.shared-bank-context > div {
  display: flex;
  flex-direction: column;
}

.shared-bank-context strong {
  color: #d7e5eb;
  font-size: 10px;
}

.shared-bank-context span {
  color: #8ea0aa;
  font-size: 9px;
}

.inventory-operation-context {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  margin: 0 14px 10px;
  padding: 8px 10px;
  border: 1px solid rgba(91, 148, 176, .35);
  background: rgba(13, 42, 55, .3);
}

.inventory-operation-context--inline {
  margin: 7px 0 0;
}

.inventory-operation-context--blocked {
  border-color: rgba(205, 79, 79, .42);
  background: rgba(68, 18, 20, .28);
}

.inventory-operation-context > i {
  color: #6cb0cc;
  font-size: 16px;
}

.inventory-operation-context--blocked > i {
  color: #dc7676;
}

.inventory-operation-context > div {
  display: flex;
  flex-direction: column;
}

.inventory-operation-context strong {
  color: #dce6eb;
  font-size: 10px;
}

.inventory-operation-context span {
  color: #8fa1ab;
  font-size: 9px;
}

.instance-toggle-row div {
  display: flex;
  flex-direction: column;
}

.instance-toggle-row strong {
  color: #dce1e6;
  font-size: 11px;
}

.instance-toggle-row span {
  color: #8d9aa6;
  font-size: 9px;
}

.eq-switch {
  width: 39px;
  height: 20px;
  padding: 2px;
  border: 1px solid #6f7881;
  border-radius: 2px;
  background: #12171d;
}

.eq-switch span {
  width: 14px;
  height: 14px;
  display: block;
  background: #66717a;
  transition: transform .15s ease, background .15s ease;
}

.eq-switch.active {
  border-color: #b49136;
  background: rgba(123, 91, 17, .2);
}

.eq-switch.active span {
  transform: translateX(17px);
  background: #d6aa38;
}

.augment-editor {
  border: 1px solid rgba(144, 123, 66, .32);
}

.augment-editor-title {
  padding: 8px 10px;
  border-bottom: 1px solid var(--inventory-line);
  background: rgba(28, 25, 17, .45);
}

.augment-editor-title > div {
  display: flex;
  flex-direction: column;
}

.augment-editor-title > span {
  color: #a89768;
  font-size: 9px;
}

.augment-row {
  display: grid;
  grid-template-columns: 85px minmax(0, 1fr) 30px;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 5px 8px;
  border-bottom: 1px solid rgba(135, 149, 162, .13);
}

.augment-row:last-child {
  border-bottom: 0;
}

.augment-socket {
  color: #c2a654;
  font-size: 9px;
  text-transform: uppercase;
}

.augment-choice {
  min-height: 30px;
  border: 1px solid rgba(135, 148, 160, .25);
  background: rgba(5, 10, 15, .65);
  color: #b8c0c8;
  text-align: left;
  font-size: 10px;
}

.inventory-advanced {
  border: 1px solid rgba(135, 149, 162, .2);
  background: rgba(4, 9, 14, .42);
}

.inventory-advanced summary {
  padding: 8px 10px;
  color: #b8c1c9;
  cursor: pointer;
  font-size: 10px;
  text-transform: uppercase;
}

.inventory-advanced-grid {
  padding: 4px 10px 10px;
}

.inventory-custom-data {
  grid-column: 1 / -1;
}

.audit-reason-field small {
  display: block;
  text-align: right;
}

.inventory-editor-actions {
  gap: 7px;
  padding: 10px 14px;
  border-top: 1px solid var(--inventory-line);
  background: rgba(3, 7, 11, .52);
}

.editor-action-spacer {
  flex: 1;
}

.keyring-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  align-content: start;
  grid-auto-rows: 58px;
  gap: 7px;
  padding: 10px;
}

.keyring-grid > button.key-card {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  min-height: 58px;
  padding: 6px 7px;
  border: 1px solid rgba(132, 151, 164, .21);
  background: rgba(8, 16, 23, .85);
  color: #dce2e8;
  text-align: left;
}

.key-card .item-sprite {
  width: 34px;
  height: 34px;
}

.key-card.active {
  border-color: #b89436;
  background: rgba(43, 37, 22, .85);
}

.key-card > span:nth-child(2) {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.key-card small {
  color: #8e9ba6;
}

.key-context-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin: 10px 14px;
  padding: 10px;
  border: 1px solid rgba(151, 127, 63, .3);
  background: rgba(31, 26, 16, .35);
}

.key-context-card > i {
  color: #c6a448;
  font-size: 20px;
}

.key-context-card div {
  display: flex;
  flex-direction: column;
}

.key-context-card span {
  color: #98a4ae;
  font-size: 10px;
}

.key-context-card a {
  color: #e0bd56;
  font-size: 10px;
}

.key-editor > .audit-reason-field {
  margin: 12px 14px;
}

.readonly-badge {
  padding: 5px 8px;
  border: 1px solid rgba(145, 157, 168, .27);
  color: #a5b0b9;
  font-size: 9px;
  text-transform: uppercase;
}

.snapshot-layout {
  display: grid;
  grid-template-columns: minmax(235px, .42fr) minmax(0, 1fr);
  gap: 12px;
  min-height: 420px;
}

.snapshot-list {
  padding: 8px;
}

.snapshot-list > button {
  width: 100%;
  min-height: 58px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  margin-bottom: 6px;
  padding: 8px 9px;
  border: 1px solid rgba(132, 151, 164, .2);
  background: rgba(7, 14, 20, .8);
  color: #b9c2ca;
  text-align: left;
}

.snapshot-list > button.active {
  border-color: #b18d35;
  background: rgba(45, 38, 21, .83);
}

.snapshot-list > button span {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.snapshot-list strong {
  color: #dce1e5;
}

.snapshot-list small {
  color: #8f9ba5;
}

.snapshot-preview {
  display: flex;
  flex-direction: column;
}

.snapshot-preview-heading {
  min-height: 55px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--inventory-line);
}

.snapshot-preview-heading div {
  display: flex;
  flex-direction: column;
}

.snapshot-preview-heading > span {
  color: #d2ad45;
}

.snapshot-item-list {
  overflow: auto;
  max-height: 520px;
  padding: 8px;
}

.snapshot-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  min-height: 48px;
  padding: 5px 7px;
  border-bottom: 1px solid rgba(134, 148, 160, .14);
}

.snapshot-item .item-sprite {
  width: 32px;
  height: 32px;
}

.snapshot-item > span:nth-child(2) {
  display: flex;
  flex-direction: column;
}

.snapshot-item strong {
  color: #dce1e5;
}

.snapshot-item small {
  color: #8d9aa5;
}

.snapshot-state {
  flex: 1;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a1ab;
  text-align: center;
}

.snapshot-state > i {
  color: #aa8b3c;
  font-size: 24px;
}

.snapshot-state--error {
  color: #df8484;
}

.item-lookup-search {
  margin-bottom: 10px;
}

.lookup-context {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(179, 145, 57, .34);
  background: rgba(55, 42, 14, .25);
  color: #b7aea0;
  font-size: 11px;
}

.lookup-context i {
  color: #d1aa3f;
}

.item-lookup-results {
  max-height: 430px;
  overflow: auto;
  border: 1px solid rgba(136, 150, 162, .24);
  background: rgba(4, 9, 14, .7);
}

.item-lookup-result {
  width: 100%;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  min-height: 61px;
  padding: 8px 10px;
  border: 0;
  border-bottom: 1px solid rgba(136, 150, 162, .16);
  background: transparent;
  color: #d9dfe4;
  text-align: left;
}

.item-lookup-result:hover,
.item-lookup-result:focus-visible {
  background: rgba(174, 139, 43, .14);
}

.item-lookup-result > span:nth-child(2) {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.item-lookup-result small {
  color: #909da8;
}

.lookup-state {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #8f9ba6;
}

.lookup-state--error {
  color: #df7d7d;
}

.guarded-delete {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guarded-delete-warning {
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(199, 66, 66, .38);
  background: rgba(75, 18, 18, .25);
}

.guarded-delete-warning > i {
  color: #dd6e6e;
  font-size: 18px;
}

.guarded-delete-warning div {
  display: flex;
  flex-direction: column;
}

.guarded-delete-warning span {
  color: #bfa7a7;
  font-size: 11px;
}

.guarded-delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1280px) {
  .inventory-layout--editing,
  .keyring-layout--editing {
    grid-template-columns: minmax(280px, .82fr) minmax(350px, 1.18fr);
  }

  .inventory-layout--editing .inventory-grid {
    grid-template-columns: 1fr;
  }

  .inventory-scope-filter {
    max-width: 430px;
    overflow-x: auto;
  }
}

@media (max-width: 960px) {
  .inventory-mode-tabs {
    padding-inline: 9px;
  }

  .spire-editor-section-heading,
  .section-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .inventory-layout--editing,
  .keyring-layout--editing,
  .snapshot-layout {
    grid-template-columns: 1fr;
  }

  .inventory-editor {
    order: -1;
  }

  .snapshot-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 7px;
  }

  .snapshot-list > button {
    margin: 0;
  }
}

@media (max-width: 640px) {
  .inventory-character-filter {
    grid-template-columns: repeat(5, minmax(58px, 1fr));
    overflow-x: auto;
  }

  .inventory-mode-tabs button {
    gap: 4px;
    font-size: 11px;
  }

  .inventory-mode-tabs button i {
    display: none;
  }

  .inventory-scope-filter {
    width: 100%;
  }

  .inventory-scope-filter button {
    flex: 1;
    padding-inline: 7px;
  }

  .item-recognition,
  .key-context-card {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .item-recognition > button,
  .key-context-card > a {
    grid-column: 1 / -1;
  }

  .inventory-numeric-grid,
  .inventory-advanced-grid {
    grid-template-columns: 1fr;
  }

  .inventory-custom-data {
    grid-column: auto;
  }
}
</style>
