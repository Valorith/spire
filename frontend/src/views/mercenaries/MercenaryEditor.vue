<template>
  <content-area class="spire-editor-page mercenary-editor-page">
    <div class="spire-editor-toolbar">
      <div>
        <div class="spire-editor-kicker">Content tools · NPCs</div>
        <h1 class="spire-editor-title">
          <i class="ra ra-shield mr-2"></i>Mercenary Editor
        </h1>
        <p class="spire-editor-subtitle">
          Manage player-owned mercenaries, runtime state, appearance, and active spell buffs in one workspace.
        </p>
      </div>
      <div class="spire-editor-summary" aria-label="Mercenary directory summary">
        <span><strong>{{ number(totalRecords) }}</strong> mercenaries</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(activeCount) }}</strong> active on page</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(buffCount) }}</strong> buffs on page</span>
      </div>
    </div>

    <div class="spire-editor-workspace">
      <aside class="spire-editor-directory">
        <eq-window title="Mercenaries">
          <div class="spire-editor-directory-controls">
            <div class="spire-editor-search">
              <i class="fa fa-search"></i>
              <input
                id="mercenary-directory-search"
                v-model.trim="search"
                class="form-control form-control-sm"
                placeholder="Search mercenary, owner, or ID…"
                @input="queueDirectorySearch"
              >
              <button
                v-if="search"
                class="spire-editor-search-clear"
                type="button"
                aria-label="Clear mercenary search"
                @click="search = ''; currentPage = 1; loadDirectory()"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <b-button
              size="sm"
              variant="outline-warning"
              data-testid="mercenary-new"
              @click="createDraft"
            >
              <i class="fa fa-plus mr-1"></i>New
            </b-button>
          </div>

          <div class="spire-editor-filter" role="group" aria-label="Mercenary state filter">
            <button
              v-for="option in stateFilters"
              :key="option.value"
              type="button"
              :class="{ active: stateFilter === option.value }"
              :aria-pressed="stateFilter === option.value ? 'true' : 'false'"
              @click="stateFilter = option.value; currentPage = 1; loadDirectory()"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="spire-editor-directory-meta">
            <span>{{ number(totalRecords) }} records</span>
            <span v-if="loadingDirectory"><i class="fa fa-spinner fa-spin mr-1"></i>Refreshing</span>
            <span v-else>Page {{ currentPage }}</span>
          </div>

          <div class="spire-editor-directory-list" data-testid="mercenary-directory">
            <button
              v-for="mercenary in records"
              :key="'mercenary-' + mercenary.merc_id"
              class="spire-editor-directory-row"
              :class="{ active: Number(selectedID) === Number(mercenary.merc_id) && !isCreating }"
              type="button"
              @click="selectMercenary(mercenary.merc_id)"
            >
              <span class="spire-editor-directory-icon">
                <i :class="mercenary.is_suspended ? 'ra ra-player-teleport' : 'ra ra-shield'"></i>
              </span>
              <span class="spire-editor-directory-body">
                <span class="spire-editor-directory-name">{{ mercenary.name || 'Unnamed mercenary' }}</span>
                <span class="spire-editor-directory-detail">
                  {{ ownerLabel(mercenary) }} · {{ stanceLabel(mercenary.stance_id) }}
                </span>
              </span>
              <span class="spire-editor-directory-aside">
                <i
                  class="fa fa-circle"
                  :class="mercenary.is_suspended ? 'directory-suspended' : 'directory-active'"
                  :aria-label="mercenary.is_suspended ? 'Suspended' : 'Active'"
                ></i>
                #{{ mercenary.merc_id }}
              </span>
            </button>

            <div v-if="directoryError" class="spire-editor-directory-state spire-editor-directory-state--error">
              <i class="fa fa-exclamation-triangle"></i>
              <span>{{ directoryError }}</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="loadDirectory">
                Retry
              </button>
            </div>
            <div v-else-if="loadingDirectory && !records.length" class="spire-editor-directory-state">
              <i class="fa fa-spinner fa-spin"></i>
              <span>Loading real mercenary data…</span>
            </div>
            <div v-else-if="!records.length" class="spire-editor-directory-state">
              <i class="ra ra-shield"></i>
              <span>No mercenaries match this view.</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="createDraft">
                Create a mercenary
              </button>
            </div>
          </div>

          <nav v-if="totalPages > 1" class="spire-editor-pagination" aria-label="Mercenary directory pages">
            <button
              type="button"
              aria-label="Previous mercenary page"
              :disabled="currentPage <= 1"
              @click="currentPage--; loadDirectory()"
            >
              <i class="fa fa-angle-left"></i>
            </button>
            <span><strong>{{ currentPage }}</strong> / {{ totalPages }}</span>
            <button
              type="button"
              aria-label="Next mercenary page"
              :disabled="currentPage >= totalPages"
              @click="currentPage++; loadDirectory()"
            >
              <i class="fa fa-angle-right"></i>
            </button>
          </nav>
        </eq-window>
      </aside>

      <main class="spire-editor-inspector">
        <eq-window v-if="!editModel && directoryError" title="Mercenary Workspace">
          <div class="spire-editor-empty spire-editor-empty--error" role="alert">
            <div class="spire-editor-empty__sigil"><i class="fa fa-exclamation-triangle"></i></div>
            <h3>Mercenary data could not be loaded</h3>
            <p>{{ directoryError }}</p>
            <b-button size="sm" variant="outline-warning" @click="loadDirectory">
              <i class="fa fa-refresh mr-1"></i>Retry
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="!editModel && !loadingDetail" title="Mercenary Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="ra ra-shield"></i></div>
            <h3>Select a mercenary</h3>
            <p>Inspect its owner, server state, appearance, and every active spell buff without leaving this workspace.</p>
            <b-button size="sm" variant="outline-warning" @click="createDraft">
              <i class="fa fa-plus mr-1"></i>Create new
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="loadingDetail && !editModel" title="Mercenary Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading mercenary context…</h3>
          </div>
        </eq-window>

        <div v-if="editModel" data-testid="mercenary-inspector">
          <eq-window title="Mercenary" class="mb-2">
            <div class="spire-editor-header">
              <div class="spire-editor-identity">
                <span class="spire-editor-identity-icon">
                  <i class="ra ra-shield"></i>
                </span>
                <div>
                  <div class="spire-editor-eyebrow">
                    {{ isCreating ? 'New mercenary draft' : 'Mercenary #' + editModel.merc_id }}
                    <span v-if="hasUnsavedChanges" class="spire-editor-unsaved">
                      <i class="fa fa-circle"></i> Unsaved
                    </span>
                  </div>
                  <h2>{{ editModel.name || 'Unnamed mercenary' }}</h2>
                  <p>{{ selectedOwnerName }} · slot {{ number(editModel.slot) }} · {{ stanceLabel(editModel.stance_id) }}</p>
                </div>
              </div>
              <div class="spire-editor-actions">
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-warning"
                  data-testid="mercenary-copy"
                  :disabled="saving || hasUnsavedChanges"
                  @click="confirmCopy"
                >
                  <i class="fa fa-copy mr-1"></i>Copy
                </b-button>
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-danger"
                  data-testid="mercenary-delete"
                  :disabled="saving || hasUnsavedChanges"
                  @click="openDeleteModal"
                >
                  <i class="fa fa-trash mr-1"></i>Delete
                </b-button>
                <b-button
                  size="sm"
                  variant="outline-warning"
                  data-testid="mercenary-save"
                  :disabled="!canSave"
                  @click="saveMercenary"
                >
                  <i :class="saving ? 'fa fa-spinner fa-spin mr-1' : 'fa fa-save mr-1'"></i>Save
                </b-button>
              </div>
            </div>
          </eq-window>

          <eq-window title="Workspace">
            <div class="spire-editor-tabs" role="tablist" aria-label="Mercenary editor sections">
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
                <span v-if="tab === 'Buffs'" class="tab-count">{{ number(buffs.length) }}</span>
              </button>
            </div>

            <section v-if="selectedTab === 'Overview'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Identity</div>
                  <h3>Mercenary identity and live resources</h3>
                </div>
                <p>Stance values follow the server’s authoritative mercenary stance enum.</p>
              </div>

              <div class="spire-editor-grid spire-editor-grid--three">
                <div class="spire-editor-field">
                  <label for="mercenary-id">Mercenary ID</label>
                  <input
                    id="mercenary-id"
                    class="form-control form-control-sm"
                    :value="isCreating ? 'Assigned on save' : editModel.merc_id"
                    readonly
                  >
                  <span class="spire-editor-field-help">Stable server identifier.</span>
                </div>
                <div class="spire-editor-field">
                  <label for="mercenary-name">Name</label>
                  <input
                    id="mercenary-name"
                    v-model.trim="editModel.name"
                    class="form-control form-control-sm"
                    maxlength="64"
                    autocomplete="off"
                  >
                  <span class="spire-editor-field-help">Up to 64 characters.</span>
                </div>
                <div class="spire-editor-field">
                  <label for="mercenary-stance">Stance</label>
                  <select id="mercenary-stance" v-model.number="editModel.stance_id" class="form-control form-control-sm">
                    <option v-for="stance in stanceOptionsForRecord" :key="stance.value" :value="stance.value">
                      {{ stance.label }} ({{ stance.value }})
                    </option>
                  </select>
                  <span class="spire-editor-field-help">{{ stanceDescription(editModel.stance_id) }}</span>
                </div>
                <div class="spire-editor-field">
                  <label for="mercenary-slot">Owner slot</label>
                  <input
                    id="mercenary-slot"
                    v-model.number="editModel.slot"
                    class="form-control form-control-sm"
                    type="number"
                    min="0"
                    max="255"
                  >
                  <span class="spire-editor-field-help">Must be unique for the selected owner.</span>
                </div>
                <div class="spire-editor-field">
                  <label for="mercenary-template">Legacy template ID</label>
                  <input
                    id="mercenary-template"
                    v-model.number="editModel.template_id"
                    class="form-control form-control-sm"
                    type="number"
                    min="0"
                    max="4294967295"
                  >
                  <span class="spire-editor-field-help">Preserved raw value; this server has no mercenary template table to resolve.</span>
                </div>
                <div class="spire-editor-field">
                  <label for="mercenary-size">Size</label>
                  <input
                    id="mercenary-size"
                    v-model.number="editModel.merc_size"
                    class="form-control form-control-sm"
                    type="number"
                    min="0.1"
                    max="255"
                    step="0.1"
                  >
                  <span class="spire-editor-field-help">Runtime model scale.</span>
                </div>
              </div>

              <div class="mercenary-resource-grid">
                <label>
                  <span>Health</span>
                  <input id="mercenary-hp" v-model.number="editModel.hp" type="number" min="0" class="form-control form-control-sm">
                  <strong>{{ number(editModel.hp) }}</strong>
                </label>
                <label>
                  <span>Mana</span>
                  <input id="mercenary-mana" v-model.number="editModel.mana" type="number" min="0" class="form-control form-control-sm">
                  <strong>{{ number(editModel.mana) }}</strong>
                </label>
                <label>
                  <span>Endurance</span>
                  <input id="mercenary-endurance" v-model.number="editModel.endurance" type="number" min="0" class="form-control form-control-sm">
                  <strong>{{ number(editModel.endurance) }}</strong>
                </label>
              </div>
            </section>

            <section v-if="selectedTab === 'Owner & State'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Ownership</div>
                  <h3>Player relationship and runtime availability</h3>
                </div>
                <p>Owner reassignment is slot-safe and validated again inside the database transaction.</p>
              </div>

              <div class="spire-editor-grid spire-editor-grid--two">
                <div>
                  <div class="spire-editor-field">
                    <label for="mercenary-owner-search">Find owner character</label>
                    <div class="spire-editor-search">
                      <i class="fa fa-search"></i>
                      <input
                        id="mercenary-owner-search"
                        v-model.trim="ownerSearch"
                        class="form-control form-control-sm"
                        placeholder="Search character name or exact ID…"
                        autocomplete="off"
                        @input="queueOwnerSearch"
                      >
                    </div>
                  </div>
                  <div v-if="searchingOwners" class="lookup-state">
                    <i class="fa fa-spinner fa-spin mr-1"></i>Searching characters…
                  </div>
                  <div v-else-if="ownerResults.length" class="mercenary-lookup-results">
                    <button
                      v-for="owner in ownerResults"
                      :key="'owner-' + owner.id"
                      type="button"
                      @click="selectOwner(owner)"
                    >
                      <span>
                        <strong>{{ owner.name }}</strong>
                        <small>{{ raceLabel(owner.race) }} · {{ classLabel(owner.class) }} · level {{ owner.level }}</small>
                      </span>
                      <span>{{ owner.merc_count }} merc{{ Number(owner.merc_count) === 1 ? '' : 's' }} · #{{ owner.id }}</span>
                    </button>
                  </div>
                  <div v-else-if="ownerSearchComplete && ownerSearch" class="lookup-state">
                    No matching characters.
                  </div>
                </div>

                <div class="spire-editor-context-card spire-editor-context-card--gold owner-card">
                  <div class="context-label">Selected owner</div>
                  <h4>{{ selectedOwnerName }}</h4>
                  <p v-if="selectedOwner">
                    {{ raceLabel(selectedOwner.race) }} · {{ classLabel(selectedOwner.class) }}
                    · level {{ number(selectedOwner.level) }}
                  </p>
                  <p v-else-if="editModel.owner_character_id">Character #{{ editModel.owner_character_id }}</p>
                  <p v-else>Select a character before saving this mercenary.</p>
                  <div class="owner-facts">
                    <span><small>Character</small>#{{ editModel.owner_character_id || 0 }}</span>
                    <span><small>Account</small>#{{ selectedOwnerAccountID || 0 }}</span>
                    <span><small>Owner slot</small>{{ number(editModel.slot) }}</span>
                  </div>
                </div>
              </div>

              <div class="mercenary-state-layout">
                <div class="mercenary-toggle-card">
                  <div>
                    <strong>Suspended</strong>
                    <span>Mercenary is currently unavailable to the player.</span>
                  </div>
                  <button
                    type="button"
                    class="mercenary-toggle"
                    :class="{ active: editModel.is_suspended }"
                    role="switch"
                    :aria-checked="editModel.is_suspended ? 'true' : 'false'"
                    @click="editModel.is_suspended = !editModel.is_suspended"
                  >
                    <span></span>
                  </button>
                </div>
                <div class="spire-editor-field">
                  <label for="mercenary-suspended-time">Suspended until</label>
                  <input
                    id="mercenary-suspended-time"
                    :value="suspendedDateTime"
                    class="form-control form-control-sm"
                    type="datetime-local"
                    :disabled="!editModel.is_suspended"
                    @input="setSuspendedDateTime($event.target.value)"
                  >
                  <span class="spire-editor-field-help">{{ suspensionSummary }}</span>
                </div>
                <div class="spire-editor-field">
                  <label for="mercenary-timer">Timer remaining (seconds)</label>
                  <input
                    id="mercenary-timer"
                    v-model.number="editModel.timer_remaining"
                    class="form-control form-control-sm"
                    type="number"
                    min="0"
                  >
                  <span class="spire-editor-field-help">{{ durationLabel(editModel.timer_remaining) }}</span>
                </div>
              </div>
            </section>

            <section v-if="selectedTab === 'Appearance'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Client appearance</div>
                  <h3>Model identity and Luclin customization</h3>
                </div>
                <p>Compact numeric steppers preserve the exact server values without implying unsupported ranges.</p>
              </div>

              <div class="spire-editor-grid spire-editor-grid--three">
                <div class="spire-editor-field">
                  <label for="mercenary-gender">Gender</label>
                  <select id="mercenary-gender" v-model.number="editModel.gender" class="form-control form-control-sm">
                    <option v-for="option in genderOptionsForRecord" :key="option.value" :value="option.value">
                      {{ option.label }} ({{ option.value }})
                    </option>
                  </select>
                </div>
                <div
                  v-for="field in appearanceFields"
                  :key="field.key"
                  class="spire-editor-field"
                >
                  <label :for="'mercenary-' + field.key">{{ field.label }}</label>
                  <input
                    :id="'mercenary-' + field.key"
                    v-model.number="editModel[field.key]"
                    class="form-control form-control-sm"
                    type="number"
                    min="0"
                    max="4294967295"
                  >
                  <span v-if="field.help" class="spire-editor-field-help">{{ field.help }}</span>
                </div>
              </div>
            </section>

            <section v-if="selectedTab === 'Buffs'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Active effects</div>
                  <h3>Spell-aware mercenary buffs</h3>
                </div>
                <b-button
                  size="sm"
                  variant="outline-warning"
                  :disabled="isCreating"
                  data-testid="mercenary-add-buff"
                  @click="openBuffModal()"
                >
                  <i class="fa fa-plus mr-1"></i>Add buff
                </b-button>
              </div>

              <div v-if="isCreating" class="spire-editor-callout">
                <i class="fa fa-info-circle"></i>
                Save the mercenary before attaching active spell buffs.
              </div>
              <div v-else-if="!buffs.length" class="buff-empty-state">
                <i class="ra ra-burning-embers"></i>
                <strong>No active buffs</strong>
                <span>Add a spell-aware buff without memorizing a raw spell ID.</span>
                <b-button size="sm" variant="outline-warning" @click="openBuffModal()">
                  Add first buff
                </b-button>
              </div>
              <div v-else class="mercenary-buff-list">
                <button
                  v-for="buff in buffs"
                  :key="'buff-' + buff.merc_buff_id"
                  type="button"
                  @click="openBuffModal(buff)"
                >
                  <span class="buff-icon">
                    <span v-if="Number(buff.spell_icon) >= 0" :class="'spell-' + Number(buff.spell_icon) + '-20'"></span>
                    <i v-else class="ra ra-burning-embers"></i>
                  </span>
                  <span class="buff-body">
                    <strong>{{ buff.spell_name || 'Unknown spell #' + buff.spell_id }}</strong>
                    <small>
                      Spell #{{ buff.spell_id }} · caster level {{ buff.caster_level }}
                      · {{ buff.tics_remaining }} ticks
                    </small>
                  </span>
                  <span class="buff-aside">
                    <i v-if="buff.persistent" class="fa fa-thumb-tack" title="Persistent"></i>
                    #{{ buff.merc_buff_id }} <i class="fa fa-angle-right"></i>
                  </span>
                </button>
              </div>
            </section>

            <section v-if="selectedTab === 'Audit Trail'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-kicker">Traceability</div>
                  <h3>Mercenary change history</h3>
                </div>
                <b-button size="sm" variant="outline-warning" :disabled="isCreating || loadingAudit" @click="loadAudit">
                  <i :class="loadingAudit ? 'fa fa-spinner fa-spin mr-1' : 'fa fa-refresh mr-1'"></i>Refresh
                </b-button>
              </div>

              <div v-if="isCreating" class="spire-editor-callout">
                Audit history becomes available after the mercenary is saved.
              </div>
              <div v-else-if="loadingAudit && !auditEntries.length" class="audit-state">
                <i class="fa fa-spinner fa-spin"></i>Loading required audit history…
              </div>
              <div v-else-if="auditError" class="audit-state audit-state--error">
                <i class="fa fa-exclamation-triangle"></i>{{ auditError }}
              </div>
              <div v-else-if="!auditEntries.length" class="audit-state">
                <i class="fa fa-history"></i>No mercenary audit events have been recorded yet.
              </div>
              <div v-else class="mercenary-audit-list">
                <article v-for="entry in auditEntries" :key="'audit-' + entry.id">
                  <span class="audit-icon"><i :class="auditIcon(entry.event_name)"></i></span>
                  <div>
                    <strong>{{ auditLabel(entry.event_name) }}</strong>
                    <span>{{ entry.user_name }} · {{ formatDate(entry.created_at) }}</span>
                    <small v-if="entry.data && entry.data.reason">{{ entry.data.reason }}</small>
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
      ref="buffModal"
      modal-class="mercenary-editor-modal"
      :title="buffDraft.merc_buff_id ? 'Edit mercenary buff' : 'Add mercenary buff'"
      hide-footer
      @hidden="resetBuffModal"
    >
      <div class="spire-editor-field">
        <label for="mercenary-buff-spell-search">Spell</label>
        <div class="spire-editor-search">
          <i class="fa fa-search"></i>
          <input
            id="mercenary-buff-spell-search"
            v-model.trim="spellSearch"
            class="form-control form-control-sm"
            placeholder="Search spell name or exact ID…"
            autocomplete="off"
            @input="queueSpellSearch"
          >
        </div>
      </div>
      <div v-if="searchingSpells" class="lookup-state">
        <i class="fa fa-spinner fa-spin mr-1"></i>Searching spells…
      </div>
      <div v-else-if="spellResults.length" class="mercenary-lookup-results mercenary-lookup-results--modal">
        <button
          v-for="spell in spellResults"
          :key="'spell-' + spell.id"
          type="button"
          @click="selectSpell(spell)"
        >
          <span>
            <strong>{{ spell.name || 'Unnamed spell' }}</strong>
            <small>Duration formula {{ spell.duration_formula }} · base {{ spell.duration }}</small>
          </span>
          <span>#{{ spell.id }}</span>
        </button>
      </div>
      <div v-else-if="spellSearchComplete && spellSearch" class="lookup-state">No matching spells.</div>

      <div v-if="selectedSpellName" class="selected-spell-card">
        <span class="buff-icon">
          <span v-if="Number(buffDraft.spell_icon) >= 0" :class="'spell-' + Number(buffDraft.spell_icon) + '-20'"></span>
          <i v-else class="ra ra-burning-embers"></i>
        </span>
        <span><strong>{{ selectedSpellName }}</strong><small>Spell #{{ buffDraft.spell_id }}</small></span>
      </div>

      <div class="spire-editor-grid spire-editor-grid--three buff-form-grid">
        <div class="spire-editor-field">
          <label for="mercenary-buff-caster-level">Caster level</label>
          <input id="mercenary-buff-caster-level" v-model.number="buffDraft.caster_level" class="form-control form-control-sm" type="number" min="0" max="255">
        </div>
        <div class="spire-editor-field">
          <label for="mercenary-buff-duration-formula">Duration formula</label>
          <input id="mercenary-buff-duration-formula" v-model.number="buffDraft.duration_formula" class="form-control form-control-sm" type="number" min="0">
        </div>
        <div class="spire-editor-field">
          <label for="mercenary-buff-ticks">Ticks remaining</label>
          <input id="mercenary-buff-ticks" v-model.number="buffDraft.tics_remaining" class="form-control form-control-sm" type="number">
        </div>
      </div>

      <div class="mercenary-toggle-card modal-toggle">
        <div><strong>Persistent</strong><span>Effect survives the server’s normal buff persistence handling.</span></div>
        <button
          type="button"
          class="mercenary-toggle"
          :class="{ active: buffDraft.persistent }"
          role="switch"
          :aria-checked="buffDraft.persistent ? 'true' : 'false'"
          @click="buffDraft.persistent = !buffDraft.persistent"
        ><span></span></button>
      </div>

      <details class="buff-advanced">
        <summary>Advanced counters, runes, and cast coordinates</summary>
        <div class="spire-editor-grid spire-editor-grid--three buff-form-grid">
          <div v-for="field in buffAdvancedFields" :key="field.key" class="spire-editor-field">
            <label :for="'mercenary-buff-' + field.key">{{ field.label }}</label>
            <input
              :id="'mercenary-buff-' + field.key"
              v-model.number="buffDraft[field.key]"
              class="form-control form-control-sm"
              type="number"
              :min="field.signed ? null : 0"
            >
          </div>
        </div>
      </details>

      <div class="modal-actions">
        <b-button
          v-if="buffDraft.merc_buff_id"
          size="sm"
          variant="outline-danger"
          :disabled="operationBusy"
          @click="deleteBuff"
        >
          <i class="fa fa-trash mr-1"></i>Remove buff
        </b-button>
        <span></span>
        <b-button size="sm" variant="outline-secondary" :disabled="operationBusy" @click="$refs.buffModal.hide()">
          Cancel
        </b-button>
        <b-button size="sm" variant="outline-warning" :disabled="!canSaveBuff" @click="saveBuff">
          <i :class="operationBusy ? 'fa fa-spinner fa-spin mr-1' : 'fa fa-save mr-1'"></i>Save buff
        </b-button>
      </div>
    </b-modal>

    <b-modal ref="deleteModal" modal-class="mercenary-editor-modal" title="Delete mercenary" hide-footer>
      <div class="danger-heading">
        <i class="fa fa-exclamation-triangle"></i>
        <div><strong>Delete {{ editModel ? editModel.name : 'this mercenary' }}?</strong><span>Its active buff rows will be removed in the same transaction.</span></div>
      </div>
      <div class="spire-editor-field">
        <label for="mercenary-delete-confirmation">Type the exact mercenary name</label>
        <input id="mercenary-delete-confirmation" v-model="deleteDraft.confirmation" class="form-control form-control-sm" autocomplete="off">
      </div>
      <div class="spire-editor-field">
        <label for="mercenary-delete-reason">Required audit reason</label>
        <textarea
          id="mercenary-delete-reason"
          v-model.trim="deleteDraft.reason"
          class="form-control form-control-sm"
          rows="3"
          placeholder="Explain why this player-owned mercenary is being removed…"
        ></textarea>
        <span class="spire-editor-field-help">Minimum 8 characters.</span>
      </div>
      <div class="modal-actions">
        <span></span><span></span>
        <b-button size="sm" variant="outline-secondary" :disabled="operationBusy" @click="$refs.deleteModal.hide()">Cancel</b-button>
        <b-button size="sm" variant="outline-danger" :disabled="!canDelete" @click="deleteMercenary">
          <i :class="operationBusy ? 'fa fa-spinner fa-spin mr-1' : 'fa fa-trash mr-1'"></i>Delete permanently
        </b-button>
      </div>
    </b-modal>

    <transition name="fade">
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
  import ContentArea from '../../components/layout/ContentArea'
  import EqWindow from '../../components/eq-ui/EQWindow'
  import { SpireApi } from '../../app/api/spire-api'
  import { RACES } from '../../app/constants/eq-race-constants'
  import { DB_PLAYER_CLASSES } from '../../app/constants/eq-classes-constants'

  const TABS = ['Overview', 'Owner & State', 'Appearance', 'Buffs', 'Audit Trail']
  const MERCENARY_FIELDS = [
    'merc_id', 'owner_character_id', 'slot', 'name', 'template_id', 'suspended_time',
    'is_suspended', 'timer_remaining', 'gender', 'merc_size', 'stance_id', 'hp', 'mana',
    'endurance', 'face', 'luclin_hair_style', 'luclin_hair_color', 'luclin_eye_color',
    'luclin_eye_color_2', 'luclin_beard_color', 'luclin_beard', 'drakkin_heritage',
    'drakkin_tattoo', 'drakkin_details'
  ]
  const STANCES = [
    { value: 0, label: 'Unknown', description: 'No recognized stance behavior is selected.' },
    { value: 1, label: 'Passive', description: 'Avoids active combat behavior.' },
    { value: 2, label: 'Balanced', description: 'Uses a balanced combat profile.' },
    { value: 3, label: 'Efficient', description: 'Conserves resources while contributing.' },
    { value: 4, label: 'Reactive', description: 'Responds to combat and support needs.' },
    { value: 5, label: 'Aggressive', description: 'Prioritizes active combat pressure.' },
    { value: 6, label: 'Assist', description: 'Assists the owner’s current combat target.' },
    { value: 7, label: 'Burn', description: 'Uses high-output single-target abilities.' },
    { value: 8, label: 'Efficient II', description: 'The second PEQ/EQEmu efficient stance value.' },
    { value: 9, label: 'Burn AE', description: 'Uses high-output area abilities.' }
  ]
  const EMPTY_BUFF = {
    merc_buff_id: 0,
    spell_id: 0,
    spell_name: '',
    spell_icon: -1,
    caster_level: 1,
    duration_formula: 0,
    tics_remaining: 0,
    poison_counters: 0,
    disease_counters: 0,
    curse_counters: 0,
    corruption_counters: 0,
    hit_count: 0,
    melee_rune: 0,
    magic_rune: 0,
    dot_rune: 0,
    cast_on_x: 0,
    cast_on_y: 0,
    cast_on_z: 0,
    persistent: false,
    extra_di_chance: 0
  }

  function clone (value) {
    return value == null ? value : JSON.parse(JSON.stringify(value))
  }

  function pickMercenary (record) {
    const result = {}
    MERCENARY_FIELDS.forEach(field => {
      if (field === 'name') result[field] = String(record[field] || '')
      else if (field === 'is_suspended') result[field] = Boolean(record[field])
      else result[field] = Number(record[field] || 0)
    })
    return result
  }

  function emptyMercenary () {
    return pickMercenary({
      merc_id: 0,
      owner_character_id: 0,
      slot: 0,
      name: '',
      template_id: 0,
      suspended_time: 0,
      is_suspended: false,
      timer_remaining: 0,
      gender: 0,
      merc_size: 5,
      stance_id: 0,
      hp: 0,
      mana: 0,
      endurance: 0,
      face: 1,
      luclin_hair_style: 1,
      luclin_hair_color: 1,
      luclin_eye_color: 1,
      luclin_eye_color_2: 1,
      luclin_beard_color: 1,
      luclin_beard: 0,
      drakkin_heritage: 0,
      drakkin_tattoo: 0,
      drakkin_details: 0
    })
  }

  export default {
    name: 'MercenaryEditor',
    components: { ContentArea, EqWindow },
    data () {
      const routeTab = this.$route.query.tab
      return {
        tabs: TABS,
        selectedTab: TABS.includes(routeTab) ? routeTab : 'Overview',
        stateFilters: [
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'suspended', label: 'Suspended' }
        ],
        stateFilter: 'all',
        records: [],
        totalRecords: 0,
        currentPage: 1,
        pageSize: 30,
        search: '',
        searchTimer: null,
        loadingDirectory: false,
        loadingDetail: false,
        directoryError: '',
        selectedID: null,
        detail: null,
        editModel: null,
        originalModel: null,
        selectedOwner: null,
        isCreating: false,
        saving: false,
        operationBusy: false,
        ownerSearch: '',
        ownerSearchTimer: null,
        ownerResults: [],
        searchingOwners: false,
        ownerSearchComplete: false,
        spellSearch: '',
        spellSearchTimer: null,
        spellResults: [],
        searchingSpells: false,
        spellSearchComplete: false,
        buffDraft: clone(EMPTY_BUFF),
        auditEntries: [],
        loadingAudit: false,
        auditError: '',
        deleteDraft: { confirmation: '', reason: '' },
        notification: { message: '', type: 'success', timer: null },
        stanceOptions: STANCES,
        appearanceFields: [
          { key: 'face', label: 'Face' },
          { key: 'luclin_hair_style', label: 'Hair style' },
          { key: 'luclin_hair_color', label: 'Hair color' },
          { key: 'luclin_eye_color', label: 'Primary eye color' },
          { key: 'luclin_eye_color_2', label: 'Secondary eye color' },
          { key: 'luclin_beard', label: 'Beard style' },
          { key: 'luclin_beard_color', label: 'Beard color' },
          { key: 'drakkin_heritage', label: 'Drakkin heritage' },
          { key: 'drakkin_tattoo', label: 'Drakkin tattoo' },
          { key: 'drakkin_details', label: 'Drakkin details' }
        ],
        buffAdvancedFields: [
          { key: 'poison_counters', label: 'Poison counters' },
          { key: 'disease_counters', label: 'Disease counters' },
          { key: 'curse_counters', label: 'Curse counters' },
          { key: 'corruption_counters', label: 'Corruption counters' },
          { key: 'hit_count', label: 'Hit count' },
          { key: 'melee_rune', label: 'Melee rune' },
          { key: 'magic_rune', label: 'Magic rune' },
          { key: 'dot_rune', label: 'DoT rune', signed: true },
          { key: 'cast_on_x', label: 'Cast X', signed: true },
          { key: 'cast_on_y', label: 'Cast Y', signed: true },
          { key: 'cast_on_z', label: 'Cast Z', signed: true },
          { key: 'extra_di_chance', label: 'Extra DI chance', signed: true }
        ]
      }
    },
    computed: {
      totalPages () {
        return Math.max(1, Math.ceil(this.totalRecords / this.pageSize))
      },
      activeCount () {
        return this.records.filter(record => !record.is_suspended).length
      },
      buffCount () {
        return this.records.reduce((sum, record) => sum + Number(record.buff_count || 0), 0)
      },
      buffs () {
        return this.detail && Array.isArray(this.detail.buffs) ? this.detail.buffs : []
      },
      hasUnsavedChanges () {
        return Boolean(this.editModel && this.originalModel && JSON.stringify(this.editModel) !== JSON.stringify(this.originalModel))
      },
      canSave () {
        return Boolean(
          !this.saving &&
            this.editModel &&
            String(this.editModel.name || '').trim() &&
            Number(this.editModel.owner_character_id) > 0 &&
            Number(this.editModel.merc_size) > 0 &&
            (this.isCreating || this.hasUnsavedChanges)
        )
      },
      stanceOptionsForRecord () {
        const current = Number(this.editModel ? this.editModel.stance_id : 0)
        if (this.stanceOptions.some(option => option.value === current)) return this.stanceOptions
        return [{ value: current, label: 'Legacy stance', description: 'Unknown legacy server value; preserved until deliberately changed.' }, ...this.stanceOptions]
      },
      genderOptionsForRecord () {
        const options = [
          { value: 0, label: 'Male' },
          { value: 1, label: 'Female' },
          { value: 2, label: 'Neutral' }
        ]
        const current = Number(this.editModel ? this.editModel.gender : 0)
        if (options.some(option => option.value === current)) return options
        return [{ value: current, label: 'Legacy gender' }, ...options]
      },
      selectedOwnerName () {
        if (this.selectedOwner && this.selectedOwner.name) return this.selectedOwner.name
        if (this.detail && this.detail.mercenary && this.detail.mercenary.owner_name) return this.detail.mercenary.owner_name
        return this.editModel && this.editModel.owner_character_id
          ? `Character #${this.editModel.owner_character_id}`
          : 'No owner selected'
      },
      selectedOwnerAccountID () {
        if (this.selectedOwner) return this.selectedOwner.account_id
        return this.detail && this.detail.mercenary ? this.detail.mercenary.owner_account_id : 0
      },
      suspendedDateTime () {
        if (!this.editModel || !Number(this.editModel.suspended_time)) return ''
        const date = new Date(Number(this.editModel.suspended_time) * 1000)
        if (Number.isNaN(date.getTime())) return ''
        const pad = value => String(value).padStart(2, '0')
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
      },
      suspensionSummary () {
        if (!this.editModel || !this.editModel.is_suspended) return 'Not suspended.'
        if (!Number(this.editModel.suspended_time)) return 'Indefinite or server-managed suspension.'
        return `Server timestamp ${this.editModel.suspended_time} · ${this.formatDate(new Date(Number(this.editModel.suspended_time) * 1000))}`
      },
      selectedSpellName () {
        return this.buffDraft.spell_name || (this.buffDraft.spell_id ? `Spell #${this.buffDraft.spell_id}` : '')
      },
      canSaveBuff () {
        return Boolean(!this.operationBusy && Number(this.buffDraft.spell_id) > 0 && Number(this.buffDraft.caster_level) >= 0)
      },
      canDelete () {
        return Boolean(
          !this.operationBusy &&
            this.editModel &&
            this.deleteDraft.confirmation === this.editModel.name &&
            this.deleteDraft.reason.length >= 8
        )
      }
    },
    watch: {
      '$route.query.mercenary' (value) {
        const id = Number(value || 0)
        if (id && id !== Number(this.selectedID)) this.loadDetail(id)
      },
      '$route.query.tab' (value) {
        if (TABS.includes(value) && value !== this.selectedTab) {
          this.selectedTab = value
          if (value === 'Audit Trail' && !this.auditEntries.length && !this.isCreating) this.loadAudit()
        }
      }
    },
    created () {
      this.loadDirectory().then(() => {
        const routeID = Number(this.$route.query.mercenary || 0)
        if (routeID) this.loadDetail(routeID)
        else if (this.records.length) this.selectMercenary(this.records[0].merc_id)
      })
    },
    beforeDestroy () {
      clearTimeout(this.searchTimer)
      clearTimeout(this.ownerSearchTimer)
      clearTimeout(this.spellSearchTimer)
      clearTimeout(this.notification.timer)
    },
    beforeRouteLeave (to, from, next) {
      if (this.hasUnsavedChanges && !window.confirm('Discard unsaved mercenary changes?')) return next(false)
      next()
    },
    beforeRouteUpdate (to, from, next) {
      const nextID = Number(to.query.mercenary || 0)
      const changesMercenary = nextID && nextID !== Number(this.selectedID)
      if (changesMercenary && this.hasUnsavedChanges && !window.confirm('Discard unsaved mercenary changes?')) {
        return next(false)
      }
      next()
    },
    methods: {
      number (value) {
        return Number(value || 0).toLocaleString()
      },
      ownerLabel (record) {
        return record.owner_name || `Character #${record.owner_character_id}`
      },
      stanceLabel (value) {
        const stance = STANCES.find(option => option.value === Number(value))
        return stance ? stance.label : `Legacy stance #${value}`
      },
      stanceDescription (value) {
        const stance = this.stanceOptionsForRecord.find(option => option.value === Number(value))
        return stance ? stance.description : ''
      },
      raceLabel (value) {
        return RACES[String(value)] || `Race #${value}`
      },
      classLabel (value) {
        return DB_PLAYER_CLASSES[String(value)] || `Class #${value}`
      },
      durationLabel (seconds) {
        const value = Math.max(0, Number(seconds || 0))
        if (!value) return 'No remaining timer.'
        const days = Math.floor(value / 86400)
        const hours = Math.floor((value % 86400) / 3600)
        const minutes = Math.floor((value % 3600) / 60)
        return [days ? `${days}d` : '', hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', `${value % 60}s`].filter(Boolean).join(' ')
      },
      formatDate (value) {
        const date = value instanceof Date ? value : new Date(value)
        if (Number.isNaN(date.getTime())) return 'Unknown date'
        return date.toLocaleString()
      },
      setSuspendedDateTime (value) {
        if (!value) {
          this.editModel.suspended_time = 0
          return
        }
        const timestamp = Math.floor(new Date(value).getTime() / 1000)
        this.editModel.suspended_time = Number.isFinite(timestamp) ? timestamp : 0
      },
      queueDirectorySearch () {
        clearTimeout(this.searchTimer)
        this.currentPage = 1
        this.searchTimer = setTimeout(() => this.loadDirectory(), 250)
      },
      async loadDirectory () {
        this.loadingDirectory = true
        this.directoryError = ''
        try {
          const response = await SpireApi.v1().get('/mercenary-editor/mercenaries', {
            params: {
              search: this.search || undefined,
              state: this.stateFilter === 'all' ? undefined : this.stateFilter,
              page: this.currentPage,
              limit: this.pageSize
            }
          })
          this.records = Array.isArray(response.data.data) ? response.data.data : []
          this.totalRecords = Number(response.data.total || 0)
          if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages
            return this.loadDirectory()
          }
        } catch (error) {
          this.records = []
          this.totalRecords = 0
          this.directoryError = this.errorMessage(error, 'Unable to load mercenaries')
        } finally {
          this.loadingDirectory = false
        }
      },
      async selectMercenary (id) {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved mercenary changes?')) return
        await this.loadDetail(id)
        this.updateRoute()
      },
      async loadDetail (id) {
        this.loadingDetail = true
        try {
          const response = await SpireApi.v1().get(`/mercenary-editor/mercenary/${id}`)
          this.applyDetail(response.data)
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to load mercenary'), 'error')
        } finally {
          this.loadingDetail = false
        }
      },
      applyDetail (detail) {
        this.detail = clone(detail)
        this.selectedID = Number(detail.mercenary.merc_id)
        this.editModel = pickMercenary(detail.mercenary)
        this.originalModel = clone(this.editModel)
        this.selectedOwner = {
          id: detail.mercenary.owner_character_id,
          name: detail.mercenary.owner_name,
          account_id: detail.mercenary.owner_account_id,
          level: detail.mercenary.owner_level,
          class: detail.mercenary.owner_class,
          race: detail.mercenary.owner_race,
          gender: detail.mercenary.owner_gender,
          merc_count: 0
        }
        this.isCreating = false
        this.auditEntries = []
        this.auditError = ''
        if (this.selectedTab === 'Audit Trail') this.loadAudit()
      },
      createDraft () {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved mercenary changes?')) return
        this.selectedID = null
        this.detail = { mercenary: {}, buffs: [] }
        this.editModel = emptyMercenary()
        this.originalModel = clone(this.editModel)
        this.selectedOwner = null
        this.isCreating = true
        this.selectedTab = 'Overview'
        this.updateRoute()
      },
      payload () {
        const payload = {}
        MERCENARY_FIELDS.filter(field => field !== 'merc_id').forEach(field => {
          payload[field] = field === 'name'
            ? String(this.editModel[field] || '').trim()
            : field === 'is_suspended'
              ? Boolean(this.editModel[field])
              : Number(this.editModel[field] || 0)
        })
        return payload
      },
      async saveMercenary () {
        if (!this.canSave) return
        this.saving = true
        try {
          const wasCreating = this.isCreating
          const response = wasCreating
            ? await SpireApi.v1().put('/mercenary-editor/mercenary', this.payload())
            : await SpireApi.v1().patch(`/mercenary-editor/mercenary/${this.selectedID}`, this.payload())
          this.applyDetail(response.data)
          await this.loadDirectory()
          this.updateRoute()
          this.showNotification(wasCreating ? 'Mercenary created' : 'Mercenary saved')
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to save mercenary'), 'error')
        } finally {
          this.saving = false
        }
      },
      confirmCopy () {
        if (!window.confirm(`Copy ${this.editModel.name} and every active buff into the next available owner slot?`)) return
        this.copyMercenary()
      },
      async copyMercenary () {
        this.operationBusy = true
        try {
          const response = await SpireApi.v1().post(`/mercenary-editor/mercenary/${this.selectedID}/copy`)
          this.applyDetail(response.data)
          await this.loadDirectory()
          this.updateRoute()
          this.showNotification('Mercenary and active buffs copied')
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to copy mercenary'), 'error')
        } finally {
          this.operationBusy = false
        }
      },
      openDeleteModal () {
        this.deleteDraft = { confirmation: '', reason: '' }
        this.$refs.deleteModal.show()
      },
      async deleteMercenary () {
        if (!this.canDelete) return
        this.operationBusy = true
        try {
          await SpireApi.v1().delete(`/mercenary-editor/mercenary/${this.selectedID}`, { data: this.deleteDraft })
          this.$refs.deleteModal.hide()
          this.editModel = null
          this.originalModel = null
          this.detail = null
          this.selectedID = null
          await this.loadDirectory()
          if (this.records.length) await this.selectMercenary(this.records[0].merc_id)
          else this.updateRoute()
          this.showNotification('Mercenary and active buffs deleted')
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to delete mercenary'), 'error')
        } finally {
          this.operationBusy = false
        }
      },
      queueOwnerSearch () {
        clearTimeout(this.ownerSearchTimer)
        this.ownerSearchComplete = false
        if (!this.ownerSearch) {
          this.ownerResults = []
          return
        }
        this.ownerSearchTimer = setTimeout(() => this.searchOwners(), 250)
      },
      async searchOwners () {
        this.searchingOwners = true
        try {
          const response = await SpireApi.v1().get('/mercenary-editor/references/characters', { params: { search: this.ownerSearch } })
          this.ownerResults = Array.isArray(response.data.data) ? response.data.data : []
        } catch (error) {
          this.ownerResults = []
          this.showNotification(this.errorMessage(error, 'Unable to search characters'), 'error')
        } finally {
          this.searchingOwners = false
          this.ownerSearchComplete = true
        }
      },
      selectOwner (owner) {
        this.selectedOwner = clone(owner)
        this.editModel.owner_character_id = Number(owner.id)
        this.ownerSearch = ''
        this.ownerResults = []
        this.ownerSearchComplete = false
      },
      selectTab (tab) {
        this.selectedTab = tab
        this.updateRoute()
        if (tab === 'Audit Trail' && !this.auditEntries.length && !this.isCreating) this.loadAudit()
      },
      updateRoute () {
        const query = { ...this.$route.query, tab: this.selectedTab }
        if (this.selectedID && !this.isCreating) query.mercenary = String(this.selectedID)
        else delete query.mercenary
        const same = JSON.stringify(query) === JSON.stringify(this.$route.query)
        if (!same) this.$router.replace({ path: this.$route.path, query }).catch(() => {})
      },
      async loadAudit () {
        if (!this.selectedID || this.isCreating) return
        this.loadingAudit = true
        this.auditError = ''
        try {
          const response = await SpireApi.v1().get(`/mercenary-editor/mercenary/${this.selectedID}/audit`, { params: { limit: 50 } })
          this.auditEntries = Array.isArray(response.data.data) ? response.data.data : []
        } catch (error) {
          this.auditError = this.errorMessage(error, 'Unable to load audit history')
        } finally {
          this.loadingAudit = false
        }
      },
      openBuffModal (buff = null) {
        this.buffDraft = clone(buff || EMPTY_BUFF)
        this.spellSearch = ''
        this.spellResults = []
        this.spellSearchComplete = false
        this.$refs.buffModal.show()
      },
      resetBuffModal () {
        clearTimeout(this.spellSearchTimer)
        this.buffDraft = clone(EMPTY_BUFF)
        this.spellSearch = ''
        this.spellResults = []
        this.searchingSpells = false
        this.spellSearchComplete = false
      },
      queueSpellSearch () {
        clearTimeout(this.spellSearchTimer)
        this.spellSearchComplete = false
        if (!this.spellSearch) {
          this.spellResults = []
          return
        }
        this.spellSearchTimer = setTimeout(() => this.searchSpells(), 250)
      },
      async searchSpells () {
        this.searchingSpells = true
        try {
          const response = await SpireApi.v1().get('/mercenary-editor/references/spells', { params: { search: this.spellSearch } })
          this.spellResults = Array.isArray(response.data.data) ? response.data.data : []
        } catch (error) {
          this.spellResults = []
          this.showNotification(this.errorMessage(error, 'Unable to search spells'), 'error')
        } finally {
          this.searchingSpells = false
          this.spellSearchComplete = true
        }
      },
      selectSpell (spell) {
        this.buffDraft.spell_id = Number(spell.id)
        this.buffDraft.spell_name = spell.name
        this.buffDraft.spell_icon = Number(spell.icon)
        if (!Number(this.buffDraft.duration_formula)) this.buffDraft.duration_formula = Number(spell.duration_formula || 0)
        this.spellSearch = ''
        this.spellResults = []
        this.spellSearchComplete = false
      },
      buffPayload () {
        const payload = {}
        Object.keys(EMPTY_BUFF).filter(field => !['merc_buff_id', 'spell_name', 'spell_icon'].includes(field)).forEach(field => {
          payload[field] = field === 'persistent' ? Boolean(this.buffDraft[field]) : Number(this.buffDraft[field] || 0)
        })
        return payload
      },
      async saveBuff () {
        if (!this.canSaveBuff) return
        this.operationBusy = true
        try {
          const response = this.buffDraft.merc_buff_id
            ? await SpireApi.v1().patch(`/mercenary-editor/mercenary/${this.selectedID}/buff/${this.buffDraft.merc_buff_id}`, this.buffPayload())
            : await SpireApi.v1().put(`/mercenary-editor/mercenary/${this.selectedID}/buff`, this.buffPayload())
          const buff = response.data
          const index = this.buffs.findIndex(entry => Number(entry.merc_buff_id) === Number(buff.merc_buff_id))
          if (index >= 0) this.detail.buffs.splice(index, 1, buff)
          else this.detail.buffs.push(buff)
          this.$refs.buffModal.hide()
          await this.loadDirectory()
          this.auditEntries = []
          this.showNotification(this.buffDraft.merc_buff_id ? 'Mercenary buff saved' : 'Mercenary buff added')
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to save mercenary buff'), 'error')
        } finally {
          this.operationBusy = false
        }
      },
      async deleteBuff () {
        if (!this.buffDraft.merc_buff_id || !window.confirm(`Remove ${this.selectedSpellName} from this mercenary?`)) return
        this.operationBusy = true
        try {
          await SpireApi.v1().delete(`/mercenary-editor/mercenary/${this.selectedID}/buff/${this.buffDraft.merc_buff_id}`)
          const index = this.buffs.findIndex(entry => Number(entry.merc_buff_id) === Number(this.buffDraft.merc_buff_id))
          if (index >= 0) this.detail.buffs.splice(index, 1)
          this.$refs.buffModal.hide()
          await this.loadDirectory()
          this.auditEntries = []
          this.showNotification('Mercenary buff removed')
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to remove mercenary buff'), 'error')
        } finally {
          this.operationBusy = false
        }
      },
      auditIcon (eventName) {
        if (eventName.includes('DELETE')) return 'fa fa-trash'
        if (eventName.includes('CREATE') || eventName.includes('COPY')) return 'fa fa-plus'
        return 'fa fa-pencil'
      },
      auditLabel (eventName) {
        return String(eventName || '').replace('MERCENARY_', '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())
      },
      errorMessage (error, fallback) {
        return error && error.response && error.response.data && error.response.data.error
          ? error.response.data.error
          : fallback
      },
      showNotification (message, type = 'success') {
        clearTimeout(this.notification.timer)
        this.notification = { message, type, timer: null }
        this.notification.timer = setTimeout(() => {
          this.notification.message = ''
        }, 4200)
      }
    }
  }
</script>

<style src="../../assets/css/content-editor-workspace.css"></style>

<style scoped>
  .mercenary-editor-page .spire-editor-directory-list {
    gap: 3px;
  }

  .mercenary-editor-page .spire-editor-directory-row {
    min-height: 46px;
    padding: 5px 7px !important;
  }

  .mercenary-editor-page .spire-editor-tabs .tab-count {
    background: rgba(210, 170, 69, 0.14);
    border: 1px solid rgba(210, 170, 69, 0.25);
    color: #d9bd66;
    font-size: 8px;
    margin-left: 5px;
    padding: 1px 4px;
  }

  .directory-active {
    color: #52d89b;
    font-size: 6px;
    margin-right: 3px;
  }

  .directory-suspended {
    color: #da6d69;
    font-size: 6px;
    margin-right: 3px;
  }

  .mercenary-resource-grid {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 14px;
  }

  .mercenary-resource-grid label {
    align-items: center;
    background: rgba(0, 0, 0, 0.24);
    border: 1px solid rgba(178, 191, 204, 0.16);
    display: grid;
    gap: 7px;
    grid-template-columns: auto minmax(0, 1fr) auto;
    margin: 0;
    padding: 9px;
  }

  .mercenary-resource-grid label > span {
    color: #aab3bb;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .mercenary-resource-grid label > strong {
    color: #e3c464;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 16px;
  }

  .mercenary-resource-grid input {
    min-width: 0;
  }

  .owner-card {
    min-height: 146px;
  }

  .context-label {
    color: #d3ad4e;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .owner-facts {
    display: grid;
    gap: 5px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 14px;
  }

  .owner-facts span {
    border-left: 1px solid rgba(210, 170, 69, 0.28);
    color: #dfe2e5;
    font-size: 11px;
    padding-left: 8px;
  }

  .owner-facts small {
    color: #77838e;
    display: block;
    font-size: 8px;
    margin-bottom: 2px;
    text-transform: uppercase;
  }

  .mercenary-lookup-results {
    background: rgba(2, 8, 13, 0.96);
    border: 1px solid rgba(210, 170, 69, 0.38);
    max-height: 240px;
    overflow-y: auto;
  }

  .mercenary-lookup-results button {
    align-items: center;
    background: transparent !important;
    border: 0 !important;
    border-bottom: 1px solid rgba(178, 191, 204, 0.13) !important;
    color: #dce0e3;
    display: flex !important;
    font-size: 10px !important;
    justify-content: space-between;
    line-height: 1.25 !important;
    padding: 8px 10px !important;
    text-align: left !important;
    width: 100%;
  }

  .mercenary-lookup-results button:hover,
  .mercenary-lookup-results button:focus {
    background: rgba(210, 170, 69, 0.13) !important;
    color: #f0d473;
  }

  .mercenary-lookup-results button span:first-child {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .mercenary-lookup-results small,
  .selected-spell-card small {
    color: #7f8a94;
    display: block;
    font-size: 8px;
    margin-top: 2px;
  }

  .lookup-state {
    color: #89949e;
    font-size: 10px;
    padding: 10px 2px;
  }

  .mercenary-state-layout {
    display: grid;
    gap: 8px;
    grid-template-columns: 1.15fr 1fr 1fr;
    margin-top: 14px;
  }

  .mercenary-toggle-card {
    align-items: center;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(178, 191, 204, 0.16);
    display: flex;
    justify-content: space-between;
    min-height: 68px;
    padding: 10px;
  }

  .mercenary-toggle-card strong,
  .mercenary-toggle-card span {
    display: block;
  }

  .mercenary-toggle-card strong {
    color: #dce0e4;
    font-size: 10px;
  }

  .mercenary-toggle-card div > span {
    color: #7f8993;
    font-size: 8px;
    margin-top: 3px;
  }

  .mercenary-toggle {
    background: #1d2931 !important;
    border: 1px solid #53616b !important;
    border-radius: 10px !important;
    flex: 0 0 32px;
    height: 16px;
    padding: 1px !important;
    position: relative;
  }

  .mercenary-toggle > span {
    background: #9aa4ad;
    border-radius: 50%;
    height: 12px;
    transform: translateX(0);
    transition: transform 120ms ease, background 120ms ease;
    width: 12px;
  }

  .mercenary-toggle.active {
    background: rgba(210, 170, 69, 0.25) !important;
    border-color: #d2aa45 !important;
  }

  .mercenary-toggle.active > span {
    background: #edcd68;
    transform: translateX(15px);
  }

  .spire-editor-callout {
    align-items: center;
    background: rgba(65, 116, 154, 0.1);
    border: 1px solid rgba(93, 151, 194, 0.28);
    color: #aebbc4;
    display: flex;
    font-size: 10px;
    gap: 8px;
    padding: 11px;
  }

  .buff-empty-state,
  .audit-state {
    align-items: center;
    color: #89949e;
    display: flex;
    flex-direction: column;
    font-size: 10px;
    gap: 7px;
    justify-content: center;
    min-height: 230px;
    text-align: center;
  }

  .buff-empty-state > i,
  .audit-state > i {
    color: #bc9a44;
    font-size: 22px;
  }

  .buff-empty-state strong {
    color: #d9dde0;
    font-size: 13px;
  }

  .mercenary-buff-list {
    border: 1px solid rgba(178, 191, 204, 0.15);
  }

  .mercenary-buff-list > button {
    align-items: center;
    background: rgba(4, 11, 17, 0.62) !important;
    border: 0 !important;
    border-bottom: 1px solid rgba(178, 191, 204, 0.13) !important;
    color: #d9dde0;
    display: grid !important;
    gap: 9px;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    min-height: 50px;
    padding: 7px 9px !important;
    text-align: left !important;
    width: 100%;
  }

  .mercenary-buff-list > button:hover,
  .mercenary-buff-list > button:focus {
    background: rgba(210, 170, 69, 0.11) !important;
  }

  .buff-icon {
    align-items: center;
    background: rgba(210, 170, 69, 0.08);
    border: 1px solid rgba(210, 170, 69, 0.2);
    display: flex;
    height: 30px;
    justify-content: center;
    width: 30px;
  }

  .buff-body {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .buff-body strong {
    font-size: 10px;
  }

  .buff-body small,
  .buff-aside {
    color: #7f8993;
    font-size: 8px;
    margin-top: 2px;
  }

  .mercenary-audit-list article {
    align-items: center;
    background: rgba(4, 11, 17, 0.62);
    border: 1px solid rgba(178, 191, 204, 0.14);
    display: grid;
    gap: 9px;
    grid-template-columns: 30px minmax(0, 1fr) auto;
    margin-bottom: 4px;
    padding: 8px;
  }

  .audit-icon {
    align-items: center;
    background: rgba(210, 170, 69, 0.09);
    color: #d3ae50;
    display: flex;
    height: 27px;
    justify-content: center;
    width: 27px;
  }

  .mercenary-audit-list article > div {
    display: flex;
    flex-direction: column;
  }

  .mercenary-audit-list strong {
    color: #dce0e3;
    font-size: 10px;
  }

  .mercenary-audit-list span,
  .mercenary-audit-list small {
    color: #818c96;
    font-size: 8px;
  }

  .audit-state--error {
    color: #e38a83;
  }

  ::v-deep .mercenary-editor-modal .modal-content {
    background: #07111a;
    border: 1px solid rgba(210, 170, 69, 0.58);
    border-radius: 0;
    color: #dce0e3;
  }

  ::v-deep .mercenary-editor-modal .modal-header {
    background: rgba(0, 0, 0, 0.35);
    border-bottom-color: rgba(210, 170, 69, 0.3);
  }

  ::v-deep .mercenary-editor-modal .modal-title {
    color: #e5cc82;
    font-family: Georgia, "Times New Roman", serif;
  }

  ::v-deep .mercenary-editor-modal .modal-body {
    padding: 14px;
  }

  .mercenary-lookup-results--modal {
    margin: 4px 0 10px;
  }

  .selected-spell-card {
    align-items: center;
    background: rgba(210, 170, 69, 0.08);
    border: 1px solid rgba(210, 170, 69, 0.26);
    display: flex;
    gap: 9px;
    margin: 9px 0;
    padding: 8px;
  }

  .selected-spell-card > span:last-child {
    min-width: 0;
  }

  .buff-form-grid {
    margin-top: 10px;
  }

  .modal-toggle {
    margin: 10px 0;
  }

  .buff-advanced {
    border: 1px solid rgba(178, 191, 204, 0.16);
    margin-top: 10px;
    padding: 8px 10px;
  }

  .buff-advanced summary {
    color: #c7ced4;
    cursor: pointer;
    font-size: 10px;
    font-weight: 700;
  }

  .modal-actions {
    align-items: center;
    border-top: 1px solid rgba(178, 191, 204, 0.16);
    display: grid;
    gap: 7px;
    grid-template-columns: auto 1fr auto auto;
    margin-top: 14px;
    padding-top: 12px;
  }

  .danger-heading {
    align-items: center;
    background: rgba(160, 48, 48, 0.1);
    border: 1px solid rgba(201, 80, 74, 0.35);
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    padding: 10px;
  }

  .danger-heading > i {
    color: #df716a;
    font-size: 18px;
  }

  .danger-heading strong,
  .danger-heading span {
    display: block;
  }

  .danger-heading span {
    color: #9eaaB4;
    font-size: 9px;
    margin-top: 3px;
  }

  @media (max-width: 1100px) {
    .mercenary-state-layout,
    .mercenary-resource-grid {
      grid-template-columns: 1fr;
    }

    .owner-facts {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  @media (max-width: 760px) {
    .owner-facts {
      grid-template-columns: 1fr;
    }

    .modal-actions {
      grid-template-columns: 1fr 1fr;
    }

    .modal-actions > span {
      display: none;
    }
  }
</style>
