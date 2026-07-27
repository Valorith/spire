#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PACKAGE_FILE="${SPIRE_PACKAGE_FILE:-$ROOT_DIR/package.json}"
PACKAGE_LOCK_FILE="${SPIRE_PACKAGE_LOCK_FILE:-$ROOT_DIR/package-lock.json}"
CHANGELOG_FILE="${SPIRE_CHANGELOG_FILE:-$ROOT_DIR/CHANGELOG.md}"
RELEASE_TYPE=$(printf '%s\n' "${1:-}" | tr '[:upper:]' '[:lower:]' | sed -E 's/[[:space:]_]+/-/g; s/-release$//')

usage() {
  echo "Usage: $0 patch|minor|major" >&2
  exit 1
}

if [ "$RELEASE_TYPE" != "patch" ] && [ "$RELEASE_TYPE" != "minor" ] && [ "$RELEASE_TYPE" != "major" ]; then
  usage
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to prepare a release" >&2
  exit 1
fi

if [ ! -f "$PACKAGE_FILE" ]; then
  echo "package.json not found" >&2
  exit 1
fi

if [ ! -f "$CHANGELOG_FILE" ]; then
  echo "CHANGELOG.md not found" >&2
  exit 1
fi

CURRENT_VERSION=$(jq -r '.version // ""' "$PACKAGE_FILE")
if ! printf '%s\n' "$CURRENT_VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "package.json version [$CURRENT_VERSION] must be a plain semantic version like 4.23.5" >&2
  exit 1
fi

MAJOR=$(printf '%s\n' "$CURRENT_VERSION" | cut -d. -f1)
MINOR=$(printf '%s\n' "$CURRENT_VERSION" | cut -d. -f2)
PATCH=$(printf '%s\n' "$CURRENT_VERSION" | cut -d. -f3)

case "$RELEASE_TYPE" in
  patch)
    PATCH=$((PATCH + 1))
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
esac

NEXT_VERSION="$MAJOR.$MINOR.$PATCH"
RELEASE_DATE="${SPIRE_RELEASE_DATE:-$(TZ=UTC date '+%m/%d/%Y' | sed -E 's#^0##; s#/0#/#')}"

TOP_HEADER=$(grep -m1 '^## \[' "$CHANGELOG_FILE" || true)
if [ -z "$TOP_HEADER" ]; then
  echo "CHANGELOG.md is missing a top release heading" >&2
  exit 1
fi

TOP_VERSION=$(printf '%s\n' "$TOP_HEADER" | sed -E 's/^## \[([^]]+)\].*/\1/')
TOP_VERSION_NORMALIZED=$(printf '%s\n' "$TOP_VERSION" | tr '[:upper:]' '[:lower:]')
TOP_SECTION=$(
  awk '
    BEGIN { capture = 0 }
    /^## \[/ {
      if (capture == 1) {
        exit
      }
      capture = 1
    }
    capture == 1 { print }
  ' "$CHANGELOG_FILE"
)
IS_PRERELEASE=false
if printf '%s\n' "$TOP_HEADER" | grep -Eiq '^## \[[^]]+\][[:space:]]+\(Beta\)[[:space:]]+' ||
  printf '%s\n' "$TOP_SECTION" | sed '1d' | grep -Eiq '^[[:space:]]*Release[[:space:]]+Type:[[:space:]]*(\*\*)?BETA(\*\*)?[[:space:]]*$'; then
  IS_PRERELEASE=true
fi

if [ "$TOP_VERSION_NORMALIZED" = "unreleased" ]; then
  tmp_changelog=$(mktemp "${TMPDIR:-/tmp}/spire-changelog.XXXXXX")
  release_channel=""
  if [ "$IS_PRERELEASE" = "true" ]; then
    release_channel=" (Beta)"
  fi
  awk -v new_header="## [$NEXT_VERSION]${release_channel} $RELEASE_DATE" '
    BEGIN { replaced = 0 }
    /^## \[/ && replaced == 0 {
      print new_header
      replaced = 1
      next
    }
    { print }
  ' "$CHANGELOG_FILE" > "$tmp_changelog"
  mv "$tmp_changelog" "$CHANGELOG_FILE"
elif [ "$TOP_VERSION" != "$NEXT_VERSION" ]; then
  echo "Top CHANGELOG.md heading is [$TOP_VERSION], but this release will be [$NEXT_VERSION]." >&2
  echo "Put the prepared release notes at the top as [Unreleased], or manually set the top heading to [$NEXT_VERSION]." >&2
  exit 1
fi

if [ "$IS_PRERELEASE" = "true" ]; then
  tmp_changelog=$(mktemp "${TMPDIR:-/tmp}/spire-changelog.XXXXXX")
  awk '
    BEGIN { in_top = 0; saw_top = 0 }
    /^## \[/ {
      if (saw_top == 0) {
        in_top = 1
        saw_top = 1
        heading = $0
        if (tolower(heading) ~ /\][[:space:]]+\(beta\)[[:space:]]+/) {
          sub(/\][[:space:]]+\([^)]*\)[[:space:]]+/, "] (Beta) ", heading)
        } else {
          sub(/\][[:space:]]+/, "] (Beta) ", heading)
        }
        print heading
        next
      } else {
        in_top = 0
      }
    }
    {
      normalized = $0
      gsub(/[[:space:]*]/, "", normalized)
      if (in_top == 1 && toupper(normalized) == "RELEASETYPE:BETA") {
        next
      }
      print
    }
  ' "$CHANGELOG_FILE" > "$tmp_changelog"
  mv "$tmp_changelog" "$CHANGELOG_FILE"
fi

tmp_package=$(mktemp "${TMPDIR:-/tmp}/spire-package.XXXXXX")
jq --arg version "$NEXT_VERSION" '.version = $version' "$PACKAGE_FILE" > "$tmp_package"
mv "$tmp_package" "$PACKAGE_FILE"

if [ -f "$PACKAGE_LOCK_FILE" ]; then
  tmp_lock=$(mktemp "${TMPDIR:-/tmp}/spire-package-lock.XXXXXX")
  jq --arg version "$NEXT_VERSION" '
    .version = $version
    | if .packages and .packages[""] then .packages[""].version = $version else . end
  ' "$PACKAGE_LOCK_FILE" > "$tmp_lock"
  mv "$tmp_lock" "$PACKAGE_LOCK_FILE"
fi

"$ROOT_DIR/scripts/validate-changelog.sh" >/dev/null
"$ROOT_DIR/scripts/export-release-notes.sh" >/dev/null
IS_PRERELEASE=$("$ROOT_DIR/scripts/export-release-notes.sh" --field prerelease)

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "version=$NEXT_VERSION"
    echo "tag=v$NEXT_VERSION"
    echo "release_date=$RELEASE_DATE"
    echo "prerelease=$IS_PRERELEASE"
  } >> "$GITHUB_OUTPUT"
fi

if [ "$IS_PRERELEASE" = "true" ]; then
  echo "Prepared Spire v$NEXT_VERSION ($RELEASE_TYPE beta release)"
else
  echo "Prepared Spire v$NEXT_VERSION ($RELEASE_TYPE release)"
fi
