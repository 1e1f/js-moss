import {
  mergeArray,
  amap as map,
  aokmap as okmap,
  arrayify,
  extend,
  check,
  clone,
  each,
  sum,
  valueForKeyPath,
  all,
  isEqual,
  setValueForKeyPath,
  mergeOrReturnAssignment,
  contains,
} from "typed-json-transform";
import { interpolateAsync as __interpolate } from "./interpolate";
import {
  cascadeAsync as _cascade,
  shouldConstruct,
  select,
  parseSelectors,
} from "./cascade";
import * as yaml from "js-yaml";
const expression = require('../compiled/expression');

import { getBranchAsync as getBranch } from "./resolvers";
import { encodeBranchLocator } from "./branch";

import {
  newLayer,
  pushState,
  currentErrorPath,
  pushErrorPath,
  popErrorPath,
} from "./state";

import { Moss, Merge, Expand } from './types';

import { handleError } from "./util";
import { dereference as dereferenceSync } from "./sync";

type Functions = Moss.Async.Functions;
type Resolvers = Moss.Async.Resolvers;

export const continueWithNewFrame = async (
  current: Moss.ReturnValue,
  input: Moss.BranchData
) => {
  const layer = pushState(current);
  return await parseNextStructure(layer, input);
};

export const next = continueWithNewFrame;

export const parseFunctions = async (current: Moss.ReturnValue) => {
  const { state, data } = current;
  const source: any = clone(data);
  const target = state.target || current.data;
  for (const _key of Object.keys(source)) {
    if (_key[0] === "<" || _key[_key.length - 1] === "<") {
      await parseFunction(current, state, source, target, _key);
    }
  }
}

export const parseFunction = async (
  current: Moss.ReturnValue,
  state: any,
  source: any,
  target: any,
  _key: string,
  setKey?: (key: string) => void,
  setRes?: (res: any) => void) => {
  if (_key.length == 1) {
    await functions._closure(current, source[_key]);
  } else if (contains(mergeOperators, _key[1])) {
    const operator = _key[1];
    if (functions[operator]) {
      await functions[operator](current, source[_key]);
    } else {
      const { selectors } = parseSelectors(state.selectors);
      const precedence = select(selectors, _key.slice(2));
      if (target != current.data)
        throw { message: "not targeting current object..." };
      if (precedence > (state.merge.precedence[operator] || 0)) {
        state.merge.precedence[operator] = precedence;
        setKey && setKey(_key[0] + _key[1]);
        setRes && setRes((await continueWithNewFrame(current, source[_key])).data);
      }
    }
  }
  else {
    let fn;
    if (_key[_key.length - 1] === "<") {
      fn = _key.slice(0, _key.length - 1);
    } else {
      fn = _key.slice(1);
    }
    if (functions[fn]) {
      await functions[fn](current, source[_key]);
    } else {
      throw {
        message: `no known function ${fn}`,
        errorPaths: state.errorPaths,
      };
    }

  }
}

export const parseObject = async (current: Moss.ReturnValue) => {
  const { state } = current;
  const source: any = clone(current.data);
  const target = state.target || current.data;
  for (const _key of Object.keys(source)) {
    let res;
    if (!_key) {
      continue;
    }
    delete target[_key];
    let key = "";
    currentErrorPath(state).path.push(_key);
    if (_key[_key.length - 1] === ">") {
      key = _key.slice(0, _key.length - 1);
      res = source[_key];
    } else {
      if (_key[0] === "<" || _key[_key.length - 1] === "<") {
        await parseFunction(current, state, source, target, _key, (s) => key = s, (r) => res = r);
      } else {
        let val = source[_key];
        if (_key[0] === "$") {
          key = <any>(await interpolate(current, _key)).data;
        } else if (_key[0] == "\\") {
          key = key.slice(1);
        } else if (_key.indexOf(".") != -1) {
          const [first, ...kp] = _key.split(".");
          key = first;
          val = {};
          setValueForKeyPath(source[_key], kp.join("."), val);
        } else {
          key = _key;
        }
        res = (await continueWithNewFrame(current, val)).data;
      }
    }
    if (key) {
      state.auto[key] = res;
      state.autoMap[key] = currentErrorPath(state).path.join(".");
      target[key] = res;
    }
    currentErrorPath(state).path.pop();
  }
  return current;
};

export const parseArray = async (
  layer: Moss.ReturnValue,
  input: Moss.BranchData
) => {
  const { state } = layer;
  return {
    data: await map(input, async (item: any, index) => {
      currentErrorPath(state).path.push(`${index}`);
      const res: Moss.ReturnValue = (
        await continueWithNewFrame({ data: input, state }, item)
      ).data;
      currentErrorPath(state).path.pop();
      return res;
    }),
    state,
  };
};

export const parseNextStructure = async (
  layer: Moss.ReturnValue,
  input: Moss.BranchData
) => {
  const { state } = layer;
  try {
    if (check(input, Array)) {
      return await parseArray(layer, input);
    } else if (check(input, Object)) {
      if (shouldConstruct(input)) {
        await parseFunctions({ data: input, state });
        return await cascade({ data: input, state });
      }
      return await parseObject({ data: input, state });
    } else {
      return await interpolate(layer, input);
    }
  } catch (e) {
    handleError(e, layer, input);
  }
};

export const onMatch = async (
  rv: Moss.ReturnValue,
  setter: any,
  operator: Merge.Operator,
  key: string
) => {
  let { state, data: lhs } = rv;
  currentErrorPath(state).path.push(key);
  state.merge.operator = operator;
  const rhs = (await continueWithNewFrame({ data: {}, state }, setter)).data;
  if (check(lhs, Array)) {
    mergeArray(rv, rhs);
  } else if (check(lhs, Object)) {
    mergeOrReturnAssignment(rv, rhs);
  } else {
    rv.data = rhs;
  }
  currentErrorPath(state).path.pop();
};

const constructOperators: Merge.Operator[] = ["=", "+", "-"];
const mergeOperators: Merge.Operator[] = [
  "=",
  "+",
  "|",
  "^",
  "*",
  "&",
  "-",
  "?",
];

export const cascade = async (rv: Moss.ReturnValue) => {
  const input = clone(rv.data);
  rv.data = null;
  for (const operator of constructOperators) {
    await _cascade(rv, input, {
      operator,
      usePrecedence: operator == "=",
      onMatch,
    });
  }
  return rv;
};

const functions: Functions = {};
const resolvers: Resolvers = {};

export function getFunctions() {
  return functions;
}

export function addFunctions(userFunctions: Functions) {
  extend(functions, userFunctions);
}

export function getResolvers() {
  return resolvers;
}

export function addResolvers(userResolvers: Resolvers) {
  extend(resolvers, userResolvers);
}

addResolvers({
  hello: {
    match: (bl: string) => bl == "hello",
    resolve: async (bl: string) => ({
      organizationSegment: "test",
      pathSegment: bl,
      data: "hello world!",
    }),
  },
});

const stack = async (current: Moss.ReturnValue, args: any) => {
  const { data, state: _state } = current;
  const state = clone(_state);
  state.locked = true;
  state.target = state.stack;
  await parseNextStructure(
    {
      data,
      state,
    },
    args
  );
  _state.stack = state.stack;
};

addFunctions({
  select: async (current: Moss.ReturnValue, args: any) => {
    const { data, state: _state } = current;
    const state = clone(_state);
    state.locked = true;
    state.target = state.selectors;
    await parseNextStructure(
      {
        data,
        state,
      },
      args
    );
    _state.selectors = state.selectors;
  },
  stack: stack,
  $: stack,
  _closure: async (current: Moss.ReturnValue, args: any) => {
    await parseNextStructure(current, args);
  },
  extend: async (parent: Moss.ReturnValue, args: any) => {
    const layer = await continueWithNewFrame(parent, args);
    const { data } = layer;
    if (!data.source) {
      throw {
        message: `for $extend please supply an 'source:' branch`,
        errorPaths: layer.state.errorPaths,
      };
    }
    let res = data.source;
    delete data.source;
    for (const i in data) {
      const ir = await continueWithNewFrame(layer, data[i]);
      res = extend(res, ir.data);
    }
    return res;
  },
  match: async (parent: Moss.ReturnValue, args: any) => {
    const base = currentErrorPath(parent.state).path.join(".");
    // currentErrorPath(parent.state).path.push("from");
    const iterable = args && Object.keys(args);

    const nextLayer = pushState(parent);
    const heap = (kp: string) => {
      if (kp.split('.')[0] == 'stack') {
        return valueForKeyPath(kp, nextLayer.state)
      }
      return valueForKeyPath(kp, nextLayer.state.auto)
    }
    for (const k of iterable) {
      if (k == "default") {
        parent.data = args[k];
      } else {
        const data = expression(heap).parse(k);
        // const { data } = await interpolate(nextLayer, '=' + k);
        if ((data == true) || (data == 1)) {
          parent.data = args[k];
          return;
        }
      }
    }
  },
  schema: async (current: Moss.ReturnValue, args: any) => {
    const { data } = await continueWithNewFrame(current, args);
    console.log('schema', data);
  },
  log: async (current: Moss.ReturnValue, args: any) => {
    each(arrayify(args), (i) => {
      let kp = i;
      let format = "json";
      if (check(i, Object)) {
        kp = i.keyPath;
        format = i.format;
      }
      const val = kp ? valueForKeyPath(kp, current) : current;
      switch (format) {
        case "json":
          console.log(JSON.stringify(val, null, 2));
          break;
        case "yaml":
          console.log(yaml.dump(val));
          break;
      }
    });
  },
  assert: async (parent: Moss.ReturnValue, args: any) => {
    throw {
      message: args,
      errorPaths: parent.state.errorPaths,
      source: args,
    };
  },
  each: async (parent: Moss.ReturnValue, args: any) => {
    const layer = await continueWithNewFrame(parent, args);
    const { data } = layer;
    if (!data.of) {
      throw {
        message: `for $each please supply an 'of:' branch`,
        errorPaths: layer.state.errorPaths,
        source: data,
      };
    }
    if (!data.do) {
      throw {
        message: `for $each please supply a 'do:' branch`,
        errorPaths: layer.state.errorPaths,
        source: data,
      };
    }
    let i = 0;
    for (const key in data.of) {
      const item = data.of[key];
      const ret = await continueWithNewFrame(layer, item);
      ret.state.auto.index = i;
      i++;
      await continueWithNewFrame(ret, clone(data.do));
    }
  },
  map: async (parent: Moss.ReturnValue, args: any) => {
    const base = currentErrorPath(parent.state).path.join(".");
    const { from, to } = args;
    if (!from) {
      throw {
        message: `for $map please supply 'from:' as input`,
        errorPaths: parent.state.errorPaths,
      };
    }
    currentErrorPath(parent.state).path.push("from");
    const fromCtx = await continueWithNewFrame(parent, from);
    currentErrorPath(fromCtx.state).path.pop();
    if (!to) {
      throw {
        message: `for $map please supply 'to:' as input`,
        errorPaths: fromCtx.state.errorPaths,
        source: args,
      };
    }
    let i = 0;
    parent.data = await okmap(fromCtx.data, async (item: any, key: string) => {
      if (fromCtx.state.autoMap[key]) {
        currentErrorPath(fromCtx.state).path = fromCtx.state.autoMap[key].split(
          "."
        );
      }
      const ctx = await continueWithNewFrame(fromCtx, item);
      currentErrorPath(ctx.state).path = (base + ".to").split(".");
      const nextLayer = pushState(ctx);
      nextLayer.state.auto.index = i;
      nextLayer.state.auto.value = item;
      nextLayer.state.auto.key = key;
      i++;
      return (await parseNextStructure(nextLayer, clone(to))).data;
    });
  },
  remap: async (parent: Moss.ReturnValue, args: any) => {
    const base = currentErrorPath(parent.state).path.join(".");
    const { from, to } = args;
    if (!from) {
      throw {
        message: `for $map please supply 'from:' as input`,
        errorPaths: parent.state.errorPaths,
      };
    }
    currentErrorPath(parent.state).path.push("from");
    const fromCtx = await continueWithNewFrame(parent, from);
    currentErrorPath(fromCtx.state).path.pop();
    if (!to) {
      throw {
        message: `for $map please supply 'to:' as input`,
        errorPaths: fromCtx.state.errorPaths,
        source: args,
      };
    }
    let i = 0;
    return await okmap(fromCtx.data, async (item: any, key: string) => {
      if (fromCtx.state.autoMap[key]) {
        currentErrorPath(fromCtx.state).path = fromCtx.state.autoMap[key].split(
          "."
        );
      }
      const ctx = await continueWithNewFrame(fromCtx, item);
      currentErrorPath(ctx.state).path = (base + ".to").split(".");
      const nextLayer = pushState(ctx);
      nextLayer.state.auto.index = i;
      nextLayer.state.auto.value = item;
      nextLayer.state.auto.memo = key;
      i++;
      return (await parseNextStructure(nextLayer, clone(to))).data;
    });
  },
  reduce: async (parent: Moss.ReturnValue, args: any) => {
    const layer = await continueWithNewFrame(parent, args);
    const { data } = layer;
    if (!data.each) {
      throw {
        message: `for $reduce please supply 'each:' as branch`,
        errorPaths: layer.state.errorPaths,
        source: data,
      };
    }
    if (!data.with) {
      throw {
        message: `for $reduce please supply 'with:' in branch`,
        errorPaths: layer.state.errorPaths,
        source: data,
      };
    }
    if (check(data.each, Array)) {
      let res: any = data.memo;
      for (const i in data.each) {
        const val = data.each[i];
        const layer = await continueWithNewFrame(parent, val);
        if (functions[data.with]) {
          res = functions[data.with](layer, {
            value: val,
            memo: res,
            index: i,
          });
        } else {
          const nextLayer = pushState(layer);
          nextLayer.state.auto.index = i;
          nextLayer.state.auto.value = val;
          nextLayer.state.auto.memo = res;
          res = (await parseNextStructure(nextLayer, data.with)).data;
        }
      }
      parent.data = res;
    }
    if (check(data.each, Object)) {
      let i = 0;
      const nextLayer = pushState(layer);
      const { state } = nextLayer;
      state.auto.memo = data.memo || 0;
      for (const key in data.each) {
        const val = data.each[key];
        state.auto.index = i;
        i++;
        state.auto.key = key;
        state.auto.value = val;
        const res = (await parseNextStructure(nextLayer, clone(data.with)))
          .data;
        if (check(res, Object)) {
          extend(nextLayer.state.auto.memo, res);
        } else state.auto.memo = res;
      }
      parent.data = state.auto.memo;
    }
  },
  compare: async (parent: Moss.ReturnValue, _args: any) => {
    const args = (await continueWithNewFrame(parent, _args)).data;
    const [first, ...rest] = args;
    const res = all(rest, (arg) => {
      return isEqual(arg, first);
    });
    parent.data = res;
  },
  group: async (parent: Moss.ReturnValue, args: any) => {
    const layer = await continueWithNewFrame(parent, args);
    const { data } = layer;
    parent.data = sum(data, (v: any) => v);
  },
  sum: async (parent: Moss.ReturnValue, args: any) => {
    const layer = await continueWithNewFrame(parent, args);
    const { data } = layer;
    parent.data = sum(data, (v: any) => v);
  },
});

async function interpolate(layer: Moss.ReturnValue, input: any) {
  const { data, state } = layer;
  const dictionary = { ...state.auto, stack: state.stack };
  const res = await _interpolate(layer, input, dictionary);
  return { data: res, state: layer.state } as Moss.ReturnValue;
}

const interpolationFunctions = {};

export function setOptions(options: Expand.Options) {
  extend(interpolationFunctions, options);
}

export const dereference = async (
  str: string,
  { layer, defer, dictionary, popAll, sourceMap }: any
) => {
  // replace from trie
  if (!str) return;
  popAll();
  pushErrorPath(layer.state, {
    path: sourceMap,
    rhs: true,
  });
  const res = valueForKeyPath(str, dictionary);
  if (res) {
    let errorPath = [];
    const [firstKey, ...remainder] = str.split(".");
    if (layer.state.autoMap[firstKey]) {
      const kpLocation = layer.state.autoMap[firstKey];
      errorPath = kpLocation.split(".").concat(remainder);
    }
    popAll();
    pushErrorPath(layer.state, {
      path: [errorPath],
    });
    const dereferenced = valueForKeyPath(str, dictionary);
    if (defer) {
      return dereferenced;
    }
    const nextLayer: Moss.ReturnValue = await parseNextStructure(
      layer,
      dereferenced
    );
    return nextLayer.data;
  }
  return res;
};


async function _interpolate(
  layer: Moss.ReturnValue,
  input: any,
  dictionary: any
) {
  let popAll = 0;
  const options = {
    ...{
      dereferenceSync: (str: string, { defer, sourceMap }: Expand.FunctionArguments = {}) =>
        dereferenceSync(str, {
          sourceMap,
          layer,
          defer,
          dictionary,
          popAll: () => popAll++,
        }),
      dereference: async (str: string, { defer, sourceMap }: Expand.FunctionArguments = {}) =>
        await dereference(str, {
          sourceMap,
          defer,
          layer,
          dictionary,
          popAll: () => popAll++,
        }),
      call: async (obj: Object, { defer, sourceMap }: Expand.FunctionArguments = {}) => {
        // call method
        const keys = Object.keys(obj);
        if (!(keys && keys.length)) return "";
        if (defer) {
          return obj;
        }
        const nextLayer: Moss.ReturnValue = await parseNextStructure(
          layer,
          obj
        );
        const res = nextLayer.data;
        return res;
      },
      fetch: async (bl: string, { defer, sourceMap }: Expand.FunctionArguments = {}) => {
        popAll++;
        pushErrorPath(layer.state, {
          path: sourceMap,
          rhs: true,
        });
        let resolvedBranch;
        try {
          resolvedBranch = await getBranch(bl, resolvers, layer);
        } catch (e) {
          throw {
            message: `Failed resolve ${bl}\n ${e.message}`,
          };
        }
        if (!resolvedBranch) {
          throw {
            message: `No results for ${bl}, in ${Object.keys(resolvers).length} resolvers @ ${yaml.safeDump(layer.data)}`,
          };
        }
        if (resolvedBranch.data) {
          popAll++;
          pushErrorPath(layer.state, {
            path: ["^" + encodeBranchLocator(resolvedBranch)],
          });
          if (defer) {
            return resolvedBranch.data;
          }
          const res: Moss.ReturnValue = await parseNextStructure(
            layer,
            resolvedBranch.data
          );
          const {
            data,
            state: { auto, stack, selectors, merge },
          } = res;
          resolvedBranch.intermediate = {
            data,
            state: { auto, stack, selectors, merge },
          };
          return data;
        }
      },
      shell: () => "no shell method supplied",
      getStack: () => {
        if (!layer.state.strict) {
          return {
            ...layer.state.auto,
            ...layer.data,
            stack: layer.state.stack,
          };
        }
        return { stack: layer.state.stack };
      },
    },
    ...interpolationFunctions,
  };
  let { value, changed } = await __interpolate(input, options);
  if (changed) {
    if (check(value, Object)) {
      return clone(value);
    }
    value = await _interpolate(layer, value, dictionary);
  } else {
    value = clone(value); // object immutability
  }
  for (let i = 0; i < popAll; i++) {
    popErrorPath(layer.state);
  }
  popAll = 0;
  return value;
}

export async function start(trunk: Moss.BranchData) {
  return await parseNextStructure(newLayer(), trunk);
}

export async function startBranch(branch: Moss.Branch) {
  const res = await parseNextStructure(newLayer(branch), branch.data);
  const {
    data,
    state: { auto, stack, selectors, merge },
  } = res;
  branch.intermediate = { data, state: { auto, stack, selectors, merge } };
  return res;
}

export async function parse(
  trunk: Moss.BranchData,
  baseParser?: Moss.BranchData
) {
  if (baseParser) {
    const layer = await parseNextStructure(newLayer(), baseParser);
    return (await parseNextStructure(layer, trunk)).data;
  }
  return (await start(trunk)).data;
}

export async function fromJSON(config: string, baseParser?: string) {
  if (baseParser) {
    return await parse(JSON.parse(config), JSON.parse(baseParser));
  }
  return await parse(JSON.parse(config));
}

export async function load(config: string, baseParser?: string) {
  if (baseParser) {
    return await parse(yaml.load(config), yaml.load(baseParser));
  }
  return await parse(yaml.load(config));
}

export async function transform(config: string, baseParser?: string) {
  return yaml.dump(await load(config, baseParser));
}
