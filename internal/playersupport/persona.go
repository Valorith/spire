package playersupport

import (
	"encoding/hex"
	"errors"
	"fmt"
	"regexp"
	"strings"
)

// DefaultPersona is the name players see on a Game Master's tell when the
// Game Master has not chosen a persona.
const DefaultPersona = DisplayName

// PersonaMinLength and PersonaMaxLength bound a persona, as World does.
const (
	PersonaMinLength = 3
	PersonaMaxLength = 24
)

// Letters and single spaces, starting and ending with a letter.
var personaPattern = regexp.MustCompile(`^[A-Za-z]+( [A-Za-z]+)*$`)

// NormalizePersona checks a persona against World's rules: trimmed, 3 to 24
// characters, letters and single spaces only, starting with a letter. Names
// that read as the default ("GameMaster", "game master") are refused, so no
// persona can pass for the Game Master account. "" and the default itself
// mean no persona and return "".
func NormalizePersona(name string) (string, error) {
	name = strings.TrimSpace(name)
	if name == "" || name == DefaultPersona {
		return "", nil
	}
	if len(name) < PersonaMinLength || len(name) > PersonaMaxLength {
		return "", fmt.Errorf("A persona is %d to %d characters", PersonaMinLength, PersonaMaxLength)
	}
	if !personaPattern.MatchString(name) {
		return "", errors.New("Use letters and single spaces only, starting with a letter")
	}
	if strings.EqualFold(strings.ReplaceAll(name, " ", ""), "gamemaster") {
		return "", errors.New("Game Master is the default name; use the default or choose another name")
	}
	return name, nil
}

// PersonaArgument is the persona a tell carries: the Game Master's persona
// when World supports personas, and only when it is set and differs from the
// default. "" sends the tell exactly as before, which an older World needs:
// it answers nothing to the extra argument.
func PersonaArgument(persona string, features Features) string {
	if !features.Persona {
		return ""
	}
	name, err := NormalizePersona(persona)
	if err != nil {
		return ""
	}
	return name
}

// chatSendCommand is the console line for a tell: five arguments, or six
// with a persona. Text and persona are lowercase hex of printable ASCII.
func chatSendCommand(id string, accountID, characterID uint, text, persona string) string {
	command := fmt.Sprintf("supportchat send %s %d %d %s", id, accountID, characterID, hex.EncodeToString([]byte(text)))
	if persona != "" {
		command += " " + hex.EncodeToString([]byte(persona))
	}
	return command
}
