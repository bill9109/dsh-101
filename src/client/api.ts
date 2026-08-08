/**
 * Browser-side API client for the dsh101 host routes.
 *
 * @module @deepseek-ai/dsh-101-app/client
 */

import type { CurationFile } from '../core/index.ts'
import type { WireDoc, WireIndex, WireSearch, WireStatus } from './contract.ts'

const BASE = '/api/dsh101'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, init)
  const body = await response.json() as T & { error?: string }
  if (!response.ok) {
    throw new Error(body.error ?? `dsh101 ${path} failed with ${response.status}`)
  }
  return body
}

/** Fetch the corpus index and curation freshness. */
export function fetchIndex(): Promise<WireIndex> {
  return request<WireIndex>('/index')
}

/** Fetch one document by stable id. */
export function fetchDoc(id: string): Promise<WireDoc> {
  return request<WireDoc>(`/doc/${encodeURIComponent(id)}`)
}

/** Run a corpus search. */
export function fetchSearch(query: string): Promise<WireSearch> {
  return request<WireSearch>(`/search?q=${encodeURIComponent(query)}`)
}

/** Report the session's current reading context (article id + optional section). */
export function setContext(sessionId: string, docId: string, section?: string): Promise<{ ok: true }> {
  return request<{ ok: true }>('/context', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, docId, ...(section !== undefined && section !== '' ? { section } : {}) }),
  })
}

/** Wire view of one translation-session binding. */
export interface TranslationBindingWire {
  sessionId: string
  locale: 'zh' | 'en'
  title: string
  updatedAt: number
}

/** Fetch all translation-session bindings (docId -> binding). */
export function fetchTranslations(): Promise<{ bindings: Record<string, TranslationBindingWire> }> {
  return request<{ bindings: Record<string, TranslationBindingWire> }>('/translations')
}

/** Bind a translation session to a document. */
export function bindTranslation(input: { docId: string; sessionId: string; locale: 'zh' | 'en'; title: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  return request<{ ok: true } | { ok: false; error: string }>('/translate/bind', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
}

/** Fetch curation status and the current job token. */
export function fetchStatus(): Promise<WireStatus> {
  return request<WireStatus>('/status')
}

/** Publish a curation overlay (job-token gated). */
export function publishCuration(token: string, curation: CurationFile): Promise<{ ok: true } | { ok: false; error: string }> {
  return request<{ ok: true } | { ok: false; error: string }>('/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, curation }),
  })
}
