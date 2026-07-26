import { expect, Page, test } from '@playwright/test';

type MercenaryState = {
  mercenaries: Array<Record<string, unknown>>;
  buffs: Array<Record<string, unknown>>;
  audit: Array<Record<string, unknown>>;
  createPayload?: Record<string, unknown>;
  updatePayload?: Record<string, unknown>;
  deletePayload?: Record<string, unknown>;
  buffCreatePayload?: Record<string, unknown>;
  buffUpdatePayload?: Record<string, unknown>;
  deletedBuffs: number[];
};

const owner = {
  id: 930001,
  name: 'MeraStone',
  account_id: 930001,
  level: 65,
  class: 3,
  race: 1,
  gender: 1,
  merc_count: 1,
};

const alternateOwner = {
  id: 930002,
  name: 'TorrenVale',
  account_id: 930002,
  level: 70,
  class: 1,
  race: 8,
  gender: 0,
  merc_count: 0,
};

const spell = {
  id: 10,
  name: 'Augmentation',
  icon: 32,
  duration_formula: 3,
  duration: 120,
  good_effect: 1,
  resist_type: 0,
  target_type: 5,
};

const mercenary = {
  merc_id: 940001,
  owner_character_id: owner.id,
  owner_name: owner.name,
  owner_account_id: owner.account_id,
  owner_level: owner.level,
  owner_class: owner.class,
  owner_race: owner.race,
  owner_gender: owner.gender,
  slot: 0,
  name: 'Alden Ward',
  template_id: 701,
  suspended_time: 0,
  is_suspended: false,
  timer_remaining: 0,
  gender: 0,
  merc_size: 5,
  stance_id: 2,
  hp: 8500,
  mana: 2400,
  endurance: 3200,
  face: 1,
  luclin_hair_style: 2,
  luclin_hair_color: 3,
  luclin_eye_color: 4,
  luclin_eye_color_2: 4,
  luclin_beard_color: 0,
  luclin_beard: 0,
  drakkin_heritage: 0,
  drakkin_tattoo: 0,
  drakkin_details: 0,
  buff_count: 1,
};

const buff = {
  merc_buff_id: 950001,
  merc_id: mercenary.merc_id,
  spell_id: spell.id,
  spell_name: spell.name,
  spell_icon: spell.icon,
  caster_level: 65,
  duration_formula: 3,
  tics_remaining: 120,
  poison_counters: 0,
  disease_counters: 0,
  curse_counters: 0,
  corruption_counters: 0,
  hit_count: 0,
  melee_rune: 0,
  magic_rune: 0,
  dot_rune: 0,
  cast_on_x: 0,
  cast_on_y: 0,
  cast_on_z: 0,
  persistent: false,
  extra_di_chance: 0,
};

function detail(state: MercenaryState, id: number) {
  const selected = state.mercenaries.find(record => Number(record.merc_id) === id);
  return {
    mercenary: selected,
    buffs: state.buffs.filter(record => Number(record.merc_id) === id),
  };
}

async function installMercenaryMocks(page: Page, state: MercenaryState) {
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

  await page.route('**/api/v1/mercenary-editor/references/characters**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [owner, alternateOwner], total: 2, page: 1, limit: 20 }),
    })
  );

  await page.route('**/api/v1/mercenary-editor/references/spells**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [spell], total: 1, page: 1, limit: 20 }),
    })
  );

  await page.route('**/api/v1/mercenary-editor/mercenary/*/audit**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: state.audit, total: state.audit.length, page: 1, limit: 50 }),
    })
  );

  await page.route('**/api/v1/mercenary-editor/mercenary/*/buff/*', async route => {
    const request = route.request();
    const parts = new URL(request.url()).pathname.split('/');
    const buffID = Number(parts.pop());
    const mercenaryID = Number(parts[parts.length - 2]);
    if (request.method() === 'PATCH') {
      state.buffUpdatePayload = request.postDataJSON();
      const selected = state.buffs.find(record => Number(record.merc_buff_id) === buffID);
      Object.assign(selected || {}, state.buffUpdatePayload);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...selected, spell_name: spell.name, spell_icon: spell.icon }),
      });
    }
    if (request.method() === 'DELETE') {
      state.deletedBuffs.push(buffID);
      state.buffs = state.buffs.filter(record => Number(record.merc_buff_id) !== buffID);
      const selected = state.mercenaries.find(record => Number(record.merc_id) === mercenaryID);
      if (selected) selected.buff_count = state.buffs.filter(record => Number(record.merc_id) === mercenaryID).length;
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 404, body: '' });
  });

  await page.route('**/api/v1/mercenary-editor/mercenary/*/buff', async route => {
    const request = route.request();
    const parts = new URL(request.url()).pathname.split('/');
    const mercenaryID = Number(parts[parts.length - 2]);
    state.buffCreatePayload = request.postDataJSON();
    const created = {
      merc_buff_id: 950002,
      merc_id: mercenaryID,
      ...state.buffCreatePayload,
      spell_name: spell.name,
      spell_icon: spell.icon,
    };
    state.buffs.push(created);
    const selected = state.mercenaries.find(record => Number(record.merc_id) === mercenaryID);
    if (selected) selected.buff_count = state.buffs.filter(record => Number(record.merc_id) === mercenaryID).length;
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(created),
    });
  });

  await page.route('**/api/v1/mercenary-editor/mercenary/*/copy', async route => {
    const sourceID = Number(new URL(route.request().url()).pathname.split('/').slice(-2)[0]);
    const source = state.mercenaries.find(record => Number(record.merc_id) === sourceID);
    const copied = {
      ...source,
      merc_id: 940002,
      slot: 1,
      name: `${source?.name} Copy`,
    };
    state.mercenaries.push(copied);
    state.buffs.push(
      ...state.buffs
        .filter(record => Number(record.merc_id) === sourceID)
        .map(record => ({ ...record, merc_buff_id: 950100 + state.buffs.length, merc_id: 940002 }))
    );
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(detail(state, 940002)),
    });
  });

  await page.route('**/api/v1/mercenary-editor/mercenary/*', async route => {
    const request = route.request();
    const id = Number(new URL(request.url()).pathname.split('/').pop());
    if (request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail(state, id)),
      });
    }
    if (request.method() === 'PATCH') {
      state.updatePayload = request.postDataJSON();
      const selected = state.mercenaries.find(record => Number(record.merc_id) === id);
      Object.assign(selected || {}, state.updatePayload);
      if (selected && Number(selected.owner_character_id) === alternateOwner.id) {
        Object.assign(selected, {
          owner_name: alternateOwner.name,
          owner_account_id: alternateOwner.account_id,
          owner_level: alternateOwner.level,
          owner_class: alternateOwner.class,
          owner_race: alternateOwner.race,
          owner_gender: alternateOwner.gender,
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail(state, id)),
      });
    }
    if (request.method() === 'DELETE') {
      state.deletePayload = request.postDataJSON();
      state.mercenaries = state.mercenaries.filter(record => Number(record.merc_id) !== id);
      state.buffs = state.buffs.filter(record => Number(record.merc_id) !== id);
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 404, body: '' });
  });

  await page.route('**/api/v1/mercenary-editor/mercenary', async route => {
    state.createPayload = route.request().postDataJSON();
    const created = {
      ...mercenary,
      ...state.createPayload,
      merc_id: 940010,
      owner_name: owner.name,
      owner_account_id: owner.account_id,
      owner_level: owner.level,
      owner_class: owner.class,
      owner_race: owner.race,
      owner_gender: owner.gender,
      buff_count: 0,
    };
    state.mercenaries.push(created);
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(detail(state, 940010)),
    });
  });

  await page.route('**/api/v1/mercenary-editor/mercenaries**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: state.mercenaries,
        total: state.mercenaries.length,
        page: 1,
        limit: 30,
      }),
    })
  );
}

test.describe('Mercenary Editor', () => {
  test('loads native navigation, human context, route state, and owner reassignment', async ({ page }) => {
    const state: MercenaryState = {
      mercenaries: [{ ...mercenary }],
      buffs: [{ ...buff }],
      audit: [],
      deletedBuffs: [],
    };
    await installMercenaryMocks(page, state);
    await page.goto('/mercenaries?mercenary=940001');

    await expect(page.getByTestId('mercenary-inspector')).toBeVisible();
    await expect(page.getByTestId('mercenary-inspector').locator('h2')).toHaveText('Alden Ward');
    await expect(page.locator('#sidebar .nav.nav-sm a[href="/mercenaries"]')).toHaveCount(1);
    await expect(page.locator('#sidebar .nav.nav-sm a[href="/mercenaries"]')).toBeVisible();
    await expect(page.locator('#mercenary-stance')).toHaveValue('2');
    await expect(page.locator('#mercenary-template').locator('xpath=following-sibling::*[1]')).toContainText(
      'no mercenary template table'
    );

    await page.getByRole('tab', { name: 'Owner & State', exact: true }).click();
    await expect(page).toHaveURL(/tab=Owner\+%26\+State/);
    await page.getByLabel('Find owner character').fill('Torren');
    await expect(page.getByRole('button', { name: /TorrenVale/ })).toBeVisible();
    await page.getByRole('button', { name: /TorrenVale/ }).click();
    await expect(page.locator('.owner-facts')).toContainText('930002');
    await page.getByTestId('mercenary-save').click();
    expect(state.updatePayload).toMatchObject({
      owner_character_id: 930002,
      stance_id: 2,
      merc_size: 5,
    });

    await page.getByTestId('mercenary-new').click();
    await expect(page.locator('#mercenary-stance')).toHaveValue('0');
    await expect(page.locator('#mercenary-size')).toHaveValue('5');
    await page.getByRole('tab', { name: 'Appearance', exact: true }).click();
    await expect(page.locator('#mercenary-face')).toHaveValue('1');

    await page.setViewportSize({ width: 640, height: 900 });
    const directoryBox = await page.getByTestId('mercenary-directory').boundingBox();
    const inspectorBox = await page.getByTestId('mercenary-inspector').boundingBox();
    if (!directoryBox || !inspectorBox) throw new Error('Compact Mercenary geometry is unavailable');
    expect(inspectorBox.y).toBeGreaterThan(directoryBox.y);
    await expect(page.getByRole('tab', { name: 'Owner & State', exact: true })).toBeVisible();
  });

  test('preserves a loaded zero size and labels a successful creation correctly', async ({ page }) => {
    const state: MercenaryState = {
      mercenaries: [{ ...mercenary, merc_size: 0 }],
      buffs: [],
      audit: [],
      deletedBuffs: [],
    };
    await installMercenaryMocks(page, state);
    await page.goto('/mercenaries?mercenary=940001');

    await expect(page.locator('#mercenary-size')).toHaveValue('0');

    await page.getByTestId('mercenary-new').click();
    await page.locator('#mercenary-name').fill('New Mercenary');
    await page.getByRole('tab', { name: 'Owner & State', exact: true }).click();
    await page.getByLabel('Find owner character').fill('Mera');
    await page.locator('.mercenary-lookup-results').getByRole('button', { name: /MeraStone/ }).click();
    await expect(page.getByTestId('mercenary-save')).toBeEnabled();
    await page.getByTestId('mercenary-save').click();

    await expect(page.locator('.spire-editor-notification')).toHaveText(/Mercenary created/);
    expect(state.createPayload).toMatchObject({
      name: 'New Mercenary',
      owner_character_id: owner.id,
      merc_size: 5,
    });
  });

  test('guards route-driven mercenary changes when the editor is dirty', async ({ page }) => {
    const secondMercenary = {
      ...mercenary,
      merc_id: 940002,
      slot: 1,
      name: 'Bryn Ward',
    };
    const state: MercenaryState = {
      mercenaries: [{ ...mercenary }, secondMercenary],
      buffs: [],
      audit: [],
      deletedBuffs: [],
    };
    await installMercenaryMocks(page, state);
    await page.goto('/mercenaries?mercenary=940001');

    await page.locator('#mercenary-name').fill('Unsaved Alden');
    const discardDialogPromise = page.waitForEvent('dialog');
    const rejectedNavigation = page.evaluate(() => {
      window.history.pushState({}, '', '/mercenaries?mercenary=940002');
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    });
    const discardDialog = await discardDialogPromise;
    expect(discardDialog.message()).toBe('Discard unsaved mercenary changes?');
    await discardDialog.dismiss();
    await rejectedNavigation;

    await expect(page.locator('#mercenary-name')).toHaveValue('Unsaved Alden');
    await expect(page).toHaveURL(/mercenary=940001/);

    const acceptDialogPromise = page.waitForEvent('dialog');
    const acceptedNavigation = page.evaluate(() => {
      window.history.pushState({}, '', '/mercenaries?mercenary=940002');
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    });
    const acceptDialog = await acceptDialogPromise;
    await acceptDialog.accept();
    await acceptedNavigation;

    await expect(page.getByTestId('mercenary-inspector').locator('h2')).toHaveText('Bryn Ward');
  });

  test('loads audit data for route-driven and initial audit tabs', async ({ page }) => {
    const state: MercenaryState = {
      mercenaries: [{ ...mercenary }],
      buffs: [],
      audit: [{
        id: 77,
        event_name: 'MERCENARY_UPDATE',
        user_name: 'QA Operator',
        created_at: '2026-07-26T20:00:00Z',
        data: { reason: 'Route audit regression coverage' },
      }],
      deletedBuffs: [],
    };
    await installMercenaryMocks(page, state);
    await page.goto('/mercenaries?mercenary=940001');

    await page.evaluate(() => {
      window.history.pushState({}, '', '/mercenaries?tab=Audit%20Trail&mercenary=940001');
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    });
    await expect(page.locator('.mercenary-audit-list')).toContainText('QA Operator');

    await page.goto('/mercenaries?tab=Audit%20Trail&mercenary=940001');

    await expect(page.locator('.mercenary-audit-list')).toContainText('QA Operator');
    await expect(page.locator('.mercenary-audit-list')).toContainText('Route audit regression coverage');
  });

  test('requires explicit confirmation for copy and exact-name guarded deletion', async ({ page }) => {
    const state: MercenaryState = {
      mercenaries: [{ ...mercenary }],
      buffs: [{ ...buff }],
      audit: [],
      deletedBuffs: [],
    };
    await installMercenaryMocks(page, state);
    await page.goto('/mercenaries?mercenary=940001');

    page.once('dialog', dialog => dialog.accept());
    await page.getByTestId('mercenary-copy').click();
    await expect(page.getByTestId('mercenary-inspector').locator('h2')).toHaveText('Alden Ward Copy');
    await expect(page).toHaveURL(/mercenary=940002/);

    await page.getByTestId('mercenary-delete').click();
    const deleteDialog = page.getByRole('dialog', { name: 'Delete mercenary' });
    await expect(deleteDialog).toBeVisible();
    const permanentDelete = deleteDialog.getByRole('button', { name: 'Delete permanently' });
    await expect(permanentDelete).toBeDisabled();
    await deleteDialog.locator('#mercenary-delete-confirmation').fill('Alden Ward Copy');
    await deleteDialog.locator('#mercenary-delete-reason').fill('Duplicate created during editor QA');
    await expect(permanentDelete).toBeEnabled();
    await permanentDelete.click();

    expect(state.deletePayload).toEqual({
      confirmation: 'Alden Ward Copy',
      reason: 'Duplicate created during editor QA',
    });
    await expect(page.getByTestId('mercenary-directory')).not.toContainText('Alden Ward Copy');
    await expect(page.getByTestId('mercenary-inspector').locator('h2')).toHaveText('Alden Ward');
  });

  test('uses spell-aware buff selection and confirms buff removal', async ({ page }) => {
    const state: MercenaryState = {
      mercenaries: [{ ...mercenary, buff_count: 0 }],
      buffs: [],
      audit: [],
      deletedBuffs: [],
    };
    await installMercenaryMocks(page, state);
    await page.goto('/mercenaries?tab=Buffs&mercenary=940001');

    await page.getByTestId('mercenary-add-buff').click();
    const buffDialog = page.getByRole('dialog', { name: 'Add mercenary buff' });
    await buffDialog.locator('#mercenary-buff-spell-search').fill('Augment');
    await buffDialog.getByRole('button', { name: /Augmentation/ }).click();
    await buffDialog.locator('#mercenary-buff-caster-level').fill('65');
    await buffDialog.locator('#mercenary-buff-ticks').fill('96');
    await buffDialog.getByRole('button', { name: 'Save buff' }).click();

    expect(state.buffCreatePayload).toMatchObject({
      spell_id: 10,
      caster_level: 65,
      duration_formula: 3,
      tics_remaining: 96,
    });
    await expect(page.getByTestId('mercenary-inspector')).toContainText('Augmentation');

    await page.getByRole('button', { name: /Augmentation/ }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit mercenary buff' });
    await editDialog.locator('#mercenary-buff-ticks').fill('48');
    await editDialog.getByRole('button', { name: 'Save buff' }).click();
    expect(state.buffUpdatePayload).toMatchObject({ tics_remaining: 48 });

    await page.getByRole('button', { name: /Augmentation/ }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('dialog', { name: 'Edit mercenary buff' }).getByRole('button', { name: 'Remove buff' }).click();
    expect(state.deletedBuffs).toEqual([950002]);
    await expect(page.getByText('No active buffs', { exact: true })).toBeVisible();
  });
});
