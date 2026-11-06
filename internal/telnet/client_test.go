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
