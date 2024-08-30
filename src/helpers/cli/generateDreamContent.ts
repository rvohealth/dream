import pluralize from 'pluralize'
import camelize from '../camelize'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName'
import relativeDreamPath from '../path/relativeDreamPath'
import serializerNameFromFullyQualifiedModelName from '../serializerNameFromFullyQualifiedModelName'
import snakeify from '../snakeify'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName'
import uniq from '../uniq'

export default function generateDreamContent(
  fullyQualifiedModelName: string,
  attributes: string[],
  fullyQualifiedParentName?: string
) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  let parentModelClassName: string | undefined
  const dreamImports: string[] = ['DreamColumn', 'DreamSerializers']
  const isSTI = !!fullyQualifiedParentName

  if (isSTI) {
    fullyQualifiedParentName = standardizeFullyQualifiedModelName(fullyQualifiedParentName!)
    parentModelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedParentName)
    dreamImports.push('STI')
  }

  const idTypescriptType = `DreamColumn<${modelClassName}, 'id'>`
  const modelImportStatements: string[] = isSTI
    ? [importStatementForModel(fullyQualifiedModelName, fullyQualifiedParentName)]
    : [importStatementForModel(fullyQualifiedModelName, 'ApplicationModel')]

  const attributeStatements = attributes.map(attribute => {
    const [attributeName, attributeType, ...descriptors] = attribute.split(':')
    const fullyQualifiedAssociatedModelName = standardizeFullyQualifiedModelName(attributeName)
    const associationModelName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedAssociatedModelName)
    const associationImportStatement = importStatementForModel(
      fullyQualifiedModelName,
      fullyQualifiedAssociatedModelName
    )
    const associationName = camelize(associationModelName)

    if (!attributeType)
      throw new Error(`must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`)

    switch (attributeType) {
      case 'belongs_to':
        modelImportStatements.push(associationImportStatement)
        return `
@${modelClassName}.BelongsTo('${fullyQualifiedAssociatedModelName}'${descriptors.includes('optional') ? ', { optional: true }' : ''})
public ${associationName}: ${associationModelName}
public ${associationName}Id: DreamColumn<${modelClassName}, '${associationName}Id'>
`

      case 'has_one':
        modelImportStatements.push(associationImportStatement)
        return `
@${modelClassName}.HasOne('${fullyQualifiedAssociatedModelName}')
public ${associationName}: ${associationModelName}
`

      case 'has_many':
        modelImportStatements.push(associationImportStatement)
        return `
@${modelClassName}.HasMany('${fullyQualifiedAssociatedModelName}')
public ${pluralize(associationName)}: ${associationModelName}[]
`

      default:
        return `
public ${camelize(attributeName)}: ${getAttributeType(attribute, modelClassName)}\
`
    }
  })

  const formattedFields = attributeStatements
    .filter(attr => !/^\n@/.test(attr))
    .map(s => s.split('\n').join('\n  '))
    .join('')
  const formattedDecorators = attributeStatements
    .filter(attr => /^\n@/.test(attr))
    .map(s => s.split('\n').join('\n  '))
    .join('\n  ')
    .replace(/\n {2}$/, '')

  let timestamps = `
  public createdAt: DreamColumn<${modelClassName}, 'createdAt'>
  public updatedAt: DreamColumn<${modelClassName}, 'updatedAt'>
`
  if (!formattedDecorators.length) timestamps = timestamps.replace(/\n$/, '')

  const tableName = snakeify(pluralize(fullyQualifiedModelName.replace(/\//g, '_')))

  return `\
import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'${uniq(modelImportStatements).join('')}

${isSTI ? `\n@STI(${parentModelClassName})` : ''}
export default class ${modelClassName} extends ${isSTI ? parentModelClassName : 'ApplicationModel'} {
${
  isSTI
    ? ''
    : `  public get table() {
    return '${tableName}' as const
  }

`
}  public get serializers(): DreamSerializers<${modelClassName}> {
    return {
      default: '${serializerNameFromFullyQualifiedModelName(fullyQualifiedModelName)}',
      summary: '${serializerNameFromFullyQualifiedModelName(fullyQualifiedModelName, 'summary')}',
    }
  }

${
  isSTI ? formattedFields : `  public id: ${idTypescriptType}${formattedFields}${timestamps}`
}${formattedDecorators}
}
`.replace(/^\s*$/gm, '')
}

function getAttributeType(attribute: string, modelClassName: string) {
  return `DreamColumn<${modelClassName}, '${camelize(attribute.split(':')[0])}'>`
}

function importStatementForModel(originModelName: string, destinationModelName: string = originModelName) {
  return `\nimport ${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${relativeDreamPath('models', 'models', originModelName, destinationModelName)}'`
}
