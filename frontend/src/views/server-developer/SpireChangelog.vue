<template>
  <div>
    <app-loader :is-loading="loading"/>

    <eq-window title="Spire Changelog" class="p-3" v-if="!loading">
      <div class="d-flex flex-wrap align-items-start justify-content-between mb-3">
        <div class="mr-3 mb-2">
          <div class="h4 mb-1">Manual CHANGELOG.md Editor</div>
          <div class="text-muted small">
            Edit the changelog directly, preview the rendered markdown, then save the full file back to the live repo checkout.
          </div>
        </div>

        <div class="d-flex flex-wrap align-items-center changelog-status">
          <span :class="sourceBadgeClass">{{ source || "unknown" }}</span>
          <span :class="writableBadgeClass">{{ writable ? "writable" : "read-only" }}</span>
          <span class="badge changelog-version-badge">version {{ packageVersion || "-" }}</span>
          <span class="badge badge-secondary">{{ releaseRepository || "release repo unset" }}</span>
        </div>
      </div>

      <info-error-banner
        :slim="true"
        :notification="notification"
        :error="error"
        @dismiss-error="error = ''"
        @dismiss-notification="notification = ''"
      />

      <div class="alert alert-warning mt-3 mb-0" v-if="!writable">
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
          </eq-window-simple>

          <eq-window-simple class="p-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div>
                <div class="font-weight-bold">Preview</div>
                <div class="small text-muted">Rendered with the same markdown helper used by the changelog display.</div>
              </div>
              <button class="btn btn-sm btn-secondary" @click="copyPreviewText" :disabled="!content">
                <i class="fe fe-copy mr-1"></i> Copy Text
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
import InfoErrorBanner from "@/components/InfoErrorBanner.vue";
import {SpireApi} from "@/app/api/spire-api";
import Clipboard from "@/app/clipboard/clipboard";
import {decorateChangelogDom, renderChangelogMarkdown} from "@/app/changelog/changelog-renderer";
import {Notify} from "@/app/Notify";

function todaysDate() {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
}

function parseTopRelease(content) {
  const match = (content || "").match(/^## \[([^\]]+)] ([^\n]+)/m);
  if (!match) {
    return {version: "", releaseDate: ""};
  }
  return {version: match[1].trim(), releaseDate: match[2].trim()};
}

function isUnreleasedVersion(version) {
  return (version || "").toLowerCase() === "unreleased";
}

export default {
  name: "SpireChangelog",
  components: {
    EqWindow,
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
      packageVersion: "",
      releaseRepository: "",
      releaseRepositorySource: "",
      releaseRepositoryOverride: "",
      writable: false,
      source: "",
      isDirty: false,
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
      return `${this.topRelease.version} (${this.topRelease.releaseDate || "no date"})`;
    },
    previewHtml() {
      return renderChangelogMarkdown(this.content);
    },
    sourceBadgeClass() {
      return this.source === "live" ? "badge badge-success mr-2 mb-2" : "badge badge-secondary mr-2 mb-2";
    },
    writableBadgeClass() {
      return this.writable ? "badge badge-success mr-2 mb-2" : "badge badge-warning mr-2 mb-2";
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
    validationIssues() {
      const issues = [];
      const text = this.content || "";
      const top = this.topRelease;

      if (!text.trim()) {
        issues.push("CHANGELOG.md cannot be empty.");
        return issues;
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
    this.fetchState();
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  },
  destroyed() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  },
  beforeRouteLeave(to, from, next) {
    if (this.isDirty && !window.confirm("Discard unsaved changelog changes?")) {
      next(false);
      return;
    }
    next();
  },
  methods: {
    async fetchState() {
      this.loading = true;
      this.error = "";
      try {
        const response = await SpireApi.v1().get("spirechangelog");
        this.applyState(response.data.data);
      } catch (e) {
        this.error = e.response?.data?.error || "Failed to load Spire changelog state.";
      } finally {
        this.loading = false;
      }
    },
    applyState(state) {
      this.content = state.content || "";
      this.originalContent = this.content;
      this.packageVersion = state.package_version || "";
      this.releaseRepository = state.release_repository || "";
      this.releaseRepositorySource = state.release_repository_source || "";
      this.releaseRepositoryOverride = state.release_repository_override || "";
      this.writable = !!state.writable;
      this.source = state.source || "";
      this.isDirty = false;
      this.$nextTick(() => {
        decorateChangelogDom(this.$refs.previewRoot);
      });
    },
    markDirty() {
      this.isDirty = this.content !== this.originalContent;
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
      } catch (e) {
        this.error = e.response?.data?.error || "Failed to save CHANGELOG.md.";
      } finally {
        this.saving = false;
      }
    },
    async reloadContent() {
      if (this.isDirty && !window.confirm("Reload CHANGELOG.md and discard unsaved edits?")) {
        return;
      }
      await this.fetchState();
      this.notification = "CHANGELOG.md reloaded.";
    },
    copyContent() {
      Clipboard.copyFromText(this.content);
      Notify.toast("Copied CHANGELOG.md to clipboard.");
    },
    copyPreviewText() {
      Clipboard.copyFromText(this.content);
      Notify.toast("Copied changelog markdown to clipboard.");
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
          editor.focus();
          const pos = heading.indexOf("* ") + 2;
          editor.setSelectionRange(pos, pos);
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
.changelog-status {
  gap: 4px;
}

.changelog-version-badge {
  background: #f5f9ff;
  color: #07182a;
  border: 1px solid rgba(255, 255, 255, .55);
  font-weight: 700;
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

.spire-changelog-preview {
  max-height: 74vh;
  overflow: auto;
  padding-right: 8px;
}

::v-deep .spire-changelog-preview img {
  max-width: 100%;
}
</style>
