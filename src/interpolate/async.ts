import { check } from 'typed-json-transform';
import { Expand } from '../types';
const expression = require('../../compiled/expression');

import { newState, parse, reduce, append as _append, pop } from './shared';

export async function tokenize(str: string, options: Expand.Options) {
    const { dereference, dereferenceSync, call, shell, fetch, query } = options;
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

    const stepBack = () => {
        if (ptr.state.op) {
            pop(ptr.subst);
        } else {
            pop(ptr.raw);
        }
    }

    const open = (op: Expand.Op, terminal: Expand.Terminal) => {
        stepBack();
        ptr.state.header = null;
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

    const sub = async (fn: (s: string, location: any) => any, str: string, sourceMap?: number[]) => {
        let required = true;
        let defer = false;
        if (str && str[str.length - 1] == '>') {
            defer = true;
            str = str.slice(0, str.length - 1);
        }
        if (str && str[str.length - 1] == '?') {
            required = false;
            str = str.slice(0, str.length - 1);
        }
        const res = str && await fn(str, { defer, required, sourceMap });
        if (!!required && (res === undefined)) {
            throw {
                message: `"${str}" doesn't exist, and is required. Did you forget to defer a section i.e "section>:"? If "${str}" is optionally blank, you can ignore this error with a '?' i.e. $${str}?`,
                source: str
            }
        }
        return res;
    }

    const subSync = (fn: (s: string, location: any) => any, str: string, sourceMap?: number[]) => {
        let required = true;
        let defer = false;
        if (str && str[str.length - 1] == '>') {
            defer = true;
            str = str.slice(0, str.length - 1);
        }
        if (str && str[str.length - 1] == '?') {
            required = false;
            str = str.slice(0, str.length - 1);
        }
        const res = str && fn(str, { defer, required, sourceMap });
        if (!!required && (res === undefined)) {
            throw {
                message: `"${str}" doesn't exist, and is required. Did you forget to defer a section i.e "section>:"? If "${str}" is optionally blank, you can ignore this error with a '?' i.e. $${str}?`,
                source: str
            }
        }
        return res;
    }

    const close = async () => {
        const op = ptr.state.op;
        ptr.state.sourceMap = [offset, i + (ptr.state.terminal && ptr.state.terminal.length) - offset];
        ptr.state.op = null;
        ptr.state.terminal = null;
        let res;
        const swap = reduce(ptr.subst, ptr.source);
        if (check(swap, [Object, Array])) {
            res = await call(swap);
        } else {
            if (op == 'v') {
                res = await sub(dereference, swap, ptr.state.sourceMap);
            } else if (op == 's') {
                res = await sub(shell, swap, ptr.state.sourceMap);
            } else if (op == 'f') {
                res = await sub(fetch, swap, ptr.state.sourceMap);
            } else if (op == 'q') {
                res = await sub(fetch, '?' + swap, ptr.state.sourceMap);
            } else if (op == 'e') {
                const deref = (str: string) => subSync(dereferenceSync, str, ptr.state.sourceMap)
                // res = await sub((s) => expression(deref, check).parse(s), swap, ptr.state.sourceMap)
                res = expression(deref).parse(swap);
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
            const { detecting, header, op, terminal } = ptr.state;
            switch (char) {
                case '(':
                    if (detecting && (detecting == '$')) {
                        open('s', ')');
                        break;
                    } else {
                        append(char);
                    }
                    break;
                case '{':
                    if (detecting) {
                        open(detecting == '$' ? 'v' : detecting == '^' ? 'f' : 'e', '}');
                        break;
                    } else {
                        append(char);
                    }
                    break;
                case '}': case ')':
                    if (op && terminal == char) {
                        await close();
                    } else {
                        append(char);
                    }
                    break;
                case ' ':
                    if (op && terminal == char) {
                        await close();
                    }
                    append(char);
                    break;
                case '\\':
                    ptr.state.escape = true;
                    break;
                default:
                    if (header) {
                        ptr.state.header = null;
                        if (header == '=') open('e', '__null__');
                        else if (header == '^') open('f', '__null__');
                        else if (header == '$') open('v', ' ');
                    } else if (char == '=' || char == '$' || char == '^' || char == '?') {
                        if (i < 1) ptr.state.header = char;
                        ptr.state.detecting = char;
                    } else if (detecting) {
                        ptr.state.detecting = null;
                    }
                    append(char);
                    break;
            }
        }
    }
    while (ptr.state.op) {
        if (ptr.state.terminal == '}') throw { message: `expected a closing ${ptr.state.terminal}` }
        await close();
    }
    if (ptr.state.detecting) {
        ptr.state.detecting = null;
    }
    return stack;
};

export async function interpolate(input: any, options: Expand.Options) {
    if (!check(input, String)) {
        return { value: input, changed: false };
    }
    return parse(await tokenize(input, options))
}

