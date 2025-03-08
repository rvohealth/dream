export default class MissingDB extends Error {
  public get message() {
    return `
Missing DB definition on the ApplicationModel of your app
    `
  }
}
