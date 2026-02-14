<template>
  <div v-if="ability && abilityParams" id="special-abilities" class="npc-sa-editor">
    <!-- Search & Active Count -->
    <div class="d-flex align-items-center mb-3">
      <div class="position-relative flex-grow-1 mr-3">
        <input
          type="text"
          class="form-control form-control-sm"
          placeholder="Search abilities..."
          v-model="searchFilter"
          style="padding-left: 26px;"
        >
        <i class="fa fa-search" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);opacity:0.4;font-size:12px;"></i>
      </div>
      <span class="badge badge-primary" style="font-size: 0.85rem;">
        {{ activeCount }} active
      </span>
    </div>

    <!-- Category Sections -->
    <div v-for="cat in filteredCategories" :key="cat.key" class="sa-category mb-2">
      <div
        class="sa-category-header d-flex align-items-center justify-content-between p-2"
        @click="toggleCategory(cat.key)"
        style="cursor:pointer; border-radius: 4px;"
      >
        <div>
          <span class="mr-2">{{ cat.icon }}</span>
          <strong>{{ cat.name }}</strong>
          <span class="badge badge-secondary ml-2" v-if="categoryActiveCount(cat) > 0">
            {{ categoryActiveCount(cat) }}
          </span>
        </div>
        <i :class="openCategories[cat.key] ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" style="opacity:0.5;"></i>
      </div>

      <div v-show="openCategories[cat.key]" class="sa-category-body p-2">
        <!-- Parameterized abilities (cards) -->
        <div v-for="ab in filteredParamAbilities(cat)" :key="'p'+ab.id" class="sa-card mb-2 p-2">
          <div class="d-flex align-items-center">
            <eq-checkbox
              class="d-inline-block mr-2"
              v-model.number="ability[ab.id]"
              @input="calculateSpecialAbilities"
            />
            <strong style="user-select:none;">{{ ab.name }}</strong>
            <!-- Summon uses a select instead of checkbox -->
            <select
              v-if="ab.id === 1"
              class="form-control form-control-sm ml-2"
              style="width:200px;"
              v-model="ability[1]"
              @change="calculateSpecialAbilities"
            >
              <option value="0">Off</option>
              <option value="1">Summon target to NPC</option>
              <option value="2">Summon NPC to target</option>
            </select>
          </div>
          <div v-if="parseInt(ability[ab.id]) > 0 && ab.params && ab.params.length" class="sa-params mt-2 pl-4">
            <div class="row">
              <div v-for="(p, pi) in ab.params" :key="pi" class="col-md-4 col-sm-6 mb-2">
                <label class="sa-param-label mb-0">{{ p.label }}</label>
                <input
                  type="text"
                  class="form-control form-control-sm"
                  :placeholder="p.placeholder"
                  v-model="abilityParams[ab.id][pi]"
                  @change="calculateSpecialAbilities"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Simple checkbox abilities (sorted alphabetically) -->
        <div class="row" v-if="filteredSimpleAbilities(cat).length">
          <div class="col-6 col-md-4 mb-1" v-for="ab in filteredSimpleAbilities(cat)" :key="'s'+ab.id">
            <eq-checkbox
              class="d-inline-block mr-2"
              v-model.number="ability[ab.id]"
              @input="calculateSpecialAbilities"
            />
            <span style="user-select:none;">{{ ab.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Result -->
    <div v-if="showSpecialAbilitiesResult" class="mt-3">
      <h4 class="eq-header">Abilities Result</h4>
      <input
        type="text"
        class="form-control m-wrap span6"
        disabled
        v-model="specialAbilitiesResult"
        style="width:100% !important;"
      >
    </div>
  </div>
</template>

<script>
import EqCheckbox from "../eq-ui/EQCheckbox";

const PARAM_ABILITIES = {
  1: {
    name: "Summon", params: [
      { label: "Cooldown (ms)", placeholder: "6000" },
      { label: "HP % before summon", placeholder: "97" },
    ]
  },
  2: {
    name: "Enrage", params: [
      { label: "HP % to enrage", placeholder: "0" },
      { label: "Duration (ms)", placeholder: "10000" },
      { label: "Cooldown (ms)", placeholder: "360000" },
    ]
  },
  3: {
    name: "Rampage", params: [
      { label: "Proc chance %", placeholder: "20" },
      { label: "Target count", placeholder: "MaxRampageTargets" },
      { label: "% of normal damage", placeholder: "100" },
      { label: "Flat damage bonus", placeholder: "0" },
      { label: "Ignore % armor", placeholder: "0" },
      { label: "Ignore flat armor", placeholder: "0" },
      { label: "% NPC crit against", placeholder: "100" },
      { label: "Flat crit bonus", placeholder: "0" },
    ]
  },
  4: {
    name: "AE Rampage", params: [
      { label: "Proc chance %", placeholder: "20" },
      { label: "Target count (-1 = all)", placeholder: "-1" },
      { label: "% of normal damage", placeholder: "100" },
      { label: "Flat damage bonus", placeholder: "0" },
      { label: "Ignore % armor", placeholder: "0" },
      { label: "Ignore flat armor", placeholder: "0" },
      { label: "% NPC crit against", placeholder: "100" },
      { label: "Flat crit bonus", placeholder: "0" },
    ]
  },
  5: {
    name: "Flurry", params: [
      { label: "Proc chance %", placeholder: "NPCFlurryChance" },
      { label: "Attack count", placeholder: "MaxFlurryHits" },
      { label: "% of normal damage", placeholder: "100" },
      { label: "Flat damage bonus", placeholder: "0" },
      { label: "Ignore % armor", placeholder: "0" },
      { label: "Ignore flat armor", placeholder: "0" },
      { label: "% NPC crit against", placeholder: "100" },
      { label: "Flat crit bonus", placeholder: "0" },
    ]
  },
  11: {
    name: "Ranged Attack", params: [
      { label: "Min range", placeholder: "25" },
      { label: "Max range", placeholder: "250" },
      { label: "% hit chance modifier", placeholder: "0" },
      { label: "% damage modifier", placeholder: "0" },
    ]
  },
  29: {
    name: "Tunnel Vision", params: [
      { label: "Aggro modifier on non-tanks", placeholder: "75" },
    ]
  },
  32: {
    name: "Leash", params: [
      { label: "Range", placeholder: "0" },
    ]
  },
  33: {
    name: "Tether", params: [
      { label: "Aggro range", placeholder: "0" },
    ]
  },
  37: {
    name: "Flee Percent", params: [
      { label: "HP % to flee at", placeholder: "0" },
      { label: "% chance to flee", placeholder: "0" },
    ]
  },
  40: {
    name: "Chase Distance", params: [
      { label: "Max chase distance", placeholder: "0" },
      { label: "Min chase distance", placeholder: "0" },
      { label: "Ignore LoS for chase", placeholder: "0" },
    ]
  },
  41: {
    name: "Allow Tank", params: [
      { label: "Allow NPC to take aggro over client", placeholder: "1" },
    ]
  },
  43: {
    name: "Casting Resist Diff", params: [
      { label: "Innate resist difference", placeholder: "0" },
    ]
  },
  44: {
    name: "Counter Avoid Damage", params: [
      { label: "% reduce all avoidance", placeholder: "0" },
      { label: "% reduce riposte", placeholder: "0" },
      { label: "% reduce block", placeholder: "0" },
      { label: "% reduce parry", placeholder: "0" },
      { label: "% reduce dodge", placeholder: "0" },
    ]
  },
  51: {
    name: "Modify Avoid Damage", params: [
      { label: "% add all avoidance", placeholder: "0" },
      { label: "% add riposte", placeholder: "0" },
      { label: "% add parry", placeholder: "0" },
      { label: "% add block", placeholder: "0" },
      { label: "% add dodge", placeholder: "0" },
    ]
  },
};

const CATEGORIES = [
  {
    key: "combat", icon: "⚔️", name: "Combat",
    abilities: [
      { id: 1, name: "Summon" }, { id: 2, name: "Enrage" }, { id: 3, name: "Rampage" },
      { id: 4, name: "AE Rampage" }, { id: 5, name: "Flurry" }, { id: 6, name: "Triple Attack" },
      { id: 7, name: "Quad Attack" }, { id: 8, name: "Dual Wield" }, { id: 9, name: "Bane Attack" },
      { id: 10, name: "Magic Attack" }, { id: 11, name: "Ranged Attack" }, { id: 39, name: "Disable Melee" },
    ]
  },
  {
    key: "immunities", icon: "🛡️", name: "Immunities",
    abilities: [
      { id: 18, name: "Immune to Dispell" }, { id: 19, name: "Immune to Melee" },
      { id: 20, name: "Immune to Magic" }, { id: 21, name: "Immune to Fleeing" },
      { id: 22, name: "Immune to Non-Bane Melee" }, { id: 23, name: "Immune to Non-Magical Melee" },
      { id: 26, name: "Resist Ranged Spells" }, { id: 27, name: "See through Feign Death" },
      { id: 28, name: "Immune to Taunt" }, { id: 31, name: "Unpacifiable" },
      { id: 46, name: "Immune to Ranged Attacks" }, { id: 47, name: "Immune to Client Damage" },
      { id: 48, name: "Immune to NPC Damage" }, { id: 49, name: "Immune to Client Aggro" },
      { id: 50, name: "Immune to NPC Aggro" }, { id: 52, name: "Immune to Memory Fades" },
      { id: 53, name: "Immune to Open" }, { id: 54, name: "Immune to Assassinate" },
      { id: 55, name: "Immune to Headshot" }, { id: 56, name: "Immune to Bot Aggro" },
      { id: 57, name: "Immune to Bot Damage" },
    ]
  },
  {
    key: "behavior", icon: "🧠", name: "Behavior",
    abilities: [
      { id: 24, name: "Will Not Aggro" }, { id: 25, name: "Immune to Aggro" },
      { id: 29, name: "Tunnel Vision" }, { id: 30, name: "No Buff/Heal Friends" },
      { id: 32, name: "Leash" }, { id: 33, name: "Tether" },
      { id: 34, name: "Destructible Object" }, { id: 35, name: "No Harm from Players" },
      { id: 36, name: "Always Flee" }, { id: 37, name: "Flee Percent" },
      { id: 38, name: "Allow Beneficial" }, { id: 40, name: "Chase Distance" },
      { id: 41, name: "Allow Tank" }, { id: 42, name: "Ignore Root Aggro" },
      { id: 45, name: "Proximity Aggro" },
    ]
  },
  {
    key: "resistances", icon: "🎯", name: "Resistances",
    abilities: [
      { id: 12, name: "Unslowable" }, { id: 13, name: "Unmezable" },
      { id: 14, name: "Uncharmable" }, { id: 15, name: "Unstunnable" },
      { id: 16, name: "Unsnareable" }, { id: 17, name: "Unfearable" },
      { id: 43, name: "Casting Resist Diff" }, { id: 44, name: "Counter Avoid Damage" },
      { id: 51, name: "Modify Avoid Damage" },
    ]
  },
];

// Sort simple abilities alphabetically within each category
CATEGORIES.forEach(cat => {
  const paramIds = new Set(Object.keys(PARAM_ABILITIES).map(Number));
  const simple = cat.abilities.filter(a => !paramIds.has(a.id));
  simple.sort((a, b) => a.name.localeCompare(b.name));
});

export default {
  name: "NpcSpecialAbilities",
  components: { EqCheckbox },
  props: {
    abilities: {
      type: String,
      required: true
    },
    showSpecialAbilitiesResult: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      specialAbilitiesResult: "",
      ability: {},
      abilityParams: null,
      searchFilter: "",
      openCategories: {
        combat: true,
        immunities: true,
        behavior: true,
        resistances: true,
      },
      categories: CATEGORIES,
      paramAbilities: PARAM_ABILITIES,
    }
  },
  computed: {
    activeCount() {
      let count = 0;
      for (let id in this.ability) {
        if (parseInt(this.ability[id]) > 0) count++;
      }
      return count;
    },
    filteredCategories() {
      if (!this.searchFilter.trim()) return this.categories;
      return this.categories.filter(cat => {
        return cat.abilities.some(a =>
          a.name.toLowerCase().includes(this.searchFilter.toLowerCase())
        );
      });
    },
  },
  mounted() {
    this.drawValues();
    this.calculateSpecialAbilities();
  },
  watch: {
    abilities: {
      deep: true,
      handler() {
        this.drawValues();
        this.calculateSpecialAbilities();
      }
    },
  },
  activated() {
    this.calculateSpecialAbilities();
  },
  methods: {
    toggleCategory(key) {
      this.$set(this.openCategories, key, !this.openCategories[key]);
    },
    isParamAbility(id) {
      return !!PARAM_ABILITIES[id];
    },
    filteredParamAbilities(cat) {
      const q = this.searchFilter.toLowerCase().trim();
      return cat.abilities
        .filter(a => this.isParamAbility(a.id))
        .filter(a => !q || a.name.toLowerCase().includes(q))
        .map(a => ({ ...a, params: PARAM_ABILITIES[a.id] ? PARAM_ABILITIES[a.id].params : [] }));
    },
    filteredSimpleAbilities(cat) {
      const q = this.searchFilter.toLowerCase().trim();
      return cat.abilities
        .filter(a => !this.isParamAbility(a.id))
        .filter(a => !q || a.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    categoryActiveCount(cat) {
      let count = 0;
      for (const a of cat.abilities) {
        if (parseInt(this.ability[a.id]) > 0) count++;
      }
      return count;
    },
    drawValues() {
      let abilities = {};
      let params = {};

      for (let i = 0; i <= 200; i++) {
        params[i] = {};
      }

      for (let ability of this.abilities.split("^")) {
        if (ability.length === 0) continue;
        if (ability.split(",").length === 0) continue;

        const abilitySplit = ability.split(",");
        const abilityId = abilitySplit[0].trim();
        const value = abilitySplit[1].trim();

        if (value > 0) {
          abilities[abilityId] = parseInt(value);

          for (let i = 2; i < abilitySplit.length; i++) {
            const val = abilitySplit[i].trim();
            if (typeof params[abilityId] === "undefined") {
              params[abilityId] = {};
            }
            params[abilityId][i - 2] = parseInt(val);
          }
        }
      }

      this.ability = abilities;
      this.abilityParams = params;
    },
    calculateSpecialAbilities() {
      this.$forceUpdate();

      let specialAbilities = [];
      for (let abilityId in this.ability) {
        const value = parseInt(this.ability[abilityId]);
        if (value > 0) {
          let abilityValues = [];
          abilityValues.push(value);

          for (let abilityParamKey in this.abilityParams[abilityId]) {
            const abilityParamValue = this.abilityParams[abilityId][abilityParamKey];
            abilityValues.push(abilityParamValue);
          }

          specialAbilities.push(abilityId + "," + abilityValues.join(","));
        }
      }

      this.specialAbilitiesResult = specialAbilities.join("^");
      this.$emit("update:inputData", this.specialAbilitiesResult);
    }
  }
}
</script>

<style scoped>
.npc-sa-editor {
  font-size: 0.9rem;
}

.sa-category-header {
  background: rgba(255, 255, 255, 0.05);
  transition: background 0.15s;
}

.sa-category-header:hover {
  background: rgba(255, 255, 255, 0.08);
}

.sa-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}

.sa-param-label {
  font-size: 0.78rem;
  opacity: 0.7;
  display: block;
}

.sa-params .form-control-sm {
  font-size: 0.82rem;
}

#special-abilities input,
#special-abilities select {
  margin-top: 0;
  margin-bottom: 0;
}
</style>
