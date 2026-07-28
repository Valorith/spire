import { expect, Page, test } from '@playwright/test';

type UpdateChannel = 'stable' | 'beta';

async function clickBetaUpdatesSwitch(page: Page) {
  await page.getByTestId('beta-updates-label').click();
}

async function closeAutomaticBetaOffer(page: Page) {
  await expect(page.getByTestId('spire-update-channel-panel')).toContainText('Beta channel');
  await expect(page.getByTestId('install-spire-update')).toBeVisible();
  await page.getByTestId('close-spire-update').click();
}

async function installUpdateMocks(page: Page, failStatus = false) {
  let channel: UpdateChannel = 'beta';
  let channelWrites = 0;
  let statusReads = 0;
  let statusUnavailable = failStatus;
  let channelWriteUnavailable = false;

  await page.route('**/api/v1/**', route => {
    if (!route.request().isNavigationRequest()) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.continue();
  });
  await page.route('https://api.github.com/**', route => route.abort());

  await page.route('**/api/v1/me**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, is_admin: true, avatar: '' }),
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
          version: '5.4.1',
          is_beta_release: false,
          release_repository: 'Valorith/spire',
          update_channel: channel,
          features: {},
          settings: [],
          os: 'linux',
        },
      }),
    })
  );

  await page.route('**/api/v1/app/update-channel**', async route => {
    channelWrites += 1;
    if (channelWriteUnavailable) {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Could not persist the Spire update channel' }),
      });
    }

    const body = route.request().postDataJSON() as { channel?: UpdateChannel };
    channel = body.channel === 'beta' ? 'beta' : 'stable';
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { channel } }),
    });
  });

  await page.route('**/api/v1/app/update-status**', route => {
    statusReads += 1;
    if (statusUnavailable) {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'GitHub release metadata is unavailable. No update will be installed.',
        }),
      });
    }

    const betaRelease = {
      tag_name: 'v5.5.0',
      name: 'Spire v5.5.0 (Beta)',
      body: '## [5.5.0] (Beta) 7/27/2026\n\n* Beta release notes.',
      html_url: 'https://github.com/Valorith/spire/releases/tag/v5.5.0',
      prerelease: true,
      release_type: 'Beta',
      asset_name: 'spire-linux-amd64.zip',
    };
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          channel,
          repository: 'Valorith/spire',
          current_version: '5.4.1',
          available: channel === 'beta',
          release: channel === 'beta' ? betaRelease : null,
        },
      }),
    });
  });

  return {
    channel: () => channel,
    channelWrites: () => channelWrites,
    statusReads: () => statusReads,
    setStatusUnavailable: (value: boolean) => {
      statusUnavailable = value;
    },
    setChannelWriteUnavailable: (value: boolean) => {
      channelWriteUnavailable = value;
    },
  };
}

test('defaults Beta on and persists an explicit Stable choice across reload', async ({ page }) => {
  const requests = await installUpdateMocks(page);
  await page.goto('/');

  await expect(page.getByText('Spire Beta Update Available', { exact: true })).toBeVisible();
  await closeAutomaticBetaOffer(page);

  await page.getByTestId('open-user-settings').click();
  const settingsModal = page.locator('#user-settings-modal');
  const betaToggle = page.getByTestId('beta-updates-toggle');
  await expect(settingsModal).toBeVisible();
  await expect(betaToggle).toBeChecked();
  await expect(page.getByText('Beta builds may be unstable.', { exact: false })).toBeVisible();
  await settingsModal.getByRole('button', { name: 'Close' }).click();

  await page.getByText('Spire Beta Update Available', { exact: true }).click();
  await expect(page.getByTestId('spire-update-channel-panel')).toContainText('Beta channel');
  await expect(page.getByTestId('available-update')).toContainText('Spire v5.5.0');
  await expect(page.getByTestId('offered-release-type')).toHaveText('Beta');
  await expect(page.getByTestId('install-spire-update')).toHaveText(/Install Beta update/);
  expect(requests.channelWrites()).toBe(0);

  await page.getByTestId('close-spire-update').click();
  await page.reload();
  await expect(page.getByText('Spire Beta Update Available', { exact: true })).toBeVisible();

  await page.getByTestId('open-user-settings').click();
  await expect(betaToggle).toBeChecked();
  await clickBetaUpdatesSwitch(page);
  await expect.poll(requests.channel).toBe('stable');
  await expect(betaToggle).not.toBeChecked();
  await expect(page.getByText('Spire Update Check (Stable)', { exact: true })).toBeVisible();
  await settingsModal.getByRole('button', { name: 'Close' }).click();

  await page.getByText('Spire Update Check (Stable)', { exact: true }).click();
  await expect(page.getByTestId('spire-update-channel-panel')).toContainText('Stable channel');
  await expect(page.getByTestId('update-up-to-date')).toContainText('Stable channel');
  await expect(page.getByTestId('install-spire-update')).toHaveCount(0);
  expect(requests.channelWrites()).toBe(1);

  await page.getByTestId('close-spire-update').click();
  await page.reload();
  await expect(page.getByText('Spire Update Check (Stable)', { exact: true })).toBeVisible();
  await page.getByTestId('open-user-settings').click();
  await expect(betaToggle).not.toBeChecked();
});

test('fails closed when GitHub release metadata is unavailable', async ({ page }) => {
  const requests = await installUpdateMocks(page, true);
  await page.goto('/');

  await page.getByText('Spire Update Check (Beta)', { exact: true }).click();

  await expect(page.getByText('GitHub release metadata is unavailable. No update will be installed.')).toBeVisible();
  await expect(page.getByTestId('install-spire-update')).toHaveCount(0);
  await expect(page.getByTestId('spire-update-channel-panel')).toContainText('Beta channel');
  expect(requests.channel()).toBe('beta');
  expect(requests.statusReads()).toBeGreaterThan(0);
});

test('removes a stale Beta offer before showing a metadata failure', async ({ page }) => {
  const requests = await installUpdateMocks(page);
  await page.goto('/');

  const settingsModal = page.locator('#user-settings-modal');
  await closeAutomaticBetaOffer(page);

  requests.setStatusUnavailable(true);
  await page.getByTestId('open-user-settings').click();
  const betaToggle = page.getByTestId('beta-updates-toggle');
  await expect(betaToggle).toBeChecked();
  await clickBetaUpdatesSwitch(page);
  await expect.poll(requests.channel).toBe('stable');
  await settingsModal.getByRole('button', { name: 'Close' }).click();
  await page.getByText('Spire Update Check (Stable)', { exact: true }).click();

  await expect(page.getByText('GitHub release metadata is unavailable. No update will be installed.')).toBeVisible();
  await expect(page.getByTestId('install-spire-update')).toHaveCount(0);
  await expect(page.getByTestId('available-update')).toHaveCount(0);
  await expect.poll(requests.channel).toBe('stable');
});

test('rolls the Settings toggle back when the channel cannot be persisted', async ({ page }) => {
  const requests = await installUpdateMocks(page);
  await page.goto('/');

  await closeAutomaticBetaOffer(page);
  requests.setChannelWriteUnavailable(true);
  await page.getByTestId('open-user-settings').click();
  const betaToggle = page.getByTestId('beta-updates-toggle');
  await clickBetaUpdatesSwitch(page);

  await expect(page.getByText('Could not persist the Spire update channel')).toBeVisible();
  await expect(betaToggle).toBeChecked();
  await expect(page.getByText('Spire Beta Update Available', { exact: true })).toBeVisible();
  expect(requests.channel()).toBe('beta');
  expect(requests.channelWrites()).toBe(1);
});
