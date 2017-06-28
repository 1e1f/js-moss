import { valueForKeyPath, check, contains } from 'typed-json-transform';
import { interpolate } from './interpolate';

function _parse(input: string, trie: Object, opt?: any): { value: any, changed: boolean } {
  const { value, changed } = interpolate(input, (str: string) => {
    const res = valueForKeyPath(str, trie);
    if (res) {
      return res;
    } else if (opt.mustPass) {
      throw new Error(`no value for required keypath ${str} in interpolation stack ${JSON.stringify(trie)}`);
    }
  });
  if (changed) {
    return { value, changed: true };
  }
  return { value: input, changed: false };
}

export function parse(template: string, trie: Object, mustPass?: boolean): any {
  return _parse(template, trie, { mustPass: mustPass });
}