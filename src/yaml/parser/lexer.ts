import { SourceMap, Token, Location } from './post/types';

// import moo from 'moo';
const moo = require('moo');

// const makeToken = (type: string, text: string, location?: Location, indent?: number) =>
// ({
//     line: location?.line || 0,
//     col: location?.col || 0,
//     indent: indent || location?.indent || 0,
//     type,
//     text,
//     value: text,
//     toString: () => text
// });

const makeSol = (location: Location) => {
    const t = new Token('sol', '\n', location);
    //console.log(t);
    return t
}
const makeEol = (location: Location) =>
    new Token('eol', '\n', location)

const makeIndent = (location: Location) =>
    new Token('indent', 'indent', location)

const makeDedent = (location: Location) =>
    new Token('dedent', 'dedent', location)

const makeSof = () => new Token('sof', 'sof', { line: 0, col: 0, indent: 0 }, -1);
const makeEof = () => new Token('eof', 'eof', { line: 0, col: 0, indent: 0 }, -1);

const doDedent = (ruleMap: any, location: Location, nextIndent: number) => {
    const tokens = [makeEol(location)];
    const ruleToken = ruleMap.get(indent);
    if (ruleToken) {
        tokens.push(new Token('stopRule', `/${ruleToken.text}`, location));
        ruleMap.delete(indent)
    }
    tokens.push(makeDedent({ ...location, indent: nextIndent }));
    tokens.push(makeSol({ ...location, indent: nextIndent }));
    return tokens;
}

function* indented(lexer: any, source: any, info?: any) {
    let iter = peekable(lexer.reset(source, info))
    // const all = [];
    // for (let tok: Token; tok = iter.next();) {
    //     all.push(printToken(tok));
    // }
    // console.log(all.join(''));
    // iter = peekable(lexer.reset(source, info))

    let stack: number[] = []
    let ruleMap = new Map();

    // absorb initial blank lines and indentation
    let indent = iter.nextIndent();

    yield makeSof();
    yield makeSol({ line: 0, col: 0, indent });


    let location;
    for (let tok: Token; tok = iter.next();) {
        location = { line: tok.line, col: tok.col, indent };
        if (tok.type === 'eol' || tok.type === 'startRule') {
            const beforeSkip = iter.peek();
            const newIndent = iter.nextIndent();
            const afterIndent = iter.peek();
            if (afterIndent) {
                if (beforeSkip.offset != afterIndent.offset) {
                    // console.log('skipped', afterIndent.offset - beforeSkip.offset);
                    // console.log('from', beforeSkip.text, 'to', afterIndent.value);
                }
            }
            if (newIndent === null) {
                console.log('noChange');
                break;
            }// eof
            else if (newIndent == indent) {
                if (tok.type === 'startRule') {
                    const ruleToken = new Token('startRule', tok.text.slice(0, tok.text.indexOf('<') + 1));
                    ruleMap.set(indent, ruleToken);
                    yield ruleToken;
                }

                yield makeEol(location);
                yield makeSol(location);
            } else if (newIndent > indent) {
                stack.push(indent)
                indent = newIndent
                if (tok.type === 'startRule') {
                    const ruleToken = new Token('startRule', tok.text.slice(0, tok.text.indexOf('<') + 1));
                    ruleMap.set(indent, ruleToken);
                    yield ruleToken;
                }
                yield makeEol(location);
                yield makeIndent(location)
                yield makeSol(location);
            } else if (newIndent < indent) {
                while (newIndent < indent) {
                    const nextIndent = stack.pop();
                    const dedentTokens = doDedent(ruleMap, location, nextIndent);
                    for (const t of dedentTokens) {
                        yield t;
                    }
                    indent = nextIndent;
                }
                if (newIndent !== indent) {
                    throw new Error(`inconsistent indentation ${newIndent} != ${indent}`)
                }
            } else {
                yield makeEol(location);
                yield makeSol(location);
            }
            indent = newIndent
        } else {
            yield { ...tok, indent: indent }
        }
    }


    // dedent remaining blocks at eof
    for (let i = stack.length; i--;) {
        const nextIndent = stack.pop() || 0;
        const dedentTokens = doDedent(ruleMap, location, nextIndent);
        for (const t of dedentTokens) {
            yield t;
        }
        indent = nextIndent;
    }

    yield makeEol(location);
    const ruleToken = ruleMap.get(0);
    if (ruleToken) {
        yield new Token('stopRule', `/${ruleToken.text}`);
        ruleMap.delete(0)
    }

    yield makeEof();
}

function peekable(lexer: any) {
    let here = lexer.next();
    return {
        next() {
            const old = here;
            here = lexer.next();
            return old;
        },
        peek() {
            return here;
        },
        nextIndent() {
            const chewSpace = (indent: number): number => {
                this.next();
                const next = this.peek();
                // console.log('ate', next.type)
                if (!next) {
                    return indent
                }
                if (next.type === 'eol') {
                    // const next = this.next();
                    return indent;
                } else if (next.type === 'space') {
                    return chewSpace(indent + 1);
                }
                return indent
            }

            for (let tok; tok = this.peek();) {
                const tokIndent = tok.col;
                // console.log('peek', tok);
                if (tok.type === 'eol') {
                    // throw new Error('peeked eol');
                    // this.next();
                }
                else if (tok.type === 'space') {
                    return chewSpace(tokIndent);
                }
                return 0;
            }
        },
    }
}

const rules = {
    space: /[ ]/,
    startRule: {
        match: /[a-zA-Z+\-`]+<[\n\r]|[a-zA-Z+\-`]+< #.*[\n\r]/,
        lineBreaks: true
    },
    eol: { match: /[\n\r]/, lineBreaks: true },
    any: /[^\s]/
};

const printToken = (t: Token) => {
    switch (t.type) {
        case "eol": return " ";
        case "space": return " ";
        case "indent": return "{";
        case "dedent": return "}";
        case "eof": return "";
        case "sof": return "";
        case "sol": return " ";
        default: return t.text;
    }
}


class StreamLexer {
    lexer: any;

    constructor() {
        this.lexer = moo.compile(rules);
    }

    next = function () {
        const tok = this.generator.next().value;
        if (tok) {
            //console.log(printToken(tok), tok);
            return tok;
        }
    }

    save = function () {
    }

    getTokenTypes = function (source: string) {
        const types = [];
        const iter: any = indented(moo.compile(rules), source);
        const arr = [];
        for (const t of iter) {
            if (t.type == 'any') {
                const back = arr.length ? arr[arr.length - 1] : null;
                if (back && back.type == 'any') {
                    back.value += t.value;
                    back.text += t.text;
                } else {
                    arr.push(t);
                }
            } else {
                arr.push(t);
            }
        }
        return arr.map(t => printToken(t))
    }

    reset = function (source: string, info?: any) {
        console.log(this.getTokenTypes(source).join(''))
        this.generator = indented(this.lexer, source, info);
    }

    formatError = function (token: Token) {
        if (token.col < 0) token.col = 0;
        return this.lexer.formatError(token);
    }

    has = function (name: string) {
        if (name == 'indent') return true;
        if (name == 'dedent') return true;
        if (name == 'sof') return true;
        if (name == 'sol') return true;
        if (name == 'eof') return true;
        if (name == 'eol') return true;
        return this.lexer.has(name);
    }
}

export const space = { test: (tok: Token) => tok.type == 'space' };
export const any = { test: (tok: Token) => tok.type == 'any' };
export const startRule = { test: (tok: Token) => tok.type == 'startRule' };
export const indent = { test: (tok: Token) => tok.type == 'indent' };
export const dedent = { test: (tok: Token) => tok.type == 'dedent' };
export const sof = {
    test: (tok: Token) => {
        // console.log('sof?', tok);
        return tok.type == 'sof'
    }
};
export const sol = { test: (tok: Token) => tok.type == 'sol' };
export const eof = { test: (tok: Token) => tok.type == 'eof' };
export const eol = { test: (tok: Token) => tok.type == 'eol' };

export const lexer = new StreamLexer();
export default lexer;
