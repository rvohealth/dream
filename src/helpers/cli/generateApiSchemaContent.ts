import serializersPath from '../path/serializersPath'
import getFiles from '../getFiles'
import DreamSerializer from '../../serializer'
import { SerializableTypes } from '../../serializer/decorators/attribute'
import { modelsPath } from '../path'
import { AssociationStatement } from '../../serializer/decorators/associations/shared'
import Dream from '../../dream'
import path from 'node:path'
import dbSyncPath from '../path/dbSyncPath'
import serializerForKey from '../serializerForKey'
import MissingSerializer from '../../exceptions/missing-serializer'

export default async function generateApiSchemaContent() {
  const serializersBasePath = await serializersPath()
  const serializerFiles = (await getFiles(serializersBasePath)).filter(fileName => /\.ts$/.test(fileName))

  let file = await renderExportedTypeDeclarations()

  for (const serializerFile of serializerFiles) {
    const serializers = await loadSerializerFromPath(serializerFile, null)
    for (const serializer of serializers) {
      if (!serializer?.isDreamSerializer) continue

      const attributes = serializer.attributeStatements
      const finalAttributesHash: any = {}

      for (const attr of attributes) {
        finalAttributesHash[attr.field] =
          `\n  ${attr.field}: ${renderAsToType(attr.renderAs as any) || 'any'}`
      }
      const finalAttributes: string[] = Object.values(finalAttributesHash)

      for (const association of serializer.associationStatements) {
        const associatedSerializer = await loadAssociatedSerializer(serializerFile, association)
        const expectedType = associatedSerializer?.name?.replace(/Serializer$/, '') || 'any'

        finalAttributes.push(
          `\n  ${association.field}: ${expectedType}${association.type === 'RendersMany' ? '[]' : ''}`
        )
      }

      const typeStr = `\
export interface ${serializer.name.replace(/Serializer$/, '')} {${finalAttributes.join('')}
}

`
      file += typeStr
    }
  }

  return file
}

async function renderExportedTypeDeclarations() {
  const schema = await loadDbTypes()

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

function renderAsToType(renderAs: SerializableTypes) {
  if (/^enum:/.test(renderAs)) {
    const renderAsType = renderAs.replace(/^enum:/, '')
    return renderAsType
  }

  if (/^type:/.test(renderAs)) {
    const renderAsType = renderAs.replace(/^type:/, '')
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

  if (association.path) {
    const serializersBasePath = await serializersPath()
    const pathToSerializer = association.path
    const exportedAs = association.exportedAs || null
    const expectedPath = path.join(serializersBasePath, pathToSerializer)
    const serializers = await loadSerializerFromPath(expectedPath, exportedAs)
    return serializers[0]
  }

  const expectedDreamModelPath = serializerPath
    .replace(new RegExp(await serializersPath()), await modelsPath())
    .replace(/Serializer\.ts$/, '.ts')

  let dreamClass: undefined | typeof Dream = undefined

  try {
    dreamClass = (await import(expectedDreamModelPath))?.default as typeof Dream
    if (!dreamClass) return null
  } catch (_) {
    // noop
  }

  if (!dreamClass) return null
  const associationMetadata = dreamClass.associationMap()[association.field]

  if (!associationMetadata) return null

  const associationDreamClass = associationMetadata.modelCB()

  if (Array.isArray(associationDreamClass)) {
    // TODO: find best approach to handling polymorphic associations on serializer
    return null
  } else {
    try {
      return serializerForKey(associationDreamClass, association.serializerKey)
    } catch (err) {
      if (err instanceof MissingSerializer) return null
      throw err
    }
  }
}

let _dbTypes: any
async function loadDbTypes() {
  if (_dbTypes) return _dbTypes
  _dbTypes = await import(await dbSyncPath())
  return _dbTypes
}

async function loadSerializerFromPath(
  serializerPath: string,
  exportedAs: string | null
): Promise<(typeof DreamSerializer)[]> {
  try {
    const importedFile = await import(serializerPath)

    if (exportedAs) {
      return [importedFile[exportedAs] as typeof DreamSerializer]
    } else {
      return Object.values(importedFile).filter(
        value => (value as any)?.isDreamSerializer
      ) as (typeof DreamSerializer)[]
    }
  } catch (err) {
    return []
  }
}
