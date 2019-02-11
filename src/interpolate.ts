/// <reference path="../interfaces/interpolate.d.ts" />

import { check } from 'typed-json-transform';
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

export async function expandAsync(str: string, options: Expand.Options) {
  const { replace, call, shell, fetch, getStack, pushErrorState, popErrorState } = options;
  const template = String(str);
  let i = 0;
  let x = 0;
  let y = 0;

  const stack: Expand.Elem[][] = [[{ state: {}, raw: '', subst: '' }]];
  let ptr = stack[x][y];

  const append = (char: string) => {
    if (ptr.state.op) {
      ptr.subst += char;
    } else {
      ptr.raw += char;
    }
  }

  const bsp = () => {
    if (ptr.state.op) {
      ptr.subst = ptr.subst.slice(0, ptr.subst.length - 1);
    } else {
      ptr.raw = ptr.raw.slice(0, ptr.raw.length - 1);
    }
  }

  const open = (op: Expand.Op, terminal: Expand.Terminal) => {
    if (pushErrorState) pushErrorState();
    bsp();
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

  const close = async () => {
    const op = ptr.state.op;
    ptr.state.op = null;
    ptr.state.terminal = null;
    let res;
    if (check(ptr.subst, Object)) {
      if (popErrorState) popErrorState('[object]');
      res = await call(ptr.subst);
    } else {
      if (popErrorState) popErrorState(ptr.subst);
      if (op == 'replace') {
        res = replace(ptr.subst);
      } else if (op == 'shell') {
        res = shell(ptr.subst);
      } else if (op == 'fetch') {
        res = await fetch(ptr.subst);
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
            open(detecting == '$' ? 'replace' : detecting == '^' ? 'fetch' : 'math', '}');
            break;
          }
          append(char);
          break;
        case '}': case ')':
          if (ptr.state.op && ptr.state.terminal == ' ') {
            await close();
          }
          if (ptr.state.op && ptr.state.terminal == char) {
            await close();
            break;
          }
          append(char);
          break;
        case ' ':
          if (ptr.state.op && ptr.state.terminal == char) {
            await close();
          }
          append(char);
          break;
        case '\\':
          ptr.state.escape = true;
          break;
        default:
          if (detecting) {
            if (ptr.raw.length == 1) {
              if (detecting == '=') open('math', '__null__');
              else if (detecting == '^') open('fetch', '__null__');
              else if (detecting == '$') open('replace', ' ');
            } else {
              ptr.state.detecting = null;
            }
          } else if (char == '=' || char == '$' || char == '^') {
            ptr.state.detecting = char;
          }
          append(char);
          break;
      }
    }
  }
  while (ptr.state.op) {
    await close();
  }
  if (ptr.state.detecting) {
    // append(ptr.state.detecting);
    ptr.state.detecting = null;
  }
  // delete ptr.state;
  return stack;
};

export function expand(str: string, options: Expand.Options) {
  const { replace, call, shell, fetch, getStack, pushErrorState, popErrorState } = options;
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

  function bsp() {
    if (ptr.state.op) {
      ptr.subst = ptr.subst.slice(0, ptr.subst.length - 1);
    } else {
      ptr.raw = ptr.raw.slice(0, ptr.raw.length - 1);
    }
  }

  function open(op: Expand.Op, terminal: Expand.Terminal) {
    if (pushErrorState) pushErrorState();
    bsp();
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

  async function close() {
    const op = ptr.state.op;
    ptr.state.op = null;
    ptr.state.terminal = null;
    let res;
    if (check(ptr.subst, Object)) {
      if (popErrorState) popErrorState('[object]');
      res = call(ptr.subst);
    } else {
      if (popErrorState) popErrorState(ptr.subst);
      if (op == 'replace') {
        res = replace(ptr.subst);
      } else if (op == 'shell') {
        res = shell(ptr.subst);
      } else if (op == 'fetch') {
        res = fetch(ptr.subst);
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
            open(detecting == '$' ? 'replace' : detecting == '^' ? 'fetch' : 'math', '}');
            break;
          }
          append(char);
          break;
        case '}': case ')':
          if (ptr.state.op && ptr.state.terminal == ' ') {
            close();
          }
          if (ptr.state.op && ptr.state.terminal == char) {
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
            if (ptr.raw.length == 1) {
              if (detecting == '=') open('math', '__null__');
              else if (detecting == '^') open('fetch', '__null__');
              else if (detecting == '$') open('replace', ' ');
            } else {
              ptr.state.detecting = null;
            }
          } else if (char == '=' || char == '$' || char == '^') {
            ptr.state.detecting = char;
          }
          append(char);
          break;
      }
    }
  }
  while (ptr.state.op) {
    close();
  }
  if (ptr.state.detecting) {
    // append(ptr.state.detecting);
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

export async function interpolateAsync(input: any, options: Expand.Options) {
  if (!check(input, String)) {
    return { value: input, changed: false };
  }
  return concat((await expandAsync(input, options)));
}

export function interpolate(input: any, options: Expand.Options) {
  if (!check(input, String)) {
    return { value: input, changed: false };
  }
  return concat(expand(input, options));
}
