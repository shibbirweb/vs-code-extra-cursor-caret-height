/**
 * Resolve a suggested extra caret height (px) ~= half the editor's line height.
 *
 * Mirrors VS Code's own line-height resolution so the suggestion tracks the
 * user's real editor metrics:
 *   - `lineHeight === 0`  => golden-ratio * fontSize (auto)
 *   - `lineHeight < 8`    => treated as a multiplier of fontSize
 *   - otherwise           => taken as pixels
 * then clamped to a minimum of 8px and rounded, matching VS Code's font info.
 *
 * `rawFontSize` / `rawLineHeight` are the raw `editor.fontSize` /
 * `editor.lineHeight` config values (possibly undefined); defaults match VS
 * Code's per-platform editor font defaults.
 */
export function resolveSuggestedHeight(
  rawFontSize: number | undefined,
  rawLineHeight: number | undefined,
  isMac: boolean
): number {
  const fontSize =
    typeof rawFontSize === "number" && rawFontSize > 0
      ? rawFontSize
      : isMac
        ? 12
        : 14;

  const GOLDEN_LINE_HEIGHT_RATIO = isMac ? 1.5 : 1.35;
  const MINIMUM_LINE_HEIGHT = 8;

  let lineHeight = rawLineHeight ?? 0;
  if (lineHeight === 0) {
    lineHeight = GOLDEN_LINE_HEIGHT_RATIO * fontSize;
  } else if (lineHeight < MINIMUM_LINE_HEIGHT) {
    lineHeight = lineHeight * fontSize;
  }
  lineHeight = Math.max(MINIMUM_LINE_HEIGHT, Math.round(lineHeight));

  return Math.max(1, Math.round(lineHeight / 2));
}
