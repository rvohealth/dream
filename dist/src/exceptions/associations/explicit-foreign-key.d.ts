import { PartialAssociationStatement } from '../../decorators/associations/shared';
import Dream from '../../dream';
export declare class InvalidComputedForeignKey extends Error {
    dreamClass: typeof Dream;
    partialAssociation: PartialAssociationStatement;
    computedForeignKey: string;
    table: string;
    constructor(dreamClass: typeof Dream, partialAssociation: PartialAssociationStatement, computedForeignKey: string, table: string);
    get message(): string;
}
export declare class ExplicitForeignKeyRequired extends Error {
    dreamClass: typeof Dream;
    partialAssociation: PartialAssociationStatement;
    explicitForeignKey: string;
    table: string;
    constructor(dreamClass: typeof Dream, partialAssociation: PartialAssociationStatement, explicitForeignKey: string, table: string);
    get message(): string;
}
export declare function checkForeignKey(explicitForeignKey: string | undefined, computedForeignKey: string, dreamClass: typeof Dream, partialAssociation: PartialAssociationStatement): void;
