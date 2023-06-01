import { Moss, SearchIndex, BLIndex } from "../types";
import { decode, encode } from "./parser";
import {
  check,
  prune,
  setValueForKeyPath,
  valueForKeyPath,
} from "typed-json-transform";
import { fromYaml } from "../yaml";
import { importPrefix } from "../types";
import { canonicalBranchLocator, stringifyBranchLocator } from "./canonical";

type HashFunction = (x) => string;
type HashFunctions = {
  [x: string]: HashFunction;
  branchMeta: HashFunction;
};

interface IndexProducer<T = string> {
  match: (value, key: string | number) => boolean;
  encode: (value, key: string | number, hashFunctions: HashFunctions) => T;
  hash?: (a: T, hashFunctions: HashFunctions) => string;
  compare?: (a: T, b: T) => number;
  container?: string;
  keyPath?: string;
}

type MetaHashFunction = (meta: Moss.Branch, options?: any) => string;

export const searchableLocator = (meta, hashMetadata?: MetaHashFunction) => {
  if (
    meta.nameSegment ==
    "Signup for our mailing list to be the first to hear about new products"
  ) {
    const encoded = encode(meta);
    console.log("decode", encoded);
    const canonicalLocator = decode(encoded);
    console.log("decoded", canonicalLocator);
  }
  const canonicalLocator = canonicalBranchLocator(meta);
  const locator = {
    o: canonicalLocator.organizationSegment,
    n: canonicalLocator.nameSegment,
    p: canonicalLocator.projectSegment,
    v: canonicalLocator.versionSegment,
    h: hashMetadata ? hashMetadata(canonicalLocator) : encode(canonicalLocator),
  };
  return prune(locator);
};

const blIndexer: IndexProducer<BLIndex> = {
  match: (value, key) =>
    typeof value === "string" ? value.indexOf(importPrefix) !== -1 : false,
  encode: (value, key, hashFunctions) => {
    const importTokenPos = value.indexOf(importPrefix);

    if (importTokenPos != -1) {
      let blLine = value.slice(importTokenPos + 1);
      // console.log("calc import", blLine);
      if (blLine[0] === "?") {
        // is Query not import, skip
        return;
      }
      if (blLine.indexOf("#") !== -1) {
        blLine = blLine.split("#")[0];
      }
      if (blLine.indexOf("}.") !== -1) {
        blLine = blLine.split("}.")[0] + "}";
      }
      if (blLine.indexOf("{") !== -1) {
        let res = blLine.match(/\{(.*)\}/);
        if (!res.length) {
          throw new Error("poorly formated import statement");
        }
        blLine = res[1];
        if (blLine.indexOf("$") !== -1) {
          // this is a dynamic import and cannot be indexed
          return;
        }

        // console.log("BLLine", blLine, res);
      }
      // remove trailing deferment
      if (blLine.indexOf(">") !== -1) {
        blLine = blLine.slice(0, blLine.indexOf(">"));
      }
      try {
        const meta = decode(blLine);
        const s = searchableLocator(
          meta,
          hashFunctions && hashFunctions.branchMeta
        );
        return s;
      } catch (e) {
        throw new Error(
          "bad locator " +
            blLine +
            " while building search index on key: " +
            key +
            " with value " +
            value
        );
      }
    }
  },
  hash: (a, hashFunctions) => a.h,
  compare: (a, b) => {
    if (a.h === b.h) return 0;
    return a < b ? -1 : 1;
  },
  container: "list",
  keyPath: "deps",
};

const branchIndexer = [blIndexer];

const indexAny = (
  level: any,
  producers: IndexProducer<any>[],
  searchIndex = {},
  hashFunctions?: HashFunctions
) => {
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
};

const indexWithIndexer = (
  value: any,
  key: any,
  producers: IndexProducer<any>[],
  searchIndex: any,
  hashFunctions?: HashFunctions
) => {
  let matched;
  for (const {
    match,
    encode,
    hash,
    compare,
    container,
    keyPath,
  } of producers) {
    if (match(value, key)) {
      matched = true;
      const res = encode(value, key, hashFunctions);
      if (res != undefined) {
        // console.log("matched", container, res, keyPath);
        switch (container) {
          case "set": {
            // let alreadyIndexed = false;
            let set: any;
            if (keyPath) {
              set = valueForKeyPath(keyPath, searchIndex);
              if (!set) {
                setValueForKeyPath({}, keyPath, searchIndex);
                set = valueForKeyPath(keyPath, searchIndex);
              }
            } else {
              console.log("index mode is aa but no target keypath");
              return res;
            }
            const key = hash(res, hashFunctions);
            if (!set[key]) {
              set[key] = res;
            }
          }
          case "list": {
            // let alreadyIndexed = false;
            let list: any;
            if (keyPath) {
              list = valueForKeyPath(keyPath, searchIndex);
              if (!list) {
                setValueForKeyPath([], keyPath, searchIndex);
                list = valueForKeyPath(keyPath, searchIndex);
              }
            } else {
              console.log("index mode is aa but no target keypath");
              return res;
            }
            let exists;
            for (const i of list) {
              if (compare(i, res) == 0) {
                exists = true;
              }
            }
            if (!exists) {
              list.push(res);
            }
          }
          default:
            return res;
        }
      }
    }
  }
  if (!matched) {
    // console.log('next base:', value)
    indexAny(value, producers, searchIndex, hashFunctions);
  }
};

export const createBranchIndex = (
  branch: Moss.Branch,
  hashFunctions?: HashFunctions
) => {
  // console.log("index", stringifyBranchLocator(branch));
  const bl = searchableLocator(
    branch,
    hashFunctions && hashFunctions.branchMeta
  );
  // console.log("createdBlIndex", bl.n);
  let ast = fromYaml(branch.text);
  const kind = searchableLocator(
    decode(ast.kind || "data"),
    hashFunctions && hashFunctions.branchMeta
  );
  // console.log("createdKindIndex", kind.n);
  const bi: SearchIndex = {};
  indexAny(ast, branchIndexer, bi, hashFunctions);
  return {
    ...bi,
    bl,
    kind,
  };
};

export const indexPaths = {
  organization: "s.bl.o",
  name: "s.bl.n",
  project: "s.bl.p",
  version: "s.bl.v",
  hash: "s.bl.h",
};

export const kindIndexes = {
  organization: "s.kind.o",
  name: "s.kind.n",
  project: "s.kind.p",
  version: "s.kind.v",
  hash: "s.kind.h",
};

export const depsIndexes = {
  organization: "s.deps.o",
  name: "s.deps.n",
  project: "s.deps.p",
  version: "s.deps.v",
  hash: "s.deps.h",
};
