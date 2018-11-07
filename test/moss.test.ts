import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { assert } from 'chai';
import { exec } from 'shelljs';

import { parse, next, newLayer, setOptions, SourceMapper } from '../src';

describe('moss', () => {
    it('can produce a source map', () => {
        const sourceMap = SourceMapper.parse(readFileSync(join(__dirname, 'sourcemap.yaml'), 'utf8'))
        assert.deepEqual(sourceMap.timestamp.key, [4763, 4772, 170, 0]);
        // console.log(util.inspect(sourceMap, false, 10, true));
    });

    it('cascade', async () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'cascade.moss'), 'utf8'));
        assert.deepEqual(await parse(config, env), expect);
    });

    it('inherit', async () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'inherit.moss'), 'utf8'));
        assert.deepEqual(await parse(config, env), expect);
    });

    it('escape', async () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'escape.moss'), 'utf8'));
        assert.deepEqual(await parse(config, env), expect);
    });

    it('functional', async () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'functional.moss'), 'utf8'));
        assert.deepEqual(await parse(config, env), expect);
    });

    it('environment', async () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'kitchen.moss'), 'utf8'));
        const result = (await next(newLayer(), env)).state;
        assert.isBoolean(result.selectors.production);
    });

    it('kitchen sink', async () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'kitchen.moss'), 'utf8'));
        assert.deepEqual(await parse(config, env), expect);
    });

    it('without shell', async () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'shell.moss'), 'utf8'));
        assert.deepEqual(await parse(config, env), expect.withoutShell);
    });

    it('shell', async () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'shell.moss'), 'utf8'));
        setOptions({
            shell: (str) => {
                return (<string>exec(str, { silent: true }).stdout).replace('\r', '').replace('\n', '');
            }
        });
        assert.deepEqual(await parse(config, env), expect.withShell);
    });

    it('test equivalent js code', () => {
        const { config, env, expect } = yaml.load(readFileSync(join(__dirname, 'kitchen.moss'), 'utf8'));
        const result = require('./compare').default;
        assert.deepEqual(result, expect);
    });
});
