@preprocessor typescript
@lexer lexer

@include "./statement.ne"
@include "./uri.ne"
@include "./number.ne"
@include "./string.ne"
@include "./formatting.ne"

@{%
import { clone, mapToObject } from 'typed-json-transform';
import { lexer, any, indent, dedent, eol, sol, eof, sof, startRule, space } from './lexer';
import { expectedScopeOperator } from './post/errors';
import {
  nuller, addPair, addPairToMap,
  join, singleWord, unaryOperate, operate,
	fork
} from './post/ast';
%}

start
	-> sof rootScope eof {% ([sof, scope]) => scope %}

rootScope
	-> map {% id %}

scope
	-> map {% id %}

map
	-> map mapPairConstructor {% addPairToMap %}
	| mapPairConstructor {% id %}

mapPairConstructor
	# nested map
	-> key pushScope scope popScope
  		{% ([key, b, s]) => {
			return [key, s]
		} %}

	# explicit map pair, rhs is a map
	| key space "{" scope "}" endLine
  		{% ([key, bracket, scope]) => {
			  return [key, scope]
			} %}

	# default map pair, rhs is a statement
	| key space statement mapTerminator
  		{% ([key, s, val]) => [key, val] %}

	| sol eol {% nuller %}
	| sol comment {% nuller %}
	# error cases
	| literal pushScope scope
  		{% expectedScopeOperator %}

mapTerminator
	-> ("," | endLine) {% id %}

list
	-> list listConstructor
		{% ([array, item]) => {
			if (item){
				return [...array, item];
			}
			return array;
		} %}
	| listConstructor
		{% ([item]) => {
			return [ item ];
		} %}

listConstructor
	-> "-" space statement endLine
  		{% ([key, scope]) => {
			  return scope
		} %}

	| key space "[" scope "]" endLine
  		{% ([key, space, bracket, scope]) => {
				return scope
			} %}

	| sol eol {% nuller %}
	| sol comment {% nuller %}

listTerminator
	-> ("," | endLine) {% id %}

multilineString
	-> stringLine stringLine:* {% ([head, tail]) => {
		const [startIndent, mls] = head;
		if (tail.length){
			const res = tail.map(([indent, line]: any) => {
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
	} %}

stringLine
	-> ("|" | "<") indent multilineString dedent
		{% ([indent, mls]) => {
			return [indent.indent, mls];
		} %}
	| sol _escapedString:? eol
		{% ([sol, string]) => {
			return [sol.indent, string];
		} %}


pushScope
	-> space indent
		{% ([space]) => {} %}
	| pushScope {% nuller %}

# Map
key
	-> (sol | literal) literal ":" {% ([_, k]) => k %}

