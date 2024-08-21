import { BelongsToStatement } from '../../../decorators/associations/belongs-to';
import { HasManyStatement } from '../../../decorators/associations/has-many';
import { HasOneStatement } from '../../../decorators/associations/has-one';
import { PassthroughWhere } from '../../../decorators/associations/shared';
import Dream from '../../../dream';
import { PassthroughColumnNames, RelaxedPreloadStatement } from '../../types';
export default class LoadIntoModels<DreamInstance extends Dream, DB extends DreamInstance['DB'] = DreamInstance['DB'], Schema extends DreamInstance['schema'] = DreamInstance['schema'], PassthroughColumns extends PassthroughColumnNames<DreamInstance> = PassthroughColumnNames<DreamInstance>> {
    private readonly preloadStatements;
    private readonly passthroughWhereStatement;
    constructor(preloadStatements: RelaxedPreloadStatement, passthroughWhereStatement: PassthroughWhere<PassthroughColumns>);
    loadInto(models: Dream[]): Promise<void>;
    private applyPreload;
    private applyOnePreload;
    private bridgeOriginalPreloadAssociation;
    private preloadBridgeThroughAssociations;
    private followThroughAssociation;
    hydrateAssociation(dreams: Dream[], association: HasManyStatement<any, DB, Schema, any> | HasOneStatement<any, DB, Schema, any> | BelongsToStatement<any, DB, Schema, any>, loadedAssociations: Dream[]): void;
}
