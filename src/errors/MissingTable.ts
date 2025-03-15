import pluralize from 'pluralize-esm'
import Dream from '../Dream.js.js'
import snakeify from '../helpers/snakeify.js.js'

export default class MissingTable extends Error {
  public dreamClass: typeof Dream

  constructor(dreamClass: typeof Dream) {
    super()
    this.dreamClass = dreamClass
  }

  public get message() {
    return `
Missing table definition on the following dream class:
Dream class: ${this.dreamClass.sanitizedName}

Try something like this in your ${this.dreamClass.sanitizedName}'s table getter:

class ${this.dreamClass.sanitizedName} {
  ...
  public get table() {
    return '${pluralize(snakeify(this.dreamClass.sanitizedName))}'
  }
}
    `
  }
}
