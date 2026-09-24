import { CliFileWriter } from '../../../src/cli/CliFileWriter.js'
import DreamCLI from '../../../src/cli/index.js'
import syncDbTypesFiles from '../../../src/db/helpers/syncDbTypesFiles.js'
import DreamApp, { type DreamDbConfig } from '../../../src/dream-app/index.js'
import ASTKyselyCodegenEnhancer from '../../../src/helpers/cli/ASTKyselyCodegenEnhancer.js'

describe('syncDbTypesFiles credentials', () => {
  let spawnSpy: ReturnType<typeof vi.spyOn>
  let enhanceSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.spyOn(CliFileWriter, 'cache').mockResolvedValue(undefined)
    spawnSpy = vi.spyOn(DreamCLI, 'spawn').mockResolvedValue(undefined)
    enhanceSpy = vi.spyOn(ASTKyselyCodegenEnhancer.prototype, 'enhance').mockResolvedValue(undefined)
  })

  async function withPassword(
    connectionName: string,
    password: DreamDbConfig['password'],
    run: () => Promise<void>
  ) {
    const app = DreamApp.getOrFail()
    const original = app.dbCredentialsFor(connectionName)!
    app.set('db', connectionName, {
      ...original,
      primary: { ...original.primary, user: 'user:@/ #?', password },
    })

    try {
      await run()
    } finally {
      app.set('db', connectionName, original)
    }
  }

  it('resolves a PostgreSQL provider once without putting the credential in codegen argv', async () => {
    const provider = vi.fn(() => Promise.resolve('token:@/ #?%'))
    await withPassword('default', provider, async () => {
      await syncDbTypesFiles('default')
    })

    expect(provider).toHaveBeenCalledOnce()
    const spawn = spawnSpy
    expect(spawn).toHaveBeenCalledOnce()
    expect(spawn.mock.calls[0]![0]).toBe('kysely-codegen')
    const spawnOpts = spawn.mock.calls[0]![1]!
    expect(spawnOpts.args).toContain('--url=env(DATABASE_URL)')
    expect(spawnOpts.args!.join(' ')).not.toContain('token')
    const url = new URL(spawnOpts.env!.DATABASE_URL)
    expect(decodeURIComponent(url.username)).toBe('user:@/ #?')
    expect(decodeURIComponent(url.password)).toBe('token:@/ #?%')
  })

  it('encodes a static PostgreSQL password for codegen too', async () => {
    await withPassword('default', 'fixed:@/ #?%', async () => {
      await syncDbTypesFiles('default')
    })

    const spawnOpts = spawnSpy.mock.calls[0]![1]!
    expect(spawnOpts.args).toContain('--url=env(DATABASE_URL)')
    expect(spawnOpts.args!.join(' ')).not.toContain('fixed')
    expect(decodeURIComponent(new URL(spawnOpts.env!.DATABASE_URL).password)).toBe('fixed:@/ #?%')
  })

  it('propagates PostgreSQL provider failure without spawning or enhancing', async () => {
    const failure = new Error('token service unavailable')
    const provider = vi.fn(async () => Promise.reject(failure))
    await withPassword('default', provider, async () => {
      await expect(syncDbTypesFiles('default')).rejects.toBe(failure)
    })

    expect(provider).toHaveBeenCalledOnce()
    expect(spawnSpy).not.toHaveBeenCalled()
    expect(enhanceSpy).not.toHaveBeenCalled()
  })

  it('rejects a MySQL provider before invoking it or spawning codegen', async () => {
    const provider = vi.fn(() => Promise.resolve('token'))
    await withPassword('mysql', provider, async () => {
      await expect(syncDbTypesFiles('mysql')).rejects.toThrow('MySQL does not support a password provider')
    })

    expect(provider).not.toHaveBeenCalled()
    expect(spawnSpy).not.toHaveBeenCalled()
    expect(enhanceSpy).not.toHaveBeenCalled()
  })

  it('passes a static MySQL password through to codegen', async () => {
    await withPassword('mysql', 'fixed:@/ #?%', async () => {
      await syncDbTypesFiles('mysql')
    })

    expect(spawnSpy).toHaveBeenCalledOnce()
    const args = spawnSpy.mock.calls[0]![1]!.args!
    expect(args).toContain('--dialect=mysql')
    expect(args).toContain('--url=env(DATABASE_URL)')
    expect(args.join(' ')).not.toContain('fixed')
    expect(decodeURIComponent(new URL(spawnSpy.mock.calls[0]![1]!.env!.DATABASE_URL).password)).toBe(
      'fixed:@/ #?%'
    )
  })

  it('does not include a provider credential in a refused-spawn error', async () => {
    spawnSpy.mockRestore()
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      await withPassword(
        'default',
        () => 'private-rotating-token',
        async () => {
          let error: Error | undefined
          try {
            await syncDbTypesFiles('default')
          } catch (caught) {
            error = caught as Error
          }
          expect(error?.message).toMatch(/DreamCLI\.spawn refused to run outside development or test/)
          expect(error?.message).not.toContain('private-rotating-token')
        }
      )
    } finally {
      process.env.NODE_ENV = originalNodeEnv
    }
  })
})
