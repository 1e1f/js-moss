/// <reference path="../interfaces/moss.d.ts" />

import { arrayify, extend, check, combine, combineN, contains, clone, each, map, merge, amap, okmap, union, difference, or, hashField, sum, valueForKeyPath, aokmap } from 'typed-json-transform';
import { interpolate as __interpolate } from './interpolate';
import { base, cascade as _cascade, shouldCascade, parseSelectors, select } from './cascade';
import * as yaml from 'js-yaml';

const functions: Moss.Functions = {}
const resolvers: Moss.Resolvers = {}

const currentErrorPath = (state: Moss.State) => state.errorPaths[state.errorPaths.length - 1];
const pushErrorPath = (state: Moss.State) => state.errorPaths.push({ path: [] })
const popErrorPath = (state: Moss.State) => state.errorPaths.pop();

export const next = async (current: Moss.Layer, input: Moss.Branch): Promise<Moss.Layer> => {
  let state = current.state;
  if (!state.locked) {
    state = clone(current.state);
  }
  const layer = { ...current, state };
  if (check(input, Array)) {
    return {
      data: await amap(input, async (i) => {
        currentErrorPath(state).path.push(i);
        const res = (await next(layer, i)).data
        currentErrorPath(state).path.pop();
        return res;
      }), state
    };
  }
  else if (check(input, Object)) {
    if (shouldCascade(input)) {
      const pruned = await cascade({ data: input, state });
      if (check(pruned, Object)) {
        const res = await branch({ data: pruned, state });
        currentErrorPath(state).path.pop();
        return res;
      } else { // cascaded to non object
        const res = await next(layer, pruned);
        currentErrorPath(state).path.pop();
        return res;
      }
    } else {
      return branch({ data: input, state });
    }
  } else {
    currentErrorPath(state).rhs = true;
    return interpolate(layer, input);
  }
}

export async function cascade(current: Moss.Layer): Promise<any> {
  const { data, state } = current;
  const existing = base(data);
  const selected = await _cascade(current, data, {
    prefix: '=',
    usePrecedence: true,
    onMatch: async (val, key) => {
      currentErrorPath(state).path.push(key);
      if (check(val, String)) {
        val = (await interpolate(current, val)).data;
      }
      if (shouldCascade(val)) {
        val = cascade({ state, data: val });
      }
      return val;
    }
  });
  let res: any;
  if (existing) {
    res = combine(existing, selected);
  } else {
    res = selected;
  }
  await _cascade(current, data, {
    prefix: '+',
    usePrecedence: false,
    onMatch: async (val) => {
      if (check(val, String)) {
        val = (await interpolate(current, val)).data;
      }
      if (shouldCascade(val)) {
        val = await cascade({ ...current, data: val });
      }
      if (check(res, Array)) {
        res = union(res, arrayify(val))
      } else if (check(res, Object) && check(val, Object)) {
        extend(res, val);
      } else {
        jsonError({
          message: `bad merge source->destination`,
          errorPaths: state.errorPaths,
          branch: {
            source: val,
            destination: res
          }
        });
      }
    }
  });
  await _cascade(current, data, {
    prefix: '-',
    usePrecedence: false,
    onMatch: async (val) => {
      if (check(val, String)) {
        val = (await interpolate(current, val)).data;
      }
      if (shouldCascade(val)) {
        val = await cascade({ ...current, data: val });
      }
      if (check(res, Array)) {
        res = difference(res, arrayify(val));
      } else if (check(res, Object)) {
        if (check(val, String)) {
          delete res[val];
        }
        for (const key of Object.keys(val)) {
          delete res[key];
        }
      }
    }
  });

  return res;
}

export const branch = async (current: Moss.Layer): Promise<Moss.Layer> => {
  const { state } = current;
  const source = current.data;
  const target = state.target || current.data;
  for (let key of Object.keys(source)) {
    currentErrorPath(state).path.push(key);
    if (key[0] == '\\') {
      let nextKey = key.slice(1);
      target[nextKey] = source[key];
      state.auto[nextKey] = source[key];
      state.autoMap[nextKey] = currentErrorPath(state).path.join('.');
      delete target[key];
    } else if (key.slice(-1) === '>') {
      let nextKey = key.slice(0, key.length - 1);
      target[nextKey] = source[key];
      state.auto[nextKey] = source[key];
      state.autoMap[nextKey] = currentErrorPath(state).path.join('.');
      delete target[key];
    }
    else {
      if (key.slice(-1) === '<') {
        let res;
        const fn = key.slice(0, key.length - 1);
        if (functions[fn]) {
          res = await functions[fn](current, source[key]);
        } else {
          jsonError({
            message: `no known function ${fn}`,
            errorPaths: state.errorPaths
          });
        }
        delete target[key];
        if (res) {
          if (check(res, Object)) {
            extend(target, res);
          } else {
            current.data = res;
          }
        }
      } else if (key[0] == '$') {
        const res: string = <any>(await interpolate(current, key)).data;
        const layer = await next(current, source[key]);
        target[res] = layer.data;
        state.auto[res] = source[key];
        state.autoMap[res] = currentErrorPath(state).path.join('.');
        delete target[key];
      } else {
        const { data } = (await next(current, source[key]));
        state.auto[key] = data;
        state.autoMap[key] = currentErrorPath(state).path.join('.');
        target[key] = data;
      }
    }
    currentErrorPath(state).path.pop();
  }
  return current;
}

export const newState = (): Moss.State => {
  return { auto: {}, autoMap: {}, stack: {}, selectors: {}, errorPaths: [{ path: [] }] };
}

export const newLayer = (): Moss.Layer => {
  return { data: {}, state: newState() }
}

export function getFunctions() {
  return functions;
}

export function addFunctions(userFunctions: Moss.Functions) {
  extend(functions, userFunctions);
}

export function getResolvers() {
  return resolvers;
}

export function addResolvers(userResolvers: Moss.Resolvers) {
  extend(resolvers, userResolvers);
}


interface MossError {
  message: string
  errorPaths: Moss.KeyPath[]
  branch?: any
  stack?: any
  sourceMap?: any
}

const jsonError = (error: MossError) => {
  const { message, branch, stack, errorPaths } = error;
  throw new Error(JSON.stringify({
    message,
    branch,
    stack,
    errorPaths: errorPaths.map(e => ({ ...e, path: e.path.join('.') }))
  }, null, 2));
}

addResolvers({
  testString: async () => 'hello world!',
  testObject: async () => ({
    hello: 'world!'
  })
});

addFunctions({
  select: async (current: Moss.Layer, args: any) => {
    const { data } = current;
    const locked = clone(current.state);
    const state = { ...locked, locked: true, target: locked.selectors };
    current.state.selectors = (await next({ data, state }, args)).state.selectors;
  },
  $: async (current: Moss.Layer, args: any) => {
    const { data } = await next(current, args);
    extend(current.state.stack, data);
  },
  extend: async (parent: Moss.Layer, args: any) => {
    const layer = await next(parent, args);
    const { data } = layer;
    if (!data.source) {
      jsonError({
        message: `for $extend please supply an 'source:' branch`,
        errorPaths: layer.state.errorPaths
      });
    }
    let res = data.source;
    delete data.source;
    for (const i in data) {
      const ir = await next(layer, data[i]);
      res = merge(res, ir.data);
    };
    return res;
  },
  each: async (parent: Moss.Layer, args: any) => {
    const layer = await next(parent, args);
    const { data } = layer;
    if (!data.of) {
      jsonError({
        message: `for $each please supply an 'of:' branch`,
        errorPaths: layer.state.errorPaths,
        branch: data
      });
    }
    if (!data.do) {
      jsonError({
        message: `for $each please supply a 'do:' branch`,
        errorPaths: layer.state.errorPaths,
        branch: data
      });
    }
    let i = 0;
    for (const key of data.of) {
      const item = data.of[key];
      const ret = await next(layer, item);
      ret.state.stack.index = i;
      i++;
      await next(ret, clone(data.do));
    };
  },
  map: async (parent: Moss.Layer, args: any) => {
    const base = currentErrorPath(parent.state).path.join('.');
    const { from, to } = args;
    if (!from) {
      jsonError({
        message: `for $map please supply 'from:' as input`,
        errorPaths: parent.state.errorPaths,
      });
    }
    currentErrorPath(parent.state).path.push('from');
    const fromCtx = await next(parent, from);
    currentErrorPath(fromCtx.state).path.pop();
    if (!to) {
      jsonError({
        message: `for $map please supply 'to:' as input`,
        errorPaths: fromCtx.state.errorPaths,
        branch: args
      });
    }
    let i = 0;
    const res = aokmap(fromCtx.data, async (item, key) => {
      if (fromCtx.state.autoMap[key]) {
        currentErrorPath(fromCtx.state).path = fromCtx.state.autoMap[key].split('.');
      }
      const ctx = await next(fromCtx, item);
      currentErrorPath(ctx.state).path = (base + ('.to')).split('.');
      ctx.state.stack.index = i;
      i++;
      ctx.state.stack.value = item;
      ctx.state.stack.key = key;
      const { data } = await next(ctx, clone(to));
      return data;
    });
    return res;
  },
  reduce: async (parent: Moss.Layer, args: any) => {
    const layer = await next(parent, args);
    const { data } = layer;
    if (!data.each) {
      jsonError({
        message: `for $reduce please supply 'each:' as branch`,
        errorPaths: layer.state.errorPaths,
        branch: data
      });
    }
    if (!data.with) {
      jsonError({
        message: `for $reduce please supply 'with:' in branch`,
        errorPaths: layer.state.errorPaths,
        branch: data
      });
    }
    if (!(data.memo || check(data.memo, Number))) {
      jsonError({
        message: `for $reduce please supply 'memo:' in branch`,
        errorPaths: layer.state.errorPaths,
        branch: data
      });
    }
    if (check(data.each, Array)) {
      let res: any = data.memo;
      for (const i in data.each) {
        const val = data.each[i];
        const ret = await next(parent, val);
        if (functions[data.with]) {
          res = functions[data.with](ret, { value: val, memo: res, index: i });
        }
        else {
          ret.state.stack.index = i;
          ret.state.stack.value = val;
          ret.state.stack.memo = res;
          res = (await next(ret, data.with)).data;
        }
      };
      return res;
    }
    if (check(data.each, Object)) {
      let i = 0;
      const { state } = layer;
      state.stack.memo = data.memo;
      for (const key in data.each) {
        const val = data.each[key];
        state.stack.index = i;
        i++;
        state.stack.key = key;
        state.stack.value = val;
        const res = (await next(layer, clone(data.with))).data;
        if (check(res, Object)) {
          extend(state.stack.memo, res);
        }
        else state.stack.memo = res;
      };
      return state.stack.memo;
    }
  },
  group: async (parent: Moss.Layer, args: any) => {
    const layer = await next(parent, args);
    const { data } = layer;
    return sum(data, (v) => v);
  },
  sum: async (parent: Moss.Layer, args: any) => {
    const layer = await next(parent, args);
    const { data } = layer;
    return sum(data, (v) => v);
  },
  import: async (parent: Moss.Layer, args: any) => {
    let found = false;
    for (const key of Object.keys(args)) {
      if (resolvers[key]) {
        const res = await resolvers[key](args);
        console.log('resolved', res);
        return res;
      }
    }
    if (!found) {
      jsonError({
        message: `none of the suggested resolvers [${Object.keys(args).join(', ')}] are valid in this context`,
        errorPaths: parent.state.errorPaths.map((o) => {
          let path = o.path.join('.');
          let firstKey = o.path[0];
          if (parent.state.autoMap[firstKey]) {
            path = path.replace(firstKey, parent.state.autoMap[firstKey]);
          }
          return {
            ...o,
            path: path.split('.')
          }
        })
      });
    }

  }
});

async function interpolate(layer: Moss.Layer, input: any): Promise<Moss.Layer> {
  const { data, state } = layer;
  let dictionary;
  if (check(data, Object)) {
    dictionary = { ...state.auto, ...data, ...state.stack };
  } else {
    dictionary = { ...state.auto, ...state.stack }
  }
  const res = await _interpolate(layer, input, dictionary);
  return { data: res, state: layer.state };
}

const interpolationFunctions = {};

export function setOptions(options: Expand.Options) {
  extend(interpolationFunctions, options);
}

async function _interpolate(layer: Moss.Layer, input: any, dictionary: any): Promise<any> {
  let popAll = 0;
  const options = {
    ...{
      pushErrorState: () => {
        popAll++;
      },
      popErrorState: (res: string) => {
        currentErrorPath(layer.state).rhs = true;
        pushErrorPath(layer.state);
        currentErrorPath(layer.state).path.push(res);
      },
      replace: (str: string) => { // replace from trie
        if (!str) return '';
        const res = valueForKeyPath(str, dictionary);
        if (res || check(res, Number)) {
          return res;
        } else {
          jsonError({
            message: `key path [ ${str} ] is not defined in stack`,
            errorPaths: layer.state.errorPaths.map((o) => {
              let path = o.path.join('.');
              let firstKey = o.path[0];
              if (layer.state.autoMap[firstKey]) {
                path = path.replace(firstKey, layer.state.autoMap[firstKey]);
              }
              return {
                ...o,
                path: path.split('.')
              }
            }),
            // errorPaths: map(layer.state.errorPaths, (err) => ({ ...err, path: layer.state.autoMap[err.path[0]] })),
            stack: dictionary
          });
        }
      },
      call: async (obj: Object) => { // call method
        const keys = Object.keys(obj);
        if (!(keys && keys.length)) return '';
        currentErrorPath(layer.state).path.push(input);
        const res = (await next(layer, obj)).data;
        currentErrorPath(layer.state).path.pop();
        return res;
      },
      shell: () => 'no shell method supplied',
      getStack: () => {
        const merged = { ...layer.state.auto, ...layer.data, ...layer.state.stack };
        return merged;
      }
    }, ...interpolationFunctions
  }
  let { value, changed } = await __interpolate(input, options);
  if (changed) {
    if (check(value, Object)) {
      return clone(value);
    }
    value = await _interpolate(layer, value, dictionary);
  } else {
    value = clone(value) // object immutability
  }
  while (popAll > 0) {
    popErrorPath(layer.state);
    popAll--;
  }
  return value;
}

export async function start(trunk: Moss.Branch) {
  return await next(newLayer(), trunk);
}

export async function parse(trunk: Moss.Branch, baseParser?: Moss.Branch) {
  if (baseParser) {
    const layer = await next(newLayer(), baseParser);
    return (await next(layer, trunk)).data;
  }
  return (await start(trunk)).data;
}

export async function load(config: string, baseParser: string) {
  if (baseParser) {
    return await parse(yaml.load(config), yaml.load(baseParser));
  }
  return await parse(yaml.load(config));
}

export async function transform(config: string, baseParser: string) {
  return yaml.dump(await load(config, baseParser));;
}
