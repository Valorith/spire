package playersupport

import (
	"errors"
	"testing"
)

func TestClassifyBucketReload(t *testing.T) {
	for _, test := range []struct {
		reply string
		err   error
		want  string
	}{
		{`{"data":{"message":"Reloading [Data Buckets Cache] globally"},"method":"reload","execution_time":"0.1"}`, nil, "sent"},
		{`{"data":{"message":"Need to provide a type ID to reload."},"method":"reload"}`, nil, "unavailable"},
		{`{"data":null,"error":"No method specified","method":""}`, nil, "unavailable"},
		{"Command not found: api", nil, "unavailable"},
		{"", errors.New("connection refused"), "unavailable"},
	} {
		if got := classifyBucketReload(test.reply, test.err); got != test.want {
			t.Errorf("classifyBucketReload(%q, %v) = %q, want %q", test.reply, test.err, got, test.want)
		}
	}
	if got := testWorld("").ReloadBucketCache(); got != "unavailable" {
		t.Errorf("ReloadBucketCache() without a local World = %q", got)
	}
}
