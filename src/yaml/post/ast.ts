import { TokenList, Token } from './types';

export const nuller = (): void => null;

export const addPairToMap = ([m, p]: any) => {
    if (!p) return m;
    const [[k, kc], v] = p;
    if (m[0][k]) {
        throw new Error(`duplicate key ${k}`);
    }
    m[0][k] = v;
    m[1].keys[k] = kc;
    console.log('addPairToMap', m);
    return m;
}

export const createMap = ([pair]: any) => {
    if (pair.length != 2) {
        throw new Error('bad pair' + JSON.stringify(pair, null, 2));
    }
    console.log('createMap', pair);

    const map = [{}, { this: 'mapping', keys: {} }];
    const res = addPairToMap([map, pair]);
    return res;
}

export function join(list: string[]) {
    // console.log('join', list)
    if (list.length == 1) {
        return list[0];
    }
    let memo = '';
    for (const item of list) {
        memo = memo + item;
    }
    return memo;
}

const char = (t: Token) => t.text;
const chars = (list: Token[]) => list.map(char).join('');

export function singleWord(list: Token[]) {
    const head: Token = list[0];
    const tail = <any>list[1] as Token[];

    let data;
    if (tail && tail.length) {
        data = head.value + chars(tail);
    } else {
        data = head.value
    }
    return data;
}

export const fork = ([lhs, op, rhs]: TokenList) => {
    const [l, l_] = lhs;
    const [r, r_] = rhs;
    return ([[(op == ' ' ? '<<' : op), l, r], [{ operator: true }, l_, r_]]);
}

export const unaryOperate = ([op, rhs]: TokenList) => ({ [op]: rhs });
export const operate = ([lhs, s1, [op], s2, rhs]: TokenList) => fork([lhs, op.text, rhs]);
