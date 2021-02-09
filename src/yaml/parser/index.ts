
import { Parser, Grammar } from 'nearley';
const grammar = require('./compiled').default;

const compiled = Grammar.fromCompiled(grammar);

export const parse = (text: string) => {
    // ignore empty chars in parser is probably faster
    let withoutEmptyChars = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
    const parser = new Parser(compiled);
    return parser.feed(withoutEmptyChars);
}

export const load = (text: string) => {
    const parsed = parse(text);
    return parsed.results;
}

class ParserState {
    clone() {
        return this;
    }

    equals() {
        return true;
    }
}

export class MonacoTokensProvider {
    parser: Parser;

    getInitialState(line: string) {
        this.parser = new Parser(Grammar.fromCompiled(grammar))
        return new ParserState();
    }

    tokenize(line: string, state: any) {
        // console.log(state);
        // console.log('tokenize', line, state)
        const { results, lexer } = this.parser.feed(line);
        return { endState: state, tokens: results };
    }
}
