flowToBlockScope
	-> blockNestedScope {% id %}

blockNestedScope
	-> pushScope blockScope popScope {% ([push, scope]) => {
		return scope
		} %}

blockNestedSequence
	-> pushScope blockSequence popScope {% ([push, scope]) => {
		return scope
		} %}

blockSequence
    -> (sol blockSequenceItem):+ {% ([items], ref) => {
		const s = new Sequence(items.map(([sol, item]) => item));
		s.source.flow = Flow.block;
		return s;
	} %}

blockSequenceItem
	-> bullet expression
			{% ([key, expression]) => {
					return expression
				} %}
	| comment {% id %}
	| endLine {% id %}

blockScope
  # -> (sol kvPair):+ {% ([lines], ref, fail) => {
	# 		const pairs = lines.map(([sol, pair]: any) => pair);
	# 		console.log('+map', pairs);
	# 		const map = createMap([pairs]);
	# 		return map;
	#  } %}
	-> blockMapping {% id %}
  	# | blockSequence {% id %}
	# | sol expression {% second %}
# if a scope has been started inline,
# and needs indent afterwards

blockMapping
	-> blockMappingLine:+ {% ([pairs]) => {
		const m = new Mapping(pairs);
		m.source.flow = Flow.block;
		return m;
	} %}

blockMappingLine
	-> sol kvPair {% second %}
	| sol endLine {% second %}

expression
	-> identifier endLine {% ([identifier, endl]) => {
		if (endl){
			identifier.source.expandWithMap(endl);
		}
		return identifier;
	} %}
	# | bullet expression {% second %}
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

anchor 
  -> "&" chunk {% ([tok, sequence]) => join([tokenValue(tok), sequence]) %}

kvPair
	# nested block
	-> blockKey anchor:? blockNestedScope
  		{% ([key, anchor, value]) => {
			return new Pair(key, value);
		} %}

	# default map pair, rhs is a expression
	| blockKey __ expression
  		{% ([key, sep, value]) => {
			return new Pair(key, value);
		} %}

	# null / undefined pair. Does yaml support undefined?
	# | blockKey nullOrNestedSequence
	# 	{% ([key, nullOrNestedSequence], ref) => {
	# 			return new Pair(key, nullOrNestedSequence);
	# 	} %}
	
	# nested flow pair
	| blockKey __ blockToFlowScope
  		{% ([key, sep, flow]) => {
			return new Pair(key, flow);
		} %}

	| blockKey __ blockToFlowSequence
  		{% ([key, sep, flow, comment]) => {
			return new Pair(key, flow);
		} %}

blockKey
	-> identifier ":" {% id %}

bullet
	-> "-" space {% first %}
