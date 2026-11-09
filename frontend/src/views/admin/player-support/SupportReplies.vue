<template>
  <b-modal visible scrollable centered size="lg" modal-class="support-modal" title="Saved replies" @hide="$emit('close')">
    <div class="replies">
      <p class="replies-lead">
        Shared with everyone working petitions on this server. Short plain-text replies also show as Live chat quick replies.
        Use <code>{character}</code> for the player’s name.
      </p>
      <p v-if="error" class="support-callout is-danger replies-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> <span>{{ error }}</span></p>

      <ul v-if="replies.length" class="replies-list">
        <li v-for="reply in replies" :key="reply.id" :class="{ 'is-editing': editing === reply.id }">
          <div class="replies-row">
            <div class="replies-text">
              <strong>{{ reply.title }}</strong>
              <p>{{ reply.body }}</p>
              <small>
                <span v-if="fitsTell(reply.body)" class="support-chip"><i class="fe fe-message-circle" aria-hidden="true"></i> Quick reply</span>
                <span class="support-chip"><i class="fe fe-mail" aria-hidden="true"></i> Mail template</span>
                <span v-if="reply.resolves" class="support-chip is-accent"><i class="fe fe-check-circle" aria-hidden="true"></i> Reply and resolve</span>
                <span v-if="reply.updated_by">· {{ reply.updated_by }}</span>
              </small>
            </div>
            <div v-if="canWrite" class="replies-actions">
              <button type="button" class="support-button is-ghost is-icon is-sm" :aria-label="'Edit ' + reply.title" :disabled="busy" @click="edit(reply)"><i class="fe fe-edit-2" aria-hidden="true"></i></button>
              <button type="button" class="support-button is-ghost is-icon is-sm replies-delete" :aria-label="'Delete ' + reply.title" :disabled="busy" @click="remove(reply)"><i class="fe fe-trash-2" aria-hidden="true"></i></button>
            </div>
          </div>
        </li>
      </ul>
      <p v-else class="support-empty is-compact replies-empty"><i class="fe fe-bookmark" aria-hidden="true"></i> No saved replies yet. The built-in quick replies and templates are used until you add some.</p>

      <form v-if="canWrite" class="replies-form" @submit.prevent="save">
        <h3 class="support-section-label">{{ editing ? 'Edit reply' : 'Add a reply' }}</h3>
        <label for="reply-title">Title</label>
        <input id="reply-title" ref="title" v-model="title" class="form-control" maxlength="80" placeholder="Item restored">
        <label for="reply-body">Reply <span>({{ body.length }}/2,000 · {{ fitsTell(body.trim()) ? 'fits in a tell' : 'mail only' }})</span></label>
        <textarea id="reply-body" v-model="body" class="form-control" rows="4" maxlength="2000"
                  placeholder="Hi {character}, we restored the item you reported."></textarea>
        <div class="support-settings replies-resolves">
          <label for="reply-resolves" class="support-setting">
            <span class="support-setting-text"><strong id="reply-resolves-title">Reply and resolve</strong><small id="reply-resolves-hint">Offer in the Resolve dialog.</small></span>
            <input id="reply-resolves" v-model="resolves" type="checkbox" class="support-switch" aria-labelledby="reply-resolves-title" aria-describedby="reply-resolves-hint">
          </label>
        </div>
        <div class="replies-form-actions">
          <button v-if="editing" type="button" class="support-button" :disabled="busy" @click="reset">Cancel</button>
          <button type="submit" class="support-button is-primary" :disabled="busy || !title.trim() || !body.trim()">
            {{ editing ? 'Save changes' : 'Add reply' }}
          </button>
        </div>
      </form>
    </div>
    <template #modal-footer>
      <button type="button" class="support-button" @click="$emit('close')">Done</button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import { fitsTell } from './support-ui'

export default {
  name: 'SupportReplies',
  props: {
    connectionId: { type: Number, required: true },
    canWrite: { type: Boolean, default: false },
    replies: { type: Array, required: true }
  },
  data () {
    return { editing: 0, title: '', body: '', resolves: false, busy: false, error: '' }
  },
  methods: {
    fitsTell (text) { return fitsTell(text) },
    params () { return { params: { connection_id: this.connectionId } } },
    errorText (error) { return (error.response && error.response.data && error.response.data.error) || 'Request failed' },
    edit (reply) {
      this.editing = reply.id
      this.title = reply.title
      this.body = reply.body
      this.resolves = Boolean(reply.resolves)
      this.$nextTick(() => this.$refs.title && this.$refs.title.focus())
    },
    reset () {
      this.editing = 0
      this.title = ''
      this.body = ''
      this.resolves = false
    },
    async save () {
      this.busy = true
      this.error = ''
      try {
        const payload = { title: this.title.trim(), body: this.body.trim(), resolves: this.resolves }
        if (this.editing) {
          await SpireApi.v1().put(`player-support/replies/${this.editing}`, payload, this.params())
        } else {
          await SpireApi.v1().post('player-support/replies', payload, this.params())
        }
        this.reset()
        this.$emit('changed')
      } catch (error) {
        this.error = this.errorText(error)
      } finally {
        this.busy = false
      }
    },
    async remove (reply) {
      if (!window.confirm(`Delete the saved reply “${reply.title}” for everyone?`)) return
      this.busy = true
      this.error = ''
      try {
        await SpireApi.v1().delete(`player-support/replies/${reply.id}`, this.params())
        if (this.editing === reply.id) this.reset()
        this.$emit('changed')
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
.replies-empty { margin: 0 0 var(--support-space-4); }
.replies-list { display: grid; gap: var(--support-space-2); margin: 0 0 var(--support-space-4); padding: 0; list-style: none; }
.replies-list li {
  padding: 10px var(--support-space-3); border: 1px solid var(--support-border); border-radius: var(--support-radius);
  background: var(--support-pane); transition: var(--support-transition);
}
.replies-list li.is-editing { border-color: var(--support-accent-line); background: var(--support-selected); box-shadow: inset 2px 0 0 var(--support-accent); }
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
.replies-form { padding-top: var(--support-space-4); border-top: 1px solid var(--support-border-subtle); }
.replies-form .support-section-label { margin: 0; }
.replies-resolves { margin-top: var(--support-space-3); }
.replies-form-actions { display: flex; justify-content: flex-end; gap: var(--support-space-2); margin-top: var(--support-space-3); }
</style>
