"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../dream/types");
const score_must_be_a_normal_number_1 = __importDefault(require("../exceptions/ops/score-must-be-a-normal-number"));
class OpsStatement {
    constructor(operator, value, extraArgs) {
        this.negated = false;
        if (typeof extraArgs?.score === 'number' &&
            (extraArgs.score < 0 || extraArgs.score > 1)) {
            throw new score_must_be_a_normal_number_1.default(extraArgs.score);
        }
        this.operator = operator;
        this.value = value;
        if (extraArgs) {
            this.extraArgs = extraArgs;
            this.negated = extraArgs?.negated || false;
        }
    }
    get isOpsStatement() {
        return true;
    }
    get shouldBypassWhereStatement() {
        return types_1.TRIGRAM_OPERATORS.includes(this.operator);
    }
    get minTrigramScore() {
        if (types_1.TRIGRAM_OPERATORS.includes(this.operator)) {
            return this.extraArgs?.score;
        }
        else {
            return null;
        }
    }
}
exports.default = OpsStatement;
