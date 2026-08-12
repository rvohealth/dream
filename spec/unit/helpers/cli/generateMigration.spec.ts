import { migrationNameArgumentDescription } from '../../../../src/cli/index.js'
import InvalidMigrationTableName from '../../../../src/errors/InvalidMigrationTableName.js'
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

/**
 * Reads a migration name out of the `g:migration` <migrationName> help text:
 * the first word of the example line whose trailing comment starts with
 * `commentMarker` (e.g. '# WRONG:'). Derived from the help text rather than
 * hard-coded so that the generator is exercised with whatever example the help
 * currently prints, and throws when that example line is gone.
 */
function helpExampleMigrationName(commentMarker: string): string {
  const exampleLine = migrationNameArgumentDescription
    .split('\n')
    .find(candidate => candidate.includes(commentMarker))

  if (!exampleLine)
    throw new Error(
      `no '${commentMarker}' example line in the g:migration <migrationName> help text; ` +
        'update this spec together with src/cli/index.ts'
    )

  return exampleLine.trim().split(/\s+/)[0]!
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
      // it. Every standalone migration name generates in alter mode; what a
      // -to-/-from- anywhere in the name changes is which concrete table is
      // altered and in which direction, and altering a concrete table with no
      // columns errors and writes nothing. The error has to say so: naming
      // only the resolved table (a table the user never typed, and which need
      // not exist) sends them off inventing a bogus column on it.
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
        // A both-marker name, so the corpus is not exclusively single-marker:
        // see the precedence spec below for why this one resolves via '-to-'.
        {
          migrationName: 'migrate-notifications-from-inbox-to-archive',
          marker: '-to-',
          table: 'archives',
          verb: 'add to',
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

      // PINNED CURRENT BEHAVIOR: '-to-' is searched across the whole name
      // before '-from-' is considered at all, so a name containing both
      // resolves via '-to-' even when the '-from-' appears earlier. Position
      // does not break the tie, and this is the one name shape that falsifies
      // a "the first marker anywhere in the name wins" phrasing — so the
      // error message's wording, and the matching wording in the g:migration
      // --help text, are pinned here against exactly that shape.
      it("resolves a both-marker name via '-to-', not via the earlier '-from-'", async () => {
        const { message } = await migrationError('migrate-notifications-from-inbox-to-archive')

        expect(message).toContain("no valid columns to add to table 'archives'")
        expect(message).toContain("'migrate-notifications-from-inbox-to-archive' contains '-to-'")
        expect(message).not.toContain('inboxes')
        expect(message).not.toContain('drop from')
      })
    })

    context('the --help counter-example pair', () => {
      // The names run through the generator here are read out of the
      // `g:migration` <migrationName> help text itself, so editing that help
      // block to a different (or reverted) example runs *that* example through
      // the generator: a help example that stops matching what the generator
      // produces fails here rather than shipping.
      const wrongExample = helpExampleMigrationName('# WRONG:')
      const correctedExample = helpExampleMigrationName('# correct:')

      context(`${wrongExample} (the WRONG line)`, () => {
        it("errors rather than scaffolding, because -to- inside 'many-to-many' selects alterTable('many_posts_users')", async () => {
          const error = await migrationError(wrongExample)

          expect(error).toBeInstanceOf(NoColumnsToAlterMigration)
          expect(error.message).toContain("no valid columns to add to table 'many_posts_users'")
          expect(spy).not.toHaveBeenCalled()
        })
      })

      context(`${correctedExample} (the corrected line)`, () => {
        it("matches no marker, and scaffolds alterTable('<table-name>') to hand-edit", async () => {
          await generateMigration({
            migrationName: correctedExample,
            columnsWithTypes: [],
            connectionName: 'default',
          })

          expect(spy).toHaveBeenCalledTimes(1)
          expect(writtenMigration().content).toContain("alterTable('<table-name>')")
        })
      })
    })

    context('a migration name whose derived table name is not a plain identifier', () => {
      // The derived table name is interpolated into a single-quoted string
      // literal in the generated migration, and `psy db:migrate` later
      // executes that file. A quote in the migration name would otherwise
      // close the literal and inject statements, so the derived name is
      // validated and the generator fails closed.
      const injectingName = "add-foo-to-users');await db.schema.dropTable('users"

      it('throws InvalidMigrationTableName and writes no file', async () => {
        let error: unknown

        try {
          await generateMigration({
            migrationName: injectingName,
            columnsWithTypes: ['foo:string'],
            connectionName: 'default',
          })
        } catch (err) {
          error = err
        }

        expect(error).toBeInstanceOf(InvalidMigrationTableName)
        expect(spy).not.toHaveBeenCalled()
      })

      it('names the offending migration name in the message', async () => {
        let error: InvalidMigrationTableName | undefined

        try {
          await generateMigration({
            migrationName: injectingName,
            columnsWithTypes: ['foo:string'],
            connectionName: 'default',
          })
        } catch (err) {
          error = err as InvalidMigrationTableName
        }

        expect(error!.message).toContain(injectingName)
      })

      it('still generates for an ordinary migration name', async () => {
        await generateMigration({
          migrationName: 'add-phone-to-host-listings',
          columnsWithTypes: ['phone:string'],
          connectionName: 'default',
        })

        expect(spy).toHaveBeenCalledTimes(1)
        expect(writtenMigration().content).toContain("alterTable('host_listings')")
      })

      it('still generates when the derived table name starts with a digit', async () => {
        // Kysely quotes the identifier, so alterTable('2fa_tokens') is valid;
        // the guard blocks characters that could escape the generated string
        // literal, not identifiers a database convention would frown on.
        await generateMigration({
          migrationName: 'add-x-to-2fa-tokens',
          columnsWithTypes: ['x:string'],
          connectionName: 'default',
        })

        expect(spy).toHaveBeenCalledTimes(1)
        expect(writtenMigration().content).toContain("alterTable('2fa_tokens')")
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

  context('a model-context migration (g:model / g:resource)', () => {
    // The same unescaped interpolation is reached by the table name of a model
    // migration, from either of two sources: `--table-name` verbatim, or the
    // name derived from the fully qualified model name. Both are validated.
    const injectingValue = "users');await db.schema.dropTable('users"

    context('an explicit --table-name that is not a plain identifier', () => {
      it('throws InvalidMigrationTableName, naming it, and writes no file', async () => {
        let error: InvalidMigrationTableName | undefined

        try {
          await generateMigration({
            migrationName: 'CreateFoo',
            columnsWithTypes: ['name:string'],
            connectionName: 'default',
            fullyQualifiedModelName: 'Foo',
            tableName: injectingValue,
          })
        } catch (err) {
          error = err as InvalidMigrationTableName
        }

        expect(error).toBeInstanceOf(InvalidMigrationTableName)
        expect(error!.message).toContain(injectingValue)
        expect(spy).not.toHaveBeenCalled()
      })

      it('still generates for an ordinary explicit table name', async () => {
        await generateMigration({
          migrationName: 'CreateSettings/NotificationPreference',
          columnsWithTypes: ['name:string'],
          connectionName: 'default',
          fullyQualifiedModelName: 'Settings/NotificationPreference',
          tableName: 'notif_prefs',
        })

        expect(spy).toHaveBeenCalledTimes(1)
        expect(writtenMigration().content).toContain("createTable('notif_prefs')")
      })
    })

    context('a model name whose derived table name is not a plain identifier', () => {
      it('throws InvalidMigrationTableName and writes no file', async () => {
        let error: unknown

        try {
          await generateMigration({
            migrationName: 'CreateFoo',
            columnsWithTypes: ['name:string'],
            connectionName: 'default',
            fullyQualifiedModelName: `Foo${injectingValue}`,
          })
        } catch (err) {
          error = err
        }

        expect(error).toBeInstanceOf(InvalidMigrationTableName)
        expect(spy).not.toHaveBeenCalled()
      })

      it('still generates for an ordinary model name', async () => {
        await generateMigration({
          migrationName: 'CreateSettings/NotificationPreference',
          columnsWithTypes: ['name:string'],
          connectionName: 'default',
          fullyQualifiedModelName: 'Settings/NotificationPreference',
        })

        expect(spy).toHaveBeenCalledTimes(1)
        expect(writtenMigration().content).toContain("createTable('settings_notification_preferences')")
      })
    })
  })
})

describe('NoColumnsToAlterMigration', () => {
  context('constructed without a migration name or marker', () => {
    // No in-repo path reaches this branch: generateMigration always supplies
    // a migrationName on the standalone path and an stiChildClassName on the
    // STI path (and the throw is gated on !stiChildClassName). The degraded
    // wording exists for direct library callers of generateMigrationContent /
    // generateStiMigrationContent, which may omit both, and is asserted here
    // by constructing the error directly.
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
