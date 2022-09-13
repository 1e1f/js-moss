@preprocessor typescript
@builtin "whitespace.ne"

start
	-> (strip:* _) query{%
		([ws, q]) => q
		%}

query
	-> blQuery ("$" blQuery):? {%
		([blQuery, schemaQuery]) => schemaQuery ? {...blQuery, kind: schemaQuery[1]} : blQuery %}

blQuery
	-> queryHead:? queryTail:? {%
		([head, tail]) => {
			if (!head && !tail) return null;
			return ({
				...head,
				...tail,
		  })
		}
	%}

queryHead
 	-> _ disambiguatedQuery:? _ "::" queryHead:? {%
		([ws, contextSegment, ws2, mark, nameSegmentPart]) => {
			if (!contextSegment && !nameSegmentPart){
				return {};
			}
			if (!contextSegment) return nameSegmentPart;
			if (!nameSegmentPart) return { contextSegment }
		  return {
			contextSegment,
			...nameSegmentPart
		  }
		}
	%}
	| _ caseInsensitiveQuery _ {% ([ ws, nameSegment ]) => ({nameSegment}) %}

queryTail
	-> queryTailSegment:+ {%
		([segments]) => {
		  const locator = {};
		  for (const [key, value] of segments) {
				if (value){
					const existing = locator[key];
					if (existing){
						const set = locator[key + 's'];
						locator[key + 's'] = [...(set || [existing]), value];
					} else {
						locator[key] = value;
					}
				}
		  }
		  return locator;
		}
	%}

queryTailSegment
	-> disambiguatedQuerySegment {% id %}
	| caseInsensitiveQuerySegment {% id %}
	| versionQuerySegment {% id %}

disambiguatedQuerySegment
  -> [@] _ disambiguatedQuery _ {% ([ mark, ws, group]) => {
		return [symbolToSegmentKey(mark), group];
		} %}

caseInsensitiveQuerySegment
  -> [~] _ caseInsensitiveQuery _ {% ([ mark, ws, group]) => {
		return [symbolToSegmentKey(mark), group];
		} %}

disambiguatedQuery
	-> "!" disambiguatedQueryGroup {% ([ not, group]) => {
			return { not: group }
		} %}
	| disambiguatedQueryGroup {% id %}

disambiguatedQueryGroup
  -> disambiguatedQueryGroup _ [|] _ disambiguatedChunk {% queryOp %}
	| disambiguatedChunk {% id %}
	| "-" {% token %}

caseInsensitiveQuery
	-> "!" caseInsensitiveQueryGroup {% ([ not, group]) => {
			return { not: group }
		} %}
	| caseInsensitiveQueryGroup {% id %}

caseInsensitiveQueryGroup
  -> caseInsensitiveQueryGroup _ [|] _ caseInsensitiveChunk {% queryOp %}
	| caseInsensitiveChunk {% id %}
	| "-" {% token %}

versionQuerySegment
	-> [:] _ versionQuery _ {% ([ mark, ws, group]) => {
		return [symbolToSegmentKey(mark), group];
		} %}

versionQuery
	-> versionFlag:? versionChunk {% join %}


@{%
		function join(sequence) {
			// console.log('join', sequence)
			if (sequence.length == 1) {
					return sequence[0];
			}
			let memo = '';
			for (const item of sequence) {
					memo = memo + (item || '');
			}
			return memo;
		}


		const glyphGroup = {
			i: "i",
			o: "o"
		}

		const reserveMap = {
			0: glyphGroup.o,
			O: glyphGroup.o,
			o: glyphGroup.o,
			l: glyphGroup.i,
			I: glyphGroup.i,
			L: glyphGroup.i,
			i: glyphGroup.i,
			1: glyphGroup.i,
		}

		const stringOfSame = ([tokens]) => tokens.join('');
		const token = ([tok]) => tok;
		const symbolToSegmentKey = (symbol) => {
			switch (symbol){
						case '~': return 'projectSegment';
						case '@': return 'organizationSegment';
						case ':': return 'versionSegment';
						default: return 'nameSegment';
					}
			}

		const queryOp =  ([ lhs, ws, op, ws2, rhs]) => {
			if (op == "|") {
				if (lhs.or) {
					lhs.or = [...lhs.or, rhs]
					return lhs;
				}
				return {or: [lhs, rhs]};
			} if (op == "&") {
				if (lhs.and) {
					lhs.and = [...lhs.and, rhs]
					return lhs;
				}
				return {and: [lhs, rhs]};
			}
		}
%}


caseInsensitiveChunk
 	-> caseInsensitiveChunk gap caseInsensitiveChunk {% join %}
	| caseInsensitiveChunk _ nonSemanticDivider _ caseInsensitiveString {% join %}
	| caseInsensitiveChunk _ semanticDivider _ caseInsensitiveString {% join %}
	| caseInsensitiveChunk _ nonSemanticDivider {% join %}
	| caseInsensitiveString {% id %}

disambiguatedChunk
 	-> disambiguatedChunk gap disambiguatedChunk {% join %}
	| disambiguatedChunk _ nonSemanticDivider _ disambiguatedString {% join %}
	| disambiguatedChunk _ semanticDivider _ disambiguatedString {% join %}
	| disambiguatedChunk _ nonSemanticDivider {% join %}
	| disambiguatedString {% id %}

gap
  -> __ {% () => " " %}

semanticDivider
	-> [/] {% token %}

nonSemanticDivider
  -> [-'.&_] {% token %}

disambiguatedString
	-> disambiguatedChar:+ {% stringOfSame %}

caseInsensitiveString
	-> caseInsensitiveChar:+ {% stringOfSame %}

disambiguatedChar
	-> [a-zA-Z0-9] {% token %}

caseInsensitiveChar
	-> [a-zA-Z0-9] {% token %}

versionChunk
	-> versionChunk versionDivider versionString {% join %}
	| versionString {% id %}

versionString -> versionChar:+ {% stringOfSame %}
versionChar
	-> [a-zA-Z0-9] {% token %}

versionFlag
	-> [\^~] {% token %}

versionDivider
	-> [-.] {% token %}

strip
	-> [\u200B-\u200D\uFEFF] {% id %}
