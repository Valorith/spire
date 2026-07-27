#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
CHANGELOG_FILE="${SPIRE_CHANGELOG_FILE:-$ROOT_DIR/CHANGELOG.md}"
PACKAGE_FILE="${SPIRE_PACKAGE_FILE:-$ROOT_DIR/package.json}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to validate CHANGELOG.md"
  exit 1
fi

if [ ! -f "$CHANGELOG_FILE" ]; then
  echo "CHANGELOG.md not found"
  exit 1
fi

if [ ! -f "$PACKAGE_FILE" ]; then
  echo "package.json not found"
  exit 1
fi

if grep -Eq 'gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|Authorization:[[:space:]]*Bearer[[:space:]]+[A-Za-z0-9._-]{20,}' "$CHANGELOG_FILE"; then
  echo "CHANGELOG.md appears to contain a token-like secret. Remove it before publishing release notes."
  exit 1
fi

PACKAGE_VERSION=$(jq -r '.version' "$PACKAGE_FILE")
TOP_HEADER=$(grep -m1 '^## \[' "$CHANGELOG_FILE" || true)

if [ -z "$TOP_HEADER" ]; then
  echo "CHANGELOG.md is missing a top release heading"
  exit 1
fi

TOP_VERSION=$(printf '%s\n' "$TOP_HEADER" | sed -E 's/^## \[([^]]+)\].*/\1/')

if [ -z "$TOP_VERSION" ]; then
  echo "Failed to parse the top changelog version"
  exit 1
fi

if [ "$TOP_VERSION" != "$PACKAGE_VERSION" ]; then
  echo "Top changelog version [$TOP_VERSION] does not match package.json version [$PACKAGE_VERSION]"
  exit 1
fi

DUPLICATES=$(grep '^## \[' "$CHANGELOG_FILE" | sed -E 's/^## \[([^]]+)\].*/\1/' | sort | uniq -d || true)
if [ -n "$DUPLICATES" ]; then
  echo "Duplicate changelog version headings found:"
  printf '%s\n' "$DUPLICATES"
  exit 1
fi

TOP_BODY=$(awk '
  BEGIN { in_top = 0 }
  /^## \[/ {
    if (in_top == 1) {
      exit
    }
    in_top = 1
    next
  }
  in_top == 1 { print }
' "$CHANGELOG_FILE" | tr -d '\r')

TOP_BODY_TRIMMED=$(printf '%s' "$TOP_BODY" | sed '/^[[:space:]]*$/d')
if [ -z "$TOP_BODY_TRIMMED" ]; then
  echo "The top changelog release section is empty"
  exit 1
fi

echo "CHANGELOG.md validation passed"
