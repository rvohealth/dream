import pascalize from '../../../src/helpers/pascalize'
import camelize from '../camelize'
import relativeDreamPath from '../path/relativeDreamPath'
import uniq from '../uniq'

export default function generateFactoryContent(
  fullyQualifiedModelName: string,
  attributes: string[]
): string {
  const dreamImports: string[] = ['UpdateableProperties']
  const additionalImports: string[] = []

  const belongsToNames: string[] = []
  const belongsToTypedNames: string[] = []

  for (const attribute of attributes) {
    const [nonStandardAttributeName, attributeType] = attribute.split(':')
    const attributeName = pascalize(nonStandardAttributeName)
    const rootAssociationImport = attributeName.split('/').pop()!
    const associationImportStatement = `import ${rootAssociationImport} from '${relativeDreamPath('factories', 'models', attributeName)}'`
    const attributeNameParts = attributeName.split('/')
    const associationName = attributeNameParts[attributeNameParts.length - 1]
    const camelizedName = camelize(associationName)

    if (!attributeType) throw `must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`

    switch (attributeType) {
      case 'belongs_to':
        belongsToNames.push(camelizedName)
        belongsToTypedNames.push(`${camelizedName}: ${dreamClassNameFromAttributeName(attributeName)}`)
        additionalImports.push(associationImportStatement)
        break

      default:
      // noop
    }
  }

  const relativePath = relativeDreamPath('factories', 'models', fullyQualifiedModelName)
  const modelClassName = fullyQualifiedModelName.split('/').pop()!

  const args = [...belongsToTypedNames, `overrides: UpdateableProperties<${modelClassName}> = {}`]

  return `\
import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'
import ${pascalize(fullyQualifiedModelName.split('/').pop()!)} from '${relativePath}'${
    additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }

export default async function create${modelClassName}(${args.join(', ')}) {
  return await ${modelClassName}.create({
    ${belongsToNames.join(',\n    ')}${belongsToNames.length ? ',\n    ' : ''}...overrides,
  })
}`
}

function dreamClassNameFromAttributeName(attributeName: string) {
  return pascalize(attributeName.split('/').pop()!)
}
