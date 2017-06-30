/// <reference path="../interfaces/moss.d.ts" />

import { extend, check, combine, combineN, contains, clone, each, okmap, union, or, cascade as _cascade, hashField } from 'typed-json-transform';
import { interpolate } from './interpolate';
import * as yaml from 'js-yaml';


export function parseSelectors($select: any) {
  const keywords: string[] = ['-'];
  const selectors: string[] = ['-'];
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
    '$store',
    '$temp',
    '$function',
    '$map'
  ]
}

function sort() {

}

const functions: Moss.Functions = {}

export namespace Parse {
  export function branch(current: Moss.Layer) {
    const { data, state } = current;
    for (const key of Object.keys(data)) {
      const next = data[key];
      if (key[0] == '$') {
        if (!functions[key]) {
          throw new Error(`${key} is not a known procedure`);
        }
        const res = functions[key](current, next)
        if (res) {
          extend(current.data, res);
        }
        delete data[key];
      } else if (check(next, Object)) {
        data[key] = Push.branch(cascade(next, state.selectors), state).data;
      } else {
        data[key] = processLeaf(next, current);
      }
    }
    return current;
  }
}

export namespace Push {
  export const newState = () => {
    return { heap: {}, stack: {}, selectors: {} };
  }

  export const state = ({ stack, heap, selectors }: Moss.State) => {
    return <Moss.State>{
      stack: clone(stack),
      heap,
      selectors: clone(selectors),
    }
  }

  export const branch = (input: Moss.Branch, _state: Moss.State) => {
    return Parse.branch(pack(input, state(_state)));
  }
}

export function getFunctions() {
  return functions;
}

export function addFunctions(userFunctions: Moss.Functions) {
  extend(functions, userFunctions);
}

// export const cascade = ({ data, state }: Moss.Layer) => {
//   for (const key of Object.keys(data)) {
//     const next = data[key];
//     if (key[0] == '-') {

//     } {

//     }
//   }
// }

addFunctions({
  $cascade: ({ state }: Moss.Layer, args: any) => {
    return cascade(args, state.selectors);
  },
  $select: ({ state }: Moss.Layer, args: any) => {
    const selected = cascade(args, state.selectors);
    extend(state.selectors, selected);
  },
  $store: ({ state }: Moss.Layer, args: any) => {
    const selected = cascade(args, state.selectors);
    extend(state.heap, selected);
  },
  $temp: ({ state }: Moss.Layer, args: any) => {
    const selected = cascade(args, state.selectors);
    extend(state.stack, selected);
  },
  $map: (layer: Moss.Layer, { $in, $out }: any) => {
    const { state } = layer;
    if (!$in) {
      throw new Error(`for $map please supply $in`);
    }
    if (!$out) {
      throw new Error(`for $map please supply $out`);
    }
    if (check($in, String)) {
      $in = processLeaf($in, layer);
    }
    let i = 0;
    return okmap($in, (item, key) => {
      const iState = Push.state(state);
      const iData = clone($out);
      iState.index = i;
      extend(iState.stack, Push.branch(item, iState).data);
      i++;
      return { [key]: Parse.branch(pack(iData, iState)).data };
    });
  }
});

function processLeaf(input: any, layer: Moss.Layer): any {
  const { data, state } = layer;
  const dictionary = combineN({ store: state.heap }, data, state.stack);
  const { value, changed } = interpolate(input, dictionary, true);
  if (changed) {
    return processLeaf(value, layer);
  }
  return value;
}

function pack(input: Moss.Branch, state: Moss.State) {
  return { data: input, state };
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

export function load(trunk: Moss.Branch, baseParser?: Moss.Branch) {
  if (baseParser) {
    const { state } = Push.branch(baseParser, Push.newState());
    return Push.branch(trunk, state).data;
  }
  return Push.branch(trunk, Push.newState()).data;
  // const parser = processBranch(baseParser, {});
  // const layer = parseLayer(trunk, parser);
  // delete layer.$select;
  // delete layer.$environment;
  // return layer;
}
