import camelize from '../camelize'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName'
import relativeDreamPath from '../path/relativeDreamPath'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName'
import uniq from '../uniq'

export default function generateFactoryContent(
  fullyQualifiedModelName: string,
  attributes: string[]
): string {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const dreamImports: string[] = ['UpdateableProperties']
  const additionalImports: string[] = []

  const belongsToNames: string[] = []
  const belongsToTypedNames: string[] = []

  for (const attribute of attributes) {
    const [attributeName, attributeType] = attribute.split(':')
    const fullyQualifiedAssociatedModelName = standardizeFullyQualifiedModelName(attributeName)
    const associationModelName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedAssociatedModelName)
    const associationImportStatement = `import ${associationModelName} from '${relativeDreamPath('factories', 'models', fullyQualifiedAssociatedModelName)}'`
    const associationName = camelize(associationModelName)

    if (!attributeType)
      throw new Error(
        `Must pass a column type for ${fullyQualifiedAssociatedModelName} (i.e. ${fullyQualifiedAssociatedModelName}:string)`
      )

    switch (attributeType) {
      case 'belongs_to':
        belongsToNames.push(associationName)
        belongsToTypedNames.push(`${associationName}: ${associationModelName}`)
        additionalImports.push(associationImportStatement)
        break

      default:
      // noop
    }
  }

  const relativePath = relativeDreamPath('factories', 'models', fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)

  const args = [...belongsToTypedNames, `overrides: UpdateableProperties<${modelClassName}> = {}`]

  return `\
import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'
import ${modelClassName} from '${relativePath}'${
    additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }

export default async function create${modelClassName}(${args.join(', ')}) {
  return await ${modelClassName}.create({
    ${belongsToNames.join(',\n    ')}${belongsToNames.length ? ',\n    ' : ''}...overrides,
  })
}
`
}
