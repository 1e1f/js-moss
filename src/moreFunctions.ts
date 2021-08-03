import { toCamel, fromCamel } from 'typed-json-transform';
import { encodeBranchLocator, decodeBranchLocator, canonicalBl, filterBranchName, transcode } from './branch';
const pluralize = require("pluralize");
import { addFunctions, wrapFunction } from './async';
import { addFunctions as addSyncFunctions, wrapFunction as wrapSyncFunction } from './sync';
import { toYaml } from './yaml';
import { buffer } from 'd3';

const parseStringArgs = (args: any) => {
  if (typeof args === "string") {
    return [args];
  } else if (Array.isArray(args)) {
    return args
  } else if (typeof args == "object") {
    return [args.input, args.options];
  }
}

const capitalize = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt: string) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

// https://stackoverflow.com/a/6475125
const proper = (str: string) => {
  var i, j, lowers, uppers;
  str = str.replace(/([^\W_]+[^\s-]*) */g, (txt: string) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });

  // Certain minor words should be left lowercase unless
  // they are the first or last words in the string
  lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At',
    'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With',
    'Upon', 'Van'];
  for (i = 0, j = lowers.length; i < j; i++)
    str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'),
      (txt: string) => {
        return txt.toLowerCase();
      });

  // Certain words such as initialisms or acronyms should be left uppercase
  uppers = ['Id', 'Tv'];
  for (i = 0, j = uppers.length; i < j; i++)
    str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'),
      uppers[i].toUpperCase());

  return str;
}

const toBase64 = (args: any) => {
  let input;
  if (!args){ return args };
  // let options;
  if (args.options){
    input = args.buffer || args.blob;
  } else {
    input = args;
  }
  let buffer = input.buffer || input.data || input;
  // console.log("buffer", buffer)
  if (typeof buffer === 'string'){ // Assume ascii string
    buffer = Buffer.from(buffer as string);
  } else if (Array.isArray(buffer)){ // ArrayBuffer
    buffer = Buffer.from(buffer)
  }
  const str = buffer.toString('base64')
  return str;
}

addFunctions({
  toCamel: wrapFunction(toCamel, parseStringArgs),
  fromCamel: wrapFunction(fromCamel, parseStringArgs),
  lowercase: wrapFunction((s: string) => s.toLowerCase(), parseStringArgs),
  capslock: wrapFunction((s: string) => s.toUpperCase(), parseStringArgs),
  capitalize: wrapFunction(capitalize, parseStringArgs),
  proper: wrapFunction(proper, parseStringArgs),
  properCase: wrapFunction(proper, parseStringArgs),
  plural: wrapFunction(pluralize, parseStringArgs),
  linkBranch: wrapFunction((branch: any) => branch ? `^${encodeBranchLocator(branch)}` : null),
  link: wrapFunction((bl: string) => bl && `^${canonicalBl(bl)}`),
  // link: wrapFunction((bl: string) => `^${canonicalBl(bl)}`),
  canonicalBl: wrapFunction((s) => s && canonicalBl(s)),
  nameSafe: wrapFunction((s) => s && filterBranchName(s)),
  orgSafe: wrapFunction((s) => s && transcode(filterBranchName(s))),
  toBranchLocator: wrapFunction(encodeBranchLocator),
  toBranch: wrapFunction(decodeBranchLocator),
  print: wrapFunction(toYaml),
  toYaml: wrapFunction(toYaml),
  fromJson: wrapFunction(JSON.parse),
  toBase64: wrapFunction(toBase64),
  toJson: wrapFunction(JSON.stringify),
  json2yaml: wrapFunction((s) => s && toYaml(JSON.parse(s))),
})

addSyncFunctions({
  toCamel: wrapSyncFunction(toCamel, parseStringArgs),
  fromCamel: wrapSyncFunction(fromCamel, parseStringArgs),
  lowercase: wrapSyncFunction((s: string) => s.toLowerCase(), parseStringArgs),
  canonicalBl: wrapSyncFunction((s) => s && canonicalBl(s)),
  nameSafe: wrapSyncFunction((s) => s && filterBranchName(s)),
  orgSafe: wrapFunction((s) => s && transcode(filterBranchName(s))),
  capslock: wrapSyncFunction((s: string) => s.toUpperCase(), parseStringArgs),
  capitalize: wrapSyncFunction(capitalize, parseStringArgs),
  proper: wrapSyncFunction(proper, parseStringArgs),
  properCase: wrapSyncFunction(proper, parseStringArgs),
  plural: wrapSyncFunction(pluralize, parseStringArgs),
  linkBranch: wrapSyncFunction((branch: any) => encodeBranchLocator ? `^${encodeBranchLocator(branch)}` : ''),
  link: wrapSyncFunction((bl: string) => `^${canonicalBl(bl)}`),
  toBranchLocator: wrapSyncFunction(encodeBranchLocator),
  toBranch: wrapSyncFunction(decodeBranchLocator),
  print: wrapSyncFunction(toYaml),
  toYaml: wrapSyncFunction(toYaml),
  fromJson: wrapSyncFunction(JSON.parse),
  toJson: wrapSyncFunction(JSON.stringify),
  toBase64: wrapSyncFunction(toBase64),
  json2yaml: wrapSyncFunction((s) => s && toYaml(JSON.parse(s))),
})

