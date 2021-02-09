import { Moss } from '../types';
import { decode, encode, transcode } from './parser';

export const canonicalBl = (bl: string) => encode(decode(bl));
export const canonicalBranchLocator = (branch: Moss.Branch) => decode(encode(branch));

import { prune } from 'typed-json-transform';
import { fromYaml } from '../yaml';


type MetaHashFunction = (meta: Moss.Branch, options?: any) => string

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

export const createBranchIndex = (branch: Moss.Branch, hashFunction?: MetaHashFunction) => {
  let ast = branch.ast;
  if (!ast) {
    ast = fromYaml(branch.text);
  }
  return {
    bl: searchableLocator(branch, hashFunction),
    kind: searchableLocator(decode(ast.kind || "data"), hashFunction)
  }
}

export const indexPaths = {
  organization: 's.bl.o',
  name: 's.bl.n',
  project: 's.bl.p',
  version: 's.bl.v',
  hash: 's.bl.h'
}
