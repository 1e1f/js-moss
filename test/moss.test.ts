import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { assert } from 'chai';

import { load, next, newLayer } from '../src';
import { clone, contains, each } from 'typed-json-transform';

describe('moss', () => {
    it('can set state', () => {
        const file = yaml.load(readFileSync(join(__dirname, 'environment.yaml'), 'utf8'));
        const result = next(newLayer(), file).state;
        assert.isBoolean(result.selectors.production);
    });

    it('can parse with state', () => {
        const config = yaml.load(readFileSync(join(__dirname, 'config.yaml'), 'utf8'));
        const environment = yaml.load(readFileSync(join(__dirname, 'environment.yaml'), 'utf8'));
        const expect = yaml.load(readFileSync(join(__dirname, 'expect.yaml'), 'utf8'));

        const result = load(config, environment);

        assert.deepEqual(result, expect);
    });

    it('test equivalent js code', () => {
        const expect = yaml.load(readFileSync(join(__dirname, 'expect.yaml'), 'utf8'));
        const result = require('./compare').default;

        assert.deepEqual(result, expect);
    });
});
