/**
 * DSH 101 corpus and curation wire model.
 *
 * The corpus is produced by `scripts/gen-dsh-101-corpus.ts` at build time and
 * ships inside the `dsh-101` bundle package. It is the single source of
 * truth for article content; the user curation overlay
 * (`$DSH_HOME/dsh-101/curation.json`) only carries module ordering, reading
 * order, summaries, and best-practice notes — never document bodies.
 *
 * @module @deepseek-ai/dsh-101-core
 */

/** Supported corpus languages. */
export const CORPUS_LOCALES = ['en', 'zh'] as const

/** A corpus language code ('en' or 'zh'). */
export type CorpusLocale = (typeof CORPUS_LOCALES)[number]

/** Stable document id: derived from the repository-relative source path. */
export type DocumentId = string

/** A module id: kebab-case group id assigned by the generator. */
export type ModuleId = string

/** One heading-anchored section of a document body. */
export interface DocSection {
  /** Heading text without markdown markers. */
  heading: string
  /** Slug used for `#<anchor>` deep links (kebab-case, ASCII). */
  anchor: string
  /** Heading level (1-6). */
  level: number
  /** Body markdown under this heading (headings of deeper level inline). */
  body: string
}

/** One document's localized variant. */
export interface DocVariant {
  /** Title derived from the first markdown heading or the file name. */
  title: string
  /** First paragraph of the body, stripped of markdown, for list views. */
  summary: string
  /** The complete markdown body (frontmatter removed); the corpus index omits it (loaded on demand). */
  body?: string
  /** Section table derived from the body (for navigation and anchors). */
  sections: DocSection[]
}

/** Source classification of a document. */
export type DocSourceKind =
  | 'readme'
  | 'docs'
  | 'agent-note'
  | 'example'
  | 'skill'
  | 'template'
  | 'reference'
  | 'misc'

/** One document in the corpus. */
export interface DocEntry {
  /** Stable id (repo-relative path). */
  id: DocumentId
  /** Module membership (curation may override). */
  module: ModuleId
  /** Source classification. */
  kind: DocSourceKind
  /** Repository-relative source path. */
  sourcePath: string
  /** Agent-note proposal date (YYYY-MM-DD from the filename), when present. */
  date?: string
  /** In-module display order computed by the generator (grouped semantics). */
  order?: number
  /** Last-modified time of the source file (ISO), when the generator could stat it. */
  updatedAt?: string
  /** Creation time of the source file (ISO), when the generator could stat it. */
  createdAt?: string
  /** Variants present in the corpus, keyed by locale. */
  variants: Partial<Record<CorpusLocale, DocVariant>>
  /** Optional curated redirect target (id) — falls back to this doc. */
  redirectTo?: DocumentId
}

/** One module in the corpus navigation tree. */
export interface ModuleEntry {
  id: ModuleId
  /** Display name per locale. */
  title: Partial<Record<CorpusLocale, string>>
  /** Short module description per locale. */
  description: Partial<Record<CorpusLocale, string>>
  /** Display order (curation may reorder). */
  order: number
}

/** The generated corpus index. */
export interface CorpusIndex {
  /** Corpus schema version (bump on incompatible shape changes). */
  schemaVersion: number
  /** DSH version the corpus was generated from. */
  dshVersion: string
  /** Corpus generation revision (content hash). */
  revision: string
  /** Modules in default order. */
  modules: ModuleEntry[]
  /** Documents by stable id. */
  documents: Record<DocumentId, DocEntry>
}

/** Curated document metadata (optional per document). */
export interface CuratedDocMeta {
  /** Override reading order inside the module. */
  order?: number
  /** Override module membership. */
  module?: ModuleId
  /** Short summary override (per locale). */
  summary?: Partial<Record<CorpusLocale, string>>
  /** Recommended reading note (per locale). */
  note?: Partial<Record<CorpusLocale, string>>
  /** "Best practices" bullets (per locale). */
  bestPractices?: Partial<Record<CorpusLocale, string[]>>
  /** "Things to avoid" bullets (per locale). */
  pitfalls?: Partial<Record<CorpusLocale, string[]>>
}

/** The user curation overlay. */
export interface CurationFile {
  /** Schema version. */
  schemaVersion: number
  /** Corpus revision this overlay was authored against. */
  baseRevision: string
  /** Authoring tool ('dsh-101-curator'). */
  tool: string
  /** Module-level curation. */
  modules?: Partial<Record<ModuleId, {
    title?: Partial<Record<CorpusLocale, string>>
    description?: Partial<Record<CorpusLocale, string>>
    order?: number
  }>>
  /** Document-level curation keyed by document id. */
  documents?: Partial<Record<DocumentId, CuratedDocMeta>>
  /** Module order override: ids in desired order. */
  moduleOrder?: ModuleId[]
}

/** Search hit: one matched document with its best matching sections. */
export interface SearchHit {
  id: DocumentId
  module: ModuleId
  kind: DocSourceKind
  sourcePath: string
  locale: CorpusLocale
  title: string
  summary: string
  /** Matching section anchors (empty when only the title matched). */
  sections: { anchor: string; heading: string; excerpt: string }[]
  /** 0..1 match quality (higher is better). */
  score: number
}

/** Result of a corpus search. */
export interface SearchResult {
  query: string
  hits: SearchHit[]
  total: number
  truncated: boolean
}
