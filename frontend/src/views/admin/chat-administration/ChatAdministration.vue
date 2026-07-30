<template>
  <content-area class="spire-editor-page operational-editor-page chat-administration-page">
    <div class="spire-editor-toolbar">
      <div>
        <div class="spire-editor-kicker">Server operations · player communication</div>
        <h1 class="spire-editor-title"><i class="fa fa-comments mr-1"></i> Chat Administration</h1>
        <p class="spire-editor-subtitle">
          Govern persistent channels, protected names, and saylink phrases from one audited workspace.
        </p>
      </div>
      <div class="spire-editor-summary" aria-label="Chat administration summary">
        <span><strong>{{ number(summary.channels) }}</strong> channels</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(summary.secured) }}</strong> secured</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(summary.reserved_names) }}</strong> reserved</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ number(summary.saylinks) }}</strong> saylinks</span>
      </div>
    </div>

    <div class="operational-tab-switch" role="tablist" aria-label="Chat administration mode">
      <button
        v-for="option in modes"
        :key="option.key"
        type="button"
        role="tab"
        :aria-selected="mode === option.key"
        :class="{ active: mode === option.key }"
        @click="changeMode(option.key)"
      >
        <i :class="option.icon"></i>
        <span>{{ option.label }}</span>
        <small>{{ number(summary[option.count]) }}</small>
      </button>
    </div>

    <div class="spire-editor-workspace">
      <aside class="spire-editor-directory">
        <eq-window :title="modeConfig.directoryTitle">
          <div class="spire-editor-directory-controls">
            <div class="spire-editor-search">
              <i class="fa fa-search"></i>
              <input
                id="chat-administration-search"
                v-model.trim="search"
                class="form-control form-control-sm"
                :placeholder="modeConfig.searchPlaceholder"
                @input="queueSearch"
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
            <b-button size="sm" variant="outline-warning" data-testid="chat-administration-new" @click="createDraft()">
              <i class="fa fa-plus mr-1"></i>New
            </b-button>
          </div>

          <div class="operational-filter-row operational-filter-row--single">
            <select
              id="chat-administration-filter"
              v-model="filter"
              class="form-control form-control-sm"
              :aria-label="modeConfig.filterLabel"
              @change="currentPage = 1; loadDirectory()"
            >
              <option v-for="option in modeConfig.filters" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="spire-editor-directory-meta">
            <span>{{ number(totalRecords) }} {{ modeConfig.countLabel }}</span>
            <button class="btn btn-link btn-sm p-0" type="button" :disabled="loadingDirectory" @click="loadDirectory">
              <i class="fa mr-1" :class="loadingDirectory ? 'fa-spinner fa-spin' : 'fa-refresh'"></i>Refresh
            </button>
          </div>

          <div class="spire-editor-directory-list" data-testid="chat-administration-directory">
            <button
              v-for="record in records"
              :key="record.id"
              type="button"
              class="spire-editor-directory-row"
              :class="{ active: !creating && Number(selectedID) === Number(record.id) }"
              @click="selectRecord(record)"
            >
              <span class="spire-editor-directory-icon"><i :class="recordIcon(record)"></i></span>
              <span class="spire-editor-directory-body">
                <span class="spire-editor-directory-name">{{ recordName(record) }}</span>
                <span class="spire-editor-directory-detail">{{ recordDetail(record) }}</span>
                <span class="operational-row-badges">
                  <template v-if="mode === 'channels'">
                    <span v-if="record.system_owned" class="operational-badge operational-badge--gold">system</span>
                    <span v-else class="operational-badge">player-owned</span>
                    <span v-if="record.has_password" class="operational-badge"><i class="fa fa-lock"></i>secured</span>
                    <span v-if="record.minstatus > 0" class="operational-badge operational-badge--muted">status {{ record.minstatus }}+</span>
                  </template>
                  <span v-else-if="mode === 'reserved' && record.active_channel_count" class="operational-badge operational-badge--danger">
                    active collision
                  </span>
                  <span v-else-if="mode === 'saylinks' && record.duplicate_count" class="operational-badge operational-badge--gold">
                    {{ record.duplicate_count }} duplicate{{ record.duplicate_count === 1 ? '' : 's' }}
                  </span>
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
              <i class="fa fa-spinner fa-spin"></i><span>Loading {{ modeConfig.countLabel }}…</span>
            </div>
            <div v-else-if="!records.length" class="spire-editor-directory-state">
              <i :class="modeConfig.icon"></i>
              <span>{{ search ? 'Nothing matches this search.' : modeConfig.emptyMessage }}</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="createDraft()">Create {{ modeConfig.singular }}</button>
            </div>
          </div>

          <nav v-if="totalPages > 1" class="spire-editor-pagination" :aria-label="modeConfig.directoryTitle + ' pages'">
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
        <eq-window v-if="!draft && detailError" :title="modeConfig.workspaceTitle">
          <div class="spire-editor-empty spire-editor-empty--error" role="alert">
            <div class="spire-editor-empty__sigil"><i class="fa fa-exclamation-triangle"></i></div>
            <h3>{{ modeConfig.singular }} could not be loaded</h3>
            <p>{{ detailError }}</p>
            <b-button size="sm" variant="outline-warning" @click="reloadSelected">
              <i class="fa fa-refresh mr-1"></i>Retry
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="!draft && !loadingDetail" :title="modeConfig.workspaceTitle">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i :class="modeConfig.icon"></i></div>
            <h3>Select {{ indefinite(modeConfig.singular) }}</h3>
            <p>{{ modeConfig.guidance }}</p>
            <b-button size="sm" variant="outline-warning" @click="createDraft()">
              <i class="fa fa-plus mr-1"></i>Create {{ modeConfig.singular }}
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="loadingDetail && !draft" :title="modeConfig.workspaceTitle">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading chat context…</h3>
          </div>
        </eq-window>

        <eq-window v-else :title="modeConfig.workspaceTitle" data-testid="chat-administration-inspector">
          <div class="spire-editor-header">
            <div class="spire-editor-identity">
              <span class="spire-editor-identity-icon"><i :class="modeConfig.icon"></i></span>
              <div>
                <div class="spire-editor-eyebrow">
                  {{ creating ? 'New ' + modeConfig.singular : modeConfig.singular + ' #' + selectedID }}
                  <span v-if="hasUnsavedChanges" class="spire-editor-unsaved"><i class="fa fa-circle"></i> Unsaved</span>
                </div>
                <h2>{{ draftTitle }}</h2>
                <div class="operational-identity-meta">
                  <template v-if="mode === 'channels'">
                    <span class="operational-badge" :class="{ 'operational-badge--gold': draft.owner === '*System*' }">
                      {{ draft.owner === '*System*' ? 'system-owned' : 'owner · ' + draft.owner }}
                    </span>
                    <span class="operational-badge"><i :class="effectiveHasPassword ? 'fa fa-lock' : 'fa fa-unlock'"></i>{{ effectiveHasPassword ? 'secured' : 'open' }}</span>
                    <span class="operational-badge operational-badge--muted">{{ statusName(draft.minstatus) }}</span>
                  </template>
                  <span v-else-if="mode === 'reserved'" class="operational-badge">creation guard</span>
                  <span v-else class="operational-badge">saylink phrase</span>
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
              <b-button size="sm" variant="warning" :disabled="saving || !canSave" data-testid="chat-administration-save" @click="save">
                <i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"></i>{{ creating ? 'Create' : 'Save' }}
              </b-button>
            </div>
          </div>

          <div class="spire-editor-panel">
            <div v-if="mode === 'channels'" class="operational-preview-strip">
              <span>Connection policy</span>
              <div class="operational-scope-preview">
                <span class="operational-badge">{{ draft.owner || '*System*' }}</span>
                <span class="operational-badge">{{ statusName(draft.minstatus) }}</span>
                <span class="operational-badge" :class="{ 'operational-badge--gold': effectiveHasPassword }">
                  {{ effectiveHasPassword ? 'Password required' : 'No password' }}
                </span>
              </div>
            </div>

            <template v-if="mode === 'channels'">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-section-kicker">Persistent channel</div>
                  <h3>Identity and access</h3>
                </div>
                <small>Passwords are write-only and never returned by the API or recorded in audit payloads.</small>
              </div>

              <div class="spire-editor-grid spire-editor-grid--two">
                <div class="spire-editor-field">
                  <label for="chat-channel-name">Channel name <span>{{ draft.name.length }}/64</span></label>
                  <input
                    id="chat-channel-name"
                    v-model="draft.name"
                    maxlength="64"
                    class="form-control form-control-sm"
                    placeholder="NewPlayers"
                  >
                </div>
                <div class="spire-editor-field">
                  <label for="chat-channel-status">Minimum account status</label>
                  <select id="chat-channel-status" v-model.number="draft.minstatus" class="form-control form-control-sm">
                    <option v-for="status in statuses" :key="status.value" :value="status.value">
                      {{ status.value }} · {{ status.label }}
                    </option>
                  </select>
                  <span class="spire-editor-field-help">Only accounts at or above this server status can join.</span>
                </div>
              </div>

              <div class="spire-editor-field mt-3">
                <label for="chat-channel-owner">Owner</label>
                <div class="operational-owner-field">
                  <input
                    id="chat-channel-owner"
                    v-model="draft.owner"
                    maxlength="64"
                    class="form-control form-control-sm"
                    placeholder="*System* or an exact character name"
                  >
                  <button type="button" class="btn btn-sm btn-outline-secondary" @click="setSystemOwner">
                    <i class="fa fa-server mr-1"></i>System
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-warning" @click="openOwnerLookup">
                    <i class="fa fa-search mr-1"></i>Find
                  </button>
                </div>
                <span class="spire-editor-field-help">
                  Blank owners normalize to *System*. Character ownership is matched by exact name.
                </span>
              </div>

              <div class="spire-editor-section-heading spire-editor-section-heading--spaced">
                <div>
                  <div class="spire-editor-section-kicker">Credential policy</div>
                  <h3>Channel password</h3>
                </div>
                <small>The stored password is never displayed.</small>
              </div>

              <div class="operational-password-control">
                <button
                  v-if="!creating"
                  type="button"
                  :class="{ active: draft.password_mode === 'keep' }"
                  @click="setPasswordMode('keep')"
                >
                  <i class="fa fa-shield"></i><span>Keep existing</span>
                </button>
                <button type="button" :class="{ active: draft.password_mode === 'replace' }" @click="setPasswordMode('replace')">
                  <i class="fa fa-key"></i><span>{{ creating ? 'Set password' : 'Replace' }}</span>
                </button>
                <button type="button" :class="{ active: draft.password_mode === 'clear' }" @click="setPasswordMode('clear')">
                  <i class="fa fa-unlock-alt"></i><span>Leave open</span>
                </button>
              </div>
              <div v-if="draft.password_mode === 'replace'" class="spire-editor-field mt-2">
                <label for="chat-channel-password">New password <span>{{ draft.password.length }}/64</span></label>
                <input
                  id="chat-channel-password"
                  v-model="draft.password"
                  type="password"
                  autocomplete="new-password"
                  maxlength="64"
                  class="form-control form-control-sm"
                  placeholder="Enter a write-only channel password"
                >
              </div>
              <div v-else-if="draft.password_mode === 'clear'" class="operational-inline-warning">
                <i class="fa fa-unlock-alt"></i>
                <span>{{ creating ? 'This channel will be created without a password.' : 'Saving will remove the current password.' }}</span>
              </div>
            </template>

            <template v-else-if="mode === 'reserved'">
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-section-kicker">Name protection</div>
                  <h3>Reserved channel name</h3>
                </div>
                <small>Blocks future persistent channels from claiming this exact name.</small>
              </div>
              <div class="spire-editor-field">
                <label for="chat-reserved-name">Reserved name <span>{{ draft.name.length }}/64</span></label>
                <input
                  id="chat-reserved-name"
                  v-model="draft.name"
                  maxlength="64"
                  class="form-control form-control-sm"
                  placeholder="ServerStaff"
                >
              </div>
              <div v-if="draft.active_channel_count" class="operational-inline-warning operational-inline-warning--danger">
                <i class="fa fa-exclamation-triangle"></i>
                <span>
                  {{ draft.active_channel_count }} active channel{{ draft.active_channel_count === 1 ? '' : 's' }}
                  currently use this name. Reserving it does not rename or remove them.
                </span>
              </div>
              <div class="operational-context-card mt-3">
                <i class="fa fa-ban"></i>
                <div>
                  <strong>Creation-time protection</strong>
                  <span>Existing system or player channels remain intact; this registry governs future creation.</span>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="spire-editor-section-heading">
                <div>
                  <div class="spire-editor-section-kicker">Dialogue index</div>
                  <h3>Saylink phrase</h3>
                </div>
                <small>Use the player-visible text exactly as it should appear in NPC dialogue.</small>
              </div>
              <div class="spire-editor-field">
                <label for="chat-saylink-phrase">Phrase <span>{{ draft.phrase.length }}/64</span></label>
                <input
                  id="chat-saylink-phrase"
                  v-model="draft.phrase"
                  maxlength="64"
                  class="form-control form-control-sm"
                  placeholder="Tell me about the ancient ruins"
                >
              </div>
              <div v-if="draft.duplicate_count" class="operational-inline-warning">
                <i class="fa fa-copy"></i>
                <span>
                  {{ draft.duplicate_count }} other row{{ draft.duplicate_count === 1 ? '' : 's' }}
                  use this phrase. Duplicates are preserved because legacy content may depend on their IDs.
                </span>
              </div>
              <div class="operational-context-card mt-3">
                <i class="fa fa-commenting-o"></i>
                <div>
                  <strong>Phrase registry</strong>
                  <span>IDs are stable database references. Editing text changes every consumer that resolves this row.</span>
                </div>
              </div>
            </template>

            <div class="operational-audit-field">
              <div class="spire-editor-field">
                <label for="chat-administration-reason">Required audit reason <span>{{ draft.reason.length }}/240</span></label>
                <textarea
                  id="chat-administration-reason"
                  v-model="draft.reason"
                  maxlength="240"
                  rows="3"
                  class="form-control form-control-sm"
                  :placeholder="modeConfig.reasonPlaceholder"
                ></textarea>
                <span class="spire-editor-field-help">Every create, update, and delete is recorded with this reason.</span>
              </div>
            </div>
          </div>
        </eq-window>
      </main>
    </div>

    <b-modal
      ref="ownerModal"
      modal-class="spire-editor-modal"
      content-class="spire-editor-modal-content"
      hide-footer
      centered
      title="Find channel owner"
      @hidden="resetOwnerLookup"
    >
      <div class="operational-lookup">
        <div class="spire-editor-search">
          <i class="fa fa-search"></i>
          <input
            ref="ownerLookupInput"
            v-model.trim="ownerQuery"
            class="form-control form-control-sm"
            placeholder="Character, account, or ID…"
            @input="queueOwnerLookup"
          >
        </div>
        <div class="operational-lookup-results">
          <button
            v-for="result in ownerResults"
            :key="result.id"
            type="button"
            class="operational-lookup-result"
            @click="chooseOwner(result)"
          >
            <i class="fa fa-user"></i>
            <span><strong>{{ result.name }}</strong><small>{{ result.context }}</small></span>
            <em>#{{ result.id }}</em>
          </button>
          <div v-if="ownerError" class="operational-empty-inline"><i class="fa fa-exclamation-triangle"></i>{{ ownerError }}</div>
          <div v-else-if="ownerLoading" class="operational-empty-inline"><i class="fa fa-spinner fa-spin"></i>Searching characters…</div>
          <div v-else-if="!ownerResults.length" class="operational-empty-inline"><i class="fa fa-search"></i>No matching characters.</div>
        </div>
      </div>
    </b-modal>

    <b-modal
      ref="deleteModal"
      modal-class="spire-editor-modal"
      content-class="spire-editor-modal-content"
      hide-footer
      centered
      :title="'Delete ' + modeConfig.singular"
      @hidden="resetDelete"
    >
      <div class="operational-delete">
        <div class="operational-delete-warning">
          <i class="fa fa-exclamation-triangle"></i>
          <div>
            <strong>{{ draftTitle }}</strong>
            <span>{{ modeConfig.deleteWarning }}</span>
          </div>
        </div>
        <label v-if="mode === 'channels' && draft && draft.system_owned" class="d-flex align-items-start">
          <input v-model="allowSystemDelete" type="checkbox" class="mr-2 mt-1">
          <span class="small">I understand this is a system-owned persistent channel.</span>
        </label>
        <div class="guarded-delete-slider" :class="{ 'guarded-delete-slider--confirmed': deleteConfirmed }">
          <div class="guarded-delete-slider__heading">
            <label for="chat-administration-delete-slider">{{ deleteConfirmed ? 'Deletion armed' : 'Slide to confirm' }}</label>
            <span>{{ deleteConfirmed ? 'Ready' : deleteSlider + '%' }}</span>
          </div>
          <input
            id="chat-administration-delete-slider"
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
          <label for="chat-administration-delete-reason">Required audit reason</label>
          <textarea
            id="chat-administration-delete-reason"
            v-model="deleteReason"
            maxlength="240"
            rows="3"
            class="form-control form-control-sm"
            placeholder="Explain why this record is being removed…"
          ></textarea>
        </div>
        <div class="operational-delete-actions">
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="$refs.deleteModal.hide()">Cancel</button>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            :disabled="saving || !deleteConfirmed || !deleteReason.trim() || requiresSystemApproval"
            @click="confirmDelete"
          >
            <i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-trash'"></i>Delete {{ modeConfig.singular }}
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
  import { SpireApi } from '@/app/api/spire-api'

  const clone = value => JSON.parse(JSON.stringify(value))

  const MODE_CONFIG = {
    channels: {
      icon: 'fa fa-comments',
      directoryTitle: 'Persistent Channels',
      workspaceTitle: 'Channel Policy',
      searchPlaceholder: 'Search channel, owner, or ID…',
      filterLabel: 'Filter persistent channels',
      filters: [
        { value: '', label: 'All channels' },
        { value: 'system', label: 'System-owned' },
        { value: 'player', label: 'Player-owned' },
        { value: 'secured', label: 'Password secured' },
        { value: 'open', label: 'No password' },
        { value: 'staff', label: 'Staff status required' }
      ],
      countLabel: 'channels',
      singular: 'channel',
      emptyMessage: 'No persistent channels exist in this view.',
      guidance: 'Review ownership, account-status access, and credential state before making an audited change.',
      reasonPlaceholder: 'Why is this channel policy changing?',
      deleteWarning: 'Players may lose access immediately, and the channel ID will no longer resolve.'
    },
    reserved: {
      icon: 'fa fa-ban',
      directoryTitle: 'Reserved Names',
      workspaceTitle: 'Reserved Name',
      searchPlaceholder: 'Search reserved name or ID…',
      filterLabel: 'Filter reserved names',
      filters: [
        { value: '', label: 'All reserved names' },
        { value: 'active', label: 'Collides with an active channel' }
      ],
      countLabel: 'reserved names',
      singular: 'reserved name',
      emptyMessage: 'No protected channel names are registered.',
      guidance: 'Reserve high-trust names without disturbing existing channels that may already use them.',
      reasonPlaceholder: 'Why is this channel name protection changing?',
      deleteWarning: 'Future persistent channels will be able to claim this name.'
    },
    saylinks: {
      icon: 'fa fa-commenting-o',
      directoryTitle: 'Saylink Phrases',
      workspaceTitle: 'Saylink Phrase',
      searchPlaceholder: 'Search phrase or ID…',
      filterLabel: 'Filter saylink phrases',
      filters: [
        { value: '', label: 'All saylink phrases' },
        { value: 'duplicates', label: 'Duplicate phrases' }
      ],
      countLabel: 'saylink phrases',
      singular: 'saylink phrase',
      emptyMessage: 'No saylink phrases are registered.',
      guidance: 'Keep dialogue phrasing legible while preserving stable row IDs and intentional legacy duplicates.',
      reasonPlaceholder: 'Why is this saylink phrase changing?',
      deleteWarning: 'Content that references this numeric saylink ID may stop resolving.'
    }
  }

  const emptySummary = () => ({ channels: 0, secured: 0, system_owned: 0, reserved_names: 0, saylinks: 0 })
  const emptyChannel = () => ({
    id: null,
    name: '',
    owner: '*System*',
    minstatus: 0,
    has_password: false,
    system_owned: true,
    password_mode: 'clear',
    password: '',
    reason: ''
  })
  const emptyReserved = () => ({ id: null, name: '', active_channel_count: 0, reason: '' })
  const emptySaylink = () => ({ id: null, phrase: '', duplicate_count: 0, reason: '' })

  function channelSnapshot (record) {
    return {
      name: record.name || '',
      owner: record.owner || '*System*',
      minstatus: Number(record.minstatus || 0),
      has_password: Boolean(record.has_password)
    }
  }

  export default {
    name: 'ChatAdministration',
    components: { ContentArea, EqWindow },
    data () {
      return {
        modes: [
          { key: 'channels', label: 'Channels', icon: 'fa fa-comments', count: 'channels' },
          { key: 'reserved', label: 'Reserved Names', icon: 'fa fa-ban', count: 'reserved_names' },
          { key: 'saylinks', label: 'Saylinks', icon: 'fa fa-commenting-o', count: 'saylinks' }
        ],
        statuses: [
          { value: -2, label: 'Banned' },
          { value: -1, label: 'Suspended' },
          { value: 0, label: 'Normal player' },
          { value: 10, label: 'Steward' },
          { value: 20, label: 'Apprentice Guide' },
          { value: 50, label: 'Guide' },
          { value: 80, label: 'Quest Troupe' },
          { value: 81, label: 'Senior Guide' },
          { value: 85, label: 'GM Tester' },
          { value: 90, label: 'EQ Support' },
          { value: 95, label: 'GM Staff' },
          { value: 100, label: 'GM Admin' },
          { value: 150, label: 'GM Lead Admin' },
          { value: 160, label: 'Quest Master' },
          { value: 170, label: 'GM Areas' },
          { value: 180, label: 'GM Coder' },
          { value: 200, label: 'GM Management' },
          { value: 250, label: 'GM Impossible' }
        ],
        mode: 'channels',
        summary: emptySummary(),
        records: [],
        totalRecords: 0,
        currentPage: 1,
        pageSize: 40,
        search: '',
        filter: '',
        selectedID: null,
        loadingDirectory: false,
        loadingDetail: false,
        saving: false,
        directoryError: '',
        detailError: '',
        draft: null,
        original: null,
        creating: false,
        searchTimer: null,
        ownerTimer: null,
        ownerQuery: '',
        ownerResults: [],
        ownerLoading: false,
        ownerError: '',
        deleteSlider: 0,
        deleteReason: '',
        allowSystemDelete: false,
        notification: { message: '', type: 'success', timer: null }
      }
    },
    computed: {
      modeConfig () {
        return MODE_CONFIG[this.mode]
      },
      totalPages () {
        return Math.max(1, Math.ceil(this.totalRecords / this.pageSize))
      },
      entitySnapshot () {
        if (!this.draft) return null
        if (this.mode === 'channels') return channelSnapshot(this.draft)
        if (this.mode === 'reserved') return { name: this.draft.name || '' }
        return { phrase: this.draft.phrase || '' }
      },
      hasUnsavedChanges () {
        if (!this.draft || !this.original) return false
        const entityChanged = JSON.stringify(this.entitySnapshot) !== JSON.stringify(this.original)
        const passwordChanged = this.mode === 'channels' && (
          this.draft.password_mode !== (this.creating ? 'clear' : 'keep') ||
          Boolean(this.draft.password)
        )
        return entityChanged || passwordChanged || Boolean(this.draft.reason.trim())
      },
      canSave () {
        if (!this.draft || !this.draft.reason.trim() || !this.hasUnsavedChanges) return false
        if (this.mode === 'channels') {
          if (!this.draft.name.trim()) return false
          if (this.draft.password_mode === 'replace' && !this.draft.password) return false
          return true
        }
        return this.mode === 'reserved' ? Boolean(this.draft.name.trim()) : Boolean(this.draft.phrase.trim())
      },
      draftTitle () {
        if (!this.draft) return ''
        if (this.mode === 'channels' || this.mode === 'reserved') return this.draft.name || `Untitled ${this.modeConfig.singular}`
        return this.draft.phrase || 'Untitled saylink phrase'
      },
      effectiveHasPassword () {
        if (!this.draft || this.mode !== 'channels') return false
        if (this.draft.password_mode === 'replace') return Boolean(this.draft.password)
        if (this.draft.password_mode === 'clear') return false
        return Boolean(this.draft.has_password)
      },
      deleteConfirmed () {
        return this.deleteSlider >= 100
      },
      requiresSystemApproval () {
        return this.mode === 'channels' && this.draft && this.draft.system_owned && !this.allowSystemDelete
      }
    },
    watch: {
      '$route.query.mode' (value) {
        const next = MODE_CONFIG[value] ? value : 'channels'
        if (next !== this.mode) this.changeMode(next, true)
      },
      '$route.query.record' (value) {
        if (value && Number(value) !== Number(this.selectedID)) {
          const record = this.records.find(item => Number(item.id) === Number(value))
          if (record) this.selectRecord(record, true)
        }
      }
    },
    created () {
      this.mode = MODE_CONFIG[this.$route.query.mode] ? this.$route.query.mode : 'channels'
      const requested = Number(this.$route.query.record || 0)
      this.loadDirectory().then(() => {
        const record = this.records.find(item => Number(item.id) === requested) || this.records[0]
        if (record) this.selectRecord(record, true)
      })
    },
    beforeDestroy () {
      clearTimeout(this.searchTimer)
      clearTimeout(this.ownerTimer)
      clearTimeout(this.notification.timer)
    },
    beforeRouteLeave (to, from, next) {
      if (!this.hasUnsavedChanges || window.confirm('Discard unsaved Chat Administration changes?')) next()
      else next(false)
    },
    methods: {
      async loadDirectory () {
        this.loadingDirectory = true
        this.directoryError = ''
        try {
          const response = await SpireApi.v1().get(this.modeEndpoint(), {
            params: { q: this.search, filter: this.filter, page: this.currentPage, limit: this.pageSize }
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
      modeEndpoint () {
        if (this.mode === 'channels') return '/chat-administration/channels'
        if (this.mode === 'reserved') return '/chat-administration/reserved-names'
        return '/chat-administration/saylinks'
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
      async changeMode (mode, force) {
        if (mode === this.mode && !force) return
        if (!force && this.hasUnsavedChanges && !window.confirm('Discard unsaved Chat Administration changes?')) return
        this.mode = MODE_CONFIG[mode] ? mode : 'channels'
        this.search = ''
        this.filter = ''
        this.currentPage = 1
        this.selectedID = null
        this.draft = null
        this.original = null
        this.creating = false
        const query = { ...this.$route.query, mode: this.mode }
        delete query.record
        this.$router.replace({ query }).catch(() => {})
        await this.loadDirectory()
        if (this.records.length) await this.selectRecord(this.records[0], true)
      },
      async selectRecord (record, force) {
        if (!record) return
        if (!force && this.hasUnsavedChanges && !window.confirm('Discard unsaved Chat Administration changes?')) return
        this.selectedID = Number(record.id)
        this.creating = false
        this.draft = null
        this.original = null
        this.detailError = ''
        this.loadingDetail = true
        try {
          let loaded = record
          if (this.mode === 'channels') {
            const response = await SpireApi.v1().get(`/chat-administration/channel/${record.id}`)
            loaded = response.data
          }
          this.applyRecord(loaded)
          if (Number(this.$route.query.record) !== Number(record.id) || this.$route.query.mode !== this.mode) {
            this.$router.replace({ query: { ...this.$route.query, mode: this.mode, record: String(record.id) } }).catch(() => {})
          }
        } catch (error) {
          this.detailError = this.apiError(error)
        } finally {
          this.loadingDetail = false
        }
      },
      applyRecord (record) {
        if (this.mode === 'channels') {
          this.draft = { ...emptyChannel(), ...clone(record), password_mode: 'keep', password: '', reason: '' }
          this.original = channelSnapshot(this.draft)
        } else if (this.mode === 'reserved') {
          this.draft = { ...emptyReserved(), ...clone(record), reason: '' }
          this.original = { name: this.draft.name }
        } else {
          this.draft = { ...emptySaylink(), ...clone(record), reason: '' }
          this.original = { phrase: this.draft.phrase }
        }
      },
      createDraft (source) {
        if (this.hasUnsavedChanges && !window.confirm('Discard unsaved Chat Administration changes?')) return
        this.creating = true
        this.selectedID = null
        if (this.mode === 'channels') {
          const next = source
            ? { ...emptyChannel(), ...channelSnapshot(source), name: `${source.name} Copy`, has_password: false, password_mode: 'clear' }
            : emptyChannel()
          this.draft = next
          this.original = channelSnapshot(emptyChannel())
        } else if (this.mode === 'reserved') {
          this.draft = source ? { ...emptyReserved(), name: `${source.name} Copy` } : emptyReserved()
          this.original = { name: '' }
        } else {
          this.draft = source ? { ...emptySaylink(), phrase: source.phrase } : emptySaylink()
          this.original = { phrase: '' }
        }
        const query = { ...this.$route.query, mode: this.mode }
        delete query.record
        this.$router.replace({ query }).catch(() => {})
      },
      resetDraft () {
        if (this.creating) {
          if (this.mode === 'channels') {
            this.draft = emptyChannel()
            this.original = channelSnapshot(emptyChannel())
          } else if (this.mode === 'reserved') {
            this.draft = emptyReserved()
            this.original = { name: '' }
          } else {
            this.draft = emptySaylink()
            this.original = { phrase: '' }
          }
          return
        }
        this.reloadSelected()
      },
      reloadSelected () {
        const record = this.records.find(item => Number(item.id) === Number(this.selectedID))
        if (record) this.selectRecord(record, true)
      },
      async save () {
        if (!this.canSave) return
        this.saving = true
        try {
          const entityKey = this.mode === 'channels' ? 'channel' : this.mode === 'reserved' ? 'reserved' : 'saylink'
          const endpoint = this.mode === 'channels' ? 'channel' : this.mode === 'reserved' ? 'reserved-name' : 'saylink'
          const entity = this.mode === 'channels'
            ? {
              id: this.draft.id,
              name: this.draft.name,
              owner: this.draft.owner,
              minstatus: Number(this.draft.minstatus),
              password_mode: this.draft.password_mode,
              password: this.draft.password,
              reason: this.draft.reason.trim()
            }
            : {
              id: this.draft.id,
              ...(this.mode === 'reserved' ? { name: this.draft.name } : { phrase: this.draft.phrase }),
              reason: this.draft.reason.trim()
            }
          const payload = { [entityKey]: entity, expected: this.creating ? null : this.original }
          const response = this.creating
            ? await SpireApi.v1().put(`/chat-administration/${endpoint}`, payload)
            : await SpireApi.v1().patch(`/chat-administration/${endpoint}/${this.selectedID}`, payload)
          const record = response.data[entityKey]
          const created = this.creating
          this.selectedID = Number(record.id)
          this.creating = false
          this.applyRecord(record)
          await this.loadDirectory()
          this.$router.replace({ query: { ...this.$route.query, mode: this.mode, record: String(this.selectedID) } }).catch(() => {})
          this.notify(`${this.modeConfig.singularLabel || this.modeConfig.singular} ${created ? 'created' : 'saved'} with an audit record.`)
        } catch (error) {
          this.notify(this.apiError(error), 'error')
        } finally {
          this.saving = false
        }
      },
      setSystemOwner () {
        this.draft.owner = '*System*'
        this.draft.system_owned = true
      },
      setPasswordMode (mode) {
        this.draft.password_mode = mode
        if (mode !== 'replace') this.draft.password = ''
      },
      openOwnerLookup () {
        this.ownerQuery = ''
        this.ownerResults = []
        this.ownerError = ''
        this.$refs.ownerModal.show()
        this.$nextTick(() => {
          if (this.$refs.ownerLookupInput) this.$refs.ownerLookupInput.focus()
          this.loadOwners()
        })
      },
      resetOwnerLookup () {
        clearTimeout(this.ownerTimer)
        this.ownerQuery = ''
        this.ownerResults = []
        this.ownerError = ''
      },
      queueOwnerLookup () {
        clearTimeout(this.ownerTimer)
        this.ownerTimer = setTimeout(this.loadOwners, 180)
      },
      async loadOwners () {
        this.ownerLoading = true
        this.ownerError = ''
        try {
          const response = await SpireApi.v1().get('/chat-administration/owners', { params: { q: this.ownerQuery } })
          this.ownerResults = response.data.data || []
        } catch (error) {
          this.ownerError = this.apiError(error)
        } finally {
          this.ownerLoading = false
        }
      },
      chooseOwner (result) {
        this.draft.owner = result.name
        this.draft.system_owned = false
        this.$refs.ownerModal.hide()
      },
      openDelete () {
        this.resetDelete()
        this.$refs.deleteModal.show()
      },
      resetDelete () {
        this.deleteSlider = 0
        this.deleteReason = ''
        this.allowSystemDelete = false
      },
      updateDeleteSlider (event) {
        const value = Number(event.target.value || 0)
        this.deleteSlider = value >= 96 ? 100 : value
        event.target.value = this.deleteSlider
      },
      async confirmDelete () {
        if (!this.deleteConfirmed || !this.deleteReason.trim() || this.requiresSystemApproval) return
        this.saving = true
        try {
          const entityKey = this.mode === 'channels' ? 'channel' : this.mode === 'reserved' ? 'reserved' : 'saylink'
          const endpoint = this.mode === 'channels' ? 'channel' : this.mode === 'reserved' ? 'reserved-name' : 'saylink'
          const entity = {
            ...(this.mode === 'channels'
              ? { name: this.draft.name, owner: this.draft.owner, minstatus: this.draft.minstatus }
              : this.mode === 'reserved' ? { name: this.draft.name } : { phrase: this.draft.phrase }),
            reason: this.deleteReason.trim()
          }
          await SpireApi.v1().delete(`/chat-administration/${endpoint}/${this.selectedID}`, {
            data: {
              [entityKey]: entity,
              expected: this.original,
              confirm: true,
              allow_system_channel: this.allowSystemDelete
            }
          })
          this.$refs.deleteModal.hide()
          this.selectedID = null
          this.draft = null
          this.original = null
          const query = { ...this.$route.query, mode: this.mode }
          delete query.record
          this.$router.replace({ query }).catch(() => {})
          await this.loadDirectory()
          if (this.records.length) await this.selectRecord(this.records[0], true)
          this.notify(`${this.modeConfig.singular} deleted with an audit record.`)
        } catch (error) {
          this.notify(this.apiError(error), 'error')
        } finally {
          this.saving = false
        }
      },
      recordName (record) {
        return this.mode === 'saylinks' ? record.phrase : record.name
      },
      recordDetail (record) {
        if (this.mode === 'channels') return `${record.owner} · ${this.statusName(record.minstatus)}`
        if (this.mode === 'reserved') {
          return record.active_channel_count ? `${record.active_channel_count} active collision` : 'Available protection'
        }
        return record.duplicate_count ? `${record.duplicate_count} duplicate row(s)` : 'Unique phrase'
      },
      recordIcon (record) {
        if (this.mode === 'channels') return record.has_password ? 'fa fa-lock' : 'fa fa-comments'
        return this.modeConfig.icon
      },
      statusName (value) {
        const status = this.statuses.find(option => Number(option.value) === Number(value))
        return status ? status.label : `Status ${value}`
      },
      indefinite (value) {
        return /^[aeiou]/i.test(value) ? `an ${value}` : `a ${value}`
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
          : 'The Chat Administration request could not be completed.'
      }
    }
  }
</script>

<style>
@import '../../../assets/css/content-editor-workspace.css';
@import '../../../assets/css/operational-editors.css';

.chat-administration-page .operational-tab-switch {
  margin: -3px 0 11px;
}

.chat-administration-page .operational-tab-switch small {
  color: #7f8b95;
  font-size: 8px;
  margin-left: auto;
}

.chat-administration-page .operational-tab-switch button.active small {
  color: #d8c474;
}

.operational-owner-field {
  display: grid;
  gap: 7px;
  grid-template-columns: minmax(0, 1fr) auto auto;
}

.operational-password-control {
  display: grid;
  gap: 7px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.operational-password-control button {
  align-items: center;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(178, 191, 204, 0.22);
  color: #9ca8b0;
  display: flex !important;
  font-size: 9px;
  gap: 7px;
  justify-content: center;
  min-height: 39px;
}

.operational-password-control button.active {
  background: rgba(210, 170, 69, 0.11);
  border-color: rgba(210, 170, 69, 0.42);
  color: #dfca77;
}

.operational-inline-warning {
  align-items: flex-start;
  background: rgba(210, 170, 69, 0.08);
  border: 1px solid rgba(210, 170, 69, 0.24);
  color: #cfc486;
  display: flex;
  font-size: 9px;
  gap: 8px;
  margin-top: 10px;
  padding: 9px 10px;
}

.operational-inline-warning--danger {
  background: rgba(189, 65, 72, 0.09);
  border-color: rgba(189, 65, 72, 0.3);
  color: #e2a0a4;
}

.operational-context-card {
  align-items: center;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(178, 191, 204, 0.15);
  display: flex;
  gap: 10px;
  padding: 11px;
}

.operational-context-card > i {
  color: #74adbd;
  font-size: 18px;
}

.operational-context-card strong,
.operational-context-card span {
  display: block;
}

.operational-context-card strong {
  color: #d4d9dc;
  font-size: 10px;
}

.operational-context-card span {
  color: #818e97;
  font-size: 9px;
  margin-top: 2px;
}

@media (max-width: 760px) {
  .operational-owner-field,
  .operational-password-control {
    grid-template-columns: 1fr;
  }
}
</style>
