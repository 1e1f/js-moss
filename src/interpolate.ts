/// <reference path="../interfaces/interpolate.d.ts" />

import { check, valueForKeyPath } from 'typed-json-transform';
import * as yaml from 'js-yaml';

function join(input: any, raw: any) {
  if (raw && check(raw, String)) {
    return input + raw;
  } else if (raw) {
    return raw;
  }
  return input;
}

function newState() {
  return { state: {}, raw: '', subst: '' };
}

export function expand(str: string, replace: (sub: string) => string) {
  let changed = false;
  const template = String(str);
  let i = 0;
  let x = 0;
  let y = 0;

  const stack: Elem[][] = [[{ state: {}, raw: '', subst: '' }]];
  let ptr = stack[x][y];

  function append(char: string) {
    if (ptr.state.open) {
      ptr.subst = join(ptr.subst, char);
    } else {
      ptr.raw = join(ptr.raw, char);
    }
  }

  for (i = 0; i != template.length; i++) {
    const char = template[i];
    if (ptr.state.escape == true) {
      ptr.state.escape = false;
      append(char);
    } else {
      switch (char) {
        case '{':
          if (ptr.state.dollar) {
            if (ptr.state.open) {
              y++;
              stack[x][y] = newState();
              ptr = stack[x][y];
            }
            ptr.state.open = true;
            ptr.state.dollar = false;
            break;
          }
          append(char);
          break;
        case '}':
          if (ptr.state.open) {
            const res = replace(ptr.subst) || '';
            if (y > 0) {
              delete stack[x][y];
              y--;
              ptr = stack[x][y];
              ptr.subst = join(ptr.subst, res);
            }
            else {
              if (res) { ptr.state.dirty = true };
              ptr.raw = join(ptr.raw, res);
              x++;
              y = 0;
              stack[x] = [newState()];
              ptr = stack[x][y];
            }
            break;
          }
          append(char);
          break;
        case '\\':
          ptr.state.escape = true;
          break;
        case '$':
          ptr.state.dollar = true;
          break;
        default:
          if (ptr.state.dollar) {
            append('$');
            ptr.state.dollar = false;
          }
          append(char);
          break;
      }
    }
  }
  // delete ptr.state;
  return stack;
};

export function concat(stack: Elem[][]) {
  let out = '';
  let changed = false;
  for (const e of stack) {
    out = join(out, e[0].raw);
    if (e[0].state.dirty) changed = true;
  }
  return { value: out, changed: changed };
}

export function __interpolate(input: any, replace: (sub: string) => string) {
  if (!check(input, String)) {
    return input;
  }
  return concat(expand(input, replace));
}

function _interpolate(input: string, trie: Object, opt?: any): { value: any, changed: boolean } {
  const { value, changed } = __interpolate(input, (str: string) => {
    const res = valueForKeyPath(str, trie);
    if (res) {
      return res;
    } else if (opt.mustPass) {
      throw new Error(`no value for required keypath ${str} in interpolation stack \n${yaml.dump(trie)}`);
    }
  });
  if (changed) {
    return { value, changed: true };
  }
  return { value: input, changed: false };
}

export function interpolate(template: string, trie: Object, mustPass?: boolean): any {
  return _interpolate(template, trie, { mustPass: mustPass });
}
