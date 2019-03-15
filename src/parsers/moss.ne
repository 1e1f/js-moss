@lexer lexer
		
root
	-> scope eof
		{% ([scope]) => scope %}

scope 
	-> map {% id %}
		
map 
	-> map mapPairConstructor 
		{% ([map, nextMatch]) => {
			if (nextMatch) {
				console.log('addPairToMap', nextMatch);
				addPairToMap(nextMatch, map);
			}
			return map;
		} %}
	| mapPairConstructor
		{% ([initialMatch]) => {
			const map = new Map();
			mapId++;
			if (initialMatch) {
				console.log('newMap', mapId, initialMatch);
				addPairToMap(initialMatch, map);
			}
			return map;
		} %}


mapPairConstructor 
	# valid
	-> dataValue endGroup 
  		{% ([dv]) => {
			console.log('label', dv);
			return [dv, true] 
		}%}
	
	| dataValue separator __ dataValue endGroup 
  		{% ([key, _1, _2, value]) => {
				console.log('pair', [key, value]);
				return [key, value] 
			}
		%}
	
  	| dataValue pushScope scope popScope  
  		{% ([key, _1, scope]) => {
			return [key, scope] 
		} %}
		
	| commentLine {% () => null %}
	
	# error cases
	| dataValue nl indent scope popScope
  		{% expectedScopeOperator %}
		
inlineContextDescription -> _ {% () => null %}

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

dataValue -> 
	label {% id %}
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
	-> [0-9] {% id %}
	| _posint [0-9] {% ([lhs, rhs]) => lhs + rhs %}
 

#Strings

label
	-> label [\w] {% ([l, r]) => { return l + r.value; }%}
	| [a-zA-Z$_] {% ([char]) => char.value %}
	
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
	| _escapedString _escapedStringChar {% ([lhs, rhs]) => lhs + rhs %}

_escapedStringChar
	-> [^] {% id %}
	| "\\" [^] {% ([lhs, rhs]) => lhs + rhs %}


# Simple

cssLabel -> 
	selector (label ",":? __:?):* {% function(d) { return [d[0], d[1]] } %}

symbol 
	-> directive {% id %}
	| selector {% id %}
	| separator {% id %}

selector
	-> "=" {% () => '<selector>' %}
directive
	-> "@" {% () => '<directive>' %}
separator 
	-> ":" {% () => '<separator>' %}

# Formatting
pushScope
	-> separator nl indent {% () => null %}
		
popScope
	-> comment:? dedent {% () => null %}

indent
	-> %indent {% () => null %}
dedent
	-> %dedent {% () => null %}
	
endGroup
	-> "," | endLine {% () => null %}

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
        yield {...tok, type: 'indent', value: indent}

      } else {
        while (newIndent < indent) {
          indent = stack.pop()
		  yield {...tok, type: 'nl'}
          yield {...tok, type: 'dedent', value: indent}
        }
        if (newIndent !== indent) {
          throw new Error('inconsistent indentation')
        }
      }
      indent = newIndent
    } else {
      yield tok
    }
  }

  // dedent remaining blocks at eof
  for (let i = stack.length; i--;) {
	indent = stack.pop();
	yield {type: 'nl'}
    yield {value: indent, type: 'dedent', text: '@dedent'}
  }
	
  yield Object.assign({
	  type: 'eof'
    }, {
    toString() { return this.value },
    offset: lexer.index,
    size: 0,
    lineBreaks: 0,
    line: lexer.line,
    col: lexer.col,
  })
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
			case "char": return t.value;
				
			case "indent": return "->";
			case "dedent": return "<-";
			case "eof": return "eof";
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
	char: /./
};

const lexer = new StreamLexer();

%}