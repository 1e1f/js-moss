declare namespace Expand {
  type Key = '$' | '=' | '^';
  type Open = '{' | '(';
  type Terminal = '}' | ')' | ' ' | '__null__';
  type Op = 'replace' | 'shell' | 'math' | 'fetch';

  interface State {
    detecting?: Key
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

  export interface Options {
    replace?: (sub: string, sourceMap?: number[]) => any
    call?: (sub: any, sourceMap?: number[]) => any
    fetch?: (sub: any, sourceMap?: number[]) => any
    shell?: (sub: string, sourceMap?: number[]) => string
    getStack?: any
    pushErrorState?: (state?: Moss.ErrorPath) => void
    pushErrorPath?: (s: string) => void
    popErrorState?: () => void
  }
}

declare module 'interpolate' {
  export function interpolateAsync(input: any, options: Expand.Options): Promise<any>;
  export function interpolate(input: any, options: Expand.Options): any;
}
