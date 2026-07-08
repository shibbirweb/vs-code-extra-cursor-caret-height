import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { randomUUID } from "crypto";
import * as sudo from "@vscode/sudo-prompt";

export class CaretHeightPatcher {
  private static readonly SNIPPET_COMMENT_START =
    "/* shibbirweb-extra-caret-height start */";
  private static readonly SNIPPET_COMMENT_END =
    "/* shibbirweb-extra-caret-height end */";

  public async applyPatch(totalHeight: number): Promise<boolean> {
    const jsPath = this.getMainJsPath();

    if (!jsPath || !fs.existsSync(jsPath)) {
      vscode.window.showErrorMessage(
        "Cannot find workbench.desktop.main.js at: " + jsPath
      );
      return false;
    }

    let content = fs.readFileSync(jsPath, "utf8");

    if (this.isPatched(content)) {
      vscode.window.showInformationMessage(
        "Extra cursor caret height patch is already applied. Replacing with new height..."
      );
      content = this.removePatch(content);
    }

    const newSnippet = this.generateSnippet(totalHeight);
    content = content.trimEnd() + `\n${newSnippet}\n`;

    const ok = await this.saveContent(jsPath, content.trim());
    if (!ok) {
      return false;
    }

    this.promptReload(
      `Extra cursor caret height patch applied with total height ${totalHeight}px.`
    );
    return true;
  }

  public patchFileExists(): boolean {
    const jsPath = this.getMainJsPath();
    return !!jsPath && fs.existsSync(jsPath);
  }

  public isCurrentlyPatched(): boolean {
    const jsPath = this.getMainJsPath();
    if (!jsPath || !fs.existsSync(jsPath)) {
      return false;
    }
    try {
      const content = fs.readFileSync(jsPath, "utf8");
      return this.isPatched(content);
    } catch {
      return false;
    }
  }

  public async revertPatch(): Promise<void> {
    const jsPath = this.getMainJsPath();
    if (!jsPath || !fs.existsSync(jsPath)) {return;}

    let content = fs.readFileSync(jsPath, "utf8");
    content = this.removePatch(content);

    const ok = await this.saveContent(jsPath, content);
    if (!ok) {
      return;
    }

    this.promptReload("Extra cursor caret height is reset.");
  }

  /**
   * Show a success message with a "Reload Window" action. The patch lives in
   * workbench.desktop.main.js and re-runs on every window load, so reloading
   * the window is enough to apply/remove the change (no full restart needed).
   */
  private promptReload(message: string): void {
    const RELOAD = "Reload Window";
    vscode.window
      .showInformationMessage(`${message} Reload the window to see changes.`, RELOAD)
      .then((choice) => {
        if (choice === RELOAD) {
          vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      });
  }

  /**
   * Write `content` to `targetPath`. On a permission error (root-owned install
   * dirs on Linux/macOS, Program Files on Windows) offer to retry the write
   * with elevated privileges via a system admin/sudo prompt.
   *
   * Note: this cannot help read-only install locations such as Snap's
   * squashfs mount, where even root cannot write.
   */
  private async saveContent(targetPath: string, content: string): Promise<boolean> {
    try {
      fs.writeFileSync(targetPath, content, "utf8");
      return true;
    } catch (err: any) {
      const choice = await vscode.window.showErrorMessage(
        `Cannot write to VS Code workbench script (permission denied): ${err.message}`,
        "Retry with Admin/Sudo"
      );
      if (choice !== "Retry with Admin/Sudo") {
        return false;
      }
      return this.saveContentElevated(targetPath, content);
    }
  }

  private saveContentElevated(targetPath: string, content: string): Promise<boolean> {
    const tempFile = path.join(os.tmpdir(), `extra-caret-height-${randomUUID()}.js`);

    try {
      fs.writeFileSync(tempFile, content, "utf8");
    } catch (err: any) {
      vscode.window.showErrorMessage(
        "Failed to stage workbench script for elevated write: " + err.message
      );
      return Promise.resolve(false);
    }

    const isWin = os.platform() === "win32";
    const cmd = isWin
      ? `move /Y "${tempFile}" "${targetPath}"`
      : `mv -f "${tempFile}" "${targetPath}"`;

    return new Promise<boolean>((resolve) => {
      sudo.exec(cmd, { name: "Extra Cursor Caret Height" }, (error) => {
        fs.rmSync(tempFile, { force: true });
        if (error) {
          vscode.window.showErrorMessage(
            "Failed to write workbench script with elevated permissions: " + error.message
          );
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }

  /**
   * Build a self-executing JS snippet that injects a <style> for the caret
   * height into the workbench document. It runs on every window load, so a
   * window reload is enough to apply it, and removing the snippet + reload
   * removes the style.
   */
  private generateSnippet(totalHeight: number): string {
    const half = totalHeight / 2;
    const cssRules =
      `.monaco-editor .cursor { ` +
      `padding-top: ${half}px !important; ` +
      `padding-bottom: ${half}px !important; ` +
      `margin-top: -${half}px !important; ` +
      `box-sizing: content-box !important; }`;
    const cssLiteral = JSON.stringify(cssRules);

    return `${CaretHeightPatcher.SNIPPET_COMMENT_START}
;(function () {
  try {
    var STYLE_ID = "shibbirweb-extra-caret-height-style";
    var css = ${cssLiteral};
    var inject = function () {
      if (typeof document === "undefined" || !document.head) { return false; }
      var existing = document.getElementById(STYLE_ID);
      if (existing && existing.parentNode) { existing.parentNode.removeChild(existing); }
      var style = document.createElement("style");
      style.id = STYLE_ID;
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
      return true;
    };
    if (!inject() && typeof document !== "undefined") {
      document.addEventListener("DOMContentLoaded", inject);
    }
  } catch (e) { /* noop */ }
})();
${CaretHeightPatcher.SNIPPET_COMMENT_END}`;
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

  private getMainJsPath(): string | null {
    const appRoot = vscode.env.appRoot; // e.g., /Applications/Visual Studio Code.app/Contents/Resources/app
    return path.join(appRoot, "out", "vs", "workbench", "workbench.desktop.main.js");
  }
}
