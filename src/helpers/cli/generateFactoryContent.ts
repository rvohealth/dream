import camelize from '../camelize.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import relativeDreamPath from '../path/relativeDreamPath.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import uniq from '../uniq.js'

export default function generateFactoryContent({
  fullyQualifiedModelName,
  columnsWithTypes,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
}): string {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const dreamImports: string[] = ['UpdateableProperties']
  const additionalImports: string[] = []

  const belongsToNames: string[] = []
  const belongsToTypedNames: string[] = []
  const associationCreationStatements: string[] = []
  const stringAttributes: string[] = []
  let firstStringAttr = true

  for (const attribute of columnsWithTypes) {
    const [attributeName, attributeType, ...descriptors] = attribute.split(':')
    const fullyQualifiedAssociatedModelName = standardizeFullyQualifiedModelName(attributeName)
    const associationModelName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedAssociatedModelName)
    const associationFactoryImportStatement = `import create${associationModelName} from '${relativeDreamPath('factories', 'factories', fullyQualifiedModelName, fullyQualifiedAssociatedModelName)}'`
    const associationName = camelize(associationModelName)

    if (/_type$/.test(attributeName)) continue

    if (!attributeType)
      throw new Error(
        `Must pass a column type for ${fullyQualifiedAssociatedModelName} (i.e. ${fullyQualifiedAssociatedModelName}:string)`
      )

    switch (attributeType) {
      case 'belongs_to':
        belongsToNames.push(associationName)
        belongsToTypedNames.push(`${associationName}: ${associationModelName}`)
        additionalImports.push(associationFactoryImportStatement)
        associationCreationStatements.push(
          `attrs.${associationName} ||= await create${associationModelName}()`
        )
        break

      case 'string':
      case 'text':
      case 'citext':
        stringAttributes.push(
          `attrs.${camelize(attributeName)} ||= \`${fullyQualifiedModelName} ${camelize(attributeName)} ${firstStringAttr ? '${++counter}' : '${counter}'}\``
        )
        firstStringAttr = false
        break

      case 'enum':
        stringAttributes.push(
          `attrs.${camelize(attributeName)} ||= '${(descriptors[descriptors.length - 1] || '<tbd>').split(',')[0]}'`
        )
        break

      default:
      // noop
    }
  }

  const relativePath = relativeDreamPath('factories', 'models', fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)

  return `\
import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'
import ${modelClassName} from '${relativePath}'${
    additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }
${stringAttributes.length ? '\nlet counter = 0\n' : ''}
export default async function create${modelClassName}(attrs: UpdateableProperties<${modelClassName}> = {}) {
  ${associationCreationStatements.length ? associationCreationStatements.join('\n  ') + '\n  ' : ''}${
    stringAttributes.length ? stringAttributes.join('\n  ') + '\n  ' : ''
  }return await ${modelClassName}.create(attrs)
}
`
}
