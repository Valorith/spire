<template>
  <div>
    <eq-window title="Tradeskill Editor" class="p-3">
      <div class="text-center mb-3">
        <span class="font-weight-bold" style="font-size: 16px;">
          Select a tradeskill to browse and edit recipes
        </span>
      </div>

      <div class="row justify-content-center">
        <div
          v-for="ts in tradeskills"
          :key="ts.id"
          class="col-lg-3 col-md-4 col-sm-6 mb-3"
        >
          <div
            class="tradeskill-card p-3 text-center d-flex flex-column align-items-center justify-content-center"
            @click="selectTradeskill(ts)"
            :title="ts.name"
          >
            <i :class="ts.icon" style="font-size: 42px; display: block; margin-bottom: 8px; color: #e8c56d;"></i>
            <div class="font-weight-bold" style="font-size: 15px; color: #f0e6c8;">{{ ts.name }}</div>
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
  </div>
</template>

<script>
import {ROUTE} from "@/routes";
import {SpireApi} from "@/app/api/spire-api";

const TRADESKILL_MAP = [
  {id: 59, name: "Alchemy", icon: "ra ra-potion"},
  {id: 60, name: "Baking", icon: "ra ra-campfire"},
  {id: 61, name: "Blacksmithing", icon: "ra ra-anvil"},
  {id: 63, name: "Brewing", icon: "ra ra-beer"},
  {id: 55, name: "Fishing", icon: "ra ra-fishing-hook"},
  {id: 64, name: "Fletching", icon: "ra ra-arrow-flights"},
  {id: 65, name: "Jewelcraft", icon: "ra ra-gem-pendant"},
  {id: 56, name: "Make Poison", icon: "ra ra-death-skull"},
  {id: 68, name: "Pottery", icon: "ra ra-hand"},
  {id: 75, name: "Quest Combines", icon: "ra ra-scroll-unfurled"},
  {id: 58, name: "Research", icon: "ra ra-book"},
  {id: 69, name: "Tailoring", icon: "ra ra-vest"},
  {id: 57, name: "Tinkering", icon: "ra ra-gear-hammer"},
];

export default {
  name: "TradeskillList",
  data() {
    return {
      tradeskills: TRADESKILL_MAP.map(ts => ({...ts, count: null})),
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
      this.$router.push({path: `/tradeskills/${ts.id}`});
    },
  },
};
</script>

<style scoped>
.tradeskill-card {
  background: rgba(15, 15, 25, 0.96);
  border: 1px solid rgba(200, 180, 120, 0.25);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 120px;
}
.tradeskill-card:hover {
  background: rgba(35, 28, 10, 0.98);
  border-color: rgba(255, 200, 50, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
}
</style>
