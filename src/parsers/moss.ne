@lexer lexer

start
	-> sof rootScope eof {% ([sof, scope]) => scope %}

rootScope
	-> map {% id %}
	| (sol eol "text") multilineString ("\/text") {% ([sol, scope]) => scope %}
	| (sol eol "list") list ("\/list") {% ([sol, scope]) => scope %}

scope
	-> map {% id %}

map
	-> map mapPairConstructor
		{% ([_layer, nextMatch]) => {
			const layer = new Map(_layer)
			if (nextMatch && (nextMatch[0] !== undefined)) {
				addPairToMap(nextMatch, layer)
			}
			return layer;
		} %}
	| mapPairConstructor
		{% ([initialMatch]) => {
			const layer = new Map();
			if (initialMatch && (initialMatch[0] !== undefined)) {
				addPairToMap(initialMatch, layer)
			}
			return layer;
		} %}

mapPairConstructor
	# list
	-> key ((space constraintMap) | space) (eol "list" indent) list popScope "\/list"
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

	# map
	| key ((space constraintMap) | space) "{" scope (endLine | (space "}"))
  		{% ([key, context, bracket, scope]) => {
				return [key, scope]
			} %}
			
	# map
	| key ((space constraintMap) | space) "[" list (endLine | (space "]"))
  		{% ([key, context, bracket, scope]) => {
				return [key, scope]
			} %}
			
	# statement
	| key ((space constraintMap) | space) statement mapTerminator
  		{% ([key, context, statement]) => {
				return [key, statement]
			} %}

	# default simple value
	| (sol | space) statement mapTerminator
  		{% ([prefix, statement]) => {
			return [statement, true]
		}%}

	| sol eol {% () => null %}
	| sol comment {% () => null %}
	# error cases
	| literal pushScope scope
  		{% expectedScopeOperator %}

mapTerminator
	-> ((space "}") | "," | endLine) {% id %}

list
	-> list mapPairConstructor
		{% ([array, item]) => {
			if (item){
				if (item[1] === true) array.push(item[0]);
				else {
					const map = new Map();
					map.set(item[0], item[1]);
					array.push(map);
				}
			}
			return array;
		} %}
	| mapPairConstructor
		{% ([item]) => {
			if (item[1] === true) return [item[0]];
			else {
				const map = new Map();
				map.set(item[0], item[1]);
				return map;
			}
		} %}

listConstructor
	-> ( sol ) statement endLine
		{% ([key, statement]) => {
			return statement
		} %}
	| ( sol ) (space _mls) pushTypedScope multilineString popScope
  		{% ([key, keyMode, scopeConstaints, indent, scope]) => {
			return scope
		} %}

	| ( sol ) pushTypedScope scope popScope
  		{% ([key, scopeConstaints, indent, scope]) => {
			return scope
		} %}
	| sol eol {% () => null %}



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
	| "@" literal "{" scope (space | endLine)
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
	| literal {% id %}

# Operators
directive
	-> "@" {% () => '@' %}

# Formatting
nestedScope
	-> pushScope scope popScope {% ([push, scope]) => scope %}

pushScope
	-> (inlineComment | eol) indent {% () => null %}

popScope
	-> dedent {% () => null %}

endLine
	-> inlineComment {% id %}
	| eol {% id %}

inlineComment
	-> space comment {% id %}

comment
	-> "#" _escapedString:? eol {% ([operator, comment]) => (comment) %}

# Numbers

number
	-> _number {% ([n]) => parseFloat(n) %}

_number
	-> _float "e" digit {% reduce %}
 	| _float {% id %}

_float
	-> digit "." digit {% reduce %}
	| digit {% id %}

digit
	-> digit [0-9] {% concat %}
	| [0-9] {% ([tok]) => tok %}

# Words

literal
	-> string {% id %}
	| singleWord {% id %}
	| uri {% id %}
	| number {% id %}

# URL = scheme:[//authority]path[?query][#fragment]
uri
	-> url {% id %}
	| urx {% id %}

url
	-> urlScheme urx {% reduce %}

urlScheme
	-> urlSafe ":" "/" "/" {% reduce %}

urx
	-> urlCredentials "@" urd {% reduce %}
	| urd {% reduce %}

urd
	-> tld urlPath:? uriQuery:? {% reduce %}

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
  -> "?" queryList {% reduce %}

queryList
  -> queryList "&" queryFragment {% reduce %}
  | queryFragment {% id %}

queryFragment
  -> queryFragment "=" urlSafePlusEncoded {% reduce %}
  | urlSafePlusEncoded {% id %}

singleWord
	-> [a-zA-Z$_] [a-zA-Z$_0-9]:*
		{% optionalTail %}

word
	-> word wordSafeChar {% concat %}
	| wordStartChar {% id %}

wordSafeChar
	-> wordStartChar {% id %}
	| [0-9] {% ([tok]) => tok.value %}

wordStartChar
	-> [a-zA-Z$_] {% ([tok]) => tok.value %}

string
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
	-> [a-zA-Z0-9@+\-*?|/()\\:] {% ([tok]) => tok.value %}

_escapedString
	-> _escapedString escapedChar {% concat %}
	| escapedChar {% id %}

escapedChar
	-> %space {% ([tok]) => tok.value %}
	| %any {% ([tok]) => tok.value %}

# notation modes
_aa -> "@" "m" "a" "p" {% reduce %}
_ordered -> "@" "l" "i" "s" "t" {% reduce %}
#_ordered -> "@" "list" {% id %}
_mls -> "@" "s" "t" "r" "i" "n" "g" {% reduce %}

# syntactic whitespace
sof -> %sof {% ([tok]) => tok.value %}
eof -> %eof {% ([tok]) => tok.value %}
sol -> %sol {% ([tok]) => tok %}
eol -> %eol {% ([tok]) => tok %}
indent
	-> %indent {% ([tok]) => tok %}
dedent
	-> %dedent {% ([tok]) => tok %}
space -> %space {% ([tok]) => tok.value %}

# ignored whitespace or chars
_
	-> _ space {% ([e]) => {
			return e ? e + ' ': '';
		} %}
	| null

@{%
// Lexer

const makeToken = (type, text, indent) => ({type, text, value: text, indent, toString: () => text});
const makeEol = (indent) => makeToken('eol', '\n');
const makeEof = () => makeToken('eof', 'eof');
const makeSol = (indent) => makeToken('sol', '\n', indent)
const makeIndent = (indent) => makeToken('indent', 'indent', indent)
const makeDedent = (indent) => makeToken('dedent', 'dedent', indent)
const makeSof = () => makeToken('sof', 'sof');

const doDedent = (ruleMap, indent, nextIndent) => {
	const tokens = [makeEol()];
  	tokens.push(makeDedent(nextIndent));
	const ruleToken = ruleMap.get(indent);
	if (ruleToken) {
	  tokens.push(makeToken('stopRule', `/${ruleToken.text}`));
	  ruleMap.delete(indent)
  	}
  	tokens.push(makeSol(nextIndent));
	return tokens;
}

function* indented(lexer, source, info) {
  let iter = peekable(lexer.reset(source, info))
  let stack = []
  let ruleMap = new Map();

  // absorb initial blank lines and indentation
  let indent = iter.nextIndent()

  yield makeSof();
  yield makeSol(indent);

  for (let tok; tok = iter.next(); ) {
    if (tok.type === 'eol' || tok.type === 'startRule') {
      const newIndent = iter.nextIndent()
      if (newIndent == null) {
		  break;
	  }// eof
      else if (newIndent === indent) {
        yield makeEol();
		if (tok.type === 'startRule'){
			if (indent === 0){
				const ruleToken = makeToken('startRule', tok.text.split('<')[0]);
				ruleMap.set(indent, ruleToken);
				yield ruleToken;
			}
		}
	    yield makeSol(indent);
      } else if (newIndent > indent) {
		stack.push(indent)
		yield makeEol();
	    indent = newIndent
		if (tok.type === 'startRule'){
			const ruleToken = makeToken('startRule', tok.text.split('<')[0]);
			ruleMap.set(indent, ruleToken);
			yield ruleToken;
		}
		yield makeIndent(indent)
	    yield makeSol(indent);
      } else if (newIndent < indent){
        while (newIndent < indent) {
		  const nextIndent = stack.pop();
		  const dedentTokens = doDedent(ruleMap, indent, nextIndent);
		  for (const t of dedentTokens){
			  yield t;
		  }
		  indent = nextIndent;
        }
        if (newIndent !== indent) {
          throw new Error(`inconsistent indentation ${newIndent} != ${indent}`)
        }
      } else {
		yield makeEol();
		yield makeSol(indent);
	  }
      indent = newIndent
    } else {
      yield { ...tok, indent: indent}
    }
  }

  // dedent remaining blocks at eof
  for (let i = stack.length; i--;) {
	const nextIndent = stack.pop() || 0;
	const dedentTokens = doDedent(ruleMap, indent, nextIndent);
	  for (const t of dedentTokens){
		  yield t;
	 }
	indent = nextIndent;
  }

	yield makeEol();
  	const ruleToken = ruleMap.get(0);
	if (ruleToken) {
	  yield makeToken('stopRule', `/${ruleToken.text}`);
	  ruleMap.delete(0)
  	}

	yield makeEof();
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
        if (tok.type === 'eol') {
          this.next();
        }
        else if (tok.type === 'space') {
          const indent = tok.value.length
			const recur = (indent) => {
			  this.next()
			  const next = this.peek()
			  if (!next) return indent
			  if (next.type === 'eol') {
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

const rules = {
	space: /[ ]/,
	startRule: {match: /[a-zA-Z+\-]+<[\n\r]/, lineBreaks: true },
	eol: {match: /[\n\r]/, lineBreaks: true },
	//word: /[a-zA-Z$_][a-zA-Z0-9$_]*/,
	//number: /[0-9]/,
	//urlUnsafe: /["<>#%{}|\\^~[]`]/,
	//urlReserved: /[;/?:@=&]/,
	//urlSafe: /[0-9a-zA-Z$\-_.+!*'()]/,
	//chunk: /[a-zA-Z0-9\+\-*\?\|\/\()\\:]/,
	any: /[^\s]/
};

const printToken = (t) => {
	switch (t.type){
		case "eol": return "}";
		case "eol": return "}";
		case "space": return " ";
		case "indent": return "->";
		case "dedent": return "<-";
		case "eof": return "</>";
		case "sof": return "<>";
		case "sol": return "{";
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
			const back = arr.length ? arr[arr.length - 1] : null;
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
	if (name == 'sof') return true;
	if (name == 'sol') return true;
	if (name == 'eof') return true;
	if (name == 'eol') return true;
	return this.lexer.has(name);
}

const lexer = new StreamLexer();

// Errors
function expectedListNotation(){
	throw new Error("expected list notation");
}

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
	console.log('add to layer', [key, value], map);
	if (map.get(key)){
		throw new Error(`duplicate key ${key}`);
	}
	map.set(key, value);
}

function addPairToDataAndContext([key, data, context], [dataMap, contextMap]){
	addPairToMap([key, data], dataMap);
	addPairToMap([key, context], contextMap)
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
	return memo;
}

function optionalTail(list){
	const [head, tail] = list;
	if (tail && tail.length){
		return head.value + reduce(tail);
	}
	return head.value; f
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
