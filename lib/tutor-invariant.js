//#region types/tutor/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-101-tutor`.
* @module @deepseek-ai/dsh-101-tutor/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-101-tutor";
/** Cordis companion plugin name. */
const name = "dsh-101-tutor-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant today: the tools, skill registration, and curator
* gating are behavior-tested directly; the companion reserves the package
* name for future cross-plugin invariants.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
