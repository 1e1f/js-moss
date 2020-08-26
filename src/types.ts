import { Graph, Merge } from 'typed-json-transform';

export { Merge, Graph };

export function MossError(error: Moss.Error) {
  const { message, source, stack, errorPaths } = error;
  this.name = "MossError";
  this.message = (message || "");
  this.stack = stack;
  this.source = source;
  this.errorPaths = errorPaths;
}
MossError.prototype = Error.prototype;

// export declare type MossError = Error & Moss.Error;

export declare namespace Moss {
  interface ErrorPath {
    path: any[];
    rhs?: boolean;
  }

  interface ParserState {
    auto?: any;
    stack?: any;
    selectors?: any;
    merge?: {
      operator: Merge.Operator;
      precedence: { [x: string]: number };
    };
  }

  interface SourceCodeState {
    target?: Moss.BranchData;
    autoMap?: any;
    currentBranch?: string;
    errorPaths: ErrorPath[];
    graph?: Graph<Branch>;
  }

  interface State extends ParserState, SourceCodeState {
    locked?: boolean;
    strict: boolean;
  }

  interface Branch {
    context?: string;
    organizationSegment: string;
    projectSegment?: string;
    pathSegment: string;
    kind?: string;
    version?: string;
    text?: string;
    data?: BranchData;
    intermediate?: {
      data: BranchData;
      state: ParserState;
    };
  }

  type BranchData = any;

  type ReturnValue = Merge.ReturnValue<State>;

  export interface Error {
    name: "MossError";
    at?: string;
    message: string;
    errorPaths: Moss.ErrorPath[];
    source?: any;
    stack?: any;
    sourceMap?: any;
  }

  type ErrorReporter = (error: Error) => Error;

  type Function<T> = (current: Moss.ReturnValue, args: any, setter?: (...args: any[]) => void) => T;
  type Resolver<T> = {
    name?: string;
    match: (uri: string) => boolean;
    resolve: (uri: string) => T;
  };

  type FunctionsMap<T> = {
    [index: string]: Function<T>;
  };

  type ResolversMap<T> = {
    [index: string]: Resolver<T>;
  };

  class Parser<T> {
    functions: FunctionsMap<T>;
    resolvers: ResolversMap<T>;
  }

  namespace Async {
    type Functions = FunctionsMap<Promise<any>>;
    type Resolvers = ResolversMap<Promise<Moss.Branch>>;
  }

  namespace Sync {
    type Functions = FunctionsMap<any>;
    type Resolvers = ResolversMap<Moss.Branch>;
  }
}

export type ParsedObject = { [index: string]: any };

export declare namespace Expand {
  type Key = '$' | '=' | '^';
  type Open = '{' | '(';
  type Terminal = '}' | ')' | ' ' | '__null__';
  type Op = 'v' | 's' | 'e' | 'f';

  interface State {
    detecting?: Key
    header?: Key
    op?: Op
    terminal?: Terminal;
    dirty?: boolean
    escape?: boolean
    sourceMap: number[]
  }

  interface Elem {
    state: State
    raw: any[]
    source: any[]
    subst: any[]
  }

  export interface FunctionArguments {
    defer?: boolean,
    sourceMap?: number[]
  }

  export interface Options {
    dereferenceSync?: (sub: string, options?: FunctionArguments) => any
    dereference?: (sub: string, options?: FunctionArguments) => any
    call?: (sub: any, options?: FunctionArguments) => any
    fetch?: (sub: any, options?: FunctionArguments) => any
    shell?: (sub: string, options?: FunctionArguments) => string
    getStack?: any
    pushErrorState?: (state?: Moss.ErrorPath) => void
    pushErrorPath?: (s: string) => void
    popErrorState?: () => void
  }
}
