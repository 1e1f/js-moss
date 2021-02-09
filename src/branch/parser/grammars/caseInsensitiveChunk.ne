@preprocessor typescript
@include "./shared.ne"

start
	-> strip:* _ caseInsensitiveChunk _ {%
		([strip, ws, code]) => code
		%}
