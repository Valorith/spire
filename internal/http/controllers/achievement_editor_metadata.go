package controllers

import "sync"

type achievementEditorEnumOption struct {
	Value     int    `json:"value"`
	Label     string `json:"label"`
	Help      string `json:"help"`
	DataLabel string `json:"data_label,omitempty"`
}

type achievementEditorNamedOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
	Help  string `json:"help"`
}

type achievementEditorEventMetadata struct {
	Value                int    `json:"value"`
	Label                string `json:"label"`
	Help                 string `json:"help"`
	TargetIDLabel        string `json:"target_id_label"`
	TargetIDHelp         string `json:"target_id_help"`
	TargetID2Label       string `json:"target_id2_label"`
	TargetID2Help        string `json:"target_id2_help"`
	Target1Label         string `json:"target1_label"`
	Target1Help          string `json:"target1_help"`
	Target2Label         string `json:"target2_label"`
	Target2Help          string `json:"target2_help"`
	TargetValueLabel     string `json:"target_value_label"`
	TargetValueHelp      string `json:"target_value_help"`
	Replay               string `json:"replay"`
	Lookup               string `json:"lookup,omitempty"`
	AllowedProgressModes []int  `json:"allowed_progress_modes"`
}

type achievementEditorFieldHelp struct {
	Label string `json:"label"`
	Help  string `json:"help"`
}

type achievementEditorMetadata struct {
	Limits                     map[string]string                                `json:"limits"`
	ComponentTypes             []achievementEditorEnumOption                    `json:"component_types"`
	Events                     []achievementEditorEventMetadata                 `json:"events"`
	ProgressModes              []achievementEditorEnumOption                    `json:"progress_modes"`
	Behaviors                  []achievementEditorEnumOption                    `json:"behaviors"`
	RewardTypes                []achievementEditorEnumOption                    `json:"reward_types"`
	RewardDelivery             []achievementEditorNamedOption                   `json:"reward_delivery"`
	AchievementStatuses        []achievementEditorEnumOption                    `json:"achievement_statuses"`
	CharacterRewardStatuses    []achievementEditorEnumOption                    `json:"character_reward_statuses"`
	CharacterSelectionStatuses []achievementEditorEnumOption                    `json:"character_selection_statuses"`
	UpdateTargetTypes          []achievementEditorEnumOption                    `json:"update_target_types"`
	UpdateOperations           []achievementEditorEnumOption                    `json:"update_operations"`
	CharacterUpdateStatuses    []achievementEditorEnumOption                    `json:"character_update_statuses"`
	Classes                    []achievementEditorEnumOption                    `json:"classes"`
	Skills                     []achievementEditorEnumOption                    `json:"skills"`
	Fields                     map[string]map[string]achievementEditorFieldHelp `json:"fields"`
}

var (
	achievementEditorMetadataOnce  sync.Once
	achievementEditorMetadataCache achievementEditorMetadata
)

func getAchievementEditorMetadata() achievementEditorMetadata {
	achievementEditorMetadataOnce.Do(func() {
		achievementEditorMetadataCache = buildAchievementEditorMetadata()
	})
	return achievementEditorMetadataCache
}

func buildAchievementEditorMetadata() achievementEditorMetadata {
	allModes := []int{0, 1, 2, 3}
	absoluteModes := []int{1, 2, 3}
	limits := map[string]string{
		"payload_bytes":                   "2097152",
		"text_bytes":                      "65535",
		"associations":                    "100",
		"components":                      "1000",
		"criteria":                        "2000",
		"rewards":                         "500",
		"requirements":                    "500",
		"options":                         "500",
		"mappings":                        "500",
		"lookup_results":                  "100",
		"uint8_max":                       "255",
		"uint32_max":                      "4294967295",
		"uint64_max":                      "18446744073709551615",
		"int64_max":                       "9223372036854775807",
		"skill_wildcard":                  "4294967295",
		"update_processing_lease_seconds": "60",
	}
	for alias, source := range map[string]string{
		"max_graph_bytes": "payload_bytes", "max_text_bytes": "text_bytes",
		"max_associations": "associations", "max_components": "components",
		"max_criteria": "criteria", "max_rewards": "rewards",
		"max_requirements": "requirements", "max_reward_options": "options",
		"max_reward_mappings": "mappings",
		// Compatibility aliases keep older API clients usable while the canonical
		// vocabulary follows achievement_cast_requirements and pending updates.
		"restrictions": "requirements", "max_restrictions": "requirements",
		"mutation_processing_lease_seconds": "update_processing_lease_seconds",
	} {
		limits[alias] = limits[source]
	}
	return achievementEditorMetadata{
		Limits: limits,
		ComponentTypes: []achievementEditorEnumOption{
			{Value: 0, Label: "Type 0 (state-bearing)", Help: "RoF2 state bucket 0. It persists progress and participates in evaluation."},
			{Value: 1, Label: "Type 1 (state-bearing)", Help: "RoF2 state bucket 1. It persists progress and participates in evaluation."},
			{Value: 2, Label: "Type 2 (state-bearing)", Help: "RoF2 state bucket 2. It persists progress and participates in evaluation."},
			{Value: 3, Label: "Type 3 (presentation only)", Help: "Visible client text only. RoF2 has no state channel for this type, so it cannot have an enabled criterion."},
		},
		Events: []achievementEditorEventMetadata{
			eventMetadata(0, "Manual", "No engine event is emitted; quest or administration APIs advance the component.", "Target ID", "Normally 0. Manual progress identifies the component directly.", "Secondary target", "Must be 0.", "Target value", "Normally 0; the direct call supplies the observed value.", "No engine replay.", "", allModes),
			eventMetadata(1, "Level", "Compare against the character's current level.", "Target ID", "Must be 0.", "Secondary target", "Must be 0.", "Minimum level", "Use a positive level threshold, especially for Boolean mode.", "Current level is reconciled on login and zone load.", "", absoluteModes),
			eventMetadata(2, "NPC Type Kill", "Advance after a credited kill of an exact npc_types row.", "NPC type ID", "npc_types.id, or 0 to match any NPC type.", "Secondary target", "Must be 0.", "Minimum event value", "A credited kill observes 1; normally use 0 or 1.", "No historical replay.", "npc", allModes),
			eventMetadata(3, "NPC Race Kill", "Advance after a credited kill of an NPC with the selected base race.", "NPC race ID", "Use npc_types.race or an intentional custom engine race ID; 0 matches any base race. No current NPC row is advisory, not a blocker.", "Secondary target", "Must be 0.", "Minimum event value", "A credited kill observes 1; normally use 0 or 1.", "No historical replay.", "race", allModes),
			eventMetadata(4, "Task Complete", "Pass after a specific task is durably recorded complete.", "Task ID", "An exact nonzero tasks.id is required; wildcard completion cannot be reconciled safely.", "Secondary target", "Must be 0.", "Minimum event value", "Task completion observes 1; normally use 0 or 1.", "Replayed from completed-task history.", "task", absoluteModes),
			eventMetadata(5, "Zone Enter", "Advance when the character enters the selected zone.", "Zone ID", "Use zone.zoneidnumber, or 0 to match any destination zone.", "Secondary target", "Must be 0.", "Minimum event value", "Zone entry observes 1; normally use 0 or 1.", "Only the current zone is reconciled.", "zone", allModes),
			eventMetadata(6, "Loot Item", "Advance for item quantity transferred successfully from an NPC corpse.", "Item ID", "items.id, or 0 to match any looted item.", "Secondary target", "Must be 0.", "Minimum transfer quantity", "The observed value is the successfully transferred quantity.", "No historical replay.", "item", allModes),
			eventMetadata(7, "Own Item", "Compare against authoritative persisted inventory, bank, shared bank, keyring, bags, augments, and cursor storage.", "Item ID", "items.id, or 0 for the greatest quantity held of any one item ID.", "Required class", "Optional EQ class ID 1 through 16; use 0 for class-neutral content.", "Minimum owned count", "Use a positive threshold for Boolean mode.", "Authoritative persisted ownership is reconciled.", "item", absoluteModes),
			eventMetadata(8, "Tradeskill Success", "Advance after a successful combine.", "Recipe ID", "tradeskill_recipe.id, or 0 to match any successful recipe.", "Secondary target", "Must be 0.", "Minimum event value", "A successful combine observes 1; normally use 0 or 1.", "No historical replay.", "recipe", allModes),
			eventMetadata(9, "Skill Value", "Compare against the persisted raw value of one skill.", "Skill ID", "Use skill ID 0 through 77. Wildcard is 4294967295 because skill 0 is 1H Blunt.", "Secondary target", "Must be 0.", "Minimum skill value", "Use a positive threshold for Boolean mode.", "Persisted raw skill value is reconciled.", "skill", absoluteModes),
			eventMetadata(10, "Alternate Advancement", "Compare against purchased-rank cost plus durable expended AA.", "Target ID", "Must be 0.", "Secondary target", "Must be 0.", "Minimum spent AA", "Use a positive threshold for Boolean mode.", "Spent AA is reconciled.", "", absoluteModes),
			eventMetadata(11, "Achievement Complete", "Depend on another durable achievement completion.", "Prerequisite achievement ID", "Use an exact achievements.id, or 0 to match any completion. Exact dependencies must not form a cycle.", "Secondary target", "Must be 0.", "Minimum event value", "Completion observes 1; normally use 0 or 1.", "Replayed from durable achievement completion state.", "achievement", absoluteModes),
			eventMetadata(12, "NPC Name Kill", "Advance after a credited kill matching EQEmu's canonical NPC-name hash.", "Canonical NPC name hash", "A nonzero unsigned 32-bit FNV-1a identity is required. Generate it with the name helper.", "Zone ID", "Use a zone ID to scope collision risk, or 0 to match the name in any zone.", "Minimum event value", "A credited kill observes 1; normally use 0 or 1.", "No historical replay; audit hash collisions in the target zone.", "npc-name", allModes),
			eventMetadata(13, "Skill Cap", "Compare a class and skill against the database-backed cap at a milestone level.", "Skill ID", "Use an exact skill ID 0 through 77; 0 validly means 1H Blunt.", "Required class", "An EQ class ID 1 through 16 is required.", "Milestone level", "A level from 1 through 255 used to resolve skill_caps.", "Class, level, and DB-backed cap attainment are reconciled.", "skill", absoluteModes),
		},
		ProgressModes: []achievementEditorEnumOption{
			{Value: 0, Label: "Increment", Help: "Add each observed value. Use only for non-replayed events such as kills, loot, and successful combines."},
			{Value: 1, Label: "Highest", Help: "Keep the greatest observed value. Useful for durable milestones that should never decrease."},
			{Value: 2, Label: "Set", Help: "Replace progress with the current observed value. Use for absolute facts that may decrease."},
			{Value: 3, Label: "Boolean", Help: "Set progress to the full requirement when the threshold passes, or zero when a reconciled fact no longer passes."},
		},
		Behaviors: []achievementEditorEnumOption{
			{Value: 0, Label: "Required", Help: "Every Required component must pass before the achievement completes."},
			{Value: 1, Label: "Optional", Help: "Track and display this component without affecting completion."},
			{Value: 2, Label: "Unlock", Help: "Keep the achievement Locked until this component passes."},
			{Value: 3, Label: "Visibility", Help: "Keep the achievement Hidden until this component passes."},
			{Value: 4, Label: "Display Only", Help: "Track presentation state without affecting completion, locking, or visibility."},
			{Value: 5, Label: "Blocker", Help: "Lock the achievement while this component is satisfied."},
		},
		RewardTypes: []achievementEditorEnumOption{
			{Value: 0, Label: "Item", DataLabel: "Item ID", Help: "Grant amount copies of items.id. A nonzero item ID and positive amount are required."},
			{Value: 1, Label: "Experience", DataLabel: "Experience mode", Help: "Grant experience. Data 0 uses normal handling; data 1 is normal-only raw XP."},
			{Value: 2, Label: "Alternate Advancement", DataLabel: "Data (must be 0)", Help: "Grant Alternate Advancement points. Data must be 0; amount is the number of points."},
			{Value: 3, Label: "Copper", DataLabel: "Data (must be 0)", Help: "Grant currency expressed in copper. Data must be 0."},
			{Value: 4, Label: "Alternate Currency", DataLabel: "Currency ID", Help: "Grant an alternate currency. A nonzero currency ID and positive amount are required."},
			{Value: 5, Label: "Title", DataLabel: "Title-set ID", Help: "Unlock every eligible prefix and suffix in a nonzero titles.title_set; amount must be 1."},
			{Value: 6, Label: "Alternate Advancement Ability", DataLabel: "AA ability ID", Help: "Grant a specific aa_ability.id to the desired cumulative rank. The enabled ability and every rank through the requested amount must exist."},
			{Value: 7, Label: "Class-ineligible AA fallback", DataLabel: "Paired AA ability ID", Help: "Automatic-achievement-only fallback: grant unspent AA points to playable classes ineligible for the paired class-limited type 6 ability. It cannot be selectable and requires exactly one enabled automatic type 6 companion with the same ability ID."},
		},
		RewardDelivery: []achievementEditorNamedOption{
			{Value: "automatic", Label: "Automatic on completion", Help: "An enabled reward with no option mapping is delivered when completion is persisted."},
			{Value: "common", Label: "Common to every choice", Help: "A reward mapped to a common option is delivered with whichever selectable option is chosen."},
			{Value: "selectable", Label: "Selected by player", Help: "A reward mapped to a non-common option is delivered only when that option is chosen."},
		},
		AchievementStatuses: []achievementEditorEnumOption{
			{Value: 0, Label: "Completed", Help: "The character has a durable completion row."},
			{Value: 1, Label: "Open", Help: "The achievement is visible and available."},
			{Value: 2, Label: "Locked", Help: "An Unlock component is unmet or a Blocker component is met."},
			{Value: 3, Label: "Hidden", Help: "Visibility or class applicability hides the definition."},
		},
		CharacterRewardStatuses: []achievementEditorEnumOption{
			{Value: 0, Label: "Claimed / In Flight", Help: "Delivery began but durable success is unknown. Retrying can duplicate a grant."},
			{Value: 1, Label: "Durably Granted", Help: "Delivery completed and must not be repeated."},
			{Value: 2, Label: "Retryable Failure", Help: "Delivery explicitly failed before a durable grant."},
		},
		CharacterSelectionStatuses: []achievementEditorEnumOption{
			{Value: 0, Label: "Pending / In Progress", Help: "The choice is outstanding or delivery is in progress."},
			{Value: 1, Label: "Fully Granted", Help: "Every grant for the locked choice completed durably."},
			{Value: 2, Label: "Retryable Failure", Help: "The selection failed explicitly and may be reviewed for retry."},
			{Value: 3, Label: "Ambiguous Delivery", Help: "The server cannot prove whether delivery completed. Review duplicate risk before retry."},
		},
		UpdateTargetTypes: []achievementEditorEnumOption{
			{Value: 0, Label: "Character", Help: "The request originally targeted one character."},
			{Value: 1, Label: "Group", Help: "World expanded a group request into per-character rows."},
			{Value: 2, Label: "Raid", Help: "World expanded a raid request into per-character rows."},
			{Value: 3, Label: "Dynamic Zone", Help: "World expanded a dynamic-zone roster into per-character rows."},
			{Value: 4, Label: "Shared Task", Help: "World expanded a shared-task roster into per-character rows."},
		},
		UpdateOperations: []achievementEditorEnumOption{
			{Value: 0, Label: "Advance", Help: "Raise one component to at least requested_value."},
			{Value: 1, Label: "Complete", Help: "Complete the whole achievement idempotently."},
		},
		CharacterUpdateStatuses: []achievementEditorEnumOption{
			{Value: 0, Label: "Pending", Help: "Waiting for a target zone to apply the request."},
			{Value: 1, Label: "Blocked", Help: "Invalid or incompatible content prevented application."},
			{Value: 2, Label: "Processing", Help: "A zone holds a claim lease; stale processing may be recovered after the lease expires."},
		},
		Classes: achievementEditorClasses(),
		Skills:  achievementEditorSkills(),
		Fields:  achievementEditorFieldMetadata(),
	}
}

func eventMetadata(value int, label, help, targetIDLabel, targetIDHelp, targetID2Label, targetID2Help, targetValueLabel, targetValueHelp, replay, lookup string, modes []int) achievementEditorEventMetadata {
	return achievementEditorEventMetadata{
		Value: value, Label: label, Help: help,
		TargetIDLabel: targetIDLabel, TargetIDHelp: targetIDHelp,
		TargetID2Label: targetID2Label, TargetID2Help: targetID2Help,
		Target1Label: targetIDLabel, Target1Help: targetIDHelp,
		Target2Label: targetID2Label, Target2Help: targetID2Help,
		TargetValueLabel: targetValueLabel, TargetValueHelp: targetValueHelp,
		Replay: replay, Lookup: lookup, AllowedProgressModes: append([]int(nil), modes...),
	}
}

func achievementEditorClasses() []achievementEditorEnumOption {
	labels := []string{"Warrior", "Cleric", "Paladin", "Ranger", "Shadowknight", "Druid", "Monk", "Bard", "Rogue", "Shaman", "Necromancer", "Wizard", "Magician", "Enchanter", "Beastlord", "Berserker"}
	result := make([]achievementEditorEnumOption, 0, len(labels))
	for index, label := range labels {
		result = append(result, achievementEditorEnumOption{Value: index + 1, Label: label, Help: "Canonical EQ class ID used by class-gated achievement criteria."})
	}
	return result
}

func achievementEditorSkills() []achievementEditorEnumOption {
	labels := []string{
		"1H Blunt", "1H Slashing", "2H Blunt", "2H Slashing", "Abjuration", "Alteration", "Apply Poison", "Archery",
		"Backstab", "Bind Wound", "Bash", "Block", "Brass Instruments", "Channeling", "Conjuration", "Defense",
		"Disarm", "Disarm Traps", "Divination", "Dodge", "Double Attack", "Dragon Punch", "Dual Wield", "Eagle Strike",
		"Evocation", "Feign Death", "Flying Kick", "Forage", "Hand to Hand", "Hide", "Kick", "Meditate",
		"Mend", "Offense", "Parry", "Pick Lock", "1H Piercing", "Riposte", "Round Kick", "Safe Fall",
		"Sense Heading", "Singing", "Sneak", "Specialize Abjure", "Specialize Alteration", "Specialize Conjuration", "Specialize Divination", "Specialize Evocation",
		"Pick Pockets", "Stringed Instruments", "Swimming", "Throwing", "Tiger Claw", "Tracking", "Wind Instruments", "Fishing",
		"Make Poison", "Tinkering", "Research", "Alchemy", "Baking", "Tailoring", "Sense Traps", "Blacksmithing",
		"Fletching", "Brewing", "Alcohol Tolerance", "Begging", "Jewelry Making", "Pottery", "Percussion Instruments", "Intimidation",
		"Berserking", "Taunt", "Frenzy", "Remove Trap", "Triple Attack", "2H Piercing",
	}
	result := make([]achievementEditorEnumOption, 0, len(labels))
	for id, label := range labels {
		result = append(result, achievementEditorEnumOption{Value: id, Label: label, Help: "Canonical zero-based EQEmu SkillUseTypes ID."})
	}
	return result
}

func achievementEditorFieldMetadata() map[string]map[string]achievementEditorFieldHelp {
	f := func(label, help string) achievementEditorFieldHelp {
		return achievementEditorFieldHelp{Label: label, Help: help}
	}
	return map[string]map[string]achievementEditorFieldHelp{
		"achievement_categories": {
			"id": f("Category ID", "Stable nonzero category identity. It cannot change after creation."), "parent_id": f("Parent category", "Use 0 for a root. Parent chains must exist and remain acyclic."), "sequence": f("Order", "Sort order among siblings; ties are ordered by category ID."), "name": f("Name", "Category name shown in the achievement window."), "description": f("Description", "Category description sent to the client; limited to 65,535 UTF-8 bytes by the source TEXT column."), "icon": f("Icon resource", "Optional client texture/resource name; empty produces text-only presentation."),
		},
		"achievements": {
			"id": f("Achievement ID", "Stable nonzero identity used by character state, scripts, links, and dependencies."), "name": f("Name", "Visible achievement name and default link text."), "description": f("Description", "Visible achievement description sent to the client; limited to 65,535 UTF-8 bytes by the source TEXT column."), "icon_id": f("Icon ID", "Unsigned client icon number; use 0 when no reviewed icon is known."), "points": f("Points", "Achievement score awarded on completion."), "has_reward": f("Imported reward hint", "Imported client hint only; the server derives effective reward visibility from reachable enabled reward content."), "client_flag": f("Client flag", "Uninterpreted import/export client field; RoF2 does not serialize it."), "version": f("Definition version", "Unsigned durable version; 0 is valid. Increment for incompatible deployed changes."), "reset_on_version_change": f("Reset on version change", "A mismatch clears prior state and reward ledgers before rebuilding when enabled."), "enabled": f("Enabled", "Only enabled, valid definitions enter the active server snapshot."),
		},
		"achievement_category_associations": {
			"category_id": f("Category", "Existing category where the achievement appears."), "sequence": f("Order", "Achievement order inside this category."), "achievement_id": f("Achievement ID", "Owning definition; supplied by the graph."), "display_text": f("Display override", "Optional association-specific client text; empty uses the definition presentation."),
		},
		"achievement_components": {
			"achievement_id": f("Achievement ID", "Owning definition; supplied by the graph."), "component_type": f("Wire type", "RoF2 state bucket 0 through 3; type 3 is presentation-only."), "sequence": f("Client order", "Display order within the wire type; RoF2 clamps it to 255."), "component_id": f("Component ID", "Stable identity together with achievement ID and wire type. Zero is valid."), "name": f("Component name", "Primary player-facing component text; limited to 65,535 UTF-8 bytes by the source TEXT column."), "description": f("Component description", "Optional secondary player-facing component text; limited to 65,535 UTF-8 bytes by the source TEXT column."), "presentation_count": f("Imported presentation count", "Default display count from achievement_associations. Enabled criterion required_count remains authoritative for progress."),
		},
		"achievement_associations": {
			"component_id": f("Component ID", "Global presentation-count identity shared by every component using this ID."), "required_count": f("Presentation count", "Nonzero default displayed count; enabled criteria carry their explicit requirement."),
		},
		"achievement_criteria": {
			"id": f("Criterion row ID", "Database-generated diagnostic identity, represented as a string for JavaScript safety."), "achievement_id": f("Achievement ID", "Owning definition copied from the graph."), "component_type": f("Component type", "Must match the containing component."), "component_sequence": f("Component order copy", "Diagnostic copy of component sequence; runtime identity does not use it."), "component_id": f("Component ID", "Must match the stable containing component identity."), "event_type": f("Event", "Game event or reconciled fact that evaluates the criterion."), "progress_mode": f("Progress mode", "How observed values update durable progress."), "behavior": f("Behavior", "How the component affects completion, locking, and visibility."), "target_id": f("Primary target", "Event-specific primary filter; zero is not universally a wildcard."), "target_id2": f("Secondary target", "Only Own Item, NPC Name Kill, and Skill Cap support a nonzero value."), "target_value": f("Target value", "Nonnegative qualifying threshold; Skill Cap uses milestone level."), "required_count": f("Required count", "Explicit nonzero count needed to satisfy the component."), "enabled": f("Enabled", "Only enabled rows become active server policy."),
		},
		"rewards": {
			"reward_id": f("Reward ID", "Stable provider-independent unsigned INT grant identity, immutable after creation."), "reward_type": f("Type", "Grant kind; changes the meaning of referenced data and amount."), "reward_data_id": f("Referenced data", "Type-specific item, currency, title-set, AA ability, or experience-mode value."), "amount": f("Amount", "Positive unsigned BIGINT quantity. For a specific AA ability this is the desired cumulative rank; for its class-ineligible fallback this is unspent AA points."), "description": f("Client description", "Reward preview text; runtime supplies a fallback when empty."), "enabled": f("Enabled", "Enabled rows can be delivered by any source or option that maps them."),
		},
		"reward_sets": {
			"reward_set_id": f("Stable set ID", "Stable provider-independent selectable-set identity; immutable after creation."), "title": f("Prompt / title", "Select Reward window title; an achievement may supply its name as a fallback."), "enabled": f("Set enabled", "Controls the shared set independently of every reward_sources link."),
		},
		"reward_options": {
			"reward_set_id": f("Reward set ID", "Owning selectable reward set."), "option_id": f("Option ID", "Stable nonzero identity inside the reward set."), "sequence": f("Order", "Display order in the Select Reward window."), "label": f("Label", "Text shown in the reward choices list."), "common_to_all": f("Common", "Common options grant with every selected non-common option."), "flags": f("Flags", "Unsigned RoF2 option flags; use 0 unless verified behavior requires another value."), "enabled": f("Enabled", "Only enabled options load; each needs at least one enabled grant."),
		},
		"reward_option_entries": {
			"reward_set_id": f("Reward set ID", "Set containing the mapping."), "option_id": f("Option ID", "Common or selectable option receiving the grant."), "sequence": f("Grant order", "Order of this reward within the option."), "reward_id": f("Reward ID", "Canonical reward; one reward may belong to only one option in a set."),
		},
		"reward_sources": {
			"source_type": f("Source type", "Provider enum; achievement sources use exactly 1."), "source_id": f("Source ID", "Achievement ID when source_type is 1."), "reward_set_id": f("Reward set ID", "Provider-independent selectable set linked to this source."), "enabled": f("Source link enabled", "Controls this source-to-set link independently of reward_sets.enabled."),
		},
		"reward_source_entries": {
			"source_type": f("Source type", "Provider enum; achievement sources use exactly 1."), "source_id": f("Source ID", "Achievement ID when source_type is 1."), "sequence": f("Automatic grant order", "Unique automatic delivery order inside this source."), "reward_id": f("Reward ID", "Provider-independent canonical reward delivered automatically."),
		},
		"achievement_cast_requirements": {
			"restriction_id": f("Restriction ID", "Existing spell restriction number. All rows sharing an ID are ANDed."), "achievement_id": f("Achievement ID", "Achievement tested by this restriction."), "requires_completed": f("Required state", "True requires completion; false requires the achievement to remain incomplete."),
		},
		"character_achievements": {
			"character_id": f("Character ID", "Character owning this durable completion."), "achievement_id": f("Achievement ID", "Completed stable definition identity."), "version": f("Saved version", "Definition version active when completion persisted."), "completed_at": f("Completed at", "Unix timestamp of durable completion."),
		},
		"character_achievement_progress": {
			"character_id": f("Character ID", "Character owning this durable progress."), "achievement_id": f("Achievement ID", "Stable owning definition."), "component_type": f("Wire type", "State-bearing component bucket 0 through 2."), "component_sequence": f("Current order", "Presentation copy; not part of identity."), "component_id": f("Component ID", "Stable authored component identity."), "current_count": f("Current count", "Durable progress clamped to the authored requirement."), "completed": f("Completed", "Materialized component-satisfied flag."), "version": f("Saved version", "Definition version under which progress was written."), "updated_at": f("Updated at", "Unix timestamp of the last durable progress update."),
		},
		"character_achievement_rewards": {
			"character_id": f("Character ID", "Character receiving the grant."), "achievement_id": f("Achievement ID", "Completed definition producing the grant."), "reward_id": f("Reward ID", "Canonical at-most-once grant identity."), "status": f("Delivery status", "Ledger state; ambiguous/in-flight rows require duplicate-risk review."), "attempt_count": f("Attempts", "Number of delivery claims started."), "granted_at": f("Granted at", "Successful-delivery timestamp, otherwise zero."), "last_attempt_at": f("Last attempt", "Timestamp of the latest delivery attempt."), "last_error": f("Last error", "Latest delivery or persistence diagnostic."),
		},
		"character_achievement_reward_selections": {
			"character_id": f("Character ID", "Character owning the selectable claim."), "achievement_id": f("Achievement ID", "Completed definition producing the set."), "reward_set_id": f("Reward set ID", "Stable authored selectable set."), "selected_option_id": f("Selected option", "Zero before a choice; otherwise the locked option identity."), "status": f("Selection status", "Whole-selection delivery state."), "attempt_count": f("Attempts", "Number of selection attempts."), "claimed_at": f("Claimed at", "Timestamp when every grant finalized."), "last_attempt_at": f("Last attempt", "Timestamp of the latest attempt."), "last_error": f("Last error", "Latest selection-level diagnostic."),
		},
		"character_achievement_pending_updates": {
			"update_id": f("Update ID", "Durable queue identity, represented as a decimal string."), "character_id": f("Character ID", "Target character consuming the update."), "source_target_type": f("Original scope", "Character, group, raid, dynamic-zone, or shared-task source."), "source_target_id": f("Original target ID", "Scope-specific diagnostic identity."), "operation": f("Operation", "Advance one component or complete the achievement."), "achievement_id": f("Achievement ID", "Stable target definition identity."), "component_type": f("Component type", "State-bearing type for Advance; zero for whole completion."), "component_id": f("Component ID", "Target component identity for Advance; zero is valid."), "requested_value": f("Requested value", "Monotonic progress floor clamped to the requirement."), "version": f("Source version", "Must match target-zone content or the row blocks."), "status": f("Queue status", "Pending, blocked, or processing under a lease."), "attempt_count": f("Attempts", "Application claim count and compare-and-swap token."), "created_at": f("Created at", "Timestamp when world committed the row."), "last_attempt_at": f("Last attempt", "Timestamp when the latest claim began."), "last_error": f("Last error", "Latest blocked or retryable diagnostic."),
		},
	}
}
