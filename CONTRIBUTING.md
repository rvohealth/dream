## How to contribute to Dream ORM

### Install `nodenv`

In order to use dream, you must be using node = 18.15.0. A `.node-version` file exists at the root of this repo to flag the node version, but it will not work unless `nodenv` has been correctly installed on your machine.

### Install postgres and mysql

Homebrew example:

```sh
brew install postgresql
# follow post-install instructions
brew install mysql
# follow post-install instructions
```

### Add ENV files

make sure to add the following files to the root of the project:

```
# .env
DB_USER=<your username>
DB_NAME=dream_development
ALTERNATE_DB_NAME=dream_development_alternate
DB_PORT=5432
ALTERNATE_DB_PORT=5432
DB_HOST=localhost
REPLICA_DB_HOST=localhost
REPLICA_DB_PORT=5432

MYSQL_DB_USER=root
MYSQL_DB_PORT=3306
MYSQL_DB_NAME=dream_development_mysql
MYSQL_DB_HOST=localhost
MYSQL_DB_PASSWORD=
PRIMARY_MYSQL_DB_HOST=127.0.0.1

APP_ENCRYPTION_KEY='UHClfbB+TJDVCMXfQO/uXgZTAg/BlGJfi6YLi8T2720='
LEGACY_APP_ENCRYPTION_KEY='UHClfbB+TJDVCMXfQO/uXgZTAg/BlGJfi6YLi8T2720='
TZ=UTC
```

```
# .env.test
DB_USER=<your username>
DB_NAME=dream_test
ALTERNATE_DB_NAME=dream_test_alternate
DB_PORT=5432
ALTERNATE_DB_PORT=5432
DB_HOST=localhost
REPLICA_DB_HOST=localhost
REPLICA_DB_PORT=5432

MYSQL_DB_USER=root
MYSQL_DB_PORT=3306
MYSQL_DB_NAME=dream_test_mysql
MYSQL_DB_HOST=localhost
MYSQL_DB_PASSWORD=
PRIMARY_MYSQL_DB_HOST=127.0.0.1

APP_ENCRYPTION_KEY='UHClfbB+TJDVCMXfQO/uXgZTAg/BlGJfi6YLi8T2720='
LEGACY_APP_ENCRYPTION_KEY='UHClfbB+TJDVCMXfQO/uXgZTAg/BlGJfi6YLi8T2720='
TZ=UTC
```

### Build db and sync schema

```bash
yarn install
NODE_ENV=development yarn dream db:create
NODE_ENV=development yarn dream db:migrate
yarn dream db:create
yarn dream db:migrate
```

#### Generating type docs

```bash
# first, you will need to update package.json version, in order to keep
# docs generated on a per-version basis
yarn build:docs
```

#### CLI

```bash
yarn build
# builds source code using the typescript compiler, sending it into the dist folder

yarn spec
# runs core development specs (same as yarn dream spec)

SQL_LOGGING=1 yarn spec
# runs core development specs, printing SQL queries

yarn console
# opens console, providing access to the internal test-app/app/models folder (same as yarn dream console)

yarn dream
# opens a small node cli program, which right now only provides commands for generating dreams and migrations,
# but which will likely eventually encompass all of the above commands

yarn dream db:migrate
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

yarn dream sync:schema
# runs the same sync script mentioned above, but for core development. You would run this if you were trying to
# sync for the test-app, which is used to seed the local tests and provide models for use within the console.
# Similar to above, a local copy of schema is kept within test-app/types/dream.ts, which is updated each time you
# run yarn core:db:migrate.

yarn dream sync:associations
# runs a script which analyzes your models, building a mapping of the associations into typescript interfaces
# which will assist in providing enforced type completion mechanisms at the code composition level. This must be
# this is used by the underlying `load` method, as well as `preload` and `joins` methods within the query
# building layer. This is all copied to the file specified in the `.dream.yml#associations_path`. This is also automatically done whenever you run migrations, run specs, or open a console

yarn dream sync:associations
# same as above, but copies the associations.ts file to test-app/db/associations.ts

yarn dream db:drop
# drops the db for either the core app or a consuming app (which is why there is no "core:db:drop" variant)

yarn dream db:create
# creates the db for either the core app or a consuming app (which is why there is no "core:db:create" variant)
```

#### **Did you find a bug?**

- **Do not open up a GitHub issue if the bug is a security vulnerability
  in Dream ORM**, and instead to refer to our [security policy](https://github.com/rvohealth/dream/SECURITY.md).
- **Search for an existing Issue on our [Issues page](https://github.com/rvohealth/dream/issues)**, since it is likely your issue was asked by someone else.
- **If you could not find your existing issue, please open [a new one](https://github.com/rvohealth/dream/issues/new)**. Be sure to include relevant information, including:
  - Package version
  - Node version
  - Postgres version
  - TypeScript version
  - Description of the problem
  - Replicable code example

#### **Patching a bug?**

- Open [a new pull request on Github](https://github.com/rvohealth/dream/pulls) with the patch.
- Ensure the PR description describes both the problem and solution, with an issue number attached (if relevant).

Thanks so much!

The Dream team
