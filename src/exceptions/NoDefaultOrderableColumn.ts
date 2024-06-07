import Dream from '../dream'

export default class NoDefaultOrderableColumn extends Error {
  constructor(private dreamClass: typeof Dream) {
    super()
  }

  public get message() {
    return `
Cannot find an orderable column for the dream class:
  ${this.dreamClass.name}

When applying limit or offset to a query, you must either:
  * apply an order statement yourself
    await ${this.dreamClass.name}.order('id').limit(10).offset(3).all()

  * define a custom "defaultOrderableColumn" on your model class, like so:
    class ${this.dreamClass.name} extends ApplicationModel {
      public defaultOrderableColumn() {
        return 'customDatetimeField' as const
      }
    }

  * Be using a sequential id type in your .dream.yml file (recommended). Sequential id types include:
    - 'integer'
    - 'bigint'
    - 'bigserial'

  * be using a createdAt timestamp on your model class. By default, when using the cli to generate
    new dreams, it will automatically generate a "createdAt" timestamp. If you opt out of this
    (by removing the createdAt field from your model's table), then you can provide your own createdAt field.
    So that Dream can find your custom createdAt field, you must provide a custom getter for this field:

    class ${this.dreamClass.name} extends ApplicationModel {
      public createdAtField() {
        return 'customDatetimeField' as const
      }
    }
    `
  }
}
