import { expect, Page, test } from '@playwright/test';

const submitted = 1794116400;
const endpoint = '/api/v1/player-support/cases';
const caseKey = '731-' + submitted;

async function mockSupport(page: Page, write: string[], connection = { id: 7 }, overrides: Record<string, unknown> = {}) {
  const record = {
    key: caseKey, petition_id: 100, character_id: 100, character: 'Aranel', account: 'norrathguide',
    zone: 'sebilis', message: 'My Fungi Tunic disappeared after a trade.', urgency: 2, submitted_at: submitted,
    status: 'open', owner: '', mine: false, native_open: true, checked_out: false, revision: 0, account_presence: 'online',
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
    connection_id: 7, read_all: false, write_all: false, read: ['player-support', 'mail-parcels-editor', 'player-operations'], write,
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
        state: record.status === 'resolved' ? 'unavailable' : 'ready', active, messages, cursor: messages.length,
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
    if (request.method() === 'GET') {
      if (path === endpoint) {
        const filter = url.searchParams.get('filter');
        const cases = filter === 'unassigned' ? [otherCase] : [record, otherCase];
        return route.fulfill({ json: {
          connection_id: connection.id, cases, total: cases.length,
          summary: { active: 2, urgent: 2, unassigned: 1, waiting: 0, mine: 0 },
        } });
      }
      if (path.endsWith('/recovery')) return route.fulfill({ json: { character: location, corpses, local_world: true, live_destination: true } });
      if (path.endsWith('/corpses/42')) return route.fulfill({ json: { items: [{ id: 2730, icon: 590, name: 'Fungus Covered Scale Tunic' }] } });
      return route.fulfill({ json: { case: record, activity } });
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
    if (path.endsWith('/parcel')) {
      activity.push({ key: 'delivery-981', kind: 'parcel', text: 'Fungus Covered Scale Tunic × 1', receipt: [42], actor: 'Guide', created_at: new Date().toISOString() });
      return route.fulfill({ status: 201, json: {
        audit_id: 981, character_name: record.character, parcel_count: 1,
        deliveries: [{ parcel: { id: 42, item_name: 'Fungus Covered Scale Tunic', slot_id: 1 }, player_event_log_id: 58 }],
      } });
    }
    if (input.action === 'resolve') {
      record.status = 'resolved';
      active = false;
    } else if (input.action === 'reopen') {
      record.status = 'open';
    } else if (input.action === 'claim') {
      record.owner = 'Guide';
      record.mine = true;
    }
    record.revision++;
    return route.fulfill({ status: 204 });
  });
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
