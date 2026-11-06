import { expect, Page, Route, test } from '@playwright/test';

const api = '/api/v1/eqemuserver/server/restart-schedules';
const next = '2027-01-12T09:00:00Z';
const initial = () => ({
  id: 'nightly', name: 'Daily restart', enabled: true, timezone: 'America/New_York',
  time: '04:00', days: [0, 1, 2, 3, 4, 5, 6], warning_minutes: 10, revision: 1, next_run: next,
});

async function mockServer(page: Page, { readOnly = false, denied = false, active = false, powerControls = false, activeName = 'Daily restart' } = {}) {
  let schedules = [initial()];
  let run: any = active ? { id: 'run-1', schedule_id: 'nightly', name: activeName, restart_at: new Date(Date.now() + 10 * 60000).toISOString(), status: 'countdown' } : null;
  const writes: any[] = [];
  await page.addInitScript(() => localStorage.setItem(`spire-web-access-token-${location.host}`, 'test-session'));
  // Register broad handlers first: Playwright dispatches matching routes LIFO.
  await page.route('**/api/v1/**', route => route.fulfill({ json: [] }));
  await page.routeWebSocket('**/api/v1/websocket*', () => {});
  await page.route('https://api.github.com/**', route => route.abort());
  await page.route('**/api/v1/app/env', route => route.fulfill({ json: { data: {
    env: 'desktop', version: '5.7.3', os: 'linux', is_spire_initialized: true,
    features: {}, settings: [{ setting: 'AUTH_ENABLED', value: 'true' }],
  } } }));
  await page.route('**/api/v1/me', route => route.fulfill({ json: { id: 2, user_name: 'Operator', provider: 'local', is_admin: false } }));
  await page.route('**/api/v1/permissions/me', route => route.fulfill({ json: {
    connection_id: 1, read_all: powerControls, write_all: powerControls,
    read: ['eqemuserver/server/restart-schedules'], write: readOnly ? [] : ['eqemuserver/server/restart-schedules'],
  } }));
  await page.route('**/api/v1/eqemuserver/server-stats', route => route.fulfill({ json: {
    server_name: 'Test server', zone_count: 0, players_online: 0, uptime: '', main_process_stats: [],
  } }));
  await page.route('**/api/v1/admin/launcherconfig', route => route.fulfill({ json: { minZoneProcesses: 10 } }));
  await page.route(`**${api}**`, async route => {
    const request = route.request();
    if (request.url().endsWith('/preview')) {
      const input = request.postDataJSON();
      if (!input.days.length && !input.once_at) return route.fulfill({ status: 400, json: { error: 'choose at least one day' } });
      if (input.timezone === 'Invalid/Zone') return route.fulfill({ status: 400, json: { error: 'unknown time zone' } });
      return route.fulfill({ json: { next_runs: input.once_at ? [input.once_at] : [next, '2027-01-13T09:00:00Z', '2027-01-14T09:00:00Z'] } });
    }
    if (request.method() === 'GET') return route.fulfill({ json: { version: 1, schedules, history: [], active: run } });
    if (denied) return route.fulfill({ status: 403, json: { error: 'You do not have permission to write to this resource' } });
    if (request.url().endsWith('/cancel')) { run = { ...run, cancel_requested: true }; return route.fulfill({ status: 204 }); }
    if (request.method() === 'DELETE') { schedules = []; return route.fulfill({ status: 204 }); }
    const input = request.postDataJSON();
    writes.push(input);
    const saved = { ...input, id: input.id || 'new', revision: input.revision + 1, next_run: input.enabled ? next : null };
    schedules = [...schedules.filter(s => s.id !== saved.id), saved];
    return route.fulfill({ json: saved });
  });
  return { writes };
}

test('creates, edits, pauses and deletes restart schedules', async ({ page }) => {
  const server = await mockServer(page);
  await page.goto('/admin/restart-schedules');
  await expect(page.getByRole('heading', { name: 'Restart schedules', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Weekly', exact: true }).click();
  await page.getByRole('button', { name: 'Sunday', exact: true }).click();
  await page.getByRole('button', { name: 'Tuesday', exact: true }).click();
  await page.getByRole('button', { name: 'Friday', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Weekly maintenance');
  await page.getByLabel('Restart at', { exact: true }).fill('05:30');
  await page.getByLabel('Time zone', { exact: true }).fill('UTC');
  await page.getByLabel('Warn players before restart').selectOption('15');
  await expect(page.locator('.restart-preview li')).toHaveCount(3);
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Weekly maintenance', exact: true })).toBeVisible();
  expect(server.writes[0]).toMatchObject({ time: '05:30', timezone: 'UTC', days: [2, 5], warning_minutes: 15 });
  const row = page.getByTestId('schedule-new');
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Weekly reboot');
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click();
  await expect(row.getByRole('heading', { name: 'Weekly reboot' })).toBeVisible();
  await row.getByRole('switch').click();
  await expect(row.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  await expect(row.getByText('Paused', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Delete Weekly reboot', exact: true }).click();
  await row.getByRole('button', { name: 'Delete schedule', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No restart schedules' })).toBeVisible();
});

test('schedule toggle thumb stays centered inside its track in both states', async ({ page }) => {
  await mockServer(page);
  await page.goto('/admin/restart-schedules');
  const toggle = page.getByRole('switch', { name: 'Enable Daily restart', exact: true });
  const assertThumb = async (enabled: boolean) => {
    await expect(toggle).toHaveAttribute('aria-checked', String(enabled));
    await expect.poll(() => toggle.evaluate((el, checked) => {
      const track = el.getBoundingClientRect();
      const thumb = el.querySelector('span')!.getBoundingClientRect();
      return {
        contained: thumb.left >= track.left && thumb.right <= track.right && thumb.top >= track.top && thumb.bottom <= track.bottom,
        centered: Math.abs((thumb.top + thumb.bottom - track.top - track.bottom) / 2) < 0.5,
        // The shell can zoom the workspace; compare rendered insets.
        edgeAligned: Math.abs((checked ? track.right - thumb.right : thumb.left - track.left) - (track.height - thumb.height) / 2) < 0.5,
      };
    }, enabled)).toEqual({ contained: true, centered: true, edgeAligned: true });
  };
  await assertThumb(true);
  await toggle.click();
  await assertThumb(false);
  await toggle.press('Space');
  await assertThumb(true);
});

test('one-time restart uses the chosen time zone', async ({ page }) => {
  const server = await mockServer(page);
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Once', exact: true }).click();
  await page.getByLabel('Date', { exact: true }).fill('2027-01-12');
  await page.getByLabel('Restart at', { exact: true }).fill('04:00');
  await page.getByLabel('Time zone', { exact: true }).fill('America/New_York');
  await expect(page.locator('.restart-preview li')).toHaveCount(1);
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'One-time restart', exact: true })).toBeVisible();
  expect(server.writes[0].once_at).toBe('2027-01-12T09:00:00.000Z');
  expect(server.writes[0].days).toEqual([]);
});

test('invalid days and time zones prevent saving', async ({ page }) => {
  const server = await mockServer(page);
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Weekly', exact: true }).click();
  await page.getByRole('button', { name: 'Sunday', exact: true }).click();
  await expect(page.getByText('choose at least one day', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save schedule' })).toBeDisabled();
  await page.getByRole('button', { name: 'Monday', exact: true }).click();
  await page.getByLabel('Time zone', { exact: true }).fill('Invalid/Zone');
  await expect(page.getByText('unknown time zone', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save schedule' })).toBeDisabled();
  expect(server.writes).toEqual([]);
});

test('one-time restarts reject nonexistent daylight saving times', async ({ page }) => {
  const server = await mockServer(page);
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Once', exact: true }).click();
  await page.getByLabel('Date', { exact: true }).fill('2027-03-14');
  await page.getByLabel('Restart at', { exact: true }).fill('02:30');
  await page.getByLabel('Time zone', { exact: true }).fill('America/New_York');
  await expect(page.getByText('This time does not exist in the selected time zone', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save schedule' })).toBeDisabled();
  expect(server.writes).toEqual([]);
});

test('write denial preserves the draft and reports the error', async ({ page }) => {
  const server = await mockServer(page, { denied: true });
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Keep this draft');
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('You do not have permission');
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Keep this draft');
  await expect(page.getByRole('heading', { name: 'Daily restart', exact: true })).toBeVisible();
  expect(server.writes).toEqual([]);
});

test('read-only operators cannot change schedules', async ({ page }) => {
  await mockServer(page, { readOnly: true });
  await page.goto('/admin/restart-schedules');
  await expect(page.getByRole('heading', { name: 'Daily restart', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add schedule' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).toHaveCount(0);
  await expect(page.getByRole('switch')).toBeDisabled();
});

test('active countdown can be cancelled without editing its schedule', async ({ page }) => {
  await mockServer(page, { active: true });
  await page.goto('/admin/restart-schedules');
  await expect(page.getByText(/Restart in \d+:\d+/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel this restart', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancelling…', exact: true })).toBeDisabled();
});

test('manual restart reports a schedule conflict without claiming success', async ({ page }) => {
  await mockServer(page, { powerControls: true });
  await page.route('**/api/v1/eqemuserver/server/restart', route => route.fulfill({ status: 409, json: { error: 'a server power action is already in progress' } }));
  await page.goto('/admin/restart-schedules');
  await page.getByRole('link', { name: /Offline/ }).click();
  await page.getByRole('link', { name: /Restart \[r\]/ }).click();
  const conflict = page.waitForResponse(response => response.url().endsWith('/eqemuserver/server/restart') && response.status() === 409);
  await page.getByRole('button', { name: /Restart Server$/ }).click();
  await conflict;
  await expect(page.locator('.toastify').filter({ hasText: 'a server power action is already in progress' })).toBeVisible();
  await expect(page.getByText('Server has been restarted!', { exact: true })).toHaveCount(0);
});

test('manual restart reports cancellation without claiming success', async ({ page }) => {
  await mockServer(page, { powerControls: true });
  await page.route('**/api/v1/eqemuserver/server/restart', route => route.fulfill({ json: { cancelled: true, message: 'Server restart cancelled' } }));
  await page.goto('/admin/restart-schedules');
  await page.getByRole('link', { name: /Offline/ }).click();
  await page.getByRole('link', { name: /Restart \[r\]/ }).click();
  await page.getByRole('button', { name: /Restart Server$/ }).click();
  await expect(page.locator('.toastify').filter({ hasText: 'Server restart has been cancelled' })).toBeVisible();
  await expect(page.getByText('Server has been restarted!', { exact: true })).toHaveCount(0);
  await expect(page.locator('.toastify')).toHaveCount(1);
});

test('desktop and mobile schedule editors fit the workspace', async ({ page }, testInfo) => {
  await mockServer(page);
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Weekly', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save schedule', exact: true })).toBeEnabled();
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1024, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('button', { name: 'Save schedule', exact: true })).toBeVisible();
    const overflow = await page.locator('.restart-workspace').evaluate(el => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    for (const field of ['#restart-name', '#restart-time', '#restart-timezone', '#restart-warning', '.restart-presets', '.restart-days']) {
      const geometry = await page.locator(field).evaluate(el => ({
        right: el.getBoundingClientRect().right,
        parentRight: el.closest('.restart-editor-window')!.getBoundingClientRect().right,
        overflow: el.scrollWidth - el.clientWidth,
      }));
      expect(geometry.right).toBeLessThanOrEqual(geometry.parentRight);
      expect(geometry.overflow).toBeLessThanOrEqual(1);
    }
    if (viewport.width === 1440) await page.screenshot({ path: testInfo.outputPath('desktop.png') });
    if (viewport.width === 1024) await page.screenshot({ path: testInfo.outputPath('tablet.png') });
  }
  await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true });
});

test('network failures show an actionable preview error', async ({ page }) => {
  const server = await mockServer(page);
  await page.route(`**${api}/preview`, route => route.abort('failed'));
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await expect(page.locator('.restart-preview-error')).toContainText('Unable to reach Spire');
  await expect(page.getByRole('button', { name: 'Save schedule' })).toBeDisabled();
  await page.unroute(`**${api}/preview`);
  await page.getByLabel('Restart at', { exact: true }).fill('05:00');
  await expect(page.getByRole('button', { name: 'Save schedule' })).toBeEnabled();
  expect(server.writes).toEqual([]);
});

test('long active schedule names fit mobile widths', async ({ page }) => {
  await mockServer(page, { active: true, activeName: 'W'.repeat(80) });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/restart-schedules');
  await expect(page.getByRole('button', { name: 'Cancel this restart' })).toBeVisible();
  const overflow = await page.locator('.restart-workspace').evaluate(el => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('a failed save preserves the draft and can be retried', async ({ page }) => {
  const server = await mockServer(page);
  let rejectSave = true;
  await page.route(`**${api}`, route => {
    if (route.request().method() === 'POST' && rejectSave) {
      rejectSave = false;
      return route.fulfill({ status: 503, json: { error: 'Schedule storage is temporarily unavailable' } });
    }
    return route.fallback();
  });
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Retry this schedule');
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Schedule storage is temporarily unavailable');
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Retry this schedule');
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Retry this schedule', exact: true })).toBeVisible();
  expect(server.writes).toHaveLength(1);
});

test('a slower old preview cannot replace the latest time', async ({ page }) => {
  await mockServer(page);
  let oldPreview: Route | undefined;
  await page.route(`**${api}/preview`, route => {
    const time = route.request().postDataJSON().time;
    if (time === '03:00') { oldPreview = route; return; }
    if (time === '07:00') return route.fulfill({ json: { next_runs: ['2027-01-12T07:00:00Z'] } });
    return route.fallback();
  });
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await page.getByLabel('Time zone', { exact: true }).fill('UTC');
  await page.getByLabel('Restart at', { exact: true }).fill('03:00');
  await expect.poll(() => Boolean(oldPreview)).toBe(true);
  await page.getByLabel('Restart at', { exact: true }).fill('07:00');
  await expect(page.locator('.restart-preview li')).toContainText(/07:00/);
  await oldPreview!.fulfill({ json: { next_runs: ['2027-01-12T03:00:00Z'] } });
  await expect(page.locator('.restart-preview li')).toContainText(/07:00/);
});

test('changing repeat preserves a custom schedule name', async ({ page }) => {
  await mockServer(page);
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Sunday maintenance');
  for (const preset of ['Weekly', 'Once', 'Weekdays', 'Daily']) {
    await page.getByRole('button', { name: preset, exact: true }).click();
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Sunday maintenance');
  }
});

test('keyboard controls select repeat days and submit without server shortcuts', async ({ page }) => {
  await mockServer(page, { powerControls: true });
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  const name = page.getByLabel('Name', { exact: true });
  await expect(name).toBeFocused();
  await name.fill('Keyboard schedule');
  await name.press('r');
  await name.press('Tab');
  await expect(page.getByRole('button', { name: 'Daily', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Weekly', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Monday', exact: true }).press('Space');
  await expect(page.getByRole('button', { name: 'Monday', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.modal.show')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save schedule', exact: true })).toBeEnabled();
  await name.press('Enter');
  await expect(page.getByRole('heading', { name: 'Keyboard scheduler', exact: true })).toBeVisible();
});

test('narrow mobile one-time fields and long-name deletion fit the screen', async ({ page }, testInfo) => {
  await mockServer(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('W'.repeat(80));
  await page.getByRole('button', { name: 'Once', exact: true }).click();
  await page.getByLabel('Date', { exact: true }).fill('2027-01-12');
  await page.getByLabel('Restart at', { exact: true }).fill('04:00');
  await page.getByLabel('Time zone', { exact: true }).fill('UTC');
  await expect(page.getByRole('button', { name: 'Save schedule', exact: true })).toBeEnabled();
  for (const field of ['#restart-date', '#restart-time']) {
    const geometry = await page.locator(field).evaluate(el => ({
      right: el.getBoundingClientRect().right,
      parentRight: el.closest('.restart-editor-window')!.getBoundingClientRect().right,
      overflow: el.scrollWidth - el.clientWidth,
    }));
    expect(geometry.right).toBeLessThanOrEqual(geometry.parentRight);
    expect(geometry.overflow).toBeLessThanOrEqual(1);
  }
  await page.screenshot({ path: testInfo.outputPath('mobile-once.png'), fullPage: true });
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click();
  const row = page.getByTestId('schedule-new');
  await expect(page.locator('.restart-editor-window')).toHaveCount(0);
  await expect(row).toHaveCSS('opacity', '1');
  await row.getByRole('button', { name: `Delete ${'W'.repeat(80)}`, exact: true }).click();
  await expect(row.getByRole('button', { name: 'Keep schedule', exact: true })).toBeVisible();
  const overflow = await page.locator('.restart-workspace').evaluate(el => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath('mobile-delete.png'), fullPage: true });
  await row.getByRole('button', { name: 'Keep schedule', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Keep schedule', exact: true })).toHaveCount(0);
  await expect(row.getByRole('heading', { name: 'W'.repeat(80), exact: true })).toBeVisible();
});

test('one-time dates stay within the current draft', async ({ page }) => {
  await mockServer(page);
  await page.goto('/admin/restart-schedules');
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Once', exact: true }).click();
  await page.getByLabel('Date', { exact: true }).fill('2027-01-12');
  await page.getByRole('button', { name: 'Close schedule editor', exact: true }).click();
  await page.getByRole('button', { name: 'Add schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Once', exact: true }).click();
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Save schedule', exact: true })).toBeDisabled();
  await page.getByLabel('Date', { exact: true }).fill('2027-01-13');
  await page.getByRole('button', { name: 'Once', exact: true }).click();
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2027-01-13');
  await page.getByRole('button', { name: 'Daily', exact: true }).click();
  await page.getByRole('button', { name: 'Once', exact: true }).click();
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('');
  await page.getByLabel('Date', { exact: true }).fill('2027-01-14');
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click();
  await page.getByTestId('schedule-new').getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2027-01-14');
  await page.getByRole('button', { name: 'Close schedule editor', exact: true }).click();
  await page.getByTestId('schedule-nightly').getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('button', { name: 'Once', exact: true }).click();
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue('');
});
