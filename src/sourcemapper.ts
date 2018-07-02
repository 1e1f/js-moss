import * as yaml from 'js-yaml';

interface State {
  keys: any[]
  heap: any[]
  positions: any[]
}

export namespace SourceMapper {
  export interface Node {
    key: number[],
    value: number[],
    children?: { [index: string]: Node }
  }

  const reset = () => {
    return {
      keys: [[]],
      heap: [{}],
      positions: [[]]
    } as State
  }

  const findRange = (node: SourceMapper.Node, minMax: number[]) => {
    minMax = [
      Math.min(node.key ? node.key[0] : Number.MAX_VALUE, minMax[0]),
      Math.max(node.value ? node.value[1] : 0, minMax[1])
    ];
    if (node.children) {
      for (const key of Object.keys(node.children)) {
        const child = node.children[key];
        minMax = findRange(child, minMax);
      }
    }
    return minMax;
  }


  const findRanges = (children: { [index: string]: SourceMapper.Node }) => {
    let minMax = [Number.MAX_VALUE, 0];
    for (const key of Object.keys(children)) {
      const child = children[key];
      minMax = findRange(child, minMax);
    }
    return minMax;
  }

  const getTextLength = (type: any) => {
    if (type) {
      if (type.toString) return type.toString().length;
      if (type.length) return type.length;
      if (typeof type == 'boolean') return 4;
      throw new Error('bad truthy type');
    } else {
      if (type === 0) return 1;
      if (type === false) return 5;
      if (type == null) return 4;
      if (type == undefined) return 9;
    }
  }

  const createListener = (ctx: State) => {
    // the listener delegate calls from js-yaml are adequate if hacky, so we need some stange checks:
    // for example:
    // a) event == 'open' and kind == 'null' means we're starting either a mapping or a sequence
    // b) !lineIndent checks agains negative indent items at the end of the document.
    let level = 0;
    let lastClose = 0;

    const positionsRead: any = {};

    return (event: string, state: any) => {
      const { positions, keys, heap } = ctx;
      const { result, position, lineStart, lineIndent, line, kind } = state;

      // console.log(position, event, kind, result, lineIndent);

      if (event == 'open') {
        switch (kind) {
          default: throw new Error(`unhandled yaml type ${kind}`);
          case undefined: case 'scalar': case 'mapping': case 'sequence': break;
          case null:
            if (!positionsRead[position]) {
              level++;
              keys[level] = [];
              positions[level] = [];
              heap[level] = {};
            }
            break;
        }
      }
      if (event == 'close') {
        switch (kind) {
          default: throw new Error(`unhandled yaml type ${kind}`);
          case 'scalar': case null:
            if (!positionsRead[position]) {
              // const length = position - lastClose;
              // lastClose = position;
              const length = getTextLength(result);
              // console.log(lineIndent);
              positions[level].push([position - length, position, line, (position - lineStart) - length]);
              keys[level].push(result);
            }
            break;
          case 'mapping': {
            if (level) {
              let length = 0;
              const ret: any = {
                key: keys[level - 1].pop() || 'document',
                val: {}
              };
              for (const k of Object.keys(result)) {
                const ref = heap[level][k];
                if (!ref) length += 2;
                else {
                  ret.val[k] = ref;
                  delete heap[level][k];
                }
              }
              const vs = positions[level].splice(-length, length);
              const ks = keys[level].splice(-length, length);
              for (let i = 0; i < length; i += 2) {
                const k = ks[i];
                ret.val[k] = {
                  key: vs[i],
                  value: vs[i + 1]
                }
              }
              level--;
              heap[level][ret.key] = {
                key: positions[level].pop() || [0, 0],
                value: findRanges(ret.val),
                children: ret.val
              };
            }
            break;
          }
          case 'sequence': {
            if (level) {
              let length = result.length;
              const ret: any = {
                key: keys[level - 1].pop() || 'document',
                val: []
              };
              const vs = positions[level].splice(-length, length);
              const ks = keys[level].splice(-length, length);
              for (let i = 0; i < length; i++) {
                ret.val[i] = {
                  key: vs[i],
                  value: vs[i]
                }
              }
              level--;
              const sequenceRange = positions[level].pop() || [0, 0]
              heap[level][ret.key] = {
                key: sequenceRange,
                value: findRanges(ret.val),
                children: ret.val
              };
              break;
            }
          }
        }
      }
      positionsRead[position] = true;
    }
  }

  export const parse = (yamlString: string) => {
    const ctx = reset();

    const result = yaml.load(yamlString, {
      listener: createListener(ctx)
    } as any);

    return ctx.heap[0];
  }
}
