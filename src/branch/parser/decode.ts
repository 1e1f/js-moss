import { Parser, Grammar } from 'nearley';
import { Moss } from '../../types';

const queryGrammar = require('./compiled/query').default;
const locatorGrammar = require('./compiled/locator').default;

const disambiguatedChunk = require('./compiled/disambiguatedChunk').default;
const grammars = {
  query: Grammar.fromCompiled(queryGrammar),
  locator: Grammar.fromCompiled(locatorGrammar),
  versionSegment: Grammar.fromCompiled(require('./compiled/versionChunk').default),
  nameSegment: Grammar.fromCompiled(require('./compiled/caseInsensitiveChunk').default),
  organizationSegment: Grammar.fromCompiled(disambiguatedChunk),
  projectSegment: Grammar.fromCompiled(disambiguatedChunk),
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

export const decode = (text: string, grammar = 'locator'): Moss.Branch => {
  if ((text === undefined) || (text === null)) throw new Error("decoding " + text + " branch locator");
  return parse(text + " ", grammar);
}

export const transcode = (text: string, grammar = 'organizationSegment'): string => {
  if ((text === undefined) || (text === null)) throw new Error("decoding " + text + " branch locator");
  return parse(text + " ", grammar);
}
