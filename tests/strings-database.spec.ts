import { expect, Page, test } from '@playwright/test';

type DbString = {
  id: number;
  type: number;
  value: string;
};

function filterStringsForRequest(strings: DbString[], url: URL) {
  const where = url.searchParams.get('where') || '';
  const filters: string[] = [];
  let filter = '';
  for (let index = 0; index < where.length; index++) {
    if (where[index] === '\\' && index + 1 < where.length && (where[index + 1] === '.' || where[index + 1] === '\\')) {
      filter += where[index + 1];
      index++;
    } else if (where[index] === '.') {
      if (filter) filters.push(filter);
      filter = '';
    } else {
      filter += where[index];
    }
  }
  if (filter) filters.push(filter);

  const typeMatch = filters.find(value => value.startsWith('type__'))?.match(/^type__(\d+)/);
  const idMatch = filters.find(value => value.startsWith('id__'))?.match(/^id__(\d+)/);
  const idGreaterThanMatch = filters.find(value => value.startsWith('id_gt_'))?.match(/^id_gt_(\d+)/);
  const idLessThanEqualMatch = filters.find(value => value.startsWith('id_lte_'))?.match(/^id_lte_(\d+)/);
  const valueMatch = filters.find(value => value.startsWith('value_like_'))?.match(/^value_like_(.*)/);

  let response = strings.filter(string => {
    if (typeMatch && string.type !== parseInt(typeMatch[1], 10)) return false;
    if (idMatch && string.id !== parseInt(idMatch[1], 10)) return false;
    if (idGreaterThanMatch && string.id <= parseInt(idGreaterThanMatch[1], 10)) return false;
    if (idLessThanEqualMatch && string.id > parseInt(idLessThanEqualMatch[1], 10)) return false;
    if (valueMatch && !string.value.toLowerCase().includes(valueMatch[1].toLowerCase())) return false;
    return true;
  });

  if (url.searchParams.get('orderBy') === 'id') {
    const direction = url.searchParams.get('orderDirection') === 'desc' ? -1 : 1;
    response = response.slice().sort((left, right) => (left.id - right.id) * direction);
  }

  return response;
}

async function mockStringsDatabaseApis(page: Page, options: {
  scanGate?: Promise<void>;
  selectedPageGate?: {
    type: number;
    id: number;
    started: () => void;
    release: Promise<void>;
  };
} = {}) {
  let strings: DbString[] = [
    {
      id: 1,
      type: 0,
      value: 'QA braces {{ 7 * 7 }}<BR>Second line <img src=x onerror="window.__stringsPreviewExecuted=true">',
    },
    { id: 1, type: 5, value: 'Strength' },
    { id: 2, type: 5, value: 'Stamina' },
    { id: 4, type: 5, value: 'Dexterity' },
    { id: 12, type: 5, value: 'Charisma' },
    { id: 13, type: 5, value: 'Cold' },
    { id: 1, type: 28, value: 'Fire. Bolt' },
    { id: 2, type: 28, value: 'Fire starter' },
    ...Array.from({ length: 55 }, (_, index) => ({
      id: index + 1,
      type: 6,
      value: index === 10 || index === 52 ? `Needle result ${index + 1}` : `Paged string ${index + 1}`,
    })),
    ...Array.from({ length: 1000 }, (_, index) => ({
      id: index + 1,
      type: 7,
      value: `Contiguous string ${index + 1}`,
    })),
    { id: 1002, type: 7, value: 'After the paged gap' },
  ];
  const listUrls: string[] = [];
  const createdRecords: DbString[] = [];
  let createRequests = 0;
  let deleteRequests = 0;
  let updateRequests = 0;
  let selectedPageGateUsed = false;

  // Playwright evaluates matching routes in reverse registration order. Keep
  // the broad fallback first so the Strings DB handlers below win.
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
          version: '5.0.1',
          features: {},
          settings: [],
          os: 'windows',
        },
      }),
    })
  );

  await page.route('**/api/v1/db_strs**', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('select') === 'id.type' && options.scanGate) {
      await options.scanGate;
    }
    const where = url.searchParams.get('where') || '';
    if (
      url.pathname.endsWith('/count') &&
      options.selectedPageGate &&
      !selectedPageGateUsed &&
      where.includes(`type__${options.selectedPageGate.type}`) &&
      where.includes(`id_lte_${options.selectedPageGate.id}`)
    ) {
      selectedPageGateUsed = true;
      options.selectedPageGate.started();
      await options.selectedPageGate.release;
    }
    const filtered = filterStringsForRequest(strings, url);

    if (url.pathname.endsWith('/count')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: filtered.length }),
      });
    }

    listUrls.push(url.toString());
    const limit = parseInt(url.searchParams.get('limit') || '1000', 10);
    const pageIndex = parseInt(url.searchParams.get('page') || '0', 10);
    const response = filtered.slice(pageIndex * limit, (pageIndex + 1) * limit);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  await page.route('**/api/v1/db_str', route => {
    if (route.request().method() !== 'PUT') {
      return route.fallback();
    }
    createRequests++;
    const record = JSON.parse(route.request().postData() || '{}') as DbString;
    if (strings.some(string => string.id === record.id && string.type === record.type)) {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Error inserting entity [Duplicate entry]' }),
      });
    }
    createdRecords.push(record);
    strings = strings.concat(record);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(record),
    });
  });

  await page.route('**/api/v1/db_str/*', route => {
    const url = new URL(route.request().url());
    const id = parseInt(url.pathname.split('/').pop() || '-1', 10);
    const typeMatch = (url.searchParams.get('where') || '').match(/(?:^|\.)type__(\d+)/);
    const type = typeMatch ? parseInt(typeMatch[1], 10) : -1;

    if (route.request().method() === 'PATCH') {
      updateRequests++;
      const record = JSON.parse(route.request().postData() || '{}') as DbString;
      strings = strings.map(string => string.id === id && string.type === type ? record : string);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(record),
      });
    }

    if (route.request().method() === 'DELETE') {
      deleteRequests++;
      strings = strings.filter(string => !(string.id === id && string.type === type));
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ deleted: true }) });
    }

    return route.fallback();
  });

  return {
    getCreateRequests: () => createRequests,
    getCreatedRecords: () => createdRecords,
    getDeleteRequests: () => deleteRequests,
    getListRequests: () => listUrls.length,
    getListUrls: () => listUrls,
    getUpdateRequests: () => updateRequests,
  };
}

test.describe('Strings Database Editor', () => {
  test('renders type 0 safely and only requests a bounded category page', async ({ page }) => {
    const api = await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=0&selectedId=1');

    const preview = page.locator('.string-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toHaveText(
      'QA braces {{ 7 * 7 }}\nSecond line <img src=x onerror="window.__stringsPreviewExecuted=true">',
    );
    await expect(preview).not.toContainText('QA braces 49');
    await expect(preview).toHaveCSS('white-space', 'pre-wrap');
    await expect.poll(() => page.evaluate(() => (window as any).__stringsPreviewExecuted)).toBeUndefined();

    expect(api.getListUrls().length).toBeGreaterThan(0);
    for (const requestUrl of api.getListUrls()) {
      const url = new URL(requestUrl);
      expect(url.searchParams.get('where')).toContain('type__0');
      expect(parseInt(url.searchParams.get('limit') || '0', 10)).toBeLessThanOrEqual(50);
    }
  });

  test('protects unsaved edits and does not refetch a type when selecting rows', async ({ page }) => {
    const api = await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=5&selectedId=12');

    const value = page.locator('#selected_value');
    await expect(value).toHaveValue('Charisma');
    const requestsAfterLoad = api.getListRequests();

    await value.fill('Unsaved Charisma');
    page.once('dialog', async dialog => {
      expect(dialog.message()).toBe('Discard unsaved string changes?');
      await dialog.dismiss();
    });
    await page.locator('#string-13').click();

    await expect(value).toHaveValue('Unsaved Charisma');
    await expect(page).toHaveURL(/selectedId=12/);
    expect(api.getListRequests()).toBe(requestsAfterLoad);

    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('select').selectOption('0');
    await expect(page.locator('select')).toHaveValue('5');
    await expect(value).toHaveValue('Unsaved Charisma');

    page.once('dialog', dialog => dialog.accept());
    await page.locator('#string-13').click();
    await expect(value).toHaveValue('Cold');
    await expect(page).toHaveURL(/selectedId=13/);
    expect(api.getListRequests()).toBe(requestsAfterLoad);
  });

  test('lets the user choose an unused ID and blocks an existing one before insert', async ({ page }) => {
    const api = await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=5');

    await page.getByRole('button', { name: 'Create' }).click();
    const idInput = page.locator('#selected_id');
    await expect(idInput).toBeEnabled();
    await expect(idInput).toHaveValue('3');
    await expect(page.getByText('ID 3 is available for this type.', { exact: true })).toBeVisible();

    await idInput.fill('12');
    await idInput.blur();
    await expect(page.getByText('ID 12 already exists for this type. Choose another ID.', { exact: true })).toBeVisible();
    await expect(page.locator('.col-6.fade-in').getByRole('button', { name: 'Create' })).toBeDisabled();
    expect(api.getCreateRequests()).toBe(0);

    await idInput.fill('42');
    await idInput.blur();
    await expect(page.getByText('ID 42 is available for this type.', { exact: true })).toBeVisible();
    await page.locator('#selected_value').fill('Chosen string ID');
    await page.locator('.col-6.fade-in').getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Saved successfully', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/type=5&selectedId=42/);
    expect(api.getCreateRequests()).toBe(1);
    expect(api.getCreatedRecords()).toEqual([{ id: 42, type: 5, value: 'Chosen string ID' }]);
  });

  test('finds the lowest available ID across multiple ID-only batches', async ({ page }) => {
    const api = await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=7');

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.locator('#selected_id')).toHaveValue('1001');
    await expect(page.getByText('ID 1001 is available for this type.', { exact: true })).toBeVisible();

    const scanRequests = api.getListUrls()
      .map(requestUrl => new URL(requestUrl))
      .filter(url => url.searchParams.get('select') === 'id.type');
    expect(scanRequests).toHaveLength(2);
    expect(scanRequests[0].searchParams.get('where')).toContain('id_gt_0');
    expect(scanRequests[1].searchParams.get('where')).toContain('id_gt_1000');
    expect(scanRequests.every(url => url.searchParams.get('limit') === '1000')).toBe(true);
  });

  test('pins the selected type and clears the previous editor while the ID scan is running', async ({ page }) => {
    let releaseScan = () => {};
    const scanGate = new Promise<void>(resolve => {
      releaseScan = resolve;
    });
    await mockStringsDatabaseApis(page, { scanGate });
    await page.goto('/strings-database?type=5&selectedId=12');
    await expect(page.locator('#selected_value')).toHaveValue('Charisma');

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('button', { name: 'Preparing' })).toBeVisible();
    await expect(page.getByLabel('String type')).toBeDisabled();
    await expect(page.locator('.col-6.fade-in')).toHaveCount(0);

    releaseScan();
    await expect(page.getByLabel('String type')).toBeEnabled();
    await expect(page.locator('#selected_id')).toHaveValue('3');
    await expect(page.getByText('ID 3 is available for this type.', { exact: true })).toBeVisible();
  });

  test('keeps new rows local until save and keeps delete confirmation visible for an empty type', async ({ page }) => {
    const api = await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=29');

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Create Database String', { exact: true })).toBeVisible();
    await expect(page.locator('#selected_id')).toHaveValue('1');
    expect(api.getCreateRequests()).toBe(0);

    await page.locator('#selected_value').fill('Temporary test string');
    await page.locator('.col-6.fade-in').getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Saved successfully', { exact: true })).toBeVisible();
    expect(api.getCreateRequests()).toBe(1);

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Deleted successfully', { exact: true })).toBeVisible();
    await expect(page.locator('.col-6.fade-in')).toHaveCount(0);
    expect(api.getDeleteRequests()).toBe(1);
  });

  test('clears an exact-ID create search after deleting the newly created row', async ({ page }) => {
    await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=5');

    await page.getByRole('button', { name: 'Create' }).click();
    await page.locator('#selected_value').fill('Temporary gap string');
    await page.locator('.col-6.fade-in').getByRole('button', { name: 'Create' }).click();
    await expect(page.locator('#db-string-search')).toHaveValue('3');
    await expect(page.getByText('Showing 1-1 of 1 strings matching "3"', { exact: true })).toBeVisible();

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.locator('#db-string-search')).toHaveValue('');
    await expect(page.getByText('Showing 1-5 of 5 strings', { exact: true })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(5);
  });

  test('saves an existing row through PATCH and refreshes its persisted value', async ({ page }) => {
    const api = await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=5&selectedId=12');

    const value = page.locator('#selected_value');
    await expect(value).toHaveValue('Charisma');
    const requestsAfterLoad = api.getListRequests();

    await value.fill('Updated Charisma');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Saved successfully', { exact: true })).toBeVisible();
    await expect(value).toHaveValue('Updated Charisma');
    await expect(page).toHaveURL(/type=5&selectedId=12/);
    expect(api.getUpdateRequests()).toBe(1);
    expect(api.getListRequests()).toBe(requestsAfterLoad + 1);
  });

  test('searches within the selected type and pages without loading the entire category', async ({ page }) => {
    const api = await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=6');

    const searchInputBounds = await page.locator('#db-string-search').boundingBox();
    const searchButtonBounds = await page.locator('#db-string-search-submit').boundingBox();
    const clearButtonBounds = await page.locator('#db-string-search-clear').boundingBox();
    await expect(page.locator('.string-search-controls')).toHaveCSS('gap', '12px');
    expect(searchInputBounds).not.toBeNull();
    expect(searchButtonBounds).not.toBeNull();
    expect(clearButtonBounds).not.toBeNull();
    expect(searchButtonBounds!.x - (searchInputBounds!.x + searchInputBounds!.width)).toBeGreaterThanOrEqual(8);
    expect(clearButtonBounds!.x - (searchButtonBounds!.x + searchButtonBounds!.width)).toBeGreaterThanOrEqual(8);

    await expect(page.getByText('Showing 1-50 of 55 strings', { exact: true })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(50);
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('Showing 51-55 of 55 strings', { exact: true })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(5);

    await page.locator('#db-string-search').fill('Needle');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Showing 1-2 of 2 strings matching "Needle"', { exact: true })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.locator('tbody')).toContainText('Needle result 11');
    await expect(page.locator('tbody')).toContainText('Needle result 53');

    const listUrls = api.getListUrls().map(requestUrl => new URL(requestUrl));
    expect(listUrls.every(url => (url.searchParams.get('where') || '').includes('type__6'))).toBe(true);
    const searchRequest = listUrls[listUrls.length - 1];
    expect(searchRequest.searchParams.get('where')).toContain('value_like_Needle');
    expect(searchRequest.searchParams.get('limit')).toBe('50');
  });

  test('keeps a deep-linked selection visible on its paged result page', async ({ page }) => {
    await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=6&selectedId=53');

    await expect(page.getByText('Showing 51-55 of 55 strings', { exact: true })).toBeVisible();
    await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible();
    await expect(page.locator('#string-53')).toBeVisible();
    await expect(page.locator('#string-53')).toHaveClass(/pulsate-highlight-white/);
    await expect(page.locator('#selected_value')).toHaveValue('Needle result 53');
  });

  test('ignores stale deep-link initialization after a newer navigation', async ({ page }) => {
    let releaseSelectedPage = () => {};
    let markSelectedPageStarted = () => {};
    const selectedPageRelease = new Promise<void>(resolve => {
      releaseSelectedPage = resolve;
    });
    const selectedPageStarted = new Promise<void>(resolve => {
      markSelectedPageStarted = resolve;
    });
    await mockStringsDatabaseApis(page, {
      selectedPageGate: {
        type: 6,
        id: 53,
        started: markSelectedPageStarted,
        release: selectedPageRelease,
      },
    });
    await page.goto('/strings-database?type=5&selectedId=12');
    await expect(page.locator('#selected_value')).toHaveValue('Charisma');

    await page.evaluate(() => {
      window.history.pushState({}, '', '/strings-database?type=6&selectedId=53');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await selectedPageStarted;
    await page.evaluate(() => {
      window.history.pushState({}, '', '/strings-database?type=5&selectedId=13');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await expect(page.locator('#selected_value')).toHaveValue('Cold');
    await expect(page).toHaveURL(/type=5&selectedId=13/);
    releaseSelectedPage();
    await page.waitForTimeout(250);

    await expect(page.locator('#selected_value')).toHaveValue('Cold');
    await expect(page.locator('#string-13')).toHaveClass(/pulsate-highlight-white/);
    await expect(page.getByText('Showing 1-5 of 5 strings', { exact: true })).toBeVisible();
  });

  test('preserves periods as part of text search phrases', async ({ page }) => {
    const api = await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=28');

    await page.locator('#db-string-search').fill('Fire. Bolt');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText('Showing 1-1 of 1 strings matching "Fire. Bolt"', { exact: true })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody')).toContainText('Fire. Bolt');
    const searchRequests = api.getListUrls().map(requestUrl => new URL(requestUrl));
    const searchRequest = searchRequests[searchRequests.length - 1];
    expect(searchRequest.searchParams.get('where')).toContain('value_like_Fire\\. Bolt');
  });

  test('reports invalid type and missing-record deep links', async ({ page }) => {
    await mockStringsDatabaseApis(page);

    await page.goto('/strings-database?type=999');
    await expect(page.getByText('Unknown string type: 999', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toHaveCount(0);

    await page.goto('/strings-database?type=5&selectedId=999');
    await expect(page.getByText('String ID 999 was not found for type 5', { exact: true })).toBeVisible();
    await expect(page.locator('.col-6.fade-in')).toHaveCount(0);
  });
});
