# Formatting
pushScope
	-> endLine indent {% ([eol, indent]) => {
		return indent;
	 } %}

popScope
	-> dedent {% null %}

endLine
	-> __ comment {% second %}
	| _ eol {% nuller %}

comment
	-> "#" _escapedString:? %eol {%
		([hash, comment]) => {
			console.log({comment});
			 return [comment || '', {isComment: true}]
		} %}

# syntactic whitespace
sof -> %sof {% ([tok]) => tok.value %}
eof -> %eof {% ([tok]) => tok.value %}
sol -> %sol {% ([tok]) => tok %}
eol -> %eol {% ([ws, tok]) => tok %}
indent
	-> %indent {% ([tok]) => tok %}
dedent
	-> %dedent {% ([tok]) => tok %}
space -> %space {% ([tok]) => tok.value %}

__
	-> %space:+ {% ([tokens]) => {
				let spaces = '';
				for (const i of tokens){
					spaces += ' ';
				}
				return spaces;
			} %}

# ignored whitespace or chars
_
	-> _ space {% ([e]) => {
			return e ? e + ' ': null;
		} %}
	| null {% () => null %}
