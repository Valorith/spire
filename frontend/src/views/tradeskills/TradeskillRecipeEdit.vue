<template>
  <content-area>
    <eq-window :title="isNew ? 'Create New ' + tradeskillName + ' Recipe' : 'Edit ' + tradeskillName + ' Recipe: ' + recipe.name" style="position: relative;">
      <div class="tradeskill-icon-badge">
        <i :class="tradeskillIcon"></i>
      </div>

      <!-- Clone Notification -->
      <div v-if="cloneNotification" class="clone-notification mb-3">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <i class="fa fa-copy mr-2" style="color: #42a5f5;"></i>
            <strong>Cloned Recipe</strong> — This is an unsaved copy. Review the details and click
            <strong style="color: #ffd54f;">Save</strong> to create it as a new recipe.
          </div>
          <b-button size="sm" variant="link" @click="cloneNotification = false" style="color: #999;">
            <i class="fa fa-times"></i>
          </b-button>
        </div>
      </div>

      <!-- Top Controls -->
      <div class="row mb-3">
        <div class="col-12">
          <div class="btn-group">
            <b-button size="sm" variant="outline-secondary" @click="goBack()">
              <i class="fa fa-arrow-left"></i> Back
            </b-button>
            <b-button size="sm"
              :variant="hasUnsavedChanges ? 'outline-danger' : 'outline-warning'"
              :class="{ 'save-btn-glow': hasUnsavedChanges }"
              @click="saveRecipe()" :disabled="saving || !hasUnsavedChanges">
              <i :class="saving ? 'fa fa-spinner fa-spin' : 'fa fa-save'"></i> Save
            </b-button>
            <b-button v-if="hasUnsavedChanges" size="sm" variant="outline-warning" @click="confirmReset()">
              <i class="fa fa-undo"></i> Reset
            </b-button>
            <b-button v-if="!isNew" size="sm" variant="outline-danger" @click="confirmDelete()">
              <i class="fa fa-trash"></i> Delete
            </b-button>
          </div>
          <span v-if="hasUnsavedChanges" class="ml-3 text-warning" style="font-size: 12px;">
            <i class="fa fa-exclamation-triangle"></i> Unsaved changes
          </span>
          <span v-if="saveMessage" class="ml-3" :class="saveError ? 'text-danger' : 'text-success'">
            {{ saveMessage }}
          </span>
        </div>
      </div>

      <!-- Recipe Properties -->
      <div class="row" style="display: flex; flex-wrap: wrap;">
        <div class="col-lg-6" style="display: flex; flex-direction: column;">
          <eq-window title="Recipe Properties" class="mb-3" style="flex: 1;">
            <table class="eq-table" style="font-size: 14px; width: 100%;">
              <colgroup>
                <col style="width: 140px;">
                <col>
              </colgroup>
              <tbody>
                <tr>
                  <td class="font-weight-bold">ID</td>
                  <td>{{ isNew ? '(auto)' : recipe.id }}</td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Name</td>
                  <td>
                    <input type="text" class="form-control form-control-sm" v-model="recipe.name"
                      placeholder="Recipe name"
                      @input="trackFieldEdit('name', originalValues.name || '', recipe.name)"
                      :class="{ 'pending-edit': isFieldEdited('name') }">
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Trivial</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <input type="number" class="form-control form-control-sm" v-model.number="recipe.trivial"
                        style="width: 80px;" min="0" :max="maxSkill"
                        @input="trackFieldEdit('trivial', originalValues.trivial || 0, recipe.trivial)"
                        :class="{ 'pending-edit': isFieldEdited('trivial') }">
                      <input type="range" class="skill-slider ml-2" v-model.number="recipe.trivial"
                        min="0" :max="maxSkill" step="1" style="flex: 1;"
                        @input="trackFieldEdit('trivial', originalValues.trivial || 0, recipe.trivial)"
                        :class="{ 'pending-edit-slider': isFieldEdited('trivial') }">
                      <small class="text-muted ml-2" style="white-space: nowrap;">/ {{ maxSkill }}</small>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Skill Needed</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <input type="number" class="form-control form-control-sm" v-model.number="recipe.skillneeded"
                        style="width: 80px;" min="0" :max="maxSkill"
                        @input="trackFieldEdit('skillneeded', originalValues.skillneeded || 0, recipe.skillneeded)"
                        :class="{ 'pending-edit': isFieldEdited('skillneeded') }">
                      <input type="range" class="skill-slider ml-2" v-model.number="recipe.skillneeded"
                        min="0" :max="maxSkill" step="1" style="flex: 1;"
                        @input="trackFieldEdit('skillneeded', originalValues.skillneeded || 0, recipe.skillneeded)"
                        :class="{ 'pending-edit-slider': isFieldEdited('skillneeded') }">
                      <small class="text-muted ml-2" style="white-space: nowrap;">/ {{ maxSkill }}</small>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">No Fail</td>
                  <td>
                    <b-form-checkbox v-model="recipe.nofail" :value="1" :unchecked-value="0" switch
                      @change="trackFieldEdit('nofail', originalValues.nofail || 0, $event)"
                      :class="{ 'pending-edit-check': isFieldEdited('nofail') }">
                      {{ recipe.nofail ? 'Yes' : 'No' }}
                    </b-form-checkbox>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Quest</td>
                  <td>
                    <b-form-checkbox v-model="recipe.quest" :value="1" :unchecked-value="0" switch
                      @change="trackFieldEdit('quest', originalValues.quest || 0, $event)"
                      :class="{ 'pending-edit-check': isFieldEdited('quest') }">
                      {{ recipe.quest ? 'Yes' : 'No' }}
                    </b-form-checkbox>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Must Learn</td>
                  <td>
                    <b-form-checkbox v-model="recipe.must_learn" :value="1" :unchecked-value="0" switch
                      @change="trackFieldEdit('must_learn', originalValues.must_learn || 0, $event)"
                      :class="{ 'pending-edit-check': isFieldEdited('must_learn') }">
                      {{ recipe.must_learn ? 'Yes' : 'No' }}
                    </b-form-checkbox>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Enabled</td>
                  <td>
                    <b-form-checkbox v-model="recipe.enabled" :value="1" :unchecked-value="0" switch
                      @change="trackFieldEdit('enabled', originalValues.enabled || 0, $event)"
                      :class="{ 'pending-edit-check': isFieldEdited('enabled') }">
                      {{ recipe.enabled ? 'Yes' : 'No' }}
                    </b-form-checkbox>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Learned By Item</td>
                  <td>
                    <div class="d-flex align-items-center" style="position: relative;">
                      <div style="width: 280px; max-width: 100%; position: relative;">
                        <input
                          type="text"
                          class="form-control form-control-sm"
                          v-model="learnedBySearch"
                          @input="onLearnedByInput()"
                          @keydown.down.prevent="learnedByHighlight = Math.min(learnedByHighlight + 1, learnedByResults.length - 1)"
                          @keydown.up.prevent="learnedByHighlight = Math.max(learnedByHighlight - 1, 0)"
                          @keydown.enter.prevent="selectLearnedByItem(learnedByResults[learnedByHighlight])"
                          @keydown.escape="learnedByResults = []"
                          @blur="setTimeout(() => learnedByResults = [], 200)"
                          placeholder="Search by name"
                        >
                        <div v-if="learnedByResults.length > 0" class="learned-by-dropdown">
                          <div
                            v-for="(item, idx) in learnedByResults"
                            :key="item.id"
                            class="learned-by-item"
                            :class="{ highlighted: idx === learnedByHighlight }"
                            @mousedown.prevent="selectLearnedByItem(item)"
                            @mouseenter="learnedByHighlight = idx"
                          >
                            <item-popover :item="item" size="sm" class="mr-2" />
                            <small class="text-muted ml-auto">#{{ item.id }}</small>
                          </div>
                        </div>
                      </div>
                      <item-popover
                        v-if="learnedByItem && recipe.learned_by_item_id > 0"
                        :item="learnedByItem"
                        class="ml-2"
                        size="sm"
                      />
                      <b-button
                        v-if="recipe.learned_by_item_id > 0"
                        size="sm"
                        variant="outline-danger"
                        class="ml-1"
                        @click="clearLearnedBy()"
                        title="Clear"
                      >
                        <i class="fa fa-times"></i>
                      </b-button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Replace Container</td>
                  <td>
                    <b-form-checkbox v-model="recipe.replace_container" :value="1" :unchecked-value="0" switch
                      @change="trackFieldEdit('replace_container', originalValues.replace_container || 0, $event)"
                      :class="{ 'pending-edit-check': isFieldEdited('replace_container') }">
                      {{ recipe.replace_container ? 'Yes' : 'No' }}
                    </b-form-checkbox>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Content Flags</td>
                  <td :class="{ 'pending-edit': isFieldEdited('content_flags') }">
                    <content-flag-selector v-model="recipe.content_flags"
                      @input="trackFieldEdit('content_flags', originalValues.content_flags || '', $event)" />
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Content Flags Disabled</td>
                  <td :class="{ 'pending-edit': isFieldEdited('content_flags_disabled') }">
                    <content-flag-selector v-model="recipe.content_flags_disabled"
                      @input="trackFieldEdit('content_flags_disabled', originalValues.content_flags_disabled || '', $event)" />
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Notes</td>
                  <td>
                    <textarea class="form-control form-control-sm" v-model="recipe.notes" rows="2"
                      placeholder="Optional notes"
                      @input="trackFieldEdit('notes', originalValues.notes || '', recipe.notes)"
                      :class="{ 'pending-edit': isFieldEdited('notes') }"></textarea>
                  </td>
                </tr>
              </tbody>
            </table>
          </eq-window>
        </div>

        <!-- Recipe Entries (Visual) -->
        <div class="col-lg-6" style="display: flex; flex-direction: column;">
          <eq-window title="Recipe Components & Results" class="mb-3" style="flex: 1;">
           <div class="recipe-entries-wrapper">
           <div class="recipe-entries-scroll" ref="entriesScroll" @scroll="onEntriesScroll">
            <!-- Components (inputs) -->
            <div class="mb-3 drop-section" :class="{ 'drop-hover': dropHoverSection === 'component', 'empty-drop-section': componentEntries.length === 0 }" @dragover.prevent="onSectionDragOver($event, 'component')" @dragleave="onSectionDragLeave('component')" @drop="onSectionDrop($event, 'component')">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0" style="color: #ffc107;">
                  <i class="ra ra-cog mr-1"></i> Components (Inputs)
                  <small v-if="componentEntries.length > 0" class="text-muted ml-1">({{ componentEntries.length }})</small>
                </h6>
                <small v-if="componentEntries.length === 0" class="text-muted flex-fill text-center" style="font-size: 11px; opacity: 0.5;">No components added yet.</small>
                <b-button size="sm" variant="outline-success" @click="showItemSearch('component')">
                  <i class="fa fa-plus"></i> Add
                </b-button>
              </div>

              <div class="entry-scroll-area">
              <div v-for="(entry, idx) in componentEntries" :key="'comp-' + idx" :class="['entry-row','p-2','mb-1', entryRowClass(entry)]" draggable="true" @dragstart="onDragStart(entry, 'component')" @dragover.prevent @drop="onDrop(entry, 'component')">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <item-popover
                      v-if="itemCache[entry.item_id] && !itemCache[entry.item_id]._missing"
                      :item="itemCache[entry.item_id]"
                      size="sm"
                    />
                    <span v-else-if="itemCache[entry.item_id] && itemCache[entry.item_id]._missing" class="text-warning">
                      <i class="fa fa-exclamation-triangle"></i> Missing Item #{{ entry.item_id }}
                    </span>
                    <span v-else class="text-muted">Item #{{ entry.item_id }}</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <div class="mr-2 d-flex align-items-center">
                      <small class="text-muted mr-1">Count:</small>
                      <div class="count-stepper">
                        <button class="count-btn count-btn-minus" @click="decrementCount(entry, 'componentcount')" :disabled="entry.componentcount <= 1"><i class="fa fa-minus"></i></button>
                        <input type="number" class="count-input" v-model.number="entry.componentcount" min="1" @input="updateHasChanges()">
                        <button class="count-btn count-btn-plus" @click="incrementCount(entry, 'componentcount')"><i class="fa fa-plus"></i></button>
                      </div>
                    </div>
                    <b-button size="sm" variant="outline-danger" @click="removeEntry(entry, 'component')">
                      <i class="fa fa-times"></i>
                    </b-button>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <hr style="border-color: rgba(255,255,255,0.1); margin: 4px 0;">

            <!-- Containers -->
            <div class="mb-3 drop-section" :class="{ 'drop-hover': dropHoverSection === 'container', 'empty-drop-section': containerEntries.length === 0 }" @dragover.prevent="onSectionDragOver($event, 'container')" @dragleave="onSectionDragLeave('container')" @drop="onSectionDrop($event, 'container')">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0" style="color: #6c757d;">
                  <i class="ra ra-wooden-crate mr-1"></i> Containers
                </h6>
                <small v-if="containerEntries.length === 0" class="text-muted flex-fill text-center" style="font-size: 11px; opacity: 0.5;">No container set.</small>
                <div class="d-flex">
                  <b-dropdown size="sm" variant="outline-warning" right no-caret class="mr-1" boundary="viewport">
                    <template #button-content>
                      <i class="ra ra-wooden-crate mr-1"></i> Standard
                    </template>
                    <!-- Relevant tradeskill group first -->
                    <template v-if="relevantContainerGroup">
                      <b-dropdown-header>
                        <i :class="relevantContainerGroup.icon" class="mr-1" style="color: #e8c56d;"></i>
                        {{ relevantContainerGroup.label }} — Recommended
                      </b-dropdown-header>
                      <b-dropdown-item v-for="c in relevantContainerGroup.primary" :key="'drp-' + c.id" @click="addWorldContainer(c.id)">
                        <i :class="getWorldContainerIcon(c.id)" class="mr-2" style="color: #e8c56d;"></i>
                        <strong>{{ c.name }}</strong>
                      </b-dropdown-item>
                      <b-dropdown-item v-for="c in relevantContainerGroup.variants" :key="'drv-' + c.id" @click="addWorldContainer(c.id)">
                        <i :class="getWorldContainerIcon(c.id)" class="mr-2" style="color: #e8c56d; opacity: 0.7;"></i>
                        {{ c.name }}
                      </b-dropdown-item>
                      <b-dropdown-divider></b-dropdown-divider>
                    </template>
                    <!-- Other tradeskill groups -->
                    <template v-for="(group, tsId) in otherContainerGroups">
                      <b-dropdown-header :key="'dgh-' + tsId">
                        <i :class="group.icon" class="mr-1" style="color: #e8c56d;"></i>
                        {{ group.label }}
                      </b-dropdown-header>
                      <b-dropdown-item v-for="c in group.primary" :key="'dgo-' + c.id" @click="addWorldContainer(c.id)">
                        <i :class="getWorldContainerIcon(c.id)" class="mr-2" style="color: #e8c56d;"></i>
                        {{ c.name }}
                      </b-dropdown-item>
                    </template>
                  </b-dropdown>
                  <b-button size="sm" variant="outline-success" @click="showItemSearch('container')">
                    <i class="fa fa-search mr-1"></i> Search
                  </b-button>
                </div>
              </div>

              <!-- Current containers -->

              <div v-for="(entry, idx) in containerEntries" :key="'cont-' + idx" :class="['entry-row','p-2','mb-1', entryRowClass(entry)]">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <template v-if="isWorldContainer(entry.item_id)">
                      <i :class="getWorldContainerIcon(entry.item_id)" class="mr-2" style="font-size: 18px; color: #e8c56d;"></i>
                      <span style="color: #e0d8c8;">{{ getWorldContainerName(entry.item_id) }}</span>
                    </template>
                    <template v-else>
                      <item-popover
                        v-if="itemCache[entry.item_id] && !itemCache[entry.item_id]._missing"
                        :item="itemCache[entry.item_id]"
                        size="sm"
                      />
                      <span v-else-if="itemCache[entry.item_id] && itemCache[entry.item_id]._missing" class="text-warning">
                        <i class="fa fa-exclamation-triangle"></i> Missing Item #{{ entry.item_id }}
                      </span>
                      <span v-else class="text-muted">Item #{{ entry.item_id }}</span>
                    </template>
                  </div>
                  <b-button size="sm" variant="outline-danger" @click="removeEntry(entry, 'container')">
                    <i class="fa fa-times"></i>
                  </b-button>
                </div>
              </div>

            </div>

            <hr style="border-color: rgba(255,255,255,0.1); margin: 4px 0;">

            <!-- Salvage Results -->
            <div class="mb-3 drop-section" :class="{ 'drop-hover': dropHoverSection === 'salvage', 'empty-drop-section': salvageEntries.length === 0 }" @dragover.prevent="onSectionDragOver($event, 'salvage')" @dragleave="onSectionDragLeave('salvage')" @drop="onSectionDrop($event, 'salvage')">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0" style="color: #17a2b8;">
                  <i class="ra ra-recycle mr-1"></i> Salvage Results
                  <small v-if="salvageEntries.length > 0" class="text-muted ml-1">({{ salvageEntries.length }})</small>
                </h6>
                <small v-if="salvageEntries.length === 0" class="text-muted flex-fill text-center" style="font-size: 11px; opacity: 0.5;">No salvage results added yet.</small>
                <b-button size="sm" variant="outline-success" @click="showItemSearch('salvage')">
                  <i class="fa fa-plus"></i> Add
                </b-button>
              </div>

              <div class="entry-scroll-area">
              <div v-for="(entry, idx) in salvageEntries" :key="'salv-' + idx" :class="['entry-row','p-2','mb-1', entryRowClass(entry)]" draggable="true" @dragstart="onDragStart(entry, 'salvage')" @dragover.prevent @drop="onDrop(entry, 'salvage')">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <item-popover
                      v-if="itemCache[entry.item_id] && !itemCache[entry.item_id]._missing"
                      :item="itemCache[entry.item_id]"
                      size="sm"
                    />
                    <span v-else-if="itemCache[entry.item_id] && itemCache[entry.item_id]._missing" class="text-warning">
                      <i class="fa fa-exclamation-triangle"></i> Missing Item #{{ entry.item_id }}
                    </span>
                    <span v-else class="text-muted">Item #{{ entry.item_id }}</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <div class="mr-2 d-flex align-items-center">
                      <small class="text-muted mr-1">Count:</small>
                      <div class="count-stepper">
                        <button class="count-btn count-btn-minus" @click="decrementCount(entry, 'salvagecount')" :disabled="entry.salvagecount <= 1"><i class="fa fa-minus"></i></button>
                        <input type="number" class="count-input" v-model.number="entry.salvagecount" min="1" @input="updateHasChanges()">
                        <button class="count-btn count-btn-plus" @click="incrementCount(entry, 'salvagecount')"><i class="fa fa-plus"></i></button>
                      </div>
                    </div>
                    <b-button size="sm" variant="outline-danger" @click="removeEntry(entry, 'salvage')">
                      <i class="fa fa-times"></i>
                    </b-button>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <hr style="border-color: rgba(255,255,255,0.1); margin: 4px 0;">

            <!-- Fail Results -->
            <div class="mb-3 drop-section" :class="{ 'drop-hover': dropHoverSection === 'fail', 'empty-drop-section': failEntries.length === 0 }" @dragover.prevent="onSectionDragOver($event, 'fail')" @dragleave="onSectionDragLeave('fail')" @drop="onSectionDrop($event, 'fail')">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0" style="color: #dc3545;">
                  <i class="fa fa-times mr-1"></i> Fail Results
                  <small v-if="failEntries.length > 0" class="text-muted ml-1">({{ failEntries.length }})</small>
                </h6>
                <small v-if="failEntries.length === 0" class="text-muted flex-fill text-center" style="font-size: 11px; opacity: 0.5;">No fail results added yet.</small>
                <b-button size="sm" variant="outline-success" @click="showItemSearch('fail')">
                  <i class="fa fa-plus"></i> Add
                </b-button>
              </div>

              <div class="entry-scroll-area">
              <div v-for="(entry, idx) in failEntries" :key="'fail-' + idx" :class="['entry-row','p-2','mb-1', entryRowClass(entry)]" draggable="true" @dragstart="onDragStart(entry, 'fail')" @dragover.prevent @drop="onDrop(entry, 'fail')">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <item-popover
                      v-if="itemCache[entry.item_id] && !itemCache[entry.item_id]._missing"
                      :item="itemCache[entry.item_id]"
                      size="sm"
                    />
                    <span v-else-if="itemCache[entry.item_id] && itemCache[entry.item_id]._missing" class="text-warning">
                      <i class="fa fa-exclamation-triangle"></i> Missing Item #{{ entry.item_id }}
                    </span>
                    <span v-else class="text-muted">Item #{{ entry.item_id }}</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <div class="mr-2 d-flex align-items-center">
                      <small class="text-muted mr-1">Count:</small>
                      <div class="count-stepper">
                        <button class="count-btn count-btn-minus" @click="decrementCount(entry, 'failcount')" :disabled="entry.failcount <= 1"><i class="fa fa-minus"></i></button>
                        <input type="number" class="count-input" v-model.number="entry.failcount" min="1" @input="updateHasChanges()">
                        <button class="count-btn count-btn-plus" @click="incrementCount(entry, 'failcount')"><i class="fa fa-plus"></i></button>
                      </div>
                    </div>
                    <b-button size="sm" variant="outline-danger" @click="removeEntry(entry, 'fail')">
                      <i class="fa fa-times"></i>
                    </b-button>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <hr style="border-color: rgba(255,255,255,0.1); margin: 4px 0;">

            <!-- Success Results (outputs) -->
            <div class="drop-section" :class="{ 'drop-hover': dropHoverSection === 'success', 'empty-drop-section': successEntries.length === 0 }" @dragover.prevent="onSectionDragOver($event, 'success')" @dragleave="onSectionDragLeave('success')" @drop="onSectionDrop($event, 'success')">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0" style="color: #28a745;">
                  <i class="fa fa-check mr-1"></i> Success Results
                  <small v-if="successEntries.length > 0" class="text-muted ml-1">({{ successEntries.length }})</small>
                </h6>
                <small v-if="successEntries.length === 0" class="text-muted flex-fill text-center" style="font-size: 11px; opacity: 0.5;">No success results added yet.</small>
                <b-button size="sm" variant="outline-success" @click="showItemSearch('success')">
                  <i class="fa fa-plus"></i> Add
                </b-button>
              </div>

              <div class="entry-scroll-area">
              <div v-for="(entry, idx) in successEntries" :key="'succ-' + idx" :class="['entry-row','p-2','mb-1', entryRowClass(entry)]" draggable="true" @dragstart="onDragStart(entry, 'success')" @dragover.prevent @drop="onDrop(entry, 'success')">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <item-popover
                      v-if="itemCache[entry.item_id] && !itemCache[entry.item_id]._missing"
                      :item="itemCache[entry.item_id]"
                      size="sm"
                    />
                    <span v-else-if="itemCache[entry.item_id] && itemCache[entry.item_id]._missing" class="text-warning">
                      <i class="fa fa-exclamation-triangle"></i> Missing Item #{{ entry.item_id }}
                    </span>
                    <span v-else class="text-muted">Item #{{ entry.item_id }}</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <div class="mr-2 d-flex align-items-center">
                      <small class="text-muted mr-1">Count:</small>
                      <div class="count-stepper">
                        <button class="count-btn count-btn-minus" @click="decrementCount(entry, 'successcount')" :disabled="entry.successcount <= 1"><i class="fa fa-minus"></i></button>
                        <input type="number" class="count-input" v-model.number="entry.successcount" min="1" @input="updateHasChanges()">
                        <button class="count-btn count-btn-plus" @click="incrementCount(entry, 'successcount')"><i class="fa fa-plus"></i></button>
                      </div>
                    </div>
                    <b-button size="sm" variant="outline-danger" @click="removeEntry(entry, 'success')">
                      <i class="fa fa-times"></i>
                    </b-button>
                  </div>
                </div>
              </div>
              </div>
            </div>
           </div>
           <transition name="fade">
             <div v-if="showScrollHint" class="scroll-hint-overlay" @click="scrollToBottom">
               <div class="scroll-hint-arrow">
                 <i class="fa fa-chevron-down"></i>
               </div>
             </div>
           </transition>
           </div>
          </eq-window>
        </div>
      </div>
    </eq-window>

    <!-- Item Search Panel (inline, below editor) -->
    <eq-window title="Item Search — Drag items into recipe sections above" class="mt-4 mb-4">
      <div class="item-search-panel">
        <div class="d-flex mb-3">
          <input
            type="text"
            class="form-control form-control-sm"
            v-model="itemSearchQuery"
            @input="onItemSearchInput()"
            @keydown.enter.prevent="searchItems()"
            placeholder="Search items by name or ID..."
            style="max-width: 400px; width: 100%;"
          >
          <b-button size="sm" variant="outline-warning" class="ml-2" @click="searchItems()" :disabled="itemSearching">
            <i :class="itemSearching ? 'fa fa-spinner fa-spin' : 'fa fa-search'"></i> Search
          </b-button>
          <small class="text-muted ml-3 align-self-center" v-if="itemSearchResults.length > 0">
            {{ itemSearchResults.length }} results — drag into sections above
          </small>
          <div v-if="itemSearchTotalPages > 1" class="d-flex align-items-center ml-auto" style="gap: 6px;">
            <button class="count-btn count-btn-minus" @click="itemSearchPage = Math.max(1, itemSearchPage - 1)" :disabled="itemSearchPage <= 1"><i class="fa fa-minus"></i></button>
            <small class="text-muted" style="white-space: nowrap;">Page {{ itemSearchPage }} / {{ itemSearchTotalPages }}</small>
            <button class="count-btn count-btn-plus" @click="itemSearchPage = Math.min(itemSearchTotalPages, itemSearchPage + 1)" :disabled="itemSearchPage >= itemSearchTotalPages"><i class="fa fa-plus"></i></button>
          </div>
        </div>
        <div class="item-search-grid-container">
        <div v-if="itemSearchResults.length === 0 && !itemSearching" class="text-muted text-center p-3" style="height: 318px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <i class="fa fa-search" style="font-size: 24px; opacity: 0.3;"></i>
          <div class="mt-2">Search for items to drag into your recipe</div>
        </div>
        <div v-else class="item-search-grid">
          <div
            v-for="item in pagedSearchResults"
            :key="'search-' + item.id"
            class="item-search-card"
            draggable="true"
            @dragstart="onSearchItemDragStart($event, item)"
          >
            <div class="item-search-card-icon">
              <item-popover :item="item" size="regular" :show-name="false" />
            </div>
            <div class="item-search-card-name">{{ item.Name || item.name }}</div>
            <div class="item-search-card-id">#{{ item.id }}</div>
          </div>
        </div>
        </div>
      </div>
    </eq-window>

    <!-- Item Search Modal (fallback) -->
    <b-modal ref="itemSearchModal" size="xl" hide-footer hide-header body-class="p-0" content-class="bg-transparent border-0">
      <eq-window title="Search Items">
        <item-selector @input="onItemSelected($event)" />
      </eq-window>
    </b-modal>

    <!-- Delete Modal -->
    <b-modal ref="deleteModal" title="Delete Recipe" @ok="deleteRecipe()" ok-variant="danger" ok-title="Delete">
      <p>Delete recipe <strong>{{ recipe.name }}</strong>?</p>
      <p class="text-danger">This will also delete all recipe entries. Cannot be undone.</p>
    </b-modal>
  </content-area>
</template>

<script>
import {ROUTE} from "@/routes";
import {SpireApi} from "@/app/api/spire-api";
import {Items} from "@/app/items";
import ItemPopover from "@/components/ItemPopover";
import ItemSelector from "@/components/selectors/ItemSelector";
import ContentArea from "@/components/layout/ContentArea";
import EqWindow from "@/components/eq-ui/EQWindow";
import ContentFlagSelector from "@/components/selectors/ContentFlagSelector";
import {tradeskillToSlug, slugToTradeskillId} from "./tradeskill-slugs";
import {WORLD_CONTAINERS, STANDARD_CONTAINERS, isWorldContainer, getWorldContainerName, getWorldContainerIcon} from "./world-containers";

export default {
  name: "TradeskillRecipeEdit",
  components: {
    "item-popover": ItemPopover,
    "item-selector": ItemSelector,
    "eq-window": EqWindow,
    "content-area": ContentArea,
    "content-flag-selector": ContentFlagSelector,
  },
  data() {
    return {
      tradeskillId: 0,
      recipeId: null,
      isNew: false,
      cloneNotification: false,
      loading: true,
      saving: false,
      saveMessage: "",
      saveError: false,
      recipe: {
        name: "",
        tradeskill: 0,
        trivial: 0,
        skillneeded: 0,
        nofail: 0,
        quest: 0,
        must_learn: 0,
        enabled: 1,
        learned_by_item_id: 0,
        replace_container: 0,
        content_flags: "",
        content_flags_disabled: "",
        notes: "",
      },
      entries: [],
      itemCache: {},
      learnedByItem: null,
      addingEntryType: "component",
      entriesToDelete: [],
      draggedEntry: null,
      draggedType: null,
      showScrollHint: false,
      learnedBySearch: "",
      learnedByResults: [],
      learnedByHighlight: -1,
      learnedByDebounce: null,
      hasUnsavedChanges: false,
      originalValues: {},
      originalEntryMap: {},
      pendingChanges: { editedFields: {} },
      // Item Search Panel
      itemSearchQuery: "",
      itemSearchResults: [],
      itemSearching: false,
      itemSearchDebounce: null,
      itemSearchPage: 1,
      itemSearchPerPage: 50,
      dropHoverSection: null,
      showStandardContainers: true,
    };
  },
  computed: {
    pagedSearchResults() {
      var start = (this.itemSearchPage - 1) * this.itemSearchPerPage;
      return this.itemSearchResults.slice(start, start + this.itemSearchPerPage);
    },
    itemSearchTotalPages() {
      return Math.ceil(this.itemSearchResults.length / this.itemSearchPerPage);
    },
    tradeskillName() {
      var names = {
        55: "Fishing", 56: "Make Poison", 57: "Tinkering", 58: "Research",
        59: "Alchemy", 60: "Baking", 61: "Tailoring", 63: "Blacksmithing",
        64: "Fletching", 65: "Brewing", 68: "Jewelry Making", 69: "Pottery",
        75: "Quest Combines",
      };
      return names[this.tradeskillId] || "Unknown";
    },
    tradeskillIcon() {
      var icons = {
        55: "ra ra-fish", 56: "ra ra-death-skull", 57: "ra ra-gear-hammer",
        58: "ra ra-book", 59: "ra ra-potion", 60: "ra ra-campfire",
        61: "ra ra-vest", 63: "ra ra-anvil", 64: "ra ra-arrow-flights",
        65: "ra ra-beer", 68: "ra ra-gem-pendant", 69: "ra ra-hand",
        75: "ra ra-scroll-unfurled",
      };
      return icons[this.tradeskillId] || "ra ra-cog";
    },
    maxSkill() {
      return 350;
    },
    componentEntries() {
      return this.entries.filter(e => e.componentcount > 0 && !e.iscontainer);
    },
    successEntries() {
      return this.entries.filter(e => e.successcount > 0 && !e.iscontainer);
    },
    failEntries() {
      return this.entries.filter(e => e.failcount > 0 && !e.iscontainer);
    },
    salvageEntries() {
      return this.entries.filter(e => e.salvagecount > 0 && e.componentcount === 0 && !e.iscontainer);
    },
    containerEntries() {
      return this.entries.filter(e => e.iscontainer === 1);
    },
    relevantContainerGroup() {
      return STANDARD_CONTAINERS[this.tradeskillId] || null;
    },
    otherContainerGroups() {
      var result = {};
      for (var tsId in STANDARD_CONTAINERS) {
        if (parseInt(tsId) !== this.tradeskillId) {
          result[tsId] = STANDARD_CONTAINERS[tsId];
        }
      }
      return result;
    },
  },
  async created() {
    this.tradeskillId = slugToTradeskillId(this.$route.params.tradeskillId);
    const rid = this.$route.params.recipeId;

    if (rid === "new") {
      this.isNew = true;
      this.recipe.tradeskill = this.tradeskillId;
      this.loading = false;

      // Handle clone from existing recipe
      const cloneFrom = this.$route.query.cloneFrom;
      if (cloneFrom) {
        await this.loadCloneSource(parseInt(cloneFrom));
      }
    } else {
      this.recipeId = parseInt(rid);
      await this.loadRecipe();
    }
  },
  mounted() {
    this.$nextTick(() => this.checkScrollOverflow());
    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('beforeunload', this.beforeUnload);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('beforeunload', this.beforeUnload);
  },
  updated() {
    this.$nextTick(() => this.checkScrollOverflow());
  },
  watch: {
    'recipe.learned_by_item_id'(val) {
      if (val > 0) {
        this.loadItem(val).then(item => {
          this.learnedByItem = item;
          if (item && !item._missing) {
            this.learnedBySearch = String(val);
          }
        });
      } else {
        this.learnedByItem = null;
        this.learnedBySearch = "";
      }
    },
  },
  methods: {
    async loadRecipe() {
      this.loading = true;
      try {
        const api = SpireApi.v1();
        const result = await api.get(`tradeskill_recipe/${this.recipeId}`);
        if (result.data) {
          this.recipe = {...this.recipe, ...result.data};
        }

        // Load entries
        const entriesResult = await api.get(`tradeskill_recipe_entries`, {
          params: {where: `recipe_id__${this.recipeId}`, limit: 1000}
        });
        this.entries = (entriesResult.data || []).map(e => ({...e}));

        // Load item details for all entries
        const itemIds = [...new Set(this.entries.map(e => e.item_id))];
        if (this.recipe.learned_by_item_id > 0) {
          itemIds.push(this.recipe.learned_by_item_id);
        }
        await this.loadItems(itemIds);

        if (this.recipe.learned_by_item_id > 0) {
          this.learnedByItem = this.itemCache[this.recipe.learned_by_item_id] || null;
        }
      } catch (e) {
        console.error("Failed to load recipe:", e);
      }
      this.loading = false;
      this.storeOriginalValues();
      this.resetPendingChanges();
    },
    async loadCloneSource(sourceId) {
      this.loading = true;
      try {
        const api = SpireApi.v1();
        const result = await api.get(`tradeskill_recipe/${sourceId}`);
        const source = result.data;
        if (source) {
          this.recipe = {
            ...this.recipe,
            name: (source.name || 'Recipe') + ' (Clone)',
            tradeskill: source.tradeskill,
            skillneeded: source.skillneeded || 0,
            trivial: source.trivial || 0,
            nofail: source.nofail || 0,
            replace_container: source.replace_container || 0,
            notes: source.notes || '',
            must_learn: source.must_learn || 0,
            learned_by_item_id: source.learned_by_item_id || 0,
            quest: source.quest || 0,
            enabled: source.enabled != null ? source.enabled : 1,
            min_expansion: source.min_expansion || -1,
            max_expansion: source.max_expansion || -1,
            content_flags: source.content_flags || '',
            content_flags_disabled: source.content_flags_disabled || '',
          };
        }

        // Load entries from source
        const entriesResult = await api.get(`tradeskill_recipe_entries`, {
          params: {where: `recipe_id__${sourceId}`, limit: 1000}
        });
        this.entries = (entriesResult.data || []).map(e => ({
          ...e,
          recipe_id: 0, // Mark as belonging to new recipe (not yet saved)
        }));

        // Load item details
        const itemIds = [...new Set(this.entries.map(e => e.item_id))];
        if (this.recipe.learned_by_item_id > 0) {
          itemIds.push(this.recipe.learned_by_item_id);
        }
        await this.loadItems(itemIds);

        if (this.recipe.learned_by_item_id > 0) {
          this.learnedByItem = this.itemCache[this.recipe.learned_by_item_id] || null;
        }

        this.cloneNotification = true;
        this.hasUnsavedChanges = true;
      } catch (e) {
        console.error("Failed to load clone source:", e);
      }
      this.loading = false;
    },
    async loadItem(itemId) {
      if (this.itemCache[itemId]) return this.itemCache[itemId];
      try {
        const item = await Items.getItem(itemId);
        if (item && item.id) {
          this.$set(this.itemCache, itemId, item);
          return item;
        }
      } catch (e) { }
      return null;
    },
    async loadItems(itemIds) {
      if (itemIds.length === 0) return;
      // Filter out world container IDs — they don't exist in the items table
      itemIds = itemIds.filter(id => !isWorldContainer(id));
      if (itemIds.length === 0) return;
      try {
        const items = await Items.loadItemsBulk(itemIds);
        if (items) {
          for (const item of items) {
            this.$set(this.itemCache, item.id, item);
          }
        }
        // Retry missing items individually
        const missing = itemIds.filter(id => !this.itemCache[id]);
        for (const id of missing) {
          const item = await this.loadItem(id);
          if (!item) {
            // Mark as missing so template shows a placeholder with name
            this.$set(this.itemCache, id, {id: id, Name: '(Missing Item #' + id + ')', icon: 0, _missing: true});
          }
        }
      } catch (e) {
        // Load individually as fallback
        for (const id of itemIds) {
          if (!this.itemCache[id]) {
            const item = await this.loadItem(id);
            if (!item) {
              this.$set(this.itemCache, id, {id: id, Name: '(Missing Item #' + id + ')', icon: 0, _missing: true});
            }
          }
        }
      }
    },
    handleKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (this.hasUnsavedChanges) this.saveRecipe();
      }
    },
    beforeUnload(e) {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    },
    trackFieldEdit(key, oldVal, newVal) {
      const oldStr = String(oldVal != null ? oldVal : '');
      const newStr = String(newVal != null ? newVal : '');
      if (oldStr === newStr) {
        this.$delete(this.pendingChanges.editedFields, key);
      } else {
        this.$set(this.pendingChanges.editedFields, key, { old: oldVal, new: newVal });
      }
      this.updateHasChanges();
    },
    isFieldEdited(key) {
      return !!this.pendingChanges.editedFields[key];
    },
    updateHasChanges() {
      this.hasUnsavedChanges = Object.keys(this.pendingChanges.editedFields).length > 0
        || this.entriesToDelete.length > 0
        || this.entries.some(e => e._isNew || e._pendingDelete || this.isEntryModified(e));
    },
    resetPendingChanges() {
      this.pendingChanges = { editedFields: {} };
      this.hasUnsavedChanges = false;
    },
    storeOriginalValues() {
      this.originalValues = {
        name: this.recipe.name,
        trivial: this.recipe.trivial,
        skillneeded: this.recipe.skillneeded,
        nofail: this.recipe.nofail,
        quest: this.recipe.quest,
        must_learn: this.recipe.must_learn,
        enabled: this.recipe.enabled,
        learned_by_item_id: this.recipe.learned_by_item_id,
        replace_container: this.recipe.replace_container,
        content_flags: this.recipe.content_flags || '',
        content_flags_disabled: this.recipe.content_flags_disabled || '',
        notes: this.recipe.notes || '',
      };
      this.originalEntryMap = {};
      for (const e of this.entries) {
        if (e.id) {
          this.originalEntryMap[e.id] = {
            item_id: e.item_id,
            componentcount: e.componentcount || 0,
            successcount: e.successcount || 0,
            failcount: e.failcount || 0,
            salvagecount: e.salvagecount || 0,
            iscontainer: e.iscontainer || 0,
          };
        }
      }
    },
    isEntryModified(entry) {
      if (!entry || !entry.id || !this.originalEntryMap[entry.id] || entry._pendingDelete) return false;
      const o = this.originalEntryMap[entry.id];
      return (entry.item_id !== o.item_id)
        || ((entry.componentcount || 0) !== (o.componentcount || 0))
        || ((entry.successcount || 0) !== (o.successcount || 0))
        || ((entry.failcount || 0) !== (o.failcount || 0))
        || ((entry.salvagecount || 0) !== (o.salvagecount || 0))
        || ((entry.iscontainer || 0) !== (o.iscontainer || 0));
    },
    entryRowClass(entry) {
      if (entry._pendingDelete) return 'entry-pending-delete';
      if (entry._isNew) return 'entry-pending-add';
      if (this.isEntryModified(entry)) return 'entry-pending-edit';
      return '';
    },
    confirmReset() {
      if (confirm('Discard all pending changes?')) {
        Object.assign(this.recipe, { ...this.originalValues });
        this.loadRecipe();
      }
    },
    onLearnedByInput() {
      clearTimeout(this.learnedByDebounce);
      const val = this.learnedBySearch.trim();
      if (!val || val.length < 2) {
        this.learnedByResults = [];
        return;
      }
      // If it's a number, try loading by ID
      if (/^\d+$/.test(val)) {
        this.loadItem(parseInt(val)).then(item => {
          if (item && !item._missing) {
            this.learnedByResults = [item];
            this.learnedByHighlight = 0;
          } else {
            this.learnedByResults = [];
          }
        });
        return;
      }
      this.learnedByDebounce = setTimeout(async () => {
        try {
          const api = SpireApi.v1();
          const r = await api.get('items', {
            params: { where: `Name_like_${val}`, limit: 15, orderBy: 'Name', orderDirection: 'asc', select: 'id,Name,icon' }
          });
          this.learnedByResults = r.data || [];
          this.learnedByHighlight = 0;
        } catch (e) {
          this.learnedByResults = [];
        }
      }, 300);
    },
    selectLearnedByItem(item) {
      if (!item) return;
      this.recipe.learned_by_item_id = item.id;
      this.$set(this.itemCache, item.id, item);
      this.learnedByItem = item;
      this.learnedBySearch = String(item.id);
      this.learnedByResults = [];
    },
    clearLearnedBy() {
      this.recipe.learned_by_item_id = 0;
      this.learnedByItem = null;
      this.learnedBySearch = "";
      this.learnedByResults = [];
    },
    checkScrollOverflow() {
      const el = this.$refs.entriesScroll;
      if (!el) return;
      this.showScrollHint = el.scrollHeight > el.clientHeight && 
        (el.scrollHeight - el.scrollTop - el.clientHeight) > 30;
    },
    onEntriesScroll() {
      this.checkScrollOverflow();
    },
    scrollToBottom() {
      const el = this.$refs.entriesScroll;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    },
    // --- Count Stepper ---
    incrementCount(entry, field) {
      entry[field] = (entry[field] || 0) + 1;
      this.updateHasChanges();
    },
    decrementCount(entry, field) {
      if (entry[field] > 1) {
        entry[field] = entry[field] - 1;
        this.updateHasChanges();
      }
    },
    // --- World Containers ---
    isWorldContainer(itemId) {
      return isWorldContainer(itemId);
    },
    getWorldContainerName(itemId) {
      return getWorldContainerName(itemId);
    },
    getWorldContainerIcon(itemId) {
      return getWorldContainerIcon(itemId);
    },
    addWorldContainer(containerId) {
      // Check if this container is already added
      var existing = this.entries.find(e => e.iscontainer === 1 && e.item_id === containerId);
      if (existing) return;

      var newEntry = {
        id: null,
        recipe_id: this.recipeId || 0,
        item_id: containerId,
        componentcount: 0,
        successcount: 0,
        failcount: 0,
        salvagecount: 0,
        iscontainer: 1,
        _isNew: true,
      };
      this.entries.push(newEntry);
      this.updateHasChanges();
    },
    // --- Item Search Panel ---
    onItemSearchInput() {
      clearTimeout(this.itemSearchDebounce);
      this.itemSearchDebounce = setTimeout(() => {
        if (this.itemSearchQuery.trim().length >= 2) {
          this.searchItems();
        }
      }, 350);
    },
    async searchItems() {
      const q = this.itemSearchQuery.trim();
      if (!q) return;
      this.itemSearching = true;
      this.itemSearchPage = 1;
      try {
        const api = SpireApi.v1();
        var params = {};
        if (/^\d+$/.test(q)) {
          params = { where: 'id__' + q, limit: 100 };
        } else {
          params = { where: 'Name_like_' + q, limit: 100 };
        }
        const r = await api.get('items', { params: params });
        if (r && r.data) {
          this.itemSearchResults = Array.isArray(r.data) ? r.data : [];
          // Cache all results
          for (const item of this.itemSearchResults) {
            this.$set(this.itemCache, item.id, item);
          }
        }
      } catch (e) {
        console.error('Item search error:', e);
      }
      this.itemSearching = false;
    },
    onSearchItemDragStart(event, item) {
      event.dataTransfer.setData('application/x-spire-item', JSON.stringify({ id: item.id, name: item.Name || item.name }));
      event.dataTransfer.effectAllowed = 'copy';
    },
    onSectionDragOver(event, section) {
      if (event.dataTransfer.types.includes('application/x-spire-item')) {
        event.dataTransfer.dropEffect = 'copy';
        this.dropHoverSection = section;
      }
    },
    onSectionDragLeave(section) {
      if (this.dropHoverSection === section) {
        this.dropHoverSection = null;
      }
    },
    onSectionDrop(event, section) {
      this.dropHoverSection = null;
      var data = event.dataTransfer.getData('application/x-spire-item');
      if (!data) return;
      try {
        var itemData = JSON.parse(data);
        if (!itemData || !itemData.id) return;

        var newEntry = {
          id: null,
          recipe_id: this.recipeId || 0,
          item_id: itemData.id,
          componentcount: 0,
          successcount: 0,
          failcount: 0,
          salvagecount: 0,
          iscontainer: 0,
          _isNew: true,
        };

        switch (section) {
          case 'component': newEntry.componentcount = 1; break;
          case 'success': newEntry.successcount = 1; break;
          case 'fail': newEntry.failcount = 1; break;
          case 'salvage': newEntry.salvagecount = 1; break;
          case 'container': newEntry.iscontainer = 1; break;
        }

        this.entries.push(newEntry);
        this.updateHasChanges();
      } catch (e) {
        console.error('Drop parse error:', e);
      }
    },
    // --- End Item Search Panel ---
    onDragStart(entry, type) {
      this.draggedEntry = entry;
      this.draggedType = type;
    },
    onDrop(targetEntry, targetType) {
      if (!this.draggedEntry || this.draggedType !== targetType || this.draggedEntry === targetEntry) {
        return;
      }

      const sourceIdx = this.entries.findIndex(e => e === this.draggedEntry);
      const targetIdx = this.entries.findIndex(e => e === targetEntry);
      if (sourceIdx < 0 || targetIdx < 0) return;

      const moved = this.entries.splice(sourceIdx, 1)[0];
      this.entries.splice(targetIdx, 0, moved);

      this.draggedEntry = null;
      this.draggedType = null;
    },
    showItemSearch(type) {
      this.addingEntryType = type;
      this.$refs.itemSearchModal.show();
    },
    onItemSelected(item) {
      if (!item || !item.id) return;

      // Cache the item
      this.$set(this.itemCache, item.id, item);

      const newEntry = {
        id: null, // new entry
        recipe_id: this.recipeId || 0,
        item_id: item.id,
        componentcount: 0,
        successcount: 0,
        failcount: 0,
        salvagecount: 0,
        iscontainer: 0,
        _isNew: true,
      };

      switch (this.addingEntryType) {
        case "component":
          newEntry.componentcount = 1;
          break;
        case "success":
          newEntry.successcount = 1;
          break;
        case "fail":
          newEntry.failcount = 1;
          break;
        case "salvage":
          newEntry.salvagecount = 1;
          break;
        case "container":
          newEntry.iscontainer = 1;
          break;
      }

      this.entries.push(newEntry);
      this.updateHasChanges();
      this.$refs.itemSearchModal.hide();
    },
    removeEntry(entry, type) {
      const idx = this.entries.indexOf(entry);
      if (idx < 0) return;

      if (entry.id) {
        if (entry._pendingDelete) {
          entry._pendingDelete = false;
          this.entriesToDelete = this.entriesToDelete.filter(id => id !== entry.id);
        } else {
          this.$set(entry, '_pendingDelete', true);
          if (!this.entriesToDelete.includes(entry.id)) {
            this.entriesToDelete.push(entry.id);
          }
        }
      } else {
        this.entries.splice(idx, 1);
      }
      this.updateHasChanges();
    },
    async saveRecipe() {
      this.saving = true;
      this.saveMessage = "";
      this.saveError = false;

      try {
        const api = SpireApi.v1();
        let recipeId = this.recipeId;

        // Save recipe
        const recipeData = {
          name: this.recipe.name,
          tradeskill: this.recipe.tradeskill,
          trivial: this.recipe.trivial,
          skillneeded: this.recipe.skillneeded,
          nofail: this.recipe.nofail,
          quest: this.recipe.quest,
          must_learn: this.recipe.must_learn,
          enabled: this.recipe.enabled,
          learned_by_item_id: this.recipe.learned_by_item_id || 0,
          replace_container: this.recipe.replace_container,
          content_flags: this.recipe.content_flags || "",
          content_flags_disabled: this.recipe.content_flags_disabled || "",
          notes: this.recipe.notes || "",
        };

        if (this.isNew) {
          const result = await api.put(`tradeskill_recipe`, recipeData);
          if (result.data && result.data.length > 0) {
            recipeId = result.data[0].id;
            this.recipeId = recipeId;
            this.recipe.id = recipeId;
            this.isNew = false;
            window.history.replaceState({}, '', `/tradeskills/${tradeskillToSlug(this.tradeskillId)}/recipe/${recipeId}`);
          }
        } else {
          await api.patch(`tradeskill_recipe/${recipeId}`, {...recipeData, id: recipeId});
        }

        // Delete removed entries
        for (const entryId of this.entriesToDelete) {
          try {
            await api.delete(`tradeskill_recipe_entry/${entryId}`);
          } catch (e) {
            console.warn("Failed to delete entry:", entryId, e);
          }
        }
        this.entriesToDelete = [];

        // Save entries (skip pending deletes)
        for (const entry of this.entries) {
          if (entry._pendingDelete) continue;
          const entryData = {
            recipe_id: recipeId,
            item_id: entry.item_id,
            componentcount: entry.componentcount || 0,
            successcount: entry.successcount || 0,
            failcount: entry.failcount || 0,
            salvagecount: entry.salvagecount || 0,
            iscontainer: entry.iscontainer || 0,
          };

          if (entry._isNew || !entry.id) {
            const result = await api.put(`tradeskill_recipe_entry`, entryData);
            if (result.data && result.data.length > 0) {
              entry.id = result.data[0].id;
              delete entry._isNew;
            }
          } else {
            await api.patch(`tradeskill_recipe_entry/${entry.id}`, {...entryData, id: entry.id});
          }
        }

        this.entries = this.entries.filter(e => !e._pendingDelete).map(e => {
          delete e._pendingDelete;
          return e;
        });
        this.saveMessage = "Saved successfully!";
        this.storeOriginalValues();
        this.resetPendingChanges();
        setTimeout(() => { this.saveMessage = ""; }, 3000);
      } catch (e) {
        console.error("Save failed:", e);
        this.saveMessage = "Save failed: " + (e.message || "Unknown error");
        this.saveError = true;
      }
      this.saving = false;
    },
    confirmDelete() {
      this.$refs.deleteModal.show();
    },
    async deleteRecipe() {
      try {
        const api = SpireApi.v1();
        await api.delete(`tradeskill_recipe/${this.recipeId}`);
        this.goBack();
      } catch (e) {
        console.error("Delete failed:", e);
      }
    },
    goBack() {
      this.$router.push({path: `/tradeskills/${tradeskillToSlug(this.tradeskillId)}`});
    },
  },
};
</script>

<style>
.clone-notification {
  background: rgba(33, 150, 243, 0.15);
  border: 1px solid rgba(33, 150, 243, 0.4);
  border-radius: 6px;
  padding: 10px 16px;
  color: #bbdefb;
  font-size: 0.9em;
}
.recipe-entries-wrapper {
  position: relative;
}
.scroll-hint-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(transparent, rgba(15, 15, 25, 0.95));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
  cursor: pointer;
  pointer-events: auto;
  z-index: 5;
}
.scroll-hint-arrow {
  color: #e8c56d;
  font-size: 18px;
  animation: pulse-bounce 1.5s ease-in-out infinite;
}
@keyframes pulse-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.6; }
  50% { transform: translateY(5px); opacity: 1; }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
.recipe-entries-scroll {
  max-height: 600px;
  overflow-y: auto;
}
.recipe-entries-scroll::-webkit-scrollbar {
  width: 6px;
}
.recipe-entries-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
.recipe-entries-scroll::-webkit-scrollbar-thumb {
  background: rgba(200, 180, 120, 0.3);
  border-radius: 3px;
}
.recipe-entries-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(200, 180, 120, 0.5);
}
.entry-scroll-area {
  max-height: 280px;
  overflow-y: auto;
}
.entry-scroll-area::-webkit-scrollbar {
  width: 6px;
}
.entry-scroll-area::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
.entry-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(200, 180, 120, 0.3);
  border-radius: 3px;
}
.entry-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(200, 180, 120, 0.5);
}
.skill-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  outline: none;
}
.skill-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e8c56d;
  cursor: pointer;
  border: 2px solid rgba(0, 0, 0, 0.3);
}
.skill-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e8c56d;
  cursor: pointer;
  border: 2px solid rgba(0, 0, 0, 0.3);
}
.learned-by-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1050;
  background: rgba(20, 20, 35, 0.98);
  border: 1px solid rgba(200, 180, 120, 0.3);
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 250px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}
.learned-by-item {
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.learned-by-item:hover,
.learned-by-item.highlighted {
  background: rgba(200, 180, 120, 0.15);
}
.entry-row {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
}
.entry-row:hover {
  background: rgba(0, 0, 0, 0.5);
}
.entry-pending-add {
  background: rgba(40, 167, 69, 0.18) !important;
  border-color: rgba(40, 167, 69, 0.65) !important;
}
.entry-pending-delete {
  background: rgba(220, 53, 69, 0.18) !important;
  border-color: rgba(220, 53, 69, 0.65) !important;
  opacity: 0.85;
}
.entry-pending-edit {
  background: rgba(255, 165, 0, 0.14) !important;
  border-color: rgba(255, 165, 0, 0.6) !important;
}
.pending-edit {
  background-color: rgba(255, 165, 0, 0.15) !important;
  border-color: rgba(255, 165, 0, 0.5) !important;
  box-shadow: 0 0 0 1px rgba(255, 165, 0, 0.3);
}
.pending-edit-slider {
  filter: hue-rotate(30deg) brightness(1.2);
}
.pending-edit-check {
  background: rgba(255, 165, 0, 0.15);
  border-radius: 4px;
}
.save-btn-glow {
  animation: save-glow 1.5s ease-in-out infinite;
}
@keyframes save-glow {
  0%, 100% { box-shadow: 0 0 4px rgba(255, 100, 0, 0.3); }
  50% { box-shadow: 0 0 12px rgba(255, 100, 0, 0.7); }
}

/* Mobile Responsive */
/* Ensure recipe properties table doesn't overflow */
.eq-table {
  width: 100%;
}
.eq-table td:nth-child(2) {
  overflow: visible;
}
.eq-table .d-flex.align-items-center {
  flex-wrap: wrap;
}
.eq-table .skill-slider {
  min-width: 60px;
}

@media (max-width: 991px) {
  .eq-table td:first-child {
    width: 90px !important;
    font-size: 12px;
  }
  .entry-row .d-flex {
    flex-wrap: wrap;
    gap: 4px;
  }
  .item-search-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }
}
@media (max-width: 576px) {
  .eq-table td:first-child {
    width: 75px !important;
    font-size: 11px;
  }
  .eq-table input.form-control-sm,
  .eq-table textarea.form-control-sm {
    font-size: 12px;
  }
  .item-search-grid {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  }
  .tradeskill-icon-badge {
    font-size: 24px;
    top: 8px;
    right: 10px;
  }
}

/* Tradeskill Icon Badge */
.tradeskill-icon-badge {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 32px;
  color: #e8c56d;
  pointer-events: none;
}

/* Item Search Panel */
.item-search-panel {
}
.item-search-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  height: 318px;
  overflow-y: auto;
  padding-bottom: 8px;
}
.item-search-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  padding: 8px 8px 24px 8px;
  background: rgba(30, 30, 45, 0.6);
  border: 1px solid rgba(200, 180, 120, 0.15);
  border-radius: 4px;
  max-height: 95px;
  overflow: hidden;
  cursor: grab;
  transition: all 0.15s ease;
  min-height: 100px;
}
.item-search-card-icon {
  margin-bottom: 4px;
}
/* Hide the inline name from ItemPopover — we render our own */
.item-search-card-icon > div > div > span:nth-child(2) {
  display: none !important;
}
.item-search-card-name {
  font-size: 11px;
  color: #e0d8c8;
  line-height: 1.2;
  word-break: break-word;
}
.item-search-card:hover {
  background: rgba(50, 50, 70, 0.8);
  border-color: rgba(200, 180, 120, 0.4);
  box-shadow: 0 0 8px rgba(200, 180, 120, 0.2);
}
.item-search-card:active {
  cursor: grabbing;
}
.item-search-card-id {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 10px;
  color: #888;
  background: rgba(0, 0, 0, 0.5);
  padding: 1px 6px;
  border-radius: 10px;
}

/* Count Stepper */
.count-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(200, 180, 120, 0.25);
  border-radius: 4px;
  overflow: hidden;
}
.count-btn {
  background: rgba(200, 180, 120, 0.1);
  border: none;
  color: #e8c56d;
  width: 28px !important;
  height: 28px !important;
  font-size: 11px !important;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0 !important;
  margin: 0;
  text-align: center;
  line-height: 28px !important;
  vertical-align: middle;
}
.count-btn:hover:not(:disabled) {
  background: rgba(200, 180, 120, 0.3);
  color: #ffd966;
}
.count-btn .fa {
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
}
.count-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.count-btn-minus {
  border-right: 1px solid rgba(200, 180, 120, 0.2);
}
.count-btn-plus {
  border-left: 1px solid rgba(200, 180, 120, 0.2);
}
.count-input {
  width: 44px;
  height: 28px;
  background: rgba(20, 20, 35, 0.9);
  border: none;
  color: #e0d8c8;
  text-align: center;
  font-size: 13px;
  -moz-appearance: textfield;
}
.count-input::-webkit-outer-spin-button,
.count-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.count-input:focus {
  outline: none;
  background: rgba(30, 30, 50, 0.9);
}

/* Empty section compact */
.drop-section.empty-drop-section {
  padding: 2px 6px !important;
  margin-bottom: 4px !important;
}
.drop-section.empty-drop-section .entry-scroll-area {
  display: none;
}

/* Item Search Modal EQ Theme */
.modal-content.bg-transparent {
  background: transparent !important;
  box-shadow: none !important;
}
.modal-content .mt-3.p-0 {
  height: 72vh !important;
}
.modal-content .item-table th:nth-child(2),
.modal-content .item-table td:nth-child(2) {
  width: 100px !important;
  min-width: 100px;
}

/* Standard Containers Dropdown */
.drop-section .b-dropdown .dropdown-menu {
  max-height: 400px;
  overflow-y: auto;
  background: #1a1a2e;
  border: 1px solid rgba(200, 180, 120, 0.3);
  min-width: 280px;
  z-index: 9999;
}
.drop-section .b-dropdown .dropdown-menu .dropdown-header {
  color: #e8c56d;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 16px 4px;
}
.drop-section .b-dropdown .dropdown-menu .dropdown-item {
  color: #c8c0b0;
  font-size: 13px;
  padding: 4px 16px;
}
.drop-section .b-dropdown .dropdown-menu .dropdown-item:hover {
  background: rgba(200, 180, 120, 0.15);
  color: #e0d8c8;
}
.drop-section .b-dropdown .dropdown-menu .dropdown-divider {
  border-color: rgba(255, 255, 255, 0.08);
}

/* Drop zone highlighting */
.drop-section {
  border-radius: 6px;
  border: 2px solid transparent;
  padding: 6px;
  transition: all 0.2s ease;
}
.drop-section.drop-hover {
  border-color: rgba(255, 193, 7, 0.6);
  background: rgba(255, 193, 7, 0.08);
  box-shadow: inset 0 0 12px rgba(255, 193, 7, 0.1);
}
</style>
