/// <reference path="../../interfaces/interpolate.d.ts" />

import { check } from 'typed-json-transform';

export function join(current: any, next: any) {
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

export function newState() {
  return { state: {}, raw: '', subst: '' };
}


export function concat(stack: Expand.Elem[][]) {
  let out = '';
  let changed = false;
  for (const e of stack) {
    out = join(out, e[0].raw);
    if (e[0].state.dirty) changed = true;
  }
  return { value: out, changed: changed };
}