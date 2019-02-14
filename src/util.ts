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