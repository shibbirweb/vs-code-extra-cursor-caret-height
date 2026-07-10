import * as vscode from "vscode";
import * as os from "os";
import { CaretHeightPatcher } from "../patches/CaretHeightPatcher";
import { resolveSuggestedHeight } from "../utils/suggestedHeight";

const CONFIG_SECTION = "extraCursorCaretHeight";
const ENABLED_KEY = "enabled";
const HEIGHT_KEY = "height";
const DEFAULT_HEIGHT = 30;

export class Command {
  private patcher = new CaretHeightPatcher();
  private syncTimer?: ReturnType<typeof setTimeout>;

  private getConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(CONFIG_SECTION);
  }

  /**
   * Suggested extra caret height for the Apply prompt: about half the editor's
   * resolved line height, so the caret grows noticeably without towering over
   * the text. Mirrors VS Code's own line-height resolution
   * (`editor.lineHeight` + `editor.fontSize`): 0 => golden-ratio * fontSize,
   * values < 8 are treated as a multiplier of fontSize, otherwise px.
   */
  private computeSuggestedHeight(): number {
    const editorCfg = vscode.workspace.getConfiguration("editor");
    return resolveSuggestedHeight(
      editorCfg.get<number>("fontSize"),
      editorCfg.get<number>("lineHeight"),
      os.platform() === "darwin"
    );
  }

  /** Effective height in px when enabled, otherwise 0. */
  private getActiveHeight(): number {
    const cfg = this.getConfig();
    const enabled = cfg.get<boolean>(ENABLED_KEY, false);
    const height = cfg.get<number>(HEIGHT_KEY, DEFAULT_HEIGHT);
    return enabled && typeof height === "number" && height > 0 ? height : 0;
  }

  public getCommands(): vscode.Disposable[] {
    const applyExtraHeightCommand = vscode.commands.registerCommand(
      "extra-cursor-caret-height.applyExtraHeight",
      async () => {
        const cfg = this.getConfig();
        const suggested = this.computeSuggestedHeight();
        // Prefer the height the user has explicitly set; otherwise suggest ~half
        // the editor line height rather than the static package.json default.
        const inspected = cfg.inspect<number>(HEIGHT_KEY);
        const userSet = inspected?.globalValue ?? inspected?.workspaceValue;
        const initial =
          typeof userSet === "number" && userSet > 0 ? userSet : suggested;
        const input = await vscode.window.showInputBox({
          prompt: `Enter total extra cursor height in pixels (suggested ${suggested}, about half your editor line height)`,
          placeHolder: String(suggested),
          value: String(initial),
          validateInput: (value) => {
            if (!value) {return "Please enter a value";}
            const n = Number(value);
            if (isNaN(n) || n <= 0) {return "Please enter a valid positive number";}
            return null;
          },
        });

        if (!input) {
          vscode.window.showInformationMessage("Operation cancelled.");
          return;
        }

        // Update the settings; the debounced watcher applies the patch. Update
        // height first so it is in place when `enabled` flips on.
        await cfg.update(HEIGHT_KEY, Number(input), vscode.ConfigurationTarget.Global);
        await cfg.update(ENABLED_KEY, true, vscode.ConfigurationTarget.Global);
      }
    );

    const resetExtraHeightCommand = vscode.commands.registerCommand(
      "extra-cursor-caret-height.resetExtraHeight",
      async () => {
        await this.getConfig().update(
          ENABLED_KEY,
          false,
          vscode.ConfigurationTarget.Global
        );
      }
    );

    return [applyExtraHeightCommand, resetExtraHeightCommand];
  }

  /**
   * Apply/revert automatically when either setting changes (e.g. from the
   * Settings UI). Debounced so toggling `enabled` and `height` together runs a
   * single patch pass with one reload prompt.
   */
  public registerConfigWatcher(): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration(CONFIG_SECTION)) {
        return;
      }
      // Debounce so typing a multi-digit height in the Settings UI (which
      // commits on each change) results in a single patch + reload prompt.
      if (this.syncTimer) {
        clearTimeout(this.syncTimer);
      }
      this.syncTimer = setTimeout(() => void this.syncFromConfig(), 800);
    });
  }

  private async syncFromConfig(): Promise<void> {
    const height = this.getActiveHeight();
    if (height > 0) {
      await this.patcher.applyPatch(height);
    } else if (this.patcher.isCurrentlyPatched()) {
      await this.patcher.revertPatch();
    }
  }

  /**
   * On the very first activation after install, run the Apply flow so the user
   * can set a height right away without hunting through Settings or the Command
   * Palette. Keyed off `globalState` (install-detection only — settings remain
   * the source of truth). Fires at most once, and only on a patchable desktop
   * install (skips remote/web where the workbench script is absent).
   */
  public async promptFirstRunSetup(
    context: vscode.ExtensionContext
  ): Promise<void> {
    const FIRST_RUN_KEY = "hasRunFirstSetup";
    if (context.globalState.get<boolean>(FIRST_RUN_KEY)) {
      return;
    }
    if (!this.patcher.patchFileExists()) {
      return;
    }
    await context.globalState.update(FIRST_RUN_KEY, true);
    await vscode.commands.executeCommand(
      "extra-cursor-caret-height.applyExtraHeight"
    );
  }

  /**
   * On startup, if the patch is enabled but the workbench script is no longer
   * patched (e.g. a VS Code update overwrote it), offer to re-apply. Settings
   * live in the user's settings.json, so they survive updates.
   */
  public async checkAndPromptReapply(): Promise<void> {
    const height = this.getActiveHeight();
    if (height <= 0) {
      return;
    }

    // Only prompt when the target file exists but no longer carries the patch.
    // Skip when the file is absent (remote/web) or the patch is still present.
    if (!this.patcher.patchFileExists() || this.patcher.isCurrentlyPatched()) {
      return;
    }

    const choice = await vscode.window.showInformationMessage(
      `Extra cursor caret height patch was lost after a VS Code update. Re-apply ${height}px?`,
      "Apply",
      "Dismiss"
    );

    if (choice === "Apply") {
      await this.patcher.applyPatch(height);
    }
  }
}
