export default class ConstructorOnlyForInternalUse extends Error {
  public override get message() {
    return `Do not call \`new MyDreamModel({...})\` directly. Instead,
call \`MyDreamModel.new({...})\` or \`MyDreamModel.create({...})\``
  }
}
