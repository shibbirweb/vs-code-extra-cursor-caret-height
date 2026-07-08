import * as vscode from "vscode";
import { Command } from "./commands/Command";
// import { CaretHeightPatcher } from "./patches/CaretHeightPatcher";

export function activate(context: vscode.ExtensionContext) {
  const command = new Command();

  context.subscriptions.push(...command.getCommands());

  // Apply/revert automatically when the height setting changes (Settings UI).
  context.subscriptions.push(command.registerConfigWatcher());

  // Detect an update that wiped the on-disk patch and offer to re-apply.
  void command.checkAndPromptReapply();
}

export function deactivate() {
  // const patcher = new CaretHeightPatcher();
  // patcher.revertPatch();
}
