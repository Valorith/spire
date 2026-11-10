// Shared behaviour of the Player Support tool dialogs.
//
// The page mounts each dialog with v-if and drops it as soon as it emits
// "close", so b-modal never reaches its own focus return. This mixin
// remembers the control that opened the dialog and focuses it again when the
// dialog goes away, unless focus has already moved into another dialog (a
// tool that hands over to the parcel composer, for example).
//
// focusInDialog(selector) focuses the first match inside this dialog once
// b-modal has rendered it, and only while focus is still on the dialog
// itself, so a GM who already moved on keeps their place. On a phone or a
// touch screen a text field is not focused on its own (the on-screen keyboard
// would cover the dialog); focus stays on the dialog, which b-modal focuses.

import { touchLayout } from './support-ui'

export const dialogFocus = {
  created () {
    const active = typeof document !== 'undefined' ? document.activeElement : null
    this.$_supportOpener = active && active !== document.body ? active : null
  },
  beforeDestroy () {
    const opener = this.$_supportOpener
    if (!opener) return
    setTimeout(() => {
      const active = document.activeElement
      if (active && active !== document.body && active.closest && active.closest('.modal')) return
      if (document.contains(opener) && !opener.disabled) opener.focus()
    }, 0)
  },
  methods: {
    dialogElement () {
      const modal = this.$refs.modal
      return modal && modal.$refs ? modal.$refs.content : null
    },
    focusInDialog (selector) {
      setTimeout(() => {
        const content = this.dialogElement()
        if (!content) return
        const active = document.activeElement
        const idle = !active || active === document.body || active === content || !content.contains(active)
        if (!idle) return
        const target = Array.from(content.querySelectorAll(selector)).find(element => !element.disabled && element.offsetParent !== null)
        if (target && !(touchLayout() && isTextEntry(target))) target.focus()
      }, 0)
    }
  }
}

function isTextEntry (element) {
  if (element.tagName === 'TEXTAREA') return true
  return element.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'range', 'color', 'file'].includes(element.type)
}
