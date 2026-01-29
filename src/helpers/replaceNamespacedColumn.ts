export default function replaceNamespaceColumn(namespacedColumn: string, newColumn: string) {
  const parts = namespacedColumn.split('.')
  return parts.length > 1 ? `${parts[0]}.${newColumn}` : newColumn
}
