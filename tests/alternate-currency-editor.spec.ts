import { expect, Page, test } from '@playwright/test';

type AlternateCurrencyMockState = {
  balancePayload?: Record<string, unknown>;
  createPayload?: Record<string, unknown>;
  resolutionPayload?: Record<string, unknown>;
};

const currencies = [
  {
    id: 4,
    item_id: 40903,
    item_name: 'Radiant Crystal',
    item_icon: 1536,
    npc_count: 1,
    task_count: 1,
    balance_count: 1,
  },
  {
    id: 5,
    item_id: 40902,
    item_name: 'Ebon Crystal',
    item_icon: 1535,
    npc_count: 0,
    task_count: 0,
    balance_count: 0,
  },
];

const usage = {
  npc_count: 1,
  task_count: 1,
  balance_count: 1,
  total_balance: 10,
  npc_samples: [{ id: 500, name: 'Crystal_Merchant', level: 50, race: 1, class: 41 }],
  task_samples: [{ id: 2, title: 'Crystal Delivery', reward_points: 25 }],
  balance_samples: [
    { character_id: 99, character_name: 'BalanceTester', level: 60, class: 1, amount: 10 },
  ],
};

const currencyDetail = {
  currency: { id: 4, item_id: 40903 },
  item: { id: 40903, name: 'Radiant Crystal', icon: 1536 },
  usage,
};

async function installAlternateCurrencyMocks(page: Page, state: AlternateCurrencyMockState) {
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

  await page.route('**/api/v1/alternate-currency-editor/currencies**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: currencies, total: 2, page: 1, limit: 30 }),
    })
  );

  await page.route('**/api/v1/alternate-currency-editor/items**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 40902, name: 'Ebon Crystal', icon: 1535, assigned_currency_id: 5 },
          { id: 1003, name: 'Cloth Choker', icon: 500 },
        ],
        total: 2,
        page: 1,
        limit: 12,
      }),
    })
  );

  await page.route('**/api/v1/alternate-currency-editor/characters**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { character_id: 99, character_name: 'BalanceTester', level: 60, class: 1, amount: 10 },
        ],
        total: 1,
        page: 1,
        limit: 15,
      }),
    })
  );

  await page.route('**/api/v1/alternate-currency-editor/currency/4/usage**', route => {
    const kind = new URL(route.request().url()).searchParams.get('kind');
    const data = {
      npcs: [{ id: 500, name: 'Crystal_Merchant', level: 50, race: 1, class: 41 }],
      tasks: [{ id: 2, title: 'Crystal Delivery', reward_points: 25 }],
      balances: [
        { character_id: 99, character_name: 'BalanceTester', level: 60, class: 1, amount: 10 },
      ],
    }[kind || 'tasks'] || [];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data, total: data.length, page: 1, limit: 20 }),
    });
  });

  await page.route('**/api/v1/alternate-currency-editor/currency/4/audit**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 42,
            user_id: 7,
            user_name: 'GM Operator',
            event_name: 'ALTERNATE_CURRENCY_BALANCE_ADJUST',
            created_at: '2026-07-25T20:00:00-04:00',
            data: {
              action: 'balance_adjust',
              currency_id: 4,
              character_id: 99,
              character_name: 'BalanceTester',
              operation: 'add',
              before: 5,
              after: 10,
              reason: 'Quest reimbursement',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
      }),
    })
  );

  await page.route('**/api/v1/alternate-currency-editor/currency/4/balance', async route => {
    state.balancePayload = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        character_id: 99,
        character_name: 'BalanceTester',
        currency_id: 4,
        before: 10,
        after: 15,
        operation: 'add',
        audit_id: 43,
      }),
    });
  });

  await page.route('**/api/v1/alternate-currency-editor/currency/4/resolve', async route => {
    state.resolutionPayload = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        deleted_id: 4,
        mode: 'replace',
        replacement_id: 5,
        npcs_updated: 1,
        tasks_updated: 1,
        balances_moved: 1,
        balances_deleted: 0,
        audit_id: 44,
      }),
    });
  });

  await page.route('**/api/v1/alternate-currency-editor/currency/4', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currencyDetail),
    })
  );

  await page.route('**/api/v1/alternate-currency-editor/currency', async route => {
    state.createPayload = route.request().postDataJSON();
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        currency: { id: 6, item_id: state.createPayload?.item_id },
        item: { id: 1003, name: 'Cloth Choker', icon: 500 },
        usage: {
          npc_count: 0,
          task_count: 0,
          balance_count: 0,
          total_balance: 0,
          npc_samples: [],
          task_samples: [],
          balance_samples: [],
        },
      }),
    });
  });
}

test.describe('Alternate Currency Editor', () => {
  test('loads the native workspace and groups the editor under Items', async ({ page }) => {
    const state: AlternateCurrencyMockState = {};
    await installAlternateCurrencyMocks(page, state);
    await page.goto('/alternate-currencies?currency=4');

    await expect(page.getByTestId('alternate-currency-inspector')).toBeVisible();
    await expect(page.getByTestId('alternate-currency-inspector').locator('h2')).toHaveText('Radiant Crystal');
    await expect(page.getByText('133 usages')).toHaveCount(0);
    await expect(page.getByTestId('alternate-currency-inspector').locator('.editor-identity p')).toContainText('3 usages');
    await expect(page.locator('#sidebar .nav.nav-sm a[href="/alternate-currencies"]')).toBeVisible();
    await expect(page.locator('#sidebar a[href="/alternate-currencies"]')).toHaveCount(1);
    await expect(page.locator('.recognition-icon .item-1536')).toBeVisible();
  });

  test('keeps real usage context and safe resolution actions in the workspace', async ({ page }) => {
    const state: AlternateCurrencyMockState = {};
    await installAlternateCurrencyMocks(page, state);
    await page.goto('/alternate-currencies?currency=4&tab=Usage+%26+Safety');

    await expect(page.getByText('Crystal Delivery', { exact: true })).toBeVisible();
    await expect(page.getByText('Task #2 · reward type 4')).toBeVisible();
    await page.getByRole('button', { name: 'Player balances 1 10 total held', exact: true }).click();
    const balanceUsage = page.locator('.usage-list button.usage-row').filter({ hasText: 'BalanceTester' });
    await expect(balanceUsage).toBeVisible();
    await balanceUsage.click();
    await expect(page.getByRole('dialog', { name: 'Adjust character balance' })).toBeVisible();
  });

  test('requires explicit audited balance input and sends expected-value protection', async ({ page }) => {
    const state: AlternateCurrencyMockState = {};
    await installAlternateCurrencyMocks(page, state);
    await page.goto('/alternate-currencies?currency=4&tab=Balances');

    await page.getByTestId('alternate-currency-character-search').fill('Balance');
    await page.locator('.character-results button').filter({ hasText: 'BalanceTester' }).click();
    const balanceDialog = page.getByRole('dialog', { name: 'Adjust character balance' });
    await expect(balanceDialog).toBeVisible();
    await balanceDialog.locator('.operation-toggle button').filter({ hasText: 'Add' }).click();
    await page.getByTestId('alternate-currency-balance-amount').fill('5');
    await page.getByTestId('alternate-currency-balance-reason').fill('Quest reimbursement');
    await page.getByTestId('alternate-currency-balance-confirmation').fill('BalanceTester');
    await page.getByTestId('alternate-currency-balance-submit').click();

    await expect(page.getByText('Balance updated to 15 · audit #43')).toBeVisible();
    expect(state.balancePayload).toEqual({
      character_id: 99,
      operation: 'add',
      amount: 5,
      expected_amount: 10,
      reason: 'Quest reimbursement',
    });
  });

  test('prevents duplicate token selection and creates from a convenient copy', async ({ page }) => {
    const state: AlternateCurrencyMockState = {};
    await installAlternateCurrencyMocks(page, state);
    await page.goto('/alternate-currencies?currency=4');

    await page.getByTestId('alternate-currency-copy').click();
    await page.getByTestId('alternate-currency-item-search').fill('Cloth');
    const assigned = page.getByTestId('alternate-currency-item-results').locator('button').filter({ hasText: 'Ebon Crystal' });
    await expect(assigned).toBeDisabled();
    await expect(assigned).toContainText('used by currency #5');
    await page.getByTestId('alternate-currency-item-results').locator('button').filter({ hasText: 'Cloth Choker' }).click();
    await page.getByTestId('alternate-currency-save').click();

    await expect(page.getByText('Alternate currency created')).toBeVisible();
    expect(state.createPayload).toEqual({ id: 0, item_id: 1003 });
  });

  test('submits transactional replacement with reason and typed confirmation', async ({ page }) => {
    const state: AlternateCurrencyMockState = {};
    await installAlternateCurrencyMocks(page, state);
    await page.goto('/alternate-currencies?currency=4&tab=Usage+%26+Safety');

    await page.getByTestId('alternate-currency-replace').click();
    await page.getByTestId('alternate-currency-replacement').selectOption('5');
    await page.locator('#alternate-currency-resolution-reason').fill('Consolidate legacy currency');
    await page.getByTestId('alternate-currency-resolution-confirmation').fill('Radiant Crystal');
    await page.getByTestId('alternate-currency-resolve-submit').click();

    await expect(page.getByText('3 usages resolved; alternate currency deleted')).toBeVisible();
    expect(state.resolutionPayload).toEqual({
      mode: 'replace',
      target_id: 5,
      delete_balances: false,
      reason: 'Consolidate legacy currency',
    });
  });

  test('adapts the full workspace without horizontal overflow', async ({ page }) => {
    const state: AlternateCurrencyMockState = {};
    await page.setViewportSize({ width: 390, height: 844 });
    await installAlternateCurrencyMocks(page, state);
    await page.goto('/alternate-currencies?currency=4');

    const layout = await page.locator('.alternate-currency-editor-page').evaluate(element => ({
      columns: window.getComputedStyle(element.querySelector('.currency-workspace')!).gridTemplateColumns,
      documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      workspaceOverflow: element.scrollWidth > element.clientWidth,
    }));
    expect(layout.columns.trim().split(/\s+/)).toHaveLength(1);
    expect(layout.documentOverflow).toBe(false);
    expect(layout.workspaceOverflow).toBe(false);
    await expect(page.getByTestId('alternate-currency-inspector')).toBeVisible();
  });
});
