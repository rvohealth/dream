import { Command } from 'commander'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import DreamBin from '../../../src/bin/index.js'
import DreamCLI, { columnsWithTypesDescriptionForStiChild } from '../../../src/cli/index.js'
import DreamApp from '../../../src/dream-app/index.js'

describe('DreamCLI', () => {
  describe('columnsWithTypesDescriptionForStiChild', () => {
    it('advertises that belongs_to is not supported', () => {
      expect(columnsWithTypesDescriptionForStiChild).toContain('belongs_to')
      expect(columnsWithTypesDescriptionForStiChild).toContain('NOT supported for STI children')
      expect(columnsWithTypesDescriptionForStiChild).toContain('declare all BelongsTo')
      expect(columnsWithTypesDescriptionForStiChild).toContain('on the STI parent model instead')
      expect(columnsWithTypesDescriptionForStiChild).not.toContain('User:belongs_to')
    })
  })

  describe('generateDream', () => {
    let projectRoot: string

    // The app's dream paths resolve under this empty temporary project root,
    // so the generator never sees or touches test-app's own files.
    beforeEach(async () => {
      projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dream-cli-spec-'))
      vi.spyOn(DreamApp.getOrFail(), 'projectRoot', 'get').mockReturnValue(projectRoot)
      vi.spyOn(DreamCLI.logger, 'log').mockImplementation(() => {})
      await fs.mkdir(path.join(projectRoot, 'test-app/app/models'), { recursive: true })
      await fs.writeFile(path.join(projectRoot, 'test-app/app/models/Post.ts'), 'hand-edited model')
    })

    afterEach(async () => {
      await fs.rm(projectRoot, { recursive: true, force: true })
    })

    it('refuses to replace an existing model file by default', async () => {
      await expect(
        DreamCLI.generateDream({
          fullyQualifiedModelName: 'Post',
          columnsWithTypes: ['title:string'],
          options: {
            connectionName: 'default',
            serializer: true,
            stiBaseSerializer: false,
            includeAdminSerializers: false,
          },
        })
      ).rejects.toThrow('test-app/app/models/Post.ts')

      expect(await fs.readFile(path.join(projectRoot, 'test-app/app/models/Post.ts'), 'utf8')).toEqual(
        'hand-edited model'
      )
    })

    it("replaces an existing model file when passed existingFiles: 'overwrite'", async () => {
      await DreamCLI.generateDream({
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: ['title:string'],
        options: {
          connectionName: 'default',
          serializer: true,
          stiBaseSerializer: false,
          includeAdminSerializers: false,
          existingFiles: 'overwrite',
        },
      })

      expect(await fs.readFile(path.join(projectRoot, 'test-app/app/models/Post.ts'), 'utf8')).toContain(
        'export default class Post'
      )
    })

    it("keeps an existing model file and writes the missing ones when passed existingFiles: 'skip'", async () => {
      await DreamCLI.generateDream({
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: ['title:string'],
        options: {
          connectionName: 'default',
          serializer: true,
          stiBaseSerializer: false,
          includeAdminSerializers: false,
          existingFiles: 'skip',
        },
      })

      expect(await fs.readFile(path.join(projectRoot, 'test-app/app/models/Post.ts'), 'utf8')).toEqual(
        'hand-edited model'
      )
      expect(
        await fs.readFile(path.join(projectRoot, 'test-app/app/serializers/PostSerializer.ts'), 'utf8')
      ).toContain('PostSerializer')
    })
  })

  describe('g:model', () => {
    it("passes --overwrite and --skip-existing to the generator, and defaults to 'refuse'", async () => {
      const generateDream = vi.spyOn(DreamBin, 'generateDream').mockResolvedValue(undefined)
      vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
      const program = new Command()
      program.exitOverride()
      DreamCLI.generateDreamCli(program, {
        // eslint-disable-next-line @typescript-eslint/require-await
        initializeDreamApp: async () => ({}) as any,
        seedDb: () => {},
        onSync: () => {},
      })

      await program.parseAsync(['g:model', 'Post', 'title:string'], { from: 'user' })
      await program.parseAsync(['g:model', 'Post', 'title:string', '--overwrite'], { from: 'user' })
      await program.parseAsync(['g:model', 'Post', 'title:string', '--skip-existing'], { from: 'user' })

      expect(generateDream.mock.calls.map(call => call[2].existingFiles)).toEqual([
        'refuse',
        'overwrite',
        'skip',
      ])
    })

    it('rejects --skip-existing with --overwrite, naming both, without generating anything', async () => {
      const generateDream = vi.spyOn(DreamBin, 'generateDream').mockResolvedValue(undefined)
      vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
      const program = new Command()
      program.exitOverride()
      program.configureOutput({ writeErr: () => {} })
      DreamCLI.generateDreamCli(program, {
        // eslint-disable-next-line @typescript-eslint/require-await
        initializeDreamApp: async () => ({}) as any,
        seedDb: () => {},
        onSync: () => {},
      })

      await expect(
        program.parseAsync(['g:model', 'Post', 'title:string', '--overwrite', '--skip-existing'], {
          from: 'user',
        })
      ).rejects.toThrow(/--skip-existing.*--overwrite|--overwrite.*--skip-existing/)

      expect(generateDream).not.toHaveBeenCalled()
    })
  })

  describe('g:sti-child', () => {
    it("passes --overwrite and --skip-existing to the generator, and defaults to 'refuse'", async () => {
      const generateStiChild = vi.spyOn(DreamBin, 'generateStiChild').mockResolvedValue(undefined)
      vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
      const program = new Command()
      program.exitOverride()
      DreamCLI.generateDreamCli(program, {
        // eslint-disable-next-line @typescript-eslint/require-await
        initializeDreamApp: async () => ({}) as any,
        seedDb: () => {},
        onSync: () => {},
      })

      await program.parseAsync(['g:sti-child', 'Room/Den', 'extends', 'Room'], { from: 'user' })
      await program.parseAsync(['g:sti-child', 'Room/Den', 'extends', 'Room', '--overwrite'], {
        from: 'user',
      })
      await program.parseAsync(['g:sti-child', 'Room/Den', 'extends', 'Room', '--skip-existing'], {
        from: 'user',
      })

      expect(generateStiChild.mock.calls.map(call => call[3].existingFiles)).toEqual([
        'refuse',
        'overwrite',
        'skip',
      ])
    })

    it('rejects --skip-existing with --overwrite, naming both, without generating anything', async () => {
      const generateStiChild = vi.spyOn(DreamBin, 'generateStiChild').mockResolvedValue(undefined)
      vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
      const program = new Command()
      program.exitOverride()
      program.configureOutput({ writeErr: () => {} })
      DreamCLI.generateDreamCli(program, {
        // eslint-disable-next-line @typescript-eslint/require-await
        initializeDreamApp: async () => ({}) as any,
        seedDb: () => {},
        onSync: () => {},
      })

      await expect(
        program.parseAsync(['g:sti-child', 'Room/Den', 'extends', 'Room', '--skip-existing', '--overwrite'], {
          from: 'user',
        })
      ).rejects.toThrow(/--skip-existing.*--overwrite|--overwrite.*--skip-existing/)

      expect(generateStiChild).not.toHaveBeenCalled()
    })

    it('rejects --connection-name without generating anything', async () => {
      const generateStiChild = vi.spyOn(DreamBin, 'generateStiChild').mockResolvedValue(undefined)
      vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
      const program = new Command()
      program.exitOverride()
      program.configureOutput({ writeErr: () => {} })
      DreamCLI.generateDreamCli(program, {
        // eslint-disable-next-line @typescript-eslint/require-await
        initializeDreamApp: async () => ({}) as any,
        seedDb: () => {},
        onSync: () => {},
      })

      await expect(
        program.parseAsync(['g:sti-child', 'Room/Den', 'extends', 'Room', '--connection-name', 'secondary'], {
          from: 'user',
        })
      ).rejects.toThrow("error: unknown option '--connection-name'")

      expect(generateStiChild).not.toHaveBeenCalled()
    })

    it("passes no connectionName, so the child's migration goes to the parent model's connection", async () => {
      const generateStiChild = vi.spyOn(DreamBin, 'generateStiChild').mockResolvedValue(undefined)
      vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
      const program = new Command()
      program.exitOverride()
      DreamCLI.generateDreamCli(program, {
        // eslint-disable-next-line @typescript-eslint/require-await
        initializeDreamApp: async () => ({}) as any,
        seedDb: () => {},
        onSync: () => {},
      })

      await program.parseAsync(['g:sti-child', 'Room/Den', 'extends', 'Room', 'size:integer'], {
        from: 'user',
      })

      expect(generateStiChild).toHaveBeenCalledWith('Room/Den', 'Room', ['size:integer'], expect.any(Object))
      expect(generateStiChild.mock.calls[0]![3]).not.toHaveProperty('connectionName')
    })
  })
})
