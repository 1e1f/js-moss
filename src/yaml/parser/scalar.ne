scalar
	-> "&":? _scalar {% ([anchor, scalar]) => {
				if (anchor){
					scalar[1].isAnchor = true;
				}
				return scalar;
			}
		%}

_scalar
  -> number {% ([v]) => [v, {number: true}] %}
	| chunkSequence {% ([str]) => {
		return [str, {scalar: true}]
	} %}

chunkSequence
	-> chunk chunkSequenceElement:+ {% ([head, tail]) => [head, ...tail].join('') %}
	| chunk {% id %}

chunkSequenceElement
	-> __ chunk {% join %}

chunk
	# -> chunk any {% join %}
	# server yaml characters ? ! & *
	-> startChunk continueChunk:* stopChunk {% ([head, middle, tail]) => {
		// console.log({head, middle, tail});
		return [head, ...middle, tail].join('');
		} %}
	| startChunk {% id %}

startChunk
	-> [a-zA-Z$_<>] {% ([tok]) => tok.value %}

continueChunk
	-> %any {% ([tok]) => tok.value %}

stopChunk
	-> [^: ] {% id %}

unquotedChar
	-> %any {% ([tok]) => tok.value %}

urlSafePlusEncoded
	-> urlSafePlusEncoded urlSafePlusEncodedChars {% join %}
	| urlSafePlusEncodedChars {% id %}

urlSafePlusEncodedChars
	-> "%" hexDigit hexDigit {% join %}
	| "&" "a" "m" "p" ";" {% join %}
	| urlSafeChar {% id %}

word
	-> word wordSafeChar {% join %}
	| wordStartChar {% id %}

wordSafeChar
	-> wordStartChar {% id %}
	| [0-9] {% ([tok]) => tok.value %}

wordStartChar
	-> [a-zA-Z$_] {% ([tok]) => tok.value %}

string
	-> "`" _escapedString "`"
        {% ([quote, string]) => string %}

_string
	-> null {% function() {return ""; } %}
	| _string _stringchar {% ([lhs, rhs]) => lhs + rhs %}

_stringchar
	-> [^\\"] {% id %}
	| "\\" [^] {% join %}

hexDigit -> [0-9a-fA-F] {% id %}

urlSafe
	-> urlSafe urlSafeChar {% join %}
	| urlSafeChar {% id %}

urlSafeChar -> [a-zA-Z0-9\-] {% ([tok]) => tok.value %}

_escapedString
	-> _escapedString escapedChar {% join %}
	| escapedChar {% id %}

escapedChar
	-> %space {% ([tok]) => tok.value %}
	| %any {% ([tok]) => tok.value %}
