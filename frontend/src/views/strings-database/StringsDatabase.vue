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
      <div :class="isSubEditActive() ? 'col-6' : 'col-12'">
        <eq-window-simple title="Strings Database">
          <div class="row">
            <div :class="(selectedType >= 0 ? 'col-10' : 'col-12') + ' text-center'">
              <b-form-select
                :key="'string-type-' + typeSelectRenderKey"
                :value="selectedType"
                class="mt-3 form-control"
                aria-label="String type"
                :disabled="creatingSuggestion"
                @change="changeSelectedType"
              >
                <option value="-1">--- Select ---</option>
                <option
                  v-for="(description, index) in DB_STR_TYPES"
                  :key="index"
                  :value="parseInt(index)"
                >
                  {{ index }}) {{ description }}
                </option>
              </b-form-select>
            </div>

            <div v-if="selectedType >= 0" class="col-2 text-center">
              <b-button
                class="mt-3"
                size="sm"
                variant="outline-warning"
                :disabled="creatingSuggestion"
                @click="createString"
              >
                <i class="fa fa-plus"></i>
                {{ creatingSuggestion ? 'Preparing' : 'Create' }}
              </b-button>
            </div>
          </div>

          <div v-if="isValidStringType(selectedType)" class="row mt-3">
            <div class="col-12">
              <label class="sr-only" for="db-string-search">Search strings</label>
              <div class="string-search-controls">
                <b-form-input
                  id="db-string-search"
                  v-model="searchTerm"
                  class="string-search-input"
                  placeholder="Search this type by exact ID or text"
                  autocomplete="off"
                  @keyup.enter="applySearch"
                />
                <div class="string-search-actions">
                  <b-button
                    id="db-string-search-submit"
                    variant="outline-warning"
                    :disabled="loading"
                    @click="applySearch"
                  >
                    <i class="fa fa-search"></i>
                    Search
                  </b-button>
                  <b-button
                    id="db-string-search-clear"
                    variant="outline-secondary"
                    :disabled="loading || (!searchTerm && !appliedSearch)"
                    @click="clearSearch"
                  >
                    Clear
                  </b-button>
                </div>
              </div>

              <div v-if="!loading" class="search-summary mt-2">
                <span v-if="totalMatches > 0">
                  Showing {{ commify(showingStart) }}-{{ commify(showingEnd) }} of
                  {{ commify(totalMatches) }} strings
                  <span v-if="appliedSearch">matching &quot;{{ appliedSearch }}&quot;</span>
                </span>
                <span v-else-if="appliedSearch">No strings match &quot;{{ appliedSearch }}&quot;</span>
                <span v-else>No strings exist for this type</span>
              </div>
            </div>
          </div>

          <div v-if="strings.length > 0 && !loading && !isSubEditActive()" class="row">
            <div class="col-12 text-center font-weight-bold mt-3">
              Select a row to edit
            </div>
          </div>

          <div v-if="loading" class="text-center mt-3">
            Loading
            <loader-fake-progress class="mt-3"/>
          </div>
        </eq-window-simple>

        <eq-window-simple
          v-if="isValidStringType(selectedType) && !loading"
          id="db-strings-list"
          class="mt-3 strings-list-window"
        >
          <div v-if="strings.length > 0" class="eq-window-nested-blue" style="width: 100%;">
            <table class="eq-table eq-highlight-rows strings-table">
              <thead>
              <tr>
                <th style="width: 100px">Id</th>
                <th>Value</th>
              </tr>
              </thead>
              <tbody>
              <tr
                v-for="(row, index) in strings"
                :id="'string-' + row.id"
                :key="row.id + '-' + row.type + '-' + index"
                :class="isStringSelected(row) ? 'pulsate-highlight-white' : ''"
                style="border-radius: 10px"
                @click="selectString(row)"
              >
                <td>{{ row.id }}</td>
                <td>{{ row.value }}</td>
              </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="text-center text-muted py-4">
            {{ appliedSearch ? 'Try a different ID or phrase.' : 'This string type is empty.' }}
          </div>

          <nav v-if="totalPages > 1" class="strings-pagination mt-3" aria-label="String result pages">
            <b-button
              size="sm"
              variant="outline-warning"
              aria-label="Previous page"
              :disabled="currentPage <= 1"
              @click="changePage(currentPage - 1)"
            >
              <i class="fa fa-chevron-left"></i>
            </b-button>
            <span>Page <strong>{{ currentPage }}</strong> of {{ totalPages }}</span>
            <b-button
              size="sm"
              variant="outline-warning"
              aria-label="Next page"
              :disabled="currentPage >= totalPages"
              @click="changePage(currentPage + 1)"
            >
              <i class="fa fa-chevron-right"></i>
            </b-button>
          </nav>
        </eq-window-simple>
      </div>

      <div v-if="isSubEditActive()" class="col-6 fade-in">
        <eq-window-simple :title="creatingString ? 'Create Database String' : 'Edit Database String'">
          <div class="mt-3">
            ID
            <b-form-input
              v-if="creatingString"
              id="selected_id"
              v-model.number="selectedStringObject.id"
              type="number"
              min="1"
              :max="MAX_STRING_ID"
              step="1"
              autocomplete="off"
              :state="creationIdInputState"
              aria-describedby="creation-id-help creation-id-status"
              @input="onCreationIdInput"
              @blur="checkCreationIdAvailability"
            />
            <b-input
              v-else
              id="selected_id"
              :value="selectedStringObject.id"
              disabled
            />
            <small v-if="creatingString" id="creation-id-help" class="form-text text-muted">
              Suggested from the lowest available ID in this type. You can enter any other unused ID.
            </small>
            <div
              v-if="creatingString && creationIdMessage"
              id="creation-id-status"
              class="creation-id-status"
              :class="creationIdMessageClass"
              aria-live="polite"
            >
              {{ creationIdMessage }}
            </div>
          </div>

          <div class="mt-3">
            Value
            <b-form-textarea
              id="selected_value"
              v-model="selectedStringObject.value"
              placeholder="Enter something..."
              rows="5"
              max-rows="20"
              @keydown="updateSelectedString('value')"
            />
          </div>

          <b-button
            class="mt-3"
            size="sm"
            variant="outline-warning"
            :disabled="saving || (creatingString && !canCreateString)"
            @click="saveSelectedString"
          >
            <i class="fa fa-save"></i>
            {{ saving ? 'Saving' : (creatingString ? 'Create' : 'Save') }}
          </b-button>

          <b-button
            v-if="!creatingString"
            class="mt-3 ml-3"
            size="sm"
            variant="outline-danger"
            :disabled="saving"
            @click="deleteSelectedString"
          >
            <i class="fa fa-trash"></i>
            Delete
          </b-button>

          <b-button
            v-else
            class="mt-3 ml-3"
            size="sm"
            variant="outline-secondary"
            :disabled="saving"
            @click="cancelCreate"
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
  import EqWindowSimple from '../../components/eq-ui/EQWindowSimple'
  import { DbStrApi } from '../../app/api'
  import { SpireApi } from '../../app/api/spire-api'
  import LoaderFakeProgress from '../../components/LoaderFakeProgress'
  import { ROUTE } from '../../routes'
  import { DB_STR_TYPES } from '../../app/constants/eq-db-str-constants'
  import { EditFormFieldUtil } from '../../app/forms/edit-form-field-util'
  import util from 'util'
  import { SpireQueryBuilder } from '../../app/api/spire-query-builder'
  import InfoErrorBanner from '../../components/InfoErrorBanner'

  const DbStrApiClient = new DbStrApi(...SpireApi.cfg())
  const PAGE_SIZE = 50
  const ID_SCAN_PAGE_SIZE = 1000
  const ID_CHECK_DELAY = 350
  const MAX_STRING_ID = 2147483647

  export default {
    name: 'StringsDatabase',
    components: {
      InfoErrorBanner,
      LoaderFakeProgress,
      EqWindowSimple
    },
    data () {
      return {
        strings: [],
        selectedType: -1,
        typeSelectRenderKey: 0,

        searchTerm: '',
        appliedSearch: '',
        currentPage: 1,
        pageSize: PAGE_SIZE,
        totalMatches: 0,

        subSelectedId: -1,
        subSelectedType: -1,
        originalSelectedStringObject: {},
        selectedStringObject: {},
        creatingString: false,
        creatingSuggestion: false,
        saving: false,

        idAvailability: 'idle',
        idCheckTimeout: null,
        idCheckRequestToken: 0,
        listRequestToken: 0,
        createSuggestionRequestToken: 0,
        initRequestToken: 0,

        error: '',
        notification: '',
        loading: false,

        DB_STR_TYPES,
        MAX_STRING_ID
      }
    },

    computed: {
      totalPages () {
        return Math.max(1, Math.ceil(this.totalMatches / this.pageSize))
      },
      showingStart () {
        return this.totalMatches > 0 ? ((this.currentPage - 1) * this.pageSize) + 1 : 0
      },
      showingEnd () {
        return Math.min(this.currentPage * this.pageSize, this.totalMatches)
      },
      parsedCreationId () {
        return this.parseCreationId(this.selectedStringObject.id)
      },
      canCreateString () {
        return this.parsedCreationId !== null && this.idAvailability === 'available'
      },
      creationIdInputState () {
        if (this.parsedCreationId === null) {
          return false
        }
        if (this.idAvailability === 'available') {
          return true
        }
        if (this.idAvailability === 'taken' || this.idAvailability === 'error') {
          return false
        }
        return null
      },
      creationIdMessage () {
        if (this.parsedCreationId === null) {
          return `Use a whole-number ID from 1 to ${this.commify(MAX_STRING_ID)}.`
        }
        if (this.idAvailability === 'checking') {
          return 'Checking whether this ID is available...'
        }
        if (this.idAvailability === 'available') {
          return `ID ${this.parsedCreationId} is available for this type.`
        }
        if (this.idAvailability === 'taken') {
          return `ID ${this.parsedCreationId} already exists for this type. Choose another ID.`
        }
        if (this.idAvailability === 'error') {
          return 'Spire could not verify this ID. Try again before creating the string.'
        }
        return ''
      },
      creationIdMessageClass () {
        if (this.idAvailability === 'available') {
          return 'text-success'
        }
        if (this.idAvailability === 'taken' || this.idAvailability === 'error' || this.parsedCreationId === null) {
          return 'text-danger'
        }
        return 'text-muted'
      }
    },

    watch: {
      async '$route' () {
        const routeType = this.parseRouteInteger(this.$route.query.type)
        const routeId = this.parseRouteInteger(this.$route.query.selectedId)
        const nextType = typeof this.$route.query.type === 'undefined' ? -1 : routeType
        const nextId = typeof this.$route.query.selectedId === 'undefined' ? -1 : routeId

        if (nextType === this.selectedType && nextId === this.subSelectedId) {
          return
        }
        await this.init()
      }
    },

    methods: {
      resetSelections () {
        this.clearIdCheckTimer()
        this.subSelectedId = -1
        this.subSelectedType = -1
        this.originalSelectedStringObject = {}
        this.selectedStringObject = {}
        this.creatingString = false
        this.idAvailability = 'idle'
        EditFormFieldUtil.resetFieldEditedStatus()
      },

      updateQueryState () {
        const queryState = {}
        if (this.selectedType !== -1) {
          queryState.type = this.selectedType
        }
        if (this.subSelectedId !== -1) {
          queryState.selectedId = this.subSelectedId
        }

        this.$router.push({
          path: ROUTE.STRINGS_DATABASE,
          query: queryState
        }).catch(() => {})
      },

      loadQueryState () {
        const routeType = this.parseRouteInteger(this.$route.query.type)
        const routeSelectedId = this.parseRouteInteger(this.$route.query.selectedId)

        this.resetSelections()
        this.error = ''
        this.selectedType = -1
        this.searchTerm = ''
        this.appliedSearch = ''
        this.currentPage = 1

        if (typeof this.$route.query.type !== 'undefined') {
          if (!this.isValidStringType(routeType)) {
            this.error = `Unknown string type: ${this.$route.query.type}`
            return
          }
          this.selectedType = routeType
        }

        if (typeof this.$route.query.selectedId !== 'undefined') {
          if (!this.isValidStringType(this.selectedType)) {
            this.error = 'A valid string type is required to select a string'
            return
          }
          if (routeSelectedId === null || routeSelectedId < 0) {
            this.error = `Invalid string ID: ${this.$route.query.selectedId}`
            return
          }
          this.subSelectedId = routeSelectedId
          this.subSelectedType = this.selectedType
        }
      },

      parseRouteInteger (value) {
        if (Array.isArray(value) || (typeof value !== 'string' && typeof value !== 'number')) {
          return null
        }
        if (!/^\d+$/.test(String(value))) {
          return null
        }
        const parsed = Number(value)
        return Number.isSafeInteger(parsed) ? parsed : null
      },
      parseCreationId (value) {
        if (value === '' || value === null || typeof value === 'undefined' || !/^\d+$/.test(String(value))) {
          return null
        }
        const parsed = Number(value)
        if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_STRING_ID) {
          return null
        }
        return parsed
      },
      isValidStringType (type) {
        return Number.isInteger(type) && Object.prototype.hasOwnProperty.call(DB_STR_TYPES, String(type))
      },
      commify (value) {
        return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      },
      formatStringPreview (contents) {
        return contents ? contents.replace(/<br\s*\/?\s*>/gi, '\n') : ''
      },

      escapeWhereValue (value) {
        return String(value)
          .replace(/\\/g, '\\\\')
          .replace(/\./g, '\\.')
      },

      addStringFilters (builder, search = this.appliedSearch) {
        builder.where('type', '=', this.selectedType)
        const term = String(search || '').trim()
        if (/^\d+$/.test(term)) {
          builder.where('id', '=', Number(term))
        } else if (term) {
          builder.where('value', 'like', this.escapeWhereValue(term))
        }
        return builder
      },

      async loadStrings () {
        if (!this.isValidStringType(this.selectedType)) {
          this.strings = []
          this.totalMatches = 0
          return
        }

        const requestToken = ++this.listRequestToken
        this.loading = true
        try {
          const listBuilder = this.addStringFilters(new SpireQueryBuilder())
            .orderBy(['id'])
            .orderDirection('asc')
            .limit(this.pageSize)
            .page(this.currentPage)
          const countBuilder = this.addStringFilters(new SpireQueryBuilder())

          const [listResponse, countResponse] = await Promise.all([
            DbStrApiClient.listDbStrs(listBuilder.get()),
            DbStrApiClient.getDbStrsCount(countBuilder.get())
          ])

          if (requestToken !== this.listRequestToken) {
            return
          }

          const nextStrings = listResponse.status === 200 && Array.isArray(listResponse.data)
            ? listResponse.data
            : []
          const nextCount = countResponse.status === 200 && countResponse.data
            ? Number(countResponse.data.count || 0)
            : 0

          this.strings = nextStrings
          this.totalMatches = nextCount

          const lastPage = Math.max(1, Math.ceil(nextCount / this.pageSize))
          if (this.currentPage > lastPage) {
            this.currentPage = lastPage
            await this.loadStrings()
          }
        } catch (err) {
          if (requestToken === this.listRequestToken) {
            this.strings = []
            this.totalMatches = 0
            this.error = this.getApiError(err, 'Unable to load database strings')
          }
        } finally {
          if (requestToken === this.listRequestToken) {
            this.loading = false
          }
        }
      },

      async findString (type, id) {
        const builder = new SpireQueryBuilder()
          .where('type', '=', type)
          .where('id', '=', id)
          .limit(1)
        const response = await DbStrApiClient.listDbStrs(builder.get())
        if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
          return response.data[0]
        }
        return null
      },

      async findStringPage (type, id) {
        const builder = new SpireQueryBuilder()
          .where('type', '=', type)
          .where('id', '<=', id)
        const response = await DbStrApiClient.getDbStrsCount(builder.get())
        const position = response.status === 200 && response.data
          ? Number(response.data.count || 0)
          : 0
        return Math.max(1, Math.ceil(position / this.pageSize))
      },

      async loadSelectedString (stringId, typeId, initRequestToken = null) {
        const isStale = () => initRequestToken !== null && initRequestToken !== this.initRequestToken
        if (isStale()) {
          return false
        }

        let selected = this.strings.find(string => string.id === stringId && string.type === typeId)
        if (!selected) {
          try {
            selected = await this.findString(typeId, stringId)
          } catch (err) {
            if (isStale()) {
              return false
            }
            this.error = this.getApiError(err, 'Unable to load the selected string')
            return false
          }
        }

        if (isStale()) {
          return false
        }

        if (!selected) {
          this.error = `String ID ${stringId} was not found for type ${typeId}`
          this.subSelectedId = -1
          this.subSelectedType = -1
          this.originalSelectedStringObject = {}
          this.selectedStringObject = {}
          return false
        }

        this.applySelectedString(selected)
        return true
      },

      async changeSelectedType (value) {
        if (this.creatingSuggestion) {
          this.typeSelectRenderKey++
          return
        }
        const nextType = parseInt(value)
        if (nextType === this.selectedType) {
          return
        }
        if (!this.confirmDiscardChanges()) {
          this.typeSelectRenderKey++
          return
        }

        this.resetSelections()
        this.error = ''
        this.notification = ''
        this.selectedType = nextType
        this.searchTerm = ''
        this.appliedSearch = ''
        this.currentPage = 1
        this.strings = []
        this.totalMatches = 0
        this.updateQueryState()

        if (this.isValidStringType(nextType)) {
          await this.loadStrings()
        }
      },

      async applySearch () {
        this.error = ''
        this.notification = ''
        this.appliedSearch = this.searchTerm.trim()
        this.currentPage = 1
        await this.loadStrings()
      },
      async clearSearch () {
        this.searchTerm = ''
        this.appliedSearch = ''
        this.currentPage = 1
        await this.loadStrings()
      },
      async changePage (page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) {
          return
        }
        this.currentPage = page
        await this.loadStrings()
        const container = document.getElementById('db-strings-list')
        if (container) {
          container.scrollTop = 0
        }
      },

      async getLowestAvailableStringId (type) {
        let candidateId = 1
        let lastSeenId = 0

        while (candidateId <= MAX_STRING_ID) {
          const builder = new SpireQueryBuilder()
            .where('type', '=', type)
            .where('id', '>', lastSeenId)
            .select(['id', 'type'])
            .orderBy(['id'])
            .orderDirection('asc')
            .limit(ID_SCAN_PAGE_SIZE)
          const response = await DbStrApiClient.listDbStrs(builder.get())
          const rows = response.status === 200 && Array.isArray(response.data)
            ? response.data
            : []

          if (rows.length === 0) {
            return candidateId
          }

          for (const row of rows) {
            const id = Number(row.id)
            if (!Number.isSafeInteger(id) || id < candidateId) {
              continue
            }
            if (id > candidateId) {
              return candidateId
            }

            candidateId++
            if (candidateId > MAX_STRING_ID) {
              throw new Error('No valid string IDs remain in this type')
            }
          }

          const nextLastSeenId = Number(rows[rows.length - 1].id)
          if (!Number.isSafeInteger(nextLastSeenId) || nextLastSeenId <= lastSeenId) {
            throw new Error('Unable to determine the lowest available string ID')
          }
          lastSeenId = nextLastSeenId

          if (rows.length < ID_SCAN_PAGE_SIZE) {
            return candidateId
          }
        }

        throw new Error('No valid string IDs remain in this type')
      },

      async createString () {
        if (!this.isValidStringType(this.selectedType)) {
          this.error = 'Please select a valid type first'
          return
        }
        if (!this.confirmDiscardChanges()) {
          return
        }

        const creatingType = this.selectedType
        const requestToken = ++this.createSuggestionRequestToken
        this.resetSelections()
        this.creatingSuggestion = true
        this.error = ''
        this.notification = ''
        try {
          const newId = await this.getLowestAvailableStringId(creatingType)
          if (requestToken !== this.createSuggestionRequestToken || creatingType !== this.selectedType) {
            return
          }
          this.creatingString = true
          this.subSelectedId = newId
          this.subSelectedType = creatingType
          this.originalSelectedStringObject = {}
          this.selectedStringObject = {
            id: newId,
            type: creatingType,
            value: ''
          }
          this.idAvailability = 'idle'
          EditFormFieldUtil.resetFieldEditedStatus()
          await this.checkCreationIdAvailability()
        } catch (err) {
          if (requestToken === this.createSuggestionRequestToken) {
            this.error = this.getApiError(err, err.message || 'Unable to suggest a string ID')
          }
        } finally {
          if (requestToken === this.createSuggestionRequestToken) {
            this.creatingSuggestion = false
          }
        }
      },

      cancelCreate () {
        if (!this.confirmDiscardChanges()) {
          return
        }
        this.resetSelections()
        this.updateQueryState()
      },

      clearIdCheckTimer () {
        if (this.idCheckTimeout) {
          clearTimeout(this.idCheckTimeout)
          this.idCheckTimeout = null
        }
      },
      onCreationIdInput () {
        EditFormFieldUtil.setFieldModifiedById('selected_id')
        this.clearIdCheckTimer()
        this.idCheckRequestToken++
        this.idAvailability = this.parsedCreationId === null ? 'invalid' : 'idle'
        if (this.parsedCreationId !== null) {
          this.idCheckTimeout = setTimeout(() => this.checkCreationIdAvailability(), ID_CHECK_DELAY)
        }
      },
      async checkCreationIdAvailability () {
        this.clearIdCheckTimer()
        const id = this.parsedCreationId
        if (!this.creatingString || id === null) {
          this.idAvailability = 'invalid'
          return false
        }

        const type = this.selectedType
        const requestToken = ++this.idCheckRequestToken
        this.idAvailability = 'checking'
        try {
          const existing = await this.findString(type, id)
          if (requestToken !== this.idCheckRequestToken || id !== this.parsedCreationId || type !== this.selectedType) {
            return false
          }
          this.idAvailability = existing ? 'taken' : 'available'
          return !existing
        } catch (err) {
          if (requestToken === this.idCheckRequestToken) {
            this.idAvailability = 'error'
            this.error = this.getApiError(err, 'Unable to verify the string ID')
          }
          return false
        }
      },

      updateSelectedString (field) {
        EditFormFieldUtil.setFieldModifiedById('selected_' + field)
      },

      async saveSelectedString () {
        this.error = ''
        this.notification = ''

        if (this.creatingString && !await this.checkCreationIdAvailability()) {
          if (this.idAvailability === 'taken') {
            this.error = `String ID ${this.parsedCreationId} already exists for type ${this.selectedType}`
          }
          return
        }

        this.saving = true
        try {
          const savedId = parseInt(this.selectedStringObject.id)
          const savedType = parseInt(this.selectedStringObject.type)
          const wasCreating = this.creatingString
          let response

          if (wasCreating) {
            response = await DbStrApiClient.createDbStr({
              dbStr: {
                id: savedId,
                type: savedType,
                value: this.selectedStringObject.value || ''
              }
            })
          } else {
            response = await DbStrApiClient.updateDbStr(
              {
                id: parseInt(this.originalSelectedStringObject.id),
                dbStr: this.selectedStringObject
              },
              {
                query: new SpireQueryBuilder()
                  .where('type', '=', this.selectedType)
                  .get()
              }
            )
          }

          if (response.status === 200 && response.data) {
            this.creatingString = false
            this.idAvailability = 'idle'
            EditFormFieldUtil.resetFieldEditedStatus()

            if (wasCreating) {
              this.searchTerm = String(savedId)
              this.appliedSearch = String(savedId)
              this.currentPage = 1
            }

            await this.loadStrings()
            const persisted = this.strings.find(string => string.id === savedId && string.type === savedType) || response.data
            this.applySelectedString(persisted)
            this.updateQueryState()
            this.notification = 'Saved successfully'
          }
        } catch (err) {
          const apiError = this.getApiError(err, 'Unable to save the string')
          this.error = /duplicate entry/i.test(apiError)
            ? `String ID ${this.selectedStringObject.id} already exists for type ${this.selectedType}`
            : apiError
        } finally {
          this.saving = false
        }
      },

      async deleteSelectedString () {
        if (!confirm('Are you sure you want to delete this string?')) {
          return
        }

        const deletedId = parseInt(this.subSelectedId)
        const deletedType = parseInt(this.subSelectedType)
        const deletedIndex = this.strings.findIndex(string => string.id === deletedId && string.type === deletedType)
        this.error = ''
        this.notification = ''

        try {
          const response = await DbStrApiClient.deleteDbStr(
            { id: deletedId },
            {
              query: new SpireQueryBuilder()
                .where('type', '=', deletedType)
                .get()
            }
          )

          if (response.status === 200 && response.data) {
            const deletedIdSearch = this.appliedSearch === String(deletedId)
            this.resetSelections()
            if (deletedIdSearch) {
              this.searchTerm = ''
              this.appliedSearch = ''
              this.currentPage = 1
            }
            await this.loadStrings()

            if (this.strings.length > 0) {
              const nextIndex = Math.max(0, Math.min(deletedIndex, this.strings.length - 1))
              this.applySelectedString(this.strings[nextIndex])
            }
            this.updateQueryState()
            this.notification = 'Deleted successfully'
          }
        } catch (err) {
          this.error = this.getApiError(err, 'Unable to delete the string')
        }
      },

      selectString (string) {
        if (this.creatingSuggestion) {
          return false
        }
        if (string.id === this.subSelectedId && string.type === this.subSelectedType) {
          return true
        }
        if (!this.confirmDiscardChanges()) {
          return false
        }
        this.applySelectedString(string)
        this.updateQueryState()
        return true
      },
      applySelectedString (string) {
        this.subSelectedId = Number(string.id)
        this.subSelectedType = Number(string.type)
        this.originalSelectedStringObject = JSON.parse(JSON.stringify(string))
        this.selectedStringObject = JSON.parse(JSON.stringify(string))
        this.creatingString = false
        this.idAvailability = 'idle'
        EditFormFieldUtil.resetFieldEditedStatus()
      },

      isSubEditActive () {
        return this.subSelectedId >= 0 && this.subSelectedType >= 0 && Object.keys(this.selectedStringObject).length > 0
      },
      isStringSelected (string) {
        return string.id === this.subSelectedId && string.type === this.subSelectedType
      },
      hasUnsavedChanges () {
        return this.creatingString || (this.selectedStringObject && this.originalSelectedStringObject &&
          JSON.stringify(this.selectedStringObject) !== JSON.stringify(this.originalSelectedStringObject)
        )
      },
      confirmDiscardChanges () {
        return !this.hasUnsavedChanges() || window.confirm('Discard unsaved string changes?')
      },
      warnUnsavedChanges (e) {
        if (this.hasUnsavedChanges()) {
          e.preventDefault()
          e.returnValue = ''
        }
      },
      getApiError (err, fallback) {
        return err && err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : fallback
      },

      async init () {
        const initRequestToken = ++this.initRequestToken
        this.listRequestToken++
        this.createSuggestionRequestToken++
        this.creatingSuggestion = false
        this.loadQueryState()
        this.strings = []
        this.totalMatches = 0

        if (!this.isValidStringType(this.selectedType)) {
          return
        }

        const selectedId = this.subSelectedId
        const selectedType = this.subSelectedType
        if (selectedId >= 0) {
          try {
            const selectedPage = await this.findStringPage(selectedType, selectedId)
            if (initRequestToken !== this.initRequestToken) {
              return
            }
            this.currentPage = selectedPage
          } catch (err) {
            if (initRequestToken !== this.initRequestToken) {
              return
            }
            this.error = this.getApiError(err, 'Unable to locate the selected string in the list')
          }
        }
        await this.loadStrings()
        if (initRequestToken !== this.initRequestToken) {
          return
        }

        if (selectedId >= 0) {
          const selectedLoaded = await this.loadSelectedString(selectedId, selectedType, initRequestToken)
          if (!selectedLoaded || initRequestToken !== this.initRequestToken) {
            return
          }
          this.scrollToHighlighted()
        }
      },

      scrollToHighlighted () {
        setTimeout(() => {
          const container = document.getElementById('db-strings-list')
          const target = document.getElementById(util.format('string-%s', this.subSelectedId))
          if (container && target) {
            container.scrollTop = container.scrollTop + target.getBoundingClientRect().top - 200
          }
        }, 100)
      }
    },

    async mounted () {
      await this.init()
      window.addEventListener('beforeunload', this.warnUnsavedChanges)
    },
    beforeDestroy () {
      this.clearIdCheckTimer()
      this.idCheckRequestToken++
      this.listRequestToken++
      this.createSuggestionRequestToken++
      this.initRequestToken++
      window.removeEventListener('beforeunload', this.warnUnsavedChanges)
    },
    beforeRouteUpdate (to, from, next) {
      if (!this.confirmDiscardChanges()) {
        next(false)
        return
      }
      next()
    },
    beforeRouteLeave (to, from, next) {
      if (!this.confirmDiscardChanges()) {
        next(false)
        return
      }
      next()
    }
  }
</script>

<style scoped>
.strings-list-window {
  height: 72vh;
  overflow-x: hidden;
  overflow-y: auto;
}

.strings-table {
  display: table;
  overflow-x: auto;
}

.search-summary {
  color: #c4bda8;
  font-size: 0.82rem;
}

.string-search-controls,
.string-search-actions {
  display: flex;
  gap: 12px;
}

.string-search-input {
  min-width: 0;
}

.string-search-actions {
  flex: 0 0 auto;
}

@media (max-width: 575.98px) {
  .string-search-controls {
    flex-direction: column;
  }

  .string-search-actions > .btn {
    flex: 1 1 0;
  }
}

.strings-pagination {
  align-items: center;
  display: flex;
  gap: 0.8rem;
  justify-content: center;
}

.creation-id-status {
  font-size: 0.82rem;
  margin-top: 0.35rem;
}

.string-preview {
  min-height: 28px;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
