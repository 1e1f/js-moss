@lexer lexer
		
root
	-> scope nl:*
		{% ([scope]) => scope %}

scope 
	-> map {% id %}
	
map 
	-> map _ mapPairConstructor 
		{% ([map, ws, nextMatch]) => {
			if (nextMatch) {
				//console.log('addPairToMap', nextMatch);
				addPairToMap(nextMatch, map);
			}
			return map;
		} %}
	| mapPairConstructor
		{% ([initialMatch]) => {
			const map = new Map();
			mapId++;
			if (initialMatch) {
				//console.log('newMap', mapId, initialMatch);
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
  		{% ([key, _1, scope]) => {
			return [key, scope]
		} %}
	
	# map pair, optionally constrained
	| label scopeOperator __ (constraintMap __):? label endGroup 
  		{% ([key, _1, _2, constraintMap, value]) => {
				//console.log('pair', [key, value]);
				return [key, value] 
			}
		%}
		
	# default simple value
	| label endGroup
  		{% ([dv]) => {
			//console.log('label', dv);
			return [dv, true] 
		}%}
		
	| commentLine {% () => null %}

	# error cases
	| label pushScope scope popScope
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
			mapId++;
			if (initialMatch) {
				//console.log('add prop', initialMatch)
				addPairToMap(initialMatch, map);
			}
			return map;
		} %}
		
constraint
	-> "@" label "[" ((scope "]") | (inlineScope "]"))
		{% ([_0, property, _2, scopeSelector]) => {
			return [property, scopeSelector[0][0][2]] 
		}%}
	| "@" label
		{% ([_0, property]) => [property, true] %}

inlineScope
	-> nl indent scope dedent

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

label -> 
	word {% id %}
	| escapedString {% id %}
	| dqString  {% id %}
	| number {% id %}

# Numbers

number 
	-> _number {% ([numberString]) => parseFloat(numberString) %}

_number
	-> _float {% id %}
	| _float "e" _int {% ([lhs, operator, rhs]) => lhs + operator + rhs %}
 
_float 
	-> _int {% id %}
	| _int "." _posint {% ([lhs, operator, rhs]) => lhs + operator + rhs %}
 
_int 
	-> "-" _posint {% ([lhs, rhs]) => lhs + rhs %}
	| _posint {% id %}
 
_posint
	-> %digitChar {% id %}
	| _posint %digitChar {% ([lhs, rhs]) => lhs + rhs %}
 

#Strings
	
word
	-> word (%wordChar | %digitChar) 
		{% ([l, r]) => { return l + r; }%}
	| %wordChar {% ([char]) => char.value %}

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
	-> null {% function() {return ""; } %}
	| _escapedString (%wordChar | %digitChar | %anyChar | %space)  {% ([lhs, rhs]) => lhs + rhs %}

# Simple

cssword -> 
	selector (word ",":? __:?):* {% function(d) { return [d[0], d[1]] } %}

symbol 
	-> directive {% id %}
	| selector {% id %}
	| scopeOperator {% id %}

selector
	-> "=" {% () => '=' %}
directive
	-> "@" {% () => '@' %}
scopeOperator 
	-> ":" {% () => ':' %}

# Formatting
pushScope
	-> nl indent {% () => null %}

popScope
	-> comment:? dedent {% () => null %}
	
indent
	-> %indent {% () => null %}
dedent
	-> %dedent {% () => null %}
	
endGroup
	-> (",") | endLine {% () => null %}

endLine
	-> comment:? _ nl {% () => null %}
	
commentLine
	-> comment nl {% () => null %}
comment
	-> "#" _escapedString {% () => null %}

eof -> %eof

nl
	-> %nl {% () => null %}
_
	-> null | _ %space {% () => null %}
__
	-> %space | __ %space {% ([ws]) => ws %}


@{%
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
        yield {...tok, type: 'indent', value: 'indent', indent: indent}

      } else if (newIndent < indent){
        while (newIndent < indent) {
          indent = stack.pop()
		  yield {...tok, type: 'nl'}
          yield {...tok, type: 'dedent', value: null, indent: indent}
        }
        if (newIndent !== indent) {
          throw new Error('inconsistent indentation')
        }
      } else {
	  	yield {...tok, type: 'nl'}
	  }
      indent = newIndent
    } else {
      yield tok
    }
  }

  // dedent remaining blocks at eof
  for (let i = stack.length; i--;) {
	indent = stack.pop();
	yield {type: 'nl', value: '<nl>' }
	yield {type: 'dedent', value: '<nl>' }
  }
  
  yield { type: 'nl', value: '<nl>' }

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
          this.next()

          const next = this.peek()
          if (!next) return
          if (next.type === 'nl') {
            this.next()
            continue
          }
          return indent
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
	if (value){
		return value;
	}
}

StreamLexer.prototype.save = function() {
}

StreamLexer.prototype.getTokenTypes = function(source) {
	const types = [];
	const iter = indented(this.lexer, source);
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
			case "eof": return "eof";
			default: return t.text;
		}
	})
}

StreamLexer.prototype.reset = function(source, info) {
	console.log('types', this.getTokenTypes(source))
	this.generator = indented(this.lexer, source, info);
	this.initialized = true;
} 

StreamLexer.prototype.formatError = function(token) {
	return this.lexer.formatError(token);
}

StreamLexer.prototype.has = function(name) {
	if (name == 'indent') return true;
	if (name == 'dedent') return true;
	if (name == 'eof') return true;
	return this.lexer.has(name);
}

let mapId = 0;

const rules = {
	nl: {match: /[\n\r]+/, lineBreaks: true },
	space: /[ ]+/,
	operator: /[+\-*?|\/]/,
	wordChar: /[a-zA-Z$_]/,
	digitChar: /[0-9]/,
	anyChar: /./,
};

const lexer = new StreamLexer();

%}