"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blankHooksFactory = void 0;
function blankHooksFactory(dreamClass) {
    return {
        beforeCreate: [...(dreamClass['hooks']?.beforeCreate || [])],
        beforeUpdate: [...(dreamClass['hooks']?.beforeUpdate || [])],
        beforeSave: [...(dreamClass['hooks']?.beforeSave || [])],
        beforeDestroy: [...(dreamClass['hooks']?.beforeDestroy || [])],
        afterCreate: [...(dreamClass['hooks']?.afterCreate || [])],
        afterCreateCommit: [...(dreamClass['hooks']?.afterCreateCommit || [])],
        afterUpdate: [...(dreamClass['hooks']?.afterUpdate || [])],
        afterUpdateCommit: [...(dreamClass['hooks']?.afterUpdateCommit || [])],
        afterSave: [...(dreamClass['hooks']?.afterSave || [])],
        afterSaveCommit: [...(dreamClass['hooks']?.afterSaveCommit || [])],
        afterDestroy: [...(dreamClass['hooks']?.afterDestroy || [])],
        afterDestroyCommit: [...(dreamClass['hooks']?.afterDestroyCommit || [])],
    };
}
exports.blankHooksFactory = blankHooksFactory;
