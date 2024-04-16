# Formatting
pushScope
	-> endLine indent {% ([comment, _]) => {
		return [comment];
	 } %}

popScope
	-> dedent {% nuller %}

endLine
	-> __ comment {% second %}
	| eol {% nuller %}

comment
	-> "#" _escapedString:? eol {%
		([hash, comment]) => {
			if (comment){
				const [text, sm] = join([tokenValue([hash]), comment]);
				return new Comment(comment, sm);
			}
			const [_, sm] = tokenValue([hash]);
			return new Comment(null, sm);
		} %}

# syntactic whitespace
sof -> %sof {% tokenValue %}
eof -> %eof {% tokenValue %}
sol -> %sol {% tokenText %}
eol -> %eol {% tokenText %}
indent
	-> %indent {% tokenText %}
dedent
	-> %dedent {% tokenText %}
space -> %space {% tokenValue %}

__
	-> %space:+ {% chars %}

# ignored whitespace or chars
_
	-> %space:* {% chars %}
