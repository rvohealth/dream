export default class DreamAppInitMissingCallToLoadModels extends Error {
  public override get message() {
    return `
must load models when initializing a new DreamApp.

within conf/dream.ts, you must have a call to "#load('models', pathToModels)", i.e.


  // conf/dream.ts
  export default async (app: DreamApp) => {
    await app.load('models', path.join(__dirname, '..', 'app', 'models')
  }
    `
  }
}
