# dream

dream orm

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

### Up and running

```bash
yarn install
yarn db:create
yarn db:migrate
yarn sync

# note: migrations sometimes break rn, if this happens, do this to fix:
yarn sync
yarn db:migrate
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

### Contributing

Though the spec framework isn't entirely comprehensive, this application was built with a BDD philosophy guiding its foundation, using tests that actually excercize the ORM from front to back, rather than relying on lot's of stubbing of internal modules.

Though the specs are not technically unit tests in the traditional sense, they are all located under `spec/unit`, and resemble unit tests in their file structure, since there is generally a file for each method on a class. If you are contributing to this project, it will probably in the form of either adding or augmenting the functionality of existing methods, so it should be relatively easy to jump in and not make a mess. If you are adding a new method, you should be adding a new file for it. If it is new behavior on an existing method, you can add context blocks within that method spec file to expand on the behavior of that method. Static and instance methods with the same name should be in the same file, but contextualized differently, though this should rarely happen.

I am not writing tests for internal functions for the most part, though if you find yourself writing something particularly complex, feel free to find a home in the `spec/unit` folder somewhere for it (probably in the `spec/unit/helpers` folder, since that is where I will put specs for helpers I have written when I feel the need to test them).

### V1 Strike List:

general:

- <DANIEL>separate query builders from dream if possible
- <DANIEL>recursivley scan models dir
- finish building migration runner
  - DONE create
  - DONE drop
  - <HELPER>rollback
- DONE stabilize syncing behavior
- <DANIEL> fix intermittent db:migration error on frist run
- DONE add repl
- move sync to .sync
- see about moving test-app to root dir, or at least out of src folder. If not, rename to .test-app?
- <HELPER>ensure creating blank models saves to db correctly
- <OPTING OUT>camelize attributes
- allow passing of models directly as arguments, maybe?
- <DANIEL> add type guards around load method (at worst, we could generate types and spit out into sync folder)
- add boilerplate stubbing for schema and models files, since they are generated.
- updated at field should auto-update
- DONE update sync to swap luxon timestamp type for a luxon-driven type
- DONE marhsal db objects to DateTime when initializing a dream instance
- DONE ensure plucking also marshals dates to datetime
- DONE unify static methods and query builder implementations
- clean up type chaos sweep 1
- clean up type chaos sweep 2 (may need assistance at this stage depending on how much gets done in sweep 1)

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
- <HELPER>distinct
- <HELPER>having
- <DANIEL>joins
- <DANIEL>includes
- <DANIEL OR HELPER>or
- <DANIEL OR HELPER>not
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
- <HELPER>distinct
- <HELPER>having
- <DANIEL>joins
- <DANIEL>includes
- <DANIEL>or
- <DANIEL>not
- where needs complex expressions
  - DONE time ranges (.where({ created_at: { start?: Date, end?: Date, omitEnd?: true } }))
  - DONE in
  - DONE like
  - DONE ilike
  - <HELPER>is
  - <HELPER>gt
  - <HELPER>lt
  - <HELPER>match
  - <HELPER>operator (catch all for other expressions (full list commented below))
  - <HELPER>not (this one will apply a negation clause to the statement passed to it)
    // "=", "==", "!=", "<>", ">", ">=", "<", "<=", "in", "not in",
    // "is", "is not", "like", "not like", "match", "ilike",
    // "not ilike", "@>", "<@", "?", "?&", "!<", "!>",
    // "<=>", "!~", "~", "~_", "!~_", "@@", "@@@", "!!", "<->
- DONE all
- DONE first
- DONE last
- <DANIEL>add backdoor for manual access to kysely query

relations:

- DONE has one
- DONE has many
- DONE belongs to
- DONE has one through
- DONE has many through
- DONE nested has many through
- DONE nested has one through
- DONE pass custom through key
- <HELPER>has_many through belongs_to
- DONE has_one through belongs_to
- <DANIEL>belongs to polymorphic
- <DANIEL>belongs to through polymorphic
- <DANIEL>nested belongs to through polymorphic

hooks:

- DONE before create
- DONE before udpate
- DONE before save
- DONE before destroy
- DONE after create
- DONE after udpate
- DONE after save
- DONE after delete

validations:

- DONE validation engine
- DONE validates decorator
  - DONE length
  - DONE contains
  - DONE presence
  - <HELPER>numericality
  - <HELPER>uniqueness
  - <HELPER>inclusion
  - <HELPER>exclusion
  - <HELPER>format
  - <HELPER>custom validations (validatesWith?)
  - <HELPER>comparison (https://guides.rubyonrails.org/active_record_validations.html#comparison)
- <DANIEL>add type guards to validator

scopes:

- DONE default scopes
- DONE named scopes
- DONE STI

cli:

- generate migration
- generate dream

framework:

- build cli scripts to mirror dream cli commands, providing migration and repl commands
- determine if dream being a dependency of this framework, which then reaches into another app to consume is a problematic pattern, and solve for it if it is
- import server, router, and controller modules from howl and adapt to mould around dream orm
- add resource generator, tapping into underlying model generator api from dream orm
- rebuild implicit auth mechanisms in controller layer to work with dream ORM
