interface State {
  escape?: boolean
  detecting?: string
  op?: string
  dirty?: boolean
  terminal?: string
}

interface Elem {
  state: State
  raw: string
  subst: string
}


declare module 'interpolate' {
  export function interpolate(input: any, replace: (sub: string) => string, call: (sub: any) => any): any;
}
