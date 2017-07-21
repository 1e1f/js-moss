/// <reference path="../interfaces/moss.d.ts" />

import { arrayify, extend, check, combine, combineN, contains, clone, each, map, okmap, union, difference, or, hashField, valueForKeyPath } from 'typed-json-transform';
import { interpolate as __interpolate } from './interpolate';
import { base, cascade as _cascade, shouldCascade, parseSelectors, select } from './cascade';
import * as yaml from 'js-yaml';


function filter(trie: any, options: any) {
  const { keywords, selectors } = parseSelectors(options);
  return hashField(trie, keywords, selectors)
}

const functions: Moss.Functions = {}

export const next = (current: Moss.Layer, input: Moss.Branch): Moss.Layer => {
  const state = clone(current.state);
  extend(state.auto, current.data);
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
  const { state, data } = current;

  const existing = base(data);
  const selected = _cascade(current, data, {
    prefix: '=', usePrecedence: true, onMatch: (val) => {
      if (check(val, String)) {
        val = interpolate(current, val).data;
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
      if (check(res, Array)) {
        res = union(res, arrayify(val))
      } else if (check(res, Object)) {
        extend(res, val);
      }
    }
  });
  _cascade(current, data, {
    prefix: '-', usePrecedence: false, onMatch: (val) => {
      if (check(val, String)) {
        val = interpolate(current, val).data;
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

export function branch(current: Moss.Layer): Moss.Layer {
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
          extend(data, res);
        }
      } else if (key[0] == '$') {
        const res: string = <any>interpolate(current, key).data;
        const layer = next(current, data[key]);
        data[res] = layer.data;
        extend(state, { selectors: layer.state.selectors, stack: layer.state.stack });
        delete data[key];
      } else {
        const layer = next(current, data[key]);
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
    let i = 0;
    // const iterable = next(parent, data.from);
    return okmap(data.from, (item, key) => {
      const ret = next(layer, item);
      ret.state.stack.index = i;
      i++;
      // console.log('mapping with layer', layer.state);
      return { [key]: next(ret, clone(data.to)).data };
    });
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

function _interpolate(layer: Moss.Layer, input: any, dictionary: any): any {
  const { value, changed } = __interpolate(input, (str: string) => { // replace from trie
    if (!str) return '';
    const res = valueForKeyPath(str, dictionary);
    if (res) {
      return res;
    } else {
      throw new Error(`key path [ ${str} ] is not defined in stack}`);
    }
  }, (res: Object) => { // call method
    if (!Object.keys(res)) return '';
    return next(layer, res).data;
  });
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