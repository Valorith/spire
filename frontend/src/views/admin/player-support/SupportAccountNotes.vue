<template>
  <b-modal visible centered scrollable modal-class="support-modal" :title="'Account notes · ' + record.account" @shown="focusField" @hidden="$emit('close')">
    <p class="support-modal-lead notes-lead">Shown on every case from this account. Staff only.</p>
    <p v-if="error" class="support-callout is-danger notes-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>

    <ul v-if="list.length" class="notes-list" aria-label="Account notes">
      <li v-for="note in list" :key="note.id" :class="{ 'is-confirming': confirming === note.id }">
        <div class="notes-row">
          <div class="notes-text">
            <p>{{ note.text }}</p>
            <small>{{ note.author || 'Staff' }} · <time :datetime="note.created_at">{{ formatDate(note.created_at) }}</time></small>
          </div>
          <button v-if="canWrite && confirming !== note.id" :ref="'delete-' + note.id" type="button" class="support-button is-ghost is-icon is-sm notes-delete"
                  aria-label="Delete note" title="Delete note" :disabled="busy" @click="askDelete(note)">
            <i class="fe fe-trash-2" aria-hidden="true"></i>
          </button>
        </div>
        <div v-if="confirming === note.id" class="notes-confirm" role="group" aria-label="Confirm deletion">
          <span>Delete this note? It is removed from every case.</span>
          <span class="notes-confirm-actions">
            <button type="button" class="support-button is-danger is-sm" :disabled="busy" @click="remove(note)">Yes, delete</button>
            <button ref="cancelDelete" type="button" class="support-button is-sm" :disabled="busy" @click="cancelDelete(note)">Cancel</button>
          </span>
        </div>
      </li>
    </ul>
    <p v-else class="support-empty is-compact notes-empty"><i class="fe fe-bookmark" aria-hidden="true"></i> No notes for this account yet.</p>

    <form v-if="canWrite" class="notes-form" @submit.prevent="add">
      <div class="notes-label-row">
        <label for="account-note-text">New note</label>
        <span class="notes-count" :class="{ 'is-near': text.length > 1900 }">{{ text.length.toLocaleString() }}/2,000</span>
      </div>
      <textarea id="account-note-text" ref="field" v-model="text" class="support-field" rows="3" maxlength="2000" :disabled="busy"
                placeholder="Something every Game Master should know about this account."
                @keydown.enter.ctrl.exact.prevent="add" @keydown.enter.meta.exact.prevent="add"></textarea>
      <div class="notes-actions">
        <button type="submit" class="support-button is-primary" :disabled="busy || !text.trim()">Add note</button>
      </div>
    </form>

    <template #modal-footer="{ cancel }">
      <button type="button" class="support-button" @click="cancel()">Done</button>
    </template>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'

export default {
  name: 'SupportAccountNotes',
  props: {
    record: { type: Object, required: true },
    connectionId: { type: Number, required: true },
    notes: { type: Array, default: () => [] },
    canWrite: { type: Boolean, default: false }
  },
  data () {
    return { list: this.notes.slice(), text: '', busy: false, error: '', confirming: 0 }
  },
  watch: {
    notes (value) { if (!this.busy) this.list = value.slice() }
  },
  methods: {
    endpoint () { return 'player-support/cases/' + encodeURIComponent(this.record.key) + '/account-notes' },
    params () { return { params: { connection_id: this.connectionId } } },
    errorText (error) { return (error.response && error.response.data && error.response.data.error) || 'The note could not be saved.' },
    formatDate (value) {
      const date = new Date(value)
      return isNaN(date) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
    },
    focusField () { if (this.$refs.field) this.$refs.field.focus() },
    askDelete (note) {
      this.confirming = note.id
      this.$nextTick(() => {
        const cancel = this.$refs.cancelDelete
        const button = Array.isArray(cancel) ? cancel[0] : cancel
        if (button) button.focus()
      })
    },
    cancelDelete (note) {
      this.confirming = 0
      this.$nextTick(() => {
        const refs = this.$refs['delete-' + note.id]
        const button = Array.isArray(refs) ? refs[0] : refs
        if (button) button.focus()
      })
    },
    async add () {
      const text = this.text.trim()
      if (!text || this.busy) return
      this.busy = true
      this.error = ''
      try {
        const { data } = await SpireApi.v1().post(this.endpoint(), { text }, this.params())
        this.list = (data && data.notes) || this.list
        this.text = ''
        this.$emit('changed', this.list)
      } catch (error) {
        this.error = this.errorText(error)
      } finally {
        this.busy = false
        this.$nextTick(this.focusField)
      }
    },
    async remove (note) {
      if (this.busy) return
      this.busy = true
      this.error = ''
      try {
        const { data } = await SpireApi.v1().delete(this.endpoint() + '/' + note.id, this.params())
        this.list = (data && data.notes) || this.list.filter(item => item.id !== note.id)
        this.confirming = 0
        this.$emit('changed', this.list)
      } catch (error) {
        this.error = this.errorText(error)
      } finally {
        this.busy = false
        if (!this.confirming) this.$nextTick(this.focusField)
      }
    }
  }
}
</script>

<style scoped>
/* Dialog chrome, buttons, fields, callouts and empty state come from support-theme.css. */
.notes-lead { margin-bottom: var(--support-space-4); color: var(--support-text-secondary); font-size: var(--support-text-sm); }
.notes-error { margin: 0 0 var(--support-space-3); }
.notes-list { display: grid; gap: var(--support-space-2); margin: 0 0 var(--support-space-4); padding: 0; list-style: none; }
.notes-list li { padding: 10px var(--support-space-3); border: 1px solid var(--support-border); border-radius: var(--support-radius); background: var(--support-pane); }
.notes-list li.is-confirming { border-color: var(--support-danger-line); }
.notes-row { display: flex; align-items: flex-start; gap: var(--support-space-3); }
.notes-text { flex: 1; min-width: 0; }
.notes-text p { margin: 0; color: var(--support-text); font-size: var(--support-text-md); line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.notes-text small { display: block; margin-top: var(--support-space-1); color: var(--support-muted); font-size: var(--support-text-xs); }
.notes-delete { margin: -4px -6px 0 0; }
.support-button.notes-delete:hover:not(:disabled) { background: var(--support-danger-soft); color: var(--support-danger); }
.notes-confirm {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--support-space-2) var(--support-space-3);
  margin-top: var(--support-space-2); padding-top: var(--support-space-2); border-top: 1px solid var(--support-border-subtle);
  color: var(--support-text-secondary); font-size: var(--support-text-sm);
}
.notes-confirm-actions { display: flex; gap: var(--support-space-2); }
.notes-empty { margin: 0 0 var(--support-space-4); }
.notes-form { padding-top: var(--support-space-4); border-top: 1px solid var(--support-border-subtle); }
.notes-label-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--support-space-2); margin-bottom: 6px; }
.notes-label-row label { margin: 0; }
.notes-count { color: var(--support-muted); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.notes-count.is-near { color: var(--support-warning); }
.notes-actions { display: flex; justify-content: flex-end; margin-top: var(--support-space-3); }
</style>
