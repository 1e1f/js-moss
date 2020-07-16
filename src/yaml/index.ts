import { Parser, Grammar } from 'nearley';
const grammar = require('./nearley');

export const parse = (text: string) => {
    const parser = new Parser(Grammar.fromCompiled(grammar))
    return parser.feed(text);
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
    parser: nearley.Parser;

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