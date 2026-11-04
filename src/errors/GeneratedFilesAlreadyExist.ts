export interface GeneratedFilesAlreadyExistFlags {
  overwrite: string
  skip: string
}

export default class GeneratedFilesAlreadyExist extends Error {
  public modelName: string
  public existingFiles: string[]
  public existingMigrations: string[]
  public flags: GeneratedFilesAlreadyExistFlags | undefined

  /**
   * @param modelName - the fully qualified model name the generator was invoked with
   * @param existingFiles - project-relative paths of the model, spec, factory and serializer files that already exist
   * @param existingMigrations - project-relative paths of existing migrations with the name the generator would give the model's migration
   * @param flags - the caller's flags for overwriting and for skipping existing files; when omitted, the message names Dream's `--overwrite` and `--skip-existing` and the commands that accept them
   */
  constructor(
    modelName: string,
    existingFiles: string[],
    existingMigrations: string[],
    flags?: GeneratedFilesAlreadyExistFlags
  ) {
    super()
    this.modelName = modelName
    this.existingFiles = existingFiles
    this.existingMigrations = existingMigrations
    this.flags = flags
  }

  public override get message() {
    const { overwrite, skip } = this.flags ?? { overwrite: '--overwrite', skip: '--skip-existing' }
    const commandsNote = this.flags ? '' : ' g:model and g:sti-child accept both.'
    const listing = [...this.existingFiles, ...this.existingMigrations].map(file => `  ${file}`).join('\n')
    const migrationNote = this.existingMigrations.length
      ? `
The existing migration is kept even with ${overwrite}, and no second one is
written, since it may already have run. Edit it by hand if the columns changed.
`
      : ''

    return `
Refusing to generate ${this.modelName}, because these files already exist:
${listing}

Nothing was written. To replace the model, spec, factory and serializer files,
re-run with ${overwrite}. To keep the existing files and write only the missing
ones, re-run with ${skip}.${commandsNote}
${migrationNote}`
  }
}
