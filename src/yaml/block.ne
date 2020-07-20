flowToBlockScope
	-> blockNestedScope {% id %}

blockNestedScope
	-> pushScope blockScope popScope {% ([push, scope]) => {
		return scope
		} %}

blockScope
  # -> (sol kvPair):+ {% ([lines], ref, fail) => {
	# 		const pairs = lines.map(([sol, pair]: any) => pair);
	# 		console.log('+map', pairs);
	# 		const map = createMap([pairs]);
	# 		return map;
	#  } %}
	-> blockMapping {% id %}
  | blockSequence {% id %}
	| sol statement {% second %}
# if a scope has been started inline,
# and needs indent afterwards

blockMapping
	-> sol kvPair (lineBreak:* sol kvPair):* {% ([sol, head, tail]) => {
		if (tail && tail.length){
			return addPairToMap([head, tail.map(([br, sol, i]: any) => i)]);
		}
			return createMap([[head]]);
	} %}

blockSequence
	-> sol blockSequenceItem (lineBreak:* sol blockSequenceItem):* {% ([sol, head, tail]) => {
		if (tail && tail.length){
			return appendToSequence([head, tail.map(([br, sol, i]: any) => i)]);
		}
			return createBlockSequence([[head]]);
	} %}

rhsNode
	-> statement {% id %}
	# | bullet rhsNode {% second %}
	# | bullet (statement | kvPair) (indent blockSequenceItem:+ dedent)
	# {% ([key, firstItem, nested]) => {
	# 	console.log('bs <= bs', firstItem);
	# 	if (nested){
	# 		const [indent, tail] = nested;
	# 			return createBlockSequence([firstItem, ...tail]);
	# 	}
	# 	return createBlockSequence([firstItem]);
	# } %}
	# | kvPair pushScope kvPair:+ {% ([head, indent, ...tail]) => {
	# 	console.log('bs <= bm');
	# 	return createMap([head, ...tail]);
	# } %}

statement
	-> scalar endLine {% first %}

kvPair
	# nested block
	-> blockKey blockNestedScope
  		{% ([key, scope]) => {
			console.log('k: block', key[0], scope);
			return [key, scope];
		} %}

	# default map pair, rhs is a scalar
	| blockKey __ scalar endLine
  		{% ([key, sep, scalar]) => {
				console.log('k: v', [key[0], scalar[0]]);
				return [key, scalar]
			} %}

	# null / undefined pair. Does yaml support undefined?
	| blockKey nullOrNestedSequence
		{% ([key, nullOrNestedSequence], ref) => {
						return [key, nullOrNestedSequence]
					} %}
	# nested flow pair
	| blockKey __ blockToFlowScope endLine
  		{% ([key, sep, flow]) => {
        console.log('k: {}', key[0], flow);
				return [key, flow]
			} %}

	| blockKey __ blockToFlowSequence endLine
  		{% ([key, sep, flow]) => {
        console.log('k: <= []', key[0], flow);
				return [key, flow]
			} %}

	# item is sequence starting on next line

lineBreak
	-> endLine {% nuller %}
	| comment {% nuller %}

# this is strange but it allows for sequence to
# take priority overempty key
nullOrNestedSequence
	-> nullOrNestedSequence sol blockSequenceItem {% ([list, sol, item], ref) => {
				const [ v, ctx ] = list;
				if (ctx.isIterable){
					return appendToSequence([list, item]);
				} else if (item) {
					return createBlockSequence([[item]]);
				}
		} %}
	| endLine
	{% ([endLine], ref, fail) => {
		const nullValue = [null, {empty: true}]
		return nullValue;
	} %}

blockSequenceItem
	-> bullet statement
			{% ([key, rhsNode]) => {
					return rhsNode
				} %}
	| comment {% id %}
	| eol {% nuller %}

blockKey
	-> scalar ":" {% ([key, sep]) => key %}

bullet
	-> "-" space {% first %}
