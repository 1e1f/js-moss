@lexer lexer
	
root
	-> scope %eof {% id %}

scope
	-> map {% id %}
	
map 
	-> map mapPairConstructor
		{% ([_map, nextMatch]) => {
			//console.log({nextMatch});
			const map = new Map(_map);
			if (nextMatch) {
				addPairToMap(nextMatch, map);
			}
			return map;
		} %}
	| mapPairConstructor
		{% ([initialMatch]) => {
			const map = new Map();
	        //console.log({initialMatch});
			if (initialMatch) {
				addPairToMap(initialMatch, map);
			}
			return map;
		} %}

mapPairConstructor 
	# nested constrained scope
	-> key space ((constraintMap (space | pushScope)) | pushScope) scope popScope
  		{% ([key, space, scopeConstaints, scope]) => {
			return [key, scope] 
		} %}
	
	# nested scope
	| key pushScope scope popScope
  		{% ([key, push, scope]) => {
			return [key, scope]
		} %}
		
	# map pair, optionally constrained
	| key space (constraintMap space):? expression expressionTerminator
  		{% ([key, space, constraintMap, expression]) => {
				return [key, expression] 
			}
		%}
		
	# default simple value
	| expression expressionTerminator
  		{% ([expression]) => {
			return [expression, true]
		}%}
	
	| expressionTerminator {% id %}
	| commentedLine {% id %}
	# error cases
	| key space ((constraintMap (space | pushScope)) | pushScope) expressionTerminator
  		{% expectedRhs %}
	| label pushScope scope
  		{% expectedScopeOperator %}
		

constraintMap 
	-> constraintMap space constraint
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
	-> "@" "[" (scope | (nestedScope "]"))
		{% ([_0, _1, scopeSelector]) => {
			return scopeSelector[0][2]
		}%}
	| "@" label "[" list "]"
		{% ([_0, property, _2, scopeSelector]) => {
			return [property, scopeSelector[2]]
		}%}
	| "@" label
		{% ([_0, property]) => [property, true] %}
		
	# error cases
	| "@" "[" space:+ nl {% extraSpace %}
	| "@" "[" (_ | nl) "]" {% emptyScope %}
	| "@" label "[" _ "]" {% emptyScope %}

list 
	-> list listSeparator label 
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
	
# Maths

expression 
	-> add {% id %}
 
add 
	-> add space ("+"|"-") space multiply {% reduce %}
	| multiply {% id %}
 
multiply 
	-> multiply space ("*"|"/") space term {% reduce %}
	| term {% id %}

group 
	-> "(" expression ")" {% (d) => d.join('') %}

key
	-> label ":" {% lhs %}

term
	-> label {% id %}
	| group {% id %}
	| uri {% id %}
#	| chunk {% id %}

# Operators
directive
	-> "@" {% () => '@' %}

# Formatting
nestedScope
	-> pushScope scope popScope

pushScope
	-> (inlineComment | nl) indent {% () => null %}

expressionTerminator
	-> listSeparator {% id %}
	| endLine {% id %}
	| "]" {% id %}

listSeparator
	-> "," space {% reduce %}

endLine
	-> inlineComment {% id %}
	| nl {% id %}
	
commentedLine
	-> space:* comment {% id %}

inlineComment
	-> space comment {% id %}

comment
	-> "#" _escapedString:? nl {% ([operator, comment]) => (comment) %}
	
popScope
	-> dedent {% () => null %}
	
# Numbers

number 
	-> _number {% ([n]) => parseFloat(n) %}

_number
	-> _float "e" _int {% reduce %}
 	| _float {% id %}
	
_float
	-> _int "." digit {% reduce %}
	| _int {% id %} 
 
_int 
	-> "-" digit {% concat %}
	| digit {% ([n]) => n %}

digit -> [0-9] {% ([tok]) => tok.value %}

# Words
	
label
	-> escapedString {% id %}
	| dqString {% id %}
	| word {% id %}
	| number {% id %}

# URL = scheme:[//authority]path[?query][#fragment]
uri
	-> url {% id %}
	| urx {% id %}

url
	-> urlScheme urx {% pickBest %}

urlScheme
	-> urlSafe ":" "/" "/" {% reduce %}
	
urx
	-> urlCredentials "@" urd {% reduce %}
	| urd {% reduce %}

urd
	-> tld urlPath uriQuery {% reduce %}
	| tld urlPath {% reduce %}
	| tld {% reduce %}
		
urlCredentials
	-> emailCredentials {% id %}
	| userCredentials {% id %}

urlPath
	-> "/" relativePath {% concat %}

relativePath ->
	relativePath "/" fileName {% reduce %}
	| fileName {% id %}
	
fileName ->
	fileName "." word {% reduce %}
	| word {% id %}

pathElement
	-> pathElement "/" urlSafe {% reduce %}
	| urlSafe {% id %}

emailCredentials
	-> emailCredentials ":" password {% reduce %}
	| email {% reduce %}
	
userCredentials
	-> userCredentials ":" password {% reduce %}
	| urlSafe {% reduce %}

password
	-> urlSafePlusEncoded {% reduce %}

email
	-> emailLhs "@" tld {% reduce %}

emailLhs
	-> urlSafe "." emailLhs {% id %}
	| urlSafe {% id %}

tld
	-> domain "." urlSafe {% reduce %}

domain ->
	urlSafe "." domain {% reduce %}
	| urlSafe {% id %}

uriQuery
  -> "?" queryList {% id %}

queryList
  -> queryList "&" queryFragment {% reduce %}
  | queryFragment {% id %}
  
queryFragment
  -> queryFragment "=" urlSafe {% reduce %}
  | urlSafe {% id %}

word 
	-> word wordSafeChar {% concat %}
	| wordStartChar {% id %}

wordSafeChar
	-> wordStartChar {% id %}
	| [0-9] {% ([tok]) => tok.value %}
	
wordStartChar
	-> [a-zA-Z$_] {% ([tok]) => tok.value %}

dqString
	-> "\"" _string "\"" {% function(d) {return d[1]; } %}

escapedString
	-> "`" _escapedString "`" {% function(d) {return d[1]; } %}

_string
	-> null {% function() {return ""; } %}
	| _string _stringchar {% ([lhs, rhs]) => lhs + rhs %}
	
_stringchar
	-> [^\\"] {% id %}
	| "\\" [^] {% concat %}

urlSafePlusEncoded
	-> urlSafePlusEncoded urlSafePlusEncodedChars {% reduce %}
	| urlSafePlusEncodedChars {% id %}

urlSafePlusEncodedChars
	-> "%" hexDigit hexDigit {% reduce %}
	| "&" "a" "m" "p" ";" {% reduce %}
	| urlSafeChar {% id %}
	
hexDigit -> [0-9a-fA-F] {% id %}

urlSafe
	-> urlSafe urlSafeChar {% concat %}
	| urlSafeChar {% id %}

# [0-9a-zA-Z$\-_.+!*'()] but we skip the dot as it is meaningfully parsed in rules
urlSafeChar -> [0-9a-zA-Z$\-_+!*'()] {% ([tok]) => tok.value %}

chunk
	-> chunk chunkChar {% concat %}
	| chunkChar {% id %}

chunkChar 
	-> [a-zA-Z0-9\+\-*\?\|\/\()\\:] {% ([tok]) => tok.value %}

_escapedString
	-> _escapedString escapedChar {% concat %}
	| escapedChar {% id %}
escapedChar 
	-> %space {% ([tok]) => tok.value %} 
	| %any {% ([tok]) => tok.value %}

# syntactic whitespace
nl -> %nl {% ([tok]) => null %}
indent
	-> %indent {% () => null %}
dedent
	-> %dedent {% () => null %}
space -> %space {% ([tok]) => tok.value %}

# ignored whitespace or chars
_
	-> _ space {% ([e]) => {
			return e ? e + ' ': '';
		} %}
	| null

@{%
// Lexer

const nl = () => ({type: 'nl', offset: 2, toString: () => ''});
const eof = () => ({type: 'eof'});

function* indented(lexer, source, info) {
  let iter = peekable(lexer.reset(source, info))
  let stack = [] 

  // absorb initial blank lines and indentation
  let indent = iter.nextIndent()


  for (let tok; tok = iter.next(); ) {
    if (tok.type === 'nl') {
      const newIndent = iter.nextIndent()
      if (newIndent == null) {
		  break;
	  }// eof
      else if (newIndent === indent) {
        yield nl();
      } else if (newIndent > indent) {
        stack.push(indent)
        indent = newIndent
		yield nl();
        yield {...tok, type: 'indent', indent: indent}

      } else if (newIndent < indent){
        while (newIndent < indent) {
          indent = stack.pop()
		  yield nl();
          yield {...tok, type: 'dedent', indent: indent}
        }
        if (newIndent !== indent) {
          throw new Error('inconsistent indentation')
        }
      } else {
		yield nl();
	  }
      indent = newIndent
    } else {
      yield { ...tok, indent: indent}
    }
  }

  // dedent remaining blocks at eof
  for (let i = stack.length; i--;) {
	indent = stack.pop();
	yield nl();
	yield {type: 'dedent', indent: indent }
  }
	
  yield nl();
  yield eof();
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
			const recur = (indent) => {
			  this.next()
			  const next = this.peek()
			  if (!next) return indent
			  if (next.type === 'nl') {
				this.next()
				return indent
			  } else if (next.type === 'space') {
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

const printToken = (t) => {
	switch (t.type){
		case "nl": return "\n";
		case "space": return " ";
		case "indent": return "->";
		case "dedent": return "<-";
		case "eof": return "</>";
		default: return t.text;
	}
}

function StreamLexer() {
	this.lexer = moo.compile(rules);
}

StreamLexer.prototype.next = function() {
	const tok = this.generator.next().value;
	if (tok){
		//console.log(printToken(tok), tok);
		return tok;
	}
}

StreamLexer.prototype.save = function() {
}

StreamLexer.prototype.getTokenTypes = function(source) {
	const types = [];
	const iter = indented( moo.compile(rules), source);
	const arr = [];
	for (const t of iter){
		if (t.type == 'any'){
			const back = arr[arr.length - 1];
			if (back && back.type == 'any'){
				back.value += t.value;
				back.text += t.text;
			} else {
				arr.push(t);
			}
		} else {
			arr.push(t);
		}
	}
	return arr.map(t => printToken(t))
}

StreamLexer.prototype.reset = function(source, info) {
	console.log('tokens', this.getTokenTypes(source))
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
	//word: /[a-zA-Z$_][a-zA-Z0-9$_]*/,
	//number: /[0-9]/,
	//urlUnsafe: /["<>#%{}|\\^~[]`]/,
	//urlReserved: /[;/?:@=&]/,
	//urlSafe: /[0-9a-zA-Z$\-_.+!*'()]/,
	// chunk: /[a-zA-Z0-9\+\-*\?\|\/\()\\:]/,
	any: /[^\s]/ 
};

const lexer = new StreamLexer();

// Errors
function emptyScope(){
	throw new Error("empty scope");
}

function expectedRhs(){
	throw new Error("no value for rhs");
}

function expectedTerminator(){
	throw new Error("missing map pair terminator");
}

function extraSpace(){
	throw new Error("unused space at end of line");
}

function genericContextError(){
	throw new Error("@context error");
}

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

const joinExpressionOperator = ([lhs, s1, op, s2, rhs]) => lhs + s1 + op + s2 + rhs
const joinSeparatedChunks = ([lhs, op, rhs]) => lhs + op + rhs
const concat = ([lhs, rhs]) => lhs + rhs
const lhs = ([lhs, rhs]) => lhs
const rhs = ([lhs, rhs]) => rhs
const back = (d) => d[d.length - 1]

function addPairToMap([key, value], map){
	if (map.get(key)){
		throw new Error(`duplicate key ${key}`);
	}
	map.set(key, value);
}

function join(list, rhs){
	if (!list) return rhs;
	if (!rhs) return list;
	if (typeof list == 'string'){
		return list + rhs;
	}
	return list + rhs;
}

function reduce(list){
	if (list.length == 1){
		return list[0];
	}
	let memo;
	for (const item of list){
		memo = join(memo, item);
	}
		console.log(memo);
	return memo;
}

function pickBest(list){
	return reduce(list);
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