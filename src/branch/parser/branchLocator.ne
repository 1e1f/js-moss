@{%
		function join(sequence) {
			// console.log('join', sequence)
			if (sequence.length == 1) {
					return sequence[0];
			}
			let memo = '';
			for (const item of sequence) {
					memo = memo + item;
			}
			return memo;
		}

		const stringOfSame = ([tokens]) => tokens.join('');
		const stringAppendAfterGap = ([first, gap, next]) => first + gap + next;
		const pair = ([first, next]) => [first, next];
		const token = ([tok]) => tok;
		const symbolToSegmentKey = (symbol) => {
			switch (symbol){
						case '|': return 'projectSegment';
						case '@': return 'organizationSegment';
						case ':': return 'versionSegment';
					}
			}
%}

branchLocator
	-> head tail:? {%
		([head, tail]) => {
		  return {
			...head,
			...tail,
		  }
		}
	%}

head
 	-> segmentGroup "::" head {%
		([value, mark, pathObject]) => {
		  return {
			namespaceSegment: value,
			...pathObject,
		  }
		}
	%}
	| segmentGroup {% ([value]) => {
		return {pathSegment: value}
		} %}

tail
	-> markedSegment:+ {%
		([segments]) => {
		  const locator = {};
		  for (const [key, value] of segments) {
			  const existing = locator[key];
			  if (existing){
				  const set = locator[key + 's'];
				  locator[key + 's'] = [...(set || [existing]), value];
			  } else {
				  locator[key] = value;
			  }
		  }
		  return locator;
		}
	%}

markedSegment
  -> [@|:] segmentGroup {% ([mark, value]) => {
		return [symbolToSegmentKey(mark), value];
		} %}

segmentGroup
 	-> chunk gap segmentGroup {% stringAppendAfterGap %}
	| chunk {% id %}

chunk
	-> number word number {% join %}
	| word number {% join %}
	| number word {% join %}
	| word {% join %}
	| number {% join %}

gap
  -> __ {% id %}
  | [/] {% token %}

number
	-> number numeric {% join %}
	| numeric {% id %}

numeric
	-> [0-9] {% token %}


word
	-> alpha {% id %}
	| alpha alphaSeparator word {% join %}

alphaSeparator
  -> [-] {% token %}

alpha
	-> [a-zA-Z]:+ {% stringOfSame %}

__
	-> " ":+ {% ([tokens]) => {
				let spaces = '';
				for (const i of tokens){
					spaces += ' ';
				}
				return spaces;
			} %}
