/**
 * dsh-101-app browser half: provides the minimal layout face ui-conversation
 * requires (the default ui-layout is absent from this profile), projects the
 * theme onto the document, registers the reader shell into the built-in
 * `root` slot, and declares the `conversation` child slot it renders in the
 * tutor pane.
 *
 * @module @deepseek-ai/dsh-101-app/client
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { ILayout } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { en, zh, NS, type Dsh101Key } from './locales.ts'
import type { ReaderRootInjected } from './ReaderRoot.tsx'
import { ReaderRoot } from './ReaderRoot.tsx'
import { ReaderThemePresenter } from './theme.ts'

export type { ReaderRootInjected } from './ReaderRoot.tsx'
export type { SessionListRow, SessionListSnapshot } from './ReaderRoot.tsx'
export type { ReaderRootProps as ReaderRootComponentProps } from './contract.ts'
export type { Dsh101Key } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The DSH 101 reader shell copy. */
    dsh101: Dsh101Key
  }
}

/** Dictionary namespace owned by this plugin. */
export { NS }

/** Services required by the browser half. */
export const inject = ['slots', 'locale', 'theme', 'sessions']

/** The reader root's panel face: no sidebar/details chrome in the reader, so the transitions are no-ops. */
class ReaderLayout implements ILayout {
  toggleSidebar(): void {}
  openDetails(): void {}
  closeDetails(): void {}
}

/**
 * Mount the reader shell.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  const layout = new ReaderLayout()

  ctx.effect(() => {
    const disposeService = ctx.reflect.provide('layout', layout)
    const disposeRegistration = ctx.slots.register({
      name: 'root',
      locale: NS,
      children: {
        // The tutor pane renders the existing conversation shell; declaring
        // the child here (ui-layout is absent from this profile) is what
        // authorizes ui-conversation's occupant registrations. `details` is
        // declared (not rendered) because ui-conversation's DetailsPanel
        // registers into it.
        'conversation': { kind: 'single', scope: 'session-maybe' },
        'details': { kind: 'single', scope: 'session' },
        // The tutor's session-list view reuses the REAL sidebar stack —
        // ui-sidebar's SidebarRoot shell (logo + New Session button) plus
        // ui-workspace's browser, exactly the main GUI's left column.
        // Declaring `sidebar` here (normally ui-layout's job, absent in this
        // profile) is what activates both registrations; SidebarRoot itself
        // declares the sidebar.workspaces / sidebar.settings holes.
        'sidebar': { kind: 'single', scope: 'root' },
      },
      inject: (): ReaderRootInjected => ({
        locale: {
          getSnapshot: () => ctx.locale.getLocale().active,
          subscribe: fn => ctx.locale.subscribe(fn),
          set: (id) => { ctx.locale.setLocale(id) },
        },
        openSession: (id) => { ctx.sessions.open(id as never) },
        subscribeConversation: (cb) => {
          let current: string | undefined
          let offSnapshot: (() => void) | undefined
          const sync = (): void => {
            const next = ctx.sessions.list.getSnapshot().current
            if (next === current) return
            offSnapshot?.()
            offSnapshot = undefined
            current = next
            if (next === undefined) return
            const binding = ctx.sessions.binding(next)
            if (binding === undefined) return
            offSnapshot = binding.session.subscribe(() => { cb(binding.session.getSnapshot()) })
            cb(binding.session.getSnapshot())
          }
          sync()
          const offList = ctx.sessions.list.subscribe(sync)
          return () => { offList(); offSnapshot?.() }
        },
        subscribeSessionList: (cb) => {
          const emit = (): void => {
            const state = ctx.sessions.list.getSnapshot()
            const rows: { id: string; title: string; updatedAt: number; current: boolean }[] = []
            for (const id of state.ids) {
              const row = state.byId[id]
              if (row === undefined) continue
              rows.push({
                id: String(id),
                title: row.displayTitle,
                updatedAt: row.updatedAt,
                current: state.current === id,
              })
            }
            rows.sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id))
            cb({ rows })
          }
          emit()
          return ctx.sessions.list.subscribe(emit)
        },
      }),
    }, ReaderRoot)
    return () => {
      disposeRegistration()
      void disposeService()
    }
  }, 'dsh-101-app: service + root registration')

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-101-app: dictionaries')

  ctx.effect(() => {
    const presenter = new ReaderThemePresenter()
    presenter.apply(ctx.theme.getTheme())
    const off = ctx.on('theme/change', (snapshot) => { presenter.apply(snapshot) })
    return () => {
      off()
      presenter.dispose()
    }
  }, 'dsh-101-app: theme presenter')
}
