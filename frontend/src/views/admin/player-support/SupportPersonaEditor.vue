<template>
  <!-- The name players see on this Game Master's tells. Mounted with v-if; "close" drops it. -->
  <b-modal ref="modal" visible centered scrollable modal-class="support-modal support-persona-modal" :hide-header-close="saving"
           :no-close-on-backdrop="saving" :no-close-on-esc="saving" @shown="focusInDialog('#support-persona-name')" @hidden="$emit('close')">
    <template #modal-title>Your name on tells</template>
    <p class="support-modal-lead">Players see this name on the tells you send from Spire. Mail still comes from <strong>GameMaster</strong>.</p>

    <!-- How the next tell reads in the player's chat window. -->
    <figure class="persona-preview">
      <figcaption class="support-section-label">In game</figcaption>
      <p class="persona-preview-line">
        <span class="persona-preview-name">(GM) {{ previewName }}</span> tells you, 'I am looking into your petition now.'
      </p>
    </figure>

    <div class="persona-field">
      <div class="persona-label-row">
        <label for="support-persona-name" class="support-label">Name</label>
        <span class="persona-count" :class="{ 'is-full': length >= max }" aria-hidden="true">{{ length }}/{{ max }}</span>
      </div>
      <div class="persona-input" :class="{ 'is-invalid': problem }">
        <span class="persona-input-prefix" aria-hidden="true">(GM)</span>
        <input id="support-persona-name" ref="input" v-model="draft" class="support-field" type="text" :maxlength="max" autocomplete="off" spellcheck="false"
               placeholder="Game Master" :disabled="saving" :aria-invalid="problem ? 'true' : null"
               :aria-describedby="'support-persona-rules' + (problem ? ' support-persona-problem' : '')"
               @input="error = ''; saved = false" @keydown.enter.prevent="save(draft)">
      </div>
      <p v-if="problem" id="support-persona-problem" class="support-feedback is-error" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i> {{ problem }}</p>
      <p id="support-persona-rules" class="persona-rules">3 to 24 letters and single spaces, starting with a letter. Leave it empty to use Game Master.</p>
    </div>

    <p v-if="saved && state.warning" class="support-callout is-warning persona-note" role="status">
      <i class="fe fe-alert-triangle" aria-hidden="true"></i><span>Saved. {{ state.warning }}</span>
    </p>
    <p v-if="error" class="support-callout is-danger persona-note" role="alert"><i class="fe fe-alert-circle" aria-hidden="true"></i><span>{{ error }}</span></p>

    <template #modal-footer="{ cancel }">
      <button type="button" class="support-button is-ghost persona-default" :disabled="saving || (!state.persona && !draft.trim())" @click="save('')">
        <i class="fe fe-rotate-ccw" aria-hidden="true"></i> Use default (Game Master)
      </button>
      <button type="button" class="support-button persona-cancel" :disabled="saving" @click="cancel()">{{ saved ? 'Close' : 'Cancel' }}</button>
      <button type="button" class="support-button is-primary persona-save" :disabled="saving || Boolean(problem) || (!changed && !saved)" @click="saved && !changed ? cancel() : save(draft)">
        <i v-if="saving" class="fe fe-loader support-spin" aria-hidden="true"></i>
        <i v-else-if="saved && !changed" class="fe fe-check" aria-hidden="true"></i>
        {{ saving ? 'Saving…' : saved && !changed ? 'Saved' : 'Save' }}
      </button>
    </template>
  </b-modal>
</template>

<script>
import { dialogFocus } from './support-dialog'
import { DEFAULT_PERSONA, PERSONA_MAX, personaProblem, personaState, savePersona } from './support-persona'

export default {
  name: 'SupportPersonaEditor',
  mixins: [dialogFocus],
  props: {
    connectionId: { type: Number, required: true }
  },
  data () {
    return {
      state: personaState,
      draft: personaState.persona,
      max: PERSONA_MAX,
      saving: false,
      saved: false,
      error: ''
    }
  },
  computed: {
    length () { return this.draft.trim().length },
    problem () { return personaProblem(this.draft) },
    // An empty field and the default name both mean the default.
    normalized () {
      const name = this.draft.trim()
      return name === DEFAULT_PERSONA ? '' : name
    },
    changed () { return this.normalized !== this.state.persona },
    previewName () { return this.normalized && !this.problem ? this.normalized : DEFAULT_PERSONA }
  },
  methods: {
    async save (value) {
      const name = (value || '').trim() === DEFAULT_PERSONA ? '' : (value || '').trim()
      if (this.saving || personaProblem(name)) return
      if (name === this.state.persona && value !== '') {
        this.$refs.modal.hide()
        return
      }
      this.saving = true
      this.error = ''
      try {
        await savePersona(this.connectionId, name)
        this.draft = this.state.persona
        this.saved = true
        this.$emit('saved', this.state.persona)
        // A warning stays on screen to be read; otherwise the dialog closes and the chip shows the name.
        if (!this.state.warning) this.$refs.modal.hide()
      } catch (error) {
        this.error = (error.response && error.response.data && error.response.data.error) || 'The name could not be saved. Try again.'
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style>
/* The footer is b-modal's own element. The reset sits apart, on the left, from
   Cancel and Save; on a phone it takes its own line above them. */
.support-modal.support-persona-modal .modal-footer > .persona-default { margin-right: auto; }
@media (max-width: 480px) {
  .support-modal.support-persona-modal .modal-footer { flex-wrap: wrap; }
  .support-modal.support-persona-modal .modal-footer > .persona-default { flex: 1 0 100%; margin-right: 0; }
  .support-modal.support-persona-modal .modal-footer > .persona-cancel,
  .support-modal.support-persona-modal .modal-footer > .persona-save { flex: 1 1 0; }
}
</style>

<style scoped>
.persona-preview {
  margin: 0 0 var(--support-space-4); padding: var(--support-space-3) var(--support-space-4);
  border: 1px solid var(--support-border-subtle); border-left: 3px solid var(--support-accent-line); border-radius: 0 var(--support-radius-lg) var(--support-radius-lg) 0;
  background: var(--support-sunken);
}
.persona-preview figcaption { margin: 0 0 6px; }
.persona-preview-line { margin: 0; color: var(--support-text-secondary); font-size: var(--support-text-md); line-height: 1.5; overflow-wrap: anywhere; }
.persona-preview-name { color: var(--support-accent-text); font-weight: 600; }
.persona-label-row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--support-space-2); }
.persona-label-row .support-label { margin-bottom: 6px; }
.persona-count { color: var(--support-faint); font-size: var(--support-text-xs); font-variant-numeric: tabular-nums; }
.persona-count.is-full { color: var(--support-warning); }
/* "(GM)" sits in the field: World adds it, so it is shown but never typed. */
.persona-input { position: relative; }
.persona-input-prefix {
  position: absolute; top: 50%; left: 12px; transform: translateY(-50%);
  color: var(--support-accent-text); font-size: var(--support-text-md); font-weight: 600; pointer-events: none;
}
.persona-input .support-field { width: 100%; padding-left: 52px; }
.persona-input.is-invalid .support-field { border-color: var(--support-danger-line); }
.persona-rules { margin: 6px 0 0; color: var(--support-muted); font-size: var(--support-text-xs); line-height: 1.5; }
.persona-field .support-feedback { margin-top: 6px; font-size: var(--support-text-xs); }
.persona-note { margin: var(--support-space-3) 0 0; }
</style>
