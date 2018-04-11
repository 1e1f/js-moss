/// <reference path="../interfaces/moss.d.ts" />

import { arrayify, extend, check, combine, combineN, contains, clone, each, map, merge, okmap, union, difference, or, hashField, sum, valueForKeyPath } from 'typed-json-transform';
import { interpolate as __interpolate } from './interpolate';
import { base, cascade as _cascade, shouldCascade, parseSelectors, select } from './cascade';
import * as yaml from 'js-yaml';


function filter(trie: any, options: any) {
  const { keywords, selectors } = parseSelectors(options);
  return hashField(trie, keywords, selectors)
}

const functions: Moss.Functions = {}

const shouldDefer = (data: any): any => {
  for (const key of Object.keys(data)) {
    if (key[0] == '<') {
      return data[key];
    }
  }
  return false;
}

export const next = (current: Moss.Layer, input: Moss.Branch, interpolateOptions?: Expand.Options): Moss.Layer => {
  const state = clone(current.state);
  extend(state.auto, current.data);
  if (check(input, Array)) {
    return { data: map(input, i => next(current, i, interpolateOptions).data), state };
  }
  else if (check(input, Object)) {
    if (shouldCascade(input)) {
      const pruned = cascade({ data: input, state });
      if (check(pruned, Object)) {
        return branch({ data: pruned, state });
      } else {
        return next(current, pruned, interpolateOptions);
      }
    } else {
      return branch({ data: input, state });
    }
  } else {
    return interpolate(current, input, interpolateOptions);
  }
}

export function cascade(current: Moss.Layer): any {
  const { state, data } = current;
  const existing = base(data);
  const selected = _cascade(current, data, {
    prefix: '=',
    usePrecedence: true,
    onMatch: (val) => {
      if (check(val, String)) {
        val = interpolate(current, val).data;
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
  _cascade(current, data, {
    prefix: '+',
    usePrecedence: false,
    onMatch: (val, ctx) => {
      if (check(val, String)) {
        val = interpolate(current, val).data;
      }
      if (shouldCascade(val)) {
        val = cascade({ state, data: val });
      }
      if (check(res, Array)) {
        res = union(res, arrayify(val))
      } else if (check(res, Object) && check(val, Object)) {
        extend(res, val);
      } else {
        throw new Error(`merging value: ${JSON.stringify(val)} into ${res}`);
      }
    }
  });
  _cascade(current, data, {
    prefix: '-',
    usePrecedence: false,
    onMatch: (val) => {
      if (check(val, String)) {
        val = interpolate(current, val).data;
      }
      if (shouldCascade(val)) {
        val = cascade({ state, data: val });
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

export function branch(current: Moss.Layer, interpolateOptions?: Expand.Options): Moss.Layer {
  const { state, data } = current;
  for (let key of Object.keys(data)) {
    if (key[0] == '\\') {
      data[key.slice(1)] = data[key];
      delete data[key];
    } else if (key.slice(-1) === '>') {
      data[key.slice(0, key.length - 1)] = data[key];
      delete data[key];
    }
    else {
      if (key.slice(-1) === '<') {
        let res;
        const fn = key.slice(0, key.length - 1);
        if (functions[fn]) {
          res = functions[fn](current, data[key]);
        } else {
          throw new Error(`no known function ${fn}`);
        }
        delete data[key];
        if (res) {
          if (check(res, Object)) {
            extend(data, res);
          } else {
            current.data = res;
          }
        }
      } else if (key[0] == '$') {
        const res: string = <any>interpolate(current, key, interpolateOptions).data;
        const layer = next(current, data[key], interpolateOptions);
        data[res] = layer.data;
        extend(state, { selectors: layer.state.selectors, stack: layer.state.stack });
        delete data[key];
      } else {
        const layer = next(current, data[key], interpolateOptions);
        data[key] = layer.data;
      }
    }
  }
  return current;
}

// function extendLayer = ()

export const newState = (): Moss.State => {
  return { auto: {}, stack: {}, selectors: {} };
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

addFunctions({
  select: (current: Moss.Layer, args: any) => {
    const { state } = current;
    const selected = next(current, args).data;
    extend(state.selectors, selected);
  },
  $: (layer: Moss.Layer, args: any) => {
    const selected = next(layer, args).data;
    extend(layer.state.stack, selected);
  },
  function: ({ state, data }: Moss.Layer, args: any) => {
    return args;
  },
  extend: (parent: Moss.Layer, args: any) => {
    const layer = next(parent, args);
    const { data } = layer;
    if (!data.source) {
      throw new Error(`for $extend please supply an 'source:' branch`);
    }
    let res = data.source;
    delete data.source;
    each(data, (item, key) => {
      const ret = next(layer, item).data;
      res = merge(res, ret);
    });
    return res;
  },
  each: (parent: Moss.Layer, args: any) => {
    const layer = next(parent, args);
    const { data } = layer;
    if (!data.of) {
      throw new Error(`for $each please supply an 'of:' branch`);
    }
    if (!data.do) {
      throw new Error(`for $each please supply a 'do:' branch `);
    }
    let i = 0;
    each(data.of, (item, key) => {
      const ret = next(layer, item);
      ret.state.stack.index = i;
      i++;
      next(ret, clone(data.do)).data;
    });
  },
  map: (parent: Moss.Layer, args: any) => {
    const layer = next(parent, args);
    const { data } = layer;
    if (!data.from) {
      throw new Error(`for $map please supply 'from:' as input`);
    }
    if (!data.to) {
      throw new Error(`for $map please supply 'to:' as `);
    }
    if (check(data.from, Array)) {
      return map(data.from, (val, i) => {
        const ret = next(parent, val);
        ret.state.stack.index = i;
        ret.state.stack.value = val;
        return next(ret, clone(data.to)).data;
      });
    }
    else if (check(data.from, Object)) {
      let i = 0;
      return okmap(data.from, (item, key) => {
        const ret = next(parent, item);
        ret.state.stack.index = i;
        ret.state.stack.key = key;
        i++;
        // console.log('mapping with layer', layer.state);
        return { key, value: next(ret, clone(data.to)).data };
      });
    }
  },
  reduce: (parent: Moss.Layer, args: any) => {
    const layer = next(parent, args);
    const { data } = layer;
    if (!data.each) {
      throw new Error(`for $map please supply 'each:' as input`);
    }
    if (!data.with) {
      throw new Error(`for $map please supply 'with:' as input`);
    }
    if (!(data.memo || check(data.memo, Number))) {
      throw new Error(`for $map please supply 'memo:' as input`);
    }
    if (check(data.each, Array)) {
      let res: any = data.memo;
      each(data.each, (val, i) => {
        const ret = next(parent, val);
        if (functions[data.with]) {
          res = functions[data.with](ret, { value: val, memo: res, index: i });
        }
        else {
          ret.state.stack.index = i;
          ret.state.stack.value = val;
          ret.state.stack.memo = res;
          res = next(ret, data.with).data;
        }
      });
      return res;
    }
    if (check(data.each, Object)) {
      let i = 0;
      const { state } = layer;
      state.stack.memo = data.memo;
      each(data.each, (val, key) => {
        state.stack.index = i;
        i++;
        state.stack.key = key;
        state.stack.value = val;
        const res = next(layer, clone(data.with)).data;
        if (check(res, Object)) {
          extend(state.stack.memo, res);
        }
        else state.stack.memo = res;
      });
      return state.stack.memo;
    }
  },
  group: (parent: Moss.Layer, args: any) => {
    const layer = next(parent, args);
    const { data } = layer;
    return sum(data, (v) => v);
  },
  sum: (parent: Moss.Layer, args: any) => {
    const layer = next(parent, args);
    const { data } = layer;
    return sum(data, (v) => v);
  }
});

function interpolate(layer: Moss.Layer, input: any, options?: Expand.Options): Moss.Layer {
  const { data, state } = layer;
  let dictionary;
  if (check(data, Object)) {
    dictionary = { ...state.auto, ...data, ...state.stack };
  } else {
    dictionary = { ...state.auto, ...state.stack }
  }
  const res = _interpolate(layer, input, dictionary);
  return { data: res, state: layer.state };
}

const interpolationFunctions = {};

export function setOptions(options: Expand.Options) {
  extend(interpolationFunctions, options);
}

function _interpolate(layer: Moss.Layer, input: any, dictionary: any): any {
  const options = {
    ...{
      replace: (str: string) => { // replace from trie
        if (!str) return '';
        const res = valueForKeyPath(str, dictionary);
        if (res || check(res, Number)) {
          return res;
        } else {
          const error = new Error(`key path [ ${str} ] is not defined in stack}`);
          error.stack = JSON.stringify(dictionary, null, 2);
          throw error;
        }
      },
      call: (res: Object) => { // call method
        const keys = Object.keys(res);
        if (!(keys && keys.length)) return '';
        return next(layer, res).data;
      },
      shell: () => 'no shell method supplied',
      getStack: () => {
        const merged = { ...layer.state.auto, ...layer.data, ...layer.state.stack };
        return merged;
      }
    }, ...interpolationFunctions
  }
  const { value, changed } = __interpolate(input, options);
  if (changed) {
    if (check(value, Object)) {
      return clone(value);
    }
    return _interpolate(layer, value, dictionary);
  }
  return clone(value);
}

export function parse(trunk: Moss.Branch, baseParser?: Moss.Branch) {
  if (baseParser) {
    const layer = next(newLayer(), baseParser);
    return next(layer, trunk).data;
  }
  return next(newLayer(), trunk).data;
}

export function load(config: string, baseParser: string) {
  if (baseParser) {
    return parse(yaml.load(config), yaml.load(baseParser));
  }
  return parse(yaml.load(config));
}

export function transform(config: string, baseParser: string) {
  return yaml.dump(load(config, baseParser));;
}
