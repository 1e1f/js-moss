import { TokenList, Token } from './types';

export const nuller = (): void => null;

export const addPairToMap = ([m, p]: any) => {
    if (!p) return m;
    let [[k, kc], v] = p;
    if (k == '-') {
        const n = m[1].sequenceLength;
        console.log(`add incremented key ${n} to map`)
        console.log('has value', v)
        k = n;
        m[1].sequenceLength = n + 1;
    }
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

    const map = [{}, { this: 'mapping', keys: {}, sequenceLength: 0 }];
    const res = addPairToMap([map, pair]);
    return res;
}

export const appendToSequence = ([sequence, item]: any) => {
    if (!item) return sequence;
    let [i, ic] = item;
    console.log("append to sequence", sequence);
    sequence[0].push(i);
    sequence[1].items.push(ic);
    return sequence;
}

export const createSequence = ([item]: any, sequenceKind: 'flowSequence' | 'blockSequence') => {
    if (item.length != 1) {
        throw new Error('bad item' + JSON.stringify(item, null, 2));
    }
    const sequence: any[] = [[], { this: sequenceKind, items: [] }];
    const res = appendToSequence([sequence, item]);
    return res;
}

export const createFlowSequence = (args: any) => createSequence(args, 'flowSequence');
export const createBlockSequence = (args: any) => createSequence(args, 'blockSequence');


export function join(sequence: string[]) {
    // console.log('join', sequence)
    if (sequence.length == 1) {
        return sequence[0];
    }
    let memo = '';
    for (const item of sequence) {
        memo = memo + item;
    }
    return memo;
}

const char = (t: Token) => t.text;
const chars = (sequence: Token[]) => sequence.map(char).join('');

export function singleWord(sequence: Token[]) {
    const head: Token = sequence[0];
    const tail = <any>sequence[1] as Token[];

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
