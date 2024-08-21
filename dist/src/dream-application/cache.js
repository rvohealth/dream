"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedDreamApplicationOrFail = exports.cacheDreamApplication = void 0;
let _dreamApp = undefined;
function cacheDreamApplication(dreamconf) {
    _dreamApp = dreamconf;
}
exports.cacheDreamApplication = cacheDreamApplication;
function getCachedDreamApplicationOrFail() {
    if (!_dreamApp)
        throw new Error('must call `cacheDreamconf` before loading cached dreamconf');
    return _dreamApp;
}
exports.getCachedDreamApplicationOrFail = getCachedDreamApplicationOrFail;
