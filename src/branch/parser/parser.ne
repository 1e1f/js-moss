@preprocessor typescript
@builtin "whitespace.ne"

@{%
		function join(sequence: string[]) {
			// console.log('join', sequence)
			if (sequence.length == 1) {
					return sequence[0];
			}
			let memo = '';
			for (const item of sequence) {
					memo = memo + (item || ' ');
			}
			return memo;
		}

		const stringOfSame = ([tokens]: string[][]) => tokens.join('');
		const stringAppendAfterGap = ([first, gap, next]) => first + gap.join('') + next;
		const pair = ([first, next]: string[]) => [first, next];
		const token = ([tok]: string[]) => tok;
		const symbolToSegmentKey = (symbol: string) => {
			switch (symbol){
						case '~': return 'projectSegment';
						case '@': return 'organizationSegment';
						case ':': return 'versionSegment';
					}
			}
%}

fileStart
	-> [\u200B-\u200D\uFEFF]:? branchLocators {%
		([startChar, code]) => code
		%}

branchLocators
	-> branchLocators _ "," branchLocator {%
		([bls, ws, comma, bl]) => {
			const iter = Array.isArray(bls) ? bls : [bls];
			return [
				...iter,
				bl
		  ]
		}
	%}
	| branchLocator {% id %}

branchLocator
	-> head:? _ tail:? {%
		([head, ws, tail]) => {
			if (!head && !tail) return null;
		  return {
				...head,
				...tail,
		  }
		}
	%}

head
 	-> (orgGroup | "-"):? _ "::" head:? {%
		([context, ws, mark, pathObject]) => {
			if (!context && !pathObject){
				return {};
			}
			if (!context) return pathObject;
			const [contextSegment] = context;
			if (!pathObject) return { contextSegment }
		  return {
			contextSegment,
			...pathObject,
		  }
		}
	%}

	| _ nameSegment {% ([ws, nameSegment]) => nameSegment %}

nameSegment
	-> fileName {% ([nameSegment]) => {
		if (!nameSegment) return {}
		return {nameSegment}
		} %}

fileName
	-> fileName gap fileWord {% join %}
	| fileWord {% id %}

fileWord
	-> fileChar:+ {% stringOfSame %}

fileChar
	-> numberChar {% id %}
	| alphaChar {% id %}
	| alphaSeparator {% id %}

tail
	-> markedSegment:+ {%
		([segments]: string[][][]) => {
		  const locator: any = {};
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

markedSegment
  -> [@~:] _ (orgGroup | "-") _ {% ([ mark, ws, [group]]) => {
		return [symbolToSegmentKey(mark), group];
		} %}

orgGroup
 	-> orgChunk gap:+ orgGroup {% stringAppendAfterGap %}
	| orgChunk {% id %}

orgChunk
	-> number name number {% join %}
	| name number {% join %}
	| number name {% join %}
	| name {% join %}
	| number {% join %}

gap
  -> __ {% id %}
  | [/] {% token %}

number
	-> numberChar:+ {% stringOfSame %}

numberChar
	-> [0-9] {% token %}

name
	-> alphaChunk alphaSeparator name {% join %}
	| alphaChunk {% id %}

alphaSeparator
  -> "-" {% token %}

alphaChunk
	-> alphaChar:+ {% stringOfSame %}

alphaChar
	-> [a-zA-Z] {% token %}

# Now using builtin for these tokens
# __
# 	-> " ":+ {% ([tokens]) => {
# 				let spaces = '';
# 				for (const i of tokens){
# 					spaces += ' ';
# 				}
# 				return spaces;
# 			} %}

# _
# 	-> " ":* {% ([tokens]) => {
# 				return null;
# 			} %}
