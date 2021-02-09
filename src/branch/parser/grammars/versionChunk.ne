@preprocessor typescript
@include "./shared.ne"

start
	-> strip:* _ versionChunk _ {%
		([strip, ws, code]) => code
		%}
