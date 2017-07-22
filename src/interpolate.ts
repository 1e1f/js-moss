/// <reference path="../interfaces/interpolate.d.ts" />

import { check, valueForKeyPath, isEqual } from 'typed-json-transform';
import * as yaml from 'js-yaml';
import * as math from 'mathjs';

function join(current: any, next: any) {
  if (current && check(current, String)) {
    if (next || check(next, Number)) {
      return current + next;
    }
  } else if (check(current, Number)) {
    if (next || check(next, Number)) {
      return parseInt('' + current + '' + next);
    }
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
    if (ptr.state.op) {
      ptr.subst += char;
    } else {
      ptr.raw += char;
    }
  }

  function open(op: string, terminal: string) {
    ptr.state.detecting = '';
    const existing = ptr.state.op;
    if (existing) {
      y++;
      stack[x][y] = newState();
      ptr = stack[x][y];
      ptr.raw = '';
    }
    ptr.state.op = op;
    ptr.state.terminal = terminal;
  }

  function close() {
    const op = ptr.state.op;
    ptr.state.op = '';
    ptr.state.terminal = '';
    let res;
    if (check(ptr.subst, Object)) {
      res = call(ptr.subst);
    } else {
      if (op == '$') {
        res = replace(ptr.subst);
      } else if (op == '=') {
        res = math.eval(ptr.subst);
      }
      if (!res)
        if (!check(res, Number)) res = '';
    }
    // console.log(op, ':', ptr.subst, '=', res);
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
    if (ptr.state.escape) {
      ptr.state.escape = false;
      append(char);
    } else {
      const op = ptr.state.detecting;
      switch (char) {
        case '{':
          if (op) {
            open(op, '}');
            break;
          }
          append(char);
          break;
        case '}':
          if (ptr.state.op) {
            if (ptr.state.terminal == ' ') {
              close();
            }
            close();
            break;
          }
          append(char);
          break;
        case ' ':
          if (ptr.state.op && ptr.state.terminal == char) {
            close();
          }
          append(char);
          break;
        case '\\':
          ptr.state.escape = true;
          break;
        default:
          if (op) {
            if (ptr.raw.length == 0 || ptr.raw.slice(-1) == ' ') {
              if (op == '$') open(op, ' ');
              else if (op == '=') open(op, '__');
            } else {
              append(op);
              ptr.state.detecting = '';
            }
          }
          if (char == '=' || char == '$') {
            ptr.state.detecting = char;
          } else {
            append(char);
          }
          break;
      }
    }
  }
  while (ptr.state.op) {
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
  // if (input[0] == '=') {
  //   const res: string = interpolate(input.slice(1), replace, call);
  //   return math.eval(res);
  // }
  const exp = expand(input, replace, call);
  const res = concat(exp);
  return res;
}
