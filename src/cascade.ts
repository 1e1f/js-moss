import { check, contains, each, extend, keyPaths, map, sumIfEvery, greatestResult, valueForKeyPath, setValueForKeyPath } from 'typed-json-transform';

export function startsWith(string: string, s: string) {
    return string.slice(0, s.length) === s;
}

export function replaceAll(str: string, find: string, rep: string) {
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return str.replace(new RegExp(escaped, 'g'), rep);
}


function match(selectors: string[], selectable: string) {
    if (startsWith(selectable, '!')) {
        return 1 * <any>!contains(selectors, selectable.slice(1));
    }
    return 1 * <any>contains(selectors, selectable);
}

function matchEvery(selectors: string[], cssString: string): number {
    if (cssString.indexOf(' ') !== -1) {
        const selectables = cssString.split(' ');
        return sumIfEvery(selectables, (selectable: string) => {
            return match(selectors, selectable);
        });
    }
    return match(selectors, cssString);
}

function matchCssString(selectors: string[], cssString: string): number {
    const selectables = replaceAll(cssString, ', ', ',');
    if (selectables.indexOf(',') !== -1) {
        return greatestResult(selectables.split(','), (subCssString: string) => {
            return matchEvery(selectors, subCssString);
        });
    }
    return matchEvery(selectors, selectables);
}

export function select(input: string[], cssString: string): number {
    return matchCssString(input, cssString);
}

export const parseSelectors = ($select: any) => {
    const keywords: string[] = [];
    const selectors: string[] = [];
    each($select, (opt: string | number, key: string) => {
        const selector = key;
        keywords.push(selector);
        if (!!opt) selectors.push(selector);
    });
    return {
        keywords, selectors
    }
}

type nextFn = (ctx: any, data: any) => any

export const shouldRecur = (data: any, prefix: string): any => {
    if (!check(data, Object)) return false;
    for (const key of Object.keys(data)) {
        if (key[0] == prefix) {
            return true;
        }
    }
    return false;
}

export const shouldCascade = (data: any): any => {
    for (const key of Object.keys(data)) {
        if (key[0] == '=' || key[0] == '+' || key[0] == '-') {
            return true;
        }
    }
}

export const base = (data: any): any => {
    const res: any = {};
    for (const key of Object.keys(data)) {
        if (!contains(['=', '-', '+'], key[0]))
            res[key] = data[key];
    }
    return Object.keys(res).length ? res : undefined;
}

interface cascadeOptions {
    prefix: string,
    usePrecedence?: boolean,
    onMatch?: (match: any) => void
}

export const cascade = (ctx: any, data: any, options: cascadeOptions): any => {
    const { keywords, selectors } = parseSelectors(ctx.state.selectors);
    const { usePrecedence, prefix, onMatch } = options;
    let highest = 0;
    let res;
    for (const key of Object.keys(data)) {
        if (key[0] == prefix) {
            const css = key.slice(1);
            if (!css) {
                if (highest == 0) {
                    res = data[key];
                    if (onMatch) onMatch(data[key]);
                }
            } else {
                if (select(keywords, css)) {
                    const precedence = select(selectors, css);
                    if (precedence > highest) {
                        res = data[key];
                        if (usePrecedence) {
                            highest = precedence;
                        }
                        if (onMatch) onMatch(data[key]);
                    }
                }
            }
        }
    }
    if (shouldRecur(res, prefix)) {
        return cascade(ctx, res, options);
    }
    return res;
}