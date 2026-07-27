#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
RELEASE_REPO=$("$ROOT_DIR/scripts/resolve-release-repo.sh")
REPO_API="https://api.github.com/repos/$RELEASE_REPO"
TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-${GH_RELEASE_GITHUB_API_TOKEN:-}}}"
ASSETS="spire-linux-amd64.zip spire-windows-amd64.exe.zip eqemu-server-installer-linux-amd64 eqemu-server-installer-windows-amd64.exe"

if [ -z "$TOKEN" ]; then
  echo "GH_TOKEN, GITHUB_TOKEN, or GH_RELEASE_GITHUB_API_TOKEN is required to publish a release" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to publish a release" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to publish a release" >&2
  exit 1
fi

RELEASE_METADATA=$("$ROOT_DIR/scripts/export-release-notes.sh" --field metadata)
RELEASE_TAG=$(printf '%s' "$RELEASE_METADATA" | jq -r '.tag_name')
RELEASE_TITLE=$(printf '%s' "$RELEASE_METADATA" | jq -r '.title')
RELEASE_PRERELEASE=$(printf '%s' "$RELEASE_METADATA" | jq -r '.prerelease')
NOTES_FILE=$(mktemp "${TMPDIR:-/tmp}/spire-release-notes.XXXXXX")
PAYLOAD_FILE=$(mktemp "${TMPDIR:-/tmp}/spire-release-payload.XXXXXX")
RESPONSE_FILE=$(mktemp "${TMPDIR:-/tmp}/spire-release-response.XXXXXX")
trap 'rm -f "$NOTES_FILE" "$PAYLOAD_FILE" "$RESPONSE_FILE"' EXIT

"$ROOT_DIR/scripts/export-release-notes.sh" "$NOTES_FILE"

for asset in $ASSETS; do
  if [ ! -f "$ROOT_DIR/$asset" ]; then
    echo "Release asset [$asset] is missing" >&2
    exit 1
  fi
done

jq -n \
  --arg tag_name "$RELEASE_TAG" \
  --arg name "$RELEASE_TITLE" \
  --arg target_commitish "$(git -C "$ROOT_DIR" rev-parse HEAD)" \
  --argjson prerelease "$RELEASE_PRERELEASE" \
  --rawfile body "$NOTES_FILE" \
  '{tag_name: $tag_name, name: $name, body: $body, target_commitish: $target_commitish, draft: false, prerelease: $prerelease}' > "$PAYLOAD_FILE"

http_code=$(curl -sS -o "$RESPONSE_FILE" -w "%{http_code}" \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $TOKEN" \
  "$REPO_API/releases/tags/$RELEASE_TAG")

case "$http_code" in
  200)
    release_id=$(jq -r '.id' "$RESPONSE_FILE")
    curl -fsSL \
      -X PATCH \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      --data @"$PAYLOAD_FILE" \
      "$REPO_API/releases/$release_id" > "$RESPONSE_FILE"
    ;;
  404)
    curl -fsSL \
      -X POST \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      --data @"$PAYLOAD_FILE" \
      "$REPO_API/releases" > "$RESPONSE_FILE"
    ;;
  *)
    echo "Failed to resolve release [$RELEASE_TAG] in [$RELEASE_REPO] (HTTP $http_code)" >&2
    cat "$RESPONSE_FILE" >&2
    exit 1
    ;;
esac

release_id=$(jq -r '.id' "$RESPONSE_FILE")
upload_url=$(jq -r '.upload_url' "$RESPONSE_FILE" | sed 's/{.*$//')

if [ -z "$release_id" ] || [ "$release_id" = "null" ] || [ -z "$upload_url" ] || [ "$upload_url" = "null" ]; then
  echo "Failed to resolve release upload metadata for [$RELEASE_TAG]" >&2
  cat "$RESPONSE_FILE" >&2
  exit 1
fi

release_assets_json=$(curl -fsSL \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $TOKEN" \
  "$REPO_API/releases/$release_id/assets")

for asset in $ASSETS; do
  asset_id=$(printf '%s' "$release_assets_json" | jq -r --arg name "$asset" '.[] | select(.name == $name) | .id' | head -n1)
  if [ -n "$asset_id" ] && [ "$asset_id" != "null" ]; then
    curl -fsSL \
      -X DELETE \
      -H "Accept: application/vnd.github+json" \
      -H "Authorization: Bearer $TOKEN" \
      "$REPO_API/releases/assets/$asset_id" >/dev/null
  fi

  curl -fsSL \
    -X POST \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/octet-stream" \
    --data-binary @"$ROOT_DIR/$asset" \
    "$upload_url?name=$asset" >/dev/null
done

echo "Published $RELEASE_TAG to $RELEASE_REPO"
