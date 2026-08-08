import { expect, Page, test } from '@playwright/test';

const characterID = 1015;
const achievementID = 1001;
const orphanAchievementID = 9900;
const rewardID = '9007199254740993';
const automaticRewardID = '9007199254740994';
const rewardSetID = 300;
const mutationID = '18446744073709551610';

type CapturedRequest = {
  method: string;
  path: string;
  body: Record<string, unknown>;
};

type CharacterAchievementMockState = {
  schemaReady: boolean;
  character: Record<string, unknown>;
  characters: Record<string, unknown>[];
  detail: Record<string, any>;
  details: Record<number, Record<string, any>>;
  detailDelays: Record<number, number>;
  requests: CapturedRequest[];
  characterRequests: number;
  schemaRequests: number;
  detailRequestURLs: string[];
  detailTotal: number;
  auditPages: Record<string, { data: Record<string, any>[]; total: number }>;
  auditDelays: Record<string, number>;
};

const metadata = {
  component_types: [
    { value: 0, label: 'Completion', help: 'A state-bearing completion component.' },
    { value: 1, label: 'Indirect', help: 'A state-bearing indirect component.' },
    { value: 2, label: 'Display', help: 'A state-bearing display component.' },
    { value: 3, label: 'Presentation only', help: 'A client-only presentation component.' },
  ],
  events: [
    { value: 2, label: 'NPC type kill', help: 'Counts kills of one NPC type.' },
  ],
  progress_modes: [
    { value: 0, label: 'Increment', help: 'Adds event progress.' },
  ],
  behaviors: [
    { value: 0, label: 'Required', help: 'Must be satisfied.' },
  ],
  reward_types: [
    { value: 0, label: 'Item', help: 'Grants an item.' },
  ],
  character_reward_statuses: [
    { value: 0, label: 'In-flight / ambiguous', help: 'Delivery may have occurred.' },
    { value: 1, label: 'Delivered', help: 'Durably finalized.' },
    { value: 2, label: 'Retryable failure', help: 'Eligible for another attempt.' },
  ],
  character_selection_statuses: [
    { value: 0, label: 'Pending / in progress', help: 'Selection is not finalized.' },
    { value: 1, label: 'Fully granted', help: 'All selected grants finalized.' },
    { value: 2, label: 'Retryable failure', help: 'Eligible for retry.' },
    { value: 3, label: 'Ambiguous delivery', help: 'One or more entries may have arrived.' },
  ],
  mutation_target_types: [
    { value: 2, label: 'Raid', help: 'Expanded from a raid event.' },
  ],
  mutation_operations: [
    { value: 0, label: 'Progress floor', help: 'Raises progress to a minimum value.' },
  ],
  character_mutation_statuses: [
    { value: 0, label: 'Pending', help: 'Waiting for a zone consumer.' },
    { value: 1, label: 'Blocked', help: 'Retained with a diagnostic.' },
    { value: 2, label: 'Processing', help: 'Owned by a live lease.' },
  ],
};

function characterRecord(ingame = false) {
  return {
    id: characterID,
    account_id: 77,
    name: 'Lyric',
    level: 60,
    class: 8,
    ingame,
    last_login: 1786156200,
    achievement_completion_count: 132,
    achievement_progress_count: 2,
    achievement_progress_row_count: 2,
    achievement_progress_total: '29',
  };
}

function detailFixture(): Record<string, any> {
  return {
    character: characterRecord(false),
    definitions: [
      {
        id: achievementID,
        name: 'Master Duelist',
        description: 'Reach the authored combat milestone.',
        icon_id: 42,
        points: 10,
        definition_version: 4,
        enabled: true,
        category_count: 1,
        component_count: 1,
        criterion_count: 1,
        reward_count: 1,
        restriction_count: 0,
        reward_set_count: 1,
        category_names: 'Combat',
      },
      {
        id: orphanAchievementID,
        name: `Deleted definition #${orphanAchievementID}`,
        description: '',
        icon_id: 0,
        points: 0,
        definition_version: 0,
        enabled: false,
        category_count: 0,
        component_count: 0,
        criterion_count: 0,
        reward_count: 0,
        restriction_count: 0,
        orphaned: true,
      },
    ],
    associations: [
      { achievement_id: achievementID, category_id: 7, sequence: 1, display_text: 'Combat feats', category_name: 'Combat' },
    ],
    components: [
      {
        achievement_id: achievementID,
        component_type: 1,
        sequence: 5,
        component_id: 152250,
        description: 'Reach the maximum skill in Dual Wield.',
        description_2: 'Progress is checked against the current cap.',
        presentation_count: 30,
      },
    ],
    criteria: [
      {
        id: 'criterion-1',
        achievement_id: achievementID,
        component_type: 1,
        component_sequence: 5,
        component_id: 152250,
        event_type: 2,
        progress_mode: 0,
        behavior: 0,
        target_id: 501,
        target_id2: 0,
        target_value: 0,
        required_count: 30,
        enabled: true,
      },
    ],
    rewards: [
      {
        reward_id: rewardID,
        achievement_id: achievementID,
        sequence: 1,
        reward_type: 0,
        reward_data_id: 990061,
        amount: '1',
        description: 'Rallos Zek Badass Axe Ornament',
        enabled: true,
      },
      {
        reward_id: automaticRewardID,
        achievement_id: achievementID,
        sequence: 2,
        reward_type: 2,
        reward_data_id: 0,
        amount: '1',
        description: 'Automatic Alternate Advancement Point',
        enabled: true,
      },
    ],
    reward_sets: [
      { reward_set_id: rewardSetID, achievement_id: achievementID, title: 'Ornament choice', enabled: true },
    ],
    reward_options: [
      { reward_set_id: rewardSetID, option_id: 10, sequence: 1, label: 'Axe ornament', common_to_all: false, flags: 0, enabled: true },
    ],
    reward_option_entries: [
      { reward_set_id: rewardSetID, option_id: 10, reward_id: rewardID },
    ],
    restrictions: [],
    completions: [],
    progress: [
      {
        character_id: characterID,
        achievement_id: achievementID,
        component_type: 1,
        component_sequence: 5,
        component_id: 152250,
        current_count: '22',
        completed: false,
        definition_version: 4,
        updated_at: 1786156200,
      },
      {
        character_id: characterID,
        achievement_id: orphanAchievementID,
        component_type: 1,
        component_sequence: 1,
        component_id: 777,
        current_count: '7',
        completed: false,
        definition_version: 1,
        updated_at: 1786156100,
      },
    ],
    reward_ledgers: [
      {
        character_id: characterID,
        achievement_id: achievementID,
        reward_id: rewardID,
        status: 0,
        attempt_count: 2,
        granted_at: 0,
        last_attempt_at: 1786156200,
        last_error: 'Connection closed before final ledger persistence.',
      },
      {
        character_id: characterID,
        achievement_id: achievementID,
        reward_id: automaticRewardID,
        status: 0,
        attempt_count: 1,
        granted_at: 0,
        last_attempt_at: 1786156200,
        last_error: 'Automatic grant ledger persistence was interrupted.',
      },
    ],
    reward_selections: [
      {
        character_id: characterID,
        achievement_id: achievementID,
        reward_set_id: rewardSetID,
        selected_option_id: 10,
        status: 3,
        attempt_count: 1,
        claimed_at: 0,
        last_attempt_at: 1786156200,
        last_error: 'Selected bundle has ambiguous delivery state.',
      },
    ],
    pending_mutations: [
      {
        mutation_id: mutationID,
        character_id: characterID,
        source_target_type: 2,
        source_target_id: '88',
        operation: 0,
        achievement_id: achievementID,
        component_type: 1,
        component_id: 152250,
        requested_value: 25,
        definition_version: 4,
        status: 1,
        attempt_count: 3,
        created_at: 1786156000,
        last_attempt_at: 1786156200,
        last_error: 'Definition was unavailable during the previous lease.',
      },
    ],
    orphan_achievement_ids: [orphanAchievementID],
  };
}

function mockState(schemaReady = true): CharacterAchievementMockState {
  const state: CharacterAchievementMockState = {
    schemaReady,
    character: characterRecord(false),
    characters: [],
    detail: detailFixture(),
    details: {},
    detailDelays: {},
    requests: [],
    characterRequests: 0,
    schemaRequests: 0,
    detailRequestURLs: [],
    detailTotal: 2,
    auditPages: {},
    auditDelays: {},
  };
  state.characters = [state.character];
  return state;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function detailSnapshot(state: CharacterAchievementMockState, id = characterID) {
  const detail = clone(id === characterID ? state.detail : state.details[id]);
  detail.character = clone(id === characterID ? state.character : detail.character);
  return detail;
}

async function installCharacterAchievementMocks(page: Page, state: CharacterAchievementMockState) {
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

  await page.route('**/api/v1/character-achievement-editor/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/character-achievement-editor', '');
    const fulfill = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (path === '/metadata' && request.method() === 'GET') {
      return fulfill(metadata);
    }
    if (path === '/schema' && request.method() === 'GET') {
      state.schemaRequests += 1;
      const issue = {
        area: 'character',
        table: 'character_achievement_progress',
        column: 'definition_version',
        code: 'missing_column',
        severity: 'error',
        message: 'Required definition_version column is missing.',
      };
      return fulfill({
        ready: state.schemaReady,
        content: { ready: state.schemaReady, database: 'peq_content', tables: {}, issues: state.schemaReady ? [] : [issue] },
        character: { ready: state.schemaReady, database: 'peq_characters', tables: {}, issues: state.schemaReady ? [] : [issue] },
      });
    }
    if (path === '/characters' && request.method() === 'GET') {
      state.characterRequests += 1;
      return fulfill({ data: clone(state.characters), total: state.characters.length, page: 1, limit: 30 });
    }
    const detailMatch = path.match(/^\/character\/(\d+)$/);
    if (detailMatch && request.method() === 'GET') {
      const requestedCharacterID = Number(detailMatch[1]);
      if (requestedCharacterID !== characterID && !state.details[requestedCharacterID]) return fulfill({ error: 'Character not found' }, 404);
      state.detailRequestURLs.push(request.url());
      if (state.detailDelays[requestedCharacterID]) {
        await new Promise(resolve => setTimeout(resolve, state.detailDelays[requestedCharacterID]));
      }
      return fulfill({
        detail: detailSnapshot(state, requestedCharacterID),
        total: requestedCharacterID === characterID ? state.detailTotal : state.details[requestedCharacterID].definitions.length,
        page: Number(url.searchParams.get('page') || 1),
        limit: Number(url.searchParams.get('limit') || 25),
      });
    }
    const auditMatch = path.match(/^\/character\/(\d+)\/audit$/);
    if (auditMatch && request.method() === 'GET') {
      const requestedCharacterID = Number(auditMatch[1]);
      const requestedPage = Number(url.searchParams.get('page') || 1);
      const requestedLimit = Number(url.searchParams.get('limit') || 25);
      const auditKey = `${requestedCharacterID}:${requestedPage}`;
      if (state.auditDelays[auditKey]) {
        await new Promise(resolve => setTimeout(resolve, state.auditDelays[auditKey]));
      }
      const defaultAudit = requestedCharacterID === characterID
        ? {
          data: [
            {
              id: 44,
              user_id: 1,
              user_name: 'Administrator',
              event_name: 'CHARACTER_ACHIEVEMENT_PROGRESS_SET',
              created_at: '2026-08-08T00:00:00Z',
              data: { achievement_id: achievementID, reason: 'Prior audited repair' },
            },
          ],
          total: 1,
        }
        : { data: [], total: 0 };
      const audit = state.auditPages[auditKey] || defaultAudit;
      return fulfill({ ...clone(audit), page: requestedPage, limit: requestedLimit });
    }

    const mutationPrefix = `/character/${characterID}/`;
    if (path.startsWith(mutationPrefix) && ['PATCH', 'DELETE'].includes(request.method())) {
      const body = (request.postDataJSON() || {}) as Record<string, unknown>;
      state.requests.push({ method: request.method(), path, body });

      if (path.endsWith('/progress')) {
        const progress = state.detail.progress.find((row: Record<string, unknown>) =>
          Number(row.achievement_id) === Number(body.achievement_id) &&
          Number(row.component_type) === Number(body.component_type) &&
          Number(row.component_id) === Number(body.component_id)
        );
        if (progress) progress.current_count = String(body.current_count);
      } else if (path.endsWith('/reward/retry')) {
        state.detail.reward_ledgers[0].status = 2;
      } else if (path.endsWith('/selection/retry')) {
        state.detail.reward_selections[0].status = 2;
      } else if (path.endsWith('/mutation/retry')) {
        state.detail.pending_mutations[0].status = 0;
      } else if (path.endsWith('/mutation') && request.method() === 'DELETE') {
        state.detail.pending_mutations = [];
      }
      return fulfill({ detail: detailSnapshot(state), audit_id: 901 });
    }

    return fulfill({ error: `unmocked character-achievement route: ${request.method()} ${path}` }, 501);
  });
}

async function openCharacterEditor(page: Page) {
  await page.goto(`/admin/character-achievements?character=${characterID}`);
  await expect(page.getByTestId('character-achievement-inspector')).toBeVisible();
}

async function expandAchievement(page: Page, id = achievementID) {
  const card = page.getByTestId(`character-achievement-record-${id}`);
  await card.locator('.ca-achievement-card__toggle').click();
  return card;
}

async function fillSafetyConfirmation(page: Page, phrase: string, reason: string, acknowledgeRisk = false) {
  await page.locator('#character-achievement-action-reason').fill(reason);
  await page.getByTestId('character-achievement-character-confirmation').fill('Lyric');
  await page.getByTestId('character-achievement-operation-confirmation').fill(phrase);
  if (acknowledgeRisk) {
    await page.getByTestId('character-achievement-risk-acknowledgement').check();
  }
}

test.describe('Character Achievement Editor', () => {
  test('hydrates durable state, filters orphaned rows, enforces offline guards, and stays compact', async ({ page }) => {
    const state = mockState();
    await page.setViewportSize({ width: 760, height: 900 });
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);

    await expect(page.getByTestId('character-achievement-character-directory')).toContainText('Lyric');
    await expect(page.getByTestId('character-achievement-inspector').locator('h2')).toHaveText('Lyric');
    await expect(page.getByTestId(`character-achievement-record-${achievementID}`)).toContainText('Master Duelist');
    const orphanRecord = page.getByTestId(`character-achievement-record-${orphanAchievementID}`);
    await expect(orphanRecord).toHaveCount(1);
    await expect(orphanRecord).toContainText(`Deleted definition #${orphanAchievementID}`);
    await expect(page.getByTestId('character-achievement-presence')).toContainText('Offline');
    await expect(page.locator('.character-achievement-toolbar')).toContainText('132 completed');

    const canonicalCard = await expandAchievement(page);
    await expect(canonicalCard).toContainText('22 / 30');
    await expect(page.getByTestId(`character-achievement-progress-${achievementID}-1-152250`)).toBeEnabled();
    await expect(page.getByTestId(`character-achievement-complete-${achievementID}`)).toBeEnabled();

    const workspaceGeometry = await page.locator('.character-achievement-workspace').evaluate(element => {
      const workspace = element as HTMLElement;
      const directory = workspace.querySelector('.character-achievement-directory')!.getBoundingClientRect();
      const inspector = workspace.querySelector('.character-achievement-inspector')!.getBoundingClientRect();
      const eqWindow = workspace.querySelector('.eq-window-simple')!;
      const windowShadow = getComputedStyle(eqWindow).boxShadow;
      const windowFrame = getComputedStyle(eqWindow, '::before');
      return {
        overflow: workspace.scrollWidth - workspace.clientWidth,
        windowShadow,
        windowFrameLeft: Number.parseFloat(windowFrame.left),
        windowFrameRight: Number.parseFloat(windowFrame.right),
        directoryBottom: directory.bottom,
        inspectorTop: inspector.top,
        directoryLeft: directory.left,
        inspectorLeft: inspector.left,
      };
    });
    expect(workspaceGeometry.overflow).toBeLessThanOrEqual(1);
    expect(workspaceGeometry.windowShadow).toBe('none');
    expect(workspaceGeometry.windowFrameLeft).toBeGreaterThanOrEqual(0);
    expect(workspaceGeometry.windowFrameRight).toBeGreaterThanOrEqual(0);
    expect(workspaceGeometry.inspectorTop).toBeGreaterThanOrEqual(workspaceGeometry.directoryBottom - 1);
    expect(Math.abs(workspaceGeometry.directoryLeft - workspaceGeometry.inspectorLeft)).toBeLessThanOrEqual(1);

    const characterSearchRequest = page.waitForRequest(request => {
      const url = new URL(request.url());
      return url.pathname.endsWith('/character-achievement-editor/characters') && url.searchParams.get('q') === 'Lyric';
    });
    await page.getByTestId('character-achievement-character-search').fill('Lyric');
    await characterSearchRequest;
    await expect(page).toHaveURL(/character_q=Lyric/);

    const orphanRequest = page.waitForRequest(request => {
      const url = new URL(request.url());
      return url.pathname.endsWith(`/character-achievement-editor/character/${characterID}`) && url.searchParams.get('state') === 'orphaned';
    });
    await page.getByTestId('character-achievement-state-filter').selectOption('orphaned');
    await orphanRequest;
    await expect(page.getByTestId(`character-achievement-record-${orphanAchievementID}`)).toBeVisible();
    await expect(page.getByTestId(`character-achievement-record-${achievementID}`)).toHaveCount(0);
    await expect(page).toHaveURL(/state=orphaned/);

    await page.getByTestId('character-achievement-state-filter').selectOption('all');
    await expect(page.getByTestId(`character-achievement-record-${achievementID}`)).toBeVisible();
    await expandAchievement(page);
    state.character.ingame = true;
    await page.locator('.ca-character-header__actions').getByRole('button', { name: 'Refresh' }).click();
    await expect(page.getByTestId('character-achievement-online-warning')).toBeVisible();
    await expect(page.getByTestId(`character-achievement-progress-${achievementID}-1-152250`)).toBeDisabled();
    await expect(page.getByTestId(`character-achievement-complete-${achievementID}`)).toBeDisabled();
    await expect(page.getByTestId(`character-achievement-reset-${achievementID}`)).toBeDisabled();
  });

  test('pages the result-scoped reward and mutation diagnostics without hiding later achievements', async ({ page }) => {
    const state = mockState();
    state.detailTotal = 60;
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);

    await page.getByText('Rewards & Selections', { exact: true }).click();
    await expect(page.getByText('Showing ledgers for achievement result page 1 of 3.')).toBeVisible();
    const secondPage = page.waitForRequest(request => {
      const url = new URL(request.url());
      return url.pathname.endsWith(`/character-achievement-editor/character/${characterID}`) && url.searchParams.get('page') === '2';
    });
    await page.getByRole('button', { name: 'Next reward achievement page' }).click();
    await secondPage;
    await expect(page.getByText('Showing ledgers for achievement result page 2 of 3.')).toBeVisible();

    await page.getByText('Pending Queue', { exact: true }).click();
    await expect(page.getByText('Showing queued rows for achievement result page 2 of 3.')).toBeVisible();
    const queuedOnly = page.waitForRequest(request => {
      const url = new URL(request.url());
      return url.pathname.endsWith(`/character-achievement-editor/character/${characterID}`) &&
        url.searchParams.get('state') === 'pending_mutation' && url.searchParams.get('page') === '1';
    });
    await page.getByRole('button', { name: 'Show queued only' }).click();
    await queuedOnly;
  });

  test('honors the server aggregate mismatch flag after page-scoped state hydration', async ({ page }) => {
    const state = mockState();
    state.detail.definitions[0].version_mismatch = true;
    state.detail.progress = [];
    state.detail.pending_mutations = [];
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);

    await page.getByTestId('character-achievement-state-filter').selectOption('version_mismatch');
    await expect(page.getByTestId(`character-achievement-record-${achievementID}`)).toBeVisible();
    await expect(page.getByTestId(`character-achievement-record-${achievementID}`)).toContainText('Version mismatch');
  });

  test('ignores a late detail response after the operator selects another character', async ({ page }) => {
    const state = mockState();
    const aria = { ...characterRecord(false), id: 2020, name: 'Aria', achievement_completion_count: 5 };
    const ariaDetail = detailFixture();
    ariaDetail.character = clone(aria);
    ariaDetail.definitions = [clone(ariaDetail.definitions[0])];
    ariaDetail.definitions[0].name = 'Aria-only achievement';
    ariaDetail.orphan_achievement_ids = [];
    state.characters = [state.character, aria];
    state.details[2020] = ariaDetail;
    state.detailDelays[2020] = 250;
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);

    const directory = page.getByTestId('character-achievement-character-directory');
    await directory.getByRole('button', { name: /Aria/ }).click();
    await directory.getByRole('button', { name: /Lyric/ }).click();
    await expect(page.getByTestId('character-achievement-inspector').locator('h2')).toHaveText('Lyric');
    await page.waitForTimeout(300);
    await expect(page.getByTestId('character-achievement-inspector').locator('h2')).toHaveText('Lyric');
    await expect(page.getByText('Aria-only achievement')).toHaveCount(0);
  });

  test('keeps late audit responses scoped to the character and audit page that requested them', async ({ page }) => {
    const state = mockState();
    const aria = { ...characterRecord(false), id: 2020, name: 'Aria', achievement_completion_count: 5 };
    const ariaDetail = detailFixture();
    ariaDetail.character = clone(aria);
    ariaDetail.definitions = [clone(ariaDetail.definitions[0])];
    ariaDetail.orphan_achievement_ids = [];
    state.characters = [state.character, aria];
    state.details[2020] = ariaDetail;
    state.auditPages['1015:1'] = {
      data: [{
        id: 45,
        user_id: 1,
        user_name: 'Administrator',
        event_name: 'CHARACTER_ACHIEVEMENT_PROGRESS_SET',
        created_at: '2026-08-08T00:00:00Z',
        data: { achievement_id: achievementID, reason: 'Late Lyric audit' },
      }],
      total: 1,
    };
    state.auditPages['2020:1'] = {
      data: [{
        id: 46,
        user_id: 1,
        user_name: 'Administrator',
        event_name: 'CHARACTER_ACHIEVEMENT_PROGRESS_SET',
        created_at: '2026-08-08T00:01:00Z',
        data: { achievement_id: achievementID, reason: 'Current Aria audit page one' },
      }],
      total: 26,
    };
    state.auditPages['2020:2'] = {
      data: [{
        id: 47,
        user_id: 1,
        user_name: 'Administrator',
        event_name: 'CHARACTER_ACHIEVEMENT_PROGRESS_SET',
        created_at: '2026-08-08T00:02:00Z',
        data: { achievement_id: achievementID, reason: 'Current Aria audit page two' },
      }],
      total: 26,
    };
    state.auditDelays['1015:1'] = 250;
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);

    const lyricAuditRequest = page.waitForRequest(request =>
      new URL(request.url()).pathname.endsWith(`/character-achievement-editor/character/${characterID}/audit`)
    );
    await page.getByText('Audit & Safety', { exact: true }).click();
    await lyricAuditRequest;
    await page.getByTestId('character-achievement-character-directory').getByRole('button', { name: /Aria/ }).click();

    const auditList = page.getByTestId('character-achievement-audit-list');
    await expect(page.getByTestId('character-achievement-inspector').locator('h2')).toHaveText('Aria');
    await expect(auditList).toContainText('Current Aria audit page one');
    await page.waitForTimeout(300);
    await expect(auditList).toContainText('Current Aria audit page one');
    await expect(auditList).not.toContainText('Late Lyric audit');

    state.auditDelays['2020:1'] = 250;
    const auditPanel = page.locator('.ca-detail-section').filter({ hasText: 'Recent character achievement changes' });
    const lateFirstPageRequest = page.waitForRequest(request => {
      const url = new URL(request.url());
      return url.pathname.endsWith('/character-achievement-editor/character/2020/audit') && url.searchParams.get('page') === '1';
    });
    await auditPanel.getByRole('button', { name: 'Refresh' }).click();
    await lateFirstPageRequest;
    await page.getByRole('button', { name: 'Next audit page' }).click();
    await expect(auditList).toContainText('Current Aria audit page two');
    await page.waitForTimeout(300);
    await expect(auditList).toContainText('Current Aria audit page two');
    await expect(auditList).not.toContainText('Current Aria audit page one');
  });

  test('sets exact progress only after both typed confirmation gates', async ({ page }) => {
    const state = mockState();
    state.detail.progress[0].current_count = '18446744073709551615';
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);
    await expandAchievement(page);
    await expect(page.getByTestId(`character-achievement-record-${achievementID}`)).toContainText('18,446,744,073,709,551,615 / 30');

    await page.getByTestId(`character-achievement-progress-${achievementID}-1-152250`).click();
    const submit = page.getByTestId('character-achievement-action-submit');
    const progressInput = page.getByTestId('character-achievement-action-progress');
    await progressInput.fill('');
    await page.locator('#character-achievement-action-reason').fill('Correcting progress after verified event loss');

    await page.getByTestId('character-achievement-operation-confirmation').fill(`PROGRESS ${achievementID}`);
    await expect(submit).toBeDisabled();
    await page.getByTestId('character-achievement-operation-confirmation').fill('');
    await page.getByTestId('character-achievement-character-confirmation').fill('Lyric');
    await expect(submit).toBeDisabled();
    await page.getByTestId('character-achievement-operation-confirmation').fill(`PROGRESS ${achievementID}`);
    await expect(submit).toBeDisabled();
    await progressInput.fill('25');
    await expect(submit).toBeEnabled();

    const progressRequest = page.waitForRequest(request =>
      request.method() === 'PATCH' &&
      new URL(request.url()).pathname.endsWith(`/character-achievement-editor/character/${characterID}/progress`)
    );
    await submit.click();
    const request = await progressRequest;
    expect(request.postDataJSON()).toMatchObject({
      achievement_id: achievementID,
      component_type: 1,
      component_id: 152250,
      current_count: 25,
      expected_current_count: '18446744073709551615',
      expected_definition_version: 4,
      reason: 'Correcting progress after verified event loss',
      character_confirmation: 'Lyric',
      confirmation: `PROGRESS ${achievementID}`,
    });
    await expect(page.getByTestId('character-achievement-action-modal')).toBeHidden();
    await expect(page.getByTestId(`character-achievement-record-${achievementID}`)).toContainText('25 / 30');
  });

  test('explains why disabled definitions cannot receive positive state writes', async ({ page }) => {
    const state = mockState();
    state.detail.definitions[0].enabled = false;
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);
    await expandAchievement(page);

    const progress = page.getByTestId(`character-achievement-progress-${achievementID}-1-152250`);
    const complete = page.getByTestId(`character-achievement-complete-${achievementID}`);
    await expect(progress).toBeDisabled();
    await expect(progress).toHaveAttribute('title', /definition is disabled.*before adding positive progress/i);
    await expect(complete).toBeDisabled();
    await expect(complete).toHaveAttribute('title', /definition is disabled.*before forcing completion/i);
    const mutationRetry = page.locator('tr').filter({ hasText: mutationID }).first().getByRole('button', { name: 'Retry' });
    await expect(mutationRetry).toBeDisabled();
    await expect(mutationRetry).toHaveAttribute('title', /definition is disabled.*enable it before retrying queued work/i);
    await expect(page.getByTestId(`character-achievement-reset-${achievementID}`)).toBeEnabled();
  });

  test('requires duplicate-delivery acknowledgement for reward and selection retries', async ({ page }) => {
    const state = mockState();
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);
    await page.getByText('Rewards & Selections', { exact: true }).click();

    const mappedRewardRow = page.locator('tr').filter({ hasText: rewardID }).first();
    const mappedRetry = mappedRewardRow.getByRole('button', { name: 'Retry' });
    await expect(mappedRetry).toBeDisabled();
    await expect(mappedRetry).toHaveAttribute('title', /retry the owning reward selection/i);

    const rewardRow = page.locator('tr').filter({ hasText: automaticRewardID }).first();
    await expect(rewardRow).toContainText('In-flight / ambiguous');
    await rewardRow.getByRole('button', { name: 'Retry' }).click();
    await fillSafetyConfirmation(page, `RETRY REWARD ${automaticRewardID}`, 'Retrying after inventory and ledger review');
    const submit = page.getByTestId('character-achievement-action-submit');
    await expect(submit).toBeDisabled();
    await page.getByTestId('character-achievement-risk-acknowledgement').check();
    await expect(submit).toBeEnabled();

    const rewardRequest = page.waitForRequest(request =>
      request.method() === 'PATCH' &&
      new URL(request.url()).pathname.endsWith(`/character-achievement-editor/character/${characterID}/reward/retry`)
    );
    await submit.click();
    const rewardPayload = (await rewardRequest).postDataJSON();
    expect(rewardPayload).toMatchObject({
      achievement_id: achievementID,
      reward_id: automaticRewardID,
      expected_status: 0,
      acknowledge_duplicate_risk: true,
      character_confirmation: 'Lyric',
      confirmation: `RETRY REWARD ${automaticRewardID}`,
    });
    await expect(page.getByTestId('character-achievement-action-modal')).toBeHidden();

    const selectionRow = page.locator('tr').filter({ hasText: 'Ornament choice' }).first();
    await expect(selectionRow).toContainText('Ambiguous delivery');
    await selectionRow.getByRole('button', { name: 'Retry' }).click();
    await fillSafetyConfirmation(page, `RETRY SELECTION ${rewardSetID}`, 'Retrying selected bundle after durable row review', true);
    const selectionRequest = page.waitForRequest(request =>
      request.method() === 'PATCH' &&
      new URL(request.url()).pathname.endsWith(`/character-achievement-editor/character/${characterID}/selection/retry`)
    );
    await page.getByTestId('character-achievement-action-submit').click();
    const selectionPayload = (await selectionRequest).postDataJSON();
    expect(selectionPayload).toMatchObject({
      achievement_id: achievementID,
      reward_set_id: rewardSetID,
      expected_status: 3,
      acknowledge_duplicate_risk: true,
      character_confirmation: 'Lyric',
      confirmation: `RETRY SELECTION ${rewardSetID}`,
    });
    await expect(page.getByTestId('character-achievement-action-modal')).toBeHidden();
  });

  test('uses separate retry and discard contracts for queued mutations', async ({ page }) => {
    const state = mockState();
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);
    await page.getByText('Pending Queue', { exact: true }).click();

    let mutationRow = page.locator('tr').filter({ hasText: mutationID }).first();
    await expect(mutationRow).toContainText('Blocked');
    await mutationRow.getByRole('button', { name: 'Retry' }).click();
    await fillSafetyConfirmation(page, `RETRY MUTATION ${mutationID}`, 'Returning the diagnosed mutation to pending');
    const retryRequest = page.waitForRequest(request =>
      request.method() === 'PATCH' &&
      new URL(request.url()).pathname.endsWith(`/character-achievement-editor/character/${characterID}/mutation/retry`)
    );
    await page.getByTestId('character-achievement-action-submit').click();
    const retryPayload = (await retryRequest).postDataJSON();
    expect(retryPayload).toMatchObject({
      mutation_id: mutationID,
      action: 'retry',
      expected_status: 1,
      expected_attempt_count: 3,
      character_confirmation: 'Lyric',
      confirmation: `RETRY MUTATION ${mutationID}`,
    });
    await expect(page.getByTestId('character-achievement-action-modal')).toBeHidden();

    mutationRow = page.locator('tr').filter({ hasText: mutationID }).first();
    await expect(mutationRow).toContainText('Pending');
    await mutationRow.getByRole('button', { name: 'Discard' }).click();
    await fillSafetyConfirmation(page, `DISCARD MUTATION ${mutationID}`, 'Discarding the verified duplicate world handoff');
    const discardRequest = page.waitForRequest(request =>
      request.method() === 'DELETE' &&
      new URL(request.url()).pathname.endsWith(`/character-achievement-editor/character/${characterID}/mutation`)
    );
    await page.getByTestId('character-achievement-action-submit').click();
    const discardPayload = (await discardRequest).postDataJSON();
    expect(discardPayload).toMatchObject({
      mutation_id: mutationID,
      action: 'discard',
      expected_status: 0,
      expected_attempt_count: 3,
      character_confirmation: 'Lyric',
      confirmation: `DISCARD MUTATION ${mutationID}`,
    });
    await expect(page.getByTestId('character-achievement-action-modal')).toBeHidden();
    await expect(page.locator('tr').filter({ hasText: mutationID })).toHaveCount(0);
    await expect(page.getByTestId('character-achievement-pending-mutations')).toContainText('no queued mutations');
  });

  test('blocks retry for a legacy queued mutation with no definition version', async ({ page }) => {
    const state = mockState();
    state.detail.pending_mutations[0].definition_version = 0;
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);
    await page.getByText('Pending Queue', { exact: true }).click();

    const row = page.locator('tr').filter({ hasText: mutationID }).first();
    const retry = row.getByRole('button', { name: 'Retry' });
    await expect(retry).toBeDisabled();
    await expect(retry).toHaveAttribute('title', /no definition version.*discard/i);
    await expect(row.getByRole('button', { name: 'Discard' })).toBeEnabled();
  });

  test('keeps reset locked for an active processing lease and requires acknowledgement after expiry', async ({ page }) => {
    const state = mockState();
    state.detail.pending_mutations[0].status = 2;
    state.detail.pending_mutations[0].last_attempt_at = Math.floor(Date.now() / 1000);
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);
    await expandAchievement(page);

    const reset = page.getByTestId(`character-achievement-reset-${achievementID}`);
    await expect(reset).toBeDisabled();
    await expect(reset).toHaveAttribute('title', /active 60-second processing lease/);

    state.detail.pending_mutations[0].last_attempt_at = Math.floor(Date.now() / 1000) - 600;
    await page.locator('.ca-character-header__actions').getByRole('button', { name: 'Refresh' }).click();
    await expect(reset).toBeEnabled();
    await reset.click();
    await fillSafetyConfirmation(page, `RESET ${achievementID}`, 'Resetting state after confirming an abandoned lease');

    const submit = page.getByTestId('character-achievement-action-submit');
    const staleAcknowledgement = page.getByTestId('character-achievement-stale-lease-acknowledgement');
    await expect(staleAcknowledgement).toBeVisible();
    await expect(submit).toBeDisabled();
    await staleAcknowledgement.check();
    await expect(submit).toBeEnabled();

    const resetRequest = page.waitForRequest(request =>
      request.method() === 'PATCH' &&
      new URL(request.url()).pathname.endsWith(`/character-achievement-editor/character/${characterID}/reset`)
    );
    await submit.click();
    const resetPayload = (await resetRequest).postDataJSON();
    expect(resetPayload).toMatchObject({
      achievement_id: achievementID,
      clear_reward_history: false,
      acknowledge_regrant_risk: false,
      acknowledge_stale_processing_lease: true,
      character_confirmation: 'Lyric',
      confirmation: `RESET ${achievementID}`,
    });
  });

  test('allows only acknowledged discard of an expired status-2 processing lease', async ({ page }) => {
    const state = mockState();
    state.detail.pending_mutations[0].status = 2;
    state.detail.pending_mutations[0].last_attempt_at = Math.floor(Date.now() / 1000);
    await installCharacterAchievementMocks(page, state);
    await openCharacterEditor(page);
    await page.getByText('Pending Queue', { exact: true }).click();

    let mutationRow = page.locator('tr').filter({ hasText: mutationID }).first();
    const activeDiscard = mutationRow.getByRole('button', { name: 'Discard' });
    await expect(activeDiscard).toBeDisabled();
    await expect(activeDiscard).toHaveAttribute('title', /active 60-second zone lease/);

    state.detail.pending_mutations[0].last_attempt_at = Math.floor(Date.now() / 1000) - 600;
    await page.locator('.ca-character-header__actions').getByRole('button', { name: 'Refresh' }).click();
    mutationRow = page.locator('tr').filter({ hasText: mutationID }).first();
    await expect(page.getByText('1 expired lease needs review', { exact: true })).toBeVisible();
    await expect(mutationRow.getByRole('button', { name: 'Retry' })).toBeDisabled();
    await expect(mutationRow.getByRole('button', { name: 'Discard' })).toBeEnabled();
    await mutationRow.getByRole('button', { name: 'Discard' }).click();
    await fillSafetyConfirmation(page, `DISCARD MUTATION ${mutationID}`, 'Removing an abandoned expired processing lease');

    const submit = page.getByTestId('character-achievement-action-submit');
    const staleAcknowledgement = page.getByTestId('character-achievement-stale-lease-acknowledgement');
    await expect(staleAcknowledgement).toBeVisible();
    await expect(submit).toBeDisabled();
    await staleAcknowledgement.check();
    await expect(submit).toBeEnabled();

    const discardRequest = page.waitForRequest(request =>
      request.method() === 'DELETE' &&
      new URL(request.url()).pathname.endsWith(`/character-achievement-editor/character/${characterID}/mutation`)
    );
    await submit.click();
    const discardPayload = (await discardRequest).postDataJSON();
    expect(discardPayload).toMatchObject({
      mutation_id: mutationID,
      action: 'discard',
      expected_status: 2,
      expected_attempt_count: 3,
      acknowledge_stale_processing_lease: true,
      character_confirmation: 'Lyric',
      confirmation: `DISCARD MUTATION ${mutationID}`,
    });
  });

  test('fails closed when either achievement schema area is incompatible', async ({ page }) => {
    const state = mockState(false);
    await installCharacterAchievementMocks(page, state);
    await page.goto('/admin/character-achievements');

    const failure = page.getByTestId('character-achievement-schema-failure');
    await expect(failure).toBeVisible();
    await expect(failure).toContainText('No achievement state was changed');
    await expect(failure).toContainText('character_achievement_progress.definition_version');
    await expect(failure).toContainText('Required definition_version column is missing.');
    await expect(page.getByTestId('character-achievement-character-directory')).toHaveCount(0);
    expect(state.characterRequests).toBe(0);

    await failure.getByRole('button', { name: 'Recheck' }).click();
    await expect.poll(() => state.schemaRequests).toBe(2);
    await expect(failure).toBeVisible();
    expect(state.characterRequests).toBe(0);
    expect(state.requests).toHaveLength(0);
  });
});
