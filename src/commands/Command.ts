import * as vscode from "vscode";
import { CaretHeightPatcher } from "../patches/CaretHeightPatcher";

export class Command {
  private static readonly STORAGE_KEY =
    "extra-cursor-caret-height.appliedHeight";

  private patcher = new CaretHeightPatcher();

  constructor(private readonly context: vscode.ExtensionContext) {}

  public getCommands(): vscode.Disposable[] {
    const applyExtraHeightCommand = vscode.commands.registerCommand(
      "extra-cursor-caret-height.applyExtraHeight",
      async () => {
        const input = await vscode.window.showInputBox({
          prompt: "Enter total extra cursor height in pixels (e.g. 30)",
          placeHolder: "30",
          value: "30",
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

        const totalHeight = Number(input);
        const applied = await this.patcher.applyPatch(totalHeight);
        if (applied) {
          await this.context.globalState.update(
            Command.STORAGE_KEY,
            totalHeight
          );
        }
      }
    );

    const resetExtraHeightCommand = vscode.commands.registerCommand(
      "extra-cursor-caret-height.resetExtraHeight",
      async () => {
        await this.patcher.revertPatch();
        await this.context.globalState.update(Command.STORAGE_KEY, undefined);
      }
    );

    return [applyExtraHeightCommand, resetExtraHeightCommand];
  }

  public async checkAndPromptReapply(): Promise<void> {
    const saved = this.context.globalState.get<number>(Command.STORAGE_KEY);
    if (!saved || saved <= 0) {
      return;
    }

    // Only prompt when the target CSS exists but no longer carries the patch —
    // i.e. a VS Code update wiped it. Skip when the file is absent (remote/web).
    if (!this.patcher.patchFileExists() || this.patcher.isCurrentlyPatched()) {
      return;
    }

    const choice = await vscode.window.showInformationMessage(
      `Extra cursor caret height patch was lost after a VS Code update. Re-apply ${saved}px?`,
      "Apply",
      "Dismiss"
    );

    if (choice === "Apply") {
      await this.patcher.applyPatch(saved);
    }
  }
}
