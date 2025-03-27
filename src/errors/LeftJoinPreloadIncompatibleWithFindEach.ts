export default class LeftJoinPreloadIncompatibleWithFindEach extends Error {
  public override get message() {
    // An unknown and irregular number of records will be returned for each base
    // model, so we cannot establish the correct pagination points to flesh out
    // all the associations (if we broke at a certain number of records, there
    // could be other records for that association in the next pagination of results)
    return `LeftJoinPreload is incompabile with findEach`
  }
}
