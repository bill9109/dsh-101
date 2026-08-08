/**
 * DSH 101 corpus generator.
 *
 * Walks the repository's markdown tree (root README, docs/, .agents/notes,
 * examples/, skills/, package READMEs), derives stable document ids from
 * repository-relative paths, detects zh/en variant pairs, and emits a single
 * versioned corpus JSON into the dsh-101-app package assets.
 *
 * Deterministic: output depends only on the input tree (module assignment and
 * revision hash are content-derived), so the corpus gate can diff runs.
 *
 * Usage: tsx scripts/gen-dsh-101-corpus.ts [repoRoot] [outFile]
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'

const REPO = resolve(process.argv[2] ?? join(import.meta.dirname, '..', '..'))
const OUT = resolve(process.argv[3] ?? join(import.meta.dirname, '..', 'assets', 'dsh-101', 'corpus.json'))

const LOCALE_SUFFIX = /\.(zh)\.md$/i

/** Files larger than this (bytes) are skipped: huge sources are code trees, not teaching material. */
const MAX_FILE_BYTES = 300_000

/** Per-variant body cap (bytes): document files stay bounded; the corpus index carries metadata only. */
const MAX_BODY_BYTES = 60_000

interface Section { heading: string; anchor: string; level: number; body: string }

interface Variant { title: string; summary: string; body: string; sections: Section[] }

interface Doc { id: string; module: string; kind: string; sourcePath: string; variants: Record<string, Variant>; date?: string; updatedAt?: string; createdAt?: string }

interface ModuleDef { id: string; title: Record<string, string>; description: Record<string, string>; order: number }

/** Walk a directory tree, returning relative markdown paths (sorted). */
async function walkMarkdown(dir: string, base: string, out: string[]): Promise<void> {
  let entries: Dirent[]
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'lib' || entry.name === 'dist'
      || entry.name === 'target' || entry.name === '.git' || entry.name === 'vendor'
      || entry.name === '.sessions') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkMarkdown(full, base, out)
    } else if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.endsWith('.i18n.md')) {
      out.push(relative(base, full))
    }
  }
}

/** Extract YAML frontmatter title if present; otherwise the first heading. */
function extractTitle(body: string): { title: string; body: string } {
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
function extractSections(body: string): Section[] {
  const lines = body.split('\n')
  const sections: Section[] = []
  let current: Section | null = null
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
  return `section-${createHash('sha1').update(text).digest('hex').slice(0, 8)}`
}

/** First non-empty paragraph of the body, stripped of markdown, bounded. */
function extractSummary(body: string): string {
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

/** Curated module display copy (title + description per locale); falls back to titleOf(). */
const MODULE_COPY: Record<string, { title: { en: string; zh: string }; description: { en: string; zh: string } }> = {
  overview: {
    title: { en: 'Overview', zh: '概览' },
    description: { en: 'What DSH is, how to install it, and how to start', zh: 'DSH 是什么、如何安装与启动' },
  },
  concepts: {
    title: { en: 'Core Concepts', zh: '核心概念' },
    description: { en: 'Architecture, the config model, and key data structures', zh: '架构、配置模型与核心数据结构' },
  },
  cordis: {
    title: { en: 'Cordis Framework', zh: 'Cordis 框架' },
    description: { en: 'The plugin mechanism: lifecycle, services, events, config', zh: '插件机制：生命周期、服务、事件与配置' },
  },
  reference: {
    title: { en: 'Reference', zh: '接口参考' },
    description: { en: 'Generated catalogs: config, tools, persistence, Cordis API', zh: '自动生成的目录：配置、工具、持久化、Cordis API' },
  },
  cookbook: {
    title: { en: 'Cookbook', zh: '实操手册' },
    description: { en: 'Step-by-step guides: writing plugins, extending DSH', zh: '一步步上手：编写插件、扩展 DSH' },
  },
  notes: {
    title: { en: 'Agent Notes · Overview', zh: 'Agent Notes · 总览' },
    description: { en: 'The Agent Notes contract, tree guide, and workflow', zh: 'Agent Notes 的契约、目录说明与工作流' },
  },
  'notes-implemented': {
    title: { en: 'Agent Notes · Implemented', zh: 'Agent Notes · 已实施' },
    description: { en: 'Landed design decisions and their rationale', zh: '已落地的设计决策与理由' },
  },
  'notes-proposed': {
    title: { en: 'Agent Notes · Proposed', zh: 'Agent Notes · 提案' },
    description: { en: 'Designs under discussion', zh: '讨论中的新设计' },
  },
  'notes-rejected': {
    title: { en: 'Agent Notes · Rejected', zh: 'Agent Notes · 已否决' },
    description: { en: 'Proposals that were turned down, and why', zh: '被否决的提案与原因' },
  },
  'notes-archived': {
    title: { en: 'Agent Notes · Archived', zh: 'Agent Notes · 归档' },
    description: { en: 'Frozen historical snapshots — not current authority', zh: '冻结的历史快照——不作为当前依据' },
  },
  examples: {
    title: { en: 'Examples', zh: '示例' },
    description: { en: 'Runnable example compositions and their skills', zh: '可运行的示例组合与配套技能' },
  },
  skills: {
    title: { en: 'Skills', zh: '技能' },
    description: { en: 'Built-in skills and how to author your own', zh: '内置技能与编写你自己的技能' },
  },
  packages: {
    title: { en: 'Packages', zh: '包' },
    description: { en: 'Package responsibilities and boundaries', zh: '各包的职责与边界' },
  },
  website: {
    title: { en: 'Website', zh: '网站' },
    description: { en: 'Website-related documentation', zh: '官网相关文档' },
  },
  dev: {
    title: { en: 'Development', zh: '开发' },
    description: { en: 'Scripts, CLI, and the development workflow', zh: '脚本、CLI 与开发流程' },
  },
  misc: {
    title: { en: 'Misc', zh: '其他' },
    description: { en: 'Documents that do not fit elsewhere', zh: '未归类的文档' },
  },
}

/**
 * In-module display order. Groups by semantic structure per module, then
 * within a group: index/README first, numbered prefixes in numeric order,
 * remaining files alphabetically. Other modules get the same stable
 * within-group rules with a single flat group.
 */
const MODULE_INNER_GROUPS: Record<string, string[]> = {
  // Cordis: primer (overview) → tutorial (index + numbered chapters) → catalogs.
  cordis: ['docs/cordis-primer', 'docs/cordis-tutorial/', 'docs/cordis-catalog/'],
  // Concepts: top-level docs first, then dictionaries, the user reading path
  // (user index → guide → develop basic → framework → practice), postmortems, i18n.
  concepts: [
    'docs/core-data-structures/',
    'docs/user/', 'docs/user/guide/', 'docs/user/develop/basic/',
    'docs/user/develop/framework/', 'docs/user/develop/practice/',
    'docs/postmortem/', 'docs/i18n/',
  ],
}

function moduleInnerGroup(doc: { module: string; sourcePath: string }): number {
  const prefixes = MODULE_INNER_GROUPS[doc.module]
  if (prefixes === undefined) return 0
  if (doc.module === 'cordis') {
    if (doc.sourcePath.startsWith(prefixes[0]!)) return 0
    if (doc.sourcePath.startsWith(prefixes[1]!)) return 1
    return 2
  }
  const segs = doc.sourcePath.split('/')
  if (segs.length === 2) return 0 // top-level docs/*.md
  let best = -1
  let bestLen = -1
  prefixes.forEach((prefix, index) => {
    if (doc.sourcePath.startsWith(prefix) && prefix.length > bestLen) {
      best = index
      bestLen = prefix.length
    }
  })
  return best === -1 ? 50 : best + 1
}

/** Concepts top-level docs lead with the architecture, then by reading order. */
// Mirrors docs/architecture.md's section order: overview & services → event →
// loop lifecycle → tool pipeline → defensive patterns → extension/composition.
const CONCEPTS_TOP_ORDER = [
  'docs/architecture.md', 'docs/capability-seams.md', 'docs/event-producer-consumer.md',
  'docs/agent-lifecycle.md', 'docs/tool-execution-pipeline.md',
  'docs/defensive-patterns.md', 'docs/module-graph.md', 'docs/graph-atlas.md',
  'docs/web-styling.md', 'docs/testing.md', 'docs/development.md', 'docs/glossary.md', 'docs/AGENTS.md',
]

/** Sort key for one document within its module. */
function docSortKey(doc: { module: string; sourcePath: string }): [number, number, number, string] {
  const base = doc.sourcePath.split('/').pop() ?? doc.sourcePath
  const isIndex = /^(index|README)(\.zh)?\.md$/i.test(base)
  const numMatch = /^(\d+)-/.exec(base)
  const numRank = numMatch === null ? Number.MAX_SAFE_INTEGER : Number(numMatch[1])
  // Concepts top-level files follow an explicit reading order.
  if (doc.module === 'concepts' && doc.sourcePath.split('/').length === 2) {
    const topRank = CONCEPTS_TOP_ORDER.indexOf(doc.sourcePath)
    return [0, isIndex ? 0 : 1, topRank >= 0 ? topRank : 1000, doc.sourcePath.toLocaleLowerCase()]
  }
  // The user guide reads overview → quick start → config → providers.
  if (doc.sourcePath.startsWith('docs/user/guide/')) {
    const guideRank = ['docs/user/guide/index.md', 'docs/user/guide/quickstart.md', 'docs/user/guide/config.md', 'docs/user/guide/providers.md'].indexOf(doc.sourcePath)
    return [moduleInnerGroup(doc), 0, guideRank >= 0 ? guideRank : 10, doc.sourcePath.toLocaleLowerCase()]
  }
  return [moduleInnerGroup(doc), isIndex ? 0 : 1, numRank, doc.sourcePath.toLocaleLowerCase()]
}

/** Module classification by path. */
function moduleOf(path: string): { module: string; kind: string } {
  if (path === 'README.md') return { module: 'overview', kind: 'readme' }
  if (path.startsWith('docs/')) {
    if (path.includes('cordis-') || path === 'docs/cordis-primer.md') return { module: 'cordis', kind: 'reference' }
    if (path.includes('catalog')) return { module: 'reference', kind: 'reference' }
    if (path.startsWith('docs/cookbook/')) return { module: 'cookbook', kind: 'docs' }
    if (path.startsWith('docs/')) return { module: 'concepts', kind: 'docs' }
  }
  if (path.startsWith('.agents/notes/')) {
    const rest = path.slice('.agents/notes/'.length)
    const topLevel = rest.split('/')[0] ?? ''
    // Root-level overview files (the Agent Notes contract + tree guide) are
    // their own peer of the four lifecycle sections, not part of any of them.
    if (topLevel === 'README.md' || topLevel === 'AGENTS.md') return { module: 'notes', kind: 'agent-note' }
    const lifecycle = topLevel
    if (lifecycle === 'implemented') return { module: 'notes-implemented', kind: 'agent-note' }
    if (lifecycle === 'proposed') return { module: 'notes-proposed', kind: 'agent-note' }
    if (lifecycle === 'rejected') return { module: 'notes-rejected', kind: 'agent-note' }
    return { module: 'notes-archived', kind: 'agent-note' }
  }
  if (path.startsWith('examples/')) return { module: 'examples', kind: 'example' }
  if (path.includes('/skills/')) return { module: 'skills', kind: 'skill' }
  if (path.startsWith('packages/')) return { module: 'packages', kind: 'readme' }
  if (path.startsWith('website/')) return { module: 'website', kind: 'docs' }
  if (path.startsWith('scripts/') || path.startsWith('apps/')) return { module: 'dev', kind: 'misc' }
  return { module: 'misc', kind: 'misc' }
}

/** Stable document id: posix repo-relative path without the locale suffix. */
function docIdOf(path: string): string {
  const normalized = path.split(sep).join('/')
  const withoutLocale = normalized.replace(LOCALE_SUFFIX, '.md')
  return withoutLocale.replace(/\.md$/, '').replaceAll('/', '--')
}

/** Map repository-relative path -> last commit committer date (ISO), from git history. */
async function gitCommitTimes(root: string): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const exec = promisify(execFile)
    const { stdout } = await exec('git', ['log', '--format=%cI', '--name-only'], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
    let current: string | null = null
    for (const line of stdout.split('\n')) {
      if (/^\d{4}-\d{2}-\d{2}T/.test(line)) {
        current = line
      } else if (current !== null && line.trim() !== '') {
        // git log lists newest first, so the first time a path appears is its latest commit.
        if (!map.has(line)) map.set(line, current)
      }
    }
  } catch {
    // Not a git checkout: callers fall back to file stat times.
  }
  return map
}

async function main(): Promise<void> {
  const files: string[] = []
  await walkMarkdown(REPO, REPO, files)
  const gitTimes = await gitCommitTimes(REPO)
  const grouped = new Map<string, Doc>()
  const moduleOrder = new Map<string, number>()
  let nextOrder = 0
  const touchModule = (module: string): number => {
    if (!moduleOrder.has(module)) moduleOrder.set(module, nextOrder++)
    return moduleOrder.get(module)!
  }

  for (const rel of files) {
    const locale = LOCALE_SUFFIX.exec(rel)?.[1]?.toLowerCase() ?? 'en'
    const id = docIdOf(rel)
    const fileStat = await stat(join(REPO, rel))
    if (fileStat.size > MAX_FILE_BYTES) continue
    // Exclude the dsh-webbridge package: this bundle does not ship it, so its
    // README would advertise an unavailable tool surface. (Stable id check so
    // the guard survives upstream path moves.)
    if (rel.includes('packages/101/dsh-webbridge') || id.startsWith('packages--101--dsh-webbridge')) continue
    // Prefer the git committer date (semantic "last changed"); fall back to
    // the filesystem mtime outside a git checkout.
    const updatedAt = gitTimes.get(rel) ?? new Date(fileStat.mtimeMs).toISOString()
    const createdAt = fileStat.birthtimeMs > 0 ? new Date(fileStat.birthtimeMs).toISOString() : undefined
    // Agent notes carry their proposal date in the filename (YYYY-MM-DD-...).
    const dateMatch = /^(\d{4}-\d{2}-\d{2})-/.exec(basename(rel))
    const date = dateMatch !== null ? dateMatch[1] : undefined
    const raw = await readFile(join(REPO, rel), 'utf8')
    const { title, body: fullBody } = extractTitle(raw)
    const body = fullBody.length > MAX_BODY_BYTES
      ? `${fullBody.slice(0, MAX_BODY_BYTES)}\n\n<!-- dsh-101: body truncated for the corpus (${fullBody.length} bytes) -->`
      : fullBody
    const { module, kind } = moduleOf(rel)
    touchModule(module)
    let doc = grouped.get(id)
    if (doc === undefined) {
      doc = { id, module, kind, sourcePath: rel, variants: {}, updatedAt, ...(date !== undefined ? { date } : {}), ...(createdAt !== undefined ? { createdAt } : {}) }
      grouped.set(id, doc)
    } else {
      // Merge: zh variant joins the en doc (kind/module taken from en);
      // keep the newest mtime across variants.
      if (updatedAt !== undefined && (doc.updatedAt === undefined || updatedAt > doc.updatedAt)) {
        doc.updatedAt = updatedAt
      }
    }
    doc.variants[locale] = {
      title: title || rel,
      summary: extractSummary(body),
      body,
      sections: extractSections(body),
    }
  }

  const documents = Object.fromEntries([...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)))
  const modules: ModuleDef[] = [...moduleOrder.entries()]
    .sort(([, a], [, b]) => a - b)
    .map(([id], order) => {
      const curated = MODULE_COPY[id]
      return {
        id,
        title: { en: curated?.title.en ?? titleOf(id), zh: curated?.title.zh ?? titleOf(id) },
        description: { en: curated?.description.en ?? '', zh: curated?.description.zh ?? '' },
        order,
      }
    })
  // Explicit reading order: overview first, then the learning path (concepts,
  // Cordis), the distinctive Agent Notes decision records, then hands-on
  // material, with reference/dev material and misc trailing.
  const MODULE_PRIORITY = [
    'overview', 'concepts', 'cordis',
    'notes', 'notes-implemented', 'notes-proposed', 'notes-rejected', 'notes-archived',
    'cookbook', 'reference', 'examples', 'skills', 'packages', 'dev', 'website', 'misc',
  ]
  const priorityOf = (id: string): number => {
    const index = MODULE_PRIORITY.indexOf(id)
    return index === -1 ? MODULE_PRIORITY.length : index
  }
  modules.sort((a, b) => priorityOf(a.id) - priorityOf(b.id))
  // Keep each module's `order` in sync with the sorted array, so consumers
  // that re-sort by `order` (the reader tree) observe the same sequence.
  modules.forEach((module, index) => { module.order = index })

  // The index carries metadata only (no bodies); full bodies are written as
  // per-document files under the assets dir and loaded on demand by the host.
  const docDir = join(dirname(OUT), 'documents')
  await mkdir(docDir, { recursive: true })
  const indexDocuments: Record<string, unknown> = {}
  for (const [id, doc] of Object.entries(documents)) {
    const variants: Record<string, unknown> = {}
    const fullVariants: Record<string, unknown> = {}
    for (const [locale, variant] of Object.entries(doc.variants)) {
      // The index keeps bounded section previews (search snippets); full
      // section bodies live in the per-document file.
      const previewSections = variant.sections.map(section => ({
        heading: section.heading,
        anchor: section.anchor,
        level: section.level,
        body: section.body.slice(0, 600),
      }))
      variants[locale] = { title: variant.title, summary: variant.summary, sections: previewSections }
      fullVariants[locale] = variant
    }
    const order = [...Object.values(documents)]
      .filter(other => other.module === doc.module)
      .sort((a, b) => {
        const [ag, ai, an, ab] = docSortKey(a)
        const [bg, bi, bn, bb] = docSortKey(b)
        return ag - bg || ai - bi || an - bn || ab.localeCompare(bb)
      })
      .findIndex(other => other.id === id)
    indexDocuments[id] = {
      id: doc.id, module: doc.module, kind: doc.kind, sourcePath: doc.sourcePath, variants,
      ...(doc.date !== undefined ? { date: doc.date } : {}),
      ...(doc.updatedAt !== undefined ? { updatedAt: doc.updatedAt } : {}),
      ...(doc.createdAt !== undefined ? { createdAt: doc.createdAt } : {}),
      ...(order >= 0 ? { order } : {}),
    }
    await writeFile(join(docDir, `${id}.json`), JSON.stringify({ id: doc.id, variants: fullVariants }))
  }

  // Collect images referenced by documents (inline HTML <img src> and
  // markdown ![]()) into assets/images/<docId>--<basename> so the reader can
  // serve them. Remote/data/hash sources are skipped; oversized files too.
  const imageDir = join(dirname(OUT), 'images')
  await mkdir(imageDir, { recursive: true })
  const IMAGE_REF = /(?:<img[^>]*\bsrc="([^"]+)"|!\[[^\]]*\]\(([^)]+)\))/g
  let collected = 0
  for (const [id, doc] of Object.entries(documents)) {
    for (const variant of Object.values(doc.variants)) {
      let match: RegExpExecArray | null
      IMAGE_REF.lastIndex = 0
      while ((match = IMAGE_REF.exec(variant.body)) !== null) {
        const src = match[1] ?? match[2] ?? ''
        if (src === '' || /^(https?:|data:|#)/.test(src)) continue
        const absolute = resolve(dirname(join(REPO, doc.sourcePath)), src)
        try {
          const info = await stat(absolute)
          if (!info.isFile() || info.size > 2_000_000) continue
          const target = join(imageDir, `${id}--${basename(absolute)}`)
          await copyFile(absolute, target)
          collected += 1
        } catch {
          // Missing asset: leave the reference broken; the reader shows alt text.
        }
      }
    }
  }
  if (collected > 0) console.log(`dsh-101 corpus: collected ${collected} image asset(s) → ${imageDir}`)

  const revision = createHash('sha1')
    .update(JSON.stringify({ documents: indexDocuments, modules }))
    .digest('hex')
    .slice(0, 12)

  const corpus = {
    schemaVersion: 1,
    dshVersion: await dshVersion(),
    revision,
    modules,
    documents: indexDocuments,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(corpus, null, 2))
  console.log(`dsh-101 corpus: ${Object.keys(documents).length} documents, ${modules.length} modules → ${OUT} (rev ${revision})`)
}

function titleOf(id: string): string {
  const last = id.split('--').pop() ?? id
  return last
    .split('-')
    .map(word => (word === '' ? word : word[0]!.toUpperCase() + word.slice(1)))
    .join(' ')
}

async function dshVersion(): Promise<string> {
  try {
    const pkg = JSON.parse(await readFile(join(REPO, 'package.json'), 'utf8')) as { version?: string }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

void main().catch((error) => {
  console.error('gen-dsh-101-corpus failed:', error)
  process.exit(1)
})
