package eqemuserverconfig

import (
	"encoding/json"
	"path/filepath"
	"sync"
	"testing"

	"github.com/EQEmuTools/spire/internal/atomicfile"
	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/pathmgmt"
)

func qaConfig(t *testing.T) (*Config, string) {
	t.Helper()
	log := logger.NewAppLogger()
	paths := pathmgmt.NewPathManagement(log)
	root := t.TempDir()
	paths.SetServerPath(root)
	cfg := NewConfig(log, paths)
	initial := EQEmuConfigJson{WebAdmin: &WebAdminConfig{Version: "1.0.0", Launcher: &WebAdminLauncherConfig{MinZoneProcesses: 10}}}
	initial.Server.World.Longname = filepath.Base(root)
	if err := cfg.Save(initial); err != nil {
		t.Fatal(err)
	}
	return cfg, root
}

func TestConfigSnapshotsDoNotMutateCachedLauncherSettings(t *testing.T) {
	cfg, _ := qaConfig(t)
	first, err := cfg.Get()
	if err != nil {
		t.Fatal(err)
	}
	first.WebAdmin.Launcher.DistributedNodeType = "leaf"
	second, err := cfg.Get()
	if err != nil {
		t.Fatal(err)
	}
	if second.WebAdmin.Launcher.DistributedNodeType != "" {
		t.Fatal("unsaved editor mutation changed the scheduler's cached configuration")
	}
}

func TestConfigCachesAreIndependentAcrossInstallations(t *testing.T) {
	first, _ := qaConfig(t)
	a, err := first.Get()
	if err != nil {
		t.Fatal(err)
	}
	second, _ := qaConfig(t)
	b, err := second.Get()
	if err != nil {
		t.Fatal(err)
	}
	reloaded, err := first.Get()
	if err != nil {
		t.Fatal(err)
	}
	if a.Server.World.Longname == b.Server.World.Longname || reloaded.Server.World.Longname != a.Server.World.Longname {
		t.Fatal("one installation's configuration replaced another's cache")
	}
}

func TestConcurrentSchedulerReadsAndConfigSaves(t *testing.T) {
	cfg, root := qaConfig(t)
	var wg sync.WaitGroup
	for i := 0; i < 4; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for n := 0; n < 30; n++ {
				read, err := cfg.Get()
				if err != nil {
					t.Error(err)
					return
				}
				// The settings editor edits a snapshot while the scheduler reads.
				read.WebAdmin.Launcher.MinZoneProcesses = 20 + n
				if err := cfg.Save(read); err != nil {
					t.Error(err)
					return
				}
			}
		}()
	}
	wg.Add(1)
	go func() {
		defer wg.Done()
		for n := 0; n < 120; n++ {
			data, err := atomicfile.Read(filepath.Join(root, "eqemu_config.json"))
			if err != nil {
				t.Error(err)
				return
			}
			var read EQEmuConfigJson
			if err := json.Unmarshal(data, &read); err != nil {
				t.Errorf("launcher observed a partial config write: %v", err)
				return
			}
		}
	}()
	wg.Wait()
}
