<template>
  <section class="support-chat" aria-label="Live chat">
    <!-- One compact block: the state on the first line with Player replies at its end,
         the reason under it. What Player replies does is its tooltip and description. -->
    <header class="chat-status support-callout" :class="statusTone">
      <i :class="statusIcon" class="chat-status-icon" aria-hidden="true"></i>
      <h3 class="chat-status-title">{{ status }}</h3>
      <!-- Player replies: whether the player's answers are accepted onto this case. Sending never depends on it. -->
      <div v-if="active || (canWrite && petitionAvailable)" class="chat-replies">
        <span class="chat-replies-state" :class="{ 'is-on': active }" :title="repliesEffect">Player replies: <b>{{ active ? 'On' : 'Off' }}</b></span>
        <span id="support-replies-effect" class="sr-only">{{ repliesEffect }}</span>
        <button v-if="active && canWrite" class="support-button is-sm" type="button" :disabled="busy" aria-describedby="support-replies-effect" :title="repliesEffect" @click="act('end')">
          <i class="fe fe-toggle-left" aria-hidden="true"></i> Turn off replies
        </button>
        <button v-else-if="canWrite" class="support-button is-sm" type="button" :disabled="busy || !canTurnOnReplies" aria-describedby="support-replies-effect" :title="repliesEffect"
                @click="act('start')">
          <i class="fe fe-toggle-right" aria-hidden="true"></i> Turn on replies
        </button>
      </div>
      <p class="chat-status-hint">{{ statusHint }}</p>
    </header>

    <p v-if="error && !errorInComposer" class="chat-error support-callout is-danger" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>
    <p v-else-if="notice" class="chat-error support-callout" role="status"><i class="fe fe-info" aria-hidden="true"></i><span>{{ notice }}</span></p>
    <!-- A log reads new messages aloud once; the history that is there when Live chat opens is not read out. -->
    <div ref="transcript" class="chat-transcript" role="log" aria-label="Chat messages" aria-relevant="additions" :aria-live="transcriptLive ? 'polite' : 'off'"
         tabindex="0" @scroll="onTranscriptScroll">
      <!-- The content in one box, so a change to its height (a message, a card, a late font) can keep the newest message in view. -->
      <div ref="transcriptContent" class="chat-transcript-content">
        <div v-if="!messages.length" class="chat-empty support-empty">
          <i class="fe fe-message-circle" aria-hidden="true"></i>
          <strong>No messages yet</strong>
          <p v-if="canWrite && composable">
            Your first message goes {{ mailing ? 'to ' + mailTo + '’s in-game mailbox' : 'as a tell to ' + target }}.
            While Player replies is on, the player can answer from any character on the account by tell or with <code>#petition</code>.
          </p>
          <p v-else>Tells and mail exchanged with any character on {{ record.character }}’s account appear here.</p>
        </div>
        <template v-for="row in rows">
          <div v-if="row.day" :key="'day-' + row.message.id" class="chat-day" role="separator"><span>{{ row.day }}</span></div>
          <article :key="row.message.id" class="chat-message"
                   :class="{ 'is-outgoing': row.message.kind === 'chat_out', 'is-continued': row.continued, 'is-afk': row.message.afk, 'is-afk-failed': row.message.afk === 'failed' }">
            <span v-if="row.message.kind === 'chat_out'" class="chat-avatar support-avatar is-sm is-accent" aria-hidden="true"><i class="fe fe-shield"></i></span>
            <span v-else class="chat-avatar support-avatar is-sm" :style="avatar(row.message.actor || record.character)" aria-hidden="true">{{ initial(row.message.actor || record.character) }}</span>
            <div class="chat-bubble">
              <div class="chat-message-meta" :class="{ 'sr-only': row.continued }">
                <strong>
                  <template v-if="row.message.kind === 'chat_out'">
                    {{ row.message.actor || 'Game Master' }}
                    <span v-if="row.message.recipient" class="chat-recipient">to {{ row.message.recipient }}</span>
                    <span v-if="row.message.persona" class="chat-recipient" :title="'Players saw this tell from (GM) ' + row.message.persona">as (GM) {{ row.message.persona }}</span>
                  </template>
                  <template v-else>{{ row.message.actor || record.character }}</template>
                  <span v-if="isAlt(row.message)" class="support-chip is-tag" :title="'Not the character that filed the petition (' + record.character + ')'">alt</span>
                </strong>
                <time :datetime="row.message.created_at" :title="fullTime(row.message.created_at)">{{ formatTime(row.message.created_at) }}</time>
              </div>
              <!-- A mail, the player's or a Game Master's Reply by mail: a card that opens it, instead of the whole letter in the conversation. -->
              <div v-if="isMail(row.message)" class="chat-mail-card" :title="row.continued ? fullTime(row.message.created_at) : null">
                <span class="chat-mail-card-icon" aria-hidden="true"><i class="fe fe-mail"></i></span>
                <span class="chat-mail-card-text">
                  <span v-if="row.message.kind === 'chat_out'" class="chat-mail-card-label">Sent by mail to {{ row.message.recipient || record.character }}</span>
                  <span v-else class="chat-mail-card-label">Mail from {{ row.message.actor || record.character }}</span>
                  <strong class="chat-mail-card-subject" :title="row.message.subject || null">{{ row.message.subject || '(No subject)' }}</strong>
                </span>
                <button type="button" class="support-button is-sm chat-mail-open" aria-haspopup="dialog"
                        :aria-label="'Read message: ' + (row.message.subject || 'mail from ' + (row.message.actor || record.character))" @click="mailMessage = row.message">
                  <i class="fe fe-book-open" aria-hidden="true"></i> Read message
                </button>
              </div>
              <p v-else :title="row.continued ? fullTime(row.message.created_at) : null"><strong v-if="row.message.subject" class="chat-subject">{{ row.message.subject }}</strong>{{ row.message.text }}</p>
              <div v-if="((row.message.delivery && row.message.delivery !== 'sent') || row.message.afk) && !isMail(row.message)" class="chat-message-foot">
                <!-- The player's client answered this tell as AFK, so it was forwarded by mail: one badge,
                     the full sentence in its tooltip and for screen readers. -->
                <span v-if="row.message.afk" class="chat-afk-badge" :class="{ 'is-failed': row.message.afk === 'failed' }" :title="afkSentence(row.message)">
                  <i :class="row.message.afk === 'failed' ? 'fe fe-alert-triangle' : 'fe fe-mail'" aria-hidden="true"></i>
                  <span aria-hidden="true">{{ afkLabel(row.message) }}</span>
                  <time v-if="row.message.afk_at" :datetime="row.message.afk_at" aria-hidden="true">{{ formatTime(row.message.afk_at) }}</time>
                  <span class="sr-only">{{ afkSentence(row.message) }}</span>
                </span>
                <span v-if="row.message.delivery && row.message.delivery !== 'sent'" class="chat-message-status support-chip" :class="deliveryTone(row.message.delivery)" :title="deliveryHint(row.message.delivery, row.message.kind)">
                  <i :class="deliveryIcon(row.message.delivery, row.message.kind)" aria-hidden="true"></i> {{ deliveryLabel(row.message.delivery, row.message.kind) }}
                </span>
                <!-- A failed message can go again as is; one that may have arrived is only put back in the box. -->
                <template v-if="canWrite && row.message.kind === 'chat_out' && (row.message.delivery === 'failed' || row.message.delivery === 'unconfirmed')">
                  <button v-if="row.message.delivery === 'failed'" type="button" class="support-link chat-message-action" :disabled="busy || !composable"
                          :aria-label="'Retry sending “' + shorten(row.message.text) + '”'" @click="resend(row.message)">
                    <i class="fe fe-rotate-cw" aria-hidden="true"></i> Retry
                  </button>
                  <button type="button" class="support-link chat-message-action" :disabled="!composable"
                          :aria-label="'Edit “' + shorten(row.message.text) + '” in the message box'" @click="editAgain(row.message)">
                    <i class="fe fe-edit-2" aria-hidden="true"></i> Edit
                  </button>
                </template>
              </div>
            </div>
          </article>
        </template>
      </div>
      <!-- New messages arrived while staff read earlier ones. -->
      <button v-if="newBelow" type="button" class="chat-jump support-button is-sm" @click="jumpToLatest">
        <i class="fe fe-arrow-down" aria-hidden="true"></i> New messages
      </button>
    </div>

    <form v-if="canWrite && composable" class="chat-composer" :aria-busy="busy ? 'true' : null" @submit.prevent="act('send')">
      <!-- Every reply the composer can use, searchable: Ctrl+. from the message box (Ctrl+/ is Spire's search). -->
      <div v-if="pickerOpen" ref="picker" class="chat-picker" @keydown.esc.stop.prevent="closePicker(true)" @focusout="onPickerFocusOut">
        <div class="support-search chat-picker-search">
          <i class="fe fe-search" aria-hidden="true"></i>
          <input ref="pickerSearch" v-model="pickerQuery" type="text" role="combobox" aria-label="Search replies" aria-autocomplete="list"
                 aria-expanded="true" aria-controls="support-reply-options" :aria-activedescendant="pickerItems.length ? 'support-reply-' + pickerIndex : null"
                 autocomplete="off" spellcheck="false" placeholder="Search saved and quick replies"
                 @input="pickerIndex = firstUsable()" @keydown.down.prevent="movePicker(1)" @keydown.up.prevent="movePicker(-1)" @keydown.enter.prevent="pickActive">
          <kbd class="support-kbd">Esc</kbd>
        </div>
        <ul v-if="pickerItems.length" id="support-reply-options" class="chat-picker-list" role="listbox" aria-label="Replies">
          <li v-for="(item, index) in pickerItems" :id="'support-reply-' + index" :key="item.key" role="option" class="chat-picker-option"
              :class="{ 'is-active': index === pickerIndex }" :aria-selected="String(index === pickerIndex)" :aria-disabled="item.fits ? null : 'true'"
              @mousedown.prevent @mousemove="pickerIndex = index" @click="pick(item)">
            <span class="chat-picker-title"><i :class="item.saved ? 'fe fe-bookmark' : 'fe fe-zap'" aria-hidden="true"></i>{{ item.label }}</span>
            <span class="chat-picker-text">{{ item.text }}</span>
            <small v-if="!item.fits">{{ item.reason }}</small>
          </li>
        </ul>
        <p v-else class="chat-picker-empty">No replies match “{{ pickerQuery.trim() }}”.</p>
        <p class="sr-only" role="status">{{ pickerStatus }}</p>
      </div>

      <div class="chat-quick-row">
        <button type="button" class="support-button is-ghost is-sm chat-picker-toggle" :aria-expanded="String(pickerOpen)" :aria-controls="pickerOpen ? 'support-reply-options' : null"
                aria-keyshortcuts="Control+." title="All replies (Ctrl+.)" @click="togglePicker">
          <i class="fe fe-bookmark" aria-hidden="true"></i> Replies
        </button>
        <div class="chat-quick support-suggestions" role="group" aria-label="Quick replies">
          <button v-for="reply in quickReplyList" :key="reply.key" type="button" :disabled="busy"
                  :title="reply.saved ? reply.text : null" @click="useQuickReply(reply.text)">
            <i v-if="reply.saved" class="fe fe-bookmark" aria-hidden="true"></i> {{ reply.label }}
          </button>
        </div>
      </div>

      <!-- Who the player hears from, then how this message reaches them and whether they can answer, before it is sent. -->
      <div class="chat-route">
        <!-- The Game Master's persona: the name players see on tells. Mail always comes from GameMaster. -->
        <button v-if="!mailing && persona.available" type="button" class="chat-identity" aria-haspopup="dialog"
                :aria-label="'Speaking as ' + speaker + '. Change the name players see'" :title="'Players see your tells from ' + speaker + '. Change'" @click="openPersona">
          <span class="chat-identity-avatar support-avatar is-xs is-accent" aria-hidden="true"><i class="fe fe-shield"></i></span>
          <span class="chat-identity-label" aria-hidden="true">Speaking as</span>
          <strong class="chat-identity-name" aria-hidden="true">{{ speaker }}</strong>
          <i class="fe fe-edit-2 chat-identity-edit" aria-hidden="true"></i>
        </button>
        <span v-else class="chat-identity is-static" :title="mailing ? 'Mail always comes from GameMaster' : personaLocked ? personaLockText : null">
          <span class="chat-identity-avatar support-avatar is-xs" aria-hidden="true"><i :class="mailing ? 'fe fe-mail' : 'fe fe-shield'"></i></span>
          <span class="chat-identity-label">{{ mailing ? 'From' : 'Speaking as' }}</span>
          <strong class="chat-identity-name">GameMaster</strong>
        </span>
        <span class="chat-route-to">
          <i :class="mailing ? 'fe fe-mail' : 'fe fe-send'" aria-hidden="true"></i>
          <label for="support-live-message">{{ mailing ? 'Mail ' + mailTo : 'Tell ' + target }}<span class="sr-only"> as {{ mailing ? 'GameMaster' : speaker }}</span></label>
        </span>
        <span v-if="onAlt && !mailing" class="support-chip is-tag" :title="'Not the character that filed the petition (' + record.character + ')'">alt</span>
        <span v-if="marquee" class="chat-route-extra" title="A delivered tell also shows on the player’s screen"><i class="fe fe-monitor" aria-hidden="true"></i> + on-screen marquee</span>
        <span v-else-if="mailing" class="chat-route-extra">· in-game mailbox</span>
        <span v-if="active" class="chat-answer"><i class="fe fe-check" aria-hidden="true"></i> Player can answer</span>
      </div>
      <!-- World takes no persona here: say so quietly, where the name would be chosen. -->
      <p v-if="personaLocked" class="support-blocked chat-identity-reason"><i class="fe fe-lock" aria-hidden="true"></i><span>{{ personaLockText }}. Tells come from GameMaster.</span></p>
      <!-- First use: a Game Master who never chose a name learns that they can. Dismissed once per browser. -->
      <div v-if="personaHint" class="chat-persona-hint" role="note" aria-label="Choose your name on tells">
        <span class="chat-persona-hint-avatar support-avatar is-sm is-accent" aria-hidden="true"><i class="fe fe-shield"></i></span>
        <p><strong>Players see your tells from (GM) Game Master.</strong>{{ ' ' }}Choose the name they see instead, such as (GM) Aranwen.</p>
        <button type="button" class="support-button is-sm chat-persona-hint-action" aria-haspopup="dialog" @click="openPersona">Choose a name</button>
        <button type="button" class="support-button is-ghost is-icon is-sm chat-persona-hint-close" aria-label="Dismiss the name tip" title="Dismiss" @click="dismissHint">
          <i class="fe fe-x" aria-hidden="true"></i>
        </button>
      </div>
      <p class="sr-only" role="status">{{ personaAnnouncement }}</p>

      <div v-if="error && errorInComposer" class="chat-send-error" role="alert">
        <i class="fe fe-alert-circle" aria-hidden="true"></i>
        <span>{{ error }}</span>
        <span v-if="errorRetry" class="chat-send-error-actions">
          <button type="button" class="support-button is-sm" :disabled="busy" @click="act('send')"><i class="fe fe-rotate-cw" aria-hidden="true"></i> Retry</button>
          <button v-if="canMail && !mailing" type="button" class="support-button is-sm" :disabled="busy" @click="mailInstead(draft)">
            <i class="fe fe-mail" aria-hidden="true"></i> Send by mail instead
          </button>
        </span>
      </div>

      <div class="chat-compose-row">
        <textarea id="support-live-message" ref="draft" v-model="draft" class="support-field" rows="2" maxlength="200" :readonly="busy"
                  :aria-invalid="error && errorInComposer && !errorRetry ? 'true' : null"
                  :placeholder="mailing ? 'Write a message to mail…' : 'Write a message…'"
                  @keydown="onComposerKey" @input="onDraftInput"></textarea>
        <button class="support-button is-primary chat-send" type="submit" :disabled="!draft.trim() || busy">
          <i :class="busy ? 'fe fe-loader support-spin' : mailing ? 'fe fe-mail' : 'fe fe-send'" aria-hidden="true"></i>
          {{ busy && sending ? 'Sending…' : mailing ? 'Send as mail' : 'Send' }}
        </button>
      </div>
      <div class="chat-compose-foot">
        <span class="chat-compose-keys">
          <span><kbd class="support-kbd is-quiet">Enter</kbd> to send</span>
          <span><kbd class="support-kbd is-quiet">Ctrl+.</kbd> replies</span>
          <span>One line of plain text</span>
        </span>
        <span v-if="draft.length >= 150" class="chat-count" :class="{ 'is-near': draft.length >= 180, 'is-full': draft.length >= 200 }">
          {{ draft.length >= 200 ? 'Limit reached · ' : '' }}{{ draft.length }}/200
        </span>
      </div>

      <p v-if="marqueeCut" class="chat-mail-note chat-marquee-note">
        <i class="fe fe-monitor" aria-hidden="true"></i>
        <span>The on-screen marquee shows the first part; the tell has the full message.
          <q class="chat-marquee-preview">{{ marqueePreview }}</q></span>
      </p>
      <p v-if="!active && patched" class="chat-mail-note">
        <i class="fe fe-message-square" aria-hidden="true"></i>
        <span>Player replies are off: the player can read this but cannot answer. The game tells them if they try.</span>
      </p>
      <p v-if="mailing" class="chat-mail-note">
        <i class="fe fe-mail" aria-hidden="true"></i>
        <span>The mail starts “This message was sent to you in response to your petition while you were offline:”
          <template v-if="!patched"> Without the server patch, the player cannot answer it in game.</template>
          <template v-else-if="mailReplies"> {{ mailRepliesHint }}</template></span>
      </p>
    </form>
    <!-- The message box is back as soon as the player can be reached; say why it is not here, and offer mail. -->
    <div v-else-if="canWrite && petitionAvailable && state !== 'connecting'" class="chat-blocked">
      <i :class="statusIcon" aria-hidden="true"></i>
      <span>{{ blockedText }}<template v-if="draft.trim()"> Your draft is kept.</template></span>
      <button v-if="canMail" type="button" class="support-button is-sm" @click="mailInstead(draft)">
        <i class="fe fe-mail" aria-hidden="true"></i> Send by mail instead
      </button>
    </div>

    <support-mail-view :message="mailMessage" :character="record.character" :can-reply="canWrite && canMail && Boolean(mailMessage) && mailMessage.kind === 'chat_in'"
                       @close="mailMessage = null" @reply="mailInstead('')" />
    <support-persona-editor v-if="personaOpen" :connection-id="connectionId" @saved="personaSaved" @close="personaClosed" />

    <b-modal v-model="confirmOpen" modal-class="support-modal" title="Another GM is on this case" centered scrollable @hidden="focusDraft">
      <p class="support-modal-lead">{{ confirmText }}</p>
      <template #modal-footer="{ cancel }">
        <button type="button" class="support-button" @click="cancel()">Cancel</button>
        <button type="button" class="support-button is-primary" @click="sendAnyway">Send anyway</button>
      </template>
    </b-modal>
  </section>
</template>

<script>
import axios from 'axios'
import {
  avatarStyle, dayLabel, deliveryHint, deliveryIcon, deliveryLabel, deliveryTone, fillReply, fitsTell, initials, mailRepliesHint,
  marqueeCuts, marqueeText, newRequestId, otherResponder, readDraft, saveDraft, tellText, timeTitle
} from './support-ui'
import { SpireApi } from '@/app/api/spire-api'
import UserContext from '@/app/user/UserContext'
import SupportMailView from './SupportMailView.vue'
import SupportPersonaEditor from './SupportPersonaEditor.vue'
import { dismissPersonaHint, loadPersona, personaHintDismissed, personaState, tellName } from './support-persona'

// How close to the end of the transcript still counts as reading the newest messages.
const pinSlack = 70

const builtInReplies = [
  'Hi, I am looking into this now.',
  'Can you tell me more about what happened?',
  'Please log in on any character so I can help.',
  'This should be fixed now. Let me know if not.'
]

export default {
  name: 'SupportLiveChat',
  components: { SupportMailView, SupportPersonaEditor },
  props: {
    record: { type: Object, required: true },
    // Shared saved replies; the ones that fit in a tell become quick replies.
    savedReplies: { type: Array, default: () => [] },
    connectionId: { type: Number, required: true },
    canWrite: { type: Boolean, default: false },
    // Whether this viewer may send Reply by mail, offered when a tell cannot go.
    canMail: { type: Boolean, default: false },
    // Other staff on this case ({ name, composing }), from presence.
    viewers: { type: Array, default: () => [] },
    // Patch features of the World behind this connection.
    features: { type: Object, default: () => ({}) }
  },
  data () {
    return {
      // The player's mail open in the reading dialog.
      mailMessage: null,
      // The name players see on this Game Master's tells, shared with the page header (support-persona.js).
      persona: personaState,
      personaOpen: false,
      personaHintHidden: personaHintDismissed(),
      personaAnnouncement: '',
      // The transcript keeps the newest message in view until staff scroll up to read
      // earlier ones, and again once they are back at the end or send a message.
      pinned: true,
      state: 'connecting',
      active: false,
      messages: [],
      cursor: 0,
      // The unsent draft is kept per case (support-ui.js).
      draft: readDraft('chat', this.record.key) || '',
      requestId: '',
      recipient: '',
      tellsOff: false,
      mailTo: '',
      companion: '',
      busy: false,
      sending: false,
      error: '',
      // A send error is shown by the message box; errorRetry when trying the same message again may help.
      errorInComposer: false,
      errorRetry: false,
      timer: null,
      cancellation: null,
      version: 0,
      stopped: false,
      me: '',
      confirmOpen: false,
      confirmText: '',
      confirmed: false,
      // A failed message being sent again, waiting on the "another GM" question.
      pendingResend: null,
      // Messages arrived below the part of the transcript on screen.
      newBelow: false,
      // The transcript announces additions only after the first load.
      transcriptLive: false,
      // How the last "Turn off replies" went, from the server.
      notice: '',
      pickerOpen: false,
      pickerQuery: '',
      pickerIndex: 0,
      mailRepliesHint
    }
  },
  computed: {
    endpoint () { return 'player-support/cases/' + encodeURIComponent(this.record.key) + '/chat' },
    petitionAvailable () {
      return this.record.native_open && this.record.status !== 'resolved' && !this.record.checked_out
    },
    // Tells reach whichever character on the petitioning account is in game.
    target () { return this.recipient || this.record.character },
    // With no character on the account in game, messages are mailed instead.
    mailing () { return this.state === 'offline' && Boolean(this.mailTo) },
    // Sending depends only on reaching the player, never on Player replies.
    composable () { return this.state === 'ready' || this.mailing },
    // World answered without the Player Support patch, or with an older one.
    patched () { return this.companion !== 'missing' && this.companion !== 'outdated' },
    mailReplies () { return Boolean(this.features && this.features.mail_replies) },
    // World also shows a delivered tell as an on-screen marquee, "Game Master: "
    // plus the message, cut to 120 characters.
    // "(GM) <persona>", or GameMaster where World takes no persona.
    speaker () { return tellName(this.persona) },
    // World on this connection takes no persona: say why, quietly, where the name would be chosen.
    personaLocked () { return !this.mailing && this.persona.loaded && !this.persona.available && Boolean(this.persona.reason) },
    personaLockText () {
      const reason = this.persona.reason
      return reason ? 'Custom name ' + reason.charAt(0).toLowerCase() + reason.slice(1) : ''
    },
    personaHint () {
      return !this.mailing && this.persona.loaded && this.persona.available && !this.persona.persona && !this.personaHintHidden
    },
    marquee () { return this.state === 'ready' && Boolean(this.features && this.features.marquee) },
    marqueeCut () { return this.marquee && marqueeCuts(this.draft) },
    marqueePreview () { return marqueeText(this.draft) },
    // Replies arrive only through the current patch, which need not wait for
    // the player to be in game. An older patch never turns them on.
    canTurnOnReplies () {
      return this.petitionAvailable && this.companion === 'ready' && (this.state === 'ready' || this.state === 'offline')
    },
    // What Player replies does now, and why it cannot be turned on.
    repliesEffect () {
      if (this.active) return this.canWrite ? 'Answers are added to this case. Turning off tells the player and mails a notice.' : 'Answers are added to this case.'
      if (!this.canWrite || this.canTurnOnReplies) return 'The player’s answers are not accepted.'
      if (this.companion === 'missing') return 'Needs the Player Support patch on World.'
      if (this.companion === 'outdated') return 'Needs the current Player Support patch.'
      if (this.state === 'connecting') return 'Checking World…'
      return 'World is unavailable right now.'
    },
    allReplies () {
      const saved = this.savedReplies.map(reply => {
        const text = fillReply(reply.body, this.record)
        const fits = fitsTell(text)
        return {
          key: 'saved-' + reply.id,
          label: reply.title,
          text,
          saved: true,
          fits,
          reason: fits ? '' : text.length > 200 ? 'Too long for a tell; use Reply by mail.' : 'Has characters a tell cannot carry; use Reply by mail.'
        }
      })
      return saved.concat(builtInReplies.map(text => ({ key: text, label: text, text, saved: false, fits: true, reason: '' })))
    },
    // A short row: saved replies that fit first, then built-in ones. Everything is in the picker.
    quickReplyList () {
      const saved = this.allReplies.filter(reply => reply.saved && reply.fits)
      const builtIn = this.allReplies.filter(reply => !reply.saved)
      return (saved.length ? saved.concat(builtIn.slice(0, 2)) : builtIn).slice(0, 4)
    },
    pickerStatus () {
      const count = this.pickerItems.length
      if (!count) return 'No replies match.'
      return count === 1 ? '1 reply. Up and down arrows to choose, Enter to insert.' : `${count} replies. Up and down arrows to choose, Enter to insert.`
    },
    pickerItems () {
      const words = this.pickerQuery.toLowerCase().split(/\s+/).filter(Boolean)
      return this.allReplies.filter(reply => {
        const haystack = (reply.label + ' ' + reply.text).toLowerCase()
        return words.every(word => haystack.includes(word))
      })
    },
    // Messages with a day separator where the day changes, and follow-ups from
    // the same sender within a few minutes drawn without repeating the header.
    rows () {
      const rows = []
      let previous = null
      let previousDay = ''
      for (const message of this.messages) {
        const day = dayLabel(message.created_at)
        const continued = Boolean(previous) && day === previousDay && previous.kind === message.kind &&
          (previous.actor || '') === (message.actor || '') && (previous.recipient || '') === (message.recipient || '') &&
          !message.subject && Math.abs(new Date(message.created_at) - new Date(previous.created_at)) < 5 * 60000
        rows.push({ message, day: day !== previousDay ? day : '', continued })
        previous = message
        previousDay = day
      }
      return rows
    },
    onAlt () { return Boolean(this.recipient) && this.recipient.toLowerCase() !== this.record.character.toLowerCase() },
    status () {
      if (this.state === 'ready') return 'Player in game'
      if (this.state === 'offline') return this.tellsOff ? 'Tells turned off' : 'Player not in game'
      if (this.state === 'connecting') return 'Connecting…'
      if (this.state === 'unsupported') return this.companion === 'outdated' ? 'Server patch out of date' : 'Needs the server patch'
      return 'Live chat unavailable'
    },
    // Colour only where it carries meaning: player replies are on, or World needs work.
    statusTone () {
      if (this.state === 'unsupported') return 'is-warning'
      return this.active ? 'is-success' : null
    },
    statusIcon () {
      if (this.state === 'ready') return 'fe fe-message-circle'
      if (this.state === 'offline') return this.tellsOff ? 'fe fe-bell-off' : this.mailTo ? 'fe fe-mail' : 'fe fe-moon'
      if (this.state === 'connecting') return 'fe fe-loader'
      if (this.state === 'unsupported') return 'fe fe-alert-triangle'
      return 'fe fe-slash'
    },
    // Say why the composer is unavailable so staff know what to change.
    statusHint () {
      const name = this.record.character
      if (!this.petitionAvailable) {
        if (this.record.status === 'resolved') return 'Reopen the case to message the player. The transcript is kept.'
        if (this.record.checked_out) return 'The petition is checked out in game. Check it back in to message the player.'
        return 'The in-game petition was cleared, so replies can no longer be matched to this case.'
      }
      const where = this.onAlt ? ` The account is playing ${this.recipient}, so tells go there.` : ''
      if (this.state === 'ready') {
        return (this.marquee ? 'Tells reach the player now, with an on-screen marquee.' : 'Tells reach the player now.') + where
      }
      if (this.state === 'offline') {
        return this.tellsOff
          ? `${this.recipient} has tells turned off. You can send tells again when they turn tells back on.`
          : this.mailTo
            ? `No character on ${name}’s account is in game. Messages you send now are mailed to ${this.mailTo} and kept here.` +
              (this.patched ? '' : ' The player cannot reply in game until World has the Player Support patch.')
            : `No character on ${name}’s account is in a zone. You can send tells when the player logs in on any character.`
      }
      if (this.state === 'connecting') return 'Checking World for this character…'
      if (this.state === 'unsupported') {
        return this.companion === 'outdated'
          ? `${this.recipient} is in game, but World has an older Player Support patch. Rebuild World and zones with the current patch to send tells.`
          : `${this.recipient} is in game, but World does not have the Player Support patch, so Spire cannot send tells. Reply by mail instead.`
      }
      if (this.recipient && this.companion === 'ready') {
        return `${this.recipient} is in game, but World’s chat stream is unavailable. Another Spire may be connected to it. Try again shortly.`
      }
      return 'Spire cannot reach a World server with the Player Support patch on this connection.'
    },
    // One line where the message box would be.
    blockedText () {
      if (this.state === 'offline' && this.tellsOff) return `${this.recipient || this.record.character} has tells turned off, so a tell cannot reach them.`
      if (this.state === 'offline') return 'The player is between zones. The message box comes back when they are in a zone.'
      if (this.state === 'unsupported') return this.companion === 'outdated' ? 'Tells need the current Player Support patch on World.' : 'Tells need the Player Support patch on World.'
      return 'Live chat cannot reach World right now.'
    }
  },
  watch: {
    petitionAvailable () { this.load() },
    // The page can hand this component the next case before re-creating it; each case has its own draft.
    'record.key' (key) {
      this.draft = readDraft('chat', key) || ''
      this.requestId = ''
      this.error = ''
      this.pinned = true
    },
    // The page tells other staff while a reply is being written; the draft is kept per case.
    draft (value, previous) {
      if (Boolean(value.trim()) !== Boolean(previous.trim())) this.$emit('composing', Boolean(value.trim()))
      saveDraft('chat', this.record.key, value)
    }
  },
  created () {
    // Where this component last scrolled the transcript to, to tell its own scrolling from staff's.
    this.scrolledTo = null
    this.resizeObserver = null
    UserContext.getUser().then(user => { this.me = (user && user.user_name) || '' }).catch(() => {})
  },
  mounted () {
    loadPersona(this.connectionId)
    document.addEventListener('visibilitychange', this.onVisibility)
    if (this.draft.trim()) this.$emit('composing', true)
    // Anything that changes the transcript's height or its content's (the message box
    // growing, the page fitting the window, a card or a font arriving late, the phone's
    // keyboard) keeps the newest message in view while the transcript is pinned.
    if (window.ResizeObserver) {
      this.resizeObserver = new window.ResizeObserver(() => this.keepPinned())
      if (this.$refs.transcript) this.resizeObserver.observe(this.$refs.transcript)
      if (this.$refs.transcriptContent) this.resizeObserver.observe(this.$refs.transcriptContent)
    }
    this.load()
  },
  updated () {
    // Every render that may have changed the transcript: new messages, the message
    // box appearing or growing.
    this.keepPinned()
  },
  beforeDestroy () {
    this.stopped = true
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.draft.trim()) this.$emit('composing', false)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.cancelLoad()
  },
  methods: {
    avatar (name) { return avatarStyle(name) },
    initial (name) { return initials(name) },
    shorten (text) { return text.length > 40 ? text.slice(0, 39) + '…' : text },
    // Pasted typographic quotes, dashes, spaces and line breaks become the
    // one line of ASCII a tell can carry; the box grows with the draft.
    onDraftInput (event) {
      this.requestId = ''
      if (this.errorInComposer) this.error = ''
      const area = this.$refs.draft
      if (!area) return
      if (event && event.target === area) {
        const plain = tellText(area.value)
        if (plain !== area.value) {
          const caret = area.selectionStart + (plain.length - area.value.length)
          this.draft = plain.slice(0, 200)
          this.$nextTick(() => area.setSelectionRange(caret, caret))
        }
      }
      area.style.height = 'auto'
      area.style.height = Math.min(area.scrollHeight + 2, 150) + 'px'
    },
    onComposerKey (event) {
      if ((event.ctrlKey || event.metaKey) && event.key === '.') {
        event.preventDefault()
        this.openPicker()
        return
      }
      // A tell is one line: Enter sends, and no key adds a line break. Never while an input method is composing.
      if (event.key === 'Enter' && !event.isComposing) {
        event.preventDefault()
        if (!event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) this.act('send')
      }
    },
    useQuickReply (reply) {
      const current = this.draft.trim()
      const next = current ? `${current} ${reply}` : reply
      this.draft = next.slice(0, 200)
      this.$nextTick(() => {
        this.onDraftInput()
        if (this.$refs.draft) this.$refs.draft.focus()
      })
    },
    togglePicker () {
      if (this.pickerOpen) this.closePicker(true)
      else this.openPicker()
    },
    openPicker () {
      this.pickerQuery = ''
      this.pickerIndex = this.firstUsable()
      this.pickerOpen = true
      this.$nextTick(() => this.$refs.pickerSearch && this.$refs.pickerSearch.focus())
    },
    closePicker (refocus) {
      this.pickerOpen = false
      if (refocus) this.$nextTick(this.focusDraft)
    },
    onPickerFocusOut (event) {
      const picker = this.$refs.picker
      if (picker && event.relatedTarget && picker.contains(event.relatedTarget)) return
      // The toggle button handles its own click.
      if (event.relatedTarget && event.relatedTarget.classList.contains('chat-picker-toggle')) return
      this.closePicker(false)
    },
    firstUsable (from = 0, step = 1) {
      const items = this.pickerItems
      for (let i = 0; i < items.length; i++) {
        const index = ((from + i * step) % items.length + items.length) % items.length
        if (items[index].fits) return index
      }
      return 0
    },
    movePicker (step) {
      if (!this.pickerItems.length) return
      this.pickerIndex = this.firstUsable(this.pickerIndex + step, step)
      this.$nextTick(() => {
        const option = this.$el.querySelector('#support-reply-' + this.pickerIndex)
        if (option) option.scrollIntoView({ block: 'nearest' })
      })
    },
    pickActive () {
      const item = this.pickerItems[this.pickerIndex]
      if (item) this.pick(item)
    },
    pick (item) {
      if (!item.fits) return
      this.closePicker(false)
      this.useQuickReply(item.text)
    },
    openPersona () { this.personaOpen = true },
    personaSaved () {
      this.personaAnnouncement = 'Players now see your tells from ' + tellName(this.persona) + '.'
      // Choosing a name, or the default on purpose, answers the tip for good.
      if (!this.personaHintHidden) this.dismissHint(false)
    },
    // The dialog gives focus back to what opened it; when that was the tip, now gone, the name takes it.
    personaClosed () {
      this.personaOpen = false
      setTimeout(() => {
        const active = document.activeElement
        if (this.stopped || (active && active !== document.body)) return
        const identity = this.$el.querySelector('.chat-identity')
        if (identity && identity.tagName === 'BUTTON') identity.focus()
      }, 30)
    },
    dismissHint (focus = true) {
      this.personaHintHidden = true
      dismissPersonaHint()
      if (focus) this.$nextTick(this.focusDraft)
    },
    // The distance from what is on screen to the end of the transcript.
    transcriptGap () {
      const area = this.$refs.transcript
      return area ? area.scrollHeight - area.scrollTop - area.clientHeight : 0
    },
    scrollToLatest () {
      const area = this.$refs.transcript
      if (!area) return
      area.scrollTop = area.scrollHeight
      this.scrolledTo = area.scrollTop
    },
    keepPinned () {
      if (this.pinned && this.transcriptGap() > 1) this.scrollToLatest()
    },
    afkLabel (message) {
      if (message.afk === 'failed') return 'AFK · mail failed'
      if (message.afk === 'pending') return 'AFK · mailing…'
      return 'AFK · sent by mail'
    },
    afkSentence (message) {
      const name = message.recipient || this.record.character
      const at = message.afk_at ? ' (' + this.fullTime(message.afk_at) + ')' : ''
      if (message.afk === 'failed') return `${name} was AFK; mailing this message failed${at}. Send it again or use Reply by mail.`
      if (message.afk === 'pending') return `${name} was AFK; this message is being sent by in-game mail.`
      return `${name} was AFK; this message was also sent by in-game mail${at}.`
    },
    // Shown as a card: a player's message that came by mail (see acceptInbound),
    // and a case's Reply by mail (see mailReplyMessages), which has a subject.
    // A short Live chat message mailed to an offline player stays a bubble.
    isMail (message) {
      if (message.delivery !== 'mail') return false
      return message.kind === 'chat_in' || (message.kind === 'chat_out' && Boolean(message.subject))
    },
    isAlt (message) {
      const name = message.kind === 'chat_out' ? message.recipient : message.actor
      return Boolean(name) && name.toLowerCase() !== this.record.character.toLowerCase()
    },
    deliveryLabel (status, kind) { return deliveryLabel(status, kind) },
    deliveryTone (status) { return deliveryTone(status) },
    deliveryIcon (status, kind) { return deliveryIcon(status, kind) },
    deliveryHint (status, kind) { return deliveryHint(status, kind) },
    formatTime (value) { return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(value)) },
    fullTime (value) { return timeTitle(value) },
    errorText (error) { return (error.response && error.response.data && error.response.data.error) || 'Live chat request failed' },
    cancelLoad () {
      this.version++
      clearTimeout(this.timer)
      if (this.cancellation) this.cancellation.cancel()
    },
    onVisibility () {
      if (document.hidden) this.cancelLoad()
      else this.load()
    },
    async load (wait = false) {
      if (this.stopped || document.hidden) return
      this.cancelLoad()
      const version = this.version
      const cancellation = axios.CancelToken.source()
      this.cancellation = cancellation
      let delay = 8000
      try {
        const params = { connection_id: this.connectionId }
        if (wait && this.active) params.after = this.cursor
        const { data } = await SpireApi.v1().get(this.endpoint, { params, cancelToken: cancellation.token, timeout: 17000 })
        if (this.stopped || version !== this.version) return
        // Pinned: staff are reading the newest messages (or have not scrolled up since
        // Live chat opened), so the transcript follows what arrives.
        const following = this.pinned
        const grew = (data.cursor || 0) > (this.cursor || 0) && this.messages.length > 0
        this.state = data.state
        this.active = data.active
        this.recipient = data.recipient || ''
        this.tellsOff = Boolean(data.tells_off)
        this.mailTo = data.mail_to || ''
        this.companion = data.companion || ''
        this.messages = data.messages || []
        const replies = this.messages.filter(message => message.kind === 'chat_in')
        // A player message counts as seen once it is on screen.
        if (replies.length && following) this.$emit('seen', replies[replies.length - 1].created_at)
        if (!following && grew) this.newBelow = true
        this.cursor = data.cursor
        delay = this.active ? 350 : 8000
        // The render this answer causes scrolls a pinned transcript to the end (updated).
        if (!this.transcriptLive) {
          this.$nextTick(() => { this.transcriptLive = true })
          this.$emit('loaded')
        }
      } catch (error) {
        if (this.stopped || version !== this.version || axios.isCancel(error)) return
        this.state = 'unavailable'
        if (!this.transcriptLive) this.$emit('loaded')
      } finally {
        if (!this.stopped && version === this.version) {
          this.timer = setTimeout(() => this.load(true), delay)
        }
      }
    },
    onTranscriptScroll () {
      const area = this.$refs.transcript
      if (!area) return
      // A scroll this component made keeps the pin; one by staff pins only near the end.
      if (this.scrolledTo !== null && Math.abs(area.scrollTop - this.scrolledTo) <= 1) {
        this.scrolledTo = null
      } else {
        this.pinned = this.transcriptGap() < pinSlack
      }
      if (this.transcriptGap() >= pinSlack) return
      if (this.newBelow) this.newBelow = false
      const replies = this.messages.filter(message => message.kind === 'chat_in')
      if (replies.length) this.$emit('seen', replies[replies.length - 1].created_at)
    },
    jumpToLatest () {
      this.pinned = true
      this.scrollToLatest()
      this.newBelow = false
      this.onTranscriptScroll()
    },
    focusDraft () { if (this.$refs.draft) this.$refs.draft.focus() },
    // Puts a message that failed or may not have arrived back in the box, keeping any draft.
    editAgain (message) {
      const current = this.draft.trim()
      this.draft = (current && current !== message.text ? `${current} ${message.text}` : message.text).slice(0, 200)
      this.$nextTick(() => {
        this.onDraftInput()
        this.focusDraft()
      })
    },
    resend (message) { this.act('send', message.text) },
    // Opens Reply by mail with this text, for when a tell cannot go.
    mailInstead (text) { this.$emit('mail', (text || '').trim()) },
    sendAnyway () {
      this.confirmed = true
      this.confirmOpen = false
      const text = this.pendingResend
      this.pendingResend = null
      this.act('send', text)
    },
    // `resendText` sends a failed message again, as a new message, without touching the draft.
    async act (action, resendText = null) {
      if (!this.canWrite || this.busy) return
      if ((action === 'start' && !this.canTurnOnReplies) || (action === 'send' && !this.composable)) return
      const fromDraft = action === 'send' && resendText === null
      const text = fromDraft ? tellText(this.draft).trim() : (resendText || '').trim()
      if (action === 'send' && !text) return
      if (action === 'send') {
        const odd = text.match(/[^\x20-\x7E]/)
        if (odd) {
          this.error = `Remove “${odd[0]}”: tells and Game Master mail carry plain ASCII text only.`
          this.errorInComposer = true
          this.errorRetry = false
          return
        }
      }
      // Ask first when another Game Master is writing or just wrote to the player.
      if (action === 'send' && !this.confirmed) {
        const other = otherResponder(this.viewers, this.messages.filter(message => message.kind === 'chat_out'), this.me)
        if (other) {
          const to = this.mailing ? this.mailTo : this.target
          this.confirmText = other.composing
            ? `${other.name} is also writing to ${to}.`
            : `${other.name} messaged ${to} ${other.minutes} ${other.minutes === 1 ? 'minute' : 'minutes'} ago.`
          this.pendingResend = resendText
          this.confirmOpen = true
          return
        }
      }
      if (action === 'send') this.confirmed = false
      // A message staff send is always followed to the end of the transcript.
      if (action === 'send') {
        this.pinned = true
        this.newBelow = false
      }
      this.busy = true
      this.sending = action === 'send'
      this.error = ''
      this.errorInComposer = false
      this.notice = ''
      // A draft keeps its request ID until it is sent or edited, so Retry cannot send it twice.
      if (fromDraft && !this.requestId) this.requestId = newRequestId()
      const requestId = fromDraft ? this.requestId : action === 'send' ? newRequestId() : this.requestId
      try {
        const response = await SpireApi.v1().put(this.endpoint, { action, text, request_id: requestId }, { params: { connection_id: this.connectionId } })
        // Turning replies off tells the player; the answer says how that went.
        if (action === 'end') this.notice = (response && response.data && response.data.message) || ''
        if (fromDraft) {
          this.draft = ''
          this.requestId = ''
          this.$nextTick(this.onDraftInput)
        }
      } catch (error) {
        // The draft stays in the box; a resend's text was never taken from it.
        this.error = this.errorText(error)
        this.errorInComposer = action === 'send'
        this.errorRetry = fromDraft
      } finally {
        this.busy = false
        this.sending = false
        await this.load()
        if (action !== 'end' && !this.stopped) {
          this.$nextTick(() => {
            const input = this.$el.querySelector('#support-live-message')
            if (input) input.focus()
          })
        }
      }
    }
  }
}
</script>

<style scoped>
/* Layout only. Colours, type, radius and spacing come from support-theme.css. */
.support-chat { flex: 1; display: flex; flex-direction: column; min-height: 440px; }
/* Where the page scrolls as a whole, Live chat is one window tall, so the
   transcript, the message box and its Send button are all on screen together
   (the page scrolls it into view when the tab opens). */
.player-support:not(.is-fill) .support-chat { flex: none; min-height: min(calc(var(--support-vh, 100vh) - 16px), 900px); }
/* A zero basis: the transcript takes the room left and scrolls, and never
   grows the section; a tall message box grows the section instead. */
.player-support:not(.is-fill) .chat-transcript { flex: 1 1 0; min-height: 160px; }

/* Status: a callout row flush with the pane: state and reason, then Player replies.
   The left edge takes a tone only when it means something (player replies on, World needs the patch). */
.chat-status {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "icon title replies" "icon hint hint";
  align-items: center; gap: 2px var(--support-space-3);
  margin: 0; padding: var(--support-space-2) var(--support-space-5) var(--support-space-3) calc(var(--support-space-5) - 3px);
  border-top: 0; border-right: 0; border-bottom: 1px solid var(--support-border); border-radius: 0;
  background: var(--support-pane);
}
.chat-status:not(.is-success):not(.is-warning) { border-left-color: transparent; }
.chat-status > .chat-status-icon { grid-area: icon; align-self: start; margin-top: 7px; }
.chat-status h3 { grid-area: title; margin: 0; color: var(--support-text); font-family: inherit; font-size: var(--support-text-sm); font-weight: 600; line-height: 1.5; }
.chat-status .chat-status-hint { grid-area: hint; margin: 0; color: var(--support-muted); }

/* Player replies: the state and the one action, at the end of the first line. */
.chat-replies { display: flex; grid-area: replies; align-items: center; justify-content: flex-end; gap: var(--support-space-2); min-height: 32px; }
.chat-replies-state { color: var(--support-text-secondary); font-size: var(--support-text-xs); font-weight: 600; white-space: nowrap; }
.chat-replies-state b {
  display: inline-flex; align-items: center; gap: 5px; margin-left: 2px; padding: 1px var(--support-space-2);
  border-radius: var(--support-radius-sm); background: var(--support-raised); color: var(--support-muted); font-weight: 600;
}
.chat-replies-state b::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--support-faint); }
.chat-replies-state.is-on b { background: var(--support-success-soft); color: var(--support-success); }
.chat-replies-state.is-on b::before { background: var(--support-success); }
.chat-replies .support-button { flex: none; }
.chat-error { margin: var(--support-space-3) var(--support-space-5) 0; }

/* Transcript */
.chat-transcript {
  flex: 1; display: flex; flex-direction: column; min-height: 260px; max-height: 480px;
  padding: var(--support-space-4) var(--support-space-5); overflow: auto; overflow-anchor: none;
}
/* Fills the transcript, so the empty state can centre in it. */
.chat-transcript-content { display: flex; flex: 1 0 auto; flex-direction: column; gap: var(--support-space-4); }
/* Filling the window, or one window tall, the transcript takes the room left. */
.player-support.is-fill .support-chat { min-height: 0; }
.player-support .chat-transcript { max-height: none; min-height: 0; }
.player-support .chat-transcript:focus-visible { outline-offset: -2px; }
.chat-empty { flex: 1; }
.chat-empty p { max-width: 46ch; }
.chat-jump { position: sticky; bottom: var(--support-space-2); z-index: 1; align-self: center; flex: none; box-shadow: var(--support-shadow-panel); }
.chat-day { position: relative; display: flex; flex: none; justify-content: center; }
.chat-day::before { content: ""; position: absolute; top: 50%; right: 0; left: 0; height: 1px; background: var(--support-border-subtle); }
.chat-day span {
  position: relative; padding: 1px var(--support-space-3); border: 1px solid var(--support-border-subtle); border-radius: var(--support-radius-pill);
  background: var(--support-bg); color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 600;
}
.chat-message { display: flex; flex: none; align-items: flex-start; gap: var(--support-space-3); align-self: flex-start; max-width: min(82%, 760px); min-width: 160px; }
.chat-message.is-outgoing { align-self: flex-end; flex-direction: row-reverse; }
/* A follow-up from the same sender sits close under the one before, without its own header. */
.chat-message.is-continued { margin-top: calc(var(--support-space-1) - var(--support-space-4)); }
.chat-message.is-continued .chat-avatar { visibility: hidden; height: 0; }
.chat-message.is-continued .chat-bubble { padding-top: 0; }
.chat-bubble { display: flex; flex: 1; flex-direction: column; align-items: flex-start; min-width: 0; padding-top: var(--support-space-1); }
.is-outgoing .chat-bubble { align-items: flex-end; }
.chat-avatar > i { font-size: 13px; }
.chat-message-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px var(--support-space-2); margin-bottom: 6px; line-height: 1.4; }
.is-outgoing .chat-message-meta { flex-direction: row-reverse; }
.chat-message-meta strong { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; min-width: 0; color: var(--support-text); font-size: var(--support-text-sm); font-weight: 600; overflow-wrap: anywhere; }
.chat-recipient { color: var(--support-muted); font-size: var(--support-text-xs); font-weight: 400; }
.chat-message-meta time { color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.chat-message p {
  max-width: 100%; margin: 0; padding: var(--support-space-2) var(--support-space-3);
  border: 1px solid var(--support-border); border-radius: 0 var(--support-radius-lg) var(--support-radius-lg);
  background: var(--support-raised); color: var(--support-text);
  font-size: var(--support-text-md); line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere;
}
.chat-message.is-outgoing p {
  border-color: var(--support-accent-line); border-radius: var(--support-radius-lg) 0 var(--support-radius-lg) var(--support-radius-lg);
  background: var(--support-accent-soft);
}
.chat-message.is-continued p { border-radius: var(--support-radius-lg); }
.chat-subject { display: block; margin-bottom: 2px; font-weight: 600; }
/* A player's mail: icon, who and subject, and the button that opens it. */
.chat-mail-card {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--support-space-2) var(--support-space-3);
  width: min(100%, 440px); padding: var(--support-space-2) var(--support-space-3);
  border: 1px solid var(--support-border); border-left: 3px solid var(--support-accent-line);
  border-radius: 0 var(--support-radius-lg) var(--support-radius-lg); background: var(--support-raised);
}
.chat-message.is-continued .chat-mail-card { border-radius: 0 var(--support-radius-lg) var(--support-radius-lg) 0; }
.chat-message.is-outgoing .chat-mail-card {
  border-color: var(--support-accent-line); border-left-width: 1px; border-right: 3px solid var(--support-accent);
  border-radius: var(--support-radius-lg) 0 var(--support-radius-lg) var(--support-radius-lg); background: var(--support-accent-soft);
}
.chat-mail-card-icon {
  display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%;
  background: var(--support-accent-soft); color: var(--support-accent-text); font-size: 14px;
}
.chat-mail-card-text { display: flex; flex-direction: column; min-width: 0; line-height: 1.4; }
.chat-mail-card-label { color: var(--support-muted); font-size: var(--support-text-xs); }
.chat-mail-card-subject { overflow: hidden; color: var(--support-text); font-size: var(--support-text-md); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.chat-mail-open { flex: none; }
@media (max-width: 680px) {
  .chat-mail-card { grid-template-columns: auto minmax(0, 1fr); }
  .chat-mail-open { grid-column: 1 / -1; justify-self: start; }
}
/* A tell the player's client answered as AFK: amber edge and tint and one badge;
   danger colours when the mail failed. */
.chat-message.is-afk .chat-bubble > p { border-color: var(--support-warning-line); border-right: 3px solid var(--support-warning); background: var(--support-warning-soft); }
.chat-message.is-afk-failed .chat-bubble > p { border-color: var(--support-danger-line); border-right-color: var(--support-danger); background: var(--support-danger-soft); }
.chat-afk-badge {
  display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
  border: 1px solid var(--support-warning-line); border-radius: var(--support-radius-pill);
  background: var(--support-warning-soft); color: var(--support-warning); font-size: var(--support-text-xs); font-weight: 700;
}
.chat-afk-badge time { color: var(--support-text-secondary); font-weight: 500; font-variant-numeric: tabular-nums; }
.chat-afk-badge.is-failed { border-color: var(--support-danger-line); background: var(--support-danger-soft); color: var(--support-danger); }
.chat-message-foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-1) var(--support-space-3); margin-top: 6px; }
/* Right-aligned in DOM order, so focus moves left to right as it reads. */
.is-outgoing .chat-message-foot { justify-content: flex-end; }
.chat-message-action { display: inline-flex; align-items: center; gap: 4px; font-size: var(--support-text-xs); }
.chat-message-action > i { font-size: 11px; }

/* Composer */
.chat-composer {
  position: relative; display: flex; flex-direction: column; gap: var(--support-space-2);
  padding: var(--support-space-3) var(--support-space-5) var(--support-space-4); border-top: 1px solid var(--support-border); background: var(--support-pane);
}
.chat-quick-row { display: flex; align-items: center; gap: var(--support-space-2); min-width: 0; }
.chat-picker-toggle { flex: none; }
.chat-picker-toggle[aria-expanded="true"] { background: var(--support-selected); color: var(--support-text); }
/* One row; more than fits scrolls sideways, and every reply is in the picker. */
.chat-quick {
  flex: 1; flex-wrap: nowrap; min-width: 0; padding: 2px; margin: -2px; overflow-x: auto; scrollbar-width: none;
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 24px), transparent);
  mask-image: linear-gradient(to right, #000 calc(100% - 24px), transparent);
}
.chat-quick::-webkit-scrollbar { display: none; }
.chat-quick > button { flex: none; white-space: nowrap; }
.chat-quick > button:last-child { margin-right: var(--support-space-4); }

.chat-route { display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-1) var(--support-space-2); margin-top: 2px; font-size: var(--support-text-xs); line-height: 1.5; }
.chat-route-to { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.chat-route-to > i { color: var(--support-accent-text); font-size: 12px; }
.chat-route label { margin: 0; color: var(--support-text); font-size: var(--support-text-xs); font-weight: 600; }

/* Who the player hears from: the name exactly as the tell shows it, gold while it can be
   changed, with the pencil that opens the editor. Quiet and locked where it cannot. */
.chat-identity {
  display: inline-flex; align-items: center; gap: 6px; min-width: 0; max-width: 100%; min-height: 28px; margin: 0; padding: 2px 10px 2px 3px;
  border: 1px solid var(--support-accent-line); border-radius: var(--support-radius-pill);
  background: var(--support-accent-soft); color: var(--support-text-secondary); font-size: var(--support-text-xs); line-height: 1.3;
  transition: var(--support-transition);
}
button.chat-identity { cursor: pointer; }
button.chat-identity:hover { border-color: var(--support-accent); background: rgba(223, 185, 118, .2); }
.chat-identity-avatar { flex: none; }
.chat-identity-avatar > i { font-size: 10px; }
.chat-identity-label { flex: none; color: var(--support-muted); }
.chat-identity-name { min-width: 0; overflow: hidden; color: var(--support-accent-text); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.chat-identity-edit { flex: none; color: var(--support-accent-text); font-size: 11px; opacity: .8; transition: var(--support-transition); }
button.chat-identity:hover .chat-identity-edit, button.chat-identity:focus-visible .chat-identity-edit { opacity: 1; }
.chat-identity.is-static { border-color: var(--support-border); background: var(--support-raised); }
.chat-identity.is-static .chat-identity-name { color: var(--support-text); }
.chat-identity.is-static .chat-identity-edit { color: var(--support-faint); }
.chat-identity-reason { margin-top: -2px; }

/* First use: one quiet line with the way in and a dismiss. */
.chat-persona-hint {
  display: flex; align-items: center; gap: var(--support-space-2) var(--support-space-3); padding: var(--support-space-2) var(--support-space-2) var(--support-space-2) var(--support-space-3);
  border: 1px solid var(--support-accent-line); border-radius: var(--support-radius-lg); background: var(--support-accent-soft);
}
.chat-persona-hint > .support-avatar { flex: none; }
.chat-persona-hint > p { flex: 1 1 auto; min-width: 0; margin: 0; color: var(--support-text-secondary); font-size: var(--support-text-xs); line-height: 1.45; }
.chat-persona-hint > p strong { color: var(--support-text); font-weight: 600; }
.chat-persona-hint > .support-button { flex: none; }
.chat-persona-hint-close { color: var(--support-muted); }
.chat-route-extra { display: inline-flex; align-items: center; gap: 4px; color: var(--support-muted); }
.chat-route-extra > i { font-size: 11px; }
.chat-answer { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; color: var(--support-success); font-weight: 600; }
.chat-answer > i { font-size: 12px; }

.chat-send-error {
  display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-2) var(--support-space-3); padding: var(--support-space-2) var(--support-space-3);
  border: 1px solid var(--support-danger-line); border-radius: var(--support-radius); background: var(--support-danger-soft);
  color: var(--support-text); font-size: var(--support-text-sm); line-height: 1.45;
}
.chat-send-error > i { color: var(--support-danger); }
.chat-send-error > span:first-of-type { flex: 1 1 200px; }
.chat-send-error-actions { display: flex; flex-wrap: wrap; gap: var(--support-space-2); }

.chat-compose-row { display: flex; align-items: flex-end; gap: var(--support-space-2); }
.chat-compose-row textarea { flex: 1; min-width: 0; max-height: 150px; resize: none; }
.chat-compose-row textarea[readonly] { color: var(--support-text-secondary); }
.chat-send { flex: none; min-width: 96px; }
.chat-compose-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 2px var(--support-space-3); color: var(--support-faint); font-size: var(--support-text-xs); }
.chat-compose-keys { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px var(--support-space-3); }
.chat-compose-keys > span { display: inline-flex; align-items: center; gap: 5px; }
.chat-count { margin-left: auto; color: var(--support-muted); font-variant-numeric: tabular-nums; }
.chat-count.is-near { color: var(--support-warning); }
.chat-count.is-full { font-weight: 600; }
.chat-mail-note { display: flex; align-items: flex-start; gap: 6px; margin: 0; color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.5; }
.chat-mail-note > i { flex: none; margin-top: 3px; color: var(--support-faint); }
.chat-marquee-preview { display: block; margin-top: 2px; color: var(--support-text-secondary); overflow-wrap: anywhere; }

/* Picker: above the message box, over the end of the transcript. */
.chat-picker {
  position: absolute; right: var(--support-space-5); bottom: calc(100% - var(--support-space-2)); left: var(--support-space-5); z-index: 3;
  display: flex; flex-direction: column; max-height: min(360px, 60vh); padding: var(--support-space-2);
  border: 1px solid var(--support-border-strong); border-radius: var(--support-radius-lg); background: var(--support-raised); box-shadow: var(--support-shadow-panel);
}
.chat-picker-search { flex: none; }
.chat-picker-list { flex: 0 1 auto; min-height: 0; margin: var(--support-space-2) 0 0; padding: 0; overflow: auto; list-style: none; }
.chat-picker-option {
  display: grid; gap: 2px; padding: var(--support-space-2) var(--support-space-3); border-radius: var(--support-radius);
  cursor: pointer; transition: var(--support-transition);
}
.chat-picker-option.is-active { background: var(--support-selected); box-shadow: inset 2px 0 0 var(--support-accent); }
.chat-picker-option[aria-disabled="true"] { cursor: not-allowed; }
.chat-picker-option[aria-disabled="true"] .chat-picker-title,
.chat-picker-option[aria-disabled="true"] .chat-picker-text { opacity: .55; }
.chat-picker-title { display: flex; align-items: center; gap: 6px; color: var(--support-text); font-size: var(--support-text-sm); font-weight: 600; }
.chat-picker-title > i { color: var(--support-muted); font-size: 12px; }
.chat-picker-text { overflow: hidden; color: var(--support-text-secondary); font-size: var(--support-text-xs); line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.chat-picker-option small { color: var(--support-warning); font-size: var(--support-text-xs); }
.chat-picker-empty { margin: var(--support-space-3) var(--support-space-2) var(--support-space-1); color: var(--support-muted); font-size: var(--support-text-sm); }

/* Where the message box would be, when a tell cannot go. */
.chat-blocked {
  display: flex; flex-wrap: wrap; align-items: center; gap: var(--support-space-2) var(--support-space-3);
  padding: var(--support-space-3) var(--support-space-5); border-top: 1px solid var(--support-border); background: var(--support-pane);
  color: var(--support-text-secondary); font-size: var(--support-text-sm); line-height: 1.5;
}
.chat-blocked > i { color: var(--support-muted); }
.chat-blocked > span { flex: 1 1 240px; }

@media (min-width: 1900px) {
  .chat-status { padding-right: var(--support-space-6); padding-left: calc(var(--support-space-6) - 3px); }
  .chat-error { margin-right: var(--support-space-6); margin-left: var(--support-space-6); }
  .chat-transcript, .chat-composer, .chat-blocked { padding-right: var(--support-space-6); padding-left: var(--support-space-6); }
  .chat-picker { right: var(--support-space-6); left: var(--support-space-6); }
}
/* A phone or a narrow page: tighter edges, the keyboard hints left out, and the
   notes under the message box kept to what changes how the message goes. */
.layout-single .chat-status { padding: var(--support-space-2) var(--support-space-4) var(--support-space-2) calc(var(--support-space-4) - 3px); }
.layout-single .chat-status p { font-size: var(--support-text-xs); }
.layout-single .chat-status { grid-template-areas: "icon title" "icon hint" "replies replies"; grid-template-columns: auto minmax(0, 1fr); }
.layout-single .chat-replies { justify-content: space-between; padding-top: 6px; }
.layout-single .chat-error { margin-right: var(--support-space-4); margin-left: var(--support-space-4); }
.layout-single .chat-transcript { padding: var(--support-space-3) var(--support-space-4); }
.layout-single .chat-transcript-content { gap: var(--support-space-3); }
/* A phone: the tip's text beside the shield and the dismiss, Choose a name under the text. */
.layout-single .chat-persona-hint {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "avatar text close" ". action action";
  align-items: start; gap: var(--support-space-2);
}
.layout-single .chat-persona-hint-avatar { grid-area: avatar; }
.layout-single .chat-persona-hint > p { grid-area: text; align-self: center; }
.layout-single .chat-persona-hint-close { grid-area: close; margin: -4px -4px 0 0; }
.layout-single .chat-persona-hint-action { grid-area: action; justify-self: start; }
.layout-single .chat-composer, .layout-single .chat-blocked { padding-right: var(--support-space-4); padding-left: var(--support-space-4); }
.layout-single .chat-composer { gap: 6px; padding-top: var(--support-space-2); padding-bottom: var(--support-space-3); }
.layout-single .chat-picker { right: var(--support-space-4); left: var(--support-space-4); }
.layout-single .chat-message { max-width: 92%; min-width: 0; }
.layout-single .chat-compose-keys { display: none; }
.layout-single .chat-compose-row textarea { max-height: 96px; }
/* Under the phone's back bar */
.player-support.layout-single .support-chat { min-height: calc(var(--support-vh, 100vh) - 64px); }
</style>
