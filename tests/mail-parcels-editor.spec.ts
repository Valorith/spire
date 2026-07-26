import { expect, Page, test } from '@playwright/test';

type MailParcelsMockState = {
  directMailPayload?: Record<string, unknown>;
  broadcastMailPayload?: Record<string, unknown>;
  parcelPayload?: Record<string, unknown>;
  augmentSearch?: { scope: string | null; socketType: string | null };
  directoryRequests?: number;
  broadcastAudienceRequests?: number;
};

const character = {
  id: 940001,
  name: 'CodexCourier',
  account_id: 940001,
  level: 50,
  class: 1,
  race: 1,
  parcel_count: 1,
  mail_count: 1,
};

const secondCharacter = {
  ...character,
  id: 940002,
  name: 'CodexReceiver',
  account_id: 940002,
  parcel_count: 0,
  mail_count: 0,
};

const mail = {
  msg_id: 1,
  character_id: character.id,
  character_name: character.name,
  timestamp: 1785109205,
  from: 'Server Staff',
  subject: 'Welcome to the server',
  body: 'Your account is ready.',
  to: character.name,
  status: 1,
};

const parcel = {
  id: 1,
  character_id: character.id,
  character_name: character.name,
  item_id: 1003,
  item_name: 'Cage of Transmutation',
  item_icon: 123,
  item_no_drop: 1,
  item_bag_slots: 10,
  augment_1: 0,
  augment_2: 0,
  augment_3: 0,
  augment_4: 0,
  augment_5: 0,
  augment_6: 0,
  slot_id: 1,
  quantity: 1,
  from_name: 'Server Staff',
  note: 'Baseline parcel.',
  sent_date: '2026-07-26 18:05:00',
  sent_timestamp: 1785103500,
  content_count: 0,
};

const clothCap = {
  id: 1001,
  name: 'Cloth Cap',
  icon: 500,
  stackable: 0,
  stack_size: 1,
  max_charges: 0,
  no_drop: 1,
  bag_slots: 0,
  bag_type: 0,
  augment_type: 0,
  augment_slot_1_type: 7,
  augment_slot_2_type: 0,
  augment_slot_3_type: 0,
  augment_slot_4_type: 0,
  augment_slot_5_type: 0,
  augment_slot_6_type: 0,
  evolving_level: 0,
};

const clothVeil = {
  ...clothCap,
  id: 1002,
  name: 'Cloth Veil',
  icon: 501,
  augment_slot_1_type: 0,
};

const socketRune = {
  ...clothCap,
  id: 2001,
  name: 'Rune of QA',
  icon: 502,
  augment_type: 64,
  augment_slot_1_type: 0,
};

async function installMailParcelsMocks(page: Page, state: MailParcelsMockState) {
  // Register the broad handler first because Playwright resolves matching routes LIFO.
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
          os: 'linux',
        },
      }),
    })
  );

  await page.route('**/api/v1/mail-parcels-editor/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/mail-parcels-editor', '');
    const fulfill = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path === '/summary') {
      return fulfill({
        mail_count: 1,
        unread_count: 1,
        trash_count: 0,
        parcel_count: 1,
        container_count: 0,
        parcel_capacity: 50,
        money_parcel_item: 99990,
      });
    }
    if (path === '/mail' && request.method() === 'GET') {
      state.directoryRequests = Number(state.directoryRequests || 0) + 1;
      return fulfill({ data: [mail], total: 1, page: 1, limit: 30 });
    }
    if (path === '/mail/1' && request.method() === 'GET') {
      return fulfill(mail);
    }
    if (path === '/parcels' && request.method() === 'GET') {
      return fulfill({ data: [parcel], total: 1, page: 1, limit: 30 });
    }
    if (path === '/parcel/1' && request.method() === 'GET') {
      return fulfill({ parcel, content: [] });
    }
    if (path === '/characters') {
      return fulfill({ data: [character, secondCharacter], total: 2, page: 1, limit: 12 });
    }
    if (path === '/items') {
      const scope = url.searchParams.get('scope');
      const socketType = url.searchParams.get('socket_type');
      if (scope === 'augment') {
        state.augmentSearch = { scope, socketType };
        return fulfill({ data: [socketRune], total: 1, page: 1, limit: 12 });
      }
      const query = (url.searchParams.get('q') || '').toLowerCase();
      const data = query.includes('veil') ? [clothVeil] : [clothCap];
      return fulfill({ data, total: data.length, page: 1, limit: 12 });
    }
    if (path === '/broadcast/audience') {
      state.broadcastAudienceRequests = (state.broadcastAudienceRequests || 0) + 1;
      return fulfill({
        recipient_count: 2,
        recipients: [character, secondCharacter],
        confirmation: 'BROADCAST TO 2 CHARACTERS',
      });
    }
    if (path === '/mail/send' && request.method() === 'PUT') {
      state.directMailPayload = request.postDataJSON();
      return fulfill({
        audience: 'direct',
        recipient_count: 1,
        message_count: 1,
        message_ids: [101],
        recipients: [character],
        audit_id: 601,
      }, 201);
    }
    if (path === '/broadcast/mail/send' && request.method() === 'PUT') {
      state.broadcastMailPayload = request.postDataJSON();
      return fulfill({
        audience: 'broadcast',
        recipient_count: 2,
        message_count: 2,
        message_ids: [102, 103],
        recipients: [character, secondCharacter],
        audit_id: 602,
      }, 201);
    }
    if (path === '/parcel/send' && request.method() === 'PUT') {
      state.parcelPayload = request.postDataJSON();
      return fulfill({
        character_id: character.id,
        character_name: character.name,
        parcel_count: 2,
        deliveries: [
          {
            client_key: 'parcel-1',
            parcel: { ...parcel, id: 201, item_id: clothCap.id, item_name: clothCap.name, slot_id: 2 },
            player_event_log_id: 501,
          },
          {
            client_key: 'parcel-2',
            parcel: { ...parcel, id: 202, item_id: clothVeil.id, item_name: clothVeil.name, slot_id: 3 },
            player_event_log_id: 502,
          },
        ],
        audit_id: 603,
      }, 201);
    }
    if (path === '/audit') {
      return fulfill({ data: [], total: 0, page: 1, limit: 30 });
    }
    return fulfill([]);
  });
}

test.describe('Mail & Parcels Editor', () => {
  test('loads a native responsive workspace with authoritative status and no false dirty state', async ({ page }) => {
    const state: MailParcelsMockState = {};
    await installMailParcelsMocks(page, state);
    await page.goto('/admin/mail-parcels?mode=mail&tab=Delivery&mail=1');

    await expect(page.getByRole('heading', { name: /Mail & Parcels/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Mail & Parcels/ })).toBeVisible();
    await expect(page.getByTestId('mail-parcels-inspector')).toBeVisible();
    await expect(page.getByLabel('Mailbox status: Unread')).toBeVisible();
    await expect(page.getByText('Unsaved', { exact: true })).toHaveCount(0);
    await expect(page.locator('#mail-parcels-mail-sent-at')).toHaveAttribute('step', '1');

    const directoryRequests = Number(state.directoryRequests || 0);
    const refreshDirectory = page.getByRole('button', { name: 'Refresh mailbox messages' });
    await expect(refreshDirectory).toBeVisible();
    await refreshDirectory.click();
    await expect.poll(() => Number(state.directoryRequests || 0)).toBeGreaterThan(directoryRequests);

    for (const viewport of [
      { width: 1600, height: 900 },
      { width: 1024, height: 900 },
      { width: 720, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      const geometry = await page.locator('.mail-parcels-editor-page').evaluate(element => {
        const pageElement = element as HTMLElement;
        const commandBar = pageElement.querySelector('.mail-parcels-command-bar') as HTMLElement;
        const modeSwitch = pageElement.querySelector('.mail-parcels-mode-switch') as HTMLElement;
        return {
          documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
          pageOverflow: pageElement.scrollWidth - pageElement.clientWidth,
          commandOverflow: commandBar.scrollWidth - commandBar.clientWidth,
          modeOverflow: modeSwitch.scrollWidth - modeSwitch.clientWidth,
        };
      });
      // The app shell's global body frame contributes a two-pixel edge outside
      // this editor; the Mail & Parcels surfaces themselves must not overflow.
      const geometryContext = JSON.stringify({ viewport, geometry });
      expect(geometry.documentOverflow, geometryContext).toBeLessThanOrEqual(2);
      expect(geometry.pageOverflow, geometryContext).toBeLessThanOrEqual(1);
      expect(geometry.commandOverflow, geometryContext).toBeLessThanOrEqual(1);
      expect(geometry.modeOverflow, geometryContext).toBeLessThanOrEqual(1);
    }

    await page.goto('/admin/mail-parcels?mode=parcels&tab=Package&parcel=1');
    const parcelItemSelection = page.getByTestId('parcel-item-selection');
    await expect(parcelItemSelection).toBeVisible();
    await expect(parcelItemSelection.getByText('Selected item')).toBeVisible();
    await expect(parcelItemSelection.getByText(/Single item|Stacks to/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh queued parcels' })).toBeVisible();
    await expect(page.getByText('Use 0 to choose the first free slot automatically.')).toBeVisible();
    await expect(page.getByLabel('Evolve progress')).toHaveCount(0);
    await page.getByRole('tab', { name: 'Delivery', exact: true }).click();
    await expect(page.locator('#mail-parcels-sent-date')).toHaveValue('2026-07-26T18:05');
  });

  test('sends direct and server-wide mail through the single tool authorization boundary', async ({ page }) => {
    const state: MailParcelsMockState = {};
    await installMailParcelsMocks(page, state);
    await page.goto('/admin/mail-parcels');

    await page.getByTestId('open-gm-mail').click();
    let dialog = page.getByRole('dialog', { name: 'GM Messaging' });
    await dialog.locator('#gm-mail-character-search').fill('CodexCourier');
    await expect(dialog.getByRole('button', { name: /CodexCourier Level 50/ })).toBeVisible();
    await dialog.getByRole('button', { name: /CodexCourier Level 50/ }).click();
    await dialog.locator('#gm-mail-subject').fill('Direct QA message');
    await dialog.locator('#gm-mail-body').fill('Testing a selected-character mailbox delivery.');
    await dialog.locator('#gm-mail-reason').fill('Validating the direct GM messaging workflow');
    await dialog.getByRole('button', { name: /Review delivery/ }).click();

    const directSend = dialog.getByRole('button', { name: /Send messages/ });
    await expect(directSend).toBeDisabled();
    await dialog.locator('#gm-mail-confirmation').fill('SEND TO 1 CHARACTER');
    await expect(directSend).toBeEnabled();
    await directSend.click();
    await expect(dialog.getByRole('status')).toContainText('1 unread message delivered');
    expect(state.directMailPayload).toMatchObject({
      character_ids: [character.id],
      subject: 'Direct QA message',
      confirmation: 'SEND TO 1 CHARACTER',
    });
    expect(Object.keys(state.directMailPayload || {}).some(key => key.toLowerCase().includes('permission'))).toBe(false);

    await dialog.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByTestId('open-gm-mail').click();
    dialog = page.getByRole('dialog', { name: 'GM Messaging' });
    await dialog.getByRole('radio', { name: /Server-wide/ }).click();
    await expect(dialog.getByText('2 active characters')).toBeVisible();
    await dialog.locator('#gm-mail-subject').fill('Broadcast QA message');
    await dialog.locator('#gm-mail-body').fill('Testing a guarded server-wide mailbox delivery.');
    await dialog.locator('#gm-mail-reason').fill('Validating the guarded broadcast workflow');
    await dialog.getByRole('button', { name: /Review delivery/ }).click();

    const broadcastSend = dialog.getByRole('button', { name: /Send server-wide/ });
    await expect(broadcastSend).toBeDisabled();
    await dialog.locator('#gm-mail-confirmation').fill('BROADCAST TO 2 CHARACTERS');
    await expect(broadcastSend).toBeEnabled();
    await broadcastSend.click();
    await expect(dialog.getByRole('status')).toContainText('2 unread messages delivered');
    expect(state.broadcastMailPayload).toMatchObject({
      character_ids: [],
      subject: 'Broadcast QA message',
      confirmation: 'BROADCAST TO 2 CHARACTERS',
    });
    expect(state.broadcastAudienceRequests).toBeGreaterThanOrEqual(3);
    expect(Object.keys(state.broadcastMailPayload || {}).some(key => key.toLowerCase().includes('permission'))).toBe(false);
  });

  test('creates one transactional parcel and player event per selected item', async ({ page }) => {
    const state: MailParcelsMockState = {};
    await installMailParcelsMocks(page, state);
    await page.goto('/admin/mail-parcels?mode=parcels');

    await page.getByTestId('open-gm-parcels').click();
    const dialog = page.getByRole('dialog', { name: 'GM Send Parcels' });
    await dialog.locator('#gm-parcel-character-search').fill('CodexCourier');
    await dialog.getByRole('button', { name: /CodexCourier Level 50/ }).click();

    let lines = dialog.locator('.gm-parcel-line');
    await lines.nth(0).getByRole('button', { name: /Choose an item/ }).click();
    let itemDialog = page.getByRole('dialog', { name: 'Choose item' });
    await itemDialog.locator('#mail-parcels-item-lookup').fill('Cloth Cap');
    await itemDialog.getByRole('button', { name: /^Cloth Cap #1001/ }).click();

    await lines.nth(0).getByRole('button', { name: /Empty socket Type 7/ }).click();
    itemDialog = page.getByRole('dialog', { name: 'Choose item' });
    await itemDialog.locator('#mail-parcels-item-lookup').fill('Rune');
    await itemDialog.getByRole('button', { name: /^Rune of QA #2001/ }).click();
    expect(state.augmentSearch).toEqual({ scope: 'augment', socketType: '7' });

    await dialog.getByRole('button', { name: /Add parcel/ }).click();
    lines = dialog.locator('.gm-parcel-line');
    await expect(lines).toHaveCount(2);
    await lines.nth(1).getByRole('button', { name: /Choose an item/ }).click();
    itemDialog = page.getByRole('dialog', { name: 'Choose item' });
    await itemDialog.locator('#mail-parcels-item-lookup').fill('Cloth Veil');
    await itemDialog.getByRole('button', { name: /^Cloth Veil #1002/ }).click();

    await dialog.locator('#gm-parcel-note').fill('Two independent parcel messages.');
    await dialog.locator('#gm-parcel-reason').fill('Validating atomic multi-parcel GM delivery');
    await dialog.getByRole('button', { name: /Review 2 parcels/ }).click();
    await expect(dialog.getByText('2 separate parcel messages for CodexCourier')).toBeVisible();
    const send = dialog.getByRole('button', { name: /Send parcels/ });
    await expect(send).toBeDisabled();
    await dialog.locator('#gm-parcel-confirmation').fill('SEND 2 PARCELS TO CodexCourier');
    await expect(send).toBeEnabled();
    await send.click();

    await expect(dialog.getByRole('status')).toContainText('2 separate parcels queued for CodexCourier');
    await expect(dialog.getByText(/player event #501/)).toBeVisible();
    await expect(dialog.getByText(/player event #502/)).toBeVisible();
    expect(state.parcelPayload).toMatchObject({
      character_id: character.id,
      confirmation: 'SEND 2 PARCELS TO CodexCourier',
    });
    const parcelItems = state.parcelPayload?.items as Array<Record<string, unknown>>;
    expect(parcelItems).toHaveLength(2);
    expect(parcelItems[0]).toMatchObject({ item_id: clothCap.id, augment_1: socketRune.id, quantity: 1 });
    expect(parcelItems[1]).toMatchObject({ item_id: clothVeil.id, quantity: 1 });
    expect(Object.keys(state.parcelPayload || {}).some(key => key.toLowerCase().includes('permission'))).toBe(false);
  });
});
