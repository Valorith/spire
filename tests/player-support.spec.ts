import { expect, Page, test } from '@playwright/test';

const submitted = 1794116400;
const endpoint = '/api/v1/player-support/cases';
const caseKey = '731-' + submitted;

async function mockSupport(page: Page, write: string[], connection = { id: 7 }, overrides: Record<string, unknown> = {}) {
  const record: Record<string, any> = {
    key: caseKey, petition_id: 100, character_id: 100, character: 'Aranel', account: 'norrathguide',
    zone: 'sebilis', message: 'My Fungi Tunic disappeared after a trade.', urgency: 2, submitted_at: submitted,
    status: 'open', owner: '', mine: false, native_open: true, checked_out: false, revision: 0, account_presence: 'online',
    category: '', suggested_category: '', escalated: false, subject_character: '', age_state: 'fresh', follow_up: false, viewers: [], account_notes: 0,
  };
  Object.assign(record, overrides);
  const otherCase = {
    ...record, key: '730-' + submitted, character: 'Thornwick', account_presence: 'offline',
    messages_on: true, last_reply_at: '2026-11-08T12:00:00Z', ...(overrides.otherCase as object || {}),
  };
  const activity: object[] = [];
  const messages: object[] = [];
  const location = { zone_id: 89, instance_id: 0, zone_name: 'Old Sebilis', x: 3, y: -52, z: 5 };
  const corpses = [
    { id: 42, location: { ...location, instance_id: 8 }, time_of_death: '2026-11-08T12:34:00Z', item_count: 1, rezzable: true, platinum: 14 },
    { id: 17, location, time_of_death: '2026-11-07T15:12:00Z', item_count: 0, buried: true, rezzed: true },
  ];
  // A stock World answers without the Player Support patch.
  const companion = (overrides.companion as string) || 'ready';
  const history = (overrides.history as object[]) || [];
  const replies: { id: number; title: string; body: string; resolves?: boolean }[] = (overrides.replies as typeof replies) || [];
  const settings = { available: true, discord_webhook_id: 0, webhooks: [{ id: 4, name: 'gm-alerts' }] };
  const filedAt = submitted;
  const events = [
    { id: 91, character_id: 100, character: 'Aranel', zone_id: 89, event_type_id: 27, event_type_name: 'Trade',
      event_data: JSON.stringify({ character_1_id: 100, character_2_id: 101, character_1_give_items: [], character_2_give_items: [], character_1_give_money: {}, character_2_give_money: {} }),
      created_at: new Date((filedAt - 600) * 1000).toISOString() },
    { id: 92, character_id: 102, character: 'Thornalt', zone_id: 89, event_type_id: 9, event_type_name: 'Item Destroy',
      event_data: JSON.stringify({ item_id: 2730, item_name: 'Fungus Covered Scale Tunic', charges: 1, reason: 'Client Destroy' }),
      created_at: new Date((filedAt + 300) * 1000).toISOString() },
  ];
  const tunic = { id: 2730, name: 'Fungus Covered Scale Tunic', icon: 590, stackable: 0, stack_size: 1 };
  // Workflow: staff list, account notes, presence, batch results and the in-game close.
  const staff = [{ id: 2, name: 'Guide' }, { id: 5, name: 'Pat' }, { id: 6, name: 'Valorith' }];
  const notes: { id: number; text: string; author: string; created_at: string }[] = (overrides.notes as typeof notes) || [];
  const viewers = (overrides.viewers as object[]) || [];
  const features = (overrides.features as object) || { patch: 2 };
  const batchErrors = (overrides.batchErrors as Record<string, string>) || {};
  const summary = { active: 2, urgent: 2, unassigned: 1, waiting: 0, mine: 0, attention: 0, overdue: 0, follow_up: 0, escalated: 0, ...(overrides.summary as object || {}) };
  record.account_notes = notes.length;
  let active = false;
  const writes: { path: string; connection: string | null; input: Record<string, unknown> }[] = [];
  await page.addInitScript(() => localStorage.setItem(`spire-web-access-token-${location.host}`, 'test-session'));
  await page.route('**/api/v1/**', route => route.fulfill({ json: [] }));
  await page.routeWebSocket('**/api/v1/websocket*', () => {});
  await page.route('https://api.github.com/**', route => route.abort());
  await page.route('**/api/v1/app/env', route => route.fulfill({ json: { data: {
    env: 'desktop', version: '5.8.0', os: 'windows', is_spire_initialized: true,
    features: {}, settings: [{ setting: 'AUTH_ENABLED', value: 'true' }],
  } } }));
  await page.route('**/api/v1/me', route => route.fulfill({ json: { id: 2, user_name: 'Guide', provider: 'local', is_admin: false } }));
  await page.route('**/api/v1/permissions/me', route => route.fulfill({ json: {
    connection_id: 7, read_all: false, write_all: false, read: ['player-support', 'mail-parcels-editor', 'player-operations', 'player_event_logs'], write,
  } }));
  await page.route('**/api/v1/player-operations/lookup/zones?*', route => route.fulfill({ json: {
    data: [{ id: 202, version: 0, short_name: 'poknowledge', long_name: 'Plane of Knowledge' }],
  } }));
  await page.route('**/api/v1/mail-parcels-editor/items?*', route => {
    const params = new URL(route.request().url()).searchParams;
    const data = params.get('scope') === 'augment'
      ? (params.get('socket_type') === '7' ? [{ id: 2001, name: 'Rune of QA', augment_type: 64 }] : [])
      : [{ id: 2730, name: 'Fungus Covered Scale Tunic', stackable: 0, stack_size: 1, augment_slot_1_type: 7 }];
    return route.fulfill({ json: { data } });
  });
  await page.route(`**${endpoint}**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path.endsWith('/chat')) {
      if (request.method() === 'GET') return route.fulfill({ json: {
        state: record.status === 'resolved' ? 'unavailable' : companion === 'ready' ? 'ready' : 'unsupported',
        active, messages, cursor: messages.length, companion, recipient: 'Aranel',
      } });
      const input = request.postDataJSON();
      writes.push({ path, connection: url.searchParams.get('connection_id'), input });
      if (input.action === 'start') active = true;
      if (input.action === 'end') active = false;
      if (input.action === 'send') {
        active = true;
        const created_at = new Date().toISOString();
        messages.push(
          { id: 1, kind: 'chat_out', text: input.text, delivery: 'sent', created_at },
          { id: 2, kind: 'chat_in', text: 'Thanks, I found it.', created_at },
        );
      }
      return route.fulfill({ status: 204 });
    }
    // Presence is a heartbeat, not a change to the case: not recorded in writes.
    if (path.endsWith('/presence')) return route.fulfill({ json: { viewers } });
    if (path.includes('/account-notes')) {
      writes.push({ path, connection: url.searchParams.get('connection_id'), input: request.method() === 'DELETE' ? {} : request.postDataJSON() });
      if (request.method() === 'POST') {
        notes.unshift({ id: 10 + writes.length, text: request.postDataJSON().text, author: 'Guide', created_at: new Date().toISOString() });
      } else {
        const id = Number(path.split('/').pop());
        notes.splice(0, notes.length, ...notes.filter(note => note.id !== id));
      }
      record.account_notes = notes.length;
      return route.fulfill({ status: request.method() === 'POST' ? 201 : 200, json: { notes } });
    }
    if (request.method() === 'GET') {
      if (path === endpoint) {
        const filter = url.searchParams.get('filter');
        const cases = filter === 'unassigned' ? [otherCase] : filter === 'attention' ? [record] : [record, otherCase];
        return route.fulfill({ json: {
          connection_id: connection.id, cases, total: cases.length, summary, companion, features,
        } });
      }
      if (path.endsWith('/recovery')) return route.fulfill({ json: {
        character: location, corpses, local_world: true, companion, live_destination: companion === 'ready',
        bind: { zone_id: 22, instance_id: 0, zone_name: 'East Commonlands', x: 120.5, y: -310.25, z: 4 },
      } });
      if (path.endsWith('/events')) {
        const group = url.searchParams.get('group');
        // "All" has 120 zoning events, newest first, 50 per page.
        const all = Array.from({ length: 120 }, (_, i) => ({ ...events[0], id: 1000 + i, event_type_name: 'Zoning', event_type_id: 2,
          event_data: JSON.stringify({ from_zone_id: 89, to_zone_id: 22 }), created_at: new Date((filedAt + 3600 - i * 60) * 1000).toISOString() }));
        const matching = group === 'deaths' ? [] : group === '' ? all : events;
        const page = Math.min(Math.max(1, Number(url.searchParams.get('page')) || 1), Math.max(1, Math.ceil(matching.length / 50)));
        return route.fulfill({ json: {
          events: matching.slice((page - 1) * 50, page * 50), hours: Number(url.searchParams.get('hours')) || 24, group,
          filed_at: filedAt, page, page_size: 50, total: matching.length,
          newer: matching.filter(item => new Date(item.created_at).getTime() >= filedAt * 1000).length,
        } });
      }
      if (path.endsWith('/snapshots')) return route.fulfill({ json: { snapshots: [{ time_index: filedAt - 7200, items: 31 }] } });
      if (/\/snapshots\/\d+$/.test(path)) return route.fulfill({ json: {
        time_index: filedAt - 7200, snapshot_items: 31, missing: [{ item: tunic, augments: [null, null, null, null, null, null], had: 1, has: 0, missing: 1 }],
      } });
      if (path.endsWith('/corpses/42')) return route.fulfill({ json: { items: [{ id: 2730, icon: 590, name: 'Fungus Covered Scale Tunic' }] } });
      return route.fulfill({ json: { case: record, activity, history, account_notes: notes, viewers, features } });
    }
    const input = request.postDataJSON();
    writes.push({ path, connection: url.searchParams.get('connection_id'), input });
    if (path.endsWith('/move')) {
      const kind = input.corpse_id ? 'corpse_move' : 'character_move';
      const status = input.to_player ? 'moved_notified' : input.corpse_id ? 'moved' : 'requested';
      const message = input.to_player ? 'Corpse moved and player notified.' : input.corpse_id ? 'Corpse moved.' : 'Move requested in game.';
      activity.push({ key: 'move-' + writes.length, kind, text: input.reason, actor: 'Guide', delivery: 'sent', created_at: new Date().toISOString() });
      return route.fulfill({ json: { status, message } });
    }
    if (path.endsWith('/merge')) {
      activity.push({ key: 'merge-1', kind: 'merge', text: 'Merged case #700 (Aranel, filed Nov 1, 2026) into this case', actor: 'Guide', created_at: new Date().toISOString() });
      history.splice(0, history.length, ...history.map(item => ({ ...item, merged: true })));
      record.revision++;
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith('/parcel')) {
      activity.push({ key: 'delivery-981', kind: 'parcel', text: 'Fungus Covered Scale Tunic × 1', receipt: [42], actor: 'Guide', created_at: new Date().toISOString() });
      return route.fulfill({ status: 201, json: {
        audit_id: 981, character_name: record.character, parcel_count: 1,
        deliveries: [{ parcel: { id: 42, item_name: 'Fungus Covered Scale Tunic', slot_id: 1 }, player_event_log_id: 58 }],
      } });
    }
    if (path.endsWith('/reply')) {
      activity.push({ key: 'delivery-reply-' + writes.length, kind: 'reply', text: input.subject, actor: 'Guide', created_at: new Date().toISOString() });
      return route.fulfill({ status: 201, json: { audit_id: 982 } });
    }
    if (input.revision !== undefined && input.revision !== record.revision) {
      return route.fulfill({ status: 409, json: { error: 'The case changed. Refresh it before trying again.' } });
    }
    const entry = (kind: string, text: string) => activity.push({ key: kind + '-' + writes.length, kind, text, actor: 'Guide', created_at: new Date().toISOString() });
    let petition = null;
    if (input.action === 'resolve') {
      record.status = 'resolved';
      record.escalated = false;
      active = false;
      if (input.close_in_game) {
        petition = { status: 'closed', message: 'Removed from the in-game queue. The player can file a new petition.' };
        entry('petition_close', 'Cleared petition #100 in game\n' + petition.message);
      }
    } else if (input.action === 'reopen') {
      record.status = 'open';
    } else if (input.action === 'claim' || input.action === 'take') {
      if (input.action === 'take') entry('take', record.owner ? 'Took over the case from ' + record.owner : 'Took the case');
      record.owner = 'Guide';
      record.mine = true;
    } else if (input.action === 'assign') {
      const member = staff.find(item => item.id === input.assignee_id);
      record.owner = member ? member.name : '';
      record.mine = Boolean(member && member.id === 2);
      entry('assign', member ? 'Assigned the case to ' + member.name : 'Unassigned the case');
    } else if (input.action === 'escalate' || input.action === 'deescalate') {
      record.escalated = input.action === 'escalate';
      entry(input.action, (record.escalated ? 'Escalated the case' : 'Cleared the escalation') + (input.text ? '\n' + input.text : ''));
    } else if (input.action === 'categorize') {
      record.category = input.category;
      record.suggested_category = '';
      entry('categorize', 'Category: ' + input.category);
    } else if (input.action === 'subject') {
      record.subject_character = input.subject;
    }
    record.revision++;
    return petition ? route.fulfill({ json: { petition } }) : route.fulfill({ status: 204 });
  });
  await page.route('**/api/v1/player-support/staff**', route => route.fulfill({ json: { staff } }));
  await page.route('**/api/v1/player-support/batch**', async route => {
    const input = route.request().postDataJSON();
    writes.push({ path: '/batch', connection: new URL(route.request().url()).searchParams.get('connection_id'), input });
    return route.fulfill({ json: { results: input.cases.map((item: { key: string }) => batchErrors[item.key]
      ? { key: item.key, ok: false, error: batchErrors[item.key] } : { key: item.key, ok: true }) } });
  });
  await page.route('**/api/v1/player-support/replies**', async route => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: { replies } });
    const input = request.postDataJSON();
    writes.push({ path: new URL(request.url()).pathname, connection: null, input });
    if (request.method() === 'POST') {
      replies.push({ id: replies.length + 1, ...input });
      return route.fulfill({ status: 201, json: replies[replies.length - 1] });
    }
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/v1/player-support/settings**', async route => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: settings });
    const input = request.postDataJSON();
    writes.push({ path: '/settings', connection: null, input });
    settings.discord_webhook_id = input.discord_webhook_id;
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/v1/player-support/metrics**', route => route.fulfill({ json: {
    days: 30, filed: 12, resolved: 9, merged: 1, responded: 11, first_response_minutes: 14, resolve_minutes: 190,
    staff: [{ name: 'Guide', responses: 15, resolved: 7 }, { name: 'Valorith', responses: 4, resolved: 2 }],
  } }));
  return writes;
}

test('claims a petition and delivers a reviewed parcel to its fixed recipient', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'mail-parcels-editor']);
  await page.goto('/admin/player-support');
  await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Claim case' }).click();
  await expect(page.getByRole('button', { name: 'Release' })).toBeVisible();
  await page.getByRole('button', { name: 'Send parcel', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Send parcel' });
  await expect(dialog.getByText('Aranel', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Recipient character')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Choose an item' }).click();
  const picker = page.getByRole('dialog', { name: 'Choose item' });
  await picker.getByLabel('Search items').fill('fungus');
  await picker.getByRole('button', { name: /Fungus Covered Scale Tunic/ }).click();
  await dialog.getByRole('button', { name: /Empty socket Type 7/ }).click();
  await picker.getByLabel('Search augments').fill('rune');
  await picker.getByRole('button', { name: /Rune of QA/ }).click();
  const reason = dialog.getByLabel('Reason for delivery');
  const review = dialog.getByRole('button', { name: 'Review 1 parcel' });
  const desktopViewport = page.viewportSize()!;
  await reason.fill('test');
  await page.setViewportSize({ width: 390, height: 480 });
  await expect(review).toBeInViewport();
  await review.click();
  await expect(dialog.getByRole('alert')).toContainText('Use at least 8 characters.');
  await expect(reason).toBeFocused();
  await expect(dialog.getByRole('checkbox', { name: 'Confirm delivery' })).toHaveCount(0);
  await reason.fill('Verified missing from trade logs');
  await review.click();
  await expect(dialog.getByText('Rune of QA', { exact: true })).toBeVisible();
  const send = dialog.getByRole('button', { name: 'Send parcels' });
  await expect(send).toBeDisabled();
  await dialog.getByRole('checkbox', { name: 'Confirm delivery' }).check();
  await send.click();
  await expect(dialog.getByRole('status')).toContainText('1 separate parcel queued for Aranel');
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await page.setViewportSize(desktopViewport);
  await expect(page.getByText('Parcel queued for delivery')).toBeVisible();
  await expect(page.getByText('Receipt #42')).toBeVisible();
  expect(writes).toHaveLength(2);
  expect(writes[0]).toMatchObject({ connection: '7', input: { action: 'claim', revision: 0 } });
  expect(writes[1]).toMatchObject({
    path: `${endpoint}/${caseKey}/parcel`, connection: '7',
    input: { confirmation: 'SEND 1 PARCEL TO Aranel', items: [{ item_id: 2730, quantity: 1, augment_1: 2001 }], request_id: expect.stringMatching(/^[a-f0-9]{32}$/) },
  });
  expect(writes[1].input).not.toHaveProperty('character_id');
});

test('support writers without delivery permission can work cases but cannot send', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await expect(page.getByRole('button', { name: 'Claim case' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reply by mail' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Send parcel', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Move character' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Corpses', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Fungus Covered Scale Tunic')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Move corpse' })).toHaveCount(0);
});

test('shows a clear recovery error when the frontend is ahead of the server', async ({ page }) => {
  await mockSupport(page, ['player-support', 'player-operations']);
  await page.route(`**${endpoint}/${caseKey}/recovery?*`, route => route.fulfill({
    status: 422, json: { error: 'Stat frontend/dist/index.html: no such file or directory' },
  }), { times: 1 });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Move character' }).click();
  const dialog = page.getByRole('dialog', { name: 'Aranel · Recovery' });
  await expect(dialog.getByRole('alert')).toHaveText('Recovery is unavailable on this Spire server.');
  await dialog.getByRole('button', { name: 'Refresh locations' }).click();
  await expect(dialog.getByRole('heading', { name: 'Last saved location' })).toBeVisible();
});

test('moves the petition character and a selected unburied corpse with separate receipts', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'player-operations']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Move character' }).click();
  const dialog = page.getByRole('dialog', { name: 'Aranel · Recovery' });
  const moveCharacter = dialog.getByRole('button', { name: 'Move character' });
  await expect(dialog.getByText('Safe point')).toBeVisible();
  await expect(moveCharacter).toBeDisabled();
  await dialog.getByLabel('Reason for move').fill('Stuck');
  await moveCharacter.click();
  await expect(dialog.getByRole('alert')).toHaveText('Use 8 to 240 characters for the reason.');
  await dialog.getByLabel('Reason for move').fill('Player is stuck in geometry');
  await moveCharacter.click();
  await expect(dialog.getByRole('status')).toHaveText('Move requested in game.');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('heading', { name: /Character move/ })).toBeVisible();

  await page.getByRole('button', { name: 'Corpses', exact: true }).click();
  await expect(dialog.getByText('Fungus Covered Scale Tunic')).toBeVisible();
  await expect(dialog.getByText('14 pp')).toBeVisible();
  await expect(dialog.getByText('Instance #8')).toBeVisible();
  await dialog.getByRole('button', { name: /#17/ }).click();
  await expect(dialog.getByText('Resurrected')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Move corpse' })).toHaveCount(0);
  await dialog.getByRole('button', { name: /#42/ }).click();
  await dialog.getByRole('button', { name: 'Change zone' }).click();
  await dialog.getByLabel('Search zones').fill('knowledge');
  await dialog.getByRole('button', { name: /Plane of Knowledge/ }).click();
  await dialog.getByLabel('Reason for move').fill('Recover a corpse from a closed instance');
  await page.setViewportSize({ width: 390, height: 650 });
  const moveCorpse = dialog.getByRole('button', { name: 'Move corpse' });
  await expect(moveCorpse).toBeInViewport();
  await moveCorpse.click();
  await expect(dialog.getByRole('status')).toHaveText('Corpse moved.');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('heading', { name: /Corpse move/ })).toBeVisible();
  expect(writes).toHaveLength(2);
  expect(writes[0]).toMatchObject({ path: `${endpoint}/${caseKey}/move`, connection: '7', input: { corpse_id: 0, source_zone: 89, source_instance: 0, destination: 89 } });
  expect(writes[1]).toMatchObject({ path: `${endpoint}/${caseKey}/move`, connection: '7', input: { corpse_id: 42, source_zone: 89, source_instance: 8, destination: 202, request_id: expect.stringMatching(/^[a-f0-9]{32}$/) } });
});

test('moves the character to exact coordinates or to another player', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'player-operations']);
  await page.route('**/api/v1/player-operations/lookup/characters?*', route => route.fulfill({ json: { data: [
    { id: 100, name: 'Aranel', level: 50, zone_id: 89, zone_name: 'Old Sebilis', online: true },
    { id: 205, name: 'Thornwick', level: 60, zone_id: 202, zone_name: 'Plane of Knowledge', online: true },
  ] } }));
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Move character' }).click();
  const dialog = page.getByRole('dialog', { name: 'Aranel · Recovery' });
  const moveCharacter = dialog.getByRole('button', { name: 'Move character' });

  await dialog.getByRole('button', { name: 'Coordinates' }).click();
  await expect(dialog.getByLabel('X coordinate')).toHaveValue('3');
  await dialog.getByLabel('Paste a /loc result').fill('Your Location is 120.5, -45.25, 3.1');
  await expect(dialog.getByLabel('X coordinate')).toHaveValue('-45.25');
  await expect(dialog.getByLabel('Y coordinate')).toHaveValue('120.5');
  await dialog.getByLabel('Heading').fill('600');
  await dialog.getByLabel('Reason for move').fill('Player is stuck under the floor');
  await expect(moveCharacter).toBeDisabled();
  await dialog.getByLabel('Heading').fill('128');
  await moveCharacter.click();
  await expect(dialog.getByRole('status')).toHaveText('Move requested in game.');
  await dialog.getByRole('button', { name: 'Done' }).click();

  await page.getByRole('button', { name: 'Move character' }).click();
  await dialog.getByRole('button', { name: 'Player', exact: true }).click();
  await dialog.getByLabel('Search characters').fill('th');
  await expect(dialog.getByRole('button', { name: /Aranel/ })).toHaveCount(0);
  await dialog.getByRole('button', { name: /Thornwick/ }).click();
  await expect(dialog.getByText(/Live location · Plane of Knowledge/)).toBeVisible();
  await dialog.getByLabel('Reason for move').fill('Join the guide for an escort');
  await moveCharacter.click();
  await expect(dialog.getByRole('status')).toHaveText('Move requested in game.');

  expect(writes).toHaveLength(2);
  expect(writes[0].input).toMatchObject({ corpse_id: 0, destination: 89, coordinates: { x: -45.25, y: 120.5, z: 3.1, heading: 128 } });
  expect(writes[1].input).toMatchObject({ corpse_id: 0, destination: 0, target_character: 205, to_player: false });
});

test('moves a corpse to the player and shows the notice receipt', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'player-operations']);
  await page.route(`**${endpoint}/${caseKey}/move?*`, route => route.fulfill({
    status: 409, json: { error: 'The petitioning character must be in game to move a corpse to their location.' },
  }), { times: 1 });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Corpses', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Aranel · Recovery' });
  await dialog.getByRole('button', { name: 'Player’s current location' }).click();
  await expect(dialog.getByText('Aranel’s current location')).toBeVisible();
  await dialog.getByLabel('Reason for move').fill('Bring the corpse to the player');
  const submit = dialog.getByRole('button', { name: 'Move corpse' });
  await submit.click();
  await expect(dialog.getByRole('alert')).toContainText('The petitioning character must be in game');
  await submit.click();
  await expect(dialog.getByRole('status')).toHaveText('Corpse moved and player notified.');
  expect(writes[0].input).toMatchObject({ to_player: true, destination: 0, corpse_id: 42, source_instance: 8 });
});

test('shows account presence and enables petition messages on the first Game Master tell', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await page.goto('/admin/player-support');
  await expect(page.getByRole('button', { name: /^Aranel / }).getByText('Online', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Thornwick / }).getByText('Offline', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Live chat', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Messages off' })).toBeVisible();
  await page.getByLabel('Tell Aranel').fill('Your parcel is 100% ready.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  await expect(transcript.getByText('Game Master', { exact: true })).toBeVisible();
  await expect(transcript.getByText('Thanks, I found it.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Messages on' })).toBeVisible();
  await page.getByRole('button', { name: 'Turn off messages' }).click();
  await expect(page.getByRole('heading', { name: 'Messages off' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enable messages' })).toBeVisible();
  await expect(page.getByLabel('Tell Aranel')).toBeEnabled();
  await expect(transcript.getByText('Thanks, I found it.')).toBeVisible();
  expect(writes.map(write => write.input.action)).toEqual(['send', 'end']);
  expect(writes[0]).toMatchObject({
    connection: '7', input: { text: 'Your parcel is 100% ready.', request_id: expect.stringMatching(/^[a-f0-9]{32}$/) },
  });
});

test('messages the player on any character of the petitioning account', async ({ page }) => {
  await mockSupport(page, ['player-support'], { id: 7 }, { character_presence: 'offline', online_character: 'Bramble' });
  const messages = [
    { id: 1, kind: 'chat_out', actor: 'Guide', recipient: 'Bramble', text: 'Hello from the GM team.', delivery: 'sent', created_at: '2026-11-08T12:00:00Z' },
    { id: 2, kind: 'chat_in', actor: 'Bramble', text: 'Replying from my alt.', created_at: '2026-11-08T12:01:00Z' },
  ];
  await page.route(`**${endpoint}/${caseKey}/chat?*`, route => route.request().method() === 'GET'
    ? route.fulfill({ json: { state: 'ready', active: true, recipient: 'Bramble', cursor: 2, messages } })
    : route.fallback());
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeVisible();
  await expect(page.getByText('On Bramble')).toBeVisible();
  await expect(page.getByText('Playing now')).toBeVisible();
  await page.getByRole('button', { name: 'Live chat', exact: true }).click();
  await expect(page.getByText(/playing Bramble, so tells go there/)).toBeVisible();
  await expect(page.getByLabel('Tell Bramble')).toBeEnabled();
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  await expect(transcript.getByText('to Bramble')).toBeVisible();
  await expect(transcript.getByText('Replying from my alt.')).toBeVisible();
  await expect(transcript.getByText('alt', { exact: true })).toHaveCount(2);
});

test('mails a Game Master message when no character on the account is in game', async ({ page }) => {
  await mockSupport(page, ['player-support'], { id: 7 }, { character_presence: 'offline', account_presence: 'offline' });
  const messages: object[] = [];
  const sends: Record<string, unknown>[] = [];
  await page.route(`**${endpoint}/${caseKey}/chat?*`, route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: { state: 'offline', active: messages.length > 0, mail_to: 'Aranel', cursor: messages.length, messages } });
    }
    const input = route.request().postDataJSON();
    sends.push(input);
    messages.push({ id: 1, kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: input.text, delivery: 'mail', created_at: new Date().toISOString() });
    return route.fulfill({ status: 204 });
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Live chat', exact: true }).click();
  await expect(page.getByText(/Messages you send now are mailed to Aranel/)).toBeVisible();
  await expect(page.getByText(/This message was sent to you in response to your petition while you were offline/)).toBeVisible();
  await page.getByLabel('Mail Aranel').fill('Your tunic is waiting at the parcel merchant.');
  await page.getByRole('button', { name: 'Send as mail' }).click();
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  await expect(transcript.getByText('Your tunic is waiting at the parcel merchant.')).toBeVisible();
  await expect(transcript.getByText('Sent by mail')).toBeVisible();
  expect(sends[0]).toMatchObject({ action: 'send', text: 'Your tunic is waiting at the parcel merchant.', request_id: expect.stringMatching(/^[a-f0-9]{32}$/) });
});

test('turns off patch-only tools when the game server lacks the Player Support patch', async ({ page }) => {
  await mockSupport(page, ['player-support', 'mail-parcels-editor', 'player-operations'], { id: 7 }, { companion: 'missing' });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await expect(page.getByRole('note').filter({ hasText: 'does not have the Player Support patch' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Move character' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Reply by mail' })).toBeEnabled();

  await page.getByRole('button', { name: 'Corpses' }).click();
  const recovery = page.locator('.modal.show');
  await expect(recovery.getByText('Moves need the Player Support patch on World and zones')).toBeVisible();
  await expect(recovery.getByRole('button', { name: /^Move corpse/ })).toHaveCount(0);
  await recovery.locator('.recovery-footer').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(recovery).toHaveCount(0);

  await page.getByRole('button', { name: 'Open live chat' }).click();
  await expect(page.getByRole('heading', { name: 'Needs the server patch' })).toBeVisible();
  await expect(page.getByText('Aranel is in game, but World does not have the Player Support patch')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enable messages' })).toBeDisabled();
  await expect(page.getByLabel('Tell Aranel')).toHaveCount(0);
});

test('summarizes the queue, flags new replies, and offers quick text', async ({ page }) => {
  await mockSupport(page, ['player-support', 'mail-parcels-editor']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const summary = page.getByRole('group', { name: 'Queue at a glance' });
  await expect(summary.getByText('Urgent')).toBeVisible();
  const thornwick = page.getByRole('button', { name: /^Thornwick / });
  await expect(thornwick.getByText('New', { exact: true })).toBeVisible();
  await expect(thornwick.getByText('Live', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Live chat', exact: true }).click();
  await page.getByRole('group', { name: 'Quick replies' }).getByRole('button', { name: 'Can you tell me more about what happened?' }).click();
  await expect(page.getByLabel('Tell Aranel')).toHaveValue('Can you tell me more about what happened?');

  await page.getByRole('button', { name: 'Reply by mail' }).click();
  await page.getByRole('group', { name: 'Message templates' }).getByRole('button', { name: /Need details/ }).click();
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue(/^Hi Aranel,/);
  await page.keyboard.press('Escape');

  await summary.getByRole('button', { name: /Unassigned/ }).click();
  await expect(page.getByRole('button', { name: /^Thornwick / })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Aranel / })).toHaveCount(0);
});

test('keeps a new reply flagged until the case is on screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSupport(page, ['player-support'], { id: 7 }, { last_reply_at: '2026-11-08T12:00:00Z' });
  await page.goto('/admin/player-support');
  const aranel = page.getByRole('button', { name: /^Aranel / });
  await expect(aranel.getByText('New', { exact: true })).toBeVisible();
  await aranel.click();
  await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Petitions', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Aranel / }).getByText('New', { exact: true })).toHaveCount(0);
});

test('keeps the queue summary current on the resolved list', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  await page.goto('/admin/player-support');
  const summary = page.getByRole('group', { name: 'Queue at a glance' });
  await expect(summary.getByText('Urgent')).toBeVisible();
  await page.getByRole('group', { name: 'Filter petitions' }).getByRole('button', { name: 'Resolved' }).click();
  await expect(summary).toBeVisible();
  await expect(summary.getByRole('button', { name: /Active/ })).toHaveAttribute('aria-pressed', 'false');
});

test('refreshes live chat immediately when a case is resolved or reopened', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  await page.goto('/admin/player-support');
  await page.getByRole('button', { name: 'Live chat', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Tell Aranel' })).toBeEnabled();
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  await page.getByRole('dialog', { name: 'Resolve case' }).getByRole('button', { name: 'Resolve case' }).click();
  await expect(page.getByRole('heading', { name: 'Live chat unavailable' })).toBeVisible({ timeout: 2500 });
  await page.getByRole('button', { name: 'Reopen', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Tell Aranel' })).toBeEnabled({ timeout: 2500 });
});

test('dismisses a pending resolution when the active server changes', async ({ page }) => {
  const connection = { id: 7 };
  const writes = await mockSupport(page, ['player-support'], connection);
  await page.clock.install();
  await page.goto('/admin/player-support');
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  await expect(dialog).toBeVisible();
  connection.id = 8;
  await page.clock.fastForward(12000);
  await expect(dialog).toBeHidden();
  expect(writes).toHaveLength(0);
});

test('shows the account’s events around the petition as evidence', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  const evidence = page.getByRole('region', { name: 'Evidence' });
  await expect(evidence.getByText('Item Destroy')).toBeVisible();
  await expect(evidence.getByText('Thornalt · alt')).toBeVisible();
  await expect(evidence.getByText('5m after')).toBeVisible();
  await expect(evidence.getByRole('separator')).toContainText('Petition filed');
  await expect(evidence.getByRole('navigation', { name: 'Event pages' })).toHaveCount(0);
  await evidence.getByRole('button', { name: 'All', exact: true }).click();
  const pager = evidence.getByRole('navigation', { name: 'Event pages' });
  await expect(pager).toContainText('Page 1 of 3 · 1–50 of 120');
  await expect(evidence.getByRole('button', { name: 'Newer' })).toBeDisabled();
  await expect(evidence.locator('.evidence-row')).toHaveCount(50);
  await evidence.getByRole('button', { name: 'Older' }).click();
  await expect(pager).toContainText('Page 2 of 3 · 51–100 of 120');
  // The petition was filed 60 events in, so its marker is on page 2.
  await expect(evidence.getByRole('separator')).toContainText('Petition filed');
  await evidence.getByRole('button', { name: 'Older' }).click();
  await expect(pager).toContainText('Page 3 of 3 · 101–120 of 120');
  await expect(evidence.getByRole('separator')).toHaveCount(0);
  await expect(evidence.locator('.evidence-row')).toHaveCount(20);
  await evidence.getByRole('button', { name: 'Deaths' }).click();
  await expect(evidence.getByText('No events in this window')).toBeVisible();
  await expect(page.getByLabel('Private staff note')).toHaveCount(0);
});

test('restores items missing since an inventory snapshot through a reviewed parcel', async ({ page }) => {
  await mockSupport(page, ['player-support', 'mail-parcels-editor', 'player-operations']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Inventory snapshots' }).click();
  const snapshots = page.locator('.modal.show');
  await expect(snapshots.getByText('1 item is missing')).toBeVisible();
  await snapshots.getByRole('checkbox').check();
  await snapshots.getByRole('button', { name: /Restore 1 as parcels/ }).click();
  const composer = page.locator('.modal.show').filter({ hasText: 'Reason for delivery' });
  await expect(composer.getByText('Fungus Covered Scale Tunic')).toBeVisible();
  await expect(composer.getByLabel('Reason for delivery')).toHaveValue(/inventory snapshot \(case #731\)/);
});

test('offers bind point and safe point as quick move destinations', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'player-operations']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Move character' }).click();
  const recovery = page.locator('.modal.show');
  await recovery.getByRole('group', { name: 'Quick destinations' }).getByRole('button', { name: /Bind point/ }).click();
  await expect(recovery.locator('.recovery-destination strong')).toHaveText('East Commonlands');
  await expect(recovery.getByLabel('X coordinate')).toHaveValue('120.5');
  await recovery.getByLabel('Reason for move').fill('Stuck in geometry, sent home to bind');
  await recovery.getByRole('button', { name: 'Move character', exact: true }).click();
  await expect.poll(() => writes.find(write => write.path.endsWith('/move'))?.input).toMatchObject({
    destination: 22, coordinates: { x: 120.5, y: -310.25, z: 4 },
  });
});

test('lists the account history and merges an earlier case into the open one', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support'], { id: 7 }, { history: [
    { key: '700-1793900000', character: 'Aranel', status: 'resolved', message: 'Lost my tunic last week', submitted_at: 1793900000,
      merged: false, resolution: 'Sent a replacement tunic', native_open: false },
  ] });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const history = page.getByRole('region', { name: 'Account history' });
  await expect(history.getByText('Sent a replacement tunic')).toBeVisible();
  await history.getByRole('button', { name: 'Merge case 700 into this case' }).click();
  await page.locator('.modal.show').getByRole('button', { name: 'Merge cases' }).click();
  await expect.poll(() => writes.find(write => write.path.endsWith('/merge'))?.input).toMatchObject({ source: '700-1793900000' });
  await expect(page.getByText('Cases merged')).toBeVisible();
  await expect(history.getByText('Merged')).toBeVisible();
});

test('shares saved replies as quick replies and manages them', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'mail-parcels-editor'], { id: 7 }, { replies: [
    { id: 1, title: 'Parcel ready', body: 'Hi {character}, your item is at the parcel merchant.' },
  ] });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Live chat', exact: true }).click();
  await page.getByRole('group', { name: 'Quick replies' }).getByRole('button', { name: 'Parcel ready' }).click();
  await expect(page.getByLabel('Tell Aranel')).toHaveValue('Hi Aranel, your item is at the parcel merchant.');

  await page.getByRole('button', { name: 'Saved replies' }).click();
  const manager = page.locator('.modal.show');
  await manager.getByLabel('Title').fill('Need details');
  await manager.getByRole('textbox', { name: /^Reply/ }).fill('Can you tell me which zone you were in?');
  await manager.getByRole('button', { name: 'Add reply' }).click();
  await expect.poll(() => writes.find(write => write.path.endsWith('/replies'))?.input).toMatchObject({ title: 'Need details' });
});

test('sets petition alerts and shows support insights', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Petition alerts' }).click();
  const alerts = page.locator('.modal.show');
  await alerts.getByRole('checkbox', { name: /Sound/ }).check();
  await alerts.getByLabel('Discord channel').selectOption({ label: 'gm-alerts' });
  await alerts.getByRole('button', { name: 'Save Discord channel' }).click();
  await expect(alerts.getByText('Saved')).toBeVisible();
  expect(writes.find(write => write.path === '/settings')?.input).toMatchObject({ discord_webhook_id: 4 });
  expect(await page.evaluate(() => localStorage.getItem('spire-player-support-alerts'))).toContain('"sound":true');
  await alerts.getByRole('button', { name: 'Done' }).click();

  await page.getByRole('button', { name: 'Support insights' }).click();
  const insights = page.locator('.modal.show');
  await expect(insights.getByText('14 min')).toBeVisible();
  await expect(insights.getByRole('row', { name: /Valorith/ })).toBeVisible();
});

test('resolves and clears the in-game petition by default, or leaves it when unticked', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  const close = dialog.getByRole('checkbox', { name: 'Also clear petition #100 in game' });
  await expect(close).toBeChecked();
  await expect(dialog.getByText('Removes it from the database. Zones refresh their petition list on the next petition.')).toBeVisible();
  await expect(dialog.getByText(/in-game after resolving it here/)).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Resolve case' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Removed from the in-game queue. The player can file a new petition.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /In-game petition/ })).toBeVisible();
  expect(writes.find(write => write.input.action === 'resolve')?.input).toMatchObject({ close_in_game: true });

  await page.getByRole('button', { name: 'Reopen', exact: true }).click();
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  await close.uncheck();
  await dialog.getByRole('button', { name: 'Resolve case' }).click();
  await expect(dialog).toBeHidden();
  expect(writes.filter(write => write.input.action === 'resolve')[1].input).toMatchObject({ close_in_game: false });
});

test('cannot clear a petition that is checked out in game', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support'], { id: 7 }, { checked_out: true, last_gm: 'Valorith' });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  const close = dialog.getByRole('checkbox', { name: 'Also clear petition #100 in game' });
  await expect(close).toBeDisabled();
  await expect(close).not.toBeChecked();
  await expect(dialog.getByText('Checked out in game by Valorith; clear it there.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Resolve case' }).click();
  await expect(dialog).toBeHidden();
  expect(writes[0].input).toMatchObject({ action: 'resolve', close_in_game: false });
});

test('takes over a case, assigns it from the staff list, and escalates it', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support'], { id: 7 }, { owner: 'Valorith' });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Take over' }).click();
  await expect(page.getByRole('button', { name: 'Release' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Took over/ })).toBeVisible();

  await page.getByRole('button', { name: 'Change assignee' }).click();
  const dialog = page.getByRole('dialog', { name: 'Assign case' });
  await expect(dialog.getByRole('button', { name: 'Pat' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Take it myself' })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Guide' })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Pat' }).click();
  await expect(dialog.getByRole('button', { name: 'Pat' })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Assigned the case to Pat')).toBeVisible();

  await page.getByRole('button', { name: 'Change assignee' }).click();
  await dialog.getByRole('checkbox', { name: 'Escalate to senior staff' }).check();
  const save = dialog.getByRole('button', { name: 'Save' });
  await expect(save).toBeDisabled();
  await dialog.getByLabel(/^Reason/).fill('Possible duplication exploit');
  await save.click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.support-case-meta').getByText('Escalated', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Aranel / }).getByText('Escalated', { exact: true })).toBeVisible();
  expect(writes.map(write => write.input.action)).toEqual(['take', 'assign', 'escalate']);
  expect(writes[1].input).toMatchObject({ assignee_id: 5, revision: 1 });
  expect(writes[2].input).toMatchObject({ text: 'Possible duplication exploit', revision: 2 });
});

test('applies the suggested category and opens its tool from the hint', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support'], { id: 7 }, { suggested_category: 'corpse' });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('group', { name: 'Suggested category' }).getByRole('button', { name: 'Suggested: Corpse or death' }).click();
  const hint = page.getByRole('note').filter({ hasText: 'Find the corpse, move it to the player, or restore its experience.' });
  await expect(hint).toBeVisible();
  await expect(page.locator('.support-case-meta').getByText('Corpse or death')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Suggested category' })).toHaveCount(0);
  await hint.getByRole('button', { name: 'Corpses' }).click();
  await expect(page.getByRole('dialog', { name: 'Aranel · Recovery' })).toBeVisible();
  expect(writes[0].input).toMatchObject({ action: 'categorize', category: 'corpse' });
});

test('flags overdue and follow-up cases and filters what needs attention', async ({ page }) => {
  await mockSupport(page, ['player-support'], { id: 7 }, {
    age_state: 'overdue',
    otherCase: { status: 'waiting', age_state: 'fresh', follow_up: true },
    summary: { attention: 2, overdue: 1, follow_up: 1, waiting: 1 },
  });
  await page.goto('/admin/player-support');
  await expect(page.getByRole('button', { name: /^Aranel / }).getByText('Overdue', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Thornwick / }).getByText('Follow up', { exact: true })).toBeVisible();
  const summary = page.getByRole('group', { name: 'Queue at a glance' });
  const attention = summary.getByRole('button', { name: /Needs attention/ });
  await expect(attention.locator('strong')).toHaveText('2');
  const request = page.waitForRequest(item => item.url().includes('/player-support/cases?') && new URL(item.url()).searchParams.get('filter') === 'attention');
  await attention.click();
  await request;
  await expect(attention).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /^Thornwick / })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Aranel / })).toBeVisible();
});

test('mails a saved reply before resolving, and keeps the case open when the mail fails', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'mail-parcels-editor'], { id: 7 }, {
    character_presence: 'offline', account_presence: 'offline',
    replies: [
      { id: 1, title: 'Item restored', body: 'Hi {character}, your item is at the parcel merchant.', resolves: true },
      { id: 2, title: 'Need details', body: 'Which zone were you in?' },
    ],
  });
  await page.route(`**${endpoint}/${caseKey}/chat?*`, route => route.request().method() === 'GET'
    ? route.fulfill({ json: { state: 'offline', active: false, mail_to: 'Aranel', cursor: 0, messages: [] } })
    : route.fallback());
  await page.route(`**${endpoint}/${caseKey}/reply?*`, route => route.fulfill({ status: 503, json: { error: 'Mail delivery is unavailable right now.' } }), { times: 1 });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  const select = dialog.getByLabel('Send a saved reply first (optional)');
  await expect(select.locator('optgroup[label="Reply and resolve"] option')).toHaveText(['Item restored']);
  await expect(select.locator('optgroup[label="Saved replies"] option')).toHaveText(['Need details']);
  await select.selectOption({ label: 'Item restored' });
  await expect(dialog.getByText('Sent as a tell if Aranel is in game with messages on, otherwise by in-game mail to Aranel.')).toBeVisible();
  const send = dialog.getByRole('button', { name: 'Send and resolve' });
  await send.click();
  await expect(dialog.getByRole('alert')).toHaveText('Mail delivery is unavailable right now.');
  expect(writes.some(write => write.input.action === 'resolve')).toBe(false);
  await expect(page.getByRole('button', { name: 'Resolve case', exact: true })).toBeVisible();

  await send.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Aranel’s case resolved.')).toBeVisible();
  expect(writes.map(write => write.input.action || write.path.split('/').pop())).toEqual(['reply', 'resolve']);
  expect(writes[0].input).toMatchObject({
    subject: 'Response to your petition', body: 'Hi Aranel, your item is at the parcel merchant.', confirmation: 'SEND TO 1 CHARACTER',
    request_id: expect.stringMatching(/^[a-f0-9]{32}$/),
  });
  expect(writes[1].input).toMatchObject({ text: 'Sent saved reply: Item restored', close_in_game: true, revision: 0 });
});

async function mockOfflineReply(page: Page) {
  const writes = await mockSupport(page, ['player-support', 'mail-parcels-editor'], { id: 7 }, {
    character_presence: 'offline', account_presence: 'offline',
    replies: [{ id: 1, title: 'Item restored', body: 'Hi {character}, your item is at the parcel merchant.', resolves: true }],
  });
  await page.route(`**${endpoint}/${caseKey}/chat?*`, route => route.request().method() === 'GET'
    ? route.fulfill({ json: { state: 'offline', active: false, mail_to: 'Aranel', cursor: 0, messages: [] } })
    : route.fallback());
  return writes;
}

const unconfirmedReply = 'This reply may have reached Aranel, but its delivery was not confirmed. Check the conversation and in-game mail before sending it again.';

test('never repeats a saved reply whose delivery was not confirmed, and resolves without sending again', async ({ page }) => {
  const writes = await mockOfflineReply(page);
  const sends: string[] = [];
  await page.route(`**${endpoint}/${caseKey}/reply?*`, route => {
    sends.push(route.request().postDataJSON().request_id);
    return sends.length === 1 ? route.abort() : route.fallback();
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  const select = dialog.getByLabel('Send a saved reply first (optional)');
  await select.selectOption({ label: 'Item restored' });
  await dialog.getByRole('button', { name: 'Send and resolve' }).click();
  await expect(dialog.getByRole('alert')).toHaveText(unconfirmedReply);
  await expect(dialog.locator('.support-callout.is-warning')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Send and resolve' })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Send again and resolve' })).toBeVisible();
  expect(writes.some(write => write.input.action === 'resolve')).toBe(false);

  // Closing and reopening keeps the reply chosen and the warning up.
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  await expect(select).toHaveValue('1');
  await expect(dialog.getByRole('alert')).toHaveText(unconfirmedReply);

  // Another reply choice is a normal send; choosing this one again warns again.
  await select.selectOption({ label: 'No reply' });
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Resolve case' })).toBeVisible();
  await select.selectOption({ label: 'Item restored' });
  await expect(dialog.getByRole('alert')).toHaveText(unconfirmedReply);

  await dialog.getByRole('button', { name: 'Resolve without sending again' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Aranel’s case resolved.')).toBeVisible();
  expect(sends).toHaveLength(1);
  expect(writes.map(write => write.input.action || write.path.split('/').pop())).toEqual(['resolve']);
  expect(writes[0].input).toMatchObject({ text: 'Saved reply delivery not confirmed: Item restored', close_in_game: true });
});

test('sends an unconfirmed saved reply again only when asked, with a new request ID', async ({ page }) => {
  const writes = await mockOfflineReply(page);
  await page.route(`**${endpoint}/${caseKey}/reply?*`, route => route.fulfill({ status: 504, body: 'Gateway Timeout' }), { times: 1 });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  await dialog.getByLabel('Send a saved reply first (optional)').selectOption({ label: 'Item restored' });
  const first = page.waitForRequest(request => request.url().includes('/reply?'));
  await dialog.getByRole('button', { name: 'Send and resolve' }).click();
  const firstId = (await first).postDataJSON().request_id;
  await expect(dialog.getByRole('alert')).toHaveText(unconfirmedReply);

  await dialog.getByRole('button', { name: 'Send again and resolve' }).click();
  await expect(dialog).toBeHidden();
  expect(writes.map(write => write.input.action || write.path.split('/').pop())).toEqual(['reply', 'resolve']);
  expect(writes[0].input.request_id).toMatch(/^[a-f0-9]{32}$/);
  expect(writes[0].input.request_id).not.toBe(firstId);
  expect(writes[1].input).toMatchObject({ text: 'Sent saved reply: Item restored' });
});

test('treats the duplicate answer to a retried saved reply as sent and resolves', async ({ page }) => {
  const writes = await mockOfflineReply(page);
  const sends: string[] = [];
  await page.route(`**${endpoint}/${caseKey}/reply?*`, route => {
    sends.push(route.request().postDataJSON().request_id);
    return sends.length === 1
      ? route.fulfill({ status: 500, json: { error: 'Player Support database request failed' } })
      : route.fulfill({ status: 409, json: { error: 'This delivery was already recorded. Check case activity.' } });
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  await dialog.getByLabel('Send a saved reply first (optional)').selectOption({ label: 'Item restored' });
  const send = dialog.getByRole('button', { name: 'Send and resolve' });
  await send.click();
  await expect(dialog.getByRole('alert')).toHaveText('Player Support database request failed');
  await send.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Aranel’s case resolved.')).toBeVisible();
  expect(sends).toHaveLength(2);
  expect(sends[1]).toBe(sends[0]);
  expect(writes.map(write => write.input.action)).toEqual(['resolve']);
  expect(writes[0].input).toMatchObject({ text: 'Sent saved reply: Item restored' });
});

test('keeps batch Assign disabled until the staff list loads', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await page.route('**/api/v1/player-support/staff**', route => route.fulfill({ status: 500, json: { error: 'Player Support database request failed' } }), { times: 1 });
  await page.goto('/admin/player-support');
  await page.getByRole('button', { name: 'Select', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Select case #731, Aranel' }).check();
  await page.getByRole('group', { name: 'Selected cases' }).getByRole('button', { name: 'Assign…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Assign 1 case' });
  await expect(dialog.getByRole('alert')).toContainText('Player Support database request failed');
  await expect(dialog.getByLabel('Assign to')).toBeDisabled();
  await expect(dialog.getByRole('button', { name: 'Assign', exact: true })).toBeDisabled();

  await dialog.getByRole('button', { name: 'Try again' }).click();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await expect(dialog.getByLabel('Assign to')).toBeEnabled();
  await dialog.getByLabel('Assign to').selectOption({ label: 'Pat' });
  await dialog.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => writes.find(write => write.path === '/batch')?.input).toMatchObject({ action: 'assign', assignee_id: 5 });
});

test('shows the newest account note on the case and adds and deletes notes', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support'], { id: 7 }, { notes: [
    { id: 4, text: 'Known to exaggerate losses.', author: 'Pat', created_at: '2026-11-08T12:00:00Z' },
    { id: 3, text: 'Prefers mail over tells.', author: 'Valorith', created_at: '2026-11-01T12:00:00Z' },
  ] });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const strip = page.locator('.support-notes-strip');
  await expect(strip).toContainText('Known to exaggerate losses.');
  await expect(strip).toContainText('— Pat');
  await expect(page.getByRole('button', { name: /^Aranel / }).getByText('2 account notes')).toBeAttached();
  await strip.getByRole('button', { name: '+1 more' }).click();
  const dialog = page.getByRole('dialog', { name: 'Account notes · norrathguide' });
  await expect(dialog.getByText('Shown on every case from this account. Staff only.')).toBeVisible();
  await expect(dialog.getByText('Prefers mail over tells.')).toBeVisible();
  await dialog.getByLabel('New note').fill('Asked for a name change twice.');
  await dialog.getByRole('button', { name: 'Add note' }).click();
  await expect(dialog.getByText('Asked for a name change twice.')).toBeVisible();
  await dialog.getByRole('listitem').filter({ hasText: 'Prefers mail over tells.' }).getByRole('button', { name: 'Delete note' }).click();
  await expect(dialog.getByText('Delete this note? It is removed from every case.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(dialog.getByText('Prefers mail over tells.')).toHaveCount(0);
  expect(writes[0]).toMatchObject({ path: `${endpoint}/${caseKey}/account-notes`, connection: '7', input: { text: 'Asked for a name change twice.' } });
  expect(writes[1].path).toBe(`${endpoint}/${caseKey}/account-notes/3`);
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(strip).toContainText('Asked for a name change twice.');
});

test('shows who else is writing and asks before sending a tell over them', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support'], { id: 7 }, { viewers: [{ name: 'Pat', composing: true }] });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await expect(page.getByLabel('Petition detail').getByText('Pat is writing to the player')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Aranel / }).locator('[title="Pat is writing to the player"]')).toBeVisible();
  await page.getByRole('button', { name: 'Live chat', exact: true }).click();
  await page.getByLabel('Tell Aranel').fill('I am on it.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Another GM is on this case' });
  await expect(confirm.getByText('Pat is also writing to Aranel.')).toBeVisible();
  expect(writes).toHaveLength(0);
  await confirm.getByRole('button', { name: 'Send anyway' }).click();
  await expect(page.getByRole('log', { name: 'Chat messages' }).getByText('I am on it.')).toBeVisible();
  expect(writes[0].input).toMatchObject({ action: 'send', text: 'I am on it.' });
});

test('claims selected cases in one batch and reports each failure', async ({ page }) => {
  const otherKey = '730-' + submitted;
  const writes = await mockSupport(page, ['player-support'], { id: 7 }, { batchErrors: { [otherKey]: 'The case changed. Refresh it before trying again.' } });
  await page.goto('/admin/player-support');
  await page.getByRole('button', { name: 'Select', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Select case #731, Aranel' }).check();
  await page.getByRole('checkbox', { name: 'Select case #730, Thornwick' }).check();
  const bar = page.getByRole('group', { name: 'Selected cases' });
  await expect(bar.getByText('2 selected')).toBeVisible();
  await bar.getByRole('button', { name: 'Claim' }).click();
  const notice = page.getByRole('alert').filter({ hasText: '1 of 2 updated' });
  await expect(notice).toContainText('#730: The case changed. Refresh it before trying again.');
  await expect(bar).toHaveCount(0);
  expect(writes[0]).toMatchObject({
    path: '/batch', connection: '7',
    input: { action: 'claim', cases: [{ key: caseKey, revision: 0 }, { key: otherKey, revision: 0 }] },
  });
});

test('saves the Reply and resolve choice with a saved reply', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Saved replies' }).click();
  const manager = page.locator('.modal.show');
  await manager.getByLabel('Title').fill('Item restored');
  await manager.getByRole('textbox', { name: /^Reply/ }).fill('Hi {character}, your item is at the parcel merchant.');
  await manager.getByRole('checkbox', { name: 'Reply and resolve' }).check();
  await manager.getByRole('button', { name: 'Add reply' }).click();
  await expect.poll(() => writes.find(write => write.path.endsWith('/replies'))?.input).toMatchObject({ title: 'Item restored', resolves: true });
  await expect(manager.getByText('Reply and resolve', { exact: true }).first()).toBeVisible();
});
