
import { clone, mapToObject } from 'typed-json-transform';
import { TokenList, Token } from './types';


export const nuller = (): void => null;

export const addPairToMap = (args: any) => {
    console.log(args);
}

export const addPair = (args: any) => {
    console.log(args);
    // if (l[k]) {
    //     throw new Error(`duplicate key ${k}`);
    // }
    // l[k] = r;
}

export function join(list: string[]) {
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
