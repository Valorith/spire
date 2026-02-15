<template>
  <content-area>
    <eq-window title="Tradeskill Editor" class="p-3">
      <div class="text-center mb-3">
        <span class="eq-header" style="font-size: 24px;">
          Select a tradeskill to browse and edit recipes
        </span>
      </div>

      <!-- Global Recipe Search -->
      <div class="row justify-content-center mb-3">
        <div class="col-lg-6 col-md-8">
          <div class="search-wrapper" style="position: relative;">
            <div class="input-group">
              <input
                type="text"
                class="form-control"
                placeholder="Search all recipes by name..."
                v-model="globalSearch"
                @input="onSearchInput()"
                @keyup.enter="searchAllRecipes()"
                @keydown.down.prevent="highlightNext()"
                @keydown.up.prevent="highlightPrev()"
                @keydown.enter.prevent="selectHighlighted()"
                @keydown.escape="clearSearch()"
                @blur="onSearchBlur()"
                @focus="showDropdown = searchResults.length > 0"
                ref="searchInput"
              >
              <div class="input-group-append">
                <b-button variant="outline-warning" @click="searchAllRecipes()" :disabled="searching">
                  <i :class="searching ? 'fa fa-spinner fa-spin' : 'fa fa-search'"></i>
                </b-button>
                <b-button variant="outline-danger" @click="clearSearch()" v-if="searchResults.length > 0">
                  <i class="fa fa-times"></i>
                </b-button>
              </div>
            </div>

            <!-- Dropdown Results -->
            <div v-if="showDropdown && searchResults.length > 0" class="search-dropdown">
              <div class="search-dropdown-header">
                <small>{{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}</small>
              </div>
              <div
                v-for="(recipe, idx) in searchResults"
                :key="recipe.id"
                class="search-dropdown-item"
                :class="{ 'highlighted': idx === highlightedIndex }"
                @mousedown.prevent="openRecipe(recipe)"
                @mouseenter="highlightedIndex = idx"
              >
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <span class="font-weight-bold" style="color: #f0e6c8;">{{ recipe.name }}</span>
                    <small class="ml-2" style="color: #a0a0b0;">{{ tradeskillName(recipe.tradeskill) }}</small>
                  </div>
                  <div class="d-flex align-items-center">
                    <small class="text-muted mr-2">Trivial {{ recipe.trivial }}</small>
                    <i :class="recipe.enabled ? 'fa fa-check text-success' : 'fa fa-times text-danger'" style="font-size: 11px;"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="tradeskill-grid">
        <div
          v-for="ts in tradeskills"
          :key="ts.id"
        >
          <div
            class="tradeskill-card text-center d-flex flex-column align-items-center justify-content-center"
            @click="selectTradeskill(ts)"
            :title="ts.name"
          >
            <i :class="ts.icon" style="font-size: 36px; display: block; margin-bottom: 6px; color: #e8c56d;"></i>
            <div class="font-weight-bold" style="font-size: 14px; color: #f0e6c8;">{{ ts.name }}</div>
            <div style="font-size: 12px; color: #a0a0b0;" v-if="ts.count !== null">
              {{ ts.count.toLocaleString() }} recipes
            </div>
            <div style="font-size: 12px; color: #a0a0b0;" v-else>
              <i class="fa fa-spinner fa-spin"></i>
            </div>
          </div>
        </div>
      </div>
    </eq-window>
  </content-area>
</template>

<script>
import {ROUTE} from "@/routes";
import {tradeskillToSlug} from "./tradeskill-slugs";
import {SpireApi} from "@/app/api/spire-api";

const TRADESKILL_MAP = [
  {id: 59, name: "Alchemy", icon: "ra ra-potion"},
  {id: 60, name: "Baking", icon: "ra ra-campfire"},
  {id: 63, name: "Blacksmithing", icon: "ra ra-anvil"},
  {id: 65, name: "Brewing", icon: "ra ra-beer"},
  {id: 55, name: "Fishing", icon: "ra ra-fish"},
  {id: 64, name: "Fletching", icon: "ra ra-arrow-flights"},
  {id: 68, name: "Jewelry Making", icon: "ra ra-gem-pendant"},
  {id: 56, name: "Make Poison", icon: "ra ra-death-skull"},
  {id: 69, name: "Pottery", icon: "ra ra-hand"},
  {id: 75, name: "Quest Combines", icon: "ra ra-scroll-unfurled"},
  {id: 58, name: "Research", icon: "ra ra-book"},
  {id: 61, name: "Tailoring", icon: "ra ra-vest"},
  {id: 57, name: "Tinkering", icon: "ra ra-gear-hammer"},
];

import ContentArea from "@/components/layout/ContentArea";
import EqWindow from "@/components/eq-ui/EQWindow";

export default {
  name: "TradeskillList",
  components: {
    "content-area": ContentArea,
    "eq-window": EqWindow,
  },
  data() {
    return {
      tradeskills: TRADESKILL_MAP.map(ts => ({...ts, count: null})),
      globalSearch: "",
      searchResults: [],
      searching: false,
      showDropdown: false,
      highlightedIndex: -1,
      searchDebounce: null,
    };
  },
  async created() {
    this.loadCounts();
  },
  methods: {
    async loadCounts() {
      const api = SpireApi.v1();
      // Load all counts in parallel
      const promises = this.tradeskills.map(async (ts, idx) => {
        try {
          const r = await api.get(`tradeskill_recipes/count`, {
            params: {where: `tradeskill__${ts.id}`}
          });
          let count = 0;
          if (r && r.data) {
            if (typeof r.data.count === 'number') {
              count = r.data.count;
            } else if (Array.isArray(r.data) && r.data[0]) {
              count = r.data[0].count || 0;
            }
          }
          return {idx, count};
        } catch (e) {
          console.error(`Count failed for ${ts.name} (${ts.id}):`, e);
          return {idx, count: 0};
        }
      });
      const results = await Promise.all(promises);
      for (const {idx, count} of results) {
        this.$set(this.tradeskills[idx], 'count', count);
      }
    },
    selectTradeskill(ts) {
      this.$router.push({path: `/tradeskills/${tradeskillToSlug(ts.id)}`});
    },
    tradeskillName(id) {
      const ts = TRADESKILL_MAP.find(t => t.id === id);
      return ts ? ts.name : 'Unknown (' + id + ')';
    },
    onSearchInput() {
      clearTimeout(this.searchDebounce);
      if (!this.globalSearch || this.globalSearch.trim().length < 2) {
        this.searchResults = [];
        this.showDropdown = false;
        return;
      }
      this.searchDebounce = setTimeout(() => this.searchAllRecipes(), 300);
    },
    async searchAllRecipes() {
      if (!this.globalSearch || this.globalSearch.trim().length < 2) return;
      this.searching = true;
      this.highlightedIndex = -1;
      try {
        const api = SpireApi.v1();
        const r = await api.get('tradeskill_recipes', {
          params: {
            where: `name_like_${this.globalSearch.trim()}`,
            limit: 50,
            orderBy: 'name',
            orderDirection: 'asc',
          }
        });
        this.searchResults = r.data || [];
        this.showDropdown = this.searchResults.length > 0;
      } catch (e) {
        console.error('Global recipe search failed:', e);
        this.searchResults = [];
        this.showDropdown = false;
      }
      this.searching = false;
    },
    clearSearch() {
      this.globalSearch = "";
      this.searchResults = [];
      this.showDropdown = false;
      this.highlightedIndex = -1;
    },
    onSearchBlur() {
      setTimeout(() => { this.showDropdown = false; }, 200);
    },
    highlightNext() {
      if (this.searchResults.length === 0) return;
      this.highlightedIndex = (this.highlightedIndex + 1) % this.searchResults.length;
    },
    highlightPrev() {
      if (this.searchResults.length === 0) return;
      this.highlightedIndex = this.highlightedIndex <= 0
        ? this.searchResults.length - 1
        : this.highlightedIndex - 1;
    },
    selectHighlighted() {
      if (this.highlightedIndex >= 0 && this.highlightedIndex < this.searchResults.length) {
        this.openRecipe(this.searchResults[this.highlightedIndex]);
      } else {
        this.searchAllRecipes();
      }
    },
    openRecipe(recipe) {
      this.$router.push({path: `/tradeskills/${tradeskillToSlug(recipe.tradeskill)}/recipe/${recipe.id}`});
    },
  },
};
</script>

<style scoped>
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1050;
  background: rgba(20, 20, 35, 0.98);
  border: 1px solid rgba(200, 180, 120, 0.3);
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 360px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}
.search-dropdown-header {
  padding: 6px 12px;
  color: #a0a0b0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.search-dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.15s;
}
.search-dropdown-item:hover,
.search-dropdown-item.highlighted {
  background: rgba(200, 180, 120, 0.15);
}
.search-dropdown-item:last-child {
  border-bottom: none;
}
.tradeskill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  max-width: 900px;
  margin: 0 auto;
}
.tradeskill-card {
  background: rgba(15, 15, 25, 0.96);
  border: 1px solid rgba(200, 180, 120, 0.25);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 12px 8px;
  min-height: 100px;
}
.tradeskill-card:hover {
  background: rgba(35, 28, 10, 0.98);
  border-color: rgba(255, 200, 50, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
}
</style>
