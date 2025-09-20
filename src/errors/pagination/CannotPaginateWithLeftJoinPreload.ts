export default class CannotPaginateWithLeftJoinPreload extends Error {
  public override get message() {
    return `\
Cannot call paginate on a query which has an leftJoinPreload applied.

fix:
  remove the leftJoinPreload statement from your query
`
  }
}
