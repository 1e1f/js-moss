import { Moss } from "../types";
import { encode, decode } from "./parser"

export const withoutVersion = (branch: Moss.Branch | string) => {
  if (typeof branch == "string") {
    const { versionSegment, ...withoutVersion } = decode(branch);
    return encode(withoutVersion);
  }
  const { versionSegment, ...withoutVersion } = branch;
  return encode(withoutVersion);
};

export const importPrefix = "^";
export const queryPrefix = "?";

export const encodeVersionLine = (branch: Moss.Branch) =>
  importPrefix + encode(branch) + "\n";

export const parseVersionLine = (versionLine: string) => {
  if (versionLine && versionLine.indexOf(importPrefix) == 0) {
    const bl = versionLine.split('\n')[0].slice(importPrefix.length);
    return decode(bl);
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
