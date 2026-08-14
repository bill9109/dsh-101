import { a as buildSearchIndex, b as parseMarkdownVariant, g as serializeCuration, h as parseCurationFile, l as CURATION_FILE_NAME, m as parseCorpusIndex, o as searchCorpus, p as mergeCuration, t as CORPUS_LOCALES, u as CURATION_HOME_DIR } from "./core-xQuT5Wq_.js";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
//#region vendor/cosmokit/lib/index.js
/** Return true when a value is `null` or `undefined`. */
function isNullable(value) {
	return value === null || value === void 0;
}
/** Return true for non-array object values. */
function isPlainObject(data) {
	return data && typeof data === "object" && !Array.isArray(data);
}
/** Filter object entries and return a new object. */
function filterKeys(object, filter) {
	return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
}
/** Map object values while preserving the original key set. */
function mapValues(object, transform) {
	return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
/** Pick selected keys from an object, optionally including `undefined` values. */
function pick(source, keys, forced) {
	if (!keys) return { ...source };
	const result = {};
	for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
	return result;
}
/** Test values using `instanceof` with a `toStringTag` fallback. */
function is(type, value) {
	if (arguments.length === 1) return (value) => is(type, value);
	return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
	return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
	return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
/** Binary source detection and base64/hex conversion helpers. */
var Binary;
(function(Binary) {
	Binary.is = isArrayBufferLike;
	Binary.isSource = isArrayBufferSource;
	function fromSource(source) {
		if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
		else return source;
	}
	Binary.fromSource = fromSource;
	function toBase64(source) {
		source = fromSource(source);
		if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
		let binary = "";
		const bytes = new Uint8Array(source);
		for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
		return btoa(binary);
	}
	Binary.toBase64 = toBase64;
	function fromBase64(source) {
		if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
		return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
	}
	Binary.fromBase64 = fromBase64;
	function toHex(source) {
		source = fromSource(source);
		if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
		return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
	}
	Binary.toHex = toHex;
	function fromHex(source) {
		if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
		const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
		const buffer = [];
		for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
		return Uint8Array.from(buffer).buffer;
	}
	Binary.fromHex = fromHex;
})(Binary || (Binary = {}));
Binary.fromBase64;
Binary.toBase64;
Binary.fromHex;
Binary.toHex;
/** Deep-clone common JavaScript values while preserving prototypes and cycles. */
function clone(source, refs = /* @__PURE__ */ new Map()) {
	if (!source || typeof source !== "object") return source;
	if (is("Date", source)) return new Date(source.valueOf());
	if (is("RegExp", source)) return new RegExp(source.source, source.flags);
	if (isArrayBufferLike(source)) return source.slice(0);
	if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
	const cached = refs.get(source);
	if (cached) return cached;
	if (Array.isArray(source)) {
		const result = [];
		refs.set(source, result);
		source.forEach((value, index) => {
			result[index] = Reflect.apply(clone, null, [value, refs]);
		});
		return result;
	}
	const result = Object.create(Object.getPrototypeOf(source));
	refs.set(source, result);
	for (const key of Reflect.ownKeys(source)) {
		const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
		if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
		Reflect.defineProperty(result, key, descriptor);
	}
	return result;
}
/** Deeply compare arrays, dates, regexps, buffers, and plain object fields. */
function deepEqual(a, b, strict) {
	if (a === b) return true;
	if (!strict && isNullable(a) && isNullable(b)) return true;
	if (typeof a !== typeof b) return false;
	if (typeof a !== "object") return false;
	if (!a || !b) return false;
	function check(test, then) {
		return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
	}
	return check(Array.isArray, (a, b) => a.length === b.length && a.every((item, index) => deepEqual(item, b[index]))) ?? check(is("Date"), (a, b) => a.valueOf() === b.valueOf()) ?? check(is("RegExp"), (a, b) => a.source === b.source && a.flags === b.flags) ?? check(isArrayBufferLike, (a, b) => {
		if (a.byteLength !== b.byteLength) return false;
		const viewA = new Uint8Array(a);
		const viewB = new Uint8Array(b);
		for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
		return true;
	}) ?? Object.keys({
		...a,
		...b
	}).every((key) => deepEqual(a[key], b[key], strict));
}
/** Time constants plus parsing and formatting helpers. */
var Time;
(function(Time) {
	Time.millisecond = 1;
	Time.second = 1e3;
	Time.minute = Time.second * 60;
	Time.hour = Time.minute * 60;
	Time.day = Time.hour * 24;
	Time.week = Time.day * 7;
	let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
	function setTimezoneOffset(offset) {
		timezoneOffset = offset;
	}
	Time.setTimezoneOffset = setTimezoneOffset;
	function getTimezoneOffset() {
		return timezoneOffset;
	}
	Time.getTimezoneOffset = getTimezoneOffset;
	function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
		if (typeof date === "number") date = new Date(date);
		if (offset === void 0) offset = timezoneOffset;
		return Math.floor((date.valueOf() / Time.minute - offset) / 1440);
	}
	Time.getDateNumber = getDateNumber;
	function fromDateNumber(value, offset) {
		const date = new Date(value * Time.day);
		if (offset === void 0) offset = timezoneOffset;
		return new Date(+date + offset * Time.minute);
	}
	Time.fromDateNumber = fromDateNumber;
	const numeric = /\d+(?:\.\d+)?/.source;
	const timeRegExp = new RegExp(`^${[
		"w(?:eek(?:s)?)?",
		"d(?:ay(?:s)?)?",
		"h(?:our(?:s)?)?",
		"m(?:in(?:ute)?(?:s)?)?",
		"s(?:ec(?:ond)?(?:s)?)?"
	].map((unit) => `(${numeric}${unit})?`).join("")}$`);
	function parseTime(source) {
		const capture = timeRegExp.exec(source);
		if (!capture) return 0;
		return (parseFloat(capture[1]) * Time.week || 0) + (parseFloat(capture[2]) * Time.day || 0) + (parseFloat(capture[3]) * Time.hour || 0) + (parseFloat(capture[4]) * Time.minute || 0) + (parseFloat(capture[5]) * Time.second || 0);
	}
	Time.parseTime = parseTime;
	function parseDate(date) {
		const parsed = parseTime(date);
		if (parsed) date = Date.now() + parsed;
		else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
		else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
		return date ? new Date(date) : /* @__PURE__ */ new Date();
	}
	Time.parseDate = parseDate;
	function format(ms) {
		const abs = Math.abs(ms);
		if (abs >= Time.day - Time.hour / 2) return Math.round(ms / Time.day) + "d";
		else if (abs >= Time.hour - Time.minute / 2) return Math.round(ms / Time.hour) + "h";
		else if (abs >= Time.minute - Time.second / 2) return Math.round(ms / Time.minute) + "m";
		else if (abs >= Time.second) return Math.round(ms / Time.second) + "s";
		return ms + "ms";
	}
	Time.format = format;
	function toDigits(source, length = 2) {
		return source.toString().padStart(length, "0");
	}
	Time.toDigits = toDigits;
	function template(template, time = /* @__PURE__ */ new Date()) {
		return template.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
	}
	Time.template = template;
})(Time || (Time = {}));
//#endregion
//#region vendor/schemastery/lib/index.mjs
const kSchema = Symbol.for("schemastery");
const kValidationError = Symbol.for("ValidationError");
globalThis.__schemastery_index__ ??= 0;
globalThis.__schemastery_refs__ = void 0;
var ValidationError = class extends TypeError {
	options;
	name = "ValidationError";
	constructor(message, options) {
		let prefix = "$";
		for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
		else if (typeof segment === "number") prefix += "[" + segment + "]";
		else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
		if (prefix.startsWith(".")) prefix = prefix.slice(1);
		super((prefix === "$" ? "" : `${prefix} `) + message);
		this.options = options;
	}
	static is(error) {
		return !!error?.[kValidationError];
	}
};
Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
const Schema = function(options) {
	const schema = function(data, options = {}) {
		return Schema.resolve(data, schema, options)[0];
	};
	if (options.refs) {
		const refs = mapValues(options.refs, (options) => new Schema(options));
		const getRef = (uid) => refs[uid];
		for (const key in refs) {
			const options = refs[key];
			options.sKey = getRef(options.sKey);
			options.inner = getRef(options.inner);
			options.list = options.list && options.list.map(getRef);
			options.dict = options.dict && mapValues(options.dict, getRef);
		}
		return refs[options.uid];
	}
	Object.assign(schema, options);
	if (typeof schema.callback === "string") try {
		schema.callback = new Function("return " + schema.callback)();
	} catch {}
	Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
	Object.setPrototypeOf(schema, Schema.prototype);
	schema.meta ||= {};
	schema.toString = schema.toString.bind(schema);
	return schema;
};
Schema.prototype = Object.create(Function.prototype);
Schema.prototype[kSchema] = true;
Object.defineProperty(Schema.prototype, "~standard", { get() {
	return {
		version: 1,
		vendor: "schemastery",
		validate: (value) => {
			try {
				return { value: Schema.resolve(value, this, {})[0] };
			} catch (error) {
				if (ValidationError.is(error)) return { issues: [{
					message: error.message,
					path: error.options.path
				}] };
				throw error;
			}
		}
	};
} });
Schema.ValidationError = ValidationError;
Schema.prototype.toJSON = function toJSON() {
	if (globalThis.__schemastery_refs__) {
		globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
		return this.uid;
	}
	globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
	globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
	const result = {
		uid: this.uid,
		refs: globalThis.__schemastery_refs__
	};
	globalThis.__schemastery_refs__ = void 0;
	return result;
};
Schema.prototype.set = function set(key, value) {
	this.dict[key] = value;
	return this;
};
Schema.prototype.push = function push(value) {
	this.list.push(value);
	return this;
};
function mergeDesc(original, messages) {
	const result = typeof original === "string" ? { "": original } : { ...original };
	for (const locale in messages) {
		const value = messages[locale];
		if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
		else if (typeof value === "string") result[locale] = value;
	}
	return result;
}
function getInner(value) {
	return value?.$value ?? value?.$inner;
}
function extractKeys(data) {
	return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
}
Schema.prototype.i18n = function i18n(messages) {
	const schema = Schema(this);
	const desc = mergeDesc(schema.meta.description, messages);
	if (Object.keys(desc).length) schema.meta.description = desc;
	if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
		return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
	});
	if (schema.list) schema.list = schema.list.map((inner, index) => {
		return inner.i18n(mapValues(messages, (data = {}) => {
			if (Array.isArray(getInner(data))) return getInner(data)[index];
			if (Array.isArray(data)) return data[index];
			return extractKeys(data);
		}));
	});
	if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
		if (getInner(data)) return getInner(data);
		return extractKeys(data);
	}));
	if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
	return schema;
};
Schema.prototype.extra = function extra(key, value) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		[key]: value
	};
	return schema;
};
for (const key of [
	"required",
	"disabled",
	"collapse",
	"hidden",
	"loose"
]) Object.assign(Schema.prototype, { [key](value = true) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		[key]: value
	};
	return schema;
} });
Schema.prototype.deprecated = function deprecated() {
	const schema = Schema(this);
	schema.meta.badges ||= [];
	schema.meta.badges.push({
		text: "deprecated",
		type: "danger"
	});
	return schema;
};
Schema.prototype.experimental = function experimental() {
	const schema = Schema(this);
	schema.meta.badges ||= [];
	schema.meta.badges.push({
		text: "experimental",
		type: "warning"
	});
	return schema;
};
Schema.prototype.pattern = function pattern(regexp) {
	const schema = Schema(this);
	const pattern = pick(regexp, ["source", "flags"]);
	schema.meta = {
		...schema.meta,
		pattern
	};
	return schema;
};
Schema.prototype.simplify = function simplify(value) {
	if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
	if (isNullable(value)) return value;
	if (this.type === "object" || this.type === "dict") {
		const result = {};
		for (const key in value) {
			const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
			if (this.type === "dict" || !isNullable(item)) result[key] = item;
		}
		if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
		return result;
	} else if (this.type === "array" || this.type === "tuple") {
		const result = [];
		value.forEach((value, index) => {
			const schema = this.type === "array" ? this.inner : this.list[index];
			const item = schema ? schema.simplify(value) : value;
			result.push(item);
		});
		return result;
	} else if (this.type === "intersect") {
		const result = {};
		for (const item of this.list) Object.assign(result, item.simplify(value));
		return result;
	} else if (this.type === "union") for (const schema of this.list) try {
		Schema.resolve(value, schema, {});
		return schema.simplify(value);
	} catch {}
	return value;
};
Schema.prototype.toString = function toString(inline) {
	return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
};
Schema.prototype.role = function role(role, extra) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		role,
		extra
	};
	return schema;
};
for (const key of [
	"default",
	"link",
	"comment",
	"description",
	"max",
	"min",
	"step"
]) Object.assign(Schema.prototype, { [key](value) {
	const schema = Schema(this);
	schema.meta = {
		...schema.meta,
		[key]: value
	};
	return schema;
} });
const resolvers = {};
Schema.extend = function extend(type, resolve) {
	resolvers[type] = resolve;
};
Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
	if (!schema) return [data];
	if (options.ignore?.(data, schema)) return [data];
	if (isNullable(data) && schema.type !== "lazy") {
		if (schema.meta.required) throw new ValidationError(`missing required value`, options);
		let current = schema;
		let fallback = schema.meta.default;
		while (current?.type === "intersect" && isNullable(fallback)) {
			current = current.list[0];
			fallback = current?.meta.default;
		}
		if (isNullable(fallback)) return [data];
		data = clone(fallback);
	}
	const callback = resolvers[schema.type];
	if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
	try {
		return callback(data, schema, options, strict);
	} catch (error) {
		if (!schema.meta.loose) throw error;
		return [schema.meta.default];
	}
};
Schema.from = function from(source) {
	if (isNullable(source)) return Schema.any();
	else if ([
		"string",
		"number",
		"boolean"
	].includes(typeof source)) return Schema.const(source).required();
	else if (source[kSchema]) return source;
	else if (typeof source === "function") switch (source) {
		case String: return Schema.string().required();
		case Number: return Schema.number().required();
		case Boolean: return Schema.boolean().required();
		case Function: return Schema.function().required();
		default: return Schema.is(source).required();
	}
	else throw new TypeError(`cannot infer schema from ${source}`);
};
Schema.lazy = function lazy(builder) {
	const toJSON = () => {
		if (!schema.inner[kSchema]) {
			schema.inner = schema.builder();
			schema.inner.meta = {
				...schema.meta,
				...schema.inner.meta
			};
		}
		return schema.inner.toJSON();
	};
	const schema = new Schema({
		type: "lazy",
		builder,
		inner: { toJSON }
	});
	return schema;
};
Schema.natural = function natural() {
	return Schema.number().step(1).min(0);
};
Schema.percent = function percent() {
	return Schema.number().step(.01).min(0).max(1).role("slider");
};
Schema.date = function date() {
	return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
		const date = new Date(value);
		if (isNaN(+date)) throw new ValidationError(`invalid date "${value}"`, options);
		return date;
	}, true)]);
};
Schema.regExp = function regExp(flag = "") {
	return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
		try {
			return new RegExp(value, flag);
		} catch (e) {
			throw new ValidationError(e.message, options);
		}
	}, true)]);
};
Schema.arrayBuffer = function arrayBuffer(encoding) {
	return Schema.union([
		Schema.is(ArrayBuffer),
		Schema.is(SharedArrayBuffer),
		Schema.transform(Schema.any(), (value, options) => {
			if (Binary.isSource(value)) return Binary.fromSource(value);
			throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
		}, true),
		...encoding ? [Schema.transform(Schema.string(), (value, options) => {
			try {
				return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
			} catch (e) {
				throw new ValidationError(e.message, options);
			}
		}, true)] : []
	]);
};
Schema.extend("lazy", (data, schema, options, strict) => {
	if (!schema.inner[kSchema]) {
		schema.inner = schema.builder();
		schema.inner.meta = {
			...schema.meta,
			...schema.inner.meta
		};
	}
	return Schema.resolve(data, schema.inner, options, strict);
});
Schema.extend("any", (data) => {
	return [data];
});
Schema.extend("never", (data, _, options) => {
	throw new ValidationError(`expected nullable but got ${data}`, options);
});
Schema.extend("const", (data, { value }, options) => {
	if (deepEqual(data, value)) return [value];
	throw new ValidationError(`expected ${value} but got ${data}`, options);
});
function checkWithinRange(data, meta, description, options, skipMin = false) {
	const { max = Infinity, min = -Infinity } = meta;
	if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
	if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
}
Schema.extend("string", (data, { meta }, options) => {
	if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
	if (meta.pattern) {
		const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
		if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
	}
	checkWithinRange(data.length, meta, "string length", options);
	return [data];
});
function decimalShift(data, digits) {
	const str = data.toString();
	if (str.includes("e")) return data * Math.pow(10, digits);
	const index = str.indexOf(".");
	if (index === -1) return data * Math.pow(10, digits);
	const frac = str.slice(index + 1);
	const integer = str.slice(0, index);
	if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
	return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
}
function isMultipleOf(data, min, step) {
	step = Math.abs(step);
	if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
	const index = step.toString().indexOf(".");
	const digits = step.toString().slice(index + 1).length;
	return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
}
Schema.extend("number", (data, { meta }, options) => {
	if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
	checkWithinRange(data, meta, "number", options);
	const { step } = meta;
	if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
	return [data];
});
Schema.extend("boolean", (data, _, options) => {
	if (typeof data === "boolean") return [data];
	throw new ValidationError(`expected boolean but got ${data}`, options);
});
Schema.extend("bitset", (data, { bits, meta }, options) => {
	let value = 0, keys = [];
	if (typeof data === "number") {
		value = data;
		for (const key in bits) if (data & bits[key]) keys.push(key);
	} else if (Array.isArray(data)) {
		keys = data;
		for (const key of keys) {
			if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
			if (key in bits) value |= bits[key];
		}
	} else throw new ValidationError(`expected number or array but got ${data}`, options);
	if (value === meta.default) return [value];
	return [value, keys];
});
Schema.extend("function", (data, _, options) => {
	if (typeof data === "function") return [data];
	throw new ValidationError(`expected function but got ${data}`, options);
});
Schema.extend("is", (data, { constructor }, options) => {
	if (typeof constructor === "function") {
		if (data instanceof constructor) return [data];
		throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
	} else {
		if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
		let prototype = Object.getPrototypeOf(data);
		while (prototype) {
			if (prototype.constructor?.name === constructor) return [data];
			prototype = Object.getPrototypeOf(prototype);
		}
		throw new ValidationError(`expected ${constructor} but got ${data}`, options);
	}
});
function property(data, key, schema, options) {
	try {
		const [value, adapted] = Schema.resolve(data[key], schema, {
			...options,
			path: [...options.path || [], key]
		});
		if (adapted !== void 0) data[key] = adapted;
		return value;
	} catch (e) {
		if (!options?.autofix) throw e;
		delete data[key];
		return schema.meta.default;
	}
}
Schema.extend("array", (data, { inner, meta }, options) => {
	if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
	checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
	return [data.map((_, index) => property(data, index, inner, options))];
});
Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
	if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
	const result = {};
	for (const key in data) {
		let rKey;
		try {
			rKey = Schema.resolve(key, sKey, options)[0];
		} catch (error) {
			if (strict) continue;
			throw error;
		}
		result[rKey] = property(data, key, inner, options);
		data[rKey] = data[key];
		if (key !== rKey) delete data[key];
	}
	return [result];
});
Schema.extend("tuple", (data, { list }, options, strict) => {
	if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
	const result = list.map((inner, index) => property(data, index, inner, options));
	if (strict) return [result];
	result.push(...data.slice(list.length));
	return [result];
});
function merge(result, data) {
	for (const key in data) {
		if (key in result) continue;
		result[key] = data[key];
	}
}
Schema.extend("object", (data, { dict }, options, strict) => {
	if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
	const result = {};
	for (const key in dict) {
		const value = property(data, key, dict[key], options);
		if (!isNullable(value) || key in data) result[key] = value;
	}
	if (!strict) merge(result, data);
	return [result];
});
Schema.extend("union", (data, { list, toString }, options, strict) => {
	const messages = [];
	for (const inner of list) try {
		return Schema.resolve(data, inner, options, strict);
	} catch (error) {
		messages.push(error);
	}
	throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
});
Schema.extend("intersect", (data, { list, toString }, options, strict) => {
	if (!list.length) return [data];
	let result;
	for (const inner of list) {
		const value = Schema.resolve(data, inner, options, true)[0];
		if (isNullable(value)) continue;
		if (isNullable(result)) result = value;
		else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
		else if (typeof value === "object") merge(result ??= {}, value);
		else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
	}
	if (!strict && isPlainObject(data)) merge(result, data);
	return [result];
});
Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
	const [result, adapted = data] = Schema.resolve(data, inner, options, true);
	if (preserve) return [callback(result)];
	else return [callback(result), callback(adapted)];
});
const formatters = {};
function defineMethod(name, keys, format) {
	formatters[name] = format;
	Object.assign(Schema, { [name](...args) {
		const schema = new Schema({ type: name });
		keys.forEach((key, index) => {
			switch (key) {
				case "sKey":
					schema.sKey = args[index] ?? Schema.string();
					break;
				case "inner":
					schema.inner = Schema.from(args[index]);
					break;
				case "list":
					schema.list = args[index].map(Schema.from);
					break;
				case "dict":
					schema.dict = mapValues(args[index], Schema.from);
					break;
				case "bits":
					schema.bits = {};
					for (const key in args[index]) {
						if (typeof args[index][key] !== "number") continue;
						schema.bits[key] = args[index][key];
					}
					break;
				case "callback": {
					const callback = schema.callback = args[index];
					callback["toJSON"] ||= () => callback.toString();
					break;
				}
				case "constructor": {
					const constructor = schema.constructor = args[index];
					if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
					break;
				}
				default: schema[key] = args[index];
			}
		});
		if (name === "object" || name === "dict") schema.meta.default = {};
		else if (name === "array" || name === "tuple") schema.meta.default = [];
		else if (name === "bitset") schema.meta.default = 0;
		return schema;
	} });
}
defineMethod("is", ["constructor"], ({ constructor }) => {
	if (typeof constructor === "function") return constructor.name;
	else return constructor;
});
defineMethod("any", [], () => "any");
defineMethod("never", [], () => "never");
defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
defineMethod("string", [], () => "string");
defineMethod("number", [], () => "number");
defineMethod("boolean", [], () => "boolean");
defineMethod("bitset", ["bits"], () => "bitset");
defineMethod("function", [], () => "function");
defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
defineMethod("object", ["dict"], ({ dict }) => {
	if (Object.keys(dict).length === 0) return "{}";
	return `{ ${Object.entries(dict).map(([key, inner]) => {
		return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
	}).join(", ")} }`;
});
defineMethod("union", ["list"], ({ list }, inline) => {
	const result = list.map(({ toString: format }) => format()).join(" | ");
	return inline ? `(${result})` : result;
});
defineMethod("intersect", ["list"], ({ list }) => {
	return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
});
defineMethod("transform", [
	"inner",
	"callback",
	"preserve"
], ({ inner }, isInner) => inner.toString(isInner));
//#endregion
//#region types/app/index.js
/**
* DSH 101 host service: corpus loading, search, curation status, and atomic
* curation publish, plus the `/api/dsh101` HTTP routes.
*
* The corpus ships inside this package's `assets/` directory (generated by
* `scripts/gen-dsh-101-corpus.ts`); a missing corpus degrades to an empty
* index so the reader stays usable and the curator workflow can bootstrap.
*
* @module @deepseek-ai/dsh-101-app
*/
/** Plugin name. */
const name = "dsh-101-app";
/** Services required by the host half. */
const inject = ["webServer"];
const Config = Schema.object({ corpusDir: Schema.string() });
/** Default corpus directory: `assets/dsh-101` next to this package. */
const DEFAULT_CORPUS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "dsh-101");
/**
* File name of the reader's own "last confirmed corpus revision" state
* (`$DSH_HOME/dsh-101/last-seen-revision.json`). Unlike the curation overlay
* (which only exists once the user publishes one), this state is written on
* the reader's first boot and after every curation publish, so a DSH upgrade
* that changes the corpus revision is detectable even when no overlay was
* ever published.
*/
const SEEN_REVISION_FILE_NAME = "last-seen-revision.json";
/** Empty corpus used when the generated assets are absent (bootstrapping). */
const EMPTY_CORPUS = {
	schemaVersion: 1,
	dshVersion: "0.0.0",
	revision: "empty",
	modules: [],
	documents: {}
};
/** The `ctx.dsh101` service implementation. */
var Dsh101Service = class {
	ctx;
	corpusDir;
	corpus;
	curation;
	jobToken;
	#docs = /* @__PURE__ */ new Map();
	#search = [];
	#contexts = /* @__PURE__ */ new Map();
	translationsDir;
	/** docId -> translation-session binding (loaded from the harness home). */
	#translationBindings = /* @__PURE__ */ new Map();
	constructor(ctx, corpusDir) {
		this.ctx = ctx;
		this.corpusDir = corpusDir;
		this.jobToken = randomUUID();
		this.corpus = this.#loadCorpus();
		this.curation = this.#loadCuration();
		this.translationsDir = join(dshHomePath(CURATION_HOME_DIR), "translations");
		this.#loadTranslationBindings();
		this.#rebuild();
		this.#cleanupSupersededAll();
	}
	doc(id) {
		return this.#docs.get(id);
	}
	async docFull(id) {
		const doc = this.#docs.get(id);
		if (doc === void 0) return void 0;
		const full = await readDocumentFile(this.corpusDir, id);
		const merged = full === void 0 ? doc : {
			...doc,
			variants: full.variants
		};
		for (const locale of CORPUS_LOCALES) {
			if (merged.variants[locale] === void 0) continue;
			await this.#cleanupSuperseded(id, locale);
		}
		for (const locale of CORPUS_LOCALES) {
			if (merged.variants[locale] !== void 0) continue;
			const translation = await this.#readTranslation(id, locale);
			if (translation !== void 0) merged.variants[locale] = translation;
		}
		return merged;
	}
	/**
	* Remove a user translation the official corpus now supersedes: the user
	* file under the harness home and its session binding (matching locale).
	* Missing files are tolerated (ENOENT is the normal already-clean state).
	*/
	async #cleanupSuperseded(docId, locale) {
		try {
			await rm(join(this.translationsDir, docId, `${locale}.md`));
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
		const binding = this.#translationBindings.get(docId);
		if (binding !== void 0 && binding.locale === locale) {
			this.#translationBindings.delete(docId);
			await this.#saveTranslationBindings();
		}
	}
	/** Full-corpus pass over every document the corpus index knows. */
	async #cleanupSupersededAll() {
		for (const docId of this.#docs.keys()) {
			const doc = this.#docs.get(docId);
			if (doc === void 0) continue;
			for (const locale of CORPUS_LOCALES) {
				if (doc.variants[locale] === void 0) continue;
				await this.#cleanupSuperseded(docId, locale);
			}
		}
	}
	/** Read a user translation file for one document/locale, if present. */
	async #readTranslation(docId, locale) {
		try {
			const parsed = parseMarkdownVariant(await readFile(join(this.translationsDir, docId, `${locale}.md`), "utf8"));
			return {
				title: parsed.title,
				summary: parsed.summary,
				body: parsed.body,
				sections: parsed.sections
			};
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
			return;
		}
	}
	setContext(sessionId, context) {
		this.#contexts.set(sessionId, context);
	}
	getContext(sessionId) {
		return this.#contexts.get(sessionId);
	}
	async saveTranslation(input) {
		if (!this.#docs.has(input.docId)) return {
			ok: false,
			error: `unknown document ${JSON.stringify(input.docId)}`
		};
		if (input.locale !== "en" && input.locale !== "zh") return {
			ok: false,
			error: "locale must be en or zh"
		};
		if (input.body.trim() === "") return {
			ok: false,
			error: "translation body is empty"
		};
		if (this.#docs.get(input.docId)?.variants[input.locale] !== void 0) return {
			ok: false,
			error: `document already has a ${input.locale} variant`
		};
		const dir = join(this.translationsDir, input.docId);
		await mkdir(dir, { recursive: true });
		const target = join(dir, `${input.locale}.md`);
		const tmp = `${target}.tmp-${Math.random().toString(36).slice(2, 8)}`;
		await writeFile(tmp, input.body, "utf8");
		await rename(tmp, target);
		return { ok: true };
	}
	async bindTranslation(input) {
		if (!this.#docs.has(input.docId)) return {
			ok: false,
			error: `unknown document ${JSON.stringify(input.docId)}`
		};
		if (input.sessionId === "") return {
			ok: false,
			error: "sessionId must not be empty"
		};
		if (input.locale !== "en" && input.locale !== "zh") return {
			ok: false,
			error: "locale must be en or zh"
		};
		this.#translationBindings.set(input.docId, {
			sessionId: input.sessionId,
			locale: input.locale,
			title: input.title,
			updatedAt: Date.now()
		});
		await this.#saveTranslationBindings();
		return { ok: true };
	}
	translationBindings() {
		return Object.fromEntries(this.#translationBindings);
	}
	/** The bindings file path: `$DSH_HOME/dsh-101/translation-bindings.json`. */
	#bindingsPath() {
		return join(dshHomePath(CURATION_HOME_DIR), "translation-bindings.json");
	}
	#loadTranslationBindings() {
		try {
			const bindings = JSON.parse(readFileSync(this.#bindingsPath(), "utf8")).bindings;
			if (bindings === null || typeof bindings !== "object" || Array.isArray(bindings)) return;
			for (const [docId, value] of Object.entries(bindings)) {
				if (typeof value !== "object" || value === null) continue;
				const record = value;
				if (typeof record.sessionId !== "string" || typeof record.locale !== "string") continue;
				if (record.locale !== "en" && record.locale !== "zh") continue;
				this.#translationBindings.set(docId, {
					sessionId: record.sessionId,
					locale: record.locale,
					title: typeof record.title === "string" ? record.title : docId,
					updatedAt: typeof record.updatedAt === "number" ? record.updatedAt : 0
				});
			}
		} catch (error) {
			if (error.code !== "ENOENT") this.ctx.logger.warn(`dsh-101: translation bindings unreadable: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	async #saveTranslationBindings() {
		await mkdir(dshHomePath(CURATION_HOME_DIR), { recursive: true });
		const target = this.#bindingsPath();
		const tmp = `${target}.tmp-${Math.random().toString(36).slice(2, 8)}`;
		await writeFile(tmp, JSON.stringify({
			schemaVersion: 1,
			bindings: Object.fromEntries(this.#translationBindings)
		}, null, 2), "utf8");
		await rename(tmp, target);
	}
	search(query) {
		return searchCorpus(this.#search, query);
	}
	async publish(input) {
		if (input.token !== this.jobToken) return {
			ok: false,
			error: "invalid or expired curation job token"
		};
		if (input.curation.schemaVersion !== this.corpus.schemaVersion) return {
			ok: false,
			error: `curation schemaVersion ${input.curation.schemaVersion} does not match corpus schemaVersion ${this.corpus.schemaVersion}`
		};
		if (input.curation.baseRevision !== this.corpus.revision) return {
			ok: false,
			error: `curation baseRevision ${input.curation.baseRevision} does not match corpus revision ${this.corpus.revision}`
		};
		const documents = input.curation.documents;
		if (documents !== void 0) {
			for (const id of Object.keys(documents)) if (!this.#docs.has(id)) return {
				ok: false,
				error: `curation references unknown document ${JSON.stringify(id)}`
			};
		}
		const home = dshHomePath(CURATION_HOME_DIR);
		await mkdir(home, { recursive: true });
		const target = join(home, CURATION_FILE_NAME);
		const tmp = join(home, `${CURATION_FILE_NAME}.tmp-${this.jobToken.slice(0, 8)}`);
		await writeFile(tmp, serializeCuration(input.curation), "utf8");
		await rename(tmp, target);
		this.curation.curation = input.curation;
		this.curation.current = true;
		this.curation.lastError = void 0;
		this.#saveSeenRevision(this.corpus.revision);
		this.#rebuild();
		return { ok: true };
	}
	#loadCorpus() {
		try {
			return parseCorpusIndex(readFileSync(join(this.corpusDir, "corpus.json"), "utf8"));
		} catch (error) {
			this.ctx.logger.warn(`dsh-101: corpus unavailable, using empty index: ${error instanceof Error ? error.message : String(error)}`);
			return EMPTY_CORPUS;
		}
	}
	#loadCuration() {
		const path = join(dshHomePath(CURATION_HOME_DIR), CURATION_FILE_NAME);
		try {
			const curation = parseCurationFile(readFileSync(path, "utf8"));
			return {
				curation,
				current: curation.baseRevision === this.corpus.revision
			};
		} catch (error) {
			if (error.code !== "ENOENT") this.ctx.logger.warn(`dsh-101: curation overlay unreadable: ${error instanceof Error ? error.message : String(error)}`);
			const seenRevision = this.#loadSeenRevision();
			if (seenRevision === void 0) {
				this.#saveSeenRevision(this.corpus.revision);
				return {
					curation: void 0,
					current: true
				};
			}
			return {
				curation: void 0,
				current: seenRevision === this.corpus.revision
			};
		}
	}
	/** The reader's own "last confirmed corpus revision" state path. */
	#seenRevisionPath() {
		return join(dshHomePath(CURATION_HOME_DIR), SEEN_REVISION_FILE_NAME);
	}
	/** Read the last confirmed corpus revision; undefined when absent/unreadable. */
	#loadSeenRevision() {
		try {
			const raw = JSON.parse(readFileSync(this.#seenRevisionPath(), "utf8"));
			return typeof raw.revision === "string" && raw.revision !== "" ? raw.revision : void 0;
		} catch (error) {
			if (error.code !== "ENOENT") this.ctx.logger.warn(`dsh-101: seen-revision state unreadable: ${error instanceof Error ? error.message : String(error)}`);
			return;
		}
	}
	/** Persist the corpus revision the reader has confirmed (atomic rename). */
	#saveSeenRevision(revision) {
		mkdirSync(dshHomePath(CURATION_HOME_DIR), { recursive: true });
		const target = this.#seenRevisionPath();
		const tmp = `${target}.tmp-${Math.random().toString(36).slice(2, 8)}`;
		writeFileSync(tmp, JSON.stringify({
			schemaVersion: 1,
			revision,
			updatedAt: Date.now()
		}, null, 2), "utf8");
		try {
			renameSync(tmp, target);
		} catch (error) {
			this.ctx.logger.warn(`dsh-101: seen-revision state write failed: ${error instanceof Error ? error.message : String(error)}`);
			rmSync(tmp, { force: true });
		}
	}
	#rebuild() {
		const merged = mergeCuration(this.corpus, this.curation.curation);
		this.#docs = new Map(Object.entries(merged.documents));
		this.#search = buildSearchIndex(merged);
	}
};
/** Extension -> content type for the image route. */
const IMAGE_MIME = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".webp": "image/webp",
	".avif": "image/avif",
	".ico": "image/x-icon"
};
function mimeOf(file) {
	const dot = file.lastIndexOf(".");
	return IMAGE_MIME[dot >= 0 ? file.slice(dot) : ""] ?? "application/octet-stream";
}
/** JSON response helper. */
function json(res, status, value) {
	const body = JSON.stringify(value);
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(body);
}
/** Read one document's full body file (variants merged), or undefined when absent. */
async function readDocumentFile(corpusDir, id) {
	try {
		const raw = await readFile(join(corpusDir, "documents", `${id}.json`), "utf8");
		const parsed = JSON.parse(raw);
		return {
			id: parsed.id,
			module: "",
			kind: "misc",
			sourcePath: "",
			variants: parsed.variants
		};
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
		return;
	}
}
/** Parse a JSON request body (bounded). */
async function readJson(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.length;
		if (size > 1e6) throw new Error("request body too large");
		chunks.push(buffer);
	}
	return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
/** Mount the plugin. */
function apply(ctx, config = {}) {
	const service = new Dsh101Service(ctx, config.corpusDir ?? DEFAULT_CORPUS_DIR);
	ctx.effect(() => {
		const disposeService = ctx.reflect.provide("dsh101", service);
		return () => {
			disposeService();
		};
	}, "dsh-101-app: service");
	const handle = async (req, res) => {
		const url = new URL(req.url ?? "/", "http://dsh.internal");
		const path = url.pathname.replace(/^\/api\/dsh101/, "") || "/";
		try {
			if (req.method === "GET" && path === "/index") {
				json(res, 200, {
					corpus: service.corpus,
					curationCurrent: service.curation.current
				});
				return;
			}
			if (req.method === "GET" && path.startsWith("/doc/")) {
				const id = decodeURIComponent(path.slice(5));
				const doc = await service.docFull(id);
				if (doc === void 0) {
					json(res, 404, { error: `unknown document ${JSON.stringify(id)}` });
					return;
				}
				json(res, 200, { doc });
				return;
			}
			if (req.method === "GET" && path.startsWith("/search")) {
				const query = url.searchParams.get("q") ?? "";
				json(res, 200, { result: service.search(query) });
				return;
			}
			if (req.method === "GET" && path.startsWith("/img/")) {
				const file = path.slice(5).replace(/[^a-zA-Z0-9._-]/g, "");
				try {
					const data = await readFile(join(service.corpusDir, "images", file));
					res.writeHead(200, {
						"content-type": mimeOf(file),
						"cache-control": "public, max-age=31536000, immutable"
					});
					res.end(data);
				} catch {
					json(res, 404, { error: "image not found" });
				}
				return;
			}
			if (req.method === "GET" && path === "/status") {
				json(res, 200, {
					corpusRevision: service.corpus.revision,
					dshVersion: service.corpus.dshVersion,
					curation: service.curation,
					jobToken: service.jobToken
				});
				return;
			}
			if (req.method === "GET" && path.startsWith("/context")) {
				const sessionId = url.searchParams.get("sessionId") ?? "";
				json(res, 200, { context: sessionId === "" ? void 0 : service.getContext(sessionId) ?? null });
				return;
			}
			if (req.method === "POST" && path === "/context") {
				const body = await readJson(req);
				if (typeof body.sessionId !== "string" || typeof body.docId !== "string") {
					json(res, 400, { error: "sessionId and docId are required" });
					return;
				}
				service.setContext(body.sessionId, {
					docId: body.docId,
					...typeof body.section === "string" ? { section: body.section } : {}
				});
				json(res, 200, { ok: true });
				return;
			}
			if (req.method === "POST" && path === "/translate") {
				const body = await readJson(req);
				if (typeof body.docId !== "string" || typeof body.locale !== "string" || typeof body.translation !== "string") {
					json(res, 400, { error: "docId, locale, and translation are required" });
					return;
				}
				const result = await service.saveTranslation({
					docId: body.docId,
					locale: body.locale,
					body: body.translation
				});
				json(res, result.ok ? 200 : 400, result);
				return;
			}
			if (req.method === "GET" && path === "/translations") {
				json(res, 200, { bindings: service.translationBindings() });
				return;
			}
			if (req.method === "POST" && path === "/translate/bind") {
				const body = await readJson(req);
				if (typeof body.docId !== "string" || typeof body.sessionId !== "string" || typeof body.locale !== "string") {
					json(res, 400, { error: "docId, sessionId, and locale are required" });
					return;
				}
				const result = await service.bindTranslation({
					docId: body.docId,
					sessionId: body.sessionId,
					locale: body.locale,
					title: typeof body.title === "string" ? body.title : body.docId
				});
				json(res, result.ok ? 200 : 400, result);
				return;
			}
			if (req.method === "POST" && path === "/publish") {
				const body = await readJson(req);
				const token = typeof body.token === "string" ? body.token : "";
				const curation = typeof body.curation === "object" && body.curation !== null ? parseCurationFile(JSON.stringify(body.curation)) : void 0;
				if (curation === void 0) {
					json(res, 400, { error: "missing curation payload" });
					return;
				}
				const result = await service.publish({
					token,
					curation
				});
				json(res, result.ok ? 200 : 400, result);
				return;
			}
			json(res, 404, { error: `unknown dsh101 endpoint ${JSON.stringify(path)}` });
		} catch (error) {
			json(res, 500, { error: error instanceof Error ? error.message : String(error) });
		}
	};
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: "/api/dsh101",
		handler: handle
	}), "dsh-101-app: api routes");
}
//#endregion
export { Config, Dsh101Service, apply, inject, name };
