<template>
  <div>
    <app-loader :is-loading="loading"/>

    <b-modal
      id="spire-release-process-modal"
      centered
      content-class="release-process-modal-shell"
      no-fade
      size="xl"
      title="Cutting a Spire Release"
      @shown="onReleaseProcessShown"
      @hidden="onReleaseProcessHidden"
    >
      <div class="release-process-modal">
        <div v-if="releaseStateVisible" :class="['release-status-panel', releaseStatusClass]" aria-live="polite">
          <div class="release-status-indicator" aria-hidden="true"></div>
          <div class="release-status-copy">
            <span>Release status</span>
            <strong>{{ releaseStatusLabel }}</strong>
            <p>{{ releaseStatusDescription }}</p>
          </div>
          <div class="release-status-actions">
            <a
              v-if="releasePrimaryLink.url"
              class="btn btn-sm btn-dark"
              :href="releasePrimaryLink.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ releasePrimaryLink.label }}
            </a>
            <button
              class="btn btn-sm btn-secondary release-refresh-button"
              @click="fetchReleaseStatus"
              :disabled="releaseStatusLoading"
              v-b-tooltip.hover.v-dark.top
              title="Refresh release status"
              aria-label="Refresh release status"
            >
              <i :class="['fe', releaseStatusLoading ? 'fe-loader' : 'fe-refresh-cw']" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <div :class="['release-process-context', releaseStateVisible ? 'release-process-context-live' : 'release-process-context-basic']">
          <div>
            <span>Target repo</span>
            <strong>{{ releaseRepository || "unset" }}</strong>
          </div>
          <div>
            <span>Release branch</span>
            <strong>{{ releaseBranch }}</strong>
          </div>
          <div>
            <span>Package version</span>
            <strong>{{ packageVersion || "-" }}</strong>
          </div>
          <div>
            <span>Top release</span>
            <strong>{{ topReleaseLabel }}</strong>
          </div>
          <div v-if="releaseStateVisible">
            <span>Latest GitHub</span>
            <strong>{{ releaseLatestReleaseLabel }}</strong>
          </div>
        </div>

        <div class="release-process-meta" v-if="releaseStateVisible">
          <span>Checkout: {{ currentBranchLabel }}</span>
          <span>Workflow: {{ releaseWorkflowLabel }}</span>
          <span>Checked: {{ releaseStatusCheckedLabel }}</span>
        </div>

        <div class="release-status-error" v-if="releaseStateVisible && (releaseStatusError || releaseStatusIssues.length > 0)">
          <i class="fe fe-alert-triangle" aria-hidden="true"></i>
          <div>
            <div v-if="releaseStatusError">{{ releaseStatusError }}</div>
            <div v-for="issue in releaseStatusIssues" :key="issue">{{ issue }}</div>
          </div>
        </div>

        <div :class="['github-token-panel', githubTokenPanelTone]">
          <i class="fe fe-key" aria-hidden="true"></i>
          <div class="github-token-body">
            <div class="github-token-header">
              <div>
                <div class="github-token-title">{{ githubTokenTitle }}</div>
                <p>{{ githubTokenHelpText }}</p>
              </div>
              <button v-if="!githubAuthNeedsToken" class="btn btn-sm btn-dark" type="button" @click="toggleGitHubTokenPanel">
                {{ githubTokenFormVisible ? "Hide" : githubTokenActionLabel }}
              </button>
            </div>
            <form v-if="githubTokenFormVisible" class="github-token-form" @submit.prevent="saveGitHubToken">
              <div class="github-token-input-wrap">
                <input
                  v-model="githubTokenInput"
                  :type="githubTokenVisible ? 'text' : 'password'"
                  class="form-control form-control-sm github-token-input"
                  autocomplete="off"
                  autocapitalize="off"
                  autocorrect="off"
                  spellcheck="false"
                  placeholder="GitHub personal access token"
                  :disabled="githubTokenSaving"
                  aria-label="GitHub personal access token"
                />
                <button
                  class="btn btn-sm btn-secondary github-token-icon-button github-token-paste-button"
                  type="button"
                  :disabled="githubTokenSaving || githubTokenPasting"
                  @click="pasteGitHubToken"
                  v-b-tooltip.hover.v-dark.top
                  title="Use token from clipboard"
                  aria-label="Use token from clipboard"
                >
                  <i :class="['fe', githubTokenPasting ? 'fe-loader' : 'fe-clipboard']" aria-hidden="true"></i>
                </button>
                <button
                  class="btn btn-sm btn-secondary github-token-icon-button github-token-visibility-button"
                  type="button"
                  :disabled="githubTokenSaving"
                  @click="githubTokenVisible = !githubTokenVisible"
                  v-b-tooltip.hover.v-dark.top
                  :title="githubTokenVisible ? 'Hide token' : 'Show token'"
                  :aria-label="githubTokenVisible ? 'Hide token' : 'Show token'"
                >
                  <i :class="['fe', githubTokenVisible ? 'fe-eye-off' : 'fe-eye']" aria-hidden="true"></i>
                </button>
              </div>
              <button class="btn btn-sm btn-primary" type="submit" :disabled="githubTokenSaving || !githubTokenInput.trim()">
                {{ githubTokenSaving ? "Saving..." : "Use token" }}
              </button>
            </form>
            <div class="github-token-message text-danger" v-if="githubTokenError">{{ githubTokenError }}</div>
            <div class="github-token-message text-success" v-if="githubTokenNotice">{{ githubTokenNotice }}</div>
          </div>
        </div>

        <ol class="release-process-list">
          <li
            v-for="(step, index) in releaseProcessSteps"
            :key="step.id"
            :class="releaseProcessStatic ? ['release-step', 'release-step-static'] : ['release-step', `release-step-${step.status}`]"
          >
            <div class="release-step-marker">
              <span v-if="releaseProcessStatic">{{ index + 1 }}</span>
              <i v-else :class="releaseStepIcon(step.status)" aria-hidden="true"></i>
            </div>
            <div class="release-step-body">
              <div class="release-step-heading">
                <div class="release-step-title">{{ step.title }}</div>
                <span v-if="!releaseProcessStatic" class="release-step-state">{{ releaseStepStatusLabel(step.status) }}</span>
              </div>
              <p>{{ step.detail }}</p>
            </div>
          </li>
        </ol>

        <div class="release-process-note">
          <i class="fe fe-info" aria-hidden="true"></i>
          <span>Manual releases are cut from <code>{{ releaseBranch }}</code>. The GitHub release body comes from the first <code>## [...]</code> section in <code>CHANGELOG.md</code>.</span>
        </div>
      </div>

      <template #modal-footer>
        <button class="btn btn-sm btn-dark" @click="$bvModal.hide('spire-release-process-modal')">
          Close
        </button>
      </template>
    </b-modal>

    <eq-window title="Spire Changelog" class="p-3" v-if="!loading">
      <div class="d-flex flex-wrap align-items-start justify-content-between mb-3">
        <div class="mr-3 mb-2">
          <div class="editor-title-row">
            <div class="h4 mb-1">Manual CHANGELOG.md Editor</div>
            <button
              :class="releaseInfoButtonClasses"
              @click="showReleaseProcess"
              aria-label="Show Spire release process"
            >
              <i class="fe fe-info" aria-hidden="true"></i>
            </button>
          </div>
          <div class="text-muted small">
            Edit the changelog directly, preview the rendered markdown, then save the full file back to the live repo checkout.
          </div>
        </div>

        <div class="changelog-status" aria-label="Changelog file status">
          <span :class="['status-pill', source === 'live' ? 'status-pill-good' : 'status-pill-muted']">
            <span class="status-pill-label">Source</span>
            <span class="status-pill-value">{{ source || "unknown" }}</span>
          </span>
          <span :class="['status-pill', writable ? 'status-pill-good' : 'status-pill-warning']">
            <span class="status-pill-label">Access</span>
            <span class="status-pill-value">{{ writable ? "writable" : "read-only" }}</span>
          </span>
          <span class="status-pill status-pill-version">
            <span class="status-pill-label">Version</span>
            <span class="status-pill-value">{{ packageVersion || "-" }}</span>
          </span>
          <span class="status-pill status-pill-repo">
            <span class="status-pill-label">Repo</span>
            <span class="status-pill-value">{{ releaseRepository || "unset" }}</span>
          </span>
          <span :class="['status-pill', releaseBranchAligned ? 'status-pill-good' : 'status-pill-warning']">
            <span class="status-pill-label">Branch</span>
            <span class="status-pill-value">{{ currentBranchLabel }}</span>
          </span>
        </div>
      </div>

      <info-error-banner
        :slim="true"
        :notification="notification"
        :error="error"
        @dismiss-error="error = ''"
        @dismiss-notification="notification = ''"
      />

      <div class="alert alert-warning mt-3 mb-0" v-if="source === 'embedded'">
        This page is showing embedded changelog data. Open Spire from a local or dev checkout to save edits.
      </div>

      <div class="alert alert-danger mt-3 mb-0" v-if="validationIssues.length > 0">
        <div class="font-weight-bold mb-2">Changelog Checks</div>
        <ul class="mb-0 pl-3">
          <li v-for="issue in validationIssues" :key="issue">{{ issue }}</li>
        </ul>
      </div>

      <div class="row mt-3">
        <div class="col-12 col-xl-7 mb-3 mb-xl-0">
          <eq-window-simple class="p-3 h-100">
            <div class="d-flex flex-wrap align-items-center justify-content-between mb-3">
              <div>
                <div class="font-weight-bold">Editor</div>
                <div class="small text-muted">
                  {{ lineCount }} lines, {{ wordCount }} words
                  <span v-if="isDirty" class="text-warning ml-2">Unsaved changes</span>
                </div>
              </div>

              <div class="btn-toolbar mt-2 mt-md-0" role="toolbar">
                <button class="btn btn-sm btn-dark mr-2 mb-2" @click="saveContent" :disabled="!canSave">
                  <i class="fe fe-save mr-1"></i> {{ saving ? "Saving..." : "Save" }}
                </button>
                <button class="btn btn-sm btn-secondary mr-2 mb-2" @click="reloadContent" :disabled="saving">
                  <i class="fe fe-refresh-cw mr-1"></i> Reload
                </button>
                <button class="btn btn-sm btn-secondary mr-2 mb-2" @click="copyContent" :disabled="!content">
                  <i class="fe fe-copy mr-1"></i> Copy
                </button>
                <button class="btn btn-sm btn-secondary mb-2" @click="downloadMarkdown" :disabled="!content">
                  <i class="fe fe-download mr-1"></i> Download
                </button>
              </div>
            </div>

            <div class="markdown-toolbar mb-2">
              <button class="btn btn-sm btn-outline-light" @click="insertReleaseHeading" :disabled="!canEdit">
                <i class="fe fe-plus mr-1"></i> Release
              </button>
              <button class="btn btn-sm btn-outline-light" @click="wrapSelection('**', '**', 'bold text')" :disabled="!canEdit">
                <strong>B</strong>
              </button>
              <button class="btn btn-sm btn-outline-light" @click="wrapSelection('*', '*', 'italic text')" :disabled="!canEdit">
                <em>I</em>
              </button>
              <button class="btn btn-sm btn-outline-light" @click="wrapSelection('`', '`', 'code')" :disabled="!canEdit">
                <i class="fe fe-code"></i>
              </button>
              <button class="btn btn-sm btn-outline-light" @click="insertLinePrefix('* ')" :disabled="!canEdit">
                <i class="fe fe-list mr-1"></i> Bullet
              </button>
              <button class="btn btn-sm btn-outline-light" @click="insertLinePrefix('1. ')" :disabled="!canEdit">
                <i class="fe fe-list mr-1"></i> Number
              </button>
              <button class="btn btn-sm btn-outline-light" @click="insertLinePrefix('> ')" :disabled="!canEdit">
                <i class="fe fe-corner-down-right mr-1"></i> Quote
              </button>
              <button class="btn btn-sm btn-outline-light" @click="insertLink" :disabled="!canEdit">
                <i class="fe fe-link"></i>
              </button>
              <button class="btn btn-sm btn-outline-light" @click="insertBlock('```\\n', '\\n```', 'code block')" :disabled="!canEdit">
                <i class="fe fe-terminal"></i>
              </button>
              <button class="btn btn-sm btn-outline-light" @click="insertAtCursor(today)" :disabled="!canEdit">
                <i class="fe fe-calendar mr-1"></i> Date
              </button>
            </div>

            <textarea
              ref="editor"
              v-model="content"
              class="form-control changelog-editor"
              spellcheck="true"
              :readonly="!canEdit"
              @input="markDirty"
              @keydown="handleEditorKeydown"
            ></textarea>
          </eq-window-simple>
        </div>

        <div class="col-12 col-xl-5">
          <eq-window-simple class="p-3 mb-3">
            <div class="font-weight-bold mb-2">File Status</div>
            <div class="status-grid small">
              <span>Source</span>
              <strong>{{ source || "-" }}</strong>
              <span>Writable</span>
              <strong>{{ writable ? "Yes" : "No" }}</strong>
              <span>Top Release</span>
              <strong>{{ topReleaseLabel }}</strong>
              <span>Release Repo</span>
              <strong>{{ releaseRepository || "-" }}</strong>
              <span>Repo Source</span>
              <strong>{{ releaseRepositorySourceLabel }}</strong>
            </div>
            <div :class="['release-channel-control', topRelease.isBeta ? 'release-channel-beta' : 'release-channel-stable']">
              <div class="release-channel-copy">
                <span>Release channel</span>
                <strong>{{ topRelease.isBeta ? "Beta" : "Stable" }}</strong>
                <small>
                  {{ topRelease.isBeta
                    ? "Manual Release will publish a GitHub prerelease and stamp the Spire logo."
                    : "Manual Release will publish through the established stable release path." }}
                </small>
              </div>
              <button
                type="button"
                class="release-channel-toggle"
                data-testid="beta-release-toggle"
                :class="{ active: topRelease.isBeta }"
                :aria-pressed="topRelease.isBeta ? 'true' : 'false'"
                :aria-label="topRelease.isBeta ? 'Mark top release as stable' : 'Mark top release as beta'"
                :disabled="!canEdit || !topRelease.version"
                @click="toggleTopReleaseBeta"
              >
                <span class="release-channel-toggle-track" aria-hidden="true">
                  <span class="release-channel-toggle-knob"></span>
                </span>
                <span>{{ topRelease.isBeta ? "Beta on" : "Beta off" }}</span>
              </button>
            </div>
          </eq-window-simple>

          <eq-window-simple class="p-3">
            <div class="d-flex align-items-center justify-content-between mb-2 preview-header">
              <div class="preview-header-copy">
                <div class="font-weight-bold">Preview</div>
                <div class="small text-muted">Rendered with the same markdown helper used by the changelog display.</div>
              </div>
              <button
                class="btn btn-sm btn-secondary copy-preview-button"
                @click="copyPreviewText"
                :disabled="!content"
                v-b-tooltip.hover.v-dark.top
                title="Copy preview text"
                aria-label="Copy preview text"
              >
                <i class="fe fe-copy" aria-hidden="true"></i>
              </button>
            </div>
            <div
              ref="previewRoot"
              class="changelog markdown-body spire-changelog-preview"
              v-html="previewHtml"
            ></div>
          </eq-window-simple>
        </div>
      </div>
    </eq-window>
  </div>
</template>

<script>
import EqWindow from "@/components/eq-ui/EQWindow.vue";
import EqWindowSimple from "@/components/eq-ui/EQWindowSimple.vue";
import InfoErrorBanner from "@/components/InfoErrorBanner.vue";
import {SpireApi} from "@/app/api/spire-api";
import Clipboard from "@/app/clipboard/clipboard";
import {decorateChangelogDom, renderChangelogMarkdown} from "@/app/changelog/changelog-renderer";
import {Notify} from "@/app/Notify";
import {AppEnv} from "@/app/env/app-env";
import {EventBus} from "@/app/event-bus/event-bus";

function todaysDate() {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
}

const betaReleaseMarkerLineRegexp = /^[ \t]*Release[ \t]+Type:[ \t]*(?:\*\*)?BETA(?:\*\*)?[ \t]*$/i;

function releaseHeadingMatches(content) {
  return Array.from((content || "").matchAll(/^## \[([^\]]+)](?:[ \t]+(\(Beta\)))?[ \t]+([^\n]+)$/gim));
}

function parseTopRelease(content) {
  const matches = releaseHeadingMatches(content);
  const match = matches[0];
  if (!match) {
    return {version: "", releaseDate: "", isBeta: false};
  }
  const bodyStart = match.index + match[0].length;
  const bodyEnd = matches.length > 1 ? matches[1].index : (content || "").length;
  const body = (content || "").slice(bodyStart, bodyEnd);
  return {
    version: match[1].trim(),
    releaseDate: match[3].trim(),
    isBeta: !!match[2] || body.split(/\r?\n/).some(line => betaReleaseMarkerLineRegexp.test(line))
  };
}

function setTopReleaseBeta(content, enabled) {
  const value = content || "";
  const matches = releaseHeadingMatches(value);
  const match = matches[0];
  if (!match) {
    return value;
  }

  const bodyStart = match.index + match[0].length;
  const bodyEnd = matches.length > 1 ? matches[1].index : value.length;
  const body = value.slice(bodyStart, bodyEnd);
  const bodyLines = body.split(/\r?\n/);
  const withoutMarker = bodyLines
    .filter(line => !betaReleaseMarkerLineRegexp.test(line))
    .join("\n");
  const nextBody = withoutMarker.replace(/^(?:\n){3,}/, "\n\n");
  const nextHeading = `## [${match[1].trim()}]${enabled ? " (Beta)" : ""} ${match[3].trim()}`;

  return value.slice(0, match.index) + nextHeading + nextBody + value.slice(bodyEnd);
}

function isUnreleasedVersion(version) {
  return (version || "").toLowerCase() === "unreleased";
}

function containsTokenLikeSecret(value) {
  return /(gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|Authorization:\s*Bearer\s+[A-Za-z0-9._-]{20,})/i.test(value || "");
}

const stateLoadRetryDelaysMs = [500, 1000, 2000, 3000, 3000, 3000];

const fallbackReleaseProcessSteps = [
  {
    id: "sync_checkout",
    title: "Move the release contents onto master.",
    detail: "Merge or cherry-pick the work that should ship, then pull master current before editing release notes.",
    status: "pending"
  },
  {
    id: "open_editor",
    title: "Open this editor from the master checkout.",
    detail: "The editor should be live, writable, and pointed at the GitHub repo that receives releases before you save release notes.",
    status: "pending"
  },
  {
    id: "prepare_notes",
    title: "Prepare the top CHANGELOG.md section.",
    detail: "Put the notes that should become the GitHub release body in the first heading. Drafts can use [Unreleased]; the workflow replaces it with the final version and date.",
    status: "pending"
  },
  {
    id: "validate_changelog",
    title: "Save and review CHANGELOG.md.",
    detail: "Save the file, clear changelog checks, and compare the preview against the release notes you intend to publish.",
    status: "pending"
  },
  {
    id: "run_workflow",
    title: "Run Manual Release on master.",
    detail: "Open GitHub Actions, select the master branch, choose patch/minor/major, and use the repo override only when intentionally publishing elsewhere.",
    status: "pending"
  },
  {
    id: "publish_release",
    title: "Let the workflow create the release.",
    detail: "It updates version metadata, stamps changelog notes, builds assets, commits release metadata back to master, and publishes GitHub.",
    status: "pending"
  },
  {
    id: "verify_release",
    title: "Verify the published release.",
    detail: "Confirm the latest GitHub release tag, notes, assets, and updater metadata match the intended release.",
    status: "pending"
  }
];

export default {
  name: "SpireChangelog",
  components: {
    EqWindow,
    EqWindowSimple,
    InfoErrorBanner
  },
  data() {
    return {
      loading: false,
      saving: false,
      notification: "",
      error: "",
      content: "",
      originalContent: "",
      savedReleaseIsBeta: false,
      packageVersion: "",
      releaseRepository: "",
      releaseRepositorySource: "",
      releaseRepositoryOverride: "",
      releaseBranch: "master",
      currentBranch: "",
      writable: false,
      source: "",
      isDirty: false,
      releaseStatus: null,
      releaseStatusLoading: false,
      releaseStatusError: "",
      releaseStatusTimer: null,
      githubTokenInput: "",
      githubTokenExpanded: false,
      githubTokenVisible: false,
      githubTokenPasting: false,
      githubTokenSaving: false,
      githubTokenError: "",
      githubTokenNotice: "",
    };
  },
  computed: {
    today() {
      return todaysDate();
    },
    canSave() {
      return this.writable && this.isDirty && !this.saving && this.content.trim().length > 0;
    },
    canEdit() {
      return this.writable && !this.saving;
    },
    lineCount() {
      if (!this.content) {
        return 0;
      }
      return this.content.split(/\r?\n/).length;
    },
    wordCount() {
      const words = (this.content || "").trim().match(/\S+/g);
      return words ? words.length : 0;
    },
    topRelease() {
      return parseTopRelease(this.content);
    },
    topReleaseLabel() {
      if (!this.topRelease.version) {
        return "-";
      }
      const channel = this.topRelease.isBeta ? " · Beta" : "";
      return `${this.topRelease.version} (${this.topRelease.releaseDate || "no date"})${channel}`;
    },
    previewHtml() {
      return renderChangelogMarkdown(this.content);
    },
    releaseRepositorySourceLabel() {
      switch (this.releaseRepositorySource) {
      case "env":
        return "SPIRE_RELEASE_REPO";
      case "config":
        return "eqemu_config.json";
      case "package_json":
        return "package.json";
      case "git_remote_upstream":
        return "git remote upstream";
      case "git_remote_origin":
        return "git remote origin";
      case "default":
        return "default";
      default:
        return this.releaseRepositorySource || "-";
      }
    },
    currentBranchLabel() {
      return this.currentBranch || "unknown";
    },
    releaseBranchAligned() {
      return !!this.currentBranch && this.currentBranch === this.releaseBranch;
    },
    releaseStatusSummary() {
      if (this.releaseStatusLoading && !this.releaseStatus) {
        return "checking";
      }
      return this.releaseStatus?.summary || "unknown";
    },
    releaseStatusLabel() {
      if (this.releaseStatusLoading && !this.releaseStatus) {
        return "Checking";
      }
      return this.releaseStatus?.summary_label || "GitHub status unknown";
    },
    releaseStatusClass() {
      return `release-status-${this.releaseStatusSummary}`;
    },
    releaseInfoButtonClasses() {
      if (this.githubAuthNeedsToken) {
        return ["btn", "release-info-button", "release-info-token"];
      }
      if (this.releaseProcessStatic) {
        return ["btn", "release-info-button", "release-info-basic"];
      }
      return ["btn", "release-info-button", `release-info-${this.releaseStatusSummary}`];
    },
    githubAuthNeedsToken() {
      return !!this.releaseStatus?.github_auth?.needs_token;
    },
    githubTokenFormVisible() {
      return this.githubAuthNeedsToken || this.githubTokenExpanded || !!this.githubTokenError;
    },
    githubTokenPanelTone() {
      if (this.githubAuthNeedsToken || this.githubTokenError) {
        return "github-token-warning";
      }
      if (this.githubTokenNotice) {
        return "github-token-success";
      }
      return "github-token-idle";
    },
    githubTokenTitle() {
      return this.githubAuthNeedsToken ? "GitHub token needed" : "GitHub access";
    },
    githubTokenActionLabel() {
      return this.githubAuthNeedsToken ? "Add token" : "Update token";
    },
    githubTokenHelpText() {
      return this.releaseStatus?.github_auth?.message || "Set a GitHub token for live release status.";
    },
    releaseStateUnavailable() {
      return !!this.releaseStatus?.github_error && !this.releaseStatus?.workflow && !this.releaseStatus?.latest_release;
    },
    releaseStateVisible() {
      return !!this.releaseStatus && !this.releaseStatusError && !this.releaseStateUnavailable;
    },
    releaseProcessStatic() {
      return !this.releaseStateVisible;
    },
    releaseStatusDescription() {
      if (this.releaseStatusLoading && !this.releaseStatus) {
        return "Checking the saved changelog, Manual Release workflow, and latest GitHub release.";
      }
      if (!this.releaseStatus) {
        return "Open the release process to check the saved changelog and GitHub release state.";
      }
      if (this.releaseStatus.summary === "needs_attention") {
        return this.releaseStatusIssues[0] || "Resolve the highlighted item before starting the workflow.";
      }
      if (this.releaseStatus.summary === "running") {
        return this.releaseStatus.workflow
          ? `Manual Release #${this.releaseStatus.workflow.run_number} is ${this.releaseStatus.workflow.status}.`
          : "Manual Release is running.";
      }
      if (this.releaseStatus.summary === "failed") {
        return this.releaseStatus.workflow
          ? `Manual Release #${this.releaseStatus.workflow.run_number} ended with ${this.releaseStatus.workflow.conclusion || "a failure"}.`
          : "The latest Manual Release workflow failed.";
      }
      if (this.releaseStatus.summary === "published") {
        return this.releaseStatus.latest_release
          ? `Latest GitHub release ${this.releaseStatus.latest_release.tag_name} is published.`
          : "The expected release is published.";
      }
      if (this.releaseStatus.summary === "sync_required") {
        return this.releaseStatusIssues[0] || "The release is published, but this checkout must pull master before the stamped notes appear.";
      }
      if (this.releaseStatus.summary === "unknown") {
        return "Local checks are clear, but GitHub status could not be read.";
      }
      return `${this.releaseBranch} checks are clear; run Manual Release on ${this.releaseBranch} when the notes are final.`;
    },
    releaseStatusIssues() {
      return this.releaseStatus?.issues || [];
    },
    releaseProcessSteps() {
      if (!this.releaseProcessStatic && this.releaseStatus?.steps?.length) {
        return this.releaseStatus.steps;
      }
      return fallbackReleaseProcessSteps;
    },
    releaseLatestReleaseLabel() {
      const latest = this.releaseStatus?.latest_release;
      if (!latest) {
        return "-";
      }
      return latest.tag_name || latest.name || "-";
    },
    releaseWorkflowLabel() {
      const workflow = this.releaseStatus?.workflow;
      if (!workflow) {
        return "No recent run";
      }
      const conclusion = workflow.conclusion ? ` / ${workflow.conclusion}` : "";
      return `#${workflow.run_number} ${workflow.status}${conclusion}`;
    },
    releaseStatusCheckedLabel() {
      return this.formatReleaseTimestamp(this.releaseStatus?.checked_at);
    },
    releasePrimaryLink() {
      if (this.releaseStatus?.workflow?.html_url && (this.releaseStatus.summary === "running" || this.releaseStatus.summary === "failed")) {
        return {label: "Open workflow", url: this.releaseStatus.workflow.html_url};
      }
      if (this.releaseStatus?.latest_release?.html_url && this.releaseStatus.summary === "published") {
        return {label: "Open release", url: this.releaseStatus.latest_release.html_url};
      }
      if (this.releaseStatus?.summary === "sync_required" && this.releaseRepository) {
        return {
          label: "Open master",
          url: `https://github.com/${this.releaseRepository}/tree/${encodeURIComponent(this.releaseBranch)}`
        };
      }
      if (this.releaseRepository) {
        return {
          label: "Open master workflow",
          url: `https://github.com/${this.releaseRepository}/actions/workflows/manual-release.yml?query=branch%3A${encodeURIComponent(this.releaseBranch)}`
        };
      }
      return {label: "", url: ""};
    },
    validationIssues() {
      const issues = [];
      const text = this.content || "";
      const top = this.topRelease;

      if (!this.source) {
        return issues;
      }
      if (!text.trim()) {
        issues.push("CHANGELOG.md cannot be empty.");
        return issues;
      }
      if (containsTokenLikeSecret(text)) {
        issues.push("CHANGELOG.md appears to contain a token-like secret. Remove it before saving or publishing release notes.");
      }

      if (!top.version) {
        issues.push("The first release heading should use the format: ## [1.2.3] M/D/YYYY.");
      } else if (isUnreleasedVersion(top.version)) {
        // Draft sections are stamped by the manual GitHub release workflow.
      } else if (this.packageVersion && top.version !== this.packageVersion) {
        issues.push(`Top changelog version [${top.version}] does not match package.json version [${this.packageVersion}].`);
      }

      const versions = [];
      const releaseHeadingRegexp = /^## \[([^\]]+)] /gm;
      let match = releaseHeadingRegexp.exec(text);
      while (match) {
        versions.push(match[1]);
        match = releaseHeadingRegexp.exec(text);
      }

      const duplicates = versions.filter((version, index) => versions.indexOf(version) !== index);
      Array.from(new Set(duplicates)).forEach((version) => {
        issues.push(`Duplicate changelog version [${version}] detected.`);
      });

      return issues;
    }
  },
  watch: {
    previewHtml() {
      this.$nextTick(() => {
        decorateChangelogDom(this.$refs.previewRoot);
      });
    }
  },
  mounted() {
    this.fetchState().then((loaded) => {
      if (loaded) {
        this.fetchReleaseStatus(false);
      }
    });
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  },
  destroyed() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    this.stopReleaseStatusPolling();
    this.clearBetaReleasePreview();
  },
  beforeRouteLeave(to, from, next) {
    if (this.isDirty && !window.confirm("Discard unsaved changelog changes?")) {
      next(false);
      return;
    }
    this.clearBetaReleasePreview();
    next();
  },
  methods: {
    async fetchState() {
      this.loading = true;
      this.error = "";
      let lastError = null;
      try {
        for (let attempt = 0; attempt <= stateLoadRetryDelaysMs.length; attempt++) {
          try {
            const response = await SpireApi.v1().get("spirechangelog");
            this.applyState(response.data.data);
            return true;
          } catch (e) {
            lastError = e;
            const retryDelay = stateLoadRetryDelaysMs[attempt];
            if (!this.shouldRetryStateLoad(e) || retryDelay === undefined) {
              break;
            }
            await this.waitForStateRetry(retryDelay);
          }
        }

        this.error = lastError?.response?.data?.error || "Failed to load Spire changelog state.";
        return false;
      } finally {
        this.loading = false;
      }
    },
    shouldRetryStateLoad(error) {
      const status = error?.response?.status;
      return !status || status >= 500;
    },
    waitForStateRetry(delayMs) {
      return new Promise(resolve => window.setTimeout(resolve, delayMs));
    },
    applyState(state) {
      this.content = state.content || "";
      this.originalContent = this.content;
      const savedReleaseIsBeta = state.top_release && typeof state.top_release.is_beta === "boolean"
        ? state.top_release.is_beta
        : parseTopRelease(this.content).isBeta;
      this.savedReleaseIsBeta = savedReleaseIsBeta;
      AppEnv.setIsBetaRelease(savedReleaseIsBeta);
      EventBus.$emit("APP_BETA_RELEASE_CHANGED", savedReleaseIsBeta);
      this.packageVersion = state.package_version || "";
      this.releaseRepository = state.release_repository || "";
      this.releaseRepositorySource = state.release_repository_source || "";
      this.releaseRepositoryOverride = state.release_repository_override || "";
      this.releaseBranch = state.release_branch || "master";
      this.currentBranch = state.current_branch || "";
      this.writable = !!state.writable;
      this.source = state.source || "";
      this.isDirty = false;
      this.$nextTick(() => {
        decorateChangelogDom(this.$refs.previewRoot);
      });
    },
    applyReleaseStatus(status) {
      this.releaseStatus = status;
      if (!status) {
        return;
      }
      this.releaseBranch = status.release_branch || this.releaseBranch || "master";
      this.currentBranch = status.local?.current_branch || this.currentBranch || "";
    },
    async fetchReleaseStatus(showSpinner = true) {
      if (this.releaseStatusLoading) {
        return;
      }

      this.releaseStatusLoading = showSpinner || !this.releaseStatus;
      this.releaseStatusError = "";
      if (!this.githubTokenSaving) {
        this.githubTokenError = "";
      }
      try {
        const response = await SpireApi.v1().get("spirechangelog/release-status");
        this.applyReleaseStatus(response.data.data);
        if (this.githubAuthNeedsToken) {
          this.githubTokenExpanded = true;
        }
      } catch (e) {
        this.releaseStatusError = e.response?.data?.error || "Failed to load GitHub release status.";
      } finally {
        this.releaseStatusLoading = false;
      }
    },
    async saveGitHubToken() {
      const token = this.githubTokenInput.trim();
      if (!token) {
        this.githubTokenError = "GitHub token is required.";
        return;
      }

      await this.saveGitHubTokenValue(token, "GitHub token saved on this machine.");
    },
    async saveGitHubTokenValue(token, notice) {
      this.githubTokenSaving = true;
      this.githubTokenError = "";
      this.githubTokenNotice = "";
      try {
        const response = await SpireApi.v1().post("spirechangelog/github-token", {
          token
        });
        this.applyReleaseStatus(response.data.data);
        this.githubTokenInput = "";
        this.githubTokenExpanded = false;
        this.githubTokenVisible = false;
        this.githubTokenNotice = notice;
        Notify.toast(notice);
      } catch (e) {
        this.githubTokenError = e.response?.data?.error || "Failed to validate GitHub token.";
      } finally {
        this.githubTokenSaving = false;
      }
    },
    async pasteGitHubToken() {
      if (this.githubTokenSaving || this.githubTokenPasting) {
        return;
      }

      this.githubTokenPasting = true;
      this.githubTokenError = "";
      this.githubTokenNotice = "";
      try {
        let text = "";
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.readText) {
          try {
            text = (await navigator.clipboard.readText()).trim();
          } catch (e) {
            text = "";
          }
        }

        if (text) {
          await this.saveGitHubTokenValue(text, "GitHub token saved from clipboard on this machine.");
          return;
        }

        this.githubTokenSaving = true;
        const response = await SpireApi.v1().post("spirechangelog/github-token/clipboard");
        this.applyReleaseStatus(response.data.data);
        this.githubTokenInput = "";
        this.githubTokenExpanded = false;
        this.githubTokenVisible = false;
        this.githubTokenNotice = "GitHub token saved from local clipboard on this machine.";
        Notify.toast("GitHub token saved from local clipboard on this machine.");
      } catch (e) {
        this.githubTokenError = e.response?.data?.error || "Clipboard token could not be used. Copy the token, then try again.";
      } finally {
        this.githubTokenSaving = false;
        this.githubTokenPasting = false;
      }
    },
    toggleGitHubTokenPanel() {
      if (this.githubTokenFormVisible) {
        this.githubTokenExpanded = false;
        this.githubTokenInput = "";
        this.githubTokenVisible = false;
        if (!this.githubAuthNeedsToken) {
          this.githubTokenError = "";
        }
        return;
      }

      this.githubTokenExpanded = true;
    },
    onReleaseProcessShown() {
      this.fetchReleaseStatus();
      this.startReleaseStatusPolling();
    },
    onReleaseProcessHidden() {
      this.stopReleaseStatusPolling();
    },
    startReleaseStatusPolling() {
      this.stopReleaseStatusPolling();
      const refreshSeconds = this.releaseStatus?.refresh_after_seconds || 20;
      this.releaseStatusTimer = window.setInterval(() => {
        this.fetchReleaseStatus(false);
      }, refreshSeconds * 1000);
    },
    stopReleaseStatusPolling() {
      if (this.releaseStatusTimer) {
        window.clearInterval(this.releaseStatusTimer);
        this.releaseStatusTimer = null;
      }
    },
    markDirty() {
      this.isDirty = this.content !== this.originalContent;
    },
    previewBetaRelease(isBetaRelease) {
      EventBus.$emit("APP_BETA_RELEASE_PREVIEW_CHANGED", isBetaRelease === true);
    },
    clearBetaReleasePreview() {
      EventBus.$emit("APP_BETA_RELEASE_PREVIEW_CHANGED", null);
    },
    toggleTopReleaseBeta() {
      if (!this.canEdit || !this.topRelease.version) {
        return;
      }

      const updated = setTopReleaseBeta(this.content, !this.topRelease.isBeta);
      if (updated === this.content) {
        return;
      }

      this.content = updated;
      this.markDirty();
      if (this.topRelease.isBeta === this.savedReleaseIsBeta) {
        this.clearBetaReleasePreview();
      } else {
        this.previewBetaRelease(this.topRelease.isBeta);
      }
      this.$nextTick(() => {
        const editor = this.$refs.editor;
        if (editor) {
          editor.focus({preventScroll: true});
        }
      });
    },
    async saveContent() {
      if (!this.canSave) {
        return;
      }

      this.saving = true;
      this.error = "";
      this.notification = "";
      try {
        const response = await SpireApi.v1().post("spirechangelog/content", {
          content: this.content
        });
        this.applyState(response.data.data);
        this.notification = "CHANGELOG.md saved.";
        Notify.toast("CHANGELOG.md saved.");
        this.fetchReleaseStatus(false);
      } catch (e) {
        this.error = e.response?.data?.error || "Failed to save CHANGELOG.md.";
        if (this.topRelease.isBeta !== this.savedReleaseIsBeta) {
          this.clearBetaReleasePreview();
          this.error += ` The logo preview was restored to the saved ${this.savedReleaseIsBeta ? "Beta" : "Stable"} state.`;
        }
      } finally {
        this.saving = false;
      }
    },
    async reloadContent() {
      if (this.isDirty && !window.confirm("Reload CHANGELOG.md and discard unsaved edits?")) {
        return;
      }
      const loaded = await this.fetchState();
      if (loaded) {
        this.fetchReleaseStatus(false);
        this.notification = "CHANGELOG.md reloaded.";
      }
    },
    copyContent() {
      Clipboard.copyFromText(this.content);
      Notify.toast("Copied CHANGELOG.md to clipboard.");
    },
    copyPreviewText() {
      Clipboard.copyFromText(this.content);
      Notify.toast("Copied changelog markdown to clipboard.");
    },
    showReleaseProcess() {
      this.$bvModal.show("spire-release-process-modal");
    },
    releaseStepIcon(status) {
      switch (status) {
      case "done":
        return "fe fe-check";
      case "running":
        return "fe fe-loader";
      case "current":
        return "fe fe-arrow-right";
      case "attention":
      case "failed":
        return "fe fe-alert-triangle";
      default:
        return "fe fe-circle";
      }
    },
    releaseStepStatusLabel(status) {
      switch (status) {
      case "done":
        return "Done";
      case "running":
        return "Running";
      case "current":
        return "Current";
      case "attention":
        return "Attention";
      case "failed":
        return "Failed";
      default:
        return "Pending";
      }
    },
    formatReleaseTimestamp(value) {
      if (!value) {
        return "-";
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "-";
      }
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    },
    downloadMarkdown() {
      const blob = new Blob([this.content], {type: "text/markdown;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "CHANGELOG.md";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    handleBeforeUnload(event) {
      if (!this.isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    },
    handleEditorKeydown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        this.saveContent();
      }
    },
    insertReleaseHeading() {
      if (!this.canEdit) {
        return;
      }

      const heading = `## [Unreleased] ${this.today}\n\n* \n\n`;
      this.content = heading + this.content.replace(/^\s+/, "");
      this.markDirty();
      this.$nextTick(() => {
        const editor = this.$refs.editor;
        if (editor) {
          editor.focus({preventScroll: true});
          const pos = heading.indexOf("* ") + 2;
          editor.setSelectionRange(pos, pos);
          editor.scrollTop = 0;
          editor.scrollLeft = 0;
          window.requestAnimationFrame(() => {
            editor.scrollTop = 0;
            editor.scrollLeft = 0;
          });
        }
      });
    },
    insertLinePrefix(prefix) {
      if (!this.canEdit) {
        return;
      }

      const editor = this.$refs.editor;
      if (!editor) {
        return;
      }
      const start = editor.selectionStart || 0;
      const lineStart = this.content.lastIndexOf("\n", start - 1) + 1;
      this.content = this.content.slice(0, lineStart) + prefix + this.content.slice(lineStart);
      this.markDirty();
      this.$nextTick(() => {
        editor.focus();
        editor.setSelectionRange(start + prefix.length, start + prefix.length);
      });
    },
    insertLink() {
      this.insertBlock("[", "](https://example.com)", "link text");
    },
    wrapSelection(before, after, placeholder) {
      this.insertBlock(before, after, placeholder);
    },
    insertAtCursor(value) {
      this.insertBlock(value, "", "");
    },
    insertBlock(before, after, placeholder) {
      if (!this.canEdit) {
        return;
      }

      const editor = this.$refs.editor;
      if (!editor) {
        return;
      }

      const start = editor.selectionStart || 0;
      const end = editor.selectionEnd || start;
      const selected = this.content.slice(start, end) || placeholder;
      const inserted = before + selected + after;
      this.content = this.content.slice(0, start) + inserted + this.content.slice(end);
      this.markDirty();

      this.$nextTick(() => {
        editor.focus();
        const selectionStart = start + before.length;
        const selectionEnd = selectionStart + selected.length;
        editor.setSelectionRange(selectionStart, selectionEnd);
      });
    }
  }
};
</script>

<style scoped>
.editor-title-row {
  align-items: center;
  display: flex;
  gap: 8px;
}

.release-channel-control {
  align-items: center;
  background: rgba(18, 38, 63, .36);
  border: 1px solid rgba(149, 170, 201, .2);
  border-radius: 4px;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  margin-top: 14px;
  padding: 12px;
  transition: background-color .16s ease, border-color .16s ease;
}

.release-channel-beta {
  background: rgba(110, 25, 37, .2);
  border-color: rgba(238, 86, 102, .42);
}

.release-channel-copy {
  min-width: 0;
}

.release-channel-copy > span {
  color: #95aac9;
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .06em;
  line-height: 1;
  margin-bottom: 5px;
  text-transform: uppercase;
}

.release-channel-copy strong {
  color: #edf2f9;
  display: block;
  font-size: 14px;
  line-height: 1.1;
}

.release-channel-copy small {
  color: #aebed2;
  display: block;
  line-height: 1.35;
  margin-top: 5px;
}

.release-channel-toggle {
  align-items: center;
  background: rgba(8, 17, 29, .58);
  border: 1px solid rgba(149, 170, 201, .3);
  border-radius: 3px;
  color: #c8d4e4;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  gap: 7px;
  min-height: 32px;
  padding: 5px 8px;
  transition: background-color .16s ease, border-color .16s ease, color .16s ease;
}

.release-channel-toggle:hover:not(:disabled),
.release-channel-toggle:focus:not(:disabled) {
  border-color: rgba(246, 195, 67, .62);
  color: #f6c343;
}

.release-channel-toggle.active {
  border-color: rgba(238, 86, 102, .65);
  color: #ff8d99;
}

.release-channel-toggle:disabled {
  cursor: not-allowed;
  opacity: .5;
}

.release-channel-toggle-track {
  background: #3b506c;
  border-radius: 8px;
  display: inline-block;
  height: 14px;
  position: relative;
  transition: background-color .16s ease;
  width: 25px;
}

.release-channel-toggle-knob {
  background: #edf2f9;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .42);
  height: 10px;
  left: 2px;
  position: absolute;
  top: 2px;
  transition: transform .16s ease;
  width: 10px;
}

.release-channel-toggle.active .release-channel-toggle-track {
  background: #c43f55;
}

.release-channel-toggle.active .release-channel-toggle-knob {
  transform: translateX(11px);
}

@media (max-width: 575.98px) {
  .release-channel-control {
    align-items: stretch;
    flex-direction: column;
  }

  .release-channel-toggle {
    justify-content: center;
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .release-channel-control,
  .release-channel-toggle,
  .release-channel-toggle-track,
  .release-channel-toggle-knob {
    transition: none;
  }
}

.release-info-button {
  align-items: center;
  background: rgba(18, 38, 63, .28);
  border: 1px solid rgba(149, 170, 201, .28);
  border-radius: 4px;
  color: #9fb0c8;
  display: inline-flex;
  flex: 0 0 24px;
  height: 24px;
  justify-content: center;
  padding: 0;
  position: relative;
  transition: background-color .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease;
  width: 24px;
}

.release-info-button:hover,
.release-info-button:focus {
  border-color: rgba(246, 195, 67, .62);
  box-shadow: 0 0 0 1px rgba(246, 195, 67, .1);
  color: #f6c343;
}

.release-info-button i {
  font-size: 13px;
  line-height: 1;
}

.release-info-button::after {
  border: 1px solid rgba(8, 17, 29, .9);
  border-radius: 50%;
  bottom: -2px;
  content: "";
  height: 8px;
  position: absolute;
  right: -2px;
  width: 8px;
}

.release-info-basic::after {
  display: none;
}

.release-info-token::after {
  background: #f6c343;
}

.release-info-checking::after,
.release-info-unknown::after {
  background: #95aac9;
}

.release-info-ready::after {
  background: #f6c343;
}

.release-info-sync_required::after {
  background: #f6c343;
}

.release-info-running::after {
  background: #2c7be5;
}

.release-info-published::after {
  background: #00d97e;
}

.release-info-needs_attention::after,
.release-info-failed::after {
  background: #e63757;
}

::v-deep .release-process-modal-shell {
  background: #08111d;
  border: 1px solid rgba(197, 176, 120, .5);
  box-shadow: 0 18px 60px rgba(0, 0, 0, .58);
  color: #edf2f9;
}

::v-deep .release-process-modal-shell .modal-header,
::v-deep .release-process-modal-shell .modal-footer {
  border-color: rgba(197, 176, 120, .28);
}

::v-deep .release-process-modal-shell .modal-title {
  color: #f3f7fb;
  font-weight: 700;
}

::v-deep .release-process-modal-shell .close {
  color: #edf2f9;
  opacity: .8;
  text-shadow: none;
}

.release-process-modal {
  color: #d9e2ef;
}

.release-status-panel {
  align-items: center;
  background: linear-gradient(180deg, rgba(21, 35, 53, .96), rgba(9, 17, 28, .96));
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 4px;
  display: grid;
  gap: 12px;
  grid-template-columns: 14px minmax(0, 1fr) auto;
  margin-bottom: 12px;
  padding: 12px;
}

.release-status-indicator {
  border-radius: 50%;
  height: 10px;
  width: 10px;
}

.release-status-copy {
  min-width: 0;
}

.release-status-copy span {
  color: #95aac9;
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.release-status-copy strong {
  color: #f3f7fb;
  display: block;
  font-size: 16px;
  line-height: 1.2;
}

.release-status-copy p {
  color: #c8d4e4;
  font-size: 13px;
  line-height: 1.35;
  margin: 4px 0 0;
}

.release-status-actions {
  align-items: center;
  display: flex;
  gap: 8px;
}

.release-refresh-button {
  align-items: center;
  display: inline-flex;
  height: 32px;
  justify-content: center;
  padding: 0;
  width: 32px;
}

.release-status-checking .release-status-indicator,
.release-status-unknown .release-status-indicator {
  background: #95aac9;
  box-shadow: 0 0 10px rgba(149, 170, 201, .28);
}

.release-status-ready .release-status-indicator {
  background: #f6c343;
  box-shadow: 0 0 10px rgba(246, 195, 67, .28);
}

.release-status-sync_required .release-status-indicator {
  background: #f6c343;
  box-shadow: 0 0 10px rgba(246, 195, 67, .28);
}

.release-status-running .release-status-indicator {
  background: #2c7be5;
  box-shadow: 0 0 10px rgba(44, 123, 229, .35);
}

.release-status-published .release-status-indicator {
  background: #00d97e;
  box-shadow: 0 0 10px rgba(0, 217, 126, .32);
}

.release-status-needs_attention .release-status-indicator,
.release-status-failed .release-status-indicator {
  background: #e63757;
  box-shadow: 0 0 10px rgba(230, 55, 87, .3);
}

.release-process-context {
  display: grid;
  gap: 10px;
  margin-bottom: 10px;
}

.release-process-context-basic {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.release-process-context-live {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.release-process-context > div {
  background: linear-gradient(180deg, rgba(21, 35, 53, .96), rgba(9, 17, 28, .94));
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 4px;
  min-width: 0;
  padding: 10px 12px;
}

.release-process-context span {
  color: #95aac9;
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.release-process-context strong {
  color: #f3f7fb;
  display: block;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.release-process-meta {
  color: #95aac9;
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  gap: 8px 16px;
  margin-bottom: 12px;
}

.release-status-error {
  align-items: flex-start;
  background: rgba(230, 55, 87, .1);
  border: 1px solid rgba(230, 55, 87, .32);
  border-radius: 4px;
  color: #f3f7fb;
  display: flex;
  font-size: 13px;
  gap: 8px;
  line-height: 1.35;
  margin-bottom: 12px;
  padding: 9px 12px;
}

.release-status-error i {
  color: #ff6b80;
  margin-top: 2px;
}

.github-token-panel {
  align-items: flex-start;
  background: rgba(55, 136, 230, .08);
  border: 1px solid rgba(55, 136, 230, .28);
  border-radius: 4px;
  color: #f3f7fb;
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px 12px;
}

.github-token-panel > i {
  color: #77b7ff;
  margin-top: 3px;
}

.github-token-warning {
  background: rgba(246, 195, 67, .08);
  border-color: rgba(246, 195, 67, .3);
}

.github-token-warning > i {
  color: #f6c343;
}

.github-token-success {
  background: rgba(0, 217, 126, .07);
  border-color: rgba(0, 217, 126, .25);
}

.github-token-success > i {
  color: #00d97e;
}

.github-token-body {
  min-width: 0;
  width: 100%;
}

.github-token-header {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.github-token-header > div {
  min-width: 0;
}

.github-token-header .btn {
  flex: 0 0 auto;
}

.github-token-title {
  color: #f3f7fb;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 3px;
}

.github-token-body p {
  color: #d9e2ef;
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
}

.github-token-form {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.github-token-input-wrap {
  flex: 1 1 auto;
  min-width: 0;
  position: relative;
}

.github-token-input {
  background: rgba(0, 0, 0, .32);
  border-color: rgba(255, 255, 255, .18);
  color: #f3f7fb;
  min-width: 0;
  padding-right: 70px;
  width: 100%;
}

.github-token-input:focus {
  background: rgba(0, 0, 0, .4);
  border-color: rgba(246, 195, 67, .55);
  box-shadow: 0 0 0 1px rgba(246, 195, 67, .12);
  color: #f3f7fb;
}

.github-token-icon-button {
  align-items: center;
  display: inline-flex;
  height: 28px;
  justify-content: center;
  padding: 0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
}

.github-token-paste-button {
  right: 34px;
}

.github-token-visibility-button {
  right: 3px;
}

.github-token-icon-button i {
  font-size: 13px;
  line-height: 1;
}

.github-token-message {
  font-size: 12px;
  font-weight: 700;
  margin-top: 6px;
}

.release-process-list {
  counter-reset: release-step;
  list-style: none;
  margin: 0;
  padding: 0;
}

.release-process-list li {
  display: grid;
  gap: 12px;
  grid-template-columns: 30px minmax(0, 1fr);
  padding: 0 0 16px;
  position: relative;
}

.release-process-list li:not(:last-child)::after {
  background: rgba(197, 176, 120, .22);
  bottom: 2px;
  content: "";
  left: 14px;
  position: absolute;
  top: 32px;
  width: 1px;
}

.release-step-marker {
  align-items: center;
  background: rgba(149, 170, 201, .12);
  border: 1px solid rgba(149, 170, 201, .32);
  border-radius: 4px;
  color: #9fb0c8;
  display: flex;
  font-size: 12px;
  font-weight: 700;
  height: 30px;
  justify-content: center;
  position: relative;
  width: 30px;
  z-index: 1;
}

.release-step-static .release-step-marker {
  background: rgba(44, 123, 229, .16);
  border-color: rgba(44, 123, 229, .42);
  color: #f3f7fb;
}

.release-step-done .release-step-marker {
  background: rgba(0, 217, 126, .12);
  border-color: rgba(0, 217, 126, .38);
  color: #8ff3c1;
}

.release-step-running .release-step-marker,
.release-step-current .release-step-marker {
  background: rgba(44, 123, 229, .16);
  border-color: rgba(44, 123, 229, .42);
  color: #9cc7ff;
}

.release-step-attention .release-step-marker,
.release-step-failed .release-step-marker {
  background: rgba(230, 55, 87, .12);
  border-color: rgba(230, 55, 87, .42);
  color: #ff9baa;
}

.release-step-body {
  background: rgba(10, 18, 30, .58);
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 4px;
  padding: 10px 12px;
}

.release-step-heading {
  align-items: flex-start;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-bottom: 4px;
}

.release-step-title {
  color: #f3f7fb;
  font-size: 13px;
  font-weight: 700;
  min-width: 0;
}

.release-step-state {
  border: 1px solid rgba(149, 170, 201, .3);
  border-radius: 3px;
  color: #95aac9;
  flex: 0 0 auto;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 4px 6px;
  text-transform: uppercase;
}

.release-step-done .release-step-state {
  border-color: rgba(0, 217, 126, .38);
  color: #8ff3c1;
}

.release-step-running .release-step-state,
.release-step-current .release-step-state {
  border-color: rgba(44, 123, 229, .42);
  color: #9cc7ff;
}

.release-step-attention .release-step-state,
.release-step-failed .release-step-state {
  border-color: rgba(230, 55, 87, .42);
  color: #ff9baa;
}

.release-step-body p {
  color: #c8d4e4;
  font-size: 13px;
  line-height: 1.45;
  margin: 0;
}

.release-process-modal code {
  background: rgba(44, 123, 229, .14);
  border: 1px solid rgba(44, 123, 229, .2);
  border-radius: 3px;
  color: #9cc7ff;
  font-size: 12px;
  padding: 1px 4px;
}

.release-process-note {
  align-items: flex-start;
  background: rgba(246, 195, 67, .08);
  border: 1px solid rgba(246, 195, 67, .28);
  border-radius: 4px;
  color: #f3f7fb;
  display: flex;
  gap: 8px;
  margin-top: 2px;
  padding: 10px 12px;
}

.release-process-note i {
  color: #f6c343;
  margin-top: 2px;
}

@media (max-width: 767.98px) {
  .release-status-panel {
    grid-template-columns: 14px minmax(0, 1fr);
  }

  .release-status-actions {
    grid-column: 2;
    justify-content: flex-start;
  }

  .release-process-context {
    grid-template-columns: 1fr;
  }

  .release-step-heading {
    display: block;
  }

  .release-step-state {
    display: inline-block;
    margin-top: 6px;
  }

  .github-token-form {
    display: block;
  }

  .github-token-form > .btn {
    margin-top: 8px;
    width: 100%;
  }
}

@media (min-width: 768px) and (max-width: 1199.98px) {
  .release-process-context {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.changelog-status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  max-width: 680px;
}

.status-pill {
  align-items: center;
  background: linear-gradient(180deg, rgba(21, 35, 53, .96), rgba(9, 17, 28, .94));
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 4px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .08), 0 1px 8px rgba(0, 0, 0, .22);
  color: #f3f7fb;
  display: inline-flex;
  gap: 8px;
  min-height: 34px;
  max-width: 220px;
  padding: 7px 10px;
}

.status-pill-label {
  color: #9fb0c8;
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
  text-transform: uppercase;
}

.status-pill-value {
  flex: 1 1 auto;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-pill-good {
  border-color: rgba(0, 217, 126, .45);
}

.status-pill-warning {
  border-color: rgba(246, 195, 67, .62);
}

.status-pill-muted {
  border-color: rgba(149, 170, 201, .38);
}

.status-pill-version {
  border-color: rgba(237, 242, 249, .38);
}

.status-pill-repo {
  border-color: rgba(44, 123, 229, .48);
}

.markdown-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.changelog-editor {
  min-height: 68vh;
  resize: vertical;
  font-family: Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
  line-height: 1.5;
  background: rgba(0, 0, 0, .36);
  color: #f3f5f7;
  border-color: rgba(255, 255, 255, .18);
}

.status-grid {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 6px 12px;
}

.status-grid strong {
  min-width: 0;
  overflow-wrap: anywhere;
}

.preview-header {
  gap: 12px;
}

.preview-header-copy {
  min-width: 0;
}

.btn.copy-preview-button {
  align-items: center;
  border-color: rgba(255, 255, 255, .22);
  display: inline-flex;
  flex: 0 0 32px;
  height: 32px;
  justify-content: center;
  padding: 0;
  transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease;
  width: 32px;
}

.btn.copy-preview-button:not(:disabled):hover,
.btn.copy-preview-button:focus {
  border-color: rgba(246, 195, 67, .7);
  box-shadow: 0 0 0 1px rgba(246, 195, 67, .12), 0 0 10px rgba(44, 123, 229, .18);
}

.btn.copy-preview-button i {
  font-size: 14px;
  line-height: 1;
}

.spire-changelog-preview {
  max-height: 74vh;
  overflow: auto;
  padding-right: 8px;
}

::v-deep .spire-changelog-preview img {
  max-width: 100%;
}
</style>
