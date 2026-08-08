/* eslint-disable camelcase -- API DTOs intentionally mirror EQEmu's snake_case schema. */
export interface AchievementEnumOption {
  value: number | string
  label: string
  help: string
  lookup?: string | null
  allowed_progress_modes?: number[]
  target1_label?: string
  target1_help?: string
  target2_label?: string
  target2_help?: string
  target_value_label?: string
  target_value_help?: string
}

export interface AchievementValidationIssue {
  path: string
  message: string
  level: 'error' | 'warning'
}

// The API body wraps the graph with audit and optimistic-concurrency fields.
// Reserve enough UTF-8 space for that envelope so client validation cannot
// approve a graph that Echo will reject at the exact 2 MiB body boundary.
const GRAPH_MUTATION_ENVELOPE_RESERVE_BYTES = 4096
const TEXT_MAX_BYTES = 65535

export const CANONICAL_SKILLS: AchievementEnumOption[] = [
  '1H Blunt', '1H Slashing', '2H Blunt', '2H Slashing', 'Abjuration', 'Alteration',
  'Apply Poison', 'Archery', 'Backstab', 'Bind Wound', 'Bash', 'Block', 'Brass Instruments',
  'Channeling', 'Conjuration', 'Defense', 'Disarm', 'Disarm Traps', 'Divination', 'Dodge',
  'Double Attack', 'Dragon Punch', 'Dual Wield', 'Eagle Strike', 'Evocation', 'Feign Death',
  'Flying Kick', 'Forage', 'Hand to Hand', 'Hide', 'Kick', 'Meditate', 'Mend', 'Offense',
  'Parry', 'Pick Lock', '1H Piercing', 'Riposte', 'Round Kick', 'Safe Fall', 'Sense Heading',
  'Singing', 'Sneak', 'Specialize Abjure', 'Specialize Alteration', 'Specialize Conjuration',
  'Specialize Divination', 'Specialize Evocation', 'Pick Pockets', 'Stringed Instruments',
  'Swimming', 'Throwing', 'Tiger Claw', 'Tracking', 'Wind Instruments', 'Fishing', 'Make Poison',
  'Tinkering', 'Research', 'Alchemy', 'Baking', 'Tailoring', 'Sense Traps', 'Blacksmithing',
  'Fletching', 'Brewing', 'Alcohol Tolerance', 'Begging', 'Jewelry Making', 'Pottery',
  'Percussion Instruments', 'Intimidation', 'Berserking', 'Taunt', 'Frenzy', 'Remove Trap',
  'Triple Attack', '2H Piercing'
].map((label, value) => ({ value, label, help: 'Canonical EQ skill ID ' + value + '.' }))

export const CANONICAL_CLASSES: AchievementEnumOption[] = [
  'Warrior', 'Cleric', 'Paladin', 'Ranger', 'Shadowknight', 'Druid', 'Monk', 'Bard',
  'Rogue', 'Shaman', 'Necromancer', 'Wizard', 'Magician', 'Enchanter', 'Beastlord', 'Berserker'
].map((label, index) => ({ value: index + 1, label, help: 'Playable class ID ' + (index + 1) + '.' }))

const eventHelp = (
  value: number,
  label: string,
  help: string,
  target1Label: string,
  target1Help: string,
  target2Label: string,
  target2Help: string,
  targetValueLabel: string,
  targetValueHelp: string,
  lookup: string | null,
  modes: number[]
): AchievementEnumOption => ({
  value,
  label,
  help,
  target1_label: target1Label,
  target1_help: target1Help,
  target2_label: target2Label,
  target2_help: target2Help,
  target_value_label: targetValueLabel,
  target_value_help: targetValueHelp,
  lookup,
  allowed_progress_modes: modes
})

export const FALLBACK_METADATA: any = {
  limits: {
    payload_bytes: 2097152,
    text_bytes: TEXT_MAX_BYTES,
    associations: 100,
    components: 1000,
    criteria: 2000,
    rewards: 500,
    restrictions: 500,
    options: 500,
    lookup_results: 25
  },
  component_types: [
    { value: 0, label: 'Type 0 (state-bearing)', help: 'Stores criterion state and is shown by clients.' },
    { value: 1, label: 'Type 1 (state-bearing)', help: 'Stores criterion state and is shown by clients.' },
    { value: 2, label: 'Type 2 (state-bearing)', help: 'Stores criterion state and is shown by clients.' },
    { value: 3, label: 'Type 3 (presentation only)', help: 'Presentation-only component. It cannot contain enabled criteria.' }
  ],
  progress_modes: [
    { value: 0, label: 'Increment', help: 'Adds each matching event value to stored progress.' },
    { value: 1, label: 'Highest', help: 'Keeps the greatest observed value.' },
    { value: 2, label: 'Set', help: 'Replaces progress with the latest observed value.' },
    { value: 3, label: 'Boolean', help: 'Evaluates whether the event-specific threshold is satisfied.' }
  ],
  behaviors: [
    { value: 0, label: 'Required', help: 'Must be satisfied for the achievement to complete.' },
    { value: 1, label: 'Optional', help: 'Tracks and displays progress without blocking completion.' },
    { value: 2, label: 'Unlock', help: 'Controls when related content becomes available.' },
    { value: 3, label: 'Visibility', help: 'Controls whether related content is visible.' },
    { value: 4, label: 'Display Only', help: 'Presents information without completion semantics.' },
    { value: 5, label: 'Blocker', help: 'Prevents completion while its condition is satisfied.' }
  ],
  reward_types: [
    { value: 0, label: 'Item', help: 'Reward data is an item ID; amount is the stack quantity.' },
    { value: 1, label: 'Experience', help: 'Reward data is normally 0 (or 1 for raw normal-only XP); amount is experience.' },
    { value: 2, label: 'Alternate Advancement', help: 'Reward data must be 0; amount is AA points.' },
    { value: 3, label: 'Copper', help: 'Reward data must be 0; amount is copper pieces.' },
    { value: 4, label: 'Alternate Currency', help: 'Reward data is the currency ID; amount is currency granted.' },
    { value: 5, label: 'Title', help: 'Reward data is the title-set ID; amount must be positive.' }
  ],
  events: [
    eventHelp(0, 'Manual', 'No engine event is observed. Quest or administrative APIs update it.', 'Target ID', 'Normally 0.', 'Secondary target', 'Must be 0.', 'Target value', 'Normally 0.', null, [0, 1, 2, 3]),
    eventHelp(1, 'Level', 'Compares the character current level.', 'Target ID', 'Must be 0.', 'Secondary target', 'Must be 0.', 'Minimum level', 'A positive milestone; required for Boolean mode.', null, [1, 2, 3]),
    eventHelp(2, 'NPC Type Kill', 'Counts kills by npc_types ID.', 'NPC type ID', 'Exact npc_types ID, or 0 for any NPC.', 'Secondary target', 'Must be 0.', 'Event value', 'Normally 1 per kill.', 'npc', [0, 1, 2, 3]),
    eventHelp(3, 'NPC Race Kill', 'Counts kills by race.', 'Race ID', 'Use npc_types.race or an intentional custom engine race ID; 0 matches any race. No current NPC row is advisory only.', 'Secondary target', 'Must be 0.', 'Event value', 'Normally 1 per kill.', 'race', [0, 1, 2, 3]),
    eventHelp(4, 'Task Complete', 'Observes completion of an exact task.', 'Task ID', 'A nonzero task ID is required.', 'Secondary target', 'Must be 0.', 'Completion value', 'Use 0 or 1.', 'task', [1, 2, 3]),
    eventHelp(5, 'Zone Enter', 'Observes entry into a zone.', 'Zone ID', 'zone.zoneidnumber, or 0 for any zone.', 'Secondary target', 'Must be 0.', 'Event value', 'Normally 1.', 'zone', [0, 1, 2, 3]),
    eventHelp(6, 'Loot Item', 'Observes items moved into inventory by looting.', 'Item ID', 'Exact item ID, or 0 for any item.', 'Secondary target', 'Must be 0.', 'Minimum quantity', 'Minimum quantity transferred by one event.', 'item', [0, 1, 2, 3]),
    eventHelp(7, 'Own Item', 'Compares the greatest owned quantity for one item.', 'Item ID', 'Exact item ID, or 0 for any item.', 'Required class', 'Optional class ID 1-16, or 0 for any class.', 'Minimum quantity', 'Positive threshold; required for Boolean mode.', 'item', [1, 2, 3]),
    eventHelp(8, 'Tradeskill Success', 'Observes successful recipe combines.', 'Recipe ID', 'Exact recipe ID, or 0 for any recipe.', 'Secondary target', 'Must be 0.', 'Event value', 'Use 0 or 1.', 'recipe', [0, 1, 2, 3]),
    eventHelp(9, 'Skill Value', 'Compares a current skill value.', 'Skill ID', 'Canonical skill 0-77. Use 4294967295 for wildcard because skill 0 is valid.', 'Secondary target', 'Must be 0.', 'Minimum skill', 'Positive threshold; required for Boolean mode.', 'skill', [1, 2, 3]),
    eventHelp(10, 'Alternate Advancement', 'Compares total spent AA points.', 'Target ID', 'Must be 0.', 'Secondary target', 'Must be 0.', 'Minimum spent AA', 'Positive threshold; required for Boolean mode.', null, [1, 2, 3]),
    eventHelp(11, 'Achievement Complete', 'Observes another achievement completion.', 'Achievement ID', 'Exact achievement ID, or 0 for any achievement.', 'Secondary target', 'Must be 0.', 'Completion value', 'Use 0 or 1.', 'achievement', [1, 2, 3]),
    eventHelp(12, 'NPC Name Kill', 'Counts kills by canonicalized NPC name hash.', 'NPC name hash', 'Unsigned 32-bit FNV-1a of the canonical NPC name.', 'Zone ID', 'Zone ID, or 0 for any zone.', 'Event value', 'Normally 1 per kill.', 'npc-name', [0, 1, 2, 3]),
    eventHelp(13, 'Skill Cap', 'Compares a class skill against its database-backed cap at a milestone level.', 'Skill ID', 'Canonical skill 0-77.', 'Required class', 'A class ID from 1-16 is required.', 'Milestone level', 'A level from 1-255; required for Boolean mode.', 'skill', [1, 2, 3])
  ],
  classes: CANONICAL_CLASSES,
  skills: CANONICAL_SKILLS,
  fields: {}
}

export const FIELD_HELP: any = {
  achievements: {
    id: ['Stable achievement ID', 'A nonzero durable identifier used by character state, scripts, dependencies, and rewards. It cannot be changed after creation.'],
    name: ['Name', 'The player-facing achievement name and primary editor search label.'],
    description: ['Description', 'Player-facing explanation of what is required. Limited to 65,535 UTF-8 bytes by the source TEXT column.'],
    icon_id: ['Icon ID', 'Unsigned client icon identifier. Use 0 when no verified icon is known.'],
    points: ['Points', 'Score awarded for completing the achievement.'],
    reward_display: ['Reward display value', 'Unsigned client presentation/provenance value only; it does not deliver rewards.'],
    world_display_flag: ['World display flag', 'Controls newer-client world presentation. Older clients such as RoF2 may ignore it.'],
    definition_version: ['Definition version', 'Nonzero durable schema version. Increment only when a deployed graph change makes old character state incompatible.'],
    reset_on_version_change: ['Reset on version change', 'When enabled, a version mismatch removes old completion, progress, reward, and selection state.'],
    enabled: ['Published', 'Only enabled, valid definitions enter the active server snapshot. New definitions are intentionally disabled.']
  },
  associations: {
    category_id: ['Category', 'An existing category used to organize the achievement in the client.'],
    sequence: ['Display order', 'Ordering within this achievement category.'],
    display_text: ['Display override', 'Optional category-specific display text. Leave blank to use the achievement name.']
  },
  components: {
    component_type: ['Wire type', 'Client component wire type 0-3. Type 3 is presentation-only and cannot contain enabled criteria.'],
    sequence: ['Client order', 'Client display ordering value. RoF2 effectively clamps this to 255.'],
    component_id: ['Component ID', 'Stable identifier unique with achievement and wire type. Zero is valid.'],
    description: ['Primary description', 'Player-facing component requirement text. Limited to 65,535 UTF-8 bytes by the source TEXT column.'],
    description_2: ['Secondary description', 'Optional second line of player-facing component text. Limited to 65,535 UTF-8 bytes by the source TEXT column.'],
    presentation_count: ['Presentation count', 'Default count shown by the client. Enabled criteria may supply the authoritative required count.']
  },
  criteria: {
    event_type: ['Event', 'The engine event or state comparison that updates this criterion.'],
    progress_mode: ['Progress mode', 'How matching event values are accumulated or compared.'],
    behavior: ['Behavior', 'How the criterion affects completion, visibility, or presentation.'],
    target_id: ['Target ID', 'Event-specific primary selector. Review the selected event explanation before editing.'],
    target_id2: ['Secondary target', 'Event-specific secondary selector. Many events require this to remain 0.'],
    target_value: ['Target value', 'Event-specific threshold or minimum event filter.'],
    required_count: ['Required count', 'Explicit nonzero amount of progress required for this criterion.'],
    enabled: ['Enabled', 'Disabled criteria remain authored but do not participate in active evaluation.']
  },
  rewards: {
    reward_id: ['Reward ID', 'Stable unsigned BIGINT identity allocated transactionally for a new blank row. Persisted IDs are immutable and must never be renumbered.'],
    sequence: ['Delivery order', 'Unique ordering among canonical rewards.'],
    reward_type: ['Reward type', 'Controls how reward data and amount are interpreted.'],
    reward_data_id: ['Referenced data', 'Type-specific ID such as item, alternate currency, or title-set ID.'],
    amount: ['Amount', 'Positive quantity delivered when this grant is awarded.'],
    description: ['Client description', 'Player-facing reward text. The server may derive a fallback when blank.'],
    enabled: ['Enabled', 'Disabled grants remain authored but are not delivered.']
  },
  reward_sets: {
    reward_set_id: ['Stable set ID', 'Nonzero durable identity for this selectable reward set.'],
    title: ['Prompt / title', 'Player-facing selection prompt; the achievement name is used when blank.'],
    enabled: ['Use selectable rewards', 'Requires an enabled non-common choice and an enabled grant for every enabled option.']
  },
  reward_options: {
    option_id: ['Option ID', 'Stable nonzero identity for the selectable row.'],
    sequence: ['Display order', 'Ordering in the client selection list.'],
    label: ['Label', 'Player-facing choice label.'],
    common_to_all: ['Common', 'A common option is combined with exactly one enabled non-common choice.'],
    flags: ['Flags', 'Wire-level option flags. Use 0 unless server/client behavior is documented.'],
    enabled: ['Enabled', 'Every enabled option must map to at least one enabled canonical reward.']
  },
  restrictions: {
    restriction_id: ['Restriction ID', 'Existing spell cast-restriction number. All rows sharing an ID must pass.'],
    requires_completed: ['Required state', 'Enabled means the achievement must be complete; disabled means it must remain incomplete.']
  },
  categories: {
    id: ['Category ID', 'Stable nonzero category identity used by achievement associations.'],
    parent_id: ['Parent category', 'Parent category ID, or 0 for a root category. Cycles are rejected.'],
    sequence: ['Display order', 'Ordering among sibling categories.'],
    name: ['Name', 'Player-facing category name.'],
    description: ['Description', 'Short editor and client explanation of this category.'],
    icon: ['Icon', 'Client category icon value stored as text. Preserve the exact server value; leave blank when no verified icon is known.']
  }
}

export function deepClone<T> (value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function numberValue (value: any, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function stringValue (value: any, fallback = ''): string {
  return value === undefined || value === null ? fallback : String(value)
}

function boolValue (value: any, fallback = false): boolean {
  if (value === undefined || value === null) return fallback
  return value === true || value === 1 || value === '1' || value === 'true'
}

export function enumOptions (metadata: any, key: string): AchievementEnumOption[] {
  const source = metadata && metadata[key] !== undefined ? metadata[key] : FALLBACK_METADATA[key]
  if (Array.isArray(source)) {
    return source.map((row: any) => typeof row === 'object'
      ? {
        ...row,
        value: row.value === undefined ? row.id : row.value,
        label: row.label || row.name || String(row.value),
        help: row.help || '',
        target1_label: row.target1_label || row.target_id_label,
        target1_help: row.target1_help || row.target_id_help,
        target2_label: row.target2_label || row.target_id2_label,
        target2_help: row.target2_help || row.target_id2_help
      }
      : { value: row, label: String(row), help: '' })
  }
  if (source && typeof source === 'object') {
    return Object.keys(source).map(keyValue => {
      const row = source[keyValue]
      return typeof row === 'object'
        ? { ...row, value: row.value === undefined ? numberValue(keyValue, keyValue as any) : row.value, label: row.label || row.name || keyValue, help: row.help || '' }
        : { value: numberValue(keyValue, keyValue as any), label: String(row), help: '' }
    })
  }
  return []
}

export function mergeMetadata (raw: any): any {
  const metadata = raw && raw.metadata ? raw.metadata : (raw || {})
  const serverLimits = metadata.limits || {}
  return {
    ...deepClone(FALLBACK_METADATA),
    ...metadata,
    limits: {
      ...FALLBACK_METADATA.limits,
      ...serverLimits,
      payload_bytes: Number(serverLimits.max_graph_bytes || serverLimits.payload_bytes || FALLBACK_METADATA.limits.payload_bytes),
      text_bytes: Number(serverLimits.max_text_bytes || serverLimits.text_bytes || FALLBACK_METADATA.limits.text_bytes),
      associations: Number(serverLimits.max_associations || serverLimits.associations || FALLBACK_METADATA.limits.associations),
      components: Number(serverLimits.max_components || serverLimits.components || FALLBACK_METADATA.limits.components),
      criteria: Number(serverLimits.max_criteria || serverLimits.criteria || FALLBACK_METADATA.limits.criteria),
      rewards: Number(serverLimits.max_rewards || serverLimits.rewards || FALLBACK_METADATA.limits.rewards),
      restrictions: Number(serverLimits.max_restrictions || serverLimits.restrictions || FALLBACK_METADATA.limits.restrictions),
      options: Number(serverLimits.max_reward_options || serverLimits.options || FALLBACK_METADATA.limits.options)
    },
    fields: { ...(FALLBACK_METADATA.fields || {}), ...(metadata.fields || {}) },
    skills: CANONICAL_SKILLS,
    classes: enumOptions(metadata, 'classes').length ? enumOptions(metadata, 'classes') : CANONICAL_CLASSES
  }
}

export function fieldHelp (metadata: any, table: string, field: string): { label: string, help: string } {
  const aliases: any = {
    categories: 'achievement_categories',
    associations: 'achievement_category_associations',
    components: 'achievement_components',
    criteria: 'achievement_criteria',
    rewards: 'achievement_rewards',
    reward_sets: 'achievement_reward_sets',
    reward_options: 'achievement_reward_options',
    restrictions: 'achievement_cast_restrictions'
  }
  const serverTable = aliases[table] || table
  const server = metadata && metadata.fields && metadata.fields[serverTable] && metadata.fields[serverTable][field]
  const fallback = FIELD_HELP[table] && FIELD_HELP[table][field]
  const result = {
    label: (server && server.label) || (fallback && fallback[0]) || field.replace(/_/g, ' '),
    help: (server && server.help) || (fallback && fallback[1]) || 'Stored as part of the achievement definition graph.'
  }
  if (table === 'rewards' && field === 'reward_id' && result.help.toLowerCase().indexOf('blank') === -1) {
    result.help += ' Leave a new row blank so the server allocates it transactionally.'
  }
  return result
}

export function canonicalizeNpcName (value: string): string {
  let result = ''
  let separatorPending = false
  const input = stringValue(value)
  for (let index = 0; index < input.length; index++) {
    let code = input.charCodeAt(index)
    if (code === 32 || code === 95) {
      if (result) separatorPending = true
      continue
    }
    if (code >= 65 && code <= 90) code += 32
    if (code < 97 || code > 122) continue
    if (separatorPending && result) result += ' '
    result += String.fromCharCode(code)
    separatorPending = false
  }
  return result
}

export function npcNameHash (value: string): number {
  const canonical = canonicalizeNpcName(value)
  if (!canonical) return 0
  let hash = 2166136261
  for (let index = 0; index < canonical.length; index++) {
    hash ^= canonical.charCodeAt(index)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash >>> 0
}

export function emptyCriterion (): any {
  return { component_type: 0, component_sequence: 0, component_id: 0, event_type: 0, progress_mode: 0, behavior: 0, target_id: 0, target_id2: 0, target_value: '0', required_count: 1, enabled: false }
}

export function emptyComponent (sequence = 1): any {
  return { component_type: 0, sequence, component_id: sequence, description: '', description_2: '', presentation_count: 1, criteria: [] }
}

export function emptyReward (sequence = 1, rewardID?: number): any {
  return { reward_id: rewardID ? String(rewardID) : '', sequence, reward_type: 0, reward_data_id: 0, amount: '1', description: '', enabled: false }
}

export function emptyRewardOption (sequence = 1): any {
  return { option_id: sequence, sequence, label: '', common_to_all: false, flags: 0, enabled: false }
}

export function emptyDefinition (id = 0): any {
  return {
    id,
    name: '',
    description: '',
    icon_id: 0,
    points: 0,
    reward_display: 0,
    world_display_flag: 0,
    definition_version: 1,
    reset_on_version_change: false,
    enabled: false,
    associations: [],
    components: [],
    rewards: [],
    reward_set: null,
    restrictions: []
  }
}

export function normalizeDefinition (raw: any): any {
  const source = raw && (raw.definition || raw.graph) ? (raw.definition || raw.graph) : (raw || {})
  const graph = emptyDefinition(numberValue(source.id))
  Object.assign(graph, {
    id: numberValue(source.id),
    name: stringValue(source.name),
    description: stringValue(source.description),
    icon_id: numberValue(source.icon_id),
    points: numberValue(source.points),
    reward_display: numberValue(source.reward_display),
    world_display_flag: numberValue(source.world_display_flag),
    definition_version: numberValue(source.definition_version, 1),
    reset_on_version_change: boolValue(source.reset_on_version_change),
    enabled: boolValue(source.enabled)
  })
  graph.associations = (source.associations || []).map((row: any) => ({
    category_id: numberValue(row.category_id),
    sequence: numberValue(row.sequence),
    display_text: stringValue(row.display_text)
  }))
  graph.components = (source.components || []).map((component: any) => {
    const componentType = numberValue(component.component_type)
    const componentSequence = numberValue(component.sequence)
    const componentID = numberValue(component.component_id)
    return {
      component_type: componentType,
      sequence: componentSequence,
      component_id: componentID,
      description: stringValue(component.description),
      description_2: stringValue(component.description_2),
      presentation_count: numberValue(component.presentation_count, 1),
      recovery_only: boolValue(component.recovery_only),
      recovery_action: stringValue(component.recovery_action),
      recovery_reason: stringValue(component.recovery_reason),
      recovery_criteria_count: numberValue(component.recovery_criteria_count),
      criteria: (component.criteria || []).map((criterion: any) => ({
        ...(criterion.id !== undefined ? { id: criterion.id } : {}),
        component_type: componentType,
        component_sequence: componentSequence,
        component_id: componentID,
        event_type: numberValue(criterion.event_type),
        progress_mode: numberValue(criterion.progress_mode),
        behavior: numberValue(criterion.behavior),
        target_id: numberValue(criterion.target_id),
        target_id2: numberValue(criterion.target_id2),
        target_value: stringValue(criterion.target_value, '0'),
        required_count: numberValue(criterion.required_count, 1),
        enabled: boolValue(criterion.enabled)
      }))
    }
  })
  graph.rewards = (source.rewards || []).map((reward: any) => ({
    reward_id: stringValue(reward.reward_id),
    sequence: numberValue(reward.sequence),
    reward_type: numberValue(reward.reward_type),
    reward_data_id: numberValue(reward.reward_data_id),
    amount: stringValue(reward.amount, '1'),
    description: stringValue(reward.description),
    enabled: boolValue(reward.enabled)
  }))
  graph.reward_set = source.reward_set
    ? {
    reward_set_id: numberValue(source.reward_set.reward_set_id),
    title: stringValue(source.reward_set.title),
    enabled: boolValue(source.reward_set.enabled),
    options: (source.reward_set.options || []).map((option: any) => ({
      option_id: numberValue(option.option_id),
      sequence: numberValue(option.sequence),
      label: stringValue(option.label),
      common_to_all: boolValue(option.common_to_all),
      flags: numberValue(option.flags),
      enabled: boolValue(option.enabled)
    })),
    mappings: (source.reward_set.mappings || []).map((mapping: any) => ({
      option_id: numberValue(mapping.option_id),
      reward_id: stringValue(mapping.reward_id)
    }))
    }
    : null
  graph.restrictions = (source.restrictions || []).map((row: any) => ({
    restriction_id: numberValue(row.restriction_id),
    requires_completed: boolValue(row.requires_completed)
  }))
  return graph
}

function addIssue (issues: AchievementValidationIssue[], path: string, message: string, level: 'error' | 'warning' = 'error'): void {
  issues.push({ path, message, level })
}

function duplicateValues (rows: any[], value: (row: any) => string): string[] {
  const seen: any = {}
  const duplicate: any = {}
  rows.forEach(row => {
    const key = value(row)
    if (seen[key]) duplicate[key] = true
    seen[key] = true
  })
  return Object.keys(duplicate)
}

function validUnsignedDecimal (value: any, allowZero = false): boolean {
  const decimal = String(value === undefined || value === null ? '' : value).trim()
  if (!/^\d+$/.test(decimal)) return false
  const normalized = decimal.replace(/^0+(?=\d)/, '')
  if (!allowZero && normalized === '0') return false
  const maximum = '18446744073709551615'
  return normalized.length < maximum.length || (normalized.length === maximum.length && normalized <= maximum)
}

function decimalFitsUint32 (value: any): boolean {
  const decimal = String(value === undefined || value === null ? '' : value).replace(/^0+(?=\d)/, '')
  const maximum = '4294967295'
  return /^\d+$/.test(decimal) && (decimal.length < maximum.length || (decimal.length === maximum.length && decimal <= maximum))
}

function normalizedUnsignedDecimal (value: any): string {
  return String(value === undefined || value === null ? '' : value).trim().replace(/^0+(?=\d)/, '')
}

function validNonnegativeInt64 (value: any): boolean {
  const decimal = normalizedUnsignedDecimal(value)
  const maximum = '9223372036854775807'
  return /^\d+$/.test(decimal) && (decimal.length < maximum.length || (decimal.length === maximum.length && decimal <= maximum))
}

function decimalBetweenSmallIntegers (value: any, minimum: number, maximum: number): boolean {
  const decimal = normalizedUnsignedDecimal(value)
  if (!/^\d+$/.test(decimal) || decimal.length > String(maximum).length) return false
  const parsed = Number(decimal)
  return parsed >= minimum && parsed <= maximum
}

function decimalFitsMaximum (value: any, maximum: string): boolean {
  const decimal = normalizedUnsignedDecimal(value)
  return /^\d+$/.test(decimal) && (decimal.length < maximum.length || (decimal.length === maximum.length && decimal <= maximum))
}

export function validateDefinition (raw: any, metadata: any = FALLBACK_METADATA): AchievementValidationIssue[] {
  const graph = normalizeDefinition(raw)
  const issues: AchievementValidationIssue[] = []
  const limits = { ...FALLBACK_METADATA.limits, ...((metadata && metadata.limits) || {}) }
  if (!Number.isInteger(graph.id) || graph.id <= 0 || graph.id > 4294967295) addIssue(issues, 'general.id', 'Achievement ID must be an integer from 1 through 4,294,967,295.')
  if (!graph.name.trim()) addIssue(issues, 'general.name', 'Name is required.')
  if (new Blob([graph.description]).size > limits.text_bytes) addIssue(issues, 'general.description', 'Achievement description may not exceed 65,535 UTF-8 bytes (the MySQL TEXT limit).')
  if (!Number.isInteger(graph.definition_version) || graph.definition_version <= 0) addIssue(issues, 'general.definition_version', 'Definition version must be a positive integer.')
  if (graph.icon_id < 0 || graph.points < 0 || graph.world_display_flag < 0) addIssue(issues, 'general', 'Icon, points, and world-display values cannot be negative.')
  if (graph.associations.length > limits.associations) addIssue(issues, 'categories', 'The graph exceeds the association limit of ' + limits.associations + '.')
  duplicateValues(graph.associations, row => String(row.category_id)).forEach(id => addIssue(issues, 'categories', 'Category ' + id + ' is associated more than once.'))
  graph.associations.forEach((row: any, index: number) => {
    if (!Number.isInteger(row.category_id) || row.category_id <= 0) addIssue(issues, 'categories.' + index + '.category_id', 'Category ID must be a positive integer.')
    if (!Number.isInteger(row.sequence) || row.sequence < 0) addIssue(issues, 'categories.' + index + '.sequence', 'Category sequence must be a non-negative integer.')
  })
  if (graph.enabled && graph.associations.length === 0) addIssue(issues, 'categories', 'An enabled achievement must have at least one category association.')
  if (graph.components.length > limits.components) addIssue(issues, 'components', 'The graph exceeds the component limit of ' + limits.components + '.')
  const componentKeys = duplicateValues(graph.components, row => row.component_type + ':' + row.component_id)
  componentKeys.forEach(key => addIssue(issues, 'components', 'Component wire identity ' + key + ' is duplicated.'))
  let criterionCount = 0
  const events = enumOptions(metadata, 'events')
  graph.components.forEach((component: any, componentIndex: number) => {
    const base = 'components.' + componentIndex
    criterionCount += component.criteria.length
    if (new Blob([component.description]).size > limits.text_bytes) addIssue(issues, base + '.description', 'Component primary description may not exceed 65,535 UTF-8 bytes (the MySQL TEXT limit).')
    if (new Blob([component.description_2]).size > limits.text_bytes) addIssue(issues, base + '.description_2', 'Component secondary description may not exceed 65,535 UTF-8 bytes (the MySQL TEXT limit).')
    if (component.recovery_only) {
      if (!['restore', 'delete'].includes(component.recovery_action)) addIssue(issues, base + '.recovery_action', 'Choose Restore missing component to preserve these rows, or Delete orphan criteria to remove them explicitly.')
      if (component.recovery_criteria_count !== component.criteria.length) addIssue(issues, base + '.recovery_criteria_count', 'Every stored orphan criterion must remain visible until the whole group is explicitly restored or deleted.')
      if (component.recovery_action !== 'restore') return
    }
    if (![0, 1, 2, 3].includes(component.component_type)) addIssue(issues, base + '.component_type', 'Component type must be 0, 1, 2, or 3.')
    if (!Number.isInteger(component.component_id) || component.component_id < 0) addIssue(issues, base + '.component_id', 'Component ID must be a non-negative integer.')
    if (!Number.isInteger(component.sequence) || component.sequence < 0) addIssue(issues, base + '.sequence', 'Component sequence must be a non-negative integer.')
    if (!Number.isInteger(component.presentation_count) || component.presentation_count <= 0) addIssue(issues, base + '.presentation_count', 'Presentation count must be a positive integer.')
    if (component.component_type === 3 && component.criteria.some((row: any) => row.enabled)) addIssue(issues, base + '.criteria', 'Presentation-only type 3 components cannot contain enabled criteria.')
    const criterionIdentities: any = {}
    let enabledPolicy = ''
    component.criteria.forEach((criterion: any, criterionIndex: number) => {
      const path = base + '.criteria.' + criterionIndex
      const event = events.find(row => Number(row.value) === Number(criterion.event_type))
      if (!event) addIssue(issues, path + '.event_type', 'Event type must be a supported value from 0 through 13.')
      if (event && event.allowed_progress_modes && !event.allowed_progress_modes.includes(Number(criterion.progress_mode))) addIssue(issues, path + '.progress_mode', event.label + ' does not support this progress mode.')
      if (criterion.behavior < 0 || criterion.behavior > 5) addIssue(issues, path + '.behavior', 'Behavior must be a supported value from 0 through 5.')
      if (!Number.isInteger(criterion.required_count) || criterion.required_count <= 0) addIssue(issues, path + '.required_count', 'Required count must be a positive integer.')
      if (criterion.target_id < 0 || criterion.target_id2 < 0) addIssue(issues, path, 'Criterion ID targets cannot be negative.')
      const targetValueValid = validNonnegativeInt64(criterion.target_value)
      if (!targetValueValid) addIssue(issues, path + '.target_value', 'Target value must be a nonnegative signed 64-bit integer.')
      const criterionIdentity = criterion.event_type + ':' + criterion.target_id + ':' + criterion.target_id2
      if (criterionIdentities[criterionIdentity]) addIssue(issues, path + '.target_id', 'Event and target identity must be unique within this component.')
      criterionIdentities[criterionIdentity] = true
      if ([1, 10].includes(criterion.event_type) && (criterion.target_id !== 0 || criterion.target_id2 !== 0)) addIssue(issues, path, 'This event requires both target ID fields to be 0.')
      if (![7, 12, 13].includes(criterion.event_type) && criterion.target_id2 !== 0) addIssue(issues, path + '.target_id2', 'This event requires the secondary target to be 0.')
      if (criterion.event_type === 4 && criterion.target_id <= 0) addIssue(issues, path + '.target_id', 'Task Complete requires a nonzero task ID.')
      if (criterion.event_type === 9 && !((criterion.target_id >= 0 && criterion.target_id <= 77) || criterion.target_id === 4294967295)) addIssue(issues, path + '.target_id', 'Skill ID must be canonical 0-77, or 4,294,967,295 for wildcard.')
      if (criterion.event_type === 13 && (criterion.target_id < 0 || criterion.target_id > 77)) addIssue(issues, path + '.target_id', 'Skill ID must be canonical 0-77.')
      if (criterion.event_type === 7 && (criterion.target_id2 < 0 || criterion.target_id2 > 16)) addIssue(issues, path + '.target_id2', 'Own Item class must be 0 for any class or a class ID from 1 through 16.')
      if (targetValueValid && [4, 8, 11].includes(criterion.event_type) && !['0', '1'].includes(normalizedUnsignedDecimal(criterion.target_value))) addIssue(issues, path + '.target_value', 'This completion event target value must be 0 or 1.')
      if (criterion.event_type === 13 && (criterion.target_id2 < 1 || criterion.target_id2 > 16)) addIssue(issues, path + '.target_id2', 'Skill Cap requires a class ID from 1 through 16.')
      if (targetValueValid && criterion.event_type === 13 && !decimalBetweenSmallIntegers(criterion.target_value, 1, 255)) addIssue(issues, path + '.target_value', 'Skill Cap milestone level must be from 1 through 255.')
      if (criterion.event_type === 12 && criterion.target_id === 0) addIssue(issues, path + '.target_id', 'NPC Name Kill requires a nonzero canonical-name hash.')
      if (criterion.event_type === 11 && criterion.enabled && criterion.target_id === graph.id) addIssue(issues, path + '.target_id', 'An enabled achievement cannot depend on its own completion.')
      if (targetValueValid && criterion.progress_mode === 3 && [1, 7, 9, 10, 13].includes(criterion.event_type) && normalizedUnsignedDecimal(criterion.target_value) === '0') addIssue(issues, path + '.target_value', 'Boolean mode requires a positive threshold for this event.')
      if (criterion.enabled) {
        const policy = criterion.event_type + ':' + criterion.progress_mode + ':' + criterion.behavior + ':' + criterion.required_count
        if (enabledPolicy && enabledPolicy !== policy) addIssue(issues, path, 'Enabled alternative criteria in one component must agree on event, progress mode, behavior, and required count.')
        enabledPolicy = policy
      }
    })
  })
  if (criterionCount > limits.criteria) addIssue(issues, 'components', 'The graph exceeds the criterion limit of ' + limits.criteria + '.')
  if (graph.enabled && graph.components.length === 0) addIssue(issues, 'components', 'This enabled definition has no visible components; direct completion can work, but the client has no authored steps.', 'warning')
  const enabledCriteria = graph.components.filter((component: any) => !component.recovery_only || component.recovery_action === 'restore').reduce((rows: any[], component: any) => rows.concat(component.criteria.filter((criterion: any) => criterion.enabled)), [])
  if (graph.enabled && enabledCriteria.length && !enabledCriteria.some((criterion: any) => criterion.behavior === 0)) addIssue(issues, 'components', 'No enabled criterion uses Required behavior, so criteria alone cannot complete this achievement.', 'warning')
  const requiredClasses = enabledCriteria.filter((criterion: any) => [0, 2, 3].includes(criterion.behavior) && [7, 13].includes(criterion.event_type) && criterion.target_id2 >= 1 && criterion.target_id2 <= 16).map((criterion: any) => criterion.target_id2)
  if (new Set(requiredClasses).size > 1) addIssue(issues, 'components', 'Required, Unlock, and Visibility class criteria must agree on one EQ class.')
  if (graph.rewards.length > limits.rewards) addIssue(issues, 'rewards', 'The graph exceeds the reward limit of ' + limits.rewards + '.')
  duplicateValues(graph.rewards.filter((row: any) => String(row.reward_id).trim() !== ''), row => String(row.reward_id)).forEach(id => addIssue(issues, 'rewards', 'Reward ID ' + id + ' is duplicated.'))
  duplicateValues(graph.rewards, row => String(row.sequence)).forEach(sequence => addIssue(issues, 'rewards', 'Reward sequence ' + sequence + ' is duplicated.'))
  graph.rewards.forEach((reward: any, index: number) => {
    const path = 'rewards.' + index
    if (String(reward.reward_id).trim() !== '' && !validUnsignedDecimal(reward.reward_id)) addIssue(issues, path + '.reward_id', 'Persisted reward ID must be a positive unsigned BIGINT decimal string.')
    if (reward.enabled && String(reward.reward_id).trim() !== '' && !decimalFitsUint32(reward.reward_id)) addIssue(issues, path + '.reward_id', 'Enabled persisted reward IDs must fit the unsigned 32-bit client wire field.')
    if (!Number.isInteger(reward.sequence) || reward.sequence < 0) addIssue(issues, path + '.sequence', 'Reward sequence must be a non-negative integer.')
    if (reward.reward_type < 0 || reward.reward_type > 5) addIssue(issues, path + '.reward_type', 'Reward type must be supported.')
    const amountValid = validUnsignedDecimal(reward.amount)
    if (!amountValid) addIssue(issues, path + '.amount', 'Reward amount must be a positive unsigned BIGINT value.')
    if (reward.enabled && [0, 4, 5].includes(reward.reward_type) && reward.reward_data_id <= 0) addIssue(issues, path + '.reward_data_id', 'This enabled reward type requires a nonzero referenced data ID.')
    if (reward.reward_type === 1 && reward.reward_data_id > 1) addIssue(issues, path + '.reward_data_id', 'Experience mode must be 0 for normal handling or 1 for normal-only raw XP.')
    const deliveryFindingLevel = graph.enabled ? 'error' : 'warning'
    if (reward.enabled && amountValid && reward.reward_type === 0 && !decimalFitsMaximum(reward.amount, '32767')) addIssue(issues, path + '.amount', 'Item reward amount cannot exceed 32,767, the runtime item-summon limit.', deliveryFindingLevel)
    if (reward.enabled && amountValid && reward.reward_type === 1 && !decimalFitsMaximum(reward.amount, '4294967295')) addIssue(issues, path + '.amount', 'Experience reward amount cannot exceed 4,294,967,295.', deliveryFindingLevel)
    if (reward.enabled && reward.reward_type === 2 && reward.reward_data_id !== 0) addIssue(issues, path + '.reward_data_id', 'Alternate Advancement rewards must use data ID 0; the runtime ignores other values.', deliveryFindingLevel)
    if (reward.enabled && amountValid && reward.reward_type === 2 && !decimalFitsMaximum(reward.amount, '2147483647')) addIssue(issues, path + '.amount', 'Alternate Advancement reward amount cannot exceed 2,147,483,647.', deliveryFindingLevel)
    if (reward.enabled && reward.reward_type === 3 && reward.reward_data_id !== 0) addIssue(issues, path + '.reward_data_id', 'Copper rewards must use data ID 0; the runtime ignores other values.', deliveryFindingLevel)
    if (reward.enabled && amountValid && reward.reward_type === 3 && !decimalFitsMaximum(reward.amount, '2147483647999')) addIssue(issues, path + '.amount', 'Copper reward amount cannot exceed 2,147,483,647,999, the runtime denomination limit.', deliveryFindingLevel)
    if (reward.enabled && amountValid && reward.reward_type === 4 && !decimalFitsMaximum(reward.amount, '2147483647')) addIssue(issues, path + '.amount', 'Alternate-currency reward amount cannot exceed 2,147,483,647.', deliveryFindingLevel)
    if (reward.enabled && reward.reward_type === 5 && reward.reward_data_id > 2147483647) addIssue(issues, path + '.reward_data_id', 'Title-set ID cannot exceed 2,147,483,647, the runtime signed title limit.', deliveryFindingLevel)
    if (reward.enabled && amountValid && reward.reward_type === 5 && normalizedUnsignedDecimal(reward.amount) !== '1') addIssue(issues, path + '.amount', 'Title rewards must use amount 1; the title set is unlocked once.', deliveryFindingLevel)
  })
  if (graph.reward_set) {
    const set = graph.reward_set
    if (set.reward_set_id <= 0) addIssue(issues, 'reward_set.reward_set_id', 'Selectable reward set ID must be positive.')
    if (set.enabled && !graph.enabled) addIssue(issues, 'reward_set.enabled', 'Disable the selectable reward set before disabling its achievement; an enabled set owned by a disabled definition makes the runtime snapshot fail to load.')
    if (set.options.length > limits.options) addIssue(issues, 'reward_set.options', 'The graph exceeds the reward option limit of ' + limits.options + '.')
    duplicateValues(set.options, row => String(row.option_id)).forEach(id => addIssue(issues, 'reward_set.options', 'Option ID ' + id + ' is duplicated.'))
    duplicateValues(set.options, row => String(row.sequence)).forEach(sequence => addIssue(issues, 'reward_set.options', 'Option sequence ' + sequence + ' is duplicated; the client will break the tie by option ID.', 'warning'))
    const optionIDs = set.options.map((row: any) => String(row.option_id))
    const rewardIDs = graph.rewards.map((row: any, index: number) => String(row.reward_id || ('@' + index)))
    duplicateValues(set.mappings, row => String(row.reward_id)).forEach(id => addIssue(issues, 'reward_set.mappings', 'Reward ' + id + ' is mapped to more than one option.'))
    set.mappings.forEach((mapping: any, mappingIndex: number) => {
      if (!optionIDs.includes(String(mapping.option_id))) addIssue(issues, 'reward_set.mappings', 'A mapping references missing option ' + mapping.option_id + '.')
      if (!rewardIDs.includes(String(mapping.reward_id))) addIssue(issues, 'reward_set.mappings', 'A mapping references missing reward ' + mapping.reward_id + '.')
      const option = set.options.find((row: any) => String(row.option_id) === String(mapping.option_id))
      const token = String(mapping.reward_id)
      const reward = token.charAt(0) === '@'
        ? graph.rewards[Number(token.slice(1))]
        : graph.rewards.find((row: any) => String(row.reward_id) === token)
      if (graph.enabled && reward && reward.enabled && (!set.enabled || !option || !option.enabled)) {
        addIssue(issues, 'reward_set.mappings.' + mappingIndex, 'This enabled reward is excluded from automatic delivery by its mapping, but its selectable set or option is disabled. Enable the set and option, disable the reward, or remove the mapping.')
      }
    })
    if (set.enabled && !set.options.some((row: any) => row.enabled && !row.common_to_all)) addIssue(issues, 'reward_set.options', 'An enabled selectable set needs at least one enabled non-common choice.')
    if (set.enabled) {
      set.options.filter((row: any) => row.enabled).forEach((option: any) => {
        const hasGrant = set.mappings.some((mapping: any) => {
          if (String(mapping.option_id) !== String(option.option_id)) return false
          const token = String(mapping.reward_id)
          const reward = token.charAt(0) === '@'
            ? graph.rewards[Number(token.slice(1))]
            : graph.rewards.find((row: any) => String(row.reward_id) === token)
          return !!reward && reward.enabled
        })
        if (!hasGrant) addIssue(issues, 'reward_set.options', 'Enabled reward option ' + option.option_id + ' has no enabled grant.')
      })
    }
  }
  if (graph.restrictions.length > limits.restrictions) addIssue(issues, 'restrictions', 'The graph exceeds the cast restriction limit of ' + limits.restrictions + '.')
  duplicateValues(graph.restrictions, row => String(row.restriction_id)).forEach(id => addIssue(issues, 'restrictions', 'Restriction ID ' + id + ' is duplicated; duplicate or contradictory rows are unsafe.'))
  graph.restrictions.forEach((row: any, index: number) => {
    if (!Number.isInteger(row.restriction_id) || row.restriction_id <= 0) addIssue(issues, 'restrictions.' + index + '.restriction_id', 'Restriction ID must be a positive integer.')
  })
  const payloadBytes = new Blob([JSON.stringify(graph)]).size + GRAPH_MUTATION_ENVELOPE_RESERVE_BYTES
  if (payloadBytes > limits.payload_bytes) addIssue(issues, 'graph', 'The graph and its safety envelope exceed the ' + limits.payload_bytes + '-byte UTF-8 request limit.')
  return issues
}

export function definitionSnapshot (graph: any): string {
  return JSON.stringify(normalizeDefinition(graph))
}

export function runtimePolicySnapshot (raw: any): string {
  const graph = normalizeDefinition(raw)
  const runtimeSort = (left: any, right: any): number => JSON.stringify(left).localeCompare(JSON.stringify(right))
  const rewardIdentity = (reward: any): string => {
    const persisted = String(reward.reward_id || '').trim()
    if (persisted) return persisted
    return '@new:' + JSON.stringify([Number(reward.reward_type), Number(reward.reward_data_id), String(reward.amount)])
  }
  const enabledRewardTokens = new Set<string>()
  const canonicalRewardIDs = new Map<string, string>()
  graph.rewards.forEach((reward: any, index: number) => {
    if (!reward.enabled) return
    const persisted = String(reward.reward_id || '').trim()
    const transient = '@' + index
    const canonical = rewardIdentity(reward)
    if (persisted) {
      enabledRewardTokens.add(persisted)
      canonicalRewardIDs.set(persisted, canonical)
    }
    enabledRewardTokens.add(transient)
    canonicalRewardIDs.set(transient, canonical)
  })
  const enabledOptions = graph.reward_set && graph.reward_set.enabled
    ? graph.reward_set.options.filter((option: any) => option.enabled)
    : []
  const enabledOptionIDs = new Set(enabledOptions.map((option: any) => Number(option.option_id)))
  const components = graph.components.filter((component: any) => (!component.recovery_only || component.recovery_action === 'restore') && Number(component.component_type) <= 2 && component.criteria.some((criterion: any) => criterion.enabled)).map((component: any) => ({
    component_type: component.component_type,
    component_id: component.component_id,
    criteria: component.criteria.filter((criterion: any) => criterion.enabled).map((criterion: any) => ({
      component_type: component.component_type,
      component_id: component.component_id,
      event_type: criterion.event_type,
      progress_mode: criterion.progress_mode,
      behavior: criterion.behavior,
      target_id: criterion.target_id,
      target_id2: criterion.target_id2,
      target_value: criterion.target_value,
      required_count: criterion.required_count
    })).sort(runtimeSort)
  })).sort(runtimeSort)
  const rewards = graph.rewards.filter((reward: any) => reward.enabled).map((reward: any) => ({
    reward_id: rewardIdentity(reward),
    reward_type: reward.reward_type,
    reward_data_id: reward.reward_data_id,
    amount: reward.amount
  })).sort(runtimeSort)
  const mappedRewards = graph.reward_set
    ? graph.reward_set.mappings.filter((mapping: any) => enabledRewardTokens.has(String(mapping.reward_id))).map((mapping: any) => ({
      option_id: mapping.option_id,
      reward_id: canonicalRewardIDs.get(String(mapping.reward_id))
    })).sort(runtimeSort)
    : []
  return JSON.stringify({
    reset_on_version_change: graph.reset_on_version_change,
    components,
    rewards,
    mapped_rewards: mappedRewards,
    reward_set: graph.reward_set && graph.reward_set.enabled
      ? {
        reward_set_id: graph.reward_set.reward_set_id,
        options: enabledOptions.map((option: any) => ({
          option_id: option.option_id,
          common_to_all: option.common_to_all,
          flags: option.flags
        })).sort(runtimeSort),
        mappings: graph.reward_set.mappings.filter((mapping: any) => enabledOptionIDs.has(Number(mapping.option_id)) && enabledRewardTokens.has(String(mapping.reward_id))).map((mapping: any) => ({
          option_id: mapping.option_id,
          reward_id: canonicalRewardIDs.get(String(mapping.reward_id))
        })).sort(runtimeSort)
      }
      : null
  })
}
