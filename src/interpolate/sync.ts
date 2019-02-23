import { check } from 'typed-json-transform';
import * as math from 'mathjs';

import { newState, concat, reduce, append as _append, pop } from './shared';

export function expand(str: string, options: Expand.Options) {
    const { replace, call, shell, fetch, getStack } = options;
    const template = String(str);
    let i = 0;
    let offset = i;
    let x = 0;
    let y = 0;

    const stack: Expand.Elem[][] = [[{ state: { sourceMap: [0, str.length] }, raw: [], subst: [], source: [] }]];
    let ptr = stack[x][y];


    const append = (char: string) => {
        let nextChunk = false;
        if (ptr.state.op) {
            nextChunk = _append(ptr.subst, char)
        } else {
            nextChunk = _append(ptr.raw, char)
        }
        if (nextChunk) {
            ptr.source.push(char);
        } else {
            ptr.source[(ptr.source.length - 1) || 0] += char;
        }
    }

    const open = (op: Expand.Op, terminal: Expand.Terminal) => {
        offset = i - (terminal ? 1 : 0);
        if (ptr.state.op) {
            pop(ptr.subst);
        } else {
            pop(ptr.raw);
        }
        ptr.state.detecting = null;
        const existing = ptr.state.op;
        if (existing) {
            y++;
            stack[x][y] = newState();
            ptr = stack[x][y];
            ptr.raw = [];
        }
        ptr.state.op = op;
        ptr.state.terminal = terminal;
    }

    const sub = (fn: (s: string, location: any) => any, str: string, sourceMap?: number[]) => {
        let required = true;
        if (str && str[str.length - 1] == '?') {
            required = false;
            str = str.slice(0, str.length - 1);
        }
        const res = str && fn(str, sourceMap);
        if (required && !(res || check(res, Number))) {
            throw {
                message: `${str} doesn't exist, and is required.\nignore (non-strict) with: ${str}?`,
                source: str
            }
        }
        return res;
    }

    const close = () => {
        const op = ptr.state.op;
        ptr.state.sourceMap = [offset, i + (ptr.state.terminal && ptr.state.terminal.length) - offset];
        ptr.state.op = null;
        ptr.state.terminal = null;
        let res;
        const swap = reduce(ptr.subst, ptr.source);
        if (check(swap, [Object, Array])) {
            res = call(swap);
        } else {
            if (op == 'replace') {
                res = sub(replace, swap, ptr.state.sourceMap);
            } else if (op == 'shell') {
                res = sub(shell, swap, ptr.state.sourceMap);
            } else if (op == 'fetch') {
                res = sub(fetch, swap, ptr.state.sourceMap);
            } else if (op == 'math') {
                const vars = getStack();
                if (Object.keys(vars).length) {
                    res = sub((s) => math.eval(s, vars), swap, ptr.state.sourceMap)
                } else {
                    res = sub((s) => math.eval(s), swap, ptr.state.sourceMap)
                }
            }
        }
        if (y > 0) {
            delete stack[x][y];
            y--;
            ptr = stack[x][y];
            ptr.subst.push(res);
        }
        else {
            if (res) { ptr.state.dirty = true };
            ptr.raw.push(res);
            x++;
            y = 0;
            stack[x] = [newState()];
            ptr = stack[x][y];
        }
    }

    for (i = 0; i != template.length; i++) {
        const char = template[i];
        if (ptr.state.escape) {
            ptr.state.escape = false;
            append(char);
        } else {
            const detecting = ptr.state.detecting;
            switch (char) {
                case '(':
                    if (detecting) {
                        open('shell', ')');
                        break;
                    }
                    append(char);
                    break;
                case '{':
                    if (detecting) {
                        open(detecting == '$' ? 'replace' : detecting == '^' ? 'fetch' : 'math', '}');
                        break;
                    }
                    append(char);
                    break;
                case '}': case ')':
                    if (ptr.state.op && ptr.state.terminal == ' ') {
                        close();
                    }
                    if (ptr.state.op && ptr.state.terminal == char) {
                        close();
                        break;
                    }
                    append(char);
                    break;
                case ' ':
                    if (ptr.state.op && ptr.state.terminal == char) {
                        close();
                    }
                    append(char);
                    break;
                case '\\':
                    ptr.state.escape = true;
                    break;
                default:
                    if (detecting) {
                        const lse = ptr.raw[ptr.raw.length - 1];
                        if (lse.length < 2 || (lse[(lse.length - 2)] === ' ')) {
                            if (detecting == '=') open('math', '__null__');
                            else if (detecting == '^') open('fetch', ' ');
                            else if (detecting == '$') open('replace', ' ');
                        } else {
                            ptr.state.detecting = null;
                        }
                    } else if (char == '=' || char == '$' || char == '^') {
                        ptr.state.detecting = char;
                    }
                    append(char);
                    break;
            }
        }
    }
    while (ptr.state.op) {
        if (ptr.state.terminal == '}') throw { message: `expected a closing ${ptr.state.terminal}` }
        close();
    }
    if (ptr.state.detecting) {
        ptr.state.detecting = null;
    }
    return stack;
};

export function interpolate(input: any, options: Expand.Options) {
    if (!check(input, String)) {
        return { value: input, changed: false };
    }
    return concat(expand(input, options))
}

