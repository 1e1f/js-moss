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

    export const continueWithNewFrame = (current: Moss.Layer, input: Moss.BranchData) => {
        const layer = pushState(current);
        return parseAny(layer, input);
    }

    export const next = continueWithNewFrame;

    export const parseObject = (current: Moss.Layer) => {
        const { state } = current;
        const source = current.data;
        if (shouldCascade(source)) {
            const pruned = cascade({ data: source, state });
            return { state, data: pruned } as Moss.Layer;
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
                        const res: string = <any>(interpolate(current, key)).data;
                        const layer = continueWithNewFrame(current, source[key]);
                        target[res] = layer.data;
                        state.auto[res] = source[key];
                        state.autoMap[res] = currentErrorPath(state).path.join('.');
                        delete target[key];
                    } else {
                        const { data } = (continueWithNewFrame(current, source[key]));
                        state.auto[key] = data;
                        state.autoMap[key] = currentErrorPath(state).path.join('.');
                        target[key] = data;
                    }
                }
                currentErrorPath(state).path.pop();
            }
            if (current.data['<=']) {
                const src = current.data['<='];
                delete current.data['<='];
                current.data = merge(src, current.data);
            };
            return current;
        }
    }

    export const handleError = (e: MossError, layer: Moss.Layer, input?: Moss.BranchData) => {
        let error: MossError;
        if (e.name && (e.name == 'MossError')) {
            error = e;
        } else {
            error = {
                name: 'MossError',
                message: `${e.message || 'unexpected error'}`,
                options: e.options,
                errorPaths: layer.state.errorPaths,
                at: input || layer.data
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
                message: JSON.stringify({ at: error.errorPaths[0].path.join('.'), ...error }, null, 2)
            }
        }
    }

    export const parseAny = (layer: Moss.Layer, input: Moss.BranchData) => {
        const { state } = layer;
        try {
            if (check(input, Array)) {
                return {
                    data: map(input, (data: any) => {
                        currentErrorPath(state).path.push(data);
                        const nextLayer: Moss.Layer = continueWithNewFrame(layer, data);
                        const res = nextLayer.data
                        currentErrorPath(state).path.pop();
                        return res;
                    }), state
                } as Moss.Layer;
            }
            else if (check(input, Object)) {
                return parseObject({ data: input, state });
            } else {
                currentErrorPath(state).rhs = true;
                return interpolate(layer, input);
            }
        } catch (e) {
            handleError(e, layer, input);
        }
    }

    export const cascade = (current: Moss.Layer) => {
        const { data } = current;
        let res = _cascade(current, data, {
            prefix: '=',
            usePrecedence: true,
            onMatch: (val, key) => {
                currentErrorPath(current.state).path.push(key);
                const nextLayer: Moss.Layer = continueWithNewFrame(current, val);
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
        select: (current: Moss.Layer, args: any) => {
            const { data } = current;
            const locked = clone(current.state);
            const state = { ...locked, locked: true, target: locked.selectors };
            const res = continueWithNewFrame({ data, state }, args);
            current.state.selectors = res.state.selectors;
        },
        stack: (current: Moss.Layer, args: any) => {
            const { data } = current;
            const locked = clone(current.state);
            const state = { ...locked, locked: true, target: locked.stack };
            const res = continueWithNewFrame({ data, state }, args);
            current.state.stack = res.state.stack;
        },
        $: (current: Moss.Layer, args: any) => {
            const res = parseAny(current, args);
            merge(current.state, res.state);
        },
        extend: (parent: Moss.Layer, args: any) => {
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
        log: (current: Moss.Layer, args: any) => {
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
        assert: (parent: Moss.Layer, args: any) => {
            throw ({
                name: 'MossError',
                message: args,
                errorPaths: parent.state.errorPaths,
                branch: args
            });
        },
        each: (parent: Moss.Layer, args: any) => {
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
        },
        map: (parent: Moss.Layer, args: any) => {
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
        remap: (parent: Moss.Layer, args: any) => {
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
        reduce: (parent: Moss.Layer, args: any) => {
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
        compare: (parent: Moss.Layer, args: any) => {
            let first: any;
            return all(args, (arg) => {
                if (!first) first = arg;
                return isEqual(arg, first);
            });
        },
        group: (parent: Moss.Layer, args: any) => {
            const layer = continueWithNewFrame(parent, args);
            const { data } = layer;
            return sum(data, (v: any) => v);
        },
        sum: (parent: Moss.Layer, args: any) => {
            const layer = continueWithNewFrame(parent, args);
            const { data } = layer;
            return sum(data, (v: any) => v);
        }
    });

    function interpolate(layer: Moss.Layer, input: any) {
        const { data, state } = layer;
        let dictionary;
        if (check(data, Object)) {
            dictionary = { ...state.auto, ...data, stack: state.stack };
        } else {
            dictionary = { ...state.auto, stack: state.stack }
        }
        const res = _interpolate(layer, input, dictionary);
        return { data: res, state: layer.state } as Moss.Layer;
    }

    const interpolationFunctions = {};

    export function setOptions(options: Expand.Options) {
        extend(interpolationFunctions, options);
    }

    function _interpolate(layer: Moss.Layer, input: any, dictionary: any) {
        let popAll = 0;
        const options = {
            ...{
                pushErrorState: () => {
                    popAll++;
                },
                popErrorState: (res: string) => {
                    currentErrorPath(layer.state).rhs = true;
                    pushErrorPath(layer.state);
                    currentErrorPath(layer.state).path.push(res);
                },
                replace: (str: string) => { // replace from trie
                    if (!str) return '';
                    let required = true;
                    if (str[str.length - 1] == '?') {
                        required = false;
                        str = str.slice(0, str.length - 1);
                    }
                    const res = valueForKeyPath(str, dictionary);
                    if (res || check(res, Number)) {
                        return res;
                    } else {
                        if (required) {
                            throw ({
                                name: 'MossError',
                                message: `key path [ ${str} ] is not defined in stack`,
                                errorPaths: layer.state.errorPaths.map((o) => {
                                    let path = o.path.join('.');
                                    let firstKey = o.path[0];
                                    if (layer.state.autoMap[firstKey]) {
                                        path = path.replace(firstKey, layer.state.autoMap[firstKey]);
                                    }
                                    return {
                                        ...o,
                                        path: path.split('.')
                                    }
                                }),
                                stack: dictionary
                            });
                        }
                    }
                },
                call: (obj: Object) => { // call method
                    const keys = Object.keys(obj);
                    if (!(keys && keys.length)) return '';
                    currentErrorPath(layer.state).path.push(input);
                    const nextLayer: Moss.Layer = parseAny(layer, obj);
                    const res = nextLayer.data;
                    currentErrorPath(layer.state).path.pop();
                    return res;
                },
                fetch: (uris: string) => {
                    const { data } = getBranch(uris, resolvers, layer);
                    if (!data) {
                        throw ({
                            name: 'MossError',
                            message: `none of the available import resolvers [${Object.keys(resolvers).join(', ')}] successfully resolved any of ${uris}`,
                        })
                    }
                    const res: Moss.Layer = parseAny(layer, data);
                    return res.data;
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