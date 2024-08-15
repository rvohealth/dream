import pluralize from 'pluralize'
import camelize from '../camelize'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName'
import relativeDreamPath from '../path/relativeDreamPath'
import serializerNameFromFullyQualifiedModelName from '../serializerNameFromFullyQualifiedModelName'
import snakeify from '../snakeify'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName'
import uniq from '../uniq'

export default function generateDreamContent(fullyQualifiedModelName: string, attributes: string[]) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const dreamImports: string[] = ['DreamColumn', 'DreamSerializers']
  const idTypescriptType = `DreamColumn<${modelClassName}, 'id'>`
  const additionalImports: string[] = []

  const attributeStatements = attributes.map(attribute => {
    const [attributeName, attributeType] = attribute.split(':')
    const fullyQualifiedAssociatedModelName = standardizeFullyQualifiedModelName(attributeName)
    const associationModelName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedAssociatedModelName)
    const associationImportStatement = `import ${associationModelName} from '${relativeDreamPath('models', 'models', fullyQualifiedModelName, fullyQualifiedAssociatedModelName)}'`
    const associationName = camelize(associationModelName)

    if (!attributeType)
      throw new Error(`must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`)

    switch (attributeType) {
      case 'belongs_to':
        dreamImports.push('BelongsTo')
        additionalImports.push(associationImportStatement)
        return `
@BelongsTo('${fullyQualifiedAssociatedModelName}')
public ${associationName}: ${associationModelName}
public ${associationName}Id: DreamColumn<${modelClassName}, '${associationName}Id'>
`

      case 'has_one':
        dreamImports.push('HasOne')
        additionalImports.push(associationImportStatement)
        return `
@HasOne('${fullyQualifiedAssociatedModelName}')
public ${associationName}: ${associationModelName}
`

      case 'has_many':
        dreamImports.push('HasMany')
        additionalImports.push(associationImportStatement)
        return `
@HasMany('${fullyQualifiedAssociatedModelName}')
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
import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'
import ApplicationModel from '${relativeDreamPath('models', 'models', fullyQualifiedModelName, 'ApplicationModel')}'${
    additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }

export default class ${modelClassName} extends ApplicationModel {
  public get table() {
    return '${tableName}' as const
  }

  public get serializers(): DreamSerializers<${modelClassName}> {
    return {
      default: '${serializerNameFromFullyQualifiedModelName(fullyQualifiedModelName)}',
      summary: '${serializerNameFromFullyQualifiedModelName(fullyQualifiedModelName, 'summary')}',
    }
  }

  public id: ${idTypescriptType}${formattedFields}${timestamps}${formattedDecorators}
}
`.replace(/^\s*$/gm, '')
}

function getAttributeType(attribute: string, modelClassName: string) {
  return `DreamColumn<${modelClassName}, '${camelize(attribute.split(':')[0])}'>`
}
