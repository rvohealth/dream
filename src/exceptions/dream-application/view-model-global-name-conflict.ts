export default class ViewModelGlobalNameConflict extends Error {
  constructor(private viewModelClassName: string) {
    super()
  }

  public get message() {
    return `
Attempted to register ${this.viewModelClassName}, but something else was detected with the same
name. To fix this, make sure the class name you use for this view model is unique to your system.`
  }
}
