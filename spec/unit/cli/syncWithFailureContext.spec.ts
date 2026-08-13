import { Command } from 'commander'
import DreamBin from '../../../src/bin/index.js'
import DreamCLI from '../../../src/cli/index.js'
import syncWithFailureContext from '../../../src/helpers/cli/syncWithFailureContext.js'
import EnvInternal from '../../../src/helpers/EnvInternal.js'

let logged: string[]
let exitSpy: ReturnType<typeof vi.spyOn>

function loggedText() {
  return logged.join('\n')
}

/**
 * Builds the real Dream CLI, with only the boundaries stubbed: the app
 * initializer, the seeder, and the DreamBin calls each command delegates to.
 * Everything between `program.parseAsync` and `DreamBin.sync` is the shipped
 * code path.
 */
function buildCli() {
  const program = new Command()
  program.exitOverride()

  DreamCLI.generateDreamCli(program, {
    // eslint-disable-next-line @typescript-eslint/require-await
    initializeDreamApp: async () => ({}) as any,
    seedDb: () => {},
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

    it('does not seed when the sync fails', async () => {
      vi.spyOn(DreamBin, 'sync').mockRejectedValue(new Error('sync blew up'))
      const seedDb = vi.fn()

      const program = new Command()
      program.exitOverride()
      DreamCLI.generateDreamCli(program, {
        // eslint-disable-next-line @typescript-eslint/require-await
        initializeDreamApp: async () => ({}) as any,
        seedDb,
        onSync: () => {},
      })

      await expect(program.parseAsync(['db:reset'], { from: 'user' })).rejects.toThrow('sync blew up')

      expect(seedDb).not.toHaveBeenCalled()
    })
  })
})
