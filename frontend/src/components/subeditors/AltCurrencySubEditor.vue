<template>
  <div class="alt-currency-sub-editor" style="height: 85vh; display: flex; flex-direction: column;">
    <eq-window title="Alternate Currency">

      <!-- Current Selection -->
      <div v-if="selectedCurrency" class="mb-2">
        <div class="d-flex align-items-center">
          <i class="fa fa-coins text-warning mr-2"></i>
          <span class="text-warning font-weight-bold">{{ selectedCurrency.itemName }}</span>
          <span class="info-badge ml-2">ID: {{ selectedCurrency.id }}</span>
        </div>
        <hr class="my-2" style="border-color: rgba(255,255,255,0.1);">
      </div>

      <!-- Scrollable Currency List -->
      <div style="max-height: 55vh; overflow-y: auto;">
        <div v-if="loading" class="text-center py-4">
          <i class="fa fa-spinner fa-spin fa-2x text-warning"></i>
        </div>

        <table v-else class="eq-table eq-highlight-rows w-100" style="font-size: 13px;">
          <thead>
            <tr>
              <th>Currency</th>
              <th class="text-center" style="width: 60px;">ID</th>
              <th style="width: 60px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filteredCurrencies"
              :key="c.id"
              :style="currencyId == c.id ? 'background: rgba(40,167,69,0.15);' : ''"
            >
              <td>
                <item-popover v-if="c.item" :item="c.item" size="sm" />
                <span v-else>{{ c.itemName }}</span>
              </td>
              <td class="text-center text-muted">{{ c.id }}</td>
              <td class="text-center">
                <span v-if="currencyId == c.id" class="text-success"><i class="fa fa-check"></i></span>
                <button v-else class="btn btn-xs btn-outline-success" @click="selectCurrency(c)">Select</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Search + Clear -->
      <div class="mt-2 pt-2" style="border-top: 1px solid rgba(255,255,255,0.1);">
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
        <div class="text-center mt-2" v-if="currencyId > 0">
          <button class="btn btn-xs btn-outline-danger" @click="selectNone()">
            <i class="fa fa-times mr-1"></i> Clear (set to 0)
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
        String(c.id).includes(q)
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
  color: #ddd;
}
</style>
