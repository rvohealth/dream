import pascalize from '../../../src/helpers/pascalize'

const typeCoersions = {
  citext: 'Sequelize.CITEXT',
  date: 'Sequelize.DATEONLY',
  datetime: 'Sequelize.DATE',
  string: 'Sequelize.STRING',
  timestamp: 'Sequelize.DATE',
}

export default function generateMigrationString(
  migrationName: string,
  timestamp: number,
  {
    table,
    attributes = [],
    useUUID = false,
  }: {
    table?: string
    attributes?: string[]
    useUUID?: boolean
  } = {}
) {
  let requireCitextExtension = false
  const sequelizeColumnDefs = attributes
    .map(attribute => {
      const [attributeName, attributeType, ...descriptors] = attribute.split(':')
      if (['has_one', 'has_many'].includes(attributeType)) return null
      if (attributeType === 'belongs_to')
        return generateBelongsToStr(attributeName, attributeType, descriptors, { useUUID })
      else if (attributeType === 'citext') requireCitextExtension = true

      return generateColumnStr(attributeName, attributeType, descriptors, { useUUID })
    })
    .filter(str => str !== null)

  if (!table) {
    return `\
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryinterface, Sequelize) {
  },

  async down(queryinterface, Sequelize) {
  }
}\
`
  }

  const uuidExtension = useUUID
    ? `await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')\n    `
    : ''

  const citextExtension = requireCitextExtension
    ? `await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "citext";')\n    `
    : ''

  return `\
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    ${uuidExtension}${citextExtension}await queryInterface.createTable('${table}', {
      id: {
${generateIdFields({ useUUID })}
      },${!!sequelizeColumnDefs.length ? '\n' + sequelizeColumnDefs.join('\n') : ''}
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('${table}')
  }
}\
`
}

function generateColumnStr(
  attributeName: string,
  attributeType: string,
  descriptors: string[],
  { useUUID }: { useUUID?: boolean }
) {
  let returnStr = `\
      '${attributeName}': {
        type: ${(typeCoersions as any)[attributeType] || `'${attributeType}'`},`

  const providedDefaultArg = descriptors.find(d => /^default\(/.test(d))
  const providedDefault = providedDefaultArg?.replace(/^default\(/, '')?.replace(/\)$/, '')

  if (descriptors.includes('primary'))
    returnStr += `\
        primaryKey: true,
`

  if (providedDefault)
    returnStr += `\
        defaultValue: ${providedDefault},
`
  // TODO: handle index

  return (
    returnStr +
    `
      },`
  )
}

function generateBelongsToStr(
  attributeName: string,
  attributeType: string,
  descriptors: string[],
  { useUUID }: { useUUID: boolean }
) {
  const dataType = `${useUUID ? 'UUID' : 'INTEGER'}`
  let returnStr = `\
      '${attributeName}_id': {
        type: Sequelize.DataTypes.${dataType},
      },`
  return returnStr
}

function generateIdFields({ useUUID }: { useUUID: boolean }) {
  if (useUUID)
    return `\
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        type: Sequelize.DataTypes.UUID,`

  return `\
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.DataTypes.INTEGER,`
}
