import type { SupportedImageFormat } from "./types/types";
import { isAbsolute } from "path";
import highlight from "highlight.js";
import { promises as fsPromise, constants } from "fs";
import { defaultValues, supportedImageFormat } from "./constant";

export const highlightCode = (code: string, language?: string): string => {
	if (language) return highlight.highlight(language, code).value;
	return highlight.highlightAuto(code).value;
};

export const validateFontPath = async (fontPath?: string): Promise<string> => {
	if (!fontPath) return defaultValues.fontPath;
	if (![".ttf", ".woff", ".woff2"].some(ext => fontPath.endsWith(ext)))
		throw new Error("Font should be either ttf, woff, or woff2");
	if (!isAbsolute(fontPath))
		throw new Error("Font path should be absolute. Use path.resolve()");
	await fsPromise.access(fontPath, constants.F_OK);
	return fontPath;
};

const reduceHelper = async <T, U>(
	init: T,
	reducer: (acc: T, x: U) => T,
	list: AsyncIterator<U>
): Promise<T> => {
	const result = await list.next();
	return result.done
		? init
		: reduceHelper(reducer(init, result.value), reducer, list);
};

const reduce = async <T, U>(
	init: T,
	reducer: (acc: T, x: U) => T,
	list: AsyncIterable<U>
): Promise<T> => reduceHelper(init, reducer, list[Symbol.asyncIterator]());

export const accumulateBuffer = (x: AsyncIterable<Buffer>): Promise<Buffer> =>
	reduce(Buffer.from([]), (a, b) => Buffer.concat([a, b]), x);

export const getImageFormat = (
	value?: SupportedImageFormat
): typeof supportedImageFormat[number] => {
	if (!value) return defaultValues.format;
	return supportedImageFormat.some(ext => ext === value)
		? value
		: defaultValues.format;
};

export const findMaxLineWidth = (content: string): number => {
	const lineWidth = (str: string): number => {
		const tabs = str.split("\t").length;
		return str.length + tabs * 4;
	};
	return content.split("\n").reduce((acc, line) => {
		const width = lineWidth(line);
		if (acc < width) return width;
		return acc;
	}, 0);
};
