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
  const activity: object[] = [...((overrides.activity as object[]) || [])];
  const messages: object[] = [...((overrides.messages as object[]) || [])];
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
      if (input.action === 'end') {
        // Only a change from on to off tells the player, as the server does.
        const was = active;
        active = false;
        return route.fulfill({ json: { message: was ? 'Player replies are off. The player was told in game and mailed a notice.' : 'Player replies are already off.' } });
      }
      if (input.action === 'send') {
        // Sending never changes Player replies; the player's answer is
        // recorded only while replies are on, as the server does.
        const created_at = new Date().toISOString();
        messages.push({ id: messages.length + 1, kind: 'chat_out', text: input.text, delivery: 'sent', created_at });
        if (active) messages.push({ id: messages.length + 1, kind: 'chat_in', text: 'Thanks, I found it.', created_at });
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
      const sentAt = new Date().toISOString();
      activity.push({ key: 'delivery-reply-' + writes.length, kind: 'reply', text: input.subject, actor: 'Guide', created_at: sentAt });
      messages.push({ id: 1e15 + writes.length, kind: 'chat_out', delivery: 'mail', actor: 'Guide', recipient: 'Aranel', subject: input.subject, text: input.body, created_at: sentAt });
      return route.fulfill({ status: 201, json: { audit_id: 982 } });
    }
    if (input.revision !== undefined && input.revision !== record.revision) {
      return route.fulfill({ status: 409, json: { error: 'The case changed. Refresh it before trying again.' } });
    }
    const entry = (kind: string, text: string) => activity.push({ key: kind + '-' + writes.length, kind, text, actor: 'Guide', created_at: new Date().toISOString() });
    let petition = null;
    let repliesNotice = '';
    if (input.action === 'resolve') {
      record.status = 'resolved';
      record.escalated = false;
      // Resolving ends Player replies; the player is told unless a saved reply went first.
      if (active && !input.reply_sent) repliesNotice = 'The player was told in game and mailed a notice.';
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
    if (!petition && !repliesNotice) return route.fulfill({ status: 204 });
    return route.fulfill({ json: { ...(petition ? { petition } : {}), ...(repliesNotice ? { replies_notice: repliesNotice } : {}) } });
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
  const dialog = page.getByRole('dialog', { name: 'Recovery · Aranel' });
  await expect(dialog.getByRole('alert')).toHaveText('Recovery is unavailable on this Spire server.');
  await dialog.getByRole('button', { name: 'Refresh locations' }).click();
  await expect(dialog.getByRole('heading', { name: 'Last saved location' })).toBeVisible();
});

test('moves the petition character and a selected unburied corpse with separate receipts', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'player-operations']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Move character' }).click();
  const dialog = page.getByRole('dialog', { name: 'Recovery · Aranel' });
  const moveCharacter = dialog.getByRole('button', { name: 'Move character' });
  await expect(dialog.getByText('Safe point')).toBeVisible();
  // The reason has focus; a missing or short one is pointed out under the field, nothing is sent.
  await expect(dialog.getByLabel('Reason for move')).toBeFocused();
  await moveCharacter.click();
  await expect(dialog.getByRole('alert')).toHaveText('Add a reason of 8 to 240 characters.');
  await expect(dialog.getByLabel('Reason for move')).toHaveAttribute('aria-invalid', 'true');
  await dialog.getByLabel('Reason for move').fill('Stuck');
  await moveCharacter.click();
  await expect(dialog.getByRole('alert')).toHaveText('Use 8 to 240 characters for the reason.');
  expect(writes).toHaveLength(0);
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
  const dialog = page.getByRole('dialog', { name: 'Recovery · Aranel' });
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
  const dialog = page.getByRole('dialog', { name: 'Recovery · Aranel' });
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

const repliesOffHint = 'Player replies are off: the player can read this but cannot answer. The game tells them if they try.';

test('shows account presence and sends tells whatever Player replies says', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await page.goto('/admin/player-support');
  await expect(page.getByRole('button', { name: /^Aranel / }).getByText('Online', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Thornwick / }).getByText('Offline', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Player in game' })).toBeVisible();
  const replies = page.getByText(/^Player replies: (On|Off)$/);
  await expect(replies).toHaveText('Player replies: Off');
  // The composer is enabled with replies off, and says what the player sees.
  await expect(page.getByLabel('Tell Aranel')).toBeEnabled();
  await expect(page.getByText(repliesOffHint)).toBeVisible();
  // Without the marquee feature, nothing mentions a marquee.
  await expect(page.getByText('Tells reach the player now.', { exact: true })).toBeVisible();
  // Player replies says what it does now: the switch's description and tooltip.
  await expect(page.locator('#support-replies-effect')).toHaveText('The player’s answers are not accepted.');
  await expect(page.getByRole('button', { name: 'Turn on replies' })).toHaveAttribute('aria-describedby', 'support-replies-effect');
  await expect(page.getByText(/marquee/)).toHaveCount(0);
  await page.getByLabel('Tell Aranel').fill('Your parcel is 100% ready.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  await expect(transcript.getByText('Your parcel is 100% ready.')).toBeVisible();
  // Sending leaves replies off; the player's answer is not recorded.
  await expect(replies).toHaveText('Player replies: Off');
  await expect(transcript.getByText('Thanks, I found it.')).toHaveCount(0);
  await expect(page.getByLabel('Tell Aranel')).toBeEnabled();

  await page.getByRole('button', { name: 'Turn on replies' }).click();
  await expect(replies).toHaveText('Player replies: On');
  await expect(page.getByText(repliesOffHint)).toHaveCount(0);
  await page.getByLabel('Tell Aranel').fill('Did it arrive?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(transcript.getByText('Thanks, I found it.')).toBeVisible();

  await page.getByRole('button', { name: 'Turn off replies' }).click();
  await expect(replies).toHaveText('Player replies: Off');
  // The player is told; the answer says how that went.
  await expect(page.getByRole('status').filter({ hasText: 'Player replies are off. The player was told in game and mailed a notice.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Turn on replies' })).toBeEnabled();
  await expect(page.getByLabel('Tell Aranel')).toBeEnabled();
  await expect(transcript.getByText('Thanks, I found it.')).toBeVisible();
  expect(writes.map(write => write.input.action)).toEqual(['send', 'start', 'send', 'end']);
  expect(writes[0]).toMatchObject({
    connection: '7', input: { text: 'Your parcel is 100% ready.', request_id: expect.stringMatching(/^[a-f0-9]{32}$/) },
  });
});

test('says a tell also shows as a marquee when World has the feature, and when the marquee is cut', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support'], { id: 7 }, { features: { patch: 3, revoke: true, marquee: true } });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await expect(page.getByText('Tells reach the player now, with an on-screen marquee.', { exact: true })).toBeVisible();
  // The message box says how the message goes before it is sent.
  await expect(page.locator('.chat-route')).toContainText('Tell Aranel as GameMaster + on-screen marquee');
  const cut = page.getByText('The on-screen marquee shows the first part; the tell has the full message.');
  // "Game Master: " plus 107 characters fits the 120-character marquee.
  await page.getByLabel('Tell Aranel').fill('a'.repeat(107));
  await expect(cut).toHaveCount(0);
  await page.getByLabel('Tell Aranel').fill('a'.repeat(108));
  await expect(cut).toBeVisible();
  // It shows what the marquee will carry: 117 characters and "...".
  await expect(page.locator('.chat-marquee-preview')).toHaveText('Game Master: ' + 'a'.repeat(104) + '...');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByLabel('Tell Aranel')).toHaveValue('');
  await expect(cut).toHaveCount(0);
  expect(writes[0].input).toMatchObject({ action: 'send', text: 'a'.repeat(108) });
});

test('tells the player when resolving ends Player replies', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await page.getByRole('button', { name: 'Turn on replies' }).click();
  await expect(page.getByText('Player replies: On', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  await page.getByRole('dialog', { name: 'Resolve case' }).getByRole('button', { name: 'Resolve case' }).click();
  await expect(page.getByRole('status').filter({
    hasText: 'Aranel’s case resolved. Removed from the in-game queue. The player can file a new petition. The player was told in game and mailed a notice.',
  })).toBeVisible();
  expect(writes.find(write => write.input.action === 'resolve')?.input).toMatchObject({ reply_sent: false });
});

test('shows a player mail to the Game Master in the conversation and on the timeline', async ({ page }) => {
  const mail = { id: 3, kind: 'chat_in', actor: 'Bramble', text: 'It is back now, thank you.', subject: 'Re: Response to your petition', delivery: 'mail', created_at: '2026-11-08T12:05:00Z' };
  await mockSupport(page, ['player-support'], { id: 7 }, {
    messages: [mail],
    activity: [{ key: 'note-3', kind: 'chat_in', actor: 'Bramble', text: mail.text, subject: mail.subject, delivery: 'mail', created_at: mail.created_at }],
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const timeline = page.locator('.kind-chat_in');
  await expect(timeline.getByRole('heading', { name: /Player mail · Bramble/ })).toBeVisible();
  await expect(timeline.getByText('Re: Response to your petition')).toBeVisible();
  await expect(timeline.getByText('Received by mail')).toBeVisible();
  await expect(timeline.getByText('alt', { exact: true })).toBeVisible();
  // The unseen mail also counts on the Live chat tab.
  await page.getByRole('tab', { name: /^Live chat.*1 new player message/ }).click();
  // In Live chat the mail is a card that opens it.
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  await expect(transcript.getByText('Re: Response to your petition')).toBeVisible();
  await expect(transcript.getByText('Mail from Bramble')).toBeVisible();
  await expect(transcript.getByRole('button', { name: 'Read message: Re: Response to your petition' })).toBeVisible();
});

test('opens a player mail from its Live chat card in a dialog, and returns focus on Esc', async ({ page }) => {
  const body = 'Hello Game Master,\n\nI logged in and the tunic is back in my bank.\n' + 'Averyveryverylongwordwithoutanyspaces'.repeat(6) + '\n\nThanks again, Aranel';
  const mail = { id: 3, kind: 'chat_in', actor: 'Bramble', text: body, subject: 'Re: Response to your petition', delivery: 'mail', created_at: '2026-11-08T12:05:00Z' };
  const tell = { id: 4, kind: 'chat_in', actor: 'Aranel', text: 'And a quick tell too.', created_at: '2026-11-08T12:06:00Z' };
  await mockSupport(page, ['player-support', 'mail-parcels-editor'], { id: 7 }, {
    messages: [mail, tell],
    activity: [{ key: 'note-3', kind: 'chat_in', actor: 'Bramble', text: body, subject: mail.subject, delivery: 'mail', created_at: mail.created_at }],
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: /^Live chat/ }).click();
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  const card = transcript.locator('.chat-mail-card');
  await expect(card).toContainText('Mail from Bramble');
  await expect(card).toContainText('Re: Response to your petition');
  // The letter is not in the conversation; a tell still is.
  await expect(transcript.getByText('I logged in and the tunic is back in my bank.')).toHaveCount(0);
  await expect(transcript.getByText('And a quick tell too.')).toBeVisible();

  const open = card.getByRole('button', { name: 'Read message: Re: Response to your petition' });
  await expect(open).toHaveAttribute('aria-haspopup', 'dialog');
  await open.click();
  const dialog = page.getByRole('dialog', { name: 'Re: Response to your petition' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Bramble')).toBeVisible();
  await expect(dialog.getByText('alt', { exact: true })).toBeVisible();
  const letter = dialog.locator('.mail-view-body');
  await expect(letter).toContainText('I logged in and the tunic is back in my bank.');
  await expect(letter).toContainText('Thanks again, Aranel');
  // Line breaks are kept, and a long word wraps inside the dialog.
  expect(await letter.evaluate(element => getComputedStyle(element).whiteSpace)).toBe('pre-wrap');
  expect(await letter.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await expect(dialog.getByRole('button', { name: 'Reply by mail' })).toBeVisible();

  // Focus moves into the dialog once it has opened; Esc then closes it.
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement && document.activeElement.closest('.modal')))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();

  // Reply by mail opens the existing mail reply dialog.
  await open.click();
  await page.getByRole('dialog', { name: 'Re: Response to your petition' }).getByRole('button', { name: 'Reply by mail' }).click();
  await expect(page.getByRole('dialog', { name: 'Re: Response to your petition' })).toBeHidden();
  await expect(page.locator('.modal.show').getByLabel('Subject')).toBeVisible();
});

test('shows the opening lines of a player mail on the timeline and opens the rest', async ({ page }) => {
  const body = Array.from({ length: 12 }, (_, line) => 'Line ' + (line + 1) + ' of a long letter about the missing tunic.').join('\n');
  await mockSupport(page, ['player-support'], { id: 7 }, {
    activity: [{ key: 'note-3', kind: 'chat_in', actor: 'Aranel', text: body, subject: 'The tunic', delivery: 'mail', created_at: '2026-11-08T12:05:00Z' }],
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const entry = page.locator('.kind-chat_in');
  const lines = entry.locator('.support-event-clamp');
  expect(await lines.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await entry.getByRole('button', { name: 'Read message: The tunic' }).click();
  const dialog = page.getByRole('dialog', { name: 'The tunic' });
  await expect(dialog.locator('.mail-view-body')).toContainText('Line 12 of a long letter about the missing tunic.');
  await dialog.locator('.modal-footer').getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await expect(entry.getByRole('button', { name: 'Read message: The tunic' })).toBeFocused();
});

const mailRepliesHint = 'The player can answer this mail in game while Player replies is on.';

test('says a mailed player can answer only when World reports mail replies', async ({ page }) => {
  for (const features of [{ patch: 3 }, { patch: 3, mail_replies: true }]) {
    await mockSupport(page, ['player-support', 'mail-parcels-editor'], { id: 7 }, { features, character_presence: 'offline', account_presence: 'offline' });
    await page.route(`**${endpoint}/${caseKey}/chat?*`, route => route.request().method() === 'GET'
      ? route.fulfill({ json: { state: 'offline', active: false, mail_to: 'Aranel', cursor: 0, messages: [], companion: 'ready' } })
      : route.fallback());
    await page.goto(`/admin/player-support?case=${caseKey}`);
    await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
    await expect(page.getByText(/Messages you send now are mailed to Aranel/)).toBeVisible();
    await expect(page.getByText(mailRepliesHint)).toHaveCount(features.mail_replies ? 1 : 0);

    await page.getByRole('button', { name: 'Reply by mail' }).click();
    const dialog = page.locator('.modal.show');
    await dialog.getByLabel('Subject').fill('Your tunic');
    await dialog.getByLabel('Message', { exact: true }).fill('It is waiting at the parcel merchant.');
    await dialog.getByRole('button', { name: 'Review reply' }).click();
    await expect(dialog.getByText(/receives this in their in-game mailbox/)).toBeVisible();
    await expect(dialog.getByText(mailRepliesHint)).toHaveCount(features.mail_replies ? 1 : 0);
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  }
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
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
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
      return route.fulfill({ json: { state: 'offline', active: false, mail_to: 'Aranel', cursor: messages.length, messages, companion: 'ready' } });
    }
    const input = route.request().postDataJSON();
    sends.push(input);
    messages.push({ id: 1, kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: input.text, delivery: 'mail', created_at: new Date().toISOString() });
    return route.fulfill({ status: 204 });
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await expect(page.getByText(/Messages you send now are mailed to Aranel/)).toBeVisible();
  await expect(page.getByText(/marquee/)).toHaveCount(0);
  await expect(page.getByText(/This message was sent to you in response to your petition while you were offline/)).toBeVisible();
  // Replies can be turned on while nobody is in game; mailing does not do it.
  await expect(page.getByText('Player replies: Off', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Turn on replies' })).toBeEnabled();
  await expect(page.getByText(repliesOffHint)).toBeVisible();
  await page.getByLabel('Mail Aranel').fill('Your tunic is waiting at the parcel merchant.');
  await page.getByRole('button', { name: 'Send as mail' }).click();
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  await expect(transcript.getByText('Your tunic is waiting at the parcel merchant.')).toBeVisible();
  await expect(transcript.getByText('Sent by mail')).toBeVisible();
  await expect(page.getByText('Player replies: Off', { exact: true })).toBeVisible();
  expect(sends).toHaveLength(1);
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
  await recovery.locator('.modal-footer').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(recovery).toHaveCount(0);

  await page.getByRole('button', { name: 'Open live chat' }).click();
  await expect(page.getByRole('heading', { name: 'Needs the server patch' })).toBeVisible();
  await expect(page.getByText('Aranel is in game, but World does not have the Player Support patch')).toBeVisible();
  // An older or missing patch never turns replies on.
  await expect(page.getByRole('button', { name: 'Turn on replies' })).toBeDisabled();
  await expect(page.getByLabel('Tell Aranel')).toHaveCount(0);
});

test('summarizes the queue, flags new replies, and offers quick text', async ({ page }) => {
  await mockSupport(page, ['player-support', 'mail-parcels-editor']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const summary = page.getByRole('group', { name: 'Queue at a glance' });
  await expect(summary.getByText('Urgent')).toBeVisible();
  const thornwick = page.getByRole('button', { name: /^Thornwick / });
  await expect(thornwick.getByText('New', { exact: true })).toBeVisible();
  await expect(thornwick.getByText('Replies on', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
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
  // Thornwick waits on the player, so nothing else needs staff and the resolved case stays open here.
  await mockSupport(page, ['player-support'], { id: 7 }, { otherCase: { status: 'waiting' } });
  await page.goto('/admin/player-support');
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Tell Aranel' })).toBeEnabled();
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  await page.getByRole('dialog', { name: 'Resolve case' }).getByRole('button', { name: 'Resolve case' }).click();
  await expect(page.getByRole('heading', { name: 'Live chat unavailable' })).toBeVisible({ timeout: 2500 });
  await page.getByLabel('Petition detail').getByRole('button', { name: 'Reopen', exact: true }).click();
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
  await page.getByRole('tab', { name: 'Evidence', exact: true }).click();
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
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
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
  expect(writes.find(write => write.input.action === 'resolve')?.input).toMatchObject({ close_in_game: true, reply_sent: false });

  // Reopen in the notice puts the case back and opens it.
  await page.locator('.support-notice').getByRole('button', { name: 'Reopen', exact: true }).click();
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
  await expect(dialog.getByLabel(/^Reason/)).toBeFocused();
  await save.click();
  await expect(dialog.getByRole('alert')).toHaveText('Add a reason.');
  expect(writes.map(write => write.input.action)).toEqual(['take', 'assign']);
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
  await expect(page.getByRole('dialog', { name: 'Recovery · Aranel' })).toBeVisible();
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
  await expect(dialog.getByText('Sent as a tell if Aranel is in game, otherwise by in-game mail to Aranel.')).toBeVisible();
  // Staff see what the player will read before sending it.
  await expect(dialog.getByLabel('Reply preview')).toHaveText('Hi Aranel, your item is at the parcel merchant.');
  const send = dialog.getByRole('button', { name: 'Send and resolve' });
  await send.click();
  await expect(dialog.getByRole('alert')).toHaveText('Mail delivery is unavailable right now.');
  expect(writes.some(write => write.input.action === 'resolve')).toBe(false);
  await expect(page.getByRole('button', { name: 'Resolve case', exact: true })).toBeVisible();

  await send.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Aranel’s case resolved.')).toBeVisible();
  expect(writes.map(write => write.input.action || write.path.split('/').pop())).toEqual(['reply', 'resolve']);
  // The saved reply already told the player, so no replies-closed notice.
  expect(writes[1].input).toMatchObject({ reply_sent: true });
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

// The player is in game, so the saved reply goes as a tell, though Player
// replies are off.
// Each tell is answered with the next delivery; once they run out, the shared
// mock answers the older empty 204.
async function mockTellReply(page: Page, deliveries: string[]) {
  const writes = await mockSupport(page, ['player-support', 'mail-parcels-editor'], { id: 7 }, {
    replies: [{ id: 1, title: 'Item restored', body: 'Hi {character}, your item is at the parcel merchant.', resolves: true }],
  });
  const sends: string[] = [];
  await page.route(`**${endpoint}/${caseKey}/chat?*`, route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { state: 'ready', active: false, recipient: 'Aranel', cursor: 0, messages: [] } });
    sends.push(route.request().postDataJSON().request_id);
    const delivery = deliveries[sends.length - 1];
    return delivery ? route.fulfill({ json: { delivery } }) : route.fallback();
  });
  return { writes, sends };
}

const isCaseDetail = (request: { method(): string; url(): string }) =>
  request.method() === 'GET' && new URL(request.url()).pathname === `${endpoint}/${caseKey}`;

test('keeps the case open when World refuses the saved reply tell, and sends it again as a new tell', async ({ page }) => {
  const { writes, sends } = await mockTellReply(page, ['failed']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  await dialog.getByLabel('Send a saved reply first (optional)').selectOption({ label: 'Item restored' });
  const send = dialog.getByRole('button', { name: 'Send and resolve' });
  const reload = page.waitForRequest(isCaseDetail);
  await send.click();
  await expect(dialog.getByRole('alert')).toHaveText('The reply was not delivered to Aranel, so the case was not resolved. You can try again.');
  await reload;
  await expect(dialog.locator('.support-callout.is-warning')).toHaveCount(0);
  expect(writes.some(write => write.input.action === 'resolve')).toBe(false);
  expect(sends).toHaveLength(1);

  await send.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Aranel’s case resolved.')).toBeVisible();
  expect(sends).toHaveLength(2);
  expect(sends[1]).toMatch(/^[a-f0-9]{32}$/);
  expect(sends[1]).not.toBe(sends[0]);
  expect(writes.map(write => write.input.action)).toEqual(['send', 'resolve']);
  expect(writes[1].input).toMatchObject({ text: 'Sent saved reply: Item restored', close_in_game: true });
});

for (const delivery of ['unconfirmed', 'pending']) {
  test(`keeps the case open and sends nothing again when the saved reply tell is ${delivery}`, async ({ page }) => {
    const { writes, sends } = await mockTellReply(page, [delivery]);
    await page.goto(`/admin/player-support?case=${caseKey}`);
    await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Resolve case' });
    await dialog.getByLabel('Send a saved reply first (optional)').selectOption({ label: 'Item restored' });
    const reload = page.waitForRequest(isCaseDetail);
    await dialog.getByRole('button', { name: 'Send and resolve' }).click();
    await expect(dialog.getByRole('alert')).toHaveText(unconfirmedReply);
    await reload;
    await expect(dialog.locator('.support-callout.is-warning')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Send and resolve' })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Send again and resolve' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Resolve without sending again' })).toBeVisible();
    await page.waitForTimeout(500);
    expect(sends).toHaveLength(1);
    expect(writes.some(write => write.input.action === 'resolve')).toBe(false);
  });
}

test('keeps batch Assign disabled until the staff list loads', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await page.route('**/api/v1/player-support/staff**', route => route.fulfill({ status: 500, json: { error: 'Player Support database request failed' } }), { times: 1 });
  await page.goto('/admin/player-support');
  await page.getByRole('button', { name: 'Select', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Select case #731, Aranel' }).check();
  await page.getByRole('group', { name: 'Selected cases' }).getByRole('button', { name: 'Assign…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Assign 1 case' });
  const choices = dialog.getByRole('group', { name: 'Assign to' });
  await expect(dialog.getByRole('alert')).toContainText('Player Support database request failed');
  await expect(choices.getByRole('button', { name: /^Nobody/ })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Assign', exact: true })).toBeDisabled();

  await dialog.getByRole('button', { name: 'Try again' }).click();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  // Nothing is chosen until a row is picked.
  await expect(choices.getByRole('button', { name: 'Pat' })).toHaveAttribute('aria-pressed', 'false');
  await expect(dialog.getByRole('button', { name: 'Assign', exact: true })).toBeDisabled();
  await choices.getByRole('button', { name: 'Pat' }).click();
  await expect(choices.getByRole('button', { name: 'Pat' })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => writes.find(write => write.path === '/batch')?.input).toMatchObject({ action: 'assign', assignee_id: 5 });
});

test('never offers the id-0 user of an install without authentication as an assignee', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  // Without Spire authentication the staff list is the signed-in user, as id 0, which the server reads as "unassign".
  await page.route('**/api/v1/player-support/staff**', route => route.fulfill({ json: { staff: [{ id: 0, name: 'Game Master' }] } }));
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Change assignee' }).click();
  const assign = page.getByRole('dialog', { name: 'Assign case' });
  await expect(assign.getByRole('button', { name: 'Take it myself' })).toBeVisible();
  await expect(assign.getByRole('button', { name: /^Nobody/ })).toBeVisible();
  await expect(assign.getByRole('status')).toHaveCount(0);
  await expect(assign.getByRole('button', { name: /Game Master/ })).toHaveCount(0);
  await assign.getByRole('button', { name: 'Cancel' }).click();
  await expect(assign).toBeHidden();

  await page.getByRole('button', { name: 'Select', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Select case #731, Aranel' }).check();
  await page.getByRole('group', { name: 'Selected cases' }).getByRole('button', { name: 'Assign…' }).click();
  const batch = page.getByRole('dialog', { name: 'Assign 1 case' });
  await expect(batch.getByRole('group', { name: 'Assign to' }).getByRole('button')).toHaveText(['Nobody']);
  await expect(batch.getByText('No staff to choose from. Nobody unassigns the cases; Claim takes them yourself.')).toBeVisible();
  await batch.getByRole('button', { name: 'Nobody' }).click();
  await batch.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(batch).toBeHidden();
  await expect.poll(() => writes.find(write => write.path === '/batch')?.input).toMatchObject({ action: 'assign', assignee_id: 0 });
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
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
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

// ---------------------------------------------------------------------------
// Quality of life: navigation badge, Live chat pulse, timeline, shortcuts.

test('shows petitions pending GM action on the Player Support navigation button', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  let pending: number | null = 3;
  await page.route('**/api/v1/player-support/pending*', route => pending === null
    ? route.fulfill({ status: 500, json: { error: 'down' } })
    : route.fulfill({ json: { pending, connection_id: 7 } }));
  await page.goto('/admin/player-support');
  const nav = page.locator('#sidebarCollapse').getByRole('link', { name: /Player Support/ });
  await expect(nav).toHaveAccessibleName(/Player Support.*3 petitions pending GM action/);
  await expect(nav.locator('.nav-count-badge')).toHaveText('3');

  // Over 99 shows 99+; the accessible name keeps the number.
  pending = 120;
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(nav.locator('.nav-count-badge')).toHaveText('99+');
  await expect(nav).toHaveAccessibleName(/120 petitions pending GM action/);

  // None pending, or the request fails: no badge, and the link still works.
  pending = 0;
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(nav.locator('.nav-count-badge')).toHaveCount(0);
  pending = null;
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(nav.locator('.nav-count-badge')).toHaveCount(0);
  await expect(nav).toBeVisible();
});

test('the queue shares its pending count with the navigation badge at once', async ({ page }) => {
  await mockSupport(page, ['player-support'], { id: 7 }, { summary: { pending: 2 } });
  await page.route('**/api/v1/player-support/pending*', route => route.fulfill({ status: 500, json: {} }));
  await page.goto('/admin/player-support');
  const nav = page.locator('#sidebarCollapse').getByRole('link', { name: /Player Support/ });
  await expect(nav.locator('.nav-count-badge')).toHaveText('2');
});

test('pulses the Live chat tab until the new player message is seen there', async ({ page }) => {
  const reply = { id: 4, kind: 'chat_in', actor: 'Aranel', text: 'Still missing the tunic.', created_at: '2026-11-08T12:00:00Z' };
  await mockSupport(page, ['player-support'], { id: 7 }, {
    last_reply_at: reply.created_at, messages: [reply],
    activity: [{ key: 'note-4', kind: 'chat_in', actor: 'Aranel', text: reply.text, created_at: reply.created_at }],
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const tab = page.getByRole('tab', { name: /^Live chat/ });
  // No stray space before the comma.
  await expect(tab).toHaveAccessibleName('Live chat, 1 new player message');
  const dot = tab.locator('.support-tab-dot');
  await expect(dot).toHaveText('1');
  expect(await dot.evaluate(element => getComputedStyle(element).animationName)).not.toBe('none');

  await tab.click();
  await expect(page.getByRole('log', { name: 'Chat messages' }).getByText('Still missing the tunic.')).toBeVisible();
  await expect(dot).toHaveCount(0);
  await page.getByRole('tab', { name: /^Timeline/ }).click();
  await expect(page.locator('.kind-chat_in')).toBeVisible();
  await expect(tab.locator('.support-tab-dot')).toHaveCount(0);
});

test('keeps the Live chat dot without motion when reduced motion is preferred', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockSupport(page, ['player-support'], { id: 7 }, {
    last_reply_at: '2026-11-08T12:00:00Z',
    activity: [{ key: 'note-4', kind: 'chat_in', actor: 'Aranel', text: 'Hello?', created_at: '2026-11-08T12:00:00Z' }],
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const dot = page.getByRole('tab', { name: /^Live chat/ }).locator('.support-tab-dot');
  await expect(dot).toBeVisible();
  expect(await dot.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
});

test('lays the timeline out by kind, flags failures, and filters it', async ({ page }) => {
  const at = (minute: number) => `2026-11-08T12:${String(minute).padStart(2, '0')}:00Z`;
  await mockSupport(page, ['player-support'], { id: 7 }, {
    activity: [
      { key: 'note-1', kind: 'claim', actor: 'Guide', text: 'Claimed the case', created_at: at(1) },
      { key: 'note-2', kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: 'Looking now.', delivery: 'sent', created_at: at(2) },
      { key: 'note-3', kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: 'Are you there?', delivery: 'sent', created_at: at(3) },
      { key: 'note-4', kind: 'chat_in', actor: 'Aranel', text: 'Yes.', created_at: at(4) },
      { key: 'note-5', kind: 'kick', actor: 'Guide', text: 'Kicked Aranel from the game\nStuck at zoning\nWorld did not accept the kick.', delivery: 'failed', created_at: at(5) },
      { key: 'note-6', kind: 'note', actor: 'Guide', text: 'Checked the trade logs.', created_at: at(6) },
      { key: 'note-7', kind: 'chat_off', actor: 'Guide', text: 'Turned off player replies\nThe player was told in game and mailed a notice.', created_at: at(7) },
      { key: 'note-8', kind: 'mystery_tool', actor: 'Guide', text: 'Something new happened', created_at: at(8) },
    ],
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const timeline = page.locator('.support-timeline');
  await expect(timeline.locator('.kind-claim')).toHaveClass(/family-workflow/);
  await expect(timeline.locator('.kind-chat_in')).toHaveClass(/family-player/);
  await expect(timeline.locator('.kind-note')).toHaveClass(/family-note/);
  // A kind the page does not know yet still shows, quietly.
  await expect(timeline.locator('.kind-mystery_tool')).toHaveClass(/family-system/);
  await expect(timeline.locator('.kind-mystery_tool').getByRole('heading', { name: /Case updated · Guide/ })).toBeVisible();

  // Two tells within five minutes read as one exchange.
  const tells = timeline.locator('.kind-chat_out');
  await expect(tells.nth(1)).toHaveClass(/is-compact/);

  // A failed action is marked, with its title and detail apart.
  const kick = timeline.locator('.kind-kick');
  await expect(kick).toHaveClass(/is-failed/);
  await expect(kick.locator('.support-event-content p').first()).toHaveText('Kicked Aranel from the game');
  await expect(kick.locator('.support-event-detail')).toHaveText('Stuck at zoning\nWorld did not accept the kick.');
  await expect(kick.getByText('Failed')).toBeVisible();

  // "Turned off player replies" and how the notice went, as title and detail.
  const off = timeline.locator('.kind-chat_off');
  await expect(off.getByRole('heading', { name: /Player replies off · Guide/ })).toBeVisible();
  await expect(off.locator('.support-event-content p')).toHaveText('The player was told in game and mailed a notice.');

  // Exact time and how long ago, on hover.
  await expect(off.locator('time')).toHaveAttribute('title', /· \d+[mhd] ago|· just now/);

  const filters = page.getByRole('group', { name: 'Filter the timeline' });
  await expect(filters.getByRole('button', { name: 'All 8' })).toHaveAttribute('aria-pressed', 'true');
  await filters.getByRole('button', { name: 'Messages 3' }).click();
  await expect(timeline.locator('.support-event:not(.support-original)')).toHaveCount(3);
  await filters.getByRole('button', { name: 'Notes 1' }).click();
  await expect(timeline.locator('.support-event:not(.support-original):not(.kind-native)')).toHaveCount(1);
  await expect(timeline.locator('.kind-note')).toBeVisible();
  await filters.getByRole('button', { name: 'Actions 4' }).click();
  await expect(timeline.locator('.kind-kick')).toBeVisible();
  await expect(timeline.locator('.kind-chat_in')).toHaveCount(0);
});

test('marks a new player mail in the queue and counts unseen replies in the tab title', async ({ page }) => {
  await mockSupport(page, ['player-support'], { id: 7 }, { otherCase: { last_reply_mail: true } });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const thornwick = page.getByRole('button', { name: /^Thornwick / });
  const chip = thornwick.locator('.support-unread');
  await expect(chip).toHaveAttribute('title', 'New mail from the player');
  await expect(chip).toHaveText(/New\s*mail/);
  await expect(page).toHaveTitle('(1) [Spire] Player Support');
  await thornwick.click();
  await expect(page).toHaveTitle('[Spire] Player Support');
});

test('opens the next and previous case with J and K', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Keyboard shortcuts/ })).toHaveAttribute('title', 'J and K open the next and previous case');
  // The queue lists Aranel, then Thornwick (730-...).
  await expect(page.locator('.support-case-row strong')).toHaveText(['Aranel', 'Thornwick']);
  await page.locator('body').press('j');
  await expect(page).toHaveURL(/case=730-/);
  await page.locator('body').press('k');
  await expect(page).toHaveURL(new RegExp('case=' + caseKey));
  // Typing in a field does not move between cases.
  await page.getByLabel('Search petitions').press('j');
  await expect(page).toHaveURL(new RegExp('case=' + caseKey));
});

test('offers a jump to new Live chat messages while staff read earlier ones', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  const messages: object[] = [];
  for (let id = 1; id <= 30; id++) {
    messages.push({ id, kind: id % 2 ? 'chat_out' : 'chat_in', actor: id % 2 ? 'Guide' : 'Aranel', recipient: 'Aranel', text: 'Message ' + id, delivery: 'sent', created_at: '2026-11-08T12:00:00Z' });
  }
  await page.route(`**${endpoint}/${caseKey}/chat?*`, route => route.request().method() === 'GET'
    ? route.fulfill({ json: { state: 'ready', active: true, recipient: 'Aranel', companion: 'ready', cursor: messages.length, messages } })
    : route.fallback());
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: /^Live chat/ }).click();
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  await expect(transcript.getByText('Message 30', { exact: true })).toBeVisible();
  await transcript.evaluate(element => { element.scrollTop = 0; });
  messages.push({ id: 31, kind: 'chat_in', actor: 'Aranel', text: 'Message 31', created_at: '2026-11-08T12:05:00Z' });
  const jump = transcript.getByRole('button', { name: 'New messages' });
  await expect(jump).toBeVisible();
  await jump.click();
  await expect(transcript.getByText('Message 31', { exact: true })).toBeInViewport();
  await expect(jump).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// The conversation: message box, failures, saved replies, mail and parcels.

test('keeps an unsent Live chat draft per case across tabs and cases', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  // The mock serves Aranel for every case; Thornwick's case answers as itself here.
  const otherKey = '730-' + submitted;
  await page.route(`**${endpoint}/${otherKey}?*`, route => route.request().method() === 'GET'
    ? route.fulfill({ json: { case: {
      key: otherKey, petition_id: 99, character_id: 99, character: 'Thornwick', account: 'thorn', zone: 'hateplane', message: 'Stuck.', urgency: 0,
      submitted_at: submitted, status: 'open', owner: '', mine: false, native_open: true, checked_out: false, revision: 0, account_presence: 'online',
      category: '', suggested_category: '', escalated: false, subject_character: '', age_state: 'fresh', follow_up: false, viewers: [], account_notes: 0,
    }, activity: [], history: [], account_notes: [], viewers: [], features: { patch: 2 } } })
    : route.fallback());
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await page.getByLabel('Tell Aranel').fill('Checking your trade logs now');
  await page.getByRole('tab', { name: /^Timeline/ }).click();
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await expect(page.getByLabel('Tell Aranel')).toHaveValue('Checking your trade logs now');
  // Another case has its own, empty box; coming back brings the draft back.
  await page.getByRole('button', { name: /^Thornwick / }).click();
  await expect(page.getByRole('heading', { name: 'Thornwick', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await expect(page.getByRole('textbox', { name: /^Tell / })).toHaveValue('');
  await page.getByRole('button', { name: /^Aranel / }).click();
  await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await expect(page.getByLabel('Tell Aranel')).toHaveValue('Checking your trade logs now');
});

test('sends with Enter, keeps a tell on one line, and turns pasted typography into plain text', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  const box = page.getByLabel('Tell Aranel');
  await box.fill('It’s at the “parcel” merchant – PoK…');
  await expect(box).toHaveValue(`It's at the "parcel" merchant - PoK...`);
  // A tell has no line breaks: Shift+Enter adds none, and pasted lines are joined.
  await box.press('Shift+Enter');
  await expect(box).toHaveValue(`It's at the "parcel" merchant - PoK...`);
  await box.fill('Line one\n  Line two');
  await expect(box).toHaveValue('Line one Line two');
  await box.press('Enter');
  await expect(box).toHaveValue('');
  expect(writes[0].input).toMatchObject({ action: 'send', text: 'Line one Line two' });
});

test('shows a counter near the tell limit and names a character a tell cannot carry', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  const box = page.getByLabel('Tell Aranel');
  const count = page.locator('.chat-count');
  await box.fill('a'.repeat(149));
  await expect(count).toHaveCount(0);
  await box.fill('a'.repeat(185));
  await expect(count).toHaveText('185/200');
  await box.fill('a'.repeat(200));
  await expect(count).toHaveText('Limit reached · 200/200');
  await box.fill('Your sword is ready ✓');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Remove “✓”');
  await expect(box).toHaveValue('Your sword is ready ✓');
  expect(writes).toHaveLength(0);
});

test('retries a failed send with the same request, keeps the draft, and offers mail instead', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'mail-parcels-editor']);
  const sends: Record<string, string>[] = [];
  await page.route(`**${endpoint}/${caseKey}/chat?*`, route => {
    if (route.request().method() !== 'PUT') return route.fallback();
    sends.push(route.request().postDataJSON());
    return sends.length === 1 ? route.fulfill({ status: 502, json: { error: 'World did not answer the tell request.' } }) : route.fallback();
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await page.getByLabel('Tell Aranel').fill('Are you still there?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  const failure = page.locator('.chat-send-error');
  await expect(failure).toContainText('World did not answer the tell request.');
  await expect(page.getByLabel('Tell Aranel')).toHaveValue('Are you still there?');
  await expect(failure.getByRole('button', { name: 'Send by mail instead' })).toBeVisible();
  await failure.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('log', { name: 'Chat messages' }).getByText('Are you still there?')).toBeVisible();
  await expect(page.getByLabel('Tell Aranel')).toHaveValue('');
  // A retry of the same draft is the same request, so World cannot deliver it twice.
  expect(sends).toHaveLength(2);
  expect(sends[1].request_id).toBe(sends[0].request_id);
  expect(writes.filter(write => write.input.action === 'send')).toHaveLength(1);
});

test('hands a message that cannot go as a tell to Reply by mail', async ({ page }) => {
  await mockSupport(page, ['player-support', 'mail-parcels-editor']);
  await page.route(`**${endpoint}/${caseKey}/chat?*`, route => route.request().method() === 'GET'
    ? route.fulfill({ json: { state: 'offline', active: false, tells_off: true, recipient: 'Aranel', cursor: 0, messages: [], companion: 'ready' } })
    : route.fallback());
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tells turned off' })).toBeVisible();
  await expect(page.getByText('Aranel has tells turned off, so a tell cannot reach them.')).toBeVisible();
  await expect(page.getByLabel('Tell Aranel')).toHaveCount(0);
  await page.getByRole('button', { name: 'Send by mail instead' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reply by mail' });
  await expect(dialog.getByLabel('Message', { exact: true })).toBeFocused();
});

test('sends a failed message again or puts it back in the box; an unconfirmed one only goes back in the box', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  const messages = [
    { id: 1, kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: 'Your tunic is at the merchant.', delivery: 'failed', created_at: '2026-11-08T12:00:00Z' },
    { id: 2, kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: 'Did you get it?', delivery: 'unconfirmed', created_at: '2026-11-08T12:30:00Z' },
  ];
  await page.route(`**${endpoint}/${caseKey}/chat?*`, route => route.request().method() === 'GET'
    ? route.fulfill({ json: { state: 'ready', active: false, recipient: 'Aranel', cursor: 2, messages, companion: 'ready' } })
    : route.fallback());
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  await expect(transcript.getByText('Failed', { exact: true })).toHaveAttribute('title', /did not deliver/);
  await expect(transcript.getByRole('button', { name: /^Retry sending/ })).toHaveCount(1);
  await expect(transcript.getByRole('button', { name: 'Edit “Did you get it?” in the message box' })).toBeVisible();

  await page.getByLabel('Tell Aranel').fill('Draft in progress');
  await transcript.getByRole('button', { name: 'Retry sending “Your tunic is at the merchant.”' }).click();
  await expect.poll(() => writes.length).toBe(1);
  // Sending again leaves the draft alone and is a new request.
  await expect(page.getByLabel('Tell Aranel')).toHaveValue('Draft in progress');
  expect(writes[0].input).toMatchObject({ action: 'send', text: 'Your tunic is at the merchant.', request_id: expect.stringMatching(/^[a-f0-9]{32}$/) });

  await page.getByLabel('Tell Aranel').fill('');
  await transcript.getByRole('button', { name: 'Edit “Did you get it?” in the message box' }).click();
  await expect(page.getByLabel('Tell Aranel')).toHaveValue('Did you get it?');
  await expect(page.getByLabel('Tell Aranel')).toBeFocused();
});

test('groups follow-up messages under one header and separates days', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  const messages = [
    { id: 1, kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: 'Looking now.', delivery: 'sent', created_at: '2026-11-07T12:00:00Z' },
    { id: 2, kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: 'Found it.', delivery: 'sent', created_at: '2026-11-07T12:02:00Z' },
    { id: 3, kind: 'chat_in', actor: 'Aranel', text: 'Thanks!', created_at: '2026-11-09T12:03:00Z' },
  ];
  await page.route(`**${endpoint}/${caseKey}/chat?*`, route => route.request().method() === 'GET'
    ? route.fulfill({ json: { state: 'ready', active: true, recipient: 'Aranel', cursor: 3, messages, companion: 'ready' } })
    : route.fallback());
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  await expect(transcript.getByRole('separator')).toHaveCount(2);
  await expect(transcript.locator('.chat-message.is-continued')).toHaveCount(1);
  await expect(transcript.locator('.chat-message.is-continued')).toContainText('Found it.');
  // The follow-up keeps its sender and time for screen readers.
  await expect(transcript.locator('.chat-message.is-continued .chat-message-meta')).toHaveClass(/sr-only/);
  await expect(page.locator('.chat-answer')).toHaveText('Player can answer');
});

test('finds and inserts any reply from the keyboard', async ({ page }) => {
  await mockSupport(page, ['player-support'], { id: 7 }, { replies: [
    { id: 1, title: 'Parcel ready', body: 'Hi {character}, your item is at the parcel merchant.' },
    { id: 2, title: 'Long apology', body: 'x'.repeat(240) },
  ] });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  const box = page.getByLabel('Tell Aranel');
  await box.focus();
  await box.press('Control+.');
  const search = page.getByRole('combobox', { name: 'Search replies' });
  await expect(search).toBeFocused();
  const options = page.getByRole('listbox', { name: 'Replies' }).getByRole('option');
  await expect(options).toHaveCount(6);
  // A reply too long for a tell is listed but cannot be picked.
  await expect(options.filter({ hasText: 'Long apology' })).toHaveAttribute('aria-disabled', 'true');
  await search.fill('log in');
  await expect(options).toHaveCount(1);
  await search.press('Enter');
  await expect(box).toHaveValue('Please log in on any character so I can help.');
  await expect(box).toBeFocused();
  await expect(search).toHaveCount(0);

  await page.getByRole('button', { name: 'Replies', exact: true }).click();
  await search.fill('parcel');
  await search.press('Escape');
  await expect(search).toHaveCount(0);
  await expect(box).toBeFocused();
  await expect(box).toHaveValue('Please log in on any character so I can help.');
});

test('checks the mail before review, keeps the draft when closed, and reports the sent subject', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'mail-parcels-editor'], { id: 7 }, { replies: [
    { id: 1, title: 'Need details', body: 'Hi {character}, which zone were you in?' },
  ] });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Reply by mail' }).click();
  let dialog = page.getByRole('dialog', { name: 'Reply by mail' });
  // A saved reply hides the built-in template of the same name.
  await expect(dialog.getByRole('group', { name: 'Message templates' }).getByRole('button', { name: /Need details/ })).toHaveCount(1);
  await dialog.getByLabel('Subject').fill('');
  await dialog.getByRole('button', { name: 'Review reply' }).click();
  await expect(dialog.getByText('Add a subject. The player sees it in their mail list.')).toBeVisible();
  await expect(dialog.getByText('Write a message, or start from a template.')).toBeVisible();
  await expect(dialog.getByLabel('Subject')).toBeFocused();
  await expect(dialog.getByLabel('Subject')).toHaveAttribute('aria-invalid', 'true');
  await dialog.getByLabel('Subject').fill('About your tunic');
  await dialog.getByLabel('Message', { exact: true }).fill('It is at the parcel merchant.');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await page.getByRole('button', { name: 'Reply by mail' }).click();
  dialog = page.getByRole('dialog', { name: 'Reply by mail' });
  await expect(dialog.getByText('Your unsent draft for this case is back.')).toBeVisible();
  await expect(dialog.getByLabel('Subject')).toHaveValue('About your tunic');
  await expect(dialog.getByLabel('Message', { exact: true })).toHaveValue('It is at the parcel merchant.');
  await dialog.getByLabel('Message', { exact: true }).press('Control+Enter');
  await expect(dialog.getByRole('button', { name: 'Send reply' })).toBeFocused();
  await page.keyboard.press('Control+Enter');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Mail sent to Aranel: “About your tunic”. It is on the case timeline.')).toBeVisible();
  expect(writes.filter(write => write.path.endsWith('/reply'))).toHaveLength(1);

  // A sent mail leaves no draft behind.
  await page.getByRole('button', { name: 'Reply by mail' }).click();
  await expect(page.getByRole('dialog', { name: 'Reply by mail' }).getByLabel('Message', { exact: true })).toHaveValue('');
});

test('searches saved replies and confirms a delete in place', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support'], { id: 7 }, { replies: [
    { id: 1, title: 'Parcel ready', body: 'Your item is at the parcel merchant.' },
    { id: 2, title: 'Need details', body: 'Which zone were you in?' },
    { id: 3, title: 'Moved to bind', body: 'You were moved to your bind point.' },
    { id: 4, title: 'Long note', body: 'y'.repeat(260) },
  ] });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Saved replies' }).click();
  const manager = page.getByRole('dialog', { name: 'Saved replies' });
  const search = manager.getByRole('searchbox', { name: 'Search saved replies' });
  await expect(search).toBeFocused();
  const list = manager.getByRole('list', { name: 'Saved replies' }).getByRole('listitem');
  await expect(list.filter({ hasText: 'Long note' }).getByText('Mail only')).toBeVisible();
  await search.fill('zone');
  await expect(list).toHaveCount(1);
  await expect(manager.getByText('1 of 4')).toBeVisible();
  await search.press('Escape');
  await expect(search).toHaveValue('');
  await expect(manager).toBeVisible();

  await manager.getByRole('button', { name: 'Delete Need details' }).click();
  const confirm = manager.getByRole('group', { name: 'Confirm deletion' });
  await expect(confirm).toContainText('Delete “Need details” for everyone?');
  await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(manager.getByRole('button', { name: 'Delete Need details' })).toBeFocused();
  await manager.getByRole('button', { name: 'Delete Need details' }).click();
  await confirm.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(manager.getByRole('status')).toHaveText('Deleted “Need details”.');
  expect(writes.find(write => write.path.endsWith('/replies/2'))).toBeTruthy();
  // With an empty search, Esc closes the dialog and focus goes back to where it opened.
  await search.press('Escape');
  await expect(manager).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Saved replies' })).toBeFocused();
});

test('says why a parcel cannot be reviewed yet and what each field is for', async ({ page }) => {
  await mockSupport(page, ['player-support', 'mail-parcels-editor']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Send parcel', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Send parcel' });
  await expect(dialog.getByRole('button', { name: 'Choose an item' })).toBeFocused();
  await expect(dialog.getByText('Choose an item to send.')).toBeVisible();
  await expect(dialog.getByLabel('Reason for delivery')).toHaveAccessibleDescription('Kept in the audit log. The player does not see it.');
  await expect(dialog.getByLabel('Parcel note')).toHaveAccessibleDescription('Optional. The player reads it with the parcel.');
  await dialog.getByRole('button', { name: 'Choose an item' }).click();
  const picker = page.getByRole('dialog', { name: 'Choose item' });
  await picker.getByLabel('Search items').fill('fungus');
  await picker.getByRole('button', { name: /Fungus Covered Scale Tunic/ }).click();
  await expect(dialog.getByText('Choose an item to send.')).toHaveCount(0);
});

test('mails a long saved reply on resolve and says so', async ({ page }) => {
  await mockSupport(page, ['player-support', 'mail-parcels-editor'], { id: 7 }, { replies: [
    { id: 1, title: 'Full write-up', body: 'Hi {character}, ' + 'we checked every log. '.repeat(12), resolves: true },
  ] });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  await dialog.getByLabel('Send a saved reply first (optional)').selectOption({ label: 'Full write-up' });
  await expect(dialog.getByText('Mailed to Aranel as “Response to your petition”: it is too long for a tell.')).toBeVisible();
  await expect(dialog.getByLabel('Reply preview')).toContainText('Hi Aranel, we checked every log.');
});

test('titles a Game Master message that went by mail as mail on the timeline', async ({ page }) => {
  await mockSupport(page, ['player-support'], { id: 7 }, { activity: [
    { key: 'note-1', kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: 'Your tunic is waiting.', delivery: 'mail', created_at: '2026-11-08T12:00:00Z' },
    { key: 'note-2', kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: 'Checking now.', delivery: 'pending', created_at: '2026-11-08T12:10:00Z' },
  ] });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await expect(page.locator('.kind-chat_out').first().getByRole('heading', { name: /Game Master mail · Guide to Aranel/ })).toBeVisible();
  await expect(page.locator('.kind-chat_out').nth(1).getByRole('heading', { name: /Game Master tell · Guide to Aranel/ })).toBeVisible();
  await expect(page.locator('.kind-chat_out').nth(1).getByText('Sending')).toHaveAttribute('title', 'Waiting for World to confirm delivery.');
});

// Small screens, keyboard and screen readers.
async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}
async function inViewport(page: Page, selector: string) {
  return page.locator(selector).first().evaluate(element => {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth;
  });
}

test('works a case on a phone: queue, case, Live chat and back to the same place in the queue', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 560 });
  await mockSupport(page, ['player-support']);
  await page.goto('/admin/player-support');
  await expect(page.getByRole('group', { name: 'Queue at a glance' })).toBeVisible();
  // Spire's router scrolls a page it opens to the top 400 ms after it opens.
  await page.waitForTimeout(600);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  // Icon-only header buttons keep their names.
  for (const name of ['Support insights', 'Saved replies', 'Petition alerts', 'Refresh']) await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const queueScroll = await page.evaluate(() => window.scrollY);
  expect(queueScroll).toBeGreaterThan(0);

  await page.getByRole('button', { name: /^Aranel / }).click();
  await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeFocused();
  // The case has the room: no queue summary, and a bar that leads back.
  await expect(page.getByRole('group', { name: 'Queue at a glance' })).toBeHidden();
  const back = page.getByRole('button', { name: 'Petitions', exact: true });
  await expect(back).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

  await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
  await expect(page.locator('#support-live-message')).toBeVisible();
  await expect.poll(() => inViewport(page, '#support-live-message')).toBe(true);
  await expect.poll(() => inViewport(page, '.chat-send')).toBe(true);
  // The back bar stays at the top while the case scrolls.
  await expect.poll(() => inViewport(page, '.support-mobilebar')).toBe(true);

  await back.click();
  await expect(page.getByRole('button', { name: /^Aranel / })).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(queueScroll - 2);
  await expect(page.getByRole('group', { name: 'Queue at a glance' })).toBeVisible();
});

for (const size of [{ width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1100, height: 800 }, { width: 1280, height: 720 }]) {
  test(`keeps the Live chat message box on screen at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await mockSupport(page, ['player-support']);
    await page.goto(`/admin/player-support?case=${caseKey}`);
    await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    await page.getByRole('tab', { name: 'Live chat', exact: true }).click();
    await expect(page.locator('#support-live-message')).toBeVisible();
    await expect.poll(() => inViewport(page, '#support-live-message')).toBe(true);
    await expect.poll(() => inViewport(page, '.chat-send')).toBe(true);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
}

test('moves between the case views with the arrow keys as a tab list', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const tabs = page.getByRole('tablist', { name: 'Case view' });
  const timeline = tabs.getByRole('tab', { name: /^Timeline/ });
  const chat = tabs.getByRole('tab', { name: 'Live chat', exact: true });
  await expect(timeline).toHaveAttribute('aria-selected', 'true');
  await expect(timeline).toHaveAttribute('aria-controls', 'support-case-panel');
  await expect(chat).toHaveAttribute('tabindex', '-1');
  await timeline.focus();
  await page.keyboard.press('ArrowRight');
  await expect(chat).toBeFocused();
  await expect(chat).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Live chat' }).getByRole('log', { name: 'Chat messages' })).toBeVisible();
  await page.keyboard.press('End');
  await expect(tabs.getByRole('tab', { name: 'Evidence', exact: true })).toBeFocused();
  await expect(page.getByRole('region', { name: 'Evidence' })).toBeVisible();
  await page.keyboard.press('Home');
  await expect(timeline).toBeFocused();
  await expect(timeline).toHaveAttribute('aria-selected', 'true');
  // Tab leaves the tab list for what follows instead of walking every tab.
  await page.keyboard.press('Tab');
  await expect(chat).not.toBeFocused();
});

test('keeps focus inside a dialog and returns it to the button that opened it', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  const opener = page.getByRole('button', { name: 'Resolve case', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  await expect(dialog.getByLabel('Resolution summary (optional)')).toBeFocused();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement && document.activeElement.closest('.modal.show')))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();

  // A tool dialog the page mounts and drops gives focus back too.
  const notes = page.getByRole('button', { name: /^Notes \(/ });
  await notes.click();
  await expect(page.getByRole('dialog', { name: /Account notes/ }).getByRole('textbox')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /Account notes/ })).toBeHidden();
  await expect(notes).toBeFocused();
});

test('fits a dialog above an on-screen keyboard with its actions in view', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 500 });
  await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  await expect(dialog).toBeVisible();
  // On a phone the summary field is not focused on its own, so the keyboard does not cover the dialog.
  await expect(dialog.getByLabel('Resolution summary (optional)')).not.toBeFocused();
  await expect.poll(() => inViewport(page, '.modal.show .modal-footer')).toBe(true);
  await expect.poll(() => inViewport(page, '.modal.show .modal-header')).toBe(true);
  expect(await page.locator('.modal.show .modal-body').evaluate(body => body.scrollHeight > body.clientHeight)).toBe(true);
  const box = await dialog.getByRole('button', { name: 'Resolve case' }).boundingBox();
  expect(box && box.height).toBeGreaterThanOrEqual(40);
});

test('dims the whole window behind a dialog where Spire zooms the page', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  await mockSupport(page, ['player-support']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Resolve case' })).toBeVisible();
  const covered = await page.locator('.support-modal + .modal-backdrop').evaluate(element => {
    const rect = element.getBoundingClientRect();
    return rect.left <= 0 && rect.top <= 0 && rect.right >= window.innerWidth - 1 && rect.bottom >= window.innerHeight - 1;
  });
  expect(covered).toBe(true);
});

// ---------------------------------------------------------------------------
// Working many cases: summary filters, queue memory, shortcuts, moving on.

// The mock serves Aranel for every case; Thornwick's case answers as itself.
async function serveThornwick(page: Page, extra: Record<string, unknown> = {}) {
  const otherKey = '730-' + submitted;
  await page.route(`**${endpoint}/${otherKey}?*`, route => route.request().method() === 'GET'
    ? route.fulfill({ json: { case: {
      key: otherKey, petition_id: 99, character_id: 99, character: 'Thornwick', account: 'thorn', zone: 'hateplane', message: 'Stuck.', urgency: 0,
      submitted_at: submitted, status: 'open', owner: '', mine: false, native_open: true, checked_out: false, revision: 0, account_presence: 'online',
      category: '', suggested_category: '', escalated: false, subject_character: '', age_state: 'fresh', follow_up: false, viewers: [], account_notes: 0, ...extra,
    }, activity: [], history: [], account_notes: [], viewers: [], features: { patch: 2 } } })
    : route.fallback());
  return otherKey;
}

test('filters the queue from every summary card, Urgent included, and shows status chips only when they say something', async ({ page }) => {
  await mockSupport(page, ['player-support'], { id: 7 }, { otherCase: { status: 'waiting', urgency: 0 } });
  await page.goto('/admin/player-support');
  const summary = page.getByRole('group', { name: 'Queue at a glance' });
  const urgent = summary.getByRole('button', { name: /Urgent/ });
  await expect(urgent).toHaveAttribute('aria-pressed', 'false');
  const request = page.waitForRequest(request => request.url().includes('filter=urgent'));
  await urgent.click();
  await request;
  await expect(urgent).toHaveAttribute('aria-pressed', 'true');
  // The filter is named, with the way back.
  await expect(page.getByRole('status').filter({ hasText: 'Showing 2 of 2 active petitions' })).toBeVisible();
  // The card already chosen goes back to Active.
  await urgent.click();
  await expect(summary.getByRole('button', { name: /Active/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(/^Showing /)).toHaveCount(0);

  // An open case has no status chip; a waiting one does. Each row has a short name.
  const aranel = page.getByRole('button', { name: /^Aranel / });
  await expect(aranel).toHaveAccessibleName(/^Aranel – open, urgent, filed .+ ago, unassigned$/);
  await expect(aranel.locator('.support-row-bottom .support-chip').filter({ hasText: /^Open$/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Thornwick / }).getByText('Waiting', { exact: true })).toBeVisible();
});

test('remembers the queue filter, category and search in this browser and clears them in one step', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  await page.goto('/admin/player-support');
  await page.getByRole('group', { name: 'Filter petitions' }).getByRole('button', { name: 'Mine' }).click();
  await page.getByLabel('Filter by category').selectOption({ label: 'Stuck or location' });
  await page.getByLabel('Search petitions').fill('tunic');
  await expect(page.getByText(/^Showing /)).toBeVisible();
  await page.waitForTimeout(400);

  await page.reload();
  await expect(page.getByRole('group', { name: 'Filter petitions' }).getByRole('button', { name: 'Mine' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Filter by category')).toHaveValue('stuck');
  await expect(page.getByLabel('Search petitions')).toHaveValue('tunic');

  const request = page.waitForRequest(request => /filter=open/.test(request.url()) && /[?&]q=(&|$)/.test(request.url()));
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await request;
  await expect(page.getByLabel('Search petitions')).toHaveValue('');
  await expect(page.getByLabel('Filter by category')).toHaveValue('');
  await expect(page.getByRole('group', { name: 'Filter petitions' }).getByRole('button', { name: 'Active' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0);
});

test('lists the keyboard shortcuts and works a case from the keyboard', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support'], { id: 7 }, { otherCase: { status: 'waiting' } });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeVisible();

  // A key pressed while the dialog is still fading in does nothing: b-modal shows it
  // two frames before it adds its "show" class.
  await page.locator('body').press('Shift+?');
  await page.keyboard.press('2');
  const help = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await expect(help).toBeVisible();
  for (const text of ['Search petitions', 'Open the next or previous case', 'Timeline, Live chat or Evidence', 'Write a private staff note',
    'Write to the player in Live chat', 'Claim the case', 'Wait for player', 'Resolve the case']) {
    await expect(help.getByText(text, { exact: true })).toBeVisible();
  }
  // Nor while it is open.
  await page.keyboard.press('2');
  await expect(page.getByRole('tab', { name: /^Timeline/ })).toHaveAttribute('aria-selected', 'true');
  // Nor while it fades out and hands focus back.
  await help.getByRole('button', { name: 'Done' }).click();
  await page.keyboard.press('2');
  await expect(help).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/modal-open/);
  await expect(page.getByRole('tab', { name: /^Timeline/ })).toHaveAttribute('aria-selected', 'true');

  // Tabs by number, with focus on the tab.
  await page.locator('body').press('2');
  await expect(page.getByRole('tab', { name: /^Live chat/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: /^Live chat/ })).toBeFocused();
  await page.keyboard.press('3');
  await expect(page.getByRole('tab', { name: 'Evidence' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('1');
  await expect(page.getByRole('tab', { name: /^Timeline/ })).toHaveAttribute('aria-selected', 'true');

  // N: the staff note, where the key is typed rather than acted on. Keys in quick
  // succession: an earlier key's focus never takes over from a later one.
  await page.keyboard.press('3');
  await page.keyboard.press('1');
  await page.keyboard.press('n');
  await expect(page.getByLabel('Private staff note')).toBeFocused();
  await page.waitForTimeout(150);
  await expect(page.getByLabel('Private staff note')).toBeFocused();
  await page.keyboard.type('c');
  await expect(page.getByLabel('Private staff note')).toHaveValue('c');
  expect(writes).toHaveLength(0);
  await page.getByLabel('Private staff note').fill('');

  // M: Live chat with the cursor in the message box.
  await page.getByRole('heading', { name: 'Aranel', exact: true }).focus();
  await page.keyboard.press('m');
  await expect(page.getByLabel('Tell Aranel')).toBeFocused();
  await page.getByRole('tab', { name: /^Live chat/ }).focus();

  // C claims an unassigned case; R opens Resolve.
  await page.keyboard.press('c');
  await expect.poll(() => writes.map(write => write.input.action)).toEqual(['claim']);
  await expect(page.getByRole('button', { name: 'Release' })).toBeEnabled();
  await page.getByRole('heading', { name: 'Aranel', exact: true }).focus();
  await page.keyboard.press('r');
  await expect(page.getByRole('dialog', { name: 'Resolve case' })).toBeVisible();
});

test('opens the next case that needs staff after a resolve, and Reopen in the notice brings the case back', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await serveThornwick(page);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeVisible();
  const before = await page.locator('.support-workspace').boundingBox();

  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve case' });
  // Ctrl+Enter in the summary resolves, as in every dialog's reason field.
  await dialog.getByLabel('Resolution summary (optional)').fill('Restored the tunic.');
  await dialog.getByLabel('Resolution summary (optional)').press('Control+Enter');
  await expect(dialog).toBeHidden();
  const notice = page.locator('.support-notice');
  await expect(notice).toContainText('Aranel’s case resolved.');
  await expect(notice).toContainText('Next: Thornwick.');
  await expect(page.getByRole('heading', { name: 'Thornwick', exact: true })).toBeFocused();
  await expect(page).toHaveURL(/case=730-/);
  // The notice floats: the page did not move.
  const after = await page.locator('.support-workspace').boundingBox();
  expect(Math.round(after!.y)).toBe(Math.round(before!.y));
  expect(await notice.evaluate(element => getComputedStyle(element).position)).toBe('fixed');

  await notice.getByRole('button', { name: 'Reopen' }).click();
  await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeVisible();
  await expect(page.locator('.support-notice')).toContainText('Aranel’s case is open again.');
  const reopen = writes.find(write => write.input.action === 'reopen');
  expect(reopen && reopen.path).toBe(`${endpoint}/${caseKey}`);
  expect(reopen!.input).toMatchObject({ revision: 1 });
});

test('moves on after Wait for player and offers Undo; stays when nothing else needs staff', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support']);
  await serveThornwick(page);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Wait for player' }).click();
  const notice = page.getByRole('status').filter({ hasText: 'Aranel’s case is waiting for the player. Next: Thornwick.' });
  await expect(notice).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Thornwick', exact: true })).toBeVisible();
  await notice.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => writes.map(write => write.input.action)).toEqual(['wait', 'reopen']);
  await expect(page.getByRole('heading', { name: 'Aranel', exact: true })).toBeVisible();
});

test('keeps the case on screen after a resolve when no other case needs staff', async ({ page }) => {
  await mockSupport(page, ['player-support'], { id: 7 }, { otherCase: { status: 'waiting' } });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Resolve case', exact: true }).click();
  await page.getByRole('dialog', { name: 'Resolve case' }).getByRole('button', { name: 'Resolve case' }).click();
  const notice = page.locator('.support-notice');
  await expect(notice).toContainText('Aranel’s case resolved.');
  await expect(notice).not.toContainText('Next:');
  await expect(page).toHaveURL(new RegExp('case=' + caseKey));
  await expect(page.getByLabel('Petition detail').getByRole('button', { name: 'Reopen', exact: true })).toBeVisible();
  // A success notice can be dismissed; an error stays until dismissed.
  await notice.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(notice).toHaveCount(0);
});

test('adds a staff note once with Ctrl+Enter', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'mail-parcels-editor']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByLabel('Private staff note').fill('Checked the trade logs.');
  await page.getByLabel('Private staff note').press('Control+Enter');
  await expect.poll(() => writes.filter(write => write.input.action === 'note').length).toBe(1);
  await page.waitForTimeout(300);
  expect(writes.filter(write => write.input.action === 'note')).toHaveLength(1);
  // With Reply by mail open, Ctrl+Enter belongs to the dialog: it reviews, and adds no note.
  await page.getByLabel('Private staff note').fill('Second note');
  await page.getByRole('button', { name: 'Reply by mail' }).click();
  const mail = page.getByRole('dialog', { name: 'Reply by mail' });
  await mail.getByLabel('Message', { exact: true }).fill('We restored your tunic.');
  await mail.getByLabel('Message', { exact: true }).press('Control+Enter');
  await expect(mail.getByRole('button', { name: 'Send reply' })).toBeVisible();
  expect(writes.filter(write => write.input.action === 'note')).toHaveLength(1);
});

test('copies a corpse ID and picks batch categories from a list', async ({ page }) => {
  const writes = await mockSupport(page, ['player-support', 'player-operations']);
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('button', { name: 'Corpses', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Recovery · Aranel' });
  await expect(dialog.getByRole('button', { name: 'Copy corpse ID 42' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).first().click();
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Select', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Select case #731, Aranel' }).check();
  await page.getByRole('group', { name: 'Selected cases' }).getByRole('button', { name: 'Category…' }).click();
  const batch = page.getByRole('dialog', { name: 'Set the category of 1 case' });
  await batch.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Stuck or location' }).click();
  await batch.getByRole('button', { name: 'Set category' }).click();
  await expect.poll(() => writes.find(write => write.path === '/batch')?.input).toMatchObject({ action: 'category', category: 'stuck' });
});

test('shows a Game Master Reply by mail in Live chat as soon as it is sent, without counting it as new', async ({ page }) => {
  const earlier = { id: 1e15 + 1, kind: 'chat_out', delivery: 'mail', actor: 'Valorith', recipient: 'Aranel', subject: 'About your corpse', text: '', created_at: '2026-11-08T11:00:00Z' };
  const tell = { id: 3, kind: 'chat_in', actor: 'Aranel', text: 'Hello again.', created_at: '2026-11-08T11:30:00Z' };
  await mockSupport(page, ['player-support', 'mail-parcels-editor'], { id: 7 }, { messages: [earlier, tell] });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: /^Live chat/ }).click();
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  // A reply recorded earlier is a Game Master mail card; its text is gone from the mailbox.
  const old = transcript.locator('.chat-message.is-outgoing .chat-mail-card');
  await expect(old).toContainText('Sent by mail to Aranel');
  await expect(old).toContainText('About your corpse');
  await old.getByRole('button', { name: 'Read message: About your corpse' }).click();
  const oldDialog = page.getByRole('dialog', { name: 'About your corpse' });
  await expect(oldDialog).toContainText('Valorith');
  await expect(oldDialog).toContainText('no longer in the player’s mailbox');
  await expect(oldDialog.getByRole('button', { name: 'Reply by mail' })).toHaveCount(0);
  await oldDialog.locator('.modal-footer').getByRole('button', { name: 'Close' }).click();
  await expect(oldDialog).toBeHidden();

  // Send a reply: it shows in the conversation at once, after the tell.
  await page.getByRole('button', { name: 'Reply by mail' }).first().click();
  const compose = page.locator('.modal.show');
  await compose.getByLabel('Subject').fill('Your tunic');
  await compose.getByLabel('Message', { exact: true }).fill('It is waiting at the parcel merchant.\nCollect it soon.');
  await compose.getByRole('button', { name: 'Review reply' }).click();
  await compose.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.locator('.modal.show')).toHaveCount(0);
  const cards = transcript.locator('.chat-message.is-outgoing .chat-mail-card');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(1)).toContainText('Your tunic');
  await expect(transcript.locator('.chat-message').last()).toContainText('Your tunic');
  await expect(transcript.getByText('It is waiting at the parcel merchant.')).toHaveCount(0);
  await cards.nth(1).getByRole('button', { name: 'Read message: Your tunic' }).click();
  await expect(page.getByRole('dialog', { name: 'Your tunic' }).locator('.mail-view-body')).toHaveText('It is waiting at the parcel merchant.\nCollect it soon.');
  await page.getByRole('dialog', { name: 'Your tunic' }).locator('.modal-footer').getByRole('button', { name: 'Close' }).click();

  // The Game Master's own mail never counts as a new player message.
  await page.getByRole('tab', { name: /^Timeline/ }).click();
  await expect(page.getByRole('tab', { name: /^Live chat/ }).locator('.support-tab-dot')).toHaveCount(0);
  // On the timeline it is one "Mail sent" entry.
  await expect(page.locator('.kind-reply').filter({ hasText: 'Your tunic' })).toHaveCount(1);
});

test('lets a Game Master choose the name players see on tells, with World support', async ({ page }) => {
  const sent = { id: 9, kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', persona: 'Aranwen', text: 'I am on it.', delivery: 'sent', created_at: '2026-11-08T12:00:00Z' };
  await mockSupport(page, ['player-support'], { id: 7 }, { messages: [sent] });
  let persona = '';
  const puts: string[] = [];
  await page.route('**/api/v1/player-support/persona*', async route => {
    if (route.request().method() === 'PUT') {
      persona = route.request().postDataJSON().persona;
      puts.push(persona);
    }
    return route.fulfill({ json: { persona, display: persona || 'Game Master', available: true } });
  });
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: /^Live chat/ }).click();
  // A sent tell shows the name players saw.
  await expect(page.getByRole('log', { name: 'Chat messages' }).getByText('as (GM) Aranwen')).toBeVisible();
  const route = page.locator('.chat-route');
  await expect(route).toContainText('Tell Aranel as (GM) Game Master');

  await page.getByRole('button', { name: 'Change name' }).click();
  const editor = page.getByRole('group', { name: /Players see you as/ });
  const input = editor.getByLabel('Persona');
  await expect(input).toBeFocused();
  await expect(editor).toContainText('3 to 24 letters and single spaces, starting with a letter.');
  await input.fill('Bad  Name');
  await expect(editor.getByRole('alert')).toHaveText('Use letters and single spaces only, starting with a letter.');
  await expect(editor.getByRole('button', { name: 'Save' })).toBeDisabled();
  await input.fill('game master');
  await expect(editor.getByRole('alert')).toContainText('Game Master is the default name');
  await input.fill('Aranwen');
  await expect(editor).toContainText('Players see you as (GM) Aranwen');
  await editor.getByRole('button', { name: 'Save' }).click();
  await expect(editor).toHaveCount(0);
  await expect(route).toContainText('Tell Aranel as (GM) Aranwen');
  await expect(page.getByRole('button', { name: 'Change name' })).toBeFocused();

  await page.getByRole('button', { name: 'Change name' }).click();
  await page.getByRole('group', { name: /Players see you as/ }).getByRole('button', { name: 'Use default' }).click();
  await expect(route).toContainText('Tell Aranel as (GM) Game Master');
  expect(puts).toEqual(['Aranwen', '']);
});

test('keeps the persona control off when World does not support personas', async ({ page }) => {
  await mockSupport(page, ['player-support']);
  await page.route('**/api/v1/player-support/persona*', route => route.fulfill({
    json: { persona: 'Aranwen', display: 'Aranwen', available: false, reason: 'Needs the updated Player Support patch on World' },
  }));
  await page.goto(`/admin/player-support?case=${caseKey}`);
  await page.getByRole('tab', { name: /^Live chat/ }).click();
  const toggle = page.getByRole('button', { name: 'Change name' });
  await expect(toggle).toBeDisabled();
  await expect(toggle).toHaveAttribute('title', 'Needs the updated Player Support patch on World');
  await expect(toggle).toHaveAccessibleDescription('Needs the updated Player Support patch on World');
  // Tells go as before.
  await expect(page.locator('.chat-route')).toContainText('Tell Aranel as GameMaster');
});

test('shows unmistakably when a tell was forwarded by mail because the player was AFK', async ({ page }) => {
  await mockSupport(page, ['player-support'], { id: 7 }, {
    activity: [{ key: 'note-9', kind: 'afk_mail', actor: 'Game Master', recipient: 'Aranel', delivery: 'mail',
      text: 'Player was AFK: the Game Master tell was mailed to Aranel\nYour tunic is at the parcel merchant.', created_at: '2026-11-10T12:00:02Z' }],
  });
  const tell = { id: 9, kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: 'Your tunic is at the parcel merchant.', delivery: 'sent', created_at: '2026-11-10T12:00:00Z' } as Record<string, unknown>;
  const other = { id: 10, kind: 'chat_out', actor: 'Guide', recipient: 'Aranel', text: 'Second try.', delivery: 'sent', created_at: '2026-11-10T12:05:00Z' } as Record<string, unknown>;
  await page.route(`**${endpoint}/${caseKey}/chat?*`, route => route.request().method() === 'GET'
    ? route.fulfill({ json: { state: 'ready', active: true, recipient: 'Aranel', companion: 'ready', cursor: 10, messages: [tell, other] } })
    : route.fallback());
  await page.goto(`/admin/player-support?case=${caseKey}`);
  // The timeline line.
  const line = page.locator('.kind-afk_mail');
  await expect(line.getByRole('heading', { name: /Forwarded by mail, player AFK/ })).toBeVisible();
  await expect(line).toContainText('Player was AFK: the Game Master tell was mailed to Aranel');

  await page.getByRole('tab', { name: /^Live chat/ }).click();
  const transcript = page.getByRole('log', { name: 'Chat messages' });
  await expect(transcript.getByText('Your tunic is at the parcel merchant.')).toBeVisible();
  await expect(transcript.locator('.chat-afk-badge')).toHaveCount(0);

  // The next poll brings the change in, without a reload.
  tell.afk = 'mailed';
  tell.afk_at = '2026-11-10T12:00:02Z';
  other.afk = 'failed';
  other.afk_at = '2026-11-10T12:05:01Z';
  const forwarded = transcript.locator('.chat-message').filter({ hasText: 'Your tunic is at the parcel merchant.' });
  await expect(forwarded).toHaveClass(/is-afk/);
  const badge = forwarded.locator('.chat-afk-badge');
  await expect(badge).toContainText('AFK · sent by mail');
  await expect(badge.locator('time')).toHaveAttribute('datetime', '2026-11-10T12:00:02Z');
  // One element: the full sentence is its tooltip and what a screen reader hears.
  await expect(badge).toHaveAttribute('title', /^Aranel was AFK; this message was also sent by in-game mail \(.+\)\.$/);
  await expect(badge.locator('.sr-only')).toHaveText(/^Aranel was AFK; this message was also sent by in-game mail/);
  await expect(transcript.getByRole('note')).toHaveCount(0);
  await expect(transcript.locator('.chat-system-row')).toHaveCount(0);

  const failed = transcript.locator('.chat-message').filter({ hasText: 'Second try.' });
  await expect(failed).toHaveClass(/is-afk-failed/);
  const failedBadge = failed.locator('.chat-afk-badge.is-failed');
  await expect(failedBadge).toContainText('AFK · mail failed');
  await expect(failedBadge).toHaveAttribute('title', /Send it again or use Reply by mail\.$/);
  // Amber for forwarded, the danger colour for a failed mail.
  const colour = (locator: typeof badge) => locator.evaluate(element => getComputedStyle(element).color);
  expect(await colour(badge)).not.toBe(await colour(failedBadge));

  // At phone width the badge and the row still fit.
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(forwarded.locator('.chat-afk-badge')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
