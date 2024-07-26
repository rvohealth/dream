"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientTypes = exports.primaryKeyTypes = void 0;
const argAndValue_1 = __importDefault(require("./argAndValue"));
const select_1 = __importDefault(require("./select"));
exports.primaryKeyTypes = ['bigserial', 'bigint', 'integer', 'uuid'];
exports.clientTypes = ['react', 'vue', 'nuxt', 'none (api only)', 'none'];
async function primaryKeyTypeQuestion(args, options) {
    const [primaryKeyArg, value] = (0, argAndValue_1.default)('--primaryKey', args);
    if (primaryKeyArg && exports.primaryKeyTypes.includes(value)) {
        options.primaryKeyType = value;
        return;
    }
    const answer = await new select_1.default('what primary key type would you like to use?', exports.primaryKeyTypes).run();
    options.primaryKeyType = answer;
}
async function gatherUserInput(args) {
    const options = {
        primaryKeyType: 'bigserial',
    };
    await primaryKeyTypeQuestion(args, options);
    return options;
}
exports.default = gatherUserInput;
