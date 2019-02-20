/// <reference path="../interfaces/moss.d.ts" />

var errorReporter: Moss.ErrorReporter;
export function getErrorReporter() {
    return errorReporter;
}

export function setErrorReporter(reporter: Moss.ErrorReporter) {
    errorReporter = reporter;
}

export function MossError(error: Moss.Error) {
    const { message, branch, stack, errorPaths } = error;
    this.name = "MossError";
    this.message = (message || "");
    this.stack = stack;
    this.branch = branch;
    this.errorPaths = errorPaths.map(e => ({ ...e, path: e.path.join('.') }))
}
MossError.prototype = Error.prototype;

export const handleError = (e: MossError, layer: Moss.ReturnValue, input?: Moss.BranchData) => {
    let error: MossError;
    if (e.name && (e.name == 'MossError')) {
        error = e;
    } else {
        let at: any;
        layer.state.errorPaths.forEach(p => { if (!p.rhs) at = p.path });
        error = {
            ...e,
            name: 'MossError',
            message: `${e.message || 'unexpected error'}`,
            errorPaths: layer.state.errorPaths,
            at: at.join('.')
        };
    }
    try {
        const nestedError = JSON.parse(error.message);
        if (nestedError.name && (nestedError.name == 'MossError')) {
            error = nestedError;
        }
    } catch { }
    if (getErrorReporter()) {
        throw (getErrorReporter()(error));
    } else {
        throw {
            name: 'MossError',
            message: JSON.stringify(error, null, 2),
            data: error
        }
    }
}