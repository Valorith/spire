// Bidirectional mapping between tradeskill IDs and URL slugs
const TRADESKILL_SLUG_MAP = {
  55: "fishing",
  56: "make-poison",
  57: "tinkering",
  58: "research",
  59: "alchemy",
  60: "baking",
  61: "tailoring",
  63: "blacksmithing",
  64: "fletching",
  65: "brewing",
  68: "jewelry-making",
  69: "pottery",
  75: "quest-combines",
};

// Reverse map: slug -> id
const SLUG_TO_ID = {};
for (const [id, slug] of Object.entries(TRADESKILL_SLUG_MAP)) {
  SLUG_TO_ID[slug] = parseInt(id);
}

export function tradeskillToSlug(id) {
  return TRADESKILL_SLUG_MAP[id] || String(id);
}

export function slugToTradeskillId(slug) {
  // Support both slugs and numeric IDs for backwards compatibility
  if (SLUG_TO_ID[slug] !== undefined) return SLUG_TO_ID[slug];
  const num = parseInt(slug);
  return isNaN(num) ? 0 : num;
}

export { TRADESKILL_SLUG_MAP, SLUG_TO_ID };
