# Backup and UI verification

In Settings, **Save backup** writes a versioned JSON file containing transactions,
categories, monthly budgets, sync identifiers and deletion markers. It does not
include OAuth credentials or application preferences. The file is not encrypted;
store it privately.

**Restore backup** validates the entire file (up to 50 MB), asks for confirmation,
saves a recovery JSON file under the application's `userData/backups` directory,
and replaces the three data tables in one SQLite transaction. The success message
shows the recovery file's path. You can restore that JSON file to undo a restore.
Cancelling or selecting an invalid file leaves the database unchanged.

Cloud data is not replaced. A later sync can merge cloud records back into the
local database. Local restore is not a cloud rollback.

Before upgrading an existing database schema, the application creates a consistent
SQLite snapshot named `before-migration-v*.sqlite` in the same backup directory.
If creating it fails, migration does not proceed. These SQLite snapshots are for
database recovery, not for the JSON import button; retain them when investigating
migration failures. Recovery files are retained until the user removes them.

## Verification

- `npm test`: core logic, backup validation and database migration regression tests.
- `npm run test:ui`: builds the application, then runs Playwright against real Electron.
- `npx playwright test`: reruns UI tests against the most recent build.

The Electron test entry point sets `userData` before loading the app. Each test
uses a new temporary directory and real SQLite; native file dialogs are stubbed
to paths in that directory. It never loads the normal user database. Temporary
databases are retained for troubleshooting. UI screenshots and failure traces
are written to the ignored `test-results` directory.

Coverage includes historical filtering, invalid dates, focus while typing,
add/edit/delete, persistence, annual estimate wording, backup/restore with
recovery copies, corrupt import rejection, pre-migration snapshots, and unsaved
form dismissal. Dialog response stubs exercise confirmation branches without
requiring a person to click native OS dialogs.

The annual budget is explicitly a projection of the current monthly budget
multiplied by 12, not a sum of historical budgets.
