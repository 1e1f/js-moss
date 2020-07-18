

flowToBlockScope
	-> blockNestedScope {% id %}

blockNestedScope
	-> pushScope blockScope popScope {% ([push, scope]) => {
		return scope
		} %}

blockScope
  -> blockMapping {% id %}
  | blockSequence {% id %}

blockMapping
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

	| blockKey blockSep blockToFlowSequence endLine
  		{% ([key, sep, flow]) => {
        console.log('block => flow sequence', key[0], flow);
				return [key, flow]
			} %}

	| blockSequenceConstructor
    {% id %}

	| sol eol {% nuller %}
	| sol comment {% nuller %}

blockSequence
	-> blockSequence blockSequenceConstructor {% appendToSequence %}
	| blockSequenceConstructor {% createBlockSequence %}

blockSequenceConstructor
	-> bullet sequenceStatement
    {% ([key, sequenceStatement]) => {
        console.log('indexed pair', sequenceStatement);
				return [['-', {type: 'bullet'}], sequenceStatement]
			} %}

sequenceStatement
  -> statement endLine
  		{% ([statement]) => {
        return statement
			} %}
  | blockNestedScope {% id %}
  | blockScope {% id %}

blockSep
  -> space:* {% nuller %}

blockKey
	-> sol:? literal ":" {% ([sol, key, sep]) => key %}

bullet
	-> sol:? "-" space {% ([sol, key, sep]) => key %}
