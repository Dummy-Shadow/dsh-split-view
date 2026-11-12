window.__ModuleLoader__.load({
  id: "dsh-split-view",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;


// src/client/index.cjs
var React = require("react");
var h = React.createElement;
var SPLIT_ID = "dsh-split-view";
var SPLIT_KIND = "split-session";
function sessionLabel(sessionId, summary) {
  const title = summary && typeof summary.title === "string" && summary.title.trim() !== "" ? summary.title.trim() : "";
  if (title !== "") return title;
  const cwd = summary && typeof summary.cwd === "string" ? summary.cwd : "";
  const base = cwd.replace(/[\\/]+$/, "").split(/[\\/]/).pop();
  return base ? `${base} \xB7 ${String(sessionId).slice(-8)}` : String(sessionId).slice(-12);
}
function SplitBody(props) {
  const {
    useTabInfo,
    useSessions,
    SessionProvider,
    renderFactorySlot,
    retainSplitSession,
    createSplitSession
  } = props;
  const tabInfo = useTabInfo();
  const tab = tabInfo && tabInfo.tab ? tabInfo.tab : void 0;
  const params = tab && tab.navigation ? tab.navigation.params : void 0;
  const paramSession = params && typeof params.sessionId === "string" ? params.sessionId : void 0;
  const sessions = useSessions((snapshot) => snapshot);
  const [selected, setSelected] = React.useState(paramSession);
  const [reference, setReference] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    if (typeof selected !== "string" || selected.length === 0) return void 0;
    if (typeof retainSplitSession !== "function") return void 0;
    const owned = retainSplitSession(selected);
    setReference(owned);
    if (owned && owned.ready && typeof owned.ready.catch === "function") {
      owned.ready.catch((error) => console.error("[dsh-split-view] retained Session failed to open:", error));
    }
    return () => {
      setReference(null);
      owned.release();
    };
  }, [selected, retainSplitSession]);
  const onCreate = () => {
    if (busy || typeof createSplitSession !== "function") return;
    setBusy(true);
    const current = selected && sessions && sessions.byId ? sessions.byId[selected] : void 0;
    const cwd = current && current.cwd ? current.cwd : void 0;
    Promise.resolve(createSplitSession(cwd)).then((id) => {
      if (typeof id === "string") setSelected(id);
    }).catch((error) => console.error("[dsh-split-view] create failed:", error)).finally(() => setBusy(false));
  };
  const ids = sessions && Array.isArray(sessions.ids) ? [...sessions.ids] : [];
  const byId = sessions && sessions.byId ? sessions.byId : {};
  if (selected && !ids.includes(selected)) ids.unshift(selected);
  const options = ids.map((id) => h("option", { key: id, value: id }, sessionLabel(id, byId[id])));
  if (typeof SessionProvider !== "function") {
    return h(
      "div",
      { style: { padding: 12, fontSize: 12 } },
      "Split view: SessionProvider was not injected."
    );
  }
  if (typeof renderFactorySlot !== "function") {
    return h(
      "div",
      { style: { padding: 12, fontSize: 12 } },
      "Split view: renderFactorySlot was not injected."
    );
  }
  return h(
    "div",
    {
      "data-split-view": selected || "picker",
      style: { height: "100%", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }
    },
    h(
      "div",
      {
        "data-split-view-bar": "",
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 8px",
          borderBottom: "1px solid var(--dsw-alias-border-secondary, #333)",
          flex: "0 0 auto",
          minWidth: 0
        }
      },
      h(
        "select",
        {
          "data-split-view-select": "",
          value: selected || "",
          onChange: (event) => setSelected(event.target.value || void 0),
          style: {
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            padding: "2px 4px",
            color: "inherit",
            background: "transparent",
            border: "1px solid var(--dsw-alias-border-secondary, #555)",
            borderRadius: 4
          }
        },
        h("option", { value: "" }, "\u9009\u62E9\u4F1A\u8BDD\u2026"),
        ...options
      ),
      h("button", {
        type: "button",
        "data-split-view-new": "",
        disabled: busy,
        onClick: onCreate,
        style: { fontSize: 12, cursor: busy ? "default" : "pointer", flex: "0 0 auto" }
      }, busy ? "\u2026" : "\u65B0\u5EFA")
    ),
    h(
      "div",
      {
        "data-split-view-conversation": "",
        style: {
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          // Narrow embedded pane: keep the transcript and composer inside the column.
          "--dsh-conversation-column-width": "100%"
        }
      },
      selected === void 0 ? h(
        "div",
        { style: { padding: 12, fontSize: 12, opacity: 0.7 } },
        "\u4ECE\u4E0A\u65B9\u9009\u62E9\u4E00\u4E2A\u4F1A\u8BDD\uFF0C\u6216\u70B9\u201C\u65B0\u5EFA\u201D\u3002"
      ) : reference === null ? h("div", { style: { padding: 12, fontSize: 12 } }, "Opening Session\u2026") : h(
        SessionProvider,
        { session: reference },
        renderFactorySlot("conversation.content", { variant: "embedded", phase: "active", hero: false })
      )
    )
  );
}
function OpenSplitAction(props) {
  const { sessionId, openSplit } = props;
  const [busy, setBusy] = React.useState(false);
  const onClick = () => {
    if (busy || typeof openSplit !== "function") return;
    setBusy(true);
    Promise.resolve(openSplit(sessionId)).catch((error) => console.error("[dsh-split-view] open failed:", error)).finally(() => setBusy(false));
  };
  return h("button", {
    type: "button",
    title: "\u5728\u53F3\u4FA7\u6253\u5F00\u5206\u5C4F\u4F1A\u8BDD",
    "aria-label": "\u5206\u5C4F",
    "data-split-view-action": "open",
    disabled: busy,
    onClick,
    style: {
      background: "transparent",
      border: "none",
      color: "inherit",
      cursor: busy ? "default" : "pointer",
      font: "inherit",
      padding: "2px 6px"
    }
  }, busy ? "\u2026" : "\u5206\u5C4F");
}
exports.inject = ["slots", "sessions", "sidebarRight", "sidebarRightTabs"];
exports.apply = function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.dshSplitView = "";
    style.textContent = [
      "[data-split-view] [data-composer-seat]{background:var(--dsw-alias-bg-base)!important;background-image:none!important;backdrop-filter:blur(10px);}",
      "[data-split-view] [data-conversation-scroll]{overflow-x:hidden!important;scrollbar-gutter:auto!important;}",
      "[data-split-view] [data-conversation-content]{max-width:100%!important;}"
    ].join("\n");
    document.head.appendChild(style);
    return () => style.remove();
  }, "dsh-split-view: styles");
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: SPLIT_ID,
    kind: SPLIT_KIND,
    title: () => "\u5206\u5C4F\u4F1A\u8BDD",
    keepMounted: true,
    multiple: true
  }), "dsh-split-view: tab type");
  ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
    name: "sidebar.right.pane.tab",
    key: SPLIT_ID,
    children: { "dsh-split-view.session": { kind: "single", scope: "session" } },
    inject: () => ({
      retainSplitSession: (id) => ctx.sessions.retain(id, { source: "splitView" }),
      createSplitSession: async (cwd) => ctx.sessions.create(cwd ? { cwd } : void 0)
    })
  }, SplitBody));
  ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
    name: "conversation.session.header.actions",
    id: "dsh-split-view-open",
    order: 31,
    inject: () => ({
      openSplit: async (sessionId) => {
        try {
          for (const tab of ctx.sidebarRight.openTabs.getSnapshot()) {
            if (tab.kind === SPLIT_KIND && tab.sessionId === sessionId) ctx.sidebarRight.close(tab.tabId);
          }
        } catch (error) {
          console.warn("[dsh-split-view] could not retire the previous split tab:", error);
        }
        const list = ctx.sessions.list.getSnapshot();
        const source = list && list.byId ? list.byId[sessionId] : void 0;
        const cwd = source && source.cwd;
        const childId = await ctx.sessions.create(cwd ? { cwd } : void 0);
        ctx.sidebarRight.openTab(SPLIT_KIND, {
          params: { sessionId: childId },
          preferNewPane: true
        });
        return childId;
      }
    })
  }, OpenSplitAction));
  console.log("[dsh-split-view] client ready");
};

    return module.exports;
  }
});

