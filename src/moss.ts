/// <reference path="../interfaces/moss.d.ts" />

import { check, combine, contains, clone, each, union, or, cascade as _cascade, hashField } from 'typed-json-transform';
import { interpolate } from './interpolate';
import { parse as _parse } from './parse';

export function extract(options: any) {
  const keywords: string[] = [];
  const selectors: string[] = [];
  each(options, (opt: string | number, key: string) => {
    keywords.push(key);
    if (opt) selectors.push(key);
  });
  return {
    keywords, selectors
  }
}

function cascade(trie: any, options: any) {
  const { keywords, selectors } = extract(options);
  return _cascade(trie, keywords, selectors)
}

function filter(trie: any, options: any) {
  const { keywords, selectors } = extract(options);
  return hashField(trie, keywords, selectors)
}

export function inheritAndApplyOptions(trie: Moss.Trie, parent: Moss.Trie) {
  const filtered = trie.$options ? filter(trie.$options, parent.$options || {}) : {};
  const options = or(parent.$options || {}, filtered);
  const environment = combine(parent.$environment || {}, trie.$environment ? cascade(trie.$environment, options) : {});
  return {
    options, environment
  }
}

function parse(input: any, heap: any, stack?: Object): any {
  if (check(input, String)) {
    // let ret = input;
    // let shouldRecur = false;
    const dictionary = combine(heap, stack);
    // if (stack) {
    //   const { value, changed } = _parse(input, stack, false);
    //   ret = value;
    //   if (changed) shouldRecur = true;
    // }
    const { value, changed } = _parse(input, dictionary, true);
    if (changed) {
      return parse(value, heap, stack);
    }
    return value;
  } else if (check(input, Object)) {
    for (const key of Object.keys(input)) {
      input[key] = parse(input[key], heap, input);
    }
    return input;
  } else {
    return input
  };
}

export function parseLayer(layer: Moss.Trie, parent: Moss.Trie) {
  const { options, environment } = inheritAndApplyOptions(layer, parent);
  delete layer.$options;
  delete layer.$environment;
  const flat = cascade(layer || {}, options);
  const parsed = parse(flat, environment);
  parsed.$options = options;
  parsed.$environment = environment;
  return parsed;
}

export function parseTrie(trunk: Moss.Trie, baseParser: Moss.Trie) {
  return parseLayer(trunk, baseParser);
}

export function load(trunk: Moss.Trie, baseParser: Moss.Trie) {
  const parser = parseLayer(baseParser, {});
  const layer = parseLayer(trunk, parser);
  delete layer.$options;
  delete layer.$environment;
  return layer;
}