#!/bin/sh
set -eu

# Validate PORT is numeric only (defense-in-depth)
case "${PORT:-}" in
  ""|*[!0-9]*)
    echo "Invalid PORT: ${PORT:-}" >&2
    exit 1
    ;;
esac

# Schema changes are an explicit operator decision, not a side effect of an
# image update. Enable only after reviewing migrations and verifying a backup.
case "${SPIRE_MIGRATE_ON_START:-0}" in
  0) ;;
  1)
    # Production skips local setup migrations. Fail closed if any table fails.
    migration_pid=
    migration_stop=
    stop_migration() {
      migration_stop="$1"
      # A signal can arrive between launching the child and recording its PID.
      # Remember it in that window and forward it immediately after assignment.
      if [ -n "$migration_pid" ]; then
        trap '' TERM INT
        kill -TERM "$migration_pid" 2>/dev/null || true
        wait "$migration_pid" 2>/dev/null || true
        exit "$migration_stop"
      fi
    }
    trap 'stop_migration 143' TERM
    trap 'stop_migration 130' INT
    /app/spire spire:migrate &
    migration_pid=$!
    if [ -n "$migration_stop" ]; then
      stop_migration "$migration_stop"
    fi
    migration_status=0
    wait "$migration_pid" || migration_status=$?
    trap - TERM INT
    if [ "$migration_status" -ne 0 ]; then
      exit "$migration_status"
    fi
    ;;
  *)
    echo "SPIRE_MIGRATE_ON_START must be 0 or 1" >&2
    exit 1
    ;;
esac

exec /app/spire http:serve --port "$PORT"
