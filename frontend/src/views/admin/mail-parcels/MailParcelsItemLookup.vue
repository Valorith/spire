<template>
  <b-modal ref="modal" :modal-class="['mail-parcels-editor-modal item-lookup-modal', modalClass]" title="Choose item"
           hide-footer @shown="$refs.query.focus()" @hidden="resetSearch">
    <div class="spire-editor-search">
      <i class="fa fa-search" aria-hidden="true"></i>
      <input id="mail-parcels-item-lookup" ref="query" v-model="query" class="form-control form-control-sm"
             :aria-label="augment ? 'Search augments' : 'Search items'"
             :placeholder="augment ? 'Augment name or ID' : 'Item name or ID'" @input="queueSearch">
    </div>
    <div v-if="augment" class="item-lookup-clear">
      <button type="button" @click="choose(null)"><i class="fa fa-times mr-1"></i>Clear this augment slot</button>
    </div>
    <div v-if="searching" class="lookup-state" role="status">Searching items…</div>
    <div v-else-if="items.length" class="item-lookup-results">
      <button v-for="item in items" :key="item.id" type="button" @click="choose(item)">
        <span class="item-lookup-results__icon">
          <span v-if="item.icon" :class="'item-' + item.icon + '-sm'"></span>
          <i v-else class="ra ra-wooden-box"></i>
        </span>
        <span>
          <strong>{{ item.name }}</strong>
          <small>
            #{{ item.id }} · {{ item.augment_type ? 'Augment type ' + item.augment_type : (item.bag_slots ? item.bag_slots + '-slot container' : 'Item') }}
            · {{ item.no_drop === 0 ? 'No-drop' : 'Droppable' }}
          </small>
        </span>
        <i class="fa fa-chevron-right"></i>
      </button>
    </div>
    <div v-else-if="error" class="lookup-state" role="alert">{{ error }}</div>
    <div v-else-if="query.trim()" class="lookup-state">No matching items.</div>
  </b-modal>
</template>

<script>
import { SpireApi } from '@/app/api/spire-api'
import '@/assets/css/content-editor-workspace.css'
import './mail-parcels-controls.css'

export default {
  name: 'MailParcelsItemLookup',
  props: {
    // Extra classes for the modal, so a host page can theme the picker without
    // changing how it looks in the Mail & Parcels editor.
    modalClass: { type: String, default: '' }
  },
  data () {
    return { query: '', augment: false, socketType: 0, items: [], searching: false, error: '', timer: null, version: 0 }
  },
  beforeDestroy () { this.resetSearch() },
  methods: {
    open (augment = false, socketType = 0) {
      this.resetSearch()
      this.augment = augment
      this.socketType = socketType
      this.$refs.modal.show()
    },
    resetSearch () {
      clearTimeout(this.timer)
      this.version++
      this.query = ''
      this.items = []
      this.searching = false
      this.error = ''
    },
    queueSearch () {
      clearTimeout(this.timer)
      const version = ++this.version
      const q = this.query.trim()
      this.items = []
      this.error = ''
      this.searching = Boolean(q)
      if (!q) return
      this.timer = setTimeout(async () => {
        const params = { q }
        if (this.augment) params.scope = 'augment'
        if (this.socketType > 0) params.socket_type = this.socketType
        try {
          const { data } = await SpireApi.v1().get('mail-parcels-editor/items', { params })
          if (version === this.version) this.items = data.data || []
        } catch (error) {
          if (version === this.version) this.error = (error.response && error.response.data && error.response.data.error) || 'Item search failed.'
        } finally {
          if (version === this.version) this.searching = false
        }
      }, 250)
    },
    choose (item) {
      this.$emit('selected', item)
      this.$refs.modal.hide()
    }
  }
}
</script>
