// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }

import { clone, mapToObject } from 'typed-json-transform';
import { lexer, any, indent, dedent, eol, sol, eof, sof, startRule, space } from './lexer';
import { expectedScopeOperator, unreachable } from './post/errors';
import { Mapping, Sequence, Flow, Number, Pair, Key, Comment, Expression, Identifier } from "./post/types";
import {
    tokenValue, tokenText, nuller, first, second,
    join, chars
} from './post/yaml';

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {"name": "flowToBlockScope", "symbols": ["blockNestedScope"], "postprocess": id},
    {"name": "blockNestedScope", "symbols": ["pushScope", "blockScope", "popScope"], "postprocess":  ([push, scope]) => {
        return scope
        } },
    {"name": "blockNestedSequence", "symbols": ["pushScope", "blockSequence", "popScope"], "postprocess":  ([push, scope]) => {
        return scope
        } },
    {"name": "blockSequence$ebnf$1$subexpression$1", "symbols": ["sol", "blockSequenceItem"]},
    {"name": "blockSequence$ebnf$1", "symbols": ["blockSequence$ebnf$1$subexpression$1"]},
    {"name": "blockSequence$ebnf$1$subexpression$2", "symbols": ["sol", "blockSequenceItem"]},
    {"name": "blockSequence$ebnf$1", "symbols": ["blockSequence$ebnf$1", "blockSequence$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "blockSequence", "symbols": ["blockSequence$ebnf$1"], "postprocess":  ([items], ref) => {
        	const s = new Sequence(items.map(([sol, item]) => item));
        	s.source.flow = Flow.block;
        	return s;
        } },
    {"name": "blockSequenceItem", "symbols": ["bullet", "expression"], "postprocess":  ([key, expression]) => {
        	return expression
        } },
    {"name": "blockSequenceItem", "symbols": ["comment"], "postprocess": id},
    {"name": "blockSequenceItem", "symbols": ["endLine"], "postprocess": id},
    {"name": "blockScope", "symbols": ["blockMapping"], "postprocess": id},
    {"name": "blockMapping$ebnf$1", "symbols": ["blockMappingLine"]},
    {"name": "blockMapping$ebnf$1", "symbols": ["blockMapping$ebnf$1", "blockMappingLine"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "blockMapping", "symbols": ["blockMapping$ebnf$1"], "postprocess":  ([pairs]) => {
        	const m = new Mapping(pairs);
        	m.source.flow = Flow.block;
        	return m;
        } },
    {"name": "blockMappingLine", "symbols": ["sol", "kvPair"], "postprocess": second},
    {"name": "blockMappingLine", "symbols": ["sol", "endLine"], "postprocess": second},
    {"name": "expression", "symbols": ["identifier", "endLine"], "postprocess":  ([identifier, endl]) => {
        	if (endl){
        		identifier.source.expandWithMap(endl);
        	}
        	return identifier;
        } },
    {"name": "anchor", "symbols": [{"literal":"&"}, "chunk"], "postprocess": ([tok, sequence]) => join([tokenValue(tok), sequence])},
    {"name": "kvPair$ebnf$1", "symbols": ["anchor"], "postprocess": id},
    {"name": "kvPair$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "kvPair", "symbols": ["blockKey", "kvPair$ebnf$1", "blockNestedScope"], "postprocess":  ([key, anchor, value]) => {
        	return new Pair(key, value);
        } },
    {"name": "kvPair", "symbols": ["blockKey", "__", "expression"], "postprocess":  ([key, sep, value]) => {
        	return new Pair(key, value);
        } },
    {"name": "kvPair", "symbols": ["blockKey", "__", "blockToFlowScope"], "postprocess":  ([key, sep, flow]) => {
        	return new Pair(key, flow);
        } },
    {"name": "kvPair", "symbols": ["blockKey", "__", "blockToFlowSequence"], "postprocess":  ([key, sep, flow, comment]) => {
        	return new Pair(key, flow);
        } },
    {"name": "blockKey", "symbols": ["identifier", {"literal":":"}], "postprocess": id},
    {"name": "bullet", "symbols": [{"literal":"-"}, "space"], "postprocess": first},
    {"name": "identifier$ebnf$1", "symbols": ["deref"], "postprocess": id},
    {"name": "identifier$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "identifier", "symbols": ["identifier$ebnf$1", "_identifier"], "postprocess":  ([deref, node]) => {
        	return new Expression(node, { deref });
        }
        		},
    {"name": "deref", "symbols": [{"literal":"*"}, "chunk"], "postprocess": ([tok, sequence]) => join([tokenValue(tok), sequence])},
    {"name": "_identifier", "symbols": ["number"], "postprocess": id},
    {"name": "_identifier", "symbols": ["chunkSequence"], "postprocess":  ([[identifier, sm]]) => {
        	return new Identifier(identifier, sm);
        }
          },
    {"name": "chunkSequence$ebnf$1", "symbols": ["chunkSequenceElement"]},
    {"name": "chunkSequence$ebnf$1", "symbols": ["chunkSequence$ebnf$1", "chunkSequenceElement"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "chunkSequence", "symbols": ["chunk", "chunkSequence$ebnf$1"], "postprocess": ([head, tail]) => join([head, ...tail])},
    {"name": "chunkSequence", "symbols": ["chunk"], "postprocess": id},
    {"name": "chunkSequenceElement", "symbols": ["__", "chunk"], "postprocess": join},
    {"name": "chunk$ebnf$1", "symbols": ["continueChunk"]},
    {"name": "chunk$ebnf$1", "symbols": ["chunk$ebnf$1", "continueChunk"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "chunk", "symbols": ["startChunk", "chunk$ebnf$1"], "postprocess":  ([head, tail]) => {
        // console.log({head, middle, tail});
        return join([head, ...tail]) 
        } },
    {"name": "chunk", "symbols": ["startChunk"], "postprocess": id},
    {"name": "startChunk", "symbols": [/[a-zA-Z0-9$_<>]/], "postprocess": tokenValue},
    {"name": "continueChunk", "symbols": [/[^:]/], "postprocess": tokenValue},
    {"name": "unquotedChar", "symbols": [any], "postprocess": tokenValue},
    {"name": "urlSafePlusEncoded", "symbols": ["urlSafePlusEncoded", "urlSafePlusEncodedChars"], "postprocess": join},
    {"name": "urlSafePlusEncoded", "symbols": ["urlSafePlusEncodedChars"], "postprocess": id},
    {"name": "urlSafePlusEncodedChars", "symbols": [{"literal":"%"}, "hexDigit", "hexDigit"], "postprocess": chars},
    {"name": "urlSafePlusEncodedChars", "symbols": [{"literal":"&"}, {"literal":"a"}, {"literal":"m"}, {"literal":"p"}, {"literal":";"}], "postprocess": chars},
    {"name": "urlSafePlusEncodedChars", "symbols": ["urlSafeChar"], "postprocess": tokenValue},
    {"name": "word", "symbols": ["word", "wordSafeChar"], "postprocess": join},
    {"name": "word", "symbols": ["wordStartChar"], "postprocess": id},
    {"name": "wordSafeChar", "symbols": ["wordStartChar"], "postprocess": id},
    {"name": "wordSafeChar", "symbols": [/[0-9]/], "postprocess": tokenValue},
    {"name": "wordStartChar", "symbols": [/[a-zA-Z$_]/], "postprocess": tokenValue},
    {"name": "string", "symbols": [{"literal":"`"}, "_escapedString", {"literal":"`"}], "postprocess": ([quote, string, quote2]) => join([tokenValue(quote), string, tokenValue(quote2)])},
    {"name": "_string", "symbols": [], "postprocess": function() {return ""; }},
    {"name": "_string", "symbols": ["_string", "_stringchar"], "postprocess": ([lhs, rhs]) => lhs + rhs},
    {"name": "_stringchar", "symbols": [/[^\\"]/], "postprocess": id},
    {"name": "_stringchar", "symbols": [{"literal":"\\"}, /[^]/], "postprocess": chars},
    {"name": "hexDigit", "symbols": [/[0-9a-fA-F]/], "postprocess": id},
    {"name": "urlSafe$ebnf$1", "symbols": ["urlSafeChar"]},
    {"name": "urlSafe$ebnf$1", "symbols": ["urlSafe$ebnf$1", "urlSafeChar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "urlSafe", "symbols": ["urlSafe$ebnf$1"], "postprocess": chars},
    {"name": "urlSafeChar", "symbols": [/[a-zA-Z0-9\-]/], "postprocess": id},
    {"name": "_escapedString", "symbols": ["_escapedString", "escapedChar"], "postprocess": chars},
    {"name": "_escapedString", "symbols": ["escapedChar"], "postprocess": id},
    {"name": "escapedChar", "symbols": [space], "postprocess": id},
    {"name": "escapedChar", "symbols": [any], "postprocess": id},
    {"name": "flowPushScope", "symbols": ["inlinePushScope"], "postprocess": id},
    {"name": "flowPushScope", "symbols": ["disregardedIndentPushScope"], "postprocess": id},
    {"name": "inlinePushScope$subexpression$1", "symbols": [{"literal":"{"}]},
    {"name": "inlinePushScope", "symbols": ["inlinePushScope$subexpression$1", "_"], "postprocess":  ([indent, space]) => {
        return indent
          } },
    {"name": "disregardedIndentPushScope$subexpression$1", "symbols": [{"literal":"{"}]},
    {"name": "disregardedIndentPushScope", "symbols": ["disregardedIndentPushScope$subexpression$1", "pushScope", "sol"], "postprocess":  ([indent, ignoredIndent]) => {
        	return indent
        } },
    {"name": "flowPopScope$ebnf$1$subexpression$1", "symbols": ["endLine", "dedent"]},
    {"name": "flowPopScope$ebnf$1", "symbols": ["flowPopScope$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "flowPopScope$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "flowPopScope$subexpression$1", "symbols": [{"literal":"}"}]},
    {"name": "flowPopScope", "symbols": ["flowPopScope$ebnf$1", "sol", "flowPopScope$subexpression$1"], "postprocess": ([eol, ignoredDedent, sol, dedent]) => dedent},
    {"name": "flowPopScope", "symbols": ["_", {"literal":"}"}], "postprocess": ([sp, dedent]) => dedent},
    {"name": "blockToFlowScope", "symbols": ["flowNestedScope"], "postprocess": id},
    {"name": "flowNestedScope", "symbols": ["flowPushScope", "flowMappingScope", "flowPopScope"], "postprocess":  ([push, scope]) => {
        return scope
        } },
    {"name": "flowMappingScope$ebnf$1", "symbols": ["flowPairConstructor"]},
    {"name": "flowMappingScope$ebnf$1", "symbols": ["flowMappingScope$ebnf$1", "flowPairConstructor"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "flowMappingScope", "symbols": ["flowMappingScope$ebnf$1"], "postprocess": id},
    {"name": "flowPairConstructor", "symbols": ["flowKey", "_", "flowToBlockScope"], "postprocess":  ([key, sep, scope]) => {
        	console.log('flow => nestedBlockScope', key, scope);
        	return [key, scope];
        } },
    {"name": "flowPairConstructor", "symbols": ["flowKey", "_", "expression"], "postprocess":  ([key, sep, expression]) => {
        	console.log('flow pair', [key[0], expression[0]]);
        	return [key, expression]
        } },
    {"name": "flowPushSequence", "symbols": ["inlinePushSequence"], "postprocess": id},
    {"name": "flowPushSequence", "symbols": ["disregardedIndentedSequence"], "postprocess": id},
    {"name": "inlinePushSequence$subexpression$1", "symbols": [{"literal":"["}]},
    {"name": "inlinePushSequence", "symbols": ["inlinePushSequence$subexpression$1", "_"], "postprocess":  ([indent, space]) => {
        return indent
          } },
    {"name": "disregardedIndentedSequence$subexpression$1", "symbols": [{"literal":"["}]},
    {"name": "disregardedIndentedSequence", "symbols": ["disregardedIndentedSequence$subexpression$1", "pushScope", "sol"], "postprocess":  ([indent, ignoredIndent]) => {
        	return indent
        } },
    {"name": "flowPopSequence$ebnf$1$subexpression$1", "symbols": ["endLine", "dedent"]},
    {"name": "flowPopSequence$ebnf$1", "symbols": ["flowPopSequence$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "flowPopSequence$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "flowPopSequence$subexpression$1", "symbols": [{"literal":"]"}]},
    {"name": "flowPopSequence", "symbols": ["flowPopSequence$ebnf$1", "sol", "flowPopSequence$subexpression$1"], "postprocess": ([eol, ignoredDedent, sol, dedent]) => null},
    {"name": "flowPopSequence$subexpression$2", "symbols": [{"literal":"]"}]},
    {"name": "flowPopSequence", "symbols": ["_", "flowPopSequence$subexpression$2"], "postprocess": ([sp, dedent]) => null},
    {"name": "blockToFlowSequence", "symbols": ["flowNestedSequence"], "postprocess": id},
    {"name": "flowNestedSequence", "symbols": ["flowPushSequence", "flowSequenceScope", "flowPopSequence"], "postprocess":  ([push, scope]) => {
        return scope
        } },
    {"name": "flowSequenceScope$ebnf$1", "symbols": ["flowSequenceConstructor"]},
    {"name": "flowSequenceScope$ebnf$1", "symbols": ["flowSequenceScope$ebnf$1", "flowSequenceConstructor"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "flowSequenceScope", "symbols": ["flowSequenceScope$ebnf$1"], "postprocess":  ([seq]) => {
        	return new Sequence(seq);
        } },
    {"name": "sequenceToBlockMapping", "symbols": ["flowKey", "_", "flowToBlockScope"], "postprocess":  ([key, sep, scope]) => {
            console.log('sequenceToBlockMapping', key);
        return new Mapping(scope)
        } },
    {"name": "flowSequenceConstructor$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "_"]},
    {"name": "flowSequenceConstructor$ebnf$1", "symbols": ["flowSequenceConstructor$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "flowSequenceConstructor$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "flowSequenceConstructor$subexpression$1", "symbols": ["expression"]},
    {"name": "flowSequenceConstructor$subexpression$1", "symbols": ["flowNestedScope"]},
    {"name": "flowSequenceConstructor$subexpression$1", "symbols": ["flowNestedSequence"]},
    {"name": "flowSequenceConstructor$subexpression$1", "symbols": ["sequenceToBlockMapping"]},
    {"name": "flowSequenceConstructor", "symbols": ["flowSequenceConstructor$ebnf$1", "flowSequenceConstructor$subexpression$1"], "postprocess":  ([key, sequenceStatement]) => {
                  return sequenceStatement
        } },
    {"name": "flowKey$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "_"]},
    {"name": "flowKey$ebnf$1", "symbols": ["flowKey$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "flowKey$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "flowKey", "symbols": ["flowKey$ebnf$1", "expression", "_", {"literal":":"}], "postprocess": ([w, key, w2, sep]) => key},
    {"name": "pushScope", "symbols": ["endLine", "indent"], "postprocess":  ([comment, _]) => {
        return [comment];
        	 } },
    {"name": "popScope", "symbols": ["dedent"], "postprocess": nuller},
    {"name": "endLine", "symbols": ["__", "comment"], "postprocess": second},
    {"name": "endLine", "symbols": ["eol"], "postprocess": nuller},
    {"name": "comment$ebnf$1", "symbols": ["_escapedString"], "postprocess": id},
    {"name": "comment$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "comment", "symbols": [{"literal":"#"}, "comment$ebnf$1", "eol"], "postprocess": 
        ([hash, comment]) => {
        	if (comment){
        		const [text, sm] = join([tokenValue([hash]), comment]);
        		return new Comment(comment, sm);
        	}
        	const [_, sm] = tokenValue([hash]);
        	return new Comment(null, sm);
        } },
    {"name": "sof", "symbols": [sof], "postprocess": tokenValue},
    {"name": "eof", "symbols": [eof], "postprocess": tokenValue},
    {"name": "sol", "symbols": [sol], "postprocess": tokenText},
    {"name": "eol", "symbols": [eol], "postprocess": tokenText},
    {"name": "indent", "symbols": [indent], "postprocess": tokenText},
    {"name": "dedent", "symbols": [dedent], "postprocess": tokenText},
    {"name": "space", "symbols": [space], "postprocess": tokenValue},
    {"name": "__$ebnf$1", "symbols": [space]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", space], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": chars},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", space], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": chars},
    {"name": "number$ebnf$1$subexpression$1", "symbols": [{"literal":"e"}, "digit"]},
    {"name": "number$ebnf$1", "symbols": ["number$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "number$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "number", "symbols": ["digit", {"literal":"."}, "digit", "number$ebnf$1"], "postprocess":  ([dig, tok, dig2, ex]) => {
        	let el = [dig, tokenValue([tok]), dig2];
        	if (ex){
        		el.push(...join([tokenValue([ex[0]]), ex[1]]))
        	}
        	let [text, source] = join(el);
        	const ns = source.fork();
        	return new Number(
        		parseFloat(text),
        		"float",
        		ns
        	)
        } },
    {"name": "number", "symbols": ["digit"], "postprocess":  (args) => {
        	let [text, source] = join(args)
        	const ns = source.fork();
        	return new Number(
        		parseInt(text),
        		"int",
        		ns
        	)
        } },
    {"name": "digit", "symbols": ["digit", /[0-9]/], "postprocess": ([digit, tok]) => join([digit, tokenValue([tok])])},
    {"name": "digit", "symbols": [/[0-9]/], "postprocess": tokenValue},
    {"name": "start", "symbols": ["sof", "blockScope", "eof"], "postprocess": ([sof, scope]) => scope}
  ],
  ParserStart: "start",
};

export default grammar;
