/// <reference path="../interfaces/moss.d.ts" />

import { extend, check, combine, combineN, contains, clone, each, okmap, union, or, hashField, valueForKeyPath } from 'typed-json-transform';
import { interpolate as __interpolate } from './interpolate';
import { cascade as _cascade, parseSelectors, select } from './cascade';
import * as yaml from 'js-yaml';


function filter(trie: any, options: any) {
  const { keywords, selectors } = parseSelectors(options);
  return hashField(trie, keywords, selectors)
}

const functions: Moss.Functions = {}

export const next = (current: Moss.Layer, input: Moss.Branch) => {
  const state = clone(current.state);
  extend(state.auto, current.data);
  if (check(input, Object)) {
    return parse({ data: input, state });
  } else {
    return interpolate(current, input);
  }
}

export function parse(current: Moss.Layer): Moss.Layer {
  const { state, data } = current;
  for (let key of Object.keys(data)) {
    if (key[0] == '$') {
      if (key[1] == '{') {
        const res: string = <any>interpolate(current, key).data;
        data[res] = data[key]
        delete data[key];
        key = res;
      }
    }
    if (key[0] == '\\') {
      data[key.slice(1)] = data[key];
      delete data[key];
    } else if (key.slice(-2) === '()') {
      data[key.slice(0, key.length - 2)] = data[key];
      delete data[key];
    } else if (key[0] == '$') {
      let res;
      if (functions[key]) {
        res = functions[key](current, data[key]);
      } else {
        throw new Error(`no known function ${key}`);
      }
      delete data[key];
      if (res) {
        extend(data, res);
      }
    } else if (key[0] == '-') {
      const res = _cascade({ [key]: data[key] }, state);
      if (check(res, Object)) {
        delete data[key];
        const layer = parse({ data: res, state });
        extend(data, layer.data);
      } else if (res) {
        return { data: res, state };
      }
    } else {
      const layer = next(current, data[key]);
      data[key] = layer.data;
      extend(state, layer.state);
    }
  }
  return current;
}

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
  $select: (current: Moss.Layer, args: any) => {
    const { state } = current;
    const selected = next(current, args).data;
    extend(state.selectors, selected);
  },
  $: (layer: Moss.Layer, args: any) => {
    const selected = next(layer, args).data;
    extend(layer.state.stack, selected);
  },
  $function: ({ state, data }: Moss.Layer, args: any) => {
    return args;
  },
  $each: (layer: Moss.Layer, args: any) => {
    if (!args.of) {
      throw new Error(`for $each please supply 'of:' as input`);
    }
    if (!args.do) {
      throw new Error(`for $each please supply 'do:' as `);
    }
    const iLayer = next(layer, args.of);
    let i = 0;
    each(iLayer.data, (item, key) => {
      const layer = next(iLayer, item);
      layer.state.stack.index = i;
      next(layer, clone(args.do));
      i++;
    });
  },
  $map: (parent: Moss.Layer, args: any) => {
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
  const { value, changed } = __interpolate(input, (str: string) => {
    const res = valueForKeyPath(str, dictionary);
    if (res) {
      return res;
    } else {
      throw new Error(`no value for required keypath ${str} in interpolation stack \n${yaml.dump(dictionary)} `);
    }
  }, (res) => {
    return next(layer, res).data;
  });
  if (changed) {
    if (check(value, Object)) {
      return value;
    }
    return _interpolate(layer, value, dictionary);
  }
  return value;
}

export function load(trunk: Moss.Branch, baseParser?: Moss.Branch) {
  if (baseParser) {
    const layer = next(newLayer(), baseParser);
    return next(layer, trunk).data;
  }
  return next(newLayer(), trunk).data;
}
