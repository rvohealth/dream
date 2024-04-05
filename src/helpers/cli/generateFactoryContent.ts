import pascalize from '../../../src/helpers/pascalize'
import camelize from '../../../shared/helpers/camelize'
import uniq from '../uniq'
import { loadDreamYamlFile } from '../path'
import initializeDream from '../../../shared/helpers/initializeDream'
import factoriesRelativePath from '../../../shared/helpers/path/factoriesRelativePath'

export default async function generateFactoryContent(
  modelName: string,
  attributes: string[]
): Promise<string> {
  await initializeDream()

  const dreamImports: string[] = ['UpdateableProperties']
  const additionalImports: string[] = []

  const belongsToNames: string[] = []
  const belongsToTypedNames: string[] = []

  for (const attribute of attributes) {
    const [attributeName, attributeType, ...descriptors] = attribute.split(':')
    const associationImportStatement = buildImportStatement(modelName, attribute)
    const attributeNameParts = attributeName.split('/')
    const associationName = attributeNameParts[attributeNameParts.length - 1]

    if (!attributeType) throw `must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`

    switch (attributeType) {
      case 'belongs_to':
        const camelizedName = camelize(associationName)
        belongsToNames.push(camelizedName)
        belongsToTypedNames.push(`${camelizedName}: ${dreamClassNameFromAttributeName(attributeName)}`)
        additionalImports.push(await associationImportStatement)

      default:
      // noop
    }
  }

  const relativePath = await relativePathToModelRoot()
  const modelClassName = pascalize(modelName.split('/').pop()!)

  const args = [...belongsToTypedNames, `overrides: UpdateableProperties<${modelClassName}> = {}`]

  return `\
import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'
import ${pascalize(modelName.split('/').pop()!)} from '${relativePath}${modelName.replace(/^\//, '')}'${
    !!additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }

export default async function create${modelClassName}(${args.join(', ')}) {
  return await ${modelClassName}.create({
    ${belongsToNames.join(',\n    ')}${belongsToNames.length ? ',\n    ' : ''}...overrides,
  })
}`
}

async function buildImportStatement(modelName: string, attribute: string) {
  const relativePath = await relativePathToModelRoot()

  const [attributeName] = attribute.split(':')
  const rootAssociationImport = attributeName.split('/').pop()!
  const associationImportStatement = `import ${pascalize(
    rootAssociationImport
  )} from '${relativePath}${attributeName
    .split('/')
    .map(name => pascalize(name))
    .join('/')}'`
  return associationImportStatement
}

async function relativePathToModelRoot() {
  const yamlConf = await loadDreamYamlFile()
  const pathToFactories = await factoriesRelativePath()
  const updirsArr = [...pathToFactories.split('/').map(() => '../')]

  return updirsArr.join('') + yamlConf.models_path.replace(/\/$/, '') + '/'
}

function dreamClassNameFromAttributeName(attributeName: string) {
  return pascalize(attributeName.split('/').pop()!)
}
