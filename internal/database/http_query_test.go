package database

import (
	"reflect"
	"testing"
)

func TestSplitWhereFilters(t *testing.T) {
	tests := []struct {
		name  string
		param string
		want  []string
	}{
		{
			name:  "empty",
			param: "",
			want:  []string{},
		},
		{
			name:  "multiple filters",
			param: "type__5.id__12",
			want:  []string{"type__5", "id__12"},
		},
		{
			name:  "escaped period in value",
			param: `type__5.value_like_Fire\. Bolt`,
			want:  []string{"type__5", "value_like_Fire. Bolt"},
		},
		{
			name:  "escaped backslash in value",
			param: `type__5.value_like_C:\\Spire`,
			want:  []string{"type__5", `value_like_C:\Spire`},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := splitWhereFilters(test.param); !reflect.DeepEqual(got, test.want) {
				t.Fatalf("splitWhereFilters(%q) = %#v, want %#v", test.param, got, test.want)
			}
		})
	}
}
