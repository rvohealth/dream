import { CliFileWriter } from '../../../../src/cli/CliFileWriter.js'
import KyselyQueryDriver from '../../../../src/dream/QueryDriver/Kysely.js'
import PostgresQueryDriver from '../../../../src/dream/QueryDriver/Postgres.js'
import ASTDbTypesBuilder from '../../../../src/helpers/cli/ASTDbTypesBuilder.js'
import ASTGlobalSchemaBuilder from '../../../../src/helpers/cli/ASTGlobalSchemaBuilder.js'
import ASTSchemaBuilder from '../../../../src/helpers/cli/ASTSchemaBuilder.js'

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
