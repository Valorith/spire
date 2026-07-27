import { expect, Page, test } from '@playwright/test';

const longChangelog = [
  '## [5.3.0] 7/26/2026',
  '',
  ...Array.from({ length: 320 }, (_, index) => `* Existing release note ${index + 1}`),
  '',
].join('\n');

async function installChangelogMocks(page: Page, stateFailures = 0) {
  let stateAttempts = 0;

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
          version: '5.3.0',
          features: {},
          settings: [],
          os: 'linux',
        },
      }),
    })
  );

  await page.route('**/api/v1/spirechangelog/release-status**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {} }),
    })
  );

  await page.route('**/api/v1/spirechangelog', route => {
    stateAttempts += 1;
    if (stateAttempts <= stateFailures) {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Spire API is restarting.' }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          content: longChangelog,
          package_version: '5.3.0',
          release_repository: 'Valorith/spire',
          release_repository_source: 'package.json',
          release_repository_override: '',
          release_branch: 'master',
          current_branch: 'master',
          writable: true,
          source: 'live',
        },
      }),
    });
  });

  return {
    stateAttempts: () => stateAttempts,
  };
}

test('keeps the changelog editor at the new release heading', async ({ page }) => {
  await installChangelogMocks(page);
  await page.goto('/dev/spirechangelog');

  const editor = page.locator('textarea.changelog-editor');
  await expect(editor).toBeVisible();
  await editor.click();
  await editor.evaluate(element => {
    element.scrollTop = element.scrollHeight;
  });

  const initialScrollTop = await editor.evaluate(element => element.scrollTop);
  expect(initialScrollTop).toBeGreaterThan(0);

  await page.locator('.markdown-toolbar button').first().click();

  await expect.poll(() => editor.evaluate(element => element.scrollTop)).toBeLessThanOrEqual(1);
  await expect(editor).toHaveValue(/^## \[Unreleased] \d{1,2}\/\d{1,2}\/\d{4}\n\n\* \n\n## \[5\.3\.0]/);

  const selectionStart = await editor.evaluate(element => (element as HTMLTextAreaElement).selectionStart);
  expect(selectionStart).toBeGreaterThan(0);
  expect(selectionStart).toBeLessThan(40);
});

test('recovers when the local API briefly restarts', async ({ page }) => {
  const requests = await installChangelogMocks(page, 2);
  await page.goto('/dev/spirechangelog');

  const editor = page.locator('textarea.changelog-editor');
  await expect(editor).toHaveValue(/^## \[5\.3\.0]/);
  expect(requests.stateAttempts()).toBe(3);
  await expect(page.getByText('This page is showing embedded changelog data.')).toHaveCount(0);
  await expect(page.getByText('CHANGELOG.md cannot be empty.')).toHaveCount(0);
});
