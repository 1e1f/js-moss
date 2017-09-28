/// <reference path="../interfaces/interpolate.d.ts" />

import { check, extend, valueForKeyPath, isEqual } from 'typed-json-transform';
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

export function expand(str: string, options: Expand.Options) {
  const { replace, call, shell, getStack } = options;
  let changed = false;
  const template = String(str);
  let i = 0;
  let x = 0;
  let y = 0;

  const stack: Expand.Elem[][] = [[{ state: {}, raw: '', subst: '' }]];
  let ptr = stack[x][y];

  function append(char: string) {
    if (ptr.state.op) {
      ptr.subst += char;
    } else {
      ptr.raw += char;
    }
  }

  function open(op: Expand.Op, terminal: Expand.Terminal) {
    ptr.state.detecting = null;
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
    if (ptr.state.terminal == ')') {

    }
    ptr.state.op = null;
    ptr.state.terminal = null;
    let res;
    if (check(ptr.subst, Object)) {
      res = call(ptr.subst);
    } else {
      if (op == 'replace') {
        res = replace(ptr.subst);
      } else if (op == 'shell') {
        res = shell(ptr.subst);
      } else if (op == 'math') {
        const vars = getStack();
        if (Object.keys(vars).length) {
          res = math.eval(ptr.subst, vars);
        } else {
          res = math.eval(ptr.subst);
        }
      }
      if (!res) {
        if (!check(res, Number)) res = '';
      }
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
      const detecting = ptr.state.detecting;
      switch (char) {
        case '(':
          if (detecting) {
            open('shell', ')');
            break;
          }
          append(char);
          break;
        case '{':
          if (detecting) {
            open(detecting == '$' ? 'replace' : 'math', '}');
            break;
          }
          append(char);
          break;
        case '}': case ')':
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
          if (detecting) {
            if (ptr.raw.length == 0 || ptr.raw.slice(-1) == ' ') {
              if (detecting == '=') open('math', '__null__');
              else open('replace', ' ');
            } else {
              append(detecting);
              ptr.state.detecting = null;
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
  if (ptr.state.detecting) {
    append(ptr.state.detecting);
    ptr.state.detecting = null;
  }
  // delete ptr.state;
  return stack;
};

export function concat(stack: Expand.Elem[][]) {
  let out = '';
  let changed = false;
  for (const e of stack) {
    out = join(out, e[0].raw);
    if (e[0].state.dirty) changed = true;
  }
  return { value: out, changed: changed };
}

export function interpolate(input: any, options: Expand.Options) {
  if (!check(input, String)) {
    return { value: input, changed: false };
  }
  const exp = expand(input, options);
  const res = concat(exp);
  return res;
}
