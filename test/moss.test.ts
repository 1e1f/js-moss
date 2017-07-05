import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { assert } from 'chai';

import { load, Push } from '../src';
import { clone, contains, each } from 'typed-json-transform';

describe('moss', () => {
    it('can set state', () => {
        const trunk = yaml.load(readFileSync(join(__dirname, 'environment.yaml'), 'utf8'));
        const result = Push.branch(trunk, Push.newState()).state;
        assert.isString(result.heap.host.ninja.version);
        assert.isBoolean(result.selectors.production);
    });

    it('can parse with state', () => {
        const config = yaml.load(readFileSync(join(__dirname, 'config.yaml'), 'utf8'));
        const environment = yaml.load(readFileSync(join(__dirname, 'environment.yaml'), 'utf8'));
        const expect = yaml.load(readFileSync(join(__dirname, 'expect.yaml'), 'utf8'));
        const result = load(config, environment);

        assert.deepEqual(result, expect);
    });
});
