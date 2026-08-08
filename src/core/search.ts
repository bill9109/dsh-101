/**
 * Corpus search: bounded in-memory index over title, headings, and body
 * text, with CJK-aware tokenization and title/heading weighting.
 *
 * The index is intentionally lightweight: metadata plus bounded body text is
 * indexed at load; full document bodies are read on demand by the reader.
 *
 * @module @deepseek-ai/dsh-101-core
 */

import type {
  CorpusIndex, CorpusLocale, DocEntry, SearchHit, SearchResult,
} from './schema.ts'

/** Max search hits returned per query. */
export const SEARCH_MAX_HITS = 50

/** Max excerpt characters around a body match. */
export const SEARCH_EXCERPT_RADIUS = 60

/** Max body characters indexed per document (the head of each section body). */
export const SEARCH_MAX_BODY_CHARS = 2000

interface Segment {
  locale: CorpusLocale
  kind: 'title' | 'heading' | 'body'
  anchor?: string
  heading?: string
  text: string
}

interface DocIndex {
  entry: DocEntry
  locale: CorpusLocale
  title: string
  segments: Segment[]
}

export type { DocIndex }

/** Split a query into tokens: CJK character runs and ASCII word runs. */
export function tokenize(text: string): string[] {
  const tokens: string[] = []
  const lower = text.toLocaleLowerCase()
  const isCjk = (ch: string): boolean => /[\u3400-\u9fff\uf900-\ufaff]/.test(ch)
  const isWord = (ch: string): boolean => /[a-z0-9_]/.test(ch)
  let i = 0
  while (i < lower.length) {
    const ch = lower[i]!
    if (isCjk(ch)) {
      let j = i + 1
      while (j < lower.length && isCjk(lower[j]!)) j += 1
      tokens.push(lower.slice(i, j))
      i = j
    } else if (isWord(ch)) {
      let j = i + 1
      while (j < lower.length && isWord(lower[j]!)) j += 1
      tokens.push(lower.slice(i, j))
      i = j
    } else {
      i += 1
    }
  }
  return tokens
}

function excerpt(text: string, index: number): string {
  const start = Math.max(0, index - SEARCH_EXCERPT_RADIUS)
  const end = Math.min(text.length, index + SEARCH_EXCERPT_RADIUS)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

function findMatch(text: string, token: string): number {
  const lower = text.toLocaleLowerCase()
  let from = 0
  for (;;) {
    const at = lower.indexOf(token, from)
    if (at === -1) return -1
    // Word boundary check for ASCII tokens: the char before/after must not be
    // alphanumeric (CJK tokens never hit this path meaningfully).
    const before = at > 0 ? lower[at - 1]! : ''
    const after = at + token.length < lower.length ? lower[at + token.length]! : ''
    if (!/[a-z0-9_]/.test(before) && !/[a-z0-9_]/.test(after)) return at
    from = at + token.length
  }
}

/** Build the search index over a loaded corpus. */
export function buildSearchIndex(index: CorpusIndex): DocIndex[] {
  const docs: DocIndex[] = []
  for (const entry of Object.values(index.documents)) {
    for (const [locale, variant] of Object.entries(entry.variants) as [CorpusLocale, NonNullable<DocEntry['variants'][CorpusLocale]>][]) {
      const segments: Segment[] = []
      segments.push({ locale, kind: 'title', text: variant.title })
      if (variant.summary !== '') segments.push({ locale, kind: 'body', text: variant.summary })
      for (const section of variant.sections) {
        segments.push({ locale, kind: 'heading', anchor: section.anchor, heading: section.heading, text: section.heading })
        const bodyText = (variant.body ?? '').length > 0 ? section.body.slice(0, SEARCH_MAX_BODY_CHARS) : ''
        if (bodyText.length > 0) segments.push({ locale, kind: 'body', anchor: section.anchor, heading: section.heading, text: bodyText })
      }
      docs.push({ entry, locale, title: variant.title, segments })
    }
  }
  return docs
}

/** Search the corpus; returns hits sorted by score (title match first). */
export function searchCorpus(docs: DocIndex[], query: string, limit = SEARCH_MAX_HITS): SearchResult {
  const tokens = tokenize(query)
  const hits: SearchHit[] = []
  if (tokens.length === 0) return { query, hits, total: 0, truncated: false }
  for (const doc of docs) {
    // Title-only match path: no section excerpts.
    let titleScore = 0
    const matchedTokens = new Set<string>()
    for (const token of tokens) {
      if (findMatch(doc.title, token) !== -1) {
        titleScore += 1
        matchedTokens.add(token)
      }
    }
    // Section matches: collect per-section matched token counts.
    const sectionMatches = new Map<string, { heading: string; anchor: string; tokens: number; excerpt: string }>()
    let bodyScore = 0
    for (const segment of doc.segments) {
      if (segment.kind === 'title') continue
      let matched = 0
      let firstIndex = -1
      for (const token of tokens) {
        const at = findMatch(segment.text, token)
        if (at !== -1) {
          matched += 1
          matchedTokens.add(token)
          if (firstIndex === -1) firstIndex = at
        }
      }
      if (matched === 0) continue
      bodyScore += matched * (segment.kind === 'heading' ? 2 : 1)
      const key = segment.anchor ?? segment.heading ?? ''
      const prev = sectionMatches.get(key)
      if (prev === undefined) {
        sectionMatches.set(key, {
          heading: segment.heading ?? segment.anchor ?? '',
          anchor: segment.anchor ?? '',
          tokens: matched,
          excerpt: excerpt(segment.text, Math.max(0, firstIndex)),
        })
      } else if (matched > prev.tokens) {
        prev.tokens = matched
        prev.excerpt = excerpt(segment.text, Math.max(0, firstIndex))
      }
    }
    const totalMatched = titleScore * 2 + bodyScore
    if (totalMatched === 0) continue
    // Require at least half of the query tokens (distinct) to match somewhere.
    if (matchedTokens.size < Math.ceil(tokens.length / 2)) continue
    hits.push({
      id: doc.entry.id,
      module: doc.entry.module,
      kind: doc.entry.kind,
      sourcePath: doc.entry.sourcePath,
      locale: doc.locale,
      title: doc.title,
      summary: summaryOf(doc),
      sections: [...sectionMatches.values()]
        .sort((a, b) => b.tokens - a.tokens)
        .slice(0, 4)
        .map(({ heading, anchor, excerpt: text }) => ({ heading, anchor, excerpt: text })),
      score: totalMatched / (tokens.length * 2),
    })
  }
  hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
  const truncated = hits.length > limit
  return { query, hits: hits.slice(0, limit), total: hits.length, truncated }
}

function summaryOf(doc: DocIndex): string {
  const summary = doc.entry.variants[doc.locale]?.summary ?? ''
  return summary.length > 200 ? `${summary.slice(0, 200)}…` : summary
}
