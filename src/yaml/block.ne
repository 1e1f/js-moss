

flowToBlockScope
	-> blockNestedScope  {% id %}

blockNestedScope
	-> pushScope blockScope popScope {% ([push, scope]) => {
		return scope
		} %}

blockScope
	-> blockScope blockPairConstructor {% addPairToMap %}
	| blockPairConstructor {% createMap %}

blockPairConstructor
	# nested block
	-> blockKey blockSep blockNestedScope
  		{% ([key, sep, scope]) => {
			console.log('nestedBlockScope', key, scope);
			return [key, scope];
		} %}

	# default map pair, rhs is a statement
	| blockKey blockSep statement endLine
  		{% ([key, sep, statement]) => {
				console.log('block pair', [key[0], statement[0]]);
				return [key, statement]
			} %}

	# nested flow pair
	| blockKey blockSep blockToFlowScope endLine
  		{% ([key, sep, flow]) => {
        console.log('block => flow pair', key[0], flow);
				return [key, flow]
			} %}

	| bullet listStatement
    {% ([key, listStatement]) => {
        console.log('indexed pair', listStatement);
				return [['-', {type: 'bullet'}], listStatement]
			} %}
	| sol eol {% nuller %}
	| sol comment {% nuller %}

listStatement
  -> statement endLine
  		{% ([key, statement]) => {
        statement
			} %}
  | blockScope {% id %}

blockSep
  -> space:* {% nuller %}

blockKey
	-> sol:? literal ":" {% ([sol, key, sep]) => key %}

bullet
	-> sol:? "-" space {% ([sol, key, sep]) => key %}
