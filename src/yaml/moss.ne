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
	addPairToMap, addListToMap, pairToMap, listToMap, 
	kvcToPair, statementToPair, nuller,
	join, fork, operate, unaryOperate, singleWord } from './post/ast';
%}

start
	-> sof rootScope eof {% ([sof, scope]) => scope %}
	
rootScope
	-> map {% id %}

scope
	-> map {% id %}

map
	-> map mapPairConstructor {% addPairToMap %}
	| map mapList {% addListToMap %}
	| mapPairConstructor {% pairToMap %}
	| mapList {% listToMap %}

mapList
	-> sol context:? "-<" endLine list "\/-<" {% ([prefix, context, rule, dedent, list]) => context ? [list, context] : [ list ] %}
		
mapPairConstructor
	# nested explicitly declared list
	-> key inlineContext ("-<" pushScope) list "\/-<" popScope
  		{% ([key, context, mode, list]) => {
			if (context){
				return kvcToPair(key, list, context);
			}
			return kvcToPair(key, list, {list: true});
		} %}

	# nested map
	| key pushTypedScope scope popScope
  		{% ([key, c, s]) => {
			return kvcToPair(key, s, c)
		} %}
	
	# explicit map pair, rhs is a map
	| key inlineContext "{" scope "}" endLine
  		{% ([key, context, bracket, scope]) => {
			  return kvcToPair(key, scope, context)
			} %}
			
	# default map pair, rhs is a statement
	| key inlineContext statement mapTerminator
  		{% ([key, c, s]) => kvcToPair(key, s, c) %}

	# default simple value
	| (sol | space) statement mapTerminator
  		{% ([_, s]) => statementToPair(s) %}

	| sol eol {% nuller %}
	| sol comment {% nuller %}
	# error cases
	| literal pushScope scope
  		{% expectedScopeOperator %}

inlineContext
	-> space context {% ([_, d]) => {
		return d;
	} %}
	| space {% nuller %}

mapTerminator
	-> (" " | "," | endLine) {% id %}

listTerminator
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
	# nested constrained scope
	-> key pushTypedScope scope popScope
  		{% ([key, context, scope]) => {
			  return scope		
		} %}
		
	| key ((space context) | space) "{" scope "}" endLine
  		{% ([key, context, bracket, scope]) => {
				return scope
			} %}
			
	# default map pair, rhs is a statement
	| key ((space context) | space) statement listTerminator
  		{% ([key, context, statement]) => {
				return statement
			} %}
	
	# default simple value
	| (sol | space) (context):? statement listTerminator
  		{% ([prefix, c_, [r, r_]]) => {
			return [r, {...r_, ...c_}];
		}%}
		
	| sol eol {% nuller %}
	| sol comment {% nuller %}

multilineString
	-> stringLine stringLine:* {% ([head, tail]) => {
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
	} %}

stringLine
	-> indent multilineString dedent
		{% ([indent, mls]) => {
			return [indent.indent, mls];
		} %}
	| sol _escapedString:? eol
		{% ([sol, string]) => {
			return [sol.indent, string];
		} %}


pushTypedScope
	-> space context indent 
		{% ([space, context]) => context %}
	| pushScope {% nuller %}


context
	-> context constraint
		{% addPairToMap %}
	| constraint
		{% pairToMap %}

constraint
	-> "\\" "{" nestedScope sol "}" (space | endLine)
		{% ([directive, bracket, scope]) => scope %}
	| "\\" literal "{" map "}" (space | endLine)
		{% ([directive, key, bracket, map]) => {
			return [key, map] 
		} %}
	| "\\" literal (space | endLine)
		{% ([directive, property]) => statementToPair(property) %}

# Map
key
	-> (sol | space) keyExpression ":" {% ([_, k]) => k %}

keyExpression
	-> ( "=" | "+" | "|" | "&" | "^" | "-" ) space literal {% join %}
	| concat {% id %}