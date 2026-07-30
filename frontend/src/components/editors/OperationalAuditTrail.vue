<template>
  <section class="operational-history" :class="{ 'operational-history--open': open }">
    <button
      type="button"
      class="operational-history__toggle"
      :aria-expanded="String(open)"
      @click="toggle"
    >
      <span>
        <i class="fa fa-history"></i>
        <span>
          <strong>Recent audit history</strong>
          <small>{{ total ? total + ' recorded change' + (total === 1 ? '' : 's') : 'Operator, reason, and mutation context' }}</small>
        </span>
      </span>
      <i :class="open ? 'fa fa-angle-up' : 'fa fa-angle-down'"></i>
    </button>

    <div v-if="open" class="operational-history__body">
      <div class="operational-history__toolbar">
        <span>Newest first · scoped to this record</span>
        <button type="button" :disabled="loading" @click="$emit('refresh')">
          <i class="fa mr-1" :class="loading ? 'fa-spinner fa-spin' : 'fa-refresh'"></i>Refresh
        </button>
      </div>
      <div v-if="error" class="operational-inline-warning operational-inline-warning--danger" role="alert">
        <i class="fa fa-exclamation-triangle"></i><span>{{ error }}</span>
      </div>
      <div v-else-if="loading && !entries.length" class="operational-empty-inline">
        <i class="fa fa-spinner fa-spin"></i>Loading audit history…
      </div>
      <div v-else-if="!entries.length" class="operational-empty-inline">
        <i class="fa fa-history"></i>No recorded editor mutations for this record yet.
      </div>
      <ol v-else class="operational-history__list">
        <li v-for="entry in entries" :key="entry.id">
          <span class="operational-history__marker" :class="'operational-history__marker--' + action(entry)">
            <i :class="actionIcon(entry)"></i>
          </span>
          <div class="operational-history__entry">
            <div class="operational-history__heading">
              <strong>{{ actionLabel(entry) }}</strong>
              <time :datetime="entry.created_at">{{ formatDate(entry.created_at) }}</time>
            </div>
            <div class="operational-history__actor">
              {{ entry.user_name || ('User ' + entry.user_id) }} · audit #{{ entry.id }}
            </div>
            <p v-if="entry.data && entry.data.reason">{{ entry.data.reason }}</p>
            <dl v-if="details(entry).length">
              <template v-for="detail in details(entry)">
                <dt :key="detail.key + '-label'">{{ detail.label }}</dt>
                <dd :key="detail.key + '-value'">{{ detail.value }}</dd>
              </template>
            </dl>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script>
  const hiddenKeys = new Set([
    'action',
    'reason',
    'bucket_id',
    'channel_id',
    'reserved_id',
    'saylink_id',
    'password',
    'raw'
  ])

  export default {
    name: 'OperationalAuditTrail',
    props: {
      entries: { type: Array, default: () => [] },
      total: { type: Number, default: 0 },
      loading: { type: Boolean, default: false },
      error: { type: String, default: '' }
    },
    data () {
      return { open: false }
    },
    methods: {
      toggle () {
        this.open = !this.open
        if (this.open) this.$emit('open')
      },
      action (entry) {
        const explicit = entry && entry.data && entry.data.action
        if (explicit) return String(explicit).toLowerCase()
        const suffix = String(entry.event_name || '').split('_').pop()
        return suffix ? suffix.toLowerCase() : 'update'
      },
      actionLabel (entry) {
        const value = this.action(entry)
        return value.charAt(0).toUpperCase() + value.slice(1)
      },
      actionIcon (entry) {
        const value = this.action(entry)
        if (value === 'create') return 'fa fa-plus'
        if (value === 'delete') return 'fa fa-trash'
        return 'fa fa-pencil'
      },
      details (entry) {
        const data = entry && entry.data ? entry.data : {}
        return Object.keys(data)
          .filter(key => !hiddenKeys.has(key) && data[key] !== null && typeof data[key] !== 'undefined')
          .slice(0, 6)
          .map(key => ({ key, label: this.humanize(key), value: this.formatValue(data[key]) }))
      },
      humanize (value) {
        return String(value).replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
      },
      formatValue (value) {
        let formatted = typeof value === 'object' ? JSON.stringify(value) : String(value)
        if (formatted.length > 180) formatted = formatted.slice(0, 177) + '…'
        return formatted
      },
      formatDate (value) {
        if (!value) return 'Unknown time'
        return new Date(value).toLocaleString()
      }
    }
  }
</script>
