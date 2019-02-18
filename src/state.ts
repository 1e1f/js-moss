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
        resolverCache: {},
        selectors: {},
        merge: { operator: <any>'=' },
        errorPaths: [{ path: [] }]
    };
}

export const newLayer = (): Moss.ReturnValue => {
    return { data: {}, state: newState() }
}

export const pushState = ({ data, state }: Moss.ReturnValue) => {
    if (!state.locked) {
        const { resolverCache, ...downstream } = state;
        return {
            data, state: {
                ...clone(downstream),
                resolverCache
            }
        };
    }
    return { data, state };
}