import camelize from '../camelize.js'
import hyphenize from '../hyphenize.js'
import globalClassNameFromFullyQualifiedModelName from '../globalClassNameFromFullyQualifiedModelName.js'
import absoluteDreamPath from '../path/absoluteDreamPath.js'
import standardizeFullyQualifiedModelName from '../standardizeFullyQualifiedModelName.js'
import uniq from '../uniq.js'
import { optionalFromDescriptors } from './generateMigrationContent.js'

export default function generateFactoryContent({
  fullyQualifiedModelName,
  columnsWithTypes,
  modelClassName,
}: {
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
  /** Model class name, computed once via modelClassNameFrom in the orchestrator. */
  modelClassName: string
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
    const [rawSegmentOne, _attributeType, ...descriptors] = attribute.split(':')
    if (rawSegmentOne === undefined) continue
    if (_attributeType === undefined) continue
    const optional = optionalFromDescriptors(descriptors)
    if (optional) continue

    // Extract optional `@alias` from segment-1 (Model@alias:belongs_to form).
    // Non-association tokens never contain `@`, so this is a no-op for scalars.
    const atIdx = rawSegmentOne.indexOf('@')
    const aliasName = atIdx !== -1 ? rawSegmentOne.slice(atIdx + 1) : undefined
    const attributeName = atIdx !== -1 ? rawSegmentOne.slice(0, atIdx) : rawSegmentOne
    if (!attributeName) continue
    if (atIdx !== -1 && !aliasName) continue

    const attributeVariable = camelize(attributeName.replace(/\//g, ''))

    if (/^type$/.test(attributeName)) continue
    if (/(_type|_id)$/.test(attributeName)) continue
    const attributeType = /uuid$/.test(attributeName) ? 'uuid' : _attributeType

    if (!attributeType)
      throw new Error(`Must pass a column type for ${attributeName} (i.e. ${attributeName}:string)`)

    const safeAttributeType = camelize(attributeType)?.toLowerCase()
    switch (safeAttributeType) {
      case 'belongsto': {
        // When `Model@alias:belongs_to`, the factory property uses the alias;
        // otherwise it uses the model's last namespace segment (legacy form).
        const attributeVariable = aliasName ? camelize(aliasName) : camelize(attributeName.split('/').pop()!)
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

      case 'encrypted':
      case 'string':
      case 'text':
      case 'citext':
        if (/email$/i.test(attributeVariable)) {
          const hyphenized = hyphenize(attributeVariable) as string
          attributeDefaults.push(
            `${attributeVariable}: \`${hyphenized}-${counterVariableIncremented ? '${counter}' : '${++counter}'}@example.com\`,`
          )
        } else {
          attributeDefaults.push(
            `${attributeVariable}: \`${fullyQualifiedModelName} ${attributeVariable} ${counterVariableIncremented ? '${counter}' : '${++counter}'}\`,`
          )
        }
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
      case 'enum[]': {
        // When the user passed `name:enum:enum_type_name` (reuse form, no
        // inline values), descriptors has exactly one element — the enum
        // type name. The factory cannot see the enum's values, so emit a
        // TS-rejecting placeholder rather than the type name itself (the
        // previous behavior emitted `'enum_type_name'` as the literal value,
        // which compiles in the factory but fails at runtime).
        const isReuseWithoutValues = descriptors.length === 1
        const isArrayEnum = safeAttributeType === 'enum[]'
        if (isReuseWithoutValues) {
          const enumTypeName = descriptors[0]
          const placeholder = isArrayEnum ? `['TODO']` : `'TODO'`
          attributeDefaults.push(
            `// TODO: replace with a value from the \`${enumTypeName}\` enum\n    ${attributeVariable}: ${placeholder},`
          )
        } else {
          const firstValue = (descriptors.at(-1) || '<tbd>').split(',')[0]
          const literal = isArrayEnum ? `['${firstValue}']` : `'${firstValue}'`
          attributeDefaults.push(`${attributeVariable}: ${literal},`)
        }
        break
      }

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

      case 'time':
        dreamImports.push('ClockTime')
        attributeDefaults.push(`${attributeVariable}: ClockTime.now(),`)
        break

      case 'time[]':
        dreamImports.push('ClockTime')
        attributeDefaults.push(`${attributeVariable}: [ClockTime.now()],`)
        break

      case 'timetz':
        dreamImports.push('ClockTimeTz')
        attributeDefaults.push(`${attributeVariable}: ClockTimeTz.now(),`)
        break

      case 'timetz[]':
        dreamImports.push('ClockTimeTz')
        attributeDefaults.push(`${attributeVariable}: [ClockTimeTz.now()],`)
        break

      case 'uuid':
        nodeImports.push('randomUUID')
        attributeDefaults.push(`${attributeVariable}: randomUUID(),`)
        break

      case 'uuid[]':
        nodeImports.push('randomUUID')
        attributeDefaults.push(`${attributeVariable}: [randomUUID()],`)
        break

      default:
        if (/\[\]$/.test(attributeType)) {
          attributeDefaults.push(`${attributeVariable}: [],`)
        }
      // noop
    }
  }

  const relativePath = absoluteDreamPath('models', fullyQualifiedModelName)

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
