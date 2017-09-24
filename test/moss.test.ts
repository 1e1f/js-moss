import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { assert } from 'chai';
import { exec } from 'shelljs';

import { load, parse, next, newLayer, setOptions } from '../src';
import { clone, contains, each } from 'typed-json-transform';

describe('moss', () => {
    it('cascade', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'cascade.yaml'), 'utf8'));
        assert.deepEqual(parse(config, env), expect);
    });

    it('inherit', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'inherit.yaml'), 'utf8'));
        assert.deepEqual(parse(config, env), expect);
    });

    it('escape', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'escape.yaml'), 'utf8'));
        assert.deepEqual(parse(config, env), expect);
    });

    it('functional', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'functional.yaml'), 'utf8'));
        assert.deepEqual(parse(config, env), expect);
    });

    it('environment', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'kitchen.yaml'), 'utf8'));
        const result = next(newLayer(), env).state;
        assert.isBoolean(result.selectors.production);
    });

    it('kitchen sink', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'kitchen.yaml'), 'utf8'));
        assert.deepEqual(parse(config, env), expect);
    });

    it('without shell', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'shell.yaml'), 'utf8'));
        assert.deepEqual(parse(config, env), expect.withoutShell);
    });

    it('shell', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'shell.yaml'), 'utf8'));
        setOptions({
            shell: (str) => {
                return (<string>exec(str, { silent: true }).stdout).replace('\r', '').replace('\n', '');
            }
        });
        assert.deepEqual(parse(config, env), expect.withShell);
    });

    it('test equivalent js code', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'kitchen.yaml'), 'utf8'));
        const result = require('./compare').default;
        assert.deepEqual(result, expect);
    });
});
