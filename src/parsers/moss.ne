@lexer lexer

scope
	-> map nl:* {% id %}

map 
	-> map mapPairConstructor
		{% ([_map, nextMatch]) => {
			const map = new Map(_map);
			if (nextMatch) {
				addPairToMap(nextMatch, map);
			}
			return map;
		} %}
	| mapPairConstructor
		{% ([initialMatch]) => {
			const map = new Map();
			if (initialMatch) {
				addPairToMap(initialMatch, map);
			}
			return map;
		} %}

mapPairConstructor 
	# nested constrained scope
	-> label scopeOperator __ ((constraintMap (__ | pushScope)) | pushScope) scope popScope
  		{% ([key, _1, _2, scopeConstaints, scope]) => {
			console.log('scopeConstaints', scopeConstaints[0]) 
			return [key, scope] 
		} %}
	
	
	# nested scope
	| label scopeOperator pushScope scope popScope
  		{% ([key, _1, _2, scope]) => {
			return [key, scope]
		} %}
		
	# map pair, optionally constrained
	| label scopeOperator __ (constraintMap __):? expression endGroup
  		{% ([key, _1, _2, constraintMap, value]) => {
				console.log('pair', [key, value]);
				return [key, value] 
			}
		%}
		
	# default simple value
	| expression endGroup
  		{% ([value]) => {
			return [value, true] 
		}%}
		
	| commentLine {% ([comment]) => {
			return ['comment', comment] 
		}%}

	# error cases
	| label pushScope scope
  		{% expectedScopeOperator %}
		

constraintMap 
	-> constraintMap __ constraint
		{% ([map, ws, nextMatch]) => {
			if (nextMatch) {
				addPairToMap(nextMatch, map);
			}
			return map;
		} %}
	| constraint
		{% ([initialMatch]) => {
			const map = new Map();
			if (initialMatch) {
				//console.log('add prop', initialMatch)
				addPairToMap(initialMatch, map);
			}
			return map;
		} %}
		
constraint
	-> "@" label "[" scope "]"
		{% ([_0, property, _2, scopeSelector]) => {
			return [property, scopeSelector[2]]
		}%}
	| "@" "[" (scope | inlineScope) "]"
		{% ([_0, _1, scopeSelector]) => {
			return scopeSelector[0][2]
		}%}
	| "@[" _ "]"
		{% ([_0, property, _2, scopeSelector]) => {
			return [property, true] 
		}%}
	| "@" label
		{% ([_0, property]) => [property, true] %}

inlineScope
	-> pushScope scope popScope

list 
	-> list "," _ label 
		{% ([list, _1, _2, item]) => {
			if (item) {
				list.push(item);
			}
			return list;
		} %}
	| label
		{% ([value]) => {
			return [value];
		} %}

# MultiLine String

multilineString 
	-> ((nl | dedent) _string):* dedent 
		{% function(d) {
			const indent = d[0][0][0][0];

			const lines = d[2].map(segment => {
				const relativeIndent = segment[0] - indent;
				let base = '';
				if (relativeIndent > 0){
					for (let i = 0; i < relativeIndent; i++){
						base = base + ' ';	
					}
				}
				return base + segment[1];
			}).join('\\n');
			return lines;
		} %}

# HighLevel

# Maths

expression 
	-> add {% id %}
 
add 
	-> add _ ("+"|"-") _ multiply {% (d) => {console.log(d); return d.join('')} %}
	| multiply {% id %}
 
multiply 
	-> multiply _ ("*"|"/") _ term {% (d) => d.join('') %}
	| term {% id %}

group 
	-> "(" expression ")" {% (d) => d.join('') %}
	
term
	-> group {% id %}
	| label {% id %}

# Numbers

number 
	-> _number {% ([n]) => parseFloat(n) %}

_number
	-> _float "e" _int {% ([lhs, operator, rhs]) => lhs + operator + rhs %}
 	| _float {% id %}
	
_float
	-> _int "." %number {% ([lhs, operator, rhs]) => lhs + operator + rhs %}
	| _int {% id %} 
 
_int 
	-> "-" %number {% ([lhs, rhs]) => lhs + rhs %}
	| %number {% ([n]) => n %}
	
# Words
label ->
	word {% id %}
	| escapedString {% id %}
	| dqString {% id %}
	| number {% id %}

#Strings

word -> %word {% ([n]) => n.value || "" %}

dqString 
	-> "\"" _string "\"" {% function(d) {return d[1]; } %}

escapedString
	-> "`" _escapedString "`" {% function(d) {return d[1]; } %}

_string
	-> null {% function() {return ""; } %}
	| _string _stringchar {% ([lhs, rhs]) => lhs + rhs %}
_stringchar
	-> [^\\"] {% id %}
	| "\\" [^] {% ([lhs, rhs]) => lhs + rhs %}

_escapedString 
	-> _escapedString (%word | %number | %space)  {% ([lhs, rhs]) => lhs + rhs[0] %}

directive
	-> "@" {% () => '@' %}

scopeOperator 
	-> ":" {% () => ':' %}

# Formatting
pushScope
	-> nl indent _ {% () => null %}

popScope
	-> dedent {% () => null %}
	
indent
	-> %indent {% () => null %}
dedent
	-> %dedent {% () => null %}
	
endGroup
	-> _ (("," _) | endLine) {% () => null %}

endLine
	-> comment:? nl {% () => null %}
	
commentLine
	-> comment nl {% ([comment]) => (comment) %}

comment
	-> "#" _escapedString {% ([_, comment]) => (comment) %}

nl -> %nl {% id %}
_ 
	-> _ space {% ([e]) => {
			return e ? e + ' ': '';
		} %}
	| null

__ -> space {% id %}

space -> %space {% ([d]) => d.value %}

@{%
// Lexer

function* indented(lexer, source, info) {
  let iter = peekable(lexer.reset(source, info))
  let stack = [] 

  // absorb initial blank lines and indentation
  let indent = iter.nextIndent()

  for (let tok; tok = iter.next(); ) {
    if (tok.type === 'nl') {
      const newIndent = iter.nextIndent()
      if (newIndent == null) break // eof
      else if (newIndent === indent) {
        yield {...tok, type: 'nl'}
      } else if (newIndent > indent) {
        stack.push(indent)
        indent = newIndent
		yield {...tok, type: 'nl'}
        yield {...tok, type: 'indent', indent: indent}

      } else if (newIndent < indent){
        while (newIndent < indent) {
          indent = stack.pop()
		  yield {...tok, type: 'nl'}
          yield {...tok, type: 'dedent', indent: indent}
        }
        if (newIndent !== indent) {
          throw new Error('inconsistent indentation')
        }
      } else {
	  	yield {...tok, type: 'nl'}
	  }
      indent = newIndent
    } else {
      yield { ...tok, indent: indent}
    }
  }

  // dedent remaining blocks at eof
  for (let i = stack.length; i--;) {
	indent = stack.pop();
	yield {type: 'nl', value: '<nl>' }
	yield {type: 'dedent', value: '<nl>' }
  }
	
  yield {type: 'nl', value: '<nl>' }
}

function peekable(lexer) {
  let here = lexer.next()
  return {
    next() {
      const old = here
      here = lexer.next()
      return old
    },
    peek() {
      return here
    },
    nextIndent() {
      for (let tok; tok = this.peek(); ) {
        if (tok.type === 'nl') {
          this.next();
        }
        else if (tok.type === 'space') {
          const indent = tok.value.length
         	console.log(indent);
			const recur = (indent) => {
			  this.next()
			  const next = this.peek()
			  if (!next) return indent
			  if (next.type === 'nl') {
				this.next()
				return indent
			  } else if (next.type === 'space') {
				console.log(indent);
				
				return recur(indent + 1);
			  }
			  return indent
			}
			return recur(1);
        }
        return 0
      }
    },
  }
}


function StreamLexer() {
	this.lexer = moo.compile(rules);
}

StreamLexer.prototype.next = function() {
	const { value } = this.generator.next();
	return value;
}

StreamLexer.prototype.save = function() {
}

StreamLexer.prototype.getTokenTypes = function(source) {
	const types = [];
	const iter = indented( moo.compile(rules), source);
	const arr = [];
	for (const t of iter){
		arr.push(t);
	}
	return arr.map(t => {
		switch (t.type){
			case "nl": return "\n";
			case "space": return " ";
			case "indent": return "->";
			case "dedent": return "<-";
			default: return t.text;
		}
	})
}

StreamLexer.prototype.reset = function(source, info) {
	//console.log('tokens', this.getTokenTypes(source))
	this.generator = indented(this.lexer, source, info);
} 

StreamLexer.prototype.formatError = function(token) {
	return this.lexer.formatError(token);
}

StreamLexer.prototype.has = function(name) {
	if (name == 'indent') return true;
	if (name == 'dedent') return true;
	return this.lexer.has(name);
}

const rules = {
	space: /[ ]/,
	nl: {match: /[\n\r]+/, lineBreaks: true },
	word: /[a-zA-Z$_][a-zA-Z0-9$_]*/,
	number: /[0-9]+/,
	operator: /[\+]/,
	anyChar: /./
	//anyChar: /[a-zA-Z0-9\.\+\-*\?\|\/ \():]/,
};

const lexer = new StreamLexer();

// Errors

function missingComma(){
	throw new Error("missing comma");
}

function expectedScopeOperator(){
	throw new Error("nested scope without scope operator");
}

function missingRhs(){
	throw new Error("rhs of pair assignment missing");
}

function unknownOrEmpty(){
	throw new Error("unknown or empty");
}

// Value Reducers

function addPairToMap([key, value], map){
	if (map.get(key)){
		throw new Error(`duplicate key ${key}`);
	}
	map.set(key, value);
}

function join(list, rhs){
	if (!list) return rhs;
	if (typeof list == 'string'){
		return list + rhs;
	}
	return list + rhs;
}

function reduceN(...list){
	if (list.length == 1){
		return list[0];
	}
	let memo;
	for (const item of list){
		memo = join(memo, item);
	}
	return memo;
}

function reduce(list){
	return reduceN(...list);
}

function map2Object(map){
	const object = {};
	for (const pair of map){
		const [key] = pair;
		object[key] = map.get(key);
	}
	return object;
}

%}