# Close Other Windows — Chrome Extension

A lightweight Chrome extension that closes all other browser windows with a single click. Built for developers and power users who end up with dozens of stray windows from opened files, docs, and tabs.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

## The Problem

When working with AI coding assistants, IDEs, or file managers, files often open in **separate browser windows** instead of tabs. After a coding session you might have 10+ stray windows cluttering your taskbar. Closing them one by one is tedious.

## The Solution

One click. All gone. Keep only the window you're working in.

## Features

- **Two closing modes:**
  - **Close Files Only** — Closes only file/document windows (`file://` URLs and code files), keeps your regular web pages open
  - **Close All Others** — Closes every other window except the current one
- **Live window list** — Shows all open windows with titles, labeled as FILE or PAGE
- **Window count badges** — See exactly how many windows will be closed before you click
- **Smart detection** — Recognizes 50+ file extensions (`.js`, `.py`, `.html`, `.json`, `.md`, etc.)
- **Clean dark UI** — Minimal, modern popup design
- **Zero permissions abuse** — Only requests `windows` and `tabs` permissions, nothing else

## Installation

### From source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `close-other-windows-extension` folder
6. Pin the extension to your toolbar for quick access

## Usage

1. Click the extension icon in the toolbar
2. Review the list of open windows
3. Choose your action:
   - Click **Close Files Only** to close just file windows
   - Click **Close All Others** to close everything else

The current window (marked with a green **KEEP** badge) is never closed.

## Supported File Types

The extension detects windows showing files with these extensions:

`.js` `.ts` `.jsx` `.tsx` `.py` `.html` `.css` `.json` `.xml` `.csv` `.md` `.yml` `.yaml` `.toml` `.ini` `.cfg` `.sh` `.bash` `.bat` `.ps1` `.rb` `.go` `.rs` `.java` `.c` `.cpp` `.h` `.cs` `.php` `.sql` `.r` `.swift` `.kt` `.scala` `.lua` `.vue` `.svelte` `.astro` `.ipynb` `.env` `.log` `.txt` and more.

All `file://` URLs are also detected regardless of extension.

## Permissions

| Permission | Why |
|---|---|
| `windows` | To list and close browser windows |
| `tabs` | To read tab titles and URLs for the window list and file detection |

No data is collected, stored, or transmitted. Everything runs locally.

## Tech Stack

- Manifest V3
- Vanilla JS (no frameworks, no build step)
- Chrome Extensions API (`chrome.windows`, `chrome.tabs`)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add my feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.
