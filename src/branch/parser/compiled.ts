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
    {"name": "branchLocators", "symbols": ["branchLocators", "_", {"literal":","}, "branchLocator"], "postprocess": 
        ([bls, ws, comma, bl]) => {
        	const iter = Array.isArray(bls) ? bls : [bls];
        	return [
        		...iter,
        		bl
          ]
        }
        	},
    {"name": "branchLocators", "symbols": ["branchLocator"], "postprocess": id},
    {"name": "branchLocator$ebnf$1", "symbols": ["head"], "postprocess": id},
    {"name": "branchLocator$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "branchLocator$ebnf$2", "symbols": ["tail"], "postprocess": id},
    {"name": "branchLocator$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "branchLocator", "symbols": ["branchLocator$ebnf$1", "_", "branchLocator$ebnf$2"], "postprocess": 
        ([head, ws, tail]) => {
        	if (!head && !tail) return null;
          return {
        		...head,
        		...tail,
          }
        }
        	},
    {"name": "head$ebnf$1$subexpression$1", "symbols": ["orgGroup"]},
    {"name": "head$ebnf$1$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "head$ebnf$1", "symbols": ["head$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "head$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "head$string$1", "symbols": [{"literal":":"}, {"literal":":"}], "postprocess": (d) => d.join('')},
    {"name": "head$ebnf$2", "symbols": ["head"], "postprocess": id},
    {"name": "head$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "head", "symbols": ["head$ebnf$1", "_", "head$string$1", "head$ebnf$2"], "postprocess": 
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
        	},
    {"name": "head", "symbols": ["_", "nameSegment"], "postprocess": ([ws, nameSegment]) => nameSegment},
    {"name": "nameSegment", "symbols": ["fileName"], "postprocess":  ([nameSegment]) => {
        if (!nameSegment) return {}
        return {nameSegment}
        } },
    {"name": "fileName", "symbols": ["fileName", "gap", "fileWord"], "postprocess": join},
    {"name": "fileName", "symbols": ["fileWord"], "postprocess": id},
    {"name": "fileWord$ebnf$1", "symbols": ["fileChar"]},
    {"name": "fileWord$ebnf$1", "symbols": ["fileWord$ebnf$1", "fileChar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "fileWord", "symbols": ["fileWord$ebnf$1"], "postprocess": stringOfSame},
    {"name": "fileChar", "symbols": ["numberChar"], "postprocess": id},
    {"name": "fileChar", "symbols": ["alphaChar"], "postprocess": id},
    {"name": "fileChar", "symbols": ["alphaSeparator"], "postprocess": id},
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
    {"name": "markedSegment$subexpression$1", "symbols": ["orgGroup"]},
    {"name": "markedSegment$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "markedSegment", "symbols": [/[@~:]/, "_", "markedSegment$subexpression$1", "_"], "postprocess":  ([ mark, ws, [group]]) => {
        return [symbolToSegmentKey(mark), group];
        } },
    {"name": "orgGroup$ebnf$1", "symbols": ["gap"]},
    {"name": "orgGroup$ebnf$1", "symbols": ["orgGroup$ebnf$1", "gap"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "orgGroup", "symbols": ["orgChunk", "orgGroup$ebnf$1", "orgGroup"], "postprocess": stringAppendAfterGap},
    {"name": "orgGroup", "symbols": ["orgChunk"], "postprocess": id},
    {"name": "orgChunk", "symbols": ["number", "name", "number"], "postprocess": join},
    {"name": "orgChunk", "symbols": ["name", "number"], "postprocess": join},
    {"name": "orgChunk", "symbols": ["number", "name"], "postprocess": join},
    {"name": "orgChunk", "symbols": ["name"], "postprocess": join},
    {"name": "orgChunk", "symbols": ["number"], "postprocess": join},
    {"name": "gap", "symbols": ["__"], "postprocess": id},
    {"name": "gap", "symbols": [/[\/]/], "postprocess": token},
    {"name": "number$ebnf$1", "symbols": ["numberChar"]},
    {"name": "number$ebnf$1", "symbols": ["number$ebnf$1", "numberChar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "number", "symbols": ["number$ebnf$1"], "postprocess": stringOfSame},
    {"name": "numberChar", "symbols": [/[0-9]/], "postprocess": token},
    {"name": "name", "symbols": ["alphaChunk", "alphaSeparator", "name"], "postprocess": join},
    {"name": "name", "symbols": ["alphaChunk"], "postprocess": id},
    {"name": "alphaSeparator", "symbols": [{"literal":"-"}], "postprocess": token},
    {"name": "alphaChunk$ebnf$1", "symbols": ["alphaChar"]},
    {"name": "alphaChunk$ebnf$1", "symbols": ["alphaChunk$ebnf$1", "alphaChar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "alphaChunk", "symbols": ["alphaChunk$ebnf$1"], "postprocess": stringOfSame},
    {"name": "alphaChar", "symbols": [/[a-zA-Z]/], "postprocess": token},
    {"name": "__$ebnf$1", "symbols": [{"literal":" "}]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", {"literal":" "}], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess":  ([tokens]) => {
        	let spaces = '';
        	for (const i of tokens){
        		spaces += ' ';
        	}
        	return spaces;
        } },
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", {"literal":" "}], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess":  ([tokens]) => {
        	return null;
        } }
  ],
  ParserStart: "branchLocators",
};

export default grammar;
