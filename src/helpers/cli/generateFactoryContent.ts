import path from 'path'
import pascalize from '../../../src/helpers/pascalize'
import camelize from '../camelize'
import initializeDream from '../initializeDream'
import relativeDreamPath from '../path/relativeDreamPath'
import uniq from '../uniq'

export default async function generateFactoryContent(
  fullyQualifiedModelName: string,
  attributes: string[]
): Promise<string> {
  await initializeDream()

  const dreamImports: string[] = ['UpdateableProperties']
  const additionalImports: string[] = []

  const belongsToNames: string[] = []
  const belongsToTypedNames: string[] = []

  for (const attribute of attributes) {
    const [nonStandardAttributeName, attributeType] = attribute.split(':')
    const attributeName = pascalize(nonStandardAttributeName)
    const rootAssociationImport = attributeName.split(path.sep).pop()!
    const associationImportStatement = `import ${rootAssociationImport} from '${await relativeDreamPath('factories', 'models', attributeName)}'`
    const attributeNameParts = attributeName.split(path.sep)
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

  const relativePath = await relativeDreamPath('factories', 'models', fullyQualifiedModelName)
  const modelClassName = fullyQualifiedModelName.split(path.sep).pop()!

  const args = [...belongsToTypedNames, `overrides: UpdateableProperties<${modelClassName}> = {}`]

  return `\
import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'
import ${pascalize(fullyQualifiedModelName.split(path.sep).pop()!)} from '${relativePath}'${
    additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }

export default async function create${modelClassName}(${args.join(', ')}) {
  return await ${modelClassName}.create({
    ${belongsToNames.join(',\n    ')}${belongsToNames.length ? ',\n    ' : ''}...overrides,
  })
}`
}

function dreamClassNameFromAttributeName(attributeName: string) {
  return pascalize(attributeName.split(path.sep).pop()!)
}
