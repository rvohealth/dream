import Dream from '../../../dream';
import { DreamClassColumnNames } from '../../../dream/types';
import { OpenapiSchemaBody } from '../../../openapi/types';
export declare function dreamAttributeOpenapiShape<DreamClass extends typeof Dream>(dreamClass: DreamClass, column: DreamClassColumnNames<DreamClass>): OpenapiSchemaBody;
export declare class UseCustomOpenapiForJson extends Error {
    get message(): string;
}
