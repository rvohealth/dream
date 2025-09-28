export default function maybeNamespacedColumnNameToColumnName<T extends string>(column: T): T {
  return column.split('.').at(-1)! as T
}
