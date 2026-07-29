<template>
  <div class="operational-scope-field">
    <div class="operational-scope-field__heading">
      <span><i :class="field.icon" class="mr-1"></i>{{ field.label }}</span>
      <span>
        <button v-if="field.lookup" type="button" @click="$emit('lookup')">Find</button>
        <button v-if="value" type="button" class="ml-2" @click="$emit('clear')">Clear</button>
      </span>
    </div>
    <input
      :id="idPrefix + '-' + field.key"
      :value="value"
      type="number"
      min="0"
      :max="field.max"
      class="form-control form-control-sm"
      @input="$emit('input', Number($event.target.value || 0))"
    >
    <small>{{ context || field.help }}</small>
  </div>
</template>

<script>
  export default {
    name: 'OperationalScopeField',
    props: {
      field: { type: Object, required: true },
      value: { type: Number, required: true },
      context: { type: String, default: '' },
      idPrefix: { type: String, default: 'operational-scope' }
    }
  }
</script>
