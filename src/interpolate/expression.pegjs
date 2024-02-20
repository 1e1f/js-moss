{
  const vars = {
  x: {y: {z: 3}}
  };
  const heap = (x) => vars[x];
  function isNumeric(n) {
    return !n.length && !isNaN(n) && isFinite(n);
  }
  const isScalar = (x) => {
      return (typeof x == 'string') || isNumeric(x);
  }
}

Start = Simplify
Simplify = _ expr:ReEntry+ _  {
  return expr && (expr.length > 1 ? expr.join('') : expr[0]);
}

ReEntry = Ternary

Ternary = head:LogicOperator tail:(_ "?" _ Ternary _ ":" _ Ternary)? {
  return tail 
    ? head 
      ? tail[3] 
      : tail[7]
    : head;
}

LogicOperator = head:Comparison tail:(_ ("||" / "&&") _ Comparison)* {
      return tail.reduce(function(lhs, element) {
        if (element[1] === "||") { return lhs || element[3]; }
        if (element[1] === "&&") { return lhs && element[3]; }
      }, head);
}

Comparison = head:AddOp tail:(_ (Keyword / ">=" / "<=" / "!==" / "===" / "==" / "!=" / ">" / "<") _ AddOp)* {
  return tail.reduce(function (lhs, element) {
    let method = element[1];
    const negated = method[0] == "!";
    if (negated){
      method = method.slice(1);
    }
    const arg = element[3];
    // throw new Error(negated)
    let boolean;
    if (typeof lhs == "string") {
      if (method == "contains" || method == "includes") {
        boolean = lhs.indexOf(arg) != -1;
      } else if (method == "startsWith") {
        boolean = lhs.startsWith(arg);
      } else if (method == "endsWith") {
        boolean = lhs.endsWith(arg);
      } else if (method == "==="){
        boolean = lhs === arg;
      } else if (method == "=="){
        boolean = negated ? lhs === arg : lhs == arg;
      } else if (method == "="){
        boolean = lhs == arg;
      }
    } else if (Array.isArray(lhs)) {
      if (method == "contains" || method == "includes") {
        boolean = lhs.indexOf(arg) != -1;
      } else if (method == "startsWith") {
        //throw new Error(lhs[0])
        boolean = lhs[0] == arg;
      } else if (method == "endsWith") {
        boolean = lhs.length && lhs[lhs.length - 1] == arg;
      } else if (method == "hasKey") {
      	if (isNumeric(arg)){
      		boolean = lhs.length > arg;
        }
      }
    } else if (lhs !== null && typeof lhs === "object") {
      if (method == "hasKey") {
      	boolean = lhs.hasOwnProperty(arg)
      }
    } else { // reg cmp 
        const full_op = negated ? element[1].slice(1) : element[1];
        const scope = full_op[0];
        switch (method) {
          case '<=':
          case '<': {
          	if (method[1] === "="){
              boolean = lhs <= arg;
            }
          	else boolean = lhs < arg;
            break;
          }
          case '>=':
          case '>': {
          	if (method[1] === "="){
              boolean =  lhs <= arg;
            }
          	else boolean = lhs < arg;
            break;
          }
          case "=": {
            boolean = lhs == arg;
            break;
          }
          case "==":{
            boolean = negated ? lhs === arg : lhs == arg;
            break;
          }
          case "===": {
            boolean = lhs === arg;
            break;
          }
        }
    }
    if (negated) return !boolean;
    return boolean;
  }, head);
}

AddOp = head:MulOp tail:(_ ("+" / "-") _ MulOp)* {
      return tail.reduce(function(result, element) {
        if (!isScalar(result)){
          return { [element[1] === "+" ? 'add' : 'subtract']: [result, element[3]]}
        }
        if (element[1] === "+") { return (result || 0) + (element[3] || 0); }
        if (element[1] === "-") { return (result || 0) - (element[3] || 0); }
      }, head);
    }

MulOp = head:Factor tail:(_ ("*" / "/") _ Factor)* {
      return tail.reduce(function(result, element) {
        if (!isScalar(result)){
          return { [element[1] === "*" ? 'multiply' : 'divide']: [result, element[3]]}
        }
        
        if (element[1] === "*") { return (result || 0) * (element[3] || 0); }
        if (element[1] === "/") { 
          if (!element[3]){
            throw new Error(`divide by zero @ ${head} ${element.join(' ')}`)
          }
          return (result || 0) / element[3]; }
      }, head);
    }

Factor = "(" _ expr:ReEntry _ ")" { return expr; } / Unary

Unary = UnaryNot / UnaryNeg / Atom

UnaryNot = "!" c:Factor { return !c }
UnaryNeg = "-" c:Number { return -c }

MemberOperator = head:Identifier tail:(("[" Atom "]") / ("." Identifier))* optional:("?")? {
    let kp = [head];
   	const lhs = heap(head);
    return tail.reduce(function(result, element) {
        const accessor = element[1];

        const res = result && result[accessor];
        if (res === undefined) {
          if (!optional) {
            throw new Error(`${[...kp, accessor].join('.')} is undefined, however ${kp.join('.')} is ${JSON.stringify(result, null, 2)}, use operator "?" at end of variable access to allow undefined. `)
          }
        } else {
          kp.push(accessor);
        }
        return res;
    }, lhs);
}

Array = "[" items:ArrayItem+ "]" _ {
	return items;
}

ArrayItem = item:(("," _ ReEntry) / _ ReEntry) {
	return (item[0] && (item[0] == ',')) ? item[2] : item[1];
}

Atom = MemberOperator / Array / String / Identifier / Number

Keyword = "contains" / "startsWith" / "endsWith" / "includes" / "hasKey"

Identifier = Word
Word =  left:[_a-zA-Z] right:[_a-zA-Z0-9]* { return left + right.join('') }
String = "\"" s:Word "\""  { return s }
Text = c:[a-zA-Z] { return c.join('') }

Number = Float / Integer
Float "float" = left:[0-9]+ "." right:[0-9]+ _ { return parseFloat(left.join("") + "." + right.join("")); }
Integer "integer" = [0-9]+ _ { return parseInt(text(), 10); }
Space = [ ]
_ "whitespace" = [ \t\n\r]*
