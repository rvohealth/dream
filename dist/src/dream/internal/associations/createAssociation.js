"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cannot_create_association_with_through_context_1 = __importDefault(require("../../../exceptions/associations/cannot-create-association-with-through-context"));
async function createAssociation(dream, txn = null, associationName, opts = {}) {
    const association = dream['associationMetadataMap']()[associationName];
    if (Array.isArray(association.modelCB())) {
        throw new Error(`
        Cannot create polymorphic associations using createAssociation
      `);
    }
    const associationClass = association.modelCB();
    let hasresult;
    let belongstoresult;
    let belongstoFn;
    const hasAssociation = association;
    let modifiedOpts;
    switch (association.type) {
        case 'HasMany':
        case 'HasOne':
            if (hasAssociation.through)
                throw new cannot_create_association_with_through_context_1.default({
                    dreamClass: dream.constructor,
                    association,
                });
            modifiedOpts = {
                [association.foreignKey()]: association.primaryKeyValue(dream),
                ...opts,
            };
            if (hasAssociation.polymorphic) {
                modifiedOpts[hasAssociation.foreignKeyTypeField()] = dream.constructor.name;
            }
            if (txn) {
                hasresult = await associationClass.txn(txn).create(modifiedOpts);
            }
            else {
                hasresult = await associationClass.create(modifiedOpts);
            }
            return hasresult;
        case 'BelongsTo':
            belongstoFn = async (txn) => {
                belongstoresult = await associationClass.txn(txn).create({
                    ...opts,
                });
                await dream.txn(txn).update({
                    [association.foreignKey()]: association.primaryKeyValue(belongstoresult),
                });
            };
            if (txn)
                await belongstoFn(txn);
            else
                await dream.constructor.transaction(belongstoFn);
            return belongstoresult;
    }
}
exports.default = createAssociation;
