<template>
  <content-area
    class="spire-editor-page operational-editor-page qglobal-editor-page"
    :class="{ 'operational-editor-page--directory': compactView === 'directory' }"
  >
    <div class="spire-editor-toolbar">
      <div>
        <div class="spire-editor-kicker">World data · legacy quest state</div>
        <h1 class="spire-editor-title"><i class="fa fa-globe mr-1"></i> QGlobals</h1>
        <p class="spire-editor-subtitle">
          Manage character, NPC, and zone quest globals with wildcard scope made explicit.
        </p>
      </div>
      <div class="spire-editor-summary" aria-label="QGlobals summary">
        <button type="button" :class="{ active: !scopeFilter && !stateFilter }" @click="applySummaryFilter('', '')">
          <strong>{{ number(summary.total) }}</strong> total
        </button>
        <span class="spire-editor-summary__divider"></span>
        <button type="button" :class="{ active: scopeFilter === 'global' }" @click="applySummaryFilter('global', stateFilter)">
          <strong>{{ number(summary.global) }}</strong> wildcard
        </button>
        <span class="spire-editor-summary__divider"></span>
        <button type="button" :class="{ active: stateFilter === 'active' }" @click="applySummaryFilter(scopeFilter, 'active')">
          <strong>{{ number(summary.active) }}</strong> active
        </button>
        <span class="spire-editor-summary__divider"></span>
        <button type="button" :class="{ active: stateFilter === 'expired' }" @click="applySummaryFilter(scopeFilter, 'expired')">
          <strong>{{ number(summary.expired) }}</strong> expired
        </button>
      </div>
    </div>

    <div class="spire-editor-workspace">
      <aside class="spire-editor-directory">
        <eq-window title="QGlobal Directory">
          <div class="spire-editor-directory-controls">
            <div class="spire-editor-search">
              <i class="fa fa-search"></i>
              <input
                id="qglobal-search"
                v-model.trim="search"
                class="form-control form-control-sm"
                placeholder="Search name, value, or scope…"
                @input="queueSearch"
              >
              <button
                v-if="search"
                class="spire-editor-search-clear"
                type="button"
                aria-label="Clear QGlobal search"
                @click="search = ''; currentPage = 1; syncDirectoryQuery(); loadDirectory()"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <b-button size="sm" variant="outline-warning" data-testid="qglobal-new" @click="createDraft()">
              <i class="fa fa-plus mr-1"></i>New
            </b-button>
          </div>

          <div class="operational-filter-row">
            <select
              id="qglobal-scope-filter"
              v-model="scopeFilter"
              class="form-control form-control-sm"
              aria-label="Filter QGlobals by scope"
              @change="currentPage = 1; syncDirectoryQuery(); loadDirectory()"
            >
              <option value="">All scopes</option>
              <option value="global">Full wildcard</option>
              <option value="character">Character</option>
              <option value="npc">NPC</option>
              <option value="zone">Zone</option>
              <option value="composite">Composite</option>
            </select>
            <select
              id="qglobal-state-filter"
              v-model="stateFilter"
              class="form-control form-control-sm"
              aria-label="Filter QGlobals by expiration"
              @change="currentPage = 1; syncDirectoryQuery(); loadDirectory()"
            >
              <option value="active">Active</option>
              <option value="">All lifecycle states</option>
              <option value="permanent">Permanent</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div class="spire-editor-directory-meta">
            <span>{{ number(totalRecords) }} records</span>
            <button class="btn btn-link btn-sm p-0" type="button" :disabled="loadingDirectory" @click="loadDirectory">
              <i class="fa mr-1" :class="loadingDirectory ? 'fa-spinner fa-spin' : 'fa-refresh'"></i>Refresh
            </button>
          </div>

          <div class="spire-editor-directory-list" data-testid="qglobal-directory">
            <button
              v-for="record in records"
              :key="record.identity"
              type="button"
              class="spire-editor-directory-row"
              :class="{ active: !creating && selectedIdentity === record.identity }"
              :aria-current="!creating && selectedIdentity === record.identity ? 'true' : null"
              @click="selectRecord(record.identity)"
            >
              <span class="spire-editor-directory-icon">
                <i :class="record.scope_kind === 'global' ? 'fa fa-globe' : 'ra ra-scroll-unfurled'"></i>
              </span>
              <span class="spire-editor-directory-body">
                <span class="spire-editor-directory-name">{{ record.name }}</span>
                <span class="spire-editor-directory-detail">{{ record.value || '(empty value)' }}</span>
                <span class="operational-row-badges">
                  <span class="operational-badge" :class="{ 'operational-badge--gold': record.scope_kind === 'global' }">
                    {{ record.scope_kind }}
                  </span>
                  <span v-if="record.expired" class="operational-badge operational-badge--danger">expired</span>
                  <span v-else-if="record.permanent" class="operational-badge operational-badge--muted">permanent</span>
                </span>
              </span>
              <span class="spire-editor-directory-aside">{{ compactScope(record) }}</span>
            </button>

            <div v-if="directoryError" class="spire-editor-directory-state spire-editor-directory-state--error" role="alert">
              <i class="fa fa-exclamation-triangle"></i>
              <span>{{ directoryError }}</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="loadDirectory">Retry</button>
            </div>
            <div v-else-if="loadingDirectory && !records.length" class="spire-editor-directory-state">
              <i class="fa fa-spinner fa-spin"></i><span>Loading QGlobals…</span>
            </div>
            <div v-else-if="!records.length" class="spire-editor-directory-state">
              <i class="fa fa-globe"></i>
              <span>{{ search ? 'No QGlobals match this search.' : 'No QGlobals exist in this view.' }}</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="createDraft()">Create a QGlobal</button>
            </div>
          </div>

          <nav v-if="totalPages > 1" class="spire-editor-pagination" aria-label="QGlobal pages">
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
        <eq-window v-if="!draft && detailError" title="QGlobal Workspace">
          <div class="spire-editor-empty spire-editor-empty--error" role="alert">
            <div class="spire-editor-empty__sigil"><i class="fa fa-exclamation-triangle"></i></div>
            <h3>QGlobal could not be loaded</h3>
            <p>{{ detailError }}</p>
            <b-button size="sm" variant="outline-warning" @click="reloadSelected">
              <i class="fa fa-refresh mr-1"></i>Retry
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="!draft && !loadingDetail" title="QGlobal Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-globe"></i></div>
            <h3>Select a QGlobal</h3>
            <p>Make wildcard and specific quest scope visible before changing live progression state.</p>
            <b-button size="sm" variant="outline-warning" @click="createDraft()">
              <i class="fa fa-plus mr-1"></i>Create QGlobal
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="loadingDetail && !draft" title="QGlobal Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading quest-global context…</h3>
          </div>
        </eq-window>

        <eq-window v-else title="QGlobal" data-testid="qglobal-inspector">
          <div class="spire-editor-header">
            <div class="spire-editor-identity">
              <span class="spire-editor-identity-icon"><i class="ra ra-scroll-unfurled"></i></span>
              <div>
                <div class="spire-editor-eyebrow">
                  {{ creating ? 'New QGlobal' : 'Match identity' }}
                  <span v-if="hasUnsavedChanges" class="spire-editor-unsaved"><i class="fa fa-circle"></i> Unsaved</span>
                </div>
                <h2>{{ draft.name || 'Untitled QGlobal' }}</h2>
                <div class="operational-identity-meta">
                  <span class="operational-badge">{{ scopeKind }}</span>
                  <span v-if="isExpired" class="operational-badge operational-badge--danger">expired</span>
                  <span v-else-if="isPermanent" class="operational-badge operational-badge--muted">permanent</span>
                  <span v-else class="operational-badge operational-badge--gold">expires {{ formatDate(draft.expdate) }}</span>
                </div>
              </div>
            </div>
          </div>

          <action-dock
            status-id="qglobal-save-status"
            :state="saveReadiness.state"
            :title="saveReadiness.title"
            :detail="saveReadiness.detail"
            @back="showDirectory"
          >
            <template>
              <b-button v-if="!creating" size="sm" variant="outline-secondary" :disabled="saving" @click="createDraft(draft)">
                <i class="fa fa-copy mr-1"></i>Copy
              </b-button>
              <b-button v-if="!creating" size="sm" variant="outline-danger" :disabled="saving || hasUnsavedChanges" @click="openDelete">
                <i class="fa fa-trash mr-1"></i>Delete
              </b-button>
              <b-button size="sm" variant="outline-secondary" :disabled="saving || !hasUnsavedChanges" @click="resetDraft">
                <i class="fa fa-undo mr-1"></i>Revert
              </b-button>
              <b-button
                size="sm"
                variant="warning"
                :disabled="saving || !canSave"
                aria-describedby="qglobal-save-status"
                data-testid="qglobal-save"
                @click="save"
              >
                <i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"></i>{{ creating ? 'Create' : 'Save' }}
              </b-button>
            </template>
          </action-dock>

          <div class="spire-editor-panel">
            <div class="operational-preview-strip">
              <span>Effective match</span>
              <div class="operational-scope-preview">
                <span v-for="label in scopeLabels" :key="label" class="operational-badge">{{ label }}</span>
              </div>
            </div>

            <div class="spire-editor-section-heading">
              <div>
                <div class="spire-editor-section-kicker">Quest state</div>
                <h3>Name and value</h3>
              </div>
              <small>Name plus character/NPC/zone scope forms the database primary key.</small>
            </div>

            <div class="spire-editor-grid spire-editor-grid--two">
              <div class="spire-editor-field">
                <label for="qglobal-name">QGlobal name <span>{{ draft.name.length }}/65</span></label>
                <input
                  id="qglobal-name"
                  v-model="draft.name"
                  maxlength="65"
                  class="form-control form-control-sm"
                  placeholder="raid_access"
                >
              </div>
              <div class="spire-editor-field">
                <label>Lifecycle</label>
                <div class="operational-expiry-control">
                  <button
                    type="button"
                    class="btn btn-sm"
                    :class="isPermanent ? 'btn-outline-warning' : 'btn-outline-secondary'"
                    @click="setPermanent"
                  >
                    <i class="fa fa-clock-o mr-1"></i>Permanent
                  </button>
                  <input
                    id="qglobal-expiry"
                    v-model="expiryLocal"
                    type="datetime-local"
                    class="form-control form-control-sm"
                    aria-label="QGlobal expiration"
                    @input="setExpiryFromLocal"
                  >
                </div>
                <span class="spire-editor-field-help">Permanent stores NULL. Existing nonpositive legacy timestamps remain recognizable as permanent.</span>
                <div class="operational-lifecycle-presets" aria-label="Expiration presets">
                  <button type="button" @click="setRelativeExpiry(1)">+1 hour</button>
                  <button type="button" @click="setRelativeExpiry(24)">+1 day</button>
                  <button type="button" @click="setRelativeExpiry(168)">+7 days</button>
                  <button type="button" @click="setRelativeExpiry(720)">+30 days</button>
                </div>
                <span v-if="draft.expdate" class="spire-editor-field-help">UTC {{ formatUTC(draft.expdate) }}</span>
              </div>
            </div>

            <div class="spire-editor-field mt-3">
              <label for="qglobal-value">Value <span>{{ draft.value.length }}/128</span></label>
              <textarea
                id="qglobal-value"
                v-model="draft.value"
                maxlength="128"
                rows="3"
                class="form-control form-control-sm operational-textarea qglobal-value"
                placeholder="enabled"
              ></textarea>
            </div>

            <div class="spire-editor-section-heading mt-4">
              <div>
                <div class="spire-editor-section-kicker">Wildcard scope</div>
                <h3>Character, NPC, and zone match</h3>
              </div>
              <small>Each zero means “any.” Combining IDs narrows the QGlobal to the exact intersection.</small>
            </div>

            <div class="operational-scope-grid qglobal-scope-grid">
              <scope-field
                v-for="field in scopeFields"
                :key="field.key"
                :field="field"
                :value="Number(draft[field.key] || 0)"
                :context="scopeContext(field.key)"
                id-prefix="qglobal"
                allow-any
                @input="setScopeValue(field.key, $event)"
                @lookup="openLookup(field)"
                @clear="clearScope(field.key)"
              />
            </div>

            <div v-if="detail && detail.overlaps && detail.overlaps.length" class="operational-inline-warning operational-inline-warning--danger mt-3">
              <i class="fa fa-code-fork"></i>
              <span>
                {{ detail.overlaps.length }} same-name scope{{ detail.overlaps.length === 1 ? '' : 's' }} can match some of the same requests.
                Review resolution order before changing this row.
              </span>
            </div>
            <div v-if="detail && detail.overlaps && detail.overlaps.length" class="operational-overlap-list">
              <button
                v-for="overlap in detail.overlaps"
                :key="overlap.identity"
                type="button"
                @click="selectRecord(overlap.identity)"
              >
                <span><strong>{{ overlap.name }}</strong><small>{{ compactScope(overlap) }}</small></span>
                <i class="fa fa-angle-right"></i>
              </button>
            </div>

            <details class="operational-collapsible" :open="usage.total > 0">
              <summary>
                <span><i class="fa fa-sitemap mr-1"></i>Related content</span>
                <small>{{ usage.total ? number(usage.total) + ' database consumers' : 'No installed-source references found' }}</small>
              </summary>
              <div v-if="unavailableUsageSources.length" class="operational-validation operational-validation--warning mb-2">
                <i class="fa fa-info-circle"></i>
                <span>{{ unavailableUsageSources.length }} optional source{{ unavailableUsageSources.length === 1 ? ' is' : 's are' }} unavailable in this schema.</span>
              </div>
              <div class="operational-usage-grid qglobal-usage-grid">
              <div v-for="source in availableUsageSources" :key="source.key" class="operational-usage-source">
                <div class="operational-usage-source__heading">
                  <strong>{{ source.label }}</strong>
                  <span>{{ number(source.count) }}</span>
                </div>
                <template v-if="source.samples && source.samples.length">
                  <div v-for="sample in source.samples" :key="source.key + '-' + sample.id" class="operational-usage-row">
                    <strong>{{ sample.label }}</strong>
                    <small>{{ sample.context }}<template v-if="sample.value"> · expects {{ sample.value }}</template></small>
                  </div>
                </template>
                <div v-else class="operational-empty-inline">
                  <i class="fa fa-check-circle"></i>No matching records.
                </div>
              </div>
              </div>
            </details>

            <div class="spire-editor-field operational-audit-field">
              <label for="qglobal-reason">Required audit reason <span>{{ draft.reason.length }}/240</span></label>
              <textarea
                id="qglobal-reason"
                v-model="draft.reason"
                maxlength="240"
                rows="2"
                class="form-control form-control-sm"
                placeholder="Explain the quest-state correction or content operation…"
              ></textarea>
            </div>

            <audit-trail
              v-if="!creating"
              :entries="auditEntries"
              :total="auditTotal"
              :loading="loadingAudit"
              :error="auditError"
              @open="loadAudit"
              @refresh="loadAudit(true)"
            />
          </div>
        </eq-window>
      </main>
    </div>

    <b-modal
      ref="lookupModal"
      :title="lookupTitle"
      modal-class="spire-editor-modal"
      content-class="spire-editor-modal-content"
      centered
      hide-footer
      @hidden="resetLookup"
    >
      <div class="spire-editor-search mb-2">
        <i class="fa fa-search"></i>
        <input
          ref="lookupInput"
          v-model.trim="lookupQuery"
          class="form-control form-control-sm"
          :placeholder="'Search ' + lookupTitle.toLowerCase() + '…'"
          @input="queueLookup"
        >
      </div>
      <div class="operational-lookup-results">
        <button
          v-for="result in lookupResults"
          :key="result.id"
          type="button"
          class="operational-lookup-result"
          @click="chooseLookup(result)"
        >
          <i :class="lookupIcon"></i>
          <span><strong>{{ result.name }}</strong><small>{{ result.context }}</small></span>
          <small>#{{ result.id }}</small>
        </button>
        <div v-if="lookupLoading" class="spire-editor-directory-state"><i class="fa fa-spinner fa-spin"></i>Searching…</div>
        <div v-else-if="lookupError" class="spire-editor-directory-state spire-editor-directory-state--error">{{ lookupError }}</div>
        <div v-else-if="!lookupResults.length" class="spire-editor-directory-state">No matching records.</div>
      </div>
    </b-modal>

    <b-modal
      ref="deleteModal"
      title="Delete QGlobal"
      modal-class="spire-editor-modal"
      content-class="spire-editor-modal-content"
      centered
      hide-footer
      @hidden="resetDelete"
    >
      <div class="operational-delete">
        <div class="operational-delete-warning">
          <i class="fa fa-exclamation-triangle"></i>
          <div>
            <strong>This removes live quest state.</strong>
            <span>The exact character/NPC/zone/name row is locked and rechecked before deletion.</span>
          </div>
        </div>
        <label v-if="usage.total" class="d-flex align-items-start">
          <input v-model="allowReferencedDelete" type="checkbox" class="mr-2 mt-1">
          <span class="small">
            I reviewed {{ usage.total }} database consumer{{ usage.total === 1 ? '' : 's' }} and the same-name scope variants.
          </span>
        </label>
        <div class="guarded-delete-slider" :class="{ 'guarded-delete-slider--confirmed': deleteConfirmed }">
          <div class="guarded-delete-slider__heading">
            <label for="qglobal-delete-slider">{{ deleteConfirmed ? 'Deletion armed' : 'Slide to confirm' }}</label>
            <span>{{ deleteConfirmed ? 'Ready' : deleteSlider + '%' }}</span>
          </div>
          <input
            id="qglobal-delete-slider"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="deleteSlider"
            :style="{ '--delete-progress': deleteSlider + '%' }"
            :aria-valuetext="deleteConfirmed ? 'Deletion armed' : deleteSlider + ' percent'"
            @input="updateDeleteSlider"
          >
          <div class="guarded-delete-slider__help">
            <span><i class="fa fa-lock mr-1"></i>Safe</span>
            <strong>{{ deleteConfirmed ? 'Release is armed.' : 'Move fully right to arm deletion.' }}</strong>
            <span><i class="fa fa-unlock-alt mr-1"></i>Confirm</span>
          </div>
        </div>
        <div class="spire-editor-field">
          <label for="qglobal-delete-reason">Required audit reason</label>
          <textarea
            id="qglobal-delete-reason"
            v-model="deleteReason"
            maxlength="240"
            rows="3"
            class="form-control form-control-sm"
            placeholder="Explain why this quest state is being removed…"
          ></textarea>
        </div>
        <div class="operational-delete-actions">
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="$refs.deleteModal.hide()">Cancel</button>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            :disabled="saving || !deleteConfirmed || !deleteReason.trim() || (usage.total > 0 && !allowReferencedDelete)"
            @click="confirmDelete"
          >
            <i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-trash'"></i>Delete QGlobal
          </button>
        </div>
      </div>
    </b-modal>

    <discard-modal
      ref="discardModal"
      message="Discard the pending QGlobal draft to continue to another match identity or page."
      @discard="confirmDiscard"
      @keep="keepEditing"
    />

    <conflict-modal
      ref="conflictModal"
      :changes="conflictChanges"
      @reload="acceptConflictCurrent"
      @preserve="preserveConflictDraft"
    />

    <transition name="spire-editor-fade">
      <div v-if="notification.message" class="spire-editor-notification" :class="{ error: notification.type === 'error' }" role="status">
        <i :class="notification.type === 'error' ? 'fa fa-exclamation-triangle' : 'fa fa-check-circle'"></i>
        <span>{{ notification.message }}</span>
      </div>
    </transition>
  </content-area>
</template>

<script>
  import ContentArea from '@/components/layout/ContentArea.vue'
  import EqWindow from '@/components/eq-ui/EQWindow.vue'
  import ActionDock from '@/components/editors/OperationalActionDock.vue'
  import AuditTrail from '@/components/editors/OperationalAuditTrail.vue'
  import ConflictModal from '@/components/editors/OperationalConflictModal.vue'
  import DiscardModal from '@/components/editors/OperationalDiscardModal.vue'
  import ScopeField from '@/components/editors/OperationalScopeField.vue'
  import { SpireApi } from '@/app/api/spire-api'

  const clone = value => JSON.parse(JSON.stringify(value))

  function emptySummary () {
    return { total: 0, global: 0, scoped: 0, permanent: 0, active: 0, expired: 0 }
  }

  function emptyUsage () {
    return { total: 0, sources: [] }
  }

  function emptyGlobal () {
    return {
      identity: '',
      charid: 0,
      npcid: 0,
      zoneid: 0,
      name: '',
      value: '',
      expdate: null,
      reason: ''
    }
  }

  function snapshot (record) {
    return {
      charid: Number(record.charid || 0),
      npcid: Number(record.npcid || 0),
      zoneid: Number(record.zoneid || 0),
      name: record.name || '',
      value: record.value || '',
      expdate: record.expdate === null || typeof record.expdate === 'undefined' ? null : Number(record.expdate)
    }
  }

  export default {
    name: 'QGlobalEditor',
    components: { ContentArea, EqWindow, ActionDock, AuditTrail, ConflictModal, DiscardModal, ScopeField },
    data () {
      return {
        summary: emptySummary(),
        records: [],
        totalRecords: 0,
        currentPage: 1,
        pageSize: 40,
        search: '',
        scopeFilter: '',
        stateFilter: 'active',
        selectedIdentity: '',
        loadingDirectory: false,
        loadingDetail: false,
        saving: false,
        directoryError: '',
        detailError: '',
        detail: null,
        draft: null,
        original: null,
        creating: false,
        compactView: 'directory',
        expiryLocal: '',
        scopeContexts: {},
        pendingDiscardAction: null,
        pendingDiscardCancel: null,
        allowRouteUpdate: false,
        searchTimer: null,
        lookupTimer: null,
        lookupField: null,
        lookupQuery: '',
        lookupResults: [],
        lookupLoading: false,
        lookupError: '',
        deleteSlider: 0,
        deleteReason: '',
        allowReferencedDelete: false,
        auditEntries: [],
        auditTotal: 0,
        loadingAudit: false,
        auditError: '',
        conflictLatest: null,
        conflictDraft: null,
        conflictChanges: [],
        notification: { message: '', type: 'success', timer: null },
        scopeFields: [
          { key: 'charid', label: 'Character', icon: 'ra ra-player', lookup: 'characters', max: 2147483647, help: '0 · any character' },
          { key: 'npcid', label: 'NPC', icon: 'ra ra-hood', lookup: 'npcs', max: 2147483647, help: '0 · any NPC' },
          { key: 'zoneid', label: 'Zone', icon: 'ra ra-tower', lookup: 'zones', max: 2147483647, help: '0 · any zone' }
        ]
      }
    },
    computed: {
      totalPages () {
        return Math.max(1, Math.ceil(this.totalRecords / this.pageSize))
      },
      usage () {
        return this.detail && this.detail.usage ? this.detail.usage : emptyUsage()
      },
      availableUsageSources () {
        return (this.usage.sources || []).filter(source => source.available)
      },
      unavailableUsageSources () {
        return (this.usage.sources || []).filter(source => !source.available)
      },
      draftSnapshot () {
        return this.draft ? snapshot(this.draft) : null
      },
      changedFieldCount () {
        if (!this.draftSnapshot || !this.original) return 0
        return Object.keys(this.draftSnapshot).filter(key => JSON.stringify(this.draftSnapshot[key]) !== JSON.stringify(this.original[key])).length
      },
      hasEntityChanges () {
        return this.changedFieldCount > 0
      },
      hasUnsavedChanges () {
        if (!this.draft || !this.original) return false
        return this.hasEntityChanges || Boolean(this.draft.reason.trim())
      },
      canSave () {
        return this.draft && this.draft.name.trim() && this.draft.reason.trim() && this.hasEntityChanges
      },
      saveReadiness () {
        if (this.saving) return { state: 'saving', title: this.creating ? 'Creating QGlobal…' : 'Saving audited change…', detail: 'The exact match identity is being written transactionally.' }
        if (!this.hasUnsavedChanges) return { state: 'idle', title: 'No pending changes', detail: 'Change a field to begin an audited quest-state edit.' }
        if (!this.draft.name.trim()) return { state: 'blocked', title: 'QGlobal name required', detail: 'Enter the exact quest-global name before saving.' }
        if (!this.hasEntityChanges) return { state: 'blocked', title: 'Change a QGlobal field', detail: 'An audit reason alone does not create a data change.' }
        if (!this.draft.reason.trim()) return { state: 'blocked', title: 'Audit reason required', detail: `${this.changedFieldCount} ${this.changedFieldCount === 1 ? 'field is' : 'fields are'} changed; explain why before saving.` }
        return { state: 'ready', title: this.creating ? 'Ready to create' : 'Ready to save', detail: `${this.changedFieldCount} ${this.changedFieldCount === 1 ? 'field' : 'fields'} changed with an audit reason.` }
      },
      isPermanent () {
        return !this.draft || this.draft.expdate === null || Number(this.draft.expdate) <= 0
      },
      isExpired () {
        return this.draft && this.draft.expdate !== null && Number(this.draft.expdate) > 0 &&
          Number(this.draft.expdate) <= Math.floor(Date.now() / 1000)
      },
      scopeValues () {
        if (!this.draft) return []
        return this.scopeFields.filter(field => Number(this.draft[field.key] || 0) > 0)
      },
      scopeKind () {
        if (!this.scopeValues.length) return 'full wildcard'
        if (this.scopeValues.length > 1) return 'composite'
        return {
          charid: 'character',
          npcid: 'NPC',
          zoneid: 'zone'
        }[this.scopeValues[0].key]
      },
      scopeLabels () {
        if (!this.scopeValues.length) return ['Any character', 'Any NPC', 'Any zone']
        return this.scopeFields.map(field => {
          if (!Number(this.draft[field.key] || 0)) return `Any ${field.label.toLowerCase()}`
          return this.scopeContext(field.key) || `${field.label} #${this.draft[field.key]}`
        })
      },
      lookupTitle () {
        return this.lookupField ? `Find ${this.lookupField.label}` : 'Find scope'
      },
      lookupIcon () {
        return this.lookupField ? this.lookupField.icon : 'fa fa-search'
      },
      deleteConfirmed () {
        return this.deleteSlider >= 100
      }
    },
    watch: {
      '$route.query.qglobal' (value) {
        if (value && value !== this.selectedIdentity) this.selectRecord(value, true)
      }
    },
    created () {
      window.addEventListener('beforeunload', this.onBeforeUnload)
      window.addEventListener('keydown', this.onShortcut)
      this.search = String(this.$route.query.q || '')
      this.scopeFilter = String(this.$route.query.scope || '')
      this.stateFilter = this.$route.query.state === 'all' ? '' : String(this.$route.query.state || 'active')
      this.currentPage = Math.max(1, Number(this.$route.query.page || 1))
      const requested = String(this.$route.query.qglobal || '')
      this.loadDirectory().then(() => {
        if (requested) this.selectRecord(requested, true)
        else if (this.records.length) this.selectRecord(this.records[0].identity, true)
      })
    },
    beforeDestroy () {
      window.removeEventListener('beforeunload', this.onBeforeUnload)
      window.removeEventListener('keydown', this.onShortcut)
      clearTimeout(this.searchTimer)
      clearTimeout(this.lookupTimer)
      clearTimeout(this.notification.timer)
    },
    beforeRouteLeave (to, from, next) {
      if (!this.hasUnsavedChanges) {
        next()
        return
      }
      this.requestDiscard(() => next(), () => next(false))
    },
    beforeRouteUpdate (to, from, next) {
      if (this.allowRouteUpdate) {
        this.allowRouteUpdate = false
        next()
        return
      }
      if (!this.hasUnsavedChanges) {
        next()
        return
      }
      this.requestDiscard(() => next(), () => next(false))
    },
    methods: {
      async loadDirectory () {
        this.loadingDirectory = true
        this.directoryError = ''
        try {
          const response = await SpireApi.v1().get('/qglobal-editor/globals', {
            params: {
              q: this.search,
              scope: this.scopeFilter,
              state: this.stateFilter,
              page: this.currentPage,
              limit: this.pageSize
            }
          })
          this.records = response.data.data || []
          this.totalRecords = Number(response.data.total || 0)
          this.summary = response.data.summary || emptySummary()
          if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages
            return this.loadDirectory()
          }
        } catch (error) {
          this.directoryError = this.apiError(error)
        } finally {
          this.loadingDirectory = false
        }
      },
      queueSearch () {
        clearTimeout(this.searchTimer)
        this.searchTimer = setTimeout(() => {
          this.currentPage = 1
          this.syncDirectoryQuery()
          this.loadDirectory()
        }, 220)
      },
      changePage (page) {
        this.currentPage = page
        this.syncDirectoryQuery()
        this.loadDirectory()
      },
      applySummaryFilter (scope, state) {
        this.scopeFilter = scope
        this.stateFilter = state
        this.currentPage = 1
        this.syncDirectoryQuery()
        this.loadDirectory()
      },
      syncDirectoryQuery () {
        const query = { ...this.$route.query }
        if (this.search) query.q = this.search
        else delete query.q
        if (this.scopeFilter) query.scope = this.scopeFilter
        else delete query.scope
        query.state = this.stateFilter || 'all'
        if (this.currentPage > 1) query.page = String(this.currentPage)
        else delete query.page
        this.allowRouteUpdate = true
        this.$router.replace({ query }).catch(() => {}).finally(() => { this.allowRouteUpdate = false })
      },
      async selectRecord (identity, force) {
        if (!force && this.hasUnsavedChanges) {
          this.requestDiscard(() => this.selectRecord(identity, true))
          return
        }
        this.compactView = 'inspector'
        this.selectedIdentity = identity
        this.creating = false
        this.draft = null
        this.original = null
        this.detail = null
        this.auditEntries = []
        this.auditTotal = 0
        this.auditError = ''
        this.detailError = ''
        this.loadingDetail = true
        try {
          const response = await SpireApi.v1().get(`/qglobal-editor/global/${identity}`)
          this.applyDetail(response.data)
          if (String(this.$route.query.qglobal || '') !== identity) {
            this.$router.replace({ query: { ...this.$route.query, qglobal: identity } }).catch(() => {})
          }
        } catch (error) {
          this.detailError = this.apiError(error)
        } finally {
          this.loadingDetail = false
        }
      },
      applyDetail (detail) {
        this.detail = detail
        this.draft = { ...emptyGlobal(), ...clone(detail.global), reason: '' }
        this.original = snapshot(this.draft)
        this.expiryLocal = this.toLocalInput(this.draft.expdate)
        this.scopeContexts = {
          charid: detail.global.character_name ? `Character ${detail.global.character_name}` : '',
          npcid: detail.global.npc_name ? `NPC ${String(detail.global.npc_name).replace(/_/g, ' ')}` : '',
          zoneid: detail.global.zone_name ? `Zone ${detail.global.zone_name}` : ''
        }
      },
      createDraft (source, force) {
        if (!force && this.hasUnsavedChanges) {
          this.requestDiscard(() => this.createDraft(source, true))
          return
        }
        const next = source
          ? { ...emptyGlobal(), ...snapshot(source), name: `${source.name}_copy`, identity: '' }
          : emptyGlobal()
        next.reason = ''
        this.creating = true
        this.selectedIdentity = ''
        this.detail = { global: next, usage: emptyUsage(), overlaps: [], same_name_count: 0 }
        this.draft = next
        this.original = source ? snapshot(source) : snapshot(emptyGlobal())
        this.compactView = 'inspector'
        this.expiryLocal = this.toLocalInput(next.expdate)
        this.scopeContexts = source ? { ...this.scopeContexts } : {}
        const query = { ...this.$route.query }
        delete query.qglobal
        this.allowRouteUpdate = true
        this.$router.replace({ query }).catch(() => {}).finally(() => { this.allowRouteUpdate = false })
      },
      resetDraft () {
        if (this.creating) {
          this.draft = emptyGlobal()
          this.original = snapshot(this.draft)
          this.expiryLocal = ''
          this.scopeContexts = {}
          return
        }
        this.reloadSelected()
      },
      reloadSelected () {
        if (this.selectedIdentity) this.selectRecord(this.selectedIdentity, true)
      },
      async save () {
        if (!this.canSave) return
        this.saving = true
        try {
          const payload = {
            global: { ...this.draftSnapshot, reason: this.draft.reason.trim() },
            expected: this.creating ? null : this.original
          }
          const response = this.creating
            ? await SpireApi.v1().put('/qglobal-editor/global', payload)
            : await SpireApi.v1().patch(`/qglobal-editor/global/${this.selectedIdentity}`, payload)
          const detail = response.data.detail
          const created = this.creating
          this.selectedIdentity = detail.global.identity
          this.creating = false
          this.applyDetail(detail)
          await this.loadDirectory()
          this.$router.replace({ query: { ...this.$route.query, qglobal: this.selectedIdentity } }).catch(() => {})
          this.notify(created ? 'QGlobal created with an audit record.' : 'QGlobal saved with an audit record.')
        } catch (error) {
          if (this.isStaleConflict(error)) await this.prepareConflict()
          else this.notify(this.apiError(error), 'error')
        } finally {
          this.saving = false
        }
      },
      setPermanent () {
        this.draft.expdate = null
        this.expiryLocal = ''
      },
      setRelativeExpiry (hours) {
        const timestamp = Math.floor(Date.now() / 1000) + (Number(hours) * 60 * 60)
        this.draft.expdate = timestamp
        this.expiryLocal = this.toLocalInput(timestamp)
      },
      setExpiryFromLocal () {
        if (!this.expiryLocal) {
          this.setPermanent()
          return
        }
        const timestamp = Math.floor(new Date(this.expiryLocal).getTime() / 1000)
        this.draft.expdate = Number.isFinite(timestamp) ? timestamp : null
      },
      setScopeValue (key, value) {
        this.$set(this.draft, key, Number(value || 0))
        if (!value) this.$delete(this.scopeContexts, key)
      },
      clearScope (key) {
        this.$set(this.draft, key, 0)
        this.$delete(this.scopeContexts, key)
      },
      scopeContext (key) {
        return this.scopeContexts[key] || ''
      },
      openLookup (field) {
        this.lookupField = field
        this.lookupQuery = ''
        this.lookupResults = []
        this.lookupError = ''
        this.$refs.lookupModal.show()
        this.$nextTick(() => {
          if (this.$refs.lookupInput) this.$refs.lookupInput.focus()
          this.loadLookup()
        })
      },
      resetLookup () {
        clearTimeout(this.lookupTimer)
        this.lookupField = null
        this.lookupQuery = ''
        this.lookupResults = []
        this.lookupError = ''
      },
      queueLookup () {
        clearTimeout(this.lookupTimer)
        this.lookupTimer = setTimeout(this.loadLookup, 180)
      },
      async loadLookup () {
        if (!this.lookupField) return
        this.lookupLoading = true
        this.lookupError = ''
        try {
          const response = await SpireApi.v1().get(`/qglobal-editor/lookups/${this.lookupField.lookup}`, {
            params: { q: this.lookupQuery }
          })
          this.lookupResults = response.data.data || []
        } catch (error) {
          this.lookupError = this.apiError(error)
        } finally {
          this.lookupLoading = false
        }
      },
      chooseLookup (result) {
        this.$set(this.draft, this.lookupField.key, Number(result.id))
        this.$set(this.scopeContexts, this.lookupField.key, `${this.lookupField.label} ${result.name}`)
        this.$refs.lookupModal.hide()
      },
      openDelete () {
        this.resetDelete()
        this.$refs.deleteModal.show()
      },
      resetDelete () {
        this.deleteSlider = 0
        this.deleteReason = ''
        this.allowReferencedDelete = false
      },
      updateDeleteSlider (event) {
        const value = Number(event.target.value || 0)
        this.deleteSlider = value >= 96 ? 100 : value
        event.target.value = this.deleteSlider
      },
      async confirmDelete () {
        if (!this.deleteConfirmed || !this.deleteReason.trim()) return
        this.saving = true
        try {
          await SpireApi.v1().delete(`/qglobal-editor/global/${this.selectedIdentity}`, {
            data: {
              global: { ...this.draftSnapshot, reason: this.deleteReason.trim() },
              expected: this.original,
              confirm: true,
              allow_referenced_name: this.allowReferencedDelete
            }
          })
          this.$refs.deleteModal.hide()
          this.selectedIdentity = ''
          this.draft = null
          this.original = null
          this.detail = null
          this.compactView = 'directory'
          const query = { ...this.$route.query }
          delete query.qglobal
          this.$router.replace({ query }).catch(() => {})
          await this.loadDirectory()
          if (this.records.length) await this.selectRecord(this.records[0].identity, true)
          this.notify('QGlobal deleted with an audit record.')
        } catch (error) {
          if (this.isStaleConflict(error)) {
            this.$refs.deleteModal.hide()
            await this.prepareConflict()
          } else {
            this.notify(this.apiError(error), 'error')
          }
        } finally {
          this.saving = false
        }
      },
      compactScope (record) {
        if (record.scope_kind === 'global') return 'Any character · Any NPC · Any zone'
        const values = []
        if (record.charid) values.push(`Character #${record.charid}`)
        if (record.npcid) values.push(`NPC #${record.npcid}`)
        if (record.zoneid) values.push(`Zone #${record.zoneid}`)
        return values.join(' · ')
      },
      showDirectory () {
        this.compactView = 'directory'
      },
      async loadAudit (force) {
        if (!this.selectedIdentity || this.creating || (this.auditEntries.length && !force)) return
        this.loadingAudit = true
        this.auditError = ''
        try {
          const response = await SpireApi.v1().get(`/qglobal-editor/audit/${this.selectedIdentity}`, {
            params: { page: 1, limit: 10 }
          })
          this.auditEntries = response.data.data || []
          this.auditTotal = Number(response.data.total || 0)
        } catch (error) {
          this.auditError = this.apiError(error)
        } finally {
          this.loadingAudit = false
        }
      },
      isStaleConflict (error) {
        return error && error.response && error.response.status === 409 &&
          /changed after it was loaded/i.test(this.apiError(error))
      },
      async prepareConflict () {
        const localDraft = clone(this.draft)
        try {
          const response = await SpireApi.v1().get(`/qglobal-editor/global/${this.selectedIdentity}`)
          this.conflictLatest = response.data
          this.conflictDraft = localDraft
          const latest = snapshot(response.data.global)
          const labels = {
            charid: 'Character',
            npcid: 'NPC',
            zoneid: 'Zone',
            name: 'QGlobal name',
            value: 'Value',
            expdate: 'Expiration'
          }
          this.conflictChanges = Object.keys(latest)
            .filter(key => JSON.stringify(localDraft[key]) !== JSON.stringify(latest[key]))
            .map(key => ({ key, label: labels[key] || key, draft: localDraft[key], current: latest[key] }))
          this.$refs.conflictModal.show()
        } catch (error) {
          this.notify(`The record changed and the current version could not be loaded. ${this.apiError(error)}`, 'error')
        }
      },
      acceptConflictCurrent () {
        if (!this.conflictLatest) return
        this.applyDetail(this.conflictLatest)
        this.conflictLatest = null
        this.conflictDraft = null
        this.notify('Current server version loaded.')
      },
      preserveConflictDraft () {
        if (!this.conflictLatest || !this.conflictDraft) return
        const latest = this.conflictLatest
        this.detail = latest
        this.original = snapshot(latest.global)
        this.draft = this.conflictDraft
        this.conflictLatest = null
        this.conflictDraft = null
        this.notify('Draft preserved against the current server version. Review before saving.')
      },
      onShortcut (event) {
        const target = event.target
        const typing = target && /input|textarea|select/i.test(target.tagName)
        if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
          event.preventDefault()
          this.compactView = 'directory'
          this.$nextTick(() => {
            const search = document.getElementById('qglobal-search')
            if (search) search.focus()
          })
          return
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
          event.preventDefault()
          if (this.canSave && !this.saving) this.save()
        }
      },
      onBeforeUnload (event) {
        if (!this.hasUnsavedChanges) return
        event.preventDefault()
        event.returnValue = ''
      },
      requestDiscard (action, cancel) {
        if (!this.hasUnsavedChanges) {
          action()
          return
        }
        this.pendingDiscardAction = action
        this.pendingDiscardCancel = cancel || null
        this.$refs.discardModal.show()
      },
      confirmDiscard () {
        const action = this.pendingDiscardAction
        this.pendingDiscardAction = null
        this.pendingDiscardCancel = null
        if (action) action()
      },
      keepEditing () {
        const cancel = this.pendingDiscardCancel
        this.pendingDiscardAction = null
        this.pendingDiscardCancel = null
        if (cancel) cancel()
      },
      formatDate (timestamp) {
        if (timestamp === null || Number(timestamp) <= 0) return 'Never'
        return new Date(Number(timestamp) * 1000).toLocaleString()
      },
      formatUTC (timestamp) {
        if (timestamp === null || Number(timestamp) <= 0) return 'Never'
        return new Date(Number(timestamp) * 1000).toISOString().replace('T', ' ').replace('.000Z', ' UTC')
      },
      toLocalInput (timestamp) {
        if (timestamp === null || Number(timestamp) <= 0) return ''
        const date = new Date(Number(timestamp) * 1000)
        const offset = date.getTimezoneOffset() * 60000
        return new Date(date.getTime() - offset).toISOString().slice(0, 16)
      },
      number (value) {
        return Number(value || 0).toLocaleString()
      },
      notify (message, type) {
        clearTimeout(this.notification.timer)
        this.notification = { message, type: type || 'success', timer: null }
        this.notification.timer = setTimeout(() => { this.notification.message = '' }, 5000)
      },
      apiError (error) {
        return error && error.response && error.response.data && error.response.data.error
          ? error.response.data.error
          : 'The QGlobal request could not be completed.'
      }
    }
  }
</script>

<style>
@import '../../assets/css/content-editor-workspace.css';
@import '../../assets/css/operational-editors.css';

.qglobal-editor-page .spire-editor-directory-aside {
  color: #7f8b95;
  font-size: 8px;
  max-width: 78px;
}

.qglobal-editor-page .operational-row-badges {
  margin-top: 3px;
}

.qglobal-value {
  min-height: 82px;
}

.qglobal-scope-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.qglobal-usage-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1180px) {
  .qglobal-scope-grid,
  .qglobal-usage-grid {
    grid-template-columns: 1fr;
  }
}
</style>
