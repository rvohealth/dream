export default class DreamApplicationInitMissingMissingAppRoot extends Error {
  constructor() {
    super()
  }

  public get message() {
    return `
must set app root when initializing a new DreamApplication.

within conf/dream.ts, you must have a call to "#set('appRoot', pathToAppRoot), i.e.


  // conf/dream.ts
  export default async (app: DreamApplication) => {
    // this should be the absolute path to the "src" folder.
    app.set('appRoot', path.join(__dirname, '..')
  }
    `
  }
}
