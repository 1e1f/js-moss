identifier
	-> deref:? _identifier {% ([deref, node]) => {
				return new Expression(node, { deref });
			}
		%}

deref
  -> "*" chunk {% ([tok, sequence]) => join([tokenValue(tok), sequence]) %}

_identifier
  -> number {% id %}
  | chunkSequence {% ([[identifier, sm]]) => {
		return new Identifier(identifier, sm);
	}
  %}

chunkSequence
	-> chunk chunkSequenceElement:+ {% ([head, tail]) => join([head, ...tail]) %}
	| chunk {% id %}

chunkSequenceElement
	-> __ chunk {% join %}

chunk
	# -> chunk any {% join %}
	# server yaml characters ? ! & *
	-> startChunk continueChunk:+ {% ([head, tail]) => {
		// console.log({head, middle, tail});
		return join([head, ...tail]) 
		} %}
	| startChunk {% id %}

startChunk
	-> [a-zA-Z0-9$_<>] {% tokenValue %}

continueChunk
	-> [^:] {% tokenValue %}

unquotedChar
	-> %any {% tokenValue %}

urlSafePlusEncoded
	-> urlSafePlusEncoded urlSafePlusEncodedChars {% join %}
	| urlSafePlusEncodedChars {% id %}

urlSafePlusEncodedChars
	-> "%" hexDigit hexDigit {% chars %}
	| "&" "a" "m" "p" ";" {% chars %}
	| urlSafeChar {% tokenValue %}

word
	-> word wordSafeChar {% join %}
	| wordStartChar {% id %}

wordSafeChar
	-> wordStartChar {% id %}
	| [0-9] {% tokenValue %}

wordStartChar
	-> [a-zA-Z$_] {% tokenValue %}

string
	-> "`" _escapedString "`"
        {% ([quote, string, quote2]) => join([tokenValue(quote), string, tokenValue(quote2)]) %}

_string
	-> null {% function() {return ""; } %}
	| _string _stringchar {% ([lhs, rhs]) => lhs + rhs %}

_stringchar
	-> [^\\"] {% id %}
	| "\\" [^] {% chars %}

hexDigit -> [0-9a-fA-F] {% id %}

urlSafe
	-> urlSafeChar:+ {% chars %}

urlSafeChar -> [a-zA-Z0-9\-] {% id %}

_escapedString
	-> _escapedString escapedChar {% chars %}
	| escapedChar {% id %}

escapedChar
	-> %space {% id %}
	| %any {% id %}
