## js-moss [![Build Status](https://travis-ci.org/1e1f/js-moss.svg?branch=master)](https://travis-ci.org/1e1f/js-moss) [![Coverage Status](https://coveralls.io/repos/github/1e1f/js-moss/badge.svg?branch=master)](https://coveralls.io/github/1e1f/js-moss?branch=master)
[![NPM](https://nodei.co/npm/js-moss.png?downloads=true)](https://nodei.co/npm/js-moss/)

# Moss

moss is a set of parsing rules for js objects, most often described in YAML-like syntax. It is a Turing-incomplete language that looks a bit like YAMl but is closer Kubernetes Helm. Moss aims to have serparable layers, each with an opinionated first choice that is ultimately swappable if desired.

## Branches
Moss "branches" are somewhat like files but with key differences. A traditional file separates its data (the file contents) from its metadata (owner, permissions). In contrast, a Moss branch is identified by its first line, called a "branch locator".

## Branch locators

Example: context::name@Organzation Name~Folder/other tag:version

context aka "forest" - defines which layer 0 resolver to use if sourcing from another forest
name - just a file name.
Organization Name - Represents permissions
projectTags - User defined hints, similar to unix directories
version - server or a hash

## Layers of moss
```
0 binary
1 source
2 linked structured ast
3 declarative api
```
### Layer 0: "trunk" / container / binary:
opinionated default:
+ [Signet Protocol](https://github.com/ChromaPDX/signet), which is essentially an IPFS compatible container format

unopinionated alternatives:
+ database
+ filesystem
+ browser storage

### Layer 1: "branch" / source code:
opinionated default:
+ yaml

unopinionated alternatives:
+ JSON / xml / TOML
+ any trie-like format

### layer 2: "stem" / ast:
opinionated default:
+ js-moss (this package) hydrates yaml to object, async gql resolvers for linking

unopinionated alternatives:
+ load layer 1 into language specific ORM
+ be able to link other layer 2 objects.

### Layer 3: "leaf" / document:
opinionated default:
+ has a "kind" referenced in layer2
drives declarative api like k8s

unopinionated alternatives:
+ any runtime object



see more and use interactively in your browser @ https://triemake.com/moss/playground
