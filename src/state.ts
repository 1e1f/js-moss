/// <reference path="../interfaces/moss.d.ts" />

import { clone } from "typed-json-transform";

export const currentErrorPath = (state: Moss.State) => state.errorPaths[state.errorPaths.length - 1];
export const pushErrorPath = (state: Moss.State) => state.errorPaths.push({ path: [] })
export const popErrorPath = (state: Moss.State) => state.errorPaths.pop();

export const newState = (): Moss.State => {
    return { auto: {}, autoMap: {}, stack: {}, strict: false, resolverCache: {}, selectors: {}, errorPaths: [{ path: [] }] };
}

export const newLayer = (): Moss.Layer => {
    return { data: {}, state: newState() }
}

export const pushState = (layer: Moss.Layer) => {
    let state = layer.state;
    if (!state.locked) {
        state = clone(layer.state);
    }
    return { ...layer, state };
}