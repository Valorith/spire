package controllers

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestInventoryKeyringDescribeSlot(t *testing.T) {
	tests := []struct {
		slot       int
		label      string
		group      string
		known      bool
		parentSlot *int
		bagIndex   *int
	}{
		{slot: 0, label: "Charm", group: "Equipment", known: true},
		{slot: 23, label: "General 1", group: "Inventory", known: true},
		{slot: 33, label: "Cursor", group: "Inventory", known: true},
		{slot: 2000, label: "Bank 1", group: "Bank", known: true},
		{slot: 2501, label: "Shared Bank 2", group: "Shared Bank", known: true},
		{slot: 251, label: "General 1 · Container 1", group: "Container", known: true, parentSlot: intPointer(23), bagIndex: intPointer(0)},
		{slot: 4010, label: "General 1 · Container 1", group: "Container", known: true, parentSlot: intPointer(23), bagIndex: intPointer(0)},
		{slot: 11010, label: "Shared Bank 1 · Container 1", group: "Container", known: true, parentSlot: intPointer(2500), bagIndex: intPointer(0)},
		{slot: 999999, label: "Legacy slot #999999", group: "Legacy", known: false},
	}
	for _, test := range tests {
		t.Run(test.label, func(t *testing.T) {
			got := inventoryKeyringDescribeSlot(test.slot)
			if got.Label != test.label || got.Group != test.group || got.Known != test.known {
				t.Fatalf("inventoryKeyringDescribeSlot(%d) = %#v", test.slot, got)
			}
			if !sameOptionalInt(got.ParentSlot, test.parentSlot) || !sameOptionalInt(got.BagIndex, test.bagIndex) {
				t.Fatalf("inventoryKeyringDescribeSlot(%d) parent/index = (%v, %v), want (%v, %v)", test.slot, got.ParentSlot, got.BagIndex, test.parentSlot, test.bagIndex)
			}
		})
	}
}

func TestInventoryKeyringChildRanges(t *testing.T) {
	tests := []struct {
		parent int
		legacy int
		modern int
	}{
		{parent: 23, legacy: 251, modern: 4010},
		{parent: 33, legacy: 351, modern: 6010},
		{parent: 2000, legacy: 2031, modern: 6210},
		{parent: 2500, legacy: 2531, modern: 11010},
	}
	for _, test := range tests {
		ranges := inventoryKeyringChildRanges(test.parent)
		if len(ranges) != 2 {
			t.Fatalf("inventoryKeyringChildRanges(%d) len = %d, want 2", test.parent, len(ranges))
		}
		if ranges[0].begin != test.legacy || ranges[0].capacity != 10 {
			t.Fatalf("legacy range for %d = %#v", test.parent, ranges[0])
		}
		if ranges[1].begin != test.modern || ranges[1].capacity != 200 {
			t.Fatalf("modern range for %d = %#v", test.parent, ranges[1])
		}
	}
}

func TestValidateInventoryKeyringMutationRequest(t *testing.T) {
	valid := inventoryKeyringMutationRequest{
		ItemID: 1001, SlotID: 23, Charges: 1,
		Reason:   "Restoring a verified missing player item",
		Augments: []int{0, 0, 0, 0, 0, 0},
	}
	if err := validateInventoryKeyringMutationRequest(valid, false); err != nil {
		t.Fatalf("validateInventoryKeyringMutationRequest(valid) error = %v", err)
	}
	tests := []struct {
		name string
		edit func(*inventoryKeyringMutationRequest)
		want string
	}{
		{name: "item", edit: func(v *inventoryKeyringMutationRequest) { v.ItemID = 0 }, want: "item"},
		{name: "slot", edit: func(v *inventoryKeyringMutationRequest) { v.SlotID = -1 }, want: "slot"},
		{name: "charges", edit: func(v *inventoryKeyringMutationRequest) { v.Charges = 65536 }, want: "charges"},
		{name: "augments", edit: func(v *inventoryKeyringMutationRequest) { v.Augments = make([]int, 7) }, want: "six"},
		{name: "custom data", edit: func(v *inventoryKeyringMutationRequest) { v.CustomData = strings.Repeat("x", 4097) }, want: "custom"},
		{name: "reason", edit: func(v *inventoryKeyringMutationRequest) { v.Reason = "short" }, want: "reason"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			input := valid
			test.edit(&input)
			err := validateInventoryKeyringMutationRequest(input, false)
			if err == nil || !strings.Contains(strings.ToLower(err.Error()), test.want) {
				t.Fatalf("validateInventoryKeyringMutationRequest() error = %v, want %q", err, test.want)
			}
		})
	}
}

func TestValidateInventoryKeyringItemPlacement(t *testing.T) {
	tests := []struct {
		name    string
		slotID  int
		item    inventoryKeyringItem
		charges int
		wantErr string
	}{
		{
			name:   "equippable item in supported slot",
			slotID: 13,
			item: inventoryKeyringItem{
				Name: "Guard Captain Sword", Slots: int64(1) << 13,
			},
			charges: 1,
		},
		{
			name:   "zero mask cannot enter equipment slot",
			slotID: 13,
			item: inventoryKeyringItem{
				Name: "Distillate", Slots: 0,
			},
			charges: 1,
			wantErr: "cannot be equipped",
		},
		{
			name:   "different equipment mask is rejected",
			slotID: 13,
			item: inventoryKeyringItem{
				Name: "Cloth Cap", Slots: int64(1) << 2,
			},
			charges: 1,
			wantErr: "cannot be equipped",
		},
		{
			name:   "zero mask remains valid in carried inventory",
			slotID: 23,
			item: inventoryKeyringItem{
				Name: "Distillate", Slots: 0,
			},
			charges: 20,
		},
		{
			name:   "finite stack accepts exact maximum",
			slotID: 23,
			item: inventoryKeyringItem{
				Name: "Distillate", Stackable: true, StackSize: 20,
			},
			charges: 20,
		},
		{
			name:   "finite stack rejects excess charges",
			slotID: 23,
			item: inventoryKeyringItem{
				Name: "Distillate", Stackable: true, StackSize: 20,
			},
			charges: 21,
			wantErr: "at most 20",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateInventoryKeyringItemPlacement(test.slotID, test.item, test.charges)
			if test.wantErr == "" && err != nil {
				t.Fatalf("validateInventoryKeyringItemPlacement() error = %v", err)
			}
			if test.wantErr != "" && (err == nil || !strings.Contains(err.Error(), test.wantErr)) {
				t.Fatalf("validateInventoryKeyringItemPlacement() error = %v, want %q", err, test.wantErr)
			}
		})
	}
}

func TestInventoryKeyringAugmentRestrictionAllows(t *testing.T) {
	allowedByRestriction := map[int][]int{
		0:  {0, 1, 2, 3, 4, 5, 8, 10, 35, 45},
		1:  {10},
		2:  {0, 1, 2, 3, 4, 5, 35, 45},
		3:  {0, 2, 3, 45},
		4:  {1, 4, 35},
		5:  {0},
		6:  {3},
		7:  {2},
		8:  {45},
		9:  {1},
		10: {4},
		11: {35},
		12: {5},
		13: {8},
		14: {0, 3, 45},
		15: {3, 45},
	}
	itemTypes := []int{0, 1, 2, 3, 4, 5, 8, 10, 35, 45}
	for restriction, allowedTypes := range allowedByRestriction {
		for _, itemType := range itemTypes {
			want := containsInt(allowedTypes, itemType)
			if got := inventoryKeyringAugmentRestrictionAllows(itemType, restriction); got != want {
				t.Fatalf("inventoryKeyringAugmentRestrictionAllows(%d, %d) = %t, want %t", itemType, restriction, got, want)
			}
		}
	}
	if inventoryKeyringAugmentRestrictionAllows(0, 99) {
		t.Fatal("unknown augment restrictions must be rejected")
	}
}

func TestInventoryKeyringStorageKindAndValues(t *testing.T) {
	tests := []struct {
		slot int
		want string
	}{
		{slot: 23, want: inventoryStorageCharacter},
		{slot: 4010, want: inventoryStorageCharacter},
		{slot: 2000, want: inventoryStorageCharacter},
		{slot: 2500, want: inventoryStorageSharedBank},
		{slot: 2531, want: inventoryStorageSharedBank},
		{slot: 11010, want: inventoryStorageSharedBank},
	}
	for _, test := range tests {
		if got := inventoryKeyringStorageKind(test.slot); got != test.want {
			t.Fatalf("inventoryKeyringStorageKind(%d) = %q, want %q", test.slot, got, test.want)
		}
	}

	request := inventoryKeyringMutationRequest{
		ItemID: 1001, Charges: 1, InstanceNoDrop: true,
		Augments: []int{32940}, Reason: "Valid storage values test",
	}
	characterValues := inventoryKeyringInventoryValues(42, 7, 23, request)
	if characterValues["character_id"] != 42 || characterValues["instnodrop"] != 1 {
		t.Fatalf("character inventory values did not preserve character ownership and attunement: %#v", characterValues)
	}
	if _, exists := characterValues["account_id"]; exists {
		t.Fatalf("character inventory values unexpectedly contain account_id: %#v", characterValues)
	}

	sharedValues := inventoryKeyringInventoryValues(42, 7, 2500, request)
	if sharedValues["account_id"] != 7 {
		t.Fatalf("shared-bank values did not preserve account ownership: %#v", sharedValues)
	}
	if _, exists := sharedValues["character_id"]; exists {
		t.Fatalf("shared-bank values unexpectedly contain character_id: %#v", sharedValues)
	}
	if _, exists := sharedValues["instnodrop"]; exists {
		t.Fatalf("shared-bank values unexpectedly contain unsupported instnodrop: %#v", sharedValues)
	}
}

func TestInventoryKeyringPagination(t *testing.T) {
	e := echo.New()
	request := httptest.NewRequest("GET", "/?page=0&limit=500", nil)
	context := e.NewContext(request, nil)
	page, limit := inventoryKeyringPagination(context)
	if page != 1 || limit != inventoryKeyringMaxPageSize {
		t.Fatalf("inventoryKeyringPagination() = (%d, %d), want (1, %d)", page, limit, inventoryKeyringMaxPageSize)
	}
}

func intPointer(value int) *int {
	return &value
}

func sameOptionalInt(left, right *int) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return *left == *right
}

func containsInt(values []int, target int) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}
