# Domain Tab Saver

A Manifest V3 Chrome extension that keeps one tab per managed app. When a link to a configured domain opens
in a new tab, the extension delivers it into the tab you already have open and closes the newcomer.

The job it does that Chrome does not: Chrome offers "switch to tab" as a suggestion to a human typing a URL.
It does nothing when Slack, an email client, a terminal or a script opens the link for you, which is where
duplicate tabs actually come from.

## How it works

A managed domain has one designated **home tab**, recorded the moment it is designated. Every later navigation
to that domain is delivered into it. There is no election between equal tabs, which is what makes it safe:

- If no home tab exists, the tab that just opened **becomes** the home. Nothing is ever closed.
- If a home tab exists, the newcomer is closed **only after** the home tab confirms the navigation. If anything
  fails, both tabs stay alive and you are where you started.
- If several links land on the same home tab in one burst, each newcomer waits its turn. They are queued in
  order and every one of them is closed as its own navigation is confirmed.

## Files

- `manifest.json` extension manifest
- `background.js` entry point only; subscribes Chrome events and pushes them onto the queue
- `routing/` the pure `decide(state, event)` brain. No `await`, no `chrome` global
- `delivery/` the serialized queue and the executor that performs actions
- `managed-apps/` which domains are managed, and how a URL matches one
- `home-tabs/` which tab is home for a scope, and how that survives worker suspension
- `chrome/` the only folder allowed to name the `chrome` global; `live.js` is real, `fake.js` drives the tests
- `options.html` / `options.js` settings page
- `popup.html` / `popup.js` quick toggle and quick add for the current tab
- `ui.css` shared styles

## Navigation rule

Start from what the feature does to a tab. If it **decides** something it is in `routing/`. If it **performs**
something it is in `delivery/`. If it is about which apps are managed or how a URL matches one, it is in
`managed-apps/`. If it is about which tab is home for a scope, it is in `home-tabs/`. If it names the `chrome`
global it is in `chrome/`. A module's test sits beside it with a `.test.js` suffix.

## Install in a Chrome profile

1. Open `chrome://extensions/`.
2. Turn on **Developer mode** in the top right.
3. Click **Load unpacked**.
4. Pick the `chrome-domain-tab-saver` folder.
5. Pin the extension so the popup is one click away.

There is no build step. The source loads unbuilt, exactly as it is tested.

Repeat these steps in every Chrome profile you use. Settings live in `chrome.storage.sync`, so profiles signed
into the same Google account share the domain list automatically.

## Configure

- Click the extension icon for the quick toggle and to add the current domain.
- Click **Open all options** for the full page.

The options page has two controls: the managed domain list, and a master enable toggle that acts as a kill
switch.

### Domain patterns

- `example.com` matches that host only.
- `*.example.com` matches `example.com` and every subdomain.

No domains are configured out of the box. Add the ones you want from the popup or the options page.

## Tests

```bash
bun test
```

The whole suite runs with no Chrome present. `chrome/fake.js` is an in-memory tab table implementing the same
contract as `chrome/live.js`, so every routing decision is tested without a browser.
