import { Moss, Merge, Expand } from './types';

import { interpolateAsync as __interpolate } from "./interpolate";
import { cascadeAsync as _cascade } from "./cascade";
import { createBranch, createBranchIndex, encodeBranchLocator } from './branch';

export const getBranchesAsync = async (
  bll: string,
  resolvers: Moss.Async.Resolvers,
  layer: Moss.ReturnValue
) => {
  const bls = bll.split(",");
  for (const _bl of bls) {
    const queryBl = _bl.trim();
    // console.log("queryBl", queryBl)
    for (const resolverKey of Object.keys(resolvers).reverse()) {
      try {
        const { match, resolve } = resolvers[resolverKey];
        if (match(queryBl)) {
          let fetchResult = await resolve(queryBl);
          if (fetchResult) {
            const { graph, currentBranch } = layer.state;
            let graphable: Moss.Branch[];
            if (Array.isArray(fetchResult)) {
              graphable = fetchResult;
            }
            else {
              graphable = [fetchResult];
            }
            // console.log("deps", graphable)
            for (const b of graphable) {
              const canonical = (b.ast && b.ast.__s) || encodeBranchLocator(b);
              if (canonical) {
                graph.addNode(canonical, b);
                // console.log(currentBranch, ">", canonical);
                graph.addDependency(currentBranch, canonical);
                let checkRecursion = 0;
                if (checkRecursion) {
                  console.log("recursion?", currentBranch, '?', queryBl, '=>', canonical);
                  const { deps } = createBranchIndex(b);
                  // console.log('si', b.ast)
                  if (deps && deps.length) {
                    for (const { h } of deps) {
                      if (graph.nodes[h]) {
                        console.log('i depend on', h, 'which depends on', graph.dependenciesOf(h));
                      }
                    }
                  } else {
                    // console.log(bl, 'has no deps');
                  }
                }
              } else {
                console.log("resolved node not added?", b)
              }
            }
            layer.state.currentBranch = graphable[0].ast && graphable[0].ast.__s;
            return graphable;
          }
        }
      } catch (error) {
        error.message = `${resolverKey}: ${queryBl} failed with Error: ${error.message}`;
        throw error;
      }
    }
  }
};


export const getBranchesSync = (
  bll: string,
  resolvers: Moss.Sync.Resolvers,
  layer: Moss.ReturnValue
) => {
  const bls = bll.split(",");
  for (const _bl of bls) {
    const queryBl = _bl.trim();
    // console.log("queryBl", queryBl)
    for (const resolverKey of Object.keys(resolvers).reverse()) {
      try {
        const { match, resolve } = resolvers[resolverKey];
        if (match(queryBl)) {
          let fetchResult = resolve(queryBl);
          if (fetchResult) {
            const { graph, currentBranch } = layer.state;
            let graphable: Moss.Branch[];
            if (Array.isArray(fetchResult)) {
              graphable = fetchResult;
            }
            else {
              graphable = [fetchResult];
            }
            // console.log("deps", graphable)
            for (const b of graphable) {
              const canonical = (b.ast && b.ast.__s) || encodeBranchLocator(b);
              if (canonical) {
                graph.addNode(canonical, b);
                // console.log(currentBranch, ">", canonical);
                graph.addDependency(currentBranch, canonical);
                let checkRecursion = 0;
                if (checkRecursion) {
                  console.log("recursion?", currentBranch, '?', queryBl, '=>', canonical);
                  const { deps } = createBranchIndex(b);
                  // console.log('si', b.ast)
                  if (deps && deps.length) {
                    for (const { h } of deps) {
                      if (graph.nodes[h]) {
                        console.log('i depend on', h, 'which depends on', graph.dependenciesOf(h));
                      }
                    }
                  } else {
                    // console.log(bl, 'has no deps');
                  }
                }
              } else {
                console.log("resolved node not added?", b)
              }
            }
            layer.state.currentBranch = graphable[0].ast && graphable[0].ast.__s;
            return graphable;
          }
        }
      } catch (error) {
        error.message = `${resolverKey}: ${queryBl} failed with Error: ${error.message}`;
        throw error;
      }
    }
  }
};
