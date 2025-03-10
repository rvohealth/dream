export default class ConstructorOnlyForInternalUse extends Error {
  public get message() {
    return `Do not call \`new MyDreamModel({...})\` directly. Instead,
call \`MyDreamModel.new({...})\` or \`MyDreamModel.create({...})\``
  }
}
