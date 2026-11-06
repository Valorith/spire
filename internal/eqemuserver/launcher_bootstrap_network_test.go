package eqemuserver

import (
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

type bootstrapTransport func(*http.Request) (*http.Response, error)

func (f bootstrapTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestBootstrapNetworkWorkDoesNotBlockStop(t *testing.T) {
	for _, mode := range []string{"leaf registration", "opcode download"} {
		t.Run(mode, func(t *testing.T) {
			l, _ := prepareBootstrapFixture(t)
			cfg, err := l.serverconfig.Get()
			if err != nil {
				t.Fatal(err)
			}
			cfg.WebAdmin.Launcher.RunSharedMemory = false
			if mode == "leaf registration" {
				cfg.WebAdmin.Launcher.DistributedNodeType = LauncherNodeTypeLeaf
				cfg.Server.World.TCP.IP = "127.0.0.1"
			} else {
				cfg.WebAdmin.Launcher.UpdateOpcodesOnStart = true
				cfg.Server.Directories.Patches = "patches"
				cfg.Server.Directories.Opcodes = "opcodes"
				for _, name := range []string{"patches", "opcodes"} {
					if err := os.Mkdir(filepath.Join(l.pathmgmt.GetEQEmuServerPath(), name), 0700); err != nil {
						t.Fatal(err)
					}
				}
			}
			if err := l.serverconfig.Save(cfg); err != nil {
				t.Fatal(err)
			}
			// No listener or external network request is made by this fixture.
			l.rpcServerStart = func(int) error { return nil }
			entered, release := make(chan struct{}), make(chan struct{})
			var enteredOnce, releaseOnce sync.Once
			transport := http.DefaultTransport
			http.DefaultTransport = bootstrapTransport(func(r *http.Request) (*http.Response, error) {
				enteredOnce.Do(func() { close(entered) })
				<-release
				status := http.StatusOK
				if mode == "leaf registration" {
					status = http.StatusServiceUnavailable
				}
				return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader("{}")), Header: make(http.Header), Request: r}, nil
			})
			t.Cleanup(func() { http.DefaultTransport = transport })
			done := make(chan error, 1)
			go func() { done <- l.Start(); close(done) }()
			t.Cleanup(func() {
				releaseOnce.Do(func() { close(release) })
				select {
				case <-done:
				case <-time.After(10 * time.Second):
					t.Error("bootstrap did not finish after network fixture was released")
				}
			})
			select {
			case <-entered:
			case <-time.After(10 * time.Second):
				t.Fatal("bootstrap did not reach the network fixture")
			}
			if err := l.stopUnlocked(); err != nil {
				t.Fatalf("network work blocked stop: %v", err)
			}
			releaseOnce.Do(func() { close(release) })
			select {
			case err := <-done:
				if err != nil && !errors.Is(err, errLauncherStopped) {
					t.Fatal(err)
				}
			case <-time.After(10 * time.Second):
				t.Fatal("stopped bootstrap kept retrying registration")
			}
			cfg, err = l.serverconfig.Get()
			if err != nil || cfg.Spire.LauncherStart {
				t.Fatalf("bootstrap re-enabled a stopped launcher: %v", err)
			}
		})
	}
}

func TestBootstrapPublishesRPCAfterExecutableSetup(t *testing.T) {
	l, root := prepareBootstrapFixture(t)
	cfg, err := l.serverconfig.Get()
	if err != nil {
		t.Fatal(err)
	}
	cfg.WebAdmin.Launcher.DistributedNodeType = LauncherNodeTypeRoot
	if err := l.serverconfig.Save(cfg); err != nil {
		t.Fatal(err)
	}
	rpc := make(chan error, 1)
	l.rpcServerStart = func(int) error {
		err := l.runManagedStartup(func() error { return nil })
		rpc <- err
		return nil
	}
	done := make(chan error, 1)
	go func() { done <- l.Start(); close(done) }()
	t.Cleanup(func() {
		_ = os.WriteFile(filepath.Join(root, "release"), []byte("release"), 0600)
		select {
		case <-done:
		case <-time.After(10 * time.Second):
			t.Error("bootstrap did not finish")
		}
	})
	deadline := time.Now().Add(10 * time.Second)
	for {
		if _, err := os.Stat(filepath.Join(root, "ready")); err == nil {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("shared-memory fixture did not start")
		}
		time.Sleep(10 * time.Millisecond)
	}
	select {
	case err := <-rpc:
		t.Fatalf("RPC accepted work before executable setup finished: %v", err)
	default:
	}
	if err := os.WriteFile(filepath.Join(root, "release"), []byte("release"), 0600); err != nil {
		t.Fatal(err)
	}
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(10 * time.Second):
		t.Fatal("bootstrap did not finish")
	}
	select {
	case err := <-rpc:
		if err != nil {
			t.Fatalf("published RPC cannot claim executable access: %v", err)
		}
	case <-time.After(10 * time.Second):
		t.Fatal("RPC did not become available after bootstrap")
	}
}
