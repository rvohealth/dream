import * as c from 'colorette'

export default function welcomeMessage(appName: string) {
  return `
  ${c.green(c.bold(c.italic(`Welcome to Dream! \ncd into ${c.magentaBright(appName)} to get started`)))}

  ${c.magenta(`to create a database,`)}
  ${c.magenta(`$ NODE_ENV=development yarn dream db:create`)}
  ${c.magenta(`$ NODE_ENV=test yarn dream db:create`)}

  ${c.magentaBright(`to migrate a database,`)}
  ${c.magentaBright(`$ NODE_ENV=development yarn dream db:migrate`)}
  ${c.magentaBright(`$ NODE_ENV=test yarn dream db:migrate`)}

  ${c.redBright(`to rollback a database,`)}
  ${c.redBright(`$ NODE_ENV=development yarn dream db:rollback`)}
  ${c.redBright(`$ NODE_ENV=test yarn dream db:rollback --step=1`)}

  ${c.blueBright(`to drop a database,`)}
  ${c.blueBright(`$ NODE_ENV=development yarn dream db:drop`)}
  ${c.blueBright(`$ NODE_ENV=test yarn dream db:drop`)}

  ${c.green(`to create a resource (model, migration, serializer, and controller)`)}
  ${c.green(
    `$ yarn dream g:resource api/v1/users user organization:belongs_to favorites:enum:favorite_foods:Chalupas,Other`
  )}

  # NOTE: doing it this way, you will still need to
  # plug the routes manually in your api/src/app/conf/routes.ts file

  ${c.greenBright(`to create a model`)}
  ${c.greenBright(`$ yarn dream g:model user organization:belongs_to likes_chalupas:boolean some_id:uuid`)}

  ${c.yellow(`to create a migration`)}
  ${c.yellow(`$ yarn dream g:migration create-users`)}

  ${c.magentaBright(`to run unit tests,`)}
  ${c.magentaBright(`$ yarn dream uspec`)}

  # NOTE: before you get started, be sure to visit your ${c.magenta('.env')} and ${c.magenta('.env.test')}
  # files and make sure they have database credentials set correctly.
  # you can see conf/dream.ts to see how those credentials are used.
    `
}
