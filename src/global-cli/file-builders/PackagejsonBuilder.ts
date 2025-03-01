export default class PackagejsonBuilder {
  public static async buildAPI() {
    const packagejson = await import('../../../boilerplate/package.json')
    return JSON.stringify(packagejson, null, 2)
  }
}
