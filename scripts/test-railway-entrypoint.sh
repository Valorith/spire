#!/usr/bin/env bash
# No database, Docker daemon, credentials or external delivery required.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT
export SPIRE_ENTRYPOINT_CALLS="$scratch/calls"
cat > "$scratch/spire" <<'STUB'
#!/bin/sh
printf '%s\n' "$*" >> "$SPIRE_ENTRYPOINT_CALLS"
if [ "$1" = spire:migrate ]; then
  exit "${MIGRATION_STATUS:-0}"
fi
exit "${SERVER_STATUS:-0}"
STUB
chmod +x "$scratch/spire"
# Substitute only the binary path in a disposable copy of the real entrypoint.
sed "s|/app/spire|$scratch/spire|g" "$root/entrypoint.railway.sh" > "$scratch/entrypoint.sh"
run() {
  : > "$SPIRE_ENTRYPOINT_CALLS"
  set +e
  PORT="$1" MIGRATION_STATUS="$2" SERVER_STATUS="$3" SPIRE_MIGRATE_ON_START="$5" sh "$scratch/entrypoint.sh" > "$scratch/output" 2>&1
  status=$?
  set -e
  test "$status" -eq "$4"
}
# Unset, empty and explicit zero preserve startup and perform no DDL.
for mode in '' 0; do
  run 8080 7 0 0 "$mode"
  printf 'http:serve --port 8080\n' > "$scratch/expected"
  cmp "$scratch/expected" "$SPIRE_ENTRYPOINT_CALLS"
done
: > "$SPIRE_ENTRYPOINT_CALLS"
(unset SPIRE_MIGRATE_ON_START; PORT=8080 sh "$scratch/entrypoint.sh")
cmp "$scratch/expected" "$SPIRE_ENTRYPOINT_CALLS"
run 8080 0 0 0 1
printf 'spire:migrate\nhttp:serve --port 8080\n' > "$scratch/expected"
cmp "$scratch/expected" "$SPIRE_ENTRYPOINT_CALLS"
run 8080 7 0 7 1
printf 'spire:migrate\n' > "$scratch/expected"
cmp "$scratch/expected" "$SPIRE_ENTRYPOINT_CALLS"
# Invalid and injection-shaped ports must run neither migration nor server.
for port in '' '8080; echo bad' 'abc'; do
  run "$port" 0 0 1 1
  test ! -s "$SPIRE_ENTRYPOINT_CALLS"
done
# Preserve the server's exit status after a successful migration.
for mode in true yes 2 '1; echo bad'; do
  run 8080 0 0 1 "$mode"
  test ! -s "$SPIRE_ENTRYPOINT_CALLS"
done
run 4321 0 9 9 1
printf 'spire:migrate\nhttp:serve --port 4321\n' > "$scratch/expected"
cmp "$scratch/expected" "$SPIRE_ENTRYPOINT_CALLS"
echo 'Railway entrypoint migration ordering and fail-closed tests passed'
