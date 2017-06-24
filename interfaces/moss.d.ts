declare namespace Moss {
  interface Trie {
    [index: string]: any;
    $options?: any
    $environment?: any
  }

  interface Layer {
    options?: any;
  }
}

declare module 'moss' {
  export function inheritAndApplyOptions(trie: Moss.Trie, parent: Moss.Trie)

  export function parseLayer(layer: Moss.Trie, parent: Moss.Trie)
  export function parseTrie(trunk: Moss.Trie, baseParser: Moss.Trie)
  export function load(trunk: Moss.Trie, baseParser: Moss.Trie)
}