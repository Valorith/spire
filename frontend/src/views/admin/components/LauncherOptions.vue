<template>
  <div>


    <table
      class="eq-table bordered mb-0"
    >
      <thead class="eq-table-floating-header">
      <tr>
        <td class="font-weight-bold p-3">Options</td>
      </tr>
      </thead>

      <tbody>
      <tr>
        <td>
          <eq-checkbox
            :fade-when-not-true="true"
            class="d-inline-block mr-3"
            :true-value="true"
            :false-value="false"
            v-model="launcher.updateOpcodesOnStart"
            @change="saveLauncherOptions()"
          />
          Update Server Patches (Opcodes) On Start
        </td>
      </tr>
      <tr>
        <td>
          <button
            type="button"
            class="opcode-repository-toggle"
            :aria-label="`Opcode Update Repository (${opcodeRepositorySummary})`"
            :aria-expanded="showOpcodeRepository ? 'true' : 'false'"
            @click="showOpcodeRepository = !showOpcodeRepository"
          >
            <i class="fa fa-code-fork opcode-repository-icon" aria-hidden="true"></i>
            <span class="opcode-repository-label">Opcode Update Repository</span>
            <span class="opcode-repository-summary">({{ opcodeRepositorySummary }})</span>
            <i
              class="fa opcode-repository-chevron"
              :class="showOpcodeRepository ? 'fa-chevron-down' : 'fa-chevron-right'"
            ></i>
          </button>
          <div v-show="showOpcodeRepository" class="pt-2">
            <p class="text-muted mb-2">
              Leave blank to use the upstream EQEmu/Server repository. Paste a GitHub Server repository URL and Spire
              will find its `utils/patches` directory. To use a branch or tag, paste its `/tree/&lt;ref&gt;` URL.
            </p>
            <input
              v-model.trim="opcodeSource"
              type="url"
              class="form-control"
              :class="{
                'is-valid': opcodeSourceValidationState === true,
                'is-invalid': opcodeSourceValidationState === false
              }"
              @change="saveLauncherOptions()"
              placeholder="https://github.com/Valorith/Server"
            >
            <b-form-invalid-feedback :state="opcodeSourceValidationState">
              {{ opcodeSourceValidationMessage }}
            </b-form-invalid-feedback>
            <b-form-valid-feedback :state="opcodeSourceValidationState">
              Repository saved. Spire will load its server patches automatically.
            </b-form-valid-feedback>
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <eq-checkbox
            :fade-when-not-true="true"
            class="d-inline-block mr-3"
            :true-value="true"
            :false-value="false"
            v-model="launcher.runSharedMemory"
            @change="saveLauncherOptions()"
          />
          Run Shared Memory (Recommended)
        </td>
      </tr>
      <tr>
        <td>
          <eq-checkbox
            :fade-when-not-true="true"
            class="d-inline-block mr-3"
            :true-value="true"
            :false-value="false"
            v-model="launcher.runUcs"
            @change="saveLauncherOptions()"
          />
          Run UCS (Optional)
        </td>
      </tr>
      <tr>
        <td>
          <eq-checkbox
            :fade-when-not-true="true"
            class="d-inline-block mr-3"
            :true-value="true"
            :false-value="false"
            v-model="launcher.runLoginserver"
            @change="saveLauncherOptions()"
          />
          Run Loginserver (Optional)
        </td>
      </tr>
      <tr>
        <td>
          <eq-checkbox
            :fade-when-not-true="true"
            class="d-inline-block mr-3"
            :true-value="true"
            :false-value="false"
            v-model="launcher.runQueryServ"
            @change="saveLauncherOptions()"
          />
          Run QueryServ (Optional)
        </td>
      </tr>
      </tbody>
    </table>


    <div class="mb-3 mt-4">
      Static Zones

      <b-form-group class="mt-3">
        <!-- Prop `add-on-change` is needed to enable adding tags vie the `change` event -->
        <b-form-tags
          id="tags-component-select"
          v-model="staticZones"
          size="lg"
          tag-pills
          variant="success"
          class="mb-2"
          add-on-change
          no-outer-focus
        >
          <template v-slot="{ tags, inputAttrs, inputHandlers, disabled, removeTag }">
            <ul v-if="tags.length > 0" class="list-inline d-inline-block mb-2">
              <li v-for="tag in tags" :key="tag" class="list-inline-item">
                <b-form-tag
                  @remove="removeTag(tag); saveLauncherOptions()"
                  :title="tag"
                  :disabled="disabled"
                  variant="success"
                >{{ tag }}
                </b-form-tag>
              </li>
            </ul>
            <b-form-select
              v-bind="inputAttrs"
              v-on="inputHandlers"
              @change="saveLauncherOptions()"
              :disabled="disabled || availableOptions.length === 0"
              :options="availableOptions"
              class="mr-3"
            >
              <template
                #first
              >
                <!-- This is required to prevent bugs with Safari -->
                <option disabled value="">Choose a zone...</option>
              </template>
            </b-form-select>
          </template>
        </b-form-tags>
      </b-form-group>


      <div class="mt-3">
        <div>
          Min Zone Processes (Ready)
        </div>

        <div>
          <p class="text-muted">
            This is the number of zones that Spire will attempt to keep running <b>without</b> players. For example: if
            you have 10 zones with players in it and your minZoneProcesses is set to 10, you will have 20 total zones
            booted.
          </p>
        </div>
        <b-form-input
          type="number"
          v-model.number="launcher.minZoneProcesses"
          @change="saveLauncherOptions()"
        />
      </div>

      <div class="mt-3">
        <div>
          Days to keep log files (7 days default)
        </div>

        <div>
          <p class="text-muted">
            Files older than this will be deleted periodically. Set to -1 to disable.
          </p>
        </div>
        <b-form-input
          type="number"
          v-model.number="launcher.deleteLogFilesOlderThanDays"
          @change="saveLauncherOptions()"
        />
      </div>

    </div>
  </div>
</template>

<script>
import {Zones}    from "@/app/zones";
import {SpireApi} from "@/app/api/spire-api";
import EqCheckbox from "@/components/eq-ui/EQCheckbox.vue";

export default {
  name: 'LauncherOptions',
  components: { EqCheckbox },
  props: ['launcherConfig'],
  data() {
    return {
      launcher: {
        runSharedMemory: false,
        runLoginserver: false,
        runQueryServ: false,
        runUcs: true,
        updateOpcodesOnStart: true,
        opcodeSource: "",
        staticZones: ""
      },

      staticZones: [],
      availableZoneOptions: [],
      showOpcodeRepository: false,
      opcodeSource: "",
      opcodeSourceValidationState: null,
      opcodeSourceValidationMessage: ""
    }
  },
  async created() {
    // Preserve the declared defaults so Vue 2 observes every launcher field,
    // even when the parent initially passes an empty config before its API load.
    this.launcher = Object.assign({}, this.launcher, this.launcherConfig || {})

    if (this.launcher.staticZones && this.launcher.staticZones.length > 0) {
      this.staticZones = this.launcher.staticZones.split(",")
    }

    if (typeof this.launcher.updateOpcodesOnStart === 'undefined') {
      this.launcher.updateOpcodesOnStart = true
    }

    if (typeof this.launcher.opcodeSource === 'undefined') {
      this.launcher.opcodeSource = ""
    }
    this.opcodeSource = this.launcher.opcodeSource

    if (typeof this.launcher.deleteLogFilesOlderThanDays !== 'undefined' && this.launcher.deleteLogFilesOlderThanDays === 0) {
      this.launcher.deleteLogFilesOlderThanDays = 7
    }

    if (typeof this.launcher.runUcs === 'undefined') {
      this.launcher.runUcs = true
    }

    // zone options
    let options = []
    const zones = await Zones.getZones()
    for (let z of zones) {
      options.push(z.short_name)
    }
    this.availableZoneOptions = options
  },
  watch: {
    launcherConfig: function (newValue) {
      this.launcher = Object.assign({}, this.launcher, newValue || {})
      this.opcodeSource = this.launcher.opcodeSource || ""
    },
    opcodeSource: function () {
      this.clearOpcodeSourceValidation()
    }
  },
  computed: {
    availableOptions() {
      return this.availableZoneOptions.filter(opt => this.staticZones.indexOf(opt) === -1)
    },
    opcodeRepositorySummary() {
      const source = (this.opcodeSource || "").trim()
      if (!source) {
        return "EQEmu/Server"
      }

      try {
        const parsed = new URL(source)
        const host = parsed.hostname.toLowerCase()
        const parts = parsed.pathname.split("/").filter(Boolean)
        const isGitHubRepository = host === "github.com" ||
          host === "www.github.com" ||
          host === "raw.githubusercontent.com"
        if (isGitHubRepository && parts.length >= 2) {
          const owner = decodeURIComponent(parts[0])
          const repository = decodeURIComponent(parts[1]).replace(/\.git$/i, "")
          return `${owner}/${repository}`
        }

        return parsed.hostname || "Custom source"
      } catch (e) {
        return "Custom source"
      }
    }
  },
  methods: {
    clearOpcodeSourceValidation() {
      this.opcodeSourceValidationState = null
      this.opcodeSourceValidationMessage = ""
    },
    saveLauncherOptions() {
      setTimeout(async () => {
        if (this.staticZones && this.staticZones.length > 0) {
          this.launcher.staticZones = this.staticZones.join(",")
        }

        this.opcodeSource = (this.opcodeSource || "").trim()
        this.launcher.opcodeSource = this.opcodeSource

        try {
          await SpireApi.v1().post('admin/launcherconfig', this.launcher)
          this.opcodeSourceValidationState = this.opcodeSource ? true : null
          this.opcodeSourceValidationMessage = ""
        } catch (e) {
          if (e && e.response && e.response.status === 400) {
            this.showOpcodeRepository = true
            this.opcodeSourceValidationState = false
            this.opcodeSourceValidationMessage = (e.response.data && e.response.data.error) ||
              "Enter a valid GitHub Server repository URL."
          }
          console.log(e)
        }

      }, 100)
    }
  }
}
</script>

<style scoped>

.opcode-repository-toggle {
  align-items: center;
  background: transparent !important;
  background-image: none !important;
  border: 0 !important;
  border-radius: 3px;
  box-shadow: none !important;
  color: inherit;
  cursor: pointer;
  display: flex;
  margin: -3px -5px;
  min-height: 0;
  opacity: 0.78;
  padding: 3px 5px !important;
  text-align: left;
  transition: background-color 120ms ease, opacity 120ms ease;
  width: 100%;
}

.opcode-repository-toggle:hover {
  background: rgba(255, 255, 255, 0.035) !important;
  opacity: 1;
}

.opcode-repository-toggle:focus {
  outline: none;
}

.opcode-repository-toggle:focus-visible {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18) !important;
  opacity: 1;
}

.opcode-repository-icon {
  font-size: 10px;
  margin-right: 7px;
  opacity: 0.42;
  width: 11px;
}

.opcode-repository-label {
  opacity: 0.88;
  white-space: nowrap;
}

.opcode-repository-summary {
  flex: 0 0 auto;
  font-size: 9px;
  margin-left: auto;
  opacity: 0.62;
  padding-left: 12px;
  white-space: nowrap;
}

.opcode-repository-chevron {
  font-size: 9px;
  margin-left: 7px;
  opacity: 0.4;
  width: 8px;
}

</style>
