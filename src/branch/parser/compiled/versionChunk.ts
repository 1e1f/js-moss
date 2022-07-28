// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }

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
			}
		}

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: undefined,
  ParserRules: [
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "__$ebnf$1", "symbols": ["wschar"]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "wschar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id},
    {"name": "caseInsensitiveChunk", "symbols": ["caseInsensitiveChunk", "gap", "caseInsensitiveString"], "postprocess": ([lhs, gap, rhs]) => lhs + rhs},
    {"name": "caseInsensitiveChunk", "symbols": ["caseInsensitiveChunk", "_", "nonSemanticDivider", "_", "caseInsensitiveString"], "postprocess": ([lhs, ws, exp, ws2, rhs]) => lhs + rhs},
    {"name": "caseInsensitiveChunk", "symbols": ["caseInsensitiveChunk", "_", "semanticDivider", "_", "caseInsensitiveString"], "postprocess": ([lhs, ws, exp, ws2, rhs]) => lhs + exp + rhs},
    {"name": "caseInsensitiveChunk", "symbols": ["caseInsensitiveChunk", "_", "nonSemanticDivider"], "postprocess": ([lhs]) => lhs},
    {"name": "caseInsensitiveChunk", "symbols": ["caseInsensitiveString"], "postprocess": id},
    {"name": "disambiguatedChunk", "symbols": ["disambiguatedChunk", "gap", "disambiguatedString"], "postprocess": ([lhs, gap, rhs]) => lhs + rhs},
    {"name": "disambiguatedChunk", "symbols": ["disambiguatedChunk", "_", "nonSemanticDivider", "_", "disambiguatedString"], "postprocess": ([lhs, ws, exp, ws2, rhs]) => lhs + rhs},
    {"name": "disambiguatedChunk", "symbols": ["disambiguatedChunk", "_", "semanticDivider", "_", "disambiguatedString"], "postprocess": ([lhs, ws, exp, ws2, rhs]) => lhs + exp + rhs},
    {"name": "disambiguatedChunk", "symbols": ["disambiguatedString"], "postprocess": id},
    {"name": "gap", "symbols": ["__"], "postprocess": id},
    {"name": "semanticDivider", "symbols": [/[/]/], "postprocess": token},
    {"name": "nonSemanticDivider", "symbols": [/[-'.&]/], "postprocess": token},
    {"name": "disambiguatedString$ebnf$1", "symbols": ["disambiguatedChar"]},
    {"name": "disambiguatedString$ebnf$1", "symbols": ["disambiguatedString$ebnf$1", "disambiguatedChar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "disambiguatedString", "symbols": ["disambiguatedString$ebnf$1"], "postprocess": stringOfSame},
    {"name": "caseInsensitiveString$ebnf$1", "symbols": ["caseInsensitiveChar"]},
    {"name": "caseInsensitiveString$ebnf$1", "symbols": ["caseInsensitiveString$ebnf$1", "caseInsensitiveChar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "caseInsensitiveString", "symbols": ["caseInsensitiveString$ebnf$1"], "postprocess": stringOfSame},
    {"name": "disambiguatedChar", "symbols": [/[a-zA-Z0-9]/], "postprocess":  ([token]) => {
        	const r = reserveMap[token];
        	return (r != undefined ? r : token.toLowerCase())
        } },
    {"name": "caseInsensitiveChar", "symbols": [/[a-zA-Z0-9]/], "postprocess": ([token]) => token.toLowerCase()},
    {"name": "versionChunk", "symbols": ["versionChunk", "versionDivider", "versionString"], "postprocess": join},
    {"name": "versionChunk", "symbols": ["versionString"], "postprocess": id},
    {"name": "versionString$ebnf$1", "symbols": ["versionChar"]},
    {"name": "versionString$ebnf$1", "symbols": ["versionString$ebnf$1", "versionChar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "versionString", "symbols": ["versionString$ebnf$1"], "postprocess": stringOfSame},
    {"name": "versionChar", "symbols": [/[a-zA-Z0-9]/], "postprocess": ([token]) => token.toLowerCase()},
    {"name": "versionFlag", "symbols": [/[\^~]/], "postprocess": token},
    {"name": "versionDivider", "symbols": [/[-.]/], "postprocess": token},
    {"name": "strip", "symbols": [/[\u200B-\u200D\uFEFF]/], "postprocess": id},
    {"name": "start$ebnf$1", "symbols": []},
    {"name": "start$ebnf$1", "symbols": ["start$ebnf$1", "strip"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "start", "symbols": ["start$ebnf$1", "_", "versionChunk", "_"], "postprocess": 
        ([strip, ws, code]) => code
        }
  ],
  ParserStart: "start",
};

export default grammar;
