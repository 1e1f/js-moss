// export * from './parser'

// import { safeDump, safeLoad } from 'js-yaml';
// 4.0
import { load, dump } from 'js-yaml';

export const toYaml = (obj: any, options?: any): string => {
  if (!obj) return '';
  return dump(obj, options || { skipInvalid: true })
}

export const fromYaml = (yaml: string, options?: any): any => {
  if (!yaml) {
    console.warn("loading empty yaml string");
    return {};
  }
  return load(yaml, options);
}
