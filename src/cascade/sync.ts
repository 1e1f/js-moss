import { Moss, Merge } from '../types';
import { parseSelectors, select } from './shared';

interface Options {
    operator: Merge.Operator,
    usePrecedence?: boolean,
    onMatch?: (layer: Moss.ReturnValue, setter: any, operator: Merge.Operator, key: string) => any
}

export const cascade = (rv: Moss.ReturnValue, input: any, options: Options): Moss.ReturnValue => {
    const { selectors } = parseSelectors(rv.state.selectors);
    const { usePrecedence, operator, onMatch } = options;

    if (usePrecedence) {
        let matches = 0;
        let selectedKey;
        for (const key of Object.keys(input)) {
            if (key[0] == operator) {
                const css = key.slice(1);
                const precedence = select(selectors, css);
                if (precedence > matches) {
                    matches = precedence;
                    selectedKey = key;
                }
            }
        }
        if (selectedKey) {
            onMatch(rv, input[selectedKey], operator, selectedKey);
        }
    } else {
        for (const key of Object.keys(input)) {
            if (key[0] == operator) {
                const css = key.slice(1);
                if (select(selectors, css)) {
                    onMatch(rv, input[key], operator, key);
                }
            }
        }
    }

    return rv
}
