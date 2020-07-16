
# statement
statement
	-> concat {% id %}

# Operators

concat
	-> concat space boolean {% fork %}
	| boolean {% id %}

boolean
	-> boolean space ( "n" | "|" ) space add {% operate %}
	| add {% id %}

add
	-> add space ( "+"|"-" ) space multiply {% operate %}
	| multiply {% id %}

multiply
	-> multiply space ("*"|"/") space unaryPrefix {% operate %}
	| unaryPrefix {% id %}

unaryPrefix
	-> "+" group {% unaryOperate %}
	| "-" group {% unaryOperate %}
	| "!" group {% unaryOperate %}
	| group {% id %}

group
	-> "(" concat ")" {% ([_, g]) => g %}
	| pair {% id %}

pair
	-> context literal {% ([c, [r, r_]]) => [r, {...r_, ...c}] %}
	| literal {% id %}

literal
	-> string {% ([v]) => [v, {string: true}] %}
	| singleWord {% ([v]) => [v, {string: true}] %}
	| uri {% ([v]) => [v, {uri: true}] %}
	| number {% ([v]) => [v, {number: true}] %}
