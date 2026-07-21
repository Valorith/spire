package app

import (
	"fmt"
	"os/exec"
	"runtime"
	"strings"
)

func pickSageFsDirectory() (string, error) {
	switch runtime.GOOS {
	case "darwin":
		return runSageFsDirectoryPicker(
			exec.Command(
				"osascript",
				"-e",
				`set selectedFolder to choose folder with prompt "Select your EverQuest directory"`,
				"-e",
				"POSIX path of selectedFolder",
			),
			func(err error) bool {
				exitErr, ok := err.(*exec.ExitError)
				if !ok {
					return false
				}
				message := string(exitErr.Stderr)
				return strings.Contains(message, "User canceled") || strings.Contains(message, "(-128)")
			},
		)
	case "windows":
		const script = `$dialog = New-Object System.Windows.Forms.FolderBrowserDialog; ` +
			`$dialog.Description = 'Select your EverQuest directory'; ` +
			`if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { ` +
			`[Console]::Out.Write($dialog.SelectedPath) }`
		return runSageFsDirectoryPicker(
			exec.Command(
				"powershell.exe",
				"-NoProfile",
				"-Sta",
				"-Command",
				"Add-Type -AssemblyName System.Windows.Forms; "+script,
			),
			func(error) bool { return false },
		)
	default:
		if zenity, err := exec.LookPath("zenity"); err == nil {
			return runSageFsDirectoryPicker(
				exec.Command(
					zenity,
					"--file-selection",
					"--directory",
					"--title=Select your EverQuest directory",
				),
				func(err error) bool {
					exitErr, ok := err.(*exec.ExitError)
					return ok && exitErr.ExitCode() == 1
				},
			)
		}
		if kdialog, err := exec.LookPath("kdialog"); err == nil {
			return runSageFsDirectoryPicker(
				exec.Command(
					kdialog,
					"--getexistingdirectory",
					".",
					"--title",
					"Select your EverQuest directory",
				),
				func(err error) bool {
					exitErr, ok := err.(*exec.ExitError)
					return ok && exitErr.ExitCode() == 1
				},
			)
		}
		return "", fmt.Errorf("no supported native directory selector is installed")
	}
}

func runSageFsDirectoryPicker(
	command *exec.Cmd,
	isCancellation func(error) bool,
) (string, error) {
	output, err := command.Output()
	if err != nil {
		if isCancellation(err) {
			return "", nil
		}
		return "", err
	}
	return strings.TrimSpace(string(output)), nil
}
