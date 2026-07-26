import { expect, Page, test } from '@playwright/test';

type TitleMockState = {
  titles: Array<Record<string, unknown>>;
  assignments: Array<Record<string, unknown>>;
  createPayload?: Record<string, unknown>;
  updatePayload?: Record<string, unknown>;
  assignmentPayload?: Record<string, unknown>;
  deletedTitles: number[];
  deletedAssignments: number[];
};

const swiftwind = {
  id: 20487,
  name: 'Swiftwind',
  icon: 1198,
};

const alyria = {
  id: 42,
  name: 'Alyria',
  level: 60,
  class: 8,
};

const title = {
  id: 93,
  skill_id: -1,
  min_skill_value: -1,
  max_skill_value: -1,
  min_aa_points: -1,
  max_aa_points: -1,
  class: -1,
  gender: -1,
  char_id: -1,
  status: -1,
  item_id: 20487,
  prefix: 'Windcaller',
  suffix: '',
  title_set: 0,
};

async function installTitleMocks(page: Page, state: TitleMockState) {
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

  await page.route('**/api/v1/items/bulk', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([swiftwind]),
    })
  );

  await page.route('**/api/v1/character_data/bulk', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([alyria]),
    })
  );

  await page.route('**/api/v1/items?**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([swiftwind]),
    })
  );

  await page.route('**/api/v1/character_data?**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([alyria]),
    })
  );

  await page.route('**/api/v1/player_titleset', async route => {
    const request = route.request();
    state.assignmentPayload = request.postDataJSON();
    const assignment = { id: 901, ...state.assignmentPayload };
    state.assignments.push(assignment);
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(assignment),
    });
  });

  await page.route('**/api/v1/player_titleset/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const id = Number(url.pathname.split('/').pop());
    if (request.method() === 'DELETE') {
      state.deletedAssignments.push(id);
      state.assignments = state.assignments.filter(record => Number(record.id) !== id);
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 404, body: '' });
  });

  await page.route('**/api/v1/player_titlesets?**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.assignments),
    })
  );

  await page.route('**/api/v1/title', async route => {
    state.createPayload = route.request().postDataJSON();
    state.titles.push({ ...state.createPayload });
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(state.createPayload),
    });
  });

  await page.route('**/api/v1/title/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const id = Number(url.pathname.split('/').pop());
    if (request.method() === 'PATCH') {
      state.updatePayload = request.postDataJSON();
      state.titles = state.titles.map(record =>
        Number(record.id) === id ? { ...record, ...state.updatePayload } : record
      );
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.updatePayload),
      });
    }
    if (request.method() === 'DELETE') {
      state.deletedTitles.push(id);
      state.titles = state.titles.filter(record => Number(record.id) !== id);
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 404, body: '' });
  });

  await page.route('**/api/v1/titles?**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.titles),
    })
  );
}

test.describe('Title Editor', () => {
  test('composes a live preview and persists real eligibility semantics', async ({ page }) => {
    const state: TitleMockState = {
      titles: [{ ...title }],
      assignments: [],
      deletedTitles: [],
      deletedAssignments: [],
    };
    await installTitleMocks(page, state);
    await page.goto('/titles?title=93');

    await expect(page.getByTestId('title-inspector')).toBeVisible();
    await expect(page.locator('#title-preview-name')).toHaveCount(0);
    await expect(page.getByTestId('title-preview-character')).toHaveText('Farren');
    await expect(page.getByTestId('title-live-preview')).toContainText('Windcaller Farren');
    await expect(page.locator('#sidebar .nav.nav-sm a[href="/titles"]')).toHaveCount(1);
    await expect(page.locator('#sidebar .nav.nav-sm a[href="/titles"]')).toBeVisible();

    await page.locator('#title-prefix').fill('Stormcaller');
    await expect(page.getByTestId('title-live-preview')).toContainText('Stormcaller Farren');
    await page.getByRole('tab', { name: 'Eligibility', exact: true }).click();
    await page.locator('#title-class').selectOption('8');
    await page.locator('#title-skill').selectOption('55');
    await page.locator('#title-skill-min').fill('100');
    await page.getByTestId('title-save').click();

    await expect(page.getByTestId('title-save')).toBeDisabled();
    expect(state.updatePayload).toMatchObject({
      id: 93,
      class: 8,
      skill_id: 55,
      min_skill_value: 100,
      item_id: 20487,
      prefix: 'Stormcaller',
    });
  });

  test('requires confirmation before copy and delete', async ({ page }) => {
    const state: TitleMockState = {
      titles: [{ ...title }],
      assignments: [],
      deletedTitles: [],
      deletedAssignments: [],
    };
    await installTitleMocks(page, state);
    await page.goto('/titles?title=93');

    await page.getByTestId('title-copy').click();
    await expect(page.getByText('Create a new draft from title #93 (Windcaller)?')).toBeVisible();
    await page.getByRole('button', { name: 'Create copy', exact: true }).click();
    await expect(page.locator('#title-id')).toHaveValue('94');
    await page.locator('#title-prefix').fill('Windkeeper');
    await page.getByTestId('title-save').click();
    expect(state.createPayload).toMatchObject({
      id: 94,
      item_id: 20487,
      prefix: 'Windkeeper',
    });

    await page.getByTestId('title-delete').click();
    await expect(page.getByText(/Linked items, characters, and title-set grants will remain intact/)).toBeVisible();
    await page.getByRole('button', { name: 'Delete title', exact: true }).click();
    expect(state.deletedTitles).toEqual([94]);
    await expect(page.getByTestId('title-inspector').locator('h2')).toHaveText('Windcaller');
  });

  test('manages shared grants and blocks orphaning a title set', async ({ page }) => {
    const setTitle = { ...title, id: 120, item_id: -1, prefix: 'Set Keeper', title_set: 77 };
    const state: TitleMockState = {
      titles: [setTitle],
      assignments: [{ id: 900, char_id: 42, title_set: 77 }],
      deletedTitles: [],
      deletedAssignments: [],
    };
    await installTitleMocks(page, state);
    await page.goto('/titles?title=120&tab=Assignments');

    await expect(page.getByText('Resolve orphaned grants first', { exact: true })).toBeVisible();
    await expect(page.getByTestId('title-delete')).toBeDisabled();
    await expect(page.getByText('Alyria', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Remove title-set grant from Alyria' }).click();
    await expect(page.getByText(/Remove title set #77 from Alyria/)).toBeVisible();
    await page.getByRole('button', { name: 'Remove grant', exact: true }).click();
    await expect(page.getByText('No characters currently hold title set #77.')).toBeVisible();
    await expect(page.getByTestId('title-delete')).toBeEnabled();
    expect(state.deletedAssignments).toEqual([900]);

    await page.locator('#title-assignment-character-search').fill('Alyria');
    await expect(page.locator('.spire-editor-selector-results').getByText('Alyria', { exact: true })).toBeVisible();
    await page.locator('.spire-editor-selector-results').getByText('Alyria', { exact: true }).click();
    await expect(page.getByText('Alyria', { exact: true })).toBeVisible();
    await expect(page.getByTestId('title-delete')).toBeDisabled();
    expect(state.assignmentPayload).toMatchObject({ char_id: 42, title_set: 77 });
  });

  test('keeps placeholder text clear of every search icon', async ({ page }) => {
    const setTitle = { ...title, id: 120, prefix: 'Set Keeper', title_set: 77 };
    const state: TitleMockState = {
      titles: [setTitle],
      assignments: [],
      deletedTitles: [],
      deletedAssignments: [],
    };
    await installTitleMocks(page, state);
    await page.goto('/titles?title=120&tab=Unlock%20Sources');

    const measureClearance = (ids: string[]) => page.evaluate((inputIds) => inputIds.map(id => {
      const input = document.getElementById(id) as HTMLInputElement | null;
      const icon = input?.parentElement?.querySelector(':scope > i');
      if (!input || !icon) return { id, available: false, paddingLeft: 0, clearance: 0 };
      const inputRect = input.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();
      const paddingLeft = Number.parseFloat(window.getComputedStyle(input).paddingLeft);
      return {
        id,
        available: true,
        paddingLeft,
        clearance: inputRect.left + paddingLeft - iconRect.right,
      };
    }), ids);

    const unlockSearches = await measureClearance([
      'title-directory-search',
      'title-item-search',
      'title-character-search',
    ]);
    unlockSearches.forEach(search => {
      expect(search.available, `${search.id} should have an icon`).toBe(true);
      expect(search.paddingLeft, `${search.id} left padding`).toBeGreaterThanOrEqual(28);
      expect(search.clearance, `${search.id} icon clearance`).toBeGreaterThanOrEqual(8);
    });

    await page.getByRole('tab', { name: 'Assignments', exact: true }).click();
    const assignmentSearches = await measureClearance([
      'title-directory-search',
      'title-assignment-character-search',
    ]);
    assignmentSearches.forEach(search => {
      expect(search.available, `${search.id} should have an icon`).toBe(true);
      expect(search.paddingLeft, `${search.id} left padding`).toBeGreaterThanOrEqual(28);
      expect(search.clearance, `${search.id} icon clearance`).toBeGreaterThanOrEqual(8);
    });
  });

  test('keeps the editor usable at a compact desktop viewport', async ({ page }) => {
    const state: TitleMockState = {
      titles: [{ ...title }],
      assignments: [],
      deletedTitles: [],
      deletedAssignments: [],
    };
    await installTitleMocks(page, state);
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto('/titles?title=93&tab=Unlock%20Sources');

    await expect(page.getByTestId('title-inspector')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator('#title-item-search')).toBeVisible();
  });
});
