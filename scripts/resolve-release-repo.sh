#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PACKAGE_FILE="$ROOT_DIR/package.json"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to resolve the release repository" >&2
  exit 1
fi

normalize_repo() {
  value=$(printf '%s' "$1" | tr -d '\r' | sed 's/[[:space:]]*$//')
  if [ -z "$value" ]; then
    return 1
  fi

  normalized=$(printf '%s\n' "$value" | sed -nE '
    s#^https://github\.com/([^/]+)/([^/]+)(\.git)?$#\1/\2#p
    s#^ssh://git@github\.com/([^/]+)/([^/]+)(\.git)?$#\1/\2#p
    s#^git@github\.com:([^/]+)/([^/]+)(\.git)?$#\1/\2#p
    s#^([^/[:space:]]+)/([^/[:space:]]+)$#\1/\2#p
  ' | head -n1)

  if [ -z "$normalized" ]; then
    return 1
  fi

  normalized=$(printf '%s' "$normalized" | sed 's/\.git$//')
  printf '%s\n' "$normalized"
}

if [ -n "${SPIRE_RELEASE_REPO:-}" ]; then
  if repo=$(normalize_repo "$SPIRE_RELEASE_REPO"); then
    printf '%s\n' "$repo"
    exit 0
  fi
  echo "Invalid SPIRE_RELEASE_REPO '${SPIRE_RELEASE_REPO}'. Expected owner/repo or a github.com repository URL." >&2
  exit 1
fi

if [ -f "$PACKAGE_FILE" ]; then
  package_repo=$(jq -r '.spire.release_repository // ""' "$PACKAGE_FILE")
  if repo=$(normalize_repo "$package_repo"); then
    printf '%s\n' "$repo"
    exit 0
  fi
fi

for remote_name in upstream origin; do
  if remote_url=$(git -C "$ROOT_DIR" remote get-url "$remote_name" 2>/dev/null); then
    if repo=$(normalize_repo "$remote_url"); then
      printf '%s\n' "$repo"
      exit 0
    fi
  fi
done

printf 'Valorith/spire\n'
