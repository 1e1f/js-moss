import { check, contains, each, keyPaths, sumIfEvery, greatestResult, valueForKeyPath, setValueForKeyPath } from 'typed-json-transform';

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
    const keywords: string[] = ['-'];
    const selectors: string[] = ['-'];
    each($select, (opt: string | number, key: string) => {
        const selector = key;
        keywords.push(selector);
        if (!!opt) selectors.push(selector);
    });
    return {
        keywords, selectors
    }
}

export const branchSelect = (input: any, options: any, stack: any, keypath: string = '', precedence = 0) => {
    const { keywords, selectors } = parseSelectors(options);
    if (check(input, Object)) {
        for (const key of Object.keys(input)) {
            if (key[0] == '-') {
                const css = key.slice(1);
                if (select(keywords, css)) {
                    const inlinePrecedence = select(selectors, css);
                    if (inlinePrecedence > 0) {
                        branchSelect(input[key], options, stack, keypath, precedence + inlinePrecedence);
                    }
                }
            } else {
                if (!stack[precedence]) {
                    stack[precedence] = {};
                }
                const nextKeypath = keypath ? [keypath, key].join('.') : key;
                stack[precedence][nextKeypath] = input[key];
            }
        }
    } else {
        if (!stack[precedence]) {
            stack[precedence] = {};
        }
        stack[precedence][keypath] = input;
    }
}

interface Level { [index: string]: any }

export const cascade = (input: Moss.Branch, state: Moss.State) => {
    const stack: Level[] = [];
    branchSelect(input, state.selectors, stack);
    let res = {};
    for (const level of stack) {
        if (level) {
            for (const key of Object.keys(level)) {
                if (key) {
                    setValueForKeyPath(level[key], key, res);
                } else {
                    res = level[key];
                }
            }
        }
    }
    return res;
}
