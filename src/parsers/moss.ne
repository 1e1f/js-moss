@lexer lexer

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
	| literal {% id %}

# Operators
directive
	-> "@" {% () => '@' %}

# Formatting
nestedScope
	-> pushScope scope popScope {% ([push, scope]) => scope %}

pushScope
	-> (inlineComment | eol) indent {% id %}

popScope
	-> dedent {% id %}
	
endLine
	-> inlineComment {% id %}
	| eol {% id %}

inlineComment
	-> space comment {% id %}

comment
	-> "/" "/" _escapedString:? %eol {% ([operator, comment]) => (comment) %}
	
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
	| authority {% id %}

url
	-> urlDomainScheme authority {% reduce %}
	| urlScheme uriPathComponent {% reduce %}
	| urlScheme urlPath {% reduce %}

urlDomainScheme
	-> urlScheme "/" "/" {% reduce %}

urlSchemes
	-> urlSchemes urlScheme {% reduce %}
	| urlScheme {% id %}

urlScheme
	-> domainComponent ":" {% reduce %}

authority
	-> urlCredentials "@" _authority {% reduce %}
	| _authority {% reduce %}

_authority
	-> uriDomainComponent uriPathComponent:? uriQueries:? uriFragment:? {% reduce %}

uriQueries 
	-> uriQueries uriQuery {% reduce %}
	| uriQuery {% id %}

uriPathComponent 
	-> "/" urlPath {% reduce %}
	| "/" {% ([tok]) => tok.value %}

urlCredentials
	-> urlCredentials ":" password {% reduce %}
	| email {% id %}
	| subdomain {% id %}

urlPath
	-> urlPath "/" urlPathName {% reduce %}
	| urlPath "/" {% reduce %}
	| urlPathName {% id %}

urlPathName ->
	urlPathName "." urlPathWord {% reduce %}
	| urlPathWord {% id %}
	
urlPathWord
	-> urlPathWord urlPathChar {% reduce %}
	| urlPathChar {% id %}
	
urlPathChar
	-> [^ ^/^.^?^;] {% ([tok]) => tok.value %}

filePath ->
	filePath "/" fileName {% reduce %}
	| fileName {% id %}

fileName ->
	fileName "." fileWord {% reduce %}
	| fileWord {% id %}

fileWord
	-> fileWord fileChar {% reduce %}
	| fileChar {% id %}

fileChar
	-> [^ ^/^.] {% ([tok]) => tok.value %}

password
	-> urlSafePlusEncoded {% reduce %}

email
	-> subdomain "@" domain {% reduce %}

uriDomainComponent
	-> uriDomainComponent uriPortComponent {% reduce %}
	| domain {% reduce %}
	| "[" ipv6 "]" {% reduce %}
	| ipv4 {% id %}

matchSeven[x] 
	-> $x $x $x $x $x $x $x {% reduce %}

matchOneToSeven[x] 
	-> $x $x $x $x $x $x $x {% reduce %}
	| $x $x $x $x $x $x {% reduce %}
	| $x $x $x $x $x {% reduce %}
	| $x $x $x $x {% reduce %}
	| $x $x $x $x {% reduce %}
	| $x $x $x {% reduce %}
	| $x $x {% reduce %}
	| $x {% reduce %}
	
ipv6
	-> matchSeven[ipv6Group] ipv6Number {% reduce %}
	| matchOneToSeven[ipv6Group] ":" ipv6Number {% reduce %}

matchOneToFour[x]
	-> $x $x $x $x {% reduce %}
	| $x $x $x {% reduce %}
	| $x $x {% reduce %}
	| $x {% reduce %}

ipv6Group
	-> ipv6Number ":" {% reduce %}

ipv6Number
	-> matchOneToFour[hexDigit]

ipv4
	-> ipv4Group "." ipv4Group "." ipv4Group "." ipv4Group

ipv4Group
	-> d2 d5 d0_5 {% reduce %}
	| d2 d0_4 d0_9 {% reduce %}
	| d1 d0_9 d0_9 {% reduce %}
	| d0_9 d0_9 {% reduce %}
	| d0_9 {% id %}

d1 -> "1" {% ([tok]) => tok %}
d2 -> "2" {% ([tok]) => tok %}
d5 -> "5" {% ([tok]) => tok %}
d0_4 -> [0-4] {% ([tok]) => tok %}
d0_5 -> [0-5] {% ([tok]) => tok %}
d0_9 -> [0-9] {% ([tok]) => tok %}

domain
	-> subdomain "." domainComponent {% reduce %}

uriPortComponent
	-> ":" number {% reduce %}

subdomain ->
	domainComponent "." subdomain {% reduce %}
	| domainComponent {% id %}

# ! $ & ' ( ) * + , ; = 
# are permitted by generic URI syntax to be used unencoded
# in the user information, host, and path as delimiters.

uriQuery
  -> "?" queryList {% reduce %}

queryList
  -> queryList "&" queryFragment {% reduce %}
  | queryFragment {% id %}

queryFragment
  -> queryFragment "=" urlSafePlusEncoded {% reduce %}
  | urlSafePlusEncoded {% id %}

uriFragment
  -> "#" queryList {% reduce %}

domainComponent
	-> [a-zA-Z] [a-zA-Z0-9\-]:*
		{% optionalTail %}
	
singleWord
	-> [a-zA-Z$_] [a-zA-Z0-9$_]:*
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

urlSafeChar -> [a-zA-Z0-9\-] {% ([tok]) => tok.value %}



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

# syntactic whitespace
sof -> %sof {% ([tok]) => tok.value %}
eof -> %eof {% ([tok]) => tok.value %}
sol -> %sol {% ([tok]) => tok %}
eol -> _ %eol {% ([ws, tok]) => tok %}
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
	| null {% () => '' %}

@{%
// Lexer

const makeToken = (type, text, sourceMap, indent) => ({...sourceMap, type, text, value: text, indent, toString: () => text});

const makeSol = (sourceMap, indent) => {
	const t = makeToken('sol', '\n', sourceMap, indent);
	//console.log(t);
	return t
}
const makeEol = (sourceMap, indent) => makeToken('eol', '\n', sourceMap, indent)

const makeIndent = (sourceMap, indent) => makeToken('indent', 'indent', sourceMap, indent)
const makeDedent = (sourceMap, indent) => makeToken('dedent', 'dedent', sourceMap, indent)

const makeSof = () => makeToken('sof', 'sof');
const makeEof = () => makeToken('eof', 'eof');

const doDedent = (ruleMap, indent, nextIndent, sourceMap) => {
	const tokens = [makeEol(sourceMap, indent)];
	const ruleToken = ruleMap.get(indent);
	if (ruleToken) {
	  tokens.push(makeToken('stopRule', `/${ruleToken.text}`, sourceMap, indent));
	  ruleMap.delete(indent)
  	}
	tokens.push(makeDedent(sourceMap, nextIndent));
  	tokens.push(makeSol(sourceMap, nextIndent));
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
	const sourceMap = {line: tok.line, col: tok.col};
	  
    if (tok.type === 'eol' || tok.type === 'startRule') {
      const newIndent = iter.nextIndent()
      if (newIndent == null) {
		  break;
	  }// eof
      else if (newIndent === indent) {
		if (tok.type === 'startRule'){
			const ruleToken = makeToken('startRule', tok.text.slice(0, tok.text.indexOf('<') + 1));
			ruleMap.set(indent, ruleToken);
			yield ruleToken;
		}
		yield makeEol(indent, sourceMap);
	    yield makeSol(sourceMap, indent);
      } else if (newIndent > indent) {
		stack.push(indent)
	    indent = newIndent
		if (tok.type === 'startRule'){
			const ruleToken = makeToken('startRule', tok.text.slice(0, tok.text.indexOf('<') + 1));
			ruleMap.set(indent, ruleToken);
			yield ruleToken;
		}
		yield makeEol(sourceMap, indent);
		yield makeIndent(sourceMap, indent)
	    yield makeSol(sourceMap, indent);
      } else if (newIndent < indent){
        while (newIndent < indent) {
		  const nextIndent = stack.pop();
		  const dedentTokens = doDedent(ruleMap, indent, nextIndent, sourceMap);
		  for (const t of dedentTokens){
			  yield t;
		  }
		  indent = nextIndent;
        }
        if (newIndent !== indent) {
          throw new Error(`inconsistent indentation ${newIndent} != ${indent}`)
        }
      } else {
		yield makeEol(sourceMap, indent);
		yield makeSol(sourceMap, indent);
	  }
      indent = newIndent
    } else {
      yield { ...tok, indent: indent}
    }
  }

  // dedent remaining blocks at eof
  for (let i = stack.length; i--;) {
	const nextIndent = stack.pop() || 0;
	const dedentTokens = doDedent(ruleMap, indent, nextIndent, {line: 'eof', col: 'eof'});
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
	startRule: {
		match: /[a-zA-Z+\-`]+<[\n\r]|[a-zA-Z+\-`]+< \/\/.*[\n\r]/,
		lineBreaks: true 
	},
	eol: {match: /[\n\r]/, lineBreaks: true },
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
