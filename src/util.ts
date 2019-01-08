
export const newState = (): Moss.State => {
    return { auto: {}, autoMap: {}, stack: {}, selectors: {}, errorPaths: [{ path: [] }] };
}

export const newLayer = (): Moss.Layer => {
    return { data: {}, state: newState() }
}
