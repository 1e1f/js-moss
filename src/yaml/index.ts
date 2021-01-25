// export * from './parser'

import { safeDump, safeLoad } from 'js-yaml';

export const toYaml = (obj: any, options?: any): string => {
  if (!obj) return '';
  return safeDump(obj, options || { skipInvalid: true })
}

export const fromYaml = (yaml: string, options?: any): any => {
  if (!yaml) {
    console.warn("loading empty yaml string");
    return {};
  }
  return safeLoad(yaml, options);
}
