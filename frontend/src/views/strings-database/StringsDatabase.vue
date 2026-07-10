<template>
  <div>
    <info-error-banner
      class="mb-3"
      :notification="notification"
      :error="error"
      @dismiss-error="error = ''"
      @dismiss-notification="notification = ''"
    />

    <div class="row">
      <div :class="(isSubEditActive() ? 'col-6' : 'col-12')">

        <eq-window-simple title="Strings Database">
          <div class="row">
            <div :class="(selectedType >= 0 ? 'col-10' : 'col-12') + ' text-center'">
              <b-form-select
                :key="'string-type-' + typeSelectRenderKey"
                :value="selectedType"
                @change="changeSelectedType"
                class="mt-3 form-control"
              >
                <option value="-1">--- Select ---</option>
                <option
                  v-for="(description, index) in DB_STR_TYPES"
                  :key="index"
                  :value="parseInt(index)"
                >
                  {{ index }}) {{ description }} ({{ typeCounts[index] ? commify(typeCounts[index]) : 0 }})
                </option>
              </b-form-select>
            </div>

            <div class="col-2 text-center" v-if="selectedType >= 0">
              <b-button
                @click="createString()"
                class="mt-3"
                size="sm"
                variant="outline-warning"
              >
                <i class="fa fa-plus"></i>
                Create
              </b-button>
            </div>

          </div>

          <div class="row">
            <div
              class="col-12 text-center font-weight-bold mt-3"
              v-if="strings && strings.length > 0 && !loading && !isSubEditActive()"
            >
              Select a row to edit
            </div>

          </div>

          <div class="text-center mt-3" v-if="loading">
            Loading
            <loader-fake-progress class="mt-3"/>
          </div>

        </eq-window-simple>

        <eq-window-simple
          style="height: 80vh; overflow-y: scroll; overflow-x: hidden"
          class="mt-3"
          id="db-strings-list"
          v-if="strings && strings.length > 0 && !loading"
        >

          <div class='eq-window-nested-blue' style="width: 100%;">
            <table
              class="eq-table eq-highlight-rows"
              style="display: table; overflow-x: scroll " v-if="strings && strings.length > 0"
            >
              <thead>
              <tr>
                <th style="width: 100px">Id</th>
                <th>Value</th>
              </tr>
              </thead>
              <tbody>
              <tr
                v-for="(row, index) in strings"
                :key="row.id + '-' + row.type + '-' + index"
                style="border-radius: 10px"
                :class="isStringSelected(row) ? 'pulsate-highlight-white' : ''"
                @click="selectString(row.id, row.type)"
                :id="'string-' + row.id"
              >
                <td>{{ row.id }}</td>
                <td>{{ row.value }}</td>
              </tr>
              </tbody>
            </table>
          </div>

        </eq-window-simple>

      </div>

      <div class="col-6 fade-in" v-if="isSubEditActive()">
        <eq-window-simple :title="creatingString ? 'Create Database String' : 'Edit Database String'">

          <div class="mt-3">
            ID
            <b-input
              :value="selectedStringObject.id"
              id="selected_id"
              disabled
            />
          </div>

          <div class="mt-3">
            Value
            <b-form-textarea
              v-model="selectedStringObject.value"
              placeholder="Enter something..."
              rows="5"
              max-rows="20"
              id="selected_value"
              @keydown="updateSelectedString('value')"
            />
          </div>

          <b-button
            @click="saveSelectedString()"
            size="sm"
            class="mt-3"
            variant="outline-warning"
          >
            <i class="fa fa-save"></i>
            {{ creatingString ? 'Create' : 'Save' }}
          </b-button>

          <b-button
            v-if="!creatingString"
            @click="deleteSelectedString"
            size="sm"
            class="mt-3 ml-3"
            variant="outline-danger"
          >
            <i class="fa fa-trash"></i>
            Delete
          </b-button>

          <b-button
            v-else
            @click="cancelCreate"
            size="sm"
            class="mt-3 ml-3"
            variant="outline-secondary"
          >
            <i class="fa fa-times"></i>
            Cancel
          </b-button>

        </eq-window-simple>

        <eq-window-simple
          :title="'String Preview Type (' + selectedStringObject.type + ') ID (' + selectedStringObject.id + ')'"
        >
          <div
            class="string-preview"
            v-text="formatStringPreview(selectedStringObject.value)"
          ></div>
        </eq-window-simple>
      </div>


    </div>

  </div>
</template>

<script>
import EqWindowSimple      from "../../components/eq-ui/EQWindowSimple";
import EqAutoTable         from "../../components/eq-ui/EQAutoTable";
import ContentArea         from "../../components/layout/ContentArea";
import {DbStrApi}         from "../../app/api";
import {SpireApi}         from "../../app/api/spire-api";
import LoaderFakeProgress from "../../components/LoaderFakeProgress";
import {ROUTE}             from "../../routes";
import {DB_STR_TYPES}      from "../../app/constants/eq-db-str-constants";
import {EditFormFieldUtil} from "../../app/forms/edit-form-field-util";
import util                from "util";
import {SpireQueryBuilder} from "../../app/api/spire-query-builder";
import InfoErrorBanner     from "../../components/InfoErrorBanner";

// api response cache of all strings
// this does not need to be reactive so don't put in data()
let allStrings       = []
const DbStrApiClient = (new DbStrApi(...SpireApi.cfg()))

export default {
  name: "StringsDatabase",
  components: {
    InfoErrorBanner,
    LoaderFakeProgress: LoaderFakeProgress,
    ContentArea,
    EqAutoTable,
    EqWindowSimple
  },
  data() {
    return {
      strings: [], // strings to be viewed
      typeCounts: {}, // stores the counts per type (select)

      selectedType: -1, // selected state
      typeSelectRenderKey: 0,

      // for the sub selector pane on the right
      subSelectedId: -1,
      subSelectedType: -1,

      error: "",
      notification: "",

      originalSelectedStringObject: {},
      selectedStringObject: {},
      creatingString: false,

      lastSelectedTime: Date.now(),

      loading: false, // are we loading or not

      DB_STR_TYPES: DB_STR_TYPES
    }
  },

  watch: {
    '$route'() {
      this.init()
    },
  },

  methods: {

    /**
     * Resets
     */
    reset() {
      this.selectedType                 = -1
      this.subSelectedId                = -1
      this.subSelectedType              = -1
      this.originalSelectedStringObject = {}
      this.selectedStringObject         = {}
      this.creatingString               = false
    },
    resetSelections() {
      this.subSelectedId                = -1
      this.subSelectedType              = -1
      this.originalSelectedStringObject = {}
      this.selectedStringObject         = {}
      this.creatingString               = false
      EditFormFieldUtil.resetFieldEditedStatus()
    },

    /**
     * State
     */
    updateQueryState: function () {
      let queryState = {};

      if (this.selectedType !== -1) {
        queryState.type = this.selectedType
      }
      if (this.subSelectedId !== -1) {
        queryState.selectedId = this.subSelectedId
      }

      this.$router.push(
        {
          path: ROUTE.STRINGS_DATABASE,
          query: queryState
        }
      ).catch(() => {
      })
    },

    loadQueryState() {
      const routeType       = this.parseRouteInteger(this.$route.query.type)
      const routeSelectedId = this.parseRouteInteger(this.$route.query.selectedId)

      this.error           = ""
      this.selectedType    = -1
      this.subSelectedId   = -1
      this.subSelectedType = -1

      if (typeof this.$route.query.type !== 'undefined') {
        if (!this.isValidStringType(routeType)) {
          this.error = `Unknown string type: ${this.$route.query.type}`
          return
        }

        this.selectedType    = routeType
        this.subSelectedType = routeType
      }

      if (typeof this.$route.query.selectedId !== 'undefined') {
        if (!this.isValidStringType(this.selectedType)) {
          this.error = "A valid string type is required to select a string"
          return
        }
        if (routeSelectedId === null || routeSelectedId < 0) {
          this.error = `Invalid string ID: ${this.$route.query.selectedId}`
          return
        }

        this.subSelectedId = routeSelectedId
      }
    },

    /**
     * Helpers
     */
    listData() {
      this.loading = true
      let strings  = []
      allStrings.forEach((string) => {
        if (string.type === parseInt(this.selectedType)) {
          strings.push(string)
        }
      });

      this.strings = strings
      this.loading = false
    },
    commify(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    formatStringPreview(contents) {
      return contents ? contents.replace(/<br\s*\/?\s*>/gi, "\n") : ""
    },

    parseRouteInteger(value) {
      if (Array.isArray(value) || (typeof value !== 'string' && typeof value !== 'number')) {
        return null
      }
      if (!/^\d+$/.test(String(value))) {
        return null
      }
      const parsed = Number(value)
      return Number.isSafeInteger(parsed) ? parsed : null
    },
    isValidStringType(type) {
      return Number.isInteger(type) && Object.prototype.hasOwnProperty.call(DB_STR_TYPES, String(type))
    },
    changeSelectedType(value) {
      const nextType = parseInt(value)
      if (nextType === this.selectedType) {
        return
      }
      if (!this.confirmDiscardChanges()) {
        this.typeSelectRenderKey++
        return
      }

      this.resetSelections()
      this.error        = ""
      this.notification = ""
      this.selectedType = nextType
      this.updateQueryState()
    },

    createString() {
      if (!this.isValidStringType(this.selectedType)) {
        this.error = "Please select a valid type first"
        return
      }
      if (!this.confirmDiscardChanges()) {
        return
      }

      // filter list by type
      let r = allStrings.filter((s) => s.type === parseInt(this.selectedType))
        .sort((a, b) => a.id - b.id)

      // grab last id + 1 from list (handle empty list)
      const newId = r.length > 0 ? r[r.length - 1].id + 1 : 1

      this.error                        = ""
      this.notification                 = ""
      this.creatingString               = true
      this.subSelectedId                = newId
      this.subSelectedType              = parseInt(this.selectedType)
      this.originalSelectedStringObject = {}
      this.selectedStringObject         = {
        id: newId,
        type: parseInt(this.selectedType),
        value: ""
      }
      EditFormFieldUtil.resetFieldEditedStatus()
    },
    cancelCreate() {
      if (!this.confirmDiscardChanges()) {
        return
      }
      this.resetSelections()
      this.updateQueryState()
    },

    async deleteSelectedString() {
      if (confirm("Are you sure you want to delete this string?")) {
        try {
          const response = await DbStrApiClient.deleteDbStr(
            {
              id: parseInt(this.subSelectedId)
            },
            {
              query: (new SpireQueryBuilder())
                .where("type", "=", this.selectedType)
                .get()
            }
          )

          // success
          if (response.status === 200 && response.data) {

            // Remove deleted item from cache immediately
            allStrings = allStrings.filter(s => !(s.id === parseInt(this.subSelectedId) && s.type === parseInt(this.subSelectedType)))

            // get last element in current list and select it after deletion
            let r = allStrings.filter((s) => s.type === parseInt(this.subSelectedType))
              .sort((a, b) => a.id - b.id)

            const nextString = r.length > 0 ? r[r.length - 1] : null
            const deletedType = parseInt(this.subSelectedType)
            this.resetSelections()
            this.selectedType = deletedType
            this.calculateStringTypeCounts(allStrings)
            this.listData()
            this.notification = "Deleted successfully"

            if (nextString) {
              this.applySelectedString(nextString.id, nextString.type)
            }
            this.updateQueryState()
          }
        } catch (err) {
          this.error = this.getApiError(err, "Unable to delete the string")
        }
      }
    },

    async updateSelectedString(field) {
      EditFormFieldUtil.setFieldModifiedById("selected_" + field)
    },
    async saveSelectedString() {
      try {
        const savedId   = parseInt(this.selectedStringObject.id)
        const savedType = parseInt(this.selectedStringObject.type)
        let response

        if (this.creatingString) {
          response = await DbStrApiClient.createDbStr({
            dbStr: this.selectedStringObject
          })
        } else {
          response = await DbStrApiClient.updateDbStr(
            {
              id: parseInt(this.originalSelectedStringObject.id),
              dbStr: this.selectedStringObject
            },
            {
              query: (new SpireQueryBuilder())
                .where("type", "=", this.selectedType)
                .get()
            }
          )
        }

        // success
        if (response.status === 200 && response.data) {
          EditFormFieldUtil.resetFieldEditedStatus()
          this.creatingString = false
          await this.refreshType(savedType)
          this.applySelectedString(savedId, savedType)
          this.updateQueryState()
          this.notification = "Saved successfully"
        }

      } catch (err) {
        this.error = this.getApiError(err, "Unable to save the string")
      }
    },

    /**
     * Sub editor selection
     */
    isSubEditActive() {
      return this.subSelectedId >= 0 && this.subSelectedType >= 0 && Object.keys(this.selectedStringObject).length > 0
    },
    getSelectedStringObject() {
      let r = allStrings.find((s) => s.type === this.subSelectedType && s.id === this.subSelectedId)

      return typeof r === 'undefined' ? {} : r
    },

    selectString(stringId, typeId) {
      if (stringId === this.subSelectedId && typeId === this.subSelectedType) {
        return true
      }
      if (!this.confirmDiscardChanges()) {
        return false
      }
      if (!allStrings.some((string) => string.id === stringId && string.type === typeId)) {
        this.error = `String ID ${stringId} was not found for type ${typeId}`
        return false
      }

      this.applySelectedString(stringId, typeId)
      this.updateQueryState()
      return true
    },
    applySelectedString(stringId, typeId) {
      this.lastSelectedTime             = Date.now()
      this.subSelectedId                = stringId
      this.subSelectedType              = typeId
      this.originalSelectedStringObject = JSON.parse(JSON.stringify(this.getSelectedStringObject()))
      this.selectedStringObject         = JSON.parse(JSON.stringify(this.getSelectedStringObject()))
      this.creatingString               = false
      EditFormFieldUtil.resetFieldEditedStatus()
    },

    hasUnsavedChanges() {
      return this.creatingString || (this.selectedStringObject && this.originalSelectedStringObject &&
        JSON.stringify(this.selectedStringObject) !== JSON.stringify(this.originalSelectedStringObject)
      )
    },
    confirmDiscardChanges() {
      return !this.hasUnsavedChanges() || window.confirm("Discard unsaved string changes?")
    },
    warnUnsavedChanges(e) {
      if (this.hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = ''
      }
    },
    getApiError(err, fallback) {
      return err && err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : fallback
    },
    isStringSelected(string) {
      return string.id === this.subSelectedId && string.type === this.subSelectedType
    },

    /**
     * Initialize
     */
    async init(reset = false) {
      this.loadQueryState()
      if (!allStrings || allStrings.length === 0 || reset) {
        if (reset && this.selectedType >= 0 && Array.isArray(allStrings)) {
          // On refresh after edit/delete, only reload the current type for efficiency
          const typeStrings = await this.getAllDbStrings(this.selectedType)
          // Replace only this type's entries in the cache
          allStrings = allStrings || []
          allStrings = allStrings.filter(s => s.type !== parseInt(this.selectedType)).concat(typeStrings)
        } else {
          allStrings = await this.getAllDbStrings()
        }
      }
      this.calculateStringTypeCounts(allStrings)
      const selectedString = this.getSelectedStringObject()
      if (this.subSelectedId >= 0 && Object.keys(selectedString).length === 0) {
        this.error = `String ID ${this.subSelectedId} was not found for type ${this.subSelectedType}`
        this.subSelectedId                = -1
        this.subSelectedType              = -1
        this.originalSelectedStringObject = {}
        this.selectedStringObject         = {}
      } else {
        this.originalSelectedStringObject = JSON.parse(JSON.stringify(selectedString))
        this.selectedStringObject         = JSON.parse(JSON.stringify(selectedString))
      }
      this.creatingString = false
      this.listData()
      this.scrollToHighlighted()
    },

    async refreshType(type) {
      const typeStrings = await this.getAllDbStrings(type)
      allStrings        = allStrings.filter((string) => string.type !== parseInt(type)).concat(typeStrings)
      this.calculateStringTypeCounts(allStrings)
      this.listData()
    },

    async getAllDbStrings(typeFilter) {
      this.loading = true
      try {
        const builder = (new SpireQueryBuilder()).limit(100000)
        // Filter server-side when a specific type is requested (e.g. after create/delete/save)
        if (typeof typeFilter !== 'undefined' && typeFilter >= 0) {
          builder.where("type", "=", typeFilter)
        }
        const response = await DbStrApiClient.listDbStrs(builder.get())
        if (response.status === 200 && response.data) {
          return response.data
        }
        return []
      } catch (error) {
        console.error("Error loading strings:", error)
        return []
      } finally {
        this.loading = false
      }
    },

    calculateStringTypeCounts(allStrings) {
      let typeStringCount = {}
      allStrings.forEach((string) => {
        if (typeof typeStringCount[string.type] === "undefined") {
          typeStringCount[string.type] = 0
        }
        typeStringCount[string.type]++
      })

      this.typeCounts = typeStringCount
    },

    scrollToHighlighted() {
      if (Date.now() < (this.lastSelectedTime + 1000)) {
        return true
      }

      setTimeout(() => {
        const container = document.getElementById("db-strings-list");
        const target    = document.getElementById(util.format("string-%s", this.subSelectedId))

        if (container && target) {
          console.log("[StringsDatabase] target top [%s]", target.getBoundingClientRect().top)
          container.scrollTop = container.scrollTop + target.getBoundingClientRect().top - 200;
        } else if (container && this.selectedType === 0) {
          container.scrollTop = 0
        }
      }, 100)
    }

  },
  async mounted() {
    await this.init()
    window.addEventListener('beforeunload', this.warnUnsavedChanges)
  },
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.warnUnsavedChanges)
  },
  beforeRouteUpdate(to, from, next) {
    if (!this.confirmDiscardChanges()) {
      next(false)
      return
    }
    next()
  },
  beforeRouteLeave(to, from, next) {
    if (!this.confirmDiscardChanges()) {
      next(false)
      return
    }
    next()
  },
}
</script>

<style scoped>
.string-preview {
  min-height: 28px;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
