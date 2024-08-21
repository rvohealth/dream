export default function validateTable<Schema, TableName extends keyof Schema & string>(schema: Schema, tableName: TableName): TableName;
