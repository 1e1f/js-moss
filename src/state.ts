/// <reference path="../interfaces/moss.d.ts" />

import { clone } from "typed-json-transform";

export const currentErrorPath = (state: Moss.State) => state.errorPaths[state.errorPaths.length - 1];
export const pushErrorPath = (state: Moss.State) => state.errorPaths.push({ path: [] })
export const popErrorPath = (state: Moss.State) => state.errorPaths.pop();

export const newState = (): Moss.State => {
    return {
        auto: {},
        autoMap: {},
        stack: {},
        strict: false,
        merge: {
            operator: '|',
            precedence: {}
        },
        resolverCache: {},
        selectors: {},
        errorPaths: [{ path: [] }]
    };
}

export const newLayer = (): Moss.ReturnValue => {
    return { data: {}, state: newState() }
}

export const pushState = (layer: Moss.ReturnValue) => {
    if (!layer.state.locked) {
        const { resolverCache, ..._state } = layer.state;
        return {
            data: layer.data,
            state: {
                ...clone(_state),
                merge: {
                    ..._state.merge,
                    precedence: {}
                },
                resolverCache
            }
        };
    }
    return layer;
}