urlSafePlusEncoded
	-> urlSafePlusEncoded urlSafePlusEncodedChars {% join %}
	| urlSafePlusEncodedChars {% id %}

urlSafePlusEncodedChars
	-> "%" hexDigit hexDigit {% join %}
	| "&" "a" "m" "p" ";" {% join %}
	| urlSafeChar {% id %}

singleWord
	-> [a-zA-Z$_] [a-zA-Z0-9$_]:*
		{% singleWord %}

word
	-> word wordSafeChar {% join %}
	| wordStartChar {% id %}

wordSafeChar
	-> wordStartChar {% id %}
	| [0-9] {% ([tok]) => tok.value %}

wordStartChar
	-> [a-zA-Z$_] {% ([tok]) => tok.value %}

string
	-> "`" _escapedString "`":?
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
