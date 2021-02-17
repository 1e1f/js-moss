import { Moss } from '../types';
import { decode, encode, transcode } from './parser';

export const canonicalBl = (bl: string) => encode(decode(bl));
export const canonicalBranchLocator = (branch: Moss.Branch) => decode(encode(branch));

import { check, hashField, prune, setValueForKeyPath, valueForKeyPath } from 'typed-json-transform';
import { fromYaml } from '../yaml';
import { stringify } from 'querystring';
import { importPrefix } from './version';

export const filterBranchName = (text) => text.replace(/[?@~&!:]/g, '');

export const filterBranch = (meta: Moss.Branch) => ({
  ...meta,
  nameSegment: filterBranchName(meta.nameSegment),
  projectSegment: filterBranchName(meta.projectSegment),
  organizationSegment: filterBranchName(meta.organizationSegment),
});

export const stringifyBranchLocator = (meta: Moss.Branch) => encode(filterBranch(meta));

// export const hydrateBl = (s) => decode(s, 'hydrate');
export const hydrateBranchLocator = (s) => decode(s, 'hydrate');

type MetaHashFunction = (meta: Moss.Branch, options?: any) => string

interface BLIndex {
  o: string
  n?: string
  p?: string
  v?: string
  h?: string
}

export const searchableLocator = (meta, hashMetadata?: MetaHashFunction) => {
  const canonicalLocator = canonicalBranchLocator(meta);
  const locator = {
    o: canonicalLocator.organizationSegment,
    n: canonicalLocator.nameSegment,
    p: canonicalLocator.projectSegment,
    v: canonicalLocator.versionSegment,
    h: hashMetadata ? hashMetadata(canonicalLocator) : encode(canonicalLocator)
  }
  return prune(locator);
}

type HashFunction = (x) => string
type HashFunctions = {
  [x: string]: HashFunction,
  branchMeta: HashFunction
}

interface IndexProducer<T = string> {
  match: (value, key: string | number) => boolean
  encode: (value, key: string | number, hashFunctions: HashFunctions) => T
  hash?: (a: T, hashFunctions: HashFunctions) => string
  compare?: (a: T, b: T) => number
  container?: string
  keyPath?: string
}

const blIndexer: IndexProducer<BLIndex> = {
  match: (value, key) => (typeof value === 'string') ? (value.indexOf(importPrefix) !== -1) : false,
  encode: (value, key, hashFunctions) => {
    const importTokenPos = value.indexOf(importPrefix);
    if (importTokenPos != -1) {
      let blLine = value.slice(importTokenPos + 1);
      if (blLine.indexOf('#') !== -1) {
        blLine = blLine.split('#')[0];
      }
      try {
        const meta = decode(blLine);
        const s = searchableLocator(meta, hashFunctions.branchMeta);
        return s;
      } catch (e) {
        console.log("bad locator while building search index on key:", key, "with value", value)
        console.log(e);
      }
    }
  },
  hash: (a, hashFunctions) => a.h,
  compare: (a, b) => {
    if (a.h === b.h) return 0;
    return a < b ? -1 : 1;
  },
  container: 'list',
  keyPath: 'deps'
}

const branchIndexer = [blIndexer]

const indexAny = (level: any, producers: IndexProducer<any>[], searchIndex = {}, hashFunctions?: HashFunctions) => {
  if (check(level, Object)) {
    for (const k of Object.keys(level)) {
      indexWithIndexer(level[k], k, producers, searchIndex, hashFunctions);
    }
  } else if (Array.isArray(level)) {
    let index = 0;
    for (const item of level) {
      indexWithIndexer(item, index, producers, searchIndex, hashFunctions);
      index++;
    }
  }
  return searchIndex;
}

const indexWithIndexer = (value: any, key: any, producers: IndexProducer<any>[], searchIndex: any, hashFunctions?: HashFunctions) => {
  let matched;
  for (const { match, encode, hash, compare, container, keyPath } of producers) {
    if (match(value, key)) {
      matched = true;
      const res = encode(value, key, hashFunctions);
      if (res != undefined) {
        // console.log("matched", container, res, keyPath);
        switch (container) {
          case 'set': {
            // let alreadyIndexed = false;
            let set: any;
            if (keyPath) {
              set = valueForKeyPath(keyPath, searchIndex);
              if (!set) {
                setValueForKeyPath({}, keyPath, searchIndex)
                set = valueForKeyPath(keyPath, searchIndex);
              }
            } else {
              console.log("index mode is aa but no target keypath")
              return res;
            }
            const key = hash(res, hashFunctions);
            if (!set[key]) {
              set[key] = res;
            }
          } case 'list': {
            // let alreadyIndexed = false;
            let list: any;
            if (keyPath) {
              list = valueForKeyPath(keyPath, searchIndex);
              if (!list) {
                setValueForKeyPath([], keyPath, searchIndex)
                list = valueForKeyPath(keyPath, searchIndex);
              }
            } else {
              console.log("index mode is aa but no target keypath")
              return res;
            }
            let exists;
            for (const i of list) {
              if (compare(i, res) == 0) {
                exists = true;
              }
            }
            if (!exists) {
              list.push(res)
            }
          }
          default: return res;
        }
      }
    }
  }
  if (!matched) {
    // console.log('next base:', value)
    indexAny(value, producers, searchIndex, hashFunctions)
  }
}

export const createBranchIndex = (branch: Moss.Branch, hashFunctions?: HashFunctions) => {
  if (!hashFunctions.branchMeta) {
    throw new Error("createBranchIndex needs branch hash function")
  }
  let ast = branch.ast;
  if (!ast) {
    ast = fromYaml(branch.text);
  }
  const bi = {};
  indexAny(ast, branchIndexer, bi, hashFunctions);
  return {
    ...bi,
    bl: searchableLocator(branch, hashFunctions.branchMeta),
    kind: searchableLocator(decode(ast.kind || "data"), hashFunctions.branchMeta),
  }
}

export const indexPaths = {
  organization: 's.bl.o',
  name: 's.bl.n',
  project: 's.bl.p',
  version: 's.bl.v',
  hash: 's.bl.h'
}

export const getCanonicalOrgName = (org, segment) => {
  return org.s && org.s.bl && org.s.bl.o || canonicalBl(org.organizationSegment);
}
