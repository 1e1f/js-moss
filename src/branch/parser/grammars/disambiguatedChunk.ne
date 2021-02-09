@preprocessor typescript
@include "./shared.ne"

start
	-> strip:* _ disambiguatedChunk _ {%
		([strip, ws, code]) => code
		%}
