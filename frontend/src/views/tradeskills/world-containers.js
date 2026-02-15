// World containers are in-game crafting objects (not items in the items table).
// IDs 0-60 and 255 are world object IDs that don't exist in the items table.
// Based on PEQ Editor's $world_containers mapping.

export const WORLD_CONTAINERS = {
  0: { name: "Small Bag", icon: "ra ra-round-bottom-flask" },
  1: { name: "Large Bag", icon: "ra ra-round-bottom-flask" },
  2: { name: "Quiver", icon: "ra ra-arrow-flights" },
  3: { name: "Belt Pouch", icon: "ra ra-round-bottom-flask" },
  4: { name: "Wrist Pouch", icon: "ra ra-round-bottom-flask" },
  5: { name: "Backpack", icon: "ra ra-round-bottom-flask" },
  6: { name: "Small Chest", icon: "ra ra-wooden-crate" },
  7: { name: "Large Chest", icon: "ra ra-wooden-crate" },
  8: { name: "Bandolier", icon: "ra ra-round-bottom-flask" },
  9: { name: "Medicine Bag", icon: "ra ra-potion" },
  10: { name: "Tinkering Table", icon: "ra ra-gear-hammer" },
  11: { name: "Lexicon", icon: "ra ra-book" },
  12: { name: "Poison Making Table", icon: "ra ra-death-skull" },
  13: { name: "Quest Container", icon: "ra ra-scroll-unfurled" },
  14: { name: "Mixing Bowl", icon: "ra ra-campfire" },
  15: { name: "Oven", icon: "ra ra-campfire" },
  16: { name: "Loom", icon: "ra ra-vest" },
  17: { name: "Forge", icon: "ra ra-anvil" },
  18: { name: "Fletching Kit", icon: "ra ra-arrow-flights" },
  19: { name: "Brew Barrel", icon: "ra ra-beer" },
  20: { name: "Jeweler's Kit", icon: "ra ra-gem-pendant" },
  21: { name: "Pottery Wheel", icon: "ra ra-hand" },
  22: { name: "Kiln", icon: "ra ra-hand" },
  23: { name: "Keymaker", icon: "ra ra-cog" },
  24: { name: "Wizard Lexicon", icon: "ra ra-book" },
  25: { name: "Magician Lexicon", icon: "ra ra-book" },
  26: { name: "Necromancer Lexicon", icon: "ra ra-book" },
  27: { name: "Enchanter Lexicon", icon: "ra ra-book" },
  28: { name: "Unknown (28)", icon: "ra ra-cog" },
  29: { name: "Research Practice", icon: "ra ra-book" },
  30: { name: "Alchemy Table", icon: "ra ra-potion" },
  31: { name: "High Elf Forge", icon: "ra ra-anvil" },
  32: { name: "Dark Elf Forge", icon: "ra ra-anvil" },
  33: { name: "Ogre Forge", icon: "ra ra-anvil" },
  34: { name: "Dwarf Forge", icon: "ra ra-anvil" },
  35: { name: "Gnome Forge", icon: "ra ra-anvil" },
  36: { name: "Barbarian Forge", icon: "ra ra-anvil" },
  37: { name: "Iksar Forge", icon: "ra ra-anvil" },
  38: { name: "Human Forge (Freeport)", icon: "ra ra-anvil" },
  39: { name: "Human Forge (Qeynos)", icon: "ra ra-anvil" },
  40: { name: "Halfling Tailoring", icon: "ra ra-vest" },
  41: { name: "Halfling Tailoring (Vale)", icon: "ra ra-vest" },
  42: { name: "Erudite Tailoring", icon: "ra ra-vest" },
  43: { name: "Wood Elf Tailoring", icon: "ra ra-vest" },
  44: { name: "Wood Elf Fletching", icon: "ra ra-arrow-flights" },
  45: { name: "Iksar Pottery", icon: "ra ra-hand" },
  46: { name: "Tackle Box", icon: "ra ra-fish" },
  47: { name: "Troll Forge", icon: "ra ra-anvil" },
  48: { name: "Wood Elf Forge", icon: "ra ra-anvil" },
  49: { name: "Halfling Forge", icon: "ra ra-anvil" },
  50: { name: "Erudite Forge", icon: "ra ra-anvil" },
  51: { name: "Merchant", icon: "ra ra-wooden-crate" },
  52: { name: "Froglok Forge", icon: "ra ra-anvil" },
  53: { name: "Augmenter", icon: "ra ra-gem-pendant" },
  54: { name: "Churn", icon: "ra ra-campfire" },
  55: { name: "Transformation Mold", icon: "ra ra-cog" },
  56: { name: "Detransformation Mold", icon: "ra ra-cog" },
  57: { name: "Unattuner", icon: "ra ra-cog" },
  58: { name: "Tradeskill Bag", icon: "ra ra-round-bottom-flask" },
  59: { name: "Collectible Bag", icon: "ra ra-round-bottom-flask" },
  60: { name: "No Deposit", icon: "ra ra-cog" },
  255: { name: "Taanan", icon: "ra ra-cog" },
};

// Standard containers organized by tradeskill, for the quick-select panel.
// Each group has a primary container and optional racial/variant containers.
export const STANDARD_CONTAINERS = {
  63: { // Blacksmithing
    label: "Blacksmithing",
    icon: "ra ra-anvil",
    primary: [
      { id: 17, name: "Forge" },
    ],
    variants: [
      { id: 31, name: "High Elf Forge" },
      { id: 32, name: "Dark Elf Forge" },
      { id: 33, name: "Ogre Forge" },
      { id: 34, name: "Dwarf Forge" },
      { id: 35, name: "Gnome Forge" },
      { id: 36, name: "Barbarian Forge" },
      { id: 37, name: "Iksar Forge" },
      { id: 38, name: "Human Forge (Freeport)" },
      { id: 39, name: "Human Forge (Qeynos)" },
      { id: 47, name: "Troll Forge" },
      { id: 48, name: "Wood Elf Forge" },
      { id: 49, name: "Halfling Forge" },
      { id: 50, name: "Erudite Forge" },
      { id: 52, name: "Froglok Forge" },
    ],
  },
  60: { // Baking
    label: "Baking",
    icon: "ra ra-campfire",
    primary: [
      { id: 15, name: "Oven" },
      { id: 14, name: "Mixing Bowl" },
      { id: 54, name: "Churn" },
    ],
    variants: [],
  },
  61: { // Tailoring
    label: "Tailoring",
    icon: "ra ra-vest",
    primary: [
      { id: 16, name: "Loom" },
    ],
    variants: [
      { id: 40, name: "Halfling Tailoring" },
      { id: 41, name: "Halfling Tailoring (Vale)" },
      { id: 42, name: "Erudite Tailoring" },
      { id: 43, name: "Wood Elf Tailoring" },
    ],
  },
  65: { // Brewing
    label: "Brewing",
    icon: "ra ra-beer",
    primary: [
      { id: 19, name: "Brew Barrel" },
    ],
    variants: [],
  },
  64: { // Fletching
    label: "Fletching",
    icon: "ra ra-arrow-flights",
    primary: [
      { id: 18, name: "Fletching Kit" },
    ],
    variants: [
      { id: 44, name: "Wood Elf Fletching" },
    ],
  },
  68: { // Jewelry Making
    label: "Jewelry Making",
    icon: "ra ra-gem-pendant",
    primary: [
      { id: 20, name: "Jeweler's Kit" },
    ],
    variants: [],
  },
  69: { // Pottery
    label: "Pottery",
    icon: "ra ra-hand",
    primary: [
      { id: 21, name: "Pottery Wheel" },
      { id: 22, name: "Kiln" },
    ],
    variants: [
      { id: 45, name: "Iksar Pottery" },
    ],
  },
  58: { // Research
    label: "Research",
    icon: "ra ra-book",
    primary: [
      { id: 11, name: "Lexicon" },
    ],
    variants: [
      { id: 24, name: "Wizard Lexicon" },
      { id: 25, name: "Magician Lexicon" },
      { id: 26, name: "Necromancer Lexicon" },
      { id: 27, name: "Enchanter Lexicon" },
      { id: 29, name: "Research Practice" },
    ],
  },
  55: { // Fishing
    label: "Fishing",
    icon: "ra ra-fish",
    primary: [
      { id: 46, name: "Tackle Box" },
    ],
    variants: [],
  },
  56: { // Make Poison
    label: "Make Poison",
    icon: "ra ra-death-skull",
    primary: [
      { id: 12, name: "Poison Making Table" },
    ],
    variants: [],
  },
  59: { // Alchemy
    label: "Alchemy",
    icon: "ra ra-potion",
    primary: [
      { id: 9, name: "Medicine Bag" },
      { id: 30, name: "Alchemy Table" },
    ],
    variants: [],
  },
  57: { // Tinkering
    label: "Tinkering",
    icon: "ra ra-gear-hammer",
    primary: [
      { id: 10, name: "Tinkering Table" },
    ],
    variants: [],
  },
  75: { // Quest Combines
    label: "Quest Combines",
    icon: "ra ra-scroll-unfurled",
    primary: [
      { id: 13, name: "Quest Container" },
    ],
    variants: [],
  },
};

// Check if an item_id is a world container (not in the items table)
export function isWorldContainer(itemId) {
  return WORLD_CONTAINERS[itemId] !== undefined;
}

// Get world container name, or null if not a world container
export function getWorldContainerName(itemId) {
  var wc = WORLD_CONTAINERS[itemId];
  return wc ? wc.name : null;
}

// Get world container icon, or default
export function getWorldContainerIcon(itemId) {
  var wc = WORLD_CONTAINERS[itemId];
  return wc ? wc.icon : "ra ra-wooden-crate";
}
