<template>
  <content-area class="spire-editor-page aura-editor-page">
    <div class="spire-editor-toolbar">
      <div>
        <div class="spire-editor-kicker">Content tools · spells &amp; abilities</div>
        <h1 class="spire-editor-title">
          <i class="ra ra-burning-embers mr-2"></i>Aura Editor
        </h1>
        <p class="spire-editor-subtitle">
          Configure aura entities, linked spells, targeting behavior, and runtime timing in one workspace.
        </p>
      </div>
      <div class="spire-editor-summary" aria-label="Aura directory summary">
        <span><strong>{{ auras.length }}</strong> auras</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ linkedSpellCount }}</strong> linked spells</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ linkedNpcCount }}</strong> entity templates</span>
      </div>
    </div>

    <div class="spire-editor-workspace">
      <aside class="spire-editor-directory">
        <eq-window title="Auras">
          <div class="spire-editor-directory-controls">
            <div class="spire-editor-search">
              <i class="fa fa-search"></i>
              <input
                id="aura-directory-search"
                v-model.trim="search"
                class="form-control form-control-sm"
                placeholder="Search aura, spell, NPC, or ID…"
                @input="currentPage = 1"
              >
              <button
                v-if="search"
                class="spire-editor-search-clear"
                type="button"
                aria-label="Clear aura search"
                @click="search = ''; currentPage = 1"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <b-button
              size="sm"
              variant="outline-warning"
              data-testid="aura-new"
              @click="createDraft()"
            >
              <i class="fa fa-plus mr-1"></i>New
            </b-button>
          </div>

          <div class="spire-editor-filter" role="group" aria-label="Aura type filter">
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
            <span>{{ filteredAuras.length }} records</span>
            <span v-if="loading"><i class="fa fa-spinner fa-spin mr-1"></i>Refreshing</span>
            <span v-else>Page {{ currentPage }}</span>
          </div>

          <div class="spire-editor-directory-list" data-testid="aura-directory">
            <button
              v-for="aura in pagedAuras"
              :key="'aura-' + aura.type"
              class="spire-editor-directory-row"
              :class="{ active: Number(selectedType) === Number(aura.type) && !isCreating }"
              type="button"
              @click="selectAura(aura.type)"
            >
              <span class="spire-editor-directory-icon">
                <span
                  v-if="aura.spells_new && Number(aura.spells_new.new_icon) >= 0"
                  :class="'spell-' + aura.spells_new.new_icon + '-20'"
                ></span>
                <i v-else class="ra ra-burning-embers"></i>
              </span>
              <span class="spire-editor-directory-body">
                <span class="spire-editor-directory-name">{{ cleanName(aura.name) }}</span>
                <span class="spire-editor-directory-detail">
                  {{ auraTypeLabel(aura.aura_type) }}
                  · {{ aura.spells_new ? aura.spells_new.name : 'Spell #' + aura.spell_id }}
                </span>
              </span>
              <span class="spire-editor-directory-aside">#{{ aura.type }}</span>
            </button>

            <div v-if="loading && !auras.length" class="spire-editor-directory-state">
              <i class="fa fa-spinner fa-spin"></i>
              <span>Loading real aura data…</span>
            </div>
            <div v-else-if="!pagedAuras.length" class="spire-editor-directory-state">
              <i class="fa fa-search"></i>
              <span>No auras match these filters.</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="createDraft()">
                Create an aura
              </button>
            </div>
          </div>

          <nav
            v-if="totalPages > 1"
            class="spire-editor-pagination"
            aria-label="Aura directory pages"
          >
            <button
              type="button"
              aria-label="Previous aura page"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            >
              <i class="fa fa-angle-left"></i>
            </button>
            <span><strong>{{ currentPage }}</strong> / {{ totalPages }}</span>
            <button
              type="button"
              aria-label="Next aura page"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            >
              <i class="fa fa-angle-right"></i>
            </button>
          </nav>
        </eq-window>
      </aside>

      <main class="spire-editor-inspector">
        <eq-window v-if="!editModel && !loading" title="Aura Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="ra ra-burning-embers"></i></div>
            <h3>Select an aura</h3>
            <p>Inspect its spell and entity context, then edit every server-supported aura setting in place.</p>
            <b-button size="sm" variant="outline-warning" @click="createDraft()">
              <i class="fa fa-plus mr-1"></i>Create new
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="loading && !editModel" title="Aura Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading aura context…</h3>
          </div>
        </eq-window>

        <div v-if="editModel" data-testid="aura-inspector">
          <eq-window title="Aura" class="mb-2">
            <div class="spire-editor-header">
              <div class="spire-editor-identity">
                <span class="spire-editor-identity-icon">
                  <span
                    v-if="selectedSpell && Number(selectedSpell.new_icon) >= 0"
                    :class="'spell-' + selectedSpell.new_icon + '-40'"
                  ></span>
                  <i v-else class="ra ra-burning-embers"></i>
                </span>
                <div>
                  <div class="spire-editor-eyebrow">
                    {{ isCreating ? (copiedFromType ? 'Copied aura draft' : 'New aura draft') : 'Aura #' + editModel.type }}
                    <span v-if="hasUnsavedChanges" class="spire-editor-unsaved">
                      <i class="fa fa-circle"></i> Unsaved
                    </span>
                  </div>
                  <h2>{{ cleanName(editModel.name) || 'Untitled aura' }}</h2>
                  <p>
                    {{ auraTypeLabel(editModel.aura_type) }}
                    · {{ movementLabel(editModel.movement) }}
                    · {{ Number(editModel.distance || 0) }} unit radius
                  </p>
                </div>
              </div>
              <div class="spire-editor-actions">
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-warning"
                  data-testid="aura-copy"
                  @click="copyAura"
                >
                  <i class="fa fa-copy mr-1"></i>Copy
                </b-button>
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-danger"
                  data-testid="aura-delete"
                  @click="deleteAura"
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
                  data-testid="aura-save"
                  :disabled="!canSave || saving"
                  @click="saveAura"
                >
                  <i :class="saving ? 'fa fa-spinner fa-spin' : 'fa fa-save'" class="mr-1"></i>
                  {{ saving ? 'Saving' : 'Save' }}
                </b-button>
              </div>
            </div>
          </eq-window>

          <eq-window title="Editor">
            <div class="spire-editor-tabs" role="tablist" aria-label="Aura editor sections">
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

            <section v-if="selectedTab === 'Overview'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-section-kicker">Configuration</div>
                  <h3>Aura identity and timing</h3>
                </div>
                <small>Only fields supported by the live EQEmu <code>auras</code> schema are editable.</small>
              </div>

              <div class="spire-editor-grid spire-editor-grid--three">
                <div class="spire-editor-field">
                  <label for="aura-type-id">Aura ID</label>
                  <input
                    id="aura-type-id"
                    v-model.number="editModel.type"
                    class="form-control form-control-sm"
                    type="number"
                    min="1"
                    :readonly="!isCreating"
                  >
                  <span class="spire-editor-field-help">Stable primary identifier. Existing IDs cannot be renamed.</span>
                </div>
                <div class="spire-editor-field" style="grid-column: span 2;">
                  <label for="aura-name">Aura name</label>
                  <input
                    id="aura-name"
                    v-model.trim="editModel.name"
                    class="form-control form-control-sm"
                    maxlength="64"
                    placeholder="Aura display name"
                  >
                  <span class="spire-editor-field-help">Underscores are preserved in data and rendered as spaces in previews.</span>
                </div>
                <div class="spire-editor-field">
                  <label for="aura-distance">Effect radius <span>{{ editModel.distance }} units</span></label>
                  <input
                    id="aura-distance"
                    v-model.number="editModel.distance"
                    class="form-control form-control-sm"
                    type="number"
                    min="0"
                    max="10000"
                  >
                  <span class="spire-editor-field-help">Drag the established Spire range visualizer below or enter an exact server-unit value.</span>
                </div>
                <div class="spire-editor-field">
                  <label for="aura-duration">Lifetime in seconds</label>
                  <input
                    id="aura-duration"
                    v-model.number="editModel.duration"
                    class="form-control form-control-sm"
                    type="number"
                    min="0"
                  >
                  <span class="spire-editor-field-help">{{ durationSummary }}</span>
                </div>
                <div class="spire-editor-field">
                  <label for="aura-cast-time">Aura cast time (seconds)</label>
                  <input
                    id="aura-cast-time"
                    v-model.number="editModel.cast_time"
                    class="form-control form-control-sm"
                    type="number"
                    min="-1"
                  >
                  <loader-cast-bar-timer
                    class="aura-cast-time-simulator__bar"
                    color="#FF00FF"
                    data-testid="aura-cast-time-simulator"
                    aria-label="Aura cast-time simulator"
                    :data-time-ms="auraCastTimeMs"
                    :time-ms="auraCastTimeMs"
                  />
                  <div class="aura-cast-time-simulator__caption">
                    <span>Cast-time simulator</span>
                    <strong>{{ auraCastTimeSummary }}</strong>
                  </div>
                  <span class="spire-editor-field-help">Stored in whole seconds. Non-positive and legacy values remain editable and show a dormant preview.</span>
                </div>
                <div class="spire-editor-field">
                  <label for="aura-icon">Aura icon value</label>
                  <input
                    id="aura-icon"
                    v-model.number="editModel.icon"
                    class="form-control form-control-sm"
                    type="number"
                    min="-1"
                  >
                  <span class="spire-editor-field-help">This is the aura table icon value, separate from the linked spell icon.</span>
                </div>
              </div>

              <div class="spire-editor-grid spire-editor-grid--two mt-3">
                <div class="spire-editor-range-visualizer" aria-label="Aura effect radius visualizer">
                  <div class="spire-editor-context-label mb-2">Range visualizer · server units</div>
                  <range-visualizer
                    :unit-marker.sync="editModel.distance"
                    @input="editModel.distance = Number($event)"
                  />
                </div>
                <div class="spire-editor-context-card spire-editor-context-card--gold">
                  <div class="spire-editor-context-label">Runtime summary</div>
                  <h4>{{ auraTypeLabel(editModel.aura_type) }}</h4>
                  <p>{{ auraTypeDescription(editModel.aura_type) }}</p>
                  <div class="spire-editor-metric-row mt-3">
                    <div class="spire-editor-metric">
                      <span>Radius</span>
                      <strong>{{ editModel.distance || 0 }}</strong>
                    </div>
                    <div class="spire-editor-metric">
                      <span>Duration</span>
                      <strong>{{ compactDuration(editModel.duration) }}</strong>
                    </div>
                    <div class="spire-editor-metric">
                      <span>Spawn</span>
                      <strong>{{ editModel.spawn_type }}</strong>
                    </div>
                    <div class="spire-editor-metric">
                      <span>Move</span>
                      <strong>{{ editModel.movement }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section v-if="selectedTab === 'Behavior'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-section-kicker">Server semantics</div>
                  <h3>Targeting, visibility, and movement</h3>
                </div>
                <small>Option names come from the official EQEmu aura type definitions.</small>
              </div>

              <div class="spire-editor-grid spire-editor-grid--three">
                <div class="spire-editor-field">
                  <label for="aura-aura-type">Aura type</label>
                  <select id="aura-aura-type" v-model.number="editModel.aura_type" class="form-control form-control-sm">
                    <option v-for="option in auraTypes" :key="option.value" :value="option.value">
                      {{ option.value }}) {{ option.label }}
                    </option>
                  </select>
                  <span class="spire-editor-field-help">{{ auraTypeDescription(editModel.aura_type) }}</span>
                </div>
                <div class="spire-editor-field">
                  <label for="aura-spawn-type">Who sees the aura entity</label>
                  <select id="aura-spawn-type" v-model.number="editModel.spawn_type" class="form-control form-control-sm">
                    <option v-for="option in spawnTypes" :key="option.value" :value="option.value">
                      {{ option.value }}) {{ option.label }}
                    </option>
                  </select>
                  <span class="spire-editor-field-help">{{ spawnTypeDescription(editModel.spawn_type) }}</span>
                </div>
                <div class="spire-editor-field">
                  <label for="aura-movement">Movement</label>
                  <select id="aura-movement" v-model.number="editModel.movement" class="form-control form-control-sm">
                    <option v-for="option in movementTypes" :key="option.value" :value="option.value">
                      {{ option.value }}) {{ option.label }}
                    </option>
                  </select>
                  <span class="spire-editor-field-help">{{ movementDescription(editModel.movement) }}</span>
                </div>
              </div>

              <div class="spire-editor-grid spire-editor-grid--three mt-3">
                <button
                  v-for="option in auraTypes"
                  :key="'meaning-' + option.value"
                  type="button"
                  class="spire-editor-context-card text-left"
                  :class="{ 'spire-editor-context-card--gold': Number(editModel.aura_type) === option.value }"
                  @click="editModel.aura_type = option.value"
                >
                  <div class="spire-editor-context-label">Type {{ option.value }}</div>
                  <h4>{{ option.label }}</h4>
                  <p>{{ option.description }}</p>
                </button>
              </div>
            </section>

            <section v-if="selectedTab === 'Linked Content'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-section-kicker">References</div>
                  <h3>Effect spell and aura entity template</h3>
                </div>
                <small>Both references remain nearby so an aura can be understood without leaving this workspace.</small>
              </div>

              <div class="spire-editor-grid spire-editor-grid--two">
                <div>
                  <div class="spire-editor-field">
                    <label for="aura-spell-search">Linked effect spell</label>
                    <div class="spire-editor-search spire-editor-selector">
                      <i class="fa fa-search"></i>
                      <input
                        id="aura-spell-search"
                        v-model.trim="spellSearch"
                        class="form-control form-control-sm"
                        placeholder="Search spell name or exact ID…"
                        autocomplete="off"
                        @input="queueSpellSearch"
                        @keyup.esc="spellResults = []"
                      >
                      <div v-if="spellResults.length || searchingSpells" class="spire-editor-selector-results">
                        <button
                          v-for="spell in spellResults"
                          :key="'spell-result-' + spell.id"
                          type="button"
                          @click="selectSpell(spell)"
                        >
                          <span :class="'spell-' + spell.new_icon + '-20'"></span>
                          <span>{{ cleanName(spell.name) }}</span>
                          <small>#{{ spell.id }}</small>
                        </button>
                        <div v-if="searchingSpells" class="p-2 text-center text-muted small">
                          <i class="fa fa-spinner fa-spin mr-1"></i>Searching spells…
                        </div>
                      </div>
                    </div>
                    <span class="spire-editor-field-help">Changing this reference does not modify the spell itself.</span>
                  </div>

                  <div v-if="selectedSpell" class="spire-editor-linked-record">
                    <span :class="'spell-' + selectedSpell.new_icon + '-40'"></span>
                    <span class="spire-editor-linked-record__body">
                      <strong>{{ cleanName(selectedSpell.name) }}</strong>
                      <small>Spell #{{ selectedSpell.id }} · {{ spellDisposition }}</small>
                    </span>
                    <router-link
                      :to="'/spell/' + selectedSpell.id"
                      class="btn btn-sm btn-outline-secondary"
                      title="Open the linked spell editor"
                    >
                      Spell Editor
                    </router-link>
                  </div>

                  <div v-if="selectedSpell" class="spire-editor-effect-list">
                    <div
                      v-for="effect in spellEffects"
                      :key="'effect-' + effect.slot"
                      class="spire-editor-effect-row"
                    >
                      <span>{{ effect.slot }}</span>
                      <strong>{{ effect.name }}</strong>
                      <small>{{ effect.value }}</small>
                    </div>
                    <div v-if="!spellEffects.length" class="spire-editor-context-card">
                      <p>No active spell effects were found on the selected spell.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="spire-editor-field">
                    <label for="aura-npc-search">Aura entity NPC template</label>
                    <div class="spire-editor-search spire-editor-selector">
                      <i class="fa fa-search"></i>
                      <input
                        id="aura-npc-search"
                        v-model.trim="npcSearch"
                        class="form-control form-control-sm"
                        placeholder="Search NPC template name or exact ID…"
                        autocomplete="off"
                        @input="queueNpcSearch"
                        @keyup.esc="npcResults = []"
                      >
                      <div v-if="npcResults.length || searchingNpcs" class="spire-editor-selector-results">
                        <button
                          v-for="npc in npcResults"
                          :key="'npc-result-' + npc.id"
                          type="button"
                          @click="selectNpc(npc)"
                        >
                          <i class="ra ra-player"></i>
                          <span>{{ cleanName(npc.name) }}</span>
                          <small>#{{ npc.id }}</small>
                        </button>
                        <div v-if="searchingNpcs" class="p-2 text-center text-muted small">
                          <i class="fa fa-spinner fa-spin mr-1"></i>Searching NPC templates…
                        </div>
                      </div>
                    </div>
                    <span class="spire-editor-field-help">The server spawns this NPC template as the aura entity.</span>
                  </div>

                  <div v-if="selectedNpc" class="spire-editor-linked-record">
                    <i class="ra ra-player fa-2x text-warning"></i>
                    <span class="spire-editor-linked-record__body">
                      <strong>{{ cleanName(selectedNpc.name) }}</strong>
                      <small>
                        NPC #{{ selectedNpc.id }}
                        · {{ raceName(selectedNpc.race) }}
                        · {{ className(selectedNpc.class) }}
                        · level {{ selectedNpc.level || 0 }}
                      </small>
                    </span>
                    <router-link
                      :to="'/npc/' + selectedNpc.id"
                      class="btn btn-sm btn-outline-secondary"
                      title="Open the linked NPC editor"
                    >
                      NPC Editor
                    </router-link>
                  </div>

                  <div v-else class="spire-editor-context-card mt-2">
                    <div class="spire-editor-context-label">Missing entity context</div>
                    <h4>NPC template #{{ editModel.npc_type || 0 }}</h4>
                    <p>The referenced NPC could not be loaded. Search above to preserve or replace this legacy value.</p>
                  </div>

                  <div v-if="selectedSpell" class="spire-editor-context-card mt-3">
                    <div class="spire-editor-context-label">Spell behavior</div>
                    <h4>{{ cleanName(selectedSpell.name) }}</h4>
                    <p>
                      Target type {{ selectedSpell.targettype }},
                      {{ Number(selectedSpell.range || 0) }} range,
                      {{ Number(selectedSpell.aoerange || 0) }} AE range,
                      {{ selectedSpell.nodispell ? 'not dispellable' : 'dispellable' }}.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section v-if="selectedTab === 'Safety'" class="spire-editor-panel">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-section-kicker">Validation</div>
                  <h3>Record health and destructive-action context</h3>
                </div>
                <small>Deleting an aura leaves its referenced spell and NPC template intact.</small>
              </div>

              <div class="spire-editor-metric-row">
                <div class="spire-editor-metric">
                  <span>Spell reference</span>
                  <strong>{{ selectedSpell ? 'OK' : 'Missing' }}</strong>
                </div>
                <div class="spire-editor-metric">
                  <span>NPC template</span>
                  <strong>{{ selectedNpc ? 'OK' : 'Missing' }}</strong>
                </div>
                <div class="spire-editor-metric">
                  <span>Radius</span>
                  <strong>{{ editModel.distance || 0 }}</strong>
                </div>
                <div class="spire-editor-metric">
                  <span>Lifetime</span>
                  <strong>{{ compactDuration(editModel.duration) }}</strong>
                </div>
              </div>

              <div class="spire-editor-grid spire-editor-grid--two">
                <div class="spire-editor-context-card">
                  <div class="spire-editor-context-label">Schema checks</div>
                  <h4>{{ validationMessages.length ? 'Review required' : 'Ready to save' }}</h4>
                  <div v-if="validationMessages.length" class="spire-editor-effect-list">
                    <div
                      v-for="message in validationMessages"
                      :key="message"
                      class="spire-editor-effect-row"
                    >
                      <span><i class="fa fa-exclamation-triangle"></i></span>
                      <strong>{{ message }}</strong>
                      <small>Required</small>
                    </div>
                  </div>
                  <p v-else>Identifiers, references, enum values, radius, and timing are valid.</p>
                </div>
                <div class="spire-editor-context-card spire-editor-context-card--gold">
                  <div class="spire-editor-context-label">Deletion scope</div>
                  <h4>Only aura #{{ editModel.type }} is removed</h4>
                  <p>
                    Spell #{{ editModel.spell_id }} and NPC template #{{ editModel.npc_type }} are shared records and are never deleted here.
                  </p>
                </div>
              </div>

              <div v-if="!isCreating" class="spire-editor-danger">
                <strong>Safe destructive action</strong>
                <p>Delete requires explicit confirmation naming this aura. Use Copy when you need a similar configuration.</p>
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
  import { AuraApi } from '../../app/api/api/aura-api'
  import { NpcTypeApi, SpellsNewApi } from '../../app/api/api'
  import { SpireApi } from '../../app/api/spire-api'
  import { SpireQueryBuilder } from '../../app/api/spire-query-builder'
  import { DB_SPELL_EFFECTS } from '../../app/constants/eq-spell-constants'
  import { DB_CLASSES } from '../../app/constants/eq-classes-constants'
  import { DB_RACE_NAMES } from '../../app/constants/eq-races-constants'
  import LoaderCastBarTimer from '../../components/LoaderCastBarTimer'
  import RangeVisualizer from '../../components/tools/RangeVisualizer'

  const AURA_FIELDS = [
    'type', 'npc_type', 'name', 'spell_id', 'distance', 'aura_type',
    'spawn_type', 'movement', 'duration', 'icon', 'cast_time'
  ]

  const AURA_TYPES = [
    { value: 0, label: 'All friendlies', description: 'Applies the linked spell to friendly entities inside the aura radius.' },
    { value: 1, label: 'Group members', description: 'Applies the linked spell to members of the owner’s group.' },
    { value: 2, label: 'Group pets', description: 'Applies the linked spell to pets owned by group members.' },
    { value: 3, label: 'Totem', description: 'Creates a stationary or following totem-style aura entity.' },
    { value: 4, label: 'Enter trap', description: 'Triggers when an eligible entity enters the configured radius.' },
    { value: 5, label: 'Exit trap', description: 'Triggers when an eligible entity leaves the configured radius.' },
    { value: 6, label: 'Fully scripted', description: 'Delegates behavior to server-side scripting.' }
  ]

  const SPAWN_TYPES = [
    { value: 0, label: 'Group members', description: 'The aura entity is visible to group members.' },
    { value: 1, label: 'Everyone', description: 'The aura entity is visible to every nearby client.' },
    { value: 2, label: 'No one', description: 'The aura entity remains hidden from clients.' }
  ]

  const MOVEMENT_TYPES = [
    { value: 0, label: 'Follow', description: 'The aura entity follows its owner.' },
    { value: 1, label: 'Stationary', description: 'The aura remains at its spawn location.' },
    { value: 2, label: 'Pathing', description: 'The aura entity uses NPC pathing behavior.' }
  ]

  function clone (value) {
    return value == null ? value : JSON.parse(JSON.stringify(value))
  }

  function pickAura (record) {
    const result = {}
    AURA_FIELDS.forEach(field => {
      result[field] = field === 'name' ? String(record[field] || '') : Number(record[field] || 0)
    })
    return result
  }

  export default {
    name: 'AuraEditor',
    components: { ContentArea, EqWindow, LoaderCastBarTimer, RangeVisualizer },
    data () {
      return {
        auras: [],
        npcMap: {},
        loading: false,
        saving: false,
        selectedType: null,
        editModel: null,
        originalModel: null,
        selectedSpell: null,
        selectedNpc: null,
        isCreating: false,
        copiedFromType: null,
        search: '',
        directoryFilter: 'all',
        currentPage: 1,
        pageSize: 12,
        selectedTab: this.$route.query.tab || 'Overview',
        tabs: ['Overview', 'Behavior', 'Linked Content', 'Safety'],
        directoryFilters: [
          { value: 'all', label: 'All' },
          { value: 'support', label: 'Auras' },
          { value: 'world', label: 'World' },
          { value: 'scripted', label: 'Scripted' }
        ],
        auraTypes: AURA_TYPES,
        spawnTypes: SPAWN_TYPES,
        movementTypes: MOVEMENT_TYPES,
        spellSearch: '',
        spellResults: [],
        searchingSpells: false,
        spellSearchTimer: null,
        npcSearch: '',
        npcResults: [],
        searchingNpcs: false,
        npcSearchTimer: null,
        notification: { message: '', type: 'success', timer: null }
      }
    },
    computed: {
      filteredAuras () {
        const needle = this.search.toLowerCase()
        return this.auras.filter(aura => {
          const type = Number(aura.aura_type)
          const matchesGroup =
            this.directoryFilter === 'all' ||
            (this.directoryFilter === 'support' && type >= 0 && type <= 2) ||
            (this.directoryFilter === 'world' && type >= 3 && type <= 5) ||
            (this.directoryFilter === 'scripted' && type === 6)
          if (!matchesGroup) return false
          if (!needle) return true
          const npc = this.npcMap[Number(aura.npc_type)]
          return [
            aura.type,
            aura.name,
            aura.spell_id,
            aura.spells_new && aura.spells_new.name,
            aura.npc_type,
            npc && npc.name,
            this.auraTypeLabel(aura.aura_type)
          ].some(value => String(value || '').toLowerCase().includes(needle))
        })
      },
      totalPages () {
        return Math.max(1, Math.ceil(this.filteredAuras.length / this.pageSize))
      },
      pagedAuras () {
        const page = Math.min(this.currentPage, this.totalPages)
        const start = (page - 1) * this.pageSize
        return this.filteredAuras.slice(start, start + this.pageSize)
      },
      linkedSpellCount () {
        return this.auras.filter(aura => aura.spells_new).length
      },
      linkedNpcCount () {
        return this.auras.filter(aura => this.npcMap[Number(aura.npc_type)]).length
      },
      hasUnsavedChanges () {
        return Boolean(this.editModel && JSON.stringify(pickAura(this.editModel)) !== JSON.stringify(pickAura(this.originalModel || {})))
      },
      validationMessages () {
        if (!this.editModel) return ['No aura is selected.']
        const messages = []
        const duplicate = this.auras.some(aura =>
          Number(aura.type) === Number(this.editModel.type) &&
          (this.isCreating || Number(aura.type) !== Number(this.originalModel.type))
        )
        if (Number(this.editModel.type) <= 0) messages.push('Aura ID must be greater than zero.')
        if (duplicate) messages.push('Aura ID is already in use.')
        if (!String(this.editModel.name || '').trim()) messages.push('Aura name is required.')
        if (Number(this.editModel.spell_id) <= 0) messages.push('A linked effect spell is required.')
        if (Number(this.editModel.npc_type) <= 0) messages.push('An aura entity NPC template is required.')
        if (!AURA_TYPES.some(option => option.value === Number(this.editModel.aura_type))) messages.push('Aura type is not recognized.')
        if (!SPAWN_TYPES.some(option => option.value === Number(this.editModel.spawn_type))) messages.push('Spawn visibility is not recognized.')
        if (!MOVEMENT_TYPES.some(option => option.value === Number(this.editModel.movement))) messages.push('Movement type is not recognized.')
        if (Number(this.editModel.distance) < 0) messages.push('Effect radius cannot be negative.')
        if (Number(this.editModel.duration) < 0) messages.push('Duration cannot be negative.')
        return messages
      },
      canSave () {
        return this.hasUnsavedChanges && this.validationMessages.length === 0
      },
      durationSummary () {
        if (!this.editModel) return ''
        return `${this.compactDuration(this.editModel.duration)} runtime lifetime.`
      },
      auraCastTimeMs () {
        const seconds = Number(this.editModel && this.editModel.cast_time)
        return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0
      },
      auraCastTimeSummary () {
        const seconds = Number(this.editModel && this.editModel.cast_time)
        if (!Number.isFinite(seconds)) return 'No timer'
        if (seconds < 0) return `Legacy ${seconds}`
        if (seconds === 0) return 'No timer'
        return `${seconds} sec timer`
      },
      spellDisposition () {
        if (!this.selectedSpell) return ''
        if (Number(this.selectedSpell.good_effect) === 0) return 'Detrimental'
        if (Number(this.selectedSpell.good_effect) === 2) return 'Beneficial group'
        return 'Beneficial'
      },
      spellEffects () {
        if (!this.selectedSpell) return []
        const effects = []
        for (let slot = 1; slot <= 12; slot++) {
          const id = Number(this.selectedSpell[`effectid_${slot}`])
          if (!Number.isFinite(id) || id < 0 || id === 254) continue
          effects.push({
            slot,
            name: DB_SPELL_EFFECTS[id] || `Unknown SPA ${id}`,
            value: Number(this.selectedSpell[`effect_base_value_${slot}`] || 0).toLocaleString()
          })
        }
        return effects
      }
    },
    watch: {
      '$route.query.aura' (value) {
        const type = Number(value)
        if (type && type !== Number(this.selectedType)) this.selectAura(type, false)
      }
    },
    async created () {
      window.addEventListener('keydown', this.onEditorKeydown)
      window.addEventListener('beforeunload', this.onBeforeUnload)
      await this.loadAuras()
    },
    beforeDestroy () {
      window.removeEventListener('keydown', this.onEditorKeydown)
      window.removeEventListener('beforeunload', this.onBeforeUnload)
      window.clearTimeout(this.spellSearchTimer)
      window.clearTimeout(this.npcSearchTimer)
      window.clearTimeout(this.notification.timer)
    },
    beforeRouteLeave (to, from, next) {
      if (!this.hasUnsavedChanges || window.confirm('Discard unsaved aura changes?')) next()
      else next(false)
    },
    methods: {
      async loadAuras () {
        this.loading = true
        try {
          const builder = new SpireQueryBuilder()
          builder.includes(['SpellsNew']).limit(1000).orderBy(['type']).orderDirection('asc')
          const response = await (new AuraApi(...SpireApi.cfg())).listAuras(builder.get())
          this.auras = response.data || []
          await this.loadAuraNpcs()

          const routeType = Number(this.$route.query.aura)
          const desired = routeType && this.auras.some(aura => Number(aura.type) === routeType)
            ? routeType
            : (this.auras[0] && Number(this.auras[0].type))
          if (desired) await this.selectAura(desired, false)
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to load auras'), 'error')
        } finally {
          this.loading = false
        }
      },
      async loadAuraNpcs () {
        const ids = [...new Set(this.auras.map(aura => Number(aura.npc_type)).filter(Boolean))]
        if (!ids.length) return
        try {
          const response = await (new NpcTypeApi(...SpireApi.cfg())).getNpcTypesBulk({ body: { ids } })
          const map = {}
          ;(response.data || []).forEach(npc => { map[Number(npc.id)] = npc })
          this.npcMap = map
        } catch (error) {
          this.npcMap = {}
        }
      },
      async selectAura (type, updateRoute = true) {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved aura changes?')) return
        const aura = this.auras.find(record => Number(record.type) === Number(type))
        if (!aura) return
        this.isCreating = false
        this.copiedFromType = null
        this.selectedType = Number(aura.type)
        this.editModel = pickAura(aura)
        this.originalModel = clone(this.editModel)
        this.selectedSpell = clone(aura.spells_new || null)
        this.selectedNpc = clone(this.npcMap[Number(aura.npc_type)] || null)
        this.spellSearch = ''
        this.spellResults = []
        this.npcSearch = ''
        this.npcResults = []
        if (updateRoute) await this.updateRoute()
      },
      createDraft (source = null) {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved aura changes?')) return
        const maxType = this.auras.reduce((max, aura) => Math.max(max, Number(aura.type) || 0), 0)
        this.isCreating = true
        this.copiedFromType = source ? Number(source.type) : null
        this.selectedType = null
        this.editModel = source
          ? { ...pickAura(source), type: maxType + 1, name: `${source.name}_Copy` }
          : {
            type: maxType + 1,
            npc_type: 0,
            name: '',
            spell_id: 0,
            distance: 60,
            aura_type: 1,
            spawn_type: 0,
            movement: 0,
            duration: 5400,
            icon: -1,
            cast_time: -1
          }
        this.originalModel = clone({ ...this.editModel, name: '' })
        this.selectedSpell = source ? clone(source.spells_new || this.selectedSpell) : null
        this.selectedNpc = source ? clone(this.npcMap[Number(source.npc_type)] || this.selectedNpc) : null
        this.selectedTab = 'Overview'
        this.updateRoute()
        this.$nextTick(() => document.getElementById('aura-name')?.focus())
      },
      async copyAura () {
        const source = this.auras.find(record => Number(record.type) === Number(this.selectedType))
        const confirmed = await this.$bvModal.msgBoxConfirm(
          `Create a new draft from aura #${source.type} (${this.cleanName(source.name)})?`,
          {
            title: 'Copy aura',
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
        const aura = this.auras.find(record => Number(record.type) === Number(this.editModel.type))
        this.selectedSpell = clone((aura && aura.spells_new) || null)
        this.selectedNpc = clone(this.npcMap[Number(this.editModel.npc_type)] || null)
      },
      async saveAura () {
        if (!this.canSave || this.saving) return
        this.saving = true
        try {
          const api = new AuraApi(...SpireApi.cfg())
          const payload = pickAura(this.editModel)
          const created = this.isCreating
          if (created) await api.createAura({ aura: payload })
          else await api.updateAura({ id: Number(this.originalModel.type), aura: payload })
          const savedType = Number(payload.type)
          this.originalModel = clone(payload)
          this.isCreating = false
          await this.reloadAfterMutation(savedType)
          this.showNotification(created ? 'Aura created' : 'Aura saved')
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to save aura'), 'error')
        } finally {
          this.saving = false
        }
      },
      async deleteAura () {
        if (!this.editModel || this.isCreating) return
        const name = this.cleanName(this.editModel.name)
        const confirmed = await this.$bvModal.msgBoxConfirm(
          `Delete aura #${this.editModel.type} (${name})? The linked spell and NPC template will remain intact.`,
          {
            title: 'Delete aura',
            okTitle: 'Delete aura',
            okVariant: 'danger',
            cancelTitle: 'Cancel',
            centered: true
          }
        )
        if (!confirmed) return
        try {
          await (new AuraApi(...SpireApi.cfg())).deleteAura({ id: Number(this.editModel.type) })
          this.editModel = null
          this.originalModel = null
          this.selectedType = null
          await this.reloadAfterMutation(null)
          this.showNotification(`Aura ${name} deleted`)
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to delete aura'), 'error')
        }
      },
      async reloadAfterMutation (type) {
        const builder = new SpireQueryBuilder()
        builder.includes(['SpellsNew']).limit(1000).orderBy(['type']).orderDirection('asc')
        const response = await (new AuraApi(...SpireApi.cfg())).listAuras(builder.get())
        this.auras = response.data || []
        await this.loadAuraNpcs()
        const target = type || (this.auras[0] && Number(this.auras[0].type))
        if (target) await this.selectAura(target)
      },
      queueSpellSearch () {
        window.clearTimeout(this.spellSearchTimer)
        if (this.spellSearch.length < 2) {
          this.spellResults = []
          return
        }
        this.spellSearchTimer = window.setTimeout(this.searchSpells, 260)
      },
      async searchSpells () {
        this.searchingSpells = true
        try {
          const builder = new SpireQueryBuilder()
          if (/^\d+$/.test(this.spellSearch)) builder.where('id', '=', this.spellSearch)
          else builder.where('name', 'like', this.spellSearch)
          builder.limit(20).orderBy(['name']).orderDirection('asc')
          const response = await (new SpellsNewApi(...SpireApi.cfg())).listSpellsNews(builder.get())
          this.spellResults = response.data || []
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to search spells'), 'error')
        } finally {
          this.searchingSpells = false
        }
      },
      selectSpell (spell) {
        this.editModel.spell_id = Number(spell.id)
        this.selectedSpell = clone(spell)
        this.spellSearch = ''
        this.spellResults = []
      },
      queueNpcSearch () {
        window.clearTimeout(this.npcSearchTimer)
        if (this.npcSearch.length < 2) {
          this.npcResults = []
          return
        }
        this.npcSearchTimer = window.setTimeout(this.searchNpcs, 260)
      },
      async searchNpcs () {
        this.searchingNpcs = true
        try {
          const builder = new SpireQueryBuilder()
          if (/^\d+$/.test(this.npcSearch)) builder.where('id', '=', this.npcSearch)
          else builder.where('name', 'like', this.npcSearch)
          builder.limit(20).orderBy(['name']).orderDirection('asc')
          const response = await (new NpcTypeApi(...SpireApi.cfg())).listNpcTypes(builder.get())
          this.npcResults = response.data || []
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to search NPC templates'), 'error')
        } finally {
          this.searchingNpcs = false
        }
      },
      selectNpc (npc) {
        this.editModel.npc_type = Number(npc.id)
        this.selectedNpc = clone(npc)
        this.npcSearch = ''
        this.npcResults = []
      },
      async selectTab (tab) {
        this.selectedTab = tab
        await this.updateRoute()
      },
      async updateRoute () {
        const query = { ...this.$route.query, tab: this.selectedTab }
        if (this.selectedType && !this.isCreating) query.aura = String(this.selectedType)
        else delete query.aura
        await this.$router.replace({ path: this.$route.path, query }).catch(() => {})
      },
      onEditorKeydown (event) {
        const save = (event.metaKey || event.ctrlKey) && !event.altKey && String(event.key || '').toLowerCase() === 's'
        if (!save || !this.editModel) return
        event.preventDefault()
        if (this.canSave && !this.saving) this.saveAura()
      },
      onBeforeUnload (event) {
        if (!this.hasUnsavedChanges) return
        event.preventDefault()
        event.returnValue = ''
      },
      cleanName (value) {
        return String(value || '').replace(/_/g, ' ')
      },
      auraTypeLabel (value) {
        const option = AURA_TYPES.find(item => item.value === Number(value))
        return option ? option.label : `Unknown type ${value}`
      },
      auraTypeDescription (value) {
        const option = AURA_TYPES.find(item => item.value === Number(value))
        return option ? option.description : 'This legacy aura type is not in the current EQEmu reference list.'
      },
      spawnTypeDescription (value) {
        const option = SPAWN_TYPES.find(item => item.value === Number(value))
        return option ? option.description : 'Unknown spawn visibility.'
      },
      movementLabel (value) {
        const option = MOVEMENT_TYPES.find(item => item.value === Number(value))
        return option ? option.label : `Unknown movement ${value}`
      },
      movementDescription (value) {
        const option = MOVEMENT_TYPES.find(item => item.value === Number(value))
        return option ? option.description : 'Unknown movement behavior.'
      },
      compactDuration (seconds) {
        const value = Math.max(0, Number(seconds) || 0)
        if (value >= 3600) return `${Math.round(value / 360) / 10}h`
        if (value >= 60) return `${Math.round(value / 6) / 10}m`
        return `${value}s`
      },
      raceName (value) {
        return DB_RACE_NAMES[Number(value)] || `Race ${value || 0}`
      },
      className (value) {
        return DB_CLASSES[Number(value)] || `Class ${value || 0}`
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
