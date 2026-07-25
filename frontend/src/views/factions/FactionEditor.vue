<template>
  <content-area class="faction-editor-page">
    <div class="faction-toolbar">
      <div>
        <div class="faction-kicker">Content tools · faction data</div>
        <h1 class="faction-title">
          <i class="ra ra-double-team mr-2"></i>Faction Editor
        </h1>
        <p class="faction-subtitle">
          Manage player reputation rules and the NPC faction templates that consume them.
        </p>
      </div>
      <div class="workspace-switch" role="group" aria-label="Faction workspace">
        <button
          class="workspace-switch__button"
          :class="{ active: mode === 'player' }"
          @click="changeMode('player')"
        >
          <i class="fa fa-shield mr-1"></i>
          Player factions
          <span class="workspace-switch__count">{{ mode === 'player' ? totalRows : '—' }}</span>
        </button>
        <button
          class="workspace-switch__button"
          :class="{ active: mode === 'npc' }"
          @click="changeMode('npc')"
        >
          <i class="ra ra-dragon mr-1"></i>
          NPC templates
          <span class="workspace-switch__count">{{ mode === 'npc' ? totalRows : '—' }}</span>
        </button>
      </div>
    </div>

    <div class="faction-workspace">
      <aside class="faction-directory">
        <eq-window :title="mode === 'player' ? 'Player Factions' : 'NPC Faction Templates'">
          <div class="directory-controls">
            <div class="directory-search">
              <i class="fa fa-search"></i>
              <input
                id="faction-directory-search"
                v-model.trim="search"
                class="form-control form-control-sm"
                :placeholder="mode === 'player' ? 'Search faction name or ID…' : 'Search template name or ID…'"
                @input="queueSearch"
                @keyup.enter="loadDirectory(1)"
              >
              <button
                v-if="search"
                class="directory-clear"
                aria-label="Clear search"
                @click="search = ''; loadDirectory(1)"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <b-button
              size="sm"
              variant="outline-warning"
              class="directory-new"
              data-testid="faction-new"
              @click="createDraft"
            >
              <i class="fa fa-plus mr-1"></i>New
            </b-button>
          </div>

          <div class="directory-meta">
            <span>{{ totalRows.toLocaleString() }} records</span>
            <span v-if="loadingDirectory"><i class="fa fa-spinner fa-spin mr-1"></i>Refreshing</span>
            <span v-else>Page {{ currentPage }}</span>
          </div>

          <div class="directory-list" data-testid="faction-directory">
            <div v-if="loadingDirectory && !directory.length" class="directory-state">
              <i class="fa fa-spinner fa-spin"></i>
              <span>Loading faction data…</span>
            </div>
            <button
              v-for="record in directory"
              :key="mode + '-' + record.id"
              class="directory-row"
              :class="{ active: selectedId === record.id && !isCreating }"
              @click="selectRecord(record.id)"
            >
              <span class="directory-row__icon">
                <i :class="mode === 'player' ? 'fa fa-shield' : 'ra ra-dragon'"></i>
              </span>
              <span class="directory-row__body">
                <span class="directory-row__name">{{ record.name || '(unnamed)' }}</span>
                <span class="directory-row__detail" v-if="mode === 'player'">
                  Base {{ signed(record.base) }} · {{ record.modifier_count || 0 }} modifiers
                </span>
                <span class="directory-row__detail" v-else>
                  {{ record.entry_count || 0 }} standings · {{ record.npc_count || 0 }} NPCs
                </span>
              </span>
              <span class="directory-row__id">#{{ record.id }}</span>
            </button>
            <div v-if="!loadingDirectory && !directory.length" class="directory-state">
              <i class="fa fa-search"></i>
              <span>No matching {{ mode === 'player' ? 'factions' : 'templates' }}</span>
              <button class="btn btn-sm btn-outline-warning mt-2" @click="createDraft">
                Create the first one
              </button>
            </div>
          </div>

          <nav
            v-if="totalRows > pageSize"
            class="directory-pagination"
            aria-label="Faction directory pages"
          >
            <div class="directory-pagination__controls">
              <button
                type="button"
                aria-label="Go to first page"
                title="First page"
                :disabled="currentPage <= 1 || loadingDirectory"
                @click="goToPage(1)"
              >
                <i class="fa fa-angle-double-left"></i>
              </button>
              <button
                type="button"
                aria-label="Go to previous page"
                title="Previous page"
                :disabled="currentPage <= 1 || loadingDirectory"
                @click="goToPage(currentPage - 1)"
              >
                <i class="fa fa-angle-left"></i>
              </button>

              <div class="directory-pagination__position" aria-live="polite">
                <span>Page</span>
                <strong>{{ currentPage }}</strong>
                <span class="directory-pagination__divider">/</span>
                <span>{{ totalPages }}</span>
              </div>

              <button
                type="button"
                aria-label="Go to next page"
                title="Next page"
                :disabled="currentPage >= totalPages || loadingDirectory"
                @click="goToPage(currentPage + 1)"
              >
                <i class="fa fa-angle-right"></i>
              </button>
              <button
                type="button"
                aria-label="Go to last page"
                title="Last page"
                :disabled="currentPage >= totalPages || loadingDirectory"
                @click="goToPage(totalPages)"
              >
                <i class="fa fa-angle-double-right"></i>
              </button>
            </div>
            <div class="directory-pagination__track" aria-hidden="true">
              <span :style="{ width: paginationProgress + '%' }"></span>
            </div>
          </nav>
        </eq-window>
      </aside>

      <main class="faction-inspector">
        <eq-window v-if="!editModel && !loadingDetail" title="Faction Workspace">
          <div class="editor-empty">
            <div class="editor-empty__sigil">
              <i :class="mode === 'player' ? 'fa fa-shield' : 'ra ra-dragon'"></i>
            </div>
            <h3>Select a {{ mode === 'player' ? 'player faction' : 'NPC faction template' }}</h3>
            <p>
              {{ mode === 'player'
                ? 'Inspect reputation modifiers, client bounds, and every content reference.'
                : 'Edit standings, review assigned NPCs, and safely move assignments between templates.' }}
            </p>
            <b-button variant="outline-warning" size="sm" @click="createDraft">
              <i class="fa fa-plus mr-1"></i>Create new
            </b-button>
          </div>
        </eq-window>

        <eq-window v-if="loadingDetail" title="Faction Workspace">
          <div class="editor-empty">
            <div class="editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading editor…</h3>
          </div>
        </eq-window>

        <div v-if="editModel && !loadingDetail" data-testid="faction-editor-inspector">
          <eq-window :title="mode === 'player' ? 'Player Faction' : 'NPC Faction Template'" class="editor-header-window">
            <div class="editor-header">
              <div class="editor-identity">
                <span class="editor-identity__icon">
                  <i :class="mode === 'player' ? 'fa fa-shield' : 'ra ra-dragon'"></i>
                </span>
                <div>
                  <div class="editor-identity__eyebrow">
                    {{ isCreating ? 'New record' : '#' + editModel.id }}
                    <span v-if="hasUnsavedChanges" class="unsaved-pill">
                      <i class="fa fa-circle"></i> Unsaved
                    </span>
                  </div>
                  <h2>{{ editModel.name || (mode === 'player' ? 'Unnamed faction' : 'Unnamed template') }}</h2>
                  <p v-if="mode === 'player'">
                    Base standing {{ signed(editModel.base) }} · {{ editModel.modifiers.length }} modifier rules
                  </p>
                  <p v-else>
                    {{ editModel.entries.length }} standing entries · {{ references.npc_count || 0 }} assigned NPCs
                  </p>
                </div>
              </div>
              <div class="editor-actions">
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-danger"
                  :disabled="saving"
                  @click="confirmDelete"
                >
                  <i class="fa fa-trash mr-1"></i>Delete
                </b-button>
                <b-button
                  v-if="hasUnsavedChanges"
                  size="sm"
                  variant="outline-secondary"
                  :disabled="saving"
                  @click="resetEditor"
                >
                  <i class="fa fa-undo mr-1"></i>Reset
                </b-button>
                <b-button
                  size="sm"
                  :variant="hasUnsavedChanges ? 'outline-success' : 'outline-warning'"
                  :class="{ 'save-button--dirty': hasUnsavedChanges }"
                  :disabled="saving || !canSave"
                  title="Save changes (Ctrl/Command + S)"
                  data-testid="faction-save"
                  @click="saveEditor"
                >
                  <i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                  {{ saving ? 'Saving…' : (isCreating ? 'Create' : 'Save') }}
                </b-button>
              </div>
            </div>
          </eq-window>

          <eq-window title="Editor" class="editor-body-window">
            <eq-tabs :selected="selectedTab" :bottom-tab-margin="18" @on-selected="selectTab">
              <eq-tab name="Overview" :selected="selectedTab === 'Overview'">
                <div class="editor-section-heading">
                  <div>
                    <span class="section-kicker">Identity</span>
                    <h3>{{ mode === 'player' ? 'Player-facing faction' : 'NPC behavior template' }}</h3>
                  </div>
                  <span class="section-help">
                    {{ mode === 'player'
                      ? 'The base value is combined with race, class, and deity modifiers.'
                      : 'The primary faction drives assist behavior; entries control standing changes.' }}
                  </span>
                </div>

                <div class="form-grid">
                  <div class="form-group form-group--id">
                    <label for="faction-editor-id">ID</label>
                    <div class="input-group input-group-sm">
                      <input
                        id="faction-editor-id"
                        v-model.number="editModel.id"
                        type="number"
                        min="1"
                        class="form-control"
                        :disabled="!isCreating"
                      >
                      <div class="input-group-append" v-if="isCreating">
                        <button class="btn btn-outline-warning" type="button" @click="suggestFreeId">
                          Find free
                        </button>
                      </div>
                    </div>
                    <small>Stable database identifier; it cannot be changed after creation.</small>
                  </div>
                  <div class="form-group form-group--name">
                    <label for="faction-editor-name">Name</label>
                    <input
                      id="faction-editor-name"
                      v-model.trim="editModel.name"
                      class="form-control form-control-sm"
                      maxlength="255"
                      placeholder="Faction name"
                    >
                    <small>Use a clear content-facing name that editors can search later.</small>
                  </div>

                  <div v-if="mode === 'player'" class="form-group">
                    <label for="faction-editor-base">Base standing</label>
                    <input
                      id="faction-editor-base"
                      v-model.number="editModel.base"
                      type="number"
                      min="-32768"
                      max="32767"
                      class="form-control form-control-sm"
                    >
                    <small>Starting reputation before character-specific modifiers.</small>
                  </div>

                  <template v-else>
                    <div class="form-group">
                      <label for="npc-template-primary">Primary player faction</label>
                      <input
                        id="npc-template-primary"
                        v-model.number="editModel.primary_faction"
                        type="number"
                        min="0"
                        list="player-faction-options"
                        class="form-control form-control-sm"
                        placeholder="0 = no primary faction"
                      >
                      <small class="reference-resolution">
                        <template v-if="Number(editModel.primary_faction) === 0">
                          No primary faction
                        </template>
                        <template v-else>
                          <strong>{{ factionName(editModel.primary_faction) || 'Unknown player faction' }}</strong>
                          <code>#{{ editModel.primary_faction }}</code>
                        </template>
                      </small>
                    </div>
                    <div class="form-group form-group--check">
                      <label>Assist behavior</label>
                      <eq-checkbox
                        id="npc-template-ignore-assist"
                        v-model="editModel.ignore_primary_assist"
                        :true-value="true"
                        :false-value="false"
                        label-right="Ignore primary-faction assist"
                      />
                      <small>Prevents the primary faction from participating in assist checks.</small>
                    </div>
                  </template>
                </div>
              </eq-tab>

              <eq-tab
                :name="mode === 'player' ? 'Modifiers' : 'Standing Entries'"
                :selected="selectedTab === (mode === 'player' ? 'Modifiers' : 'Standing Entries')"
              >
                <div class="editor-section-heading">
                  <div>
                    <span class="section-kicker">{{ mode === 'player' ? 'Character rules' : 'NPC standings' }}</span>
                    <h3>{{ mode === 'player' ? 'Race, class, and deity modifiers' : 'Faction standing matrix' }}</h3>
                  </div>
                  <b-button size="sm" variant="outline-warning" @click="addRule">
                    <i class="fa fa-plus mr-1"></i>{{ mode === 'player' ? 'Add modifier' : 'Add standing' }}
                  </b-button>
                </div>

                <div class="table-shell">
                  <table
                    class="eq-table eq-highlight-rows faction-rules-table"
                    :class="{ 'npc-standing-table': mode === 'npc' }"
                  >
                    <thead v-if="mode === 'player'">
                      <tr>
                        <th>Type</th>
                        <th>Race / class / deity</th>
                        <th>Standing modifier</th>
                        <th class="rule-actions">Actions</th>
                      </tr>
                    </thead>
                    <thead v-else>
                      <tr>
                        <th>Player faction</th>
                        <th>Player faction change</th>
                        <th>NPC reaction</th>
                        <th>Persistence / message</th>
                        <th class="rule-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody v-if="mode === 'player'">
                      <tr v-for="(modifier, index) in editModel.modifiers" :key="'modifier-' + index">
                        <td>
                          <select
                            :id="'faction-modifier-kind-' + index"
                            v-model="modifier.kind"
                            class="form-control form-control-sm"
                            @change="onModifierKindChange(modifier)"
                          >
                            <option value="race">Race</option>
                            <option value="class">Class</option>
                            <option value="deity">Deity</option>
                          </select>
                        </td>
                        <td>
                          <select
                            :id="'faction-modifier-value-' + index"
                            v-model.number="modifier.value_id"
                            class="form-control form-control-sm modifier-target-select"
                          >
                            <option :value="null" disabled>Select a {{ modifier.kind }}</option>
                            <option
                              v-if="modifier.value_id && !isKnownModifierTarget(modifier)"
                              :value="Number(modifier.value_id)"
                            >
                              Unknown {{ modifier.kind }} · #{{ modifier.value_id }}
                            </option>
                            <option
                              v-for="option in modifierOptions(modifier.kind)"
                              :key="modifier.kind + '-' + option.id"
                              :value="option.id"
                            >
                              {{ option.name }} · #{{ option.id }}
                            </option>
                          </select>
                        </td>
                        <td>
                          <div class="modifier-value-editor">
                            <select
                              :id="'faction-modifier-preset-' + index"
                              :value="modifierPresetValue(modifier.amount)"
                              class="form-control form-control-sm modifier-preset-select"
                              aria-label="Common standing modifier preset"
                              @change="applyModifierPreset(modifier, $event.target.value)"
                            >
                              <option value="">Exact value</option>
                              <option
                                v-for="preset in modifierPresets"
                                :key="'modifier-preset-' + preset.value"
                                :value="String(preset.value)"
                              >
                                {{ preset.label }} · {{ signed(preset.value) }}
                              </option>
                            </select>
                            <input
                              :id="'faction-modifier-amount-' + index"
                              v-model.number="modifier.amount"
                              type="number"
                              min="-32768"
                              max="32767"
                              class="form-control form-control-sm"
                            >
                          </div>
                        </td>
                        <td class="rule-actions">
                          <button
                            type="button"
                            class="icon-action"
                            title="Add a similar modifier"
                            aria-label="Add a similar modifier"
                            @click="addSimilarRule(index)"
                          >
                            <i class="fa fa-copy"></i>
                          </button>
                          <button
                            type="button"
                            class="icon-action danger"
                            title="Remove modifier"
                            aria-label="Remove modifier"
                            @click="removeRule(index)"
                          >
                            <i class="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                    <tbody v-else>
                      <tr v-for="(entry, index) in editModel.entries" :key="'entry-' + index">
                        <td>
                          <input
                            :id="'npc-standing-faction-' + index"
                            v-model.number="entry.faction_id"
                            type="number"
                            min="1"
                            list="player-faction-options"
                            class="form-control form-control-sm"
                            placeholder="Faction ID"
                          >
                          <small class="reference-resolution">
                            <strong>{{ factionName(entry.faction_id) || entry.faction_name || 'Unknown player faction' }}</strong>
                            <code v-if="entry.faction_id">#{{ entry.faction_id }}</code>
                          </small>
                        </td>
                        <td>
                          <input
                            :id="'npc-standing-value-' + index"
                            v-model.number="entry.value"
                            type="number"
                            class="form-control form-control-sm"
                          >
                          <small>{{ signed(entry.value) }} when this NPC changes player faction</small>
                        </td>
                        <td>
                          <select
                            :id="'npc-standing-npc-value-' + index"
                            v-model.number="entry.npc_value"
                            class="form-control form-control-sm npc-reaction-select"
                          >
                            <option
                              v-if="!isKnownNpcReaction(entry.npc_value)"
                              :value="Number(entry.npc_value)"
                            >
                              Unknown reaction · {{ entry.npc_value }}
                            </option>
                            <option
                              v-for="option in npcReactionOptions"
                              :key="'npc-reaction-' + option.value"
                              :value="option.value"
                            >
                              {{ option.label }} · {{ signed(option.value) }}
                            </option>
                          </select>
                        </td>
                        <td>
                          <select
                            :id="'npc-standing-temp-' + index"
                            v-model.number="entry.temp"
                            class="form-control form-control-sm standing-update-select"
                            aria-label="Persistence and player message behavior"
                          >
                            <option
                              v-if="!isKnownStandingUpdate(entry.temp)"
                              :value="Number(entry.temp)"
                            >
                              Unknown legacy behavior · {{ entry.temp }}
                            </option>
                            <option
                              v-for="option in standingUpdateOptions"
                              :key="'standing-update-' + option.value"
                              :value="option.value"
                            >
                              {{ option.label }}
                            </option>
                          </select>
                        </td>
                        <td class="rule-actions">
                          <button
                            type="button"
                            class="icon-action"
                            title="Add a similar standing"
                            aria-label="Add a similar standing"
                            @click="addSimilarRule(index)"
                          >
                            <i class="fa fa-copy"></i>
                          </button>
                          <button
                            type="button"
                            class="icon-action danger"
                            title="Remove standing"
                            aria-label="Remove standing"
                            @click="removeRule(index)"
                          >
                            <i class="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-if="ruleCount === 0" class="table-empty">
                    <i class="fa fa-sliders"></i>
                    <span>No {{ mode === 'player' ? 'modifier rules' : 'standing entries' }} configured.</span>
                    <button class="btn btn-sm btn-outline-warning" @click="addRule">Add the first one</button>
                  </div>
                </div>
              </eq-tab>

              <eq-tab v-if="mode === 'player'" name="Client Bounds" :selected="selectedTab === 'Client Bounds'">
                <div class="editor-section-heading">
                  <div>
                    <span class="section-kicker">Optional client data</span>
                    <h3>Faction limits and heroic values</h3>
                  </div>
                  <eq-checkbox
                    id="faction-client-bounds-enabled"
                    v-model="clientBoundsEnabled"
                    :true-value="true"
                    :false-value="false"
                    label-right="Store client faction bounds"
                  />
                </div>
                <template v-if="clientBoundsEnabled">
                  <div class="form-grid">
                    <div class="form-group">
                      <label for="faction-bound-min">Minimum</label>
                      <input id="faction-bound-min" v-model.number="editModel.base_data.min" type="number" class="form-control form-control-sm">
                      <small>Lowest faction value accepted by the client data.</small>
                    </div>
                    <div class="form-group">
                      <label for="faction-bound-max">Maximum</label>
                      <input id="faction-bound-max" v-model.number="editModel.base_data.max" type="number" class="form-control form-control-sm">
                      <small>Highest faction value accepted by the client data.</small>
                    </div>
                    <div class="form-group">
                      <label for="faction-hero-1">Heroic value 1</label>
                      <input id="faction-hero-1" v-model.number="editModel.base_data.unk_hero_1" type="number" class="form-control form-control-sm">
                      <small>Upstream field <code>unk_hero1</code>; preserve existing values.</small>
                    </div>
                    <div class="form-group">
                      <label for="faction-hero-2">Heroic value 2</label>
                      <input id="faction-hero-2" v-model.number="editModel.base_data.unk_hero_2" type="number" class="form-control form-control-sm">
                      <small>Upstream field <code>unk_hero2</code>.</small>
                    </div>
                    <div class="form-group">
                      <label for="faction-hero-3">Heroic value 3</label>
                      <input id="faction-hero-3" v-model.number="editModel.base_data.unk_hero_3" type="number" class="form-control form-control-sm">
                      <small>Upstream field <code>unk_hero3</code>.</small>
                    </div>
                  </div>

                  <div
                    v-if="clientBoundsPreview"
                    class="bounds-preview"
                    :class="{
                      invalid: !clientBoundsPreview.valid,
                      outside: clientBoundsPreview.valid && !clientBoundsPreview.inRange,
                    }"
                    aria-live="polite"
                  >
                    <div class="bounds-preview__header">
                      <span>Base standing position</span>
                      <strong>{{ clientBoundsPreview.status }}</strong>
                    </div>
                    <div v-if="clientBoundsPreview.valid" class="bounds-preview__track" aria-hidden="true">
                      <span
                        class="bounds-preview__marker"
                        :style="{ left: clientBoundsPreview.position + '%' }"
                      ></span>
                    </div>
                    <div v-if="clientBoundsPreview.valid" class="bounds-preview__scale">
                      <span>{{ signed(clientBoundsPreview.min) }} minimum</span>
                      <b>Base {{ signed(clientBoundsPreview.base) }}</b>
                      <span>{{ signed(clientBoundsPreview.max) }} maximum</span>
                    </div>
                  </div>
                </template>
                <div v-else class="inline-empty">
                  <i class="fa fa-info-circle"></i>
                  This faction has no row in <code>faction_base_data</code>. Enable bounds to create one.
                </div>
              </eq-tab>

              <eq-tab
                :name="mode === 'player' ? 'Usage & Safety' : 'NPC Assignments'"
                :selected="selectedTab === (mode === 'player' ? 'Usage & Safety' : 'NPC Assignments')"
              >
                <template v-if="mode === 'player'">
                  <div class="editor-section-heading">
                    <div>
                      <span class="section-kicker">Reference checks</span>
                      <h3>Where this faction is used</h3>
                    </div>
                    <span class="safe-status" :class="{ clear: referenceTotal === 0 }">
                      <i :class="referenceTotal === 0 ? 'fa fa-check-circle' : 'fa fa-lock'"></i>
                      {{ referenceTotal === 0 ? 'Safe to delete' : referenceTotal + ' blocking references' }}
                    </span>
                  </div>
                  <div class="reference-grid">
                    <div v-for="card in playerReferenceCards" :key="card.key" class="reference-card">
                      <span class="reference-card__icon"><i :class="card.icon"></i></span>
                      <span>
                        <strong>{{ card.value }}</strong>
                        <small>{{ card.label }}</small>
                      </span>
                    </div>
                  </div>
                  <div class="usage-columns">
                    <usage-list title="NPC templates" :rows="references.npc_templates || []" icon="ra ra-dragon" />
                    <usage-list title="Items" :rows="references.items || []" icon="ra ra-relic-blade" />
                    <usage-list title="Tasks" :rows="references.tasks || []" icon="fa fa-tasks" />
                  </div>
                  <div v-if="(references.character_value_count || 0) > 0 || (references.association_count || 0) > 0" class="safety-note">
                    <i class="fa fa-database"></i>
                    Character faction values and faction-association rows are counted as blockers but are intentionally not mutated by this editor.
                  </div>
                </template>

                <template v-else>
                  <div class="editor-section-heading">
                    <div>
                      <span class="section-kicker">Direct reassignment</span>
                      <h3>NPCs using this template</h3>
                    </div>
                    <span class="section-help">
                      {{ references.npc_count || 0 }} total
                      <template v-if="(references.npc_count || 0) > (references.npcs || []).length">
                        · first {{ (references.npcs || []).length }} shown
                      </template>
                    </span>
                  </div>

                  <div class="assignment-bar">
                    <label class="select-all">
                      <input
                        type="checkbox"
                        :checked="allVisibleNpcsSelected"
                        :disabled="!(references.npcs || []).length"
                        @change="toggleAllNpcs"
                      >
                      Select visible
                    </label>
                    <div class="assignment-target">
                      <label for="npc-reassign-target">Move {{ selectedNpcIds.length }} selected to</label>
                      <input
                        id="npc-reassign-target"
                        v-model.number="reassignTargetId"
                        type="number"
                        min="0"
                        list="npc-template-options"
                        class="form-control form-control-sm"
                        placeholder="0 = unassigned"
                      >
                      <small class="assignment-target__resolution">
                        <template v-if="Number(reassignTargetId) === 0">Unassigned</template>
                        <template v-else>
                          {{ templateName(reassignTargetId) || 'Unknown NPC template' }}
                          <code>#{{ reassignTargetId }}</code>
                        </template>
                      </small>
                    </div>
                    <b-button
                      size="sm"
                      variant="outline-warning"
                      :disabled="!selectedNpcIds.length || reassigning"
                      @click="confirmReassign"
                    >
                      <i class="fa mr-1" :class="reassigning ? 'fa-spinner fa-spin' : 'fa-exchange'"></i>
                      Reassign
                    </b-button>
                  </div>

                  <div class="table-shell">
                    <table class="eq-table eq-highlight-rows npc-assignment-table">
                      <thead>
                        <tr>
                          <th class="assignment-check"></th>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Level</th>
                          <th>Race</th>
                          <th>Class</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="npc in references.npcs || []" :key="'assigned-npc-' + npc.id">
                          <td class="assignment-check">
                            <input v-model="selectedNpcIds" type="checkbox" :value="npc.id">
                          </td>
                          <td class="muted-cell">#{{ npc.id }}</td>
                          <td>{{ npc.name }}</td>
                          <td>{{ npc.level }}</td>
                          <td>
                            <span class="npc-reference">
                              <strong>{{ npcRaceName(npc.race) || 'Unknown race' }}</strong>
                              <code>#{{ npc.race }}</code>
                            </span>
                          </td>
                          <td>
                            <span class="npc-reference">
                              <strong>{{ npcClassName(npc.class) || 'Unknown class' }}</strong>
                              <code>#{{ npc.class }}</code>
                            </span>
                          </td>
                          <td class="text-right">
                            <router-link
                              :to="'/npc/' + npc.id"
                              class="icon-action"
                              title="Open NPC editor"
                              :aria-label="'Open NPC editor for ' + npc.name"
                            >
                              <i class="fa fa-external-link"></i>
                            </router-link>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div v-if="!(references.npcs || []).length" class="table-empty">
                      <i class="fa fa-check-circle"></i>
                      <span>No NPCs are assigned to this template.</span>
                    </div>
                  </div>
                </template>
              </eq-tab>
            </eq-tabs>
          </eq-window>
        </div>
      </main>
    </div>

    <datalist id="player-faction-options">
      <option
        v-for="option in playerFactionOptions"
        :key="'player-option-' + option.id"
        :value="option.id"
        :label="option.name + ' · #' + option.id"
      ></option>
    </datalist>
    <datalist id="npc-template-options">
      <option value="0">Unassigned</option>
      <option
        v-for="option in npcTemplateOptions"
        :key="'template-option-' + option.id"
        :value="option.id"
        :label="option.name + ' · #' + option.id"
        :disabled="editModel && option.id === editModel.id"
      ></option>
    </datalist>

    <div v-if="notification" class="faction-notification" :class="notification.type">
      <i :class="notification.type === 'error' ? 'fa fa-exclamation-triangle' : 'fa fa-check-circle'"></i>
      {{ notification.message }}
    </div>
  </content-area>
</template>

<script>
import ContentArea from "../../components/layout/ContentArea";
import EqWindow from "../../components/eq-ui/EQWindow";
import EqTabs from "../../components/eq-ui/EQTabs";
import EqTab from "../../components/eq-ui/EQTab";
import EqCheckbox from "../../components/eq-ui/EQCheckbox";
import { SpireApi } from "../../app/api/spire-api";
import { DB_PLAYER_RACES, DB_RACE_NAMES } from "../../app/constants/eq-races-constants";
import { DB_CLASSES, DB_PLAYER_CLASSES } from "../../app/constants/eq-classes-constants";
import { DB_DIETIES_FULL } from "../../app/constants/eq-deities-constants";

const modifierTargetOptions = {
  race: Object.entries(DB_PLAYER_RACES)
    .map(([id, value]) => ({ id: Number(id), name: value.race }))
    .sort((left, right) => left.id - right.id),
  class: Object.entries(DB_PLAYER_CLASSES)
    .map(([id, name]) => ({ id: Number(id), name }))
    .sort((left, right) => left.id - right.id),
  deity: [
    { id: 396, name: "Agnostic" },
    ...Object.entries(DB_DIETIES_FULL)
      .filter(([id]) => Number(id) >= 201 && Number(id) <= 216)
      .map(([id, value]) => ({ id: Number(id), name: value.name }))
      .sort((left, right) => left.id - right.id),
  ],
};

const modifierPresets = [
  { value: -2000, label: "Maximum penalty" },
  { value: -1000, label: "Major penalty" },
  { value: -500, label: "Moderate penalty" },
  { value: -200, label: "Penalty" },
  { value: -100, label: "Minor penalty" },
  { value: -50, label: "Small penalty" },
  { value: 0, label: "No change" },
  { value: 50, label: "Small bonus" },
  { value: 100, label: "Bonus" },
  { value: 500, label: "Moderate bonus" },
  { value: 1000, label: "Major bonus" },
];

const npcReactionOptions = [
  { value: -1, label: "Attack player" },
  { value: 0, label: "Neutral" },
  { value: 1, label: "Assist player" },
];

const standingUpdateOptions = [
  { value: 0, label: "Permanent · Message" },
  { value: 1, label: "Temporary · Silent" },
  { value: 2, label: "Temporary · Message" },
  { value: 3, label: "Permanent · Silent" },
];

const UsageList = {
  name: "UsageList",
  props: {
    title: String,
    rows: { type: Array, default: () => [] },
    icon: String,
  },
  template: `
    <section class="usage-list">
      <h4><i :class="icon"></i>{{ title }} <span>{{ rows.length }}</span></h4>
      <div v-if="rows.length" class="usage-list__rows">
        <div v-for="row in rows" :key="title + '-' + row.id" class="usage-list__row">
          <span><strong>{{ row.name || '(unnamed)' }}</strong><small v-if="row.extra">{{ row.extra }}</small></span>
          <code>#{{ row.id }}</code>
        </div>
      </div>
      <div v-else class="usage-list__empty">No references</div>
    </section>
  `,
};

function blankBaseData() {
  return { min: -2000, max: 2000, unk_hero_1: 0, unk_hero_2: 0, unk_hero_3: 0 };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export default {
  name: "FactionEditor",
  components: { ContentArea, EqWindow, EqTabs, EqTab, EqCheckbox, UsageList },
  data() {
    return {
      mode: this.$route.query.mode === "npc" ? "npc" : "player",
      search: "",
      directory: [],
      totalRows: 0,
      currentPage: 1,
      pageSize: 50,
      loadingDirectory: false,
      loadingDetail: false,
      saving: false,
      reassigning: false,
      selectedId: null,
      isCreating: false,
      editModel: null,
      originalModel: null,
      references: {},
      selectedTab: this.$route.query.tab || "Overview",
      searchTimer: null,
      notification: null,
      notificationTimer: null,
      clientBoundsEnabled: false,
      playerFactionOptions: [],
      npcTemplateOptions: [],
      selectedNpcIds: [],
      reassignTargetId: 0,
      modifierPresets,
      npcReactionOptions,
      standingUpdateOptions,
    };
  },
  computed: {
    hasUnsavedChanges() {
      return !!this.editModel && JSON.stringify(this.editModel) !== JSON.stringify(this.originalModel);
    },
    canSave() {
      if (!this.editModel || !this.editModel.id || !String(this.editModel.name || "").trim()) return false;
      if (this.mode === "player") {
        if (this.clientBoundsEnabled && (!this.clientBoundsPreview || !this.clientBoundsPreview.valid)) {
          return false;
        }
        return this.editModel.modifiers.every(row =>
          ["race", "class", "deity"].includes(row.kind) && Number(row.value_id) > 0
        );
      }
      const ids = this.editModel.entries.map(row => Number(row.faction_id));
      return ids.every(id => id > 0) && new Set(ids).size === ids.length;
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
    },
    paginationProgress() {
      if (this.totalPages <= 1) return 100;
      return ((this.currentPage - 1) / (this.totalPages - 1)) * 100;
    },
    clientBoundsPreview() {
      if (this.mode !== "player" || !this.editModel || !this.editModel.base_data) return null;
      const data = this.editModel.base_data;
      const hasMinimum = data.min !== "" && data.min !== null && data.min !== undefined;
      const hasMaximum = data.max !== "" && data.max !== null && data.max !== undefined;
      const min = Number(data.min);
      const max = Number(data.max);
      const base = Number(this.editModel.base || 0);
      if (!hasMinimum || !hasMaximum || !Number.isFinite(min) || !Number.isFinite(max)) {
        return { valid: false, status: "Enter both bounds" };
      }
      if (min > max) {
        return { valid: false, status: "Minimum exceeds maximum" };
      }
      const inRange = base >= min && base <= max;
      const position = min === max
        ? 50
        : Math.min(100, Math.max(0, ((base - min) / (max - min)) * 100));
      let status = "Within client bounds";
      if (base < min) status = "Base is below minimum";
      if (base > max) status = "Base is above maximum";
      return { valid: true, inRange, position, min, max, base, status };
    },
    ruleCount() {
      if (!this.editModel) return 0;
      return this.mode === "player" ? this.editModel.modifiers.length : this.editModel.entries.length;
    },
    referenceTotal() {
      const refs = this.references || {};
      return [
        "npc_template_primary_count",
        "npc_standing_count",
        "item_count",
        "task_count",
        "character_value_count",
        "association_count",
      ].reduce((total, key) => total + Number(refs[key] || 0), 0);
    },
    playerReferenceCards() {
      return [
        { key: "templates", label: "NPC template references", value: Number(this.references.npc_template_primary_count || 0) + Number(this.references.npc_standing_count || 0), icon: "ra ra-dragon" },
        { key: "items", label: "Item references", value: this.references.item_count || 0, icon: "ra ra-relic-blade" },
        { key: "tasks", label: "Task rewards", value: this.references.task_count || 0, icon: "fa fa-tasks" },
        { key: "characters", label: "Character values", value: this.references.character_value_count || 0, icon: "fa fa-users" },
        { key: "associations", label: "Faction associations", value: this.references.association_count || 0, icon: "fa fa-link" },
      ];
    },
    allVisibleNpcsSelected() {
      const ids = (this.references.npcs || []).map(npc => npc.id);
      return ids.length > 0 && ids.every(id => this.selectedNpcIds.includes(id));
    },
  },
  watch: {
    clientBoundsEnabled(enabled) {
      if (!this.editModel || this.mode !== "player") return;
      if (enabled && !this.editModel.base_data) {
        this.$set(this.editModel, "base_data", blankBaseData());
      }
      if (!enabled && this.editModel.base_data) {
        this.$set(this.editModel, "base_data", null);
      }
    },
    "$route.query": {
      deep: true,
      handler(query) {
        const nextMode = query.mode === "npc" ? "npc" : "player";
        if (nextMode !== this.mode) {
          this.mode = nextMode;
          this.resetWorkspace();
          this.loadDirectory(1);
        }
      },
    },
  },
  created() {
    this.loadDirectory(1).then(() => {
      const routeId = Number(this.$route.query.faction || 0);
      if (routeId > 0) this.selectRecord(routeId, true);
    });
    this.loadLookupOptions();
  },
  mounted() {
    window.addEventListener("keydown", this.onEditorKeydown);
  },
  beforeDestroy() {
    window.clearTimeout(this.searchTimer);
    window.clearTimeout(this.notificationTimer);
    window.removeEventListener("keydown", this.onEditorKeydown);
  },
  beforeRouteLeave(to, from, next) {
    if (this.hasUnsavedChanges && !window.confirm("Discard unsaved faction editor changes?")) {
      next(false);
      return;
    }
    next();
  },
  methods: {
    async loadDirectory(page = 1) {
      this.loadingDirectory = true;
      this.currentPage = Number(page) || 1;
      try {
        const endpoint = this.mode === "player" ? "factions" : "npc-templates";
        const response = await SpireApi.v1().get(`/faction-editor/${endpoint}`, {
          params: { q: this.search, page: this.currentPage, limit: this.pageSize },
        });
        this.directory = response.data.data || [];
        this.totalRows = Number(response.data.total || 0);
      } catch (error) {
        this.showNotification(this.errorMessage(error, "Unable to load faction directory"), "error");
      } finally {
        this.loadingDirectory = false;
      }
    },
    queueSearch() {
      window.clearTimeout(this.searchTimer);
      this.searchTimer = window.setTimeout(() => this.loadDirectory(1), 260);
    },
    goToPage(page) {
      const nextPage = Math.min(this.totalPages, Math.max(1, Number(page) || 1));
      if (nextPage === this.currentPage || this.loadingDirectory) return;
      this.loadDirectory(nextPage);
    },
    async loadLookupOptions() {
      try {
        const [players, templates] = await Promise.all([
          SpireApi.v1().get("/faction-editor/factions", { params: { lookup: 1 } }),
          SpireApi.v1().get("/faction-editor/npc-templates", { params: { lookup: 1 } }),
        ]);
        this.playerFactionOptions = players.data.data || [];
        this.npcTemplateOptions = templates.data.data || [];
      } catch (_) {
        // The editor remains usable with direct numeric IDs if optional lookups fail.
      }
    },
    async changeMode(nextMode) {
      if (nextMode === this.mode) return;
      if (!(await this.confirmDiscard())) return;
      this.mode = nextMode;
      this.resetWorkspace();
      await this.updateRoute();
      await this.loadDirectory(1);
    },
    async selectRecord(id, force = false) {
      if (!force && this.selectedId === id && !this.isCreating) return;
      if (!force && !(await this.confirmDiscard())) return;
      this.loadingDetail = true;
      this.isCreating = false;
      this.selectedId = Number(id);
      this.selectedNpcIds = [];
      try {
        const kind = this.mode === "player" ? "faction" : "npc-template";
        const response = await SpireApi.v1().get(`/faction-editor/${kind}/${id}`);
        this.installDetail(response.data);
        await this.updateRoute();
      } catch (error) {
        this.editModel = null;
        this.originalModel = null;
        this.showNotification(this.errorMessage(error, "Unable to load faction record"), "error");
      } finally {
        this.loadingDetail = false;
      }
    },
    installDetail(detail) {
      const model = this.mode === "player" ? detail.faction : detail.template;
      if (this.mode === "player") {
        model.modifiers = model.modifiers || [];
        this.clientBoundsEnabled = !!model.base_data;
        if (!model.base_data) model.base_data = null;
      } else {
        model.entries = (model.entries || []).map(entry => {
          const normalized = Object.assign({}, entry, {
            temp: entry.temp === undefined || entry.temp === null
              ? (entry.temporary ? 1 : 0)
              : Number(entry.temp),
          });
          delete normalized.temporary;
          return normalized;
        });
      }
      this.editModel = clone(model);
      this.originalModel = clone(model);
      this.references = detail.references || {};
    },
    async createDraft() {
      if (!(await this.confirmDiscard())) return;
      this.isCreating = true;
      this.selectedId = null;
      this.references = {};
      this.selectedNpcIds = [];
      if (this.mode === "player") {
        this.clientBoundsEnabled = false;
        this.editModel = { id: null, name: "", base: 0, base_data: null, modifiers: [] };
      } else {
        this.editModel = {
          id: null,
          name: "",
          primary_faction: 0,
          ignore_primary_assist: false,
          entries: [],
        };
      }
      this.originalModel = clone(this.editModel);
      this.selectedTab = "Overview";
      await this.updateRoute();
      this.$nextTick(() => document.getElementById("faction-editor-name")?.focus());
    },
    async suggestFreeId() {
      const kind = this.mode === "player" ? "faction" : "npc-template";
      try {
        const response = await SpireApi.v1().get(`/faction-editor/free-id/${kind}`);
        this.editModel.id = Number(response.data.id);
        this.showNotification(`Suggested free ID ${this.editModel.id}`, "success");
      } catch (error) {
        this.showNotification(this.errorMessage(error, "Unable to suggest a free ID"), "error");
      }
    },
    addRule() {
      if (this.mode === "player") {
        this.editModel.modifiers.push({ kind: "race", value_id: 1, amount: 0 });
      } else {
        this.editModel.entries.push({ faction_id: 0, faction_name: "", value: 0, npc_value: 0, temp: 0 });
      }
    },
    addSimilarRule(index) {
      const collection = this.mode === "player" ? this.editModel.modifiers : this.editModel.entries;
      const source = collection[index];
      const row = this.mode === "player"
        ? { kind: source.kind, value_id: null, amount: Number(source.amount || 0) }
        : {
          faction_id: 0,
          faction_name: "",
          value: Number(source.value || 0),
          npc_value: Number(source.npc_value || 0),
          temp: Number(source.temp || 0),
        };
      collection.splice(index + 1, 0, row);
      const inputPrefix = this.mode === "player" ? "faction-modifier-value" : "npc-standing-faction";
      this.$nextTick(() => document.getElementById(`${inputPrefix}-${index + 1}`)?.focus());
    },
    modifierOptions(kind) {
      return modifierTargetOptions[kind] || [];
    },
    isKnownModifierTarget(modifier) {
      return this.modifierOptions(modifier.kind)
        .some(option => option.id === Number(modifier.value_id));
    },
    onModifierKindChange(modifier) {
      const firstOption = this.modifierOptions(modifier.kind)[0];
      modifier.value_id = firstOption ? firstOption.id : null;
    },
    modifierPresetValue(amount) {
      const value = Number(amount || 0);
      return modifierPresets.some(preset => preset.value === value) ? String(value) : "";
    },
    applyModifierPreset(modifier, value) {
      if (value === "") return;
      modifier.amount = Number(value);
    },
    removeRule(index) {
      const collection = this.mode === "player" ? this.editModel.modifiers : this.editModel.entries;
      collection.splice(index, 1);
    },
    onEditorKeydown(event) {
      const isSaveShortcut = (event.metaKey || event.ctrlKey)
        && !event.altKey
        && String(event.key || "").toLowerCase() === "s";
      if (!isSaveShortcut || !this.editModel) return;
      event.preventDefault();
      if (this.hasUnsavedChanges && this.canSave && !this.saving) this.saveEditor();
    },
    async saveEditor() {
      if (!this.canSave || this.saving) return;
      this.saving = true;
      try {
        const kind = this.mode === "player" ? "faction" : "npc-template";
        const method = this.isCreating ? "put" : "patch";
        const path = this.isCreating
          ? `/faction-editor/${kind}`
          : `/faction-editor/${kind}/${this.editModel.id}`;
        const response = await SpireApi.v1()[method](path, this.normalizedPayload());
        const created = this.isCreating;
        this.isCreating = false;
        this.selectedId = Number(this.editModel.id);
        this.installDetail(response.data);
        await Promise.all([this.loadDirectory(this.currentPage), this.loadLookupOptions()]);
        await this.updateRoute();
        this.showNotification(created ? "Faction record created" : "Faction changes saved", "success");
      } catch (error) {
        this.showNotification(this.errorMessage(error, "Unable to save faction changes"), "error");
      } finally {
        this.saving = false;
      }
    },
    normalizedPayload() {
      const payload = clone(this.editModel);
      payload.id = Number(payload.id);
      if (this.mode === "player") {
        payload.base = Number(payload.base || 0);
        payload.modifiers = payload.modifiers.map(row => ({
          kind: row.kind,
          value_id: Number(row.value_id),
          amount: Number(row.amount || 0),
        }));
        if (!this.clientBoundsEnabled) payload.base_data = null;
      } else {
        payload.primary_faction = Number(payload.primary_faction || 0);
        payload.entries = payload.entries.map(row => ({
          faction_id: Number(row.faction_id),
          value: Number(row.value || 0),
          npc_value: Number(row.npc_value || 0),
          temp: Number(row.temp || 0),
        }));
      }
      return payload;
    },
    resetEditor() {
      this.editModel = clone(this.originalModel);
      this.clientBoundsEnabled = this.mode === "player" && !!this.editModel.base_data;
    },
    async confirmDelete() {
      const label = this.editModel.name || `#${this.editModel.id}`;
      const confirmed = await this.$bvModal.msgBoxConfirm(
        `Delete ${label}? This action is blocked if any content still references it.`,
        {
          title: `Delete ${this.mode === "player" ? "player faction" : "NPC faction template"}`,
          okTitle: "Delete permanently",
          okVariant: "danger",
          cancelTitle: "Cancel",
          centered: true,
        }
      );
      if (!confirmed) return;
      try {
        const kind = this.mode === "player" ? "faction" : "npc-template";
        await SpireApi.v1().delete(`/faction-editor/${kind}/${this.editModel.id}`);
        this.showNotification("Faction record deleted", "success");
        this.resetWorkspace();
        await Promise.all([this.loadDirectory(1), this.loadLookupOptions()]);
        await this.updateRoute();
      } catch (error) {
        const refs = error?.response?.data?.references;
        if (refs) this.references = refs;
        this.showNotification(this.errorMessage(error, "Deletion was blocked"), "error", 6500);
      }
    },
    toggleAllNpcs(event) {
      this.selectedNpcIds = event.target.checked
        ? (this.references.npcs || []).map(npc => npc.id)
        : [];
    },
    async confirmReassign() {
      const target = Number(this.reassignTargetId || 0);
      const targetName = target === 0 ? "Unassigned" : (this.templateName(target) || `template #${target}`);
      const confirmed = await this.$bvModal.msgBoxConfirm(
        `Move ${this.selectedNpcIds.length} selected NPC${this.selectedNpcIds.length === 1 ? "" : "s"} to ${targetName}?`,
        {
          title: "Reassign NPC faction template",
          okTitle: "Reassign NPCs",
          okVariant: "warning",
          cancelTitle: "Cancel",
          centered: true,
        }
      );
      if (!confirmed) return;
      this.reassigning = true;
      try {
        await SpireApi.v1().post(
          `/faction-editor/npc-template/${this.editModel.id}/reassign`,
          { npc_ids: this.selectedNpcIds.map(Number), target_npc_faction_id: target }
        );
        const moved = this.selectedNpcIds.length;
        this.selectedNpcIds = [];
        const response = await SpireApi.v1().get(`/faction-editor/npc-template/${this.editModel.id}`);
        this.installDetail(response.data);
        await this.loadDirectory(this.currentPage);
        this.showNotification(`${moved} NPC${moved === 1 ? "" : "s"} reassigned`, "success");
      } catch (error) {
        this.showNotification(this.errorMessage(error, "Unable to reassign NPCs"), "error");
      } finally {
        this.reassigning = false;
      }
    },
    selectTab(tab) {
      this.selectedTab = tab;
      this.updateRoute();
    },
    allowedTabs() {
      return this.mode === "player"
        ? ["Overview", "Modifiers", "Client Bounds", "Usage & Safety"]
        : ["Overview", "Standing Entries", "NPC Assignments"];
    },
    async updateRoute() {
      if (!this.allowedTabs().includes(this.selectedTab)) this.selectedTab = "Overview";
      const query = { mode: this.mode, tab: this.selectedTab };
      if (this.selectedId && !this.isCreating) query.faction = String(this.selectedId);
      if (JSON.stringify(query) !== JSON.stringify(this.$route.query)) {
        await this.$router.replace({ path: this.$route.path, query }).catch(() => {});
      }
    },
    resetWorkspace() {
      this.selectedId = null;
      this.isCreating = false;
      this.editModel = null;
      this.originalModel = null;
      this.references = {};
      this.selectedNpcIds = [];
      this.reassignTargetId = 0;
      this.selectedTab = "Overview";
    },
    async confirmDiscard() {
      if (!this.hasUnsavedChanges) return true;
      return !!(await this.$bvModal.msgBoxConfirm(
        "You have unsaved faction changes. Discard them and continue?",
        {
          title: "Discard unsaved changes?",
          okTitle: "Discard changes",
          okVariant: "danger",
          cancelTitle: "Keep editing",
          centered: true,
        }
      ));
    },
    factionName(id) {
      const match = this.playerFactionOptions.find(option => Number(option.id) === Number(id));
      return match ? match.name : "";
    },
    npcRaceName(id) {
      return DB_RACE_NAMES[Number(id)] || "";
    },
    npcClassName(id) {
      return DB_CLASSES[Number(id)] || "";
    },
    isKnownNpcReaction(value) {
      return npcReactionOptions.some(option => option.value === Number(value));
    },
    isKnownStandingUpdate(value) {
      return standingUpdateOptions.some(option => option.value === Number(value));
    },
    templateName(id) {
      const match = this.npcTemplateOptions.find(option => Number(option.id) === Number(id));
      return match ? match.name : "";
    },
    signed(value) {
      const number = Number(value || 0);
      return number > 0 ? `+${number}` : String(number);
    },
    errorMessage(error, fallback) {
      return error?.response?.data?.error || error?.message || fallback;
    },
    showNotification(message, type = "success", duration = 3600) {
      window.clearTimeout(this.notificationTimer);
      this.notification = { message, type };
      this.notificationTimer = window.setTimeout(() => { this.notification = null; }, duration);
    },
  },
};
</script>

<style scoped>
.faction-editor-page {
  padding: 18px 20px 28px !important;
}

.faction-toolbar {
  align-items: flex-end;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  margin-bottom: 14px;
}

.faction-kicker,
.section-kicker {
  color: #c39b49;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.faction-title {
  color: #f5d993;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 26px;
  margin: 2px 0 1px;
  text-shadow: 0 1px 1px #000;
}

.faction-subtitle {
  color: rgba(255, 255, 255, .58);
  font-size: 12px;
  margin: 0;
}

.workspace-switch {
  background: rgba(0, 0, 0, .25);
  border: 1px solid rgba(195, 155, 73, .22);
  border-radius: 4px;
  display: flex;
  padding: 3px;
}

.workspace-switch__button {
  background: transparent;
  border: 0;
  border-radius: 3px;
  color: rgba(255, 255, 255, .62);
  cursor: pointer;
  font-size: 12px;
  padding: 7px 10px;
  transition: background .15s ease, color .15s ease;
}

.workspace-switch__button:hover {
  color: #fff;
}

.workspace-switch__button.active {
  background: linear-gradient(180deg, rgba(195, 155, 73, .28), rgba(95, 69, 27, .34));
  box-shadow: inset 0 0 0 1px rgba(238, 201, 119, .25);
  color: #ffe6a7;
}

.workspace-switch__count {
  background: rgba(0, 0, 0, .28);
  border-radius: 9px;
  font-size: 9px;
  margin-left: 5px;
  padding: 2px 5px;
}

.faction-workspace {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(280px, 31%) minmax(0, 1fr);
}

.faction-directory,
.faction-inspector {
  min-width: 0;
}

.directory-controls {
  display: flex;
  gap: 7px;
}

.directory-search {
  flex: 1;
  min-width: 0;
  position: relative;
}

.directory-search > i {
  color: rgba(255, 255, 255, .42);
  left: 9px;
  position: absolute;
  top: 8px;
  z-index: 2;
}

.directory-search input {
  padding-left: 27px !important;
  padding-right: 26px !important;
}

.directory-clear {
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, .45);
  cursor: pointer;
  padding: 5px;
  position: absolute;
  right: 4px;
  top: 1px;
}

.directory-new {
  white-space: nowrap;
}

.directory-meta {
  color: rgba(255, 255, 255, .42);
  display: flex;
  font-size: 10px;
  justify-content: space-between;
  padding: 7px 2px 5px;
  text-transform: uppercase;
}

.directory-list {
  height: calc(100vh - 278px);
  min-height: 430px;
  overflow-y: auto;
  padding-right: 3px;
}

button.directory-row {
  align-items: center;
  background: rgba(5, 7, 8, .32);
  border: 1px solid rgba(255, 255, 255, .055);
  border-radius: 2px;
  color: rgba(255, 255, 255, .78);
  cursor: pointer;
  display: grid;
  gap: 8px;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  margin-bottom: 4px;
  padding: 8px;
  text-align: left;
  transition: border-color .12s ease, background .12s ease, transform .12s ease;
  width: 100%;
}

button.directory-row:hover {
  background: rgba(195, 155, 73, .08);
  border-color: rgba(195, 155, 73, .3);
  transform: translateX(1px);
}

button.directory-row.active {
  background: linear-gradient(90deg, rgba(195, 155, 73, .22), rgba(195, 155, 73, .05));
  border-color: rgba(226, 184, 94, .46);
  box-shadow: inset 2px 0 0 #e2b85e;
  color: #fff3ca;
}

.directory-row__icon {
  align-items: center;
  background: rgba(195, 155, 73, .1);
  border: 1px solid rgba(195, 155, 73, .14);
  border-radius: 2px;
  color: #c9a65c;
  display: flex;
  height: 28px;
  justify-content: center;
  width: 28px;
}

.directory-row__body {
  min-width: 0;
}

.directory-row__name,
.directory-row__detail {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.directory-row__name {
  font-size: 12px;
  font-weight: 600;
}

.directory-row__detail,
.directory-row__id {
  color: rgba(255, 255, 255, .4);
  font-size: 10px;
}

.directory-state,
.editor-empty {
  align-items: center;
  color: rgba(255, 255, 255, .42);
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  min-height: 260px;
  text-align: center;
}

.directory-pagination {
  background: linear-gradient(180deg, rgba(8, 10, 12, .3), rgba(0, 0, 0, .16));
  border: 1px solid rgba(195, 155, 73, .14);
  border-radius: 2px;
  margin-top: 7px;
  padding: 6px 7px 5px;
}

.directory-pagination__controls {
  align-items: center;
  display: grid;
  gap: 4px;
  grid-template-columns: 27px 27px minmax(80px, 1fr) 27px 27px;
}

.directory-pagination__controls button {
  align-items: center;
  background: rgba(255, 255, 255, .025);
  border: 1px solid rgba(255, 255, 255, .09);
  border-radius: 2px;
  color: rgba(255, 239, 198, .68);
  display: flex;
  font-size: 11px;
  height: 27px;
  justify-content: center;
  padding: 0;
  transition: background .14s ease, border-color .14s ease, color .14s ease;
  width: 27px;
}

.directory-pagination__controls button:not(:disabled):hover,
.directory-pagination__controls button:not(:disabled):focus {
  background: rgba(195, 155, 73, .14);
  border-color: rgba(226, 184, 94, .42);
  color: #ffe6a7;
  outline: none;
}

.directory-pagination__controls button:disabled {
  color: rgba(255, 255, 255, .18);
  cursor: default;
  opacity: .65;
}

.directory-pagination__position {
  align-items: baseline;
  color: rgba(255, 255, 255, .38);
  display: flex;
  font-size: 9px;
  gap: 5px;
  justify-content: center;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.directory-pagination__position strong {
  color: #f1ce7b;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 15px;
  font-weight: 400;
  letter-spacing: 0;
}

.directory-pagination__divider {
  color: rgba(195, 155, 73, .42);
}

.directory-pagination__track {
  background: rgba(255, 255, 255, .055);
  height: 1px;
  margin-top: 5px;
  overflow: hidden;
}

.directory-pagination__track span {
  background: linear-gradient(90deg, #8d692a, #e2b85e);
  box-shadow: 0 0 5px rgba(226, 184, 94, .4);
  display: block;
  height: 100%;
  min-width: 3px;
  transition: width .18s ease;
}

.editor-empty {
  min-height: calc(100vh - 240px);
}

.editor-empty__sigil {
  align-items: center;
  background: radial-gradient(circle, rgba(195, 155, 73, .16), transparent 68%);
  border: 1px solid rgba(195, 155, 73, .2);
  border-radius: 50%;
  color: rgba(232, 197, 121, .6);
  display: flex;
  font-size: 34px;
  height: 82px;
  justify-content: center;
  width: 82px;
}

.editor-empty h3 {
  color: rgba(255, 239, 198, .72);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 20px;
  margin: 4px 0 0;
}

.editor-empty p {
  line-height: 1.5;
  margin: 0;
  max-width: 430px;
}

.editor-header-window {
  margin-bottom: 10px;
}

.editor-header {
  align-items: center;
  display: flex;
  gap: 18px;
  justify-content: space-between;
}

.editor-identity {
  align-items: center;
  display: flex;
  gap: 12px;
  min-width: 0;
}

.editor-identity__icon {
  align-items: center;
  background: linear-gradient(145deg, rgba(195, 155, 73, .24), rgba(42, 31, 16, .4));
  border: 1px solid rgba(226, 184, 94, .34);
  border-radius: 3px;
  color: #e2b85e;
  display: flex;
  flex: 0 0 42px;
  font-size: 21px;
  height: 42px;
  justify-content: center;
}

.editor-identity__eyebrow {
  color: rgba(255, 255, 255, .42);
  font-size: 10px;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.editor-identity h2 {
  color: #f5d993;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 19px;
  margin: 1px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-identity p {
  color: rgba(255, 255, 255, .46);
  font-size: 10px;
  margin: 0;
}

.unsaved-pill {
  background: rgba(255, 193, 7, .12);
  border: 1px solid rgba(255, 193, 7, .18);
  border-radius: 9px;
  color: #ffd86b;
  margin-left: 5px;
  padding: 2px 6px;
}

.unsaved-pill i {
  font-size: 5px;
  vertical-align: 2px;
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: flex-end;
}

.save-button--dirty {
  box-shadow: 0 0 12px rgba(70, 200, 120, .18);
}

.editor-section-heading {
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, .065);
  display: flex;
  gap: 18px;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 10px;
}

.editor-section-heading h3 {
  color: rgba(255, 242, 209, .88);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 17px;
  margin: 2px 0 0;
}

.section-help {
  color: rgba(255, 255, 255, .42);
  font-size: 10px;
  line-height: 1.4;
  max-width: 370px;
  text-align: right;
}

.form-grid {
  display: grid;
  gap: 15px 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-group {
  margin: 0;
}

.form-group label {
  color: rgba(255, 239, 198, .72);
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .05em;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.form-group small,
.faction-rules-table small {
  color: rgba(255, 255, 255, .36);
  display: block;
  font-size: 9px;
  margin-top: 4px;
}

.reference-resolution {
  align-items: baseline;
  display: flex !important;
  gap: 6px;
  min-height: 13px;
}

.reference-resolution strong {
  color: rgba(255, 255, 255, .6);
  font-weight: 600;
}

.reference-resolution code,
.assignment-target__resolution code,
.npc-reference code {
  color: rgba(195, 155, 73, .7);
  font-size: 9px;
}

.form-group--id {
  grid-column: span 1;
}

.form-group--name {
  grid-column: span 1;
}

.form-group--check {
  padding-top: 1px;
}

.table-shell {
  border: 1px solid rgba(255, 255, 255, .07);
  border-radius: 2px;
  overflow-x: auto;
}

.faction-rules-table,
.npc-assignment-table {
  margin: 0;
  min-width: 620px;
  width: 100%;
}

.npc-standing-table {
  min-width: 680px;
  table-layout: fixed;
}

.npc-standing-table th:nth-child(1) {
  width: 24%;
}

.npc-standing-table th:nth-child(2) {
  width: 22%;
}

.npc-standing-table th:nth-child(3) {
  width: 22%;
}

.npc-standing-table th:nth-child(4) {
  width: 24%;
}

.npc-standing-table th:nth-child(5) {
  width: 72px;
}

.faction-rules-table th,
.faction-rules-table td,
.npc-assignment-table th,
.npc-assignment-table td {
  font-size: 11px;
  padding: 7px 8px;
  vertical-align: middle;
}

.faction-rules-table th,
.npc-assignment-table th {
  background: rgba(0, 0, 0, .25);
  color: rgba(255, 239, 198, .62);
  font-size: 9px;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.rule-actions {
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
  width: 72px;
}

.modifier-target-select {
  min-width: 175px;
}

.npc-reaction-select {
  min-width: 0;
}

.standing-update-select {
  min-width: 0;
}

.icon-action {
  align-items: center;
  background: rgba(255, 255, 255, .035);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 2px;
  box-sizing: border-box;
  color: rgba(255, 255, 255, .55);
  cursor: pointer;
  display: inline-flex !important;
  height: 28px;
  justify-content: center;
  line-height: 1 !important;
  padding: 0 !important;
  vertical-align: middle;
  width: 28px;
}

.icon-action + .icon-action {
  margin-left: 3px;
}

.icon-action i {
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  line-height: 1;
  margin: 0;
  pointer-events: none;
  width: 100%;
}

.icon-action:hover,
.icon-action:focus {
  border-color: rgba(195, 155, 73, .4);
  box-shadow: 0 0 0 1px rgba(195, 155, 73, .12);
  color: #f5d993;
  outline: none;
}

.icon-action.danger:hover,
.icon-action.danger:focus {
  border-color: rgba(244, 67, 54, .45);
  box-shadow: 0 0 0 1px rgba(244, 67, 54, .12);
  color: #ff8b82;
}

.modifier-value-editor {
  align-items: center;
  display: flex;
  gap: 6px;
}

.modifier-value-editor input {
  flex: 0 0 90px;
  min-width: 90px;
}

.modifier-preset-select {
  min-width: 165px;
}

.bounds-preview {
  background: linear-gradient(145deg, rgba(39, 96, 68, .13), rgba(0, 0, 0, .18));
  border: 1px solid rgba(125, 219, 161, .18);
  margin-top: 16px;
  padding: 10px 12px 9px;
}

.bounds-preview.invalid,
.bounds-preview.outside {
  background: linear-gradient(145deg, rgba(112, 74, 25, .16), rgba(0, 0, 0, .18));
  border-color: rgba(226, 184, 94, .25);
}

.bounds-preview__header,
.bounds-preview__scale {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.bounds-preview__header {
  color: rgba(255, 239, 198, .62);
  font-size: 9px;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.bounds-preview__header strong {
  color: #7ddba1;
  font-size: 10px;
  letter-spacing: 0;
  text-transform: none;
}

.bounds-preview.invalid .bounds-preview__header strong,
.bounds-preview.outside .bounds-preview__header strong {
  color: #e2b85e;
}

.bounds-preview__track {
  background: linear-gradient(90deg, rgba(255, 139, 130, .32), rgba(226, 184, 94, .32) 50%, rgba(125, 219, 161, .32));
  border: 1px solid rgba(255, 255, 255, .08);
  height: 7px;
  margin: 9px 0 6px;
  position: relative;
}

.bounds-preview__marker {
  background: #fff2c9;
  border: 2px solid #a97722;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(226, 184, 94, .5);
  height: 13px;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 13px;
}

.bounds-preview__scale {
  color: rgba(255, 255, 255, .38);
  font-size: 9px;
}

.bounds-preview__scale b {
  color: rgba(255, 242, 209, .78);
  font-weight: 600;
}

.table-empty,
.inline-empty {
  align-items: center;
  color: rgba(255, 255, 255, .42);
  display: flex;
  gap: 8px;
  justify-content: center;
  min-height: 150px;
  padding: 18px;
}

.inline-empty {
  background: rgba(0, 0, 0, .15);
  border: 1px dashed rgba(195, 155, 73, .2);
  min-height: 100px;
}

.reference-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-bottom: 14px;
}

.reference-card {
  align-items: center;
  background: linear-gradient(145deg, rgba(255, 255, 255, .045), rgba(0, 0, 0, .1));
  border: 1px solid rgba(255, 255, 255, .07);
  display: flex;
  gap: 8px;
  min-height: 58px;
  padding: 8px;
}

.reference-card__icon {
  color: #c9a65c;
  font-size: 15px;
}

.reference-card strong,
.reference-card small {
  display: block;
}

.reference-card strong {
  color: #fff0c6;
  font-size: 16px;
}

.reference-card small {
  color: rgba(255, 255, 255, .42);
  font-size: 8px;
  line-height: 1.25;
  text-transform: uppercase;
}

.safe-status {
  color: #ffb174;
  font-size: 10px;
}

.safe-status.clear {
  color: #7ddba1;
}

.usage-columns {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

::v-deep .usage-list {
  background: rgba(0, 0, 0, .13);
  border: 1px solid rgba(255, 255, 255, .065);
  min-height: 130px;
}

::v-deep .usage-list h4 {
  border-bottom: 1px solid rgba(255, 255, 255, .06);
  color: rgba(255, 239, 198, .7);
  font-size: 10px;
  margin: 0;
  padding: 8px;
  text-transform: uppercase;
}

::v-deep .usage-list h4 i {
  color: #c9a65c;
  margin-right: 6px;
}

::v-deep .usage-list h4 span {
  background: rgba(195, 155, 73, .12);
  border-radius: 8px;
  color: #e5c373;
  float: right;
  padding: 1px 5px;
}

::v-deep .usage-list__rows {
  max-height: 210px;
  overflow-y: auto;
}

::v-deep .usage-list__row {
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, .04);
  display: flex;
  gap: 8px;
  justify-content: space-between;
  padding: 7px 8px;
}

::v-deep .usage-list__row strong,
::v-deep .usage-list__row small {
  display: block;
}

::v-deep .usage-list__row strong {
  color: rgba(255, 255, 255, .72);
  font-size: 10px;
}

::v-deep .usage-list__row small,
::v-deep .usage-list__row code {
  color: rgba(255, 255, 255, .35);
  font-size: 8px;
}

::v-deep .usage-list__empty {
  color: rgba(255, 255, 255, .3);
  font-size: 10px;
  padding: 30px 8px;
  text-align: center;
}

.safety-note {
  background: rgba(65, 120, 160, .08);
  border: 1px solid rgba(110, 170, 210, .15);
  color: rgba(190, 220, 240, .62);
  font-size: 9px;
  margin-top: 10px;
  padding: 8px;
}

.safety-note i {
  margin-right: 5px;
}

.assignment-bar {
  align-items: flex-end;
  background: rgba(0, 0, 0, .16);
  border: 1px solid rgba(255, 255, 255, .06);
  display: flex;
  gap: 12px;
  margin-bottom: 9px;
  padding: 8px;
}

.select-all {
  color: rgba(255, 255, 255, .58);
  font-size: 10px;
  margin: 0 auto 6px 0;
}

.select-all input {
  margin-right: 5px;
  vertical-align: -1px;
}

.assignment-target {
  min-width: 190px;
}

.assignment-target label {
  color: rgba(255, 239, 198, .58);
  display: block;
  font-size: 9px;
  margin-bottom: 3px;
  text-transform: uppercase;
}

.assignment-target__resolution {
  color: rgba(255, 255, 255, .42);
  display: block;
  font-size: 9px;
  margin-top: 4px;
}

.assignment-check {
  text-align: center;
  width: 34px;
}

.muted-cell {
  color: rgba(255, 255, 255, .38);
}

.npc-reference {
  display: inline-grid;
  gap: 2px;
  line-height: 1.15;
  min-width: 86px;
}

.npc-reference strong {
  color: rgba(255, 255, 255, .72);
  font-size: 10px;
  font-weight: 600;
}

.faction-notification {
  align-items: center;
  background: rgba(19, 67, 44, .96);
  border: 1px solid rgba(125, 219, 161, .35);
  bottom: 22px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, .38);
  color: #caffdd;
  display: flex;
  font-size: 11px;
  gap: 7px;
  max-width: 440px;
  padding: 10px 13px;
  position: fixed;
  right: 24px;
  z-index: 3000;
}

.faction-notification.error {
  background: rgba(92, 31, 28, .97);
  border-color: rgba(255, 139, 130, .4);
  color: #ffd0cc;
}

@media (max-width: 1180px) {
  .reference-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .usage-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 991px) {
  .faction-editor-page {
    padding: 12px !important;
  }

  .faction-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .workspace-switch {
    align-self: flex-start;
  }

  .faction-workspace {
    grid-template-columns: 1fr;
  }

  .directory-list {
    height: 310px;
    min-height: 310px;
  }

  .editor-empty {
    min-height: 330px;
  }
}

@media (max-width: 640px) {
  .workspace-switch {
    width: 100%;
  }

  .workspace-switch__button {
    flex: 1;
  }

  .editor-header,
  .editor-section-heading,
  .assignment-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .editor-actions {
    justify-content: flex-start;
  }

  .section-help {
    max-width: none;
    text-align: left;
  }

  .form-grid,
  .reference-grid {
    grid-template-columns: 1fr;
  }

  .assignment-target {
    min-width: 0;
  }

  .rule-actions {
    width: 66px;
  }

  .icon-action {
    height: 26px;
    width: 26px;
  }
}
</style>
