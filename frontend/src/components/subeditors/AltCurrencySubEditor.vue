<template>
  <div class="alt-currency-sub-editor" style="display: flex; flex-direction: column; height: 85vh;">
    <eq-window title="Alternate Currency" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">

      <!-- Current Selection -->
      <div v-if="selectedCurrency" style="flex-shrink: 0; padding: 4px 0;">
        <div class="d-flex align-items-center">
          <i class="fa fa-coins text-warning mr-2" style="font-size: 1.2em;"></i>
          <div>
            <div class="text-warning font-weight-bold" style="font-size: 1.05em;">
              {{ selectedCurrency.itemName || 'Currency #' + selectedCurrency.id }}
            </div>
            <div class="mt-1">
              <span class="info-badge mr-1">ID: {{ selectedCurrency.id }}</span>
              <span class="info-badge">Item: {{ selectedCurrency.item_id }}</span>
            </div>
          </div>
        </div>
        <hr class="my-2" style="border-color: rgba(255,255,255,0.1);">
      </div>

      <!-- Currency List -->
      <div style="flex: 1; overflow-y: auto; min-height: 0;">
        <div v-if="loading" class="text-center py-4">
          <i class="fa fa-spinner fa-spin fa-2x text-warning"></i>
          <div class="mt-2 small text-muted">Loading currencies...</div>
        </div>

        <div v-else-if="filteredCurrencies.length === 0 && searchQuery" class="text-center text-muted py-4">
          No currencies match "{{ searchQuery }}"
        </div>

        <div
          v-for="c in filteredCurrencies"
          :key="c.id"
          class="currency-row d-flex align-items-center justify-content-between"
          :class="{ 'currency-active': currencyId == c.id }"
          @click="selectCurrency(c)"
        >
          <div class="d-flex align-items-center" style="min-width: 0;">
            <item-popover v-if="c.item" :item="c.item" size="sm" class="mr-2" />
            <div style="min-width: 0;">
              <div class="currency-name">{{ c.itemName || 'Unknown' }}</div>
              <small class="text-muted">ID: {{ c.id }} · Item: {{ c.item_id }}</small>
            </div>
          </div>
          <div v-if="currencyId == c.id" class="text-success">
            <i class="fa fa-check"></i>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="search-bar" style="flex-shrink: 0;">
        <div class="input-group input-group-sm">
          <div class="input-group-prepend">
            <span class="input-group-text" style="background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15);">
              <i class="fa fa-search" style="color: #aaa;"></i>
            </span>
          </div>
          <input
            type="text"
            class="form-control"
            placeholder="Filter currencies..."
            v-model="searchQuery"
            style="background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15); color: #ddd;"
          >
          <div class="input-group-append" v-if="searchQuery">
            <button class="btn btn-outline-secondary btn-sm" @click="searchQuery = ''"><i class="fa fa-times"></i></button>
          </div>
        </div>
        <div class="mt-2 text-center">
          <button class="btn btn-xs btn-outline-danger" @click="selectNone()" v-if="currencyId > 0">
            <i class="fa fa-times mr-1"></i> Clear Selection (set to 0)
          </button>
        </div>
      </div>
    </eq-window>
  </div>
</template>

<script>
import EqWindow from "../eq-ui/EQWindow";
import ItemPopover from "../ItemPopover";
import {SpireApi} from "../../app/api/spire-api";
import {AlternateCurrencyApi} from "../../app/api/api/alternate-currency-api";
import {SpireQueryBuilder} from "../../app/api/spire-query-builder";

export default {
  name: "AltCurrencySubEditor",
  components: { EqWindow, ItemPopover },
  props: {
    currencyId: { type: [Number, String], default: 0 }
  },
  data() {
    return {
      currencies: [],
      loading: false,
      searchQuery: ""
    };
  },
  computed: {
    selectedCurrency() {
      if (!this.currencyId) return null;
      return this.currencies.find(c => c.id == this.currencyId) || null;
    },
    filteredCurrencies() {
      if (!this.searchQuery) return this.currencies;
      const q = this.searchQuery.toLowerCase();
      return this.currencies.filter(c =>
        (c.itemName && c.itemName.toLowerCase().includes(q)) ||
        String(c.id).includes(q) ||
        String(c.item_id).includes(q)
      );
    }
  },
  created() {
    this.loadCurrencies();
  },
  methods: {
    async loadCurrencies() {
      this.loading = true;
      try {
        const api = new AlternateCurrencyApi(...SpireApi.cfg());
        const b = new SpireQueryBuilder();
        b.includes(["Item"]);
        b.limit(200);
        const res = await api.listAlternateCurrencies(b.get());
        this.currencies = (res.data || []).map(c => ({
          ...c,
          itemName: c.item ? (c.item.Name || c.item.name) : 'Unknown #' + c.item_id
        }));
        this.currencies.sort((a, b) => a.id - b.id);
      } catch (e) {
        console.error("Failed to load alternate currencies", e);
        this.currencies = [];
      }
      this.loading = false;
    },
    selectCurrency(c) {
      this.$emit("input", c.id);
    },
    selectNone() {
      this.$emit("input", 0);
    }
  }
};
</script>

<style scoped>
.info-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 0.8em;
  color: #ccc;
}

.currency-row {
  padding: 8px 10px;
  border-radius: 4px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: background 0.15s;
  border: 1px solid transparent;
}

.currency-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.currency-active {
  background: rgba(40, 167, 69, 0.1);
  border-color: rgba(40, 167, 69, 0.3);
}

.currency-name {
  color: #ddd;
  font-weight: 500;
}

.search-bar {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 10px;
  margin-top: 10px;
}
</style>
