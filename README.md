## 📐 Extra Cursor Caret Height

Make your cursor easier to see by increasing the caret (text cursor) height in VS Code.

---

### ✨ Features

* 🔼 Adds extra height to the blinking text cursor (caret).
* 🎯 Fully customizable — choose how tall you want the cursor to be.
* ♻️ Automatically replaces previous patches if reapplied.
* 🧼 Clean uninstallation — patch is removed when the extension is deactivated.

---

### 📸 Preview

> Coming soon: Screenshots showing normal vs patched caret height.

---

### 🛠️ Usage

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2. Search for `Extra Cursor Height: Apply Height`.
3. Enter the desired height in pixels (e.g., `30`).
4. Click `Reload VS Code` when prompted.

✅ The new height will be applied after reload.

## Reset Height

To reset the height you can use the command: `Extra Cursor Height: Reset Height`

---

### 🔄 Reapplying

If you run the command again, it will:

* Remove the previous patch.
* Apply the new one.

---

### 🧹 Uninstallation/Revert

When the extension is deactivated or uninstalled, it:

* Automatically reverts the patch

---

### ⚠️ Disclaimer

This extension modifies the internal file:

```
workbench.desktop.main.css
```

> Use with caution. If VS Code updates, the patch may be lost or reset.

---

### 👤 Author

**MD. Shibbir Ahmed**
🔗 [https://shibbirweb.github.io](https://shibbirweb.github.io)
📧 [shibbirweb@gmail.com](mailto:shibbirweb@gmail.com)
🐙 [@shibbirweb on GitHub](https://github.com/shibbirweb)
