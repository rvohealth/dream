import { PrimaryKeyType } from '../../dream/types';
export default function foreignKeyTypeFromPrimaryKey(primaryKey: PrimaryKeyType): "bigint" | "integer" | "uuid";
