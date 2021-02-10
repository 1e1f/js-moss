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
    {"name": "caseInsensitiveChunk", "symbols": ["caseInsensitiveString"], "postprocess": id},
    {"name": "disambiguatedChunk", "symbols": ["disambiguatedChunk", "gap", "disambiguatedString"], "postprocess": ([lhs, gap, rhs]) => lhs + rhs},
    {"name": "disambiguatedChunk", "symbols": ["disambiguatedChunk", "_", "nonSemanticDivider", "_", "disambiguatedString"], "postprocess": ([lhs, ws, exp, ws2, rhs]) => lhs + rhs},
    {"name": "disambiguatedChunk", "symbols": ["disambiguatedChunk", "_", "semanticDivider", "_", "disambiguatedString"], "postprocess": ([lhs, ws, exp, ws2, rhs]) => lhs + exp + rhs},
    {"name": "disambiguatedChunk", "symbols": ["disambiguatedString"], "postprocess": id},
    {"name": "gap", "symbols": ["__"], "postprocess": id},
    {"name": "semanticDivider", "symbols": [/[\/]/], "postprocess": token},
    {"name": "nonSemanticDivider", "symbols": [/[-'.]/], "postprocess": token},
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
    {"name": "start$subexpression$1$ebnf$1", "symbols": []},
    {"name": "start$subexpression$1$ebnf$1", "symbols": ["start$subexpression$1$ebnf$1", "strip"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "start$subexpression$1", "symbols": ["start$subexpression$1$ebnf$1", "_"]},
    {"name": "start", "symbols": ["start$subexpression$1", "queries"], "postprocess": 
        ([ws, q]) => q
        },
    {"name": "queries", "symbols": ["queries", {"literal":","}, "query"], "postprocess": 
        ([bls, comma, bl]) => {
        	const iter = Array.isArray(bls) ? bls : [bls];
        	return [
        		...iter,
        		bl
          ]
        }
        	},
    {"name": "queries", "symbols": ["query"], "postprocess": id},
    {"name": "query$ebnf$1$subexpression$1", "symbols": [{"literal":"$"}, "blQuery"]},
    {"name": "query$ebnf$1", "symbols": ["query$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "query$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "query", "symbols": ["blQuery", "query$ebnf$1"], "postprocess": 
        ([blQuery, schemaQuery]) => schemaQuery ? {...blQuery, kind: schemaQuery[1]} : blQuery },
    {"name": "blQuery$ebnf$1", "symbols": ["queryHead"], "postprocess": id},
    {"name": "blQuery$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "blQuery$ebnf$2", "symbols": ["queryTail"], "postprocess": id},
    {"name": "blQuery$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "blQuery", "symbols": ["blQuery$ebnf$1", "blQuery$ebnf$2"], "postprocess": 
        ([head, tail]) => {
        	if (!head && !tail) return null;
        	return ({
        		...head,
        		...tail,
          })
        }
        	},
    {"name": "queryHead$ebnf$1", "symbols": ["disambiguatedQuery"], "postprocess": id},
    {"name": "queryHead$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "queryHead$string$1", "symbols": [{"literal":":"}, {"literal":":"}], "postprocess": (d) => d.join('')},
    {"name": "queryHead$ebnf$2", "symbols": ["queryHead"], "postprocess": id},
    {"name": "queryHead$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "queryHead", "symbols": ["_", "queryHead$ebnf$1", "_", "queryHead$string$1", "queryHead$ebnf$2"], "postprocess": 
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
        	},
    {"name": "queryHead", "symbols": ["_", "caseInsensitiveQuery", "_"], "postprocess": ([ ws, nameSegment ]) => ({nameSegment})},
    {"name": "queryTail$ebnf$1", "symbols": ["queryTailSegment"]},
    {"name": "queryTail$ebnf$1", "symbols": ["queryTail$ebnf$1", "queryTailSegment"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "queryTail", "symbols": ["queryTail$ebnf$1"], "postprocess": 
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
        	},
    {"name": "queryTailSegment", "symbols": ["disambiguatedQuerySegment"], "postprocess": id},
    {"name": "queryTailSegment", "symbols": ["caseInsensitiveQuerySegment"], "postprocess": id},
    {"name": "queryTailSegment", "symbols": ["versionQuerySegment"], "postprocess": id},
    {"name": "disambiguatedQuerySegment", "symbols": [/[@]/, "_", "disambiguatedQuery", "_"], "postprocess":  ([ mark, ws, group]) => {
        return [symbolToSegmentKey(mark), group];
        } },
    {"name": "caseInsensitiveQuerySegment", "symbols": [/[~]/, "_", "caseInsensitiveQuery", "_"], "postprocess":  ([ mark, ws, group]) => {
        return [symbolToSegmentKey(mark), group];
        } },
    {"name": "disambiguatedQuery", "symbols": [{"literal":"!"}, "disambiguatedQueryGroup"], "postprocess":  ([ not, group]) => {
        	return { not: group }
        } },
    {"name": "disambiguatedQuery", "symbols": ["disambiguatedQueryGroup"], "postprocess": id},
    {"name": "disambiguatedQueryGroup", "symbols": ["disambiguatedQueryGroup", "_", /[|]/, "_", "disambiguatedChunk"], "postprocess": queryOp},
    {"name": "disambiguatedQueryGroup", "symbols": ["disambiguatedChunk"], "postprocess": id},
    {"name": "disambiguatedQueryGroup", "symbols": [{"literal":"-"}], "postprocess": token},
    {"name": "caseInsensitiveQuery", "symbols": [{"literal":"!"}, "caseInsensitiveQueryGroup"], "postprocess":  ([ not, group]) => {
        	return { not: group }
        } },
    {"name": "caseInsensitiveQuery", "symbols": ["caseInsensitiveQueryGroup"], "postprocess": id},
    {"name": "caseInsensitiveQueryGroup", "symbols": ["caseInsensitiveQueryGroup", "_", /[|]/, "_", "caseInsensitiveChunk"], "postprocess": queryOp},
    {"name": "caseInsensitiveQueryGroup", "symbols": ["caseInsensitiveChunk"], "postprocess": id},
    {"name": "caseInsensitiveQueryGroup", "symbols": [{"literal":"-"}], "postprocess": token},
    {"name": "versionQuerySegment", "symbols": [/[:]/, "_", "versionQuery", "_"], "postprocess":  ([ mark, ws, group]) => {
        return [symbolToSegmentKey(mark), group];
        } },
    {"name": "versionQuery$ebnf$1", "symbols": ["versionFlag"], "postprocess": id},
    {"name": "versionQuery$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "versionQuery", "symbols": ["versionQuery$ebnf$1", "versionChunk"], "postprocess": join}
  ],
  ParserStart: "start",
};

export default grammar;
