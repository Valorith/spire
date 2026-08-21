import { expect, Page, test } from '@playwright/test';

type AchievementMockState = {
  schemaReady?: boolean;
  definitionValidation?: any;
  definitionOverride?: any;
  savePayload?: any;
  clonePayload?: any;
  deletePayload?: any;
  categoryPayload?: any;
  categoryDeletePayload?: any;
};

const category = {
  id: 1,
  parent_id: 0,
  sequence: 10,
  name: 'Exploration',
  description: 'World exploration achievements.',
  icon: 'AchievementIcons/World',
  association_count: 1,
  children_count: 0,
};

const definition = {
  id: 100,
  name: 'Pathfinder of Norrath',
  description: 'Reach level 50 while exploring Norrath.',
  icon_id: 12,
  points: 10,
  has_reward: false,
  client_flag: 0,
  version: 2,
  reset_on_version_change: false,
  enabled: true,
  associations: [
    { category_id: 1, sequence: 10, display_text: '' },
  ],
  components: [
    {
      component_type: 0,
      sequence: 1,
      component_id: 1000,
      name: 'Reach level 50.',
      description: '',
      presentation_count: 1,
      criteria: [
        {
          id: '4000',
          event_type: 1,
          progress_mode: 3,
          behavior: 0,
          target_id: 0,
          target_id2: 0,
          target_value: '50',
          required_count: 1,
          enabled: true,
        },
      ],
    },
  ],
  rewards: [
    {
      reward_id: '5000',
      sequence: 1,
      reward_type: 0,
      reward_data_id: 13073,
      amount: '1',
      description: 'Pathfinder Token',
      enabled: true,
    },
  ],
  reward_set: null,
  requirements: [],
};

const summary = {
  id: definition.id,
  name: definition.name,
  description: definition.description,
  icon_id: definition.icon_id,
  points: definition.points,
  version: definition.version,
  enabled: definition.enabled,
  category_count: 1,
  component_count: 1,
  criterion_count: 1,
  reward_count: 1,
  requirement_count: 0,
};

const metadata = {
  limits: {
    max_graph_bytes: '2097152',
    max_text_bytes: '65535',
    max_associations: '100',
    max_components: '1000',
    max_criteria: '2000',
    max_rewards: '500',
    max_requirements: '500',
    max_reward_options: '500',
  },
  fields: {
    achievements: {
      id: { label: 'Achievement ID', help: 'Stable nonzero identity used by character state and scripts.' },
      name: { label: 'Name', help: 'Visible achievement name sent to the client.' },
      version: { label: 'Definition version', help: 'Increment only for incompatible deployed changes.' },
    },
    rewards: {
      reward_id: { label: 'Reward ID', help: 'Stable canonical grant identity, immutable after creation.' },
    },
    achievement_categories: {
      icon: { label: 'Icon resource', help: 'Optional exact client texture or resource name.' },
    },
  },
};

function json (route: any, body: any, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

function clone<T> (value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function persistedDefinition (submitted: any) {
  const saved = clone(submitted);
  const allocated: Record<string, string> = {};
  saved.rewards = (saved.rewards || []).map((reward: any, index: number) => {
    const id = reward.reward_id || String(8000 + index);
    allocated['@' + index] = id;
    return { ...reward, reward_id: id };
  });
  if (saved.reward_set) {
    saved.reward_set.mappings = (saved.reward_set.mappings || []).map((mapping: any) => ({
      ...mapping,
      reward_id: allocated[mapping.reward_id] || mapping.reward_id,
    }));
  }
  return saved;
}

async function installAchievementMocks(page: Page, state: AchievementMockState) {
  const definitionsByID: Record<number, any> = { 100: clone(state.definitionOverride || definition) };

  // Broad handlers are registered first because Playwright resolves routes LIFO.
  await page.route('**/api/v1/**', route => {
    if (!route.request().isNavigationRequest()) return json(route, []);
    return route.continue();
  });
  await page.route('https://api.github.com/**', route => route.abort());

  await page.route('**/api/v1/app/env**', route => json(route, {
    data: {
      is_spire_initialized: true,
      env: 'local',
      version: '1.0.0',
      features: {},
      settings: [],
      os: 'linux',
    },
  }));

  await page.route('**/api/v1/achievement-editor/metadata**', route => json(route, metadata));
  await page.route('**/api/v1/achievement-editor/schema**', route => json(route, {
    ready: state.schemaReady !== false,
    content: {
      ready: state.schemaReady !== false,
      issues: state.schemaReady === false
        ? [{ area: 'content', table: 'achievements', code: 'missing_table', message: 'The achievements table is missing.' }]
        : [],
      tables: {},
    },
    character: { ready: true, issues: [], tables: {} },
  }));

  await page.route('**/api/v1/achievement-editor/definitions**', route => json(route, {
    data: [summary],
    total: 1,
    page: 1,
    limit: 25,
  }));

  await page.route('**/api/v1/achievement-editor/categories**', route => json(route, {
    data: [category],
    total: 1,
    page: 1,
    limit: 1,
  }));

  await page.route('**/api/v1/achievement-editor/category/**', async route => {
    const request = route.request();
    if (request.method() === 'PATCH') {
      state.categoryPayload = request.postDataJSON();
      return json(route, { category: state.categoryPayload.category, revision: 'category-rev-1-updated', validation: { findings: [] }, audit_id: 15 });
    }
    if (request.method() === 'DELETE') {
      state.categoryDeletePayload = request.postDataJSON();
      return json(route, { deleted: true, category_id: 1, audit_id: 16 });
    }
    return json(route, { category, revision: 'category-rev-1' });
  });

  await page.route('**/api/v1/achievement-editor/lookups/**', route => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('q') || '';
    const isItemLookup = url.pathname.endsWith('/lookups/item');
    const isAAAbilityLookup = url.pathname.endsWith('/lookups/aa-ability');
    return json(route, {
      data: query
        ? [isItemLookup
          ? { id: '10909', label: 'Blade of Tactics', detail: 'Icon 590', icon_id: 590 }
          : isAAAbilityLookup
            ? { id: '30300', label: 'Seasonal Martial Aptitude', detail: 'First rank 30300 · class mask 33089 · class-limited', classes: 33089, first_rank_id: 30300 }
            : { id: '1', label: 'Exploration', detail: 'Root category' }]
        : [],
      total: query ? 1 : 0,
      limit: 20,
    });
  });

  await page.route('**/api/v1/achievement-editor/definition', async route => {
    const request = route.request();
    if (request.method() !== 'PUT') return json(route, {});
    state.savePayload = request.postDataJSON();
    const saved = persistedDefinition(state.savePayload.definition);
    definitionsByID[saved.id] = saved;
    return json(route, { definition: saved, revision: 'definition-rev-' + saved.id, validation: { findings: [] }, audit_id: 11 }, 201);
  });

  await page.route(/\/api\/v1\/achievement-editor\/definition\/.+/, async route => {
    const request = route.request();
    const segments = new URL(request.url()).pathname.split('/').filter(Boolean);
    const isClone = segments[segments.length - 1] === 'clone';
    const id = Number(isClone ? segments[segments.length - 2] : segments[segments.length - 1]);

    if (isClone && request.method() === 'PUT') {
      state.clonePayload = request.postDataJSON();
      const source = definitionsByID[id] || definition;
      const cloned = clone(source);
      cloned.id = Number(state.clonePayload.new_id);
      cloned.name = state.clonePayload.name || source.name;
      cloned.enabled = false;
      cloned.version = 1;
      definitionsByID[cloned.id] = cloned;
      return json(route, { definition: cloned, revision: 'definition-rev-' + cloned.id, audit_id: 12 }, 201);
    }
    if (request.method() === 'DELETE') {
      state.deletePayload = request.postDataJSON();
      return json(route, { deleted: true, achievement_id: id, audit_id: 13 });
    }
    if (request.method() === 'PATCH') {
      state.savePayload = request.postDataJSON();
      const saved = persistedDefinition(state.savePayload.definition);
      definitionsByID[id] = saved;
      return json(route, { definition: saved, revision: 'definition-rev-' + saved.id + '-updated', validation: { findings: [] }, audit_id: 14 });
    }
    return json(route, {
      definition: definitionsByID[id] || definition,
      revision: 'definition-rev-' + id,
      validation: state.definitionValidation || { findings: [] },
    });
  });
}

async function gotoAchievementEditor(page: Page, state: AchievementMockState = {}) {
  await installAchievementMocks(page, state);
  await page.goto('/achievements');
  await expect(page.getByTestId('achievement-editor')).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId('achievement-directory')).toBeVisible({ timeout: 20000 });
}

async function openDefinition(page: Page) {
  await page.getByTestId('achievement-directory').getByText('Pathfinder of Norrath', { exact: true }).click();
  await expect(page.locator('#achievement-name')).toHaveValue('Pathfinder of Norrath', { timeout: 10000 });
}

async function selectGraphTab(page: Page, name: string) {
  await page.locator('.eq-tab-box-fancy li').filter({ hasText: name }).first().click();
}

test.describe('Achievement Editor', () => {
  test('fails closed when the content achievement schema is incomplete', async ({ page }) => {
    const state: AchievementMockState = { schemaReady: false };
    await gotoAchievementEditor(page, state);

    const blocked = page.getByTestId('achievement-schema-blocked');
    await expect(blocked).toBeVisible();
    await expect(blocked).toContainText('Content writes are disabled');
    await expect(blocked).toContainText('database update 9329');
    await expect(blocked).toContainText('older draft');
    await expect(blocked).toContainText('The achievements table is missing.');
    await expect(page.getByTestId('achievement-new-definition')).toBeDisabled();
  });

  test('loads a definition, exposes field education, and surfaces client validation', async ({ page }) => {
    await gotoAchievementEditor(page);
    await openDefinition(page);

    await expect(page.locator('#achievement-id')).toHaveValue('100');
    await expect(page.locator('#achievement-id')).toBeDisabled();
    await expect(page.locator('#achievement-name')).toHaveAttribute('aria-describedby', 'achievement-name-help');
    await expect(page.locator('#achievement-name-help')).toContainText('Visible achievement name');
    await expect(page.locator('#achievement-version-help')).toContainText('incompatible deployed changes');

    await page.locator('#achievement-version').fill('0');
    await selectGraphTab(page, 'Validation');
    await expect(page.getByTestId('achievement-tab-validation')).not.toContainText('Definition version must');
  });

  test('rejects definition and component TEXT values over 65,535 UTF-8 bytes', async ({ page }) => {
    await gotoAchievementEditor(page);
    await openDefinition(page);
    const oversized = 'é'.repeat(32768);

    await expect(page.locator('#achievement-description-help')).toContainText('65,535 UTF-8 bytes');
    await page.locator('#achievement-description').fill(oversized);
    await selectGraphTab(page, 'Components');
    await expect(page.locator('#achievement-component-name-help-0')).toContainText('65,535 UTF-8 bytes');
    await expect(page.locator('#achievement-component-description-help-0')).toContainText('65,535 UTF-8 bytes');
    await page.locator('#achievement-component-name-0').fill(oversized);
    await page.locator('#achievement-component-description-0').fill(oversized);

    await selectGraphTab(page, 'Validation');
    const validation = page.getByTestId('achievement-tab-validation');
    await expect(validation.getByText('general.description', { exact: true })).toBeVisible();
    await expect(validation.getByText('components.0.name', { exact: true })).toBeVisible();
    await expect(validation.getByText('components.0.description', { exact: true })).toBeVisible();
    await expect(validation.getByText('Achievement description may not exceed 65,535 UTF-8 bytes (the MySQL TEXT limit).', { exact: true })).toBeVisible();
    await expect(validation.getByText('Component name may not exceed 65,535 UTF-8 bytes (the MySQL TEXT limit).', { exact: true })).toBeVisible();
    await expect(validation.getByText('Component description may not exceed 65,535 UTF-8 bytes (the MySQL TEXT limit).', { exact: true })).toBeVisible();
  });

  test('preserves orphan criteria and requires an explicit whole-group recovery choice', async ({ page }) => {
    const recovered = clone(definition);
    recovered.components.push({
      component_type: 1,
      sequence: 2,
      component_id: 2000,
      name: 'Missing component row - recovery required',
      description: 'These criteria are preserved but cannot be evaluated until explicitly restored.',
      presentation_count: 1,
      recovery_only: true,
      recovery_action: '',
      recovery_reason: 'The achievement_components row for these stored criteria is missing. Restore the component to keep the criteria, or explicitly delete the orphan criteria.',
      recovery_criteria_count: 1,
      criteria: [{
        id: '4999',
        component_type: 1,
        component_sequence: 2,
        component_id: 2000,
        event_type: 5,
        progress_mode: 3,
        behavior: 0,
        target_id: 407,
        target_id2: 0,
        target_value: '1',
        required_count: 1,
        enabled: true,
      }],
    });
    const state: AchievementMockState = { definitionOverride: recovered };
    await gotoAchievementEditor(page, state);
    await openDefinition(page);
    await selectGraphTab(page, 'Components');

    const recovery = page.getByTestId('achievement-orphan-recovery-1-2000');
    await expect(recovery).toBeVisible();
    await expect(recovery).toContainText('1 orphan criterion row preserved');
    await expect(recovery).toContainText('Saving is blocked until you make one explicit whole-group choice.');
    await expect(recovery.locator('#achievement-component-sequence-1')).toBeDisabled();

    await selectGraphTab(page, 'General');
    await page.locator('#achievement-name').fill('Pathfinder recovery review');
    await page.locator('#achievement-audit-reason').fill('Resolve the preserved orphan criterion group after reviewing its missing component.');
    await page.getByTestId('achievement-save').click();
    await expect(page.getByTestId('achievement-tab-validation')).toContainText('Choose Restore missing component');
    expect(state.savePayload).toBeUndefined();

    await selectGraphTab(page, 'Components');
    await recovery.getByTestId('achievement-recovery-restore-1').click();
    await expect(recovery).toContainText('Pending restore');
    await expect(recovery.locator('#achievement-component-sequence-1')).toBeEnabled();
    await recovery.getByTestId('achievement-recovery-undo-1').click();
    page.once('dialog', dialog => dialog.accept());
    await recovery.getByTestId('achievement-recovery-delete-1').click();
    await expect(recovery).toContainText('Pending explicit deletion');
    await expect(recovery.locator('#achievement-component-sequence-1')).toBeDisabled();

    await selectGraphTab(page, 'General');
    await page.getByTestId('achievement-save').click();
    await expect(page.getByText('Definition graph saved transactionally.')).toBeVisible();
    expect(state.savePayload.definition.components[1]).toMatchObject({
      component_type: 1,
      component_id: 2000,
      recovery_only: true,
      recovery_action: 'delete',
      recovery_criteria_count: 1,
    });
    expect(state.savePayload.definition.components[1].criteria.map((row: any) => row.id)).toEqual(['4999']);
  });

  test('authors a nested graph and submits transient reward mappings with an audit reason', async ({ page }) => {
    const state: AchievementMockState = {};
    await gotoAchievementEditor(page, state);

    await page.getByTestId('achievement-new-definition').click();
    await page.locator('#achievement-id').fill('101');
    await page.locator('#achievement-name').fill('Transient Reward Mapping');

    await selectGraphTab(page, 'Components');
    await page.getByTestId('achievement-add-component').click();
    const component = page.locator('.achievement-graph-card').last();
    await expect(component).toBeVisible();
    await component.getByRole('button', { name: 'Add criterion' }).click();
    await expect(component.locator('.achievement-criterion-card')).toHaveCount(1);
    await expect(component.locator('input[id$="-required"]')).toHaveValue('1');

    await selectGraphTab(page, 'Rewards');
    await page.getByTestId('achievement-add-reward').click();
    await expect(page.locator('#achievement-reward-id-0')).toBeDisabled();
    await expect(page.locator('#achievement-reward-id-0')).toHaveAttribute('placeholder', 'Allocated on save (@0)');
    await page.getByTestId('achievement-enable-reward-set').click();
    await page.locator('#achievement-reward-set-id').fill('700');
    await page.getByTestId('achievement-add-option').click();
    await page.locator('#achievement-reward-option-0').selectOption('1');

    await selectGraphTab(page, 'General');
    await page.getByTestId('achievement-save').click();
    await expect(page.getByText('An audit reason is required before saving.')).toBeVisible();
    expect(state.savePayload).toBeUndefined();
    await page.locator('#achievement-audit-reason').fill('Add a disabled test definition for reviewed progression content.');
    await page.getByTestId('achievement-save').click();
    await expect(page.getByText('Definition graph saved transactionally.')).toBeVisible();

    expect(state.savePayload).toBeTruthy();
    expect(state.savePayload.reason).toBe('Add a disabled test definition for reviewed progression content.');
    expect(state.savePayload.expected_version).toBeUndefined();
    expect(state.savePayload.definition).toMatchObject({
      id: 101,
      name: 'Transient Reward Mapping',
      enabled: false,
    });
    expect(state.savePayload.definition.components).toHaveLength(1);
    expect(state.savePayload.definition.components[0].criteria).toHaveLength(1);
    expect(state.savePayload.definition.rewards[0].reward_id).toBe('');
    expect(state.savePayload.definition.reward_set.mappings).toEqual([{ option_id: 1, reward_id: '@0', sequence: 1 }]);
  });

  test('saves criterion containment and target values without losing signed BIGINT precision', async ({ page }) => {
    const state: AchievementMockState = {};
    const maximumTargetValue = '9223372036854775807';
    await gotoAchievementEditor(page, state);
    await openDefinition(page);
    await selectGraphTab(page, 'Components');

    const targetValue = page.locator('#achievement-criterion-0-0-value');
    await expect(targetValue).toHaveAttribute('type', 'text');
    await expect(targetValue).toHaveValue('50');
    await targetValue.fill(maximumTargetValue);

    await selectGraphTab(page, 'General');
    await page.locator('#achievement-version').fill('3');
    await page.locator('#achievement-audit-reason').fill('Raise the reviewed runtime threshold while preserving exact integer precision.');
    await page.getByTestId('achievement-save').click();
    await expect(page.getByText('Definition graph saved transactionally.')).toBeVisible();

    await expect.poll(() => state.savePayload).toBeTruthy();
    expect(state.savePayload.expected_version).toBe(2);
    expect(state.savePayload.expected_revision).toBe('definition-rev-100');
    const savedCriterion = state.savePayload.definition.components[0].criteria[0];
    expect(savedCriterion).toMatchObject({
      id: '4000',
      component_type: 0,
      component_sequence: 1,
      component_id: 1000,
      target_value: maximumTargetValue,
    });
    expect(typeof savedCriterion.target_value).toBe('string');

    await selectGraphTab(page, 'Components');
    await expect(targetValue).toHaveValue(maximumTargetValue);
  });

  test('renders the native item sprite in criterion item lookup results', async ({ page }) => {
    await gotoAchievementEditor(page);
    await openDefinition(page);
    await selectGraphTab(page, 'Components');

    await page.locator('#achievement-criterion-0-0-event').selectOption('6');
    const picker = page.locator('.achievement-reference-picker').filter({
      has: page.locator('#achievement-criterion-0-0-target1'),
    });
    await picker.getByRole('button', { name: 'Find' }).click();
    await picker.locator('#achievement-criterion-0-0-target1-lookup-search').fill('10909');
    await picker.getByRole('button', { name: 'Search' }).click();

    const result = picker.getByRole('button', { name: /10909.*Blade of Tactics/ });
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute('aria-pressed', 'false');
    await expect(result).toHaveCSS('display', 'grid');
    await expect(result).toHaveCSS('text-align', 'left');
    await expect(result).toHaveCSS('background-image', 'none');
    await expect(result.locator('[data-item-icon="590"]')).toBeVisible();
    await expect(result.locator('.item-590-sm')).toBeVisible();
  });

  test('educates and searches specific AA ability rewards while accepting a valid automatic fallback pair', async ({ page }) => {
    const aaDefinition = clone(definition);
    aaDefinition.rewards = [
      { reward_id: '5000', sequence: 1, reward_type: 6, reward_data_id: 30300, amount: '2', description: 'Seasonal Martial Aptitude II', enabled: true },
      { reward_id: '5001', sequence: 2, reward_type: 7, reward_data_id: 30300, amount: '3', description: '3 AA points for ineligible classes', enabled: true },
    ];
    await gotoAchievementEditor(page, { definitionOverride: aaDefinition });
    await openDefinition(page);
    await selectGraphTab(page, 'Rewards');

    const rewards = page.getByTestId('achievement-tab-rewards');
    await expect(rewards).toContainText('Specific AA ability');
    await expect(rewards).toContainText('Inverse-class fallback');
    await expect(rewards.locator('label[for="achievement-reward-amount-0"]')).toHaveText('Desired cumulative rank');
    await expect(rewards.locator('label[for="achievement-reward-amount-1"]')).toHaveText('Fallback AA points');
    await expect(page.locator('#achievement-reward-amount-help-0')).toContainText('aa_ranks.next_id');

    const picker = page.locator('.achievement-reference-picker').filter({ has: page.locator('#achievement-reward-data-0') });
    await picker.getByRole('button', { name: 'Find' }).click();
    await picker.locator('#achievement-reward-data-0-lookup-search').fill('30300');
    await picker.getByRole('button', { name: 'Search' }).click();
    const result = picker.getByRole('button', { name: /30300.*Seasonal Martial Aptitude/ });
    await expect(result).toContainText('class mask 33089');

    await selectGraphTab(page, 'Validation');
    await expect(page.getByTestId('achievement-tab-validation')).not.toContainText('automatic class-ineligible AA fallback requires');
  });

  test('narrows version checks to runtime policy and drops stale server findings after edits', async ({ page }) => {
    const staleFinding = 'The loaded server snapshot reported a stale reference.';
    const state: AchievementMockState = {
      definitionValidation: {
        findings: [{ path: 'server.reference', message: staleFinding, level: 'error' }],
      },
    };
    await gotoAchievementEditor(page, state);
    await openDefinition(page);
    await selectGraphTab(page, 'Validation');
    await expect(page.getByTestId('achievement-tab-validation')).toContainText(staleFinding);

    await selectGraphTab(page, 'Components');
    await page.locator('#achievement-component-description-0').fill('Updated player-facing presentation copy.');
    await selectGraphTab(page, 'Validation');
    await expect(page.getByTestId('achievement-tab-validation')).not.toContainText(staleFinding);
    await expect(page.getByTestId('achievement-tab-validation')).not.toContainText('Runtime evaluation or reward policy changed.');

    await selectGraphTab(page, 'Components');
    await page.locator('#achievement-criterion-0-0-value').fill('51');
    await selectGraphTab(page, 'Validation');
    await expect(page.getByTestId('achievement-tab-validation')).toContainText('Runtime evaluation or reward policy changed.');
  });

  test('requires a definition version bump when reset-on-version-change policy is toggled', async ({ page }) => {
    await gotoAchievementEditor(page);
    await openDefinition(page);

    const resetOnVersionChangeField = page.getByTestId('achievement-tab-general')
      .locator('.achievement-checkbox-field')
      .filter({ hasText: 'Reset old state' });
    const resetOnVersionChange = resetOnVersionChangeField.locator('input[type="checkbox"]');
    const resetOnVersionChangeToggle = resetOnVersionChangeField.locator('label.eq-checkbox-label');
    await expect(resetOnVersionChange).not.toBeChecked();
    await resetOnVersionChangeToggle.click();
    await expect(resetOnVersionChange).toBeChecked();

    await selectGraphTab(page, 'Validation');
    await expect(page.getByTestId('achievement-tab-validation')).toContainText('Runtime evaluation or reward policy changed.');

    await selectGraphTab(page, 'General');
    await resetOnVersionChangeToggle.click();
    await expect(resetOnVersionChange).not.toBeChecked();
    await selectGraphTab(page, 'Validation');
    await expect(page.getByTestId('achievement-tab-validation')).not.toContainText('Runtime evaluation or reward policy changed.');
  });

  test('allows a disabled source link to stage an enabled set option without a grant', async ({ page }) => {
    const staged = clone(definition);
    staged.reward_set = {
      reward_set_id: 700,
      title: 'Staged choices',
      enabled: true,
      source_enabled: false,
      options: [{ option_id: 1, sequence: 1, label: 'Future choice', common_to_all: false, flags: 0, enabled: true }],
      mappings: [],
    };
    await gotoAchievementEditor(page, { definitionOverride: staged });
    await openDefinition(page);
    await selectGraphTab(page, 'Validation');
    await expect(page.getByTestId('achievement-tab-validation')).not.toContainText('has no enabled grant');
  });

  test('allows a disabled definition to retain its source and set policy', async ({ page }) => {
    const staged = clone(definition);
    staged.enabled = false;
    staged.reward_set = {
      reward_set_id: 700,
      title: 'Retained choices',
      enabled: true,
      source_enabled: true,
      options: [{ option_id: 1, sequence: 1, label: 'Choice', common_to_all: false, flags: 0, enabled: true }],
      mappings: [{ option_id: 1, reward_id: '5000' }],
    };
    await gotoAchievementEditor(page, { definitionOverride: staged });
    await openDefinition(page);
    await selectGraphTab(page, 'Validation');
    await expect(page.getByTestId('achievement-tab-validation')).not.toContainText('Disable the selectable reward set before disabling its achievement');
    await expect(page.getByTestId('achievement-tab-validation')).toContainText('No client-side blockers');
  });

  test('protects shared reward catalog fields while leaving this source link editable', async ({ page }) => {
    const shared = clone(definition);
    shared.reward_set = {
      reward_set_id: 700,
      title: 'Shared choices',
      enabled: true,
      source_enabled: true,
      shared: true,
      source_count: 2,
      options: [{ option_id: 1, sequence: 1, label: 'Choice', common_to_all: false, flags: 0, enabled: true }],
      mappings: [{ option_id: 1, sequence: 1, reward_id: '5000' }],
    };
    await gotoAchievementEditor(page, { definitionOverride: shared });
    await openDefinition(page);
    await selectGraphTab(page, 'Rewards');

    const rewards = page.getByTestId('achievement-tab-rewards');
    await expect(rewards).toContainText('used by 2 sources');
    await expect(rewards).toContainText('mapped by a shared reward set');
    await expect(page.locator('#achievement-reward-type-0')).toBeDisabled();
    await expect(page.locator('#achievement-reward-amount-0')).toBeDisabled();
    await expect(page.locator('#achievement-reward-set-title')).toBeDisabled();
    await expect(page.locator('#achievement-reward-option-0')).toBeDisabled();

    const sourceToggle = rewards.locator('.achievement-checkbox-field').filter({ hasText: 'Source link enabled' }).locator('input[type="checkbox"]');
    const setToggle = rewards.locator('.achievement-checkbox-field').filter({ hasText: 'Set enabled' }).locator('input[type="checkbox"]');
    await expect(sourceToggle).toBeEnabled();
    await expect(setToggle).toBeDisabled();
  });

  test('sends the selected reward-content catalog filter to the bounded directory query', async ({ page }) => {
    await gotoAchievementEditor(page);
    const filteredRequest = page.waitForRequest(request => {
      const url = new URL(request.url());
      return url.pathname.endsWith('/achievement-editor/definitions') && url.searchParams.get('reward') === 'selectable';
    });

    await page.locator('#achievement-reward-content-filter').selectOption('selectable');
    const request = await filteredRequest;
    const url = new URL(request.url());
    expect(url.searchParams.get('reward')).toBe('selectable');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('limit')).toBe('25');
  });

  test('requires exact typed confirmation for clone and delete', async ({ page }) => {
    const state: AchievementMockState = {};
    await gotoAchievementEditor(page, state);
    await openDefinition(page);

    await page.getByTestId('achievement-clone').click();
    const cloneSubmit = page.getByTestId('achievement-confirm-clone');
    await expect(cloneSubmit).toBeDisabled();
    await page.locator('#achievement-clone-id').fill('200');
    await page.locator('#achievement-clone-name').fill('Pathfinder Clone');
    await page.locator('#achievement-clone-reason').fill('Create a disabled variant for review.');
    await page.locator('#achievement-clone-confirmation').fill('CLONE 100');
    await expect(cloneSubmit).toBeEnabled();
    await cloneSubmit.click();
    await expect.poll(() => state.clonePayload && state.clonePayload.confirmation).toBe('CLONE 100');
    expect(state.clonePayload.expected_revision).toBe('definition-rev-100');
    await expect(page.locator('#achievement-id')).toHaveValue('200');

    await page.getByTestId('achievement-delete').click();
    const deleteSubmit = page.getByTestId('achievement-confirm-delete');
    await expect(deleteSubmit).toBeDisabled();
    await page.locator('#achievement-delete-reason').fill('Remove the unneeded disabled test clone.');
    await page.locator('#achievement-delete-confirmation').fill('DELETE 200');
    await expect(deleteSubmit).toBeEnabled();
    await deleteSubmit.click();
    await expect.poll(() => state.deletePayload && state.deletePayload.confirmation).toBe('DELETE 200');
    expect(state.deletePayload.reason).toBe('Remove the unneeded disabled test clone.');
    expect(state.deletePayload.expected_revision).toBe('definition-rev-200');
  });

  test('edits category hierarchy with exact string icon and optimistic parent guard', async ({ page }) => {
    const state: AchievementMockState = {};
    await gotoAchievementEditor(page, state);

    await page.getByTestId('achievement-mode-categories').click();
    const directory = page.getByTestId('achievement-category-directory');
    await directory.getByText('Exploration', { exact: true }).click();
    await expect(page.getByTestId('achievement-category-editor')).toBeVisible();
    await expect(page.locator('#achievement-category-icon')).toHaveValue('AchievementIcons/World');
    await expect(page.locator('#achievement-category-icon-help')).toContainText('exact client texture');

    await page.locator('#achievement-category-name').fill('World Exploration');
    await page.locator('#achievement-category-reason').fill('Clarify the category name shown to players.');
    await page.getByTestId('achievement-save-category').click();
    await expect.poll(() => state.categoryPayload && state.categoryPayload.reason).toBe('Clarify the category name shown to players.');
    expect(state.categoryPayload.expected_parent_id).toBe(0);
    expect(state.categoryPayload.expected_revision).toBe('category-rev-1');
    expect(state.categoryPayload.category.icon).toBe('AchievementIcons/World');
  });

  test('keeps the directory and nested graph inside the editor at compact width', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await gotoAchievementEditor(page);
    await openDefinition(page);
    await selectGraphTab(page, 'Components');

    const layout = await page.getByTestId('achievement-editor').evaluate(element => {
      const editor = element as HTMLElement;
      const cards = Array.from(editor.querySelectorAll('.achievement-graph-card')) as HTMLElement[];
      return {
        overflow: editor.scrollWidth - editor.clientWidth,
        gridColumns: window.getComputedStyle(editor.querySelector('.achievement-form-grid--4') as HTMLElement).gridTemplateColumns,
        cardsFit: cards.every(card => card.getBoundingClientRect().right <= editor.getBoundingClientRect().right + 1),
      };
    });
    expect(layout.overflow).toBeLessThanOrEqual(1);
    expect(layout.gridColumns.trim().split(/\s+/)).toHaveLength(1);
    expect(layout.cardsFit).toBe(true);
  });
});
