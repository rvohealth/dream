import { DreamConst, SerializableClassOrClasses } from '../../../dream/types';
export type SerializableAssociationType = 'RendersOne' | 'RendersMany';
export interface DreamSerializerAssociationStatement {
    field: string;
    flatten: boolean;
    optional: boolean;
    dreamOrSerializerClass: SerializableClassOrClasses | null;
    source: string | typeof DreamConst.passthrough;
    through: string | null;
    type: SerializableAssociationType;
    path: string | null;
    exportedAs: string | null;
    nullable: boolean;
    serializerKey?: string;
}
export interface RendersOneOrManyOpts {
    optional?: boolean;
    source?: string | typeof DreamConst.passthrough;
    through?: string;
    path?: string;
    exportedAs?: string;
    serializerKey?: string;
}
export declare function isSerializable(dreamOrSerializerClass: any): boolean;
