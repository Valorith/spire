<template>
  <div
    v-if="connection && connection.database_connection && connection.database_connection.name"
    class="connection-status"
  >
    <div
      v-if="appVersion"
      class="spire-version-label"
      style="padding: 0 15px; color: rgba(255,255,255,.34); font-size: 9px; font-weight: 500; letter-spacing: .08em; line-height: 1.1; text-align: center; text-transform: uppercase;"
    >
      Spire v{{ appVersion }}
    </div>

    <div
      class="card mt-1"
      style="margin-bottom: 5px; background-color: rgba(0,0,0, .5); color: rgba(255,255,255,.7); border: 1px solid #000000;"
      @click="navigateConnections"
    >
      <div
        class="card-body connection-status-box"
        style="padding: 5px; padding-left: 15px; text-align: left;"
        v-b-tooltip.v-dark.hover
        :title="getConnectionDescription()"
      >
        <div
          class="avatar avatar-sm mr-3"
          style="height: 10px; width: 10px"
        >
          <img
            :style="'background-color: ' + getConnectionStatusColor() + '; margin-bottom: 5px; transition: background-color 300ms;'"
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            class="avatar-img rounded-circle"
          >
        </div>
        <i class="fe fe-database"></i> {{ connection.database_connection.name }}
      </div>
    </div>
  </div>
</template>

<script>
import {SpireApi} from "@/app/api/spire-api";
import {EventBus} from "@/app/event-bus/event-bus";
import {ROUTE}    from "@/routes";
import util       from "util";

export default {
  name: "DbConnectionStatusPill",
  props: {
    appVersion: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      connection: {},
      connectionStatus: "",
    }
  },
  mounted() {
    this.fetchConnection()
  },

  created() {
    EventBus.$on("DB_CONNECTION_CHANGE", this.fetchConnection);
  },
  destroyed() {
    EventBus.$off("DB_CONNECTION_CHANGE", this.fetchConnection);
  },

  methods: {
    getConnectionDescription() {
      return util.format(
        "Host: %s Status: %s",
        this.connection.database_connection.db_host,
        this.connectionStatus
      )
    },

    navigateConnections() {
      this.$router.push(
        {
          path: ROUTE.DATABASE_CONNECTIONS
        }
      ).catch(() => {
      })
    },

    getConnectionStatusColor() {
      if (this.connectionStatus.includes("connecting")) {
        return 'white';
      }
      if (!this.connectionStatus.includes("online")) {
        return 'red';
      }

      // connectionStatus
      return '#00d97e'
    },

    truncate(text, limit) {
      if (text.length > limit) {
        for (let i = limit; i > 0; i--) {
          if (text.charAt(i) === ' ' && (text.charAt(i - 1) !== ',' || text.charAt(i - 1) !== '.' || text.charAt(i - 1) !== ';')) {
            return text.substring(0, i) + '...';
          }
        }
        return text.substring(0, limit) + '...';
      } else
        return text;
    },

    fetchConnection() {
      // connection status
      SpireApi.v1().get('/connections').then((r) => {

        this.connection       = {}
        this.connectionStatus = "connecting"

        if (r.data && r.data.data) {
          r.data.data.forEach(connection => {
            const connectionId = connection.id

            if (connection.active) {
              this.connection = connection

              this.connection.database_connection.name = this.truncate(this.connection.database_connection.name, 19)

              SpireApi.v1().get(`/connection-check/${connectionId}`).then((cr) => {
                this.connectionStatus = cr.data.data.message
              })
            }
          })

          if (Object.keys(this.connection).length === 0) {
            // console.log("There is no non-default connection active")
            this.connection.database_connection      = {}
            this.connection.database_connection.name = "Local (Default)"
            this.connectionStatus                    = "online"
          }

        }
      })
    }
  }
}
</script>

<style scoped>

</style>
