import { toCamel, fromCamel } from 'typed-json-transform';
import { encodeBranchLocator, decodeBranchLocator } from './branch';
const pluralize = require("pluralize");
import { addFunctions, wrapFunction } from './async';
import { addFunctions as addSyncFunctions, wrapFunction as wrapSyncFunction } from './sync';

const parseStringArgs = (args: any) => {
  if (typeof args === "string") {
    return [args];
  } else if (Array.isArray(args)) {
    return args
  } else if (typeof args == "object") {
    return [args.input, args.options];
  }
}

addFunctions({
  toCamel: wrapFunction(toCamel, parseStringArgs),
  fromCamel: wrapFunction(fromCamel, parseStringArgs),
  lowercase: wrapFunction((s: string) => s.toLowerCase(), parseStringArgs),
  capitalize: wrapFunction((s: string) => s.toUpperCase(), parseStringArgs),
  plural: wrapFunction(pluralize, parseStringArgs),
  toBranchLocator: wrapFunction(encodeBranchLocator),
  toBranch: wrapFunction(decodeBranchLocator)
})

addSyncFunctions({
  toCamel: wrapSyncFunction(toCamel, parseStringArgs),
  fromCamel: wrapSyncFunction(fromCamel, parseStringArgs),
  lowercase: wrapSyncFunction((s: string) => s.toLowerCase(), parseStringArgs),
  capitalize: wrapSyncFunction((s: string) => s.toUpperCase(), parseStringArgs),
  plural: wrapSyncFunction(pluralize, parseStringArgs),
  toBranchLocator: wrapSyncFunction(encodeBranchLocator),
  toBranch: wrapSyncFunction(decodeBranchLocator)
})

