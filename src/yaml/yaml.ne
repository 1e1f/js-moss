@preprocessor typescript
@lexer lexer

@include "./statement.ne"
@include "./uri.ne"
@include "./number.ne"
@include "./string.ne"
@include "./formatting.ne"
@include "./block.ne"
@include "./flow.ne"

@{%
import { clone, mapToObject } from 'typed-json-transform';
import { lexer, any, indent, dedent, eol, sol, eof, sof, startRule, space } from './lexer';
import { expectedScopeOperator } from './post/errors';
import {
  nuller, createMap, addPairToMap,
  join, singleWord, unaryOperate, operate,
	fork, createFlowSequence, createBlockSequence, appendToSequence
} from './post/ast';
%}

start
	-> sof rootScope eof {% ([sof, scope]) => scope %}

rootScope
	-> blockScope {% id %}
