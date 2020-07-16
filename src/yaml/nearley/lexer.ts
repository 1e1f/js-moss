/// <reference path="../../interfaces/index.d.ts" />

// import moo from 'moo';
const moo = require('moo');

const makeToken = (type: string, text: string, sourceMap?: Nearley.SourceMap, indent?: number) =>
    ({ ...sourceMap, type, text, value: text, indent, toString: () => text });

const makeSol = (sourceMap: any, indent: number) => {
    const t = makeToken('sol', '\n', sourceMap, indent);
    //console.log(t);
    return t
}
const makeEol = (sourceMap: Nearley.SourceMap, indent: number) =>
    makeToken('eol', '\n', sourceMap, indent)

const makeIndent = (sourceMap: Nearley.SourceMap, indent: number) =>
    makeToken('indent', 'indent', sourceMap, indent)

const makeDedent = (sourceMap: Nearley.SourceMap, indent: number) =>
    makeToken('dedent', 'dedent', sourceMap, indent)

const makeSof = () => makeToken('sof', 'sof', { line: 0, col: 0 }, -1);
const makeEof = () => makeToken('eof', 'eof', { line: -1, col: -1 }, -1);

const doDedent = (ruleMap: any, indent: number, nextIndent: number, sourceMap: any) => {
    const tokens = [makeEol(sourceMap, indent)];
    const ruleToken = ruleMap.get(indent);
    if (ruleToken) {
        tokens.push(makeToken('stopRule', `/${ruleToken.text}`, sourceMap, indent));
        ruleMap.delete(indent)
    }
    tokens.push(makeDedent(sourceMap, nextIndent));
    tokens.push(makeSol(sourceMap, nextIndent));
    return tokens;
}

function* indented(lexer: any, source: any, info?: any) {
    let iter = peekable(lexer.reset(source, info))
    let stack = []
    let ruleMap = new Map();

    // absorb initial blank lines and indentation
    let indent = iter.nextIndent()

    yield makeSof();
    yield makeSol(null, indent);

    for (let tok: Nearley.Token; tok = iter.next();) {
        const sourceMap = { line: tok.line, col: tok.col };

        if (tok.type === 'eol' || tok.type === 'startRule') {
            const newIndent = iter.nextIndent()
            if (newIndent == null) {
                break;
            }// eof
            else if (newIndent === indent) {
                if (tok.type === 'startRule') {
                    const ruleToken = makeToken('startRule', tok.text.slice(0, tok.text.indexOf('<') + 1));
                    ruleMap.set(indent, ruleToken);
                    yield ruleToken;
                }
                yield makeEol(sourceMap, indent);
                yield makeSol(sourceMap, indent);
            } else if (newIndent > indent) {
                stack.push(indent)
                indent = newIndent
                if (tok.type === 'startRule') {
                    const ruleToken = makeToken('startRule', tok.text.slice(0, tok.text.indexOf('<') + 1));
                    ruleMap.set(indent, ruleToken);
                    yield ruleToken;
                }
                yield makeEol(sourceMap, indent);
                yield makeIndent(sourceMap, indent)
                yield makeSol(sourceMap, indent);
            } else if (newIndent < indent) {
                while (newIndent < indent) {
                    const nextIndent = stack.pop();
                    const dedentTokens = doDedent(ruleMap, indent, nextIndent, sourceMap);
                    for (const t of dedentTokens) {
                        yield t;
                    }
                    indent = nextIndent;
                }
                if (newIndent !== indent) {
                    throw new Error(`inconsistent indentation ${newIndent} != ${indent}`)
                }
            } else {
                yield makeEol(sourceMap, indent);
                yield makeSol(sourceMap, indent);
            }
            indent = newIndent
        } else {
            yield { ...tok, indent: indent }
        }
    }

    // dedent remaining blocks at eof
    for (let i = stack.length; i--;) {
        const nextIndent = stack.pop() || 0;
        const dedentTokens = doDedent(ruleMap, indent, nextIndent, { line: 'eof', col: 'eof' });
        for (const t of dedentTokens) {
            yield t;
        }
        indent = nextIndent;
    }

    yield makeEol({ line: -1, col: -1 }, indent);
    const ruleToken = ruleMap.get(0);
    if (ruleToken) {
        yield makeToken('stopRule', `/${ruleToken.text}`);
        ruleMap.delete(0)
    }

    yield makeEof();
}

function peekable(lexer: any) {
    let here = lexer.next()
    return {
        next() {
            const old = here
            here = lexer.next()
            return old
        },
        peek() {
            return here
        },
        nextIndent() {
            for (let tok; tok = this.peek();) {
                if (tok.type === 'eol') {
                    this.next();
                }
                else if (tok.type === 'space') {
                    // const indent = tok.value.length;
                    const recur = (indent: number): number => {
                        this.next()
                        const next = this.peek()
                        if (!next) return indent
                        if (next.type === 'eol') {
                            this.next()
                            return indent
                        } else if (next.type === 'space') {
                            return recur(indent + 1);
                        }
                        return indent
                    }
                    return recur(1);
                }
                return 0
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

const printToken = (t: Nearley.Token) => {
    switch (t.type) {
        case "eol": return "}";
        case "eol": return "}";
        case "space": return " ";
        case "indent": return "->";
        case "dedent": return "<-";
        case "eof": return "</>";
        case "sof": return "<>";
        case "sol": return "{";
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
        const iter = indented(moo.compile(rules), source);
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
        console.log('tokens', this.getTokenTypes(source))
        this.generator = indented(this.lexer, source, info);
    }

    formatError = function (token: Nearley.Token) {
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

export const space = { test: (tok: Nearley.Token) => tok.type == 'space' };
export const any = { test: (tok: Nearley.Token) => tok.type == 'any' };
export const startRule = { test: (tok: Nearley.Token) => tok.type == 'startRule' };
export const indent = { test: (tok: Nearley.Token) => tok.type == 'indent' };
export const dedent = { test: (tok: Nearley.Token) => tok.type == 'dedent' };
export const sof = { test: (tok: Nearley.Token) => { console.log('sof?', tok); return tok.type == 'sof' } };
export const sol = { test: (tok: Nearley.Token) => tok.type == 'sol' };
export const eof = { test: (tok: Nearley.Token) => tok.type == 'eof' };
export const eol = { test: (tok: Nearley.Token) => tok.type == 'eol' };

export const lexer = new StreamLexer();
export default lexer;