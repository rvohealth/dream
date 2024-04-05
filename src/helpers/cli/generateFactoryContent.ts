import path from 'path'
import pluralize from 'pluralize'
import pascalize from '../../../src/helpers/pascalize'
import snakeify from '../../../shared/helpers/snakeify'
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

  const yamlConf = await loadDreamYamlFile()
  const tableName = snakeify(pluralize(modelName.replace(/\//g, '_')))
  const relativePath = await relativePathToModelRoot()

  const args = [
    ...belongsToTypedNames,
    `overrides: UpdateableProperties<${pascalize(modelName.split('/').pop()!)}> = {}`,
  ]

  return `\
import { ${uniq(dreamImports).join(', ')} } from '@rvohealth/dream'
import ${pascalize(modelName.split('/').pop()!)} from '${relativePath}${modelName.replace(/^\//, '')}'${
    !!additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }

export default async function create${pascalize(modelName.split('/').pop()!)}(${args.join(', ')}) {
  return await ${pascalize(modelName.split('/').pop()!)}.create({
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

async function buildSerializerImportStatement(modelName: string) {
  const yamlConf = await loadDreamYamlFile()
  const relativePath = await relativePathToSrcRoot(modelName)

  const serializerPath = path.join(
    relativePath,
    yamlConf.serializers_path,
    relativeSerializerPathFromModelName(modelName)
  )
  const serializerClassName = serializerNameFromModelName(modelName)
  const importStatement = `import ${serializerClassName} from '${serializerPath}'`
  return importStatement
}

function serializerNameFromModelName(modelName: string) {
  return (
    modelName
      .split('/')
      .map(part => pascalize(part))
      .join('') + 'Serializer'
  )
}

function relativeSerializerPathFromModelName(modelName: string) {
  return (
    modelName
      .split('/')
      .map(part => pascalize(part))
      .join('/') + 'Serializer'
  )
}

async function relativePathToModelRoot() {
  const yamlConf = await loadDreamYamlFile()
  const pathToFactories = await factoriesRelativePath()
  const updirsArr = [...pathToFactories.split('/').map(() => '../')]

  return updirsArr.join('') + yamlConf.models_path.replace(/\/$/, '') + '/'
}

function relativePathToFactoryRoot(modelName: string) {
  const numNestedDirsForModel = modelName.split('/').length - 1
  let updirs = ''
  for (let i = 0; i < numNestedDirsForModel; i++) {
    updirs += '../'
  }
  return numNestedDirsForModel > 0 ? updirs : './'
}

async function relativePathToSrcRoot(modelName: string) {
  const yamlConf = await loadDreamYamlFile()
  const rootPath = relativePathToFactoryRoot(modelName)
  const numUpdirsInRootPath = yamlConf.models_path.split('/').length
  let updirs = ''
  for (let i = 0; i < numUpdirsInRootPath; i++) {
    updirs += '../'
  }

  return rootPath === './' ? updirs : path.join(rootPath, updirs)
}

function dreamClassNameFromAttributeName(attributeName: string) {
  return pascalize(attributeName.split('/').pop()!)
}
