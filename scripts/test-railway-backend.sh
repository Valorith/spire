#!/usr/bin/env bash
# Exercise the Railway builder against disposable databases only.
set -euo pipefail

image="${1:-railway-backend-qa}"
database_image="${2:-mariadb:11.8.9}"
runtime_image="${3:-railway-runtime-qa}"
case "$database_image" in
  mariadb:*) database_client=mariadb; password_variable=MARIADB_ROOT_PASSWORD ;;
  mysql:*) database_client=mysql; password_variable=MYSQL_ROOT_PASSWORD ;;
  *) echo "Unsupported test database image: $database_image" >&2; exit 1 ;;
esac
network="spire-backend-qa-${GITHUB_RUN_ID:-$$}-${GITHUB_RUN_ATTEMPT:-1}"
database="${network}-db"
application="${network}-app"
cleanup() {
  docker rm --force "$application" "$database" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker network create --internal "$network" >/dev/null
# No host ports or production credentials are used. The password is a test fixture.
docker run --detach --rm --name "$database" --network "$network" \
  --env "$password_variable=spire-ci-only" "$database_image" >/dev/null
ready=false
for attempt in $(seq 1 60); do
  if docker exec "$database" "$database_client" --host=127.0.0.1 --user=root --password=spire-ci-only --execute="SELECT 1" >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 2
done
if [ "$ready" != true ]; then
  docker logs "$database"
  exit 1
fi

docker exec --interactive "$database" "$database_client" --user=root --password=spire-ci-only <<'SQL'
CREATE DATABASE spire_goqa;
CREATE DATABASE eqemu_goqa;
CREATE TABLE eqemu_goqa.petitions (dib bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY, petid bigint unsigned, charname varchar(64), zone varchar(64), urgency int, petitiontext text, senttime bigint unsigned);
INSERT INTO eqemu_goqa.petitions (petid, charname, zone, urgency, petitiontext, senttime) VALUES (1, 'SyntheticQA', 'qeynos', 0, 'Synthetic integration test petition', 100);
CREATE TABLE eqemu_goqa.discord_webhooks (id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY, webhook_name varchar(255), webhook_url varchar(2048), created_at datetime(3), deleted_at datetime(3));
SQL

docker run --rm --interactive --network "$network" \
  --env "QA_DATABASE_HOST=$database" --env CGO_ENABLED=0 --env GOTOOLCHAIN=local \
  --entrypoint sh "$image" -s <<'CONTAINER'
set -eu
# Override the repository's development fixture inside this disposable container.
cat > /app/.env.testing <<EOF
APP_ENV=testing
APP_KEY=0000000000000000000000000000000000000000000000000000000000000000
JWT_SECRET_KEY=spire-ci-only
MYSQL_SPIRE_HOST=$QA_DATABASE_HOST
MYSQL_SPIRE_PORT=3306
MYSQL_SPIRE_DATABASE=spire_goqa
MYSQL_SPIRE_USERNAME=root
MYSQL_SPIRE_PASSWORD=spire-ci-only
MYSQL_EQEMU_HOST=$QA_DATABASE_HOST
MYSQL_EQEMU_PORT=3306
MYSQL_EQEMU_DATABASE=eqemu_goqa
MYSQL_EQEMU_USERNAME=root
MYSQL_EQEMU_PASSWORD=spire-ci-only
MYSQL_QUERY_LOGGING=false
EOF
export APP_ENV=testing
export SPIRE_MIGRATE_IT_MYSQL="root:spire-ci-only@tcp($QA_DATABASE_HOST:3306)/"
export SPIRE_SUPPORT_IT_MYSQL="$SPIRE_MIGRATE_IT_MYSQL"
export SPIRE_SUPPORT_IT_EQEMU=eqemu_goqa
# Includes schema migration recovery, petition alert idempotency (mocked delivery),
# and the previously untagged real-database user/relationship integration test.
go test -count=1 -timeout=10m ./...

CONTAINER

# Exercise the final non-root image and its normal Railway entrypoint. The
# internal Docker network has no external egress and publishes no host ports.
docker run --detach --rm --name "$application" --network "$network" \
  --env APP_ENV=production \
  --env APP_KEY=0000000000000000000000000000000000000000000000000000000000000000 \
  --env JWT_SECRET_KEY=spire-ci-only \
  --env "MYSQL_SPIRE_HOST=$database" --env MYSQL_SPIRE_PORT=3306 \
  --env MYSQL_SPIRE_DATABASE=spire_goqa --env MYSQL_SPIRE_USERNAME=root --env MYSQL_SPIRE_PASSWORD=spire-ci-only \
  --env "MYSQL_EQEMU_HOST=$database" --env MYSQL_EQEMU_PORT=3306 \
  --env MYSQL_EQEMU_DATABASE=eqemu_goqa --env MYSQL_EQEMU_USERNAME=root --env MYSQL_EQEMU_PASSWORD=spire-ci-only \
  "$runtime_image" >/dev/null
if ! docker run --rm --interactive --network "$network" --env "QA_APP_HOST=$application" --entrypoint sh "$image" -s <<'SMOKE'
set -eu
url="http://$QA_APP_HOST:8080"
ready=false
for attempt in $(seq 1 60); do
  if curl --max-time 10 --fail --silent "$url/api/v1/hello-world" > /tmp/hello.json; then
    ready=true
    break
  fi
  sleep 1
done
test "$ready" = true
grep -Fx '{"message":"hello!"}' /tmp/hello.json
curl --max-time 10 --fail --silent "$url/api/v1/app/env" | grep -F '"env":"production"'
curl --max-time 10 --fail --silent --header 'Accept: text/html' "$url/" > /tmp/spire-index.html
grep -q '<html' /tmp/spire-index.html
# Invalid credentials must not be accepted (Spire's HTTP error handler uses 422).
test "$(curl --max-time 10 --silent --output /tmp/invalid-jwt.json --write-out '%{http_code}' --header 'Authorization: Bearer invalid' "$url/api/v1/me")" = 422
for attempt in $(seq 1 25); do
  curl --max-time 10 --fail --silent "$url/api/v1/hello-world" | grep -Fx '{"message":"hello!"}' >/dev/null
done
echo 'Railway database integrations and final-image HTTP smoke passed'
SMOKE
then
  docker logs "$application"
  exit 1
fi
