import { test, expect, Page } from '@playwright/test';

type ItemRecord = Record<string, any>;
type EvolvingRecord = {
  id: number;
  item_evo_id: number;
  item_evolve_level: number;
  item_id: number;
  type: number;
  sub_type: string;
  required_amount: number;
};

function makeItem(id: number, name: string, overrides: Record<string, any> = {}): ItemRecord {
  return {
    id,
    name,
    lore: '',
    itemtype: 0,
    itemclass: 0,
    loregroup: 0,
    minstatus: 0,
    scriptfileid: 0,
    stackable: 0,
    stacksize: 0,
    size: 0,
    weight: 0,
    reclevel: 0,
    reqlevel: 0,
    recskill: 0,
    magic: 0,
    nodrop: 1,
    fvnodrop: 0,
    norent: 1,
    tradeskills: 0,
    book: 0,
    notransfer: 0,
    summonedflag: 0,
    questitemflag: 0,
    artifactflag: 0,
    nopet: 0,
    attuneable: 0,
    potionbelt: 0,
    placeable: 0,
    epicitem: 0,
    expendablearrow: 0,
    heirloom: 0,
    classes: 65535,
    races: 65535,
    deity: 0,
    slots: 0,
    idfile: 0,
    icon: 0,
    color: 0,
    material: 0,
    elitematerial: 0,
    light: 0,
    herosforgemodel: 0,
    ac: 0,
    hp: 0,
    mana: 0,
    endur: 0,
    purity: 0,
    clickeffect: -1,
    proceffect: -1,
    worneffect: -1,
    focuseffect: -1,
    scrolleffect: -1,
    bardeffect: -1,
    casttime: 0,
    casttime_: 0,
    maxcharges: 0,
    recastdelay: 0,
    clicktype: 0,
    augtype: 0,
    augdistiller: 0,
    augrestrict: 0,
    evoitem: 0,
    evoid: 0,
    evolvinglevel: 0,
    evomax: 0,
    ...overrides,
  };
}

async function mockApis(page: Page) {
  let evolvingDetails: EvolvingRecord[] = [
    { id: 1, item_evo_id: 500, item_evolve_level: 1, item_id: 100, type: 1, sub_type: '0', required_amount: 100 },
    { id: 2, item_evo_id: 500, item_evolve_level: 2, item_id: 101, type: 1, sub_type: '1', required_amount: 250 },
    { id: 3, item_evo_id: 700, item_evolve_level: 1, item_id: 200, type: 4, sub_type: '1', required_amount: 75 },
  ];

  const itemsById: Record<number, ItemRecord> = {
    100: makeItem(100, 'Dormant Blade', { evoitem: 1, evoid: 500, evolvinglevel: 1, evomax: 2 }),
    101: makeItem(101, 'Awakened Blade', { evoitem: 1, evoid: 500, evolvinglevel: 2, evomax: 2 }),
    200: makeItem(200, 'Wayfarer Sigil', { evoitem: 1, evoid: 700, evolvinglevel: 1, evomax: 1 }),
    300: makeItem(300, 'First Ember'),
    301: makeItem(301, 'Second Ember'),
  };

  let lastSavedItem: ItemRecord | null = null;

  await page.route('**/api/v1/**', route => {
    if (!route.request().isNavigationRequest()) {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else {
      route.continue();
    }
  });

  await page.route('https://api.github.com/**', route => route.abort());

  await page.route('**/api/v1/items/bulk', route => {
    const body = JSON.parse(route.request().postData() || '{}');
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const items = ids.map((id: number) => itemsById[id]).filter(Boolean);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(items) });
  });

  await page.route('**/api/v1/items_evolving_details**', route => {
    const url = new URL(route.request().url());
    let details = evolvingDetails;
    const where = url.searchParams.get('where') || '';
    const evoIdMatch = where.match(/item_evo_id__(\d+)/);
    if (evoIdMatch) {
      const evoId = parseInt(evoIdMatch[1], 10);
      details = evolvingDetails.filter(detail => detail.item_evo_id === evoId);
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(details) });
  });

  await page.route('**/api/v1/items_evolving_detail/*', route => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const id = parseInt(url.pathname.split('/').pop() || '0', 10);

    if (method === 'PATCH') {
      const payload = JSON.parse(route.request().postData() || '{}');
      evolvingDetails = evolvingDetails.map(detail => detail.id === id ? { ...detail, ...payload } : detail);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
    }

    if (method === 'DELETE') {
      evolvingDetails = evolvingDetails.filter(detail => detail.id !== id);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ deleted: true }) });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/v1/items_evolving_detail', route => {
    const method = route.request().method();
    if (method === 'PUT') {
      const payload = JSON.parse(route.request().postData() || '{}');
      const nextId = payload.id && payload.id > 0
        ? payload.id
        : Math.max(0, ...evolvingDetails.map(detail => detail.id)) + 1;
      evolvingDetails = evolvingDetails.concat([{ ...payload, id: nextId }]);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...payload, id: nextId }) });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/v1/item/*', route => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const id = parseInt(url.pathname.split('/').pop() || '0', 10);

    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(itemsById[id] || makeItem(id, `Item ${id}`)),
      });
    }

    if (method === 'PATCH') {
      const payload = JSON.parse(route.request().postData() || '{}');
      itemsById[id] = { ...itemsById[id], ...payload };
      lastSavedItem = itemsById[id];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(itemsById[id]) });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/v1/zones**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { short_name: 'qeynos', long_name: 'South Qeynos', zoneidnumber: 1, expansion: 0, version: 0 },
        { short_name: 'halas', long_name: 'Halas', zoneidnumber: 2, expansion: 0, version: 0 },
      ]),
    })
  );

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
          os: 'windows',
        },
      }),
    })
  );

  return {
    getEvolvingDetails: () => evolvingDetails,
    getLastSavedItem: () => lastSavedItem,
  };
}

async function navigateViaRouter(page: Page, path: string) {
  await page.goto('/');
  await page.waitForSelector('#sidebar', { timeout: 20000 });
  await page.evaluate((targetPath) => {
    window.history.pushState({}, '', targetPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

test.describe('Evolving Items Editor', () => {
  test('navbar submenu routes to the evolving items editor', async ({ page }) => {
    await mockApis(page);
    await page.goto('/');

    await page.locator('#sidebar a.nav-link').filter({ hasText: 'Items' }).first().click();
    await page.locator('#sidebar .nav.nav-sm .nav-link').filter({ hasText: 'Evolving' }).click();

    await expect(page).toHaveURL(/\/items\/evolving$/);
    await expect(page.locator('#evolving-items-table tbody tr')).toHaveCount(2);
  });

  test('grouped chains render and support create, add, edit, and delete', async ({ page }) => {
    const state = await mockApis(page);
    await navigateViaRouter(page, '/items/evolving');
    await page.waitForSelector('#evolving-items-table', { timeout: 20000 });

    const groups = page.locator('#evolving-items-table tbody tr');
    await expect(groups).toHaveCount(2);
    await expect(groups.first()).toContainText('500');
    await expect(groups.first()).toContainText('Dormant Blade');

    await page.locator('#new-evolution-btn').click();
    await page.locator('#evolving-detail-item-id').fill('300');
    await page.locator('#evolving-detail-required').fill('10');
    await page.locator('#save-evolution-entry-btn').click();

    await expect(page.locator('#evolving-items-table tbody tr')).toHaveCount(3);
    await expect(page.locator('#evolving-items-table tbody tr').filter({ hasText: '701' })).toHaveCount(1);

    await page.locator('#evolving-items-table tbody tr').filter({ hasText: '701' }).click();
    await page.locator('#add-evolution-level-btn').click();
    await page.locator('#evolving-detail-item-id').fill('301');
    await page.locator('#evolving-detail-required').fill('20');
    await page.locator('#save-evolution-entry-btn').click();

    await expect(page.locator('#selected-evolution-chain-table tbody tr')).toHaveCount(2);
    await expect(page.locator('#selected-evolution-chain-table')).toContainText('Second Ember');

    await page.locator('#edit-evolution-entry-4').click();
    await page.locator('#evolving-detail-required').fill('25');
    await page.locator('#save-evolution-entry-btn').click();
    await expect(page.locator('#selected-evolution-chain-table')).toContainText('25');

    page.once('dialog', dialog => dialog.accept());
    await page.locator('#delete-evolution-entry-5').click();
    await expect(page.locator('#selected-evolution-chain-table tbody tr')).toHaveCount(1);
    await expect(state.getEvolvingDetails().filter(detail => detail.item_evo_id === 701)).toHaveLength(1);
  });

  test('item editor evolving tab loads chain data, warns on misconfiguration, and links to the chain manager', async ({ page }) => {
    const state = await mockApis(page);
    await navigateViaRouter(page, '/item/100');
    await page.waitForSelector('#item-edit-card', { timeout: 20000 });

    await page.locator('.eq-tab-box-fancy a').filter({ hasText: 'Evolving' }).click();

    await expect(page.locator('#evoitem')).toHaveValue('1');
    await expect(page.locator('#evoid')).toHaveValue('500');
    await expect(page.locator('#evolvinglevel')).toHaveValue('1');
    await expect(page.locator('#evomax')).toHaveValue('2');

    await expect(page.locator('#item-editor-evolving-chain-table tbody tr')).toHaveCount(2);
    await expect(page.locator('#item-editor-evolving-chain-table tbody tr.evolving-chain-current-row')).toContainText('Dormant Blade');

    await page.locator('#evomax').fill('3');
    await expect(page.locator('.alert-warning')).toContainText('evomax (3) does not match the chain length (2).');

    await page.locator('#item-editor-manage-evolution-btn').click();
    await expect(page).toHaveURL(/\/items\/evolving\?evoId=500$/);

    await page.goBack();
    await page.waitForSelector('#item-edit-card', { timeout: 20000 });
    await page.locator('.eq-tab-box-fancy a').filter({ hasText: 'Evolving' }).click();
    await page.locator('label[for="evoitem"]').click();
    await expect(page.locator('#evoitem')).not.toBeChecked();
    await page.locator('button').filter({ hasText: 'Save Item' }).click();

    await expect.poll(() => state.getLastSavedItem()?.evoitem).toBe(0);
  });
});
