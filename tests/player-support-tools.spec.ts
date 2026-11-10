import { expect, Page, test } from '@playwright/test';

// Player Support tools: Evidence, Snapshots, Items, Recovery, Quests & progress,
// Account Action, Linked accounts and Bug reports. Every API route is mocked.

const submitted = 1794116400;
const endpoint = '/api/v1/player-support/cases';
const caseKey = '731-' + submitted;
const tunic = { id: 2730, name: 'Fungus Covered Scale Tunic', icon: 590, stackable: 0, stack_size: 1 };
const cloak = { id: 1050, name: 'Cloak of Flames', icon: 650, stackable: 0, stack_size: 1 };
const dagger = { id: 7007, name: 'Rusty Dagger', icon: 592, stackable: 0, stack_size: 1 };
const chips = { id: 13073, name: 'Bone Chips', icon: 1146, stackable: 1, stack_size: 20 };

type Json = Record<string, unknown>;
type Write = { path: string; method: string; input: Json };

interface Options {
  read?: string[];
  write?: string[];
  record?: Json;
  features?: Json;
  // Companion status of the local World: 'ready', 'missing' (no patch), ...
  companion?: string;
  // Per-route GET responses, keyed by the path after the case key ("events", "items", "tasks", ...).
  responses?: Record<string, unknown>;
  // Per-route write responses, keyed the same way: { status, json }.
  replies?: Record<string, { status: number; json?: unknown }>;
}

async function mockTools(page: Page, options: Options = {}) {
  const record = {
    key: caseKey, petition_id: 100, character_id: 100, character: 'Aranel', account: 'norrathguide',
    zone: 'sebilis', message: 'My Fungi Tunic disappeared after a trade.', urgency: 2, submitted_at: submitted,
    status: 'open', owner: 'Guide', mine: true, native_open: true, checked_out: false, revision: 0, account_presence: 'online',
    category: '', escalated: false, subject_character: '', age_state: 'fresh', follow_up: false, viewers: [], account_notes: 0,
    ...(options.record || {}),
  };
  const features = { patch: 3, close_petition: true, lockouts: false, tasks: false, revoke: false, corpse_exp: false, unbury: false, ...(options.features || {}) };
  const read = options.read || ['player-support', 'mail-parcels-editor', 'player-operations', 'player_event_logs'];
  const write = options.write || ['player-support', 'mail-parcels-editor', 'player-operations'];
  const responses = options.responses || {};
  const replies = options.replies || {};
  const writes: Write[] = [];
  const requests: URL[] = [];

  await page.addInitScript(() => localStorage.setItem(`spire-web-access-token-${location.host}`, 'test-session'));
  await page.route('**/api/v1/**', route => route.fulfill({ json: [] }));
  await page.routeWebSocket('**/api/v1/websocket*', () => {});
  await page.route('https://api.github.com/**', route => route.abort());
  await page.route('**/api/v1/app/env', route => route.fulfill({ json: { data: {
    env: 'desktop', version: '5.9.0', os: 'windows', is_spire_initialized: true,
    features: {}, settings: [{ setting: 'AUTH_ENABLED', value: 'true' }],
  } } }));
  await page.route('**/api/v1/me', route => route.fulfill({ json: { id: 2, user_name: 'Guide', provider: 'local', is_admin: false } }));
  await page.route('**/api/v1/permissions/me', route => route.fulfill({ json: { connection_id: 7, read_all: false, write_all: false, read, write } }));
  await page.route('**/api/v1/mail-parcels-editor/items?*', route => route.fulfill({ json: { data: [tunic] } }));
  await page.route('**/api/v1/player-support/replies**', route => route.fulfill({ json: { replies: [] } }));
  await page.route('**/api/v1/player-support/staff**', route => route.fulfill({ json: { staff: [{ id: 2, name: 'Guide' }] } }));
  await page.route(`**${endpoint}**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const rest = path.startsWith(`${endpoint}/${caseKey}/`) ? path.slice(`${endpoint}/${caseKey}/`.length) : '';
    if (request.method() === 'GET') {
      requests.push(url);
      if (path === endpoint) {
        return route.fulfill({ json: {
          connection_id: 7, cases: [record], total: 1, companion: options.companion || 'ready', features,
          summary: { active: 1, urgent: 1, unassigned: 0, waiting: 0, mine: 1, attention: 0, overdue: 0, follow_up: 0, escalated: 0 },
        } });
      }
      if (path === `${endpoint}/${caseKey}`) return route.fulfill({ json: { case: record, activity: [], history: [], account_notes: [], viewers: [], features } });
      const key = Object.keys(responses).find(name => rest === name || rest.startsWith(name + '/'));
      if (key) {
        const value = responses[key];
        return route.fulfill({ json: typeof value === 'function' ? (value as (url: URL) => unknown)(url) : value });
      }
      return route.fulfill({ json: {} });
    }
    const input = request.postDataJSON() || {};
    writes.push({ path: rest || path, method: request.method(), input });
    const reply = Object.entries(replies).find(([name]) => rest === name || rest.endsWith(name));
    if (reply) return route.fulfill({ status: reply[1].status, json: reply[1].json });
    if (rest === 'presence') return route.fulfill({ json: { viewers: [] } });
    return route.fulfill({ status: 204 });
  });
  return { writes, requests, record };
}

const reasonField = /^Reason \(required/;
const requestId = expect.stringMatching(/^[a-f0-9]{32}$/);

async function openCase(page: Page) {
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeVisible();
}

test.use({ viewport: { width: 1440, height: 900 } });

const destroyed = {
  id: 92, character_id: 100, character: 'Aranel', zone_id: 89, event_type_id: 9, event_type_name: 'Item Destroy',
  event_data: JSON.stringify({ item_id: 2730, item_name: 'Fungus Covered Scale Tunic', charges: 1, reason: 'Client Destroy' }),
  created_at: new Date((submitted + 300) * 1000).toISOString(),
};
function events(list: object[], extra: Json = {}) {
  return (url: URL) => ({
    events: list, hours: 24, group: url.searchParams.get('group'), filed_at: submitted, page: 1, page_size: 50,
    total: list.length, newer: list.length, subject: { kind: url.searchParams.get('subject') || 'petitioner', name: 'Badguy' }, ...extra,
  });
}
const trace = {
  item: tunic,
  locations: [{ place: 'alt', character: 'Thornalt', slot: 25, count: 1, augments: [0, 0, 0, 0, 0, 0] }],
  restores: [{ case_key: '700-1794000000', character: 'Aranel', quantity: 1, sent_at: '2026-11-02T10:00:00Z', actor: 'Valorith', source: 'Player Support' }],
  events: [destroyed],
};

test('traces a destroyed item from Evidence and returns it through the reviewed parcel composer', async ({ page }) => {
  const { requests } = await mockTools(page, { responses: { events: events([destroyed]), items: trace } });
  await openCase(page);
  await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  const evidence = page.getByRole('region', { name: 'Evidence' });
  await evidence.getByRole('button', { name: 'Trace Fungus Covered Scale Tunic' }).click();

  const dialog = page.getByRole('dialog', { name: 'Items · Aranel' });
  await expect(dialog.getByRole('row', { name: /Another character Thornalt/ })).toBeVisible();
  await expect(dialog.getByText('× 1 to Aranel')).toBeVisible();
  expect(requests.some(url => url.pathname.endsWith('/items') && url.searchParams.get('item_id') === '2730')).toBe(true);

  await dialog.getByRole('button', { name: 'Return by parcel' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Fungus Covered Scale Tunic is still in Thornalt’s inventory and was restored on');
  await expect(dialog.getByRole('alert')).toContainText('Return it anyway?');
  await dialog.getByRole('button', { name: 'Return anyway' }).click();

  const composer = page.locator('.modal.show').filter({ hasText: 'Reason for delivery' });
  await expect(composer.getByText('Fungus Covered Scale Tunic')).toBeVisible();
  await expect(composer.getByLabel('Reason for delivery')).toHaveValue(/^Returned Fungus Covered Scale Tunic \(destroyed .+\) for case #731$/);

  await composer.getByRole('button', { name: /Cancel|Close/ }).first().click();
  await page.getByRole('navigation', { name: 'Character tools' }).getByRole('button', { name: 'Items', exact: true }).click();
  const fresh = page.getByRole('dialog', { name: 'Items · Aranel' });
  await fresh.getByRole('button', { name: 'Restore history' }).click();
  await expect(fresh.getByText('No items were sent to this account by staff in the last 90 days.')).toBeVisible();
});

test('lists snapshot items found elsewhere as accounted for and traces any line', async ({ page }) => {
  const { requests } = await mockTools(page, { responses: {
    snapshots: (url: URL) => /\/snapshots\/\d+$/.test(url.pathname)
      ? { time_index: submitted - 7200, missing: [
        { item: tunic, augments: [null, null, null, null, null, null], had: 1, has: 0, missing: 1 },
        { item: cloak, augments: [null, null, null, null, null, null], had: 1, has: 0, missing: 0, accounted: true,
          elsewhere: { corpse: 0, parcel: 0, shared_bank: 0, alt: 1, restored: 0, alt_name: 'Thornalt' } },
        { item: dagger, augments: [null, null, null, null, null, null], had: 1, has: 0, missing: 0, accounted: true,
          elsewhere: { corpse: 0, parcel: 0, shared_bank: 0, alt: 0, restored: 1, restored_at: '2026-11-05T12:00:00Z' } },
        { item: chips, augments: [null, null, null, null, null, null], had: 2, has: 0, missing: 0, accounted: true,
          elsewhere: { corpse: 0, parcel: 0, shared_bank: 0, alt: 1, restored: 1 } },
      ] }
      : { snapshots: [{ time_index: submitted - 7200, items: 31 }] },
    items: { ...trace, item: cloak, locations: trace.locations, restores: [] },
  } });
  await openCase(page);
  await page.getByRole('button', { name: 'Inventory snapshots' }).click();
  const snapshots = page.locator('.modal.show');
  await expect(snapshots.getByText('1 item is missing')).toBeVisible();
  await snapshots.getByRole('button', { name: 'Accounted for (3)' }).click();
  await expect(snapshots.getByText('On Thornalt', { exact: true })).toBeVisible();
  const day = await page.evaluate(() => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date('2026-11-05T12:00:00Z')));
  await expect(snapshots.getByText(`Restored on ${day}`, { exact: true })).toBeVisible();
  await expect(snapshots.getByText('On another character and restored since the snapshot', { exact: true })).toBeVisible();
  await expect(snapshots.getByRole('checkbox')).toHaveCount(1);
  await snapshots.getByRole('button', { name: 'Where is Cloak of Flames?' }).click();
  const items = page.getByRole('dialog', { name: 'Items · Aranel' });
  await expect(items.getByText('Cloak of Flames', { exact: true })).toBeVisible();
  await expect(items.getByText(/missing since/)).toBeVisible();
  expect(requests.some(url => url.pathname.endsWith('/items') && url.searchParams.get('item_id') === '1050')).toBe(true);
});

const lockouts = (state: string) => ({
  state, features: {}, safe_return: { zone_id: 22, zone_name: 'East Commonlands', instance_zone_id: 108 },
  lockouts: [{ id: 5, expedition: 'Veeshan’s Peak', event: 'Replay Timer', expires_at: '2026-11-10T12:00:00Z', remaining_seconds: 8100 }],
  instances: [{ instance_id: 31, zone_id: 108, zone_name: 'Veeshan’s Peak', version: 1, expires_at: '2026-11-10T12:00:00Z', never_expires: false, dz_name: 'Veeshan’s Peak' }],
});

test('removes a lockout offline, explains the patch in game, and shows the reward before completing a task', async ({ page }) => {
  const { writes } = await mockTools(page, {
    responses: { lockouts: lockouts('offline') },
    replies: { lockouts: { status: 200, json: { status: 'sent', message: 'Removed. Aranel can enter again.' } } },
  });
  await openCase(page);
  await page.getByRole('button', { name: 'Quests & progress' }).click();
  const dialog = page.getByRole('dialog', { name: 'Quests & progress · Aranel' });
  await dialog.getByRole('button', { name: 'Lockouts', exact: true }).click();
  await expect(dialog.getByText('Aranel is offline: changes are saved to the database.')).toBeVisible();
  await expect(dialog.getByText('Instance membership is read-only here. The player can leave an expedition with /dzquit.')).toBeVisible();
  await dialog.getByRole('button', { name: /Remove lockout Veeshan’s Peak/ }).click();
  const confirm = dialog.getByRole('button', { name: 'Remove lockout', exact: true });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel(reasonField).fill('Lockout from a crashed raid');
  await confirm.click();
  await expect(dialog.getByRole('status')).toHaveText('Removed. Aranel can enter again.');
  expect(writes.find(item => item.path === 'lockouts')!.input).toEqual({ lockout_id: 5, reason: 'Lockout from a crashed raid', request_id: requestId });
});

test('disables lockout removal in game without the patch', async ({ page }) => {
  await mockTools(page, { responses: { lockouts: lockouts('in_zone') } });
  await openCase(page);
  await page.getByRole('button', { name: 'Quests & progress' }).click();
  const dialog = page.getByRole('dialog', { name: 'Quests & progress · Aranel' });
  await dialog.getByRole('button', { name: 'Lockouts', exact: true }).click();
  await expect(dialog.getByText('In game. Changing this in game needs the updated Player Support patch.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: /Remove lockout Veeshan’s Peak/ })).toBeDisabled();
});

test('says whether an unconfirmed state means World is down or runs on another host', async ({ page }) => {
  await mockTools(page, { responses: {
    tasks: { state: 'unknown', features: {}, local_world: true, tasks: [], completed: [], timers: [] },
    lockouts: { ...lockouts('unknown'), local_world: false },
  } });
  await openCase(page);
  await page.getByRole('button', { name: 'Quests & progress' }).click();
  const dialog = page.getByRole('dialog', { name: 'Quests & progress · Aranel' });
  await expect(dialog.getByText('Spire cannot confirm Aranel is offline. Aranel is marked in game, and World is down or not answering.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Lockouts', exact: true }).click();
  await expect(dialog.getByText("Spire cannot confirm Aranel is offline. This server's World runs on another host, so changes wait until Aranel logs out.")).toBeVisible();
  await expect(dialog.getByRole('button', { name: /Remove lockout Veeshan’s Peak/ })).toBeDisabled();
});

test('shows the goal and reward before an in-game step update completes the task', async ({ page }) => {
  const { writes } = await mockTools(page, {
    features: { tasks: true },
    responses: { tasks: { state: 'in_zone', features: { tasks: true }, completed: [], timers: [], tasks: [{
      task_id: 140, title: 'The Lost Tunic', type: 'task', accepted_at: '2026-11-08T10:00:00Z', expires_at: null,
      reward: { text: 'A fine tunic', copper: 50, exp: 1200, points: 0, items: [{ id: 2730, name: 'Fungus Covered Scale Tunic' }] },
      activities: [
        { activity_id: 0, step: 0, description: 'Speak with Hanns', goal: 1, done: 1, completed: true, optional: false },
        { activity_id: 1, step: 1, description: 'Collect scales', goal: 3, done: 1, completed: false, optional: false },
      ],
    }] } },
    replies: { tasks: { status: 200, json: { status: 'sent', message: 'The task is complete and its reward was granted.' } } },
  });
  await openCase(page);
  await page.getByRole('button', { name: 'Quests & progress' }).click();
  const dialog = page.getByRole('dialog', { name: 'Quests & progress · Aranel' });
  await expect(dialog.getByText('Aranel is in game: changes apply in game.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Add progress to Collect scales' }).click();
  await expect(dialog.getByText('This completes the task.')).toHaveCount(0);
  await dialog.getByLabel('Amount to add').fill('2');
  await expect(dialog.getByText('This completes the task. Aranel receives: A fine tunic, 1,200 experience, 5 silver, Fungus Covered Scale Tunic.')).toBeVisible();
  await dialog.getByLabel(reasonField).fill('Scales were lost to a client crash');
  await dialog.getByRole('button', { name: 'Complete task' }).click();
  await expect(dialog.getByRole('status')).toHaveText('The task is complete and its reward was granted.');
  expect(writes.find(item => item.path === 'tasks')!.input).toEqual({
    action: 'update_activity', task_id: 140, activity_id: 1, count: 2, timer_id: 0, expected_done: 1, reason: 'Scales were lost to a client crash', request_id: requestId,
  });
});

const discipline = (overrides: Json = {}) => ({
  account: { id: 12, name: 'norrathguide', status: 0, suspended_until: null, suspend_reason: '', ban_reason: '', revoked: false },
  online_character: 'Aranel', local_world: true, sanctionable: true, sanction_note: '', legacy_sanction: false, ...overrides,
});

const noticeHint = 'The player is mailed a notice of this action. Your reason is not included.';

test('suspends after a second confirmation, refuses staff accounts, and kicks', async ({ page }) => {
  const { writes } = await mockTools(page, {
    responses: { discipline: discipline() },
    replies: {
      sanction: { status: 200, json: { status: 'sent', notice: 'mailed', message: 'The account is blocked at login. Aranel was in game and has been kicked. The player was notified by mail.' } },
      kick: { status: 200, json: { status: 'sent', notice: 'failed', message: 'Kick sent. Aranel should leave the game within a few seconds. The notice could not be mailed to the player.' } },
    },
  });
  await openCase(page);
  await page.getByRole('button', { name: 'Account Action', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Account Action · norrathguide' });
  await expect(dialog.getByText('Player', { exact: true })).toBeVisible();
  // Revoking chat while Aranel is in game needs the patch.
  await expect(dialog.getByRole('button', { name: /Revoke chat/ })).toBeDisabled();
  await expect(dialog.getByText('Aranel is in game. Revoking chat for a player in game needs the updated Player Support patch; kick them first or wait until they log out.')).toBeVisible();
  // Without the updated patch the channels depend on the server build.
  await expect(dialog.getByText('Restricts the account’s chat. Exactly which channels depends on the server build.')).toBeVisible();
  await expect(dialog.getByText(/Tells still work/)).toHaveCount(0);

  await dialog.getByRole('button', { name: /^Suspend/ }).click();
  await dialog.getByLabel('Until').fill('2030-01-02T15:30');
  await expect(dialog.getByText(noticeHint)).toBeVisible();
  await expect(dialog.getByLabel(reasonField)).toHaveAccessibleDescription(new RegExp(noticeHint.replace(/\./g, '\\.') + '$'));
  await dialog.getByLabel(reasonField).fill('Repeated harassment in OOC');
  await dialog.getByRole('button', { name: 'Suspend account' }).click();
  await expect(dialog.getByText(/^Suspend norrathguide until .+\?$/)).toBeVisible();
  await expect(dialog.getByText('Every character on it is blocked at login and kicked if in game.')).toBeVisible();
  expect(writes.filter(item => item.path === 'sanction')).toHaveLength(0);
  await dialog.getByRole('button', { name: 'Suspend account' }).click();
  await expect(dialog.getByRole('status')).toHaveText('The account is blocked at login. Aranel was in game and has been kicked. The player was notified by mail.');
  expect(writes.find(item => item.path === 'sanction')!.input).toEqual({
    mode: 'suspend', until: new Date('2030-01-02T15:30').toISOString(), expected_suspended_until: null,
    reason: 'Repeated harassment in OOC', request_id: requestId,
  });

  await dialog.getByRole('button', { name: /^Kick Aranel/ }).click();
  await expect(dialog.getByText(noticeHint)).toBeVisible();
  await dialog.getByLabel(reasonField).fill('Disconnect to clear a stuck state');
  await dialog.getByRole('button', { name: 'Kick', exact: true }).click();
  // A notice that could not be mailed does not undo the kick.
  await expect(dialog.getByRole('status')).toHaveText('Kick sent. Aranel should leave the game within a few seconds. The notice could not be mailed to the player.');
  expect(writes.find(item => item.path === 'kick')!.input).toEqual({ reason: 'Disconnect to clear a stuck state', request_id: requestId });
});

test('disables suspend and ban for a staff account with the sanction note', async ({ page }) => {
  const note = 'This account has status 100. Spire suspends and bans player accounts only.';
  await mockTools(page, { responses: { discipline: discipline({ account: { ...discipline().account, status: 100 }, sanctionable: false, sanction_note: note }) } });
  await openCase(page);
  await page.getByRole('button', { name: 'Account Action', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Account Action · norrathguide' });
  await expect(dialog.getByText('Status 100', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /^Suspend/ })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: /^Ban/ })).toBeDisabled();
  await expect(dialog.getByText(note)).toHaveCount(2);
});

test('states the exact chat policy on the updated patch', async ({ page }) => {
  const { writes } = await mockTools(page, {
    features: { revoke: true },
    responses: { discipline: discipline({ online_character: '' }) },
    replies: { revoke: { status: 200, json: { status: 'sent', notice: 'mailed', message: 'It applies when the player next logs in. The player was notified by mail.' } } },
  });
  await openCase(page);
  await page.getByRole('button', { name: 'Account Action', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Account Action · norrathguide' });
  const revoke = dialog.getByRole('button', { name: /Revoke chat/ });
  await expect(revoke).toContainText('Blocks OOC, auction and shout. Tells still work.');
  await revoke.click();
  await expect(dialog.getByText('Blocks OOC, auction and shout. Tells still work. It applies when the player next logs in.')).toBeVisible();
  await dialog.getByLabel(reasonField).fill('Spamming the auction channel');
  await dialog.getByRole('button', { name: 'Revoke chat', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('It applies when the player next logs in. The player was notified by mail.');
  expect(writes.find(item => item.path === 'revoke')!.input).toEqual({ revoked: true, reason: 'Spamming the auction channel', request_id: requestId });
});

function recovery(features: Json) {
  const location = { zone_id: 89, instance_id: 0, zone_name: 'Old Sebilis', x: 3, y: -52, z: 5 };
  return {
    character: location, local_world: true, companion: 'ready', live_destination: true, features,
    live_location: { zone_id: 89, instance_id: 8 },
    corpses: [
      { id: 42, location: { ...location, instance_id: 8 }, time_of_death: '2026-11-08T12:34:00Z', item_count: 0, rezzable: true, exp: 54321 },
      { id: 17, location, time_of_death: '2026-11-07T15:12:00Z', item_count: 0, buried: true, rezzed: false, exp: 300 },
    ],
  };
}

test('restores corpse experience only where the player is and moves buried corpses only with the patch', async ({ page }) => {
  const { writes } = await mockTools(page, {
    features: { corpse_exp: true },
    responses: { recovery: recovery({ corpse_exp: true, unbury: false }) },
    replies: { experience: { status: 200, json: { status: 'sent', message: 'Returned 54,321 experience.' } } },
  });
  await openCase(page);
  await page.getByRole('button', { name: 'Corpses', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Aranel · Recovery' });
  await expect(dialog.getByText('Experience: 54,321')).toBeVisible();
  await dialog.getByRole('button', { name: 'Restore experience' }).click();
  await dialog.getByLabel(reasonField).fill('Died to a server crash');
  await dialog.getByRole('button', { name: 'Restore experience' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Returned 54,321 experience.');
  expect(writes.find(item => item.path === 'corpses/42/experience')!.input).toEqual({ reason: 'Died to a server crash', request_id: requestId });

  await dialog.getByRole('button', { name: /#17/ }).click();
  await expect(dialog.getByRole('button', { name: 'Restore experience' })).toBeDisabled();
  await expect(dialog.getByText('Move the corpse to Aranel first. Experience is restored where the player is.')).toBeVisible();
  await expect(dialog.getByText('Moving a buried corpse needs the updated Player Support patch.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: /^Move corpse/ })).toHaveCount(0);
});

test('offers a buried corpse for moves when the patch can unbury it', async ({ page }) => {
  await mockTools(page, { features: { unbury: true }, responses: { recovery: recovery({ unbury: true }) } });
  await openCase(page);
  await page.getByRole('button', { name: 'Corpses', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Aranel · Recovery' });
  await dialog.getByRole('button', { name: /#17/ }).click();
  await expect(dialog.getByText('Buried · will be unburied').first()).toBeVisible();
  await expect(dialog.getByText('Moving a buried corpse needs the updated Player Support patch.')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: /^Move corpse/ })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Restore experience' })).toBeDisabled();
  await expect(dialog.getByText('Needs the updated Player Support patch', { exact: true })).toBeVisible();
});

const say = {
  id: 95, character_id: 100, character: 'Aranel', zone_id: 89, event_type_id: 29, event_type_name: 'Say',
  event_data: JSON.stringify({ message: 'hello' }), created_at: new Date((submitted + 60) * 1000).toISOString(),
};

test('hides chat Evidence without the chat log permission', async ({ page }) => {
  await mockTools(page, { responses: { events: events([destroyed]) } });
  await openCase(page);
  await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  const evidence = page.getByRole('region', { name: 'Evidence' });
  await expect(evidence.getByRole('button', { name: 'Tasks' })).toBeVisible();
  await expect(evidence.getByRole('button', { name: 'Hacks' })).toBeVisible();
  await expect(evidence.getByRole('button', { name: 'Chat', exact: true })).toHaveCount(0);
});

test('shows chat Evidence with its logging note and switches to the reported player', async ({ page }) => {
  const { requests } = await mockTools(page, {
    read: ['player-support', 'mail-parcels-editor', 'player-operations', 'player_event_logs', 'player-support-chat-logs'],
    record: { subject_character: 'Badguy', subject_character_id: 205 },
    responses: { events: (url: URL) => url.searchParams.get('group') === 'chat'
      ? events([say], { logging: { say: false, player_speech: false } })(url)
      : events([destroyed])(url) },
  });
  await openCase(page);
  await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  const evidence = page.getByRole('region', { name: 'Evidence' });
  await evidence.getByRole('button', { name: 'Chat', exact: true }).click();
  await expect(evidence.getByText('Speech logging is off on this server. Turn on Say and Player Speech in Player Event Log settings to keep chat for future cases.')).toBeVisible();
  const whose = evidence.getByRole('group', { name: 'Whose events' });
  await expect(whose.getByRole('button', { name: 'norrathguide’s characters' })).toHaveAttribute('aria-pressed', 'true');
  await whose.getByRole('button', { name: 'Badguy' }).click();
  await expect(evidence.getByText('the reported player')).toBeVisible();
  const last = requests.filter(url => url.pathname.endsWith('/events')).pop()!;
  expect(last.searchParams.get('subject')).toBe('reported');
  expect(last.searchParams.get('group')).toBe('chat');
});

test('checks linked accounts only with the permission and shows masked addresses', async ({ page }) => {
  await mockTools(page);
  await openCase(page);
  await expect(page.getByRole('button', { name: 'Check shared IP addresses' })).toHaveCount(0);

  const linked = await page.context().newPage();
  const { requests } = await mockTools(linked, {
    read: ['player-support', 'mail-parcels-editor', 'player-operations', 'player_event_logs', 'player-support-linked-accounts'],
    responses: { 'linked-accounts': { ip_count: 3, hidden_addresses: 1, accounts: [{
      id: 5, name: 'thornalt', status: -1, restriction: 'suspended', characters: ['Thornalt', 'Thornwick'], cases: 3,
      shared: [{ ip: '203.0.113.x', last_used: '2026-11-08T12:00:00Z' }, { ip: '2001:db8:85a3:x', last_used: '2026-11-01T12:00:00Z' }],
    }] } },
  });
  await openCase(linked);
  const section = linked.getByRole('region', { name: 'Linked accounts' });
  await expect(section.getByText('Viewing is recorded on the case.')).toBeVisible();
  expect(requests.some(url => url.pathname.endsWith('/linked-accounts'))).toBe(false);
  await section.getByRole('button', { name: 'Check shared IP addresses' }).click();
  await expect(section.getByText('203.0.113.x')).toBeVisible();
  await expect(section.getByText('2001:db8:85a3:x')).toBeVisible();
  await expect(section.getByText('2 shared addresses')).toBeVisible();
  await expect(section.getByText('Suspended')).toBeVisible();
  await expect(section.getByText('1 widely shared address was left out.')).toBeVisible();
});

const bug = { id: 12, character_name: 'Aranel', category: 'Gameplay', zone: 'sebilis', reported_at: '2026-11-08T11:00:00Z',
  text: 'My tunic vanished when I zoned. '.repeat(8), status: 0, reviewed_by: '', linked: false };

test('renders no bug report section without reports', async ({ page }) => {
  const { requests } = await mockTools(page, { responses: { 'bug-reports': { reports: [] } } });
  await openCase(page);
  await expect(page.getByRole('complementary', { name: 'Character and actions' })).toBeVisible();
  await expect.poll(() => requests.some(url => url.pathname.endsWith('/bug-reports'))).toBe(true);
  await expect(page.getByRole('heading', { name: /^Bug reports/ })).toHaveCount(0);
});

test('links a bug report to the case and marks it reviewed', async ({ page }) => {
  const { writes } = await mockTools(page, {
    write: ['player-support', 'mail-parcels-editor', 'player-operations', 'bug_reports'],
    responses: { 'bug-reports': { reports: [bug] } },
    replies: { 'bug-reports/12': { status: 200, json: { reports: [{ ...bug, linked: true }] } } },
  });
  await openCase(page);
  const section = page.getByRole('region', { name: /^Bug reports/ });
  await expect(section.getByText('Aranel · Gameplay · sebilis')).toBeVisible();
  await section.getByRole('button', { name: 'Show more' }).click();
  await expect(section.getByRole('button', { name: 'Show less' })).toBeVisible();
  await section.getByRole('button', { name: 'Link to case' }).click();
  await expect(section.getByText('Linked', { exact: true })).toBeVisible();
  await section.getByRole('button', { name: 'Mark reviewed' }).click();
  await section.getByLabel(/^Review note/).fill('Zoning bug, reported upstream');
  await section.getByRole('button', { name: 'Mark reviewed' }).click();
  expect(writes.filter(item => item.path === 'bug-reports/12').map(item => item.input)).toEqual([
    { action: 'link', note: '' },
    { action: 'review', note: 'Zoning bug, reported upstream' },
  ]);
});

test('lists flags, keys, data buckets and quest globals and reloads the game cache', async ({ page }) => {
  const { writes } = await mockTools(page, {
    read: ['player-support', 'mail-parcels-editor', 'player-operations', 'player_event_logs', 'data-bucket-editor', 'qglobal-editor', 'inventory-keyring'],
    write: ['player-support', 'mail-parcels-editor', 'player-operations', 'data-bucket-editor'],
    responses: { flags: {
      zone_flags: [{ zone_id: 108, zone_name: 'Veeshan’s Peak' }],
      keys: [{ item_id: 20033, name: 'Key of Veeshan' }],
      buckets: [{ id: 9, key: 'flag_vp', value: '1', expires_at: null, scope: 'character' }, { id: 10, key: 'acct_pass', value: 'yes', expires_at: null, scope: 'account' }],
      quest_globals: [{ name: 'vp_key', value: '1', npc_id: 0, zone_id: 0, expires_at: null }],
      local_world: true,
    } },
    replies: { 'flags/cache': { status: 200, json: { status: 'sent', message: 'Zones will read data buckets from the database again.' } } },
  });
  await openCase(page);
  await page.getByRole('button', { name: 'Quests & progress' }).click();
  const dialog = page.getByRole('dialog', { name: 'Quests & progress · Aranel' });
  await dialog.getByRole('button', { name: 'Flags', exact: true }).click();
  await expect(dialog.getByText('Veeshan’s Peak')).toBeVisible();
  await expect(dialog.getByText('Key of Veeshan')).toBeVisible();
  await expect(dialog.getByText('flag_vp')).toBeVisible();
  await expect(dialog.getByText('Account', { exact: true })).toBeVisible();
  await expect(dialog.getByText('vp_key')).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Open in Data Buckets/ })).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Open in Inventory & Keyring/ })).toHaveAttribute('href', /character=100/);
  await dialog.getByRole('button', { name: 'Reload game cache' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Zones will read data buckets from the database again.');
  expect(writes.find(item => item.path === 'flags/cache')!.input).toEqual({});
});

test('returns a charged item that does not stack as one parcel, and missing copies as one parcel each', async ({ page }) => {
  // Item Destroy of a non-stackable item with 5 charges: one item, not five.
  const wand = { id: 6400, name: 'Wand of Frost Bolts', icon: 770, stackable: 0, stack_size: 1, max_charges: 5 };
  const zapped = { ...destroyed, id: 93, event_data: JSON.stringify({ item_id: 6400, item_name: wand.name, charges: 5, reason: 'Client Destroy' }) };
  // Merchant Sell of 20 arrows from a stack of 100: one parcel of 20.
  const arrows = { id: 8005, name: 'Field Point Arrows', icon: 500, stackable: 1, stack_size: 100 };
  const sold = { ...destroyed, id: 94, event_type_name: 'Merchant Sell', event_data: JSON.stringify({ item_id: 8005, item_name: arrows.name, charges: 20 }) };
  await mockTools(page, {
    responses: {
      events: events([zapped, sold]),
      items: (url: URL) => ({ item: url.searchParams.get('item_id') === '8005' ? arrows : wand, locations: [], restores: [], events: [] }),
      snapshots: (url: URL) => /\/snapshots\/\d+$/.test(url.pathname)
        ? { time_index: submitted - 7200, missing: [{ item: wand, augments: [null, null, null, null, null, null], had: 2, has: 0, missing: 2 }] }
        : { snapshots: [{ time_index: submitted - 7200, items: 31 }] },
    },
  });
  await openCase(page);
  await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  const evidence = page.getByRole('region', { name: 'Evidence' });
  const composer = page.locator('.modal.show').filter({ hasText: 'Reason for delivery' });

  await evidence.getByRole('button', { name: 'Trace Wand of Frost Bolts' }).click();
  await page.getByRole('dialog', { name: 'Items · Aranel' }).getByRole('button', { name: 'Return by parcel' }).click();
  await expect(composer.locator('.gm-parcel-line')).toHaveCount(1);
  await composer.getByRole('button', { name: /Cancel|Close/ }).first().click();
  await expect(composer).toHaveCount(0);

  await evidence.getByRole('button', { name: 'Trace Field Point Arrows' }).click();
  await page.getByRole('dialog', { name: 'Items · Aranel' }).getByRole('button', { name: 'Return by parcel' }).click();
  await expect(composer.locator('.gm-parcel-line')).toHaveCount(1);
  await expect(composer.getByLabel('Quantity')).toHaveValue('20');
  await composer.getByRole('button', { name: /Cancel|Close/ }).first().click();
  await expect(composer).toHaveCount(0);

  // Two copies missing since a snapshot are two parcels.
  await page.getByRole('button', { name: 'Inventory snapshots' }).click();
  await page.locator('.modal.show').getByRole('button', { name: 'Where is Wand of Frost Bolts?' }).click();
  await page.getByRole('dialog', { name: 'Items · Aranel' }).getByRole('button', { name: 'Return by parcel' }).click();
  await expect(composer.locator('.gm-parcel-line')).toHaveCount(2);
});

test('shows the cache reload only to a viewer who may write Player Support', async ({ page }) => {
  await mockTools(page, {
    read: ['player-support', 'player-operations', 'data-bucket-editor'],
    write: ['data-bucket-editor'],
    responses: { flags: { zone_flags: [], keys: [], buckets: [], quest_globals: [], local_world: true } },
  });
  await openCase(page);
  await page.getByRole('button', { name: 'Quests & progress' }).click();
  const dialog = page.getByRole('dialog', { name: 'Quests & progress · Aranel' });
  await dialog.getByRole('button', { name: 'Flags', exact: true }).click();
  await expect(dialog.getByText('Zone flags')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Reload game cache' })).toHaveCount(0);
});

// The same page against three game servers: stock EQEmu, the first Player
// Support patch (chat and moves, no "supportfeatures"), and the updated patch.
const versions = [
  { name: 'stock EQEmu without the patch', companion: 'missing', features: { patch: 0 }, patched: false },
  { name: 'the first Player Support patch', companion: 'ready', features: { patch: 2 }, patched: false },
  { name: 'the updated Player Support patch', companion: 'ready', patched: true,
    features: { patch: 3, close_petition: true, lockouts: true, tasks: true, revoke: true, corpse_exp: true, unbury: true } },
];

for (const version of versions) {
  test(`works against ${version.name}`, async ({ page }) => {
    const features = { close_petition: false, lockouts: false, tasks: false, revoke: false, corpse_exp: false, unbury: false, ...version.features };
    let lockoutState = 'in_zone';
    const { writes } = await mockTools(page, {
      companion: version.companion,
      features,
      responses: {
        lockouts: () => ({ ...lockouts(lockoutState), features }),
        recovery: { ...recovery(features), companion: version.companion, live_destination: version.companion === 'ready' },
      },
      replies: { lockouts: { status: 200, json: { status: 'sent', message: 'Removed. Aranel can enter again.' } } },
    });
    await openCase(page);
    const banner = page.getByText('This game server does not have the Player Support patch');
    if (version.companion === 'missing') await expect(banner).toBeVisible();
    else await expect(banner).toHaveCount(0);

    // Resolve: the in-game clear is on by default on every server; only the
    // updated patch refreshes the zones' petition lists at once.
    await page.getByRole('button', { name: 'Resolve case' }).click();
    const resolve = page.getByRole('dialog', { name: 'Resolve case' });
    const clear = resolve.getByRole('checkbox', { name: 'Also clear petition #100 in game' });
    await expect(clear).toBeChecked();
    await expect(clear).toBeEnabled();
    await expect(resolve.getByText(version.patched
      ? 'The player can file a new petition right away.'
      : 'Removes it from the database. Zones refresh their petition list on the next petition.')).toBeVisible();
    await resolve.getByRole('button', { name: 'Cancel' }).click();
    await expect(resolve).toHaveCount(0);

    // Lockouts: in game needs the updated patch; offline works everywhere.
    await page.getByRole('button', { name: 'Quests & progress' }).click();
    const progress = page.getByRole('dialog', { name: 'Quests & progress · Aranel' });
    await progress.getByRole('button', { name: 'Lockouts', exact: true }).click();
    const remove = progress.getByRole('button', { name: /Remove lockout Veeshan’s Peak/ });
    if (version.patched) {
      await expect(progress.getByText('Aranel is in game: changes apply in game.')).toBeVisible();
      await expect(remove).toBeEnabled();
    } else {
      await expect(progress.getByText('In game. Changing this in game needs the updated Player Support patch.')).toBeVisible();
      await expect(remove).toBeDisabled();
    }
    lockoutState = 'offline';
    await progress.getByRole('button', { name: 'Refresh' }).click();
    await expect(progress.getByText('Aranel is offline: changes are saved to the database.')).toBeVisible();
    await remove.click();
    await progress.getByLabel(reasonField).fill('Lockout from a crashed raid');
    await progress.getByRole('button', { name: 'Remove lockout', exact: true }).click();
    await expect(progress.getByRole('status')).toHaveText('Removed. Aranel can enter again.');
    expect(writes.filter(item => item.path === 'lockouts')).toHaveLength(1);
    await progress.getByText('Close', { exact: true }).click();
    await expect(progress).toHaveCount(0);

    // Corpse experience: only the updated patch restores it.
    await page.getByRole('button', { name: 'Corpses', exact: true }).click();
    const recoveryDialog = page.getByRole('dialog', { name: 'Aranel · Recovery' });
    await expect(recoveryDialog.getByText('Experience: 54,321')).toBeVisible();
    const restore = recoveryDialog.getByRole('button', { name: 'Restore experience' });
    if (version.patched) {
      await expect(restore).toBeEnabled();
    } else {
      await expect(restore).toBeDisabled();
      await expect(recoveryDialog.getByText('Needs the updated Player Support patch', { exact: true })).toBeVisible();
    }
  });
}
