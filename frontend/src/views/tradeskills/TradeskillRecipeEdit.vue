<template>
  <div>
    <eq-window :title="isNew ? 'Create New Recipe' : 'Edit Recipe: ' + recipe.name">
      <!-- Top Controls -->
      <div class="row mb-3">
        <div class="col-12">
          <div class="btn-group">
            <b-button size="sm" variant="outline-secondary" @click="goBack()">
              <i class="fa fa-arrow-left"></i> Back to Recipes
            </b-button>
            <b-button size="sm" variant="outline-success" @click="saveRecipe()" :disabled="saving">
              <i :class="saving ? 'fa fa-spinner fa-spin' : 'fa fa-save'"></i> Save
            </b-button>
            <b-button v-if="!isNew" size="sm" variant="outline-danger" @click="confirmDelete()">
              <i class="fa fa-trash"></i> Delete
            </b-button>
          </div>
          <span v-if="saveMessage" class="ml-3" :class="saveError ? 'text-danger' : 'text-success'">
            {{ saveMessage }}
          </span>
        </div>
      </div>

      <!-- Recipe Properties -->
      <div class="row">
        <div class="col-lg-6">
          <eq-window title="Recipe Properties" class="mb-3">
            <table class="eq-table" style="font-size: 14px;">
              <tbody>
                <tr>
                  <td style="width: 140px;" class="font-weight-bold">ID</td>
                  <td>{{ isNew ? '(auto)' : recipe.id }}</td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Name</td>
                  <td>
                    <input type="text" class="form-control form-control-sm" v-model="recipe.name"
                      placeholder="Recipe name">
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Trivial</td>
                  <td>
                    <input type="number" class="form-control form-control-sm" v-model.number="recipe.trivial"
                      style="width: 120px;">
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Skill Needed</td>
                  <td>
                    <input type="number" class="form-control form-control-sm" v-model.number="recipe.skillneeded"
                      style="width: 120px;">
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">No Fail</td>
                  <td>
                    <b-form-checkbox v-model="recipe.nofail" :value="1" :unchecked-value="0" switch>
                      {{ recipe.nofail ? 'Yes' : 'No' }}
                    </b-form-checkbox>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Quest</td>
                  <td>
                    <b-form-checkbox v-model="recipe.quest" :value="1" :unchecked-value="0" switch>
                      {{ recipe.quest ? 'Yes' : 'No' }}
                    </b-form-checkbox>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Must Learn</td>
                  <td>
                    <b-form-checkbox v-model="recipe.must_learn" :value="1" :unchecked-value="0" switch>
                      {{ recipe.must_learn ? 'Yes' : 'No' }}
                    </b-form-checkbox>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Enabled</td>
                  <td>
                    <b-form-checkbox v-model="recipe.enabled" :value="1" :unchecked-value="0" switch>
                      {{ recipe.enabled ? 'Yes' : 'No' }}
                    </b-form-checkbox>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Learned By Item</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <input type="number" class="form-control form-control-sm" v-model.number="recipe.learned_by_item_id"
                        style="width: 120px;" placeholder="Item ID">
                      <item-popover
                        v-if="learnedByItem && recipe.learned_by_item_id > 0"
                        :item="learnedByItem"
                        class="ml-2"
                        size="sm"
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Replace Container</td>
                  <td>
                    <b-form-checkbox v-model="recipe.replace_container" :value="1" :unchecked-value="0" switch>
                      {{ recipe.replace_container ? 'Yes' : 'No' }}
                    </b-form-checkbox>
                  </td>
                </tr>
                <tr>
                  <td class="font-weight-bold">Notes</td>
                  <td>
                    <textarea class="form-control form-control-sm" v-model="recipe.notes" rows="2"
                      placeholder="Optional notes"></textarea>
                  </td>
                </tr>
              </tbody>
            </table>
          </eq-window>
        </div>

        <!-- Recipe Entries (Visual) -->
        <div class="col-lg-6">
          <eq-window title="Recipe Components & Results" class="mb-3">
            <!-- Components (inputs) -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0" style="color: #ffc107;">
                  <i class="ra ra-cog mr-1"></i> Components (Inputs)
                </h6>
                <b-button size="sm" variant="outline-success" @click="showItemSearch('component')">
                  <i class="fa fa-plus"></i> Add
                </b-button>
              </div>
              <div v-if="componentEntries.length === 0" class="text-muted text-center p-2">
                No components added yet.
              </div>
              <div v-for="(entry, idx) in componentEntries" :key="'comp-' + idx" class="entry-row p-2 mb-1" draggable="true" @dragstart="onDragStart(entry, 'component')" @dragover.prevent @drop="onDrop(entry, 'component')">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <item-popover
                      v-if="itemCache[entry.item_id]"
                      :item="itemCache[entry.item_id]"
                      size="sm"
                    />
                    <span v-else class="text-muted">Item #{{ entry.item_id }}</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <div class="mr-2">
                      <small class="text-muted">Count:</small>
                      <input type="number" class="form-control form-control-sm d-inline-block ml-1"
                        v-model.number="entry.componentcount" style="width: 60px;" min="1">
                    </div>
                    <b-button size="sm" variant="outline-danger" @click="removeEntry(entry, 'component')">
                      <i class="fa fa-times"></i>
                    </b-button>
                  </div>
                </div>
              </div>
            </div>

            <hr style="border-color: rgba(255,255,255,0.1);">

            <!-- Success Results (outputs) -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0" style="color: #28a745;">
                  <i class="fa fa-check mr-1"></i> Success Results
                </h6>
                <b-button size="sm" variant="outline-success" @click="showItemSearch('success')">
                  <i class="fa fa-plus"></i> Add
                </b-button>
              </div>
              <div v-if="successEntries.length === 0" class="text-muted text-center p-2">
                No success results added yet.
              </div>
              <div v-for="(entry, idx) in successEntries" :key="'succ-' + idx" class="entry-row p-2 mb-1" draggable="true" @dragstart="onDragStart(entry, 'success')" @dragover.prevent @drop="onDrop(entry, 'success')">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <item-popover
                      v-if="itemCache[entry.item_id]"
                      :item="itemCache[entry.item_id]"
                      size="sm"
                    />
                    <span v-else class="text-muted">Item #{{ entry.item_id }}</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <div class="mr-2">
                      <small class="text-muted">Count:</small>
                      <input type="number" class="form-control form-control-sm d-inline-block ml-1"
                        v-model.number="entry.successcount" style="width: 60px;" min="1">
                    </div>
                    <b-button size="sm" variant="outline-danger" @click="removeEntry(entry, 'success')">
                      <i class="fa fa-times"></i>
                    </b-button>
                  </div>
                </div>
              </div>
            </div>

            <hr style="border-color: rgba(255,255,255,0.1);">

            <!-- Fail Results -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0" style="color: #dc3545;">
                  <i class="fa fa-times mr-1"></i> Fail Results
                </h6>
                <b-button size="sm" variant="outline-success" @click="showItemSearch('fail')">
                  <i class="fa fa-plus"></i> Add
                </b-button>
              </div>
              <div v-if="failEntries.length === 0" class="text-muted text-center p-2">
                No fail results added yet.
              </div>
              <div v-for="(entry, idx) in failEntries" :key="'fail-' + idx" class="entry-row p-2 mb-1" draggable="true" @dragstart="onDragStart(entry, 'fail')" @dragover.prevent @drop="onDrop(entry, 'fail')">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <item-popover
                      v-if="itemCache[entry.item_id]"
                      :item="itemCache[entry.item_id]"
                      size="sm"
                    />
                    <span v-else class="text-muted">Item #{{ entry.item_id }}</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <div class="mr-2">
                      <small class="text-muted">Count:</small>
                      <input type="number" class="form-control form-control-sm d-inline-block ml-1"
                        v-model.number="entry.failcount" style="width: 60px;" min="1">
                    </div>
                    <b-button size="sm" variant="outline-danger" @click="removeEntry(entry, 'fail')">
                      <i class="fa fa-times"></i>
                    </b-button>
                  </div>
                </div>
              </div>
            </div>

            <hr style="border-color: rgba(255,255,255,0.1);">

            <!-- Salvage Results -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0" style="color: #17a2b8;">
                  <i class="ra ra-recycle mr-1"></i> Salvage Results
                </h6>
                <b-button size="sm" variant="outline-success" @click="showItemSearch('salvage')">
                  <i class="fa fa-plus"></i> Add
                </b-button>
              </div>
              <div v-if="salvageEntries.length === 0" class="text-muted text-center p-2">
                No salvage results added yet.
              </div>
              <div v-for="(entry, idx) in salvageEntries" :key="'salv-' + idx" class="entry-row p-2 mb-1" draggable="true" @dragstart="onDragStart(entry, 'salvage')" @dragover.prevent @drop="onDrop(entry, 'salvage')">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <item-popover
                      v-if="itemCache[entry.item_id]"
                      :item="itemCache[entry.item_id]"
                      size="sm"
                    />
                    <span v-else class="text-muted">Item #{{ entry.item_id }}</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <div class="mr-2">
                      <small class="text-muted">Count:</small>
                      <input type="number" class="form-control form-control-sm d-inline-block ml-1"
                        v-model.number="entry.salvagecount" style="width: 60px;" min="1">
                    </div>
                    <b-button size="sm" variant="outline-danger" @click="removeEntry(entry, 'salvage')">
                      <i class="fa fa-times"></i>
                    </b-button>
                  </div>
                </div>
              </div>
            </div>

            <hr style="border-color: rgba(255,255,255,0.1);">

            <!-- Containers -->
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0" style="color: #6c757d;">
                  <i class="ra ra-wooden-crate mr-1"></i> Containers
                </h6>
                <b-button size="sm" variant="outline-success" @click="showItemSearch('container')">
                  <i class="fa fa-plus"></i> Add
                </b-button>
              </div>
              <div v-if="containerEntries.length === 0" class="text-muted text-center p-2">
                No container set (will use any valid container).
              </div>
              <div v-for="(entry, idx) in containerEntries" :key="'cont-' + idx" class="entry-row p-2 mb-1">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <item-popover
                      v-if="itemCache[entry.item_id]"
                      :item="itemCache[entry.item_id]"
                      size="sm"
                    />
                    <span v-else class="text-muted">Item #{{ entry.item_id }}</span>
                  </div>
                  <b-button size="sm" variant="outline-danger" @click="removeEntry(entry, 'container')">
                    <i class="fa fa-times"></i>
                  </b-button>
                </div>
              </div>
            </div>
          </eq-window>
        </div>
      </div>
    </eq-window>

    <!-- Item Search Modal -->
    <b-modal ref="itemSearchModal" title="Search Items" size="xl" hide-footer>
      <item-selector @input="onItemSelected($event)" />
    </b-modal>

    <!-- Delete Modal -->
    <b-modal ref="deleteModal" title="Delete Recipe" @ok="deleteRecipe()" ok-variant="danger" ok-title="Delete">
      <p>Delete recipe <strong>{{ recipe.name }}</strong>?</p>
      <p class="text-danger">This will also delete all recipe entries. Cannot be undone.</p>
    </b-modal>
  </div>
</template>

<script>
import {ROUTE} from "@/routes";
import {SpireApi} from "@/app/api/spire-api";
import {Items} from "@/app/items";
import ItemPopover from "@/components/ItemPopover";
import ItemSelector from "@/components/selectors/ItemSelector";

export default {
  name: "TradeskillRecipeEdit",
  components: {
    "item-popover": ItemPopover,
    "item-selector": ItemSelector,
  },
  data() {
    return {
      tradeskillId: 0,
      recipeId: null,
      isNew: false,
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
        notes: "",
      },
      entries: [],
      itemCache: {},
      learnedByItem: null,
      addingEntryType: "component",
      entriesToDelete: [],
      draggedEntry: null,
      draggedType: null,
    };
  },
  computed: {
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
  },
  async created() {
    this.tradeskillId = parseInt(this.$route.params.tradeskillId) || 0;
    const rid = this.$route.params.recipeId;

    if (rid === "new") {
      this.isNew = true;
      this.recipe.tradeskill = this.tradeskillId;
      this.loading = false;
    } else {
      this.recipeId = parseInt(rid);
      await this.loadRecipe();
    }
  },
  watch: {
    'recipe.learned_by_item_id'(val) {
      if (val > 0) {
        this.loadItem(val).then(item => { this.learnedByItem = item; });
      } else {
        this.learnedByItem = null;
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
      try {
        const items = await Items.loadItemsBulk(itemIds);
        if (items) {
          for (const item of items) {
            this.$set(this.itemCache, item.id, item);
          }
        }
      } catch (e) {
        // Load individually as fallback
        for (const id of itemIds) {
          await this.loadItem(id);
        }
      }
    },
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
      this.$refs.itemSearchModal.hide();
    },
    removeEntry(entry, type) {
      const idx = this.entries.indexOf(entry);
      if (idx >= 0) {
        if (entry.id) {
          this.entriesToDelete.push(entry.id);
        }
        this.entries.splice(idx, 1);
      }
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
          notes: this.recipe.notes || "",
        };

        if (this.isNew) {
          const result = await api.put(`tradeskill_recipe`, recipeData);
          if (result.data && result.data.length > 0) {
            recipeId = result.data[0].id;
            this.recipeId = recipeId;
            this.recipe.id = recipeId;
            this.isNew = false;
            window.history.replaceState({}, '', `/tradeskills/${this.tradeskillId}/recipe/${recipeId}`);
          }
        } else {
          await api.post(`tradeskill_recipe/${recipeId}`, {...recipeData, id: recipeId});
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

        // Save entries
        for (const entry of this.entries) {
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
            await api.post(`tradeskill_recipe_entry/${entry.id}`, {...entryData, id: entry.id});
          }
        }

        this.saveMessage = "Saved successfully!";
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
      this.$router.push({path: `/tradeskills/${this.tradeskillId}`});
    },
  },
};
</script>

<style scoped>
.entry-row {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}
.entry-row:hover {
  background: rgba(255, 255, 255, 0.05);
}
</style>
