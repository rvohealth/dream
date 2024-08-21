"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DreamApplicationInitMissingCallToLoadModels extends Error {
    constructor() {
        super();
    }
    get message() {
        return `
must load models when initializing a new DreamApplication.

within conf/dream.ts, you must have a call to "#load('models', pathToModels)", i.e.


  // conf/dream.ts
  export default async (app: DreamApplication) => {
    await app.load('models', path.join(__dirname, '..', 'app', 'models')
  }
    `;
    }
}
exports.default = DreamApplicationInitMissingCallToLoadModels;
