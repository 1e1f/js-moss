interface State {
  escape?: boolean
  dollar?: boolean
  open?: boolean
  dirty?: boolean
}

interface Elem {
  state: State
  raw: string
  subst: string
}