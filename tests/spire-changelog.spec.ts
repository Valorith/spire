import { expect, Page, test } from '@playwright/test';

const longChangelog = [
  '## [5.3.0] 7/26/2026',
  '',
  ...Array.from({ length: 320 }, (_, index) => `* Existing release note ${index + 1}`),
  '',
].join('\n');

async function installChangelogMocks(page: Page, stateFailures = 0, initialBetaRelease = false) {
  let stateAttempts = 0;
  let betaRelease = initialBetaRelease;
  let currentChangelog = longChangelog;
  let savedContent = '';

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
          is_beta_release: betaRelease,
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
          content: currentChangelog,
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

  await page.route('**/api/v1/spirechangelog/content', async route => {
    const body = route.request().postDataJSON() as { content?: string };
    currentChangelog = body.content || '';
    savedContent = currentChangelog;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          content: currentChangelog,
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
    savedContent: () => savedContent,
    setBetaRelease: (value: boolean) => {
      betaRelease = value;
      currentChangelog = value
        ? currentChangelog.replace(/^## \[([^\]]+)](?: \(Beta\))? ([^\n]+)$/m, '## [$1] (Beta) $2')
        : currentChangelog.replace(/^## \[([^\]]+)] \(Beta\) ([^\n]+)$/m, '## [$1] $2');
    },
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

test('flags, saves, and reloads a beta release with the canonical heading', async ({ page }) => {
  const requests = await installChangelogMocks(page);
  await page.goto('/dev/spirechangelog');

  const editor = page.locator('textarea.changelog-editor');
  const betaToggle = page.getByTestId('beta-release-toggle');
  await expect(editor).toHaveValue(/^## \[5\.3\.0] 7\/26\/2026/);
  await expect(betaToggle).toHaveAttribute('aria-pressed', 'false');

  await betaToggle.click();

  await expect(betaToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(editor).toHaveValue(/^## \[5\.3\.0] \(Beta\) 7\/26\/2026/);
  await expect(editor).not.toHaveValue(/Release Type:/);
  await expect(page.locator('.spire-changelog-preview h2').filter({ hasText: '[5.3.0] (Beta) 7/26/2026' })).toHaveCount(1);

  await page.getByRole('button', { name: 'Save' }).click();
  await expect.poll(requests.savedContent).toMatch(/^## \[5\.3\.0] \(Beta\) 7\/26\/2026/);
  await expect(page.getByTestId('spire-beta-stamp')).toBeVisible();

  await page.getByRole('button', { name: 'Reload' }).click();
  await expect(editor).toHaveValue(/^## \[5\.3\.0] \(Beta\) 7\/26\/2026/);
  await expect(betaToggle).toHaveAttribute('aria-pressed', 'true');

  await betaToggle.click();
  await expect(editor).toHaveValue(/^## \[5\.3\.0] 7\/26\/2026/);
  await expect(editor).not.toHaveValue(/^## \[5\.3\.0] \(Stable\)/);
});

test('shows the beta stamp without moving the Spire brand at desktop and compact widths', async ({ page }) => {
  const requests = await installChangelogMocks(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dev/spirechangelog');

  const brandTitle = page.locator('.spire-brand-title');
  const stableBox = await brandTitle.boundingBox();
  expect(stableBox).not.toBeNull();
  await expect(page.getByTestId('spire-beta-stamp')).toHaveCount(0);

  requests.setBetaRelease(true);
  await page.reload();

  const betaStamp = page.getByTestId('spire-beta-stamp');
  await expect(betaStamp).toBeVisible();
  await expect(betaStamp).toHaveText('Beta');
  await expect(betaStamp).toHaveAttribute('aria-label', 'Beta release');
  const stampStyle = await betaStamp.evaluate(element => {
    const style = window.getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderStyle: style.borderStyle,
      boxShadow: style.boxShadow,
      padding: style.padding,
    };
  });
  expect(stampStyle).toEqual({
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderStyle: 'none',
    boxShadow: 'none',
    padding: '0px',
  });

  const betaBrandBox = await brandTitle.boundingBox();
  expect(betaBrandBox).not.toBeNull();
  expect(Math.abs(betaBrandBox!.width - stableBox!.width)).toBeLessThan(1);
  expect(Math.abs(betaBrandBox!.height - stableBox!.height)).toBeLessThan(1);

  const desktopStampBox = await betaStamp.boundingBox();
  expect(desktopStampBox).not.toBeNull();
  expect(desktopStampBox!.x).toBeGreaterThan(betaBrandBox!.x + betaBrandBox!.width * 0.55);
  expect(desktopStampBox!.y).toBeGreaterThan(betaBrandBox!.y + betaBrandBox!.height * 0.45);

  await page.setViewportSize({ width: 760, height: 900 });
  await expect(betaStamp).toBeVisible();
  const compactStampBox = await betaStamp.boundingBox();
  const compactNavBox = await page.locator('#sidebar').boundingBox();
  expect(compactStampBox).not.toBeNull();
  expect(compactNavBox).not.toBeNull();
  expect(compactStampBox!.x + compactStampBox!.width).toBeLessThanOrEqual(compactNavBox!.x + compactNavBox!.width);
});
