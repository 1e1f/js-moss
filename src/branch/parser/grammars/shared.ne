@preprocessor typescript
@builtin "whitespace.ne"

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


		const prefixes = {
			"?": "ast",
			"$": "kind",
			"^": "deps"
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
 	-> caseInsensitiveChunk gap caseInsensitiveString {% ([lhs, gap, rhs]) => lhs + rhs %}
	| caseInsensitiveChunk _ nonSemanticDivider _ caseInsensitiveString {% ([lhs, ws, exp, ws2, rhs]) => lhs + rhs %}
	| caseInsensitiveChunk _ semanticDivider _ caseInsensitiveString {% ([lhs, ws, exp, ws2, rhs]) => lhs + exp + rhs %}
	| caseInsensitiveString {% id %}

disambiguatedChunk
 	-> disambiguatedChunk gap disambiguatedString {% ([lhs, gap, rhs]) => lhs + rhs %}
	| disambiguatedChunk _ nonSemanticDivider _ disambiguatedString {% ([lhs, ws, exp, ws2, rhs]) => lhs + rhs %}
	| disambiguatedChunk _ semanticDivider _ disambiguatedString {% ([lhs, ws, exp, ws2, rhs]) => lhs + exp + rhs %}
	| disambiguatedString {% id %}

gap
  -> __ {% id %}

semanticDivider
	-> [/] {% token %}

nonSemanticDivider
  -> [-'.] {% token %}

disambiguatedString
	-> disambiguatedChar:+ {% stringOfSame %}

caseInsensitiveString
	-> caseInsensitiveChar:+ {% stringOfSame %}

disambiguatedChar
	-> [a-zA-Z0-9] {% ([token]) => {
	const r = reserveMap[token];
	return (r != undefined ? r : token.toLowerCase())
} %}

caseInsensitiveChar
	-> [a-zA-Z0-9] {% ([token]) => token.toLowerCase() %}

versionChunk
	-> versionChunk versionDivider versionString {% join %}
	| versionString {% id %}

versionString -> versionChar:+ {% stringOfSame %}
versionChar
	-> [a-zA-Z0-9] {% ([token]) => token.toLowerCase() %}

versionFlag
	-> [\^~] {% token %}

versionDivider
	-> [-.] {% token %}

strip
	-> [\u200B-\u200D\uFEFF] {% id %}
