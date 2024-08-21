import { PrimaryKeyType } from '../../dream/types';
export default function generateStiMigrationContent({ table, attributes, primaryKeyType, }?: {
    table?: string;
    attributes?: string[];
    primaryKeyType?: PrimaryKeyType;
}): string;
