package controllers

import (
	"runtime"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/database"
	gocache "github.com/patrickmn/go-cache"
)

// Every Spire command builds the controller, including the game server
// launcher; only the web server may start its background work, and once.
func TestPlayerSupportStartsOnlyOnStart(t *testing.T) {
	db := chatTestDB(t, &chatTestState{caseStatus: "open"})
	resolver := database.NewResolver(database.NewConnections(db, nil, nil), nil, nil, gocache.New(gocache.NoExpiration, 0))
	time.Sleep(50 * time.Millisecond) // let the resolver's own keep-alive start
	before := runtime.NumGoroutine()
	controller := NewPlayerSupportController(resolver, nil, &MailParcelsEditorController{}, nil, nil)
	time.Sleep(50 * time.Millisecond)
	if after := runtime.NumGoroutine(); after > before {
		t.Fatalf("constructing the controller started %d goroutine(s)", after-before)
	}
	if controller.mail.alertMail == nil {
		t.Error("the Mail & Parcels alert hook is not set")
	}

	var started int
	controller.background = func(func()) { started++ }
	controller.Start()
	controller.Start()
	// The petition alert watcher and the GameMaster mail watcher; the chat
	// stream is only resumed beside a configured game server.
	if started != 2 {
		t.Fatalf("Start ran %d background jobs over two calls, want 2", started)
	}
}

// Without a Spire database there is nothing to watch.
func TestPlayerSupportStartWithoutDatabase(t *testing.T) {
	controller := &PlayerSupportController{}
	ran := false
	controller.background = func(func()) { ran = true }
	controller.Start()
	if ran {
		t.Error("Start ran background work without a database")
	}
}
