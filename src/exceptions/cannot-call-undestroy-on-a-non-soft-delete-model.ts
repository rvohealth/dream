import Dream from '../Dream'

export default class CannotCallUndestroyOnANonSoftDeleteModel extends Error {
  constructor(private dreamClass: typeof Dream) {
    super()
  }

  public get message() {
    return `
Cannot call "undestroy" on a non-SoftDelete model. Ensure that your
model has @SoftDelete applied before calling "undestroy":

@SoftDelete()
class ${this.dreamClass.name} extends ApplicationModel {
  ...
}
    `
  }
}
