@preprocessor typescript
@lexer lexer

@include "./block.ne"
@include "./identifier.ne"
@include "./flow.ne"
@include "./formatting.ne"
@include "./number.ne"

@{%
import { clone, mapToObject } from 'typed-json-transform';
import { lexer, any, indent, dedent, eol, sol, eof, sof, startRule, space } from './lexer';
import { expectedScopeOperator, unreachable } from './post/errors';
import { Mapping, Sequence, Flow, Number, Pair, Key, Comment, Expression, Identifier } from "./post/types";
import {
    tokenValue, tokenText, nuller, first, second,
    join, chars
} from './post/yaml';
%}

start
	-> sof blockScope eof {% ([sof, scope]) => scope %}
