import pluralize from 'pluralize-esm'
import serializerGlobalNameFromFullyQualifiedModelName from '../../serializer/helpers/serializerGlobalNameFromFullyQualifiedModelName.js'
import camelize from '../camelize.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import pascalize from '../pascalize.js'
import relativeDreamPath from '../path/relativeDreamPath.js'
import snakeify from '../snakeify.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import uniq from '../uniq.js'

export default function generateDreamContent({
  fullyQualifiedModelName,
  columnsWithTypes,
  fullyQualifiedParentName,
  serializer,
  includeAdminSerializers,
  connectionName = 'default',
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  fullyQualifiedParentName?: string | undefined
  connectionName?: string
  serializer: boolean
  includeAdminSerializers: boolean
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  let parentModelClassName: string | undefined
  const dreamImports: string[] = ['Decorators', 'DreamColumn']
  if (serializer) dreamImports.push('DreamSerializers')
  const isSTI = !!fullyQualifiedParentName

  if (isSTI) {
    fullyQualifiedParentName = standardizeFullyQualifiedModelName(fullyQualifiedParentName!)
    parentModelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedParentName)
    dreamImports.push('STI')
  }

  const idTypescriptType = `DreamColumn<${modelClassName}, 'id'>`
  const applicationModelName =
    connectionName === 'default' ? 'ApplicationModel' : `${pascalize(connectionName)}ApplicationModel`
  const modelImportStatements: string[] = isSTI
    ? [importStatementForModel(fullyQualifiedModelName, fullyQualifiedParentName)]
    : [importStatementForModel(fullyQualifiedModelName, applicationModelName)]

  const attributeStatements = columnsWithTypes.map(attribute => {
    const [attributeName, attributeType, ...descriptors] = attribute.split(':')
    if (attributeName === undefined) return ''
    const fullyQualifiedAssociatedModelName = standardizeFullyQualifiedModelName(attributeName)
    const associationModelName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedAssociatedModelName)
    const associationImportStatement = importStatementForModel(
      fullyQualifiedModelName,
      fullyQualifiedAssociatedModelName
    )

    if (!attributeType)
      throw new Error(`must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`)

    switch (attributeType) {
      case 'belongs_to': {
        modelImportStatements.push(associationImportStatement)
        const associationName = camelize(fullyQualifiedAssociatedModelName.split('/').pop()!)
        const associationForeignKey = `${associationName}Id`
        return `
@deco.BelongsTo('${fullyQualifiedAssociatedModelName}', { on: '${associationForeignKey}'${descriptors.includes('optional') ? ', optional: true' : ''} })
public ${associationName}: ${associationModelName}${descriptors.includes('optional') ? ' | null' : ''}
public ${associationForeignKey}: DreamColumn<${modelClassName}, '${associationName}Id'>
`
      }

      case 'has_one':
      case 'has_many':
        return ''

      case 'encrypted':
        dreamImports.push('Encrypted')
        return `
@Encrypted()
public ${camelize(attributeName)}: ${getAttributeType(attribute, modelClassName)}\
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
import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'${uniq(modelImportStatements).join('')}

const deco = new Decorators<typeof ${modelClassName}>()

${isSTI ? `\n@STI(${parentModelClassName})` : ''}
export default class ${modelClassName} extends ${isSTI ? parentModelClassName : applicationModelName} {
${
  isSTI
    ? ''
    : `  public override get table() {
    return '${tableName}' as const
  }

`
}${
    serializer
      ? `  public ${isSTI ? 'override ' : ''}get serializers(): DreamSerializers<${modelClassName}> {
    return {
      default: '${serializerGlobalNameFromFullyQualifiedModelName(fullyQualifiedModelName)}',
      summary: '${serializerGlobalNameFromFullyQualifiedModelName(fullyQualifiedModelName, 'summary')}',${
        !includeAdminSerializers
          ? ''
          : `
      admin: '${serializerGlobalNameFromFullyQualifiedModelName(fullyQualifiedModelName).replace(/Serializer$/, 'AdminSerializer')}',
      adminSummary: '${serializerGlobalNameFromFullyQualifiedModelName(fullyQualifiedModelName, 'summary').replace(/SummarySerializer$/, 'AdminSummarySerializer')}',`
      }
    }
  }

`
      : ''
  }${
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
