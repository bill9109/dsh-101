//#region types/core/markdown.js
/**
* Minimal markdown parsing shared by the host and tooling: title, summary,
* and heading sections. This mirrors the corpus generator's extraction so
* user-provided translations (and any re-parsed body) get consistent shape.
*
* @module @deepseek-ai/dsh-101-core
*/
/** Extract the frontmatter title (falling back to the first H1) and the body. */
function extractTitle(body) {
	const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(body);
	let title = "";
	let rest = body;
	if (frontmatter !== null) {
		rest = body.slice(frontmatter[0].length);
		const titleMatch = /^title:\s*(.+)$/m.exec(frontmatter[1]);
		if (titleMatch !== null) title = titleMatch[1].trim().replace(/^["']|["']$/g, "");
	}
	if (title === "") {
		const heading = /^#\s+(.+)$/m.exec(rest);
		if (heading !== null) title = heading[1].trim();
	}
	return {
		title,
		body: rest.trim()
	};
}
/** Parse markdown into sections by heading levels 2-6 (h1 is the title). */
function extractSections(body) {
	const lines = body.split("\n");
	const sections = [];
	let current = null;
	for (const line of lines) {
		const match = /^(#{2,6})\s+(.+)$/.exec(line);
		if (match !== null) {
			const heading = match[2].trim();
			if (current !== null) sections.push(current);
			current = {
				heading,
				anchor: slugify(heading),
				level: match[1].length,
				body: ""
			};
			continue;
		}
		if (current === null) continue;
		current.body = current.body === "" ? line : `${current.body}\n${line}`;
	}
	if (current !== null) sections.push(current);
	return sections;
}
/** Stable kebab-case anchor (ASCII only; CJK headings fall back to a numbered anchor). */
function slugify(text) {
	const slug = text.toLocaleLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-+|-+$/g, "");
	if (slug !== "") return slug;
	return `section-${sha1Hex(text).slice(0, 8)}`;
}
/** Small deterministic hex hash for CJK-only anchor fallback. */
function sha1Hex(text) {
	let hash = 0;
	for (let i = 0; i < text.length; i += 1) hash = hash * 31 + text.charCodeAt(i) | 0;
	return (hash >>> 0).toString(16);
}
/** First non-empty paragraph of the body, stripped of markdown, bounded. */
function extractSummary(body) {
	const paragraph = body.split("\n\n").map((block) => block.trim()).find((block) => block !== "" && !block.startsWith("#") && !block.startsWith("```"));
	if (paragraph === void 0) return "";
	const plain = paragraph.replace(/`([^`]+)`/g, "$1").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_~#>|]/g, "").replace(/\s+/g, " ").trim();
	return plain.length > 200 ? `${plain.slice(0, 200)}…` : plain;
}
/** Parse a standalone markdown body into a DocVariant-shaped record. */
function parseMarkdownVariant(body) {
	const { title, body: rest } = extractTitle(body);
	return {
		title: title || "Untitled",
		summary: extractSummary(rest),
		body: rest,
		sections: extractSections(rest)
	};
}
//#endregion
//#region types/core/corpus.js
/**
* Corpus loading, curation merging, and atomic overlay publishing.
*
* @module @deepseek-ai/dsh-101-core
*/
/** Schema version of the corpus format. */
const CORPUS_SCHEMA_VERSION = 1;
/** Schema version of the curation overlay format. */
const CURATION_SCHEMA_VERSION = 1;
/** Directory (under the dsh home) holding the curation overlay. */
const CURATION_HOME_DIR = "dsh-101";
/** File name of the curation overlay. */
const CURATION_FILE_NAME = "curation.json";
/** Validation failure carrying a human-readable reason. */
var CorpusValidationError = class extends Error {
	constructor(message) {
		super(`dsh-101: ${message}`);
		this.name = "CorpusValidationError";
	}
};
/** Parse and validate a corpus index from JSON text. */
function parseCorpusIndex(text) {
	let raw;
	try {
		raw = JSON.parse(text);
	} catch {
		throw new CorpusValidationError("corpus index is not valid JSON");
	}
	if (typeof raw !== "object" || raw === null) throw new CorpusValidationError("corpus index root must be an object");
	const index = raw;
	if (index.schemaVersion !== 1) throw new CorpusValidationError(`unsupported corpus schemaVersion ${String(index.schemaVersion)} (expected 1)`);
	if (typeof index.revision !== "string" || index.revision.length === 0) throw new CorpusValidationError("corpus index missing revision");
	if (typeof index.dshVersion !== "string") throw new CorpusValidationError("corpus index missing dshVersion");
	if (typeof index.modules !== "object" || index.modules === null || !Array.isArray(index.modules)) throw new CorpusValidationError("corpus index modules must be an array");
	if (typeof index.documents !== "object" || index.documents === null || Array.isArray(index.documents)) throw new CorpusValidationError("corpus index documents must be an object");
	const documents = index.documents;
	for (const [id, value] of Object.entries(documents)) {
		if (typeof value !== "object" || value === null) throw new CorpusValidationError(`document ${id} must be an object`);
		const doc = value;
		if (typeof doc.sourcePath !== "string") throw new CorpusValidationError(`document ${id} missing sourcePath`);
		if (typeof doc.module !== "string") throw new CorpusValidationError(`document ${id} missing module`);
		if (typeof doc.variants !== "object" || doc.variants === null) throw new CorpusValidationError(`document ${id} missing variants`);
		const variants = doc.variants;
		if (Object.keys(variants).length === 0) throw new CorpusValidationError(`document ${id} has no variants`);
		for (const [locale, variant] of Object.entries(variants)) {
			if (locale !== "en" && locale !== "zh") throw new CorpusValidationError(`document ${id} has unknown locale ${locale}`);
			if (typeof variant !== "object" || variant === null) throw new CorpusValidationError(`document ${id} variant ${locale} must be an object`);
			const v = variant;
			if (typeof v.title !== "string") throw new CorpusValidationError(`document ${id} variant ${locale} missing title`);
			if (v.body !== void 0 && typeof v.body !== "string") throw new CorpusValidationError(`document ${id} variant ${locale} body must be a string`);
		}
	}
	return index;
}
/** Parse and validate a curation overlay from JSON text. */
function parseCurationFile(text) {
	let raw;
	try {
		raw = JSON.parse(text);
	} catch {
		throw new CorpusValidationError("curation overlay is not valid JSON");
	}
	if (typeof raw !== "object" || raw === null) throw new CorpusValidationError("curation overlay must be an object");
	const file = raw;
	if (file.schemaVersion !== 1) throw new CorpusValidationError(`unsupported curation schemaVersion ${String(file.schemaVersion)}`);
	if (typeof file.baseRevision !== "string" || file.baseRevision.length === 0) throw new CorpusValidationError("curation overlay missing baseRevision");
	if (file.tool !== void 0 && typeof file.tool !== "string") throw new CorpusValidationError("curation overlay tool must be a string");
	return file;
}
/** Apply a curation overlay onto a corpus, returning a new merged corpus. */
function mergeCuration(corpus, curation) {
	if (curation === void 0) return corpus;
	const documents = {};
	for (const [id, doc] of Object.entries(corpus.documents)) {
		const meta = curation.documents?.[id];
		documents[id] = {
			...doc,
			module: meta?.module ?? doc.module,
			...meta?.module !== void 0 ? { module: meta.module } : {},
			...meta?.summary !== void 0 ? { variants: mergeSummaries(doc.variants, meta.summary) } : {}
		};
	}
	const modules = [...corpus.modules];
	const moduleOrder = curation.moduleOrder;
	if (moduleOrder !== void 0) {
		const byId = new Map(modules.map((m) => [m.id, m]));
		const ordered = [];
		const seen = /* @__PURE__ */ new Set();
		for (const id of moduleOrder) {
			const module = byId.get(id);
			if (module === void 0) continue;
			ordered.push(module);
			seen.add(id);
		}
		for (const module of modules) if (!seen.has(module.id)) ordered.push(module);
		modules.splice(0, modules.length, ...ordered);
	}
	for (const module of modules) {
		const meta = curation.modules?.[module.id];
		if (meta === void 0) continue;
		if (meta.order !== void 0) module.order = meta.order;
		if (meta.title !== void 0) module.title = {
			...module.title,
			...meta.title
		};
		if (meta.description !== void 0) module.description = {
			...module.description,
			...meta.description
		};
	}
	return {
		...corpus,
		modules,
		documents
	};
}
function mergeSummaries(variants, summaries) {
	if (summaries === void 0) return variants;
	const next = { ...variants };
	for (const [locale, summary] of Object.entries(summaries)) {
		const variant = next[locale];
		if (variant === void 0 || summary === void 0) continue;
		next[locale] = {
			...variant,
			summary
		};
	}
	return next;
}
/** Serialize a curation overlay (stable key order for reproducible output). */
function serializeCuration(curation) {
	const sorted = {
		schemaVersion: curation.schemaVersion,
		baseRevision: curation.baseRevision,
		tool: curation.tool
	};
	if (curation.moduleOrder !== void 0) sorted.moduleOrder = curation.moduleOrder;
	if (curation.modules !== void 0) sorted.modules = curation.modules;
	if (curation.documents !== void 0) sorted.documents = curation.documents;
	return JSON.stringify(sorted, null, 2);
}
//#endregion
//#region types/core/search.js
/**
* Corpus search: bounded in-memory index over title, headings, and body
* text, with CJK-aware tokenization and title/heading weighting.
*
* The index is intentionally lightweight: metadata plus bounded body text is
* indexed at load; full document bodies are read on demand by the reader.
*
* @module @deepseek-ai/dsh-101-core
*/
/** Max search hits returned per query. */
const SEARCH_MAX_HITS = 50;
/** Max excerpt characters around a body match. */
const SEARCH_EXCERPT_RADIUS = 60;
/** Max body characters indexed per document (the head of each section body). */
const SEARCH_MAX_BODY_CHARS = 2e3;
/** Split a query into tokens: CJK character runs and ASCII word runs. */
function tokenize(text) {
	const tokens = [];
	const lower = text.toLocaleLowerCase();
	const isCjk = (ch) => /[\u3400-\u9fff\uf900-\ufaff]/.test(ch);
	const isWord = (ch) => /[a-z0-9_]/.test(ch);
	let i = 0;
	while (i < lower.length) {
		const ch = lower[i];
		if (isCjk(ch)) {
			let j = i + 1;
			while (j < lower.length && isCjk(lower[j])) j += 1;
			tokens.push(lower.slice(i, j));
			i = j;
		} else if (isWord(ch)) {
			let j = i + 1;
			while (j < lower.length && isWord(lower[j])) j += 1;
			tokens.push(lower.slice(i, j));
			i = j;
		} else i += 1;
	}
	return tokens;
}
function excerpt(text, index) {
	const start = Math.max(0, index - 60);
	const end = Math.min(text.length, index + 60);
	return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}
function findMatch(text, token) {
	const lower = text.toLocaleLowerCase();
	let from = 0;
	for (;;) {
		const at = lower.indexOf(token, from);
		if (at === -1) return -1;
		const before = at > 0 ? lower[at - 1] : "";
		const after = at + token.length < lower.length ? lower[at + token.length] : "";
		if (!/[a-z0-9_]/.test(before) && !/[a-z0-9_]/.test(after)) return at;
		from = at + token.length;
	}
}
/** Build the search index over a loaded corpus. */
function buildSearchIndex(index) {
	const docs = [];
	for (const entry of Object.values(index.documents)) for (const [locale, variant] of Object.entries(entry.variants)) {
		const segments = [];
		segments.push({
			locale,
			kind: "title",
			text: variant.title
		});
		if (variant.summary !== "") segments.push({
			locale,
			kind: "body",
			text: variant.summary
		});
		for (const section of variant.sections) {
			segments.push({
				locale,
				kind: "heading",
				anchor: section.anchor,
				heading: section.heading,
				text: section.heading
			});
			const bodyText = (variant.body ?? "").length > 0 ? section.body.slice(0, SEARCH_MAX_BODY_CHARS) : "";
			if (bodyText.length > 0) segments.push({
				locale,
				kind: "body",
				anchor: section.anchor,
				heading: section.heading,
				text: bodyText
			});
		}
		docs.push({
			entry,
			locale,
			title: variant.title,
			segments
		});
	}
	return docs;
}
/** Search the corpus; returns hits sorted by score (title match first). */
function searchCorpus(docs, query, limit = 50) {
	const tokens = tokenize(query);
	const hits = [];
	if (tokens.length === 0) return {
		query,
		hits,
		total: 0,
		truncated: false
	};
	for (const doc of docs) {
		let titleScore = 0;
		const matchedTokens = /* @__PURE__ */ new Set();
		for (const token of tokens) if (findMatch(doc.title, token) !== -1) {
			titleScore += 1;
			matchedTokens.add(token);
		}
		const sectionMatches = /* @__PURE__ */ new Map();
		let bodyScore = 0;
		for (const segment of doc.segments) {
			if (segment.kind === "title") continue;
			let matched = 0;
			let firstIndex = -1;
			for (const token of tokens) {
				const at = findMatch(segment.text, token);
				if (at !== -1) {
					matched += 1;
					matchedTokens.add(token);
					if (firstIndex === -1) firstIndex = at;
				}
			}
			if (matched === 0) continue;
			bodyScore += matched * (segment.kind === "heading" ? 2 : 1);
			const key = segment.anchor ?? segment.heading ?? "";
			const prev = sectionMatches.get(key);
			if (prev === void 0) sectionMatches.set(key, {
				heading: segment.heading ?? segment.anchor ?? "",
				anchor: segment.anchor ?? "",
				tokens: matched,
				excerpt: excerpt(segment.text, Math.max(0, firstIndex))
			});
			else if (matched > prev.tokens) {
				prev.tokens = matched;
				prev.excerpt = excerpt(segment.text, Math.max(0, firstIndex));
			}
		}
		const totalMatched = titleScore * 2 + bodyScore;
		if (totalMatched === 0) continue;
		if (matchedTokens.size < Math.ceil(tokens.length / 2)) continue;
		hits.push({
			id: doc.entry.id,
			module: doc.entry.module,
			kind: doc.entry.kind,
			sourcePath: doc.entry.sourcePath,
			locale: doc.locale,
			title: doc.title,
			summary: summaryOf(doc),
			sections: [...sectionMatches.values()].sort((a, b) => b.tokens - a.tokens).slice(0, 4).map(({ heading, anchor, excerpt: text }) => ({
				heading,
				anchor,
				excerpt: text
			})),
			score: totalMatched / (tokens.length * 2)
		});
	}
	hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
	const truncated = hits.length > limit;
	return {
		query,
		hits: hits.slice(0, limit),
		total: hits.length,
		truncated
	};
}
function summaryOf(doc) {
	const summary = doc.entry.variants[doc.locale]?.summary ?? "";
	return summary.length > 200 ? `${summary.slice(0, 200)}…` : summary;
}
//#endregion
//#region types/core/schema.js
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
const CORPUS_LOCALES = ["en", "zh"];
//#endregion
export { extractSections as _, buildSearchIndex as a, parseMarkdownVariant as b, CORPUS_SCHEMA_VERSION as c, CURATION_SCHEMA_VERSION as d, CorpusValidationError as f, serializeCuration as g, parseCurationFile as h, SEARCH_MAX_HITS as i, CURATION_FILE_NAME as l, parseCorpusIndex as m, SEARCH_EXCERPT_RADIUS as n, searchCorpus as o, mergeCuration as p, SEARCH_MAX_BODY_CHARS as r, tokenize as s, CORPUS_LOCALES as t, CURATION_HOME_DIR as u, extractSummary as v, extractTitle as y };
