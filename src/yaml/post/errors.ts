export function expectedListNotation(){
	throw new Error("expected list notation");
}

export function emptyScope(){
	throw new Error("empty scope");
}

export function expectedRhs(){
	throw new Error("no value for rhs");
}

export function expectedTerminator(){
	throw new Error("missing map pair terminator");
}

export function extraSpace(){
	throw new Error("unused space at end of line");
}

export function genericContextError(){
	throw new Error("@context error");
}

export function missingComma(){
	throw new Error("missing comma");
}

export function expectedScopeOperator(){
	throw new Error("nested scope without scope operator");
}

export function missingRhs(){
	throw new Error("rhs of pair assignment missing");
}

export function unknownOrEmpty(){
	throw new Error("unknown or empty");
}