/// <reference path="../interfaces/moss.d.ts" />

import { extend, check, combine, combineN, contains, clone, each, okmap, union, or, hashField } from 'typed-json-transform';
import { interpolate } from './interpolate';
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

export namespace Parse {
  export function cascade(current: Moss.Layer) {
    const { state, data } = current;
    if (!check(data, Object)) {
      return current;
    }
    return <Moss.Layer>{ data: _cascade(data, state), state };
  }

  export function call(current: Moss.Layer) {
    const { state, data } = current;
    if (!check(data, Object)) {
      return current;
    }
    for (const key of Object.keys(data)) {
      if (key[0] == '$') {
        if (!functions[key]) {
          throw new Error(`${key} is not a known procedure`);
        }
        const res = functions[key](current, data[key]);
        delete data[key];
        if (res) {
          extend(data, res);
        }
      }
    }
    return current;
  }

  export function iterate(current: Moss.Layer) {
    const { state, data } = current;
    if (!check(data, Object)) {
      return current;
    }
    for (const key of Object.keys(data)) {
      const next = data[key];
      if (check(next, Object)) {
        data[key] = Push.branch(next, state).data;
      } else {
        data[key] = processLeaf(next, current);
      }
    }
    return current;
  }

  export function parse(current: Moss.Layer) {
    const { state, data } = current;
    if (!check(data, Object)) {
      return current;
    }
    for (const key of Object.keys(data)) {
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
          extend(data, res);
        } else if (res) {
          return { data: res, state };
        }
      } else {
        const next = data[key];
        if (check(next, Object)) {
          data[key] = Push.branch(next, state).data;
        } else {
          data[key] = processLeaf(next, current);
        }
      }
    }
    return current;
  }

  export function branch(current: Moss.Layer) {
    return parse(current);
    // return iterate(call(cascade(current)));
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

addFunctions({
  $select: ({ state }: Moss.Layer, args: any) => {
    const selected = Push.branch(args, state).data;
    extend(state.selectors, selected);
  },
  $store: ({ state }: Moss.Layer, args: any) => {
    const selected = Push.branch(args, state).data;
    extend(state.heap, selected);
  },
  $: ({ state }: Moss.Layer, args: any) => {
    const selected = Push.branch(args, state).data;
    extend(state.stack, selected);
  },
  $map: (layer: Moss.Layer, { from, to }: any) => {
    const { state } = layer;
    if (!from) {
      throw new Error(`for $map please supply 'from:' as input`);
    }
    if (!to) {
      throw new Error(`for $map please supply 'to:' as `);
    }
    if (check(from, String)) {
      from = processLeaf(from, layer);
    } else {
      from = Push.branch(from, state).data;
    }
    let i = 0;
    return okmap(from, (item, key) => {
      const iState = Push.state(state);
      iState.stack.index = i;
      i++;
      extend(iState.stack, Push.branch(item, iState).data);
      const iData = clone(to);
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

export function load(trunk: Moss.Branch, baseParser?: Moss.Branch) {
  if (baseParser) {
    const { state } = Push.branch(baseParser, Push.newState());
    return Push.branch(trunk, state).data;
  }
  return Push.branch(trunk, Push.newState()).data;
}
