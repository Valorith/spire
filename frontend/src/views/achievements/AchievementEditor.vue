<template>
  <content-area class="spire-editor-page achievement-editor" data-testid="achievement-editor">
    <div class="spire-editor-toolbar achievement-editor__toolbar">
      <div>
        <div class="spire-editor-kicker">World data · durable progression</div>
        <h1 class="spire-editor-title"><i class="fa fa-trophy mr-1"></i> Achievement Editor</h1>
        <p class="spire-editor-subtitle">Author complete, validated definition graphs without manipulating dependent SQL rows by hand.</p>
      </div>
      <div class="achievement-editor__mode" role="navigation" aria-label="Achievement workspaces">
        <button type="button" :class="{ active: workspaceMode === 'definitions' }" data-testid="achievement-mode-definitions" @click="switchWorkspace('definitions')">Definitions</button>
        <button type="button" :class="{ active: workspaceMode === 'categories' }" data-testid="achievement-mode-categories" @click="switchWorkspace('categories')">Categories</button>
        <button type="button" :class="{ active: workspaceMode === 'guide' }" data-testid="achievement-mode-guide" @click="switchWorkspace('guide')">Authoring guide</button>
      </div>
    </div>

    <div v-if="schemaLoading" class="achievement-schema-banner" role="status">
      <i class="fa fa-spinner fa-spin"></i><span>Checking achievement schema capabilities…</span>
    </div>
    <div v-else-if="!contentReady" class="achievement-schema-banner achievement-schema-banner--danger" role="alert" data-testid="achievement-schema-blocked">
      <i class="fa fa-lock"></i>
      <div>
        <strong>Content writes are disabled because the achievement schema is incomplete.</strong>
        <p>{{ schemaGuidance }}</p>
        <ul v-if="schemaIssues.length">
          <li v-for="(issue, index) in schemaIssues" :key="index">{{ issue.message || issue.code || issue }}</li>
        </ul>
      </div>
      <b-button size="sm" variant="outline-light" @click="bootstrap(true)">Recheck</b-button>
    </div>

    <div v-if="workspaceMode === 'definitions'" class="spire-editor-workspace achievement-editor__workspace">
      <aside class="spire-editor-directory">
        <eq-window title="Definition Directory">
          <div class="spire-editor-directory-controls">
            <div class="spire-editor-search">
              <i class="fa fa-search"></i>
              <input
                id="achievement-directory-search"
                v-model.trim="filters.q"
                class="form-control form-control-sm"
                placeholder="Search ID, name, or description…"
                aria-describedby="achievement-directory-search-help"
                @input="queueDirectory"
              >
            </div>
            <b-button size="sm" variant="outline-warning" :disabled="!contentReady" data-testid="achievement-new-definition" @click="createDefinition">
              <i class="fa fa-plus mr-1"></i>New
            </b-button>
          </div>
          <small id="achievement-directory-search-help" class="achievement-field-help">Server-side search is bounded and paginated.</small>
          <div class="achievement-directory-filters">
            <label for="achievement-enabled-filter">Published state</label>
            <select id="achievement-enabled-filter" v-model="filters.enabled" class="form-control form-control-sm" aria-describedby="achievement-enabled-filter-help" @change="applyFilters">
              <option value="">All states</option>
              <option value="1">Enabled</option>
              <option value="0">Disabled</option>
            </select>
            <small id="achievement-enabled-filter-help">Filter definitions by active snapshot eligibility.</small>
            <label for="achievement-category-filter">Category</label>
            <select id="achievement-category-filter" v-model="filters.category_id" class="form-control form-control-sm" aria-describedby="achievement-category-filter-help" @change="applyFilters">
              <option value="">All categories</option>
              <option v-for="category in categories" :key="category.id" :value="String(category.id)">#{{ category.id }} {{ category.name }}</option>
            </select>
            <small id="achievement-category-filter-help">Show definitions associated with one category.</small>
            <label for="achievement-event-filter">Criterion event</label>
            <select id="achievement-event-filter" v-model="filters.event_type" class="form-control form-control-sm" aria-describedby="achievement-event-filter-help" @change="applyFilters">
              <option value="">All events</option>
              <option v-for="option in enumList('events')" :key="option.value" :value="String(option.value)">{{ option.value }} — {{ option.label }}</option>
            </select>
            <small id="achievement-event-filter-help">Require at least one criterion using this event.</small>
            <label for="achievement-reward-filter">Reward type</label>
            <select id="achievement-reward-filter" v-model="filters.reward_type" class="form-control form-control-sm" aria-describedby="achievement-reward-filter-help" @change="applyFilters">
              <option value="">All rewards</option>
              <option v-for="option in enumList('reward_types')" :key="option.value" :value="String(option.value)">{{ option.value }} — {{ option.label }}</option>
            </select>
            <small id="achievement-reward-filter-help">Require at least one canonical reward of this type.</small>
            <label for="achievement-reward-content-filter">Reward content</label>
            <select id="achievement-reward-content-filter" v-model="filters.reward" class="form-control form-control-sm" aria-describedby="achievement-reward-content-filter-help" @change="applyFilters">
              <option value="">All reward states</option>
              <option value="any">Any authored reward</option>
              <option value="automatic">Automatic grants</option>
              <option value="selectable">Selectable reward set</option>
              <option value="none">No authored rewards</option>
            </select>
            <small id="achievement-reward-content-filter-help">Distinguish automatic completion grants, selectable sets, and definitions with no authored rewards.</small>
            <label for="achievement-sort-filter">Sort</label>
            <div class="achievement-filter-pair">
              <select id="achievement-sort-filter" v-model="filters.sort" class="form-control form-control-sm" aria-describedby="achievement-sort-filter-help" @change="applyFilters">
                <option value="name">Name</option><option value="id">ID</option><option value="points">Points</option><option value="version">Version</option>
              </select>
              <select v-model="filters.direction" class="form-control form-control-sm" aria-label="Sort direction" aria-describedby="achievement-sort-filter-help" @change="applyFilters"><option value="asc">Ascending</option><option value="desc">Descending</option></select>
            </div>
            <small id="achievement-sort-filter-help">Server sort keeps pagination stable.</small>
          </div>
          <div class="spire-editor-directory-meta"><span>{{ number(totalDefinitions) }} definitions</span><button class="btn btn-link btn-sm p-0" type="button" :disabled="directoryLoading" @click="loadDirectory"><i class="fa mr-1" :class="directoryLoading ? 'fa-spinner fa-spin' : 'fa-refresh'"></i>Refresh</button></div>
          <div class="spire-editor-directory-list" data-testid="achievement-directory">
            <button
              v-for="row in definitions"
              :key="row.id"
              type="button"
              class="spire-editor-directory-row"
              :class="{ active: !creating && Number(selectedID) === Number(row.id) }"
              @click="selectDefinition(row.id)"
            >
              <span class="spire-editor-directory-icon"><i class="fa fa-trophy"></i></span>
              <span class="spire-editor-directory-body">
                <span class="spire-editor-directory-name">{{ row.name || '(unnamed definition)' }}</span>
                <span class="spire-editor-directory-detail">#{{ row.id }} · {{ row.points || 0 }} points · v{{ Number(row.version || 0) }}</span>
                <span class="operational-row-badges">
                  <span class="operational-badge" :class="row.enabled ? 'operational-badge--gold' : 'operational-badge--muted'">{{ row.enabled ? 'enabled' : 'disabled' }}</span>
                  <span class="operational-badge">{{ row.component_count || 0 }} components</span>
                  <span class="operational-badge">{{ row.reward_count || 0 }} rewards</span>
                </span>
              </span>
            </button>
            <div v-if="directoryError" class="spire-editor-directory-state spire-editor-directory-state--error" role="alert"><i class="fa fa-exclamation-triangle"></i><span>{{ directoryError }}</span><button class="btn btn-sm btn-outline-warning" @click="loadDirectory">Retry</button></div>
            <div v-else-if="directoryLoading && !definitions.length" class="spire-editor-directory-state"><i class="fa fa-spinner fa-spin"></i><span>Loading definitions…</span></div>
            <div v-else-if="!definitions.length" class="spire-editor-directory-state"><i class="fa fa-trophy"></i><span>No definitions match this view.</span></div>
          </div>
          <nav v-if="totalPages > 1" class="spire-editor-pagination" aria-label="Definition pages">
            <button type="button" aria-label="Previous page" :disabled="filters.page <= 1" @click="changePage(filters.page - 1)"><i class="fa fa-angle-left"></i></button>
            <span><strong>{{ filters.page }}</strong> / {{ totalPages }}</span>
            <button type="button" aria-label="Next page" :disabled="filters.page >= totalPages" @click="changePage(filters.page + 1)"><i class="fa fa-angle-right"></i></button>
          </nav>
        </eq-window>
      </aside>

      <main class="spire-editor-inspector achievement-editor__inspector">
        <eq-window v-if="detailLoading && !draft" title="Achievement Definition"><div class="spire-editor-empty"><div class="spire-editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div><h3>Loading definition graph</h3></div></eq-window>
        <eq-window v-else-if="!draft" title="Achievement Definition">
          <div class="spire-editor-empty"><div class="spire-editor-empty__sigil"><i class="fa fa-trophy"></i></div><h3>Select an achievement</h3><p>Open a definition to edit its complete graph, or start a safely disabled draft.</p></div>
        </eq-window>
        <eq-window v-else :title="creating ? 'New Achievement Definition' : draft.name + ' · #' + draft.id">
          <div class="achievement-editor__statusbar">
            <div>
              <span class="achievement-status-pill" :class="draft.enabled ? 'achievement-status-pill--enabled' : 'achievement-status-pill--disabled'">{{ draft.enabled ? 'Enabled' : 'Disabled' }}</span>
              <span class="achievement-status-pill">Version {{ draft.version }}</span>
              <span v-if="dirty" class="achievement-status-pill achievement-status-pill--dirty"><i class="fa fa-circle"></i> Unsaved</span>
              <span v-else class="achievement-status-pill"><i class="fa fa-check"></i> Saved</span>
            </div>
            <div class="achievement-editor__actions">
              <b-button size="sm" variant="outline-secondary" :disabled="saving" @click="reloadDefinition"><i class="fa fa-undo mr-1"></i>Reset</b-button>
              <b-button v-if="!creating" size="sm" variant="outline-info" :disabled="saving || !contentReady" data-testid="achievement-clone" @click="openClone"><i class="fa fa-copy mr-1"></i>Clone</b-button>
              <b-button v-if="!creating" size="sm" variant="outline-danger" :disabled="saving || !contentReady" data-testid="achievement-delete" @click="openDelete"><i class="fa fa-trash mr-1"></i>Delete</b-button>
              <b-button size="sm" variant="warning" :disabled="saving || !dirty || !contentReady" data-testid="achievement-save" @click="saveDefinition"><i class="fa mr-1" :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"></i>Save graph</b-button>
            </div>
          </div>
          <div v-if="detailError" class="achievement-inline-alert achievement-inline-alert--danger" role="alert"><i class="fa fa-exclamation-triangle"></i><span>{{ detailError }}</span></div>
          <div v-if="saveMessage" class="achievement-inline-alert achievement-inline-alert--success" role="status"><i class="fa fa-check-circle"></i><span>{{ saveMessage }}</span></div>

          <eq-tabs :selected="selectedTab" @on-selected="selectedTab = $event">
            <eq-tab name="General" :selected="true">
              <section class="achievement-tab" data-testid="achievement-tab-general">
                <header><h2>Identity and publication</h2><p>Stable identifiers and lifecycle controls affect every dependent character-state row.</p></header>
                <div class="achievement-form-grid achievement-form-grid--3">
                  <div class="achievement-field"><label for="achievement-id">{{ field('achievements', 'id').label }}</label><input id="achievement-id" v-model.number="draft.id" type="number" min="1" step="1" class="form-control form-control-sm" :disabled="!creating" aria-describedby="achievement-id-help"><small id="achievement-id-help">{{ field('achievements', 'id').help }}</small></div>
                  <div class="achievement-field achievement-field--span-2"><label for="achievement-name">{{ field('achievements', 'name').label }}</label><input id="achievement-name" v-model.trim="draft.name" class="form-control form-control-sm" aria-describedby="achievement-name-help"><small id="achievement-name-help">{{ field('achievements', 'name').help }}</small></div>
                  <div class="achievement-field achievement-field--span-3"><label for="achievement-description">{{ field('achievements', 'description').label }}</label><textarea id="achievement-description" v-model="draft.description" rows="3" class="form-control form-control-sm" aria-describedby="achievement-description-help"></textarea><small id="achievement-description-help">{{ field('achievements', 'description').help }}</small></div>
                  <div class="achievement-field"><label for="achievement-icon">{{ field('achievements', 'icon_id').label }}</label><input id="achievement-icon" v-model.number="draft.icon_id" type="number" min="0" step="1" class="form-control form-control-sm" aria-describedby="achievement-icon-help"><small id="achievement-icon-help">{{ field('achievements', 'icon_id').help }}</small></div>
                  <div class="achievement-field"><label for="achievement-points">{{ field('achievements', 'points').label }}</label><input id="achievement-points" v-model.number="draft.points" type="number" min="0" step="1" class="form-control form-control-sm" aria-describedby="achievement-points-help"><small id="achievement-points-help">{{ field('achievements', 'points').help }}</small></div>
                  <div class="achievement-field"><label for="achievement-client-flag">{{ field('achievements', 'client_flag').label }}</label><input id="achievement-client-flag" v-model.number="draft.client_flag" type="number" min="0" max="255" step="1" class="form-control form-control-sm" aria-describedby="achievement-client-flag-help"><small id="achievement-client-flag-help">{{ field('achievements', 'client_flag').help }}</small></div>
                  <div class="achievement-field achievement-checkbox-field" role="group" aria-describedby="achievement-has-reward-help"><span class="achievement-field-label">{{ field('achievements', 'has_reward').label }}</span><eq-checkbox :value="draft.has_reward" label-right="Imported hint set" @input="draft.has_reward = $event"></eq-checkbox><small id="achievement-has-reward-help">{{ field('achievements', 'has_reward').help }}</small></div>
                  <div class="achievement-field"><label for="achievement-version">{{ field('achievements', 'version').label }}</label><input id="achievement-version" v-model.number="draft.version" type="number" min="0" step="1" class="form-control form-control-sm" aria-describedby="achievement-version-help"><small id="achievement-version-help">{{ field('achievements', 'version').help }}</small></div>
                  <div class="achievement-field achievement-checkbox-field" role="group" aria-describedby="achievement-reset-help"><span class="achievement-field-label">{{ field('achievements', 'reset_on_version_change').label }}</span><eq-checkbox :value="draft.reset_on_version_change" label-right="Reset old state" @input="draft.reset_on_version_change = $event"></eq-checkbox><small id="achievement-reset-help">{{ field('achievements', 'reset_on_version_change').help }}</small></div>
                  <div class="achievement-field achievement-checkbox-field" role="group" aria-describedby="achievement-enabled-help"><span class="achievement-field-label">{{ field('achievements', 'enabled').label }}</span><eq-checkbox :value="draft.enabled" label-right="Enabled in active snapshot" @input="draft.enabled = $event"></eq-checkbox><small id="achievement-enabled-help">{{ field('achievements', 'enabled').help }}</small></div>
                  <div class="achievement-field achievement-field--span-3"><label for="achievement-audit-reason">Audit reason</label><textarea id="achievement-audit-reason" v-model.trim="auditReason" rows="2" class="form-control form-control-sm" aria-describedby="achievement-audit-reason-help"></textarea><small id="achievement-audit-reason-help">Required for every write. Explain the player-facing intent and any migration or compatibility impact.</small></div>
                </div>
              </section>
            </eq-tab>

            <eq-tab name="Categories">
              <section class="achievement-tab" data-testid="achievement-tab-categories">
                <header class="achievement-section-header"><div><h2>Category associations</h2><p>One definition can appear in multiple client categories with independent order and display text.</p></div><b-button size="sm" variant="outline-warning" :disabled="atLimit('associations', draft.associations.length)" data-testid="achievement-add-association" @click="addAssociation"><i class="fa fa-plus mr-1"></i>Add association</b-button></header>
                <div v-if="!draft.associations.length" class="achievement-empty-row">No category associations are authored.</div>
                <article v-for="(association, index) in draft.associations" :key="'association-' + index" class="achievement-row-card">
                  <div class="achievement-row-card__title"><strong>Association {{ index + 1 }}</strong><b-button size="sm" variant="outline-danger" :aria-label="'Remove association ' + (index + 1)" @click="removeRow(draft.associations, index)"><i class="fa fa-trash"></i></b-button></div>
                  <div class="achievement-form-grid achievement-form-grid--3">
                    <achievement-reference-picker :id="'achievement-category-' + index" v-model="association.category_id" label="Category ID" :help="field('associations', 'category_id').help" kind="category" :testid="'achievement-category-picker-' + index"></achievement-reference-picker>
                    <div class="achievement-field"><label :for="'achievement-category-sequence-' + index">{{ field('associations', 'sequence').label }}</label><input :id="'achievement-category-sequence-' + index" v-model.number="association.sequence" type="number" min="0" step="1" class="form-control form-control-sm" :aria-describedby="'achievement-category-sequence-help-' + index"><small :id="'achievement-category-sequence-help-' + index">{{ field('associations', 'sequence').help }}</small></div>
                    <div class="achievement-field"><label :for="'achievement-category-text-' + index">{{ field('associations', 'display_text').label }}</label><input :id="'achievement-category-text-' + index" v-model="association.display_text" class="form-control form-control-sm" :aria-describedby="'achievement-category-text-help-' + index"><small :id="'achievement-category-text-help-' + index">{{ field('associations', 'display_text').help }}</small></div>
                  </div>
                </article>
              </section>
            </eq-tab>

            <eq-tab name="Components">
              <section class="achievement-tab" data-testid="achievement-tab-components">
                <header class="achievement-section-header"><div><h2>Components and criteria</h2><p>Components define client presentation groups; criteria define the authoritative progress graph.</p></div><b-button size="sm" variant="outline-warning" :disabled="atLimit('components', draft.components.length)" data-testid="achievement-add-component" @click="addComponent"><i class="fa fa-plus mr-1"></i>Add component</b-button></header>
                <div v-if="!draft.components.length" class="achievement-empty-row">No components are authored. An enabled definition needs an enabled criterion in a state-bearing component.</div>
                <article v-for="(component, componentIndex) in draft.components" :key="'component-' + componentIndex" class="achievement-graph-card" :class="{ 'achievement-graph-card--recovery': component.recovery_only }" :data-testid="component.recovery_only ? 'achievement-orphan-recovery-' + component.component_type + '-' + component.component_id : null">
                  <div class="achievement-graph-card__header"><div><span class="achievement-eyebrow">{{ component.recovery_only ? 'Recovery-only component' : ('Component ' + (componentIndex + 1)) }}</span><h3>Wire {{ component.component_type }} · ID {{ component.component_id }}</h3></div><div v-if="component.recovery_only" class="achievement-inline-controls"><b-button size="sm" variant="outline-success" :pressed="component.recovery_action === 'restore'" :disabled="component.recovery_action === 'delete'" :data-testid="'achievement-recovery-restore-' + componentIndex" @click="setRecoveryAction(component, 'restore')"><i class="fa fa-wrench mr-1"></i>Restore missing component</b-button><b-button size="sm" variant="outline-danger" :pressed="component.recovery_action === 'delete'" :disabled="component.recovery_action === 'restore'" :data-testid="'achievement-recovery-delete-' + componentIndex" @click="setRecoveryAction(component, 'delete')"><i class="fa fa-trash mr-1"></i>Delete orphan criteria</b-button><b-button v-if="component.recovery_action" size="sm" variant="outline-secondary" :data-testid="'achievement-recovery-undo-' + componentIndex" @click="setRecoveryAction(component, '')">Undo choice</b-button></div><div v-else><b-button size="sm" variant="outline-warning" :disabled="component.recovery_only || totalCriteria >= limit('criteria')" @click="addCriterion(component)"><i class="fa fa-plus mr-1"></i>Add criterion</b-button><b-button size="sm" variant="outline-danger" class="ml-1" :disabled="component.recovery_only || componentPersisted(component)" :title="componentPersisted(component) ? 'Persisted component identities must remain; disable their criteria instead.' : 'Remove this new component'" @click="removeComponent(componentIndex)"><i class="fa fa-trash mr-1"></i>Remove</b-button></div></div>
                  <div v-if="component.recovery_only" class="achievement-inline-alert achievement-inline-alert--danger" role="alert"><i class="fa fa-exclamation-triangle"></i><div><strong>{{ component.recovery_criteria_count }} orphan criterion row{{ component.recovery_criteria_count === 1 ? '' : 's' }} preserved</strong><span>{{ component.recovery_reason }}</span><span v-if="!component.recovery_action">Saving is blocked until you make one explicit whole-group choice. Restore creates the missing component and keeps every row; Delete removes every orphan row.</span><span v-else-if="component.recovery_action === 'restore'">Pending restore. Review the recovered fields below, increment the definition version if enabled runtime policy changes, then save.</span><span v-else>Pending explicit deletion. The preserved rows remain visible and read-only until the transactional save succeeds.</span></div></div>
                  <fieldset class="achievement-recovery-fieldset" :disabled="recoveryLocked(component)">
                  <div class="achievement-form-grid achievement-form-grid--4">
                    <div class="achievement-field"><label :for="'achievement-component-type-' + componentIndex">{{ field('components', 'component_type').label }}</label><select :id="'achievement-component-type-' + componentIndex" v-model.number="component.component_type" class="form-control form-control-sm" :disabled="componentPersisted(component)" :aria-describedby="'achievement-component-type-help-' + componentIndex"><option v-for="option in enumList('component_types')" :key="option.value" :value="Number(option.value)">{{ option.value }} — {{ option.label }}</option></select><small :id="'achievement-component-type-help-' + componentIndex">{{ selectedHelp('component_types', component.component_type) || field('components', 'component_type').help }}</small></div>
                    <div class="achievement-field"><label :for="'achievement-component-id-' + componentIndex">{{ field('components', 'component_id').label }}</label><input :id="'achievement-component-id-' + componentIndex" v-model.number="component.component_id" type="number" min="0" step="1" class="form-control form-control-sm" :disabled="componentPersisted(component)" :aria-describedby="'achievement-component-id-help-' + componentIndex"><small :id="'achievement-component-id-help-' + componentIndex">{{ field('components', 'component_id').help }}</small></div>
                    <div class="achievement-field"><label :for="'achievement-component-sequence-' + componentIndex">{{ field('components', 'sequence').label }}</label><input :id="'achievement-component-sequence-' + componentIndex" v-model.number="component.sequence" type="number" min="0" step="1" class="form-control form-control-sm" :aria-describedby="'achievement-component-sequence-help-' + componentIndex"><small :id="'achievement-component-sequence-help-' + componentIndex">{{ field('components', 'sequence').help }}</small></div>
                    <div class="achievement-field"><label :for="'achievement-component-count-' + componentIndex">{{ field('components', 'presentation_count').label }}</label><input :id="'achievement-component-count-' + componentIndex" v-model.number="component.presentation_count" type="number" min="1" step="1" class="form-control form-control-sm" :aria-describedby="'achievement-component-count-help-' + componentIndex"><small :id="'achievement-component-count-help-' + componentIndex">{{ field('components', 'presentation_count').help }}</small></div>
                    <div class="achievement-field achievement-field--span-2"><label :for="'achievement-component-name-' + componentIndex">{{ field('components', 'name').label }}</label><input :id="'achievement-component-name-' + componentIndex" v-model="component.name" class="form-control form-control-sm" :aria-describedby="'achievement-component-name-help-' + componentIndex"><small :id="'achievement-component-name-help-' + componentIndex">{{ field('components', 'name').help }}</small></div>
                    <div class="achievement-field achievement-field--span-2"><label :for="'achievement-component-description-' + componentIndex">{{ field('components', 'description').label }}</label><input :id="'achievement-component-description-' + componentIndex" v-model="component.description" class="form-control form-control-sm" :aria-describedby="'achievement-component-description-help-' + componentIndex"><small :id="'achievement-component-description-help-' + componentIndex">{{ field('components', 'description').help }}</small></div>
                  </div>
                  <div v-if="component.component_type === 3" class="achievement-inline-alert achievement-inline-alert--warning"><i class="fa fa-info-circle"></i><span>Type 3 is presentation-only. Any enabled criterion below will prevent publication.</span></div>
                  <div v-if="!component.criteria.length" class="achievement-empty-row achievement-empty-row--compact">No criteria in this component.</div>
                  <article v-for="(criterion, criterionIndex) in component.criteria" :key="'criterion-' + componentIndex + '-' + criterionIndex" class="achievement-criterion-card">
                    <div class="achievement-row-card__title"><strong>Criterion {{ criterionIndex + 1 }} <small v-if="criterion.id">row {{ criterion.id }}</small></strong><div class="achievement-inline-controls"><div role="group" :aria-describedby="'achievement-criterion-enabled-help-' + componentIndex + '-' + criterionIndex"><eq-checkbox :value="criterion.enabled" label-right="Enabled" @input="criterion.enabled = $event"></eq-checkbox><span :id="'achievement-criterion-enabled-help-' + componentIndex + '-' + criterionIndex" class="sr-only">{{ field('criteria', 'enabled').help }}</span></div><b-button size="sm" variant="outline-danger" :disabled="component.recovery_only" :title="component.recovery_only ? 'Recovery rows must remain intact until the missing component is restored or the whole orphan group is explicitly deleted.' : 'Remove criterion'" @click="removeRow(component.criteria, criterionIndex)"><i class="fa fa-trash"></i></b-button></div></div>
                    <div class="achievement-form-grid achievement-form-grid--4">
                      <div class="achievement-field"><label :for="criterionID(componentIndex, criterionIndex, 'event')">{{ field('criteria', 'event_type').label }}</label><select :id="criterionID(componentIndex, criterionIndex, 'event')" v-model.number="criterion.event_type" class="form-control form-control-sm" :aria-describedby="criterionID(componentIndex, criterionIndex, 'event-help')" @change="coerceCriterion(criterion)"><option v-for="option in enumList('events')" :key="option.value" :value="Number(option.value)">{{ option.value }} — {{ option.label }}</option></select><small :id="criterionID(componentIndex, criterionIndex, 'event-help')">{{ eventMeta(criterion).help }}</small></div>
                      <div class="achievement-field"><label :for="criterionID(componentIndex, criterionIndex, 'mode')">{{ field('criteria', 'progress_mode').label }}</label><select :id="criterionID(componentIndex, criterionIndex, 'mode')" v-model.number="criterion.progress_mode" class="form-control form-control-sm" :aria-describedby="criterionID(componentIndex, criterionIndex, 'mode-help')"><option v-for="option in progressModes(criterion)" :key="option.value" :value="Number(option.value)">{{ option.value }} — {{ option.label }}</option></select><small :id="criterionID(componentIndex, criterionIndex, 'mode-help')">{{ selectedHelp('progress_modes', criterion.progress_mode) || field('criteria', 'progress_mode').help }}</small></div>
                      <div class="achievement-field"><label :for="criterionID(componentIndex, criterionIndex, 'behavior')">{{ field('criteria', 'behavior').label }}</label><select :id="criterionID(componentIndex, criterionIndex, 'behavior')" v-model.number="criterion.behavior" class="form-control form-control-sm" :aria-describedby="criterionID(componentIndex, criterionIndex, 'behavior-help')"><option v-for="option in enumList('behaviors')" :key="option.value" :value="Number(option.value)">{{ option.value }} — {{ option.label }}</option></select><small :id="criterionID(componentIndex, criterionIndex, 'behavior-help')">{{ selectedHelp('behaviors', criterion.behavior) || field('criteria', 'behavior').help }}</small></div>
                      <div class="achievement-field"><label :for="criterionID(componentIndex, criterionIndex, 'required')">{{ field('criteria', 'required_count').label }}</label><input :id="criterionID(componentIndex, criterionIndex, 'required')" v-model.number="criterion.required_count" type="number" min="1" step="1" class="form-control form-control-sm" :aria-describedby="criterionID(componentIndex, criterionIndex, 'required-help')"><small :id="criterionID(componentIndex, criterionIndex, 'required-help')">{{ field('criteria', 'required_count').help }}</small></div>
                    </div>
                    <div class="achievement-criterion-help"><strong>{{ eventMeta(criterion).label }}</strong><span>{{ eventMeta(criterion).help }}</span></div>
                    <div class="achievement-form-grid achievement-form-grid--3">
                      <div v-if="criterion.event_type === 9 || criterion.event_type === 13" class="achievement-field"><label :for="criterionID(componentIndex, criterionIndex, 'skill')">{{ eventMeta(criterion).target1_label }}</label><select :id="criterionID(componentIndex, criterionIndex, 'skill')" v-model.number="criterion.target_id" class="form-control form-control-sm" :aria-describedby="criterionID(componentIndex, criterionIndex, 'skill-help')"><option v-if="criterion.event_type === 9" :value="4294967295">4294967295 — Any skill / wildcard</option><option v-for="skill in canonicalSkills" :key="skill.value" :value="skill.value">{{ skill.value }} — {{ skill.label }}</option></select><small :id="criterionID(componentIndex, criterionIndex, 'skill-help')">{{ eventMeta(criterion).target1_help }}</small></div>
                      <div v-else class="achievement-field"><achievement-reference-picker :id="criterionID(componentIndex, criterionIndex, 'target1')" v-model="criterion.target_id" :label="eventMeta(criterion).target1_label || field('criteria', 'target_id').label" :help="eventMeta(criterion).target1_help || field('criteria', 'target_id').help" :kind="eventMeta(criterion).lookup || ''"></achievement-reference-picker><div v-if="criterion.event_type === 12" class="achievement-npc-helper"><label :for="criterionID(componentIndex, criterionIndex, 'npc-name')">Canonical NPC name helper</label><div><input :id="criterionID(componentIndex, criterionIndex, 'npc-name')" :value="npcNames[componentIndex + ':' + criterionIndex] || ''" class="form-control form-control-sm" :aria-describedby="criterionID(componentIndex, criterionIndex, 'npc-name-help')" @input="setNpcName(componentIndex, criterionIndex, $event)"><b-button size="sm" variant="outline-warning" @click="applyNpcHash(criterion, componentIndex, criterionIndex)">Use hash</b-button></div><small :id="criterionID(componentIndex, criterionIndex, 'npc-name-help')">Canonical: {{ npcCanonical(componentIndex, criterionIndex) || '—' }} · Hash: {{ npcHash(componentIndex, criterionIndex) }}</small></div></div>
                      <div v-if="criterion.event_type === 7 || criterion.event_type === 13" class="achievement-field"><label :for="criterionID(componentIndex, criterionIndex, 'class')">{{ eventMeta(criterion).target2_label }}</label><select :id="criterionID(componentIndex, criterionIndex, 'class')" v-model.number="criterion.target_id2" class="form-control form-control-sm" :aria-describedby="criterionID(componentIndex, criterionIndex, 'class-help')"><option v-if="criterion.event_type === 7" :value="0">0 — Any class</option><option v-for="classOption in canonicalClasses" :key="classOption.value" :value="classOption.value">{{ classOption.value }} — {{ classOption.label }}</option></select><small :id="criterionID(componentIndex, criterionIndex, 'class-help')">{{ eventMeta(criterion).target2_help }}</small></div>
                      <achievement-reference-picker v-else :id="criterionID(componentIndex, criterionIndex, 'target2')" v-model="criterion.target_id2" :label="eventMeta(criterion).target2_label || field('criteria', 'target_id2').label" :help="eventMeta(criterion).target2_help || field('criteria', 'target_id2').help" :kind="criterion.event_type === 12 ? 'zone' : ''"></achievement-reference-picker>
                      <div class="achievement-field"><label :for="criterionID(componentIndex, criterionIndex, 'value')">{{ eventMeta(criterion).target_value_label || field('criteria', 'target_value').label }}</label><input :id="criterionID(componentIndex, criterionIndex, 'value')" v-model.trim="criterion.target_value" type="text" inputmode="numeric" pattern="[0-9]*" class="form-control form-control-sm" :aria-describedby="criterionID(componentIndex, criterionIndex, 'value-help')"><small :id="criterionID(componentIndex, criterionIndex, 'value-help')">{{ eventMeta(criterion).target_value_help || field('criteria', 'target_value').help }}</small></div>
                    </div>
                  </article>
                  </fieldset>
                </article>
              </section>
            </eq-tab>

            <eq-tab name="Rewards">
              <section class="achievement-tab" data-testid="achievement-tab-rewards">
                <header class="achievement-section-header"><div><h2>Canonical grants</h2><p>These rows are the actual delivered rewards. Selectable options below only group these identities.</p></div><b-button size="sm" variant="outline-warning" :disabled="atLimit('rewards', draft.rewards.length)" data-testid="achievement-add-reward" @click="addReward"><i class="fa fa-plus mr-1"></i>Add grant</b-button></header>
                <div v-if="!draft.rewards.length" class="achievement-empty-row">No rewards are authored.</div>
                <article v-for="(reward, rewardIndex) in draft.rewards" :key="'reward-' + rewardIndex" class="achievement-row-card">
                  <div class="achievement-row-card__title"><strong>Grant {{ reward.reward_id || rewardIndex + 1 }}</strong><div class="achievement-inline-controls"><div role="group" :aria-describedby="'achievement-reward-enabled-help-' + rewardIndex"><eq-checkbox :value="reward.enabled" :disabled="rewardCatalogProtected(reward, rewardIndex) ? 1 : 0" label-right="Enabled" @input="reward.enabled = $event"></eq-checkbox><span :id="'achievement-reward-enabled-help-' + rewardIndex" class="sr-only">{{ field('rewards', 'enabled').help }}</span></div><b-button size="sm" variant="outline-danger" :disabled="rewardPersisted(reward)" :title="rewardPersisted(reward) ? 'Persisted reward identities must remain; disable the grant instead.' : 'Remove this new grant'" @click="removeReward(rewardIndex)"><i class="fa fa-trash"></i></b-button></div></div>
                  <div v-if="rewardCatalogProtected(reward, rewardIndex)" class="achievement-inline-alert achievement-inline-alert--warning"><i class="fa fa-link"></i><span>This grant is mapped by a shared reward set, so its provider-independent catalog fields are read-only here.</span></div>
                  <div class="achievement-form-grid achievement-form-grid--5">
                    <div class="achievement-field"><label :for="'achievement-reward-id-' + rewardIndex">{{ field('rewards', 'reward_id').label }}</label><input :id="'achievement-reward-id-' + rewardIndex" :value="reward.reward_id" type="text" class="form-control form-control-sm" disabled :placeholder="'Allocated on save (' + rewardKey(reward, rewardIndex) + ')'" :aria-describedby="'achievement-reward-id-help-' + rewardIndex"><small :id="'achievement-reward-id-help-' + rewardIndex">{{ field('rewards', 'reward_id').help }}</small></div>
                    <div class="achievement-field"><label :for="'achievement-reward-sequence-' + rewardIndex">{{ field('rewards', 'sequence').label }}</label><input :id="'achievement-reward-sequence-' + rewardIndex" v-model.number="reward.sequence" type="number" min="0" step="1" class="form-control form-control-sm" :disabled="rewardCatalogProtected(reward, rewardIndex)" :aria-describedby="'achievement-reward-sequence-help-' + rewardIndex"><small :id="'achievement-reward-sequence-help-' + rewardIndex">{{ field('rewards', 'sequence').help }}</small></div>
                    <div class="achievement-field"><label :for="'achievement-reward-type-' + rewardIndex">{{ field('rewards', 'reward_type').label }}</label><select :id="'achievement-reward-type-' + rewardIndex" v-model.number="reward.reward_type" class="form-control form-control-sm" :disabled="rewardCatalogProtected(reward, rewardIndex)" :aria-describedby="'achievement-reward-type-help-' + rewardIndex"><option v-for="option in enumList('reward_types')" :key="option.value" :value="Number(option.value)">{{ option.value }} — {{ option.label }}</option></select><small :id="'achievement-reward-type-help-' + rewardIndex">{{ selectedHelp('reward_types', reward.reward_type) }}</small></div>
                    <div class="achievement-field"><achievement-reference-picker :id="'achievement-reward-data-' + rewardIndex" v-model="reward.reward_data_id" :label="field('rewards', 'reward_data_id').label" :help="rewardDataHelp(reward)" :kind="rewardLookup(reward)" :disabled="rewardCatalogProtected(reward, rewardIndex)"></achievement-reference-picker></div>
                    <div class="achievement-field"><label :for="'achievement-reward-amount-' + rewardIndex">{{ field('rewards', 'amount').label }}</label><input :id="'achievement-reward-amount-' + rewardIndex" v-model="reward.amount" type="number" min="0" step="1" class="form-control form-control-sm" :disabled="rewardCatalogProtected(reward, rewardIndex)" :aria-describedby="'achievement-reward-amount-help-' + rewardIndex"><small :id="'achievement-reward-amount-help-' + rewardIndex">{{ field('rewards', 'amount').help }}</small></div>
                    <div class="achievement-field achievement-field--span-4"><label :for="'achievement-reward-description-' + rewardIndex">{{ field('rewards', 'description').label }}</label><input :id="'achievement-reward-description-' + rewardIndex" v-model="reward.description" class="form-control form-control-sm" :disabled="rewardCatalogProtected(reward, rewardIndex)" :aria-describedby="'achievement-reward-description-help-' + rewardIndex"><small :id="'achievement-reward-description-help-' + rewardIndex">{{ field('rewards', 'description').help }}</small></div>
                    <div v-if="draft.reward_set" class="achievement-field"><label :for="'achievement-reward-option-' + rewardIndex">Selectable option</label><select :id="'achievement-reward-option-' + rewardIndex" :value="mappedOption(rewardKey(reward, rewardIndex))" class="form-control form-control-sm" :disabled="draft.reward_set.shared" :aria-describedby="'achievement-reward-option-help-' + rewardIndex" @change="setRewardMapping(rewardKey(reward, rewardIndex), $event)"><option value="">Automatic / ungrouped</option><option v-for="option in draft.reward_set.options" :key="option.option_id" :value="String(option.option_id)">#{{ option.option_id }} {{ option.label || '(unnamed option)' }}</option></select><small :id="'achievement-reward-option-help-' + rewardIndex">A canonical reward may map to only one option. Its Grant order becomes reward_option_entries.sequence. New blank IDs use a safe transient @index token resolved transactionally by the server.</small></div>
                  </div>
                </article>

                <div class="achievement-section-divider"></div>
                <header class="achievement-section-header"><div><h2>Selectable reward set</h2><p>Enable only when the client should choose among mapped canonical grants.</p></div><b-button v-if="!draft.reward_set" size="sm" variant="outline-warning" data-testid="achievement-enable-reward-set" @click="enableRewardSet"><i class="fa fa-plus mr-1"></i>Author set</b-button><b-button v-else size="sm" variant="outline-danger" :disabled="rewardSetPersisted()" :title="rewardSetPersisted() ? 'A persisted reward set is durable; disable it instead.' : 'Remove this new selectable set'" @click="removeRewardSet"><i class="fa fa-trash mr-1"></i>Remove set</b-button></header>
                <div v-if="!draft.reward_set" class="achievement-empty-row">No selectable reward set is authored. Enabled canonical rewards are delivered automatically.</div>
                <div v-else class="achievement-reward-set">
                  <div v-if="draft.reward_set.shared" class="achievement-inline-alert achievement-inline-alert--warning"><i class="fa fa-link"></i><span>This provider-independent set is used by {{ draft.reward_set.source_count }} sources. Catalog fields are protected from edits; only this achievement's source link can be enabled or disabled.</span></div>
                  <div class="achievement-form-grid achievement-form-grid--3">
                    <div class="achievement-field"><label for="achievement-reward-set-id">{{ field('reward_sets', 'reward_set_id').label }}</label><input id="achievement-reward-set-id" v-model.number="draft.reward_set.reward_set_id" type="number" min="1" step="1" class="form-control form-control-sm" :disabled="rewardSetPersisted()" aria-describedby="achievement-reward-set-id-help"><small id="achievement-reward-set-id-help">{{ field('reward_sets', 'reward_set_id').help }}</small></div>
                    <div class="achievement-field achievement-field--span-2"><label for="achievement-reward-set-title">{{ field('reward_sets', 'title').label }}</label><input id="achievement-reward-set-title" v-model="draft.reward_set.title" class="form-control form-control-sm" :disabled="draft.reward_set.shared" aria-describedby="achievement-reward-set-title-help"><small id="achievement-reward-set-title-help">{{ field('reward_sets', 'title').help }}</small></div>
                    <div class="achievement-field achievement-checkbox-field" role="group" aria-describedby="achievement-reward-source-enabled-help"><span class="achievement-field-label">{{ field('reward_sets', 'source_enabled').label }}</span><eq-checkbox :value="draft.reward_set.source_enabled" label-right="Source link enabled" @input="draft.reward_set.source_enabled = $event"></eq-checkbox><small id="achievement-reward-source-enabled-help">{{ field('reward_sets', 'source_enabled').help }}</small></div>
                    <div class="achievement-field achievement-checkbox-field" role="group" aria-describedby="achievement-reward-set-enabled-help"><span class="achievement-field-label">{{ field('reward_sets', 'enabled').label }}</span><eq-checkbox :value="draft.reward_set.enabled" :disabled="draft.reward_set.shared ? 1 : 0" label-right="Set enabled" @input="draft.reward_set.enabled = $event"></eq-checkbox><small id="achievement-reward-set-enabled-help">{{ field('reward_sets', 'enabled').help }}</small></div>
                  </div>
                  <header class="achievement-section-header achievement-section-header--sub"><div><h3>Options</h3><p>Every enabled option, including common options, needs an enabled mapped grant.</p></div><b-button size="sm" variant="outline-warning" :disabled="draft.reward_set.shared || atLimit('options', draft.reward_set.options.length)" data-testid="achievement-add-option" @click="addRewardOption"><i class="fa fa-plus mr-1"></i>Add option</b-button></header>
                  <fieldset v-for="(option, optionIndex) in draft.reward_set.options" :key="'reward-option-' + optionIndex" :disabled="draft.reward_set.shared" class="achievement-recovery-fieldset"><article class="achievement-row-card">
                    <div class="achievement-row-card__title"><strong>Option {{ option.option_id || optionIndex + 1 }}</strong><b-button size="sm" variant="outline-danger" :disabled="rewardOptionPersisted(option)" :title="rewardOptionPersisted(option) ? 'Persisted option identities must remain; disable the option instead.' : 'Remove this new option'" @click="removeRewardOption(optionIndex)"><i class="fa fa-trash"></i></b-button></div>
                    <div class="achievement-form-grid achievement-form-grid--5">
                      <div class="achievement-field"><label :for="'achievement-option-id-' + optionIndex">{{ field('reward_options', 'option_id').label }}</label><input :id="'achievement-option-id-' + optionIndex" v-model.number="option.option_id" type="number" min="1" step="1" class="form-control form-control-sm" :disabled="rewardOptionPersisted(option)" :aria-describedby="'achievement-option-id-help-' + optionIndex"><small :id="'achievement-option-id-help-' + optionIndex">{{ field('reward_options', 'option_id').help }}</small></div>
                      <div class="achievement-field"><label :for="'achievement-option-sequence-' + optionIndex">{{ field('reward_options', 'sequence').label }}</label><input :id="'achievement-option-sequence-' + optionIndex" v-model.number="option.sequence" type="number" min="0" step="1" class="form-control form-control-sm" :aria-describedby="'achievement-option-sequence-help-' + optionIndex"><small :id="'achievement-option-sequence-help-' + optionIndex">{{ field('reward_options', 'sequence').help }}</small></div>
                      <div class="achievement-field achievement-field--span-2"><label :for="'achievement-option-label-' + optionIndex">{{ field('reward_options', 'label').label }}</label><input :id="'achievement-option-label-' + optionIndex" v-model="option.label" class="form-control form-control-sm" :aria-describedby="'achievement-option-label-help-' + optionIndex"><small :id="'achievement-option-label-help-' + optionIndex">{{ field('reward_options', 'label').help }}</small></div>
                      <div class="achievement-field"><label :for="'achievement-option-flags-' + optionIndex">{{ field('reward_options', 'flags').label }}</label><input :id="'achievement-option-flags-' + optionIndex" v-model.number="option.flags" type="number" min="0" step="1" class="form-control form-control-sm" :aria-describedby="'achievement-option-flags-help-' + optionIndex"><small :id="'achievement-option-flags-help-' + optionIndex">{{ field('reward_options', 'flags').help }}</small></div>
                      <div class="achievement-field achievement-checkbox-field" role="group" :aria-describedby="'achievement-option-common-help-' + optionIndex"><span class="achievement-field-label">{{ field('reward_options', 'common_to_all').label }}</span><eq-checkbox :value="option.common_to_all" label-right="Common to all" @input="option.common_to_all = $event"></eq-checkbox><small :id="'achievement-option-common-help-' + optionIndex">{{ field('reward_options', 'common_to_all').help }}</small></div>
                      <div class="achievement-field achievement-checkbox-field" role="group" :aria-describedby="'achievement-option-enabled-help-' + optionIndex"><span class="achievement-field-label">{{ field('reward_options', 'enabled').label }}</span><eq-checkbox :value="option.enabled" label-right="Option enabled" @input="option.enabled = $event"></eq-checkbox><small :id="'achievement-option-enabled-help-' + optionIndex">{{ field('reward_options', 'enabled').help }}</small></div>
                    </div>
                    <div class="achievement-option-grants"><strong>Mapped grants:</strong><span v-if="!optionGrantLabels(option.option_id).length">none</span><span v-for="label in optionGrantLabels(option.option_id)" :key="label" class="achievement-status-pill">{{ label }}</span></div>
                  </article></fieldset>
                </div>
              </section>
            </eq-tab>

            <eq-tab name="Cast Requirements">
              <section class="achievement-tab" data-testid="achievement-tab-requirements">
                <header class="achievement-section-header"><div><h2>Spell cast requirements</h2><p>Expose achievement completion state to existing spell restriction numbers.</p></div><b-button size="sm" variant="outline-warning" :disabled="atLimit('requirements', draft.requirements.length)" data-testid="achievement-add-restriction" @click="addRestriction"><i class="fa fa-plus mr-1"></i>Add restriction</b-button></header>
                <div class="achievement-inline-alert achievement-inline-alert--info"><i class="fa fa-info-circle"></i><span>All applicable rows sharing a restriction ID must pass. Verify the restriction number in server spell logic before publishing.</span></div>
                <div v-if="!draft.requirements.length" class="achievement-empty-row">No cast requirements reference this definition.</div>
                <article v-for="(restriction, index) in draft.requirements" :key="'restriction-' + index" class="achievement-row-card">
                  <div class="achievement-row-card__title"><strong>Restriction {{ index + 1 }}</strong><b-button size="sm" variant="outline-danger" @click="removeRow(draft.requirements, index)"><i class="fa fa-trash"></i></b-button></div>
                  <div class="achievement-form-grid achievement-form-grid--2">
                    <achievement-reference-picker :id="'achievement-restriction-' + index" v-model="restriction.restriction_id" :label="field('requirements', 'restriction_id').label" :help="field('requirements', 'restriction_id').help" kind=""></achievement-reference-picker>
                    <div class="achievement-field achievement-checkbox-field" role="group" :aria-describedby="'achievement-restriction-state-help-' + index"><span class="achievement-field-label">{{ field('requirements', 'requires_completed').label }}</span><eq-checkbox :value="restriction.requires_completed" :label-right="restriction.requires_completed ? 'Must be completed' : 'Must be incomplete'" @input="restriction.requires_completed = $event"></eq-checkbox><small :id="'achievement-restriction-state-help-' + index">{{ field('requirements', 'requires_completed').help }}</small></div>
                  </div>
                </article>
              </section>
            </eq-tab>

            <eq-tab name="Validation">
              <section class="achievement-tab" data-testid="achievement-tab-validation">
                <header><h2>Authoring checks</h2><p>Immediate client checks mirror server rules. Server validation remains authoritative and is repeated transactionally on save.</p></header>
                <div class="achievement-validation-summary" :class="validationErrors.length ? 'achievement-validation-summary--danger' : 'achievement-validation-summary--success'">
                  <i class="fa" :class="validationErrors.length ? 'fa-exclamation-triangle' : 'fa-check-circle'"></i>
                  <div><strong>{{ validationErrors.length ? validationErrors.length + ' blocking issue' + (validationErrors.length === 1 ? '' : 's') : 'No client-side blockers' }}</strong><span>{{ validationErrors.length ? 'Resolve every error before publishing or saving.' : 'The server will still revalidate references, schema, and graph consistency.' }}</span></div>
                </div>
                <div v-if="!combinedValidation.length" class="achievement-empty-row">No validation messages.</div>
                <article v-for="(issue, index) in combinedValidation" :key="index" class="achievement-validation-row" :class="issue.level === 'warning' ? 'achievement-validation-row--warning' : 'achievement-validation-row--danger'">
                  <i class="fa" :class="issue.level === 'warning' ? 'fa-info-circle' : 'fa-exclamation-circle'"></i><div><strong>{{ issue.path || 'graph' }}</strong><span>{{ issue.message }}</span></div>
                </article>
              </section>
            </eq-tab>

            <eq-tab name="Authoring Guide">
              <achievement-authoring-guide :metadata="metadata"></achievement-authoring-guide>
            </eq-tab>
          </eq-tabs>
        </eq-window>
      </main>
    </div>

    <div v-else-if="workspaceMode === 'categories'" class="spire-editor-workspace achievement-editor__workspace">
      <aside class="spire-editor-directory"><eq-window title="Category Directory">
        <div class="spire-editor-directory-controls"><div class="spire-editor-search"><i class="fa fa-search"></i><input id="achievement-category-search" v-model.trim="categorySearch" class="form-control form-control-sm" placeholder="Search category ID or name…" aria-describedby="achievement-category-search-help"></div><b-button size="sm" variant="outline-warning" :disabled="!contentReady" data-testid="achievement-new-category" @click="createCategory"><i class="fa fa-plus mr-1"></i>New</b-button></div>
        <small id="achievement-category-search-help" class="achievement-field-help">Filters the bounded category list already loaded from the server.</small>
        <div class="spire-editor-directory-list" data-testid="achievement-category-directory">
          <button v-for="category in filteredCategories" :key="category.id" type="button" class="spire-editor-directory-row" :class="{ active: categoryDraft && Number(categoryDraft.id) === Number(category.id) && !categoryCreating }" @click="selectCategory(category.id)"><span class="spire-editor-directory-icon"><i class="fa fa-folder"></i></span><span class="spire-editor-directory-body"><span class="spire-editor-directory-name">{{ category.name || '(unnamed category)' }}</span><span class="spire-editor-directory-detail">#{{ category.id }} · parent {{ category.parent_id || 0 }} · order {{ category.sequence || 0 }}</span></span></button>
        </div>
      </eq-window></aside>
      <main class="spire-editor-inspector"><eq-window title="Achievement Category">
        <div v-if="!categoryDraft" class="spire-editor-empty"><div class="spire-editor-empty__sigil"><i class="fa fa-folder"></i></div><h3>Select a category</h3><p>Edit its durable hierarchy identity and presentation details.</p></div>
        <section v-else class="achievement-tab" data-testid="achievement-category-editor">
          <header class="achievement-section-header"><div><h2>{{ categoryCreating ? 'New category' : categoryDraft.name }}</h2><p>Category hierarchy changes are audited independently from definition graphs.</p></div><div><b-button v-if="!categoryCreating" size="sm" variant="outline-danger" class="mr-1" :disabled="!contentReady" @click="openCategoryDelete"><i class="fa fa-trash mr-1"></i>Delete</b-button><b-button size="sm" variant="warning" :disabled="categorySaving || !categoryDirty || !contentReady" data-testid="achievement-save-category" @click="saveCategory"><i class="fa mr-1" :class="categorySaving ? 'fa-spinner fa-spin' : 'fa-save'"></i>Save category</b-button></div></header>
          <div v-if="categoryError" class="achievement-inline-alert achievement-inline-alert--danger" role="alert"><i class="fa fa-exclamation-triangle"></i><span>{{ categoryError }}</span></div>
          <div class="achievement-form-grid achievement-form-grid--3">
            <div class="achievement-field"><label for="achievement-category-id">{{ field('categories', 'id').label }}</label><input id="achievement-category-id" v-model.number="categoryDraft.id" type="number" min="1" step="1" class="form-control form-control-sm" :disabled="!categoryCreating" aria-describedby="achievement-category-id-help"><small id="achievement-category-id-help">{{ field('categories', 'id').help }}</small></div>
            <achievement-reference-picker id="achievement-category-parent" v-model="categoryDraft.parent_id" :label="field('categories', 'parent_id').label" :help="field('categories', 'parent_id').help" kind="category"></achievement-reference-picker>
            <div class="achievement-field"><label for="achievement-category-sequence">{{ field('categories', 'sequence').label }}</label><input id="achievement-category-sequence" v-model.number="categoryDraft.sequence" type="number" min="0" step="1" class="form-control form-control-sm" aria-describedby="achievement-category-sequence-help"><small id="achievement-category-sequence-help">{{ field('categories', 'sequence').help }}</small></div>
            <div class="achievement-field achievement-field--span-2"><label for="achievement-category-name">{{ field('categories', 'name').label }}</label><input id="achievement-category-name" v-model.trim="categoryDraft.name" class="form-control form-control-sm" aria-describedby="achievement-category-name-help"><small id="achievement-category-name-help">{{ field('categories', 'name').help }}</small></div>
            <div class="achievement-field"><label for="achievement-category-icon">{{ field('categories', 'icon').label }}</label><input id="achievement-category-icon" v-model="categoryDraft.icon" type="text" class="form-control form-control-sm" aria-describedby="achievement-category-icon-help"><small id="achievement-category-icon-help">{{ field('categories', 'icon').help }}</small></div>
            <div class="achievement-field achievement-field--span-3"><label for="achievement-category-description">{{ field('categories', 'description').label }}</label><textarea id="achievement-category-description" v-model="categoryDraft.description" rows="3" class="form-control form-control-sm" aria-describedby="achievement-category-description-help"></textarea><small id="achievement-category-description-help">{{ field('categories', 'description').help }}</small></div>
            <div class="achievement-field achievement-field--span-3"><label for="achievement-category-reason">Audit reason</label><textarea id="achievement-category-reason" v-model.trim="categoryReason" rows="2" class="form-control form-control-sm" aria-describedby="achievement-category-reason-help"></textarea><small id="achievement-category-reason-help">Required for every category write. Explain hierarchy and player-facing impact.</small></div>
          </div>
        </section>
      </eq-window></main>
    </div>

    <eq-window v-else title="Achievement Authoring Guide"><achievement-authoring-guide :metadata="metadata"></achievement-authoring-guide></eq-window>

    <b-modal v-model="cloneModal" title="Clone achievement definition" hide-footer no-close-on-backdrop>
      <p>The clone receives fresh canonical identities and is forced disabled so it cannot enter the active snapshot before review.</p>
      <div class="achievement-field"><label for="achievement-clone-id">New stable ID</label><input id="achievement-clone-id" v-model.number="cloneForm.new_id" type="number" min="1" step="1" class="form-control" aria-describedby="achievement-clone-id-help"><small id="achievement-clone-id-help">Choose an unused positive achievement ID.</small></div>
      <div class="achievement-field"><label for="achievement-clone-name">New name</label><input id="achievement-clone-name" v-model.trim="cloneForm.name" class="form-control" aria-describedby="achievement-clone-name-help"><small id="achievement-clone-name-help">A distinct working name makes the disabled clone easy to locate.</small></div>
      <div class="achievement-field"><label for="achievement-clone-reason">Audit reason</label><textarea id="achievement-clone-reason" v-model.trim="cloneForm.reason" class="form-control" rows="2" aria-describedby="achievement-clone-reason-help"></textarea><small id="achievement-clone-reason-help">Explain why a new definition is being derived.</small></div>
      <div class="achievement-field"><label for="achievement-clone-confirmation">Type {{ clonePhrase }}</label><input id="achievement-clone-confirmation" v-model="cloneForm.confirmation" class="form-control" autocomplete="off" aria-describedby="achievement-clone-confirmation-help"><small id="achievement-clone-confirmation-help">Typed confirmation protects stable IDs from accidental duplication.</small></div>
      <div class="achievement-modal-actions"><b-button variant="secondary" @click="cloneModal = false">Cancel</b-button><b-button variant="warning" :disabled="cloneWorking || cloneForm.confirmation !== clonePhrase || !cloneForm.reason || cloneForm.new_id <= 0" data-testid="achievement-confirm-clone" @click="cloneDefinition"><i v-if="cloneWorking" class="fa fa-spinner fa-spin mr-1"></i>Clone disabled definition</b-button></div>
    </b-modal>

    <b-modal v-model="deleteModal" title="Delete achievement definition" hide-footer no-close-on-backdrop>
      <div class="achievement-inline-alert achievement-inline-alert--danger"><i class="fa fa-exclamation-triangle"></i><span>Deletion can orphan historical character state. The server will reject unsafe dependencies, but this action cannot be undone here.</span></div>
      <div class="achievement-field"><label for="achievement-delete-reason">Audit reason</label><textarea id="achievement-delete-reason" v-model.trim="deleteForm.reason" class="form-control" rows="2" aria-describedby="achievement-delete-reason-help"></textarea><small id="achievement-delete-reason-help">Explain why the durable content identity must be removed.</small></div>
      <div class="achievement-field"><label for="achievement-delete-confirmation">Type {{ deletePhrase }}</label><input id="achievement-delete-confirmation" v-model="deleteForm.confirmation" class="form-control" autocomplete="off" aria-describedby="achievement-delete-confirmation-help"><small id="achievement-delete-confirmation-help">The exact phrase is checked by the server.</small></div>
      <div class="achievement-modal-actions"><b-button variant="secondary" @click="deleteModal = false">Cancel</b-button><b-button variant="danger" :disabled="deleteWorking || deleteForm.confirmation !== deletePhrase || !deleteForm.reason" data-testid="achievement-confirm-delete" @click="deleteDefinition"><i v-if="deleteWorking" class="fa fa-spinner fa-spin mr-1"></i>Delete definition</b-button></div>
    </b-modal>

    <b-modal v-model="categoryDeleteModal" title="Delete achievement category" hide-footer no-close-on-backdrop>
      <p>Definitions or child categories may still reference this durable category ID. The server will reject an unsafe deletion.</p>
      <div class="achievement-field"><label for="achievement-category-delete-reason">Audit reason</label><textarea id="achievement-category-delete-reason" v-model.trim="categoryDeleteForm.reason" class="form-control" rows="2" aria-describedby="achievement-category-delete-reason-help"></textarea><small id="achievement-category-delete-reason-help">Explain the hierarchy change.</small></div>
      <div class="achievement-field"><label for="achievement-category-delete-confirmation">Type {{ categoryDeletePhrase }}</label><input id="achievement-category-delete-confirmation" v-model="categoryDeleteForm.confirmation" class="form-control" aria-describedby="achievement-category-delete-confirmation-help"><small id="achievement-category-delete-confirmation-help">The exact phrase protects the stable category identity.</small></div>
      <div class="achievement-modal-actions"><b-button variant="secondary" :disabled="categoryDeleting" @click="categoryDeleteModal = false">Cancel</b-button><b-button variant="danger" :disabled="categoryDeleting || !categoryDeleteForm.reason || categoryDeleteForm.confirmation !== categoryDeletePhrase" @click="deleteCategory"><i v-if="categoryDeleting" class="fa fa-spinner fa-spin mr-1"></i>Delete category</b-button></div>
    </b-modal>

    <b-modal v-model="conflictModal" title="This definition changed on the server" hide-footer no-close-on-backdrop>
      <div class="achievement-inline-alert achievement-inline-alert--warning"><i class="fa fa-code-fork"></i><span>Your expected definition version is stale. Nothing was overwritten.</span></div>
      <p>Reload the current server graph to review the other edit. You can copy any unsaved values before choosing reload.</p>
      <div class="achievement-modal-actions"><b-button variant="secondary" @click="conflictModal = false">Keep editing</b-button><b-button variant="warning" @click="conflictModal = false; loadDefinition(selectedID)">Reload server graph</b-button></div>
    </b-modal>
  </content-area>
</template>

<script lang="ts">
  import Vue from 'vue'
  import ContentArea from '@/components/layout/ContentArea.vue'
  import EqWindow from '@/components/eq-ui/EQWindow.vue'
  import EqTabs from '@/components/eq-ui/EQTabs.vue'
  import EqTab from '@/components/eq-ui/EQTab.vue'
  import EqCheckbox from '@/components/eq-ui/EQCheckbox.vue'
  import { SpireApi } from '@/app/api/spire-api'
  import {
    CANONICAL_CLASSES,
    CANONICAL_SKILLS,
    canonicalizeNpcName,
    deepClone,
    definitionSnapshot,
    emptyComponent,
    emptyCriterion,
    emptyDefinition,
    emptyReward,
    emptyRewardOption,
    enumOptions,
    fieldHelp,
    mergeMetadata,
    normalizeDefinition,
    npcNameHash,
    runtimePolicySnapshot,
    validateDefinition
  } from '@/app/achievements'
  import AchievementReferencePicker from './components/AchievementReferencePicker.vue'
  import AchievementAuthoringGuide from './components/AchievementAuthoringGuide.vue'

  export default Vue.extend({
    name: 'AchievementEditor',
    components: { ContentArea, EqWindow, EqTabs, EqTab, EqCheckbox, AchievementReferencePicker, AchievementAuthoringGuide },
    data () {
      return {
        metadata: mergeMetadata({}),
        schema: null as any,
        schemaLoading: true,
        workspaceMode: 'definitions',
        selectedTab: 'General',
        definitions: [] as any[],
        totalDefinitions: 0,
        directoryLoading: false,
        directoryError: '',
        directoryTimer: null as any,
        filters: { q: '', enabled: '', category_id: '', event_type: '', reward_type: '', reward: '', sort: 'name', direction: 'asc', page: 1, limit: 25 } as any,
        selectedID: 0,
        creating: false,
        draft: null as any,
        baseline: '',
        expectedVersion: 0,
        expectedRevision: '',
        auditReason: '',
        serverValidation: [] as any[],
        serverValidationBaseline: '',
        detailLoading: false,
        detailError: '',
        saveMessage: '',
        saving: false,
        npcNames: {} as any,
        categories: [] as any[],
        categorySearch: '',
        categoryDraft: null as any,
        categoryBaseline: '',
        categoryExpectedParent: 0,
        categoryExpectedRevision: '',
        categoryCreating: false,
        categorySaving: false,
        categoryDeleting: false,
        categoryReason: '',
        categoryError: '',
        cloneModal: false,
        cloneWorking: false,
        cloneForm: { new_id: 0, name: '', reason: '', confirmation: '' } as any,
        deleteModal: false,
        deleteWorking: false,
        deleteForm: { reason: '', confirmation: '' } as any,
        categoryDeleteModal: false,
        categoryDeleteForm: { reason: '', confirmation: '' } as any,
        conflictModal: false
      }
    },
    computed: {
      contentReady (): boolean {
        if (!this.schema) return false
        return this.schema.ready !== false && (!this.schema.content || this.schema.content.ready !== false)
      },
      schemaIssues (): any[] { return (this.schema && this.schema.content && this.schema.content.issues) || (this.schema && this.schema.issues) || [] },
      schemaGuidance (): string {
        return (this.schema && this.schema.guidance) || 'Install EQEmu database update 9329 for the final achievement content schema. Rewritten CREATE migrations do not alter tables created by an older draft.'
      },
      totalPages (): number { return Math.max(1, Math.ceil(this.totalDefinitions / Number(this.filters.limit || 25))) },
      dirty (): boolean { return !!this.draft && definitionSnapshot(this.draft) !== this.baseline },
      categoryDirty (): boolean { return !!this.categoryDraft && JSON.stringify(this.categoryDraft) !== this.categoryBaseline },
      clientValidation (): any[] {
        const issues = this.draft ? validateDefinition(this.draft, this.metadata) : []
        const baseline = this.baselineDefinition()
        if (!this.creating && this.draft && this.baseline && baseline && runtimePolicySnapshot(this.draft) !== runtimePolicySnapshot(baseline) && Number(this.draft.version) <= Number(this.expectedVersion)) {
          issues.push({ path: 'general.version', message: 'Runtime evaluation or reward policy changed. Increment the definition version so deployed character state is not silently reinterpreted.', level: 'error' })
        }
        return issues
      },
      validationErrors (): any[] { return this.combinedValidation.filter((issue: any) => issue.level !== 'warning') },
      combinedValidation (): any[] {
        const all = [...this.clientValidation]
        const currentSnapshot = this.draft ? definitionSnapshot(this.draft) : ''
        const currentServerValidation = this.serverValidationBaseline === currentSnapshot ? this.serverValidation : []
        currentServerValidation.forEach((issue: any) => {
          const normalized = typeof issue === 'string' ? { path: 'server', message: issue, level: 'error' } : { path: issue.path || issue.field || 'server', message: issue.message || issue.error || String(issue), level: issue.level || issue.severity || 'error' }
          if (!all.some(row => row.path === normalized.path && row.message === normalized.message)) all.push(normalized)
        })
        return all
      },
      totalCriteria (): number { return this.draft ? this.draft.components.reduce((count: number, component: any) => count + component.criteria.length, 0) : 0 },
      canonicalSkills (): any[] { return CANONICAL_SKILLS },
      canonicalClasses (): any[] { return CANONICAL_CLASSES },
      filteredCategories (): any[] {
        const q = this.categorySearch.toLowerCase()
        return !q ? this.categories : this.categories.filter(row => String(row.id).includes(q) || String(row.name || '').toLowerCase().includes(q))
      },
      clonePhrase (): string { return 'CLONE ' + Number(this.selectedID || 0) },
      deletePhrase (): string { return 'DELETE ' + Number(this.selectedID || 0) },
      categoryDeletePhrase (): string { return 'DELETE ' + Number(this.categoryDraft ? this.categoryDraft.id : 0) }
    },
    created () {
      this.bootstrap()
    },
    mounted () {
      window.addEventListener('beforeunload', this.beforeUnload)
      window.addEventListener('keydown', this.keydown)
    },
    beforeDestroy () {
      window.removeEventListener('beforeunload', this.beforeUnload)
      window.removeEventListener('keydown', this.keydown)
      if (this.directoryTimer) window.clearTimeout(this.directoryTimer)
    },
    beforeRouteLeave (to: any, from: any, next: any) {
      if ((this.dirty || this.categoryDirty) && !window.confirm('Discard unsaved achievement editor changes?')) return next(false)
      next()
    },
    methods: {
      async bootstrap (refreshSchema = false) {
        this.schemaLoading = true
        this.directoryError = ''
        try {
          const responses = await Promise.all([
            SpireApi.v1().get('/achievement-editor/metadata'),
            SpireApi.v1().get('/achievement-editor/schema', { params: refreshSchema ? { refresh: 1 } : {} }),
            SpireApi.v1().get('/achievement-editor/categories', { params: { page: 1, limit: 500, sort: 'sequence', direction: 'asc' } })
          ])
          this.metadata = mergeMetadata(responses[0].data)
          this.schema = responses[1].data || {}
          const categoryPayload = responses[2].data || {}
          this.categories = Array.isArray(categoryPayload) ? categoryPayload : (categoryPayload.data || [])
          await this.loadDirectory()
        } catch (error) {
          this.schema = { ready: false, content: { ready: false, issues: [{ message: this.errorMessage(error, 'Schema capability check could not be loaded.') }] } }
        } finally {
          this.schemaLoading = false
        }
      },
      enumList (key: string): any[] { return enumOptions(this.metadata, key) },
      field (table: string, fieldName: string): any { return fieldHelp(this.metadata, table, fieldName) },
      selectedHelp (key: string, value: any): string {
        const option = this.enumList(key).find(row => Number(row.value) === Number(value) || String(row.value) === String(value))
        return option ? option.help : ''
      },
      eventMeta (criterion: any): any {
        return this.enumList('events').find(row => Number(row.value) === Number(criterion.event_type)) || { label: 'Unknown event', help: 'Select a supported event.', target1_label: 'Target ID', target1_help: '', target2_label: 'Secondary target', target2_help: '', target_value_label: 'Target value', target_value_help: '', allowed_progress_modes: [0, 1, 2, 3] }
      },
      progressModes (criterion: any): any[] {
        const event = this.eventMeta(criterion)
        const allowed = event.allowed_progress_modes || [0, 1, 2, 3]
        return this.enumList('progress_modes').filter(row => allowed.includes(Number(row.value)))
      },
      criterionID (componentIndex: number, criterionIndex: number, suffix: string): string { return 'achievement-criterion-' + componentIndex + '-' + criterionIndex + '-' + suffix },
      number (value: any): string { return Number(value || 0).toLocaleString() },
      limit (key: string): number { return Number((this.metadata.limits && this.metadata.limits[key]) || 0) },
      atLimit (key: string, count: number): boolean { const value = this.limit(key); return value > 0 && count >= value },
      beforeUnload (event: BeforeUnloadEvent) {
        if (!this.dirty && !this.categoryDirty) return
        event.preventDefault()
        event.returnValue = ''
      },
      keydown (event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
          event.preventDefault()
          if (this.workspaceMode === 'categories') this.saveCategory()
          else if (this.workspaceMode === 'definitions') this.saveDefinition()
        }
      },
      switchWorkspace (mode: string) {
        if ((this.dirty || this.categoryDirty) && !window.confirm('Leave this workspace with unsaved changes? The in-page draft will be preserved until you reload or navigate away.')) return
        this.workspaceMode = mode
      },
      queueDirectory () {
        if (this.directoryTimer) window.clearTimeout(this.directoryTimer)
        this.directoryTimer = window.setTimeout(() => { this.filters.page = 1; this.loadDirectory() }, 350)
      },
      applyFilters () { this.filters.page = 1; this.loadDirectory() },
      changePage (page: number) { this.filters.page = Math.min(Math.max(page, 1), this.totalPages); this.loadDirectory() },
      async loadDirectory () {
        this.directoryLoading = true
        this.directoryError = ''
        try {
          const params: any = { page: this.filters.page, limit: this.filters.limit, sort: this.filters.sort, direction: this.filters.direction }
          ;['q', 'enabled', 'category_id', 'event_type', 'reward_type', 'reward'].forEach(key => { if (this.filters[key] !== '') params[key] = this.filters[key] })
          const response = await SpireApi.v1().get('/achievement-editor/definitions', { params })
          const payload = response.data || {}
          this.definitions = Array.isArray(payload) ? payload : (payload.data || [])
          this.totalDefinitions = Number(payload.total === undefined ? this.definitions.length : payload.total)
          if (payload.page) this.filters.page = Number(payload.page)
        } catch (error) {
          this.directoryError = this.errorMessage(error, 'Definition directory could not be loaded.')
        } finally {
          this.directoryLoading = false
        }
      },
      async selectDefinition (id: number) {
        if (this.dirty && !window.confirm('Discard unsaved changes and open another definition?')) return
        await this.loadDefinition(id)
      },
      async loadDefinition (id: number) {
        this.detailLoading = true
        this.detailError = ''
        this.saveMessage = ''
        try {
          const response = await SpireApi.v1().get('/achievement-editor/definition/' + Number(id))
          const payload = response.data || {}
          this.draft = normalizeDefinition(payload)
          this.selectedID = Number(this.draft.id)
          this.creating = false
          this.expectedVersion = Number(this.draft.version)
          this.expectedRevision = String(payload.revision || '')
          this.serverValidation = this.validationRows(payload.validation)
          this.serverValidationBaseline = definitionSnapshot(this.draft)
          this.auditReason = ''
          this.baseline = definitionSnapshot(this.draft)
          this.selectedTab = 'General'
        } catch (error) {
          this.draft = null
          this.detailError = this.errorMessage(error, 'Definition graph could not be loaded.')
        } finally {
          this.detailLoading = false
        }
      },
      createDefinition () {
        if (!this.contentReady) return
        if (this.dirty && !window.confirm('Discard unsaved changes and start a new definition?')) return
        this.draft = emptyDefinition(0)
        this.creating = true
        this.selectedID = 0
        this.expectedVersion = 0
        this.expectedRevision = ''
        this.serverValidation = []
        this.serverValidationBaseline = ''
        this.auditReason = ''
        this.baseline = definitionSnapshot(this.draft)
        this.selectedTab = 'General'
      },
      reloadDefinition () {
        if (!this.draft || !this.dirty || window.confirm('Reset every unsaved graph change?')) {
          if (this.creating) this.createDefinition()
          else if (this.selectedID) this.loadDefinition(this.selectedID)
        }
      },
      async saveDefinition () {
        if (!this.draft || !this.contentReady || this.saving || !this.dirty) return
        this.detailError = ''
        this.saveMessage = ''
        if (!this.auditReason.trim()) { this.detailError = 'An audit reason is required before saving.'; this.selectedTab = 'General'; return }
        if (this.validationErrors.length) { this.detailError = 'Resolve the blocking validation issues before saving.'; this.selectedTab = 'Validation'; return }
        this.saving = true
        try {
          const graph = normalizeDefinition(this.draft)
          if (this.creating) graph.enabled = false
          const body: any = { definition: graph, reason: this.auditReason.trim() }
          if (!this.creating) {
            body.expected_version = this.expectedVersion
            body.expected_revision = this.expectedRevision
          }
          const response = this.creating
            ? await SpireApi.v1().put('/achievement-editor/definition', body)
            : await SpireApi.v1().patch('/achievement-editor/definition/' + Number(this.selectedID), body)
          const payload = response.data || {}
          this.draft = normalizeDefinition(payload.definition || payload.graph || payload)
          this.selectedID = Number(this.draft.id)
          this.creating = false
          this.expectedVersion = Number(this.draft.version)
          this.expectedRevision = String(payload.revision || '')
          this.serverValidation = this.validationRows(payload.validation)
          this.serverValidationBaseline = definitionSnapshot(this.draft)
          this.baseline = definitionSnapshot(this.draft)
          this.auditReason = ''
          this.saveMessage = 'Definition graph saved transactionally.'
          await this.loadDirectory()
        } catch (error) {
          if (error && (error as any).response && (error as any).response.status === 409) this.conflictModal = true
          else {
            const payload = error && (error as any).response && (error as any).response.data
            if (payload && payload.validation) {
              this.serverValidation = this.validationRows(payload.validation)
              this.serverValidationBaseline = definitionSnapshot(this.draft)
            }
            this.detailError = this.errorMessage(error, 'Definition graph was not saved.')
          }
        } finally {
          this.saving = false
        }
      },
      addAssociation () { if (!this.atLimit('associations', this.draft.associations.length)) this.draft.associations.push({ category_id: 0, sequence: this.nextSequence(this.draft.associations), display_text: '' }) },
      addComponent () { if (!this.atLimit('components', this.draft.components.length)) this.draft.components.push(emptyComponent(this.nextSequence(this.draft.components))) },
      addCriterion (component: any) { if (!component.recovery_only && this.totalCriteria < this.limit('criteria')) component.criteria.push(emptyCriterion()) },
      addReward () { if (!this.atLimit('rewards', this.draft.rewards.length)) this.draft.rewards.push(emptyReward(this.nextSequence(this.draft.rewards))) },
      addRestriction () { if (!this.atLimit('requirements', this.draft.requirements.length)) this.draft.requirements.push({ restriction_id: 0, requires_completed: true }) },
      baselineDefinition (): any { try { return this.baseline ? JSON.parse(this.baseline) : emptyDefinition(0) } catch (error) { return emptyDefinition(0) } },
      componentPersisted (component: any): boolean { return this.baselineDefinition().components.some((row: any) => Number(row.component_type) === Number(component.component_type) && Number(row.component_id) === Number(component.component_id)) },
      recoveryLocked (component: any): boolean { return Boolean(component.recovery_only && component.recovery_action !== 'restore') },
      setRecoveryAction (component: any, action: string) {
        if (!component || !component.recovery_only || !['', 'restore', 'delete'].includes(action)) return
        if (action === 'delete' && component.recovery_action !== 'delete') {
          const count = Number(component.recovery_criteria_count || (component.criteria || []).length)
          if (!window.confirm(`Delete all ${count} orphan criterion row${count === 1 ? '' : 's'} when this graph is saved? This is a whole-group repair and cannot be partially applied.`)) return
        }
        this.$set(component, 'recovery_action', action)
      },
      rewardPersisted (reward: any): boolean { return !!reward.reward_id && this.baselineDefinition().rewards.some((row: any) => String(row.reward_id) === String(reward.reward_id)) },
      rewardCatalogProtected (reward: any, index: number): boolean {
        return Boolean(this.draft && this.draft.reward_set && this.draft.reward_set.shared && this.mappedOption(this.rewardKey(reward, index)))
      },
      rewardSetPersisted (): boolean { return !!this.baselineDefinition().reward_set },
      rewardOptionPersisted (option: any): boolean { const set = this.baselineDefinition().reward_set; return !!set && set.options.some((row: any) => Number(row.option_id) === Number(option.option_id)) },
      removeComponent (index: number) { if (!this.draft.components[index].recovery_only && !this.componentPersisted(this.draft.components[index])) this.draft.components.splice(index, 1) },
      removeRow (rows: any[], index: number) { rows.splice(index, 1) },
      removeReward (index: number) {
        if (this.rewardPersisted(this.draft.rewards[index])) return
        const id = this.rewardKey(this.draft.rewards[index], index)
        this.draft.rewards.splice(index, 1)
        if (this.draft.reward_set) {
          this.draft.reward_set.mappings = this.draft.reward_set.mappings.filter((row: any) => String(row.reward_id) !== id).map((row: any) => {
            const token = String(row.reward_id)
            if (token.charAt(0) !== '@') return row
            const oldIndex = Number(token.slice(1))
            return { ...row, reward_id: oldIndex > index ? '@' + (oldIndex - 1) : token }
          })
        }
      },
      enableRewardSet () { this.$set(this.draft, 'reward_set', { reward_set_id: 0, title: this.draft.name, enabled: false, source_enabled: false, shared: false, source_count: 1, options: [], mappings: [] }) },
      removeRewardSet () { if (!this.rewardSetPersisted() && window.confirm('Remove the selectable set and all option mappings? Canonical rewards will remain.')) this.$set(this.draft, 'reward_set', null) },
      addRewardOption () { if (this.draft.reward_set && !this.atLimit('options', this.draft.reward_set.options.length)) this.draft.reward_set.options.push(emptyRewardOption(this.nextNumericID(this.draft.reward_set.options, 'option_id'))) },
      removeRewardOption (index: number) {
        if (this.rewardOptionPersisted(this.draft.reward_set.options[index])) return
        const id = String(this.draft.reward_set.options[index].option_id)
        this.draft.reward_set.options.splice(index, 1)
        this.draft.reward_set.mappings = this.draft.reward_set.mappings.filter((row: any) => String(row.option_id) !== id)
      },
      mappedOption (rewardID: any): string {
        if (!this.draft.reward_set) return ''
        const mapping = this.draft.reward_set.mappings.find((row: any) => String(row.reward_id) === String(rewardID))
        return mapping ? String(mapping.option_id) : ''
      },
      rewardKey (reward: any, index: number): string { return String(reward.reward_id || ('@' + index)) },
      setRewardMapping (rewardID: any, event: any) {
        if (!this.draft.reward_set) return
        this.draft.reward_set.mappings = this.draft.reward_set.mappings.filter((row: any) => String(row.reward_id) !== String(rewardID))
        if (event.target.value !== '') {
          const token = String(rewardID)
          const reward = token.charAt(0) === '@' ? this.draft.rewards[Number(token.slice(1))] : this.draft.rewards.find((row: any) => String(row.reward_id) === token)
          this.draft.reward_set.mappings.push({ option_id: Number(event.target.value), sequence: Number(reward && reward.sequence) || 0, reward_id: token })
        }
      },
      optionGrantLabels (optionID: any): string[] {
        if (!this.draft.reward_set) return []
        return this.draft.reward_set.mappings.filter((row: any) => String(row.option_id) === String(optionID)).map((row: any) => {
          const token = String(row.reward_id)
          const reward = token.charAt(0) === '@' ? this.draft.rewards[Number(token.slice(1))] : this.draft.rewards.find((grant: any) => String(grant.reward_id) === token)
          const identity = token.charAt(0) === '@' ? 'new grant ' + (Number(token.slice(1)) + 1) : '#' + token
          return identity + (reward && !reward.enabled ? ' (disabled)' : '')
        })
      },
      nextSequence (rows: any[]): number { return rows.length ? Math.max.apply(null, rows.map(row => Number(row.sequence) || 0)) + 1 : 1 },
      nextNumericID (rows: any[], key: string): number { return rows.length ? Math.max.apply(null, rows.map(row => Number(row[key]) || 0)) + 1 : 1 },
      rewardLookup (reward: any): string { return ({ 0: 'item', 4: 'currency', 5: 'title-set' } as any)[Number(reward.reward_type)] || '' },
      rewardDataHelp (reward: any): string { return this.selectedHelp('reward_types', reward.reward_type) || this.field('rewards', 'reward_data_id').help },
      coerceCriterion (criterion: any) {
        const modes = this.progressModes(criterion)
        if (!modes.some(row => Number(row.value) === Number(criterion.progress_mode))) criterion.progress_mode = Number(modes[0] ? modes[0].value : 0)
        if ([0, 1, 10].includes(Number(criterion.event_type))) { criterion.target_id = 0; criterion.target_id2 = 0 } else if (![7, 12, 13].includes(Number(criterion.event_type))) criterion.target_id2 = 0
      },
      npcCanonical (componentIndex: number, criterionIndex: number): string { return canonicalizeNpcName(this.npcNames[componentIndex + ':' + criterionIndex] || '') },
      npcHash (componentIndex: number, criterionIndex: number): number { return npcNameHash(this.npcNames[componentIndex + ':' + criterionIndex] || '') },
      setNpcName (componentIndex: number, criterionIndex: number, event: any) { this.$set(this.npcNames, componentIndex + ':' + criterionIndex, event.target.value) },
      applyNpcHash (criterion: any, componentIndex: number, criterionIndex: number) { criterion.target_id = this.npcHash(componentIndex, criterionIndex) },
      openClone () { this.cloneForm = { new_id: 0, name: this.draft.name + ' (Copy)', reason: '', confirmation: '' }; this.cloneModal = true },
      async cloneDefinition () {
        if (this.cloneForm.confirmation !== this.clonePhrase || !this.cloneForm.reason || this.cloneWorking) return
        this.cloneWorking = true
        try {
          const response = await SpireApi.v1().put('/achievement-editor/definition/' + Number(this.selectedID) + '/clone', {
            new_id: Number(this.cloneForm.new_id),
            name: this.cloneForm.name,
            reason: this.cloneForm.reason,
            confirmation: this.cloneForm.confirmation,
            expected_revision: this.expectedRevision
          })
          this.cloneModal = false
          const payload = response.data || {}
          const cloned = normalizeDefinition(payload)
          await this.loadDirectory()
          await this.loadDefinition(cloned.id || this.cloneForm.new_id)
        } catch (error) { this.detailError = this.errorMessage(error, 'Definition could not be cloned.'); this.cloneModal = false } finally { this.cloneWorking = false }
      },
      openDelete () { this.deleteForm = { reason: '', confirmation: '' }; this.deleteModal = true },
      async deleteDefinition () {
        if (this.deleteForm.confirmation !== this.deletePhrase || !this.deleteForm.reason || this.deleteWorking) return
        this.deleteWorking = true
        try {
          await SpireApi.v1().delete('/achievement-editor/definition/' + Number(this.selectedID), { data: { ...this.deleteForm, expected_revision: this.expectedRevision } })
          this.deleteModal = false
          this.draft = null
          this.selectedID = 0
          this.baseline = ''
          await this.loadDirectory()
        } catch (error) { this.detailError = this.errorMessage(error, 'Definition could not be deleted.'); this.deleteModal = false } finally { this.deleteWorking = false }
      },
      createCategory () {
        if (this.categoryDirty && !window.confirm('Discard unsaved category changes?')) return
        this.categoryDraft = { id: 0, parent_id: 0, sequence: 1, name: '', description: '', icon: '' }
        this.categoryBaseline = JSON.stringify(this.categoryDraft)
        this.categoryExpectedParent = 0
        this.categoryExpectedRevision = ''
        this.categoryCreating = true
        this.categoryReason = ''
        this.categoryError = ''
      },
      async selectCategory (id: number) {
        if (this.categoryDirty && !window.confirm('Discard unsaved category changes?')) return
        this.categoryError = ''
        try {
          const response = await SpireApi.v1().get('/achievement-editor/category/' + Number(id))
          const payload = response.data && response.data.category ? response.data.category : response.data
          this.categoryDraft = { id: Number(payload.id), parent_id: Number(payload.parent_id || 0), sequence: Number(payload.sequence || 0), name: String(payload.name || ''), description: String(payload.description || ''), icon: String(payload.icon || '') }
          this.categoryBaseline = JSON.stringify(this.categoryDraft)
          this.categoryExpectedParent = Number(this.categoryDraft.parent_id || 0)
          this.categoryExpectedRevision = String((response.data && response.data.revision) || '')
          this.categoryCreating = false
          this.categoryReason = ''
        } catch (error) { this.categoryError = this.errorMessage(error, 'Category could not be loaded.') }
      },
      async saveCategory () {
        if (!this.categoryDraft || !this.categoryDirty || !this.contentReady || this.categorySaving) return
        if (!this.categoryReason.trim()) { this.categoryError = 'An audit reason is required before saving.'; return }
        if (Number(this.categoryDraft.id) <= 0 || !this.categoryDraft.name.trim()) { this.categoryError = 'Category ID and name are required.'; return }
        if (new Blob([String(this.categoryDraft.description || '')]).size > 65535) { this.categoryError = 'Category description exceeds the 65,535-byte UTF-8 TEXT limit.'; return }
        if (Number(this.categoryDraft.id) === Number(this.categoryDraft.parent_id)) { this.categoryError = 'A category cannot be its own parent.'; return }
        this.categorySaving = true
        try {
          const body: any = { category: deepClone(this.categoryDraft), reason: this.categoryReason.trim() }
          if (!this.categoryCreating) {
            body.expected_parent_id = this.categoryExpectedParent
            body.expected_revision = this.categoryExpectedRevision
          }
          const response = this.categoryCreating
            ? await SpireApi.v1().put('/achievement-editor/category', body)
            : await SpireApi.v1().patch('/achievement-editor/category/' + Number(this.categoryDraft.id), body)
          const payload = response.data && response.data.category ? response.data.category : response.data
          this.categoryDraft = { ...this.categoryDraft, ...(payload || {}) }
          this.categoryBaseline = JSON.stringify(this.categoryDraft)
          this.categoryExpectedParent = Number(this.categoryDraft.parent_id || 0)
          this.categoryExpectedRevision = String((response.data && response.data.revision) || '')
          this.categoryCreating = false
          this.categoryReason = ''
          await this.reloadCategories()
        } catch (error) {
          if (error && (error as any).response && (error as any).response.status === 409) this.categoryError = 'This category changed on the server. Reload it before retrying.'
          else this.categoryError = this.errorMessage(error, 'Category was not saved.')
        } finally { this.categorySaving = false }
      },
      async reloadCategories () {
        const response = await SpireApi.v1().get('/achievement-editor/categories', { params: { page: 1, limit: 500, sort: 'sequence', direction: 'asc' } })
        const payload = response.data || {}
        this.categories = Array.isArray(payload) ? payload : (payload.data || [])
      },
      openCategoryDelete () { this.categoryDeleteForm = { reason: '', confirmation: '' }; this.categoryDeleteModal = true },
      async deleteCategory () {
        if (!this.categoryDraft || this.categoryDeleting || !this.categoryDeleteForm.reason || this.categoryDeleteForm.confirmation !== this.categoryDeletePhrase) return
        this.categoryDeleting = true
        try {
          await SpireApi.v1().delete('/achievement-editor/category/' + Number(this.categoryDraft.id), { data: { ...this.categoryDeleteForm, expected_revision: this.categoryExpectedRevision } })
          this.categoryDeleteModal = false
          this.categoryDraft = null
          this.categoryBaseline = ''
          await this.reloadCategories()
        } catch (error) { this.categoryError = this.errorMessage(error, 'Category could not be deleted.'); this.categoryDeleteModal = false } finally { this.categoryDeleting = false }
      },
      errorMessage (error: any, fallback: string): string {
        const data = error && error.response && error.response.data
        if (data && Array.isArray(data.errors)) return data.errors.map((row: any) => row.message || row).join(' ')
        return (data && (data.message || data.error)) || fallback
      },
      validationRows (validation: any): any[] {
        if (Array.isArray(validation)) return validation
        return (validation && (validation.findings || validation.issues || validation.errors)) || []
      }
    }
  })
</script>

<style src="../../assets/css/achievement-editor.css"></style>
