/// <reference path="../../interfaces/interpolate.d.ts" />

import { check, valueForKeyPath } from 'typed-json-transform';

export const chunk = (txt: string, brackets: string | string[]) => {
  var parts = txt.split(brackets[0]);
  const chunks = [];
  for (var i = 1; i < parts.length; i++) {
    const [match, remainder] = parts[i].split(brackets[1]);
    chunks.push(match);
    if (remainder) {
      return { chunks, remainder }
    }
  }
  return { chunks };
}

export function join(current: any, next: any, curSource: string, nextSource: string): any {
  if (check(current, [Array, Object])) {
    if (check(next, Array)) {
      if (check(current, Array)) {
        return current.concat(next);
      } else {
        throw {
          message: `Can't append the array @ ${nextSource}\n to current nonArray`,
          function: 'join'
        }
      }
    }
    else if (next && check(next, String)) {
      const op = next[0];
      const arg = next.slice(1);
      if (op == '.') {
        const res = valueForKeyPath(arg, current);
        if (res) return res;
        throw {
          message: `${next} doesn't exist on ${curSource}, try ${Object.keys(current)}`,
          options: Object.keys(current)
        }
      } else if (op == '[') {
        const { chunks, remainder } = chunk(next, '[]');
        for (let i of chunks) {
          if (check(current, Array)) i = parseInt(i) as any;
          const chunkRes = current[i];
          if (!chunkRes) {
            throw {
              message: `${next} doesn't exist on ${curSource}, try ${Object.keys(current)}`,
              function: 'join',
              options: Object.keys(current)
            }
          }
          current = chunkRes;
        }
        if (remainder) return join(current, remainder, curSource, nextSource)
        return current;
      } else if (check(current, Array)) {
        return [...current, next];
      }
      throw {
        message: `${next} is a bad property accessor, maybe you meant .${next} or [${next}] ?`,
        function: 'join',
        options: Object.keys(current)
      }
    }
  }
  else if (current && check(current, String)) {
    if (check(next, [Object, Array])) {
      throw {
        message: `Can't append the value @ ${nextSource}\nIt is an Object or Array`,
        function: 'join'
      }
    }
    else if (next || check(next, Number)) {
      return current + next;
    }
  } else if (check(current, Number)) {
    if (check(next, [Object, Array])) {
      throw {
        message: `Can't append the value @ ${nextSource}\nIt is an Object or Array`,
        function: 'join'
      }
    }
    if (next) {
      return current + next;
    }
  } else if (next || check(next, Number)) {
    return next;
  }

  return current;
}

export const append = (stack: any[], char: any): boolean => {
  if (check(char, String)) {
    const lastIndex = (stack.length - 1) || 0;
    if (check(stack[lastIndex], String)) {
      stack[lastIndex] += char;
      return false;
    } else {
      stack.push(char);
      return true;
    }
  } else {
    stack.push(char);
    return true;
  }
}

export const pop = (stack: any[]) => {
  const lastIndex = (stack.length - 1) || 0;
  if (check(stack[lastIndex], String)) {
    const s = stack[lastIndex];
    const l = s.slice(-1);
    stack[lastIndex] = s.slice(0, s.length - 1);
    return l;
  } else {
    return stack.pop();
  }
}

export const reduce = (raw: any[], source: any[]) => {
  let res;
  let i = 0;
  for (const e of raw) {
    const prevIndex = i - 1;
    res = join(res, e, prevIndex ? source[prevIndex] : raw, source[i]);
    i++;
  }
  return res;
}

export function newState(options?: Partial<Expand.Elem>): Expand.Elem {
  return { sourceMap: [], out: [], source: [], ...options };
}

export function parse(tokens: Expand.Elem[]) {
  let out = '';
  let outSource = '';
  let changed = false;
  out = reduce(tokens[0].out, tokens[0].source);
  return { value: out, changed: changed };
}