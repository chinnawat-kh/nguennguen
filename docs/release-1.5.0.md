# NguenNguen 1.5.0

- Search all transactions or select a custom date range, including previous months and years.
- Save and restore local JSON backups with validation and a recovery copy before replacement.
- Automatically preserve a SQLite snapshot before upgrading an existing database schema.
- Protect unsaved category, transaction and budget forms, and prevent dismissal while saving.
- Fix date validation, form focus and keyboard shortcuts; keep entered values after save failures.
- Clearly label the annual budget as an estimate based on the current monthly budget multiplied by 12.

Validated with 9 core/database tests and 4 real Electron UI scenarios, TypeScript, ESLint and a Windows installer build.

Backups contain private financial information and are not encrypted. Restoring changes local data only; subsequent cloud sync can merge cloud records back. Windows x64 installer and auto-update metadata are included.
