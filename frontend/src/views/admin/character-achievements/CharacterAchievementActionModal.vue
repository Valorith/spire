<template>
  <b-modal
    :visible="value"
    modal-class="character-achievement-action-modal"
    dialog-class="character-achievement-action-dialog"
    :title="action.title || 'Confirm achievement operation'"
    :hide-header-close="busy"
    :no-close-on-backdrop="busy"
    :no-close-on-esc="busy"
    data-testid="character-achievement-action-modal"
    @hidden="onHidden"
  >
    <div class="ca-action-intro" :class="{ 'ca-action-intro--danger': action.danger }">
      <span class="ca-action-intro__icon" aria-hidden="true">
        <i :class="action.icon || 'fa fa-shield'"></i>
      </span>
      <div>
        <h3>{{ action.heading || action.title }}</h3>
        <p>{{ action.message }}</p>
      </div>
    </div>

    <div v-if="action.blockedReason" class="ca-action-blocked" role="alert">
      <i class="fa fa-lock" aria-hidden="true"></i>
      <div>
        <strong>This operation is unavailable.</strong>
        <span>{{ action.blockedReason }}</span>
      </div>
    </div>

    <div class="ca-action-comparison" aria-label="Before and after summary">
      <section>
        <span>Before</span>
        <strong>{{ action.before || 'Current durable state' }}</strong>
      </section>
      <i class="fa fa-long-arrow-right" aria-hidden="true"></i>
      <section>
        <span>After</span>
        <strong>{{ afterSummary }}</strong>
      </section>
    </div>

    <div v-if="expectedRows.length" class="ca-action-expectations">
      <h4>Concurrency guard</h4>
      <p>
        These values must still match when the request reaches the database. A mismatch stops the operation instead of
        overwriting newer game-server activity.
      </p>
      <dl>
        <template v-for="row in expectedRows">
          <dt :key="row.label + '-label'">{{ row.label }}</dt>
          <dd :key="row.label + '-value'">{{ display(row.value) }}</dd>
        </template>
      </dl>
    </div>

    <div v-if="action.showProgress" class="form-group ca-action-field">
      <label for="character-achievement-action-progress">
        Exact progress value
        <span class="ca-help-mark" title="The editor writes this exact component count. It does not simulate an in-game event.">?</span>
      </label>
      <input
        id="character-achievement-action-progress"
        v-model.number="progressValue"
        class="form-control form-control-sm"
        type="number"
        :min="numberOr(action.progressMin, 0)"
        :max="numberOr(action.progressMax, 4294967295)"
        step="1"
        data-testid="character-achievement-action-progress"
      >
      <small>
        Allowed range: {{ numberOr(action.progressMin, 0) }} to
        {{ numberOr(action.progressMax, 4294967295) }}. Completion is a separate operation.
      </small>
    </div>

    <div v-if="action.showClearHistory" class="ca-action-choice">
      <label for="character-achievement-clear-reward-history">
        <input
          id="character-achievement-clear-reward-history"
          v-model="clearRewardHistory"
          type="checkbox"
          data-testid="character-achievement-clear-reward-history"
        >
        <span>
          <strong>Also clear reward and selection ledgers</strong>
          <small>
            Leave this off for a normal reset. Turning it on allows rewards to be delivered again after recompletion.
          </small>
        </span>
      </label>
    </div>

    <div v-if="riskRequired" class="ca-action-risk" role="group" aria-labelledby="character-achievement-risk-heading">
      <h4 id="character-achievement-risk-heading">
        <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
        Duplicate-delivery risk
      </h4>
      <p>{{ action.riskMessage || defaultRiskMessage }}</p>
      <label for="character-achievement-risk-acknowledgement">
        <input
          id="character-achievement-risk-acknowledgement"
          v-model="riskAcknowledged"
          type="checkbox"
          data-testid="character-achievement-risk-acknowledgement"
        >
        I reviewed the durable ledger and accept the duplicate-delivery risk for this operation.
      </label>
    </div>

    <div
      v-if="staleLeaseRequired"
      class="ca-action-risk ca-action-lease"
      role="group"
      aria-labelledby="character-achievement-stale-lease-heading"
    >
      <h4 id="character-achievement-stale-lease-heading">
        <i class="fa fa-clock-o" aria-hidden="true"></i>
        Expired processing lease recovery
      </h4>
      <p>{{ action.staleLeaseMessage }}</p>
      <label for="character-achievement-stale-lease-acknowledgement">
        <input
          id="character-achievement-stale-lease-acknowledgement"
          v-model="staleLeaseAcknowledged"
          type="checkbox"
          data-testid="character-achievement-stale-lease-acknowledgement"
        >
        I verified the status-2 lease is expired and accept responsibility for recovering this abandoned processing row.
      </label>
    </div>

    <div class="form-group ca-action-field">
      <label for="character-achievement-action-reason">
        Required audit reason
        <span class="ca-help-mark" title="Recorded with the operator, operation, character, and before/after values.">?</span>
      </label>
      <textarea
        id="character-achievement-action-reason"
        v-model.trim="reason"
        class="form-control form-control-sm"
        rows="3"
        minlength="8"
        maxlength="240"
        placeholder="Explain why this repair is necessary (8-240 characters)."
        data-testid="character-achievement-action-reason"
      ></textarea>
      <small :class="{ 'text-danger': reason.length > 0 && !reasonValid }">
        {{ reason.length }}/240 characters; at least 8 are required.
      </small>
    </div>

    <div class="ca-action-confirm-grid">
      <div class="form-group ca-action-field">
        <label for="character-achievement-character-confirmation">Type the exact character name</label>
        <input
          id="character-achievement-character-confirmation"
          v-model="characterConfirmation"
          class="form-control form-control-sm"
          type="text"
          autocomplete="off"
          :placeholder="characterName"
          data-testid="character-achievement-character-confirmation"
        >
        <small>Expected: <code>{{ characterName }}</code></small>
      </div>
      <div class="form-group ca-action-field">
        <label for="character-achievement-operation-confirmation">Type the operation phrase</label>
        <input
          id="character-achievement-operation-confirmation"
          v-model="operationConfirmation"
          class="form-control form-control-sm"
          type="text"
          autocomplete="off"
          :placeholder="expectedPhrase"
          data-testid="character-achievement-operation-confirmation"
        >
        <small>Expected: <code>{{ expectedPhrase }}</code></small>
      </div>
    </div>

    <template #modal-footer>
      <b-button size="sm" variant="outline-secondary" :disabled="busy" @click="close">
        Cancel
      </b-button>
      <b-button
        size="sm"
        :variant="action.danger ? 'outline-danger' : 'outline-warning'"
        :disabled="!canSubmit || busy || Boolean(action.blockedReason)"
        data-testid="character-achievement-action-submit"
        @click="submit"
      >
        <i :class="busy ? 'fa fa-spinner fa-spin' : (action.icon || 'fa fa-check')" class="mr-1"></i>
        {{ busy ? 'Applying safely…' : (action.submitLabel || 'Confirm operation') }}
      </b-button>
    </template>
  </b-modal>
</template>

<script>
  export default {
    name: 'CharacterAchievementActionModal',
    props: {
      value: { type: Boolean, default: false },
      action: { type: Object, default: () => ({}) },
      characterName: { type: String, default: '' },
      busy: { type: Boolean, default: false }
    },
    data () {
      return {
        reason: '',
        characterConfirmation: '',
        operationConfirmation: '',
        progressValue: 0,
        clearRewardHistory: false,
        riskAcknowledged: false,
        staleLeaseAcknowledged: false
      }
    },
    computed: {
      expectedPhrase () {
        if (this.action.showClearHistory && this.clearRewardHistory && this.action.confirmationPhraseWithHistory) {
          return String(this.action.confirmationPhraseWithHistory)
        }
        return String(this.action.confirmationPhrase || 'CONFIRM ACHIEVEMENT CHANGE')
      },
      expectedRows () {
        return Array.isArray(this.action.expectedRows) ? this.action.expectedRows : []
      },
      reasonValid () {
        const length = String(this.reason || '').trim().length
        return length >= 8 && length <= 240
      },
      progressValid () {
        if (!this.action.showProgress) return true
        const value = Number(this.progressValue)
        return Number.isInteger(value) &&
          value >= this.numberOr(this.action.progressMin, 0) &&
          value <= this.numberOr(this.action.progressMax, 4294967295)
      },
      riskRequired () {
        return Boolean(this.action.requiresRisk || (this.action.showClearHistory && this.clearRewardHistory))
      },
      staleLeaseRequired () {
        return Boolean(this.action.showStaleLeaseAcknowledgement)
      },
      afterSummary () {
        if (this.action.showProgress) return `Exact progress becomes ${this.display(this.progressValue)}`
        if (this.action.showClearHistory && this.clearRewardHistory) {
          return this.action.afterWithHistory || 'Completion, progress, reward, and selection rows removed'
        }
        return this.action.after || 'Requested durable state change'
      },
      defaultRiskMessage () {
        return 'The game server cannot prove whether every prior external delivery completed. Retrying or deleting its ledger can grant an item, currency, title, experience, or AA reward twice.'
      },
      canSubmit () {
        return this.reasonValid &&
          this.progressValid &&
          this.characterConfirmation === this.characterName &&
          this.operationConfirmation === this.expectedPhrase &&
          (!this.riskRequired || this.riskAcknowledged) &&
          (!this.staleLeaseRequired || this.staleLeaseAcknowledged)
      }
    },
    watch: {
      value (open) {
        if (open) this.resetForm()
      }
    },
    methods: {
      resetForm () {
        this.reason = ''
        this.characterConfirmation = ''
        this.operationConfirmation = ''
        this.progressValue = this.numberOr(this.action.progressValue, 0)
        this.clearRewardHistory = false
        this.riskAcknowledged = false
        this.staleLeaseAcknowledged = false
      },
      numberOr (value, fallback) {
        const number = Number(value)
        return Number.isFinite(number) ? number : fallback
      },
      display (value) {
        if (value === null || typeof value === 'undefined' || value === '') return '—'
        return String(value)
      },
      close () {
        if (!this.busy) this.$emit('input', false)
      },
      onHidden () {
        this.$emit('input', false)
      },
      submit () {
        if (!this.canSubmit || this.busy || this.action.blockedReason) return
        this.$emit('submit', {
          reason: String(this.reason).trim(),
          character_confirmation: this.characterConfirmation,
          confirmation: this.expectedPhrase,
          current_count: Number(this.progressValue),
          clear_reward_history: Boolean(this.clearRewardHistory),
          acknowledge_duplicate_risk: Boolean(this.riskAcknowledged),
          acknowledge_regrant_risk: Boolean(this.riskAcknowledged),
          acknowledge_stale_processing_lease: Boolean(this.staleLeaseAcknowledged)
        })
      }
    }
  }
</script>

<style scoped>
.ca-action-intro {
  align-items: flex-start;
  background: rgba(45, 108, 125, 0.14);
  border: 1px solid rgba(91, 185, 197, 0.28);
  display: flex;
  gap: 12px;
  padding: 12px;
}

.ca-action-intro--danger {
  background: rgba(139, 53, 53, 0.14);
  border-color: rgba(217, 98, 98, 0.32);
}

.ca-action-intro__icon {
  align-items: center;
  border: 1px solid rgba(224, 197, 102, 0.35);
  color: #e0c566;
  display: flex;
  flex: 0 0 38px;
  height: 38px;
  justify-content: center;
}

.ca-action-intro h3,
.ca-action-intro p {
  margin: 0;
}

.ca-action-intro h3 {
  color: #e8edf1;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 17px;
}

.ca-action-intro p {
  color: #a8b2ba;
  font-size: 11px;
  line-height: 1.55;
  margin-top: 4px;
}

.ca-action-blocked,
.ca-action-risk {
  background: rgba(139, 53, 53, 0.17);
  border: 1px solid rgba(217, 98, 98, 0.34);
  color: #e6b4b4;
  margin-top: 12px;
  padding: 10px 12px;
}

.ca-action-blocked {
  align-items: flex-start;
  display: flex;
  gap: 9px;
}

.ca-action-blocked strong,
.ca-action-blocked span {
  display: block;
}

.ca-action-blocked span,
.ca-action-risk p,
.ca-action-risk label {
  font-size: 10px;
  line-height: 1.5;
}

.ca-action-comparison {
  align-items: stretch;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) 18px minmax(0, 1fr);
  margin-top: 12px;
}

.ca-action-comparison section {
  background: rgba(0, 0, 0, 0.23);
  border: 1px solid rgba(178, 191, 204, 0.15);
  padding: 9px 10px;
}

.ca-action-comparison span,
.ca-action-comparison strong {
  display: block;
}

.ca-action-comparison span,
.ca-action-expectations h4,
.ca-action-risk h4 {
  color: #7e8992;
  font-size: 9px;
  letter-spacing: 0.06em;
  margin: 0;
  text-transform: uppercase;
}

.ca-action-lease {
  background: rgba(128, 91, 31, 0.18);
  border-color: rgba(224, 197, 102, 0.38);
  color: #e4cf91;
}

.ca-action-risk.ca-action-lease h4 {
  color: #e0c566;
}

.ca-action-risk.ca-action-lease label {
  color: #e4cf91;
}

.ca-action-comparison strong {
  color: #d9e0e5;
  font-size: 11px;
  font-weight: 600;
  margin-top: 3px;
}

.ca-action-comparison > i {
  align-self: center;
  color: #e0c566;
  justify-self: center;
}

.ca-action-expectations {
  border-left: 2px solid rgba(224, 197, 102, 0.55);
  margin-top: 12px;
  padding: 4px 0 4px 10px;
}

.ca-action-expectations p {
  color: #89959e;
  font-size: 9px;
  margin: 3px 0 7px;
}

.ca-action-expectations dl {
  display: grid;
  font-size: 9px;
  gap: 3px 10px;
  grid-template-columns: minmax(110px, auto) minmax(0, 1fr);
  margin: 0;
}

.ca-action-expectations dt {
  color: #78858e;
  font-weight: normal;
}

.ca-action-expectations dd {
  color: #d8c578;
  font-family: Consolas, monospace;
  margin: 0;
}

.ca-action-field {
  margin: 12px 0 0;
}

.ca-action-field label {
  color: #c9d0d6;
  font-size: 10px;
  font-weight: 600;
  margin-bottom: 4px;
}

.ca-action-field small {
  color: #78858e;
  display: block;
  font-size: 9px;
  margin-top: 3px;
}

.ca-action-field code {
  color: #e0c566;
}

.ca-help-mark {
  border: 1px solid rgba(123, 180, 194, 0.45);
  border-radius: 50%;
  color: #7bb4c2;
  cursor: help;
  display: inline-flex;
  font-size: 8px;
  height: 13px;
  justify-content: center;
  line-height: 11px;
  margin-left: 3px;
  width: 13px;
}

.ca-action-choice {
  margin-top: 12px;
}

.ca-action-choice label {
  align-items: flex-start;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(178, 191, 204, 0.16);
  cursor: pointer;
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 10px;
}

.ca-action-choice input {
  margin-top: 2px;
}

.ca-action-choice strong,
.ca-action-choice small {
  display: block;
}

.ca-action-choice strong {
  color: #dce3e8;
  font-size: 10px;
}

.ca-action-choice small {
  color: #82909a;
  font-size: 9px;
  margin-top: 2px;
}

.ca-action-risk h4 {
  color: #e69b6c;
  margin-bottom: 4px;
}

.ca-action-risk p {
  margin: 0 0 7px;
}

.ca-action-risk label {
  align-items: flex-start;
  color: #e7c3ac;
  cursor: pointer;
  display: flex;
  gap: 7px;
  margin: 0;
}

.ca-action-risk input {
  margin-top: 2px;
}

.ca-action-confirm-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 700px) {
  .ca-action-confirm-grid,
  .ca-action-comparison {
    grid-template-columns: minmax(0, 1fr);
  }

  .ca-action-comparison > i {
    transform: rotate(90deg);
  }
}
</style>
