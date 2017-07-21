/// <reference path="../interfaces/interpolate.d.ts" />

import { check, valueForKeyPath, isEqual } from 'typed-json-transform';
import * as yaml from 'js-yaml';

function join(current: any, next: any) {
  if (current && check(current, String)) {
    return current + next;
  } else if (next || check(next, Number)) {
    return next;
  }
  return current;
}

function newState() {
  return { state: {}, raw: '', subst: '' };
}

export function expand(str: string, replace: (sub: string) => string, call: (sub: any) => any) {
  let changed = false;
  const template = String(str);
  let i = 0;
  let x = 0;
  let y = 0;

  const stack: Elem[][] = [[{ state: {}, raw: '', subst: '' }]];
  let ptr = stack[x][y];

  function append(char: string) {
    if (ptr.state.open) {
      ptr.subst += char;
    } else {
      ptr.raw += char;
    }
  }

  function open(terminal: string) {
    if (ptr.state.open) {
      y++;
      stack[x][y] = newState();
      ptr = stack[x][y];
      ptr.raw = '';
    }
    ptr.state.open = true;
    ptr.state.terminal = terminal;
    ptr.state.dollar = false;
  }

  function close() {
    ptr.state.open = false;
    ptr.state.terminal = '';
    let res;
    if (check(ptr.subst, Object)) {
      res = call(ptr.subst);
    } else {
      res = replace(ptr.subst);
      if (!res)
        if (!check(res, Number)) res = '';
    }
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
            open('}');
            break;
          }
          append(char);
          break;
        case '}':
          if (ptr.state.open) {
            if (ptr.state.terminal == ' ') {
              close();
            }
            if (ptr.state.open) {
              close();
            }
            break;
          }
          append(char);
          break;
        case ' ':
          if (ptr.state.open && ptr.state.terminal == ' ') {
            close();
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
            if (ptr.raw.length == 0 || ptr.raw.slice(-1) == ' ') {
              open(' ');
            } else {
              ptr.state.dollar = false;
              append('$');
            }
          }
          append(char);
          break;
      }
    }
  }

  if (ptr.state.open) {
    close();
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

export function interpolate(input: any, replace: (sub: string) => string, call: (sub: any) => any) {
  if (!check(input, String)) {
    return { value: input, changed: false };
  }
  const exp = expand(input, replace, call);
  const res = concat(exp);
  return res;
}
