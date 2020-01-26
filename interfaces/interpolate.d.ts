declare namespace Expand {
  type Key = '$' | '=' | '^';
  type Open = '{' | '(';
  type Terminal = '}' | ')' | ' ' | '__null__';
  type Op = 'v' | 's' | 'e' | 'f' | 'n';

  interface State {
    detecting?: Key
    header?: Key
    op?: Op
    terminal?: Terminal
    dirty?: boolean
    escape?: boolean
    escaped?: string
    sourceMap?: number[]
  }

  interface Elem extends State {
    out: any[]
    source: any[]
  }

  export interface Options {
    dereferenceSync?: (sub: string, sourceMap?: number[]) => any
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
