number
	-> _number {% ([n]) => {
		console.log('number', n); return parseFloat(n) } %}

_number
	-> _float "e" digit {% join %}
 	| _float {% id %}

_float
	-> digit "." digit {% join %}
	| digit {% id %}

digit
	-> digit [0-9] {% join %}
	| [0-9] {% ([tok]) => tok.text %}
