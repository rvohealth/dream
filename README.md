> ATTENTION: we are currently in the process of releasing this code to the world, as of the afternoon of March 10th, 2025. This notice will be removed, and the version of this repo will be bumped to 1.0.0, once all of the repos have been migrated to the new spaces and we can verify that it is all working. This is anticipated to take 1 day.

Dream is a typescript-driven, esm-first ORM built on top of [kysely](http://kysely.dev). It is built to operate within the [Psychic web framework](https://psychic-docs.netlify.app), but can be brought into other projects and used without the encapsulating framework (though this is theoretical, and we do not encourage it at this time). It is actively being developed to support production-grade applications in use within the [RVOHealth organization](https://www.rvohealth.com), who has kindly sponsored the continued development of this ORM, as well as the Psychic web framework as a whole.

Documentation: [https://psychic-docs.netlify.app](https://psychic-docs.netlify.app)
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
  @Deco.BeforeCreate()
  public setDefaultContent() {
    if (!this.content) this.content = 'default content'
  }

  @Deco.AfterCreate()
  public conditionallyChangeContentOnCreate() {
    if (this.content === 'change me after create') this.content = 'changed after create'
  }

  @Deco.AfterUpdate()
  public conditionallyChangeContentOnUpdate() {
    if (this.content === 'change me after update') this.content = 'changed after update'
  }

  @Deco.AfterSave()
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
  @Deco.Validates('contains', '@')
  @Deco.Validates('presence')
  public email: string

  @Deco.Validates('length', { min: 4, max: 18 })
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
  @Deco.HasMany('Composition')
  public compositions: Composition[]

  @Deco.HasOne('Composition')
  public mainComposition: Composition

  @Deco.HasMany('CompositionAsset', {
    through: 'compositions',
  })
  public compositionAssets: CompositionAsset[]
}

// models/composition.ts
export default class Composition extends Dream {
  ...
  @Deco.BelongsTo('User')
  public user: User
}

// models/composition-asset.ts
export default class CompositionAsset extends Dream {
  ...
  @Deco.BelongsTo('Composition')
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
  @Deco.Scope()
  public static withFunnyName(query: Query<User>) {
    return query.where({ name: 'Chalupas jr' })
  }

  // this will always fire whenever queries are run against the model
  @Deco.Scope({ default: true })
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
yarn console
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
yarn spec
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

### CLI

```bash
yarn build
# builds source code using the typescript compiler, sending it into the dist folder

yarn spec
# runs core development specs (same as yarn dream spec --core)

SQL_LOGGING=1 yarn spec
# runs core development specs, printing SQL queries

yarn console
# opens console, providing access to the internal test-app/app/models folder (same as yarn dream console --core)

yarn dream
# opens a small node cli program, which right now only provides commands for generating dreams and migrations,
# but which will likely eventually encompass all of the above commands

yarn dream db:migrate --core
# runs migrations for core development. Use this if you are working on the dream ORM source code.

yarn dream db:migrate
# runs migrations for an app that is consuming the dream ORM. This is meant to be run from another repo,
# e.g. within a different app's package.json:
#
#  "scripts": {
#     "db:migrate": "yarn --cwd=node_modules/dream db:migrate"
# }

yarn dream sync:schema
# syncs db schema from an app that is consuming the dream ORM. This is necessary, because in order to provide
# deep integration with kysely, we must actually introspect the schema of your app and provide it
# as part of the dream orm source code build. It essentially scans your database, examines all tables, outputs interfaces that kysely can consume, puts them into a file, and exports all the interfaces within that file.

# the sync command is already run as part of the migration sequence, so there should be no need to
# run it manually. Simply run migrations to have the syncing done for you.

# A copy of this is output to your app (though don't bother manually modifying it, since it is blown away each
# time you run migrations). It is then copied over to the node_modules/dream/src/sync folder, so that importing
# the dream orm can provide that integration for you.

# This is meant to be run from another repo,
# e.g. within a different app's package.json:
#
#  "scripts": {
#     "sync:schema": "yarn --cwd=node_modules/dream sync:schema"
# }

yarn dream sync:schema --core
# runs the same sync script mentioned above, but for core development. You would run this if you were trying to
# sync for the test-app, which is used to seed the local tests and provide models for use within the console.
# Similar to above, a local copy of schema is kept within test-app/types/dream.ts, which is updated each time you
# run yarn core:db:migrate.

yarn dream sync:associations
# runs a script which analyzes your models, building a mapping of the associations into typescript interfaces
# which will assist in providing enforced type completion mechanisms at the code composition level. This must be
# this is used by the underlying `load` method, as well as `preload` and `joins` methods within the query
# building layer. This is all copied to the file specified in the `.dream.yml#associations_path`. This is also automatically done whenever you run migrations, run specs, or open a console

yarn dream sync:associations --core
# same as above, but copies the associations.ts file to test-app/db/associations.ts

yarn dream db:drop --core
# drops the db for either the core app or a consuming app (which is why there is no "core:db:drop" variant)

yarn dream db:create --core
# creates the db for either the core app or a consuming app (which is why there is no "core:db:create" variant)
```

### Similarity matching

Dream provides a similarity searching library out of the box which allows you to implement fuzzy-searching in your app. To use it, first write a migration.

```bash
yarn psy g:migration add_fuzzy_search_to_users
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
NODE_ENV=development yarn psy db:migrate
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

#### Hidden gotchas

- STI descendants of the same root model that define the same association must define that association identically if they are used in joins, preload, or load. For example, the following will not work properly:

```ts
@STI(A)
class B extends A {
  @Deco.HasMany('X')
  public xx: X[]
}

@STI(A)
class C extends A {
  @Deco.HasMany('X', { on: { something: true } })
  public xx: X[]
}

class Z extends Dream {
  @Deco.HasMany('A')
  public aa: A[]
}

// this will not work as expected because the HasMany('X') are defined differently
await z.load({ aa: 'xx' }).execute()
```

## Questions?

- **Ask them on [Stack Overflow](https://stackoverflow.com)**, using the `[dream]` tag.

Dream is an open source library, so we encourage you to actively contribute. Visit our [Contributing](https://github.com/rvohealth/dream/CONTRIBUTING.md) guide to learn more about the processes we use for submitting pull requests or issues.

Are you trying to report a possible security vulnerability? Visit our [Security Policy](https://github.com/rvohealth/dream/SECURITY.md) for guidelines about how to proceed.
