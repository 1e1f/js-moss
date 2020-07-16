
# URL = scheme:[//authority]path[?query][#fragment]
uri
	-> url {% id %}
	| authority {% id %}

url
	-> urlDomainScheme authority {% join %}
	| urlScheme uriPathComponent {% join %}
	| urlScheme urlPath {% join %}

urlDomainScheme
	-> urlScheme "/" "/" {% join %}

urlSchemes
	-> urlSchemes urlScheme {% join %}
	| urlScheme {% id %}

urlScheme
	-> domainComponent ":" {% join %}

authority
	-> urlCredentials "@" _authority {% join %}
	| _authority {% join %}

_authority
	-> uriDomainComponent uriPathComponent:? uriQueries:? uriFragment:? {% join %}

uriQueries 
	-> uriQueries uriQuery {% join %}
	| uriQuery {% id %}

uriPathComponent 
	-> "/" urlPath {% join %}
	| "/" {% ([tok]) => tok.value %}

urlCredentials
	-> urlCredentials ":" password {% join %}
	| email {% id %}
	| subdomain {% id %}

urlPath
	-> urlPath "/" urlPathName {% join %}
	| urlPath "/" {% join %}
	| urlPathName {% id %}

urlPathName ->
	urlPathName "." urlPathWord {% join %}
	| urlPathWord {% id %}
	
urlPathWord
	-> urlPathWord urlPathChar {% join %}
	| urlPathChar {% id %}
	
urlPathChar
	-> [^ ^/^.^?^;] {% ([tok]) => tok.value %}

filePath ->
	filePath "/" fileName {% join %}
	| fileName {% id %}

fileName ->
	fileName "." fileWord {% join %}
	| fileWord {% id %}

fileWord
	-> fileWord fileChar {% join %}
	| fileChar {% id %}

fileChar
	-> [^ ^/^.] {% ([tok]) => tok.value %}

password
	-> urlSafePlusEncoded {% join %}

email
	-> subdomain "@" domain {% join %}

uriDomainComponent
	-> uriDomainComponent uriPortComponent {% join %}
	| domain {% join %}
	| "[" ipv6 "]" {% join %}
	| ipv4 {% id %}

matchSeven[x] 
	-> $x $x $x $x $x $x $x {% join %}

matchOneToSeven[x] 
	-> $x $x $x $x $x $x $x {% join %}
	| $x $x $x $x $x $x {% join %}
	| $x $x $x $x $x {% join %}
	| $x $x $x $x {% join %}
	| $x $x $x $x {% join %}
	| $x $x $x {% join %}
	| $x $x {% join %}
	| $x {% join %}
	
ipv6
	-> matchSeven[ipv6Group] ipv6Number {% join %}
	| matchOneToSeven[ipv6Group] ":" ipv6Number {% join %}

matchOneToFour[x]
	-> $x $x $x $x {% join %}
	| $x $x $x {% join %}
	| $x $x {% join %}
	| $x {% join %}

ipv6Group
	-> ipv6Number ":" {% join %}

ipv6Number
	-> matchOneToFour[hexDigit]

ipv4
	-> ipv4Group "." ipv4Group "." ipv4Group "." ipv4Group

ipv4Group
	-> d2 d5 d0_5 {% join %}
	| d2 d0_4 d0_9 {% join %}
	| d1 d0_9 d0_9 {% join %}
	| d0_9 d0_9 {% join %}
	| d0_9 {% id %}

d1 -> "1" {% ([tok]) => tok %}
d2 -> "2" {% ([tok]) => tok %}
d5 -> "5" {% ([tok]) => tok %}
d0_4 -> [0-4] {% ([tok]) => tok %}
d0_5 -> [0-5] {% ([tok]) => tok %}
d0_9 -> [0-9] {% ([tok]) => tok %}

domain
	-> subdomain "." domainComponent {% join %}

uriPortComponent
	-> ":" number {% join %}

subdomain ->
	domainComponent "." subdomain {% join %}
	| domainComponent {% id %}

# ! $ & ' ( ) * + , ; = 
# are permitted by generic URI syntax to be used unencoded
# in the user information, host, and path as delimiters.

uriQuery
  -> "?" queryList {% join %}

queryList
  -> queryList "&" queryFragment {% join %}
  | queryFragment {% id %}

queryFragment
  -> queryFragment "=" urlSafePlusEncoded {% join %}
  | urlSafePlusEncoded {% id %}

uriFragment
  -> "#" queryList {% join %}

domainComponent
	-> [a-zA-Z] [a-zA-Z0-9\-]:*
		{% singleWord %}