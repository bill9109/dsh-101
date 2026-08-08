/**
 * Minimal markdown parsing shared by the host and tooling: title, summary,
 * and heading sections. This mirrors the corpus generator's extraction so
 * user-provided translations (and any re-parsed body) get consistent shape.
 *
 * @module @deepseek-ai/dsh-101-core
 */

import type { DocSection } from './schema.ts'

/** Extract the frontmatter title (falling back to the first H1) and the body. */
export function extractTitle(body: string): { title: string; body: string } {
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(body)
  let title = ''
  let rest = body
  if (frontmatter !== null) {
    rest = body.slice(frontmatter[0].length)
    const titleMatch = /^title:\s*(.+)$/m.exec(frontmatter[1]!)
    if (titleMatch !== null) title = titleMatch[1]!.trim().replace(/^["']|["']$/g, '')
  }
  if (title === '') {
    const heading = /^#\s+(.+)$/m.exec(rest)
    if (heading !== null) title = heading[1]!.trim()
  }
  return { title, body: rest.trim() }
}

/** Parse markdown into sections by heading levels 2-6 (h1 is the title). */
export function extractSections(body: string): DocSection[] {
  const lines = body.split('\n')
  const sections: DocSection[] = []
  let current: DocSection | null = null
  for (const line of lines) {
    const match = /^(#{2,6})\s+(.+)$/.exec(line)
    if (match !== null) {
      const heading = match[2]!.trim()
      if (current !== null) sections.push(current)
      current = { heading, anchor: slugify(heading), level: match[1]!.length, body: '' }
      continue
    }
    if (current === null) continue
    current.body = current.body === '' ? line : `${current.body}\n${line}`
  }
  if (current !== null) sections.push(current)
  return sections
}

/** Stable kebab-case anchor (ASCII only; CJK headings fall back to a numbered anchor). */
function slugify(text: string): string {
  const slug = text
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  if (slug !== '') return slug
  return `section-${sha1Hex(text).slice(0, 8)}`
}

/** Small deterministic hex hash for CJK-only anchor fallback. */
function sha1Hex(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(16)
}

/** First non-empty paragraph of the body, stripped of markdown, bounded. */
export function extractSummary(body: string): string {
  const paragraph = body
    .split('\n\n')
    .map(block => block.trim())
    .find(block => block !== '' && !block.startsWith('#') && !block.startsWith('```'))
  if (paragraph === undefined) return ''
  const plain = paragraph
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~#>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 200 ? `${plain.slice(0, 200)}…` : plain
}

/** Parse a standalone markdown body into a DocVariant-shaped record. */
export function parseMarkdownVariant(body: string): { title: string; summary: string; body: string; sections: DocSection[] } {
  const { title, body: rest } = extractTitle(body)
  return { title: title || 'Untitled', summary: extractSummary(rest), body: rest, sections: extractSections(rest) }
}
