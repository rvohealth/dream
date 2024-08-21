"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const non_belongs_to_association_provided_as_sortable_decorator_scope_1 = __importDefault(require("../../../exceptions/non-belongs-to-association-provided-as-sortable-decorator-scope"));
const sortable_decorator_requires_column_or_belongs_to_association_1 = __importDefault(require("../../../exceptions/sortable-decorator-requires-column-or-belongs-to-association"));
function getColumnForSortableScope(dream, scope) {
    if (!scope)
        return null;
    const dreamClass = dream.constructor;
    if (dreamClass.columns().has(scope))
        return scope;
    const associationMetadata = dream['associationMetadataMap']()[scope];
    if (!associationMetadata)
        throw new sortable_decorator_requires_column_or_belongs_to_association_1.default(scope, dreamClass);
    if (associationMetadata.type !== 'BelongsTo')
        throw new non_belongs_to_association_provided_as_sortable_decorator_scope_1.default(scope, dreamClass);
    return associationMetadata.foreignKey();
}
exports.default = getColumnForSortableScope;
