number
	-> digit "." digit ("e" digit):? {% ([dig, tok, dig2, ex]) => {
		let el = [dig, tokenValue([tok]), dig2];
		if (ex){
			el.push(...join([tokenValue([ex[0]]), ex[1]]))
		}
		let [text, source] = join(el);
		const ns = source.fork();
		return new Number(
			parseFloat(text),
			"float",
			ns
		)
	} %}
	| digit {% (args) => {
		let [text, source] = join(args)
		const ns = source.fork();
		return new Number(
			parseInt(text),
			"int",
			ns
		)
	} %}
	

digit
	-> digit [0-9] {% ([digit, tok]) => join([digit, tokenValue([tok])]) %}
	| [0-9] {% tokenValue %}
