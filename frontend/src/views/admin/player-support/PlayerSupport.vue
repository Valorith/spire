<template>
  <section class="player-support" aria-labelledby="player-support-title">
    <header class="support-header">
      <div class="support-title">
        <h1 id="player-support-title">Player Support</h1>
        <p>Work in-game petitions with notes, tells, mail, parcels and recovery in one place.</p>
      </div>
      <div class="support-header-actions">
        <span class="support-live" :title="'Queue refreshes every 12 seconds' + (refreshedAt ? ' · last updated ' + clock(refreshedAt) : '')">
          <span class="support-live-dot" aria-hidden="true"></span> Live
        </span>
        <button v-if="connectionId !== null" type="button" class="support-button is-ghost" aria-label="Support insights" title="Response times and staff activity" @click="panel = 'metrics'">
          <i class="fe fe-bar-chart-2" aria-hidden="true"></i><span class="support-button-label"> Insights</span>
        </button>
        <button v-if="connectionId !== null" type="button" class="support-button is-ghost" aria-label="Saved replies" title="Replies shared with your team" @click="panel = 'replies'">
          <i class="fe fe-bookmark" aria-hidden="true"></i><span class="support-button-label"> Replies</span>
        </button>
        <button v-if="connectionId !== null" type="button" class="support-button is-ghost support-alerts-button" aria-label="Petition alerts" title="Desktop, sound and Discord alerts" @click="panel = 'alerts'">
          <i :class="alertPrefs.desktop || alertPrefs.sound ? 'fe fe-bell' : 'fe fe-bell-off'" aria-hidden="true"></i><span class="support-button-label"> Alerts</span>
          <span v-if="alertPrefs.desktop || alertPrefs.sound" class="support-alert-dot" aria-hidden="true"></span>
        </button>
        <button type="button" class="support-button" :disabled="queueLoading || busy" @click="refresh">
          <i class="fe fe-refresh-cw" :class="{ 'support-spin': queueLoading && !backgroundLoading }" aria-hidden="true"></i> Refresh
        </button>
      </div>
    </header>

    <div v-if="summary" class="support-summary" role="group" aria-label="Queue at a glance">
      <button type="button" class="support-stat" :class="{ 'is-quiet': !summary.active }" :aria-pressed="String(filter === 'open')" @click="setFilter('open')">
        <strong>{{ summary.active }}</strong><span>Active</span>
      </button>
      <div class="support-stat" :class="summary.urgent ? 'is-danger' : 'is-quiet'">
        <strong>{{ summary.urgent }}</strong><span>Urgent</span>
      </div>
      <button type="button" class="support-stat" :class="{ 'is-quiet': !summary.unassigned }" :aria-pressed="String(filter === 'unassigned')" @click="setFilter('unassigned')">
        <strong>{{ summary.unassigned }}</strong><span>Unassigned</span>
      </button>
      <div class="support-stat" :class="{ 'is-quiet': !summary.waiting }">
        <strong>{{ summary.waiting }}</strong><span>Waiting on player</span>
      </div>
      <button type="button" class="support-stat" :class="{ 'is-quiet': !summary.mine }" :aria-pressed="String(filter === 'mine')" @click="setFilter('mine')">
        <strong>{{ summary.mine }}</strong><span>Assigned to you</span>
      </button>
    </div>

    <div v-if="companionNote" class="support-callout is-warning support-companion" role="note">
      <i class="fe fe-cpu" aria-hidden="true"></i>
      <div>
        <strong>{{ companionNote.title }}</strong>
        <p>{{ companionNote.text }}</p>
      </div>
    </div>

    <transition name="support-fade">
      <div v-if="notice" class="support-callout support-notice" :class="notice.error ? 'is-danger' : 'is-success'" :role="notice.error ? 'alert' : 'status'">
        <i :class="notice.error ? 'fe fe-alert-circle' : 'fe fe-check-circle'" aria-hidden="true"></i>
        <span>{{ notice.text }}</span>
        <button type="button" aria-label="Dismiss notification" class="support-button is-ghost is-icon is-sm" @click="dismissNotice"><i class="fe fe-x" aria-hidden="true"></i></button>
      </div>
    </transition>

    <div ref="workspace" class="support-workspace" :class="{ 'show-case': mobileDetail }">
      <aside class="support-queue" aria-label="Petition queue">
        <div class="support-queue-controls">
          <div class="support-queue-title">
            <h2 class="support-section-label">Petitions</h2>
            <span class="support-count" :aria-label="total + ' petitions'">{{ total }}</span>
          </div>
          <label class="support-search">
            <i class="fe fe-search" aria-hidden="true"></i>
            <input ref="search" v-model="search" type="search" maxlength="200" placeholder="Character, account or text" aria-label="Search petitions"
                   @input="scheduleSearch" @keydown.esc="clearSearch">
            <kbd v-if="!search" class="support-kbd support-search-key" title="Press / to search">/</kbd>
          </label>
          <div class="support-segmented support-filters" role="group" aria-label="Filter petitions">
            <button v-for="option in filters" :key="option.id" type="button" :aria-pressed="String(filter === option.id)" @click="setFilter(option.id)">
              {{ option.label }}
            </button>
          </div>
        </div>
        <div v-if="queueLoading && !cases.length" class="support-skeletons" role="status">
          <span class="support-skeleton" v-for="n in 3" :key="n" aria-hidden="true"></span>
          <span class="sr-only">Loading petitions…</span>
        </div>
        <div v-else-if="!cases.length" class="support-empty">
          <i :class="queueError ? 'fe fe-cloud-off' : 'fe fe-inbox'" aria-hidden="true"></i>
          <strong>{{ queueError ? 'Petitions unavailable' : emptyTitle }}</strong>
          <span>{{ queueError ? 'Check the server connection, then refresh.' : emptyHint }}</span>
        </div>
        <ul v-else ref="caseList" class="support-case-list" @keydown.up.prevent="moveFocus(-1)" @keydown.down.prevent="moveFocus(1)">
          <li v-for="item in cases" :key="item.key">
            <button type="button" class="support-case-row" :class="['urgency-' + Math.min(item.urgency || 0, 2), { 'is-selected': selectedKey === item.key, 'is-unread': unread(item) }]"
                    :aria-current="selectedKey === item.key ? 'true' : null" :disabled="busy" @click="selectCase(item.key)">
              <span class="support-avatar" :style="avatarStyle(item.character)" aria-hidden="true">{{ initial(item.character) }}</span>
              <span class="support-row-main">
                <span class="support-row-top">
                  <strong>{{ item.character }}</strong>
                  <span class="support-presence" :class="'presence-' + (item.account_presence || 'unknown')"
                        :title="'Account ' + presenceLabel(item.account_presence).toLowerCase()">{{ presenceLabel(item.account_presence) }}</span>
                  <span v-if="unread(item)" class="support-chip is-accent support-unread" title="New reply from the player">New</span>
                  <time :datetime="dateTime(item.submitted_at)" :title="formatDate(item.submitted_at)">{{ age(item.submitted_at) }}</time>
                </span>
                <span class="support-case-snippet">{{ item.message }}</span>
                <span class="support-row-bottom">
                  <span class="support-chip" :class="statusTone(item.status)">{{ statusLabel(item.status) }}</span>
                  <span v-if="item.urgency > 0" class="support-chip" :class="urgencyTone(item.urgency)"><i class="fe fe-flag" aria-hidden="true"></i> {{ urgency(item.urgency) }}</span>
                  <span v-if="item.messages_on" class="support-chip is-success" title="Messages are on for this case"><i class="fe fe-message-circle" aria-hidden="true"></i> Live</span>
                  <span v-if="item.owner" class="support-row-owner" :class="{ 'is-mine': item.mine }" :title="'Assigned to ' + item.owner">
                    <span class="support-avatar is-xs" :class="{ 'is-accent': item.mine }" :style="item.mine ? null : avatarStyle(item.owner)" aria-hidden="true">{{ initial(item.owner) }}</span>{{ item.mine ? 'You' : item.owner }}
                  </span>
                </span>
              </span>
            </button>
          </li>
        </ul>
        <div v-if="page > 1 || total > 30" class="support-pagination" aria-label="Queue pages">
          <button type="button" class="support-button is-ghost is-icon is-sm" aria-label="Previous page" :disabled="page === 1 || queueLoading" @click="changePage(-1)"><i class="fe fe-chevron-left" aria-hidden="true"></i></button>
          <span>Page {{ page }} of {{ Math.ceil(total / 30) || 1 }}</span>
          <button type="button" class="support-button is-ghost is-icon is-sm" aria-label="Next page" :disabled="page * 30 >= total || queueLoading" @click="changePage(1)"><i class="fe fe-chevron-right" aria-hidden="true"></i></button>
        </div>
      </aside>

      <main class="support-thread" aria-label="Petition detail">
        <button v-if="mobileDetail" type="button" class="support-button is-ghost is-sm support-back" @click="backToQueue"><i class="fe fe-arrow-left" aria-hidden="true"></i> Petitions</button>
        <div v-if="detailLoading && !record" class="support-empty support-placeholder" role="status">
          <i class="fe fe-loader support-spin" aria-hidden="true"></i><span>Loading petition…</span>
        </div>
        <div v-else-if="!record" class="support-empty support-placeholder">
          <i :class="detailError ? 'fe fe-alert-circle' : 'fe fe-inbox'" aria-hidden="true"></i>
          <strong>{{ detailError ? 'Petition unavailable' : 'Select a petition' }}</strong>
          <span>{{ detailError ? 'It may have been removed in-game. Refresh the queue.' : 'Choose a petition from the queue to see its history.' }}</span>
        </div>
        <template v-else>
          <div class="support-thread-header">
            <div class="support-case-meta">
              <span class="support-case-number">Case #{{ caseNumber }}</span>
              <span class="support-chip" :class="statusTone(record.status)">{{ statusLabel(record.status) }}</span>
              <span v-if="record.urgency > 0" class="support-chip" :class="urgencyTone(record.urgency)"><i class="fe fe-flag" aria-hidden="true"></i> {{ urgency(record.urgency) }}</span>
            </div>
            <div class="support-thread-heading">
              <div class="support-identity">
                <span class="support-avatar is-lg" :style="avatarStyle(record.character)" aria-hidden="true">{{ initial(record.character) }}</span>
                <h2>{{ record.character }}</h2>
                <span v-if="record.character_presence" class="support-presence" :class="'presence-' + record.character_presence">
                  {{ characterPresenceLabel(record.character_presence) }}
                </span>
                <span v-if="onAlt" class="support-presence presence-online" :title="record.character + '’s account is playing ' + record.online_character">
                  On {{ record.online_character }}
                </span>
              </div>
              <div class="support-heading-actions">
                <button v-if="canWrite && record.status !== 'resolved' && !record.owner" class="support-button is-primary" type="button" :disabled="busy" @click="updateCase('claim')">
                  <i class="fe fe-user-check" aria-hidden="true"></i> Claim case
                </button>
                <button v-if="canWrite && record.status !== 'resolved' && record.mine" class="support-button" type="button" :disabled="busy" @click="updateCase('release')">
                  <i class="fe fe-user-minus" aria-hidden="true"></i> Release
                </button>
                <button v-if="canWrite && record.status === 'resolved'" class="support-button" type="button" :disabled="busy" @click="updateCase('reopen')">
                  <i class="fe fe-rotate-ccw" aria-hidden="true"></i> Reopen
                </button>
              </div>
            </div>
            <p class="support-subline">
              Filed {{ age(record.submitted_at, true) }} from <strong>{{ record.zone_name || record.zone || 'an unknown zone' }}</strong>
              · account <strong>{{ record.account }}</strong>
            </p>
            <div class="support-tabs support-thread-tabs" role="group" aria-label="Case view">
              <button type="button" :aria-pressed="String(!chatOpen && !evidenceOpen)" @click="showTimeline">
                <i class="fe fe-list" aria-hidden="true"></i> Timeline <span class="support-count">{{ activity.length + 1 }}</span>
              </button>
              <button type="button" :aria-pressed="String(chatOpen)" @click="openChat"><i class="fe fe-message-circle" aria-hidden="true"></i> Live chat</button>
              <button v-if="canReadEvents" type="button" :aria-pressed="String(evidenceOpen)" @click="openEvidence"><i class="fe fe-search" aria-hidden="true"></i> Evidence</button>
            </div>
          </div>

          <div v-if="caseBanner" class="support-callout support-banner" :class="caseBanner.tone === 'info' ? null : 'is-' + caseBanner.tone" role="note">
            <i :class="caseBanner.icon" aria-hidden="true"></i><span>{{ caseBanner.text }}</span>
          </div>

          <support-live-chat v-if="chatOpen" :key="selectedKey" :record="record" :connection-id="connectionId" :can-write="canWrite && record.status !== 'resolved'"
                             :saved-replies="replies" @seen="noteSeen" />
          <support-evidence v-else-if="evidenceOpen" :key="'evidence-' + selectedKey" :record="record" :connection-id="connectionId"
                            :can-read-chat="canReadChat" :can-restore="canParcel && canWrite && record.status !== 'resolved'" @trace="openItemTrace" />
          <div v-else ref="timeline" class="support-timeline">
            <article class="support-event support-original">
              <span class="support-event-icon"><i class="fe fe-message-square" aria-hidden="true"></i></span>
              <div class="support-event-body">
                <div class="support-event-heading"><h3>Original petition <span>· {{ record.character }}</span></h3><time :datetime="dateTime(record.submitted_at)">{{ formatDate(record.submitted_at) }}</time></div>
                <p>{{ record.message }}</p>
              </div>
            </article>
            <article v-if="record.native_note" class="support-event kind-native">
              <span class="support-event-icon"><i class="fe fe-file-text" aria-hidden="true"></i></span>
              <div class="support-event-body"><div class="support-event-heading"><h3>In-game GM note <span v-if="record.last_gm">· {{ record.last_gm }}</span></h3></div><p>{{ record.native_note }}</p></div>
            </article>
            <template v-for="entry in timeline">
              <div v-if="entry.day" :key="'day-' + entry.key" class="support-day" role="separator"><span>{{ entry.day }}</span></div>
              <article :key="entry.key" class="support-event" :class="['kind-' + entry.kind, { 'is-compact': entry.compact }]">
                <span class="support-event-icon"><i :class="eventIcon(entry.kind)" aria-hidden="true"></i></span>
                <div class="support-event-body">
                  <div class="support-event-heading">
                    <h3>
                      {{ eventTitle(entry.kind) }} <span>· {{ entry.actor }}<template v-if="entry.recipient"> to {{ entry.recipient }}</template></span>
                      <span v-if="entry.alt" class="support-chip is-tag support-alt" :title="'Not the character that filed the petition (' + record.character + ')'">alt</span>
                    </h3>
                    <time :datetime="entry.created_at" :title="formatDate(entry.created_at)">{{ clock(entry.created_at) }}</time>
                  </div>
                  <p v-if="entry.body">{{ entry.body }}</p>
                  <p v-if="entry.detail" class="support-event-detail">{{ entry.detail }}</p>
                  <div v-if="(entry.delivery && entry.delivery !== 'sent') || (entry.receipt && entry.receipt.length)" class="support-event-tags">
                    <span v-if="entry.delivery && entry.delivery !== 'sent'" class="support-chip" :class="deliveryTone(entry.delivery)">
                      <i v-if="entry.delivery === 'mail'" class="fe fe-mail" aria-hidden="true"></i> {{ deliveryLabel(entry.delivery) }}
                    </span>
                    <span v-if="entry.receipt && entry.receipt.length" class="support-receipt">Receipt {{ entry.receipt.map(id => '#' + id).join(', ') }}</span>
                  </div>
                </div>
              </article>
            </template>
          </div>

          <form v-if="canWrite && !chatOpen && !evidenceOpen" class="support-note" @submit.prevent="updateCase('note')">
            <label for="support-note"><i class="fe fe-lock" aria-hidden="true"></i> Private staff note</label>
            <textarea id="support-note" v-model="note" class="support-field" rows="2" maxlength="8000" :disabled="busy"
                      placeholder="Only staff can see notes. The player is not notified."
                      @keydown.enter.ctrl.exact.prevent="updateCase('note')" @keydown.enter.meta.exact.prevent="updateCase('note')"></textarea>
            <div class="support-note-actions">
              <span class="support-hint"><kbd class="support-kbd">Ctrl</kbd> + <kbd class="support-kbd">Enter</kbd> to add</span>
              <button type="submit" class="support-button" :disabled="!note.trim() || busy">Add note</button>
            </div>
          </form>
        </template>
      </main>

      <aside v-if="record" class="support-inspector" aria-label="Character and actions">
        <section>
          <h2 class="support-section-label">Character</h2>
          <dl class="support-dl">
            <dt>Name</dt>
            <dd class="support-copyable">
              <span>{{ record.character }}</span>
              <button type="button" class="support-copy" :aria-label="'Copy ' + record.character" :title="copied === 'character' ? 'Copied' : 'Copy name'"
                      @click="copy(record.character, 'character')">
                <i :class="copied === 'character' ? 'fe fe-check' : 'fe fe-copy'" aria-hidden="true"></i>
              </button>
            </dd>
            <dt>Account</dt>
            <dd class="support-copyable">
              <span>{{ record.account }}</span>
              <button type="button" class="support-copy" :aria-label="'Copy account ' + record.account" :title="copied === 'account' ? 'Copied' : 'Copy account'"
                      @click="copy(record.account, 'account')">
                <i :class="copied === 'account' ? 'fe fe-check' : 'fe fe-copy'" aria-hidden="true"></i>
              </button>
            </dd>
            <template v-if="onAlt"><dt>Playing now</dt><dd>{{ record.online_character }}</dd></template>
            <dt>Filed from</dt><dd>{{ record.zone_name || record.zone || 'Unknown zone' }}</dd>
            <dt>Assigned to</dt><dd>{{ record.owner ? (record.mine ? 'You' : record.owner) : 'Unassigned' }}</dd>
            <dt>In-game petition</dt><dd>{{ record.checked_out ? 'Checked out' : record.native_open ? '#' + record.petition_id : 'Cleared' }}</dd>
          </dl>
          <nav v-if="record.character_id" class="support-related" aria-label="Character tools">
            <div v-if="canMove || canInspectRecovery" class="support-action-list">
              <button v-if="canMove" type="button" class="support-action" aria-label="Move character" :disabled="busy || companion === 'missing'"
                      :title="companion === 'missing' ? 'Moves need the Player Support patch on World and zones' : null" @click="delivery = 'move'">
                <i class="fe fe-navigation" aria-hidden="true"></i>
                <span class="support-action-text"><strong>Move character</strong><small>{{ companion === 'missing' ? 'Needs the server patch' : 'Zone, spot or player' }}</small></span>
                <i class="fe fe-chevron-right support-action-chevron" aria-hidden="true"></i>
              </button>
              <button v-if="canInspectRecovery" type="button" class="support-action" aria-label="Corpses" :disabled="busy" @click="delivery = 'corpses'">
                <i class="fe fe-archive" aria-hidden="true"></i>
                <span class="support-action-text"><strong>Corpses</strong><small>Loot and recovery</small></span>
                <i class="fe fe-chevron-right support-action-chevron" aria-hidden="true"></i>
              </button>
              <button v-if="canInspectRecovery" type="button" class="support-action" aria-label="Inventory snapshots" :disabled="busy" @click="delivery = 'snapshots'">
                <i class="fe fe-camera" aria-hidden="true"></i>
                <span class="support-action-text"><strong>Snapshots</strong><small>Find and restore lost items</small></span>
                <i class="fe fe-chevron-right support-action-chevron" aria-hidden="true"></i>
              </button>
            </div>
            <div v-if="characterLinks.length" class="support-links">
              <router-link v-for="link in characterLinks" :key="link.name" :to="link.to">
                <i :class="link.icon" aria-hidden="true"></i> {{ link.name }} <i class="fe fe-arrow-up-right" aria-hidden="true"></i>
              </router-link>
            </div>
          </nav>
        </section>
        <section v-if="history.length" class="support-history" aria-label="Account history">
          <h2 class="support-section-label">Account history <span class="support-count">{{ history.length }}</span></h2>
          <ul>
            <li v-for="item in history" :key="item.key">
              <button type="button" class="support-history-case" @click="selectCase(item.key)">
                <span class="support-history-top">
                  <strong>#{{ item.key.split('-')[0] }}</strong>
                  <span class="support-chip" :class="item.merged ? null : statusTone(item.status)">{{ item.merged ? 'Merged' : statusLabel(item.status) }}</span>
                  <time :datetime="dateTime(item.submitted_at)" :title="formatDate(item.submitted_at)">{{ age(item.submitted_at) }}</time>
                </span>
                <span class="support-history-message">{{ item.character }}: {{ item.message }}</span>
                <span v-if="item.resolution" class="support-history-resolution"><i class="fe fe-check" aria-hidden="true"></i> {{ item.resolution }}</span>
              </button>
              <button v-if="canMerge(item)" type="button" class="support-history-merge" :disabled="busy" :aria-label="'Merge case ' + item.key.split('-')[0] + ' into this case'"
                      title="Move this case's history into the open case" @click="mergeSource = item">
                <i class="fe fe-git-merge" aria-hidden="true"></i> Merge here
              </button>
            </li>
          </ul>
        </section>
        <support-bug-reports :key="'bugs-' + record.key" :record="record" :connection-id="connectionId" :can-write="canWrite" @receipt="recoveryReceipt" />
        <support-linked-accounts v-if="canReadLinked" :key="'linked-' + record.key" :record="record" :connection-id="connectionId" @open-case="selectCase" />
        <section v-if="canWrite && record.status !== 'resolved'" class="support-actions">
          <h2 class="support-section-label">Respond</h2>
          <div class="support-action-list">
            <button type="button" class="support-action" aria-label="Open live chat" :disabled="busy" @click="openChat">
              <i class="fe fe-message-circle" aria-hidden="true"></i>
              <span class="support-action-text"><strong>Live chat</strong><small>{{ chatTileHint }}</small></span>
              <i class="fe fe-chevron-right support-action-chevron" aria-hidden="true"></i>
            </button>
            <button v-if="canDeliver" type="button" class="support-action" aria-label="Reply by mail" :disabled="busy" @click="delivery = 'reply'">
              <i class="fe fe-mail" aria-hidden="true"></i>
              <span class="support-action-text"><strong>Reply by mail</strong><small>To {{ record.character }}’s mailbox</small></span>
              <i class="fe fe-chevron-right support-action-chevron" aria-hidden="true"></i>
            </button>
            <button v-if="canParcel" type="button" class="support-action" aria-label="Send parcel" :disabled="busy" @click="delivery = 'parcel'">
              <i class="fe fe-package" aria-hidden="true"></i>
              <span class="support-action-text"><strong>Send parcel</strong><small>Items via parcel merchant</small></span>
              <i class="fe fe-chevron-right support-action-chevron" aria-hidden="true"></i>
            </button>
          </div>
          <h2 class="support-section-label support-status-label">Status</h2>
          <div class="support-status-actions">
            <button v-if="record.status === 'open'" type="button" class="support-button" :disabled="busy" @click="updateCase('wait')">
              <i class="fe fe-clock" aria-hidden="true"></i> Wait for player
            </button>
            <button v-else type="button" class="support-button" :disabled="busy" @click="updateCase('reopen')">
              <i class="fe fe-play" aria-hidden="true"></i> Resume case
            </button>
            <button type="button" class="support-button support-resolve" :disabled="busy" @click="confirmResolve">
              <i class="fe fe-check-circle" aria-hidden="true"></i> Resolve case
            </button>
          </div>
        </section>
      </aside>
    </div>

    <support-mail-reply v-if="delivery === 'reply' && record" :record="record" :connection-id="connectionId" :saved-replies="replies"
                        @close="delivery = null" @sent="deliverySent('reply')" @reconcile="loadDetail(selectedKey)" />
    <gm-parcel-composer v-if="delivery === 'parcel' && record" :key="record.key"
                        :recipient="{ id: record.character_id, name: record.character }"
                        :case-key="record.key" :connection-id="connectionId" :prefill="parcelPrefill"
                        modal-class="support-modal support-parcel-modal" @close="closeParcel" @sent="deliverySent('parcel')" @reconcile="loadDetail(selectedKey)" />
    <support-snapshots v-if="delivery === 'snapshots' && record" :key="'snapshots-' + record.key" :record="record" :connection-id="connectionId"
                       :can-restore="canParcel && canWrite && record.status !== 'resolved'" @close="delivery = null" @restore="restoreSnapshot" @trace="openItemTrace" />
    <support-items v-if="delivery === 'items' && record" :key="'items-' + record.key" :record="record" :connection-id="connectionId"
                   :can-restore="canParcel && canWrite && record.status !== 'resolved'" :initial-item="itemTrace"
                   @close="closeItemTrace" @restore="prefillParcel" />
    <support-progress v-if="delivery === 'progress' && record" :key="'progress-' + record.key" :record="record" :connection-id="connectionId"
                      :features="features" :can-write="canMove" :can-reload-cache="canReloadCache" :initial-tab="progressTab"
                      @close="delivery = null" @receipt="recoveryReceipt" />
    <support-discipline v-if="delivery === 'discipline' && record" :key="'discipline-' + record.key" :record="record" :connection-id="connectionId"
                        :features="features" :can-sanction="canSanction" @close="delivery = null" @receipt="recoveryReceipt" />
    <support-alerts v-if="panel === 'alerts'" :connection-id="connectionId" :can-write="canWrite" @close="panel = null" @change="alertPrefs = $event" />
    <support-replies v-if="panel === 'replies'" :connection-id="connectionId" :can-write="canWrite" :replies="replies" @close="panel = null" @changed="loadReplies" />
    <support-metrics v-if="panel === 'metrics'" :connection-id="connectionId" @close="panel = null" />
    <b-modal :visible="Boolean(mergeSource)" modal-class="support-modal" title="Merge cases" centered @hide="mergeSource = null" @ok="mergeCase">
      <template v-if="mergeSource && record">
        <p class="support-modal-lead">Merge case <strong>#{{ mergeSource.key.split('-')[0] }}</strong> into <strong>#{{ caseNumber }}</strong>?</p>
        <p class="support-callout support-modal-hint"><i class="fe fe-info" aria-hidden="true"></i>
          <span>Its notes, messages and deliveries move to this case, and it is resolved with a link here. This cannot be undone.</span></p>
      </template>
      <template #modal-footer="{ ok, cancel }">
        <button type="button" class="support-button" @click="cancel()">Cancel</button>
        <button type="button" class="support-button is-primary" @click="ok()">Merge cases</button>
      </template>
    </b-modal>
    <support-recovery v-if="(delivery === 'move' || delivery === 'corpses') && record" :key="record.key"
                      :record="record" :connection-id="connectionId" :initial-mode="delivery" :allow-move="canMove" :features="features"
                      @close="delivery = null" @receipt="recoveryReceipt" />
    <b-modal v-model="resolveOpen" modal-class="support-modal" title="Resolve case" centered
             @shown="$refs.resolution && $refs.resolution.focus()" @ok="updateCase('resolve')">
      <p class="support-modal-lead">Resolve <strong>{{ record ? record.character : '' }}</strong>’s case in Spire?</p>
      <label for="support-resolution" class="support-label">Resolution summary <span class="support-label-hint">(optional)</span></label>
      <div class="support-suggestions support-quick" role="group" aria-label="Common resolutions">
        <button v-for="phrase in resolutionPhrases" :key="phrase" type="button" @click="addResolution(phrase)">{{ phrase }}</button>
      </div>
      <textarea id="support-resolution" ref="resolution" v-model="resolution" class="support-field" rows="3" maxlength="8000"
                placeholder="What was done? This is added to the case timeline."></textarea>
      <p v-if="record && record.native_open" class="support-callout support-modal-hint">
        <i class="fe fe-info" aria-hidden="true"></i><span>Clear petition #{{ record.petition_id }} in-game after resolving it here.</span>
      </p>
      <template #modal-footer="{ ok, cancel }">
        <button type="button" class="support-button" @click="cancel()">Cancel</button>
        <button type="button" class="support-button is-primary" @click="ok()">
          <i class="fe fe-check-circle" aria-hidden="true"></i> Resolve case
        </button>
      </template>
    </b-modal>
  </section>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { canReadAdminApi, canWriteAdminApi } from '@/app/user/server-admin-access'
import { ROUTE } from '@/routes'
import SupportMailReply from './SupportMailReply.vue'
import GmParcelComposer from '../mail-parcels/GMParcelComposer.vue'
import SupportLiveChat from './SupportLiveChat.vue'
import SupportRecovery from './SupportRecovery.vue'
import SupportEvidence from './SupportEvidence.vue'
import SupportSnapshots from './SupportSnapshots.vue'
import SupportAlerts from './SupportAlerts.vue'
import SupportReplies from './SupportReplies.vue'
import SupportMetrics from './SupportMetrics.vue'
import SupportItems from './SupportItems.vue'
import SupportProgress from './SupportProgress.vue'
import SupportDiscipline from './SupportDiscipline.vue'
import SupportLinkedAccounts from './SupportLinkedAccounts.vue'
import SupportBugReports from './SupportBugReports.vue'
import { avatarStyle, deliveryLabel, deliveryTone, desktopNotify, hasUnseenReply, initials, markSeen, playChime, readAlertPrefs } from './support-ui'

const endpoint = 'player-support/cases'
const titles = {
  note: 'Private note', reply: 'Mail sent', parcel: 'Parcel sent', pending: 'Delivery unverified',
  chat_in: 'Player tell', chat_out: 'Game Master tell', chat_on: 'Messages on', chat_off: 'Messages off',
  character_move: 'Character move', corpse_move: 'Corpse move',
  claim: 'Claimed', release: 'Released', wait: 'Waiting for player', resolve: 'Resolved', reopen: 'Reopened', merge: 'Cases merged'
}
const icons = {
  note: 'fe fe-lock', reply: 'fe fe-mail', parcel: 'fe fe-package', pending: 'fe fe-alert-triangle',
  chat_in: 'fe fe-corner-down-right', chat_out: 'fe fe-send', chat_on: 'fe fe-toggle-right', chat_off: 'fe fe-toggle-left',
  character_move: 'fe fe-navigation', corpse_move: 'fe fe-archive',
  claim: 'fe fe-user-check', release: 'fe fe-user-minus', wait: 'fe fe-clock', resolve: 'fe fe-check-circle', reopen: 'fe fe-rotate-ccw',
  merge: 'fe fe-git-merge'
}
// Status changes carry a fixed first line; anything after it is the GM's summary.
const statusKinds = ['claim', 'release', 'wait', 'resolve', 'reopen', 'chat_on', 'chat_off']

export default {
  name: 'PlayerSupport',
  components: {
    SupportMailReply, GmParcelComposer, SupportLiveChat, SupportRecovery, SupportEvidence, SupportSnapshots, SupportAlerts, SupportReplies, SupportMetrics,
    SupportItems, SupportProgress, SupportDiscipline, SupportLinkedAccounts, SupportBugReports
  },
  data () {
    return {
      filters: [{ id: 'open', label: 'Active' }, { id: 'mine', label: 'Mine' }, { id: 'unassigned', label: 'Unassigned' }, { id: 'resolved', label: 'Resolved' }],
      filter: 'open', search: '', page: 1, total: 0, cases: [], connectionId: null, selectedKey: '', record: null, activity: [],
      queueLoading: false, backgroundLoading: false, detailLoading: false, queueError: false, detailError: false, queueVersion: 0, detailVersion: 0,
      mobileDetail: false, searchTimer: null, presenceTimer: null, noticeTimer: null, busy: false, note: '', notice: null, delivery: null,
      resolveOpen: false, resolution: '', chatOpen: false, evidenceOpen: false, refreshedAt: null,
      history: [], replies: [], panel: null, parcelPrefill: null, mergeSource: null, alertPrefs: readAlertPrefs(), lastSummary: null,
      // Patch features of the local World (list response "features"), the item
      // the Items dialog opens with, and the Quests & progress tab to open.
      features: {}, itemTrace: null, progressTab: 'tasks',
      summary: null, companion: 'unknown', now: Date.now(), clockTimer: null, seenVersion: 0, copied: '', copyTimer: null,
      resolutionPhrases: ['Restored the missing item', 'Moved the character to safety', 'Recovered the corpse', 'Explained how it works', 'No action needed']
    }
  },
  computed: {
    canWrite () { return canWriteAdminApi(endpoint) },
    hasRecipient () { return this.record && this.record.character_id && !this.record.checked_out },
    canDeliver () { return this.hasRecipient && canWriteAdminApi('mail-parcels-editor/mail/send') },
    canParcel () {
      return this.hasRecipient && canWriteAdminApi('mail-parcels-editor/parcel/send') && canReadAdminApi('mail-parcels-editor/items')
    },
    canInspectRecovery () {
      return this.record && this.record.character_id && canReadAdminApi('player-operations')
    },
    canMove () {
      return Boolean(this.canInspectRecovery && this.hasRecipient && this.canWrite && this.record.status !== 'resolved' &&
        canWriteAdminApi('player-operations/character/0/relocate'))
    },
    caseNumber () { return this.record ? this.record.key.split('-')[0] : '' },
    canReadEvents () { return canReadAdminApi('player_event_logs') },
    canReadChat () { return canReadAdminApi('player-support-chat-logs') },
    canReadLinked () { return canReadAdminApi('player-support-linked-accounts') },
    canSanction () { return this.canWrite && canWriteAdminApi('player-operations/account/0/sanction') },
    canReloadCache () { return canWriteAdminApi('data-bucket-editor') },
    // Live chat, moves and in-game notices need the Player Support patch on
    // World. Say what is off, and what still works, when it is missing.
    companionNote () {
      if (this.companion === 'missing') {
        return {
          title: 'This game server does not have the Player Support patch',
          text: 'Live chat, character and corpse moves, and in-game notices are off until World and zones are rebuilt with it. ' +
            'The queue, notes, mail, parcels and corpse inspection work as usual. See docs/player-support-chat.md to install it.'
        }
      }
      if (this.companion === 'outdated') {
        return {
          title: 'This game server has an older Player Support patch',
          text: 'Live chat is off until World and zones are rebuilt with the current patch. Moves and notices still work.'
        }
      }
      return null
    },
    chatTileHint () {
      if (this.companion === 'missing' || this.companion === 'outdated') return 'History, and mail if offline'
      return this.record && this.record.messages_on ? 'Messages are on' : 'Tells, or mail if offline'
    },
    // The account is in game on a character other than the one that filed.
    onAlt () {
      const record = this.record
      return Boolean(record && record.online_character && record.online_character.toLowerCase() !== record.character.toLowerCase())
    },
    characterLinks () {
      const id = String(this.record.character_id)
      return [
        { name: 'Player Operations', icon: 'fe fe-user', path: ROUTE.ADMIN_PLAYER_OPERATIONS, query: { character: id }, api: 'player-operations' },
        { name: 'Inventory & Keyring', icon: 'fe fe-briefcase', path: ROUTE.ADMIN_INVENTORY_KEYRING, query: { character: id }, api: 'inventory-keyring' },
        { name: 'Player Event Logs', icon: 'fe fe-list', path: ROUTE.ADMIN_TOOL_PLAYER_EVENT_LOGS, query: { characterId: id }, api: 'player_event_logs' }
      ].filter(link => canReadAdminApi(link.api)).map(link => ({ ...link, to: { path: link.path, query: link.query } }))
    },
    // Explains why actions are missing instead of hiding them silently.
    caseBanner () {
      const record = this.record
      if (!record) return null
      if (record.merged_into) {
        return { tone: 'info', icon: 'fe fe-git-merge', text: `This case was merged into case #${record.merged_into.split('-')[0]}. Its history moved there.` }
      }
      if (record.status === 'resolved') {
        return { tone: 'success', icon: 'fe fe-check-circle', text: 'This case is resolved. Reopen it to reply, send parcels, or move the character.' }
      }
      if (record.checked_out) {
        return { tone: 'warning', icon: 'fe fe-lock', text: `Checked out in-game${record.last_gm ? ' by ' + record.last_gm : ''}. Mail, parcels, chat and moves are paused until it is checked back in.` }
      }
      if (!record.character_id) {
        return { tone: 'warning', icon: 'fe fe-user-x', text: 'The petitioning character was renamed, moved or deleted, so character tools are unavailable.' }
      }
      if (!record.native_open) {
        return { tone: 'info', icon: 'fe fe-info', text: 'The in-game petition was cleared. Live chat is off; resolve the case here when you are done.' }
      }
      return null
    },
    timeline () {
      let previousDay = this.dayLabel(this.record.submitted_at * 1000)
      let previous = null
      return this.activity.map(entry => {
        const day = this.dayLabel(entry.created_at)
        const [first, ...rest] = String(entry.text || '').split('\n')
        const status = statusKinds.includes(entry.kind)
        const delivery = ['parcel', 'pending', 'character_move', 'corpse_move'].includes(entry.kind)
        const chat = entry.kind === 'chat_in' || entry.kind === 'chat_out'
        const character = entry.kind === 'chat_out' ? entry.recipient : entry.kind === 'chat_in' ? entry.actor : ''
        const view = {
          ...entry,
          day: day !== previousDay ? day : '',
          body: status ? rest.join('\n') : delivery ? first : entry.text,
          detail: delivery ? rest.join('\n') : '',
          alt: Boolean(character) && character.toLowerCase() !== this.record.character.toLowerCase(),
          // Consecutive tells from the same side read as one exchange.
          compact: chat && previous && previous.kind === entry.kind && previous.actor === entry.actor &&
            previous.recipient === entry.recipient && day === previousDay
        }
        previousDay = day
        previous = entry
        return view
      })
    },
    emptyTitle () {
      if (this.search.trim()) return 'No matching petitions'
      return { mine: 'Nothing assigned to you', unassigned: 'Every petition has an owner', resolved: 'No resolved cases yet' }[this.filter] || 'No active petitions'
    },
    emptyHint () {
      if (this.search.trim()) return 'Try a character, account, or a phrase from the petition.'
      return { mine: 'Claim a case to see it here.', resolved: 'Resolved cases are kept here for reference.' }[this.filter] ||
        'Petitions players file with /guidehelp or #petition appear here automatically.'
    }
  },
  watch: {
    '$route.query.case' (key) {
      if (this.connectionId !== null && key && key !== this.selectedKey) {
        this.mobileDetail = true
        this.openCase(key)
      }
    },
    notice (value) {
      clearTimeout(this.noticeTimer)
      if (value && !value.error) this.noticeTimer = setTimeout(() => { this.notice = null }, 6000)
    },
    resolveOpen (open) {
      if (open) this.resolution = ''
    }
  },
  mounted () {
    window.addEventListener('resize', this.fitWorkspace)
    // Spire's page zoom can change without a window resize event.
    if (window.ResizeObserver) {
      this.pageObserver = new window.ResizeObserver(() => this.fitWorkspace())
      this.pageObserver.observe(document.documentElement)
    }
    this.fitWorkspace()
  },
  updated () {
    // Banners and notices above the workspace move it; re-measure cheaply.
    this.fitWorkspace()
  },
  created () {
    this.mobileDetail = Boolean(this.$route.query.case)
    this.loadQueue(true)
    this.presenceTimer = setInterval(this.backgroundRefresh, 12000)
    this.clockTimer = setInterval(() => { this.now = Date.now() }, 30000)
    window.addEventListener('keydown', this.onShortcut)
  },
  beforeDestroy () {
    clearTimeout(this.searchTimer)
    clearTimeout(this.noticeTimer)
    clearInterval(this.presenceTimer)
    clearInterval(this.clockTimer)
    clearTimeout(this.copyTimer)
    window.removeEventListener('keydown', this.onShortcut)
    window.removeEventListener('resize', this.fitWorkspace)
    if (this.pageObserver) this.pageObserver.disconnect()
    this.queueVersion++
    this.detailVersion++
  },
  methods: {
    // The space from the workspace to the bottom of the window, so it can fill
    // it. Spire zooms the page at some window sizes, so convert from screen
    // pixels to the page's own pixels.
    fitWorkspace () {
      const workspace = this.$refs.workspace
      if (!workspace) return
      const rect = workspace.getBoundingClientRect()
      const scale = workspace.offsetHeight ? rect.height / workspace.offsetHeight : 1
      if (!scale) return
      const fill = Math.floor((window.innerHeight - (rect.top + window.scrollY)) / scale) - 44
      if (fill !== this.workspaceFill) {
        this.workspaceFill = fill
        this.$el.style.setProperty('--support-fill', fill + 'px')
      }
    },
    statusLabel (status) { return { open: 'Open', waiting: 'Waiting', resolved: 'Resolved' }[status] || 'Open' },
    presenceLabel (status) { return { online: 'Online', offline: 'Offline' }[status] || 'Unknown' },
    characterPresenceLabel (status) { return { online: 'In game', offline: 'Not in game' }[status] || 'Presence unknown' },
    deliveryLabel (status) { return deliveryLabel(status) },
    urgency (value) { return value > 1 ? 'Urgent' : 'Elevated' },
    // Chip tones: colour only where the state means something.
    statusTone (status) { return { waiting: 'is-warning', resolved: 'is-success' }[status] || null },
    urgencyTone (value) { return value > 1 ? 'is-danger' : 'is-warning' },
    deliveryTone (status) { return deliveryTone(status) },
    eventTitle (kind) { return titles[kind] || 'Case updated' },
    eventIcon (kind) { return icons[kind] || 'fe fe-activity' },
    initial (name) { return initials(name) },
    avatarStyle (name) { return avatarStyle(name) },
    // On a phone the case is on screen only after it is opened from the queue.
    caseVisible () {
      return this.mobileDetail || !window.matchMedia('(max-width: 680px)').matches
    },
    unread (item) {
      return this.seenVersion >= 0 && !(item.key === this.selectedKey && this.caseVisible()) && hasUnseenReply(item)
    },
    // A reply counts as seen only while staff can see the case.
    noteSeen (at) {
      if (document.hidden || !this.caseVisible()) return
      markSeen(this.selectedKey, at)
      this.seenVersion++
    },
    // "/" focuses search from anywhere outside a text field.
    onShortcut (event) {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      if (document.querySelector('.modal.show')) return
      event.preventDefault()
      if (this.$refs.search) this.$refs.search.focus()
    },
    clearSearch () {
      if (!this.search) return
      this.search = ''
      this.scheduleSearch()
    },
    async copy (text, which) {
      try {
        await navigator.clipboard.writeText(text)
        this.copied = which
        clearTimeout(this.copyTimer)
        this.copyTimer = setTimeout(() => { this.copied = '' }, 1600)
      } catch (e) {
        this.notice = { error: true, text: 'Copying is not available in this browser.' }
      }
    },
    addResolution (phrase) {
      const current = this.resolution.trim()
      this.resolution = current ? `${current}${/[.!?]$/.test(current) ? '' : '.'} ${phrase}.` : `${phrase}.`
      this.$nextTick(() => { if (this.$refs.resolution) this.$refs.resolution.focus() })
    },
    dateTime (value) { return new Date(value * 1000).toISOString() },
    toDate (value) { return new Date(typeof value === 'number' ? value * 1000 : value) },
    formatDate (value) {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(this.toDate(value))
    },
    clock (value) {
      return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(value instanceof Date ? value : new Date(value))
    },
    dayLabel (value) {
      const date = new Date(value)
      const today = new Date()
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
      if (date.toDateString() === today.toDateString()) return 'Today'
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
      return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' }).format(date)
    },
    age (value, long = false) {
      const minutes = Math.max(0, Math.floor((this.now / 1000 - value) / 60))
      if (minutes < 1) return long ? 'just now' : 'Now'
      const [amount, unit] = minutes < 60 ? [minutes, 'm'] : minutes < 1440 ? [Math.floor(minutes / 60), 'h'] : [Math.floor(minutes / 1440), 'd']
      if (!long) return amount + unit
      const word = { m: 'minute', h: 'hour', d: 'day' }[unit]
      return `${amount} ${word}${amount === 1 ? '' : 's'} ago`
    },
    errorText (error) {
      return (error.response && error.response.data && error.response.data.error) || error.message || 'Request failed'
    },
    dismissNotice () { this.notice = null },
    moveFocus (direction) {
      const rows = Array.from(this.$refs.caseList ? this.$refs.caseList.querySelectorAll('.support-case-row') : [])
      const index = rows.indexOf(document.activeElement)
      const next = rows[Math.max(0, Math.min(rows.length - 1, index + direction))]
      if (next) next.focus()
    },
    backgroundRefresh () {
      if (document.hidden || this.busy || this.queueLoading || this.searchTimer) return
      this.loadQueue(false, true)
      // Pick up notes, deliveries and status changes made by other staff.
      if (this.record && !this.chatOpen && !this.delivery && !this.resolveOpen && !this.detailLoading) {
        this.loadDetail(this.selectedKey, true)
      }
    },
    async loadQueue (initial = false, background = false) {
      const version = ++this.queueVersion
      this.queueLoading = true
      this.backgroundLoading = background
      this.queueError = false
      try {
        const { data } = await SpireApi.v1().get(endpoint, { params: { filter: this.filter, q: this.search.trim(), page: this.page } })
        if (version !== this.queueVersion) return
        if (this.connectionId !== null && this.connectionId !== data.connection_id) {
          this.record = null
          this.selectedKey = ''
          this.activity = []
          this.delivery = null
          this.resolveOpen = false
          this.chatOpen = false
          this.evidenceOpen = false
          this.history = []
          this.note = ''
          this.mobileDetail = false
          this.detailVersion++
          this.$router.replace({ path: this.$route.path, query: {} }).catch(() => {})
        }
        const connectionChanged = this.connectionId !== data.connection_id
        this.connectionId = data.connection_id
        if (connectionChanged) {
          this.lastSummary = null
          this.loadReplies()
        }
        this.cases = data.cases || []
        this.total = data.total || 0
        if (data.summary) {
          this.summary = data.summary
          this.checkArrivals(data.summary)
        }
        this.companion = data.companion || 'unknown'
        this.features = data.features || {}
        this.refreshedAt = new Date()
        if (!this.selectedKey) {
          const key = (initial && this.$route.query.case) || (this.cases[0] && this.cases[0].key)
          if (key) await this.openCase(key)
        }
      } catch (error) {
        if (version === this.queueVersion) {
          if (background) {
            this.cases = this.cases.map(item => ({ ...item, account_presence: 'unknown' }))
            return
          }
          this.queueError = true
          this.notice = { error: true, text: this.errorText(error) }
        }
      } finally {
        if (version === this.queueVersion) {
          this.queueLoading = false
          this.backgroundLoading = false
        }
      }
    },
    async loadDetail (key, background = false) {
      if (!key) return
      const version = ++this.detailVersion
      if (!background) this.detailLoading = true
      this.detailError = false
      try {
        const { data } = await SpireApi.v1().get(endpoint + '/' + encodeURIComponent(key), { params: { connection_id: this.connectionId } })
        if (version !== this.detailVersion) return
        const timeline = this.$refs.timeline
        const following = timeline && timeline.scrollHeight - timeline.scrollTop - timeline.clientHeight < 60
        const grew = (data.activity || []).length > this.activity.length
        this.record = data.case
        this.activity = data.activity || []
        this.history = data.history || []
        if (data.case.last_reply_at) this.noteSeen(data.case.last_reply_at)
        if (!background || (following && grew)) this.$nextTick(this.scrollTimeline)
      } catch (error) {
        if (version === this.detailVersion && !background) {
          this.detailError = true
          this.record = null
          this.activity = []
          this.notice = { error: true, text: this.errorText(error) }
        }
      } finally {
        if (version === this.detailVersion) this.detailLoading = false
      }
    },
    scrollTimeline () {
      const timeline = this.$refs.timeline
      if (timeline) timeline.scrollTop = timeline.scrollHeight
    },
    openCase (key) {
      this.selectedKey = key
      this.record = null
      this.activity = []
      this.history = []
      this.note = ''
      this.delivery = null
      this.parcelPrefill = null
      this.chatOpen = false
      this.evidenceOpen = false
      return this.loadDetail(key)
    },
    selectCase (key) {
      this.mobileDetail = true
      this.notice = null
      // A case loaded in the background is now on screen.
      if (this.record && this.record.key === key && this.record.last_reply_at) this.noteSeen(this.record.last_reply_at)
      if (key !== this.selectedKey || !this.record) this.openCase(key)
      this.$router.replace({ path: this.$route.path, query: { case: key } }).catch(() => {})
    },
    async refresh () {
      this.notice = null
      await this.loadQueue()
      if (this.selectedKey) await this.loadDetail(this.selectedKey)
    },
    scheduleSearch () {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        this.searchTimer = null
        this.page = 1
        this.loadQueue()
      }, 250)
    },
    setFilter (filter) {
      if (this.filter === filter) return
      clearTimeout(this.searchTimer)
      this.searchTimer = null
      this.filter = filter
      this.page = 1
      this.loadQueue()
    },
    changePage (direction) {
      this.page += direction
      this.loadQueue()
    },
    confirmResolve () { this.resolveOpen = true },
    showTimeline () {
      if (!this.chatOpen && !this.evidenceOpen) return
      const reload = this.chatOpen
      this.chatOpen = false
      this.evidenceOpen = false
      if (reload) this.loadDetail(this.selectedKey)
    },
    openChat () {
      this.evidenceOpen = false
      this.chatOpen = true
    },
    openEvidence () {
      this.chatOpen = false
      this.evidenceOpen = true
    },
    // Only an earlier case without a live in-game petition folds into this one.
    canMerge (item) {
      return this.canWrite && this.record && !this.record.merged_into && !item.merged && !item.native_open && this.record.status !== 'resolved'
    },
    async mergeCase () {
      const source = this.mergeSource
      if (!source || !this.record || this.busy) return
      const key = this.selectedKey
      this.busy = true
      this.notice = null
      try {
        await SpireApi.v1().put(`${endpoint}/${encodeURIComponent(key)}/merge`, { source: source.key, revision: this.record.revision },
          { params: { connection_id: this.connectionId } })
        this.notice = { error: false, text: `Case #${source.key.split('-')[0]} merged into this case` }
        await Promise.all([this.loadQueue(), this.loadDetail(key)])
      } catch (error) {
        this.notice = { error: true, text: this.errorText(error) }
        await this.loadDetail(key)
      } finally {
        this.busy = false
        this.mergeSource = null
      }
    },
    async loadReplies () {
      try {
        const { data } = await SpireApi.v1().get('player-support/replies', { params: { connection_id: this.connectionId } })
        this.replies = data.replies || []
      } catch (error) {
        this.replies = []
      }
    },
    // Items missing since a snapshot go to the parcel composer for review.
    restoreSnapshot ({ lines, snapshot }) {
      this.parcelPrefill = {
        lines,
        reason: `Restored items missing since the ${snapshot} inventory snapshot (case #${this.caseNumber})`,
        note: 'Restored by staff in response to your petition.'
      }
      this.delivery = 'parcel'
    },
    // Items chosen in another tool go to the parcel composer for review.
    prefillParcel ({ lines, reason, note }) {
      this.parcelPrefill = { lines, reason, note }
      this.delivery = 'parcel'
    },
    openItemTrace (item) {
      this.itemTrace = item || null
      this.delivery = 'items'
    },
    closeItemTrace () {
      this.delivery = null
      this.itemTrace = null
    },
    closeParcel () {
      this.delivery = null
      this.parcelPrefill = null
    },
    // Alert on petitions and replies that arrived since the last refresh.
    checkArrivals (summary) {
      const previous = this.lastSummary
      this.lastSummary = summary
      if (!previous || !summary) return
      const alerts = []
      if (summary.newest_at > previous.newest_at && summary.newest_key) {
        alerts.push({ title: 'New petition', body: `${summary.newest_character || 'A player'} filed a petition`, tag: 'petition-' + summary.newest_key })
      }
      const replied = summary.reply_at && (!previous.reply_at || new Date(summary.reply_at) > new Date(previous.reply_at))
      const watching = summary.reply_key === this.selectedKey && this.chatOpen && !document.hidden
      if (replied && !watching) {
        alerts.push({ title: 'Player reply', body: `${summary.reply_character || 'A player'} replied to a petition`, tag: 'reply-' + summary.reply_key })
      }
      if (!alerts.length) return
      if (this.alertPrefs.sound) playChime()
      if (this.alertPrefs.desktop && document.hidden) {
        for (const alert of alerts) desktopNotify(alert.title, alert.body, alert.tag)
      }
      if (!document.hidden) this.notice = { error: false, text: alerts.map(alert => alert.body).join(' · ') }
    },
    backToQueue () {
      this.mobileDetail = false
      this.showTimeline()
    },
    async updateCase (action) {
      if (!this.record || this.busy || !this.canWrite) return
      if (action === 'note' && !this.note.trim()) return
      const key = this.selectedKey
      const text = action === 'note' ? this.note.trim() : action === 'resolve' ? this.resolution.trim() : ''
      this.busy = true
      this.notice = null
      try {
        await SpireApi.v1().patch(endpoint + '/' + encodeURIComponent(key), {
          action, text, revision: this.record.revision
        }, { params: { connection_id: this.connectionId } })
        if (action === 'note') this.note = ''
        if (action === 'resolve') this.notice = { error: false, text: `${this.record.character}’s case resolved` }
        await Promise.all([this.loadQueue(), this.loadDetail(key)])
      } catch (error) {
        this.notice = { error: true, text: this.errorText(error) }
        if (error.response && error.response.status === 409) await this.loadDetail(key)
      } finally {
        this.busy = false
      }
    },
    async deliverySent (kind) {
      if (kind === 'reply') this.delivery = null
      // Snapshot items belong to one send only.
      this.parcelPrefill = null
      this.notice = { error: false, text: kind === 'parcel' ? 'Parcel queued for delivery' : 'Reply sent' }
      await this.loadDetail(this.selectedKey)
    },
    async recoveryReceipt (result) {
      if (result) this.notice = { error: ['unconfirmed', 'moved_arrival_unconfirmed', 'moved_notice_unavailable'].includes(result.status), text: result.message }
      await this.loadDetail(this.selectedKey)
    }
  }
}
</script>

<!-- Shared tokens and components; unscoped so they also reach the dialogs. -->
<style src="./support-theme.css"></style>
<style src="./support-parcel.css"></style>

<style scoped>
/* Page layout only. Colours, type, radius and spacing come from support-theme.css. */
.player-support { margin: 0 auto var(--support-space-6); }

/* Page header */
.support-header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--support-space-4); padding: var(--support-space-4) 0; }
.support-title { min-width: 0; }
.support-title h1 { margin: 0; color: var(--support-text); font-size: var(--support-text-2xl); font-weight: 600; line-height: 1.15; letter-spacing: -.01em; }
.support-title p { margin: var(--support-space-1) 0 0; color: var(--support-muted); font-size: var(--support-text-sm); }
.support-header-actions { display: flex; align-items: center; gap: var(--support-space-1); }
.support-live { display: inline-flex; align-items: center; gap: 6px; margin-right: var(--support-space-2); color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600; }
.support-live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--support-success); }
.support-alerts-button { position: relative; }
.support-alert-dot { position: absolute; top: 5px; right: 6px; width: 6px; height: 6px; border-radius: 50%; background: var(--support-accent); }
.support-header-actions > .support-button:last-child { margin-left: var(--support-space-1); }

/* Queue at a glance */
.support-summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--support-space-2); margin-bottom: var(--support-space-4); }
button.support-stat { cursor: pointer; }
button.support-stat:hover { border-color: var(--support-border-strong); background: var(--support-raised); }
.support-stat[aria-pressed="true"] { border-color: var(--support-accent-line); background: var(--support-raised); box-shadow: inset 0 -2px 0 var(--support-accent); }
.support-stat[aria-pressed="true"] > span { color: var(--support-accent-text); }
.support-stat.is-danger > strong { color: var(--support-danger); }

/* Notices */
.support-companion, .support-notice { margin-bottom: var(--support-space-3); }
.support-notice { align-items: center; }
.support-notice > i { margin-top: 0; }
.support-notice > span { flex: 1; }
.support-notice .support-button { margin: -4px -4px -4px 0; }
.support-fade-enter-active, .support-fade-leave-active { transition: opacity 160ms ease; }
.support-fade-enter, .support-fade-leave-to { opacity: 0; }

/* Workspace */
.support-workspace {
  display: grid; grid-template-columns: minmax(260px, min(27%, 420px)) minmax(0, 1fr) minmax(240px, min(22%, 380px));
  min-height: 640px; overflow: hidden;
  border: 1px solid var(--support-border); border-radius: var(--support-radius-lg);
  background: var(--support-bg); box-shadow: var(--support-shadow-panel);
}

/* Queue */
.support-queue { display: flex; flex-direction: column; min-width: 0; border-right: 1px solid var(--support-border); background: var(--support-pane); }
.support-queue-controls { display: grid; gap: var(--support-space-2); padding: var(--support-space-4); border-bottom: 1px solid var(--support-border); }
.support-queue-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--support-space-1); }
.support-queue-title .support-section-label { margin: 0; }
.support-search-key { flex: none; }
.support-skeletons { display: grid; gap: var(--support-space-2); padding: var(--support-space-4); }
.support-skeleton { display: block; height: 64px; border-radius: var(--support-radius); background: linear-gradient(90deg, var(--support-raised) 0%, var(--support-hover) 50%, var(--support-raised) 100%); background-size: 200% 100%; animation: support-shimmer 1.4s ease-in-out infinite; }
@keyframes support-shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }
.support-case-list { flex: 1; max-height: 640px; margin: 0; padding: 0; overflow: auto; list-style: none; }
.support-case-row {
  position: relative; display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: var(--support-space-3); width: 100%;
  padding: var(--support-space-3) var(--support-space-4); border: 0; border-bottom: 1px solid var(--support-border-subtle);
  background: transparent; color: var(--support-text); text-align: left;
  transition: background-color var(--support-duration) ease;
}
.support-case-row::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 3px; background: transparent; }
.support-case-row.urgency-2::before { background: var(--support-danger); }
.support-case-row:hover:not(:disabled) { background: var(--support-hover); }
.support-case-row.is-selected { background: var(--support-selected); }
.support-case-row.is-selected::before { background: var(--support-accent); }
.support-row-main { display: block; min-width: 0; }
.support-row-top, .support-row-bottom { display: flex; align-items: center; gap: var(--support-space-2); min-width: 0; }
.support-row-top strong { min-width: 0; overflow: hidden; color: var(--support-text); font-size: var(--support-text-md); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.support-row-top .support-presence { flex: none; }
.support-row-top .support-unread { flex: none; margin-left: auto; }
.support-row-top time { flex: none; margin-left: auto; color: var(--support-faint); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.support-row-top .support-unread + time { margin-left: 0; }
.support-case-snippet {
  display: -webkit-box; margin: 2px 0 var(--support-space-2); overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
  color: var(--support-muted); font-size: var(--support-text-sm); line-height: 1.45; overflow-wrap: anywhere;
}
.support-case-row.is-unread .support-case-snippet { color: var(--support-text-secondary); }
.support-row-bottom { flex-wrap: wrap; gap: 6px; }
.support-row-owner { display: inline-flex; align-items: center; gap: 6px; min-width: 0; max-width: 50%; margin-left: auto; overflow: hidden; color: var(--support-muted); font-size: var(--support-text-xs); text-overflow: ellipsis; white-space: nowrap; }
.support-row-owner.is-mine { color: var(--support-accent-text); }
.support-pagination { display: flex; align-items: center; justify-content: space-between; padding: var(--support-space-2) var(--support-space-4); border-top: 1px solid var(--support-border); color: var(--support-muted); font-size: var(--support-text-xs); }

/* Thread */
.support-thread { display: flex; flex-direction: column; min-width: 0; }
.support-placeholder { flex: 1; min-height: 360px; }
.support-thread-header { padding: var(--support-space-4) var(--support-space-5) 0; border-bottom: 1px solid var(--support-border); }
.support-case-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-2); color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.support-case-number { font-weight: 600; letter-spacing: .02em; }
.support-thread-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--support-space-3); margin-top: var(--support-space-3); }
.support-identity { display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-2) var(--support-space-3); min-width: 0; }
.support-thread-heading h2 { margin: 0; color: var(--support-text); font-size: var(--support-text-xl); font-weight: 700; line-height: 1.2; letter-spacing: -.01em; overflow-wrap: anywhere; }
.support-heading-actions { display: flex; gap: var(--support-space-2); }
.support-subline { margin: var(--support-space-2) 0 0; color: var(--support-muted); font-size: var(--support-text-sm); }
.support-subline strong { color: var(--support-text-secondary); font-weight: 600; }
.support-thread-tabs { margin-top: var(--support-space-2); }
.support-thread-tabs .support-count { min-width: 18px; padding: 0 5px; }
.support-banner { margin: var(--support-space-3) var(--support-space-5) 0; }

/* Timeline */
.support-timeline { flex: 1; max-height: 560px; padding: var(--support-space-2) var(--support-space-5) var(--support-space-4); overflow: auto; }
.support-event { position: relative; display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: var(--support-space-3); padding: var(--support-space-3) 0 var(--support-space-2); }
.support-event::before { content: ""; position: absolute; top: 0; bottom: 0; left: 13px; width: 1px; background: var(--support-border-subtle); }
.support-timeline > .support-event:first-child::before { top: 24px; }
.support-timeline > .support-event:last-child::before { bottom: calc(100% - 24px); }
.support-event-icon {
  position: relative; z-index: 1; display: grid; place-items: center; width: 28px; height: 28px;
  border: 1px solid var(--support-border); border-radius: 50%; background: var(--support-pane); color: var(--support-muted); font-size: 13px;
}
.support-original .support-event-icon, .kind-chat_out .support-event-icon { border-color: var(--support-accent-line); color: var(--support-accent); }
.kind-pending .support-event-icon { border-color: var(--support-warning-line); color: var(--support-warning); }
.kind-resolve .support-event-icon { border-color: var(--support-success-line); color: var(--support-success); }
.support-event-body { min-width: 0; padding-top: 4px; }
.support-event-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--support-space-1) var(--support-space-3); }
.support-event-heading h3 { margin: 0; color: var(--support-text); font-family: inherit; font-size: var(--support-text-sm); font-weight: 600; line-height: 1.4; }
.support-event-heading h3 span, .support-event-heading time, .support-receipt { color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 400; }
.support-event-heading time { font-variant-numeric: tabular-nums; }
.support-event-body p { margin: 6px 0 0; color: var(--support-text-secondary); font-size: var(--support-text-md); line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.support-event-body .support-event-detail { color: var(--support-muted); font-size: var(--support-text-sm); }
.support-original p, .kind-chat_in p, .kind-chat_out p {
  display: inline-block; max-width: 100%; padding: var(--support-space-2) var(--support-space-3);
  border: 1px solid var(--support-border); border-radius: 0 var(--support-radius-lg) var(--support-radius-lg);
  background: var(--support-raised); color: var(--support-text);
}
.support-original p { display: block; }
.kind-chat_out p { border-color: var(--support-accent-line); background: var(--support-accent-soft); }
.kind-note p, .kind-native p { padding: 6px var(--support-space-3); border-left: 2px solid var(--support-border-strong); border-radius: 0 var(--support-radius) var(--support-radius) 0; background: var(--support-pane); }
.support-alt { margin-left: var(--support-space-1); }
.support-event.is-compact { padding-top: 0; }
.support-event.is-compact .support-event-icon { visibility: hidden; }
.support-event.is-compact .support-event-heading { display: none; }
.support-event.is-compact p { margin-top: 2px; }
.support-event-tags { display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-2); margin-top: var(--support-space-2); }
.support-day { position: relative; display: flex; justify-content: center; margin: var(--support-space-3) 0 var(--support-space-1); }
.support-day::before { content: ""; position: absolute; top: 50%; right: 0; left: 0; height: 1px; background: var(--support-border-subtle); }
.support-day span { position: relative; padding: 0 var(--support-space-3); background: var(--support-bg); color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }

/* Note composer */
.support-note { padding: var(--support-space-3) var(--support-space-5) var(--support-space-4); border-top: 1px solid var(--support-border); background: var(--support-pane); }
.support-note label { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600; }
.support-note textarea { min-height: 60px; }
.support-note-actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--support-space-3); margin-top: var(--support-space-2); }
.support-hint { color: var(--support-faint); font-size: var(--support-text-xs); }

/* Inspector */
.support-inspector { min-width: 0; border-left: 1px solid var(--support-border); background: var(--support-pane); }
.support-inspector section { padding: var(--support-space-4); }
.support-inspector section + section { border-top: 1px solid var(--support-border); }
.support-copyable > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.support-copy {
  display: inline-grid; flex: none; place-items: center; width: 24px; height: 24px; margin: -4px -4px -4px 0;
  border: 0; border-radius: var(--support-radius); background: transparent; color: var(--support-faint); font-size: 12px;
  transition: var(--support-transition);
}
.support-copy:hover { background: var(--support-hover); color: var(--support-text); }
.support-related { display: grid; gap: var(--support-space-3); margin-top: var(--support-space-4); }
.support-links { display: grid; }
.support-links a {
  display: grid; grid-template-columns: 18px minmax(0, 1fr) 14px; align-items: center; gap: 10px; padding: 6px 12px;
  border-radius: var(--support-radius); color: var(--support-text-secondary); font-size: var(--support-text-sm);
  transition: var(--support-transition);
}
.support-links a > i:first-child { color: var(--support-muted); text-align: center; }
.support-links a .fe-arrow-up-right { color: var(--support-faint); }
.support-links a:hover { background: var(--support-hover); color: var(--support-text); text-decoration: none; }
.support-history .support-section-label .support-count { letter-spacing: 0; }
.support-history ul { display: grid; gap: var(--support-space-2); margin: 0; padding: 0; list-style: none; }
.support-history li { overflow: hidden; border: 1px solid var(--support-border); border-radius: var(--support-radius); background: var(--support-bg); }
.support-history-case { display: grid; gap: var(--support-space-1); width: 100%; padding: var(--support-space-2) 10px; border: 0; background: transparent; color: var(--support-text); text-align: left; transition: var(--support-transition); }
.support-history-case:hover { background: var(--support-hover); }
.support-history-top { display: flex; align-items: center; gap: var(--support-space-2); font-size: var(--support-text-sm); }
.support-history-top strong { font-weight: 600; font-variant-numeric: tabular-nums; }
.support-history-top time { margin-left: auto; color: var(--support-faint); font-size: var(--support-text-xs); }
.support-history-message { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.45; }
.support-history-resolution { display: flex; gap: 6px; color: var(--support-text-secondary); font-size: var(--support-text-xs); line-height: 1.45; }
.support-history-resolution i { margin-top: 2px; color: var(--support-success); }
.support-history-merge {
  display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 6px; border: 0;
  border-top: 1px solid var(--support-border-subtle); background: transparent; color: var(--support-muted);
  font-size: var(--support-text-xs); font-weight: 600; transition: var(--support-transition);
}
.support-history-merge:hover:not(:disabled) { background: var(--support-hover); color: var(--support-accent-text); }
.support-history-merge:disabled { opacity: .5; cursor: not-allowed; }
.support-status-label { margin-top: var(--support-space-4); }
.support-status-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: var(--support-space-2); }
.support-resolve > i { color: var(--support-success); }
.support-back { display: none; }

/* Resolve dialog (slot content keeps this component's scope) */
.support-quick { margin-bottom: var(--support-space-2); }

/* Wide, tall screens: the workspace fills the window and each pane scrolls. */
@media (min-width: 1181px) and (min-height: 760px) {
  .support-workspace { height: max(640px, var(--support-fill, calc(100vh - 344px))); min-height: 0; }
  .support-queue, .support-thread { min-height: 0; }
  .support-case-list, .support-timeline { min-height: 0; max-height: none; }
  .support-inspector { overflow-y: auto; }
}
@media (min-width: 1900px) {
  .support-thread-header, .support-note, .support-timeline { padding-right: var(--support-space-6); padding-left: var(--support-space-6); }
  .support-banner { margin-right: var(--support-space-6); margin-left: var(--support-space-6); }
  .support-timeline .support-event-body p { max-width: 1100px; }
  .support-timeline > *, .support-note { max-width: 1500px; }
}
@media (min-width: 2600px) {
  .support-workspace { grid-template-columns: minmax(260px, min(22%, 520px)) minmax(0, 1fr) minmax(240px, min(18%, 460px)); }
}
@media (max-width: 1100px) {
  .support-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 1180px) {
  .support-workspace { grid-template-columns: minmax(230px, 33%) minmax(0, 1fr); }
  .support-queue { grid-row: 1 / span 2; }
  .support-inspector { display: grid; grid-column: 2; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); border-top: 1px solid var(--support-border); border-left: 0; }
  .support-inspector section + section { border-top: 0; border-left: 1px solid var(--support-border); }
  .support-inspector section:nth-child(odd) { border-left: 0; }
  .support-inspector section:nth-child(n + 3) { border-top: 1px solid var(--support-border); }
}
@media (max-width: 680px) {
  .support-header { align-items: center; padding: var(--support-space-3) 0; }
  .support-title h1 { font-size: var(--support-text-xl); }
  .support-button-label { display: none; }
  .support-workspace { display: block; min-height: 0; }
  .support-queue { border-right: 0; }
  .support-thread, .support-inspector { display: none; }
  .support-workspace.show-case .support-queue { display: none; }
  .support-workspace.show-case .support-thread { display: flex; }
  .support-workspace.show-case .support-inspector { display: grid; grid-template-columns: minmax(0, 1fr); border-top: 1px solid var(--support-border); }
  .support-workspace.show-case .support-inspector section + section { border-top: 1px solid var(--support-border); border-left: 0; }
  .support-thread-header, .support-note, .support-timeline { padding-right: var(--support-space-4); padding-left: var(--support-space-4); }
  .support-banner { margin-right: var(--support-space-4); margin-left: var(--support-space-4); }
  .support-back { display: inline-flex; align-self: flex-start; margin: var(--support-space-3) 0 0 var(--support-space-3); }
  .support-title p, .support-live { display: none; }
  .support-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--support-space-2); }
  .support-summary > :first-child { grid-column: span 2; }
  .support-stat { padding: var(--support-space-2) var(--support-space-3); }
  .support-stat > strong { font-size: var(--support-text-lg); }
  .support-search-key { display: none; }
}
</style>
