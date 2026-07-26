import { expect, Page, test } from '@playwright/test';

type ContentFlagEditorMocks = {
  savePayload?: Record<string, unknown>;
  createPayload?: Record<string, unknown>;
  resolutionPayload?: Record<string, unknown>;
};

const flags = [
  { id: 2, flag_name: 'don_nest_unlocked', enabled: true, note_preview: 'Unlocks the Accursed Nest.' },
  { id: 4, flag_name: 'eq_anniversary', enabled: false, note_preview: 'EverQuest anniversary content.' },
];

const referencedUsage = {
  reference_count: 7,
  required_count: 5,
  blocked_count: 2,
  affected_table_count: 2,
  available_table_count: 20,
  scanned_field_count: 40,
  groups: [
    {
      key: 'merchantlist.content_flags',
      table: 'merchantlist',
      table_label: 'Merchant Entries',
      column: 'content_flags',
      mode: 'required',
      count: 5,
      samples: [
        {
          record_key: '101:1',
          record_label: 'Item 13073',
          record_context: 'Merchant 101 · slot 1',
          raw_value: 'don_nest_unlocked',
        },
      ],
    },
    {
      key: 'spawn2.content_flags_disabled',
      table: 'spawn2',
      table_label: 'Spawn Points',
      column: 'content_flags_disabled',
      mode: 'blocked',
      count: 2,
      samples: [
        {
          record_key: '880',
          record_label: 'Spawn group 410',
          record_context: 'nest · version 0',
          raw_value: 'don_nest_unlocked',
        },
      ],
    },
  ],
};

const emptyUsage = {
  reference_count: 0,
  required_count: 0,
  blocked_count: 0,
  affected_table_count: 0,
  available_table_count: 20,
  scanned_field_count: 40,
  groups: [],
};

async function installContentFlagMocks(page: Page, state: ContentFlagEditorMocks) {
  let currentFlag = {
    id: 2,
    flag_name: 'don_nest_unlocked',
    enabled: true,
    notes: 'Dragons of Norrath - unlocked Accursed Nest',
  };

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

  await page.route('**/api/v1/content-flag-editor/flags**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: flags,
        total: 2,
        page: 1,
        limit: 50,
        reference_table_count: 20,
        scanned_field_count: 40,
      }),
    })
  );

  await page.route('**/api/v1/content-flag-editor/flag/2/resolve', async route => {
    state.resolutionPayload = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        deleted_id: 2,
        mode: state.resolutionPayload?.mode,
        replacement_id: state.resolutionPayload?.target_id,
        replacement_name: 'eq_anniversary',
        updated_rows: 7,
      }),
    });
  });

  await page.route('**/api/v1/content-flag-editor/flag/2', async route => {
    if (route.request().method() === 'PATCH') {
      state.savePayload = route.request().postDataJSON();
      currentFlag = { ...currentFlag, ...state.savePayload };
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ flag: currentFlag, usage: referencedUsage }),
    });
  });

  await page.route('**/api/v1/content-flag-editor/flag/4', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        flag: {
          id: 4,
          flag_name: 'eq_anniversary',
          enabled: false,
          notes: 'EverQuest anniversary content.',
        },
        usage: emptyUsage,
      }),
    })
  );

  await page.route('**/api/v1/content-flag-editor/flag', async route => {
    state.createPayload = route.request().postDataJSON();
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        flag: { id: 5, ...state.createPayload },
        usage: emptyUsage,
      }),
    });
  });
}

test.describe('Content Flag Editor', () => {
  test('edits configuration and explains transactional renames', async ({ page }) => {
    const state: ContentFlagEditorMocks = {};
    await installContentFlagMocks(page, state);
    await page.goto('/content-flags?flag=2');

    await expect(page.getByTestId('content-flag-inspector')).toBeVisible();
    await expect(page.getByTestId('content-flag-copy')).toHaveText('Copy');
    await expect(page.getByTestId('content-flag-name')).toHaveValue('don_nest_unlocked');
    await page.getByTestId('content-flag-name').fill('don_nest_complete');
    await expect(page.getByTestId('content-flag-rename-notice')).toContainText(
      'will replace don_nest_unlocked with don_nest_complete'
    );
    await page.getByTestId('content-flag-save').click();

    await expect(page.getByText('Content flag and references renamed')).toBeVisible();
    expect(state.savePayload).toMatchObject({
      id: 2,
      flag_name: 'don_nest_complete',
      enabled: true,
      notes: 'Dragons of Norrath - unlocked Accursed Nest',
    });
  });

  test('keeps usage context and delete blockers inside the workspace', async ({ page }) => {
    const state: ContentFlagEditorMocks = {};
    await installContentFlagMocks(page, state);
    await page.goto('/content-flags?flag=2&tab=Usage+%26+Safety');

    await page.getByText('Usage & Safety', { exact: true }).click();
    await expect(page.getByText('Merchant Entries', { exact: true })).toBeVisible();
    await expect(page.getByText('Item 13073', { exact: true })).toBeVisible();
    await expect(page.getByText('Spawn Points', { exact: true })).toBeVisible();
    await expect(page.getByText('Spawn group 410', { exact: true })).toBeVisible();
    await expect(page.getByText('40 flag-bearing fields scanned')).toBeVisible();

    await page.getByTestId('content-flag-delete').click();
    await expect(page.getByText(/Deletion is blocked until the references below/)).toBeVisible();
    await expect(page.getByText('Resolve references before deleting')).toBeVisible();
  });

  test('replaces references and deletes transactionally with typed confirmation', async ({ page }) => {
    const state: ContentFlagEditorMocks = {};
    await installContentFlagMocks(page, state);
    await page.goto('/content-flags?flag=2');

    await page.getByText('Usage & Safety', { exact: true }).click();
    await page.getByTestId('content-flag-replace-references').click();
    await page.getByTestId('content-flag-replacement').selectOption('4');
    await page.getByTestId('content-flag-resolution-confirmation').fill('don_nest_unlocked');
    await page.getByTestId('content-flag-resolve-submit').click();

    await expect(page.getByText('7 reference rows updated; content flag deleted')).toBeVisible();
    expect(state.resolutionPayload).toEqual({ mode: 'replace', target_id: 4 });
  });

  test('creates a new flag with server-assigned identity', async ({ page }) => {
    const state: ContentFlagEditorMocks = {};
    await installContentFlagMocks(page, state);
    await page.goto('/content-flags');

    await page.getByTestId('content-flag-new').click();
    await page.getByTestId('content-flag-name').fill('summer_event');
    await page.locator('#content-flag-notes').fill('Seasonal summer content.');
    await page.getByTestId('content-flag-save').click();

    await expect(page.getByText('Content flag created')).toBeVisible();
    expect(state.createPayload).toMatchObject({
      id: 0,
      flag_name: 'summer_event',
      enabled: false,
      notes: 'Seasonal summer content.',
    });
  });

  test('groups flags, Tasks, and Zones under World Data and responds at tablet width', async ({ page }) => {
    const state: ContentFlagEditorMocks = {};
    await page.setViewportSize({ width: 800, height: 900 });
    await installContentFlagMocks(page, state);
    await page.goto('/content-flags');

    const worldDataToggle = page.locator('#sidebar a.nav-link').filter({ hasText: 'World Data' }).first();
    await worldDataToggle.click();
    await expect(page.locator('#sidebar .nav.nav-sm a[href="/content-flags"]')).toBeVisible();
    await expect(page.locator('#sidebar .nav.nav-sm a[href="/tasks"]')).toBeVisible();
    await expect(page.locator('#sidebar .nav.nav-sm a[href="/zones"]')).toBeVisible();
    await expect(page.locator('#sidebar a[href="/tasks"]')).toHaveCount(1);

    const columns = await page.locator('.content-flag-workspace').evaluate(element =>
      window.getComputedStyle(element).gridTemplateColumns
    );
    expect(columns.trim().split(/\s+/)).toHaveLength(1);
  });
});
