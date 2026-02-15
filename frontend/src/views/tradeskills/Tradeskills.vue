<template>
  <content-area>
    <eq-window :title="tradeskillName + ' Recipes'">
      <!-- Controls -->
      <div class="row mb-3">
        <div class="col-auto d-flex align-items-center pr-0">
          <b-button size="sm" variant="outline-secondary" @click="goBack()" title="Back to Tradeskills">
            <i class="fa fa-arrow-left"></i> Back
          </b-button>
        </div>
        <div class="col-lg-4">
          <input
            type="text"
            class="form-control"
            placeholder="Search recipes by name..."
            v-model="search"
            @keyup.enter="page = 1; loadRecipes()"
            autofocus
          >
        </div>
        <div class="col-lg-2">
          <input
            type="number"
            class="form-control"
            placeholder="Max Trivial"
            v-model.number="maxTrivial"
            @keyup.enter="loadRecipes()"
          >
        </div>
        <div class="col-lg-2">
          <select class="form-control" v-model="sortField" @change="loadRecipes()">
            <option value="name">Sort: Name</option>
            <option value="trivial">Sort: Trivial</option>
            <option value="skillneeded">Sort: Skill Needed</option>
            <option value="id">Sort: ID</option>
          </select>
        </div>
        <div class="col-lg-1">
          <select class="form-control" v-model="sortDir" @change="loadRecipes()">
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
        <div class="col-lg-1">
          <select class="form-control" v-model.number="pageSize" @change="onPageSizeChange()" title="Rows per page">
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
        <div class="col text-right">
          <div class="btn-group">
            <b-button size="sm" variant="outline-danger" @click="resetSearch()" title="Reset">
              <i class="fa fa-eraser"></i> Reset
            </b-button>
            <b-button size="sm" variant="outline-success" @click="createRecipe()" title="New Recipe">
              <i class="fa fa-plus"></i> New Recipe
            </b-button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center p-5">
        <loader-fake-progress/>
      </div>

      <!-- No results -->
      <div v-if="!loading && recipes.length === 0" class="text-center p-5 text-muted">
        No recipes found.
      </div>

      <!-- Recipe Table -->
      <div v-if="!loading && recipes.length > 0" class="tradeskill-table-wrap" style="overflow-y: auto; max-height: 78vh;">
        <table class="eq-table bordered eq-highlight-rows tradeskill-table" style="font-size: 14px;">
          <thead class="eq-table-floating-header">
            <tr>
              <th style="width: 60px;">ID</th>
              <th>Name</th>
              <th style="width: 80px;" class="text-center">Trivial</th>
              <th style="width: 100px;" class="text-center">Skill Needed</th>
              <th style="width: 80px;" class="text-center">No Fail</th>
              <th style="width: 80px;" class="text-center">Quest</th>
              <th style="width: 80px;" class="text-center">Enabled</th>
              <th style="width: 100px;" class="text-center">Components</th>
              <th style="width: 120px;" class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="recipe in recipes"
              :key="recipe.id"
              @click="editRecipe(recipe)"
              class="cursor-pointer"
            >
              <td>{{ recipe.id }}</td>
              <td>
                <span class="font-weight-bold">{{ recipe.name }}</span>
                <span v-if="recipe.must_learn" class="badge badge-info ml-1" style="font-size: 10px;">Must Learn</span>
              </td>
              <td class="text-center">{{ recipe.trivial }}</td>
              <td class="text-center">{{ recipe.skillneeded }}</td>
              <td class="text-center">
                <i :class="recipe.nofail ? 'fa fa-check text-success' : 'fa fa-times text-muted'"></i>
              </td>
              <td class="text-center">
                <i :class="recipe.quest ? 'fa fa-check text-warning' : 'fa fa-times text-muted'"></i>
              </td>
              <td class="text-center">
                <i :class="recipe.enabled ? 'fa fa-check text-success' : 'fa fa-times text-danger'"></i>
              </td>
              <td class="text-center">
                <span v-if="recipe.entryCount !== undefined">{{ recipe.entryCount }}</span>
                <i v-else class="fa fa-spinner fa-spin text-muted"></i>
              </td>
              <td class="text-center" @click.stop>
                <b-button size="sm" variant="outline-warning" @click="editRecipe(recipe)" title="Edit">
                  <i class="fa fa-pencil"></i>
                </b-button>
                <b-button size="sm" variant="outline-danger" @click="confirmDelete(recipe)" title="Delete" class="ml-1">
                  <i class="fa fa-trash"></i>
                </b-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && totalCount > 0" class="text-center mt-3">
        <div class="btn-group">
          <b-button size="sm" variant="outline-secondary" @click="page > 1 && changePage(page - 1)" :disabled="page <= 1">
            <i class="fa fa-chevron-left"></i>
          </b-button>
          <b-button
            v-for="p in visiblePages"
            :key="p"
            size="sm"
            :variant="p === page ? 'warning' : 'outline-secondary'"
            @click="changePage(p)"
          >
            {{ p }}
          </b-button>
          <b-button size="sm" variant="outline-secondary" @click="page < totalPages && changePage(page + 1)" :disabled="page >= totalPages">
            <i class="fa fa-chevron-right"></i>
          </b-button>
        </div>
        <div class="text-muted mt-1" style="font-size: 12px;">
          Page {{ page }} of {{ totalPages }} ({{ totalCount.toLocaleString() }} recipes)
        </div>
      </div>
    </eq-window>

    <!-- Delete Confirmation Modal -->
    <b-modal ref="deleteModal" title="Delete Recipe" @ok="deleteRecipe()" ok-variant="danger" ok-title="Delete">
      <p>Are you sure you want to delete recipe <strong>{{ deleteTarget ? deleteTarget.name : '' }}</strong> (ID: {{ deleteTarget ? deleteTarget.id : '' }})?</p>
      <p class="text-danger">This action cannot be undone.</p>
    </b-modal>
  </content-area>
</template>

<script>
import {ROUTE} from "@/routes";
import {SpireApi} from "@/app/api/spire-api";
import {tradeskillToSlug, slugToTradeskillId} from "./tradeskill-slugs";

const TRADESKILL_NAMES = {
  55: "Fishing", 56: "Make Poison", 57: "Tinkering", 58: "Research",
  59: "Alchemy", 60: "Baking", 61: "Tailoring", 63: "Blacksmithing",
  64: "Fletching", 65: "Brewing", 68: "Jewelry Making", 69: "Pottery",
  75: "Quest Combines",
};

const DEFAULT_PAGE_SIZE = 50;

import ContentArea from "@/components/layout/ContentArea";
import EqWindow from "@/components/eq-ui/EQWindow";

export default {
  name: "Tradeskills",
  components: {
    "content-area": ContentArea,
    "eq-window": EqWindow,
  },
  data() {
    return {
      tradeskillId: 0,
      recipes: [],
      loading: false,
      search: "",
      maxTrivial: null,
      sortField: "name",
      sortDir: "asc",
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      totalCount: 0,
      deleteTarget: null,
    };
  },
  computed: {
    tradeskillName() {
      return TRADESKILL_NAMES[this.tradeskillId] || "Unknown";
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
    },
    visiblePages() {
      const pages = [];
      const start = Math.max(1, this.page - 3);
      const end = Math.min(this.totalPages, this.page + 3);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    },
  },
  watch: {
    '$route.params.tradeskillId': {
      handler(newId) {
        this.tradeskillId = slugToTradeskillId(newId);
        this.page = 1;
        this.loadRecipes();
      },
    },
  },
  async created() {
    this.tradeskillId = slugToTradeskillId(this.$route.params.tradeskillId);
    await this.loadRecipes();
  },
  methods: {
    async loadRecipes() {
      this.loading = true;
      try {
        const api = SpireApi.v1();

        var whereParts = ['tradeskill__' + this.tradeskillId];
        if (this.search) {
          whereParts.push('name_like_' + this.search);
        }
        if (this.maxTrivial) {
          whereParts.push('trivial__lte__' + this.maxTrivial);
        }
        var where = whereParts.join('.');

        // Get count
        try {
          const countResult = await api.get('tradeskill_recipes/count', {
            params: { where: where }
          });
          if (countResult.data) {
            if (Array.isArray(countResult.data)) {
              this.totalCount = (countResult.data[0] && countResult.data[0].count) || 0;
            } else if (typeof countResult.data === 'object' && countResult.data.count != null) {
              this.totalCount = countResult.data.count;
            } else if (typeof countResult.data === 'number') {
              this.totalCount = countResult.data;
            }
          }
        } catch (e) {
          this.totalCount = 0;
        }

        // Get page
        const result = await api.get('tradeskill_recipes', {
          params: {
            where: where,
            limit: this.pageSize,
            page: this.page - 1,
            orderBy: this.sortField,
            orderDirection: this.sortDir,
          }
        });

        this.recipes = (result.data || []).map(r => ({...r, entryCount: undefined}));

        // If page is beyond valid range (empty last page), clamp to last valid page
        if (this.recipes.length === 0 && this.page > 1 && this.totalCount > 0) {
          this.page = this.totalPages;
          this.loading = false;
          return this.loadRecipes();
        }

        this.loading = false;

        // Load entry counts in background
        this.loadEntryCounts();
      } catch (e) {
        console.error("Failed to load recipes:", e);
        this.loading = false;
      }
    },
    async loadEntryCounts() {
      const api = SpireApi.v1();
      for (const recipe of this.recipes) {
        try {
          const r = await api.get(`tradeskill_recipe_entries`, {
            params: {where: `recipe_id__${recipe.id}`, select: "id", limit: 1000}
          });
          this.$set(recipe, 'entryCount', r.data ? r.data.length : 0);
        } catch (e) {
          this.$set(recipe, 'entryCount', 0);
        }
      }
    },
    changePage(p) {
      this.page = p;
      this.loadRecipes();
    },
    onPageSizeChange() {
      this.page = 1;
      this.loadRecipes();
    },
    resetSearch() {
      this.search = "";
      this.maxTrivial = null;
      this.sortField = "name";
      this.sortDir = "asc";
      this.page = 1;
      this.loadRecipes();
    },
    editRecipe(recipe) {
      this.$router.push({path: `/tradeskills/${tradeskillToSlug(this.tradeskillId)}/recipe/${recipe.id}`});
    },
    createRecipe() {
      this.$router.push({path: `/tradeskills/${tradeskillToSlug(this.tradeskillId)}/recipe/new`});
    },
    confirmDelete(recipe) {
      this.deleteTarget = recipe;
      this.$refs.deleteModal.show();
    },
    async deleteRecipe() {
      if (!this.deleteTarget) return;
      try {
        const api = SpireApi.v1();
        await api.delete(`tradeskill_recipe/${this.deleteTarget.id}`);
        this.recipes = this.recipes.filter(r => r.id !== this.deleteTarget.id);
        this.totalCount--;
        this.deleteTarget = null;
      } catch (e) {
        console.error("Delete failed:", e);
      }
    },
    goBack() {
      this.$router.push({path: `/tradeskills`});
    },
  },
};
</script>

<style>
.cursor-pointer {
  cursor: pointer;
}
</style>
