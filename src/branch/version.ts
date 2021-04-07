import { importPrefix, Moss } from "../types";
import { hydrateBranchLocator, stringifyBranchLocator } from './canonical';

export const withoutVersion = (branch: Moss.Branch | string) => {
  if (typeof branch == "string") {
    const { versionSegment, ...withoutVersion } = hydrateBranchLocator(branch);
    return stringifyBranchLocator(withoutVersion);
  }
  const { versionSegment, ...withoutVersion } = branch;
  return stringifyBranchLocator(withoutVersion);
};

export const encodeVersionLine = (branch: Moss.Branch) =>
  importPrefix + stringifyBranchLocator(branch) + "\n";

export const parseVersionLine = (versionLine: string) => {
  if (versionLine && versionLine.indexOf(importPrefix) == 0) {
    const bl = versionLine.split('\n')[0].slice(importPrefix.length);
    return hydrateBranchLocator(bl);
  } else {
    throw new Error("bad version line: " + versionLine);
  }
}

export const parseEditorText = (text: string) => {
  const [firstLine, ...body] = text.split("\n");
  const metadata = parseVersionLine(firstLine);
  return { ...metadata, text: body.join("\n") };
}

export const getBranchVersionAndText = (branch: Moss.Branch) =>
  encodeVersionLine(branch) + branch.text;
