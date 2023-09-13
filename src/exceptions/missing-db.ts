export default class MissingDB extends Error {
  constructor() {
    super()
  }

  public get message() {
    return `
Missing DB definition on the ApplicationModel of your app
    `
  }
}
