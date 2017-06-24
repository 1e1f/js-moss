/// <reference path="../interfaces/interpolate.d.ts" />

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
      ptr.subst += char;
    } else {
      ptr.raw += char;
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
              stack[x][y] = { state: {}, raw: '', subst: '' };
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
            ptr.state.open = false;
            const res = replace(ptr.subst) || '';
            if (y > 0) {
              delete (ptr.state);
              y--;
              ptr = stack[x][y];
              ptr.subst += res;
            }
            else {
              if (res) { ptr.state.dirty = true };
              ptr.raw += res || '';
              x++;
              y = 0;
              stack[x] = [{ state: {}, raw: '', subst: '' }];
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
          append(char);
          break;
      }
    }
  }
  // delete ptr.state;
  return stack;
};

export function concat(stack: Elem[][]) {
  let out = ''
  let changed = false;
  for (const e of stack) {
    out += e[0].raw;
    if (e[0].state.dirty) changed = true;
  }
  return { value: out, changed: changed };
}

export function interpolate(str: string, replace: (sub: string) => string) {
  return concat(expand(str, replace));
}