/**
 * Reader root: the dsh-101 three-pane shell (module tree | article/home |
 * tutor conversation), registered into the framework's built-in `root` slot.
 *
 * Routing is hash-based (`#/`, `#/doc/<id>`, `#/doc/<id>#<anchor>`,
 * `#/search/<q>`): the SPA static fallback serves index.html for every path,
 * and hash navigation needs no server cooperation. The tutor pane renders the
 * `conversation` slot, which this entry declares (ui-layout is absent from
 * this profile). Locale and theme services arrive through the register
 * inject face — components never touch `ctx` directly.
 *
 * @module @deepseek-ai/dsh-101-app/client
 */

import { Fragment, useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import type { CorpusIndex, CorpusLocale, DocEntry } from '../core/index.ts'
import {
  IconChevronLeftOutline14,
  IconPanelLeftOutline16,
  IconSearchOutline16,
  IconTriangleRightFill14,
  MarkdownText,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import { bindTranslation, fetchDoc, fetchIndex, fetchSearch, fetchTranslations, setContext } from './api.ts'
import type { TranslationBindingWire } from './api.ts'
import type { ReaderRootProps } from './contract.ts'
import css from './ReaderRoot.module.css'

/** Services injected into the reader root by the plugin apply. */
export interface ReaderRootInjected {
  /** Locale face: active id, subscribe, set. */
  locale: {
    getSnapshot: () => string
    subscribe: (fn: () => void) => () => void
    set: (id: string) => void
  }
  /** Open a session in the conversation panel. */
  openSession: (id: string) => void
  /**
   * Subscribe to the current session's conversation snapshot. The callback
   * receives the latest snapshot (as an unknown JSON-like shape) whenever
   * the current session changes or its transcript updates.
   */
  subscribeConversation: (cb: (snapshot: unknown) => void) => () => void
  /**
   * Subscribe to the session list (display titles + recency). The callback
   * fires once synchronously with the current value, then on every change
   * (list growth or the current selection moving).
   */
  subscribeSessionList: (cb: (snapshot: SessionListSnapshot) => void) => () => void
}

/** One row of the injected session list feed. */
export interface SessionListRow {
  id: string
  /** Display title (durable title, workspace basename, or the raw id). */
  title: string
  /** Last-activity timestamp (ms). */
  updatedAt: number
  /** Whether this row is the currently selected session. */
  current: boolean
}

/** The injected session list snapshot, newest first. */
export interface SessionListSnapshot {
  rows: SessionListRow[]
}

type ReaderProps = ReaderRootProps & PropsLocale<'dsh101'> & ReaderRootInjected

type View =
  | { kind: 'home' }
  | { kind: 'doc'; id: string; anchor?: string }
  | { kind: 'search'; q: string }

const TUTOR_OPEN_KEY = 'dsh101.tutorOpen'

function parseHash(hash: string): View {
  const path = hash.replace(/^#/, '') || '/'
  if (path === '/' || path === '') return { kind: 'home' }
  const docMatch = /^\/doc\/([^/]+?)(?:#(.+))?$/.exec(path)
  if (docMatch !== null) return { kind: 'doc', id: decodeURIComponent(docMatch[1]!), ...(docMatch[2] !== undefined ? { anchor: decodeURIComponent(docMatch[2]) } : {}) }
  const searchMatch = /^\/search\/(.+)$/.exec(path)
  if (searchMatch !== null) return { kind: 'search', q: decodeURIComponent(searchMatch[1]!) }
  return { kind: 'home' }
}

function toHash(view: View): string {
  if (view.kind === 'home') return '#/'
  if (view.kind === 'doc') return `#/doc/${encodeURIComponent(view.id)}` + (view.anchor !== undefined ? `#${encodeURIComponent(view.anchor)}` : '')
  return `#/search/${encodeURIComponent(view.q)}`
}

/** The reader shell component. */
export function ReaderRoot(props: ReaderProps): ReactNode {
  const { renderSlot, t, locale, openSession, subscribeConversation, subscribeSessionList } = props
  const [index, setIndex] = useState<CorpusIndex | null>(null)
  const [curationCurrent, setCurationCurrent] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  // First load (no hash) opens the Overview module's README; hash navigation takes over afterwards.
  const [view, setView] = useState<View>(() => {
    const hash = window.location.hash
    if (hash === '' || hash === '#') return { kind: 'doc', id: 'README' }
    return parseHash(hash)
  })
  // Default to Chinese; only an explicit persisted EN preference flips it.
  const [localeId, setLocaleId] = useState<'zh' | 'en'>(() => {
    try { return localStorage.getItem('dsh.locale') === 'en' ? 'en' : 'zh' } catch { return 'zh' }
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('dsh101.sidebarCollapsed') === '1' } catch { return false }
  })
  const toggleSidebar = (): void => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('dsh101.sidebarCollapsed', next ? '1' : '0')
      return next
    })
  }
  const [tutorOpen, setTutorOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(TUTOR_OPEN_KEY) !== '0' } catch { return true }
  })
  // Tutor panel width: persisted, drag-resizable, clamped.
  const [tutorWidth, setTutorWidth] = useState<number>(() => {
    try {
      const value = Number(localStorage.getItem('dsh101.tutorWidth'))
      return Number.isFinite(value) && value >= 240 && value <= 640 ? value : 420
    } catch { return 420 }
  })
  const tutorWidthRef = useRef(tutorWidth)
  useEffect(() => { tutorWidthRef.current = tutorWidth }, [tutorWidth])
  // Expose the panel width to the global CSS: the session-list hover card
  // flips to the LEFT of the tutor panel, and its right edge must track the
  // panel's left edge (viewport width minus panel width). The card portals to
  // document.body, so the variable lives on body, not on the panel itself.
  useEffect(() => {
    document.body.style.setProperty('--dsh101-tutor-width', `${tutorWidth}px`)
  }, [tutorWidth])
  const onTutorResizeStart = (event: React.PointerEvent): void => {
    event.preventDefault()
    const startX = event.clientX
    const startW = tutorWidthRef.current
    const onMove = (ev: PointerEvent): void => {
      const next = Math.min(640, Math.max(240, startW - (ev.clientX - startX)))
      tutorWidthRef.current = next
      setTutorWidth(next)
    }
    const onUp = (): void => {
      localStorage.setItem('dsh101.tutorWidth', String(tutorWidthRef.current))
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  const [query, setQuery] = useState('')
  const [updateState, setUpdateState] = useState<'idle' | 'done'>('idle')
  const mainRef = useRef<HTMLElement | null>(null)
  useAutoHideScrollbar(mainRef)

  // Tutor pane internal view: the conversation itself, or the session list.
  const [tutorView, setTutorView] = useState<'chat' | 'list'>('chat')
  // Live session list feed (newest first), for the tutor's session list view.
  const [sessionRows, setSessionRows] = useState<SessionListRow[]>([])
  // docId -> translation-session binding; drives "adjust translation" entries.
  const [translationBindings, setTranslationBindings] = useState<Record<string, TranslationBindingWire>>({})
  const refreshTranslations = (): void => {
    void fetchTranslations().then((value) => { setTranslationBindings(value.bindings) }).catch(() => {})
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const indexResult = await fetchIndex()
        if (cancelled) return
        setIndex(indexResult.corpus)
        setCurationCurrent(indexResult.curationCurrent)
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error))
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Session list feed for the tutor's session list view.
  useEffect(() => subscribeSessionList((snapshot) => { setSessionRows(snapshot.rows) }), [])

  // Translation bindings: reopen the bound session from the article.
  useEffect(() => { refreshTranslations() }, [])

  useEffect(() => {
    const onChange = (): void => { setView(parseHash(window.location.hash)) }
    window.addEventListener('hashchange', onChange)
    return () => { window.removeEventListener('hashchange', onChange) }
  }, [])

  useEffect(() => {
    const unsubscribe = locale.subscribe(() => { setLocaleId(locale.getSnapshot() === 'en' ? 'en' : 'zh') })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track the current session so the reading context follows the tutor chat.
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined)

  // Automatic navigation + session tracking from the conversation snapshot.
  useEffect(() => {
    const handled = new Set<string>()
    return subscribeConversation((snapshot) => {
      const sid = (snapshot as { sessionId?: string } | null)?.sessionId
      if (typeof sid === 'string') setCurrentSessionId(sid)
      const target = findOpenNavigation(snapshot, handled)
      if (target !== null) {
        const rest = target.hash.slice('#/doc/'.length)
        const [id, anchor] = rest.split('#')
        if (id !== undefined && id !== '') {
          navigate({
            kind: 'doc',
            id: decodeURIComponent(id),
            ...(anchor !== undefined && anchor !== '' ? { anchor: decodeURIComponent(anchor) } : {}),
          })
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Seamless tutor context: whenever an article is open, tell the host which
  // document (and section) the user is reading for the current session, so
  // the tutor's system prompt carries it without touching the user's message.
  // A translation session stays bound to its document: its context follows
  // the bound docId, not whatever article the user happens to be reading.
  useEffect(() => {
    if (view.kind !== 'doc' || currentSessionId === undefined) return
    const boundDocId = Object.entries(translationBindings)
      .find(([, binding]) => binding.sessionId === currentSessionId)?.[0]
    void setContext(currentSessionId, boundDocId ?? view.id, boundDocId === undefined ? view.anchor : undefined).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentSessionId, translationBindings])

  // The session-list view renders the real workspace browser, whose rows open
  // sessions through its own injected `open` — the reader can't intercept the
  // click. Two complementary switches back to the conversation view:
  //   1. current-selection watch: picking a DIFFERENT session (or starting a
  //      new one) moves the selection, detected here. A separate initialized
  //      flag (not a null check on the id) distinguishes "list just opened"
  //      from "no session is current", so a null -> id move is detected.
  //   2. click delegation on the browser wrapper: clicking the CURRENT
  //      session's row changes nothing in the selection feed (it's already
  //      current), so the watch alone can't catch it — the delegated click
  //      flips back for ANY session row, including the current one.
  const lastListCurrentRef = useRef<string | null>(null)
  const listInitializedRef = useRef(false)
  useEffect(() => {
    if (tutorView !== 'list') {
      lastListCurrentRef.current = null
      listInitializedRef.current = false
      return
    }
    const current = sessionRows.find(row => row.current)?.id ?? null
    if (!listInitializedRef.current) {
      listInitializedRef.current = true
      lastListCurrentRef.current = current
      return
    }
    if (current !== lastListCurrentRef.current) setTutorView('chat')
  }, [tutorView, sessionRows])

  // Workspace browser rows are `role=treeitem`; session rows (and search
  // result rows) carry `aria-selected`, group headers only `aria-expanded`.
  // A click anywhere inside such a row means "open this session": flip back
  // to the conversation view regardless of whether the selection actually
  // moved (the current session's row is the bug case). The sidebar's New
  // Session buttons share the same aria-label in both locales — clicking one
  // with no workspace clears the selection into the New Session view (no
  // current-id change), so they must also flip back.
  const onSessionListClick = (event: React.MouseEvent): void => {
    if (tutorView !== 'list') return
    const target = event.target as HTMLElement
    const row = target.closest('[role="treeitem"][aria-selected]')
    const newSession = target.closest('[aria-label="新建会话"], [aria-label="New session"]')
    if (row !== null || newSession !== null) setTutorView('chat')
  }

  const navigate = (next: View): void => {
    const hash = toHash(next)
    if (window.location.hash === hash) setView(next)
    else window.location.hash = hash
  }

  const onSearch = (event: React.FormEvent): void => {
    event.preventDefault()
    const q = query.trim()
    if (q !== '') navigate({ kind: 'search', q })
  }

  const tutor = tutorOpen ? (
    <aside className={css.tutor} style={{ width: `${tutorWidth}px` }}>
      <div className={css.tutorResize} onPointerDown={onTutorResizeStart} aria-hidden="true" />
      <div className={css.tutorHead}>
        {tutorView === 'chat' && (
          <button
            type="button"
            className={css.tutorBack}
            onClick={() => { setTutorView('list') }}
            title={t('tutor.back')}
            aria-label={t('tutor.back')}
          >
            <IconChevronLeftOutline14 />
          </button>
        )}
        <strong>{tutorView === 'chat' ? t('tutor.title') : t('tutor.sessions')}</strong>
        <button
          type="button"
          className={css.tutorMinimize}
          onClick={() => { setTutorOpen(false); localStorage.setItem(TUTOR_OPEN_KEY, '0') }}
          title={t('tutor.close')}
          aria-label={t('tutor.close')}
        >
          {/* Window-minimize glyph (a short bottom rule), drawn inline — the
              icon set has no dedicated minimize symbol. */}
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <line x1="2" y1="9.5" x2="10" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className={css.tutorBody}>
        {tutorView === 'chat' ? (
          renderSlot('conversation', {})
        ) : (
          // The session-list view IS the main GUI's left column: ui-sidebar's
          // SidebarRoot shell (logo + New Session button + region + settings
          // foot) with ui-workspace's browser inside — all real plugins,
          // registered through the `sidebar` hole this app declares. The
          // reader is always wide (collapsed: false); the column tracks the
          // tutor panel's width. The delegated click handles the "current
          // session" row, whose selection does not move and therefore
          // escapes the watch above.
          <div className={css.tutorWorkspace} onClick={onSessionListClick}>
            {renderSlot('sidebar', { collapsed: false, width: tutorWidth })}
          </div>
        )}
      </div>
    </aside>
  ) : (
    <button type="button" className={css.tutorOpen} onClick={() => { setTutorOpen(true); localStorage.setItem(TUTOR_OPEN_KEY, '1') }}>
      {t('tutor.open')}
    </button>
  )

  return (
    <div className={sidebarCollapsed ? `${css.shell} ${css.shellCollapsed}` : css.shell}>
      <nav className={sidebarCollapsed ? `${css.tree} ${css.treeCollapsed}` : css.tree}>
        <div className={css.topRow}>
          {!sidebarCollapsed && (
            <div className={css.langSwitch} role="radiogroup" aria-label="Language">
              <span className={localeId === 'zh' ? `${css.langThumb} ${css.langThumbZh}` : css.langThumb} />
              <button
                type="button"
                role="radio"
                aria-checked={localeId === 'zh'}
                className={localeId === 'zh' ? css.langOptionActive : css.langOption}
                onClick={() => { setLocaleId('zh'); locale.set('zh') }}
              >
                中文
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={localeId === 'en'}
                className={localeId === 'en' ? css.langOptionActive : css.langOption}
                onClick={() => { setLocaleId('en'); locale.set('en') }}
              >
                EN
              </button>
            </div>
          )}
          <button
            type="button"
            className={css.sidebarToggle}
            aria-label={sidebarCollapsed ? '展开目录' : '折叠目录'}
            title={sidebarCollapsed ? '展开目录' : '折叠目录'}
            onClick={toggleSidebar}
          >
            <IconPanelLeftOutline16 size={sidebarCollapsed ? 18 : 16} />
          </button>
        </div>
        {!sidebarCollapsed && (
          <>
            <div className={css.brand}>
              <h1>{t('title')}</h1>
              <p>{t('tagline')}</p>
            </div>
            <form onSubmit={onSearch} className={css.searchForm}>
              <IconSearchOutline16 className={css.searchIcon} />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value) }}
                placeholder={t('search.placeholder')}
                aria-label={t('search.placeholder')}
              />
            </form>
            {loadError !== null && <div className={css.error}>{loadError}</div>}
            {index === null ? <div className={css.loading}>…</div> : (
              <Tree index={index} locale={localeId === 'zh' ? 'zh' : 'en'} current={view} onOpen={navigate} />
            )}
            {!curationCurrent && (
              <div className={css.updateBanner}>
                <span>{t('update.banner')}</span>
                <button
                  type="button"
                  disabled={updateState === 'done'}
                  onClick={() => {
                    void startCuratorSession(openSession).then((ok) => {
                      if (ok) setUpdateState('done')
                    })
                    setTutorOpen(true)
                  }}
                >
                  {updateState === 'done' ? t('update.done') : t('update.button')}
                </button>
              </div>
            )}
          </>
        )}
      </nav>
      <main className={css.main} ref={mainRef}>
        <MainPane
          index={index}
          locale={localeId === 'zh' ? 'zh' : 'en'}
          view={view}
          onNavigate={navigate}
          openSession={openSession}
          t={t}
          translationBindings={translationBindings}
          onOpenTranslation={(sessionId) => {
            try { openSession(sessionId) } catch { /* stale binding: ignore */ }
            setTutorView('chat')
          }}
          onTranslationBound={refreshTranslations}
        />
      </main>
      {tutor}
    </div>
  )
}

/** Module tree with per-module document lists; modules collapse like folders. */
function Tree(props: { index: CorpusIndex; locale: CorpusLocale; current: View; onOpen: (view: View) => void }): ReactNode {
  const { index, locale, current, onOpen } = props
  // Default: the Overview module stays open (it holds the landing README); all others start folded.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() =>
    new Set(index.modules.filter(m => m.id !== 'overview').map(m => m.id)))
  // Agent Notes date groups: all expanded by default; toggling a date folds
  // just that date's rows. Keys are moduleId:date to keep dates independent.
  const [collapsedDates, setCollapsedDates] = useState<ReadonlySet<string>>(() => new Set())
  const toggleDate = (key: string): void => {
    setCollapsedDates((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  const modules = index.modules
  const toggle = (id: string): void => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const listRef = useRef<HTMLDivElement | null>(null)
  useAutoHideScrollbar(listRef)
  return (
    <div className={css.treeList} ref={listRef}>
      <button type="button" className={current.kind === 'home' ? `${css.treeHome} ${css.treeHomeActive}` : css.treeHome} onClick={() => { onOpen({ kind: 'home' }) }}>
        {locale === 'zh' ? '首页' : 'Home'}
      </button>
      {modules.map((module) => {
        const isCollapsed = collapsed.has(module.id)
        const docs = Object.values(index.documents)
          .filter(doc => doc.module === module.id)
          .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id))
        const title = module.title[locale] ?? module.title.en ?? module.id
        return (
          <div key={module.id} className={css.treeModule}>
            <button
              type="button"
              className={css.treeModuleTitle}
              onClick={() => { toggle(module.id) }}
              aria-expanded={!isCollapsed}
            >
              <IconTriangleRightFill14 className={isCollapsed ? css.arrow : `${css.arrow} ${css.arrowOpen}`} />
              <span className={css.treeModuleLabel}>{title}</span>
            </button>
            {!isCollapsed && renderDocs(docs, module.id, current, onOpen, locale, collapsedDates, toggleDate)}
          </div>
        )
      })}
    </div>
  )
}

/** Render a module's document list; Agent Notes modules group rows by date (descending). */
function renderDocs(
  docs: DocEntry[],
  moduleId: string,
  current: View,
  onOpen: (view: View) => void,
  locale: CorpusLocale,
  collapsedDates: ReadonlySet<string>,
  toggleDate: (key: string) => void,
): ReactNode {
  if (docs.length === 0) return <div className={css.treeEmpty}>—</div>
  const row = (doc: DocEntry): ReactNode => {
    const variant = doc.variants[locale] ?? doc.variants.en
    // Every Agent Note title repeats the "Agent Note: " prefix; the tree
    // already sits inside an Agent Notes section, so strip it for the row.
    // The article page keeps the full title.
    let label = variant?.title ?? doc.id
    // The prefix always carries a colon ("Agent Note: …"); requiring it
    // here keeps titles like "Agent Notes" intact.
    if (doc.kind === 'agent-note') label = label.replace(/^Agent Note[：:]\s*/i, '')
    const active = current.kind === 'doc' && current.id === doc.id
    return (
      <button
        key={doc.id}
        type="button"
        className={active ? `${css.treeDoc} ${css.treeDocActive}` : css.treeDoc}
        onClick={() => { onOpen({ kind: 'doc', id: doc.id }) }}
        title={doc.sourcePath}
      >
        {label}
      </button>
    )
  }
  if (!moduleId.startsWith('notes-')) return docs.map(row)
  // Section-guide files (AGENTS.md & co.) carry no proposal date: pin them
  // above the dated groups instead of hiding them inside a fallback date.
  const dated = docs.filter(doc => doc.date !== undefined)
  const undated = docs.filter(doc => doc.date === undefined).sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id))
  // Group by proposal date (filename date), newest first.
  const groups = new Map<string, DocEntry[]>()
  for (const doc of dated) {
    const bucket = groups.get(doc.date!)
    if (bucket === undefined) groups.set(doc.date!, [doc])
    else bucket.push(doc)
  }
  const dateBlocks = [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, groupDocs]) => {
      const key = `${moduleId}:${date}`
      const dateCollapsed = collapsedDates.has(key)
      return (
        <Fragment key={key}>
          <button
            type="button"
            className={css.treeDateLabel}
            onClick={() => { toggleDate(key) }}
            aria-expanded={!dateCollapsed}
          >
            <IconTriangleRightFill14 className={dateCollapsed ? css.arrow : `${css.arrow} ${css.arrowOpen}`} />
            <span>{date}</span>
          </button>
          {!dateCollapsed && groupDocs.map(row)}
        </Fragment>
      )
    })
  return [...undated.map(row), ...dateBlocks]
}

/** Central pane: home, article, or search results. */
function MainPane(props: {
  index: CorpusIndex | null
  locale: CorpusLocale
  view: View
  onNavigate: (view: View) => void
  openSession: (id: string) => void
  t: TranslateNS<'dsh101'>
  translationBindings: Record<string, TranslationBindingWire>
  onOpenTranslation: (sessionId: string) => void
  onTranslationBound: () => void
}): ReactNode {
  const { index, locale, view, onNavigate, openSession, t, translationBindings, onOpenTranslation, onTranslationBound } = props
  if (view.kind === 'search') return <SearchPane q={view.q} onOpen={onNavigate} />
  if (view.kind === 'doc') {
    if (index === null) return <div className={css.pane}>{t('article.notFound')}</div>
    const doc = index.documents[view.id]
    if (doc === undefined) return <div className={css.pane}>{t('article.notFound')}</div>
    const binding = translationBindings[view.id]
    return (
      <ArticlePane
        key={view.id}
        doc={doc}
        locale={locale}
        {...(view.anchor !== undefined ? { anchor: view.anchor } : {})}
        openSession={openSession}
        t={t}
        {...(binding !== undefined ? { translationBinding: binding } : {})}
        onOpenTranslation={onOpenTranslation}
        onTranslationBound={onTranslationBound}
      />
    )
  }
  return <HomePane index={index} locale={locale} onOpen={onNavigate} t={t} />
}

/** Home: module cards. */
function HomePane(props: { index: CorpusIndex | null; locale: CorpusLocale; onOpen: (view: View) => void; t: TranslateNS<'dsh101'> }): ReactNode {
  const { index, locale, onOpen, t } = props
  if (index === null) return <div className={`${css.pane} ${css.loading}`}>…</div>
  const modules = index.modules
  return (
    <div className={css.pane}>
      <h2>{t('home.welcome')}</h2>
      <p>{t('home.guide')}</p>
      <div className={css.homeGrid}>
        {modules.map((module) => {
          const docs = Object.values(index.documents).filter(doc => doc.module === module.id)
          const title = module.title[locale] ?? module.title.en ?? module.id
          const description = module.description[locale] ?? module.description.en ?? ''
          return (
            <button type="button" key={module.id} className={css.homeCard} onClick={() => {
              if (docs[0] !== undefined) onOpen({ kind: 'doc', id: docs[0].id })
            }}>
              <strong>{title}</strong>
              <span>{description}</span>
              <em>{docs.length} docs</em>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Article: title + markdown body + section nav. */
function ArticlePane(props: {
  doc: DocEntry
  locale: CorpusLocale
  anchor?: string
  openSession: (id: string) => void
  t: TranslateNS<'dsh101'>
  translationBinding?: TranslationBindingWire
  onOpenTranslation: (sessionId: string) => void
  onTranslationBound: () => void
}): ReactNode {
  const { doc, locale, anchor, openSession, t, translationBinding, onOpenTranslation, onTranslationBound } = props
  // The index entry carries metadata only; full bodies load from /doc on demand.
  const [full, setFull] = useState<DocEntry | null>(null)
  useEffect(() => {
    let cancelled = false
    setFull(null)
    void fetchDoc(doc.id).then((result) => {
      if (!cancelled) setFull(result.doc)
    }).catch(() => { /* keep metadata-only view on failure */ })
    return () => { cancelled = true }
  }, [doc.id])
  const effective = full ?? doc
  const variant = effective.variants[locale] ?? effective.variants.en ?? null
  const usedFallback = variant !== null && effective.variants[locale] === undefined
  const bodyRef = useArticleAnchor(anchor)
  if (variant === null) return <div className={css.pane}>{t('article.notFound')}</div>

  // Translation entry: a bound translation session reopens for adjustments;
  // otherwise a missing-locale article offers to start one (and binds it).
  const translateAction = translationBinding !== undefined
    ? {
      label: t('article.adjustTranslation'),
      onClick: () => { onOpenTranslation(translationBinding.sessionId) },
    }
    : usedFallback
      ? {
        label: locale === 'zh' ? '翻译为中文' : '翻译为 English',
        onClick: () => {
          void startTranslationSession(effective, locale, openSession).then((ok) => {
            if (ok) onTranslationBound()
          })
        },
      }
      : null

  return (
    <div className={css.articleLayout}>
      {/* The rail slot is always reserved (56px) so articles with and without
          a table of contents start their body at the same x position. */}
      <div className={css.tocSlot}>
        {variant.sections.length > 0 && (
          <nav className={css.tocRail} aria-label={t('article.sections')}>
            {variant.sections.map((section, index) => (
              <a
                key={section.anchor}
                href={toHash({ kind: 'doc', id: doc.id, anchor: section.anchor })}
                className={css.tocTick}
              >
                <span className={css.tickPreview}>
                  <span className={css.tickIndex}>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{section.heading}</strong>
                  <p>{stripMarkdown(section.body).slice(0, 90)}</p>
                </span>
              </a>
            ))}
          </nav>
        )}
      </div>
      <article className={css.article} ref={bodyRef}>
        <header className={css.articleHead}>
          <h2>{variant.title}</h2>
          <span className={css.articleMeta}>
            {effective.kind} · {effective.sourcePath}
            {effective.updatedAt !== undefined && (
              <>
                {' · '}
                {locale === 'zh' ? '更新于 ' : 'Updated '}
                {effective.updatedAt.slice(0, 10)}
              </>
            )}
          </span>
          {usedFallback && (
            <>
              <span className={css.fallback}>{t('article.fallbackLocale')}</span>
            </>
          )}
          {translateAction !== null && (
            <button type="button" className={css.translateBtn} onClick={translateAction.onClick}>
              {translateAction.label}
            </button>
          )}
        </header>
        <div className={css.articleBody}>
          {full === null
            ? <div className={css.loading}>…</div>
            : <MarkdownText text={htmlToMarkdown(variant.body ?? '', doc.id)} />}
        </div>
      </article>
    </div>
  )
}

/** Scroll to the heading whose text matches the hash anchor. */
function useArticleAnchor(anchor: string | undefined): RefObject<HTMLElement> {
  const ref: RefObject<HTMLElement> = { current: null }
  useEffect(() => {
    if (anchor === undefined || anchor === '') return
    const root = ref.current
    if (root === null) return
    const needle = anchor.toLocaleLowerCase()
    const target = Array.from(root.querySelectorAll<HTMLElement>('h2, h3, h4')).find((heading) => {
      const text = heading.textContent?.trim().toLocaleLowerCase() ?? ''
      return text === needle || text.includes(needle)
    })
    if (target !== undefined) target.scrollIntoView({ block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor])
  return ref
}

/** Search results. */
function SearchPane(props: { q: string; onOpen: (view: View) => void }): ReactNode {
  const { q, onOpen } = props
  const [result, setResult] = useState<{ hits: { id: string; title: string; module: string; sections: { anchor: string; heading: string; excerpt: string }[]; sourcePath: string }[]; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    setResult(null)
    setError(null)
    void fetchSearch(q).then((value) => {
      if (cancelled) return
      setResult({ hits: value.result.hits, total: value.result.total })
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : String(err))
    })
    return () => { cancelled = true }
  }, [q])
  if (error !== null) return <div className={`${css.pane} ${css.error}`}>{error}</div>
  if (result === null) return <div className={`${css.pane} ${css.loading}`}>…</div>
  return (
    <div className={css.pane}>
      <h3>{q} — {result.total}</h3>
      {result.hits.map(hit => (
        <div key={hit.id} className={css.hit}>
          <button type="button" className={css.hitTitle} onClick={() => { onOpen({ kind: 'doc', id: hit.id }) }}>
            {hit.title}
          </button>
          <span className={css.hitMeta}>{hit.module} · {hit.sourcePath}</span>
          {hit.sections.map(section => (
            <button type="button" key={section.anchor} className={css.hitSection} onClick={() => {
              window.location.hash = toHash({ kind: 'doc', id: hit.id, anchor: section.anchor })
            }}>
              <strong>{section.heading}</strong>
              <span>{section.excerpt}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Session-RPC envelope over the /api bridge (same shape as the connection client). */
async function sessionRpc(method: string, payload: Record<string, unknown>): Promise<{ ok: boolean; value?: { sessionId?: string } }> {
  const response = await fetch(`/api/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: `dsh101-${Math.random().toString(36).slice(2)}`, method, payload }),
  })
  const body = await response.json() as { result?: { ok?: boolean; value?: { sessionId?: string } } }
  const result = body.result
  return { ok: result?.ok === true, ...(result?.value !== undefined ? { value: result.value } : {}) }
}

/**
 * Create the curator session: a fresh session renamed to the update title,
 * prompted with the curator trigger marker, and opened in the tutor panel.
 */
async function startCuratorSession(openSession: (id: string) => void): Promise<boolean> {
  try {
    const created = await sessionRpc('session.create', {})
    const sessionId = created.ok ? created.value?.sessionId : undefined
    if (sessionId === undefined) return false
    await sessionRpc('session.rename', { sessionId, title: 'DSH 101 更新' })
    await sessionRpc('session.prompt', {
      sessionId,
      mode: 'queue',
      content: [{
        type: 'text',
        text: '请按照 dsh-101-curator 技能检查并更新 DSH 101 的学习内容（触发标记：dsh-101-curator）。先查看语料状态，再发布新的策展覆盖层。',
      }],
    })
    try { openSession(sessionId) } catch { /* best-effort: the panel can open it later */ }
    return true
  } catch {
    return false
  }
}


/** Scan a conversation snapshot for an unhandled successful dsh101_open tool result. */
export function findOpenNavigation(snapshot: unknown, handled: Set<string>): { hash: string } | null {
  if (typeof snapshot !== 'object' || snapshot === null) return null
  const nodes = (snapshot as { nodes?: unknown }).nodes
  if (!Array.isArray(nodes)) return null
  for (const node of nodes) {
    if (typeof node !== 'object' || node === null) continue
    const entry = node as { kind?: string; seq?: number; call?: { name?: string } | null; isError?: boolean; content?: unknown }
    if (entry.kind !== 'tool-result' || entry.isError === true) continue
    const name = entry.call?.name
    if (name !== 'dsh101_open') continue
    if (entry.seq === undefined || handled.has(String(entry.seq))) continue
    const text = Array.isArray(entry.content)
      ? entry.content
        .filter((block): block is { type: string; text?: string } => typeof block === 'object' && block !== null && (block as { type?: string }).type === 'text' && typeof (block as { text?: unknown }).text === 'string')
        .map(block => block.text ?? '')
        .join('\n')
      : ''
    const match = /(#\/doc\/[^\s"']+)/.exec(text)
    if (match !== null) {
      handled.add(String(entry.seq))
      return { hash: match[1]! }
    }
  }
  return null
}

/** Rewrite a document-relative image src to the corpus image route. */
function rewriteImageSrc(src: string, docId: string): string {
  if (/^(https?:|data:)/.test(src)) return src
  const base = src.split('/').pop() ?? src
  // The markdown renderer only shows images for absolute http(s) URLs.
  return `${window.location.origin}/api/dsh101/img/${encodeURIComponent(docId)}--${encodeURIComponent(base)}`
}

/**
 * Convert the inline HTML the corpus docs occasionally use (links, images,
 * emphasis, line breaks) into markdown the reader renders, and rewrite
 * document-relative image paths to the corpus image route. Raw HTML is
 * otherwise emitted verbatim as literal text by the markdown renderer.
 */
function htmlToMarkdown(text: string, docId: string): string {
  // The bilingual switcher line ("English | [中文](...)" or the reverse) is
  // dead weight in the reader — the shell has its own language control and
  // the target paths point at the repo, not the corpus. Drop the line.
  let out = text.replace(/^\s*(?:\[?English\]?\([^)]*\)\s*\|\s*\[?中文\]?\([^)]*\)|\[?English\]?\([^)]*\)\s*\|\s*中文|English\s*\|\s*中文)\s*$/gim, '')
  // <a href="URL">label</a> -> [label](URL)
  out = out.replace(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, label: string) => `[${label.trim()}](${href})`)
  // In-document jump anchors (<a id="..."></a>) carry no href: strip the tag
  // shell so they don't leak as literal text (empty anchors vanish; ones with
  // content keep it).
  out = out.replace(/<a\s+id="[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$1')
  // <img ...> -> ![alt](src)
  out = out.replace(/<img\s+([^>]*?)\/?>\s*/gi, (_m, attrs: string) => {
    const src = /src="([^"]+)"/i.exec(attrs)?.[1] ?? ''
    const alt = /alt="([^"]+)"/i.exec(attrs)?.[1] ?? ''
    return src === '' ? '' : `![${alt}](${rewriteImageSrc(src, docId)})`
  })
  // markdown images with relative paths -> corpus route
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, src: string) => `![${alt}](${rewriteImageSrc(src.trim(), docId)})`)
  // inline emphasis and code
  out = out.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
  out = out.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
  out = out.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`')
  // block/line boundaries
  out = out.replace(/<br\s*\/?>/gi, '\n')
  out = out.replace(/<\/?p[^>]*>/gi, '\n')
  return out
}

/**
 * Overlay-style scrollbar: the thumb shows while scrolling and fades out
 * `delayMs` after the last scroll event (the common ~1s convention).
 */
function useAutoHideScrollbar(ref: React.RefObject<HTMLElement | null>, delayMs = 1000): void {
  useEffect(() => {
    const el = ref.current
    if (el === null) return
    let timer: number | undefined
    const visibleClass = css.scrollbarVisible
    const show = (): void => {
      if (visibleClass !== undefined) el.classList.add(visibleClass)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => { if (visibleClass !== undefined) el.classList.remove(visibleClass) }, delayMs)
    }
    el.addEventListener('scroll', show, { passive: true })
    return () => {
      el.removeEventListener('scroll', show)
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delayMs])
}

/**
 * Start a translation session: a fresh ordinary session whose first prompt
 * asks the agent to translate the document per the corpus translation
 * rules and persist it with dsh101_save_translation (user home only). The
 * session is bound to the document (host-persisted), so a later visit can
 * reopen the same conversation to adjust the translation.
 */
async function startTranslationSession(doc: DocEntry, targetLocale: 'zh' | 'en', openSession: (id: string) => void): Promise<boolean> {
  try {
    const created = await sessionRpc('session.create', {})
    const sessionId = created.ok ? created.value?.sessionId : undefined
    if (sessionId === undefined) return false
    const variant = doc.variants.en ?? doc.variants.zh
    const sourceName = doc.variants.en !== undefined ? 'English' : 'Chinese'
    const targetName = targetLocale === 'zh' ? 'Chinese' : 'English'
    await sessionRpc('session.rename', { sessionId, title: `翻译：${variant?.title ?? doc.id}` })
    await sessionRpc('session.prompt', {
      sessionId,
      mode: 'queue',
      content: [{
        type: 'text',
        text: [
          `请把 DSH 101 文档 ${doc.id}（${variant?.title ?? doc.id}）从 ${sourceName} 翻译成 ${targetName}。`,
          '步骤：',
          `1. 用 dsh101_read 读取文档 ${doc.id}（源文）。`,
          '2. 用 dsh101_read 读取 docs--i18n--translation-prompt：这是仓库的翻译 prompt 模板，',
          '   请严格按模板要求翻译（模板占位符：{{source_lang}}=' + sourceName + '，{{target_lang}}=' + targetName + '，',
          '   {{terminology}}=docs--i18n--terminology 的术语表全文）。',
          '3. 按模板协议输出三段 XML 译文，保存时取 <final> 段的纯 markdown。',
          '4. 用 dsh101_save_translation 保存：docId=' + doc.id + ', locale=' + targetLocale + ', translation=<final> 段的完整 markdown（含标题行）。',
          '保存成功后回复"翻译已保存"。',
        ].join('\n'),
      }],
    })
    // Bind AFTER the prompt lands: the binding is what lets a later visit to
    // this article reopen this session for adjustments.
    await bindTranslation({ docId: doc.id, sessionId, locale: targetLocale, title: `翻译：${variant?.title ?? doc.id}` }).catch(() => {})
    try { openSession(sessionId) } catch { /* best-effort */ }
    return true
  } catch {
    return false
  }
}

/** Crude markdown strip for the rail preview card (codes, links, emphasis). */
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/![\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
