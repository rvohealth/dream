import camelize from '../camelize.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import absoluteDreamPath from '../path/absoluteDreamPath.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import uniq from '../uniq.js'

export default function generateSerializerContent({
  fullyQualifiedModelName,
  columnsWithTypes = [],
  fullyQualifiedParentName,
  stiBaseSerializer,
  includeAdminSerializers,
  includeInternalSerializers,
  modelClassName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes?: string[] | undefined
  fullyQualifiedParentName?: string | undefined
  stiBaseSerializer: boolean
  includeAdminSerializers: boolean
  includeInternalSerializers?: boolean
  /** Model class name, computed once via modelClassNameFrom in the orchestrator. */
  modelClassName: string
}) {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const additionalImports: string[] = []
  const dreamImports: string[] = []
  const isSTI = !!fullyQualifiedParentName

  // Variants that should be emitted in this file. Each variant generates a
  // matching summary + default serializer pair; STI children import the
  // corresponding variant from the parent module so the inheritance chain
  // stays within the same variant (admin → admin, internal → internal).
  const variantSuffixes: string[] = ['']
  if (includeAdminSerializers) variantSuffixes.push('Admin')
  if (includeInternalSerializers) variantSuffixes.push('Internal')

  if (isSTI) {
    fullyQualifiedParentName = standardizeFullyQualifiedModelName(fullyQualifiedParentName!)
    additionalImports.push(
      importStatementForSerializer(fullyQualifiedModelName, fullyQualifiedParentName, variantSuffixes)
    )
  } else {
    dreamImports.push('DreamSerializer')
  }

  const relatedModelImport = importStatementForModel(modelClassName, fullyQualifiedModelName)
  const modelInstanceName = camelize(modelClassName)
  const modelSerializerSignature = stiBaseSerializer
    ? `<T extends ${modelClassName}>(StiChildClass: typeof ${modelClassName}, ${modelInstanceName}: T)`
    : `(${modelInstanceName}: ${modelClassName})`
  const modelSerializerArgs = `${modelInstanceName}`
  const dreamSerializerArgs = `${stiBaseSerializer ? `StiChildClass ?? ${modelClassName}` : modelClassName}, ${modelInstanceName}`

  const localSerializerBase = fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName)
  const parentSerializerBase = isSTI
    ? fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedParentName!)
    : ''

  const additionalModelImports: string[] = []

  const dreamImport = dreamImports.length
    ? `import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'\n`
    : ''

  const additionalImportsStr = uniq(additionalImports).join('')

  const buildSerializerPair = (variantSuffix: string): string => {
    const summaryName = variantSerializerClassName(localSerializerBase, variantSuffix, 'summary')
    const defaultName = variantSerializerClassName(localSerializerBase, variantSuffix, 'default')

    const summaryExtends = isSTI
      ? `${variantSerializerClassName(parentSerializerBase, variantSuffix, 'summary')}(${modelClassName}, ${modelSerializerArgs})`
      : `DreamSerializer(${dreamSerializerArgs})`

    const defaultExtends = isSTI
      ? `${variantSerializerClassName(parentSerializerBase, variantSuffix, 'default')}(${modelClassName}, ${modelSerializerArgs})`
      : `${summaryName}(${stiBaseSerializer ? 'StiChildClass, ' : ''}${modelSerializerArgs})`

    const summary = `export const ${summaryName} = ${modelSerializerSignature} =>
  ${summaryExtends}${isSTI ? '' : `\n    .attribute('id')`}`

    const defaultBody = columnsWithTypes
      .map(attr => {
        const [name, type] = attr.split(':')
        if (name === undefined) return ''
        if (['belongsto', 'hasone', 'hasmany'].includes(camelize(type as any)?.toLowerCase())) return ''

        return `\n    ${attribute(modelClassName, name, type, attr, stiBaseSerializer)}`
      })
      .join('')

    const def = `export const ${defaultName} = ${modelSerializerSignature} =>
  ${defaultExtends}${defaultBody}`

    return `${summary}\n\n${def}`
  }

  const serializerBlocks = variantSuffixes.map(buildSerializerPair).join('\n\n')

  return `${dreamImport}${additionalImportsStr}${relatedModelImport}${additionalModelImports.join('')}
${serializerBlocks}
`
}

function variantSerializerClassName(
  serializerBase: string,
  variantSuffix: string,
  kind: 'default' | 'summary'
): string {
  return kind === 'summary'
    ? `${serializerBase}${variantSuffix}SummarySerializer`
    : `${serializerBase}${variantSuffix}Serializer`
}

function attribute(
  modelClassName: string,
  name: string,
  type: string | undefined,
  attr: string,
  stiBaseSerializer: boolean
) {
  if (name === 'type' && stiBaseSerializer) {
    return `.attribute('type', { openapi: { type: 'string', enum: [(StiChildClass ?? ${modelClassName}).sanitizedName] } })`
  }

  switch (type) {
    case 'json':
    case 'jsonb':
    case 'json[]':
    case 'jsonb[]':
      return `.attribute('${camelize(name)}', { openapi: { type: 'object', properties: { } } })`

    default:
      return `.attribute('${camelize(name)}'${attributeOptionsSpecifier(type, attr)})`
  }
}

function attributeOptionsSpecifier(type: string | undefined, attr: string) {
  switch (type) {
    case 'decimal':
      return `, { precision: ${attr.split(',').at(-1)} }`

    default:
      return ''
  }
}

function importStatementForSerializer(
  originModelName: string,
  destinationModelName: string,
  variantSuffixes: string[]
) {
  const base = fullyQualifiedModelNameToSerializerBaseName(destinationModelName)
  const names = variantSuffixes.flatMap(suffix => [
    globalClassNameFromFullyQualifiedModelName(variantSerializerClassName(base, suffix, 'default')),
    globalClassNameFromFullyQualifiedModelName(variantSerializerClassName(base, suffix, 'summary')),
  ])

  const importFrom = absoluteDreamPath('serializers', destinationModelName)

  return `import { ${names.join(', ')} } from '${importFrom}'\n`
}

function importStatementForModel(modelClassName: string, fullyQualifiedModelName: string) {
  const importFrom = absoluteDreamPath('models', fullyQualifiedModelName)

  return `import ${modelClassName} from '${importFrom}'\n`
}

function fullyQualifiedModelNameToSerializerBaseName(fullyQualifiedModelName: string) {
  return fullyQualifiedModelName.replace(/\//g, '')
}
