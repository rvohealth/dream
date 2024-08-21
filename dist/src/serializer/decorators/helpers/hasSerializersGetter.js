"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(dreamOrSerializerClass) {
    try {
        return !!dreamOrSerializerClass?.prototype?.serializers;
    }
    catch {
        return false;
    }
}
exports.default = default_1;
