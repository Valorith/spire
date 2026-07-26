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

  await page.route('**/api/v1/static-map/spell-icons-map.json', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        contents: [
          { name: 'icons/42.png' },
          { name: 'icons/161.png' },
        ],
      }]),
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
    await expect(inspector.getByLabel('Aura type', { exact: true })).toHaveValue('1');
    await expect(inspector.getByLabel('Who sees the aura entity')).toHaveValue('0');
    await expect(inspector.getByLabel('Movement')).toHaveValue('0');

    const auraTypeGroup = page.getByTestId('aura-type-group');
    await expect(auraTypeGroup.getByTestId('aura-type-option-1')).toHaveAttribute('aria-checked', 'true');
    await auraTypeGroup.getByTestId('aura-type-option-4').click();
    await expect(inspector.getByLabel('Aura type', { exact: true })).toHaveValue('4');
    await expect(auraTypeGroup.getByTestId('aura-type-option-4')).toHaveAttribute('aria-checked', 'true');
    await expect(inspector.getByLabel('Who sees the aura entity')).toHaveValue('0');
    await expect(inspector.getByLabel('Movement')).toHaveValue('0');
    await expect(page.getByText('Visibility and movement are stored independently from Aura Type.')).toBeVisible();

    await page.setViewportSize({ width: 620, height: 900 });
    const [typeGroupBox, firstTypeBox, lastTypeBox, spawnBox, movementBox] = await Promise.all([
      auraTypeGroup.boundingBox(),
      auraTypeGroup.getByTestId('aura-type-option-0').boundingBox(),
      auraTypeGroup.getByTestId('aura-type-option-6').boundingBox(),
      inspector.getByLabel('Who sees the aura entity').boundingBox(),
      inspector.getByLabel('Movement').boundingBox(),
    ]);
    if (!typeGroupBox || !firstTypeBox || !lastTypeBox || !spawnBox || !movementBox) {
      throw new Error('Compact Behavior geometry is unavailable');
    }
    expect(firstTypeBox.x).toBeGreaterThanOrEqual(typeGroupBox.x);
    expect(lastTypeBox.x + lastTypeBox.width).toBeLessThanOrEqual(typeGroupBox.x + typeGroupBox.width + 1);
    expect(movementBox.y).toBeGreaterThan(spawnBox.y + spawnBox.height);

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
    const summary = page.getByTestId('aura-runtime-summary');
    await expect(slider).toHaveValue('60');
    await expect(numeric).toHaveValue('60');
    await expect(summary).toContainText('Applies the linked spell to members of the owner’s group.');
    await expect(summary).toContainText('60 units');
    await expect(summary.locator('.spire-editor-metric').filter({ hasText: 'Visibility' })).toContainText('Group members');
    await expect(summary).toContainText('Follow');

    const visualizerStage = page.locator('.spire-editor-range-visualizer .range-visualizer-stage');
    const [stageBox, sliderBox] = await Promise.all([
      visualizerStage.boundingBox(),
      slider.boundingBox(),
    ]);
    if (!stageBox || !sliderBox) throw new Error('Range visualizer geometry is unavailable');
    expect(sliderBox.y).toBeGreaterThanOrEqual(stageBox.y + stageBox.height + 8);

    await slider.fill('75');
    await expect(numeric).toHaveValue('75');
    await expect(summary).toContainText('75 units');
    await expect(page.getByTestId('aura-save')).toBeEnabled();

    const markerLabel = visualizerStage.locator('.unit-label--marker');
    const markerLine = visualizerStage.locator('.rv-vertical-line');
    await slider.fill('950');
    await expect(markerLabel).toHaveClass(/unit-label--before/);
    const [edgeStageBox, markerLabelBox, markerLineBox] = await Promise.all([
      visualizerStage.boundingBox(),
      markerLabel.boundingBox(),
      markerLine.boundingBox(),
    ]);
    if (!edgeStageBox || !markerLabelBox || !markerLineBox) {
      throw new Error('Range marker geometry is unavailable');
    }
    expect(markerLabelBox.x).toBeGreaterThanOrEqual(edgeStageBox.x);
    expect(markerLabelBox.x + markerLabelBox.width).toBeLessThanOrEqual(markerLineBox.x - 5);

    await numeric.fill('60');
    await expect(slider).toHaveValue('60');
    await expect(summary).toContainText('60 units');
    await expect(markerLabel).not.toHaveClass(/unit-label--before/);
    await expect(page.getByTestId('aura-save')).toBeDisabled();

    await page.setViewportSize({ width: 620, height: 900 });
    const [compactRangeBox, compactSummaryBox] = await Promise.all([
      page.locator('.spire-editor-range-visualizer').boundingBox(),
      summary.boundingBox(),
    ]);
    if (!compactRangeBox || !compactSummaryBox) throw new Error('Compact Overview geometry is unavailable');
    expect(compactSummaryBox.y).toBeGreaterThanOrEqual(compactRangeBox.y + compactRangeBox.height + 8);
  });

  test('places the Spell Editor cast-time simulator beneath the Aura field with seconds converted to milliseconds', async ({ page }) => {
    const state: AuraMockState = { auras: [{ ...aura }], deleteRequests: 0 };
    await installAuraMocks(page, state);
    await page.goto('/auras?aura=100');

    const numeric = page.locator('#aura-cast-time');
    const simulator = page.getByTestId('aura-cast-time-simulator');
    const castTimeField = numeric.locator('..');
    const runtimeSummary = page.locator('.spire-editor-context-card--gold');
    await expect(numeric).toHaveValue('-1');
    await expect(castTimeField.getByTestId('aura-cast-time-simulator')).toBeVisible();
    await expect(runtimeSummary.getByTestId('aura-cast-time-simulator')).toHaveCount(0);
    await expect(simulator).toHaveAttribute('data-time-ms', '0');
    await expect(simulator).toHaveCSS('opacity', '0.5');
    await expect(castTimeField.getByText('Cast-time simulator', { exact: true })).toHaveCount(0);
    await expect(castTimeField.getByText(/Stored in whole seconds/)).toHaveCount(0);
    await expect(simulator).toHaveClass(/ml-3/);
    await expect(simulator).toHaveCSS('margin-top', '5px');

    const [numericBox, simulatorBox] = await Promise.all([
      numeric.boundingBox(),
      simulator.boundingBox(),
    ]);
    if (!numericBox || !simulatorBox) throw new Error('Aura cast-time geometry is unavailable');
    expect(simulatorBox.y).toBeGreaterThanOrEqual(numericBox.y + numericBox.height + 4);

    await numeric.fill('12');
    await expect(simulator).toHaveAttribute('data-time-ms', '12000');
    await expect(simulator).toHaveCSS('opacity', '1');
    await expect(simulator.locator('.eq-progress-bar')).toBeVisible();
    await expect(page.getByTestId('aura-save')).toBeEnabled();

    await numeric.fill('-1');
    await expect(simulator).toHaveAttribute('data-time-ms', '0');
    await expect(page.getByTestId('aura-save')).toBeDisabled();
  });

  test('keeps linked spell behavior inside its column at desktop and compact widths', async ({ page }) => {
    const state: AuraMockState = { auras: [{ ...aura }], deleteRequests: 0 };
    await installAuraMocks(page, state);

    for (const viewport of [
      { width: 1280, height: 900 },
      { width: 620, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/auras?tab=Linked+Content&aura=100');

      const card = page.getByTestId('aura-spell-behavior');
      const column = card.locator('..');
      await expect(card).toBeVisible();

      const [cardBox, columnBox] = await Promise.all([
        card.boundingBox(),
        column.boundingBox(),
      ]);
      if (!cardBox || !columnBox) throw new Error('Linked Content geometry is unavailable');
      expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(columnBox.y + columnBox.height + 1);
      await expect(card).toHaveCSS('min-height', '0px');
    }
  });

  test('selects explicit Aura icons while preserving legacy and linked-spell values', async ({ page }) => {
    const state: AuraMockState = {
      auras: [{ ...aura, icon: 999 }],
      deleteRequests: 0,
    };
    await installAuraMocks(page, state);
    await page.goto('/auras?aura=100');

    const iconValue = page.locator('#aura-icon');
    const picker = page.getByTestId('aura-icon-picker');
    await expect(iconValue).toHaveValue('999');
    await expect(picker).toContainText('Aura icon #999');
    await expect(picker).toContainText('Preserves explicit client aura icon #999.');

    await picker.getByRole('button', { name: 'Choose icon', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Choose aura icon' })).toBeVisible();
    await expect(iconValue).toHaveValue('999');
    await page.getByRole('option', { name: 'Select spell icon 42' }).click();

    await expect(iconValue).toHaveValue('42');
    await expect(picker).toContainText('Aura icon #42');
    await picker.getByRole('button', { name: 'Use linked spell icon', exact: true }).click();
    await expect(iconValue).toHaveValue('-1');
    await expect(picker).toContainText('Linked spell icon');
    await expect(picker).toContainText('Inherits icon #161 from the linked effect spell.');
    const preview = page.getByTestId('aura-icon-preview');
    const previewSprite = preview.locator('.spell-161-40');
    await expect(previewSprite).toBeVisible();
    await expect(preview).toHaveCSS('display', 'flex');
    await expect(preview).toHaveCSS('padding', '2px');
    await expect(previewSprite).toHaveCSS('background-image', /spell-icons-40\.png/);

    for (const viewport of [
      { width: 1280, height: 900 },
      { width: 620, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      const [previewBox, spriteBox] = await Promise.all([
        preview.boundingBox(),
        previewSprite.boundingBox(),
      ]);
      if (!previewBox || !spriteBox) throw new Error('Aura icon preview geometry is unavailable');
      expect(Math.abs((previewBox.x + previewBox.width / 2) - (spriteBox.x + spriteBox.width / 2))).toBeLessThanOrEqual(1);
      expect(Math.abs((previewBox.y + previewBox.height / 2) - (spriteBox.y + spriteBox.height / 2))).toBeLessThanOrEqual(1);
      expect(spriteBox.x).toBeGreaterThan(previewBox.x);
      expect(spriteBox.x + spriteBox.width).toBeLessThan(previewBox.x + previewBox.width);
    }
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
