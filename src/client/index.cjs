/**
 * dsh-split-view — browser half.
 *
 * A right-sidebar tab type that renders a full second Session:
 *   ctx.sessions.retain -> SessionProvider -> renderFactorySlot('conversation.content')
 *
 * Public-API route only: `sidebarRightTabs.register` + the
 * `sidebar.right.pane.tab` body seat. No main-column or dockkit internals.
 */

const React = require('react')
const h = React.createElement

const SPLIT_ID = 'dsh-split-view'
const SPLIT_KIND = 'split-session'

function sessionLabel(sessionId, summary) {
  const title = summary && typeof summary.title === 'string' && summary.title.trim() !== ''
    ? summary.title.trim()
    : ''
  if (title !== '') return title
  const cwd = summary && typeof summary.cwd === 'string' ? summary.cwd : ''
  const base = cwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop()
  return base ? `${base} · ${String(sessionId).slice(-8)}` : String(sessionId).slice(-12)
}

function SplitBody(props) {
  const {
    useTabInfo,
    useSessions,
    SessionProvider,
    renderFactorySlot,
    retainSplitSession,
    createSplitSession,
  } = props

  const tabInfo = useTabInfo()
  const tab = tabInfo && tabInfo.tab ? tabInfo.tab : undefined
  const params = tab && tab.navigation ? tab.navigation.params : undefined
  const paramSession = params && typeof params.sessionId === 'string' ? params.sessionId : undefined
  const sessions = useSessions(snapshot => snapshot)

  // A restored tab without an explicit target shows the picker; it must never
  // resurrect an unrelated failed Session from localStorage.
  const [selected, setSelected] = React.useState(paramSession)
  const [reference, setReference] = React.useState(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (typeof selected !== 'string' || selected.length === 0) return undefined
    if (typeof retainSplitSession !== 'function') return undefined
    const owned = retainSplitSession(selected)
    setReference(owned)
    if (owned && owned.ready && typeof owned.ready.catch === 'function') {
      owned.ready.catch((error) => console.error('[dsh-split-view] retained Session failed to open:', error))
    }
    return () => {
      setReference(null)
      owned.release()
    }
  }, [selected, retainSplitSession])

  const onCreate = () => {
    if (busy || typeof createSplitSession !== 'function') return
    setBusy(true)
    const current = selected && sessions && sessions.byId ? sessions.byId[selected] : undefined
    const cwd = current && current.cwd ? current.cwd : undefined
    Promise.resolve(createSplitSession(cwd))
      .then(id => { if (typeof id === 'string') setSelected(id) })
      .catch(error => console.error('[dsh-split-view] create failed:', error))
      .finally(() => setBusy(false))
  }

  const ids = sessions && Array.isArray(sessions.ids) ? [...sessions.ids] : []
  const byId = sessions && sessions.byId ? sessions.byId : {}
  if (selected && !ids.includes(selected)) ids.unshift(selected)
  const options = ids.map(id => h('option', { key: id, value: id }, sessionLabel(id, byId[id])))

  if (typeof SessionProvider !== 'function') {
    return h('div', { style: { padding: 12, fontSize: 12 } },
      'Split view: SessionProvider was not injected.')
  }
  if (typeof renderFactorySlot !== 'function') {
    return h('div', { style: { padding: 12, fontSize: 12 } },
      'Split view: renderFactorySlot was not injected.')
  }

  return h('div', {
    'data-split-view': selected || 'picker',
    style: { height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  },
  h('div', {
    'data-split-view-bar': '',
    style: {
      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
      borderBottom: '1px solid var(--dsw-alias-border-secondary, #333)',
      flex: '0 0 auto', minWidth: 0,
    },
  },
  h('select', {
    'data-split-view-select': '',
    value: selected || '',
    onChange: event => setSelected(event.target.value || undefined),
    style: {
      flex: 1, minWidth: 0, fontSize: 12, padding: '2px 4px',
      color: 'inherit', background: 'transparent',
      border: '1px solid var(--dsw-alias-border-secondary, #555)', borderRadius: 4,
    },
  },
  h('option', { value: '' }, '选择会话…'),
  ...options,
  ),
  h('button', {
    type: 'button', 'data-split-view-new': '', disabled: busy, onClick: onCreate,
    style: { fontSize: 12, cursor: busy ? 'default' : 'pointer', flex: '0 0 auto' },
  }, busy ? '…' : '新建'),
  ),
  h('div', {
    'data-split-view-conversation': '',
    style: {
      flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative',
      // Narrow embedded pane: keep the transcript and composer inside the column.
      '--dsh-conversation-column-width': '100%',
    },
  },
  selected === undefined
    ? h('div', { style: { padding: 12, fontSize: 12, opacity: 0.7 } },
      '从上方选择一个会话，或点“新建”。')
    : reference === null
      ? h('div', { style: { padding: 12, fontSize: 12 } }, 'Opening Session…')
      : h(SessionProvider, { session: reference },
        renderFactorySlot('conversation.content', { variant: 'embedded', phase: 'active', hero: false })),
  ))
}

function OpenSplitAction(props) {
  const { sessionId, openSplit } = props
  const [busy, setBusy] = React.useState(false)
  const onClick = () => {
    if (busy || typeof openSplit !== 'function') return
    setBusy(true)
    Promise.resolve(openSplit(sessionId))
      .catch((error) => console.error('[dsh-split-view] open failed:', error))
      .finally(() => setBusy(false))
  }
  return h('button', {
    type: 'button',
    title: '在右侧打开分屏会话',
    'aria-label': '分屏',
    'data-split-view-action': 'open',
    disabled: busy,
    onClick,
    style: {
      background: 'transparent', border: 'none', color: 'inherit',
      cursor: busy ? 'default' : 'pointer', font: 'inherit', padding: '2px 6px',
    },
  }, busy ? '…' : '分屏')
}

exports.inject = ['slots', 'sessions', 'sidebarRight', 'sidebarRightTabs']

exports.apply = function apply(ctx) {
  // Narrow pane: keep the composer opaque and stop transcript overflow from
  // painting through its fade band.
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.dshSplitView = ''
    style.textContent = [
      '[data-split-view] [data-composer-seat]{background:var(--dsw-alias-bg-base)!important;background-image:none!important;backdrop-filter:blur(10px);}',
      '[data-split-view] [data-conversation-scroll]{overflow-x:hidden!important;scrollbar-gutter:auto!important;}',
      '[data-split-view] [data-conversation-content]{max-width:100%!important;}',
    ].join('\n')
    document.head.appendChild(style)
    return () => style.remove()
  }, 'dsh-split-view: styles')

  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: SPLIT_ID,
    kind: SPLIT_KIND,
    title: () => '分屏会话',
    keepMounted: true,
    multiple: true,
  }), 'dsh-split-view: tab type')

  ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: SPLIT_ID,
    children: { 'dsh-split-view.session': { kind: 'single', scope: 'session' } },
    inject: () => ({
      retainSplitSession: (id) => ctx.sessions.retain(id, { source: 'splitView' }),
      createSplitSession: async (cwd) => ctx.sessions.create(cwd ? { cwd } : undefined),
    }),
  }, SplitBody))

  ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
    name: 'conversation.session.header.actions',
    id: 'dsh-split-view-open',
    order: 31,
    inject: () => ({
      openSplit: async (sessionId) => {
        // Replace this Session's previous split tab, so a restored failed tab
        // never blocks the fresh second Session the button promises.
        try {
          for (const tab of ctx.sidebarRight.openTabs.getSnapshot()) {
            if (tab.kind === SPLIT_KIND && tab.sessionId === sessionId) ctx.sidebarRight.close(tab.tabId)
          }
        } catch (error) {
          console.warn('[dsh-split-view] could not retire the previous split tab:', error)
        }
        const list = ctx.sessions.list.getSnapshot()
        const source = list && list.byId ? list.byId[sessionId] : undefined
        const cwd = source && source.cwd
        const childId = await ctx.sessions.create(cwd ? { cwd } : undefined)
        ctx.sidebarRight.openTab(SPLIT_KIND, {
          params: { sessionId: childId },
          preferNewPane: true,
        })
        return childId
      },
    }),
  }, OpenSplitAction))

  console.log('[dsh-split-view] client ready')
}
