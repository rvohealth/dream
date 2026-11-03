import { CliFileWriter } from '../../../../src/cli/CliFileWriter.js'
import KyselyQueryDriver from '../../../../src/dream/QueryDriver/Kysely.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import ASTDbTypesBuilder from '../../../../src/helpers/cli/ASTDbTypesBuilder.js'
import ASTGlobalSchemaBuilder from '../../../../src/helpers/cli/ASTGlobalSchemaBuilder.js'
import ASTSchemaBuilder from '../../../../src/helpers/cli/ASTSchemaBuilder.js'
import ColumnNamesDoNotRoundTrip from '../../../../src/errors/schema-builder/ColumnNamesDoNotRoundTrip.js'
import { IntrospectedColumn, IntrospectedTable } from '../../../../src/types/db.js'
import ModelWithIgnoredColumns from '../../../../test-app/app/models/ModelWithIgnoredColumns.js'

describe('KyselyQueryDriver.sync', () => {
  let revertSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // stub the heavy sync steps, the type file builders, which would
    // otherwise rewrite this repo's own generated type files
    vi.spyOn(ASTDbTypesBuilder.prototype, 'build').mockResolvedValue(undefined)
    vi.spyOn(ASTSchemaBuilder.prototype, 'build').mockResolvedValue(undefined)
    vi.spyOn(ASTGlobalSchemaBuilder.prototype, 'build').mockResolvedValue(undefined)
    revertSpy = vi.spyOn(CliFileWriter, 'revert').mockResolvedValue(undefined)
  })

  context('when sync succeeds', () => {
    it('resolves without reverting generated files', async () => {
      await expect(KyselyQueryDriver.sync('default', () => {})).resolves.toBeUndefined()
      expect(revertSpy).not.toHaveBeenCalled()
    })
  })

  context('when a sync step throws (e.g. the onSync callback)', () => {
    it('reverts generated file contents, then rethrows so CLI commands (psy sync, db:migrate) exit nonzero', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = new Error('sync failure')
      await expect(
        KyselyQueryDriver.sync('default', () => {
          throw error
        })
      ).rejects.toThrow(error)

      expect(revertSpy).toHaveBeenCalledOnce()
    })
  })
})

describe('KyselyQueryDriver.sync reading the connection', () => {
  let introspectSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    introspectSpy = vi
      .spyOn(PostgresQueryDriver, 'introspectDatabase')
      .mockResolvedValue({ tables: [], enums: [] })
    // keep the builders from rewriting this repo's own generated type files
    vi.spyOn(CliFileWriter, 'write').mockResolvedValue(undefined)
    vi.spyOn(ASTGlobalSchemaBuilder.prototype, 'build').mockResolvedValue(undefined)
  })

  it('introspects the connection once, for both of its type files', async () => {
    await KyselyQueryDriver.sync('default', () => {})

    expect(introspectSpy).toHaveBeenCalledExactlyOnceWith('default')
  })

  context('with schemaOnly', () => {
    it('introspects the connection once, for its dream schema file', async () => {
      await KyselyQueryDriver.sync('default', () => {}, { schemaOnly: true })

      expect(introspectSpy).toHaveBeenCalledExactlyOnceWith('default')
    })
  })
})

describe('KyselyQueryDriver.sync over a column whose attribute maps back to another column name', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>
  let revertSpy: ReturnType<typeof vi.spyOn>

  function column(name: string): IntrospectedColumn {
    return {
      name,
      dbType: 'text',
      valueType: 'string',
      enumName: null,
      isArray: false,
      allowNull: true,
      hasDefault: false,
    }
  }

  function table(name: string, columnNames: string[], schema: string = 'public'): IntrospectedTable {
    return { schema, name, inDefaultSchema: schema === 'public', columns: columnNames.map(column) }
  }

  const modelWithIgnoredColumnsColumns = [
    'id',
    'name',
    'user_id',
    'deprecated_column',
    'created_at',
    'updated_at',
  ]

  function introspect(tables: IntrospectedTable[]) {
    vi.spyOn(PostgresQueryDriver, 'introspectDatabase').mockResolvedValue({ tables, enums: [] })
  }

  beforeEach(() => {
    writeSpy = vi.spyOn(CliFileWriter, 'write').mockResolvedValue(undefined)
    revertSpy = vi.spyOn(CliFileWriter, 'revert').mockResolvedValue(undefined)
    vi.spyOn(ASTGlobalSchemaBuilder.prototype, 'build').mockResolvedValue(undefined)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  context('on a table a model is backed by', () => {
    beforeEach(() => {
      introspect([
        table('model_with_ignored_columns', [
          ...modelWithIgnoredColumnsColumns,
          'address_line_1',
          'address_line_2',
        ]),
      ])
    })

    it('fails before writing either type file, naming each column, its attribute, and both remedies', async () => {
      const sync = KyselyQueryDriver.sync('default', () => {})

      await expect(sync).rejects.toThrow(ColumnNamesDoNotRoundTrip)
      await expect(sync).rejects.toThrow(
        'model_with_ignored_columns.address_line_1 (ModelWithIgnoredColumns): its attribute addressLine1 maps back to address_line1'
      )
      await expect(sync).rejects.toThrow(
        'rename model_with_ignored_columns.address_line_2 to address_line2, or add "addressLine2" to the ignoredColumns getter on ModelWithIgnoredColumns'
      )
      expect(writeSpy).not.toHaveBeenCalled()
      expect(revertSpy).toHaveBeenCalledOnce()
    })

    it('fails the schema-only sync too', async () => {
      await expect(KyselyQueryDriver.sync('default', () => {}, { schemaOnly: true })).rejects.toThrow(
        ColumnNamesDoNotRoundTrip
      )
      expect(writeSpy).not.toHaveBeenCalled()
    })

    it('does not claim the column cannot be read', async () => {
      await expect(KyselyQueryDriver.sync('default', () => {})).rejects.toThrow(
        expect.objectContaining({ message: expect.not.stringMatching(/cannot be read/) })
      )
    })

    context('when the model ignores the column’s attribute', () => {
      beforeEach(() => {
        vi.spyOn(ModelWithIgnoredColumns.prototype, 'ignoredColumns', 'get').mockReturnValue([
          'deprecatedColumn',
          'addressLine1',
          'addressLine2',
        ] as unknown as readonly ['deprecatedColumn'])
      })

      it('syncs', async () => {
        await expect(KyselyQueryDriver.sync('default', () => {})).resolves.toBeUndefined()
        expect(writeSpy).toHaveBeenCalled()
      })
    })
  })

  context('on a camelCase column', () => {
    it('fails, naming the snake_case column its attribute maps back to', async () => {
      introspect([table('model_with_ignored_columns', [...modelWithIgnoredColumnsColumns, 'addressLine1'])])

      await expect(KyselyQueryDriver.sync('default', () => {})).rejects.toThrow(
        'model_with_ignored_columns.addressLine1 (ModelWithIgnoredColumns): its attribute addressLine1 maps back to address_line1'
      )
    })
  })

  context('on a table tableExcludePattern leaves out', () => {
    it('syncs', async () => {
      introspect([
        table('model_with_ignored_columns', modelWithIgnoredColumnsColumns),
        table('chalupasdujour_menu', ['id', 'address_line_1']),
      ])

      await expect(KyselyQueryDriver.sync('default', () => {})).resolves.toBeUndefined()
    })
  })

  context('on a table tableIncludePattern leaves out', () => {
    it('syncs', async () => {
      introspect([
        table('model_with_ignored_columns', modelWithIgnoredColumnsColumns),
        table('parts', ['id', 'address_line_1'], 'inventory'),
      ])

      await expect(KyselyQueryDriver.sync('default', () => {})).resolves.toBeUndefined()
    })
  })

  context('on a table no model is backed by', () => {
    it('still fails because no model is backed by the table', async () => {
      introspect([
        table('model_with_ignored_columns', modelWithIgnoredColumnsColumns),
        table('gadgets', ['id', 'address_line_1']),
      ])

      await expect(KyselyQueryDriver.sync('default', () => {})).rejects.toThrow(
        'Could not find a Dream model with table "gadgets"'
      )
    })
  })
})
