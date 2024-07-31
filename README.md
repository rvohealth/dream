# dream ORM
just a test

The dream ORM is an ORM inspired heavily by the [Ruby on Rails Active Record](https://guides.rubyonrails.org/active_record_querying.html) pattern, and was designed predominantly as a tool to help migrate PlateJoy's app ecosystem from ruby to node. In the search for a comprehensive ORM in node that maintains the depth and necessary features provided by rails, we have decided to write our own, written on a [very powerful, safely type-guarded query builder called kysely](https://github.com/kysely-org/kysely).

Using this library as our query building engine, we have stacked a comprehensive ORM layer on top to provide a rich set of features, of which will be predominantly used in the psychic web framework, also being developed and inspired by the Ruby on Rails web framework.

## Getting started

### Install `nodenv`

In order to use dream, you must be using node = 18.15.0. A `.node-version` file exists at the root of this repo to flag the node version, but it will not work unless `nodenv` has been correctly installed on your machine.

### Add ENV files

make sure to add the following files to the root of the project:

```
# .env
DREAM_CORE_DEVELOPMENT=1
DB_USER=YOUR_PG_USERNAME
DB_NAME=dream_core_dev
DB_PORT=5432
DB_HOST=localhost
```

```
# .env.test
DREAM_CORE_DEVELOPMENT=1
DB_USER=YOUR_PG_USERNAME
DB_NAME=dream_core_test
DB_PORT=5432
DB_HOST=localhost
```

### Build db and sync schema

```bash
yarn install
NODE_ENV=development yarn dreamcore db:create
NODE_ENV=development yarn dreamcore db:migrate
NODE_ENV=test yarn dreamcore db:create
NODE_ENV=test yarn dreamcore db:migrate
```

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
  @BeforeCreate()
  public setDefaultContent() {
    if (!this.content) this.content = 'default content'
  }

  @AfterCreate()
  public conditionallyChangeContentOnCreate() {
    if (this.content === 'change me after create') this.content = 'changed after create'
  }

  @AfterUpdate()
  public conditionallyChangeContentOnUpdate() {
    if (this.content === 'change me after update') this.content = 'changed after update'
  }

  @AfterSave()
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
  @Validates('contains', '@')
  @Validates('presence')
  public email: string

  @Validates('length', { min: 4, max: 18 })
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
  @HasMany('compositions', () => Composition)
  public compositions: Composition[]

  @HasOne('compositions', () => Composition)
  public mainComposition: Composition

  @HasMany('composition_assets', () => CompositionAsset, {
    through: 'compositions',
  })
  public compositionAssets: CompositionAsset[]
}

// models/composition.ts
export default class Composition extends Dream {
  ...
  @BelongsTo('users', () => User)
  public user: User
}

// models/composition-asset.ts
export default class CompositionAsset extends Dream {
  ...
  @BelongsTo('compositions', () => Composition)
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
  @Scope()
  public static withFunnyName(query: Query<User>) {
    return query.where({ name: 'Chalupas jr' })
  }

  // this will always fire whenever queries are run against the model
  @Scope({ default: true })
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
# Similar to above, a local copy of schema is kept within test-app/db/schema.ts, which is updated each time you
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
import { createGinIndex, createExtension } from '@rvohealth/dream'

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
import { ops } from '@rvohealth/dream'

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
const petIds = await User.pluckThrough('pets', { name: ops.similarity('fido') }, ['pets.id'])
const numUpdatedRecords = await User.where({ name: ops.similarity('steeven hawkins') }).update({
  name: 'Stephen Hawking',
})
const users = await User.joins('pets', { name: ops.similarity('fido') }).all()

const user = await User.first()
const pets = await user
  .associationQuery('pets')
  .where({ name: ops.similarity('fido') })
  .all()
```

### Contributing

Though the spec framework isn't entirely comprehensive, this application was built with a BDD philosophy guiding its foundation, using tests that actually excercize the ORM from front to back, rather than relying on lot's of stubbing of internal modules.

Though the specs are not technically unit tests in the traditional sense, they are all located under `spec/unit`, and resemble unit tests in their file structure, since there is generally a file for each method on a class. If you are contributing to this project, it will probably in the form of either adding or augmenting the functionality of existing methods, so it should be relatively easy to jump in and not make a mess. If you are adding a new method, you should be adding a new file for it. If it is new behavior on an existing method, you can add context blocks within that method spec file to expand on the behavior of that method. Static and instance methods with the same name should be in the same file, but contextualized differently, though this should rarely happen.

I am not writing tests for internal functions for the most part, though if you find yourself writing something particularly complex, feel free to find a home in the `spec/unit` folder somewhere for it (probably in the `spec/unit/helpers` folder, since that is where I will put specs for helpers I have written when I feel the need to test them).

In terms of setup, you will need to run a few commands to get the environment set up. The commands are the same as those used when you are developing in a real dream app, but you have to pass the `--core` suffix to get the correct behavior. After installing dream on your machine, you will need to first set up a .env and .env.test file (same as in a real dream app), and you will need to make sure to add an extra flag called `DREAM_CORE_DEVELOPMENT`, setting it to `1`.

```
DREAM_CORE_DEVELOPMENT=1
DB_USER=YOUR_LOCAL_DB_USERNAME
DB_NAME=dream_core_dev
DB_PORT=5432
DB_HOST=localhost
```

Once done, you can run the following commands to get up and running:

```bash
psy db:create --core
NODE_ENV=test psy db:create --core

psy db:migrate --core
NODE_ENV=test psy db:migrate --core
```

#### Generating type docs:

```bash
# first, you will need to update package.json version, in order to keep
# docs generated on a per-version basis
yarn build:docs
```

#### Hidden gotchas

- STI descendants of the same root model that define the same association must define that association identically if they are used in joins, preload, or load. For example, the following will not work properly:

```ts
@STI(A)
class B extends A {
  @HasMany(() => X)
  public xx: X[]
}

@STI(A)
class C extends A {
  @HasMany(() => X, { where: { something: true } })
  public xx: X[]
}

class Z extends Dream {
  @HasMany(() => A)
  public aa: A[]
}

// this will not work as expected because the HasMany(() => X) are defined differently
await z.load({ aa: 'xx' }).execute()
```
