# Change Log

All notable changes to the "extra-cursor-caret-height" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.2.0]

- Configure the caret height from the **Settings UI** (`extraCursorCaretHeight.enabled` + `extraCursorCaretHeight.height`), in addition to the Command Palette.
- Apply/remove the patch on a single **Reload Window** (patches `workbench.desktop.main.js` and injects the style at runtime) — no full VS Code restart needed.
- **Auto-recovery**: after a VS Code update wipes the patch, the extension detects it on the next launch and offers to re-apply your height.
- Prompt for **Admin/Sudo** when the install directory needs elevated write permission (root-owned `.deb`/`.rpm`, Program Files).
- Lowered the minimum VS Code version to `1.60.0` for broader support, including forks (Cursor, Windsurf, VSCodium).

## [Unreleased]

- Initial release