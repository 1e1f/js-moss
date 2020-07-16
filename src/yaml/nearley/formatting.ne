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