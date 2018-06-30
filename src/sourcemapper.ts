import * as yaml from 'js-yaml';
import { keyPaths } from 'typed-json-transform';

interface State {
  values: any[]
  results: any[]
  registered: any
}

export class SourceMapper {
  state: State;

  constructor() {
    this.state = {
      values: [],
      results: [],
      registered: {}
    }
  }

  listener(event: string, state: any) {
    const { state: { registered, values, results } } = this;
    if (event == 'close') {
      const { position, lineStart, lineIndent, line, result, kind } = state;
      const linePos = state.position - state.lineStart;
      if (linePos) {
        if (!registered[position]) {
          registered[position] = true;
          values.push({ line, linePos, value: result });
        }
      } else {
        results.push(result)
      }
    }
  }

  parse(yamlString: string) {
    const sourceMap: any = {};

    const { listener, state: { values, results } } = this;
    yaml.load(yamlString, {
      listener: listener.bind(this)
    } as any);

    const root = results[results.length - 1];

    // console.log(root);
    const resultKeyPaths = keyPaths(root, {
      allLevels: true,
      diffArrays: true
    });

    // const leaves = keyPaths(root, {
    //   diffArrays: true
    // });

    // console.log('leaves', leaves);
    // console.log('all keypaths', allKeyPaths);
    // console.log('leaves', leaves);
    // console.log(util.inspect(data, false, 10, true));

    const rkps = resultKeyPaths.reverse();
    // console.log(kps);
    // console.log(leaves.reverse());
    const stack = values.reverse();
    // console.log(values);
    for (const kp of rkps) {
      sourceMap[kp] = stack.shift();
      // const isLeaf = contains(leaves, kp);
      // if (isLeaf) {
      //   sourceMap[kp] = values.shift();
      // } else {
      //   // console.log('map branch', kp);
      //   const { line, linePos } = values.shift();
      //   sourceMap[kp] = { line, linePos };
      // }
    }
    // console.log(sourceMap);
    return sourceMap;
  }
}
