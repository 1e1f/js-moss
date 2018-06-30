import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { assert } from 'chai';
import { exec } from 'shelljs';

import * as util from 'util';

import { load, parse, next, newLayer, setOptions, SourceMapper } from '../src';
import { clone, contains, each } from 'typed-json-transform';

describe('moss', () => {
    it('can produce keypath map', () => {
        const sourceMapper = new SourceMapper();
        const sourceMap = sourceMapper.parse(readFileSync(join(__dirname, 'kitchen.moss'), 'utf8'))
        // assert(sourceMap)
        console.log(util.inspect(sourceMap, false, 10, true));
    });

    it('cascade', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'cascade.moss'), 'utf8'));
        assert.deepEqual(parse(config, env), expect);
    });

    it('inherit', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'inherit.moss'), 'utf8'));
        assert.deepEqual(parse(config, env), expect);
    });

    it('escape', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'escape.moss'), 'utf8'));
        assert.deepEqual(parse(config, env), expect);
    });

    it('functional', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'functional.moss'), 'utf8'));
        assert.deepEqual(parse(config, env), expect);
    });

    it('environment', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'kitchen.moss'), 'utf8'));
        const result = next(newLayer(), env).state;
        assert.isBoolean(result.selectors.production);
    });

    it('kitchen sink', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'kitchen.moss'), 'utf8'));
        assert.deepEqual(parse(config, env), expect);
    });

    it('without shell', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'shell.moss'), 'utf8'));
        assert.deepEqual(parse(config, env), expect.withoutShell);
    });

    it('shell', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'shell.moss'), 'utf8'));
        setOptions({
            shell: (str) => {
                return (<string>exec(str, { silent: true }).stdout).replace('\r', '').replace('\n', '');
            }
        });
        assert.deepEqual(parse(config, env), expect.withShell);
    });

    it('test equivalent js code', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'kitchen.moss'), 'utf8'));
        const result = require('./compare').default;
        assert.deepEqual(result, expect);
    });
});
