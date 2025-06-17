import * as vscode from "vscode";
import { Command } from "./commands/Command";
// import { CaretHeightPatcher } from "./patches/CaretHeightPatcher";

export function activate(context: vscode.ExtensionContext) {
  const command = new Command();

  const disposables = command.getCommands();
  context.subscriptions.push(...disposables);
}

export function deactivate() {
  // const patcher = new CaretHeightPatcher();
  // patcher.revertPatch();
}
