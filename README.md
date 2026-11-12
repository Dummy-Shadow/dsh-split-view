# dsh-split-view

Right-sidebar split view for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH): render a second interactive session beside the main conversation.

A pure client-side bundle plugin (Cordis). It registers a tab in the right sidebar and mounts an embedded `SessionProvider` so you can keep a second conversation open without leaving the main one.

## Features

- Session picker (`<select>`) + "new session" button at the top of the pane.
- Embedded conversation variant (`variant: 'embedded'`) tuned for narrow panes.
- Opaque composer (solid background + blur) so the input never overlaps history text.
- Opening a split closes prior split tabs of the same session, then creates a fresh session.
- No `localStorage` session restore (avoids re-opening failed sessions).
- Retains the split session via `ctx.sessions.retain(id, { source: 'splitView' })`.

## Requirements

- DSH `0.2.2-rc.1` (web profile).
- Built against `@deepseek-ai/dsh-client-ui-conversation`, `dsh-client-ui-sidebar-right`, `dsh-api-session-controller`.

## Install (from GitHub)

```bash
dsh plugin --profile web add github:<your-account>/dsh-split-view
```

Or link a local checkout into a profile's `package.json` dependencies and add `dsh-split-view` to `dsh.profile.bundles`.

## Build

```bash
node build.mjs
```

The browser half is emitted to `lib/client.js`; the node half to `lib/index.js`. The bundle patch (`cordis.patch.yml`) inserts the `split-view` row.

## Layout

- `src/client/index.cjs` — browser half (sidebar tab + embedded session).
- `src/node/index.js` — node half (session retain helper).
- `build.mjs` — bundler.
- `cordis.patch.yml` — profile patch row.

## License

MIT