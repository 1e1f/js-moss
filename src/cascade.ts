import { check, contains, difference, each, extend, keyPaths, map, sumIfEvery, greatestResult, valueForKeyPath, setValueForKeyPath, clone } from 'typed-json-transform';

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
        let sum = 0;
        for (const selectable of selectables) {
            if (match(selectors, selectable)) sum += 1;
        }
        return sum;
    }
    return match(selectors, cssString);
}

function matchCssString(selectors: string[], cssString: string): number {
    const selectables = replaceAll(cssString.trim(), ', ', ',');
    if (selectables.indexOf(',') !== -1) {
        return greatestResult(selectables.split(','), (subCssString: string) => {
            return matchEvery(selectors, subCssString);
        });
    }
    return matchEvery(selectors, selectables);
}

export function select(input: string[], cssString: string): number {
    if (!cssString) {
        return 1;
    }
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
    let implicit = false;
    for (const key of Object.keys(data)) {
        if (key[0] == '<') {
            if (key[1] == '=') {
                return true;
            }
            if (key[1] == '+' || key[1] == '-') {
                implicit = true;
            }
        }
    }
    if (implicit) {
        throw new Error('using constructors <+ or <- without base definition <=')
    }
}

export const base = (data: any): any => {
    const res: any = {};
    for (const key of Object.keys(data)) {
        if (key[0] == '<') {
            if (!contains(['=', '-', '+'], key[1])) res[key] = data[key];
        }
    }
    return Object.keys(res).length ? res : undefined;
}

interface cascadeAsyncOptions {
    operator: Merge.Operator,
    usePrecedence?: boolean,
    onMatch?: (layer: Moss.ReturnValue, setter: any, operator: Merge.Operator, key: string) => Promise<any>
}

interface cascadeOptions {
    operator: Merge.Operator,
    usePrecedence?: boolean
    onMatch?: (layer: Moss.ReturnValue, setter: any, operator: Merge.Operator, key: string) => any
}

export const cascadeAsync = async (rv: Moss.ReturnValue, input: any, options: cascadeAsyncOptions): Moss.ReturnValue => {
    const { selectors } = parseSelectors(rv.state.selectors);
    const { usePrecedence, operator, onMatch } = options;

    if (usePrecedence) {
        let matches = 0;
        let selectedKey;
        for (const key of Object.keys(input)) {
            if (key[1] == operator) { // one at a time =, -, +
                const css = key.slice(2);
                const precedence = select(selectors, css);
                if (precedence >= matches) {
                    matches = precedence;
                    selectedKey = key;
                }
            }
        }
        if (selectedKey) {
            await onMatch(rv, input[selectedKey], operator, selectedKey);
        }
    } else {
        for (const key of Object.keys(input)) {
            if (key[1] == operator) { // one at a time =, -, +
                const css = key.slice(2);
                if (select(selectors, css)) {
                    await onMatch(rv, input[key], operator, key);
                }
            }
        }
    }

    return rv
}

export const cascade = (rv: Moss.ReturnValue, input: any, options: cascadeAsyncOptions): Moss.ReturnValue => {
    const { selectors } = parseSelectors(rv.state.selectors);
    const { usePrecedence, operator, onMatch } = options;

    if (usePrecedence) {
        let matches = 0;
        let selectedKey;
        for (const key of Object.keys(input)) {
            if (key[1] == operator) { // one at a time =, -, +
                const css = key.slice(2);
                const precedence = select(selectors, css);
                if (precedence > matches) {
                    matches = precedence;
                    selectedKey = key;
                }
            }
        }
        if (selectedKey) {
            console.log('usePrecedence', selectedKey);
            onMatch(rv, input[selectedKey], operator, selectedKey);
        }
    } else {
        for (const key of Object.keys(input)) {
            if (key[1] == operator) { // one at a time =, -, +
                const css = key.slice(2);
                if (select(selectors, css)) {
                    onMatch(rv, input[key], operator, key);
                }
            }
        }
    }

    return rv
}
