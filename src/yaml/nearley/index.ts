// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }

import { clone, mapToObject } from 'typed-json-transform';
import { lexer, any, indent, dedent, eol, sol, eof, sof, startRule, space } from './lexer';
import { expectedScopeOperator } from './post/errors';
import {
	addPairToMap, addListToMap, pairToMap, listToMap,
	kvcToPair, statementToPair, nuller,
	join, fork, operate, unaryOperate, singleWord } from './post/ast';

export interface Token { value: any; [key: string]: any };

export interface Lexer {
  reset: (chunk: string, info: any) => void;
  next: () => Token | undefined;
  save: () => any;
  formatError: (token: Token) => string;
  has: (tokenType: string) => boolean
};

export interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any
};

export type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

export var Lexer: Lexer | undefined = lexer;

export var ParserRules: NearleyRule[] = [
    {"name": "statement", "symbols": ["concat"], "postprocess": id},
    {"name": "concat", "symbols": ["concat", "space", "boolean"], "postprocess": fork},
    {"name": "concat", "symbols": ["boolean"], "postprocess": id},
    {"name": "boolean$subexpression$1", "symbols": [{"literal":"n"}]},
    {"name": "boolean$subexpression$1", "symbols": [{"literal":"|"}]},
    {"name": "boolean", "symbols": ["boolean", "space", "boolean$subexpression$1", "space", "add"], "postprocess": operate},
    {"name": "boolean", "symbols": ["add"], "postprocess": id},
    {"name": "add$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "add$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "add", "symbols": ["add", "space", "add$subexpression$1", "space", "multiply"], "postprocess": operate},
    {"name": "add", "symbols": ["multiply"], "postprocess": id},
    {"name": "multiply$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "multiply$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "multiply", "symbols": ["multiply", "space", "multiply$subexpression$1", "space", "unaryPrefix"], "postprocess": operate},
    {"name": "multiply", "symbols": ["unaryPrefix"], "postprocess": id},
    {"name": "unaryPrefix", "symbols": [{"literal":"+"}, "group"], "postprocess": unaryOperate},
    {"name": "unaryPrefix", "symbols": [{"literal":"-"}, "group"], "postprocess": unaryOperate},
    {"name": "unaryPrefix", "symbols": [{"literal":"!"}, "group"], "postprocess": unaryOperate},
    {"name": "unaryPrefix", "symbols": ["group"], "postprocess": id},
    {"name": "group", "symbols": [{"literal":"("}, "concat", {"literal":")"}], "postprocess": ([_, g]) => g},
    {"name": "group", "symbols": ["pair"], "postprocess": id},
    {"name": "pair", "symbols": ["context", "literal"], "postprocess": ([c, [r, r_]]) => [r, {...r_, ...c}]},
    {"name": "pair", "symbols": ["literal"], "postprocess": id},
    {"name": "literal", "symbols": ["string"], "postprocess": ([v]) => [v, {string: true}]},
    {"name": "literal", "symbols": ["singleWord"], "postprocess": ([v]) => [v, {string: true}]},
    {"name": "literal", "symbols": ["uri"], "postprocess": ([v]) => [v, {uri: true}]},
    {"name": "literal", "symbols": ["number"], "postprocess": ([v]) => [v, {number: true}]},
    {"name": "uri", "symbols": ["url"], "postprocess": id},
    {"name": "uri", "symbols": ["authority"], "postprocess": id},
    {"name": "url", "symbols": ["urlDomainScheme", "authority"], "postprocess": join},
    {"name": "url", "symbols": ["urlScheme", "uriPathComponent"], "postprocess": join},
    {"name": "url", "symbols": ["urlScheme", "urlPath"], "postprocess": join},
    {"name": "urlDomainScheme", "symbols": ["urlScheme", {"literal":"/"}, {"literal":"/"}], "postprocess": join},
    {"name": "urlSchemes", "symbols": ["urlSchemes", "urlScheme"], "postprocess": join},
    {"name": "urlSchemes", "symbols": ["urlScheme"], "postprocess": id},
    {"name": "urlScheme", "symbols": ["domainComponent", {"literal":":"}], "postprocess": join},
    {"name": "authority", "symbols": ["urlCredentials", {"literal":"@"}, "_authority"], "postprocess": join},
    {"name": "authority", "symbols": ["_authority"], "postprocess": join},
    {"name": "_authority$ebnf$1", "symbols": ["uriPathComponent"], "postprocess": id},
    {"name": "_authority$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "_authority$ebnf$2", "symbols": ["uriQueries"], "postprocess": id},
    {"name": "_authority$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "_authority$ebnf$3", "symbols": ["uriFragment"], "postprocess": id},
    {"name": "_authority$ebnf$3", "symbols": [], "postprocess": () => null},
    {"name": "_authority", "symbols": ["uriDomainComponent", "_authority$ebnf$1", "_authority$ebnf$2", "_authority$ebnf$3"], "postprocess": join},
    {"name": "uriQueries", "symbols": ["uriQueries", "uriQuery"], "postprocess": join},
    {"name": "uriQueries", "symbols": ["uriQuery"], "postprocess": id},
    {"name": "uriPathComponent", "symbols": [{"literal":"/"}, "urlPath"], "postprocess": join},
    {"name": "uriPathComponent", "symbols": [{"literal":"/"}], "postprocess": ([tok]) => tok.value},
    {"name": "urlCredentials", "symbols": ["urlCredentials", {"literal":":"}, "password"], "postprocess": join},
    {"name": "urlCredentials", "symbols": ["email"], "postprocess": id},
    {"name": "urlCredentials", "symbols": ["subdomain"], "postprocess": id},
    {"name": "urlPath", "symbols": ["urlPath", {"literal":"/"}, "urlPathName"], "postprocess": join},
    {"name": "urlPath", "symbols": ["urlPath", {"literal":"/"}], "postprocess": join},
    {"name": "urlPath", "symbols": ["urlPathName"], "postprocess": id},
    {"name": "urlPathName", "symbols": ["urlPathName", {"literal":"."}, "urlPathWord"], "postprocess": join},
    {"name": "urlPathName", "symbols": ["urlPathWord"], "postprocess": id},
    {"name": "urlPathWord", "symbols": ["urlPathWord", "urlPathChar"], "postprocess": join},
    {"name": "urlPathWord", "symbols": ["urlPathChar"], "postprocess": id},
    {"name": "urlPathChar", "symbols": [/[^ ^\/^.^?^;]/], "postprocess": ([tok]) => tok.value},
    {"name": "filePath", "symbols": ["filePath", {"literal":"/"}, "fileName"], "postprocess": join},
    {"name": "filePath", "symbols": ["fileName"], "postprocess": id},
    {"name": "fileName", "symbols": ["fileName", {"literal":"."}, "fileWord"], "postprocess": join},
    {"name": "fileName", "symbols": ["fileWord"], "postprocess": id},
    {"name": "fileWord", "symbols": ["fileWord", "fileChar"], "postprocess": join},
    {"name": "fileWord", "symbols": ["fileChar"], "postprocess": id},
    {"name": "fileChar", "symbols": [/[^ ^\/^.]/], "postprocess": ([tok]) => tok.value},
    {"name": "password", "symbols": ["urlSafePlusEncoded"], "postprocess": join},
    {"name": "email", "symbols": ["subdomain", {"literal":"@"}, "domain"], "postprocess": join},
    {"name": "uriDomainComponent", "symbols": ["uriDomainComponent", "uriPortComponent"], "postprocess": join},
    {"name": "uriDomainComponent", "symbols": ["domain"], "postprocess": join},
    {"name": "uriDomainComponent", "symbols": [{"literal":"["}, "ipv6", {"literal":"]"}], "postprocess": join},
    {"name": "uriDomainComponent", "symbols": ["ipv4"], "postprocess": id},
    {"name": "ipv6$macrocall$2", "symbols": ["ipv6Group"]},
    {"name": "ipv6$macrocall$1", "symbols": ["ipv6$macrocall$2", "ipv6$macrocall$2", "ipv6$macrocall$2", "ipv6$macrocall$2", "ipv6$macrocall$2", "ipv6$macrocall$2", "ipv6$macrocall$2"], "postprocess": join},
    {"name": "ipv6", "symbols": ["ipv6$macrocall$1", "ipv6Number"], "postprocess": join},
    {"name": "ipv6$macrocall$4", "symbols": ["ipv6Group"]},
    {"name": "ipv6$macrocall$3", "symbols": ["ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4"], "postprocess": join},
    {"name": "ipv6$macrocall$3", "symbols": ["ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4"], "postprocess": join},
    {"name": "ipv6$macrocall$3", "symbols": ["ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4"], "postprocess": join},
    {"name": "ipv6$macrocall$3", "symbols": ["ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4"], "postprocess": join},
    {"name": "ipv6$macrocall$3", "symbols": ["ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4"], "postprocess": join},
    {"name": "ipv6$macrocall$3", "symbols": ["ipv6$macrocall$4", "ipv6$macrocall$4", "ipv6$macrocall$4"], "postprocess": join},
    {"name": "ipv6$macrocall$3", "symbols": ["ipv6$macrocall$4", "ipv6$macrocall$4"], "postprocess": join},
    {"name": "ipv6$macrocall$3", "symbols": ["ipv6$macrocall$4"], "postprocess": join},
    {"name": "ipv6", "symbols": ["ipv6$macrocall$3", {"literal":":"}, "ipv6Number"], "postprocess": join},
    {"name": "ipv6Group", "symbols": ["ipv6Number", {"literal":":"}], "postprocess": join},
    {"name": "ipv6Number$macrocall$2", "symbols": ["hexDigit"]},
    {"name": "ipv6Number$macrocall$1", "symbols": ["ipv6Number$macrocall$2", "ipv6Number$macrocall$2", "ipv6Number$macrocall$2", "ipv6Number$macrocall$2"], "postprocess": join},
    {"name": "ipv6Number$macrocall$1", "symbols": ["ipv6Number$macrocall$2", "ipv6Number$macrocall$2", "ipv6Number$macrocall$2"], "postprocess": join},
    {"name": "ipv6Number$macrocall$1", "symbols": ["ipv6Number$macrocall$2", "ipv6Number$macrocall$2"], "postprocess": join},
    {"name": "ipv6Number$macrocall$1", "symbols": ["ipv6Number$macrocall$2"], "postprocess": join},
    {"name": "ipv6Number", "symbols": ["ipv6Number$macrocall$1"]},
    {"name": "ipv4", "symbols": ["ipv4Group", {"literal":"."}, "ipv4Group", {"literal":"."}, "ipv4Group", {"literal":"."}, "ipv4Group"]},
    {"name": "ipv4Group", "symbols": ["d2", "d5", "d0_5"], "postprocess": join},
    {"name": "ipv4Group", "symbols": ["d2", "d0_4", "d0_9"], "postprocess": join},
    {"name": "ipv4Group", "symbols": ["d1", "d0_9", "d0_9"], "postprocess": join},
    {"name": "ipv4Group", "symbols": ["d0_9", "d0_9"], "postprocess": join},
    {"name": "ipv4Group", "symbols": ["d0_9"], "postprocess": id},
    {"name": "d1", "symbols": [{"literal":"1"}], "postprocess": ([tok]) => tok},
    {"name": "d2", "symbols": [{"literal":"2"}], "postprocess": ([tok]) => tok},
    {"name": "d5", "symbols": [{"literal":"5"}], "postprocess": ([tok]) => tok},
    {"name": "d0_4", "symbols": [/[0-4]/], "postprocess": ([tok]) => tok},
    {"name": "d0_5", "symbols": [/[0-5]/], "postprocess": ([tok]) => tok},
    {"name": "d0_9", "symbols": [/[0-9]/], "postprocess": ([tok]) => tok},
    {"name": "domain", "symbols": ["subdomain", {"literal":"."}, "domainComponent"], "postprocess": join},
    {"name": "uriPortComponent", "symbols": [{"literal":":"}, "number"], "postprocess": join},
    {"name": "subdomain", "symbols": ["domainComponent", {"literal":"."}, "subdomain"], "postprocess": join},
    {"name": "subdomain", "symbols": ["domainComponent"], "postprocess": id},
    {"name": "uriQuery", "symbols": [{"literal":"?"}, "queryList"], "postprocess": join},
    {"name": "queryList", "symbols": ["queryList", {"literal":"&"}, "queryFragment"], "postprocess": join},
    {"name": "queryList", "symbols": ["queryFragment"], "postprocess": id},
    {"name": "queryFragment", "symbols": ["queryFragment", {"literal":"="}, "urlSafePlusEncoded"], "postprocess": join},
    {"name": "queryFragment", "symbols": ["urlSafePlusEncoded"], "postprocess": id},
    {"name": "uriFragment", "symbols": [{"literal":"#"}, "queryList"], "postprocess": join},
    {"name": "domainComponent$ebnf$1", "symbols": []},
    {"name": "domainComponent$ebnf$1", "symbols": ["domainComponent$ebnf$1", /[a-zA-Z0-9\-]/], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "domainComponent", "symbols": [/[a-zA-Z]/, "domainComponent$ebnf$1"], "postprocess": singleWord},
    {"name": "number", "symbols": ["_number"], "postprocess":  ([n]) => {
        console.log('number', n); return parseFloat(n) } },
    {"name": "_number", "symbols": ["_float", {"literal":"e"}, "digit"], "postprocess": join},
    {"name": "_number", "symbols": ["_float"], "postprocess": id},
    {"name": "_float", "symbols": ["digit", {"literal":"."}, "digit"], "postprocess": join},
    {"name": "_float", "symbols": ["digit"], "postprocess": id},
    {"name": "digit", "symbols": ["digit", /[0-9]/], "postprocess": join},
    {"name": "digit", "symbols": [/[0-9]/], "postprocess": ([tok]) => tok.text},
    {"name": "urlSafePlusEncoded", "symbols": ["urlSafePlusEncoded", "urlSafePlusEncodedChars"], "postprocess": join},
    {"name": "urlSafePlusEncoded", "symbols": ["urlSafePlusEncodedChars"], "postprocess": id},
    {"name": "urlSafePlusEncodedChars", "symbols": [{"literal":"%"}, "hexDigit", "hexDigit"], "postprocess": join},
    {"name": "urlSafePlusEncodedChars", "symbols": [{"literal":"&"}, {"literal":"a"}, {"literal":"m"}, {"literal":"p"}, {"literal":";"}], "postprocess": join},
    {"name": "urlSafePlusEncodedChars", "symbols": ["urlSafeChar"], "postprocess": id},
    {"name": "singleWord$ebnf$1", "symbols": []},
    {"name": "singleWord$ebnf$1", "symbols": ["singleWord$ebnf$1", /[a-zA-Z0-9$_]/], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "singleWord", "symbols": [/[a-zA-Z$_]/, "singleWord$ebnf$1"], "postprocess": singleWord},
    {"name": "word", "symbols": ["word", "wordSafeChar"], "postprocess": join},
    {"name": "word", "symbols": ["wordStartChar"], "postprocess": id},
    {"name": "wordSafeChar", "symbols": ["wordStartChar"], "postprocess": id},
    {"name": "wordSafeChar", "symbols": [/[0-9]/], "postprocess": ([tok]) => tok.value},
    {"name": "wordStartChar", "symbols": [/[a-zA-Z$_]/], "postprocess": ([tok]) => tok.value},
    {"name": "string$ebnf$1", "symbols": [{"literal":"`"}], "postprocess": id},
    {"name": "string$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "string", "symbols": [{"literal":"`"}, "_escapedString", "string$ebnf$1"], "postprocess": ([quote, string]) => string},
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
    {"name": "nestedScope", "symbols": ["pushScope", "scope", "popScope"], "postprocess": ([push, scope]) => scope},
    {"name": "pushScope$subexpression$1", "symbols": ["inlineComment"]},
    {"name": "pushScope$subexpression$1", "symbols": ["eol"]},
    {"name": "pushScope", "symbols": ["pushScope$subexpression$1", "indent"], "postprocess": id},
    {"name": "popScope", "symbols": ["dedent"], "postprocess": id},
    {"name": "endLine", "symbols": ["inlineComment"], "postprocess": id},
    {"name": "endLine", "symbols": ["eol"], "postprocess": id},
    {"name": "inlineComment", "symbols": ["space", "comment"], "postprocess": id},
    {"name": "comment$ebnf$1", "symbols": ["_escapedString"], "postprocess": id},
    {"name": "comment$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "comment", "symbols": [{"literal":"#"}, "comment$ebnf$1", eol], "postprocess": ([operator, comment]) => (comment)},
    {"name": "sof", "symbols": [sof], "postprocess": ([tok]) => tok.value},
    {"name": "eof", "symbols": [eof], "postprocess": ([tok]) => tok.value},
    {"name": "sol", "symbols": [sol], "postprocess": ([tok]) => tok},
    {"name": "eol", "symbols": ["_", eol], "postprocess": ([ws, tok]) => tok},
    {"name": "indent", "symbols": [indent], "postprocess": ([tok]) => tok},
    {"name": "dedent", "symbols": [dedent], "postprocess": ([tok]) => tok},
    {"name": "space", "symbols": [space], "postprocess": ([tok]) => tok.value},
    {"name": "_", "symbols": ["_", "space"], "postprocess":  ([e]) => {
        	return e ? e + ' ': '';
        } },
    {"name": "_", "symbols": [], "postprocess": () => ''},
    {"name": "start", "symbols": ["sof", "rootScope", "eof"], "postprocess": ([sof, scope]) => scope},
    {"name": "rootScope", "symbols": ["map"], "postprocess": id},
    {"name": "scope", "symbols": ["map"], "postprocess": id},
    {"name": "map", "symbols": ["map", "mapPairConstructor"], "postprocess": addPairToMap},
    {"name": "map", "symbols": ["map", "mapList"], "postprocess": addListToMap},
    {"name": "map", "symbols": ["mapPairConstructor"], "postprocess": pairToMap},
    {"name": "map", "symbols": ["mapList"], "postprocess": listToMap},
    {"name": "mapList$ebnf$1", "symbols": ["context"], "postprocess": id},
    {"name": "mapList$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "mapList", "symbols": ["sol", "mapList$ebnf$1", {"literal":"-<"}, "endLine", "list", {"literal":"/-<"}], "postprocess": ([prefix, context, rule, dedent, list]) => context ? [list, context] : [ list ]},
    {"name": "mapPairConstructor", "symbols": ["key", "pushTypedScope", "scope", "popScope"], "postprocess":  ([key, c, s]) => {
        	return kvcToPair(key, s, c)
        } },
    {"name": "mapPairConstructor", "symbols": ["key", "inlineContext", {"literal":"{"}, "scope", {"literal":"}"}, "endLine"], "postprocess":  ([key, context, bracket, scope]) => {
          return kvcToPair(key, scope, context)
        } },
    {"name": "mapPairConstructor", "symbols": ["key", "inlineContext", "statement", "mapTerminator"], "postprocess": ([key, c, s]) => kvcToPair(key, s, c)},
    {"name": "mapPairConstructor$subexpression$1", "symbols": ["sol"]},
    {"name": "mapPairConstructor$subexpression$1", "symbols": ["space"]},
    {"name": "mapPairConstructor", "symbols": ["mapPairConstructor$subexpression$1", "statement", "mapTerminator"], "postprocess": ([_, s]) => statementToPair(s)},
    {"name": "mapPairConstructor", "symbols": ["sol", "eol"], "postprocess": nuller},
    {"name": "mapPairConstructor", "symbols": ["sol", "comment"], "postprocess": nuller},
    {"name": "mapPairConstructor", "symbols": ["literal", "pushScope", "scope"], "postprocess": expectedScopeOperator},
    {"name": "inlineContext", "symbols": ["space", "context"], "postprocess":  ([_, d]) => {
        	return d;
        } },
    {"name": "inlineContext", "symbols": ["space"], "postprocess": nuller},
    {"name": "mapTerminator$subexpression$1", "symbols": [{"literal":" "}]},
    {"name": "mapTerminator$subexpression$1", "symbols": [{"literal":","}]},
    {"name": "mapTerminator$subexpression$1", "symbols": ["endLine"]},
    {"name": "mapTerminator", "symbols": ["mapTerminator$subexpression$1"], "postprocess": id},
    {"name": "listTerminator$subexpression$1", "symbols": [{"literal":","}]},
    {"name": "listTerminator$subexpression$1", "symbols": ["endLine"]},
    {"name": "listTerminator", "symbols": ["listTerminator$subexpression$1"], "postprocess": id},
    {"name": "list", "symbols": ["list", "listConstructor"], "postprocess":  ([array, item]) => {
        	if (item){
        		return [...array, item];
        	}
        	return array;
        } },
    {"name": "list", "symbols": ["listConstructor"], "postprocess":  ([item]) => {
        	return [ item ];
        } },
    {"name": "listConstructor", "symbols": ["key", "pushTypedScope", "scope", "popScope"], "postprocess":  ([key, context, scope]) => {
        	  return scope
        } },
    {"name": "listConstructor$subexpression$1$subexpression$1", "symbols": ["space", "context"]},
    {"name": "listConstructor$subexpression$1", "symbols": ["listConstructor$subexpression$1$subexpression$1"]},
    {"name": "listConstructor$subexpression$1", "symbols": ["space"]},
    {"name": "listConstructor", "symbols": ["key", "listConstructor$subexpression$1", {"literal":"{"}, "scope", {"literal":"}"}, "endLine"], "postprocess":  ([key, context, bracket, scope]) => {
        	return scope
        } },
    {"name": "listConstructor$subexpression$2$subexpression$1", "symbols": ["space", "context"]},
    {"name": "listConstructor$subexpression$2", "symbols": ["listConstructor$subexpression$2$subexpression$1"]},
    {"name": "listConstructor$subexpression$2", "symbols": ["space"]},
    {"name": "listConstructor", "symbols": ["key", "listConstructor$subexpression$2", "statement", "listTerminator"], "postprocess":  ([key, context, statement]) => {
        	return statement
        } },
    {"name": "listConstructor$subexpression$3", "symbols": ["sol"]},
    {"name": "listConstructor$subexpression$3", "symbols": ["space"]},
    {"name": "listConstructor$ebnf$1$subexpression$1", "symbols": ["context"]},
    {"name": "listConstructor$ebnf$1", "symbols": ["listConstructor$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "listConstructor$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "listConstructor", "symbols": ["listConstructor$subexpression$3", "listConstructor$ebnf$1", "statement", "listTerminator"], "postprocess":  ([prefix, c_, [r, r_]]) => {
        	return [r, {...r_, ...c_}];
        }},
    {"name": "listConstructor", "symbols": ["sol", "eol"], "postprocess": nuller},
    {"name": "listConstructor", "symbols": ["sol", "comment"], "postprocess": nuller},
    {"name": "multilineString$ebnf$1", "symbols": []},
    {"name": "multilineString$ebnf$1", "symbols": ["multilineString$ebnf$1", "stringLine"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "multilineString", "symbols": ["stringLine", "multilineString$ebnf$1"], "postprocess":  ([head, tail]) => {
        	const [startIndent, mls] = head;
        	if (tail.length){
        		const res = tail.map(([indent, line]) => {
        				let margin = '';
        				if (indent > startIndent){
        					for (let i = 0; i < indent - startIndent; i++){
        						margin = margin + ' ';
        					}
        				}
        				if (line){
        					return margin + line;
        				}
        				return margin;
        		});
        		return [mls, ...res].join('\n');
        	}
        	return mls;
        } },
    {"name": "stringLine", "symbols": ["indent", "multilineString", "dedent"], "postprocess":  ([indent, mls]) => {
        	return [indent.indent, mls];
        } },
    {"name": "stringLine$ebnf$1", "symbols": ["_escapedString"], "postprocess": id},
    {"name": "stringLine$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "stringLine", "symbols": ["sol", "stringLine$ebnf$1", "eol"], "postprocess":  ([sol, string]) => {
        	return [sol.indent, string];
        } },
    {"name": "pushTypedScope", "symbols": ["space", "context", "indent"], "postprocess": ([space, context]) => context},
    {"name": "pushTypedScope", "symbols": ["pushScope"], "postprocess": nuller},
    {"name": "context", "symbols": ["context", "constraint"], "postprocess": addPairToMap},
    {"name": "context", "symbols": ["constraint"], "postprocess": pairToMap},
    {"name": "constraint$subexpression$1", "symbols": ["space"]},
    {"name": "constraint$subexpression$1", "symbols": ["endLine"]},
    {"name": "constraint", "symbols": [{"literal":"\\"}, {"literal":"{"}, "nestedScope", "sol", {"literal":"}"}, "constraint$subexpression$1"], "postprocess": ([directive, bracket, scope]) => scope},
    {"name": "constraint$subexpression$2", "symbols": ["space"]},
    {"name": "constraint$subexpression$2", "symbols": ["endLine"]},
    {"name": "constraint", "symbols": [{"literal":"\\"}, "literal", {"literal":"{"}, "map", {"literal":"}"}, "constraint$subexpression$2"], "postprocess":  ([directive, key, bracket, map]) => {
        	return [key, map]
        } },
    {"name": "constraint$subexpression$3", "symbols": ["space"]},
    {"name": "constraint$subexpression$3", "symbols": ["endLine"]},
    {"name": "constraint", "symbols": [{"literal":"\\"}, "literal", "constraint$subexpression$3"], "postprocess": ([directive, property]) => statementToPair(property)},
    {"name": "key$subexpression$1", "symbols": ["sol"]},
    {"name": "key$subexpression$1", "symbols": ["literal"]},
    {"name": "key", "symbols": ["key$subexpression$1", "literal", {"literal":":"}], "postprocess": ([_, k]) => k}
];

export var ParserStart: string = "start";
