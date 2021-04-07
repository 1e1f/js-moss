import { decode, encode, transcode, } from './parser';
export * from './parser';
import { clone, contains, union } from 'typed-json-transform';
import { toYaml } from '../yaml';
import { createBranchIndex, hydrateBranchLocator, stringifyBranchLocator } from './canonical';
import { newState } from '../state';
import { BranchLocatorSelector, Moss } from '../types';
export { decode as decodeBranchLocator, encode as encodeBranchLocator, transcode as transcodeSegment }

export * from './canonical';

export const slugifyBranchLocator = (bl) => encode(decode(bl), { urlSafe: true });

export const cloneBranch = (branch: Moss.Branch) => {
  const bl = stringifyBranchLocator(branch);
  return createBranch(bl, branch.parsed, clone(branch.ast));
}

export const createBranch = (bl: string, parsed: any, ast?: any, hashFunctions?: any) => {
  const meta = hydrateBranchLocator(bl);
  const text = toYaml(ast || parsed);
  const branch = {
    ...meta,
    text,
    parsed,
    ast: ast || parsed,
    s: hashFunctions && createBranchIndex({ ...meta, text }, hashFunctions),
    state: newState()
  }
  return branch;
}

export const selectBranchLocator = (bl: string, options: BranchLocatorSelector) => {
  if (!bl) {
    console.error({ bl, options });
    throw new Error('selectBranchLocator with no bl')
  }
  const branch = decode(bl);
  for (const k of Object.keys(options)) {
    const expected = options[k];
    const actual = branch[k];
    if (Array.isArray(expected)) {
      if (!contains(expected, actual)) {
        return false;
      }
    }
    else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

export const compareBranchLocators = (bl: string, bl2: string) => {
  if (!(bl && bl2)) return null;
  else if (!bl) return decode(bl2);
  else if (!bl2) return decode(bl);
  else {
    const lhs = decode(bl);
    const rhs = decode(bl2);
    const allKeys = union(Object.keys(rhs), Object.keys(lhs));
    const diff = {};
    for (const k of allKeys) {
      const expected = rhs[k];
      const actual = lhs[k];
      if (actual !== expected) {
        diff[k] = rhs[k];
      }
    }
    return Object.keys(diff).length ? diff : null;
  }
}

export * from './version';
