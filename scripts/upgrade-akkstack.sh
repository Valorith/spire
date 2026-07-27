#!/usr/bin/env bash

set -Eeuo pipefail

readonly RELEASE_URL="https://github.com/Valorith/spire/releases/latest/download/spire-linux-amd64.zip"
readonly RELEASE_BINARY="spire-linux-amd64"

info() {
  printf '\n==> %s\n' "$1"
}

fail() {
  printf '\nUpgrade failed: %s\n' "$1" >&2
  exit 1
}

for command_name in curl; do
  command -v "$command_name" >/dev/null 2>&1 ||
    fail "Required command not found: $command_name"
done

akkstack_dir="${1:-$PWD}"
cd "$akkstack_dir" 2>/dev/null ||
  fail "AkkStack directory not found: $akkstack_dir"
akkstack_dir="$PWD"

[[ -f "$akkstack_dir/docker-compose.yml" ]] ||
  fail "Run this command from your AkkStack directory."
[[ -f "$akkstack_dir/server/bin/spire" ]] ||
  fail "Spire was not found at server/bin/spire. Finish installing AkkStack first."

if docker compose version >/dev/null 2>&1; then
  compose=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  compose=(docker-compose)
else
  fail "Docker Compose was not found."
fi

upgrade_stamp="$(date +%Y%m%d-%H%M%S)-$$"
spire_path="$akkstack_dir/server/bin/spire"
backup_path="$akkstack_dir/server/bin/spire.before-valorith-$upgrade_stamp"
download_zip="$akkstack_dir/server/bin/.spire-upgrade-$upgrade_stamp.zip"
staging_dir="$akkstack_dir/server/bin/.spire-upgrade-$upgrade_stamp"
staged_spire_path="$akkstack_dir/server/bin/.spire-upgrade-$upgrade_stamp.new"
container_download_zip="/home/eqemu/server/bin/.spire-upgrade-$upgrade_stamp.zip"
container_staging_dir="/home/eqemu/server/bin/.spire-upgrade-$upgrade_stamp"
container_staged_spire="/home/eqemu/server/bin/.spire-upgrade-$upgrade_stamp.new"
replacement_installed=0
server_stopped=0

cleanup() {
  exit_code=$?

  if [[ "$exit_code" -ne 0 && "$replacement_installed" -eq 1 ]]; then
    printf '\nRestoring the previous Spire binary...\n' >&2
    "${compose[@]}" stop eqemu-server >/dev/null 2>&1 || true
    cp "$backup_path" "$spire_path" || true
    chmod 0755 "$spire_path" || true
    "${compose[@]}" up -d eqemu-server >/dev/null 2>&1 || true
    server_stopped=0
  elif [[ "$server_stopped" -eq 1 ]]; then
    "${compose[@]}" up -d eqemu-server >/dev/null 2>&1 || true
  fi

  rm -f -- "$download_zip" "$staged_spire_path"
  rm -rf -- "$staging_dir"

  if [[ "$exit_code" -ne 0 ]]; then
    printf 'Your previous Spire installation has been preserved.\n' >&2
  fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM

info "Downloading the latest Valorith Spire release"
curl \
  --fail \
  --location \
  --retry 3 \
  --show-error \
  --silent \
  "$RELEASE_URL" \
  --output "$download_zip"

info "Preparing the release inside a temporary AkkStack container"
"${compose[@]}" run -T --rm --no-deps --entrypoint sh eqemu-server -c "
  set -eu
  rm -rf '$container_staging_dir'
  mkdir -p '$container_staging_dir'
  unzip -q '$container_download_zip' -d '$container_staging_dir'
  test -s '$container_staging_dir/$RELEASE_BINARY'
  chmod 0755 '$container_staging_dir/$RELEASE_BINARY'
  mv '$container_staging_dir/$RELEASE_BINARY' '$container_staged_spire'
" < /dev/null
[[ -s "$staged_spire_path" ]] ||
  fail "The release did not produce a usable Spire binary."

info "Stopping AkkStack briefly"
server_stopped=1
"${compose[@]}" stop eqemu-server

cp "$spire_path" "$backup_path"
replacement_installed=1
mv -f "$staged_spire_path" "$spire_path"
chmod 0755 "$spire_path"

info "Starting AkkStack"
"${compose[@]}" up -d eqemu-server
server_stopped=0

container_ready=0
for _ in {1..90}; do
  if "${compose[@]}" exec -T eqemu-server \
    sh -c 'curl --silent --show-error --max-time 2 --output /dev/null "http://127.0.0.1:${SPIRE_PORT:-3000}/api/v1/app/env"' \
    </dev/null >/dev/null 2>&1; then
    container_ready=1
    break
  fi
  sleep 1
done

[[ "$container_ready" -eq 1 ]] ||
  fail "Spire did not respond after the replacement."

replacement_installed=0

printf '\n'
printf 'Spire has been upgraded to the latest Valorith release.\n'
printf 'Open Spire and refresh the page. Future updates can be installed inside Spire.\n'
printf 'Backup: %s\n' "$backup_path"
