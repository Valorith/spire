import { expect, Page, test } from '@playwright/test';

const { createPreviewServer } = require('../scripts/serve-sage-preview.js');

let previewServer: any;
let closePreviewServer: undefined | (() => Promise<void>);
let previewBaseUrl = '';

async function mockBaseApis(page: Page) {
  await page.route('**/api/v1/**', route => {
    if (!route.request().isNavigationRequest()) {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else {
      route.continue();
    }
  });

  await page.route('https://api.github.com/**', route => route.abort());

  await page.route('**/api/v1/me**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        avatar: '',
        is_admin: false,
      }),
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
          os: 'linux',
        },
      }),
    })
  );
}

async function mockEqSageEmbed(page: Page) {
  await page.route(/\/eqsage-embed\/eqsage-embed\.css(?:\?|$)/, route =>
    route.fulfill({
      status: 200,
      contentType: 'text/css',
      body: '#eqsage-native-root{display:block;}',
    })
  );

  await page.route(/\/eqsage-embed\/eqsage-embed\.js(?:\?|$)/, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        export async function mountSpireZoneEditor(container, { spireBridge }) {
          window.__sageBridge = spireBridge;
          const root = document.createElement('div');
          root.id = 'eqsage-native-root';
          root.textContent = 'EQSage Embedded';
          container.appendChild(root);
        }

        export function unmountSpireZoneEditor(container) {
          container.innerHTML = '';
        }
      `,
    })
  );
}

test.describe('Sage native embed', () => {
  test.beforeAll(async () => {
    const preview = createPreviewServer();
    previewServer = preview.server;
    closePreviewServer = preview.close;

    await new Promise<void>((resolve) => {
      previewServer.listen(0, '127.0.0.1', resolve);
    });

    const address = previewServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to bind sage preview server');
    }

    previewBaseUrl = `http://127.0.0.1:${address.port}`;
  });

  test.afterAll(async () => {
    if (!previewServer) {
      return;
    }

    await closePreviewServer?.();
  });

  test('lazy-loads the embed bundle and mounts without an iframe', async ({ page }) => {
    await mockBaseApis(page);
    await mockEqSageEmbed(page);

    const bundleRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/eqsage-embed/eqsage-embed.js')) {
        bundleRequests.push(request.url());
      }
    });

    await page.goto(`${previewBaseUrl}/`);
    await expect(page.locator('#eqsage-native-root')).toHaveCount(0);
    await expect(page.locator('.navbar')).toHaveCount(1);
    expect(bundleRequests).toHaveLength(0);

    await page.goto(`${previewBaseUrl}/sage`);

    await expect(page.locator('iframe[title="EQSage"]')).toHaveCount(0);
    await expect(page.locator('#eqsage-native-root')).toHaveText('EQSage Embedded');
    await expect(page.locator('.navbar')).toHaveCount(0);
    expect(bundleRequests).toHaveLength(1);

    const bridgeKeys = await page.evaluate(() =>
      Object.keys((window as any).__sageBridge || {}).sort()
    );
    expect(bridgeKeys).toEqual([
      'Grid',
      'Npcs',
      'Spawn',
      'SpireApi',
      'SpireApiTypes',
      'SpireQueryBuilder',
      'Zones',
    ]);

    await page.goto(`${previewBaseUrl}/`);
    await expect(page.locator('.navbar')).toHaveCount(1);
  });
});
