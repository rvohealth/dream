import pluralize from 'pluralize-esm'
import serializerGlobalNameFromFullyQualifiedModelName from '../../serializer/helpers/serializerGlobalNameFromFullyQualifiedModelName.js'
import camelize from '../camelize.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import pascalize from '../pascalize.js'
import absoluteDreamPath from '../path/absoluteDreamPath.js'
import snakeify from '../snakeify.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import uniq from '../uniq.js'

interface GenerateDreamContentOptions {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  fullyQualifiedParentName?: string | undefined
  connectionName?: string
  serializer: boolean
  includeAdminSerializers: boolean
}

export interface ModelConfig {
  fullyQualifiedModelName: string
  modelClassName: string
  parentModelClassName: string | undefined
  applicationModelName: string
  isSTI: boolean
  tableName: string
}

export interface ImportConfig {
  dreamTypeImports: string[]
  dreamImports: string[]
  modelImportStatements: string[]
}

export interface AttributeProcessingResult {
  content: string
  imports: string[]
}

export default function generateDreamContent(options: GenerateDreamContentOptions): string {
  const config = createModelConfig(options)
  const baseImports = createImportConfig(config, options)
  const attributesResult = processAttributes(options.columnsWithTypes, config.modelClassName)

  const allImports: ImportConfig = {
    ...baseImports,
    modelImportStatements: [...baseImports.modelImportStatements, ...attributesResult.imports],
  }

  const importSection = buildImportSection(allImports)
  const classDeclaration = buildClassDeclaration(config)
  const tableMethod = buildTableMethod(config)
  const serializersMethod = buildSerializersMethod(config, options)
  const fieldsSection = buildFieldsSection(config, attributesResult)

  return `${importSection}

const deco = new Decorators<typeof ${config.modelClassName}>()

${classDeclaration}
${tableMethod}${serializersMethod}${fieldsSection}
}
`.replace(/^\s*$/gm, '')
}

export function createModelConfig(options: GenerateDreamContentOptions): ModelConfig {
  const fullyQualifiedModelName = standardizeFullyQualifiedModelName(options.fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)
  const isSTI = !!options.fullyQualifiedParentName

  let parentModelClassName: string | undefined
  if (isSTI) {
    const standardizedParentName = standardizeFullyQualifiedModelName(options.fullyQualifiedParentName!)
    parentModelClassName = globalClassNameFromFullyQualifiedModelName(standardizedParentName)
  }

  const connectionName = options.connectionName || 'default'
  const applicationModelName =
    connectionName === 'default' ? 'ApplicationModel' : `${pascalize(connectionName)}ApplicationModel`

  const tableName = snakeify(pluralize(fullyQualifiedModelName.replace(/\//g, '_')))

  return {
    fullyQualifiedModelName,
    modelClassName,
    parentModelClassName,
    applicationModelName,
    isSTI,
    tableName,
  }
}

export function createImportConfig(config: ModelConfig, options: GenerateDreamContentOptions): ImportConfig {
  const dreamTypeImports: string[] = ['DreamColumn']
  const dreamImports: string[] = ['Decorators']

  if (options.serializer) {
    dreamTypeImports.push('DreamSerializers')
  }

  if (config.isSTI) {
    dreamImports.push('STI')
  }

  const baseModelName = config.isSTI ? options.fullyQualifiedParentName! : config.applicationModelName

  const modelImportStatements: string[] = [importStatementForModel(baseModelName)]

  return {
    dreamTypeImports,
    dreamImports,
    modelImportStatements,
  }
}

export function processAttributes(
  columnsWithTypes: string[],
  modelClassName: string
): AttributeProcessingResult & { formattedFields: string; formattedDecorators: string } {
  const attributeResults = columnsWithTypes.map(attribute => processAttribute(attribute, modelClassName))

  const allImports = attributeResults.flatMap(result => result.imports)

  const attributeStatements = attributeResults.map(result => result.content)

  const formattedFields = attributeStatements
    .filter(attr => !/^\n@/.test(attr))
    .map(s => s.split('\n').join('\n  '))
    .join('')

  const formattedDecorators = attributeStatements
    .filter(attr => /^\n@/.test(attr))
    .map(s => s.split('\n').join('\n  '))
    .join('\n  ')
    .replace(/\n {2}$/, '')

  return {
    content: '', // Not used in this context
    imports: allImports,
    formattedFields,
    formattedDecorators,
  }
}

export function processAttribute(attribute: string, modelClassName: string): AttributeProcessingResult {
  const [attributeName, attributeType, ...descriptors] = attribute.split(':')

  if (attributeName === undefined) return { content: '', imports: [] }

  if (!attributeType) {
    throw new Error(`must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`)
  }

  const processedAttrType = camelize(attributeType).toLowerCase()
  switch (processedAttrType) {
    case 'belongsto':
      return createBelongsToAttribute(attributeName, descriptors, modelClassName)
    case 'hasone':
    case 'hasmany':
      return { content: '', imports: [] }
    case 'encrypted':
      return createEncryptedAttribute(attributeName, attribute, modelClassName)
    default:
      return createRegularAttribute(attributeName, attribute, modelClassName)
  }
}

export function createBelongsToAttribute(
  attributeName: string,
  descriptors: string[],
  modelClassName: string
): AttributeProcessingResult {
  const fullyQualifiedAssociatedModelName = standardizeFullyQualifiedModelName(attributeName)
  const associationModelName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedAssociatedModelName)
  const associationImportStatement = importStatementForModel(fullyQualifiedAssociatedModelName)

  const associationName = camelize(fullyQualifiedAssociatedModelName.split('/').pop()!)
  const associationForeignKey = `${associationName}Id`
  const isOptional = descriptors.includes('optional')

  const content = `
@deco.BelongsTo('${fullyQualifiedAssociatedModelName}', { on: '${associationForeignKey}'${isOptional ? ', optional: true' : ''} })
public ${associationName}: ${associationModelName}${isOptional ? ' | null' : ''}
public ${associationForeignKey}: DreamColumn<${modelClassName}, '${associationName}Id'>
`

  return {
    content,
    imports: [associationImportStatement],
  }
}

export function createEncryptedAttribute(
  attributeName: string,
  attribute: string,
  modelClassName: string
): AttributeProcessingResult {
  const content = `
@deco.Encrypted()
public ${camelize(attributeName)}: ${getAttributeType(attribute, modelClassName)}`

  return {
    content,
    imports: [],
  }
}

export function createRegularAttribute(
  attributeName: string,
  attribute: string,
  modelClassName: string
): AttributeProcessingResult {
  const content = `
public ${camelize(attributeName)}: ${getAttributeType(attribute, modelClassName)}`

  return {
    content,
    imports: [],
  }
}

function buildImportSection(imports: ImportConfig): string {
  const dreamImportLine = imports.dreamImports.length
    ? `import { ${uniq(imports.dreamImports).join(', ')} } from '@rvoh/dream'\n`
    : ''

  const typeImportLine = `import { ${uniq(imports.dreamTypeImports).join(', ')} } from '@rvoh/dream/types'`
  const modelImports = uniq(imports.modelImportStatements).join('')

  return `${dreamImportLine}${typeImportLine}${modelImports}`
}

function buildClassDeclaration(config: ModelConfig): string {
  const stiDecorator = config.isSTI ? `@STI(${config.parentModelClassName})\n` : ''
  const extendsClause = config.isSTI ? config.parentModelClassName : config.applicationModelName

  return `${stiDecorator}export default class ${config.modelClassName} extends ${extendsClause} {`
}

function buildTableMethod(config: ModelConfig): string {
  if (config.isSTI) return ''

  return `  public override get table() {
    return '${config.tableName}' as const
  }

`
}

function buildSerializersMethod(config: ModelConfig, options: GenerateDreamContentOptions): string {
  if (!options.serializer) return ''

  const overrideKeyword = config.isSTI ? 'override ' : ''
  const defaultSerializer = serializerGlobalNameFromFullyQualifiedModelName(config.fullyQualifiedModelName)
  const summarySerializer = serializerGlobalNameFromFullyQualifiedModelName(
    config.fullyQualifiedModelName,
    'summary'
  )

  let adminSerializers = ''
  if (options.includeAdminSerializers) {
    const adminSerializer = defaultSerializer.replace(/Serializer$/, 'AdminSerializer')
    const adminSummarySerializer = summarySerializer.replace(/SummarySerializer$/, 'AdminSummarySerializer')
    adminSerializers = `
      admin: '${adminSerializer}',
      adminSummary: '${adminSummarySerializer}',`
  }

  return `  public ${overrideKeyword}get serializers(): DreamSerializers<${config.modelClassName}> {
    return {
      default: '${defaultSerializer}',
      summary: '${summarySerializer}',${adminSerializers}
    }
  }

`
}

function buildFieldsSection(
  config: ModelConfig,
  attributes: { formattedFields: string; formattedDecorators: string }
): string {
  if (config.isSTI) {
    return `${attributes.formattedFields}${attributes.formattedDecorators}`
  }

  const idField = `  public id: DreamColumn<${config.modelClassName}, 'id'>`
  let timestamps = `
  public createdAt: DreamColumn<${config.modelClassName}, 'createdAt'>
  public updatedAt: DreamColumn<${config.modelClassName}, 'updatedAt'>
`

  if (!attributes.formattedDecorators.length) {
    timestamps = timestamps.replace(/\n$/, '')
  }

  return `${idField}${attributes.formattedFields}${timestamps}${attributes.formattedDecorators}`
}

function getAttributeType(attribute: string, modelClassName: string): string {
  return `DreamColumn<${modelClassName}, '${camelize(attribute.split(':')[0])}'>`
}

function importStatementForModel(destinationModelName: string): string {
  return `\nimport ${globalClassNameFromFullyQualifiedModelName(destinationModelName)} from '${absoluteDreamPath('models', destinationModelName)}'`
}
