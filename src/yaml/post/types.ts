
export interface SourceMap {
  line: number
  col: number
}

export type TokenList = Array<string | any>

export interface Token extends SourceMap {
  type: string
  value: any
  text: string
  toString: () => string
}

