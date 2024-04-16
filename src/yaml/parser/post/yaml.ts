import { Token, SourceMap, Identifier } from "./types";

export const tokenValue = ([tok]) => [tok.value, new SourceMap(tok)]
export const tokenText = ([tok]) => [tok.text, new SourceMap(tok)]
// export const unwrapToken = ([tok]) => {
//   console.log("unwrapToken", tok);
//   return [tok, new SourceMap(tok)];
// }

export const nuller = (): void => null;
export const first = ([f, s]: any) => f;
export const second = ([f, s]: any) => s;
export const secondInList = ([list]: any[]) =>
  list.map(([first, second]: any) => second);
export const third = ([f, s, t]: any) => t;

export function join(sequence: [string, SourceMap][]): [string, SourceMap] {
  let memo = "";
  let memoSource;
  for (const pair of sequence) {
    const [str, source] = pair;
    memo = memo + str;
    if (memoSource) {
      memoSource.expandWithMap(source);
    } else {
      memoSource = source;
    }
  }
  return [memo, memoSource];
}

export function joinNextTokenValue([str, source]: [string, SourceMap], b: Token): [string, SourceMap] {
  source.expandWithToken(b);
  return [str + b.value, source];
}

export function joinNextTokenText(a: [string, SourceMap], b: Token): [string, SourceMap] {
  a[1].expandWithToken(b);
  return [a[0] + b.text, a[1]];
}

export const chars = (sequence: Token[]) => {
  // console.log('join', sequence)
  if (sequence.length == 1) {
    return sequence[0];
  }
  let memo = "";
  let source;
  for (const t of sequence) {
    memo = memo + t.text;
    if (source) {
      source.expandWithToken(t);
    } else {
      source = new SourceMap(t);
    }
  }
  return [memo, source];
}