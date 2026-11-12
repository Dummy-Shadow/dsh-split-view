# dsh-split-view

Right-sidebar **split view** for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH): open a second, fully interactive session beside the main conversation — without leaving the one you are in.

A pure client-side **bundle plugin** (Cordis). It registers a tab in the right sidebar and mounts an embedded `SessionProvider`, so the second conversation runs live inside the pane.

## Features

- **Session picker** — a `<select>` of recent sessions plus a "new session" button at the top of the pane.
- **Embedded conversation** — uses the `variant: 'embedded'` renderer tuned for narrow panes.
- **Opaque composer** — solid background + blur, so the input never overlaps history text.
- **One split per session** — opening a split closes prior split tabs of the same session, then creates a fresh one.
- **No stale restore** — no `localStorage` session restore, so failed sessions are not re-opened on reload.
- **Session retention** — retains the split session via `ctx.sessions.retain(id, { source: 'splitView' })`.

## Requirements

- DeepSeek Harness **0.2.2-rc.1** (web client; the Electron desktop renders the same web UI).
- Host-provided at runtime (declared under `dsh.client.inject` in `package.json`, not bundled):
  `@deepseek-ai/dsh-client-ui-conversation`, `@deepseek-ai/dsh-client-ui-sidebar-right`,
  `@deepseek-ai/dsh-api-session-controller`.

## Install

From GitHub (web profile):

```bash
dsh plugin --profile web add github:Dummy-Shadow/dsh-split-view
```

Or install from a local checkout — add it to the profile's `package.json`:

```jsonc
{
  "dependencies": {
    "dsh-split-view": "link:D:/path/to/dsh-split-view"
  },
  "dsh": {
    "profile": {
      "bundles": ["...", "dsh-split-view"]
    }
  }
}
```

then reinstall dependencies (e.g. `npx pnpm install`) and restart DSH.

The bundle ships its own `cordis.patch.yml`, which inserts the `split-view` row automatically when the bundle is loaded — no manual patch edit is required. Once running, a **分屏 / Split** action appears in the conversation header and opens the right-sidebar tab.

> The `desktop` profile is managed exclusively by the Electron app (`dsh` CLI refuses it), so install there through the app's plugin UI rather than `dsh plugin --profile desktop`.

## Build

```bash
node build.mjs      # or: npm run build
```

Outputs:

- `lib/client.js` — browser half (sidebar tab + embedded session).
- `lib/index.js` — node half (session-retain helper).

Host packages (`react`, `react-dom`, `@deepseek-ai/cordis`, and the DSH client packages listed above) are treated as externals and provided by DSH at boot.

## Layout

| Path | Role |
|---|---|
| `src/client/index.cjs` | Browser half: sidebar tab + embedded session. |
| `src/node/index.js` | Node half: session-retain helper. |
| `build.mjs` | esbuild bundler (client + node). |
| `cordis.patch.yml` | Bundle patch that inserts the `split-view` row. |

## Configuration

None — the plugin is fixed and adds a single right-sidebar tab. Enable/disable it by turning the bundle on or off in the profile.

## Status & related plugins

A small, standalone community plugin, provided as-is (`0.0.1`). For a broader sidebar experience (file tree, editor, changes, tasks, side chat), see [`dsh-better-sidebar`](https://www.npmjs.com/package/dsh-better-sidebar).

## License

MIT © 2026 Dummy-Shadow
