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
    this.errorPaths = errorPaths.map(e => ({ ...e, path: e.path.join('.') }))
}
MossError.prototype = Error.prototype;

export const handleError = (e: MossError, layer: Moss.ReturnValue, input?: Moss.BranchData) => {
    let error: MossError;
    let at: any;
    layer.state.errorPaths.forEach(p => { if (!p.rhs) at = p.path });
    error = {
        name: 'MossError',
        message: `${e.message || 'unexpected error'}`,
        errorPaths: layer.state.errorPaths,
        at: at.join('.'),
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