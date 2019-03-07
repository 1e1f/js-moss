/// <reference path="../interfaces/moss.d.ts" />

import { interpolateAsync as __interpolate } from './interpolate';
import { cascadeAsync as _cascade } from './cascade';

export const getBranchAsync = async (urisString: string, resolvers: Moss.Async.Resolvers, layer: Moss.ReturnValue) => {
    const uris = urisString.split(',');
    let res;
    for (const uri of uris) {
        for (const resolverKey of Object.keys(resolvers).reverse()) {
            const { match, resolve } = resolvers[resolverKey];
            const trimmedUri = uri.trim();
            if (match(trimmedUri)) {
                let branch: any;
                try {
                    branch = await resolve(trimmedUri);
                } catch (e) {
                    e.message = `${resolverKey} resolver failed importing ${trimmedUri} with Error: ${e.message}`;
                    throw e;
                }

                if (branch) {
                    const { graph, currentBranch } = layer.state;

                    graph.addNode(trimmedUri, branch);
                    graph.addDependency(currentBranch, trimmedUri);
                    graph.dependenciesOf(currentBranch);

                    layer.state.currentBranch = trimmedUri;
                }
                return branch;
            }
        }
    }
    return res;
}

export const getBranchSync = (urisString: string, resolvers: Moss.Sync.Resolvers, layer: Moss.ReturnValue) => {
    const uris = urisString.split(',');
    let res;
    for (const uri of uris) {
        for (const resolverKey of Object.keys(resolvers).reverse()) {
            const { match, resolve } = resolvers[resolverKey];
            const trimmedUri = uri.trim();
            if (match(trimmedUri)) {
                let branch: any;
                try {
                    branch = resolve(trimmedUri);
                } catch (e) {
                    e.message = `${resolverKey} resolver failed importing ${trimmedUri} with Error: ${e.message}`;
                    throw e;
                }

                if (branch) {
                    const { graph, currentBranch } = layer.state;

                    graph.addNode(trimmedUri, branch);
                    graph.addDependency(currentBranch, trimmedUri);

                    layer.state.currentBranch = trimmedUri;
                }
                return branch;
            }
        }
    }
    return res;
}