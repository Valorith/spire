<template>
  <EqModal
    title="Spire Updates"
    @close="$emit('close')"
    size="xl"
  >
    <template #body>
      <div v-if="!reloading">
        <section class="update-channel-panel" data-testid="spire-update-channel-panel">
          <div class="d-flex flex-wrap align-items-start justify-content-between">
            <div class="pr-3">
              <div class="update-kicker">Update channel</div>
              <h4 class="mb-1">{{ channelLabel }} channel</h4>
              <p class="mb-0 text-muted">
                Stable ignores GitHub prereleases. Beta considers compatible Beta and Stable releases.
              </p>
            </div>
            <div
              class="update-channel-selector"
              role="group"
              aria-label="Spire update channel"
              data-testid="update-channel-selector"
            >
              <button
                type="button"
                class="eq-button-fancy"
                :class="{ active: updateChannel === 'stable' }"
                :aria-pressed="updateChannel === 'stable' ? 'true' : 'false'"
                :disabled="!canManageChannel || savingChannel"
                data-testid="update-channel-stable"
                @click="$emit('channel-change', 'stable')"
              >
                Stable
              </button>
              <button
                type="button"
                class="eq-button-fancy"
                :class="{ active: updateChannel === 'beta' }"
                :aria-pressed="updateChannel === 'beta' ? 'true' : 'false'"
                :disabled="!canManageChannel || savingChannel"
                data-testid="update-channel-beta"
                @click="$emit('channel-change', 'beta')"
              >
                Beta
              </button>
            </div>
          </div>

          <div v-if="updateChannel === 'beta'" class="beta-channel-warning mt-3" role="alert">
            <i class="fe fe-alert-triangle mr-2"></i>
            Beta builds may be unstable. Use this channel only when you are prepared to test prerelease software.
          </div>
          <div v-else class="stable-channel-note mt-3">
            <i class="fe fe-shield mr-2"></i>
            Stable is the default and will never offer a GitHub prerelease.
          </div>
          <p v-if="!canManageChannel" class="small text-muted mt-2 mb-0">
            Update channels can only be changed from a local Spire installation.
          </p>
        </section>

        <div class="update-summary-grid mt-3">
          <div>
            <span class="update-kicker">Installed</span>
            <strong>Spire v{{ currentVersion }}</strong>
            <span
              class="release-type-chip ml-2"
              :class="installedReleaseType.toLowerCase()"
              data-testid="installed-release-type"
            >{{ installedReleaseType }}</span>
          </div>
          <div>
            <span class="update-kicker">Checking</span>
            <strong>{{ channelLabel }} releases</strong>
          </div>
        </div>

        <div v-if="checking || savingChannel" class="update-state mt-3" data-testid="update-checking">
          <i class="fe fe-loader mr-2"></i>
          {{ savingChannel ? "Saving update channel…" : "Checking GitHub releases…" }}
        </div>

        <div
          v-else-if="hasRelease"
          class="available-release mt-3"
          data-testid="available-update"
        >
          <div class="d-flex flex-wrap align-items-center justify-content-between">
            <div>
              <span class="update-kicker">Available update</span>
              <h3 class="mb-0">
                Spire {{ release.tag_name }}
                <span
                  class="release-type-chip"
                  :class="releaseType.toLowerCase()"
                  data-testid="offered-release-type"
                >{{ releaseType }}</span>
              </h3>
            </div>
            <a
              v-if="release.html_url"
              :href="release.html_url"
              target="_blank"
              rel="noopener noreferrer"
              class="eq-button-fancy"
            >View on GitHub</a>
          </div>

          <div class="mt-2">
            <span class="font-weight-bold">Compatible asset</span>
            <span class="ml-1">{{ release.asset_name }}</span>
          </div>
          <div>
            <span class="font-weight-bold">Update source</span>
            <a
              :href="updateRepositoryUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ml-1"
            >github.com/{{ updateRepository }}</a>
          </div>

          <div v-if="releaseNotes" class="mt-3">
            <div class="font-weight-bold">Release notes</div>
            <div class="row" id="changelog">
              <div class="col-12">
                <div v-html="releaseNotes" class="mt-2 changelog markdown-body"></div>
              </div>
            </div>
          </div>

          <div class="mt-3">
            <h4>Updating Spire</h4>
            <p class="mb-0">
              Spire exits after the update. Process managers and akk-stack restart it automatically;
              otherwise restart Spire manually.
            </p>
          </div>
        </div>

        <div
          v-else-if="!statusError"
          class="update-state up-to-date mt-3"
          data-testid="update-up-to-date"
        >
          <i class="fe fe-check-circle mr-2"></i>
          Spire is up to date on the {{ channelLabel }} channel.
        </div>

        <div class="mt-3" v-if="updating">
          <div class="text-center">
            <h4 class="text-muted">Updating Spire</h4>
          </div>
          <loader-fake-progress/>
        </div>
      </div>

      <div v-else>
        Spire has been updated. Waiting for restart to reload the page.<br><br>
        If Spire is not managed by a process manager or akk-stack, restart it manually.
      </div>

      <info-error-banner
        :slim="true"
        :notification="notification"
        :error="error || statusError"
        @dismiss-error="error = ''"
        @dismiss-notification="notification = ''"
        class="mt-3"
      />
    </template>

    <template #footer>
      <div class="mt-3 d-flex flex-wrap align-items-center">
        <button
          @click="$emit('close')"
          class="btn btn-sm mr-3 btn-default"
          v-if="!reloading"
          data-testid="close-spire-update"
        >
          <i class="fe fe-x"></i> Close
        </button>

        <button
          @click="$emit('ignore')"
          class="btn btn-sm mr-3 btn-default"
          v-if="!reloading && hasRelease"
        >
          <i class="fe fe-eye-off"></i> Skip this version
        </button>

        <button
          @click="$emit('retry')"
          class="btn btn-sm mr-3 btn-primary"
          v-if="!reloading && statusError"
        >
          <i class="fe fe-refresh-cw"></i> Retry
        </button>

        <button
          @click="updateSpire"
          class="btn btn-sm mr-3"
          :class="releaseType === 'Beta' ? 'btn-warning' : 'btn-success'"
          :disabled="updating || checking || savingChannel"
          v-if="!reloading && hasRelease"
          data-testid="install-spire-update"
        >
          <i class="fe fe-download"></i>
          Install {{ releaseType }} update
        </button>
      </div>
    </template>
  </EqModal>
</template>

<script>
import {LocalSettings} from "@/app/local-settings/localsettings";
import {AppEnv} from "@/app/env/app-env";
import {SpireApi} from "@/app/api/spire-api";
import InfoErrorBanner from "@/components/InfoErrorBanner.vue";
import LoaderFakeProgress from "@/components/LoaderFakeProgress.vue";
import EqModal from "@/components/eq-ui/EQModal.vue";

export default {
  name: "AppUpdateModal",
  components: {
    EqModal,
    LoaderFakeProgress,
    InfoErrorBanner
  },
  props: {
    release: {
      type: Object,
      required: true
    },
    status: {
      type: Object,
      required: true
    },
    currentVersion: {
      type: String,
      required: true
    },
    updateChannel: {
      type: String,
      default: "stable"
    },
    installedReleaseType: {
      type: String,
      default: "Stable"
    },
    checking: {
      type: Boolean,
      default: false
    },
    statusError: {
      type: String,
      default: ""
    },
    canManageChannel: {
      type: Boolean,
      default: false
    },
    savingChannel: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      releaseNotes: "",
      updating: false,
      reloading: false,
      notification: "",
      error: ""
    };
  },
  computed: {
    hasRelease() {
      return this.status?.available === true && !!this.release?.tag_name;
    },
    releaseType() {
      return this.release?.prerelease === true ? "Beta" : "Stable";
    },
    channelLabel() {
      return this.updateChannel === "beta" ? "Beta" : "Stable";
    },
    updateRepository() {
      return this.status?.repository || AppEnv.getReleaseRepository() || "Valorith/spire";
    },
    updateRepositoryUrl() {
      return `https://github.com/${this.updateRepository}`;
    }
  },
  watch: {
    release: {
      immediate: true,
      handler() {
        const body = this.release?.body || "";
        const md = require("markdown-it")({
          html: true,
          breaks: true,
          linkify: true
        });
        this.releaseNotes = body ? `<div>${md.render(body)}</div>` : "";
      }
    }
  },
  methods: {
    async updateSpire() {
      this.updating = true;
      this.error = "";

      try {
        const response = await SpireApi.v1().post("app/update");
        if (response.status === 200 && response.data?.data?.updated === true) {
          LocalSettings.clearUpdateVariables();
          this.updating = false;
          this.reloading = true;

          setInterval(async () => {
            const r = await SpireApi.v1().get("app/env");
            if (r.status === 200) {
              location.reload();
            }
          }, 1000);
          return;
        }

        this.error = "That release is no longer eligible for the selected channel. Check again before updating.";
        this.$emit("retry");
      } catch (e) {
        this.error = e.response?.data?.error || "Spire could not install the selected update.";
      } finally {
        if (!this.reloading) {
          this.updating = false;
        }
      }
    }
  }
};
</script>

<style scoped>
.update-channel-panel,
.available-release,
.update-state {
  background: rgba(7, 10, 13, .72);
  border: 1px solid rgba(189, 173, 116, .42);
  border-radius: 4px;
  padding: 16px;
}

.update-channel-selector {
  display: inline-flex;
  gap: 8px;
}

.update-channel-selector .eq-button-fancy.active {
  box-shadow: 0 0 0 1px #e8c56d, 0 0 12px rgba(232, 197, 109, .22);
  color: #fff2bd;
}

.update-kicker {
  color: #a69b78;
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.update-summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.update-summary-grid > div {
  background: rgba(0, 0, 0, .28);
  padding: 12px;
}

.release-type-chip {
  border-radius: 2px;
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .06em;
  padding: 3px 7px;
  text-transform: uppercase;
}

.release-type-chip.stable {
  background: rgba(70, 180, 125, .18);
  color: #8ee0b4;
}

.release-type-chip.beta {
  background: rgba(255, 111, 125, .18);
  color: #ff8c98;
}

.beta-channel-warning {
  background: rgba(181, 89, 34, .2);
  border-left: 3px solid #e39b55;
  color: #ffd4a5;
  padding: 10px 12px;
}

.stable-channel-note {
  background: rgba(55, 129, 94, .18);
  border-left: 3px solid #65ba8d;
  color: #a9e0c1;
  padding: 10px 12px;
}

.up-to-date {
  color: #a9e0c1;
}

@media (max-width: 767px) {
  .update-channel-selector {
    margin-top: 12px;
    width: 100%;
  }

  .update-channel-selector button {
    flex: 1 1 0;
  }

  .update-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
