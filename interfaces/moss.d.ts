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
    errorPaths: KeyPath[]
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

  namespace Async {
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

  namespace Sync {
    type Function = (current: Moss.Layer, args: any) => any;
    type Resolver = ({ uri }: {
      uri?: string
    }) => any;

    interface Functions {
      [index: string]: Function
    }
    interface Resolvers {
      [index: string]: Resolver
    }
  }
}

type ParsedObject = { [index: string]: any };

declare module 'moss' {
  export namespace Async {
    export function getFunctions(): Moss.Async.Functions;
    export function addFunctions(userFunctions: Moss.Async.Functions): null;
    export function addResolvers(userResolvers: Moss.Async.Resolvers): null;

    export function next(current: Moss.Layer, input: any): Promise<Moss.Layer>;
    export function start(input: any): Promise<Moss.Layer>;

    export function parse(trunk: Moss.Branch, baseParser?: Moss.Branch): Promise<ParsedObject>;
    export function load(config: string, baseParser?: string): Promise<ParsedObject>;

    export function fromJSON(config: string, baseParser?: string): Promise<ParsedObject>;
    export function fromJS(trunk: Moss.Branch, baseParser?: Moss.Branch): Promise<ParsedObject>;  // named alias for parse
    export function fromYAML(config: string, baseParser?: string): Promise<ParsedObject>; // named alias for load

    export function transform(config: string, baseParser: string): Promise<string>;

    export function setOptions(options: Expand.Options): void;
  }

  export namespace Sync {
    export function getFunctions(): Moss.Sync.Functions;
    export function addFunctions(userFunctions: Moss.Sync.Functions): null;
    export function addResolvers(userResolvers: Moss.Sync.Resolvers): null;

    export function next(current: Moss.Layer, input: any): Moss.Layer;
    export function start(input: any): Moss.Layer;

    export function parse(trunk: Moss.Branch, baseParser?: Moss.Branch): ParsedObject;
    export function load(config: string, baseParser?: string): ParsedObject;

    export function fromJSON(config: string, baseParser?: string): ParsedObject;
    export function fromJS(trunk: Moss.Branch, baseParser?: Moss.Branch): ParsedObject;  // named alias for parse
    export function fromYAML(config: string, baseParser?: string): ParsedObject; // named alias for load

    export function transform(config: string, baseParser: string): string;

    export function setOptions(options: Expand.Options): void;
  }
}
