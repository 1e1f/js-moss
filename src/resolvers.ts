/// <reference path="../interfaces/moss.d.ts" />

import { replaceAll } from 'typed-json-transform';
import { interpolateAsync as __interpolate } from './interpolate';
import { cascadeAsync as _cascade } from './cascade';

export const getBranchAsync = async (urisString: string, resolvers: Moss.Async.Resolvers, layer: Moss.Layer) => {
    const uris = replaceAll(urisString, ', ', ',').split(',');
    let res;
    for (const uri of uris) {
        for (const resolverKey of Object.keys(resolvers).reverse()) {
            const { match, resolve } = resolvers[resolverKey];
            if (match(uri)) {
                let branch: any;
                try {
                    branch = await resolve(uri);
                } catch (e) {
                    e.message = `${resolverKey} resolver failed importing ${uri} with Error: ${e.message}`;
                    throw e;
                }
                layer.state.resolverCache[uri] = { ...branch, ephemeral: true };
                return branch;
            }
        }
    }
    return res;
}

export const getBranchSync = (urisString: string, resolvers: Moss.Sync.Resolvers, layer: Moss.Layer) => {
    const uris = replaceAll(urisString, ', ', ',').split(',');
    let res;
    for (const uri of uris) {
        for (const resolverKey of Object.keys(resolvers).reverse()) {
            const { match, resolve } = resolvers[resolverKey];
            if (match(uri)) {
                let branch: any;
                try {
                    branch = resolve(uri);
                } catch (e) {
                    e.message = `${resolverKey} resolver failed importing ${uri} with Error: ${e.message}`;
                    throw e;
                }
                layer.state.resolverCache[uri] = { ...branch, ephemeral: true };
                return branch;
            }
        }
    }
    return res;
}