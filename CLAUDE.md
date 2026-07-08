# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commit rules

- **Never** add Claude as a co-author. Do not append `Co-authored-by: Claude` (or any Claude/Anthropic trailer) or a "Generated with Claude Code" line to commit messages.
- **Never** commit directly on `master`. Create a feature branch first and commit there.

## What this is

A VS Code extension ("Extra Cursor Caret Height") that increases the editor caret (text cursor) height for visibility. It works by **patching VS Code's own bundled workbench script** (`workbench.desktop.main.js`) on disk — not through any public VS Code API. The patch is a self-executing JS snippet that injects a `<style>` for `.monaco-editor .cursor` at runtime. Because it modifies an internal file, VS Code shows a "Your installation appears to be corrupted" warning after use; that is expected and documented in the README.

> Historical note: earlier versions patched the stylesheet `workbench.desktop.main.css` directly. That was abandoned because VS Code caches the bundled CSS and a window reload never re-reads it — only a full app restart applied changes. The `.js` snippet re-runs on every window load, so a single **Reload Window** now applies/removes the patch (same technique as `shalldie/vscode-background`).

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml`).

- `pnpm run compile` — type-check + emit to `out/` (`tsc -p ./`); used for dev + tests
- `pnpm run check-types` — type-check only (`tsc --noEmit`)
- `pnpm run bundle` — esbuild-bundle `src/extension.ts` → `out/extension.js` (deps inlined, `vscode` external)
- `pnpm run watch` — compile in watch mode
- `pnpm run lint` — eslint over `src`
- `pnpm test` — runs `vscode-test` (headless VS Code). `pretest` runs compile + lint first.
- Run one test: no per-test script; filter via `.vscode-test.mjs` `files` glob or Mocha `.only` in `src/test/*.test.ts`
- `pnpm run package` — build `.vsix` (`vsce package --no-dependencies`)
- `pnpm run publish` — publish to Marketplace

### Bundling / packaging (important)

There is a **runtime dependency** (`@vscode/sudo-prompt`), but `package`/`publish` use `vsce --no-dependencies`, so `node_modules` is NOT shipped. `vscode:prepublish` therefore runs `check-types` + `bundle` (esbuild) to inline all deps into `out/extension.js`, making the vsix self-contained. Dev/tests still use plain `tsc` (unbundled `out/`, resolving deps from `node_modules`). Build output is `out/` (tsconfig `outDir`), NOT `dist`. `main` in package.json is `./out/extension.js`.

## Architecture

Three-layer flow, entry to disk:

1. [src/extension.ts](src/extension.ts) — `activate()` instantiates `Command(context)`, registers its disposables, then fires `command.checkAndPromptReapply()` (fire-and-forget). `deactivate()` is a no-op (patch persists until user runs Reset).
2. [src/commands/Command.ts](src/commands/Command.ts) — registers the two contributed commands (`applyExtraHeight`, `resetExtraHeight`), persists the applied height in `context.globalState` (key `extra-cursor-caret-height.appliedHeight`), and owns `checkAndPromptReapply()`.
3. [src/patches/CaretHeightPatcher.ts](src/patches/CaretHeightPatcher.ts) — the real work. Reads/writes `workbench.desktop.main.js` with `fs`, with an elevated-write fallback.

Command IDs/titles live in **two** places that must stay in sync: `contributes.commands` (+ `activationEvents`) in package.json, and the `registerCommand` strings in Command.ts. `activationEvents` includes `onStartupFinished` so the update-detection check runs at launch.

## Key behaviors

- **Update-recovery popup**: a VS Code update overwrites the bundled JS and silently wipes the patch. On activate, if a saved height exists in `globalState` but the file is no longer patched (`isCurrentlyPatched()` false while `patchFileExists()` true), the extension prompts "Re-apply Npx?" with an Apply button. Reset clears the saved height so the user isn't nagged after an intentional reset.
- **Reload prompt**: apply/reset/re-apply show a message with a **Reload Window** button (`workbench.action.reloadWindow`). Because the patch is JS that re-runs per window load, reload is sufficient — no full restart.
- **Elevated write**: `saveContent()` tries `fs.writeFileSync`; on a permission error it offers "Retry with Admin/Sudo" and, via `@vscode/sudo-prompt`, writes a temp file then `mv -f`/`move` into place with elevation. Helps root-owned installs (`.deb`/`.rpm`, Program Files). **Cannot** help read-only installs — notably Linux **Snap** (`/snap/code/...` squashfs), where even root cannot write; that install type is unsupported.

## Patcher mechanics (the core logic)

- Patch is a JS snippet wrapped in sentinel comments `/* shibbirweb-extra-caret-height start */` … `end */`. Idempotency, detection, and removal all key off these markers — changing either marker string breaks reset/reapply on already-patched installs.
- `generateSnippet(totalHeight)` splits height across `padding-top/bottom` (half each) + negative `margin-top` on `.monaco-editor .cursor`, emitted as a `<style>`-injecting IIFE (CSS text is `JSON.stringify`-escaped into a JS string literal).
- Apply = remove any existing snippet (regex between sentinels) then append fresh one. Reset = remove snippet only.
- `getMainJsPath()` resolves `vscode.env.appRoot + out/vs/workbench/workbench.desktop.main.js` (cross-platform; appRoot already points at the right place per OS).
- **Changes take effect on a window reload** — the snippet runs at workbench load.

## Testing on a dev machine

If your VS Code is a **Snap** install, you cannot patch it (read-only). To exercise the real flow, run a portable VS Code tarball from your home dir (writable) as an Extension Development Host:

```
~/vscode-portable/VSCode-linux-x64/bin/code --new-window \
  --user-data-dir=<somewhere> \
  --extensionDevelopmentPath=<this repo>
```

Then Apply → Reload Window (caret grows). To test the update-recovery popup, strip the snippet block from `workbench.desktop.main.js` (`sed -i '/caret-height start/,/caret-height end/d' <file>`) — do NOT run Reset (it clears globalState) — then reload the window.

## Compatibility

- `engines.vscode` is `^1.60.0` — a broad floor so it installs on older VS Code and on forks (Cursor, Windsurf, VSCodium…), which all report a `1.x` engine. `@types/vscode` is pinned to the same `1.60` so newer APIs can't be used unnoticed; if you must raise the floor, bump both together. Only ancient/stable APIs are used (`env.appRoot`, `globalState`, `showInputBox`, `showInformationMessage`, `commands`, the `onStartupFinished`/`onCommand` activation events).
- Because the engine is `< 1.74`, the `onStartupFinished` and `onCommand:*` entries in `activationEvents` are required (older VS Code does not auto-generate them from contributions) — don't remove them.
- Forks resolve their own install dir via `vscode.env.appRoot`, so path handling already works across them. Distribution to forks is via **OpenVSX** (+ sideloading the `.vsix`), not the MS Marketplace.

## Constraints

- No config settings contributed — height is per-invocation input only.
- `strict` TS is on; target ES2022 / module Node16.
