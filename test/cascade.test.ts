import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { assert } from 'chai';

import { check, clone, contains, each } from 'typed-json-transform';

import { load, next, newLayer } from '../src';

const env =
  `select<:
  also: true
  yes: true
  no: false
`

const configFile =
  `=yes:
  =no:
    version: 7
  =yes:
    nested:
      setting: true
      object:
        =yes:
          key: value
      array:
        =yes:
        - no
        =yes also:
        - item
        - nextItem
    version: 2
=no:
  version: 0
`

const expectFile = `
version: 2
nested:
  setting: true
  object:
    key: value
  array:
  - item
  - nextItem
`

describe('cascade', () => {
  it('can parse with an environment and config file', () => {
    const result = load(configFile, env);
    // console.log(result);
    const expect = yaml.load(expectFile);
    assert.deepEqual(result, expect);
  });
});