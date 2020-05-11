import { join } from "path";

export const splitBranchLocator = (bl: string) => {
  const parts = bl.split(":");
  switch (parts.length) {
    case 3: {
      return {
        context: parts[0],
        path: parts[1],
        version: parts[2],
      };
    }
    case 2: {
      if (parts[0].indexOf("/") != -1) {
        // first part is locator path, context was omitted
        return {
          path: parts[0],
          version: parts[1],
        };
      } else if (parts[1].indexOf("/") != -1) {
        // second part is locator path, version was omitted
        return {
          context: parts[0],
          path: parts[1],
        };
      } else {
        throw new Error(`bad 2 part in branch locator: ${bl}`);
      }
    }
    case 1: {
      return {
        path: parts[0],
      };
    }
    default:
      throw new Error(`bad branch locator: ${bl}`);
  }
};

export const pathToSegments = (locatorPath: string) => {
  const parts = locatorPath.split("/");
  if (parts.length > 1) {
    return {
      projectSegment: parts.slice(0, parts.length - 1).join("/"),
      pathSegment: parts.slice(-1)[0],
    };
  }
  return { projectSegment: "", pathSegment: locatorPath }; // path is only a segment
};

export const decodeBranchLocator = (bl: string): Moss.Branch => {
  const { path: locatorPath, ...parts } = splitBranchLocator(bl);
  const [organizationSegment, ...branchParts] = locatorPath.split("/");
  const { projectSegment, pathSegment } = pathToSegments(branchParts.join("/"));
  return {
    ...parts,
    organizationSegment,
    projectSegment,
    pathSegment,
  };
};

export const encodeBranchLocator = (
  bl: Moss.Branch,
  options?: { includeContextFragment?: boolean; urlSafe?: boolean }
) => {
  if (!bl) throw new Error("falsy branch locator");
  const {
    context,
    projectSegment,
    organizationSegment,
    pathSegment,
    version,
  } = bl;
  const withProject = projectSegment
    ? join(projectSegment, pathSegment)
    : pathSegment;
  const withOrg = join(organizationSegment, withProject);
  let contextPart = "";
  const versionPart = version ? ":" + version : "";
  if (options && options.includeContextFragment !== false)
    contextPart = context + ":";
  return `${contextPart}${withOrg}${versionPart}`;
};

export const slugifyBranchLocator = (
  bl: Moss.Branch,
  options?: { includeContextFragment?: boolean; urlSafe?: boolean }
) => {
  if (!bl) throw new Error("falsy branch locator");
  const {
    context,
    projectSegment,
    organizationSegment,
    pathSegment,
    version,
  } = bl;
  const withProject = projectSegment
    ? `${projectSegment}-${pathSegment}`
    : pathSegment;
  const withOrg = `${organizationSegment}-${withProject}`;
  let contextPart = "";
  const versionPart = version ? ":" + version : "";
  if (options && options.includeContextFragment !== false)
    contextPart = context + ":";
  return `${contextPart}${withOrg}${versionPart}`;
};

export const safeBl = (
  bl: string | Moss.Branch,
  options?: { includeContextFragment?: boolean }
) => {
  if (typeof bl == "string") {
    const parts = decodeBranchLocator(bl);
    return slugifyBranchLocator(parts);
  } else {
    return slugifyBranchLocator(bl);
  }
};
