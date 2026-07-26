package controllers

import (
	"math"
	"testing"
)

func TestValidateAlternateCurrencyInput(t *testing.T) {
	if err := validateAlternateCurrencyInput(alternateCurrencyEditorInput{ItemID: 40903}); err != nil {
		t.Fatalf("validateAlternateCurrencyInput(valid) error = %v", err)
	}
	if err := validateAlternateCurrencyInput(alternateCurrencyEditorInput{}); err == nil {
		t.Fatal("validateAlternateCurrencyInput() expected an item-selection error")
	}
}

func TestValidateAlternateCurrencyBalance(t *testing.T) {
	expected := uint64(25)
	valid := []alternateCurrencyBalanceRequest{
		{CharacterID: 10, Operation: "set", Amount: 0, ExpectedAmount: &expected, Reason: "Correcting a support issue"},
		{CharacterID: 10, Operation: "add", Amount: 5, ExpectedAmount: &expected, Reason: "Award from support ticket"},
		{CharacterID: 10, Operation: "subtract", Amount: 5, ExpectedAmount: &expected, Reason: "Reversing duplicate award"},
	}
	for _, request := range valid {
		if err := validateAlternateCurrencyBalance(request); err != nil {
			t.Fatalf("validateAlternateCurrencyBalance(%s) error = %v", request.Operation, err)
		}
	}

	invalid := []alternateCurrencyBalanceRequest{
		{CharacterID: 0, Operation: "set", Amount: 1, ExpectedAmount: &expected, Reason: "Correcting a support issue"},
		{CharacterID: 10, Operation: "unknown", Amount: 1, ExpectedAmount: &expected, Reason: "Correcting a support issue"},
		{CharacterID: 10, Operation: "add", Amount: 0, ExpectedAmount: &expected, Reason: "Correcting a support issue"},
		{CharacterID: 10, Operation: "set", Amount: -1, ExpectedAmount: &expected, Reason: "Correcting a support issue"},
		{CharacterID: 10, Operation: "set", Amount: 1, ExpectedAmount: nil, Reason: "Correcting a support issue"},
		{CharacterID: 10, Operation: "set", Amount: 1, ExpectedAmount: &expected, Reason: "short"},
	}
	for _, request := range invalid {
		if err := validateAlternateCurrencyBalance(request); err == nil {
			t.Fatalf("validateAlternateCurrencyBalance(%+v) expected an error", request)
		}
	}
}

func TestAlternateCurrencyAdjustedBalance(t *testing.T) {
	tests := []struct {
		current   uint64
		operation string
		amount    int64
		want      uint64
	}{
		{current: 10, operation: "set", amount: 3, want: 3},
		{current: 10, operation: "add", amount: 3, want: 13},
		{current: 10, operation: "subtract", amount: 3, want: 7},
		{current: 10, operation: "subtract", amount: 10, want: 0},
	}
	for _, test := range tests {
		got, err := alternateCurrencyAdjustedBalance(test.current, test.operation, test.amount)
		if err != nil {
			t.Fatalf("alternateCurrencyAdjustedBalance(%d, %s, %d) error = %v", test.current, test.operation, test.amount, err)
		}
		if got != test.want {
			t.Fatalf("alternateCurrencyAdjustedBalance(%d, %s, %d) = %d, want %d", test.current, test.operation, test.amount, got, test.want)
		}
	}

	if _, err := alternateCurrencyAdjustedBalance(5, "subtract", 6); err == nil {
		t.Fatal("subtracting more than the current balance expected an error")
	}
	if _, err := alternateCurrencyAdjustedBalance(math.MaxUint32, "add", 1); err == nil {
		t.Fatal("overflowing the unsigned database balance expected an error")
	}
}

func TestValidateAlternateCurrencyResolve(t *testing.T) {
	if err := validateAlternateCurrencyResolve(alternateCurrencyResolveRequest{
		Mode: "replace", TargetID: 5, Reason: "Consolidating duplicate currencies",
	}, 4); err != nil {
		t.Fatalf("validateAlternateCurrencyResolve(valid replace) error = %v", err)
	}
	if err := validateAlternateCurrencyResolve(alternateCurrencyResolveRequest{
		Mode: "remove", DeleteBalances: true, Reason: "Retiring unused event currency",
	}, 4); err != nil {
		t.Fatalf("validateAlternateCurrencyResolve(valid remove) error = %v", err)
	}
	if err := validateAlternateCurrencyResolve(alternateCurrencyResolveRequest{
		Mode: "replace", TargetID: 4, Reason: "Consolidating duplicate currencies",
	}, 4); err == nil {
		t.Fatal("self replacement expected an error")
	}
}
