import * as vscode from "vscode";
import { CaretHeightPatcher } from "../patches/CaretHeightPatcher";

export class Command {
  private patcher = new CaretHeightPatcher();

  public getCommands(): vscode.Disposable[] {
    const applyExtraHeightCommand = vscode.commands.registerCommand(
      "extra-cursor-caret-height.applyExtraHeight",
      async () => {
        const input = await vscode.window.showInputBox({
          prompt: "Enter total extra cursor height in pixels (e.g. 30)",
          placeHolder: "30",
          value: "30",
          validateInput: (value) => {
            if (!value) return "Please enter a value";
            const n = Number(value);
            if (isNaN(n) || n <= 0) return "Please enter a valid positive number";
            return null;
          },
        });

        if (!input) {
          vscode.window.showInformationMessage("Operation cancelled.");
          return;
        }

        const totalHeight = Number(input);
        await this.patcher.applyPatch(totalHeight);
      }
    );

    const resetExtraHeightCommand = vscode.commands.registerCommand(
      "extra-cursor-caret-height.resetExtraHeight",
      async () => {
        await this.patcher.revertPatch();
      }
    );

    return [applyExtraHeightCommand, resetExtraHeightCommand];
  }
}
