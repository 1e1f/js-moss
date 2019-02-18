/// <reference path="../interfaces/moss.d.ts" />

import { merge, amap as map, aokmap as okmap, arrayify, extend, check, clone, each, union, difference, sum, valueForKeyPath, all, isEqual, unflatten } from 'typed-json-transform';
import { interpolateAsync as __interpolate } from './interpolate';
import { cascadeAsync as _cascade, shouldCascade } from './cascade';
import * as yaml from 'js-yaml';

import { getBranchAsync as getBranch } from './resolvers';

import {
  newLayer,
  pushState,
  currentErrorPath,
  pushErrorPath,
  popErrorPath
} from './state';

import { MossError, getErrorReporter } from './util';

export namespace Async {
  type Functions = Moss.Async.Functions;
  type Resolvers = Moss.Async.Resolvers;

  export const continueWithNewFrame = async (current: Moss.ReturnValue, input: Moss.BranchData) => {
    const layer = pushState(current);
    return parseAny(layer, input);
  }

  export const next = continueWithNewFrame;

  export const parseObject = async (current: Moss.ReturnValue) => {
    const { state } = current;


    const source: any = clone(current.data);
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
            throw ({
              name: 'MossError',
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
          const newKey: string = <any>(await interpolate(current, key)).data;
          const layer = await continueWithNewFrame(current, source[key]);
          target[newKey] = layer.data;
          state.auto[newKey] = source[key];
          state.autoMap[newKey] = currentErrorPath(state).path.join('.');
          delete target[key];

        } else {
          const { data } = (await continueWithNewFrame(current, source[key]));
          const doAssign = () => {
            state.auto[key] = data;
            state.autoMap[key] = currentErrorPath(state).path.join('.');
            target[key] = data;
          }
          const lhs = target[key];
          switch (state.merge.operator) {
            case '|': case '+': case '=': default: doAssign(); break;
            case '-':
              if (!check(data, [Object])) {
                delete target[key];
              }
              break;
            case '^': if (!lhs) target[key] = data; else state.auto[key] = data; break;
            case '!': if (!lhs) doAssign(); break;
            case '?': case '&': case '*': if (lhs) doAssign(); break;
          }
        }
      }
      currentErrorPath(state).path.pop();
    }
    return current;
  }

  export const handleError = (e: MossError, layer: Moss.ReturnValue, input?: Moss.BranchData) => {
    let error: MossError;
    if (e.name && (e.name == 'MossError')) {
      error = e;
    } else {
      let at: any;
      layer.state.errorPaths.forEach(p => { if (!p.rhs) at = p.path });
      error = {
        name: 'MossError',
        message: `${e.message || 'unexpected error'}`,
        options: e.options,
        errorPaths: layer.state.errorPaths,
        at: at.join('.')
      };
    }
    try {
      const nestedError = JSON.parse(error.message);
      if (nestedError.name && (nestedError.name == 'MossError')) {
        error = nestedError;
      }
    } catch { }
    if (getErrorReporter()) {
      throw (getErrorReporter()(error));
    } else {
      throw {
        name: 'MossError',
        message: JSON.stringify(error, null, 2),
        data: error
      }
    }
  }

  export const parseAny = async (layer: Moss.ReturnValue, input: Moss.BranchData) => {
    const { state } = layer;
    try {
      if (check(input, Array)) {
        return {
          data: await map(input, async (data: any) => {
            currentErrorPath(state).path.push(data);
            const nextLayer: Moss.ReturnValue = await continueWithNewFrame(layer, data);
            const res = nextLayer.data
            currentErrorPath(state).path.pop();
            return res;
          }), state
        } as Moss.ReturnValue;
      }
      else if (check(input, Object)) {
        if (shouldCascade(input)) {
          return await cascade({ data: input, state });
        }
        return await parseObject({ data: input, state });
      } else {
        return await interpolate(layer, input);
      }
    } catch (e) {
      handleError(e, layer, input);
    }
  }

  export const onMatch = async (rv: Moss.ReturnValue, setter: any, operator: Merge.Operator, key: string) => {
    let { state, data: lhs } = rv;
    currentErrorPath(state).path.push(key);
    const nextLayer = pushState(rv);
    nextLayer.state.merge.operator = <any>operator;
    const rhs = (await parseAny(nextLayer, setter)).data;
    if (rhs) {
      switch (operator) {
        case '=':
          rv.data = rhs;
          break;
        case '+':
          if (check(lhs, Array)) {
            rv.data = union(lhs, arrayify(rhs))
          } else if (check(lhs, Object) && check(rhs, Object)) {
            extend(lhs, rhs);
          } else {
            throw ({
              name: 'MossError',
              message: `can't join ${rhs || typeof rhs} to ${lhs || typeof lhs}`,
              at: key,
              errorPaths: nextLayer.state.errorPaths,
              branch: {
                source: rhs,
                destination: lhs
              }
            });
          }
          break;
        case '-':
          if (check(lhs, Array)) {
            rv.data = difference(lhs, arrayify(rhs));
          } else if (check(lhs, Object)) {
            if (check(rhs, String)) {
              delete lhs[rhs];
            }
            for (const key of Object.keys(rhs)) {
              delete lhs[key];
            }
          }
          break;
      }
    }
    currentErrorPath(state).path.pop();
  }

  const operators: Merge.Operator[] = ['=', '+', '-'];
  export const cascade = async (rv: Moss.ReturnValue) => {
    const input = clone(rv.data);
    rv.data = null;
    for (const operator of operators) {
      await _cascade(rv, input, {
        operator,
        usePrecedence: (operator == '='),
        onMatch
      });
    };
    return rv;
  }

  const functions: Functions = {}
  const resolvers: Resolvers = {}

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
      match: (uri: string) => uri == 'hello',
      resolve: async (uri: string) => ({
        path: uri,
        data: 'world!'
      })
    }
  });

  addFunctions({
    select: async (current: Moss.ReturnValue, args: any) => {
      const { data } = current;
      const locked = clone(current.state);
      const state = { ...locked, locked: true, target: locked.selectors };
      const res = await continueWithNewFrame({ data, state }, args);
      current.state.selectors = res.state.selectors;
    },
    stack: async (current: Moss.ReturnValue, args: any) => {
      const { data } = current;
      const locked = clone(current.state);
      const state = { ...locked, locked: true, target: locked.stack };
      const res = await continueWithNewFrame({ data, state }, args);
      current.state.stack = res.state.stack;
    },
    $: async (current: Moss.ReturnValue, args: any) => {
      const res = await parseAny(current, args);
      extend(current.state, res.state);
    },
    extend: async (parent: Moss.ReturnValue, args: any) => {
      const layer = await continueWithNewFrame(parent, args);
      const { data } = layer;
      if (!data.source) {
        throw ({
          name: 'MossError',
          message: `for $extend please supply an 'source:' branch`,
          errorPaths: layer.state.errorPaths
        });
      }
      let res = data.source;
      delete data.source;
      for (const i in data) {
        const ir = await continueWithNewFrame(layer, data[i]);
        res = extend(res, ir.data);
      };
      return res;
    },
    log: async (current: Moss.ReturnValue, args: any) => {
      each(arrayify(args), (i) => {
        let kp = i;
        let format = 'json';
        if (check(i, Object)) {
          kp = i.keyPath;
          format = i.format;
        }
        const val = kp ? valueForKeyPath(kp, current) : current;
        switch (format) {
          case 'json': console.log(JSON.stringify(val, null, 2)); break;
          case 'yaml': console.log(yaml.dump(val)); break;
        }
      });
    },
    assert: async (parent: Moss.ReturnValue, args: any) => {
      throw ({
        name: 'MossError',
        message: args,
        errorPaths: parent.state.errorPaths,
        branch: args
      });
    },
    each: async (parent: Moss.ReturnValue, args: any) => {
      const layer = await continueWithNewFrame(parent, args);
      const { data } = layer;
      if (!data.of) {
        throw ({
          name: 'MossError',
          message: `for $each please supply an 'of:' branch`,
          errorPaths: layer.state.errorPaths,
          branch: data
        });
      }
      if (!data.do) {
        throw ({
          name: 'MossError',
          message: `for $each please supply a 'do:' branch`,
          errorPaths: layer.state.errorPaths,
          branch: data
        });
      }
      let i = 0;
      for (const key in data.of) {
        const item = data.of[key];
        const ret = await continueWithNewFrame(layer, item);
        ret.state.auto.index = i;
        i++;
        await continueWithNewFrame(ret, clone(data.do));
      };
      return Promise.resolve();
    },
    map: async (parent: Moss.ReturnValue, args: any) => {
      const base = currentErrorPath(parent.state).path.join('.');
      const { from, to } = args;
      if (!from) {
        throw ({
          name: 'MossError',
          message: `for $map please supply 'from:' as input`,
          errorPaths: parent.state.errorPaths,
        });
      }
      currentErrorPath(parent.state).path.push('from');
      const fromCtx = await continueWithNewFrame(parent, from);
      currentErrorPath(fromCtx.state).path.pop();
      if (!to) {
        throw ({
          name: 'MossError',
          message: `for $map please supply 'to:' as input`,
          errorPaths: fromCtx.state.errorPaths,
          branch: args
        });
      }
      let i = 0;
      try {
        return await okmap(fromCtx.data, async (item: any, key: string) => {
          if (fromCtx.state.autoMap[key]) {
            currentErrorPath(fromCtx.state).path = fromCtx.state.autoMap[key].split('.');
          }
          const ctx = await continueWithNewFrame(fromCtx, item);
          currentErrorPath(ctx.state).path = (base + ('.to')).split('.');
          const nextLayer = pushState(ctx);
          nextLayer.state.auto.index = i;
          nextLayer.state.auto.value = item;
          nextLayer.state.auto.memo = key;
          i++;
          return (await parseAny(nextLayer, clone(to))).data
        });
      } catch (e) {
        throw (e);
      }
    },
    remap: async (parent: Moss.ReturnValue, args: any) => {
      const base = currentErrorPath(parent.state).path.join('.');
      const { from, to } = args;
      if (!from) {
        throw ({
          name: 'MossError',
          message: `for $map please supply 'from:' as input`,
          errorPaths: parent.state.errorPaths,
        });
      }
      currentErrorPath(parent.state).path.push('from');
      const fromCtx = await continueWithNewFrame(parent, from);
      currentErrorPath(fromCtx.state).path.pop();
      if (!to) {
        throw ({
          name: 'MossError',
          message: `for $map please supply 'to:' as input`,
          errorPaths: fromCtx.state.errorPaths,
          branch: args
        });
      }
      let i = 0;
      try {
        return await okmap(fromCtx.data, async (item: any, key: string) => {
          if (fromCtx.state.autoMap[key]) {
            currentErrorPath(fromCtx.state).path = fromCtx.state.autoMap[key].split('.');
          }
          const ctx = await continueWithNewFrame(fromCtx, item);
          currentErrorPath(ctx.state).path = (base + ('.to')).split('.');
          const nextLayer = pushState(ctx);
          nextLayer.state.auto.index = i;
          nextLayer.state.auto.value = item;
          nextLayer.state.auto.memo = key;
          i++;
          return (await parseAny(nextLayer, clone(to))).data
        });
      } catch (e) {
        throw (e);
      }
    },
    reduce: async (parent: Moss.ReturnValue, args: any) => {
      const layer = await continueWithNewFrame(parent, args);
      const { data } = layer;
      if (!data.each) {
        throw ({
          name: 'MossError',
          message: `for $reduce please supply 'each:' as branch`,
          errorPaths: layer.state.errorPaths,
          branch: data
        });
      }
      if (!data.with) {
        throw ({
          name: 'MossError',
          message: `for $reduce please supply 'with:' in branch`,
          errorPaths: layer.state.errorPaths,
          branch: data
        });
      }
      if (!(data.memo || check(data.memo, Number))) {
        throw ({
          name: 'MossError',
          message: `for $reduce please supply 'memo:' in branch`,
          errorPaths: layer.state.errorPaths,
          branch: data
        });
      }
      if (check(data.each, Array)) {
        let res: any = data.memo;
        for (const i in data.each) {
          const val = data.each[i];
          const layer = await continueWithNewFrame(parent, val);
          if (functions[data.with]) {
            res = functions[data.with](layer, { value: val, memo: res, index: i });
          }
          else {
            const nextLayer = pushState(layer);
            nextLayer.state.auto.index = i;
            nextLayer.state.auto.value = val;
            nextLayer.state.auto.memo = res;
            res = (await parseAny(nextLayer, data.with)).data;
          }
        };
        return res;
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
          const res = (await parseAny(nextLayer, clone(data.with))).data;
          if (check(res, Object)) {
            extend(nextLayer.state.auto.memo, res);
          }
          else state.auto.memo = state.auto.memo + res;
        };
        const res = state.auto.memo;
        return res;
      }
    },
    compare: async (parent: Moss.ReturnValue, args: any) => {
      let first: any;
      return all(args, (arg) => {
        if (!first) first = arg;
        return isEqual(arg, first);
      });
    },
    group: async (parent: Moss.ReturnValue, args: any) => {
      const layer = await continueWithNewFrame(parent, args);
      const { data } = layer;
      return sum(data, (v: any) => v);
    },
    sum: async (parent: Moss.ReturnValue, args: any) => {
      const layer = await continueWithNewFrame(parent, args);
      const { data } = layer;
      return sum(data, (v: any) => v);
    }
  });

  async function interpolate(layer: Moss.ReturnValue, input: any) {
    const { data, state } = layer;
    const dictionary = { ...state.auto, stack: state.stack }
    try {
      const res = await _interpolate(layer, input, dictionary);
      return { data: res, state: layer.state } as Moss.ReturnValue;
    } catch (e) {
      if (e.function) {
        throw {
          message: e.message
        }
      }
      pushErrorPath(layer.state);
      currentErrorPath(layer.state).rhs = input || true;
      currentErrorPath(layer.state).path = e.sourceMap;
      throw {
        message: e.message
      }
    }
  }

  const interpolationFunctions = {};

  export function setOptions(options: Expand.Options) {
    extend(interpolationFunctions, options);
  }

  async function _interpolate(layer: Moss.ReturnValue, input: any, dictionary: any) {
    let popAll = 0;
    const options = {
      ...{
        replace: (str: string) => { // replace from trie
          if (!str) return;
          const res = valueForKeyPath(str, dictionary);
          if (res) {
            let errorPath = [];
            const [firstKey, ...remainder] = str.split('.');
            if (layer.state.autoMap[firstKey]) {
              const kpLocation = layer.state.autoMap[firstKey];
              errorPath = kpLocation.split('.').concat(remainder);
            }
            pushErrorPath(layer.state);
            currentErrorPath(layer.state).path = errorPath;
          }
          return res;
        },
        call: async (obj: Object) => { // call method
          const keys = Object.keys(obj);
          if (!(keys && keys.length)) return '';
          const nextLayer: Moss.ReturnValue = await parseAny(layer, obj);
          const res = nextLayer.data;
          return res;
        },
        fetch: async (uris: string) => {
          const b = await getBranch(uris, resolvers, layer);
          if (!b) {
            throw ({
              name: 'MossError',
              message: `Can't resolve ${uris}.\nNone of the available resolvers found a match.\n[${(await map(resolvers, (r) => r.name)).filter(e => e).join(', ')}] `,
              sourceMap: [0, uris.length]
            })
          }
          if (b.data) {
            const res: Moss.ReturnValue = await parseAny(layer, b.data);
            const sourceMap = '^' + b.path;
            pushErrorPath(layer.state);
            currentErrorPath(layer.state).rhs = sourceMap;
            currentErrorPath(layer.state).path.push(sourceMap);
            return res.data;
          }
        },
        shell: () => 'no shell method supplied',
        getStack: () => {
          if (!layer.state.strict) {
            return { ...layer.state.auto, ...layer.data, stack: layer.state.stack };
          }
          return { stack: layer.state.stack }
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

  export async function start(trunk: Moss.BranchData) {
    return await parseAny(newLayer(), trunk);
  }

  export async function parse(trunk: Moss.BranchData, baseParser?: Moss.BranchData) {
    if (baseParser) {
      const layer = await parseAny(newLayer(), baseParser);
      return (await parseAny(layer, trunk)).data;
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

}