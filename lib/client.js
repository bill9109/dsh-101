window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-101",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/locales.ts
		/** Simplified Chinese dictionary (key-set source of truth). */
		const zh = {
			"title": "DSH 101",
			"tagline": "从入门到精通 DeepSeek Harness",
			"search.placeholder": "搜索文档、关键词…",
			"modules": "模块",
			"modules.empty": "暂无模块",
			"docs.empty": "暂无文档",
			"article.notFound": "文档不存在",
			"article.fallbackLocale": "当前语言没有此文档的版本，显示其他语言。",
			"article.sections": "目录",
			"article.source": "源文件",
			"tutor.title": "学习助手",
			"tutor.open": "打开学习助手",
			"tutor.close": "收起学习助手",
			"tutor.back": "返回会话列表",
			"tutor.sessions": "会话",
			"article.adjustTranslation": "调整翻译",
			"update.banner": "检测到新的 DSH 版本文档，可一键更新学习内容。",
			"update.button": "更新",
			"update.running": "更新中…",
			"update.done": "已更新",
			"update.error": "更新失败",
			"lang": "语言",
			"home.welcome": "欢迎使用 DSH 101",
			"home.guide": "从左侧选择一个模块开始，或直接搜索。"
		};
		/** English dictionary. */
		const en = {
			"title": "DSH 101",
			"tagline": "From zero to fluent with DeepSeek Harness",
			"search.placeholder": "Search docs, keywords...",
			"modules": "Modules",
			"modules.empty": "No modules",
			"docs.empty": "No documents",
			"article.notFound": "Document not found",
			"article.fallbackLocale": "This document has no version in the current language; showing another language.",
			"article.sections": "Sections",
			"article.source": "Source",
			"tutor.title": "Tutor",
			"tutor.open": "Open tutor",
			"tutor.close": "Collapse tutor",
			"tutor.back": "Back to sessions",
			"tutor.sessions": "Sessions",
			"article.adjustTranslation": "Adjust translation",
			"update.banner": "New DSH version docs detected; one-click update available.",
			"update.button": "Update",
			"update.running": "Updating…",
			"update.done": "Updated",
			"update.error": "Update failed",
			"lang": "Language",
			"home.welcome": "Welcome to DSH 101",
			"home.guide": "Pick a module on the left to start, or search directly."
		};
		/** Dictionary namespace owned by this plugin. */
		const NS = "dsh101";
		//#endregion
		//#region src/client/api.ts
		const BASE = "/api/dsh101";
		async function request(path, init) {
			const response = await fetch(`${BASE}${path}`, init);
			const body = await response.json();
			if (!response.ok) throw new Error(body.error ?? `dsh101 ${path} failed with ${response.status}`);
			return body;
		}
		/** Fetch the corpus index and curation freshness. */
		function fetchIndex() {
			return request("/index");
		}
		/** Fetch one document by stable id. */
		function fetchDoc(id) {
			return request(`/doc/${encodeURIComponent(id)}`);
		}
		/** Run a corpus search. */
		function fetchSearch(query) {
			return request(`/search?q=${encodeURIComponent(query)}`);
		}
		/** Report the session's current reading context (article id + optional section). */
		function setContext(sessionId, docId, section) {
			return request("/context", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					sessionId,
					docId,
					...section !== void 0 && section !== "" ? { section } : {}
				})
			});
		}
		/** Fetch all translation-session bindings (docId -> binding). */
		function fetchTranslations() {
			return request("/translations");
		}
		/** Bind a translation session to a document. */
		function bindTranslation(input) {
			return request("/translate/bind", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(input)
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/zhaowenbo/Downloads/公司项目/dsh-101/src/client/ReaderRoot.module.css.mjs
		const css = ".yIQj3G_shell{grid-template-columns:280px minmax(0,1fr) auto;height:100vh;display:grid;overflow:hidden}.yIQj3G_tree{border-right:1px solid var(--dsw-border,#80808040);background:var(--dsw-surface,#fafafa);flex-direction:column;gap:8px;padding:16px;display:flex;overflow:hidden}.yIQj3G_brand h1{margin:0;font-size:18px}.yIQj3G_brand p{opacity:.7;margin:4px 0 0;font-size:12px}.yIQj3G_topRow{justify-content:space-between;align-items:center;margin-bottom:10px;display:flex}.yIQj3G_sidebarToggle{width:28px;height:28px;color:var(--dsw-alias-label-secondary,#808080d9);cursor:pointer;background:0 0;border:none;border-radius:50%;justify-content:center;align-items:center;padding:0;display:inline-flex}.yIQj3G_sidebarToggle:hover{color:var(--dsw-alias-label-primary,inherit);background:var(--dsw-alias-interactive-bg-hover,#8080801f)}.yIQj3G_shellCollapsed{grid-template-columns:44px minmax(0,1fr) auto}.yIQj3G_treeCollapsed{align-items:center;padding:12px 8px}.yIQj3G_treeCollapsed .yIQj3G_topRow{justify-content:center;margin-bottom:0}.yIQj3G_langSwitch{background:var(--dsw-alias-interactive-bg-hover,#80808024);box-sizing:border-box;border-radius:999px;align-items:center;width:104px;height:26px;padding:2px;display:flex;position:relative}.yIQj3G_langThumb{background:var(--dsw-alias-surface-strong,#fff);border-radius:999px;width:50px;height:22px;transition:transform .18s;position:absolute;top:2px;left:2px;box-shadow:0 1px 2px #0000002e}.yIQj3G_langThumbZh{transform:translate(0)}.yIQj3G_langThumb:not(.yIQj3G_langThumbZh){transform:translate(50px)}.yIQj3G_langOption,.yIQj3G_langOptionActive{z-index:1;height:22px;color:var(--dsw-alias-label-primary,inherit);cursor:pointer;background:0 0;border:none;border-radius:999px;flex:1;font-size:12px;font-weight:500;position:relative}.yIQj3G_langOption{opacity:.65}.yIQj3G_langOption:hover{opacity:.9}.yIQj3G_searchForm{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,#8080804d);background:var(--dsh-search-input-fill,#8080801a);height:38px;color:var(--dsw-alias-label-caption,#808080b3);border-radius:24px;flex:none;align-items:center;gap:8px;margin:10px 0 12px;padding:0 14px;display:flex;overflow:hidden}.yIQj3G_searchIcon{flex:none}.yIQj3G_searchForm input{min-width:0;color:var(--dsw-alias-label-primary,inherit);background:0 0;border:none;outline:none;flex:1;font-size:14px;line-height:20px}.yIQj3G_searchForm input::placeholder{color:var(--dsw-alias-label-tertiary,#8080808c)}.yIQj3G_treeList{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:transparent transparent;flex-direction:column;flex:1;width:calc(100% + 16px);min-height:0;margin-right:-16px;padding-right:16px;display:flex;overflow:hidden auto}.yIQj3G_treeList.yIQj3G_scrollbarVisible{scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,#80808073) transparent}.yIQj3G_treeList::-webkit-scrollbar,.yIQj3G_main::-webkit-scrollbar{width:8px;height:8px}.yIQj3G_treeList::-webkit-scrollbar-thumb,.yIQj3G_main::-webkit-scrollbar-thumb{background:0 0;border-radius:4px;transition:background-color .25s}.yIQj3G_treeList.yIQj3G_scrollbarVisible::-webkit-scrollbar-thumb,.yIQj3G_main.yIQj3G_scrollbarVisible::-webkit-scrollbar-thumb{background:var(--dsw-alias-scrollbar-bg-l2,#80808073)}.yIQj3G_treeHome,.yIQj3G_treeDoc{box-sizing:border-box;text-align:left;width:100%;min-width:0;height:34px;color:var(--dsw-alias-label-primary,inherit);cursor:pointer;white-space:nowrap;text-overflow:ellipsis;background:0 0;border:none;border-radius:8px;flex-shrink:0;align-items:center;margin-bottom:4px;padding:0 8px;font-size:14px;line-height:20px;display:flex;overflow:hidden}.yIQj3G_treeHome:hover,.yIQj3G_treeDoc:hover{background:var(--dsw-alias-interactive-bg-hover,#8080801f)}.yIQj3G_treeDocActive,.yIQj3G_treeHomeActive{background:var(--dsw-alias-interactive-bg-active,#8080802e);font-weight:500}.yIQj3G_treeDocActive:hover,.yIQj3G_treeHomeActive:hover{background:var(--dsw-alias-interactive-bg-active,#8080802e)}.yIQj3G_treeModule{margin-top:4px}.yIQj3G_treeModuleTitle{box-sizing:border-box;text-align:left;width:100%;color:var(--dsw-alias-label-secondary,inherit);cursor:pointer;text-transform:uppercase;letter-spacing:.06em;background:0 0;border:none;border-radius:8px;align-items:center;gap:6px;padding:6px 8px;font-size:12px;display:flex}.yIQj3G_treeModuleTitle:hover{background:var(--dsw-alias-interactive-bg-hover,#8080801f)}.yIQj3G_treeModuleLabel{white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.yIQj3G_arrow{color:var(--dsw-alias-label-caption,#808080b3);transition:transform .15s var(--ds-ease-in-out,ease-in-out);flex:none}.yIQj3G_arrowOpen{transform:rotate(90deg)}.yIQj3G_treeEmpty{opacity:.4;padding:2px 8px 2px 22px;font-size:12px}.yIQj3G_treeDateLabel{box-sizing:border-box;width:100%;color:var(--dsw-alias-label-secondary,#808080d9);cursor:pointer;text-align:left;background:0 0;border:none;border-radius:8px;align-items:center;gap:6px;margin-bottom:4px;padding:6px 8px;font-size:12px;display:flex}.yIQj3G_treeDateLabel:hover{background:var(--dsw-alias-interactive-bg-hover,#8080801f)}.yIQj3G_main{scrollbar-width:thin;scrollbar-color:transparent transparent;min-width:0;padding:24px 32px;overflow-y:auto}.yIQj3G_main.yIQj3G_scrollbarVisible{scrollbar-color:var(--dsw-alias-scrollbar-bg-l2,#80808073) transparent}.yIQj3G_pane{max-width:780px;margin:0 auto}.yIQj3G_pane h2{margin-top:0}.yIQj3G_homeGrid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:16px;display:grid}.yIQj3G_homeCard{text-align:left;border:1px solid var(--dsw-border,#8080804d);background:var(--dsw-surface,#fff);cursor:pointer;color:inherit;border-radius:10px;flex-direction:column;gap:6px;padding:14px;display:flex}.yIQj3G_homeCard:hover{border-color:var(--dsw-accent,#007aff99)}.yIQj3G_homeCard strong{font-size:15px}.yIQj3G_homeCard span{opacity:.7;font-size:12px}.yIQj3G_homeCard em{opacity:.5;font-size:11px;font-style:normal}.yIQj3G_article{max-width:780px;margin:0 auto}.yIQj3G_articleHead h2{margin:0 0 4px}.yIQj3G_articleMeta{opacity:.6;font-size:12px}.yIQj3G_fallback{color:#b26a00;margin-left:8px;font-size:12px;display:inline-block}.yIQj3G_translateBtn{background:var(--dsw-accent,#007aff);color:#fff;cursor:pointer;border:0;border-radius:6px;margin-left:10px;padding:4px 12px;font-size:12px}.yIQj3G_articleLayout{position:relative}.yIQj3G_tocSlot{width:28px;position:absolute;top:76px;bottom:0;left:-32px}.yIQj3G_tocRail{z-index:2;box-sizing:border-box;flex-direction:column;gap:4px;width:28px;height:calc(100vh - 124px);padding:8px 0;display:flex;position:sticky;top:76px;overflow:visible}.yIQj3G_tocTick{cursor:pointer;outline:none;flex:none;height:14px;text-decoration:none;display:block;position:relative}.yIQj3G_tocTick:before{--tick-w:6px;content:\"\";width:var(--tick-w);max-width:var(--tick-w);background:color-mix(in srgb, var(--dsw-alias-label-secondary,#888), transparent 79%);border-radius:1px;height:2px;transition:width .14s cubic-bezier(.22,.8,.28,1),max-width .14s cubic-bezier(.22,.8,.28,1),height .14s cubic-bezier(.22,.8,.28,1),background .14s;position:absolute;top:50%;left:3px;transform:translateY(-50%)}.yIQj3G_tocTick:hover:before,.yIQj3G_tocTick:focus-visible:before{--tick-w:22px;background:color-mix(in srgb, var(--dsw-alias-label-primary,#333), transparent 12%);height:3px}.yIQj3G_tocTick:hover+.yIQj3G_tocTick:before{--tick-w:12px;background:color-mix(in srgb, var(--dsw-alias-label-secondary,#888), transparent 62%)}.yIQj3G_tocTick:focus-visible{outline:1px solid color-mix(in srgb, var(--dsw-alias-label-secondary,#888), transparent 55%);outline-offset:-2px}.yIQj3G_tickPreview{z-index:8;color:#1d1e20;opacity:0;visibility:hidden;pointer-events:none;background:#fff;border:1px solid #80808059;border-radius:12px;width:300px;padding:12px 14px;transition:opacity .11s ease-out;position:absolute;top:50%;left:26px;transform:translateY(-50%);box-shadow:0 12px 32px #00000038}.yIQj3G_tocTick:hover .yIQj3G_tickPreview,.yIQj3G_tocTick:focus-visible .yIQj3G_tickPreview{opacity:1;visibility:visible}body[data-ds-dark-theme] .yIQj3G_tickPreview{color:#eceff1;background:#1b1c1e}.yIQj3G_tickIndex{color:#808080bf;font-size:10px;font-family:var(--dsw-font-mono,ui-monospace, monospace);letter-spacing:.02em;margin-bottom:5px;display:block}.yIQj3G_tickPreview strong{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:590;line-height:1.5;display:block;overflow:hidden}body[data-ds-dark-theme] .yIQj3G_tickPreview p{color:#aeb4b9}body[data-ds-dark-theme] .yIQj3G_tickIndex{color:#eceff199}.yIQj3G_tickPreview p{color:#5b5f64;-webkit-line-clamp:2;-webkit-box-orient:vertical;margin:6px 0 0;font-size:11px;line-height:1.55;display:-webkit-box;overflow:hidden}@media (width<=900px){.yIQj3G_tocSlot{display:none}.yIQj3G_articleLayout{grid-template-columns:1fr}}.yIQj3G_articleBody{font-size:15px;line-height:1.7}.yIQj3G_articleBody h1:first-of-type{display:none}.yIQj3G_articleBody a{color:var(--dsw-accent,#007aff);text-underline-offset:2px;text-decoration:underline}.yIQj3G_articleBody a:hover{opacity:.85}.yIQj3G_articleBody img{border-radius:8px;max-width:100%;height:auto;margin:12px 0;display:block}.yIQj3G_articleBody h1,.yIQj3G_articleBody h2,.yIQj3G_articleBody h3,.yIQj3G_articleBody h4,.yIQj3G_articleBody h5,.yIQj3G_articleBody h6{margin:1.4em 0 .6em;font-weight:600;line-height:1.3}.yIQj3G_articleBody h1{font-size:24px}.yIQj3G_articleBody h2{font-size:20px}.yIQj3G_articleBody h3{font-size:17px}.yIQj3G_articleBody h4{font-size:15px}.yIQj3G_articleBody p{margin:.7em 0}.yIQj3G_articleBody ul,.yIQj3G_articleBody ol{margin:.7em 0;padding-left:1.6em}.yIQj3G_articleBody li{margin:.25em 0}.yIQj3G_articleBody code{background:var(--dsw-alias-code-inline-bg,#80808024);border-radius:4px;padding:.15em .4em;font-size:.9em}.yIQj3G_articleBody pre{background:var(--dsw-alias-code-block-bg,#8080801a);border-radius:8px;margin:.8em 0;padding:12px 14px;overflow-x:auto}.yIQj3G_articleBody pre code{background:0 0;padding:0;font-size:13px}.yIQj3G_articleBody blockquote{border-left:3px solid var(--dsw-alias-border-l2,#80808059);color:var(--dsw-alias-label-secondary,#808080e6);margin:.8em 0;padding:2px 0 2px 14px}.yIQj3G_articleBody table{border-collapse:collapse;margin:.8em 0}.yIQj3G_articleBody th,.yIQj3G_articleBody td{border:1px solid var(--dsw-alias-border-l2,#8080804d);text-align:left;padding:6px 10px!important}.yIQj3G_articleBody th{background:var(--dsw-alias-interactive-bg-hover,#8080801a);font-weight:600}.yIQj3G_articleBody hr{border:none;border-top:1px solid var(--dsw-alias-border-l2,#8080804d);margin:1.2em 0}.yIQj3G_tutor{border-left:1px solid var(--dsw-border,#80808040);background:var(--dsw-surface,#fafafa);flex-direction:column;width:380px;height:100vh;display:flex;position:relative;overflow:hidden}.yIQj3G_tutorResize{cursor:col-resize;z-index:3;width:6px;position:absolute;top:0;bottom:0;left:-3px}.yIQj3G_tutorHead{border-bottom:1px solid var(--dsw-border,#80808040);justify-content:space-between;align-items:center;padding:10px 14px;display:flex}.yIQj3G_tutorHead button{color:inherit;cursor:pointer;opacity:.7;background:0 0;border:0;font-size:12px}.yIQj3G_tutorBody{flex:1;min-height:0;overflow-y:auto}.yIQj3G_tutorWorkspace{box-sizing:border-box;height:100%}.yIQj3G_tutorWorkspace [aria-label=收起侧边栏],.yIQj3G_tutorWorkspace [aria-label=Collapse\\ sidebar]{display:none}body:has(.yIQj3G_tutorWorkspace [role=treeitem][class*=_menuOpen])>[role=menu]{left:auto!important;right:12px!important}body:has(.yIQj3G_tutorWorkspace [role=treeitem][aria-selected]:hover)>[class*=_card]{left:auto!important;right:calc(var(--dsh101-tutor-width,420px) + 12px)!important}.yIQj3G_tutorBack{border-radius:50%;justify-content:center;align-items:center;width:24px;height:24px;margin-right:6px;padding:0;display:inline-flex}.yIQj3G_tutorBack:hover{background:var(--dsw-hover,#8080801f);opacity:1!important}.yIQj3G_tutorMinimize{width:24px;height:24px;color:var(--dsw-alias-label-secondary,#808080d9);cursor:pointer;background:0 0;border:none;border-radius:50%;justify-content:center;align-items:center;padding:0;display:inline-flex}.yIQj3G_tutorMinimize:hover{color:var(--dsw-alias-label-primary,inherit);background:var(--dsw-alias-interactive-bg-hover,#8080801f)}.yIQj3G_tutorOpen{background:var(--dsw-accent,#007aff);color:#fff;cursor:pointer;border:0;border-radius:999px;padding:8px 14px;font-size:13px;position:fixed;bottom:16px;right:16px}.yIQj3G_updateBanner{border:1px solid var(--dsw-border,#b26a0080);background:#b26a0014;border-radius:8px;flex-direction:column;gap:6px;padding:10px;font-size:12px;display:flex}.yIQj3G_updateBanner button{background:var(--dsw-accent,#007aff);color:#fff;cursor:pointer;border:0;border-radius:5px;align-self:flex-start;padding:4px 10px}.yIQj3G_hit{border-bottom:1px solid var(--dsw-border,#80808033);padding:10px 0}.yIQj3G_hitTitle{color:inherit;cursor:pointer;text-align:left;background:0 0;border:0;padding:0;font-size:15px;font-weight:600;display:block}.yIQj3G_hitMeta{opacity:.6;font-size:11px}.yIQj3G_hitSection{text-align:left;width:100%;color:inherit;cursor:pointer;background:0 0;border:0;border-radius:6px;flex-direction:column;gap:2px;margin-top:4px;padding:6px 8px;font-size:13px;display:flex}.yIQj3G_hitSection:hover{background:var(--dsw-hover,#8080801a)}.yIQj3G_hitSection span{opacity:.7;font-size:12px}.yIQj3G_loading{opacity:.5}.yIQj3G_error{color:#c62828;font-size:13px}";
		const tagId = "@dsh-external/dsh-101/ReaderRoot.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-101";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var ReaderRoot_module_css_default = {
			"shellCollapsed": "yIQj3G_shellCollapsed",
			"langThumbZh": "yIQj3G_langThumbZh",
			"homeGrid": "yIQj3G_homeGrid",
			"tocRail": "yIQj3G_tocRail",
			"articleBody": "yIQj3G_articleBody",
			"articleMeta": "yIQj3G_articleMeta",
			"article": "yIQj3G_article",
			"tickIndex": "yIQj3G_tickIndex",
			"tutor": "yIQj3G_tutor",
			"tutorResize": "yIQj3G_tutorResize",
			"treeHome": "yIQj3G_treeHome",
			"fallback": "yIQj3G_fallback",
			"tocSlot": "yIQj3G_tocSlot",
			"hit": "yIQj3G_hit",
			"hitTitle": "yIQj3G_hitTitle",
			"articleHead": "yIQj3G_articleHead",
			"translateBtn": "yIQj3G_translateBtn",
			"error": "yIQj3G_error",
			"langOption": "yIQj3G_langOption",
			"treeModuleTitle": "yIQj3G_treeModuleTitle",
			"langThumb": "yIQj3G_langThumb",
			"searchForm": "yIQj3G_searchForm",
			"tickPreview": "yIQj3G_tickPreview",
			"tutorBack": "yIQj3G_tutorBack",
			"tocTick": "yIQj3G_tocTick",
			"shell": "yIQj3G_shell",
			"hitSection": "yIQj3G_hitSection",
			"scrollbarVisible": "yIQj3G_scrollbarVisible",
			"treeDocActive": "yIQj3G_treeDocActive",
			"treeModule": "yIQj3G_treeModule",
			"hitMeta": "yIQj3G_hitMeta",
			"treeModuleLabel": "yIQj3G_treeModuleLabel",
			"main": "yIQj3G_main",
			"arrow": "yIQj3G_arrow",
			"brand": "yIQj3G_brand",
			"updateBanner": "yIQj3G_updateBanner",
			"treeEmpty": "yIQj3G_treeEmpty",
			"topRow": "yIQj3G_topRow",
			"tutorOpen": "yIQj3G_tutorOpen",
			"tutorBody": "yIQj3G_tutorBody",
			"treeDoc": "yIQj3G_treeDoc",
			"tree": "yIQj3G_tree",
			"treeList": "yIQj3G_treeList",
			"tutorMinimize": "yIQj3G_tutorMinimize",
			"tutorHead": "yIQj3G_tutorHead",
			"tutorWorkspace": "yIQj3G_tutorWorkspace",
			"treeDateLabel": "yIQj3G_treeDateLabel",
			"langSwitch": "yIQj3G_langSwitch",
			"articleLayout": "yIQj3G_articleLayout",
			"arrowOpen": "yIQj3G_arrowOpen",
			"pane": "yIQj3G_pane",
			"homeCard": "yIQj3G_homeCard",
			"searchIcon": "yIQj3G_searchIcon",
			"sidebarToggle": "yIQj3G_sidebarToggle",
			"treeCollapsed": "yIQj3G_treeCollapsed",
			"loading": "yIQj3G_loading",
			"treeHomeActive": "yIQj3G_treeHomeActive",
			"langOptionActive": "yIQj3G_langOptionActive"
		};
		//#endregion
		//#region src/client/ReaderRoot.tsx
		/**
		* Reader root: the dsh-101 three-pane shell (module tree | article/home |
		* tutor conversation), registered into the framework's built-in `root` slot.
		*
		* Routing is hash-based (`#/`, `#/doc/<id>`, `#/doc/<id>#<anchor>`,
		* `#/search/<q>`): the SPA static fallback serves index.html for every path,
		* and hash navigation needs no server cooperation. The tutor pane renders the
		* `conversation` slot, which this entry declares (ui-layout is absent from
		* this profile). Locale and theme services arrive through the register
		* inject face — components never touch `ctx` directly.
		*
		* @module @deepseek-ai/dsh-101-app/client
		*/
		const TUTOR_OPEN_KEY = "dsh101.tutorOpen";
		function parseHash(hash) {
			const path = hash.replace(/^#/, "") || "/";
			if (path === "/" || path === "") return { kind: "home" };
			const docMatch = /^\/doc\/([^/]+?)(?:#(.+))?$/.exec(path);
			if (docMatch !== null) return {
				kind: "doc",
				id: decodeURIComponent(docMatch[1]),
				...docMatch[2] !== void 0 ? { anchor: decodeURIComponent(docMatch[2]) } : {}
			};
			const searchMatch = /^\/search\/(.+)$/.exec(path);
			if (searchMatch !== null) return {
				kind: "search",
				q: decodeURIComponent(searchMatch[1])
			};
			return { kind: "home" };
		}
		function toHash(view) {
			if (view.kind === "home") return "#/";
			if (view.kind === "doc") return `#/doc/${encodeURIComponent(view.id)}` + (view.anchor !== void 0 ? `#${encodeURIComponent(view.anchor)}` : "");
			return `#/search/${encodeURIComponent(view.q)}`;
		}
		/** The reader shell component. */
		function ReaderRoot(props) {
			const { renderSlot, t, locale, openSession, subscribeConversation, subscribeSessionList } = props;
			const [index, setIndex] = (0, react.useState)(null);
			const [curationCurrent, setCurationCurrent] = (0, react.useState)(true);
			const [loadError, setLoadError] = (0, react.useState)(null);
			const [view, setView] = (0, react.useState)(() => {
				const hash = window.location.hash;
				if (hash === "" || hash === "#") return {
					kind: "doc",
					id: "README"
				};
				return parseHash(hash);
			});
			const [localeId, setLocaleId] = (0, react.useState)(() => {
				try {
					return localStorage.getItem("dsh.locale") === "en" ? "en" : "zh";
				} catch {
					return "zh";
				}
			});
			const [sidebarCollapsed, setSidebarCollapsed] = (0, react.useState)(() => {
				try {
					return localStorage.getItem("dsh101.sidebarCollapsed") === "1";
				} catch {
					return false;
				}
			});
			const toggleSidebar = () => {
				setSidebarCollapsed((prev) => {
					const next = !prev;
					localStorage.setItem("dsh101.sidebarCollapsed", next ? "1" : "0");
					return next;
				});
			};
			const [tutorOpen, setTutorOpen] = (0, react.useState)(() => {
				try {
					return localStorage.getItem(TUTOR_OPEN_KEY) !== "0";
				} catch {
					return true;
				}
			});
			const [tutorWidth, setTutorWidth] = (0, react.useState)(() => {
				try {
					const value = Number(localStorage.getItem("dsh101.tutorWidth"));
					return Number.isFinite(value) && value >= 240 && value <= 640 ? value : 420;
				} catch {
					return 420;
				}
			});
			const tutorWidthRef = (0, react.useRef)(tutorWidth);
			(0, react.useEffect)(() => {
				tutorWidthRef.current = tutorWidth;
			}, [tutorWidth]);
			(0, react.useEffect)(() => {
				document.body.style.setProperty("--dsh101-tutor-width", `${tutorWidth}px`);
			}, [tutorWidth]);
			const onTutorResizeStart = (event) => {
				event.preventDefault();
				const startX = event.clientX;
				const startW = tutorWidthRef.current;
				const onMove = (ev) => {
					const next = Math.min(640, Math.max(240, startW - (ev.clientX - startX)));
					tutorWidthRef.current = next;
					setTutorWidth(next);
				};
				const onUp = () => {
					localStorage.setItem("dsh101.tutorWidth", String(tutorWidthRef.current));
					window.removeEventListener("pointermove", onMove);
					window.removeEventListener("pointerup", onUp);
				};
				window.addEventListener("pointermove", onMove);
				window.addEventListener("pointerup", onUp);
			};
			const [query, setQuery] = (0, react.useState)("");
			const [updateState, setUpdateState] = (0, react.useState)("idle");
			const mainRef = (0, react.useRef)(null);
			useAutoHideScrollbar(mainRef);
			const [tutorView, setTutorView] = (0, react.useState)("chat");
			const [sessionRows, setSessionRows] = (0, react.useState)([]);
			const [translationBindings, setTranslationBindings] = (0, react.useState)({});
			const refreshTranslations = () => {
				fetchTranslations().then((value) => {
					setTranslationBindings(value.bindings);
				}).catch(() => {});
			};
			(0, react.useEffect)(() => {
				let cancelled = false;
				(async () => {
					try {
						const indexResult = await fetchIndex();
						if (cancelled) return;
						setIndex(indexResult.corpus);
						setCurationCurrent(indexResult.curationCurrent);
					} catch (error) {
						if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
					}
				})();
				return () => {
					cancelled = true;
				};
			}, []);
			(0, react.useEffect)(() => subscribeSessionList((snapshot) => {
				setSessionRows(snapshot.rows);
			}), []);
			(0, react.useEffect)(() => {
				refreshTranslations();
			}, []);
			(0, react.useEffect)(() => {
				const onChange = () => {
					setView(parseHash(window.location.hash));
				};
				window.addEventListener("hashchange", onChange);
				return () => {
					window.removeEventListener("hashchange", onChange);
				};
			}, []);
			(0, react.useEffect)(() => {
				return locale.subscribe(() => {
					setLocaleId(locale.getSnapshot() === "en" ? "en" : "zh");
				});
			}, []);
			const [currentSessionId, setCurrentSessionId] = (0, react.useState)(void 0);
			(0, react.useEffect)(() => {
				const handled = /* @__PURE__ */ new Set();
				return subscribeConversation((snapshot) => {
					const sid = snapshot?.sessionId;
					if (typeof sid === "string") setCurrentSessionId(sid);
					const target = findOpenNavigation(snapshot, handled);
					if (target !== null) {
						const [id, anchor] = target.hash.slice(6).split("#");
						if (id !== void 0 && id !== "") navigate({
							kind: "doc",
							id: decodeURIComponent(id),
							...anchor !== void 0 && anchor !== "" ? { anchor: decodeURIComponent(anchor) } : {}
						});
					}
				});
			}, []);
			(0, react.useEffect)(() => {
				if (view.kind !== "doc" || currentSessionId === void 0) return;
				const boundDocId = Object.entries(translationBindings).find(([, binding]) => binding.sessionId === currentSessionId)?.[0];
				setContext(currentSessionId, boundDocId ?? view.id, boundDocId === void 0 ? view.anchor : void 0).catch(() => {});
			}, [
				view,
				currentSessionId,
				translationBindings
			]);
			const lastListCurrentRef = (0, react.useRef)(null);
			const listInitializedRef = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				if (tutorView !== "list") {
					lastListCurrentRef.current = null;
					listInitializedRef.current = false;
					return;
				}
				const current = sessionRows.find((row) => row.current)?.id ?? null;
				if (!listInitializedRef.current) {
					listInitializedRef.current = true;
					lastListCurrentRef.current = current;
					return;
				}
				if (current !== lastListCurrentRef.current) setTutorView("chat");
			}, [tutorView, sessionRows]);
			const onSessionListClick = (event) => {
				if (tutorView !== "list") return;
				const target = event.target;
				const row = target.closest("[role=\"treeitem\"][aria-selected]");
				const newSession = target.closest("[aria-label=\"新建会话\"], [aria-label=\"New session\"]");
				if (row !== null || newSession !== null) setTutorView("chat");
			};
			const navigate = (next) => {
				const hash = toHash(next);
				if (window.location.hash === hash) setView(next);
				else window.location.hash = hash;
			};
			const onSearch = (event) => {
				event.preventDefault();
				const q = query.trim();
				if (q !== "") navigate({
					kind: "search",
					q
				});
			};
			const tutor = tutorOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
				className: ReaderRoot_module_css_default.tutor,
				style: { width: `${tutorWidth}px` },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: ReaderRoot_module_css_default.tutorResize,
						onPointerDown: onTutorResizeStart,
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ReaderRoot_module_css_default.tutorHead,
						children: [
							tutorView === "chat" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ReaderRoot_module_css_default.tutorBack,
								onClick: () => {
									setTutorView("list");
								},
								title: t("tutor.back"),
								"aria-label": t("tutor.back"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutline14, {})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: tutorView === "chat" ? t("tutor.title") : t("tutor.sessions") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ReaderRoot_module_css_default.tutorMinimize,
								onClick: () => {
									setTutorOpen(false);
									localStorage.setItem(TUTOR_OPEN_KEY, "0");
								},
								title: t("tutor.close"),
								"aria-label": t("tutor.close"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
									width: "12",
									height: "12",
									viewBox: "0 0 12 12",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("line", {
										x1: "2",
										y1: "9.5",
										x2: "10",
										y2: "9.5",
										stroke: "currentColor",
										strokeWidth: "1.5",
										strokeLinecap: "round"
									})
								})
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: ReaderRoot_module_css_default.tutorBody,
						children: tutorView === "chat" ? renderSlot("conversation", {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: ReaderRoot_module_css_default.tutorWorkspace,
							onClick: onSessionListClick,
							children: renderSlot("sidebar", {
								collapsed: false,
								width: tutorWidth
							})
						})
					})
				]
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: ReaderRoot_module_css_default.tutorOpen,
				onClick: () => {
					setTutorOpen(true);
					localStorage.setItem(TUTOR_OPEN_KEY, "1");
				},
				children: t("tutor.open")
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: sidebarCollapsed ? `${ReaderRoot_module_css_default.shell} ${ReaderRoot_module_css_default.shellCollapsed}` : ReaderRoot_module_css_default.shell,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("nav", {
						className: sidebarCollapsed ? `${ReaderRoot_module_css_default.tree} ${ReaderRoot_module_css_default.treeCollapsed}` : ReaderRoot_module_css_default.tree,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: ReaderRoot_module_css_default.topRow,
							children: [!sidebarCollapsed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: ReaderRoot_module_css_default.langSwitch,
								role: "radiogroup",
								"aria-label": "Language",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: localeId === "zh" ? `${ReaderRoot_module_css_default.langThumb} ${ReaderRoot_module_css_default.langThumbZh}` : ReaderRoot_module_css_default.langThumb }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										role: "radio",
										"aria-checked": localeId === "zh",
										className: localeId === "zh" ? ReaderRoot_module_css_default.langOptionActive : ReaderRoot_module_css_default.langOption,
										onClick: () => {
											setLocaleId("zh");
											locale.set("zh");
										},
										children: "中文"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										role: "radio",
										"aria-checked": localeId === "en",
										className: localeId === "en" ? ReaderRoot_module_css_default.langOptionActive : ReaderRoot_module_css_default.langOption,
										onClick: () => {
											setLocaleId("en");
											locale.set("en");
										},
										children: "EN"
									})
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ReaderRoot_module_css_default.sidebarToggle,
								"aria-label": sidebarCollapsed ? "展开目录" : "折叠目录",
								title: sidebarCollapsed ? "展开目录" : "折叠目录",
								onClick: toggleSidebar,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPanelLeftOutline16, { size: sidebarCollapsed ? 18 : 16 })
							})]
						}), !sidebarCollapsed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: ReaderRoot_module_css_default.brand,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", { children: t("title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("tagline") })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
								onSubmit: onSearch,
								className: ReaderRoot_module_css_default.searchForm,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { className: ReaderRoot_module_css_default.searchIcon }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									value: query,
									onChange: (event) => {
										setQuery(event.target.value);
									},
									placeholder: t("search.placeholder"),
									"aria-label": t("search.placeholder")
								})]
							}),
							loadError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: ReaderRoot_module_css_default.error,
								children: loadError
							}),
							index === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: ReaderRoot_module_css_default.loading,
								children: "…"
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Tree, {
								index,
								locale: localeId === "zh" ? "zh" : "en",
								current: view,
								onOpen: navigate
							}),
							!curationCurrent && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: ReaderRoot_module_css_default.updateBanner,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("update.banner") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: updateState === "done",
									onClick: () => {
										startCuratorSession(openSession).then((ok) => {
											if (ok) setUpdateState("done");
										});
										setTutorOpen(true);
									},
									children: updateState === "done" ? t("update.done") : t("update.button")
								})]
							})
						] })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("main", {
						className: ReaderRoot_module_css_default.main,
						ref: mainRef,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MainPane, {
							index,
							locale: localeId === "zh" ? "zh" : "en",
							view,
							onNavigate: navigate,
							openSession,
							t,
							translationBindings,
							onOpenTranslation: (sessionId) => {
								try {
									openSession(sessionId);
								} catch {}
								setTutorView("chat");
							},
							onTranslationBound: refreshTranslations
						})
					}),
					tutor
				]
			});
		}
		/** Module tree with per-module document lists; modules collapse like folders. */
		function Tree(props) {
			const { index, locale, current, onOpen } = props;
			const [collapsed, setCollapsed] = (0, react.useState)(() => new Set(index.modules.filter((m) => m.id !== "overview").map((m) => m.id)));
			const [collapsedDates, setCollapsedDates] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const toggleDate = (key) => {
				setCollapsedDates((prev) => {
					const next = new Set(prev);
					if (next.has(key)) next.delete(key);
					else next.add(key);
					return next;
				});
			};
			const modules = index.modules;
			const toggle = (id) => {
				setCollapsed((prev) => {
					const next = new Set(prev);
					if (next.has(id)) next.delete(id);
					else next.add(id);
					return next;
				});
			};
			const listRef = (0, react.useRef)(null);
			useAutoHideScrollbar(listRef);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ReaderRoot_module_css_default.treeList,
				ref: listRef,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: current.kind === "home" ? `${ReaderRoot_module_css_default.treeHome} ${ReaderRoot_module_css_default.treeHomeActive}` : ReaderRoot_module_css_default.treeHome,
					onClick: () => {
						onOpen({ kind: "home" });
					},
					children: locale === "zh" ? "首页" : "Home"
				}), modules.map((module) => {
					const isCollapsed = collapsed.has(module.id);
					const docs = Object.values(index.documents).filter((doc) => doc.module === module.id).sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id));
					const title = module.title[locale] ?? module.title.en ?? module.id;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: ReaderRoot_module_css_default.treeModule,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ReaderRoot_module_css_default.treeModuleTitle,
							onClick: () => {
								toggle(module.id);
							},
							"aria-expanded": !isCollapsed,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTriangleRightFill14, { className: isCollapsed ? ReaderRoot_module_css_default.arrow : `${ReaderRoot_module_css_default.arrow} ${ReaderRoot_module_css_default.arrowOpen}` }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ReaderRoot_module_css_default.treeModuleLabel,
								children: title
							})]
						}), !isCollapsed && renderDocs(docs, module.id, current, onOpen, locale, collapsedDates, toggleDate)]
					}, module.id);
				})]
			});
		}
		/** Render a module's document list; Agent Notes modules group rows by date (descending). */
		function renderDocs(docs, moduleId, current, onOpen, locale, collapsedDates, toggleDate) {
			if (docs.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: ReaderRoot_module_css_default.treeEmpty,
				children: "—"
			});
			const row = (doc) => {
				let label = (doc.variants[locale] ?? doc.variants.en)?.title ?? doc.id;
				if (doc.kind === "agent-note") label = label.replace(/^Agent Note[：:]\s*/i, "");
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: current.kind === "doc" && current.id === doc.id ? `${ReaderRoot_module_css_default.treeDoc} ${ReaderRoot_module_css_default.treeDocActive}` : ReaderRoot_module_css_default.treeDoc,
					onClick: () => {
						onOpen({
							kind: "doc",
							id: doc.id
						});
					},
					title: doc.sourcePath,
					children: label
				}, doc.id);
			};
			if (!moduleId.startsWith("notes-")) return docs.map(row);
			const dated = docs.filter((doc) => doc.date !== void 0);
			const undated = docs.filter((doc) => doc.date === void 0).sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id));
			const groups = /* @__PURE__ */ new Map();
			for (const doc of dated) {
				const bucket = groups.get(doc.date);
				if (bucket === void 0) groups.set(doc.date, [doc]);
				else bucket.push(doc);
			}
			const dateBlocks = [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([date, groupDocs]) => {
				const key = `${moduleId}:${date}`;
				const dateCollapsed = collapsedDates.has(key);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: ReaderRoot_module_css_default.treeDateLabel,
					onClick: () => {
						toggleDate(key);
					},
					"aria-expanded": !dateCollapsed,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTriangleRightFill14, { className: dateCollapsed ? ReaderRoot_module_css_default.arrow : `${ReaderRoot_module_css_default.arrow} ${ReaderRoot_module_css_default.arrowOpen}` }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: date })]
				}), !dateCollapsed && groupDocs.map(row)] }, key);
			});
			return [...undated.map(row), ...dateBlocks];
		}
		/** Central pane: home, article, or search results. */
		function MainPane(props) {
			const { index, locale, view, onNavigate, openSession, t, translationBindings, onOpenTranslation, onTranslationBound } = props;
			if (view.kind === "search") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SearchPane, {
				q: view.q,
				onOpen: onNavigate
			});
			if (view.kind === "doc") {
				if (index === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: ReaderRoot_module_css_default.pane,
					children: t("article.notFound")
				});
				const doc = index.documents[view.id];
				if (doc === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: ReaderRoot_module_css_default.pane,
					children: t("article.notFound")
				});
				const binding = translationBindings[view.id];
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArticlePane, {
					doc,
					locale,
					...view.anchor !== void 0 ? { anchor: view.anchor } : {},
					openSession,
					t,
					...binding !== void 0 ? { translationBinding: binding } : {},
					onOpenTranslation,
					onTranslationBound
				}, view.id);
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HomePane, {
				index,
				locale,
				onOpen: onNavigate,
				t
			});
		}
		/** Home: module cards. */
		function HomePane(props) {
			const { index, locale, onOpen, t } = props;
			if (index === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: `${ReaderRoot_module_css_default.pane} ${ReaderRoot_module_css_default.loading}`,
				children: "…"
			});
			const modules = index.modules;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ReaderRoot_module_css_default.pane,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("home.welcome") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("home.guide") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: ReaderRoot_module_css_default.homeGrid,
						children: modules.map((module) => {
							const docs = Object.values(index.documents).filter((doc) => doc.module === module.id);
							const title = module.title[locale] ?? module.title.en ?? module.id;
							const description = module.description[locale] ?? module.description.en ?? "";
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: ReaderRoot_module_css_default.homeCard,
								onClick: () => {
									if (docs[0] !== void 0) onOpen({
										kind: "doc",
										id: docs[0].id
									});
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: title }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: description }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("em", { children: [docs.length, " docs"] })
								]
							}, module.id);
						})
					})
				]
			});
		}
		/** Article: title + markdown body + section nav. */
		function ArticlePane(props) {
			const { doc, locale, anchor, openSession, t, translationBinding, onOpenTranslation, onTranslationBound } = props;
			const [full, setFull] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				let cancelled = false;
				setFull(null);
				fetchDoc(doc.id).then((result) => {
					if (!cancelled) setFull(result.doc);
				}).catch(() => {});
				return () => {
					cancelled = true;
				};
			}, [doc.id]);
			const effective = full ?? doc;
			const variant = effective.variants[locale] ?? effective.variants.en ?? null;
			const usedFallback = variant !== null && effective.variants[locale] === void 0;
			const bodyRef = useArticleAnchor(anchor);
			if (variant === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: ReaderRoot_module_css_default.pane,
				children: t("article.notFound")
			});
			const translateAction = translationBinding !== void 0 ? {
				label: t("article.adjustTranslation"),
				onClick: () => {
					onOpenTranslation(translationBinding.sessionId);
				}
			} : usedFallback ? {
				label: locale === "zh" ? "翻译为中文" : "翻译为 English",
				onClick: () => {
					startTranslationSession(effective, locale, openSession).then((ok) => {
						if (ok) onTranslationBound();
					});
				}
			} : null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ReaderRoot_module_css_default.articleLayout,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: ReaderRoot_module_css_default.tocSlot,
					children: variant.sections.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("nav", {
						className: ReaderRoot_module_css_default.tocRail,
						"aria-label": t("article.sections"),
						children: variant.sections.map((section, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
							href: toHash({
								kind: "doc",
								id: doc.id,
								anchor: section.anchor
							}),
							className: ReaderRoot_module_css_default.tocTick,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: ReaderRoot_module_css_default.tickPreview,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: ReaderRoot_module_css_default.tickIndex,
										children: String(index + 1).padStart(2, "0")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: section.heading }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: stripMarkdown(section.body).slice(0, 90) })
								]
							})
						}, section.anchor))
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
					className: ReaderRoot_module_css_default.article,
					ref: bodyRef,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: ReaderRoot_module_css_default.articleHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: variant.title }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: ReaderRoot_module_css_default.articleMeta,
								children: [
									effective.kind,
									" · ",
									effective.sourcePath,
									effective.updatedAt !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
										" · ",
										locale === "zh" ? "更新于 " : "Updated ",
										effective.updatedAt.slice(0, 10)
									] })
								]
							}),
							usedFallback && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: ReaderRoot_module_css_default.fallback,
								children: t("article.fallbackLocale")
							}) }),
							translateAction !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ReaderRoot_module_css_default.translateBtn,
								onClick: translateAction.onClick,
								children: translateAction.label
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: ReaderRoot_module_css_default.articleBody,
						children: full === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: ReaderRoot_module_css_default.loading,
							children: "…"
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, { text: htmlToMarkdown(variant.body ?? "", doc.id) })
					})]
				})]
			});
		}
		/** Scroll to the heading whose text matches the hash anchor. */
		function useArticleAnchor(anchor) {
			const ref = { current: null };
			(0, react.useEffect)(() => {
				if (anchor === void 0 || anchor === "") return;
				const root = ref.current;
				if (root === null) return;
				const needle = anchor.toLocaleLowerCase();
				const target = Array.from(root.querySelectorAll("h2, h3, h4")).find((heading) => {
					const text = heading.textContent?.trim().toLocaleLowerCase() ?? "";
					return text === needle || text.includes(needle);
				});
				if (target !== void 0) target.scrollIntoView({ block: "start" });
			}, [anchor]);
			return ref;
		}
		/** Search results. */
		function SearchPane(props) {
			const { q, onOpen } = props;
			const [result, setResult] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				let cancelled = false;
				setResult(null);
				setError(null);
				fetchSearch(q).then((value) => {
					if (cancelled) return;
					setResult({
						hits: value.result.hits,
						total: value.result.total
					});
				}).catch((err) => {
					if (!cancelled) setError(err instanceof Error ? err.message : String(err));
				});
				return () => {
					cancelled = true;
				};
			}, [q]);
			if (error !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: `${ReaderRoot_module_css_default.pane} ${ReaderRoot_module_css_default.error}`,
				children: error
			});
			if (result === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: `${ReaderRoot_module_css_default.pane} ${ReaderRoot_module_css_default.loading}`,
				children: "…"
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: ReaderRoot_module_css_default.pane,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h3", { children: [
					q,
					" — ",
					result.total
				] }), result.hits.map((hit) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: ReaderRoot_module_css_default.hit,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ReaderRoot_module_css_default.hitTitle,
							onClick: () => {
								onOpen({
									kind: "doc",
									id: hit.id
								});
							},
							children: hit.title
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: ReaderRoot_module_css_default.hitMeta,
							children: [
								hit.module,
								" · ",
								hit.sourcePath
							]
						}),
						hit.sections.map((section) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ReaderRoot_module_css_default.hitSection,
							onClick: () => {
								window.location.hash = toHash({
									kind: "doc",
									id: hit.id,
									anchor: section.anchor
								});
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: section.heading }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: section.excerpt })]
						}, section.anchor))
					]
				}, hit.id))]
			});
		}
		/** Session-RPC envelope over the /api bridge (same shape as the connection client). */
		async function sessionRpc(method, payload) {
			const result = (await (await fetch(`/api/${method}`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					type: "client-request",
					rpcId: `dsh101-${Math.random().toString(36).slice(2)}`,
					method,
					payload
				})
			})).json()).result;
			return {
				ok: result?.ok === true,
				...result?.value !== void 0 ? { value: result.value } : {}
			};
		}
		/**
		* Create the curator session: a fresh session renamed to the update title,
		* prompted with the curator trigger marker, and opened in the tutor panel.
		*/
		async function startCuratorSession(openSession) {
			try {
				const created = await sessionRpc("session.create", {});
				const sessionId = created.ok ? created.value?.sessionId : void 0;
				if (sessionId === void 0) return false;
				await sessionRpc("session.rename", {
					sessionId,
					title: "DSH 101 更新"
				});
				await sessionRpc("session.prompt", {
					sessionId,
					mode: "queue",
					content: [{
						type: "text",
						text: "请按照 dsh-101-curator 技能检查并更新 DSH 101 的学习内容（触发标记：dsh-101-curator）。先查看语料状态，再发布新的策展覆盖层。"
					}]
				});
				try {
					openSession(sessionId);
				} catch {}
				return true;
			} catch {
				return false;
			}
		}
		/** Scan a conversation snapshot for an unhandled successful dsh101_open tool result. */
		function findOpenNavigation(snapshot, handled) {
			if (typeof snapshot !== "object" || snapshot === null) return null;
			const nodes = snapshot.nodes;
			if (!Array.isArray(nodes)) return null;
			for (const node of nodes) {
				if (typeof node !== "object" || node === null) continue;
				const entry = node;
				if (entry.kind !== "tool-result" || entry.isError === true) continue;
				if (entry.call?.name !== "dsh101_open") continue;
				if (entry.seq === void 0 || handled.has(String(entry.seq))) continue;
				const text = Array.isArray(entry.content) ? entry.content.filter((block) => typeof block === "object" && block !== null && block.type === "text" && typeof block.text === "string").map((block) => block.text ?? "").join("\n") : "";
				const match = /(#\/doc\/[^\s"']+)/.exec(text);
				if (match !== null) {
					handled.add(String(entry.seq));
					return { hash: match[1] };
				}
			}
			return null;
		}
		/** Rewrite a document-relative image src to the corpus image route. */
		function rewriteImageSrc(src, docId) {
			if (/^(https?:|data:)/.test(src)) return src;
			const base = src.split("/").pop() ?? src;
			return `${window.location.origin}/api/dsh101/img/${encodeURIComponent(docId)}--${encodeURIComponent(base)}`;
		}
		/**
		* Convert the inline HTML the corpus docs occasionally use (links, images,
		* emphasis, line breaks) into markdown the reader renders, and rewrite
		* document-relative image paths to the corpus image route. Raw HTML is
		* otherwise emitted verbatim as literal text by the markdown renderer.
		*/
		function htmlToMarkdown(text, docId) {
			let out = text.replace(/^\s*(?:\[?English\]?\([^)]*\)\s*\|\s*\[?中文\]?\([^)]*\)|\[?English\]?\([^)]*\)\s*\|\s*中文|English\s*\|\s*中文)\s*$/gim, "");
			out = out.replace(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => `[${label.trim()}](${href})`);
			out = out.replace(/<a\s+id="[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, "$1");
			out = out.replace(/<img\s+([^>]*?)\/?>\s*/gi, (_m, attrs) => {
				const src = /src="([^"]+)"/i.exec(attrs)?.[1] ?? "";
				const alt = /alt="([^"]+)"/i.exec(attrs)?.[1] ?? "";
				return src === "" ? "" : `![${alt}](${rewriteImageSrc(src, docId)})`;
			});
			out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => `![${alt}](${rewriteImageSrc(src.trim(), docId)})`);
			out = out.replace(/<strong>([\s\S]*?)<\/strong>/gi, "**$1**");
			out = out.replace(/<em>([\s\S]*?)<\/em>/gi, "*$1*");
			out = out.replace(/<code>([\s\S]*?)<\/code>/gi, "`$1`");
			out = out.replace(/<br\s*\/?>/gi, "\n");
			out = out.replace(/<\/?p[^>]*>/gi, "\n");
			return out;
		}
		/**
		* Overlay-style scrollbar: the thumb shows while scrolling and fades out
		* `delayMs` after the last scroll event (the common ~1s convention).
		*/
		function useAutoHideScrollbar(ref, delayMs = 1e3) {
			(0, react.useEffect)(() => {
				const el = ref.current;
				if (el === null) return;
				let timer;
				const visibleClass = ReaderRoot_module_css_default.scrollbarVisible;
				const show = () => {
					if (visibleClass !== void 0) el.classList.add(visibleClass);
					window.clearTimeout(timer);
					timer = window.setTimeout(() => {
						if (visibleClass !== void 0) el.classList.remove(visibleClass);
					}, delayMs);
				};
				el.addEventListener("scroll", show, { passive: true });
				return () => {
					el.removeEventListener("scroll", show);
					window.clearTimeout(timer);
				};
			}, [delayMs]);
		}
		/**
		* Start a translation session: a fresh ordinary session whose first prompt
		* asks the agent to translate the document per the corpus translation
		* rules and persist it with dsh101_save_translation (user home only). The
		* session is bound to the document (host-persisted), so a later visit can
		* reopen the same conversation to adjust the translation.
		*/
		async function startTranslationSession(doc, targetLocale, openSession) {
			try {
				const created = await sessionRpc("session.create", {});
				const sessionId = created.ok ? created.value?.sessionId : void 0;
				if (sessionId === void 0) return false;
				const variant = doc.variants.en ?? doc.variants.zh;
				const sourceName = doc.variants.en !== void 0 ? "English" : "Chinese";
				const targetName = targetLocale === "zh" ? "Chinese" : "English";
				await sessionRpc("session.rename", {
					sessionId,
					title: `翻译：${variant?.title ?? doc.id}`
				});
				await sessionRpc("session.prompt", {
					sessionId,
					mode: "queue",
					content: [{
						type: "text",
						text: [
							`请把 DSH 101 文档 ${doc.id}（${variant?.title ?? doc.id}）从 ${sourceName} 翻译成 ${targetName}。`,
							"步骤：",
							`1. 用 dsh101_read 读取文档 ${doc.id}（源文）。`,
							"2. 用 dsh101_read 读取 docs--i18n--translation-prompt：这是仓库的翻译 prompt 模板，",
							"   请严格按模板要求翻译（模板占位符：{{source_lang}}=" + sourceName + "，{{target_lang}}=" + targetName + "，",
							"   {{terminology}}=docs--i18n--terminology 的术语表全文）。",
							"3. 按模板协议输出三段 XML 译文，保存时取 <final> 段的纯 markdown。",
							"4. 用 dsh101_save_translation 保存：docId=" + doc.id + ", locale=" + targetLocale + ", translation=<final> 段的完整 markdown（含标题行）。",
							"保存成功后回复\"翻译已保存\"。"
						].join("\n")
					}]
				});
				await bindTranslation({
					docId: doc.id,
					sessionId,
					locale: targetLocale,
					title: `翻译：${variant?.title ?? doc.id}`
				}).catch(() => {});
				try {
					openSession(sessionId);
				} catch {}
				return true;
			} catch {
				return false;
			}
		}
		/** Crude markdown strip for the rail preview card (codes, links, emphasis). */
		function stripMarkdown(text) {
			return text.replace(/```[\s\S]*?```/g, " ").replace(/`([^`]*)`/g, "$1").replace(/![\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/^#{1,6}\s+/gm, "").replace(/[*_~>|]/g, "").replace(/\s+/g, " ").trim();
		}
		//#endregion
		//#region src/client/theme.ts
		/** Body attribute selecting the dark base palette in the token stylesheets. */
		const DARK_ATTRIBUTE = "data-ds-dark-theme";
		/** Applies theme snapshots to the document; one instance per plugin fiber. */
		var ReaderThemePresenter = class {
			appliedTokens = [];
			apply(snapshot) {
				const scheme = snapshot.active.colorScheme;
				document.documentElement.style.colorScheme = scheme;
				const body = document.body;
				if (scheme === "dark") body.setAttribute(DARK_ATTRIBUTE, "");
				else body.removeAttribute(DARK_ATTRIBUTE);
				for (const name of this.appliedTokens) body.style.removeProperty(name);
				this.appliedTokens = [];
				for (const [name, value] of Object.entries(snapshot.active.tokens)) {
					body.style.setProperty(name, value);
					this.appliedTokens.push(name);
				}
			}
			dispose() {
				document.documentElement.style.removeProperty("color-scheme");
				const body = document.body;
				body.removeAttribute(DARK_ATTRIBUTE);
				for (const name of this.appliedTokens) body.style.removeProperty(name);
				this.appliedTokens = [];
			}
		};
		//#endregion
		//#region src/client/index.ts
		/** Services required by the browser half. */
		const inject = [
			"slots",
			"locale",
			"theme",
			"sessions"
		];
		/** The reader root's panel face: no sidebar/details chrome in the reader, so the transitions are no-ops. */
		var ReaderLayout = class {
			toggleSidebar() {}
			openDetails() {}
			closeDetails() {}
		};
		/**
		* Mount the reader shell.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const layout = new ReaderLayout();
			ctx.effect(() => {
				const disposeService = ctx.reflect.provide("layout", layout);
				const disposeRegistration = ctx.slots.register({
					name: "root",
					locale: NS,
					children: {
						"conversation": {
							kind: "single",
							scope: "session-maybe"
						},
						"details": {
							kind: "single",
							scope: "session"
						},
						"sidebar": {
							kind: "single",
							scope: "root"
						}
					},
					inject: () => ({
						locale: {
							getSnapshot: () => ctx.locale.getLocale().active,
							subscribe: (fn) => ctx.locale.subscribe(fn),
							set: (id) => {
								ctx.locale.setLocale(id);
							}
						},
						openSession: (id) => {
							ctx.sessions.open(id);
						},
						subscribeConversation: (cb) => {
							let current;
							let offSnapshot;
							const sync = () => {
								const next = ctx.sessions.list.getSnapshot().current;
								if (next === current) return;
								offSnapshot?.();
								offSnapshot = void 0;
								current = next;
								if (next === void 0) return;
								const binding = ctx.sessions.binding(next);
								if (binding === void 0) return;
								offSnapshot = binding.session.subscribe(() => {
									cb(binding.session.getSnapshot());
								});
								cb(binding.session.getSnapshot());
							};
							sync();
							const offList = ctx.sessions.list.subscribe(sync);
							return () => {
								offList();
								offSnapshot?.();
							};
						},
						subscribeSessionList: (cb) => {
							const emit = () => {
								const state = ctx.sessions.list.getSnapshot();
								const rows = [];
								for (const id of state.ids) {
									const row = state.byId[id];
									if (row === void 0) continue;
									rows.push({
										id: String(id),
										title: row.displayTitle,
										updatedAt: row.updatedAt,
										current: state.current === id
									});
								}
								rows.sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
								cb({ rows });
							};
							emit();
							return ctx.sessions.list.subscribe(emit);
						}
					})
				}, ReaderRoot);
				return () => {
					disposeRegistration();
					disposeService();
				};
			}, "dsh-101-app: service + root registration");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-101-app: dictionaries");
			ctx.effect(() => {
				const presenter = new ReaderThemePresenter();
				presenter.apply(ctx.theme.getTheme());
				const off = ctx.on("theme/change", (snapshot) => {
					presenter.apply(snapshot);
				});
				return () => {
					off();
					presenter.dispose();
				};
			}, "dsh-101-app: theme presenter");
		}
		//#endregion
		exports.NS = NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map