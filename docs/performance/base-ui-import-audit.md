# Base UI import audit

2026-10-09. Installed Base UI 1.8.0, Next.js 16.3.8. Local audit only.

All **22 direct imports in 18 source files**, covering **13 public Base UI entry points**, were checked against a fresh production analyzer output with **57 route graphs**. The source scan also follows the generated component bundles' Base UI dependencies.

## Categories

| Entry point | Export shape | Route graphs containing implementation | Decision |
| --- | --- | ---: | --- |
| `accordion` | Namespace | 20 | Keep public import; all five composition parts are used |
| `alert-dialog` | Namespace | 0 | Currently unused; no application bytes to remove |
| `avatar` | Namespace | 0 | Currently unused; no application bytes to remove |
| `button` | Named | 33 | Already a component-level import |
| `combobox` | Namespace | 33 | Used by category selection; retain filtering and keyboard behavior |
| `dialog` | Namespace | 33 | Used by menu, search and size-guide dialogs |
| `input` | Named | 33 | Already a component-level import |
| `merge-props` | Named | 33 | Shared utility, also reached through other components |
| `navigation-menu` | Namespace | 0 | Currently unused; no application bytes to remove |
| `preview-card` | Namespace | 0 | Currently unused; wishlist uses its lightweight tooltip |
| `separator` | Named | 0 | Currently unused; no application bytes to remove |
| `tabs` | Namespace | 0 | Currently unused; no application bytes to remove |
| `use-render` | Named | 31 | Shared polymorphic-rendering utility |

Route graphs include deferred chunks. In particular, header menu, search and category selection already use `React.lazy`. These counts do not mean every component is initially downloaded on every route, and shared modules must not be multiplied by the route count.

## What the star exports mean here

Eight entry points use `export * as … from './index.parts.mjs'`; the other five use named exports. A namespace export alone does not establish wasted application bytes. The isolated esbuild measurement does retain unused dialog parts, while inactive wrappers do not enter the application's Next bundles at all.

The installed package's export map exposes the public component entry points, not paths such as `@base-ui/react/dialog/root` or `@base-ui/react/alert-dialog/index.parts.mjs`. No private package files, package export maps, declaration files or `node_modules` files were modified.

The official [Alert Dialog](https://base-ui.com/react/components/alert-dialog) and [Navigation Menu](https://base-ui.com/react/components/navigation-menu) docs use these namespace APIs. [Base UI 1.9.0 release notes](https://base-ui.com/react/overview/releases/v1-9-0) were reviewed; they do not document a replacement import API for this issue. This audit does not upgrade the dependency.

## Measurements and rejected changes

1. Adding all 13 public subpaths to Next's documented `experimental.optimizePackageImports` produced **identical server/client byte totals in all 57 route graphs**. The analyzer also emitted Turbopack panics at `crates/next-api/src/nft.rs:50:76`, despite returning exit code 0. The trial setting was removed, and `next.config.ts` was verified byte-for-byte against its pre-trial snapshot.
2. A controlled Dialog fixture using the public API measured 68,408 bytes / 23,560 gzip. Assigning individual members to aliases measured 68,436 / 23,576; destructuring measured 68,428 / 23,580. Neither syntax reduced dependencies. No such rewrite was retained.
3. Isolated wrapper examples: Alert Dialog 102,713 bytes / 36,626 gzip; Navigation Menu 146,577 / 53,165; Combobox 202,133 / 72,162. These include wrapper dependencies such as `cn`, omit shared React/Next/CSS, and are **not incremental application or network costs**. Alert Dialog and Navigation Menu remain absent from all route graphs.

No application import changes were retained: the tested supported rewrites did not save bytes. UI, focus handling, keyboard navigation, modal behavior and styling are unchanged.

## Reproduce the review

```sh
pnpm exec next experimental-analyze --output
node scripts/performance/audit-base-ui-imports.mjs > docs/performance/base-ui-import-audit.json
```

The script checks every current Base UI importer, records its isolated size and retained Base UI modules, and matches implementations and wrappers to Next route graphs. It can also receive a saved analyzer directory as its first argument.

The full per-file results are in [base-ui-import-audit.json](./base-ui-import-audit.json). Temporary before/trial evidence is located by `/tmp/utekos-current-base-ui-audit`.

## Final verification

- A fresh analyzer run completed after removing the trial option; the inventory again covered all 57 routes and 18 importers.
- `pnpm build` passed, including TypeScript, using the original configuration.
- ESLint passed for the audit script; `git diff --check` passed.
- Source/configuration hashes matched the pre-audit snapshot. Retained additions are only this report, its JSON evidence and the reusable audit script.
- No deployment or UI change was made.
