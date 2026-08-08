/**
 * Corpus loading, curation merging, and atomic overlay publishing.
 *
 * @module @deepseek-ai/dsh-101-core
 */

import type { CorpusIndex, CurationFile } from './schema.ts'

/** Schema version of the corpus format. */
export const CORPUS_SCHEMA_VERSION = 1

/** Schema version of the curation overlay format. */
export const CURATION_SCHEMA_VERSION = 1

/** Directory (under the dsh home) holding the curation overlay. */
export const CURATION_HOME_DIR = 'dsh-101'

/** File name of the curation overlay. */
export const CURATION_FILE_NAME = 'curation.json'

/** Validation failure carrying a human-readable reason. */
export class CorpusValidationError extends Error {
  constructor(message: string) {
    super(`dsh-101: ${message}`)
    this.name = 'CorpusValidationError'
  }
}

/** Parse and validate a corpus index from JSON text. */
export function parseCorpusIndex(text: string): CorpusIndex {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new CorpusValidationError('corpus index is not valid JSON')
  }
  if (typeof raw !== 'object' || raw === null) throw new CorpusValidationError('corpus index root must be an object')
  const index = raw as Record<string, unknown>
  if (index.schemaVersion !== CORPUS_SCHEMA_VERSION) {
    throw new CorpusValidationError(`unsupported corpus schemaVersion ${String(index.schemaVersion)} (expected ${CORPUS_SCHEMA_VERSION})`)
  }
  if (typeof index.revision !== 'string' || index.revision.length === 0) {
    throw new CorpusValidationError('corpus index missing revision')
  }
  if (typeof index.dshVersion !== 'string') throw new CorpusValidationError('corpus index missing dshVersion')
  if (typeof index.modules !== 'object' || index.modules === null || !Array.isArray(index.modules)) {
    throw new CorpusValidationError('corpus index modules must be an array')
  }
  if (typeof index.documents !== 'object' || index.documents === null || Array.isArray(index.documents)) {
    throw new CorpusValidationError('corpus index documents must be an object')
  }
  const documents = index.documents as Record<string, unknown>
  for (const [id, value] of Object.entries(documents)) {
    if (typeof value !== 'object' || value === null) throw new CorpusValidationError(`document ${id} must be an object`)
    const doc = value as Record<string, unknown>
    if (typeof doc.sourcePath !== 'string') throw new CorpusValidationError(`document ${id} missing sourcePath`)
    if (typeof doc.module !== 'string') throw new CorpusValidationError(`document ${id} missing module`)
    if (typeof doc.variants !== 'object' || doc.variants === null) {
      throw new CorpusValidationError(`document ${id} missing variants`)
    }
    const variants = doc.variants as Record<string, unknown>
    if (Object.keys(variants).length === 0) throw new CorpusValidationError(`document ${id} has no variants`)
    for (const [locale, variant] of Object.entries(variants)) {
      if (locale !== 'en' && locale !== 'zh') throw new CorpusValidationError(`document ${id} has unknown locale ${locale}`)
      if (typeof variant !== 'object' || variant === null) throw new CorpusValidationError(`document ${id} variant ${locale} must be an object`)
      const v = variant as Record<string, unknown>
      if (typeof v.title !== 'string') {
        throw new CorpusValidationError(`document ${id} variant ${locale} missing title`)
      }
      if (v.body !== undefined && typeof v.body !== 'string') {
        throw new CorpusValidationError(`document ${id} variant ${locale} body must be a string`)
      }
    }
  }
  return index as unknown as CorpusIndex
}

/** Parse and validate a curation overlay from JSON text. */
export function parseCurationFile(text: string): CurationFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new CorpusValidationError('curation overlay is not valid JSON')
  }
  if (typeof raw !== 'object' || raw === null) throw new CorpusValidationError('curation overlay must be an object')
  const file = raw as Record<string, unknown>
  if (file.schemaVersion !== CURATION_SCHEMA_VERSION) {
    throw new CorpusValidationError(`unsupported curation schemaVersion ${String(file.schemaVersion)}`)
  }
  if (typeof file.baseRevision !== 'string' || file.baseRevision.length === 0) {
    throw new CorpusValidationError('curation overlay missing baseRevision')
  }
  if (file.tool !== undefined && typeof file.tool !== 'string') {
    throw new CorpusValidationError('curation overlay tool must be a string')
  }
  return file as unknown as CurationFile
}

/** Apply a curation overlay onto a corpus, returning a new merged corpus. */
export function mergeCuration(corpus: CorpusIndex, curation: CurationFile | undefined): CorpusIndex {
  if (curation === undefined) return corpus
  const documents: CorpusIndex['documents'] = {}
  for (const [id, doc] of Object.entries(corpus.documents)) {
    const meta = curation.documents?.[id]
    documents[id] = {
      ...doc,
      module: meta?.module ?? doc.module,
      ...(meta?.module !== undefined ? { module: meta.module } : {}),
      ...(meta?.summary !== undefined ? {
        variants: mergeSummaries(doc.variants, meta.summary),
      } : {}),
    }
  }
  const modules = [...corpus.modules]
  const moduleOrder = curation.moduleOrder
  if (moduleOrder !== undefined) {
    const byId = new Map(modules.map(m => [m.id, m]))
    const ordered: typeof modules = []
    const seen = new Set<string>()
    for (const id of moduleOrder) {
      const module = byId.get(id)
      if (module === undefined) continue
      ordered.push(module)
      seen.add(id)
    }
    for (const module of modules) {
      if (!seen.has(module.id)) ordered.push(module)
    }
    modules.splice(0, modules.length, ...ordered)
  }
  for (const module of modules) {
    const meta = curation.modules?.[module.id]
    if (meta === undefined) continue
    if (meta.order !== undefined) module.order = meta.order
    if (meta.title !== undefined) module.title = { ...module.title, ...meta.title }
    if (meta.description !== undefined) module.description = { ...module.description, ...meta.description }
  }
  return { ...corpus, modules, documents }
}

function mergeSummaries(
  variants: CorpusIndex['documents'][string]['variants'],
  summaries: NonNullable<NonNullable<CurationFile['documents']>[string]>['summary'],
): CorpusIndex['documents'][string]['variants'] {
  if (summaries === undefined) return variants
  const next = { ...variants }
  for (const [locale, summary] of Object.entries(summaries)) {
    const variant = next[locale as keyof typeof next]
    if (variant === undefined || summary === undefined) continue
    next[locale as keyof typeof next] = { ...variant, summary }
  }
  return next
}

/** Serialize a curation overlay (stable key order for reproducible output). */
export function serializeCuration(curation: CurationFile): string {
  const sorted: Record<string, unknown> = {
    schemaVersion: curation.schemaVersion,
    baseRevision: curation.baseRevision,
    tool: curation.tool,
  }
  if (curation.moduleOrder !== undefined) sorted.moduleOrder = curation.moduleOrder
  if (curation.modules !== undefined) sorted.modules = curation.modules
  if (curation.documents !== undefined) sorted.documents = curation.documents
  return JSON.stringify(sorted, null, 2)
}
