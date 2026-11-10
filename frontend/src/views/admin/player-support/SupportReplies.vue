<template>
  <b-modal ref="modal" visible scrollable centered size="lg" modal-class="support-modal" title="Saved replies" @shown="focusStart" @hidden="$emit('close')">
    <div class="replies">
      <p class="replies-lead">
        Shared with everyone working petitions on this server. Replies that fit in a tell (200 plain characters) are also Live chat quick replies;
        every reply is a Reply by mail template. Use <code>{character}</code> for the player’s name.
      </p>
      <p v-if="error" class="support-callout is-danger replies-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> <span>{{ error }}</span></p>
      <p v-if="message" class="support-feedback is-success replies-message" role="status"><i class="fe fe-check" aria-hidden="true"></i> {{ message }}</p>

      <div v-if="replies.length > 3" class="support-search replies-search">
        <i class="fe fe-search" aria-hidden="true"></i>
        <input ref="search" v-model="query" type="search" aria-label="Search saved replies" autocomplete="off" spellcheck="false" placeholder="Search by title or text"
               @keydown.esc="clearSearch">
        <span v-if="query" class="replies-search-count">{{ shown.length }} of {{ replies.length }}</span>
      </div>

      <ul v-if="shown.length" class="replies-list" aria-label="Saved replies">
        <li v-for="reply in shown" :key="reply.id" :class="{ 'is-editing': editing === reply.id, 'is-confirming': confirming === reply.id }">
          <div class="replies-row">
            <div class="replies-text">
              <strong>{{ reply.title }}</strong>
              <p>{{ reply.body }}</p>
              <small>
                <span v-if="fitsTell(reply.body)" class="support-chip"><i class="fe fe-message-circle" aria-hidden="true"></i> Quick reply</span>
                <span v-else class="support-chip" title="Longer than a tell, or has characters a tell cannot carry"><i class="fe fe-mail" aria-hidden="true"></i> Mail only</span>
                <span v-if="reply.resolves" class="support-chip is-accent"><i class="fe fe-check-circle" aria-hidden="true"></i> Reply and resolve</span>
                <span v-if="reply.updated_by">· {{ reply.updated_by }}</span>
              </small>
            </div>
            <div v-if="canWrite && confirming !== reply.id" class="replies-actions">
              <button :ref="'edit-' + reply.id" type="button" class="support-button is-ghost is-icon is-sm" :aria-label="'Edit ' + reply.title" title="Edit" :disabled="busy" @click="edit(reply)"><i class="fe fe-edit-2" aria-hidden="true"></i></button>
              <button :ref="'delete-' + reply.id" type="button" class="support-button is-ghost is-icon is-sm replies-delete" :aria-label="'Delete ' + reply.title" title="Delete" :disabled="busy" @click="askDelete(reply)"><i class="fe fe-trash-2" aria-hidden="true"></i></button>
            </div>
          </div>
          <div v-if="confirming === reply.id" class="replies-confirm" role="group" aria-label="Confirm deletion">
            <span>Delete “{{ reply.title }}” for everyone?</span>
            <span class="replies-confirm-actions">
              <button type="button" class="support-button is-danger is-sm" :disabled="busy" @click="remove(reply)">Yes, delete</button>
              <button ref="cancelDelete" type="button" class="support-button is-sm" :disabled="busy" @click="cancelDelete(reply)">Cancel</button>
            </span>
          </div>
        </li>
      </ul>
      <p v-else-if="replies.length" class="support-empty is-compact replies-empty"><i class="fe fe-search" aria-hidden="true"></i> No saved reply matches “{{ query.trim() }}”.</p>
      <p v-else class="support-empty is-compact replies-empty"><i class="fe fe-bookmark" aria-hidden="true"></i> No saved replies yet. The built-in quick replies and templates are used until you add some.</p>

      <form v-if="canWrite" ref="form" class="replies-form" @submit.prevent="save" @keydown.enter.ctrl.exact.prevent="save" @keydown.enter.meta.exact.prevent="save">
        <h3 class="support-section-label">{{ editing ? 'Edit reply' : 'Add a reply' }}</h3>
        <label for="reply-title">Title</label>
        <input id="reply-title" ref="title" v-model="title" class="form-control" maxlength="80" placeholder="Item restored">
        <label for="reply-body">Reply <span>({{ body.length.toLocaleString() }}/2,000 · {{ fitsTell(body.trim()) ? 'fits in a tell' : 'mail only' }})</span></label>
        <textarea id="reply-body" v-model="body" class="form-control" rows="4" maxlength="2000"
                  placeholder="Hi {character}, we restored the item you reported."></textarea>
        <div class="support-settings replies-resolves">
          <label for="reply-resolves" class="support-setting">
            <span class="support-setting-text"><strong id="reply-resolves-title">Reply and resolve</strong><small id="reply-resolves-hint">Offer in the Resolve dialog.</small></span>
            <input id="reply-resolves" v-model="resolves" type="checkbox" class="support-switch" aria-labelledby="reply-resolves-title" aria-describedby="reply-resolves-hint">
          </label>
        </div>
        <div class="replies-form-actions">
          <span class="replies-keys"><kbd class="support-kbd">Ctrl</kbd>+<kbd class="support-kbd">Enter</kbd> to save</span>
          <button v-if="editing" type="button" class="support-button" :disabled="busy" @click="reset(true)">Cancel</button>
          <button type="submit" class="support-button is-primary" :disabled="busy || !title.trim() || !body.trim()">
            {{ editing ? 'Save changes' : 'Add reply' }}
          </button>
        </div>
      </form>
    </div>
    <template #modal-footer>
      <button type="button" class="support-button" @click="$refs.modal.hide()">Done</button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { fitsTell, focusLater, touchLayout } from './support-ui'

export default {
  name: 'SupportReplies',
  props: {
    connectionId: { type: Number, required: true },
    canWrite: { type: Boolean, default: false },
    replies: { type: Array, required: true }
  },
  data () {
    return { editing: 0, title: '', body: '', resolves: false, busy: false, error: '', message: '', query: '', confirming: 0 }
  },
  computed: {
    shown () {
      const words = this.query.toLowerCase().split(/\s+/).filter(Boolean)
      return this.replies.filter(reply => {
        const haystack = (reply.title + ' ' + reply.body).toLowerCase()
        return words.every(word => haystack.includes(word))
      })
    }
  },
  methods: {
    fitsTell (text) { return fitsTell(text) },
    params () { return { params: { connection_id: this.connectionId } } },
    errorText (error) { return (error.response && error.response.data && error.response.data.error) || 'The reply could not be saved. Try again.' },
    focusStart () {
      const field = this.$refs.search || this.$refs.title
      if (field && !touchLayout()) field.focus()
    },
    // Esc clears the search first; with nothing to clear it closes the dialog as usual.
    clearSearch (event) {
      if (!this.query) return
      event.preventDefault()
      event.stopPropagation()
      this.query = ''
    },
    edit (reply) {
      this.editing = reply.id
      this.confirming = 0
      this.message = ''
      this.title = reply.title
      this.body = reply.body
      this.resolves = Boolean(reply.resolves)
      this.$nextTick(() => { if (this.$refs.form) this.$refs.form.scrollIntoView({ block: 'nearest' }) })
      focusLater(() => this.$refs.title)
    },
    reset (refocus = false) {
      const id = this.editing
      this.editing = 0
      this.title = ''
      this.body = ''
      this.resolves = false
      // Back to the reply that was being edited.
      if (refocus && id) focusLater(() => this.$refs['edit-' + id])
    },
    askDelete (reply) {
      this.confirming = reply.id
      this.message = ''
      focusLater(() => this.$refs.cancelDelete)
    },
    cancelDelete (reply) {
      this.confirming = 0
      focusLater(() => this.$refs['delete-' + reply.id])
    },
    async save () {
      if (this.busy || !this.title.trim() || !this.body.trim()) return
      this.busy = true
      this.error = ''
      this.message = ''
      try {
        const payload = { title: this.title.trim(), body: this.body.trim(), resolves: this.resolves }
        if (this.editing) {
          await SpireApi.v1().put(`player-support/replies/${this.editing}`, payload, this.params())
        } else {
          await SpireApi.v1().post('player-support/replies', payload, this.params())
        }
        this.message = this.editing ? `Saved “${payload.title}”.` : `Added “${payload.title}”. Everyone on this server can use it now.`
        this.reset()
        this.$emit('changed')
        focusLater(() => this.$refs.title)
      } catch (error) {
        this.error = this.errorText(error)
      } finally {
        this.busy = false
      }
    },
    async remove (reply) {
      this.busy = true
      this.error = ''
      try {
        await SpireApi.v1().delete(`player-support/replies/${reply.id}`, this.params())
        if (this.editing === reply.id) this.reset()
        this.confirming = 0
        this.message = `Deleted “${reply.title}”.`
        this.$emit('changed')
        focusLater(() => this.$refs.search || this.$refs.title)
      } catch (error) {
        this.error = this.errorText(error)
      } finally {
        this.busy = false
      }
    }
  }
}
</script>

<style scoped>
/* Dialog chrome, fields, buttons, chips, callouts and empty state come from support-theme.css. */
.replies-lead { margin: 0 0 var(--support-space-4); color: var(--support-text-secondary); font-size: var(--support-text-sm); line-height: 1.55; }
.replies-error { margin: 0 0 var(--support-space-3); }
.replies-message { margin: 0 0 var(--support-space-3); }
.replies-search { margin-bottom: var(--support-space-3); }
.replies-search-count { flex: none; color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.replies-empty { margin: 0 0 var(--support-space-4); }
.replies-list { display: grid; gap: var(--support-space-2); margin: 0 0 var(--support-space-4); padding: 0; list-style: none; }
.replies-list li {
  padding: 10px var(--support-space-3); border: 1px solid var(--support-border); border-radius: var(--support-radius);
  background: var(--support-pane); transition: var(--support-transition);
}
.replies-list li.is-editing { border-color: var(--support-accent-line); background: var(--support-selected); box-shadow: inset 2px 0 0 var(--support-accent); }
.replies-list li.is-confirming { border-color: var(--support-danger-line); }
.replies-row { display: flex; align-items: flex-start; gap: var(--support-space-3); }
.replies-text { flex: 1; min-width: 0; }
.replies-text strong { color: var(--support-text); font-size: var(--support-text-sm); font-weight: 600; }
.replies-text p {
  max-height: 4.65em; margin: 2px 0 var(--support-space-2); overflow: hidden;
  color: var(--support-text-secondary); font-size: var(--support-text-sm); line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere;
}
.replies-text small { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; color: var(--support-muted); font-size: var(--support-text-xs); }
.replies-actions { display: flex; gap: 2px; margin: -2px -6px 0 0; }
.support-button.replies-delete:hover:not(:disabled) { background: var(--support-danger-soft); color: var(--support-danger); }
.replies-confirm {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--support-space-2) var(--support-space-3);
  margin-top: var(--support-space-2); padding-top: var(--support-space-2); border-top: 1px solid var(--support-border-subtle);
  color: var(--support-text-secondary); font-size: var(--support-text-sm);
}
.replies-confirm-actions { display: flex; gap: var(--support-space-2); }
.replies-form { padding-top: var(--support-space-4); border-top: 1px solid var(--support-border-subtle); }
.replies-form .support-section-label { margin: 0; }
.replies-resolves { margin-top: var(--support-space-3); }
.replies-form-actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--support-space-2); margin-top: var(--support-space-3); }
.replies-keys { display: inline-flex; align-items: center; gap: 3px; margin-right: auto; color: var(--support-faint); font-size: var(--support-text-xs); }
</style>
