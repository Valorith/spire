<template>
  <!-- A player's mail to the Game Master, read in full. b-modal traps focus, closes on Esc
       and returns focus to the button that opened it. -->
  <b-modal :visible="Boolean(message)" modal-class="support-modal support-mail-view" size="lg" centered scrollable
           :title="title" @hidden="onHidden">
    <template v-if="message">
      <dl class="support-dl mail-view-meta">
        <template v-if="sent">
          <dt>From</dt><dd>Game Master <span class="mail-view-staff">· {{ message.actor }}</span></dd>
          <dt>To</dt>
          <dd>
            {{ to }}
            <span v-if="altCharacter(to)" class="support-chip is-tag" :title="'Not the character that filed the petition (' + character + ')'">alt</span>
          </dd>
          <dt>Sent by mail</dt>
        </template>
        <template v-else>
          <dt>From</dt>
          <dd>
            {{ from }}
            <span v-if="altCharacter(from)" class="support-chip is-tag" :title="'Not the character that filed the petition (' + character + ')'">alt</span>
          </dd>
          <dt>Received</dt>
        </template>
        <dd><time :datetime="message.created_at">{{ received }}</time></dd>
      </dl>
      <p v-if="message.text" class="mail-view-body">{{ message.text }}</p>
      <p v-else class="mail-view-body is-missing">The text of this mail is no longer in the player’s mailbox. Its subject and time are kept on the case.</p>
    </template>
    <template #modal-footer="{ hide }">
      <button v-if="canReply" type="button" class="support-button" @click="reply(hide)">
        <i class="fe fe-mail" aria-hidden="true"></i> Reply by mail
      </button>
      <button type="button" class="support-button is-primary" @click="hide()">Close</button>
    </template>
  </b-modal>
</template>

<script>
export default {
  name: 'SupportMailView',
  props: {
    // The mail: { subject, text, actor, created_at }, or null when closed.
    message: { type: Object, default: null },
    // The character that filed the petition, to mark mail from an alt.
    character: { type: String, default: '' },
    canReply: { type: Boolean, default: false }
  },
  data () {
    return { replying: false }
  },
  computed: {
    // A Game Master's Reply by mail, rather than a player's mail.
    sent () { return Boolean(this.message) && this.message.kind === 'chat_out' },
    from () { return (this.message && this.message.actor) || this.character },
    to () { return (this.message && this.message.recipient) || this.character },
    title () {
      if (!this.message) return ''
      return (this.message.subject || '').trim() || (this.sent ? 'Mail to ' + this.to : 'Mail from ' + this.from)
    },
    received () {
      if (!this.message || !this.message.created_at) return ''
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(this.message.created_at))
    }
  },
  methods: {
    altCharacter (name) {
      return Boolean(name && this.character) && name.toLowerCase() !== this.character.toLowerCase()
    },
    // The reply dialog opens once this one has closed and given focus back.
    reply (hide) {
      this.replying = true
      hide()
    },
    onHidden () {
      const reply = this.replying
      this.replying = false
      this.$emit('close')
      if (reply) this.$emit('reply')
    }
  }
}
</script>

<style scoped>
/* Layout only. Colours, type, radius and spacing come from support-theme.css. */
.mail-view-meta { margin: 0; }
.mail-view-staff { color: var(--support-muted); }
.mail-view-body.is-missing { color: var(--support-muted); font-style: italic; }
.mail-view-body {
  margin: var(--support-space-3) 0 0; padding: var(--support-space-3) var(--support-space-4);
  border: 1px solid var(--support-border-subtle); border-left: 3px solid var(--support-accent-line); border-radius: 0 var(--support-radius) var(--support-radius) 0;
  background: var(--support-pane); color: var(--support-text); font-size: var(--support-text-md); line-height: 1.6;
  white-space: pre-wrap; overflow-wrap: anywhere;
}
</style>
