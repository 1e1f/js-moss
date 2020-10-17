import { Moss } from "../../types";

export const encode = (
  branch: Moss.Branch,
  options?: { includeNamespaceSegment?: boolean; urlSafe?: boolean, stripVersion?: boolean }
) => {
  if (!branch) throw new Error("falsy branch locator");
  const {
    contextSegment,
    nameSegment,
    projectSegment,
    projectSegments,
    organizationSegment,
    organizationSegments,
    versionSegment,
    versionSegments,
  } = branch;
  const { includeNamespaceSegment, stripVersion, urlSafe } = options || ({} as any);
  let bl = '';
  if (includeNamespaceSegment) {
    if (contextSegment) {
      bl = contextSegment + '::' + (nameSegment || '');
    } else {
      bl = nameSegment || '';
    }
  } else {
    bl = nameSegment || '';
  }
  if (organizationSegments && organizationSegments.length) {
    bl = bl + '@' + organizationSegments.join('@');
  } else if (organizationSegment) {
    bl = bl + '@' + organizationSegment;
  }
  if (projectSegments && projectSegments.length) {
    bl = bl + '~' + projectSegments.join('~');
  } else if (projectSegment) {
    bl = bl + '~' + projectSegment;
  }
  if (!stripVersion) {
    if (versionSegments && versionSegments.length) {
      bl = bl + ':' + versionSegments.join(':');
    } else if (versionSegment) {
      bl = bl + ':' + versionSegment;
    }
  }
  if (urlSafe) return slugifyBranchLocator(bl);
  return bl;
};

export const slugifyBranchLocator = (
  bl: string
) => {
  return bl
    .replace(/::/g, '_n_')
    .replace(/~/g, '_p_')
    .replace(/@/g, '_o_')
    .replace(/:/g, '_v_')
    .replace(/\//g, '_s_');
};
