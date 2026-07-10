# Change Log

All notable changes to the "extra-cursor-caret-height" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.4.1] - 2026-07-11

### Changed
- Point the Open VSX link in the README straight at the extension page (`open-vsx.org/extension/shibbirweb/extra-cursor-caret-height`) so fork users land on the install page directly.

## [1.4.0] - 2026-07-11

### Added
- On the first launch after install, the **Apply Height** prompt opens automatically so you can set a caret height without hunting through Settings or the Command Palette (fires once; skipped on remote/web where the workbench script is absent).

## [1.3.0] - 2026-07-11

### Changed
- The **Apply Height** prompt now suggests about half the editor's line height (derived from `editor.fontSize`/`editor.lineHeight`) instead of a fixed `30px`, so the caret grows noticeably without towering over the text. A height you have already saved still takes precedence.
- Restructured the README so regular users see the **Preview** and **Usage** before the technical details; removed the regular-caret screenshot to avoid confusion.

## [1.2.1] - 2026-07-08

### Added
- Publish to **Open VSX** for VS Code forks (Cursor, Windsurf, VSCodium); the release pipeline now creates the publisher namespace automatically.

## [1.2.0] - 2026-07-08

### Added
- Configure the caret height from the **Settings UI** (`extraCursorCaretHeight.enabled` + `extraCursorCaretHeight.height`), in addition to the Command Palette.
- **Auto-recovery**: after a VS Code update wipes the patch, the extension detects it on the next launch and offers to re-apply your height.
- Prompt for **Admin/Sudo** when the install directory needs elevated write permission (root-owned `.deb`/`.rpm`, Program Files).

### Changed
- Apply/remove the patch on a single **Reload Window** — the patch now injects the style at runtime via `workbench.desktop.main.js`, so no full VS Code restart is needed.
- Lowered the minimum VS Code version to `1.60.0` for broader support, including forks.

## [1.1.2]

### Fixed
- Fix the stylesheet path resolution so patching works on macOS (#5).

## [1.0.0]

### Added
- Initial release: increase the editor caret (text cursor) height, with Apply and Reset commands.