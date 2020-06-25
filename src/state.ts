import { Moss } from './types';

import { clone, Graph } from "typed-json-transform";
import { encodeBranchLocator } from "./branch";
// import { jsonStableHash } from "./hash";

export const currentErrorPath = (state: Moss.State) =>
  state.errorPaths[state.errorPaths.length - 1];

export const pushErrorPath = (state: Moss.State, path?: any) =>
  state.errorPaths.push(path || { path: [] });

export const popErrorPath = (state: Moss.State) => state.errorPaths.pop();

export const newState = (branch?: Moss.Branch): Moss.State => {
  const path = branch ? encodeBranchLocator(branch) : "root";
  // const contentHash = jsonStableHash(branch ? branch.data : {});

  const pathGraph = new Graph<Moss.Branch>();
  pathGraph.addNode(path, branch);

  // const contentHashGraph = new Graph<null>();
  // contentHashGraph.addNode(contentHash);

  return {
    auto: {},
    autoMap: {},
    stack: {},
    strict: false,
    merge: {
      operator: "|",
      precedence: {},
    },
    currentBranch: path,
    graph: pathGraph,
    selectors: {},
    errorPaths: [{ path: [] }],
  };
};

export const newLayer = (branch?: Moss.Branch): Moss.ReturnValue => {
  return { data: {}, state: newState(branch) };
};

export const pushState = (layer: Moss.ReturnValue) => {
  if (!layer.state.locked) {
    const { graph, currentBranch, ..._state } = layer.state;
    return {
      data: layer.data,
      state: {
        ...clone(_state),
        merge: {
          ..._state.merge,
          precedence: {},
        },
        currentBranch,
        graph,
      },
    };
  }
  return layer;
};
