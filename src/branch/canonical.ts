import { Moss } from "../types";
import { decode, encode } from "./parser";

export const canonicalBl = (bl: string | Moss.Branch) => {
  if (typeof bl == "string") {
    return encode(decode(bl));
  }
  return encode(canonicalBranchLocator(bl));
};

export const disambiguatedHash = (org: string) => {
  return decode(org, "organizationSegment");
};

export const nameHash = (org: string) => {
  return decode(org, "nameSegment");
};

export const canonicalBranchLocator = (branch: Moss.Branch) =>
  decode(encode(branch));

export const filterBranchName = (text) => {
  if (!text) return text;
  if (text.length) {
    if (text.length > 1) {
      text = text.trim();
    }
    const seRegex = /[^a-zA-Z0-9]/g;
    text[0] = text[0].replace(seRegex, "");
    if (text.length > 1) {
      text[text.length - 1] = text[text.length - 1].replace(seRegex, "");
      text = text.replace(/[^a-zA-Z0-9 \-'\.&\/]/g, "");
    }
    return text;
  }
};

export const filterBranch = (meta: Moss.Branch) => ({
  ...meta,
  nameSegment: filterBranchName(meta.nameSegment),
  projectSegment: filterBranchName(meta.projectSegment),
  organizationSegment: filterBranchName(meta.organizationSegment),
});

export const stringifyBranchLocator = (meta: Moss.Branch) =>
  encode(filterBranch(meta));

// export const hydrateBl = (s) => decode(s, 'hydrate');
export const hydrateBranchLocator = (s) => decode(s, "hydrate");

export const getCanonicalOrgName = (org, segment) => {
  return (
    (org.s && org.s.bl && org.s.bl.o) || canonicalBl(org.organizationSegment)
  );
};
