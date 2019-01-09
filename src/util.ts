import { clone } from "typed-json-transform";

export const newState = (): Moss.State => {
    return { auto: {}, autoMap: {}, stack: {}, selectors: {}, errorPaths: [{ path: [] }] };
}

export const newLayer = (): Moss.Layer => {
    return { data: {}, state: newState() }
}

export const pushState = (layer: Moss.Layer) => {
    let state = layer.state;
    if (!state.locked) {
      state = clone(layer.state);
    }
    return  { ...layer, state };
  }