export default class DreamApplicationInitMissingMissingProjectRoot extends Error {
  constructor() {
    super()
  }

  public get message() {
    return `
must set app root when initializing a new DreamApplication.

within conf/dream.ts, you must have a call to "#set('projectRoot', pathToAppRoot), i.e.


  // conf/dream.ts
  export default async (app: DreamApplication) => {
    // this should be the absolute path to the "src" folder.
    app.set('projectRoot', path.join(__dirname, '..')
  }
    `
  }
}
