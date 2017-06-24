import { valueForKeyPath, check, contains } from 'typed-json-transform';
import { interpolate } from './interpolate';

function _parse(input: string, trie: Object, opt?: any, fuse?: any[]): any {
  if (!fuse) {
    fuse = [];
  }
  const { value, changed } = interpolate(input, (str: string) => {
    const res = valueForKeyPath(str, trie);
    if (res) {
      return res;
    } else if (opt.mustPass) {
      throw new Error(`no value for required keypath ${str} in interpolation stack ${JSON.stringify(trie)}`);
    }
  });
  if (changed) {
    if (!contains(fuse, value)) {
      fuse.push(value);
      return _parse(value, trie, opt, fuse);
    }
    return value;
  }
  return input;
}

export function parse(template: string, trie: Object, mustPass?: boolean): any {
  if (!template) {
    throw new Error(`can't interpolate undefined`);
  }
  if (!trie) {
    throw new Error(`interpolating ${template} against undefined or null trie`);
  }
  return _parse(template, trie, { mustPass: mustPass });
}