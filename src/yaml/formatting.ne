# Formatting
pushScope
	-> endLine indent {% ([eol, indent]) => {
		console.log('indent', indent)
		return indent;
	 } %}

popScope
	-> dedent {% id %}

endLine
	-> space:* comment {% id %}
	| space:* eol {% id %}

comment
	-> "#" _escapedString:? %eol {% ([operator, comment]) => (comment) %}

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
