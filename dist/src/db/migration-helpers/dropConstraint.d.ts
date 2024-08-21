import { Kysely } from 'kysely';
export default function dropConstraint(constraintName: string, tableName: string, db: Kysely<any>): Promise<void>;
