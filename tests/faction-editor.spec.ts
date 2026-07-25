import { expect, Page, test } from '@playwright/test';

const playerFaction = {
  id: 10,
  name: 'Guards of Qeynos',
  base: 0,
  base_data: { min: -2000, max: 2000, unk_hero_1: 0, unk_hero_2: 0, unk_hero_3: 0 },
  modifiers: [
    { id: 1, kind: 'race', value_id: 1, amount: 10 },
  ],
};

const playerReferences = {
  npc_template_primary_count: 1,
  npc_standing_count: 0,
  item_count: 0,
  task_count: 0,
  character_value_count: 0,
  association_count: 0,
  npc_templates: [{ id: 70, name: 'Qeynos Guards', extra: 'Primary faction' }],
  items: [],
  tasks: [],
};

const npcTemplate = {
  id: 70,
  name: 'Qeynos Guards',
  primary_faction: 10,
  ignore_primary_assist: false,
  entries: [
    { faction_id: 10, faction_name: 'Guards of Qeynos', value: 10, npc_value: 1, temp: 0 },
    { faction_id: 11, faction_name: 'Freeport Militia', value: -5, npc_value: 7, temp: 7 },
  ],
};

const targetTemplate = {
  id: 71,
  name: 'Freeport Guards',
  primary_faction: 11,
  ignore_primary_assist: false,
  entries: [],
};

const assignedNpc = {
  id: 1001,
  name: 'Guard_Hewet',
  level: 25,
  race: 137,
  class: 41,
};

const unknownAssignedNpc = {
  id: 1002,
  name: 'Legacy_Guard',
  level: 20,
  race: 999,
  class: 250,
};

type FactionMocks = {
  lastPlayerPayload?: Record<string, unknown>;
  lastNpcPayload?: Record<string, unknown>;
  reassignmentPayload?: Record<string, unknown>;
};

async function installFactionMocks(page: Page, state: FactionMocks) {
  let npcAssigned = true;

  // Register broad handlers first because Playwright resolves matching routes LIFO.
  await page.route('**/api/v1/**', route => {
    if (!route.request().isNavigationRequest()) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.continue();
  });
  await page.route('https://api.github.com/**', route => route.abort());

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
        },
      }),
    })
  );

  await page.route('**/api/v1/faction-editor/factions**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 10, name: 'Guards of Qeynos', base: 0, modifier_count: 1 },
          { id: 11, name: 'Freeport Militia', base: -100, modifier_count: 2 },
        ],
        total: 2105,
        page: 1,
        limit: 50,
      }),
    })
  );

  await page.route('**/api/v1/faction-editor/npc-templates**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 70, name: 'Qeynos Guards', primary_faction: 10, entry_count: 2, npc_count: npcAssigned ? 2 : 0 },
          { id: 71, name: 'Freeport Guards', primary_faction: 11, entry_count: 0, npc_count: 4 },
        ],
        total: 2,
        page: 1,
        limit: 50,
      }),
    })
  );

  await page.route('**/api/v1/faction-editor/faction/10', async route => {
    const method = route.request().method();
    if (method === 'PATCH') {
      state.lastPlayerPayload = route.request().postDataJSON();
      Object.assign(playerFaction, state.lastPlayerPayload);
    }
    if (method === 'DELETE') {
      return route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Faction is still referenced and cannot be deleted',
          references: playerReferences,
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ faction: playerFaction, references: playerReferences }),
    });
  });

  await page.route('**/api/v1/faction-editor/npc-template/70/reassign', async route => {
    state.reassignmentPayload = route.request().postDataJSON();
    npcAssigned = false;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ updated: 1, target_npc_faction_id: 71 }),
    });
  });

  await page.route('**/api/v1/faction-editor/npc-template/70', async route => {
    if (route.request().method() === 'PATCH') {
      state.lastNpcPayload = route.request().postDataJSON();
      Object.assign(npcTemplate, state.lastNpcPayload);
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        template: npcTemplate,
        references: {
          npc_count: npcAssigned ? 2 : 0,
          npcs: npcAssigned ? [assignedNpc, unknownAssignedNpc] : [],
        },
      }),
    });
  });

  await page.route('**/api/v1/faction-editor/npc-template/71', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ template: targetTemplate, references: { npc_count: 4, npcs: [] } }),
    })
  );
}

test.describe('Faction Editor', () => {
  test('edits player faction data and surfaces safe-delete blockers', async ({ page }) => {
    const state: FactionMocks = {};
    await installFactionMocks(page, state);
    await page.goto('/factions?mode=player&faction=10');

    await expect(page.getByTestId('faction-editor-inspector')).toBeVisible();
    await expect(page.locator('#faction-editor-name')).toHaveValue('Guards of Qeynos');
    await page.locator('#faction-editor-base').fill('-75');
    await page.getByTestId('faction-save').click();

    await expect(page.getByText('Faction changes saved')).toBeVisible();
    expect(state.lastPlayerPayload).toMatchObject({
      id: 10,
      name: 'Guards of Qeynos',
      base: -75,
      modifiers: [{ kind: 'race', value_id: 1, amount: 10 }],
    });

    await page.getByRole('button', { name: /Delete$/ }).click();
    await page.getByRole('button', { name: 'Delete permanently', exact: true }).click();
    await expect(page.getByText('Faction is still referenced and cannot be deleted')).toBeVisible();

    await page.getByText('Usage & Safety', { exact: true }).click();
    await expect(page.getByText('1 blocking references')).toBeVisible();
    await expect(page.getByTestId('faction-editor-inspector').getByText('Qeynos Guards')).toBeVisible();
  });

  test('reassigns selected NPCs directly from a template', async ({ page }) => {
    const state: FactionMocks = {};
    await installFactionMocks(page, state);
    await page.goto('/factions?mode=npc&faction=70');

    await expect(page.getByTestId('faction-editor-inspector')).toBeVisible();
    await page.getByText('NPC Assignments', { exact: true }).click();
    await expect(page.getByText('Guard_Hewet', { exact: true })).toBeVisible();
    await expect(page.getByText('Goblin', { exact: true })).toBeVisible();
    await expect(page.getByText('Shopkeeper', { exact: true })).toBeVisible();
    await expect(page.getByText('Unknown race', { exact: true })).toBeVisible();
    await expect(page.getByText('Unknown class', { exact: true })).toBeVisible();

    await page.locator('.npc-assignment-table tbody input[type="checkbox"]').first().check();
    await page.locator('#npc-reassign-target').fill('71');
    await expect(page.locator('.assignment-target__resolution')).toContainText('Freeport Guards');
    await page.getByRole('button', { name: /Reassign$/ }).click();
    await page.getByRole('button', { name: 'Reassign NPCs', exact: true }).click();

    await expect(page.getByText('1 NPC reassigned')).toBeVisible();
    await expect(page.getByText('No NPCs are assigned to this template.')).toBeVisible();
    expect(state.reassignmentPayload).toEqual({
      npc_ids: [1001],
      target_npc_faction_id: 71,
    });
  });

  test('makes NPC standing behavior explicit and preserves unknown legacy modes', async ({ page }) => {
    const state: FactionMocks = {};
    await installFactionMocks(page, state);
    await page.goto('/factions?mode=npc&faction=70');

    await expect(page.locator('#npc-template-primary')).toHaveValue('10');
    await expect(page.locator('.reference-resolution').first()).toContainText('Guards of Qeynos');

    await page.getByText('Standing Entries', { exact: true }).click();
    await expect(page.locator('#npc-standing-npc-value-0 option:checked')).toHaveText('Assist player · +1');
    await expect(page.locator('#npc-standing-temp-0 option:checked')).toHaveText('Permanent · Message');
    await expect(page.locator('#npc-standing-npc-value-1 option:checked')).toHaveText('Unknown reaction · 7');
    await expect(page.locator('#npc-standing-temp-1 option:checked')).toHaveText('Unknown legacy behavior · 7');

    await page.locator('#npc-standing-npc-value-0').selectOption('-1');
    await page.locator('#npc-standing-temp-0').selectOption('3');
    await page.getByTestId('faction-save').click();
    await expect(page.getByText('Faction changes saved')).toBeVisible();

    expect(state.lastNpcPayload).toMatchObject({
      entries: [
        { faction_id: 10, value: 10, npc_value: -1, temp: 3 },
        { faction_id: 11, value: -5, npc_value: 7, temp: 7 },
      ],
    });
  });

  test('uses a single-column workspace at tablet width', async ({ page }) => {
    const state: FactionMocks = {};
    await page.setViewportSize({ width: 800, height: 900 });
    await installFactionMocks(page, state);
    await page.goto('/factions?mode=player');

    await expect(page.getByTestId('faction-directory')).toBeVisible();
    const columns = await page.locator('.faction-workspace').evaluate(element =>
      window.getComputedStyle(element).gridTemplateColumns
    );
    expect(columns.trim().split(/\s+/)).toHaveLength(1);
    await expect(page.getByRole('button', { name: /Player factions/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /NPC templates/ })).toBeVisible();
  });

  test('groups Tradeskills under Items and uses compact directory pagination', async ({ page }) => {
    const state: FactionMocks = {};
    await installFactionMocks(page, state);
    await page.goto('/factions?mode=player');

    const tradeskillChild = page.locator('#sidebar .nav.nav-sm a[href="/tradeskills"]');
    await expect(tradeskillChild).toHaveCount(1);

    const itemsToggle = page.locator('#sidebar a.nav-link').filter({ hasText: 'Items' }).first();
    await itemsToggle.click();
    await expect(tradeskillChild).toBeVisible();

    const pager = page.getByRole('navigation', { name: 'Faction directory pages' });
    await expect(pager).toContainText('Page1/43');
    await pager.getByRole('button', { name: 'Go to next page' }).click();
    await expect(pager).toContainText('Page2/43');
    await pager.getByRole('button', { name: 'Go to last page' }).click();
    await expect(pager).toContainText('Page43/43');
  });

  test('supports repeat-rule editing, bound feedback, and keyboard save', async ({ page }) => {
    const state: FactionMocks = {};
    await installFactionMocks(page, state);
    await page.goto('/factions?mode=player&faction=10');

    await page.getByText('Client Bounds', { exact: true }).click();
    await expect(page.getByText('Within client bounds', { exact: true })).toBeVisible();
    await page.locator('#faction-bound-min').fill('100');
    await page.locator('#faction-bound-max').fill('-100');
    await expect(page.getByText('Minimum exceeds maximum', { exact: true })).toBeVisible();
    await expect(page.getByTestId('faction-save')).toBeDisabled();

    await page.locator('#faction-bound-min').fill('-2000');
    await page.locator('#faction-bound-max').fill('2000');
    await page.getByText('Modifiers', { exact: true }).click();

    await expect(page.locator('#faction-modifier-value-0 option:checked')).toHaveText('Human · #1');
    await page.locator('#faction-modifier-kind-0').selectOption('class');
    await expect(page.locator('#faction-modifier-value-0 option:checked')).toHaveText('Warrior · #1');
    await page.locator('#faction-modifier-value-0').selectOption('2');
    await expect(page.locator('#faction-modifier-value-0 option:checked')).toHaveText('Cleric · #2');
    await page.locator('#faction-modifier-preset-0').selectOption('-1000');
    await expect(page.locator('#faction-modifier-amount-0')).toHaveValue('-1000');
    await expect(page.getByText('Standing penalty', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Add a similar modifier', exact: true }).click();

    const modifierRows = page.locator('.faction-rules-table tbody tr');
    await expect(modifierRows).toHaveCount(2);
    await expect(page.locator('#faction-modifier-value-1')).toBeFocused();
    await expect(page.locator('#faction-modifier-amount-1')).toHaveValue('-1000');
    await page.locator('#faction-modifier-value-1').selectOption('3');

    await page.keyboard.press('Control+s');
    await expect(page.getByText('Faction changes saved')).toBeVisible();
    expect(state.lastPlayerPayload).toMatchObject({
      modifiers: [
        { kind: 'class', value_id: 2, amount: -1000 },
        { kind: 'class', value_id: 3, amount: -1000 },
      ],
    });
  });
});
