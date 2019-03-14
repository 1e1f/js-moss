@{%


// implementation

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
        yield {type: 'nl'}

      } else if (newIndent > indent) {
        stack.push(indent)
        indent = newIndent
        yield {type: 'indent', value: indent}

      } else {
        while (newIndent < indent) {
          indent = stack.pop()
          yield {type: 'dedent', value: indent}
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
    yield {type: 'dedent'}
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
			case "char": return t.value;
			case "indent": return "->";
			case "dedent": return "<-";
			case "nl": return "\n";
			case "eof": return "eof";
			case "space": return " ";
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

const rules = {
	nl: {match: /[\n\r]+/, lineBreaks: true },
	space: /[ ]+/,
	char: /./
};

const lexer = new StreamLexer();

%}


@lexer lexer

root -> scope {% function(d) {
	return d[0]; 
} %}

scope ->
  map {% id %}

map -> (mapEntry):+ {% function(d) {
    let map = new Map();
	const entries = d[0];
	for (const mapEntry of entries) {
		const [key, valuePair] = mapEntry[0];
		const value = valuePair ? valuePair : null;
    	if(key) { 
			if (map.get(key)){
				throw new Error(`duplicate key ${key}`);
			}
			map.set(key, value)
		}
    }
    return map;
} %}


mapEntry
	-> dataType endStatement {% function(d) {
		return d[0]; 
	} %}
	| dataType mapClass {% function(d) {
			const [key, mapClass] = d;
			console.log('pair', key[0], mapClass);
			const pair = [key[0], mapClass];
			return pair;
		} %}


pushScope -> separator %indent:?
popScope -> endStatement dedent:? %eof:?
endStatement -> ("," _) | __ | endLine
endLine -> comment:? _ (nl | %eof)

dataType -> label | number

mapClass -> 
  pushScope __ mapEntry popScope {% function(d) { return d[2]; } %}
  #| separator mapDescriptor {% function(d) { return d[1]; } %}
  
mapDescriptor ->
  pushScope scope popScope {% function(d) { return d[1]; } %}
  | __ directive "text" _ %indent nestedMultilineString {% function(d) { return d[5]; } %}

nestedMultilineString -> multilineString %dedent {% function(d) { return d[1]; } %}
nestedValue ->
	nonStringLike
	| stringLike {% id %}
    | jsonRoot
    | jsonArray

jsonRoot -> 
	jsObject
	| "{" _ jsonPair (_ jsonPair):+ _ "}" {% missingComma %}

jsObject -> "{" ((nl | indent | null) jsonPair ",":?):* dedent:? "}" {% function map(d) {
    let output = {};
	for (let i in d[1]) {
		const pair = d[1][i];
		const key = pair[1][0];
		const value = pair[1][1];
    	if(key) { 
			if (output[key]){
				throw new Error(`duplicate key ${key}`);
			}
			output[key] = value[0]; 
		}
    }
    return output; 
} %}

jsonPair -> _ dqString _ separator _ dqString _ {% function(d) { return [d[1], d[5]]; } %}

jsonArray -> "[" _ "]" {% function(d) { return []; } %}
    | "[" _ jsonRoot (_ "," _ jsonRoot):* _ "]" {% extractArray %}

# MultiLine String

multilineString -> (lineBreak _ multilineEntry):* %dedent {% function(d) {
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

multilineEntry 
	-> stringLike _ comment:? {% function(d) { return d[0]; } %}
	| stringLike __ (stringLike | nonStringLike | __):+ comment:? 
		{% function(d) {
			const head = d[0][0];
			const tail = reduce(d[2]);
			const stringLine = reduceN(head, d[1], tail);
			console.log({stringLine});
			return stringLine;
		} %}

stringLike
	-> label {% id %}
	| symbol {% id %}
	| escapedString {% id %}

nonStringLike -> 
	number {% id %}
    | "true" {% function(d) { return true; } %}
    | "false" {% function(d) { return false; } %}
    | "null" {% function(d) { return null; } %}
	
lineBreak -> nl | indent | dedent
indent		   -> %indent {% function(d) { return d[0].value } %}
dedent		   -> %dedent {% function(d) { return d[0].value } %}
nl		       -> %nl {% function(d) { return null} %}

# Numbers

number -> _number {% function(d) {return parseFloat(d[0])} %}
 
_posint ->
	[0-9] {% id %}
	| _posint [0-9] {% function(d) {return d[0] + d[1]} %}
 
_int ->
	"-" _posint {% function(d) {return d[0] + d[1]; }%}
	| _posint {% id %}
 
_float ->
	_int {% id %}
	| _int "." _posint {% function(d) {return d[0] + d[1] + d[2]; }%}
 
_number ->
	_float {% id %}
	| _float "e" _int {% function(d){return d[0] + d[1] + d[2]; } %}
 

#Strings

dqString -> "\"" _string "\"" {% function(d) {return d[1]; } %}
escapedString -> "`" _string "`" {% function(d) {return d[1]; } %}
 
_string ->
	null {% function() {return ""; } %}
	| _string _stringchar {% function(d) {return d[0] + d[1];} %}
 
_stringchar ->
	[^\\"] {% id %}
	| "\\" [^] {% function(d) {return JSON.parse("\"" + d[0] + d[1] + "\""); } %}

label -> _label {% function(d) {return d[0]} %}
 
_label ->
	[a-zA-Z<$] _labelChar:* {% function(d) {
		const label = d[0] + (d[1] ? d[1].join('') : '')
		return label
	} %}

_labelChar ->
	[a-zA-Z0-9<>$] {% function(d) { return d[0] } %}

# Simple

cssLabel -> selector (label ",":? __:?):* {% function(d) { return [d[0], d[1]] } %}

symbol ->
	directive
	| selector
	| separator {% function(d) { } %}

selector       -> "=" {% function(d) { } %}
directive      -> "@" {% function(d) { } %}
separator      -> ":" {% function(d) { } %}

# Whitespace
_ -> null | _ %space {% function() {} %}
__ -> %space | __ %space {% function() { return d[0]} %}

comment -> "#" _ [\.*] {% function(d) { return null; } %}

@{%
// errors

function missingComma(){
	throw new Error("missing comma");
}

function addPairToMap(pair, map){
	const [key, value] = pair;
	if(key) { 
		if (map[key]){
			throw new Error(`duplicate key ${key}`);
		}
        map.set(key, value);
	}
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

function extractObject(d) {
    const map = new Map();
    addPairToMap(d[2], output);
    for (let i in d[3]) {
        addPairToMap(d[3][i][3], output);
    }
    return map;
}

function extractArray(d) {
    let array = [d[2]];
    for (let i in d[3]) {
        array.push(d[3][i][3]);
    }
    return array;
}

%}