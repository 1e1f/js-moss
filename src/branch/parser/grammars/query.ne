@include "./shared.ne"

start
	-> (strip:*) all {%
		([ws, q]) => q
		%}

all
	-> blQuery queries:? {% ([ query, queries]) => (queries ? { ...queries, ...query} : query) %}
	| queries {% ([ queries]) => queries %}

queries
	-> query:+ {% ([queries]) => {
		const all = {};
		for (const pair of queries){
			all[pair[0]] = pair[1]
		}
		return all;
	} %}

query
	-> [$\^] blQuery {%
	([prefix, blQuery]) => {
		return [prefixes[prefix] || 'bl', blQuery];
	} %}
	| "?" astQuery {%
		([prefix, query]) => [prefixes[prefix] , query]
	   %}

astQuery
	-> caseInsensitiveChunk {% id %}

blQuery
	-> queryHead:? queryTail {%
		([head, tail]) => {
			if (!head && !tail) return null;
			return ({
				...head,
				...tail,
		  })
		}
	%}
	| queryHead {% id %}

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
