import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export class CaretHeightPatcher {
  private static readonly SNIPPET_COMMENT_START =
    "/* shibbirweb-extra-caret-height start */";
  private static readonly SNIPPET_COMMENT_END =
    "/* shibbirweb-extra-caret-height end */";

  public async applyPatch(totalHeight: number): Promise<void> {
    const cssPath = this.getMainCssPath();

    if (!cssPath || !fs.existsSync(cssPath)) {
      vscode.window.showErrorMessage(
        "Cannot find workbench.desktop.main.css at: " + cssPath
      );
      return;
    }

    let content = fs.readFileSync(cssPath, "utf8");

    if (this.isPatched(content)) {
      vscode.window.showInformationMessage(
        "Extra cursor caret height patch is already applied. Replacing with new height..."
      );
      content = this.removePatch(content);
    }

    const newSnippet = this.generateSnippet(totalHeight);
    content = content.trimEnd() + `\n${newSnippet}\n`;

    try {
      fs.writeFileSync(cssPath, content.trim(), "utf8");
    } catch (err: any) {
      vscode.window.showErrorMessage(
        "Failed to write CSS file: " + err.message
      );
      return;
    }

    vscode.window
      .showInformationMessage(
        `Extra cursor caret height patch applied with total height ${totalHeight}px. Please exit Editor and open it again to see changes.`
      );
  }

  public revertPatch(): void {
    const cssPath = this.getMainCssPath();
    if (!cssPath || !fs.existsSync(cssPath)) {return;}

    let content = fs.readFileSync(cssPath, "utf8");
    content = this.removePatch(content);
    fs.writeFileSync(cssPath, content, "utf8");

    vscode.window
      .showInformationMessage(`Extra cursor caret height is reset. Please close editor and reopen it to see changes.`);
  }

  private generateSnippet(totalHeight: number): string {
    const half = totalHeight / 2;
    return `
${CaretHeightPatcher.SNIPPET_COMMENT_START}
.monaco-editor .cursor {
  padding-top: ${half}px !important;
  padding-bottom: ${half}px !important;
  margin-top: -${half}px !important;
  box-sizing: content-box !important;
}
${CaretHeightPatcher.SNIPPET_COMMENT_END}
`;
  }

  private removePatch(content: string): string {
    const escapedStart = CaretHeightPatcher.SNIPPET_COMMENT_START.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const escapedEnd = CaretHeightPatcher.SNIPPET_COMMENT_END.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, "g");
    return content.replace(regex, "");
  }

  private isPatched(content: string): boolean {
    return (
      content.includes(CaretHeightPatcher.SNIPPET_COMMENT_START) &&
      content.includes(CaretHeightPatcher.SNIPPET_COMMENT_END)
    );
  }

  private getMainCssPath(): string | null {
    const appRoot = vscode.env.appRoot; // e.g., /Applications/Visual Studio Code.app/Contents/Resources/app
    return path.join(appRoot, "out", "vs", "workbench", "workbench.desktop.main.css");
    const execPath = process.execPath;
    const platform = os.platform();

    if (platform === "win32") {
      return path.join(
        path.dirname(execPath),
        "resources",
        "app",
        "out",
        "vs",
        "workbench",
        "workbench.desktop.main.css"
      );
    }

    if (platform === "darwin") {
      return path.join(
        execPath,
        "..",
        "Resources",
        "app",
        "out",
        "vs",
        "workbench",
        "workbench.desktop.main.css"
      );
    }

    // Linux or others
    return path.join(
      path.dirname(execPath),
      "resources",
      "app",
      "out",
      "vs",
      "workbench",
      "workbench.desktop.main.css"
    );
  }
}
