/// <reference path="../interfaces/moss.d.ts" />

import { clone } from "typed-json-transform";

export const newState = (): Moss.State => {
    return { auto: {}, autoMap: {}, stack: {}, resolverCache: {}, selectors: {}, errorPaths: [{ path: [] }] };
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

export function MossError(error: Moss.Error) {
    const { message, branch, stack, errorPaths } = error;
    this.name = "MossError";
    this.message = (message || "");
    this.stack = stack;
    this.branch = branch;
    this.errorPaths = errorPaths.map(e => ({ ...e, path: e.path.join('.') }))
}
MossError.prototype = Error.prototype;