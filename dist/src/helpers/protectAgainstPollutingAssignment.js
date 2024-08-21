"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prototype_polluting_assignment_1 = __importDefault(require("../exceptions/prototype-polluting-assignment"));
function protectAgainstPollutingAssignment(key) {
    if (['_proto_', 'constructor', 'prototype'].includes(key))
        throw new prototype_polluting_assignment_1.default(key);
    return key;
}
exports.default = protectAgainstPollutingAssignment;
