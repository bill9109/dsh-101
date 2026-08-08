/**
 * DSH 101 tutor: curator-session ledger and the curator skill content.
 *
 * A curator session is an ordinary session whose first user message carries
 * the trigger marker; the plugin registers it with a fresh job token that
 * `dsh101_publish` must present. The ledger is in-memory: a restarted server
 * requires a fresh curator trigger, which the reader's update banner provides.
 *
 * @module @deepseek-ai/dsh-101-tutor
 */

/** The marker a curator session's first message must carry (the reader's update banner sends this). */
export const CURATOR_TRIGGER = 'dsh-101-curator'

/** Max curator sessions retained at once (defensive bound). */
const MAX_CURATOR_SESSIONS = 64

/** Ledger of curator sessions: session id → job token. */
export class CuratorLedger {
  #tokens = new Map<string, string>()

  /** Register a curator session with a fresh job token. Returns the token. */
  register(sessionId: string): string {
    const token = crypto.randomUUID()
    this.#tokens.set(sessionId, token)
    if (this.#tokens.size > MAX_CURATOR_SESSIONS) {
      const oldest = this.#tokens.keys().next().value
      if (oldest !== undefined) this.#tokens.delete(oldest)
    }
    return token
  }

  /** True when the session is a registered curator session. */
  isCurator(sessionId: string): boolean {
    return this.#tokens.has(sessionId)
  }

  /** The curator session's job token, or undefined. */
  tokenOf(sessionId: string): string | undefined {
    return this.#tokens.get(sessionId)
  }
}

/** Whether a user message text triggers curator registration. */
export function isCuratorTrigger(text: string): boolean {
  return text.includes(CURATOR_TRIGGER)
}

/** The curator skill body (loaded through ctx.skills.register). */
export const CURATOR_SKILL = {
  name: 'dsh-101-curator',
  description: 'Refresh the DSH 101 learning corpus curation after a DSH upgrade',
  whenToUse: 'The DSH 101 home page reports that new docs are available (curation out of date), or a version bump changed the corpus revision.',
  content: [
    '# DSH 101 curation refresh',
    '',
    'You are updating `$DSH_HOME/dsh-101/curation.json` after a DSH upgrade. The',
    'corpus index (stable document ids, modules, sections) is served through the',
    '`dsh101_search` / `dsh101_read` tools; the overlay you publish carries only',
    'curation metadata, never document bodies.',
    '',
    '## Steps',
    '',
    '1. **Survey the new corpus.** Search for the modules and document kinds you',
    '   know changed (`dsh101_search` with module-relevant terms). Compare with',
    '   the previous overlay you can read via `dsh101_read` of the curation file',
    '   path if available, or by asking the user.',
    '2. **Reconcile the module order.** Keep the recommended reading order',
    '   sensible: getting-started material first, references later. Only reorder',
    '   when the new content clearly warrants it.',
    '3. **Curate documents.** For documents whose content moved or changed, set',
    '   `order`, `summary` overrides, and `bestPractices` / `pitfalls` notes',
    '   where they genuinely improve the reading experience. Never fabricate',
    '   summaries: derive them from `dsh101_read` bodies.',
    '4. **Validate ids.** Every `documents` key in the overlay must exist in the',
    '   corpus — `dsh101_publish` rejects unknown ids.',
    '5. **Publish.** Call `dsh101_publish` with the complete overlay',
    '   (`schemaVersion: 1`, `baseRevision` copied from the current corpus',
    '   status, `tool: "dsh-101-curator"`). If publishing fails, fix the',
    '   reported error and retry; the previous overlay stays intact on failure.',
    '',
    '## Rules',
    '',
    '- The overlay is metadata only: no document bodies, no source copies.',
    '- Keep the change minimal and reviewable; a version bump usually needs',
    '  only a few documents re-curated.',
    '- Never publish with a `baseRevision` you did not read from the current',
    '  status — a mismatch is rejected and indicates a stale survey.',
  ].join('\n'),
}
