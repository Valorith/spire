import { expect, Page, test } from '@playwright/test';

type DbString = {
  id: number;
  type: number;
  value: string;
};

async function mockStringsDatabaseApis(page: Page) {
  let strings: DbString[] = [
    {
      id: 1,
      type: 0,
      value: 'QA braces {{ 7 * 7 }}<BR>Second line <img src=x onerror="window.__stringsPreviewExecuted=true">',
    },
    { id: 12, type: 5, value: 'Charisma' },
    { id: 13, type: 5, value: 'Cold' },
  ];
  let listRequests = 0;
  let createRequests = 0;
  let deleteRequests = 0;
  let updateRequests = 0;

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

  await page.route('**/api/v1/db_strs**', route => {
    listRequests++;
    const url = new URL(route.request().url());
    const typeMatch = (url.searchParams.get('where') || '').match(/(?:^|\.)type__(\d+)/);
    const response = typeMatch
      ? strings.filter(string => string.type === parseInt(typeMatch[1], 10))
      : strings;
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
    getDeleteRequests: () => deleteRequests,
    getListRequests: () => listRequests,
    getUpdateRequests: () => updateRequests,
  };
}

test.describe('Strings Database Editor', () => {
  test('renders type 0 and treats database text as literal preview content', async ({ page }) => {
    await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=0&selectedId=1');

    const preview = page.locator('.string-preview');
    await expect(preview).toBeVisible();
    await expect(preview).toHaveText(
      'QA braces {{ 7 * 7 }}\nSecond line <img src=x onerror="window.__stringsPreviewExecuted=true">',
    );
    await expect(preview).not.toContainText('QA braces 49');
    await expect(preview).toHaveCSS('white-space', 'pre-wrap');
    await expect.poll(() => page.evaluate(() => (window as any).__stringsPreviewExecuted)).toBeUndefined();
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

  test('keeps new rows local until save and keeps delete confirmation visible for an empty type', async ({ page }) => {
    const api = await mockStringsDatabaseApis(page);
    await page.goto('/strings-database?type=29');

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Create Database String', { exact: true })).toBeVisible();
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
