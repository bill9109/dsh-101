import { defineTool } from "@deepseek-ai/dsh-tools";
//#region types/tutor/curator.js
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
const CURATOR_TRIGGER = "dsh-101-curator";
/** Max curator sessions retained at once (defensive bound). */
const MAX_CURATOR_SESSIONS = 64;
/** Ledger of curator sessions: session id → job token. */
var CuratorLedger = class {
	#tokens = /* @__PURE__ */ new Map();
	/** Register a curator session with a fresh job token. Returns the token. */
	register(sessionId) {
		const token = crypto.randomUUID();
		this.#tokens.set(sessionId, token);
		if (this.#tokens.size > MAX_CURATOR_SESSIONS) {
			const oldest = this.#tokens.keys().next().value;
			if (oldest !== void 0) this.#tokens.delete(oldest);
		}
		return token;
	}
	/** True when the session is a registered curator session. */
	isCurator(sessionId) {
		return this.#tokens.has(sessionId);
	}
	/** The curator session's job token, or undefined. */
	tokenOf(sessionId) {
		return this.#tokens.get(sessionId);
	}
};
/** Whether a user message text triggers curator registration. */
function isCuratorTrigger(text) {
	return text.includes(CURATOR_TRIGGER);
}
/** The curator skill body (loaded through ctx.skills.register). */
const CURATOR_SKILL = {
	name: "dsh-101-curator",
	description: "Refresh the DSH 101 learning corpus curation after a DSH upgrade",
	whenToUse: "The DSH 101 home page reports that new docs are available (curation out of date), or a version bump changed the corpus revision.",
	content: [
		"# DSH 101 curation refresh",
		"",
		"You are updating `$DSH_HOME/dsh-101/curation.json` after a DSH upgrade. The",
		"corpus index (stable document ids, modules, sections) is served through the",
		"`dsh101_search` / `dsh101_read` tools; the overlay you publish carries only",
		"curation metadata, never document bodies.",
		"",
		"## Steps",
		"",
		"1. **Survey the new corpus.** Search for the modules and document kinds you",
		"   know changed (`dsh101_search` with module-relevant terms). Compare with",
		"   the previous overlay you can read via `dsh101_read` of the curation file",
		"   path if available, or by asking the user.",
		"2. **Reconcile the module order.** Keep the recommended reading order",
		"   sensible: getting-started material first, references later. Only reorder",
		"   when the new content clearly warrants it.",
		"3. **Curate documents.** For documents whose content moved or changed, set",
		"   `order`, `summary` overrides, and `bestPractices` / `pitfalls` notes",
		"   where they genuinely improve the reading experience. Never fabricate",
		"   summaries: derive them from `dsh101_read` bodies.",
		"4. **Validate ids.** Every `documents` key in the overlay must exist in the",
		"   corpus — `dsh101_publish` rejects unknown ids.",
		"5. **Publish.** Call `dsh101_publish` with the complete overlay",
		"   (`schemaVersion: 1`, `baseRevision` copied from the current corpus",
		"   status, `tool: \"dsh-101-curator\"`). If publishing fails, fix the",
		"   reported error and retry; the previous overlay stays intact on failure.",
		"",
		"## Rules",
		"",
		"- The overlay is metadata only: no document bodies, no source copies.",
		"- Keep the change minimal and reviewable; a version bump usually needs",
		"  only a few documents re-curated.",
		"- Never publish with a `baseRevision` you did not read from the current",
		"  status — a mismatch is rejected and indicates a stale survey."
	].join("\n")
};
//#endregion
//#region types/tutor/tools.js
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
/** Registry-ready tool set for the dsh101 domain. */
function dsh101Tools(deps) {
	const { dsh101, curator } = deps;
	return {
		search: defineTool({
			name: "dsh101_search",
			description: [
				"Search the DSH 101 learning corpus (the installation's own READMEs, docs,",
				"agent notes, examples, and generated catalogs). Returns matching",
				"documents with their stable ids, titles, and matching sections — use the",
				"ids with dsh101_read for full text, and cite the returned section",
				"anchors when answering."
			].join(" "),
			parameters: {
				query: {
					type: "string",
					description: "Search terms (CJK and English words both work)."
				},
				limit: {
					type: "integer",
					description: "Max hits (default 10, max 50)."
				}
			},
			output: {
				schema: {
					type: "object",
					additionalProperties: false,
					properties: {
						hits: {
							type: "array",
							items: {
								type: "object",
								additionalProperties: false,
								properties: {
									id: { type: "string" },
									title: { type: "string" },
									module: { type: "string" },
									locale: { type: "string" },
									sourcePath: { type: "string" },
									sections: {
										type: "array",
										items: {
											type: "object",
											additionalProperties: false,
											properties: {
												heading: { type: "string" },
												anchor: { type: "string" },
												excerpt: { type: "string" }
											}
										}
									}
								}
							}
						},
						total: { type: "integer" },
						truncated: { type: "boolean" }
					}
				},
				render: (_args, value) => [{
					type: "text",
					text: `${value.total ?? 0} result(s); first ${(value.hits ?? []).length} shown.`
				}]
			},
			presentCall: (args) => ({
				card: "generic",
				title: "Search DSH 101 corpus",
				kind: "other",
				rawInput: args
			}),
			execute: async (args) => {
				const limit = Math.min(args.limit ?? 10, 50);
				const result = dsh101.search(String(args.query));
				return {
					hits: result.hits.slice(0, limit).map((hit) => ({
						id: hit.id,
						title: hit.title,
						module: hit.module,
						locale: hit.locale,
						sourcePath: hit.sourcePath,
						sections: hit.sections.map((section) => ({
							heading: section.heading,
							anchor: section.anchor,
							excerpt: section.excerpt
						}))
					})),
					total: result.total,
					truncated: result.truncated
				};
			}
		}),
		read: defineTool({
			name: "dsh101_read",
			description: [
				"Read one DSH 101 corpus document by its stable id (from dsh101_search)",
				"and locale. Returns the full markdown body plus its section table; use",
				"the section anchors for precise citations."
			].join(" "),
			parameters: {
				id: {
					type: "string",
					description: "Stable document id."
				},
				locale: {
					type: "string",
					description: "'en' or 'zh'; defaults to the doc's available variant."
				}
			},
			output: {
				schema: {
					type: "object",
					additionalProperties: false,
					properties: {
						id: { type: "string" },
						title: { type: "string" },
						locale: { type: "string" },
						sourcePath: { type: "string" },
						summary: { type: "string" },
						body: { type: "string" },
						sections: {
							type: "array",
							items: {
								type: "object",
								additionalProperties: false,
								properties: {
									heading: { type: "string" },
									anchor: { type: "string" }
								}
							}
						}
					}
				},
				render: (_args, value) => [{
					type: "text",
					text: `Read ${value.id ?? ""} (${value.title ?? ""}, ${(value.body ?? "").length} chars).`
				}]
			},
			presentCall: (args) => ({
				card: "generic",
				title: "Read DSH 101 document",
				kind: "other",
				rawInput: args
			}),
			execute: async (args) => {
				const id = String(args.id);
				const doc = await dsh101.docFull(id);
				if (doc === void 0) throw new Error(`dsh101_read: unknown document ${JSON.stringify(id)}`);
				const locale = args.locale === "zh" ? "zh" : "en";
				const variant = doc.variants[locale] ?? doc.variants.en ?? doc.variants.zh;
				if (variant === void 0) throw new Error(`dsh101_read: document ${JSON.stringify(id)} has no readable variant`);
				return {
					id,
					title: variant.title,
					locale: variant === doc.variants[locale] ? locale : doc.variants.en === variant ? "en" : "zh",
					sourcePath: doc.sourcePath,
					summary: variant.summary,
					body: variant.body ?? "",
					sections: variant.sections.map((section) => ({
						heading: section.heading,
						anchor: section.anchor
					}))
				};
			}
		}),
		open: defineTool({
			name: "dsh101_open",
			description: [
				"Request the reader to navigate to a corpus document (and optionally one",
				"of its section anchors). Use when the user explicitly asks to open,",
				"jump to, or be taken to a document or section; for plain answers prefer",
				"citation links over navigation."
			].join(" "),
			parameters: {
				id: {
					type: "string",
					description: "Stable document id."
				},
				section: {
					type: "string",
					description: "Optional section anchor to scroll to."
				}
			},
			output: {
				schema: {
					type: "object",
					additionalProperties: false,
					properties: {
						target: { type: "string" },
						id: { type: "string" },
						section: { type: "string" }
					}
				},
				render: (_args, value) => [{
					type: "text",
					text: `Navigating to ${value.target}.`
				}]
			},
			presentCall: (args) => ({
				card: "generic",
				title: "Open DSH 101 document",
				kind: "other",
				rawInput: args
			}),
			execute: async (args) => {
				const id = String(args.id);
				if (dsh101.doc(id) === void 0) throw new Error(`dsh101_open: unknown document ${JSON.stringify(id)}`);
				const section = typeof args.section === "string" && args.section !== "" ? args.section : void 0;
				return {
					target: `#/doc/${encodeURIComponent(id)}` + (section !== void 0 ? `#${encodeURIComponent(section)}` : ""),
					id,
					...section !== void 0 ? { section } : {}
				};
			}
		}),
		saveTranslation: defineTool({
			name: "dsh101_save_translation",
			description: [
				"Persist a translated markdown body for a corpus document into the user",
				"home ($DSH_HOME/dsh-101/translations) — the source repository is never",
				"touched. Only locales the corpus lacks are accepted, so a shipped",
				"translation cannot be overwritten. Translate the document per the",
				"translation rules and terminology before calling this."
			].join(" "),
			parameters: {
				docId: {
					type: "string",
					description: "Stable document id (from dsh101_read)."
				},
				locale: {
					type: "string",
					description: "'zh' or 'en' — the target language of the translation."
				},
				translation: {
					type: "string",
					description: "The complete translated markdown body (title included)."
				}
			},
			output: {
				schema: {
					type: "object",
					additionalProperties: false,
					properties: {
						ok: { type: "boolean" },
						error: { type: "string" }
					}
				},
				render: (_args, value) => [{
					type: "text",
					text: value.ok ? "Translation saved to the user home." : `Translation save failed: ${value.error}`
				}]
			},
			presentCall: (args) => ({
				card: "generic",
				title: "Save DSH 101 translation",
				kind: "other",
				rawInput: args
			}),
			execute: async (args) => {
				if (typeof args.locale !== "string" || args.locale !== "en" && args.locale !== "zh") throw new Error("dsh101_save_translation: locale must be \"en\" or \"zh\"");
				if (typeof args.translation !== "string" || args.translation.trim() === "") throw new Error("dsh101_save_translation: translation body is empty");
				return dsh101.saveTranslation({
					docId: String(args.docId),
					locale: args.locale,
					body: args.translation
				});
			}
		}),
		publish: defineTool({
			name: "dsh101_publish",
			description: [
				"Publish a validated DSH 101 curation overlay (module order, document",
				"metadata, summaries). Requires the calling session to be the curator",
				"session opened by the reader's update flow; other sessions are",
				"rejected. The overlay must carry schemaVersion 1, the current corpus",
				"baseRevision (see the corpus status), and only existing document ids."
			].join(" "),
			parameters: { curation: {
				type: "object",
				additionalProperties: true,
				description: "The complete curation overlay JSON."
			} },
			output: {
				schema: {
					type: "object",
					additionalProperties: false,
					properties: {
						ok: { type: "boolean" },
						error: { type: "string" }
					}
				},
				render: (_args, value) => [{
					type: "text",
					text: value.ok ? "Curation overlay published." : `Curation publish failed: ${value.error}`
				}]
			},
			presentCall: (args) => ({
				card: "generic",
				title: "Publish DSH 101 curation",
				kind: "other",
				rawInput: args
			}),
			execute: async (args, exec) => {
				const sessionId = exec.agent?.session.id;
				if (sessionId === void 0) throw new Error("dsh101_publish requires an owning agent session");
				const token = curator.tokenOf(sessionId);
				if (token === void 0) throw new Error("dsh101_publish: this session is not the curator session; open the update flow from the DSH 101 home page");
				const curation = args.curation;
				return dsh101.publish({
					token,
					curation
				});
			}
		})
	};
}
//#endregion
//#region types/tutor/index.js
/**
* dsh-101-tutor host plugin: model tools over `ctx.dsh101`, the curator
* skill, the per-session reading-context section, and curator-session
* gating for `dsh101_publish`.
*
* @module @deepseek-ai/dsh-101-tutor
*/
/** Stable plugin name used by loader diagnostics. */
const name = "dsh-101-tutor";
/** Services required by the tutor plugin. */
const inject = [
	"dsh101",
	"tools",
	"skills",
	"systemPrompt",
	"sessions"
];
/** Context-section name contributed to the system prompt. */
const CONTEXT_SECTION = "dsh101-reading-context";
/**
* Mount the tutor plugin.
* @param ctx - host root context.
*/
function apply(ctx) {
	const curator = new CuratorLedger();
	const dsh101 = ctx.dsh101;
	const tools = dsh101Tools({
		dsh101,
		curator
	});
	for (const tool of [
		tools.search,
		tools.read,
		tools.open,
		tools.saveTranslation,
		tools.publish
	]) ctx.effect(() => ctx.tools.register(tool), `dsh-101-tutor: register ${tool.name}`);
	ctx.effect(() => ctx.skills.register({
		name: CURATOR_SKILL.name,
		description: CURATOR_SKILL.description,
		...CURATOR_SKILL.whenToUse !== void 0 ? { whenToUse: CURATOR_SKILL.whenToUse } : {},
		content: CURATOR_SKILL.content,
		invocation: {
			modelInvocable: true,
			userInvocable: true
		},
		source: "runtime",
		provider: "runtime"
	}), "dsh-101-tutor: curator skill");
	ctx.effect(() => ctx.systemPrompt.section({
		name: CONTEXT_SECTION,
		order: 150,
		text: (assembly) => {
			const scope = assembly.scope;
			if (typeof scope !== "string") return "";
			const context = dsh101.getContext(scope);
			if (context === void 0) return "";
			const doc = dsh101.doc(context.docId);
			if (doc === void 0) return "";
			const variant = doc.variants.en ?? doc.variants.zh;
			const lines = [
				"The user is reading this DSH 101 document:",
				`- id: ${context.docId}`,
				`- title: ${variant?.title ?? context.docId}`,
				`- source: ${doc.sourcePath}`
			];
			if (context.section !== void 0) lines.push(`- section: ${context.section}`);
			lines.push("Answer questions about DSH grounded in this document and the corpus tools; cite section anchors.");
			return lines.join("\n");
		}
	}), "dsh-101-tutor: reading context section");
	ctx.on("session/event", (session, event) => {
		if (event.type !== "user/message") return;
		const text = extractMessageText(event);
		if (text !== void 0 && isCuratorTrigger(text) && !curator.isCurator(session.id)) {
			curator.register(session.id);
			ctx.logger.info(`dsh-101-tutor: session ${session.id} registered as curator session`);
		}
	});
}
/** Extract plain text from a user message event (all text blocks joined). */
function extractMessageText(event) {
	if (event.type !== "user/message") return void 0;
	const content = event.data.content;
	if (!Array.isArray(content)) return void 0;
	const texts = content.filter((block) => {
		return typeof block === "object" && block !== null && block.type === "text" && typeof block.text === "string";
	}).map((block) => block.text);
	return texts.length > 0 ? texts.join("\n") : void 0;
}
//#endregion
export { CONTEXT_SECTION, apply, inject, name };
