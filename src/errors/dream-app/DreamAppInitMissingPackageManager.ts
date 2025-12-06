export default class DreamAppInitMissingPackageManager extends Error {
  constructor() {
    super()
  }

  public override get message() {
    return `
must set packageManager when initializing a new DreamApp.

within conf/app.ts or conf/dream.ts, you must have a call to "#set('packageManager', '<YOUR_CHOSEN_PACKAGE_MANAGER>')", i.e.

  // conf/app.ts
  export default async (psy: PsychicApp) => {
    psy.set('packageManager', 'pnpm')
  }

If you are in a dream-only app, this would be done in your dream conf:

  // conf/dream.ts
  export default async (dreamApp: DreamApp) => {
    dreamApp.set('packageManager', 'pnpm')
  }
    `
  }
}
