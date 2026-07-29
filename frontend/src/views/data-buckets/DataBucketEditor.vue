<template>
  <content-area class="spire-editor-page operational-editor-page data-bucket-editor-page">
    <div class="spire-editor-toolbar">
      <div>
        <div class="spire-editor-kicker">World data · persistent state</div>
        <h1 class="spire-editor-title"><i class="fa fa-database mr-1"></i> Data Buckets</h1>
        <p class="spire-editor-subtitle">
          Inspect and maintain scoped server state without losing composite scope or expiration context.
        </p>
      </div>
      <div class="spire-editor-summary" aria-label="Data bucket summary">
        <span><strong>{{ number(summary.total) }}</strong> total</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(summary.global) }}</strong> global</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(summary.expiring) }}</strong> expiring</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(summary.expired) }}</strong> expired</span>
      </div>
    </div>

    <div class="spire-editor-workspace">
      <aside class="spire-editor-directory">
        <eq-window title="Bucket Directory">
          <div class="spire-editor-directory-controls">
            <div class="spire-editor-search">
              <i class="fa fa-search"></i>
              <input
                id="data-bucket-search"
                v-model.trim="search"
                class="form-control form-control-sm"
                placeholder="Search key, value, scope, or ID…"
                @input="queueSearch"
              >
              <button
                v-if="search"
                class="spire-editor-search-clear"
                type="button"
                aria-label="Clear data bucket search"
                @click="search = ''; currentPage = 1; loadDirectory()"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <b-button size="sm" variant="outline-warning" data-testid="data-bucket-new" @click="createDraft()">
              <i class="fa fa-plus mr-1"></i>New
            </b-button>
          </div>

          <div class="operational-filter-row">
            <select
              id="data-bucket-scope-filter"
              v-model="scopeFilter"
              class="form-control form-control-sm"
              aria-label="Filter data buckets by scope"
              @change="currentPage = 1; loadDirectory()"
            >
              <option value="">All scopes</option>
              <option value="global">Global</option>
              <option value="account">Account</option>
              <option value="character">Character</option>
              <option value="npc">NPC</option>
              <option value="bot">Bot</option>
              <option value="zone">Zone</option>
              <option value="instance">Instance</option>
              <option value="composite">Composite</option>
            </select>
            <select
              id="data-bucket-state-filter"
              v-model="stateFilter"
              class="form-control form-control-sm"
              aria-label="Filter data buckets by expiration"
              @change="currentPage = 1; loadDirectory()"
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

          <div class="spire-editor-directory-list" data-testid="data-bucket-directory">
            <button
              v-for="record in records"
              :key="record.id"
              type="button"
              class="spire-editor-directory-row"
              :class="{ active: !creating && Number(selectedID) === Number(record.id) }"
              @click="selectRecord(record.id)"
            >
              <span class="spire-editor-directory-icon">
                <i :class="record.scope_kind === 'global' ? 'fa fa-globe' : 'fa fa-key'"></i>
              </span>
              <span class="spire-editor-directory-body">
                <span class="spire-editor-directory-name">{{ record.key || '(unnamed bucket)' }}</span>
                <span class="spire-editor-directory-detail">{{ compactScope(record) }}</span>
                <span class="operational-row-badges">
                  <span class="operational-badge" :class="{ 'operational-badge--gold': record.scope_kind === 'global' }">
                    {{ record.scope_kind }}
                  </span>
                  <span v-if="record.expired" class="operational-badge operational-badge--danger">expired</span>
                  <span v-else-if="record.permanent" class="operational-badge operational-badge--muted">permanent</span>
                </span>
              </span>
              <span class="spire-editor-directory-aside">#{{ record.id }}</span>
            </button>

            <div v-if="directoryError" class="spire-editor-directory-state spire-editor-directory-state--error" role="alert">
              <i class="fa fa-exclamation-triangle"></i>
              <span>{{ directoryError }}</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="loadDirectory">Retry</button>
            </div>
            <div v-else-if="loadingDirectory && !records.length" class="spire-editor-directory-state">
              <i class="fa fa-spinner fa-spin"></i><span>Loading data buckets…</span>
            </div>
            <div v-else-if="!records.length" class="spire-editor-directory-state">
              <i class="fa fa-database"></i>
              <span>{{ search ? 'No buckets match this search.' : 'No buckets exist in this view.' }}</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="createDraft()">Create a bucket</button>
            </div>
          </div>

          <nav v-if="totalPages > 1" class="spire-editor-pagination" aria-label="Data bucket pages">
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
        <eq-window v-if="!draft && detailError" title="Data Bucket Workspace">
          <div class="spire-editor-empty spire-editor-empty--error" role="alert">
            <div class="spire-editor-empty__sigil"><i class="fa fa-exclamation-triangle"></i></div>
            <h3>Bucket could not be loaded</h3>
            <p>{{ detailError }}</p>
            <b-button size="sm" variant="outline-warning" @click="reloadSelected">
              <i class="fa fa-refresh mr-1"></i>Retry
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="!draft && !loadingDetail" title="Data Bucket Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-key"></i></div>
            <h3>Select a data bucket</h3>
            <p>Review its exact scope, lifecycle, consumers, and stored value before making an audited change.</p>
            <b-button size="sm" variant="outline-warning" @click="createDraft()">
              <i class="fa fa-plus mr-1"></i>Create bucket
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="loadingDetail && !draft" title="Data Bucket Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading bucket context…</h3>
          </div>
        </eq-window>

        <eq-window v-else title="Data Bucket" data-testid="data-bucket-inspector">
          <div class="spire-editor-header">
            <div class="spire-editor-identity">
              <span class="spire-editor-identity-icon"><i class="fa fa-key"></i></span>
              <div>
                <div class="spire-editor-eyebrow">
                  {{ creating ? 'New bucket' : 'Bucket #' + selectedID }}
                  <span v-if="hasUnsavedChanges" class="spire-editor-unsaved"><i class="fa fa-circle"></i> Unsaved</span>
                </div>
                <h2>{{ draft.key || 'Untitled bucket' }}</h2>
                <div class="operational-identity-meta">
                  <span class="operational-badge">{{ scopeKind }}</span>
                  <span v-if="isExpired" class="operational-badge operational-badge--danger">expired</span>
                  <span v-else-if="isPermanent" class="operational-badge operational-badge--muted">permanent</span>
                  <span v-else class="operational-badge operational-badge--gold">expires {{ formatDate(draft.expires) }}</span>
                </div>
              </div>
            </div>
            <div class="spire-editor-actions">
              <b-button v-if="!creating" size="sm" variant="outline-secondary" :disabled="saving" @click="createDraft(draft)">
                <i class="fa fa-copy mr-1"></i>Copy
              </b-button>
              <b-button v-if="!creating" size="sm" variant="outline-danger" :disabled="saving || hasUnsavedChanges" @click="openDelete">
                <i class="fa fa-trash mr-1"></i>Delete
              </b-button>
              <b-button size="sm" variant="outline-secondary" :disabled="saving || !hasUnsavedChanges" @click="resetDraft">
                <i class="fa fa-undo mr-1"></i>Revert
              </b-button>
              <b-button size="sm" variant="warning" :disabled="saving || !canSave" data-testid="data-bucket-save" @click="save">
                <i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"></i>{{ creating ? 'Create' : 'Save' }}
              </b-button>
            </div>
          </div>

          <div class="spire-editor-panel">
            <div class="operational-preview-strip">
              <span>Effective scope</span>
              <div class="operational-scope-preview">
                <span v-for="label in scopeLabels" :key="label" class="operational-badge">{{ label }}</span>
              </div>
            </div>

            <div class="spire-editor-section-heading">
              <div>
                <div class="spire-editor-section-kicker">Stored state</div>
                <h3>Key and value</h3>
              </div>
              <small>The exact scope combination is part of the unique bucket identity.</small>
            </div>

            <div class="spire-editor-grid spire-editor-grid--two">
              <div class="spire-editor-field">
                <label for="data-bucket-key">Bucket key <span>{{ draft.key.length }}/100</span></label>
                <input
                  id="data-bucket-key"
                  v-model="draft.key"
                  maxlength="100"
                  class="form-control form-control-sm"
                  placeholder="event.progression.stage"
                >
                <span class="spire-editor-field-help">Names are case-sensitive according to the connected database collation.</span>
              </div>
              <div class="spire-editor-field">
                <label>Lifecycle</label>
                <div class="operational-expiry-control">
                  <button
                    type="button"
                    class="btn btn-sm"
                    :class="expiryMode === 'permanent' ? 'btn-outline-warning' : 'btn-outline-secondary'"
                    @click="setPermanent"
                  >
                    <i class="fa fa-clock-o mr-1"></i>Permanent
                  </button>
                  <input
                    id="data-bucket-expiry"
                    v-model="expiryLocal"
                    type="datetime-local"
                    class="form-control form-control-sm"
                    aria-label="Data bucket expiration"
                    @input="setExpiryFromLocal"
                  >
                </div>
                <span class="spire-editor-field-help">Permanent records store expiration 0. Dates use your local timezone.</span>
              </div>
            </div>

            <div class="spire-editor-field mt-3">
              <div class="operational-field-tools">
                <label for="data-bucket-value">Value <span>{{ draft.value.length }}/65,535</span></label>
                <button type="button" title="Format valid JSON" @click="formatJSON">
                  <i class="fa fa-code mr-1"></i>Format JSON
                </button>
              </div>
              <textarea
                id="data-bucket-value"
                v-model="draft.value"
                maxlength="65535"
                class="form-control form-control-sm operational-textarea"
                placeholder="String, number, or serialized state…"
              ></textarea>
            </div>

            <div class="spire-editor-section-heading mt-4">
              <div>
                <div class="spire-editor-section-kicker">Scope bindings</div>
                <h3>Where this bucket applies</h3>
              </div>
              <small>Zero means unbound. Multiple nonzero fields intentionally form a composite scope.</small>
            </div>

            <div class="operational-scope-grid">
              <scope-field
                v-for="field in scopeFields"
                :key="field.key"
                :field="field"
                :value="Number(draft[field.key] || 0)"
                :context="scopeContext(field.key)"
                id-prefix="data-bucket"
                @input="setScopeValue(field.key, $event)"
                @lookup="openLookup(field)"
                @clear="clearScope(field.key)"
              />
            </div>

            <div class="spire-editor-section-heading mt-4">
              <div>
                <div class="spire-editor-section-kicker">Dependency awareness</div>
                <h3>Key usage</h3>
              </div>
              <small>Merchant and spell conditions resolve by key name, across every scope.</small>
            </div>

            <div class="operational-usage-grid">
              <div class="operational-usage-source">
                <div class="operational-usage-source__heading">
                  <strong>Merchant conditions</strong><span>{{ number(usage.merchant_count) }}</span>
                </div>
                <template v-if="usageSamples('merchant').length">
                  <div v-for="sample in usageSamples('merchant')" :key="'merchant-' + sample.id" class="operational-usage-row">
                    <strong>{{ sample.label }}</strong>
                    <small>{{ sample.context }} · {{ sample.comparison }}</small>
                  </div>
                </template>
                <div v-else class="operational-empty-inline"><i class="fa fa-check-circle"></i>No merchant conditions use this key.</div>
              </div>
              <div class="operational-usage-source">
                <div class="operational-usage-source__heading">
                  <strong>Spell conditions</strong><span>{{ number(usage.spell_count) }}</span>
                </div>
                <template v-if="usageSamples('spell').length">
                  <div v-for="sample in usageSamples('spell')" :key="'spell-' + sample.id" class="operational-usage-row">
                    <strong>{{ sample.label }}</strong>
                    <small>{{ sample.context }} · {{ sample.comparison }}</small>
                  </div>
                </template>
                <div v-else class="operational-empty-inline"><i class="fa fa-check-circle"></i>No spell conditions use this key.</div>
              </div>
            </div>

            <div class="spire-editor-field operational-audit-field">
              <label for="data-bucket-reason">Required audit reason <span>{{ draft.reason.length }}/240</span></label>
              <textarea
                id="data-bucket-reason"
                v-model="draft.reason"
                maxlength="240"
                rows="2"
                class="form-control form-control-sm"
                placeholder="Explain the operational reason for this change…"
              ></textarea>
              <span class="spire-editor-field-help">The reason and structural change are written to Spire's editor audit trail; stored values are not copied into that trail.</span>
            </div>
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
      title="Delete data bucket"
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
            <strong>This removes live persistent state.</strong>
            <span v-if="usage.total">
              The key is used by {{ usage.total }} merchant/spell condition{{ usage.total === 1 ? '' : 's' }}.
            </span>
            <span v-else>The record will be deleted transactionally after a fresh stale-state check.</span>
          </div>
        </div>
        <label v-if="usage.total" class="d-flex align-items-start">
          <input v-model="allowReferencedDelete" type="checkbox" class="mr-2 mt-1">
          <span class="small">I reviewed the dependent key usage and intend to remove this scoped value.</span>
        </label>
        <div class="guarded-delete-slider" :class="{ 'guarded-delete-slider--confirmed': deleteConfirmed }">
          <div class="guarded-delete-slider__heading">
            <label for="data-bucket-delete-slider">{{ deleteConfirmed ? 'Deletion armed' : 'Slide to confirm' }}</label>
            <span>{{ deleteConfirmed ? 'Ready' : deleteSlider + '%' }}</span>
          </div>
          <input
            id="data-bucket-delete-slider"
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
          <label for="data-bucket-delete-reason">Required audit reason</label>
          <textarea
            id="data-bucket-delete-reason"
            v-model="deleteReason"
            maxlength="240"
            rows="3"
            class="form-control form-control-sm"
            placeholder="Explain why this bucket is being removed…"
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
            <i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-trash'"></i>Delete bucket
          </button>
        </div>
      </div>
    </b-modal>

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
  import ScopeField from '@/components/editors/OperationalScopeField.vue'
  import { SpireApi } from '@/app/api/spire-api'

  const clone = value => JSON.parse(JSON.stringify(value))

  function emptySummary () {
    return { total: 0, permanent: 0, expiring: 0, expired: 0, global: 0, scoped: 0 }
  }

  function emptyUsage () {
    return { merchant_count: 0, spell_count: 0, total: 0, samples: [] }
  }

  function emptyBucket () {
    return {
      id: null,
      key: '',
      value: '',
      expires: 0,
      account_id: 0,
      character_id: 0,
      npc_id: 0,
      bot_id: 0,
      zone_id: 0,
      instance_id: 0,
      reason: ''
    }
  }

  function snapshot (bucket) {
    return {
      key: bucket.key || '',
      value: bucket.value || '',
      expires: Number(bucket.expires || 0),
      account_id: Number(bucket.account_id || 0),
      character_id: Number(bucket.character_id || 0),
      npc_id: Number(bucket.npc_id || 0),
      bot_id: Number(bucket.bot_id || 0),
      zone_id: Number(bucket.zone_id || 0),
      instance_id: Number(bucket.instance_id || 0)
    }
  }

  export default {
    name: 'DataBucketEditor',
    components: { ContentArea, EqWindow, ScopeField },
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
        selectedID: null,
        loadingDirectory: false,
        loadingDetail: false,
        saving: false,
        directoryError: '',
        detailError: '',
        detail: null,
        draft: null,
        original: null,
        creating: false,
        expiryLocal: '',
        scopeContexts: {},
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
        notification: { message: '', type: 'success', timer: null },
        scopeFields: [
          { key: 'account_id', label: 'Account', icon: 'fa fa-id-card', lookup: 'accounts', max: 9007199254740991, help: '0 · any account' },
          { key: 'character_id', label: 'Character', icon: 'ra ra-player', lookup: 'characters', max: 9007199254740991, help: '0 · any character' },
          { key: 'npc_id', label: 'NPC', icon: 'ra ra-hood', lookup: 'npcs', max: 4294967295, help: '0 · any NPC' },
          { key: 'bot_id', label: 'Bot', icon: 'fa fa-user-circle-o', lookup: 'bots', max: 4294967295, help: '0 · any bot' },
          { key: 'zone_id', label: 'Zone', icon: 'ra ra-tower', lookup: 'zones', max: 65535, help: '0 · any zone' },
          { key: 'instance_id', label: 'Instance', icon: 'fa fa-clone', lookup: '', max: 65535, help: '0 · any instance' }
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
      draftSnapshot () {
        return this.draft ? snapshot(this.draft) : null
      },
      hasUnsavedChanges () {
        if (!this.draft || !this.original) return false
        return JSON.stringify(this.draftSnapshot) !== JSON.stringify(this.original) || Boolean(this.draft.reason.trim())
      },
      canSave () {
        return this.draft && this.draft.key.trim() && this.draft.reason.trim() && this.hasUnsavedChanges
      },
      expiryMode () {
        return !this.draft || Number(this.draft.expires || 0) === 0 ? 'permanent' : 'dated'
      },
      isPermanent () {
        return this.expiryMode === 'permanent'
      },
      isExpired () {
        return this.draft && Number(this.draft.expires || 0) > 0 && Number(this.draft.expires) <= Math.floor(Date.now() / 1000)
      },
      scopeValues () {
        if (!this.draft) return []
        return this.scopeFields.filter(field => Number(this.draft[field.key] || 0) > 0)
      },
      scopeKind () {
        if (!this.scopeValues.length) return 'global'
        if (this.scopeValues.length > 1) return 'composite'
        return this.scopeValues[0].key.replace('_id', '')
      },
      scopeLabels () {
        if (!this.scopeValues.length) return ['Global']
        return this.scopeValues.map(field => this.scopeContext(field.key) || `${field.label} #${this.draft[field.key]}`)
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
      '$route.query.bucket' (value) {
        if (value && Number(value) !== Number(this.selectedID)) this.selectRecord(Number(value), true)
      }
    },
    created () {
      const requested = Number(this.$route.query.bucket || 0)
      this.loadDirectory().then(() => {
        if (requested) this.selectRecord(requested, true)
        else if (this.records.length) this.selectRecord(this.records[0].id, true)
      })
    },
    beforeDestroy () {
      clearTimeout(this.searchTimer)
      clearTimeout(this.lookupTimer)
      clearTimeout(this.notification.timer)
    },
    beforeRouteLeave (to, from, next) {
      if (!this.hasUnsavedChanges || window.confirm('Discard unsaved data bucket changes?')) next()
      else next(false)
    },
    methods: {
      async loadDirectory () {
        this.loadingDirectory = true
        this.directoryError = ''
        try {
          const response = await SpireApi.v1().get('/data-bucket-editor/buckets', {
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
          this.loadDirectory()
        }, 220)
      },
      changePage (page) {
        this.currentPage = page
        this.loadDirectory()
      },
      async selectRecord (id, force) {
        if (!force && this.hasUnsavedChanges && !window.confirm('Discard unsaved data bucket changes?')) return
        this.selectedID = Number(id)
        this.creating = false
        this.draft = null
        this.original = null
        this.detail = null
        this.detailError = ''
        this.loadingDetail = true
        try {
          const response = await SpireApi.v1().get(`/data-bucket-editor/bucket/${id}`)
          this.applyDetail(response.data)
          if (Number(this.$route.query.bucket) !== Number(id)) {
            this.$router.replace({ query: { ...this.$route.query, bucket: String(id) } }).catch(() => {})
          }
        } catch (error) {
          this.detailError = this.apiError(error)
        } finally {
          this.loadingDetail = false
        }
      },
      applyDetail (detail) {
        this.detail = detail
        this.draft = { ...emptyBucket(), ...clone(detail.bucket), reason: '' }
        this.original = snapshot(this.draft)
        this.expiryLocal = this.toLocalInput(this.draft.expires)
        this.scopeContexts = {
          account_id: detail.bucket.account_name ? `Account ${detail.bucket.account_name}` : '',
          character_id: detail.bucket.character_name ? `Character ${detail.bucket.character_name}` : '',
          npc_id: detail.bucket.npc_name ? `NPC ${String(detail.bucket.npc_name).replace(/_/g, ' ')}` : '',
          bot_id: detail.bucket.bot_name ? `Bot ${detail.bucket.bot_name}` : '',
          zone_id: detail.bucket.zone_name ? `Zone ${detail.bucket.zone_name}` : ''
        }
      },
      createDraft (source) {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved data bucket changes?')) return
        const next = source ? { ...emptyBucket(), ...snapshot(source), key: `${source.key}.copy` } : emptyBucket()
        next.reason = ''
        this.creating = true
        this.selectedID = null
        this.detail = { bucket: next, usage: emptyUsage() }
        this.draft = next
        this.original = source ? snapshot(source) : snapshot(emptyBucket())
        this.expiryLocal = this.toLocalInput(next.expires)
        this.scopeContexts = source ? { ...this.scopeContexts } : {}
        const query = { ...this.$route.query }
        delete query.bucket
        this.$router.replace({ query }).catch(() => {})
      },
      resetDraft () {
        if (this.creating) {
          this.draft = emptyBucket()
          this.original = snapshot(this.draft)
          this.detail = { bucket: this.draft, usage: emptyUsage() }
          this.expiryLocal = ''
          this.scopeContexts = {}
          return
        }
        this.reloadSelected()
      },
      reloadSelected () {
        if (this.selectedID) this.selectRecord(this.selectedID, true)
      },
      async save () {
        if (!this.canSave) return
        this.saving = true
        try {
          const payload = {
            bucket: { ...this.draftSnapshot, reason: this.draft.reason.trim() },
            expected: this.creating ? null : this.original
          }
          const response = this.creating
            ? await SpireApi.v1().put('/data-bucket-editor/bucket', payload)
            : await SpireApi.v1().patch(`/data-bucket-editor/bucket/${this.selectedID}`, payload)
          const detail = response.data.detail
          const created = this.creating
          this.selectedID = Number(detail.bucket.id)
          this.creating = false
          this.applyDetail(detail)
          await this.loadDirectory()
          this.$router.replace({ query: { ...this.$route.query, bucket: String(this.selectedID) } }).catch(() => {})
          this.notify(created ? 'Data bucket created with an audit record.' : 'Data bucket saved with an audit record.')
        } catch (error) {
          this.notify(this.apiError(error), 'error')
        } finally {
          this.saving = false
        }
      },
      formatJSON () {
        try {
          this.draft.value = JSON.stringify(JSON.parse(this.draft.value), null, 2)
          this.notify('Value formatted as JSON.')
        } catch (error) {
          this.notify('The current value is not valid JSON.', 'error')
        }
      },
      setPermanent () {
        this.draft.expires = 0
        this.expiryLocal = ''
      },
      setExpiryFromLocal () {
        if (!this.expiryLocal) {
          this.setPermanent()
          return
        }
        const timestamp = Math.floor(new Date(this.expiryLocal).getTime() / 1000)
        this.draft.expires = Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0
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
        if (!this.lookupField || !this.lookupField.lookup) return
        this.lookupLoading = true
        this.lookupError = ''
        try {
          const response = await SpireApi.v1().get(`/data-bucket-editor/lookups/${this.lookupField.lookup}`, {
            params: { q: this.lookupQuery }
          })
          this.lookupResults = response.data.data || []
          if (response.data.available === false) {
            this.lookupError = 'This connected database does not include the optional bot table. Enter a numeric bot ID directly.'
          }
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
          await SpireApi.v1().delete(`/data-bucket-editor/bucket/${this.selectedID}`, {
            data: {
              bucket: { ...this.draftSnapshot, reason: this.deleteReason.trim() },
              expected: this.original,
              confirm: true,
              allow_referenced_key: this.allowReferencedDelete
            }
          })
          this.$refs.deleteModal.hide()
          this.selectedID = null
          this.draft = null
          this.original = null
          this.detail = null
          const query = { ...this.$route.query }
          delete query.bucket
          this.$router.replace({ query }).catch(() => {})
          await this.loadDirectory()
          if (this.records.length) await this.selectRecord(this.records[0].id, true)
          this.notify('Data bucket deleted with an audit record.')
        } catch (error) {
          this.notify(this.apiError(error), 'error')
        } finally {
          this.saving = false
        }
      },
      usageSamples (kind) {
        return (this.usage.samples || []).filter(sample => sample.kind === kind)
      },
      compactScope (record) {
        return (record.scope_labels || []).join(' · ') || 'Global'
      },
      formatDate (timestamp) {
        if (!timestamp) return 'Never'
        return new Date(Number(timestamp) * 1000).toLocaleString()
      },
      toLocalInput (timestamp) {
        if (!timestamp) return ''
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
          : 'The data bucket request could not be completed.'
      }
    }
  }
</script>

<style>
@import '../../assets/css/content-editor-workspace.css';
@import '../../assets/css/operational-editors.css';

.data-bucket-editor-page .spire-editor-directory-body {
  min-width: 0;
}

.data-bucket-editor-page .spire-editor-directory-detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-bucket-editor-page .operational-row-badges {
  margin-top: 3px;
}
</style>
