<template>
  <content-area class="alternate-currency-editor-page">
    <div class="currency-toolbar">
      <div>
        <div class="currency-kicker">Content tools · items</div>
        <h1 class="currency-title">
          <i class="fa fa-money mr-2"></i>Alternate Currency Editor
        </h1>
        <p class="currency-subtitle">
          Manage token items, content usage, player balances, and every safe follow-on action in one workspace.
        </p>
      </div>
      <div class="workspace-summary" aria-label="Alternate currency directory summary">
        <span><strong>{{ totalRows.toLocaleString() }}</strong> currencies</span>
        <span class="workspace-summary__divider"></span>
        <span v-if="editModel">
          <i class="fa fa-link mr-1"></i>{{ totalReferences.toLocaleString() }} usages
        </span>
        <span v-else><i class="fa fa-database mr-1"></i>Real EQEmu data</span>
      </div>
    </div>

    <div class="currency-workspace">
      <aside class="currency-directory">
        <eq-window title="Alternate Currencies">
          <div class="directory-controls">
            <div class="directory-search">
              <i class="fa fa-search"></i>
              <input
                id="alternate-currency-directory-search"
                v-model.trim="search"
                class="form-control form-control-sm"
                placeholder="Search item name or ID…"
                @input="queueDirectorySearch"
                @keyup.enter="loadDirectory(1)"
              >
              <button
                v-if="search"
                class="directory-clear"
                type="button"
                aria-label="Clear search"
                @click="clearDirectorySearch"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <b-button
              size="sm"
              variant="outline-warning"
              class="directory-new"
              data-testid="alternate-currency-new"
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

          <transition-group
            name="currency-row"
            tag="div"
            class="directory-list"
            data-testid="alternate-currency-directory"
          >
            <button
              v-for="record in directory"
              :key="'alternate-currency-' + record.id"
              class="directory-row"
              :class="{ active: selectedId === record.id && !isCreating }"
              type="button"
              @click="selectRecord(record.id)"
            >
              <span class="directory-row__icon">
                <span v-if="record.item_icon" :class="'item-' + record.item_icon + '-sm'"></span>
                <i v-else class="fa fa-money"></i>
              </span>
              <span class="directory-row__body">
                <span class="directory-row__name">{{ record.item_name || "Unknown token" }}</span>
                <span class="directory-row__detail">
                  Item #{{ record.item_id }}
                  <template v-if="record.task_count || record.npc_count || record.balance_count">
                    · {{ Number(record.task_count || 0) + Number(record.npc_count || 0) + Number(record.balance_count || 0) }} usages
                  </template>
                </span>
              </span>
              <span class="directory-row__aside">#{{ record.id }}</span>
            </button>

            <div v-if="loadingDirectory && !directory.length" key="loading" class="directory-state">
              <i class="fa fa-spinner fa-spin"></i>
              <span>Loading alternate currencies…</span>
            </div>
            <div v-else-if="!directory.length" key="empty" class="directory-state">
              <i class="fa fa-search"></i>
              <span>No matching currencies</span>
              <button class="btn btn-sm btn-outline-warning mt-2" type="button" @click="createDraft">
                Create a currency
              </button>
            </div>
          </transition-group>

          <nav
            v-if="totalRows > pageSize"
            class="directory-pagination"
            aria-label="Alternate currency directory pages"
          >
            <button
              type="button"
              aria-label="Previous page"
              :disabled="currentPage <= 1 || loadingDirectory"
              @click="goToPage(currentPage - 1)"
            >
              <i class="fa fa-angle-left"></i>
            </button>
            <span><strong>{{ currentPage }}</strong> / {{ totalPages }}</span>
            <button
              type="button"
              aria-label="Next page"
              :disabled="currentPage >= totalPages || loadingDirectory"
              @click="goToPage(currentPage + 1)"
            >
              <i class="fa fa-angle-right"></i>
            </button>
          </nav>
        </eq-window>
      </aside>

      <main class="currency-inspector">
        <eq-window v-if="!editModel && !loadingDetail" title="Currency Workspace">
          <div class="editor-empty">
            <div class="editor-empty__sigil"><i class="fa fa-money"></i></div>
            <h3>Select an alternate currency</h3>
            <p>Configure its token item, inspect every usage, and administer balances without leaving this editor.</p>
            <b-button variant="outline-warning" size="sm" @click="createDraft">
              <i class="fa fa-plus mr-1"></i>Create new
            </b-button>
          </div>
        </eq-window>

        <eq-window v-if="loadingDetail" title="Currency Workspace">
          <div class="editor-empty">
            <div class="editor-empty__sigil"><i class="fa fa-spinner fa-spin"></i></div>
            <h3>Loading currency context…</h3>
          </div>
        </eq-window>

        <div v-if="editModel && !loadingDetail" data-testid="alternate-currency-inspector">
          <eq-window title="Alternate Currency" class="editor-header-window">
            <div class="editor-header">
              <div class="editor-identity">
                <span class="editor-identity__icon">
                  <span v-if="selectedItem.icon" :class="'item-' + selectedItem.icon"></span>
                  <i v-else class="fa fa-money"></i>
                </span>
                <div>
                  <div class="editor-identity__eyebrow">
                    {{ isCreating ? "New alternate currency" : "Currency #" + editModel.id }}
                    <span v-if="hasUnsavedChanges" class="unsaved-pill">
                      <i class="fa fa-circle"></i> Unsaved
                    </span>
                  </div>
                  <h2>{{ selectedItem.name || "Choose a token item" }}</h2>
                  <p>
                    {{ selectedItem.id ? "Token item #" + selectedItem.id : "No token selected" }}
                    <template v-if="!isCreating">
                      · {{ totalReferences.toLocaleString() }} usages
                      · {{ Number(usage.total_balance || 0).toLocaleString() }} held
                    </template>
                  </p>
                </div>
              </div>
              <div class="editor-actions">
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-warning"
                  title="Copy this currency into a new draft"
                  data-testid="alternate-currency-copy"
                  @click="copyCurrency"
                >
                  <i class="fa fa-copy mr-1"></i>Copy
                </b-button>
                <b-button
                  v-if="!isCreating"
                  size="sm"
                  variant="outline-danger"
                  :disabled="saving || resolving"
                  data-testid="alternate-currency-delete"
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
                  data-testid="alternate-currency-save"
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
                    <h3>Token identity and recognition</h3>
                  </div>
                  <span class="section-help">The token item is the currency players see and recognize in-game.</span>
                </div>

                <div class="overview-grid">
                  <section class="configuration-panel">
                    <div class="form-row-grid">
                      <div class="form-group">
                        <label for="alternate-currency-id">Currency ID</label>
                        <input
                          id="alternate-currency-id"
                          :value="editModel.id || 'Assigned on save'"
                          class="form-control form-control-sm"
                          disabled
                        >
                        <small>Stable EQEmu identifier. New currencies receive the first available ID.</small>
                      </div>
                      <div class="form-group">
                        <label for="alternate-currency-item-id">Token item</label>
                        <input
                          id="alternate-currency-item-id"
                          :value="editModel.item_id || 'Not selected'"
                          class="form-control form-control-sm"
                          disabled
                        >
                        <small>Each token item can belong to only one alternate currency.</small>
                      </div>
                    </div>

                    <div class="token-card" :class="{ empty: !selectedItem.id }">
                      <span class="token-card__icon">
                        <span v-if="selectedItem.icon" :class="'item-' + selectedItem.icon"></span>
                        <i v-else class="fa fa-question"></i>
                      </span>
                      <div class="token-card__body">
                        <span class="section-kicker">Selected token</span>
                        <h4>{{ selectedItem.name || "No item selected" }}</h4>
                        <p v-if="selectedItem.id">Item #{{ selectedItem.id }} · icon {{ selectedItem.icon || 0 }}</p>
                        <p v-else>Search below to choose the item players will hold and spend.</p>
                      </div>
                      <router-link
                        v-if="selectedItem.id"
                        :to="'/item/' + selectedItem.id"
                        class="btn btn-sm btn-outline-warning"
                        title="Open this token in the Item Editor"
                      >
                        <i class="fa fa-external-link mr-1"></i>Item Editor
                      </router-link>
                    </div>

                    <div class="item-picker">
                      <label for="alternate-currency-item-search">
                        {{ selectedItem.id ? "Change token item" : "Find a token item" }}
                      </label>
                      <div class="item-picker__search">
                        <i class="fa fa-search"></i>
                        <input
                          id="alternate-currency-item-search"
                          v-model.trim="itemSearch"
                          class="form-control form-control-sm"
                          placeholder="Type at least 2 characters or an exact item ID…"
                          autocomplete="off"
                          data-testid="alternate-currency-item-search"
                          @input="queueItemSearch"
                        >
                        <i v-if="loadingItems" class="fa fa-spinner fa-spin item-picker__spinner"></i>
                      </div>
                      <div v-if="itemSearch.length >= 2" class="item-results" data-testid="alternate-currency-item-results">
                        <button
                          v-for="item in itemResults"
                          :key="'token-item-' + item.id"
                          type="button"
                          :class="{ active: Number(editModel.item_id) === Number(item.id) }"
                          :disabled="itemUnavailable(item)"
                          @click="selectItem(item)"
                        >
                          <span class="item-results__icon">
                            <span v-if="item.icon" :class="'item-' + item.icon + '-sm'"></span>
                            <i v-else class="fa fa-cube"></i>
                          </span>
                          <span>
                            <strong>{{ item.name }}</strong>
                            <small v-if="itemUnavailable(item)">
                              Item #{{ item.id }} · used by currency #{{ item.assigned_currency_id }}
                            </small>
                            <small v-else>Item #{{ item.id }} · icon {{ item.icon || 0 }}</small>
                          </span>
                          <i
                            class="fa"
                            :class="itemUnavailable(item)
                              ? 'fa-lock'
                              : (Number(editModel.item_id) === Number(item.id) ? 'fa-check' : 'fa-chevron-right')"
                          ></i>
                        </button>
                        <div v-if="!loadingItems && !itemResults.length" class="item-results__empty">
                          No matching items
                        </div>
                      </div>
                    </div>

                    <div v-if="isCreating && selectedItem.id && copiedFromId" class="copy-notice">
                      <i class="fa fa-copy"></i>
                      <span>
                        Copied from currency #{{ copiedFromId }}. Choose a different token item before creating it.
                      </span>
                    </div>
                  </section>

                  <aside class="recognition-panel">
                    <span class="section-kicker">At a glance</span>
                    <h3>{{ selectedItem.name || "Currency preview" }}</h3>
                    <div class="recognition-icon">
                      <span v-if="selectedItem.icon" :class="'item-' + selectedItem.icon"></span>
                      <i v-else class="fa fa-money"></i>
                    </div>
                    <dl>
                      <div><dt>Currency ID</dt><dd>{{ editModel.id || "New" }}</dd></div>
                      <div><dt>Token item</dt><dd>{{ selectedItem.id || "—" }}</dd></div>
                      <div><dt>NPC merchants</dt><dd>{{ usage.npc_count || 0 }}</dd></div>
                      <div><dt>Task rewards</dt><dd>{{ usage.task_count || 0 }}</dd></div>
                      <div><dt>Player balances</dt><dd>{{ usage.balance_count || 0 }}</dd></div>
                    </dl>
                    <p>
                      Token imagery is drawn from Spire’s existing EQ item assets so operators can verify identity
                      without memorizing database IDs.
                    </p>
                  </aside>
                </div>
              </eq-tab>

              <eq-tab name="Usage & Safety" :selected="selectedTab === 'Usage & Safety'">
                <div class="editor-section-heading">
                  <div>
                    <span class="section-kicker">Dependencies</span>
                    <h3>Content usage and safe follow-on actions</h3>
                  </div>
                  <span class="section-help">NPC merchant, task reward, and player-balance references are live database data.</span>
                </div>

                <div v-if="isCreating" class="tab-empty">
                  <i class="fa fa-info-circle"></i>Save this currency before inspecting usage.
                </div>
                <template v-else>
                  <div class="usage-metrics">
                    <button type="button" :class="{ active: usageKind === 'npcs' }" @click="selectUsageKind('npcs')">
                      <span>NPC merchants</span><strong>{{ usage.npc_count || 0 }}</strong><small>npc_types.alt_currency_id</small>
                    </button>
                    <button type="button" :class="{ active: usageKind === 'tasks' }" @click="selectUsageKind('tasks')">
                      <span>Task rewards</span><strong>{{ usage.task_count || 0 }}</strong><small>tasks.reward_point_type</small>
                    </button>
                    <button type="button" :class="{ active: usageKind === 'balances' }" @click="selectUsageKind('balances')">
                      <span>Player balances</span><strong>{{ usage.balance_count || 0 }}</strong><small>{{ Number(usage.total_balance || 0).toLocaleString() }} total held</small>
                    </button>
                  </div>

                  <div class="usage-browser">
                    <div class="usage-browser__toolbar">
                      <div>
                        <strong>{{ usageKindLabel }}</strong>
                        <span>{{ usageTotal.toLocaleString() }} {{ usageTotal === 1 ? "record" : "records" }}</span>
                      </div>
                      <div class="inline-search">
                        <i class="fa fa-search"></i>
                        <input
                          v-model.trim="usageSearch"
                          class="form-control form-control-sm"
                          :placeholder="'Search ' + usageKindLabel.toLowerCase() + '…'"
                          @input="queueUsageSearch"
                        >
                      </div>
                    </div>

                    <div v-if="loadingUsage" class="usage-loading">
                      <i class="fa fa-spinner fa-spin"></i>Loading live usage…
                    </div>
                    <div v-else-if="!usageRows.length" class="usage-clear">
                      <i class="fa fa-check"></i>
                      <span>No {{ usageKindLabel.toLowerCase() }} use this currency.</span>
                    </div>
                    <div v-else class="usage-list">
                      <button
                        v-for="row in usageKind === 'balances' ? usageRows : []"
                        :key="'balance-usage-' + usageRowKey(row)"
                        type="button"
                        class="usage-row"
                        @click="openBalanceAdjustment(row)"
                      >
                        <span class="usage-row__icon"><i class="fa" :class="usageKindIcon"></i></span>
                        <span class="usage-row__body">
                          <strong>{{ usageRowTitle(row) }}</strong>
                          <small>{{ usageRowContext(row) }}</small>
                        </span>
                        <span class="usage-row__value">{{ usageRowValue(row) }}</span>
                        <i class="fa fa-edit"></i>
                      </button>
                      <router-link
                        v-for="row in usageKind !== 'balances' ? usageRows : []"
                        :key="usageKind + '-' + usageRowKey(row)"
                        :to="usageRowLink(row)"
                        class="usage-row"
                      >
                        <span class="usage-row__icon"><i class="fa" :class="usageKindIcon"></i></span>
                        <span class="usage-row__body">
                          <strong>{{ usageRowTitle(row) }}</strong>
                          <small>{{ usageRowContext(row) }}</small>
                        </span>
                        <span class="usage-row__value">{{ usageRowValue(row) }}</span>
                        <i class="fa fa-chevron-right"></i>
                      </router-link>
                    </div>

                    <div v-if="usageTotal > usagePageSize" class="usage-pagination">
                      <button :disabled="usagePage <= 1" type="button" @click="loadUsage(usagePage - 1)">
                        <i class="fa fa-angle-left"></i>
                      </button>
                      <span>Page {{ usagePage }} / {{ usageTotalPages }}</span>
                      <button :disabled="usagePage >= usageTotalPages" type="button" @click="loadUsage(usagePage + 1)">
                        <i class="fa fa-angle-right"></i>
                      </button>
                    </div>
                  </div>

                  <div class="resolution-panel" :class="{ clear: totalReferences === 0 }">
                    <div class="resolution-panel__copy">
                      <span class="section-kicker">Safe deletion</span>
                      <h4>{{ totalReferences ? "Resolve every usage before deletion" : "No unresolved usages" }}</h4>
                      <p v-if="totalReferences">
                        Replacement updates NPCs, tasks, and player balances in one transaction. Balance collisions
                        are merged only when the result fits the database range.
                      </p>
                      <p v-else>This currency can be deleted without leaving dangling content or player data.</p>
                    </div>
                    <div class="resolution-panel__actions">
                      <b-button
                        v-if="totalReferences"
                        variant="outline-warning"
                        size="sm"
                        data-testid="alternate-currency-replace"
                        @click="openResolution('replace')"
                      >
                        <i class="fa fa-random mr-1"></i>Replace usages…
                      </b-button>
                      <b-button
                        v-if="totalReferences"
                        variant="outline-danger"
                        size="sm"
                        data-testid="alternate-currency-remove"
                        @click="openResolution('remove')"
                      >
                        <i class="fa fa-eraser mr-1"></i>Remove usages…
                      </b-button>
                      <b-button v-else variant="outline-danger" size="sm" @click="requestDelete">
                        <i class="fa fa-trash mr-1"></i>Delete currency
                      </b-button>
                    </div>
                  </div>
                </template>
              </eq-tab>

              <eq-tab name="Balances" :selected="selectedTab === 'Balances'">
                <div class="editor-section-heading">
                  <div>
                    <span class="section-kicker">Player administration</span>
                    <h3>Audited character balances</h3>
                  </div>
                  <span class="section-help">Every change requires a reason, an exact confirmation, and a matching expected balance.</span>
                </div>

                <div v-if="isCreating" class="tab-empty">
                  <i class="fa fa-info-circle"></i>Save this currency before administering balances.
                </div>
                <template v-else>
                  <div class="balance-summary">
                    <div>
                      <span>Characters holding currency</span>
                      <strong>{{ Number(usage.balance_count || 0).toLocaleString() }}</strong>
                    </div>
                    <div>
                      <span>Total held</span>
                      <strong>{{ Number(usage.total_balance || 0).toLocaleString() }}</strong>
                    </div>
                    <div class="balance-summary__token">
                      <span v-if="selectedItem.icon" :class="'item-' + selectedItem.icon + '-sm'"></span>
                      <span>{{ selectedItem.name }}</span>
                    </div>
                  </div>

                  <div class="balance-tools">
                    <div class="character-picker">
                      <label for="alternate-currency-character-search">Add or find a character</label>
                      <div class="item-picker__search">
                        <i class="fa fa-search"></i>
                        <input
                          id="alternate-currency-character-search"
                          v-model.trim="characterSearch"
                          class="form-control form-control-sm"
                          placeholder="Character name or exact ID…"
                          autocomplete="off"
                          data-testid="alternate-currency-character-search"
                          @input="queueCharacterSearch"
                        >
                        <i v-if="loadingCharacters" class="fa fa-spinner fa-spin item-picker__spinner"></i>
                      </div>
                      <div v-if="characterSearch.length >= 2" class="character-results">
                        <button
                          v-for="character in characterResults"
                          :key="'character-' + character.character_id"
                          type="button"
                          @click="openBalanceAdjustment(character)"
                        >
                          <span class="character-avatar">{{ characterInitial(character.character_name) }}</span>
                          <span>
                            <strong>{{ character.character_name }}</strong>
                            <small>
                              #{{ character.character_id }} · level {{ character.level }}
                              {{ className(character.class) }} · {{ Number(character.amount || 0).toLocaleString() }} held
                            </small>
                          </span>
                          <i class="fa fa-edit"></i>
                        </button>
                        <div v-if="!loadingCharacters && !characterResults.length" class="item-results__empty">
                          No matching characters
                        </div>
                      </div>
                    </div>

                    <div class="inline-search balance-filter">
                      <i class="fa fa-filter"></i>
                      <input
                        v-model.trim="usageSearch"
                        class="form-control form-control-sm"
                        placeholder="Filter current balances…"
                        @input="queueUsageSearch"
                      >
                    </div>
                  </div>

                  <div class="balance-table-wrap">
                    <table class="balance-table" data-testid="alternate-currency-balance-table">
                      <thead>
                        <tr>
                          <th>Character</th>
                          <th>Level / class</th>
                          <th class="text-right">Balance</th>
                          <th class="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="loadingUsage">
                          <td colspan="4" class="balance-table__empty">
                            <i class="fa fa-spinner fa-spin mr-1"></i>Loading balances…
                          </td>
                        </tr>
                        <tr v-else-if="!balanceRows.length">
                          <td colspan="4" class="balance-table__empty">
                            No character balances match this view.
                          </td>
                        </tr>
                        <tr v-for="row in balanceRows" :key="'balance-' + row.character_id">
                          <td>
                            <span class="character-avatar">{{ characterInitial(row.character_name) }}</span>
                            <span><strong>{{ row.character_name }}</strong><small>#{{ row.character_id }}</small></span>
                          </td>
                          <td>Level {{ row.level }} · {{ className(row.class) }}</td>
                          <td class="text-right balance-amount">{{ Number(row.amount || 0).toLocaleString() }}</td>
                          <td class="text-right">
                            <button
                              class="btn btn-sm btn-outline-warning icon-action"
                              type="button"
                              :aria-label="'Adjust ' + row.character_name + ' balance'"
                              title="Adjust balance"
                              @click="openBalanceAdjustment(row)"
                            >
                              <i class="fa fa-edit"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div v-if="usageTotal > usagePageSize" class="usage-pagination">
                      <button :disabled="usagePage <= 1" type="button" @click="loadUsage(usagePage - 1)">
                        <i class="fa fa-angle-left"></i>
                      </button>
                      <span>Page {{ usagePage }} / {{ usageTotalPages }}</span>
                      <button :disabled="usagePage >= usageTotalPages" type="button" @click="loadUsage(usagePage + 1)">
                        <i class="fa fa-angle-right"></i>
                      </button>
                    </div>
                  </div>
                </template>
              </eq-tab>

              <eq-tab name="Audit Trail" :selected="selectedTab === 'Audit Trail'">
                <div class="editor-section-heading">
                  <div>
                    <span class="section-kicker">Traceability</span>
                    <h3>Definition and balance change history</h3>
                  </div>
                  <span class="section-help">Audit entries include the operator, operation, before/after values, and reason.</span>
                </div>

                <div v-if="isCreating" class="tab-empty">
                  <i class="fa fa-info-circle"></i>Audit history begins after this currency is created.
                </div>
                <div v-else-if="loadingAudit" class="tab-empty">
                  <i class="fa fa-spinner fa-spin"></i>Loading audit trail…
                </div>
                <div v-else-if="!auditEntries.length" class="tab-empty">
                  <i class="fa fa-history"></i>No recorded editor changes for this currency yet.
                </div>
                <div v-else class="audit-timeline" data-testid="alternate-currency-audit">
                  <article v-for="entry in auditEntries" :key="'audit-' + entry.id">
                    <span class="audit-timeline__marker"><i class="fa" :class="auditIcon(entry)"></i></span>
                    <div class="audit-timeline__content">
                      <header>
                        <div>
                          <strong>{{ auditTitle(entry) }}</strong>
                          <span>#{{ entry.id }}</span>
                        </div>
                        <time>{{ formatDate(entry.created_at) }}</time>
                      </header>
                      <p>{{ auditSummary(entry) }}</p>
                      <footer>
                        <span><i class="fa fa-user mr-1"></i>{{ entry.user_name || "Local operator" }}</span>
                        <span v-if="entry.data && entry.data.reason">
                          <i class="fa fa-comment mr-1"></i>{{ entry.data.reason }}
                        </span>
                      </footer>
                    </div>
                  </article>
                </div>
              </eq-tab>
            </eq-tabs>
          </eq-window>
        </div>
      </main>
    </div>

    <b-modal
      id="alternate-currency-balance-modal"
      ref="balanceModal"
      title="Adjust character balance"
      centered
      hide-footer
      @hidden="resetBalanceAdjustment"
    >
      <div v-if="balanceCharacter" class="balance-modal">
        <div class="balance-modal__identity">
          <span class="character-avatar">{{ characterInitial(balanceCharacter.character_name) }}</span>
          <div>
            <strong>{{ balanceCharacter.character_name }}</strong>
            <span>#{{ balanceCharacter.character_id }} · current {{ Number(balanceCharacter.amount || 0).toLocaleString() }}</span>
          </div>
          <span v-if="selectedItem.icon" :class="'item-' + selectedItem.icon + '-sm'"></span>
        </div>

        <label>Operation</label>
        <div class="operation-toggle" role="group" aria-label="Balance operation">
          <button
            v-for="operation in balanceOperations"
            :key="operation.value"
            type="button"
            :class="{ active: balanceOperation === operation.value }"
            :aria-pressed="balanceOperation === operation.value ? 'true' : 'false'"
            @click="balanceOperation = operation.value"
          >
            <i class="fa" :class="operation.icon"></i>{{ operation.label }}
          </button>
        </div>

        <div class="form-group">
          <label for="alternate-currency-balance-amount">
            {{ balanceOperation === "set" ? "New balance" : "Adjustment amount" }}
          </label>
          <input
            id="alternate-currency-balance-amount"
            v-model.number="balanceAmount"
            class="form-control form-control-sm"
            type="number"
            min="0"
            max="4294967295"
            data-testid="alternate-currency-balance-amount"
          >
        </div>

        <div class="balance-preview" :class="{ invalid: balancePreview === null }">
          <span>Before<strong>{{ Number(balanceCharacter.amount || 0).toLocaleString() }}</strong></span>
          <i class="fa fa-long-arrow-right"></i>
          <span>After<strong>{{ balancePreview === null ? "Invalid" : Number(balancePreview).toLocaleString() }}</strong></span>
        </div>

        <div class="form-group">
          <label for="alternate-currency-balance-reason">Required audit reason</label>
          <textarea
            id="alternate-currency-balance-reason"
            v-model.trim="balanceReason"
            class="form-control form-control-sm"
            maxlength="240"
            rows="3"
            placeholder="Ticket, correction, award, or other operational reason…"
            data-testid="alternate-currency-balance-reason"
          ></textarea>
          <small>8–240 characters. This appears in the currency audit trail.</small>
        </div>

        <div class="form-group">
          <label for="alternate-currency-balance-confirmation">
            Type <code>{{ balanceCharacter.character_name }}</code> to confirm
          </label>
          <input
            id="alternate-currency-balance-confirmation"
            v-model="balanceConfirmation"
            class="form-control form-control-sm"
            autocomplete="off"
            data-testid="alternate-currency-balance-confirmation"
          >
        </div>

        <div class="modal-actions">
          <b-button variant="outline-secondary" size="sm" :disabled="savingBalance" @click="$refs.balanceModal.hide()">
            Cancel
          </b-button>
          <b-button
            variant="warning"
            size="sm"
            :disabled="!canAdjustBalance || savingBalance"
            data-testid="alternate-currency-balance-submit"
            @click="executeBalanceAdjustment"
          >
            <i class="fa mr-1" :class="savingBalance ? 'fa-spinner fa-spin' : 'fa-check'"></i>
            {{ savingBalance ? "Applying…" : "Apply audited change" }}
          </b-button>
        </div>
      </div>
    </b-modal>

    <b-modal
      id="alternate-currency-resolution-modal"
      ref="resolutionModal"
      :title="resolutionMode === 'replace' ? 'Replace usages and delete' : 'Remove usages and delete'"
      centered
      hide-footer
      @hidden="resetResolution"
    >
      <div class="resolution-modal">
        <div class="resolution-modal__summary">
          <i class="fa" :class="resolutionMode === 'replace' ? 'fa-random' : 'fa-exclamation-triangle'"></i>
          <p v-if="resolutionMode === 'replace'">
            NPCs, tasks, and player balances will move to the selected currency in one transaction. Matching
            character balances are merged safely.
          </p>
          <p v-else>
            NPC and task references will be cleared. Player balances are removed only with the explicit confirmation below.
          </p>
        </div>

        <div v-if="resolutionMode === 'replace'" class="form-group">
          <label for="alternate-currency-replacement">Replacement currency</label>
          <select
            id="alternate-currency-replacement"
            v-model.number="replacementId"
            class="form-control form-control-sm"
            data-testid="alternate-currency-replacement"
          >
            <option :value="0" disabled>Select a replacement currency</option>
            <option v-for="option in replacementOptions" :key="'replacement-' + option.id" :value="option.id">
              {{ option.item_name }} · currency #{{ option.id }} · item #{{ option.item_id }}
            </option>
          </select>
        </div>

        <label
          v-if="resolutionMode === 'remove' && Number(usage.balance_count || 0) > 0"
          class="danger-check"
        >
          <input v-model="deleteBalances" type="checkbox">
          <span>
            <strong>Delete {{ usage.balance_count }} player balance records</strong>
            <small>This cannot be recovered from Spire.</small>
          </span>
        </label>

        <div class="form-group">
          <label for="alternate-currency-resolution-reason">Required audit reason</label>
          <textarea
            id="alternate-currency-resolution-reason"
            v-model.trim="resolutionReason"
            class="form-control form-control-sm"
            maxlength="240"
            rows="3"
            placeholder="Why is this currency being retired or consolidated?"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="alternate-currency-resolution-confirmation">
            Type <code>{{ selectedItem.name }}</code> to confirm
          </label>
          <input
            id="alternate-currency-resolution-confirmation"
            v-model="resolutionConfirmation"
            class="form-control form-control-sm"
            autocomplete="off"
            data-testid="alternate-currency-resolution-confirmation"
          >
        </div>

        <div class="modal-actions">
          <b-button variant="outline-secondary" size="sm" :disabled="resolving" @click="$refs.resolutionModal.hide()">
            Cancel
          </b-button>
          <b-button
            :variant="resolutionMode === 'replace' ? 'warning' : 'danger'"
            size="sm"
            :disabled="!canResolve || resolving"
            data-testid="alternate-currency-resolve-submit"
            @click="executeResolution"
          >
            <i class="fa mr-1" :class="resolving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
            {{ resolving ? "Applying…" : (resolutionMode === "replace" ? "Replace and delete" : "Remove and delete") }}
          </b-button>
        </div>
      </div>
    </b-modal>

    <transition name="notification">
      <div
        v-if="notification"
        class="editor-notification"
        :class="'editor-notification--' + notification.type"
        role="status"
      >
        <i class="fa" :class="notification.type === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle'"></i>
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
  import { SpireApi } from '../../app/api/spire-api'
  import { DB_CLASSES } from '../../app/constants/eq-classes-constants'
  import { DB_RACE_NAMES } from '../../app/constants/eq-races-constants'

  function clone (value) {
    return JSON.parse(JSON.stringify(value))
  }

  function blankUsage () {
    return {
      npc_count: 0,
      task_count: 0,
      balance_count: 0,
      total_balance: 0,
      npc_samples: [],
      task_samples: [],
      balance_samples: []
    }
  }

  export default {
    name: 'AlternateCurrencyEditor',
    components: { ContentArea, EqWindow, EqTabs, EqTab },
    data () {
      return {
        search: '',
        directory: [],
        currencyOptions: [],
        totalRows: 0,
        currentPage: 1,
        pageSize: 30,
        loadingDirectory: false,
        loadingDetail: false,
        saving: false,
        resolving: false,
        selectedId: null,
        isCreating: false,
        copiedFromId: null,
        editModel: null,
        originalModel: null,
        selectedItem: { id: 0, name: '', icon: 0 },
        originalItem: { id: 0, name: '', icon: 0 },
        usage: blankUsage(),
        selectedTab: this.$route.query.tab || 'Overview',
        searchTimer: null,
        itemSearch: '',
        itemResults: [],
        itemSearchTimer: null,
        loadingItems: false,
        usageKind: 'tasks',
        usageRows: [],
        usageTotal: 0,
        usagePage: 1,
        usagePageSize: 20,
        usageSearch: '',
        usageSearchTimer: null,
        loadingUsage: false,
        characterSearch: '',
        characterResults: [],
        characterSearchTimer: null,
        loadingCharacters: false,
        balanceCharacter: null,
        balanceOperation: 'set',
        balanceAmount: 0,
        balanceReason: '',
        balanceConfirmation: '',
        balanceOperations: [
          { value: 'set', label: 'Set', icon: 'fa-pencil' },
          { value: 'add', label: 'Add', icon: 'fa-plus' },
          { value: 'subtract', label: 'Subtract', icon: 'fa-minus' }
        ],
        savingBalance: false,
        auditEntries: [],
        loadingAudit: false,
        resolutionMode: 'replace',
        replacementId: 0,
        deleteBalances: false,
        resolutionReason: '',
        resolutionConfirmation: '',
        notification: null,
        notificationTimer: null
      }
    },
    computed: {
      hasUnsavedChanges () {
        if (!this.editModel) return false
        return JSON.stringify(this.editModel) !== JSON.stringify(this.originalModel)
      },
      canSave () {
        if (!this.editModel || Number(this.editModel.item_id || 0) <= 0) return false
        if (this.isCreating && this.copiedFromId && Number(this.editModel.item_id) === Number(this.originalModel.item_id)) {
          return false
        }
        return true
      },
      totalPages () {
        return Math.max(1, Math.ceil(this.totalRows / this.pageSize))
      },
      totalReferences () {
        return Number(this.usage.npc_count || 0) +
          Number(this.usage.task_count || 0) +
          Number(this.usage.balance_count || 0)
      },
      usageTotalPages () {
        return Math.max(1, Math.ceil(this.usageTotal / this.usagePageSize))
      },
      balanceRows () {
        return this.usageKind === 'balances' ? this.usageRows : []
      },
      usageKindLabel () {
        return {
          npcs: 'NPC merchants',
          tasks: 'Task rewards',
          balances: 'Player balances'
        }[this.usageKind] || 'Usage'
      },
      usageKindIcon () {
        return {
          npcs: 'fa-user',
          tasks: 'fa-list-alt',
          balances: 'fa-money'
        }[this.usageKind] || 'fa-link'
      },
      replacementOptions () {
        return this.currencyOptions.filter(option => Number(option.id) !== Number(this.selectedId))
      },
      balancePreview () {
        if (!this.balanceCharacter) return null
        const current = Number(this.balanceCharacter.amount || 0)
        const amount = Number(this.balanceAmount)
        if (!Number.isFinite(amount) || amount < 0 || amount > 4294967295) return null
        if (this.balanceOperation === 'set') return Math.trunc(amount)
        if (amount <= 0) return null
        if (this.balanceOperation === 'add') {
          const result = current + Math.trunc(amount)
          return result <= 4294967295 ? result : null
        }
        if (this.balanceOperation === 'subtract') {
          const result = current - Math.trunc(amount)
          return result >= 0 ? result : null
        }
        return null
      },
      canAdjustBalance () {
        if (!this.balanceCharacter || this.balancePreview === null) return false
        if (this.balanceConfirmation !== this.balanceCharacter.character_name) return false
        return String(this.balanceReason || '').trim().length >= 8
      },
      canResolve () {
        if (!this.editModel || this.resolutionConfirmation !== this.selectedItem.name) return false
        if (String(this.resolutionReason || '').trim().length < 8) return false
        if (this.resolutionMode === 'replace') return Number(this.replacementId) > 0
        if (Number(this.usage.balance_count || 0) > 0) return this.deleteBalances
        return true
      }
    },
    created () {
      this.loadDirectory(1).then(() => {
        const routeId = Number(this.$route.query.currency || 0)
        if (routeId > 0) this.selectRecord(routeId, true)
      })
      this.loadCurrencyOptions()
    },
    mounted () {
      window.addEventListener('keydown', this.onEditorKeydown)
    },
    beforeDestroy () {
      window.clearTimeout(this.searchTimer)
      window.clearTimeout(this.itemSearchTimer)
      window.clearTimeout(this.usageSearchTimer)
      window.clearTimeout(this.characterSearchTimer)
      window.clearTimeout(this.notificationTimer)
      window.removeEventListener('keydown', this.onEditorKeydown)
    },
    beforeRouteLeave (to, from, next) {
      if (this.hasUnsavedChanges && !window.confirm('Discard unsaved alternate currency changes?')) {
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
          const response = await SpireApi.v1().get('/alternate-currency-editor/currencies', {
            params: { q: this.search, page: this.currentPage, limit: this.pageSize }
          })
          this.directory = response.data.data || []
          this.totalRows = Number(response.data.total || 0)
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to load alternate currencies'), 'error')
        } finally {
          this.loadingDirectory = false
        }
      },
      async loadCurrencyOptions () {
        try {
          const response = await SpireApi.v1().get('/alternate-currency-editor/currencies', {
            params: { lookup: 1 }
          })
          this.currencyOptions = response.data.data || []
        } catch (_) {
          this.currencyOptions = []
        }
      },
      queueDirectorySearch () {
        window.clearTimeout(this.searchTimer)
        this.searchTimer = window.setTimeout(() => this.loadDirectory(1), 260)
      },
      clearDirectorySearch () {
        this.search = ''
        this.loadDirectory(1)
      },
      goToPage (page) {
        const next = Math.min(this.totalPages, Math.max(1, Number(page) || 1))
        if (next !== this.currentPage && !this.loadingDirectory) this.loadDirectory(next)
      },
      async selectRecord (id, force = false) {
        if (!force && this.selectedId === Number(id) && !this.isCreating) return
        if (!force && !(await this.confirmDiscard())) return
        this.loadingDetail = true
        this.isCreating = false
        this.copiedFromId = null
        this.selectedId = Number(id)
        try {
          const response = await SpireApi.v1().get(`/alternate-currency-editor/currency/${id}`)
          this.installDetail(response.data)
          await this.updateRoute()
          await this.refreshActiveTab()
        } catch (error) {
          this.resetWorkspace()
          this.showNotification(this.errorMessage(error, 'Unable to load alternate currency'), 'error')
        } finally {
          this.loadingDetail = false
        }
      },
      installDetail (detail) {
        this.editModel = clone(detail.currency)
        this.originalModel = clone(detail.currency)
        this.selectedItem = clone(detail.item || { id: detail.currency.item_id, name: '', icon: 0 })
        this.originalItem = clone(this.selectedItem)
        this.usage = detail.usage || blankUsage()
      },
      async createDraft (source = null) {
        if (!(await this.confirmDiscard())) return
        this.isCreating = true
        this.copiedFromId = source ? Number(source.id) : null
        this.selectedId = null
        this.selectedTab = 'Overview'
        this.usage = blankUsage()
        this.editModel = { id: null, item_id: source ? Number(source.item_id) : 0 }
        this.originalModel = clone(this.editModel)
        this.selectedItem = source ? clone(this.selectedItem) : { id: 0, name: '', icon: 0 }
        this.originalItem = clone(this.selectedItem)
        this.itemSearch = ''
        this.itemResults = []
        await this.updateRoute()
        this.$nextTick(() => document.getElementById('alternate-currency-item-search')?.focus())
      },
      copyCurrency () {
        this.createDraft(this.editModel)
      },
      resetEditor () {
        this.editModel = clone(this.originalModel)
        this.selectedItem = clone(this.originalItem)
      },
      onEditorKeydown (event) {
        const shortcut = (event.metaKey || event.ctrlKey) &&
          !event.altKey &&
          String(event.key || '').toLowerCase() === 's'
        if (!shortcut || !this.editModel) return
        event.preventDefault()
        if (this.hasUnsavedChanges && this.canSave && !this.saving) this.saveEditor()
      },
      async saveEditor () {
        if (!this.canSave || this.saving) return
        this.saving = true
        try {
          const payload = { id: Number(this.editModel.id || 0), item_id: Number(this.editModel.item_id) }
          const method = this.isCreating ? 'put' : 'patch'
          const path = this.isCreating
            ? '/alternate-currency-editor/currency'
            : `/alternate-currency-editor/currency/${this.editModel.id}`
          const response = await SpireApi.v1()[method](path, payload)
          const created = this.isCreating
          this.isCreating = false
          this.copiedFromId = null
          this.installDetail(response.data)
          this.selectedId = Number(response.data.currency.id)
          await Promise.all([this.loadDirectory(this.currentPage), this.loadCurrencyOptions()])
          await this.updateRoute()
          this.showNotification(created ? 'Alternate currency created' : 'Alternate currency saved', 'success')
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to save alternate currency'), 'error', 6500)
        } finally {
          this.saving = false
        }
      },
      queueItemSearch () {
        window.clearTimeout(this.itemSearchTimer)
        if (this.itemSearch.length < 2) {
          this.itemResults = []
          return
        }
        this.itemSearchTimer = window.setTimeout(this.searchItems, 260)
      },
      async searchItems () {
        this.loadingItems = true
        try {
          const response = await SpireApi.v1().get('/alternate-currency-editor/items', {
            params: { q: this.itemSearch }
          })
          this.itemResults = response.data.data || []
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to search items'), 'error')
        } finally {
          this.loadingItems = false
        }
      },
      selectItem (item) {
        if (this.itemUnavailable(item)) return
        this.editModel.item_id = Number(item.id)
        this.selectedItem = clone(item)
        this.itemSearch = ''
        this.itemResults = []
      },
      async selectTab (tab) {
        this.selectedTab = tab
        await this.updateRoute()
        await this.refreshActiveTab()
      },
      async refreshActiveTab () {
        if (!this.editModel || this.isCreating) return
        if (this.selectedTab === 'Usage & Safety') {
          const preferred = Number(this.usage.task_count || 0) > 0
            ? 'tasks'
            : (Number(this.usage.npc_count || 0) > 0 ? 'npcs' : 'balances')
          await this.selectUsageKind(preferred)
        } else if (this.selectedTab === 'Balances') {
          await this.selectUsageKind('balances')
        } else if (this.selectedTab === 'Audit Trail') {
          await this.loadAudit()
        }
      },
      async selectUsageKind (kind) {
        this.usageKind = kind
        this.usageSearch = ''
        await this.loadUsage(1)
      },
      async loadUsage (page = 1) {
        if (!this.selectedId || this.isCreating) return
        this.loadingUsage = true
        this.usagePage = Number(page) || 1
        try {
          const response = await SpireApi.v1().get(
            `/alternate-currency-editor/currency/${this.selectedId}/usage`,
            {
              params: {
                kind: this.usageKind,
                q: this.usageSearch,
                page: this.usagePage,
                limit: this.usagePageSize
              }
            }
          )
          this.usageRows = response.data.data || []
          this.usageTotal = Number(response.data.total || 0)
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to load currency usage'), 'error')
        } finally {
          this.loadingUsage = false
        }
      },
      queueUsageSearch () {
        window.clearTimeout(this.usageSearchTimer)
        this.usageSearchTimer = window.setTimeout(() => this.loadUsage(1), 260)
      },
      usageRowKey (row) {
        return row.id || row.character_id
      },
      usageRowTitle (row) {
        if (this.usageKind === 'npcs') return row.name || `NPC #${row.id}`
        if (this.usageKind === 'tasks') return row.title || `Task #${row.id}`
        return row.character_name || `Character #${row.character_id}`
      },
      usageRowContext (row) {
        if (this.usageKind === 'npcs') {
          return `#${row.id} · level ${row.level} · ${this.raceName(row.race)} · ${this.className(row.class)}`
        }
        if (this.usageKind === 'tasks') return `Task #${row.id} · reward type ${this.selectedId}`
        return `#${row.character_id} · level ${row.level} · ${this.className(row.class)}`
      },
      usageRowValue (row) {
        if (this.usageKind === 'tasks') return `${Number(row.reward_points || 0).toLocaleString()} points`
        if (this.usageKind === 'balances') return Number(row.amount || 0).toLocaleString()
        return 'Open'
      },
      usageRowLink (row) {
        if (this.usageKind === 'npcs') return `/npc/${row.id}`
        if (this.usageKind === 'tasks') return `/tasks/${row.id}`
        return this.$route.fullPath
      },
      className (id) {
        return DB_CLASSES[String(id)] || `Class ${id}`
      },
      raceName (id) {
        return DB_RACE_NAMES[String(id)] || `Race ${id}`
      },
      itemUnavailable (item) {
        return Number(item?.assigned_currency_id || 0) > 0 &&
          Number(item.assigned_currency_id) !== Number(this.editModel?.id || 0)
      },
      characterInitial (name) {
        return String(name || '?').slice(0, 1).toUpperCase()
      },
      queueCharacterSearch () {
        window.clearTimeout(this.characterSearchTimer)
        if (this.characterSearch.length < 2) {
          this.characterResults = []
          return
        }
        this.characterSearchTimer = window.setTimeout(this.searchCharacters, 260)
      },
      async searchCharacters () {
        this.loadingCharacters = true
        try {
          const response = await SpireApi.v1().get('/alternate-currency-editor/characters', {
            params: { q: this.characterSearch, currency_id: this.selectedId }
          })
          this.characterResults = response.data.data || []
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to search characters'), 'error')
        } finally {
          this.loadingCharacters = false
        }
      },
      openBalanceAdjustment (character) {
        this.balanceCharacter = clone(character)
        this.balanceOperation = 'set'
        this.balanceAmount = Number(character.amount || 0)
        this.balanceReason = ''
        this.balanceConfirmation = ''
        this.characterSearch = ''
        this.characterResults = []
        this.$refs.balanceModal.show()
      },
      resetBalanceAdjustment () {
        if (this.savingBalance) return
        this.balanceCharacter = null
        this.balanceAmount = 0
        this.balanceReason = ''
        this.balanceConfirmation = ''
      },
      async executeBalanceAdjustment () {
        if (!this.canAdjustBalance || this.savingBalance) return
        this.savingBalance = true
        try {
          const response = await SpireApi.v1().post(
            `/alternate-currency-editor/currency/${this.selectedId}/balance`,
            {
              character_id: Number(this.balanceCharacter.character_id),
              operation: this.balanceOperation,
              amount: Number(this.balanceAmount),
              expected_amount: Number(this.balanceCharacter.amount || 0),
              reason: this.balanceReason
            }
          )
          this.$refs.balanceModal.hide()
          await Promise.all([
            this.reloadDetail(),
            this.loadUsage(this.usagePage),
            this.loadAudit(),
            this.loadDirectory(this.currentPage)
          ])
          this.showNotification(
            `Balance updated to ${Number(response.data.after || 0).toLocaleString()} · audit #${response.data.audit_id}`,
            'success',
            5200
          )
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to adjust character balance'), 'error', 7000)
        } finally {
          this.savingBalance = false
        }
      },
      async loadAudit () {
        if (!this.selectedId || this.isCreating) return
        this.loadingAudit = true
        try {
          const response = await SpireApi.v1().get(
            `/alternate-currency-editor/currency/${this.selectedId}/audit`,
            { params: { limit: 50 } }
          )
          this.auditEntries = response.data.data || []
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to load audit trail'), 'error')
        } finally {
          this.loadingAudit = false
        }
      },
      auditIcon (entry) {
        if (entry.event_name.includes('BALANCE')) return 'fa-money'
        if (entry.event_name.includes('DELETE')) return 'fa-trash'
        if (entry.event_name.includes('CREATE')) return 'fa-plus'
        return 'fa-edit'
      },
      auditTitle (entry) {
        const action = entry.data?.action
        if (
          action === 'resolve_delete' &&
          Number(entry.data?.replacement_id || 0) === Number(this.selectedId)
        ) {
          return `Currency #${entry.data.currency_id} merged into this currency`
        }
        return {
          create: 'Currency created',
          update: 'Token item changed',
          delete: 'Currency deleted',
          resolve_delete: 'Usages resolved and currency deleted',
          balance_adjust: 'Character balance adjusted'
        }[action] || 'Alternate currency changed'
      },
      auditSummary (entry) {
        const data = entry.data || {}
        if (data.action === 'balance_adjust') {
          return `${data.character_name || 'Character #' + data.character_id}: ${Number(data.before || 0).toLocaleString()} → ${Number(data.after || 0).toLocaleString()} (${data.operation})`
        }
        if (data.action === 'update') return `Token item #${data.previous_item_id || 0} → #${data.item_id || 0}`
        if (data.action === 'resolve_delete') {
          const resolution = `${Number(data.npcs_updated || 0)} NPCs, ${Number(data.tasks_updated || 0)} tasks, ${Number(data.balances_moved || data.balances_deleted || 0)} balances resolved`
          return data.reason ? `${resolution} · ${data.reason}` : resolution
        }
        return data.item_id ? `Token item #${data.item_id}` : `Currency #${data.currency_id}`
      },
      formatDate (value) {
        if (!value) return ''
        return new Date(value).toLocaleString()
      },
      async reloadDetail () {
        if (!this.selectedId) return
        const response = await SpireApi.v1().get(`/alternate-currency-editor/currency/${this.selectedId}`)
        this.installDetail(response.data)
      },
      async requestDelete () {
        if (this.totalReferences > 0) {
          this.selectedTab = 'Usage & Safety'
          await this.updateRoute()
          await this.refreshActiveTab()
          this.showNotification('Deletion is blocked until all usages are replaced or removed safely.', 'error', 6200)
          return
        }
        const confirmed = await this.$bvModal.msgBoxConfirm(
          `Delete currency #${this.editModel.id} (${this.selectedItem.name})? This cannot be undone.`,
          {
            title: 'Delete alternate currency',
            okTitle: 'Delete permanently',
            okVariant: 'danger',
            cancelTitle: 'Cancel',
            centered: true
          }
        )
        if (!confirmed) return
        try {
          await SpireApi.v1().delete(`/alternate-currency-editor/currency/${this.editModel.id}`)
          this.resetWorkspace()
          await Promise.all([this.loadDirectory(1), this.loadCurrencyOptions()])
          await this.updateRoute()
          this.showNotification('Alternate currency deleted', 'success')
        } catch (error) {
          if (error?.response?.data?.usage) this.usage = error.response.data.usage
          this.showNotification(this.errorMessage(error, 'Deletion was blocked'), 'error', 6500)
        }
      },
      openResolution (mode) {
        this.resolutionMode = mode
        this.replacementId = 0
        this.deleteBalances = false
        this.resolutionReason = ''
        this.resolutionConfirmation = ''
        this.$refs.resolutionModal.show()
      },
      resetResolution () {
        if (this.resolving) return
        this.replacementId = 0
        this.deleteBalances = false
        this.resolutionReason = ''
        this.resolutionConfirmation = ''
      },
      async executeResolution () {
        if (!this.canResolve || this.resolving) return
        this.resolving = true
        try {
          const response = await SpireApi.v1().post(
            `/alternate-currency-editor/currency/${this.editModel.id}/resolve`,
            {
              mode: this.resolutionMode,
              target_id: this.resolutionMode === 'replace' ? Number(this.replacementId) : 0,
              delete_balances: this.resolutionMode === 'remove' && this.deleteBalances,
              reason: this.resolutionReason
            }
          )
          this.$refs.resolutionModal.hide()
          const changed = Number(response.data.npcs_updated || 0) +
            Number(response.data.tasks_updated || 0) +
            Number(response.data.balances_moved || 0) +
            Number(response.data.balances_deleted || 0)
          this.resetWorkspace()
          await Promise.all([this.loadDirectory(1), this.loadCurrencyOptions()])
          await this.updateRoute()
          this.showNotification(`${changed} usages resolved; alternate currency deleted`, 'success', 5600)
        } catch (error) {
          this.showNotification(this.errorMessage(error, 'Unable to resolve currency usages'), 'error', 7200)
        } finally {
          this.resolving = false
        }
      },
      async updateRoute () {
        const tabs = ['Overview', 'Usage & Safety', 'Balances', 'Audit Trail']
        if (!tabs.includes(this.selectedTab)) this.selectedTab = 'Overview'
        const query = { tab: this.selectedTab }
        if (this.selectedId && !this.isCreating) query.currency = String(this.selectedId)
        if (JSON.stringify(query) !== JSON.stringify(this.$route.query)) {
          await this.$router.replace({ path: this.$route.path, query }).catch(() => {})
        }
      },
      resetWorkspace () {
        this.selectedId = null
        this.isCreating = false
        this.copiedFromId = null
        this.editModel = null
        this.originalModel = null
        this.selectedItem = { id: 0, name: '', icon: 0 }
        this.originalItem = { id: 0, name: '', icon: 0 }
        this.usage = blankUsage()
        this.usageRows = []
        this.auditEntries = []
        this.selectedTab = 'Overview'
      },
      async confirmDiscard () {
        if (!this.hasUnsavedChanges) return true
        return !!(await this.$bvModal.msgBoxConfirm(
          'Discard the unsaved alternate currency changes?',
          {
            title: 'Unsaved changes',
            okTitle: 'Discard changes',
            okVariant: 'danger',
            cancelTitle: 'Keep editing',
            centered: true
          }
        ))
      },
      showNotification (message, type = 'success', duration = 3600) {
        this.notification = { message, type }
        window.clearTimeout(this.notificationTimer)
        this.notificationTimer = window.setTimeout(() => { this.notification = null }, duration)
      },
      errorMessage (error, fallback) {
        return error?.response?.data?.error || error?.message || fallback
      }
    }
  }
</script>

<style scoped>
  .alternate-currency-editor-page {
    --currency-gold: #d6ad42;
    --currency-gold-soft: rgba(214, 173, 66, .14);
    --currency-green: #64c892;
    --currency-red: #dd6b6b;
    --currency-blue: #6fa8dc;
    --currency-panel: rgba(8, 14, 20, .82);
    --currency-line: rgba(202, 182, 124, .18);
    color: #d8dde3;
  }

  .currency-toolbar,
  .editor-header,
  .editor-section-heading,
  .usage-browser__toolbar,
  .resolution-panel,
  .balance-tools,
  .modal-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .currency-toolbar {
    margin-bottom: 14px;
  }

  .currency-kicker,
  .section-kicker {
    color: var(--currency-gold);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .13em;
    text-transform: uppercase;
  }

  .currency-title {
    margin: 2px 0;
    color: #e8cf8b;
    font-family: Georgia, serif;
    font-size: 25px;
    line-height: 1.1;
  }

  .currency-subtitle {
    margin: 0;
    color: #aeb7c1;
    font-size: 12px;
  }

  .workspace-summary {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 34px;
    padding: 0 12px;
    border: 1px solid rgba(214, 173, 66, .35);
    background: rgba(8, 10, 13, .78);
    color: #aeb7c1;
    font-size: 11px;
    text-transform: uppercase;
  }

  .workspace-summary strong {
    color: #e6c66d;
  }

  .workspace-summary__divider {
    width: 1px;
    height: 17px;
    background: var(--currency-line);
  }

  .currency-workspace {
    display: grid;
    grid-template-columns: minmax(300px, 330px) minmax(0, 1fr);
    gap: 14px;
    min-height: calc(100vh - 170px);
  }

  .currency-directory,
  .currency-inspector {
    min-width: 0;
  }

  .currency-directory ::v-deep .eq-window-simple,
  .currency-inspector ::v-deep .eq-window-simple {
    height: 100%;
    border-color: rgba(202, 182, 124, .42);
    background-color: var(--currency-panel);
  }

  .directory-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 7px;
  }

  .directory-search,
  .inline-search,
  .item-picker__search {
    position: relative;
  }

  .directory-search > i,
  .inline-search > i,
  .item-picker__search > i:first-child {
    position: absolute;
    z-index: 2;
    top: 50%;
    left: 9px;
    color: #8c949d;
    font-size: 11px;
    transform: translateY(-50%);
  }

  .directory-search input,
  .inline-search input,
  .item-picker__search input {
    height: 30px;
    padding-left: 28px;
    border-color: rgba(164, 172, 181, .35);
    background: rgba(4, 7, 11, .72);
    color: #e0e4e9;
    font-size: 11px;
  }

  button.directory-clear {
    position: absolute;
    top: 50%;
    right: 5px;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #9aa4ae;
    transform: translateY(-50%);
  }

  .directory-new {
    height: 30px;
  }

  .directory-meta {
    display: flex;
    justify-content: space-between;
    margin: 8px 1px 5px;
    color: #7f8a95;
    font-size: 9px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .directory-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 300px;
    max-height: calc(100vh - 282px);
    overflow-y: auto;
    scrollbar-width: thin;
  }

  button.directory-row {
    display: grid;
    grid-template-columns: 35px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 6px 8px;
    border: 1px solid rgba(141, 151, 161, .13);
    background: rgba(5, 9, 13, .48);
    color: inherit;
    text-align: left;
    transition: border-color .15s ease, background .15s ease, transform .15s ease;
  }

  button.directory-row:hover {
    border-color: rgba(214, 173, 66, .38);
    background: rgba(214, 173, 66, .06);
    transform: translateX(2px);
  }

  button.directory-row.active {
    border-color: rgba(214, 173, 66, .72);
    background: linear-gradient(90deg, rgba(214, 173, 66, .16), rgba(214, 173, 66, .03));
  }

  .directory-row__icon {
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    border: 1px solid rgba(214, 173, 66, .22);
    background: rgba(214, 173, 66, .07);
    color: var(--currency-gold);
  }

  .directory-row__body {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  .directory-row__name {
    overflow: hidden;
    color: #e3e7eb;
    font-size: 11px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .directory-row__detail {
    overflow: hidden;
    color: #7f8993;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .directory-row__aside {
    color: #777f87;
    font-family: monospace;
    font-size: 9px;
  }

  .directory-state,
  .editor-empty,
  .tab-empty,
  .usage-loading,
  .usage-clear,
  .balance-table__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca6b0;
    text-align: center;
  }

  .directory-state {
    min-height: 170px;
    flex-direction: column;
    gap: 7px;
    font-size: 11px;
  }

  .directory-pagination,
  .usage-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    margin-top: 8px;
    color: #8f99a3;
    font-size: 10px;
  }

  .currency-directory .directory-pagination button,
  .currency-inspector .usage-pagination button {
    display: grid;
    width: 26px;
    height: 26px;
    padding: 0;
    place-items: center;
    border: 1px solid rgba(171, 179, 188, .28);
    background: rgba(8, 12, 17, .72);
    color: #c6ccd2;
  }

  .currency-directory .directory-pagination button:disabled,
  .currency-inspector .usage-pagination button:disabled {
    opacity: .35;
  }

  .currency-row-enter-active,
  .currency-row-leave-active {
    transition: opacity .16s ease, transform .16s ease;
  }

  .currency-row-enter,
  .currency-row-leave-to {
    opacity: 0;
    transform: translateY(4px);
  }

  .editor-empty {
    min-height: calc(100vh - 225px);
    flex-direction: column;
    padding: 42px;
  }

  .editor-empty__sigil {
    display: grid;
    width: 62px;
    height: 62px;
    margin-bottom: 14px;
    place-items: center;
    border: 1px solid rgba(214, 173, 66, .32);
    border-radius: 50%;
    background: rgba(214, 173, 66, .05);
    color: var(--currency-gold);
    font-size: 20px;
  }

  .editor-empty h3 {
    margin: 0 0 5px;
    color: #dfc681;
    font-family: Georgia, serif;
    font-size: 18px;
  }

  .editor-empty p {
    max-width: 500px;
    color: #a6afb8;
    font-size: 11px;
  }

  .editor-header-window {
    margin-bottom: 8px;
  }

  .editor-identity {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;
  }

  .editor-identity__icon {
    display: grid;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    place-items: center;
    border: 1px solid rgba(214, 173, 66, .32);
    background: rgba(214, 173, 66, .08);
    color: var(--currency-gold);
    font-size: 16px;
  }

  .editor-identity__eyebrow {
    color: #838d97;
    font-size: 9px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .editor-identity h2 {
    overflow: hidden;
    max-width: 620px;
    margin: 1px 0;
    color: #e8c66d;
    font-family: monospace;
    font-size: 17px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .editor-identity p {
    margin: 0;
    color: #8f99a3;
    font-size: 9px;
  }

  .unsaved-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 7px;
    padding: 2px 5px;
    border: 1px solid rgba(100, 200, 146, .32);
    color: var(--currency-green);
    font-size: 8px;
  }

  .unsaved-pill i {
    font-size: 5px;
  }

  .editor-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 5px;
  }

  .save-button--dirty {
    box-shadow: 0 0 12px rgba(100, 200, 146, .16);
  }

  .editor-section-heading {
    padding-bottom: 12px;
    border-bottom: 1px solid var(--currency-line);
  }

  .editor-section-heading h3 {
    margin: 2px 0 0;
    color: #e2c781;
    font-family: Georgia, serif;
    font-size: 17px;
  }

  .section-help {
    max-width: 470px;
    color: #87919b;
    font-size: 9px;
    text-align: right;
  }

  .overview-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(230px, .65fr);
    gap: 14px;
    margin-top: 13px;
  }

  .configuration-panel,
  .recognition-panel,
  .usage-browser,
  .balance-table-wrap,
  .character-picker {
    border: 1px solid rgba(150, 160, 170, .17);
    background: rgba(5, 9, 13, .43);
  }

  .configuration-panel,
  .recognition-panel {
    padding: 14px;
  }

  .form-row-grid {
    display: grid;
    grid-template-columns: minmax(130px, .45fr) minmax(160px, .55fr);
    gap: 10px;
  }

  .form-group label,
  .item-picker > label,
  .character-picker > label,
  .balance-modal > label {
    margin-bottom: 4px;
    color: #d3b965;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  .form-group small,
  .item-picker small,
  .balance-modal small {
    display: block;
    margin-top: 3px;
    color: #79838d;
    font-size: 8px;
  }

  .form-control {
    border-color: rgba(157, 167, 177, .32);
    background: rgba(4, 7, 11, .72);
    color: #e2e6ea;
  }

  .form-control:focus {
    border-color: rgba(214, 173, 66, .7);
    background: rgba(4, 7, 11, .9);
    color: #fff;
    box-shadow: 0 0 0 2px rgba(214, 173, 66, .08);
  }

  .form-control:disabled {
    background: rgba(4, 7, 11, .42);
    color: #9ba4ad;
  }

  .token-card {
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr) auto;
    align-items: center;
    gap: 11px;
    margin: 4px 0 14px;
    padding: 11px;
    border: 1px solid rgba(214, 173, 66, .28);
    background: linear-gradient(110deg, rgba(214, 173, 66, .11), rgba(8, 13, 18, .35));
  }

  .token-card.empty {
    border-style: dashed;
    opacity: .78;
  }

  .token-card__icon {
    display: grid;
    width: 48px;
    height: 48px;
    place-items: center;
    border: 1px solid rgba(214, 173, 66, .24);
    background: rgba(0, 0, 0, .35);
    color: var(--currency-gold);
  }

  .token-card__body h4 {
    margin: 1px 0;
    color: #e4e8ec;
    font-size: 13px;
  }

  .token-card__body p,
  .recognition-panel p {
    margin: 0;
    color: #87919b;
    font-size: 9px;
  }

  .item-picker__spinner {
    position: absolute;
    top: 50%;
    right: 9px;
    color: var(--currency-gold);
    transform: translateY(-50%);
  }

  .item-results,
  .character-results {
    margin-top: 5px;
    border: 1px solid rgba(214, 173, 66, .25);
    background: rgba(4, 8, 12, .96);
  }

  .currency-inspector .item-results button,
  .currency-inspector .character-results button {
    display: grid;
    width: 100%;
    grid-template-columns: 38px minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
    min-height: 45px;
    padding: 6px 9px;
    border: 0;
    border-bottom: 1px solid rgba(150, 160, 170, .13);
    background: transparent;
    color: #dce1e6;
    text-align: left;
  }

  .currency-inspector .item-results button:hover,
  .currency-inspector .item-results button.active,
  .currency-inspector .character-results button:hover {
    background: rgba(214, 173, 66, .09);
  }

  .currency-inspector .item-results button:disabled {
    cursor: not-allowed;
    opacity: .46;
  }

  .currency-inspector .item-results button:disabled:hover {
    background: transparent;
  }

  .item-results button strong,
  .character-results button strong {
    display: block;
    font-size: 10px;
  }

  .item-results button small,
  .character-results button small {
    display: block;
    color: #7f8993;
    font-size: 8px;
  }

  .item-results__icon {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border: 1px solid rgba(214, 173, 66, .18);
    background: rgba(0, 0, 0, .3);
  }

  .item-results__empty {
    padding: 13px;
    color: #89939d;
    font-size: 9px;
    text-align: center;
  }

  .copy-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 8px 10px;
    border: 1px solid rgba(111, 168, 220, .28);
    background: rgba(111, 168, 220, .07);
    color: #a9c9e6;
    font-size: 9px;
  }

  .recognition-panel {
    position: relative;
    overflow: hidden;
  }

  .recognition-panel h3 {
    margin: 3px 0 12px;
    color: #e1e5e9;
    font-size: 14px;
  }

  .recognition-icon {
    display: grid;
    width: 86px;
    height: 86px;
    margin: 4px auto 14px;
    place-items: center;
    border: 1px solid rgba(214, 173, 66, .34);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(214, 173, 66, .12), rgba(0, 0, 0, .18));
    color: var(--currency-gold);
    font-size: 24px;
  }

  .recognition-panel dl {
    margin: 0 0 12px;
  }

  .recognition-panel dl div {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    border-bottom: 1px solid rgba(150, 160, 170, .11);
  }

  .recognition-panel dt {
    color: #818b95;
    font-size: 9px;
    font-weight: 400;
  }

  .recognition-panel dd {
    margin: 0;
    color: #d8dde2;
    font-family: monospace;
    font-size: 10px;
  }

  .tab-empty {
    min-height: 260px;
    gap: 8px;
    font-size: 10px;
  }

  .usage-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
    margin: 12px 0 9px;
  }

  .currency-inspector .usage-metrics button {
    display: flex;
    min-height: 78px;
    flex-direction: column;
    padding: 9px 11px;
    border: 1px solid rgba(147, 157, 167, .18);
    background: rgba(5, 9, 13, .42);
    color: #aab2ba;
    text-align: left;
    transition: border-color .15s ease, background .15s ease;
  }

  .currency-inspector .usage-metrics button:hover,
  .currency-inspector .usage-metrics button.active {
    border-color: rgba(214, 173, 66, .52);
    background: rgba(214, 173, 66, .08);
  }

  .usage-metrics span {
    font-size: 9px;
    text-transform: uppercase;
  }

  .usage-metrics strong {
    color: #e4c66f;
    font-size: 23px;
    line-height: 1.15;
  }

  .usage-metrics small {
    color: #76808a;
    font-family: monospace;
    font-size: 8px;
  }

  .usage-browser {
    min-height: 245px;
    padding: 10px;
  }

  .usage-browser__toolbar {
    padding-bottom: 9px;
    border-bottom: 1px solid var(--currency-line);
  }

  .usage-browser__toolbar strong,
  .usage-browser__toolbar span {
    display: block;
  }

  .usage-browser__toolbar strong {
    color: #dfe3e7;
    font-size: 11px;
  }

  .usage-browser__toolbar span {
    color: #7f8993;
    font-size: 8px;
  }

  .inline-search {
    width: min(260px, 100%);
  }

  .usage-loading,
  .usage-clear {
    min-height: 150px;
    gap: 7px;
    font-size: 9px;
  }

  .usage-clear i {
    color: var(--currency-green);
  }

  .usage-list {
    display: flex;
    flex-direction: column;
    margin-top: 7px;
  }

  .usage-row {
    display: grid;
    grid-template-columns: 31px minmax(0, 1fr) auto 14px;
    align-items: center;
    gap: 8px;
    min-height: 42px;
    padding: 5px 7px;
    border-bottom: 1px solid rgba(150, 160, 170, .11);
    color: #d9dee3;
  }

  .alternate-currency-editor-page .currency-inspector button.usage-row {
    width: 100%;
    border: 0;
    border-bottom: 1px solid rgba(150, 160, 170, .11);
    border-radius: 0;
    background: transparent;
    text-align: left;
  }

  .usage-row:hover {
    background: rgba(214, 173, 66, .06);
    color: #efdaa0;
    text-decoration: none;
  }

  .usage-row__icon {
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border: 1px solid rgba(214, 173, 66, .17);
    color: var(--currency-gold);
  }

  .usage-row__body {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  .usage-row__body strong {
    overflow: hidden;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .usage-row__body small {
    color: #7e8892;
    font-size: 8px;
  }

  .usage-row__value {
    color: #e1c36e;
    font-family: monospace;
    font-size: 9px;
  }

  .resolution-panel {
    margin-top: 9px;
    padding: 10px;
    border: 1px solid rgba(221, 107, 107, .26);
    background: rgba(89, 25, 25, .08);
  }

  .resolution-panel.clear {
    border-color: rgba(100, 200, 146, .25);
    background: rgba(100, 200, 146, .05);
  }

  .resolution-panel h4 {
    margin: 2px 0;
    color: #e4e8ec;
    font-size: 11px;
  }

  .resolution-panel p {
    max-width: 720px;
    margin: 0;
    color: #8f99a3;
    font-size: 8px;
  }

  .resolution-panel__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 5px;
  }

  .balance-summary {
    display: grid;
    grid-template-columns: 1fr 1fr minmax(180px, 1.3fr);
    gap: 7px;
    margin: 12px 0 9px;
  }

  .balance-summary > div {
    display: flex;
    min-height: 62px;
    flex-direction: column;
    justify-content: center;
    padding: 8px 11px;
    border: 1px solid rgba(150, 160, 170, .18);
    background: rgba(5, 9, 13, .42);
  }

  .balance-summary span {
    color: #858f99;
    font-size: 9px;
  }

  .balance-summary strong {
    color: #e3c66f;
    font-size: 20px;
  }

  .balance-summary__token {
    display: grid !important;
    grid-template-columns: 35px 1fr;
    align-items: center;
    gap: 8px;
  }

  .balance-summary__token span:last-child {
    color: #dce1e6;
    font-size: 10px;
  }

  .balance-tools {
    align-items: flex-end;
    margin-bottom: 8px;
  }

  .character-picker {
    position: relative;
    z-index: 5;
    width: min(520px, 100%);
    padding: 8px;
  }

  .character-results {
    position: absolute;
    right: 8px;
    left: 8px;
    z-index: 8;
    max-height: 260px;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, .5);
  }

  .character-avatar {
    display: inline-grid;
    width: 29px;
    height: 29px;
    flex: 0 0 29px;
    place-items: center;
    border: 1px solid rgba(111, 168, 220, .32);
    border-radius: 50%;
    background: rgba(111, 168, 220, .08);
    color: #b8d5ed;
    font-size: 10px;
    font-weight: 800;
  }

  .balance-filter {
    flex: 0 1 280px;
  }

  .balance-table-wrap {
    overflow: hidden;
  }

  .balance-table {
    width: 100%;
    border-collapse: collapse;
  }

  .balance-table th {
    padding: 7px 9px;
    border-bottom: 1px solid var(--currency-line);
    color: #929ca6;
    font-size: 8px;
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .balance-table td {
    padding: 7px 9px;
    border-bottom: 1px solid rgba(150, 160, 170, .11);
    color: #aeb7bf;
    font-size: 9px;
    vertical-align: middle;
  }

  .balance-table td:first-child {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .balance-table td:first-child span:last-child {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  .balance-table td strong {
    color: #dfe3e7;
    font-size: 10px;
  }

  .balance-table td small {
    color: #76808a;
    font-size: 8px;
  }

  .balance-amount {
    color: #e3c66f !important;
    font-family: monospace;
    font-size: 11px !important;
  }

  .balance-table__empty {
    height: 130px;
  }

  .icon-action {
    display: inline-grid;
    width: 29px;
    height: 29px;
    padding: 0;
    place-items: center;
  }

  .audit-timeline {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 13px;
  }

  .audit-timeline::before {
    position: absolute;
    top: 17px;
    bottom: 17px;
    left: 15px;
    width: 1px;
    background: rgba(214, 173, 66, .22);
    content: "";
  }

  .audit-timeline article {
    position: relative;
    display: grid;
    grid-template-columns: 31px minmax(0, 1fr);
    gap: 9px;
  }

  .audit-timeline__marker {
    z-index: 1;
    display: grid;
    width: 31px;
    height: 31px;
    place-items: center;
    border: 1px solid rgba(214, 173, 66, .3);
    border-radius: 50%;
    background: #0a1015;
    color: var(--currency-gold);
    font-size: 10px;
  }

  .audit-timeline__content {
    padding: 8px 10px;
    border: 1px solid rgba(150, 160, 170, .16);
    background: rgba(5, 9, 13, .42);
  }

  .audit-timeline__content header,
  .audit-timeline__content footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .audit-timeline__content header strong {
    color: #dfe4e8;
    font-size: 10px;
  }

  .audit-timeline__content header span,
  .audit-timeline__content time,
  .audit-timeline__content footer {
    color: #77818b;
    font-size: 8px;
  }

  .audit-timeline__content p {
    margin: 5px 0;
    color: #aeb7bf;
    font-size: 9px;
  }

  .audit-timeline__content footer {
    justify-content: flex-start;
  }

  .balance-modal__identity {
    display: grid;
    grid-template-columns: 35px minmax(0, 1fr) 35px;
    align-items: center;
    gap: 8px;
    margin-bottom: 13px;
    padding: 9px;
    border: 1px solid rgba(214, 173, 66, .22);
    background: rgba(214, 173, 66, .06);
  }

  .balance-modal__identity div {
    display: flex;
    flex-direction: column;
  }

  .balance-modal__identity strong {
    color: #e2e6ea;
    font-size: 11px;
  }

  .balance-modal__identity span {
    color: #848e98;
    font-size: 9px;
  }

  .operation-toggle {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin-bottom: 12px;
    border: 1px solid rgba(150, 160, 170, .22);
  }

  .operation-toggle button {
    min-height: 32px;
    border: 0;
    border-right: 1px solid rgba(150, 160, 170, .18);
    background: rgba(5, 9, 13, .48);
    color: #9ca6b0;
    font-size: 9px;
  }

  .operation-toggle button:last-child {
    border-right: 0;
  }

  .operation-toggle button.active {
    background: rgba(214, 173, 66, .14);
    color: #e7cb7e;
  }

  .operation-toggle i {
    margin-right: 5px;
  }

  .balance-preview {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 11px;
    margin-bottom: 12px;
    padding: 8px;
    border: 1px solid rgba(100, 200, 146, .25);
    background: rgba(100, 200, 146, .05);
  }

  .balance-preview.invalid {
    border-color: rgba(221, 107, 107, .3);
    background: rgba(221, 107, 107, .05);
  }

  .balance-preview span {
    display: flex;
    flex-direction: column;
    color: #7f8993;
    font-size: 8px;
    text-align: center;
  }

  .balance-preview strong {
    color: #e2c46e;
    font-size: 17px;
  }

  .balance-preview i {
    color: #8d97a1;
  }

  .resolution-modal__summary {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 9px;
    margin-bottom: 12px;
    padding: 9px;
    border: 1px solid rgba(214, 173, 66, .23);
    background: rgba(214, 173, 66, .05);
  }

  .resolution-modal__summary > i {
    color: var(--currency-gold);
    font-size: 17px;
    text-align: center;
  }

  .resolution-modal__summary p {
    margin: 0;
    color: #9da7b0;
    font-size: 9px;
  }

  .danger-check {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 12px;
    padding: 9px;
    border: 1px solid rgba(221, 107, 107, .32);
    background: rgba(221, 107, 107, .06);
    color: #d9a1a1;
  }

  .danger-check input {
    margin-top: 3px;
  }

  .danger-check span {
    display: flex;
    flex-direction: column;
  }

  .danger-check strong {
    font-size: 9px;
  }

  .danger-check small {
    color: #9c7b7b;
    font-size: 8px;
  }

  .modal-actions {
    margin-top: 15px;
    justify-content: flex-end;
  }

  .editor-notification {
    position: fixed;
    right: 24px;
    bottom: 22px;
    z-index: 2000;
    display: flex;
    max-width: 440px;
    align-items: center;
    gap: 8px;
    padding: 10px 13px;
    border: 1px solid rgba(100, 200, 146, .46);
    background: rgba(10, 31, 22, .96);
    color: #b9e4cd;
    box-shadow: 0 12px 35px rgba(0, 0, 0, .45);
    font-size: 10px;
  }

  .editor-notification--error {
    border-color: rgba(221, 107, 107, .55);
    background: rgba(42, 13, 16, .96);
    color: #efb4b4;
  }

  .notification-enter-active,
  .notification-leave-active {
    transition: opacity .18s ease, transform .18s ease;
  }

  .notification-enter,
  .notification-leave-to {
    opacity: 0;
    transform: translateY(8px);
  }

  code {
    color: #e3c46e;
  }

  @media (max-width: 1180px) {
    .currency-workspace {
      grid-template-columns: 285px minmax(0, 1fr);
    }

    .overview-grid {
      grid-template-columns: 1fr;
    }

    .recognition-panel {
      display: grid;
      grid-template-columns: 1fr 110px 1fr;
      align-items: center;
      gap: 10px;
    }

    .recognition-panel .recognition-icon {
      grid-column: 2;
      grid-row: 1 / span 3;
    }
  }

  @media (max-width: 900px) {
    .currency-toolbar,
    .editor-header,
    .editor-section-heading,
    .resolution-panel,
    .balance-tools {
      align-items: stretch;
      flex-direction: column;
    }

    .workspace-summary {
      align-self: flex-start;
    }

    .currency-workspace {
      grid-template-columns: 1fr;
    }

    .directory-list {
      max-height: 310px;
    }

    .editor-actions {
      justify-content: flex-start;
    }

    .section-help {
      max-width: none;
      text-align: left;
    }

    .usage-metrics,
    .balance-summary {
      grid-template-columns: 1fr 1fr;
    }

    .usage-metrics button:last-child,
    .balance-summary__token {
      grid-column: 1 / -1;
    }

    .inline-search,
    .character-picker,
    .balance-filter {
      width: 100%;
      flex-basis: auto;
    }
  }

  @media (max-width: 560px) {
    .currency-title {
      font-size: 21px;
    }

    .workspace-summary {
      width: 100%;
      justify-content: center;
    }

    .editor-identity__icon {
      width: 36px;
      height: 36px;
      flex-basis: 36px;
    }

    .editor-identity h2 {
      max-width: 240px;
      font-size: 14px;
    }

    .form-row-grid,
    .usage-metrics,
    .balance-summary {
      grid-template-columns: 1fr;
    }

    .usage-metrics button:last-child,
    .balance-summary__token {
      grid-column: auto;
    }

    .token-card {
      grid-template-columns: 45px minmax(0, 1fr);
    }

    .token-card > a {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .recognition-panel {
      display: block;
    }

    .usage-browser__toolbar {
      align-items: stretch;
      flex-direction: column;
    }

    .usage-row {
      grid-template-columns: 29px minmax(0, 1fr) auto;
    }

    .usage-row > i:last-child {
      display: none;
    }

    .balance-table th:nth-child(2),
    .balance-table td:nth-child(2) {
      display: none;
    }

    .editor-notification {
      right: 12px;
      bottom: 12px;
      left: 12px;
    }
  }
</style>
