import { Parser, Grammar } from 'nearley';
import { Moss } from '../../types';

import queryGrammar from "./compiled/query";
// const queryGrammar = require('./compiled/query').default;
import hydrateGrammar from './compiled/hydrate';

import caseInsensitiveChunk from './compiled/caseInsensitiveChunk';
import disambiguatedChunk from './compiled/disambiguatedChunk';

import versionCheck from './compiled/versionChunk';

const grammars = {
  query: Grammar.fromCompiled(queryGrammar),
  hydrate: Grammar.fromCompiled(hydrateGrammar),
  versionSegment: Grammar.fromCompiled(versionCheck),
  nameSegment: Grammar.fromCompiled(caseInsensitiveChunk),
  organizationSegment: Grammar.fromCompiled(disambiguatedChunk),
  projectSegment: Grammar.fromCompiled(caseInsensitiveChunk),
}

export const parse = (text: string, grammar: string, strict?: boolean) => {
  // ignore empty chars in parser is probably faster
  // let withoutEmptyChars = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

  const compiled = grammars[grammar];
  if (!compiled) {
    throw new Error("no compiled grammar " + grammar)
  }
  const parser = new Parser(compiled);
  const results = parser.feed(text).results;
  if (strict) {
    if (!results) throw new Error("bad parse result");
    if (results.length > 1) throw new Error("ambiguous parsing...");
  }
  return results && results[0];
}

export const decode = (text: string, grammar = 'query'): Moss.Branch => {
  if ((text === undefined) || (text === null)) {
    throw new Error("decoding " + text + " branch locator");
  }
  if (typeof text !== "string") {
    throw new Error("decoding object as branch locator");
  }
  return parse(text + " ", grammar);
}

export const transcode = (text: string, grammar = 'organizationSegment'): string => {
  if ((text === undefined) || (text === null)) throw new Error("decoding " + text + " branch locator");
  return parse(text + " ", grammar);
}

export const canonicalOrganizationSegment = (text: string): string => transcode(text, "organizationSegment");

import { confuseables } from './confusables';

const escapeRegexp = (str) => str.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');

var REPLACE_RE = RegExp(Object.keys(confuseables).map(escapeRegexp).join('|'), 'g');

export const unhomoglyph = (str) => {
  return str.replace(REPLACE_RE, match => confuseables[match]);
}
