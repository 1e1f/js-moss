import { Moss, Merge, Expand } from './types';

import { interpolateAsync as __interpolate } from "./interpolate";
import { cascadeAsync as _cascade } from "./cascade";

export const getBranchAsync = async (
  bll: string,
  resolvers: Moss.Async.Resolvers,
  layer: Moss.ReturnValue
) => {
  const bls = bll.split(",");
  let res;
  for (const _bl of bls) {
    const bl = _bl.trim();
    for (const resolverKey of Object.keys(resolvers).reverse()) {
      try {
        const { match, resolve } = resolvers[resolverKey];
        if (match(bl)) {
          let branch: any;
          branch = await resolve(bl);
          if (branch) {
            if (Array.isArray(branch)) {
              for (const b of branch) {
                if (b.ast?.__bl) {
                  const bl = b.ast.__bl;
                  console.log("query b, should limit recursion somewhere or ...", bl);
                  const { graph, currentBranch } = layer.state;
                  graph.addNode(bl, b);
                  graph.addDependency(currentBranch, bl);
                  // graph.dependenciesOf(currentBranch);
                  // layer.state.currentBranch = bl;
                }
              }
              return branch;
            }
            else {
              const { graph, currentBranch } = layer.state;
              graph.addNode(bl, branch);
              graph.addDependency(currentBranch, bl);
              // graph.dependenciesOf(currentBranch);
              layer.state.currentBranch = bl;
              return branch;
            }
          }
        }
      } catch (error) {
        error.message = `${resolverKey} resolver failed importing ${bl} with Error: ${error.message}`;
        throw error;
      }
    }
  }
  return res;
};

export const getBranchSync = (
  bll: string,
  resolvers: Moss.Sync.Resolvers,
  layer: Moss.ReturnValue
) => {
  const bls = bll.split(",");
  let res;
  for (const _bl of bls) {
    const bl = _bl.trim();
    for (const resolverKey of Object.keys(resolvers).reverse()) {
      try {
        const { match, resolve } = resolvers[resolverKey];
        if (match(bl)) {
          let branch: any;
          branch = resolve(bl);
          if (branch) {
            const { graph, currentBranch } = layer.state;
            graph.addNode(bl, branch);
            graph.addDependency(currentBranch, bl);
            graph.dependenciesOf(currentBranch);
            layer.state.currentBranch = bl;
            return branch;
          }
        }
      } catch (e) {
        e.message = `${resolverKey} resolver failed importing ${bl}\nError: ${e.message}`;
        // throw e;
      }
    }
  }
  return res;
};
