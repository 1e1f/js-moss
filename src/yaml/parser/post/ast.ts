import { TokenList, Token } from './types';


export const addPairToMap = ([m, p]: any) => {
    //  console.log('m <=', p)
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
    return m;
}

export const createMap = ([pairs]: any) => {
    // console.log('@m', { pairs })
    const map = [{}, { this: 'mapping', keys: {}, comments: [], sequenceLength: 0 }];

    for (const pair of pairs) {
        if (pair) {
            const [k, v] = pair;
            const { isComment, ref, priority } = v[1];
            if (isComment) {
                map[1].comments.push(pair);
            } else {
                if (ref) {
                    // const existingRef = map[1].refs[ref];
                    // if (existingRef) {
                    //     console.log('resolve ambiguity', existingRef)
                    //     // console.log('resolve ambiguity', existingRef)
                    //     // skip add
                    // } else {
                    // map[1].refs[ref] = pair;
                    console.log('add ref', ref)
                    addPairToMap([map, pair]);
                    // }
                } else {
                    addPairToMap([map, pair]);
                }
            }
        }
    }
    return map;
}

export const appendToSequence = ([sequence, item]: any) => {
    if (!item) return sequence;
    console.log("+", item[0]);
    sequence[0].push(item);
    return sequence;
}

export const createSequence = ([items]: any, sequenceKind: 'flowSequence' | 'blockSequence') => {
    const sequenceValues = [];
    const comments: any = [];
    if (items) {
        for (const val of items) {
            console.log('+item', val)
            if (val[1].isComment) {
                comments.push(val);
            } else {
                sequenceValues.push(val);
            }
        }
    }
    const sequence: any[] = [sequenceValues, { this: sequenceKind, isIterable: true, comments }];
    return sequence;
}

export const createFlowSequence = (sequence: any) => createSequence(sequence, 'flowSequence');
export const createBlockSequence = (sequence: any) => createSequence(sequence, 'blockSequence');


export const nuller = (): void => null;
export const first = ([f, s]: any) => f;
export const second = ([f, s]: any) => s;
export const secondInList = ([list]: any[]) => list.map(([first, second]: any) => second);
export const third = ([f, s, t]: any) => t;
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
