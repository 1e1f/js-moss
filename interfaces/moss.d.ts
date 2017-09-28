declare namespace Moss {
  interface State {
    auto?: any
    stack?: any
    selectors?: any
  }

  interface Branch {
    [index: string]: any;
    $select?: any
    $map?: any
    $temp?: any
    $store?: any
    $function?: any
  }

  interface Layer {
    data: Branch
    state: State
  }

  type Function = (state: Moss.Layer, args: any) => any;

  interface Functions {
    [index: string]: Function
  }
}

declare module 'moss' {
  export function getFunctions(): Moss.Functions;
  export function addFunctions(userFunctions: Moss.Functions): null;
  export function next(current: Moss.Layer, input: any): any;

  export function parse(trunk: Moss.Branch, baseParser?: Moss.Branch): any;
  export function load(config: string, baseParser: string): any;
  export function transform(config: string, baseParser: string): string;

  export function setOptions(options: Expand.Options): void;
}
