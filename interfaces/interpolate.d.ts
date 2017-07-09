interface State {
  escape?: boolean
  dollar?: boolean
  open?: boolean
  dirty?: boolean
  terminal?: string
}

interface Elem {
  state: State
  raw: string
  subst: string
}
