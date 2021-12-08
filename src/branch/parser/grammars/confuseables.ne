map
	-> map statement {% ([map, l]) => ({...map, [l[0]]: l[1] }) %}
	| map comment {% ([map]) => map %}
	| statement {% ([p]) => ({ [p[0]] : p[1]}) %}
	| comment {% () => ({}) %}

statement -> _ hexGroup semi hexGroup semi kind _ comment {% ([ws, key, ks, value, vs, kind, comment]) => [key, value] %}

semi -> _ ";" _ {% () => null %}

hexGroup
	-> hex {% ([a]) => String.fromCodePoint('0x'+ a) %}
	| hexGroup " " hex {% ([a, ws, b]) => String.fromCodePoint('0x'+ a + b) %}

hex -> [a-fA-F0-9]:+ {% ([a]) => a.join('') %}

kind -> [a-zA-Z]:+ {% () => null %}

comment -> "#" .:* [\n] {% () => null %}

_ -> [\s]:* {% function(d) {return null } %}
