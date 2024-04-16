// export * from './parser'

// import { safeDump, safeLoad } from 'js-yaml';
// 4.0
import { load, dump, EventType, State } from 'js-yaml';
import { load as sourceMap } from "./parser";

export const toYaml = (obj: any, options?: any): string => {
  if (!obj) return '';
  return dump(obj, options || { skipInvalid: true })
}

export const fromYaml = (yaml: string, options?: any): any => {
  if (!yaml) {
    console.debug("loading empty yaml string");
    return {};
  }

  return load(yaml, options);
}

export { sourceMap }