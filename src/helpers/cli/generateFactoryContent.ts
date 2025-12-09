import camelize from '../camelize.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import absoluteDreamPath from '../path/absoluteDreamPath.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import uniq from '../uniq.js'
import { optionalFromDescriptors } from './generateMigrationContent.js'

export default function generateFactoryContent({
  fullyQualifiedModelName,
  columnsWithTypes,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
}): string {
  fullyQualifiedModelName = standardizeFullyQualifiedModelName(fullyQualifiedModelName)
  const dreamTypeImports: string[] = ['UpdateableProperties']
  const dreamImports: string[] = []
  const additionalImports: string[] = []
  const nodeImports: string[] = []

  const belongsToNames: string[] = []
  const belongsToTypedNames: string[] = []
  const associationCreationStatements: string[] = []
  const attributeDefaults: string[] = []
  let counterVariableIncremented = false

  for (const attribute of columnsWithTypes) {
    const [attributeName, _attributeType, ...descriptors] = attribute.split(':')
    if (attributeName === undefined) continue
    if (_attributeType === undefined) continue
    const optional = optionalFromDescriptors(descriptors)
    if (optional) continue
    const attributeVariable = camelize(attributeName.replace(/\//g, ''))

    if (/^type$/.test(attributeName)) continue
    if (/(_type|_id)$/.test(attributeName)) continue
    const attributeType = /uuid$/.test(attributeName) ? 'uuid' : _attributeType

    if (!attributeType)
      throw new Error(`Must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`)

    const safeAttributeType = camelize(attributeType)?.toLowerCase()
    switch (safeAttributeType) {
      case 'belongsto': {
        const attributeVariable = camelize(attributeName.split('/').pop()!)
        const fullyQualifiedAssociatedModelName = standardizeFullyQualifiedModelName(attributeName)
        const associationModelName = globalClassNameFromFullyQualifiedModelName(
          fullyQualifiedAssociatedModelName
        )
        const associationFactoryImportStatement = `import create${associationModelName} from '${absoluteDreamPath('factories', fullyQualifiedAssociatedModelName)}'`

        belongsToNames.push(attributeVariable)
        belongsToTypedNames.push(`${attributeVariable}: ${associationModelName}`)
        additionalImports.push(associationFactoryImportStatement)
        associationCreationStatements.push(
          `${attributeVariable}: attrs.${attributeVariable} ? null : await create${associationModelName}(),`
        )
        break
      }

      case 'string':
      case 'text':
      case 'citext':
        attributeDefaults.push(
          `${attributeVariable}: \`${fullyQualifiedModelName} ${attributeVariable} ${counterVariableIncremented ? '${counter}' : '${++counter}'}\`,`
        )
        counterVariableIncremented = true
        break

      case 'string[]':
      case 'text[]':
      case 'citext[]':
        attributeDefaults.push(
          `${attributeVariable}: [\`${fullyQualifiedModelName} ${attributeVariable} ${counterVariableIncremented ? '${counter}' : '${++counter}'}\`],`
        )
        counterVariableIncremented = true
        break

      case 'enum':
        attributeDefaults.push(`${attributeVariable}: '${(descriptors.at(-1) || '<tbd>').split(',')[0]}',`)
        break

      case 'enum[]':
        attributeDefaults.push(`${attributeVariable}: ['${(descriptors.at(-1) || '<tbd>').split(',')[0]}'],`)
        break

      case 'integer':
        attributeDefaults.push(`${attributeVariable}: 1,`)
        break

      case 'integer[]':
        attributeDefaults.push(`${attributeVariable}: [1],`)
        break

      case 'bigint':
        attributeDefaults.push(`${attributeVariable}: '11111111111111111',`)
        break

      case 'bigint[]':
        attributeDefaults.push(`${attributeVariable}: ['11111111111111111'],`)
        break

      case 'decimal':
        attributeDefaults.push(`${attributeVariable}: 1.1,`)
        break

      case 'decimal[]':
        attributeDefaults.push(`${attributeVariable}: [1.1],`)
        break

      case 'date':
        dreamImports.push('CalendarDate')
        attributeDefaults.push(`${attributeVariable}: CalendarDate.today(),`)
        break

      case 'date[]':
        dreamImports.push('CalendarDate')
        attributeDefaults.push(`${attributeVariable}: [CalendarDate.today()],`)
        break

      case 'datetime':
        dreamImports.push('DateTime')
        attributeDefaults.push(`${attributeVariable}: DateTime.now(),`)
        break

      case 'datetime[]':
        dreamImports.push('DateTime')
        attributeDefaults.push(`${attributeVariable}: [DateTime.now()],`)
        break

      case 'uuid':
        nodeImports.push('randomUUID')
        attributeDefaults.push(`${attributeVariable}: randomUUID(),`)
        break

      default:
        if (/\[\]$/.test(attributeType)) {
          attributeDefaults.push(`${attributeVariable}: [],`)
        }
      // noop
    }
  }

  const relativePath = absoluteDreamPath('models', fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)

  return `\
${nodeImports.length ? `import { ${uniq(nodeImports).join(', ')} } from 'node:crypto'\n` : ''}${dreamImports.length ? `import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'\n` : ''}import { ${uniq(dreamTypeImports).join(', ')} } from '@rvoh/dream/types'
import ${modelClassName} from '${relativePath}'${
    additionalImports.length ? '\n' + uniq(additionalImports).join('\n') : ''
  }
${counterVariableIncremented ? '\nlet counter = 0\n' : ''}
export default async function create${modelClassName}(attrs: UpdateableProperties<${modelClassName}> = {}) {
  return await ${modelClassName}.create({
    ${associationCreationStatements.length ? associationCreationStatements.join('\n    ') + '\n    ' : ''}${
      attributeDefaults.length ? attributeDefaults.join('\n    ') + '\n    ' : ''
    }...attrs,
  })
}
`
}
