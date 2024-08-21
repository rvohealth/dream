import { Kysely } from 'kysely';
export default function addDeferrableUniqueConstraint(constraintName: string, tableName: string, columns: string[], db: Kysely<any>): Promise<void>;
