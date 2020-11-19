import { Parser, Grammar } from 'nearley';
import { Moss } from '../../types';
const grammar = require('./compiled').default;

const compiled = Grammar.fromCompiled(grammar);

export const parse = (text: string) => {
  // ignore empty chars in parser is probably faster
  // let withoutEmptyChars = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
  const parser = new Parser(compiled);
  return parser.feed(text);
}

export const decode = (text: string): Moss.Branch => {
  if ((text === undefined) || (text === null)) throw new Error("decoding " + text + " branch locator");
  const parsed = parse(text + " ");
  // console.log(parsed.results ? (parsed.results[0] || {}) : {})
  return parsed.results ? (parsed.results[0] || {}) : {};
}
