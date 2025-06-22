import camelize from '../camelize.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import relativeDreamPath from '../path/relativeDreamPath.js'
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
  const dreamImports: string[] = ['UpdateableProperties']
  const additionalImports: string[] = []

  const belongsToNames: string[] = []
  const belongsToTypedNames: string[] = []
  const associationCreationStatements: string[] = []
  const attributeDefaults: string[] = []
  let counterVariableIncremented = false

  for (const attribute of columnsWithTypes) {
    const [attributeName, attributeType, ...descriptors] = attribute.split(':')
    if (attributeName === undefined) continue
    if (attributeType === undefined) continue
    const optional = optionalFromDescriptors(descriptors)
    if (optional) continue
    const attributeVariable = camelize(attributeName.replace(/\//g, ''))

    if (/(_type|_id)$/.test(attributeName)) continue

    if (!attributeType)
      throw new Error(`Must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`)

    switch (attributeType) {
      case 'belongs_to': {
        const fullyQualifiedAssociatedModelName = standardizeFullyQualifiedModelName(attributeName)
        const associationModelName = globalClassNameFromFullyQualifiedModelName(
          fullyQualifiedAssociatedModelName
        )
        const associationFactoryImportStatement = `import create${associationModelName} from '${relativeDreamPath('factories', 'factories', fullyQualifiedModelName, fullyQualifiedAssociatedModelName)}'`

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

      case 'enum':
        attributeDefaults.push(`${attributeVariable}: '${(descriptors.at(-1) || '<tbd>').split(',')[0]}',`)
        break

      case 'integer':
        attributeDefaults.push(`${attributeVariable}: 1,`)
        break

      case 'bigint':
        attributeDefaults.push(`${attributeVariable}: '11111111111111111',`)
        break

      case 'decimal':
        attributeDefaults.push(`${attributeVariable}: 1.1,`)
        break

      case 'date':
        dreamImports.push('CalendarDate')
        attributeDefaults.push(`${attributeVariable}: CalendarDate.today(),`)
        break

      case 'datetime':
        dreamImports.push('DateTime')
        attributeDefaults.push(`${attributeVariable}: DateTime.now(),`)
        break

      default:
      // noop
    }
  }

  const relativePath = relativeDreamPath('factories', 'models', fullyQualifiedModelName)
  const modelClassName = globalClassNameFromFullyQualifiedModelName(fullyQualifiedModelName)

  return `\
import { ${uniq(dreamImports).join(', ')} } from '@rvoh/dream'
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
