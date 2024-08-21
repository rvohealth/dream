"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pluralize_1 = require("pluralize");
const cannot_associate_through_polymorphic_1 = __importDefault(require("../../../exceptions/associations/cannot-associate-through-polymorphic"));
const missing_through_association_1 = __importDefault(require("../../../exceptions/associations/missing-through-association"));
const missing_through_association_source_1 = __importDefault(require("../../../exceptions/associations/missing-through-association-source"));
const compact_1 = __importDefault(require("../../../helpers/compact"));
const debug_1 = __importDefault(require("../../../helpers/debug"));
class LoadIntoModels {
    constructor(preloadStatements, passthroughWhereStatement) {
        this.passthroughWhereStatement = null;
        this.preloadStatements = preloadStatements;
        this.passthroughWhereStatement = passthroughWhereStatement;
    }
    async loadInto(models) {
        await this.applyPreload(this.preloadStatements, models);
    }
    async applyPreload(preloadStatement, dream) {
        for (const key of Object.keys(preloadStatement)) {
            const nestedDream = await this.applyOnePreload(key, dream);
            if (nestedDream) {
                await this.applyPreload(preloadStatement[key], nestedDream);
            }
        }
    }
    async applyOnePreload(currentAssociationTableOrAlias, dreams) {
        if (!Array.isArray(dreams))
            dreams = [dreams];
        const dream = dreams.find(dream => dream['associationMetadataMap']()[currentAssociationTableOrAlias]);
        if (!dream)
            return;
        let association = dream['associationMetadataMap']()[currentAssociationTableOrAlias];
        let associationQuery; // typeof Dream | Query<any>
        const originalAssociation = association;
        const results = await this.preloadBridgeThroughAssociations(dream.constructor, dreams, association);
        dreams = results.dreams;
        if (dreams.length === 0)
            return;
        association = results.association;
        if (association.type === 'BelongsTo') {
            if (association.polymorphic) {
                // Rating polymorphically BelongsTo Composition and Post
                // for each of Composition and Post
                for (const associatedModel of association.modelCB()) {
                    const relevantAssociatedModels = dreams.filter((dream) => {
                        return dream[association.foreignKeyTypeField()] === associatedModel['stiBaseClassOrOwnClass'].name;
                    });
                    if (relevantAssociatedModels.length) {
                        // associationQuery = this.dreamTransaction
                        //   ? associatedModel.txn(this.dreamTransaction)
                        //   : associatedModel
                        associationQuery = associatedModel;
                        if (this.passthroughWhereStatement)
                            associationQuery = associationQuery.passthrough(this.passthroughWhereStatement);
                        associationQuery = associationQuery.where({
                            [association.primaryKey()]: relevantAssociatedModels.map(dream => dream[association.foreignKey()]),
                        });
                        this.hydrateAssociation(dreams, association, await associationQuery.all());
                    }
                }
            }
            else {
                const associatedModel = association.modelCB();
                // associationQuery = this.dreamTransaction
                //   ? associatedModel.txn(this.dreamTransaction)
                //   : associatedModel
                associationQuery = associatedModel;
                if (this.passthroughWhereStatement)
                    associationQuery = associationQuery.passthrough(this.passthroughWhereStatement);
                associationQuery = associationQuery.where({
                    [association.primaryKey()]: dreams.map(dream => dream[association.foreignKey()]),
                });
                associationQuery = this.bridgeOriginalPreloadAssociation(originalAssociation, associationQuery);
                this.hydrateAssociation(dreams, association, await associationQuery.all());
            }
        }
        else {
            const associatedModel = association.modelCB();
            // associationQuery = this.dreamTransaction ? associatedModel.txn(this.dreamTransaction) : associatedModel
            associationQuery = associatedModel;
            if (this.passthroughWhereStatement)
                associationQuery = associationQuery.passthrough(this.passthroughWhereStatement);
            associationQuery = associationQuery.where({
                [association.foreignKey()]: dreams.map(dream => association.primaryKeyValue(dream)),
            });
            // REMOVING THIS BECAUSE WE NEED TO MATCH DIFFERENT POLYMORPHIC MODELS. CHECK TYPES DURING ASSOCIATION, NOT QUERY
            // if (association.polymorphic) {
            //   associationQuery = associationQuery.where({
            //     [association.foreignKeyTypeField()]: dream['stiBaseClassOrOwnClass'].name as any,
            //   })
            // }
            // end: REMOVING THIS BECAUSE WE NEED TO MATCH DIFFERENT POLYMORPHIC MODELS. CHECK TYPES DURING ASSOCIATION, NOT QUERY
            if (association.where) {
                (0, debug_1.default)(`
applying where clause for association:
${JSON.stringify(association, null, 2)}
        `);
            }
            if (association.where)
                associationQuery = associationQuery.where(association.where);
            if (association.whereNot) {
                (0, debug_1.default)(`
applying whereNot clause for association:
${JSON.stringify(association, null, 2)}
        `);
            }
            if (association.whereNot)
                associationQuery = associationQuery.whereNot(association.whereNot);
            if (association.distinct) {
                (0, debug_1.default)(`
applying distinct clause for association:
${JSON.stringify(association, null, 2)}
        `);
            }
            if (association.distinct) {
                associationQuery = associationQuery.distinct(association.distinct);
            }
            associationQuery = this.bridgeOriginalPreloadAssociation(originalAssociation, associationQuery);
            this.hydrateAssociation(dreams, association, await associationQuery.all());
        }
        return (0, compact_1.default)(dreams.flatMap(dream => dream[association.as]));
    }
    bridgeOriginalPreloadAssociation(originalAssociation, associationQuery) {
        if (originalAssociation?.through) {
            const assoc = originalAssociation;
            if (assoc.where) {
                associationQuery = associationQuery.where(assoc.where);
            }
            if (assoc.whereNot) {
                associationQuery = associationQuery.whereNot(assoc.whereNot);
            }
        }
        return associationQuery;
    }
    async preloadBridgeThroughAssociations(dreamClass, dreams, association) {
        if (association.type === 'BelongsTo' || !association.through) {
            return { dreams: (0, compact_1.default)(dreams), association };
        }
        else {
            // Post has many Commenters through Comments
            // hydrate Post Comments
            await this.applyOnePreload(association.through, dreams);
            // return:
            //  Comments,
            //  the Comments -> CommentAuthors hasMany association
            // So that Comments may be properly hydrated with many CommentAuthors
            const newDreams = dreams.flatMap(dream => dream[association.through]);
            const newAssociation = this.followThroughAssociation(dreamClass, association);
            return await this.preloadBridgeThroughAssociations(dreamClass, newDreams, newAssociation);
        }
    }
    followThroughAssociation(dreamClass, association) {
        const throughAssociation = association.through && dreamClass['associationMetadataMap']()[association.through];
        if (!throughAssociation)
            throw new missing_through_association_1.default({
                dreamClass,
                association,
            });
        const throughClass = throughAssociation.modelCB();
        if (Array.isArray(throughClass))
            throw new cannot_associate_through_polymorphic_1.default({
                dreamClass,
                association,
            });
        const newAssociation = getSourceAssociation(throughClass, association.source);
        if (!newAssociation)
            throw new missing_through_association_source_1.default({
                dreamClass,
                throughClass,
                association,
            });
        return newAssociation;
    }
    hydrateAssociation(dreams, association, loadedAssociations) {
        switch (association.type) {
            case 'HasMany':
                dreams.forEach((dream) => {
                    if (dream.loaded(association.as))
                        return; // only overwrite if this hasn't yet been preloaded
                    dream[association.as] = [];
                });
                break;
            default:
                dreams.forEach((dream) => {
                    if (dream.loaded(association.as))
                        return; // only overwrite if this hasn't yet been preloaded
                    dream[`__${association.as}__`] = null;
                });
        }
        // dreams is a Rating
        // Rating belongs to: rateables (Posts / Compositions)
        // loadedAssociations is an array of Posts and Compositions
        // if rating.rateable_id === loadedAssociation.primaryKeyvalue
        //  rating.rateable = loadedAssociation
        for (const loadedAssociation of loadedAssociations) {
            if (association.type === 'BelongsTo') {
                dreams
                    .filter((dream) => {
                    if (association.polymorphic) {
                        return (dream[association.foreignKeyTypeField()] ===
                            loadedAssociation['stiBaseClassOrOwnClass'].name &&
                            dream[association.foreignKey()] === association.primaryKeyValue(loadedAssociation));
                    }
                    else {
                        return dream[association.foreignKey()] === association.primaryKeyValue(loadedAssociation);
                    }
                })
                    .forEach((dream) => {
                    if (dream[association.as])
                        return; // only overwrite if this hasn't yet been preloaded
                    dream[association.as] = loadedAssociation;
                });
            }
            else {
                dreams
                    .filter(dream => {
                    if (association.polymorphic) {
                        return (loadedAssociation[association.foreignKeyTypeField()] ===
                            dream['stiBaseClassOrOwnClass'].name &&
                            loadedAssociation[association.foreignKey()] === association.primaryKeyValue(dream));
                    }
                    else {
                        return (loadedAssociation[association.foreignKey()] === association.primaryKeyValue(dream));
                    }
                })
                    .forEach((dream) => {
                    if (association.type === 'HasMany') {
                        if (Object.isFrozen(dream[association.as]))
                            return; // only overwrite if this hasn't yet been preloaded
                        dream[association.as].push(loadedAssociation);
                    }
                    else {
                        if (dream[association.as])
                            return; // only overwrite if this hasn't yet been preloaded
                        dream[association.as] = loadedAssociation;
                    }
                });
            }
        }
        if (association.type === 'HasMany') {
            dreams.forEach((dream) => {
                if (dream[association.as])
                    Object.freeze(dream[association.as]);
            });
        }
    }
}
exports.default = LoadIntoModels;
function getSourceAssociation(dream, sourceName) {
    if (!dream)
        return;
    if (!sourceName)
        return;
    return (dream['associationMetadataMap']()[sourceName] ||
        dream['associationMetadataMap']()[(0, pluralize_1.singular)(sourceName)]);
}
