import parseAttribute from './parseAttribute.js'

export default function validateStiChildColumns(columnsWithTypes: string[]) {
  const belongsToColumns = columnsWithTypes.filter(
    columnWithType => parseAttribute(columnWithType)?.normalizedAttributeType === 'belongsto'
  )

  if (belongsToColumns.length) {
    throw new Error(
      `STI children cannot declare belongs_to associations. Declare associations on the STI parent instead. Unsupported columns: ${belongsToColumns.join(', ')}`
    )
  }
}
