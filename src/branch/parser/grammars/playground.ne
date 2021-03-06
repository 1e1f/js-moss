# shared.ne
@builtin "whitespace.ne"

@{%
		const mongoKeysMap = {
		  not: '$ne',
		  or: '$in',
		}

		const queryAstToMongo = (current, parentKey, parent) => {
		  const res = Array.isArray(current) ? [] : {};
		  let target = res;
		  for (const k of Object.keys(current)) {
			let v = current[k];
			let nextKey = mongoKeysMap[k] || k;
			if (parentKey == '$ne') {
			  if (nextKey == '$in') {
				delete parent[parentKey];
				nextKey = '$nin';
				target = parent;
			  }
			}
			  if (v == "-"){
				  if (k == "not"){
					  return {$exists: true}
				  }
				  v = { $exists: false}
			  }
			if (typeof v === 'object') {
			  if (parentKey == '$in') {
				throw new Error("use of nested operator (like !) requires a group, i.e. !(a|b) instead of (a|!b) which mixes inclusive/exclusive operators");
			  }
			  const next = queryAstToMongo(v, nextKey, res);
			  if (typeof next === 'object' && (next.length || Object.keys(next).length)) {
				console.log('assign', v, next)

				target[nextKey] = next;
			  }
			}
			else target[nextKey] = v;
		  }
		  return res;
		}


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

#
# locator.ne
#


start
	-> (strip:* _) queries{%
		([ws, q]) => q
		%}

queries
	-> queries "," query {%
		([bls, comma, bl]) => {
			const iter = Array.isArray(bls) ? bls : [bls];
			return [
				...iter,
				bl
		  ]
		}
	%}
	| query {% id %}

query
	-> blQuery ("$" blQuery):? {%
		([blQuery, schemaQuery]) => schemaQuery ? {...blQuery, kind: schemaQuery[1]} : blQuery %}

blQuery
	-> queryHead:? queryTail:? {%
		([head, tail]) => {
			if (!head && !tail) return null;
			return  queryAstToMongo({
				...head,
				...tail,
		  })
		}
	%}

queryHead
 	-> _ caseInsensitiveQuery:? _ "::" queryHead:? {%
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


#shared ebnf

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
  -> [-&'.] {% token %}

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
