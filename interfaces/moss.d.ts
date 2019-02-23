interface MossError {
  name: 'MossError',
  at?: string
  message: string
  errorPaths: Moss.ErrorPath[]
  source?: any
  stack?: any
  sourceMap?: any
}

declare namespace Moss {
  interface ErrorPath {
    path: any[],
    rhs?: boolean
  }

  interface State {
    locked?: boolean
    strict: boolean
    auto?: any
    autoMap?: any
    stack?: any
    selectors?: any
    resolverCache?: any
    target?: Moss.BranchData
    errorPaths: ErrorPath[]
    merge?: {
      operator: Merge.Operator,
      precedence: { [x: string]: number }
    }
  }

  interface Branch {
    path?: string
    text?: string
    data?: BranchData
  }

  type BranchData = any;

  type ReturnValue = Merge.ReturnValue<State>

  type Error = MossError
  type ErrorReporter = (error: MossError) => Error

  type Function<T> = (current: Moss.ReturnValue, args: any) => T;
  type Resolver<T> = {
    name?: string,
    match: (uri: string) => boolean;
    resolve: (uri: string) => T;
  }

  type FunctionsMap<T> = {
    [index: string]: Function<T>
  }

  type ResolversMap<T> = {
    [index: string]: Resolver<T>
  }

  class Parser<T> {
    functions: FunctionsMap<T>
    resolvers: ResolversMap<T>
  }

  namespace Async {
    type Functions = FunctionsMap<Promise<any>>
    type Resolvers = ResolversMap<Promise<Moss.Branch>>
  }

  namespace Sync {
    type Functions = FunctionsMap<any>
    type Resolvers = ResolversMap<Moss.Branch>
  }
}

type ParsedObject = { [index: string]: any };

declare module 'moss' {
  export function setErrorReporter(reporter: Moss.ErrorReporter): void

  export namespace Async {
    export function getFunctions(): Moss.Async.Functions;
    export function addFunctions(userFunctions: Moss.Async.Functions): null;
    export function addResolvers(userResolvers: Moss.Async.Resolvers): null;

    export function next(current: Moss.ReturnValue, input: any): Promise<Moss.ReturnValue>;
    export function start(input: any): Promise<Moss.ReturnValue>;

    export function parse(trunk: Moss.BranchData, baseParser?: Moss.BranchData): Promise<ParsedObject>;
    export function load(config: string, baseParser?: string): Promise<ParsedObject>;

    export function fromJSON(config: string, baseParser?: string): Promise<ParsedObject>;
    export function fromJS(trunk: Moss.BranchData, baseParser?: Moss.BranchData): Promise<ParsedObject>;  // named alias for parse
    export function fromYAML(config: string, baseParser?: string): Promise<ParsedObject>; // named alias for load

    export function transform(config: string, baseParser: string): Promise<string>;

    export function setOptions(options: Expand.Options): void;
  }

  export namespace Sync {
    export function getFunctions(): Moss.Sync.Functions;
    export function addFunctions(userFunctions: Moss.Sync.Functions): null;
    export function addResolvers(userResolvers: Moss.Sync.Resolvers): null;

    export function next(current: Moss.ReturnValue, input: any): Moss.ReturnValue;
    export function start(input: any): Moss.ReturnValue;

    export function parse(trunk: Moss.BranchData, baseParser?: Moss.BranchData): ParsedObject;
    export function load(config: string, baseParser?: string): ParsedObject;

    export function fromJSON(config: string, baseParser?: string): ParsedObject;
    export function fromJS(trunk: Moss.BranchData, baseParser?: Moss.BranchData): ParsedObject;  // named alias for parse
    export function fromYAML(config: string, baseParser?: string): ParsedObject; // named alias for load

    export function transform(config: string, baseParser: string): string;

    export function setOptions(options: Expand.Options): void;
  }
}
