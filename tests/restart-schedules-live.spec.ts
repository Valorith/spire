import { expect, Page, APIRequestContext, test } from '@playwright/test';

// Run against tests/fixtures/restart-server. No schedule APIs are mocked.
const fixture = process.env.SPIRE_RESTART_QA_API;
const api = `${fixture}/api/v1/eqemuserver/server/restart-schedules`;
test.skip(!fixture, 'Requires the isolated restart-server fixture');

async function verifyFixture(request: APIRequestContext) {
  const response = await request.get(`${fixture}/api/v1/eqemuserver/server-stats`);
  expect((await response.json()).server_name).toBe('Restart QA');
}

async function cleanSchedule(request: APIRequestContext, id: string | undefined) {
  if (!id) return;
  const state = await (await request.get(api)).json();
  const schedule = state.schedules.find(s => s.id === id);
  if (schedule && state.active?.schedule_id !== id) {
    await request.delete(`${api}/${id}`, { params: { revision: schedule.revision } });
  }
}

async function open(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.routeWebSocket('**/api/v1/websocket*', () => {});
  await page.route('https://api.github.com/**', route => route.abort());
  await page.goto('/admin/restart-schedules');
  await expect(page.getByRole('heading', { name: 'Restart schedules', exact: true })).toBeVisible();
  return errors;
}

test('real API persists edits, pause and deletion across page reloads', async ({ page, request }) => {
  await verifyFixture(request);
  const errors = await open(page);
  const name = `QA persisted ${Date.now()}`;
  let id: string | undefined;
  try {
    await page.getByRole('button', { name: 'Add schedule', exact: true }).first().click();
    await page.getByLabel('Name', { exact: true }).fill(name);
    await page.getByLabel('Time zone', { exact: true }).fill('UTC');
    const clock = new Date(Date.now() + 12 * 3600000).toISOString().slice(11, 16);
    await page.getByLabel('Restart at', { exact: true }).fill(clock);
    await page.getByLabel('Warn players before restart').selectOption('0');
    const created = page.waitForResponse(r => r.url() === api && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save schedule', exact: true }).click();
    const saved = await (await created).json();
    id = saved.id;
    expect(saved).toMatchObject({ name, time: clock, timezone: 'UTC', warning_minutes: 0, revision: 1 });
    await page.reload();
    const row = page.getByTestId(`schedule-${id}`);
    await expect(row.getByRole('heading', { name, exact: true })).toBeVisible();
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Name', { exact: true }).fill(`${name} edited`);
    await page.getByRole('button', { name: 'Save schedule', exact: true }).click();
    await expect(row.getByRole('heading', { name: `${name} edited`, exact: true })).toBeVisible();
    await row.getByRole('switch').click();
    await expect(row.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    await page.reload();
    await expect(row.getByText('Paused', { exact: true })).toBeVisible();
    await row.getByRole('button', { name: `Delete ${name} edited`, exact: true }).click();
    await row.getByRole('button', { name: 'Delete schedule', exact: true }).click();
    await expect(row).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally { await cleanSchedule(request, id); }
});

test('real runner countdown cancels and records history through the UI', async ({ page, request }) => {
  await verifyFixture(request);
  const name = `QA countdown ${Date.now()}`;
  const created = await request.post(api, { data: { name, enabled: true, timezone: 'UTC', days: [], once_at: new Date(Date.now() + 90000).toISOString(), warning_minutes: 5 } });
  expect(created.ok()).toBe(true);
  const { id } = await created.json();
  try {
    await expect.poll(async () => (await (await request.get(api)).json()).active?.schedule_id).toBe(id);
    const errors = await open(page);
    const row = page.getByTestId(`schedule-${id}`);
    await expect(row.getByRole('button', { name: 'Edit', exact: true })).toBeDisabled();
    await expect(row.getByRole('switch')).toBeDisabled();
    await expect(row.getByText('Countdown', { exact: true })).toBeVisible();
    await expect(row.getByText('Paused', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Cancel this restart', exact: true }).click();
    const history = page.locator('.restart-history-row').filter({ hasText: name });
    await expect(history.getByText('Cancelled', { exact: true })).toBeVisible();
    await page.reload();
    await expect(history.getByText('Cancelled', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'tmp/restart-qa-round2/cancellation.png', fullPage: true });
    expect(errors).toEqual([]);
  } finally { await cleanSchedule(request, id); }
});

test('real runner completes a one-time simulated restart exactly once', async ({ page, request }) => {
  await verifyFixture(request);
  const name = `QA one-time ${Date.now()}`;
  const created = await request.post(api, { data: { name, enabled: true, timezone: 'UTC', days: [], once_at: new Date(Date.now() + 3000).toISOString(), warning_minutes: 0 } });
  expect(created.ok()).toBe(true);
  const { id } = await created.json();
  try {
    await expect.poll(async () => {
      const state = await (await request.get(api)).json();
      return state.history.find(run => run.schedule_id === id)?.status;
    }, { timeout: 10000 }).toBe('succeeded');
    const state = await (await request.get(api)).json();
    expect(state.history.filter(run => run.schedule_id === id)).toHaveLength(1);
    expect(state.schedules.find(s => s.id === id).enabled).toBe(false);
    const errors = await open(page);
    await expect(page.locator('.restart-history-row').filter({ hasText: name }).getByText('Restarted', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  } finally { await cleanSchedule(request, id); }
});
