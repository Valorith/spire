<template>
  <content-area class="spire-editor-page achievement-editor character-achievement-editor-page">
    <div class="spire-editor-toolbar character-achievement-toolbar">
      <div>
        <div class="spire-editor-kicker">Admin &middot; player services</div>
        <h1 class="spire-editor-title">
          <i class="ra ra-trophy mr-1" aria-hidden="true"></i> Character Achievements
        </h1>
        <p class="spire-editor-subtitle">
          Inspect durable completion, component progress, reward delivery, and queued world updates with offline-only,
          concurrency-checked repair controls.
        </p>
      </div>
      <div class="spire-editor-summary" aria-label="Character achievement editor status">
        <span><strong>{{ number(characterTotal) }}</strong> characters</span>
        <span class="spire-editor-summary__divider"></span>
        <span><strong>{{ selectedCharacter ? number(selectedCompletionTotal) : '—' }}</strong> completed</span>
        <span class="spire-editor-summary__divider"></span>
        <span :class="schemaReady ? 'ca-ready-text' : 'ca-danger-text'">
          <strong>{{ schemaReady ? 'Ready' : 'Blocked' }}</strong> schema
        </span>
      </div>
    </div>

    <eq-window v-if="initialLoading" title="Achievement State Safety Check">
      <div class="spire-editor-empty" data-testid="character-achievement-initial-loading">
        <div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin" aria-hidden="true"></i></div>
        <h3>Validating both achievement databases…</h3>
        <p>Character administration stays closed until the content and durable-state schemas are proven compatible.</p>
      </div>
    </eq-window>

    <eq-window v-else-if="!schemaReady" title="Achievement Administration Is Fail-Closed">
      <div class="ca-schema-failure" role="alert" data-testid="character-achievement-schema-failure">
        <div class="ca-schema-failure__heading">
          <span><i class="fa fa-lock" aria-hidden="true"></i></span>
          <div>
            <h2>No achievement state was changed</h2>
            <p>
              {{ schemaGuidance }} This editor never creates or alters EQEmu schema; install the matching source migrations,
              then run the check again.
            </p>
          </div>
          <b-button size="sm" variant="outline-warning" :disabled="schemaLoading" @click="retryInitialization">
            <i :class="schemaLoading ? 'fa fa-spinner fa-spin' : 'fa fa-refresh'" class="mr-1"></i>Recheck
          </b-button>
        </div>

        <div class="ca-schema-area-grid">
          <section v-for="area in schemaAreas" :key="area.key" class="ca-schema-area">
            <div class="ca-schema-area__title">
              <div>
                <span>{{ area.label }}</span>
                <strong>{{ area.data.database || 'Connected EQEmu database' }}</strong>
              </div>
              <span class="ca-state-badge" :class="area.data.ready ? 'ca-state-badge--success' : 'ca-state-badge--danger'">
                {{ area.data.ready ? 'Ready' : 'Needs attention' }}
              </span>
            </div>
            <ul v-if="area.data.issues && area.data.issues.length" class="ca-schema-issues">
              <li v-for="(issue, index) in area.data.issues" :key="area.key + '-' + index">
                <strong>{{ issue.table || area.label }}<template v-if="issue.column">.{{ issue.column }}</template></strong>
                <span>{{ issue.message || issue.code || 'Schema requirement is not satisfied.' }}</span>
              </li>
            </ul>
            <p v-else class="ca-schema-empty">No detailed issue was returned. Review the server log for the failed schema probe.</p>
          </section>
        </div>
      </div>
    </eq-window>

    <div v-else class="spire-editor-workspace character-achievement-workspace">
      <aside class="spire-editor-directory character-achievement-directory">
        <eq-window title="Characters">
          <div class="spire-editor-directory-controls ca-directory-controls">
            <div class="spire-editor-search">
              <i class="fa fa-search" aria-hidden="true"></i>
              <input
                id="character-achievement-character-search"
                v-model.trim="characterSearch"
                class="form-control form-control-sm"
                placeholder="Search character name or exact ID…"
                autocomplete="off"
                data-testid="character-achievement-character-search"
                @input="queueCharacterSearch"
              >
              <button
                v-if="characterSearch"
                class="spire-editor-search-clear"
                type="button"
                aria-label="Clear character search"
                @click="clearCharacterSearch"
              >
                <i class="fa fa-times" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <p class="ca-control-help">
            Search reads character identity and aggregate achievement counts only; it does not join content tables into the
            character database.
          </p>

          <div class="spire-editor-filter ca-presence-filter" role="group" aria-label="Character presence filter">
            <button
              v-for="option in presenceOptions"
              :key="option.value"
              type="button"
              :class="{ active: presenceFilter === option.value }"
              :title="option.help"
              @click="selectPresence(option.value)"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="spire-editor-directory-meta">
            <span>{{ number(characterTotal) }} records</span>
            <span v-if="loadingCharacters"><i class="fa fa-spinner fa-spin mr-1"></i>Refreshing</span>
            <span v-else>Page {{ characterPage }}</span>
          </div>

          <div class="spire-editor-directory-list" data-testid="character-achievement-character-directory">
            <button
              v-for="character in characters"
              :key="'achievement-character-' + character.id"
              class="spire-editor-directory-row ca-character-row"
              :class="{ active: Number(selectedCharacterID) === Number(character.id) }"
              type="button"
              @click="selectCharacter(character.id)"
            >
              <span class="spire-editor-directory-icon">
                <i class="ra ra-player" aria-hidden="true"></i>
              </span>
              <span class="spire-editor-directory-body">
                <span class="spire-editor-directory-name">
                  {{ character.name }}
                  <span class="ca-presence-dot" :class="isOnline(character) ? 'online' : 'offline'" aria-hidden="true"></span>
                </span>
                <span class="spire-editor-directory-detail">
                  L{{ character.level }} {{ className(character.class) }} &middot;
                  {{ number(character.achievement_completion_count) }} completed
                </span>
                <span class="ca-directory-counts">
                  {{ number(character.achievement_progress_count) }} active &middot;
                  {{ number(character.achievement_progress_row_count) }} rows &middot;
                  {{ exactUnsignedCount(character.achievement_progress_total) }} total count
                </span>
              </span>
              <span class="spire-editor-directory-aside">
                <span :class="isOnline(character) ? 'ca-online-label' : 'ca-offline-label'">
                  {{ isOnline(character) ? 'Online' : 'Offline' }}
                </span>
                #{{ character.id }}
              </span>
            </button>

            <div v-if="characterError" class="spire-editor-directory-state spire-editor-directory-state--error" role="alert">
              <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
              <span>{{ characterError }}</span>
              <button class="btn btn-sm btn-outline-warning" type="button" @click="loadCharacters">Retry</button>
            </div>
            <div v-else-if="loadingCharacters && !characters.length" class="spire-editor-directory-state">
              <i class="fa fa-spinner fa-spin" aria-hidden="true"></i>
              <span>Loading character achievement summaries…</span>
            </div>
            <div v-else-if="!characters.length" class="spire-editor-directory-state">
              <i class="fa fa-search" aria-hidden="true"></i>
              <span>No characters match this search and presence filter.</span>
            </div>
          </div>

          <nav v-if="characterTotalPages > 1" class="spire-editor-pagination" aria-label="Character result pages">
            <button type="button" aria-label="Previous character page" :disabled="characterPage <= 1" @click="changeCharacterPage(characterPage - 1)">
              <i class="fa fa-angle-left" aria-hidden="true"></i>
            </button>
            <span><strong>{{ characterPage }}</strong> / {{ characterTotalPages }}</span>
            <button type="button" aria-label="Next character page" :disabled="characterPage >= characterTotalPages" @click="changeCharacterPage(characterPage + 1)">
              <i class="fa fa-angle-right" aria-hidden="true"></i>
            </button>
          </nav>
        </eq-window>
      </aside>

      <main class="spire-editor-inspector character-achievement-inspector">
        <eq-window v-if="detailError && !detail" title="Character Achievement Workspace">
          <div class="spire-editor-empty spire-editor-empty--error" role="alert">
            <div class="spire-editor-empty__sigil"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i></div>
            <h3>Character achievement state could not be loaded</h3>
            <p>{{ detailError }}</p>
            <b-button size="sm" variant="outline-warning" @click="reloadSelected">
              <i class="fa fa-refresh mr-1"></i>Retry
            </b-button>
          </div>
        </eq-window>

        <eq-window v-else-if="loadingDetail && !detail" title="Character Achievement Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin" aria-hidden="true"></i></div>
            <h3>Loading split-database achievement state…</h3>
            <p>Definitions and durable character rows are queried independently and assembled without a cross-database join.</p>
          </div>
        </eq-window>

        <eq-window v-else-if="!detail" title="Character Achievement Workspace">
          <div class="spire-editor-empty">
            <div class="spire-editor-empty__sigil"><i class="ra ra-trophy" aria-hidden="true"></i></div>
            <h3>Select a character</h3>
            <p>Choose a character to inspect completion, exact component progress, reward ledgers, and queued updates.</p>
          </div>
        </eq-window>

        <div v-else data-testid="character-achievement-inspector">
          <eq-window title="Character" class="mb-2">
            <div class="spire-editor-header ca-character-header">
              <div class="spire-editor-identity">
                <span class="spire-editor-identity-icon"><i class="ra ra-player" aria-hidden="true"></i></span>
                <div>
                  <div class="spire-editor-eyebrow">
                    Character #{{ detail.character.id }} &middot; account #{{ detail.character.account_id }}
                  </div>
                  <h2>{{ detail.character.name }}</h2>
                  <p>
                    Level {{ detail.character.level }} {{ className(detail.character.class) }} &middot;
                    last login {{ formatTime(detail.character.last_login) }}
                  </p>
                </div>
              </div>
              <div class="ca-character-header__actions">
                <span
                  class="ca-presence-badge"
                  :class="characterOnline ? 'ca-presence-badge--online' : 'ca-presence-badge--offline'"
                  data-testid="character-achievement-presence"
                >
                  <i class="fa fa-circle" aria-hidden="true"></i>
                  {{ characterOnline ? 'Online — repairs locked' : 'Offline — repairs available' }}
                </span>
                <b-button size="sm" variant="outline-warning" :disabled="loadingDetail" @click="reloadSelected">
                  <i :class="loadingDetail ? 'fa fa-spinner fa-spin' : 'fa fa-refresh'" class="mr-1"></i>Refresh
                </b-button>
              </div>
            </div>

            <div v-if="characterOnline" class="ca-online-warning" role="alert" data-testid="character-achievement-online-warning">
              <i class="fa fa-lock" aria-hidden="true"></i>
              <div>
                <strong>Log this character out before changing achievement state.</strong>
                <span>
                  An online zone process caches achievement state and reward work. Offline-only repair prevents a cached save
                  or delivery from racing this editor.
                </span>
              </div>
            </div>
          </eq-window>

          <eq-window title="Achievement State">
            <eq-tabs :selected="selectedTab" :bottom-tab-margin="18" @on-selected="selectTab">
              <eq-tab name="Achievements" :selected="selectedTab === 'Achievements'">
                <div class="editor-section-heading ca-section-heading">
                  <div>
                    <span class="section-kicker">Durable state</span>
                    <h3>Definitions, completion, and component progress</h3>
                  </div>
                  <span class="section-help">
                    Counts are exact persisted values. This editor does not synthesize game events or deliver completion rewards directly.
                  </span>
                </div>

                <div class="ca-definition-controls">
                  <div class="ca-filter-field ca-filter-field--search">
                    <label for="character-achievement-definition-search">
                      Achievement search
                      <span class="ca-help-mark" title="Matches achievement ID, name, description, and associated category text.">?</span>
                    </label>
                    <div class="spire-editor-search">
                      <i class="fa fa-search" aria-hidden="true"></i>
                      <input
                        id="character-achievement-definition-search"
                        v-model.trim="achievementSearch"
                        class="form-control form-control-sm"
                        placeholder="Name, category, description, or exact ID…"
                        autocomplete="off"
                        data-testid="character-achievement-definition-search"
                        @input="queueAchievementSearch"
                      >
                    </div>
                    <small>Search is sent to the bounded definition query; numeric IDs remain directly addressable.</small>
                  </div>
                  <div class="ca-filter-field">
                    <label for="character-achievement-state-filter">
                      Definition state
                      <span class="ca-help-mark" title="Filters the assembled definition and durable character-state view.">?</span>
                    </label>
                    <select
                      id="character-achievement-state-filter"
                      v-model="stateFilter"
                      class="form-control form-control-sm"
                      data-testid="character-achievement-state-filter"
                      @change="changeStateFilter"
                    >
                      <option v-for="option in stateOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                    <small>{{ activeStateHelp }}</small>
                  </div>
                  <div class="ca-filter-field ca-filter-summary">
                    <span>Result page</span>
                    <strong>{{ number(visibleAchievementRows.length) }} shown</strong>
                    <small>{{ number(achievementTotal) }} matching definitions &middot; page {{ achievementPage }}</small>
                  </div>
                </div>

                <div v-if="detailError" class="ca-inline-error" role="alert">
                  <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>{{ detailError }}
                </div>
                <div v-if="loadingDetail" class="ca-inline-loading" role="status">
                  <i class="fa fa-spinner fa-spin" aria-hidden="true"></i>Refreshing definition state…
                </div>

                <div v-if="!visibleAchievementRows.length && !loadingDetail" class="operations-empty-inline ca-empty-results">
                  No definitions match this search and state filter. Orphaned rows appear under the <strong>Orphaned state</strong> filter.
                </div>

                <div class="ca-achievement-list" data-testid="character-achievement-definition-list">
                  <article
                    v-for="row in visibleAchievementRows"
                    :key="'character-achievement-' + row.id"
                    class="ca-achievement-card"
                    :class="{ 'ca-achievement-card--expanded': isExpanded(row.id), 'ca-achievement-card--orphan': row.definitionMissing }"
                    :data-testid="'character-achievement-record-' + row.id"
                  >
                    <div class="ca-achievement-card__header">
                      <button class="ca-achievement-card__toggle" type="button" @click="toggleAchievement(row.id)">
                        <span class="ca-achievement-card__icon"><i :class="row.definitionMissing ? 'fa fa-unlink' : 'ra ra-trophy'"></i></span>
                        <span class="ca-achievement-card__identity">
                          <span class="ca-achievement-card__eyebrow">
                            Achievement #{{ row.id }} &middot; definition v{{ row.definitionVersion }}
                          </span>
                          <strong>{{ row.name }}</strong>
                          <small>{{ row.description || (row.definitionMissing ? 'Durable rows remain, but the content definition is missing.' : 'No definition description.') }}</small>
                        </span>
                        <span class="ca-achievement-card__summary">
                          <span>{{ number(row.points) }} pts</span>
                          <span>{{ row.componentRows.length }} components</span>
                          <span>{{ row.rewardViews.length }} rewards</span>
                        </span>
                        <i :class="isExpanded(row.id) ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" aria-hidden="true"></i>
                      </button>
                      <div class="ca-achievement-card__badges" aria-label="Achievement state">
                        <span v-for="badge in row.badges" :key="badge.label" class="ca-state-badge" :class="'ca-state-badge--' + badge.tone" :title="badge.help">
                          {{ badge.label }}
                        </span>
                      </div>
                      <div class="ca-achievement-card__actions">
                        <b-button
                          size="sm"
                          variant="outline-success"
                          :disabled="Boolean(completeDisabledReason(row))"
                          :title="completeDisabledReason(row) || 'Persist completion at the current definition version without directly delivering rewards.'"
                          :data-testid="'character-achievement-complete-' + row.id"
                          @click="openCompleteAction(row)"
                        >
                          <i class="fa fa-check mr-1"></i>Complete
                        </b-button>
                        <b-button
                          size="sm"
                          variant="outline-danger"
                          :disabled="Boolean(resetDisabledReason(row))"
                          :title="resetDisabledReason(row) || 'Remove completion and progress; reward history is preserved unless explicitly selected in the confirmation dialog.'"
                          :data-testid="'character-achievement-reset-' + row.id"
                          @click="openResetAction(row)"
                        >
                          <i class="fa fa-undo mr-1"></i>Reset
                        </b-button>
                      </div>
                    </div>

                    <div v-if="isExpanded(row.id)" class="ca-achievement-card__detail">
                      <div class="ca-definition-facts">
                        <section><span>Published</span><strong>{{ row.enabled ? 'Enabled' : 'Disabled' }}</strong><small>Disabled definitions remain visible for state repair.</small></section>
                        <section><span>Content version</span><strong>{{ row.definitionVersion }}</strong><small>Persisted rows must match this version.</small></section>
                        <section><span>Completion</span><strong>{{ row.completion ? formatTime(row.completion.completed_at) : 'Not completed' }}</strong><small>{{ row.completion ? 'Stored version ' + row.completion.version : 'No completion ledger row' }}</small></section>
                        <section><span>Categories</span><strong>{{ row.categories.length ? row.categories.join(', ') : 'Uncategorized' }}</strong><small>Client browsing associations.</small></section>
                      </div>

                      <section class="ca-detail-section">
                        <div class="ca-detail-section__heading">
                          <div><span>Component ledger</span><h4>Exact progress and authored requirements</h4></div>
                          <small>Type 3 components are presentation-only and cannot carry durable progress.</small>
                        </div>
                        <div class="ca-table-wrap">
                          <table class="ca-state-table">
                            <thead>
                              <tr>
                                <th title="Wire type, stable component ID, and client display sequence.">Component</th>
                                <th title="Current durable count compared with the enabled authored requirement.">Progress</th>
                                <th title="Persisted completion flag and state version.">Persisted state</th>
                                <th title="Engine event criteria that update this component.">Criteria</th>
                                <th class="text-right">Repair</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="component in row.componentRows" :key="row.id + '-component-' + component.component_type + '-' + component.component_id">
                                <td>
                                  <strong>{{ enumLabel('component_types', component.component_type) }} #{{ component.component_id }}</strong>
                                  <small>Sequence {{ component.sequence }} &middot; type {{ component.component_type }}</small>
                                  <small>{{ component.name || 'No component name.' }}</small>
                                  <small v-if="component.description">{{ component.description }}</small>
                                </td>
                                <td>
                                  <strong>{{ exactUnsignedCount(component.currentCount) }} / {{ number(component.requiredCount) }}</strong>
                                  <div class="ca-progress-track" :title="progressPercent(component) + '% of the authored requirement'">
                                    <span :style="{ width: progressPercent(component) + '%' }"></span>
                                  </div>
                                  <small>{{ component.progress ? 'Updated ' + formatTime(component.progress.updated_at) : 'No durable progress row' }}</small>
                                </td>
                                <td>
                                  <span class="ca-state-badge" :class="component.completed ? 'ca-state-badge--success' : 'ca-state-badge--neutral'">
                                    {{ component.completed ? 'Complete' : 'Open' }}
                                  </span>
                                  <small>Stored v{{ component.progress ? component.progress.version : '—' }}</small>
                                </td>
                                <td>
                                  <div v-if="component.criteria.length" class="ca-criteria-list">
                                    <span v-for="criterion in component.criteria" :key="criterion.id || criterion.event_type + '-' + criterion.target_id">
                                      <strong>{{ enumLabel('event_types', criterion.event_type) }}</strong>
                                      <small>{{ criterionSummary(criterion) }}</small>
                                    </span>
                                  </div>
                                  <small v-else>No server criterion is authored for this component.</small>
                                </td>
                                <td class="text-right">
                                  <b-button
                                    size="sm"
                                    variant="outline-warning"
                                    :disabled="Boolean(progressDisabledReason(row, component))"
                                    :title="progressDisabledReason(row, component) || 'Write one exact durable component value with expected-value protection.'"
                                    :data-testid="'character-achievement-progress-' + row.id + '-' + component.component_type + '-' + component.component_id"
                                    @click="openProgressAction(row, component)"
                                  >
                                    <i class="fa fa-pencil mr-1"></i>Set exact
                                  </b-button>
                                </td>
                              </tr>
                              <tr v-if="!row.componentRows.length">
                                <td colspan="5" class="ca-empty-cell">No component definitions or orphaned progress rows exist.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </section>

                      <section class="ca-detail-section">
                        <div class="ca-detail-section__heading">
                          <div><span>Reward ledger</span><h4>Canonical grants and durable delivery state</h4></div>
                          <small>Status 1 is durably delivered. In-flight or failed rows require explicit duplicate-risk acceptance.</small>
                        </div>
                        <div class="ca-table-wrap">
                          <table class="ca-state-table">
                            <thead><tr><th>Grant</th><th>Delivery state</th><th>Attempts and diagnostics</th><th class="text-right">Repair</th></tr></thead>
                            <tbody>
                              <tr v-for="reward in row.rewardViews" :key="row.id + '-reward-' + reward.reward_id">
                                <td>
                                  <strong>{{ enumLabel('reward_types', reward.reward_type) }} &middot; {{ reward.description || ('Reward #' + reward.reward_id) }}</strong>
                                  <small>ID {{ reward.reward_id }} &middot; data {{ reward.reward_data_id || 0 }} &middot; amount {{ reward.amount || '0' }}</small>
                                  <small>{{ reward.selectable ? 'Selectable reward option' : 'Automatic completion grant' }}</small>
                                </td>
                                <td>
                                  <span class="ca-state-badge" :class="'ca-state-badge--' + rewardStatusTone(reward.ledger && reward.ledger.status)">
                                    {{ reward.ledger ? enumLabel('reward_statuses', reward.ledger.status) : 'No ledger row' }}
                                  </span>
                                  <small v-if="reward.ledger && reward.ledger.granted_at">Granted {{ formatTime(reward.ledger.granted_at) }}</small>
                                </td>
                                <td>
                                  <strong>{{ reward.ledger ? number(reward.ledger.attempt_count) : 0 }} attempts</strong>
                                  <small v-if="reward.ledger && reward.ledger.last_attempt_at">Last {{ formatTime(reward.ledger.last_attempt_at) }}</small>
                                  <small v-if="reward.ledger && reward.ledger.last_error" class="ca-row-error">{{ reward.ledger.last_error }}</small>
                                  <small v-else>No stored delivery error.</small>
                                </td>
                                <td class="text-right">
                                  <b-button
                                    v-if="reward.ledger"
                                    size="sm"
                                    variant="outline-danger"
                                    :disabled="Boolean(rewardRetryDisabledReason(row, reward))"
                                    :title="rewardRetryDisabledReason(row, reward) || 'Mark this in-flight or failed grant retryable after reviewing duplicate-delivery risk.'"
                                    :data-testid="'character-achievement-reward-retry-' + reward.reward_id"
                                    @click="openRewardRetryAction(row, reward)"
                                  >
                                    <i class="fa fa-repeat mr-1"></i>Retry
                                  </b-button>
                                  <small v-else>Nothing durable to repair.</small>
                                </td>
                              </tr>
                              <tr v-if="!row.rewardViews.length"><td colspan="4" class="ca-empty-cell">No canonical rewards or orphaned reward ledgers exist.</td></tr>
                            </tbody>
                          </table>
                        </div>
                      </section>

                      <section v-if="row.selectionViews.length" class="ca-detail-section">
                        <div class="ca-detail-section__heading">
                          <div><span>Selectable bundles</span><h4>Whole-selection ledger state</h4></div>
                          <small>Per-entry reward ledgers still prevent already-finalized grants from replaying.</small>
                        </div>
                        <div class="ca-table-wrap">
                          <table class="ca-state-table">
                            <thead><tr><th>Set and selected option</th><th>Status</th><th>Attempts and diagnostics</th><th class="text-right">Repair</th></tr></thead>
                            <tbody>
                              <tr v-for="selection in row.selectionViews" :key="row.id + '-selection-' + selection.reward_set_id">
                                <td><strong>{{ selection.title || ('Reward set #' + selection.reward_set_id) }}</strong><small>{{ selection.optionLabel }}</small></td>
                                <td><span class="ca-state-badge" :class="'ca-state-badge--' + selectionStatusTone(selection.status)">{{ enumLabel('selection_statuses', selection.status) }}</span><small v-if="selection.claimed_at">Claimed {{ formatTime(selection.claimed_at) }}</small></td>
                                <td><strong>{{ number(selection.attempt_count) }} attempts</strong><small v-if="selection.last_attempt_at">Last {{ formatTime(selection.last_attempt_at) }}</small><small v-if="selection.last_error" class="ca-row-error">{{ selection.last_error }}</small><small v-else>No stored claim error.</small></td>
                                <td class="text-right">
                                  <b-button size="sm" variant="outline-danger" :disabled="Boolean(selectionRetryDisabledReason(row, selection))" :title="selectionRetryDisabledReason(row, selection) || 'Return this interrupted, failed, or ambiguous selected bundle to retryable state.'" :data-testid="'character-achievement-selection-retry-' + selection.reward_set_id" @click="openSelectionRetryAction(row, selection)">
                                    <i class="fa fa-repeat mr-1"></i>Retry
                                  </b-button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </section>

                      <section v-if="row.updates.length" class="ca-detail-section">
                        <div class="ca-detail-section__heading">
                          <div><span>World queue</span><h4>Pending achievement updates</h4></div>
                          <small>Queued group/raid/shared-task work is durable and normally consumed by the character's zone.</small>
                        </div>
                        <div class="ca-table-wrap">
                          <table class="ca-state-table">
                            <thead><tr><th>Update</th><th>Requested work</th><th>Status and error</th><th class="text-right">Repair</th></tr></thead>
                            <tbody>
                              <tr v-for="update in row.updates" :key="'inline-update-' + update.update_id">
                                <td><strong>#{{ update.update_id }}</strong><small>{{ enumLabel('update_source_types', update.source_target_type) }} #{{ update.source_target_id }}</small><small>Created {{ formatTime(update.created_at) }}</small></td>
                                <td><strong>{{ enumLabel('update_operations', update.operation) }}</strong><small>Component type {{ update.component_type }}, ID {{ update.component_id }}</small><small>Requested value {{ number(update.requested_value) }} &middot; v{{ update.version }}</small></td>
                                <td><span class="ca-state-badge" :class="'ca-state-badge--' + updateStatusTone(update.status)">{{ enumLabel('update_statuses', update.status) }}</span><small>{{ number(update.attempt_count) }} attempts</small><small v-if="update.last_error" class="ca-row-error">{{ update.last_error }}</small></td>
                                <td class="text-right ca-inline-actions">
                                  <b-button size="sm" variant="outline-warning" :disabled="Boolean(updateRetryDisabledReason(row, update))" :title="updateRetryDisabledReason(row, update) || 'Return this compatible blocked row to pending.'" @click="openUpdateAction(row, update, 'retry')">Retry</b-button>
                                  <b-button size="sm" variant="outline-danger" :disabled="Boolean(updateDiscardDisabledReason(row, update))" :title="updateDiscardDisabledReason(row, update) || 'Discard a pending/blocked row or explicitly recover an expired processing lease.'" @click="openUpdateAction(row, update, 'discard')">Discard</b-button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </div>
                  </article>
                </div>

                <nav v-if="achievementTotalPages > 1" class="spire-editor-pagination ca-definition-pagination" aria-label="Achievement definition pages">
                  <button type="button" aria-label="Previous achievement page" :disabled="achievementPage <= 1" @click="changeAchievementPage(achievementPage - 1)"><i class="fa fa-angle-left"></i></button>
                  <span><strong>{{ achievementPage }}</strong> / {{ achievementTotalPages }}</span>
                  <button type="button" aria-label="Next achievement page" :disabled="achievementPage >= achievementTotalPages" @click="changeAchievementPage(achievementPage + 1)"><i class="fa fa-angle-right"></i></button>
                </nav>
              </eq-tab>

              <eq-tab name="Rewards & Selections" :selected="selectedTab === 'Rewards & Selections'">
                <div class="editor-section-heading ca-section-heading">
                  <div><span class="section-kicker">Delivery diagnostics</span><h3>Reward and selection ledgers needing attention</h3></div>
                  <span class="section-help">A retry changes ledger eligibility; the game server performs actual delivery after the character logs in.</span>
                </div>

                <div class="ca-guide-callout">
                  <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
                  <div><strong>Never infer failure from a missing success message alone.</strong><span>Status 0 can mean external delivery happened before persistence failed. Every retry therefore requires explicit duplicate-risk acceptance.</span></div>
                </div>

                <div class="ca-guide-callout ca-guide-callout--info">
                  <i class="fa fa-filter" aria-hidden="true"></i>
                  <div>
                    <strong>Showing ledgers for achievement result page {{ achievementPage }} of {{ achievementTotalPages }}.</strong>
                    <span>Page through the matching achievement set below, or narrow it to definitions whose ledgers need attention.</span>
                  </div>
                  <b-button size="sm" variant="outline-info" @click="applyStateFromTab('reward_attention')">Show attention only</b-button>
                </div>

                <section class="ca-detail-section">
                  <div class="ca-detail-section__heading"><div><span>Individual grants</span><h4>{{ flatRewardLedgers.length }} durable reward rows on this page</h4></div><small>Delivered rows are intentionally immutable from this retry surface.</small></div>
                  <div class="ca-table-wrap">
                    <table class="ca-state-table">
                      <thead><tr><th>Achievement and grant</th><th>Status</th><th>Attempt history</th><th class="text-right">Repair</th></tr></thead>
                      <tbody>
                        <tr v-for="entry in flatRewardLedgers" :key="'all-reward-' + entry.reward.reward_id">
                          <td><strong>{{ entry.row.name }}</strong><small>#{{ entry.row.id }} &middot; {{ entry.reward.description || enumLabel('reward_types', entry.reward.reward_type) }}</small><small>Reward ID {{ entry.reward.reward_id }}</small></td>
                          <td><span class="ca-state-badge" :class="'ca-state-badge--' + rewardStatusTone(entry.reward.ledger.status)">{{ enumLabel('reward_statuses', entry.reward.ledger.status) }}</span><small v-if="entry.reward.ledger.granted_at">Granted {{ formatTime(entry.reward.ledger.granted_at) }}</small></td>
                          <td><strong>{{ number(entry.reward.ledger.attempt_count) }} attempts</strong><small v-if="entry.reward.ledger.last_attempt_at">Last {{ formatTime(entry.reward.ledger.last_attempt_at) }}</small><small v-if="entry.reward.ledger.last_error" class="ca-row-error">{{ entry.reward.ledger.last_error }}</small></td>
                          <td class="text-right"><b-button size="sm" variant="outline-danger" :disabled="Boolean(rewardRetryDisabledReason(entry.row, entry.reward))" :title="rewardRetryDisabledReason(entry.row, entry.reward)" @click="openRewardRetryAction(entry.row, entry.reward)"><i class="fa fa-repeat mr-1"></i>Retry</b-button></td>
                        </tr>
                        <tr v-if="!flatRewardLedgers.length"><td colspan="4" class="ca-empty-cell">This result page contains no durable reward ledgers.</td></tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section class="ca-detail-section">
                  <div class="ca-detail-section__heading"><div><span>Whole bundles</span><h4>{{ flatSelections.length }} selectable reward rows on this page</h4></div><small>An unselected status-0 choice is already pending and does not need repair.</small></div>
                  <div class="ca-table-wrap">
                    <table class="ca-state-table">
                      <thead><tr><th>Achievement and set</th><th>Choice</th><th>Status and attempts</th><th class="text-right">Repair</th></tr></thead>
                      <tbody>
                        <tr v-for="entry in flatSelections" :key="'all-selection-' + entry.row.id + '-' + entry.selection.reward_set_id">
                          <td><strong>{{ entry.row.name }}</strong><small>#{{ entry.row.id }} &middot; {{ entry.selection.title || ('Set #' + entry.selection.reward_set_id) }}</small></td>
                          <td><strong>{{ entry.selection.optionLabel }}</strong><small>Option #{{ entry.selection.selected_option_id }}</small></td>
                          <td><span class="ca-state-badge" :class="'ca-state-badge--' + selectionStatusTone(entry.selection.status)">{{ enumLabel('selection_statuses', entry.selection.status) }}</span><small>{{ number(entry.selection.attempt_count) }} attempts</small><small v-if="entry.selection.last_error" class="ca-row-error">{{ entry.selection.last_error }}</small></td>
                          <td class="text-right"><b-button size="sm" variant="outline-danger" :disabled="Boolean(selectionRetryDisabledReason(entry.row, entry.selection))" :title="selectionRetryDisabledReason(entry.row, entry.selection)" @click="openSelectionRetryAction(entry.row, entry.selection)"><i class="fa fa-repeat mr-1"></i>Retry</b-button></td>
                        </tr>
                        <tr v-if="!flatSelections.length"><td colspan="4" class="ca-empty-cell">This result page contains no selectable reward ledgers.</td></tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <nav v-if="achievementTotalPages > 1" class="spire-editor-pagination ca-definition-pagination" aria-label="Reward achievement result pages">
                  <button type="button" aria-label="Previous reward achievement page" :disabled="achievementPage <= 1" @click="changeAchievementPage(achievementPage - 1)"><i class="fa fa-angle-left"></i></button>
                  <span><strong>{{ achievementPage }}</strong> / {{ achievementTotalPages }}</span>
                  <button type="button" aria-label="Next reward achievement page" :disabled="achievementPage >= achievementTotalPages" @click="changeAchievementPage(achievementPage + 1)"><i class="fa fa-angle-right"></i></button>
                </nav>
              </eq-tab>

              <eq-tab name="Pending Queue" :selected="selectedTab === 'Pending Queue'">
                <div class="editor-section-heading ca-section-heading">
                  <div><span class="section-kicker">World handoff</span><h3>Durable pending achievement updates</h3></div>
                  <span class="section-help">Pending rows are normal. Active status-2 leases stay locked; a status-2 lease expired for at least 60 seconds requires explicit recovery acknowledgement.</span>
                </div>

                <div class="ca-guide-callout ca-guide-callout--info">
                  <i class="fa fa-filter" aria-hidden="true"></i>
                  <div>
                    <strong>Showing queued rows for achievement result page {{ achievementPage }} of {{ achievementTotalPages }}.</strong>
                    <span>Page through the matching achievement set below, or narrow it to definitions with queued work.</span>
                  </div>
                  <b-button size="sm" variant="outline-info" @click="applyStateFromTab('pending_update')">Show queued only</b-button>
                </div>

                <div class="ca-update-summary-grid">
                  <section><span>Pending</span><strong>{{ updateCount(0) }}</strong><small>Waiting for a zone consumer</small></section>
                  <section><span>Blocked</span><strong>{{ updateCount(1) }}</strong><small>Requires diagnosis</small></section>
                  <section><span>Processing</span><strong>{{ updateCount(2) }}</strong><small>{{ staleProcessingUpdateCount }} expired lease{{ staleProcessingUpdateCount === 1 ? '' : 's' }} need{{ staleProcessingUpdateCount === 1 ? 's' : '' }} review</small></section>
                  <section><span>Orphaned</span><strong>{{ orphanUpdateCount }}</strong><small>Definition no longer exists</small></section>
                </div>

                <div class="ca-table-wrap mt-3">
                  <table class="ca-state-table" data-testid="character-achievement-pending-updates">
                    <thead><tr><th>Update identity</th><th>Achievement and request</th><th>Concurrency state</th><th>Diagnostic</th><th class="text-right">Actions</th></tr></thead>
                    <tbody>
                      <tr v-for="entry in flatUpdates" :key="'queue-' + entry.update.update_id">
                        <td><strong>#{{ entry.update.update_id }}</strong><small>{{ enumLabel('update_source_types', entry.update.source_target_type) }} #{{ entry.update.source_target_id }}</small><small>{{ formatTime(entry.update.created_at) }}</small></td>
                        <td><strong>{{ entry.row.name }}</strong><small>Achievement #{{ entry.row.id }} &middot; {{ enumLabel('update_operations', entry.update.operation) }}</small><small>Component {{ entry.update.component_type }}/{{ entry.update.component_id }} becomes at least {{ number(entry.update.requested_value) }}</small></td>
                        <td><span class="ca-state-badge" :class="'ca-state-badge--' + updateStatusTone(entry.update.status)">{{ enumLabel('update_statuses', entry.update.status) }}</span><small>Stored v{{ entry.update.version }} &middot; current v{{ entry.row.definitionVersion }}</small><small>{{ number(entry.update.attempt_count) }} attempts</small></td>
                        <td><span v-if="entry.update.last_error" class="ca-row-error">{{ entry.update.last_error }}</span><span v-else>No stored diagnostic.</span><small v-if="entry.update.last_attempt_at">Last attempt {{ formatTime(entry.update.last_attempt_at) }}</small></td>
                        <td class="text-right ca-inline-actions"><b-button size="sm" variant="outline-warning" :disabled="Boolean(updateRetryDisabledReason(entry.row, entry.update))" :title="updateRetryDisabledReason(entry.row, entry.update)" @click="openUpdateAction(entry.row, entry.update, 'retry')">Retry</b-button><b-button size="sm" variant="outline-danger" :disabled="Boolean(updateDiscardDisabledReason(entry.row, entry.update))" :title="updateDiscardDisabledReason(entry.row, entry.update) || 'Discard a pending/blocked row or explicitly recover an expired processing lease.'" @click="openUpdateAction(entry.row, entry.update, 'discard')">Discard</b-button></td>
                      </tr>
                      <tr v-if="!flatUpdates.length"><td colspan="5" class="ca-empty-cell">This result page contains no queued updates.</td></tr>
                    </tbody>
                  </table>
                </div>

                <nav v-if="achievementTotalPages > 1" class="spire-editor-pagination ca-definition-pagination" aria-label="Pending update achievement result pages">
                  <button type="button" aria-label="Previous pending update achievement page" :disabled="achievementPage <= 1" @click="changeAchievementPage(achievementPage - 1)"><i class="fa fa-angle-left"></i></button>
                  <span><strong>{{ achievementPage }}</strong> / {{ achievementTotalPages }}</span>
                  <button type="button" aria-label="Next pending update achievement page" :disabled="achievementPage >= achievementTotalPages" @click="changeAchievementPage(achievementPage + 1)"><i class="fa fa-angle-right"></i></button>
                </nav>
              </eq-tab>

              <eq-tab name="Audit & Safety" :selected="selectedTab === 'Audit & Safety'">
                <div class="editor-section-heading ca-section-heading">
                  <div><span class="section-kicker">Operator guidance</span><h3>Safety model and audit history</h3></div>
                  <span class="section-help">Every update is transactional, character-locked, offline-only, expected-value protected, and attributed to its operator.</span>
                </div>

                <div class="ca-safety-grid">
                  <section><i class="fa fa-power-off"></i><div><strong>Offline means authoritative</strong><span>The zone process owns cached player state while online. Logging out creates one safe database authority.</span></div></section>
                  <section><i class="fa fa-code-fork"></i><div><strong>Conflicts stop, never merge</strong><span>Expected versions, status, attempts, and current counts prevent a stale browser from overwriting newer work.</span></div></section>
                  <section><i class="fa fa-clock-o"></i><div><strong>Processing leases expire safely</strong><span>Status 2 remains locked for 60 seconds after its last attempt. Recovery after expiry requires a separate acknowledgement.</span></div></section>
                  <section><i class="fa fa-gift"></i><div><strong>Delivery is ledger-backed</strong><span>Status 1 proves delivery. Status 0 is ambiguous, so retry requires explicit duplicate-risk acceptance.</span></div></section>
                  <section><i class="fa fa-undo"></i><div><strong>Reset preserves rewards</strong><span>A normal reset removes completion and progress only. Clearing reward history is a separate high-risk choice.</span></div></section>
                  <section><i class="fa fa-database"></i><div><strong>Schema remains source-owned</strong><span>Spire validates tables, columns, indexes, unsigned types, and engines, but never performs achievement DDL.</span></div></section>
                  <section><i class="fa fa-history"></i><div><strong>Reasons are durable</strong><span>Use a specific support, correction, migration, or incident reason; generic filler defeats the audit trail.</span></div></section>
                </div>

                <section class="ca-detail-section">
                  <div class="ca-detail-section__heading">
                    <div><span>Schema diagnostics</span><h4>Verified content and character areas</h4></div>
                    <small>Both areas must remain ready before any action button is enabled.</small>
                  </div>
                  <div class="ca-schema-ready-grid">
                    <section v-for="area in schemaAreas" :key="'ready-' + area.key">
                      <span>{{ area.label }}</span><strong>{{ area.data.database || 'Connected database' }}</strong><small>{{ Object.keys(area.data.tables || {}).length }} required tables checked &middot; {{ (area.data.issues || []).length }} issues</small>
                    </section>
                  </div>
                </section>

                <section class="ca-detail-section">
                  <div class="ca-detail-section__heading">
                    <div><span>Metadata glossary</span><h4>How to read stored values</h4></div>
                    <small>Descriptions come from the server metadata endpoint, with conservative editor fallbacks.</small>
                  </div>
                  <div class="ca-glossary-grid">
                    <section v-for="group in glossaryGroups" :key="group.key">
                      <h5>{{ group.label }}</h5>
                      <dl><template v-for="option in enumOptions(group.key)"><dt :key="group.key + '-' + option.value + '-term'">{{ option.value }} &middot; {{ option.label }}</dt><dd :key="group.key + '-' + option.value + '-description'">{{ option.description || 'No additional server description.' }}</dd></template></dl>
                    </section>
                  </div>
                </section>

                <section class="ca-detail-section">
                  <div class="ca-detail-section__heading">
                    <div><span>Operator trail</span><h4>Recent character achievement changes</h4></div>
                    <b-button size="sm" variant="outline-warning" :disabled="loadingAudit" @click="loadAudit"><i :class="loadingAudit ? 'fa fa-spinner fa-spin' : 'fa fa-refresh'" class="mr-1"></i>Refresh</b-button>
                  </div>
                  <div v-if="auditError" class="ca-inline-error" role="alert">{{ auditError }}</div>
                  <div v-if="loadingAudit && !auditRows.length" class="ca-inline-loading"><i class="fa fa-spinner fa-spin"></i>Loading audit history…</div>
                  <div v-else class="ca-audit-list" data-testid="character-achievement-audit-list">
                    <article v-for="audit in auditRows" :key="'achievement-audit-' + audit.id">
                      <span class="ca-audit-icon"><i class="fa fa-history"></i></span>
                      <div><div class="ca-audit-title"><strong>{{ auditEventLabel(audit.event_name) }}</strong><span>#{{ audit.id }}</span></div><p>{{ audit.user_name || ('User #' + audit.user_id) }} &middot; {{ formatTime(audit.created_at) }}</p><dl><template v-for="item in auditDataRows(audit.data)"><dt :key="audit.id + '-' + item.key + '-k'">{{ humanize(item.key) }}</dt><dd :key="audit.id + '-' + item.key + '-v'">{{ item.value }}</dd></template></dl></div>
                    </article>
                    <div v-if="!auditRows.length && !loadingAudit" class="ca-empty-cell">No character achievement audit rows were returned.</div>
                  </div>
                  <nav v-if="auditTotalPages > 1" class="spire-editor-pagination mt-3" aria-label="Audit pages"><button type="button" aria-label="Previous audit page" :disabled="auditPage <= 1" @click="changeAuditPage(auditPage - 1)"><i class="fa fa-angle-left"></i></button><span><strong>{{ auditPage }}</strong> / {{ auditTotalPages }}</span><button type="button" aria-label="Next audit page" :disabled="auditPage >= auditTotalPages" @click="changeAuditPage(auditPage + 1)"><i class="fa fa-angle-right"></i></button></nav>
                </section>
              </eq-tab>
            </eq-tabs>
          </eq-window>
        </div>
      </main>
    </div>

    <character-achievement-action-modal
      v-model="actionOpen"
      :action="activeAction"
      :character-name="detail && detail.character ? detail.character.name : ''"
      :busy="operationBusy"
      @submit="submitAction"
    />

    <transition name="spire-editor-fade">
      <div v-if="notification.message" class="spire-editor-notification" :class="{ error: notification.type === 'error' }" role="status" data-testid="character-achievement-notification">
        <i :class="notification.type === 'error' ? 'fa fa-exclamation-triangle' : 'fa fa-check-circle'"></i>
        {{ notification.message }}
      </div>
    </transition>
  </content-area>
</template>

<script>
  import ContentArea from '@/components/layout/ContentArea.vue'
  import EqWindow from '@/components/eq-ui/EQWindow.vue'
  import EqTabs from '@/components/eq-ui/EQTabs.vue'
  import EqTab from '@/components/eq-ui/EQTab.vue'
  import CharacterAchievementActionModal from './CharacterAchievementActionModal.vue'
  import { SpireApi } from '@/app/api/spire-api'
  import { DB_PLAYER_CLASSES } from '@/app/constants/eq-classes-constants'

  const UINT32_MAX = 4294967295

  const METADATA_ENUM_KEYS = {
    event_types: 'events',
    reward_statuses: 'character_reward_statuses',
    selection_statuses: 'character_selection_statuses',
    update_source_types: 'update_target_types',
    update_statuses: 'character_update_statuses'
  }

  const FALLBACK_ENUMS = {
    component_types: [
      { value: 0, label: 'Completion', description: 'State-bearing completion objective rendered by the client.' },
      { value: 1, label: 'Indirect', description: 'State-bearing indirect or prerequisite objective.' },
      { value: 2, label: 'Display', description: 'State-bearing display objective with a progress channel.' },
      { value: 3, label: 'Presentation only', description: 'Client presentation row; it cannot carry server criteria or durable progress.' }
    ],
    event_types: [
      { value: 0, label: 'Manual', description: 'Changed only by explicit scripting or administration.' },
      { value: 1, label: 'Level', description: 'Compares character level.' },
      { value: 2, label: 'NPC type kill', description: 'Counts a specific NPC type ID.' },
      { value: 3, label: 'NPC race kill', description: 'Counts kills by race ID.' },
      { value: 4, label: 'Task complete', description: 'Counts completion of a task ID.' },
      { value: 5, label: 'Zone enter', description: 'Observes entry to a zone ID and version.' },
      { value: 6, label: 'Loot item', description: 'Counts looting a specific item ID.' },
      { value: 7, label: 'Own item', description: 'Reconciles current ownership of an item.' },
      { value: 8, label: 'Tradeskill success', description: 'Counts successful combines for a recipe.' },
      { value: 9, label: 'Skill value', description: 'Compares an observed skill value.' },
      { value: 10, label: 'Alternate advancement', description: 'Observes a specific alternate advancement.' },
      { value: 11, label: 'Achievement complete', description: 'Depends on another achievement.' },
      { value: 12, label: 'NPC name kill', description: 'Counts a canonical NPC-name hash.' },
      { value: 13, label: 'Skill cap', description: 'Compares a class/skill cap at a milestone level.' }
    ],
    progress_modes: [
      { value: 0, label: 'Increment', description: 'Adds event values to current progress.' },
      { value: 1, label: 'Highest', description: 'Keeps the highest observed value.' },
      { value: 2, label: 'Set', description: 'Replaces progress with the event value.' },
      { value: 3, label: 'Boolean', description: 'Treats the criterion as satisfied or unsatisfied.' }
    ],
    behaviors: [
      { value: 0, label: 'Required', description: 'Must be satisfied for completion.' },
      { value: 1, label: 'Optional', description: 'Tracks state without blocking completion.' },
      { value: 2, label: 'Unlock', description: 'Controls state visibility or availability.' },
      { value: 3, label: 'Visibility', description: 'Controls whether the definition is shown.' },
      { value: 4, label: 'Display only', description: 'Presents information without completion authority.' },
      { value: 5, label: 'Blocker', description: 'Prevents completion while satisfied.' }
    ],
    reward_types: [
      { value: 0, label: 'Item', description: 'Summons an item with the authored amount as charges or stack count.' },
      { value: 1, label: 'Experience', description: 'Awards character experience.' },
      { value: 2, label: 'Alternate advancement', description: 'Awards unspent AA points.' },
      { value: 3, label: 'Copper', description: 'Awards coin measured in copper.' },
      { value: 4, label: 'Alternate currency', description: 'Awards a configured alternate currency.' },
      { value: 5, label: 'Title', description: 'Unlocks a title set.' },
      { value: 6, label: 'Alternate Advancement ability', description: 'Grants a specific AA ability to the authored cumulative rank.' },
      { value: 7, label: 'Class-ineligible AA fallback', description: 'Awards unspent AA points when a playable class cannot receive the paired specific AA ability.' }
    ],
    reward_statuses: [
      { value: 0, label: 'In-flight / ambiguous', description: 'Delivery may have happened, but durable finalization did not.' },
      { value: 1, label: 'Delivered', description: 'Durably granted; replay is prevented.' },
      { value: 2, label: 'Retryable failure', description: 'Delivery explicitly failed and can be retried.' }
    ],
    selection_statuses: [
      { value: 0, label: 'Pending / in progress', description: 'Option 0 is unselected; a nonzero option may be interrupted.' },
      { value: 1, label: 'Fully granted', description: 'The whole selected bundle is durably finalized.' },
      { value: 2, label: 'Retryable failure', description: 'The selected bundle explicitly failed.' },
      { value: 3, label: 'Ambiguous delivery', description: 'At least one selected grant may have been delivered.' }
    ],
    update_statuses: [
      { value: 0, label: 'Pending', description: 'Waiting for the character zone/login consumer.' },
      { value: 1, label: 'Blocked', description: 'Retained with a diagnostic because safe application failed.' },
      { value: 2, label: 'Processing', description: 'Claimed by a zone process under a renewable lease.' }
    ],
    update_operations: [
      { value: 0, label: 'Progress floor', description: 'Raises progress to at least the requested value.' },
      { value: 1, label: 'Complete', description: 'Idempotently requests achievement completion.' }
    ],
    update_source_types: [
      { value: 0, label: 'Unknown source', description: 'Legacy or unspecified world target.' },
      { value: 1, label: 'Group', description: 'Expanded from a group-wide event.' },
      { value: 2, label: 'Raid', description: 'Expanded from a raid-wide event.' },
      { value: 3, label: 'Dynamic zone', description: 'Expanded from a dynamic-zone event.' },
      { value: 4, label: 'Shared task', description: 'Expanded from a shared-task event.' }
    ]
  }

  const clone = value => JSON.parse(JSON.stringify(value == null ? {} : value))
  const array = value => Array.isArray(value) ? value : []
  const numeric = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

  function blankSchema () {
    return {
      ready: false,
      guidance: 'Install EQEmu database updates 9329 (achievement content) and 9330 (character achievement state). Rewritten CREATE migrations do not alter tables created by an older draft.',
      content: { ready: false, database: '', tables: {}, issues: [] },
      character: { ready: false, database: '', tables: {}, issues: [] }
    }
  }

  function blankDetail () {
    return {
      character: null,
      definitions: [],
      associations: [],
      components: [],
      criteria: [],
      rewards: [],
      reward_sets: [],
      reward_options: [],
      reward_option_entries: [],
      completions: [],
      progress: [],
      reward_ledgers: [],
      reward_selections: [],
      pending_updates: [],
      orphan_achievement_ids: []
    }
  }

  export default {
    name: 'CharacterAchievementEditor',
    components: { ContentArea, EqWindow, EqTabs, EqTab, CharacterAchievementActionModal },
    data () {
      return {
        metadata: {},
        schema: blankSchema(),
        metadataLoading: false,
        schemaLoading: false,
        initialized: false,
        characters: [],
        characterTotal: 0,
        characterPage: 1,
        characterLimit: 30,
        characterSearch: '',
        presenceFilter: 'all',
        loadingCharacters: false,
        characterError: '',
        selectedCharacterID: null,
        detail: null,
        detailRows: [],
        achievementTotal: 0,
        achievementPage: 1,
        achievementLimit: 25,
        achievementSearch: '',
        stateFilter: 'all',
        loadingDetail: false,
        detailError: '',
        detailRequestGeneration: 0,
        expandedAchievements: {},
        selectedTab: 'Achievements',
        auditRows: [],
        auditTotal: 0,
        auditPage: 1,
        auditLimit: 25,
        loadingAudit: false,
        auditError: '',
        auditRequestGeneration: 0,
        actionOpen: false,
        activeAction: {},
        operationBusy: false,
        characterSearchTimer: null,
        achievementSearchTimer: null,
        processingLeaseTimer: null,
        processingLeaseNow: Math.floor(Date.now() / 1000),
        syncingRoute: false,
        notification: { message: '', type: 'success', timer: null },
        presenceOptions: [
          { value: 'all', label: 'All', help: 'Show online and offline characters.' },
          { value: 'online', label: 'Online', help: 'Inspect live state; repair actions remain locked.' },
          { value: 'offline', label: 'Offline', help: 'Show characters eligible for safe durable-state repair.' }
        ],
        stateOptions: [
          { value: 'all', label: 'All definitions', help: 'Show every enabled or disabled definition returned by the bounded catalog.' },
          { value: 'completed', label: 'Completed', help: 'Definitions with a durable character_achievements row.' },
          { value: 'not_completed', label: 'Not completed', help: 'Definitions without a completion ledger row, including in-progress work.' },
          { value: 'in_progress', label: 'In progress', help: 'Not completed and carrying at least one positive durable component count.' },
          { value: 'not_started', label: 'Not started', help: 'No completion and no positive durable component progress.' },
          { value: 'version_mismatch', label: 'Version mismatch', help: 'Persisted state targets a different definition version; version 0 is compared exactly.' },
          { value: 'reward_attention', label: 'Reward attention', help: 'Contains an in-flight, failed, or ambiguous reward/selection ledger.' },
          { value: 'pending_update', label: 'Pending update', help: 'Contains at least one durable world-handoff row.' },
          { value: 'orphaned', label: 'Orphaned state', help: 'Durable character rows remain after their content definition was removed.' }
        ],
        glossaryGroups: [
          { key: 'reward_statuses', label: 'Reward ledger statuses' },
          { key: 'selection_statuses', label: 'Selection statuses' },
          { key: 'update_statuses', label: 'Pending update statuses' },
          { key: 'component_types', label: 'Component wire types' }
        ]
      }
    },
    computed: {
      initialLoading () {
        return !this.initialized || this.metadataLoading || this.schemaLoading
      },
      schemaReady () {
        return Boolean(this.schema && this.schema.ready === true && this.schema.content && this.schema.content.ready === true && this.schema.character && this.schema.character.ready === true)
      },
      schemaGuidance () {
        return (this.schema && this.schema.guidance) || blankSchema().guidance
      },
      schemaAreas () {
        const schema = this.schema || blankSchema()
        return [
          { key: 'content', label: 'Achievement content', data: schema.content || blankSchema().content },
          { key: 'character', label: 'Character state', data: schema.character || blankSchema().character }
        ]
      },
      characterTotalPages () {
        return Math.max(1, Math.ceil(this.characterTotal / this.characterLimit))
      },
      selectedCharacter () {
        if (this.detail && this.detail.character) return this.detail.character
        return this.characters.find(row => Number(row.id) === Number(this.selectedCharacterID)) || null
      },
      characterOnline () {
        return this.isOnline(this.selectedCharacter)
      },
      completionTotal () {
        return this.detail ? array(this.detail.completions).length : 0
      },
      selectedCompletionTotal () {
        const value = this.selectedCharacter && this.selectedCharacter.achievement_completion_count
        return value === undefined || value === null ? this.completionTotal : numeric(value)
      },
      activeStateHelp () {
        const option = this.stateOptions.find(row => row.value === this.stateFilter)
        return option ? option.help : ''
      },
      visibleAchievementRows () {
        const query = String(this.achievementSearch || '').trim().toLowerCase()
        return this.detailRows.filter(row => {
          if (!this.rowMatchesState(row, this.stateFilter)) return false
          if (!query) return true
          return [row.id, row.name, row.description].concat(row.categories).join(' ').toLowerCase().includes(query)
        })
      },
      achievementTotalPages () {
        return Math.max(1, Math.ceil(this.achievementTotal / this.achievementLimit))
      },
      flatRewardLedgers () {
        const output = []
        this.detailRows.forEach(row => row.rewardViews.forEach(reward => {
          if (reward.ledger) output.push({ row, reward })
        }))
        return output
      },
      flatSelections () {
        const output = []
        this.detailRows.forEach(row => row.selectionViews.forEach(selection => output.push({ row, selection })))
        return output
      },
      flatUpdates () {
        const output = []
        this.detailRows.forEach(row => row.updates.forEach(update => output.push({ row, update })))
        return output
      },
      orphanUpdateCount () {
        return this.flatUpdates.filter(entry => entry.row.definitionMissing).length
      },
      staleProcessingUpdateCount () {
        return this.flatUpdates.filter(entry => this.isStaleProcessingLease(entry.update)).length
      },
      auditTotalPages () {
        return Math.max(1, Math.ceil(this.auditTotal / this.auditLimit))
      }
    },
    watch: {
      '$route.query.character' (value) {
        if (this.syncingRoute || !this.initialized) return
        const id = numeric(value)
        if (id && id !== Number(this.selectedCharacterID)) this.selectCharacter(id, false)
        if (!id && this.selectedCharacterID) this.clearSelection(false)
      },
      '$route.query.tab' (value) {
        if (this.syncingRoute) return
        const tab = ['Achievements', 'Rewards & Selections', 'Pending Queue', 'Audit & Safety'].includes(value) ? value : 'Achievements'
        if (tab !== this.selectedTab) this.selectTab(tab, false)
      },
      '$route.query.state' (value) {
        if (this.syncingRoute) return
        const state = this.stateOptions.some(option => option.value === value) ? value : 'all'
        if (state !== this.stateFilter) {
          this.stateFilter = state
          this.achievementPage = 1
          this.loadDetail(false)
        }
      },
      '$route.query.achievement_page' (value) {
        if (this.syncingRoute) return
        const page = Math.max(1, numeric(value, 1))
        if (page !== this.achievementPage) {
          this.achievementPage = page
          this.loadDetail(false)
        }
      },
      '$route.query.character_q' (value) {
        if (this.syncingRoute) return
        const query = String(value || '')
        if (query !== this.characterSearch) {
          this.characterSearch = query
          this.characterPage = Math.max(1, numeric(this.$route.query.character_page, 1))
          this.loadCharacters()
        }
      },
      '$route.query.character_page' (value) {
        if (this.syncingRoute) return
        const page = Math.max(1, numeric(value, 1))
        if (page !== this.characterPage) {
          this.characterPage = page
          this.loadCharacters()
        }
      },
      '$route.query.presence' (value) {
        if (this.syncingRoute) return
        const presence = this.presenceOptions.some(option => option.value === value) ? value : 'all'
        if (presence !== this.presenceFilter) {
          this.presenceFilter = presence
          this.characterPage = 1
          this.loadCharacters()
        }
      },
      '$route.query.achievement_q' (value) {
        if (this.syncingRoute) return
        const query = String(value || '')
        if (query !== this.achievementSearch) {
          this.achievementSearch = query
          this.achievementPage = Math.max(1, numeric(this.$route.query.achievement_page, 1))
          this.loadDetail(false)
        }
      },
      '$route.query.achievement' (value) {
        if (this.syncingRoute) return
        const id = numeric(value)
        if (id && this.detailRows.some(row => row.id === id)) this.$set(this.expandedAchievements, String(id), true)
      },
      '$route.query.audit_page' (value) {
        if (this.syncingRoute) return
        const page = Math.max(1, numeric(value, 1))
        if (page !== this.auditPage) {
          this.auditPage = page
          if (this.selectedTab === 'Audit & Safety') this.loadAudit()
        }
      }
    },
    async created () {
      this.readRoute()
      this.processingLeaseTimer = window.setInterval(() => {
        this.processingLeaseNow = Math.floor(Date.now() / 1000)
      }, 1000)
      await this.initialize()
    },
    beforeDestroy () {
      window.clearTimeout(this.characterSearchTimer)
      window.clearTimeout(this.achievementSearchTimer)
      window.clearTimeout(this.notification.timer)
      window.clearInterval(this.processingLeaseTimer)
    },
    methods: {
      readRoute () {
        const query = (this.$route && this.$route.query) || {}
        this.selectedCharacterID = numeric(query.character) || null
        this.selectedTab = ['Achievements', 'Rewards & Selections', 'Pending Queue', 'Audit & Safety'].includes(query.tab) ? query.tab : 'Achievements'
        this.stateFilter = this.stateOptions.some(option => option.value === query.state) ? query.state : 'all'
        this.characterSearch = String(query.character_q || '')
        this.characterPage = Math.max(1, numeric(query.character_page, 1))
        this.presenceFilter = this.presenceOptions.some(option => option.value === query.presence) ? query.presence : 'all'
        this.achievementSearch = String(query.achievement_q || '')
        this.achievementPage = Math.max(1, numeric(query.achievement_page, 1))
        this.auditPage = Math.max(1, numeric(query.audit_page, 1))
      },
      async initialize (refreshSchema = false) {
        this.initialized = false
        await Promise.all([this.loadMetadata(), this.loadSchema(refreshSchema)])
        this.initialized = true
        if (!this.schemaReady) return
        await this.loadCharacters()
        if (this.selectedCharacterID) await this.selectCharacter(this.selectedCharacterID, false)
      },
      async retryInitialization () {
        await this.initialize(true)
      },
      async loadMetadata () {
        this.metadataLoading = true
        try {
          const response = await SpireApi.v1().get('/character-achievement-editor/metadata')
          const payload = response.data && response.data.data ? response.data.data : response.data
          this.metadata = payload || {}
        } catch (error) {
          this.metadata = {}
          this.showNotification(this.errorMessage(error, 'Server metadata was unavailable; conservative labels are being used.'), 'error')
        } finally {
          this.metadataLoading = false
        }
      },
      async loadSchema (refreshSchema = false) {
        this.schemaLoading = true
        try {
          const response = await SpireApi.v1().get('/character-achievement-editor/schema', { params: refreshSchema ? { refresh: 1 } : {} })
          const payload = response.data && response.data.data ? response.data.data : response.data
          const schema = payload || blankSchema()
          if (typeof schema.ready === 'undefined') schema.ready = Boolean(schema.content && schema.content.ready && schema.character && schema.character.ready)
          this.schema = schema
        } catch (error) {
          const schema = blankSchema()
          schema.character.issues = [{ code: 'schema_probe_failed', message: this.errorMessage(error, 'The schema diagnostic request failed.') }]
          this.schema = schema
        } finally {
          this.schemaLoading = false
        }
      },
      async loadCharacters () {
        if (!this.schemaReady) return
        this.loadingCharacters = true
        this.characterError = ''
        try {
          const response = await SpireApi.v1().get('/character-achievement-editor/characters', {
            params: {
              q: this.characterSearch,
              page: this.characterPage,
              limit: this.characterLimit,
              presence: this.presenceFilter
            }
          })
          const payload = response.data || {}
          let records = array(payload.data)
          if (this.presenceFilter !== 'all') {
            const online = this.presenceFilter === 'online'
            records = records.filter(record => this.isOnline(record) === online)
          }
          this.characters = records
          this.characterTotal = numeric(payload.total, records.length)
          if (this.characterPage > this.characterTotalPages) {
            this.characterPage = this.characterTotalPages
            return this.loadCharacters()
          }
        } catch (error) {
          this.characters = []
          this.characterTotal = 0
          this.characterError = this.errorMessage(error, 'Unable to load character achievement summaries.')
        } finally {
          this.loadingCharacters = false
        }
      },
      queueCharacterSearch () {
        window.clearTimeout(this.characterSearchTimer)
        this.characterPage = 1
        this.characterSearchTimer = window.setTimeout(async () => {
          await this.loadCharacters()
          this.syncRoute()
        }, 260)
      },
      clearCharacterSearch () {
        this.characterSearch = ''
        this.characterPage = 1
        this.loadCharacters()
        this.syncRoute()
      },
      selectPresence (presence) {
        this.presenceFilter = presence
        this.characterPage = 1
        this.loadCharacters()
        this.syncRoute()
      },
      changeCharacterPage (page) {
        this.characterPage = page
        this.loadCharacters()
        this.syncRoute()
      },
      async selectCharacter (id, updateRoute = true) {
        this.auditRequestGeneration += 1
        this.loadingAudit = false
        this.selectedCharacterID = numeric(id)
        this.actionOpen = false
        this.expandedAchievements = {}
        this.auditRows = []
        this.auditTotal = 0
        this.auditPage = 1
        this.auditError = ''
        await this.loadDetail(false)
        if (this.selectedTab === 'Audit & Safety') await this.loadAudit()
        if (updateRoute) await this.syncRoute()
      },
      clearSelection (updateRoute = true) {
        this.detailRequestGeneration += 1
        this.auditRequestGeneration += 1
        this.loadingAudit = false
        this.selectedCharacterID = null
        this.detail = null
        this.detailRows = []
        this.achievementTotal = 0
        this.detailError = ''
        this.auditRows = []
        this.auditTotal = 0
        this.auditPage = 1
        this.auditError = ''
        if (updateRoute) this.syncRoute()
      },
      async reloadSelected () {
        if (!this.selectedCharacterID) return
        await Promise.all([this.loadDetail(false), this.selectedTab === 'Audit & Safety' ? this.loadAudit() : Promise.resolve()])
        await this.loadCharacters()
      },
      queueAchievementSearch () {
        window.clearTimeout(this.achievementSearchTimer)
        this.achievementPage = 1
        this.achievementSearchTimer = window.setTimeout(async () => {
          await this.loadDetail(false)
          this.syncRoute()
        }, 260)
      },
      changeStateFilter () {
        this.achievementPage = 1
        this.expandedAchievements = {}
        this.loadDetail(false)
        this.syncRoute()
      },
      applyStateFromTab (state) {
        this.stateFilter = state
        this.achievementPage = 1
        this.expandedAchievements = {}
        this.loadDetail(false)
        this.syncRoute()
      },
      changeAchievementPage (page) {
        this.achievementPage = page
        this.expandedAchievements = {}
        this.loadDetail(false)
        this.syncRoute()
      },
      async loadDetail (sync = true) {
        if (!this.selectedCharacterID || !this.schemaReady) return
        const generation = ++this.detailRequestGeneration
        const snapshot = {
          characterID: numeric(this.selectedCharacterID),
          search: String(this.achievementSearch || ''),
          state: String(this.stateFilter || 'all'),
          page: numeric(this.achievementPage, 1),
          limit: numeric(this.achievementLimit, 25)
        }
        const isCurrent = () => generation === this.detailRequestGeneration &&
          snapshot.characterID === numeric(this.selectedCharacterID) &&
          snapshot.search === String(this.achievementSearch || '') &&
          snapshot.state === String(this.stateFilter || 'all') &&
          snapshot.page === numeric(this.achievementPage, 1) &&
          snapshot.limit === numeric(this.achievementLimit, 25)
        this.loadingDetail = true
        this.detailError = ''
        try {
          const response = await SpireApi.v1().get(`/character-achievement-editor/character/${snapshot.characterID}`, {
            params: {
              q: snapshot.search,
              state: snapshot.state,
              page: snapshot.page,
              limit: snapshot.limit
            }
          })
          if (!isCurrent()) return
          const envelope = response.data || {}
          const payload = envelope.detail || envelope.data || envelope
          this.applyDetail(payload, envelope)
          if (this.achievementPage > this.achievementTotalPages) {
            this.achievementPage = this.achievementTotalPages
            return this.loadDetail(sync)
          }
          if (sync) await this.syncRoute()
        } catch (error) {
          if (!isCurrent()) return
          this.detailError = this.errorMessage(error, 'Unable to load character achievement state.')
          if (!this.detail) this.detailRows = []
        } finally {
          if (generation === this.detailRequestGeneration) this.loadingDetail = false
        }
      },
      applyDetail (payload, envelope = {}) {
        const normalized = Object.assign(blankDetail(), clone(payload || {}))
        this.detail = normalized
        this.detailRows = this.buildDetailRows(normalized)
        this.achievementTotal = numeric(envelope.total || payload.total || payload.definition_total, this.detailRows.length)
        const requested = numeric(this.$route && this.$route.query && this.$route.query.achievement)
        if (requested && this.detailRows.some(row => row.id === requested)) this.$set(this.expandedAchievements, String(requested), true)
      },
      buildDetailRows (detail) {
        const definitions = array(detail.definitions).map(definition => clone(definition))
        return definitions.map(definition => {
          const id = numeric(definition.id)
          const associations = array(detail.associations).filter(row => numeric(row.achievement_id) === id)
          const components = array(detail.components).filter(row => numeric(row.achievement_id) === id)
          const criteria = array(detail.criteria).filter(row => numeric(row.achievement_id) === id)
          const progress = array(detail.progress).filter(row => numeric(row.achievement_id) === id)
          const completion = array(detail.completions).find(row => numeric(row.achievement_id) === id) || null
          const rewards = array(detail.rewards).filter(row => numeric(row.source_id) === id)
          const ledgers = array(detail.reward_ledgers).filter(row => numeric(row.achievement_id) === id)
          const rewardSets = array(detail.reward_sets).filter(row => numeric(row.source_id) === id)
          const selections = array(detail.reward_selections).filter(row => numeric(row.achievement_id) === id)
          const updates = array(detail.pending_updates).filter(row => numeric(row.achievement_id) === id)
          const definitionMissing = Boolean(definition.definition_missing || array(detail.orphan_achievement_ids).some(value => numeric(value) === id))
          const componentRows = this.buildComponentRows(id, components, criteria, progress)
          const rewardViews = this.buildRewardViews(id, rewards, ledgers, detail)
          const selectionViews = this.buildSelectionViews(id, rewardSets, selections, detail)
          const definitionVersion = numeric(definition.version)
          const versionedRows = []
          if (completion) versionedRows.push(completion)
          progress.forEach(row => versionedRows.push(row))
          updates.forEach(row => versionedRows.push(row))
          const versionMismatch = Boolean(definition.version_mismatch) || (!definitionMissing && versionedRows.some(row => numeric(row.version) !== definitionVersion))
          const rewardAttention = Boolean(definition.reward_attention) || rewardViews.some(reward => reward.ledger && numeric(reward.ledger.status) !== 1) || selectionViews.some(selection => ![0, 1].includes(numeric(selection.status)) || (numeric(selection.status) === 0 && numeric(selection.selected_option_id) > 0))
          const inProgress = definition.state === 'in_progress' || (!completion && componentRows.some(component => numeric(component.currentCount) > 0))
          const row = {
            id,
            name: definition.name || `Achievement #${id}`,
            description: definition.description || '',
            iconID: numeric(definition.icon_id),
            points: numeric(definition.points),
            enabled: Boolean(definition.enabled),
            definitionVersion,
            definitionMissing,
            categories: associations.reduce((values, association) => values.concat([
              association.category_name,
              association.display_text,
              (!association.category_name && !association.display_text) ? `Category #${association.category_id}` : ''
            ]), []).filter(Boolean),
            associations,
            completion,
            componentRows,
            rewardViews,
            selectionViews,
            updates,
            versionMismatch,
            rewardAttention,
            inProgress,
            hasState: Boolean(completion || progress.length || ledgers.length || selections.length || updates.length)
          }
          row.badges = this.buildBadges(row)
          return row
        })
      },
      buildComponentRows (achievementID, components, criteria, progress) {
        const rows = components.map(component => clone(component))
        progress.forEach(state => {
          if (!rows.some(component => numeric(component.component_type) === numeric(state.component_type) && numeric(component.component_id) === numeric(state.component_id))) {
            rows.push({
              achievement_id: achievementID,
              component_type: numeric(state.component_type),
              sequence: numeric(state.component_sequence),
              component_id: numeric(state.component_id),
              name: 'Orphaned durable component progress',
              description: '',
              presentation_count: numeric(state.current_count),
              canonical_missing: true
            })
          }
        })
        return rows.map(component => {
          const componentCriteria = criteria.filter(criterion => numeric(criterion.component_type) === numeric(component.component_type) && numeric(criterion.component_id) === numeric(component.component_id))
          const state = progress.find(row => numeric(row.component_type) === numeric(component.component_type) && numeric(row.component_id) === numeric(component.component_id)) || null
          const required = componentCriteria.filter(criterion => Boolean(criterion.enabled)).reduce((maximum, criterion) => Math.max(maximum, numeric(criterion.required_count)), 0)
          return Object.assign({}, component, {
            criteria: componentCriteria,
            progress: state,
            currentCount: state ? String(state.current_count === undefined || state.current_count === null ? '0' : state.current_count) : '0',
            requiredCount: required || numeric(component.presentation_count) || 1,
            completed: Boolean(state && state.completed)
          })
        }).sort((left, right) => numeric(left.sequence) - numeric(right.sequence) || numeric(left.component_type) - numeric(right.component_type) || numeric(left.component_id) - numeric(right.component_id))
      },
      buildRewardViews (achievementID, rewards, ledgers, detail) {
        const views = rewards.map(reward => clone(reward))
        ledgers.forEach(ledger => {
          if (!views.some(reward => String(reward.reward_id) === String(ledger.reward_id))) {
            views.push({ reward_id: String(ledger.reward_id), achievement_id: achievementID, reward_type: -1, reward_data_id: 0, amount: '0', description: 'Orphaned reward ledger', enabled: false, canonical_missing: true })
          }
        })
        const linkedSetIDs = new Set(array(detail.reward_sets)
          .filter(set => numeric(set.source_id) === numeric(achievementID))
          .map(set => numeric(set.reward_set_id)))
        const mappings = array(detail.reward_option_entries)
          .filter(mapping => linkedSetIDs.has(numeric(mapping.reward_set_id)))
        return views.map(reward => {
          const mapping = mappings.find(row => String(row.reward_id) === String(reward.reward_id))
          return Object.assign({}, reward, {
            reward_id: String(reward.reward_id),
            ledger: ledgers.find(row => String(row.reward_id) === String(reward.reward_id)) || null,
            selectable: Boolean(mapping),
            mapping: mapping || null
          })
        }).sort((left, right) => numeric(left.sequence) - numeric(right.sequence) || String(left.reward_id).localeCompare(String(right.reward_id)))
      },
      buildSelectionViews (achievementID, rewardSets, selections, detail) {
        const sets = rewardSets.map(set => clone(set))
        selections.forEach(selection => {
          if (!sets.some(set => numeric(set.reward_set_id) === numeric(selection.reward_set_id))) {
            sets.push({ reward_set_id: numeric(selection.reward_set_id), source_id: achievementID, title: 'Orphaned reward selection', enabled: false, source_enabled: false, canonical_missing: true })
          }
        })
        return sets.map(set => {
          const ledger = selections.find(row => numeric(row.reward_set_id) === numeric(set.reward_set_id))
          if (!ledger) return null
          const options = array(detail.reward_options).filter(option => numeric(option.reward_set_id) === numeric(set.reward_set_id))
          const option = options.find(value => numeric(value.option_id) === numeric(ledger.selected_option_id))
          return Object.assign({}, set, ledger, {
            optionLabel: numeric(ledger.selected_option_id) === 0 ? 'No option selected; choice remains pending' : (option ? option.label : `Unknown option #${ledger.selected_option_id}`)
          })
        }).filter(Boolean)
      },
      buildBadges (row) {
        const badges = []
        if (row.definitionMissing) badges.push({ label: 'Orphaned', tone: 'danger', help: 'Durable state remains without a matching content definition.' })
        if (row.completion) badges.push({ label: 'Completed', tone: 'success', help: 'A durable completion ledger row exists.' })
        else if (row.inProgress) badges.push({ label: 'In progress', tone: 'warning', help: 'At least one component has positive durable progress.' })
        else badges.push({ label: 'Not started', tone: 'neutral', help: 'No completion or positive component progress exists.' })
        if (row.versionMismatch) badges.push({ label: 'Version mismatch', tone: 'danger', help: 'Persisted state targets a different definition version.' })
        if (row.rewardAttention) badges.push({ label: 'Reward attention', tone: 'danger', help: 'Reward or selection delivery needs operator review.' })
        if (row.updates.length) badges.push({ label: `${row.updates.length} queued`, tone: 'warning', help: 'Durable world updates await processing or repair.' })
        if (!row.enabled && !row.definitionMissing) badges.push({ label: 'Definition disabled', tone: 'neutral', help: 'The content definition is not in the active server snapshot.' })
        return badges
      },
      rowMatchesState (row, state) {
        if (state === 'completed') return Boolean(row.completion)
        if (state === 'not_completed') return !row.completion
        if (state === 'in_progress') return row.inProgress
        if (state === 'not_started') return !row.completion && !row.inProgress
        if (state === 'version_mismatch') return row.versionMismatch
        if (state === 'reward_attention') return row.rewardAttention
        if (state === 'pending_update') return row.updates.length > 0
        if (state === 'orphaned') return row.definitionMissing
        return true
      },
      isExpanded (id) {
        return Boolean(this.expandedAchievements[String(id)])
      },
      toggleAchievement (id) {
        const key = String(id)
        this.$set(this.expandedAchievements, key, !this.expandedAchievements[key])
        this.syncRoute(this.expandedAchievements[key] ? id : null)
      },
      async selectTab (tab, updateRoute = true) {
        this.selectedTab = tab
        if (tab === 'Audit & Safety' && !this.auditRows.length) await this.loadAudit()
        if (updateRoute) await this.syncRoute()
      },
      async loadAudit () {
        if (!this.selectedCharacterID) return
        const requestGeneration = ++this.auditRequestGeneration
        const characterID = Number(this.selectedCharacterID)
        const page = this.auditPage
        const limit = this.auditLimit
        this.loadingAudit = true
        this.auditError = ''
        try {
          const response = await SpireApi.v1().get(`/character-achievement-editor/character/${characterID}/audit`, { params: { page, limit } })
          if (!this.isAuditContextCurrent(requestGeneration, characterID, page, limit)) return
          const payload = response.data || {}
          this.auditRows = array(payload.data)
          this.auditTotal = numeric(payload.total, this.auditRows.length)
        } catch (error) {
          if (!this.isAuditContextCurrent(requestGeneration, characterID, page, limit)) return
          this.auditRows = []
          this.auditTotal = 0
          this.auditError = this.errorMessage(error, 'Unable to load the character achievement audit trail.')
        } finally {
          if (this.isAuditContextCurrent(requestGeneration, characterID, page, limit)) this.loadingAudit = false
        }
      },
      isAuditContextCurrent (requestGeneration, characterID, page, limit) {
        return requestGeneration === this.auditRequestGeneration &&
          characterID === Number(this.selectedCharacterID) &&
          page === this.auditPage &&
          limit === this.auditLimit
      },
      changeAuditPage (page) {
        this.auditPage = page
        this.loadAudit()
        this.syncRoute()
      },
      updateGuardReason () {
        if (!this.schemaReady) return 'Achievement schema diagnostics are not ready.'
        if (!this.detail || !this.detail.character) return 'Select a character first.'
        if (this.characterOnline) return `${this.detail.character.name} is online. Log the character out before changing durable state.`
        if (this.operationBusy) return 'Another achievement operation is still running.'
        return ''
      },
      completeDisabledReason (row) {
        const guard = this.updateGuardReason()
        if (guard) return guard
        if (row.definitionMissing) return 'A missing definition cannot be force-completed.'
        if (!row.enabled) return 'This definition is disabled. Enable it in the Achievement Editor before forcing completion.'
        if (row.completion) return 'This achievement is already completed.'
        if (row.versionMismatch) return 'Resolve the version mismatch or reset stale state before forcing completion.'
        return ''
      },
      isStaleProcessingLease (update) {
        if (numeric(update && update.status) !== 2) return false
        const lastAttemptAt = Math.max(0, numeric(update && update.last_attempt_at))
        return this.processingLeaseNow >= 60 && lastAttemptAt <= this.processingLeaseNow - 60
      },
      activeProcessingUpdates (row) {
        return row.updates.filter(update => numeric(update.status) === 2 && !this.isStaleProcessingLease(update))
      },
      staleProcessingUpdates (row) {
        return row.updates.filter(update => this.isStaleProcessingLease(update))
      },
      resetDisabledReason (row) {
        const guard = this.updateGuardReason()
        if (guard) return guard
        if (!row.hasState) return 'No durable completion, progress, reward, selection, or update row exists to reset.'
        const activeProcessing = this.activeProcessingUpdates(row)
        if (activeProcessing.length) return `Update #${activeProcessing[0].update_id} still has an active 60-second processing lease.`
        return ''
      },
      progressDisabledReason (row, component) {
        const guard = this.updateGuardReason()
        if (guard) return guard
        if (row.definitionMissing) return 'Orphaned progress cannot be rewritten without a definition; reset it instead.'
        if (!row.enabled) return 'This definition is disabled. Enable it in the Achievement Editor before adding positive progress.'
        if (component.canonical_missing) return 'This durable progress row no longer has a canonical component; reset the achievement instead.'
        if (row.completion) return 'Completed achievements cannot receive exact progress edits.'
        if (row.versionMismatch) return 'Progress version does not match the current definition.'
        if (numeric(component.component_type) === 3) return 'Type 3 is presentation-only and has no durable progress channel.'
        return ''
      },
      rewardRetryDisabledReason (row, reward) {
        const guard = this.updateGuardReason()
        if (guard) return guard
        if (!reward.ledger) return 'No durable reward ledger exists.'
        if (reward.canonical_missing) return 'This ledger no longer has a canonical reward grant and cannot be retried.'
        if (reward.selectable) return 'Selectable grants are reconciled as a bundle. Retry the owning reward selection instead of this individual ledger.'
        if (numeric(reward.ledger.status) === 1) return 'Delivered status 1 is durable and cannot be retried.'
        if (![0, 2].includes(numeric(reward.ledger.status))) return 'Only in-flight status 0 or retryable-failure status 2 can be reviewed for retry.'
        return ''
      },
      selectionRetryDisabledReason (row, selection) {
        const guard = this.updateGuardReason()
        if (guard) return guard
        if (selection.canonical_missing) return 'This selection no longer has a canonical reward set and cannot be retried.'
        if (numeric(selection.status) === 1) return 'A fully granted selection cannot be retried.'
        if (numeric(selection.status) === 0 && numeric(selection.selected_option_id) === 0) return 'This unselected choice is already pending and needs no retry override.'
        if (![0, 2, 3].includes(numeric(selection.status))) return 'Only interrupted, failed, or ambiguous selected bundles can be retried.'
        return ''
      },
      updateRetryDisabledReason (row, update) {
        const guard = this.updateGuardReason()
        if (guard) return guard
        if (row.definitionMissing) return 'An update without a current definition cannot be retried.'
        if (!row.enabled) return 'This definition is disabled and outside the active server snapshot. Enable it before retrying queued work.'
        if (numeric(update.status) !== 1) return 'Only blocked status 1 can be returned to pending.'
        if (numeric(update.version) !== numeric(row.definitionVersion)) return 'Stored and current definition versions differ; the row must remain blocked.'
        return ''
      },
      updateDiscardDisabledReason (row, update) {
        const guard = this.updateGuardReason()
        if (guard) return guard
        const status = numeric(update.status)
        if (status === 2 && !this.isStaleProcessingLease(update)) return 'Processing status 2 still has an active 60-second zone lease.'
        if (![0, 1, 2].includes(status)) return `Unknown update status ${update.status} cannot be discarded safely.`
        return ''
      },
      openProgressAction (row, component) {
        const blockedReason = this.progressDisabledReason(row, component)
        if (blockedReason) return this.showNotification(blockedReason, 'error')
        this.activeAction = {
          kind: 'progress',
          title: 'Set exact component progress',
          heading: `${row.name}: ${component.description || ('component #' + component.component_id)}`,
          message: 'Writes one exact durable count. The server locks the character row and rejects the request if the current count or definition version changed since this page loaded.',
          icon: 'fa fa-pencil',
          submitLabel: 'Set exact progress',
          confirmationPhrase: `PROGRESS ${row.id}`,
          before: `Component ${component.component_type}/${component.component_id} = ${component.currentCount}`,
          after: 'Component becomes the exact reviewed value',
          showProgress: true,
          progressValue: Math.min(UINT32_MAX, Math.max(0, numeric(component.currentCount))),
          progressMin: 0,
          progressMax: Math.min(UINT32_MAX, Math.max(1, numeric(component.requiredCount))),
          expectedRows: [
            { label: 'Definition version', value: row.definitionVersion },
            { label: 'Current component count', value: component.currentCount }
          ],
          endpoint: 'progress',
          payload: {
            achievement_id: row.id,
            component_type: numeric(component.component_type),
            component_id: numeric(component.component_id),
            expected_current_count: String(component.currentCount === undefined || component.currentCount === null ? '0' : component.currentCount),
            expected_version: row.definitionVersion
          }
        }
        this.actionOpen = true
      },
      openCompleteAction (row) {
        const blockedReason = this.completeDisabledReason(row)
        if (blockedReason) return this.showNotification(blockedReason, 'error')
        this.activeAction = {
          kind: 'complete',
          title: 'Force achievement completion',
          heading: `Complete ${row.name}?`,
          message: 'Persists completion at the current definition version. It does not directly deliver rewards or synthesize dependency events; the game server reconciles those on the next safe processing opportunity.',
          icon: 'fa fa-check',
          submitLabel: 'Force completion',
          confirmationPhrase: `COMPLETE ${row.id}`,
          before: row.inProgress ? 'In progress, not completed' : 'Not completed',
          after: `Completion stored at definition v${row.definitionVersion}`,
          expectedRows: [{ label: 'Definition version', value: row.definitionVersion }],
          endpoint: 'complete',
          payload: { achievement_id: row.id, expected_version: row.definitionVersion }
        }
        this.actionOpen = true
      },
      openResetAction (row) {
        const blockedReason = this.resetDisabledReason(row)
        if (blockedReason) return this.showNotification(blockedReason, 'error')
        const staleProcessing = this.staleProcessingUpdates(row)
        this.activeAction = {
          kind: 'reset',
          title: 'Reset achievement state',
          heading: `Reset ${row.name}?`,
          message: 'The normal path removes completion, component progress, and queued updates while preserving reward and selection history so recompletion cannot duplicate delivery.',
          icon: 'fa fa-undo',
          danger: true,
          submitLabel: 'Reset achievement',
          confirmationPhrase: `RESET ${row.id}`,
          confirmationPhraseWithHistory: `RESET REWARDS ${row.id}`,
          before: `${row.completion ? 'Completed' : 'Not completed'}; ${row.componentRows.filter(component => component.progress).length} progress rows; ${row.rewardViews.filter(reward => reward.ledger).length} reward rows`,
          after: 'Completion and progress removed; reward history preserved',
          afterWithHistory: 'All completion, progress, reward, selection, and queued rows removed',
          showClearHistory: true,
          riskMessage: 'Clearing reward and selection ledgers allows every authored grant to be issued again after recompletion. Choose this only when the original delivery is known to be invalid or intentionally reversed.',
          showStaleLeaseAcknowledgement: staleProcessing.length > 0,
          staleLeaseMessage: staleProcessing.length
            ? `${staleProcessing.length} status-2 update lease${staleProcessing.length === 1 ? '' : 's'} expired at least 60 seconds ago (${staleProcessing.map(update => '#' + update.update_id).join(', ')}). Reset will remove these abandoned queue rows.`
            : '',
          expectedRows: [{ label: 'Definition version', value: row.definitionVersion }].concat(staleProcessing.length
            ? [{ label: 'Expired processing update IDs', value: staleProcessing.map(update => update.update_id).join(', ') }]
            : []),
          endpoint: 'reset',
          payload: { achievement_id: row.id, expected_version: row.definitionVersion }
        }
        this.actionOpen = true
      },
      openRewardRetryAction (row, reward) {
        const blockedReason = this.rewardRetryDisabledReason(row, reward)
        if (blockedReason) return this.showNotification(blockedReason, 'error')
        this.activeAction = {
          kind: 'reward-retry',
          title: 'Mark reward retryable',
          heading: `${row.name}: ${reward.description || ('reward #' + reward.reward_id)}`,
          message: 'Changes this durable ledger to retryable status. The next game-server reconciliation performs the actual grant.',
          icon: 'fa fa-repeat',
          danger: true,
          submitLabel: 'Accept risk and retry',
          confirmationPhrase: `RETRY REWARD ${reward.reward_id}`,
          before: `${this.enumLabel('reward_statuses', reward.ledger.status)}; ${reward.ledger.attempt_count} attempts`,
          after: 'Ledger status becomes retryable failure (2)',
          requiresRisk: true,
          riskMessage: 'Status 0 may mean the grant reached inventory, currency, title, experience, or AA persistence before final ledger persistence failed. A retry can duplicate that delivery.',
          expectedRows: [
            { label: 'Definition version', value: row.definitionVersion },
            { label: 'Reward ledger status', value: reward.ledger.status }
          ],
          endpoint: 'reward/retry',
          payload: {
            achievement_id: row.id,
            reward_id: String(reward.reward_id),
            expected_status: numeric(reward.ledger.status),
            expected_version: row.definitionVersion
          }
        }
        this.actionOpen = true
      },
      openSelectionRetryAction (row, selection) {
        const blockedReason = this.selectionRetryDisabledReason(row, selection)
        if (blockedReason) return this.showNotification(blockedReason, 'error')
        this.activeAction = {
          kind: 'selection-retry',
          title: 'Mark reward selection retryable',
          heading: `${row.name}: ${selection.title || ('set #' + selection.reward_set_id)}`,
          message: 'Reopens an interrupted, failed, or ambiguous selected bundle. Status-0 ledgers mapped to the selected option and enabled common options become retryable together; delivered rows remain durable.',
          icon: 'fa fa-repeat',
          danger: true,
          submitLabel: 'Accept risk and retry',
          confirmationPhrase: `RETRY SELECTION ${selection.reward_set_id}`,
          before: `${this.enumLabel('selection_statuses', selection.status)}; option #${selection.selected_option_id}`,
          after: 'Whole-selection status becomes retryable failure (2)',
          requiresRisk: true,
          expectedRows: [
            { label: 'Definition version', value: row.definitionVersion },
            { label: 'Selection status', value: selection.status }
          ],
          endpoint: 'selection/retry',
          payload: {
            achievement_id: row.id,
            reward_set_id: numeric(selection.reward_set_id),
            expected_status: numeric(selection.status),
            expected_version: row.definitionVersion
          }
        }
        this.actionOpen = true
      },
      openUpdateAction (row, update, action) {
        const blockedReason = action === 'retry' ? this.updateRetryDisabledReason(row, update) : this.updateDiscardDisabledReason(row, update)
        if (blockedReason) return this.showNotification(blockedReason, 'error')
        const discard = action === 'discard'
        const staleProcessingLease = discard && this.isStaleProcessingLease(update)
        this.activeAction = {
          kind: discard ? 'update-discard' : 'update-retry',
          title: discard ? 'Discard queued update' : 'Retry blocked update',
          heading: `${discard ? 'Discard' : 'Retry'} update #${update.update_id}?`,
          message: discard
            ? (staleProcessingLease
              ? 'Permanently removes a status-2 world-handoff row whose 60-second processing lease has expired. Confirm that no zone consumer still owns this abandoned work.'
              : 'Permanently removes this stable pending or blocked world-handoff row. The originating group, raid, dynamic zone, or shared task will not recreate a one-time event automatically.')
            : 'Returns this blocked row to pending only when its stored definition version is still compatible. The zone process performs the actual progress/completion work.',
          icon: discard ? 'fa fa-trash' : 'fa fa-repeat',
          danger: discard,
          submitLabel: discard ? 'Discard permanently' : 'Return to pending',
          confirmationPhrase: `${discard ? 'DISCARD' : 'RETRY'} UPDATE ${update.update_id}`,
          before: `${this.enumLabel('update_statuses', update.status)}; ${update.attempt_count} attempts`,
          after: discard ? 'Queued row permanently removed' : 'Queued row returns to pending status (0)',
          showStaleLeaseAcknowledgement: staleProcessingLease,
          staleLeaseMessage: staleProcessingLease
            ? `Update #${update.update_id} last attempted processing at ${this.formatTime(update.last_attempt_at)}. Its 60-second lease is expired, but removal can discard work that completed outside the ledger.`
            : '',
          expectedRows: [
            { label: 'Update status', value: update.status },
            { label: 'Attempt count', value: update.attempt_count },
            { label: 'Stored definition version', value: update.version }
          ],
          endpoint: discard ? 'update' : 'update/retry',
          delete: discard,
          payload: {
            update_id: String(update.update_id),
            action,
            expected_status: numeric(update.status),
            expected_attempt_count: numeric(update.attempt_count)
          }
        }
        this.actionOpen = true
      },
      async submitAction (form) {
        if (!this.activeAction.endpoint || !this.selectedCharacterID || this.operationBusy) return
        if (this.updateGuardReason()) {
          this.actionOpen = false
          return this.showNotification(this.updateGuardReason(), 'error')
        }
        this.operationBusy = true
        const payload = Object.assign({}, this.activeAction.payload || {}, {
          reason: form.reason,
          character_confirmation: form.character_confirmation,
          confirmation: form.confirmation
        })
        if (this.activeAction.kind === 'progress') payload.current_count = numeric(form.current_count)
        if (this.activeAction.kind === 'reset') {
          payload.clear_reward_history = Boolean(form.clear_reward_history)
          payload.acknowledge_regrant_risk = Boolean(form.clear_reward_history && form.acknowledge_regrant_risk)
        }
        if (this.activeAction.kind === 'reward-retry' || this.activeAction.kind === 'selection-retry') {
          payload.acknowledge_duplicate_risk = Boolean(form.acknowledge_duplicate_risk)
        }
        if (this.activeAction.showStaleLeaseAcknowledgement) {
          payload.acknowledge_stale_processing_lease = Boolean(form.acknowledge_stale_processing_lease)
        }
        const path = `/character-achievement-editor/character/${this.selectedCharacterID}/${this.activeAction.endpoint}`
        try {
          const response = this.activeAction.delete
            ? await SpireApi.v1().delete(path, { data: payload })
            : await SpireApi.v1().patch(path, payload)
          const envelope = response.data || {}
          if (envelope.detail) this.applyDetail(envelope.detail, envelope)
          this.actionOpen = false
          await Promise.all([this.loadDetail(false), this.loadCharacters(), this.loadAudit()])
          this.showNotification(`${this.activeAction.title} completed${envelope.audit_id ? ' · audit #' + envelope.audit_id : ''}`)
        } catch (error) {
          const status = error && error.response ? numeric(error.response.status) : 0
          if (status === 409) {
            this.actionOpen = false
            await this.loadDetail(false)
            this.showNotification(`Conflict: ${this.errorMessage(error, 'Durable state changed after this page loaded. The latest state has been reloaded.')}`, 'error')
          } else {
            this.showNotification(this.errorMessage(error, 'The achievement operation failed. No partial change was kept.'), 'error')
          }
        } finally {
          this.operationBusy = false
        }
      },
      enumOptions (key) {
        const metadataKey = METADATA_ENUM_KEYS[key] || key
        const source = (this.metadata && (this.metadata[metadataKey] || (this.metadata.enums && this.metadata.enums[metadataKey]))) || FALLBACK_ENUMS[key] || []
        if (Array.isArray(source)) {
          return source.map((option, index) => typeof option === 'object'
            ? { value: typeof option.value !== 'undefined' ? option.value : (typeof option.id !== 'undefined' ? option.id : index), label: option.label || option.name || String(option.value), description: option.description || option.help || '' }
            : { value: index, label: String(option), description: '' })
        }
        return Object.keys(source).map(value => {
          const option = source[value]
          return typeof option === 'object'
            ? { value: numeric(value, value), label: option.label || option.name || String(value), description: option.description || option.help || '' }
            : { value: numeric(value, value), label: String(option), description: '' }
        })
      },
      enumLabel (key, value) {
        const option = this.enumOptions(key).find(row => String(row.value) === String(value))
        return option ? option.label : (numeric(value, NaN) === -1 ? 'Missing canonical definition' : `Unknown ${value}`)
      },
      criterionSummary (criterion) {
        const pieces = [
          this.enumLabel('progress_modes', criterion.progress_mode),
          this.enumLabel('behaviors', criterion.behavior),
          `target ${criterion.target_id || 0}/${criterion.target_id2 || 0}`,
          `value ${criterion.target_value || 0}`,
          `requires ${criterion.required_count || 0}`
        ]
        if (!criterion.enabled) pieces.push('disabled')
        return pieces.join(' · ')
      },
      progressPercent (component) {
        const required = Math.max(1, numeric(component.requiredCount, 1))
        return Math.max(0, Math.min(100, Math.round((numeric(component.currentCount) / required) * 100)))
      },
      rewardStatusTone (status) {
        if (status === null || typeof status === 'undefined') return 'neutral'
        if (numeric(status) === 1) return 'success'
        if (numeric(status) === 2) return 'warning'
        return 'danger'
      },
      selectionStatusTone (status) {
        if (numeric(status) === 1) return 'success'
        if (numeric(status) === 2) return 'warning'
        if (numeric(status) === 3) return 'danger'
        return 'neutral'
      },
      updateStatusTone (status) {
        if (numeric(status) === 0) return 'warning'
        if (numeric(status) === 1) return 'danger'
        return 'neutral'
      },
      updateCount (status) {
        return this.flatUpdates.filter(entry => numeric(entry.update.status) === numeric(status)).length
      },
      isOnline (character) {
        if (!character) return false
        return character.ingame === true || numeric(character.ingame) > 0 || character.online === true
      },
      className (value) {
        return DB_PLAYER_CLASSES[numeric(value)] || `Class ${value}`
      },
      number (value) {
        if (value === null || typeof value === 'undefined' || value === '') return '0'
        const parsed = Number(value)
        return Number.isFinite(parsed) ? new Intl.NumberFormat().format(parsed) : String(value)
      },
      exactUnsignedCount (value) {
        const decimal = String(value === null || typeof value === 'undefined' || value === '' ? '0' : value).trim()
        return /^\d+$/.test(decimal) ? decimal.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : decimal
      },
      formatTime (value) {
        if (!value) return 'Never'
        let date
        if (typeof value === 'number' || /^\d+$/.test(String(value))) date = new Date(numeric(value) * 1000)
        else date = new Date(value)
        return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
      },
      humanize (value) {
        return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
      },
      auditEventLabel (event) {
        return this.humanize(String(event || 'Achievement operation').replace(/^CHARACTER_ACHIEVEMENT_/, ''))
      },
      auditDataRows (value) {
        let data = value
        if (typeof data === 'string') {
          try { data = JSON.parse(data) } catch (error) { return [{ key: 'details', value: data }] }
        }
        if (!data || typeof data !== 'object') return []
        return Object.keys(data).map(key => ({
          key,
          value: typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key])
        }))
      },
      errorMessage (error, fallback) {
        const data = error && error.response && error.response.data
        if (data && typeof data === 'object') return data.error || data.message || fallback
        if (typeof data === 'string' && data.trim()) return data
        return fallback
      },
      showNotification (message, type = 'success') {
        window.clearTimeout(this.notification.timer)
        this.notification = { message, type, timer: null }
        this.notification.timer = window.setTimeout(() => { this.notification.message = '' }, 6500)
      },
      async syncRoute (expandedID) {
        if (!this.$router || !this.$route) return
        const query = {}
        if (this.selectedCharacterID) query.character = String(this.selectedCharacterID)
        if (this.selectedTab !== 'Achievements') query.tab = this.selectedTab
        if (this.stateFilter !== 'all') query.state = this.stateFilter
        if (this.characterSearch) query.character_q = this.characterSearch
        if (this.characterPage > 1) query.character_page = String(this.characterPage)
        if (this.presenceFilter !== 'all') query.presence = this.presenceFilter
        if (this.achievementSearch) query.achievement_q = this.achievementSearch
        if (this.achievementPage > 1) query.achievement_page = String(this.achievementPage)
        if (this.selectedTab === 'Audit & Safety' && this.auditPage > 1) query.audit_page = String(this.auditPage)
        const routeExpandedID = arguments.length
          ? expandedID
          : Object.keys(this.expandedAchievements).find(id => this.expandedAchievements[id] && this.detailRows.some(row => String(row.id) === id))
        if (routeExpandedID) query.achievement = String(routeExpandedID)
        this.syncingRoute = true
        await this.$router.replace({ path: this.$route.path, query }).catch(() => {})
        this.$nextTick(() => { this.syncingRoute = false })
      }
    }
  }
</script>

<style src="../../../assets/css/content-editor-workspace.css"></style>
<style src="../../../assets/css/achievement-editor.css"></style>

<style scoped>
.character-achievement-workspace {
  grid-template-columns: minmax(300px, 0.72fr) minmax(0, 2.28fr);
}

.character-achievement-directory,
.character-achievement-inspector {
  min-width: 0;
}

.ca-ready-text { color: #6fcda8; }
.ca-danger-text { color: #e58b8b; }

.ca-schema-failure { padding: 4px; }
.ca-schema-failure__heading { align-items: flex-start; display: grid; gap: 12px; grid-template-columns: 42px minmax(0, 1fr) auto; }
.ca-schema-failure__heading > span { align-items: center; border: 1px solid rgba(220, 91, 91, .42); color: #e58b8b; display: flex; height: 42px; justify-content: center; }
.ca-schema-failure h2 { color: #e8edf1; font-family: Georgia, "Times New Roman", serif; font-size: 19px; margin: 0; }
.ca-schema-failure p { color: #9ba7af; font-size: 10px; line-height: 1.55; margin: 4px 0 0; }
.ca-schema-area-grid { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 16px; }
.ca-schema-area { background: rgba(0, 0, 0, .22); border: 1px solid rgba(178, 191, 204, .16); padding: 11px; }
.ca-schema-area__title { align-items: flex-start; display: flex; gap: 10px; justify-content: space-between; }
.ca-schema-area__title span, .ca-schema-area__title strong { display: block; }
.ca-schema-area__title div > span { color: #7e8992; font-size: 8px; letter-spacing: .07em; text-transform: uppercase; }
.ca-schema-area__title div > strong { color: #dce3e8; font-size: 11px; margin-top: 2px; }
.ca-schema-issues { list-style: none; margin: 10px 0 0; padding: 0; }
.ca-schema-issues li { border-top: 1px solid rgba(178, 191, 204, .12); padding: 7px 0; }
.ca-schema-issues strong, .ca-schema-issues span { display: block; }
.ca-schema-issues strong { color: #e0c566; font-family: Consolas, monospace; font-size: 9px; }
.ca-schema-issues span, .ca-schema-empty { color: #a99a9a; font-size: 9px; margin: 2px 0 0; }

.ca-control-help { color: #74818a; font-size: 8px; line-height: 1.45; margin: -3px 2px 8px; }
.ca-presence-filter { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.ca-character-row { min-height: 74px; }
.ca-character-row .spire-editor-directory-body { min-width: 0; }
.ca-presence-dot { border-radius: 50%; display: inline-block; height: 6px; margin-left: 4px; width: 6px; }
.ca-presence-dot.online { background: #53d5a0; box-shadow: 0 0 7px rgba(83, 213, 160, .62); }
.ca-presence-dot.offline { background: #64717a; }
.ca-directory-counts { color: #6f7c85; display: block; font-size: 8px; margin-top: 2px; }
.ca-online-label, .ca-offline-label { display: block; font-size: 8px; margin-bottom: 3px; text-transform: uppercase; }
.ca-online-label { color: #53d5a0; }
.ca-offline-label { color: #7d8992; }

.ca-character-header__actions { align-items: flex-end; display: flex; flex-direction: column; gap: 8px; }
.ca-presence-badge { align-items: center; border: 1px solid; display: inline-flex; font-size: 9px; gap: 6px; padding: 5px 8px; text-transform: uppercase; }
.ca-presence-badge--online { background: rgba(180, 66, 66, .14); border-color: rgba(220, 91, 91, .34); color: #e79595; }
.ca-presence-badge--offline { background: rgba(50, 139, 104, .14); border-color: rgba(83, 213, 160, .3); color: #72d6ad; }
.ca-presence-badge i { font-size: 7px; }
.ca-online-warning, .ca-guide-callout { align-items: flex-start; background: rgba(142, 64, 50, .14); border: 1px solid rgba(225, 125, 88, .3); color: #df9f83; display: flex; font-size: 10px; gap: 9px; line-height: 1.5; margin-top: 12px; padding: 9px 11px; }
.ca-online-warning strong, .ca-online-warning span, .ca-guide-callout strong, .ca-guide-callout span { display: block; }
.ca-online-warning span, .ca-guide-callout span { color: #a9968e; font-size: 9px; }
.ca-guide-callout--info { background: rgba(49, 111, 139, .14); border-color: rgba(86, 164, 196, .35); color: #8fc6dd; }
.ca-guide-callout--info > div { flex: 1 1 auto; }
.ca-guide-callout--info .btn { flex: 0 0 auto; margin-left: auto; }

.ca-section-heading { margin-bottom: 13px; }
.ca-definition-controls { align-items: end; display: grid; gap: 10px; grid-template-columns: minmax(260px, 1.3fr) minmax(220px, .85fr) minmax(160px, .55fr); margin-bottom: 12px; }
.ca-filter-field label { color: #c9d0d6; display: block; font-size: 9px; font-weight: 600; margin-bottom: 4px; }
.ca-filter-field small { color: #718089; display: block; font-size: 8px; line-height: 1.4; margin-top: 3px; }
.ca-filter-summary { background: rgba(0, 0, 0, .21); border: 1px solid rgba(178, 191, 204, .14); padding: 8px 10px; }
.ca-filter-summary span, .ca-filter-summary strong { display: block; }
.ca-filter-summary span { color: #75818a; font-size: 8px; text-transform: uppercase; }
.ca-filter-summary strong { color: #e0c566; font-family: Georgia, "Times New Roman", serif; font-size: 15px; }
.ca-help-mark { border: 1px solid rgba(123, 180, 194, .45); border-radius: 50%; color: #7bb4c2; cursor: help; display: inline-flex; font-size: 8px; height: 13px; justify-content: center; line-height: 11px; margin-left: 3px; width: 13px; }
.ca-inline-error, .ca-inline-loading { border: 1px solid rgba(178, 191, 204, .17); font-size: 9px; margin-bottom: 9px; padding: 8px 10px; }
.ca-inline-error { background: rgba(139, 53, 53, .15); border-color: rgba(217, 98, 98, .3); color: #dda0a0; }
.ca-inline-loading { color: #8fa0aa; }
.ca-inline-error i, .ca-inline-loading i { margin-right: 6px; }
.ca-empty-results { min-height: 90px; }

.ca-achievement-list { display: grid; gap: 8px; }
.ca-achievement-card { background: rgba(7, 11, 14, .38); border: 1px solid rgba(178, 191, 204, .16); min-width: 0; }
.ca-achievement-card--expanded { border-color: rgba(224, 197, 102, .34); }
.ca-achievement-card--orphan { border-color: rgba(220, 91, 91, .33); }
.ca-achievement-card__header { display: grid; gap: 7px; grid-template-columns: minmax(0, 1fr) auto; padding: 8px 10px; }
.ca-achievement-card__toggle { align-items: center; background: transparent; border: 0; color: inherit; display: grid; gap: 9px; grid-column: 1 / -1; grid-template-columns: 34px minmax(220px, 1fr) minmax(180px, auto) 15px; padding: 0; text-align: left; width: 100%; }
.ca-achievement-card__toggle:focus { outline: 1px solid rgba(224, 197, 102, .62); outline-offset: 3px; }
.ca-achievement-card__icon { align-items: center; border: 1px solid rgba(224, 197, 102, .28); color: #e0c566; display: flex; height: 34px; justify-content: center; }
.ca-achievement-card--orphan .ca-achievement-card__icon { border-color: rgba(220, 91, 91, .34); color: #dc7f7f; }
.ca-achievement-card__identity { min-width: 0; }
.ca-achievement-card__identity > * { display: block; }
.ca-achievement-card__eyebrow { color: #75818a; font-size: 8px; letter-spacing: .04em; text-transform: uppercase; }
.ca-achievement-card__identity > strong { color: #dfe6eb; font-family: Georgia, "Times New Roman", serif; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ca-achievement-card__identity > small { color: #7f8c95; font-size: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ca-achievement-card__summary { display: grid; gap: 5px; grid-template-columns: repeat(3, minmax(58px, auto)); }
.ca-achievement-card__summary span { background: rgba(0, 0, 0, .22); border: 1px solid rgba(178, 191, 204, .12); color: #9ba7af; font-size: 8px; padding: 5px 7px; text-align: center; }
.ca-achievement-card__badges { align-items: center; display: flex; flex-wrap: wrap; gap: 4px; }
.ca-achievement-card__actions { display: flex; gap: 5px; justify-content: flex-end; }
.ca-state-badge { border: 1px solid; display: inline-block; font-size: 8px; padding: 3px 6px; text-transform: uppercase; white-space: nowrap; }
.ca-state-badge--success { background: rgba(50, 139, 104, .13); border-color: rgba(83, 213, 160, .28); color: #72d6ad; }
.ca-state-badge--warning { background: rgba(153, 120, 45, .14); border-color: rgba(224, 197, 102, .28); color: #dfc570; }
.ca-state-badge--danger { background: rgba(139, 53, 53, .14); border-color: rgba(217, 98, 98, .3); color: #e38f8f; }
.ca-state-badge--neutral { background: rgba(91, 104, 113, .13); border-color: rgba(151, 165, 175, .22); color: #95a1aa; }
.ca-achievement-card__detail { border-top: 1px solid rgba(224, 197, 102, .2); padding: 10px; }
.ca-definition-facts, .ca-update-summary-grid, .ca-schema-ready-grid { display: grid; gap: 7px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.ca-definition-facts section, .ca-update-summary-grid section, .ca-schema-ready-grid section { background: rgba(0, 0, 0, .2); border: 1px solid rgba(178, 191, 204, .13); min-width: 0; padding: 8px; }
.ca-definition-facts span, .ca-definition-facts strong, .ca-definition-facts small, .ca-update-summary-grid span, .ca-update-summary-grid strong, .ca-update-summary-grid small, .ca-schema-ready-grid span, .ca-schema-ready-grid strong, .ca-schema-ready-grid small { display: block; }
.ca-definition-facts span, .ca-update-summary-grid span, .ca-schema-ready-grid span { color: #74818a; font-size: 8px; text-transform: uppercase; }
.ca-definition-facts strong, .ca-update-summary-grid strong, .ca-schema-ready-grid strong { color: #d8c578; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ca-definition-facts small, .ca-update-summary-grid small, .ca-schema-ready-grid small { color: #6f7c85; font-size: 8px; margin-top: 2px; }

.ca-detail-section { border-top: 1px solid rgba(178, 191, 204, .14); margin-top: 13px; padding-top: 11px; }
.ca-detail-section__heading { align-items: flex-start; display: flex; gap: 10px; justify-content: space-between; margin-bottom: 7px; }
.ca-detail-section__heading span, .ca-detail-section__heading h4 { display: block; margin: 0; }
.ca-detail-section__heading span { color: #75818a; font-size: 8px; letter-spacing: .05em; text-transform: uppercase; }
.ca-detail-section__heading h4 { color: #dce3e8; font-family: Georgia, "Times New Roman", serif; font-size: 14px; }
.ca-detail-section__heading > small { color: #74818a; font-size: 8px; line-height: 1.45; max-width: 360px; text-align: right; }
.ca-table-wrap { max-width: 100%; overflow-x: auto; }
.ca-state-table { border-collapse: collapse; color: #9aa6ae; font-size: 9px; min-width: 760px; width: 100%; }
.ca-state-table th { background: rgba(0, 0, 0, .3); border: 1px solid rgba(178, 191, 204, .14); color: #8d9aa3; font-size: 8px; font-weight: 600; letter-spacing: .04em; padding: 6px 7px; text-transform: uppercase; }
.ca-state-table td { border: 1px solid rgba(178, 191, 204, .12); padding: 7px; vertical-align: top; }
.ca-state-table tbody tr:nth-child(even) { background: rgba(255, 255, 255, .012); }
.ca-state-table td > strong, .ca-state-table td > small { display: block; }
.ca-state-table td > strong { color: #d7dee3; font-size: 9px; }
.ca-state-table td > small { color: #74818a; font-size: 8px; line-height: 1.4; margin-top: 2px; }
.ca-row-error { color: #df9292 !important; line-height: 1.45; }
.ca-empty-cell { color: #74818a !important; padding: 16px !important; text-align: center; }
.ca-progress-track { background: rgba(0, 0, 0, .35); border: 1px solid rgba(178, 191, 204, .15); height: 5px; margin: 4px 0; min-width: 90px; }
.ca-progress-track span { background: linear-gradient(90deg, #376f7d, #d1b85f); display: block; height: 100%; max-width: 100%; }
.ca-criteria-list { display: grid; gap: 4px; }
.ca-criteria-list > span { border-left: 2px solid rgba(90, 157, 173, .38); padding-left: 5px; }
.ca-criteria-list strong, .ca-criteria-list small { display: block; }
.ca-criteria-list strong { color: #a9c6ce; font-size: 8px; }
.ca-criteria-list small { color: #6f7c85; font-size: 7px; }
.ca-inline-actions { white-space: nowrap; }
.ca-inline-actions .btn + .btn { margin-left: 4px; }
.ca-definition-pagination { margin-top: 12px; }

.ca-guide-callout { margin: 0 0 13px; }
.ca-update-summary-grid section strong { font-family: Georgia, "Times New Roman", serif; font-size: 18px; }
.ca-safety-grid { display: grid; gap: 8px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.ca-safety-grid section { align-items: flex-start; background: rgba(0, 0, 0, .2); border: 1px solid rgba(178, 191, 204, .14); display: flex; gap: 8px; padding: 10px; }
.ca-safety-grid i { color: #d7bf66; flex: 0 0 18px; margin-top: 2px; text-align: center; }
.ca-safety-grid strong, .ca-safety-grid span { display: block; }
.ca-safety-grid strong { color: #dce3e8; font-size: 10px; }
.ca-safety-grid span { color: #78858e; font-size: 8px; line-height: 1.5; margin-top: 2px; }
.ca-glossary-grid { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ca-glossary-grid section { background: rgba(0, 0, 0, .2); border: 1px solid rgba(178, 191, 204, .14); padding: 9px; }
.ca-glossary-grid h5 { color: #d8c578; font-family: Georgia, "Times New Roman", serif; font-size: 12px; margin: 0 0 6px; }
.ca-glossary-grid dl { display: grid; gap: 3px 8px; grid-template-columns: minmax(110px, .55fr) minmax(0, 1fr); margin: 0; }
.ca-glossary-grid dt { color: #a8b3bb; font-size: 8px; }
.ca-glossary-grid dd { color: #717f88; font-size: 8px; margin: 0; }
.ca-audit-list { display: grid; gap: 6px; }
.ca-audit-list article { align-items: flex-start; background: rgba(0, 0, 0, .2); border: 1px solid rgba(178, 191, 204, .13); display: grid; gap: 9px; grid-template-columns: 28px minmax(0, 1fr); padding: 8px; }
.ca-audit-icon { align-items: center; border: 1px solid rgba(224, 197, 102, .25); color: #d8c578; display: flex; height: 28px; justify-content: center; }
.ca-audit-title { align-items: center; display: flex; gap: 8px; justify-content: space-between; }
.ca-audit-title strong { color: #dce3e8; font-size: 9px; }
.ca-audit-title span, .ca-audit-list p { color: #74818a; font-size: 8px; }
.ca-audit-list p { margin: 1px 0 5px; }
.ca-audit-list dl { display: grid; gap: 2px 7px; grid-template-columns: minmax(100px, auto) minmax(0, 1fr); margin: 0; }
.ca-audit-list dt { color: #77858e; font-size: 7px; font-weight: normal; }
.ca-audit-list dd { color: #aab5bc; font-family: Consolas, monospace; font-size: 7px; margin: 0; overflow-wrap: anywhere; }

@media (max-width: 1180px) {
  .character-achievement-workspace { grid-template-columns: minmax(260px, .8fr) minmax(0, 1.7fr); }
  .ca-definition-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ca-filter-summary { grid-column: 1 / -1; }
  .ca-definition-facts, .ca-update-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ca-safety-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 860px) {
  .character-achievement-workspace { grid-template-columns: minmax(0, 1fr); }
  .character-achievement-workspace .eq-window-simple { box-shadow: none; }
  .character-achievement-workspace .eq-window-simple::before { left: 0; right: 0; }
  .ca-character-header { align-items: flex-start; }
  .ca-achievement-card__toggle { grid-template-columns: 34px minmax(0, 1fr) 15px; }
  .ca-achievement-card__summary { grid-column: 2 / 3; }
  .ca-achievement-card__header { grid-template-columns: minmax(0, 1fr); }
  .ca-achievement-card__actions { justify-content: flex-start; }
  .ca-schema-area-grid, .ca-glossary-grid { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 560px) {
  .ca-schema-failure__heading { grid-template-columns: 36px minmax(0, 1fr); }
  .ca-schema-failure__heading .btn { grid-column: 1 / -1; }
  .ca-definition-controls, .ca-definition-facts, .ca-update-summary-grid, .ca-schema-ready-grid, .ca-safety-grid { grid-template-columns: minmax(0, 1fr); }
  .ca-achievement-card__summary { grid-template-columns: minmax(0, 1fr); }
  .ca-character-header__actions { align-items: stretch; width: 100%; }
}
</style>
