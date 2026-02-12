<template>
  <div>
    <div class="row">
      <div :class="(isSubEditActive() ? 'col-6' : 'col-12')">

        <eq-window-simple title="Strings Database">
          <div class="row">
            <div :class="(selectedType >= 0 ? 'col-10' : 'col-12') + ' text-center'">
              <b-form-select
                v-model.number="selectedType"
                @change="resetSelections(); updateQueryState()"
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
        <eq-window-simple title="Edit Database String">

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
            Save
          </b-button>

          <b-button
            @click="deleteSelectedString()"
            size="sm"
            class="mt-3 ml-3"
            variant="outline-danger"
          >
            <i class="fa fa-trash"></i>
            Delete
          </b-button>

          <!-- Notification / Error -->
          <info-error-banner
            class="mt-3"
            :notification="notification"
            :error="error"
            @dismiss-error="error = ''"
            @dismiss-notification="notification = ''"
          />

        </eq-window-simple>

        <eq-window-simple
          :title="'String Preview Type (' + selectedStringObject.type + ') ID (' + selectedStringObject.id + ')'"
          v-if="selectedStringObject.type"
        >
          <v-runtime-template
            v-if="getSelectedStringObject()"
            :template="'<div>' + formatStringPreview(selectedStringObject.value) + '</div>'"
          />
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
    EqWindowSimple,
    "v-runtime-template": () => import("v-runtime-template")
  },
  data() {
    return {
      strings: [], // strings to be viewed
      typeCounts: {}, // stores the counts per type (select)

      selectedType: -1, // selected state

      // for the sub selector pane on the right
      subSelectedId: -1,
      subSelectedType: -1,

      error: "",
      notification: "",

      originalSelectedStringObject: {},
      selectedStringObject: {},

      lastSelectedTime: Date.now(),

      loading: false, // are we loading or not

      DB_STR_TYPES: DB_STR_TYPES
    }
  },

  watch: {
    '$route'() {
      console.log("route trigger")
      this.init(true)
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
    },
    resetSelections() {
      this.subSelectedId   = -1;
      this.subSelectedType = -1;
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
      console.log("loading query state")
      if (this.$route.query.type >= 0) {
        this.selectedType    = parseInt(this.$route.query.type);
        this.subSelectedType = parseInt(this.$route.query.type);
      }
      if (this.$route.query.selectedId >= 0) {
        this.subSelectedId = parseInt(this.$route.query.selectedId);
        console.log("selected object", this.selectedStringObject)

      }

      console.log("selected type", this.selectedType)
      console.log("sub selected type", this.subSelectedType)
      console.log("sub selected id", this.subSelectedId)

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
    replaceAll(str, find, replace) {
      return str.replace(new RegExp(find, 'g'), replace);
    },
    formatStringPreview(contents) {
      if (contents) {
        return this.replaceAll(contents, "<BR>", "<BR/>")
      }
      return ""
    },

    async createString() {
      console.log("create")

      if (isNaN(parseInt(this.subSelectedType)) || parseInt(this.subSelectedType) < 0) {
        this.error = "Please select a valid type first"
        return
      }

      // filter list by type
      let r = allStrings.filter((s) => s.type === parseInt(this.subSelectedType))
        .sort((a, b) => a.id - b.id)

      // grab last id + 1 from list (handle empty list)
      const newId = r.length > 0 ? r[r.length - 1].id + 1 : 1

      // create
      try {
        const response = await DbStrApiClient.createDbStr(
          {
            dbStr: {
              id: newId,
              type: parseInt(this.subSelectedType),
              value: ""
            }
          }
        )

        // success
        if (response.status === 200 && response.data) {
          this.resetSelections()
          this.updateQueryState()
          this.selectString(newId, this.subSelectedType)
          this.init(true)
        }
      } catch (err) {
        if (err.response !== 200 && err.response.data.error) {
          this.error = err.response.data.error
        }
      }
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

            let lastElement = {}

            // grab last element and select
            if (r && r.length > 0) {
              lastElement = r[r.length - 1]
              // if we deleted the last element, let's fallback to next in line...
              if (parseInt(lastElement.id) === parseInt(this.subSelectedId)) {
                if (r[r.length - 2]) {
                  lastElement = r[r.length - 2]
                }
              }
            }

            this.resetSelections()
            this.updateQueryState()

            this.notification = "Deleted successfully"

            if (lastElement) {
              this.selectString(lastElement.id, this.subSelectedType)
            }

            this.init(true)
          }
        } catch (err) {
          if (err.response !== 200 && err.response.data.error) {
            this.error = err.response.data.error
          }
        }
      }
    },

    async updateSelectedString(field) {
      EditFormFieldUtil.setFieldModifiedById("selected_" + field)
    },
    async saveSelectedString() {
      try {
        const response = await DbStrApiClient.updateDbStr(
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

        // success
        if (response.status === 200 && response.data) {
          EditFormFieldUtil.resetFieldEditedStatus()

          this.updateQueryState()
          await this.init(true)
          this.notification = "Saved successfully!"
        }

      } catch (err) {
        if (err.response !== 200 && err.response.data.error) {
          this.error = err.response.data.error
        }
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
      this.lastSelectedTime             = Date.now()
      this.subSelectedId                = stringId
      this.subSelectedType              = typeId
      this.originalSelectedStringObject = JSON.parse(JSON.stringify(this.getSelectedStringObject()))
      this.selectedStringObject         = JSON.parse(JSON.stringify(this.getSelectedStringObject()))
      this.updateQueryState()
    },

    hasUnsavedChanges() {
      return this.selectedStringObject && this.originalSelectedStringObject &&
        JSON.stringify(this.selectedStringObject) !== JSON.stringify(this.originalSelectedStringObject)
    },
    warnUnsavedChanges(e) {
      if (this.hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = ''
      }
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
        if (reset && this.selectedType >= 0) {
          // On refresh after edit/delete, only reload the current type for efficiency
          const typeStrings = await this.getAllDbStrings(this.selectedType)
          // Replace only this type's entries in the cache
          allStrings = allStrings.filter(s => s.type !== parseInt(this.selectedType)).concat(typeStrings)
        } else {
          allStrings = await this.getAllDbStrings()
        }
      }
      this.calculateStringTypeCounts(allStrings)
      this.originalSelectedStringObject = JSON.parse(JSON.stringify(this.getSelectedStringObject()))
      this.selectedStringObject         = this.getSelectedStringObject()
      this.listData()
      this.scrollToHighlighted()
    },

    async getAllDbStrings(typeFilter) {
      this.loading   = true
      const builder = (new SpireQueryBuilder()).limit(100000)
      // Filter server-side when a specific type is requested (e.g. after create/delete/save)
      if (typeof typeFilter !== 'undefined' && typeFilter >= 0) {
        builder.where("type", "=", typeFilter)
      }
      const response = await DbStrApiClient.listDbStrs(builder.get())
      if (response.status === 200 && response.data) {
        this.loading = false
        return response.data
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
}
</script>

<style scoped>

</style>
