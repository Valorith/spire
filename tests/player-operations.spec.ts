import { expect, Page, test } from '@playwright/test';

type PlayerOperationsMockState = {
  character: Record<string, unknown>;
  account: Record<string, unknown>;
  guild: Record<string, unknown>;
  characterUpdate?: Record<string, unknown>;
  accessUpdate?: Record<string, unknown>;
  sanctionUpdate?: Record<string, unknown>;
};

const characterContext = {
  account: { id: 101, name: 'CodexAlder', status: 0 },
  guild: {
    character_id: 1,
    guild_id: 201,
    guild_name: 'Keepers of the Spire',
    rank: 1,
    rank_title: 'Guild Leader',
    banker: true,
    alt: false,
    tribute: true,
    public_note: 'Raid coordinator',
    total_tribute: 12000,
    online: true,
  },
  zone: {
    id: 202,
    version: 0,
    short_name: 'poknowledge',
    long_name: 'The Plane of Knowledge',
    safe_x: -285,
    safe_y: 148,
    safe_z: -159,
    safe_heading: 0,
  },
  currency: {
    platinum: 28,
    gold: 4,
    silver: 0,
    copper: 8,
    platinum_bank: 144,
    gold_bank: 12,
    silver_bank: 8,
    copper_bank: 1,
    radiant_crystals: 3,
    ebon_crystals: 2,
  },
  binds: [],
  related_counts: {
    inventory: 3,
    keyring: 1,
    mail: 2,
    parcels: 0,
    tasks: 4,
    data_buckets: 2,
    alternate_currencies: 1,
    expedition_lockouts: 0,
  },
};

function characterRecord() {
  return {
    id: 1,
    account_id: 101,
    account_name: 'CodexAlder',
    name: 'Alder',
    last_name: 'Brightward',
    title: 'Pathfinder',
    suffix: 'of Qeynos',
    zone_id: 202,
    zone_instance: 0,
    x: -285,
    y: 148,
    z: -159,
    heading: 0,
    gender: 0,
    race: 1,
    class: 3,
    level: 65,
    deity: 208,
    last_login: 1784834994,
    time_played: 86400,
    anon: 0,
    gm: 0,
    experience: 100,
    experience_enabled: true,
    aa_points: 18,
    aa_points_spent: 40,
    aa_experience: 0,
    practice_points: 245,
    pvp: false,
    show_helm: true,
    group_auto_consent: true,
    raid_auto_consent: true,
    guild_auto_consent: true,
    autosplit: true,
    looking_for_group: true,
    looking_for_players: false,
    online: true,
  };
}

function accountRecord() {
  return {
    id: 101,
    name: 'CodexAlder',
    character_name: 'Alder',
    auto_login_name: '',
    shared_platinum: 1250,
    status: 0,
    login_server: 'eqemu',
    login_server_id: 101,
    gm_speed: false,
    invulnerable: false,
    fly_mode: 0,
    ignore_tells: false,
    revoked: false,
    karma: 42,
    mini_login_ip: '',
    hidden: false,
    rules_accepted: true,
    created_at_unix: 1784230194,
    ban_reason: '',
    suspension_reason: '',
  };
}

function guildRecord() {
  return {
    id: 201,
    name: 'Keepers of the Spire',
    leader_id: 1,
    leader_name: 'Alder',
    min_status: 0,
    motd: 'Welcome, Keepers.',
    motd_setter: 'Alder',
    channel: 'keepers',
    url: '',
    tribute: 42400,
    favor: 18750,
  };
}

async function installPlayerOperationsMocks(page: Page, state: PlayerOperationsMockState) {
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

  await page.route('**/api/v1/player-operations/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/player-operations', '');
    const fulfill = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path === '/summary') {
      return fulfill({
        accounts: 1,
        suspended_accounts: 0,
        characters: 1,
        online_characters: 1,
        retired_characters: 0,
        guilds: 1,
        guild_members: 1,
      });
    }
    if (path === '/characters') {
      return fulfill({ data: [state.character], total: 1, page: 1, limit: 30 });
    }
    if (path === '/accounts') {
      return fulfill({
        data: [{ id: 101, name: 'CodexAlder', status: 0, character_count: 1, online_characters: 1, last_login: 1784834994 }],
        total: 1,
        page: 1,
        limit: 30,
      });
    }
    if (path === '/guilds') {
      return fulfill({
        data: [{ id: 201, name: 'Keepers of the Spire', leader_id: 1, leader_name: 'Alder', member_count: 1, bank_items: 0, favor: 18750 }],
        total: 1,
        page: 1,
        limit: 30,
      });
    }
    if (path === '/character/1' && request.method() === 'GET') {
      return fulfill({ character: state.character, context: characterContext });
    }
    if (path === '/character/2' && request.method() === 'GET') {
      return fulfill({
        character: { ...state.character, id: 2, name: 'Beryl' },
        context: characterContext,
      });
    }
    if (path === '/character/1' && request.method() === 'PATCH') {
      state.characterUpdate = request.postDataJSON();
      state.character = { ...state.character, ...state.characterUpdate };
      return fulfill({ audit_id: 11, detail: { character: state.character, context: characterContext } });
    }
    if (path === '/character/1/retire' && request.method() === 'POST') {
      state.character = {
        ...state.character,
        name: 'Alder-deleted-1',
        deleted_at: '2026-07-26T12:00:00Z',
        online: false,
      };
      return fulfill({ audit_id: 12, detail: { character: state.character, context: characterContext } });
    }
    if (path === '/character/1/restore' && request.method() === 'POST') {
      state.character = { ...state.character, name: 'Alder', deleted_at: null };
      return fulfill({ audit_id: 13, detail: { character: state.character, context: characterContext } });
    }
    if (path === '/account/101') {
      return fulfill({
        account: state.account,
        characters: [state.character],
        ips: [{ ip: '127.0.0.1', count: 3, last_used: '2026-07-26T12:00:00Z' }],
        flags: [{ name: 'beta_access', value: '1' }],
        rewards: [{ reward_id: 1, amount: 2 }],
      });
    }
    if (path === '/account/101/sanction' && request.method() === 'POST') {
      state.sanctionUpdate = request.postDataJSON();
      state.account = { ...state.account, suspended_until: state.sanctionUpdate.until };
      return fulfill({
        audit_id: 14,
        detail: {
          account: state.account,
          characters: [state.character],
          ips: [{ ip: '127.0.0.1', count: 3, last_used: '2026-07-26T12:00:00Z' }],
          flags: [{ name: 'beta_access', value: '1' }],
          rewards: [{ reward_id: 1, amount: 2 }],
        },
      });
    }
    if (path === '/guild/201' && request.method() === 'GET') {
      return fulfill({
        guild: state.guild,
        members: [state.character],
        memberships: [characterContext.guild],
        ranks: [
          { rank: 1, title: 'Guild Leader' },
          { rank: 2, title: 'Officer' },
          { rank: 3, title: 'Veteran' },
          { rank: 4, title: 'Member' },
          { rank: 5, title: 'Junior Member' },
          { rank: 6, title: 'Initiate' },
          { rank: 7, title: 'Recruit' },
          { rank: 8, title: 'Applicant' },
        ],
        permissions: [{ id: 1, permission: 1 }],
        bank: { item_count: 0, slots_used: 0 },
        relations: [],
      });
    }
    if (path === '/guild/201/access' && request.method() === 'PATCH') {
      state.accessUpdate = request.postDataJSON();
      return fulfill({
        audit_id: 14,
        detail: {
          guild: state.guild,
          members: [state.character],
          memberships: [characterContext.guild],
          ranks: state.accessUpdate.ranks,
          permissions: state.accessUpdate.permissions,
          bank: { item_count: 0, slots_used: 0 },
          relations: [],
        },
      });
    }
    return fulfill({ error: `unmocked player-operations route: ${request.method()} ${path}` }, 501);
  });
}

test.describe('Player Operations', () => {
  test('keeps the record-type surface responsive', async ({ page }) => {
    const state: PlayerOperationsMockState = {
      character: characterRecord(),
      account: accountRecord(),
      guild: guildRecord(),
    };
    await installPlayerOperationsMocks(page, state);
    await page.goto('/admin/player-operations?mode=characters&tab=Overview&character=1');

    const modeSwitch = page.getByRole('tablist', { name: 'Player operations record type' });
    await expect(modeSwitch).toBeVisible();
    await expect(page.getByTestId('player-operations-inspector')).toBeVisible();
    await expect(page.locator('.spire-editor-directory .eq-window-simple')).toBeVisible();
    await expect(page.locator('.spire-editor-inspector .eq-window-simple')).toHaveCount(2);

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 760, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      const geometry = await modeSwitch.evaluate(element => {
        const panel = element as HTMLElement;
        const panelStyle = getComputedStyle(panel);
        const tabs = Array.from(panel.querySelectorAll('[role="tab"]')).map(tab => {
          const rect = tab.getBoundingClientRect();
          const style = getComputedStyle(tab);
          return {
            left: rect.left,
            right: rect.right,
            width: rect.width,
            background: style.backgroundColor,
            border: style.borderColor,
          };
        });
        return {
          overflow: panel.scrollWidth - panel.clientWidth,
          background: panelStyle.backgroundImage,
          border: panelStyle.borderColor,
          tabs,
        };
      });

      expect(geometry.overflow).toBeLessThanOrEqual(1);
      expect(geometry.background).not.toBe('none');
      expect(geometry.border).not.toBe('rgba(0, 0, 0, 0)');
      expect(geometry.tabs).toHaveLength(3);
      geometry.tabs.forEach(tab => expect(tab.width).toBeGreaterThan(100));
      expect(geometry.tabs[0].right).toBeLessThanOrEqual(geometry.tabs[1].left + 1);
      expect(geometry.tabs[1].right).toBeLessThanOrEqual(geometry.tabs[2].left + 1);
    }
  });

  test('synchronizes browser history and query-aware navigation', async ({ page }) => {
    const state: PlayerOperationsMockState = {
      character: characterRecord(),
      account: accountRecord(),
      guild: guildRecord(),
    };
    await installPlayerOperationsMocks(page, state);
    await page.goto('/admin/player-operations?mode=characters&tab=Overview&character=1');

    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('character', '2');
      window.history.pushState({ playerOperationsTest: true }, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.getByTestId('player-operations-inspector').locator('h2')).toHaveText('Beryl');
    const activeCharacterNav = page.locator('a[href="/admin/player-operations?mode=characters"]');
    await expect(activeCharacterNav).toHaveAttribute('aria-current', 'page');
    await expect(activeCharacterNav).toHaveClass(/active/);
  });

  test('submits an account sanction independently', async ({ page }) => {
    const state: PlayerOperationsMockState = {
      character: characterRecord(),
      account: accountRecord(),
      guild: guildRecord(),
    };
    await installPlayerOperationsMocks(page, state);
    await page.goto('/admin/player-operations?mode=accounts&tab=Overview&account=101');

    await expect(page.getByRole('heading', { name: 'CodexAlder' })).toBeVisible();
    await expect(page.getByTestId('player-operations-account-delete')).toBeDisabled();
    await page.locator('#player-operations-account-shared-plat').fill('1251');
    await expect(page.getByText('Unsaved', { exact: true })).toBeVisible();
    await page.getByRole('tab', { name: 'Access & Safety', exact: true }).click();
    await expect(page.getByText(/Transfer every character, including retired records/)).toBeVisible();
    const sanctionUntil = page.locator('#player-operations-sanction-until');
    await expect(sanctionUntil).toHaveAttribute('type', 'datetime-local');
    await expect(sanctionUntil).toHaveAttribute('step', '60');
    await expect(sanctionUntil).toHaveAttribute('min', /T\d{2}:\d{2}$/);
    const localSuspension = '2035-01-02T13:45';
    await sanctionUntil.fill(localSuspension);
    await page.locator('#player-operations-sanction-reason').fill('Validating the temporary suspension workflow');
    const sanctionRequest = page.waitForRequest(request =>
      request.method() === 'POST' &&
      new URL(request.url()).pathname.endsWith('/player-operations/account/101/sanction')
    );
    const discardDialog = page.waitForEvent('dialog');
    const applyRestriction = page.getByRole('button', { name: 'Apply restriction' }).click();
    const dialog = await discardDialog;
    expect(dialog.message()).toContain('Discard unsaved profile changes');
    await dialog.accept();
    await Promise.all([sanctionRequest, applyRestriction]);
    expect(state.sanctionUpdate).toBeDefined();
    expect(new Date(String(state.sanctionUpdate?.until)).toISOString()).toBe(new Date(localSuspension).toISOString());
  });

  test('renders guild roster ranks independently', async ({ page }) => {
    const state: PlayerOperationsMockState = {
      character: characterRecord(),
      account: accountRecord(),
      guild: guildRecord(),
    };
    await installPlayerOperationsMocks(page, state);
    await page.goto('/admin/player-operations?mode=guilds&tab=Members&guild=201');

    await expect(page.getByTestId('player-operations-inspector').locator('h2')).toHaveText('Keepers of the Spire');
    await expect(page.getByRole('row', { name: /Alder #1/ })).toContainText('Guild Leader');
  });

  test('persists character changes and requires typed lifecycle confirmation', async ({ page }) => {
    const state: PlayerOperationsMockState = {
      character: characterRecord(),
      account: accountRecord(),
      guild: guildRecord(),
    };
    await installPlayerOperationsMocks(page, state);
    await page.goto('/admin/player-operations?mode=characters&tab=Overview&character=1');

    await page.locator('#player-operations-character-last-name').fill('QAVerified');
    await page.getByRole('checkbox', { name: /GM flagged/ }).check();
    await expect(page.getByText('Unsaved', { exact: true })).toBeVisible();
    await Promise.all([
      page.waitForRequest(request =>
        request.method() === 'PATCH' &&
        new URL(request.url()).pathname.endsWith('/player-operations/character/1')
      ),
      page.getByTestId('player-operations-save').click(),
    ]);
    expect(state.characterUpdate).toMatchObject({
      name: 'Alder',
      last_name: 'QAVerified',
      race: 1,
      class: 3,
      deity: 208,
      gm: 1,
    });

    await page.getByTestId('player-operations-character-lifecycle').click();
    const confirmButton = page.getByRole('button', { name: /Retire character/ });
    await expect(confirmButton).toBeDisabled();
    await page.locator('#player-operations-confirm-reason').fill('Validating the reversible retirement workflow');
    await page.locator('#player-operations-confirm-text').fill('Alder');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
    await expect(page.getByRole('heading', { name: 'Alder-deleted-1', exact: true })).toBeVisible();
    await expect(page.getByTestId('player-operations-character-lifecycle')).toContainText('Restore');
  });

  test('saves human-readable guild ranks through the named permission matrix', async ({ page }) => {
    const state: PlayerOperationsMockState = {
      character: characterRecord(),
      account: accountRecord(),
      guild: guildRecord(),
    };
    await installPlayerOperationsMocks(page, state);
    await page.goto('/admin/player-operations?mode=guilds&tab=Ranks%20%26%20Access&guild=201');

    await page.locator('#player-operations-rank-8').fill('Prospect');
    await page.getByLabel('Guild invite for Officer').check();
    await page.locator('#player-operations-access-reason').fill('Updating officer access after guild review');
    await page.getByRole('button', { name: 'Save access model' }).click();

    await expect(page.getByRole('status')).toContainText('Guild access model saved');
    expect(state.accessUpdate).toBeDefined();
    expect(state.accessUpdate?.reason).toBe('Updating officer access after guild review');
    expect(state.accessUpdate?.ranks).toEqual(expect.arrayContaining([{ rank: 8, title: 'Prospect' }]));
    const guildInvite = (state.accessUpdate?.permissions as Array<{ id: number; permission: number }>).find(permission => permission.id === 1);
    expect(Number(guildInvite?.permission) & 1).toBe(1);
    expect(Number(guildInvite?.permission) & 64).toBe(64);
  });
});
