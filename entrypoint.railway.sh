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
    /app/spire spire:migrate
    ;;
  *)
    echo "SPIRE_MIGRATE_ON_START must be 0 or 1" >&2
    exit 1
    ;;
esac

exec /app/spire http:serve --port "$PORT"
