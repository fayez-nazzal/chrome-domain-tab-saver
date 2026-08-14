# Domain Tab Saver

A Manifest V3 Chrome extension that keeps one tab per domain. When a page on a configured domain opens in a new tab, the extension sends it to the tab that is already open and closes the extra one.

## Files

- `manifest.json` extension manifest
- `background.js` service worker that intercepts tab creation and navigation
- `config.js` shared storage helpers and domain matching
- `options.html` / `options.js` full settings page
- `popup.html` / `popup.js` quick toggle and quick add for the current tab
- `ui.css` shared styles for the popup and the options page

## Install in a Chrome profile

1. Open `chrome://extensions/`.
2. Turn on **Developer mode** in the top right.
3. Click **Load unpacked**.
4. Pick the `chrome-domain-tab-saver` folder.
5. Pin the extension so the popup is one click away.

Repeat these steps in every Chrome profile you use.

## Configure

- Click the extension icon for the quick toggle and to add the current domain.
- Click **Open all options** for the full page.

Settings live in `chrome.storage.sync`, so profiles signed into the same Google account share them automatically.

### Domain patterns

- `example.com` matches that host only.
- `*.example.com` matches `example.com` and every subdomain.

No domains are configured out of the box. Add the ones you want from the popup or
the options page.

### Behaviour

- **Reuse existing tab and update URL** sends the open tab to the address you just asked for.
- **Focus existing tab without changing URL** leaves the open tab where it is.

### Scope

- **Global across all Chrome windows** allows one tab per domain in the whole browser.
- **Scope per window** allows one tab per domain inside each window.

## Copy the setup to other profiles

1. In the configured profile open the options page.
2. Click **Export configuration (JSON)** and keep `domain-tab-saver-config.json`.
3. Switch to the other profile and load the same unpacked folder.
4. Open the options page there and click **Import configuration (JSON)**.
5. Pick the exported file.

The import replaces the domain list and both behaviour settings.
