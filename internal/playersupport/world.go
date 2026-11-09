package playersupport

import (
	"bufio"
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/EQEmuTools/spire/internal/eqemuserver"
	"github.com/EQEmuTools/spire/internal/eqemuserverconfig"
	"github.com/EQEmuTools/spire/internal/logger"
	"github.com/EQEmuTools/spire/internal/telnet"
)

const Identity = "GameMaster"
const MaxMessage = 200
const framePrefix = "SPIRE_SUPPORT "
const protocolVersion = 2

type TellDecision string

const (
	TellAccepted    TellDecision = "accepted"
	TellNoPetition  TellDecision = "no_petition"
	TellMessagesOff TellDecision = "messages_off"
	TellUnavailable TellDecision = "unavailable"
	TellInvalid     TellDecision = "invalid"
)

var inboundRequestID = regexp.MustCompile(`^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$`)

var ErrUnavailable = errors.New("Live chat unavailable")
var ErrDeliveryUnknown = errors.New("World did not confirm delivery")
var errCompanionMissing = errors.New("World does not have the Player Support patch")
var errCompanionOutdated = errors.New("World has an older Player Support patch")

// CompanionStatus says whether the local World runs the Player Support
// companion patch. Live chat, moves and in-game notices need it; the queue,
// notes, mail, parcels and corpse inspection work without it.
type CompanionStatus string

const (
	// CompanionUnknown: there is no local World console, or it did not answer.
	CompanionUnknown CompanionStatus = "unknown"
	// CompanionReady: World answered the patch's commands.
	CompanionReady CompanionStatus = "ready"
	// CompanionMissing: World answered, but without the patch's commands.
	CompanionMissing CompanionStatus = "missing"
	// CompanionOutdated: World has the patch, with an older chat protocol.
	CompanionOutdated CompanionStatus = "outdated"
)

// Moves and notices only need the patch's console and zone commands.
func (s CompanionStatus) Moves() bool { return s == CompanionReady || s == CompanionOutdated }

type Frame struct {
	Kind        string `json:"kind"`
	Protocol    int    `json:"protocol"`
	RequestID   string `json:"request_id"`
	AccountID   uint   `json:"account_id"`
	CharacterID uint   `json:"character_id"`
	Character   string `json:"character"`
	Text        string `json:"text"`
}

// Presence is a snapshot of the World roster. Characters holds characters in
// a zone with tells on; InZone holds each account's character in a zone.
type Presence struct {
	Known      bool
	Accounts   map[uint]bool
	Characters map[uint]bool
	InZone     map[uint]OnlineCharacter
}

type OnlineCharacter struct {
	ID       uint
	Name     string
	TellsOff bool
}

type World struct {
	address func() string
	logger  *logger.AppLogger
	receive func(Frame) TellDecision

	rosterMu     sync.Mutex
	rosterAddr   string
	rosterClient *telnet.Client
	roster       Presence
	rosterUntil  time.Time

	companion      CompanionStatus
	companionUntil time.Time

	mu          sync.Mutex
	conn        *session
	retryAfter  time.Time
	outdated    bool
	maintaining bool
	change      chan struct{}
}

func NewWorld(config *eqemuserverconfig.Config, log *logger.AppLogger, receive func(Frame) TellDecision) *World {
	return &World{address: func() string {
		return loopbackConsoleAddress(config)
	}, logger: log, receive: receive, change: make(chan struct{})}
}

func loopbackConsoleAddress(config *eqemuserverconfig.Config) string {
	if config == nil || !config.Exists() {
		return ""
	}
	cfg, err := config.Get()
	if err != nil {
		return ""
	}
	host, port := cfg.Server.World.Telnet.IP, cfg.Server.World.Telnet.Port
	if host == "" || host == "localhost" || host == "0.0.0.0" {
		host = "127.0.0.1"
	}
	if host != "127.0.0.1" {
		return ""
	}
	if port == "" {
		port = "9000"
	}
	number, err := strconv.Atoi(port)
	if err != nil || number < 1 || number > 65535 {
		return ""
	}
	return net.JoinHostPort(host, port)
}

// NotifyParcelDelivery refreshes the online client's parcel queue. The caller
// has already committed the parcels, so an unavailable World must not turn
// the send into an error or invite a retry.
func NotifyParcelDelivery(config *eqemuserverconfig.Config, log *logger.AppLogger, characterID uint, parcelIDs []uint) {
	address := loopbackConsoleAddress(config)
	if address == "" || len(parcelIDs) == 0 {
		return
	}
	command := []string{"parcelnotify", strconv.FormatUint(uint64(characterID), 10)}
	for _, id := range parcelIDs {
		command = append(command, strconv.FormatUint(uint64(id), 10))
	}
	client := telnet.NewClientWithAddress(log, address)
	defer client.Close()
	reply, err := client.Command(telnet.CommandConfig{Command: strings.Join(command, " "), AllowEmptyResponse: true})
	switch reply {
	case "ok", "offline", "gone":
	default:
		log.Debug().Err(err).Uint("character_id", characterID).Msg("World did not confirm parcel notification")
	}
}

// consoleLocked returns the shared console client for the current address.
// The caller holds rosterMu.
func (w *World) consoleLocked() *telnet.Client {
	addr := w.address()
	if addr == "" {
		return nil
	}
	if addr != w.rosterAddr {
		if w.rosterClient != nil {
			w.rosterClient.Close()
		}
		w.rosterAddr = addr
		w.rosterClient = telnet.NewClientWithAddress(w.logger, addr)
		w.rosterUntil = time.Time{}
		w.companionUntil = time.Time{}
	}
	return w.rosterClient
}

// Companion reports whether World has the Player Support patch. A stock World
// answers "Command not found" to the harmless probe below; a patched World
// answers with JSON. The answer is cached, and rechecked often enough that a
// World restarted with the patch is detected within a minute.
func (w *World) Companion() CompanionStatus {
	w.rosterMu.Lock()
	defer w.rosterMu.Unlock()
	client := w.consoleLocked()
	if client == nil {
		return CompanionUnknown
	}
	if time.Now().Before(w.companionUntil) {
		return w.withProtocol(w.companion)
	}
	// Character 0 never exists, so World only validates and answers.
	probe := telnet.CommandConfig{Command: "supportlocation 0 0", AllowEmptyResponse: true}
	reply, err := client.Command(probe)
	if err != nil {
		// The shared connection dies when World restarts; the client
		// reconnects on the next command.
		reply, err = client.Command(probe)
	}
	w.companion = classifyCompanion(reply, err)
	switch w.companion {
	case CompanionUnknown:
		w.companionUntil = time.Now().Add(10 * time.Second)
	case CompanionReady:
		w.companionUntil = time.Now().Add(60 * time.Second)
	default:
		w.companionUntil = time.Now().Add(30 * time.Second)
	}
	return w.withProtocol(w.companion)
}

// withProtocol applies what the chat stream learned. Older patches answer the
// probe like the current one; only the chat handshake shows their protocol,
// and opening the stream (Ready) records it.
func (w *World) withProtocol(status CompanionStatus) CompanionStatus {
	w.mu.Lock()
	defer w.mu.Unlock()
	if status == CompanionReady && w.outdated {
		return CompanionOutdated
	}
	return status
}

// ChatCompanion opens the chat stream when World has a patch, so an older
// patch is reported as outdated before Spire relies on in-game replies.
func (w *World) ChatCompanion() CompanionStatus {
	status := w.Companion()
	if status == CompanionReady {
		w.Ready()
		status = w.Companion()
	}
	return status
}

func classifyCompanion(reply string, err error) CompanionStatus {
	if err != nil {
		return CompanionUnknown
	}
	if strings.Contains(reply, "Command not found") {
		return CompanionMissing
	}
	var answer struct {
		Status string `json:"status"`
	}
	if json.Unmarshal([]byte(reply), &answer) == nil && answer.Status != "" {
		return CompanionReady
	}
	return CompanionUnknown
}

// Roster shares one short-lived snapshot across queues and browsers.
func (w *World) Roster() Presence {
	w.rosterMu.Lock()
	defer w.rosterMu.Unlock()
	if w.consoleLocked() == nil {
		return Presence{}
	}
	if time.Now().Before(w.rosterUntil) {
		return w.roster
	}
	// World only includes login status and tells_off in its full roster.
	rows, err := eqemuserver.ReadWorldClientList(w.rosterClient, true)
	if err != nil {
		// Retry once on a fresh connection, in case World restarted.
		rows, err = eqemuserver.ReadWorldClientList(w.rosterClient, true)
	}
	w.roster = Presence{}
	w.rosterUntil = time.Now().Add(8 * time.Second)
	if err == nil && rows.Method == "get_client_list" {
		w.roster = presenceFromRoster(rows)
	}
	return w.roster
}

func presenceFromRoster(rows eqemuserver.WorldClientList) Presence {
	const online, inZone = 2, 5 // CLE_Status in EQEmu.
	result := Presence{Known: true, Accounts: map[uint]bool{}, Characters: map[uint]bool{}, InZone: map[uint]OnlineCharacter{}}
	for _, row := range rows.Data {
		if row.Online >= online && row.Online <= inZone && row.AccountID > 0 {
			result.Accounts[uint(row.AccountID)] = true
			if row.Online == inZone && row.CharacterID > 0 {
				result.InZone[uint(row.AccountID)] = OnlineCharacter{ID: uint(row.CharacterID), Name: row.Name, TellsOff: row.TellsOff != 0}
				if row.TellsOff == 0 {
					result.Characters[uint(row.CharacterID)] = true
				}
			}
		}
	}
	return result
}

func (w *World) Changes() <-chan struct{} {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.change
}

func (w *World) Notify() {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.notifyLocked()
}

func (w *World) notifyLocked() {
	close(w.change)
	w.change = make(chan struct{})
}

// Ready negotiates the dedicated console stream when support chat is opened.
func (w *World) Ready() bool {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.connectLocked() != nil
}

func (w *World) Resume() {
	w.mu.Lock()
	defer w.mu.Unlock()
	if !w.maintaining {
		w.maintaining = true
		go w.maintain()
	}
}

func (w *World) connectLocked() *session {
	addr := w.address()
	if w.conn != nil {
		if w.conn.addr == addr {
			return w.conn
		}
		w.conn.Close()
		w.conn = nil
	}
	if addr == "" || time.Now().Before(w.retryAfter) {
		return nil
	}
	w.retryAfter = time.Now().Add(8 * time.Second)
	conn, err := openSession(addr)
	if errors.Is(err, errCompanionOutdated) {
		w.outdated = true
	}
	if errors.Is(err, errCompanionMissing) || errors.Is(err, errCompanionOutdated) {
		// World must be rebuilt and restarted before this can change.
		w.retryAfter = time.Now().Add(60 * time.Second)
	}
	if err != nil {
		return nil
	}
	w.outdated = false
	w.conn = conn
	w.notifyLocked()
	go w.read(conn)
	if !w.maintaining {
		w.maintaining = true
		go w.maintain()
	}
	return conn
}

func (w *World) maintain() {
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()
	for {
		w.mu.Lock()
		conn := w.connectLocked()
		w.mu.Unlock()
		if conn != nil && conn.write("supportchat ping") != nil {
			conn.Close()
		}
		<-ticker.C
	}
}

func (w *World) read(conn *session) {
	defer func() {
		conn.Close()
		close(conn.done)
		w.mu.Lock()
		defer w.mu.Unlock()
		if w.conn == conn {
			w.conn = nil
			w.notifyLocked()
		}
	}()
	for {
		_ = conn.SetReadDeadline(time.Now().Add(50 * time.Second))
		if !conn.scan.Scan() {
			return
		}
		frame, ok := parseFrame(conn.scan.Text())
		if !ok {
			continue
		}
		switch frame.Kind {
		case "tell":
			if !inboundRequestID.MatchString(frame.RequestID) {
				continue
			}
			decision := TellUnavailable
			if frame.CharacterID != 0 && frame.AccountID != 0 && w.receive != nil {
				decision = w.receive(frame)
			}
			if err := conn.write("supportchat decision " + frame.RequestID + " " + string(decision)); err != nil {
				return
			}
		case "sent", "unreachable":
			conn.mu.Lock()
			result := conn.pending[frame.RequestID]
			conn.mu.Unlock()
			if result != nil {
				select {
				case result <- frame:
				default:
				}
			}
		}
	}
}

func ValidateMessage(text string) bool {
	if len(text) == 0 || len(text) > MaxMessage {
		return false
	}
	for _, b := range []byte(text) {
		if b < 32 || b > 126 {
			return false
		}
	}
	return true
}

// Send waits for World to accept or reject the tell. A lost acknowledgement is
// ambiguous, so callers retain the request key and do not replay the tell.
func (w *World) Send(ctx context.Context, id string, accountID, characterID uint, text string) error {
	w.mu.Lock()
	conn := w.connectLocked()
	w.mu.Unlock()
	if conn == nil {
		return ErrUnavailable
	}
	result := make(chan Frame, 1)
	conn.mu.Lock()
	conn.pending[id] = result
	conn.mu.Unlock()
	defer func() {
		conn.mu.Lock()
		delete(conn.pending, id)
		conn.mu.Unlock()
	}()
	command := fmt.Sprintf("supportchat send %s %d %d %s", id, accountID, characterID, hex.EncodeToString([]byte(text)))
	if err := conn.write(command); err != nil {
		conn.Close()
		return ErrDeliveryUnknown
	}
	timeout := time.NewTimer(3 * time.Second)
	defer timeout.Stop()
	var reply Frame
	select {
	case reply = <-result:
	case <-timeout.C:
	case <-conn.done:
	case <-ctx.Done():
	}
	if reply.Kind == "" {
		select {
		case reply = <-result:
		default:
			return ErrDeliveryUnknown
		}
	}
	if reply.Kind == "sent" {
		return nil
	}
	return errors.New("Character cannot receive tells right now")
}

type session struct {
	net.Conn
	addr    string
	scan    *bufio.Scanner
	done    chan struct{}
	mu      sync.Mutex
	pending map[string]chan Frame
	writeMu sync.Mutex
}

func openSession(addr string) (*session, error) {
	socket, err := net.DialTimeout("tcp", addr, time.Second)
	if err != nil {
		return nil, err
	}
	conn, err := startSession(addr, socket)
	if err != nil {
		socket.Close()
	}
	return conn, err
}

func startSession(addr string, socket net.Conn) (*session, error) {
	conn := &session{Conn: socket, addr: addr, scan: bufio.NewScanner(socket), done: make(chan struct{}), pending: map[string]chan Frame{}}
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	local := false
	for conn.scan.Scan() {
		if strings.Contains(conn.scan.Text(), "assuming admin") {
			local = true
			break
		}
	}
	if !local {
		return nil, ErrUnavailable
	}
	if err := conn.write("echo off\nsupportchat listen"); err != nil {
		return nil, err
	}
	for conn.scan.Scan() {
		line := conn.scan.Text()
		frame, ok := parseFrame(line)
		if ok && frame.Kind == "ready" {
			if frame.Protocol != protocolVersion {
				return nil, errCompanionOutdated
			}
			return conn, nil
		}
		if strings.Contains(line, "Command not found: supportchat") {
			return nil, errCompanionMissing
		}
		if ok && frame.Kind == "busy" {
			break
		}
	}
	return nil, ErrUnavailable
}

func (s *session) write(command string) error {
	s.writeMu.Lock()
	defer s.writeMu.Unlock()
	_ = s.SetWriteDeadline(time.Now().Add(time.Second))
	_, err := s.Write([]byte(command + "\n"))
	return err
}

func parseFrame(line string) (Frame, bool) {
	_, body, found := strings.Cut(line, framePrefix)
	var frame Frame
	if !found || json.Unmarshal([]byte(body), &frame) != nil {
		return Frame{}, false
	}
	return frame, true
}
