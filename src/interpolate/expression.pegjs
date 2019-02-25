{ 
const vars = { testArray:[{y: 3}, {y: 5}], x: { y: 5, ref: 'y' } , z: 0};
const heap = (x) => vars[x];
// function isNumeric(n) {
//   return !isNaN(parseFloat(n)) && isFinite(n);
// }
}

Start = Simplifiy
Simplifiy = _ expr:Expression+ _  {
  return expr && (expr.length > 1 ? expr.join('') : expr[0]);
}

Expression = head:Term tail:(_ ("+" / "-") _ Term)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "+") { return result + element[3]; }
        if (element[1] === "-") { return result - element[3]; }
      }, head);
    }

Term = head:Factor tail:(_ ("*" / "/") _ Factor)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "*") { return result * element[3]; }
        if (element[1] === "/") { return result / element[3]; }
      }, head);
    }

Factor = "(" _ expr:Expression _ ")" { return expr; } / Sequence

Sequence = head:Chunk tail:(Chunk)* {
      return tail.reduce(function(result, element) {
        return result + element[0];
      }, head);
    }

Chunk = (Any / Space)
//RecursiveExpression / StackExpression / StackReference
//StackReference = variable:String { return heap(variable); }
//StackExpression = "${" variable:Expression "}" { return heap(variable); }
//RecursiveExpression = "={" variable:Expression "}" { return variable; }

// MapObject = ref:StackReference "[]" {
// 	return ref;
// }

// Map = head:MapObject tail:(_ Expression)* _ {
//       return tail.reduce(function(result, element) {
//       		console.log('map', element[1])
//          return result[element[1]];
//       }, head);
//     }
    
MemberOperator = head:StackReference tail:("[" Any "]")* _ {
      return tail.reduce(function(result, element) {
         return result[element[1]];
      }, head);
    }
    
StackReference = head:String tail:("." String)* {
    const lhs = heap(head);
    if (lhs === undefined){
      lhs = head;
    }
    return tail.reduce(function(result, element) {
        return result[element[1]];
    }, lhs);
}

Array = "[" items:(((Any ",") / Any))* "]" { 
	return items; 
}

Any = MemberOperator / StackReference / String / Float / Integer
String = w:Char+ { return w.join(""); }
Char = c:[a-zA-Z]
Float "float" = left:[0-9]+ "." right:[0-9]+ _ { return parseFloat(left.join("") + "." + right.join("")); }
Integer "integer" = [0-9]+ _ { return parseInt(text(), 10); }
Space = [ ]
_ "whitespace" = [ \t\n\r]*