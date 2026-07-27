#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TEST_DIR=$(mktemp -d "${TMPDIR:-/tmp}/spire-release-metadata.XXXXXX")
trap 'rm -rf "$TEST_DIR"' EXIT

PACKAGE_FILE="$TEST_DIR/package.json"
CHANGELOG_FILE="$TEST_DIR/CHANGELOG.md"

assert_field() {
  expected=$1
  field=$2
  actual=$(
    SPIRE_CHANGELOG_FILE="$CHANGELOG_FILE" \
    SPIRE_PACKAGE_FILE="$PACKAGE_FILE" \
      "$ROOT_DIR/scripts/export-release-notes.sh" --field "$field"
  )
  if [ "$actual" != "$expected" ]; then
    echo "Release metadata field [$field] was [$actual], expected [$expected]" >&2
    exit 1
  fi
}

assert_metadata() {
  expected_title=$1
  expected_prerelease=$2
  expected_tag=$3
  metadata=$(
    SPIRE_CHANGELOG_FILE="$CHANGELOG_FILE" \
    SPIRE_PACKAGE_FILE="$PACKAGE_FILE" \
      "$ROOT_DIR/scripts/export-release-notes.sh" --field metadata
  )
  actual_title=$(printf '%s' "$metadata" | jq -r '.title')
  actual_prerelease=$(printf '%s' "$metadata" | jq -r '.prerelease')
  actual_tag=$(printf '%s' "$metadata" | jq -r '.tag_name')
  if [ "$actual_title" != "$expected_title" ] ||
    [ "$actual_prerelease" != "$expected_prerelease" ] ||
    [ "$actual_tag" != "$expected_tag" ]; then
    echo "Release metadata mismatch: $metadata" >&2
    exit 1
  fi
}

printf '%s\n' '{"version":"6.0.0"}' > "$PACKAGE_FILE"

printf '%s\n' \
  '## [6.0.0] 7/27/2026' \
  '' \
  '* Stable release notes' \
  '' \
  '## [5.0.0] 7/10/2026' \
  '' \
  'Release Type: **BETA**' \
  '* Historical beta release' > "$CHANGELOG_FILE"
assert_field "false" prerelease
assert_field "Spire v6.0.0 (Stable)" title
assert_metadata "Spire v6.0.0 (Stable)" "false" "v6.0.0"

printf '%s\n' \
  '## [6.0.0] (Beta) 7/27/2026' \
  '' \
  '* Beta release notes' \
  '' \
  '## [5.4.1] 7/26/2026' \
  '' \
  '* Stable history' > "$CHANGELOG_FILE"
assert_field "true" prerelease
assert_field "Spire v6.0.0 (Beta)" title
assert_metadata "Spire v6.0.0 (Beta)" "true" "v6.0.0"

printf '%s\n' \
  '## [6.0.0] 7/27/2026' \
  '' \
  'Release Type: **BETA**' \
  '* Legacy beta release notes' > "$CHANGELOG_FILE"
assert_field "true" prerelease
assert_field "Spire v6.0.0 (Beta)" title
assert_metadata "Spire v6.0.0 (Beta)" "true" "v6.0.0"

printf '%s\n' \
  '## [6.0.0] 7/27/2026' \
  '' \
  'Release Type: **BETA CANDIDATE**' \
  '* Stable release with non-directive text' > "$CHANGELOG_FILE"
assert_field "false" prerelease
assert_field "Spire v6.0.0 (Stable)" title
assert_metadata "Spire v6.0.0 (Stable)" "false" "v6.0.0"

GITHUB_OUTPUT_FILE="$TEST_DIR/github-output"
PACKAGE_LOCK_FILE="$TEST_DIR/package-lock.json"
printf '%s\n' '{"version":"5.4.1"}' > "$PACKAGE_FILE"
printf '%s\n' '{"version":"5.4.1","packages":{"":{"version":"5.4.1"}}}' > "$PACKAGE_LOCK_FILE"
printf '%s\n' \
  '## [Unreleased] (Beta) 7/27/2026' \
  '' \
  '* Prepared beta notes' \
  '' \
  '## [5.4.1] 7/26/2026' \
  '' \
  '* Stable history' > "$CHANGELOG_FILE"
SPIRE_CHANGELOG_FILE="$CHANGELOG_FILE" \
SPIRE_PACKAGE_FILE="$PACKAGE_FILE" \
SPIRE_PACKAGE_LOCK_FILE="$PACKAGE_LOCK_FILE" \
SPIRE_RELEASE_DATE="7/27/2026" \
GITHUB_OUTPUT="$GITHUB_OUTPUT_FILE" \
  "$ROOT_DIR/scripts/prepare-github-release.sh" patch >/dev/null
if ! grep -Fq '## [5.4.2] (Beta) 7/27/2026' "$CHANGELOG_FILE" ||
  ! grep -Fq 'prerelease=true' "$GITHUB_OUTPUT_FILE"; then
  echo "Beta prepare did not preserve the canonical heading and prerelease output" >&2
  exit 1
fi
assert_metadata "Spire v5.4.2 (Beta)" "true" "v5.4.2"

printf '%s\n' '{"version":"5.4.1"}' > "$PACKAGE_FILE"
printf '%s\n' '{"version":"5.4.1","packages":{"":{"version":"5.4.1"}}}' > "$PACKAGE_LOCK_FILE"
: > "$GITHUB_OUTPUT_FILE"
printf '%s\n' \
  '## [5.4.2] 7/27/2026' \
  '' \
  'Release Type: **BETA**' \
  '* Legacy prepared beta notes' \
  '' \
  '## [5.4.1] 7/26/2026' \
  '' \
  '* Stable history' > "$CHANGELOG_FILE"
SPIRE_CHANGELOG_FILE="$CHANGELOG_FILE" \
SPIRE_PACKAGE_FILE="$PACKAGE_FILE" \
SPIRE_PACKAGE_LOCK_FILE="$PACKAGE_LOCK_FILE" \
SPIRE_RELEASE_DATE="7/27/2026" \
GITHUB_OUTPUT="$GITHUB_OUTPUT_FILE" \
  "$ROOT_DIR/scripts/prepare-github-release.sh" patch >/dev/null
if ! grep -Fq '## [5.4.2] (Beta) 7/27/2026' "$CHANGELOG_FILE" ||
  grep -Fq 'Release Type:' "$CHANGELOG_FILE" ||
  ! grep -Fq 'prerelease=true' "$GITHUB_OUTPUT_FILE"; then
  echo "Legacy beta prepare did not normalize the heading and prerelease output" >&2
  exit 1
fi
assert_metadata "Spire v5.4.2 (Beta)" "true" "v5.4.2"

printf '%s\n' '{"version":"5.4.1"}' > "$PACKAGE_FILE"
printf '%s\n' '{"version":"5.4.1","packages":{"":{"version":"5.4.1"}}}' > "$PACKAGE_LOCK_FILE"
: > "$GITHUB_OUTPUT_FILE"
printf '%s\n' \
  '## [Unreleased] 7/27/2026' \
  '' \
  '* Prepared stable notes' \
  '' \
  '## [5.4.1] 7/26/2026' \
  '' \
  '* Stable history' > "$CHANGELOG_FILE"
SPIRE_CHANGELOG_FILE="$CHANGELOG_FILE" \
SPIRE_PACKAGE_FILE="$PACKAGE_FILE" \
SPIRE_PACKAGE_LOCK_FILE="$PACKAGE_LOCK_FILE" \
SPIRE_RELEASE_DATE="7/27/2026" \
GITHUB_OUTPUT="$GITHUB_OUTPUT_FILE" \
  "$ROOT_DIR/scripts/prepare-github-release.sh" patch >/dev/null
if ! grep -Fq '## [5.4.2] 7/27/2026' "$CHANGELOG_FILE" ||
  grep -Fq '## [5.4.2] (Stable)' "$CHANGELOG_FILE" ||
  ! grep -Fq 'prerelease=false' "$GITHUB_OUTPUT_FILE"; then
  echo "Stable prepare changed the heading format or prerelease output" >&2
  exit 1
fi
assert_metadata "Spire v5.4.2 (Stable)" "false" "v5.4.2"

echo "Release metadata regression checks passed"
