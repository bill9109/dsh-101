/**
 * DSH 101 model tools: corpus search, document read, navigation intent, and
 * curator publish.
 *
 * The first three are read-only over `ctx.dsh101` and safe for any session.
 * `dsh101_publish` additionally requires the calling session to be a
 * registered curator session (its job token is bound at trigger time), so a
 * stray call outside the curator flow fails loud.
 *
 * @module @deepseek-ai/dsh-101-tutor
 */

import type { CurationFile } from '../core/index.ts'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { CuratorLedger } from './curator.ts'

/** Registry-ready tool set for the dsh101 domain. */
export function dsh101Tools(deps: {
  dsh101: import('../app/index.ts').IDsh101
  curator: CuratorLedger
}) {
  const { dsh101, curator } = deps

  const search = defineTool({
    name: 'dsh101_search',
    description: [
      'Search the DSH 101 learning corpus (the installation\'s own READMEs, docs,',
      'agent notes, examples, and generated catalogs). Returns matching',
      'documents with their stable ids, titles, and matching sections — use the',
      'ids with dsh101_read for full text, and cite the returned section',
      'anchors when answering.',
    ].join(' '),
    parameters: {
      query: { type: 'string', description: 'Search terms (CJK and English words both work).' },
      limit: { type: 'integer', description: 'Max hits (default 10, max 50).' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          hits: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                module: { type: 'string' },
                locale: { type: 'string' },
                sourcePath: { type: 'string' },
                sections: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      heading: { type: 'string' },
                      anchor: { type: 'string' },
                      excerpt: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          total: { type: 'integer' },
          truncated: { type: 'boolean' },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `${value.total ?? 0} result(s); first ${(value.hits ?? []).length} shown.`,
      }],
    },
    presentCall: args => ({ card: 'generic', title: 'Search DSH 101 corpus', kind: 'other', rawInput: args }),
    execute: async (args) => {
      const limit = Math.min(args.limit ?? 10, 50)
      const result = dsh101.search(String(args.query))
      return {
        hits: result.hits.slice(0, limit).map(hit => ({
          id: hit.id,
          title: hit.title,
          module: hit.module,
          locale: hit.locale,
          sourcePath: hit.sourcePath,
          sections: hit.sections.map(section => ({
            heading: section.heading,
            anchor: section.anchor,
            excerpt: section.excerpt,
          })),
        })),
        total: result.total,
        truncated: result.truncated,
      }
    },
  })

  const read = defineTool({
    name: 'dsh101_read',
    description: [
      'Read one DSH 101 corpus document by its stable id (from dsh101_search)',
      'and locale. Returns the full markdown body plus its section table; use',
      'the section anchors for precise citations.',
    ].join(' '),
    parameters: {
      id: { type: 'string', description: 'Stable document id.' },
      locale: { type: 'string', description: "'en' or 'zh'; defaults to the doc's available variant." },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          locale: { type: 'string' },
          sourcePath: { type: 'string' },
          summary: { type: 'string' },
          body: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: { heading: { type: 'string' }, anchor: { type: 'string' } },
            },
          },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Read ${value.id ?? ''} (${value.title ?? ''}, ${(value.body ?? '').length} chars).`,
      }],
    },
    presentCall: args => ({ card: 'generic', title: 'Read DSH 101 document', kind: 'other', rawInput: args }),
    execute: async (args) => {
      const id = String(args.id)
      const doc = await dsh101.docFull(id)
      if (doc === undefined) throw new Error(`dsh101_read: unknown document ${JSON.stringify(id)}`)
      const locale = args.locale === 'zh' ? 'zh' : 'en'
      const variant = doc.variants[locale] ?? doc.variants.en ?? doc.variants.zh
      if (variant === undefined) throw new Error(`dsh101_read: document ${JSON.stringify(id)} has no readable variant`)
      return {
        id,
        title: variant.title,
        locale: variant === doc.variants[locale] ? locale : (doc.variants.en === variant ? 'en' : 'zh'),
        sourcePath: doc.sourcePath,
        summary: variant.summary,
        body: variant.body ?? '',
        sections: variant.sections.map(section => ({ heading: section.heading, anchor: section.anchor })),
      }
    },
  })

  const open = defineTool({
    name: 'dsh101_open',
    description: [
      'Request the reader to navigate to a corpus document (and optionally one',
      'of its section anchors). Use when the user explicitly asks to open,',
      'jump to, or be taken to a document or section; for plain answers prefer',
      'citation links over navigation.',
    ].join(' '),
    parameters: {
      id: { type: 'string', description: 'Stable document id.' },
      section: { type: 'string', description: 'Optional section anchor to scroll to.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          target: { type: 'string' },
          id: { type: 'string' },
          section: { type: 'string' },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Navigating to ${value.target}.`,
      }],
    },
    presentCall: args => ({ card: 'generic', title: 'Open DSH 101 document', kind: 'other', rawInput: args }),
    execute: async (args) => {
      const id = String(args.id)
      const doc = dsh101.doc(id)
      if (doc === undefined) throw new Error(`dsh101_open: unknown document ${JSON.stringify(id)}`)
      const section = typeof args.section === 'string' && args.section !== '' ? args.section : undefined
      const target = `#/doc/${encodeURIComponent(id)}` + (section !== undefined ? `#${encodeURIComponent(section)}` : '')
      return { target, id, ...(section !== undefined ? { section } : {}) }
    },
  })

  const saveTranslation = defineTool({
    name: 'dsh101_save_translation',
    description: [
      'Persist a translated markdown body for a corpus document into the user',
      'home ($DSH_HOME/dsh-101/translations) — the source repository is never',
      'touched. Only locales the corpus lacks are accepted, so a shipped',
      'translation cannot be overwritten. Translate the document per the',
      'translation rules and terminology before calling this.',
    ].join(' '),
    parameters: {
      docId: { type: 'string', description: 'Stable document id (from dsh101_read).' },
      locale: { type: 'string', description: "'zh' or 'en' — the target language of the translation." },
      translation: { type: 'string', description: 'The complete translated markdown body (title included).' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { ok: { type: 'boolean' }, error: { type: 'string' } },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.ok ? 'Translation saved to the user home.' : `Translation save failed: ${value.error}`,
      }],
    },
    presentCall: args => ({ card: 'generic', title: 'Save DSH 101 translation', kind: 'other', rawInput: args }),
    execute: async (args) => {
      if (typeof args.locale !== 'string' || (args.locale !== 'en' && args.locale !== 'zh')) {
        throw new Error('dsh101_save_translation: locale must be "en" or "zh"')
      }
      if (typeof args.translation !== 'string' || args.translation.trim() === '') {
        throw new Error('dsh101_save_translation: translation body is empty')
      }
      return dsh101.saveTranslation({ docId: String(args.docId), locale: args.locale, body: args.translation })
    },
  })

  const publish = defineTool({
    name: 'dsh101_publish',
    description: [
      'Publish a validated DSH 101 curation overlay (module order, document',
      'metadata, summaries). Requires the calling session to be the curator',
      'session opened by the reader\'s update flow; other sessions are',
      'rejected. The overlay must carry schemaVersion 1, the current corpus',
      'baseRevision (see the corpus status), and only existing document ids.',
    ].join(' '),
    parameters: {
      curation: { type: 'object', additionalProperties: true, description: 'The complete curation overlay JSON.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { ok: { type: 'boolean' }, error: { type: 'string' } },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.ok ? 'Curation overlay published.' : `Curation publish failed: ${value.error}`,
      }],
    },
    presentCall: args => ({ card: 'generic', title: 'Publish DSH 101 curation', kind: 'other', rawInput: args }),
    execute: async (args, exec) => {
      const sessionId = exec.agent?.session.id
      if (sessionId === undefined) throw new Error('dsh101_publish requires an owning agent session')
      const token = curator.tokenOf(sessionId)
      if (token === undefined) {
        throw new Error('dsh101_publish: this session is not the curator session; open the update flow from the DSH 101 home page')
      }
      const curation = args.curation as unknown as CurationFile
      return dsh101.publish({ token, curation })
    },
  })

  return { search, read, open, saveTranslation, publish }
}
