flowPushScope
  -> inlinePushScope {% id %}
  | disregardedIndentPushScope {% id %}

inlinePushScope
	-> ("{") _ {% ([indent, space]) => {
		return indent
  } %}

disregardedIndentPushScope
  -> ("{") pushScope sol {% ([indent, ignoredIndent]) => {
		return indent
	} %}

flowPopScope
	-> (endLine dedent):? sol ("}") {% ([eol, ignoredDedent, sol, dedent]) => dedent %}
  | _ "}" {% ([sp, dedent]) => dedent %}

blockToFlowScope
  -> flowNestedScope {% id %}

flowNestedScope
  -> flowPushScope flowMappingScope flowPopScope {% ([push, scope]) => {
		return scope
		} %}

flowMappingScope -> flowPairConstructor:+ {% createMap %}

flowPairConstructor
	# nested block mapping
	-> flowKey _ flowToBlockScope
  		{% ([key, sep, scope]) => {
			console.log('flow => nestedBlockScope', key, scope);
			return [key, scope];
		} %}

	# default map pair, rhs is a scalar
	| flowKey _ scalar
  		{% ([key, sep, scalar]) => {
				console.log('flow pair', [key[0], scalar[0]]);
				return [key, scalar]
			} %}

flowPushSequence
  -> inlinePushSequence {% id %}
  | disregardedIndentedSequence {% id %}

inlinePushSequence
	-> ("[") _ {% ([indent, space]) => {
		return indent
  } %}

disregardedIndentedSequence
  -> ("[") pushScope sol {% ([indent, ignoredIndent]) => {
		return indent
	} %}

flowPopSequence
	-> (endLine dedent):? sol ("]") {% ([eol, ignoredDedent, sol, dedent]) => null %}
  | _ ("]") {% ([sp, dedent]) => null %}

blockToFlowSequence
  -> flowNestedSequence {% id %}

flowNestedSequence
  -> flowPushSequence flowSequenceScope flowPopSequence {% ([push, scope]) => {
		return scope
		} %}

flowSequenceScope -> flowSequenceConstructor:+ {% createFlowSequence %}

sequenceToBlockMapping
  -> flowKey _ flowToBlockScope {% ([key, sep, scope]) => {
    console.log('sequenceToBlockMapping', key);
		return createMap([key, scope])
		} %}

flowSequenceConstructor
	-> ("," _):? (scalar | flowNestedScope | flowNestedSequence | sequenceToBlockMapping)
  		{% ([key, sequenceStatement]) => {
          return sequenceStatement
		} %}

flowKey
	-> ("," _):? scalar _ ":" {% ([w, key, w2, sep]) => key %}
