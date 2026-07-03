import Dream from '../Dream.js'

export default class CannotNamespaceAssociationFilterToAnotherTable extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private key: string,
    private expectedAlias: string
  ) {
    super()
  }

  public override get message() {
    return `
Cannot filter on an association via a where-clause key namespaced to another table.

dream class: ${this.dreamClass.sanitizedName}
where-clause key: ${this.key}
table alias this where clause applies to: ${this.expectedAlias}

A Dream instance (or array of Dream instances) as a where-clause value resolves
an association on the model the where clause applies to, so the key may not be
namespaced to a different table. To filter a joined table by one of its
associations, pass the filter in the join's on-clause instead, e.g.:

  .innerJoin('association', { and: { myBelongsToAssociation: instances } })
`
  }
}
