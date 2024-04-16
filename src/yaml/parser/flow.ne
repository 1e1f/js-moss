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

flowMappingScope -> flowPairConstructor:+ {% id %}

flowPairConstructor
	# nested block mapping
	-> flowKey _ flowToBlockScope
  		{% ([key, sep, scope]) => {
			console.log('flow => nestedBlockScope', key, scope);
			return [key, scope];
		} %}

	# default map pair, rhs is a expression
	| flowKey _ expression
  		{% ([key, sep, expression]) => {
				console.log('flow pair', [key[0], expression[0]]);
				return [key, expression]
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

flowSequenceScope -> flowSequenceConstructor:+ {% ([seq]) => {
	return new Sequence(seq);
} %}

sequenceToBlockMapping
  -> flowKey _ flowToBlockScope {% ([key, sep, scope]) => {
    console.log('sequenceToBlockMapping', key);
		return new Mapping(scope)
		} %}

flowSequenceConstructor
	-> ("," _):? (expression | flowNestedScope | flowNestedSequence | sequenceToBlockMapping)
  		{% ([key, sequenceStatement]) => {
          return sequenceStatement
		} %}

flowKey
	-> ("," _):? expression _ ":" {% ([w, key, w2, sep]) => key %}
