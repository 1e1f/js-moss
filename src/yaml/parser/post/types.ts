


export type TokenList = Array<string | any>

export class Location {
  line: number
  col: number
  indent: number

  constructor(line, col, indent) {
    this.line = line || 0;
    this.col = col || 0;
    this.indent = indent || 0;
  }
}

export class Token extends Location {
  type: string
  value: any
  text: string
  toString = () => {
    return this.text;
  }
  constructor(type: string, text: string, location?: Location, indent?: number) {
    if (!location) {
      throw new Error(`location is required for token [ ${text} ]`);
    }
    super(location.line, location.col, indent || location.indent);

    this.type = type;
    this.text = text;
    this.value = text;

    return this;
  }
}


export class SourceMap {
  startLine?: number
  endLine?: number
  startCol?: number
  endCol?: number
  comment?: Comment
  indent?: number
  flow?: Flow
  constructor(tok?: Token | SourceMap) {
    if (!tok) {
      throw new Error(`new SourceMap requires a token or sourcemap`);
    }
    if (tok instanceof SourceMap) {
      this.expandWithMap(tok);
    } else {
      this.expandWithToken(tok);
    }
    return this;
  }

  /**
   * expandWithToken
   */
  public expandWithToken(t: Token) {
    if (!t) {
      throw new Error(`expanding sourcemap on line @ ${this.startLine} with null token`);
    }
    if (this.indent === undefined) {
      this.indent = t.indent || 0;
    }
    this.startLine = Math.min(this.startLine || 0, t.line);
    this.endLine = Math.max(this.endLine || this.startLine, t.line);
    this.startCol = Math.min(this.startCol || 0, t.col);
    this.endCol = Math.max(this.endCol || this.endCol, t.col);
  }

  /**
   * expandWithMap
   */
  public expandWithMap(m: SourceMap) {
    if (!m) {
      throw new Error(`expanding sourcemap on line @ ${this.startLine} with null sourcemap`);
    }
    if (this.indent === undefined) {
      this.indent = m.indent || 0;
    }
    this.startLine = Math.min(this.startLine, m.startLine);
    this.endLine = Math.max(this.endLine, m.endLine);
    this.startCol = Math.min(this.startCol, m.startCol);
    this.endCol = Math.max(this.endCol, m.endCol);
  }

  public expandWithMultiple(...iter: SourceMap[]) {
    for (const b of iter) {
      this.expandWithMap(b);
    }
  }

  public indentString() {
    let r = '';
    for (let i = 0; i < this.indent; i++) {
      r += ' ';
    }
    return r;
  }

  public printComment() {
    if (this.comment) {
      return this.comment.toYaml();
    }
    let r = '';
    if (this.comment) {
      r += ` #${this.comment}`;
    }
    return r;
  }

  public fork() {
    const r = new SourceMap(this);
    return r;
  }
}

export enum Flow {
  block,
  flow
}

// export class Key {
//   identifier: string | number;
//   source: SourceMap;

//   constructor(identifier: string | number, source: SourceMap) {
//     this.identifier = identifier;
//     this.source = source;
//     return this;
//   }

//   public toYaml() {
//     return `${this.source.indentString()}${this.identifier}${this.source.printComment()}`;
//   }
// }

export class String {
  value: string;
  flow: Flow;
  source: SourceMap;

  public toYaml() {
    return `${this.value}${this.source.printComment()}`;
  }
}

export class Identifier {
  value: string;
  source: SourceMap;

  constructor(chunk, sm) {
    this.value = chunk;
    this.source = sm;
    return this;
  }

  public toYaml() {
    return `${this.value}`;
  }
}

export class Comment {
  value: string;
  source: SourceMap;

  constructor(comment, sm) {
    this.value = comment;
    this.source = sm;
    return this;
  }

  public toYaml() {
    return `# ${this.value}`;
  }
}

export class Number {
  value: number;
  kind: "int" | "float" | "hex";
  source: SourceMap;

  constructor(value: number, kind: "int" | "float" | "hex", source: SourceMap) {
    if (value) {
      this.value = value;
      this.source = source;
      this.kind = kind;
    }
    return this;
  }

  public toYaml() {
    return `${this.value}${this.source.printComment()}`;
  }
}

export type Node = Mapping | Sequence | String | Number;

export class Pair {
  key: Identifier;
  value: Node;
  source: SourceMap;

  constructor(key: Identifier, value: Node) {
    this.key = key;
    this.source = key.source.fork();
    if (value) {
      this.value = value;
      this.source.expandWithMap(value.source);
    }
    return this;
  }
}

export class Expression {
  node: Node;
  source: SourceMap;
  deref?: boolean;

  constructor(node: Node, options: { deref }) {
    this.node = node;
    this.source = node.source.fork();

    if (options?.deref) {
      this.deref = true;
      this.source.expandWithToken(options?.deref);
    }
    return this;
  }
}

export class Mapping {
  pairs: Pair[] = []
  source: SourceMap;

  constructor(pairs: Pair[]) {
    this.pairs = pairs;
    const [first, ...next] = pairs.map(({ source }) => source);
    this.source = first.fork();
    if (next.length) {
      this.source.expandWithMultiple(...next);
    }
    return this;
  }

  toJS = () => {
    const ret = {};
    for (let i = 0; i < this.pairs.length; i++) {
      const { key, value } = this.pairs[i];
      ret[key.value] = value;
    }
    return ret;
  }

  public toYaml() {
    let ret = [];
    for (let i = 0; i < this.pairs.length; i++) {
      const { key, value } = this.pairs[i];
      ret.push(key.toYaml());
      ret.push(value.toYaml());
    }
    if (this.source.flow == Flow.block) {
      ret.join('\n');
    } else {
      ret.join(', ');
    }
    return ret;
  }
}

export class Sequence {
  nodes: Node[];
  source: SourceMap;

  constructor(nodes: Node[]) {
    this.nodes = nodes;
    const [first, ...next] = nodes.map(({ source }) => source);
    this.source = first.fork();
    if (next.length) {
      this.source.expandWithMultiple(...next);
    }
    return this;
  }

  public toYaml() {
    let ret = [];
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (this.source.flow == Flow.block) {
        ret.push(`- ${node.toYaml()}`);
      } else {
        ret.push(node.toYaml());
      }
    }
    if (this.source.flow == Flow.block) {
      ret.join('\n');
    } else {
      ret.join(', ');
    }
    return ret;
  }
}

