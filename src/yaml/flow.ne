flowPushScope
  -> inlinePushScope {% id %}
  | disregardedIndentPushScope {% id %}

inlinePushScope
	-> "{" space:* {% ([indent, space]) => {
		return indent
  } %}

disregardedIndentPushScope
  -> "{" pushScope sol {% ([indent, ignoredIndent]) => {
		return indent
	} %}

flowPopScope
	-> (endLine dedent):? sol "}" {% ([eol, ignoredDedent, sol, dedent]) => null %}
  | space:* "}" {% ([sp, dedent]) => null %}

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

flowListScope
	-> flowListScope flowListConstructor
		{% ([array, item]) => {
			if (item){
				return [...array, item];
			}
			return array;
		} %}
	| flowListConstructor
		{% ([item]) => {
			return [ item ];
		} %}

flowListConstructor
	-> flowKey statement
  		{% ([key, scope]) => {
			  return scope
		} %}

flowKey
	-> ("," space:*):? literal space:* ":" {% ([w, key, w2, sep]) => key %}
