export default function dbTypesFilenameForConnection(connectionName: string) {
  return connectionName === 'default' ? 'db.ts' : `db.${connectionName}.ts`
}
