/// <reference path="../interfaces/moss.d.ts" />

var errorReporter: Moss.ErrorReporter;
export function getErrorReporter() {
    return errorReporter;
}

export function setErrorReporter(reporter: Moss.ErrorReporter) {
    errorReporter = reporter;
}

export function MossError(error: Moss.Error) {
    const { message, source, stack, errorPaths } = error;
    this.name = "MossError";
    this.message = (message || "");
    this.stack = stack;
    this.source = source;
    this.errorPaths = errorPaths;
}
MossError.prototype = Error.prototype;

const formatPaths = (paths: Moss.ErrorPath[]) => {
    const res = [];
    for (const e of paths) {
        if (e.rhs) {
            const start = e.path[0];
            const end = start + e.path[1];
            res[res.length - 1] += `.${start}-${end}`
        } else {
            res.push(e.path.join('.'));
        }
    }
    return res;
}

export const handleError = (e: MossError, layer: Moss.ReturnValue, input?: Moss.BranchData) => {
    let error: MossError;
    const { errorPaths } = layer.state;
    const stack = formatPaths(errorPaths);
    const at = stack[stack.length - 1];
    error = {
        name: 'MossError',
        message: `${e.message || 'unexpected error'}`,
        errorPaths,
        at,
        stack,
        source: input,
        ...e
    };
    if (getErrorReporter()) {
        throw (getErrorReporter()(error));
    } else {
        throw {
            name: 'MossError',
            ...error
        }
    }
}