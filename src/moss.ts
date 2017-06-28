/// <reference path="../interfaces/moss.d.ts" />

import { extend, check, combine, contains, clone, each, union, or, cascade as _cascade, hashField } from 'typed-json-transform';
import { interpolate } from './interpolate';
import { parse as _parse } from './parse';
import * as yaml from 'js-yaml';

export function parseSelectors($select: any) {
  const keywords: string[] = [];
  const selectors: string[] = [];
  each($select, (opt: string | number, key: string) => {
    const selector = '-' + key;
    keywords.push(selector);
    if (!!opt) selectors.push(selector);
  });
  return {
    keywords, selectors
  }
}

function cascade(trie: any, options: any) {
  const { keywords, selectors } = parseSelectors(options);
  return _cascade(trie, keywords, selectors)
}

function filter(trie: any, options: any) {
  const { keywords, selectors } = parseSelectors(options);
  return hashField(trie, keywords, selectors)
}

// export function inheritAndApplySelectors(trie: Moss.Trie, parent: Moss.Trie) {
//   const filtered = trie.$select ? filter(trie.$select, parent.$select || {}) : {};
//   const options = or(parent.$select || {}, filtered);
//   const environment = combine(parent.$environment || {}, trie.$environment ? cascade(trie.$environment, options) : {});
//   return {
//     options, environment
//   }
// }

function precedence() {
  return [
    '$select',
    '$heap',
    '$stack',
    '$each'
  ]
}

function sort() {

}

const functions: Moss.Functions = {}

export function getFunctions(){
  return functions;
}

export function addFunctions(userFunctions: Moss.Functions){
  extend(functions, userFunctions);
}

addFunctions({
    $select: ({ state }: Moss.Layer, args: any) => {
    const selected = cascade(args, state.selectors);
    extend(state.selectors, selected);
  },
  $heap: ({ state }: Moss.Layer, args: any) => {
    const selected = cascade(args, state.selectors);
    extend(state.heap, selected);
  },
  $stack: ({ state }: Moss.Layer, args: any) => {
    const selected = cascade(args, state.selectors);
    extend(state.stack, selected);
  },
  $each: ({ data, state }, args: any) => {
    delete data.$each;
    for (const key of Object.keys(args)) {
      const iState = moss(args[key], state).state;
      moss(data, state);
    }
  },
  $map: ({ data, state }, args: any) => {
    delete data.$map;
    const out = [];
    for (const key of Object.keys(args)) {
      const iState = moss(args[key], state).state;
      out.push(moss(data, state));
    }
    return out;
  }
});

const push = ({ stack, heap, selectors }: Moss.State) => {
  return {
    stack: clone(stack),
    heap,
    selectors: clone(selectors),
  }
}

function processLeaf(input: any, state: Moss.State): any {
  const dictionary = combine(state.heap, state.stack);
  const { value, changed } = _parse(input, dictionary, true);
  if (changed) {
    return processLeaf(value, state);
  }
  return value;
}

function pack(input: Moss.Branch, state: Moss.State) {
  return { data: input, state };
}

function _processBranch(input: Moss.Layer) {
  const { data, state } = input;
  for (const key of Object.keys(data)) {
    const downstream = data[key];
    if (key[0] == '$') {
      if (check(downstream, Object)) {
        functions[key](input, moss(downstream, push(state)).data);
      } else {
        functions[key](input, downstream);
      }
      delete data[key];
    } else if (check(downstream, Object)) {
      data[key] = cascade(moss(downstream, push(state)).data, state.selectors);
    } else {
      data[key] = processLeaf(downstream, state);
    }
  }
  return input;
}

// export function parseLayer(layer: Moss.Functions, branch: Moss.Layer) {
//   // const { options, environment } = inheritAndApplySelectors(layer, parent);
//   // delete layer.$select;
//   // delete layer.$environment;
//   // const flat = cascade(layer || {}, options);
//   // const parsed = iterate(flat, environment);
//   // parsed.$select = options;
//   // parsed.$environment = environment;
//   // return parsed;
//   return processBranch(layer, branch);
// }

function newState() {
  return { heap: {}, stack: {}, selectors: {} };
}

export function moss(input: Moss.Branch, state: Moss.State) {
  return _processBranch(pack(input, state));
}

export function load(trunk: Moss.Branch, baseParser?: Moss.Branch) {
  if (baseParser) {
    const { state } = moss(baseParser, newState());
    return moss(trunk, push(state)).data;
  }
  return moss(trunk, push(newState())).data;
  // const parser = processBranch(baseParser, {});
  // const layer = parseLayer(trunk, parser);
  // delete layer.$select;
  // delete layer.$environment;
  // return layer;
}