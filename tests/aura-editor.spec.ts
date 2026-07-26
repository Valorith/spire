import { expect, Page, test } from '@playwright/test';

type AuraMockState = {
  auras: Array<Record<string, unknown>>;
  createPayload?: Record<string, unknown>;
  updatePayload?: Record<string, unknown>;
  deleteRequests: number;
};

const spell = {
  id: 8469,
  name: "Champion's_Aura_Effect",
  new_icon: 161,
  good_effect: 1,
  targettype: 5,
  range: 200,
  aoerange: 0,
  dispel_flag: 0,
  effectid_1: 1,
  effect_base_value_1: 10,
};

const aura = {
  type: 100,
  npc_type: 2000003,
  name: 'Aura_Test',
  spell_id: 8469,
  distance: 60,
  aura_type: 1,
  spawn_type: 0,
  movement: 0,
  duration: 5400,
  icon: -1,
  cast_time: -1,
  spells_new: spell,
};

async function installAuraMocks(page: Page, state: AuraMockState) {
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

  await page.route('**/api/v1/npc_types/bulk', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 2000003,
          name: 'IOChampionsAura',
          level: 70,
          race: 127,
          class: 62,
        },
      ]),
    })
  );

  await page.route('**/api/v1/aura', async route => {
    state.createPayload = route.request().postDataJSON();
    state.auras.push({ ...state.createPayload, spells_new: spell });
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(state.createPayload),
    });
  });

  await page.route('**/api/v1/aura/*', async route => {
    const id = Number(route.request().url().split('/').pop());
    if (route.request().method() === 'PATCH') {
      state.updatePayload = route.request().postDataJSON();
      state.auras = state.auras.map(record =>
        Number(record.type) === id ? { ...record, ...state.updatePayload } : record
      );
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.updatePayload),
      });
    }
    if (route.request().method() === 'DELETE') {
      state.deleteRequests += 1;
      state.auras = state.auras.filter(record => Number(record.type) !== id);
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 404, body: '' });
  });

  await page.route('**/api/v1/auras?**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.auras),
    })
  );
}

test.describe('Aura Editor', () => {
  test('loads real aura semantics and nests the editor under Spells & Abilities', async ({ page }) => {
    const state: AuraMockState = { auras: [{ ...aura }], deleteRequests: 0 };
    await installAuraMocks(page, state);
    await page.goto('/auras?aura=100');

    await expect(page.getByTestId('aura-inspector')).toBeVisible();
    await expect(page.getByTestId('aura-inspector').locator('h2')).toHaveText('Aura Test');
    await expect(page.locator('#sidebar .nav.nav-sm a[href="/auras"]')).toHaveCount(1);
    await expect(page.locator('#sidebar .nav.nav-sm a[href="/auras"]')).toBeVisible();
    await page.getByRole('tab', { name: 'Behavior', exact: true }).click();
    const inspector = page.getByTestId('aura-inspector');
    await expect(inspector.getByLabel('Aura type')).toHaveValue('1');
    await expect(inspector.getByLabel('Who sees the aura entity')).toHaveValue('0');
    await expect(inspector.getByLabel('Movement')).toHaveValue('0');

    await page.getByRole('tab', { name: 'Linked Content', exact: true }).click();
    await expect(page.getByRole('heading', { name: "Champion's Aura Effect", exact: true })).toBeVisible();
    await expect(page.getByText('IOChampionsAura', { exact: true })).toBeVisible();
    const effectList = page.locator('.spire-editor-effect-list');
    await expect(effectList.getByText('Increase AC', { exact: true })).toBeVisible();
    await expect(effectList.getByText('10', { exact: true })).toBeVisible();
  });

  test('reuses the Spell Editor range visualizer with synchronized exact units', async ({ page }) => {
    const state: AuraMockState = { auras: [{ ...aura }], deleteRequests: 0 };
    await installAuraMocks(page, state);
    await page.goto('/auras?aura=100');

    const slider = page.locator('.spire-editor-range-visualizer .rv-slider');
    const numeric = page.locator('#aura-distance');
    await expect(slider).toHaveValue('60');
    await expect(numeric).toHaveValue('60');

    await slider.fill('75');
    await expect(numeric).toHaveValue('75');
    await expect(page.getByTestId('aura-save')).toBeEnabled();

    await numeric.fill('60');
    await expect(slider).toHaveValue('60');
    await expect(page.getByTestId('aura-save')).toBeDisabled();
  });

  test('guards copy and delete while persisting complete Aura records', async ({ page }) => {
    const state: AuraMockState = { auras: [{ ...aura }], deleteRequests: 0 };
    await installAuraMocks(page, state);
    await page.goto('/auras?aura=100');

    await page.getByTestId('aura-copy').click();
    await expect(page.getByText('Create a new draft from aura #100 (Aura Test)?')).toBeVisible();
    await page.getByRole('button', { name: 'Create copy', exact: true }).click();
    await expect(page.locator('#aura-type-id')).toHaveValue('101');
    await page.locator('#aura-name').fill('Aura_QA_Copy');
    await page.getByTestId('aura-save').click();

    await expect(page.locator('#aura-name')).toHaveValue('Aura_QA_Copy');
    expect(state.createPayload).toMatchObject({
      type: 101,
      npc_type: 2000003,
      name: 'Aura_QA_Copy',
      spell_id: 8469,
      distance: 60,
      aura_type: 1,
      spawn_type: 0,
      movement: 0,
      duration: 5400,
      icon: -1,
      cast_time: -1,
    });

    await page.getByTestId('aura-delete').click();
    await expect(page.getByText(/linked spell and NPC template will remain intact/)).toBeVisible();
    await page.getByRole('button', { name: 'Delete aura', exact: true }).click();
    await expect(page.getByTestId('aura-inspector').locator('h2')).toHaveText('Aura Test');
    expect(state.deleteRequests).toBe(1);
  });
});
