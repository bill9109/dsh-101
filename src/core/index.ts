/**
 * DSH 101 corpus model: types, validation, search, and curation merge.
 *
 * Pure library consumed by the dsh-101 profile plugins; no cordis plugin is
 * mounted from this package.
 *
 * @module @deepseek-ai/dsh-101-core
 */

export { extractSections, extractSummary, extractTitle, parseMarkdownVariant } from './markdown.ts'
export {
  CORPUS_SCHEMA_VERSION,
  CURATION_FILE_NAME,
  CURATION_HOME_DIR,
  CURATION_SCHEMA_VERSION,
  CorpusValidationError,
  mergeCuration,
  parseCorpusIndex,
  parseCurationFile,
  serializeCuration,
} from './corpus.ts'
export {
  SEARCH_EXCERPT_RADIUS,
  SEARCH_MAX_BODY_CHARS,
  SEARCH_MAX_HITS,
  buildSearchIndex,
  searchCorpus,
  tokenize,
} from './search.ts'
export type { DocIndex } from './search.ts'
export type {
  CorpusIndex,
  CorpusLocale,
  CurationFile,
  CuratedDocMeta,
  DocEntry,
  DocSection,
  DocSourceKind,
  DocVariant,
  DocumentId,
  ModuleEntry,
  ModuleId,
  SearchHit,
  SearchResult,
} from './schema.ts'
export { CORPUS_LOCALES } from './schema.ts'
