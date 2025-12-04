Dream is a typescript-driven, esm-first ORM built on top of [kysely](http://kysely.dev). It is built to operate within the [Psychic web framework](https://psychicframework.com/docs/intro), but can be brought into other projects and used without the encapsulating framework (though this is theoretical, and we do not encourage it at this time). It is actively being developed to support production-grade applications in use within the [RVOHealth organization](https://www.rvohealth.com), who has kindly sponsored the continued development of this ORM, as well as the Psychic web framework as a whole.

Documentation: [https://psychicframework.com/docs/intro](https://psychicframework.com/docs/intro)
Psychic web framework github: [https://github.com/rvohealth/psychic](https://github.com/rvohealth/psychic)

## Features

The dream ORM features:

- static query building engine

```ts
const records = await User.where({ email: 'fred@fred' }).all()
// User[]

const user = await User.where({ email: 'fred@fred' }).first()
const user = await User.where({ email: 'fred@fred' }).last()
// User | null

const user = await User.where({ email: ops.like('%fred@%') })
  .order('id', 'desc')
  .limit(3)
  .all()

// User[]
```

- model hooks
  - before create
  - before update
  - before delete
  - before save
  - after create
  - after update
  - after delete
  - after save

```ts
// models/composition.ts

class Composition {
  ...
  @deco.BeforeCreate()
  public setDefaultContent() {
    if (!this.content) this.content = 'default content'
  }

  @deco.AfterCreate()
  public conditionallyChangeContentOnCreate() {
    if (this.content === 'change me after create') this.content = 'changed after create'
  }

  @deco.AfterUpdate()
  public conditionallyChangeContentOnUpdate() {
    if (this.content === 'change me after update') this.content = 'changed after update'
  }

  @deco.AfterSave()
  public conditionallyChangeContentOnSave() {
    if (this.content === 'change me after save') this.content = 'changed after save'
  }
  ...
}
```

- validations
  - presence
  - length{min, max}
  - contains{string | regex}

```ts
export default class User extends Dream {
  ...
  @deco.Validates('contains', '@')
  @deco.Validates('presence')
  public email: string

  @deco.Validates('length', { min: 4, max: 18 })
  public password: string
  ...
}
```

- associations

  - belongs to
  - has one
  - has many
  - has one through
  - has many through
  - has one through (nested indefinitely)
  - has many through (nested indefinitely)

```ts
// models/user.ts
class User {
  ...
  @deco.HasMany('Composition')
  public compositions: Composition[]

  @deco.HasOne('Composition')
  public mainComposition: Composition

  @deco.HasMany('CompositionAsset', {
    through: 'compositions',
  })
  public compositionAssets: CompositionAsset[]
}

// models/composition.ts
export default class Composition extends Dream {
  ...
  @deco.BelongsTo('User')
  public user: User
}

// models/composition-asset.ts
export default class CompositionAsset extends Dream {
  ...
  @deco.BelongsTo('Composition')
  public composition: Composition
  ...
}


```

- scopes

  - named
  - default

- single table inheritance

```ts
class User {
  @deco.Scope()
  public static withFunnyName(query: Query<User>) {
    return query.where({ name: 'Chalupas jr' })
  }

  // this will always fire whenever queries are run against the model
  @deco.Scope({ default: true })
  public static hideDeleted(query: Query<User>) {
    return query.where({ deleted_at: null })
  }
}

User.scope('withFunnyName')
// will only return records with the name "Chalupas jr"
```

### REPL

the repl will open a console, exposing access to the test app models that are built into the framework.
this test app is used to run all of our assertions, and is meant to be replaced by an actual app consuming this ORM.

to get into the console, type:

```bash
pnpm console
```

Once inside the repl, you are able to access all the models within the test app. All the classes are automagically imported.

```ts
const user = await User.create({ email: 'hello@there', password: 'howyadoin' })
user.email = 'fred@flinstone'
await user.save()
```

### Specs

Running specs is very easy, not much to explain here.

```
pnpm spec
```

We are using jest under the hood, and have a plugin enabled called `jest-plugin-context`, which allows us to branch specs out using the `context` function in place of `describe`, like so:

```ts
describe('Dream#pluck', () => {
  let user1: User
  let user2: User
  beforeEach(async () => {
    user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
  })

  it('plucks the specified attributes and returns them as raw data', async () => {
    const records = await User.pluck('id')
    expect(records).toEqual([user1.id, user2.id])
  })

  context('with multiple fields', () => {
    it('should return multi-dimensional array', async () => {
      const records = await User.order('id').pluck('id', 'createdAt')
      expect(records).toEqual([
        [user1.id, user1.created_at],
        [user2.id, user2.created_at],
      ])
    })
  })
})
```

### Similarity matching

Dream provides a similarity searching library out of the box which allows you to implement fuzzy-searching in your app. To use it, first write a migration.

```bash
pnpm psy g:migration add_fuzzy_search_to_users
```

Open the generated migration, create the pg_trgm extension and create a gin index for a field on your model

```ts
import { Kysely, sql } from 'kysely'
import { createGinIndex, createExtension } from '@rvoh/dream'

export async function up(db: Kysely<any>): Promise<void> {
  // this only needs to be run once per db
  await createExtension('pg_trgm', db)

  // this is not necessary, but it will dramatically improve the search
  // speed once your db has enough records for it to matter
  await createGinIndex('users', 'name', 'users_name_gin_index', db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('users_name_gin_index')
}
```

Once done, run migrations

```bash
NODE_ENV=development pnpm psy db:migrate
```

Now you can take full advantage of pg_trgm using the dream adapters!

```ts
import { ops } from '@rvoh/dream'

// applies a score match of 0.3
const users = await User.where({ name: ops.similarity('steeven hawkins') }).all()

// applies a score match of 0.5
const users = await User.where({ name: ops.wordSimilarity('steeven hawkins') }).all()

// applies a score match of 0.6
const users = await User.where({ name: ops.strictWordSimilarity('steeven hawkins') }).all()

// applies a score match of 0.2
const users = await User.where({ name: ops.similarity('steeven hawkins', { score: 0.2 }) }).all()

// this will also work for plucking, updating, joining, and aggregate functions like min, max and count
const userIds = await User.where({ name: ops.similarity('steeven hawkins') }).pluck('id')
const min = await User.where({ name: ops.similarity('steeven hawkins') }).min('id')
const max = await User.where({ name: ops.similarity('steeven hawkins') }).max('id')
const count = await User.where({ name: ops.similarity('steeven hawkins') }).count()
const petIds = await User.innerJoin('pets', { name: ops.similarity('fido') }).pluck('pets.id')
const numUpdatedRecords = await User.where({ name: ops.similarity('steeven hawkins') }).update({
  name: 'Stephen Hawking',
})
const users = await User.innerJoin('pets', { name: ops.similarity('fido') }).all()

const user = await User.first()
const pets = await user
  .associationQuery('pets')
  .where({ name: ops.similarity('fido') })
  .all()
```

## Questions?

- **Ask them on [Stack Overflow](https://stackoverflow.com)**, using the `[dream]` tag.

Dream is an open source library, so we encourage you to actively contribute. Visit our [Contributing](https://github.com/rvohealth/dream/CONTRIBUTING.md) guide to learn more about the processes we use for submitting pull requests or issues.

Are you trying to report a possible security vulnerability? Visit our [Security Policy](https://github.com/rvohealth/dream/SECURITY.md) for guidelines about how to proceed.
