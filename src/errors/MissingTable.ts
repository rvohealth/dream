import pluralize from 'pluralize-esm'
import Dream from '../Dream'
import snakeify from '../helpers/snakeify'

export default class MissingTable extends Error {
  public dreamClass: typeof Dream

  constructor(dreamClass: typeof Dream) {
    super()
    this.dreamClass = dreamClass
  }

  public get message() {
    return `
Missing table definition on the following dream class:
Dream class: ${this.dreamClass.name}

Try something like this in your ${this.dreamClass.name}'s table getter:

class ${this.dreamClass.name} {
  ...
  public get table() {
    return '${pluralize(snakeify(this.dreamClass.name))}'
  }
}
    `
  }
}
