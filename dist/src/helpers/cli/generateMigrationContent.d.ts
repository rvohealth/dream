import { PrimaryKeyType } from '../../dream/types';
export default function generateMigrationContent({ table, attributes, primaryKeyType, createOrAlter, }?: {
    table?: string;
    attributes?: string[];
    primaryKeyType?: PrimaryKeyType;
    createOrAlter?: 'create' | 'alter';
}): string;
