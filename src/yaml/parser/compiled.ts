// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }

import { clone, mapToObject } from 'typed-json-transform';
import { lexer, any, indent, dedent, eol, sol, eof, sof, startRule, space } from './lexer';
import { expectedScopeOperator } from './post/errors';
import {
  nuller, first, second, secondInList, createMap, addPairToMap,
  join, singleWord, unaryOperate, operate, appendToSequence,
	fork, createFlowSequence, createBlockSequence
} from './post/ast';

interface NearleyToken {  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: NearleyToken) => string;
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
    {"name": "scalar$ebnf$1", "symbols": [{"literal":"&"}], "postprocess": id},
    {"name": "scalar$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "scalar", "symbols": ["scalar$ebnf$1", "_scalar"], "postprocess":  ([anchor, scalar]) => {
        	if (anchor){
        		scalar[1].isAnchor = true;
        	}
        	return scalar;
        }
        		},
    {"name": "_scalar", "symbols": ["number"], "postprocess": ([v]) => [v, {number: true}]},
    {"name": "_scalar", "symbols": ["chunkSequence"], "postprocess":  ([str]) => {
        	return [str, {scalar: true}]
        } },
    {"name": "chunkSequence$ebnf$1", "symbols": ["chunkSequenceElement"]},
    {"name": "chunkSequence$ebnf$1", "symbols": ["chunkSequence$ebnf$1", "chunkSequenceElement"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "chunkSequence", "symbols": ["chunk", "chunkSequence$ebnf$1"], "postprocess": ([head, tail]) => [head, ...tail].join('')},
    {"name": "chunkSequence", "symbols": ["chunk"], "postprocess": id},
    {"name": "chunkSequenceElement", "symbols": ["__", "chunk"], "postprocess": join},
    {"name": "chunk$ebnf$1", "symbols": []},
    {"name": "chunk$ebnf$1", "symbols": ["chunk$ebnf$1", "continueChunk"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "chunk", "symbols": ["startChunk", "chunk$ebnf$1", "stopChunk"], "postprocess":  ([head, middle, tail]) => {
        // console.log({head, middle, tail});
        return [head, ...middle, tail].join('');
        } },
    {"name": "chunk", "symbols": ["startChunk"], "postprocess": id},
    {"name": "startChunk", "symbols": [/[a-zA-Z$_<>]/], "postprocess": ([tok]) => tok.value},
    {"name": "continueChunk", "symbols": [any], "postprocess": ([tok]) => tok.value},
    {"name": "stopChunk", "symbols": [/[^: ]/], "postprocess": id},
    {"name": "unquotedChar", "symbols": [any], "postprocess": ([tok]) => tok.value},
    {"name": "urlSafePlusEncoded", "symbols": ["urlSafePlusEncoded", "urlSafePlusEncodedChars"], "postprocess": join},
    {"name": "urlSafePlusEncoded", "symbols": ["urlSafePlusEncodedChars"], "postprocess": id},
    {"name": "urlSafePlusEncodedChars", "symbols": [{"literal":"%"}, "hexDigit", "hexDigit"], "postprocess": join},
    {"name": "urlSafePlusEncodedChars", "symbols": [{"literal":"&"}, {"literal":"a"}, {"literal":"m"}, {"literal":"p"}, {"literal":";"}], "postprocess": join},
    {"name": "urlSafePlusEncodedChars", "symbols": ["urlSafeChar"], "postprocess": id},
    {"name": "word", "symbols": ["word", "wordSafeChar"], "postprocess": join},
    {"name": "word", "symbols": ["wordStartChar"], "postprocess": id},
    {"name": "wordSafeChar", "symbols": ["wordStartChar"], "postprocess": id},
    {"name": "wordSafeChar", "symbols": [/[0-9]/], "postprocess": ([tok]) => tok.value},
    {"name": "wordStartChar", "symbols": [/[a-zA-Z$_]/], "postprocess": ([tok]) => tok.value},
    {"name": "string", "symbols": [{"literal":"`"}, "_escapedString", {"literal":"`"}], "postprocess": ([quote, string]) => string},
    {"name": "_string", "symbols": [], "postprocess": function() {return ""; }},
    {"name": "_string", "symbols": ["_string", "_stringchar"], "postprocess": ([lhs, rhs]) => lhs + rhs},
    {"name": "_stringchar", "symbols": [/[^\\"]/], "postprocess": id},
    {"name": "_stringchar", "symbols": [{"literal":"\\"}, /[^]/], "postprocess": join},
    {"name": "hexDigit", "symbols": [/[0-9a-fA-F]/], "postprocess": id},
    {"name": "urlSafe", "symbols": ["urlSafe", "urlSafeChar"], "postprocess": join},
    {"name": "urlSafe", "symbols": ["urlSafeChar"], "postprocess": id},
    {"name": "urlSafeChar", "symbols": [/[a-zA-Z0-9\-]/], "postprocess": ([tok]) => tok.value},
    {"name": "_escapedString", "symbols": ["_escapedString", "escapedChar"], "postprocess": join},
    {"name": "_escapedString", "symbols": ["escapedChar"], "postprocess": id},
    {"name": "escapedChar", "symbols": [space], "postprocess": ([tok]) => tok.value},
    {"name": "escapedChar", "symbols": [any], "postprocess": ([tok]) => tok.value},
    {"name": "number", "symbols": ["_number"], "postprocess":  ([n]) => {
        console.log('number', n); return parseFloat(n) } },
    {"name": "_number", "symbols": ["_float", {"literal":"e"}, "digit"], "postprocess": join},
    {"name": "_number", "symbols": ["_float"], "postprocess": id},
    {"name": "_float", "symbols": ["digit", {"literal":"."}, "digit"], "postprocess": join},
    {"name": "_float", "symbols": ["digit"], "postprocess": id},
    {"name": "digit", "symbols": ["digit", /[0-9]/], "postprocess": join},
    {"name": "digit", "symbols": [/[0-9]/], "postprocess": ([tok]) => tok.text},
    {"name": "pushScope", "symbols": ["endLine", "indent"], "postprocess":  ([eol, indent]) => {
        return indent;
        	 } },
    {"name": "popScope", "symbols": ["dedent"], "postprocess": null},
    {"name": "endLine", "symbols": ["__", "comment"], "postprocess": second},
    {"name": "endLine", "symbols": ["_", "eol"], "postprocess": nuller},
    {"name": "comment$ebnf$1", "symbols": ["_escapedString"], "postprocess": id},
    {"name": "comment$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "comment", "symbols": [{"literal":"#"}, "comment$ebnf$1", eol], "postprocess": 
        ([hash, comment]) => {
        	console.log({comment});
        	 return [comment || '', {isComment: true}]
        } },
    {"name": "sof", "symbols": [sof], "postprocess": ([tok]) => tok.value},
    {"name": "eof", "symbols": [eof], "postprocess": ([tok]) => tok.value},
    {"name": "sol", "symbols": [sol], "postprocess": ([tok]) => tok},
    {"name": "eol", "symbols": [eol], "postprocess": ([ws, tok]) => tok},
    {"name": "indent", "symbols": [indent], "postprocess": ([tok]) => tok},
    {"name": "dedent", "symbols": [dedent], "postprocess": ([tok]) => tok},
    {"name": "space", "symbols": [space], "postprocess": ([tok]) => tok.value},
    {"name": "__$ebnf$1", "symbols": [space]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", space], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess":  ([tokens]) => {
        	let spaces = '';
        	for (const i of tokens){
        		spaces += ' ';
        	}
        	return spaces;
        } },
    {"name": "_", "symbols": ["_", "space"], "postprocess":  ([e]) => {
        	return e ? e + ' ': null;
        } },
    {"name": "_", "symbols": [], "postprocess": () => null},
    {"name": "flowToBlockScope", "symbols": ["blockNestedScope"], "postprocess": id},
    {"name": "blockNestedScope", "symbols": ["pushScope", "blockScope", "popScope"], "postprocess":  ([push, scope]) => {
        return scope
        } },
    {"name": "blockScope", "symbols": ["blockMapping"], "postprocess": id},
    {"name": "blockScope", "symbols": ["blockSequence"], "postprocess": id},
    {"name": "blockScope", "symbols": ["sol", "statement"], "postprocess": second},
    {"name": "blockMapping$ebnf$1", "symbols": []},
    {"name": "blockMapping$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "blockMapping$ebnf$1$subexpression$1$ebnf$1", "symbols": ["blockMapping$ebnf$1$subexpression$1$ebnf$1", "lineBreak"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "blockMapping$ebnf$1$subexpression$1", "symbols": ["blockMapping$ebnf$1$subexpression$1$ebnf$1", "sol", "kvPair"]},
    {"name": "blockMapping$ebnf$1", "symbols": ["blockMapping$ebnf$1", "blockMapping$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "blockMapping", "symbols": ["sol", "kvPair", "blockMapping$ebnf$1"], "postprocess":  ([sol, head, tail]) => {
        	if (tail && tail.length){
        		return addPairToMap([head, tail.map(([br, sol, i]: any) => i)]);
        	}
        		return createMap([[head]]);
        } },
    {"name": "blockSequence$ebnf$1", "symbols": []},
    {"name": "blockSequence$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "blockSequence$ebnf$1$subexpression$1$ebnf$1", "symbols": ["blockSequence$ebnf$1$subexpression$1$ebnf$1", "lineBreak"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "blockSequence$ebnf$1$subexpression$1", "symbols": ["blockSequence$ebnf$1$subexpression$1$ebnf$1", "sol", "blockSequenceItem"]},
    {"name": "blockSequence$ebnf$1", "symbols": ["blockSequence$ebnf$1", "blockSequence$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "blockSequence", "symbols": ["sol", "blockSequenceItem", "blockSequence$ebnf$1"], "postprocess":  ([sol, head, tail]) => {
        	if (tail && tail.length){
        		return appendToSequence([head, tail.map(([br, sol, i]: any) => i)]);
        	}
        		return createBlockSequence([[head]]);
        } },
    {"name": "rhsNode", "symbols": ["statement"], "postprocess": id},
    {"name": "rhsNode", "symbols": ["bullet", "rhsNode"], "postprocess": second},
    {"name": "rhsNode$subexpression$1", "symbols": ["statement"]},
    {"name": "rhsNode$subexpression$1", "symbols": ["kvPair"]},
    {"name": "rhsNode$subexpression$2$ebnf$1", "symbols": ["blockSequenceItem"]},
    {"name": "rhsNode$subexpression$2$ebnf$1", "symbols": ["rhsNode$subexpression$2$ebnf$1", "blockSequenceItem"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "rhsNode$subexpression$2", "symbols": ["indent", "rhsNode$subexpression$2$ebnf$1", "dedent"]},
    {"name": "rhsNode", "symbols": ["bullet", "rhsNode$subexpression$1", "rhsNode$subexpression$2"], "postprocess":  ([key, firstItem, nested]) => {
        	console.log('bs <= bs', firstItem);
        	if (nested){
        		const [indent, tail] = nested;
        			return createBlockSequence([firstItem, ...tail]);
        	}
        	return createBlockSequence([firstItem]);
        } },
    {"name": "rhsNode$ebnf$1", "symbols": ["kvPair"]},
    {"name": "rhsNode$ebnf$1", "symbols": ["rhsNode$ebnf$1", "kvPair"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "rhsNode", "symbols": ["kvPair", "pushScope", "rhsNode$ebnf$1"], "postprocess":  ([head, indent, ...tail]) => {
        	console.log('bs <= bm');
        	return createMap([head, ...tail]);
        } },
    {"name": "statement", "symbols": ["scalar", "endLine"], "postprocess": first},
    {"name": "kvPair", "symbols": ["blockKey", "blockNestedScope"], "postprocess":  ([key, scope]) => {
        	console.log('k: block', key[0], scope);
        	return [key, scope];
        } },
    {"name": "kvPair", "symbols": ["blockKey", "__", "scalar", "endLine"], "postprocess":  ([key, sep, scalar]) => {
        	console.log('k: v', [key[0], scalar[0]]);
        	return [key, scalar]
        } },
    {"name": "kvPair", "symbols": ["blockKey", "nullOrNestedSequence"], "postprocess":  ([key, nullOrNestedSequence], ref) => {
        	return [key, nullOrNestedSequence]
        } },
    {"name": "kvPair", "symbols": ["blockKey", "__", "blockToFlowScope", "endLine"], "postprocess":  ([key, sep, flow]) => {
                console.log('k: {}', key[0], flow);
        	return [key, flow]
        } },
    {"name": "kvPair", "symbols": ["blockKey", "__", "blockToFlowSequence", "endLine"], "postprocess":  ([key, sep, flow]) => {
                console.log('k: <= []', key[0], flow);
        	return [key, flow]
        } },
    {"name": "lineBreak", "symbols": ["endLine"], "postprocess": nuller},
    {"name": "lineBreak", "symbols": ["comment"], "postprocess": nuller},
    {"name": "nullOrNestedSequence", "symbols": ["nullOrNestedSequence", "sol", "blockSequenceItem"], "postprocess":  ([list, sol, item], ref) => {
        		const [ v, ctx ] = list;
        		if (ctx.isIterable){
        			return appendToSequence([list, item]);
        		} else if (item) {
        			return createBlockSequence([[item]]);
        		}
        } },
    {"name": "nullOrNestedSequence", "symbols": ["endLine"], "postprocess":  ([endLine], ref, fail) => {
        	const nullValue = [null, {empty: true}]
        	return nullValue;
        } },
    {"name": "blockSequenceItem", "symbols": ["bullet", "statement"], "postprocess":  ([key, rhsNode]) => {
        	return rhsNode
        } },
    {"name": "blockSequenceItem", "symbols": ["comment"], "postprocess": id},
    {"name": "blockSequenceItem", "symbols": ["eol"], "postprocess": nuller},
    {"name": "blockKey", "symbols": ["scalar", {"literal":":"}], "postprocess": ([key, sep]) => key},
    {"name": "bullet", "symbols": [{"literal":"-"}, "space"], "postprocess": first},
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
    {"name": "flowMappingScope", "symbols": ["flowMappingScope$ebnf$1"], "postprocess": createMap},
    {"name": "flowPairConstructor", "symbols": ["flowKey", "_", "flowToBlockScope"], "postprocess":  ([key, sep, scope]) => {
        	console.log('flow => nestedBlockScope', key, scope);
        	return [key, scope];
        } },
    {"name": "flowPairConstructor", "symbols": ["flowKey", "_", "scalar"], "postprocess":  ([key, sep, scalar]) => {
        	console.log('flow pair', [key[0], scalar[0]]);
        	return [key, scalar]
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
    {"name": "flowSequenceScope", "symbols": ["flowSequenceScope$ebnf$1"], "postprocess": createFlowSequence},
    {"name": "sequenceToBlockMapping", "symbols": ["flowKey", "_", "flowToBlockScope"], "postprocess":  ([key, sep, scope]) => {
            console.log('sequenceToBlockMapping', key);
        return createMap([key, scope])
        } },
    {"name": "flowSequenceConstructor$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "_"]},
    {"name": "flowSequenceConstructor$ebnf$1", "symbols": ["flowSequenceConstructor$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "flowSequenceConstructor$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "flowSequenceConstructor$subexpression$1", "symbols": ["scalar"]},
    {"name": "flowSequenceConstructor$subexpression$1", "symbols": ["flowNestedScope"]},
    {"name": "flowSequenceConstructor$subexpression$1", "symbols": ["flowNestedSequence"]},
    {"name": "flowSequenceConstructor$subexpression$1", "symbols": ["sequenceToBlockMapping"]},
    {"name": "flowSequenceConstructor", "symbols": ["flowSequenceConstructor$ebnf$1", "flowSequenceConstructor$subexpression$1"], "postprocess":  ([key, sequenceStatement]) => {
                  return sequenceStatement
        } },
    {"name": "flowKey$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "_"]},
    {"name": "flowKey$ebnf$1", "symbols": ["flowKey$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "flowKey$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "flowKey", "symbols": ["flowKey$ebnf$1", "scalar", "_", {"literal":":"}], "postprocess": ([w, key, w2, sep]) => key},
    {"name": "start", "symbols": ["sof", "blockScope", "eof"], "postprocess": ([sof, scope]) => scope}
  ],
  ParserStart: "start",
};

export default grammar;
