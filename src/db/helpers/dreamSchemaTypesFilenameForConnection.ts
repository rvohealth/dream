export default function dreamSchemaTypesFilenameForConnection(connectionName: string) {
  return connectionName === 'default' ? 'dream.ts' : `dream.${connectionName}.ts`
}
