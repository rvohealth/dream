export default function replaceNamespaceColumn(namespacedColumn: string, newColumn: string) {
  const parts = namespacedColumn.split('.')
  parts.pop()
  return parts.length === 0 ? newColumn : `${parts[0]}.${newColumn}`
}
