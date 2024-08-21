"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSoftDeleteScopeToUserScopes = exports.DEFAULT_SKIP_HOOKS = exports.DEFAULT_DEFAULT_SCOPES_TO_BYPASS = exports.DEFAULT_CASCADE = exports.DEFAULT_BYPASS_ALL_DEFAULT_SCOPES = void 0;
const soft_delete_1 = require("../../decorators/soft-delete");
const uniq_1 = __importDefault(require("../../helpers/uniq"));
exports.DEFAULT_BYPASS_ALL_DEFAULT_SCOPES = false;
exports.DEFAULT_CASCADE = true;
exports.DEFAULT_DEFAULT_SCOPES_TO_BYPASS = [];
exports.DEFAULT_SKIP_HOOKS = false;
function addSoftDeleteScopeToUserScopes(userScopes = []) {
    return (0, uniq_1.default)([...userScopes, soft_delete_1.SOFT_DELETE_SCOPE_NAME]);
}
exports.addSoftDeleteScopeToUserScopes = addSoftDeleteScopeToUserScopes;
