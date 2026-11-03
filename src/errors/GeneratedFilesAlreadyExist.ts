export default class GeneratedFilesAlreadyExist extends Error {
  public modelName: string
  public existingFiles: string[]
  public existingMigrations: string[]

  /**
   * @param modelName - the fully qualified model name the generator was invoked with
   * @param existingFiles - project-relative paths of the model, spec, factory and serializer files that already exist
   * @param existingMigrations - project-relative paths of existing migrations with the name the generator would give the model's migration
   */
  constructor(modelName: string, existingFiles: string[], existingMigrations: string[]) {
    super()
    this.modelName = modelName
    this.existingFiles = existingFiles
    this.existingMigrations = existingMigrations
  }

  public override get message() {
    const listing = [...this.existingFiles, ...this.existingMigrations].map(file => `  ${file}`).join('\n')
    const migrationNote = this.existingMigrations.length
      ? `
The existing migration is kept even with --overwrite, and no second one is
written, since it may already have run. Edit it by hand if the columns changed.
`
      : ''

    return `
Refusing to generate ${this.modelName}, because these files already exist:
${listing}

Nothing was written. To replace the model, spec, factory and serializer files,
re-run with --overwrite (g:model and g:sti-child accept it).
${migrationNote}`
  }
}
