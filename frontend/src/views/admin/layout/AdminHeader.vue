<template>
  <eq-window-simple
    v-if="hasHeaderAccess"
    class="admin-header-window mb-4 pb-0"
    style="font-family: 'Cerebri Sans', sans-serif; color: white; padding: 10px; z-index: 1;"
    :title="stats.server_name"
    :bold-title="true"
  >

    <div class="admin-header">
      <div v-if="serverStats.length || canRead('eqemuserver/dashboard-stats')" class="admin-header-summary">
        <dl v-if="serverStats.length" class="admin-header-stats" aria-label="World status">
          <div v-for="metric in serverStats.filter((entry) => entry.value !== '')" :key="metric.label" class="admin-header-stat">
            <dt>{{ metric.label }}</dt>
            <dd>
              <server-process-button-component v-if="metric.label === 'World' && canManageProcesses()"
                                               :server-status="metric.value" class="d-inline-block" style="z-index: 1000" />
              <template v-else-if="metric.label === 'Locked'">
                <a v-if="canWrite('eqemuserver/toggle-server-lock')" href="javascript:void(0)" class="font-weight-bold"
                   :class="serverLocked ? 'text-danger' : 'text-success'" @click="toggleServerLock">
                  <i class="fa mr-1" :class="serverLocked ? 'fa-lock' : 'fa-unlock'" aria-hidden="true"></i>
                  {{ serverLocked ? 'Locked' : 'Unlocked' }}
                </a>
                <span v-else>{{ serverLocked ? 'Locked' : 'Unlocked' }}</span>
              </template>
              <span v-else :style="{ color: metric.color }">{{ metric.value ? metric.value.toLocaleString() : 0 }}</span>
            </dd>
          </div>
        </dl>
        <dl v-if="canRead('eqemuserver/dashboard-stats')" class="admin-header-stats" aria-label="Database totals">
          <div v-for="metric in dashStats" :key="metric.label" class="admin-header-stat">
            <dt>{{ metric.label }}</dt>
            <dd>{{ metric.value }}</dd>
          </div>
        </dl>
      </div>

      <div v-for="(host, hostIndex) in hostMetrics" :key="'host-metrics-' + hostIndex"
           class="admin-host-metrics" data-testid="admin-host-metrics">
        <div v-for="metric in host" :key="metric.label" class="admin-host-metric"
             :class="{ 'admin-host-metric--identity': typeof metric.percent === 'undefined' }" data-testid="admin-host-metric">
          <span class="admin-host-metric__label">{{ metric.label }}</span>
          <div v-if="typeof metric.percent !== 'undefined'" class="admin-host-metric__progress">
            <eq-progress-bar style="opacity: .95;" :percent="metric.percent" :show-percent="false" :color="metric.color" />
          </div>
          <span class="admin-host-metric__value"
                :class="{ 'admin-host-metric__value--host': typeof metric.percent === 'undefined' }"
                :title="typeof metric.percent === 'undefined' ? metric.value : null">{{ metric.value }}</span>
        </div>
      </div>
    </div>
  </eq-window-simple>
</template>

<script>
import {canReadAdminApi, canWriteAdminApi, canManageServerProcesses} from "@/app/user/server-admin-access";
import ServerProcessButtonComponent from "@/views/admin/components/ServerProcessButtonComponent.vue";
import {EventBus}                   from "@/app/event-bus/event-bus";
import {SpireApi}                   from "@/app/api/spire-api";
import {SpireWebsocket}             from "@/app/api/spire-websocket";
import EqProgressBar                from "@/components/eq-ui/EQProgressBar.vue";
import Time                         from "@/app/time/time";
import EqWindow                     from "@/components/eq-ui/EQWindow.vue";
import EqWindowSimple               from "@/components/eq-ui/EQWindowSimple.vue";
import {Notify}                     from "@/app/Notify";

export default {
  name: "AdminHeader",
  components: {
    EqWindowSimple,
    EqWindow,
    EqProgressBar,
    ServerProcessButtonComponent,
  },
  data() {
    return {
      pageName: "",

      dashstats: {},
      stats: {},

      updateIntervalSeconds: 1,

      sys: [],

      diskStats: {
        previousReadBytes: 0,
        previousWriteBytes: 0,
        readBytesPerSec: 0,
        writeBytesPerSec: 0,
      },

      serverLocked: false,

      stopMessage: "",
      shutdownTime: "",

      timer: null,
    }
  },

  computed: {
    hasHeaderAccess() {
      return ['eqemuserver/server-stats', 'eqemuserver/dashboard-stats',
        'eqemuserver/system-all', 'eqemuserver/get-lock-status'].some(this.canRead)
    },

    isWorldOnline() {
      if (!this.stats || !this.stats.main_process_stats) {
        return false
      }

      const world = this.stats.main_process_stats
        .find((e) => e.name === "world" || e.name === "world.exe")

      if (world && world.elapsed > 0) {
        return true
      }

      return false
    },

    serverStats() {
      return [
        {
          label: "World",
          value: this.stats && this.isWorldOnline ? "Online" : "Offline",
        },
        {
          label: "Zoneservers",
          value: this.stats ? this.stats.zone_count : 0,
        },
        {
          label: "Players Online",
          value: this.stats ? this.stats.players_online : 0,
        },
        {
          label: "Uptime",
          value: this.stats && this.stats.uptime ? this.formatUptime(this.stats.uptime) : "N/A",
        },
        {
          label: "Shutdown Timer",
          value: this.shutdownTime,
          color: 'red',
        },
        {
          label: "Locked",
          value: this.serverLocked ? "Yes" : "No",
        },
      ].filter(metric => this.canRead(metric.label === 'Locked'
        ? 'eqemuserver/get-lock-status' : 'eqemuserver/server-stats'))
    },

    dashStats() {
      return [
        {
          label: "Accounts",
          value: this.dashstats && this.dashstats.accounts ? this.dashstats.accounts.toLocaleString() : 0,
        },
        {
          label: "Characters",
          value: this.dashstats && this.dashstats.characters ? this.dashstats.characters.toLocaleString() : 0,
        },
        {
          label: "Guilds",
          value: this.dashstats && this.dashstats.guilds ? this.dashstats.guilds.toLocaleString() : 0,
        },
        {
          label: "Items",
          value: this.dashstats && this.dashstats.items ? this.dashstats.items.toLocaleString() : 0,
        },
        {
          label: "NPCs",
          value: this.dashstats && this.dashstats.npcs ? this.dashstats.npcs.toLocaleString() : 0,
        },
      ]
    },

    hostMetrics() {
      let metrics = []

      for (const e of this.sys) {
        let metric = [
          {
            label: "Host",
            value: e.hostname,
          },
          {
            label: "CPU",
            value: `${e.cpu || "N/A"} %`,
            percent: parseFloat(e.cpu || 0),
            color: this.getCpuLoadColor(e.cpu)
          },
          {
            label: "MEM",
            value: `${e.mem || "N/A"} %`,
            percent: parseFloat(e.mem || 0),
            color: "lightgreen"
          },
          {
            label: "DISK R",
            value: `${e.diskStats.readBytesPerSec.toFixed(2) > 1000 ? 0 : e.diskStats.readBytesPerSec.toFixed(2)} MB/s`,
            percent: Math.min(e.diskStats.readBytesPerSec / 100, 100),
            color: "deepskyblue"
          },
          {
            label: "DISK W",
            value: `${e.diskStats.writeBytesPerSec.toFixed(2) > 1000 ? 0 : e.diskStats.writeBytesPerSec.toFixed(2)} MB/s`,
            percent: Math.min(e.diskStats.writeBytesPerSec / 100, 100),
            color: "tomato"
          },
          {
            label: "NET DL",
            value: `${this.bytesToMbytes(e.net['all'].bytes_recv_ps) > 10000 ? 0 : this.bytesToMbytes(e.net['all'].bytes_recv_ps)} Mbps`,
            percent: Math.min(this.bytesToMbytes(e.net['all'].bytes_recv_ps) / 10, 100),
            color: "limegreen"
          },
          {
            label: "NET UL",
            value: `${this.bytesToMbytes(e.net['all'].bytes_sent_ps) > 10000 ? 0 : this.bytesToMbytes(e.net['all'].bytes_sent_ps)} Mbps`,
            percent: Math.min(this.bytesToMbytes(e.net['all'].bytes_sent_ps) / 10, 100),
            color: "limegreen"
          }
        ]

        metrics.push(metric)
      }

      // sort by hostname value
      metrics.sort((a, b) => {
        if (a[0].label === "Host" && a[0].value < b[0].value) {
          return -1
        }
        if (a[0].label === "Host" && a[0].value > b[0].value) {
          return 1
        }
        return 0
      })

      return metrics
    },

  },

  beforeDestroy() {
    clearInterval(this.timer)

    EventBus.$off("ROUTE_CHANGE", this.handleRouteChange);
    EventBus.$off('process-change', this.loadServerStats)

    SpireWebsocket.removeEventListener('message', this.handleWebsocketMessage);
  },
  created() {
    EventBus.$on("ROUTE_CHANGE", this.handleRouteChange);

    if (this.canRead('eqemuserver/server-stats')) {
      SpireWebsocket.addEventListener('message', this.handleWebsocketMessage);
    }

    this.loadServerStats()

    EventBus.$on('process-change', this.loadServerStats)

    this.getServerLockedStatus()

    if (this.canRead('eqemuserver/server-stats') || this.canRead('eqemuserver/system-all')) {
      this.timer = setInterval(() => {
        if (!document.hidden) this.loadServerStats()
      }, 1000)
    }

    // initial page name set
    if (this.$route.meta && this.$route.meta.title) {
      this.pageName = this.$route.meta.title
    }

    if (this.canRead('eqemuserver/dashboard-stats')) {
      SpireApi.v1().get("eqemuserver/dashboard-stats").then((r) => {
        if (r.status === 200) this.dashstats = r.data
      })
    }
  },
  methods: {
    canRead: canReadAdminApi,
    canWrite: canWriteAdminApi,
    canManageProcesses: canManageServerProcesses,

    formatUptime(t) {
      // reformat
      t = t.replace("Worldserver Uptime |", "")
      t = t.replace(new RegExp(',', 'g'), '');
      t = t.replace("and", "")
      t = t.replace(" Days", "d")
      t = t.replace(" Day", "d")
      t = t.replace(" Weeks", "w")
      t = t.replace(" Week", "w")
      t = t.replace(" Months", "m")
      t = t.replace(" Month", "m")
      t = t.replace(" Hours", "h")
      t = t.replace(" Hour", "h")
      t = t.replace(" Minutes", "m")
      t = t.replace(" Minute", "m")
      t = t.replace(" Seconds", "s")
      t = t.replace(" Second", "s")
      t = t.replace(/^\s+|\s+$/g, "")

      return t.trim();
    },

    getCpuLoadColor(load) {
      if (load > 80) {
        return 'red'
      }
      if (load > 50) {
        return 'orange'
      }

      return '#2c7be5'
    },

    getServerLockedStatus() {
      if (!this.canRead('eqemuserver/get-lock-status')) return
      SpireApi.v1().get("eqemuserver/get-lock-status").then((r) => {
        if (r.status === 200) {
          this.serverLocked = r.data.locked
        }
      })
    },

    toggleServerLock() {
      if (confirm("Are you sure you want to toggle the server lock?")) {
        SpireApi.v1().post("eqemuserver/toggle-server-lock").then((r) => {
          if (r.status === 200) {
            this.serverLocked = r.data.locked

            Notify.toast(r.data.message);
          }
        })
      }
    },

    async loadServerStats() {
      if (this.canRead('eqemuserver/server-stats')) {
        SpireApi.v1().get("eqemuserver/server-stats").then((r) => {
          if (r.status === 200) {
            this.stats = r.data
            this.$forceUpdate()
            EventBus.$emit("server-stats", r.data)
          }
        })
      }

      if (!this.canRead('eqemuserver/system-all')) return
      SpireApi.v1().get("eqemuserver/system-all").then((r) => {
        let lastSys = JSON.parse(JSON.stringify(this.sys))

        let systems = []
        if (r.status === 200) {
          for (const e of r.data) {
            let s = {
              cpu: 0,
              mem: 0,
              diskStats: {
                readBytes: 0,
                writeBytes: 0,
                previousReadBytes: null, // Initialize to null
                previousWriteBytes: null, // Initialize to null
                readBytesPerSec: 0,
                writeBytesPerSec: 0,
              },
              net: {
                all: {
                  bytes_recv: 0,
                  bytes_sent: 0,
                  bytes_recv_ps: 0,
                  bytes_sent_ps: 0
                }
              }
            };

            // Find last system stats
            // we need this for calculating per-second changes
            // in disk stats, network stats
            if (lastSys.length > 0) {
              const last = lastSys.find((x) => {
                return x.hostname === e.hostname
              })
              if (last) {
                s = JSON.parse(JSON.stringify(last))
              }
            }

            s.cpu      = Math.round(e.cpu)
            s.mem      = Math.round(e.mem_percent)
            s.hostname = e.hostname

            // Disk stats
            const disk = e && e.disk && e.disk.length > 0 ? e.disk[0] : null;
            if (disk) {
              const nowReadBytes  = disk.readBytes;
              const nowWriteBytes = disk.writeBytes;

              // If this is the first pass, initialize previous values
              if (s.diskStats.previousReadBytes === null || s.diskStats.previousWriteBytes === null) {
                s.diskStats.previousReadBytes  = nowReadBytes;
                s.diskStats.previousWriteBytes = nowWriteBytes;
                s.diskStats.readBytesPerSec    = 0;
                s.diskStats.writeBytesPerSec   = 0;
              } else {
                // Calculate per-second change
                s.diskStats.readBytesPerSec  = (nowReadBytes - s.diskStats.previousReadBytes) / 1024 / 1024;
                s.diskStats.writeBytesPerSec = (nowWriteBytes - s.diskStats.previousWriteBytes) / 1024 / 1024;

                // Update previous values
                s.diskStats.previousReadBytes  = nowReadBytes;
                s.diskStats.previousWriteBytes = nowWriteBytes;
              }
            }

            // network stats
            for (let n of e.net) {
              if (typeof s.net[n.name] === 'undefined') {
                s.net[n.name] = {
                  bytes_recv: 0,
                  bytes_sent: 0,
                  bytes_recv_ps: 0,
                  bytes_sent_ps: 0,
                };
              }

              if (s.net[n.name].bytes_recv === 0 && s.net[n.name].bytes_sent === 0) {
                // First iteration: initialize without calculation
                s.net[n.name].bytes_recv    = n.bytesRecv;
                s.net[n.name].bytes_sent    = n.bytesSent;
                s.net[n.name].bytes_recv_ps = 0;
                s.net[n.name].bytes_sent_ps = 0;
              } else {
                // Calculate per-second changes
                s.net[n.name].bytes_recv_ps = n.bytesRecv - s.net[n.name].bytes_recv;
                s.net[n.name].bytes_sent_ps = n.bytesSent - s.net[n.name].bytes_sent;

                // Update previous values
                s.net[n.name].bytes_recv = n.bytesRecv;
                s.net[n.name].bytes_sent = n.bytesSent;
              }
            }

            systems.push(s)
          }

          this.sys = systems
        }
      })
    },

    handleRouteChange(e) {
      if (e && e.meta && e.meta.title) {
        this.pageName = e.meta.title
      }
    },


    handleWebsocketMessage(e) {
      if (e && e.data) {
        const data = JSON.parse(e.data)
        if (data.type === "stopTimer") {
          const timerData = JSON.parse(data.message)
          const time      = timerData.time
          const type      = timerData.type
          const remaining = this.calcRemainingTime(time)

          if (remaining === "") {
            this.stopMessage = ""
            this.shutdownTime = ""
            return
          }
          this.stopMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} in ${remaining}`
          this.shutdownTime = remaining
        }
      }
    },
    calcRemainingTime(unixTimestamp) {
      return Time.calculateRemainingTimeServerReboot(unixTimestamp)
    },

    bytesToMbytes: function (bytes) {
      return parseFloat((bytes * 8) / 1024 / 1024).toFixed(2); // Convert to Mbps
    },
  },
}
</script>

<style scoped>
.admin-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px 28px;
}

.admin-header-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  min-width: 0;
}

.admin-header-stats {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 3px 9px;
  align-items: baseline;
  margin: 0;
  min-width: 0;
  font-size: 12px;
  line-height: 1.25;
}

.admin-header-stat {
  display: contents;
}

.admin-header-stats dt {
  text-align: right;
}

.admin-header-stats dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.admin-host-metrics {
  flex: 0 1 290px;
  min-width: min(100%, 230px);
  max-width: 100%;
}

.admin-host-metric {
  align-items: center;
  column-gap: 6px;
  display: grid;
  grid-template-columns: 42px minmax(62px, 1fr) minmax(56px, max-content);
  line-height: 1;
  min-height: 15px;
  min-width: 0;
}

.admin-host-metric__label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 10px;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}

.admin-host-metric__progress {
  min-width: 0;
  width: 100%;
}

.admin-host-metric__value {
  color: #8f99a3;
  font-size: 10px;
  font-weight: 700;
  min-width: 0;
  text-align: left;
  white-space: nowrap;
}

.admin-host-metric__value--host {
  color: #fff;
  grid-column: 2 / 4;
  overflow: hidden;
  text-overflow: ellipsis;
}

::v-deep .admin-host-metric__progress .eq-progress-bar {
  min-width: 0;
  width: 100%;
}

@media (max-width: 575.98px) {
  .admin-header {
    gap: 12px;
  }

  .admin-header-summary {
    gap: 10px 18px;
  }

  .admin-host-metrics {
    flex-basis: 100%;
  }
}
</style>
