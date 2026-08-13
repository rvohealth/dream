import { Command } from 'commander'
import DreamBin from '../../../src/bin/index.js'
import DreamCLI from '../../../src/cli/index.js'
import DreamApp from '../../../src/dream-app/index.js'
import syncWithFailureContext from '../../../src/helpers/cli/syncWithFailureContext.js'
import EnvInternal from '../../../src/helpers/EnvInternal.js'

let logged: string[]
let exitSpy: ReturnType<typeof vi.spyOn>
let originalSeedDbInTest: string | undefined

function loggedText() {
  return logged.join('\n')
}

/**
 * Builds the real Dream CLI, with only the boundaries stubbed: the app
 * initializer, the seeder, and the DreamBin calls each command delegates to.
 * Everything between `program.parseAsync` and `DreamBin.sync` is the shipped
 * code path.
 */
function buildCli({ seedDb = () => {} }: { seedDb?: () => Promise<void> | void } = {}) {
  const program = new Command()
  program.exitOverride()

  DreamCLI.generateDreamCli(program, {
    // eslint-disable-next-line @typescript-eslint/require-await
    initializeDreamApp: async () => ({}) as any,
    seedDb,
    onSync: () => {},
  })

  return program
}

beforeEach(() => {
  logged = []
  vi.spyOn(DreamCLI.logger, 'log').mockImplementation((text: string) => {
    logged.push(text)
  })
  exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)

  vi.spyOn(DreamBin, 'dbMigrate').mockResolvedValue(undefined)
  vi.spyOn(DreamBin, 'dbRollback').mockResolvedValue(undefined)
  vi.spyOn(DreamBin, 'dbDrop').mockResolvedValue(undefined)
  vi.spyOn(DreamBin, 'dbCreate').mockResolvedValue(undefined)

  originalSeedDbInTest = process.env.DREAM_SEED_DB_IN_TEST
})

afterEach(() => {
  if (originalSeedDbInTest === undefined) delete process.env.DREAM_SEED_DB_IN_TEST
  else process.env.DREAM_SEED_DB_IN_TEST = originalSeedDbInTest
})

describe('syncWithFailureContext', () => {
  it('runs the sync and logs nothing when it succeeds', async () => {
    const sync = vi.fn().mockResolvedValue(undefined)

    await syncWithFailureContext({ commandName: 'db:rollback', completedWork: 'The rollback ran' }, sync)

    expect(sync).toHaveBeenCalledOnce()
    expect(logged).toEqual([])
  })

  it('re-throws the original error object, untouched', async () => {
    const original = new Error('operator does not exist: text <> room_types_enum')
    let caught: unknown

    try {
      await syncWithFailureContext({ commandName: 'db:rollback', completedWork: 'The rollback ran' }, () =>
        Promise.reject(original)
      )
    } catch (error) {
      caught = error
    }

    expect(caught).toBe(original)
    expect((caught as Error).message).toEqual('operator does not exist: text <> room_types_enum')
  })

  it('never points at a position for the sync error, which the driver has already printed above', async () => {
    await expect(
      syncWithFailureContext(
        { commandName: 'db:migrate', completedWork: 'Every pending migration ran' },
        () => Promise.reject(new Error('boom'))
      )
    ).rejects.toThrow('boom')

    expect(loggedText()).not.toContain('The error below')
    expect(loggedText()).toContain('The sync error itself is printed alongside this message.')
  })

  it('defaults to the always-safe recovery advice, never recommending a re-run of the command', async () => {
    await expect(
      syncWithFailureContext({ commandName: 'db:rollback', completedWork: 'The rollback ran' }, () =>
        Promise.reject(new Error('boom'))
      )
    ).rejects.toThrow('boom')

    expect(loggedText()).toContain('Once it is resolved, run `sync` on its own.')
    expect(loggedText()).not.toContain('re-run `db:rollback`')
  })

  it('renders the recovery advice a caller supplies', async () => {
    await expect(
      syncWithFailureContext(
        {
          commandName: 'db:migrate',
          completedWork: 'Every pending migration ran',
          recoveryAdvice: 're-run `db:migrate`',
        },
        () => Promise.reject(new Error('boom'))
      )
    ).rejects.toThrow('boom')

    expect(loggedText()).toContain('Once it is resolved, re-run `db:migrate`.')
  })

  it('omits the skipped-step clause when nothing was skipped', async () => {
    await expect(
      syncWithFailureContext(
        { commandName: 'db:migrate', completedWork: 'Every pending migration ran' },
        () => Promise.reject(new Error('boom'))
      )
    ).rejects.toThrow('boom')

    expect(loggedText()).toContain(
      'Every pending migration ran. What failed afterward is the sync that db:migrate runs to regenerate the auto-generated type and schema files.'
    )
  })
})

describe('the CLI commands that sync after their own work', () => {
  context('db:rollback', () => {
    it('names the rollback as complete and the sync as the failing step', async () => {
      vi.spyOn(DreamBin, 'sync').mockRejectedValue(new Error('sync blew up'))

      await expect(buildCli().parseAsync(['db:rollback'], { from: 'user' })).rejects.toThrow('sync blew up')

      const message = loggedText()
      expect(message).toContain("db:rollback: the sync step failed — not db:rollback's own work.")
      expect(message).toContain('The rollback completed successfully and is already committed.')
      expect(message).toContain('the sync that db:rollback runs to regenerate')
      expect(message).not.toContain('did not run')
    })

    it('sends the operator to `sync` alone, and explicitly warns off a second rollback', async () => {
      vi.spyOn(DreamBin, 'sync').mockRejectedValue(new Error('sync blew up'))

      await expect(buildCli().parseAsync(['db:rollback'], { from: 'user' })).rejects.toThrow('sync blew up')

      expect(loggedText()).toContain(
        'Once it is resolved, run `sync` on its own. Do not re-run `db:rollback` — the rollback it would perform is a further one, undoing a migration you did not ask to undo.'
      )
      expect(loggedText()).not.toContain('Once it is resolved, re-run `db:rollback`')
    })

    it('does not reach the sync, or the message, when --skip-sync is passed', async () => {
      const sync = vi.spyOn(DreamBin, 'sync').mockRejectedValue(new Error('sync blew up'))

      await buildCli().parseAsync(['db:rollback', '--skip-sync'], { from: 'user' })

      expect(sync).not.toHaveBeenCalled()
      expect(loggedText()).not.toContain('the sync step failed')
    })

    it('logs nothing extra, and exits normally, when the sync succeeds', async () => {
      vi.spyOn(DreamBin, 'sync').mockResolvedValue(undefined)

      await buildCli().parseAsync(['db:rollback'], { from: 'user' })

      expect(loggedText()).not.toContain('the sync step failed')
      expect(exitSpy).toHaveBeenCalled()
    })

    it('leaves the NODE_ENV != test skip path alone', async () => {
      const sync = vi.spyOn(DreamBin, 'sync').mockRejectedValue(new Error('sync blew up'))
      vi.spyOn(EnvInternal, 'isTest', 'get').mockReturnValue(false)

      await buildCli().parseAsync(['db:rollback'], { from: 'user' })

      expect(sync).not.toHaveBeenCalled()
      expect(loggedText()).not.toContain('the sync step failed')
    })
  })

  context('db:migrate', () => {
    it('names the migrations as complete and the sync as the failing step', async () => {
      vi.spyOn(DreamBin, 'sync').mockRejectedValue(new Error('sync blew up'))

      await expect(buildCli().parseAsync(['db:migrate'], { from: 'user' })).rejects.toThrow('sync blew up')

      const message = loggedText()
      expect(message).toContain("db:migrate: the sync step failed — not db:migrate's own work.")
      expect(message).toContain('Every pending migration ran successfully.')
      expect(message).toContain('the sync that db:migrate runs to regenerate')
      expect(message).not.toContain('did not run')
    })

    it('says re-running db:migrate is safe, because the applied migrations make it a no-op', async () => {
      vi.spyOn(DreamBin, 'sync').mockRejectedValue(new Error('sync blew up'))

      await expect(buildCli().parseAsync(['db:migrate'], { from: 'user' })).rejects.toThrow('sync blew up')

      expect(loggedText()).toContain(
        'Once it is resolved, run `sync` on its own, or re-run `db:migrate` — the migrations it already applied are not re-applied, so it goes straight back to the sync.'
      )
    })
  })

  context('db:reset', () => {
    it('names drop, create and migrate as complete, and says seeding did not run', async () => {
      vi.spyOn(DreamBin, 'sync').mockRejectedValue(new Error('sync blew up'))

      await expect(buildCli().parseAsync(['db:reset'], { from: 'user' })).rejects.toThrow('sync blew up')

      const message = loggedText()
      expect(message).toContain("db:reset: the sync step failed — not db:reset's own work.")
      expect(message).toContain('db:drop, db:create and db:migrate all completed successfully.')
      expect(message).toContain('db:seed, which db:reset runs after the sync, did not run.')
      // db:reset's sync is a middle step, so the message must never claim the
      // reset as a whole completed
      expect(message).not.toContain('db:reset completed')
    })

    it('offers a re-run of db:reset and a `sync`-then-seed route, naming DREAM_SEED_DB_IN_TEST on the second', async () => {
      vi.spyOn(DreamBin, 'sync').mockRejectedValue(new Error('sync blew up'))

      await expect(buildCli().parseAsync(['db:reset'], { from: 'user' })).rejects.toThrow('sync blew up')

      expect(loggedText()).toContain(
        'Once it is resolved, re-run `db:reset`, which seeds directly and so picks up the skipped seeding step, or run `sync` on its own followed by `DREAM_SEED_DB_IN_TEST=1 db:seed` — this sync only runs under `NODE_ENV=test`, and a bare `db:seed` does not seed there.'
      )
    })

    it('never sends the operator to a bare `db:seed`, which does not seed under NODE_ENV=test', async () => {
      vi.spyOn(DreamBin, 'sync').mockRejectedValue(new Error('sync blew up'))

      await expect(buildCli().parseAsync(['db:reset'], { from: 'user' })).rejects.toThrow('sync blew up')

      expect(loggedText()).not.toContain('followed by `db:seed`')
    })

    it('does not seed when the sync fails', async () => {
      vi.spyOn(DreamBin, 'sync').mockRejectedValue(new Error('sync blew up'))
      const seedDb = vi.fn()

      await expect(buildCli({ seedDb }).parseAsync(['db:reset'], { from: 'user' })).rejects.toThrow(
        'sync blew up'
      )

      expect(seedDb).not.toHaveBeenCalled()
    })

    /**
     * The recovery advice offers two routes. These run both of them through the
     * real CLI, so the advice is checked against what the commands actually do
     * rather than against itself. `NODE_ENV` is already `test` here, which is
     * the only environment the sync — and therefore this advice — runs in.
     */
    context('the recovery routes, actually taken', () => {
      it('route 1: re-running `db:reset` seeds, because db:reset calls the seed hook directly', async () => {
        vi.spyOn(DreamBin, 'sync').mockResolvedValue(undefined)
        const seedDb = vi.fn()

        await buildCli({ seedDb }).parseAsync(['db:reset'], { from: 'user' })

        expect(seedDb).toHaveBeenCalledOnce()
      })

      it('route 2: a bare `db:seed` does not seed, so the advice may not offer it unqualified', async () => {
        const appLogSpy = vi.spyOn(DreamApp, 'log').mockImplementation(() => {})
        const seedDb = vi.fn()
        delete process.env.DREAM_SEED_DB_IN_TEST

        await buildCli({ seedDb }).parseAsync(['db:seed'], { from: 'user' })

        expect(seedDb).not.toHaveBeenCalled()
        expect(appLogSpy).toHaveBeenCalledWith(
          'skipping db seed for test env. To really seed for test, add DREAM_SEED_DB_IN_TEST=1'
        )
      })

      it('route 2: `db:seed` seeds once DREAM_SEED_DB_IN_TEST=1 is set, which is the form the advice names', async () => {
        const seedDb = vi.fn()
        process.env.DREAM_SEED_DB_IN_TEST = '1'

        await buildCli({ seedDb }).parseAsync(['db:seed'], { from: 'user' })

        expect(seedDb).toHaveBeenCalledOnce()
      })
    })
  })
})
