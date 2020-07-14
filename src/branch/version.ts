import { encodeBranchLocator, decodeBranchLocator } from "./locator"
import { Moss } from "../types";

export const withoutVersion = (branch: Moss.Branch | string) => {
  if (typeof branch == "string") {
    const { version, ...withoutVersion } = decodeBranchLocator(branch);
    return encodeBranchLocator(withoutVersion);
  }
  const { version, ...withoutVersion } = branch;
  return encodeBranchLocator(withoutVersion);
};

export const versionPrefix = "^";

export const encodeVersionLine = (branch: Moss.Branch) =>
  versionPrefix + encodeBranchLocator(branch) + "\n";

export const parseVersionLine = (versionLine: string) => {
  if (versionLine.indexOf(versionPrefix) == 0) {
    return decodeBranchLocator(versionLine.slice(versionPrefix.length));
  } else {
    // console.log({ firstLine });
    throw new Error("bad version line: " + versionLine);
  }
}
export const parseEditorText = (text: string) => {
  const [firstLine, ...body] = text.split("\n");
  const metaData = parseVersionLine(firstLine);
  return { ...metaData, text: body.join("\n") };
}

export const getBranchVersionAndText = (branch: Moss.Branch) =>
  encodeVersionLine(branch) + branch.text;
