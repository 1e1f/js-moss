import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { assert } from 'chai';

import { load } from '../src';


describe('moss', () => {
  it('can parse with an environment and config file', () => {
    const config = yaml.load(readFileSync(join(__dirname, 'config.yaml'), 'utf8'));
    const environment = yaml.load(readFileSync(join(__dirname, 'environment.yaml'), 'utf8'));
    const expect = yaml.load(readFileSync(join(__dirname, 'expect.yaml'), 'utf8'));

    const result = load(config, environment);

    assert.deepEqual(result, expect);
  });
});