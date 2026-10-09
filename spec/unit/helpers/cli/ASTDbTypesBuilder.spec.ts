import { CliFileWriter } from '../../../../src/cli/CliFileWriter.js'
import DreamApp from '../../../../src/dream-app/index.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import ASTDbTypesBuilder from '../../../../src/helpers/cli/ASTDbTypesBuilder.js'
import { IntrospectedColumn, IntrospectedDatabase } from '../../../../src/types/db.js'

function column(attrs: Partial<IntrospectedColumn> & { name: string }): IntrospectedColumn {
  return {
    dbType: 'text',
    valueType: 'string',
    enumName: null,
    isArray: false,
    allowNull: false,
    hasDefault: false,
    ...attrs,
  }
}

const database: IntrospectedDatabase = {
  tables: [
    {
      schema: 'public',
      name: 'gadgets',
      inDefaultSchema: true,
      columns: [
        column({ name: 'id', dbType: 'bigint', valueType: 'Int8', hasDefault: true }),
        column({
          name: 'colors',
          dbType: 'gadget_colors[]',
          valueType: 'enum',
          enumName: 'gadget_colors',
          isArray: true,
          allowNull: true,
        }),
        column({ name: 'tags', dbType: 'text[]', isArray: true, hasDefault: true }),
        column({
          name: 'opens_at',
          dbType: 'time without time zone',
          valueType: 'ClockTime',
          allowNull: true,
        }),
        column({ name: 'span', dbType: 'interval', valueType: 'Interval', allowNull: true }),
      ],
    },
    {
      schema: 'public',
      name: 'gadget_colors',
      inDefaultSchema: true,
      columns: [column({ name: 'id', dbType: 'bigint', valueType: 'Int8', hasDefault: true })],
    },
    {
      schema: 'public',
      name: 'model_with_ignored_columns',
      inDefaultSchema: true,
      columns: [
        column({ name: 'id', dbType: 'bigint', valueType: 'Int8' }),
        column({ name: 'deprecated_column' }),
      ],
    },
    {
      schema: 'public',
      name: 'chalupasdujour_menu',
      inDefaultSchema: true,
      columns: [column({ name: 'id', dbType: 'bigint', valueType: 'Int8' })],
    },
    {
      schema: 'inventory',
      name: 'parts',
      inDefaultSchema: false,
      columns: [column({ name: 'id', dbType: 'bigint', valueType: 'Int8' })],
    },
  ],
  enums: [
    { name: 'gadget_colors', values: ['red', "o'clock", 'blue'] },
    { name: 'unused_enum', values: ['x'] },
  ],
}

describe('ASTDbTypesBuilder#build', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.spyOn(PostgresQueryDriver, 'introspectDatabase').mockResolvedValue(database)
    writeSpy = vi.spyOn(CliFileWriter, 'write').mockResolvedValue(undefined)
  })

  async function writtenTypes() {
    await new ASTDbTypesBuilder('default').build()
    return (writeSpy.mock.calls[0]![1] as string).replace(/\s+/g, ' ')
  }

  it('writes each enum the tables use as a union of its sorted values, with a const of them', async () => {
    const types = await writtenTypes()

    expect(types).toContain(`export type GadgetColors = 'blue' | "o'clock" | 'red'`)
    expect(types).toContain(`export const GadgetColorsValues = ['blue', "o'clock", 'red'] as const`)
    expect(types).not.toContain('UnusedEnum')
  })

  it('writes each column with its value type, array, null and Generated wrapping', async () => {
    const types = await writtenTypes()

    expect(types).toContain(
      'export interface Gadgets { colors: ArrayType<GadgetColors> | null id: Generated<Int8> opensAt: ClockTime | null span: Interval | null tags: Generated<string[]> }'
    )
  })

  it('declares and imports only the column types the tables use', async () => {
    const types = await writtenTypes()

    expect(types).toContain(
      'export type ArrayType<T> = ArrayTypeImpl<T> extends (infer U)[] ? U[] : ArrayTypeImpl<T>'
    )
    expect(types).toContain('export type Int8 = ColumnType<')
    expect(types).toContain(`import type { IPostgresInterval } from 'postgres-interval'`)
    expect(types).not.toContain('export type Numeric')
    expect(types).not.toContain('export type Timestamp')
    expect(types).not.toContain('export type Json')
  })

  it('gives a table interface whose name an enum already has a numbered name', async () => {
    const types = await writtenTypes()

    expect(types).toContain('export interface GadgetColors2 { id: Generated<Int8> }')
    expect(types).toContain('gadget_colors: GadgetColors2')
  })

  it('leaves out the columns the table’s models ignore', async () => {
    const types = await writtenTypes()

    expect(types).toContain('export interface ModelWithIgnoredColumns { id: Int8 }')
  })

  it('leaves out the tables the connection’s table patterns leave out', async () => {
    const types = await writtenTypes()

    expect(types).not.toContain('chalupasdujour_menu')
    expect(types).not.toContain('inventory.parts')
    expect(types).toContain(
      'export interface DB { gadget_colors: GadgetColors2 gadgets: Gadgets model_with_ignored_columns: ModelWithIgnoredColumns }'
    )
  })

  context('without table patterns', () => {
    it('keys a table outside the default schema by <schema>.<name>', async () => {
      const app = DreamApp.getOrFail()
      const original = app.dbCredentialsFor('default')!
      const withoutPatterns = { ...original }
      delete withoutPatterns.tableIncludePattern
      delete withoutPatterns.tableExcludePattern
      app.set('db', 'default', withoutPatterns)

      try {
        const types = await writtenTypes()
        expect(types).toContain(`'inventory.parts': InventoryParts`)
        expect(types).toContain('chalupasdujour_menu: ChalupasdujourMenu')
      } finally {
        app.set('db', 'default', original)
      }
    })
  })
})
