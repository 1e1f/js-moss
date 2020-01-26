import { check } from 'typed-json-transform';
const expression = require('../../compiled/expression');

import { newState, parse, reduce, append as _append } from './shared';

export function tokenize(str: string, options: Expand.Options) {
    const { dereference, dereferenceSync, call, shell, fetch } = options;
    const template = String(str);
    let i = 0;
    let offset = i;
    let x = 0;
    let y = 0;

    const stack: Expand.Elem[] = [newState()];
    let frame = stack[y];

    const append = (val: any) => {
        if (frame.escape) {
            frame.escaped += val;
            return;
        }
        let nextChunk = false;
        nextChunk = _append(frame.out, val)
        if (nextChunk) {
            frame.source.push(val);
        } else {
            frame.source[(frame.source.length - 1) || 0] += val;
        }
    }

    const open = (char: string, op: Expand.Op, terminal: Expand.Terminal) => {
        const { escape, escaped } = frame;
        if (escape) {
            frame.escape = null;
            frame.escaped = '';
            const directive = escaped.slice(1);
            if (!directive){
                throw new Error('explicit interpolate without 2 char prefix directive');
            }
            append(directive);
            if (char) {
                append(char);
            }
        }
        frame.header = null;
        frame.detecting = null;
        y++;
        stack[y] = newState({ op: escape ? 'n' : op, terminal });
        frame = stack[y];
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

    const subSync = (fn: (s: string, location: any) => any, str: string, sourceMap?: number[]) => {
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
        const { op, terminal, escape, escaped } = frame;
        frame.sourceMap = [offset, i + (terminal && terminal.length) - offset];
        frame.op = null;
        frame.terminal = null;
        if (escape && escaped) {
            frame.escape = false;
            frame.escaped = '';
            append(escaped);
        }
        const swap = reduce(frame.out, frame.source);
        let out: any;
        let res;
        if (check(swap, [Object, Array])) {
            out = call(swap);
        } else {
            if (op == 'v') {
                out = sub(dereference, swap, frame.sourceMap);
            } else if (op == 's') {
                out = sub(shell, swap, frame.sourceMap);
            } else if (op == 'f') {
                out = sub(fetch, swap, frame.sourceMap);
            } else if (op == 'e') {
                const deref = (str: string) => subSync(dereferenceSync, str, frame.sourceMap)
                out = sub((s) => expression(deref, check).parse(s), swap, frame.sourceMap)
            } else if (op == 'n') {
                if (terminal != '__null__') append(terminal);
                out = reduce(frame.out, frame.source);
            }
        }
        // if (out) frame.dirty = true;
        // const { out } = frame;
        // const out = reduce(frame.out, frame.source);
        // delete stack[y];
        stack.length--
        y--;
        frame = stack[y];
        append(out);
        // frame.source.push(out);
    }

    for (i = 0; i != template.length; i++) {
        const char = template[i];
        const { detecting, header, op, terminal, escape, escaped } = frame;
        switch (char) {
            case '(':
                if (detecting && (detecting == '$')) {
                    open(char, 's', ')');
                    break;
                } else {
                    append(char);
                }
                break;
            case '{':
                if (detecting) {
                    open(char, detecting == '$' ? 'v' : detecting == '^' ? 'f' : 'e', '}');
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
                    } else if (char == '=' || char == '$' || char == '^') {
                        if (i < 1) ptr.state.header = char;
                        ptr.state.detecting = char;
                    } else if (detecting) {
                        ptr.state.detecting = null;
                    }
                    if (escape) {
                        frame.escape = false;
                        frame.escaped = null;
                        // console.log('append escaped', escaped)
                        append(escaped);
                    }
                }
                append(char);
                break;
        }
    }
    if (frame.detecting) {
        append(frame.detecting);
    }
    while (frame.op) {
        if (frame.terminal == '}') throw { message: `expected a closing ${frame.terminal}` }
        close();
    }
    if (frame.detecting) {
        frame.detecting = null;
    }
    return stack;
};

export function interpolate(input: any, options: Expand.Options) {
    if (!check(input, String)) {
        return { value: input, changed: false };
    }
    return parse(tokenize(input, options))
}

