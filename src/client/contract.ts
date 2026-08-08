/**
 * dsh-101-app client contracts: the reader root's slot declarations and the
 * injected share for the conversation panel.
 *
 * The `root` slot is the framework's built-in single-occupant root hole; this
 * package registers its reader shell there and declares `conversation` as its
 * child (the default `ui-layout` is not part of the dsh-101 profile, so the
 * declaration is exclusive to this entry). `ConvOwnerProps` is empty today.
 *
 * @module @deepseek-ai/dsh-101-app/client
 */

import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * The sidebar column shell, re-declared by dsh-101 (the default declarer
     * ui-layout is absent from this profile). ui-sidebar registers its
     * SidebarRoot into this hole; the reader's tutor session-list view
     * renders it, so the dsh-101 session list is the main GUI's left column.
     */
    'sidebar': { kind: 'single'; scope: 'root'; owner: SidebarOwnerProps }
  }
}

/** Owner share of the sidebar shell (mirrors ui-layout's SidebarOwnerProps). */
export interface SidebarOwnerProps {
  /** Wide renders the full column; rail the compact icon column. */
  collapsed: boolean
  /** Rendered column width in px (the reader passes the tutor panel width). */
  width: number
}

/** Full props of the reader root component. */
export type ReaderRootProps =
  PropsRuntime<'root'>
  & PropsRenderSlots<'conversation' | 'sidebar'>

/** Wire view of the corpus index (mirrors the host payload). */
export interface WireIndex {
  corpus: import('../core/index.ts').CorpusIndex
  curationCurrent: boolean
}

/** Wire view of a document lookup. */
export interface WireDoc {
  doc: import('../core/index.ts').DocEntry
}

/** Wire view of a search. */
export interface WireSearch {
  result: import('../core/index.ts').SearchResult
}

/** Wire view of the curation status. */
export interface WireStatus {
  corpusRevision: string
  dshVersion: string
  curation: {
    curation: import('../core/index.ts').CurationFile | null
    current: boolean
    lastError?: string
  }
  jobToken: string
}
