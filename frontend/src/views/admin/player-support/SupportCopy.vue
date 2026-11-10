<template>
  <button type="button" class="support-copy" :class="{ 'is-text': show }" :aria-label="'Copy ' + label + ' ' + value" :title="title" @click="copy">
    <template v-if="show">{{ show }} </template><i :class="state === 'done' ? 'fe fe-check' : 'fe fe-copy'" aria-hidden="true"></i>
    <!-- Only while there is something to say, so a page of copy buttons is not a page of live regions. -->
    <span v-if="state" class="sr-only" role="status">{{ state === 'done' ? 'Copied' : 'Copying is not available in this browser' }}</span>
  </button>
</template>

<script>
import { copyText } from './support-ui'

// A quiet copy button: icon only, or the value itself followed by the icon
// ("#42" with show="#42"). It says "Copied" for a moment, aloud as well.
export default {
  name: 'SupportCopy',
  props: {
    // What is copied.
    value: { type: [String, Number], required: true },
    // What it is, for the button's name and tooltip ("name", "corpse ID").
    label: { type: String, required: true },
    // Text shown before the icon; empty for an icon-only button.
    show: { type: String, default: '' }
  },
  data () {
    return { state: '', timer: null }
  },
  computed: {
    title () {
      if (this.state === 'done') return 'Copied'
      if (this.state === 'failed') return 'Copying is not available in this browser'
      return 'Copy ' + this.label
    }
  },
  beforeDestroy () { clearTimeout(this.timer) },
  methods: {
    copy () {
      copyText(String(this.value)).then(done => {
        this.state = done ? 'done' : 'failed'
        clearTimeout(this.timer)
        this.timer = setTimeout(() => { this.state = '' }, 1600)
      })
    }
  }
}
</script>
