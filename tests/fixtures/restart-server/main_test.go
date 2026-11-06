package main

import (
	"net"
	"os"
	"testing"
)

func TestStartupFailureJoinsRunnerAndRemovesTemporaryState(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	base := t.TempDir()
	if err := run(listener.Addr().(*net.TCPAddr).Port, base); err == nil {
		t.Fatal("starting on an occupied port succeeded")
	}
	entries, err := os.ReadDir(base)
	if err != nil || len(entries) != 0 {
		t.Fatalf("failed startup leaked state or held locks: %v, %v", entries, err)
	}
}
