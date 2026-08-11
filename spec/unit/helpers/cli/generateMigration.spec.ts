import NoColumnsToAlterMigration from '../../../../src/errors/NoColumnsToAlterMigration.js'
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

/**
 * Runs generateMigration with no columns and returns the error it threw. Kept
 * separate from `writtenMigration` on purpose: these paths write no file at
 * all, and `writtenMigration` would non-null-assert an empty array.
 */
async function migrationError(migrationName: string): Promise<NoColumnsToAlterMigration> {
  try {
    await generateMigration({
      migrationName,
      columnsWithTypes: [],
      connectionName: 'default',
    })
  } catch (error) {
    return error as NoColumnsToAlterMigration
  }

  throw new Error(`expected generateMigration('${migrationName}') to throw, but it resolved`)
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

    context('a migration name matching both -to- and -from- suffixes', () => {
      // PINNED CURRENT BEHAVIOR: generateMigration checks -to- first and only
      // falls back to -from- when there's no -to- match (see
      // src/helpers/cli/generateMigration.ts). A name containing both
      // suffixes therefore silently resolves to the -to- table with add
      // semantics, discarding the -from- table/intent entirely. This spec
      // exists so a future change to that precedence can't happen silently —
      // if this starts failing, the resolution order changed and the
      // implications (for existing -from- migration names that happen to
      // also match -to-) need to be considered deliberately.
      it('resolves to the -to- table with add semantics, ignoring the -from- table', async () => {
        await generateMigration({
          migrationName: 'migrate-notifications-from-inbox-to-archive',
          columnsWithTypes: ['moved_at:datetime'],
          connectionName: 'default',
        })

        const { content } = writtenMigration()
        expect(content).toContain("alterTable('archives')")
        expect(content).not.toContain("alterTable('inboxes')")

        const [, upBody, downBody] = content.split(
          /export async function (?:up|down)\(db: Kysely<any>\): Promise<void> \{/
        )
        expect(upBody).toContain("addColumn('moved_at', 'timestamp'")
        expect(upBody).not.toContain('dropColumn')
        expect(downBody).toContain("dropColumn('moved_at')")
        expect(downBody).not.toContain('addColumn')
      })
    })

    context('a marker matched, but no columns were passed', () => {
      // Each of these reads as a hand-written migration to the person typing
      // it, but the FIRST -to-/-from- anywhere in the name silently selects
      // alter mode, so it errors and writes nothing. The error has to say so:
      // naming only the resolved table (a table the user never typed, and
      // which need not exist) sends them off inventing a bogus column on it.
      const cases = [
        {
          migrationName: 'rename-host-places-to-host-listings',
          marker: '-to-',
          table: 'host_listings',
          verb: 'add to',
        },
        {
          migrationName: 'add-treehouse-to-place-styles',
          marker: '-to-',
          table: 'place_styles',
          verb: 'add to',
        },
        {
          migrationName: 'replace-lean-to-with-treehouse',
          marker: '-to-',
          table: 'with_treehouses',
          verb: 'add to',
        },
        {
          migrationName: 'remove-badge-from-user-profiles',
          marker: '-from-',
          table: 'user_profiles',
          verb: 'drop from',
        },
      ]

      for (const { migrationName, marker, table, verb } of cases) {
        context(migrationName, () => {
          it('throws NoColumnsToAlterMigration, naming the migration name, the marker and the resolved table, and writes no file', async () => {
            const error = await migrationError(migrationName)

            expect(error).toBeInstanceOf(NoColumnsToAlterMigration)
            expect(error.message).toContain(`no valid columns to ${verb} table '${table}'`)
            expect(error.message).toContain(`'${migrationName}' contains '${marker}'`)
            expect(spy).not.toHaveBeenCalled()
          })

          it('offers both remedies, the rename one naming both markers', async () => {
            const { message } = await migrationError(migrationName)

            expect(message).toContain('pass at least one column declaration with a resolvable type')
            expect(message).toMatch(
              /rename it so that\s+neither '-to-' nor '-from-' appears anywhere in the name/
            )
          })
        })
      }
    })

    context('the --help counter-example pair', () => {
      // Pins the two example lines in the `generate:migration` help block in
      // src/cli/index.ts. If either of these starts failing, the help text is
      // making a claim the generator no longer honors.
      context('create-many-to-many-posts-users (the WRONG line)', () => {
        it("errors rather than scaffolding, because -to- inside 'many-to-many' selects alterTable('many_posts_users')", async () => {
          const error = await migrationError('create-many-to-many-posts-users')

          expect(error).toBeInstanceOf(NoColumnsToAlterMigration)
          expect(error.message).toContain("no valid columns to add to table 'many_posts_users'")
          expect(spy).not.toHaveBeenCalled()
        })
      })

      context('create-posts-users-join-table (the corrected line)', () => {
        it("matches no marker, and scaffolds alterTable('<table-name>') to hand-edit", async () => {
          await generateMigration({
            migrationName: 'create-posts-users-join-table',
            columnsWithTypes: [],
            connectionName: 'default',
          })

          expect(spy).toHaveBeenCalledTimes(1)
          expect(writtenMigration().content).toContain("alterTable('<table-name>')")
        })
      })
    })

    context('a marker spelled with an underscore', () => {
      // PINNED CURRENT BEHAVIOR: `lean_to` does not contain the literal
      // '-to-', so the name evades alter mode — but hyphenize (which
      // camelizes, then snakeifies, then swaps _ for -) normalizes the
      // underscore away when building the filename. The migration on disk
      // therefore carries the trap's spelling while the command that produced
      // it did not, so grepping the migrations directory for '-to-' finds a
      // file whose name never matched. Recorded so a future change to either
      // half can't drift them apart silently.
      it('generates a placeholder migration whose filename is nonetheless spelled -to-', async () => {
        await generateMigration({
          migrationName: 'replace-lean_to-with-treehouse',
          columnsWithTypes: [],
          connectionName: 'default',
        })

        expect(spy).toHaveBeenCalledTimes(1)
        const { fileName, content } = writtenMigration()
        // the numeric prefix is `new Date().getTime()`, so only the hyphenized
        // tail of the filename is asserted
        expect(fileName).toMatch(/^\d+-replace-lean-to-with-treehouse\.ts$/)
        expect(content).toContain("alterTable('<table-name>')")
      })
    })
  })
})

describe('NoColumnsToAlterMigration', () => {
  context('constructed without a migration name or marker', () => {
    // Reachable, not hypothetical: generateStiMigrationContent forwards
    // createOrAlter: 'alter' with an optional stiChildClassName, and
    // spec/unit/cli/generateStiMigrationContent.spec.ts already calls it
    // without one.
    it('degrades to the table-only wording and mentions neither marker', () => {
      const error = new NoColumnsToAlterMigration('users', 'add')

      expect(error.message).toEqual(
        [
          '',
          "no valid columns to add to table 'users' in this alter migration.",
          '',
          'Pass at least one column declaration with a resolvable type, e.g.:',
          '  name:string',
          '    ',
        ].join('\n')
      )
      expect(error.message).not.toContain('-to-')
      expect(error.message).not.toContain('-from-')
    })

    it("still inverts the verb for a '-from-' migration", () => {
      const error = new NoColumnsToAlterMigration('users', 'remove')

      expect(error.message).toContain("no valid columns to drop from table 'users'")
      expect(error.message).not.toContain('-from-')
    })
  })
})
