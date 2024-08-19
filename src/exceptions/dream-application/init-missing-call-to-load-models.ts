export default class DreamApplicationInitMissingCallToLoadModels extends Error {
  constructor() {
    super()
  }

  public get message() {
    return `
must load models when initializing a new DreamApplication.

within conf/dream.ts, you must have a call to "#load('models', pathToModels)", i.e.


  // conf/dream.ts
  export default async (app: DreamApplication) => {
    await app.load('models', path.join(__dirname, '..', 'app', 'models')
  }
    `
  }
}
