declare namespace Moss {
  interface KeyPath {
    path: string[]
    rhs?: boolean
  }


  interface State {
    locked?: boolean
    auto?: any
    autoMap?: any
    stack?: any
    selectors?: any
    target?: Moss.Branch
    errorPaths?: KeyPath[]
  }

  interface Branch {
    [index: string]: any;
    'select<'?: any
    '$<'?: any
  }

  interface Layer {
    data: Branch
    state: State
  }

  type Function = (current: Moss.Layer, args: any) => Promise<any>;
  type Resolver = ({ uri }: {
    uri?: string
  }) => Promise<any>;

  interface Functions {
    [index: string]: Function
  }


  interface Resolvers {
    [index: string]: Resolver
  }
}

type ParsedObject = { [index: string]: any };

declare module 'moss' {
  export function getFunctions(): Moss.Functions;
  export function addFunctions(userFunctions: Moss.Functions): null;
  export function next(current: Moss.Layer, input: any): Moss.Layer;
  export function start(input: any): Moss.Layer;

  export function parse(trunk: Moss.Branch, baseParser?: Moss.Branch): ParsedObject;
  export function load(config: string, baseParser: string): ParsedObject;
  export function transform(config: string, baseParser: string): string;

  export function setOptions(options: Expand.Options): void;
}
