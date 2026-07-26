import { expect, Page, test } from '@playwright/test';

async function installAdminHeaderMocks(page: Page) {
  let systemRequestCount = 0;

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
          os: 'darwin',
        },
      }),
    })
  );

  await page.route('**/api/v1/eqemuserver/dashboard-stats**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accounts: 2,
        characters: 4,
        guilds: 1,
        items: 117944,
        npcs: 67530,
      }),
    })
  );

  await page.route('**/api/v1/eqemuserver/server-stats**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        server_name: '',
        zone_count: 0,
        players_online: 0,
        uptime: '',
        main_process_stats: [],
      }),
    })
  );

  await page.route('**/api/v1/eqemuserver/system-all**', route => {
    systemRequestCount += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        hostname: 'Roberts-MacBook-Air.local',
        cpu: systemRequestCount % 2 === 1 ? 30 : 80,
        mem_percent: 80,
        disk: [{ readBytes: 1024, writeBytes: 2048 }],
        net: [{ name: 'all', bytesRecv: 1024, bytesSent: 512 }],
      }]),
    });
  });

  await page.route('**/api/v1/eqemuserver/get-lock-status**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ locked: false }),
    })
  );
}

test('keeps host telemetry labels, progress bars, and values separated', async ({ page }) => {
  await installAdminHeaderMocks(page);
  await page.goto('/admin');

  const hostMetrics = page.getByTestId('admin-host-metrics');
  await expect(hostMetrics).toBeVisible();
  await expect(hostMetrics.getByTitle('Roberts-MacBook-Air.local')).toBeVisible();
  await expect(hostMetrics.getByTestId('admin-host-metric')).toHaveCount(7);

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 900, height: 900 },
  ]) {
    await page.setViewportSize(viewport);

    const layoutGeometry = await hostMetrics.evaluate(element => {
      const block = element as HTMLElement;
      return {
        overflow: block.scrollWidth - block.clientWidth,
        rows: Array.from(block.querySelectorAll('[data-testid="admin-host-metric"]')).map(row => {
          const rowRect = row.getBoundingClientRect();
          const labelRect = row.querySelector('.admin-host-metric__label')?.getBoundingClientRect();
          const progressRect = row.querySelector('.admin-host-metric__progress')?.getBoundingClientRect();
          const valueRect = row.querySelector('.admin-host-metric__value')?.getBoundingClientRect();
          return {
            rowLeft: rowRect.left,
            rowRight: rowRect.right,
            labelRight: labelRect?.right,
            progressLeft: progressRect?.left,
            progressRight: progressRect?.right,
            valueLeft: valueRect?.left,
            valueRight: valueRect?.right,
          };
        }),
      };
    });

    expect(layoutGeometry.overflow).toBeLessThanOrEqual(1);
    layoutGeometry.rows.forEach(row => {
      expect(row.valueRight || row.rowRight).toBeLessThanOrEqual(row.rowRight + 1);
      if (row.progressLeft != null && row.progressRight != null) {
        expect(row.labelRight || row.progressLeft).toBeLessThanOrEqual(row.progressLeft - 4);
        expect(row.progressRight).toBeLessThanOrEqual((row.valueLeft || 0) - 4);
      }
    });

    const readCpuBarGeometry = async (value: string) => {
      await page.waitForFunction(expectedValue => {
        const cpuRow = Array.from(document.querySelectorAll('[data-testid="admin-host-metric"]'))
          .find(row => row.querySelector('.admin-host-metric__label')?.textContent?.trim() === 'CPU');
        return cpuRow?.querySelector('.admin-host-metric__value')?.textContent?.trim() === expectedValue;
      }, value, { timeout: 3000 });
      await page.waitForTimeout(350);

      return hostMetrics.evaluate(element => {
        const cpuRow = Array.from(element.querySelectorAll('[data-testid="admin-host-metric"]'))
          .find(row => row.querySelector('.admin-host-metric__label')?.textContent?.trim() === 'CPU');
        const track = cpuRow?.querySelector('.eq-progress-bar');
        const fill = cpuRow?.querySelector('.eq-progress-bar__fill');
        const frame = cpuRow?.querySelector('.eq-progress-bar__frame');
        const trackRect = track?.getBoundingClientRect();
        const fillRect = fill?.getBoundingClientRect();
        const frameRect = frame?.getBoundingClientRect();

        return {
          trackWidth: trackRect?.width || 0,
          fillWidth: fillRect?.width || 0,
          frameWidth: frameRect?.width || 0,
        };
      });
    };

    const lowCpu = await readCpuBarGeometry('30 %');
    const highCpu = await readCpuBarGeometry('80 %');

    expect(lowCpu.trackWidth).toBeGreaterThan(0);
    expect(lowCpu.trackWidth).toBeCloseTo(highCpu.trackWidth, 1);
    expect(lowCpu.frameWidth).toBeCloseTo(highCpu.frameWidth, 1);
    expect(highCpu.fillWidth).toBeGreaterThan(lowCpu.fillWidth * 2);
  }
});

test('keeps the shared loading meter frame fixed while progress advances', async ({ page }) => {
  await page.route('**/eq-asset-preview-master/assets/sprites/item-icons.png', route => route.abort());

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 900, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`/item-icon-viewer?meter-qa=${viewport.width}`);

    const loadingMeter = page.getByRole('progressbar', { name: 'Loading' });
    await expect(loadingMeter).toBeVisible();

    const readLoadingGeometry = () => loadingMeter.evaluate(element => {
      const trackRect = element.getBoundingClientRect();
      const fill = element.querySelector('.loader-fake-progress-fill');
      const frameRect = element.querySelector('.loader-fake-progress-frame')?.getBoundingClientRect();
      return {
        progress: Number(element.getAttribute('aria-valuenow')),
        trackWidth: trackRect.width,
        frameWidth: frameRect?.width || 0,
        clipPath: fill ? getComputedStyle(fill).clipPath : '',
      };
    });

    const first = await readLoadingGeometry();
    await page.waitForTimeout(500);
    const second = await readLoadingGeometry();

    expect(second.progress).toBeGreaterThan(first.progress);
    expect(first.trackWidth).toBeGreaterThan(0);
    expect(first.trackWidth).toBeCloseTo(second.trackWidth, 1);
    expect(first.frameWidth).toBeCloseTo(second.frameWidth, 1);
    expect(first.clipPath).not.toBe(second.clipPath);
  }
});
