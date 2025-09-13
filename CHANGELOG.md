## 1.10.0

- bump kysely
- paginate includes default ordering on id
- cli command to ensure migrations have been run prior to running specs
- fix ability to sync when type files don't reflect models
- leverage Map instead of an object so don't need to prefix numeric keys with underscore to prevent them from being sorted by numeric value rather than by the order in which they were added to the map
- renameTable migration helper
- the key function passed to `sortBy` may now also return a DateTime, a CalendarDate, or a bigint
- fix `sort` on bigint arrays
- `percent` function

## 1.9.4

- if `required: false`, leave the property undefined rather than rendering as `null`

## 1.9.3

- serializer builder attribute option types allow `required: false`; this will be used by Psychic to omit attributes from the required array in OpenaAPI

## 1.9.2

- allow null for ops argument to a where clause on a datetime or date column

## 1.9.1

- fix where clause range types to allow mixing of CalendarDate and DateTime between start and end of range
- DateTime and CalendarDate may be used in ops when comparing against a date or datetime column

## 1.9.0

Fix broken param safe type columns so that:

1. polymorphic type fields are excluded from param safe types
2. association names are excluded

Bumping minor, since it could introduce breaking changes for those reliant on previous param safe behavior.

## 1.8.0

- throw ColumnOverflow when saving too long a string / number to a database column
- make all of these errors extend the same error so Psychic can check a single error type when deciding to return 400

## 1.7.3

- remove unnecessary token, now that we are open-sourced

## 1.7.2

- fix issue causing generators to generate invalid uuid primary keys

## 1.7.1

- fix error when file without default export exists in the models directory hierarchy

## 1.7.0

- Remove `Dream#isDreamInstance` and `DreamSerializerBuilder/ObjectSerializerBuilder#isSerializer`
- Export `MissingSerializersDefinition`

## 1.6.0

- Move sanitization to Psychic so it can sanitize to real unicode representations

## 1.5.2

- Don't require `openapi` for virtual attributes
- Fix Sortable with null value in scope column
- Enable sanitization of serialized attributes
- Enable `<association>.<column>: null` where statements even when the column can't be null so that queries can be constructed to locate models that don't have a particular association

## 1.5.1

Add `DreamMigrationHelpers.newTransaction()` to support explicitly starting a new transaction within a migration.

## 1.5.0

- add support for multiple database connections in a single dream application. To take advantage of this new feature, you can do the following:

1. Add a new connection configuration to your conf/dream.ts file, providing it an explicit alternate connection name as the second argument, like so:

```ts
dreamApp.set('db', 'myAlternateConnection', {
  primary: {
    user: AppEnv.string('DB_USER'),
    password: AppEnv.string('DB_PASSWORD', { optional: !AppEnv.isProduction }),
    host: AppEnv.string('DB_HOST', { optional: true }),
    name: AppEnv.string('DB_NAME_2', { optional: true }),
    port: AppEnv.integer('DB_PORT_2', { optional: true }),
    useSsl: false,
  },
})
```

Be sure to add any new environment variables to your .env and .env.test files.

2. Run sync

```sh
yarn psy sync
```

3. add a new application model for your new connection, naming it the name of your connection, pascalized, with the string `ApplicationModel` at the end, like so:

```ts
// app/models/MyAlternateConnectionApplicationModel.ts

import Dream from '../../../src/Dream.js'
import { DBClass } from '../../types/db.alternateConnection.js'
import { connectionTypeConfig, schema } from '../../types/dream.alternateConnection.js'
import { globalTypeConfig } from '../../types/dream.globals.js'

export default class MyAlternateConnectionApplicationModel extends Dream {
  declare public DB: DBClass

  public override get connectionName() {
    return 'alternateConnection' as const
  }

  public override get schema(): any {
    return schema
  }

  public override get connectionTypeConfig() {
    return connectionTypeConfig
  }

  public override get globalTypeConfig() {
    return globalTypeConfig
  }
}
```

4. Now you can proceed to generate a model for your new connection, like so:

```sh
yarn psy g:model MyNewModel someField:text --connection-name=myAlternateConnection
```

Dream will automatically read the connectionName and use it to derive the `MyAlternateConnectionApplicationModel` automatically, though if this isn't correct, you will need to manually adjust it.

5. Alternate db engine support

If you would like to use an alternate db engine, this is also now supported. To do this, you will need to provide a query driver class that extends one of our base query driver classes. As an example, I recommend you take a look at the `MysqlQueryDriver.ts` file housed within the test-app folder of this repo. This class is not ready for production use, but is a good jumping off point for those interested in supporting a different query driver for dream.

To utilize this feature, simply provide a different query driver class in your db connection config, like so:

```ts
// conf/dream.ts

  app.set('db', {
    queryDriverClass: MyCustomQueryDriverClass,
    ...
  })
```

## 1.4.2

- add ability to set custom import extension, which will be used when generating new files for your application

## 1.4.1

- cache Dream app earlier in the initialization sequence

## 1.4.0

- fix `preloadFor` infinite loop when serializers have circular references

- generated STI base serializer updated to only include the single type of the particular STI child in the OpenAPI shape for that child

- change `primaryKeyValue` from a getter to a method so it can return the correct type even when `primaryKey` has been overridden on a particular Dream model

- remove `IdType`, an unnecessary abstraction that caused type inconsistencies

- explicitly handle bigint from the database as string

## 1.3.3

- make `referenceTypeString` public

## 1.3.2

- restore aliasing in preload/load queries

## 1.3.1

- throw NotNullViolation when Postgres throws a not null violation

- throw CheckViolation when Postgres throws a check violation

## 1.3.0

- sti-child generator includes check constraint instead of not-null since the column should only be not-null for that STI child (or modified by hand to accommodate more than one STI child)

- add `Dream#hasAssociation`

- fix preloading associations on other side of a polyorphic belongs-to association so that we don't set an association on a dream model that doesn't define that association

- fix preloading association on the other side of a polymorphic belongs-to since the same association name may be defined differently on different models. For example, taskable may be a Chore or a Workout, both of which have an `images` association, but `images` goes through ChoreImage on Chore and through WorkoutImage on Workout

- fix preloadFor when a rendersOne/Many renders a polymorphic belongs-to (was only preloading serializer associations for one of the polymorphically associated models)

- fix preloadFor when an explicit serializer option is provided to a rendersOne/Many

## 1.2.1

- Throw DataTypeColumnTypeMismatch when Postgres throws an error attempting to save to a column with a value that can't be cast to the column type.

## 1.2.0

- Add Dream.lookup, enabling devs to tap into the IOC provided by dream to dodge circular import issues

## 1.1.2

- CliFileWriter does not raise error if the file we are writing is not in the file system yet.

## 1.1.1

- Add fs.writeFile options as third argument to CliFileWriter.write, enabling psychic to provide custom flags when writing openapi.json files.

## 1.1.0

- Remove support for preloadThroughColumns. They were broken, fixing them would be overly complex, and the same effect can be obtained using flatten on a serializer rendersOne

## 1.0.6

- Fix joining after a through a polymorphic BelongsTo
  association.

- Improve join implementation

- Disable leftJoinPreload preloadThroughColumns since it doesn't actually work on through associations that resolve to a source that doesn't match the association name (and we were unnecessarily including columns in the leftJoinPreload statement even when there was no `preloadThroughColumns`, thereby bloating the queries unnecessarily)

## 1.0.5

- Support HasOne/Many through polymorphic BelongsTo (trick is that it uses the associated model from the HasOne/Many to limit the BelongsTo to a single associated class / table)

- Fix HasOne/Many through source type

- sync process is now fail-safe, leveraging a utility which caches old copies of files before writing to them. If an exception is thrown at any point during the process, dream will revert all files written using the new `CliFileWriter` class

## 1.0.4

- properly exclude type from `DreamParamSafeColumnNames`

## 1.0.3

- exclude type from `DreamParamSafeColumnNames`

## 1.0.2

- stop computing foreign keys in schema builder when building schema for through associations

## 1.0.1

- [bug] fix preloading STI model via polymporhic association (polymorphic type was being altered to the STI child rather than left as the STI base)
