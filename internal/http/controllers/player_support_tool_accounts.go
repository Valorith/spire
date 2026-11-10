package controllers

import (
	"fmt"
	"net"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

// ---------------------------------------------------------------------------
// Linked accounts: other accounts that logged in from the petitioning
// account's addresses. Addresses are masked here; raw IPs never leave the
// server.

// supportSharedIPLimit hides addresses used by more accounts than this, such
// as a NAT or an internet cafe.
const supportSharedIPLimit = 25

const supportLinkedLimit = 50

// supportMaskIP keeps the network part of an address: three IPv4 octets or
// three IPv6 groups. Anything that is not an address is "hidden".
func supportMaskIP(address string) string {
	ip := net.ParseIP(strings.TrimSpace(address))
	if ip == nil {
		return "hidden"
	}
	if v4 := ip.To4(); v4 != nil {
		return fmt.Sprintf("%d.%d.%d.x", v4[0], v4[1], v4[2])
	}
	return fmt.Sprintf("%x:%x:%x:x", uint16(ip[0])<<8|uint16(ip[1]), uint16(ip[2])<<8|uint16(ip[3]), uint16(ip[4])<<8|uint16(ip[5]))
}

// supportIgnoredIP: loopback and empty addresses link every local account.
func supportIgnoredIP(address string) bool {
	address = strings.TrimSpace(address)
	if address == "" || strings.HasPrefix(address, "127.") || address == "::1" {
		return true
	}
	ip := net.ParseIP(address)
	return ip != nil && (ip.IsLoopback() || ip.IsUnspecified())
}

// supportUsableIPs picks the account's addresses worth comparing. accounts
// counts the accounts that used each address; widely shared ones are hidden
// and counted.
func supportUsableIPs(own []string, accounts map[string]int) (usable []string, considered, hidden int) {
	seen := map[string]bool{}
	for _, address := range own {
		if supportIgnoredIP(address) || seen[address] {
			continue
		}
		seen[address] = true
		considered++
		if accounts[address] > supportSharedIPLimit {
			hidden++
			continue
		}
		usable = append(usable, address)
	}
	return usable, considered, hidden
}

type supportIPUse struct {
	AccountID uint
	IP        string
	LastUsed  time.Time
}

type supportSharedAddress struct {
	IP       string    `json:"ip"`
	LastUsed time.Time `json:"last_used"`
}

type supportLinkedAccount struct {
	ID          uint                   `json:"id"`
	Name        string                 `json:"name"`
	Status      int                    `json:"status"`
	Restriction string                 `json:"restriction"`
	Shared      []supportSharedAddress `json:"shared"`
	Characters  []string               `json:"characters"`
	Cases       int64                  `json:"cases"`
	lastUsed    time.Time
}

// supportGroupLinked groups other accounts' uses of the shared addresses,
// masked, most shared addresses first, then most recently used.
func supportGroupLinked(uses []supportIPUse, self uint) []supportLinkedAccount {
	byAccount := map[uint]*supportLinkedAccount{}
	order := []uint{}
	for _, use := range uses {
		if use.AccountID == self || use.AccountID == 0 || supportIgnoredIP(use.IP) {
			continue
		}
		account := byAccount[use.AccountID]
		if account == nil {
			account = &supportLinkedAccount{ID: use.AccountID, Shared: []supportSharedAddress{}, Characters: []string{}}
			byAccount[use.AccountID] = account
			order = append(order, use.AccountID)
		}
		account.Shared = append(account.Shared, supportSharedAddress{IP: supportMaskIP(use.IP), LastUsed: use.LastUsed})
		if use.LastUsed.After(account.lastUsed) {
			account.lastUsed = use.LastUsed
		}
	}
	linked := make([]supportLinkedAccount, 0, len(order))
	for _, id := range order {
		account := byAccount[id]
		sort.SliceStable(account.Shared, func(i, j int) bool { return account.Shared[i].LastUsed.After(account.Shared[j].LastUsed) })
		linked = append(linked, *account)
	}
	sort.SliceStable(linked, func(i, j int) bool {
		if len(linked[i].Shared) != len(linked[j].Shared) {
			return len(linked[i].Shared) > len(linked[j].Shared)
		}
		if !linked[i].lastUsed.Equal(linked[j].lastUsed) {
			return linked[i].lastUsed.After(linked[j].lastUsed)
		}
		return linked[i].ID < linked[j].ID
	})
	if len(linked) > supportLinkedLimit {
		linked = linked[:supportLinkedLimit]
	}
	return linked
}

// supportRestriction names an account's login restriction.
func supportRestriction(status int, suspendedUntil *time.Time, banReason string) string {
	switch {
	case status == -2 || strings.TrimSpace(banReason) != "":
		return "banned"
	case status == -1 || (suspendedUntil != nil && suspendedUntil.After(time.Now())):
		return "suspended"
	}
	return "none"
}

func (p *PlayerSupportController) linkedAccounts(c echo.Context) error {
	scope, err := p.scope(c, false)
	if err != nil {
		return supportError(c, err)
	}
	if scope.connectionID > 0 && !p.permissions.CanAccessRoute(c, scope.user, scope.connectionID, "/api/v1/player-support-linked-accounts", false) {
		return supportError(c, echo.NewHTTPError(http.StatusForbidden, "Linked accounts access is required"))
	}
	view, err := scope.caseByKey(c.Param("key"))
	if err != nil {
		return supportError(c, err)
	}
	accountID, err := toolAccount(scope, view)
	if err != nil {
		return supportError(c, err)
	}
	response := echo.Map{"accounts": []supportLinkedAccount{}, "ip_count": 0, "hidden_addresses": 0}
	columns, err := toolColumns(scope.eqemu, "account_ip")
	if err != nil {
		return supportError(c, err)
	}
	linked := []supportLinkedAccount{}
	if columns["accid"] && columns["ip"] {
		var own []string
		if err := scope.eqemu.Table("account_ip").Where("accid = ?", accountID).Limit(500).Pluck("ip", &own).Error; err != nil {
			return supportError(c, err)
		}
		candidates := []string{}
		for _, address := range own {
			if !supportIgnoredIP(address) {
				candidates = append(candidates, address)
			}
		}
		accounts := map[string]int{}
		if len(candidates) > 0 {
			var counts []struct {
				IP       string
				Accounts int
			}
			if err := scope.eqemu.Table("account_ip").Select("ip, COUNT(DISTINCT accid) AS accounts").
				Where("ip IN ?", candidates).Group("ip").Scan(&counts).Error; err != nil {
				return supportError(c, err)
			}
			for _, count := range counts {
				accounts[count.IP] = count.Accounts
			}
		}
		usable, considered, hidden := supportUsableIPs(own, accounts)
		response["ip_count"], response["hidden_addresses"] = considered, hidden
		if len(usable) > 0 {
			var uses []supportIPUse
			lastUsed := "lastused"
			if !columns["lastused"] {
				lastUsed = "NULL"
			}
			if err := scope.eqemu.Table("account_ip").Select("accid AS account_id, ip, "+lastUsed+" AS last_used").
				Where("ip IN ? AND accid <> ?", usable, accountID).Limit(2000).Scan(&uses).Error; err != nil {
				return supportError(c, err)
			}
			linked = supportGroupLinked(uses, accountID)
		}
	}
	if len(linked) > 0 {
		if err := p.decorateLinkedAccounts(scope, linked); err != nil {
			return supportError(c, err)
		}
	}
	response["accounts"] = linked
	if err := toolViewEntry(scope, view, "linked_view", fmt.Sprintf("Checked linked accounts (%d found)", len(linked)), false); err != nil {
		return supportError(c, err)
	}
	return c.JSON(http.StatusOK, response)
}

// decorateLinkedAccounts adds each account's name, restriction, first five
// characters and case count on this connection.
func (p *PlayerSupportController) decorateLinkedAccounts(scope supportScope, linked []supportLinkedAccount) error {
	ids := make([]uint, 0, len(linked))
	for _, account := range linked {
		ids = append(ids, account.ID)
	}
	var accounts []struct {
		ID             uint
		Name           string
		Status         int
		Suspendeduntil *time.Time
		BanReason      string
	}
	if err := scope.eqemu.Table("account").Select("id, name, status, suspendeduntil, COALESCE(ban_reason, '') AS ban_reason").
		Where("id IN ?", ids).Scan(&accounts).Error; err != nil {
		return err
	}
	var characters []struct {
		AccountID uint
		Name      string
	}
	if err := scope.eqemu.Table("character_data").Select("account_id, name").
		Where("account_id IN ? AND deleted_at IS NULL", ids).Order("account_id, id").Scan(&characters).Error; err != nil {
		return err
	}
	names := make([]string, 0, len(accounts))
	for _, account := range accounts {
		names = append(names, account.Name)
	}
	cases := map[string]int64{}
	if len(names) > 0 {
		var counts []struct {
			Account string
			Cases   int64
		}
		if err := scope.spire.Table("spire_player_support_cases").Select("account, COUNT(*) AS cases").
			Where("connection_id = ? AND account IN ?", scope.connectionID, names).Group("account").Scan(&counts).Error; err != nil {
			return err
		}
		for _, count := range counts {
			cases[strings.ToLower(count.Account)] = count.Cases
		}
	}
	for i := range linked {
		for _, account := range accounts {
			if account.ID == linked[i].ID {
				linked[i].Name, linked[i].Status = account.Name, account.Status
				linked[i].Restriction = supportRestriction(account.Status, account.Suspendeduntil, account.BanReason)
				linked[i].Cases = cases[strings.ToLower(account.Name)]
			}
		}
		if linked[i].Restriction == "" {
			linked[i].Restriction = "none"
		}
		for _, character := range characters {
			if character.AccountID == linked[i].ID && len(linked[i].Characters) < 5 {
				linked[i].Characters = append(linked[i].Characters, character.Name)
			}
		}
	}
	return nil
}
