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

export const next = (current: Moss.Layer, input: Moss.Branch): Moss.Layer => {
  let state = current.state;
  if (!state.locked) {
    state = clone(current.state);
  }
  if (check(input, Array)) {
    return { data: map(input, i => next(current, i).data), state };
  }
  else if (check(input, Object)) {
    if (shouldCascade(input)) {
      const pruned = cascade({ data: input, state });
      if (check(pruned, Object)) {
        return branch({ data: pruned, state });
      } else {
        return next(current, pruned);
      }
    } else {
      return branch({ data: input, state });
    }
  } else {
    return interpolate(current, input);
  }
}

export function cascade(current: Moss.Layer): any {
  const { data, state } = current;
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
    onMatch: (val) => {
      if (check(val, String)) {
        val = interpolate(current, val).data;
      }
      if (shouldCascade(val)) {
        val = cascade({ ...current, data: val });
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
        val = cascade({ ...current, data: val });
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

export const branch = (current: Moss.Layer): Moss.Layer => {
  const { state } = current;
  const source = current.data;
  const target = state.target || current.data;
  for (let key of Object.keys(source)) {
    if (key[0] == '\\') {
      target[key.slice(1)] = source[key];
      delete target[key];
    } else if (key.slice(-1) === '>') {
      target[key.slice(0, key.length - 1)] = source[key];
      delete target[key];
    }
    else {
      if (key.slice(-1) === '<') {
        let res;
        const fn = key.slice(0, key.length - 1);
        if (functions[fn]) {
          res = functions[fn](current, source[key]);
        } else {
          throw new Error(`no known function ${fn}`);
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
        const res: string = <any>interpolate(current, key).data;
        const layer = next(current, source[key]);
        target[res] = layer.data;
        delete target[key];
      } else {
        const { data } = next(current, source[key]);
        state.auto[key] = data;
        target[key] = data;
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
    const { data } = current;
    const locked = clone(current.state);
    const state = { ...locked, locked: true, target: locked.selectors };
    current.state.selectors = next({ data, state }, args).state.selectors;
  },
  $: (current: Moss.Layer, args: any) => {
    const { data } = next(current, args);
    extend(current.state.stack, data);
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
    const { data: { from, to } } = layer;
    if (!from) {
      throw new Error(`for $map please supply 'from:' as input`);
    }
    if (!to) {
      throw new Error(`for $map please supply 'to:' as `);
    }
    let i = 0;
    return okmap(from, (item, key) => {
      const l = next(parent, item);
      l.state.stack.index = i;
      l.state.stack.value = item;
      l.state.stack.key = key;
      i++;
      const { data } = next(l, clone(to));
      return data;
    });
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

function interpolate(layer: Moss.Layer, input: any): Moss.Layer {
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
          const stack = JSON.stringify(dictionary, null, 2);
          throw new Error(`key path [ ${str} ] is not defined in stack:\n${stack}`);
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

export function start(trunk: Moss.Branch) {
  return next(newLayer(), trunk);
}

export function parse(trunk: Moss.Branch, baseParser?: Moss.Branch) {
  if (baseParser) {
    const layer = next(newLayer(), baseParser);
    return next(layer, trunk).data;
  }
  return start(trunk).data;
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
