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
