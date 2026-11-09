package controllers

import (
	"context"
	"os"
	"strings"
	"testing"

	"github.com/EQEmuTools/spire/internal/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// TestAnnouncePetitionsIntegration runs the Discord watcher against a real
// EQEmu database. Set SPIRE_SUPPORT_IT_MYSQL to a DSN without a database name
// (user:pass@tcp(host:port)/) and SPIRE_SUPPORT_IT_EQEMU to the EQEmu schema.
// It uses its own scratch Spire schema and never posts to Discord.
func TestAnnouncePetitionsIntegration(t *testing.T) {
	dsn, schema := os.Getenv("SPIRE_SUPPORT_IT_MYSQL"), os.Getenv("SPIRE_SUPPORT_IT_EQEMU")
	if dsn == "" || schema == "" {
		t.Skip("set SPIRE_SUPPORT_IT_MYSQL and SPIRE_SUPPORT_IT_EQEMU to run")
	}
	quiet := &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)}
	root, err := gorm.Open(mysql.Open(dsn+"?parseTime=true"), quiet)
	if err != nil {
		t.Fatal(err)
	}
	const scratch = "spire_support_alerts_it"
	if err := root.Exec("CREATE DATABASE IF NOT EXISTS " + scratch).Error; err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { root.Exec("DROP DATABASE IF EXISTS " + scratch) })
	spire, err := gorm.Open(mysql.Open(dsn+scratch+"?parseTime=true"), quiet)
	if err != nil {
		t.Fatal(err)
	}
	eqemu, err := gorm.Open(mysql.Open(dsn+schema+"?parseTime=true"), quiet)
	if err != nil {
		t.Fatal(err)
	}
	if err := spire.AutoMigrate(&models.PlayerSupportSettings{}); err != nil {
		t.Fatal(err)
	}
	var newest int64
	if err := eqemu.Table("petitions").Select("COALESCE(MAX(senttime), 0)").Scan(&newest).Error; err != nil || newest == 0 {
		t.Skipf("needs at least one petition in %s (err %v)", schema, err)
	}
	if err := eqemu.Exec("INSERT INTO discord_webhooks (webhook_name, webhook_url, created_at) VALUES ('IT alerts', 'https://discord.com/api/webhooks/0/it', NOW())").Error; err != nil {
		t.Fatal(err)
	}
	var hook uint
	eqemu.Raw("SELECT MAX(id) FROM discord_webhooks WHERE webhook_name = 'IT alerts'").Scan(&hook)
	t.Cleanup(func() { eqemu.Exec("DELETE FROM discord_webhooks WHERE id = ?", hook) })

	settings := models.PlayerSupportSettings{DiscordWebhookID: hook, AlertedThrough: newest - 1}
	if err := spire.Create(&settings).Error; err != nil {
		t.Fatal(err)
	}
	var posts []string
	controller := &PlayerSupportController{postWebhook: func(_ context.Context, url string, body []byte) error {
		if url != "https://discord.com/api/webhooks/0/it" {
			t.Errorf("posted to %q", url)
		}
		posts = append(posts, string(body))
		return nil
	}}
	if err := controller.announcePetitions(context.Background(), spire, eqemu); err != nil {
		t.Fatal(err)
	}
	if len(posts) != 1 || !strings.Contains(posts[0], "New petition #") {
		t.Fatalf("posts = %v, want one petition alert", posts)
	}
	var stored models.PlayerSupportSettings
	spire.First(&stored)
	if stored.AlertedThrough != newest {
		t.Errorf("alerted through %d, want %d", stored.AlertedThrough, newest)
	}
	// Nothing new: no second post.
	if err := controller.announcePetitions(context.Background(), spire, eqemu); err != nil || len(posts) != 1 {
		t.Fatalf("second pass posted again (posts %d, err %v)", len(posts), err)
	}
	// Turned off: nothing is posted even for older petitions.
	spire.Model(&stored).Updates(map[string]interface{}{"discord_webhook_id": 0, "alerted_through": 0})
	if err := controller.announcePetitions(context.Background(), spire, eqemu); err != nil || len(posts) != 1 {
		t.Fatalf("posted while off (posts %d, err %v)", len(posts), err)
	}
}
