package telnet

import (
	"bufio"
	"fmt"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/EQEmuTools/spire/internal/logger"
)

func TestConfiguredWorldConnection(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	done := make(chan error, 1)
	go func() {
		conn, err := listener.Accept()
		if err != nil {
			done <- err
			return
		}
		defer conn.Close()
		_ = conn.SetDeadline(time.Now().Add(3 * time.Second))
		_, _ = fmt.Fprint(conn, "assuming admin\r\n> ")
		reader := bufio.NewReader(conn)
		for i := 0; i < 2; i++ {
			if _, err = reader.ReadString('\n'); err != nil {
				done <- err
				return
			}
			_, _ = fmt.Fprint(conn, "> ")
		}
		if _, err = reader.ReadString('\n'); err != nil {
			done <- err
			return
		}
		_, err = fmt.Fprint(conn, "World uptime 1 second\n\r> ")
		done <- err
	}()
	client := NewClientWithAddress(logger.NewAppLogger(), listener.Addr().String())
	defer client.Close()
	response, err := client.Command(CommandConfig{Command: "uptime 0"})
	if err != nil || strings.TrimSpace(response) != "World uptime 1 second" {
		t.Fatalf("configured world response: %q, %v", response, err)
	}
	if err = <-done; err != nil {
		t.Fatal(err)
	}
}

func TestAnnouncementPromptOnlyResponseKeepsConnectionUsable(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	commands := []CommandConfig{
		{Command: "emote world 15 Scheduled restart", AllowEmptyResponse: true},
		{Command: "wwmarquee 15 Scheduled restart", AllowEmptyResponse: true},
		{Command: "uptime 0"},
	}
	done := make(chan error, 1)
	go func() {
		conn, err := listener.Accept()
		if err != nil {
			done <- err
			return
		}
		defer conn.Close()
		_ = conn.SetDeadline(time.Now().Add(4 * time.Second))
		_, _ = fmt.Fprint(conn, "assuming admin\n\r> ")
		reader := bufio.NewReader(conn)
		for i := 0; i < 2+len(commands); i++ {
			line, err := reader.ReadString('\n')
			if err != nil {
				done <- err
				return
			}
			if i >= 2 && strings.TrimSpace(line) != commands[i-2].Command {
				done <- fmt.Errorf("unexpected command: %q", line)
				return
			}
			if i == 2+len(commands)-1 {
				_, err = fmt.Fprint(conn, "World uptime 1 second\n\r> ")
			} else {
				// Real world sends no line break for successful announcements.
				_, err = fmt.Fprint(conn, ">")
				time.Sleep(time.Millisecond)
				if err == nil {
					_, err = fmt.Fprint(conn, " ")
				}
			}
			if err != nil {
				done <- err
				return
			}
		}
		done <- nil
	}()
	client := NewClientWithAddress(logger.NewAppLogger(), listener.Addr().String())
	defer client.Close()
	for i, command := range commands {
		response, err := client.Command(command)
		if err != nil {
			t.Fatalf("command %q failed on a valid console acknowledgement: %v", command.Command, err)
		}
		if i < 2 && strings.TrimSpace(response) != "" {
			t.Fatalf("prompt-only response contained unexpected data: %q", response)
		}
		if i == 2 && strings.TrimSpace(response) != "World uptime 1 second" {
			t.Fatalf("health response after announcements: %q", response)
		}
	}
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}

func TestPromptOnlyResponseStillRequiresAcknowledgement(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	done := make(chan struct{})
	go func() {
		defer close(done)
		conn, err := listener.Accept()
		if err != nil {
			return
		}
		defer conn.Close()
		_ = conn.SetDeadline(time.Now().Add(3 * time.Second))
		_, _ = fmt.Fprint(conn, "assuming admin\n\r> ")
		reader := bufio.NewReader(conn)
		for i := 0; i < 2; i++ {
			if _, err := reader.ReadString('\n'); err != nil {
				return
			}
			_, _ = fmt.Fprint(conn, "> ")
		}
		if _, err := reader.ReadString('\n'); err != nil {
			return
		}
		_, _ = fmt.Fprint(conn, "incomplete response")
		_, _ = reader.ReadString('\n') // Wait for the client to time out and close.
	}()
	client := NewClientWithAddress(logger.NewAppLogger(), listener.Addr().String())
	defer client.Close()
	if _, err := client.Command(CommandConfig{Command: "emote world 15 warning", AllowEmptyResponse: true}); err == nil {
		t.Fatal("unacknowledged command reported success")
	}
	<-done
}
