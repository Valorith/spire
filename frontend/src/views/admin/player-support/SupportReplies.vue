<template>
  <b-modal visible scrollable centered size="lg" modal-class="support-modal" title="Saved replies" @hide="$emit('close')">
    <div class="replies">
      <p class="replies-lead">
        Shared with everyone working petitions on this server. Short plain-text replies also show as Live chat quick replies.
        Use <code>{character}</code> for the player’s name.
      </p>
      <p v-if="error" class="replies-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ error }}</p>

      <ul v-if="replies.length" class="replies-list">
        <li v-for="reply in replies" :key="reply.id" :class="{ 'is-editing': editing === reply.id }">
          <div class="replies-row">
            <div class="replies-text">
              <strong>{{ reply.title }}</strong>
              <p>{{ reply.body }}</p>
              <small>
                <span v-if="fitsTell(reply.body)" class="replies-tag"><i class="fe fe-message-circle" aria-hidden="true"></i> Quick reply</span>
                <span class="replies-tag"><i class="fe fe-mail" aria-hidden="true"></i> Mail template</span>
                <span v-if="reply.updated_by">· {{ reply.updated_by }}</span>
              </small>
            </div>
            <div v-if="canWrite" class="replies-actions">
              <button type="button" class="replies-icon" :aria-label="'Edit ' + reply.title" :disabled="busy" @click="edit(reply)"><i class="fe fe-edit-2" aria-hidden="true"></i></button>
              <button type="button" class="replies-icon is-danger" :aria-label="'Delete ' + reply.title" :disabled="busy" @click="remove(reply)"><i class="fe fe-trash-2" aria-hidden="true"></i></button>
            </div>
          </div>
        </li>
      </ul>
      <p v-else class="replies-empty">No saved replies yet. The built-in quick replies and templates are used until you add some.</p>

      <form v-if="canWrite" class="replies-form" @submit.prevent="save">
        <h3>{{ editing ? 'Edit reply' : 'Add a reply' }}</h3>
        <label for="reply-title">Title</label>
        <input id="reply-title" ref="title" v-model="title" class="form-control" maxlength="80" placeholder="Item restored">
        <label for="reply-body">Reply <span>({{ body.length }}/2,000 · {{ fitsTell(body.trim()) ? 'fits in a tell' : 'mail only' }})</span></label>
        <textarea id="reply-body" v-model="body" class="form-control" rows="4" maxlength="2000"
                  placeholder="Hi {character}, we restored the item you reported."></textarea>
        <div class="replies-form-actions">
          <button v-if="editing" type="button" class="btn btn-outline-light btn-sm" :disabled="busy" @click="reset">Cancel</button>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="busy || !title.trim() || !body.trim()">
            {{ editing ? 'Save changes' : 'Add reply' }}
          </button>
        </div>
      </form>
    </div>
    <template #modal-footer>
      <button type="button" class="btn btn-outline-light btn-sm" @click="$emit('close')">Done</button>
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
    return { editing: 0, title: '', body: '', busy: false, error: '' }
  },
  methods: {
    fitsTell (text) { return fitsTell(text) },
    params () { return { params: { connection_id: this.connectionId } } },
    errorText (error) { return (error.response && error.response.data && error.response.data.error) || 'Request failed' },
    edit (reply) {
      this.editing = reply.id
      this.title = reply.title
      this.body = reply.body
      this.$nextTick(() => this.$refs.title && this.$refs.title.focus())
    },
    reset () {
      this.editing = 0
      this.title = ''
      this.body = ''
    },
    async save () {
      this.busy = true
      this.error = ''
      try {
        const payload = { title: this.title.trim(), body: this.body.trim() }
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
.replies-lead { margin: 0 0 12px; color: #a9b9ca; font-size: .82rem; }
.replies code { color: #f3dcae; background: #241f18; padding: 1px 5px; border-radius: 4px; }
.replies-error { display: flex; gap: 8px; align-items: center; color: #ffadbd; font-size: .82rem; }
.replies-empty { color: #8fa1b5; font-size: .8rem; }
.replies-list { display: grid; gap: 6px; margin: 0 0 14px; padding: 0; list-style: none; }
.replies-list li { padding: 9px 12px; border: 1px solid #2f3d4d; border-radius: 9px; background: #172230; }
.replies-list li.is-editing { border-color: #dfb976; }
.replies-row { display: flex; gap: 10px; align-items: flex-start; }
.replies-text { flex: 1; min-width: 0; }
.replies-text strong { color: #eef3f8; font-size: .84rem; font-weight: 650; }
.replies-text p { margin: 3px 0 5px; color: #c9d6e3; font-size: .78rem; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 4.6em; overflow: hidden; }
.replies-text small { display: flex; flex-wrap: wrap; gap: 6px; color: #8fa1b5; font-size: .7rem; }
.replies-tag { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; border-radius: 999px; background: #22303f; color: #b8c8d8; }
.replies-actions { display: flex; gap: 4px; }
.replies-icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 7px; border: 1px solid #34465a; background: #121b25; color: #b8c8d8; }
.replies-icon:hover:not(:disabled) { border-color: #dfb976; color: #f3dcae; }
.replies-icon.is-danger:hover:not(:disabled) { border-color: #c06a7b; color: #ffadbd; }
.replies-form { padding-top: 12px; border-top: 1px solid #2a3948; }
.replies-form h3 { margin: 0; color: #f0f4f8; font-size: .86rem; font-weight: 650; }
.replies-form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
</style>
