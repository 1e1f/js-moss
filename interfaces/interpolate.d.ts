declare namespace Expand {
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

  export interface Options {
    dereference?: (sub: string, sourceMap?: number[]) => any
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
