#!/usr/bin/env bash

set -Eeuo pipefail

readonly RELEASE_API_URL="https://api.github.com/repos/Valorith/spire/releases?per_page=100"
readonly RELEASE_ASSET_NAME="spire-linux-amd64.zip"
readonly RELEASE_BINARY_NAME="spire-linux-amd64"

fail() {
  printf 'Spire update failed: %s\n' "$1" >&2
  exit 1
}

[[ "$(uname -s)" == "Linux" ]] || fail "Linux is required."
case "$(uname -m)" in
  x86_64 | amd64) ;;
  *) fail "Only Linux AMD64 releases are currently available." ;;
esac

for command_name in curl python3; do
  command -v "$command_name" >/dev/null 2>&1 ||
    fail "Required command not found: $command_name"
done

spire_directory="${1:-$PWD}"
cd "$spire_directory" 2>/dev/null || fail "Spire directory not found: $spire_directory"
spire_directory="$PWD"

if [[ -f "$spire_directory/spire" ]]; then
  target_path="$spire_directory/spire"
elif [[ -f "$spire_directory/$RELEASE_BINARY_NAME" ]]; then
  target_path="$spire_directory/$RELEASE_BINARY_NAME"
else
  target_path="$spire_directory/spire"
fi

update_stamp="$(date +%Y%m%d-%H%M%S)-$$"
temp_directory="$(mktemp -d "${TMPDIR:-/tmp}/spire-update.XXXXXX")"
staged_target_path="$target_path.spire-update-$update_stamp.new"
backup_path=""

cleanup() {
  rm -f -- "$staged_target_path"
  rm -rf -- "$temp_directory"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

releases_path="$temp_directory/releases.json"
curl \
  --fail \
  --location \
  --retry 3 \
  --show-error \
  --silent \
  -H "Accept: application/vnd.github+json" \
  -H "User-Agent: Spire-Updater" \
  "$RELEASE_API_URL" \
  --output "$releases_path"

selection="$({ python3 - "$releases_path" "$RELEASE_ASSET_NAME" <<'PY'
import json
import sys

releases_path, asset_name = sys.argv[1:]
with open(releases_path, encoding="utf-8") as releases_file:
    releases = json.load(releases_file)

candidates = []
for release in releases:
    if release.get("draft"):
        continue

    try:
        version = tuple(int(part) for part in release["tag_name"].lstrip("v").split("."))
    except (KeyError, TypeError, ValueError):
        continue

    asset = next(
        (candidate for candidate in release.get("assets", []) if candidate.get("name") == asset_name),
        None,
    )
    if asset and asset.get("browser_download_url"):
        candidates.append((version, release, asset))

if not candidates:
    raise SystemExit("No compatible Spire release was found.")

_, release, asset = max(candidates, key=lambda candidate: candidate[0])
print(f'{release["tag_name"]}\t{asset["browser_download_url"]}')
PY
} 2>&1)" || fail "$selection"

IFS=$'\t' read -r release_tag release_url <<< "$selection"
[[ -n "$release_tag" && -n "$release_url" ]] || fail "GitHub returned incomplete release metadata."

download_path="$temp_directory/$RELEASE_ASSET_NAME"
curl \
  --fail \
  --location \
  --retry 3 \
  --show-error \
  --silent \
  "$release_url" \
  --output "$download_path"

extracted_binary_path="$temp_directory/$RELEASE_BINARY_NAME"
python3 - "$download_path" "$extracted_binary_path" "$RELEASE_BINARY_NAME" <<'PY'
import shutil
import sys
import zipfile

archive_path, destination_path, binary_name = sys.argv[1:]
with zipfile.ZipFile(archive_path) as archive:
    try:
        binary = archive.open(binary_name)
    except KeyError as error:
        raise SystemExit(f"The release archive did not contain {binary_name}.") from error
    with binary, open(destination_path, "wb") as destination:
        shutil.copyfileobj(binary, destination)
PY

[[ -s "$extracted_binary_path" ]] ||
  fail "The release archive did not contain a usable $RELEASE_BINARY_NAME."

install -m 0755 "$extracted_binary_path" "$staged_target_path"
if [[ -f "$target_path" ]]; then
  backup_path="$target_path.before-$update_stamp"
  cp -p -- "$target_path" "$backup_path"
fi

mv -f -- "$staged_target_path" "$target_path"

printf 'Installed Spire %s to %s\n' "$release_tag" "$target_path"
if [[ -n "$backup_path" ]]; then
  printf 'Backup: %s\n' "$backup_path"
fi
