import serializersPath from '../../../shared/helpers/path/serializersPath'
import getFiles from '../getFiles'
import DreamSerializer from '../../serializer'
import { SerializableTypes } from '../../serializer/decorators/attribute'
import { modelsPath, schemaPath } from '../path'
import { AssociationStatement } from '../../serializer/decorators/associations/shared'
import Dream from '../../dream'

export default async function generateApiSchemaContent() {
  const serializersBasePath = await serializersPath()
  const serializerFiles = (await getFiles(serializersBasePath)).filter(fileName => /\.ts$/.test(fileName))
  const schema = await import(await schemaPath())

  let file = await renderExportedTypeDeclarations()

  for (const serializerFile of serializerFiles) {
    const serializer = (await import(serializerFile)).default as typeof DreamSerializer
    const attributes = serializer.attributeStatements
    const finalAttributes: string[] = []

    for (const attr of attributes) {
      finalAttributes.push(`\n  ${attr.field}: ${renderAsToType(attr.renderAs as any, schema) || 'any'}`)
    }

    for (const association of serializer.associationStatements) {
      const associatedSerializer = await loadAssociatedSerializer(serializerFile, association)
      const expectedType = associatedSerializer?.name?.replace(/Serializer$/, '')

      if (expectedType) {
        finalAttributes.push(
          `\n  ${association.field}: ${expectedType}${association.type === 'RendersMany' ? '[]' : ''}`
        )
      }
    }

    const typeStr = `\
export interface ${serializer.name.replace(/Serializer$/, '')} {${finalAttributes.join('')}
}

`
    file += typeStr
  }

  return file
}

async function renderExportedTypeDeclarations() {
  const schema = await loadSchema()

  return Object.keys(schema)
    .filter(key => /Values$/.test(key))
    .reduce((acc, key) => {
      const values = schema[key]
      return (
        acc +
        `\
export type ${key.replace(/Values$/, '')} = ${values.map((val: string) => `'${val}'`).join(' | ')}
export const ${key} = [
  ${values.map((val: string) => `'${val}'`).join(',\n  ')}
]

`
      )
    }, '')
}

function renderAsToType(renderAs: SerializableTypes, schema: any) {
  if (/^enum:/.test(renderAs)) {
    const renderAsType = renderAs.replace(/^enum:/, '')
    return renderAsType
  }

  const typeCoersions = {
    date: 'string',
    datetime: 'string',
    decimal: 'number',
    json: 'any',
  } as any

  return typeCoersions[renderAs] || renderAs
}

async function loadAssociatedSerializer(serializerPath: string, association: AssociationStatement) {
  if (association.serializerClassCB) {
    return association.serializerClassCB()
  }

  const expectedDreamModelPath = serializerPath
    .replace(new RegExp(await serializersPath()), await modelsPath())
    .replace(/Serializer\.ts$/, '.ts')

  const dreamClass = (await import(expectedDreamModelPath))?.default as typeof Dream
  if (!dreamClass) return null

  const associationMetadata = dreamClass.associationMap()[association.field]

  if (!associationMetadata) return null

  const associationDreamClass = associationMetadata.modelCB()

  if (Array.isArray(associationDreamClass)) {
    // TODO: find best approach to handling polymorphic associations on serializer
    return null
  } else {
    const serializerClass = associationDreamClass.prototype.serializer
    return serializerClass || null
  }

  return null
}

let _schema: any
async function loadSchema() {
  if (_schema) return _schema
  _schema = await import(await schemaPath())
  return _schema
}
