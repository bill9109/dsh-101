//#region types/core/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-101-core`.
* @module @deepseek-ai/dsh-101-core/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-101-core";
/** Cordis companion plugin name. */
const name = "dsh-101-core-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/** No runtime invariant: a pure library package; the corpus/searcher units are behavior-tested directly. */
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
