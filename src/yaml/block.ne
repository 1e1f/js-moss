

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

	| sol eol {% nuller %}
	| sol comment {% nuller %}

blockSep
  -> space:* {% nuller %}

blockKey
	-> sol:? literal ":" {% ([sol, key, sep]) => key %}

blockListConstructor
	-> "-" space statement endLine
  		{% ([key, scope]) => {
			  return scope
		} %}

	| sol eol {% nuller %}
	| sol comment {% nuller %}
