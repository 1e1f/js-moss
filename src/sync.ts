/// <reference path="../interfaces/moss.d.ts" />

import { map as map, okmap as okmap, arrayify, extend, check, clone, each, merge, union, difference, sum, valueForKeyPath, all, isEqual } from 'typed-json-transform';
import { interpolate as __interpolate } from './interpolate';
import { cascade as _cascade, shouldCascade } from './cascade';
import * as yaml from 'js-yaml';

import { getBranchSync as getBranch } from './resolvers';

import {
    newLayer,
    pushState,
    currentErrorPath,
    pushErrorPath,
    popErrorPath
} from './state';

import { MossError, getErrorReporter } from './util';


export namespace Sync {
    type Functions = Moss.Sync.Functions;
    type Resolvers = Moss.Sync.Resolvers;

    export const continueWithNewFrame = (current: Moss.ReturnValue, input: Moss.BranchData, ref?: any, merging?: any) => {
        const layer = pushState(current);
        if (ref) {
            layer.state.refs.push(input);
        }
        if (merging) {
            layer.state.isMerging = true;
        }
        return parseAny(layer, input);
    }

    export const next = continueWithNewFrame;

    export const parseObject = (current: Moss.ReturnValue) => {
        const { state } = current;
        const source = clone(current.data);
        if (shouldCascade(source)) {
            const pruned = cascade({ data: source, state });
            return { state, data: pruned } as Moss.ReturnValue;
        } else {
            const target = state.target || current.data;
            for (let key of Object.keys(source)) {
                currentErrorPath(state).path.push(key);
                if (key[0] == '\\') {
                    let nextKey = key.slice(1);
                    target[nextKey] = source[key];
                    state.auto[nextKey] = source[key];
                    state.autoMap[nextKey] = currentErrorPath(state).path.join('.');
                    delete target[key];
                } else if (key.slice(-1) === '>') {
                    let nextKey = key.slice(0, key.length - 1);
                    target[nextKey] = source[key];
                    state.auto[nextKey] = source[key];
                    state.autoMap[nextKey] = currentErrorPath(state).path.join('.');
                    delete target[key];
                }
                else {
                    if (key.slice(-1) === '<') {
                        let res;
                        const fn = key.slice(0, key.length - 1);
                        if (functions[fn]) {
                            res = functions[fn](current, source[key]);
                        } else {
                            throw ({
                                name: 'MossError',
                                message: `no known function ${fn}`,
                                errorPaths: state.errorPaths
                            });
                        }
                        delete target[key];
                        if (res) {
                            if (check(res, Object)) {
                                extend(target, res);
                            } else {
                                current.data = res;
                            }
                        }
                    } else if (key[0] == '$') {
                        const newKey: string = <any>(interpolate(current, key)).data;
                        const layer = continueWithNewFrame(current, source[key]);
                        target[newKey] = layer.data;
                        state.auto[newKey] = source[key];
                        state.autoMap[newKey] = currentErrorPath(state).path.join('.');
                        delete target[key];

                    } else if (!state.isMerging && (key[0] == '<')) {
                        const { data } = continueWithNewFrame(current, source[key], source, true);
                        delete target[key];
                        merge(target, { [key]: data });
                    } else {
                        // hot path
                        const { data } = (continueWithNewFrame(current, source[key], source));
                        state.auto[key] = data;
                        state.autoMap[key] = currentErrorPath(state).path.join('.');
                        target[key] = data;
                    }
                }
                currentErrorPath(state).path.pop();
            }
            // if (Object.keys(target).length) {
            //   const copy = clone(target);
            //   clean(target)
            //   merge(copy, copy);
            // }
            // if (current.data['<=']) {
            //   const src = current.data['<='];
            //   delete current.data['<='];
            //   current.data = merge(src, current.data);
            // }
            return current;
        }
    }

    export const handleError = (e: MossError, layer: Moss.ReturnValue, input?: Moss.BranchData) => {
        let error: MossError;
        if (e.name && (e.name == 'MossError')) {
            error = e;
        } else {
            let at: any;
            layer.state.errorPaths.forEach(p => { if (!p.rhs) at = p.path });
            error = {
                name: 'MossError',
                message: `${e.message || 'unexpected error'}`,
                options: e.options,
                errorPaths: layer.state.errorPaths,
                at: at.join('.')
            };
        }
        try {
            const nestedError = JSON.parse(error.message);
            if (nestedError.name && (nestedError.name == 'MossError')) {
                error = nestedError;
            }
        } catch { }
        if (getErrorReporter()) {
            throw (getErrorReporter()(error));
        } else {
            throw {
                name: 'MossError',
                message: JSON.stringify(error, null, 2),
                data: error
            }
        }
    }

    export const parseAny = (layer: Moss.ReturnValue, input: Moss.BranchData) => {
        const { state } = layer;
        try {
            if (check(input, Array)) {
                return {
                    data: map(input, (data: any) => {
                        currentErrorPath(state).path.push(data);
                        const nextLayer: Moss.ReturnValue = continueWithNewFrame(layer, data);
                        const res = nextLayer.data
                        currentErrorPath(state).path.pop();
                        return res;
                    }), state
                } as Moss.ReturnValue;
            }
            else if (check(input, Object)) {
                return parseObject({ data: input, state });
            } else {
                return interpolate(layer, input);
            }
        } catch (e) {
            handleError(e, layer, input);
        }
    }

    export const cascade = (current: Moss.ReturnValue) => {
        const { data } = current;
        let res = _cascade(current, data, {
            prefix: '=',
            usePrecedence: true,
            onMatch: (val, key) => {
                currentErrorPath(current.state).path.push(key);
                const nextLayer: Moss.ReturnValue = continueWithNewFrame(current, val);
                const continued = nextLayer.data;
                currentErrorPath(current.state).path.pop();
                return continued;
            }
        });
        _cascade(current, data, {
            prefix: '+',
            usePrecedence: false,
            onMatch: (val, key) => {
                const layer = current //pushState(current);
                currentErrorPath(current.state).path.push(key);
                val = (continueWithNewFrame(current, val)).data;
                currentErrorPath(current.state).path.pop();
                if (check(res, Array)) {
                    res = union(res, arrayify(val))
                } else if (check(res, Object) && check(val, Object)) {
                    res = merge(res, val);
                } else {
                    throw ({
                        name: 'MossError',
                        message: `selected branch type is not compatible with previous branch type`,
                        errorPaths: layer.state.errorPaths,
                        branch: {
                            source: val,
                            destination: res
                        }
                    });
                }
            }
        });
        _cascade(current, data, {
            prefix: '-',
            usePrecedence: false,
            onMatch: (val, key) => {
                currentErrorPath(current.state).path.push(key);
                val = (continueWithNewFrame(current, val)).data;
                currentErrorPath(current.state).path.pop();
                if (check(res, Array)) {
                    res = difference(res, arrayify(val));
                } else if (check(res, Object)) {
                    if (check(val, String)) {
                        delete res[val];
                    }
                    for (const key of Object.keys(val)) {
                        delete res[key];
                    }
                }
            }
        });
        return res;
    }

    const functions: Functions = {}
    const resolvers: Resolvers = {}

    export function getFunctions() {
        return functions;
    }

    export function addFunctions(userFunctions: Functions) {
        extend(functions, userFunctions);
    }

    export function getResolvers() {
        return resolvers;
    }

    export function addResolvers(userResolvers: Resolvers) {
        extend(resolvers, userResolvers);
    }

    addResolvers({
        hello: {
            match: (uri: string) => uri == 'hello',
            resolve: (uri: string) => ({
                path: uri,
                data: 'world!'
            })
        }
    });

    addFunctions({
        select: (current: Moss.ReturnValue, args: any) => {
            const { data } = current;
            const locked = clone(current.state);
            const state = { ...locked, locked: true, target: locked.selectors };
            const res = continueWithNewFrame({ data, state }, args);
            current.state.selectors = res.state.selectors;
        },
        stack: (current: Moss.ReturnValue, args: any) => {
            const { data } = current;
            const locked = clone(current.state);
            const state = { ...locked, locked: true, target: locked.stack };
            const res = continueWithNewFrame({ data, state }, args);
            current.state.stack = res.state.stack;
        },
        $: (current: Moss.ReturnValue, args: any) => {
            const res = parseAny(current, args);
            merge(current.state, res.state);
        },
        extend: (parent: Moss.ReturnValue, args: any) => {
            const layer = continueWithNewFrame(parent, args);
            const { data } = layer;
            if (!data.source) {
                throw ({
                    name: 'MossError',
                    message: `for $extend please supply an 'source:' branch`,
                    errorPaths: layer.state.errorPaths
                });
            }
            let res = data.source;
            delete data.source;
            for (const i in data) {
                const ir = continueWithNewFrame(layer, data[i]);
                res = merge(res, ir.data);
            };
            return res;
        },
        log: (current: Moss.ReturnValue, args: any) => {
            each(arrayify(args), (i) => {
                let kp = i;
                let format = 'json';
                if (check(i, Object)) {
                    kp = i.keyPath;
                    format = i.format;
                }
                const val = kp ? valueForKeyPath(kp, current) : current;
                switch (format) {
                    case 'json': console.log(JSON.stringify(val, null, 2)); break;
                    case 'yaml': console.log(yaml.dump(val)); break;
                }
            });
        },
        assert: (parent: Moss.ReturnValue, args: any) => {
            throw ({
                name: 'MossError',
                message: args,
                errorPaths: parent.state.errorPaths,
                branch: args
            });
        },
        each: (parent: Moss.ReturnValue, args: any) => {
            const layer = continueWithNewFrame(parent, args);
            const { data } = layer;
            if (!data.of) {
                throw ({
                    name: 'MossError',
                    message: `for $each please supply an 'of:' branch`,
                    errorPaths: layer.state.errorPaths,
                    branch: data
                });
            }
            if (!data.do) {
                throw ({
                    name: 'MossError',
                    message: `for $each please supply a 'do:' branch`,
                    errorPaths: layer.state.errorPaths,
                    branch: data
                });
            }
            let i = 0;
            for (const key in data.of) {
                const item = data.of[key];
                const ret = continueWithNewFrame(layer, item);
                ret.state.auto.index = i;
                i++;
                continueWithNewFrame(ret, clone(data.do));
            };
            return Promise.resolve();
        },
        map: (parent: Moss.ReturnValue, args: any) => {
            const base = currentErrorPath(parent.state).path.join('.');
            const { from, to } = args;
            if (!from) {
                throw ({
                    name: 'MossError',
                    message: `for $map please supply 'from:' as input`,
                    errorPaths: parent.state.errorPaths,
                });
            }
            currentErrorPath(parent.state).path.push('from');
            const fromCtx = continueWithNewFrame(parent, from);
            currentErrorPath(fromCtx.state).path.pop();
            if (!to) {
                throw ({
                    name: 'MossError',
                    message: `for $map please supply 'to:' as input`,
                    errorPaths: fromCtx.state.errorPaths,
                    branch: args
                });
            }
            let i = 0;
            try {
                return okmap(fromCtx.data, (item: any, key: string) => {
                    if (fromCtx.state.autoMap[key]) {
                        currentErrorPath(fromCtx.state).path = fromCtx.state.autoMap[key].split('.');
                    }
                    const ctx = continueWithNewFrame(fromCtx, item);
                    currentErrorPath(ctx.state).path = (base + ('.to')).split('.');
                    const nextLayer = pushState(ctx);
                    nextLayer.state.auto.index = i;
                    nextLayer.state.auto.value = item;
                    nextLayer.state.auto.memo = key;
                    i++;
                    return (parseAny(nextLayer, clone(to))).data
                });
            } catch (e) {
                throw (e);
            }
        },
        remap: (parent: Moss.ReturnValue, args: any) => {
            const base = currentErrorPath(parent.state).path.join('.');
            const { from, to } = args;
            if (!from) {
                throw ({
                    name: 'MossError',
                    message: `for $map please supply 'from:' as input`,
                    errorPaths: parent.state.errorPaths,
                });
            }
            currentErrorPath(parent.state).path.push('from');
            const fromCtx = continueWithNewFrame(parent, from);
            currentErrorPath(fromCtx.state).path.pop();
            if (!to) {
                throw ({
                    name: 'MossError',
                    message: `for $map please supply 'to:' as input`,
                    errorPaths: fromCtx.state.errorPaths,
                    branch: args
                });
            }
            let i = 0;
            try {
                return okmap(fromCtx.data, (item: any, key: string) => {
                    if (fromCtx.state.autoMap[key]) {
                        currentErrorPath(fromCtx.state).path = fromCtx.state.autoMap[key].split('.');
                    }
                    const ctx = continueWithNewFrame(fromCtx, item);
                    currentErrorPath(ctx.state).path = (base + ('.to')).split('.');
                    const nextLayer = pushState(ctx);
                    nextLayer.state.auto.index = i;
                    nextLayer.state.auto.value = item;
                    nextLayer.state.auto.memo = key;
                    i++;
                    return (parseAny(nextLayer, clone(to))).data
                });
            } catch (e) {
                throw (e);
            }
        },
        reduce: (parent: Moss.ReturnValue, args: any) => {
            const layer = continueWithNewFrame(parent, args);
            const { data } = layer;
            if (!data.each) {
                throw ({
                    name: 'MossError',
                    message: `for $reduce please supply 'each:' as branch`,
                    errorPaths: layer.state.errorPaths,
                    branch: data
                });
            }
            if (!data.with) {
                throw ({
                    name: 'MossError',
                    message: `for $reduce please supply 'with:' in branch`,
                    errorPaths: layer.state.errorPaths,
                    branch: data
                });
            }
            if (!(data.memo || check(data.memo, Number))) {
                throw ({
                    name: 'MossError',
                    message: `for $reduce please supply 'memo:' in branch`,
                    errorPaths: layer.state.errorPaths,
                    branch: data
                });
            }
            if (check(data.each, Array)) {
                let res: any = data.memo;
                for (const i in data.each) {
                    const val = data.each[i];
                    const layer = continueWithNewFrame(parent, val);
                    if (functions[data.with]) {
                        res = functions[data.with](layer, { value: val, memo: res, index: i });
                    }
                    else {
                        const nextLayer = pushState(layer);
                        nextLayer.state.auto.index = i;
                        nextLayer.state.auto.value = val;
                        nextLayer.state.auto.memo = res;
                        res = (parseAny(nextLayer, data.with)).data;
                    }
                };
                return res;
            }
            if (check(data.each, Object)) {
                let i = 0;
                const nextLayer = pushState(layer);
                const { state } = nextLayer;
                state.auto.memo = data.memo || 0;
                for (const key in data.each) {
                    const val = data.each[key];
                    state.auto.index = i;
                    i++;
                    state.auto.key = key;
                    state.auto.value = val;
                    const res = (parseAny(nextLayer, clone(data.with))).data;
                    if (check(res, Object)) {
                        extend(nextLayer.state.auto.memo, res);
                    }
                    else state.auto.memo = state.auto.memo + res;
                };
                const res = state.auto.memo;
                return res;
            }
        },
        compare: (parent: Moss.ReturnValue, args: any) => {
            let first: any;
            return all(args, (arg) => {
                if (!first) first = arg;
                return isEqual(arg, first);
            });
        },
        group: (parent: Moss.ReturnValue, args: any) => {
            const layer = continueWithNewFrame(parent, args);
            const { data } = layer;
            return sum(data, (v: any) => v);
        },
        sum: (parent: Moss.ReturnValue, args: any) => {
            const layer = continueWithNewFrame(parent, args);
            const { data } = layer;
            return sum(data, (v: any) => v);
        }
    });

    function interpolate(layer: Moss.ReturnValue, input: any) {
        const { data, state } = layer;
        const dictionary = { ...state.auto, stack: state.stack }
        try {
            const res = _interpolate(layer, input, dictionary);
            return { data: res, state: layer.state } as Moss.ReturnValue;
        } catch (e) {
            if (e.function) {
                throw {
                    message: e.message
                }
            }
            pushErrorPath(layer.state);
            currentErrorPath(layer.state).rhs = input || true;
            currentErrorPath(layer.state).path = e.sourceMap;
            throw {
                message: e.message
            }
        }
    }

    const interpolationFunctions = {};

    export function setOptions(options: Expand.Options) {
        extend(interpolationFunctions, options);
    }

    function _interpolate(layer: Moss.ReturnValue, input: any, dictionary: any) {
        let popAll = 0;
        const options = {
            ...{
                replace: (str: string) => { // replace from trie
                    if (!str) return;
                    const res = valueForKeyPath(str, dictionary);
                    if (res) {
                        let errorPath = [];
                        const [firstKey, ...remainder] = str.split('.');
                        if (layer.state.autoMap[firstKey]) {
                            const kpLocation = layer.state.autoMap[firstKey];
                            errorPath = kpLocation.split('.').concat(remainder);
                        }
                        pushErrorPath(layer.state);
                        currentErrorPath(layer.state).path = errorPath;
                    }
                    return res;
                },
                call: (obj: Object) => { // call method
                    const keys = Object.keys(obj);
                    if (!(keys && keys.length)) return '';
                    const nextLayer: Moss.ReturnValue = parseAny(layer, obj);
                    const res = nextLayer.data;
                    return res;
                },
                fetch: (uris: string) => {
                    const b = getBranch(uris, resolvers, layer);
                    if (!b) {
                        throw ({
                            name: 'MossError',
                            message: `Can't resolve ${uris}.\nNone of the available resolvers found a match.\n[${(map(resolvers, (r) => r.name)).filter(e => e).join(', ')}] `,
                            sourceMap: [0, uris.length]
                        })
                    }
                    if (b.data) {
                        const res: Moss.ReturnValue = parseAny(layer, b.data);
                        const sourceMap = '^' + b.path;
                        pushErrorPath(layer.state);
                        currentErrorPath(layer.state).rhs = sourceMap;
                        currentErrorPath(layer.state).path.push(sourceMap);
                        return res.data;
                    }
                },
                shell: () => 'no shell method supplied',
                getStack: () => {
                    if (!layer.state.strict) {
                        return { ...layer.state.auto, ...layer.data, stack: layer.state.stack };
                    }
                    return { stack: layer.state.stack }
                }
            }, ...interpolationFunctions
        }
        let { value, changed } = __interpolate(input, options);
        if (changed) {
            if (check(value, Object)) {
                return clone(value);
            }
            value = _interpolate(layer, value, dictionary);
        } else {
            value = clone(value) // object immutability
        }
        while (popAll > 0) {
            popErrorPath(layer.state);
            popAll--;
        }
        return value;
    }

    export function start(trunk: Moss.BranchData) {
        return parseAny(newLayer(), trunk);
    }

    export function parse(trunk: Moss.BranchData, baseParser?: Moss.BranchData) {
        if (baseParser) {
            const layer = parseAny(newLayer(), baseParser);
            return (parseAny(layer, trunk)).data;
        }
        return (start(trunk)).data;
    }

    export function fromJSON(config: string, baseParser?: string) {
        if (baseParser) {
            return parse(JSON.parse(config), JSON.parse(baseParser));
        }
        return parse(JSON.parse(config));
    }

    export function load(config: string, baseParser?: string) {
        if (baseParser) {
            return parse(yaml.load(config), yaml.load(baseParser));
        }
        return parse(yaml.load(config));
    }

    export function transform(config: string, baseParser?: string) {
        return yaml.dump(load(config, baseParser));
    }

}