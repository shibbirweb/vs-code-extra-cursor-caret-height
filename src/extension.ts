import * as vscode from "vscode";
import { Command } from "./commands/Command";
// import { CaretHeightPatcher } from "./patches/CaretHeightPatcher";

export function activate(context: vscode.ExtensionContext) {
  const command = new Command(context);

  const disposables = command.getCommands();
  context.subscriptions.push(...disposables);

  // Detect an update that wiped the on-disk CSS patch and offer to re-apply.
  void command.checkAndPromptReapply();
}

export function deactivate() {
  // const patcher = new CaretHeightPatcher();
  // patcher.revertPatch();
}
