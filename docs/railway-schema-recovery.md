# Railway Spire schema recovery

## Cause and repository fix

The Railway image defaults to APP_ENV=production. The automatic schema upgrade
in internal/spire/init.go is entered through local initialization, not this
production startup path. The old Railway entrypoint started http:serve directly.
The Player Support watcher then queried spire_player_support_settings every 30
seconds even when the schema had never been upgraded. The model is already in
the registered Spire migrations; manually creating only that table can leave
other Player Support tables or columns missing.

The Railway entrypoint supports an explicit SPIRE_MIGRATE_ON_START=1 opt-in.
When enabled it runs /app/spire spire:migrate (without --drop) before http:serve.
Unset, empty or 0 preserves existing startup and performs no migration. Other
values are rejected. Merging this change does not repair an existing production
schema or authorize enabling migration. A nonzero migration exit stops startup, making the failed deployment
visible rather than serving a partial schema. Existing local startup is unchanged.
The migrator can update existing columns and indexes; it is not a substitute for
a backup or a migration review. A failure may leave some migrations applied.

## Production recovery checklist (requires deployment/database approval)

1. Confirm the production service, deployed commit, Spire DB target and credentials
   refer to the intended Spire-owned schema. Do not use the EQEmu schema by mistake.
2. Take and verify a recoverable database backup. Inspect existing Spire tables,
   settings, indexes and current user grants. Investigate an unexpectedly missing
   table rather than assuming it never existed. Recover prior settings from backup
   if necessary; do not reset a previous alert cursor or webhook selection.
3. Prefer a maintenance window. Run the deployed binary's non-drop migration once:
   /app/spire spire:migrate. Do not pass --drop. Capture its exit status and review
   every reported table error. A failure is not transactional: inspect partial
   progress before retrying. Do not blindly widen database permissions.
4. Verify the expected tables and columns against the registered model list.
   Confirm the settings table is readable and existing values were preserved.
   A fresh, empty settings table keeps Discord alerts disabled. Do not manufacture
   a webhook ID or replay old petitions just to eliminate an error.
5. Observe at least two 30-second watcher cycles for missing-table errors. Check
   Player Support reads and HTTP health. This demonstrates schema recovery, not
   Discord delivery. A real test alert requires separate authorization and a known
   destination; the regression suite uses mocked outbound delivery.
6. After container checks, schema review and backup verification, an operator can
   explicitly enable SPIRE_MIGRATE_ON_START=1 for managed startup migrations, or
   keep it unset and run the migration as a coordinated one-time/pre-deploy step.
   The opt-in runs all registered migrations on every restart; allow sufficient
   healthcheck time and avoid concurrent migration runners. Do not enable it
   automatically merely because this repository change merged.

## Rollback

Before rollout record the current deployment and verified database backup. If the
new startup gate fails, retain/restore the previous application deployment while
investigating the migration error. Application rollback does not undo schema
changes. Do not drop newly created tables as a rollback: they may contain new
user data. Restore a database backup only as an explicitly approved recovery with
writes stopped and a plan for changes since the backup. The patch does not enable
alerts, alter webhook settings, or change the alert delivery policy.

## Validation

- bash scripts/test-railway-entrypoint.sh: real entrypoint with a stub binary;
  checks default-off, explicit opt-in, migration-before-server, failure stops
  startup, invalid configuration, ports and exit codes.
- scripts/test-railway-backend.sh: isolated MySQL/MariaDB integration suite plus
  APP_ENV=production and opt-in runtime on a separate empty schema, verifies settings-table
  creation and preservation of an existing cursor on a repeated migration.
- .github/workflows/node-runtime.yml runs these checks for relevant changes.

The Docker suite uses disposable databases and no production credentials. Do not
point integration DSNs at production: existing integration tests create/drop
scratch schemas and can write synthetic webhook fixtures.
