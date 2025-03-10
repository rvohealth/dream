## How to contribute to Dream ORM

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

## Global CLI

The global CLI is used to build a new psychic app. You can access the global cli on your machine by doing the following:

```bash
yarn dlx @rvoh/dream
```

Once installed globally, you can access the global cli like so:

```bash
dream new myapp
```

To test the global cli without publishing, you can run the following from within the psychic directory:

```bash
yarn gdreamcore new myapp
```

NOTE: doing so will create the new app in the dream folder, so once done testing remember to remove it.

For more information on how to contribute to dream, see our [official dream contributing docs](https://psychic-docs.netlify.app/docs/contributing/dream)

#### Generating type docs

```bash
# first, you will need to update package.json version, in order to keep
# docs generated on a per-version basis
yarn build:docs
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
