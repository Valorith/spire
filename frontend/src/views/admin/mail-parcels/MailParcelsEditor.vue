<template>
  <content-area class="spire-editor-page mail-parcels-editor-page">
    <div class="spire-editor-toolbar">
      <div>
        <div class="spire-editor-kicker">Admin · player services</div>
        <h1 class="spire-editor-title">
          <i class="ra ra-feather-wing mr-2"></i>Mail &amp; Parcels
        </h1>
        <p class="spire-editor-subtitle">
          Resolve player deliveries with human-readable recipients, item context, guarded writes, and a complete audit trail.
        </p>
      </div>
      <div class="spire-editor-summary" aria-label="Mail and parcels summary">
        <span><strong>{{ summary.mail_count.toLocaleString() }}</strong> mail</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ summary.parcel_count.toLocaleString() }}</strong> parcels</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ summary.container_count.toLocaleString() }}</strong> packed items</span>
      </div>
    </div>

    <div class="mail-parcels-mode-switch" role="tablist" aria-label="Delivery workspace">
      <button
        v-for="option in modeOptions"
        :key="option.value"
        type="button"
        role="tab"
        :aria-selected="mode === option.value"
        :class="{ active: mode === option.value }"
        @click="setMode(option.value)"
      >
        <i :class="option.icon"></i>
        <span>
          <strong>{{ option.label }}</strong>
          <small>{{ option.help }}</small>
        </span>
        <b>{{ option.value === 'mail' ? summary.mail_count : summary.parcel_count }}</b>
      </button>
    </div>

    <div class="mail-parcels-command-bar" aria-label="Administrative delivery actions">
      <div>
        <span class="spire-editor-kicker">GM delivery desk</span>
        <strong>Compose new player deliveries</strong>
        <small>Every send is validated, confirmed, and written to the same immutable tool audit trail.</small>
      </div>
      <div class="mail-parcels-command-bar__actions">
        <b-button size="sm" variant="outline-warning" data-testid="open-gm-mail" @click="openGMMailComposer">
          <i class="ra ra-feather-wing mr-1"></i>Send GM mail
        </b-button>
        <b-button size="sm" variant="outline-warning" data-testid="open-gm-parcels" @click="openGMParcelComposer">
          <i class="ra ra-wooden-box mr-1"></i>Send GM parcels
        </b-button>
      </div>
    </div>

    <div class="spire-editor-workspace">
      <aside class="spire-editor-directory">
        <eq-window :title="mode === 'mail' ? 'Mailbox Messages' : 'Queued Parcels'">
          <div class="spire-editor-directory-controls">
            <div class="spire-editor-search">
              <i class="fa fa-search"></i>
              <input
                :id="'mail-parcels-' + mode + '-directory-search'"
                v-model.trim="search"
                class="form-control form-control-sm"
                :placeholder="mode === 'mail' ? 'Search subject, sender, recipient, or ID…' : 'Search recipient, item, sender, or ID…'"
                @input="queueDirectorySearch"
                @keyup.enter="loadDirectory(1)"
              >
              <button
                v-if="search"
                class="spire-editor-search-clear"
                type="button"
                aria-label="Clear search"
                @click="clearSearch"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <div class="mail-parcels-directory-actions">
              <b-button
                size="sm"
                variant="outline-secondary"
                data-testid="refresh-delivery-directory"
                :aria-label="'Refresh ' + (mode === 'mail' ? 'mailbox messages' : 'queued parcels')"
                :title="'Refresh ' + (mode === 'mail' ? 'mailbox messages' : 'queued parcels')"
                :disabled="loadingDirectory || loadingDetail"
                @click="refreshDirectory"
              >
                <i :class="loadingDirectory ? 'fa fa-spinner fa-spin' : 'fa fa-refresh'" aria-hidden="true"></i>
              </b-button>
              <b-button size="sm" variant="outline-warning" @click="createDraft">
                <i class="fa fa-plus mr-1"></i>New
              </b-button>
            </div>
          </div>

          <div v-if="mode === 'mail'" class="spire-editor-filter" role="group" aria-label="Mail status filter">
            <button
              v-for="option in mailStatusFilters"
              :key="option.value"
              type="button"
              :class="{ active: statusFilter === option.value }"
              @click="setStatusFilter(option.value)"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="spire-editor-directory-meta">
            <span>{{ totalRecords.toLocaleString() }} records</span>
            <span v-if="loadingDirectory"><i class="fa fa-spinner fa-spin mr-1"></i>Refreshing</span>
            <span v-else>Page {{ currentPage }}</span>
          </div>

          <div class="spire-editor-directory-list" data-testid="mail-parcels-directory">
            <button
              v-for="record in records"
              :key="mode + '-' + recordKey(record)"
              class="spire-editor-directory-row"
              :class="{ active: Number(selectedId) === Number(recordKey(record)) && !isCreating }"
              type="button"
              @click="selectRecord(recordKey(record))"
            >
              <span class="spire-editor-directory-icon">
                <template v-if="mode === 'mail'">
                  <i :class="mailStatusIcon(record.status)"></i>
                </template>
                <template v-else>
                  <span v-if="record.item_icon" :class="'item-' + record.item_icon + '-sm'"></span>
                  <i v-else class="ra ra-wooden-box"></i>
                </template>
              </span>
              <span class="spire-editor-directory-body">
                <span class="spire-editor-directory-name">
                  {{ mode === 'mail' ? (record.subject || '(No subject)') : record.item_name }}
                </span>
                <span class="spire-editor-directory-detail">
                  <template v-if="mode === 'mail'">
                    {{ record.character_name }} · from {{ record.from || 'Unknown' }} · {{ formatUnix(record.timestamp) }}
                  </template>
                  <template v-else>
                    {{ record.character_name }} · qty {{ record.quantity }} · {{ formatParcelDate(record.sent_date, record.sent_timestamp) }}
                  </template>
                </span>
                <span
                  class="delivery-status-chip"
                  :class="mode === 'mail' ? mailStatusClass(record.status) : 'delivery-status-chip--queued'"
                  :aria-label="mode === 'mail' ? 'Mailbox status: ' + mailStatusLabel(record.status) : 'Parcel status: queued for pickup'"
                >
                  <i :class="mode === 'mail' ? mailStatusIcon(record.status) : 'fa fa-clock-o'" aria-hidden="true"></i>
                  {{ mode === 'mail' ? mailStatusLabel(record.status) : 'Queued for pickup' }}
                </span>
              </span>
              <span class="spire-editor-directory-aside">#{{ recordKey(record) }}</span>
            </button>

            <div v-if="directoryError" class="spire-editor-directory-state spire-editor-directory-state--error">
              <i class="fa fa-exclamation-triangle"></i>
              <span>{{ directoryError }}</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="loadDirectory(currentPage)">Retry</button>
            </div>
            <div v-else-if="loadingDirectory && !records.length" class="spire-editor-directory-state">
              <i class="fa fa-spinner fa-spin"></i>
              <span>Loading {{ mode === 'mail' ? 'mail' : 'parcels' }}…</span>
            </div>
            <div v-else-if="!records.length" class="spire-editor-directory-state">
              <i :class="mode === 'mail' ? 'ra ra-feather-wing' : 'ra ra-wooden-box'"></i>
              <span>No matching {{ mode === 'mail' ? 'messages' : 'parcels' }}</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="createDraft">
                Create {{ mode === 'mail' ? 'message' : 'parcel' }}
              </button>
            </div>
          </div>

          <nav v-if="totalPages > 1" class="spire-editor-pagination" :aria-label="mode + ' directory pages'">
            <button
              type="button"
              aria-label="Previous page"
              :disabled="currentPage <= 1 || loadingDirectory"
              @click="loadDirectory(currentPage - 1)"
            >
              <i class="fa fa-angle-left"></i>
            </button>
            <span><strong>{{ currentPage }}</strong> / {{ totalPages }}</span>
            <button
              type="button"
              aria-label="Next page"
              :disabled="currentPage >= totalPages || loadingDirectory"
              @click="loadDirectory(currentPage + 1)"
            >
              <i class="fa fa-angle-right"></i>
            </button>
          </nav>
        </eq-window>
      </aside>

      <main class="spire-editor-inspector">
        <eq-window v-if="directoryError && !editModel" title="Delivery Workspace">
          <div class="spire-editor-empty spire-editor-empty--error">
            <div class="spire-editor-empty__sigil"><i class="fa fa-exclamation-triangle"></i></div>
            <h3>Delivery data is unavailable</h3>
            <p>{{ directoryError }}</p>
            <b-button size="sm" variant="outline-warning" @click="loadDirectory(currentPage)">
              <i class="fa fa-refresh mr-1"></i>Retry
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="loadingDetail" title="Delivery Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading player delivery context…</h3>
          </div>
        </eq-window>

        <eq-window v-else-if="!editModel" title="Delivery Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil">
              <i :class="mode === 'mail' ? 'ra ra-feather-wing' : 'ra ra-wooden-box'"></i>
            </div>
            <h3>Select {{ mode === 'mail' ? 'a message' : 'a parcel' }}</h3>
            <p>
              {{ mode === 'mail'
                ? 'Read its contents, resolve the recipient, and safely manage delivery state.'
                : 'Inspect the item, recipient, augments, container contents, and pickup context.' }}
            </p>
            <b-button size="sm" variant="outline-warning" @click="createDraft">
              <i class="fa fa-plus mr-1"></i>Create new
            </b-button>
          </div>
        </eq-window>

        <div v-else data-testid="mail-parcels-inspector">
          <eq-window :title="mode === 'mail' ? 'Mailbox Message' : 'Queued Parcel'" class="mb-2">
            <div class="spire-editor-header">
              <div class="spire-editor-identity">
                <span class="spire-editor-identity-icon">
                  <template v-if="mode === 'parcels' && selectedItem && selectedItem.icon">
                    <span :class="'item-' + selectedItem.icon"></span>
                  </template>
                  <i v-else :class="mode === 'mail' ? mailStatusIcon(editModel.status) : 'ra ra-wooden-box'"></i>
                </span>
                <div>
                  <div class="spire-editor-eyebrow">
                    {{ isCreating ? 'New ' + (mode === 'mail' ? 'message' : 'parcel') : identityLabel }}
                    <span v-if="hasUnsavedChanges" class="spire-editor-unsaved">
                      <i class="fa fa-circle"></i> Unsaved
                    </span>
                  </div>
                  <h2>{{ identityTitle }}</h2>
                  <p>{{ identitySubtitle }}</p>
                  <span
                    v-if="!isCreating"
                    class="delivery-status-chip delivery-status-chip--header"
                    :class="mode === 'mail' ? mailStatusClass(editModel.status) : 'delivery-status-chip--queued'"
                  >
                    <i :class="mode === 'mail' ? mailStatusIcon(editModel.status) : 'fa fa-clock-o'" aria-hidden="true"></i>
                    {{ mode === 'mail' ? mailStatusLabel(editModel.status) : 'Queued for pickup' }}
                  </span>
                </div>
              </div>
              <div class="spire-editor-actions">
                <b-button
                  v-if="mode === 'mail' && !isCreating"
                  size="sm"
                  variant="outline-warning"
                  @click="copyMailDraft"
                >
                  <i class="fa fa-copy mr-1"></i>Copy
                </b-button>
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-danger"
                  :disabled="operationBusy"
                  @click="openDeleteModal(mode === 'mail' ? 'mail' : 'parcel')"
                >
                  <i class="fa fa-trash mr-1"></i>Delete
                </b-button>
                <b-button
                  size="sm"
                  variant="outline-warning"
                  :disabled="!canSave || operationBusy"
                  @click="openSaveModal"
                >
                  <i :class="operationBusy ? 'fa fa-spinner fa-spin mr-1' : 'fa fa-save mr-1'"></i>
                  {{ primaryActionLabel }}
                </b-button>
              </div>
            </div>
          </eq-window>

          <eq-window title="Workspace">
            <div class="spire-editor-tabs" role="tablist" :aria-label="mode + ' editor sections'">
              <button
                v-for="tab in tabs"
                :key="tab"
                type="button"
                role="tab"
                :aria-selected="selectedTab === tab"
                :class="{ active: selectedTab === tab }"
                @click="selectTab(tab)"
              >
                {{ tab }}
                <span v-if="tab === 'Contents'" class="tab-count">{{ parcelContent.length }}</span>
              </button>
            </div>

            <section v-if="mode === 'mail' && selectedTab === 'Message'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Message</div>
                  <h3>Player-visible content</h3>
                </div>
                <p>Subject and body render directly in the EverQuest mailbox.</p>
              </div>

              <div class="spire-editor-field">
                <label for="mail-parcels-mail-subject">Subject</label>
                <input
                  id="mail-parcels-mail-subject"
                  v-model="editModel.subject"
                  class="form-control form-control-sm"
                  maxlength="200"
                  placeholder="Concise mailbox subject…"
                >
                <span class="spire-editor-field-help">{{ editModel.subject.length }}/200 characters</span>
              </div>
              <div class="spire-editor-field mt-3">
                <label for="mail-parcels-mail-body">Body</label>
                <textarea
                  id="mail-parcels-mail-body"
                  v-model="editModel.body"
                  class="form-control mail-body"
                  rows="12"
                  placeholder="Write the player-visible message…"
                ></textarea>
              </div>

              <div class="mail-client-preview">
                <div class="mail-client-preview__top">
                  <span><i class="ra ra-feather-wing mr-1"></i>Client preview</span>
                  <span>{{ mailStatusLabel(editModel.status) }}</span>
                </div>
                <h4>{{ editModel.subject || '(No subject)' }}</h4>
                <div class="mail-client-preview__meta">
                  From {{ editModel.from || 'Unknown sender' }} · To {{ selectedCharacterName }}
                </div>
                <p>{{ editModel.body || 'Message body preview.' }}</p>
              </div>
            </section>

            <section v-if="mode === 'mail' && selectedTab === 'Delivery'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Delivery</div>
                  <h3>Recipient, sender, and mailbox state</h3>
                </div>
                <p>Status values follow the live UCS mail protocol.</p>
              </div>

              <div class="delivery-layout">
                <div>
                  <div class="spire-editor-field">
                    <label for="mail-parcels-mail-recipient-search">Recipient character</label>
                    <div class="spire-editor-search">
                      <i class="fa fa-search"></i>
                      <input
                        id="mail-parcels-mail-recipient-search"
                        v-model="characterSearch"
                        class="form-control form-control-sm"
                        placeholder="Search character name or exact ID…"
                        @input="queueCharacterSearch"
                      >
                    </div>
                  </div>
                  <div v-if="characterResults.length" class="reference-results">
                    <button
                      v-for="character in characterResults"
                      :key="'mail-character-' + character.id"
                      type="button"
                      @click="selectCharacter(character)"
                    >
                      <span><strong>{{ character.name }}</strong><small>Level {{ character.level }} · #{{ character.id }}</small></span>
                      <span>{{ character.mail_count }} mail</span>
                    </button>
                  </div>
                  <div v-if="selectedCharacter" class="selected-reference-card">
                    <span class="selected-reference-card__icon"><i class="ra ra-player"></i></span>
                    <span>
                      <strong>{{ selectedCharacter.name }}</strong>
                      <small>
                        Character #{{ selectedCharacter.id }} · level {{ selectedCharacter.level || '—' }}
                      </small>
                    </span>
                    <button type="button" aria-label="Change recipient" @click="focusCharacterSearch">
                      <i class="fa fa-pencil"></i>
                    </button>
                  </div>
                </div>

                <div class="mail-delivery-form">
                  <div class="spire-editor-grid spire-editor-grid--two">
                    <div class="spire-editor-field">
                      <label for="mail-parcels-mail-from">From</label>
                      <input
                        id="mail-parcels-mail-from"
                        v-model="editModel.from"
                        class="form-control form-control-sm"
                        maxlength="100"
                        placeholder="Server Staff"
                      >
                      <span class="spire-editor-field-help">Client-visible sender; system names are allowed.</span>
                    </div>
                    <div class="spire-editor-field">
                      <label for="mail-parcels-mail-to-line">Visible recipient line</label>
                      <input
                        id="mail-parcels-mail-to-line"
                        v-model="editModel.to"
                        class="form-control form-control-sm"
                        placeholder="Defaults to selected character"
                      >
                      <span class="spire-editor-field-help">UCS uses this text in the message header.</span>
                    </div>
                    <div class="spire-editor-field">
                      <label for="mail-parcels-mail-sent-at">Sent at</label>
                      <input
                        id="mail-parcels-mail-sent-at"
                        v-model="mailSentAt"
                        class="form-control form-control-sm"
                        type="datetime-local"
                        step="1"
                      >
                    </div>
                  </div>
                </div>
              </div>

              <div class="status-editor">
                <div>
                  <span class="context-label">Mailbox status</span>
                  <strong>{{ mailStatusLabel(editModel.status) }}</strong>
                  <small>Status 0 is intentionally unavailable because UCS interprets it as immediate deletion.</small>
                </div>
                <div class="status-editor__options" role="radiogroup" aria-label="Mailbox status">
                  <button
                    v-for="option in mailStatusOptions"
                    :key="option.value"
                    type="button"
                    role="radio"
                    :aria-checked="Number(editModel.status) === option.value"
                    :class="{ active: Number(editModel.status) === option.value }"
                    @click="editModel.status = option.value"
                  >
                    <i :class="option.icon"></i>{{ option.label }}
                  </button>
                  <button
                    v-if="isUnknownMailStatus(editModel.status)"
                    type="button"
                    class="active legacy"
                    role="radio"
                    aria-checked="true"
                  >
                    <i class="fa fa-question-circle"></i>Legacy {{ editModel.status }}
                  </button>
                </div>
              </div>
            </section>

            <section v-if="mode === 'parcels' && selectedTab === 'Package'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Package</div>
                  <h3>Delivered item and item state</h3>
                </div>
                <p>Item and augment selectors use authoritative item records while preserving legacy values.</p>
              </div>

              <div class="parcel-package-layout">
                <div>
                  <div class="spire-editor-field">
                    <label>Parcel item</label>
                    <div class="parcel-item-selection" data-testid="parcel-item-selection">
                      <button
                        class="parcel-item-selection__main"
                        type="button"
                        :aria-label="selectedItem ? 'Change parcel item. Current item: ' + selectedItem.name : 'Choose parcel item'"
                        @click="openItemLookup('parcel', -1)"
                      >
                        <span class="parcel-item-selection__icon">
                          <span v-if="selectedItem && selectedItem.icon" :class="'item-' + selectedItem.icon"></span>
                          <i v-else class="ra ra-wooden-box"></i>
                        </span>
                        <span class="parcel-item-selection__identity">
                          <span class="context-label">{{ selectedItem ? 'Selected item' : 'Parcel item' }}</span>
                          <strong>{{ selectedItem ? selectedItem.name : (editModel.item_name || 'Choose an item') }}</strong>
                          <small>{{ editModel.item_id ? 'Item #' + editModel.item_id : 'Search by name or exact ID' }}</small>
                        </span>
                        <span class="parcel-item-selection__change">
                          <i class="fa fa-search" aria-hidden="true"></i>
                          {{ selectedItem ? 'Change' : 'Choose' }}
                        </span>
                      </button>

                      <div v-if="selectedItem" class="parcel-item-selection__context">
                        <div class="parcel-item-selection__traits" aria-label="Selected item properties">
                          <span>
                            <i class="fa fa-cubes" aria-hidden="true"></i>
                            {{ selectedItem.stackable ? 'Stacks to ' + selectedItem.stack_size : 'Single item' }}
                          </span>
                          <span>
                            <i class="fa fa-archive" aria-hidden="true"></i>
                            {{ selectedItem.bag_slots ? selectedItem.bag_slots + ' container slots' : 'Not a container' }}
                          </span>
                          <span :class="{ warning: selectedItem.no_drop === 0 }">
                            <i :class="selectedItem.no_drop === 0 ? 'fa fa-lock' : 'fa fa-unlock-alt'" aria-hidden="true"></i>
                            {{ selectedItem.no_drop === 0 ? 'No-drop' : 'Droppable' }}
                          </span>
                        </div>
                        <button type="button" @click="openItemEditor(selectedItem.id)">
                          <i class="fa fa-external-link mr-1"></i>Open in Item Editor
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-if="selectedItem && selectedItem.no_drop === 0" class="spire-editor-callout spire-editor-callout--warning">
                    <i class="fa fa-exclamation-triangle"></i>
                    <span>This is a no-drop item. EQEmu blocks players from mailing it normally; an audited administrative delivery can still be used for recovery.</span>
                  </div>

                  <div class="spire-editor-grid spire-editor-grid--three mt-3">
                    <div class="spire-editor-field">
                      <label for="mail-parcels-quantity">{{ isMoneyParcel ? 'Money amount' : 'Quantity / charges' }}</label>
                      <input
                        id="mail-parcels-quantity"
                        v-model.number="editModel.quantity"
                        class="form-control form-control-sm"
                        type="number"
                        min="1"
                      >
                      <span class="spire-editor-field-help">{{ isMoneyParcel ? 'Stored as raw copper value.' : 'Stacks use quantity; charged items use charges.' }}</span>
                    </div>
                    <div class="spire-editor-field">
                      <label for="mail-parcels-slot">Mailbox slot</label>
                      <input
                        id="mail-parcels-slot"
                        v-model.number="editModel.slot_id"
                        class="form-control form-control-sm"
                        type="number"
                        min="0"
                        :max="summary.parcel_capacity"
                      >
                      <span class="spire-editor-field-help">Use 0 to choose the first free slot automatically.</span>
                    </div>
                  </div>
                </div>

                <div class="parcel-preview">
                  <span class="context-label">Delivery preview</span>
                  <div class="parcel-preview__item">
                    <span>
                      <span v-if="selectedItem && selectedItem.icon" :class="'item-' + selectedItem.icon"></span>
                      <i v-else class="ra ra-wooden-box"></i>
                    </span>
                    <div>
                      <h4>{{ selectedItem ? selectedItem.name : (editModel.item_name || 'No item selected') }}</h4>
                      <p>{{ isMoneyParcel ? Number(editModel.quantity || 0).toLocaleString() + ' copper' : 'Quantity ' + Number(editModel.quantity || 0).toLocaleString() }}</p>
                    </div>
                  </div>
                  <dl>
                    <div><dt>Recipient</dt><dd>{{ selectedCharacterName }}</dd></div>
                    <div><dt>Sender</dt><dd>{{ editModel.from_name || 'Not set' }}</dd></div>
                    <div><dt>Slot</dt><dd>{{ editModel.slot_id || 'Automatic' }}</dd></div>
                    <div><dt>Contents</dt><dd>{{ parcelContent.length }}</dd></div>
                  </dl>
                </div>
              </div>

              <div class="augment-section">
                <div class="augment-section__heading">
                  <div>
                    <span class="context-label">Augments</span>
                    <strong>Installed item augments</strong>
                  </div>
                  <small>Empty slots remain 0 in the database.</small>
                </div>
                <div class="augment-grid">
                  <button
                    v-for="index in 6"
                    :key="'parcel-augment-' + index"
                    type="button"
                    @click="openItemLookup('parcel-augment', index - 1)"
                  >
                    <span class="augment-slot">{{ index }}</span>
                    <span>
                      <strong>{{ augmentRefs[index - 1] ? augmentRefs[index - 1].name : 'Empty' }}</strong>
                      <small>{{ parcelAugmentValue(index - 1) ? 'Item #' + parcelAugmentValue(index - 1) : 'Choose augment' }}</small>
                    </span>
                    <i class="fa fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </section>

            <section v-if="mode === 'parcels' && selectedTab === 'Contents'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Container contents</div>
                  <h3>Items packed inside this parcel</h3>
                </div>
                <b-button
                  size="sm"
                  variant="outline-warning"
                  :disabled="isCreating || !canAddContainerContent"
                  @click="openContentModal()"
                >
                  <i class="fa fa-plus mr-1"></i>Add item
                </b-button>
              </div>

              <div v-if="isCreating" class="spire-editor-callout">
                <i class="fa fa-info-circle"></i>
                <span>Save the parcel before adding container contents.</span>
              </div>
              <div v-else-if="!canAddContainerContent && !parcelContent.length" class="spire-editor-callout spire-editor-callout--warning">
                <i class="fa fa-exclamation-triangle"></i>
                <span>The selected parcel item is not a container. Choose a container item before packing contents.</span>
              </div>
              <div v-else-if="!parcelContent.length" class="parcel-content-empty">
                <i class="ra ra-wooden-box"></i>
                <h4>This container is empty</h4>
                <p>Add items only when the selected parcel item has container slots.</p>
                <b-button v-if="canAddContainerContent" size="sm" variant="outline-warning" @click="openContentModal()">
                  Add first item
                </b-button>
              </div>
              <div v-else class="parcel-content-list">
                <button
                  v-for="content in parcelContent"
                  :key="'parcel-content-' + content.id"
                  type="button"
                  @click="openContentModal(content)"
                >
                  <span class="parcel-content-list__slot">{{ Number(content.slot_id) + 1 }}</span>
                  <span class="parcel-content-list__icon">
                    <span v-if="content.item_icon" :class="'item-' + content.item_icon + '-sm'"></span>
                    <i v-else class="ra ra-wooden-box"></i>
                  </span>
                  <span>
                    <strong>{{ content.item_name }}</strong>
                    <small>Item #{{ content.item_id }} · quantity {{ content.quantity }}<template v-if="content.item_no_drop === 0"> · No-drop</template></small>
                  </span>
                  <i class="fa fa-chevron-right"></i>
                </button>
              </div>
            </section>

            <section v-if="mode === 'parcels' && selectedTab === 'Delivery'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Delivery</div>
                  <h3>Recipient and pickup context</h3>
                </div>
                <p>Recipient-slot uniqueness is rechecked inside the database transaction.</p>
              </div>

              <div class="delivery-layout">
                <div>
                  <div class="spire-editor-field">
                    <label for="mail-parcels-parcel-recipient-search">Recipient character</label>
                    <div class="spire-editor-search">
                      <i class="fa fa-search"></i>
                      <input
                        id="mail-parcels-parcel-recipient-search"
                        v-model="characterSearch"
                        class="form-control form-control-sm"
                        placeholder="Search character name or exact ID…"
                        @input="queueCharacterSearch"
                      >
                    </div>
                  </div>
                  <div v-if="characterResults.length" class="reference-results">
                    <button
                      v-for="character in characterResults"
                      :key="'parcel-character-' + character.id"
                      type="button"
                      @click="selectCharacter(character)"
                    >
                      <span><strong>{{ character.name }}</strong><small>Level {{ character.level }} · #{{ character.id }}</small></span>
                      <span>{{ character.parcel_count }}/{{ summary.parcel_capacity }} parcels</span>
                    </button>
                  </div>
                  <div v-if="selectedCharacter" class="selected-reference-card">
                    <span class="selected-reference-card__icon"><i class="ra ra-player"></i></span>
                    <span>
                      <strong>{{ selectedCharacter.name }}</strong>
                      <small>
                        Character #{{ selectedCharacter.id }} · {{ selectedCharacter.parcel_count || 0 }}/{{ summary.parcel_capacity }} parcels
                      </small>
                    </span>
                    <button type="button" aria-label="Change recipient" @click="focusCharacterSearch">
                      <i class="fa fa-pencil"></i>
                    </button>
                  </div>
                </div>

                <div class="spire-editor-grid spire-editor-grid--two">
                  <div class="spire-editor-field">
                    <label for="mail-parcels-from-name">Sender name</label>
                    <input
                      id="mail-parcels-from-name"
                      v-model="editModel.from_name"
                      class="form-control form-control-sm"
                      maxlength="64"
                      placeholder="Server Staff"
                    >
                    <span class="spire-editor-field-help">Display text only; it does not remove an item from this character.</span>
                  </div>
                  <div class="spire-editor-field">
                    <label for="mail-parcels-sent-date">Sent at</label>
                    <input
                      id="mail-parcels-sent-date"
                      v-model="parcelSentAt"
                      class="form-control form-control-sm"
                      type="datetime-local"
                      step="1"
                    >
                  </div>
                  <div class="spire-editor-field spire-editor-grid-span">
                    <label for="mail-parcels-note">Player-visible note</label>
                    <textarea
                      id="mail-parcels-note"
                      v-model="editModel.note"
                      class="form-control"
                      rows="5"
                      maxlength="1024"
                      placeholder="Add delivery or recovery context…"
                    ></textarea>
                    <span class="spire-editor-field-help">{{ editModel.note.length }}/1,024 characters</span>
                  </div>
                </div>
              </div>

              <div class="delivery-safety">
                <div><i class="fa fa-database"></i></div>
                <div>
                  <span class="context-label">Administrative delivery behavior</span>
                  <h4>Queued directly for parcel pickup</h4>
                  <p>
                    This editor writes a parcel record but does not remove an item from the named sender.
                    Online recipients may need to reopen the parcel merchant or relog before it appears.
                  </p>
                </div>
              </div>
            </section>

            <section v-if="selectedTab === 'Audit'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Traceability</div>
                  <h3>Required administrative audit history</h3>
                </div>
                <b-button size="sm" variant="outline-warning" :disabled="isCreating || loadingAudit" @click="loadAudit">
                  <i :class="loadingAudit ? 'fa fa-spinner fa-spin mr-1' : 'fa fa-refresh mr-1'"></i>Refresh
                </b-button>
              </div>

              <div v-if="isCreating" class="spire-editor-callout">
                <i class="fa fa-info-circle"></i>
                <span>Audit history begins when this record is created.</span>
              </div>
              <div v-else-if="loadingAudit && !auditEntries.length" class="audit-state">
                <i class="fa fa-spinner fa-spin"></i>Loading audit history…
              </div>
              <div v-else-if="auditError" class="audit-state audit-state--error">
                <i class="fa fa-exclamation-triangle"></i>{{ auditError }}
              </div>
              <div v-else-if="!auditEntries.length" class="audit-state">
                <i class="fa fa-history"></i>No editor audit events have been recorded yet.
              </div>
              <div v-else class="mail-parcels-audit-list">
                <article v-for="entry in auditEntries" :key="'audit-' + entry.id">
                  <span class="audit-icon"><i :class="auditIcon(entry.event_name)"></i></span>
                  <div>
                    <strong>{{ auditLabel(entry.event_name) }}</strong>
                    <p>{{ entry.data.reason || 'No reason recorded' }}</p>
                    <small>{{ entry.user_name }} · {{ formatDateTime(entry.created_at) }}</small>
                  </div>
                  <span>#{{ entry.id }}</span>
                </article>
              </div>
            </section>
          </eq-window>
        </div>
      </main>
    </div>

    <b-modal
      ref="saveModal"
      modal-class="mail-parcels-editor-modal"
      :title="saveModalTitle"
      hide-footer
      @hidden="operationReason = ''"
    >
      <div class="operation-summary">
        <i :class="mode === 'mail' ? 'ra ra-feather-wing' : 'ra ra-wooden-box'"></i>
        <div>
          <strong>{{ primaryActionLabel }} {{ identityTitle }}</strong>
          <p>{{ saveModalDescription }}</p>
        </div>
      </div>
      <div class="spire-editor-field">
        <label for="mail-parcels-operation-reason">Required audit reason</label>
        <textarea
          id="mail-parcels-operation-reason"
          v-model="operationReason"
          class="form-control"
          rows="3"
          maxlength="240"
          placeholder="Ticket, recovery, moderation, or support reason…"
        ></textarea>
        <span class="spire-editor-field-help">8–240 characters. This is stored in the Spire audit trail.</span>
      </div>
      <div class="modal-actions">
        <b-button size="sm" variant="outline-secondary" @click="$refs.saveModal.hide()">Cancel</b-button>
        <b-button size="sm" variant="outline-warning" :disabled="operationReason.trim().length < 8 || operationBusy" @click="persistRecord">
          <i :class="operationBusy ? 'fa fa-spinner fa-spin mr-1' : 'fa fa-check mr-1'"></i>{{ primaryActionLabel }}
        </b-button>
      </div>
    </b-modal>

    <b-modal
      ref="deleteModal"
      modal-class="mail-parcels-editor-modal"
      :title="deleteModalTitle"
      hide-footer
      @hidden="resetDeleteDraft"
    >
      <div class="danger-heading">
        <i class="fa fa-exclamation-triangle"></i>
        <div>
          <strong>{{ deleteModalTitle }}</strong>
          <span>{{ deleteModalDescription }}</span>
        </div>
      </div>
      <div class="spire-editor-field">
        <label for="mail-parcels-delete-confirmation">Type {{ deleteExpectedConfirmation }} to confirm</label>
        <input
          id="mail-parcels-delete-confirmation"
          v-model="deleteDraft.confirmation"
          class="form-control form-control-sm"
          autocomplete="off"
        >
      </div>
      <div class="spire-editor-field mt-3">
        <label for="mail-parcels-delete-reason">Required audit reason</label>
        <textarea
          id="mail-parcels-delete-reason"
          v-model="deleteDraft.reason"
          class="form-control"
          rows="3"
          maxlength="240"
          placeholder="Why is this player delivery being removed?"
        ></textarea>
      </div>
      <div class="modal-actions">
        <b-button size="sm" variant="outline-secondary" @click="$refs.deleteModal.hide()">Cancel</b-button>
        <b-button size="sm" variant="outline-danger" :disabled="!canDelete || operationBusy" @click="performDelete">
          <i :class="operationBusy ? 'fa fa-spinner fa-spin mr-1' : 'fa fa-trash mr-1'"></i>Delete permanently
        </b-button>
      </div>
    </b-modal>

    <b-modal
      ref="itemLookupModal"
      modal-class="mail-parcels-editor-modal item-lookup-modal"
      title="Choose item"
      hide-footer
      @shown="focusItemLookup"
      @hidden="resetItemLookup"
    >
      <div class="spire-editor-search">
        <i class="fa fa-search"></i>
        <input
          id="mail-parcels-item-lookup"
          v-model="itemSearch"
          class="form-control form-control-sm"
          :placeholder="itemLookup.scope.indexOf('augment') >= 0 ? 'Search augment name or exact item ID…' : 'Search item name or exact ID…'"
          @input="queueItemSearch"
        >
      </div>
      <div v-if="itemLookupCanClear" class="item-lookup-clear">
        <button type="button" @click="clearItemLookupTarget"><i class="fa fa-times mr-1"></i>Clear this augment slot</button>
      </div>
      <div v-if="searchingItems" class="lookup-state"><i class="fa fa-spinner fa-spin mr-1"></i>Searching items…</div>
      <div v-else-if="itemResults.length" class="item-lookup-results">
        <button v-for="item in itemResults" :key="'lookup-item-' + item.id" type="button" @click="selectLookupItem(item)">
          <span class="item-lookup-results__icon">
            <span v-if="item.icon" :class="'item-' + item.icon + '-sm'"></span>
            <i v-else class="ra ra-wooden-box"></i>
          </span>
          <span>
            <strong>{{ item.name }}</strong>
            <small>
              #{{ item.id }} · {{ item.augment_type ? 'Augment type ' + item.augment_type : (item.bag_slots ? item.bag_slots + '-slot container' : 'Item') }}
              · {{ item.no_drop === 0 ? 'No-drop' : 'Droppable' }}
            </small>
          </span>
          <i class="fa fa-chevron-right"></i>
        </button>
      </div>
      <div v-else-if="itemSearchComplete" class="lookup-state">No matching items.</div>
      <div v-else class="lookup-state">Start typing to search the live item catalog.</div>
    </b-modal>

    <b-modal
      ref="contentModal"
      modal-class="mail-parcels-editor-modal content-editor-modal"
      :title="contentDraft.id ? 'Edit packed item' : 'Add packed item'"
      hide-footer
      @hidden="resetContentDraft"
    >
      <div class="spire-editor-grid spire-editor-grid--two">
        <div class="spire-editor-field spire-editor-grid-span">
          <label>Item</label>
          <button class="item-selector" type="button" @click="openItemLookup('content', -1)">
            <span class="item-selector__icon">
              <span v-if="selectedContentItem && selectedContentItem.icon" :class="'item-' + selectedContentItem.icon"></span>
              <i v-else class="ra ra-wooden-box"></i>
            </span>
            <span>
              <strong>{{ selectedContentItem ? selectedContentItem.name : (contentDraft.item_name || 'Choose an item') }}</strong>
              <small>{{ contentDraft.item_id ? 'Item #' + contentDraft.item_id : 'Search by name or exact ID' }}</small>
            </span>
            <i class="fa fa-search"></i>
          </button>
        </div>
        <div class="spire-editor-field">
          <label for="mail-parcels-content-slot">Container slot</label>
          <select id="mail-parcels-content-slot" v-model.number="contentDraft.slot_id" class="form-control form-control-sm">
            <option v-for="slot in containerSlotOptions" :key="'content-slot-' + slot.value" :value="slot.value">
              {{ slot.label }}
            </option>
          </select>
        </div>
        <div class="spire-editor-field">
          <label for="mail-parcels-content-quantity">Quantity / charges</label>
          <input id="mail-parcels-content-quantity" v-model.number="contentDraft.quantity" class="form-control form-control-sm" type="number" min="1">
        </div>
      </div>

      <div class="augment-section augment-section--modal">
        <div class="augment-section__heading">
          <div><span class="context-label">Augments</span><strong>Packed item augments</strong></div>
        </div>
        <div class="augment-grid">
          <button
            v-for="index in 6"
            :key="'content-augment-' + index"
            type="button"
            @click="openItemLookup('content-augment', index - 1)"
          >
            <span class="augment-slot">{{ index }}</span>
            <span>
              <strong>{{ contentAugmentRefs[index - 1] ? contentAugmentRefs[index - 1].name : 'Empty' }}</strong>
              <small>{{ contentAugmentValue(index - 1) ? 'Item #' + contentAugmentValue(index - 1) : 'Choose augment' }}</small>
            </span>
            <i class="fa fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div class="spire-editor-field mt-3">
        <label for="mail-parcels-content-reason">Required audit reason</label>
        <textarea
          id="mail-parcels-content-reason"
          v-model="contentDraft.reason"
          class="form-control"
          rows="3"
          maxlength="240"
          placeholder="Why is this packed item being added or changed?"
        ></textarea>
      </div>
      <div class="modal-actions">
        <b-button
          v-if="contentDraft.id"
          size="sm"
          variant="outline-danger"
          class="mr-auto"
          @click="openDeleteModal('content', contentDraft)"
        >
          <i class="fa fa-trash mr-1"></i>Remove
        </b-button>
        <b-button size="sm" variant="outline-secondary" @click="$refs.contentModal.hide()">Cancel</b-button>
        <b-button size="sm" variant="outline-warning" :disabled="!canSaveContent || operationBusy" @click="saveParcelContent">
          <i :class="operationBusy ? 'fa fa-spinner fa-spin mr-1' : 'fa fa-save mr-1'"></i>Save item
        </b-button>
      </div>
    </b-modal>

    <b-modal
      ref="gmMailModal"
      modal-class="mail-parcels-editor-modal gm-delivery-modal"
      title="GM Messaging"
      size="xl"
      hide-footer
      @hidden="resetGMMailComposer"
    >
      <div class="gm-workflow-steps" aria-label="GM message workflow">
        <span :class="{ active: gmMailDraft.step === 'compose' }"><b>1</b> Compose</span>
        <span :class="{ active: gmMailDraft.step === 'review' }"><b>2</b> Review</span>
        <span :class="{ active: gmMailDraft.step === 'result' }"><b>3</b> Result</span>
      </div>

      <template v-if="gmMailDraft.step === 'compose'">
        <div class="gm-audience-switch" role="radiogroup" aria-label="Message audience">
          <button
            type="button"
            role="radio"
            :aria-checked="gmMailDraft.audience === 'direct'"
            :class="{ active: gmMailDraft.audience === 'direct' }"
            @click="setGMMailAudience('direct')"
          >
            <i class="fa fa-user"></i>
            <span><strong>Selected characters</strong><small>Send one mailbox message to each chosen recipient.</small></span>
          </button>
          <button
            type="button"
            role="radio"
            :aria-checked="gmMailDraft.audience === 'broadcast'"
            :class="{ active: gmMailDraft.audience === 'broadcast' }"
            @click="setGMMailAudience('broadcast')"
          >
            <i class="fa fa-bullhorn"></i>
            <span><strong>Server-wide</strong><small>Send through the real mail system to every active character.</small></span>
          </button>
        </div>

        <div v-if="gmMailDraft.audience === 'direct'" class="gm-recipient-builder">
          <div class="spire-editor-field">
            <label for="gm-mail-character-search">Recipients</label>
            <div class="spire-editor-search">
              <i class="fa fa-search"></i>
              <input
                id="gm-mail-character-search"
                v-model="gmCharacterSearch"
                class="form-control form-control-sm"
                placeholder="Search character name or exact ID…"
                @input="queueGMCharacterSearch('mail')"
              >
            </div>
          </div>
          <div v-if="gmCharacterResults.length" class="reference-results">
            <button
              v-for="character in gmCharacterResults"
              :key="'gm-mail-character-' + character.id"
              type="button"
              :disabled="gmMailRecipientSelected(character.id)"
              @click="addGMMailRecipient(character)"
            >
              <span><strong>{{ character.name }}</strong><small>Level {{ character.level }} · Character #{{ character.id }}</small></span>
              <span>{{ gmMailRecipientSelected(character.id) ? 'Selected' : 'Add' }}</span>
            </button>
          </div>
          <div v-if="gmMailDraft.recipients.length" class="gm-recipient-chips" aria-label="Selected recipients">
            <span v-for="character in gmMailDraft.recipients" :key="'gm-recipient-chip-' + character.id">
              <i class="ra ra-player"></i>{{ character.name }}
              <button type="button" :aria-label="'Remove ' + character.name" @click="removeGMMailRecipient(character.id)">
                <i class="fa fa-times"></i>
              </button>
            </span>
          </div>
          <div v-else class="gm-inline-state"><i class="fa fa-user-plus"></i>Select at least one character.</div>
        </div>

        <div v-else class="gm-broadcast-preview" :class="{ error: gmMailDraft.audienceError }">
          <template v-if="gmMailDraft.loadingAudience">
            <i class="fa fa-spinner fa-spin"></i>
            <span><strong>Counting the live audience…</strong><small>The recipient set will be rechecked inside the send transaction.</small></span>
          </template>
          <template v-else-if="gmMailDraft.audienceError">
            <i class="fa fa-exclamation-triangle"></i>
            <span><strong>Audience preview unavailable</strong><small>{{ gmMailDraft.audienceError }}</small></span>
            <button type="button" @click="loadGMBroadcastAudience">Retry</button>
          </template>
          <template v-else>
            <i class="fa fa-bullhorn"></i>
            <span>
              <strong>
                {{ gmMailDraft.audiencePreview.recipient_count.toLocaleString() }}
                active character{{ gmMailDraft.audiencePreview.recipient_count === 1 ? '' : 's' }}
              </strong>
              <small>
                Sample:
                {{ gmMailDraft.audiencePreview.recipients.map(character => character.name).join(', ') || 'No recipients' }}
              </small>
            </span>
          </template>
        </div>

        <div class="spire-editor-grid spire-editor-grid--two mt-3">
          <div class="spire-editor-field">
            <label for="gm-mail-from">From</label>
            <input id="gm-mail-from" v-model="gmMailDraft.from" class="form-control form-control-sm" maxlength="100" placeholder="Server Staff">
          </div>
          <div class="spire-editor-field">
            <label for="gm-mail-subject">Subject</label>
            <input id="gm-mail-subject" v-model="gmMailDraft.subject" class="form-control form-control-sm" maxlength="200" placeholder="Concise mailbox subject…">
          </div>
          <div class="spire-editor-field spire-editor-grid-span">
            <label for="gm-mail-body">Message body</label>
            <textarea id="gm-mail-body" v-model="gmMailDraft.body" class="form-control gm-message-body" rows="7" placeholder="Write the player-visible message…"></textarea>
          </div>
          <div class="spire-editor-field spire-editor-grid-span">
            <label for="gm-mail-reason">Required audit reason</label>
            <textarea
              id="gm-mail-reason"
              v-model="gmMailDraft.reason"
              class="form-control"
              rows="2"
              maxlength="240"
              placeholder="Ticket, announcement, support, or moderation reason…"
            ></textarea>
            <span class="spire-editor-field-help">8–240 characters. The message body is hashed in the immutable audit record.</span>
          </div>
        </div>
      </template>

      <template v-else-if="gmMailDraft.step === 'review'">
        <div class="gm-review-grid">
          <section class="gm-review-card">
            <span class="context-label">Audience</span>
            <h4>{{ gmMailAudienceLabel }}</h4>
            <p>{{ gmMailRecipientCount.toLocaleString() }} mailbox message{{ gmMailRecipientCount === 1 ? '' : 's' }} will be created atomically.</p>
            <div v-if="gmMailDraft.audience === 'direct'" class="gm-review-recipients">
              <span v-for="character in gmMailDraft.recipients" :key="'gm-review-recipient-' + character.id">
                {{ character.name }} <small>#{{ character.id }}</small>
              </span>
            </div>
          </section>
          <section class="mail-client-preview gm-review-message">
            <div class="mail-client-preview__top">
              <span><i class="ra ra-feather-wing mr-1"></i>Delivery preview</span>
              <span>Unread</span>
            </div>
            <h4>{{ gmMailDraft.subject }}</h4>
            <div class="mail-client-preview__meta">From {{ gmMailDraft.from }} · {{ gmMailAudienceLabel }}</div>
            <p>{{ gmMailDraft.body }}</p>
          </section>
        </div>
        <div class="gm-confirmation" :class="{ 'gm-confirmation--danger': gmMailDraft.audience === 'broadcast' }">
          <div>
            <i :class="gmMailDraft.audience === 'broadcast' ? 'fa fa-exclamation-triangle' : 'fa fa-shield'"></i>
            <span>
              <strong>{{ gmMailDraft.audience === 'broadcast' ? 'Confirm server-wide delivery' : 'Confirm direct delivery' }}</strong>
              <small>The audience is re-resolved and every message is written in one database transaction.</small>
            </span>
          </div>
          <label for="gm-mail-confirmation">Type {{ gmMailExpectedConfirmation }}</label>
          <input
            id="gm-mail-confirmation"
            v-model="gmMailDraft.confirmation"
            class="form-control form-control-sm"
            autocomplete="off"
          >
        </div>
      </template>

      <div v-else class="gm-delivery-result" role="status">
        <span class="gm-delivery-result__icon"><i class="fa fa-check"></i></span>
        <div>
          <span class="context-label">Delivery complete</span>
          <h4>{{ gmMailDraft.result.message_count.toLocaleString() }} unread message{{ gmMailDraft.result.message_count === 1 ? '' : 's' }} delivered</h4>
          <p>{{ gmMailAudienceLabel }} · Audit event #{{ gmMailDraft.result.audit_id }}</p>
          <span class="delivery-status-chip delivery-status-chip--unread"><i class="fa fa-envelope"></i>Unread</span>
        </div>
      </div>

      <div class="modal-actions">
        <b-button
          v-if="gmMailDraft.step === 'compose'"
          size="sm"
          variant="outline-secondary"
          @click="$refs.gmMailModal.hide()"
        >Cancel</b-button>
        <b-button
          v-if="gmMailDraft.step === 'review'"
          size="sm"
          variant="outline-secondary"
          :disabled="gmMailDraft.busy"
          @click="gmMailDraft.step = 'compose'"
        ><i class="fa fa-angle-left mr-1"></i>Back</b-button>
        <b-button
          v-if="gmMailDraft.step === 'compose'"
          size="sm"
          variant="outline-warning"
          :disabled="!canReviewGMMail"
          @click="reviewGMMail"
        >Review delivery<i class="fa fa-angle-right ml-1"></i></b-button>
        <b-button
          v-if="gmMailDraft.step === 'review'"
          size="sm"
          :variant="gmMailDraft.audience === 'broadcast' ? 'outline-danger' : 'outline-warning'"
          :disabled="!canSendGMMail || gmMailDraft.busy"
          @click="sendGMMail"
        >
          <i :class="gmMailDraft.busy ? 'fa fa-spinner fa-spin mr-1' : 'fa fa-paper-plane mr-1'"></i>
          {{ gmMailDraft.audience === 'broadcast' ? 'Send server-wide' : 'Send messages' }}
        </b-button>
        <b-button
          v-if="gmMailDraft.step === 'result'"
          size="sm"
          variant="outline-warning"
          @click="$refs.gmMailModal.hide()"
        >Done</b-button>
      </div>
    </b-modal>

    <b-modal
      ref="gmParcelModal"
      modal-class="mail-parcels-editor-modal gm-delivery-modal"
      title="GM Send Parcels"
      size="xl"
      hide-footer
      @hidden="resetGMParcelComposer"
    >
      <div class="gm-workflow-steps" aria-label="GM parcel workflow">
        <span :class="{ active: gmParcelDraft.step === 'compose' }"><b>1</b> Compose</span>
        <span :class="{ active: gmParcelDraft.step === 'review' }"><b>2</b> Review</span>
        <span :class="{ active: gmParcelDraft.step === 'result' }"><b>3</b> Result</span>
      </div>

      <template v-if="gmParcelDraft.step === 'compose'">
        <div class="gm-parcel-rule">
          <i class="ra ra-wooden-box"></i>
          <span>
            <strong>One selected item creates one parcel message</strong>
            <small>A batch of {{ gmParcelDraft.items.length }} item{{ gmParcelDraft.items.length === 1 ? '' : 's' }} will reserve and create {{ gmParcelDraft.items.length }} separate parcel{{ gmParcelDraft.items.length === 1 ? '' : 's' }} atomically.</small>
          </span>
        </div>

        <div class="spire-editor-grid spire-editor-grid--two mt-3">
          <div class="gm-recipient-builder">
            <div class="spire-editor-field">
              <label for="gm-parcel-character-search">Recipient character</label>
              <div class="spire-editor-search">
                <i class="fa fa-search"></i>
                <input
                  id="gm-parcel-character-search"
                  v-model="gmCharacterSearch"
                  class="form-control form-control-sm"
                  placeholder="Search character name or exact ID…"
                  @input="queueGMCharacterSearch('parcel')"
                >
              </div>
            </div>
            <div v-if="gmCharacterResults.length" class="reference-results">
              <button
                v-for="character in gmCharacterResults"
                :key="'gm-parcel-character-' + character.id"
                type="button"
                @click="selectGMParcelRecipient(character)"
              >
                <span><strong>{{ character.name }}</strong><small>Level {{ character.level }} · Character #{{ character.id }}</small></span>
                <span>{{ character.parcel_count }}/{{ summary.parcel_capacity }} parcels</span>
              </button>
            </div>
            <div v-if="gmParcelDraft.recipient" class="selected-reference-card">
              <span class="selected-reference-card__icon"><i class="ra ra-player"></i></span>
              <span>
                <strong>{{ gmParcelDraft.recipient.name }}</strong>
                <small>Character #{{ gmParcelDraft.recipient.id }} · {{ gmParcelDraft.recipient.parcel_count || 0 }}/{{ summary.parcel_capacity }} slots used</small>
              </span>
              <button type="button" aria-label="Change parcel recipient" @click="focusGMCharacterSearch">
                <i class="fa fa-pencil"></i>
              </button>
            </div>
          </div>
          <div class="spire-editor-grid spire-editor-grid--two">
            <div class="spire-editor-field">
              <label for="gm-parcel-from">Sender name</label>
              <input id="gm-parcel-from" v-model="gmParcelDraft.from_name" class="form-control form-control-sm" maxlength="64" placeholder="Server Staff">
            </div>
            <div class="spire-editor-field">
              <label for="gm-parcel-sent-at">Sent at</label>
              <input id="gm-parcel-sent-at" v-model="gmParcelDraft.sent_at" class="form-control form-control-sm" type="datetime-local" step="1">
            </div>
            <div class="spire-editor-field spire-editor-grid-span">
              <label for="gm-parcel-note">Parcel note</label>
              <textarea id="gm-parcel-note" v-model="gmParcelDraft.note" class="form-control" rows="3" maxlength="1024" placeholder="Player-visible delivery context…"></textarea>
            </div>
          </div>
        </div>

        <div class="gm-parcel-lines">
          <div class="gm-parcel-lines__heading">
            <div><span class="context-label">Parcel messages</span><strong>Items to deliver</strong></div>
            <b-button size="sm" variant="outline-warning" :disabled="gmParcelDraft.items.length >= 20" @click="addGMParcelLine">
              <i class="fa fa-plus mr-1"></i>Add parcel
            </b-button>
          </div>
          <article v-for="(line, lineIndex) in gmParcelDraft.items" :key="line.client_key" class="gm-parcel-line">
            <div class="gm-parcel-line__number">{{ lineIndex + 1 }}</div>
            <div class="gm-parcel-line__main">
              <button class="item-selector" type="button" @click="openItemLookup('gm-parcel-item', -1, lineIndex)">
                <span class="item-selector__icon">
                  <span v-if="line.item && line.item.icon" :class="'item-' + line.item.icon"></span>
                  <i v-else class="ra ra-wooden-box"></i>
                </span>
                <span>
                  <strong>{{ line.item ? line.item.name : 'Choose an item' }}</strong>
                  <small>{{ line.item ? itemConfigurationSummary(line.item) : 'Search the live item catalog by name or exact ID' }}</small>
                </span>
                <i class="fa fa-search"></i>
              </button>
              <div class="gm-parcel-line__configuration">
                <div class="spire-editor-field">
                  <label :for="'gm-parcel-quantity-' + line.client_key">Quantity</label>
                  <input
                    :id="'gm-parcel-quantity-' + line.client_key"
                    v-model.number="line.quantity"
                    class="form-control form-control-sm"
                    type="number"
                    min="1"
                    :max="line.item && line.item.stackable && line.item.stack_size > 0 ? line.item.stack_size : 1"
                    :disabled="Boolean(line.item && !line.item.stackable)"
                  >
                </div>
              </div>
              <div v-if="line.item && gmParcelSocketOptions(line).length" class="gm-parcel-augments">
                <span class="context-label">Compatible augments</span>
                <button
                  v-for="socket in gmParcelSocketOptions(line)"
                  :key="line.client_key + '-augment-' + socket.index"
                  type="button"
                  @click="openItemLookup('gm-parcel-augment', socket.index, lineIndex)"
                >
                  <b>{{ socket.index + 1 }}</b>
                  <span><strong>{{ line.augment_refs[socket.index] ? line.augment_refs[socket.index].name : 'Empty socket' }}</strong><small>Type {{ socket.type }}</small></span>
                  <i class="fa fa-chevron-right"></i>
                </button>
              </div>
            </div>
            <button
              class="gm-parcel-line__remove"
              type="button"
              :disabled="gmParcelDraft.items.length === 1"
              :aria-label="'Remove parcel ' + (lineIndex + 1)"
              @click="removeGMParcelLine(lineIndex)"
            ><i class="fa fa-trash"></i></button>
          </article>
        </div>

        <div class="spire-editor-field mt-3">
          <label for="gm-parcel-reason">Required audit reason</label>
          <textarea
            id="gm-parcel-reason"
            v-model="gmParcelDraft.reason"
            class="form-control"
            rows="2"
            maxlength="240"
            placeholder="Ticket, reimbursement, event reward, or support reason…"
          ></textarea>
          <span class="spire-editor-field-help">8–240 characters. Recipient, item, slot, quantity, augment, and result IDs are recorded.</span>
        </div>
      </template>

      <template v-else-if="gmParcelDraft.step === 'review'">
        <div class="gm-parcel-rule">
          <i class="fa fa-database"></i>
          <span>
            <strong>{{ gmParcelDraft.items.length }} separate parcel message{{ gmParcelDraft.items.length === 1 ? '' : 's' }} for {{ gmParcelDraft.recipient.name }}</strong>
            <small>Every item consumes one parcel slot. Capacity and every item/augment are revalidated before any parcel is written.</small>
          </span>
        </div>
        <div class="gm-parcel-review-list">
          <article v-for="(line, index) in gmParcelDraft.items" :key="'review-' + line.client_key">
            <span class="gm-parcel-review-list__icon">
              <span v-if="line.item.icon" :class="'item-' + line.item.icon"></span>
              <i v-else class="ra ra-wooden-box"></i>
            </span>
            <span>
              <strong>Parcel {{ index + 1 }} · {{ line.item.name }}</strong>
              <small>
                Item #{{ line.item.id }} · quantity {{ line.quantity }}
                <template v-if="line.augment_refs.some(Boolean)"> · {{ line.augment_refs.filter(Boolean).length }} augment{{ line.augment_refs.filter(Boolean).length === 1 ? '' : 's' }}</template>
              </small>
            </span>
            <span class="delivery-status-chip delivery-status-chip--queued"><i class="fa fa-clock-o"></i>Queued after send</span>
          </article>
        </div>
        <div class="gm-confirmation">
          <div>
            <i class="fa fa-shield"></i>
            <span><strong>Confirm atomic parcel delivery</strong><small>No sender inventory is consumed. All parcel messages succeed together or none are created.</small></span>
          </div>
          <label for="gm-parcel-confirmation">Type {{ gmParcelExpectedConfirmation }}</label>
          <input id="gm-parcel-confirmation" v-model="gmParcelDraft.confirmation" class="form-control form-control-sm" autocomplete="off">
        </div>
      </template>

      <div v-else class="gm-delivery-result" role="status">
        <span class="gm-delivery-result__icon"><i class="fa fa-check"></i></span>
        <div>
          <span class="context-label">Delivery complete</span>
          <h4>{{ gmParcelDraft.result.parcel_count }} separate parcel{{ gmParcelDraft.result.parcel_count === 1 ? '' : 's' }} queued for {{ gmParcelDraft.result.character_name }}</h4>
          <p>Audit event #{{ gmParcelDraft.result.audit_id }} · The recipient may need to reopen the parcel merchant or relog.</p>
        </div>
        <div class="gm-parcel-result-list">
          <span v-for="delivery in gmParcelDraft.result.deliveries" :key="'result-parcel-' + delivery.parcel.id">
            <b>#{{ delivery.parcel.id }}</b>{{ delivery.parcel.item_name }} · slot {{ delivery.parcel.slot_id }}
            · player event #{{ delivery.player_event_log_id }}
            <em class="delivery-status-chip delivery-status-chip--queued"><i class="fa fa-clock-o"></i>Queued for pickup</em>
          </span>
        </div>
      </div>

      <div class="modal-actions">
        <b-button
          v-if="gmParcelDraft.step === 'compose'"
          size="sm"
          variant="outline-secondary"
          @click="$refs.gmParcelModal.hide()"
        >Cancel</b-button>
        <b-button
          v-if="gmParcelDraft.step === 'review'"
          size="sm"
          variant="outline-secondary"
          :disabled="gmParcelDraft.busy"
          @click="gmParcelDraft.step = 'compose'"
        ><i class="fa fa-angle-left mr-1"></i>Back</b-button>
        <b-button
          v-if="gmParcelDraft.step === 'compose'"
          size="sm"
          variant="outline-warning"
          :disabled="!canReviewGMParcels"
          @click="reviewGMParcels"
        >Review {{ gmParcelDraft.items.length }} parcel{{ gmParcelDraft.items.length === 1 ? '' : 's' }}<i class="fa fa-angle-right ml-1"></i></b-button>
        <b-button
          v-if="gmParcelDraft.step === 'review'"
          size="sm"
          variant="outline-warning"
          :disabled="!canSendGMParcels || gmParcelDraft.busy"
          @click="sendGMParcels"
        >
          <i :class="gmParcelDraft.busy ? 'fa fa-spinner fa-spin mr-1' : 'fa fa-paper-plane mr-1'"></i>Send parcels
        </b-button>
        <b-button
          v-if="gmParcelDraft.step === 'result'"
          size="sm"
          variant="outline-warning"
          @click="$refs.gmParcelModal.hide()"
        >Done</b-button>
      </div>
    </b-modal>

    <transition name="mail-parcels-notification">
      <div
        v-if="notification.message"
        class="spire-editor-notification"
        :class="{ error: notification.type === 'error' }"
        role="status"
      >
        <i :class="notification.type === 'error' ? 'fa fa-exclamation-triangle' : 'fa fa-check-circle'"></i>
        {{ notification.message }}
      </div>
    </transition>
  </content-area>
</template>

<script>
  import ContentArea from '../../../components/layout/ContentArea.vue'
  import EqWindow from '../../../components/eq-ui/EQWindow.vue'
  import { SpireApi } from '../../../app/api/spire-api'

  const MAIL_TABS = ['Message', 'Delivery', 'Audit']
  const PARCEL_TABS = ['Package', 'Contents', 'Delivery', 'Audit']
  const MAIL_FIELDS = ['character_id', 'timestamp', 'from', 'subject', 'body', 'to', 'status']
  const PARCEL_FIELDS = [
    'character_id', 'item_id', 'augment_1', 'augment_2', 'augment_3', 'augment_4', 'augment_5', 'augment_6',
    'slot_id', 'quantity', 'from_name', 'note', 'sent_date'
  ]
  const CONTENT_FIELDS = [
    'slot_id', 'item_id', 'augment_1', 'augment_2', 'augment_3', 'augment_4', 'augment_5', 'augment_6',
    'quantity'
  ]

  function clone (value) {
    return value == null ? value : JSON.parse(JSON.stringify(value))
  }

  function pick (record, fields) {
    const result = {}
    fields.forEach(field => {
      if (['from', 'subject', 'body', 'to', 'from_name', 'note', 'sent_date'].includes(field)) {
        result[field] = String(record[field] || '')
      } else {
        result[field] = Number(record[field] || 0)
      }
    })
    return result
  }

  function emptyMail () {
    return {
      character_id: 0,
      timestamp: Math.floor(Date.now() / 1000),
      from: 'Server Staff',
      subject: '',
      body: '',
      to: '',
      status: 1
    }
  }

  function emptyParcel () {
    return {
      character_id: 0,
      item_id: 0,
      item_name: '',
      item_icon: 0,
      augment_1: 0,
      augment_2: 0,
      augment_3: 0,
      augment_4: 0,
      augment_5: 0,
      augment_6: 0,
      slot_id: 0,
      quantity: 1,
      from_name: 'Server Staff',
      note: '',
      sent_date: ''
    }
  }

  function emptyContent () {
    return {
      id: 0,
      parcel_id: 0,
      slot_id: 0,
      item_id: 0,
      item_name: '',
      item_icon: 0,
      augment_1: 0,
      augment_2: 0,
      augment_3: 0,
      augment_4: 0,
      augment_5: 0,
      augment_6: 0,
      quantity: 1,
      reason: ''
    }
  }

  let gmParcelLineSequence = 0

  function emptyGMParcelLine () {
    gmParcelLineSequence += 1
    return {
      client_key: `parcel-${gmParcelLineSequence}`,
      item_id: 0,
      item: null,
      augment_1: 0,
      augment_2: 0,
      augment_3: 0,
      augment_4: 0,
      augment_5: 0,
      augment_6: 0,
      augment_refs: [null, null, null, null, null, null],
      quantity: 1
    }
  }

  function emptyGMMailDraft () {
    return {
      audience: 'direct',
      recipients: [],
      audiencePreview: { recipient_count: 0, recipients: [], confirmation: '' },
      loadingAudience: false,
      audienceError: '',
      from: 'Server Staff',
      subject: '',
      body: '',
      reason: '',
      confirmation: '',
      step: 'compose',
      busy: false,
      result: null
    }
  }

  function emptyGMParcelDraft () {
    return {
      recipient: null,
      from_name: 'Server Staff',
      note: '',
      sent_at: localDateTimeValue(new Date()),
      reason: '',
      confirmation: '',
      items: [emptyGMParcelLine()],
      step: 'compose',
      busy: false,
      result: null
    }
  }

  function localDateTimeValue (date) {
    const value = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(value.getTime())) return ''
    const pad = number => String(number).padStart(2, '0')
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
  }

  export default {
    name: 'MailParcelsEditor',
    components: { ContentArea, EqWindow },
    data () {
      const requestedMode = this.$route.query.mode === 'parcels' ? 'parcels' : 'mail'
      const tabs = requestedMode === 'mail' ? MAIL_TABS : PARCEL_TABS
      return {
        mode: requestedMode,
        modeOptions: [
          { value: 'mail', label: 'Mail', help: 'Mailbox messages and delivery state', icon: 'ra ra-feather-wing' },
          { value: 'parcels', label: 'Parcels', help: 'Items, containers, and pickup queue', icon: 'ra ra-wooden-box' }
        ],
        mailStatusOptions: [
          { value: 1, label: 'Unread', icon: 'fa fa-envelope' },
          { value: 3, label: 'Read', icon: 'fa fa-envelope-open' },
          { value: 4, label: 'Trash', icon: 'fa fa-trash' }
        ],
        mailStatusFilters: [
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread' },
          { value: 'read', label: 'Read' },
          { value: 'trash', label: 'Trash' },
          { value: 'unknown', label: 'Legacy' }
        ],
        statusFilter: 'all',
        selectedTab: tabs.includes(this.$route.query.tab) ? this.$route.query.tab : tabs[0],
        summary: {
          mail_count: 0,
          unread_count: 0,
          trash_count: 0,
          parcel_count: 0,
          container_count: 0,
          parcel_capacity: 50,
          money_parcel_item: 99990
        },
        search: '',
        searchTimer: null,
        records: [],
        totalRecords: 0,
        currentPage: 1,
        pageSize: 30,
        loadingDirectory: false,
        directoryError: '',
        selectedId: null,
        editModel: null,
        originalModel: null,
        isCreating: false,
        loadingDetail: false,
        operationBusy: false,
        mailSentAt: '',
        parcelSentAt: '',
        selectedCharacter: null,
        characterSearch: '',
        characterSearchTimer: null,
        characterResults: [],
        searchingCharacters: false,
        selectedItem: null,
        augmentRefs: [null, null, null, null, null, null],
        parcelContent: [],
        contentDraft: emptyContent(),
        selectedContentItem: null,
        contentAugmentRefs: [null, null, null, null, null, null],
        itemLookup: { scope: '', index: -1, lineIndex: -1 },
        itemSearch: '',
        itemSearchTimer: null,
        itemResults: [],
        searchingItems: false,
        itemSearchComplete: false,
        gmMailDraft: emptyGMMailDraft(),
        gmParcelDraft: emptyGMParcelDraft(),
        gmCharacterSearch: '',
        gmCharacterSearchTimer: null,
        gmCharacterResults: [],
        gmCharacterContext: '',
        searchingGMCharacters: false,
        operationReason: '',
        deleteKind: '',
        deleteTarget: null,
        deleteDraft: { confirmation: '', reason: '' },
        auditEntries: [],
        auditError: '',
        loadingAudit: false,
        notification: { message: '', type: 'success', timer: null },
        routeSyncing: false
      }
    },
    computed: {
      tabs () {
        return this.mode === 'mail' ? MAIL_TABS : PARCEL_TABS
      },
      totalPages () {
        return Math.max(1, Math.ceil(this.totalRecords / this.pageSize))
      },
      identityLabel () {
        if (!this.editModel) return ''
        return this.mode === 'mail' ? `Message #${this.editModel.msg_id}` : `Parcel #${this.editModel.id}`
      },
      identityTitle () {
        if (!this.editModel) return ''
        if (this.mode === 'mail') return this.editModel.subject || '(No subject)'
        return (this.selectedItem && this.selectedItem.name) || this.editModel.item_name || 'Choose an item'
      },
      identitySubtitle () {
        if (!this.editModel) return ''
        if (this.mode === 'mail') {
          return `${this.selectedCharacterName} · ${this.mailStatusLabel(this.editModel.status)} · ${this.formatUnix(this.editModel.timestamp)}`
        }
        return `${this.selectedCharacterName} · slot ${this.editModel.slot_id || 'automatic'} · quantity ${Number(this.editModel.quantity || 0).toLocaleString()}`
      },
      selectedCharacterName () {
        if (this.selectedCharacter && this.selectedCharacter.name) return this.selectedCharacter.name
        if (this.editModel && this.editModel.character_name) return this.editModel.character_name
        return 'No recipient selected'
      },
      hasUnsavedChanges () {
        if (!this.editModel || !this.originalModel) return false
        const fields = this.mode === 'mail' ? MAIL_FIELDS : PARCEL_FIELDS
        const current = pick(this.editModel, fields)
        const original = pick(this.originalModel, fields)
        if (this.mode === 'mail' && this.mailSentAt) {
          current.timestamp = Math.floor(new Date(this.mailSentAt).getTime() / 1000)
        }
        if (this.mode === 'parcels') {
          current.sent_date = this.sqlDateTime(this.parcelSentAt)
        }
        return JSON.stringify(current) !== JSON.stringify(original)
      },
      canSave () {
        if (!this.editModel || this.operationBusy) return false
        if (this.mode === 'mail') {
          return Number(this.editModel.character_id) > 0 &&
            this.editModel.from.trim().length > 0 &&
            this.editModel.subject.trim().length > 0 &&
            this.mailSentAt.length > 0 &&
            (this.isCreating || this.hasUnsavedChanges)
        }
        return Number(this.editModel.character_id) > 0 &&
          Number(this.editModel.item_id) > 0 &&
          Number(this.editModel.quantity) > 0 &&
          (this.isCreating || this.hasUnsavedChanges)
      },
      primaryActionLabel () {
        if (this.mode === 'mail') return this.isCreating ? 'Send message' : 'Save'
        return this.isCreating ? 'Queue parcel' : 'Save'
      },
      saveModalTitle () {
        if (this.mode === 'mail') return this.isCreating ? 'Confirm mailbox delivery' : 'Confirm message update'
        return this.isCreating ? 'Confirm parcel delivery' : 'Confirm parcel update'
      },
      saveModalDescription () {
        if (this.mode === 'mail') {
          return this.isCreating
            ? 'This writes directly to the selected character’s mailbox as an unread message.'
            : 'This updates player-visible mailbox data and delivery state.'
        }
        return this.isCreating
          ? 'This queues an item directly for the selected character without removing it from a sender inventory.'
          : 'This changes an item already queued for player pickup.'
      },
      isMoneyParcel () {
        return this.mode === 'parcels' && Number(this.editModel && this.editModel.item_id) === Number(this.summary.money_parcel_item)
      },
      canAddContainerContent () {
        return Boolean(this.selectedItem && Number(this.selectedItem.bag_slots) > 0)
      },
      containerSlotOptions () {
        const slots = Math.max(
          Number(this.selectedItem && this.selectedItem.bag_slots) || 0,
          Number(this.contentDraft.slot_id) + 1,
          1
        )
        return Array.from({ length: slots }, (_, index) => ({ value: index, label: `Slot ${index + 1}` }))
      },
      canSaveContent () {
        return Number(this.contentDraft.item_id) > 0 &&
          Number(this.contentDraft.quantity) > 0 &&
          this.contentDraft.reason.trim().length >= 8
      },
      itemLookupCanClear () {
        return this.itemLookup.scope.indexOf('augment') >= 0
      },
      deleteExpectedConfirmation () {
        if (this.deleteKind === 'mail') return `MAIL #${this.editModel ? this.editModel.msg_id : 0}`
        if (this.deleteKind === 'parcel') return `PARCEL #${this.editModel ? this.editModel.id : 0}`
        if (this.deleteKind === 'content') return `ITEM #${this.deleteTarget ? this.deleteTarget.id : 0}`
        return ''
      },
      deleteModalTitle () {
        if (this.deleteKind === 'mail') return 'Delete mailbox message'
        if (this.deleteKind === 'parcel') return 'Delete queued parcel'
        if (this.deleteKind === 'content') return 'Remove packed item'
        return 'Delete record'
      },
      deleteModalDescription () {
        if (this.deleteKind === 'mail') return 'The message disappears from the player mailbox immediately.'
        if (this.deleteKind === 'parcel') return 'The parcel and every packed container item are deleted in one transaction.'
        if (this.deleteKind === 'content') return 'The item is removed from this parcel container.'
        return ''
      },
      canDelete () {
        return this.deleteDraft.confirmation.trim() === this.deleteExpectedConfirmation &&
          this.deleteDraft.reason.trim().length >= 8
      },
      gmMailRecipientCount () {
        return this.gmMailDraft.audience === 'broadcast'
          ? Number(this.gmMailDraft.audiencePreview.recipient_count || 0)
          : this.gmMailDraft.recipients.length
      },
      gmMailAudienceLabel () {
        if (this.gmMailDraft.audience === 'broadcast') {
          const noun = this.gmMailRecipientCount === 1 ? 'character' : 'characters'
          return `Server-wide · ${this.gmMailRecipientCount.toLocaleString()} active ${noun}`
        }
        if (this.gmMailRecipientCount === 1) return this.gmMailDraft.recipients[0].name
        return `${this.gmMailRecipientCount.toLocaleString()} selected characters`
      },
      gmMailExpectedConfirmation () {
        if (this.gmMailDraft.audience === 'broadcast' && this.gmMailDraft.audiencePreview.confirmation) {
          return this.gmMailDraft.audiencePreview.confirmation
        }
        const noun = this.gmMailRecipientCount === 1 ? 'CHARACTER' : 'CHARACTERS'
        const prefix = this.gmMailDraft.audience === 'broadcast' ? 'BROADCAST TO' : 'SEND TO'
        return `${prefix} ${this.gmMailRecipientCount} ${noun}`
      },
      canReviewGMMail () {
        return this.gmMailRecipientCount > 0 &&
          !this.gmMailDraft.loadingAudience &&
          !this.gmMailDraft.audienceError &&
          this.gmMailDraft.from.trim().length > 0 &&
          this.gmMailDraft.subject.trim().length > 0 &&
          this.gmMailDraft.body.trim().length > 0 &&
          this.gmMailDraft.reason.trim().length >= 8
      },
      canSendGMMail () {
        return this.canReviewGMMail &&
          this.gmMailDraft.confirmation.trim() === this.gmMailExpectedConfirmation
      },
      gmParcelExpectedConfirmation () {
        if (!this.gmParcelDraft.recipient) return ''
        const count = this.gmParcelDraft.items.length
        const noun = count === 1 ? 'PARCEL' : 'PARCELS'
        return `SEND ${count} ${noun} TO ${this.gmParcelDraft.recipient.name}`
      },
      canReviewGMParcels () {
        if (!this.gmParcelDraft.recipient ||
          !this.gmParcelDraft.from_name.trim() ||
          this.gmParcelDraft.reason.trim().length < 8 ||
          !this.gmParcelDraft.sent_at) return false
        return this.gmParcelDraft.items.length > 0 && this.gmParcelDraft.items.every(line => {
          if (!line.item || Number(line.item_id) <= 0 || Number(line.quantity) <= 0) return false
          if (!Number(line.item.stackable) && Number(line.quantity) !== 1) return false
          return !Number(line.item.stack_size) || Number(line.quantity) <= Number(line.item.stack_size)
        })
      },
      canSendGMParcels () {
        return this.canReviewGMParcels &&
          this.gmParcelDraft.confirmation.trim() === this.gmParcelExpectedConfirmation
      }
    },
    watch: {
      '$route.query': {
        deep: true,
        handler (query) {
          if (this.routeSyncing) return
          const routeMode = query.mode === 'parcels' ? 'parcels' : 'mail'
          const routeTabs = routeMode === 'mail' ? MAIL_TABS : PARCEL_TABS
          const routeTab = routeTabs.includes(query.tab) ? query.tab : routeTabs[0]
          const routeID = Number(routeMode === 'mail' ? query.mail : query.parcel) || null
          if (routeMode !== this.mode) {
            this.mode = routeMode
            this.selectedTab = routeTab
            this.resetWorkspace()
            this.loadDirectory(1).then(() => {
              if (routeID) this.selectRecord(routeID, false)
            })
            return
          }
          this.selectedTab = routeTab
          if (routeID && Number(routeID) !== Number(this.selectedId)) this.selectRecord(routeID, false)
        }
      }
    },
    created () {
      this.loadSummary()
      this.loadDirectory(1).then(() => {
        const routeID = Number(this.mode === 'mail' ? this.$route.query.mail : this.$route.query.parcel)
        if (routeID) this.selectRecord(routeID, false)
      })
    },
    beforeDestroy () {
      clearTimeout(this.searchTimer)
      clearTimeout(this.characterSearchTimer)
      clearTimeout(this.gmCharacterSearchTimer)
      clearTimeout(this.itemSearchTimer)
      clearTimeout(this.notification.timer)
    },
    beforeRouteLeave (to, from, next) {
      if (!this.hasUnsavedChanges || window.confirm('Discard unsaved Mail & Parcels changes?')) next()
      else next(false)
    },
    methods: {
      apiError (error, fallback) {
        return (error && error.response && error.response.data && error.response.data.error) ||
          (error && error.message) ||
          fallback
      },
      openGMMailComposer () {
        this.resetGMMailComposer()
        this.$refs.gmMailModal.show()
      },
      resetGMMailComposer () {
        clearTimeout(this.gmCharacterSearchTimer)
        this.gmMailDraft = emptyGMMailDraft()
        this.resetGMCharacterSearch()
      },
      setGMMailAudience (audience) {
        if (this.gmMailDraft.audience === audience) return
        this.gmMailDraft.audience = audience
        this.gmMailDraft.confirmation = ''
        this.resetGMCharacterSearch()
        if (audience === 'broadcast') this.loadGMBroadcastAudience()
      },
      async loadGMBroadcastAudience () {
        this.gmMailDraft.loadingAudience = true
        this.gmMailDraft.audienceError = ''
        try {
          const response = await SpireApi.v1().get('/mail-parcels-editor/broadcast/audience')
          this.gmMailDraft.audiencePreview = Object.assign(
            { recipient_count: 0, recipients: [], confirmation: '' },
            response.data || {}
          )
          return true
        } catch (error) {
          this.gmMailDraft.audiencePreview = { recipient_count: 0, recipients: [], confirmation: '' }
          this.gmMailDraft.audienceError = this.apiError(error, 'Could not resolve the server-wide audience.')
          return false
        } finally {
          this.gmMailDraft.loadingAudience = false
        }
      },
      queueGMCharacterSearch (context) {
        this.gmCharacterContext = context
        clearTimeout(this.gmCharacterSearchTimer)
        this.gmCharacterSearchTimer = setTimeout(() => this.searchGMCharacters(), 250)
      },
      async searchGMCharacters () {
        if (!this.gmCharacterSearch.trim()) {
          this.gmCharacterResults = []
          return
        }
        this.searchingGMCharacters = true
        try {
          const response = await SpireApi.v1().get('/mail-parcels-editor/characters', {
            params: { q: this.gmCharacterSearch.trim() }
          })
          this.gmCharacterResults = response.data.data || []
        } catch (error) {
          this.gmCharacterResults = []
          this.notify(this.apiError(error, 'Character search failed.'), 'error')
        } finally {
          this.searchingGMCharacters = false
        }
      },
      resetGMCharacterSearch () {
        clearTimeout(this.gmCharacterSearchTimer)
        this.gmCharacterSearch = ''
        this.gmCharacterResults = []
        this.gmCharacterContext = ''
        this.searchingGMCharacters = false
      },
      focusGMCharacterSearch () {
        this.$nextTick(() => {
          const id = this.gmCharacterContext === 'mail' ? 'gm-mail-character-search' : 'gm-parcel-character-search'
          const input = document.getElementById(id)
          if (input) input.focus()
        })
      },
      gmMailRecipientSelected (id) {
        return this.gmMailDraft.recipients.some(character => Number(character.id) === Number(id))
      },
      addGMMailRecipient (character) {
        if (this.gmMailRecipientSelected(character.id) || this.gmMailDraft.recipients.length >= 100) return
        this.gmMailDraft.recipients.push(clone(character))
        this.gmCharacterSearch = ''
        this.gmCharacterResults = []
      },
      removeGMMailRecipient (id) {
        this.gmMailDraft.recipients = this.gmMailDraft.recipients.filter(character => Number(character.id) !== Number(id))
      },
      async reviewGMMail () {
        if (!this.canReviewGMMail) return
        if (this.gmMailDraft.audience === 'broadcast') {
          const refreshed = await this.loadGMBroadcastAudience()
          if (!refreshed || !this.canReviewGMMail) return
        }
        this.gmMailDraft.confirmation = ''
        this.gmMailDraft.step = 'review'
      },
      async sendGMMail () {
        if (!this.canSendGMMail || this.gmMailDraft.busy) return
        if (this.gmMailDraft.audience === 'broadcast') {
          const enteredConfirmation = this.gmMailDraft.confirmation.trim()
          const refreshed = await this.loadGMBroadcastAudience()
          if (!refreshed) return
          if (enteredConfirmation !== this.gmMailExpectedConfirmation) {
            this.gmMailDraft.confirmation = ''
            this.notify('The active broadcast audience changed. Review the new recipient count and confirm again.', 'error')
            return
          }
        }
        this.gmMailDraft.busy = true
        try {
          const payload = {
            character_ids: this.gmMailDraft.audience === 'direct'
              ? this.gmMailDraft.recipients.map(character => Number(character.id))
              : [],
            from: this.gmMailDraft.from.trim(),
            subject: this.gmMailDraft.subject.trim(),
            body: this.gmMailDraft.body,
            reason: this.gmMailDraft.reason.trim(),
            confirmation: this.gmMailDraft.confirmation.trim()
          }
          const path = this.gmMailDraft.audience === 'broadcast'
            ? '/mail-parcels-editor/broadcast/mail/send'
            : '/mail-parcels-editor/mail/send'
          const response = await SpireApi.v1().put(path, payload)
          this.gmMailDraft.result = response.data
          this.gmMailDraft.step = 'result'
          await this.loadSummary()
          if (this.mode === 'mail') await this.loadDirectory(1)
        } catch (error) {
          this.notify(this.apiError(error, 'Could not send GM mail.'), 'error')
          if (this.gmMailDraft.audience === 'broadcast') await this.loadGMBroadcastAudience()
        } finally {
          this.gmMailDraft.busy = false
        }
      },
      openGMParcelComposer () {
        this.resetGMParcelComposer()
        this.gmCharacterContext = 'parcel'
        this.$refs.gmParcelModal.show()
      },
      resetGMParcelComposer () {
        clearTimeout(this.gmCharacterSearchTimer)
        this.gmParcelDraft = emptyGMParcelDraft()
        this.resetGMCharacterSearch()
      },
      selectGMParcelRecipient (character) {
        this.gmParcelDraft.recipient = clone(character)
        this.gmCharacterSearch = ''
        this.gmCharacterResults = []
      },
      addGMParcelLine () {
        if (this.gmParcelDraft.items.length < 20) this.gmParcelDraft.items.push(emptyGMParcelLine())
      },
      removeGMParcelLine (index) {
        if (this.gmParcelDraft.items.length > 1) this.gmParcelDraft.items.splice(index, 1)
      },
      gmParcelSocketOptions (line) {
        if (!line.item) return []
        return Array.from({ length: 6 }, (_, index) => ({
          index,
          type: Number(line.item[`augment_slot_${index + 1}_type`] || 0)
        })).filter(socket => socket.type > 0)
      },
      itemConfigurationSummary (item) {
        const details = [`Item #${item.id}`]
        if (Number(item.stackable)) details.push(`stackable to ${Number(item.stack_size).toLocaleString()}`)
        else details.push('non-stackable')
        const sockets = Array.from({ length: 6 }, (_, index) => Number(item[`augment_slot_${index + 1}_type`] || 0)).filter(Boolean)
        if (sockets.length) details.push(`${sockets.length} augment socket${sockets.length === 1 ? '' : 's'}`)
        if (Number(item.evolving_level) > 0) details.push('evolving')
        return details.join(' · ')
      },
      reviewGMParcels () {
        if (!this.canReviewGMParcels) return
        this.gmParcelDraft.confirmation = ''
        this.gmParcelDraft.step = 'review'
      },
      async sendGMParcels () {
        if (!this.canSendGMParcels || this.gmParcelDraft.busy) return
        this.gmParcelDraft.busy = true
        try {
          const payload = {
            character_id: Number(this.gmParcelDraft.recipient.id),
            from_name: this.gmParcelDraft.from_name.trim(),
            note: this.gmParcelDraft.note,
            sent_date: this.sqlDateTime(this.gmParcelDraft.sent_at),
            reason: this.gmParcelDraft.reason.trim(),
            confirmation: this.gmParcelDraft.confirmation.trim(),
            items: this.gmParcelDraft.items.map(line => ({
              client_key: line.client_key,
              item_id: Number(line.item_id),
              augment_1: Number(line.augment_1 || 0),
              augment_2: Number(line.augment_2 || 0),
              augment_3: Number(line.augment_3 || 0),
              augment_4: Number(line.augment_4 || 0),
              augment_5: Number(line.augment_5 || 0),
              augment_6: Number(line.augment_6 || 0),
              quantity: Number(line.quantity)
            }))
          }
          const response = await SpireApi.v1().put('/mail-parcels-editor/parcel/send', payload)
          this.gmParcelDraft.result = response.data
          this.gmParcelDraft.step = 'result'
          await this.loadSummary()
          if (this.mode === 'parcels') await this.loadDirectory(1)
        } catch (error) {
          this.notify(this.apiError(error, 'Could not send GM parcels.'), 'error')
        } finally {
          this.gmParcelDraft.busy = false
        }
      },
      async loadSummary () {
        try {
          const response = await SpireApi.v1().get('/mail-parcels-editor/summary')
          this.summary = Object.assign({}, this.summary, response.data || {})
        } catch (error) {
          this.notify(this.apiError(error, 'Could not load delivery summary.'), 'error')
        }
      },
      async loadDirectory (page = 1) {
        this.loadingDirectory = true
        this.directoryError = ''
        try {
          const path = this.mode === 'mail' ? '/mail-parcels-editor/mail' : '/mail-parcels-editor/parcels'
          const params = { q: this.search, page, limit: this.pageSize }
          if (this.mode === 'mail' && this.statusFilter !== 'all') params.status = this.statusFilter
          const response = await SpireApi.v1().get(path, { params })
          this.records = response.data.data || []
          this.totalRecords = Number(response.data.total || 0)
          this.currentPage = Number(response.data.page || page)
          return this.records
        } catch (error) {
          this.records = []
          this.totalRecords = 0
          this.directoryError = this.apiError(error, `Could not load ${this.mode}.`)
          return []
        } finally {
          this.loadingDirectory = false
        }
      },
      async refreshDirectory () {
        await Promise.all([
          this.loadSummary(),
          this.loadDirectory(this.currentPage)
        ])
      },
      queueDirectorySearch () {
        clearTimeout(this.searchTimer)
        this.searchTimer = setTimeout(() => this.loadDirectory(1), 250)
      },
      clearSearch () {
        this.search = ''
        this.loadDirectory(1)
      },
      setStatusFilter (value) {
        this.statusFilter = value
        this.loadDirectory(1)
      },
      recordKey (record) {
        return this.mode === 'mail' ? record.msg_id : record.id
      },
      setMode (mode) {
        if (mode === this.mode) return
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved changes and switch delivery workspace?')) return
        this.mode = mode
        this.selectedTab = this.tabs[0]
        this.search = ''
        this.statusFilter = 'all'
        this.resetWorkspace()
        this.syncRoute()
        this.loadDirectory(1)
      },
      selectTab (tab) {
        this.selectedTab = tab
        this.syncRoute()
        if (tab === 'Audit') this.loadAudit()
      },
      async selectRecord (id, sync = true) {
        if (Number(id) === Number(this.selectedId) && !this.isCreating) return
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved changes?')) return
        this.loadingDetail = true
        this.isCreating = false
        this.selectedId = Number(id)
        try {
          const path = this.mode === 'mail'
            ? `/mail-parcels-editor/mail/${id}`
            : `/mail-parcels-editor/parcel/${id}`
          const response = await SpireApi.v1().get(path)
          if (this.mode === 'mail') {
            this.applyMailRecord(response.data)
          } else {
            await this.applyParcelDetail(response.data)
          }
          if (sync) this.syncRoute()
          if (this.selectedTab === 'Audit') this.loadAudit()
        } catch (error) {
          this.notify(this.apiError(error, 'Could not load delivery record.'), 'error')
          this.resetWorkspace()
        } finally {
          this.loadingDetail = false
        }
      },
      createDraft () {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved changes?')) return
        this.isCreating = true
        this.selectedId = null
        this.selectedCharacter = null
        this.selectedItem = null
        this.augmentRefs = [null, null, null, null, null, null]
        this.parcelContent = []
        this.auditEntries = []
        this.editModel = this.mode === 'mail' ? emptyMail() : emptyParcel()
        this.originalModel = clone(this.editModel)
        if (this.mode === 'mail') {
          this.mailSentAt = localDateTimeValue(new Date())
        } else {
          this.parcelSentAt = localDateTimeValue(new Date())
        }
        this.selectedTab = this.tabs[0]
        this.syncRoute()
      },
      applyMailRecord (record) {
        this.editModel = Object.assign({}, pick(record, MAIL_FIELDS), {
          msg_id: Number(record.msg_id),
          character_name: record.character_name
        })
        this.originalModel = clone(this.editModel)
        this.mailSentAt = localDateTimeValue(Number(record.timestamp) * 1000)
        this.selectedCharacter = {
          id: Number(record.character_id),
          name: record.character_name,
          level: 0,
          mail_count: 0,
          parcel_count: 0
        }
        this.characterSearch = ''
        this.characterResults = []
      },
      async applyParcelDetail (detail) {
        const record = detail.parcel || {}
        this.editModel = Object.assign({}, pick(record, PARCEL_FIELDS), {
          id: Number(record.id),
          character_name: record.character_name,
          item_name: record.item_name,
          item_icon: Number(record.item_icon || 0),
          item_no_drop: Number(record.item_no_drop),
          item_bag_slots: Number(record.item_bag_slots || 0)
        })
        const sentInstant = Number(record.sent_timestamp) > 0
          ? new Date(Number(record.sent_timestamp) * 1000)
          : new Date(String(record.sent_date || '').replace(' ', 'T'))
        this.parcelSentAt = localDateTimeValue(sentInstant)
        this.editModel.sent_date = this.sqlDateTime(this.parcelSentAt)
        this.originalModel = clone(this.editModel)
        this.selectedCharacter = {
          id: Number(record.character_id),
          name: record.character_name,
          level: 0,
          parcel_count: 0,
          mail_count: 0
        }
        this.selectedItem = {
          id: Number(record.item_id),
          name: record.item_name,
          icon: Number(record.item_icon || 0),
          no_drop: Number(record.item_no_drop),
          bag_slots: Number(record.item_bag_slots || 0),
          stackable: 0,
          stack_size: 0
        }
        this.parcelContent = detail.content || []
        this.characterSearch = ''
        this.characterResults = []
        await this.hydrateParcelReferences()
      },
      resetWorkspace () {
        this.selectedId = null
        this.editModel = null
        this.originalModel = null
        this.isCreating = false
        this.loadingDetail = false
        this.selectedCharacter = null
        this.selectedItem = null
        this.augmentRefs = [null, null, null, null, null, null]
        this.parcelContent = []
        this.auditEntries = []
      },
      syncRoute () {
        const query = { mode: this.mode, tab: this.selectedTab }
        if (!this.isCreating && this.selectedId) {
          query[this.mode === 'mail' ? 'mail' : 'parcel'] = String(this.selectedId)
        }
        this.routeSyncing = true
        this.$router.replace({ path: this.$route.path, query })
          .catch(() => {})
          .then(() => this.$nextTick(() => { this.routeSyncing = false }))
      },
      focusCharacterSearch () {
        const id = this.mode === 'mail' ? 'mail-parcels-mail-recipient-search' : 'mail-parcels-parcel-recipient-search'
        this.$nextTick(() => {
          const input = document.getElementById(id)
          if (input) input.focus()
        })
      },
      queueCharacterSearch () {
        clearTimeout(this.characterSearchTimer)
        this.characterSearchTimer = setTimeout(() => this.searchCharacters(), 250)
      },
      async searchCharacters () {
        if (!this.characterSearch.trim()) {
          this.characterResults = []
          return
        }
        this.searchingCharacters = true
        try {
          const response = await SpireApi.v1().get('/mail-parcels-editor/characters', {
            params: { q: this.characterSearch.trim() }
          })
          this.characterResults = response.data.data || []
        } catch (error) {
          this.characterResults = []
          this.notify(this.apiError(error, 'Character search failed.'), 'error')
        } finally {
          this.searchingCharacters = false
        }
      },
      selectCharacter (character) {
        this.selectedCharacter = clone(character)
        this.editModel.character_id = Number(character.id)
        if (this.mode === 'mail' && !this.editModel.to.trim()) this.editModel.to = character.name
        this.characterSearch = ''
        this.characterResults = []
      },
      openSaveModal () {
        if (!this.canSave) return
        this.operationReason = ''
        this.$refs.saveModal.show()
      },
      async persistRecord () {
        if (this.operationReason.trim().length < 8) return
        this.operationBusy = true
        try {
          let response
          if (this.mode === 'mail') {
            const payload = Object.assign({}, pick(this.editModel, MAIL_FIELDS), {
              timestamp: Math.floor(new Date(this.mailSentAt).getTime() / 1000),
              reason: this.operationReason.trim()
            })
            response = this.isCreating
              ? await SpireApi.v1().put('/mail-parcels-editor/mail', payload)
              : await SpireApi.v1().patch(`/mail-parcels-editor/mail/${this.editModel.msg_id}`, payload)
            this.applyMailRecord(response.data)
            this.selectedId = Number(response.data.msg_id)
          } else {
            const payload = Object.assign({}, pick(this.editModel, PARCEL_FIELDS), {
              sent_date: this.sqlDateTime(this.parcelSentAt),
              reason: this.operationReason.trim()
            })
            response = this.isCreating
              ? await SpireApi.v1().put('/mail-parcels-editor/parcel', payload)
              : await SpireApi.v1().patch(`/mail-parcels-editor/parcel/${this.editModel.id}`, payload)
            await this.applyParcelDetail(response.data)
            this.selectedId = Number(response.data.parcel.id)
          }
          this.isCreating = false
          this.$refs.saveModal.hide()
          this.syncRoute()
          await Promise.all([this.loadSummary(), this.loadDirectory(this.currentPage)])
          this.notify(this.mode === 'mail' ? 'Mailbox message saved.' : 'Parcel saved.')
        } catch (error) {
          this.notify(this.apiError(error, 'Could not save delivery record.'), 'error')
        } finally {
          this.operationBusy = false
        }
      },
      copyMailDraft () {
        if (this.mode !== 'mail' || !this.editModel) return
        const copy = pick(this.editModel, MAIL_FIELDS)
        copy.timestamp = Math.floor(Date.now() / 1000)
        copy.status = 1
        copy.subject = copy.subject ? `Copy of ${copy.subject}`.slice(0, 200) : ''
        this.editModel = copy
        this.originalModel = clone(copy)
        this.isCreating = true
        this.selectedId = null
        this.mailSentAt = localDateTimeValue(new Date())
        this.syncRoute()
        this.notify('Copy prepared as a new unread message. Review it before sending.')
      },
      openDeleteModal (kind, target = null) {
        this.deleteKind = kind
        this.deleteTarget = target ? clone(target) : null
        this.deleteDraft = { confirmation: '', reason: '' }
        if (kind === 'content' && this.$refs.contentModal) this.$refs.contentModal.hide()
        this.$refs.deleteModal.show()
      },
      resetDeleteDraft () {
        this.deleteKind = ''
        this.deleteTarget = null
        this.deleteDraft = { confirmation: '', reason: '' }
      },
      async performDelete () {
        if (!this.canDelete) return
        this.operationBusy = true
        const deletedKind = this.deleteKind
        try {
          const data = {
            confirmation: this.deleteDraft.confirmation.trim(),
            reason: this.deleteDraft.reason.trim()
          }
          if (this.deleteKind === 'mail') {
            await SpireApi.v1().delete(`/mail-parcels-editor/mail/${this.editModel.msg_id}`, { data })
          } else if (this.deleteKind === 'parcel') {
            await SpireApi.v1().delete(`/mail-parcels-editor/parcel/${this.editModel.id}`, { data })
          } else {
            const currentID = Number(this.editModel.id)
            await SpireApi.v1().delete(
              `/mail-parcels-editor/parcel/${currentID}/content/${this.deleteTarget.id}`,
              { data }
            )
            this.$refs.deleteModal.hide()
            this.selectedId = null
            await this.selectRecord(currentID, false)
            this.notify('Packed item removed.')
            return
          }
          this.$refs.deleteModal.hide()
          this.resetWorkspace()
          this.syncRoute()
          await Promise.all([this.loadSummary(), this.loadDirectory(1)])
          this.notify(deletedKind === 'mail' ? 'Mailbox message deleted.' : 'Parcel deleted.')
        } catch (error) {
          this.notify(this.apiError(error, 'Could not delete delivery record.'), 'error')
        } finally {
          this.operationBusy = false
        }
      },
      openItemLookup (scope, index, lineIndex = -1) {
        this.itemLookup = { scope, index, lineIndex }
        this.itemSearch = ''
        this.itemResults = []
        this.itemSearchComplete = false
        this.$refs.itemLookupModal.show()
      },
      focusItemLookup () {
        this.$nextTick(() => {
          const input = document.getElementById('mail-parcels-item-lookup')
          if (input) input.focus()
        })
      },
      resetItemLookup () {
        clearTimeout(this.itemSearchTimer)
        this.itemLookup = { scope: '', index: -1, lineIndex: -1 }
        this.itemSearch = ''
        this.itemResults = []
        this.itemSearchComplete = false
      },
      queueItemSearch () {
        clearTimeout(this.itemSearchTimer)
        this.itemSearchTimer = setTimeout(() => this.searchItems(), 250)
      },
      async searchItems () {
        if (!this.itemSearch.trim()) {
          this.itemResults = []
          this.itemSearchComplete = false
          return
        }
        this.searchingItems = true
        try {
          const params = { q: this.itemSearch.trim() }
          if (this.itemLookup.scope.indexOf('augment') >= 0) {
            params.scope = 'augment'
            if (this.itemLookup.scope === 'gm-parcel-augment') {
              const line = this.gmParcelDraft.items[this.itemLookup.lineIndex]
              if (line && line.item) {
                params.socket_type = Number(line.item[`augment_slot_${this.itemLookup.index + 1}_type`] || 0)
              }
            }
          }
          const response = await SpireApi.v1().get('/mail-parcels-editor/items', { params })
          this.itemResults = response.data.data || []
          this.itemSearchComplete = true
        } catch (error) {
          this.itemResults = []
          this.itemSearchComplete = true
          this.notify(this.apiError(error, 'Item search failed.'), 'error')
        } finally {
          this.searchingItems = false
        }
      },
      selectLookupItem (item) {
        const scope = this.itemLookup.scope
        const index = this.itemLookup.index
        const lineIndex = this.itemLookup.lineIndex
        if (scope === 'parcel') {
          this.selectedItem = clone(item)
          this.editModel.item_id = Number(item.id)
          this.editModel.item_name = item.name
          this.editModel.item_icon = Number(item.icon || 0)
        } else if (scope === 'parcel-augment') {
          this.$set(this.augmentRefs, index, clone(item))
          this.$set(this.editModel, `augment_${index + 1}`, Number(item.id))
        } else if (scope === 'content') {
          this.selectedContentItem = clone(item)
          this.contentDraft.item_id = Number(item.id)
          this.contentDraft.item_name = item.name
          this.contentDraft.item_icon = Number(item.icon || 0)
        } else if (scope === 'content-augment') {
          this.$set(this.contentAugmentRefs, index, clone(item))
          this.$set(this.contentDraft, `augment_${index + 1}`, Number(item.id))
        } else if (scope === 'gm-parcel-item') {
          const line = this.gmParcelDraft.items[lineIndex]
          if (!line) return
          line.item = clone(item)
          line.item_id = Number(item.id)
          line.quantity = Number(item.stackable) ? Math.max(1, Math.min(Number(line.quantity) || 1, Number(item.stack_size) || 1)) : 1
          for (let augmentIndex = 0; augmentIndex < 6; augmentIndex++) {
            this.$set(line.augment_refs, augmentIndex, null)
            this.$set(line, `augment_${augmentIndex + 1}`, 0)
          }
        } else if (scope === 'gm-parcel-augment') {
          const line = this.gmParcelDraft.items[lineIndex]
          if (!line) return
          this.$set(line.augment_refs, index, clone(item))
          this.$set(line, `augment_${index + 1}`, Number(item.id))
        }
        this.$refs.itemLookupModal.hide()
      },
      clearItemLookupTarget () {
        const scope = this.itemLookup.scope
        const index = this.itemLookup.index
        const lineIndex = this.itemLookup.lineIndex
        if (scope === 'parcel-augment') {
          this.$set(this.augmentRefs, index, null)
          this.$set(this.editModel, `augment_${index + 1}`, 0)
        } else if (scope === 'content-augment') {
          this.$set(this.contentAugmentRefs, index, null)
          this.$set(this.contentDraft, `augment_${index + 1}`, 0)
        } else if (scope === 'gm-parcel-augment') {
          const line = this.gmParcelDraft.items[lineIndex]
          if (line) {
            this.$set(line.augment_refs, index, null)
            this.$set(line, `augment_${index + 1}`, 0)
          }
        }
        this.$refs.itemLookupModal.hide()
      },
      async resolveItem (id) {
        if (!Number(id)) return null
        try {
          const response = await SpireApi.v1().get('/mail-parcels-editor/items', { params: { q: String(id) } })
          return (response.data.data || []).find(item => Number(item.id) === Number(id)) || null
        } catch (error) {
          return null
        }
      },
      async hydrateParcelReferences () {
        const item = await this.resolveItem(this.editModel.item_id)
        if (item) this.selectedItem = item
        const refs = await Promise.all(Array.from({ length: 6 }, (_, index) => this.resolveItem(this.parcelAugmentValue(index))))
        this.augmentRefs = refs
      },
      parcelAugmentValue (index) {
        return Number(this.editModel && this.editModel[`augment_${index + 1}`]) || 0
      },
      contentAugmentValue (index) {
        return Number(this.contentDraft[`augment_${index + 1}`]) || 0
      },
      openContentModal (content = null) {
        this.contentDraft = content
          ? Object.assign({}, clone(content), { reason: '' })
          : Object.assign(emptyContent(), {
            parcel_id: Number(this.editModel.id),
            slot_id: this.nextContentSlot()
          })
        this.selectedContentItem = content
          ? { id: content.item_id, name: content.item_name, icon: content.item_icon, no_drop: content.item_no_drop }
          : null
        this.contentAugmentRefs = [null, null, null, null, null, null]
        this.$refs.contentModal.show()
        if (content) this.hydrateContentReferences()
      },
      resetContentDraft () {
        this.contentDraft = emptyContent()
        this.selectedContentItem = null
        this.contentAugmentRefs = [null, null, null, null, null, null]
      },
      nextContentSlot () {
        const occupied = new Set(this.parcelContent.map(content => Number(content.slot_id)))
        const capacity = Number(this.selectedItem && this.selectedItem.bag_slots) || 1
        for (let slot = 0; slot < capacity; slot++) {
          if (!occupied.has(slot)) return slot
        }
        return 0
      },
      async hydrateContentReferences () {
        const item = await this.resolveItem(this.contentDraft.item_id)
        if (item) this.selectedContentItem = item
        this.contentAugmentRefs = await Promise.all(
          Array.from({ length: 6 }, (_, index) => this.resolveItem(this.contentAugmentValue(index)))
        )
      },
      async saveParcelContent () {
        if (!this.canSaveContent) return
        this.operationBusy = true
        try {
          const payload = Object.assign({}, pick(this.contentDraft, CONTENT_FIELDS), {
            reason: this.contentDraft.reason.trim()
          })
          if (this.contentDraft.id) {
            await SpireApi.v1().patch(
              `/mail-parcels-editor/parcel/${this.editModel.id}/content/${this.contentDraft.id}`,
              payload
            )
          } else {
            await SpireApi.v1().put(`/mail-parcels-editor/parcel/${this.editModel.id}/content`, payload)
          }
          this.$refs.contentModal.hide()
          const currentID = Number(this.editModel.id)
          this.selectedId = null
          await this.selectRecord(currentID, false)
          await this.loadSummary()
          this.notify('Packed item saved.')
        } catch (error) {
          this.notify(this.apiError(error, 'Could not save packed item.'), 'error')
        } finally {
          this.operationBusy = false
        }
      },
      async loadAudit () {
        if (this.isCreating || !this.editModel) return
        this.loadingAudit = true
        this.auditError = ''
        try {
          const id = this.mode === 'mail' ? this.editModel.msg_id : this.editModel.id
          const response = await SpireApi.v1().get('/mail-parcels-editor/audit', {
            params: { kind: this.mode === 'mail' ? 'mail' : 'parcel', id, limit: 50 }
          })
          this.auditEntries = response.data.data || []
        } catch (error) {
          this.auditError = this.apiError(error, 'Could not load audit history.')
        } finally {
          this.loadingAudit = false
        }
      },
      auditLabel (eventName) {
        return String(eventName || '')
          .replace('MAIL_PARCELS_', '')
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, value => value.toUpperCase())
      },
      auditIcon (eventName) {
        if (String(eventName).includes('DELETE')) return 'fa fa-trash'
        if (String(eventName).includes('CREATE')) return 'fa fa-plus'
        return 'fa fa-pencil'
      },
      mailStatusLabel (status) {
        const option = this.mailStatusOptions.find(value => value.value === Number(status))
        return option ? option.label : `Legacy status ${status}`
      },
      mailStatusIcon (status) {
        if (Number(status) === 1) return 'fa fa-envelope'
        if (Number(status) === 3) return 'fa fa-envelope-open'
        if (Number(status) === 4) return 'fa fa-trash'
        return 'fa fa-question-circle'
      },
      mailStatusClass (status) {
        if (Number(status) === 1) return 'delivery-status-chip--unread'
        if (Number(status) === 3) return 'delivery-status-chip--read'
        if (Number(status) === 4) return 'delivery-status-chip--trash'
        return 'delivery-status-chip--legacy'
      },
      isUnknownMailStatus (status) {
        return ![1, 3, 4].includes(Number(status))
      },
      formatUnix (timestamp) {
        if (!Number(timestamp)) return 'No sent time'
        return this.formatDateTime(new Date(Number(timestamp) * 1000))
      },
      formatDateTime (value) {
        const date = value instanceof Date ? value : new Date(value)
        if (Number.isNaN(date.getTime())) return 'Unknown time'
        return date.toLocaleString()
      },
      formatParcelDate (value, timestamp = 0) {
        if (Number(timestamp) > 0) return this.formatDateTime(new Date(Number(timestamp) * 1000))
        if (!value) return 'No sent time'
        return this.formatDateTime(String(value).replace(' ', 'T'))
      },
      sqlDateTime (value) {
        if (!value) return ''
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return ''
        return date.toISOString()
      },
      openItemEditor (id) {
        if (Number(id) > 0) this.$router.push(`/item/${id}`)
      },
      notify (message, type = 'success') {
        clearTimeout(this.notification.timer)
        this.notification = { message, type, timer: null }
        this.notification.timer = setTimeout(() => {
          this.notification.message = ''
        }, type === 'error' ? 7000 : 4200)
      }
    }
  }
</script>

<style src="../../../assets/css/content-editor-workspace.css"></style>

<style scoped>
  .mail-parcels-mode-switch {
    background: rgba(5, 11, 17, 0.88);
    border: 1px solid rgba(210, 170, 69, 0.36);
    display: grid;
    gap: 6px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-bottom: 12px;
    padding: 6px;
  }

  .mail-parcels-mode-switch > button {
    align-items: center;
    background: rgba(8, 17, 25, 0.76);
    border: 1px solid rgba(178, 191, 204, 0.17);
    color: #9fa9b2;
    display: grid;
    gap: 10px;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    min-height: 48px;
    padding: 7px 10px;
    text-align: left;
  }

  .mail-parcels-mode-switch > button > i {
    color: #a8b0b7;
    font-size: 17px;
    text-align: center;
  }

  .mail-parcels-mode-switch strong,
  .mail-parcels-mode-switch small {
    display: block;
  }

  .mail-parcels-mode-switch strong {
    color: #d7dbde;
    font-size: 11px;
  }

  .mail-parcels-mode-switch small {
    color: #77838d;
    font-size: 9px;
    margin-top: 1px;
  }

  .mail-parcels-mode-switch b {
    color: #7f8992;
    font-size: 10px;
  }

  .mail-parcels-mode-switch > button:hover,
  .mail-parcels-mode-switch > button.active {
    background: linear-gradient(90deg, rgba(210, 170, 69, 0.16), rgba(11, 22, 31, 0.9));
    border-color: rgba(210, 170, 69, 0.58);
  }

  .mail-parcels-mode-switch > button.active > i,
  .mail-parcels-mode-switch > button.active strong,
  .mail-parcels-mode-switch > button.active b {
    color: #e8c85f;
  }

  .mail-parcels-command-bar {
    align-items: center;
    background:
      linear-gradient(90deg, rgba(210, 170, 69, 0.1), rgba(5, 12, 19, 0.92) 42%),
      rgba(5, 12, 19, 0.9);
    border: 1px solid rgba(210, 170, 69, 0.31);
    display: flex;
    gap: 14px;
    justify-content: space-between;
    margin: -5px 0 12px;
    padding: 9px 11px;
  }

  .mail-parcels-command-bar strong,
  .mail-parcels-command-bar small {
    display: block;
  }

  .mail-parcels-command-bar strong {
    color: #dce0e2;
    font-size: 11px;
  }

  .mail-parcels-command-bar small {
    color: #7f8a93;
    font-size: 8px;
    margin-top: 2px;
  }

  .mail-parcels-command-bar__actions {
    display: flex;
    flex: 0 0 auto;
    gap: 6px;
  }

  .mail-parcels-directory-actions {
    display: flex;
    flex: 0 0 auto;
    gap: 5px;
  }

  .mail-parcels-directory-actions .btn:first-child {
    align-items: center;
    display: inline-flex;
    justify-content: center;
    min-width: 30px;
    padding-left: 7px;
    padding-right: 7px;
  }

  .delivery-status-chip {
    align-items: center;
    border: 1px solid currentColor;
    display: inline-flex;
    font-size: 7px;
    font-style: normal;
    font-weight: 800;
    gap: 4px;
    letter-spacing: 0.045em;
    line-height: 1;
    margin-top: 4px;
    padding: 3px 5px;
    text-transform: uppercase;
    width: max-content;
  }

  .delivery-status-chip--header {
    margin-top: 6px;
  }

  .delivery-status-chip--unread {
    background: rgba(46, 164, 112, 0.12);
    color: #6ed3a6;
  }

  .delivery-status-chip--read {
    background: rgba(92, 137, 177, 0.13);
    color: #88b3d5;
  }

  .delivery-status-chip--trash {
    background: rgba(180, 66, 66, 0.13);
    color: #e18383;
  }

  .delivery-status-chip--queued {
    background: rgba(210, 170, 69, 0.11);
    color: #e0c164;
  }

  .delivery-status-chip--legacy {
    background: rgba(194, 118, 55, 0.14);
    color: #e7a766;
  }

  .mail-body {
    min-height: 220px;
    resize: vertical;
  }

  .mail-client-preview {
    background:
      linear-gradient(rgba(5, 13, 20, 0.82), rgba(5, 13, 20, 0.92)),
      radial-gradient(circle at 80% 0, rgba(210, 170, 69, 0.13), transparent 42%);
    border: 1px solid rgba(210, 170, 69, 0.34);
    margin-top: 18px;
    min-height: 170px;
    padding: 16px;
  }

  .mail-client-preview__top {
    color: #8f9aa4;
    display: flex;
    font-size: 9px;
    font-weight: 700;
    justify-content: space-between;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .mail-client-preview__top i {
    color: #d4af4d;
  }

  .mail-client-preview h4 {
    color: #e7ce82;
    font-family: Georgia, "Times New Roman", serif;
    margin: 17px 0 3px;
  }

  .mail-client-preview__meta {
    color: #7f8b94;
    font-size: 9px;
  }

  .mail-client-preview p {
    color: #c8cdd1;
    font-size: 11px;
    line-height: 1.6;
    margin: 14px 0 0;
    white-space: pre-wrap;
  }

  .delivery-layout,
  .parcel-package-layout {
    display: grid;
    gap: 16px;
    grid-template-columns: minmax(250px, 0.8fr) minmax(0, 1.2fr);
  }

  .reference-results,
  .item-lookup-results {
    background: rgba(0, 0, 0, 0.75);
    border: 1px solid rgba(210, 170, 69, 0.35);
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.42);
    max-height: 260px;
    overflow-y: auto;
    position: relative;
    z-index: 4;
  }

  .reference-results > button,
  .item-lookup-results > button {
    align-items: center;
    background: rgba(8, 16, 23, 0.94);
    border: 0;
    border-bottom: 1px solid rgba(178, 191, 204, 0.12);
    color: #cdd1d4;
    display: flex;
    font-size: 10px;
    gap: 9px;
    justify-content: space-between;
    padding: 8px 9px;
    text-align: left;
    width: 100%;
  }

  .reference-results > button:hover,
  .item-lookup-results > button:hover {
    background: rgba(210, 170, 69, 0.14);
  }

  .reference-results strong,
  .reference-results small,
  .item-lookup-results strong,
  .item-lookup-results small {
    display: block;
  }

  .reference-results small,
  .item-lookup-results small {
    color: #7d8993;
    font-size: 8px;
    margin-top: 2px;
  }

  .selected-reference-card {
    align-items: center;
    background: rgba(8, 17, 24, 0.85);
    border: 1px solid rgba(210, 170, 69, 0.32);
    display: grid;
    gap: 9px;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    margin-top: 8px;
    padding: 8px;
  }

  .selected-reference-card__icon {
    align-items: center;
    background: rgba(210, 170, 69, 0.12);
    color: #e0ba51;
    display: flex;
    height: 34px;
    justify-content: center;
    width: 34px;
  }

  .selected-reference-card strong,
  .selected-reference-card small {
    display: block;
  }

  .selected-reference-card strong {
    color: #e2e4e6;
    font-size: 11px;
  }

  .selected-reference-card small {
    color: #7d8993;
    font-size: 8px;
    margin-top: 2px;
  }

  .selected-reference-card > button {
    background: transparent;
    border: 0;
    color: #c9a84a;
    height: 30px;
    width: 30px;
  }

  .status-editor {
    align-items: center;
    background: rgba(5, 13, 20, 0.75);
    border: 1px solid rgba(178, 191, 204, 0.16);
    display: flex;
    gap: 20px;
    justify-content: space-between;
    margin-top: 18px;
    padding: 12px;
  }

  .status-editor strong,
  .status-editor small {
    display: block;
  }

  .status-editor strong {
    color: #e5c568;
    font-size: 12px;
    margin: 2px 0;
  }

  .status-editor small {
    color: #7e8993;
    font-size: 8px;
  }

  .status-editor__options {
    display: flex;
    gap: 4px;
  }

  .status-editor__options button {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(178, 191, 204, 0.2);
    color: #8f9aa4;
    font-size: 9px;
    min-width: 72px;
    padding: 7px 9px;
  }

  .status-editor__options button i {
    margin-right: 5px;
  }

  .status-editor__options button:hover,
  .status-editor__options button.active {
    background: rgba(210, 170, 69, 0.16);
    border-color: rgba(210, 170, 69, 0.55);
    color: #e9cb6e;
  }

  .status-editor__options button.legacy {
    border-color: rgba(194, 118, 55, 0.56);
    color: #e7a766;
  }

  .item-selector {
    align-items: center;
    background: rgba(5, 13, 20, 0.84);
    border: 1px solid rgba(178, 191, 204, 0.25);
    color: #cdd2d6;
    display: grid;
    gap: 10px;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    min-height: 50px;
    padding: 7px 9px;
    text-align: left;
    width: 100%;
  }

  .item-selector:hover {
    border-color: rgba(210, 170, 69, 0.58);
  }

  .item-selector__icon,
  .item-lookup-results__icon {
    align-items: center;
    background: rgba(210, 170, 69, 0.1);
    border: 1px solid rgba(210, 170, 69, 0.22);
    display: flex;
    height: 38px;
    justify-content: center;
    width: 38px;
  }

  .item-selector strong,
  .item-selector small {
    display: block;
  }

  .item-selector strong {
    color: #e1e4e6;
    font-size: 11px;
  }

  .item-selector small {
    color: #7e8992;
    font-size: 8px;
    margin-top: 2px;
  }

  .item-selector > i {
    color: #c9a84b;
  }

  .parcel-item-selection {
    background:
      radial-gradient(circle at 10% 20%, rgba(210, 170, 69, 0.1), transparent 42%),
      rgba(4, 12, 19, 0.82);
    border: 1px solid rgba(210, 170, 69, 0.32);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.34);
  }

  .parcel-item-selection > .parcel-item-selection__main {
    align-items: center;
    background: transparent;
    border: 0;
    color: #cdd2d6;
    display: grid;
    gap: 11px;
    grid-template-columns: 46px minmax(0, 1fr) auto;
    min-height: 66px;
    padding: 9px 10px;
    text-align: left;
    transition: background-color 120ms ease;
    width: 100%;
  }

  .parcel-item-selection > .parcel-item-selection__main:hover,
  .parcel-item-selection > .parcel-item-selection__main:focus-visible {
    background: rgba(210, 170, 69, 0.09);
    outline: 1px solid rgba(224, 187, 84, 0.7);
    outline-offset: -1px;
  }

  .parcel-item-selection__icon {
    align-items: center;
    background: rgba(210, 170, 69, 0.1);
    border: 1px solid rgba(210, 170, 69, 0.28);
    display: flex;
    height: 46px;
    justify-content: center;
    width: 46px;
  }

  .parcel-item-selection__identity {
    min-width: 0;
  }

  .parcel-item-selection__identity strong,
  .parcel-item-selection__identity small {
    display: block;
  }

  .parcel-item-selection__identity strong {
    color: #e6ca70;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 13px;
    line-height: 1.2;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .parcel-item-selection__identity small {
    color: #818d96;
    font-size: 8px;
    margin-top: 3px;
  }

  .parcel-item-selection__change {
    align-items: center;
    border: 1px solid rgba(210, 170, 69, 0.38);
    color: #d4b753;
    display: inline-flex;
    font-size: 8px;
    gap: 5px;
    padding: 5px 7px;
    text-transform: uppercase;
  }

  .parcel-item-selection__context {
    align-items: center;
    border-top: 1px solid rgba(178, 191, 204, 0.13);
    display: flex;
    gap: 10px;
    justify-content: space-between;
    padding: 7px 9px;
  }

  .parcel-item-selection__traits {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .parcel-item-selection__traits span {
    align-items: center;
    background: rgba(0, 0, 0, 0.24);
    border: 1px solid rgba(178, 191, 204, 0.14);
    color: #8f9aa3;
    display: inline-flex;
    font-size: 7px;
    gap: 4px;
    padding: 3px 5px;
  }

  .parcel-item-selection__traits span.warning {
    border-color: rgba(224, 169, 63, 0.34);
    color: #ddb553;
  }

  .parcel-item-selection__context > button {
    background: transparent;
    border: 0;
    color: #cfb456;
    flex: 0 0 auto;
    font-size: 8px;
    padding: 4px 2px;
    white-space: nowrap;
  }

  .parcel-item-selection__context > button:hover,
  .parcel-item-selection__context > button:focus-visible {
    color: #f0d373;
    text-decoration: underline;
  }

  .parcel-preview {
    background:
      radial-gradient(circle at 75% 20%, rgba(210, 170, 69, 0.12), transparent 44%),
      rgba(4, 12, 19, 0.82);
    border: 1px solid rgba(210, 170, 69, 0.3);
    padding: 13px;
  }

  .parcel-preview__item {
    align-items: center;
    display: flex;
    gap: 11px;
    margin: 14px 0;
  }

  .parcel-preview__item > span {
    align-items: center;
    background: rgba(210, 170, 69, 0.11);
    border: 1px solid rgba(210, 170, 69, 0.28);
    display: flex;
    height: 52px;
    justify-content: center;
    width: 52px;
  }

  .parcel-preview h4 {
    color: #e7cb77;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 15px;
    margin: 0 0 2px;
  }

  .parcel-preview p {
    color: #8b959d;
    font-size: 9px;
    margin: 0;
  }

  .parcel-preview dl {
    display: grid;
    gap: 5px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin: 0;
  }

  .parcel-preview dl div {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(178, 191, 204, 0.12);
    padding: 7px;
  }

  .parcel-preview dt {
    color: #737f89;
    font-size: 7px;
    text-transform: uppercase;
  }

  .parcel-preview dd {
    color: #cdd2d5;
    font-size: 9px;
    margin: 2px 0 0;
  }

  .augment-section {
    border-top: 1px solid rgba(178, 191, 204, 0.14);
    margin-top: 18px;
    padding-top: 13px;
  }

  .augment-section__heading {
    align-items: flex-end;
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .augment-section__heading strong,
  .augment-section__heading small {
    display: block;
  }

  .augment-section__heading strong {
    color: #d8dce0;
    font-size: 10px;
  }

  .augment-section__heading small {
    color: #747f89;
    font-size: 8px;
  }

  .augment-grid {
    display: grid;
    gap: 5px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .augment-grid button {
    align-items: center;
    background: rgba(5, 13, 20, 0.7);
    border: 1px solid rgba(178, 191, 204, 0.15);
    color: #8e99a2;
    display: grid;
    gap: 7px;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    padding: 6px;
    text-align: left;
  }

  .augment-grid button:hover {
    background: rgba(210, 170, 69, 0.1);
    border-color: rgba(210, 170, 69, 0.4);
  }

  .augment-slot {
    align-items: center;
    background: rgba(210, 170, 69, 0.12);
    color: #dbb957;
    display: flex;
    font-size: 9px;
    height: 24px;
    justify-content: center;
    width: 24px;
  }

  .augment-grid strong,
  .augment-grid small {
    display: block;
  }

  .augment-grid strong {
    color: #cfd3d6;
    font-size: 9px;
  }

  .augment-grid small {
    color: #707b85;
    font-size: 7px;
    margin-top: 1px;
  }

  .parcel-content-empty {
    align-items: center;
    color: #86919a;
    display: flex;
    flex-direction: column;
    min-height: 280px;
    justify-content: center;
    text-align: center;
  }

  .parcel-content-empty > i {
    color: #cba947;
    font-size: 28px;
  }

  .parcel-content-empty h4 {
    color: #d4d8db;
    font-size: 12px;
    margin: 10px 0 3px;
  }

  .parcel-content-empty p {
    font-size: 9px;
  }

  .parcel-content-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .parcel-content-list > button {
    align-items: center;
    background: rgba(5, 13, 20, 0.75);
    border: 1px solid rgba(178, 191, 204, 0.14);
    color: #cfd3d5;
    display: grid;
    gap: 9px;
    grid-template-columns: 28px 34px minmax(0, 1fr) auto;
    padding: 7px;
    text-align: left;
  }

  .parcel-content-list > button:hover {
    background: rgba(210, 170, 69, 0.1);
    border-color: rgba(210, 170, 69, 0.4);
  }

  .parcel-content-list__slot {
    align-items: center;
    background: rgba(210, 170, 69, 0.1);
    color: #d8b44f;
    display: flex;
    font-size: 9px;
    height: 28px;
    justify-content: center;
  }

  .parcel-content-list__icon {
    align-items: center;
    display: flex;
    height: 34px;
    justify-content: center;
    width: 34px;
  }

  .parcel-content-list strong,
  .parcel-content-list small {
    display: block;
  }

  .parcel-content-list strong {
    font-size: 10px;
  }

  .parcel-content-list small {
    color: #76818b;
    font-size: 8px;
    margin-top: 2px;
  }

  .delivery-safety {
    align-items: center;
    background: rgba(210, 170, 69, 0.08);
    border: 1px solid rgba(210, 170, 69, 0.27);
    display: grid;
    gap: 12px;
    grid-template-columns: 42px minmax(0, 1fr);
    margin-top: 18px;
    padding: 11px;
  }

  .delivery-safety > div:first-child {
    align-items: center;
    border: 1px solid rgba(210, 170, 69, 0.28);
    color: #d6b34e;
    display: flex;
    height: 42px;
    justify-content: center;
  }

  .delivery-safety h4 {
    color: #e1c56b;
    font-size: 11px;
    margin: 2px 0;
  }

  .delivery-safety p {
    color: #929ca4;
    font-size: 8px;
    margin: 0;
  }

  .mail-parcels-audit-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .mail-parcels-audit-list article {
    align-items: center;
    background: rgba(5, 13, 20, 0.72);
    border: 1px solid rgba(178, 191, 204, 0.13);
    display: grid;
    gap: 9px;
    grid-template-columns: 32px minmax(0, 1fr) auto;
    padding: 8px;
  }

  .audit-icon {
    align-items: center;
    background: rgba(210, 170, 69, 0.1);
    color: #d6b24d;
    display: flex;
    height: 30px;
    justify-content: center;
    width: 30px;
  }

  .mail-parcels-audit-list strong {
    color: #d7dbde;
    font-size: 10px;
  }

  .mail-parcels-audit-list p {
    color: #979fa6;
    font-size: 8px;
    margin: 2px 0;
  }

  .mail-parcels-audit-list small,
  .mail-parcels-audit-list article > span:last-child {
    color: #707b84;
    font-size: 7px;
  }

  .operation-summary,
  .danger-heading {
    align-items: center;
    background: rgba(210, 170, 69, 0.08);
    border: 1px solid rgba(210, 170, 69, 0.26);
    display: grid;
    gap: 10px;
    grid-template-columns: 38px minmax(0, 1fr);
    margin-bottom: 14px;
    padding: 10px;
  }

  .operation-summary > i,
  .danger-heading > i {
    color: #d5b14c;
    font-size: 20px;
    text-align: center;
  }

  .operation-summary strong,
  .operation-summary p,
  .danger-heading strong,
  .danger-heading span {
    display: block;
  }

  .operation-summary strong,
  .danger-heading strong {
    color: #e0e3e5;
    font-size: 11px;
  }

  .operation-summary p,
  .danger-heading span {
    color: #8d979f;
    font-size: 8px;
    margin: 2px 0 0;
  }

  .danger-heading {
    background: rgba(134, 35, 35, 0.1);
    border-color: rgba(205, 67, 67, 0.35);
  }

  .danger-heading > i {
    color: #e35c5c;
  }

  .modal-actions {
    display: flex;
    gap: 7px;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .lookup-state {
    color: #89949d;
    font-size: 9px;
    min-height: 120px;
    padding: 34px 10px;
    text-align: center;
  }

  .item-lookup-results {
    margin-top: 9px;
  }

  .item-lookup-results > button {
    display: grid;
    gap: 9px;
    grid-template-columns: 38px minmax(0, 1fr) auto;
  }

  .item-lookup-clear {
    margin-top: 7px;
    text-align: right;
  }

  .item-lookup-clear button {
    background: transparent;
    border: 0;
    color: #bf9d44;
    font-size: 8px;
  }

  .augment-section--modal {
    margin-top: 14px;
  }

  .spire-editor-grid-span {
    grid-column: 1 / -1;
  }

  .context-label {
    color: #cba847;
    display: block;
    font-size: 7px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .gm-workflow-steps {
    display: grid;
    gap: 5px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-bottom: 14px;
  }

  .gm-workflow-steps span {
    align-items: center;
    background: rgba(5, 13, 20, 0.78);
    border: 1px solid rgba(178, 191, 204, 0.14);
    color: #7d8892;
    display: flex;
    font-size: 8px;
    gap: 6px;
    padding: 6px 8px;
    text-transform: uppercase;
  }

  .gm-workflow-steps b {
    align-items: center;
    border: 1px solid currentColor;
    display: inline-flex;
    height: 18px;
    justify-content: center;
    width: 18px;
  }

  .gm-workflow-steps span.active {
    background: rgba(210, 170, 69, 0.12);
    border-color: rgba(210, 170, 69, 0.48);
    color: #e2c360;
  }

  .gm-audience-switch {
    display: grid;
    gap: 7px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gm-audience-switch > button {
    align-items: center;
    background: rgba(5, 13, 20, 0.8);
    border: 1px solid rgba(178, 191, 204, 0.18);
    color: #939da5;
    display: grid;
    gap: 10px;
    grid-template-columns: 30px minmax(0, 1fr);
    padding: 10px;
    text-align: left;
  }

  .gm-audience-switch > button > i {
    color: #99a3ab;
    font-size: 17px;
    text-align: center;
  }

  .gm-audience-switch strong,
  .gm-audience-switch small {
    display: block;
  }

  .gm-audience-switch strong {
    color: #d7dbde;
    font-size: 10px;
  }

  .gm-audience-switch small {
    color: #7a858e;
    font-size: 8px;
    margin-top: 2px;
  }

  .gm-audience-switch > button:hover,
  .gm-audience-switch > button.active {
    background: rgba(210, 170, 69, 0.12);
    border-color: rgba(210, 170, 69, 0.5);
  }

  .gm-audience-switch > button.active > i,
  .gm-audience-switch > button.active strong {
    color: #e3c463;
  }

  .gm-recipient-builder {
    margin-top: 12px;
    position: relative;
  }

  .gm-recipient-chips,
  .gm-review-recipients {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 8px;
  }

  .gm-recipient-chips > span,
  .gm-review-recipients > span {
    align-items: center;
    background: rgba(210, 170, 69, 0.09);
    border: 1px solid rgba(210, 170, 69, 0.27);
    color: #d7dbde;
    display: inline-flex;
    font-size: 8px;
    gap: 5px;
    padding: 4px 6px;
  }

  .gm-recipient-chips > span > i {
    color: #d5b34f;
  }

  .gm-recipient-chips button {
    background: transparent;
    border: 0;
    color: #9aa4ac;
    line-height: 1;
    padding: 1px 0 1px 3px;
  }

  .gm-inline-state {
    border: 1px dashed rgba(178, 191, 204, 0.2);
    color: #808b94;
    font-size: 8px;
    margin-top: 8px;
    padding: 8px;
  }

  .gm-broadcast-preview,
  .gm-parcel-rule {
    align-items: center;
    background: rgba(210, 170, 69, 0.08);
    border: 1px solid rgba(210, 170, 69, 0.29);
    display: grid;
    gap: 10px;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    margin-top: 12px;
    min-height: 50px;
    padding: 8px 10px;
  }

  .gm-parcel-rule {
    grid-template-columns: 34px minmax(0, 1fr);
    margin-top: 0;
  }

  .gm-broadcast-preview > i,
  .gm-parcel-rule > i {
    color: #d7b64f;
    font-size: 18px;
    text-align: center;
  }

  .gm-broadcast-preview strong,
  .gm-broadcast-preview small,
  .gm-parcel-rule strong,
  .gm-parcel-rule small {
    display: block;
  }

  .gm-broadcast-preview strong,
  .gm-parcel-rule strong {
    color: #e1c46b;
    font-size: 10px;
  }

  .gm-broadcast-preview small,
  .gm-parcel-rule small {
    color: #858f98;
    font-size: 8px;
    margin-top: 2px;
  }

  .gm-broadcast-preview > button {
    background: rgba(0, 0, 0, 0.26);
    border: 1px solid currentColor;
    color: #d5b454;
    font-size: 8px;
    padding: 5px 7px;
  }

  .gm-broadcast-preview.error {
    background: rgba(135, 42, 42, 0.1);
    border-color: rgba(216, 78, 78, 0.37);
  }

  .gm-broadcast-preview.error > i,
  .gm-broadcast-preview.error strong {
    color: #e47b7b;
  }

  .gm-message-body {
    min-height: 125px;
    resize: vertical;
  }

  .gm-review-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: minmax(220px, 0.7fr) minmax(0, 1.3fr);
  }

  .gm-review-card {
    background: rgba(5, 13, 20, 0.76);
    border: 1px solid rgba(178, 191, 204, 0.16);
    padding: 13px;
  }

  .gm-review-card h4,
  .gm-delivery-result h4 {
    color: #e4c86f;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 15px;
    margin: 4px 0;
  }

  .gm-review-card p,
  .gm-delivery-result p {
    color: #89949c;
    font-size: 8px;
    margin: 0;
  }

  .gm-review-message {
    margin-top: 0;
    min-height: 150px;
  }

  .gm-confirmation {
    background: rgba(210, 170, 69, 0.07);
    border: 1px solid rgba(210, 170, 69, 0.28);
    margin-top: 12px;
    padding: 11px;
  }

  .gm-confirmation--danger {
    background: rgba(143, 38, 38, 0.1);
    border-color: rgba(217, 70, 70, 0.4);
  }

  .gm-confirmation > div {
    align-items: center;
    display: grid;
    gap: 9px;
    grid-template-columns: 28px minmax(0, 1fr);
    margin-bottom: 9px;
  }

  .gm-confirmation > div > i {
    color: #deb957;
    font-size: 17px;
    text-align: center;
  }

  .gm-confirmation--danger > div > i {
    color: #e36f6f;
  }

  .gm-confirmation strong,
  .gm-confirmation small {
    display: block;
  }

  .gm-confirmation strong {
    color: #dce0e2;
    font-size: 10px;
  }

  .gm-confirmation small {
    color: #818c95;
    font-size: 8px;
    margin-top: 2px;
  }

  .gm-confirmation label {
    color: #cdb058;
    font-size: 8px;
    margin-bottom: 4px;
  }

  .gm-delivery-result {
    align-items: center;
    background:
      radial-gradient(circle at 12% 20%, rgba(67, 168, 113, 0.13), transparent 34%),
      rgba(5, 13, 20, 0.82);
    border: 1px solid rgba(92, 191, 136, 0.34);
    display: grid;
    gap: 13px;
    grid-template-columns: 54px minmax(0, 1fr);
    min-height: 190px;
    padding: 18px;
  }

  .gm-delivery-result__icon {
    align-items: center;
    border: 1px solid rgba(92, 191, 136, 0.45);
    color: #71d4a2;
    display: flex;
    font-size: 22px;
    height: 52px;
    justify-content: center;
    width: 52px;
  }

  .gm-parcel-lines {
    border-top: 1px solid rgba(178, 191, 204, 0.14);
    margin-top: 16px;
    padding-top: 12px;
  }

  .gm-parcel-lines__heading {
    align-items: flex-end;
    display: flex;
    justify-content: space-between;
    margin-bottom: 7px;
  }

  .gm-parcel-lines__heading strong {
    color: #d9dde0;
    display: block;
    font-size: 10px;
  }

  .gm-parcel-line {
    align-items: start;
    background: rgba(5, 13, 20, 0.75);
    border: 1px solid rgba(178, 191, 204, 0.14);
    display: grid;
    gap: 8px;
    grid-template-columns: 25px minmax(0, 1fr) 28px;
    margin-bottom: 6px;
    padding: 7px;
  }

  .gm-parcel-line__number {
    align-items: center;
    background: rgba(210, 170, 69, 0.12);
    color: #d9b84f;
    display: flex;
    font-size: 9px;
    height: 25px;
    justify-content: center;
  }

  .gm-parcel-line__configuration {
    display: grid;
    gap: 7px;
    grid-template-columns: repeat(2, minmax(0, 130px));
    margin-top: 7px;
  }

  .gm-parcel-line__remove {
    background: rgba(128, 37, 37, 0.11);
    border: 1px solid rgba(214, 76, 76, 0.28);
    color: #d66565;
    height: 28px;
  }

  .gm-parcel-line__remove:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }

  .gm-parcel-augments {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 7px;
  }

  .gm-parcel-augments > .context-label {
    flex-basis: 100%;
  }

  .gm-parcel-augments > button {
    align-items: center;
    background: rgba(0, 0, 0, 0.23);
    border: 1px solid rgba(210, 170, 69, 0.23);
    color: #89939b;
    display: grid;
    gap: 6px;
    grid-template-columns: 20px minmax(80px, 1fr) auto;
    min-width: 150px;
    padding: 4px;
    text-align: left;
  }

  .gm-parcel-augments b {
    align-items: center;
    background: rgba(210, 170, 69, 0.12);
    color: #d8b650;
    display: flex;
    height: 20px;
    justify-content: center;
  }

  .gm-parcel-augments strong,
  .gm-parcel-augments small {
    display: block;
  }

  .gm-parcel-augments strong {
    color: #d0d4d7;
    font-size: 8px;
  }

  .gm-parcel-augments small {
    color: #747f88;
    font-size: 7px;
  }

  .gm-parcel-review-list,
  .gm-parcel-result-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 10px;
  }

  .gm-parcel-review-list article {
    align-items: center;
    background: rgba(5, 13, 20, 0.76);
    border: 1px solid rgba(178, 191, 204, 0.14);
    display: grid;
    gap: 8px;
    grid-template-columns: 38px minmax(0, 1fr) auto;
    padding: 7px;
  }

  .gm-parcel-review-list__icon {
    align-items: center;
    background: rgba(210, 170, 69, 0.1);
    display: flex;
    height: 36px;
    justify-content: center;
    width: 36px;
  }

  .gm-parcel-review-list strong,
  .gm-parcel-review-list small {
    display: block;
  }

  .gm-parcel-review-list strong {
    color: #d7dbde;
    font-size: 9px;
  }

  .gm-parcel-review-list small {
    color: #7b8690;
    font-size: 7px;
    margin-top: 2px;
  }

  .gm-parcel-result-list {
    grid-column: 1 / -1;
  }

  .gm-parcel-result-list > span {
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(178, 191, 204, 0.13);
    color: #cdd2d5;
    display: grid;
    font-size: 8px;
    gap: 7px;
    grid-template-columns: auto minmax(0, 1fr) auto;
    padding: 6px;
  }

  .gm-parcel-result-list b {
    color: #d7b64f;
  }

  @media (max-width: 1050px) {
    .spire-editor-workspace {
      grid-template-columns: 1fr;
    }

    .spire-editor-directory-list {
      max-height: 360px;
      min-height: 0;
    }

    .delivery-layout,
    .parcel-package-layout {
      grid-template-columns: 1fr;
    }

    .augment-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .gm-review-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .mail-parcels-mode-switch {
      grid-template-columns: 1fr;
    }

    .mail-parcels-command-bar {
      align-items: stretch;
      flex-direction: column;
    }

    .mail-parcels-command-bar__actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .mail-parcels-mode-switch small {
      display: none;
    }

    .status-editor {
      align-items: stretch;
      flex-direction: column;
    }

    .status-editor__options {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .status-editor__options button {
      min-width: 0;
    }

    .augment-grid {
      grid-template-columns: 1fr;
    }

    .parcel-preview dl {
      grid-template-columns: 1fr;
    }

    .parcel-item-selection__context {
      align-items: flex-start;
      flex-direction: column;
    }

    .gm-audience-switch,
    .gm-review-grid {
      grid-template-columns: 1fr;
    }

    .gm-parcel-line {
      grid-template-columns: 22px minmax(0, 1fr) 28px;
    }

    .gm-parcel-line__configuration {
      grid-template-columns: 1fr;
    }

    .gm-parcel-review-list article,
    .gm-parcel-result-list > span {
      grid-template-columns: 36px minmax(0, 1fr);
    }

    .gm-parcel-review-list .delivery-status-chip,
    .gm-parcel-result-list .delivery-status-chip {
      grid-column: 2;
    }

    .gm-delivery-result {
      align-items: start;
      grid-template-columns: 42px minmax(0, 1fr);
      padding: 12px;
    }

    .gm-delivery-result__icon {
      font-size: 17px;
      height: 40px;
      width: 40px;
    }
  }
</style>
