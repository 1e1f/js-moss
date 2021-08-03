import { Moss } from './types';

import { clone, Graph } from "typed-json-transform";
import { canonicalBl, encodeBranchLocator } from "./branch";
// import { jsonStableHash } from "./hash";

export const currentErrorPath = (state: Moss.State) =>
  state.errorPaths[state.errorPaths.length - 1];

export const pushErrorPath = (state: Moss.State, path?: any) =>
  state.errorPaths.push(path || { path: [] });

export const popErrorPath = (state: Moss.State) => state.errorPaths.pop();

export const newState = (branch?: Moss.Branch, globals: any = {}): Moss.State => {
  const path = canonicalBl(branch ? encodeBranchLocator(branch) : "Root");
  // const contentHash = jsonStableHash(branch ? branch.parsed : {});

  const pathGraph = new Graph<Moss.Branch>();
  pathGraph.addNode(path, branch);

  // const contentHashGraph = new Graph<null>();
  // contentHashGraph.addNode(contentHash);

  return {
    auto: globals,
    autoMap: {},
    stack: globals,
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

export const newLayer = (branch?: Moss.Branch, globals?: any): Moss.ReturnValue => {
  return { data: {}, state: newState(branch, globals) };
};

export const cloneState = (state: Moss.State) => {
  const { graph, ..._state } = state;
  return {
    ...clone(_state),
    graph,
  }
}

// export const pushState = (layer: Moss.ReturnValue) => {
//   if (!layer.state.locked) {
//     // const { graph, currentBranch, ..._state } = layer.state;
//     return {
//       data: layer.data,
//       state: {
//         ...cloneState(layer.state),
//         merge: {
//           ...layer.state.merge,
//           precedence: {},
//         }
//       },
//     };
//   }
//   return layer;
// };

export const pushState = (layer: Moss.ReturnValue) => {
  if (layer.state.locked) {
    return layer;
  }
  const { graph, currentBranch, strict, selectors, errorPaths, stack, merge, auto, autoMap } = layer.state;
  const nextLayer = {
    data: layer.data,
    state: {
      strict,
      currentBranch,
      graph,
      selectors: {
        ...selectors
      },
      errorPaths: [
        ...errorPaths
      ],
      stack: {
        ...stack
      },
      auto: {
        ...auto
      },
      autoMap: {
        ...autoMap
      },
      merge: {
        ...merge,
        precedence: {},
      }
    },
  };
  // console.log("mutbale state", auto);
  // console.log("next state", nextLayer.state);
  return nextLayer as Moss.ReturnValue;
};
