import { test, expect, Page, Locator } from '@playwright/test';

// ---------------------------------------------------------------------------
// Colour-contrast helpers
// ---------------------------------------------------------------------------

/** Parse "rgb(r, g, b)" or "rgba(r, g, b, a)" into [r, g, b] (0-255). */
function parseRgb(css: string): [number, number, number] {
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) throw new Error(`Cannot parse colour: ${css}`);
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}

/** WCAG relative luminance (0–1) for a single 8-bit channel. */
function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of an [r, g, b] triple. */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG contrast ratio between two colours. */
function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Return the computed foreground colour and the effective background colour
 * (walking up to the first opaque ancestor if the element itself is transparent).
 */
async function getButtonColours(
  locator: Locator,
): Promise<{ fg: [number, number, number]; bg: [number, number, number] }> {
  return locator.evaluate((el: HTMLElement) => {
    const style = window.getComputedStyle(el);
    const fgCss = style.color;

    // Walk up to find first opaque background
    let node: HTMLElement | null = el;
    let bgCss = 'rgb(0, 0, 0)';
    while (node) {
      const bg = window.getComputedStyle(node).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        bgCss = bg;
        break;
      }
      node = node.parentElement;
    }
    return { fgCss, bgCss };
  }).then(({ fgCss, bgCss }) => {
    const parseRgbLocal = (css: string): [number, number, number] => {
      const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) throw new Error(`Cannot parse colour: ${css}`);
      return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    };
    return { fg: parseRgbLocal(fgCss), bg: parseRgbLocal(bgCss) };
  });
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const AA_ABILITIES = [
  { id: 1, name: 'Combat Agility', first_rank_id: 100, category: 1, charges: 0,
    classes: 65535, deities: 131071, drakkin_heritage: 0, enabled: 1,
    grant_only: 0, auto_grant_enabled: 0, races: 65535, reset_on_death: 0,
    status: 0, type: 1 },
  { id: 2, name: 'Combat Stability', first_rank_id: 200, category: 1, charges: 0,
    classes: 65535, deities: 131071, drakkin_heritage: 0, enabled: 1,
    grant_only: 0, auto_grant_enabled: 0, races: 65535, reset_on_death: 0,
    status: 0, type: 1 },
];

const AA_RANKS = [
  { id: 100, cost: 3, desc_sid: 400, expansion: 0, level_req: 51,
    lower_hotkey_sid: 0, next_id: 101, prev_id: -1, recast_time: 0,
    spell: 0, spell_type: 0, title_sid: 300, upper_hotkey_sid: 0 },
  { id: 101, cost: 3, desc_sid: 400, expansion: 0, level_req: 51,
    lower_hotkey_sid: 0, next_id: -1, prev_id: 100, recast_time: 0,
    spell: 0, spell_type: 0, title_sid: 300, upper_hotkey_sid: 0 },
  { id: 200, cost: 3, desc_sid: 402, expansion: 0, level_req: 51,
    lower_hotkey_sid: 0, next_id: -1, prev_id: -1, recast_time: 0,
    spell: 0, spell_type: 0, title_sid: 301, upper_hotkey_sid: 0 },
];

const DB_STRS = [
  // type 1 — AA Name
  { id: 300, type: 1, value: 'Combat Agility' },
  { id: 301, type: 1, value: 'Combat Stability' },
  // type 4 — AA Desc  (include one very long description to exercise width constraint)
  { id: 400, type: 4, value: 'Increases your ability to avoid melee attacks. This ability raises your avoidance skill by a significant amount, allowing you to dodge, parry, and riposte incoming blows with greater frequency. Each successive rank grants a progressively larger bonus.' },
  { id: 402, type: 4, value: 'Increases your ability to absorb damage from melee attacks.' },
];

// ---------------------------------------------------------------------------
// Helper: install API mocks
// ---------------------------------------------------------------------------

async function mockApis(page: Page) {
  // Catch-all first (checked last in LIFO)
  await page.route('**/api/v1/**', route => {
    if (!route.request().isNavigationRequest()) {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else {
      route.continue();
    }
  });

  await page.route('https://api.github.com/**', route => route.abort());

  await page.route('**/api/v1/aa_abilities**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AA_ABILITIES) })
  );

  await page.route('**/api/v1/aa_ranks**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AA_RANKS) })
  );

  await page.route('**/api/v1/db_strs**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DB_STRS) })
  );

  await page.route('**/api/v1/aa_rank_effects**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );

  await page.route('**/api/v1/aa_rank_prereqs**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );

  // App env — registered last = checked first in LIFO
  await page.route('**/api/v1/app/env**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          is_spire_initialized: true,
          env: 'local',
          version: '1.0.0',
          features: {},
          settings: [],
          os: 'linux',
        }
      })
    })
  );
}

async function gotoAaEditor(page: Page) {
  await mockApis(page);
  await page.goto('/aa');
  // Wait for the AA list table to appear
  await page.waitForSelector('#aa-editor-table', { timeout: 20000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('AA Editor — Basic Tab Title & Description', () => {

  test('AA list loads and shows ability rows', async ({ page }) => {
    await gotoAaEditor(page);

    const rows = page.locator('#aa-editor-table tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Combat Agility');
    await expect(rows.nth(1)).toContainText('Combat Stability');
  });

  test('selecting an AA shows the Basic tab', async ({ page }) => {
    await gotoAaEditor(page);

    await page.locator('#aa-editor-table tbody tr').nth(0).click();

    // The right panel title bar updates to include the ability name
    await expect(page.locator('.eq-window-title-bar').filter({ hasText: 'Combat Agility' })).toBeVisible({ timeout: 10000 });
  });

  test('Basic tab shows Title field resolved from dbstr type 1', async ({ page }) => {
    await gotoAaEditor(page);

    await page.locator('#aa-editor-table tbody tr').nth(0).click();

    // Wait for ranks to load (title field becomes visible)
    const titleInput = page.locator('input[placeholder="(no title)"]');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await expect(titleInput).toHaveValue('Combat Agility');
  });

  test('Basic tab shows Description field resolved from dbstr type 4', async ({ page }) => {
    await gotoAaEditor(page);

    await page.locator('#aa-editor-table tbody tr').nth(0).click();

    const descTextarea = page.locator('textarea[placeholder="(no description)"]');
    await expect(descTextarea).toBeVisible({ timeout: 10000 });
    await expect(descTextarea).toHaveValue('Increases your ability to avoid melee attacks. This ability raises your avoidance skill by a significant amount, allowing you to dodge, parry, and riposte incoming blows with greater frequency. Each successive rank grants a progressively larger bonus.');
  });

  test('Title and Description update when a different AA is selected', async ({ page }) => {
    await gotoAaEditor(page);

    // Select first AA
    await page.locator('#aa-editor-table tbody tr').nth(0).click();
    await expect(page.locator('input[placeholder="(no title)"]')).toHaveValue('Combat Agility', { timeout: 10000 });

    // Select second AA
    await page.locator('#aa-editor-table tbody tr').nth(1).click();
    await expect(page.locator('input[placeholder="(no title)"]')).toHaveValue('Combat Stability', { timeout: 10000 });
    await expect(page.locator('textarea[placeholder="(no description)"]')).toHaveValue(
      'Increases your ability to absorb damage from melee attacks.',
      { timeout: 10000 }
    );
  });

  test('Title and Description fields are read-only', async ({ page }) => {
    await gotoAaEditor(page);

    await page.locator('#aa-editor-table tbody tr').nth(0).click();

    const titleInput = page.locator('input[placeholder="(no title)"]');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await expect(titleInput).toBeDisabled();

    const descTextarea = page.locator('textarea[placeholder="(no description)"]');
    await expect(descTextarea).toBeDisabled();
  });

  test('Title and Description are not shown before an AA is selected', async ({ page }) => {
    await gotoAaEditor(page);

    await expect(page.locator('input[placeholder="(no title)"]')).toHaveCount(0);
    await expect(page.locator('textarea[placeholder="(no description)"]')).toHaveCount(0);
  });

});

test.describe('AA Editor — rank chain validation', () => {

  test('saves an ability whose rank chain uses EQEmu -1 endpoint sentinels', async ({ page }) => {
    await gotoAaEditor(page);

    await page.locator('#aa-editor-table tbody tr').nth(0).click();
    await page.locator('input[placeholder="AA ability name"]').fill('Combat Agility Updated');

    await page.getByRole('button', { name: 'Save All' }).click();

    await expect(page.getByText(/Saved AA ability 1 \(chain, effects, prereqs saved\)/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('All prev_id/next_id links must target a rank in this chain')).toHaveCount(0);
  });

});

// ---------------------------------------------------------------------------
// Button contrast & height tests (use isolated fixture — no live backend needed)
// ---------------------------------------------------------------------------

test.describe('AA Editor — Button contrast and height', () => {

  // WCAG AA minimum for UI components / large text
  const MIN_CONTRAST = 3.0;

  /** Load the self-contained fixture HTML directly via file:// */
  async function gotoFixture(page: Page) {
    const path = require('path');
    const fixturePath = path.resolve(__dirname, 'fixtures/button-contrast.html');
    await page.goto(`file://${fixturePath}`);
    // Fixture is static HTML — no async loading needed
    await page.waitForSelector('#action-bar');
  }

  test('outline-warning button has sufficient contrast on dark background', async ({ page }) => {
    await gotoFixture(page);
    const btn = page.locator('#btn-warning');
    const { fg, bg } = await getButtonColours(btn);
    const ratio = contrastRatio(fg, bg);
    console.log(`outline-warning: fg=rgb(${fg}) bg=rgb(${bg}) ratio=${ratio.toFixed(2)}`);
    expect(ratio, `contrast ${ratio.toFixed(2)}:1 below ${MIN_CONTRAST}:1`).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  test('outline-secondary button has sufficient contrast on dark background', async ({ page }) => {
    await gotoFixture(page);
    const btn = page.locator('#btn-secondary');
    const { fg, bg } = await getButtonColours(btn);
    const ratio = contrastRatio(fg, bg);
    console.log(`outline-secondary: fg=rgb(${fg}) bg=rgb(${bg}) ratio=${ratio.toFixed(2)}`);
    expect(ratio, `contrast ${ratio.toFixed(2)}:1 below ${MIN_CONTRAST}:1`).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  test('outline-info button has sufficient contrast on dark background', async ({ page }) => {
    await gotoFixture(page);
    const btn = page.locator('#btn-info');
    const { fg, bg } = await getButtonColours(btn);
    const ratio = contrastRatio(fg, bg);
    console.log(`outline-info: fg=rgb(${fg}) bg=rgb(${bg}) ratio=${ratio.toFixed(2)}`);
    expect(ratio, `contrast ${ratio.toFixed(2)}:1 below ${MIN_CONTRAST}:1`).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  test('outline-danger button has sufficient contrast on dark background', async ({ page }) => {
    await gotoFixture(page);
    const btn = page.locator('#btn-danger');
    const { fg, bg } = await getButtonColours(btn);
    const ratio = contrastRatio(fg, bg);
    console.log(`outline-danger: fg=rgb(${fg}) bg=rgb(${bg}) ratio=${ratio.toFixed(2)}`);
    expect(ratio, `contrast ${ratio.toFixed(2)}:1 below ${MIN_CONTRAST}:1`).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  test('outline-success button has sufficient contrast on dark background', async ({ page }) => {
    await gotoFixture(page);
    const btn = page.locator('#btn-success');
    const { fg, bg } = await getButtonColours(btn);
    const ratio = contrastRatio(fg, bg);
    console.log(`outline-success: fg=rgb(${fg}) bg=rgb(${bg}) ratio=${ratio.toFixed(2)}`);
    expect(ratio, `contrast ${ratio.toFixed(2)}:1 below ${MIN_CONTRAST}:1`).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  test('outline-primary button has sufficient contrast on dark background', async ({ page }) => {
    await gotoFixture(page);
    const btn = page.locator('#btn-primary');
    const { fg, bg } = await getButtonColours(btn);
    const ratio = contrastRatio(fg, bg);
    console.log(`outline-primary: fg=rgb(${fg}) bg=rgb(${bg}) ratio=${ratio.toFixed(2)}`);
    expect(ratio, `contrast ${ratio.toFixed(2)}:1 below ${MIN_CONTRAST}:1`).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  test('search button in d-flex row matches input height (minified-inputs)', async ({ page }) => {
    await gotoFixture(page);
    const input  = page.locator('#flex-row input');
    const button = page.locator('#search-btn');
    const inputBox  = await input.boundingBox();
    const buttonBox = await button.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    const diff = Math.abs(inputBox!.height - buttonBox!.height);
    console.log(`d-flex: input=${inputBox!.height}px btn=${buttonBox!.height}px diff=${diff}px`);
    expect(diff, `height diff ${diff}px exceeds 2px tolerance`).toBeLessThanOrEqual(2);
  });

  test('Editor link button in input-group matches input height (minified-inputs)', async ({ page }) => {
    await gotoFixture(page);
    const input  = page.locator('#input-group-row input');
    const button = page.locator('#editor-link');
    const inputBox  = await input.boundingBox();
    const buttonBox = await button.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
    const diff = Math.abs(inputBox!.height - buttonBox!.height);
    console.log(`input-group: input=${inputBox!.height}px btn=${buttonBox!.height}px diff=${diff}px`);
    expect(diff, `height diff ${diff}px exceeds 2px tolerance`).toBeLessThanOrEqual(2);
  });

});

// ---------------------------------------------------------------------------
// Desc SID dropdown width constraint tests
// ---------------------------------------------------------------------------

test.describe('AA Editor — Desc SID dropdown width', () => {

  test('Desc SID column is constrained to 350px on a very wide viewport', async ({ page }) => {
    // Simulate a very wide layout (e.g. triple-monitor spanning ~5760px)
    await page.setViewportSize({ width: 5760, height: 900 });
    await gotoAaEditor(page);

    // Select first AA to load the right panel
    await page.locator('#aa-editor-table tbody tr').nth(0).click();

    // Click the Ranks tab
    await page.locator('.eq-tab-box-fancy a', { hasText: 'Ranks' }).click();

    // Wait for the first rank card header to appear
    const rankHeader = page.locator('.rank-card-header').first();
    await expect(rankHeader).toBeVisible({ timeout: 10000 });

    // Expand the rank card by clicking its header
    await rankHeader.click();

    // Wait for the rank body (expanded content) to be visible
    const rankBody = page.locator('.rank-card-body').first();
    await expect(rankBody).toBeVisible({ timeout: 5000 });

    // Measure the Desc SID column — it is identified by its enforced max-width inline style
    const descSidWidth = await rankBody.evaluate((body: HTMLElement) => {
      // Walk child elements to find the one that directly contains the text "Desc SID"
      for (const el of Array.from(body.querySelectorAll('[style*="max-width: 350px"]'))) {
        if ((el as HTMLElement).textContent?.includes('Desc SID')) {
          return (el as HTMLElement).getBoundingClientRect().width;
        }
      }
      return null;
    });

    expect(descSidWidth, 'Desc SID column was not found in rank body').not.toBeNull();
    console.log(`Desc SID column width on 5760px viewport: ${descSidWidth}px`);
    expect(descSidWidth!, `Desc SID column width ${descSidWidth}px exceeds 350px cap`).toBeLessThanOrEqual(350);
  });

  test('Desc SID column does not break grid layout on normal viewport', async ({ page }) => {
    // Regression: flex: 0 0 350px forced the column wider than col-3 on normal viewports
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoAaEditor(page);

    await page.locator('#aa-editor-table tbody tr').nth(0).click();
    await page.locator('.eq-tab-box-fancy a', { hasText: 'Ranks' }).click();

    const rankHeader = page.locator('.rank-card-header').first();
    await expect(rankHeader).toBeVisible({ timeout: 10000 });
    await rankHeader.click();

    const rankBody = page.locator('.rank-card-body').first();
    await expect(rankBody).toBeVisible({ timeout: 5000 });

    // Measure the row width and Desc SID column width
    const { rowWidth, descSidWidth } = await rankBody.evaluate((body: HTMLElement) => {
      const rows = body.querySelectorAll('.row');
      // The Desc SID is in the second row (index 1)
      const row = rows[1] as HTMLElement;
      if (!row) return { rowWidth: null, descSidWidth: null };
      const rowW = row.getBoundingClientRect().width;
      for (const el of Array.from(row.querySelectorAll('[style*="max-width"]'))) {
        if ((el as HTMLElement).textContent?.includes('Desc SID')) {
          return { rowWidth: rowW, descSidWidth: (el as HTMLElement).getBoundingClientRect().width };
        }
      }
      return { rowWidth: rowW, descSidWidth: null };
    });

    expect(rowWidth, 'Row not found').not.toBeNull();
    expect(descSidWidth, 'Desc SID column not found').not.toBeNull();
    // On a 1280px viewport, col-3 = 25% of the row, which should be well under 350px.
    // The column must NOT exceed 25% of the row (the grid proportion).
    const maxExpected = rowWidth! * 0.25 + 2; // small tolerance for rounding
    console.log(`Normal viewport: row=${rowWidth}px  descSid=${descSidWidth}px  col-3 max=${maxExpected.toFixed(0)}px`);
    expect(descSidWidth!, `Desc SID column ${descSidWidth}px exceeds col-3 proportion`).toBeLessThanOrEqual(maxExpected);
  });

  test('Desc SID select element width does not exceed its container', async ({ page }) => {
    await page.setViewportSize({ width: 5760, height: 900 });
    await gotoAaEditor(page);

    await page.locator('#aa-editor-table tbody tr').nth(0).click();
    await page.locator('.eq-tab-box-fancy a', { hasText: 'Ranks' }).click();

    const rankHeader = page.locator('.rank-card-header').first();
    await expect(rankHeader).toBeVisible({ timeout: 10000 });
    await rankHeader.click();

    const rankBody = page.locator('.rank-card-body').first();
    await expect(rankBody).toBeVisible({ timeout: 5000 });

    // The Desc SID select is the select whose model is rank.desc_sid.
    // It sits inside the column div that has max-width:350px.
    // We identify it as the select inside the only [style*="max-width: 350px"] div
    // that contains "Desc SID" text.
    const { colWidth, selectWidth } = await rankBody.evaluate((body: HTMLElement) => {
      for (const el of Array.from(body.querySelectorAll('[style*="max-width: 350px"]'))) {
        if ((el as HTMLElement).textContent?.includes('Desc SID')) {
          const sel = el.querySelector('select');
          return {
            colWidth: (el as HTMLElement).getBoundingClientRect().width,
            selectWidth: sel ? sel.getBoundingClientRect().width : null,
          };
        }
      }
      return { colWidth: null, selectWidth: null };
    });

    expect(colWidth, 'Desc SID column not found').not.toBeNull();
    expect(selectWidth, 'Desc SID select not found').not.toBeNull();
    console.log(`Desc SID col=${colWidth}px  select=${selectWidth}px`);
    expect(colWidth!).toBeLessThanOrEqual(350);
    expect(selectWidth!).toBeLessThanOrEqual(350);
  });

});
