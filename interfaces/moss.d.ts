declare namespace Moss {
  interface State {
    stack?: any
    heap?: any
    selectors?: any
    index?: number
  }

  interface Branch {
    [index: string]: any;
    $select?: any
    $each?: any
    $stack?: any
    $heap?: any
  }

  interface Layer {
    data: Branch
    state: State
  }

  type Function = (context: Moss.Layer, args: any) => any;

  interface Functions {
    [index: string]: Function
  }
}

declare module 'moss' {
  export function getFunctions(): Moss.Functions;
  export function addFunctions(userFunctions: Moss.Functions): null;
  export function moss(input: Moss.Branch, state: Moss.State): any
  export function load(trunk: Moss.Branch, baseParser?: Moss.Branch): any;
}