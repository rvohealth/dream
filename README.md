# dream ORM

The dream ORM is an ORM inspired heavily by the [Ruby on Rails Active Record](https://guides.rubyonrails.org/active_record_querying.html) pattern, and was designed predominantly as a tool to help migrate PlateJoy's app ecosystem from ruby to node. In the search for a comprehensive ORM in node that maintains the depth and necessary features provided by rails, we have decided to write our own, written on a [very powerful, safely type-guarded query builder called kysely](https://github.com/kysely-org/kysely).

Using this library as our query building engine, we have stacked a comprehensive ORM layer on top to provide a rich set of features, of which will be predominantly used in the psychic web framework, also being developed and inspired by the Ruby on Rails web framework.

## Getting started

### Add ENV files

make sure to add the following files to the root of the project:

```
# .env
CORE_DEVELOPMENT=1
DB_USER=YOUR_PG_USERNAME
DB_NAME=dream_core_dev
DB_PORT=5432
DB_HOST=localhost
```

```
# .env.test
CORE_DEVELOPMENT=1
DB_USER=YOUR_PG_USERNAME
DB_NAME=dream_core_test
DB_PORT=5432
DB_HOST=localhost
```

### Build db and sync schema

```bash
yarn install
yarn dream db:create --core
yarn dream db:migrate --core
NODE_ENV=test yarn dream db:create --core
NODE_ENV=test yarn dream db:migrate --core
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
  @Column('string')
  public email: string

  @Validates('length', { min: 4, max: 18 })
  @Column('string')
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
    throughClass: () => Composition,
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
  public static withFunnyName(query: any) {
    return query.where({ name: 'Chalupas jr' })
  }

  // this will always fire whenever queries are run against the model
  @Scope({ default: true })
  public static hideDeleted(query: any) {
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
      const records = await User.order('id').pluck('id', 'created_at')
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

yarn dream build:schema
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
#     "build:schema": "yarn --cwd=node_modules/dream build:schema"
# }

yarn dream build:schema --core
# runs the same sync script mentioned above, but for core development. You would run this if you were trying to
# sync for the test-app, which is used to seed the local tests and provide models for use within the console.
# Similar to above, a local copy of schema is kept within test-app/db/schema.ts, which is updated each time you
# run yarn core:db:migrate.

yarn dream build:associations
# runs a script which analyzes your models, building a mapping of the associations into typescript interfaces
# which will assist in providing enforced type completion mechanisms at the code composition level. This must be
# this is used by the underlying `load` method, as well as includes and joins methods within the query
# building layer. This is all copied to the file specified in the `.dream.yml#associations_path`. This is also automatically done whenever you run migrations, run specs, or open a console

yarn dream build:associations --core
# same as above, but copies the associations.ts file to test-app/db/associations.ts

yarn dream copy:boilerplate --core
# copies default templated files to sit in place of real schema files. This is generally only done on installation, since In the beginning you have no migrations and the app still needs to import something.

yarn dream db:drop --core
# drops the db for either the core app or a consuming app (which is why there is no "core:db:drop" variant)

yarn dream db:create --core
# creates the db for either the core app or a consuming app (which is why there is no "core:db:create" variant)
```

### Contributing

Though the spec framework isn't entirely comprehensive, this application was built with a BDD philosophy guiding its foundation, using tests that actually excercize the ORM from front to back, rather than relying on lot's of stubbing of internal modules.

Though the specs are not technically unit tests in the traditional sense, they are all located under `spec/unit`, and resemble unit tests in their file structure, since there is generally a file for each method on a class. If you are contributing to this project, it will probably in the form of either adding or augmenting the functionality of existing methods, so it should be relatively easy to jump in and not make a mess. If you are adding a new method, you should be adding a new file for it. If it is new behavior on an existing method, you can add context blocks within that method spec file to expand on the behavior of that method. Static and instance methods with the same name should be in the same file, but contextualized differently, though this should rarely happen.

I am not writing tests for internal functions for the most part, though if you find yourself writing something particularly complex, feel free to find a home in the `spec/unit` folder somewhere for it (probably in the `spec/unit/helpers` folder, since that is where I will put specs for helpers I have written when I feel the need to test them).

### V1 Strike List:

general:

- DANIEL separate query builders from dream if possible
- DANIEL recursivley scan models dir
- uuid support
- finish building migration runner
  - DONE create
  - DONE drop
  - HELPER rollback
- DONE stabilize syncing behavior
- DANIEL fix intermittent db:migration error on frist run
- DONE add repl
- move sync to .sync
- DONE see about moving test-app to root dir, or at least out of src folder. If not, rename to .test-app?
- HELPER ensure creating blank models saves to db correctly
- OPTING OUT camelize attributes
- allow passing of models directly as arguments, maybe?
- DONE (DANIEL) add type guards around load method (at worst, we could generate types and spit out into sync folder)
- DONE add boilerplate stubbing for schema and models files, since they are generated.
- updated at field should auto-update
- DONE update sync to swap luxon timestamp type for a luxon-driven type
- DONE marhsal db objects to DateTime when initializing a dream instance
- DONE ensure plucking also marshals dates to datetime
- DONE unify static methods and query builder implementations
- DONE add boilerplate create-dream-app repo, which is set up to play with dream orm, and make sure it works
- clean up type chaos sweep 1
- clean up type chaos sweep 2 (may need assistance at this stage depending on how much gets done in sweep 1)
- DONE replace ALREADY_AT_PROJECT_ROOT with arg passed to function with arg calledFromProjectRoot: boolean
- ensure blank arrays are removed from payloads before passing along to controllers (read up on rails practices here)

static:

- DONE find
- DONE findBy
- DONE create
- DONE where
- DONE update
- DONE destroy
- DONE destroyBy
- DONE select
- DONE pluck
- HELPER distinct
- HELPER having
- DANIEL joins
- DANIEL includes

  Post.all.includes(comments: comment*upvotes)
  SELECT * FROM posts
  SELECT _ FROM comments WHERE comments.post_id IN (SELECT id from posts)
  SELECT _ FROM comment*upvotes WHERE comments_upvotes.comment_id in (SELECT * FROM comments WHERE comments.post_id IN (SELECT id from posts))
  In actuality, we'd need to break this up into multiple selects so we don't end up selecting 100,000 IDs

  comment_map = comments.each_with_object({}) { |comment, map| map[comment.id] = map }
  comment_upvotes.each { |comment_upvote| comment_map[comment_upvote.comment_id].add_comment_upvote_to_memoized_list(comment_upvote) }

- DANIEL OR HELPER or
- DANIEL OR HELPER not
- DONE sql
- DONE first
- DONE last
- DONE count

instance:

- DONE save
- DONE update
- DONE isValid
- DONE isInvalid
- DONE isPersisted
- DONE errors
- DONE dirtyAttributes
- DONE isDirty
- DONE load

query:

- DONE where
- DONE limit
- DONE order
- DONE destroy
- DONE destroyBy
- DONE sql
- DONE select
- DONE pluck
- HELPER distinct
- HELPER having
- DANIEL joins
- DANIEL includes
- DANIEL or
- DANIEL not
- where needs complex expressions
  - DONE time ranges (.where({ created_at: { start?: Date, end?: Date, omitEnd?: true } }))
  - DONE in
  - DONE like
  - DONE ilike
  - HELPER is
  - HELPER gt
  - HELPER lt
  - HELPER match
  - HELPER operator (catch all for other expressions (full list commented below))
  - HELPER not (this one will apply a negation clause to the statement passed to it)
    // "=", "==", "!=", "<>", ">", ">=", "<", "<=", "in", "not in",
    // "is", "is not", "like", "not like", "match", "ilike",
    // "not ilike", "@>", "<@", "?", "?&", "!<", "!>",
    // "<=>", "!~", "~", "~_", "!~_", "@@", "@@@", "!!", "<->
- DONE all
- DONE first
- DONE last
- DANIEL add backdoor for manual access to kysely query

relations:

- DONE has one
- DONE has many
- DONE belongs to
- DONE has one through
- DONE has many through
- DONE nested has many through
- DONE nested has one through
- DONE pass custom through key
- HELPER has_many through belongs_to
- DONE has_one through belongs_to
- DANIEL belongs to polymorphic
- DANIEL belongs to through polymorphic
- DANIEL nested belongs to through polymorphic

hooks:

- DONE before create
- DONE before udpate
- DONE before save
- DONE before destroy
- DONE after create
- DONE after udpate
- DONE after save
- DONE after delete

- after create commit
- after udpate commit
- after save commit
- after delete commit

validations:

- DONE validation engine
- DONE validates decorator
  - DONE length
  - DONE contains
  - DONE presence
  - HELPER numericality
  - HELPER uniqueness
  - HELPER inclusion
  - HELPER exclusion
  - HELPER format
  - HELPER custom validations (validatesWith?)
  - HELPER comparison (https://guides.rubyonrails.org/active_record_validations.html#comparison)
- DANIEL add type guards to validator

scopes:

- DONE default scopes
- DONE named scopes
- DONE STI

cli:

- DONE generate migration
- DONE generate dream

framework:

- build cli scripts to mirror dream cli commands, providing migration and repl commands
- determine if dream being a dependency of this framework, which then reaches into another app to consume is a problematic pattern, and solve for it if it is
- PARTIALLY DONE import server, router, and controller modules from howl and adapt to mould around dream orm
- add resource generator, tapping into underlying model generator api from dream orm
- PARTIALLY DONE rebuild implicit auth mechanisms in controller layer to work with dream ORM
