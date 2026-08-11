/**
 * dsh-101-tutor host plugin: model tools over `ctx.dsh101`, the curator
 * skill, the per-session reading-context section, and curator-session
 * gating for `dsh101_publish`.
 *
 * @module @deepseek-ai/dsh-101-tutor
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '../app/index.ts'
import type {} from '@deepseek-ai/dsh-session'
import type { SessionEvent, SessionId } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-llm'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-skill'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { CURATOR_SKILL, CuratorLedger, isCuratorTrigger } from './curator.ts'
import { dsh101Tools } from './tools.ts'

/** Stable plugin name used by loader diagnostics. */
export const name = 'dsh-101-tutor'

/** Services required by the tutor plugin. */
export const inject = ['dsh101', 'tools', 'skills', 'systemPrompt', 'sessions']

/** Context-section name contributed to the system prompt. */
export const CONTEXT_SECTION = 'dsh101-reading-context'

/**
 * Mount the tutor plugin.
 * @param ctx - host root context.
 */
export function apply(ctx: Context): void {
  const curator = new CuratorLedger()
  const dsh101 = ctx.dsh101

  // Model tools.
  const tools = dsh101Tools({ dsh101, curator })
  for (const tool of [tools.search, tools.read, tools.open, tools.saveTranslation, tools.publish]) {
    ctx.effect(() => ctx.tools.register(tool), `dsh-101-tutor: register ${tool.name}`)
  }

  // Curator skill (runtime registration; model-invocable).
  ctx.effect(
    () => ctx.skills.register({
      name: CURATOR_SKILL.name,
      description: CURATOR_SKILL.description,
      ...(CURATOR_SKILL.whenToUse !== undefined ? { whenToUse: CURATOR_SKILL.whenToUse } : {}),
      content: CURATOR_SKILL.content,
      invocation: { modelInvocable: true, userInvocable: true },
      source: 'runtime',
      provider: 'runtime',
    }),
    'dsh-101-tutor: curator skill',
  )

  // Reading-context section: the current article follows the session.
  ctx.effect(
    () => ctx.systemPrompt.section({
      name: CONTEXT_SECTION,
      order: 150,
      text: (assembly) => {
        const scope = assembly.scope
        if (typeof scope !== 'string') return ''
        const context = dsh101.getContext(scope)
        if (context === undefined) return ''
        const doc = dsh101.doc(context.docId)
        if (doc === undefined) return ''
        const variant = doc.variants.en ?? doc.variants.zh
        const lines = [
          'The user is reading this DSH 101 document:',
          `- id: ${context.docId}`,
          `- title: ${variant?.title ?? context.docId}`,
          `- source: ${doc.sourcePath}`,
        ]
        if (context.section !== undefined) lines.push(`- section: ${context.section}`)
        lines.push('Answer questions about DSH grounded in this document and the corpus tools; cite section anchors.')
        return lines.join('\n')
      },
    }),
    'dsh-101-tutor: reading context section',
  )

  // Curator trigger: a user message carrying the marker registers the session
  // with a fresh job token (only the first occurrence per session matters).
  ctx.on('session/event', (session: { id: SessionId }, event: SessionEvent) => {
    if (event.type !== 'user/message') return
    const text = extractMessageText(event)
    if (text !== undefined && isCuratorTrigger(text) && !curator.isCurator(session.id)) {
      curator.register(session.id)
      ctx.logger.info(`dsh-101-tutor: session ${session.id} registered as curator session`)
    }
  })
}

/** Extract plain text from a user message event (all text blocks joined). */
function extractMessageText(event: SessionEvent): string | undefined {
  if (event.type !== 'user/message') return undefined
  const content = event.data.content
  if (!Array.isArray(content)) return undefined
  const texts = content.filter((block): block is ContentBlock & { type: 'text' } => {
    return typeof block === 'object' && block !== null && (block as { type?: string }).type === 'text' && typeof (block as { text?: unknown }).text === 'string'
  }).map(block => block.text)
  return texts.length > 0 ? texts.join('\n') : undefined
}
