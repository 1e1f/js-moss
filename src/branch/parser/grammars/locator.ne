@include "./query.ne"

start
	-> strip:* _ locators {%
		([strip, ws, code]) => code
		%}
	|  strip:* _ "?" queries {%
		([strip, ws, q, code]) => code
		%}

locators
	-> locators "," locator {%
		([bls, comma, bl]) => {
			const iter = Array.isArray(bls) ? bls : [bls];
			return [
				...iter,
				bl
		  ]
		}
	%}
	| locator {% id %}

locator
	-> locatorHead:? locatorTail:? {%
		([head, tail]) => {
			if (!head && !tail) return null;
		  return {
			...head,
			...tail
		  }
		}
	%}

locatorHead
 	-> _ disambiguatedChunk:? _ "::" locatorHead:? {%
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
	| _ caseInsensitiveChunk _ {% ([ ws, nameSegment ]) => ({nameSegment}) %}

locatorTail
	-> tailSegment:+ {%
		([segments]) => {
		  const locator = {};
		  for (const [key, segment] of segments) {
				if (segment){
					const existing = locator[key];
					if (existing){
						const set = locator[key + 's'];
						locator[key + 's'] = [...(set || [existing]), segment];
					} else {
						locator[key] = segment;
					}
				}
		  }
		  return locator;
		}
	%}

tailSegment
	-> versionSegment {% id %}
	| caseInsensitiveSegment {% id %}
	| disambiguatedSegment {% id %}

versionSegment
	-> [:] _ versionChunk _ {% ([ mark, ws, group]) => {
		return [symbolToSegmentKey(mark), group];
		} %}

caseInsensitiveSegment
  -> [~] _ caseInsensitiveChunk _ {% ([ mark, ws, group]) => {
		return [symbolToSegmentKey(mark), group];
		} %}

disambiguatedSegment
  -> [@] _ disambiguatedChunk _ {% ([ mark, ws, group]) => {
		return [symbolToSegmentKey(mark), group];
		} %}
