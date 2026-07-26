<template>
  <content-area class="content-flag-editor-page">
    <div class="content-flag-toolbar">
      <div>
        <div class="content-flag-kicker">Content tools · world data</div>
        <h1 class="content-flag-title">
          <i class="fa fa-flag mr-2"></i>Content Flag Editor
        </h1>
        <p class="content-flag-subtitle">
          Manage server-wide content gates and every database reference that consumes them.
        </p>
      </div>
      <div class="workspace-summary" aria-label="Content flag directory summary">
        <span>
          <strong>{{ totalRows.toLocaleString() }}</strong>
          {{ totalRows === 1 ? "flag" : "flags" }}
        </span>
        <span class="workspace-summary__divider"></span>
        <span>
          <i class="fa fa-database mr-1"></i>
          {{ schemaSummary.referenceTableCount.toLocaleString() }} reference tables
        </span>
      </div>
    </div>

    <div class="content-flag-workspace">
      <aside class="content-flag-directory">
        <eq-window title="Content Flags">
          <div class="directory-controls">
            <div class="directory-search">
              <i class="fa fa-search"></i>
              <input
                id="content-flag-directory-search"
                v-model.trim="search"
                class="form-control form-control-sm"
                placeholder="Search flag name, notes, or ID…"
                @input="queueSearch"
                @keyup.enter="loadDirectory(1)"
              >
              <button
                v-if="search"
                class="directory-clear"
                type="button"
                aria-label="Clear search"
                @click="clearSearch"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <b-button
              size="sm"
              variant="outline-warning"
              class="directory-new"
              data-testid="content-flag-new"
              @click="createDraft"
            >
              <i class="fa fa-plus mr-1"></i>New
            </b-button>
          </div>

          <div class="directory-filter">
            <label for="content-flag-status-filter">Status</label>
            <select
              id="content-flag-status-filter"
              v-model="statusFilter"
              class="form-control form-control-sm"
              @change="loadDirectory(1)"
            >
              <option value="all">All flags</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div class="directory-meta">
            <span>{{ totalRows.toLocaleString() }} records</span>
            <span v-if="loadingDirectory"><i class="fa fa-spinner fa-spin mr-1"></i>Refreshing</span>
            <span v-else>Page {{ currentPage }}</span>
          </div>

          <div class="directory-list" data-testid="content-flag-directory">
            <div v-if="loadingDirectory && !directory.length" class="directory-state">
              <i class="fa fa-spinner fa-spin"></i>
              <span>Loading content flags…</span>
            </div>

            <button
              v-for="record in directory"
              :key="'content-flag-' + record.id"
              class="directory-row"
              :class="{ active: selectedId === record.id && !isCreating }"
              type="button"
              @click="selectRecord(record.id)"
            >
              <span class="directory-row__icon" :class="{ enabled: record.enabled }">
                <i class="fa fa-flag"></i>
              </span>
              <span class="directory-row__body">
                <span class="directory-row__name">{{ record.flag_name || "(unnamed)" }}</span>
                <span class="directory-row__detail">
                  {{ record.note_preview || "No notes" }}
                </span>
              </span>
              <span class="directory-row__aside">
                <span class="status-dot" :class="{ enabled: record.enabled }"></span>
                <small>#{{ record.id }}</small>
              </span>
            </button>

            <div v-if="!loadingDirectory && !directory.length" class="directory-state">
              <i class="fa fa-search"></i>
              <span>No matching content flags</span>
              <button class="btn btn-sm btn-outline-warning mt-2" type="button" @click="createDraft">
                Create the first one
              </button>
            </div>
          </div>

          <nav
            v-if="totalRows > pageSize"
            class="directory-pagination"
            aria-label="Content flag directory pages"
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

      <main class="content-flag-inspector">
        <eq-window v-if="!editModel && !loadingDetail" title="Flag Workspace">
          <div class="editor-empty">
            <div class="editor-empty__sigil"><i class="fa fa-flag"></i></div>
            <h3>Select a content flag</h3>
            <p>
              Edit its runtime state, inspect every known reference, and resolve dependencies without
              leaving this workspace.
            </p>
            <b-button variant="outline-warning" size="sm" @click="createDraft">
              <i class="fa fa-plus mr-1"></i>Create new
            </b-button>
          </div>
        </eq-window>

        <eq-window v-if="loadingDetail" title="Flag Workspace">
          <div class="editor-empty">
            <div class="editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading flag and references…</h3>
          </div>
        </eq-window>

        <div v-if="editModel && !loadingDetail" data-testid="content-flag-inspector">
          <eq-window title="Content Flag" class="editor-header-window">
            <div class="editor-header">
              <div class="editor-identity">
                <span class="editor-identity__icon" :class="{ enabled: editModel.enabled }">
                  <i class="fa fa-flag"></i>
                </span>
                <div>
                  <div class="editor-identity__eyebrow">
                    {{ isCreating ? "New content flag" : "#" + editModel.id }}
                    <span v-if="hasUnsavedChanges" class="unsaved-pill">
                      <i class="fa fa-circle"></i> Unsaved
                    </span>
                  </div>
                  <h2>{{ editModel.flag_name || "Unnamed content flag" }}</h2>
                  <p>
                    {{ editModel.enabled ? "Enabled at runtime" : "Disabled at runtime" }}
                    <template v-if="!isCreating">
                      · {{ usage.reference_count || 0 }} references across
                      {{ usage.affected_table_count || 0 }} tables
                    </template>
                  </p>
                </div>
              </div>
              <div class="editor-actions">
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-warning"
                  title="Copy this flag into a new draft"
                  data-testid="content-flag-copy"
                  @click="copyFlag"
                >
                  <i class="fa fa-copy mr-1"></i>Copy
                </b-button>
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-danger"
                  :disabled="saving || resolving"
                  data-testid="content-flag-delete"
                  @click="requestDelete"
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
                  data-testid="content-flag-save"
                  @click="saveEditor"
                >
                  <i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                  {{ saving ? "Saving…" : (isCreating ? "Create" : "Save") }}
                </b-button>
              </div>
            </div>
          </eq-window>

          <eq-window title="Editor" class="editor-body-window">
            <eq-tabs :selected="selectedTab" :bottom-tab-margin="18" @on-selected="selectTab">
              <eq-tab name="Overview" :selected="selectedTab === 'Overview'">
                <div class="editor-section-heading">
                  <div>
                    <span class="section-kicker">Configuration</span>
                    <h3>Flag identity and runtime state</h3>
                  </div>
                  <span class="section-help">
                    References store the exact flag name. Renames are propagated transactionally.
                  </span>
                </div>

                <div class="flag-form-grid">
                  <div class="form-group form-group--id">
                    <label for="content-flag-id">ID</label>
                    <input
                      id="content-flag-id"
                      :value="editModel.id || 'Assigned on save'"
                      class="form-control form-control-sm"
                      disabled
                    >
                    <small>Internal database identifier. Content references use the flag name.</small>
                  </div>

                  <div class="form-group form-group--name">
                    <label for="content-flag-name">Flag name</label>
                    <input
                      id="content-flag-name"
                      v-model.trim="editModel.flag_name"
                      class="form-control form-control-sm content-flag-name-input"
                      maxlength="75"
                      placeholder="example_content_gate"
                      data-testid="content-flag-name"
                    >
                    <small>Up to 75 characters. Commas are not allowed because references are CSV tokens.</small>
                  </div>

                  <div class="form-group form-group--state">
                    <label>Runtime state</label>
                    <div class="state-control">
                      <eq-checkbox
                        id="content-flag-enabled"
                        v-model="editModel.enabled"
                        :true-value="true"
                        :false-value="false"
                        label-right="Enabled"
                      />
                      <span class="state-control__summary" :class="{ enabled: editModel.enabled }">
                        {{ editModel.enabled ? "Content requiring this flag can activate" : "Flag is currently inactive" }}
                      </span>
                    </div>
                  </div>

                  <div class="form-group form-group--notes">
                    <label for="content-flag-notes">Notes</label>
                    <textarea
                      id="content-flag-notes"
                      v-model="editModel.notes"
                      class="form-control form-control-sm"
                      rows="6"
                      placeholder="Describe what this flag unlocks, when it is toggled, and any operational context."
                    ></textarea>
                    <small>Keep the operational reason close to the switch so future changes are understandable.</small>
                  </div>
                </div>

                <div v-if="renamePending" class="rename-notice" data-testid="content-flag-rename-notice">
                  <i class="fa fa-random"></i>
                  <div>
                    <strong>Safe rename</strong>
                    <span>
                      Saving will replace <code>{{ originalModel.flag_name }}</code> with
                      <code>{{ editModel.flag_name }}</code> across all detected reference columns in one transaction.
                    </span>
                  </div>
                </div>

                <div class="behavior-panel">
                  <div class="behavior-panel__icon" :class="{ enabled: editModel.enabled }">
                    <i class="fa" :class="editModel.enabled ? 'fa-check' : 'fa-pause'"></i>
                  </div>
                  <div class="behavior-panel__copy">
                    <span class="section-kicker">Reference token</span>
                    <h4>{{ behaviorTitle }}</h4>
                    <p>{{ behaviorDescription }}</p>
                  </div>
                  <div class="token-copy">
                    <code>{{ editModel.flag_name || "flag_name" }}</code>
                    <button
                      type="button"
                      :disabled="!editModel.flag_name"
                      :title="tokenCopied ? 'Copied' : 'Copy flag token'"
                      @click="copyToken"
                    >
                      <i class="fa" :class="tokenCopied ? 'fa-check' : 'fa-copy'"></i>
                    </button>
                  </div>
                </div>
              </eq-tab>

              <eq-tab name="Usage & Safety" :selected="selectedTab === 'Usage & Safety'">
                <div class="editor-section-heading">
                  <div>
                    <span class="section-kicker">Dependencies</span>
                    <h3>Usage, references, and safe follow-on actions</h3>
                  </div>
                  <span class="section-help">
                    {{ usage.scanned_field_count || 0 }} flag-bearing fields scanned across
                    {{ usage.available_table_count || 0 }} real database tables.
                  </span>
                </div>

                <div v-if="isCreating" class="usage-empty">
                  <i class="fa fa-info-circle"></i>
                  Save this flag before inspecting database usage.
                </div>

                <template v-else>
                  <div class="usage-metrics">
                    <div class="usage-metric">
                      <span>Total references</span>
                      <strong>{{ usage.reference_count || 0 }}</strong>
                      <small>Rows containing this token</small>
                    </div>
                    <div class="usage-metric required">
                      <span>Requires flag</span>
                      <strong>{{ usage.required_count || 0 }}</strong>
                      <small><code>content_flags</code></small>
                    </div>
                    <div class="usage-metric blocked">
                      <span>Blocked by flag</span>
                      <strong>{{ usage.blocked_count || 0 }}</strong>
                      <small><code>content_flags_disabled</code></small>
                    </div>
                    <div class="usage-metric">
                      <span>Affected tables</span>
                      <strong>{{ usage.affected_table_count || 0 }}</strong>
                      <small>Of {{ usage.available_table_count || 0 }} scanned</small>
                    </div>
                  </div>

                  <div v-if="!usage.reference_count" class="usage-clear">
                    <span class="usage-clear__icon"><i class="fa fa-check"></i></span>
                    <div>
                      <strong>No unresolved references</strong>
                      <p>This flag can be deleted without leaving dangling content configuration.</p>
                    </div>
                    <b-button size="sm" variant="outline-danger" @click="requestDelete">
                      <i class="fa fa-trash mr-1"></i>Delete flag
                    </b-button>
                  </div>

                  <div v-else class="reference-workspace">
                    <div class="reference-toolbar">
                      <div>
                        <strong>Referenced content</strong>
                        <span>Samples stay in this workspace so you can understand impact before acting.</span>
                      </div>
                      <div class="reference-filter">
                        <i class="fa fa-filter"></i>
                        <select v-model="referenceMode" class="form-control form-control-sm">
                          <option value="all">All references</option>
                          <option value="required">Requires flag</option>
                          <option value="blocked">Blocked by flag</option>
                        </select>
                      </div>
                    </div>

                    <div class="reference-groups">
                      <section
                        v-for="table in filteredUsageTables"
                        :key="table.table"
                        class="reference-group"
                      >
                        <header>
                          <span class="reference-group__icon"><i class="fa fa-database"></i></span>
                          <div>
                            <h4>{{ table.label }}</h4>
                            <small><code>{{ table.table }}</code></small>
                          </div>
                          <span class="reference-group__count">{{ table.count }}</span>
                        </header>

                        <div
                          v-for="group in table.groups"
                          :key="group.key"
                          class="reference-field"
                        >
                          <div class="reference-field__heading">
                            <span class="reference-mode" :class="group.mode">
                              {{ group.mode === "required" ? "Requires flag" : "Blocked by flag" }}
                            </span>
                            <code>{{ group.column }}</code>
                            <strong>{{ group.count }} {{ group.count === 1 ? "row" : "rows" }}</strong>
                          </div>
                          <div class="reference-samples">
                            <div
                              v-for="sample in group.samples"
                              :key="group.key + '-' + sample.record_key"
                              class="reference-sample"
                            >
                              <span>
                                <strong>{{ sample.record_label || "Record " + sample.record_key }}</strong>
                                <small>{{ sample.record_context || "No additional context" }}</small>
                              </span>
                              <code>#{{ sample.record_key }}</code>
                            </div>
                            <div
                              v-if="group.count > group.samples.length"
                              class="reference-sample reference-sample--more"
                            >
                              +{{ group.count - group.samples.length }} additional
                              {{ group.count - group.samples.length === 1 ? "row" : "rows" }}
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>

                    <div class="resolution-panel">
                      <div class="resolution-panel__copy">
                        <span class="section-kicker">Safe deletion workflow</span>
                        <h4>Resolve references before deleting</h4>
                        <p>
                          Replacement or removal updates every detected reference and deletes this flag in one
                          database transaction. Any unresolved reference cancels the entire operation.
                        </p>
                      </div>
                      <div class="resolution-panel__actions">
                        <b-button
                          variant="outline-warning"
                          size="sm"
                          data-testid="content-flag-replace-references"
                          @click="openResolution('replace')"
                        >
                          <i class="fa fa-random mr-1"></i>Replace references…
                        </b-button>
                        <b-button
                          variant="outline-danger"
                          size="sm"
                          data-testid="content-flag-remove-references"
                          @click="openResolution('remove')"
                        >
                          <i class="fa fa-eraser mr-1"></i>Remove references…
                        </b-button>
                      </div>
                    </div>
                  </div>
                </template>
              </eq-tab>
            </eq-tabs>
          </eq-window>
        </div>
      </main>
    </div>

    <b-modal
      id="content-flag-resolution-modal"
      ref="resolutionModal"
      :title="resolutionMode === 'replace' ? 'Replace references and delete' : 'Remove references and delete'"
      centered
      hide-footer
      @hidden="resetResolution"
    >
      <div class="resolution-modal-copy">
        <i class="fa" :class="resolutionMode === 'replace' ? 'fa-random' : 'fa-exclamation-triangle'"></i>
        <p v-if="resolutionMode === 'replace'">
          Every reference to <code>{{ editModel && editModel.flag_name }}</code> will be changed to the selected
          flag, then this flag will be deleted.
        </p>
        <p v-else>
          The token <code>{{ editModel && editModel.flag_name }}</code> will be removed from every reference, then
          this flag will be deleted. Content may become eligible or ineligible immediately.
        </p>
      </div>

      <div v-if="resolutionMode === 'replace'" class="form-group mt-3">
        <label for="content-flag-replacement">Replacement flag</label>
        <select
          id="content-flag-replacement"
          v-model.number="replacementId"
          class="form-control form-control-sm"
          data-testid="content-flag-replacement"
        >
          <option :value="0" disabled>Select a replacement flag</option>
          <option
            v-for="option in replacementOptions"
            :key="'replacement-' + option.id"
            :value="option.id"
          >
            {{ option.flag_name }} · #{{ option.id }} · {{ option.enabled ? "Enabled" : "Disabled" }}
          </option>
        </select>
      </div>

      <div class="form-group mt-3">
        <label for="content-flag-confirmation">
          Type <code>{{ editModel && editModel.flag_name }}</code> to confirm
        </label>
        <input
          id="content-flag-confirmation"
          v-model="resolutionConfirmation"
          class="form-control form-control-sm"
          autocomplete="off"
          data-testid="content-flag-resolution-confirmation"
        >
      </div>

      <div class="resolution-modal-actions">
        <b-button variant="outline-secondary" size="sm" :disabled="resolving" @click="$refs.resolutionModal.hide()">
          Cancel
        </b-button>
        <b-button
          :variant="resolutionMode === 'replace' ? 'warning' : 'danger'"
          size="sm"
          :disabled="!canResolve || resolving"
          data-testid="content-flag-resolve-submit"
          @click="executeResolution"
        >
          <i class="fa mr-1" :class="resolving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
          {{ resolving ? "Applying…" : (resolutionMode === "replace" ? "Replace and delete" : "Remove and delete") }}
        </b-button>
      </div>
    </b-modal>

    <transition name="notification">
      <div
        v-if="notification"
        class="editor-notification"
        :class="'editor-notification--' + notification.type"
        role="status"
      >
        <i
          class="fa"
          :class="notification.type === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle'"
        ></i>
        {{ notification.message }}
      </div>
    </transition>
  </content-area>
</template>

<script>
  import ContentArea from '../../components/layout/ContentArea'
  import EqWindow from '../../components/eq-ui/EQWindow'
  import EqTabs from '../../components/eq-ui/EQTabs'
  import EqTab from '../../components/eq-ui/EQTab'
  import EqCheckbox from '../../components/eq-ui/EQCheckbox'
  import { SpireApi } from '../../app/api/spire-api'
  import { ContentFlags } from '../../app/content-flags'

  function clone (value) {
    return JSON.parse(JSON.stringify(value))
  }

  function blankUsage () {
    return {
      reference_count: 0,
      required_count: 0,
      blocked_count: 0,
      affected_table_count: 0,
      available_table_count: 0,
      scanned_field_count: 0,
      groups: []
    }
  }

  export default {
    name: 'ContentFlagEditor',
    components: { ContentArea, EqWindow, EqTabs, EqTab, EqCheckbox },
    data () {
      return {
        search: '',
        statusFilter: 'all',
        directory: [],
        flagOptions: [],
        totalRows: 0,
        currentPage: 1,
        pageSize: 50,
        loadingDirectory: false,
        loadingDetail: false,
        saving: false,
        resolving: false,
        selectedId: null,
        isCreating: false,
        editModel: null,
        originalModel: null,
        usage: blankUsage(),
        schemaSummary: {
          referenceTableCount: 0,
          scannedFieldCount: 0
        },
        selectedTab: this.$route.query.tab || 'Overview',
        searchTimer: null,
        notification: null,
        notificationTimer: null,
        tokenCopied: false,
        tokenCopyTimer: null,
        referenceMode: 'all',
        resolutionMode: 'replace',
        replacementId: 0,
        resolutionConfirmation: ''
      }
    },
    computed: {
      hasUnsavedChanges () {
        return !!this.editModel && JSON.stringify(this.editModel) !== JSON.stringify(this.originalModel)
      },
      canSave () {
        if (!this.editModel) return false
        const name = String(this.editModel.flag_name || '').trim()
        return !!name && name.length <= 75 && !name.includes(',')
      },
      renamePending () {
        return !this.isCreating &&
          !!this.originalModel &&
          String(this.editModel.flag_name || '').trim() !== String(this.originalModel.flag_name || '').trim()
      },
      totalPages () {
        return Math.max(1, Math.ceil(this.totalRows / this.pageSize))
      },
      paginationProgress () {
        if (this.totalPages <= 1) return 100
        return ((this.currentPage - 1) / (this.totalPages - 1)) * 100
      },
      behaviorTitle () {
        return this.editModel && this.editModel.enabled
          ? 'Flag is enabled'
          : 'Flag is disabled'
      },
      behaviorDescription () {
        if (!this.editModel) return ''
        return this.editModel.enabled
          ? 'Rows that require this token may activate; rows that list it as disabled remain blocked.'
          : 'Rows that require this token remain inactive; rows blocked by it may become eligible.'
      },
      replacementOptions () {
        return this.flagOptions.filter(option => Number(option.id) !== Number(this.selectedId))
      },
      canResolve () {
        if (!this.editModel || this.resolutionConfirmation !== this.editModel.flag_name) return false
        return this.resolutionMode === 'remove' || Number(this.replacementId) > 0
      },
      usageTables () {
        const tables = new Map();
        (this.usage.groups || []).forEach(group => {
          if (!tables.has(group.table)) {
            tables.set(group.table, {
              table: group.table,
              label: group.table_label,
              count: 0,
              groups: []
            })
          }
          const table = tables.get(group.table)
          table.count += Number(group.count || 0)
          table.groups.push(group)
        })
        return Array.from(tables.values()).sort((left, right) => {
          if (right.count !== left.count) return right.count - left.count
          return left.label.localeCompare(right.label)
        })
      },
      filteredUsageTables () {
        if (this.referenceMode === 'all') return this.usageTables
        return this.usageTables
          .map(table => {
            const groups = table.groups.filter(group => group.mode === this.referenceMode)
            return Object.assign({}, table, {
              groups,
              count: groups.reduce((total, group) => total + Number(group.count || 0), 0)
            })
          })
          .filter(table => table.groups.length > 0)
      }
    },
    created () {
      this.loadDirectory(1).then(() => {
        const routeId = Number(this.$route.query.flag || 0)
        if (routeId > 0) this.selectRecord(routeId, true)
      })
      this.loadFlagOptions()
    },
    mounted () {
      window.addEventListener('keydown', this.onEditorKeydown)
    },
    beforeDestroy () {
      window.clearTimeout(this.searchTimer)
      window.clearTimeout(this.notificationTimer)
      window.clearTimeout(this.tokenCopyTimer)
      window.removeEventListener('keydown', this.onEditorKeydown)
    },
    beforeRouteLeave (to, from, next) {
      if (this.hasUnsavedChanges && !window.confirm('Discard unsaved content flag changes?')) {
        next(false)
        return
      }
      next()
    },
    methods: {
      async loadDirectory (page = 1) {
        this.loadingDirectory = true
        this.currentPage = Number(page) || 1
        try {
          const response = await SpireApi.v1().get('/content-flag-editor/flags', {
            params: {
              q: this.search,
              status: this.statusFilter,
              page: this.currentPage,
              limit: this.pageSize
            }
          })
          this.directory = response.data.data || []
          this.totalRows = Number(response.data.total || 0)
          this.schemaSummary.referenceTableCount = Number(response.data.reference_table_count || 0)
          this.schemaSummary.scannedFieldCount = Number(response.data.scanned_field_count || 0)
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to load content flag directory'), 'error')
        } finally {
          this.loadingDirectory = false
        }
      },
      async loadFlagOptions () {
        try {
          const response = await SpireApi.v1().get('/content-flag-editor/flags', {
            params: { lookup: 1 }
          })
          this.flagOptions = response.data.data || []
        } catch (_) {
          this.flagOptions = []
        }
      },
      queueSearch () {
        window.clearTimeout(this.searchTimer)
        this.searchTimer = window.setTimeout(() => this.loadDirectory(1), 260)
      },
      clearSearch () {
        this.search = ''
        this.loadDirectory(1)
      },
      goToPage (page) {
        const nextPage = Math.min(this.totalPages, Math.max(1, Number(page) || 1))
        if (nextPage === this.currentPage || this.loadingDirectory) return
        this.loadDirectory(nextPage)
      },
      async selectRecord (id, force = false) {
        if (!force && this.selectedId === Number(id) && !this.isCreating) return
        if (!force && !(await this.confirmDiscard())) return
        this.loadingDetail = true
        this.isCreating = false
        this.selectedId = Number(id)
        this.referenceMode = 'all'
        try {
          const response = await SpireApi.v1().get(`/content-flag-editor/flag/${id}`)
          this.installDetail(response.data)
          await this.updateRoute()
        } catch (error) {
          this.editModel = null
          this.originalModel = null
          this.usage = blankUsage()
          this.showNotification(this.errorMessage(error, 'Unable to load content flag'), 'error')
        } finally {
          this.loadingDetail = false
        }
      },
      installDetail (detail) {
        this.editModel = clone(detail.flag)
        this.originalModel = clone(detail.flag)
        this.usage = detail.usage || blankUsage()
        this.schemaSummary.referenceTableCount = Number(this.usage.available_table_count || 0)
        this.schemaSummary.scannedFieldCount = Number(this.usage.scanned_field_count || 0)
      },
      async createDraft (source = null) {
        if (!(await this.confirmDiscard())) return
        this.isCreating = true
        this.selectedId = null
        this.selectedTab = 'Overview'
        this.usage = blankUsage()
        this.editModel = {
          id: null,
          flag_name: '',
          enabled: source ? !!source.enabled : false,
          notes: source ? source.notes || '' : ''
        }
        this.originalModel = clone(this.editModel)
        await this.updateRoute()
        this.$nextTick(() => document.getElementById('content-flag-name')?.focus())
      },
      copyFlag () {
        this.createDraft(this.editModel)
      },
      resetEditor () {
        this.editModel = clone(this.originalModel)
      },
      onEditorKeydown (event) {
        const isSaveShortcut = (event.metaKey || event.ctrlKey) &&
          !event.altKey &&
          String(event.key || '').toLowerCase() === 's'
        if (!isSaveShortcut || !this.editModel) return
        event.preventDefault()
        if (this.hasUnsavedChanges && this.canSave && !this.saving) this.saveEditor()
      },
      async saveEditor () {
        if (!this.canSave || this.saving) return
        this.saving = true
        try {
          const renamed = this.renamePending
          const payload = {
            id: this.editModel.id ? Number(this.editModel.id) : 0,
            flag_name: String(this.editModel.flag_name || '').trim(),
            enabled: !!this.editModel.enabled,
            notes: String(this.editModel.notes || '').trim()
          }
          const method = this.isCreating ? 'put' : 'patch'
          const path = this.isCreating
            ? '/content-flag-editor/flag'
            : `/content-flag-editor/flag/${this.editModel.id}`
          const response = await SpireApi.v1()[method](path, payload)
          const created = this.isCreating
          this.isCreating = false
          this.installDetail(response.data)
          this.selectedId = Number(response.data.flag.id)
          ContentFlags.clear()
          await Promise.all([
            this.loadDirectory(this.currentPage),
            this.loadFlagOptions()
          ])
          await this.updateRoute()
          this.showNotification(
            created
              ? 'Content flag created'
              : (renamed ? 'Content flag and references renamed' : 'Content flag changes saved'),
            'success'
          )
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to save content flag'), 'error', 6500)
        } finally {
          this.saving = false
        }
      },
      async requestDelete () {
        if (Number(this.usage.reference_count || 0) > 0) {
          this.selectedTab = 'Usage & Safety'
          await this.updateRoute()
          this.showNotification(
            'Deletion is blocked until the references below are replaced or removed safely.',
            'error',
            6200
          )
          return
        }
        const confirmed = await this.$bvModal.msgBoxConfirm(
          `Delete ${this.editModel.flag_name}? This cannot be undone.`,
          {
            title: 'Delete content flag',
            okTitle: 'Delete permanently',
            okVariant: 'danger',
            cancelTitle: 'Cancel',
            centered: true
          }
        )
        if (!confirmed) return
        try {
          await SpireApi.v1().delete(`/content-flag-editor/flag/${this.editModel.id}`)
          ContentFlags.clear()
          this.resetWorkspace()
          await Promise.all([this.loadDirectory(1), this.loadFlagOptions()])
          await this.updateRoute()
          this.showNotification('Content flag deleted', 'success')
        } catch (error) {
          if (error?.response?.data?.usage) this.usage = error.response.data.usage
          this.showNotification(this.errorMessage(error, 'Deletion was blocked'), 'error', 6500)
        }
      },
      openResolution (mode) {
        this.resolutionMode = mode
        this.replacementId = 0
        this.resolutionConfirmation = ''
        this.$refs.resolutionModal.show()
      },
      resetResolution () {
        if (this.resolving) return
        this.replacementId = 0
        this.resolutionConfirmation = ''
      },
      async executeResolution () {
        if (!this.canResolve || this.resolving) return
        this.resolving = true
        try {
          const response = await SpireApi.v1().post(
            `/content-flag-editor/flag/${this.editModel.id}/resolve`,
            {
              mode: this.resolutionMode,
              target_id: this.resolutionMode === 'replace' ? Number(this.replacementId) : 0
            }
          )
          const updatedRows = Number(response.data.updated_rows || 0)
          this.$refs.resolutionModal.hide()
          ContentFlags.clear()
          this.resetWorkspace()
          await Promise.all([this.loadDirectory(1), this.loadFlagOptions()])
          await this.updateRoute()
          this.showNotification(
            `${updatedRows} reference ${updatedRows === 1 ? 'row' : 'rows'} updated; content flag deleted`,
            'success',
            5200
          )
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to resolve content flag references'), 'error', 7200)
        } finally {
          this.resolving = false
        }
      },
      async copyToken () {
        if (!this.editModel || !this.editModel.flag_name) return
        try {
          await navigator.clipboard.writeText(this.editModel.flag_name)
          this.tokenCopied = true
          window.clearTimeout(this.tokenCopyTimer)
          this.tokenCopyTimer = window.setTimeout(() => { this.tokenCopied = false }, 1800)
        } catch (_) {
          this.showNotification('Unable to copy the flag token', 'error')
        }
      },
      selectTab (tab) {
        this.selectedTab = tab
        this.updateRoute()
      },
      async updateRoute () {
        if (!['Overview', 'Usage & Safety'].includes(this.selectedTab)) this.selectedTab = 'Overview'
        const query = { tab: this.selectedTab }
        if (this.selectedId && !this.isCreating) query.flag = String(this.selectedId)
        if (JSON.stringify(query) !== JSON.stringify(this.$route.query)) {
          await this.$router.replace({ path: this.$route.path, query }).catch(() => {})
        }
      },
      resetWorkspace () {
        this.selectedId = null
        this.isCreating = false
        this.editModel = null
        this.originalModel = null
        this.usage = blankUsage()
        this.selectedTab = 'Overview'
        this.referenceMode = 'all'
      },
      async confirmDiscard () {
        if (!this.hasUnsavedChanges) return true
        return !!(await this.$bvModal.msgBoxConfirm(
          'You have unsaved content flag changes. Discard them and continue?',
          {
            title: 'Discard unsaved changes?',
            okTitle: 'Discard changes',
            okVariant: 'danger',
            cancelTitle: 'Keep editing',
            centered: true
          }
        ))
      },
      errorMessage (error, fallback) {
        return error?.response?.data?.error || error?.message || fallback
      },
      showNotification (message, type = 'success', duration = 3600) {
        window.clearTimeout(this.notificationTimer)
        this.notification = { message, type }
        this.notificationTimer = window.setTimeout(() => { this.notification = null }, duration)
      }
    }
  }
</script>

<style scoped>
.content-flag-editor-page {
  padding: 18px 20px 28px !important;
}

.content-flag-toolbar {
  align-items: flex-end;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  margin-bottom: 14px;
}

.content-flag-kicker,
.section-kicker {
  color: #c39b49;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.content-flag-title {
  color: #f5d993;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 26px;
  margin: 2px 0 1px;
  text-shadow: 0 1px 1px #000;
}

.content-flag-subtitle {
  color: rgba(255, 255, 255, .58);
  font-size: 12px;
  margin: 0;
}

.workspace-summary {
  align-items: center;
  background: rgba(0, 0, 0, .25);
  border: 1px solid rgba(195, 155, 73, .22);
  border-radius: 3px;
  color: rgba(255, 255, 255, .52);
  display: flex;
  font-size: 10px;
  gap: 9px;
  padding: 7px 10px;
  text-transform: uppercase;
}

.workspace-summary strong {
  color: #efd384;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 15px;
  font-weight: 400;
  margin-right: 2px;
}

.workspace-summary__divider {
  background: rgba(195, 155, 73, .24);
  height: 18px;
  width: 1px;
}

.content-flag-workspace {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(300px, 31%) minmax(0, 1fr);
}

.content-flag-directory,
.content-flag-inspector {
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

.directory-filter {
  align-items: center;
  display: grid;
  gap: 7px;
  grid-template-columns: auto minmax(0, 1fr);
  margin-top: 7px;
}

.directory-filter label {
  color: rgba(255, 239, 198, .58);
  font-size: 9px;
  letter-spacing: .08em;
  margin: 0;
  text-transform: uppercase;
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
  height: calc(100vh - 318px);
  min-height: 395px;
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
  background: rgba(117, 123, 131, .1);
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 2px;
  color: rgba(255, 255, 255, .34);
  display: flex;
  height: 28px;
  justify-content: center;
  width: 28px;
}

.directory-row__icon.enabled {
  background: rgba(195, 155, 73, .1);
  border-color: rgba(195, 155, 73, .18);
  color: #c9a65c;
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
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 11px;
  font-weight: 600;
}

.directory-row__detail {
  color: rgba(255, 255, 255, .4);
  font-size: 9px;
  margin-top: 2px;
}

.directory-row__aside {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.directory-row__aside small {
  color: rgba(255, 255, 255, .34);
  font-size: 9px;
}

.status-dot {
  background: #697078;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(105, 112, 120, .12);
  height: 6px;
  width: 6px;
}

.status-dot.enabled {
  background: #75c98b;
  box-shadow: 0 0 0 2px rgba(117, 201, 139, .12), 0 0 6px rgba(117, 201, 139, .4);
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
  font-size: 32px;
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
  max-width: 470px;
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
  background: linear-gradient(145deg, rgba(105, 112, 120, .14), rgba(25, 29, 34, .35));
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 3px;
  color: rgba(255, 255, 255, .36);
  display: flex;
  flex: 0 0 42px;
  font-size: 19px;
  height: 42px;
  justify-content: center;
}

.editor-identity__icon.enabled {
  background: linear-gradient(145deg, rgba(195, 155, 73, .24), rgba(42, 31, 16, .4));
  border-color: rgba(226, 184, 94, .34);
  color: #e2b85e;
}

.editor-identity__eyebrow {
  color: rgba(255, 255, 255, .42);
  font-size: 10px;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.editor-identity h2 {
  color: #f5d993;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 17px;
  margin: 2px 0;
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
  max-width: 390px;
  text-align: right;
}

.flag-form-grid {
  display: grid;
  gap: 15px 18px;
  grid-template-columns: minmax(160px, .38fr) minmax(260px, 1fr);
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

.form-group small {
  color: rgba(255, 255, 255, .36);
  display: block;
  font-size: 9px;
  margin-top: 4px;
}

.form-group--notes {
  grid-column: 1 / -1;
}

.form-group--notes textarea {
  min-height: 118px;
  resize: vertical;
}

.content-flag-name-input {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}

.state-control {
  align-items: center;
  border: 1px solid rgba(255, 255, 255, .07);
  border-radius: 2px;
  display: flex;
  gap: 12px;
  min-height: 31px;
  padding: 4px 8px;
}

.state-control__summary {
  color: rgba(255, 255, 255, .38);
  font-size: 9px;
}

.state-control__summary.enabled {
  color: rgba(135, 215, 156, .72);
}

.rename-notice {
  align-items: flex-start;
  background: rgba(195, 155, 73, .08);
  border: 1px solid rgba(195, 155, 73, .2);
  border-radius: 2px;
  color: #d5b66e;
  display: flex;
  gap: 10px;
  margin-top: 17px;
  padding: 10px 12px;
}

.rename-notice > i {
  margin-top: 2px;
}

.rename-notice strong,
.rename-notice span {
  display: block;
}

.rename-notice strong {
  color: #efd384;
  font-size: 11px;
}

.rename-notice span {
  color: rgba(255, 255, 255, .52);
  font-size: 10px;
  line-height: 1.45;
  margin-top: 2px;
}

.rename-notice code,
.behavior-panel code,
.usage-metric code,
.reference-group code,
.reference-field code,
.reference-sample code,
.resolution-panel code {
  color: #d5b66e;
  font-size: 9px;
}

.behavior-panel {
  align-items: center;
  background: rgba(3, 7, 11, .34);
  border: 1px solid rgba(255, 255, 255, .07);
  border-radius: 2px;
  display: grid;
  gap: 12px;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  margin-top: 17px;
  padding: 13px;
}

.behavior-panel__icon {
  align-items: center;
  background: rgba(105, 112, 120, .1);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 50%;
  color: rgba(255, 255, 255, .36);
  display: flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.behavior-panel__icon.enabled {
  background: rgba(83, 163, 105, .12);
  border-color: rgba(117, 201, 139, .2);
  color: #75c98b;
}

.behavior-panel__copy h4 {
  color: rgba(255, 242, 209, .84);
  font-size: 13px;
  margin: 2px 0;
}

.behavior-panel__copy p {
  color: rgba(255, 255, 255, .42);
  font-size: 10px;
  line-height: 1.45;
  margin: 0;
}

.token-copy {
  align-items: center;
  background: rgba(0, 0, 0, .28);
  border: 1px solid rgba(195, 155, 73, .16);
  border-radius: 2px;
  display: flex;
  max-width: 280px;
  min-width: 150px;
}

.token-copy code {
  flex: 1;
  overflow: hidden;
  padding: 7px 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.token-copy button {
  align-items: center;
  align-self: stretch;
  background: transparent;
  border: 0;
  border-left: 1px solid rgba(195, 155, 73, .16);
  color: rgba(232, 197, 121, .64);
  display: flex;
  justify-content: center;
  width: 31px;
}

.usage-empty,
.usage-clear {
  align-items: center;
  background: rgba(3, 7, 11, .3);
  border: 1px solid rgba(255, 255, 255, .07);
  border-radius: 2px;
  color: rgba(255, 255, 255, .48);
  display: flex;
  gap: 10px;
  padding: 14px;
}

.usage-metrics {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.usage-metric {
  background: rgba(3, 7, 11, .34);
  border: 1px solid rgba(255, 255, 255, .07);
  border-radius: 2px;
  min-width: 0;
  padding: 10px 11px;
}

.usage-metric.required {
  border-color: rgba(117, 201, 139, .17);
}

.usage-metric.blocked {
  border-color: rgba(221, 126, 105, .17);
}

.usage-metric span,
.usage-metric strong,
.usage-metric small {
  display: block;
}

.usage-metric span {
  color: rgba(255, 255, 255, .43);
  font-size: 9px;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.usage-metric strong {
  color: #f1ce7b;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 22px;
  font-weight: 400;
  line-height: 1.15;
  margin: 2px 0;
}

.usage-metric.required strong {
  color: #89d69d;
}

.usage-metric.blocked strong {
  color: #df8d7b;
}

.usage-metric small {
  color: rgba(255, 255, 255, .3);
  font-size: 9px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.usage-clear {
  margin-top: 12px;
}

.usage-clear__icon {
  align-items: center;
  background: rgba(83, 163, 105, .12);
  border: 1px solid rgba(117, 201, 139, .2);
  border-radius: 50%;
  color: #75c98b;
  display: flex;
  flex: 0 0 36px;
  height: 36px;
  justify-content: center;
}

.usage-clear > div {
  flex: 1;
}

.usage-clear strong {
  color: rgba(215, 247, 222, .84);
  display: block;
  font-size: 12px;
}

.usage-clear p {
  color: rgba(255, 255, 255, .42);
  font-size: 10px;
  margin: 1px 0 0;
}

.reference-workspace {
  margin-top: 12px;
}

.reference-toolbar {
  align-items: center;
  background: rgba(3, 7, 11, .3);
  border: 1px solid rgba(255, 255, 255, .065);
  border-radius: 2px 2px 0 0;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 9px 11px;
}

.reference-toolbar strong,
.reference-toolbar span {
  display: block;
}

.reference-toolbar strong {
  color: rgba(255, 242, 209, .8);
  font-size: 11px;
}

.reference-toolbar span {
  color: rgba(255, 255, 255, .36);
  font-size: 9px;
}

.reference-filter {
  align-items: center;
  display: flex;
  flex: 0 0 180px;
  gap: 7px;
}

.reference-filter > i {
  color: rgba(195, 155, 73, .55);
}

.reference-groups {
  border: 1px solid rgba(255, 255, 255, .065);
  border-top: 0;
  max-height: calc(100vh - 470px);
  min-height: 220px;
  overflow-y: auto;
  padding: 7px;
}

.reference-group {
  background: rgba(0, 0, 0, .16);
  border: 1px solid rgba(255, 255, 255, .055);
  border-radius: 2px;
  margin-bottom: 6px;
  overflow: hidden;
}

.reference-group:last-child {
  margin-bottom: 0;
}

.reference-group > header {
  align-items: center;
  background: linear-gradient(90deg, rgba(195, 155, 73, .08), transparent);
  display: grid;
  gap: 8px;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  padding: 8px 10px;
}

.reference-group__icon {
  align-items: center;
  background: rgba(195, 155, 73, .08);
  border: 1px solid rgba(195, 155, 73, .12);
  color: #c9a65c;
  display: flex;
  height: 26px;
  justify-content: center;
  width: 26px;
}

.reference-group h4 {
  color: rgba(255, 242, 209, .82);
  font-size: 11px;
  margin: 0;
}

.reference-group small {
  color: rgba(255, 255, 255, .34);
  display: block;
  font-size: 8px;
  margin-top: 1px;
}

.reference-group__count {
  background: rgba(0, 0, 0, .28);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 10px;
  color: #e4c575;
  font-size: 10px;
  min-width: 25px;
  padding: 2px 7px;
  text-align: center;
}

.reference-field {
  border-top: 1px solid rgba(255, 255, 255, .05);
  padding: 8px 10px;
}

.reference-field__heading {
  align-items: center;
  display: flex;
  gap: 7px;
}

.reference-field__heading > strong {
  color: rgba(255, 255, 255, .42);
  font-size: 9px;
  font-weight: 400;
  margin-left: auto;
}

.reference-mode {
  border: 1px solid;
  border-radius: 8px;
  font-size: 8px;
  letter-spacing: .04em;
  padding: 2px 6px;
  text-transform: uppercase;
}

.reference-mode.required {
  background: rgba(83, 163, 105, .1);
  border-color: rgba(117, 201, 139, .18);
  color: #89d69d;
}

.reference-mode.blocked {
  background: rgba(183, 83, 62, .1);
  border-color: rgba(221, 126, 105, .2);
  color: #df8d7b;
}

.reference-samples {
  display: grid;
  gap: 3px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 7px;
}

.reference-sample {
  align-items: center;
  background: rgba(255, 255, 255, .025);
  border: 1px solid rgba(255, 255, 255, .045);
  display: flex;
  gap: 8px;
  justify-content: space-between;
  min-width: 0;
  padding: 6px 7px;
}

.reference-sample > span {
  min-width: 0;
}

.reference-sample strong,
.reference-sample small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reference-sample strong {
  color: rgba(255, 255, 255, .68);
  font-size: 9px;
}

.reference-sample small {
  color: rgba(255, 255, 255, .32);
  font-size: 8px;
}

.reference-sample--more {
  color: rgba(195, 155, 73, .56);
  font-size: 9px;
  justify-content: center;
}

.resolution-panel {
  align-items: center;
  background: linear-gradient(90deg, rgba(128, 56, 42, .12), rgba(0, 0, 0, .18));
  border: 1px solid rgba(221, 126, 105, .16);
  border-radius: 2px;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  margin-top: 10px;
  padding: 11px 12px;
}

.resolution-panel__copy h4 {
  color: rgba(255, 230, 219, .82);
  font-size: 12px;
  margin: 2px 0;
}

.resolution-panel__copy p {
  color: rgba(255, 255, 255, .4);
  font-size: 9px;
  line-height: 1.45;
  margin: 0;
  max-width: 620px;
}

.resolution-panel__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
}

.resolution-modal-copy {
  align-items: flex-start;
  display: flex;
  gap: 10px;
}

.resolution-modal-copy > i {
  color: #d4ad55;
  font-size: 18px;
  margin-top: 2px;
}

.resolution-modal-copy p {
  margin: 0;
}

.resolution-modal-actions {
  display: flex;
  gap: 7px;
  justify-content: flex-end;
  margin-top: 18px;
}

.editor-notification {
  align-items: center;
  backdrop-filter: blur(9px);
  background: rgba(22, 92, 47, .92);
  border: 1px solid rgba(135, 220, 157, .28);
  border-radius: 3px;
  bottom: 22px;
  box-shadow: 0 12px 34px rgba(0, 0, 0, .35);
  color: #eaffef;
  display: flex;
  font-size: 11px;
  gap: 8px;
  max-width: 460px;
  padding: 10px 13px;
  position: fixed;
  right: 24px;
  z-index: 1100;
}

.editor-notification--error {
  background: rgba(112, 37, 28, .94);
  border-color: rgba(255, 147, 126, .3);
  color: #fff0ed;
}

.notification-enter-active,
.notification-leave-active {
  transition: opacity .16s ease, transform .16s ease;
}

.notification-enter,
.notification-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 1180px) {
  .content-flag-workspace {
    grid-template-columns: minmax(270px, 35%) minmax(0, 1fr);
  }

  .usage-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reference-samples {
    grid-template-columns: 1fr;
  }

  .resolution-panel {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 900px) {
  .content-flag-editor-page {
    padding: 12px !important;
  }

  .content-flag-toolbar,
  .editor-header,
  .editor-section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .workspace-summary {
    align-self: stretch;
    justify-content: center;
  }

  .content-flag-workspace {
    grid-template-columns: 1fr;
  }

  .directory-list {
    height: 320px;
    min-height: 260px;
  }

  .editor-empty {
    min-height: 360px;
  }

  .section-help {
    max-width: none;
    text-align: left;
  }
}

@media (max-width: 640px) {
  .content-flag-title {
    font-size: 22px;
  }

  .flag-form-grid,
  .usage-metrics {
    grid-template-columns: 1fr;
  }

  .form-group--notes {
    grid-column: auto;
  }

  .behavior-panel {
    grid-template-columns: 36px minmax(0, 1fr);
  }

  .token-copy {
    grid-column: 1 / -1;
    max-width: none;
  }

  .reference-toolbar,
  .usage-clear {
    align-items: flex-start;
    flex-direction: column;
  }

  .reference-filter {
    align-self: stretch;
    flex-basis: auto;
  }

  .resolution-panel__actions {
    flex-direction: column;
    width: 100%;
  }

  .resolution-panel__actions .btn {
    width: 100%;
  }

  .editor-notification {
    bottom: 12px;
    left: 12px;
    max-width: none;
    right: 12px;
  }
}
</style>
