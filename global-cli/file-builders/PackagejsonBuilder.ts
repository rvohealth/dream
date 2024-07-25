import { NewAppCLIOptions } from '../helpers/gatherUserInput'

export default class PackagejsonBuilder {
  public static async buildAPI(userOptions: NewAppCLIOptions) {
    const packagejson = (await import('../../boilerplate/package.json')).default
    return JSON.stringify(packagejson, null, 2)
  }
}
