<template>
  <content-area class="spire-editor-page title-editor-page">
    <div class="spire-editor-toolbar">
      <div>
        <div class="spire-editor-kicker">Content tools · world data</div>
        <h1 class="spire-editor-title">
          <i class="ra ra-crown mr-2"></i>Title Editor
        </h1>
        <p class="spire-editor-subtitle">
          Compose player titles, define real eligibility rules, and manage title-set grants in one workspace.
        </p>
      </div>
      <div class="spire-editor-summary" aria-label="Title directory summary">
        <span><strong>{{ titles.length }}</strong> titles</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ restrictedTitleCount }}</strong> gated</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ assignments.length }}</strong> set grants</span>
      </div>
    </div>

    <div class="spire-editor-workspace">
      <aside class="spire-editor-directory">
        <eq-window title="Player Titles">
          <div class="spire-editor-directory-controls">
            <div class="spire-editor-search">
              <i class="fa fa-search"></i>
              <input
                id="title-directory-search"
                v-model.trim="search"
                class="form-control form-control-sm"
                placeholder="Search title, source, or ID…"
                @input="currentPage = 1"
              >
              <button
                v-if="search"
                class="spire-editor-search-clear"
                type="button"
                aria-label="Clear title search"
                @click="search = ''; currentPage = 1"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <b-button
              size="sm"
              variant="outline-warning"
              data-testid="title-new"
              @click="createDraft()"
            >
              <i class="fa fa-plus mr-1"></i>New
            </b-button>
          </div>

          <div class="spire-editor-filter" role="group" aria-label="Title source filter">
            <button
              v-for="option in directoryFilters"
              :key="option.value"
              type="button"
              :class="{ active: directoryFilter === option.value }"
              @click="directoryFilter = option.value; currentPage = 1"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="spire-editor-directory-meta">
            <span>{{ filteredTitles.length }} records</span>
            <span v-if="loading"><i class="fa fa-spinner fa-spin mr-1"></i>Refreshing</span>
            <span v-else>Page {{ currentPage }}</span>
          </div>

          <div class="spire-editor-directory-list" data-testid="title-directory">
            <button
              v-for="record in pagedTitles"
              :key="'title-' + record.id"
              class="spire-editor-directory-row"
              :class="{ active: Number(selectedId) === Number(record.id) && !isCreating }"
              type="button"
              @click="selectTitle(record.id)"
            >
              <span class="spire-editor-directory-icon">
                <span
                  v-if="itemMap[Number(record.item_id)] && itemMap[Number(record.item_id)].icon"
                  :class="'item-' + itemMap[Number(record.item_id)].icon + '-sm'"
                ></span>
                <i v-else class="ra ra-crown"></i>
              </span>
              <span class="spire-editor-directory-body">
                <span class="spire-editor-directory-name">{{ titleName(record) }}</span>
                <span class="spire-editor-directory-detail">
                  {{ sourceLabel(record) }} · {{ eligibilityCount(record) }} {{ eligibilityCount(record) === 1 ? 'rule' : 'rules' }}
                </span>
              </span>
              <span class="spire-editor-directory-aside">#{{ record.id }}</span>
            </button>

            <div v-if="loadError" class="spire-editor-directory-state spire-editor-directory-state--error">
              <i class="fa fa-exclamation-triangle"></i>
              <span>{{ loadError }}</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="loadTitles">
                Retry
              </button>
            </div>
            <div v-else-if="loading && !titles.length" class="spire-editor-directory-state">
              <i class="fa fa-spinner fa-spin"></i>
              <span>Loading real title data…</span>
            </div>
            <div v-else-if="!pagedTitles.length" class="spire-editor-directory-state">
              <i class="fa fa-search"></i>
              <span>No titles match these filters.</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="createDraft()">
                Create a title
              </button>
            </div>
          </div>

          <nav
            v-if="totalPages > 1"
            class="spire-editor-pagination"
            aria-label="Title directory pages"
          >
            <button
              type="button"
              aria-label="Previous title page"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            >
              <i class="fa fa-angle-left"></i>
            </button>
            <span><strong>{{ currentPage }}</strong> / {{ totalPages }}</span>
            <button
              type="button"
              aria-label="Next title page"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              <i class="fa fa-angle-right"></i>
            </button>
          </nav>
        </eq-window>
      </aside>

      <main class="spire-editor-inspector">
        <eq-window v-if="!editModel && loadError" title="Title Workspace">
          <div class="spire-editor-empty spire-editor-empty--error" role="alert">
            <div class="spire-editor-empty__sigil"><i class="fa fa-exclamation-triangle"></i></div>
            <h3>Title data could not be loaded</h3>
            <p>{{ loadError }}</p>
            <b-button size="sm" variant="outline-warning" @click="loadTitles">
              <i class="fa fa-refresh mr-1"></i>Retry
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="!editModel && !loading" title="Title Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="ra ra-crown"></i></div>
            <h3>Select a player title</h3>
            <p>Preview its display, inspect every eligibility gate, and manage shared title-set grants.</p>
            <b-button size="sm" variant="outline-warning" @click="createDraft()">
              <i class="fa fa-plus mr-1"></i>Create new
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="loading && !editModel" title="Title Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading title context…</h3>
          </div>
        </eq-window>

        <div v-if="editModel" data-testid="title-inspector">
          <eq-window title="Player Title" class="mb-2">
            <div class="spire-editor-header">
              <div class="spire-editor-identity">
                <span class="spire-editor-identity-icon">
                  <span
                    v-if="selectedItem && selectedItem.icon"
                    :class="'item-' + selectedItem.icon"
                  ></span>
                  <i v-else class="ra ra-crown"></i>
                </span>
                <div>
                  <div class="spire-editor-eyebrow">
                    {{ isCreating ? (copiedFromId ? 'Copied title draft' : 'New title draft') : 'Title #' + editModel.id }}
                    <span v-if="hasUnsavedChanges" class="spire-editor-unsaved">
                      <i class="fa fa-circle"></i> Unsaved
                    </span>
                  </div>
                  <h2>{{ titleName(editModel) || 'Untitled player title' }}</h2>
                  <p>{{ sourceLabel(editModel) }} · {{ eligibilitySummary }}</p>
                </div>
              </div>
              <div class="spire-editor-actions">
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-warning"
                  data-testid="title-copy"
                  :disabled="hasUnsavedChanges"
                  @click="copyTitle"
                >
                  <i class="fa fa-copy mr-1"></i>Copy
                </b-button>
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-danger"
                  data-testid="title-delete"
                  :disabled="deleteBlocked || hasUnsavedChanges"
                  @click="deleteTitle"
                >
                  <i class="fa fa-trash mr-1"></i>Delete
                </b-button>
                <b-button
                  v-if="hasUnsavedChanges"
                  size="sm"
                  variant="outline-secondary"
                  @click="resetEditor"
                >
                  <i class="fa fa-undo mr-1"></i>Reset
                </b-button>
                <b-button
                  size="sm"
                  variant="outline-warning"
                  data-testid="title-save"
                  :disabled="!canSave || saving"
                  @click="saveTitle"
                >
                  <i :class="saving ? 'fa fa-spinner fa-spin' : 'fa fa-save'" class="mr-1"></i>
                  {{ saving ? 'Saving' : 'Save' }}
                </b-button>
              </div>
            </div>
          </eq-window>

          <eq-window title="Editor">
            <div class="spire-editor-tabs" role="tablist" aria-label="Title editor sections">
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
                <span v-if="tab === 'Assignments' && titleSetAssignments.length" class="title-tab-count">
                  {{ titleSetAssignments.length }}
                </span>
              </button>
            </div>

            <section v-if="selectedTab === 'Overview'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-section-kicker">Composition</div>
                  <h3>Title identity and live preview</h3>
                </div>
                <small>Prefix and suffix are rendered around the character name by the client.</small>
              </div>

              <div class="title-overview-layout">
                <div class="spire-editor-grid spire-editor-grid--two">
                  <div class="spire-editor-field">
                    <label for="title-id">Title ID</label>
                    <input
                      id="title-id"
                      v-model.number="editModel.id"
                      class="form-control form-control-sm"
                      type="number"
                      min="1"
                      :readonly="!isCreating"
                    >
                    <span class="spire-editor-field-help">Stable primary identifier. Existing IDs cannot be changed.</span>
                  </div>
                  <div class="spire-editor-field">
                    <label for="title-prefix">Prefix</label>
                    <input
                      id="title-prefix"
                      v-model="editModel.prefix"
                      class="form-control form-control-sm"
                      maxlength="32"
                      placeholder="e.g. Veteran"
                    >
                    <span class="spire-editor-field-help">Displayed before the character name.</span>
                  </div>
                  <div class="spire-editor-field">
                    <label for="title-suffix">Suffix</label>
                    <input
                      id="title-suffix"
                      v-model="editModel.suffix"
                      class="form-control form-control-sm"
                      maxlength="32"
                      placeholder="e.g. of the Vale"
                    >
                    <span class="spire-editor-field-help">Displayed after the character name.</span>
                  </div>
                </div>

                <div class="title-live-preview" data-testid="title-live-preview">
                  <div class="spire-editor-context-label">Live client preview</div>
                  <div class="title-live-preview__name">{{ composedTitle }}</div>
                  <div class="title-live-preview__meta">
                    <span v-if="editModel.prefix"><i class="fa fa-long-arrow-left"></i> prefix</span>
                    <span data-testid="title-preview-character">{{ previewCharacterName }}</span>
                    <span v-if="editModel.suffix">suffix <i class="fa fa-long-arrow-right"></i></span>
                  </div>
                  <p v-if="!editModel.prefix && !editModel.suffix">
                    Add a prefix, a suffix, or both to make this title visible.
                  </p>
                </div>
              </div>

              <div class="spire-editor-metric-row mt-3">
                <div class="spire-editor-metric">
                  <span>Eligibility rules</span>
                  <strong>{{ eligibilityCount(editModel) }}</strong>
                </div>
                <div class="spire-editor-metric">
                  <span>Source type</span>
                  <strong class="title-metric-text">{{ sourceLabel(editModel) }}</strong>
                </div>
                <div class="spire-editor-metric">
                  <span>Title set</span>
                  <strong>{{ Number(editModel.title_set) > 0 ? editModel.title_set : '—' }}</strong>
                </div>
                <div class="spire-editor-metric">
                  <span>Set grants</span>
                  <strong>{{ titleSetAssignments.length }}</strong>
                </div>
              </div>
            </section>

            <section v-else-if="selectedTab === 'Eligibility'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-section-kicker">Eligibility</div>
                  <h3>Character and progression gates</h3>
                </div>
                <small>Every enabled rule must be satisfied. “Any” stores the native <code>-1</code> sentinel.</small>
              </div>

              <div class="spire-editor-grid spire-editor-grid--three">
                <div class="spire-editor-field">
                  <label for="title-class">Class</label>
                  <select id="title-class" v-model.number="editModel.class" class="form-control form-control-sm">
                    <option :value="-1">Any class</option>
                    <option
                      v-for="option in classOptions"
                      :key="'class-' + option.value"
                      :value="option.value"
                    >
                      {{ option.label }} ({{ option.value }})
                    </option>
                    <option v-if="isUnknownClass(editModel.class)" :value="editModel.class">
                      Unknown legacy class ({{ editModel.class }})
                    </option>
                  </select>
                  <span class="spire-editor-field-help">Limits this title to one player class.</span>
                </div>
                <div class="spire-editor-field">
                  <label for="title-gender">Gender</label>
                  <select id="title-gender" v-model.number="editModel.gender" class="form-control form-control-sm">
                    <option :value="-1">Any gender</option>
                    <option v-for="option in genderOptions" :key="'gender-' + option.value" :value="option.value">
                      {{ option.label }} ({{ option.value }})
                    </option>
                    <option v-if="isUnknownGender(editModel.gender)" :value="editModel.gender">
                      Unknown legacy gender ({{ editModel.gender }})
                    </option>
                  </select>
                  <span class="spire-editor-field-help">The live title data uses male and female gates; neuter is preserved where present.</span>
                </div>
                <div class="spire-editor-field">
                  <label for="title-status">Minimum account status</label>
                  <select id="title-status" v-model.number="editModel.status" class="form-control form-control-sm">
                    <option :value="-1">Any status</option>
                    <option v-for="option in statusOptions" :key="'status-' + option.value" :value="option.value">
                      {{ option.label }} ({{ option.value }})
                    </option>
                    <option v-if="isUnknownStatus(editModel.status)" :value="editModel.status">
                      Legacy status ({{ editModel.status }})
                    </option>
                  </select>
                  <span class="spire-editor-field-help">Known EQEmu account access levels are named; unknown legacy values remain selectable.</span>
                </div>
              </div>

              <div class="title-rule-card mt-3">
                <div class="title-rule-card__heading">
                  <div>
                    <div class="spire-editor-context-label">Skill gate</div>
                    <strong>{{ skillGateSummary }}</strong>
                  </div>
                  <button v-if="Number(editModel.skill_id) >= 0" type="button" @click="clearSkillGate">
                    Clear
                  </button>
                </div>
                <div class="spire-editor-grid spire-editor-grid--three">
                  <div class="spire-editor-field">
                    <label for="title-skill">Skill</label>
                    <select id="title-skill" v-model.number="editModel.skill_id" class="form-control form-control-sm">
                      <option :value="-1">No skill gate</option>
                      <option v-for="option in skillOptions" :key="'skill-' + option.value" :value="option.value">
                        {{ option.label }} ({{ option.value }})
                      </option>
                      <option v-if="isUnknownSkill(editModel.skill_id)" :value="editModel.skill_id">
                        Unknown legacy skill ({{ editModel.skill_id }})
                      </option>
                    </select>
                  </div>
                  <div class="spire-editor-field">
                    <label for="title-skill-min">Minimum value</label>
                    <input
                      id="title-skill-min"
                      v-model.number="editModel.min_skill_value"
                      class="form-control form-control-sm"
                      type="number"
                      min="-1"
                      :disabled="Number(editModel.skill_id) < 0"
                    >
                  </div>
                  <div class="spire-editor-field">
                    <label for="title-skill-max">Maximum value</label>
                    <input
                      id="title-skill-max"
                      v-model.number="editModel.max_skill_value"
                      class="form-control form-control-sm"
                      type="number"
                      min="-1"
                      :disabled="Number(editModel.skill_id) < 0"
                    >
                    <span class="spire-editor-field-help">Use <code>-1</code> for no lower or upper bound.</span>
                  </div>
                </div>
              </div>

              <div class="title-rule-card mt-3">
                <div class="title-rule-card__heading">
                  <div>
                    <div class="spire-editor-context-label">Alternate advancement gate</div>
                    <strong>{{ aaGateSummary }}</strong>
                  </div>
                  <button v-if="Number(editModel.min_aa_points) >= 0 || Number(editModel.max_aa_points) >= 0" type="button" @click="clearAaGate">
                    Clear
                  </button>
                </div>
                <div class="spire-editor-grid spire-editor-grid--two">
                  <div class="spire-editor-field">
                    <label for="title-aa-min">Minimum AA points</label>
                    <input
                      id="title-aa-min"
                      v-model.number="editModel.min_aa_points"
                      class="form-control form-control-sm"
                      type="number"
                      min="-1"
                    >
                  </div>
                  <div class="spire-editor-field">
                    <label for="title-aa-max">Maximum AA points</label>
                    <input
                      id="title-aa-max"
                      v-model.number="editModel.max_aa_points"
                      class="form-control form-control-sm"
                      type="number"
                      min="-1"
                    >
                    <span class="spire-editor-field-help">Use <code>-1</code> for an open bound.</span>
                  </div>
                </div>
              </div>
            </section>

            <section v-else-if="selectedTab === 'Unlock Sources'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-section-kicker">Source linkage</div>
                  <h3>Item, character, and title-set context</h3>
                </div>
                <small>These are independent gates in the real schema; more than one may be active.</small>
              </div>

              <div class="spire-editor-grid spire-editor-grid--two">
                <div class="spire-editor-context-card">
                  <div class="spire-editor-context-label">Required item</div>
                  <h4>
                    {{ selectedItem
                      ? selectedItem.name
                      : (itemReferenceIsLegacy ? 'Unresolved item #' + editModel.item_id : 'No item requirement') }}
                  </h4>
                  <p v-if="selectedItem">A character must possess item #{{ selectedItem.id }} to qualify.</p>
                  <p v-else-if="itemReferenceIsLegacy">This legacy item ID is preserved, but the referenced item is not present in the active database.</p>
                  <p v-else>This title is not gated by inventory ownership.</p>

                  <div v-if="selectedItem" class="spire-editor-linked-record">
                    <span class="spire-editor-directory-icon">
                      <span v-if="selectedItem.icon" :class="'item-' + selectedItem.icon + '-sm'"></span>
                      <i v-else class="ra ra-gem"></i>
                    </span>
                    <div class="spire-editor-linked-record__body">
                      <strong>{{ selectedItem.name }}</strong>
                      <small>Item #{{ selectedItem.id }} · icon {{ selectedItem.icon || 0 }}</small>
                    </div>
                    <router-link :to="'/item/' + selectedItem.id" class="btn btn-sm btn-outline-secondary">
                      Item Editor
                    </router-link>
                    <button class="btn btn-sm btn-outline-danger" type="button" aria-label="Clear required item" @click="clearItem">
                      <i class="fa fa-times"></i>
                    </button>
                  </div>
                  <div v-else-if="itemReferenceIsLegacy" class="title-unresolved-reference">
                    <span><i class="fa fa-exclamation-triangle"></i></span>
                    <div>
                      <strong>Item #{{ editModel.item_id }} is unresolved</strong>
                      <small>Keep the legacy value, choose a replacement below, or clear this gate.</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" type="button" @click="clearItem">Clear</button>
                  </div>

                  <div class="spire-editor-selector">
                    <div class="spire-editor-search">
                      <i class="fa fa-search"></i>
                      <input
                        id="title-item-search"
                        v-model.trim="itemSearch"
                        class="form-control form-control-sm"
                        placeholder="Find an item by name or exact ID…"
                        @input="queueItemSearch"
                      >
                    </div>
                    <div v-if="searchingItems || itemResults.length || itemSearchComplete" class="spire-editor-selector-results">
                      <div v-if="searchingItems" class="title-selector-state"><i class="fa fa-spinner fa-spin"></i> Searching items…</div>
                      <button v-for="item in itemResults" :key="'item-' + item.id" type="button" @click="selectItem(item)">
                        <span v-if="item.icon" :class="'item-' + item.icon + '-sm'"></span>
                        <i v-else class="ra ra-gem"></i>
                        <span>{{ item.name }}</span>
                        <small>#{{ item.id }}</small>
                      </button>
                      <div v-if="itemSearchComplete && !itemResults.length" class="title-selector-state">No matching items found.</div>
                    </div>
                  </div>
                </div>

                <div class="spire-editor-context-card">
                  <div class="spire-editor-context-label">Specific character</div>
                  <h4>
                    {{ selectedCharacter
                      ? selectedCharacter.name
                      : (characterReferenceIsLegacy ? 'Unresolved character #' + editModel.char_id : 'Any character') }}
                  </h4>
                  <p v-if="selectedCharacter">Only character #{{ selectedCharacter.id }} can qualify for this title.</p>
                  <p v-else-if="characterReferenceIsLegacy">This legacy character ID is preserved, but the referenced character is not present in the active database.</p>
                  <p v-else>The title is not restricted to one character record.</p>

                  <div v-if="selectedCharacter" class="spire-editor-linked-record">
                    <span class="spire-editor-directory-icon"><i class="ra ra-player"></i></span>
                    <div class="spire-editor-linked-record__body">
                      <strong>{{ selectedCharacter.name }}</strong>
                      <small>
                        Character #{{ selectedCharacter.id }} · level {{ selectedCharacter.level || 0 }}
                        · {{ className(selectedCharacter.class) }}
                      </small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" type="button" aria-label="Clear specific character" @click="clearCharacter">
                      <i class="fa fa-times"></i>
                    </button>
                  </div>
                  <div v-else-if="characterReferenceIsLegacy" class="title-unresolved-reference">
                    <span><i class="fa fa-exclamation-triangle"></i></span>
                    <div>
                      <strong>Character #{{ editModel.char_id }} is unresolved</strong>
                      <small>Keep the legacy value, choose a replacement below, or clear this gate.</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" type="button" @click="clearCharacter">Clear</button>
                  </div>

                  <div class="spire-editor-selector">
                    <div class="spire-editor-search">
                      <i class="fa fa-search"></i>
                      <input
                        id="title-character-search"
                        v-model.trim="characterSearch"
                        class="form-control form-control-sm"
                        placeholder="Find a character by name or exact ID…"
                        @input="queueCharacterSearch"
                      >
                    </div>
                    <div v-if="searchingCharacters || characterResults.length || characterSearchComplete" class="spire-editor-selector-results">
                      <div v-if="searchingCharacters" class="title-selector-state"><i class="fa fa-spinner fa-spin"></i> Searching characters…</div>
                      <button v-for="character in characterResults" :key="'character-' + character.id" type="button" @click="selectCharacter(character)">
                        <i class="ra ra-player"></i>
                        <span>{{ character.name }}</span>
                        <small>#{{ character.id }} · L{{ character.level || 0 }} {{ className(character.class) }}</small>
                      </button>
                      <div v-if="characterSearchComplete && !characterResults.length" class="title-selector-state">No matching characters found.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="title-rule-card mt-3">
                <div class="title-rule-card__heading">
                  <div>
                    <div class="spire-editor-context-label">Shared title set</div>
                    <strong>{{ Number(editModel.title_set) > 0 ? 'Title set #' + editModel.title_set : 'No title-set grant required' }}</strong>
                  </div>
                  <button v-if="Number(editModel.title_set) > 0" type="button" @click="editModel.title_set = 0">
                    Clear
                  </button>
                </div>
                <div class="spire-editor-grid spire-editor-grid--three">
                  <div class="spire-editor-field">
                    <label for="title-set-existing">Existing title set</label>
                    <select
                      id="title-set-existing"
                      class="form-control form-control-sm"
                      :value="knownTitleSetValue"
                      @change="selectExistingTitleSet($event.target.value)"
                    >
                      <option value="">Choose an existing set…</option>
                      <option
                        v-for="option in titleSetOptions"
                        :key="'title-set-' + option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                    <span class="spire-editor-field-help">Uses the title and grant records already present in this database.</span>
                  </div>
                  <div class="spire-editor-field">
                    <label for="title-set">New or legacy set ID</label>
                    <input
                      id="title-set"
                      v-model.number="editModel.title_set"
                      class="form-control form-control-sm"
                      type="number"
                      min="0"
                    >
                    <span class="spire-editor-field-help">Direct entry preserves unknown legacy values and creates new set keys. Zero means no set gate.</span>
                  </div>
                  <div class="spire-editor-context-card spire-editor-context-card--gold">
                    <div class="spire-editor-context-label">Set impact</div>
                    <h4>{{ titleSetSiblingCount }} {{ titleSetSiblingCount === 1 ? 'title' : 'titles' }} in this set</h4>
                    <p>
                      {{ titleSetAssignments.length }} character {{ titleSetAssignments.length === 1 ? 'grant' : 'grants' }} currently unlock this set.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section v-else class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-section-kicker">Assignments &amp; safety</div>
                  <h3>Character title-set grants</h3>
                </div>
                <small>Assignments grant a set, not an individual title. Changes take effect immediately.</small>
              </div>

              <div class="spire-editor-metric-row">
                <div class="spire-editor-metric">
                  <span>Title set</span>
                  <strong>{{ Number(editModel.title_set) > 0 ? editModel.title_set : '—' }}</strong>
                </div>
                <div class="spire-editor-metric">
                  <span>Titles in set</span>
                  <strong>{{ titleSetSiblingCount }}</strong>
                </div>
                <div class="spire-editor-metric">
                  <span>Character grants</span>
                  <strong>{{ titleSetAssignments.length }}</strong>
                </div>
                <div class="spire-editor-metric">
                  <span>Delete safety</span>
                  <strong class="title-metric-text">{{ deleteBlocked ? 'Blocked' : 'Clear' }}</strong>
                </div>
              </div>

              <div v-if="Number(editModel.title_set) <= 0" class="title-assignment-empty">
                <i class="ra ra-linked-rings"></i>
                <h4>No shared title set</h4>
                <p>Assign a positive Title Set in Unlock Sources, save the title, then grant that set to characters here.</p>
                <button class="btn btn-sm btn-outline-warning" type="button" @click="selectTab('Unlock Sources')">
                  Configure title set
                </button>
              </div>

              <template v-else>
                <div class="title-assignment-toolbar">
                  <div>
                    <strong>Set #{{ editModel.title_set }} assignments</strong>
                    <small>Each row can unlock {{ titleSetSiblingCount }} {{ titleSetSiblingCount === 1 ? 'title' : 'titles' }}.</small>
                  </div>
                  <div v-if="!isCreating && Number(originalModel.title_set) === Number(editModel.title_set)" class="spire-editor-selector">
                    <div class="spire-editor-search">
                      <i class="fa fa-user-plus"></i>
                      <input
                        id="title-assignment-character-search"
                        v-model.trim="assignmentSearch"
                        class="form-control form-control-sm"
                        placeholder="Add character by name or exact ID…"
                        @input="queueAssignmentSearch"
                      >
                    </div>
                    <div v-if="searchingAssignments || assignmentResults.length || assignmentSearchComplete" class="spire-editor-selector-results">
                      <div v-if="searchingAssignments" class="title-selector-state"><i class="fa fa-spinner fa-spin"></i> Searching characters…</div>
                      <button
                        v-for="character in assignmentResults"
                        :key="'assignment-character-' + character.id"
                        type="button"
                        :disabled="isCharacterAssigned(character.id)"
                        @click="addAssignment(character)"
                      >
                        <i class="ra ra-player"></i>
                        <span>{{ character.name }}</span>
                        <small>{{ isCharacterAssigned(character.id) ? 'Already assigned' : '#' + character.id }}</small>
                      </button>
                      <div v-if="assignmentSearchComplete && !assignmentResults.length" class="title-selector-state">No matching characters found.</div>
                    </div>
                  </div>
                  <span v-else class="title-assignment-save-hint">Save this title-set value before editing grants.</span>
                </div>

                <div class="title-assignment-table">
                  <div class="title-assignment-row title-assignment-row--header">
                    <span>Character</span>
                    <span>Level / class</span>
                    <span>Grant</span>
                    <span>Action</span>
                  </div>
                  <div v-for="assignment in titleSetAssignments" :key="'assignment-' + assignment.id" class="title-assignment-row">
                    <span>
                      <strong>{{ assignmentCharacter(assignment).name || 'Unknown character' }}</strong>
                      <small>#{{ assignment.char_id }}</small>
                    </span>
                    <span>
                      L{{ assignmentCharacter(assignment).level || 0 }}
                      · {{ className(assignmentCharacter(assignment).class) }}
                    </span>
                    <span>Set #{{ assignment.title_set }}</span>
                    <span>
                      <button
                        class="title-icon-button"
                        type="button"
                        :aria-label="'Remove title-set grant from ' + (assignmentCharacter(assignment).name || assignment.char_id)"
                        @click="removeAssignment(assignment)"
                      >
                        <i class="fa fa-trash"></i>
                      </button>
                    </span>
                  </div>
                  <div v-if="!titleSetAssignments.length" class="title-assignment-empty title-assignment-empty--compact">
                    <i class="ra ra-player"></i>
                    <p>No characters currently hold title set #{{ editModel.title_set }}.</p>
                  </div>
                </div>
              </template>

              <div class="spire-editor-grid spire-editor-grid--two mt-3">
                <div class="spire-editor-context-card">
                  <div class="spire-editor-context-label">Schema checks</div>
                  <h4>{{ validationMessages.length ? 'Review required' : 'Ready to save' }}</h4>
                  <div v-if="validationMessages.length" class="spire-editor-effect-list">
                    <div v-for="message in validationMessages" :key="message" class="spire-editor-effect-row">
                      <span><i class="fa fa-exclamation-triangle"></i></span>
                      <strong>{{ message }}</strong>
                      <small>Required</small>
                    </div>
                  </div>
                  <p v-else>Identity, bounds, selectors, and linked records are valid.</p>
                </div>
                <div class="spire-editor-context-card spire-editor-context-card--gold">
                  <div class="spire-editor-context-label">Deletion scope</div>
                  <h4>{{ deleteBlocked ? 'Resolve orphaned grants first' : 'Only title #' + editModel.id + ' is removed' }}</h4>
                  <p v-if="deleteBlocked">
                    This is the only title in set #{{ editModel.title_set }}, but {{ titleSetAssignments.length }}
                    character grants still reference that set. Remove the grants or move this title before deleting.
                  </p>
                  <p v-else>
                    Items, characters, and shared title-set grants are independent records and are never deleted with this title.
                  </p>
                </div>
              </div>

              <div v-if="!isCreating" class="spire-editor-danger">
                <strong>Safe destructive action</strong>
                <p>Delete requires confirmation and is blocked whenever it would leave unresolved title-set grants.</p>
              </div>
            </section>
          </eq-window>
        </div>
      </main>
    </div>

    <transition name="spire-editor-fade">
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
  import { ItemApi } from '../../app/api/api'
  import { CharacterDatumApi } from '../../app/api/api/character-datum-api'
  import { PlayerTitlesetApi } from '../../app/api/api/player-titleset-api'
  import { TitleApi } from '../../app/api/api/title-api'
  import { SpireApi } from '../../app/api/spire-api'
  import { SpireQueryBuilder } from '../../app/api/spire-query-builder'
  import { DB_PLAYER_CLASSES } from '../../app/constants/eq-classes-constants'
  import { GENDER } from '../../app/constants/eq-gender-constants'
  import { DB_SKILLS } from '../../app/constants/eq-skill-constants'

  const TITLE_FIELDS = [
    'id', 'skill_id', 'min_skill_value', 'max_skill_value', 'min_aa_points',
    'max_aa_points', 'class', 'gender', 'char_id', 'status', 'item_id',
    'prefix', 'suffix', 'title_set'
  ]

  const STATUS_OPTIONS = [
    { value: 0, label: 'Player' },
    { value: 20, label: 'Apprentice guide' },
    { value: 50, label: 'Guide' },
    { value: 80, label: 'Quest troupe' },
    { value: 100, label: 'Senior guide' },
    { value: 150, label: 'Server operator' },
    { value: 180, label: 'Developer' },
    { value: 200, label: 'Owner' }
  ]

  function clone (value) {
    return value == null ? value : JSON.parse(JSON.stringify(value))
  }

  function rawValue (record, field) {
    if (field === 'class') return record.class == null ? record._class : record.class
    return record[field]
  }

  function pickTitle (record) {
    const result = {}
    TITLE_FIELDS.forEach(field => {
      const value = rawValue(record || {}, field)
      if (field === 'prefix' || field === 'suffix') result[field] = String(value || '')
      else if (field === 'title_set') result[field] = value == null ? 0 : Number(value)
      else result[field] = value == null ? -1 : Number(value)
    })
    return result
  }

  const TITLE_PREVIEW_NAMES = [
    'Aurelia', 'Brenna', 'Caelen', 'Darian',
    'Elowen', 'Farren', 'Galen', 'Lyra'
  ]

  export default {
    name: 'TitleEditor',
    components: { ContentArea, EqWindow },
    data () {
      const tabs = ['Overview', 'Eligibility', 'Unlock Sources', 'Assignments']
      const routeTab = this.$route.query.tab
      return {
        titles: [],
        assignments: [],
        itemMap: {},
        characterMap: {},
        loading: false,
        loadError: '',
        saving: false,
        selectedId: null,
        editModel: null,
        originalModel: null,
        selectedItem: null,
        selectedCharacter: null,
        isCreating: false,
        copiedFromId: null,
        search: '',
        directoryFilter: 'all',
        currentPage: 1,
        pageSize: 12,
        tabs,
        selectedTab: tabs.includes(routeTab) ? routeTab : 'Overview',
        directoryFilters: [
          { value: 'all', label: 'All' },
          { value: 'progression', label: 'Progress' },
          { value: 'linked', label: 'Linked' },
          { value: 'special', label: 'Special' }
        ],
        itemSearch: '',
        itemResults: [],
        searchingItems: false,
        itemSearchComplete: false,
        itemSearchTimer: null,
        characterSearch: '',
        characterResults: [],
        searchingCharacters: false,
        characterSearchComplete: false,
        characterSearchTimer: null,
        assignmentSearch: '',
        assignmentResults: [],
        searchingAssignments: false,
        assignmentSearchComplete: false,
        assignmentSearchTimer: null,
        assigningCharacter: false,
        notification: { message: '', type: 'success', timer: null }
      }
    },
    computed: {
      classOptions () {
        return Object.keys(DB_PLAYER_CLASSES).map(value => ({
          value: Number(value),
          label: DB_PLAYER_CLASSES[value]
        }))
      },
      genderOptions () {
        return Object.keys(GENDER).map(value => ({
          value: Number(value),
          label: GENDER[value]
        }))
      },
      skillOptions () {
        return Object.keys(DB_SKILLS).filter(value => Number(value) >= 0).map(value => ({
          value: Number(value),
          label: DB_SKILLS[value]
        })).sort((a, b) => a.label.localeCompare(b.label))
      },
      statusOptions () {
        return STATUS_OPTIONS
      },
      titleSetOptions () {
        const sets = {}
        this.titles.forEach(record => {
          const value = Number(record.title_set)
          if (value <= 0) return
          if (!sets[value]) sets[value] = []
          sets[value].push(record)
        })
        return Object.keys(sets).map(value => {
          const numericValue = Number(value)
          const records = sets[value]
          const grantCount = this.assignments.filter(record => Number(record.title_set) === numericValue).length
          const sample = this.titleName(records[0])
          return {
            value: numericValue,
            label: `Set #${numericValue} — ${sample} · ${records.length} ${records.length === 1 ? 'title' : 'titles'} · ${grantCount} ${grantCount === 1 ? 'grant' : 'grants'}`
          }
        }).sort((a, b) => a.value - b.value)
      },
      knownTitleSetValue () {
        const current = Number(this.editModel && this.editModel.title_set)
        return this.titleSetOptions.some(option => option.value === current) ? current : ''
      },
      filteredTitles () {
        const needle = this.search.toLowerCase()
        return this.titles.filter(record => {
          const category = this.titleCategory(record)
          if (this.directoryFilter !== 'all' && category !== this.directoryFilter) return false
          if (!needle) return true
          const item = this.itemMap[Number(record.item_id)]
          const character = this.characterMap[Number(record.char_id)]
          return [
            record.id,
            record.prefix,
            record.suffix,
            this.titleName(record),
            this.sourceLabel(record),
            item && item.name,
            character && character.name,
            this.className(rawValue(record, 'class')),
            this.skillName(record.skill_id)
          ].some(value => String(value || '').toLowerCase().includes(needle))
        })
      },
      totalPages () {
        return Math.max(1, Math.ceil(this.filteredTitles.length / this.pageSize))
      },
      pagedTitles () {
        const page = Math.min(this.currentPage, this.totalPages)
        const start = (page - 1) * this.pageSize
        return this.filteredTitles.slice(start, start + this.pageSize)
      },
      restrictedTitleCount () {
        return this.titles.filter(record => this.eligibilityCount(record) > 0).length
      },
      hasUnsavedChanges () {
        return Boolean(this.editModel && JSON.stringify(pickTitle(this.editModel)) !== JSON.stringify(pickTitle(this.originalModel || {})))
      },
      validationMessages () {
        if (!this.editModel) return ['No title is selected.']
        const messages = []
        const duplicate = this.titles.some(record =>
          Number(record.id) === Number(this.editModel.id) &&
          (this.isCreating || Number(record.id) !== Number(this.originalModel.id))
        )
        if (Number(this.editModel.id) <= 0) messages.push('Title ID must be greater than zero.')
        if (duplicate) messages.push('Title ID is already in use.')
        if (!String(this.editModel.prefix || '').trim() && !String(this.editModel.suffix || '').trim()) {
          messages.push('A prefix or suffix is required.')
        }
        if (Number(this.editModel.min_skill_value) >= 0 && Number(this.editModel.skill_id) < 0) {
          messages.push('Choose a skill before setting a minimum skill value.')
        }
        if (Number(this.editModel.max_skill_value) >= 0 && Number(this.editModel.skill_id) < 0) {
          messages.push('Choose a skill before setting a maximum skill value.')
        }
        if (
          Number(this.editModel.min_skill_value) >= 0 &&
          Number(this.editModel.max_skill_value) >= 0 &&
          Number(this.editModel.min_skill_value) > Number(this.editModel.max_skill_value)
        ) messages.push('Minimum skill value cannot exceed maximum skill value.')
        if (
          Number(this.editModel.min_aa_points) >= 0 &&
          Number(this.editModel.max_aa_points) >= 0 &&
          Number(this.editModel.min_aa_points) > Number(this.editModel.max_aa_points)
        ) messages.push('Minimum AA points cannot exceed maximum AA points.')
        if (Number(this.editModel.title_set) < 0) messages.push('Title set cannot be negative.')
        if (
          this.itemReferenceIsLegacy &&
          (this.isCreating || Number(this.editModel.item_id) !== Number(this.originalModel.item_id))
        ) messages.push('The required item reference could not be resolved.')
        if (
          this.characterReferenceIsLegacy &&
          (this.isCreating || Number(this.editModel.char_id) !== Number(this.originalModel.char_id))
        ) messages.push('The specific character reference could not be resolved.')
        return messages
      },
      canSave () {
        return this.hasUnsavedChanges && this.validationMessages.length === 0
      },
      itemReferenceIsLegacy () {
        return Boolean(this.editModel && Number(this.editModel.item_id) >= 0 && !this.selectedItem)
      },
      characterReferenceIsLegacy () {
        return Boolean(this.editModel && Number(this.editModel.char_id) >= 0 && !this.selectedCharacter)
      },
      composedTitle () {
        const parts = [
          String(this.editModel ? this.editModel.prefix : '').trim(),
          this.previewCharacterName,
          String(this.editModel ? this.editModel.suffix : '').trim()
        ].filter(Boolean)
        return parts.join(' ')
      },
      previewCharacterName () {
        const titleId = Math.abs(Number(this.editModel && this.editModel.id) || 0)
        return TITLE_PREVIEW_NAMES[titleId % TITLE_PREVIEW_NAMES.length]
      },
      eligibilitySummary () {
        const count = this.eligibilityCount(this.editModel)
        if (!count) return 'available without eligibility gates'
        return `${count} ${count === 1 ? 'eligibility rule' : 'eligibility rules'}`
      },
      skillGateSummary () {
        if (!this.editModel || Number(this.editModel.skill_id) < 0) return 'No skill requirement'
        const bounds = this.rangeSummary(this.editModel.min_skill_value, this.editModel.max_skill_value)
        return `${this.skillName(this.editModel.skill_id)} ${bounds}`
      },
      aaGateSummary () {
        if (!this.editModel || (Number(this.editModel.min_aa_points) < 0 && Number(this.editModel.max_aa_points) < 0)) {
          return 'No AA-point requirement'
        }
        return `AA points ${this.rangeSummary(this.editModel.min_aa_points, this.editModel.max_aa_points)}`
      },
      titleSetAssignments () {
        if (!this.editModel || Number(this.editModel.title_set) <= 0) return []
        return this.assignments.filter(record => Number(record.title_set) === Number(this.editModel.title_set))
      },
      titleSetSiblingCount () {
        if (!this.editModel || Number(this.editModel.title_set) <= 0) return 0
        const savedCount = this.titles.filter(record => Number(record.title_set) === Number(this.editModel.title_set)).length
        if (this.isCreating) return savedCount + 1
        const moved = Number(this.originalModel.title_set) !== Number(this.editModel.title_set)
        return savedCount + (moved ? 1 : 0)
      },
      deleteBlocked () {
        return Boolean(
          !this.isCreating &&
            Number(this.editModel ? this.editModel.title_set : 0) > 0 &&
            this.titleSetSiblingCount <= 1 &&
            this.titleSetAssignments.length > 0
        )
      }
    },
    watch: {
      '$route.query.title' (value) {
        const id = Number(value)
        if (id && id !== Number(this.selectedId)) this.selectTitle(id, false)
      },
      '$route.query.tab' (value) {
        if (this.tabs.includes(value) && value !== this.selectedTab) this.selectedTab = value
      }
    },
    async created () {
      window.addEventListener('keydown', this.onEditorKeydown)
      window.addEventListener('beforeunload', this.onBeforeUnload)
      await this.loadTitles()
    },
    beforeDestroy () {
      window.removeEventListener('keydown', this.onEditorKeydown)
      window.removeEventListener('beforeunload', this.onBeforeUnload)
      window.clearTimeout(this.itemSearchTimer)
      window.clearTimeout(this.characterSearchTimer)
      window.clearTimeout(this.assignmentSearchTimer)
      window.clearTimeout(this.notification.timer)
    },
    beforeRouteLeave (to, from, next) {
      if (!this.hasUnsavedChanges || window.confirm('Discard unsaved title changes?')) next()
      else next(false)
    },
    methods: {
      async loadTitles () {
        this.loading = true
        this.loadError = ''
        try {
          const builder = new SpireQueryBuilder()
          builder.limit(1000).orderBy(['id']).orderDirection('asc')
          const [titleResponse, assignmentResponse] = await Promise.all([
            (new TitleApi(...SpireApi.cfg())).listTitles(builder.get()),
            (new PlayerTitlesetApi(...SpireApi.cfg())).listPlayerTitlesets({ limit: '1000', orderBy: 'id', orderDirection: 'asc' })
          ])
          this.titles = titleResponse.data || []
          this.assignments = assignmentResponse.data || []
          await this.loadReferenceData()

          const routeId = Number(this.$route.query.title)
          const desired = routeId && this.titles.some(record => Number(record.id) === routeId)
            ? routeId
            : (this.titles[0] && Number(this.titles[0].id))
          if (desired) await this.selectTitle(desired, false)
        } catch (error) {
          this.loadError = this.errorMessage(error, 'Unable to load titles')
          this.showNotification(this.loadError, 'error')
        } finally {
          this.loading = false
        }
      },
      async loadReferenceData () {
        const itemIds = [...new Set(this.titles.map(record => Number(record.item_id)).filter(id => id >= 0))]
        const characterIds = [...new Set([
          ...this.titles.map(record => Number(record.char_id)),
          ...this.assignments.map(record => Number(record.char_id))
        ].filter(id => id >= 0))]
        const requests = []
        if (itemIds.length) {
          requests.push(
            (new ItemApi(...SpireApi.cfg())).getItemsBulk({ body: { ids: itemIds } })
              .then(response => {
                const map = {}
                ;(response.data || []).forEach(item => { map[Number(item.id)] = item })
                this.itemMap = map
              })
          )
        }
        if (characterIds.length) {
          requests.push(
            (new CharacterDatumApi(...SpireApi.cfg())).getCharacterDataBulk({ body: { ids: characterIds } })
              .then(response => {
                const map = {}
                ;(response.data || []).forEach(character => { map[Number(character.id)] = this.normalizeCharacter(character) })
                this.characterMap = map
              })
          )
        }
        await Promise.all(requests)
      },
      async selectTitle (id, updateRoute = true) {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved title changes?')) return
        const record = this.titles.find(item => Number(item.id) === Number(id))
        if (!record) return
        this.isCreating = false
        this.copiedFromId = null
        this.selectedId = Number(record.id)
        this.editModel = pickTitle(record)
        this.originalModel = clone(this.editModel)
        this.selectedItem = clone(this.itemMap[Number(record.item_id)] || null)
        this.selectedCharacter = clone(this.characterMap[Number(record.char_id)] || null)
        this.resetSearches()
        if (updateRoute) await this.updateRoute()
      },
      createDraft (source = null) {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved title changes?')) return
        const maxId = this.titles.reduce((max, record) => Math.max(max, Number(record.id) || 0), 0)
        this.isCreating = true
        this.copiedFromId = source ? Number(source.id) : null
        this.selectedId = null
        this.editModel = source
          ? { ...pickTitle(source), id: maxId + 1 }
          : {
            id: maxId + 1,
            skill_id: -1,
            min_skill_value: -1,
            max_skill_value: -1,
            min_aa_points: -1,
            max_aa_points: -1,
            class: -1,
            gender: -1,
            char_id: -1,
            status: -1,
            item_id: -1,
            prefix: '',
            suffix: '',
            title_set: 0
          }
        this.originalModel = clone({ ...this.editModel, prefix: source ? '' : this.editModel.prefix, suffix: source ? '' : this.editModel.suffix })
        this.selectedItem = source ? clone(this.itemMap[Number(source.item_id)] || null) : null
        this.selectedCharacter = source ? clone(this.characterMap[Number(source.char_id)] || null) : null
        this.selectedTab = 'Overview'
        this.resetSearches()
        this.updateRoute()
        this.$nextTick(() => document.getElementById('title-prefix')?.focus())
      },
      async copyTitle () {
        const source = this.titles.find(record => Number(record.id) === Number(this.selectedId))
        const confirmed = await this.$bvModal.msgBoxConfirm(
          `Create a new draft from title #${source.id} (${this.titleName(source)})? Eligibility and title-set rules will be copied.`,
          {
            title: 'Copy player title',
            okTitle: 'Create copy',
            okVariant: 'warning',
            cancelTitle: 'Cancel',
            centered: true
          }
        )
        if (confirmed) this.createDraft(source)
      },
      resetEditor () {
        this.editModel = clone(this.originalModel)
        this.selectedItem = clone(this.itemMap[Number(this.editModel.item_id)] || null)
        this.selectedCharacter = clone(this.characterMap[Number(this.editModel.char_id)] || null)
      },
      async saveTitle () {
        if (!this.canSave || this.saving) return
        this.saving = true
        try {
          const api = new TitleApi(...SpireApi.cfg())
          const payload = pickTitle(this.editModel)
          const created = this.isCreating
          if (created) await api.createTitle({ title: payload })
          else await api.updateTitle({ id: Number(this.originalModel.id), title: payload })
          const savedId = Number(payload.id)
          this.originalModel = clone(payload)
          this.isCreating = false
          await this.reloadAfterMutation(savedId)
          this.showNotification(created ? 'Player title created' : 'Player title saved')
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to save title'), 'error')
        } finally {
          this.saving = false
        }
      },
      async deleteTitle () {
        if (!this.editModel || this.isCreating || this.deleteBlocked || this.hasUnsavedChanges) return
        const confirmed = await this.$bvModal.msgBoxConfirm(
          `Delete title #${this.editModel.id} (${this.titleName(this.editModel)})? Linked items, characters, and title-set grants will remain intact.`,
          {
            title: 'Delete player title',
            okTitle: 'Delete title',
            okVariant: 'danger',
            cancelTitle: 'Cancel',
            centered: true
          }
        )
        if (!confirmed) return
        try {
          await (new TitleApi(...SpireApi.cfg())).deleteTitle({ id: Number(this.editModel.id) })
          const name = this.titleName(this.editModel)
          this.editModel = null
          this.originalModel = null
          this.selectedId = null
          await this.reloadAfterMutation(null)
          this.showNotification(`Title ${name} deleted`)
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to delete title'), 'error')
        }
      },
      async reloadAfterMutation (id) {
        const builder = new SpireQueryBuilder()
        builder.limit(1000).orderBy(['id']).orderDirection('asc')
        const [titleResponse, assignmentResponse] = await Promise.all([
          (new TitleApi(...SpireApi.cfg())).listTitles(builder.get()),
          (new PlayerTitlesetApi(...SpireApi.cfg())).listPlayerTitlesets({ limit: '1000', orderBy: 'id', orderDirection: 'asc' })
        ])
        this.titles = titleResponse.data || []
        this.assignments = assignmentResponse.data || []
        await this.loadReferenceData()
        const target = id || (this.titles[0] && Number(this.titles[0].id))
        if (target) await this.selectTitle(target)
      },
      queueItemSearch () {
        window.clearTimeout(this.itemSearchTimer)
        if (this.itemSearch.length < 2) {
          this.itemResults = []
          this.itemSearchComplete = false
          return
        }
        this.itemResults = []
        this.itemSearchComplete = false
        this.itemSearchTimer = window.setTimeout(this.searchItems, 260)
      },
      async searchItems () {
        this.searchingItems = true
        try {
          const builder = new SpireQueryBuilder()
          if (/^\d+$/.test(this.itemSearch)) builder.where('id', '=', this.itemSearch)
          else builder.where('name', 'like', this.itemSearch)
          builder.limit(20).orderBy(['name']).orderDirection('asc')
          const response = await (new ItemApi(...SpireApi.cfg())).listItems(builder.get())
          this.itemResults = response.data || []
          this.itemSearchComplete = true
        } catch (error) {
          this.itemSearchComplete = false
          this.showNotification(this.errorMessage(error, 'Unable to search items'), 'error')
        } finally {
          this.searchingItems = false
        }
      },
      selectItem (item) {
        this.editModel.item_id = Number(item.id)
        this.selectedItem = clone(item)
        this.itemMap = { ...this.itemMap, [Number(item.id)]: clone(item) }
        this.itemSearch = ''
        this.itemResults = []
        this.itemSearchComplete = false
      },
      clearItem () {
        this.editModel.item_id = -1
        this.selectedItem = null
      },
      queueCharacterSearch () {
        window.clearTimeout(this.characterSearchTimer)
        if (this.characterSearch.length < 2) {
          this.characterResults = []
          this.characterSearchComplete = false
          return
        }
        this.characterResults = []
        this.characterSearchComplete = false
        this.characterSearchTimer = window.setTimeout(() => this.searchCharacters('source'), 260)
      },
      queueAssignmentSearch () {
        window.clearTimeout(this.assignmentSearchTimer)
        if (this.assignmentSearch.length < 2) {
          this.assignmentResults = []
          this.assignmentSearchComplete = false
          return
        }
        this.assignmentResults = []
        this.assignmentSearchComplete = false
        this.assignmentSearchTimer = window.setTimeout(() => this.searchCharacters('assignment'), 260)
      },
      async searchCharacters (mode) {
        if (mode === 'assignment') this.searchingAssignments = true
        else this.searchingCharacters = true
        try {
          const searchValue = mode === 'assignment' ? this.assignmentSearch : this.characterSearch
          const builder = new SpireQueryBuilder()
          if (/^\d+$/.test(searchValue)) builder.where('id', '=', searchValue)
          else builder.where('name', 'like', searchValue)
          builder.limit(20).orderBy(['name']).orderDirection('asc')
          const response = await (new CharacterDatumApi(...SpireApi.cfg())).listCharacterData(builder.get())
          const records = (response.data || []).map(this.normalizeCharacter)
          if (mode === 'assignment') {
            this.assignmentResults = records
            this.assignmentSearchComplete = true
          } else {
            this.characterResults = records
            this.characterSearchComplete = true
          }
        } catch (error) {
          if (mode === 'assignment') this.assignmentSearchComplete = false
          else this.characterSearchComplete = false
          this.showNotification(this.errorMessage(error, 'Unable to search characters'), 'error')
        } finally {
          if (mode === 'assignment') this.searchingAssignments = false
          else this.searchingCharacters = false
        }
      },
      selectCharacter (character) {
        const normalized = this.normalizeCharacter(character)
        this.editModel.char_id = Number(normalized.id)
        this.selectedCharacter = clone(normalized)
        this.characterMap = { ...this.characterMap, [Number(normalized.id)]: clone(normalized) }
        this.characterSearch = ''
        this.characterResults = []
        this.characterSearchComplete = false
      },
      clearCharacter () {
        this.editModel.char_id = -1
        this.selectedCharacter = null
      },
      selectExistingTitleSet (value) {
        if (value === '') return
        this.editModel.title_set = Number(value)
      },
      async addAssignment (character) {
        if (this.assigningCharacter || this.isCharacterAssigned(character.id)) return
        this.assigningCharacter = true
        try {
          await (new PlayerTitlesetApi(...SpireApi.cfg())).createPlayerTitleset({
            playerTitleset: {
              char_id: Number(character.id),
              title_set: Number(this.editModel.title_set)
            }
          })
          const normalized = this.normalizeCharacter(character)
          this.characterMap = { ...this.characterMap, [Number(normalized.id)]: clone(normalized) }
          this.assignmentSearch = ''
          this.assignmentResults = []
          this.assignmentSearchComplete = false
          await this.reloadAssignments()
          this.showNotification(`Granted title set #${this.editModel.title_set} to ${normalized.name}`)
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to add title-set assignment'), 'error')
        } finally {
          this.assigningCharacter = false
        }
      },
      async removeAssignment (assignment) {
        const character = this.assignmentCharacter(assignment)
        const confirmed = await this.$bvModal.msgBoxConfirm(
          `Remove title set #${assignment.title_set} from ${character.name || 'character #' + assignment.char_id}? This affects every title in the set.`,
          {
            title: 'Remove title-set grant',
            okTitle: 'Remove grant',
            okVariant: 'danger',
            cancelTitle: 'Cancel',
            centered: true
          }
        )
        if (!confirmed) return
        try {
          await (new PlayerTitlesetApi(...SpireApi.cfg())).deletePlayerTitleset({ id: Number(assignment.id) })
          await this.reloadAssignments()
          this.showNotification(`Removed title set #${assignment.title_set} from ${character.name || 'character'}`)
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to remove title-set assignment'), 'error')
        }
      },
      async reloadAssignments () {
        const response = await (new PlayerTitlesetApi(...SpireApi.cfg())).listPlayerTitlesets({
          limit: '1000',
          orderBy: 'id',
          orderDirection: 'asc'
        })
        this.assignments = response.data || []
        await this.loadReferenceData()
      },
      async selectTab (tab) {
        this.selectedTab = tab
        await this.updateRoute()
      },
      async updateRoute () {
        const query = { ...this.$route.query, tab: this.selectedTab }
        if (this.selectedId && !this.isCreating) query.title = String(this.selectedId)
        else delete query.title
        await this.$router.replace({ path: this.$route.path, query }).catch(() => {})
      },
      onEditorKeydown (event) {
        const save = (event.metaKey || event.ctrlKey) && !event.altKey && String(event.key || '').toLowerCase() === 's'
        if (!save || !this.editModel) return
        event.preventDefault()
        if (this.canSave && !this.saving) this.saveTitle()
      },
      onBeforeUnload (event) {
        if (!this.hasUnsavedChanges) return
        event.preventDefault()
        event.returnValue = ''
      },
      titleName (record) {
        const prefix = String(record ? record.prefix : '').trim()
        const suffix = String(record ? record.suffix : '').trim()
        if (prefix && suffix) return `${prefix} … ${suffix}`
        return prefix || suffix || `Title #${record ? record.id : 'new'}`
      },
      sourceLabel (record) {
        if (!record) return 'No source'
        if (Number(record.char_id) >= 0) return 'Character-specific'
        if (Number(record.item_id) >= 0) return 'Item unlock'
        if (Number(record.title_set) > 0) return 'Title-set grant'
        if (Number(record.skill_id) >= 0) return 'Skill progression'
        if (Number(record.min_aa_points) >= 0 || Number(record.max_aa_points) >= 0) return 'AA progression'
        if (Number(record.status) >= 0) return 'Account status'
        return 'General'
      },
      titleCategory (record) {
        if (Number(record.item_id) >= 0 || Number(record.char_id) >= 0) return 'linked'
        if (Number(record.skill_id) >= 0 || Number(record.min_aa_points) >= 0 || Number(record.max_aa_points) >= 0) return 'progression'
        if (Number(record.title_set) > 0 || Number(record.status) >= 0) return 'special'
        return 'all'
      },
      eligibilityCount (record) {
        if (!record) return 0
        return [
          Number(rawValue(record, 'class')) >= 0,
          Number(record.gender) >= 0,
          Number(record.skill_id) >= 0,
          Number(record.min_aa_points) >= 0 || Number(record.max_aa_points) >= 0,
          Number(record.status) >= 0,
          Number(record.item_id) >= 0,
          Number(record.char_id) >= 0,
          Number(record.title_set) > 0
        ].filter(Boolean).length
      },
      className (value) {
        if (Number(value) < 0 || value == null) return 'Any class'
        return DB_PLAYER_CLASSES[Number(value)] || `Class ${value}`
      },
      skillName (value) {
        if (Number(value) < 0 || value == null) return 'No skill'
        return DB_SKILLS[Number(value)] || `Skill ${value}`
      },
      rangeSummary (minimum, maximum) {
        const min = Number(minimum)
        const max = Number(maximum)
        if (min >= 0 && max >= 0) return `${min}–${max}`
        if (min >= 0) return `at least ${min}`
        if (max >= 0) return `up to ${max}`
        return 'with no value bounds'
      },
      clearSkillGate () {
        this.editModel.skill_id = -1
        this.editModel.min_skill_value = -1
        this.editModel.max_skill_value = -1
      },
      clearAaGate () {
        this.editModel.min_aa_points = -1
        this.editModel.max_aa_points = -1
      },
      isUnknownClass (value) {
        return Number(value) >= 0 && !Object.prototype.hasOwnProperty.call(DB_PLAYER_CLASSES, Number(value))
      },
      isUnknownGender (value) {
        return Number(value) >= 0 && !Object.prototype.hasOwnProperty.call(GENDER, Number(value))
      },
      isUnknownSkill (value) {
        return Number(value) >= 0 && !Object.prototype.hasOwnProperty.call(DB_SKILLS, Number(value))
      },
      isUnknownStatus (value) {
        return Number(value) >= 0 && !STATUS_OPTIONS.some(option => option.value === Number(value))
      },
      normalizeCharacter (character) {
        if (!character) return {}
        return { ...character, class: character.class == null ? character._class : character.class }
      },
      assignmentCharacter (assignment) {
        return this.characterMap[Number(assignment.char_id)] || {}
      },
      isCharacterAssigned (id) {
        return this.titleSetAssignments.some(record => Number(record.char_id) === Number(id))
      },
      resetSearches () {
        this.itemSearch = ''
        this.itemResults = []
        this.itemSearchComplete = false
        this.characterSearch = ''
        this.characterResults = []
        this.characterSearchComplete = false
        this.assignmentSearch = ''
        this.assignmentResults = []
        this.assignmentSearchComplete = false
      },
      showNotification (message, type = 'success') {
        window.clearTimeout(this.notification.timer)
        this.notification = { message, type, timer: null }
        this.notification.timer = window.setTimeout(() => {
          this.notification.message = ''
        }, type === 'error' ? 6500 : 3200)
      },
      errorMessage (error, fallback) {
        return (error && error.response && error.response.data && (error.response.data.error || error.response.data.message)) ||
          (error && error.message) ||
          fallback
      }
    }
  }
</script>

<style src="../../assets/css/content-editor-workspace.css"></style>

<style scoped>
  .title-overview-layout {
    display: grid;
    gap: 13px;
    grid-template-columns: minmax(0, 1.2fr) minmax(250px, 0.8fr);
  }

  .title-live-preview {
    align-items: center;
    background:
      radial-gradient(circle at 50% 40%, rgba(210, 170, 69, 0.14), transparent 55%),
      rgba(0, 0, 0, 0.32);
    border: 1px solid rgba(210, 170, 69, 0.3);
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 168px;
    padding: 18px;
    text-align: center;
  }

  .title-live-preview__name {
    color: #ead27d;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 23px;
    line-height: 1.25;
    margin: 13px 0 8px;
    overflow-wrap: anywhere;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
  }

  .title-live-preview__meta {
    color: #87919b;
    display: flex;
    font-size: 8px;
    gap: 10px;
    text-transform: uppercase;
  }

  .title-live-preview p {
    color: #7c8791;
    font-size: 9px;
    margin: 10px 0 0;
  }

  .title-metric-text {
    font-size: 12px !important;
    line-height: 1.2;
    min-height: 22px;
  }

  .title-rule-card {
    background: rgba(0, 0, 0, 0.23);
    border: 1px solid rgba(178, 191, 204, 0.16);
    padding: 11px;
  }

  .title-rule-card__heading {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .title-rule-card__heading strong {
    color: #d9dde0;
    display: block;
    font-size: 11px;
    margin-top: 2px;
  }

  .title-rule-card__heading button {
    background: transparent !important;
    border: 0 !important;
    border-radius: 0 !important;
    color: #c4a84f;
    font-size: 9px !important;
    line-height: 1 !important;
    padding: 4px 0 !important;
    text-transform: uppercase;
  }

  .title-selector-state {
    color: #88939d;
    font-size: 9px;
    padding: 9px;
  }

  .title-unresolved-reference {
    align-items: center;
    background: rgba(113, 76, 20, 0.12);
    border: 1px solid rgba(210, 170, 69, 0.28);
    display: flex;
    gap: 9px;
    margin-top: 10px;
    min-height: 54px;
    padding: 8px 10px;
  }

  .title-unresolved-reference > span {
    color: #d9b351;
  }

  .title-unresolved-reference > div {
    min-width: 0;
  }

  .title-unresolved-reference strong,
  .title-unresolved-reference small {
    display: block;
  }

  .title-unresolved-reference strong {
    color: #dbdddf;
    font-size: 10px;
  }

  .title-unresolved-reference small {
    color: #808b94;
    font-size: 8px;
  }

  .title-unresolved-reference .btn {
    margin-left: auto;
  }

  .title-assignment-toolbar {
    align-items: flex-end;
    display: grid;
    gap: 14px;
    grid-template-columns: minmax(180px, 1fr) minmax(280px, 0.8fr);
    margin-bottom: 9px;
  }

  .title-assignment-toolbar > div > strong {
    color: #d9dde0;
    display: block;
    font-size: 11px;
  }

  .title-assignment-toolbar > div > small,
  .title-assignment-save-hint {
    color: #7f8a94;
    display: block;
    font-size: 8px;
    margin-top: 2px;
  }

  .title-assignment-toolbar .spire-editor-selector {
    margin-top: 0;
  }

  .title-assignment-table {
    border: 1px solid rgba(178, 191, 204, 0.16);
  }

  .title-assignment-row {
    align-items: center;
    border-bottom: 1px solid rgba(178, 191, 204, 0.12);
    color: #b8c0c7;
    display: grid;
    font-size: 9px;
    gap: 10px;
    grid-template-columns: minmax(140px, 1.3fr) minmax(120px, 1fr) minmax(80px, 0.7fr) 44px;
    min-height: 43px;
    padding: 6px 9px;
  }

  .title-assignment-row:last-child {
    border-bottom: 0;
  }

  .title-assignment-row--header {
    color: #7d8892;
    font-size: 8px;
    min-height: 30px;
    text-transform: uppercase;
  }

  .title-assignment-row strong,
  .title-assignment-row small {
    display: block;
  }

  .title-assignment-row strong {
    color: #e0e3e5;
    font-size: 10px;
  }

  .title-assignment-row small {
    color: #77828c;
    font-size: 8px;
  }

  .title-icon-button {
    align-items: center;
    background: rgba(111, 27, 31, 0.18) !important;
    border: 1px solid rgba(190, 70, 78, 0.36) !important;
    border-radius: 0 !important;
    color: #d5777d;
    display: inline-flex !important;
    font-size: 10px !important;
    height: 28px;
    justify-content: center;
    line-height: 1 !important;
    padding: 0 !important;
    width: 28px;
  }

  .title-icon-button:hover,
  .title-icon-button:focus {
    background: rgba(137, 32, 38, 0.3);
    color: #f09298;
  }

  .title-assignment-empty {
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(178, 191, 204, 0.15);
    color: #87919a;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 190px;
    padding: 20px;
    text-align: center;
  }

  .title-assignment-empty > i {
    color: #c5a747;
    font-size: 25px;
    margin-bottom: 8px;
  }

  .title-assignment-empty h4 {
    color: #d9dde0;
    font-size: 12px;
    margin: 0 0 3px;
  }

  .title-assignment-empty p {
    font-size: 9px;
    margin: 0 0 10px;
  }

  .title-assignment-empty--compact {
    border: 0;
    min-height: 120px;
  }

  .title-tab-count {
    background: rgba(210, 170, 69, 0.18);
    border-radius: 8px;
    color: #e5c45f;
    font-size: 8px;
    margin-left: 5px;
    padding: 1px 5px;
  }

  @media (max-width: 1180px) {
    .title-overview-layout,
    .title-assignment-toolbar {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .title-assignment-row {
      grid-template-columns: minmax(120px, 1fr) minmax(100px, 1fr) 38px;
    }

    .title-assignment-row > span:nth-child(3) {
      display: none;
    }
  }
</style>
