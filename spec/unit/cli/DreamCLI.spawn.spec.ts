import DreamCLI from '../../../src/cli/index.js'
import SspawnRequiresDevelopmentOrTest from '../../../src/errors/SspawnRequiresDevelopmentOrTest.js'

describe('DreamCLI.spawn', () => {
  // DreamCLI.spawn runs in argv form (the underlying child_process.spawn is
  // called with shell:false). For backward compatibility it accepts a
  // command string with implicit args (e.g. `'pnpm psy sync'`); the leading
  // token becomes the program and the rest are split out and prepended to
  // any caller-supplied `opts.args` so original argument order is preserved.
  // (R-015)

  describe('backward-compat command splitting', () => {
    it('runs a single-token command with no implicit args', async () => {
      const captured: string[] = []
      await DreamCLI.spawn('echo', {
        args: ['solo'],
        onStdout: txt => captured.push(txt),
      })
      expect(captured.join('')).toBe('solo')
    })

    it('splits implicit args out of a multi-token command', async () => {
      const captured: string[] = []
      await DreamCLI.spawn('echo a b c', {
        onStdout: txt => captured.push(txt),
      })
      expect(captured.join('')).toBe('a b c')
    })

    it('preserves order: implicit args precede caller-supplied opts.args', async () => {
      const captured: string[] = []
      await DreamCLI.spawn('echo first second', {
        args: ['third', 'fourth'],
        onStdout: txt => captured.push(txt),
      })
      expect(captured.join('')).toBe('first second third fourth')
    })

    it('collapses runs of whitespace and ignores leading/trailing whitespace', async () => {
      const captured: string[] = []
      await DreamCLI.spawn('  echo   spaced   out  ', {
        onStdout: txt => captured.push(txt),
      })
      expect(captured.join('')).toBe('spaced out')
    })

    it('treats opts.args alone (no implicit args) the same as direct argv', async () => {
      const captured: string[] = []
      await DreamCLI.spawn('echo', {
        args: ['only', 'caller', 'args'],
        onStdout: txt => captured.push(txt),
      })
      expect(captured.join('')).toBe('only caller args')
    })
  })

  describe('argv form (no shell parsing)', () => {
    it('passes shell meta-characters in an arg literally to the child', async () => {
      // If this ran through a shell, `$(whoami)` would be command-substituted
      // and the node process would print the current username. In argv form
      // the child's `process.argv[2]` is the literal six-character string.
      const captured: string[] = []

      await DreamCLI.spawn(process.execPath, {
        args: ['-e', 'process.stdout.write(process.argv[1])', '$(whoami)'],
        onStdout: txt => captured.push(txt),
      })

      expect(captured.join('')).toBe('$(whoami)')
    })

    it('passes a password-shaped arg containing `$` and backticks literally', async () => {
      const password = 'p@ss$word`with`ticks'
      const captured: string[] = []

      await DreamCLI.spawn(process.execPath, {
        args: ['-e', 'process.stdout.write(process.argv[1])', password],
        onStdout: txt => captured.push(txt),
      })

      expect(captured.join('')).toBe(password)
    })

    it('rejects with a non-zero exit code when the child fails', async () => {
      await expect(DreamCLI.spawn(process.execPath, { args: ['-e', 'process.exit(17)'] })).rejects.toBe(17)
    })
  })

  describe('dev/test-only guard', () => {
    const originalNodeEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv
    })

    it('throws SspawnRequiresDevelopmentOrTest when NODE_ENV=production', async () => {
      process.env.NODE_ENV = 'production'
      await expect(DreamCLI.spawn('echo', { args: ['hi'] })).rejects.toBeInstanceOf(
        SspawnRequiresDevelopmentOrTest
      )
    })

    it('throws SspawnRequiresDevelopmentOrTest when NODE_ENV=staging', async () => {
      process.env.NODE_ENV = 'staging'
      await expect(DreamCLI.spawn('echo', { args: ['hi'] })).rejects.toBeInstanceOf(
        SspawnRequiresDevelopmentOrTest
      )
    })

    it('throws SspawnRequiresDevelopmentOrTest for any non-dev/test env', async () => {
      process.env.NODE_ENV = 'preview'
      await expect(DreamCLI.spawn('echo', { args: ['hi'] })).rejects.toBeInstanceOf(
        SspawnRequiresDevelopmentOrTest
      )
    })
  })
})
