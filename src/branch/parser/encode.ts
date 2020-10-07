import { Moss } from "../../types";

export const encode = (
  branch: Moss.Branch,
  options?: { includeNamespaceSegment?: boolean; printWildcards?: boolean, urlSafe?: boolean, stripVersion?: boolean }
) => {
  if (!branch) throw new Error("falsy branch locator");
  const {
    namespaceSegment,
    pathSegment,
    projectSegment,
    projectSegments,
    organizationSegment,
    organizationSegments,
    versionSegment,
    versionSegments,
  } = branch;
  if (!pathSegment && organizationSegment) {
    throw new Error("must have at least a path and organization segment");
  }
  const { includeNamespaceSegment, stripVersion, urlSafe, printWildcards } = options || ({} as any);
  let bl = '';
  if (includeNamespaceSegment) {
    if (printWildcards) {
      bl = namespaceSegment || '-::' + (pathSegment || '-')
    } else if (namespaceSegment) {
      bl = namespaceSegment + '::' + (pathSegment || '');
    } else {
      bl = pathSegment || '';
    }
  } else {
    bl = pathSegment || (printWildcards ? '-' : '');
  }
  if (projectSegments && projectSegments.length) {
    bl = bl + '|' + projectSegments.join('|');
  } else if (projectSegment) {
    bl = bl + '|' + projectSegment;
  } else if (printWildcards) {
    bl = bl + "|-"
  }
  if (organizationSegments && organizationSegments.length) {
    bl = bl + '@' + organizationSegments.join('@');
  } else if (organizationSegment) {
    bl = bl + '@' + organizationSegment;
  } else if (printWildcards) {
    bl = bl + "@-"
  }
  if (!stripVersion) {
    if (versionSegments && versionSegments.length) {
      bl = bl + ':' + versionSegments.join(':');
    } else if (versionSegment) {
      bl = bl + ':' + versionSegment;
    } else if (printWildcards) {
      bl = bl + ":-"
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
    .replace(/\|/g, '_p_')
    .replace(/@/g, '_o_')
    .replace(/:/g, '_v_')
    .replace(/\//g, '_s_');
};
