import { check, contains, each, greatestResult } from 'typed-json-transform';

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
            else return 0;
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
        return .5;
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

export const shouldConstruct = (data: any): any => {
    if (!check(data, Object)) return false;
    let implicit = false;
    for (const key of Object.keys(data)) {
        if (key[0] == '=') {
            return true;
        }
        if ((key[0] == '+') || (key[0] == '-')) {
            implicit = true;
        }
    }
    if (implicit) {
        throw new Error('using constructors <+ or <- without base definition <=')
    }
}