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
import { dreamTypeConfig, schema } from '../../types/dream.alternateConnection.js'

export default class MyAlternateConnectionApplicationModel extends Dream {
  declare public DB: DBClass

  public override get connectionName() {
    return 'alternateConnection' as const
  }

  public override get schema(): any {
    return schema
  }

  public override get dreamTypeConfig() {
    return dreamTypeConfig
  }
}
```

4. Now you can proceed to generate a model for your new connection, like so:

```sh
yarn psy g:model MyNewModel someField:text --connection-name=myAlternateConnection
```

Dream will automatically read the connectionName and use it to derive the `MyAlternateConnectionApplicationModel` automatically, though if this isn't correct, you will need to manually adjust it.

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
