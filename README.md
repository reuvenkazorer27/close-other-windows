# Close Other Windows — Chrome Extension

<p align="center">
  <img src="assets/demo.gif" alt="Demo" width="600">
</p>

<p align="center">
  <strong>One click to close all stray browser windows.</strong><br>
  Built for students, developers, and anyone who opens too many files.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-green" alt="Manifest V3">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License: MIT">
</p>

---

## The Problem

When studying with AI tools like **Claude**, **ChatGPT**, or **Copilot**, course materials and code files often open in **separate browser windows** — not tabs. After a study session, you might have 10, 20, or even 30+ windows cluttering your screen.

Closing them one by one? Painful.

**This extension fixes that in one click.**

## Who Is This For?

- **Students** — uploading lecture PDFs, code files, and notes to AI models opens each file in its own window. After a study session, your taskbar is chaos.
- **Developers** — working with Claude Code, Cursor, or other AI coding tools that open file references in Chrome.
- **Researchers** — reviewing multiple papers, datasets, and references that each open separately.
- **Anyone** who ends up with too many Chrome windows and wants a fast way to clean up.

## Features

| Feature | Description |
|---|---|
| **Close Files Only** | Closes only `file://` windows — keeps your web pages open |
| **Close All Others** | Closes every window except the one you're in |
| **Undo** | Accidentally closed something? Click **Undo** to reopen all closed windows |
| **Select by Name** | Pick exactly which windows to close — with Select All / Deselect All |
| **File Type Badges** | See the file extension (PDF, PY, DOCX) as a badge next to each window |
| **Tab Count** | See how many tabs each window has before closing it |
| **URL Tooltips** | Hover any window to see its full URL |
| **Real-time Updates** | Window list updates automatically when windows open or close |
| **Keyboard Shortcut** | Open the popup with `Alt+Shift+W` (customizable in `chrome://extensions/shortcuts`) |
| **Mass Close Confirmation** | Closing 5+ windows asks for confirmation first |
| **All Window Types** | Detects normal windows, popups (e.g. Moodle/LMS file viewers), and app windows |
| **Compact UI** | Small popup that doesn't block your screen |
| **100% Offline** | No external requests. No fonts loaded. No analytics. Everything runs locally |

## Installation

### Method 1: Install from Source (3 steps)

**Step 1** — Download the extension

Click the green **Code** button at the top of this page → **Download ZIP** → extract the folder.

Or clone with git:

```bash
git clone https://github.com/reuvenkazorer27/close-other-windows.git
```

**Step 2** — Open Chrome Extensions

Open Chrome and paste this in the address bar:

```
chrome://extensions
```

Then enable **Developer mode** using the toggle in the top-right corner.

**Step 3** — Load the extension

Click **Load unpacked** → navigate to the downloaded/extracted folder → click **Select Folder**.

That's it! The extension icon appears in your toolbar.

> **Tip:** Right-click the extension icon → **Pin** to keep it visible for quick access.

### Method 2: Chrome Web Store

Coming soon.

## How to Use

1. Click the extension icon in the toolbar (or press `Alt+Shift+W`)
2. You'll see a list of all open windows, each labeled:
   - 🟢 **KEEP** — your current window (never closes)
   - 🟡 **FILE** / **PDF** / **PY** etc. — a local file opened in Chrome (shows the extension type)
   - 🟣 **PAGE** — a regular web page
3. Choose your action:
   - **Close Files** — closes only FILE windows (keeps your web pages)
   - **Close All** — closes everything except the current window
   - **Undo** — reopens all the windows you just closed
   - **Select specific windows** — expand a list with checkboxes, use Select All / Deselect All, and close exactly what you pick

> **Why select by name?** When many files are open, the Windows taskbar often truncates or hides their titles — you can't tell which is which. The extension shows the full title of every window and how many tabs it has, so you can close exactly the ones you want.

## How File Detection Works

A window is labeled as a **file** when any of its tabs are `file://` URLs — local files opened directly in Chrome. This covers PDFs, Python scripts, HTML files, and any other file your browser can display.

Windows opened by web apps like **Moodle** or other LMS platforms as popup windows are also detected, regardless of window type (normal, popup, or app).

Web URLs (like `github.com/page.html` or `moodle.ariel.ac.il/view.php`) are **not** flagged as files, even if they end in a file-like extension — only true local `file://` paths count.

## Permissions

| Permission | Why |
|---|---|
| `tabs` | Read tab titles and URLs for the window list and file detection |
| `storage` | Save closed window URLs so the Undo button can reopen them |

**No data leaves your browser.** No fonts are loaded externally. No analytics. No tracking. No server calls. Everything runs 100% locally.

## Tech Stack

- **Manifest V3** — latest Chrome extension standard
- **Vanilla JavaScript** — no frameworks, no build step, no dependencies
- **Chrome Extensions API** — `chrome.windows`, `chrome.tabs`, `chrome.storage.session`

Total size: ~15 KB. Loads instantly.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add my feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

### Ideas for Contributions

- [ ] Option to close by domain (close all `localhost` windows)
- [ ] Chrome Web Store publishing
- [ ] Incognito window support

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Stop closing windows one by one.</strong><br>
  ⭐ Star this repo if it saved you time!
</p>
