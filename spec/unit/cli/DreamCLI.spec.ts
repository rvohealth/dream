import { Command } from 'commander'
import DreamBin from '../../../src/bin/index.js'
import DreamCLI, { columnsWithTypesDescriptionForStiChild } from '../../../src/cli/index.js'

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

  describe('g:sti-child', () => {
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
