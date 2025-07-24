export default function dbFilenameForConnection(connectionName: string) {
  return connectionName === 'default' ? 'db.ts' : `db.${connectionName}.ts`
}
