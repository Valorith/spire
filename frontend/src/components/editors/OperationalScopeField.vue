<template>
  <div class="operational-scope-field">
    <div class="operational-scope-field__heading">
      <span><i :class="field.icon" class="mr-1"></i>{{ field.label }}</span>
      <span>
        <button v-if="field.lookup && (!allowAny || specificMode)" type="button" @click="$emit('lookup')">Find</button>
        <button v-if="!allowAny && (value || allowRemove)" type="button" class="ml-2" @click="$emit('clear')">
          {{ allowRemove ? 'Remove' : 'Clear' }}
        </button>
      </span>
    </div>
    <div v-if="allowAny" class="operational-scope-mode" :aria-label="field.label + ' match mode'">
      <button
        type="button"
        :class="{ active: !specificMode }"
        :aria-pressed="String(!specificMode)"
        @click="useAny"
      >
        Any
      </button>
      <button
        type="button"
        :class="{ active: specificMode }"
        :aria-pressed="String(specificMode)"
        @click="useSpecific"
      >
        Specific
      </button>
    </div>
    <input
      v-if="!allowAny || specificMode"
      ref="input"
      :id="idPrefix + '-' + field.key"
      :value="value"
      type="number"
      min="0"
      :max="field.max"
      class="form-control form-control-sm"
      @input="$emit('input', Number($event.target.value || 0))"
    >
    <small>{{ fieldHelp }}</small>
  </div>
</template>

<script>
  export default {
    name: 'OperationalScopeField',
    props: {
      field: { type: Object, required: true },
      value: { type: Number, required: true },
      context: { type: String, default: '' },
      idPrefix: { type: String, default: 'operational-scope' },
      allowAny: { type: Boolean, default: false },
      allowRemove: { type: Boolean, default: false }
    },
    data () {
      return {
        specificMode: Boolean(this.value)
      }
    },
    computed: {
      fieldHelp () {
        if (this.allowAny && !this.specificMode) return `Matches any ${this.field.label.toLowerCase()}.`
        if (this.allowAny && !this.value) return `Enter or find a specific ${this.field.label.toLowerCase()} ID.`
        return this.context || this.field.help
      }
    },
    watch: {
      value (next) {
        if (next) this.specificMode = true
      }
    },
    methods: {
      useAny () {
        this.specificMode = false
        this.$emit('clear')
      },
      useSpecific () {
        this.specificMode = true
        this.$nextTick(() => {
          if (this.$refs.input) this.$refs.input.focus()
        })
      }
    }
  }
</script>
