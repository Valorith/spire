package eqemuserver

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/telnet"
)

type qaWorld struct {
	calls int
	probe func() (string, error)
}

func (w *qaWorld) Close()                                               {}
func (w *qaWorld) Command(command telnet.CommandConfig) (string, error) { w.calls++; return w.probe() }

func TestRestartHealthCheckRequiresWorldResponse(t *testing.T) {
	w := &qaWorld{}
	w.probe = func() (string, error) {
		if w.calls == 1 {
			return "", nil
		}
		if w.calls == 2 {
			return "", errors.New("world starting")
		}
		return "World uptime 1 second", nil
	}
	if err := verifyRestartWorld(context.Background(), w, time.Second, time.Millisecond); err != nil {
		t.Fatal(err)
	}
	if w.calls != 3 {
		t.Fatalf("health verification accepted an empty or failed probe: %d calls", w.calls)
	}
}

func TestRestartHealthCheckTimeoutAndCancellation(t *testing.T) {
	for _, mode := range []string{"timeout", "late response", "cancelled"} {
		t.Run(mode, func(t *testing.T) {
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			w := &qaWorld{probe: func() (string, error) { return "", errors.New("offline") }}
			if mode == "cancelled" {
				cancel()
			}
			if mode == "late response" {
				w.probe = func() (string, error) { time.Sleep(15 * time.Millisecond); return "late uptime", nil }
			}
			err := verifyRestartWorld(ctx, w, 5*time.Millisecond, time.Millisecond)
			if err == nil {
				t.Fatal("unhealthy or late world reported success")
			}
			if mode == "cancelled" && (!errors.Is(err, context.Canceled) || w.calls != 0) {
				t.Fatalf("cancellation ignored: %v, %d probes", err, w.calls)
			}
		})
	}
}

func TestRestartWorldUsesConfiguredEndpoint(t *testing.T) {
	for _, tc := range []struct {
		host, port, want string
		invalid          bool
	}{
		{"", "", "127.0.0.1:9000", false},
		{"0.0.0.0", "9100", "127.0.0.1:9100", false},
		{"::", "9100", "[::1]:9100", false},
		{"127.0.0.2", "9200", "127.0.0.2:9200", false},
		{"localhost", "9300", "localhost:9300", false},
		{"127.0.0.1", "0", "", true},
		{"127.0.0.1", "65536", "", true},
		{"127.0.0.1", "invalid", "", true},
	} {
		t.Run(tc.host+":"+tc.port, func(t *testing.T) {
			cfg := eqemuserverconfig.EQEmuConfigJson{}
			cfg.Server.World.Telnet.IP = tc.host
			cfg.Server.World.Telnet.Port = tc.port
			got, err := restartWorldAddress(cfg)
			if (err != nil) != tc.invalid || got != tc.want {
				t.Fatalf("endpoint = %q, %v; want %q", got, err, tc.want)
			}
		})
	}
}
