import generateMigration from '../../../../src/helpers/cli/generateMigration.js'
import type { WriteGeneratedFileArgs } from '../../../../src/helpers/cli/writeGeneratedFile.js'
import * as writeGeneratedFileModule from '../../../../src/helpers/cli/writeGeneratedFile.js'

let writtenFiles: WriteGeneratedFileArgs[]
let spy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  writtenFiles = []
  spy = vi
    .spyOn(writeGeneratedFileModule, 'default')
    // eslint-disable-next-line @typescript-eslint/require-await
    .mockImplementation(async (args: WriteGeneratedFileArgs) => {
      writtenFiles.push(args)
    })
})

function writtenMigration() {
  return writtenFiles[0]!
}

describe('generateMigration', () => {
  context('standalone migration name (no model/STI context)', () => {
    context('-to-<table_name> suffix', () => {
      it('resolves the table name and adds the named columns in up, dropping them in down', async () => {
        await generateMigration({
          migrationName: 'add-phone-to-users',
          columnsWithTypes: ['phone:string'],
          connectionName: 'default',
        })

        expect(spy).toHaveBeenCalledTimes(1)
        const { content } = writtenMigration()
        expect(content).toContain("alterTable('users')")
        expect(content).toMatch(/export async function up[\s\S]*addColumn\('phone', 'varchar\(255\)'/)
        expect(content).toMatch(/export async function down[\s\S]*dropColumn\('phone'\)/)
      })
    })

    context('-from-<table_name> suffix', () => {
      it('resolves the table name identically to -to-', async () => {
        await generateMigration({
          migrationName: 'remove-legacy-fields-from-posts',
          columnsWithTypes: ['legacy_status:string'],
          connectionName: 'default',
        })

        expect(spy).toHaveBeenCalledTimes(1)
        expect(writtenMigration().content).toContain("alterTable('posts')")
      })

      it('inverts the direction: up drops the named columns, down re-adds them with their declared types', async () => {
        await generateMigration({
          migrationName: 'remove-legacy-fields-from-posts',
          columnsWithTypes: ['legacy_status:string'],
          connectionName: 'default',
        })

        const { content } = writtenMigration()
        const [, upBody, downBody] = content.split(
          /export async function (?:up|down)\(db: Kysely<any>\): Promise<void> \{/
        )

        expect(upBody).toContain("dropColumn('legacy_status')")
        expect(upBody).not.toContain('addColumn')

        expect(downBody).toContain("addColumn('legacy_status', 'varchar(255)', col => col.notNull())")
        expect(downBody).not.toContain('dropColumn')
      })

      it('parses columnsWithTypes shorthand the same way -to- does (multiple typed columns)', async () => {
        await generateMigration({
          migrationName: 'remove-legacy-fields-from-posts',
          columnsWithTypes: ['legacy_status:string', 'archived:boolean'],
          connectionName: 'default',
        })

        const { content } = writtenMigration()
        expect(content).toContain("dropColumn('legacy_status')")
        expect(content).toContain("dropColumn('archived')")
        expect(content).toContain("addColumn('legacy_status', 'varchar(255)', col => col.notNull())")
        expect(content).toContain("addColumn('archived', 'boolean', col => col.notNull().defaultTo(false))")
      })
    })

    context('no -to- or -from- suffix match', () => {
      it('falls back to the <table-name> placeholder', async () => {
        await generateMigration({
          migrationName: 'create-unique-index-on-invitations',
          columnsWithTypes: [],
          connectionName: 'default',
        })

        expect(writtenMigration().content).toContain("alterTable('<table-name>')")
      })
    })
  })
})
