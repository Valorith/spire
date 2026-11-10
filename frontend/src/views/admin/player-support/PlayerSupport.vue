<template>
  <section class="player-support" :class="['layout-' + layout, { 'is-fill': fill, 'is-case': layout === 'single' && mobileDetail, 'has-wide-summary': wideSummary }]"
           aria-labelledby="player-support-title">
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
        <button type="button" class="support-button support-refresh" title="Refresh the queue and the open case" :disabled="queueLoading || busy" @click="refresh">
          <i class="fe fe-refresh-cw" :class="{ 'support-spin': queueLoading && !backgroundLoading }" aria-hidden="true"></i><span class="support-refresh-label"> Refresh</span>
        </button>
      </div>
    </header>

    <div v-if="summary" class="support-summary" role="group" aria-label="Queue at a glance">
      <!-- Every card filters the queue; the card already chosen goes back to Active. -->
      <button v-for="card in summaryCards" :key="card.id" type="button" class="support-stat" :class="card.tone" :aria-pressed="String(filter === card.id)"
              :title="card.hint" @click="toggleCard(card.id)">
        <strong>{{ card.count }}</strong><span>{{ card.label }}</span>
      </button>
    </div>
    <!-- Holds the summary's place on the first load, so the workspace does not jump. -->
    <div v-else-if="queueLoading" class="support-summary is-loading" aria-hidden="true">
      <span v-for="n in 6" :key="n" class="support-stat support-stat-placeholder"><span class="support-shimmer"></span><span class="support-shimmer"></span></span>
    </div>

    <div v-if="companionNote" class="support-callout is-warning support-companion" role="note">
      <i class="fe fe-cpu" aria-hidden="true"></i>
      <div>
        <strong>{{ companionNote.title }}</strong>
        <p>{{ companionNote.text }}</p>
      </div>
    </div>

    <!-- Notices float over the page instead of pushing it down: a success leaves
         after a few seconds (not while hovered or focused); warnings and errors stay. -->
    <transition name="support-fade">
      <div v-if="notice" class="support-callout support-notice" :class="noticeTone" :role="notice.error || notice.tone === 'warning' ? 'alert' : 'status'"
           @mouseenter="holdNotice(true)" @mouseleave="holdNotice(false)" @focusin="holdNotice(true)" @focusout="holdNotice(false)">
        <i :class="noticeIcon" aria-hidden="true"></i>
        <div class="support-notice-text">
          <span>{{ notice.text }}</span>
          <ul v-if="notice.list && notice.list.length" class="support-notice-list">
            <li v-for="(line, index) in notice.list" :key="index">{{ line }}</li>
          </ul>
        </div>
        <button v-if="notice.undo" type="button" class="support-button is-sm support-notice-undo" :disabled="busy" @click="undoNotice">{{ notice.undo.label }}</button>
        <button type="button" aria-label="Dismiss notification" title="Dismiss" class="support-button is-ghost is-icon is-sm" @click="dismissNotice"><i class="fe fe-x" aria-hidden="true"></i></button>
      </div>
    </transition>

    <div ref="workspace" class="support-workspace" :class="{ 'show-case': mobileDetail }">
      <aside class="support-queue" aria-label="Petition queue">
        <div class="support-queue-controls">
          <div class="support-queue-title">
            <h2 class="support-section-label">Petitions</h2>
            <span v-if="!(queueLoading && !cases.length)" class="support-count" :aria-label="total + (total === 1 ? ' petition' : ' petitions')">{{ total }}</span>
            <span class="support-queue-sort" :title="filter === 'resolved' ? 'The most recently resolved case first' : 'Escalated cases first, then urgent ones, then the oldest'">
              Sorted: {{ filter === 'resolved' ? 'newest first' : 'urgent, then oldest' }}
            </span>
          </div>
          <label class="support-search">
            <i class="fe fe-search" aria-hidden="true"></i>
            <input ref="search" v-model="search" type="search" maxlength="200" placeholder="Character, account or text" aria-label="Search petitions"
                   aria-keyshortcuts="/" @input="scheduleSearch" @keydown.esc="clearSearch">
            <kbd v-if="!search" class="support-kbd support-search-key" title="Press / to search">/</kbd>
          </label>
          <div class="support-queue-tools">
            <select v-model="category" class="support-field support-category-filter" aria-label="Filter by category" @change="setCategory">
              <option value="">All categories</option>
              <option v-for="option in categories" :key="option.id" :value="option.id">{{ option.label }}</option>
            </select>
            <button v-if="canWrite" type="button" class="support-button is-ghost support-select-toggle" :aria-pressed="String(selecting)" @click="toggleSelecting">
              <i class="fe fe-check-square" aria-hidden="true"></i> Select
            </button>
          </div>
          <div v-if="selecting && selected.length" class="support-bulkbar" role="group" aria-label="Selected cases">
            <span class="support-bulkbar-count">{{ selected.length }} selected</span>
            <button type="button" class="support-button is-ghost is-sm" :disabled="busy" @click="cancelSelecting">Cancel</button>
            <span class="support-bulkbar-actions">
              <button type="button" class="support-button is-sm" :disabled="busy" @click="runBatch('claim')">Claim</button>
              <button type="button" class="support-button is-sm" :disabled="busy" @click="batchMode = 'assign'">Assign…</button>
              <button type="button" class="support-button is-sm" :disabled="busy" @click="batchMode = 'category'">Category…</button>
              <button type="button" class="support-button is-sm" :disabled="busy" @click="runBatch('wait')">Wait</button>
              <button type="button" class="support-button is-sm" :disabled="busy" @click="batchMode = 'resolve'">Resolve…</button>
            </span>
          </div>
          <div v-else class="support-segmented support-filters" role="group" aria-label="Filter petitions">
            <button v-for="option in filters" :key="option.id" type="button" :aria-pressed="String(filter === option.id)" @click="setFilter(option.id)">
              {{ option.label }}
            </button>
          </div>
          <!-- What the filters leave out, and the way back to every active petition. -->
          <p v-if="narrowed && !(selecting && selected.length)" class="support-queue-result" role="status">
            <span>{{ resultText }}</span>
            <button type="button" class="support-link" @click="clearFilters">Clear filters</button>
          </p>
        </div>
        <div v-if="queueLoading && !cases.length" class="support-skeletons" role="status">
          <span v-for="n in 4" :key="n" class="support-skeleton" aria-hidden="true">
            <span class="support-shimmer support-skeleton-avatar"></span>
            <span class="support-skeleton-lines">
              <span class="support-shimmer" style="width: 45%"></span>
              <span class="support-shimmer" style="width: 92%"></span>
              <span class="support-shimmer" style="width: 30%"></span>
            </span>
          </span>
          <span class="sr-only">Loading petitions…</span>
        </div>
        <div v-else-if="!cases.length" class="support-empty">
          <i :class="queueError ? 'fe fe-cloud-off' : 'fe fe-inbox'" aria-hidden="true"></i>
          <strong>{{ queueError ? 'Petitions unavailable' : emptyTitle }}</strong>
          <span>{{ queueError ? 'Check the server connection, then refresh.' : emptyHint }}</span>
        </div>
        <ul v-else ref="caseList" class="support-case-list" @keydown.up.prevent="moveFocus(-1)" @keydown.down.prevent="moveFocus(1)">
          <li v-for="item in cases" :key="item.key" class="support-case-item" :class="{ 'is-selecting': selecting }">
            <input v-if="selecting" type="checkbox" class="support-check support-row-check" :checked="selected.includes(item.key)" :disabled="busy"
                   :aria-label="'Select case #' + item.key.split('-')[0] + ', ' + item.character" @change="toggleSelected(item.key, $event.target.checked)">
            <!-- A short name for the row (who, state, urgency, age, a new reply), not every line of it. -->
            <button type="button" class="support-case-row" :class="['urgency-' + Math.min(item.urgency || 0, 2), { 'is-selected': selectedKey === item.key, 'is-unread': unread(item) }]"
                    :aria-label="rowLabel(item)" :aria-current="selectedKey === item.key ? 'true' : null" :disabled="busy" @click="selectCase(item.key)">
              <span class="support-avatar" :style="avatarStyle(item.character)" aria-hidden="true">{{ initial(item.character) }}</span>
              <span class="support-row-main">
                <span class="support-row-top">
                  <strong :title="item.character">{{ item.character }}</strong>
                  <span class="support-presence" :class="'presence-' + (item.account_presence || 'unknown')"
                        :title="'Account ' + presenceLabel(item.account_presence).toLowerCase()">{{ presenceLabel(item.account_presence) }}</span>
                  <span v-if="item.account_notes" class="support-row-notes" :title="noteCount(item.account_notes)">
                    <i class="fe fe-bookmark" aria-hidden="true"></i><span class="sr-only">{{ noteCount(item.account_notes) }}</span>
                  </span>
                  <span v-if="unread(item)" class="support-chip is-accent support-unread" :title="item.last_reply_mail ? 'New mail from the player' : 'New reply from the player'">
                    <i v-if="item.last_reply_mail" class="fe fe-mail" aria-hidden="true"></i> New<span v-if="item.last_reply_mail" class="sr-only"> mail</span>
                  </span>
                  <time :class="{ 'is-aging': item.age_state === 'aging', 'is-overdue': item.age_state === 'overdue' }" :datetime="dateTime(item.submitted_at)"
                        :title="ageTitle(item)"><i v-if="item.age_state === 'aging'" class="fe fe-clock" aria-hidden="true"></i> {{ age(item.submitted_at) }}</time>
                </span>
                <span class="support-case-snippet" :title="(item.message || '').length > 90 ? item.message : null">{{ item.message }}</span>
                <span class="support-row-bottom">
                  <!-- Open is the usual state: only a state that says something gets a chip. -->
                  <span v-if="item.status !== 'open'" class="support-chip" :class="statusTone(item.status)">{{ statusLabel(item.status) }}</span>
                  <span v-if="item.urgency > 0" class="support-chip" :class="urgencyTone(item.urgency)"><i class="fe fe-flag" aria-hidden="true"></i> {{ urgency(item.urgency) }}</span>
                  <span v-if="item.messages_on" class="support-chip is-success" title="Player replies are on for this case"><i class="fe fe-message-circle" aria-hidden="true"></i> Replies on</span>
                  <span v-if="item.escalated" class="support-chip is-danger"><i class="fe fe-alert-octagon" aria-hidden="true"></i> Escalated</span>
                  <span v-if="item.age_state === 'overdue'" class="support-chip is-danger" title="No staff answer for over 2 hours">Overdue</span>
                  <span v-if="item.follow_up" class="support-chip is-warning" title="No answer from the player for 48 hours">Follow up</span>
                  <span v-if="categoryLabel(item.category)" class="support-chip support-row-category" :title="'Category: ' + categoryLabel(item.category)">
                    <i class="fe fe-tag" aria-hidden="true"></i><span>{{ categoryLabel(item.category) }}</span>
                  </span>
                  <!-- Who is on the case always ends the last line, at the right edge, so
                       ownership scans straight down the queue. -->
                  <span v-if="rowMeta(item)" class="support-row-people">
                    <span v-if="item.viewers && item.viewers.length" class="support-row-viewers">
                      <span v-for="viewer in item.viewers.slice(0, 2)" :key="viewer.name" class="support-avatar is-xs" :class="{ 'is-composing': viewer.composing }"
                            :style="avatarStyle(viewer.name)" :title="viewerTitle(viewer)" aria-hidden="true">{{ initial(viewer.name) }}</span>
                      <span class="sr-only">{{ item.viewers.slice(0, 2).map(viewerTitle).join(', ') }}</span>
                    </span>
                    <span v-if="item.owner" class="support-row-owner" :class="{ 'is-mine': item.mine }" :title="'Assigned to ' + item.owner">
                      <span class="support-avatar is-xs" :class="{ 'is-accent': item.mine }" :style="item.mine ? null : avatarStyle(item.owner)" aria-hidden="true">{{ initial(item.owner) }}</span><span class="support-row-owner-name">{{ item.mine ? 'You' : item.owner }}</span>
                    </span>
                    <span v-else-if="item.status !== 'resolved'" class="support-row-owner is-unassigned" title="Nobody is assigned">
                      <span class="support-avatar is-xs is-empty" aria-hidden="true"></span><span class="support-row-owner-name">Unassigned</span>
                    </span>
                  </span>
                </span>
              </span>
            </button>
          </li>
        </ul>
        <p v-if="cases.length" class="support-shortcuts">
          <button type="button" class="support-link" aria-keyshortcuts="Shift+?" title="J and K open the next and previous case" @click="shortcutsOpen = true">
            <kbd class="support-kbd">?</kbd> Keyboard shortcuts
          </button>
        </p>
        <div v-if="page > 1 || total > 30" class="support-pagination" aria-label="Queue pages">
          <button type="button" class="support-button is-ghost is-icon is-sm" aria-label="Previous page" :disabled="page === 1 || queueLoading" @click="changePage(-1)"><i class="fe fe-chevron-left" aria-hidden="true"></i></button>
          <span>Page {{ page }} of {{ Math.ceil(total / 30) || 1 }}</span>
          <button type="button" class="support-button is-ghost is-icon is-sm" aria-label="Next page" :disabled="page * 30 >= total || queueLoading" @click="changePage(1)"><i class="fe fe-chevron-right" aria-hidden="true"></i></button>
        </div>
      </aside>

      <main class="support-thread" aria-label="Petition detail">
        <!-- Phones show the queue or one case; this bar stays at the top of the case and leads back. -->
        <div v-if="layout === 'single' && mobileDetail" class="support-mobilebar">
          <button ref="backButton" type="button" class="support-button is-ghost support-back" @click="backToQueue"><i class="fe fe-arrow-left" aria-hidden="true"></i> Petitions</button>
          <span v-if="record" class="support-mobilebar-case">Case #{{ caseNumber }}</span>
        </div>
        <div v-if="detailLoading && !record" class="support-empty support-placeholder" role="status">
          <i class="fe fe-loader support-spin" aria-hidden="true"></i><span>Loading petition…</span>
        </div>
        <!-- Nothing in the queue to choose from: no "Select a petition". An empty active
             queue is good news; any other empty list is explained in the queue itself. -->
        <div v-else-if="!record && !cases.length && !detailError" class="support-empty support-placeholder support-caught-up">
          <template v-if="caughtUp">
            <i class="fe fe-check-circle" aria-hidden="true"></i>
            <strong>All caught up</strong>
            <span>New petitions open here as players file them.</span>
          </template>
        </div>
        <div v-else-if="!record" class="support-empty support-placeholder">
          <i :class="detailError ? 'fe fe-alert-circle' : 'fe fe-inbox'" aria-hidden="true"></i>
          <strong>{{ detailError ? 'Petition unavailable' : 'Select a petition' }}</strong>
          <span>{{ detailError ? 'It may have been removed in game. Refresh the queue.' : 'Choose a petition from the queue to see its history.' }}</span>
        </div>
        <template v-else>
          <div class="support-thread-header">
            <!-- Who, then the case's state and where it came from, then the one primary action. -->
            <div class="support-thread-heading">
              <span class="support-avatar is-lg" :style="avatarStyle(record.character)" aria-hidden="true">{{ initial(record.character) }}</span>
              <div class="support-identity">
                <div class="support-identity-name">
                  <h2 ref="caseHeading" tabindex="-1">{{ record.character }}</h2>
                  <span v-if="record.character_presence" class="support-presence" :class="'presence-' + record.character_presence">
                    {{ characterPresenceLabel(record.character_presence) }}
                  </span>
                  <span v-if="onAlt" class="support-presence presence-online" :title="record.character + '’s account is playing ' + record.online_character">
                    On {{ record.online_character }}
                  </span>
                </div>
                <div class="support-case-line">
                  <span class="support-case-meta">
                    <span class="support-chip" :class="statusTone(record.status)">{{ statusLabel(record.status) }}</span>
                    <span v-if="record.urgency > 0" class="support-chip" :class="urgencyTone(record.urgency)"><i class="fe fe-flag" aria-hidden="true"></i> {{ urgency(record.urgency) }}</span>
                    <span v-if="record.escalated" class="support-chip is-danger"><i class="fe fe-alert-octagon" aria-hidden="true"></i> Escalated</span>
                    <span v-if="categoryLabel(record.category)" class="support-chip"><i class="fe fe-tag" aria-hidden="true"></i> {{ categoryLabel(record.category) }}</span>
                  </span>
                  <span class="support-subline">
                    <span class="support-case-number">Case #{{ caseNumber }}</span>
                    · Filed {{ age(record.submitted_at, true) }} from <strong>{{ record.zone_name || record.zone || 'an unknown zone' }}</strong>
                    · account <strong>{{ record.account }}</strong>
                  </span>
                </div>
              </div>
              <div class="support-heading-actions">
                <button v-if="canWrite && record.status !== 'resolved' && !record.owner" class="support-button is-primary" type="button" aria-keyshortcuts="C" :disabled="busy" @click="updateCase('claim')">
                  <i class="fe fe-user-check" aria-hidden="true"></i> Claim case
                </button>
                <button v-if="canWrite && record.status !== 'resolved' && record.mine" class="support-button" type="button" :disabled="busy" @click="updateCase('release')">
                  <i class="fe fe-user-minus" aria-hidden="true"></i> Release
                </button>
                <button v-if="canWrite && record.status !== 'resolved' && record.owner && !record.mine" class="support-button" type="button" :disabled="busy"
                        :title="'Assigned to ' + record.owner" @click="updateCase('take')">
                  <i class="fe fe-user-check" aria-hidden="true"></i> Take over
                </button>
                <button v-if="canWrite && record.status === 'resolved'" class="support-button" type="button" :disabled="busy" @click="updateCase('reopen')">
                  <i class="fe fe-rotate-ccw" aria-hidden="true"></i> Reopen
                </button>
              </div>
            </div>
            <div v-if="suggestedCategory" class="support-suggestions support-suggested" role="group" aria-label="Suggested category">
              <button type="button" :disabled="busy" @click="applyCategory(record.suggested_category)">
                <i class="fe fe-tag" aria-hidden="true"></i> Suggested: {{ suggestedCategory }}
              </button>
            </div>
            <div v-else-if="categoryHint" class="support-callout support-triage" role="note">
              <i class="fe fe-compass" aria-hidden="true"></i>
              <span class="support-triage-text">{{ categoryHint.hint }}</span>
              <span v-if="categoryHint.tools.length" class="support-triage-tools" role="group" aria-label="Category tools">
                <button v-for="tool in categoryHint.tools" :key="tool.id" type="button" class="support-button is-sm" :disabled="busy" @click="tool.open">{{ tool.label }}</button>
              </span>
            </div>
            <div class="support-tabbar">
              <div class="support-tabs support-thread-tabs" role="tablist" aria-label="Case view" @keydown="tablistKeydown">
                <button id="support-tab-timeline" type="button" role="tab" :aria-selected="String(caseView === 'timeline')" aria-controls="support-case-panel"
                        aria-keyshortcuts="1" :tabindex="caseView === 'timeline' ? 0 : -1" @click="showTimeline">
                  <i class="fe fe-list" aria-hidden="true"></i> Timeline <span class="support-count">{{ activity.length + 1 }}</span>
                </button>
                <!-- The count is in the name as one string: "Live chat, 1 new player message". -->
                <button id="support-tab-chat" type="button" role="tab" class="support-chat-tab" :class="{ 'is-unread': chatUnread > 0 }" :aria-selected="String(chatOpen)"
                        :aria-label="chatUnread > 0 ? 'Live chat, ' + (chatUnread === 1 ? '1 new player message' : chatUnread + ' new player messages') : null"
                        aria-controls="support-case-panel" aria-keyshortcuts="2" :tabindex="chatOpen ? 0 : -1" @click="openChat">
                  <i class="fe fe-message-circle" aria-hidden="true"></i> Live chat
                  <span v-if="chatUnread > 0" class="support-tab-dot" aria-hidden="true">{{ chatUnread > 9 ? '9+' : chatUnread }}</span>
                </button>
                <button v-if="canReadEvents" id="support-tab-evidence" type="button" role="tab" :aria-selected="String(evidenceOpen)" aria-controls="support-case-panel"
                        aria-keyshortcuts="3" :tabindex="evidenceOpen ? 0 : -1" @click="openEvidence"><i class="fe fe-search" aria-hidden="true"></i> Evidence</button>
              </div>
              <!-- Who else is on the case sits at the end of the tab bar, not on a row of its own. -->
              <div v-if="viewers.length" class="support-viewers" :class="{ 'is-composing': viewers.some(viewer => viewer.composing) }" role="status" :title="viewersText">
                <span class="support-viewers-avatars" aria-hidden="true">
                  <span v-for="viewer in viewers.slice(0, 3)" :key="viewer.name" class="support-avatar is-xs" :class="{ 'is-composing': viewer.composing }"
                        :style="avatarStyle(viewer.name)">{{ initial(viewer.name) }}</span>
                </span>
                <span class="support-viewers-text">{{ viewersText }}</span>
              </div>
            </div>
          </div>
          <div v-if="accountNotes.length" class="support-callout is-accent support-notes-strip">
            <i class="fe fe-bookmark" aria-hidden="true"></i>
            <p class="support-notes-text" :title="accountNotes[0].text">
              <span class="support-notes-quote">{{ accountNotes[0].text }}</span><span class="support-notes-by"> — {{ accountNotes[0].author || 'Staff' }}, {{ shortDate(accountNotes[0].created_at) }}</span>
            </p>
            <span class="support-notes-links">
              <button v-if="accountNotes.length > 1" type="button" class="support-link" @click="notesOpen = true">+{{ accountNotes.length - 1 }} more</button>
              <button type="button" class="support-link" @click="notesOpen = true">Notes</button>
            </span>
          </div>

          <div v-if="caseBanner" class="support-callout support-banner" :class="caseBanner.tone === 'info' ? null : 'is-' + caseBanner.tone" role="note">
            <i :class="caseBanner.icon" aria-hidden="true"></i><span>{{ caseBanner.text }}</span>
          </div>

          <div id="support-case-panel" ref="casePanel" class="support-case-panel" role="tabpanel" :aria-labelledby="'support-tab-' + caseView">
          <support-live-chat v-if="chatOpen" ref="chat" :key="selectedKey" :record="record" :connection-id="connectionId" :can-write="canWrite && record.status !== 'resolved'"
                             :saved-replies="replies" :viewers="viewers" :features="features" :can-mail="canDeliver"
                             @seen="noteSeen" @composing="setComposing" @mail="mailInstead" @loaded="chatLoaded" />
          <support-evidence v-else-if="evidenceOpen" :key="'evidence-' + selectedKey + '-' + evidenceVersion" :record="record" :connection-id="connectionId"
                            :can-read-chat="canReadChat" :can-restore="canParcel && canWrite && record.status !== 'resolved'" @trace="openItemTrace" />
          <div v-else ref="timeline" class="support-timeline" role="region" tabindex="0" aria-label="Case timeline">
            <div v-if="activity.length" class="support-timeline-bar">
              <div class="support-segmented support-timeline-filters" role="group" aria-label="Filter the timeline">
                <button v-for="option in timelineFilters" :key="option.id" type="button" :aria-pressed="String(timelineFilter === option.id)" @click="timelineFilter = option.id">
                  {{ option.label }} <span class="support-timeline-count">{{ timelineCounts[option.id] }}</span>
                </button>
              </div>
            </div>
            <article class="support-event support-original family-player">
              <span class="support-event-icon"><i class="fe fe-message-square" aria-hidden="true"></i></span>
              <div class="support-event-body">
                <div class="support-event-heading">
                  <h3><span class="support-event-kind">Original petition</span> <span class="support-event-actor">· {{ record.character }}</span></h3>
                  <time :datetime="dateTime(record.submitted_at)" :title="timeTitle(record.submitted_at)">{{ formatDate(record.submitted_at) }}</time>
                </div>
                <p>{{ record.message }}</p>
              </div>
            </article>
            <article v-if="record.native_note && timelineFilter !== 'messages'" class="support-event kind-native family-note">
              <span class="support-event-icon"><i class="fe fe-file-text" aria-hidden="true"></i></span>
              <div class="support-event-body">
                <div class="support-event-heading"><h3><span class="support-event-kind">In-game GM note</span> <span v-if="record.last_gm" class="support-event-actor">· {{ record.last_gm }}</span></h3></div>
                <p>{{ record.native_note }}</p>
              </div>
            </article>
            <p v-if="activity.length && !timeline.length" class="support-timeline-empty">Nothing of this kind on the case yet.</p>
            <template v-for="entry in timeline">
              <div v-if="entry.day" :key="'day-' + entry.key" class="support-day" role="separator"><span>{{ entry.day }}</span></div>
              <article :key="entry.key" class="support-event"
                       :class="['family-' + entry.family, 'kind-' + entry.kind, { 'is-compact': entry.compact, 'is-failed': entry.failed, 'is-warning': entry.warn }]">
                <span class="support-event-icon"><i :class="eventIcon(entry.kind, entry.delivery)" aria-hidden="true"></i></span>
                <div class="support-event-body">
                  <div class="support-event-heading">
                    <h3>
                      <span class="support-event-kind">{{ entry.title || eventTitle(entry.kind) }}</span>
                      <span class="support-event-actor">· {{ entry.actor }}<template v-if="entry.recipient"> to {{ entry.recipient }}</template></span>
                      <span v-if="entry.alt" class="support-chip is-tag support-alt" :title="'Not the character that filed the petition (' + record.character + ')'">alt</span>
                    </h3>
                    <time :datetime="entry.created_at" :title="timeTitle(entry.created_at)">{{ clock(entry.created_at) }}</time>
                  </div>
                  <div v-if="entry.subject || entry.body || entry.detail || entry.tagged" class="support-event-content">
                    <p v-if="entry.subject" class="support-event-subject">{{ entry.subject }}</p>
                    <p v-if="entry.body" :class="{ 'support-event-clamp': entry.mail }">{{ entry.body }}</p>
                    <!-- A player's mail shows its opening lines; the whole letter opens in a dialog. -->
                    <button v-if="entry.mail" type="button" class="support-button is-sm support-event-read" aria-haspopup="dialog"
                            :aria-label="'Read message: ' + (entry.subject || 'mail from ' + entry.actor)" @click="mailMessage = entry">
                      <i class="fe fe-book-open" aria-hidden="true"></i> Read message
                    </button>
                    <p v-if="entry.detail" class="support-event-detail">{{ entry.detail }}</p>
                    <div v-if="entry.tagged" class="support-event-tags">
                      <span v-if="entry.delivery && entry.delivery !== 'sent'" class="support-chip" :class="deliveryTone(entry.delivery)" :title="deliveryHint(entry.delivery, entry.kind)">
                        <i v-if="entry.delivery === 'mail' || entry.delivery === 'pending' || entry.failed || entry.warn" :class="deliveryIcon(entry.delivery, entry.kind)" aria-hidden="true"></i>
                        {{ deliveryLabel(entry.delivery, entry.kind) }}
                      </span>
                      <span v-if="entry.receipt && entry.receipt.length" class="support-receipt">Receipt {{ entry.receipt.map(id => '#' + id).join(', ') }}</span>
                    </div>
                  </div>
                </div>
              </article>
            </template>
          </div>

          <form v-if="canWrite && !chatOpen && !evidenceOpen" class="support-note" @submit.prevent="updateCase('note')">
            <label for="support-note"><i class="fe fe-lock" aria-hidden="true"></i> Private staff note</label>
            <textarea id="support-note" ref="noteField" v-model="note" class="support-field" rows="2" maxlength="8000" :disabled="busy"
                      placeholder="Only staff can see notes. The player is not told." aria-keyshortcuts="N"
                      @keydown.enter.ctrl.exact.prevent="addNoteKey" @keydown.enter.meta.exact.prevent="addNoteKey"></textarea>
            <div class="support-note-actions">
              <span class="support-hint support-keys-hint"><kbd class="support-kbd">Ctrl</kbd> + <kbd class="support-kbd">Enter</kbd> to add</span>
              <button type="submit" class="support-button" :disabled="!note.trim() || busy">Add note</button>
            </div>
          </form>
          </div>
        </template>
      </main>

      <aside v-if="record" class="support-inspector" aria-label="Character and actions">
        <section>
          <h2 class="support-section-label">Character</h2>
          <dl class="support-dl">
            <dt>Name</dt>
            <dd class="support-copyable">
              <span>{{ record.character }}</span>
              <support-copy :value="record.character" label="name" />
            </dd>
            <dt>Account</dt>
            <dd class="support-copyable support-dd-wrap">
              <span class="support-dd-main">
                <span :title="record.account">{{ record.account }}</span>
                <support-copy :value="record.account" label="account" />
              </span>
              <button type="button" class="support-link support-dd-link" @click="notesOpen = true">Notes ({{ noteTotal }})</button>
            </dd>
            <template v-if="onAlt"><dt>Playing now</dt><dd>{{ record.online_character }}</dd></template>
            <dt>Filed from</dt><dd>{{ record.zone_name || record.zone || 'Unknown zone' }}</dd>
            <dt>Category</dt>
            <dd class="support-dd-wrap">
              <span :class="{ 'is-empty': !categoryLabel(record.category) }" :title="categoryLabel(record.category) || null">{{ categoryLabel(record.category) || 'None' }}</span>
              <button v-if="canEditCase" type="button" class="support-copy support-dd-edit" aria-label="Change category" title="Change category" :disabled="busy" @click="categoryOpen = true">
                <i class="fe fe-edit-2" aria-hidden="true"></i>
              </button>
            </dd>
            <dt>Assigned to</dt>
            <dd class="support-dd-wrap">
              <span :class="{ 'is-empty': !record.owner }" :title="record.owner || null">{{ record.owner ? (record.mine ? 'You' : record.owner) : 'Unassigned' }}</span>
              <button v-if="canEditCase" type="button" class="support-copy support-dd-edit" aria-label="Change assignee" title="Change assignee" :disabled="busy" @click="assignOpen = true">
                <i class="fe fe-edit-2" aria-hidden="true"></i>
              </button>
            </dd>
            <dt>Reported player</dt>
            <dd class="support-dd-wrap">
              <span :class="{ 'is-empty': !record.subject_character }" :title="record.subject_character || null">{{ record.subject_character || 'None' }}</span>
              <button v-if="canEditCase" type="button" class="support-copy support-dd-edit" :aria-label="(record.subject_character ? 'Change' : 'Set') + ' reported player'"
                      :title="(record.subject_character ? 'Change' : 'Set') + ' reported player'" :disabled="busy" @click="openSubject">
                <i :class="record.subject_character ? 'fe fe-edit-2' : 'fe fe-plus'" aria-hidden="true"></i>
              </button>
            </dd>
            <dt>In-game petition</dt><dd>{{ record.checked_out ? 'Checked out' : record.native_open ? '#' + record.petition_id : 'Cleared' }}</dd>
          </dl>
        </section>
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
            <button v-if="record.status === 'open'" type="button" class="support-button" aria-keyshortcuts="W" :disabled="busy" @click="updateCase('wait')">
              <i class="fe fe-clock" aria-hidden="true"></i> Wait for player
            </button>
            <button v-else type="button" class="support-button" :disabled="busy" @click="updateCase('reopen')">
              <i class="fe fe-play" aria-hidden="true"></i> Resume case
            </button>
            <!-- Gold once the case has an owner: Claim is then gone, so this is the one primary action. -->
            <button type="button" class="support-button support-resolve" :class="{ 'is-primary': record.owner }" aria-keyshortcuts="R" :disabled="busy" @click="confirmResolve">
              <i class="fe fe-check-circle" aria-hidden="true"></i> Resolve case
            </button>
          </div>
        </section>
        <section v-if="record.character_id && (canMove || canInspectRecovery || canDiscipline || characterLinks.length)" class="support-tools">
          <h2 class="support-section-label">Tools</h2>
          <nav class="support-related" aria-label="Character tools">
            <div v-if="canMove || canInspectRecovery || canDiscipline" class="support-action-list">
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
              <button v-if="canInspectRecovery" type="button" class="support-action" aria-label="Items" :disabled="busy" @click="openItemTrace(null)">
                <i class="fe fe-crosshair" aria-hidden="true"></i>
                <span class="support-action-text"><strong>Items</strong><small>{{ canRestoreItems ? 'Find and return an item' : 'Trace an item' }}</small></span>
                <i class="fe fe-chevron-right support-action-chevron" aria-hidden="true"></i>
              </button>
              <button v-if="canInspectRecovery" type="button" class="support-action" aria-label="Quests & progress" :disabled="busy" @click="openProgress('tasks')">
                <i class="fe fe-map" aria-hidden="true"></i>
                <span class="support-action-text"><strong>Quests &amp; progress</strong><small>Tasks, lockouts and flags</small></span>
                <i class="fe fe-chevron-right support-action-chevron" aria-hidden="true"></i>
              </button>
              <button v-if="canDiscipline" type="button" class="support-action" aria-label="Account Action" :disabled="busy" @click="delivery = 'discipline'">
                <i class="fe fe-shield" aria-hidden="true"></i>
                <span class="support-action-text"><strong>Account Action</strong><small>Kick, suspend, ban, chat</small></span>
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
                  <time :datetime="dateTime(item.submitted_at)" :title="'Filed ' + timeTitle(item.submitted_at)">{{ age(item.submitted_at) }}</time>
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
      </aside>
    </div>

    <support-mail-reply v-if="delivery === 'reply' && record" :key="'reply-' + record.key" :record="record" :connection-id="connectionId" :saved-replies="replies"
                        :viewers="viewers" :activity="activity" :features="features" :initial-body="mailDraft" @composing="setComposing"
                        @close="closeMail" @sent="deliverySent('reply', $event)" @reconcile="loadDetail(selectedKey)" />
    <gm-parcel-composer v-if="delivery === 'parcel' && record" :key="record.key"
                        :recipient="{ id: record.character_id, name: record.character }"
                        :case-key="record.key" :connection-id="connectionId" :prefill="parcelPrefill"
                        modal-class="support-modal support-parcel-modal" @close="closeParcel" @sent="deliverySent('parcel')" @reconcile="loadDetail(selectedKey)" />
    <support-snapshots v-if="delivery === 'snapshots' && record" :key="'snapshots-' + record.key" :record="record" :connection-id="connectionId"
                       :can-restore="canParcel && canWrite && record.status !== 'resolved'" :read-only="restoreBlock" @close="delivery = null" @restore="restoreSnapshot" @trace="openItemTrace" />
    <support-items v-if="delivery === 'items' && record" :key="'items-' + record.key" :record="record" :connection-id="connectionId"
                   :can-restore="canParcel && canWrite && record.status !== 'resolved'" :read-only="restoreBlock" :initial-item="itemTrace"
                   @close="closeItemTrace" @restore="prefillParcel" />
    <support-progress v-if="delivery === 'progress' && record" :key="'progress-' + record.key" :record="record" :connection-id="connectionId"
                      :features="features" :can-write="canMove" :read-only="canMove ? '' : toolBlock" :can-reload-cache="canReloadCache" :initial-tab="progressTab"
                      @close="delivery = null" @receipt="recoveryReceipt" />
    <support-discipline v-if="delivery === 'discipline' && record" :key="'discipline-' + record.key" :record="record" :connection-id="connectionId"
                        :features="features" :can-sanction="canSanction" @close="delivery = null" @receipt="recoveryReceipt" />
    <support-alerts v-if="panel === 'alerts'" :connection-id="connectionId" :can-write="canWrite" @close="panel = null" @change="alertPrefs = $event" />
    <support-replies v-if="panel === 'replies'" :connection-id="connectionId" :can-write="canWrite" :replies="replies" @close="panel = null" @changed="loadReplies" />
    <support-metrics v-if="panel === 'metrics'" :connection-id="connectionId" @close="panel = null" />
    <b-modal :visible="Boolean(mergeSource)" modal-class="support-modal" centered scrollable @hide="mergeSource = null" @ok="mergeCase"
             @shown="$refs.mergeCancel && $refs.mergeCancel.focus()">
      <template #modal-title>Merge cases <span class="support-modal-subject">· #{{ caseNumber }}</span></template>
      <template v-if="mergeSource && record">
        <p class="support-modal-lead">Merge case <strong>#{{ mergeSource.key.split('-')[0] }}</strong> into <strong>#{{ caseNumber }}</strong>?</p>
        <dl class="support-dl is-boxed support-merge-summary">
          <dt>Merging</dt><dd>#{{ mergeSource.key.split('-')[0] }} · {{ mergeSource.character }} · filed {{ age(mergeSource.submitted_at) }} ago</dd>
          <dt>Into</dt><dd>#{{ caseNumber }} · {{ record.character }}</dd>
        </dl>
        <p class="support-callout is-warning support-modal-hint"><i class="fe fe-alert-triangle" aria-hidden="true"></i>
          <span>Its notes, messages and deliveries move to this case, and it is resolved with a link here. This cannot be undone.</span></p>
      </template>
      <template #modal-footer="{ ok, cancel }">
        <button ref="mergeCancel" type="button" class="support-button" @click="cancel()">Cancel</button>
        <button type="button" class="support-button is-primary" @click="ok()">Merge cases</button>
      </template>
    </b-modal>
    <support-recovery v-if="(delivery === 'move' || delivery === 'corpses') && record" :key="record.key"
                      :record="record" :connection-id="connectionId" :initial-mode="delivery" :allow-move="canMove" :read-only="canMove ? '' : toolBlock" :features="features"
                      @close="delivery = null" @receipt="recoveryReceipt" />
    <b-modal v-model="resolveOpen" modal-class="support-modal" title="Resolve case" centered scrollable :hide-header-close="resolveBusy"
             :no-close-on-backdrop="resolveBusy" :no-close-on-esc="resolveBusy" @shown="focusResolution">
      <p class="support-modal-lead">Resolve <strong>{{ record ? record.character : '' }}</strong>’s case in Spire?</p>
      <!-- The shared reason field, optional here; Ctrl+Enter resolves. -->
      <support-reason id="support-resolution" ref="resolution" v-model="resolution" class="support-resolve-summary" label="Resolution summary" hint="(optional)" :min="0" :max="8000"
                      :bytes="false" :rows="3" :disabled="resolveBusy" placeholder="What was done? It is shown on the case timeline." @submit="resolveCase(false)" />
      <div class="support-suggestions support-quick" role="group" aria-label="Common resolutions">
        <button v-for="phrase in resolutionPhrases" :key="phrase" type="button" :disabled="resolveBusy" @click="addResolution(phrase)">{{ phrase }}</button>
      </div>
      <template v-if="replies.length">
        <label for="support-resolve-reply" class="support-label">Send a saved reply first <span class="support-label-hint">(optional)</span></label>
        <select id="support-resolve-reply" v-model="resolveReply" class="support-field" :disabled="resolveBusy">
          <option value="">No reply</option>
          <optgroup v-if="resolveReplies.resolving.length" label="Reply and resolve">
            <option v-for="reply in resolveReplies.resolving" :key="reply.id" :value="reply.id">{{ reply.title }}</option>
          </optgroup>
          <optgroup v-if="resolveReplies.others.length" label="Saved replies">
            <option v-for="reply in resolveReplies.others" :key="reply.id" :value="reply.id">{{ reply.title }}</option>
          </optgroup>
        </select>
        <p v-if="resolveUnconfirmedReply && record" class="support-callout is-warning support-resolve-warning" role="alert">
          <i class="fe fe-alert-triangle" aria-hidden="true"></i>
          <span>This reply may have reached {{ record.character }}, but its delivery was not confirmed. Check the conversation and in-game mail before sending it again.</span>
        </p>
        <!-- What the player will read, and how it will reach them. -->
        <div v-else-if="resolveReplyRecord && record" class="support-resolve-preview">
          <p class="support-resolve-hint"><i :class="resolveReplyFits ? 'fe fe-send' : 'fe fe-mail'" aria-hidden="true"></i> {{ resolveReplyRoute }}</p>
          <blockquote class="support-resolve-quote" aria-label="Reply preview">{{ resolveReplyText }}</blockquote>
        </div>
      </template>
      <div v-if="record && (record.native_open || record.checked_out)" class="support-settings support-resolve-close">
        <label for="support-close-petition" class="support-setting" :class="{ 'is-disabled': record.checked_out }">
          <span class="support-setting-text">
            <strong id="support-close-title">Also clear petition #{{ record.petition_id }} in game</strong>
            <small id="support-close-hint">{{ closeHint }}</small>
          </span>
          <input id="support-close-petition" type="checkbox" class="support-switch" aria-labelledby="support-close-title" aria-describedby="support-close-hint"
                 :checked="closeInGame && !record.checked_out" :disabled="record.checked_out || resolveBusy" @change="closeInGame = $event.target.checked">
        </label>
      </div>
      <p v-if="resolveError" class="support-callout is-danger support-resolve-error" role="alert">
        <i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ resolveError }}</span>
      </p>
      <template #modal-footer="{ cancel }">
        <button type="button" class="support-button" :disabled="resolveBusy" @click="cancel()">Cancel</button>
        <button v-if="resolveUnconfirmedReply" type="button" class="support-button" :disabled="resolveBusy" @click="resolveCase(true)">
          <i class="fe fe-send" aria-hidden="true"></i> Send again and resolve
        </button>
        <button type="button" class="support-button is-primary" :disabled="resolveBusy" @click="resolveCase(false)">
          <i :class="resolveReplyRecord && !resolveUnconfirmedReply ? 'fe fe-send' : 'fe fe-check-circle'" aria-hidden="true"></i> {{ resolveAction }}
        </button>
      </template>
    </b-modal>
    <support-assign v-if="assignOpen && record" :key="'assign-' + record.key" :record="record" :connection-id="connectionId" :me="me"
                    @close="assignOpen = false" @saved="assignSaved" @changed="loadDetail(selectedKey, true)" />
    <support-account-notes v-if="notesOpen && record" :key="'notes-' + record.key" :record="record" :connection-id="connectionId" :notes="accountNotes"
                           :can-write="canWrite" @close="notesOpen = false" @changed="notesChanged" />
    <support-batch v-if="batchMode" :mode="batchMode" :count="selected.length" :connection-id="connectionId" :me="me"
                   @close="batchMode = null" @submit="submitBatch" />
    <support-batch v-if="categoryOpen && record" :key="'category-' + record.key" mode="category" :value="record.category || ''" :connection-id="connectionId"
                   @close="categoryOpen = false" @submit="applyCategory($event.category)" />
    <b-modal v-model="subjectOpen" modal-class="support-modal" centered scrollable @shown="$refs.subject && $refs.subject.focus()">
      <template #modal-title>Reported player <span class="support-modal-subject">· #{{ caseNumber }}</span></template>
      <p class="support-modal-lead">The character this petition reports, if any. Evidence can then show their events.</p>
      <label for="support-subject" class="support-label">Character name</label>
      <input id="support-subject" ref="subject" v-model="subjectName" class="support-field" maxlength="64" autocomplete="off" spellcheck="false"
             :disabled="busy" @keydown.enter.prevent="saveSubject(subjectName)">
      <p v-if="subjectError" class="support-feedback is-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ subjectError }}</p>
      <template #modal-footer>
        <button type="button" class="support-button support-subject-clear" :disabled="busy || !(record && record.subject_character)" @click="saveSubject('')">Clear</button>
        <button type="button" class="support-button is-primary" :disabled="busy || !subjectName.trim()" @click="saveSubject(subjectName)">Save</button>
      </template>
    </b-modal>
    <support-mail-view :message="mailMessage" :character="record ? record.character : ''" :can-reply="canWrite && canDeliver"
                       @close="mailMessage = null" @reply="mailInstead('')" />
    <b-modal v-model="shortcutsOpen" modal-class="support-modal" title="Keyboard shortcuts" centered scrollable>
      <p class="support-modal-lead">Single keys work while the cursor is not in a text field.</p>
      <section v-for="group in shortcutGroups" :key="group.title" class="support-shortcut-group">
        <h3 class="support-section-label">{{ group.title }}</h3>
        <dl class="support-dl support-shortcut-list">
          <template v-for="item in group.keys">
            <dt :key="item.text + '-keys'"><kbd v-for="key in item.keys" :key="key" class="support-kbd">{{ key }}</kbd></dt>
            <dd :key="item.text">{{ item.text }}</dd>
          </template>
        </dl>
      </section>
      <template #modal-footer="{ cancel }">
        <button type="button" class="support-button" @click="cancel()">Done</button>
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
import SupportAssign from './SupportAssign.vue'
import SupportAccountNotes from './SupportAccountNotes.vue'
import SupportBatch from './SupportBatch.vue'
import SupportMailView from './SupportMailView.vue'
import SupportCopy from './SupportCopy.vue'
import SupportReason from './SupportReason.vue'
import UserContext from '@/app/user/UserContext'
import { EventBus } from '@/app/event-bus/event-bus'
import {
  avatarStyle, categoryLabel, dayLabel, deliveryHint, deliveryIcon, deliveryLabel, deliveryTone, desktopNotify, fillReply, fitsTell, focusLater, hasUnseenReply, initials, markSeen, newRequestId,
  playChime, readAlertPrefs, readQueuePrefs, readSeen, relativeTime, saveQueuePrefs, supportCategories, tablistKeydown, timeTitle, timelineFamily, timelineFilterOf, touchLayout
} from './support-ui'

const endpoint = 'player-support/cases'
const pageTitle = '[Spire] Player Support'
const titles = {
  note: 'Private note',
  reply: 'Mail sent',
  parcel: 'Parcel sent',
  pending: 'Delivery unverified',
  chat_in: 'Player tell',
  chat_out: 'Game Master tell',
  chat_on: 'Player replies on',
  chat_off: 'Player replies off',
  character_move: 'Character move',
  corpse_move: 'Corpse move',
  claim: 'Claimed',
  release: 'Released',
  wait: 'Waiting for player',
  resolve: 'Resolved',
  reopen: 'Reopened',
  merge: 'Cases merged',
  take: 'Took over',
  assign: 'Assigned',
  escalate: 'Escalated',
  deescalate: 'Escalation cleared',
  categorize: 'Category',
  subject: 'Reported player',
  account_note: 'Account note',
  petition_close: 'In-game petition',
  kick: 'Kick',
  sanction: 'Sanction',
  revoke: 'Chat',
  lockout: 'Lockout',
  task: 'Task',
  corpse_exp: 'Experience',
  chat_view: 'Chat logs viewed',
  linked_view: 'Linked accounts viewed',
  bug_link: 'Bug report',
  afk_mail: 'Forwarded by mail, player AFK'
}
const icons = {
  note: 'fe fe-lock',
  reply: 'fe fe-mail',
  parcel: 'fe fe-package',
  pending: 'fe fe-alert-triangle',
  chat_in: 'fe fe-corner-down-right',
  chat_out: 'fe fe-send',
  chat_on: 'fe fe-toggle-right',
  chat_off: 'fe fe-toggle-left',
  character_move: 'fe fe-navigation',
  corpse_move: 'fe fe-archive',
  claim: 'fe fe-user-check',
  release: 'fe fe-user-minus',
  wait: 'fe fe-clock',
  resolve: 'fe fe-check-circle',
  reopen: 'fe fe-rotate-ccw',
  merge: 'fe fe-git-merge',
  take: 'fe fe-user-check',
  assign: 'fe fe-users',
  escalate: 'fe fe-alert-octagon',
  deescalate: 'fe fe-check',
  categorize: 'fe fe-tag',
  subject: 'fe fe-user-x',
  account_note: 'fe fe-bookmark',
  petition_close: 'fe fe-inbox',
  kick: 'fe fe-log-out',
  sanction: 'fe fe-slash',
  revoke: 'fe fe-mic-off',
  lockout: 'fe fe-clock',
  task: 'fe fe-check-square',
  corpse_exp: 'fe fe-trending-up',
  chat_view: 'fe fe-eye',
  linked_view: 'fe fe-eye',
  bug_link: 'fe fe-alert-circle',
  afk_mail: 'fe fe-mail'
}
// Status changes carry a fixed first line; anything after it is the GM's summary.
// Workflow records whose first line names who or what (assign, category, reported
// player, notes, views, bug links) keep it as the body, so that detail stays visible.
const statusKinds = ['claim', 'release', 'wait', 'resolve', 'reopen', 'chat_on', 'chat_off', 'escalate', 'deescalate']
// Actions on the player's data: the first line says what was done, the rest is the
// reason and the result.
const deliveryKinds = ['parcel', 'pending', 'character_move', 'corpse_move', 'petition_close', 'kick', 'sanction', 'revoke', 'lockout', 'task', 'corpse_exp', 'afk_mail']
// Presence: a heartbeat every 15 s, and "composing" at most every 5 s.
const heartbeatEvery = 15000
const composeEvery = 5000

// A saved reply send that got no answer (no response, or a gateway error) may
// still have reached the player. So may a mail that Mail & Parcels recorded
// but could not confirm.
function replyUnconfirmed (error) {
  const response = error && error.response
  if (!response) return Boolean(error && error.config)
  const message = (response.data && response.data.error) || ''
  if (response.status === 502 || response.status === 504) return true
  // Spire's own 503s refuse before anything is sent and say why; one without
  // that message came from a proxy in front of Spire.
  if (response.status === 503) return !message
  return response.status === 409 && /needs verification/.test(message)
}

// Mail & Parcels' answer to a repeated request ID: the first send arrived.
// A repeated live chat send already answers like the first one.
function replyAlreadySent (error) {
  const response = error && error.response
  return Boolean(response && response.status === 409 && /already recorded/.test((response.data && response.data.error) || ''))
}

export default {
  name: 'PlayerSupport',
  components: {
    SupportMailReply,
    GmParcelComposer,
    SupportLiveChat,
    SupportRecovery,
    SupportEvidence,
    SupportSnapshots,
    SupportAlerts,
    SupportReplies,
    SupportMetrics,
    SupportItems,
    SupportProgress,
    SupportDiscipline,
    SupportLinkedAccounts,
    SupportBugReports,
    SupportAssign,
    SupportAccountNotes,
    SupportBatch,
    SupportMailView,
    SupportCopy,
    SupportReason
  },
  data () {
    // The queue's filter, category and search, as this browser left them.
    const queuePrefs = readQueuePrefs()
    return {
      filters: [{ id: 'open', label: 'Active' }, { id: 'mine', label: 'Mine' }, { id: 'unassigned', label: 'Unassigned' }, { id: 'resolved', label: 'Resolved' }],
      filter: queuePrefs.filter,
      search: queuePrefs.search,
      page: 1,
      total: 0,
      cases: [],
      connectionId: null,
      selectedKey: '',
      record: null,
      activity: [],
      queueLoading: false,
      backgroundLoading: false,
      detailLoading: false,
      queueError: false,
      detailError: false,
      queueVersion: 0,
      detailVersion: 0,
      mobileDetail: false,
      // Panes by the page's own width (Spire's sidebar and zoom change it, so not
      // the window's): wide = queue, case and inspector side by side; split = queue
      // and case, the inspector under the case; single = the queue or one case.
      layout: 'wide',
      // Wide and tall enough: the workspace fills the window and each pane scrolls.
      fill: false,
      wideSummary: true,
      // Where the phone queue was scrolled to before a case opened.
      queueScroll: 0,
      searchTimer: null,
      presenceTimer: null,
      noticeTimer: null,
      busy: false,
      note: '',
      notice: null,
      delivery: null,
      resolveOpen: false,
      resolution: '',
      chatOpen: false,
      evidenceOpen: false,
      refreshedAt: null,
      history: [],
      replies: [],
      panel: null,
      parcelPrefill: null,
      // Text Live chat hands to Reply by mail when a tell cannot go.
      mailDraft: '',
      mergeSource: null,
      alertPrefs: readAlertPrefs(),
      lastSummary: null,
      // Patch features of the local World (list response "features"), the item
      // the Items dialog opens with, and the Quests & progress tab to open.
      features: {},
      itemTrace: null,
      progressTab: 'tasks',
      summary: null,
      companion: 'unknown',
      now: Date.now(),
      clockTimer: null,
      seenVersion: 0,
      // The latest player message seen in Live chat on the open case; newer
      // ones make the Live chat tab pulse.
      chatSeenAt: '',
      timelineFilter: 'all',
      timelineFilters: [
        { id: 'all', label: 'All' }, { id: 'messages', label: 'Messages' }, { id: 'actions', label: 'Actions' }, { id: 'notes', label: 'Notes' }
      ],
      // A success notice stays while the pointer or focus is on it.
      noticeHeld: false,
      // A dialog just closed and its focus return has not run yet (dialogActive).
      dialogSettling: false,
      // The latest key's pending focus (focusWhenReady); older ones give way.
      focusToken: 0,
      shortcutsOpen: false,
      // A player's mail open in the reading dialog.
      mailMessage: null,
      shortcutGroups: [
        {
          title: 'Queue',
          keys: [
            { keys: ['/'], text: 'Search petitions' },
            { keys: ['J', 'K'], text: 'Open the next or previous case' },
            { keys: ['↑', '↓'], text: 'Move through the queue while a petition has focus' },
            { keys: ['Esc'], text: 'Clear the search while it has focus' }
          ]
        },
        {
          title: 'Open case',
          keys: [
            { keys: ['1', '2', '3'], text: 'Timeline, Live chat or Evidence' },
            { keys: ['N'], text: 'Write a private staff note' },
            { keys: ['M'], text: 'Write to the player in Live chat' },
            { keys: ['C'], text: 'Claim the case' },
            { keys: ['W'], text: 'Wait for player' },
            { keys: ['R'], text: 'Resolve the case' }
          ]
        },
        {
          title: 'While typing',
          keys: [
            { keys: ['Enter'], text: 'Send a Live chat message' },
            { keys: ['Ctrl', 'Enter'], text: 'Add the staff note, or confirm a dialog' },
            { keys: ['Ctrl', '.'], text: 'All replies, in the Live chat message box' },
            { keys: ['Esc'], text: 'Close a dialog' }
          ]
        },
        { title: 'Help', keys: [{ keys: ['?'], text: 'Show these shortcuts' }] }
      ],
      // The signed-in user, the queue's category filter, and select mode.
      me: null,
      category: queuePrefs.category,
      categories: supportCategories,
      selecting: false,
      selected: [],
      batchMode: null,
      // Other staff on the open case, and this viewer's own presence.
      viewers: [],
      composing: false,
      presenceKey: '',
      lastPresenceAt: 0,
      heartbeatTimer: null,
      composeTimer: null,
      accountNotes: [],
      evidenceVersion: 0,
      assignOpen: false,
      notesOpen: false,
      categoryOpen: false,
      subjectOpen: false,
      subjectName: '',
      subjectError: '',
      // Resolve dialog: in-game close, optional saved reply, and its one send.
      closeInGame: true,
      resolveReply: '',
      resolveBusy: false,
      resolveError: '',
      resolveSentId: null,
      resolveRequestId: '',
      // Saved reply IDs whose send from the Resolve dialog was not confirmed,
      // by case, so reopening the dialog cannot repeat the send unseen.
      resolveUnconfirmed: {},
      resolutionPhrases: ['Restored the missing item', 'Moved the character to safety', 'Recovered the corpse', 'Explained how it works', 'No action needed']
    }
  },
  computed: {
    // The summary cards, each one a queue filter. Red only for a count that needs someone.
    summaryCards () {
      const summary = this.summary || {}
      const card = (id, label, count, alarm, hint) => ({ id, label, hint, count: count || 0, tone: !count ? 'is-quiet' : alarm ? 'is-danger' : null })
      return [
        card('open', 'Active', summary.active, false, 'Every case not yet resolved'),
        card('urgent', 'Urgent', summary.urgent, true, 'Filed as urgent'),
        card('unassigned', 'Unassigned', summary.unassigned, false, 'Nobody has the case yet'),
        card('waiting', 'Waiting on player', summary.waiting, false, 'Marked Wait for player'),
        card('mine', 'Assigned to you', summary.mine, false, 'Cases you have'),
        card('attention', 'Needs attention', summary.attention, true, 'Escalated, overdue or due a follow-up')
      ]
    },
    // A filter, category or search leaves cases out of the queue.
    narrowed () {
      return !this.queueError && (this.filter !== 'open' || Boolean(this.category) || Boolean(this.search.trim()))
    },
    resultText () {
      const count = this.total
      if (this.filter === 'resolved') return `Showing ${count} resolved ${count === 1 ? 'case' : 'cases'}`
      const active = this.summary ? this.summary.active : count
      return `Showing ${count} of ${active} active ${active === 1 ? 'petition' : 'petitions'}`
    },
    caseView () { return this.chatOpen ? 'chat' : this.evidenceOpen ? 'evidence' : 'timeline' },
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
    // The reload is a Player Support write as well as a Data Buckets one.
    canReloadCache () { return this.canWrite && canWriteAdminApi('data-bucket-editor') },
    canEditCase () { return Boolean(this.canWrite && this.record && this.record.status !== 'resolved') },
    canDiscipline () { return Boolean(this.record && this.canWrite && canReadAdminApi('player-operations/account/0/sanction')) },
    canRestoreItems () { return Boolean(this.canParcel && this.canWrite && this.record.status !== 'resolved') },
    // Why the character tools cannot change anything on this case, said in
    // their footers; '' when they can (or when the tool is not offered at all).
    toolBlock () {
      const record = this.record
      if (!record) return ''
      if (record.status === 'resolved') return 'The case is resolved. Reopen it to make changes.'
      if (record.checked_out) return `Petition #${record.petition_id} is checked out in game.`
      if (!this.canWrite || !canWriteAdminApi('player-operations/character/0/relocate')) return 'Changes need Player Operations write access.'
      return ''
    },
    // The same for returning items by parcel from Items and Snapshots.
    restoreBlock () {
      const record = this.record
      if (!record) return ''
      if (record.status === 'resolved') return 'The case is resolved. Reopen it to return items.'
      if (record.checked_out) return `Petition #${record.petition_id} is checked out in game.`
      if (!this.canParcel || !this.canWrite) return 'Returning items needs Mail & Parcels write access.'
      return ''
    },
    noteTotal () { return Math.max(this.accountNotes.length, (this.record && this.record.account_notes) || 0) },
    // Offered only until a category is set; applying it is the GM's call.
    suggestedCategory () {
      const record = this.record
      if (!record || record.category || !record.suggested_category || !this.canEditCase) return ''
      return categoryLabel(record.suggested_category)
    },
    // The category's triage line, with the tools this viewer may open.
    categoryHint () {
      const record = this.record
      if (!record || !record.category || record.status === 'resolved') return null
      const category = supportCategories.find(item => item.id === record.category)
      if (!category || !category.hint) return null
      const tools = {
        evidence: { label: 'Evidence', allowed: this.canReadEvents, open: this.openEvidenceItems },
        items: { label: 'Items', allowed: this.canInspectRecovery, open: () => this.openItemTrace(null) },
        corpses: { label: 'Corpses', allowed: this.canInspectRecovery, open: () => { this.delivery = 'corpses' } },
        move: { label: 'Move character', allowed: this.canMove && this.companion !== 'missing', open: () => { this.delivery = 'move' } },
        tasks: { label: 'Tasks', allowed: this.canInspectRecovery, open: () => this.openProgress('tasks') },
        lockouts: { label: 'Lockouts', allowed: this.canInspectRecovery, open: () => this.openProgress('lockouts') },
        discipline: { label: 'Account Action', allowed: this.canDiscipline, open: () => { this.delivery = 'discipline' } }
      }
      return { hint: category.hint, tools: category.tools.map(id => ({ id, ...tools[id] })).filter(tool => tool.allowed).slice(0, 2) }
    },
    viewersText () {
      const join = names => names.length > 2 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names.join(' and ')
      const writing = this.viewers.filter(viewer => viewer.composing).map(viewer => viewer.name)
      const watching = this.viewers.filter(viewer => !viewer.composing).map(viewer => viewer.name)
      const parts = []
      if (writing.length) parts.push(`${join(writing)} ${writing.length > 1 ? 'are' : 'is'} writing to the player`)
      if (watching.length) parts.push(`${join(watching)} ${watching.length > 1 ? 'are' : 'is'} also viewing`)
      return parts.join(' · ')
    },
    resolveReplies () {
      return { resolving: this.replies.filter(reply => reply.resolves), others: this.replies.filter(reply => !reply.resolves) }
    },
    resolveReplyRecord () {
      return this.resolveReply === '' ? null : this.replies.find(reply => reply.id === this.resolveReply) || null
    },
    // The chosen reply, when its last send to this case was not confirmed.
    resolveUnconfirmedReply () {
      const reply = this.resolveReplyRecord
      return reply && this.resolveUnconfirmed[this.resolveMemoKey(this.selectedKey)] === reply.id ? reply : null
    },
    resolveReplyText () { return this.resolveReplyRecord && this.record ? fillReply(this.resolveReplyRecord.body, this.record) : '' },
    resolveReplyFits () { return fitsTell(this.resolveReplyText) },
    // Mirrors sendSavedReply: a tell when the player is in game and it fits, otherwise mail.
    resolveReplyRoute () {
      const record = this.record
      if (!record) return ''
      if (this.resolveReplyFits) return `Sent as a tell if ${record.online_character || record.character} is in game, otherwise by in-game mail to ${record.character}.`
      const why = this.resolveReplyText.length > 200 ? 'it is too long for a tell' : 'it has characters a tell cannot carry'
      return `Mailed to ${record.character} as “Response to your petition”: ${why}.`
    },
    resolveAction () {
      if (this.resolveUnconfirmedReply) return 'Resolve without sending again'
      return this.resolveReplyRecord ? 'Send and resolve' : 'Resolve case'
    },
    closeHint () {
      const record = this.record
      if (!record) return ''
      if (record.checked_out) return `Checked out in game${record.last_gm ? ' by ' + record.last_gm : ''}; clear it there.`
      return this.features && this.features.close_petition
        ? 'The player can file a new petition right away.'
        : 'Removes it from the database. Zones refresh their petition list on the next petition.'
    },
    noticeTone () {
      if (!this.notice) return null
      return this.notice.error ? 'is-danger' : this.notice.tone === 'warning' ? 'is-warning' : 'is-success'
    },
    noticeIcon () {
      if (!this.notice) return null
      return this.notice.error ? 'fe fe-alert-circle' : this.notice.tone === 'warning' ? 'fe fe-alert-triangle' : 'fe fe-check-circle'
    },
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
      return this.record && this.record.messages_on ? 'Player replies on' : 'Tells, or mail if offline'
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
        return { tone: 'warning', icon: 'fe fe-lock', text: `Checked out in game${record.last_gm ? ' by ' + record.last_gm : ''}. Mail, parcels, chat and moves are paused until it is checked back in.` }
      }
      if (!record.character_id) {
        return { tone: 'warning', icon: 'fe fe-user-x', text: 'The petitioning character was renamed, moved or deleted, so character tools are unavailable.' }
      }
      if (!record.native_open) {
        return { tone: 'info', icon: 'fe fe-info', text: 'The in-game petition was cleared. Live chat is off; resolve the case here when you are done.' }
      }
      return null
    },
    timelineCounts () {
      const counts = { all: this.activity.length, messages: 0, actions: 0, notes: 0 }
      for (const entry of this.activity) counts[timelineFilterOf(timelineFamily(entry.kind))]++
      return counts
    },
    timeline () {
      let previousDay = this.dayLabel(this.record.submitted_at * 1000)
      let previous = null
      const shown = this.timelineFilter === 'all'
        ? this.activity
        : this.activity.filter(entry => timelineFilterOf(timelineFamily(entry.kind)) === this.timelineFilter)
      return shown.map(entry => {
        const day = this.dayLabel(entry.created_at)
        const [first, ...rest] = String(entry.text || '').split('\n')
        const status = statusKinds.includes(entry.kind)
        const delivery = deliveryKinds.includes(entry.kind)
        const chat = entry.kind === 'chat_in' || entry.kind === 'chat_out'
        const character = entry.kind === 'chat_out' ? entry.recipient : entry.kind === 'chat_in' ? entry.actor : ''
        const failed = entry.delivery === 'failed'
        const warn = entry.kind === 'pending' || entry.delivery === 'unconfirmed' || entry.delivery === 'pending'
        const view = {
          ...entry,
          family: timelineFamily(entry.kind),
          title: entry.kind === 'chat_in' && entry.delivery === 'mail' ? 'Player mail' : entry.kind === 'chat_out' && entry.delivery === 'mail' ? 'Game Master mail' : '',
          mail: entry.kind === 'chat_in' && entry.delivery === 'mail',
          day: day !== previousDay ? day : '',
          body: status ? rest.join('\n') : delivery ? first : entry.text,
          detail: delivery ? rest.join('\n') : '',
          failed,
          warn,
          tagged: Boolean((entry.delivery && entry.delivery !== 'sent') || (entry.receipt && entry.receipt.length)),
          alt: Boolean(character) && character.toLowerCase() !== this.record.character.toLowerCase(),
          // Messages from the same side within five minutes read as one exchange.
          compact: chat && previous && previous.kind === entry.kind && previous.actor === entry.actor &&
            previous.recipient === entry.recipient && previous.delivery === entry.delivery && day === previousDay &&
            new Date(entry.created_at) - new Date(previous.created_at) < 5 * 60000
        }
        previousDay = day
        previous = entry
        return view
      })
    },
    // Player messages on the open case newer than the last one seen in Live chat.
    chatUnread () {
      if (this.chatOpen || !this.record) return 0
      const seen = this.chatSeenAt ? new Date(this.chatSeenAt) : null
      return this.activity.filter(entry => entry.kind === 'chat_in' && (!seen || new Date(entry.created_at) > seen)).length
    },
    // Cases with a player reply this browser has not seen, for the tab title.
    unreadCount () {
      return this.cases.filter(item => this.unread(item)).length
    },
    caughtUp () {
      return this.filter === 'open' && !this.queueLoading && !this.queueError && !this.search.trim() && !this.category
    },
    emptyTitle () {
      if (this.search.trim()) return 'No matching petitions'
      if (this.category) return 'No cases in this category'
      return {
        urgent: 'No urgent cases',
        mine: 'Nothing assigned to you',
        unassigned: 'Every petition has an owner',
        resolved: 'No resolved cases yet',
        attention: 'Nothing needs attention',
        waiting: 'No cases are waiting'
      }[this.filter] || 'No active petitions'
    },
    emptyHint () {
      if (this.search.trim()) return 'Try a character, account, or a phrase from the petition.'
      if (this.category) return 'Choose All categories to see every case.'
      return {
        urgent: 'Cases filed as urgent appear here.',
        mine: 'Claim a case to see it here.',
        resolved: 'Resolved cases are kept here for reference.',
        attention: 'Overdue, escalated and follow-up cases appear here.',
        waiting: 'Cases marked Wait for player appear here.'
      }[this.filter] || 'Petitions players file with #petition appear here.'
    }
  },
  watch: {
    '$route.query.case' (key) {
      if (this.connectionId !== null && key && key !== this.selectedKey) {
        this.mobileDetail = true
        this.openCase(key)
      }
    },
    notice () {
      this.noticeHeld = false
      this.scheduleNotice()
    },
    resolveOpen (open) {
      if (!open) return
      this.resolution = ''
      this.closeInGame = true
      this.resolveReply = ''
      this.resolveError = ''
      this.resolveSentId = null
      this.resolveRequestId = newRequestId()
      const unconfirmed = this.resolveUnconfirmed[this.resolveMemoKey(this.selectedKey)]
      if (unconfirmed && this.replies.some(reply => reply.id === unconfirmed)) this.resolveReply = unconfirmed
    },
    // A different reply is a different send.
    resolveReply () { this.resolveRequestId = newRequestId() },
    // "(2) [Spire] Player Support" while two cases have unseen replies.
    unreadCount: {
      immediate: true,
      handler (count) { document.title = (count ? `(${count}) ` : '') + pageTitle }
    },
    selectedKey () { this.timelineFilter = 'all' }
  },
  mounted () {
    window.addEventListener('resize', this.fitWorkspace)
    // Spire's page zoom can change without a window resize event.
    if (window.ResizeObserver) {
      this.pageObserver = new window.ResizeObserver(() => this.fitWorkspace())
      this.pageObserver.observe(document.documentElement)
      this.pageObserver.observe(this.$el)
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
    this.heartbeatTimer = setInterval(this.heartbeat, heartbeatEvery)
    window.addEventListener('keydown', this.onShortcut)
    this.$root.$on('bv::modal::hidden', this.onDialogHidden)
    UserContext.getUser().then(user => { this.me = user && user.id !== undefined ? user : null }).catch(() => {})
  },
  beforeDestroy () {
    clearTimeout(this.searchTimer)
    clearTimeout(this.noticeTimer)
    clearInterval(this.presenceTimer)
    clearInterval(this.clockTimer)
    clearInterval(this.heartbeatTimer)
    clearTimeout(this.composeTimer)
    if (this.presenceKey) this.sendPresence('left', this.presenceKey)
    window.removeEventListener('keydown', this.onShortcut)
    this.$root.$off('bv::modal::hidden', this.onDialogHidden)
    clearTimeout(this.settleTimer)
    window.removeEventListener('resize', this.fitWorkspace)
    document.title = pageTitle
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
      if (!workspace || !this.$el) return
      const width = this.$el.clientWidth
      if (width) {
        const layout = width < 640 ? 'single' : width < 1000 ? 'split' : 'wide'
        if (layout !== this.layout) this.layout = layout
        const wideSummary = width >= 1040
        if (wideSummary !== this.wideSummary) this.wideSummary = wideSummary
      }
      const rect = workspace.getBoundingClientRect()
      const scale = workspace.offsetHeight ? rect.height / workspace.offsetHeight : 1
      if (!scale) return
      const fill = Math.floor((window.innerHeight - (rect.top + window.scrollY)) / scale) - 44
      if (fill !== this.workspaceFill) {
        this.workspaceFill = fill
        this.$el.style.setProperty('--support-fill', fill + 'px')
      }
      // The window's height in the page's own pixels, for panes that fill it.
      const viewport = Math.floor(window.innerHeight / scale)
      if (viewport !== this.viewportHeight) {
        this.viewportHeight = viewport
        this.$el.style.setProperty('--support-vh', viewport + 'px')
      }
      const filling = this.layout === 'wide' && fill >= 480
      if (filling !== this.fill) this.fill = filling
      // Notices sit over the bottom of the queue when it is beside the case.
      const queue = this.$el.querySelector('.support-queue')
      if (queue && this.layout === 'wide') {
        const box = queue.getBoundingClientRect()
        const left = Math.round(box.left / scale + 12) + 'px'
        const width = Math.round(Math.max(280, box.width / scale - 24)) + 'px'
        if (left !== this.toastLeft || width !== this.toastWidth) {
          this.toastLeft = left
          this.toastWidth = width
          this.$el.style.setProperty('--support-toast-left', left)
          this.$el.style.setProperty('--support-toast-width', width)
        }
      }
    },
    tablistKeydown,
    statusLabel (status) { return { open: 'Open', waiting: 'Waiting', resolved: 'Resolved' }[status] || 'Open' },
    presenceLabel (status) { return { online: 'Online', offline: 'Offline' }[status] || 'Unknown' },
    characterPresenceLabel (status) { return { online: 'In game', offline: 'Not in game' }[status] || 'Presence unknown' },
    deliveryLabel (status, kind) { return deliveryLabel(status, kind) },
    urgency (value) { return value > 1 ? 'Urgent' : 'Elevated' },
    // Chip tones: colour only where the state means something.
    statusTone (status) { return { waiting: 'is-warning', resolved: 'is-success' }[status] || null },
    urgencyTone (value) { return value > 1 ? 'is-danger' : 'is-warning' },
    deliveryTone (status) { return deliveryTone(status) },
    deliveryIcon (status, kind) { return deliveryIcon(status, kind) },
    deliveryHint (status, kind) { return deliveryHint(status, kind) },
    eventTitle (kind) { return titles[kind] || 'Case updated' },
    eventIcon (kind, delivery) {
      if ((kind === 'chat_in' || kind === 'chat_out') && delivery === 'mail') return 'fe fe-mail'
      return icons[kind] || 'fe fe-activity'
    },
    relative (value) { return relativeTime(this.toDate(value), this.now) },
    categoryLabel (id) { return categoryLabel(id) },
    rowMeta (item) { return Boolean(item.owner || item.status !== 'resolved' || (item.viewers && item.viewers.length)) },
    noteCount (count) { return count === 1 ? '1 account note' : `${count} account notes` },
    viewerTitle (viewer) { return `${viewer.name} ${viewer.composing ? 'is writing to the player' : 'is viewing'}` },
    shortDate (value) {
      const date = new Date(value)
      return isNaN(date) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
    },
    params () { return { params: { connection_id: this.connectionId } } },
    caseUrl (key) { return endpoint + '/' + encodeURIComponent(key) },
    initial (name) { return initials(name) },
    avatarStyle (name) { return avatarStyle(name) },
    // On a phone the case is on screen only after it is opened from the queue.
    caseVisible () {
      return this.mobileDetail || this.layout !== 'single'
    },
    unread (item) {
      return this.seenVersion >= 0 && !(item.key === this.selectedKey && this.caseVisible()) && hasUnseenReply(item)
    },
    // A reply counts as seen only while staff can see the case.
    noteSeen (at) {
      if (document.hidden || !this.caseVisible()) return
      markSeen(this.selectedKey, at)
      this.seenVersion++
      // Live chat reports the latest player message once it is on screen.
      if (this.chatOpen && (!this.chatSeenAt || new Date(at) > new Date(this.chatSeenAt))) this.chatSeenAt = at
    },
    // Single keys outside a text field and a dialog (listed in the shortcuts
    // dialog and the guide). Spire's own shortcuts all use Ctrl.
    onShortcut (event) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return
      const target = event.target
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      if (this.dialogActive()) return
      const action = this.shortcutAction(event.key)
      if (!action) return
      event.preventDefault()
      if (!event.repeat) action()
    },
    // Whether a dialog is opening, open or closing. Not just ".modal.show":
    // b-modal shows a dialog two frames before it adds "show", removes "show"
    // as it starts to fade out, and gives focus back to its opener a tick
    // after "hidden". A key in those gaps would act on the page behind the
    // dialog, or lose the field it focused to that returning focus.
    dialogActive () {
      if (this.dialogSettling || document.body.classList.contains('modal-open')) return true
      return Array.from(document.querySelectorAll('.modal')).some(modal => getComputedStyle(modal).display !== 'none')
    },
    // After a dialog's "hidden", until its focus return has run.
    onDialogHidden () {
      this.dialogSettling = true
      clearTimeout(this.settleTimer)
      this.settleTimer = setTimeout(() => { this.dialogSettling = false }, 0)
    },
    // What a key does now, or null when it does nothing here (the key is then
    // left to the browser).
    shortcutAction (key) {
      const lower = String(key || '').toLowerCase()
      if (key === '/') return () => { if (this.$refs.search) this.$refs.search.focus() }
      if (key === '?') return () => { this.shortcutsOpen = true }
      if (lower === 'j' || lower === 'k') return () => this.stepCase(lower === 'j' ? 1 : -1)
      const record = this.record
      if (!record || this.busy) return null
      const live = this.canWrite && record.status !== 'resolved'
      const tab = id => () => this.focusWhenReady(() => document.getElementById('support-tab-' + id), 0)
      if (key === '1') return () => { this.showTimeline(); tab('timeline')() }
      if (key === '2') return () => { this.openChat(); tab('chat')() }
      if (key === '3' && this.canReadEvents) return () => { this.openEvidence(); tab('evidence')() }
      if (lower === 'n' && this.canWrite) return () => { this.showTimeline(); this.focusWhenReady(() => this.$refs.noteField) }
      if (lower === 'm' && live) return () => { if (!this.chatOpen) this.openChat(); this.focusWhenReady(() => document.getElementById('support-live-message')) }
      if (lower === 'c' && live && !record.owner) return () => this.updateCase('claim')
      if (lower === 'w' && live && record.status === 'open') return () => this.updateCase('wait')
      if (lower === 'r' && live) return () => this.confirmResolve()
      return null
    },
    // Focus what a key asked for: on the next tick (a microtask, so before
    // the next key is handled), and again every 100 ms for up to two seconds
    // when it appears only once something loads (Live chat's message box).
    // A later key, or focus moving on in the meantime, cancels it: a timer
    // from an earlier key must never take focus from the field a later key
    // focused (pressing 1 and then N quickly left focus on the tab).
    focusWhenReady (find, tries = 20) {
      const token = ++this.focusToken
      const from = document.activeElement
      const attempt = left => this.$nextTick(() => {
        // Focus on the body means what had it went away with the view: carry on.
        const moved = document.activeElement !== from && document.activeElement !== document.body
        if (token !== this.focusToken || moved) return
        const element = find()
        if (element && !element.disabled) return element.focus()
        if (left > 0) setTimeout(() => attempt(left - 1), 100)
      })
      attempt(tries)
    },
    addNoteKey () {
      // A dialog's Ctrl+Enter belongs to the dialog.
      if (this.dialogActive()) return
      this.updateCase('note')
    },
    focusResolution () {
      if (!touchLayout() && this.$refs.resolution) this.$refs.resolution.focus()
    },
    toggleCard (id) {
      this.setFilter(this.filter === id && id !== 'open' ? 'open' : id)
    },
    clearFilters () {
      clearTimeout(this.searchTimer)
      this.searchTimer = null
      this.search = ''
      this.category = ''
      this.filter = 'open'
      this.page = 1
      this.saveQueue()
      this.loadQueue()
    },
    saveQueue () {
      saveQueuePrefs({ filter: this.filter, category: this.category, search: this.search })
    },
    // The row's name for screen readers: who, state, urgency, age, a new reply, owner.
    rowLabel (item) {
      const parts = [this.statusLabel(item.status).toLowerCase()]
      if (item.urgency > 0) parts.push(this.urgency(item.urgency).toLowerCase())
      if (item.escalated) parts.push('escalated')
      if (item.age_state === 'overdue') parts.push('overdue')
      else if (item.age_state === 'aging') parts.push('no staff answer yet')
      if (item.follow_up) parts.push('follow-up due')
      parts.push('filed ' + this.age(item.submitted_at, true))
      if (this.unread(item)) parts.push(item.last_reply_mail ? 'new mail from the player' : 'new reply from the player')
      if (item.owner) parts.push('assigned to ' + (item.mine ? 'you' : item.owner))
      else if (item.status !== 'resolved') parts.push('unassigned')
      return item.character + ' – ' + parts.join(', ')
    },
    // Every time's tooltip: the date and how long ago.
    timeTitle (value) { return timeTitle(this.toDate(value), this.now) },
    // A queue row's age: when it was filed, and what aging and overdue mean.
    ageTitle (item) {
      const state = { aging: ' · no staff answer for 30 minutes', overdue: ' · no staff answer for over 2 hours' }[item.age_state] || ''
      return 'Filed ' + this.timeTitle(item.submitted_at) + state
    },
    scheduleNotice () {
      clearTimeout(this.noticeTimer)
      const notice = this.notice
      if (!notice || notice.error || notice.tone === 'warning' || this.noticeHeld) return
      this.noticeTimer = setTimeout(() => { if (this.notice === notice) this.notice = null }, notice.undo ? 10000 : 6000)
    },
    holdNotice (held) {
      this.noticeHeld = held
      this.scheduleNotice()
    },
    undoNotice () {
      const undo = this.notice && this.notice.undo
      if (undo) undo.run()
    },
    stepCase (direction) {
      if (this.busy || !this.cases.length) return
      const index = this.cases.findIndex(item => item.key === this.selectedKey)
      const next = this.cases[index < 0 ? 0 : Math.max(0, Math.min(this.cases.length - 1, index + direction))]
      if (next && next.key !== this.selectedKey) this.selectCase(next.key)
    },
    clearSearch () {
      if (!this.search) return
      this.search = ''
      this.scheduleSearch()
    },
    addResolution (phrase) {
      const current = this.resolution.trim()
      this.resolution = current ? `${current}${/[.!?]$/.test(current) ? '' : '.'} ${phrase}.` : `${phrase}.`
      focusLater(() => this.$refs.resolution)
    },
    dateTime (value) { return new Date(value * 1000).toISOString() },
    toDate (value) { return new Date(typeof value === 'number' ? value * 1000 : value) },
    formatDate (value) {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(this.toDate(value))
    },
    clock (value) {
      return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(value instanceof Date ? value : new Date(value))
    },
    // The timeline's day separators, worded like Live chat's.
    dayLabel (value) { return dayLabel(value) },
    age (value, long = false) {
      const minutes = Math.max(0, Math.floor((this.now / 1000 - value) / 60))
      if (minutes < 1) return long ? 'just now' : 'Now'
      const [amount, unit] = minutes < 60 ? [minutes, 'm'] : minutes < 1440 ? [Math.floor(minutes / 60), 'h'] : [Math.floor(minutes / 1440), 'd']
      if (!long) return amount + unit
      const word = { m: 'minute', h: 'hour', d: 'day' }[unit]
      return `${amount} ${word}${amount === 1 ? '' : 's'} ago`
    },
    errorText (error) {
      // The server's own words first; then what happened and what to do.
      const message = error.response && error.response.data && error.response.data.error
      if (message) return message
      if (error.response) return 'Spire could not complete the request. Try again.'
      if (error.config) return 'Spire could not be reached. Check the connection, then try again.'
      return error.message || 'Something went wrong. Try again.'
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
        const { data } = await SpireApi.v1().get(endpoint, { params: { filter: this.filter, q: this.search.trim(), page: this.page, category: this.category } })
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
          this.selecting = false
          this.selected = []
          this.batchMode = null
          this.viewers = []
          this.accountNotes = []
          this.presenceKey = ''
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
        // Selections only cover cases still on this page.
        if (this.selected.length) this.selected = this.selected.filter(key => this.cases.some(item => item.key === key))
        if (data.summary) {
          this.summary = data.summary
          // The navigation badge shows the same count without waiting a minute.
          if (data.summary && data.summary.pending !== undefined) EventBus.$emit('PLAYER_SUPPORT_PENDING', data.summary.pending)
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
      // A request that finishes after another case was opened must not reload
      // the case it started on over the one on screen.
      if (!key || key !== this.selectedKey) return
      const version = ++this.detailVersion
      if (!background) this.detailLoading = true
      this.detailError = false
      try {
        const { data } = await SpireApi.v1().get(endpoint + '/' + encodeURIComponent(key), { params: { connection_id: this.connectionId } })
        if (version !== this.detailVersion || key !== this.selectedKey) return
        const timeline = this.$refs.timeline
        const following = timeline && timeline.scrollHeight - timeline.scrollTop - timeline.clientHeight < 60
        const grew = (data.activity || []).length > this.activity.length
        this.record = data.case
        this.activity = data.activity || []
        this.history = data.history || []
        this.accountNotes = data.account_notes || []
        this.viewers = data.viewers || data.case.viewers || []
        // Tell other staff this case is open, once per case.
        if (this.presenceKey !== key) {
          this.presenceKey = key
          this.sendPresence(this.composing ? 'composing' : 'viewing', key)
        }
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
      if (this.presenceKey && this.presenceKey !== key) this.sendPresence('left', this.presenceKey)
      this.presenceKey = ''
      this.viewers = []
      this.accountNotes = []
      this.composing = false
      clearTimeout(this.composeTimer)
      this.assignOpen = false
      this.notesOpen = false
      this.categoryOpen = false
      this.subjectOpen = false
      this.resolveOpen = false
      this.mergeSource = null
      this.selectedKey = key
      // Before the detail load marks the reply seen: newer player messages
      // make the Live chat tab pulse until Live chat shows them.
      this.chatSeenAt = readSeen()[key] || ''
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
      // A phone swaps the queue for the case: remember the queue's place, start
      // the case at its top and move focus to its name.
      if (this.layout === 'single') {
        if (!this.mobileDetail) this.queueScroll = window.scrollY
        this.$nextTick(() => {
          const workspace = this.$refs.workspace
          if (workspace) window.scrollTo(0, Math.max(0, workspace.getBoundingClientRect().top + window.scrollY - 8))
          focusLater(() => this.$refs.caseHeading || this.$refs.backButton)
        })
      }
      this.mobileDetail = true
      this.notice = null
      // A case loaded in the background is now on screen.
      if (this.record && this.record.key === key && this.record.last_reply_at) this.noteSeen(this.record.last_reply_at)
      const load = key !== this.selectedKey || !this.record ? this.openCase(key) : Promise.resolve()
      this.$router.replace({ path: this.$route.path, query: { case: key } }).catch(() => {})
      return load
    },
    // After a case leaves the work (resolved, or waiting for the player), the
    // next case in the queue that needs staff opens, after its old place
    // first. Returns the key opened, or '' when nothing else needs staff.
    nextPendingKey (key, order) {
      if (this.filter === 'resolved') return ''
      const pending = item => item.key !== key && item.status !== 'resolved' && (item.status !== 'waiting' || item.player_replied)
      const candidates = this.cases.filter(pending)
      const start = order.indexOf(key)
      const rank = item => { const at = order.indexOf(item.key); return at < 0 ? order.length : at }
      const next = candidates.find(item => rank(item) > start) || candidates[0]
      return next ? next.key : ''
    },
    async advanceFrom (key, order) {
      const next = this.nextPendingKey(key, order)
      if (!next || this.selectedKey !== key) return ''
      await this.selectCase(next)
      focusLater(() => this.$refs.caseHeading)
      return next
    },
    // Undo for a resolve or a wait: reopen the case at its current revision and open it.
    async reopenCase (key, character) {
      if (this.busy || !this.canWrite) return
      this.busy = true
      this.notice = null
      try {
        const { data } = await SpireApi.v1().get(this.caseUrl(key), this.params())
        await this.caseAction(key, data.case.revision, 'reopen')
        this.busy = false
        await this.loadQueue()
        await this.selectCase(key)
        focusLater(() => this.$refs.caseHeading)
        this.notice = { error: false, text: `${character}’s case is open again.` }
      } catch (error) {
        this.notice = { error: true, text: this.errorText(error) }
      } finally {
        this.busy = false
      }
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
        this.saveQueue()
        this.loadQueue()
      }, 250)
    },
    setFilter (filter) {
      if (this.filter === filter) return
      clearTimeout(this.searchTimer)
      this.searchTimer = null
      this.filter = filter
      this.page = 1
      this.saveQueue()
      this.loadQueue()
    },
    changePage (direction) {
      this.page += direction
      this.loadQueue()
    },
    setCategory () {
      clearTimeout(this.searchTimer)
      this.searchTimer = null
      this.page = 1
      this.saveQueue()
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
      // When the page scrolls as a whole, Live chat is one window tall: bring
      // all of it, message box included, into view now and again once its
      // first messages are in (the message box may only appear then).
      this.chatScrollPending = !this.fill
      this.$nextTick(this.revealChat)
    },
    revealChat () {
      if (!this.chatScrollPending || this.fill) return
      const panel = this.$refs.casePanel
      if (!panel) return
      const rect = panel.getBoundingClientRect()
      if (rect.bottom > window.innerHeight || rect.top < 0) window.scrollTo(0, Math.max(0, rect.bottom + window.scrollY - window.innerHeight + 8))
    },
    chatLoaded () {
      this.$nextTick(() => {
        this.revealChat()
        this.chatScrollPending = false
      })
    },
    openEvidence () {
      this.chatOpen = false
      this.evidenceOpen = true
    },
    // From a category hint: Evidence opens fresh, on its Items group.
    openEvidenceItems () {
      this.evidenceVersion++
      this.openEvidence()
    },
    openProgress (tab) {
      this.progressTab = tab
      this.delivery = 'progress'
    },
    openSubject () {
      this.subjectName = this.record.subject_character || ''
      this.subjectError = ''
      this.subjectOpen = true
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
      if ((summary.follow_up || 0) > (previous.follow_up || 0)) {
        alerts.push({ title: 'Follow-up due', body: 'A waiting case needs a follow-up', tag: 'follow-up-' + summary.follow_up })
      }
      if (!alerts.length) return
      if (this.alertPrefs.sound) playChime()
      if (this.alertPrefs.desktop && document.hidden) {
        for (const alert of alerts) desktopNotify(alert.title, alert.body, alert.tag)
      }
      if (!document.hidden) this.notice = { error: false, text: alerts.map(alert => alert.body).join(' · ') }
    },
    backToQueue () {
      const key = this.selectedKey
      this.mobileDetail = false
      this.showTimeline()
      // Back where the GM left the queue, on the case they had open.
      this.$nextTick(() => {
        window.scrollTo(0, this.queueScroll)
        const list = this.$refs.caseList
        const row = list && Array.from(list.querySelectorAll('.support-case-row')).find(item => item.getAttribute('aria-current') === 'true')
        if (row) row.focus({ preventScroll: true })
        else if (this.$refs.search && key) this.$refs.search.focus({ preventScroll: true })
      })
    },
    async updateCase (action) {
      if (!this.record || this.busy || !this.canWrite) return
      if (action === 'note' && !this.note.trim()) return
      const key = this.selectedKey
      const text = action === 'note' ? this.note.trim() : ''
      const character = this.record.character
      const order = this.cases.map(item => item.key)
      this.busy = true
      this.notice = null
      try {
        await SpireApi.v1().patch(endpoint + '/' + encodeURIComponent(key), {
          action, text, revision: this.record.revision
        }, { params: { connection_id: this.connectionId } })
        if (action === 'note') this.note = ''
        await Promise.all([this.loadQueue(), this.loadDetail(key)])
        if (action === 'wait') {
          this.busy = false
          const next = await this.advanceFrom(key, order)
          const moved = next && this.record ? ` Next: ${this.record.character}.` : ''
          this.notice = { error: false, text: `${character}’s case is waiting for the player.${moved}`, undo: { label: 'Undo', run: () => this.reopenCase(key, character) } }
        }
      } catch (error) {
        this.notice = { error: true, text: this.errorText(error) }
        if (error.response && error.response.status === 409) await this.loadDetail(key)
      } finally {
        this.busy = false
      }
    },
    // One case action on the case it was started on, at that case's revision.
    caseAction (key, revision, action, extra = {}) {
      return SpireApi.v1().patch(this.caseUrl(key), { action, text: '', revision, ...extra }, this.params())
    },
    async applyCategory (category) {
      if (!this.record || this.busy || !this.canWrite) return
      this.categoryOpen = false
      const key = this.selectedKey
      this.busy = true
      this.notice = null
      try {
        await this.caseAction(key, this.record.revision, 'categorize', { category })
        this.notice = { error: false, text: category ? `Category set to ${categoryLabel(category)}` : 'Category cleared' }
        await Promise.all([this.loadQueue(), this.loadDetail(key)])
      } catch (error) {
        this.notice = { error: true, text: this.errorText(error) }
        if (error.response && error.response.status === 409) await this.loadDetail(key)
      } finally {
        this.busy = false
      }
    },
    async saveSubject (name) {
      if (!this.record || this.busy || !this.canWrite) return
      const key = this.selectedKey
      const subject = name.trim()
      this.busy = true
      this.subjectError = ''
      try {
        await this.caseAction(key, this.record.revision, 'subject', { subject })
        this.subjectOpen = false
        this.notice = { error: false, text: subject ? `Reported player set to ${subject}` : 'Reported player cleared' }
        await this.loadDetail(key)
      } catch (error) {
        this.subjectError = this.errorText(error)
        if (error.response && error.response.status === 409) await this.loadDetail(key, true)
      } finally {
        this.busy = false
      }
    },
    async assignSaved (text) {
      this.assignOpen = false
      this.notice = { error: false, text }
      await Promise.all([this.loadQueue(), this.loadDetail(this.selectedKey)])
    },
    notesChanged (notes) {
      this.accountNotes = notes
      this.loadDetail(this.selectedKey, true)
      this.loadQueue(false, true)
    },

    // Presence is advisory: failures are ignored and nothing is locked.
    sendPresence (state, key = this.selectedKey) {
      if (!key || this.connectionId === null || !this.canWrite) return
      if (state !== 'left') this.lastPresenceAt = Date.now()
      SpireApi.v1().put(this.caseUrl(key) + '/presence', { state }, this.params()).then(({ data }) => {
        if (state !== 'left' && key === this.selectedKey && data && Array.isArray(data.viewers)) this.viewers = data.viewers
      }).catch(() => {})
    },
    heartbeat () {
      if (document.hidden || !this.record || this.presenceKey !== this.selectedKey) return
      this.sendPresence(this.composing ? 'composing' : 'viewing')
    },
    // Live chat and mail report when a draft starts or empties; other staff
    // hear about it within 5 s, and never more often than that.
    setComposing (value) {
      if (this.composing === value) return
      this.composing = value
      clearTimeout(this.composeTimer)
      const wait = Math.max(0, composeEvery - (Date.now() - this.lastPresenceAt))
      this.composeTimer = setTimeout(this.heartbeat, wait)
    },

    resolveMemoKey (key) { return `${this.connectionId}/${key}` },
    // Resolve, after sending the chosen saved reply when there is one. The case
    // is resolved only after the reply went out, or, when its delivery was not
    // confirmed, once staff choose to resolve without sending it again.
    async resolveCase (again = false) {
      if (!this.record || this.resolveBusy || !this.canWrite) return
      const key = this.selectedKey
      const memo = this.resolveMemoKey(key)
      const character = this.record.character
      const reply = this.resolveReplyRecord
      const unconfirmed = Boolean(this.resolveUnconfirmedReply)
      this.resolveBusy = true
      this.resolveError = ''
      try {
        let text = this.resolution.trim()
        if (reply && unconfirmed && !again) {
          text = text ? `${text}\nSaved reply delivery not confirmed: ${reply.title}` : `Saved reply delivery not confirmed: ${reply.title}`
        } else if (reply) {
          if (this.resolveSentId !== reply.id) {
            // Sending again is a new send, never a replay of the unconfirmed one.
            if (unconfirmed) this.resolveRequestId = newRequestId()
            let delivery = 'sent'
            try {
              delivery = await this.sendSavedReply(reply)
            } catch (error) {
              if (replyUnconfirmed(error)) delivery = 'unconfirmed'
              else if (!replyAlreadySent(error)) throw error
            }
            if (delivery === 'unconfirmed' || delivery === 'pending') {
              // Never retried on its own: staff check the conversation first.
              this.$set(this.resolveUnconfirmed, memo, reply.id)
              if (!this.resolveOpen) this.notice = { error: true, text: `The reply to ${character} may have been sent, but its delivery was not confirmed. The case was not resolved.` }
              await this.loadDetail(key, true)
              return
            }
            if (delivery === 'failed') {
              // The next try is a new send: this request ID would only answer
              // "failed" again. It may go by mail if the player has left.
              this.resolveRequestId = newRequestId()
              this.resolveError = `The reply was not delivered to ${character}, so the case was not resolved. You can try again.`
              if (!this.resolveOpen) this.notice = { error: true, text: this.resolveError }
              await this.loadDetail(key, true)
              return
            }
            this.resolveSentId = reply.id
            this.$delete(this.resolveUnconfirmed, memo)
            // The send is recorded on the case; resolve at the revision it left.
            await this.loadDetail(key, true)
          }
          // Another case was opened while the reply went out: resolve nothing.
          if (this.selectedKey !== key || !this.record) throw new Error(`The reply was sent, but ${character}’s case was not resolved because another case was opened.`)
          text = text ? `${text}\nSent saved reply: ${reply.title}` : `Sent saved reply: ${reply.title}`
        }
        const close = Boolean(this.record.native_open && !this.record.checked_out && this.closeInGame)
        // A saved reply already told the player, so the server skips the
        // replies-closed notice.
        const response = await this.caseAction(key, this.record.revision, 'resolve', { text, close_in_game: close, reply_sent: Boolean(reply) })
        const petition = response && response.data && response.data.petition
        const repliesNotice = (response && response.data && response.data.replies_notice) || ''
        this.$delete(this.resolveUnconfirmed, memo)
        this.resolveOpen = false
        const order = this.cases.map(item => item.key)
        await Promise.all([this.loadQueue(), this.loadDetail(key)])
        const next = await this.advanceFrom(key, order)
        const moved = next && this.record ? `Next: ${this.record.character}.` : ''
        const resolved = [`${character}’s case resolved.`, petition && petition.message, repliesNotice, moved].filter(Boolean).join(' ')
        const warn = Boolean(petition && petition.message && ['checked_out', 'unconfirmed'].includes(petition.status))
        this.notice = { error: false, tone: warn ? 'warning' : null, text: resolved, undo: { label: 'Reopen', run: () => this.reopenCase(key, character) } }
      } catch (error) {
        this.resolveError = this.errorText(error)
        // The dialog closed because another case was opened: say so on the page.
        if (!this.resolveOpen) this.notice = { error: true, text: this.resolveError }
        if (error.response && error.response.status === 409) await this.loadDetail(key, true)
      } finally {
        this.resolveBusy = false
      }
    },
    // A tell when the player can get one and the reply fits; otherwise in-game
    // mail. Player replies do not matter: they only affect the player's answers.
    // Returns the delivery.
    async sendSavedReply (reply) {
      const record = this.record
      const body = fillReply(reply.body, record)
      const url = this.caseUrl(record.key)
      let chat = null
      try {
        chat = (await SpireApi.v1().get(url + '/chat', this.params())).data
      } catch (error) {
        chat = null
      }
      if (chat && chat.state === 'ready' && fitsTell(body)) {
        const response = await SpireApi.v1().put(url + '/chat', { action: 'send', text: body, request_id: this.resolveRequestId }, this.params())
        // "sent", "mail", "failed", "unconfirmed" or "pending". An empty answer
        // is the older 204, which did not report the outcome, so it counts as sent.
        return (response && response.data && response.data.delivery) || 'sent'
      }
      if (this.canDeliver) {
        await SpireApi.v1().put(url + '/reply', {
          subject: 'Response to your petition', body, request_id: this.resolveRequestId, confirmation: 'SEND TO 1 CHARACTER'
        }, this.params())
        return 'mail'
      }
      const reason = record.checked_out
        ? 'the petition is checked out in game.'
        : !record.character_id
            ? 'the petitioning character is no longer available.'
            : 'the player cannot get a tell now, and mailing it needs Mail & Parcels send access.'
      throw new Error(`This reply cannot be sent: ${reason}`)
    },

    // Select mode and batch actions on the queue.
    toggleSelecting () {
      this.selecting = !this.selecting
      if (!this.selecting) this.selected = []
    },
    cancelSelecting () {
      this.selecting = false
      this.selected = []
    },
    toggleSelected (key, on) {
      if (on && !this.selected.includes(key)) this.selected.push(key)
      if (!on) this.selected = this.selected.filter(item => item !== key)
    },
    submitBatch (payload) {
      const action = this.batchMode
      this.batchMode = null
      this.runBatch(action, payload)
    },
    async runBatch (action, extra = {}) {
      const cases = this.cases.filter(item => this.selected.includes(item.key)).map(item => ({ key: item.key, revision: item.revision || 0 }))
      if (!cases.length || this.busy || !this.canWrite) return
      const order = this.cases.map(item => item.key)
      let notice = null
      let left = ''
      this.busy = true
      this.notice = null
      try {
        const { data } = await SpireApi.v1().put('player-support/batch', {
          action, cases, assignee_id: 0, category: '', text: '', close_in_game: false, ...extra
        }, this.params())
        const results = (data && data.results) || []
        const updated = results.filter(result => result.ok).length
        const failures = results.filter(result => !result.ok).map(result => `#${String(result.key).split('-')[0]}: ${result.error || 'Not updated.'}`)
        // A resolved case whose in-game petition was not cleared, or not confirmed.
        for (const result of results) {
          if (result.ok && result.petition && ['checked_out', 'unconfirmed'].includes(result.petition.status)) {
            failures.push(`#${String(result.key).split('-')[0]}: ${result.petition.message}`)
          }
        }
        notice = {
          error: updated === 0 && failures.length > 0,
          tone: failures.length ? 'warning' : null,
          text: `${updated} of ${cases.length} updated.`,
          list: failures
        }
        this.selected = []
        const open = this.selectedKey
        if ((action === 'resolve' || action === 'wait') && results.some(result => result.ok && result.key === open)) left = open
      } catch (error) {
        notice = { error: true, text: this.errorText(error) }
      } finally {
        this.busy = false
      }
      await Promise.all([this.loadQueue(), this.selectedKey ? this.loadDetail(this.selectedKey, true) : null])
      if (left && await this.advanceFrom(left, order) && this.record) notice.text += ` Next: ${this.record.character}.`
      this.notice = notice
    },
    mailInstead (text) {
      this.mailDraft = text || ''
      this.delivery = 'reply'
    },
    closeMail () {
      this.delivery = null
      this.mailDraft = ''
    },
    async deliverySent (kind, detail) {
      const character = this.record ? this.record.character : 'the player'
      if (kind === 'reply') this.closeMail()
      // The reply joins the Live chat conversation at once.
      if (kind === 'reply' && this.$refs.chat) this.$refs.chat.load()
      // Snapshot items belong to one send only.
      this.parcelPrefill = null
      this.notice = {
        error: false,
        text: kind === 'parcel'
          ? `Parcel queued for delivery to ${character}. They collect it from any parcel merchant.`
          : `Mail sent to ${character}${detail && detail.subject ? ': “' + detail.subject + '”' : ''}. It is on the case timeline.`
      }
      await this.loadDetail(this.selectedKey)
    },
    async recoveryReceipt (result) {
      if (result) this.notice = { error: ['failed', 'unconfirmed', 'moved_arrival_unconfirmed', 'moved_notice_unavailable'].includes(result.status), text: result.message }
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
/* The header sits on Spire's page art, so its text carries a soft shadow and its
   controls sit on one solid toolbar instead of floating over the picture. */
.support-title h1 { margin: 0; color: var(--support-text); font-size: var(--support-text-2xl); font-weight: 600; line-height: 1.15; letter-spacing: -.01em; text-shadow: 0 1px 3px rgba(0, 0, 0, .6); }
.support-title p { margin: var(--support-space-1) 0 0; color: var(--support-text-secondary); font-size: var(--support-text-sm); text-shadow: 0 1px 2px rgba(0, 0, 0, .7); }
.support-header-actions {
  display: flex; align-items: center; gap: 2px; padding: 3px;
  border: 1px solid var(--support-border); border-radius: var(--support-radius-lg);
  background: var(--support-pane); box-shadow: var(--support-shadow-panel);
}
.support-live { display: inline-flex; align-items: center; gap: 6px; padding: 0 var(--support-space-3) 0 10px; color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600; }
.support-live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--support-success); box-shadow: 0 0 0 3px var(--support-success-soft); }
.support-alerts-button { position: relative; }
.support-alert-dot { position: absolute; top: 5px; right: 6px; width: 6px; height: 6px; border-radius: 50%; background: var(--support-accent); }
.support-header-actions > .support-button:last-child { margin-left: var(--support-space-1); }

/* Queue at a glance: the figure and its label on one line, so the row reads
   left to right like a sentence. The card that is the queue's filter is gold. */
.support-summary { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: var(--support-space-2); margin-bottom: var(--support-space-4); }
.support-summary .support-stat { display: flex; align-items: baseline; gap: var(--support-space-2); min-height: 48px; padding: var(--support-space-2) var(--support-space-4); align-content: initial; }
.support-summary .support-stat > strong { flex: none; min-width: 1ch; }
.support-summary .support-stat > span { min-width: 0; color: var(--support-text-secondary); }
.support-summary .support-stat.is-quiet > span { color: var(--support-muted); }
button.support-stat { cursor: pointer; }
button.support-stat:hover { border-color: var(--support-border-hover); background: var(--support-raised); }
.support-stat[aria-pressed="true"] { border-color: var(--support-accent-line); background: var(--support-selected); box-shadow: inset 0 -2px 0 var(--support-accent); }
.support-summary .support-stat[aria-pressed="true"] > span { color: var(--support-accent-text); }
.support-stat.is-danger > strong { color: var(--support-danger); }
.support-stat-placeholder { display: flex; align-items: center; gap: var(--support-space-2); }
.support-stat-placeholder > .support-shimmer:first-child { width: 22px; height: 20px; }
.support-stat-placeholder > .support-shimmer:last-child { width: 55%; height: 12px; }

/* Notices: a toast over the bottom of the queue, so nothing on the page moves
   (fitWorkspace sets where the queue is). Without a queue beside the case it
   spans the bottom of the window. */
.support-companion { margin-bottom: var(--support-space-3); }
.support-notice {
  position: fixed; z-index: var(--support-z-toast); bottom: var(--support-space-4);
  left: var(--support-toast-left, var(--support-space-4)); width: var(--support-toast-width, min(480px, calc(100vw - 32px)));
  align-items: center; margin: 0; border-color: var(--support-border-strong); background-color: var(--support-raised);
  box-shadow: var(--support-shadow-dialog);
}
/* The tone tints the toast without letting the page show through it. */
.support-notice.is-success { background-image: linear-gradient(var(--support-success-soft), var(--support-success-soft)); }
.support-notice.is-warning { background-image: linear-gradient(var(--support-warning-soft), var(--support-warning-soft)); }
.support-notice.is-danger { background-image: linear-gradient(var(--support-danger-soft), var(--support-danger-soft)); }
.support-notice > i { margin-top: 0; }
.support-notice-text { flex: 1; min-width: 0; color: var(--support-text); overflow-wrap: anywhere; }
.support-notice-list { max-height: 9.5em; margin: var(--support-space-1) 0 0; padding-left: 18px; overflow-y: auto; }
.support-notice .support-button { flex: none; }
.support-notice .support-button.is-icon { margin: -4px -4px -4px 0; }
.support-fade-enter-active, .support-fade-leave-active { transition: opacity 160ms ease; }
.support-fade-enter, .support-fade-leave-to { opacity: 0; }

/* Workspace */
.support-workspace {
  display: grid; grid-template-columns: minmax(260px, min(27%, 420px)) minmax(0, 1fr) minmax(240px, min(22%, 380px));
  /* clip, not hidden: no scroll container, so the phone back bar, the split
     layout's queue and Live chat's message box can stick to the window. */
  min-height: 640px; overflow: hidden; overflow: clip;
  border: 1px solid var(--support-border); border-radius: var(--support-radius-lg);
  background: var(--support-bg); box-shadow: var(--support-shadow-panel);
}

/* Queue */
.support-queue { display: flex; flex-direction: column; min-width: 0; border-right: 1px solid var(--support-border); background: var(--support-pane); }
.support-queue-controls { display: grid; gap: var(--support-space-2); padding: var(--support-space-4); border-bottom: 1px solid var(--support-border); }
.support-queue-title { display: flex; align-items: center; gap: var(--support-space-2); margin-bottom: var(--support-space-1); }
.support-queue-title .support-section-label { margin: 0; }
.support-queue-sort { margin-left: auto; color: var(--support-faint); font-size: var(--support-text-xs); white-space: nowrap; }
.support-queue-result { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--support-space-1) var(--support-space-3); margin: 0; color: var(--support-muted); font-size: var(--support-text-xs); }
.support-search-key { flex: none; }
.support-queue-tools { display: flex; align-items: center; gap: var(--support-space-2); }
.support-queue-tools .support-category-filter { flex: 1; min-width: 0; min-height: 32px; padding-top: 5px; padding-bottom: 5px; font-size: var(--support-text-sm); }
.support-select-toggle { flex: none; }
.support-button.support-select-toggle[aria-pressed="true"] { border-color: var(--support-accent-line); background: var(--support-selected); color: var(--support-text); }
.support-button.support-select-toggle[aria-pressed="true"] > i { color: var(--support-accent); }
.support-skeletons { display: grid; }
/* Placeholder rows shaped like the real ones: avatar, name, snippet, chips. */
.support-skeleton { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: var(--support-space-3); padding: var(--support-space-3) var(--support-space-4); border-bottom: 1px solid var(--support-border-subtle); }

.support-skeleton-lines { display: grid; gap: var(--support-space-2); padding-top: 2px; }
.support-skeleton-lines > .support-shimmer { height: 10px; }
.support-shimmer.support-skeleton-avatar { width: 32px; height: 32px; border-radius: 50%; }

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
/* Inside a scrolling list the ring is drawn inside the row so it is never clipped. */
.player-support .support-case-row:focus-visible { outline-offset: -2px; }
.support-case-row.is-selected { background: var(--support-selected); }
.support-case-row.is-selected::before { background: var(--support-accent); }
.support-row-main { display: block; min-width: 0; }
/* Select mode: the checkbox sits where the avatar was; the row makes room. */
.support-case-item { position: relative; }
.support-row-check { position: absolute; z-index: 1; top: 20px; left: var(--support-space-4); }
.support-case-item.is-selecting .support-case-row { padding-left: 44px; }
.support-row-top, .support-row-bottom { display: flex; align-items: center; gap: var(--support-space-2); min-width: 0; }
.support-row-top strong { min-width: 0; overflow: hidden; color: var(--support-text); font-size: var(--support-text-md); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.support-row-top .support-presence { flex: none; }
.support-row-top .support-unread { flex: none; margin-left: auto; }
.support-row-top time { display: inline-flex; flex: none; align-items: center; gap: 3px; margin-left: auto; color: var(--support-faint); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.support-row-top .support-unread + time { margin-left: 0; }
.support-row-top time.is-aging { color: var(--support-warning); }
.support-row-top time.is-overdue { color: var(--support-danger); font-weight: 600; }
.support-row-notes { display: inline-flex; flex: none; color: var(--support-faint); font-size: 12px; }
.support-case-snippet {
  display: -webkit-box; margin: 2px 0 var(--support-space-2); overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
  color: var(--support-muted); font-size: var(--support-text-sm); line-height: 1.45; overflow-wrap: anywhere;
}
.support-case-row.is-unread .support-case-snippet { color: var(--support-text-secondary); }
.support-row-bottom { flex-wrap: wrap; gap: 6px; }
.support-row-owner { display: inline-flex; align-items: center; gap: 6px; min-width: 0; color: var(--support-muted); font-size: var(--support-text-xs); white-space: nowrap; }
.support-row-owner > .support-avatar { flex: none; }
.support-row-owner-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.support-row-owner.is-mine { color: var(--support-accent-text); }
.support-row-owner.is-unassigned { color: var(--support-faint); }
.support-avatar.is-empty { background: transparent; box-shadow: inset 0 0 0 1px var(--support-border-strong); }
.support-row-category { min-width: 0; max-width: 100%; }
.support-row-category > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.support-row-people { display: inline-flex; flex: 0 1 auto; align-items: center; justify-content: flex-end; gap: 6px; min-width: 0; max-width: 55%; margin-left: auto; }
.support-row-viewers { display: inline-flex; flex: none; align-items: center; gap: 2px; }
/* Someone is writing to the player: a warning ring on their avatar. */
.support-avatar.is-composing { outline: 1.5px solid var(--support-warning); outline-offset: 1px; }
.support-pagination { display: flex; align-items: center; justify-content: space-between; padding: var(--support-space-2) var(--support-space-4); border-top: 1px solid var(--support-border); color: var(--support-muted); font-size: var(--support-text-xs); }

/* Thread */
.support-thread { display: flex; flex-direction: column; min-width: 0; }
.support-placeholder { flex: 1; min-height: 360px; }
.support-caught-up > i { color: var(--support-success); font-size: 28px; }
.support-thread-header { padding: var(--support-space-4) var(--support-space-5) 0; border-bottom: 1px solid var(--support-border); }
/* Avatar, then name over state and origin, then the action at the far end. */
.support-thread-heading { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--support-space-3); }
.support-identity { display: grid; gap: 6px; min-width: 0; }
.support-identity-name { display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-1) var(--support-space-3); min-width: 0; }
.support-thread-heading h2 { margin: 0; color: var(--support-text); font-size: var(--support-text-xl); font-weight: 700; line-height: 1.2; letter-spacing: -.01em; overflow-wrap: anywhere; }
.support-case-line { display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-1) var(--support-space-3); min-width: 0; }
.support-case-meta { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.support-case-number { color: var(--support-text-secondary); font-weight: 600; font-variant-numeric: tabular-nums; }
.support-heading-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--support-space-2); align-self: start; }
.support-subline { margin: 0; color: var(--support-muted); font-size: var(--support-text-sm); line-height: 1.4; }
.support-subline strong { color: var(--support-text-secondary); font-weight: 600; }
.support-suggested { margin-top: var(--support-space-3); }
.support-triage { align-items: center; margin-top: var(--support-space-3); padding: 6px 6px 6px 10px; }
.support-triage > i { margin-top: 0; }
.support-triage-text { flex: 1; min-width: 0; }
.support-triage-tools { display: flex; flex: none; gap: 6px; }
/* Tabs on the left, who else is here on the right, on one line. */
.support-tabbar { display: flex; align-items: center; gap: var(--support-space-4); margin-top: var(--support-space-3); }
.support-tabbar .support-thread-tabs { flex: none; }
/* Case view tabs: a raised segmented bar, so Timeline, Live chat and Evidence read as
   the case's main switch. The selected tab is filled gold with a gold underline. */
.support-thread-tabs {
  gap: 4px; margin-bottom: 0; padding: 4px;
  border: 1px solid var(--support-border); border-radius: var(--support-radius-lg);
  background: var(--support-sunken); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .03);
}
.support-thread-tabs > button {
  position: relative; justify-content: center; gap: 8px; min-height: 38px; padding: 0 14px;
  border: 1px solid transparent; border-radius: var(--support-radius);
  color: var(--support-text-secondary); font-size: var(--support-text-md); font-weight: 600; letter-spacing: .01em; cursor: pointer;
}
.support-thread-tabs > button > i { color: var(--support-muted); font-size: 15px; transition: var(--support-transition); }
.support-thread-tabs > button:hover:not(:disabled):not([aria-selected="true"]) { border-color: var(--support-border); background: var(--support-hover); color: var(--support-text); }
.support-thread-tabs > button:hover:not(:disabled) > i { color: var(--support-accent-text); }
.support-thread-tabs > button[aria-selected="true"] {
  border-color: var(--support-accent-line); background: var(--support-accent-soft); color: var(--support-accent-text);
  box-shadow: inset 0 -2px 0 var(--support-accent);
}
.support-thread-tabs > button[aria-selected="true"] > i { color: var(--support-accent); }
/* The bar can scroll sideways on a narrow case pane, so the ring is drawn inside. */
.player-support .support-thread-tabs > button:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--support-accent); }
.support-thread-tabs .support-count { min-width: 20px; padding: 1px 6px; background: var(--support-tint); color: var(--support-text-secondary); font-size: var(--support-text-xs); text-align: center; }
.support-thread-tabs > button[aria-selected="true"] .support-count { background: rgba(223, 185, 118, .22); color: var(--support-accent-text); }
.support-thread-tabs > .support-chat-tab.is-unread:not([aria-selected="true"]) { border-color: var(--support-accent-line); color: var(--support-accent-text); }
.support-viewers { display: flex; flex: 0 1 auto; align-items: center; gap: var(--support-space-2); min-width: 0; margin-left: auto; color: var(--support-muted); font-size: var(--support-text-xs); }
.support-viewers-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.support-viewers.is-composing { color: var(--support-warning); }
.support-viewers-avatars { display: inline-flex; flex: none; gap: 3px; }
.support-banner { margin: var(--support-space-3) var(--support-space-5) 0; }
/* The newest account note: one line, the whole note on hover and in Notes. */
.support-notes-strip { align-items: center; margin: var(--support-space-3) var(--support-space-5) 0; padding-top: var(--support-space-2); padding-bottom: var(--support-space-2); border-left-color: var(--support-border-strong); }
.support-notes-strip > i { margin-top: 0; }
.support-notes-text { display: flex; flex: 1; min-width: 0; margin: 0; white-space: nowrap; }
.support-notes-quote { min-width: 0; overflow: hidden; color: var(--support-text); text-overflow: ellipsis; }
.support-notes-by { flex: none; color: var(--support-muted); }
.support-notes-links { display: flex; flex: none; gap: var(--support-space-3); font-size: var(--support-text-xs); white-space: nowrap; }

/* Timeline: a rail of nodes, one colour family per kind of entry, so what
   happened reads at a glance. Gold stays the Game Master's colour. */
.support-timeline {
  --tl-player: #8db6e8;
  --tl-gm: var(--support-accent);
  --tl-mail: #7cc7c2;
  --tl-parcel: #d4a373;
  --tl-workflow: #a8b5c4;
  --tl-account: var(--support-danger);
  --tl-recovery: #a6d58f;
  --tl-tools: #cbc27a;
  --tl-note: #9fb0c3;
  --tl-system: var(--support-faint);
  flex: 1; max-height: 560px; padding: 0 var(--support-space-5) var(--support-space-4); overflow: auto;
}
/* The filter sits in a sticky bar and uses the same segmented control as the
   queue filter, so both filters look and behave alike. */
.support-timeline-bar {
  position: sticky; top: 0; z-index: 2; overflow-x: auto; scrollbar-width: none;
  margin: 0 calc(var(--support-space-5) * -1); padding: var(--support-space-2) var(--support-space-5);
  border-bottom: 1px solid var(--support-border-subtle); background: var(--support-bg);
}
.support-segmented.support-timeline-filters { display: inline-grid; }
/* Sized to their labels, sharing what is left, so "Unassigned" fits a narrow queue. */
.support-segmented.support-filters { grid-auto-columns: minmax(max-content, 1fr); }
.support-segmented.support-filters > button { min-width: 0; padding: 0 6px; }
.support-timeline-filters > button { padding: 0 10px; }
.support-timeline-count { color: var(--support-faint); font-variant-numeric: tabular-nums; }
.support-timeline-filters > button[aria-pressed="true"] .support-timeline-count { color: var(--support-accent-text); }
.support-timeline-empty { margin: var(--support-space-4) 0 0 42px; color: var(--support-muted); font-size: var(--support-text-sm); }

.support-event {
  --tl: var(--tl-system);
  position: relative; display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: var(--support-space-3);
  padding: var(--support-space-3) 0 var(--support-space-1);
}
.family-player { --tl: var(--tl-player); }
.family-gm { --tl: var(--tl-gm); }
.family-mail { --tl: var(--tl-mail); }
.family-parcel { --tl: var(--tl-parcel); }
.family-workflow { --tl: var(--tl-workflow); }
.family-account { --tl: var(--tl-account); }
.family-recovery { --tl: var(--tl-recovery); }
.family-tools { --tl: var(--tl-tools); }
.family-note { --tl: var(--tl-note); }
.kind-resolve, .kind-chat_on, .kind-deescalate { --tl: var(--support-success); }
.kind-escalate { --tl: var(--support-danger); }
.support-event.is-warning { --tl: var(--support-warning); }
.support-event.is-failed { --tl: var(--support-danger); }
.support-event::before { content: ""; position: absolute; top: 0; bottom: 0; left: 14px; width: 2px; background: var(--support-border-subtle); }
.support-original::before { top: 26px; }
.support-timeline > .support-event:last-child::before { bottom: calc(100% - 26px); }
.support-event-icon {
  position: relative; z-index: 1; display: grid; place-items: center; width: 30px; height: 30px;
  border: 1.5px solid var(--tl); border-radius: 50%; background: var(--support-pane); color: var(--tl); font-size: 13px;
  box-shadow: 0 0 0 3px var(--support-bg);
}
.support-event-icon::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: currentColor; opacity: .14; pointer-events: none; }
/* Quiet entries get a smaller node on the rail. */
.family-system .support-event-icon { width: 22px; height: 22px; margin: 4px; font-size: 11px; }
.family-note .support-event-icon { border-style: dashed; }
.support-event-body { min-width: 0; padding-top: 5px; }
.support-event-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--support-space-1) var(--support-space-3); }
/* The actor reads "· Guide" right after the kind, one space apart. */
.support-event-heading h3 {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 0; margin: 0;
  color: var(--support-text); font-family: inherit; font-size: var(--support-text-sm); font-weight: 600; line-height: 1.4;
}
.support-event-kind { color: var(--tl); font-weight: 700; }
.support-event-actor { margin-left: .3em; color: var(--support-text-secondary); font-size: var(--support-text-xs); font-weight: 500; }
.support-event-heading time, .support-receipt { color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 400; }
.support-event-heading time { font-variant-numeric: tabular-nums; }
.support-event-body p { margin: 6px 0 0; color: var(--support-text-secondary); font-size: var(--support-text-md); line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.support-event-body .support-event-detail { color: var(--support-muted); font-size: var(--support-text-sm); }
/* Actions, deliveries and notes: a card with the family's edge; its first line
   is the title, the rest the detail. */
.support-event-content {
  margin-top: 6px; padding: var(--support-space-2) var(--support-space-3);
  border: 1px solid var(--support-border-subtle); border-left: 2px solid var(--tl);
  border-radius: 0 var(--support-radius) var(--support-radius) 0; background: var(--support-pane);
}
.support-event-content > :first-child { margin-top: 0; }
.support-event-content p { margin-top: 4px; }
.support-event.is-warning .support-event-content { border-color: var(--support-warning-line); border-left-color: var(--support-warning); background: var(--support-warning-soft); }
.support-event.is-failed .support-event-content { border-color: var(--support-danger-line); border-left-color: var(--support-danger); background: var(--support-danger-soft); }
.family-note .support-event-content { border-left-style: dashed; }
/* Workflow and system entries are a line of record, not a card: only messages,
   deliveries and notes get a surface, so the timeline has a rhythm. */
.family-workflow:not(.is-failed):not(.is-warning) .support-event-content,
.family-system:not(.is-failed):not(.is-warning) .support-event-content { margin-top: 2px; padding: 0; border: 0; background: none; }
.family-workflow .support-event-content p,
.family-system .support-event-content p { color: var(--support-text-secondary); font-size: var(--support-text-sm); line-height: 1.5; }
.family-system .support-event-content p { color: var(--support-muted); }
.family-workflow .support-event-body,
.family-system .support-event-body { padding-top: 6px; }
.family-system .support-event-body { padding-top: 3px; }
/* Messages: bubbles, not cards, also when a delivery needs checking or failed:
   the bubble's edge and the chip carry that. */
.support-event.family-player .support-event-content, .support-event.family-gm .support-event-content { margin-top: 0; padding: 0; border: 0; background: none; }
.support-event.is-warning.family-gm .support-event-content p { border-color: var(--support-warning-line); }
.support-original p, .kind-chat_in .support-event-content p, .kind-chat_out .support-event-content p {
  display: inline-block; max-width: 100%; margin-top: 6px; padding: var(--support-space-2) var(--support-space-3);
  border: 1px solid var(--support-border); border-radius: 0 var(--support-radius-lg) var(--support-radius-lg);
  background: var(--support-raised); color: var(--support-text);
}
.support-original p { display: block; }
.kind-chat_out .support-event-content p { border-color: var(--support-accent-line); background: var(--support-accent-soft); }
.support-event.is-failed.family-gm .support-event-content p { border-color: var(--support-danger-line); }
.support-event .support-event-content p.support-event-subject {
  display: block; margin-top: 6px; padding: 0; border: 0; background: none; color: var(--support-text); font-weight: 600;
}
.support-event.is-compact .support-event-content p.support-event-subject { margin-top: 2px; }
/* A player's mail: its opening lines, and a button that opens the whole letter. */
.support-event .support-event-content p.support-event-clamp { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.support-event-read { display: flex; margin-top: var(--support-space-2); }
.support-event .support-event-content p.support-event-detail { display: block; padding: 0; border: 0; background: none; }
.kind-native p { padding: 6px var(--support-space-3); border-left: 2px dashed var(--tl); border-radius: 0 var(--support-radius) var(--support-radius) 0; background: var(--support-pane); }
.support-alt { margin-left: var(--support-space-1); }
.support-event.is-compact { padding-top: 0; }
.support-event.is-compact .support-event-icon { visibility: hidden; }
.support-event.is-compact .support-event-heading { display: none; }
.support-event.is-compact p { margin-top: 2px; }
.support-event-tags { display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-2); margin-top: var(--support-space-2); }
.support-day { position: relative; display: flex; justify-content: center; margin: var(--support-space-4) 0 var(--support-space-1); }
.support-day::before { content: ""; position: absolute; top: 50%; right: 0; left: 0; height: 1px; background: var(--support-border-subtle); }
.support-day span {
  position: relative; padding: 2px var(--support-space-3); border: 1px solid var(--support-border-subtle); border-radius: var(--support-radius-pill);
  background: var(--support-bg); color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
}

/* Live chat tab: a pulsing count while the case has a player message not yet
   seen in Live chat. Without motion, the count stays. */
.support-tab-dot {
  display: inline-grid; place-items: center; min-width: 18px; height: 18px; margin-left: 6px; padding: 0 5px;
  border-radius: var(--support-radius-pill); background: var(--support-accent); color: var(--support-on-accent);
  font-size: 11px; font-weight: 700; line-height: 1; animation: support-pulse 1.8s ease-out infinite;
}
.support-chat-tab.is-unread { color: var(--support-accent-text); }
@keyframes support-pulse {
  0% { box-shadow: 0 0 0 0 rgba(223, 185, 118, .55); }
  70% { box-shadow: 0 0 0 8px rgba(223, 185, 118, 0); }
  100% { box-shadow: 0 0 0 0 rgba(223, 185, 118, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .support-tab-dot { animation: none; }
}

.support-shortcuts {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--support-space-1) var(--support-space-3);
  margin: 0; padding: var(--support-space-2) var(--support-space-4); border-top: 1px solid var(--support-border-subtle); color: var(--support-faint); font-size: var(--support-text-xs);
}
.player-support .support-shortcuts .support-link { color: var(--support-muted); font-weight: 400; }
.player-support .support-shortcuts .support-link:hover { color: var(--support-accent-text); text-decoration: none; }
@media (max-width: 680px), (hover: none) {
  .support-shortcuts { display: none; }
}

/* Note composer */
/* Label and shortcut on one line, the field and its button on the next. The
   field is one line until it is focused or holds a note, so the timeline keeps
   the room. */
.support-note {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "label hint" "field send";
  align-items: end; gap: 6px var(--support-space-3);
  padding: var(--support-space-3) var(--support-space-5); border-top: 1px solid var(--support-border); background: var(--support-pane);
}
.support-note label { display: flex; grid-area: label; align-items: center; gap: 6px; margin: 0; color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600; }
.support-note textarea { grid-area: field; height: 38px; min-height: 38px; transition: var(--support-transition), min-height var(--support-duration) ease; }
.support-note textarea:focus, .support-note textarea:not(:placeholder-shown) { min-height: 76px; }
/* One line until it is focused: the hint does not wrap into a half-hidden second line. */
.support-note textarea:not(:focus)::placeholder { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.support-note-actions { display: contents; }
.support-note-actions .support-hint { grid-area: hint; justify-self: end; }
.support-note-actions .support-button { grid-area: send; min-height: 38px; }
.support-hint { color: var(--support-faint); font-size: var(--support-text-xs); }

/* Inspector */
.support-inspector { min-width: 0; border-left: 1px solid var(--support-border); background: var(--support-pane); }
.support-inspector section { padding: var(--support-space-4); }
.support-inspector section + section { border-top: 1px solid var(--support-border); }
.support-copyable > span:not(.support-dd-main) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Facts read as a property sheet: values start on one line down the panel, and
   their quiet edit links line up at the right edge. Gold stays for the actions. */
.support-inspector .support-dl { column-gap: var(--support-space-4); }
.support-inspector .support-dl dd { justify-content: flex-start; text-align: left; }
.support-dd-link { flex: none; margin-left: auto; padding-left: var(--support-space-2); font-size: var(--support-text-xs); }
.player-support .support-link.support-dd-link { color: var(--support-muted); font-weight: 600; }
.player-support .support-link.support-dd-link:hover:not(:disabled) { color: var(--support-accent-text); }
.support-dl dd.support-dd-wrap { flex-wrap: nowrap; }
/* A narrow inspector puts the account's Notes link under the name, not over it. */
.support-dl dd.support-copyable.support-dd-wrap { flex-wrap: wrap; row-gap: 2px; }
.support-dd-main { display: inline-flex; flex: 0 1 auto; align-items: center; gap: var(--support-space-1); min-width: 0; max-width: 100%; }
.support-dd-main > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Edit and copy are one family of quiet 24px icon buttons; edit sits at the row's end. */
.support-copy.support-dd-edit { margin-left: auto; }
.support-dd-wrap > span:first-child:not(.support-dd-main) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.support-dl .is-empty { color: var(--support-muted); }
.support-related { display: grid; gap: var(--support-space-3); }
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
.player-support .support-history-case:focus-visible, .player-support .support-history-merge:focus-visible { outline-offset: -2px; }
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
.support-history-merge:disabled { opacity: var(--support-disabled-opacity); cursor: not-allowed; }
.support-status-label { margin-top: var(--support-space-4); }
.support-status-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: var(--support-space-2); }
.support-resolve:not(.is-primary) > i { color: var(--support-success); }
/* The case's tab panel fills the thread under the tabs. */
.support-case-panel { display: flex; flex: 1; flex-direction: column; min-width: 0; min-height: 0; }
.player-support .support-case-panel:focus-visible { outline-offset: -2px; }
.player-support .support-timeline:focus-visible { outline-offset: -2px; }
.support-thread-heading h2:focus { outline: none; }
.player-support .support-thread-heading h2:focus-visible { outline: var(--support-focus-ring) !important; outline-offset: 2px; }

/* Resolve and reported player dialogs (slot content keeps this component's scope) */
.support-resolve-summary { margin-top: var(--support-space-3); }
.support-quick { margin-top: var(--support-space-2); }
.support-resolve-preview { display: grid; gap: 6px; margin-top: var(--support-space-2); }
.support-resolve-hint { display: flex; align-items: flex-start; gap: 6px; margin: 0; color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.5; }
.support-resolve-hint > i { flex: none; margin-top: 3px; font-size: 11px; }
.support-resolve-quote {
  max-height: 9.5em; margin: 0; padding: var(--support-space-2) var(--support-space-3); overflow: auto;
  border-left: 2px solid var(--support-accent-line); border-radius: 0 var(--support-radius) var(--support-radius) 0; background: var(--support-sunken);
  color: var(--support-text-secondary); font-size: var(--support-text-sm); line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere;
}
.support-resolve-close { margin-top: var(--support-space-4); }
.support-resolve-error, .support-resolve-warning { margin: var(--support-space-3) 0 0; }
.support-modal .modal-footer > .support-subject-clear { margin-right: auto; }
/* Keyboard shortcuts: the keys on the left, what they do on the right. */
.support-modal-lead + .support-shortcut-group, .support-shortcut-group + .support-shortcut-group { margin-top: var(--support-space-4); }
.support-shortcut-group .support-section-label { margin-bottom: var(--support-space-2); }
.support-modal .support-shortcut-list { grid-template-columns: minmax(96px, auto) minmax(0, 1fr); }
.support-shortcut-list dt { display: flex; gap: var(--support-space-1); }
.support-modal .support-shortcut-list dd { justify-content: flex-start; color: var(--support-text-secondary); text-align: left; }

/* Fill: wide and tall enough, the workspace fills the window and each pane
   scrolls on its own (set by fitWorkspace). */
.player-support.is-fill .support-workspace { height: max(480px, var(--support-fill, calc(100vh - 344px))); min-height: 0; }
.player-support.is-fill .support-queue, .player-support.is-fill .support-thread { min-height: 0; }
.player-support.is-fill .support-case-list, .player-support.is-fill .support-timeline { min-height: 0; max-height: none; }
.player-support.is-fill .support-inspector { overflow-y: auto; }
@media (min-width: 1900px) {
  .support-thread-header, .support-note, .support-timeline { padding-right: var(--support-space-6); padding-left: var(--support-space-6); }
  .support-timeline-bar { margin-right: calc(var(--support-space-6) * -1); margin-left: calc(var(--support-space-6) * -1); padding-right: var(--support-space-6); padding-left: var(--support-space-6); }
  .support-banner, .support-notes-strip { margin-right: var(--support-space-6); margin-left: var(--support-space-6); }
  .support-timeline .support-event-body p { max-width: 1100px; }
  .support-timeline > :not(.support-timeline-bar), .support-note { max-width: 1500px; }
}
@media (min-width: 2600px) {
  .support-workspace { grid-template-columns: minmax(260px, min(22%, 520px)) minmax(0, 1fr) minmax(240px, min(18%, 460px)); }
}
/* The summary is one row of six only where the labels fit. */
.player-support:not(.has-wide-summary) .support-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
@media (max-width: 1240px) {
  .player-support.has-wide-summary .support-summary { gap: 6px; }
  .player-support.has-wide-summary .support-summary .support-stat { padding-right: var(--support-space-3); padding-left: var(--support-space-3); }
}

/* Split: the queue and the case; the inspector sits under the case. The page
   scrolls, and the queue stays in view beside it as a pane of its own. */
.layout-split .support-workspace { grid-template-columns: minmax(250px, 36%) minmax(0, 1fr); }
.layout-split .support-queue {
  position: sticky; top: 0; grid-row: 1 / span 2; align-self: start;
  max-height: var(--support-vh, 100vh); border-bottom: 1px solid var(--support-border);
}
.layout-split .support-case-list { min-height: 0; max-height: none; }
.layout-split .support-inspector { display: grid; grid-column: 2; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); border-top: 1px solid var(--support-border); border-left: 0; }
.layout-split .support-inspector section + section { border-top: 0; border-left: 1px solid var(--support-border); }
.layout-split .support-inspector section:nth-child(odd) { border-left: 0; }
.layout-split .support-inspector section:nth-child(n + 3) { border-top: 1px solid var(--support-border); }

/* Single: a phone or a narrow window shows the queue, or one case with a bar
   leading back. The page scrolls; the queue is not a pane of its own. */
.support-mobilebar { display: none; }
.layout-single .support-header { align-items: center; gap: var(--support-space-2) var(--support-space-3); padding: var(--support-space-3) 0; }
.layout-single .support-title h1 { font-size: var(--support-text-xl); }
.layout-single .support-title p, .layout-single .support-live, .layout-single .support-button-label { display: none; }
/* The Refresh label stays for screen readers when the button shows only its icon. */
.layout-single .support-refresh-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
.layout-single .support-header-actions > .support-button:last-child { margin-left: 0; }
.layout-single .support-alert-dot { top: 8px; right: 9px; }
/* A compact summary: three across, the figure over its label. */
.layout-single .support-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-bottom: var(--support-space-3); }
.layout-single .support-summary .support-stat { flex-direction: column; align-items: flex-start; gap: 0; min-height: 52px; padding: 6px 10px; }
.layout-single .support-summary .support-stat > strong { font-size: var(--support-text-lg); }
.layout-single .support-summary .support-stat > span { overflow: visible; font-size: var(--support-text-xs); line-height: 1.3; white-space: normal; }
.layout-single .support-summary.is-loading .support-stat { flex-direction: row; align-items: center; }
/* An open case needs the room; the summary is back with the queue. */
.player-support.is-case .support-summary { display: none; }
.layout-single .support-workspace { display: block; min-height: 0; }
.layout-single .support-queue { border-right: 0; }
.layout-single .support-case-list { max-height: none; }
.layout-single .support-thread, .layout-single .support-inspector { display: none; }
.layout-single .support-workspace.show-case .support-queue { display: none; }
.layout-single .support-workspace.show-case .support-thread { display: flex; }
.layout-single .support-workspace.show-case .support-inspector { display: grid; grid-template-columns: minmax(0, 1fr); border-top: 1px solid var(--support-border); border-left: 0; }
.layout-single .support-workspace.show-case .support-inspector section + section { border-top: 1px solid var(--support-border); border-left: 0; }
.layout-single .support-mobilebar {
  position: sticky; top: 0; z-index: 4; display: flex; align-items: center; justify-content: space-between; gap: var(--support-space-2);
  padding: var(--support-space-1) var(--support-space-3) var(--support-space-1) var(--support-space-1);
  border-bottom: 1px solid var(--support-border); background: var(--support-pane);
}
.support-mobilebar .support-back { padding-left: var(--support-space-2); color: var(--support-text); }
.support-mobilebar .support-back > i { color: var(--support-accent); font-size: 16px; }
.support-mobilebar-case { color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600; font-variant-numeric: tabular-nums; }
.layout-single .support-thread-header, .layout-single .support-note, .layout-single .support-timeline { padding-right: var(--support-space-4); padding-left: var(--support-space-4); }
.layout-single .support-timeline-bar { margin-right: calc(var(--support-space-4) * -1); margin-left: calc(var(--support-space-4) * -1); padding-right: var(--support-space-4); padding-left: var(--support-space-4); }
.layout-single .support-banner, .layout-single .support-notes-strip { margin-right: var(--support-space-4); margin-left: var(--support-space-4); }
.layout-single .support-triage { flex-wrap: wrap; }
.layout-single .support-thread-heading { grid-template-columns: auto minmax(0, 1fr); }
.layout-single .support-heading-actions { grid-column: 1 / -1; justify-content: flex-start; }
.layout-single .support-tabbar { flex-wrap: wrap; row-gap: 0; }
.layout-single .support-tabbar .support-thread-tabs { flex: 1 1 100%; gap: 2px; }
/* On a phone the tabs share the bar's width; a narrow screen scrolls the bar, not the page. */
.layout-single .support-thread-tabs > button {
  flex: 1 1 0; flex-direction: column; gap: 2px; min-width: 0; min-height: 52px; padding: 6px 4px 5px;
  font-size: var(--support-text-xs); line-height: 1.2;
}
.layout-single .support-thread-tabs > button > i { font-size: 17px; }
/* The count and the unread dot sit on the icon's corner. */
.layout-single .support-thread-tabs > button > .support-count,
.layout-single .support-thread-tabs > button > .support-tab-dot {
  position: absolute; top: 3px; left: calc(50% + 6px); min-width: 18px; height: 18px; margin: 0; padding: 0 5px; line-height: 18px;
}
.layout-single .support-viewers { margin-left: 0; padding-bottom: var(--support-space-2); }
.layout-single .support-triage-tools { width: 100%; padding-left: 24px; }
.layout-single .support-notes-strip { flex-wrap: wrap; }
.layout-single .support-notes-links { width: 100%; padding-left: 24px; }
.layout-single .support-search-key { display: none; }
.layout-single .support-notice, .layout-split .support-notice { right: var(--support-space-3); bottom: var(--support-space-3); left: var(--support-space-3); width: auto; max-width: 560px; margin: 0 auto; }
/* The staff note: the field takes the row; its hint is left out. */
.layout-single .support-note { grid-template-areas: "label label" "field send"; }
.layout-single .support-note .support-keys-hint { display: none; }
.layout-single .support-note textarea { height: 40px; min-height: 40px; }
.layout-single .support-note textarea:focus, .layout-single .support-note textarea:not(:placeholder-shown) { min-height: 76px; }

/* Touch: the inspector's small icon buttons and the queue's checkboxes get a
   full-size target; rows keep their look. */
@media (max-width: 680px), (pointer: coarse) {
  .support-inspector .support-dl { row-gap: var(--support-space-3); }
  .support-links a { min-height: var(--support-touch); }
  .support-history-merge { min-height: var(--support-touch); }
  .support-pagination .support-button { min-height: var(--support-touch); }
  .support-queue-tools .support-category-filter { min-height: var(--support-touch); }
  /* The 20px box is drawn inside a 40px target: a transparent 10px border is
     the extra target, and the box's own edge is an inset shadow. */
  .support-check.support-row-check {
    top: 14px; left: 6px; width: var(--support-touch); height: var(--support-touch); padding: 0;
    border: 10px solid transparent; border-radius: 14px; background-clip: padding-box; background-size: 14px 14px;
    box-shadow: inset 0 0 0 1px var(--support-border-strong);
  }
  .support-check.support-row-check:checked { border-color: transparent; box-shadow: inset 0 0 0 1px var(--support-accent); }
  .player-support .support-check.support-row-check:focus-visible { outline-offset: -8px; }
  .support-case-item.is-selecting .support-case-row { padding-left: 50px; }
}
</style>
