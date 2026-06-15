# NguenNguen — AGENTS.md

## Stack

- Electron + React 19 + TypeScript + Vite (electron-vite)
- Tailwind CSS v4 (ผ่าน `@tailwindcss/vite`, ไม่มี postcss.config)
- better-sqlite3 (SQLite ภายใน, เก็บใน Electron userData)
- ไม่มี state management library, ไม่มี router

## Architecture

- **3 targets ของ electron-vite**: `src/main/`, `src/preload/`, `src/renderer/`
- IPC bridge: main process `ipcMain.handle` → preload `contextBridge.exposeInWorld('api', ...)` → renderer `window.api.*`
- Entrypoints: `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/src/main.tsx`
- Path alias `@renderer/*` → `src/renderer/src/*` (ใน `electron.vite.config.ts`)

## Commands

| คำสั่ง              | ความหมาย                           |
| ------------------- | ---------------------------------- |
| `npm run dev`       | dev server พร้อม HMR               |
| `npm run lint`      | ESLint (--cache)                   |
| `npm run typecheck` | `typecheck:node && typecheck:web`  |
| `npm run build`     | `typecheck && electron-vite build` |
| `npm run build:win` | build + electron-builder --win     |
| `npm run format`    | prettier --write .                 |
| `npm run start`     | electron-vite preview              |

## Code conventions

- Prettier: single quotes, ไม่ใช้ semicolons, printWidth 100, ไม่มี trailing commas
- ESLint: `@electron-toolkit/eslint-config-ts` + prettier + react-hooks + react-refresh
- Dark mode: เพิ่ม/ลบ class `dark` ที่ `document.documentElement`
- Tailwind dark variant: ใช้ `@custom-variant dark` (ไม่ใช่ media query)
- Tab IDs ใช้ `TAB_IDS` constant จาก `src/renderer/src/types.ts` (ไม่ใช้ magic strings)
- Types หลัก: `Transaction`, `Category`, `Budget`, `FilterMode` ใน `src/renderer/src/types.ts`
- Date helpers (`filterByMode`, `getCurrentDay/Month/Year`, `getWeekStart/End`) ใน `src/renderer/src/dateUtils.ts`
- Modal wrapper component: `src/renderer/src/components/Modal.tsx`
- Transaction form component: `src/renderer/src/components/TransactionForm.tsx`
- Error boundary: `src/renderer/src/components/ErrorBoundary.tsx` (wrap ใน `main.tsx`)

## จุดสังเกต

- ไม่มี tests ในโปรเจกต์
- หมวดหมู่เริ่มต้นเป็นภาษาไทย (inserted ครั้งแรกใน `src/main/database.ts`)
- Export Excel ผ่าน `xlsx` (ปุ่มใน sidebar) — มี npm audit advisory (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9) ไม่มี fix, ระงับใน `.nsprc` เพราะใช้ export อย่างเดียว
- Auto-updater ผ่าน `electron-updater` กับ GitHub releases
- Build output: `out/` (dev build), `dist/` (packaged), ทั้งคู่ใน .gitignore
- `sandbox: false` ใน webPreferences (จำเป็นสำหรับ better-sqlite3 native module)
- OAuth redirect port fallback: เริ่มที่ 18888, ลองถัดไปถ้าซ้ำ (`findAvailablePort()` ใน `src/main/sync.ts`)
- `initDB()` wrap ใน `db.transaction()` ป้องกัน partial schema
