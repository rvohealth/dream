import {
  Kysely,
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  sql,
  UnknownRow,
} from 'kysely'
import DreamMigrationHelpers from '../../../../src/db/migration-helpers/DreamMigrationHelpers.js'
import DropEnumValueRetypeFailed from '../../../../src/errors/DropEnumValueRetypeFailed.js'
import db from '../../../../test-app/db/index.js'

describe('DreamMigrationHelpers.dropEnumValue', () => {
  let _db: Kysely<any>

  beforeEach(async () => {
    _db = db('default', 'primary')
    await _db.schema.createType('temp_enum').asEnum(['a', 'b', 'c']).execute()
  })

  afterEach(async () => {
    await _db.schema.dropType('temp_enum').execute()
  })

  // dropEnumValue always ships inside a migration transaction (runMigration.ts routes it through
  // `newTransaction`), so every failure example runs it through `_db.transaction()` rather than
  // against the autocommitting connection the non-failure examples use. That difference is
  // load-bearing: once a retype fails, Postgres aborts the transaction block, so any catalog query
  // issued after the failure would itself throw `25P02 current transaction is aborted` and bury the
  // error this suite is asserting on.
  async function captureRetypeFailure(
    run: (trx: Kysely<any>) => Promise<void>,
    connection?: Kysely<any>
  ): Promise<DropEnumValueRetypeFailed> {
    let error: unknown

    try {
      await (connection ?? _db).transaction().execute(async trx => {
        await run(trx)
      })
    } catch (err) {
      error = err
    }

    expect(error).toBeInstanceOf(DropEnumValueRetypeFailed)
    return error as DropEnumValueRetypeFailed
  }

  it('removes the value from the enum', async () => {
    await DreamMigrationHelpers.dropEnumValue(_db, {
      enumName: 'temp_enum',
      value: 'c',
      replacements: [],
    })

    const response = await sql`SELECT unnest(enum_range(NULL::temp_enum))`.execute(_db)
    const allEnumValues = response.rows.map(row => (row as any).unnest)
    expect(allEnumValues).toEqual(['a', 'b'])
  })

  context('for a non-array enum field', () => {
    beforeEach(async () => {
      await _db.schema
        .alterTable('pets')
        .addColumn('temporary_enum', sql`temp_enum`)
        .execute()
    })

    afterEach(async () => {
      await _db.schema.alterTable('pets').dropColumn('temporary_enum').execute()
    })

    it('replaces dead value with specified replaceWith', async () => {
      await _db
        .insertInto('pets')
        .values({
          temporary_enum: 'c',
          created_at: '2024-02-02',
        })
        .execute()

      await DreamMigrationHelpers.dropEnumValue(_db, {
        enumName: 'temp_enum',
        value: 'c',
        replacements: [
          {
            table: 'pets',
            column: 'temporary_enum',
            behavior: 'replace',
            replaceWith: 'b',
          },
        ],
      })

      const pet = await _db.selectFrom('pets').selectAll().executeTakeFirst()
      expect(pet!.temporaryEnum).toEqual('b')
    })

    context('null is provided for replaceWith', () => {
      it('nullifies value', async () => {
        await _db
          .insertInto('pets')
          .values({
            temporary_enum: 'c',
            created_at: '2024-02-02',
          })
          .execute()

        await DreamMigrationHelpers.dropEnumValue(_db, {
          enumName: 'temp_enum',
          value: 'c',
          replacements: [
            {
              table: 'pets',
              column: 'temporary_enum',
              replaceWith: null,
            },
          ],
        })

        const pet = await _db.selectFrom('pets').selectAll().executeTakeFirst()
        expect(pet!.temporaryEnum).toBeNull()
      })
    })
  })

  context('within a migration transaction', () => {
    context('for a non-array enum column', () => {
      beforeEach(async () => {
        await _db.schema
          .alterTable('pets')
          .addColumn('temporary_enum', sql`temp_enum`)
          .execute()
      })

      afterEach(async () => {
        await _db.schema.alterTable('pets').dropColumn('temporary_enum').execute()
      })

      it('drops the value without incident when no check constraint blocks the retype', async () => {
        await _db
          .insertInto('pets')
          .values({
            temporary_enum: 'c',
            created_at: '2024-02-02',
          })
          .execute()

        await _db.transaction().execute(async trx => {
          await DreamMigrationHelpers.dropEnumValue(trx, {
            enumName: 'temp_enum',
            value: 'c',
            replacements: [
              {
                table: 'pets',
                column: 'temporary_enum',
                replaceWith: 'b',
              },
            ],
          })
        })

        const pet = await _db.selectFrom('pets').selectAll().executeTakeFirst()
        expect(pet!.temporaryEnum).toEqual('b')
      })

      context('a check constraint on the replacement column references the enum', () => {
        beforeEach(async () => {
          await _db.schema
            .alterTable('pets')
            .addCheckConstraint('temporary_enum_is_not_c_check', sql`temporary_enum <> 'c'`)
            .execute()
        })

        it('raises DropEnumValueRetypeFailed naming the table, the column and the check constraints', async () => {
          const retypeError = await captureRetypeFailure(trx =>
            DreamMigrationHelpers.dropEnumValue(trx, {
              enumName: 'temp_enum',
              value: 'c',
              replacements: [
                {
                  table: 'pets',
                  column: 'temporary_enum',
                  replaceWith: 'b',
                },
              ],
            })
          )

          expect(retypeError.table).toEqual('pets')
          expect(retypeError.column).toEqual('temporary_enum')
          expect(retypeError.retypeDirection).toEqual('toText')
          expect(retypeError.checkConstraints).toEqual([
            { name: 'temporary_enum_is_not_c_check', definition: expect.stringContaining('CHECK') },
          ])

          // the table, the column and the constraint the raw Postgres error names nowhere
          expect(retypeError.message).toContain('pets')
          expect(retypeError.message).toContain('temporary_enum')
          expect(retypeError.message).toContain('temporary_enum_is_not_c_check')
          expect(retypeError.message).toContain('temp_enum')

          // the three outcomes the caller has to choose between
          expect(retypeError.message).toContain('should be dropped and never re-added')
          expect(retypeError.message).toContain('should be re-added exactly as it was')
          expect(retypeError.message).toContain('struck from it')

          // the original Postgres error stays reachable, and readable
          expect(retypeError.originalError.message).toContain('operator does not exist')
          expect(retypeError.cause).toBe(retypeError.originalError)
          expect(retypeError.message).toContain('operator does not exist')
        })

        // `replacements: [r, r]` — the same object at two positions. Bucketing the catalog rows by
        // the replacement object rather than by position collapses both positions onto a single
        // entry and pushes every constraint once per position, which would list the constraint
        // twice and hand the caller the same dropConstraint line twice.
        it('does not duplicate the constraints when the same replacement object is listed twice', async () => {
          const replacement = { table: 'pets', column: 'temporary_enum', replaceWith: 'b' }

          const retypeError = await captureRetypeFailure(trx =>
            DreamMigrationHelpers.dropEnumValue(trx, {
              enumName: 'temp_enum',
              value: 'c',
              replacements: [replacement, replacement],
            })
          )

          expect(retypeError.checkConstraints.map(constraint => constraint.name)).toEqual([
            'temporary_enum_is_not_c_check',
          ])

          const dropCall =
            "await DreamMigrationHelpers.dropConstraint(db, 'temporary_enum_is_not_c_check', { table: 'pets' })"
          expect(retypeError.message.split(dropCall)).toHaveLength(2)
        })

        context('and a second check constraint also references the enum', () => {
          beforeEach(async () => {
            await _db.schema
              .alterTable('pets')
              .addCheckConstraint('temporary_enum_is_not_a_check', sql`temporary_enum <> 'a'`)
              .execute()
          })

          it('offers a dropConstraint call for every constraint that references the enum', async () => {
            const retypeError = await captureRetypeFailure(trx =>
              DreamMigrationHelpers.dropEnumValue(trx, {
                enumName: 'temp_enum',
                value: 'c',
                replacements: [{ table: 'pets', column: 'temporary_enum', replaceWith: 'b' }],
              })
            )

            expect(retypeError.checkConstraints.map(constraint => constraint.name)).toEqual([
              'temporary_enum_is_not_a_check',
              'temporary_enum_is_not_c_check',
            ])

            expect(retypeError.message).toContain(
              "await DreamMigrationHelpers.dropConstraint(db, 'temporary_enum_is_not_a_check', { table: 'pets' })"
            )
            expect(retypeError.message).toContain(
              "await DreamMigrationHelpers.dropConstraint(db, 'temporary_enum_is_not_c_check', { table: 'pets' })"
            )
          })
        })
      })

      // A check constraint is not the only expression the retype re-derives: a partial index's WHERE
      // predicate raises the identical SQLSTATE (42883, verified against Postgres:
      // `CREATE INDEX ... WHERE val <> 'a'` then `ALTER COLUMN val TYPE text` ->
      // `operator does not exist: text <> zz`). The SQLSTATE gate therefore cannot establish that a
      // *check constraint* was the expression that failed, and the message must not say it did.
      context('a partial index predicate, not a check constraint, is what blocks the retype', () => {
        beforeEach(async () => {
          // survives both retypes untouched: `IS NOT NULL` re-derives against text and against the enum
          await _db.schema
            .alterTable('pets')
            .addCheckConstraint('temporary_enum_not_null_check', sql`temporary_enum IS NOT NULL`)
            .execute()

          await sql`CREATE INDEX temporary_enum_partial_index ON pets (id) WHERE temporary_enum <> 'c'`.execute(
            _db
          )
        })

        afterEach(async () => {
          await sql`DROP INDEX IF EXISTS temporary_enum_partial_index`.execute(_db)
        })

        it('does not blame the check constraints it found, and names the other expressions that block a retype', async () => {
          const retypeError = await captureRetypeFailure(trx =>
            DreamMigrationHelpers.dropEnumValue(trx, {
              enumName: 'temp_enum',
              value: 'c',
              replacements: [{ table: 'pets', column: 'temporary_enum', replaceWith: 'b' }],
            })
          )

          // the same SQLSTATE a blocking check constraint raises, from an index predicate instead
          expect(retypeError.retypeDirection).toEqual('toText')
          expect(retypeError.originalError.message).toContain('operator does not exist')
          expect(retypeError.checkConstraints.map(constraint => constraint.name)).toEqual([
            'temporary_enum_not_null_check',
          ])

          // the constraint that is not the blocker is still reported, as context
          expect(retypeError.message).toContain('temporary_enum_not_null_check')

          // ...but never diagnosed as the cause, and never handed over as an unconditional remedy
          expect(retypeError.message).not.toContain('Drop the constraints above before calling dropEnumValue')
          expect(retypeError.message).not.toContain('blocks the\nretype')

          // the actual blocker's category is named, so the caller knows where else to look
          expect(retypeError.message).toContain('a partial index whose WHERE predicate references')
          expect(retypeError.message).toContain('an expression index over')
          expect(retypeError.message).toContain("the column's DEFAULT")

          // and the copy-pasteable remedy survives, explicitly conditional on the constraint being the blocker
          expect(retypeError.message).toContain('If one of the check constraints above is the blocker')
          expect(retypeError.message).toContain(
            "await DreamMigrationHelpers.dropConstraint(db, 'temporary_enum_not_null_check', { table: 'pets' })"
          )
          expect(retypeError.message).toContain('If dropping it changes nothing')
        })

        context('and no check constraint is defined on the column at all', () => {
          beforeEach(async () => {
            await _db.schema.alterTable('pets').dropConstraint('temporary_enum_not_null_check').execute()
          })

          it('still names the expressions that block a retype rather than closing the question', async () => {
            const retypeError = await captureRetypeFailure(trx =>
              DreamMigrationHelpers.dropEnumValue(trx, {
                enumName: 'temp_enum',
                value: 'c',
                replacements: [{ table: 'pets', column: 'temporary_enum', replaceWith: 'b' }],
              })
            )

            expect(retypeError.checkConstraints).toEqual([])
            expect(retypeError.originalError.message).toContain('operator does not exist')

            expect(retypeError.message).toContain('a partial index whose WHERE predicate references')
            expect(retypeError.message).toContain('an expression index over')
            expect(retypeError.message).not.toContain('No check constraints to reconcile.')
            expect(retypeError.message).not.toContain('DreamMigrationHelpers.dropConstraint')
          })
        })
      })

      context('the retype back to the enum fails', () => {
        beforeEach(async () => {
          await _db
            .insertInto('pets')
            .values({
              temporary_enum: 'c',
              created_at: '2024-02-02',
            })
            .execute()
        })

        it('raises DropEnumValueRetypeFailed for the toEnum direction, naming the restore step', async () => {
          const retypeError = await captureRetypeFailure(trx =>
            DreamMigrationHelpers.dropEnumValue(trx, {
              enumName: 'temp_enum',
              value: 'c',
              replacements: [
                {
                  table: 'pets',
                  column: 'temporary_enum',
                  // not a member of the recreated enum, so it is the restore retype that fails
                  replaceWith: 'not_a_member',
                },
              ],
            })
          )

          expect(retypeError.table).toEqual('pets')
          expect(retypeError.column).toEqual('temporary_enum')
          expect(retypeError.retypeDirection).toEqual('toEnum')
          expect(retypeError.message).toContain('restoring temporary_enum to temp_enum')
          expect(retypeError.originalError.message).toContain('invalid input value for enum')
          expect(retypeError.cause).toBe(retypeError.originalError)
        })

        // no check constraint exists on the column here, so the message must say exactly that
        // rather than printing an empty constraint section or constraint-removal guidance
        it('says a check constraint is not what blocked the retype, and offers no dropConstraint', async () => {
          const retypeError = await captureRetypeFailure(trx =>
            DreamMigrationHelpers.dropEnumValue(trx, {
              enumName: 'temp_enum',
              value: 'c',
              replacements: [{ table: 'pets', column: 'temporary_enum', replaceWith: 'not_a_member' }],
            })
          )

          expect(retypeError.checkConstraints).toEqual([])
          expect(retypeError.message).toContain(
            'No check constraint is defined on pets.temporary_enum, so a check constraint is not'
          )
          expect(retypeError.message).toContain('No check constraints to reconcile.')
          expect(retypeError.message).not.toContain('should be dropped and never re-added')
          expect(retypeError.message).not.toContain('DreamMigrationHelpers.dropConstraint')
        })

        // a constraint that survives both retypes unchanged, so it is present in the message but
        // demonstrably not the cause: the failure is `22P02 invalid input value for enum`
        context('a check constraint exists but is not what failed', () => {
          beforeEach(async () => {
            await _db.schema
              .alterTable('pets')
              .addCheckConstraint('temporary_enum_not_null_check', sql`temporary_enum IS NOT NULL`)
              .execute()
          })

          it('lists the constraint as context rather than as the diagnosis, and offers no dropConstraint', async () => {
            const retypeError = await captureRetypeFailure(trx =>
              DreamMigrationHelpers.dropEnumValue(trx, {
                enumName: 'temp_enum',
                value: 'c',
                replacements: [{ table: 'pets', column: 'temporary_enum', replaceWith: 'not_a_member' }],
              })
            )

            expect(retypeError.originalError.message).toContain('invalid input value for enum')
            expect(retypeError.checkConstraints.map(constraint => constraint.name)).toEqual([
              'temporary_enum_not_null_check',
            ])

            // still reported, because it is what was actually found on the column
            expect(retypeError.message).toContain('temporary_enum_not_null_check')

            // ...but not blamed, and not handed over as a copy-pasteable remedy
            expect(retypeError.message).toContain('listed as context rather than as the diagnosis')
            expect(retypeError.message).not.toContain('should be dropped and never re-added')
            expect(retypeError.message).not.toContain('DreamMigrationHelpers.dropConstraint')
          })
        })

        // the classification is on the database error, not on whether the constraint's text
        // happens to mention the enum: this one never names temp_enum and is still the blocker
        context('a check constraint that never names the enum is what blocks the retype', () => {
          beforeEach(async () => {
            await _db.schema
              .alterTable('pets')
              .addCheckConstraint('temporary_enum_length_check', sql`char_length(temporary_enum::text) < 20`)
              .execute()
          })

          it('still gives the constraint guidance', async () => {
            const retypeError = await captureRetypeFailure(trx =>
              DreamMigrationHelpers.dropEnumValue(trx, {
                enumName: 'temp_enum',
                value: 'c',
                replacements: [{ table: 'pets', column: 'temporary_enum', replaceWith: 'b' }],
              })
            )

            expect(retypeError.retypeDirection).toEqual('toEnum')
            expect(retypeError.originalError.message).toContain('char_length')
            expect(retypeError.checkConstraints.map(constraint => constraint.name)).toEqual([
              'temporary_enum_length_check',
            ])
            expect(retypeError.message).toContain('should be dropped and never re-added')
            expect(retypeError.message).toContain(
              "await DreamMigrationHelpers.dropConstraint(db, 'temporary_enum_length_check', { table: 'pets' })"
            )
          })
        })
      })
    })

    context('for an enum array column', () => {
      beforeEach(async () => {
        await _db.schema
          .alterTable('pets')
          .addColumn('temporary_enums', sql`temp_enum[]`)
          .execute()
      })

      afterEach(async () => {
        await _db.schema.alterTable('pets').dropColumn('temporary_enums').execute()
      })

      it('raises DropEnumValueRetypeFailed for the toEnum direction when the array retype fails', async () => {
        await _db
          .insertInto('pets')
          .values({
            temporary_enums: ['a', 'c'],
            created_at: '2024-02-02',
          })
          .execute()

        const retypeError = await captureRetypeFailure(trx =>
          DreamMigrationHelpers.dropEnumValue(trx, {
            enumName: 'temp_enum',
            value: 'c',
            replacements: [
              {
                table: 'pets',
                column: 'temporary_enums',
                array: true,
                behavior: 'replace',
                // not a member of the recreated enum, so it is the restore retype that fails
                replaceWith: 'not_a_member',
              },
            ],
          })
        )

        expect(retypeError.table).toEqual('pets')
        expect(retypeError.column).toEqual('temporary_enums')
        expect(retypeError.retypeDirection).toEqual('toEnum')
        expect(retypeError.message).toContain('restoring temporary_enums to temp_enum')
        expect(retypeError.originalError.message).toContain('invalid input value for enum')
      })
    })

    // Kysely quotes every identifier it emits, so `alterTable('MixedCasePets')` retypes the real
    // "MixedCasePets" relation — but an unquoted `to_regclass('MixedCasePets')` case-folds to
    // `mixedcasepets` and finds nothing, which would make the error assert that no check
    // constraint is defined on a column whose check constraint is exactly what blocked it.
    //
    // This runs against `withoutPlugins()`: the test-app connection carries a CamelCasePlugin,
    // which would rewrite `MixedCasePets` to `mixed_case_pets` before it ever reached Postgres.
    // A migration connection without that plugin is Kysely's default.
    context('the replacement table name is not all lowercase', () => {
      let plainDb: Kysely<any>

      beforeEach(async () => {
        plainDb = _db.withoutPlugins()
        await plainDb.schema
          .createTable('MixedCasePets')
          .addColumn('temporary_enum', sql`temp_enum`)
          .addCheckConstraint('MixedCasePets_temporary_enum_check', sql`temporary_enum <> 'c'`)
          .execute()
      })

      afterEach(async () => {
        await plainDb.schema.dropTable('MixedCasePets').execute()
      })

      it('still reads the check constraints on the table', async () => {
        const retypeError = await captureRetypeFailure(
          trx =>
            DreamMigrationHelpers.dropEnumValue(trx, {
              enumName: 'temp_enum',
              value: 'c',
              replacements: [{ table: 'MixedCasePets', column: 'temporary_enum', replaceWith: 'b' }],
            }),
          plainDb
        )

        expect(retypeError.checkConstraints).toEqual([
          { name: 'MixedCasePets_temporary_enum_check', definition: expect.stringContaining('CHECK') },
        ])
        expect(retypeError.message).toContain('MixedCasePets_temporary_enum_check')
        expect(retypeError.message).not.toContain('No check constraint is defined')
      })
    })

    context('the replacement table cannot be resolved', () => {
      it('says the check constraints could not be read rather than that none are defined', async () => {
        const retypeError = await captureRetypeFailure(trx =>
          DreamMigrationHelpers.dropEnumValue(trx, {
            enumName: 'temp_enum',
            value: 'c',
            replacements: [{ table: 'no_such_table', column: 'temporary_enum', replaceWith: 'b' }],
          })
        )

        expect(retypeError.checkConstraints).toEqual([])
        expect(retypeError.message).toContain(
          'The check constraints on no_such_table.temporary_enum could not be read'
        )
        expect(retypeError.message).not.toContain('No check constraint is defined')
        expect(retypeError.message).not.toContain('DreamMigrationHelpers.dropConstraint')
      })
    })

    // the message getter dereferences originalError.message, so a non-Error throwable that is
    // merely cast to Error turns the whole diagnostic into a TypeError raised from inside the
    // getter — naming nothing, which is the exact failure this error class exists to prevent
    context('the retype rejects with something that is not an Error', () => {
      beforeEach(async () => {
        await _db.schema
          .alterTable('pets')
          .addColumn('temporary_enum', sql`temp_enum`)
          .execute()
      })

      afterEach(async () => {
        await _db.schema.alterTable('pets').dropColumn('temporary_enum').execute()
      })

      it('still renders the full diagnostic, with the throwable normalized to an Error', async () => {
        const retypeError = await captureRetypeFailure(
          trx =>
            DreamMigrationHelpers.dropEnumValue(trx, {
              enumName: 'temp_enum',
              value: 'c',
              replacements: [{ table: 'pets', column: 'temporary_enum', replaceWith: 'b' }],
            }),
          _db.withPlugin(rejectAlterTableWith(undefined))
        )

        expect(retypeError.originalError).toBeInstanceOf(Error)
        expect(retypeError.message).toContain('failed while retyping pets.temporary_enum')
        expect(retypeError.message).toContain('undefined')
      })
    })

    it('reads every replacement column’s check constraints in a single catalog query', async () => {
      const rawStatements: string[] = []
      const instrumented = _db.withPlugin(rawStatementRecorder(rawStatements))
      const columns = ['temp_col_a', 'temp_col_b', 'temp_col_c', 'temp_col_d', 'temp_col_e']

      for (const column of columns) {
        await _db.schema
          .alterTable('pets')
          .addColumn(column, sql`temp_enum`)
          .execute()
      }

      try {
        await instrumented.transaction().execute(async trx => {
          await DreamMigrationHelpers.dropEnumValue(trx, {
            enumName: 'temp_enum',
            value: 'c',
            replacements: columns.map(column => ({ table: 'pets', column, replaceWith: 'b' })),
          })
        })
      } finally {
        for (const column of columns) {
          await _db.schema.alterTable('pets').dropColumn(column).execute()
        }
      }

      expect(rawStatements.filter(statement => statement.includes('pg_constraint'))).toHaveLength(1)
    })
  })

  context('for an enum array field', () => {
    beforeEach(async () => {
      await _db.schema
        .alterTable('pets')
        .addColumn('temporary_enums', sql`temp_enum[]`)
        .execute()
    })

    afterEach(async () => {
      await _db.schema.alterTable('pets').dropColumn('temporary_enums').execute()
    })

    context('behavior=replace', () => {
      it('replaces dead value with specified replaceWith, preserving other values within the enum', async () => {
        await _db
          .insertInto('pets')
          .values([
            {
              temporary_enums: ['a', 'b', 'c', 'c'],
              created_at: '2024-02-02',
            },
            {
              temporary_enums: ['a', 'c'],
              created_at: '2024-02-02',
            },
          ])
          .execute()

        await DreamMigrationHelpers.dropEnumValue(_db, {
          enumName: 'temp_enum',
          value: 'c',
          replacements: [
            {
              table: 'pets',
              column: 'temporary_enums',
              array: true,
              behavior: 'replace',
              replaceWith: 'b',
            },
          ],
        })

        const pet = await _db.selectFrom('pets').selectAll().executeTakeFirst()
        expect(pet!.temporaryEnums).toEqual('{a,b,b,b}')
        const lastPet = await _db.selectFrom('pets').orderBy('id', 'desc').selectAll().executeTakeFirst()
        expect(lastPet!.temporaryEnums).toEqual('{a,b}')
      })
    })

    context('behavior=remove', () => {
      it('removes dead value, preserving other values within the enum', async () => {
        await _db
          .insertInto('pets')
          .values([
            {
              temporary_enums: ['a', 'b', 'c'],
              created_at: '2024-02-02',
            },
            {
              temporary_enums: ['a', 'c'],
              created_at: '2024-02-02',
            },
          ])
          .execute()

        await DreamMigrationHelpers.dropEnumValue(_db, {
          enumName: 'temp_enum',
          value: 'c',
          replacements: [
            {
              table: 'pets',
              column: 'temporary_enums',
              array: true,
              behavior: 'remove',
            },
          ],
        })

        const pet = await _db.selectFrom('pets').selectAll().executeTakeFirst()
        expect(pet!.temporaryEnums).toEqual('{a,b}')
        const lastPet = await _db.selectFrom('pets').orderBy('id', 'desc').selectAll().executeTakeFirst()
        expect(lastPet!.temporaryEnums).toEqual('{a}')
      })
    })
  })
})

/**
 * Makes every `ALTER TABLE` issued through the instrumented Kysely instance reject with
 * `throwable`, which is deliberately allowed to be a non-Error: nothing stops a driver, a
 * plugin or a mock from rejecting with one.
 */
function rejectAlterTableWith(throwable: unknown): KyselyPlugin {
  return {
    transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
      if (args.node.kind === 'AlterTableNode') throw throwable
      return args.node
    },

    transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
      return Promise.resolve(args.result)
    },
  }
}

/**
 * Records the SQL text of every raw (`sql` template) statement the instrumented Kysely instance
 * executes, so a spec can assert how many catalog reads `dropEnumValue` issues.
 */
function rawStatementRecorder(rawStatements: string[]): KyselyPlugin {
  return {
    transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
      const node = args.node as RootOperationNode & { sqlFragments?: readonly string[] }
      if (node.kind === 'RawNode') rawStatements.push((node.sqlFragments ?? []).join('?'))
      return args.node
    },

    transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
      return Promise.resolve(args.result)
    },
  }
}
