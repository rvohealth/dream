export default function namespaceColumn(column: string, alias: string) {
  if (column.includes('.')) return column
  return `${alias}.${column}`
}
