import { readFileSync } from 'fs';

import { join } from 'path';
import { assert } from 'chai';
import { exec } from 'shelljs';

import { Async, newLayer, SourceMapper, fromYaml, toYaml } from '../src';

const { parse, next, setOptions } = Async;
describe('Async API', () => {
    it('can produce a source map', () => {
        const sourceMap = SourceMapper.parse(readFileSync(join(__dirname, 'sourcemap.yaml'), 'utf8'))
        assert.deepEqual(sourceMap.timestamp.key, [4753, 4762, 170, 0]);
        // console.log(util.inspect(sourceMap, false, 10, true));
    });

    it('state', async () => {
        const { config, env, expect } = fromYaml(readFileSync(join(__dirname, 'state.moss'), 'utf8'));
        assert.deepEqual(await parse(config, env), expect);
    });

    it('cascade', async () => {
        const { config, env, expect } = fromYaml(readFileSync(join(__dirname, 'cascade.moss'), 'utf8'));
        assert.deepEqual(await parse(config, env), expect);
    });

    it('inherit', async () => {
        const { config, env, expect } = fromYaml(readFileSync(join(__dirname, 'inherit.moss'), 'utf8'));
        assert.deepEqual(await parse(config, env), expect);
    });

    it('escape', async () => {
        const { config, env, expect } = fromYaml(readFileSync(join(__dirname, 'escape.moss'), 'utf8'));
        assert.deepEqual(await parse(config, env), expect);
    });

    it('functional', async () => {
        const { config, env, expect } = fromYaml(readFileSync(join(__dirname, 'functional.moss'), 'utf8'));
        let res;
        try {
            res = await parse(config, env)
        } catch (e) {
            console.log(e)
        }
        assert.deepEqual(res, expect);
    });

    it('environment', async () => {
        const { config, env, expect } = fromYaml(readFileSync(join(__dirname, 'kitchen.moss'), 'utf8'));
        const result = (await next(newLayer(), env));
        assert.isBoolean(result.state.selectors.production);
    });

    it('kitchen sink', async () => {
        const { config, env, expect } = fromYaml(readFileSync(join(__dirname, 'kitchen.moss'), 'utf8'));
        let res;
        try {
            res = await parse(config, env)
        } catch (e) {
            console.log(e)
        }
        assert.deepEqual(res, expect);

    });

    it('without shell', async () => {
        const { config, env, expect } = fromYaml(readFileSync(join(__dirname, 'shell.moss'), 'utf8'));
        assert.deepEqual(await parse(config, env), expect.withoutShell);
    });

    it('shell', async () => {
        const { config, env, expect } = fromYaml(readFileSync(join(__dirname, 'shell.moss'), 'utf8'));
        setOptions({
            shell: (str: string) => {
                return (<string>exec(str, { silent: true }).stdout).replace('\r', '').replace('\n', '');
            }
        });
        assert.deepEqual(await parse(config, env), expect.withShell);
    });

    it('test equivalent js code', () => {
        const { config, env, expect } = fromYaml(readFileSync(join(__dirname, 'kitchen.moss'), 'utf8'));
        const result = require('./compare').default;
        assert.deepEqual(result, expect);
    });

    it('import', async () => {
        const { config, env, expect } = fromYaml(readFileSync(join(__dirname, 'import.moss'), 'utf8'));
        let res;
        try {
            res = await parse(config, env)
        } catch (e) {
            res = e;
        }
        assert.deepEqual(res, expect);
    });
});
