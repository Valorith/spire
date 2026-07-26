<template>
  <content-area class="spire-editor-page player-operations-page">
    <div class="spire-editor-toolbar">
      <div>
        <div class="spire-editor-kicker">Admin · player services</div>
        <h1 class="spire-editor-title">
          <i class="ra ra-player mr-1"></i> Player Operations
        </h1>
        <p class="spire-editor-subtitle">
          Resolve character, account, and guild work with live ownership context and audited safety controls.
        </p>
      </div>
      <div class="spire-editor-summary" aria-label="Player operations summary">
        <span><strong>{{ number(summary.characters) }}</strong> characters</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(summary.accounts) }}</strong> accounts</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(summary.guilds) }}</strong> guilds</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(summary.online_characters) }}</strong> online</span>
      </div>
    </div>

    <div class="operations-mode-switch" role="tablist" aria-label="Player operations record type">
      <button
        v-for="option in modes"
        :key="option.value"
        type="button"
        role="tab"
        :aria-selected="mode === option.value ? 'true' : 'false'"
        :class="{ active: mode === option.value }"
        @click="selectMode(option.value)"
      >
        <i :class="option.icon"></i>
        <span>{{ option.label }}</span>
        <small>{{ modeCount(option.value) }}</small>
      </button>
    </div>

    <div class="spire-editor-workspace">
      <aside class="spire-editor-directory">
        <eq-window :title="modeTitle">
          <div class="spire-editor-directory-controls">
            <div class="spire-editor-search">
              <i class="fa fa-search"></i>
              <input
                id="player-operations-directory-search"
                v-model.trim="search"
                class="form-control form-control-sm"
                :placeholder="searchPlaceholder"
                @input="queueDirectorySearch"
              >
              <button
                v-if="search"
                class="spire-editor-search-clear"
                type="button"
                aria-label="Clear search"
                @click="search = ''; currentPage = 1; loadDirectory()"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <b-button
              v-if="mode === 'guilds'"
              size="sm"
              variant="outline-warning"
              data-testid="player-operations-new-guild"
              @click="createGuildDraft"
            >
              <i class="fa fa-plus mr-1"></i>New
            </b-button>
            <span v-else class="directory-readonly-badge" title="Players and accounts are created by the game/login services">
              <i class="fa fa-shield"></i>
            </span>
          </div>

          <div v-if="directoryFilters.length" class="spire-editor-filter" role="group" :aria-label="modeTitle + ' filter'">
            <button
              v-for="filter in directoryFilters"
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

          <div class="spire-editor-directory-list" data-testid="player-operations-directory">
            <button
              v-for="record in records"
              :key="mode + '-' + record.id"
              class="spire-editor-directory-row"
              :class="{ active: Number(selectedID) === Number(record.id) && !isCreating }"
              type="button"
              @click="selectRecord(record.id)"
            >
              <span class="spire-editor-directory-icon">
                <img
                  v-if="mode === 'characters' && characterIcon(record)"
                  :src="characterIcon(record)"
                  alt=""
                >
                <i v-else :class="modeIcon"></i>
              </span>
              <span class="spire-editor-directory-body">
                <span class="spire-editor-directory-name">{{ recordTitle(record) }}</span>
                <span class="spire-editor-directory-detail">{{ recordDetail(record) }}</span>
              </span>
              <span class="spire-editor-directory-aside">
                <i v-if="record.online" class="fa fa-circle directory-online" aria-label="Online"></i>
                #{{ record.id }}
              </span>
            </button>

            <div v-if="directoryError" class="spire-editor-directory-state spire-editor-directory-state--error" role="alert">
              <i class="fa fa-exclamation-triangle"></i>
              <span>{{ directoryError }}</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="loadDirectory">Retry</button>
            </div>
            <div v-else-if="loadingDirectory && !records.length" class="spire-editor-directory-state">
              <i class="fa fa-spinner fa-spin"></i>
              <span>Loading live {{ modeTitle.toLowerCase() }}…</span>
            </div>
            <div v-else-if="!records.length" class="spire-editor-directory-state">
              <i class="fa fa-search"></i>
              <span>{{ emptyDirectoryMessage }}</span>
              <button v-if="mode === 'guilds'" class="btn btn-sm btn-outline-warning" type="button" @click="createGuildDraft">
                Create a guild
              </button>
            </div>
          </div>

          <nav v-if="totalPages > 1" class="spire-editor-pagination" :aria-label="modeTitle + ' pages'">
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
        <eq-window v-if="!detail && detailError" :title="workspaceTitle">
          <div class="spire-editor-empty spire-editor-empty--error" role="alert">
            <div class="spire-editor-empty__sigil"><i class="fa fa-exclamation-triangle"></i></div>
            <h3>{{ workspaceTitle }} could not be loaded</h3>
            <p>{{ detailError }}</p>
            <b-button size="sm" variant="outline-warning" @click="reloadSelected">
              <i class="fa fa-refresh mr-1"></i>Retry
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="!detail && !loadingDetail" :title="workspaceTitle">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i :class="modeIcon"></i></div>
            <h3>Select {{ indefiniteModeLabel }}</h3>
            <p>{{ emptyWorkspaceMessage }}</p>
            <b-button v-if="mode === 'guilds'" size="sm" variant="outline-warning" @click="createGuildDraft">
              <i class="fa fa-plus mr-1"></i>Create guild
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="loadingDetail && !detail" :title="workspaceTitle">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading operational context…</h3>
          </div>
        </eq-window>

        <div v-if="detail && editModel" data-testid="player-operations-inspector">
          <eq-window :title="recordWindowTitle" class="mb-2">
            <div class="spire-editor-header">
              <div class="spire-editor-identity">
                <span class="spire-editor-identity-icon">
                  <img v-if="mode === 'characters' && selectedCharacterIcon" :src="selectedCharacterIcon" alt="">
                  <i v-else :class="modeIcon"></i>
                </span>
                <div>
                  <div class="spire-editor-eyebrow">
                    {{ recordEyebrow }}
                    <span v-if="hasUnsavedChanges" class="spire-editor-unsaved">
                      <i class="fa fa-circle"></i> Unsaved
                    </span>
                  </div>
                  <h2>{{ recordHeading }}</h2>
                  <p>{{ recordSubheading }}</p>
                </div>
              </div>
              <div class="spire-editor-actions">
                <b-button
                  v-if="mode === 'characters' && !isCreating"
                  size="sm"
                  :variant="editModel.deleted_at ? 'outline-success' : 'outline-danger'"
                  :disabled="hasUnsavedChanges"
                  data-testid="player-operations-character-lifecycle"
                  @click="openLifecycleModal"
                >
                  <i :class="editModel.deleted_at ? 'fa fa-undo' : 'fa fa-archive'" class="mr-1"></i>
                  {{ editModel.deleted_at ? 'Restore' : 'Retire' }}
                </b-button>
                <b-button
                  v-if="mode === 'accounts' && !isCreating"
                  size="sm"
                  variant="outline-danger"
                  :disabled="hasUnsavedChanges || accountCharacterCount > 0"
                  data-testid="player-operations-account-delete"
                  @click="openDeleteModal"
                >
                  <i class="fa fa-trash mr-1"></i>Delete
                </b-button>
                <b-button
                  v-if="mode === 'guilds' && !isCreating"
                  size="sm"
                  variant="outline-danger"
                  :disabled="hasUnsavedChanges || guildBankCount > 0"
                  data-testid="player-operations-guild-delete"
                  @click="openDeleteModal"
                >
                  <i class="fa fa-trash mr-1"></i>Disband
                </b-button>
                <b-button
                  v-if="hasUnsavedChanges"
                  size="sm"
                  variant="outline-secondary"
                  data-testid="player-operations-reset"
                  @click="resetEditor"
                >
                  <i class="fa fa-undo mr-1"></i>Reset
                </b-button>
                <b-button
                  size="sm"
                  variant="outline-warning"
                  :disabled="!canSave || saving"
                  data-testid="player-operations-save"
                  @click="savePrimary"
                >
                  <i :class="saving ? 'fa fa-spinner fa-spin' : 'fa fa-save'" class="mr-1"></i>
                  {{ saving ? 'Saving' : (isCreating ? 'Create' : 'Save') }}
                </b-button>
              </div>
            </div>
          </eq-window>

          <eq-window title="Workspace">
            <div class="spire-editor-tabs" role="tablist" :aria-label="recordWindowTitle + ' sections'">
              <button
                v-for="tab in tabs"
                :key="tab"
                type="button"
                role="tab"
                :aria-selected="selectedTab === tab ? 'true' : 'false'"
                :class="{ active: selectedTab === tab }"
                @click="selectTab(tab)"
              >
                {{ tab }}
              </button>
            </div>

            <character-overview
              v-if="mode === 'characters' && selectedTab === 'Overview'"
              :model="editModel"
              :race-options="raceOptions"
              :class-options="classOptions"
              :deity-options="deityOptions"
              :validation="validationMessages"
              @input="editModel = $event"
            />

            <section v-if="mode === 'characters' && selectedTab === 'Location'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <span class="spire-editor-section-kicker">World position</span>
                  <h3>Safe, explicit character relocation</h3>
                </div>
                <small>Every move requires a reason and checks that the current zone has not changed.</small>
              </div>
              <div class="operations-two-column">
                <div class="spire-editor-context-card spire-editor-context-card--gold">
                  <span class="spire-editor-context-label">Current location</span>
                  <h4>{{ characterZoneLabel }}</h4>
                  <p>
                    Zone #{{ editModel.zone_id }} · instance {{ editModel.zone_instance || 0 }}
                    · {{ coordinateSummary(editModel) }}
                  </p>
                  <div class="zone-position-grid">
                    <span><small>X</small><strong>{{ decimal(editModel.x) }}</strong></span>
                    <span><small>Y</small><strong>{{ decimal(editModel.y) }}</strong></span>
                    <span><small>Z</small><strong>{{ decimal(editModel.z) }}</strong></span>
                    <span><small>H</small><strong>{{ decimal(editModel.heading) }}</strong></span>
                  </div>
                </div>
                <div class="operations-action-card">
                  <div class="spire-editor-field">
                    <label for="player-operations-zone-search">Destination zone</label>
                    <div class="spire-editor-search operations-inline-search">
                      <i class="fa fa-map-marker"></i>
                      <input
                        id="player-operations-zone-search"
                        v-model.trim="zoneSearch"
                        class="form-control form-control-sm"
                        placeholder="Search zone name or exact ID…"
                        @input="queueLookup('zones')"
                      >
                    </div>
                    <div v-if="lookupKind === 'zones' && (lookupLoading || lookupResults.length)" class="spire-editor-selector-results">
                      <div v-if="lookupLoading" class="operations-selector-state"><i class="fa fa-spinner fa-spin"></i> Searching zones…</div>
                      <button v-for="zone in lookupResults" :key="'zone-' + zone.id + '-' + zone.version" type="button" @click="selectZone(zone)">
                        <span>
                          <strong>{{ zone.long_name || zone.short_name }}</strong>
                          <small>{{ zone.short_name }} · version {{ zone.version }}</small>
                        </span>
                        <small>#{{ zone.id }}</small>
                      </button>
                    </div>
                  </div>
                  <div v-if="relocation.zone" class="selected-operation-target">
                    <i class="ra ra-wooden-sign"></i>
                    <span>
                      <strong>{{ relocation.zone.long_name || relocation.zone.short_name }}</strong>
                      <small>#{{ relocation.zone.id }} · {{ relocation.zone.short_name }} · version {{ relocation.zone.version }}</small>
                    </span>
                    <button type="button" aria-label="Clear destination zone" @click="clearRelocation"><i class="fa fa-times"></i></button>
                  </div>
                  <label class="operations-check">
                    <input v-model="relocation.use_safe_coordinates" type="checkbox">
                    <span>Use the zone’s authoritative safe coordinates</span>
                  </label>
                  <div v-if="relocation.zone && !relocation.use_safe_coordinates" class="spire-editor-grid spire-editor-grid--two">
                    <div v-for="field in ['x', 'y', 'z', 'heading']" :key="'relocate-' + field" class="spire-editor-field">
                      <label :for="'player-operations-relocate-' + field">{{ field.toUpperCase() }}</label>
                      <input
                        :id="'player-operations-relocate-' + field"
                        v-model.number="relocation[field]"
                        class="form-control form-control-sm"
                        type="number"
                        step="0.1"
                      >
                    </div>
                  </div>
                  <div class="spire-editor-field operations-reason">
                    <label for="player-operations-relocation-reason">Required audit reason</label>
                    <input
                      id="player-operations-relocation-reason"
                      v-model.trim="relocation.reason"
                      class="form-control form-control-sm"
                      maxlength="240"
                      placeholder="Why is this character being moved?"
                    >
                  </div>
                  <b-button
                    size="sm"
                    variant="outline-warning"
                    :disabled="!canRelocate || operationBusy"
                    @click="relocateCharacter"
                  >
                    <i class="fa fa-map-marker mr-1"></i>Move character
                  </b-button>
                </div>
              </div>
              <div class="spire-editor-section-heading operations-subheading">
                <div>
                  <span class="spire-editor-section-kicker">Bind points</span>
                  <h3>Respawn and gate destinations</h3>
                </div>
                <small>Read-only operational context; bind editing belongs with a future dedicated character-state surface.</small>
              </div>
              <div v-if="detail.context.binds.length" class="operations-card-grid">
                <div v-for="bind in detail.context.binds" :key="'bind-' + bind.slot" class="operations-fact-card">
                  <span>Slot {{ bind.slot }}</span>
                  <strong>{{ bind.zone_name }}</strong>
                  <small>#{{ bind.zone_id }} · {{ coordinateSummary(bind) }}</small>
                </div>
              </div>
              <div v-else class="operations-empty-inline">No bind rows exist for this character.</div>
            </section>

            <section v-if="mode === 'characters' && selectedTab === 'Economy'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <span class="spire-editor-section-kicker">Base currency</span>
                  <h3>On-character and bank coin</h3>
                </div>
                <small>Optimistic balance checks prevent overwriting a concurrent server-side change.</small>
              </div>
              <div class="currency-ledger">
                <div v-for="field in currencyFields" :key="field.key" class="currency-ledger-row">
                  <span :class="'coin coin--' + field.tone"><i :class="field.icon"></i></span>
                  <label :for="'player-operations-currency-' + field.key">
                    <strong>{{ field.label }}</strong>
                    <small>{{ field.context }}</small>
                  </label>
                  <input
                    :id="'player-operations-currency-' + field.key"
                    v-model.number="currencyDraft[field.key]"
                    class="form-control form-control-sm"
                    type="number"
                    min="0"
                    step="1"
                  >
                </div>
              </div>
              <div class="operations-action-footer">
                <div class="spire-editor-field operations-reason">
                  <label for="player-operations-currency-reason">Required audit reason</label>
                  <input
                    id="player-operations-currency-reason"
                    v-model.trim="currencyReason"
                    class="form-control form-control-sm"
                    maxlength="240"
                    placeholder="Support case or correction being applied…"
                  >
                </div>
                <b-button
                  size="sm"
                  variant="outline-warning"
                  :disabled="!currencyChanged || currencyReason.length < 8 || operationBusy"
                  @click="saveCurrency"
                >
                  <i class="fa fa-save mr-1"></i>Save balances
                </b-button>
              </div>
              <div class="spire-editor-danger">
                <strong>Scope boundary</strong>
                <p>Inventory, keyring, alternate-currency, parcel, mail, and task records are summarized nearby but remain in their dedicated editors so this screen does not become an unsafe all-table form.</p>
              </div>
            </section>

            <section v-if="mode === 'characters' && selectedTab === 'Connections'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <span class="spire-editor-section-kicker">Ownership & membership</span>
                  <h3>Account and guild relationships</h3>
                </div>
                <small>Transfers are transactional, audited, and concurrency checked.</small>
              </div>
              <div class="operations-two-column">
                <div class="operations-action-card">
                  <span class="spire-editor-context-label">Account owner</span>
                  <div class="selected-operation-target selected-operation-target--static">
                    <i class="fa fa-id-card"></i>
                    <span>
                      <strong>{{ detail.context.account.name || 'Unknown account' }}</strong>
                      <small>#{{ detail.context.account.id }} · {{ accountStatusLabel(detail.context.account.status) }}</small>
                    </span>
                    <button type="button" title="Open this account" @click="openRelated('accounts', detail.context.account.id)">
                      <i class="fa fa-external-link"></i>
                    </button>
                  </div>
                  <div class="spire-editor-field">
                    <label for="player-operations-account-lookup">Transfer to another account</label>
                    <div class="spire-editor-search operations-inline-search">
                      <i class="fa fa-search"></i>
                      <input
                        id="player-operations-account-lookup"
                        v-model.trim="accountSearch"
                        class="form-control form-control-sm"
                        placeholder="Search account name or exact ID…"
                        @input="queueLookup('accounts')"
                      >
                    </div>
                    <div v-if="lookupKind === 'accounts' && (lookupLoading || lookupResults.length)" class="spire-editor-selector-results">
                      <div v-if="lookupLoading" class="operations-selector-state"><i class="fa fa-spinner fa-spin"></i> Searching accounts…</div>
                      <button v-for="account in lookupResults" :key="'account-' + account.id" type="button" @click="selectTransferAccount(account)">
                        <span>
                          <strong>{{ account.name }}</strong>
                          <small>{{ accountStatusLabel(account.status) }} · {{ account.character_count }} characters</small>
                        </span>
                        <small>#{{ account.id }}</small>
                      </button>
                    </div>
                  </div>
                  <div v-if="transferAccount" class="selected-operation-target">
                    <i class="fa fa-id-card"></i>
                    <span>
                      <strong>{{ transferAccount.name }}</strong>
                      <small>#{{ transferAccount.id }} · {{ transferAccount.character_count }} characters</small>
                    </span>
                    <button type="button" aria-label="Clear destination account" @click="transferAccount = null"><i class="fa fa-times"></i></button>
                  </div>
                  <div class="spire-editor-field operations-reason">
                    <label for="player-operations-transfer-reason">Required audit reason</label>
                    <input
                      id="player-operations-transfer-reason"
                      v-model.trim="transferReason"
                      class="form-control form-control-sm"
                      maxlength="240"
                      placeholder="Why is ownership changing?"
                    >
                  </div>
                  <b-button
                    size="sm"
                    variant="outline-warning"
                    :disabled="!transferAccount || transferReason.length < 8 || operationBusy"
                    @click="transferCharacter"
                  >
                    <i class="fa fa-exchange mr-1"></i>Transfer character
                  </b-button>
                </div>

                <div class="operations-action-card">
                  <span class="spire-editor-context-label">Guild membership</span>
                  <div v-if="detail.context.guild" class="selected-operation-target selected-operation-target--static">
                    <i class="ra ra-double-team"></i>
                    <span>
                      <strong>{{ detail.context.guild.guild_name }}</strong>
                      <small>#{{ detail.context.guild.guild_id }} · {{ detail.context.guild.rank_title }}</small>
                    </span>
                    <button type="button" title="Open this guild" @click="openRelated('guilds', detail.context.guild.guild_id)">
                      <i class="fa fa-external-link"></i>
                    </button>
                  </div>
                  <div v-else class="operations-empty-inline">This character is not in a guild.</div>
                  <div class="spire-editor-field">
                    <label for="player-operations-guild-lookup">Guild</label>
                    <div class="spire-editor-search operations-inline-search">
                      <i class="fa fa-search"></i>
                      <input
                        id="player-operations-guild-lookup"
                        v-model.trim="guildSearch"
                        class="form-control form-control-sm"
                        placeholder="Search guild name or exact ID…"
                        @input="queueLookup('guilds')"
                      >
                    </div>
                    <div v-if="lookupKind === 'guilds' && (lookupLoading || lookupResults.length)" class="spire-editor-selector-results">
                      <div v-if="lookupLoading" class="operations-selector-state"><i class="fa fa-spinner fa-spin"></i> Searching guilds…</div>
                      <button v-for="guild in lookupResults" :key="'guild-' + guild.id" type="button" @click="selectMembershipGuild(guild)">
                        <span>
                          <strong>{{ guild.name }}</strong>
                          <small>{{ guild.member_count }} members · leader {{ guild.leader_name || 'unassigned' }}</small>
                        </span>
                        <small>#{{ guild.id }}</small>
                      </button>
                    </div>
                  </div>
                  <div v-if="membershipGuild" class="selected-operation-target">
                    <i class="ra ra-double-team"></i>
                    <span>
                      <strong>{{ membershipGuild.name }}</strong>
                      <small>#{{ membershipGuild.id }} · {{ membershipGuild.member_count }} members</small>
                    </span>
                    <button type="button" aria-label="Clear selected guild" @click="membershipGuild = null"><i class="fa fa-times"></i></button>
                  </div>
                  <div class="spire-editor-grid spire-editor-grid--two operations-compact-grid">
                    <div class="spire-editor-field">
                      <label for="player-operations-guild-rank">Rank</label>
                      <select id="player-operations-guild-rank" v-model.number="membershipDraft.rank" class="form-control form-control-sm">
                        <option v-for="rank in 8" :key="'membership-rank-' + rank" :value="rank">{{ rank }} · {{ rankLabel(rank) }}</option>
                      </select>
                    </div>
                    <div class="operations-check-stack">
                      <label class="operations-check"><input v-model="membershipDraft.banker" type="checkbox"><span>Banker</span></label>
                      <label class="operations-check"><input v-model="membershipDraft.alt" type="checkbox"><span>Alt</span></label>
                      <label class="operations-check"><input v-model="membershipDraft.tribute_enabled" type="checkbox"><span>Tribute</span></label>
                    </div>
                  </div>
                  <div class="spire-editor-field">
                    <label for="player-operations-guild-note">Public note</label>
                    <input id="player-operations-guild-note" v-model="membershipDraft.public_note" class="form-control form-control-sm" maxlength="255">
                  </div>
                  <div class="spire-editor-field operations-reason">
                    <label for="player-operations-guild-reason">Required audit reason</label>
                    <input
                      id="player-operations-guild-reason"
                      v-model.trim="membershipDraft.reason"
                      class="form-control form-control-sm"
                      maxlength="240"
                      placeholder="Why is this membership changing?"
                    >
                  </div>
                  <div class="operations-button-row">
                    <b-button
                      size="sm"
                      variant="outline-warning"
                      :disabled="!membershipGuild || membershipDraft.reason.length < 8 || operationBusy"
                      @click="saveCharacterGuild"
                    >
                      <i class="fa fa-save mr-1"></i>Save membership
                    </b-button>
                    <b-button
                      v-if="detail.context.guild"
                      size="sm"
                      variant="outline-danger"
                      :disabled="membershipDraft.reason.length < 8 || operationBusy"
                      @click="removeCharacterGuild"
                    >
                      <i class="fa fa-times mr-1"></i>Remove
                    </b-button>
                  </div>
                </div>
              </div>

              <div class="spire-editor-section-heading operations-subheading">
                <div>
                  <span class="spire-editor-section-kicker">Related records</span>
                  <h3>Operational footprint</h3>
                </div>
                <small>Counts keep downstream impact visible without duplicating specialist editors.</small>
              </div>
              <div class="operations-card-grid operations-card-grid--four">
                <div v-for="item in relatedCountCards" :key="item.key" class="operations-fact-card">
                  <span>{{ item.label }}</span>
                  <strong>{{ number(item.value) }}</strong>
                  <small>{{ item.context }}</small>
                </div>
              </div>
            </section>

            <account-overview
              v-if="mode === 'accounts' && selectedTab === 'Overview'"
              :model="editModel"
              :status-options="accountStatuses"
              :validation="validationMessages"
              @input="editModel = $event"
            />

            <section v-if="mode === 'accounts' && selectedTab === 'Access & Safety'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <span class="spire-editor-section-kicker">Enforcement</span>
                  <h3>Suspension and ban controls</h3>
                </div>
                <small>Passwords and login credentials are intentionally never returned to this browser.</small>
              </div>
              <div class="operations-two-column">
                <div class="spire-editor-context-card" :class="{ 'spire-editor-context-card--gold': !accountSanctioned }">
                  <span class="spire-editor-context-label">Current account state</span>
                  <h4>{{ accountSanctioned ? 'Access restricted' : 'No active sanction' }}</h4>
                  <p v-if="accountSanctioned">
                    Until {{ dateTime(editModel.suspended_until) }}
                    · {{ editModel.ban_reason || editModel.suspension_reason || 'No legacy reason recorded' }}
                  </p>
                  <p v-else>The account can authenticate according to its status and server rules.</p>
                  <div class="operations-status-strip">
                    <span><small>Status</small><strong>{{ accountStatusLabel(editModel.status) }}</strong></span>
                    <span><small>Revoked</small><strong>{{ editModel.revoked ? 'Yes' : 'No' }}</strong></span>
                    <span><small>Hidden</small><strong>{{ editModel.hidden ? 'Yes' : 'No' }}</strong></span>
                  </div>
                </div>
                <div class="operations-action-card">
                  <div class="spire-editor-field">
                    <label for="player-operations-sanction-mode">Action</label>
                    <select id="player-operations-sanction-mode" v-model="sanction.mode" class="form-control form-control-sm">
                      <option value="suspend">Temporary suspension</option>
                      <option value="ban">Indefinite ban</option>
                      <option value="clear">Clear sanction</option>
                    </select>
                  </div>
                  <div v-if="sanction.mode === 'suspend'" class="spire-editor-field">
                    <label for="player-operations-sanction-until">Suspended until</label>
                    <input
                      id="player-operations-sanction-until"
                      v-model="sanction.until"
                      aria-describedby="player-operations-sanction-until-help"
                      class="form-control form-control-sm operations-datetime-control"
                      :min="minimumSanctionDateTime()"
                      step="60"
                      type="datetime-local"
                    >
                    <span id="player-operations-sanction-until-help" class="spire-editor-field-help">
                      Select local date and time; Spire stores the resulting UTC timestamp.
                    </span>
                  </div>
                  <div class="spire-editor-field operations-reason">
                    <label for="player-operations-sanction-reason">Required audit reason</label>
                    <textarea
                      id="player-operations-sanction-reason"
                      v-model.trim="sanction.reason"
                      class="form-control form-control-sm"
                      maxlength="240"
                      rows="3"
                      :placeholder="sanction.mode === 'clear' ? 'Why is the restriction being removed?' : 'Policy or support reason…'"
                    ></textarea>
                  </div>
                  <b-button
                    size="sm"
                    :variant="sanction.mode === 'clear' ? 'outline-success' : 'outline-danger'"
                    :disabled="!canApplySanction || operationBusy"
                    @click="applySanction"
                  >
                    <i :class="sanction.mode === 'clear' ? 'fa fa-unlock' : 'fa fa-gavel'" class="mr-1"></i>
                    {{ sanction.mode === 'clear' ? 'Clear sanction' : 'Apply restriction' }}
                  </b-button>
                </div>
              </div>
              <div class="spire-editor-danger">
                <strong>Deletion guard</strong>
                <p v-if="accountCharacterCount">This account still owns {{ accountCharacterCount }} character(s). Transfer every character, including retired records, before account deletion is enabled.</p>
                <p v-else>No character ownership remains. Account deletion will also remove account flags, IP history, rewards, GM IP rows, and shared-bank rows in one transaction.</p>
              </div>
            </section>

            <section v-if="mode === 'accounts' && selectedTab === 'Characters'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <span class="spire-editor-section-kicker">Ownership</span>
                  <h3>Characters on this account</h3>
                </div>
                <small>Select a row to continue in Character Operations.</small>
              </div>
              <div v-if="detail.characters.length" class="operations-table-wrap">
                <table class="operations-table">
                  <thead><tr><th>Character</th><th>Class / level</th><th>Location</th><th>Guild</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    <tr v-for="character in detail.characters" :key="'account-character-' + character.id">
                      <td>
                        <span class="operations-character-cell">
                          <img v-if="characterIcon(character)" :src="characterIcon(character)" alt="">
                          <span><strong>{{ character.name }}</strong><small>#{{ character.id }}</small></span>
                        </span>
                      </td>
                      <td>{{ className(character.class) }} · level {{ character.level }}</td>
                      <td>{{ character.zone_name || 'Zone #' + character.zone_id }}</td>
                      <td>{{ character.guild_name || 'None' }}</td>
                      <td>
                        <span v-if="character.deleted_at" class="operations-pill operations-pill--danger">Retired</span>
                        <span v-else-if="character.online" class="operations-pill operations-pill--success">Online</span>
                        <span v-else class="operations-pill">Offline</span>
                      </td>
                      <td><button class="operations-icon-button" type="button" :aria-label="'Open ' + character.name" @click="openRelated('characters', character.id)"><i class="fa fa-chevron-right"></i></button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="operations-empty-inline">No characters are assigned to this account.</div>
            </section>

            <section v-if="mode === 'accounts' && selectedTab === 'Activity'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <span class="spire-editor-section-kicker">Trace & entitlements</span>
                  <h3>Login history, flags, and rewards</h3>
                </div>
                <small>Operational context from the live account relationship tables.</small>
              </div>
              <div class="operations-two-column">
                <div class="spire-editor-context-card">
                  <span class="spire-editor-context-label">IP history</span>
                  <div v-if="detail.ips.length" class="operations-simple-list">
                    <div v-for="entry in detail.ips" :key="'ip-' + entry.ip">
                      <span><strong>{{ entry.ip }}</strong><small>{{ dateTime(entry.last_used) }}</small></span>
                      <em>{{ entry.count }} logins</em>
                    </div>
                  </div>
                  <p v-else>No IP history rows exist.</p>
                </div>
                <div class="spire-editor-context-card">
                  <span class="spire-editor-context-label">Account flags</span>
                  <div v-if="detail.flags.length" class="operations-simple-list">
                    <div v-for="flag in detail.flags" :key="'flag-' + flag.name">
                      <span><strong>{{ flag.name }}</strong><small>{{ flag.value }}</small></span>
                    </div>
                  </div>
                  <p v-else>No account flags are set.</p>
                </div>
              </div>
              <div class="spire-editor-section-heading operations-subheading">
                <div>
                  <span class="spire-editor-section-kicker">Veteran rewards</span>
                  <h3>Granted reward balances</h3>
                </div>
              </div>
              <div v-if="detail.rewards.length" class="operations-card-grid">
                <div v-for="reward in detail.rewards" :key="'reward-' + reward.reward_id" class="operations-fact-card">
                  <span>Reward #{{ reward.reward_id }}</span><strong>{{ reward.amount }}</strong><small>grants remaining</small>
                </div>
              </div>
              <div v-else class="operations-empty-inline">No veteran reward rows exist.</div>
            </section>

            <guild-overview
              v-if="mode === 'guilds' && selectedTab === 'Overview'"
              :model="editModel"
              :is-creating="isCreating"
              :validation="validationMessages"
              @input="editModel = $event"
            />

            <section v-if="mode === 'guilds' && selectedTab === 'Members'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <span class="spire-editor-section-kicker">Roster</span>
                  <h3>Members, rank, and operational flags</h3>
                </div>
                <b-button size="sm" variant="outline-warning" @click="openMemberModal()">
                  <i class="fa fa-plus mr-1"></i>Add member
                </b-button>
              </div>
              <div v-if="detail.members.length" class="operations-table-wrap">
                <table class="operations-table">
                  <thead><tr><th>Member</th><th>Rank</th><th>Account</th><th>Flags</th><th>Location</th><th></th></tr></thead>
                  <tbody>
                    <tr v-for="member in detail.members" :key="'guild-member-' + member.id">
                      <td>
                        <span class="operations-character-cell">
                          <img v-if="characterIcon(member)" :src="characterIcon(member)" alt="">
                          <span><strong>{{ member.name }}</strong><small>#{{ member.id }} · L{{ member.level }} {{ className(member.class) }}</small></span>
                        </span>
                      </td>
                      <td>{{ membershipFor(member).rank_title || rankLabel(member.guild_rank) }}</td>
                      <td>{{ member.account_name || '#' + member.account_id }}</td>
                      <td>
                        <span v-if="membershipFor(member).banker" class="operations-pill">Banker</span>
                        <span v-if="membershipFor(member).alt" class="operations-pill">Alt</span>
                        <span v-if="membershipFor(member).tribute" class="operations-pill">Tribute</span>
                      </td>
                      <td>{{ member.zone_name || 'Zone #' + member.zone_id }}</td>
                      <td class="operations-actions-cell">
                        <button class="operations-icon-button" type="button" :aria-label="'Open ' + member.name" @click="openRelated('characters', member.id)"><i class="fa fa-external-link"></i></button>
                        <button class="operations-icon-button" type="button" :aria-label="'Edit ' + member.name" @click="openMemberModal(member, membershipFor(member))"><i class="fa fa-pencil"></i></button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="operations-empty-inline">This guild has no members yet.</div>
            </section>

            <section v-if="mode === 'guilds' && selectedTab === 'Ranks & Access'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <span class="spire-editor-section-kicker">Authority model</span>
                  <h3>Rank titles and permission matrix</h3>
                </div>
                <small>Permissions preserve the server’s eight-rank bitmask while presenting named actions.</small>
              </div>
              <div class="rank-title-grid">
                <div v-for="rank in accessDraft.ranks" :key="'rank-title-' + rank.rank" class="spire-editor-field">
                  <label :for="'player-operations-rank-' + rank.rank">Rank {{ rank.rank }}</label>
                  <input :id="'player-operations-rank-' + rank.rank" v-model="rank.title" class="form-control form-control-sm" maxlength="128">
                </div>
              </div>
              <div class="permission-matrix-wrap">
                <table class="permission-matrix">
                  <thead>
                    <tr>
                      <th>Permission</th>
                      <th v-for="rank in accessDraft.ranks" :key="'permission-heading-' + rank.rank" :title="rank.title">{{ rank.rank }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="permission in permissionCatalog" :key="'permission-' + permission.id">
                      <td><strong>{{ permission.label }}</strong><small>{{ permission.context }}</small></td>
                      <td v-for="rank in accessDraft.ranks" :key="'permission-' + permission.id + '-rank-' + rank.rank">
                        <label class="permission-check">
                          <input
                            type="checkbox"
                            :checked="permissionEnabled(permission.id, rank.rank)"
                            :aria-label="permission.label + ' for ' + rank.title"
                            @change="setPermission(permission.id, rank.rank, $event.target.checked)"
                          >
                          <span></span>
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="operations-action-footer">
                <div class="spire-editor-field operations-reason">
                  <label for="player-operations-access-reason">Required audit reason</label>
                  <input
                    id="player-operations-access-reason"
                    v-model.trim="accessDraft.reason"
                    class="form-control form-control-sm"
                    maxlength="240"
                    placeholder="Why are guild access rules changing?"
                  >
                </div>
                <b-button
                  size="sm"
                  variant="outline-warning"
                  :disabled="accessDraft.reason.length < 8 || operationBusy"
                  @click="saveGuildAccess"
                >
                  <i class="fa fa-save mr-1"></i>Save access model
                </b-button>
              </div>
            </section>

            <section v-if="mode === 'guilds' && selectedTab === 'Assets'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <span class="spire-editor-section-kicker">Guild footprint</span>
                  <h3>Bank, tribute, and relations</h3>
                </div>
                <small>High-value context stays nearby; item manipulation remains in the future Inventory workspace.</small>
              </div>
              <div class="operations-card-grid operations-card-grid--four">
                <div class="operations-fact-card"><span>Bank items</span><strong>{{ number(detail.bank.item_count) }}</strong><small>{{ number(detail.bank.slots_used) }} slots used</small></div>
                <div class="operations-fact-card"><span>Favor</span><strong>{{ number(editModel.favor) }}</strong><small>guild favor</small></div>
                <div class="operations-fact-card"><span>Tribute</span><strong>{{ number(editModel.tribute) }}</strong><small>tribute balance</small></div>
                <div class="operations-fact-card"><span>Relations</span><strong>{{ number(detail.relations.length) }}</strong><small>guild links</small></div>
              </div>
              <div v-if="detail.tribute" class="spire-editor-context-card spire-editor-context-card--gold operations-tribute-card">
                <span class="spire-editor-context-label">Active guild tribute</span>
                <div class="operations-status-strip">
                  <span><small>State</small><strong>{{ detail.tribute.enabled ? 'Enabled' : 'Disabled' }}</strong></span>
                  <span><small>Slot 1</small><strong>#{{ detail.tribute.tribute_id_1 }} · tier {{ detail.tribute.tribute_tier_1 + 1 }}</strong></span>
                  <span><small>Slot 2</small><strong>#{{ detail.tribute.tribute_id_2 }} · tier {{ detail.tribute.tribute_tier_2 + 1 }}</strong></span>
                  <span><small>Remaining</small><strong>{{ duration(detail.tribute.time_remaining) }}</strong></span>
                </div>
              </div>
              <div v-else class="operations-empty-inline">No guild tribute configuration exists.</div>
              <div class="spire-editor-danger">
                <strong>Safe disband rule</strong>
                <p v-if="guildBankCount">Disbanding is blocked while {{ guildBankCount }} guild-bank item(s) remain.</p>
                <p v-else>Disbanding removes members, ranks, permissions, tribute, and relations transactionally after exact-name confirmation.</p>
              </div>
            </section>
          </eq-window>
        </div>
      </main>
    </div>

    <b-modal
      id="player-operations-confirm-modal"
      ref="confirmModal"
      :title="confirmModal.title"
      hide-header-close
      no-close-on-backdrop
      @hidden="resetConfirmModal"
    >
      <div class="operations-confirm-content">
        <div class="operations-confirm-icon" :class="{ danger: confirmModal.danger }">
          <i :class="confirmModal.icon"></i>
        </div>
        <div>
          <h4>{{ confirmModal.heading }}</h4>
          <p>{{ confirmModal.message }}</p>
        </div>
      </div>
      <div class="spire-editor-field">
        <label for="player-operations-confirm-reason">Required audit reason</label>
        <textarea
          id="player-operations-confirm-reason"
          v-model.trim="confirmModal.reason"
          class="form-control form-control-sm"
          maxlength="240"
          rows="3"
          placeholder="Record the operational reason…"
        ></textarea>
      </div>
      <div class="spire-editor-field mt-3">
        <label for="player-operations-confirm-text">Type <code>{{ confirmModal.expected }}</code> to confirm</label>
        <input id="player-operations-confirm-text" v-model="confirmModal.confirmation" class="form-control form-control-sm" autocomplete="off">
      </div>
      <template #modal-footer>
        <b-button size="sm" variant="outline-secondary" @click="$refs.confirmModal.hide()">Cancel</b-button>
        <b-button
          size="sm"
          :variant="confirmModal.danger ? 'outline-danger' : 'outline-warning'"
          :disabled="!canSubmitConfirmation || operationBusy"
          @click="submitConfirmation"
        >
          <i :class="operationBusy ? 'fa fa-spinner fa-spin' : confirmModal.icon" class="mr-1"></i>
          {{ confirmModal.submitLabel }}
        </b-button>
      </template>
    </b-modal>

    <b-modal
      id="player-operations-member-modal"
      ref="memberModal"
      :title="memberDraft.editing ? 'Edit guild member' : 'Add guild member'"
      hide-header-close
      no-close-on-backdrop
      @hidden="resetMemberModal"
    >
      <div v-if="!memberDraft.character" class="spire-editor-field">
        <label for="player-operations-member-search">Character</label>
        <div class="spire-editor-search operations-inline-search">
          <i class="fa fa-search"></i>
          <input
            id="player-operations-member-search"
            v-model.trim="characterSearch"
            class="form-control form-control-sm"
            placeholder="Search character name or exact ID…"
            @input="queueLookup('characters')"
          >
        </div>
        <div v-if="lookupKind === 'characters' && (lookupLoading || lookupResults.length)" class="member-selector-results">
          <div v-if="lookupLoading" class="operations-selector-state"><i class="fa fa-spinner fa-spin"></i> Searching characters…</div>
          <button v-for="character in lookupResults" :key="'member-character-' + character.id" type="button" @click="selectMemberCharacter(character)">
            <img v-if="characterIcon(character)" :src="characterIcon(character)" alt="">
            <span><strong>{{ character.name }}</strong><small>#{{ character.id }} · L{{ character.level }} {{ className(character.class) }} · {{ character.guild_name || 'No guild' }}</small></span>
          </button>
        </div>
      </div>
      <div v-else class="selected-operation-target">
        <img v-if="characterIcon(memberDraft.character)" :src="characterIcon(memberDraft.character)" alt="">
        <i v-else class="ra ra-player"></i>
        <span><strong>{{ memberDraft.character.name }}</strong><small>#{{ memberDraft.character.id }} · L{{ memberDraft.character.level }} {{ className(memberDraft.character.class) }}</small></span>
        <button v-if="!memberDraft.editing" type="button" aria-label="Clear character" @click="memberDraft.character = null"><i class="fa fa-times"></i></button>
      </div>
      <div class="spire-editor-grid spire-editor-grid--two mt-3">
        <div class="spire-editor-field">
          <label for="player-operations-member-rank">Rank</label>
          <select id="player-operations-member-rank" v-model.number="memberDraft.rank" class="form-control form-control-sm">
            <option v-for="rank in detail ? detail.ranks : []" :key="'member-rank-' + rank.rank" :value="rank.rank">{{ rank.rank }} · {{ rank.title }}</option>
          </select>
        </div>
        <div class="operations-check-stack operations-check-stack--modal">
          <label class="operations-check"><input v-model="memberDraft.banker" type="checkbox"><span>Banker</span></label>
          <label class="operations-check"><input v-model="memberDraft.alt" type="checkbox"><span>Alt character</span></label>
          <label class="operations-check"><input v-model="memberDraft.tribute_enabled" type="checkbox"><span>Tribute enabled</span></label>
        </div>
      </div>
      <div class="spire-editor-field mt-3">
        <label for="player-operations-member-note">Public note</label>
        <input id="player-operations-member-note" v-model="memberDraft.public_note" class="form-control form-control-sm">
      </div>
      <div class="spire-editor-field mt-3">
        <label for="player-operations-member-reason">Required audit reason</label>
        <textarea id="player-operations-member-reason" v-model.trim="memberDraft.reason" class="form-control form-control-sm" maxlength="240" rows="3"></textarea>
      </div>
      <template #modal-footer>
        <b-button
          v-if="memberDraft.editing"
          size="sm"
          variant="outline-danger"
          :disabled="memberDraft.reason.length < 8 || operationBusy"
          @click="removeGuildMember"
        >
          <i class="fa fa-user-times mr-1"></i>Remove
        </b-button>
        <span class="operations-modal-spacer"></span>
        <b-button size="sm" variant="outline-secondary" @click="$refs.memberModal.hide()">Cancel</b-button>
        <b-button
          size="sm"
          variant="outline-warning"
          :disabled="!canSaveMember || operationBusy"
          @click="saveGuildMember"
        >
          <i :class="operationBusy ? 'fa fa-spinner fa-spin' : 'fa fa-save'" class="mr-1"></i>Save member
        </b-button>
      </template>
    </b-modal>

    <transition name="spire-editor-fade">
      <div v-if="notification.message" class="spire-editor-notification" :class="{ error: notification.type === 'error' }" role="status">
        <i :class="notification.type === 'error' ? 'fa fa-exclamation-triangle' : 'fa fa-check-circle'"></i>
        {{ notification.message }}
      </div>
    </transition>
  </content-area>
</template>

<script>
import ContentArea from '@/components/layout/ContentArea.vue'
import EqWindow from '@/components/eq-ui/EQWindow.vue'
import CharacterOverview from './components/CharacterOverview.vue'
import AccountOverview from './components/AccountOverview.vue'
import GuildOverview from './components/GuildOverview.vue'
import { SpireApi } from '@/app/api/spire-api'
import { DB_PLAYER_RACES } from '@/app/constants/eq-races-constants'
import { DB_PLAYER_CLASSES } from '@/app/constants/eq-classes-constants'
import { DB_DIETIES_FULL } from '@/app/constants/eq-deities-constants'
import { DB_CLASSES_ICONS } from '@/app/constants/eq-class-icon-constants'

const clone = value => JSON.parse(JSON.stringify(value))

const CHARACTER_FIELDS = [
  'name', 'last_name', 'title', 'suffix', 'gender', 'race', 'class', 'level', 'deity',
  'anon', 'gm', 'experience_enabled', 'aa_points', 'practice_points', 'pvp', 'show_helm',
  'group_auto_consent', 'raid_auto_consent', 'guild_auto_consent', 'autosplit',
  'looking_for_group', 'looking_for_players'
]

const ACCOUNT_FIELDS = [
  'character_name', 'auto_login_name', 'shared_platinum', 'status', 'gm_speed',
  'invulnerable', 'fly_mode', 'ignore_tells', 'revoked', 'karma', 'mini_login_ip',
  'hidden', 'rules_accepted'
]

const GUILD_FIELDS = ['name', 'leader_id', 'min_status', 'motd', 'channel', 'url', 'tribute', 'favor']

function pick (record, fields) {
  const result = {}
  fields.forEach(field => { result[field] = record ? record[field] : undefined })
  return result
}

function emptySummary () {
  return {
    accounts: 0,
    suspended_accounts: 0,
    characters: 0,
    online_characters: 0,
    retired_characters: 0,
    guilds: 0,
    guild_members: 0
  }
}

export default {
  name: 'PlayerOperations',
  components: { ContentArea, EqWindow, CharacterOverview, AccountOverview, GuildOverview },
  data () {
    return {
      modes: [
        { value: 'characters', label: 'Characters', icon: 'ra ra-player' },
        { value: 'accounts', label: 'Accounts', icon: 'fa fa-id-card' },
        { value: 'guilds', label: 'Guilds', icon: 'ra ra-double-team' }
      ],
      mode: 'characters',
      selectedTab: 'Overview',
      selectedID: null,
      isCreating: false,
      summary: emptySummary(),
      records: [],
      totalRecords: 0,
      currentPage: 1,
      pageSize: 30,
      search: '',
      stateFilter: 'active',
      loadingDirectory: false,
      loadingDetail: false,
      saving: false,
      operationBusy: false,
      directoryError: '',
      detailError: '',
      detail: null,
      editModel: null,
      originalModel: null,
      searchTimer: null,
      lookupTimer: null,
      lookupKind: '',
      lookupLoading: false,
      lookupResults: [],
      zoneSearch: '',
      accountSearch: '',
      guildSearch: '',
      characterSearch: '',
      relocation: {
        zone: null,
        use_safe_coordinates: true,
        x: 0,
        y: 0,
        z: 0,
        heading: 0,
        reason: ''
      },
      transferAccount: null,
      transferReason: '',
      membershipGuild: null,
      membershipDraft: {
        rank: 5,
        banker: false,
        alt: false,
        tribute_enabled: false,
        public_note: '',
        reason: ''
      },
      currencyDraft: {},
      currencyOriginal: {},
      currencyReason: '',
      sanction: {
        mode: 'suspend',
        until: '',
        reason: ''
      },
      accessDraft: {
        ranks: [],
        permissions: [],
        reason: ''
      },
      memberDraft: {
        editing: false,
        character: null,
        rank: 5,
        banker: false,
        alt: false,
        tribute_enabled: false,
        public_note: '',
        reason: ''
      },
      confirmModal: {
        action: '',
        title: '',
        heading: '',
        message: '',
        icon: 'fa fa-exclamation-triangle',
        danger: true,
        expected: '',
        confirmation: '',
        reason: '',
        submitLabel: 'Confirm'
      },
      notification: {
        message: '',
        type: 'success',
        timer: null
      },
      accountStatuses: [
        { value: -1, label: 'Banned / disabled (-1)' },
        { value: 0, label: 'Player (0)' },
        { value: 10, label: 'Steward (10)' },
        { value: 20, label: 'Apprentice Guide (20)' },
        { value: 50, label: 'Guide (50)' },
        { value: 80, label: 'Quest Troupe (80)' },
        { value: 100, label: 'GM (100)' },
        { value: 150, label: 'Senior GM (150)' },
        { value: 200, label: 'Administrator (200)' },
        { value: 250, label: 'Server owner (250)' }
      ],
      currencyFields: [
        { key: 'platinum', label: 'Platinum', context: 'On character', tone: 'platinum', icon: 'ra ra-gem-pendant' },
        { key: 'gold', label: 'Gold', context: 'On character', tone: 'gold', icon: 'ra ra-gold-bar' },
        { key: 'silver', label: 'Silver', context: 'On character', tone: 'silver', icon: 'ra ra-gold-bar' },
        { key: 'copper', label: 'Copper', context: 'On character', tone: 'copper', icon: 'ra ra-gold-bar' },
        { key: 'platinum_bank', label: 'Platinum', context: 'Bank', tone: 'platinum', icon: 'ra ra-gem-pendant' },
        { key: 'gold_bank', label: 'Gold', context: 'Bank', tone: 'gold', icon: 'ra ra-gold-bar' },
        { key: 'silver_bank', label: 'Silver', context: 'Bank', tone: 'silver', icon: 'ra ra-gold-bar' },
        { key: 'copper_bank', label: 'Copper', context: 'Bank', tone: 'copper', icon: 'ra ra-gold-bar' },
        { key: 'radiant_crystals', label: 'Radiant crystals', context: 'Adventure currency', tone: 'radiant', icon: 'ra ra-crystal-cluster' },
        { key: 'ebon_crystals', label: 'Ebon crystals', context: 'Adventure currency', tone: 'ebon', icon: 'ra ra-crystal-cluster' }
      ],
      permissionCatalog: [
        { id: 1, label: 'Guild invite', context: 'Invite new members' },
        { id: 2, label: 'Guild remove', context: 'Remove members' },
        { id: 3, label: 'Promote members', context: 'Raise member rank' },
        { id: 4, label: 'Demote members', context: 'Lower member rank' },
        { id: 5, label: 'Set MOTD', context: 'Change guild message' },
        { id: 6, label: 'Set notes', context: 'Edit member notes' },
        { id: 7, label: 'Guild chat', context: 'Use officer or guild chat' },
        { id: 8, label: 'Guild bank deposit', context: 'Deposit items' },
        { id: 9, label: 'Guild bank withdraw', context: 'Withdraw items' },
        { id: 10, label: 'Guild bank promote', context: 'Move deposit items' },
        { id: 11, label: 'Guild bank view', context: 'View restricted items' },
        { id: 12, label: 'Guild tribute', context: 'Manage tribute settings' },
        { id: 13, label: 'Guild banner', context: 'Manage banner state' },
        { id: 14, label: 'Guild tools', context: 'Use administrative guild tools' }
      ]
    }
  },
  computed: {
    singularMode () {
      if (this.mode === 'characters') return 'character'
      if (this.mode === 'accounts') return 'account'
      return 'guild'
    },
    recordQueryKey () {
      return this.singularMode
    },
    modeTitle () {
      return this.modes.find(option => option.value === this.mode).label
    },
    modeIcon () {
      return this.modes.find(option => option.value === this.mode).icon
    },
    workspaceTitle () {
      return this.mode === 'characters' ? 'Character Workspace' : this.mode === 'accounts' ? 'Account Workspace' : 'Guild Workspace'
    },
    recordWindowTitle () {
      return this.mode === 'characters' ? 'Character' : this.mode === 'accounts' ? 'Account' : 'Guild'
    },
    indefiniteModeLabel () {
      return this.mode === 'accounts' ? 'an account' : this.mode === 'guilds' ? 'a guild' : 'a character'
    },
    searchPlaceholder () {
      if (this.mode === 'characters') return 'Search character, account, guild, or ID…'
      if (this.mode === 'accounts') return 'Search account, login ID, or record ID…'
      return 'Search guild, leader, or ID…'
    },
    emptyDirectoryMessage () {
      if (this.search) return `No ${this.mode} match this search.`
      if (this.mode === 'guilds') return 'No guilds exist in the connected database.'
      return `No ${this.mode} exist in this view.`
    },
    emptyWorkspaceMessage () {
      if (this.mode === 'characters') return 'Inspect identity, world position, base currency, ownership, and guild context in one audited workspace.'
      if (this.mode === 'accounts') return 'Inspect owned characters, login history, privileges, and enforcement state without exposing credentials.'
      return 'Manage guild identity, roster, ranks, permissions, tribute, and safe disband constraints.'
    },
    directoryFilters () {
      if (this.mode === 'characters') {
        return [
          { value: 'active', label: 'Active' },
          { value: 'online', label: 'Online' },
          { value: 'retired', label: 'Retired' }
        ]
      }
      if (this.mode === 'accounts') {
        return [
          { value: 'all', label: 'All' },
          { value: 'suspended', label: 'Suspended' },
          { value: 'privileged', label: 'Privileged' }
        ]
      }
      return []
    },
    tabs () {
      if (this.mode === 'characters') return ['Overview', 'Location', 'Economy', 'Connections']
      if (this.mode === 'accounts') return ['Overview', 'Access & Safety', 'Characters', 'Activity']
      return ['Overview', 'Members', 'Ranks & Access', 'Assets']
    },
    totalPages () {
      return Math.max(1, Math.ceil(this.totalRecords / this.pageSize))
    },
    activeFields () {
      if (this.mode === 'characters') return CHARACTER_FIELDS
      if (this.mode === 'accounts') return ACCOUNT_FIELDS
      return GUILD_FIELDS
    },
    hasUnsavedChanges () {
      return Boolean(this.editModel && JSON.stringify(pick(this.editModel, this.activeFields)) !== JSON.stringify(pick(this.originalModel, this.activeFields)))
    },
    validationMessages () {
      if (!this.editModel) return ['No record is selected.']
      const messages = []
      if (this.mode === 'characters') {
        if (!String(this.editModel.name || '').trim()) messages.push('Character name is required.')
        if (String(this.editModel.name || '').length > 64) messages.push('Character name must be 64 characters or fewer.')
        if (Number(this.editModel.level) < 1 || Number(this.editModel.level) > 255) messages.push('Level must be between 1 and 255.')
        if (Number(this.editModel.race) <= 0) messages.push('Select a player race.')
        if (Number(this.editModel.class) <= 0) messages.push('Select a player class.')
      } else if (this.mode === 'accounts') {
        if (Number(this.editModel.status) < -1 || Number(this.editModel.status) > 255) messages.push('Account status must be between -1 and 255.')
        if (Number(this.editModel.fly_mode) < 0 || Number(this.editModel.fly_mode) > 2) messages.push('Select a supported fly mode.')
      } else {
        if (!String(this.editModel.name || '').trim()) messages.push('Guild name is required.')
        if (String(this.editModel.name || '').length > 32) messages.push('Guild name must be 32 characters or fewer.')
      }
      return messages
    },
    canSave () {
      return this.hasUnsavedChanges && this.validationMessages.length === 0
    },
    recordHeading () {
      return this.editModel.name || (this.isCreating ? 'New guild' : `#${this.selectedID}`)
    },
    recordEyebrow () {
      if (this.isCreating) return 'New guild draft'
      if (this.mode === 'characters') return `Character #${this.editModel.id}`
      if (this.mode === 'accounts') return `Account #${this.editModel.id}`
      return `Guild #${this.editModel.id}`
    },
    recordSubheading () {
      if (this.mode === 'characters') {
        return `${this.raceName(this.editModel.race)} · ${this.className(this.editModel.class)} · level ${this.editModel.level} · ${this.editModel.online ? 'online' : 'offline'}`
      }
      if (this.mode === 'accounts') {
        return `${this.accountStatusLabel(this.editModel.status)} · ${this.accountCharacterCount} characters · ${this.accountSanctioned ? 'restricted' : 'active'}`
      }
      return `${this.detail.members ? this.detail.members.length : 0} members · leader ${this.editModel.leader_name || 'unassigned'} · ${this.number(this.editModel.favor)} favor`
    },
    raceOptions () {
      return Object.keys(DB_PLAYER_RACES).map(value => ({
        value: Number(value),
        label: `${DB_PLAYER_RACES[value].race} (${value})`
      }))
    },
    classOptions () {
      return Object.keys(DB_PLAYER_CLASSES).map(value => ({
        value: Number(value),
        label: `${DB_PLAYER_CLASSES[value]} (${value})`
      }))
    },
    deityOptions () {
      return Object.keys(DB_DIETIES_FULL).map(value => ({
        value: Number(value),
        label: `${DB_DIETIES_FULL[value].name} (${value})`
      })).sort((left, right) => left.label.localeCompare(right.label))
    },
    selectedCharacterIcon () {
      return this.characterIcon(this.editModel)
    },
    characterZoneLabel () {
      const zone = this.detail && this.detail.context && this.detail.context.zone
      return zone && (zone.long_name || zone.short_name)
        ? `${zone.long_name || zone.short_name} (${zone.short_name || '#' + zone.id})`
        : `Unknown zone #${this.editModel.zone_id}`
    },
    canRelocate () {
      return Boolean(this.relocation.zone && this.relocation.reason.length >= 8)
    },
    currencyChanged () {
      return JSON.stringify(this.currencyDraft) !== JSON.stringify(this.currencyOriginal)
    },
    accountCharacterCount () {
      return this.mode === 'accounts' && this.detail && this.detail.characters ? this.detail.characters.length : 0
    },
    accountSanctioned () {
      return Boolean(this.mode === 'accounts' && this.editModel && this.editModel.suspended_until && new Date(this.editModel.suspended_until).getTime() > Date.now())
    },
    canApplySanction () {
      if (this.sanction.reason.length < 8) return false
      if (this.sanction.mode === 'suspend') {
        return Boolean(this.sanction.until && new Date(this.sanction.until).getTime() > Date.now())
      }
      return true
    },
    guildBankCount () {
      return this.mode === 'guilds' && this.detail && this.detail.bank ? Number(this.detail.bank.item_count || 0) : 0
    },
    canSubmitConfirmation () {
      return this.confirmModal.reason.length >= 8 && this.confirmModal.confirmation === this.confirmModal.expected
    },
    canSaveMember () {
      return Boolean(this.memberDraft.character && this.memberDraft.rank > 0 && this.memberDraft.reason.length >= 8)
    },
    relatedCountCards () {
      const counts = this.detail && this.detail.context ? this.detail.context.related_counts || {} : {}
      return [
        { key: 'inventory', label: 'Inventory', value: counts.inventory || 0, context: 'item slots' },
        { key: 'keyring', label: 'Keyring', value: counts.keyring || 0, context: 'keys learned' },
        { key: 'mail', label: 'Mail', value: counts.mail || 0, context: 'messages' },
        { key: 'parcels', label: 'Parcels', value: counts.parcels || 0, context: 'deliveries' },
        { key: 'alternate_currencies', label: 'Alt. currencies', value: counts.alternate_currencies || 0, context: 'balances' },
        { key: 'tasks', label: 'Tasks', value: counts.tasks || 0, context: 'active rows' },
        { key: 'expedition_lockouts', label: 'Expeditions', value: counts.expedition_lockouts || 0, context: 'lockouts' },
        { key: 'data_buckets', label: 'Data buckets', value: counts.data_buckets || 0, context: 'character keys' }
      ]
    }
  },
  watch: {
    '$route.query.mode' (value) {
      if (this.modes.some(option => option.value === value) && value !== this.mode) this.initializeFromRoute()
    },
    '$route.query.tab' (value) {
      if (this.tabs.includes(value) && value !== this.selectedTab) this.selectedTab = value
    }
  },
  async created () {
    window.addEventListener('keydown', this.onKeydown)
    window.addEventListener('beforeunload', this.onBeforeUnload)
    await this.initializeFromRoute()
  },
  beforeDestroy () {
    window.removeEventListener('keydown', this.onKeydown)
    window.removeEventListener('beforeunload', this.onBeforeUnload)
    window.clearTimeout(this.searchTimer)
    window.clearTimeout(this.lookupTimer)
    window.clearTimeout(this.notification.timer)
  },
  beforeRouteLeave (to, from, next) {
    if (!this.hasUnsavedChanges || window.confirm('Discard unsaved player operations changes?')) next()
    else next(false)
  },
  methods: {
    async initializeFromRoute () {
      const requestedMode = this.$route.query.mode
      this.mode = this.modes.some(option => option.value === requestedMode) ? requestedMode : 'characters'
      this.selectedTab = this.tabs.includes(this.$route.query.tab) ? this.$route.query.tab : 'Overview'
      this.stateFilter = this.mode === 'characters' ? 'active' : this.mode === 'accounts' ? 'all' : ''
      this.currentPage = 1
      this.search = ''
      this.resetWorkspace()
      await Promise.all([this.loadSummary(), this.loadDirectory()])
      const id = Number(this.$route.query[this.recordQueryKey])
      if (id) await this.selectRecord(id, false)
    },
    resetWorkspace () {
      this.selectedID = null
      this.isCreating = false
      this.detail = null
      this.editModel = null
      this.originalModel = null
      this.detailError = ''
      this.lookupResults = []
      this.lookupKind = ''
    },
    async loadSummary () {
      try {
        const response = await SpireApi.v1().get('/player-operations/summary')
        this.summary = response.data || emptySummary()
      } catch (error) {
        this.summary = emptySummary()
      }
    },
    async loadDirectory () {
      this.loadingDirectory = true
      this.directoryError = ''
      try {
        const params = { q: this.search, page: this.currentPage, limit: this.pageSize }
        if (this.stateFilter) params.state = this.stateFilter
        const response = await SpireApi.v1().get(`/player-operations/${this.mode}`, { params })
        this.records = response.data.data || []
        this.totalRecords = Number(response.data.total || 0)
        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages
          return this.loadDirectory()
        }
      } catch (error) {
        this.records = []
        this.totalRecords = 0
        this.directoryError = this.errorMessage(error, `Unable to load ${this.mode}`)
      } finally {
        this.loadingDirectory = false
      }
    },
    queueDirectorySearch () {
      window.clearTimeout(this.searchTimer)
      this.currentPage = 1
      this.searchTimer = window.setTimeout(this.loadDirectory, 260)
    },
    changePage (page) {
      this.currentPage = page
      this.loadDirectory()
    },
    async selectMode (mode) {
      if (mode === this.mode) return
      if (this.hasUnsavedChanges && !window.confirm('Discard unsaved player operations changes?')) return
      this.mode = mode
      await this.$router.push({ path: this.$route.path, query: { mode } })
      await this.initializeFromRoute()
    },
    async selectRecord (id, updateRoute = true) {
      if (this.hasUnsavedChanges && !window.confirm('Discard unsaved player operations changes?')) return
      this.selectedID = Number(id)
      this.loadingDetail = true
      this.detailError = ''
      this.isCreating = false
      try {
        const response = await SpireApi.v1().get(`/player-operations/${this.singularMode}/${id}`)
        this.applyDetail(response.data)
        if (updateRoute) await this.syncRoute()
      } catch (error) {
        this.detail = null
        this.editModel = null
        this.detailError = this.errorMessage(error, `Unable to load ${this.singularMode}`)
      } finally {
        this.loadingDetail = false
      }
    },
    applyDetail (detail) {
      this.detail = detail
      const record = detail[this.singularMode]
      this.editModel = clone(record)
      this.originalModel = clone(record)
      if (this.mode === 'characters') {
        this.currencyDraft = clone(detail.context.currency || {})
        this.currencyOriginal = clone(detail.context.currency || {})
        this.currencyReason = ''
        this.transferAccount = null
        this.transferReason = ''
        this.membershipGuild = detail.context.guild
          ? { id: detail.context.guild.guild_id, name: detail.context.guild.guild_name }
          : null
        this.membershipDraft = {
          rank: detail.context.guild ? detail.context.guild.rank : 5,
          banker: detail.context.guild ? detail.context.guild.banker : false,
          alt: detail.context.guild ? detail.context.guild.alt : false,
          tribute_enabled: detail.context.guild ? detail.context.guild.tribute : false,
          public_note: detail.context.guild ? detail.context.guild.public_note : '',
          reason: ''
        }
        this.clearRelocation()
      } else if (this.mode === 'accounts') {
        this.sanction = { mode: 'suspend', until: '', reason: '' }
      } else {
        this.initializeGuildAccess()
      }
    },
    async reloadSelected () {
      if (this.selectedID) await this.selectRecord(this.selectedID, false)
    },
    async syncRoute () {
      const query = { mode: this.mode, tab: this.selectedTab }
      if (this.selectedID) query[this.recordQueryKey] = String(this.selectedID)
      await this.$router.replace({ path: this.$route.path, query }).catch(() => {})
    },
    selectTab (tab) {
      this.selectedTab = tab
      this.syncRoute()
    },
    createGuildDraft () {
      if (this.hasUnsavedChanges && !window.confirm('Discard unsaved player operations changes?')) return
      this.mode = 'guilds'
      this.isCreating = true
      this.selectedID = null
      this.selectedTab = 'Overview'
      this.detail = {
        guild: {},
        members: [],
        memberships: [],
        ranks: [],
        permissions: [],
        bank: { item_count: 0, slots_used: 0 },
        relations: [],
        tribute: null
      }
      this.editModel = {
        id: 0,
        name: '',
        leader_id: 0,
        leader_name: '',
        min_status: 0,
        motd: '',
        motd_setter: '',
        channel: '',
        url: '',
        tribute: 0,
        favor: 0
      }
      this.originalModel = clone(this.editModel)
      this.initializeGuildAccess()
      this.syncRoute()
      this.$nextTick(() => document.getElementById('player-operations-guild-name')?.focus())
    },
    resetEditor () {
      this.editModel = clone(this.originalModel)
    },
    async savePrimary () {
      if (!this.canSave || this.saving) return
      this.saving = true
      try {
        let response
        if (this.isCreating) {
          response = await SpireApi.v1().put('/player-operations/guild', pick(this.editModel, GUILD_FIELDS))
        } else {
          response = await SpireApi.v1().patch(
            `/player-operations/${this.singularMode}/${this.selectedID}`,
            pick(this.editModel, this.activeFields)
          )
        }
        this.applyDetail(response.data.detail)
        this.selectedID = Number(this.editModel.id)
        this.isCreating = false
        await Promise.all([this.loadDirectory(), this.loadSummary()])
        await this.syncRoute()
        this.showNotification(`${this.recordWindowTitle} saved`)
      } catch (error) {
        this.showNotification(this.errorMessage(error, `Unable to save ${this.singularMode}`), 'error')
      } finally {
        this.saving = false
      }
    },
    clearRelocation () {
      this.relocation = {
        zone: null,
        use_safe_coordinates: true,
        x: Number((this.editModel && this.editModel.x) || 0),
        y: Number((this.editModel && this.editModel.y) || 0),
        z: Number((this.editModel && this.editModel.z) || 0),
        heading: Number((this.editModel && this.editModel.heading) || 0),
        reason: ''
      }
      this.zoneSearch = ''
    },
    selectZone (zone) {
      this.relocation.zone = clone(zone)
      this.relocation.x = Number(zone.safe_x || 0)
      this.relocation.y = Number(zone.safe_y || 0)
      this.relocation.z = Number(zone.safe_z || 0)
      this.relocation.heading = Number(zone.safe_heading || 0)
      this.zoneSearch = ''
      this.clearLookup()
    },
    async relocateCharacter () {
      if (!this.canRelocate || this.operationBusy) return
      this.operationBusy = true
      try {
        const response = await SpireApi.v1().post(`/player-operations/character/${this.selectedID}/relocate`, {
          zone_id: this.relocation.zone.id,
          zone_version: this.relocation.zone.version,
          use_safe_coordinates: this.relocation.use_safe_coordinates,
          x: Number(this.relocation.x || 0),
          y: Number(this.relocation.y || 0),
          z: Number(this.relocation.z || 0),
          heading: Number(this.relocation.heading || 0),
          expected_zone_id: this.originalModel.zone_id,
          reason: this.relocation.reason
        })
        this.applyDetail(response.data.detail)
        await this.loadDirectory()
        this.showNotification('Character relocated')
      } catch (error) {
        this.showNotification(this.errorMessage(error, 'Unable to relocate character'), 'error')
      } finally {
        this.operationBusy = false
      }
    },
    selectTransferAccount (account) {
      this.transferAccount = clone(account)
      this.accountSearch = ''
      this.clearLookup()
    },
    async transferCharacter () {
      if (!this.transferAccount || this.transferReason.length < 8 || this.operationBusy) return
      this.operationBusy = true
      try {
        const response = await SpireApi.v1().post(`/player-operations/character/${this.selectedID}/transfer`, {
          account_id: this.transferAccount.id,
          expected_account_id: this.originalModel.account_id,
          reason: this.transferReason
        })
        this.applyDetail(response.data.detail)
        await this.loadDirectory()
        this.showNotification('Character ownership transferred')
      } catch (error) {
        this.showNotification(this.errorMessage(error, 'Unable to transfer character'), 'error')
      } finally {
        this.operationBusy = false
      }
    },
    selectMembershipGuild (guild) {
      this.membershipGuild = clone(guild)
      this.guildSearch = ''
      this.clearLookup()
    },
    async saveCharacterGuild () {
      await this.persistCharacterGuild(Number((this.membershipGuild && this.membershipGuild.id) || 0))
    },
    async removeCharacterGuild () {
      await this.persistCharacterGuild(0)
    },
    async persistCharacterGuild (guildID) {
      if (this.membershipDraft.reason.length < 8 || this.operationBusy) return
      this.operationBusy = true
      try {
        const response = await SpireApi.v1().post(`/player-operations/character/${this.selectedID}/guild`, {
          guild_id: guildID,
          rank: Number(this.membershipDraft.rank || 5),
          banker: this.membershipDraft.banker,
          alt: this.membershipDraft.alt,
          tribute_enabled: this.membershipDraft.tribute_enabled,
          public_note: this.membershipDraft.public_note,
          expected_guild_id: Number((this.detail.context.guild && this.detail.context.guild.guild_id) || 0),
          reason: this.membershipDraft.reason
        })
        this.applyDetail(response.data.detail)
        await this.loadDirectory()
        this.showNotification(guildID ? 'Guild membership saved' : 'Character removed from guild')
      } catch (error) {
        this.showNotification(this.errorMessage(error, 'Unable to update guild membership'), 'error')
      } finally {
        this.operationBusy = false
      }
    },
    async saveCurrency () {
      if (!this.currencyChanged || this.currencyReason.length < 8 || this.operationBusy) return
      this.operationBusy = true
      try {
        const response = await SpireApi.v1().post(`/player-operations/character/${this.selectedID}/currency`, {
          currency: this.currencyDraft,
          expected: this.currencyOriginal,
          reason: this.currencyReason
        })
        this.applyDetail(response.data.detail)
        this.showNotification('Character balances saved')
      } catch (error) {
        this.showNotification(this.errorMessage(error, 'Unable to save character balances'), 'error')
      } finally {
        this.operationBusy = false
      }
    },
    async applySanction () {
      if (!this.canApplySanction || this.operationBusy) return
      this.operationBusy = true
      try {
        const response = await SpireApi.v1().post(`/player-operations/account/${this.selectedID}/sanction`, {
          mode: this.sanction.mode,
          until: this.sanction.mode === 'suspend' ? new Date(this.sanction.until).toISOString() : null,
          reason: this.sanction.reason,
          expected_suspended_until: this.originalModel.suspended_until || null
        })
        this.applyDetail(response.data.detail)
        await Promise.all([this.loadDirectory(), this.loadSummary()])
        this.showNotification(this.sanction.mode === 'clear' ? 'Account sanction cleared' : 'Account restriction applied')
      } catch (error) {
        this.showNotification(this.errorMessage(error, 'Unable to update account sanction'), 'error')
      } finally {
        this.operationBusy = false
      }
    },
    initializeGuildAccess () {
      const existingRanks = this.detail && this.detail.ranks ? this.detail.ranks : []
      this.accessDraft = {
        ranks: Array.from({ length: 8 }, (_, index) => {
          const rank = index + 1
          const existing = existingRanks.find(row => Number(row.rank) === rank)
          return { rank, title: existing ? existing.title : this.rankLabel(rank) }
        }),
        permissions: clone(this.detail && this.detail.permissions ? this.detail.permissions : []),
        reason: ''
      }
    },
    permissionEnabled (permissionID, rank) {
      const row = this.accessDraft.permissions.find(permission => Number(permission.id) === Number(permissionID))
      return Boolean(row && (Number(row.permission) & (1 << (8 - Number(rank)))))
    },
    setPermission (permissionID, rank, enabled) {
      let row = this.accessDraft.permissions.find(permission => Number(permission.id) === Number(permissionID))
      if (!row) {
        row = { id: permissionID, permission: 0 }
        this.accessDraft.permissions.push(row)
      }
      const bit = 1 << (8 - Number(rank))
      row.permission = enabled ? (Number(row.permission) | bit) : (Number(row.permission) & ~bit)
    },
    async saveGuildAccess () {
      if (this.accessDraft.reason.length < 8 || this.operationBusy) return
      this.operationBusy = true
      try {
        const response = await SpireApi.v1().patch(`/player-operations/guild/${this.selectedID}/access`, this.accessDraft)
        this.applyDetail(response.data.detail)
        this.showNotification('Guild access model saved')
      } catch (error) {
        this.showNotification(this.errorMessage(error, 'Unable to save guild access'), 'error')
      } finally {
        this.operationBusy = false
      }
    },
    openMemberModal (character = null, membership = null) {
      this.memberDraft = {
        editing: Boolean(character),
        character: character ? clone(character) : null,
        rank: membership ? Number(membership.rank) : 5,
        banker: membership ? Boolean(membership.banker) : false,
        alt: membership ? Boolean(membership.alt) : false,
        tribute_enabled: membership ? Boolean(membership.tribute) : false,
        public_note: membership ? membership.public_note : '',
        reason: ''
      }
      this.characterSearch = ''
      this.$refs.memberModal.show()
    },
    resetMemberModal () {
      this.memberDraft = { editing: false, character: null, rank: 5, banker: false, alt: false, tribute_enabled: false, public_note: '', reason: '' }
      this.characterSearch = ''
      this.clearLookup()
    },
    selectMemberCharacter (character) {
      this.memberDraft.character = clone(character)
      this.characterSearch = ''
      this.clearLookup()
    },
    async saveGuildMember () {
      if (!this.canSaveMember || this.operationBusy) return
      this.operationBusy = true
      try {
        const body = {
          character_id: this.memberDraft.character.id,
          rank: this.memberDraft.rank,
          banker: this.memberDraft.banker,
          alt: this.memberDraft.alt,
          tribute_enabled: this.memberDraft.tribute_enabled,
          public_note: this.memberDraft.public_note,
          reason: this.memberDraft.reason
        }
        const path = this.memberDraft.editing
          ? `/player-operations/guild/${this.selectedID}/member/${this.memberDraft.character.id}`
          : `/player-operations/guild/${this.selectedID}/member`
        const response = this.memberDraft.editing
          ? await SpireApi.v1().patch(path, body)
          : await SpireApi.v1().post(path, body)
        this.applyDetail(response.data.detail)
        await this.loadDirectory()
        this.$refs.memberModal.hide()
        this.showNotification(this.memberDraft.editing ? 'Guild member saved' : 'Guild member added')
      } catch (error) {
        this.showNotification(this.errorMessage(error, 'Unable to save guild member'), 'error')
      } finally {
        this.operationBusy = false
      }
    },
    async removeGuildMember () {
      if (!this.memberDraft.character || this.memberDraft.reason.length < 8 || this.operationBusy) return
      this.operationBusy = true
      try {
        const response = await SpireApi.v1().delete(`/player-operations/guild/${this.selectedID}/member/${this.memberDraft.character.id}`, {
          data: { character_id: this.memberDraft.character.id, reason: this.memberDraft.reason }
        })
        this.applyDetail(response.data.detail)
        await this.loadDirectory()
        this.$refs.memberModal.hide()
        this.showNotification('Guild member removed')
      } catch (error) {
        this.showNotification(this.errorMessage(error, 'Unable to remove guild member'), 'error')
      } finally {
        this.operationBusy = false
      }
    },
    openLifecycleModal () {
      const restoring = Boolean(this.editModel.deleted_at)
      this.confirmModal = {
        action: restoring ? 'restore-character' : 'retire-character',
        title: restoring ? 'Restore character' : 'Retire character',
        heading: restoring ? `Restore ${this.editModel.name}?` : `Retire ${this.editModel.name}?`,
        message: restoring
          ? 'The original name must still be available. The character and all related records remain intact.'
          : 'Retirement is reversible: the character is renamed with the EQEmu deletion marker, taken offline, and timestamped without deleting related records.',
        icon: restoring ? 'fa fa-undo' : 'fa fa-archive',
        danger: !restoring,
        expected: this.editModel.name,
        confirmation: '',
        reason: '',
        submitLabel: restoring ? 'Restore character' : 'Retire character'
      }
      this.$refs.confirmModal.show()
    },
    openDeleteModal () {
      const account = this.mode === 'accounts'
      this.confirmModal = {
        action: account ? 'delete-account' : 'delete-guild',
        title: account ? 'Delete empty account' : 'Disband guild',
        heading: account ? `Delete ${this.editModel.name}?` : `Disband ${this.editModel.name}?`,
        message: account
          ? 'This permanently removes the empty account and its account-only flags, IP history, rewards, shared bank, and GM IP rows in one transaction.'
          : 'This permanently removes the guild, roster links, ranks, permissions, tribute, and relations. Guild-bank items must be cleared first.',
        icon: 'fa fa-trash',
        danger: true,
        expected: this.editModel.name,
        confirmation: '',
        reason: '',
        submitLabel: account ? 'Delete account' : 'Disband guild'
      }
      this.$refs.confirmModal.show()
    },
    resetConfirmModal () {
      this.confirmModal.confirmation = ''
      this.confirmModal.reason = ''
    },
    async submitConfirmation () {
      if (!this.canSubmitConfirmation || this.operationBusy) return
      this.operationBusy = true
      try {
        let response
        if (this.confirmModal.action === 'retire-character' || this.confirmModal.action === 'restore-character') {
          const action = this.confirmModal.action === 'retire-character' ? 'retire' : 'restore'
          response = await SpireApi.v1().post(`/player-operations/character/${this.selectedID}/${action}`, {
            confirmation: this.confirmModal.confirmation,
            reason: this.confirmModal.reason
          })
          this.applyDetail(response.data.detail)
          await Promise.all([this.loadDirectory(), this.loadSummary()])
          this.showNotification(action === 'retire' ? 'Character retired safely' : 'Character restored')
        } else {
          const singular = this.confirmModal.action === 'delete-account' ? 'account' : 'guild'
          response = await SpireApi.v1().delete(`/player-operations/${singular}/${this.selectedID}`, {
            data: { confirmation: this.confirmModal.confirmation, reason: this.confirmModal.reason }
          })
          this.resetWorkspace()
          await Promise.all([this.loadDirectory(), this.loadSummary()])
          await this.syncRoute()
          this.showNotification(singular === 'account' ? 'Account deleted' : 'Guild disbanded')
        }
        this.$refs.confirmModal.hide()
      } catch (error) {
        this.showNotification(this.errorMessage(error, 'Unable to complete operation'), 'error')
      } finally {
        this.operationBusy = false
      }
    },
    queueLookup (kind) {
      window.clearTimeout(this.lookupTimer)
      const search = this.lookupSearch(kind)
      if ((kind !== 'guilds' && kind !== 'zones') && search.length < 2) {
        this.clearLookup()
        return
      }
      this.lookupKind = kind
      this.lookupTimer = window.setTimeout(() => this.loadLookup(kind), 260)
    },
    async loadLookup (kind) {
      const search = this.lookupSearch(kind)
      this.lookupKind = kind
      this.lookupLoading = true
      try {
        const response = await SpireApi.v1().get(`/player-operations/lookup/${kind}`, { params: { q: search } })
        if (this.lookupKind === kind) this.lookupResults = response.data.data || []
      } catch (error) {
        this.lookupResults = []
      } finally {
        this.lookupLoading = false
      }
    },
    lookupSearch (kind) {
      if (kind === 'zones') return this.zoneSearch
      if (kind === 'accounts') return this.accountSearch
      if (kind === 'guilds') return this.guildSearch
      return this.characterSearch
    },
    clearLookup () {
      this.lookupKind = ''
      this.lookupResults = []
      this.lookupLoading = false
    },
    async openRelated (mode, id) {
      if (this.hasUnsavedChanges && !window.confirm('Discard unsaved player operations changes?')) return
      this.mode = mode
      this.stateFilter = mode === 'characters' ? 'active' : mode === 'accounts' ? 'all' : ''
      this.currentPage = 1
      this.selectedTab = 'Overview'
      await this.loadDirectory()
      await this.selectRecord(id)
    },
    membershipFor (member) {
      return (this.detail.memberships || []).find(membership => Number(membership.character_id) === Number(member.id)) || {}
    },
    modeCount (mode) {
      if (mode === 'characters') return this.number(this.summary.characters)
      if (mode === 'accounts') return this.number(this.summary.accounts)
      return this.number(this.summary.guilds)
    },
    recordTitle (record) {
      return record.name || `#${record.id}`
    },
    recordDetail (record) {
      if (this.mode === 'characters') {
        return `${record.account_name || 'Unknown account'} · L${record.level} ${this.className(record.class)} · ${record.guild_name || 'No guild'}`
      }
      if (this.mode === 'accounts') {
        return `${this.accountStatusLabel(record.status)} · ${record.character_count} characters${record.suspended_until ? ' · restricted' : ''}`
      }
      return `${record.member_count} members · ${record.leader_name || 'No leader'}${record.bank_items ? ' · ' + record.bank_items + ' bank items' : ''}`
    },
    rankLabel (rank) {
      const defaults = ['Leader', 'Senior Officer', 'Officer', 'Senior Member', 'Member', 'Junior Member', 'Initiate', 'Recruit']
      const existing = this.detail && this.detail.ranks && this.detail.ranks.find(row => Number(row.rank) === Number(rank))
      return existing ? existing.title : (defaults[Number(rank) - 1] || `Rank ${rank}`)
    },
    accountStatusLabel (status) {
      const option = this.accountStatuses.find(row => Number(row.value) === Number(status))
      return option ? option.label.replace(/\s\([^)]*\)$/, '') : `Custom status ${status}`
    },
    raceName (race) {
      return DB_PLAYER_RACES[Number(race)] ? DB_PLAYER_RACES[Number(race)].race : `Race ${race}`
    },
    className (value) {
      return DB_PLAYER_CLASSES[Number(value)] || `Class ${value}`
    },
    characterIcon (record) {
      const icon = DB_CLASSES_ICONS[Number(record && record.class)]
      if (!icon) return ''
      try {
        return require('@/assets/img/icons/classes-races/item_' + icon + '.png')
      } catch (error) {
        return ''
      }
    },
    number (value) {
      return Number(value || 0).toLocaleString()
    },
    decimal (value) {
      const number = Number(value || 0)
      return Number.isInteger(number) ? number.toLocaleString() : number.toFixed(1)
    },
    coordinateSummary (record) {
      return `${this.decimal(record.x)}, ${this.decimal(record.y)}, ${this.decimal(record.z)}`
    },
    dateTime (value) {
      if (!value) return 'Never'
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
    },
    minimumSanctionDateTime () {
      const date = new Date(Date.now() + 60000)
      date.setSeconds(0, 0)
      return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
    },
    duration (seconds) {
      const value = Number(seconds || 0)
      if (value <= 0) return '0s'
      const hours = Math.floor(value / 3600)
      const minutes = Math.floor((value % 3600) / 60)
      const remaining = value % 60
      return [hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', remaining ? `${remaining}s` : ''].filter(Boolean).join(' ')
    },
    showNotification (message, type = 'success') {
      window.clearTimeout(this.notification.timer)
      this.notification = { message, type, timer: null }
      this.notification.timer = window.setTimeout(() => { this.notification.message = '' }, 4200)
    },
    errorMessage (error, fallback) {
      return error && error.response && error.response.data && error.response.data.error
        ? error.response.data.error
        : fallback
    },
    onKeydown (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        this.savePrimary()
      }
    },
    onBeforeUnload (event) {
      if (!this.hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }
  }
}
</script>

<style src="../../../assets/css/content-editor-workspace.css"></style>

<style scoped>
.player-operations-page {
  --operations-blue: #6e9fc0;
}

.operations-mode-switch {
  background:
    linear-gradient(180deg, rgba(17, 28, 39, 0.96), rgba(4, 11, 17, 0.96));
  border: 1px solid rgba(210, 170, 69, 0.34);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 8px 22px rgba(0, 0, 0, 0.22);
  display: grid;
  gap: 4px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 12px;
  max-width: 720px;
  padding: 5px;
}

.operations-mode-switch button {
  align-items: center;
  background: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(178, 191, 204, 0.24) !important;
  border-radius: 0 !important;
  color: #99a4ae;
  display: grid !important;
  font-size: 10px !important;
  gap: 8px;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  min-height: 38px;
  padding: 7px 10px !important;
  text-align: left !important;
}

.operations-mode-switch button i {
  color: #ad9352;
  text-align: center;
}

.operations-mode-switch button small {
  color: #6f7b86;
}

.operations-mode-switch button.active,
.operations-mode-switch button:hover {
  background: linear-gradient(90deg, rgba(210, 170, 69, 0.25), rgba(15, 28, 39, 0.96)) !important;
  border-color: rgba(210, 170, 69, 0.58) !important;
  color: #e5d49f;
}

.directory-readonly-badge {
  align-items: center;
  border: 1px solid rgba(116, 139, 157, 0.25);
  color: #788996;
  display: flex;
  height: 31px;
  justify-content: center;
  width: 34px;
}

.spire-editor-directory-icon img,
.spire-editor-identity-icon img,
.operations-character-cell img,
.selected-operation-target img,
.member-selector-results img {
  height: 28px;
  image-rendering: auto;
  object-fit: contain;
  width: 28px;
}

.spire-editor-identity-icon img {
  height: 40px;
  width: 40px;
}

.directory-online {
  color: #54d28b;
  font-size: 7px;
  margin-right: 3px;
}

.operations-two-column {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.operations-action-card {
  background: rgba(2, 9, 14, 0.48);
  border: 1px solid rgba(178, 191, 204, 0.16);
  min-width: 0;
  padding: 12px;
  position: relative;
}

.operations-datetime-control {
  color-scheme: dark;
  cursor: pointer;
}

.operations-datetime-control::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(78%) sepia(26%) saturate(786%) hue-rotate(4deg) brightness(91%);
  opacity: 0.9;
}

.operations-inline-search {
  position: relative;
}

.operations-inline-search .form-control {
  padding-left: 29px !important;
}

.operations-selector-state {
  color: #89949e;
  font-size: 10px;
  padding: 10px;
}

.spire-editor-selector-results button > span {
  min-width: 0;
}

.spire-editor-selector-results button strong,
.spire-editor-selector-results button small {
  display: block;
}

.selected-operation-target {
  align-items: center;
  background: rgba(210, 170, 69, 0.08);
  border: 1px solid rgba(210, 170, 69, 0.28);
  display: flex;
  gap: 10px;
  margin: 9px 0;
  min-height: 52px;
  padding: 8px 9px;
}

.selected-operation-target > i {
  color: #d0ad4b;
  flex: 0 0 28px;
  text-align: center;
}

.selected-operation-target > span {
  min-width: 0;
}

.selected-operation-target strong,
.selected-operation-target small {
  display: block;
}

.selected-operation-target strong {
  color: #e1e4e6;
  font-size: 11px;
}

.selected-operation-target small {
  color: #7f8993;
  font-size: 9px;
}

.selected-operation-target button {
  align-items: center;
  background: transparent !important;
  border: 0 !important;
  color: #8d98a2;
  display: flex !important;
  height: 28px;
  justify-content: center;
  margin-left: auto;
  padding: 0 !important;
  width: 28px;
}

.selected-operation-target--static {
  margin-top: 8px;
}

.operations-check {
  align-items: center;
  color: #adb5bc;
  display: flex;
  font-size: 10px;
  gap: 7px;
  margin: 9px 0;
}

.operations-check input {
  accent-color: #d2aa45;
}

.operations-check-stack {
  align-content: center;
  display: grid;
  grid-template-columns: repeat(3, auto);
  justify-content: start;
}

.operations-check-stack--modal {
  grid-template-columns: 1fr;
}

.operations-check-stack .operations-check {
  margin-right: 9px;
}

.operations-reason {
  margin: 12px 0 9px;
}

.operations-button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.zone-position-grid,
.operations-status-strip {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 12px;
}

.zone-position-grid > span,
.operations-status-strip > span {
  background: rgba(0, 0, 0, 0.26);
  border: 1px solid rgba(178, 191, 204, 0.12);
  padding: 7px;
}

.zone-position-grid small,
.zone-position-grid strong,
.operations-status-strip small,
.operations-status-strip strong {
  display: block;
}

.zone-position-grid small,
.operations-status-strip small {
  color: #76818b;
  font-size: 8px;
  text-transform: uppercase;
}

.zone-position-grid strong,
.operations-status-strip strong {
  color: #ddc36f;
  font-size: 10px;
  margin-top: 2px;
}

.operations-subheading {
  margin-top: 17px;
}

.operations-card-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.operations-card-grid--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.operations-fact-card {
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(178, 191, 204, 0.14);
  min-width: 0;
  padding: 9px;
}

.operations-fact-card span,
.operations-fact-card strong,
.operations-fact-card small {
  display: block;
}

.operations-fact-card span {
  color: #7e8992;
  font-size: 8px;
  text-transform: uppercase;
}

.operations-fact-card strong {
  color: #e0c566;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 16px;
  margin: 2px 0;
}

.operations-fact-card small {
  color: #737e87;
  font-size: 8px;
}

.operations-empty-inline {
  align-items: center;
  border: 1px dashed rgba(178, 191, 204, 0.18);
  color: #7e8992;
  display: flex;
  font-size: 10px;
  justify-content: center;
  min-height: 78px;
  padding: 14px;
  text-align: center;
}

.currency-ledger {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.currency-ledger-row {
  align-items: center;
  background: rgba(0, 0, 0, 0.23);
  border: 1px solid rgba(178, 191, 204, 0.14);
  display: grid;
  gap: 9px;
  grid-template-columns: 32px minmax(0, 1fr) minmax(100px, 0.55fr);
  padding: 7px 8px;
}

.currency-ledger-row label {
  margin: 0;
}

.currency-ledger-row label strong,
.currency-ledger-row label small {
  display: block;
}

.currency-ledger-row label strong {
  color: #d5d9dc;
  font-size: 10px;
}

.currency-ledger-row label small {
  color: #77828b;
  font-size: 8px;
}

.currency-ledger-row .form-control {
  text-align: right;
}

.coin {
  align-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
  display: flex;
  height: 27px;
  justify-content: center;
  opacity: 0.86;
  width: 27px;
}

.coin--platinum { color: #c6d8de; }
.coin--gold { color: #e0bd4a; }
.coin--silver { color: #9facb4; }
.coin--copper { color: #b5794a; }
.coin--radiant { color: #7fc7dc; }
.coin--ebon { color: #a285c5; }

.operations-action-footer {
  align-items: end;
  border-top: 1px solid rgba(178, 191, 204, 0.13);
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(0, 1fr) auto;
  margin-top: 12px;
  padding-top: 10px;
}

.operations-action-footer .operations-reason {
  margin: 0;
}

.operations-table-wrap,
.permission-matrix-wrap {
  border: 1px solid rgba(178, 191, 204, 0.16);
  max-width: 100%;
  overflow-x: auto;
}

.operations-table,
.permission-matrix {
  border-collapse: collapse;
  font-size: 9px;
  width: 100%;
}

.operations-table th,
.operations-table td,
.permission-matrix th,
.permission-matrix td {
  border-bottom: 1px solid rgba(178, 191, 204, 0.12);
  padding: 7px 8px;
  text-align: left;
  vertical-align: middle;
}

.operations-table th,
.permission-matrix th {
  background: rgba(0, 0, 0, 0.31);
  color: #858f98;
  font-size: 8px;
  text-transform: uppercase;
}

.operations-table td {
  color: #aab2b9;
}

.operations-character-cell {
  align-items: center;
  display: flex;
  gap: 8px;
  min-width: 140px;
}

.operations-character-cell strong,
.operations-character-cell small {
  display: block;
}

.operations-character-cell strong {
  color: #d9dde0;
  font-size: 10px;
}

.operations-character-cell small {
  color: #737e87;
  font-size: 8px;
}

.operations-pill {
  background: rgba(116, 139, 157, 0.12);
  border: 1px solid rgba(116, 139, 157, 0.26);
  color: #aeb8c0;
  display: inline-block;
  font-size: 7px;
  margin: 1px 2px 1px 0;
  padding: 2px 5px;
  text-transform: uppercase;
}

.operations-pill--success {
  border-color: rgba(75, 185, 121, 0.38);
  color: #73d69d;
}

.operations-pill--danger {
  border-color: rgba(204, 78, 83, 0.38);
  color: #df7b80;
}

.operations-icon-button {
  align-items: center;
  background: rgba(0, 0, 0, 0.22) !important;
  border: 1px solid rgba(178, 191, 204, 0.2) !important;
  color: #a4adb5;
  display: inline-flex !important;
  height: 27px;
  justify-content: center;
  padding: 0 !important;
  width: 27px;
}

.operations-actions-cell {
  white-space: nowrap;
}

.operations-simple-list {
  margin-top: 8px;
}

.operations-simple-list > div {
  align-items: center;
  border-top: 1px solid rgba(178, 191, 204, 0.11);
  display: flex;
  justify-content: space-between;
  padding: 7px 2px;
}

.operations-simple-list strong,
.operations-simple-list small {
  display: block;
}

.operations-simple-list strong {
  color: #d3d8dc;
  font-size: 10px;
}

.operations-simple-list small,
.operations-simple-list em {
  color: #76818a;
  font-size: 8px;
}

.rank-title-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 12px;
}

.permission-matrix th:not(:first-child),
.permission-matrix td:not(:first-child) {
  text-align: center;
  width: 54px;
}

.permission-matrix td:first-child strong,
.permission-matrix td:first-child small {
  display: block;
}

.permission-matrix td:first-child strong {
  color: #d1d6da;
}

.permission-matrix td:first-child small {
  color: #727e87;
  margin-top: 2px;
}

.permission-check {
  cursor: pointer;
  display: inline-flex;
  margin: 0;
}

.permission-check input {
  opacity: 0;
  position: absolute;
}

.permission-check span {
  align-items: center;
  border: 1px solid rgba(178, 191, 204, 0.28);
  display: flex;
  height: 20px;
  justify-content: center;
  width: 20px;
}

.permission-check input:checked + span {
  background: rgba(210, 170, 69, 0.27);
  border-color: rgba(210, 170, 69, 0.65);
}

.permission-check input:checked + span::after {
  color: #ebcb6c;
  content: "✓";
  font-size: 11px;
}

.permission-check input:focus-visible + span {
  outline: 2px solid #d2aa45;
  outline-offset: 2px;
}

.operations-tribute-card {
  margin-top: 12px;
  min-height: 0;
}

.operations-confirm-content {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
}

.operations-confirm-content h4 {
  color: #e0c97f;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 17px;
  margin: 0 0 3px;
}

.operations-confirm-content p {
  color: #89949e;
  font-size: 10px;
  margin: 0;
}

.operations-confirm-icon {
  align-items: center;
  border: 1px solid rgba(210, 170, 69, 0.4);
  color: #d3ad43;
  display: flex;
  flex: 0 0 44px;
  height: 44px;
  justify-content: center;
}

.operations-confirm-icon.danger {
  border-color: rgba(204, 72, 78, 0.45);
  color: #df747a;
}

.member-selector-results {
  background: #07111a;
  border: 1px solid rgba(210, 170, 69, 0.45);
  max-height: 220px;
  overflow-y: auto;
}

.member-selector-results button {
  align-items: center;
  background: transparent !important;
  border: 0 !important;
  border-bottom: 1px solid rgba(178, 191, 204, 0.12) !important;
  color: #d7dcdf;
  display: flex !important;
  gap: 9px;
  padding: 8px !important;
  text-align: left !important;
  width: 100%;
}

.member-selector-results strong,
.member-selector-results small {
  display: block;
}

.member-selector-results strong {
  font-size: 10px;
}

.member-selector-results small {
  color: #75808a;
  font-size: 8px;
}

.operations-modal-spacer {
  flex: 1;
}

@media (max-width: 1180px) {
  .operations-card-grid--four,
  .rank-title-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .currency-ledger {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .operations-two-column {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .operations-mode-switch {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-width: none;
  }

  .operations-mode-switch button {
    gap: 5px;
    grid-template-columns: 18px minmax(0, 1fr);
    min-height: 36px;
    padding: 5px 6px !important;
  }

  .operations-mode-switch button small {
    display: none;
  }

  .operations-card-grid,
  .operations-card-grid--four,
  .rank-title-grid,
  .currency-ledger {
    grid-template-columns: 1fr;
  }

  .zone-position-grid,
  .operations-status-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .operations-action-footer {
    align-items: stretch;
    grid-template-columns: 1fr;
  }
}
</style>
