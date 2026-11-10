<template>
  <li class="nav-item" v-show="navId !== '' && config && config.label">

    <!-- top level nav -->
    <router-link
      v-if="config.to"
      :to="config.to"
      :exact="config.exact ? config.exact : false"
      class="nav-link"
    >
      <i :class="config.labelIcon" v-if="config.labelIcon"></i> {{ config.label }}
      <!-- A count that needs attention, such as petitions pending GM action. -->
      <template v-if="config.badge > 0">
        <span class="nav-count-badge" aria-hidden="true">{{ config.badge > 99 ? '99+' : config.badge }}</span>
        <span class="sr-only">, {{ config.badgeLabel || config.badge }}</span>
      </template>
    </router-link>

    <!-- nested nav dropdown -->
    <a
      :class="'nav-link collapse ' + (hasRoute(config.routePrefixMatch) || hasRouteInArray(config.routePrefixMatches) ? 'active' : 'collapsed')"
      :href="'#sidebar-' + navId"
      data-toggle="collapse"
      role="button"
      :aria-expanded="(hasRoute(config.routePrefixMatch) || hasRouteInArray(config.routePrefixMatches) ? 'true' : 'false')"
      :aria-controls="'sidebar-' + navId"
      v-if="!config.to"
    >
      <i :class="config.labelIcon" v-if="config.labelIcon"></i>
      {{ config.label }}
    </a>
    <div
      :class="'collapse ' + (hasRoute(config.routePrefixMatch) || hasRouteInArray(config.routePrefixMatches) ? 'show' : '')"
      :id="'sidebar-' + navId"
      v-if="!config.to"
    >
      <ul class="nav nav-sm flex-column">
        <li v-for="nav in config.navs">

          <!-- internal link -->
          <router-link
            :class="'nav-link collapse ' + (isNavActive(nav) ? 'active' : 'collapsed')"
            :to="nav.to"
            v-if="!nav.to.includes('http')"
            :exact="nav.exact ? nav.exact : false"
          >
            <i :class="nav.icon" v-if="nav.icon"></i>{{ nav.title }}
            <b-badge class="ml-1" variant="primary" v-if="nav.isNew" style="font-size:.6em">NEW!</b-badge>
            <b-badge class="ml-1" variant="primary" v-if="nav.isAlpha" style="font-size:.6em">ALPHA</b-badge>

          </router-link>

          <!-- external link -->
          <a
            :class="'nav-link collapse ' + (isNavActive(nav) ? 'active' : 'collapsed')"
            :href="nav.to"
            :target="nav.to"
            v-if="nav.to.includes('http')"
          >
            <i :class="nav.icon" v-if="nav.icon"></i>{{ nav.title }}
            <b-badge class="ml-1" variant="primary" v-if="nav.isNew" style="font-size:.6em">NEW!</b-badge>
            <b-badge class="ml-1" variant="primary" v-if="nav.isAlpha" style="font-size:.6em">ALPHA</b-badge>
          </a>
        </li>
      </ul>
    </div>
  </li>
</template>

<script>
export default {
  name: "NavSectionComponent",
  methods: {
    isNavActive (nav) {
      if (!nav || !nav.to) return false
      if (nav.to.includes('http')) return this.hasRoute(nav.to) || this.hasRouteInArray(nav.routes)
      const target = this.$router.resolve(nav.to).route
      const queryKeys = Object.keys(target.query || {})
      if (queryKeys.length > 0) {
        return this.$route.path === target.path &&
          queryKeys.every(key => String(this.$route.query[key] || '') === String(target.query[key]))
      }
      return this.hasRoute(nav.to) || this.hasRouteInArray(nav.routes)
    },
    hasRouteInArray(matches) {
      let matched = false
      if (matches && matches.length > 0) {
        for (const m of matches) {
          if (this.$route.path.includes(m)) {
            matched = true
          }
        }
      }

      return matched
    },
    hasRoute: function (partial) {
      return (this.$route.path.indexOf(partial) > -1)
    } // config.topLevelIcon
  },
  data() {
    return {
      navId: ""
    }
  },
  props: {
    config: {
      type: Object
    }
  },
  created() {
    const uuidv4 = require("uuid/v4")
    this.navId   = uuidv4()
  }
}
</script>

<style scoped>
.nav-link {
  white-space: nowrap;
}
.nav-count-badge {
  display: inline-block;
  min-width: 1.5em;
  margin-left: .45rem;
  padding: 0 .4em;
  border-radius: 999px;
  background: #dfb976;
  color: #1f1910;
  font-size: .7rem;
  font-weight: 700;
  line-height: 1.5em;
  text-align: center;
  vertical-align: .1em;
  font-variant-numeric: tabular-nums;
}
</style>
