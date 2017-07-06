/// <reference path="../interfaces/moss.d.ts" />

import { extend, check, combine, combineN, contains, clone, each, okmap, union, or, hashField } from 'typed-json-transform';
import { interpolate as __interpolate } from './interpolate';
import { cascade as _cascade, parseSelectors, select } from './cascade';
import * as yaml from 'js-yaml';


function filter(trie: any, options: any) {
  const { keywords, selectors } = parseSelectors(options);
  return hashField(trie, keywords, selectors)
}

function precedence() {
  return [
    '$select',
    '$',
    '$temp',
    '$function',
    '$map'
  ]
}

function sort() {

}

const functions: Moss.Functions = {}

export function parse(current: Moss.Layer): Moss.Layer {
  const { state, data } = current;
  if (!check(data, Object)) {
    return interpolate(data, current);
  }
  for (let key of Object.keys(data)) {
    if (key[0] == '$' && key[1] == '{') {
      const res = interpolate(key, current).data;
      data[res] = data[key]
      delete data[key];
      key = res;
    }
    if (key[0] == '$') {
      if (!functions[key]) {
        throw new Error(`${key} is not a known procedure`);
      }
      const res = functions[key](current, data[key]);
      delete data[key];
      if (res) {
        extend(data, res);
      }
    } else if (key[0] == '-') {
      const res = _cascade({ [key]: data[key] }, state);
      if (check(res, Object)) {
        delete data[key];
        extend(data, Push.branch(res, current).data);
      } else if (res) {
        return { data: res, state };
      }
    } else {
      data[key] = Push.branch(data[key], current).data;
    }
  }
  return current;
}

export namespace Push {
  export const newState = (): Moss.State => {
    return { auto: {}, stack: {}, selectors: {} };
  }

  export const newLayer = (): Moss.Layer => {
    return { data: {}, state: newState() }
  }

  export const branch = (input: Moss.Branch, layer: Moss.Layer) => {
    const state = clone(layer.state);
    extend(state.auto, layer.data);
    return parse(pack(input, state));
  }
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
    const selected = Push.branch(args, current).data;
    extend(state.selectors, selected);
  },
  $: (layer: Moss.Layer, args: any) => {
    const selected = Push.branch(args, layer).data;
    extend(layer.state.stack, selected);
  },
  $function: ({ state, data }: Moss.Layer, args: any) => {
    return args;
  },
  $map: (layer: Moss.Layer, { from, to }: any) => {
    const { state } = layer;
    if (!from) {
      throw new Error(`for $map please supply 'from:' as input`);
    }
    if (!to) {
      throw new Error(`for $map please supply 'to:' as `);
    }
    let fromLayer: Moss.Layer;
    if (check(from, String)) {
      fromLayer = interpolate(from, layer);
    } else {
      fromLayer = Push.branch(from, layer);
    }
    let i = 0;
    return okmap(fromLayer.data, (item, key) => {
      // console.log('mapping with context', item);
      const iLayer = Push.branch(item, fromLayer);
      iLayer.state.stack.index = i;
      i++;
      const iData = clone(to);
      return { [key]: Push.branch(iData, iLayer).data };
    });
  }
});

function interpolate(input: any, layer: Moss.Layer): any {
  const { data, state } = layer;
  let dictionary;
  if (check(data, Object)) {
    dictionary = { ...state.auto, ...data, ...state.stack };
  } else {
    dictionary = { ...state.auto, ...state.stack }
  }
  const res = _interpolate(input, dictionary);
  return { data: res, state: layer.state };
}

function _interpolate(input: any, dictionary: any): any {
  const { value, changed } = __interpolate(input, dictionary, true);
  if (changed) {
    return _interpolate(value, dictionary);
  }
  return value;
}

function pack(input: Moss.Branch, state: Moss.State) {
  return { data: input, state };
}

export function load(trunk: Moss.Branch, baseParser?: Moss.Branch) {
  if (baseParser) {
    const layer = Push.branch(baseParser, Push.newLayer());
    return Push.branch(trunk, layer).data;
  }
  return Push.branch(trunk, Push.newLayer()).data;
}
