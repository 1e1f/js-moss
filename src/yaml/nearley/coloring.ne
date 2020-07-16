@preprocessor typescript
@lexer lexer
@include "./uri.ne"
@include "./types.ne"

@{%
import { lexer, any, indent, dedent, eol, sol, eof, sof, startRule, space } from './lexer';
import { expectedScopeOperator } from './post/errors';
import { concat, lhs, rhs, back, addPairToMap, reduce, optionalTail } from './post/reducers';
%}

start
	-> sof rootScope eof {% ([sof, scope]) => scope %}
	
rootScope
	-> map {% id %}
	| (sol eol "string") multilineString ("\/string") {% ([sol, scope]) => scope %}

scope
	-> map {% ([layer]) => layer.data %}

map
	-> map mapPairConstructor
		{% ([_layer, nextMatch]) => {
			const layer = {
				data: new Map(_layer.data),
				context: {}
			}
			if (nextMatch && (nextMatch[0] !== undefined)) {
				addPairToMap(nextMatch, layer.data)
			}
			return layer;
		} %}
	| map mapList {% ([_layer, list]) => {
			const layer = {
				data: new Map(_layer.data),
				context: {}
			}
			if (list && list.length) {
				for (let i = 0; i < list.length; i++){
					addPairToMap([i, list[i]], layer.data)
				}
			}
			return layer;
		} %}
	| mapPairConstructor
		{% ([initialMatch]) => {
			const layer = {
				data: new Map(),
				context: {}
			}
			if (initialMatch && (initialMatch[0] !== undefined)) {
				addPairToMap(initialMatch, layer.data)
			}
			return layer;
		} %}
	| mapList 
		{% ([list]) => {
			const layer = {
				data: new Map(),
				context: {}
			}
			if (list && list.length) {
				for (let i = 0; i < list.length; i++){
					addPairToMap([i, list[i]], layer.data)
				}
			}
			return layer;
		} %}

mapList 
	-> (sol "-<" endLine) list "\/-<" {% ([prefix, list]) => list %}
		
mapPairConstructor
	# nested explicitly declared list
	-> key ((space constraintMap) | space) ("-<" pushScope) list "\/-<" popScope
  		{% ([key, context, mode, scope]) => {
			if (context){
				return [key, scope, {multiLineString: true, ...context[1]}]
			} else {
			  return [key, scope, {multiLineString: true}]
			}
		} %}

	# multiline string
	| key ((space constraintMap) | space) (eol "text" indent) multilineString popScope "\/text"
  		{% ([key, context, mode, scope]) => {
			if (context){
				return [key, scope, {multiLineString: true, ...context[1]}]
			} else {
			  return [key, scope, {multiLineString: true}]
			}
		} %}

	# nested map
	| key pushTypedScope scope popScope
  		{% ([key, context, scope]) => {
			  return [key, scope]
		} %}
	
	# explicit map pair, rhs is a map
	| key ((space constraintMap) | space) "{" scope "}" endLine
  		{% ([key, context, bracket, scope]) => {
				return [key, scope]
			} %}
			
	# default map pair, rhs is a statement
	| key ((space constraintMap) | space) statement mapTerminator
  		{% ([key, context, statement]) => {
				console.log('pair', [key, statement])
				return [key, statement]
			} %}

	# default simple value
	| (sol | space) (constraintMap):? statement mapTerminator
  		{% ([prefix, constraintMap, statement]) => {
			return [statement, true]
		}%}

	| sol eol {% () => null %}
	| sol comment {% () => null %}
	# error cases
	| literal pushScope scope
  		{% expectedScopeOperator %}

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
		
	| key ((space constraintMap) | space) "{" scope "}" endLine
  		{% ([key, context, bracket, scope]) => {
				return scope
			} %}
			
	# default map pair, rhs is a statement
	| key ((space constraintMap) | space) statement listTerminator
  		{% ([key, context, statement]) => {
				return statement
			} %}
	
	# default simple value
	| (sol | space) (constraintMap):? statement listTerminator
  		{% ([prefix, constraintMap, statement]) => {
			return statement
		}%}
		
	| sol eol {% () => null %}
	| sol comment {% () => null %}

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


pushTypedScope ->
	space constraintMap indent 
		{% ([space, constraintMap]) => constraintMap %}
	| pushScope {% id %}


constraintMap
	-> constraintMap constraint
		{% ([map, nextMatch]) => {
			if (nextMatch) {
				addPairToMap(nextMatch, map);
			}
			return map;
		} %}
	| constraint
		{% ([initialMatch]) => {
			const map = new Map();
			if (initialMatch) {
				addPairToMap(initialMatch, map);
			}
			return map;
		} %}

constraint
	-> "@" "{" nestedScope sol "}" (space | endLine)
		{% ([directive, bracket, scope]) => scope %}
	| "@" literal "{" scope "}" (space | endLine)
		{% ([directive, literal, bracket, scope]) => [literal, scope] %}
	| "@" literal (space | endLine) {% ([directive, property]) => {
			return [property, true]
		}%}

# Map
key
	-> (sol | space) keyExpression ":" {% ([pre, key]) => key %}

keyExpression
	-> ( "=" | "+" | "|" | "&" | "^" | "-" ) space statement {% reduce %}
	| concat {% id %}

# statement
statement
	-> concat {% id %}

# Operators

concat
	-> concat space boolean {% reduce %}
	| boolean {% id %}

boolean
	-> boolean space ( "n" | "|" ) space add {% reduce %}
	| add {% id %}

add
	-> add space ( "+"|"-" ) space multiply {% reduce %}
	| multiply {% id %}

multiply
	-> multiply space ("*"|"/") space unaryPrefix {% reduce %}
	| unaryPrefix {% id %}

unaryPrefix
	-> "+" group {% reduce %}
	| "-" group {% reduce %}
	| "!" group {% reduce %}
	| group {% id %}

group
	-> "(" concat ")" {% reduce %}
	| "$" "{" concat "}" {% reduce %}
	| literal {% id %}