import { Moss } from "../types";
import { decode, encode } from "./parser";

export const canonicalBl = (bl: string | Moss.Branch) => {
  try {
    if (typeof bl == "string") {
      return encode(decode(bl));
    }
    return encode(canonicalBranchLocator(bl));
  } catch (e) {
    console.error(`canonicalBl bl failed for ${typeof bl}: ${bl}`);
  }
};

export const disambiguatedHash = (org: string) => {
  return decode(org, "organizationSegment");
};

export const nameHash = (org: string) => {
  return decode(org, "nameSegment");
};

export const canonicalBranchLocator = (branch: Moss.Branch) => {
  const encoded = encode(branch);
  return decode(encoded);
}


export const filterBranchName = (text) => {
  if (!text) return text;
  if (text.length > 0) {
    return text.replace(/[^a-zA-Z0-9 _\-'\.\+&/]/g, "");
  }
  return text;
};

// export const filterBranchName = (text) => {
//   if (!text) return text;
//   if (text.length) {
//     if (text.length > 1) {
//       text = text.trim();
//     }
//     if (text.length > 0) {
//       const seRegex = /[^a-zA-Z0-9]/g;
//       const firstChar = text[0].replace(seRegex, '');
//       if (text.length > 1) {
//         const lastChar = text[text.length - 1].replace(seRegex, '');
//         if (text.length > 2) {
//           const middle = text.slice(1, 0).slice(0, -1).replace().replace(/[^a-zA-Z0-9 \-'\.&\/]/g, "");
//           return [firstChar, middle, lastChar].join('')
//         }
//         return [firstChar, lastChar].join('')
//       }
//       return firstChar;
//     }
//     return '';
//   }
// };

export const filterBranch = (meta: Moss.Branch) => ({
  ...meta,
  nameSegment: filterBranchName(meta.nameSegment),
  projectSegment: filterBranchName(meta.projectSegment),
  organizationSegment: filterBranchName(meta.organizationSegment),
});

export const stringifyBranchLocator = (meta: Moss.Branch) =>
  encode(filterBranch(meta));

// export const hydrateBl = (s) => decode(s, 'hydrate');
export const hydrateBranchLocator = (s) => decode(s, "hydrate") || ({} as Moss.Branch);

export const getCanonicalOrgName = (org, segment) => {
  return (
    (org.s && org.s.bl && org.s.bl.o) || canonicalBl(org.organizationSegment)
  );
};
