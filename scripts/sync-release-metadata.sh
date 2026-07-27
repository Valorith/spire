#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
RELEASE_REPO=$("$ROOT_DIR/scripts/resolve-release-repo.sh")
REPO_API="https://api.github.com/repos/$RELEASE_REPO"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to sync GitHub release metadata" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to sync GitHub release metadata" >&2
  exit 1
fi

TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-${GH_RELEASE_GITHUB_API_TOKEN:-}}}"
if [ -z "$TOKEN" ]; then
  echo "GH_TOKEN, GITHUB_TOKEN, or GH_RELEASE_GITHUB_API_TOKEN is required to sync release metadata" >&2
  exit 1
fi

RELEASE_METADATA=$("$ROOT_DIR/scripts/export-release-notes.sh" --field metadata)
RELEASE_TAG=$(printf '%s' "$RELEASE_METADATA" | jq -r '.tag_name')
RELEASE_TITLE=$(printf '%s' "$RELEASE_METADATA" | jq -r '.title')
RELEASE_PRERELEASE=$(printf '%s' "$RELEASE_METADATA" | jq -r '.prerelease')
NOTES_FILE=$(mktemp "${TMPDIR:-/tmp}/spire-release-notes.XXXXXX")
PAYLOAD_FILE=$(mktemp "${TMPDIR:-/tmp}/spire-release-payload.XXXXXX")
trap 'rm -f "$NOTES_FILE" "$PAYLOAD_FILE"' EXIT

"$ROOT_DIR/scripts/export-release-notes.sh" "$NOTES_FILE"

RELEASE_JSON=$(curl -fsSL \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $TOKEN" \
  "$REPO_API/releases/tags/$RELEASE_TAG")

RELEASE_ID=$(printf '%s' "$RELEASE_JSON" | jq -r '.id')
if [ -z "$RELEASE_ID" ] || [ "$RELEASE_ID" = "null" ]; then
  echo "Failed to resolve GitHub release id for [$RELEASE_TAG]" >&2
  exit 1
fi

jq -n \
  --arg tag_name "$RELEASE_TAG" \
  --arg name "$RELEASE_TITLE" \
  --argjson prerelease "$RELEASE_PRERELEASE" \
  --rawfile body "$NOTES_FILE" \
  '{tag_name: $tag_name, name: $name, body: $body, prerelease: $prerelease}' > "$PAYLOAD_FILE"

curl -fsSL \
  -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data @"$PAYLOAD_FILE" \
  "$REPO_API/releases/$RELEASE_ID" >/dev/null

echo "Synced GitHub release metadata for $RELEASE_TAG"
