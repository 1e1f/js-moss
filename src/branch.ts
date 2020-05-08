import { join } from "path";

export const splitBranchUri = (uri: string) => {
  const parts = uri.split(":");
  switch (parts.length) {
    case 3: {
      return {
        context: parts[0],
        fullPath: parts[1],
        version: parts[2],
      };
    }
    case 2: {
      if (parts[0].indexOf("/") != -1) {
        // first part is path, context was omitted
        return {
          path: parts[0],
          version: parts[1],
        };
      } else if (parts[1].indexOf("/") != -1) {
        // second part is path, version was omitted
        return {
          context: parts[0],
          fullPath: parts[1],
        };
      } else {
        throw new Error(`bad 2 part uri ${uri}`);
      }
    }
    case 1: {
      return {
        fullPath: parts[0],
      };
    }
    default:
      throw new Error(`bad uri ${uri}`);
  }
};

export const getBranchPathComponents = (path: string) => {
  const parts = path.split("/");
  if (parts.length > 1) {
    return {
      projectPath: parts.slice(0, parts.length - 1).join("/"),
      path: parts.slice(-1)[0],
    };
  }
  return { projectPath: "", path };
};

export const decodeBranchLocator = (bl: string): Moss.Branch => {
  const { fullPath, ...parts } = splitBranchUri(bl);
  const [orgPath, ...branchParts] = fullPath.split("/");
  const { projectPath, path } = getBranchPathComponents(branchParts.join("/"));
  return {
    ...parts,
    orgPath,
    projectPath,
    path,
  };
};

export const encodeBranchLocator = (
  bl: Moss.Branch,
  options?: { includeContextFragment?: boolean; urlSafe?: boolean }
) => {
  if (!bl) throw new Error("falsy branch locator");
  const { context, projectPath, orgPath, path, version } = bl;
  const withProject = projectPath ? join(projectPath, path) : path;
  const withOrg = join(orgPath, withProject);
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
  const { context, projectPath, orgPath, path, version } = bl;
  const withProject = projectPath ? `${projectPath}-${path}` : path;
  const withOrg = `${orgPath}-${withProject}`;
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
