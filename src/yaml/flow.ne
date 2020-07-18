flowPushScope
  -> inlinePushScope {% id %}
  | disregardedIndentPushScope {% id %}

inlinePushScope
	-> ("{") space:* {% ([indent, space]) => {
		return indent
  } %}

disregardedIndentPushScope
  -> ("{") pushScope sol {% ([indent, ignoredIndent]) => {
		return indent
	} %}

flowPopScope
	-> (endLine dedent):? sol ("}") {% ([eol, ignoredDedent, sol, dedent]) => null %}
  | space:* ("}") {% ([sp, dedent]) => null %}

blockToFlowScope
  -> flowNestedScope {% id %}

flowNestedScope
  -> flowPushScope flowMappingScope flowPopScope {% ([push, scope]) => {
		return scope
		} %}

flowMappingScope
  -> flowMappingScope flowPairConstructor {% addPairToMap %}
	| flowPairConstructor {% createMap %}

flowPairConstructor
	# nested block mapping
	-> flowKey flowSep flowToBlockScope
  		{% ([key, sep, scope]) => {
			console.log('flow => nestedBlockScope', key, scope);
			return [key, scope];
		} %}

	# default map pair, rhs is a statement
	| flowKey flowSep statement
  		{% ([key, sep, statement]) => {
				console.log('flow pair', [key[0], statement[0]]);
				return [key, statement]
			} %}

flowSep
  -> space:* {% nuller %}
	# | endLine {% nuller %}

flowPushSequence
  -> inlinePushSequence {% id %}
  | disregardedIndentedSequence {% id %}

inlinePushSequence
	-> ("[") space:* {% ([indent, space]) => {
		return indent
  } %}

disregardedIndentedSequence
  -> ("[") pushScope sol {% ([indent, ignoredIndent]) => {
		return indent
	} %}

flowPopSequence
	-> (endLine dedent):? sol ("]") {% ([eol, ignoredDedent, sol, dedent]) => null %}
  | space:* ("]") {% ([sp, dedent]) => null %}

blockToFlowSequence
  -> flowNestedSequence {% id %}

flowNestedSequence
  -> flowPushSequence flowSequenceScope flowPopSequence {% ([push, scope]) => {
		return scope
		} %}

flowSequenceScope
  -> flowSequenceScope flowSequenceConstructor {% appendToSequence %}
  | flowSequenceConstructor {% createFlowSequence %}

sequenceToBlockMapping
  -> flowKey flowSep flowToBlockScope {% ([key, sep, scope]) => {
    console.log('sequenceToBlockMapping', key);
		return createMap([key, scope])
		} %}

flowSequenceConstructor
	-> ("," space:*):? (literal | flowNestedScope | sequenceToBlockMapping)
  		{% ([key, sequenceStatement]) => {
          return sequenceStatement
		} %}

flowKey
	-> ("," space:*):? literal space:* ":" {% ([w, key, w2, sep]) => key %}
