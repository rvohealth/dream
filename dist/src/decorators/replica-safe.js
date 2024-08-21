"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ReplicaSafe() {
    return function (target) {
        const t = target;
        t['replicaSafe'] = true;
    };
}
exports.default = ReplicaSafe;
