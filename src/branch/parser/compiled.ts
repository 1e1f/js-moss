// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }

		function join(sequence: string[]) {
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

		const stringOfSame = ([tokens]: string[][]) => tokens.join('');
		const stringAppendAfterGap = ([first, gap, next]: string[]) => first + gap + next;
		const pair = ([first, next]: string[]) => [first, next];
		const token = ([tok]: string[]) => tok;
		const symbolToSegmentKey = (symbol: string) => {
			switch (symbol){
						case '|': return 'projectSegment';
						case '@': return 'organizationSegment';
						case ':': return 'versionSegment';
					}
			}

interface NearleyToken {  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: NearleyToken) => string;
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
    {"name": "branchLocator$ebnf$1", "symbols": ["tail"], "postprocess": id},
    {"name": "branchLocator$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "branchLocator", "symbols": ["head", "branchLocator$ebnf$1"], "postprocess": 
        ([head, tail]) => {
          return {
        	...head,
        	...tail,
          }
        }
        	},
    {"name": "head$subexpression$1", "symbols": ["segmentGroup"]},
    {"name": "head$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "head$string$1", "symbols": [{"literal":":"}, {"literal":":"}], "postprocess": (d) => d.join('')},
    {"name": "head", "symbols": ["head$subexpression$1", "head$string$1", "head"], "postprocess": 
        ([[namespaceSegment], mark, pathObject]) => {
        	if (namespaceSegment === '-') return pathObject;
          return {
        	namespaceSegment,
        	...pathObject,
          }
        }
        	},
    {"name": "head$subexpression$2", "symbols": ["segmentGroup"]},
    {"name": "head$subexpression$2", "symbols": [{"literal":"-"}]},
    {"name": "head", "symbols": ["head$subexpression$2"], "postprocess":  ([[pathSegment]]) => {
        if (pathSegment === '-') return {}
        return {pathSegment}
        } },
    {"name": "tail$ebnf$1", "symbols": ["markedSegment"]},
    {"name": "tail$ebnf$1", "symbols": ["tail$ebnf$1", "markedSegment"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "tail", "symbols": ["tail$ebnf$1"], "postprocess": 
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
        	},
    {"name": "markedSegment", "symbols": [/[@|:]/, "segmentGroup"], "postprocess":  ([mark, value]) => {
        return [symbolToSegmentKey(mark), value];
        } },
    {"name": "markedSegment", "symbols": [/[@|:]/, {"literal":"-"}], "postprocess":  ([mark, value]) => {
        	return [symbolToSegmentKey(mark), null];
        } },
    {"name": "segmentGroup", "symbols": ["chunk", "gap", "segmentGroup"], "postprocess": stringAppendAfterGap},
    {"name": "segmentGroup", "symbols": ["chunk"], "postprocess": id},
    {"name": "chunk", "symbols": ["number", "word", "number"], "postprocess": join},
    {"name": "chunk", "symbols": ["word", "number"], "postprocess": join},
    {"name": "chunk", "symbols": ["number", "word"], "postprocess": join},
    {"name": "chunk", "symbols": ["word"], "postprocess": join},
    {"name": "chunk", "symbols": ["number"], "postprocess": join},
    {"name": "gap", "symbols": ["__"], "postprocess": id},
    {"name": "gap", "symbols": [/[\/]/], "postprocess": token},
    {"name": "number", "symbols": ["number", "numeric"], "postprocess": join},
    {"name": "number", "symbols": ["numeric"], "postprocess": id},
    {"name": "numeric", "symbols": [/[0-9]/], "postprocess": token},
    {"name": "word", "symbols": ["alpha"], "postprocess": id},
    {"name": "word", "symbols": ["alpha", "alphaSeparator", "word"], "postprocess": join},
    {"name": "alphaSeparator", "symbols": [/[-]/], "postprocess": token},
    {"name": "alpha$ebnf$1", "symbols": [/[a-zA-Z]/]},
    {"name": "alpha$ebnf$1", "symbols": ["alpha$ebnf$1", /[a-zA-Z]/], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "alpha", "symbols": ["alpha$ebnf$1"], "postprocess": stringOfSame},
    {"name": "__$ebnf$1", "symbols": [{"literal":" "}]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", {"literal":" "}], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess":  ([tokens]) => {
        	let spaces = '';
        	for (const i of tokens){
        		spaces += ' ';
        	}
        	return spaces;
        } }
  ],
  ParserStart: "branchLocator",
};

export default grammar;
