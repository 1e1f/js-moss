import { check, contains, difference, each, extend, keyPaths, map, sumIfEvery, greatestResult, valueForKeyPath, setValueForKeyPath } from 'typed-json-transform';

export function startsWith(string: string, s: string) {
    return string.slice(0, s.length) === s;
}

export function replaceAll(str: string, find: string, rep: string) {
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return str.replace(new RegExp(escaped, 'g'), rep);
}


function match(selectors: string[], selectable: string) {
    if (startsWith(selectable, '!')) {
        const notSelector = selectable.slice(1);
        return contains(selectors, notSelector) ? 0 : 1;
    }
    return contains(selectors, selectable) ? 1 : 0;
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
    return 0 + matchCssString(input, cssString);
}

export const parseSelectors = (options: any) => {
    const keywords: string[] = [];
    const selectors: string[] = [];
    each(options, (select: string | number, key: string) => {
        keywords.push(key);
        if (select) selectors.push(key);
    });
    return {
        keywords, selectors
    }
}

type nextFn = (ctx: any, data: any) => any

export const shouldCascade = (data: any): any => {
    if (!check(data, Object)) return false;
    for (const key of Object.keys(data)) {
        if (key[0] == '=' || key[0] == '+' || key[0] == '-') {
            return true;
        }
    }
}

export const base = (data: any): any => {
    const res: any = {};
    for (const key of Object.keys(data)) {
        if (!contains(['=', '-', '+'], key[0])) res[key] = data[key];
    }
    return Object.keys(res).length ? res : undefined;
}

interface cascadeOptions {
    prefix: string,
    usePrecedence?: boolean,
    onMatch?: (match: any, key: string) => void
}

export const cascade = (ctx: any, data: any, options: cascadeOptions): any => {
    const { selectors } = parseSelectors(ctx.state.selectors);
    const { usePrecedence, prefix, onMatch } = options;
    let highest = 0;
    // let matchedKey = '';
    let res = undefined;
    for (const key of Object.keys(data)) {
        if (key[0] == prefix) { // one at a time =, -, +
            const css = key.slice(1);
            if (!css) { // this is the default?
                const replace = onMatch(data[key], key);
                if (replace) res = replace;
            } else {
                const precedence = select(selectors, css);
                if (precedence > highest) {
                    if (usePrecedence) {
                        highest = precedence;
                    }
                    const replace = onMatch(data[key], key);
                    if (replace) res = replace;
                }
            }
        }
    }
    return res;
}
