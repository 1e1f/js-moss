import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { assert } from 'chai';

import { load } from '../src';
import { clone, contains, each } from 'typed-json-transform';

import { cascade } from '../src/cascade';

const options = `
yes: true
no: false
`

const configFile = `
-yes:
  override: 1
  -no:
    override: 7
  -yes:
    $func:
      -deferred:
        setting: true
    basic:
      -deferred: true
      settings: true
    override: 2
-no:
  override: 0
`

const expectFile = `
override: 2
basic:
  -deferred: true
  settings: true
$func:
  -deferred:
    setting: true
`

describe('cascade', () => {
  it('can parse with an environment and config file', () => {
    const config = {
      data: yaml.load(configFile),
      state: {
        selectors: yaml.load(options)
      }
    }

    const result = cascade(config.data, config.state);
    const expect = yaml.load(expectFile);
    assert.deepEqual(result, expect);
  });
});


