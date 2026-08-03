# Changelog

## 1.3.0 - 2026-08-03

### Added

- Stable sync IDs, deletion tombstones, conflict-aware merging, and legacy sync conversion.
- Versioned SQLite migrations and integer-satang money storage.
- IPC and sync payload validation, shared data contracts, and automated migration tests.
- Encrypted Google tokens, OAuth state validation, and stricter renderer security policy.

### Changed

- Date calculations now consistently use local calendar dates.
- Excel export is loaded on demand to reduce the initial renderer bundle.
- Category deletion preserves historical transactions without dangling references.
