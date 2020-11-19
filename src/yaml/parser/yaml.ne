@preprocessor typescript
@lexer lexer

@include "./scalar.ne"
@include "./number.ne"
@include "./formatting.ne"
@include "./block.ne"
@include "./flow.ne"

@{%
import { clone, mapToObject } from 'typed-json-transform';
import { lexer, any, indent, dedent, eol, sol, eof, sof, startRule, space } from './lexer';
import { expectedScopeOperator } from './post/errors';
import {
  nuller, first, second, secondInList, createMap, addPairToMap,
  join, singleWord, unaryOperate, operate, appendToSequence,
	fork, createFlowSequence, createBlockSequence
} from './post/ast';
%}

start
	-> sof blockScope eof {% ([sof, scope]) => scope %}
